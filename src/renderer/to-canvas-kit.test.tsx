import { describe, it, expect } from 'vitest';
import type { ReactElement } from 'react';
import { toCanvasKit } from './to-canvas-kit';
import type { ResolvedViewDocument } from '../resolve-document';

function doc(overrides: Partial<ResolvedViewDocument> = {}): ResolvedViewDocument {
  return {
    kind: 'canvas',
    background: {},
    nodes: [],
    connectors: [],
    ...overrides,
  };
}

describe('toCanvasKit', () => {
  it('adds an image DrawingObject for the background when one is set', () => {
    const { scene } = toCanvasKit(
      doc({ background: { image: { src: 'plan.png', width: 800, height: 600 } } })
    );

    const objects = scene.getObjects();
    expect(objects).toHaveLength(1);
    expect(objects[0]).toMatchObject({ type: 'image', src: 'plan.png', width: 800, height: 600 });
  });

  it('adds no scene objects for a document with no background and no connectors', () => {
    const { scene, overlays } = toCanvasKit(doc());
    expect(scene.getObjects()).toHaveLength(0);
    expect(overlays).toHaveLength(0);
  });

  it('draws a line connecting the center of two nodes', () => {
    const { scene } = toCanvasKit(
      doc({
        nodes: [
          { id: 'n1', x: 0, y: 0, width: 100, height: 100, anchored: false, widget: { type: 'metric', props: { data: { value: 1 } }, connected: {} } },
          { id: 'n2', x: 200, y: 0, width: 100, height: 100, anchored: false, widget: { type: 'metric', props: { data: { value: 2 } }, connected: {} } },
        ],
        connectors: [{ id: 'c1', fromNodeId: 'n1', toNodeId: 'n2' }],
      })
    );

    const line = scene.getObjects().find(o => o.type === 'line');
    expect(line).toMatchObject({ points: [50, 50, 250, 50] });
  });

  it('skips a connector referencing a node that does not exist, without throwing', () => {
    expect(() =>
      toCanvasKit(doc({ connectors: [{ id: 'c1', fromNodeId: 'missing', toNodeId: 'also-missing' }] }))
    ).not.toThrow();
  });

  it('produces one overlay per node, positioned at the node and sized by it (or a default)', () => {
    const { overlays } = toCanvasKit(
      doc({
        nodes: [
          { id: 'sized', x: 10, y: 20, width: 300, height: 150, anchored: true, widget: { type: 'metric', connected: {}, props: {} } },
          { id: 'unsized', x: 0, y: 0, anchored: false, widget: { type: 'metric', connected: {}, props: {} } },
        ],
      })
    );

    expect(overlays.find(o => o.id === 'sized')).toMatchObject({ x: 10, y: 20, width: 300, height: 150 });
    const unsized = overlays.find(o => o.id === 'unsized')!;
    expect(unsized.width).toBeGreaterThan(0);
    expect(unsized.height).toBeGreaterThan(0);
  });

  it("passes the node's widget type and props through as a u-widgets spec", () => {
    const { overlays } = toCanvasKit(
      doc({
        nodes: [
          {
            id: 'n1',
            x: 0,
            y: 0,
            anchored: false,
            widget: { type: 'gauge', props: { data: { value: 73 } }, connected: {} },
          },
        ],
      })
    );

    const content = overlays[0].content as ReactElement<{ spec: Record<string, unknown> }>;
    expect(content.props.spec).toEqual({ widget: 'gauge', data: { value: 73 } });
  });
});
