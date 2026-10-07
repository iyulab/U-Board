import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// The product's icon is one drawing. The introduction site, the console and the share viewer are
// built and served apart, so each carries a copy in its own public folder — this keeps the copies
// from drifting apart.
const icon = path => readFileSync(new URL(`../packages/${path}/public/favicon.svg`, import.meta.url), 'utf8');

test('the console and the share viewer carry the same icon as the site', () => {
  const site = icon('site');
  assert.equal(icon('console'), site);
  assert.equal(icon('share'), site);
});
