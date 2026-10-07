import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hostPort } from './check-image.mjs';

test('reads the host port docker gives the server', () => {
  assert.equal(hostPort('127.0.0.1:49153'), 49153);
  assert.equal(hostPort('127.0.0.1:49153\n[::1]:49153'), 49153);
  assert.throws(() => hostPort(''), /no host port/);
});
