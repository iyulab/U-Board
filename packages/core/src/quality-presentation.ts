import type { CSSProperties } from 'react';
import type { ConnectionQuality } from './adapter.js';

// `live` is deliberately unstyled (ISA-101 — color is reserved for abnormal state, not spent on
// normal operation) and a widget with no bindings at all gets no frame. `stale`/`disconnected`
// also use distinct border *styles* (dashed vs. dotted), not just distinct colors, so a
// colorblind viewer — or anyone on a touch device without a hover tooltip — can still tell the
// two abnormal states apart without relying on color perception at all.
export const QUALITY_FRAME_STYLE: Partial<Record<ConnectionQuality, CSSProperties>> = {
  stale: { border: '2px dashed #f59e0b', boxSizing: 'border-box' },
  disconnected: { border: '2px dotted #6b7280', boxSizing: 'border-box' },
};

export const QUALITY_LABEL: Partial<Record<ConnectionQuality, string>> = {
  stale: 'stale — showing last known value',
  disconnected: 'disconnected — no value has been reached',
};

// Worst-first: a node with several bindings shows whichever one needs the operator's attention
// most (ISA-18.2 alarm-precedence convention — the least-current binding governs the indicator).
const QUALITY_SEVERITY: Record<ConnectionQuality, number> = { live: 0, stale: 1, disconnected: 2 };

export function worstQuality(quality: Record<string, ConnectionQuality>): ConnectionQuality | undefined {
  const values = Object.values(quality);
  if (values.length === 0) return undefined;
  return values.reduce((worst, q) => (QUALITY_SEVERITY[q] > QUALITY_SEVERITY[worst] ? q : worst));
}

/**
 * A widget's title/tooltip and screen-reader announcement. When only one binding is abnormal,
 * this is just that binding's label (unchanged from the single-binding case). Once more than one
 * binding is at fault, the worst-first frame collapses them to one indicator — so this breaks
 * them back out per property, grouped by quality (worst first), keyed by the binding's own prop
 * path (e.g. `data.threshold`). Otherwise a binding that never reaches the widget's displayed
 * value (an unused threshold, say) can mark an otherwise-live widget "disconnected" with no way
 * to see why (BD-20260828-03 — ISA-18.2 alarm-rationalization: alarms should be configured on
 * the best indicator of root cause, not merged into the single most severe symptom).
 */
export function qualityTooltip(quality: Record<string, ConnectionQuality>): string | undefined {
  const worst = worstQuality(quality);
  if (!worst) return undefined;
  const baseLabel = QUALITY_LABEL[worst];
  if (!baseLabel) return undefined;

  const abnormal = Object.entries(quality).filter(([, q]) => q !== 'live') as [string, ConnectionQuality][];
  if (abnormal.length <= 1) return baseLabel;

  return (['disconnected', 'stale'] as const)
    .map(q => {
      const keys = abnormal.filter(([, eq]) => eq === q).map(([key]) => key);
      return keys.length > 0 ? `${QUALITY_LABEL[q]} (${keys.join(', ')})` : undefined;
    })
    .filter((entry): entry is string => entry !== undefined)
    .join(' · ');
}
