import { useCallback, useEffect, useState } from 'react';
import {
  ApiError,
  listInstanceUsers,
  listInstanceWorkspaces,
  makeWorkspaceOwner,
  setInstanceRole,
  type InstanceUser,
  type InstanceWorkspace,
} from '../api-client.js';
import { Alert } from '../design-system/Alert.js';
import { Badge } from '../design-system/Badge.js';
import { Button } from '../design-system/Button.js';

const LAST_OPERATOR_MESSAGE = '운영자가 한 명 이상 있어야 합니다 — 먼저 다른 계정을 운영자로 지정하세요.';

/**
 * Running the installation: every workspace (with its owners, not its contents) and every account.
 * `onSessionChanged` runs after an action that changes what this session may open — entering a
 * workspace as its owner, or stepping down as operator.
 */
export function InstancePage({
  userId,
  onEnterWorkspace,
  onSessionChanged,
}: {
  userId: string;
  onEnterWorkspace: (workspaceId: string) => Promise<void>;
  onSessionChanged: () => void;
}) {
  const [workspaces, setWorkspaces] = useState<InstanceWorkspace[]>([]);
  const [users, setUsers] = useState<InstanceUser[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [w, u] = await Promise.all([listInstanceWorkspaces(), listInstanceUsers()]);
    setWorkspaces(w.workspaces);
    setUsers(u.users);
  }, []);

  useEffect(() => {
    load().catch(() => setError('인스턴스 정보를 불러오지 못했습니다.'));
  }, [load]);

  async function handleEnter(workspace: InstanceWorkspace) {
    if (!window.confirm(`${workspace.name} 워크스페이스에 owner로 들어갈까요? 멤버 목록에 이름이 남습니다.`)) return;
    setError(null);
    try {
      await makeWorkspaceOwner(workspace.id, userId);
      await onEnterWorkspace(workspace.id);
    } catch {
      setError('워크스페이스에 들어가지 못했습니다.');
      // The owner row may have been added before the failure — show the list as it now stands.
      await load().catch(() => {});
    }
  }

  async function handleRole(user: InstanceUser, instanceRole: 'operator' | 'user') {
    const self = user.id === userId;
    if (instanceRole === 'user' && self && !window.confirm('운영자에서 물러나면 이 화면을 더 볼 수 없습니다. 계속할까요?')) return;
    setError(null);
    try {
      await setInstanceRole(user.id, instanceRole);
      if (self) onSessionChanged();
      else await load();
    } catch (err) {
      setError(err instanceof ApiError && err.code === 'LAST_OPERATOR' ? LAST_OPERATOR_MESSAGE : '역할을 바꾸지 못했습니다.');
    }
  }

  return (
    <div>
      <h2>워크스페이스</h2>
      {error && <Alert>{error}</Alert>}
      <ul>
        {workspaces.map(w => {
          const ownedByMe = w.owners.some(o => o.userId === userId);
          return (
            <li key={w.id}>
              <span>{w.name}</span> — 멤버 {w.memberCount}명 · owner{' '}
              {w.owners.length > 0 ? w.owners.map(o => o.email).join(', ') : <Badge>없음</Badge>} · 생성{' '}
              {new Date(w.createdAt).toLocaleDateString()}{' '}
              {!ownedByMe && (
                <Button variant="ghost" aria-label={`${w.name}에 owner로 들어가기`} onClick={() => handleEnter(w)}>
                  owner로 들어가기
                </Button>
              )}
            </li>
          );
        })}
      </ul>

      <h2>계정</h2>
      <ul>
        {users.map(u => (
          <li key={u.id}>
            <span>{u.email}</span> {u.name} {u.instanceRole === 'operator' && <Badge>운영자</Badge>} · 워크스페이스{' '}
            {u.workspaceCount}개{' '}
            {u.instanceRole === 'operator' ? (
              <Button variant="ghost" aria-label={`${u.email} 운영자 해제`} onClick={() => handleRole(u, 'user')}>
                운영자 해제
              </Button>
            ) : (
              <Button variant="ghost" aria-label={`${u.email} 운영자로 지정`} onClick={() => handleRole(u, 'operator')}>
                운영자로 지정
              </Button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
