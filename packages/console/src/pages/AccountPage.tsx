import { useEffect, useState, type FormEvent } from 'react';
import { ApiError, changePassword, getAccount, renameAccount } from '../api-client.js';
import { Alert } from '../design-system/Alert.js';
import { Button } from '../design-system/Button.js';
import { FormField } from '../design-system/FormField.js';

const PASSWORD_ERRORS: Record<string, string> = {
  INVALID_CREDENTIALS: '현재 비밀번호가 맞지 않습니다.',
  PASSWORD_TOO_SHORT: '새 비밀번호는 8자 이상이어야 합니다.',
  PASSWORD_TOO_LONG: '새 비밀번호가 너무 깁니다. 72바이트(영문 72자, 한글 24자) 이하로 정해 주세요.',
};

/** The signed-in account: its name, and its password. Independent of any workspace. */
export function AccountPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [nameStatus, setNameStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<{ ok: boolean; text: string } | null>(null);

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
    </div>
  );
}
