import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginPage } from './LoginPage.js';
import * as api from '../api-client.js';

vi.mock('../api-client.js');
beforeEach(() => vi.resetAllMocks());

describe('LoginPage', () => {
  it('submits credentials and calls onSuccess', async () => {
    vi.mocked(api.login).mockResolvedValue({ userId: 'u1', activeWorkspaceId: 'w1' });
    const onSuccess = vi.fn();
    render(<LoginPage onSuccess={onSuccess} />);

    await userEvent.type(screen.getByLabelText('이메일'), 'a@x.com');
    await userEvent.type(screen.getByLabelText('비밀번호'), 'p4ssword!');
    await userEvent.click(screen.getByRole('button', { name: '로그인' }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith('w1'));
  });

  it('shows a generic error on invalid credentials (no enumeration)', async () => {
    vi.mocked(api.login).mockRejectedValue(new api.ApiError('INVALID_CREDENTIALS', 401));
    render(<LoginPage onSuccess={vi.fn()} />);

    await userEvent.type(screen.getByLabelText('이메일'), 'a@x.com');
    await userEvent.type(screen.getByLabelText('비밀번호'), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: '로그인' }));

    expect(await screen.findByText('이메일 또는 비밀번호가 올바르지 않습니다.')).toBeInTheDocument();
  });
});
