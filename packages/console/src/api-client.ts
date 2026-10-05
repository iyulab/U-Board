import type { ViewDocument } from '@iyulab/u-board';
import type { ResolvedBinding } from '@iyulab/u-board';

export class ApiError extends Error {
  constructor(public code: string, public status: number) {
    super(code);
    this.name = 'ApiError';
  }
}

// A scale-to-zero production host's cold start has been observed to exceed 20s before
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

// Every API route lives under `/api` on the server's origin — this app's own origin unless
// `VITE_API_BASE_URL` points at a server hosted elsewhere.
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const origin = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '');
  const res = await fetchWithRetry(`${origin}/api${path}`, {
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

export interface Session {
  userId: string;
  activeWorkspaceId: string;
  workspaces: { id: string; name: string }[];
  /** `operator` runs the installation; every other account is a `user`. */
  instanceRole: 'operator' | 'user';
  /** Whether this account may create workspaces — the server's policy, applied to it. */
  canCreateWorkspaces: boolean;
}

export function getSession() {
  return request<Session>('/workspaces/me').catch(
    err => {
      if (err instanceof ApiError && err.status === 401) return null;
      throw err;
    }
  );
}

export interface InvitationDetails {
  email: string;
  workspaceId: string;
  workspaceName: string;
  inviterName: string;
  role: 'owner' | 'member';
  expiresAt: string;
  /** Whether the invited address already has an account — log in to accept, rather than sign up. */
  hasAccount: boolean;
}

export function getInvitation(token: string) {
  return request<InvitationDetails>(`/invitations/${token}`);
}

export function acceptInvitation(token: string) {
  return request<{ workspaceId: string }>(`/invitations/${token}/accept`, { method: 'POST' });
}

export function listMembers(workspaceId: string) {
  return request<{ members: { userId: string; email: string; name: string; role: 'owner' | 'member' }[] }>(
    `/workspaces/${workspaceId}/members`
  );
}

/** `emailed` says whether the server mailed the link (it does when it has an email provider and a
 *  configured public URL). A mailed link goes to the invited mailbox only, so `token` comes back only
 *  when the invitation was not emailed — for the owner to pass on by hand. */
export function inviteMember(workspaceId: string, input: { email: string; role: 'owner' | 'member' }) {
  return request<{ token?: string; expiresAt: string; emailed: boolean }>(`/workspaces/${workspaceId}/invitations`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/** Removes a member — or, with the caller's own id, leaves the workspace. Fails with `LAST_OWNER`
 * (409) when it would leave the workspace without an owner. */
export function removeMember(workspaceId: string, userId: string) {
  return request<void>(`/workspaces/${workspaceId}/members/${userId}`, { method: 'DELETE' });
}

/** Fails with `LAST_OWNER` (409) when it would demote the workspace's only owner. */
export function setMemberRole(workspaceId: string, userId: string, role: 'owner' | 'member') {
  return request<void>(`/workspaces/${workspaceId}/members/${userId}`, { method: 'PATCH', body: JSON.stringify({ role }) });
}

export interface PendingInvitation {
  id: string;
  email: string;
  role: 'owner' | 'member';
  expiresAt: string;
}

export function listInvitations(workspaceId: string) {
  return request<{ invitations: PendingInvitation[] }>(`/workspaces/${workspaceId}/invitations`);
}

export function revokeInvitation(workspaceId: string, invitationId: string) {
  return request<void>(`/workspaces/${workspaceId}/invitations/${invitationId}`, { method: 'DELETE' });
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

export type ConnectorAuthType = 'none' | 'bearer' | 'header' | 'oauth2-client-credentials';

/** How an `oauth2-client-credentials` connector authenticates to its token endpoint: HTTP Basic
 * (the server default), or client id/secret as form parameters. */
export type ConnectorOAuthClientAuth = 'basic' | 'body';

/** Non-secret OAuth settings; the client secret travels as `authValue`, like other secrets. */
export interface ConnectorOAuthSettings {
  oauthTokenUrl?: string;
  oauthClientId?: string;
  oauthScope?: string;
  oauthClientAuth?: ConnectorOAuthClientAuth;
}

export interface ConnectorSummary extends ConnectorOAuthSettings {
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
  input: { name: string; baseUrl: string; authType: ConnectorAuthType; authHeaderName?: string; authValue?: string } & ConnectorOAuthSettings
) {
  return request<ConnectorSummary>(`/workspaces/${workspaceId}/connectors`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateConnector(
  workspaceId: string,
  connectorId: string,
  input: { name?: string; baseUrl?: string; authType?: ConnectorAuthType; authHeaderName?: string; authValue?: string } & ConnectorOAuthSettings
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
  return request<ResolvedBinding>(
    `/workspaces/${workspaceId}/connectors/${connectorId}/resolve`,
    { method: 'POST', body: JSON.stringify({ ref }) }
  );
}

export interface ShareTokenSummary {
  id: string;
  tokenMask: string;
  createdAt: string;
  lastUsedAt?: string;
  /** When the link stops working (ISO 8601); absent for a link that works until revoked. */
  expiresAt?: string;
}

export function listShareTokens(workspaceId: string, boardId: string) {
  return request<{ tokens: ShareTokenSummary[] }>(`/workspaces/${workspaceId}/boards/${boardId}/share-tokens`);
}

/** `expiresAt` (ISO 8601, in the future) makes the link stop working then; omit it for a link that
 * works until revoked. */
export function createShareToken(workspaceId: string, boardId: string, expiresAt?: string) {
  return request<{ id: string; token: string; tokenMask: string; createdAt: string; expiresAt?: string }>(
    `/workspaces/${workspaceId}/boards/${boardId}/share-tokens`,
    { method: 'POST', body: JSON.stringify(expiresAt ? { expiresAt } : {}) }
  );
}

export function deleteShareToken(workspaceId: string, boardId: string, tokenId: string) {
  return request<void>(`/workspaces/${workspaceId}/boards/${boardId}/share-tokens/${tokenId}`, { method: 'DELETE' });
}
