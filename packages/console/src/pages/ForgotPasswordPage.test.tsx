import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ForgotPasswordPage } from './ForgotPasswordPage.js';
import * as api from '../api-client.js';

vi.mock('../api-client.js');
beforeEach(() => vi.resetAllMocks());

function renderPage() {
  return render(
    <MemoryRouter>
      <ForgotPasswordPage />
    </MemoryRouter>
  );
}

describe('ForgotPasswordPage', () => {
  it('requests a reset and shows the enumeration-safe confirmation', async () => {
    vi.mocked(api.requestPasswordReset).mockResolvedValue({ code: 'RESET_REQUESTED' });
    renderPage();

    await userEvent.type(screen.getByLabelText('이메일'), 'a@x.com');
    await userEvent.click(screen.getByRole('button', { name: '재설정 코드 받기' }));

    expect(await screen.findByText(/계정이 존재하면 재설정 코드를 이메일로 보냈습니다/)).toBeInTheDocument();
    expect(api.requestPasswordReset).toHaveBeenCalledWith('a@x.com');
    expect(screen.getByRole('link', { name: '비밀번호 재설정하기' })).toHaveAttribute('href', '/reset-password');
  });

  it('shows a generic error when the request itself fails', async () => {
    vi.mocked(api.requestPasswordReset).mockRejectedValue(new api.ApiError('RATE_LIMITED', 429));
    renderPage();

    await userEvent.type(screen.getByLabelText('이메일'), 'a@x.com');
    await userEvent.click(screen.getByRole('button', { name: '재설정 코드 받기' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.');
  });
});
