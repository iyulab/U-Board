import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ResetPasswordPage } from './ResetPasswordPage.js';
import * as api from '../api-client.js';

vi.mock('../api-client.js');
beforeEach(() => vi.resetAllMocks());

function renderPage() {
  return render(
    <MemoryRouter>
      <ResetPasswordPage />
    </MemoryRouter>
  );
}

describe('ResetPasswordPage', () => {
  it('submits the code and new password, then shows a success state', async () => {
    vi.mocked(api.resetPassword).mockResolvedValue({ code: 'PASSWORD_RESET' });
    renderPage();

    await userEvent.type(screen.getByLabelText('재설정 코드'), 'tok123');
    await userEvent.type(screen.getByLabelText('새 비밀번호'), 'n3wpassword');
    await userEvent.click(screen.getByRole('button', { name: '비밀번호 재설정' }));

    expect(await screen.findByText('비밀번호가 재설정되었습니다.')).toBeInTheDocument();
    expect(api.resetPassword).toHaveBeenCalledWith({ token: 'tok123', newPassword: 'n3wpassword' });
    expect(screen.getByRole('link', { name: '로그인하기' })).toHaveAttribute('href', '/');
  });

  it('shows a specific message for an invalid/expired code', async () => {
    vi.mocked(api.resetPassword).mockRejectedValue(new api.ApiError('RESET_TOKEN_INVALID', 410));
    renderPage();

    await userEvent.type(screen.getByLabelText('재설정 코드'), 'bad-token');
    await userEvent.type(screen.getByLabelText('새 비밀번호'), 'n3wpassword');
    await userEvent.click(screen.getByRole('button', { name: '비밀번호 재설정' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('재설정 코드가 유효하지 않거나 만료되었습니다. 다시 요청해 주세요.');
  });
});
