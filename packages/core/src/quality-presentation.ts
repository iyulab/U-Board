import type { CSSProperties } from 'react';
import type { ConnectionQuality, QualityReason } from './adapter.js';
import { worstQuality } from './quality-text.js';
import { getPrimaryDataField } from '@iyulab/u-widgets';

// `live` is deliberately unstyled (ISA-101 — color is reserved for abnormal state, not spent on
// normal operation) and a widget with no bindings at all gets no frame. `stale`/`disconnected`
// also use distinct border *styles* (dashed vs. dotted), not just distinct colors, so a
// colorblind viewer — or anyone on a touch device without a hover tooltip — can still tell the
// two abnormal states apart without relying on color perception at all.
// The colors are `--ub-quality-stale` / `--ub-quality-disconnected` when a host defines them.
// The border style and colour of each, once: the frame reads them as CSS, and a part drawn as a point (a marker summarized on
// the canvas, which cannot read a CSS variable) reads them as an edge — so a far view says what a near one says.
export const QUALITY_EDGE = {
  stale: { dash: 'dashed', token: '--ub-quality-stale', fallback: '#f59e0b' },
  // A stale value whose source answered but is late (`lagging`) is the same amber — it is the same kind of «not current» — in a double
  // rule: «the last value, the source is not reachable» (dashed) and «the source has fallen behind» (double) are two things to do.
  lagging: { dash: 'double', token: '--ub-quality-stale', fallback: '#f59e0b' },
  disconnected: { dash: 'dotted', token: '--ub-quality-disconnected', fallback: '#6b7280' },
} as const;

/** How a quality is looked at: `stale` is two looks, by the reason the adapter gave — `lagging`, or any other (or none). */
export type QualityLook = ConnectionQuality | 'lagging';

/** The look of a value's quality, from the quality and the reason the adapter gave for it. */
export function qualityLook(quality: ConnectionQuality, reason?: QualityReason): QualityLook {
  return quality === 'stale' && reason === 'lagging' ? 'lagging' : quality;
}

/** The edge a value that is not current draws on a point: none for a current one or one with no quality known. */
export function qualityEdge(quality: ConnectionQuality | undefined, reason?: QualityReason): (typeof QUALITY_EDGE)[keyof typeof QUALITY_EDGE] | undefined {
  return quality === 'stale' || quality === 'disconnected' ? QUALITY_EDGE[qualityLook(quality, reason) as keyof typeof QUALITY_EDGE] : undefined;
}

export const QUALITY_FRAME_STYLE: Partial<Record<QualityLook, CSSProperties>> = {
  // 3px: a double rule needs room to show its two lines.
  lagging: { border: `3px ${QUALITY_EDGE.lagging.dash} var(${QUALITY_EDGE.lagging.token}, ${QUALITY_EDGE.lagging.fallback})`, boxSizing: 'border-box' },
  stale: { border: `2px ${QUALITY_EDGE.stale.dash} var(${QUALITY_EDGE.stale.token}, ${QUALITY_EDGE.stale.fallback})`, boxSizing: 'border-box' },
  disconnected: { border: `2px ${QUALITY_EDGE.disconnected.dash} var(${QUALITY_EDGE.disconnected.token}, ${QUALITY_EDGE.disconnected.fallback})`, boxSizing: 'border-box' },
};

/**
 * The quality that should drive a node's *frame* (border/color) — as opposed to `worstQuality`,
 * which `describeQuality` still uses to describe every abnormal binding for drill-down detail.
 * u-widgets knows, per widget type, which bound field is the headline value actually shown on
 * screen (`getPrimaryDataField`, e.g. `gauge`/`status` → `"value"`) — when that's known, only
 * that field's own connectivity should raise an alarm on the frame. A secondary binding (e.g. a
 * threshold config value) failing no longer marks an otherwise-live widget as "disconnected"
 * (the aircraft master-caution / individual-annunciator split: the frame is the
 * summary, `describeQuality`'s per-property breakdown remains the drill-down).
 *
 * Bindings are keyed by dotted prop path (`adapter.ts`), and u-widgets nests bindable fields
 * under `data` — so the primary field's binding key is always `data.<field>`.
 *
 * Widget types u-widgets has no fixed headline field for (`chart.*`, `table`, `list`, ... — free
 * user-defined mapping) fall back to `worstQuality` unchanged, preserving prior behavior for
 * anything this can't yet answer.
 */
export function frameQuality(
  quality: Record<string, ConnectionQuality>,
  widgetType: string
): ConnectionQuality | undefined {
  const key = frameBinding(quality, widgetType);
  return key === undefined ? undefined : quality[key];
}

/** The binding whose quality `frameQuality` reports — the headline field's when u-widgets names one
 *  for the widget type, else the least current binding's. `undefined` when there is none. */
export function frameBinding(quality: Record<string, ConnectionQuality>, widgetType: string): string | undefined {
  const primaryField = getPrimaryDataField(widgetType);
  if (primaryField !== undefined) {
    const key = `data.${primaryField}`;
    return key in quality ? key : undefined;
  }
  const worst = worstQuality(quality);
  return worst === undefined ? undefined : Object.keys(quality).find(key => quality[key] === worst);
}

/** The mark on a node whose headline value is not current: the frame's colour as its background,
 *  with text dark or light enough to read on it (the colours are the frame's, `QUALITY_FRAME_STYLE`). */
export const QUALITY_BADGE_STYLE: Partial<Record<ConnectionQuality, CSSProperties>> = {
  stale: { background: 'var(--ub-quality-stale, #f59e0b)', color: '#1f2937' },
  disconnected: { background: 'var(--ub-quality-disconnected, #6b7280)', color: '#ffffff' },
};
