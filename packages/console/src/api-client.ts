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
