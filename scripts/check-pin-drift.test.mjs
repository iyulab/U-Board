import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isTrackedPackage, exceedsThreshold, classify } from './check-pin-drift.mjs';

test('isTrackedPackage matches only this umbrella\'s own sibling packages', () => {
  assert.equal(isTrackedPackage('@iyulab/u-widgets'), true);
  assert.equal(isTrackedPackage('@canvas-kit/core'), true);
  assert.equal(isTrackedPackage('@iyulab/other-lib'), true);
  assert.equal(isTrackedPackage('react'), false);
  assert.equal(isTrackedPackage('@testing-library/react'), false);
});

test('exceedsThreshold: a major version difference always exceeds', () => {
  assert.equal(exceedsThreshold('0.16.2', '1.0.0'), true);
  assert.equal(exceedsThreshold('1.2.0', '2.0.0'), true);
});

test('exceedsThreshold: a minor gap under the threshold does not exceed', () => {
  assert.equal(exceedsThreshold('0.16.2', '0.18.0'), false);
  assert.equal(exceedsThreshold('0.16.2', '0.20.9'), false); // gap of 4 minors, threshold is 5
});

test('exceedsThreshold: a minor gap at or past the threshold exceeds', () => {
  assert.equal(exceedsThreshold('0.16.2', '0.21.0'), true); // gap of 5 minors
  assert.equal(exceedsThreshold('0.16.2', '0.30.0'), true);
});

test('classify: current behind wanted is always drift, regardless of gap size', () => {
  const result = classify({ current: '0.16.1', wanted: '0.16.2', latest: '0.16.2' });
  assert.equal(result.verdict, 'drift');
  assert.match(result.reason, /npm update/);
});

test('classify: current === latest is clean', () => {
  const result = classify({ current: '0.16.2', wanted: '0.16.2', latest: '0.16.2' });
  assert.equal(result.verdict, 'clean');
});

test('classify: current === wanted but latest is a range-gated major bump exceeding threshold', () => {
  const result = classify({ current: '0.16.2', wanted: '0.16.2', latest: '1.0.0' });
  assert.equal(result.verdict, 'drift');
  assert.match(result.reason, /임계치/);
});

test('classify: current === wanted, latest outside range but within threshold — stale, not drift', () => {
  const result = classify({ current: '0.16.2', wanted: '0.16.2', latest: '0.18.0' });
  assert.equal(result.verdict, 'stale-in-range');
});
