#!/usr/bin/env node
// release-image.mjs
// Releases the product — its container image — at the version in packages/server/package.json: builds
// the image with that version on it, pushes it under that exact tag, and writes what a GitHub Release
// carries for an installation that cannot reach a registry (the image as a `docker save` archive, its
// checksum, and the release notes). The CI `image` job runs it on main once the version has no release
// yet (.github/workflows/ci.yml); the library package (@iyulab/u-board) is versioned and published apart.
//
// A version's tag, once pushed, is never pushed again: a run that failed after the push (attesting,
// promoting, creating the release) is re-run on the image already in the registry, so what the
// release describes is what was first pulled under that tag.
//
// Usage:
//   node scripts/release-image.mjs --plan      # print what a release of this version would publish (JSON)
//   node scripts/release-image.mjs             # build, and write the release files to release/ — nothing pushed
//   node scripts/release-image.mjs --publish   # push the exact tag (or reuse it if already pushed), then write the files
//   node scripts/release-image.mjs --promote   # move <major>.<minor> and latest onto it, if it is the newest there

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { appendFileSync, createReadStream, createWriteStream, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { pathToFileURL } from 'node:url';
import { createGzip } from 'node:zlib';

export const IMAGE = 'ghcr.io/iyulab/u-board';
export const REPOSITORY = 'https://github.com/iyulab/U-Board';
// The platform installations run on. One archive per platform; another platform is another build.
export const PLATFORM = 'linux/amd64';
const OUT_DIR = 'release';

const SEMVER = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/;

function parseVersion(version) {
  const match = SEMVER.exec(version);
  if (!match) throw new Error(`"${version}" is not a version (MAJOR.MINOR.PATCH, optionally -PRERELEASE)`);
  return { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]), prerelease: match[4] !== undefined };
}

/** What a release of `version` publishes: the image under its exact tag (`ref`), and the archive. */
export function releasePlan(version, revision = '') {
  const { prerelease } = parseVersion(version);
  return {
    version,
    revision,
    tag: `v${version}`,
    prerelease,
    image: IMAGE,
    ref: `${IMAGE}:${version}`,
    platform: PLATFORM,
    archive: `u-board-${version}-${PLATFORM.replace('/', '-')}.tar.gz`,
  };
}

/** The moving tags `version` takes, given the versions released before it: `<major>.<minor>` when
 *  none of that line is newer, `latest` when none at all is. A pre-release takes neither, and a
 *  hotfix to an older line does not pull `latest` back to it. */
export function promotedTags(version, released) {
  const v = parseVersion(version);
  if (v.prerelease) return [];
  const others = released.filter(r => SEMVER.test(r) && !parseVersion(r).prerelease).map(parseVersion);
  const newer = o => o.major !== v.major ? o.major > v.major : o.minor !== v.minor ? o.minor > v.minor : o.patch > v.patch;
  const tags = [];
  if (!others.some(o => o.major === v.major && o.minor === v.minor && newer(o))) tags.push(`${v.major}.${v.minor}`);
  if (!others.some(newer)) tags.push('latest');
  return tags;
}

/** The body of `version`'s section in the product changelog (CHANGELOG.md) — its `###` headings
 *  sit under the notes' `## Changes` as they sat under the version. Throws when there is none: a
 *  release says what changed. */
export function changelogSection(changelog, version) {
  const lines = changelog.split(/\r?\n/);
  const heading = new RegExp(`^## \\[${version.replace(/[.+-]/g, '\\$&')}\\](\\s|$)`);
  const start = lines.findIndex(l => heading.test(l));
  if (start === -1) throw new Error(`CHANGELOG.md has no section for ${version} — add "## [${version}] - <date>" before releasing it`);
  const end = lines.findIndex((l, i) => i > start && l.startsWith('## '));
  const body = lines
    .slice(start + 1, end === -1 ? undefined : end)
    .join('\n')
    .trim();
  if (!body) throw new Error(`CHANGELOG.md's section for ${version} is empty`);
  return body;
}

