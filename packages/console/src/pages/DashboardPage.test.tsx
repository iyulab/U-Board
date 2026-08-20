import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardPage } from './DashboardPage.js';
import * as api from '../api-client.js';

vi.mock('../api-client.js');
beforeEach(() => vi.resetAllMocks());

describe('DashboardPage', () => {
  it('loads session and renders members', async () => {
    vi.mocked(api.getSession).mockResolvedValue({
      userId: 'u1', activeWorkspaceId: 'w1', workspaces: [{ id: 'w1', name: 'Default' }],
    });
    vi.mocked(api.listMembers).mockResolvedValue({
      members: [{ userId: 'u1', email: 'owner@x.com', name: 'Owner', role: 'owner' }],
    });

    render(<DashboardPage onLoggedOut={vi.fn()} />);

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

    render(<DashboardPage onLoggedOut={vi.fn()} />);
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

    render(<DashboardPage onLoggedOut={vi.fn()} />);
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

    render(<DashboardPage onLoggedOut={vi.fn()} />);
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

    render(<DashboardPage onLoggedOut={onLoggedOut} />);
    await userEvent.click(await screen.findByRole('button', { name: '로그아웃' }));

    await waitFor(() => expect(onLoggedOut).toHaveBeenCalled());
  });
});
