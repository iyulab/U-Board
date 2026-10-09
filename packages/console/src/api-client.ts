import type { ViewDocument } from '@iyulab/u-board';
import type { ResolvedBinding } from '@iyulab/u-board';
import { serverClock } from '@iyulab/u-board';

export class ApiError extends Error {
  /** `body` is the whole error response, for codes that carry more than the code — e.g. `LAST_OWNER`
   *  on account deletion names the workspaces. */
  constructor(public code: string, public status: number, public body: Record<string, unknown> = {}) {
    super(code);
    this.name = 'ApiError';
  }
}

// A scale-to-zero production host's cold start has been observed to exceed 20s before
// the first byte arrives — longer than a typical client-side timeout — so a plain `fetch` here
// can read as "just broken" rather than "slow". One retry after the timeout absorbs exactly that
// case (the instance is warm by the second attempt) without masking a genuinely dead backend.
const REQUEST_TIMEOUT_MS = 30_000;

/** The server's clock, as its responses tell it — what the editor's "N minutes ago" is measured by,
 * since the values it previews are stamped by the server. */
export const apiClock = serverClock();

/** One request, its response's `Date` taken into `apiClock`. */
async function timedFetch(url: string, init: RequestInit): Promise<Response> {
  const sentAt = Date.now();
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  apiClock.observe(res, sentAt);
  return res;
}

async function fetchWithRetry(url: string, init: RequestInit): Promise<Response> {
  try {
    return await timedFetch(url, init);
  } catch (err) {
    // Checked via `.name` rather than `instanceof DOMException`/`instanceof Error` — the abort
    // reason `AbortSignal.timeout` throws is a `DOMException`, but whether that inherits from
    // `Error` varies across environments (true in real browsers and Node, not in jsdom's test
    // implementation); `.name` is the one property both agree on.
    if ((err as { name?: string } | null)?.name === 'TimeoutError') {
      return timedFetch(url, init);
    }
    throw err;
  }
}

// Every API route lives under `/api` on this app's own origin: the server serves the console.
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetchWithRetry(`/api${path}`, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ code: 'UNKNOWN_ERROR' }));
    throw new ApiError(body.code ?? 'UNKNOWN_ERROR', res.status, body);
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

/** Sends a pending invitation again — the same link, valid for another full period. Answers like
 *  `inviteMember`: the link comes back only when it was not emailed. */
export function resendInvitation(workspaceId: string, invitationId: string) {
  return request<{ token?: string; expiresAt: string; emailed: boolean }>(
    `/workspaces/${workspaceId}/invitations/${invitationId}/resend`,
    { method: 'POST' }
  );
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

export type ConnectorAuthType = 'none' | 'bearer' | 'header' | 'query' | 'path' | 'oauth2-client-credentials';

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
  authParamName?: string;
  /** How the source is credited under a board that shows its data. */
  attribution?: { text: string; url?: string };
  updatedAt: string;
}

export function listConnectors(workspaceId: string) {
  return request<{ connectors: ConnectorSummary[] }>(`/workspaces/${workspaceId}/connectors`);
}

