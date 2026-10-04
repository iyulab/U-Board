import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  isSiblingPackage, minorGap, breakingLine, classify, staleDeferrals, readDeferrals, readWorkspacePackageNames,
  detectPackageManager, updateCommand, entriesFromNpm, entriesFromPnpm,
} from './check-dependency-drift.mjs';

// A throwaway repository root with the given files (path → contents).
function fixtureRoot(files) {
  const root = mkdtempSync(join(tmpdir(), 'dependency-drift-'));
  for (const [path, contents] of Object.entries(files)) {
    mkdirSync(join(root, path, '..'), { recursive: true });
    writeFileSync(join(root, path), contents);
  }
  return root;
}

const today = '2026-10-01';

test('isSiblingPackage matches only the sibling package scopes', () => {
  assert.equal(isSiblingPackage('@iyulab/u-widgets'), true);
  assert.equal(isSiblingPackage('@canvas-kit/core'), true);
  assert.equal(isSiblingPackage('react'), false);
  assert.equal(isSiblingPackage('@testing-library/react'), false);
});

test('minorGap counts minors within a major and is infinite across majors', () => {
  assert.equal(minorGap('0.16.2', '0.21.0'), 5);
  assert.equal(minorGap('4.1.0', '4.1.9'), 0);
  assert.equal(minorGap('1.2.0', '2.0.0'), Infinity);
});

test('sibling: any in-range gap is drift', () => {
  const r = classify({ name: '@iyulab/u-widgets', current: '0.16.1', wanted: '0.16.2', latest: '0.16.2' }, { sibling: true, today });
  assert.equal(r.verdict, 'drift');
  assert.match(r.reason, /npm update/);
});

test('third-party: a patch or single-minor in-range gap is reported only', () => {
  assert.equal(classify({ name: 'vite', current: '8.0.1', wanted: '8.0.4', latest: '8.0.4' }, { today }).verdict, 'info');
  assert.equal(classify({ name: 'vite', current: '8.0.1', wanted: '8.1.0', latest: '8.1.0' }, { today }).verdict, 'info');
});

test('third-party: an in-range gap of two minors is drift', () => {
  const r = classify({ name: 'vite', current: '8.0.1', wanted: '8.2.0', latest: '8.2.0' }, { today });
  assert.equal(r.verdict, 'drift');
});

test('up to date is clean', () => {
  assert.equal(classify({ name: 'vite', current: '8.2.0', wanted: '8.2.0', latest: '8.2.0' }, { today }).verdict, 'clean');
});

test('a new major without a deferral is drift', () => {
  const r = classify({ name: 'express', current: '4.22.3', wanted: '4.22.3', latest: '5.2.1' }, { today });
  assert.equal(r.verdict, 'drift');
  assert.match(r.reason, /dependency-deferrals\.json/);
});

test('an installed version ahead of the registry latest tag is not a new major', () => {
  // happens with a stale local metadata cache, or when a package moves its latest tag back
  const r = classify({ name: 'jsdom', current: '30.1.1', wanted: '30.1.1', latest: '29.1.1' }, { today });
  assert.equal(r.verdict, 'info');
  assert.doesNotMatch(r.reason, /new major/);
});

test('a new major with a live deferral is deferred', () => {
  const deferrals = [{ package: 'express', major: 5, reason: 'routing rewrite pending', reviewBy: '2026-10-15' }];
  const r = classify({ name: 'express', current: '4.22.3', wanted: '4.22.3', latest: '5.2.1' }, { deferrals, today });
  assert.equal(r.verdict, 'deferred');
  assert.match(r.reason, /routing rewrite pending/);
});

test('a deferral is valid through its review date and expires after it', () => {
  const deferrals = [{ package: 'express', major: 5, reason: 'x', reviewBy: today }];
  const entry = { name: 'express', current: '4.22.3', wanted: '4.22.3', latest: '5.2.1' };
  assert.equal(classify(entry, { deferrals, today }).verdict, 'deferred');
  const r = classify(entry, { deferrals, today: '2026-10-02' });
  assert.equal(r.verdict, 'drift');
  assert.match(r.reason, /expired/);
});

