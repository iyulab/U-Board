import { describe, it, expect } from 'vitest';
import type { ViewDocument } from '@iyulab/u-board/picture';
import { placedParts } from './look.js';

describe('what look checks on a drawn board', () => {
  it('checks a canvas board’s nodes, each by the attribute its frame carries', () => {
    const board: ViewDocument = {
      kind: 'canvas',
      background: {},
      nodes: [
        { id: 'hall', x: 0, y: 0, anchored: false, widget: { type: 'status' } },
        { id: 'temp', x: 200, y: 0, anchored: false, widget: { type: 'gauge' } },
      ],
      connectors: [],
    };
    expect(placedParts(board)).toEqual([
      { id: 'hall', path: '/nodes/0', attr: 'data-node-id' },
      { id: 'temp', path: '/nodes/1', attr: 'data-node-id' },
    ]);
  });

  it('checks a grid’s widget items and the nodes of its canvas cells, each by the attribute its frame carries', () => {
    const grid: ViewDocument = {
      kind: 'grid',
      items: [
        { id: 'kpi', widget: { type: 'gauge' } },
        { id: 'plan', canvas: { background: {}, nodes: [{ id: 'pump', x: 0, y: 0, anchored: false, widget: { type: 'status' } }], connectors: [] } },
      ],
    };
    expect(placedParts(grid)).toEqual([
      { id: 'kpi', path: '/items/0', attr: 'data-item-id' },
      { id: 'pump', path: '/items/1/canvas/nodes/0', attr: 'data-node-id' },
    ]);
  });
});
