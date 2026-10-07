import type { Widget, ValueMap } from './view-document.js';

/**
 * A pluggable resolver for one specific external system's values (docs/concepts.md — "Adapter").
 * The core binding surface stays generic: this interface knows nothing about any particular
 * system (a CMMS, or otherwise) — that knowledge lives entirely inside a concrete Adapter.
 */
export interface Adapter {
  /** Matches a Binding's `adapter` field to select which Adapter resolves it. */
  readonly id: string;
  /** Resolves one binding's opaque `ref` to its current value. */
  resolve(ref: unknown): Promise<ResolvedBinding>;
}

/** How current a resolved binding's value is (docs/concepts.md — "Binding"). `live` — the
 * adapter reached the source system just now. `stale` — it could not reach the source, but is
 * showing a previously-live value as last-known. `disconnected` — no value has ever been
 * reached (no matching adapter, or the source has never resolved). SCADA/HMI practice treats
 * these as distinct operator-facing states rather than one binary flag — a renderer decides how
 * to show each. */
export type ConnectionQuality = 'live' | 'stale' | 'disconnected';

/** Why a binding is not `live`, when the adapter can tell — each names a different fix, so an
 * operator reading "disconnected" knows whom to call. `transport` — the source could not be reached
 * (network, timeout, server error). `auth` — the source refused the credentials. `address` — the
 * source answered, but not with what the binding points at (unknown path, empty result, renamed
 * field): the binding, not the network, needs attention. `throttled` — requests are being rate
 * limited. It annotates `quality` and never changes it. */
export type QualityReason = 'transport' | 'auth' | 'address' | 'throttled';

export interface ResolvedBinding {
  value: unknown;
  quality: ConnectionQuality;
  /** Why `quality` is not `live`, if the adapter knows. Ignored on a `live` reading. */
  reason?: QualityReason;
  /** When `value` was obtained from the source (ISO 8601), if the adapter knows — the time of
   * this reading when `live`, the time of the last successful one when `stale`. It tells a
   * last-known value of seconds ago from one of days ago. Ignored on a `disconnected` reading. */
  observedAt?: string;
}

export interface ResolvedWidget {
  /** Carried through unchanged from the source Widget — resolution only touches `props`, and a
   * renderer still needs to know which widget kind to hand these props to. */
  type: string;
  /** The widget's static `props` merged with every binding whose reading has a value to show —
   * `live` or `stale`. A `disconnected` binding leaves its static value (or absence) in place. */
  props: Record<string, unknown>;
  /** Connection quality per bound prop key. A key is present only for props that had a
   * binding — unbound (static-only) props carry no entry, since quality doesn't apply to them. */
  quality: Record<string, ConnectionQuality>;
  /** Why a bound prop is not `live`, per prop path, for the bindings whose adapter reported a
   * cause. Absent when none did — a binding with no matching adapter, or whose adapter rejected,
   * carries no cause: the core cannot tell a misconfiguration from a host that did not wire it. */
  reasons?: Record<string, QualityReason>;
  /** When each bound prop's value was obtained from its source (ISO 8601), per prop path, for the
   * `live` and `stale` bindings whose adapter reported it. Absent when none did. */
  observedAt?: Record<string, string>;
}

/**
 * Resolves every binding on a widget against the given adapters, producing the props a renderer
 * hands to the widget library plus per-prop connection quality. A binding whose adapter id
 * doesn't match any given Adapter — or whose adapter rejects instead of returning a result (a
 * network timeout, for example) — is reported `disconnected` and its prop is left at whatever
 * static value (or absence) it already had, never overwritten with a missing value. The same holds
 * when the adapter itself reports `disconnected`: its reason is recorded, its value is not merged. One
 * binding's adapter failing never fails the others: connectivity problems are data to show, not
 * exceptions to propagate — a widget that can't reach its source should render disconnected, not
 * take the rest of the document down with it. A `stale` reading only ever comes from the adapter
 * itself — `resolveWidget`
 * has no memory of past calls, so it cannot infer staleness on its own.
 *
 * A binding key may be a dotted path (e.g. `"data.status"`) to reach a field nested inside a
 * widget library's own config shape (u-widgets nests bindable fields under `data`) — resolution
 * writes into that path without disturbing the rest of the object it lives in. A numeric segment
 * indexes into an array that is already there (`"items.1.value"`).
 */
