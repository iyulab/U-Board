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

  it('shows DashboardPage at "/" when a session exists', async () => {
    vi.mocked(api.getSession).mockResolvedValue({ userId: 'u1', activeWorkspaceId: 'w1', workspaces: [{ id: 'w1', name: 'Default' }] });
    vi.mocked(api.listMembers).mockResolvedValue({ members: [] });
    render(<App RouterComponent={MemoryRouter} initialEntries={['/']} />);
    expect(await screen.findByText('멤버')).toBeInTheDocument();
  });

  it('renders InvitePage at "/invite/:token"', async () => {
    vi.mocked(api.getInvitation as any).mockResolvedValue({ email: 'a@x.com', workspaceId: 'w1', hasAccount: false });
    render(<App RouterComponent={MemoryRouter} initialEntries={['/invite/tok123']} />);
    expect(await screen.findByRole('heading', { name: '가입' })).toBeInTheDocument();
  });
});
