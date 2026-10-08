import { useState, type FormEvent, type ReactNode } from 'react';
import { signup, ApiError } from '../api-client.js';
import { AuthLayout } from '../design-system/AuthLayout.js';
import { Alert, Button, FormField } from '../design-system/index.js';

const ERROR_MESSAGES: Record<string, string> = {
  EMAIL_TAKEN: '이미 가입된 이메일입니다.',
  SIGNUP_REQUIRES_INVITATION: '가입은 초대를 통해서만 가능합니다.',
  INVITATION_INVALID: '초대가 만료되었거나 이미 사용되었습니다.',
  PASSWORD_TOO_SHORT: '비밀번호는 8자 이상이어야 합니다.',
  PASSWORD_TOO_LONG: '비밀번호가 너무 깁니다. 72바이트(영문 72자, 한글 24자) 이하로 정해 주세요.',
  INVALID_NAME: '이름을 입력해 주세요(100자 이하).',
};

export function SignupPage({
  invitationToken,
  prefillEmail,
  intro,
  onSuccess,
}: {
  invitationToken?: string;
  prefillEmail?: string;
  intro?: ReactNode;
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
    <AuthLayout title="가입" intro={intro}>
      <form onSubmit={handleSubmit}>
        <FormField label="이메일">
          <input
            type="email"
            autoComplete="username"
            value={email}
            disabled={Boolean(prefillEmail)}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </FormField>
        <FormField label="비밀번호">
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </FormField>
        <FormField label="이름">
          <input type="text" autoComplete="name" value={name} onChange={e => setName(e.target.value)} required />
        </FormField>
        {error && <Alert>{error}</Alert>}
        <Button type="submit" disabled={submitting}>
          가입
        </Button>
      </form>
    </AuthLayout>
  );
}
