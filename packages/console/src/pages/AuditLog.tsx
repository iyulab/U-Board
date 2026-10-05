import { useCallback, useEffect, useState } from 'react';
import type { AuditEvent, AuditEventList, AuditPerson } from '../api-client.js';
import { Alert } from '../design-system/Alert.js';
import { Button } from '../design-system/Button.js';

const DELETED = '삭제된 계정';

function person(p: AuditPerson | null): string {
  return p?.name ?? DELETED;
}

/** Whom a record is about: an account by name, or an invitation's address. */
function subjectOf(event: AuditEvent): string {
  const subject = event.subject;
  if (!subject) return DELETED;
  return subject.name ?? subject.email ?? DELETED;
}

/** One record as a sentence. */
export function describeAuditEvent(event: AuditEvent): string {
  const actor = person(event.actor);
  switch (event.action) {
    case 'workspace.created':
      return `${actor}님이 워크스페이스를 만들었습니다.`;
    case 'workspace.owner_restored':
      return `운영자 ${actor}님이 ${subjectOf(event)}님을 owner로 들였습니다.`;
    case 'member.joined':
      return `${actor}님이 ${event.role} 역할로 참여했습니다.`;
    case 'member.left':
      return `${actor}님이 나갔습니다.`;
    case 'member.removed':
      return `${actor}님이 ${subjectOf(event)}님을 내보냈습니다.`;
    case 'member.role_changed':
      return `${actor}님이 ${subjectOf(event)}님의 역할을 ${event.role}(으)로 바꿨습니다.`;
    case 'invitation.created':
      return `${actor}님이 ${subjectOf(event)}을(를) ${event.role} 역할로 초대했습니다.`;
    case 'invitation.resent':
      return `${actor}님이 ${subjectOf(event)}에게 초대를 다시 보냈습니다.`;
    case 'invitation.revoked':
      return `${actor}님이 ${subjectOf(event)}에게 보낸 초대를 취소했습니다.`;
    case 'instance.role_changed':
      return event.role === 'operator'
        ? `${actor}님이 ${subjectOf(event)}님을 운영자로 지정했습니다.`
        : `${actor}님이 ${subjectOf(event)}님을 운영자에서 해제했습니다.`;
    case 'account.deleted':
      return '계정 하나가 삭제되었습니다.';
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
              <time dateTime={event.occurredAt}>{new Date(event.occurredAt).toLocaleString()}</time>{' '}
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
