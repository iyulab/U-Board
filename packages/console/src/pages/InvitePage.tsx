import { useEffect, useState } from 'react';
import { getInvitation, acceptInvitation } from '../api-client.js';
import { SignupPage } from './SignupPage.js';
import { LoginPage } from './LoginPage.js';

export function InvitePage({ token, onJoined }: { token: string; onJoined: (workspaceId: string) => void }) {
  const [invitation, setInvitation] = useState<{ email: string; workspaceId: string; hasAccount: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getInvitation(token)
      .then(setInvitation)
      .catch(() => setError('초대가 만료되었거나 이미 사용되었습니다.'));
  }, [token]);

  async function handleLoginSuccess() {
    const result = await acceptInvitation(token);
    onJoined(result.workspaceId);
  }

  function handleSignupSuccess(workspaceId: string) {
    onJoined(workspaceId);
  }

  if (error) return <p role="alert">{error}</p>;
  if (!invitation) return <p>불러오는 중...</p>;

  return invitation.hasAccount ? (
    <LoginPage prefillEmail={invitation.email} onSuccess={handleLoginSuccess} />
  ) : (
    <SignupPage invitationToken={token} prefillEmail={invitation.email} onSuccess={handleSignupSuccess} />
  );
}
