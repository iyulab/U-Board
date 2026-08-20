import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signup, login, getBootstrapStatus, ApiError, listBoards, createBoard, getBoard, updateBoard, deleteBoard } from './api-client.js';

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

describe('board endpoints', () => {
  it('listBoards GETs /workspaces/:id/boards', async () => {
    (fetch as any).mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ boards: [{ id: 'b1', name: 'A', updatedAt: 't' }] }) });
    await expect(listBoards('w1')).resolves.toEqual({ boards: [{ id: 'b1', name: 'A', updatedAt: 't' }] });
    expect(fetch).toHaveBeenCalledWith('/workspaces/w1/boards', expect.objectContaining({ credentials: 'include' }));
  });

  it('createBoard POSTs {name}', async () => {
    (fetch as any).mockResolvedValueOnce({ ok: true, status: 201, json: async () => ({ id: 'b1', name: 'A', updatedAt: 't' }) });
    await expect(createBoard('w1', 'A')).resolves.toEqual({ id: 'b1', name: 'A', updatedAt: 't' });
    expect(fetch).toHaveBeenCalledWith('/workspaces/w1/boards', expect.objectContaining({ method: 'POST', body: JSON.stringify({ name: 'A' }) }));
  });

  it('getBoard GETs /workspaces/:id/boards/:boardId', async () => {
    const doc = { kind: 'canvas', background: {}, nodes: [], connectors: [] };
    (fetch as any).mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ id: 'b1', name: 'A', document: doc, updatedAt: 't' }) });
    await expect(getBoard('w1', 'b1')).resolves.toEqual({ id: 'b1', name: 'A', document: doc, updatedAt: 't' });
    expect(fetch).toHaveBeenCalledWith('/workspaces/w1/boards/b1', expect.objectContaining({ credentials: 'include' }));
  });

  it('updateBoard PUTs the given fields', async () => {
    const doc = { kind: 'canvas', background: {}, nodes: [], connectors: [] };
    (fetch as any).mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ id: 'b1', name: 'A', updatedAt: 't2' }) });
    await expect(updateBoard('w1', 'b1', { document: doc })).resolves.toEqual({ id: 'b1', name: 'A', updatedAt: 't2' });
    expect(fetch).toHaveBeenCalledWith('/workspaces/w1/boards/b1', expect.objectContaining({ method: 'PUT', body: JSON.stringify({ document: doc }) }));
  });

  it('deleteBoard DELETEs and resolves with no body', async () => {
    (fetch as any).mockResolvedValueOnce({ ok: true, status: 204, json: async () => ({}) });
    await expect(deleteBoard('w1', 'b1')).resolves.toBeUndefined();
    expect(fetch).toHaveBeenCalledWith('/workspaces/w1/boards/b1', expect.objectContaining({ method: 'DELETE' }));
  });
});
