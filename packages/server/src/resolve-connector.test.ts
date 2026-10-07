import { describe, it, expect, vi, afterEach } from 'vitest';
import { resolveConnectorValue, forgetConnector, type ResolveState } from './resolve-connector.js';
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
    const start = Date.now();
    await resolveConnectorValue(connector, new URL('https://plant.example.com/a'), { path: '/a' }, state);
    await resolveConnectorValue(connector, new URL('https://plant.example.com/b'), { path: '/b' }, state);
    expect([...state.reads.keys()]).toHaveLength(2);

    vi.spyOn(Date, 'now').mockReturnValue(start + 10_001);
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
