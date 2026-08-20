import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SignupPage } from './SignupPage.js';
import * as api from '../api-client.js';

vi.mock('../api-client.js');

beforeEach(() => {
  vi.resetAllMocks();
});

describe('SignupPage', () => {
  it('submits email/password/name and calls onSuccess with the workspaceId', async () => {
    vi.mocked(api.signup).mockResolvedValue({ userId: 'u1', workspaceId: 'w1' });
    const onSuccess = vi.fn();
    render(<SignupPage onSuccess={onSuccess} />);

    await userEvent.type(screen.getByLabelText('이메일'), 'a@x.com');
    await userEvent.type(screen.getByLabelText('비밀번호'), 'p4ssword!');
    await userEvent.type(screen.getByLabelText('이름'), 'A');
    await userEvent.click(screen.getByRole('button', { name: '가입' }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith('w1'));
    expect(api.signup).toHaveBeenCalledWith({ email: 'a@x.com', password: 'p4ssword!', name: 'A', invitationToken: undefined });
  });

  it('shows a server error message on 409 EMAIL_TAKEN', async () => {
    vi.mocked(api.signup).mockRejectedValue(new api.ApiError('EMAIL_TAKEN', 409));
    render(<SignupPage onSuccess={vi.fn()} />);

    await userEvent.type(screen.getByLabelText('이메일'), 'dup@x.com');
    await userEvent.type(screen.getByLabelText('비밀번호'), 'p4ssword!');
    await userEvent.type(screen.getByLabelText('이름'), 'A');
    await userEvent.click(screen.getByRole('button', { name: '가입' }));

    expect(await screen.findByText('이미 가입된 이메일입니다.')).toBeInTheDocument();
  });

  it('prefills and locks the email field when prefillEmail is given', () => {
    render(<SignupPage prefillEmail="invited@x.com" onSuccess={vi.fn()} />);
    const emailInput = screen.getByLabelText('이메일') as HTMLInputElement;
    expect(emailInput.value).toBe('invited@x.com');
    expect(emailInput).toBeDisabled();
  });
});
