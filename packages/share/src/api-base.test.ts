import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { getApiBase, fetchWithRetry, apiClock } from './api-base.js';

describe('getApiBase', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('is /api on this origin when VITE_API_BASE_URL is unset', () => {
    expect(getApiBase()).toBe('/api');
  });

  it('is /api on VITE_API_BASE_URL when set', () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com');
    expect(getApiBase()).toBe('https://api.example.com/api');
  });

  it('strips a trailing slash from VITE_API_BASE_URL so the path has no double slash', () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com/');
    expect(getApiBase()).toBe('https://api.example.com/api');
  });
});

describe('fetchWithRetry (edge cold-start hardening)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('sets an AbortSignal timeout on the request', async () => {
    (fetch as any).mockResolvedValueOnce({ ok: true, headers: new Headers() });
    await fetchWithRetry('/x');
    const [, init] = (fetch as any).mock.calls[0];
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it('retries once when the first attempt times out, and resolves with the retry result', async () => {
    (fetch as any)
      .mockRejectedValueOnce(new DOMException('The operation timed out.', 'TimeoutError'))
      .mockResolvedValueOnce({ ok: true, headers: new Headers() });

    await expect(fetchWithRetry('/x')).resolves.toEqual({ ok: true, headers: new Headers() });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('sets the server clock from the Date each response carries', async () => {
    // A server an hour behind this machine.
    const serverDate = new Date(Date.now() - 3_600_000);
    (fetch as any).mockResolvedValueOnce({ ok: true, headers: new Headers({ Date: serverDate.toUTCString() }) });
    await fetchWithRetry('/x');
    expect(Math.abs(apiClock.now() - serverDate.getTime())).toBeLessThan(2000);
  });

  it('does not retry a non-timeout failure', async () => {
    (fetch as any).mockRejectedValueOnce(new TypeError('Failed to fetch'));

    await expect(fetchWithRetry('/x')).rejects.toThrow('Failed to fetch');
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
