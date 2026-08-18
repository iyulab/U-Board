import { describe, it, expect } from 'vitest';
import { documentToScene, applySceneToDocument, addNode } from './scene-mapping';
import type { ViewDocument } from '../view-document';

function doc(overrides: Partial<ViewDocument> = {}): ViewDocument {
  return { kind: 'canvas', background: {}, nodes: [], connectors: [], ...overrides };
}

describe('documentToScene', () => {
  it('adds an image DrawingObject for the background when one is set', () => {
    const scene = documentToScene(doc({ background: { image: { src: 'plan.png', width: 800, height: 600 } } }));
    expect(scene.getObjects()[0]).toMatchObject({ type: 'image', src: 'plan.png', width: 800, height: 600 });
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

  it('draws a connector line between the current center of its two nodes', () => {
    const scene = documentToScene(
      doc({
        nodes: [
          { id: 'n1', x: 0, y: 0, width: 100, height: 100, anchored: false, widget: { type: 'status' } },
          { id: 'n2', x: 200, y: 0, width: 100, height: 100, anchored: false, widget: { type: 'status' } },
        ],
        connectors: [{ id: 'c1', fromNodeId: 'n1', toNodeId: 'n2' }],
      })
    );

    const line = scene.getObjects().find(o => o.type === 'line');
    expect(line).toMatchObject({ points: [50, 50, 250, 50] });
  });

  it('skips a connector referencing a node that does not exist, without throwing', () => {
    expect(() =>
      documentToScene(doc({ connectors: [{ id: 'c1', fromNodeId: 'missing', toNodeId: 'also-missing' }] }))
    ).not.toThrow();
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

  it('leaves a node unchanged when the scene has no matching rect (e.g. mid-transition)', () => {
    const original = doc({
      nodes: [{ id: 'n1', x: 5, y: 5, anchored: false, widget: { type: 'status' } }],
    });
    const emptyScene = documentToScene(doc());

    const updated = applySceneToDocument(original, emptyScene);
    expect(updated.nodes[0]).toMatchObject({ x: 5, y: 5 });
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