export function createConnector(
  workspaceId: string,
  input: { name: string; baseUrl: string; authType: ConnectorAuthType; authHeaderName?: string; authParamName?: string; authValue?: string; attribution?: { text: string; url?: string } | null } & ConnectorOAuthSettings
) {
  return request<ConnectorSummary>(`/workspaces/${workspaceId}/connectors`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/** How trying a connector's settings went: `ok`, or the stage that failed (`token` — the OAuth token
 *  request; `request` — the data source; `response` — reading its answer), why, and what the
 *  upstream answered with. */
export type ConnectorTestResult =
  | { ok: true; excerpt?: string }
  | {
      ok: false;
      stage: 'token' | 'request' | 'response';
      reason: 'transport' | 'auth' | 'address' | 'format' | 'throttled';
      status?: number;
      message: string;
      /** The start of the body the source answered with, when it could not be read. */
      excerpt?: string;
    };

/** Tries settings without saving them: the OAuth token request and, given `path`, one request to the
 *  data source. With `connectorId` the settings are an edit of that connector — a secret left out is
 *  the stored one. Fails with `PATH_REQUIRED` when there is nothing to call without a path. */
export function testConnector(
  workspaceId: string,
  input: { connectorId?: string; path?: string; baseUrl?: string; authType?: ConnectorAuthType; authHeaderName?: string; authParamName?: string; authValue?: string } & ConnectorOAuthSettings
) {
  return request<ConnectorTestResult>(`/workspaces/${workspaceId}/connectors/test`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateConnector(
  workspaceId: string,
  connectorId: string,
  input: { name?: string; baseUrl?: string; authType?: ConnectorAuthType; authHeaderName?: string; authParamName?: string; authValue?: string; attribution?: { text: string; url?: string } | null } & ConnectorOAuthSettings
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

/** A workspace as an operator sees it: enough to run the installation, nothing of its contents. */
export interface InstanceWorkspace {
  id: string;
  name: string;
  createdAt: string;
  memberCount: number;
  owners: { userId: string; email: string; name: string }[];
}

export interface InstanceUser {
  id: string;
  email: string;
  name: string;
  instanceRole: 'operator' | 'user';
  createdAt: string;
  workspaceCount: number;
}

/** Operators only, like every `/instance` call. The installation itself: the product version it runs. */
export function getInstance() {
  return request<{ version: string }>('/instance');
}

export function listInstanceWorkspaces() {
  return request<{ workspaces: InstanceWorkspace[] }>('/instance/workspaces');
}

export function listInstanceUsers() {
  return request<{ users: InstanceUser[] }>('/instance/users');
}

/** Fails with `LAST_OPERATOR` when it would leave the installation without an operator. */
export function setInstanceRole(userId: string, instanceRole: 'operator' | 'user') {
  return request<void>(`/instance/users/${userId}`, { method: 'PATCH', body: JSON.stringify({ instanceRole }) });
}

/** Makes an account an owner of a workspace — the operator's way back into one whose owners are gone. */
export function makeWorkspaceOwner(workspaceId: string, userId: string) {
  return request<void>(`/instance/workspaces/${workspaceId}/owners`, { method: 'POST', body: JSON.stringify({ userId }) });
}

export type AuditAction =
  | 'workspace.created'
  | 'workspace.owner_restored'
  | 'member.joined'
  | 'member.left'
  | 'member.removed'
  | 'member.role_changed'
  | 'invitation.created'
  | 'invitation.resent'
  | 'invitation.revoked'
  | 'instance.role_changed'
  | 'account.deleted'
  | 'board.created'
  | 'board.deleted'
  | 'share_link.created'
  | 'share_link.deleted'
  | 'connector.created'
  | 'connector.updated'
  | 'connector.deleted';

/** Someone a record names — `userId` and `name` are null once their account has been deleted. */
export interface AuditPerson {
  userId: string | null;
  name: string | null;
}

export interface AuditEvent {
  id: string;
  occurredAt: string;
  action: AuditAction;
  workspace: { id: string; name: string } | null;
  actor: AuditPerson;
  subject: (AuditPerson & { email: string | null }) | null;
  role: string | null;
  /** The board or connector a record is about, named as it was then. */
  target: { id: string; name: string } | null;
  /** A share link's visible ending, or which connector settings changed (`name`, `base_url`, `auth`). */
  detail: string | null;
}

export interface AuditEventList {
  events: AuditEvent[];
  /** Pass back as `before` for the next (older) page; null when there is none. */
  nextBefore: string | null;
}

function auditQuery(before?: string): string {
  return before ? `?before=${encodeURIComponent(before)}` : '';
}

/** A workspace's record of membership, role and invitation changes, newest first. Owners only. */
export function listWorkspaceAudit(workspaceId: string, before?: string) {
  return request<AuditEventList>(`/workspaces/${workspaceId}/audit${auditQuery(before)}`);
}

/** The installation's record — workspaces created, owners restored, operators designated, accounts deleted. */
export function listInstanceAudit(before?: string) {
  return request<AuditEventList>(`/instance/audit${auditQuery(before)}`);
}

/** The signed-in account. */
export function getAccount() {
  return request<{ id: string; email: string; name: string }>('/auth/me');
}

/** Fails with `INVALID_NAME` for a blank or overlong name. */
export function renameAccount(name: string) {
  return request<{ name: string }>('/auth/me', { method: 'PATCH', body: JSON.stringify({ name }) });
}

/** Signs out every other session of the account; this one continues. Fails with
 *  `INVALID_CREDENTIALS` (wrong current password), `PASSWORD_TOO_SHORT` or `PASSWORD_TOO_LONG`. */
export function changePassword(input: { currentPassword: string; newPassword: string }) {
  return request<void>('/auth/change-password', { method: 'POST', body: JSON.stringify(input) });
}

/** Deletes the signed-in account. Fails with `INVALID_CREDENTIALS`, `LAST_OPERATOR`, or `LAST_OWNER`
 *  with `body.workspaces` naming the workspaces it is the only owner of. */
export function deleteAccount(password: string) {
  return request<void>('/auth/me', { method: 'DELETE', body: JSON.stringify({ password }) });
}
