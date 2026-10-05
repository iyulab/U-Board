import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { App } from './App.js';
import * as api from './api-client.js';

vi.mock('./api-client.js');
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(api.listWorkspaceAudit).mockResolvedValue({ events: [], nextBefore: null });
  vi.mocked(api.listInstanceAudit).mockResolvedValue({ events: [], nextBefore: null });
});

function session(overrides: Partial<api.Session> = {}): api.Session {
  return {
    userId: 'u1',
    activeWorkspaceId: 'w1',
    workspaces: [{ id: 'w1', name: 'Default' }],
    instanceRole: 'operator',
    canCreateWorkspaces: true,
    ...overrides,
  };
}

describe('App', () => {
  it('shows LoginPage at "/" when a User already exists but the visitor has no session', async () => {
    vi.mocked(api.getSession).mockResolvedValue(null);
    vi.mocked(api.getBootstrapStatus).mockResolvedValue({ hasAnyUser: true });
    render(<App RouterComponent={MemoryRouter} initialEntries={['/']} />);
    expect(await screen.findByRole('heading', { name: '로그인' })).toBeInTheDocument();
  });

  it('shows SignupPage at "/" when no User exists yet (first-ever visitor)', async () => {
    vi.mocked(api.getSession).mockResolvedValue(null);
    vi.mocked(api.getBootstrapStatus).mockResolvedValue({ hasAnyUser: false });
    render(<App RouterComponent={MemoryRouter} initialEntries={['/']} />);
    expect(await screen.findByRole('heading', { name: '가입' })).toBeInTheDocument();
  });

  it('redirects "/" to /boards (inside the authenticated shell) when a session exists', async () => {
    vi.mocked(api.getSession).mockResolvedValue(session());
    vi.mocked(api.listBoards).mockResolvedValue({ boards: [] });
    render(<App RouterComponent={MemoryRouter} initialEntries={['/']} />);
    expect(await screen.findByRole('heading', { name: '보드' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Default/ })).toBeInTheDocument();
  });

  it('shows a way back in, not workspace pages, when the user belongs to no workspace', async () => {
    vi.mocked(api.getSession).mockResolvedValue(session({ activeWorkspaceId: '', workspaces: [] }));
    render(<App RouterComponent={MemoryRouter} initialEntries={['/boards']} />);
    expect(await screen.findByText(/소속된 워크스페이스가 없습니다/)).toBeInTheDocument();
    expect(api.listBoards).not.toHaveBeenCalled();
  });

  it('points an account that may not create workspaces to an invitation, and offers no create action', async () => {
    vi.mocked(api.getSession).mockResolvedValue(
      session({ activeWorkspaceId: '', workspaces: [], instanceRole: 'user', canCreateWorkspaces: false })
    );
    const user = userEvent.setup();
    render(<App RouterComponent={MemoryRouter} initialEntries={['/boards']} />);
    expect(await screen.findByText(/운영자나 워크스페이스 owner에게 받은 초대 링크로 참여하세요/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /워크스페이스/ }));
    expect(screen.queryByRole('button', { name: '+ 새 워크스페이스' })).not.toBeInTheDocument();
  });

  it('sends the board editor back to /boards when the user belongs to no workspace', async () => {
    vi.mocked(api.getSession).mockResolvedValue(session({ activeWorkspaceId: '', workspaces: [] }));
    render(<App RouterComponent={MemoryRouter} initialEntries={['/boards/b1/edit']} />);
    expect(await screen.findByText(/소속된 워크스페이스가 없습니다/)).toBeInTheDocument();
    expect(api.getBoard).not.toHaveBeenCalled();
  });

  it('renders InvitePage at "/invite/:token"', async () => {
    vi.mocked(api.getInvitation as any).mockResolvedValue({ email: 'a@x.com', workspaceId: 'w1', hasAccount: false });
    render(<App RouterComponent={MemoryRouter} initialEntries={['/invite/tok123']} />);
    expect(await screen.findByRole('heading', { name: '가입' })).toBeInTheDocument();
  });

  it('renders ForgotPasswordPage at "/forgot-password"', async () => {
    render(<App RouterComponent={MemoryRouter} initialEntries={['/forgot-password']} />);
    expect(await screen.findByRole('heading', { name: '비밀번호 재설정 요청' })).toBeInTheDocument();
  });

  it('renders ResetPasswordPage at "/reset-password"', async () => {
    render(<App RouterComponent={MemoryRouter} initialEntries={['/reset-password']} />);
    expect(await screen.findByRole('heading', { name: '비밀번호 재설정' })).toBeInTheDocument();
  });

  it('shows a retryable error instead of hanging forever when the initial session check fails at "/"', async () => {
    vi.mocked(api.getSession)
      .mockRejectedValueOnce(new Error('network error'))
      .mockResolvedValueOnce(null);
    vi.mocked(api.getBootstrapStatus).mockResolvedValue({ hasAnyUser: true });
    const user = userEvent.setup();
    render(<App RouterComponent={MemoryRouter} initialEntries={['/']} />);

    expect(await screen.findByRole('alert')).toHaveTextContent('세션을 확인하지 못했습니다');
    await user.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(await screen.findByRole('heading', { name: '로그인' })).toBeInTheDocument();
  });
});

describe('/boards without a session', () => {
  it('redirects to / (which shows the login/signup gate)', async () => {
    vi.mocked(api.getSession).mockResolvedValue(null);
    vi.mocked(api.getBootstrapStatus).mockResolvedValue({ hasAnyUser: true });
    render(<App RouterComponent={MemoryRouter} initialEntries={['/boards']} />);
    expect(await screen.findByRole('heading', { name: '로그인' })).toBeInTheDocument();
  });
});

describe('/settings', () => {
  it('renders SettingsPage inside the authenticated shell', async () => {
    vi.mocked(api.getSession).mockResolvedValue(session());
    vi.mocked(api.listMembers).mockResolvedValue({ members: [{ userId: 'u1', email: 'owner@x.com', name: 'Owner', role: 'owner' }] });
    vi.mocked(api.listInvitations).mockResolvedValue({ invitations: [] });
    render(<App RouterComponent={MemoryRouter} initialEntries={['/settings']} />);

    expect(await screen.findByText('owner@x.com')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '설정' })).toHaveClass('ub-shell__nav-link--active');
    expect(screen.getByRole('button', { name: /Default/ })).toBeInTheDocument();
  });
});

describe('/instance', () => {
  it('shows the installation page to an operator, linked from the navigation, even with no workspace', async () => {
    vi.mocked(api.getSession).mockResolvedValue(session({ activeWorkspaceId: '', workspaces: [] }));
    vi.mocked(api.listInstanceWorkspaces).mockResolvedValue({ workspaces: [] });
    vi.mocked(api.listInstanceUsers).mockResolvedValue({ users: [] });
    render(<App RouterComponent={MemoryRouter} initialEntries={['/instance']} />);

    expect(await screen.findByRole('heading', { name: '계정' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '운영' })).toHaveClass('ub-shell__nav-link--active');
  });

  it('sends anyone else to /boards, with no link to it', async () => {
    vi.mocked(api.getSession).mockResolvedValue(session({ instanceRole: 'user', canCreateWorkspaces: false }));
    vi.mocked(api.listBoards).mockResolvedValue({ boards: [] });
    render(<App RouterComponent={MemoryRouter} initialEntries={['/instance']} />);

    expect(await screen.findByRole('heading', { name: '보드' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '운영' })).not.toBeInTheDocument();
    expect(api.listInstanceWorkspaces).not.toHaveBeenCalled();
  });
});