// A link target that is relative to the repository root: no scheme, not an anchor, not root-relative.
const RELATIVE = String.raw`(?![a-z][a-z0-9+.-]*:|#|/)`;

/** Markdown links relative to the repository root, made absolute at `ref` (a tag) — release notes are
 *  read on the release's page, not next to the files. Images point at the raw file, so they show. */
export function absoluteLinks(markdown, ref) {
  const blob = `${REPOSITORY}/blob/${ref}/`;
  const raw = `${REPOSITORY}/raw/${ref}/`;
  return markdown
    .replace(
      new RegExp(String.raw`(!?\[[^\]]*\])\(${RELATIVE}([^)\s]+)((?:\s+"[^"]*")?)\)`, 'gi'),
      (_, label, target, title) => `${label}(${label.startsWith('!') ? raw : blob}${target}${title})`
    )
    .replace(new RegExp(String.raw`^( {0,3}\[[^\]]+\]:\s*)${RELATIVE}(\S+)`, 'gim'), (_, def, target) => `${def}${blob}${target}`);
}

/** The release's notes — what changed (the changelog's section), then how to install this version,
 *  from the registry or from the archive. */
export function releaseNotes(plan, archiveSha256, changes) {
  const docs = `${REPOSITORY}/blob/${plan.tag}/docs/self-hosting.md`;
  return [
    `The U-Board container image, version ${plan.version} (${plan.platform}). It serves the console, the read-only share viewer and their API from one origin.`,
    '',
    '## Changes',
    '',
    absoluteLinks(changes, plan.tag),
    '',
    '## Install',
    '',
    '```sh',
    `docker pull ${plan.image}:${plan.version}`,
    '```',
    '',
    `Without access to the registry, download \`${plan.archive}\` from this release, check it, and load it on the installation's host:`,
    '',
    '```sh',
    `sha256sum -c ${plan.archive}.sha256`,
    `docker load -i ${plan.archive}   # tagged ${plan.image}:${plan.version}`,
    '```',
    '',
    `SHA-256 \`${archiveSha256}\`.`,
    '',
    `Both the image and the archive carry a build provenance attestation: on a connected machine, \`gh attestation verify oci://${plan.image}:${plan.version} --repo iyulab/U-Board\` (or \`gh attestation verify ${plan.archive} --repo iyulab/U-Board\`) confirms it was built by this repository's release workflow${plan.revision ? ' from the commit below' : ''}.`,
    '',
    `Settings, backups and upgrading: [docs/self-hosting.md](${docs}). Back up before upgrading — the server upgrades its database on start.`,
    '',
    plan.revision ? `Built from ${plan.revision}.` : '',
  ]
    .join('\n')
    .trimEnd()
    .concat('\n');
}

function run(command, args) {
  const r = spawnSync(command, args, { stdio: 'inherit' });
  if (r.error) throw r.error;
  if (r.status !== 0) throw new Error(`${command} ${args[0]} failed (exit ${r.status})`);
}

function output(command, args) {
  const r = spawnSync(command, args, { encoding: 'utf8' });
  if (r.error) throw r.error;
  if (r.status !== 0) throw new Error(`${command} ${args[0]} failed (exit ${r.status}): ${r.stderr.trim()}`);
  return r.stdout.trim();
}

/** The registry digest `ref` was pushed with, or null when the registry has no such tag (or no such
 *  package yet). Asked of the GitHub Packages API, not by pulling: an anonymous or denied pull cannot
 *  tell "absent" from "private". Any other failure throws — guessing "absent" would push the tag again. */
