import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { DashboardPage } from './DashboardPage.js';
import * as api from '../api-client.js';

vi.mock('../api-client.js');
beforeEach(() => vi.resetAllMocks());

// DashboardPage now renders a <Link> (to /boards), which needs a Router context even when
// the component is rendered standalone in these tests.
function renderDashboard(props: Parameters<typeof DashboardPage>[0]) {
  return render(
    <MemoryRouter>
      <DashboardPage {...props} />
    </MemoryRouter>
  );
}

describe('DashboardPage', () => {
  it('shows a loading state before the initial session resolves', async () => {
    let resolveSession!: (value: Awaited<ReturnType<typeof api.getSession>>) => void;
    vi.mocked(api.getSession).mockReturnValue(new Promise(resolve => { resolveSession = resolve; }));
    vi.mocked(api.listMembers).mockResolvedValue({ members: [] });

    renderDashboard({ onLoggedOut: vi.fn() });
    expect(screen.getByText('불러오는 중...')).toBeInTheDocument();

    resolveSession({ userId: 'u1', activeWorkspaceId: 'w1', workspaces: [{ id: 'w1', name: 'Default' }] });
    await waitFor(() => expect(screen.queryByText('불러오는 중...')).not.toBeInTheDocument());
  });

  it('shows an error when the initial session fetch fails, instead of a silently empty dashboard', async () => {
    vi.mocked(api.getSession).mockRejectedValue(new Error('network down'));

    renderDashboard({ onLoggedOut: vi.fn() });

    expect(await screen.findByRole('alert')).toHaveTextContent('대시보드를 불러오지 못했습니다');
  });

  it('recovers from a session load failure via the retry button', async () => {
    vi.mocked(api.getSession).mockRejectedValueOnce(new Error('network down'));
    vi.mocked(api.listMembers).mockResolvedValue({
      members: [{ userId: 'u1', email: 'owner@x.com', name: 'Owner', role: 'owner' }],
    });

    renderDashboard({ onLoggedOut: vi.fn() });
    expect(await screen.findByRole('alert')).toHaveTextContent('대시보드를 불러오지 못했습니다');

    vi.mocked(api.getSession).mockResolvedValueOnce({
      userId: 'u1', activeWorkspaceId: 'w1', workspaces: [{ id: 'w1', name: 'Default' }],
    });
    await userEvent.click(screen.getByRole('button', { name: '다시 시도' }));

    expect(await screen.findByText('owner@x.com')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('loads session and renders members', async () => {
    vi.mocked(api.getSession).mockResolvedValue({
      userId: 'u1', activeWorkspaceId: 'w1', workspaces: [{ id: 'w1', name: 'Default' }],
    });
    vi.mocked(api.listMembers).mockResolvedValue({
      members: [{ userId: 'u1', email: 'owner@x.com', name: 'Owner', role: 'owner' }],
    });

    renderDashboard({ onLoggedOut: vi.fn() });

    expect(await screen.findByText('owner@x.com')).toBeInTheDocument();
    expect(screen.getByText('owner')).toBeInTheDocument();
  });

  it('submits an invitation and shows the generated link', async () => {
    vi.mocked(api.getSession).mockResolvedValue({
      userId: 'u1', activeWorkspaceId: 'w1', workspaces: [{ id: 'w1', name: 'Default' }],
    });
    vi.mocked(api.listMembers).mockResolvedValue({
      members: [{ userId: 'u1', email: 'owner@x.com', name: 'Owner', role: 'owner' }],
    });
    vi.mocked(api.inviteMember).mockResolvedValue({ token: 'abc123', expiresAt: '2026-08-27T00:00:00.000Z' });

    renderDashboard({ onLoggedOut: vi.fn() });
    await screen.findByRole('button', { name: '초대' });

    await userEvent.type(screen.getByLabelText('초대할 이메일'), 'new@x.com');
    await userEvent.click(screen.getByRole('button', { name: '초대' }));

    await waitFor(() => expect(api.inviteMember).toHaveBeenCalledWith('w1', { email: 'new@x.com', role: 'member' }));
    expect(await screen.findByDisplayValue(/\/invite\/abc123$/)).toBeInTheDocument();
  });

  it('hides the invite form from a member who is not the workspace owner', async () => {
    vi.mocked(api.getSession).mockResolvedValue({
      userId: 'u2', activeWorkspaceId: 'w1', workspaces: [{ id: 'w1', name: 'Default' }],
    });
    vi.mocked(api.listMembers).mockResolvedValue({
      members: [
        { userId: 'u1', email: 'owner@x.com', name: 'Owner', role: 'owner' },
        { userId: 'u2', email: 'member@x.com', name: 'Member', role: 'member' },
      ],
    });

    renderDashboard({ onLoggedOut: vi.fn() });
    // The member list arrives in a second effect, so wait for it before asserting an absence.
    expect(await screen.findByText('member@x.com')).toBeInTheDocument();

    expect(screen.queryByRole('button', { name: '초대' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('초대할 이메일')).not.toBeInTheDocument();
  });

  it('surfaces an error when creating an invitation fails', async () => {
    vi.mocked(api.getSession).mockResolvedValue({
      userId: 'u1', activeWorkspaceId: 'w1', workspaces: [{ id: 'w1', name: 'Default' }],
    });
    vi.mocked(api.listMembers).mockResolvedValue({
      members: [{ userId: 'u1', email: 'owner@x.com', name: 'Owner', role: 'owner' }],
    });
    vi.mocked(api.inviteMember).mockRejectedValue(new api.ApiError('ALREADY_MEMBER', 409));

    renderDashboard({ onLoggedOut: vi.fn() });
    await screen.findByRole('button', { name: '초대' });

    await userEvent.type(screen.getByLabelText('초대할 이메일'), 'owner@x.com');
    await userEvent.click(screen.getByRole('button', { name: '초대' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('초대에 실패했습니다.');
  });

  it('calls onLoggedOut after logging out', async () => {
    vi.mocked(api.getSession).mockResolvedValue({
      userId: 'u1', activeWorkspaceId: 'w1', workspaces: [{ id: 'w1', name: 'Default' }],
    });
    vi.mocked(api.listMembers).mockResolvedValue({ members: [] });
    vi.mocked(api.logout).mockResolvedValue(undefined);
    const onLoggedOut = vi.fn();

    renderDashboard({ onLoggedOut });
    await userEvent.click(await screen.findByRole('button', { name: '로그아웃' }));

    await waitFor(() => expect(onLoggedOut).toHaveBeenCalled());
  });
});
