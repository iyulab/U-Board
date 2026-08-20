import { useState, type FormEvent } from 'react';
import { signup, ApiError } from '../api-client.js';

const ERROR_MESSAGES: Record<string, string> = {
  EMAIL_TAKEN: '이미 가입된 이메일입니다.',
  SIGNUP_REQUIRES_INVITATION: '가입은 초대를 통해서만 가능합니다.',
  INVITATION_INVALID: '초대가 만료되었거나 이미 사용되었습니다.',
};

export function SignupPage({
  invitationToken,
  prefillEmail,
  onSuccess,
}: {
  invitationToken?: string;
  prefillEmail?: string;
  onSuccess: (workspaceId: string) => void;
}) {
  const [email, setEmail] = useState(prefillEmail ?? '');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await signup({ email, password, name, invitationToken });
      onSuccess(result.workspaceId);
    } catch (err) {
      setError(err instanceof ApiError ? ERROR_MESSAGES[err.code] ?? '가입에 실패했습니다.' : '가입에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>가입</h1>
      <label>
        이메일
        <input type="email" value={email} disabled={Boolean(prefillEmail)} onChange={e => setEmail(e.target.value)} required />
      </label>
      <label>
        비밀번호
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
      </label>
      <label>
        이름
        <input type="text" value={name} onChange={e => setName(e.target.value)} required />
      </label>
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={submitting}>가입</button>
    </form>
  );
}
