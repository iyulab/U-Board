import { describe, it, expect } from 'vitest';
import {
  documentToScene,
  applySceneToDocument,
  addNode,
  nextNodePosition,
  addDecoration,
  nextDecorationPosition,
  addConnector,
  removeParts,
  partOf,
} from './scene-mapping';
import type { CanvasView } from '../view-document';

function doc(overrides: Partial<CanvasView> = {}): CanvasView {
  return { kind: 'canvas', background: {}, nodes: [], connectors: [], ...overrides };
}

describe('partOf', () => {
  it('names the document part a scene object draws — a piece of a connector names the connector', () => {
    expect(partOf('node-1')).toBe('node-1');
    expect(partOf('c1#chip')).toBe('c1');
    expect(partOf('c1#arrow0')).toBe('c1');
  });
});

describe('addConnector', () => {
  it('joins two nodes with a connector of the given id, drawn the board’s way', () => {
    const before = doc({ nodes: [{ id: 'a', x: 0, y: 0, anchored: false, widget: { type: 'status' } }, { id: 'b', x: 0, y: 0, anchored: false, widget: { type: 'status' } }] });
    expect(addConnector(before, 'a', 'b', 'c9').connectors).toEqual([{ id: 'c9', fromNodeId: 'a', toNodeId: 'b' }]);
  });
});

describe('removeParts', () => {
  const node = (id: string) => ({ id, x: 0, y: 0, anchored: false, widget: { type: 'status' } });
  const board = doc({
    nodes: [node('a'), node('b'), node('c')],
    connectors: [
      { id: 'ab', fromNodeId: 'a', toNodeId: 'b' },
      { id: 'bc', fromNodeId: 'b', toNodeId: 'c' },
    ],
    decorations: [{ id: 'd', type: 'rect', x: 0, y: 0, width: 1, height: 1 }],
  });

  it('removes nodes, decorations and connectors by id', () => {
    const after = removeParts(board, ['ab', 'd']);
    expect(after.connectors.map(c => c.id)).toEqual(['bc']);
    expect(after.decorations).toEqual([]);
    expect(after.nodes).toHaveLength(3);
  });

  it('takes a node’s connectors along with it', () => {
    const after = removeParts(board, ['b']);
    expect(after.nodes.map(n => n.id)).toEqual(['a', 'c']);
    expect(after.connectors).toEqual([]);
  });
});

