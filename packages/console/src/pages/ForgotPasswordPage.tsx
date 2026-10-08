import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { requestPasswordReset } from '../api-client.js';
import { AuthLayout } from '../design-system/AuthLayout.js';
import { Alert, Button, FormField } from '../design-system/index.js';

const BACK_TO_LOGIN = <Link to="/">로그인으로 돌아가기</Link>;

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
    // The server always returns 202 whether or not the account exists (no enumeration) — this
    // message is shown unconditionally on success, never "메일이 없습니다" or similar.
    return (
      <AuthLayout
        title="비밀번호 재설정 요청"
        intro={<p>계정이 존재하면 재설정 코드를 이메일로 보냈습니다. 코드를 받으셨다면 아래에서 비밀번호를 재설정하세요.</p>}
        footer={BACK_TO_LOGIN}
      >
        <Link to="/reset-password">비밀번호 재설정하기</Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="비밀번호 재설정 요청"
      intro={<p>가입한 이메일로 재설정 코드를 보내 드립니다.</p>}
      footer={BACK_TO_LOGIN}
    >
      <form onSubmit={handleSubmit}>
        <FormField label="이메일">
          <input type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} required />
        </FormField>
        {error && <Alert>{error}</Alert>}
        <Button type="submit" disabled={submitting}>
          재설정 코드 받기
        </Button>
      </form>
    </AuthLayout>
  );
}
