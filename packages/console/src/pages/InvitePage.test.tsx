import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InvitePage } from './InvitePage.js';
import * as api from '../api-client.js';

vi.mock('../api-client.js');
beforeEach(() => vi.resetAllMocks());

describe('InvitePage', () => {
  it('shows the login form (with accept-on-login) when the invited email already has an account', async () => {
    vi.mocked(api.getInvitation).mockResolvedValue({ email: 'existing@x.com', workspaceId: 'w1', hasAccount: true });
    vi.mocked(api.login).mockResolvedValue({ userId: 'u1', activeWorkspaceId: 'other-workspace' });
    vi.mocked(api.acceptInvitation).mockResolvedValue({ workspaceId: 'w1' });
    const onJoined = vi.fn();

    render(<InvitePage token="tok123" onJoined={onJoined} />);

    const emailInput = await screen.findByLabelText('이메일');
    expect((emailInput as HTMLInputElement).value).toBe('existing@x.com');
    await userEvent.type(screen.getByLabelText('비밀번호'), 'p4ssword!');
    await userEvent.click(screen.getByRole('button', { name: '로그인' }));

    await waitFor(() => expect(api.acceptInvitation).toHaveBeenCalledWith('tok123'));
    await waitFor(() => expect(onJoined).toHaveBeenCalledWith('w1'));
  });

  it('shows the signup form when the invited email has no account, and joins without a separate accept call', async () => {
    vi.mocked(api.getInvitation).mockResolvedValue({ email: 'new@x.com', workspaceId: 'w1', hasAccount: false });
    vi.mocked(api.signup).mockResolvedValue({ userId: 'u2', workspaceId: 'w1' });
    const onJoined = vi.fn();

    render(<InvitePage token="tok123" onJoined={onJoined} />);

    await screen.findByLabelText('비밀번호');
    await userEvent.type(screen.getByLabelText('비밀번호'), 'p4ssword!');
    await userEvent.type(screen.getByLabelText('이름'), 'New');
    await userEvent.click(screen.getByRole('button', { name: '가입' }));

    await waitFor(() => expect(onJoined).toHaveBeenCalledWith('w1'));
    expect(api.acceptInvitation).not.toHaveBeenCalled();
  });

  it('shows an expiry message for an invalid token', async () => {
    vi.mocked(api.getInvitation).mockRejectedValue(new api.ApiError('INVITATION_EXPIRED', 410));
    render(<InvitePage token="expired" onJoined={vi.fn()} />);
    expect(await screen.findByText('초대가 만료되었거나 이미 사용되었습니다.')).toBeInTheDocument();
  });
});
