import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { resetPassword, ApiError } from '../api-client.js';
import { AuthLayout } from '../design-system/AuthLayout.js';
import { Alert, Button, FormField } from '../design-system/index.js';

const ERROR_MESSAGES: Record<string, string> = {
  RESET_TOKEN_INVALID: '재설정 코드가 유효하지 않거나 만료되었습니다. 다시 요청해 주세요.',
  PASSWORD_TOO_SHORT: '비밀번호는 8자 이상이어야 합니다.',
  PASSWORD_TOO_LONG: '비밀번호가 너무 깁니다. 72바이트(영문 72자, 한글 24자) 이하로 정해 주세요.',
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
      <AuthLayout title="비밀번호 재설정" intro={<p>비밀번호가 재설정되었습니다.</p>}>
        <Link to="/">로그인하기</Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="비밀번호 재설정"
      intro={<p>메일로 받은 재설정 코드와 새 비밀번호를 입력하세요.</p>}
      footer={<Link to="/forgot-password">코드 다시 받기</Link>}
    >
      <form onSubmit={handleSubmit}>
        <FormField label="재설정 코드">
          <input type="text" autoComplete="one-time-code" value={token} onChange={e => setToken(e.target.value)} required />
        </FormField>
        <FormField label="새 비밀번호">
          <input
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            required
            minLength={8}
          />
        </FormField>
        {error && <Alert>{error}</Alert>}
        <Button type="submit" disabled={submitting}>
          비밀번호 재설정
        </Button>
      </form>
    </AuthLayout>
  );
}
