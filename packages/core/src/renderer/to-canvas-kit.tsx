import { Scene } from '@canvas-kit/core';
import type { ViewerOverlayItem } from '@canvas-kit/viewer';
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
// fetched in parallel, so it no longer blocks parsing/evaluating the app's main chunk. A chart node
// drawn before it arrives shows u-widgets' "module not loaded" card for that moment, and the
// widget re-renders itself once the entry registers — nothing here has to render again.
void import('@iyulab/u-widgets/charts');
import type { ResolvedCanvasView } from '../resolve-document.js';
import { DEFAULT_NODE_WIDTH, DEFAULT_NODE_HEIGHT } from '../layout-defaults.js';
import { DEFAULT_QUALITY_TEXT, type QualityText } from '../quality-text.js';
import { decorationObjects } from './decoration-drawing.js';
import { NodeFrame } from './node-frame.js';
import { captionObjects, connectorObjects, placeOnCanvas } from './connector-drawing.js';
import { connectorMark } from './connector-mark.js';

/** Widgets sit on the board — its background drawing, or the board's paper — not on the page around
 * it, so they take the board's palette (`appearance`, light by default) whatever the system or page
 * theme. A dark page still gets dark controls around a light board; the board reads like a drawing. */

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
 * background and connectors, and an overlay list for the Viewer to position in scene coordinates —
 * each node's widget, then each connector's display-only mark (`connectorMark`). This is the renderer half of the editor/renderer separation
 * (docs/principles.md) — it depends on canvas-kit and u-widgets so the document format itself
 * doesn't have to.
 */
export function toCanvasKit(doc: ResolvedCanvasView, { qualityText = DEFAULT_QUALITY_TEXT, now, locale }: ToCanvasKitOptions = {}): CanvasKitRenderOutput {
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
    for (const object of decorationObjects(shape, doc.appearance)) scene.add(object);
  }

  for (const object of connectorObjects(doc.nodes, doc.connectors, doc.appearance)) scene.add(object);
  for (const object of captionObjects(doc.nodes, doc.appearance)) scene.add(object);

  const at = now ?? Date.now();
  const overlays: ViewerOverlayItem[] = doc.nodes.map(node => ({
    id: node.id,
    x: node.x,
    y: node.y,
    width: node.width ?? DEFAULT_NODE_WIDTH,
    height: node.height ?? DEFAULT_NODE_HEIGHT,
    // A widget takes its node's box exactly — the box the author drew is the layout.
    content: <NodeFrame widget={node.widget} appearance={doc.appearance} accent={doc.accent} qualityText={qualityText} now={at} locale={locale} elements={doc.elements} nodeId={node.id} />,
  }));
  for (const placed of placeOnCanvas(doc.nodes, doc.connectors)) overlays.push(connectorMark(placed, qualityText, at));

  return { scene, overlays };
}
