import type { ConnectionQuality, QualityReason } from './adapter.js';

// Text for connection quality — renderer-agnostic, so it lives with the domain layer and is
// exported from it: a host rendering its own UI explains a binding's state with the same words the
// shipped renderer uses. How a state *looks* (frame styles) stays with the renderer
// (quality-presentation.ts).

/** Text for each abnormal quality. `live` has none — normal operation is not announced (ISA-101). */
export const QUALITY_LABEL: Partial<Record<ConnectionQuality, string>> = {
  stale: 'stale — showing last known value',
  disconnected: 'disconnected — no value has been reached',
};

/** Text for each cause an adapter can report. */
// The cause, when an adapter reported one — text only. It changes whom an operator calls, not how
// urgent the state is, so it gets no frame style of its own (ISA-101, as above).
export const REASON_LABEL: Record<QualityReason, string> = {
  transport: 'data source unreachable',
  auth: 'credentials refused',
  address: 'bound value not found at the source',
  throttled: 'rate limited',
};

/** The words `describeQuality` builds its text from — pass your own to describe quality in another
 * language. `quality` needs text for the abnormal states only (`live` is never described). */
export interface QualityText {
  quality: Partial<Record<ConnectionQuality, string>>;
  reason: Record<QualityReason, string>;
}

/** The English text the shipped renderer uses unless given other `QualityText`. */
export const DEFAULT_QUALITY_TEXT: QualityText = { quality: QUALITY_LABEL, reason: REASON_LABEL };

// Worst-first: a node with several bindings shows whichever one needs the operator's attention
// most (ISA-18.2 alarm-precedence convention — the least-current binding governs the indicator).
const QUALITY_SEVERITY: Record<ConnectionQuality, number> = { live: 0, stale: 1, disconnected: 2 };

/** The least current quality among a widget's bindings (`disconnected` > `stale` > `live`), or
 * `undefined` when it has no bindings. */
export function worstQuality(quality: Record<string, ConnectionQuality>): ConnectionQuality | undefined {
  const values = Object.values(quality);
  if (values.length === 0) return undefined;
  return values.reduce((worst, q) => (QUALITY_SEVERITY[q] > QUALITY_SEVERITY[worst] ? q : worst));
}

/**
 * One line of text describing a widget's connection quality — what the shipped renderer uses as a
 * node's title/tooltip and screen-reader announcement, and what a host rendering its own UI can
 * show the same way. `undefined` when every binding is `live` (or there are none). When only one
 * binding is abnormal, this is that binding's label, plus its cause if the adapter reported one. Once more than one
 * binding is at fault, the worst-first frame collapses them to one indicator — so this breaks
 * them back out per property, grouped by quality (worst first), keyed by the binding's own prop
 * path (e.g. `data.threshold`). Otherwise a binding that never reaches the widget's displayed
 * value (an unused threshold, say) can mark an otherwise-live widget "disconnected" with no way
 * to see why (ISA-18.2 alarm rationalization: alarms should be configured on
 * the best indicator of root cause, not merged into the single most severe symptom).
 *
 * `text` supplies the words (English by default — `DEFAULT_QUALITY_TEXT`).
 */
export function describeQuality(
  quality: Record<string, ConnectionQuality>,
  reasons: Record<string, QualityReason> = {},
  text: QualityText = DEFAULT_QUALITY_TEXT
): string | undefined {
  const worst = worstQuality(quality);
  if (!worst) return undefined;
  const baseLabel = text.quality[worst];
  if (!baseLabel) return undefined;

  const abnormal = Object.entries(quality).filter(([, q]) => q !== 'live') as [string, ConnectionQuality][];
  if (abnormal.length <= 1) {
    const reason = abnormal[0] && reasons[abnormal[0][0]];
    return reason ? `${baseLabel} (${text.reason[reason]})` : baseLabel;
  }

  return (['disconnected', 'stale'] as const)
    .map(q => {
      const keys = abnormal
        .filter(([, eq]) => eq === q)
        .map(([key]) => (reasons[key] ? `${key}: ${text.reason[reasons[key]]}` : key));
      return keys.length > 0 ? `${text.quality[q]} (${keys.join(', ')})` : undefined;
    })
    .filter((entry): entry is string => entry !== undefined)
    .join(' · ');
}
