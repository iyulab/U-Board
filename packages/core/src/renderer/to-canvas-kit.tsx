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
//
// Loaded dynamically rather than statically: echarts alone pushes a
// consuming app's bundle past Vite's 500kB single-chunk warning, even for documents that never
// use a chart.* widget. This still loads unconditionally on module init — no widget-type
// inspection, same "opt every entry point in" policy as a static import — but as its own chunk
// fetched in parallel, so it no longer blocks parsing/evaluating the app's main chunk.
//
// Unlike a plain custom element, `<u-widget>` decides *whether to even emit* a `<uw-chart>` tag
// with a one-shot `customElements.get('uw-chart')` check inside its own `render()`
// (u-widgets' `elements/u-widget.ts`) — it does not re-check on its own once `uw-chart` registers
// late, so a chart.* node whose `<u-widget>` already rendered before this import resolves would
// otherwise be stuck on the "Unknown widget" fallback forever. `chartsReady` lets a consumer force
// one more render pass after this resolves (AuthoringView/ViewerPage do) to pick it up.
export const chartsReady: Promise<unknown> = import('@iyulab/u-widgets/charts');
import type { ResolvedViewDocument } from '../resolve-document.js';
import { DEFAULT_NODE_WIDTH, DEFAULT_NODE_HEIGHT } from '../layout-defaults.js';
import { QUALITY_FRAME_STYLE, frameQuality } from '../quality-presentation.js';
import { describeQuality, DEFAULT_QUALITY_TEXT, type QualityText } from '../quality-text.js';

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

const WIDGET_FILL_STYLE: CSSProperties = { width: '100%', minHeight: '100%' };

/** Widgets sit on the board — its background drawing, or the board's light paper (`--ub-board-bg`) —
 * not on the page around it, so they take the light palette whatever the system or page theme. A
 * dark page still gets dark controls around the board; the board itself reads like a drawing. */
const BOARD_WIDGET_THEME = 'light';

export interface CanvasKitRenderOutput {
  scene: Scene;
  overlays: ViewerOverlayItem[];
}

export interface ToCanvasKitOptions {
  /** Words for each node's connection-quality tooltip and announcement (English by default). */
  qualityText?: QualityText;
  /** The time a stale value's age is measured to, in epoch milliseconds — `Date.now()` by default. */
  now?: number;
  /** The language the widgets speak (BCP 47) — the labels' `locale`. Left out, a widget follows the page's. */
  locale?: string;
}

/**
 * Translates a resolved View Document into canvas-kit primitives: a Scene holding the
 * background and connectors, and an overlay list for the Viewer to position each node's widget
 * in scene coordinates. This is the renderer half of the editor/renderer separation
 * (docs/principles.md) — it depends on canvas-kit and u-widgets so the document format itself
 * doesn't have to.
 */
export function toCanvasKit(doc: ResolvedViewDocument, { qualityText = DEFAULT_QUALITY_TEXT, now, locale }: ToCanvasKitOptions = {}): CanvasKitRenderOutput {
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

  for (const shape of doc.decorations ?? []) {
    scene.add(shape);
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
    const quality = frameQuality(node.widget.quality, node.widget.type);
    const frameStyle = quality ? QUALITY_FRAME_STYLE[quality] : undefined;
    const label = describeQuality(node.widget, { text: qualityText, now });

    return {
      id: node.id,
      x: node.x,
      y: node.y,
      width: node.width ?? DEFAULT_NODE_WIDTH,
      height: node.height ?? DEFAULT_NODE_HEIGHT,
      content: (
        <div style={{ width: '100%', height: '100%', ...frameStyle }} title={label}>
          {/* A widget fills its node: u-widgets grows into the height its host is given, and without
              one a chart keeps its own default and leaves the box half empty. A minimum, not a fixed
              height: in a box smaller than what a widget can draw in, the widget stays whole and
              extends past the box, rather than a chart's plot being pressed flat or a gauge cut off. */}
          <UWidget spec={{ widget: node.widget.type, ...node.widget.props }} style={WIDGET_FILL_STYLE} theme={BOARD_WIDGET_THEME} locale={locale} />
          <span role="status" aria-live="polite" style={VISUALLY_HIDDEN_STYLE}>
            {label ?? ''}
          </span>
        </div>
      ),
    };
  });

  return { scene, overlays };
}
