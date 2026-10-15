import { describe, it, expect } from 'vitest';
import { lintGeometry, textBox, GEOMETRY_ADVICE_LIMIT } from './lint-geometry';
import { lintViewDocument } from './lint-view-document';
import type { CanvasView, Node, Shape } from './view-document';

const node = (id: string, x: number, y: number, size: Partial<Pick<Node, 'width' | 'height'>> = {}): Node => ({ id, x, y, ...size, anchored: false, widget: { type: 'gauge' } });
const text = (id: string, x: number, y: number, value: string, fontSize?: number): Shape => ({ id, type: 'text', x, y, text: value, ...(fontSize && { fontSize }) });
const canvas = (parts: Partial<CanvasView>): CanvasView => ({ kind: 'canvas', background: {}, nodes: [], connectors: [], ...parts });

describe('lintGeometry', () => {
  it('finds nothing on a board whose parts keep apart', () => {
    const doc = canvas({
      nodes: [node('a', 0, 0), node('b', 300, 0)],
      connectors: [{ id: 'c', fromNodeId: 'a', toNodeId: 'b' }],
      decorations: [text('t', 200, 100, '26 Kbps'), { id: 'frame', type: 'rect', x: -10, y: -10, width: 500, height: 150 }],
    });
    expect(lintGeometry(doc)).toEqual([]);
  });

  it('names two nodes whose boxes overlap, counting the default size of a node without one', () => {
    const doc = canvas({ nodes: [node('a', 0, 0), node('b', 150, 90), node('c', 400, 0, { width: 20, height: 20 })] });
    expect(lintGeometry(doc)).toEqual([{ path: '/nodes/0', message: expect.stringContaining('overlaps node "b" (/nodes/1)') }]);
  });

  it('does not count boxes that only touch', () => {
    expect(lintGeometry(canvas({ nodes: [node('a', 0, 0), node('b', 160, 0)] }))).toEqual([]);
  });

  it('names a text under a node, a connector through a text, and texts running together', () => {
    const doc = canvas({
      nodes: [node('a', 0, 0), node('b', 400, 0)],
      connectors: [{ id: 'link', fromNodeId: 'a', toNodeId: 'b' }],
      decorations: [
        text('hidden', 100, 50, 'under a'), // inside a's box
        text('onLine', 250, 42, 'N/A'), // the line runs at y = 50
        text('one', 0, 300, 'Catalyst9300.nmslab.local', 12),
        text('two', 120, 300, 'storage#1', 12),
      ],
    });
    expect(lintGeometry(doc)).toEqual([
      { path: '/decorations/0', message: expect.stringContaining('lies under node "a" (/nodes/0)') },
      { path: '/decorations/1', message: 'connector "link" runs through this text — place it beside the line' },
      { path: '/decorations/2', message: 'this text runs into /decorations/3 — the two overlap' },
    ]);
  });

  it('estimates a text by its characters and size', () => {
    expect(textBox({ id: 't', type: 'text', x: 5, y: 6, text: 'abcd', fontSize: 10 })).toEqual({ x: 5, y: 6, width: 24, height: 10 });
  });

  it('keeps to its limit and says how many more there are', () => {
    const nodes = Array.from({ length: 9 }, (_, i) => node(`n${i}`, i * 10, 0)); // 36 overlapping pairs
    const decorations = [text('a', 0, 400, 'one'), text('b', 5, 400, 'two')];
    const advice = lintGeometry(canvas({ nodes, decorations }));
    expect(advice).toHaveLength(GEOMETRY_ADVICE_LIMIT + 1);
    expect(advice.at(-1)).toEqual({ path: '', message: '7 more: 6 overlapping nodes, 1 texts running together — fix the ones above, then check again' });
  });

  it('is part of lintViewDocument for a canvas board, before the element advice', () => {
    const doc = canvas({ nodes: [node('a', 0, 0), node('b', 10, 10)], elements: { pump: { render: 'template', template: '<b/>' } } });
    expect(lintViewDocument(doc).map(a => a.path)).toEqual(['/nodes/0', '/elements/pump']);
  });
});
