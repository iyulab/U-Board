#!/usr/bin/env node
// smoke-library.mjs
// Runs the published library's Node-facing entry point, as built (packages/core/dist/lib), the way a
// consumer on the oldest supported Node would: a document is validated, resolved through an adapter,
// and its connection quality described. It needs nothing but Node itself, so the CI job that checks
// the declared `engines.node` floor can run the product on that Node without also running the test
// toolchain, which has its own, newer requirements.
//
// Usage (after `npm run build:lib`):
//   npm run smoke:library     # exit 1 on the first wrong result

import assert from 'node:assert/strict';
import { describeQuality, parseViewDocument, resolveDocument, validateViewDocument } from '@iyulab/u-board/domain';

const doc = {
  kind: 'canvas',
  background: {},
  connectors: [],
  nodes: [
    {
      id: 'pump-a',
      x: 0,
      y: 0,
      anchored: false,
      widget: {
        type: 'status',
        props: { data: { label: 'Pump A', value: '--' } },
        bindings: { 'data.value': { adapter: 'source', ref: 'state' }, 'data.load': { adapter: 'source', ref: 'missing' } },
      },
    },
  ],
};

const adapter = {
  id: 'source',
  async resolve(ref) {
    return ref === 'state'
      ? { value: 'running', quality: 'live' }
      : { value: undefined, quality: 'disconnected', reason: 'address' };
  },
};

assert.deepEqual(validateViewDocument(doc), []);
assert.deepEqual(parseViewDocument(JSON.stringify(doc)), doc);

const [pumpA] = (await resolveDocument(doc, [adapter])).nodes;
assert.deepEqual(pumpA.widget.props, { data: { label: 'Pump A', value: 'running' } });
assert.deepEqual(pumpA.widget.quality, { 'data.value': 'live', 'data.load': 'disconnected' });
assert.equal(
  describeQuality(pumpA.widget),
  'disconnected — no value has been reached (bound value not found at the source)'
);

console.log(`Library smoke on Node ${process.versions.node}: validate, parse, resolve and describe all behave.`);
