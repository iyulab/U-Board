import type { ViewDocument } from '@iyulab/u-board';

export class ApiError extends Error {
  constructor(public code: string, public status: number) {
    super(code);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
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
