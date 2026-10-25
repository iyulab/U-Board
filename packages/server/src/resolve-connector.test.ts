import { describe, it, expect, vi, afterEach } from 'vitest';
import { resolveConnectorValue, forgetConnector, answeredAtOf, type ResolveState } from './resolve-connector.js';
import { ClientCredentialsTokens } from './oauth-client-credentials.js';
import type { Connector } from './db/connectors.js';

const connector = { id: 'c1', authType: 'none' } as Connector;

function stateWith(fetchFn: typeof fetch, reuseMs = 10_000): ResolveState {
  return {
    values: new Map(),
    tokens: new ClientCredentialsTokens(Date.now, fetchFn),
    fetch: fetchFn,
    failures: new Map(),
    reads: new Map(),
    lastReads: new Map(),
    reuseMs,
  };
}

const json = (body: unknown) =>
  ({ ok: true, status: 200, headers: { get: () => 'application/json' }, json: async () => body }) as unknown as Response;

afterEach(() => {
  vi.restoreAllMocks();
});

describe('reuse of recent upstream reads', () => {
  it('lets go of a read once its reuse window has passed, so the reads kept stay those of the last window', async () => {
    const state = stateWith(vi.fn(async () => json({ v: 1 })));
    await resolveConnectorValue(connector, new URL('https://plant.example.com/a'), { path: '/a' }, state);
    await resolveConnectorValue(connector, new URL('https://plant.example.com/b'), { path: '/b' }, state);
    expect([...state.reads.keys()]).toHaveLength(2);

    // Past the window of both reads, measured from after they finished.
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 10_001);
    await resolveConnectorValue(connector, new URL('https://plant.example.com/c'), { path: '/c' }, state);
    expect([...state.reads.keys()]).toEqual(['c1 https://plant.example.com/c']);
  });

  it('forgets everything about a connector — its reads, last values and logged failures — when told to', async () => {
    const state = stateWith(vi.fn(async () => json({ v: 1 })));
    const other = { id: 'c2', authType: 'none' } as Connector;
    await resolveConnectorValue(connector, new URL('https://plant.example.com/a'), { path: '/a' }, state);
    await resolveConnectorValue(other, new URL('https://plant.example.com/a'), { path: '/a' }, state);
    state.failures.set('c1:{"path":"/x"}', 'request failed');

    forgetConnector(state, 'c1');

    expect([...state.reads.keys()]).toEqual(['c2 https://plant.example.com/a']);
    expect([...state.values.keys()]).toEqual(['c2:{"path":"/a"}']);
    expect(state.failures.size).toBe(0);
  });
});

describe('slow sources (stale-while-revalidate)', () => {
  /** A fetch whose answers the test hands out one by one, each when it says so. */
  function heldFetch() {
    const pending: ((r: Response) => void)[] = [];
    const fn = vi.fn(() => new Promise<Response>(answer => pending.push(answer)));
    // The request goes out a few ticks after the resolve starts (auth headers first) — wait for it.
    const answer = async (body: unknown) => {
      while (pending.length === 0) await new Promise(done => setTimeout(done, 0));
      pending.shift()!(json(body));
    };
    return { fn: fn as unknown as typeof fetch, calls: fn, answer };
  }
  const slowState = (fetchFn: typeof fetch, reuseMs = 0) => ({ ...stateWith(fetchFn, reuseMs), waitMs: 20 });
  const a = new URL('https://plant.example.com/a');
  const settle = () => new Promise(done => setTimeout(done, 0));

  it('answers `pending` the first time instead of waiting out a slow read, and the read serves the next resolve', async () => {
    const source = heldFetch();
    const state = slowState(source.fn, 10_000);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(await resolveConnectorValue(connector, a, { path: '/a', valuePath: 'v' }, state)).toEqual({
      value: undefined,
      quality: 'disconnected',
      reason: 'pending',
    });
    await source.answer({ v: 7 });
    await settle();

    expect(await resolveConnectorValue(connector, a, { path: '/a', valuePath: 'v' }, state)).toMatchObject({ value: 7, quality: 'live' });
    expect(source.calls).toHaveBeenCalledTimes(1);
    // Waiting is not failing: nothing logged, nothing «recovered».
    expect(warn).not.toHaveBeenCalled();
  });

  it('answers with the last read while a new read of the same URL is still out', async () => {
    const source = heldFetch();
    const state = slowState(source.fn);
    const first = resolveConnectorValue(connector, a, { path: '/a', valuePath: 'v' }, state);
    await source.answer({ v: 1 });
    expect(await first).toMatchObject({ value: 1, quality: 'live' });

    // No reuse window (0): this resolve starts a new read, which the source is slow to answer.
    expect(await resolveConnectorValue(connector, a, { path: '/a', valuePath: 'v' }, state)).toMatchObject({ value: 1, quality: 'live' });
    expect(source.calls).toHaveBeenCalledTimes(2);

    await source.answer({ v: 2 });
    await settle();
    const third = resolveConnectorValue(connector, a, { path: '/a', valuePath: 'v' }, state);
    await source.answer({ v: 3 });
    expect(await third).toMatchObject({ value: 3, quality: 'live' });
  });

  it('serves the last value as `stale` with no reason once the last read is too old to stand for a current one', async () => {
    const source = heldFetch();
    const state = { ...slowState(source.fn), readTimeoutMs: 1_000 };
    const first = resolveConnectorValue(connector, a, { path: '/a', valuePath: 'v' }, state);
    await source.answer({ v: 1 });
    await first;

    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 1_001);
    const result = await resolveConnectorValue(connector, a, { path: '/a', valuePath: 'v' }, state);
    expect(result).toMatchObject({ value: 1, quality: 'stale' });
    expect(result.reason).toBeUndefined();
  });

  it('forgets a connector’s last reads with the rest', async () => {
    const state = stateWith(vi.fn(async () => json({ v: 1 })), 0);
    await resolveConnectorValue(connector, a, { path: '/a' }, state);
    expect(state.lastReads.size).toBe(1);
    forgetConnector(state, 'c1');
    expect(state.lastReads.size).toBe(0);
  });
});

