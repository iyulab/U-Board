import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { requestPasswordReset } from '../api-client.js';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await requestPasswordReset(email);
      setSubmitted(true);
    } catch {
      setError('요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div>
        <h1>비밀번호 재설정 요청</h1>
        {/* The server always returns 202 whether or not the account exists (no enumeration) —
            this message is shown unconditionally on success, never "메일이 없습니다" or similar. */}
        <p>계정이 존재하면 재설정 코드를 이메일로 보냈습니다. 코드를 받으셨다면 아래에서 비밀번호를 재설정하세요.</p>
        <Link to="/reset-password">비밀번호 재설정하기</Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>비밀번호 재설정 요청</h1>
      <label>
        이메일
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
      </label>
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={submitting}>재설정 코드 받기</button>
      <p>
        <Link to="/">로그인으로 돌아가기</Link>
      </p>
    </form>
  );
}