describe('documentToScene', () => {
  it('adds an image DrawingObject for the background when one is set', () => {
    const scene = documentToScene(doc({ background: { image: { src: 'plan.png', width: 800, height: 600 } } }));
    expect(scene.getObjects()[0]).toMatchObject({ type: 'image', src: 'plan.png', width: 800, height: 600 });
  });

  // An author grabbing the drawing would move only the editor's picture of it, not the document.
  it('locks the background, fixes the connectors (selected, never dragged), and locks nothing else the author edits', () => {
    const scene = documentToScene(
      doc({
        background: { image: { src: 'plan.png', width: 800, height: 600 } },
        nodes: [
          { id: 'a', x: 0, y: 0, anchored: false, widget: { type: 'status' } },
          { id: 'b', x: 300, y: 0, anchored: false, widget: { type: 'status' } },
        ],
        connectors: [{ id: 'c', fromNodeId: 'a', toNodeId: 'b' }],
        decorations: [{ type: 'rect', id: 'd', x: 0, y: 0, width: 50, height: 50 }],
      })
    );
    const held = Object.fromEntries(scene.getObjects().map(o => [o.type === 'image' ? 'background' : o.id, o.locked ? 'locked' : o.fixed ? 'fixed' : 'free']));
    expect(held).toEqual({ background: 'locked', c: 'fixed', a: 'free', b: 'free', d: 'free' });
  });

  it("adds one 'rect' per node, id'd by node id and positioned/sized by it", () => {
    const scene = documentToScene(
      doc({
        nodes: [
          { id: 'n1', x: 10, y: 20, width: 300, height: 150, anchored: true, widget: { type: 'status' } },
          { id: 'n2', x: 0, y: 0, anchored: false, widget: { type: 'gauge' } },
        ],
      })
    );

    const rects = scene.getObjects().filter(o => o.type === 'rect');
    expect(rects).toHaveLength(2);
    expect(rects.find(r => r.id === 'n1')).toMatchObject({ x: 10, y: 20, width: 300, height: 150 });
    const unsized = rects.find(r => r.id === 'n2')!;
    expect(unsized.width).toBeGreaterThan(0);
    expect(unsized.height).toBeGreaterThan(0);
  });

  it('draws a connector line between the current edges of its two nodes, fixed — its label chip too, its text passing presses to the chip', () => {
    const scene = documentToScene(
      doc({
        nodes: [
          { id: 'n1', x: 0, y: 0, width: 100, height: 100, anchored: false, widget: { type: 'status' } },
          { id: 'n2', x: 200, y: 0, width: 100, height: 100, anchored: false, widget: { type: 'status' } },
        ],
        connectors: [{ id: 'c1', fromNodeId: 'n1', toNodeId: 'n2', label: '3 kW', style: { arrow: 'end' } }],
      })
    );

    const objects = scene.getObjects();
    expect(objects.find(o => o.type === 'line')).toMatchObject({ points: [100, 50, 196, 50], fixed: true });
    expect(objects.find(o => o.id === 'c1#arrow0')).toMatchObject({ fixed: true });
    expect(objects.find(o => o.id === 'c1#chip')).toMatchObject({ fixed: true });
    expect(objects.find(o => o.id === 'c1#label')).toMatchObject({ locked: true });
  });

  it('skips a connector referencing a node that does not exist, without throwing', () => {
    expect(() =>
      documentToScene(doc({ connectors: [{ id: 'c1', fromNodeId: 'missing', toNodeId: 'also-missing' }] }))
    ).not.toThrow();
  });

  it("adds a rect/text DrawingObject for each decoration, id'd and positioned/sized by it", () => {
    const scene = documentToScene(
      doc({
        decorations: [
          { id: 'd1', type: 'rect', x: 10, y: 20, width: 300, height: 150, stroke: '#f59e0b' },
          { id: 'd2', type: 'text', x: 5, y: 5, text: 'Zone A' },
        ],
      })
    );

    expect(scene.getObjects().find(o => o.id === 'd1')).toMatchObject({ type: 'rect', x: 10, y: 20, width: 300, height: 150 });
    expect(scene.getObjects().find(o => o.id === 'd2')).toMatchObject({ type: 'text', x: 5, y: 5, text: 'Zone A' });
  });

  it('draws a frame’s name inside it, locked, so a press on the name selects the frame under it', () => {
    const scene = documentToScene(doc({ decorations: [{ id: 'f', type: 'rect', x: 10, y: 20, width: 300, height: 150, stroke: '#5f7a8c', strokeWidth: 1, radius: 4, label: 'Bay 1' }] }));
    expect(scene.getObjects().find(o => o.id === 'f')).toMatchObject({ type: 'rect', cornerRadius: 4 });
    expect(scene.getObjects().find(o => o.id === 'f#label')).toMatchObject({ type: 'text', x: 18, y: 28, text: 'Bay 1', locked: true });
  });
});

