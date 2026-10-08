import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { absoluteLinks, changelogSection, promotedTags, registryDigest, releaseNotes, releasePlan } from './release-image.mjs';

test('a release is the image under its exact tag, and the archive', () => {
  const plan = releasePlan('0.1.0', 'abc123');
  assert.equal(plan.tag, 'v0.1.0');
  assert.equal(plan.prerelease, false);
  assert.equal(plan.ref, 'ghcr.io/iyulab/u-board:0.1.0');
  assert.equal(plan.archive, 'u-board-0.1.0-linux-amd64.tar.gz');
  assert.equal(releasePlan('0.2.0-rc.1').prerelease, true);
});

test('the newest release takes its minor line and latest', () => {
  assert.deepEqual(promotedTags('0.1.0', []), ['0.1', 'latest']);
  assert.deepEqual(promotedTags('0.2.0', ['0.1.0', '0.1.1']), ['0.2', 'latest']);
  assert.deepEqual(promotedTags('1.0.0', ['0.9.9']), ['1.0', 'latest']);
});

test('a hotfix to an older line takes that line only, and never pulls latest back', () => {
  assert.deepEqual(promotedTags('0.1.2', ['0.1.0', '0.1.1', '0.2.0']), ['0.1']);
  assert.deepEqual(promotedTags('0.1.1', ['0.1.3', '0.2.0']), []);
  assert.deepEqual(promotedTags('0.10.0', ['0.9.0']), ['0.10', 'latest']); // numbers, not text
});

test('a pre-release takes no moving tag, and pre-releases do not hold one back', () => {
  assert.deepEqual(promotedTags('0.2.0-rc.1', []), []);
  assert.deepEqual(promotedTags('0.1.0', ['0.2.0-rc.1', 'not-a-version']), ['0.1', 'latest']);
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

test('makes repository-relative links absolute at the tag, leaves the rest', () => {
  const blob = 'https://github.com/iyulab/U-Board/blob/v0.1.0/';
  const raw = 'https://github.com/iyulab/U-Board/raw/v0.1.0/';
  assert.equal(
    absoluteLinks('[a](docs/x.md#y) [b](https://example.com/z) [c](#here) [d](/root) [e](README.md "Read me")', 'v0.1.0'),
    `[a](${blob}docs/x.md#y) [b](https://example.com/z) [c](#here) [d](/root) [e](${blob}README.md "Read me")`
  );
  assert.equal(absoluteLinks('![shot](docs/shot.png)', 'v0.1.0'), `![shot](${raw}docs/shot.png)`);
  assert.equal(absoluteLinks('See [the guide][g].\n\n[g]: docs/self-hosting.md\n[h]: https://example.com', 'v0.1.0'), `See [the guide][g].\n\n[g]: ${blob}docs/self-hosting.md\n[h]: https://example.com`);
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

// The library publishes from CI the same way (the `publish` job, on a version npm does not have yet),
// so its version needs its own section in packages/core/CHANGELOG.md just as much.
test("the library's version has a section in its CHANGELOG.md", () => {
  const { version } = JSON.parse(readFileSync(new URL('../packages/core/package.json', import.meta.url), 'utf8'));
  const changelog = readFileSync(new URL('../packages/core/CHANGELOG.md', import.meta.url), 'utf8');
  assert.ok(changelogSection(changelog, version));
});
