import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { InvitePage } from './InvitePage.js';
import * as api from '../api-client.js';

vi.mock('../api-client.js');
beforeEach(() => vi.resetAllMocks());

// The hasAccount:true path renders LoginPage, which renders a <Link> (to /forgot-password) and
// so needs a Router context even when InvitePage is rendered standalone in these tests.
function renderInvite(props: Parameters<typeof InvitePage>[0]) {
  return render(
    <MemoryRouter>
      <InvitePage {...props} />
    </MemoryRouter>
  );
}

describe('InvitePage', () => {
  it('shows the login form (with accept-on-login) when the invited email already has an account', async () => {
    vi.mocked(api.getInvitation).mockResolvedValue({ email: 'existing@x.com', workspaceId: 'w1', hasAccount: true });
    vi.mocked(api.login).mockResolvedValue({ userId: 'u1', activeWorkspaceId: 'other-workspace' });
    vi.mocked(api.acceptInvitation).mockResolvedValue({ workspaceId: 'w1' });
    vi.mocked(api.switchWorkspace).mockResolvedValue({ activeWorkspaceId: 'w1' });
    const onJoined = vi.fn();

    renderInvite({ token: 'tok123', onJoined });

    const emailInput = await screen.findByLabelText('이메일');
    expect((emailInput as HTMLInputElement).value).toBe('existing@x.com');
    await userEvent.type(screen.getByLabelText('비밀번호'), 'p4ssword!');
    await userEvent.click(screen.getByRole('button', { name: '로그인' }));

    await waitFor(() => expect(api.acceptInvitation).toHaveBeenCalledWith('tok123'));
    // The session cookie minted by `login` still points at the pre-existing workspace, so the
    // freshly joined one has to be made active before navigating to the dashboard.
    await waitFor(() => expect(api.switchWorkspace).toHaveBeenCalledWith('w1'));
    await waitFor(() => expect(onJoined).toHaveBeenCalledWith('w1'));
  });

  it('shows an error and does not navigate when accepting the invitation fails after login', async () => {
    vi.mocked(api.getInvitation).mockResolvedValue({ email: 'existing@x.com', workspaceId: 'w1', hasAccount: true });
    vi.mocked(api.login).mockResolvedValue({ userId: 'u1', activeWorkspaceId: 'other-workspace' });
    vi.mocked(api.acceptInvitation).mockRejectedValue(new api.ApiError('INVITATION_EXPIRED', 410));
    const onJoined = vi.fn();

    renderInvite({ token: 'tok123', onJoined });

    await screen.findByLabelText('비밀번호');
    await userEvent.type(screen.getByLabelText('비밀번호'), 'p4ssword!');
    await userEvent.click(screen.getByRole('button', { name: '로그인' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('초대 수락에 실패했습니다. 다시 시도해 주세요.');
    expect(api.switchWorkspace).not.toHaveBeenCalled();
    expect(onJoined).not.toHaveBeenCalled();
  });

  it('shows the signup form when the invited email has no account, and joins without a separate accept call', async () => {
    vi.mocked(api.getInvitation).mockResolvedValue({ email: 'new@x.com', workspaceId: 'w1', hasAccount: false });
    vi.mocked(api.signup).mockResolvedValue({ userId: 'u2', workspaceId: 'w1' });
    const onJoined = vi.fn();

    renderInvite({ token: 'tok123', onJoined });

    await screen.findByLabelText('비밀번호');
    await userEvent.type(screen.getByLabelText('비밀번호'), 'p4ssword!');
    await userEvent.type(screen.getByLabelText('이름'), 'New');
    await userEvent.click(screen.getByRole('button', { name: '가입' }));

    await waitFor(() => expect(onJoined).toHaveBeenCalledWith('w1'));
    expect(api.acceptInvitation).not.toHaveBeenCalled();
  });

  it('shows an expiry message for an invalid token', async () => {
    vi.mocked(api.getInvitation).mockRejectedValue(new api.ApiError('INVITATION_EXPIRED', 410));
    renderInvite({ token: 'expired', onJoined: vi.fn() });
    expect(await screen.findByText('초대가 만료되었거나 이미 사용되었습니다.')).toBeInTheDocument();
  });
});
