import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { resetPassword, ApiError } from '../api-client.js';

const ERROR_MESSAGES: Record<string, string> = {
  RESET_TOKEN_INVALID: '재설정 코드가 유효하지 않거나 만료되었습니다. 다시 요청해 주세요.',
};

export function ResetPasswordPage() {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await resetPassword({ token, newPassword });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? ERROR_MESSAGES[err.code] ?? '비밀번호 재설정에 실패했습니다.' : '비밀번호 재설정에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div>
        <h1>비밀번호 재설정</h1>
        <p>비밀번호가 재설정되었습니다.</p>
        <Link to="/">로그인하기</Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>비밀번호 재설정</h1>
      <label>
        재설정 코드
        <input type="text" value={token} onChange={e => setToken(e.target.value)} required />
      </label>
      <label>
        새 비밀번호
        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={8} />
      </label>
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={submitting}>비밀번호 재설정</button>
    </form>
  );
}
