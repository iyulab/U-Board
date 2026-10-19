import { describe, it, expect } from 'vitest';
import { documentPatch } from './document-patch';
import { applyJsonPatch } from './json-patch';
import { makeComponent } from './authoring/component-editing';
import { renameElement } from './authoring/element-editing';
import { removeParts } from './authoring/part-removal';
import type { CanvasView } from './view-document';

/** The patch turns `before` into `after` exactly — key order included, since JSON text keeps it. */
function roundTrip(before: unknown, after: unknown) {
  const patch = documentPatch(before, after);
  expect(JSON.stringify(applyJsonPatch(before, patch))).toBe(JSON.stringify(after));
  return patch;
}

const board = (): CanvasView => ({
  kind: 'canvas',
  background: {},
  elements: { dot: { render: 'template', template: '<i></i>' }, bar: { render: 'template', template: '<b></b>' } },
  nodes: [
    { id: 'temp', x: 10, y: 20, anchored: false, widget: { type: 'gauge', props: { label: 'Temp' } } },
    { id: 'speed', x: 10, y: 140, anchored: false, widget: { type: 'element:dot' } },
    { id: 'hall', x: 400, y: 20, anchored: false, widget: { type: 'status' } },
  ],
  connectors: [
    { id: 'feed', fromNodeId: 'temp', toNodeId: 'speed' },
    { id: 'out', fromNodeId: 'speed', toNodeId: 'hall' },
  ],
  decorations: [{ id: 'frame', type: 'rect', x: 0, y: 0, width: 220, height: 260 }],
  triggers: [{ on: { event: 'click', node: 'speed' }, do: [{ action: 'focus', node: 'hall' }] }],
});

describe('documentPatch', () => {
  it('is empty for documents that are the same', () => {
    expect(roundTrip(board(), board())).toEqual([]);
  });

  it('changes a value where it is, not the whole document', () => {
    const after = board();
    after.nodes[1].x = 60;
    expect(roundTrip(board(), after)).toEqual([{ op: 'replace', path: '/nodes/1/x', value: 60 }]);
  });

  it('matches list items by id: removes from the end first, adds at the end', () => {
    const after = board();
    after.nodes = [after.nodes[0], after.nodes[2], { id: 'new', x: 0, y: 0, anchored: false, widget: { type: 'status' } }];
    after.nodes[1].y = 99;
    expect(roundTrip(board(), after)).toEqual([
      { op: 'remove', path: '/nodes/1' },
      { op: 'replace', path: '/nodes/1/y', value: 99 },
      { op: 'add', path: '/nodes/-', value: after.nodes[2] },
    ]);
  });

  it('replaces a list whose items moved, or that has no ids, when its length changed', () => {
    const moved = board();
    moved.nodes.reverse();
    expect(roundTrip(board(), moved)).toEqual([{ op: 'replace', path: '/nodes', value: moved.nodes }]);
    expect(roundTrip({ a: [1, 2, 3] }, { a: [1, 3] })).toEqual([{ op: 'replace', path: '/a', value: [1, 3] }]);
    expect(roundTrip({ a: [1, 2, 3] }, { a: [1, 5, 3] })).toEqual([{ op: 'replace', path: '/a/1', value: 5 }]);
  });

  it('adds and removes members, and keeps their order', () => {
    expect(roundTrip({ a: 1, b: 2 }, { a: 1, b: 2, c: 3 })).toEqual([{ op: 'add', path: '/c', value: 3 }]);
    expect(roundTrip({ a: 1, b: 2 }, { b: 2 })).toEqual([{ op: 'remove', path: '/a' }]);
    // A member renamed in place would land last if removed and added: the object is replaced to keep its order.
    expect(roundTrip({ a: 1, b: 2 }, { x: 1, b: 2 })).toEqual([{ op: 'replace', path: '', value: { x: 1, b: 2 } }]);
  });

  it('escapes the pointer of a key with "/" or "~"', () => {
    expect(roundTrip({ 'a/b': { 'c~d': 1 } }, { 'a/b': { 'c~d': 2 } })).toEqual([{ op: 'replace', path: '/a~1b/c~0d', value: 2 }]);
  });

  it('turns what the editor’s edits do into a patch that does the same', () => {
    roundTrip(board(), renameElement(board(), 'dot', 'marker'));
    roundTrip(board(), removeParts(board(), ['speed']));
    roundTrip(board(), makeComponent(board(), ['temp', 'speed', 'frame'], 'card', 'c1'));
  });
});