test('a deferral for one major does not excuse the next', () => {
  const deferrals = [{ package: 'express', major: 5, reason: 'x', reviewBy: '2027-01-01' }];
  const r = classify({ name: 'express', current: '4.22.3', wanted: '4.22.3', latest: '6.0.0' }, { deferrals, today });
  assert.equal(r.verdict, 'drift');
});

test('same major, five or more minors past a narrower-than-caret range is drift; fewer is reported', () => {
  // only a tilde or exact pin can leave a same-major release outside the range at 1.x and up
  assert.equal(classify({ name: 'vite', current: '8.0.2', wanted: '8.0.2', latest: '8.5.0' }, { today }).verdict, 'drift');
  assert.equal(classify({ name: 'vite', current: '8.0.2', wanted: '8.0.2', latest: '8.4.9' }, { today }).verdict, 'info');
});

test('breakingLine is the major from 1.0 on, and major.minor below it', () => {
  assert.equal(breakingLine('5.2.1'), '5');
  assert.equal(breakingLine('0.24.0'), '0.24');
  assert.equal(breakingLine('0.0.3'), '0.0');
});

test('a 0.x minor past the caret range is a breaking release: drift without a deferral, sibling or not', () => {
  // ^0.22.1 stops at 0.22.x precisely because 0.23 may break — the same adoption decision a new major is
  const sibling = classify({ name: '@iyulab/u-widgets', current: '0.22.1', wanted: '0.22.1', latest: '0.23.0' }, { sibling: true, today });
  assert.equal(sibling.verdict, 'drift');
  const thirdParty = classify({ name: 'some-lib', current: '0.4.2', wanted: '0.4.2', latest: '0.5.0' }, { today });
  assert.equal(thirdParty.verdict, 'drift');
  assert.match(thirdParty.reason, /dependency-deferrals\.json/);
});

test('a 0.x breaking release is deferred by an entry for that exact minor line only', () => {
  const deferrals = [{ package: 'some-lib', major: 0, minor: 5, reason: 'api rename pending', reviewBy: '2026-10-15' }];
  assert.equal(classify({ name: 'some-lib', current: '0.4.2', wanted: '0.4.2', latest: '0.5.1' }, { deferrals, today }).verdict, 'deferred');
  assert.equal(classify({ name: 'some-lib', current: '0.4.2', wanted: '0.4.2', latest: '0.6.0' }, { deferrals, today }).verdict, 'drift');
});

test('staleDeferrals: a 0.x line already adopted, or no longer the latest, is stale', () => {
  const deferrals = [{ package: 'some-lib', major: 0, minor: 5, reason: 'x', reviewBy: '2027-01-01' }];
  assert.equal(staleDeferrals(deferrals, [{ name: 'some-lib', current: '0.4.2', wanted: '0.4.2', latest: '0.5.1' }]).length, 0);
  assert.equal(staleDeferrals(deferrals, [{ name: 'some-lib', current: '0.5.0', wanted: '0.5.1', latest: '0.5.1' }]).length, 1);
  assert.equal(staleDeferrals(deferrals, [{ name: 'some-lib', current: '0.4.2', wanted: '0.4.2', latest: '0.6.0' }]).length, 1);
});

test('an installed 0.x version ahead of the registry latest tag is reported, not drift', () => {
  const r = classify({ name: 'some-lib', current: '0.6.0', wanted: '0.6.0', latest: '0.5.1' }, { today });
  assert.equal(r.verdict, 'info');
});

test('staleDeferrals flags entries that match nothing outdated', () => {
  const deferrals = [
    { package: 'express', major: 5, reason: 'x', reviewBy: '2027-01-01' },
    { package: 'vitest', major: 5, reason: 'x', reviewBy: '2027-01-01' },
  ];
  const entries = [{ name: 'express', current: '4.22.3', wanted: '4.22.3', latest: '5.2.1' }];
  assert.deepEqual(staleDeferrals(deferrals, entries).map(d => d.package), ['vitest']);
});

