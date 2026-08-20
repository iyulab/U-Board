import { useState, type FormEvent } from 'react';
import { login, ApiError } from '../api-client.js';

export function LoginPage({ prefillEmail, onSuccess }: { prefillEmail?: string; onSuccess: (activeWorkspaceId: string) => void }) {
  const [email, setEmail] = useState(prefillEmail ?? '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await login({ email, password });
      onSuccess(result.activeWorkspaceId);
    } catch {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>로그인</h1>
      <label>
        이메일
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
      </label>
      <label>
        비밀번호
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
      </label>
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={submitting}>로그인</button>
    </form>
  );
}
