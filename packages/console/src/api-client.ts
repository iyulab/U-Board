import type { ViewDocument } from '@iyulab/u-board';

export class ApiError extends Error {
  constructor(public code: string, public status: number) {
    super(code);
    this.name = 'ApiError';
  }
}

// A production Container Apps cold start (scale-to-zero) has been observed to exceed 20s before
// the first byte arrives — longer than a typical client-side timeout — so a plain `fetch` here
// can read as "just broken" rather than "slow". One retry after the timeout absorbs exactly that
// case (the instance is warm by the second attempt) without masking a genuinely dead backend.
const REQUEST_TIMEOUT_MS = 30_000;

async function fetchWithRetry(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  } catch (err) {
    // Checked via `.name` rather than `instanceof DOMException`/`instanceof Error` — the abort
    // reason `AbortSignal.timeout` throws is a `DOMException`, but whether that inherits from
    // `Error` varies across environments (true in real browsers and Node, not in jsdom's test
    // implementation); `.name` is the one property both agree on.
    if ((err as { name?: string } | null)?.name === 'TimeoutError') {
      return fetch(url, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    }
    throw err;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const base = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '');
  const res = await fetchWithRetry(`${base}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ code: 'UNKNOWN_ERROR' }));
    throw new ApiError(body.code ?? 'UNKNOWN_ERROR', res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export function signup(input: { email: string; password: string; name: string; invitationToken?: string }) {
  return request<{ userId: string; workspaceId: string }>('/auth/signup', { method: 'POST', body: JSON.stringify(input) });
}

export function login(input: { email: string; password: string }) {
  return request<{ userId: string; activeWorkspaceId: string }>('/auth/login', { method: 'POST', body: JSON.stringify(input) });
}

export function logout() {
  return request<void>('/auth/logout', { method: 'POST' });
}

export function getBootstrapStatus() {
  return request<{ hasAnyUser: boolean }>('/auth/bootstrap-status');
}

export function requestPasswordReset(email: string) {
  return request<{ code: string }>('/auth/request-password-reset', { method: 'POST', body: JSON.stringify({ email }) });
}

export function resetPassword(input: { token: string; newPassword: string }) {
  return request<{ code: string }>('/auth/reset-password', { method: 'POST', body: JSON.stringify(input) });
}

export function getSession() {
  return request<{ userId: string; activeWorkspaceId: string; workspaces: { id: string; name: string }[] }>('/workspaces/me').catch(
    err => {
      if (err instanceof ApiError && err.status === 401) return null;
      throw err;
    }
  );
}

export function getInvitation(token: string) {
  return request<{ email: string; workspaceId: string; hasAccount: boolean }>(`/invitations/${token}`);
}

export function acceptInvitation(token: string) {
  return request<{ workspaceId: string }>(`/invitations/${token}/accept`, { method: 'POST' });
}

export function listMembers(workspaceId: string) {
  return request<{ members: { userId: string; email: string; name: string; role: 'owner' | 'member' }[] }>(
    `/workspaces/${workspaceId}/members`
  );
}

export function inviteMember(workspaceId: string, input: { email: string; role: 'owner' | 'member' }) {
  return request<{ token: string; expiresAt: string }>(`/workspaces/${workspaceId}/invitations`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function switchWorkspace(workspaceId: string) {
  return request<{ activeWorkspaceId: string }>(`/workspaces/${workspaceId}/switch`, { method: 'POST' });
}

export function createWorkspace(name: string) {
  return request<{ id: string; name: string; activeWorkspaceId: string }>('/workspaces', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export function listBoards(workspaceId: string) {
  return request<{ boards: { id: string; name: string; updatedAt: string }[] }>(`/workspaces/${workspaceId}/boards`);
}

export function createBoard(workspaceId: string, name: string) {
  return request<{ id: string; name: string; updatedAt: string }>(`/workspaces/${workspaceId}/boards`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export function getBoard(workspaceId: string, boardId: string) {
  return request<{ id: string; name: string; document: ViewDocument; updatedAt: string }>(
    `/workspaces/${workspaceId}/boards/${boardId}`
  );
}

export function updateBoard(workspaceId: string, boardId: string, input: { name?: string; document?: ViewDocument }) {
  return request<{ id: string; name: string; updatedAt: string }>(`/workspaces/${workspaceId}/boards/${boardId}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export function deleteBoard(workspaceId: string, boardId: string) {
  return request<void>(`/workspaces/${workspaceId}/boards/${boardId}`, { method: 'DELETE' });
}

export type ConnectorAuthType = 'none' | 'bearer' | 'header';

export interface ConnectorSummary {
  id: string;
  name: string;
  type: 'http';
  baseUrl: string;
  authType: ConnectorAuthType;
  authHeaderName?: string;
  updatedAt: string;
}

export function listConnectors(workspaceId: string) {
  return request<{ connectors: ConnectorSummary[] }>(`/workspaces/${workspaceId}/connectors`);
}

export function createConnector(
  workspaceId: string,
  input: { name: string; baseUrl: string; authType: ConnectorAuthType; authHeaderName?: string; authValue?: string }
) {
  return request<ConnectorSummary>(`/workspaces/${workspaceId}/connectors`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateConnector(
  workspaceId: string,
  connectorId: string,
  input: { name?: string; baseUrl?: string; authType?: ConnectorAuthType; authHeaderName?: string; authValue?: string }
) {
  return request<ConnectorSummary>(`/workspaces/${workspaceId}/connectors/${connectorId}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export function deleteConnector(workspaceId: string, connectorId: string) {
  return request<void>(`/workspaces/${workspaceId}/connectors/${connectorId}`, { method: 'DELETE' });
}

export function resolveConnector(workspaceId: string, connectorId: string, ref: { path: string; valuePath?: string }) {
  return request<{ value: unknown; quality: 'live' | 'stale' | 'disconnected' }>(
    `/workspaces/${workspaceId}/connectors/${connectorId}/resolve`,
    { method: 'POST', body: JSON.stringify({ ref }) }
  );
}

export interface ShareTokenSummary {
  id: string;
  tokenMask: string;
  createdAt: string;
  lastUsedAt?: string;
}

export function listShareTokens(workspaceId: string, boardId: string) {
  return request<{ tokens: ShareTokenSummary[] }>(`/workspaces/${workspaceId}/boards/${boardId}/share-tokens`);
}

export function createShareToken(workspaceId: string, boardId: string) {
  return request<{ id: string; token: string; tokenMask: string; createdAt: string }>(
    `/workspaces/${workspaceId}/boards/${boardId}/share-tokens`,
    { method: 'POST' }
  );
}

export function deleteShareToken(workspaceId: string, boardId: string, tokenId: string) {
  return request<void>(`/workspaces/${workspaceId}/boards/${boardId}/share-tokens/${tokenId}`, { method: 'DELETE' });
}
