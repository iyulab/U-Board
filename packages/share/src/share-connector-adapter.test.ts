import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ShareConnectorAdapter } from './share-connector-adapter.js';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

describe('ShareConnectorAdapter', () => {
  it('exposes the given connector id', () => {
    const adapter = new ShareConnectorAdapter('b1', 'tok', 'c1');
    expect(adapter.id).toBe('c1');
  });

  it('resolve POSTs to the public resolve endpoint with the token in the query string', async () => {
    (fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({ value: 'running', quality: 'live' }) });
    const adapter = new ShareConnectorAdapter('b1', 'tok', 'c1');
    const ref = { path: '/status', valuePath: 'status' };

    await expect(adapter.resolve(ref)).resolves.toEqual({ value: 'running', quality: 'live' });
    expect(fetch).toHaveBeenCalledWith(
      '/share/boards/b1/connectors/c1/resolve?token=tok',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ ref }) })
    );
  });

  it('resolve returns disconnected when the request fails', async () => {
    (fetch as any).mockResolvedValueOnce({ ok: false, json: async () => ({ code: 'NOT_FOUND' }) });
    const adapter = new ShareConnectorAdapter('b1', 'tok', 'c1');
    await expect(adapter.resolve({ path: '/status' })).resolves.toEqual({ value: undefined, quality: 'disconnected' });
  });

  it('prefixes the resolve URL with VITE_API_BASE_URL when set', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.board.u-platform.kr');
    (fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({ value: 1, quality: 'live' }) });
    const adapter = new ShareConnectorAdapter('b1', 'tok', 'c1');
    await adapter.resolve({ path: '/status' });
    expect(fetch).toHaveBeenCalledWith(
      'https://api.board.u-platform.kr/share/boards/b1/connectors/c1/resolve?token=tok',
      expect.anything()
    );
    vi.unstubAllEnvs();
  });
});
