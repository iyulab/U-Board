import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { resolveDocument } from '../resolve-document.js';
import type { ResolvedViewDocument } from '../resolve-document.js';
import type { Adapter } from '../adapter.js';
import type { ViewDocument } from '../view-document.js';

export interface UseResolvedDocumentOptions {
  /** Re-resolve every N ms while a document is loaded. Omitted — the document is resolved once
   * (unchanged from the original one-shot behavior). */
  pollIntervalMs?: number;
  /** The current time in epoch milliseconds, read for `resolvedAt` — `Date.now` by default. Read when
   * a resolve completes, so a new function on every render is fine. */
  clock?: () => number;
}

export interface UseResolvedDocumentResult {
  resolved: ResolvedViewDocument | null;
  /** Re-resolves now, outside of the poll schedule. Host UI decides whether/how to expose this
   * (e.g. a "Refresh" button) — this hook only provides the capability. */
  refresh: () => void;
  isRefreshing: boolean;
  /** When the latest resolve completed (epoch ms, by `options.clock`), or `null` before the first.
   * What a view left open shows as "last updated". */
  resolvedAt: number | null;
  /** `true` while a polling view has gone two intervals without a completed resolve — a poll that
   * never answered, or a page whose timers were suspended (a sleeping machine, a frozen tab). The
   * values on screen are then the last ones received, however their bindings read: show it. Always
   * `false` without `pollIntervalMs`. */
  stalled: boolean;
}

/** The longest wait (ms) before re-resolving a page that is shown again. */
const SHOWN_SPREAD_MS = 3000;

/** Whether any binding in `doc` came back with a value — `live` or `stale` — or there are no bindings
 * at all, in which case there is nothing that could have failed to arrive. */
function receivedAnyValue(doc: ResolvedViewDocument): boolean {
  const qualities = doc.nodes.flatMap(node => Object.values(node.widget.quality));
  return qualities.length === 0 || qualities.some(quality => quality !== 'disconnected');
}

/**
 * Resolves a ViewDocument's bindings and keeps the result current — once, or on a poll interval
 * plus on-demand via `refresh()`. `resolveDocument` itself stays a pure one-shot function; this
 * hook is the only place that decides *when* to call it again (viewer/renderer's job, not
 * core's — docs/principles.md editor/renderer separation applies equally to "who schedules
 * re-resolution").
 */
export function useResolvedDocument(
  doc: ViewDocument | null,
  /** Keep this array's identity stable across renders a poll should span (e.g. `useMemo`, or a
   * reference held outside the component) — a new array on every render restarts the interval
   * before it completes a cycle. Same applies to `options.pollIntervalMs`'s numeric value, which
   * is fine since primitives compare by value. */
  adapters: readonly Adapter[],
  options?: UseResolvedDocumentOptions
): UseResolvedDocumentResult {
  const [resolved, setResolved] = useState<ResolvedViewDocument | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [resolvedAt, setResolvedAt] = useState<number | null>(null);
  const [stalled, setStalled] = useState(false);
  const runRef = useRef<() => void>(() => {});
  const pollIntervalMs = options?.pollIntervalMs;
  const clock = options?.clock;
  const readClock = useEffectEvent(() => (clock ?? Date.now)());

  useEffect(() => {
    if (!doc) {
      setResolved(null);
      setResolvedAt(null);
      setStalled(false);
      runRef.current = () => {};
      return;
    }
    let cancelled = false;
    // Scoped to this effect instance (one per doc/adapters/pollIntervalMs identity) rather than
    // a hook-level ref — a still-pending resolve from a document that's since been swapped out
    // must never block the new document's own first resolve.
    let inFlight = false;
    // Measured on the monotonic clock, so a change to the machine's wall clock cannot fake or hide a stall.
    let completedAt = performance.now();
    setStalled(false);

    const run = () => {
      // Checked whenever a poll is due — including the first one a page runs after its timers were
      // suspended, which may start a resolve but has nothing current to show until it completes.
      if (pollIntervalMs && performance.now() - completedAt >= 2 * pollIntervalMs) setStalled(true);
      if (inFlight) return;
      inFlight = true;
      setIsRefreshing(true);
      resolveDocument(doc, adapters).then(result => {
        inFlight = false;
        if (cancelled) return;
        setResolved(result);
        setIsRefreshing(false);
        // A result is shown whatever it holds, but only one in which some value arrived is an update:
        // a viewer that reaches nothing gets every binding back `disconnected` on schedule, and that
        // must not read as "updated just now".
        if (!receivedAnyValue(result)) return;
        completedAt = performance.now();
        setResolvedAt(readClock());
        setStalled(false);
      });
    };
    runRef.current = run;

    run();
    const intervalId = pollIntervalMs ? setInterval(run, pollIntervalMs) : undefined;
    // A page shown again — a tab brought back, a machine woken, a page restored from the back/forward
    // cache — asks at once rather than at the next poll, which a suspended page may have long missed.
    // Spread over a few seconds: the screens of one site woken together (start of a shift) would
    // otherwise all ask in the same instant, against a rate limit that counts them together.
    let shownTimer: ReturnType<typeof setTimeout> | undefined;
    const onShown = () => {
      clearTimeout(shownTimer);
      shownTimer = setTimeout(run, Math.random() * Math.min(SHOWN_SPREAD_MS, pollIntervalMs ?? 0));
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') onShown();
    };
    if (pollIntervalMs) {
      document.addEventListener('visibilitychange', onVisible);
      window.addEventListener('pageshow', onShown);
    }

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
      clearTimeout(shownTimer);
      if (pollIntervalMs) {
        document.removeEventListener('visibilitychange', onVisible);
        window.removeEventListener('pageshow', onShown);
      }
    };
  }, [doc, adapters, pollIntervalMs]);

  return {
    resolved,
    refresh: () => runRef.current(),
    isRefreshing,
    resolvedAt,
    stalled,
  };
}
