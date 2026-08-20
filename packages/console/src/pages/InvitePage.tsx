import { useEffect, useState } from 'react';
import { getInvitation, acceptInvitation, switchWorkspace } from '../api-client.js';
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
    // Every failure is contained here: `LoginPage` calls this without awaiting (its prop type
    // is `() => void`), so a rejection escaping this function would be unhandled and the user
    // would see nothing happen at all.
    try {
      const { workspaceId } = await acceptInvitation(token);
      // `login` minted the session cookie from the workspaces the user already belonged to,
      // before this membership existed — without switching, they would land on their old
      // default workspace with no sign the invitation was accepted.
      await switchWorkspace(workspaceId);
      onJoined(workspaceId);
    } catch {
      setError('초대 수락에 실패했습니다. 다시 시도해 주세요.');
    }
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
