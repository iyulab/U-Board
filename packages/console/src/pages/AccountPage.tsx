import { useEffect, useState, type FormEvent } from 'react';
import { ApiError, changePassword, deleteAccount, getAccount, renameAccount } from '../api-client.js';
import { Alert } from '../design-system/Alert.js';
import { Button } from '../design-system/Button.js';
import { FormField } from '../design-system/FormField.js';

const PASSWORD_ERRORS: Record<string, string> = {
  INVALID_CREDENTIALS: '현재 비밀번호가 맞지 않습니다.',
  PASSWORD_TOO_SHORT: '새 비밀번호는 8자 이상이어야 합니다.',
  PASSWORD_TOO_LONG: '새 비밀번호가 너무 깁니다. 72바이트(영문 72자, 한글 24자) 이하로 정해 주세요.',
};

function deletionMessage(err: unknown): string {
  if (!(err instanceof ApiError)) return '탈퇴하지 못했습니다.';
  if (err.code === 'INVALID_CREDENTIALS') return '비밀번호가 맞지 않습니다.';
  if (err.code === 'LAST_OPERATOR') return '마지막 운영자는 탈퇴할 수 없습니다 — 먼저 다른 계정을 운영자로 지정하세요.';
  if (err.code === 'LAST_OWNER') {
    const names = Array.isArray(err.body.workspaces) ? err.body.workspaces.join(', ') : '';
    return `다음 워크스페이스의 유일한 owner입니다: ${names}. 먼저 다른 멤버를 owner로 지정하세요.`;
  }
  return '탈퇴하지 못했습니다.';
}

/** The signed-in account: its name, its password, and deleting it. Independent of any workspace. */
export function AccountPage({ onDeleted }: { onDeleted: () => void }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [nameStatus, setNameStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    getAccount()
      .then(account => {
        setEmail(account.email);
        setName(account.name);
      })
      .catch(() => setNameStatus({ ok: false, text: '계정 정보를 불러오지 못했습니다.' }));
  }, []);

  async function handleRename(e: FormEvent) {
    e.preventDefault();
    setNameStatus(null);
    try {
      const res = await renameAccount(name);
      setName(res.name);
      setNameStatus({ ok: true, text: '이름을 바꿨습니다.' });
    } catch (err) {
      setNameStatus({
        ok: false,
        text: err instanceof ApiError && err.code === 'INVALID_NAME' ? '이름을 입력해 주세요(100자 이하).' : '이름을 바꾸지 못했습니다.',
      });
    }
  }

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    setPasswordStatus(null);
    try {
      await changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setPasswordStatus({ ok: true, text: '비밀번호를 바꿨습니다. 다른 기기와 브라우저의 로그인은 모두 종료됐습니다.' });
    } catch (err) {
      setPasswordStatus({
        ok: false,
        text: (err instanceof ApiError && PASSWORD_ERRORS[err.code]) || '비밀번호를 바꾸지 못했습니다.',
      });
    }
  }

  async function handleDelete(e: FormEvent) {
    e.preventDefault();
    if (!window.confirm('계정을 삭제하면 이름·이메일·비밀번호와 모든 워크스페이스 멤버십이 지워지고 되돌릴 수 없습니다. 탈퇴할까요?')) return;
    setDeleteError(null);
    try {
      await deleteAccount(deletePassword);
      onDeleted();
    } catch (err) {
      setDeleteError(deletionMessage(err));
    }
  }

  return (
    <div>
      <h2>내 계정</h2>
      <p>{email}</p>
      <form onSubmit={handleRename}>
        <FormField label="이름">
          <input type="text" value={name} onChange={e => setName(e.target.value)} required maxLength={100} />
        </FormField>
        <Button type="submit">이름 저장</Button>
        {nameStatus && (nameStatus.ok ? <p role="status">{nameStatus.text}</p> : <Alert>{nameStatus.text}</Alert>)}
      </form>

      <h2>비밀번호 변경</h2>
      <form onSubmit={handleChangePassword}>
        <FormField label="현재 비밀번호">
          <input type="password" autoComplete="current-password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
        </FormField>
        <FormField label="새 비밀번호">
          <input type="password" autoComplete="new-password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={8} />
        </FormField>
        <Button type="submit">비밀번호 변경</Button>
        {passwordStatus &&
          (passwordStatus.ok ? <p role="status">{passwordStatus.text}</p> : <Alert>{passwordStatus.text}</Alert>)}
      </form>

      <h2>탈퇴</h2>
      <p>계정과 개인정보(이름·이메일·비밀번호)를 지웁니다. 만든 보드·공유 링크·보낸 초대는 워크스페이스에 남습니다.</p>
      <form onSubmit={handleDelete}>
        <FormField label="비밀번호 확인">
          <input type="password" autoComplete="current-password" value={deletePassword} onChange={e => setDeletePassword(e.target.value)} required />
        </FormField>
        <Button type="submit" variant="danger">
          탈퇴
        </Button>
        {deleteError && <Alert>{deleteError}</Alert>}
      </form>
    </div>
  );
}
