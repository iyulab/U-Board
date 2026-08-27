import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { getApiBase, fetchWithRetry } from './api-base.js';

describe('getApiBase', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns an empty string when VITE_API_BASE_URL is unset', () => {
    expect(getApiBase()).toBe('');
  });

  it('returns VITE_API_BASE_URL as-is when it has no trailing slash', () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.board.u-platform.kr');
    expect(getApiBase()).toBe('https://api.board.u-platform.kr');
  });

  it('strips a trailing slash so callers can concatenate a leading-slash path safely', () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.board.u-platform.kr/');
    expect(getApiBase()).toBe('https://api.board.u-platform.kr');
  });
});

describe('fetchWithRetry (edge cold-start hardening)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('sets an AbortSignal timeout on the request', async () => {
    (fetch as any).mockResolvedValueOnce({ ok: true });
    await fetchWithRetry('/x');
    const [, init] = (fetch as any).mock.calls[0];
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it('retries once when the first attempt times out, and resolves with the retry result', async () => {
    (fetch as any)
      .mockRejectedValueOnce(new DOMException('The operation timed out.', 'TimeoutError'))
      .mockResolvedValueOnce({ ok: true });

    await expect(fetchWithRetry('/x')).resolves.toEqual({ ok: true });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('does not retry a non-timeout failure', async () => {
    (fetch as any).mockRejectedValueOnce(new TypeError('Failed to fetch'));

    await expect(fetchWithRetry('/x')).rejects.toThrow('Failed to fetch');
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
