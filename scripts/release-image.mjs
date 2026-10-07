#!/usr/bin/env node
// release-image.mjs
// Releases the product — its container image — at the version in packages/server/package.json: builds
// the image with that version on it, tags it, and writes what a GitHub Release carries for an
// installation that cannot reach a registry (the image as a `docker save` archive, its checksum, and
// the release notes). The CI `image` job runs it on main once the version has no release yet
// (.github/workflows/ci.yml); the library package (@iyulab/u-board) is versioned and published apart.
//
// Usage:
//   node scripts/release-image.mjs --plan    # print what a release of this version would publish (JSON)
//   node scripts/release-image.mjs           # build, and write the release files to release/ — nothing pushed
//   node scripts/release-image.mjs --push    # also push the image's tags to the registry

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream, createWriteStream, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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

/** What a release of `version` publishes. A pre-release (`0.2.0-rc.1`) gets its exact tag only;
 *  a release also moves `<major>.<minor>` and `latest` onto itself. */
export function releasePlan(version, revision = '') {
  const match = SEMVER.exec(version);
  if (!match) throw new Error(`"${version}" is not a version (MAJOR.MINOR.PATCH, optionally -PRERELEASE)`);
  const prerelease = match[4] !== undefined;
  const tags = prerelease ? [version] : [version, `${match[1]}.${match[2]}`, 'latest'];
  return {
    version,
    revision,
    tag: `v${version}`,
    prerelease,
    image: IMAGE,
    refs: tags.map(t => `${IMAGE}:${t}`),
    platform: PLATFORM,
    archive: `u-board-${version}-${PLATFORM.replace('/', '-')}.tar.gz`,
  };
}

/** The release's notes — how to install this version, from the registry or from the archive. */
export function releaseNotes(plan, archiveSha256) {
  const docs = `${REPOSITORY}/blob/${plan.tag}/docs/self-hosting.md`;
  return [
    `The U-Board container image, version ${plan.version} (${plan.platform}). It serves the console, the read-only share viewer and their API from one origin.`,
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

function currentPlan() {
  const { version } = JSON.parse(readFileSync('packages/server/package.json', 'utf8'));
  return releasePlan(version, output('git', ['rev-parse', 'HEAD']));
}

async function sha256(file) {
  const hash = createHash('sha256');
  await pipeline(createReadStream(file), hash);
  return hash.digest('hex');
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

async function main() {
  const args = process.argv.slice(2);
  const unknown = args.filter(a => a !== '--plan' && a !== '--push');
  if (unknown.length > 0) throw new Error(`unknown argument: ${unknown.join(' ')}`);
  const plan = currentPlan();
  if (args.includes('--plan')) {
    console.log(JSON.stringify(plan, null, 2));
    return;
  }

  console.log(`Building ${plan.refs.join(', ')} (${plan.platform}) …`);
  run('docker', [
    'build', '-f', 'packages/server/Dockerfile', '--platform', plan.platform,
    '--build-arg', `VERSION=${plan.version}`, '--build-arg', `REVISION=${plan.revision}`,
    ...plan.refs.flatMap(ref => ['-t', ref]),
    '.',
  ]);

  rmSync(OUT_DIR, { recursive: true, force: true });
  mkdirSync(OUT_DIR);
  const tar = path.join(OUT_DIR, `u-board-${plan.version}.tar`);
  const archive = path.join(OUT_DIR, plan.archive);
  // Saved under its exact tag only: loading it must not move an installation's `latest`.
  run('docker', ['save', '-o', tar, plan.refs[0]]);
  await pipeline(createReadStream(tar), createGzip(), createWriteStream(archive));
  rmSync(tar);
  const digest = await sha256(archive);
  writeFileSync(`${archive}.sha256`, `${digest}  ${plan.archive}\n`);
  writeFileSync(path.join(OUT_DIR, 'notes.md'), releaseNotes(plan, digest));
  console.log(`Wrote ${archive} (sha256 ${digest}), its checksum and notes.md.`);

  if (!args.includes('--push')) return;
  for (const ref of plan.refs) run('docker', ['push', ref]);
  if (!(await anonymouslyPullable(plan.refs[0]))) {
    // Not a failure: the image is published, but installations cannot pull it until the package is public.
    console.log(`::warning::${plan.refs[0]} was pushed but cannot be pulled without signing in — make the package public in its settings.`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(err => {
    console.error(err.message);
    process.exitCode = 1;
  });
}
