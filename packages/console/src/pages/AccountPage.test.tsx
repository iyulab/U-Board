import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccountPage } from './AccountPage.js';
import * as api from '../api-client.js';

vi.mock('../api-client.js');
afterEach(() => vi.restoreAllMocks());
beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  vi.mocked(api.getAccount).mockResolvedValue({ id: 'u1', email: 'me@x.com', name: 'Me' });
});

describe('AccountPage', () => {
  it('shows the account and renames it', async () => {
    vi.mocked(api.renameAccount).mockResolvedValue({ name: 'New Name' });
    render(<AccountPage onDeleted={vi.fn()} />);

    expect(await screen.findByText('me@x.com')).toBeInTheDocument();
    const nameInput = screen.getByLabelText('이름');
    expect(nameInput).toHaveValue('Me');
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, ' New Name ');
    await userEvent.click(screen.getByRole('button', { name: '이름 저장' }));

    expect(api.renameAccount).toHaveBeenCalledWith(' New Name ');
    expect(await screen.findByText('이름을 바꿨습니다.')).toBeInTheDocument();
    expect(nameInput).toHaveValue('New Name');
  });

  it('changes the password and says other sign-ins were ended', async () => {
    vi.mocked(api.changePassword).mockResolvedValue(undefined);
    render(<AccountPage onDeleted={vi.fn()} />);

    await userEvent.type(await screen.findByLabelText('현재 비밀번호'), 'old-p4ssword');
    await userEvent.type(screen.getByLabelText('새 비밀번호'), 'new-p4ssword');
    await userEvent.click(screen.getByRole('button', { name: '비밀번호 변경' }));

    expect(api.changePassword).toHaveBeenCalledWith({ currentPassword: 'old-p4ssword', newPassword: 'new-p4ssword' });
    expect(await screen.findByText(/다른 기기와 브라우저의 로그인은 모두 종료됐습니다/)).toBeInTheDocument();
    expect(screen.getByLabelText('현재 비밀번호')).toHaveValue('');
  });

  it('says when the current password is wrong', async () => {
    vi.mocked(api.changePassword).mockRejectedValue(new api.ApiError('INVALID_CREDENTIALS', 401));
    render(<AccountPage onDeleted={vi.fn()} />);

    await userEvent.type(await screen.findByLabelText('현재 비밀번호'), 'wrong-guess');
    await userEvent.type(screen.getByLabelText('새 비밀번호'), 'new-p4ssword');
    await userEvent.click(screen.getByRole('button', { name: '비밀번호 변경' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('현재 비밀번호가 맞지 않습니다.');
  });

  it('deletes the account after confirmation and hands over to the caller', async () => {
    vi.mocked(api.deleteAccount).mockResolvedValue(undefined);
    const onDeleted = vi.fn();
    render(<AccountPage onDeleted={onDeleted} />);

    await userEvent.type(await screen.findByLabelText('비밀번호 확인'), 'my-p4ssword');
    await userEvent.click(screen.getByRole('button', { name: '탈퇴' }));

    expect(api.deleteAccount).toHaveBeenCalledWith('my-p4ssword');
    expect(onDeleted).toHaveBeenCalled();
  });

  it('names the workspaces to hand over before deleting', async () => {
    vi.mocked(api.deleteAccount).mockRejectedValue(new api.ApiError('LAST_OWNER', 409, { code: 'LAST_OWNER', workspaces: ['Customer A', 'Plant B'] }));
    const onDeleted = vi.fn();
    render(<AccountPage onDeleted={onDeleted} />);

    await userEvent.type(await screen.findByLabelText('비밀번호 확인'), 'my-p4ssword');
    await userEvent.click(screen.getByRole('button', { name: '탈퇴' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('다음 워크스페이스의 유일한 owner입니다: Customer A, Plant B.');
    expect(onDeleted).not.toHaveBeenCalled();
  });
});
