import type { Binding, Derive, ItemField, Widget, ValueMap } from './view-document.js';
import { formatValue, parseTemplate } from './elements/template.js';
import { getByPointer } from './json-patch.js';

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
  /** Where this adapter's data comes from, as its source asks to be named — an agency and its open-data
   * portal, a weather service. A viewer names it under every board that binds to this adapter, since a
   * source's license often makes that a condition of use. Omitted, nothing is shown. */
  readonly attribution?: Attribution;
  /** Whether this adapter's values are example data, not a live source's — a board that binds to it says so under it,
   * so no one reads made-up figures as real ones. Omitted: live. */
  readonly sample?: boolean;
}

/** How a data source is named where its data is shown (`Adapter.attribution`). */
export interface Attribution {
  /** The credit as the source words it, e.g. "Seoul Open Data Plaza (KOGL Type 1)". */
  text: string;
  /** Where it links — the source's site or the dataset's page. http(s) only; anything else is shown as text. */
  url?: string;
}

/** How current a resolved binding's value is (docs/concepts.md — "Binding"). `live` — the
 * adapter reached the source system just now. `stale` — the value shown is not current: the adapter
 * could not reach the source and shows the last-known value, or the source's latest value is older
 * than the binding expects (`lagging`). `disconnected` — no value has ever been
 * reached (no matching adapter, or the source has never resolved). SCADA/HMI practice treats
 * these as distinct operator-facing states rather than one binary flag — a renderer decides how
 * to show each. */
export type ConnectionQuality = 'live' | 'stale' | 'disconnected';

/** Why a binding is not `live`, when the adapter can tell — each names a different fix, so an
 * operator reading "disconnected" knows whom to call. `transport` — the source could not be reached
 * (network, timeout, server error). `auth` — the source refused the credentials. `address` — the
 * source answered, but not with what the binding points at (unknown path, empty result, renamed
 * field): the binding, not the network, needs attention. `format` — the source answered in a form the
 * binding cannot read (XML or HTML where JSON was needed): how it is asked, not what it points at, needs
 * attention. `source` — the source answered with success but said in its answer that it could not serve the
 * request (a key it does not accept, a query it rejects, a quota): what it said is the fix, read it.
 * `throttled` — requests are being rate limited. `lagging` — the source answered, but its latest
 * value is older than the binding expects of it: the source has stopped or fallen behind updating, not the
 * network or the binding. It annotates `quality` and never changes it. `pending` — the source is being read and has
 * not answered yet, with no earlier answer to show meanwhile (a slow source, the first time a board reads it): wait,
 * nothing needs fixing. */
export type QualityReason = 'transport' | 'auth' | 'address' | 'format' | 'source' | 'throttled' | 'lagging' | 'pending';

export interface ResolvedBinding {
  value: unknown;
  quality: ConnectionQuality;
  /** Why `quality` is not `live`, if the adapter knows. Ignored on a `live` reading. */
  reason?: QualityReason;
  /** What went wrong, in words for whoever fixes it — for `source`, what the source itself said. Only for
   *  someone who can change the binding or its data source: an adapter serving the public leaves it out.
   *  Ignored on a `live` reading. */
  message?: string;
  /** When `value` was observed (ISO 8601), if the adapter knows — the time the source says it
   * observed the value when it says so (an HTTP reference's `observedAtPath`), else when the response says it was
   * made, else the time it was read; for `stale`, that of the last successful reading. It tells a last-known value of seconds
   * ago from one of days ago. Ignored on a `disconnected` reading. */
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
  return (await resolveWidgetReadings(widget, adapters)).widget;
}

/** `resolveWidget`, with each binding’s reading as the source gave it (`ResolvedBindings.readings`) — what a part’s
 *  state is named from. */
export async function resolveWidgetReadings(
  widget: Widget,
  adapters: readonly Adapter[]
): Promise<{ widget: ResolvedWidget; readings: Record<string, unknown> }> {
  const { values: props, quality, reasons, observedAt, readings } = await resolveBindings({ ...widget.props }, widget.bindings, adapters);
  const resolved: ResolvedWidget = { type: widget.type, props, quality };
  if (Object.keys(reasons).length > 0) resolved.reasons = reasons;
  if (Object.keys(observedAt).length > 0) resolved.observedAt = observedAt;
  return { widget: resolved, readings };
}

/** What `resolveBindings` gives back: `values` with every readable binding written in, and per path how it read. */
export interface ResolvedBindings {
  values: Record<string, unknown>;
  quality: Record<string, ConnectionQuality>;
  reasons: Record<string, QualityReason>;
  observedAt: Record<string, string>;
  /** Per path, the value read from the source — before the binding’s `map` and before `accept` — for the readings
   *  that had one (`live` or `stale`). What a state is named from (`StateRule.from`). */
  readings: Record<string, unknown>;
}

/**
 * The one binding resolution, for whatever carries bindings — a widget's props, a connector's label and style: each
 * binding read through its adapter and, when the reading has a value (`live` or `stale`), written at its dotted path
 * into `values` (after `map`); `accept` may refuse a value for a path, which then keeps its static value. Failures are
 * qualities, never exceptions — see `resolveWidget`.
 */
