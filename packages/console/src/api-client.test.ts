import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signup, login, getBootstrapStatus, ApiError } from './api-client.js';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

describe('signup', () => {
  it('posts to /auth/signup and returns the parsed body', async () => {
    (fetch as any).mockResolvedValueOnce({ ok: true, status: 201, json: async () => ({ userId: 'u1', workspaceId: 'w1' }) });
    const result = await signup({ email: 'a@x.com', password: 'p', name: 'A' });
    expect(result).toEqual({ userId: 'u1', workspaceId: 'w1' });
    expect(fetch).toHaveBeenCalledWith(
      '/auth/signup',
      expect.objectContaining({ method: 'POST', credentials: 'include' })
    );
  });

  it('throws ApiError with the server code on failure', async () => {
    (fetch as any).mockResolvedValueOnce({ ok: false, status: 409, json: async () => ({ code: 'EMAIL_TAKEN' }) });
    await expect(signup({ email: 'a@x.com', password: 'p', name: 'A' })).rejects.toMatchObject(
      new ApiError('EMAIL_TAKEN', 409)
    );
  });
});

describe('login', () => {
  it('throws ApiError(INVALID_CREDENTIALS, 401) on wrong password', async () => {
    (fetch as any).mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({ code: 'INVALID_CREDENTIALS' }) });
    await expect(login({ email: 'a@x.com', password: 'wrong' })).rejects.toMatchObject(
      new ApiError('INVALID_CREDENTIALS', 401)
    );
  });
});

describe('getBootstrapStatus', () => {
  it('returns hasAnyUser from /auth/bootstrap-status', async () => {
    (fetch as any).mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ hasAnyUser: false }) });
    await expect(getBootstrapStatus()).resolves.toEqual({ hasAnyUser: false });
    expect(fetch).toHaveBeenCalledWith('/auth/bootstrap-status', expect.objectContaining({ credentials: 'include' }));
  });
});
