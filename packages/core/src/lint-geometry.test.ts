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

  it('says two overlapping nodes once — not again for their captions under each other or running together', () => {
    const doc = canvas({ nodes: [{ ...node('a', 0, 0, { width: 44, height: 44 }), caption: 'core#1' }, { ...node('b', 20, 0, { width: 44, height: 44 }), caption: 'edge#1' }] });
    expect(lintGeometry(doc)).toEqual([{ path: '/nodes/0', message: expect.stringContaining('overlaps node "b"') }]);
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
      { path: '/decorations/1', message: 'connector "link" runs through this text — place it beside the line, or use the connector’s label' },
      { path: '/decorations/2', message: 'this text runs into /decorations/3 — the two overlap' },
    ]);
  });

  it('follows an orthogonal connector along its turn, not the straight line it no longer draws', () => {
    // a's right side to b's left side, turning at x = 280: the text sits on the turn, well off the straight diagonal.
    const parts = (route?: 'orthogonal') => canvas({
      nodes: [node('a', 0, 0), node('b', 400, 300)],
      connectors: [{ id: 'link', fromNodeId: 'a', toNodeId: 'b', ...(route && { style: { route } }) }],
      decorations: [text('onTurn', 270, 300, 'N/A')],
    });
    expect(lintGeometry(parts('orthogonal'))).toEqual([{ path: '/decorations/0', message: expect.stringContaining('connector "link" runs through this text') }]);
    expect(lintGeometry(parts())).toEqual([]);
  });

  it('counts a node’s caption as a text under its box: under another node, or running into a text', () => {
    const doc = canvas({
      nodes: [node('a', 0, 0, { width: 40, height: 40 }), node('b', 0, 50, { width: 40, height: 40 })],
      decorations: [text('t', 0, 100, 'storage#1', 12)],
    });
    doc.nodes[0].caption = 'auth_srv#1'; // drawn at y 44–56, under b (y 50–90)
    doc.nodes[1].caption = 'storage#1'; // drawn at y 94–106, into the text at y 100
    expect(lintGeometry(doc)).toEqual([
      { path: '/nodes/0/caption', message: expect.stringContaining('lies under node "b" (/nodes/1)') },
      { path: '/decorations/0', message: 'this text runs into /nodes/1/caption — the two overlap' },
    ]);
  });

  it('counts a connector’s label by its chip: under a node, or running into another label', () => {
    const doc = canvas({
      nodes: [node('a', 0, 0, { width: 40, height: 40 }), node('b', 400, 0, { width: 40, height: 40 }), node('m', 200, 10, { width: 40, height: 40 })],
      connectors: [
        { id: 'one', fromNodeId: 'a', toNodeId: 'b', label: 'a very long throughput label' },
        { id: 'two', fromNodeId: 'a', toNodeId: 'b', label: 'another long label here' },
      ],
    });
    // the two labels take turns along the line (1/3, 2/3) — both still under m, and long enough to meet
    expect(lintGeometry(doc)).toEqual([
      { path: '/connectors/0/label', message: expect.stringContaining('lies under node "m" (/nodes/2)') },
      { path: '/connectors/1/label', message: expect.stringContaining('lies under node "m" (/nodes/2)') },
      { path: '/connectors/0/label', message: 'this text runs into /connectors/1/label — the two overlap' },
    ]);
  });

  it('names a frame edge running through a text, unless a filled tag drawn after the frame covers it', () => {
    const frame = { id: 'zone', type: 'rect' as const, x: 0, y: 100, width: 300, height: 200, stroke: '#888', strokeWidth: 1 };
    const across = text('title', 10, 92, 'DMZ zone', 12); // y 92–104 crosses the top edge at 100
    expect(lintGeometry(canvas({ decorations: [frame, across] }))).toEqual([
      { path: '/decorations/1', message: expect.stringContaining('the edge of /decorations/0 runs through this text') },
    ]);
    const tag = { id: 'tag', type: 'rect' as const, x: 6, y: 90, width: 70, height: 16, fill: '#ffffff' };
    expect(lintGeometry(canvas({ decorations: [frame, tag, across] }))).toEqual([]);
    const inside = text('inside', 10, 120, 'DMZ zone', 12);
    expect(lintGeometry(canvas({ decorations: [frame, inside] }))).toEqual([]);
  });

  it('estimates a text by its characters and size', () => {
    expect(textBox({ id: 't', type: 'text', x: 5, y: 6, text: 'abcd', fontSize: 10 })).toEqual({ x: 5, y: 6, width: 24, height: 10 });
  });

  it('places a text’s box by its anchor, grown by its background', () => {
    expect(textBox({ id: 't', type: 'text', x: 50, y: 30, text: 'abcd', fontSize: 10, anchor: 'center' })).toEqual({ x: 38, y: 25, width: 24, height: 10 });
    expect(textBox({ id: 't', type: 'text', x: 50, y: 30, text: 'abcd', fontSize: 10, anchor: 'bottom-end', background: '#fff' })).toEqual({ x: 22, y: 16, width: 32, height: 18 });
  });

  it('lets a text’s own background, drawn after a frame, cover the frame’s edge', () => {
    const frame = { id: 'zone', type: 'rect' as const, x: 0, y: 100, width: 300, height: 200, stroke: '#888', strokeWidth: 1 };
    const tag: Shape = { id: 'title', type: 'text', x: 10, y: 100, text: 'DMZ zone', fontSize: 12, anchor: 'start', background: '#888', fill: '#fff' };
    expect(lintGeometry(canvas({ decorations: [frame, tag] }))).toEqual([]);
    expect(lintGeometry(canvas({ decorations: [tag, frame] }))).toEqual([
      { path: '/decorations/0', message: expect.stringContaining('the edge of /decorations/1 runs through this text') },
    ]);
  });

  it('judges a frame’s name as a text — a node over it is named', () => {
    const frame: Shape = { id: 'bay', type: 'rect', x: 0, y: 0, width: 400, height: 200, stroke: '#888', strokeWidth: 1, label: 'Line 1' };
    expect(lintGeometry(canvas({ decorations: [frame] }))).toEqual([]);
    expect(lintGeometry(canvas({ decorations: [frame], nodes: [node('a', 4, 4)] }))).toEqual([
      { path: '/decorations/0/label', message: expect.stringContaining('lies under node "a"') },
    ]);
  });

  it('keeps to its limit and says how many more there are', () => {
    const nodes = Array.from({ length: 9 }, (_, i) => node(`n${i}`, i * 10, 0)); // 36 overlapping pairs
    const decorations = [text('a', 0, 400, 'one'), text('b', 5, 400, 'two')];
    const advice = lintGeometry(canvas({ nodes, decorations }));
    expect(advice).toHaveLength(GEOMETRY_ADVICE_LIMIT + 1);
    expect(advice.at(-1)).toEqual({ path: '', message: '7 more: 6 overlapping nodes, 1 texts running together — fix the ones above, then check again', count: 7 });
  });

  it('lists every finding when asked to, so a reader keeping some of them loses none to the fold', () => {
    const nodes = Array.from({ length: 9 }, (_, i) => node(`n${i}`, i * 10, 0));
    const advice = lintGeometry(canvas({ nodes }), Infinity);
    expect(advice).toHaveLength(36);
    expect(advice.every(a => a.count === undefined)).toBe(true);
    expect(lintViewDocument(canvas({ nodes }), { geometryLimit: Infinity })).toHaveLength(36);
  });

  it('is part of lintViewDocument for a canvas board, before the element advice', () => {
    const doc = canvas({ nodes: [node('a', 0, 0), node('b', 10, 10)], elements: { pump: { render: 'template', template: '<b/>' } } });
    expect(lintViewDocument(doc).map(a => a.path)).toEqual(['/nodes/0', '/elements/pump']);
  });
});