export async function resolveBindings(
  values: Record<string, unknown>,
  bindings: Record<string, Binding> | undefined,
  adapters: readonly Adapter[],
  accept: (path: string, value: unknown) => unknown = (_path, value) => value
): Promise<ResolvedBindings> {
  const quality: Record<string, ConnectionQuality> = {};
  const reasons: Record<string, QualityReason> = {};
  const observedAt: Record<string, string> = {};
  const readings: Record<string, unknown> = {};
  const props = values;

  const bindingEntries = Object.entries(bindings ?? {});
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
        // `at` reads inside the value; nothing there means the binding points at what the source does not have.
        let read = resolved.value;
        if (binding.at !== undefined && resolved.quality !== 'disconnected') {
          try {
            read = getByPointer(resolved.value, binding.at);
          } catch {
            quality[propPath] = 'disconnected';
            reasons[propPath] = 'address';
            return;
          }
        }
        if (resolved.quality !== 'disconnected') {
          if (binding.derive !== undefined) {
            const derived = deriveValue(binding.derive, read);
            if (derived === undefined) {
              quality[propPath] = 'disconnected';
              reasons[propPath] = 'address';
              return;
            }
            read = derived;
          }
          readings[propPath] = read;
          const mapped = binding.map ? applyValueMap(binding.map, read) : read;
          const gained = binding.itemFields ? withItemFields(binding.itemFields, mapped) : mapped;
          const value = accept(propPath, typeof binding.text === 'string' ? writeText(binding.text, gained) : gained);
          if (value !== undefined) setPath(props, propPath, value);
        }
        quality[propPath] = resolved.quality;
        if (resolved.reason && resolved.quality !== 'live') reasons[propPath] = resolved.reason;
        if (resolved.observedAt && resolved.quality !== 'disconnected') observedAt[propPath] = resolved.observedAt;
      } catch {
        quality[propPath] = 'disconnected';
      }
    })
  );
  return { values: props, quality, reasons, observedAt, readings };
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

/**
 * The number a list reduces to (`Binding.derive`): how many items there are, or the sum, smallest, largest or mean of a field of
 * them — over the items whose fields equal `where`. An item's field that is not a number is left out; the sum and the count
 * of nothing are 0, the smallest, largest and mean of nothing are `undefined`. A value that is not a list reduces to nothing.
 */
export function deriveValue(derive: Derive, value: unknown): number | undefined {
  if (!Array.isArray(value) || !isObject(derive)) return undefined;
  const read = (item: unknown, from: string): unknown => {
    if (!isObject(item)) return undefined;
    if (!from.startsWith('/')) return (item as Record<string, unknown>)[from];
    try {
      return getByPointer(item, from);
    } catch {
      return undefined;
    }
  };
  const where = isObject(derive.where) ? Object.entries(derive.where) : [];
  const kept = value.filter(item => where.every(([from, equals]) => String(read(item, from)) === String(equals)));
  if (derive.op === 'count') return kept.length;
  if (typeof derive.field !== 'string') return undefined;
  const numbers = kept.map(item => numericValue(read(item, derive.field!))).filter((n): n is number => n !== undefined);
  if (derive.op === 'sum') return numbers.reduce((a, b) => a + b, 0);
  if (numbers.length === 0) return undefined;
  if (derive.op === 'min') return Math.min(...numbers);
  if (derive.op === 'max') return Math.max(...numbers);
  if (derive.op === 'avg') return numbers.reduce((a, b) => a + b, 0) / numbers.length;
  return undefined;
}

/** A list `value` whose items have gained `fields` (`Binding.itemFields`): each the value of the item's `from` field — a
 *  key, or a JSON Pointer when it starts with `/` — mapped when the field has a map. A field the item does not have
 *  gains nothing to show. A value that is not a list, and an item that is not an object, are left as they are. */
export function withItemFields(fields: Record<string, ItemField>, value: unknown): unknown {
  if (!isObject(fields)) return value;
  const entries = Object.entries(fields).filter(([, f]) => isObject(f) && typeof f.from === 'string');
  const read = (item: Record<string, any>, from: string): unknown => {
    if (!from.startsWith('/')) return item[from];
    try {
      return getByPointer(item, from);
    } catch {
      return undefined;
    }
  };
  const gain = (item: unknown) => (isObject(item) && !Array.isArray(item)
    ? { ...item, ...Object.fromEntries(entries.map(([name, f]) => [name, f.map ? applyValueMap(f.map, read(item, f.from)) : read(item, f.from)])) }
    : item);
  return Array.isArray(value) ? value.map(gain) : gain(value);
}

/** `value` written into `text` (`Binding.text`): each `{{field}}` the value's field — `{{.}}` the value — in a template
 *  element's value grammar; a field it does not have is empty. A text that is not one (a section, an unclosed hole)
 *  is returned as it is. */
export function writeText(text: string, value: unknown): string {
  const parsed = parseTemplate(text);
  if (!parsed.ok) return text;
  return parsed.nodes.map(node => {
    if (node.kind === 'text') return node.text;
    if (node.kind !== 'value') return '';
    const found = node.path === '.' ? value : node.path.split('.').reduce<unknown>((at, step) => (isObject(at) ? at[step] : undefined), value);
    const shown = formatValue(found, node);
    return shown === undefined || shown === null ? '' : String(shown);
  }).join('');
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
