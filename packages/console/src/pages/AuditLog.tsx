import { useCallback, useEffect, useState } from 'react';
import type { AuditEvent, AuditEventList, AuditPerson } from '../api-client.js';
import { Alert } from '../design-system/Alert.js';
import { Button } from '../design-system/Button.js';
import { Timestamp } from '../format-time.js';

const DELETED = '삭제된 계정';

/** A person as the sentence names them: `Kim님`, or plainly `삭제된 계정` (no honorific on it). */
function person(p: AuditPerson | null): string {
  return p?.name ? `${p.name}님` : DELETED;
}

/** Whom a record is about: an account by name, or an invitation's address. */
function subjectOf(event: AuditEvent): string {
  const subject = event.subject;
  if (subject?.name) return `${subject.name}님`;
  return subject?.email ?? DELETED;
}

const CONNECTOR_SETTINGS: Record<string, string> = { name: '이름', base_url: '주소', auth: '인증 정보' };

/** A board or connector as the sentence names it. */
function targetOf(event: AuditEvent): string {
  return `"${event.target?.name ?? ''}"`;
}

/** One record as a sentence. */
export function describeAuditEvent(event: AuditEvent): string {
  const actor = person(event.actor);
  switch (event.action) {
    case 'workspace.created':
      return `${actor}이 워크스페이스를 만들었습니다.`;
    case 'workspace.owner_restored':
      return event.subject?.userId && event.subject.userId === event.actor.userId
        ? `운영자 ${actor}이 owner로 들어왔습니다.`
        : `운영자 ${actor}이 ${subjectOf(event)}을 owner로 들였습니다.`;
    case 'member.joined':
      return `${actor}이 ${event.role} 역할로 참여했습니다.`;
    case 'member.left':
      return `${actor}이 나갔습니다.`;
    case 'member.removed':
      return `${actor}이 ${subjectOf(event)}을 내보냈습니다.`;
    case 'member.role_changed':
      return `${actor}이 ${subjectOf(event)}의 역할을 ${event.role}(으)로 바꿨습니다.`;
    case 'invitation.created':
      return `${actor}이 ${subjectOf(event)}을(를) ${event.role} 역할로 초대했습니다.`;
    case 'invitation.resent':
      return `${actor}이 ${subjectOf(event)}에게 초대를 다시 보냈습니다.`;
    case 'invitation.revoked':
      return `${actor}이 ${subjectOf(event)}에게 보낸 초대를 취소했습니다.`;
    case 'instance.role_changed':
      return event.role === 'operator'
        ? `${actor}이 ${subjectOf(event)}을 운영자로 지정했습니다.`
        : `${actor}이 ${subjectOf(event)}을 운영자에서 해제했습니다.`;
    case 'account.deleted':
      return '계정 하나가 삭제되었습니다.';
    case 'board.created':
      return `${actor}이 보드 ${targetOf(event)}을(를) 만들었습니다.`;
    case 'board.deleted':
      return `${actor}이 보드 ${targetOf(event)}을(를) 삭제했습니다.`;
    case 'share_link.created':
      return `${actor}이 보드 ${targetOf(event)}의 공유 링크(•••• ${event.detail ?? ''})를 만들었습니다.`;
    case 'share_link.deleted':
      return `${actor}이 보드 ${targetOf(event)}의 공유 링크(•••• ${event.detail ?? ''})를 삭제했습니다.`;
    case 'connector.created':
      return `${actor}이 커넥터 ${targetOf(event)}을(를) 만들었습니다.`;
    case 'connector.updated': {
      const changed = (event.detail ?? '').split(',').filter(Boolean).map(key => CONNECTOR_SETTINGS[key] ?? key);
      return `${actor}이 커넥터 ${targetOf(event)}의 ${changed.join('·') || '설정'}을(를) 바꿨습니다.`;
    }
    case 'connector.deleted':
      return `${actor}이 커넥터 ${targetOf(event)}을(를) 삭제했습니다.`;
  }
}

/**
 * A record of who changed what, newest first, a page at a time. `load` fetches one page (older than
 * `before` when given); it changes identity when the record should be read again from the top.
 * `showWorkspace` names each record's workspace — for the installation's record, which spans them.
 */
export function AuditLog({
  load,
  showWorkspace = false,
}: {
  load: (before?: string) => Promise<AuditEventList>;
  showWorkspace?: boolean;
}) {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [nextBefore, setNextBefore] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let current = true;
    load()
      .then(page => {
        if (!current) return;
        setEvents(page.events);
        setNextBefore(page.nextBefore);
        setError(null);
      })
      .catch(() => current && setError('기록을 불러오지 못했습니다.'));
    return () => {
      current = false;
    };
  }, [load]);

  const loadMore = useCallback(async () => {
    if (!nextBefore) return;
    try {
      const page = await load(nextBefore);
      setEvents(previous => [...previous, ...page.events]);
      setNextBefore(page.nextBefore);
    } catch {
      setError('기록을 더 불러오지 못했습니다.');
    }
  }, [load, nextBefore]);

  return (
    <>
      {error && <Alert>{error}</Alert>}
      {events.length === 0 && !error ? (
        <p>기록이 없습니다.</p>
      ) : (
        <ul>
          {events.map(event => (
            <li key={event.id}>
              <Timestamp value={event.occurredAt} />{' '}
              {showWorkspace && event.workspace && <span>[{event.workspace.name}] </span>}
              {describeAuditEvent(event)}
            </li>
          ))}
        </ul>
      )}
      {nextBefore && (
        <Button variant="ghost" onClick={loadMore}>
          더 보기
        </Button>
      )}
    </>
  );
}
