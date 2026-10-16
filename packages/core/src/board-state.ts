import type { ConnectionQuality, QualityReason } from './adapter.js';
import { worstQuality } from './quality-text.js';
import { placedIn } from './view-document.js';
import type { ResolvedViewDocument } from './resolve-document.js';

/**
 * What a board shows now, part by part — computed from its definition and its bindings’ readings, published beside the
 * definition and never written into it. It carries no value: the data belongs to its source; this says what the board
 * makes of it. A program watching a board reads this instead of the picture — and reads `evaluatedAt` with it, since a
 * state nobody has computed lately says nothing about now. When a part entered its state is not here: that is memory,
 * kept only where a board is evaluated continuously.
 */
export interface BoardState {
  /** When it was computed (ISO 8601). */
  evaluatedAt: string;
  /** The revision of the definition it was computed from, when whoever computed it knows it. */
  revision?: number;
  /** Each placed widget — a canvas node or a grid item — by its id. */
  parts: Record<string, PartState>;
}

/** One part of a `BoardState`. Each field is left out when it does not apply. */
export interface PartState {
  /** The state it is in (`StateRule`). */
  state?: string;
  /** The worst connection quality among its bindings. Absent: it has none. */
  quality?: ConnectionQuality;
  /** Why it is not `live`, when a binding of that quality reported a cause. */
  reason?: QualityReason;
  /** The oldest time a value of it was observed at (ISO 8601) — how old its data is. */
  observedAt?: string;
}

/** The `BoardState` of a resolved document, as of `now` (epoch milliseconds). */
export function boardStateOf(doc: ResolvedViewDocument, { now, revision }: { now: number; revision?: number }): BoardState {
  const parts: Record<string, PartState> = {};
  for (const placed of placedIn(doc)) {
    const { quality, reasons = {}, observedAt = {} } = placed.widget;
    const part: PartState = {};
    if (placed.state !== undefined) part.state = placed.state;
    const worst = worstQuality(quality);
    if (worst !== undefined) part.quality = worst;
    const cause = worst !== undefined && worst !== 'live' ? Object.keys(quality).find(path => quality[path] === worst && reasons[path]) : undefined;
    if (cause !== undefined) part.reason = reasons[cause];
    const oldest = Object.values(observedAt)
      .filter(time => !Number.isNaN(Date.parse(time)))
      .sort((a, b) => Date.parse(a) - Date.parse(b))[0];
    if (oldest !== undefined) part.observedAt = oldest;
    parts[placed.id] = part;
  }
  return { evaluatedAt: new Date(now).toISOString(), ...(revision !== undefined && { revision }), parts };
}