test('staleDeferrals: an entry whose major is already adopted is stale', () => {
  const deferrals = [{ package: 'express', major: 5, reason: 'x', reviewBy: '2027-01-01' }];
  const entries = [{ name: 'express', current: '5.0.0', wanted: '5.0.0', latest: '5.2.1' }];
  assert.equal(staleDeferrals(deferrals, entries).length, 1);
});

test("the repository's deferral ledger is well-formed", () => {
  for (const d of readDeferrals()) {
    assert.equal(typeof d.package, 'string');
    assert.ok(Number.isInteger(d.major), `${d.package}: major must be an integer`);
    if (d.major === 0) assert.ok(Number.isInteger(d.minor), `${d.package}: a 0.x entry names its minor line`);
    assert.ok(typeof d.reason === 'string' && d.reason.length > 0, `${d.package}: reason required`);
    assert.match(d.reviewBy, /^\d{4}-\d{2}-\d{2}$/, `${d.package}: reviewBy must be YYYY-MM-DD`);
  }
});

test('readWorkspacePackageNames lists every package under the root workspaces', () => {
  const root = fixtureRoot({
    'package.json': JSON.stringify({ workspaces: ['packages/*', 'tools'] }),
    'packages/a/package.json': JSON.stringify({ name: '@scope/a' }),
    'packages/b/package.json': JSON.stringify({ name: '@scope/b' }),
    'packages/not-a-package/README.md': '',
    'tools/package.json': JSON.stringify({ name: 'tools' }),
  });
  try {
    assert.deepEqual([...readWorkspacePackageNames(root)].sort(), ['@scope/a', '@scope/b', 'tools']);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('detectPackageManager picks pnpm by its lockfile, npm otherwise', () => {
  const pnpmRoot = fixtureRoot({ 'pnpm-lock.yaml': '', 'package.json': '{}' });
  const npmRoot = fixtureRoot({ 'package-lock.json': '{}', 'package.json': '{}' });
  try {
    assert.equal(detectPackageManager(pnpmRoot), 'pnpm');
    assert.equal(detectPackageManager(npmRoot), 'npm');
  } finally {
    rmSync(pnpmRoot, { recursive: true, force: true });
    rmSync(npmRoot, { recursive: true, force: true });
  }
});

test('the drift message names the update command of the package manager in use', () => {
  const entry = { name: 'vite', current: '8.0.1', wanted: '8.2.0', latest: '8.2.0' };
  assert.match(classify(entry, { today, update: updateCommand('pnpm') }).reason, /pnpm update -r/);
  assert.match(classify(entry, { today, update: updateCommand('npm') }).reason, /npm update/);
});

test('entriesFromNpm reads the npm outdated JSON shape, one entry per dependent, skipping workspace packages', () => {
  const entries = entriesFromNpm({
    vite: [
      { current: '8.0.1', wanted: '8.2.0', latest: '8.2.0', dependent: 'core' },
      { current: '8.0.1', wanted: '8.2.0', latest: '8.2.0', dependent: 'console' },
    ],
    react: { current: '19.0.0', wanted: '19.1.0', latest: '19.1.0', dependent: 'core' },
    '@scope/own': { current: '0.3.0', wanted: '0.3.0', latest: '0.2.0', dependent: 'server' },
  }, new Set(['@scope/own']));
  assert.deepEqual(entries.map(e => [e.name, e.dependents]), [['vite', 'core'], ['vite', 'console'], ['react', 'core']]);
  assert.deepEqual(entries[2], { name: 'react', current: '19.0.0', wanted: '19.1.0', latest: '19.1.0', dependents: 'core' });
});

test('entriesFromPnpm reads the pnpm outdated JSON shape', () => {
  const entries = entriesFromPnpm({
    vitest: { current: '4.1.11', wanted: '4.1.11', latest: '5.0.2', dependentPackages: [{ name: '@canvas-kit/core', location: 'x' }, { name: '@canvas-kit/viewer', location: 'y' }] },
  });
  assert.deepEqual(entries, [{ name: 'vitest', current: '4.1.11', wanted: '4.1.11', latest: '5.0.2', dependents: '@canvas-kit/core, @canvas-kit/viewer' }]);
});
