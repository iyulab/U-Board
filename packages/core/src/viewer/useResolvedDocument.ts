import { useEffect, useRef, useState } from 'react';
import { resolveDocument } from '../resolve-document.js';
import type { ResolvedViewDocument } from '../resolve-document.js';
import type { Adapter } from '../adapter.js';
import type { ViewDocument } from '../view-document.js';

export interface UseResolvedDocumentOptions {
  /** Re-resolve every N ms while a document is loaded. Omitted — the document is resolved once
   * (unchanged from the original one-shot behavior). */
  pollIntervalMs?: number;
}

export interface UseResolvedDocumentResult {
  resolved: ResolvedViewDocument | null;
  /** Re-resolves now, outside of the poll schedule. Host UI decides whether/how to expose this
   * (e.g. a "Refresh" button) — this hook only provides the capability. */
  refresh: () => void;
  isRefreshing: boolean;
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
  adapters: readonly Adapter[],
  options?: UseResolvedDocumentOptions
): UseResolvedDocumentResult {
  const [resolved, setResolved] = useState<ResolvedViewDocument | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const inFlightRef = useRef(false);
  const runRef = useRef<() => void>(() => {});
  const pollIntervalMs = options?.pollIntervalMs;

  useEffect(() => {
    if (!doc) {
      setResolved(null);
      runRef.current = () => {};
      return;
    }
    let cancelled = false;

    const run = () => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      setIsRefreshing(true);
      resolveDocument(doc, adapters).then(result => {
        inFlightRef.current = false;
        if (cancelled) return;
        setResolved(result);
        setIsRefreshing(false);
      });
    };
    runRef.current = run;

    run();
    const intervalId = pollIntervalMs ? setInterval(run, pollIntervalMs) : undefined;

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [doc, adapters, pollIntervalMs]);

  return {
    resolved,
    refresh: () => runRef.current(),
    isRefreshing,
  };
}
