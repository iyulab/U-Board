import { test } from 'node:test';
import assert from 'node:assert/strict';
import { widgetsRange, withWidgetsRange } from './take-widgets.mjs';

test('a version becomes a caret range, and only a whole version does', () => {
  assert.equal(widgetsRange('0.49.0'), '^0.49.0');
  for (const bad of ['0.49', '^0.49.0', 'latest', '', undefined]) assert.throws(() => widgetsRange(bad), /whole version/);
});

test('replaces the range of the widget library wherever a manifest names it, and nothing else', () => {
  const text = '{\n  "dependencies": {\n    "@iyulab/u-widgets": "^0.48.0",\n    "react": "^19.2.0"\n  }\n}\n';
  const { text: next, changed } = withWidgetsRange(text, '^0.49.0');
  assert.equal(changed, true);
  assert.equal(next, text.replace('^0.48.0', '^0.49.0'));
});

test('leaves a manifest alone that already declares the range or does not depend on the library', () => {
  const same = '{ "dependencies": { "@iyulab/u-widgets": "^0.49.0" } }';
  assert.deepEqual(withWidgetsRange(same, '^0.49.0'), { text: same, changed: false });
  const none = '{ "dependencies": { "react": "^19.2.0" } }';
  assert.deepEqual(withWidgetsRange(none, '^0.49.0'), { text: none, changed: false });
});

test('reads a range written with spaces around the colon', () => {
  const { text, changed } = withWidgetsRange('{ "@iyulab/u-widgets" :   "^0.48.0" }', '^0.49.0');
  assert.equal(changed, true);
  assert.equal(text, '{ "@iyulab/u-widgets" :   "^0.49.0" }');
});
