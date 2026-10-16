import { isTriggerLink, type Trigger } from './view-document.js';

/** Something that happened on a board, as a viewer reports it to `firedBy` — the same shapes a trigger's `on` takes. */
export type FiredEvent =
  | { event: 'click'; node: string }
  | { event: 'element'; node: string; name: string }
  | { event: 'enter' | 'leave'; node: string; state: string }
  | { event: 'open' };

/**
 * The triggers `event` fires, in document order: those whose `on` is that event — the same part, element event name or
 * state — and whose `when`, if any, holds for the parts' states now (`states`, by part id; a part without a state is in
 * none). A trigger naming a part the board does not place matches no event of that part, so a stale one does nothing.
 */
/** The element events a board's triggers listen for, by part id — which marked regions of a part's element do something,
 *  so a viewer makes those, and only those, reachable from the keyboard. */
export function elementListeners(triggers: readonly Trigger[] | undefined): Map<string, Set<string>> {
  const listened = new Map<string, Set<string>>();
  for (const { on } of triggers ?? []) {
    if (on.event !== 'element') continue;
    const names = listened.get(on.node) ?? new Set<string>();
    names.add(on.name);
    listened.set(on.node, names);
  }
  return listened;
}

export function firedBy(
  triggers: readonly Trigger[] | undefined,
  event: FiredEvent,
  states: Readonly<Record<string, string | undefined>>
): Trigger[] {
  return (triggers ?? []).filter(trigger => {
    const on = trigger.on;
    if (on.event !== event.event) return false;
    if ('node' in on && 'node' in event && on.node !== event.node) return false;
    if (on.event === 'element' && event.event === 'element' && on.name !== event.name) return false;
    if ((on.event === 'enter' || on.event === 'leave') && (event.event === 'enter' || event.event === 'leave') && on.state !== event.state) return false;
    if (!trigger.when) return true;
    const now = states[trigger.when.node];
    const wanted = Array.isArray(trigger.when.state) ? trigger.when.state : [trigger.when.state];
    return now !== undefined && wanted.includes(now);
  });
}

/**
 * The changes between two draws' part states as events — for each part whose state changed, `leave` the old one, then
 * `enter` the new one. A part seen for the first time (`before` is undefined, or has no entry for it) changes nothing:
 * a board just opened has not entered anything, and `open` is the event for that.
 */
export function stateChanges(
  before: Readonly<Record<string, string | undefined>> | undefined,
  after: Readonly<Record<string, string | undefined>>
): FiredEvent[] {
  if (!before) return [];
  const events: FiredEvent[] = [];
  for (const [node, state] of Object.entries(after)) {
    if (!Object.hasOwn(before, node)) continue;
    const was = before[node];
    if (was === state) continue;
    if (was !== undefined) events.push({ event: 'leave', node, state: was });
    if (state !== undefined) events.push({ event: 'enter', node, state });
  }
  return events;
}

/**
 * The address a trigger's `open-link` opens: its `url` with `{{node}}`, `{{state}}` and `{{board}}` filled in — each
 * value URL-encoded, so a state named `a/b` cannot reach another path — or `undefined` when the result is not a link a
 * board may open (`isTriggerLink`), or its origin is not among `origins` when a host gives them. A path on this
 * installation is resolved against `base` (the page's origin by default) and kept to it.
 */
export function linkFor(
  template: string,
  context: { node?: string; state?: string; board?: string },
  options: { origins?: readonly string[]; base?: string } = {}
): string | undefined {
  if (!isTriggerLink(template)) return undefined;
  const filled = template.replace(/\{\{\s*(node|state|board)\s*\}\}/g, (_, key: 'node' | 'state' | 'board') => encodeURIComponent(context[key] ?? ''));
  if (!isTriggerLink(filled)) return undefined;
  let url: URL;
  try {
    url = filled.startsWith('/') ? new URL(filled, options.base ?? globalThis.location?.origin) : new URL(filled);
  } catch {
    return undefined;
  }
  if (filled.startsWith('/') && options.base !== undefined && url.origin !== new URL(options.base).origin) return undefined;
  if (url.protocol !== 'https:' && !filled.startsWith('/')) return undefined;
  if (options.origins && !filled.startsWith('/') && !options.origins.includes(url.origin)) return undefined;
  return url.href;
}

/** At most one firing per trigger per `intervalMs` — so a part whose state flips on every poll, or an element raising
 *  events in a loop, cannot make a board open links or call its host without end. Keyed by the trigger's index. */
export class FiringLimit {
  private readonly last = new Map<number, number>();

  constructor(private readonly intervalMs = 1000) {}

  /** Whether trigger `index` may fire at `now` (epoch milliseconds) — and, if so, counts this firing. */
  allow(index: number, now: number): boolean {
    const last = this.last.get(index);
    if (last !== undefined && now - last < this.intervalMs) return false;
    this.last.set(index, now);
    return true;
  }
}
