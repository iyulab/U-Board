import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STEPS, plan } from './check.mjs';

test('runs every step, in order, when nothing is skipped', () => {
  assert.deepEqual(plan([]).run.map(s => s.name), STEPS.map(s => s.name));
  assert.deepEqual(plan([]).skipped, []);
});

test('leaves out the steps named in --skip, and says which', () => {
  const { run, skipped } = plan(['--skip=postgres,e2e']);
  assert.equal(run.some(s => s.name === 'postgres' || s.name === 'e2e'), false);
  assert.deepEqual(skipped, ['postgres', 'e2e']);
});

test('refuses a step that does not exist, rather than silently running everything', () => {
  assert.throws(() => plan(['--skip=e2ee']), /no such step: e2ee/);
  assert.throws(() => plan(['--fast']), /unknown argument/);
});

test('step names are unique', () => {
  assert.equal(new Set(STEPS.map(s => s.name)).size, STEPS.length);
});
