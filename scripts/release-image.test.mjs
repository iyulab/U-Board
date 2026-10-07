import { test } from 'node:test';
import assert from 'node:assert/strict';
import { releaseNotes, releasePlan } from './release-image.mjs';

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

test('the notes say how to install from the registry and from the archive, at this version', () => {
  const notes = releaseNotes(releasePlan('0.1.0', 'abc123'), 'f'.repeat(64));
  assert.match(notes, /docker pull ghcr\.io\/iyulab\/u-board:0\.1\.0/);
  assert.match(notes, /sha256sum -c u-board-0\.1\.0-linux-amd64\.tar\.gz\.sha256/);
  assert.match(notes, /docker load -i u-board-0\.1\.0-linux-amd64\.tar\.gz/);
  assert.match(notes, /blob\/v0\.1\.0\/docs\/self-hosting\.md/);
  assert.match(notes, /Built from abc123\./);
});
