import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import {
  isSiblingPackage, minorGap, classify, staleDeferrals, readDeferrals, readWorkspacePackageNames,
} from './check-pin-drift.mjs';

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

test('same major, five or more minors past the declared range is drift; fewer is reported', () => {
  assert.equal(classify({ name: '@iyulab/u-widgets', current: '0.16.2', wanted: '0.16.2', latest: '0.21.0' }, { sibling: true, today }).verdict, 'drift');
  assert.equal(classify({ name: '@iyulab/u-widgets', current: '0.16.2', wanted: '0.16.2', latest: '0.20.9' }, { sibling: true, today }).verdict, 'info');
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
    assert.ok(typeof d.reason === 'string' && d.reason.length > 0, `${d.package}: reason required`);
    assert.match(d.reviewBy, /^\d{4}-\d{2}-\d{2}$/, `${d.package}: reviewBy must be YYYY-MM-DD`);
  }
});

test('readWorkspacePackageNames lists every package under the root workspaces', () => {
  const names = readWorkspacePackageNames(fileURLToPath(new URL('..', import.meta.url)));
  assert.ok(names.has('@iyulab/u-board'));
  assert.ok(names.has('@iyulab/u-board-server'));
  assert.ok(names.has('@iyulab/u-board-console'));
  assert.ok(names.has('@iyulab/u-board-share'));
  assert.equal(names.has('@iyulab/u-widgets'), false);
});