describe('when an answer was made, as the response says', () => {
  const NOW = Date.parse('2026-10-25T12:00:00Z');
  const withHeaders = (extra: Record<string, string>, body: unknown = { v: 1 }) =>
    ({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json', ...extra }),
      json: async () => body,
    }) as unknown as Response;
  const target = new URL('https://plant.example.com/a');

  it('is the time it was received when the response says nothing, or says it is from the future', () => {
    expect(answeredAtOf(new Headers(), NOW)).toBe(NOW);
    expect(answeredAtOf(new Headers({ date: 'not a date' }), NOW)).toBe(NOW);
    expect(answeredAtOf(new Headers({ date: new Date(NOW + 6 * 60_000).toUTCString() }), NOW)).toBe(NOW);
  });

  it('is `Date` when it is behind the receiving clock, and `Age` when that is older still (RFC 9111 §4.2.3)', () => {
    expect(answeredAtOf(new Headers({ date: new Date(NOW - 30_000).toUTCString() }), NOW)).toBe(NOW - 30_000);
    expect(answeredAtOf(new Headers({ date: new Date(NOW - 30_000).toUTCString(), age: '600' }), NOW)).toBe(NOW - 600_000);
    // `Age` counts from when the origin made it, and `Date` is that moment: not subtracted from each other.
    expect(answeredAtOf(new Headers({ date: new Date(NOW - 600_000).toUTCString(), age: '600' }), NOW)).toBe(NOW - 600_000);
    expect(answeredAtOf(new Headers({ age: '-4' }), NOW)).toBe(NOW);
  });

  it('is the observed time of a value whose answer names none, so a proxy serving an old answer shows as lagging', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(NOW);
    const old = new Date(NOW - 20 * 60_000).toUTCString();
    const state = stateWith(vi.fn(async () => withHeaders({ date: old })));
    const result = await resolveConnectorValue(connector, target, { path: '/a', maxAgeSeconds: 300 }, state);
    expect(result).toMatchObject({ value: { v: 1 }, quality: 'stale', reason: 'lagging', observedAt: new Date(NOW - 20 * 60_000).toISOString() });
  });

  it('leaves a source that answers from its database `live`, observed when it answered', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(NOW);
    const state = stateWith(vi.fn(async () => withHeaders({ date: new Date(NOW - 1_000).toUTCString() })));
    const result = await resolveConnectorValue(connector, target, { path: '/a', maxAgeSeconds: 300 }, state);
    expect(result).toMatchObject({ quality: 'live', observedAt: new Date(NOW - 1_000).toISOString() });
  });

  it('gives way to the time the answer itself names for the value', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(NOW);
    const answer = { v: 1, at: new Date(NOW - 60_000).toISOString() };
    const state = stateWith(vi.fn(async () => withHeaders({ date: new Date(NOW - 20 * 60_000).toUTCString() }, answer)));
    const result = await resolveConnectorValue(connector, target, { path: '/a', valuePath: '/v', observedAtPath: '/at', maxAgeSeconds: 300 }, state);
    expect(result).toMatchObject({ value: 1, quality: 'live', observedAt: answer.at });
  });

  it('keeps the receiving clock for how long a read is reused, whatever age the response reports', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(NOW);
    const fetchFn = vi.fn(async () => withHeaders({ age: '86400' }));
    const state = stateWith(fetchFn, 10_000);
    await resolveConnectorValue(connector, target, { path: '/a' }, state);
    await resolveConnectorValue(connector, target, { path: '/a' }, state);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });
});