function pushedDigest(plan) {
  const [, owner, name] = plan.image.split('/');
  const tag = plan.version;
  const r = spawnSync(
    'gh',
    ['api', '--paginate', `orgs/${owner}/packages/container/${name}/versions`, '--jq', `.[] | select(.metadata.container.tags | index("${tag}")) | .name`],
    { encoding: 'utf8' }
  );
  if (r.error) throw r.error;
  if (r.status !== 0) {
    if (/HTTP 404/.test(r.stderr)) return null;
    throw new Error(`could not tell whether ${plan.ref} was pushed: ${r.stderr.trim()}`);
  }
  return r.stdout.trim().split('\n')[0] || null;
}

function releasedVersions() {
  const releases = JSON.parse(output('gh', ['release', 'list', '--limit', '1000', '--json', 'tagName,isDraft']));
  return releases.filter(r => !r.isDraft && r.tagName.startsWith('v')).map(r => r.tagName.slice(1));
}

function setOutput(name, value) {
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
}

function currentPlan() {
  const { version } = JSON.parse(readFileSync('packages/server/package.json', 'utf8'));
  return releasePlan(version, output('git', ['rev-parse', 'HEAD']));
}

async function sha256(file) {
  const hash = createHash('sha256');
  await pipeline(createReadStream(file), hash);
  return hash.digest('hex');
}

/** The digest the registry gave `image`, from an image's `RepoDigests` (`<image>@sha256:<hex>`, one
 *  per repository it was pushed to). */
export function registryDigest(repoDigests, image) {
  const entry = repoDigests.find(d => d.startsWith(`${image}@`));
  const digest = entry?.slice(image.length + 1);
  if (!digest || !/^sha256:[0-9a-f]{64}$/.test(digest)) throw new Error(`no registry digest for ${image} in ${JSON.stringify(repoDigests)}`);
  return digest;
}

/** Whether anyone can pull `ref` without signing in — a new package on the registry starts out as
 *  its owner set it, which may be private. */
export async function anonymouslyPullable(ref) {
  const [repo, tag] = ref.replace(/^ghcr\.io\//, '').split(':');
  const tokenAnswer = await fetch(`https://ghcr.io/token?scope=repository:${repo}:pull`);
  if (!tokenAnswer.ok) return false;
  const { token } = await tokenAnswer.json();
  const manifest = await fetch(`https://ghcr.io/v2/${repo}/manifests/${tag}`, {
    method: 'HEAD',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.oci.image.index.v1+json, application/vnd.oci.image.manifest.v1+json, application/vnd.docker.distribution.manifest.v2+json',
    },
  });
  return manifest.ok;
}

function build(plan) {
  console.log(`Building ${plan.ref} (${plan.platform}) …`);
  run('docker', [
    'build', '-f', 'packages/server/Dockerfile', '--platform', plan.platform,
    '--build-arg', `VERSION=${plan.version}`, '--build-arg', `REVISION=${plan.revision}`,
    '-t', plan.ref,
    '.',
  ]);
}

/** Pushes the exact tag, or — when an earlier run of this same commit already did — pulls that image
 *  back instead of building another under the same tag. Returns its registry digest. */
function publish(plan) {
  const existing = pushedDigest(plan);
  if (existing) {
    run('docker', ['pull', `${plan.image}@${existing}`]);
    const builtFrom = output('docker', ['inspect', '--format', '{{index .Config.Labels "org.opencontainers.image.revision"}}', `${plan.image}@${existing}`]);
    // Released from another commit, the release, its tag and its attestation would all name a commit
    // that did not build the image.
    if (builtFrom !== plan.revision) {
      throw new Error(
        `${plan.ref} was pushed from ${builtFrom || 'an unknown commit'}, not this one (${plan.revision}). ` +
          `Re-run the release from that commit's workflow run, or give this commit a new version.`
      );
    }
    console.log(`${plan.ref} was pushed before from this commit (${existing}) — releasing that image, not a new build.`);
    run('docker', ['tag', `${plan.image}@${existing}`, plan.ref]);
    return existing;
  }
  build(plan);
  run('docker', ['push', plan.ref]);
  return registryDigest(JSON.parse(output('docker', ['inspect', '--format', '{{json .RepoDigests}}', plan.ref])), plan.image);
}

