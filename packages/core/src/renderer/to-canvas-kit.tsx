import type { CSSProperties } from 'react';
import { Scene } from '@canvas-kit/core';
import type { ViewerOverlayItem } from '@canvas-kit/viewer';
import { UWidget } from '@iyulab/u-widgets/react';
import '@iyulab/u-widgets';
// u-widgets keeps chart.* behind this opt-in subpath (echarts is an optional peer dep) so
// consumers who don't need charts avoid the bundle cost. Without this import, a node whose
// widget.type starts with "chart." silently renders as an "Unknown widget" fallback instead of
// the chart — this renderer doesn't otherwise restrict which widget types a document can use, so
// it opts every u-widgets entry point in rather than special-casing chart.* as excluded.
import '@iyulab/u-widgets/charts';
import type { ResolvedViewDocument } from '../resolve-document.js';
import type { ConnectionQuality } from '../adapter.js';
import { DEFAULT_NODE_WIDTH, DEFAULT_NODE_HEIGHT } from '../layout-defaults.js';

// Worst-first: a node with several bindings shows whichever one needs the operator's attention
// most (ISA-18.2 alarm-precedence convention — the least-current binding governs the indicator).
const QUALITY_SEVERITY: Record<ConnectionQuality, number> = { live: 0, stale: 1, disconnected: 2 };

function worstQuality(quality: Record<string, ConnectionQuality>): ConnectionQuality | undefined {
  const values = Object.values(quality);
  if (values.length === 0) return undefined;
  return values.reduce((worst, q) => (QUALITY_SEVERITY[q] > QUALITY_SEVERITY[worst] ? q : worst));
}

// `live` is deliberately unstyled (ISA-101 — color is reserved for abnormal state, not spent on
// normal operation) and a widget with no bindings at all gets no frame. `stale`/`disconnected`
// also use distinct border *styles* (dashed vs. dotted), not just distinct colors, so a
// colorblind viewer — or anyone on a touch device without a hover tooltip — can still tell the
// two abnormal states apart without relying on color perception at all.
const QUALITY_FRAME_STYLE: Partial<Record<ConnectionQuality, CSSProperties>> = {
  stale: { border: '2px dashed #f59e0b', boxSizing: 'border-box' },
  disconnected: { border: '2px dotted #6b7280', boxSizing: 'border-box' },
};

const QUALITY_LABEL: Partial<Record<ConnectionQuality, string>> = {
  stale: 'stale — showing last known value',
  disconnected: 'disconnected — no value has been reached',
};

// Standard visually-hidden ("sr-only") technique: present in the accessibility tree, invisible
// on screen. Kept off the frame `<div>` itself and off `UWidget` — each `uw-*` custom element
// already renders its own role (e.g. `role="list"`/`"meter"`/`"img"`) inside its shadow root, and
// a `title` attribute or a border-style change carries no text for `aria-live` to observe. This
// sibling node exists purely to hold the announced text in the light DOM, next to (not wrapping)
// the widget, so it can't collide with either.
const VISUALLY_HIDDEN_STYLE: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

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
  const overlays: ViewerOverlayItem[] = doc.nodes.map(node => {
    const quality = worstQuality(node.widget.quality);
    const frameStyle = quality ? QUALITY_FRAME_STYLE[quality] : undefined;
    const label = quality ? QUALITY_LABEL[quality] : undefined;

    return {
      id: node.id,
      x: node.x,
      y: node.y,
      width: node.width ?? DEFAULT_NODE_WIDTH,
      height: node.height ?? DEFAULT_NODE_HEIGHT,
      content: (
        <div style={{ width: '100%', height: '100%', ...frameStyle }} title={label}>
          <UWidget spec={{ widget: node.widget.type, ...node.widget.props }} />
          <span role="status" aria-live="polite" style={VISUALLY_HIDDEN_STYLE}>
            {label ?? ''}
          </span>
        </div>
      ),
    };
  });

  return { scene, overlays };
}
