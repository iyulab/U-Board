import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { absoluteLinks, changelogSection, registryDigest, releaseNotes, releasePlan } from './release-image.mjs';

test('a release moves its minor line and latest onto itself', () => {
  const plan = releasePlan('0.1.0', 'abc123');
  assert.equal(plan.tag, 'v0.1.0');
  assert.equal(plan.prerelease, false);
  assert.deepEqual(plan.refs, ['ghcr.io/iyulab/u-board:0.1.0', 'ghcr.io/iyulab/u-board:0.1', 'ghcr.io/iyulab/u-board:latest']);
  assert.equal(plan.archive, 'u-board-0.1.0-linux-amd64.tar.gz');
});

test('a pre-release gets its exact tag only', () => {
  const plan = releasePlan('0.2.0-rc.1');
  assert.equal(plan.prerelease, true);
  assert.deepEqual(plan.refs, ['ghcr.io/iyulab/u-board:0.2.0-rc.1']);
});

test('refuses what is not a version', () => {
  for (const v of ['0.1', 'v0.1.0', '0.1.0.1', '', 'latest']) assert.throws(() => releasePlan(v), /is not a version/);
});

const CHANGELOG = `# Changelog

## [Unreleased]

- Not yet.

## [0.2.0] - 2026-11-01

Intro.

### Changed

- Moved.

## [0.1.0] - 2026-10-08

First.
`;

test("takes the version's changelog section", () => {
  assert.equal(changelogSection(CHANGELOG, '0.2.0'), 'Intro.\n\n### Changed\n\n- Moved.');
  assert.equal(changelogSection(CHANGELOG, '0.1.0'), 'First.');
});

test('refuses a version the changelog has no section for, or an empty one', () => {
  assert.throws(() => changelogSection(CHANGELOG, '0.3.0'), /no section for 0\.3\.0/);
  assert.throws(() => changelogSection(CHANGELOG, '0.1'), /no section for 0\.1\b/);
  assert.throws(() => changelogSection('## [0.1.0] - 2026-10-08\n\n## [0.0.9]\n', '0.1.0'), /empty/);
});

test('makes repository-relative links absolute, leaves the rest', () => {
  const base = 'https://github.com/iyulab/U-Board/blob/v0.1.0/';
  assert.equal(
    absoluteLinks('[a](docs/x.md#y) [b](https://example.com/z) [c](#here) [d](/root) [e](README.md)', base),
    `[a](${base}docs/x.md#y) [b](https://example.com/z) [c](#here) [d](/root) [e](${base}README.md)`
  );
});

test('the notes say what changed, then how to install from the registry and from the archive, at this version', () => {
  const notes = releaseNotes(releasePlan('0.1.0', 'abc123'), 'f'.repeat(64), 'See [it](docs/self-hosting.md).');
  assert.match(notes, /## Changes\n\nSee \[it\]\(https:\/\/github\.com\/iyulab\/U-Board\/blob\/v0\.1\.0\/docs\/self-hosting\.md\)\./);
  assert.match(notes, /docker pull ghcr\.io\/iyulab\/u-board:0\.1\.0/);
  assert.match(notes, /sha256sum -c u-board-0\.1\.0-linux-amd64\.tar\.gz\.sha256/);
  assert.match(notes, /docker load -i u-board-0\.1\.0-linux-amd64\.tar\.gz/);
  assert.match(notes, /blob\/v0\.1\.0\/docs\/self-hosting\.md/);
  assert.match(notes, /Built from abc123\./);
  assert.match(notes, /gh attestation verify oci:\/\/ghcr\.io\/iyulab\/u-board:0\.1\.0 --repo iyulab\/U-Board/);
  assert.match(notes, /gh attestation verify u-board-0\.1\.0-linux-amd64\.tar\.gz --repo iyulab\/U-Board/);
});

test("reads the registry's digest for the image, not another repository's", () => {
  const hex = 'a'.repeat(64);
  assert.equal(registryDigest([`other.example.com/u-board@sha256:${'b'.repeat(64)}`, `ghcr.io/iyulab/u-board@sha256:${hex}`], 'ghcr.io/iyulab/u-board'), `sha256:${hex}`);
  assert.throws(() => registryDigest([], 'ghcr.io/iyulab/u-board'), /no registry digest/);
  assert.throws(() => registryDigest(['ghcr.io/iyulab/u-board-x@sha256:' + hex], 'ghcr.io/iyulab/u-board'), /no registry digest/);
});

// The image job refuses a version without a section — after `verify` has passed. Caught here instead,
// in the commit that bumps the version.
test("the product's version has a section in CHANGELOG.md", () => {
  const { version } = JSON.parse(readFileSync(new URL('../packages/server/package.json', import.meta.url), 'utf8'));
  const changelog = readFileSync(new URL('../CHANGELOG.md', import.meta.url), 'utf8');
  assert.ok(changelogSection(changelog, version));
});
