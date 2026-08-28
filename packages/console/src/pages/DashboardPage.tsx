import { useEffect, useState, type FormEvent } from 'react';
import { getSession, listMembers, inviteMember, switchWorkspace, logout } from '../api-client.js';
import { AppShell } from '../design-system/AppShell.js';
import { WorkspaceSwitcher } from '../design-system/WorkspaceSwitcher.js';
import { Alert } from '../design-system/Alert.js';
import { Badge } from '../design-system/Badge.js';
import { Button } from '../design-system/Button.js';
import { FormField } from '../design-system/FormField.js';

type Member = { userId: string; email: string; name: string; role: 'owner' | 'member' };
type Workspace = { id: string; name: string };

export function DashboardPage({ onLoggedOut }: { onLoggedOut: () => void }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const isOwner = members.find(m => m.userId === userId)?.role === 'owner';

  function reload() {
    setSessionError(null);
    return getSession()
      .then(session => {
        if (!session) return;
        setWorkspaces(session.workspaces);
        setActiveWorkspaceId(session.activeWorkspaceId);
        setUserId(session.userId);
      })
      .catch(() => setSessionError('대시보드를 불러오지 못했습니다'))
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    reload();
  }, []);

  useEffect(() => {
    if (activeWorkspaceId) listMembers(activeWorkspaceId).then(res => setMembers(res.members));
  }, [activeWorkspaceId]);

  async function handleInvite(e: FormEvent) {
    e.preventDefault();
    if (!activeWorkspaceId) return;
    setInviteError(null);
    try {
      const { token } = await inviteMember(activeWorkspaceId, { email: inviteEmail, role: 'member' });
      setInviteLink(`${window.location.origin}/invite/${token}`);
      setInviteEmail('');
    } catch {
      setInviteError('초대에 실패했습니다.');
    }
  }

  async function handleSwitch(workspaceId: string) {
    await switchWorkspace(workspaceId);
    setActiveWorkspaceId(workspaceId);
  }

  async function handleLogout() {
    await logout();
    onLoggedOut();
  }

  if (isLoading) return <p>불러오는 중...</p>;
  if (sessionError) return <Alert onRetry={reload}>{sessionError}</Alert>;

  return (
    <AppShell
      onLogout={handleLogout}
      workspaceSwitcher={
        <WorkspaceSwitcher
          workspaces={workspaces}
          activeWorkspaceId={activeWorkspaceId}
          onSwitch={handleSwitch}
        />
      }
    >
      <h2>멤버</h2>
      <ul>
        {members.map(m => (
          <li key={m.userId}>
            {m.email} <Badge>{m.role}</Badge>
          </li>
        ))}
      </ul>

      {isOwner && (
        <form onSubmit={handleInvite}>
          <FormField label="초대할 이메일">
            <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required />
          </FormField>
          <Button type="submit">초대</Button>
        </form>
      )}
      {inviteError && <Alert>{inviteError}</Alert>}
      {inviteLink && (
        <FormField label="초대 링크(복사해 전달)">
          <input type="text" readOnly value={inviteLink} onFocus={e => e.target.select()} />
        </FormField>
      )}
    </AppShell>
  );
}
