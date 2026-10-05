import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  ApiError,
  listMembers,
  inviteMember,
  removeMember,
  setMemberRole,
  listInvitations,
  revokeInvitation,
  resendInvitation,
  listWorkspaceAudit,
  type PendingInvitation,
} from '../api-client.js';
import { AuditLog } from './AuditLog.js';
import { Alert } from '../design-system/Alert.js';
import { Badge } from '../design-system/Badge.js';
import { Button } from '../design-system/Button.js';
import { FormField } from '../design-system/FormField.js';

type Role = 'owner' | 'member';
type Member = { userId: string; email: string; name: string; role: Role };

const LAST_OWNER_MESSAGE = '워크스페이스에는 owner가 한 명 이상 있어야 합니다 — 먼저 다른 멤버를 owner로 지정하세요.';

function failureMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError && err.code === 'LAST_OWNER' ? LAST_OWNER_MESSAGE : fallback;
}

export function SettingsPage({ workspaceId, userId, onLeft }: { workspaceId: string; userId: string; onLeft: () => void }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('member');
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [invitedByEmail, setInvitedByEmail] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [memberError, setMemberError] = useState<string | null>(null);
  // Bumped after each change made here, so the activity record is read again and shows it.
  const [auditVersion, setAuditVersion] = useState(0);
  const refreshAudit = () => setAuditVersion(v => v + 1);

  const isOwner = members.find(m => m.userId === userId)?.role === 'owner';

  const loadMembers = useCallback(() => listMembers(workspaceId).then(res => setMembers(res.members)), [workspaceId]);
  const loadInvitations = useCallback(
    () => listInvitations(workspaceId).then(res => setInvitations(res.invitations)),
    [workspaceId]
  );

  const loadAudit = useCallback((before?: string) => listWorkspaceAudit(workspaceId, before), [workspaceId]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  // Pending invitations are an owner-only listing, so they load once the caller is known to be one.
  useEffect(() => {
    if (isOwner) loadInvitations();
  }, [isOwner, loadInvitations]);

  async function handleInvite(e: FormEvent) {
    e.preventDefault();
    setInviteError(null);
    try {
      const { token, emailed } = await inviteMember(workspaceId, { email: inviteEmail, role: inviteRole });
      setInviteLink(token ? `${window.location.origin}/invite/${token}` : null);
      setInvitedByEmail(emailed ? inviteEmail : null);
      setInviteEmail('');
      setInviteRole('member');
      refreshAudit();
      await loadInvitations();
    } catch {
      setInviteError('초대에 실패했습니다.');
    }
  }

  async function handleRoleChange(member: Member, role: Role) {
    setMemberError(null);
    try {
      await setMemberRole(workspaceId, member.userId, role);
      refreshAudit();
      await loadMembers();
    } catch (err) {
      setMemberError(failureMessage(err, '역할을 바꾸지 못했습니다.'));
    }
  }

  async function handleRemove(member: Member) {
    if (!window.confirm(`${member.email}을(를) 이 워크스페이스에서 제거할까요?`)) return;
    setMemberError(null);
    try {
      await removeMember(workspaceId, member.userId);
      refreshAudit();
      await loadMembers();
    } catch (err) {
      setMemberError(failureMessage(err, '멤버를 제거하지 못했습니다.'));
    }
  }

  async function handleLeave() {
    if (!window.confirm('이 워크스페이스에서 나갈까요? 다시 들어오려면 새 초대가 필요합니다.')) return;
    setMemberError(null);
    try {
      await removeMember(workspaceId, userId);
      onLeft();
    } catch (err) {
      setMemberError(failureMessage(err, '워크스페이스에서 나가지 못했습니다.'));
    }
  }

  async function handleResend(invitation: PendingInvitation) {
    setInviteError(null);
    try {
      const { token, emailed } = await resendInvitation(workspaceId, invitation.id);
      setInviteLink(token ? `${window.location.origin}/invite/${token}` : null);
      setInvitedByEmail(emailed ? invitation.email : null);
      refreshAudit();
      await loadInvitations();
    } catch {
      setInviteError('초대를 다시 보내지 못했습니다.');
    }
  }

  async function handleRevoke(invitation: PendingInvitation) {
    if (!window.confirm(`${invitation.email}에게 보낸 초대를 취소할까요?`)) return;
    setInviteError(null);
    try {
      await revokeInvitation(workspaceId, invitation.id);
      refreshAudit();
      await loadInvitations();
    } catch {
      setInviteError('초대를 취소하지 못했습니다.');
    }
  }

  return (
    <div>
      <h2>멤버</h2>
      {memberError && <Alert>{memberError}</Alert>}
      <ul>
        {members.map(m => (
          <li key={m.userId}>
            <span>{m.email}</span>{' '}
            {isOwner ? (
              <select
                aria-label={`${m.email} 역할`}
                value={m.role}
                onChange={e => handleRoleChange(m, e.target.value as Role)}
              >
                <option value="owner">owner</option>
                <option value="member">member</option>
              </select>
            ) : (
              <Badge>{m.role}</Badge>
            )}{' '}
            {m.userId === userId ? (
              <Button variant="ghost" onClick={handleLeave}>
                나가기
              </Button>
            ) : (
              isOwner && (
                <Button variant="danger" aria-label={`${m.email} 제거`} onClick={() => handleRemove(m)}>
                  제거
                </Button>
              )
            )}
          </li>
        ))}
      </ul>

      {isOwner && (
        <>
          <form onSubmit={handleInvite}>
            <FormField label="초대할 이메일">
              <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required />
            </FormField>
            <FormField label="초대 역할">
              <select value={inviteRole} onChange={e => setInviteRole(e.target.value as Role)}>
                <option value="member">member</option>
                <option value="owner">owner</option>
              </select>
            </FormField>
            <Button type="submit">초대</Button>
          </form>
          {invitations.length > 0 && (
            <>
              <h3>대기 중인 초대</h3>
              <ul>
                {invitations.map(inv => (
                  <li key={inv.id}>
                    <span>{inv.email}</span> <Badge>{inv.role}</Badge> — 만료 {new Date(inv.expiresAt).toLocaleDateString()}{' '}
                    <Button variant="ghost" aria-label={`${inv.email} 초대 다시 보내기`} onClick={() => handleResend(inv)}>
                      다시 보내기
                    </Button>{' '}
                    <Button variant="ghost" aria-label={`${inv.email} 초대 취소`} onClick={() => handleRevoke(inv)}>
                      취소
                    </Button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
      {inviteError && <Alert>{inviteError}</Alert>}
      {invitedByEmail && (
        <p role="status">
          {invitedByEmail}에게 초대 메일을 보냈습니다. 메일이 오지 않으면 스팸함을 확인하도록 안내하거나, 대기 중인 초대에서 다시 보내세요.
        </p>
      )}
      {inviteLink && (
        <FormField label="초대 링크(복사해 전달)">
          <input type="text" readOnly value={inviteLink} onFocus={e => e.target.select()} />
        </FormField>
      )}

      {isOwner && (
        <>
          <h2>활동 기록</h2>
          <AuditLog key={auditVersion} load={loadAudit} />
        </>
      )}
    </div>
  );
}
