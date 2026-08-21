import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpConnectorAdapter } from './http-connector-adapter.js';
import * as api from './api-client.js';

vi.mock('./api-client.js');
beforeEach(() => vi.resetAllMocks());

describe('HttpConnectorAdapter', () => {
  it('exposes the given connector id', () => {
    const adapter = new HttpConnectorAdapter('w1', 'c1');
    expect(adapter.id).toBe('c1');
  });

  it('resolve delegates to resolveConnector with the workspace and connector ids', async () => {
    vi.mocked(api.resolveConnector).mockResolvedValue({ value: 'running', quality: 'live' });
    const adapter = new HttpConnectorAdapter('w1', 'c1');
    const ref = { path: '/pumps/a', valuePath: 'status' };
    await expect(adapter.resolve(ref)).resolves.toEqual({ value: 'running', quality: 'live' });
    expect(api.resolveConnector).toHaveBeenCalledWith('w1', 'c1', ref);
  });
});
