import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsPage } from './SettingsPage.js';
import * as api from '../api-client.js';

vi.mock('../api-client.js');
beforeEach(() => vi.resetAllMocks());

describe('SettingsPage', () => {
  it('loads and renders workspace members', async () => {
    vi.mocked(api.listMembers).mockResolvedValue({
      members: [{ userId: 'u1', email: 'owner@x.com', name: 'Owner', role: 'owner' }],
    });

    render(<SettingsPage workspaceId="w1" userId="u1" />);

    expect(await screen.findByText('owner@x.com')).toBeInTheDocument();
    expect(screen.getByText('owner')).toBeInTheDocument();
  });

  it('submits an invitation and shows the generated link', async () => {
    vi.mocked(api.listMembers).mockResolvedValue({
      members: [{ userId: 'u1', email: 'owner@x.com', name: 'Owner', role: 'owner' }],
    });
    vi.mocked(api.inviteMember).mockResolvedValue({ token: 'abc123', expiresAt: '2026-08-27T00:00:00.000Z' });

    render(<SettingsPage workspaceId="w1" userId="u1" />);
    await screen.findByRole('button', { name: '초대' });

    await userEvent.type(screen.getByLabelText('초대할 이메일'), 'new@x.com');
    await userEvent.click(screen.getByRole('button', { name: '초대' }));

    expect(await screen.findByDisplayValue(/\/invite\/abc123$/)).toBeInTheDocument();
  });

  it('hides the invite form from a member who is not the workspace owner', async () => {
    vi.mocked(api.listMembers).mockResolvedValue({
      members: [
        { userId: 'u1', email: 'owner@x.com', name: 'Owner', role: 'owner' },
        { userId: 'u2', email: 'member@x.com', name: 'Member', role: 'member' },
      ],
    });

    render(<SettingsPage workspaceId="w1" userId="u2" />);
    expect(await screen.findByText('member@x.com')).toBeInTheDocument();

    expect(screen.queryByRole('button', { name: '초대' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('초대할 이메일')).not.toBeInTheDocument();
  });

  it('surfaces an error when creating an invitation fails', async () => {
    vi.mocked(api.listMembers).mockResolvedValue({
      members: [{ userId: 'u1', email: 'owner@x.com', name: 'Owner', role: 'owner' }],
    });
    vi.mocked(api.inviteMember).mockRejectedValue(new api.ApiError('ALREADY_MEMBER', 409));

    render(<SettingsPage workspaceId="w1" userId="u1" />);
    await screen.findByRole('button', { name: '초대' });

    await userEvent.type(screen.getByLabelText('초대할 이메일'), 'owner@x.com');
    await userEvent.click(screen.getByRole('button', { name: '초대' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('초대에 실패했습니다.');
  });

  it('reloads members when the active workspace changes', async () => {
    vi.mocked(api.listMembers).mockResolvedValue({ members: [] });
    const { rerender } = render(<SettingsPage workspaceId="w1" userId="u1" />);
    await vi.waitFor(() => expect(api.listMembers).toHaveBeenCalledWith('w1'));

    rerender(<SettingsPage workspaceId="w2" userId="u1" />);
    await vi.waitFor(() => expect(api.listMembers).toHaveBeenCalledWith('w2'));
  });
});
