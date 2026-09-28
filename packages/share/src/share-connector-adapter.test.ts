import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ShareConnectorAdapter, ShareResolveBatcher } from './share-connector-adapter.js';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

function batchResponse(results: unknown[]) {
  return { ok: true, json: async () => ({ results }) };
}

describe('ShareConnectorAdapter', () => {
  it('exposes the given connector id', () => {
    const adapter = new ShareConnectorAdapter(new ShareResolveBatcher('b1', 'tok'), 'c1');
    expect(adapter.id).toBe('c1');
  });

  it('sends every resolve made in the same turn, across connectors, as one batch request in order', async () => {
    (fetch as any).mockResolvedValueOnce(batchResponse([
      { value: 'running', quality: 'live' },
      { value: 42, quality: 'stale' },
      { value: true, quality: 'live' },
    ]));
    const batcher = new ShareResolveBatcher('b1', 'tok');
    const c1 = new ShareConnectorAdapter(batcher, 'c1');
    const c2 = new ShareConnectorAdapter(batcher, 'c2');

    const results = await Promise.all([
      c1.resolve({ path: '/status', valuePath: 'status' }),
      c1.resolve({ path: '/temp' }),
      c2.resolve({ path: '/pump' }),
    ]);

    expect(results).toEqual([
      { value: 'running', quality: 'live' },
      { value: 42, quality: 'stale' },
      { value: true, quality: 'live' },
    ]);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      '/share/boards/b1/resolve?token=tok',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ bindings: [
          { connectorId: 'c1', ref: { path: '/status', valuePath: 'status' } },
          { connectorId: 'c1', ref: { path: '/temp' } },
          { connectorId: 'c2', ref: { path: '/pump' } },
        ] }),
      })
    );
  });

  it('sends a binding requested twice in one turn only once, answering both', async () => {
    (fetch as any).mockResolvedValueOnce(batchResponse([{ value: 'running', quality: 'live' }, { value: 3, quality: 'live' }]));
    const adapter = new ShareConnectorAdapter(new ShareResolveBatcher('b1', 'tok'), 'c1');
    const results = await Promise.all([
      adapter.resolve({ path: '/status', valuePath: 'status' }),
      adapter.resolve({ path: '/count' }),
      adapter.resolve({ path: '/status', valuePath: 'status' }),
    ]);
    expect(results).toEqual([{ value: 'running', quality: 'live' }, { value: 3, quality: 'live' }, { value: 'running', quality: 'live' }]);
    expect(JSON.parse((fetch as any).mock.calls[0][1].body).bindings).toEqual([
      { connectorId: 'c1', ref: { path: '/status', valuePath: 'status' } },
      { connectorId: 'c1', ref: { path: '/count' } },
    ]);
  });

  it('sends a later turn as its own request', async () => {
    (fetch as any)
      .mockResolvedValueOnce(batchResponse([{ value: 1, quality: 'live' }]))
      .mockResolvedValueOnce(batchResponse([{ value: 2, quality: 'live' }]));
    const adapter = new ShareConnectorAdapter(new ShareResolveBatcher('b1', 'tok'), 'c1');
    expect(await adapter.resolve({ path: '/a' })).toEqual({ value: 1, quality: 'live' });
    expect(await adapter.resolve({ path: '/a' })).toEqual({ value: 2, quality: 'live' });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('answers disconnected for every binding when the batch request is refused, saying why', async () => {
    (fetch as any).mockResolvedValueOnce({ ok: false, status: 429, json: async () => ({}) });
    const batcher = new ShareResolveBatcher('b1', 'tok');
    const adapter = new ShareConnectorAdapter(batcher, 'c1');
    await expect(Promise.all([adapter.resolve({ path: '/a' }), adapter.resolve({ path: '/b' })])).resolves.toEqual([
      { value: undefined, quality: 'disconnected', reason: 'throttled' },
      { value: undefined, quality: 'disconnected', reason: 'throttled' },
    ]);
  });

  it('reports any other refusal of the batch request as the source being unreachable', async () => {
    (fetch as any).mockResolvedValueOnce({ ok: false, status: 502, json: async () => ({}) });
    const adapter = new ShareConnectorAdapter(new ShareResolveBatcher('b1', 'tok'), 'c1');
    await expect(adapter.resolve({ path: '/a' })).resolves.toEqual({ value: undefined, quality: 'disconnected', reason: 'transport' });
  });

  it('rejects every binding of the batch when the request cannot be made at all', async () => {
    (fetch as any).mockRejectedValueOnce(new TypeError('Failed to fetch'));
    const adapter = new ShareConnectorAdapter(new ShareResolveBatcher('b1', 'tok'), 'c1');
    await expect(adapter.resolve({ path: '/a' })).rejects.toThrow('Failed to fetch');
  });

  it('splits more bindings than one request may carry into several requests', async () => {
    (fetch as any).mockImplementation(async (_url: string, init: RequestInit) => {
      const { bindings } = JSON.parse(String(init.body)) as { bindings: unknown[] };
      return batchResponse(bindings.map((_, i) => ({ value: i, quality: 'live' })));
    });
    const adapter = new ShareConnectorAdapter(new ShareResolveBatcher('b1', 'tok'), 'c1');
    const results = await Promise.all(Array.from({ length: 501 }, (_, i) => adapter.resolve({ path: `/${i}` })));
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(results[499]).toEqual({ value: 499, quality: 'live' });
    expect(results[500]).toEqual({ value: 0, quality: 'live' });
  });

  it('prefixes the batch URL with VITE_API_BASE_URL, without a double slash', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com/');
    (fetch as any).mockResolvedValueOnce(batchResponse([{ value: 1, quality: 'live' }]));
    await new ShareConnectorAdapter(new ShareResolveBatcher('b1', 'tok'), 'c1').resolve({ path: '/status' });
    expect(fetch).toHaveBeenCalledWith('https://api.example.com/share/boards/b1/resolve?token=tok', expect.anything());
    vi.unstubAllEnvs();
  });
});
