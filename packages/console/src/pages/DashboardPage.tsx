import { useEffect, useState, type FormEvent } from 'react';
import { getSession, listMembers, inviteMember, switchWorkspace, logout } from '../api-client.js';

type Member = { userId: string; email: string; name: string; role: 'owner' | 'member' };
type Workspace = { id: string; name: string };

export function DashboardPage({ onLoggedOut }: { onLoggedOut: () => void }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  useEffect(() => {
    getSession().then(session => {
      if (!session) return;
      setWorkspaces(session.workspaces);
      setActiveWorkspaceId(session.activeWorkspaceId);
    });
  }, []);

  useEffect(() => {
    if (activeWorkspaceId) listMembers(activeWorkspaceId).then(res => setMembers(res.members));
  }, [activeWorkspaceId]);

  async function handleInvite(e: FormEvent) {
    e.preventDefault();
    if (!activeWorkspaceId) return;
    const { token } = await inviteMember(activeWorkspaceId, { email: inviteEmail, role: 'member' });
    setInviteLink(`${window.location.origin}/invite/${token}`);
    setInviteEmail('');
  }

  async function handleSwitch(workspaceId: string) {
    await switchWorkspace(workspaceId);
    setActiveWorkspaceId(workspaceId);
  }

  async function handleLogout() {
    await logout();
    onLoggedOut();
  }

  return (
    <div>
      <header>
        <select value={activeWorkspaceId ?? ''} onChange={e => handleSwitch(e.target.value)}>
          {workspaces.map(w => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
        <button onClick={handleLogout}>로그아웃</button>
      </header>

      <h2>멤버</h2>
      <ul>
        {members.map(m => (
          <li key={m.userId}>
            <span>{m.email}</span> — <span>{m.role}</span>
          </li>
        ))}
      </ul>

      <form onSubmit={handleInvite}>
        <label>
          초대할 이메일
          <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required />
        </label>
        <button type="submit">초대</button>
      </form>
      {inviteLink && (
        <label>
          초대 링크(복사해 전달)
          <input type="text" readOnly value={inviteLink} onFocus={e => e.target.select()} />
        </label>
      )}
    </div>
  );
}
