import { useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router';
import { login } from '../api-client.js';
import { AuthLayout } from '../design-system/AuthLayout.js';
import { Alert, Button, FormField } from '../design-system/index.js';

/** Where accounts come from on an installation that already has one: nobody signs up on their own
 *  (`SIGNUP_REQUIRES_INVITATION`), so a visitor without an account needs to know that, not just see a form. */
const DEFAULT_INTRO = <p>계정은 초대로 발급됩니다. 받은 초대 메일의 링크에서 가입하세요.</p>;

/**
 * `onSuccess` is fire-and-forget: it is called after the credentials are accepted and is not
 * awaited, so an implementation that does async follow-up work (e.g. `InvitePage` accepting
 * the invitation) must handle its own failures. Reporting them here is not possible — this
 * page only knows how to say that the credentials were wrong.
 */
export function LoginPage({
  prefillEmail,
  intro = DEFAULT_INTRO,
  onSuccess,
}: {
  prefillEmail?: string;
  intro?: ReactNode;
  onSuccess: (activeWorkspaceId: string) => void;
}) {
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
    <AuthLayout title="로그인" intro={intro} footer={<Link to="/forgot-password">비밀번호를 잊으셨나요?</Link>}>
      <form onSubmit={handleSubmit}>
        <FormField label="이메일">
          <input type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} required />
        </FormField>
        <FormField label="비밀번호">
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </FormField>
        {error && <Alert>{error}</Alert>}
        <Button type="submit" disabled={submitting}>
          로그인
        </Button>
      </form>
    </AuthLayout>
  );
}
