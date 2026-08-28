import { useEffect, useState, type FormEvent } from 'react';
import { listMembers, inviteMember } from '../api-client.js';
import { Alert } from '../design-system/Alert.js';
import { Badge } from '../design-system/Badge.js';
import { Button } from '../design-system/Button.js';
import { FormField } from '../design-system/FormField.js';

type Member = { userId: string; email: string; name: string; role: 'owner' | 'member' };

export function SettingsPage({ workspaceId, userId }: { workspaceId: string; userId: string }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const isOwner = members.find(m => m.userId === userId)?.role === 'owner';

  useEffect(() => {
    listMembers(workspaceId).then(res => setMembers(res.members));
  }, [workspaceId]);

  async function handleInvite(e: FormEvent) {
    e.preventDefault();
    setInviteError(null);
    try {
      const { token } = await inviteMember(workspaceId, { email: inviteEmail, role: 'member' });
      setInviteLink(`${window.location.origin}/invite/${token}`);
      setInviteEmail('');
    } catch {
      setInviteError('초대에 실패했습니다.');
    }
  }

  return (
    <div>
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
    </div>
  );
}
