import type { CSSProperties } from 'react';
import type { ConnectionQuality } from './adapter.js';
import { worstQuality } from './quality-text.js';
import { getPrimaryDataField } from '@iyulab/u-widgets';

// `live` is deliberately unstyled (ISA-101 — color is reserved for abnormal state, not spent on
// normal operation) and a widget with no bindings at all gets no frame. `stale`/`disconnected`
// also use distinct border *styles* (dashed vs. dotted), not just distinct colors, so a
// colorblind viewer — or anyone on a touch device without a hover tooltip — can still tell the
// two abnormal states apart without relying on color perception at all.
// The colors are `--ub-quality-stale` / `--ub-quality-disconnected` when a host defines them.
export const QUALITY_FRAME_STYLE: Partial<Record<ConnectionQuality, CSSProperties>> = {
  stale: { border: '2px dashed var(--ub-quality-stale, #f59e0b)', boxSizing: 'border-box' },
  disconnected: { border: '2px dotted var(--ub-quality-disconnected, #6b7280)', boxSizing: 'border-box' },
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
  const primaryField = getPrimaryDataField(widgetType);
  if (primaryField === undefined) return worstQuality(quality);
  return quality[`data.${primaryField}`];
}