describe('applySceneToDocument', () => {
  it("updates a node's x/y from its matching rect in the scene", () => {
    const original = doc({
      nodes: [{ id: 'n1', x: 0, y: 0, anchored: false, widget: { type: 'status' } }],
    });
    const scene = documentToScene(original);
    const moved = scene.copy();
    const rectInMoved = moved.getObjects()[0];
    moved.updateObject(rectInMoved, { ...rectInMoved, x: 42, y: 99 });

    const updated = applySceneToDocument(original, moved);
    expect(updated.nodes[0]).toMatchObject({ x: 42, y: 99 });
  });

  it("updates a node's width/height from its matching rect (a resize, not just a move)", () => {
    const original = doc({
      nodes: [{ id: 'n1', x: 0, y: 0, width: 100, height: 50, anchored: false, widget: { type: 'status' } }],
    });
    const scene = documentToScene(original);
    const resized = scene.copy();
    const rectInResized = resized.getObjects()[0];
    if (rectInResized.type !== 'rect') throw new Error('expected a rect');
    resized.updateObject(rectInResized, { ...rectInResized, width: 240, height: 130 });

    const updated = applySceneToDocument(original, resized);
    expect(updated.nodes[0]).toMatchObject({ x: 0, y: 0, width: 240, height: 130 });
  });

  it('leaves a node unchanged when the scene has no matching rect (e.g. mid-transition)', () => {
    const original = doc({
      nodes: [{ id: 'n1', x: 5, y: 5, anchored: false, widget: { type: 'status' } }],
    });
    const emptyScene = documentToScene(doc());

    const updated = applySceneToDocument(original, emptyScene);
    expect(updated.nodes[0]).toMatchObject({ x: 5, y: 5 });
  });

  it("updates a rect decoration's x/y/width/height from its matching scene rect", () => {
    const original = doc({
      decorations: [{ id: 'd1', type: 'rect', x: 0, y: 0, width: 100, height: 50 }],
    });
    const scene = documentToScene(original);
    const resized = scene.copy();
    const rectInResized = resized.getObjects()[0];
    if (rectInResized.type !== 'rect') throw new Error('expected a rect');
    resized.updateObject(rectInResized, { ...rectInResized, x: 12, y: 34, width: 240, height: 130 });

    const updated = applySceneToDocument(original, resized);
    expect(updated.decorations?.[0]).toMatchObject({ x: 12, y: 34, width: 240, height: 130 });
  });

  it("updates a text decoration's x/y from its matching scene text, leaving its text untouched", () => {
    const original = doc({
      decorations: [{ id: 'd1', type: 'text', x: 0, y: 0, text: 'Zone A' }],
    });
    const scene = documentToScene(original);
    const moved = scene.copy();
    const textInMoved = moved.getObjects()[0];
    moved.updateObject(textInMoved, { ...textInMoved, x: 42, y: 99 });

    const updated = applySceneToDocument(original, moved);
    expect(updated.decorations?.[0]).toMatchObject({ x: 42, y: 99, text: 'Zone A' });
  });

  it('does not confuse a node rect with a same-shaped decoration rect when folding back', () => {
    const original = doc({
      nodes: [{ id: 'n1', x: 0, y: 0, anchored: false, widget: { type: 'status' } }],
      decorations: [{ id: 'd1', type: 'rect', x: 0, y: 0, width: 100, height: 50 }],
    });
    const scene = documentToScene(original);
    const moved = scene.copy();
    const nodeRect = moved.getObjects().find(o => o.id === 'n1')!;
    moved.updateObject(nodeRect, { ...nodeRect, x: 500, y: 500 });

    const updated = applySceneToDocument(original, moved);
    expect(updated.nodes[0]).toMatchObject({ x: 500, y: 500 });
    expect(updated.decorations?.[0]).toMatchObject({ x: 0, y: 0 });
  });

  it('preserves widget/binding data untouched — only position moves', () => {
    const original = doc({
      nodes: [
        {
          id: 'n1',
          x: 0,
          y: 0,
          anchored: false,
          widget: { type: 'status', bindings: { 'data.value': { adapter: 'a', ref: 'r' } } },
        },
      ],
    });
    const scene = documentToScene(original);
    const updated = applySceneToDocument(original, scene);
    expect(updated.nodes[0].widget).toEqual(original.nodes[0].widget);
  });
});

