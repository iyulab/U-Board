#!/usr/bin/env node
// smoke-library.mjs
// Runs the published library's Node-facing entry points, as built (packages/core/dist/lib), the way a
// consumer on the oldest supported Node would: a board is validated, drawn as its picture, resolved
// through an adapter, and its connection quality described. It needs nothing but Node itself, so the CI
// job that checks the declared `engines.node` floor can run the product on that Node without also
// running the test toolchain, which has its own, newer requirements.
//
// Usage (after `npm run build:lib`):
//   npm run smoke:library     # exit 1 on the first wrong result

import assert from 'node:assert/strict';
import { describeQuality, pictureOf, readerOf, validateBoard } from '@iyulab/u-board/domain';
import { resolveDocument } from '@iyulab/u-board/picture';
import { checkBoard } from '@iyulab/u-board-designer/check';

const board = {
  data: {
    pump: { from: 'source', ref: 'pump-a', fields: { state: { at: '' } } },
    gone: { from: 'source', ref: 'missing', fields: { load: { at: '' } } },
  },
  parts: {
    pumpA: { as: 'stat', title: 'Pump A', of: 'pump', show: 'state' },
    load: { as: 'stat', title: 'Load', of: 'gone', show: 'load' },
  },
  layout: { kind: 'canvas', size: [400, 200], place: { pumpA: [0, 0, 180, 120], load: [200, 0, 180, 120] } },
};

const adapter = {
  id: 'source',
  async resolve(ref) {
    return ref === 'pump-a'
      ? { value: 'running', quality: 'live' }
      : { value: undefined, quality: 'disconnected', reason: 'address' };
  },
};

assert.deepEqual(validateBoard(board), []);
assert.deepEqual(checkBoard(board).issues, []);

const picture = await pictureOf(board, readerOf([adapter]));
const nodes = (await resolveDocument(picture, [adapter])).nodes;
const node = id => nodes.find(n => n.id === id);
assert.deepEqual(Object.values(node('pumpA').widget.quality), ['live']);
assert.deepEqual(Object.values(node('load').widget.quality), ['disconnected']);
assert.equal(
  describeQuality(node('load').widget),
  'disconnected — no value has been reached (bound value not found at the source)'
);

console.log(`Library smoke on Node ${process.versions.node}: validate, draw, resolve and describe all behave.`);
