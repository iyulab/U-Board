import { describe, it, expect } from 'vitest';
import type { ViewDocument } from '@iyulab/u-board/picture';
import { inDocument, placedParts } from './look.js';

const board: ViewDocument = {
  kind: 'canvas',
  background: {},
  nodes: [{ id: 'hall', x: 0, y: 0, anchored: false, widget: { type: 'status' } }],
  connectors: [],
  components: { card: { nodes: [{ id: 'temp', x: 0, y: 0, widget: { type: 'gauge' } }, { id: 'speed', x: 0, y: 120, widget: { type: 'gauge' } }] } },
  instances: [
    { id: 'p1', component: 'card', x: 200, y: 0, anchored: false },
    { id: 'p2', component: 'card', x: 400, y: 0, anchored: false },
  ],
};

describe('what look checks on a drawn board', () => {
  it('checks the parts each instance draws, as well as the board’s own', () => {
    expect(placedParts(board).map(p => [p.id, p.path])).toEqual([
      ['hall', '/nodes/0'],
      ['p1/temp', '/instances/0/temp'],
      ['p1/speed', '/instances/0/speed'],
      ['p2/temp', '/instances/1/temp'],
      ['p2/speed', '/instances/1/speed'],
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

  it('reports a drawn part’s problem at its node in the component, naming the instance — a focus on the instance finds it', () => {
    expect(inDocument(board, { path: '/instances/1/speed', message: 'its content runs past its box' })).toEqual({
      path: '/components/card/nodes/1',
      message: 'its content runs past its box — in the instance "p2" (/instances/1)',
    });
    const own = { path: '/nodes/0', message: 'x' };
    expect(inDocument(board, own)).toBe(own);
  });
});
