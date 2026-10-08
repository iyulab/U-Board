import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { LoginPage } from './LoginPage.js';
import * as api from '../api-client.js';

vi.mock('../api-client.js');
beforeEach(() => vi.resetAllMocks());

// LoginPage renders a <Link> (to /forgot-password), which needs a Router context even when
// the component is rendered standalone in these tests.
function renderLogin(props: Parameters<typeof LoginPage>[0]) {
  return render(
    <MemoryRouter>
      <LoginPage {...props} />
    </MemoryRouter>
  );
}

describe('LoginPage', () => {
  it('submits credentials and calls onSuccess', async () => {
    vi.mocked(api.login).mockResolvedValue({ userId: 'u1', activeWorkspaceId: 'w1' });
    const onSuccess = vi.fn();
    renderLogin({ onSuccess });

    await userEvent.type(screen.getByLabelText('이메일'), 'a@x.com');
    await userEvent.type(screen.getByLabelText('비밀번호'), 'p4ssword!');
    await userEvent.click(screen.getByRole('button', { name: '로그인' }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith('w1'));
  });

  it('shows a generic error on invalid credentials (no enumeration)', async () => {
    vi.mocked(api.login).mockRejectedValue(new api.ApiError('INVALID_CREDENTIALS', 401));
    renderLogin({ onSuccess: vi.fn() });

    await userEvent.type(screen.getByLabelText('이메일'), 'a@x.com');
    await userEvent.type(screen.getByLabelText('비밀번호'), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: '로그인' }));

    expect(await screen.findByText('이메일 또는 비밀번호가 올바르지 않습니다.')).toBeInTheDocument();
  });

  it('links to /forgot-password', () => {
    renderLogin({ onSuccess: vi.fn() });
    expect(screen.getByRole('link', { name: '비밀번호를 잊으셨나요?' })).toHaveAttribute('href', '/forgot-password');
  });

  // An installation with an account takes no self-signup: a visitor without one is told where
  // accounts come from instead of being left at a bare form.
  it('names the product and says accounts come by invitation', () => {
    renderLogin({ onSuccess: vi.fn() });
    expect(screen.getByRole('heading', { name: '로그인' })).toBeInTheDocument();
    expect(screen.getByText('U-Board')).toBeInTheDocument();
    expect(screen.getByText(/계정은 초대로 발급됩니다/)).toBeInTheDocument();
  });

  it('lets a caller replace that sentence with its own context', () => {
    renderLogin({ onSuccess: vi.fn(), intro: <p>초대 맥락</p> });
    expect(screen.getByText('초대 맥락')).toBeInTheDocument();
    expect(screen.queryByText(/계정은 초대로 발급됩니다/)).not.toBeInTheDocument();
  });

  it('marks its inputs for password managers', () => {
    renderLogin({ onSuccess: vi.fn() });
    expect(screen.getByLabelText('이메일')).toHaveAttribute('autocomplete', 'username');
    expect(screen.getByLabelText('비밀번호')).toHaveAttribute('autocomplete', 'current-password');
  });
});
