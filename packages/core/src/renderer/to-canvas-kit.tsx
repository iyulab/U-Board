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
// fetched in parallel, so it no longer blocks parsing/evaluating the app's main chunk. A chart node
// drawn before it arrives shows u-widgets' "module not loaded" card for that moment, and the
// widget re-renders itself once the entry registers — nothing here has to render again.
void import('@iyulab/u-widgets/charts');
import type { ResolvedViewDocument } from '../resolve-document.js';
import { DEFAULT_NODE_WIDTH, DEFAULT_NODE_HEIGHT } from '../layout-defaults.js';
import { QUALITY_BADGE_STYLE, QUALITY_FRAME_STYLE, frameBinding } from '../quality-presentation.js';
import { describeQuality, DEFAULT_QUALITY_TEXT, type QualitySummary, type QualityText } from '../quality-text.js';
import { onBoard } from './board-appearance.js';

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

const WIDGET_FILL_STYLE: CSSProperties = { width: '100%', height: '100%' };

// The visible half of a node's quality, for a screen nobody hovers over or listens to — a wall display.
// The frame tells how current the value is (by style as well as colour); this says why, and how old
// it is, in a few words on a tag just above the frame's top-left corner — outside the widget, so it
// covers none of it, and in full however narrow the node: cut to fit, the age (the part that matters
// most) would be the first to go. Hidden from assistive technology: the status region below announces
// the full text.
const BADGE_STYLE: CSSProperties = {
  position: 'absolute',
  left: 0,
  bottom: '100%',
  marginBottom: 2,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  padding: '1px 6px',
  borderRadius: 4,
  font: '600 11px/1.4 system-ui, sans-serif',
  pointerEvents: 'none',
  zIndex: 1,
};

/** The few words on a node's mark: the cause of its headline binding's state when the adapter gave
 *  one, else the state; for a stale value, how long ago it was obtained. */
function badgeText(widget: QualitySummary, key: string, text: QualityText, now: number): string | undefined {
  const quality = widget.quality[key];
  if (!quality || quality === 'live') return undefined;
  const reason = widget.reasons?.[key];
  const what = reason ? text.brief.reason[reason] : text.brief.quality[quality];
  if (!what) return undefined;
  const observed = quality === 'stale' && widget.observedAt?.[key] ? Date.parse(widget.observedAt[key]) : NaN;
  return Number.isNaN(observed) ? what : `${what} · ${text.age(now - observed)}`;
}

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
    scene.add(onBoard(shape, doc.appearance));
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
    const key = frameBinding(node.widget.quality, node.widget.type);
    const quality = key === undefined ? undefined : node.widget.quality[key];
    const frameStyle = quality ? QUALITY_FRAME_STYLE[quality] : undefined;
    const label = describeQuality(node.widget, { text: qualityText, now });
    const badge = key === undefined ? undefined : badgeText(node.widget, key, qualityText, now ?? Date.now());

    return {
      id: node.id,
      x: node.x,
      y: node.y,
      width: node.width ?? DEFAULT_NODE_WIDTH,
      height: node.height ?? DEFAULT_NODE_HEIGHT,
      content: (
        <div style={{ position: 'relative', width: '100%', height: '100%', ...frameStyle }} title={label}>
          {/* A widget takes its node's box exactly — the box the author drew is the layout. u-widgets fits
              a host height in both directions: a chart fills it and lays itself out compactly when small,
              media (a gauge, an image) scales down whole, and content that runs on (a table, a list)
              scrolls inside the node. Nothing spills over a neighbouring node. */}
          <UWidget spec={{ widget: node.widget.type, ...node.widget.props }} style={WIDGET_FILL_STYLE} theme={doc.appearance ?? 'light'} locale={locale} />
          {badge && quality && (
            <span aria-hidden="true" data-quality-badge="" style={{ ...BADGE_STYLE, ...QUALITY_BADGE_STYLE[quality] }}>
              {badge}
            </span>
          )}
          <span role="status" aria-live="polite" style={VISUALLY_HIDDEN_STYLE}>
            {label ?? ''}
          </span>
        </div>
      ),
    };
  });

  return { scene, overlays };
}
