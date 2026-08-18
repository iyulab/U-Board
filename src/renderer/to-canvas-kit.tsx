import { Scene } from '@canvas-kit/core';
import type { ViewerOverlayItem } from '@canvas-kit/viewer';
import { UWidget } from '@iyulab/u-widgets/react';
import '@iyulab/u-widgets';
import type { ResolvedViewDocument } from '../resolve-document';
import { DEFAULT_NODE_WIDTH, DEFAULT_NODE_HEIGHT } from '../layout-defaults';

export interface CanvasKitRenderOutput {
  scene: Scene;
  overlays: ViewerOverlayItem[];
}

/**
 * Translates a resolved View Document into canvas-kit primitives: a Scene holding the
 * background and connectors, and an overlay list for the Viewer to position each node's widget
 * in scene coordinates. This is the renderer half of the editor/renderer separation
 * (docs/principles.md) — it depends on canvas-kit and u-widgets so the document format itself
 * doesn't have to.
 */
export function toCanvasKit(doc: ResolvedViewDocument): CanvasKitRenderOutput {
  const scene = new Scene();

  if (doc.background.image) {
    scene.add({
      type: 'image',
      x: 0,
      y: 0,
      width: doc.background.image.width,
      height: doc.background.image.height,
      src: doc.background.image.src,
    });
  }

  const nodesById = new Map(doc.nodes.map(node => [node.id, node]));
  for (const connector of doc.connectors) {
    const from = nodesById.get(connector.fromNodeId);
    const to = nodesById.get(connector.toNodeId);
    if (!from || !to) continue; // a dangling reference is a malformed document, not a crash
    scene.add({
      type: 'line',
      id: connector.id,
      x: 0,
      y: 0,
      points: [
        from.x + (from.width ?? DEFAULT_NODE_WIDTH) / 2,
        from.y + (from.height ?? DEFAULT_NODE_HEIGHT) / 2,
        to.x + (to.width ?? DEFAULT_NODE_WIDTH) / 2,
        to.y + (to.height ?? DEFAULT_NODE_HEIGHT) / 2,
      ],
      stroke: '#94a3b8',
      strokeWidth: 2,
    });
  }

  // u-widgets takes one `spec` object with `widget` as the type discriminator alongside
  // `data`/`mapping`/`options` — `type` + `props` here recombine into exactly that shape.
  const overlays: ViewerOverlayItem[] = doc.nodes.map(node => ({
    id: node.id,
    x: node.x,
    y: node.y,
    width: node.width ?? DEFAULT_NODE_WIDTH,
    height: node.height ?? DEFAULT_NODE_HEIGHT,
    content: <UWidget spec={{ widget: node.widget.type, ...node.widget.props }} />,
  }));

  return { scene, overlays };
}
