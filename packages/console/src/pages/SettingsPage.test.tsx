import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsPage } from './SettingsPage.js';
import * as api from '../api-client.js';

vi.mock('../api-client.js');
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(api.listInvitations).mockResolvedValue({ invitations: [] });
  vi.spyOn(window, 'confirm').mockReturnValue(true);
});
afterEach(() => vi.restoreAllMocks());

const OWNER = { userId: 'u1', email: 'owner@x.com', name: 'Owner', role: 'owner' as const };
const MEMBER = { userId: 'u2', email: 'member@x.com', name: 'Member', role: 'member' as const };

function renderPage(userId = 'u1', onLeft = vi.fn()) {
  render(<SettingsPage workspaceId="w1" userId={userId} onLeft={onLeft} />);
  return { onLeft };
}

describe('SettingsPage', () => {
  it('loads and renders workspace members', async () => {
    vi.mocked(api.listMembers).mockResolvedValue({ members: [MEMBER] });

    renderPage('u2');

    expect(await screen.findByText('member@x.com')).toBeInTheDocument();
    expect(screen.getByText('member')).toBeInTheDocument();
  });

  it('submits an invitation with the chosen role and shows the generated link', async () => {
    vi.mocked(api.listMembers).mockResolvedValue({ members: [OWNER] });
    vi.mocked(api.inviteMember).mockResolvedValue({ token: 'abc123', expiresAt: '2026-08-27T00:00:00.000Z', emailed: false });

    renderPage();
    await screen.findByRole('button', { name: '초대' });

    await userEvent.type(screen.getByLabelText('초대할 이메일'), 'new@x.com');
    await userEvent.selectOptions(screen.getByLabelText('초대 역할'), 'owner');
    await userEvent.click(screen.getByRole('button', { name: '초대' }));

    expect(api.inviteMember).toHaveBeenCalledWith('w1', { email: 'new@x.com', role: 'owner' });
    expect(await screen.findByDisplayValue(/\/invite\/abc123$/)).toBeInTheDocument();
    expect(api.listInvitations).toHaveBeenCalledTimes(2); // on load, and again after inviting
    expect(screen.queryByText(/초대 메일을 보냈습니다/)).not.toBeInTheDocument();
  });

  it('says the invitation was emailed when the server mailed it, and still shows the link', async () => {
    vi.mocked(api.listMembers).mockResolvedValue({ members: [OWNER] });
    vi.mocked(api.inviteMember).mockResolvedValue({ token: 'abc123', expiresAt: '2026-08-27T00:00:00.000Z', emailed: true });

    renderPage();
    await userEvent.type(await screen.findByLabelText('초대할 이메일'), 'new@x.com');
    await userEvent.click(screen.getByRole('button', { name: '초대' }));

    expect(await screen.findByText('new@x.com에게 초대 메일을 보냈습니다. 메일이 닿지 않으면 아래 링크를 전달하세요.')).toBeInTheDocument();
    expect(screen.getByDisplayValue(/\/invite\/abc123$/)).toBeInTheDocument();
  });

  it('hides owner controls from a member who is not the workspace owner', async () => {
    vi.mocked(api.listMembers).mockResolvedValue({ members: [OWNER, MEMBER] });

    renderPage('u2');
    expect(await screen.findByText('member@x.com')).toBeInTheDocument();

    expect(screen.queryByRole('button', { name: '초대' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('초대할 이메일')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'owner@x.com 제거' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('owner@x.com 역할')).not.toBeInTheDocument();
    expect(api.listInvitations).not.toHaveBeenCalled();
  });

  it('surfaces an error when creating an invitation fails', async () => {
    vi.mocked(api.listMembers).mockResolvedValue({ members: [OWNER] });
    vi.mocked(api.inviteMember).mockRejectedValue(new api.ApiError('ALREADY_MEMBER', 409));

    renderPage();
    await screen.findByRole('button', { name: '초대' });

    await userEvent.type(screen.getByLabelText('초대할 이메일'), 'owner@x.com');
    await userEvent.click(screen.getByRole('button', { name: '초대' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('초대에 실패했습니다.');
  });

  it('reloads members when the active workspace changes', async () => {
    vi.mocked(api.listMembers).mockResolvedValue({ members: [] });
    const { rerender } = render(<SettingsPage workspaceId="w1" userId="u1" onLeft={vi.fn()} />);
    await vi.waitFor(() => expect(api.listMembers).toHaveBeenCalledWith('w1'));

    rerender(<SettingsPage workspaceId="w2" userId="u1" onLeft={vi.fn()} />);
    await vi.waitFor(() => expect(api.listMembers).toHaveBeenCalledWith('w2'));
  });

  it('lets an owner remove another member after confirming', async () => {
    vi.mocked(api.listMembers).mockResolvedValueOnce({ members: [OWNER, MEMBER] }).mockResolvedValue({ members: [OWNER] });
    vi.mocked(api.removeMember).mockResolvedValue(undefined);

    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: 'member@x.com 제거' }));

    expect(window.confirm).toHaveBeenCalled();
    expect(api.removeMember).toHaveBeenCalledWith('w1', 'u2');
    await vi.waitFor(() => expect(screen.queryByText('member@x.com')).not.toBeInTheDocument());
  });

  it('does not remove when the confirmation is declined', async () => {
    vi.mocked(api.listMembers).mockResolvedValue({ members: [OWNER, MEMBER] });
    vi.mocked(window.confirm).mockReturnValue(false);

    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: 'member@x.com 제거' }));

    expect(api.removeMember).not.toHaveBeenCalled();
  });

  it('changes a member role from the owner view', async () => {
    vi.mocked(api.listMembers).mockResolvedValue({ members: [OWNER, MEMBER] });
    vi.mocked(api.setMemberRole).mockResolvedValue(undefined);

    renderPage();
    await userEvent.selectOptions(await screen.findByLabelText('member@x.com 역할'), 'owner');

    expect(api.setMemberRole).toHaveBeenCalledWith('w1', 'u2', 'owner');
  });

  it('explains the last-owner rule when demoting the only owner is refused', async () => {
    vi.mocked(api.listMembers).mockResolvedValue({ members: [OWNER, MEMBER] });
    vi.mocked(api.setMemberRole).mockRejectedValue(new api.ApiError('LAST_OWNER', 409));

    renderPage();
    await userEvent.selectOptions(await screen.findByLabelText('owner@x.com 역할'), 'member');

    expect(await screen.findByRole('alert')).toHaveTextContent('owner가 한 명 이상');
  });

  it('lets the user leave and reports it so the session can be re-read', async () => {
    vi.mocked(api.listMembers).mockResolvedValue({ members: [OWNER, MEMBER] });
    vi.mocked(api.removeMember).mockResolvedValue(undefined);

    const { onLeft } = renderPage('u2');
    await userEvent.click(await screen.findByRole('button', { name: '나가기' }));

    expect(api.removeMember).toHaveBeenCalledWith('w1', 'u2');
    await vi.waitFor(() => expect(onLeft).toHaveBeenCalled());
  });

  it('keeps the user in place when leaving is refused as the last owner', async () => {
    vi.mocked(api.listMembers).mockResolvedValue({ members: [OWNER] });
    vi.mocked(api.removeMember).mockRejectedValue(new api.ApiError('LAST_OWNER', 409));

    const { onLeft } = renderPage();
    await userEvent.click(await screen.findByRole('button', { name: '나가기' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('owner가 한 명 이상');
    expect(onLeft).not.toHaveBeenCalled();
  });

  it('lists pending invitations for an owner and revokes one', async () => {
    vi.mocked(api.listMembers).mockResolvedValue({ members: [OWNER] });
    vi.mocked(api.listInvitations)
      .mockResolvedValueOnce({ invitations: [{ id: 'i1', email: 'new@x.com', role: 'owner', expiresAt: '2026-10-12T00:00:00.000Z' }] })
      .mockResolvedValue({ invitations: [] });
    vi.mocked(api.revokeInvitation).mockResolvedValue(undefined);

    renderPage();
    const heading = await screen.findByRole('heading', { name: '대기 중인 초대' });
    const list = heading.nextElementSibling as HTMLElement;
    expect(within(list).getByText('new@x.com')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'new@x.com 초대 취소' }));

    expect(api.revokeInvitation).toHaveBeenCalledWith('w1', 'i1');
    await vi.waitFor(() => expect(screen.queryByRole('heading', { name: '대기 중인 초대' })).not.toBeInTheDocument());
  });
});
