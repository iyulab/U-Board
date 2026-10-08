import { useEffect, useState } from 'react';
import { getInvitation, acceptInvitation, switchWorkspace, ApiError, type InvitationDetails } from '../api-client.js';
import { SignupPage } from './SignupPage.js';
import { LoginPage } from './LoginPage.js';
import { Link } from 'react-router';
import { Loading } from '../design-system/Loading.js';
import { Alert } from '../design-system/Alert.js';
import { AuthLayout } from '../design-system/AuthLayout.js';
import { Timestamp } from '../format-time.js';

// Why accepting failed, in terms of what the person can do about it.
const ACCEPT_ERROR_MESSAGES: Record<string, string> = {
  INVITATION_EXPIRED: '초대가 만료되었거나 취소되었습니다. 초대한 사람에게 다시 요청하세요.',
  INVITATION_INVALID: '이 초대는 다른 이메일 주소로 보낸 것입니다. 초대받은 주소로 로그인하세요.',
};

export function InvitePage({ token, onJoined }: { token: string; onJoined: (workspaceId: string) => void }) {
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
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
      let workspaceId: string;
      try {
        ({ workspaceId } = await acceptInvitation(token));
      } catch (err) {
        // Already a member: the invitation has nothing left to do — take them to the workspace.
        if (!(err instanceof ApiError && err.code === 'ALREADY_MEMBER') || !invitation) throw err;
        workspaceId = invitation.workspaceId;
      }
      // `login` minted the session cookie from the workspaces the user already belonged to,
      // before this membership existed — without switching, they would land on their old
      // default workspace with no sign the invitation was accepted.
      await switchWorkspace(workspaceId);
      onJoined(workspaceId);
    } catch (err) {
      setError(
        (err instanceof ApiError && ACCEPT_ERROR_MESSAGES[err.code]) || '초대 수락에 실패했습니다. 다시 시도해 주세요.'
      );
    }
  }

  function handleSignupSuccess(workspaceId: string) {
    onJoined(workspaceId);
  }

  if (error) {
    return (
      <AuthLayout title="초대" footer={<Link to="/">로그인으로</Link>}>
        <Alert>{error}</Alert>
      </AuthLayout>
    );
  }
  if (!invitation) return <Loading page />;

  const context = (
    <p>
      {invitation.inviterName}님이 {invitation.workspaceName} 워크스페이스에 {invitation.role}로 초대했습니다.{' '}
      <Timestamp value={invitation.expiresAt} dateOnly />까지 유효합니다.
    </p>
  );
  return invitation.hasAccount ? (
    <LoginPage prefillEmail={invitation.email} intro={context} onSuccess={handleLoginSuccess} />
  ) : (
    <SignupPage invitationToken={token} prefillEmail={invitation.email} intro={context} onSuccess={handleSignupSuccess} />
  );
}
