import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { App } from './App.js';
import * as api from './api-client.js';

vi.mock('./api-client.js');
beforeEach(() => vi.resetAllMocks());

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
    vi.mocked(api.getSession).mockResolvedValue({ userId: 'u1', activeWorkspaceId: 'w1', workspaces: [{ id: 'w1', name: 'Default' }] });
    vi.mocked(api.listBoards).mockResolvedValue({ boards: [] });
    render(<App RouterComponent={MemoryRouter} initialEntries={['/']} />);
    expect(await screen.findByRole('heading', { name: '보드' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Default/ })).toBeInTheDocument();
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
    vi.mocked(api.getSession).mockResolvedValue({ userId: 'u1', activeWorkspaceId: 'w1', workspaces: [{ id: 'w1', name: 'Default' }] });
    vi.mocked(api.listMembers).mockResolvedValue({ members: [{ userId: 'u1', email: 'owner@x.com', name: 'Owner', role: 'owner' }] });
    render(<App RouterComponent={MemoryRouter} initialEntries={['/settings']} />);

    expect(await screen.findByText('owner@x.com')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '설정' })).toHaveClass('ub-shell__nav-link--active');
    expect(screen.getByRole('button', { name: /Default/ })).toBeInTheDocument();
  });
});
