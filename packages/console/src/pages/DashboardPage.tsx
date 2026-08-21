import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { getSession, listMembers, inviteMember, switchWorkspace, logout } from '../api-client.js';

type Member = { userId: string; email: string; name: string; role: 'owner' | 'member' };
type Workspace = { id: string; name: string };

export function DashboardPage({ onLoggedOut }: { onLoggedOut: () => void }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // The member list already carries each member's role, so the current user's own role in the
  // active workspace is derivable without a second request. Inviting is owner-only server-side
  // (403 otherwise) — this keeps the UI from offering an action that cannot succeed.
  const isOwner = members.find(m => m.userId === userId)?.role === 'owner';

  useEffect(() => {
    getSession().then(session => {
      if (!session) return;
      setWorkspaces(session.workspaces);
      setActiveWorkspaceId(session.activeWorkspaceId);
      setUserId(session.userId);
    });
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

  return (
    <div>
      <header>
        <select value={activeWorkspaceId ?? ''} onChange={e => handleSwitch(e.target.value)}>
          {workspaces.map(w => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
        <Link to="/boards">보드</Link>
        <Link to="/connectors">커넥터</Link>
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

      {isOwner && (
        <form onSubmit={handleInvite}>
          <label>
            초대할 이메일
            <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required />
          </label>
          <button type="submit">초대</button>
        </form>
      )}
      {inviteError && <p role="alert">{inviteError}</p>}
      {inviteLink && (
        <label>
          초대 링크(복사해 전달)
          <input type="text" readOnly value={inviteLink} onFocus={e => e.target.select()} />
        </label>
      )}
    </div>
  );
}