describe('addNode', () => {
  it('appends a new unbound node at the given position, leaving existing nodes untouched', () => {
    const original = doc({
      nodes: [{ id: 'n1', x: 0, y: 0, anchored: false, widget: { type: 'status' } }],
    });

    const updated = addNode(original, { x: 40, y: 60 });

    expect(updated.nodes).toHaveLength(2);
    expect(updated.nodes[0]).toEqual(original.nodes[0]);
    const added = updated.nodes[1];
    expect(added).toMatchObject({ x: 40, y: 60, anchored: false });
    expect(added.widget.bindings).toBeUndefined();
    // u-widgets' status widget renders nothing without a `value` (see uw-status.ts) — the
    // default props must include a placeholder so a newly added node is actually visible.
    expect(added.widget.props?.data).toMatchObject({ value: expect.any(String) });
  });

  it('assigns each new node a distinct id', () => {
    let d = doc();
    d = addNode(d, { x: 0, y: 0 });
    d = addNode(d, { x: 0, y: 0 });
    expect(d.nodes[0].id).not.toBe(d.nodes[1].id);
  });
});

describe('addDecoration', () => {
  it('appends a new rect decoration at the given position with a default size, leaving existing decorations untouched', () => {
    const original = doc({
      decorations: [{ id: 'd1', type: 'text', x: 0, y: 0, text: 'existing' }],
    });

    const updated = addDecoration(original, 'rect', { x: 40, y: 60 });

    expect(updated.decorations).toHaveLength(2);
    expect(updated.decorations?.[0]).toEqual(original.decorations?.[0]);
    const added = updated.decorations?.[1];
    expect(added).toMatchObject({ type: 'rect', x: 40, y: 60 });
    expect((added as { width: number }).width).toBeGreaterThan(0);
    expect((added as { height: number }).height).toBeGreaterThan(0);
  });

  it('appends a new text decoration with placeholder text', () => {
    const updated = addDecoration(doc(), 'text', { x: 10, y: 10 });
    expect(updated.decorations?.[0]).toMatchObject({ type: 'text', x: 10, y: 10 });
    expect((updated.decorations![0] as { text: string }).text.length).toBeGreaterThan(0);
  });

  it('assigns each new decoration a distinct id', () => {
    let d = doc();
    d = addDecoration(d, 'rect', { x: 0, y: 0 });
    d = addDecoration(d, 'rect', { x: 0, y: 0 });
    expect(d.decorations?.[0].id).not.toBe(d.decorations?.[1].id);
  });

  it("a decoration id never collides with a node id (folding back can tell them apart)", () => {
    let d = doc({ nodes: [{ id: 'shared-namespace-check', x: 0, y: 0, anchored: false, widget: { type: 'status' } }] });
    d = addDecoration(d, 'rect', { x: 0, y: 0 });
    expect(d.decorations?.[0].id).not.toBe(d.nodes[0].id);
  });
});

describe('nextDecorationPosition', () => {
  it("cascades each subsequent decoration's position so it doesn't stack on the last one", () => {
    const withOne = doc({ decorations: [{ id: 'd1', type: 'rect', x: 40, y: 40, width: 10, height: 10 }] });
    expect(nextDecorationPosition(withOne)).not.toEqual({ x: 40, y: 40 });
  });
});

describe('nextNodePosition', () => {
  it('places the first node at the base offset', () => {
    expect(nextNodePosition(doc())).toEqual({ x: 40, y: 40 });
  });

  it('offsets from a given origin — the scene point at the top-left of what the author sees', () => {
    expect(nextNodePosition(doc(), { x: 1000, y: 500 })).toEqual({ x: 1040, y: 540 });
    expect(nextDecorationPosition(doc(), { x: -20, y: 10 })).toEqual({ x: 20, y: 50 });
  });

  it("cascades each subsequent node's position so it doesn't stack on the last one", () => {
    const withOneNode = doc({ nodes: [{ id: 'n1', x: 40, y: 40, anchored: false, widget: { type: 'status' } }] });
    const position = nextNodePosition(withOneNode);
    expect(position).not.toEqual({ x: 40, y: 40 });
  });

  it('produces a distinct position for each node added in sequence', () => {
    let d = doc();
    const positions = [];
    for (let i = 0; i < 5; i++) {
      const position = nextNodePosition(d);
      positions.push(position);
      d = addNode(d, position);
    }
    const unique = new Set(positions.map(p => `${p.x},${p.y}`));
    expect(unique.size).toBe(positions.length);
  });
});