/** Moves `<major>.<minor>` and `latest` onto the released image, where it is the newest. The tags are
 *  pushed from the same image, so they carry its digest — and its attestation. */
function promote(plan) {
  const tags = promotedTags(plan.version, releasedVersions().filter(v => v !== plan.version));
  if (tags.length === 0) {
    console.log(`${plan.version} moves no other tag (a pre-release, or a newer version is out).`);
    return;
  }
  // The publish step hands its digest over (RELEASE_DIGEST); asking the registry again is the fallback.
  const handed = process.env.RELEASE_DIGEST;
  if (handed && !/^sha256:[0-9a-f]{64}$/.test(handed)) throw new Error(`RELEASE_DIGEST is not a digest: ${handed}`);
  const existing = handed || pushedDigest(plan);
  if (!existing) throw new Error(`${plan.ref} has not been pushed — publish it first`);
  run('docker', ['pull', `${plan.image}@${existing}`]);
  for (const tag of tags) {
    run('docker', ['tag', `${plan.image}@${existing}`, `${plan.image}:${tag}`]);
    run('docker', ['push', `${plan.image}:${tag}`]);
  }
  console.log(`Moved ${tags.join(', ')} onto ${plan.version}.`);
}

async function main() {
  const args = process.argv.slice(2);
  const modes = ['--plan', '--publish', '--promote'];
  const unknown = args.filter(a => !modes.includes(a));
  if (unknown.length > 0 || args.length > 1) throw new Error(`usage: release-image.mjs [${modes.join(' | ')}]`);
  const plan = currentPlan();
  if (args[0] === '--plan') {
    console.log(JSON.stringify(plan, null, 2));
    return;
  }
  if (args[0] === '--promote') {
    promote(plan);
    return;
  }

  // Before the build: a release without a changelog section is refused, not built.
  const changes = changelogSection(readFileSync('CHANGELOG.md', 'utf8'), plan.version);
  let digest;
  if (args[0] === '--publish') {
    digest = publish(plan);
    console.log(`${plan.ref} is ${plan.image}@${digest}`);
    // What the attestation is made for (.github/workflows/ci.yml).
    setOutput('digest', digest);
  } else {
    build(plan);
  }

  rmSync(OUT_DIR, { recursive: true, force: true });
  mkdirSync(OUT_DIR);
  const tar = path.join(OUT_DIR, `u-board-${plan.version}.tar`);
  const archive = path.join(OUT_DIR, plan.archive);
  // Saved under its exact tag only: loading it must not move an installation's `latest`.
  run('docker', ['save', '-o', tar, plan.ref]);
  await pipeline(createReadStream(tar), createGzip(), createWriteStream(archive));
  rmSync(tar);
  const archiveSha256 = await sha256(archive);
  writeFileSync(`${archive}.sha256`, `${archiveSha256}  ${plan.archive}\n`);
  writeFileSync(path.join(OUT_DIR, 'notes.md'), releaseNotes(plan, archiveSha256, changes));
  console.log(`Wrote ${archive} (sha256 ${archiveSha256}), its checksum and notes.md.`);

  if (!digest) return;
  // Advisory only: the image is published either way, but installations cannot pull it until the
  // package is public — and a failed check must not fail the release after the push.
  let pullable;
  try {
    pullable = await anonymouslyPullable(plan.ref);
  } catch (err) {
    console.log(`::warning::could not check whether ${plan.ref} can be pulled without signing in: ${err.message}`);
    return;
  }
  if (!pullable) console.log(`::warning::${plan.ref} cannot be pulled without signing in — make the package public in its settings.`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(err => {
    console.error(err.message);
    process.exitCode = 1;
  });
}
