import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useResolvedDocument } from './useResolvedDocument';
import type { Adapter, ResolvedBinding } from '../adapter';
import type { ViewDocument } from '../view-document';

function docWithBinding(): ViewDocument {
  return {
    kind: 'canvas',
    background: {},
    nodes: [
      {
        id: 'n1',
        x: 0,
        y: 0,
        anchored: false,
        widget: { type: 'uw-status', bindings: { value: { adapter: 'cmms', ref: 'k' } } },
      },
    ],
    connectors: [],
  };
}

class SpyAdapter implements Adapter {
  readonly id = 'cmms';
  resolve = vi.fn(
    async (): Promise<ResolvedBinding> => ({ value: 'running', quality: 'live' })
  );
}

afterEach(() => {
  vi.useRealTimers();
});

/** Drains the native microtask queue — vi's fake timers only fake `setTimeout`/`setInterval`,
 * so a promise chain unrelated to a timer (e.g. one released mid-test) needs this instead of
 * `advanceTimersByTimeAsync` to actually settle. */
async function flushMicrotasks(hops = 6) {
  for (let i = 0; i < hops; i++) {
    await Promise.resolve();
  }
}

describe('useResolvedDocument', () => {
  it('resolves the document once when pollIntervalMs is omitted (no regression)', async () => {
    const adapter = new SpyAdapter();
    const doc = docWithBinding();
    const adapters = [adapter];

    const { result } = renderHook(() => useResolvedDocument(doc, adapters));

    await waitFor(() => expect(result.current.resolved).not.toBeNull());
    expect(adapter.resolve).toHaveBeenCalledTimes(1);
    expect(result.current.resolved?.nodes[0].widget.props.value).toBe('running');
  });

  it('does nothing when doc is null (no adapter calls, resolved stays null)', async () => {
    const adapter = new SpyAdapter();

    const { result } = renderHook(() => useResolvedDocument(null, [adapter]));

    expect(result.current.resolved).toBeNull();
    expect(adapter.resolve).not.toHaveBeenCalled();
  });

  it('re-resolves on each pollIntervalMs tick', async () => {
    vi.useFakeTimers();
    const adapter = new SpyAdapter();
    const doc = docWithBinding();
    const adapters = [adapter];

    renderHook(() => useResolvedDocument(doc, adapters, { pollIntervalMs: 1000 }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(adapter.resolve).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(adapter.resolve).toHaveBeenCalledTimes(2);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(adapter.resolve).toHaveBeenCalledTimes(3);
  });

  it('skips a poll tick while the previous resolve is still in flight', async () => {
    vi.useFakeTimers();
    const doc = docWithBinding();

    let releaseFirst!: (result: ResolvedBinding) => void;
    const first = new Promise<ResolvedBinding>(resolve => {
      releaseFirst = resolve;
    });
    const resolveMock = vi
      .fn<Adapter['resolve']>()
      .mockImplementationOnce(() => first)
      .mockResolvedValue({ value: 'running', quality: 'live' });
    const adapter: Adapter = { id: 'cmms', resolve: resolveMock };
    const adapters = [adapter];

    const { result } = renderHook(() =>
      useResolvedDocument(doc, adapters, { pollIntervalMs: 1000 })
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(resolveMock).toHaveBeenCalledTimes(1);
    expect(result.current.isRefreshing).toBe(true);

    // Two ticks elapse while the first call is still pending — both must be skipped.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(resolveMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      releaseFirst({ value: 'running', quality: 'live' });
      await flushMicrotasks();
    });
    expect(result.current.isRefreshing).toBe(false);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(resolveMock).toHaveBeenCalledTimes(2);
  });

  it('resolves a newly-swapped document even while the previous document is still resolving', async () => {
    const docA = docWithBinding();
    const docB = docWithBinding();
    const adapters: Adapter[] = [];

    let releaseA!: (result: ResolvedBinding) => void;
    const pendingA = new Promise<ResolvedBinding>(resolve => {
      releaseA = resolve;
    });
    const resolveMock = vi
      .fn<Adapter['resolve']>()
      .mockImplementationOnce(() => pendingA)
      .mockResolvedValue({ value: 'from-b', quality: 'live' });
    adapters.push({ id: 'cmms', resolve: resolveMock });

    const { result, rerender } = renderHook(
      ({ doc }: { doc: ViewDocument }) => useResolvedDocument(doc, adapters),
      { initialProps: { doc: docA } }
    );

    await waitFor(() => expect(resolveMock).toHaveBeenCalledTimes(1)); // docA, left pending

    rerender({ doc: docB });

    await waitFor(() => expect(resolveMock).toHaveBeenCalledTimes(2)); // docB must not be starved
    await waitFor(() =>
      expect(result.current.resolved?.nodes[0].widget.props.value).toBe('from-b')
    );

    // docA's stale, never-released call must not corrupt state once it eventually settles.
    releaseA({ value: 'from-a', quality: 'live' });
    await flushMicrotasks();
    expect(result.current.resolved?.nodes[0].widget.props.value).toBe('from-b');
  });

  it('refresh() manually triggers a re-resolve outside of any polling', async () => {
    const adapter = new SpyAdapter();
    const doc = docWithBinding();
    const adapters = [adapter];

    const { result } = renderHook(() => useResolvedDocument(doc, adapters));

    await waitFor(() => expect(adapter.resolve).toHaveBeenCalledTimes(1));

    await act(async () => {
      result.current.refresh();
      await flushMicrotasks();
    });
    expect(adapter.resolve).toHaveBeenCalledTimes(2);
  });

  it('stops polling after unmount', async () => {
    vi.useFakeTimers();
    const adapter = new SpyAdapter();
    const doc = docWithBinding();
    const adapters = [adapter];

    const { unmount } = renderHook(() =>
      useResolvedDocument(doc, adapters, { pollIntervalMs: 1000 })
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(adapter.resolve).toHaveBeenCalledTimes(1);

    unmount();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    expect(adapter.resolve).toHaveBeenCalledTimes(1);
  });

  it('restarts the poll interval when the adapters array identity changes', async () => {
    vi.useFakeTimers();
    const adapter = new SpyAdapter();
    const doc = docWithBinding();

    const { rerender } = renderHook(
      ({ adapters }: { adapters: readonly Adapter[] }) =>
        useResolvedDocument(doc, adapters, { pollIntervalMs: 1000 }),
      { initialProps: { adapters: [adapter] } }
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(adapter.resolve).toHaveBeenCalledTimes(1);

    // Partway through the interval — a tick isn't due yet under the original schedule.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });
    expect(adapter.resolve).toHaveBeenCalledTimes(1);

    // Same adapter, new array identity — the effect's dependency array only compares by
    // reference, so this must be treated the same as swapping to a different adapter set.
    rerender({ adapters: [adapter] });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(adapter.resolve).toHaveBeenCalledTimes(2); // effect restart re-runs immediately

    // The old schedule's remaining 400ms must be dead, not carried over.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });
    expect(adapter.resolve).toHaveBeenCalledTimes(2);

    // The new interval counts a full 1000ms from the rerender.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });
    expect(adapter.resolve).toHaveBeenCalledTimes(3);
  });

  it('restarts the interval and re-resolves immediately when pollIntervalMs changes', async () => {
    vi.useFakeTimers();
    const adapter = new SpyAdapter();
    const doc = docWithBinding();
    const adapters = [adapter];

    const { rerender } = renderHook(
      ({ pollIntervalMs }: { pollIntervalMs: number }) =>
        useResolvedDocument(doc, adapters, { pollIntervalMs }),
      { initialProps: { pollIntervalMs: 1000 } }
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(adapter.resolve).toHaveBeenCalledTimes(1);

    rerender({ pollIntervalMs: 5000 });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(adapter.resolve).toHaveBeenCalledTimes(2); // effect restart re-runs immediately

    // The old 1000ms schedule must be dead — this would have fired a stray tick otherwise.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(adapter.resolve).toHaveBeenCalledTimes(2);

    // The new 5000ms schedule counts from the rerender point (1000ms already elapsed above).
    await act(async () => {
      await vi.advanceTimersByTimeAsync(4000);
    });
    expect(adapter.resolve).toHaveBeenCalledTimes(3);
  });

  describe('liveness, for a view left open', () => {
    class GatedAdapter implements Adapter {
      readonly id = 'cmms';
      private gates: Array<() => void> = [];
      hold = false;
      resolve = vi.fn((): Promise<ResolvedBinding> => {
        if (!this.hold) return Promise.resolve({ value: 'running', quality: 'live' });
        return new Promise(r => this.gates.push(() => r({ value: 'running', quality: 'live' })));
      });
      release() {
        this.gates.splice(0).forEach(open => open());
      }
    }

    it('reports when the latest resolve completed', async () => {
      vi.useFakeTimers({ now: new Date('2026-10-07T05:00:00Z') });
      const doc = docWithBinding();
      const adapters = [new SpyAdapter()];
      const { result } = renderHook(() => useResolvedDocument(doc, adapters, { pollIntervalMs: 1000 }));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(result.current.resolvedAt).toBe(Date.parse('2026-10-07T05:00:00Z'));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });
      expect(result.current.resolvedAt).toBe(Date.parse('2026-10-07T05:00:01Z'));
    });

    it('says the view is not updating once a poll has gone unanswered for two intervals, until the next result', async () => {
      vi.useFakeTimers();
      const adapter = new GatedAdapter();
      const doc = docWithBinding();
      const adapters = [adapter];
      const { result } = renderHook(() => useResolvedDocument(doc, adapters, { pollIntervalMs: 1000 }));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(result.current.stalled).toBe(false);

      adapter.hold = true; // the next poll never answers
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });
      expect(result.current.stalled).toBe(false);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });
      expect(result.current.stalled).toBe(true);

      await act(async () => {
        adapter.release();
        await flushMicrotasks();
      });
      expect(result.current.stalled).toBe(false);
    });

    it('does not count a result in which no value arrived as an update', async () => {
      vi.useFakeTimers({ now: new Date('2026-10-07T05:00:00Z') });
      let reachable = true;
      const adapter: Adapter = {
        id: 'cmms',
        resolve: async () => (reachable ? { value: 'running', quality: 'live' } : { value: undefined, quality: 'disconnected', reason: 'transport' }),
      };
      const doc = docWithBinding();
      const adapters = [adapter];
      const { result } = renderHook(() => useResolvedDocument(doc, adapters, { pollIntervalMs: 1000 }));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
      const updatedAt = result.current.resolvedAt;

      reachable = false; // the viewer reaches nothing: every binding comes back disconnected
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000);
      });
      expect(result.current.resolvedAt).toBe(updatedAt);
      expect(result.current.stalled).toBe(true);
      expect(result.current.resolved?.nodes[0].widget.quality.value).toBe('disconnected'); // still shown as it is
    });

    it('forgets when it last updated once the document is gone', async () => {
      vi.useFakeTimers();
      const adapters = [new SpyAdapter()];
      const { result, rerender } = renderHook(({ doc }) => useResolvedDocument(doc, adapters, { pollIntervalMs: 1000 }), {
        initialProps: { doc: docWithBinding() as ViewDocument | null },
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(result.current.resolvedAt).not.toBeNull();
      rerender({ doc: null });
      expect(result.current.resolvedAt).toBeNull();
      expect(result.current.stalled).toBe(false);
    });

    it('never calls a one-shot view stalled', async () => {
      vi.useFakeTimers();
      const doc = docWithBinding();
      const adapters = [new SpyAdapter()];
      const { result } = renderHook(() => useResolvedDocument(doc, adapters));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(60_000);
      });
      expect(result.current.stalled).toBe(false);
    });

    it('asks again at once when the page is shown again, instead of waiting for the next poll', async () => {
      vi.useFakeTimers();
      const adapter = new SpyAdapter();
      const doc = docWithBinding();
      const adapters = [adapter];
      renderHook(() => useResolvedDocument(doc, adapters, { pollIntervalMs: 30_000 }));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(adapter.resolve).toHaveBeenCalledTimes(1);

      // Within a few seconds, spread so that screens woken together do not all ask in the same instant.
      await act(async () => {
        Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
        document.dispatchEvent(new Event('visibilitychange'));
        await vi.advanceTimersByTimeAsync(3000);
      });
      expect(adapter.resolve).toHaveBeenCalledTimes(2);

      await act(async () => {
        window.dispatchEvent(new Event('pageshow'));
        await vi.advanceTimersByTimeAsync(3000);
      });
      expect(adapter.resolve).toHaveBeenCalledTimes(3);
    });
  });
});