export async function resolveWidget(
  widget: Widget,
  adapters: readonly Adapter[]
): Promise<ResolvedWidget> {
  const props = { ...widget.props };
  const quality: Record<string, ConnectionQuality> = {};
  const reasons: Record<string, QualityReason> = {};
  const observedAt: Record<string, string> = {};

  const bindingEntries = Object.entries(widget.bindings ?? {});
  await Promise.all(
    bindingEntries.map(async ([propPath, binding]) => {
      const adapter = adapters.find(a => a.id === binding.adapter);
      if (!adapter) {
        quality[propPath] = 'disconnected';
        return;
      }
      try {
        const resolved = await adapter.resolve(binding.ref);
        // Only a reading that has a value to show replaces the static one: `live` is current,
        // `stale` is the last-known value by definition. A `disconnected` reading has none — any
        // `value` it carries is meaningless — so the author's placeholder stays.
        if (resolved.quality !== 'disconnected') {
          setPath(props, propPath, binding.map ? applyValueMap(binding.map, resolved.value) : resolved.value);
        }
        quality[propPath] = resolved.quality;
        if (resolved.reason && resolved.quality !== 'live') reasons[propPath] = resolved.reason;
        if (resolved.observedAt && resolved.quality !== 'disconnected') observedAt[propPath] = resolved.observedAt;
      } catch {
        quality[propPath] = 'disconnected';
      }
    })
  );

  const result: ResolvedWidget = { type: widget.type, props, quality };
  if (Object.keys(reasons).length > 0) result.reasons = reasons;
  if (Object.keys(observedAt).length > 0) result.observedAt = observedAt;
  return result;
}

/** The value `map` gives `value` (`Binding.map`): the entry for the value's text when it is a
 * string, number, boolean or `null`; else the first range a numeric value falls in; else
 * `otherwise`; else the value unchanged. */
export function applyValueMap(map: ValueMap, value: unknown): unknown {
  // A document is not always validated before it is resolved; a map that is not one changes nothing.
  if (!isObject(map)) return value;
  const key = value === null || ['string', 'number', 'boolean'].includes(typeof value) ? String(value) : undefined;
  if (key !== undefined && isObject(map.values) && Object.hasOwn(map.values, key)) return map.values[key];
  const n = numericValue(value);
  if (n !== undefined && Array.isArray(map.ranges)) {
    const range = map.ranges.find(r => inRange(r, n));
    if (range) return range.value;
  }
  return 'otherwise' in map ? map.otherwise : value;
}

/** Whether `n` falls in `range` — `min` included, `max` not. A range with no numeric bound holds nothing. */
function inRange(range: unknown, n: number): boolean {
  if (!isObject(range)) return false;
  const min = typeof range.min === 'number' ? range.min : undefined;
  const max = typeof range.max === 'number' ? range.max : undefined;
  if (min === undefined && max === undefined) return false;
  return (min === undefined || n >= min) && (max === undefined || n < max);
}

const isObject = (v: unknown): v is Record<string, any> => typeof v === 'object' && v !== null;

/** Text that is a number written in decimal — `92.5`, `-3`, `.5`, `1e3` — with spaces around it
 *  allowed. Not `0x10` or `0b11`, which `Number` would also read. */
const DECIMAL = /^\s*[+-]?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?\s*$/i;

/** The number a source value stands for: a finite number, or decimal text (`" 92.5 "`) — sources
 * often send decimals as text. Booleans, `null`, empty text and other notations are not numbers here. */
function numericValue(value: unknown): number | undefined {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value !== 'string' || !DECIMAL.test(value)) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

/** Sets `path` (dot-separated) on `target`, copying each object or array along the way so the
 * caller's original nested values are never mutated in place. A segment that lands on an existing
 * array indexes into a copy of it, so `items.1.v` updates one element and keeps the array an array. */
function setPath(target: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split('.');
  let cursor: Record<string, unknown> = target;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    const existing = cursor[key];
    const next = Array.isArray(existing)
      ? [...existing]
      : typeof existing === 'object' && existing !== null
        ? { ...(existing as Record<string, unknown>) }
        : {};
    cursor[key] = next;
    cursor = next as Record<string, unknown>;
  }
  cursor[keys[keys.length - 1]] = value;
}
