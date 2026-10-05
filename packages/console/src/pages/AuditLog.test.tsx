import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuditLog, describeAuditEvent } from './AuditLog.js';
import type { AuditEvent } from '../api-client.js';

function event(overrides: Partial<AuditEvent>): AuditEvent {
  return {
    id: 'e1',
    occurredAt: '2026-10-05T03:04:05.000Z',
    action: 'member.left',
    workspace: { id: 'w1', name: 'Plant A' },
    actor: { userId: 'u1', name: 'Kim' },
    subject: null,
    role: null,
    target: null,
    detail: null,
    ...overrides,
  };
}

describe('describeAuditEvent', () => {
  it('names the actor, the subject and the role', () => {
    expect(
      describeAuditEvent(event({ action: 'member.role_changed', subject: { userId: 'u2', name: 'Lee', email: null }, role: 'owner' }))
    ).toBe('Kim님이 Lee님의 역할을 owner(으)로 바꿨습니다.');
  });

  it("names an invitation's recipient by address", () => {
    expect(
      describeAuditEvent(event({ action: 'invitation.created', subject: { userId: null, name: null, email: 'park@x.com' }, role: 'member' }))
    ).toBe('Kim님이 park@x.com을(를) member 역할로 초대했습니다.');
  });

  it('says a deleted account is deleted rather than leaving a blank', () => {
    expect(
      describeAuditEvent(
        event({ action: 'member.removed', actor: { userId: null, name: null }, subject: { userId: null, name: null, email: null } })
      )
    ).toBe('삭제된 계정이 삭제된 계정을 내보냈습니다.');
  });

  it("states an operator letting themselves in as the operator's act, and letting someone else in", () => {
    const restored = event({ action: 'workspace.owner_restored', actor: { userId: 'op', name: 'Op' }, subject: { userId: 'op', name: 'Op', email: null } });
    expect(describeAuditEvent(restored)).toBe('운영자 Op님이 owner로 들어왔습니다.');
    expect(describeAuditEvent({ ...restored, subject: { userId: 'u2', name: 'Lee', email: null } })).toBe('운영자 Op님이 Lee님을 owner로 들였습니다.');
  });
});

describe('describeAuditEvent — boards, share links, connectors', () => {
  it('names the board or connector as it was, and what changed — never a secret', () => {
    const target = { id: 't1', name: 'Line 1' };
    expect(describeAuditEvent(event({ action: 'board.deleted', target }))).toBe('Kim님이 보드 "Line 1"을(를) 삭제했습니다.');
    expect(describeAuditEvent(event({ action: 'share_link.created', target, detail: 'abcd1234' }))).toBe(
      'Kim님이 보드 "Line 1"의 공유 링크(•••• abcd1234)를 만들었습니다.'
    );
    expect(describeAuditEvent(event({ action: 'connector.updated', target: { id: 'c1', name: 'Plant API' }, detail: 'base_url,auth' }))).toBe(
      'Kim님이 커넥터 "Plant API"의 주소·인증 정보을(를) 바꿨습니다.'
    );
  });
});

describe('AuditLog', () => {
  it('shows the first page, then the next one on "더 보기"', async () => {
    const load = vi
      .fn()
      .mockResolvedValueOnce({ events: [event({ id: 'e2', action: 'member.left' })], nextBefore: '2' })
      .mockResolvedValueOnce({ events: [event({ id: 'e1', action: 'workspace.created' })], nextBefore: null });
    render(<AuditLog load={load} />);

    expect(await screen.findByText(/Kim님이 나갔습니다/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '더 보기' }));

    expect(await screen.findByText(/워크스페이스를 만들었습니다/)).toBeInTheDocument();
    expect(load).toHaveBeenLastCalledWith('2');
    expect(screen.getByText(/Kim님이 나갔습니다/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '더 보기' })).not.toBeInTheDocument();
  });

  it('names the workspace when asked to', async () => {
    const load = vi.fn().mockResolvedValue({ events: [event({ action: 'workspace.created' })], nextBefore: null });
    render(<AuditLog load={load} showWorkspace />);
    expect(await screen.findByText('[Plant A]')).toBeInTheDocument();
  });

  it('says so when there is nothing, and when loading fails', async () => {
    const { unmount } = render(<AuditLog load={vi.fn().mockResolvedValue({ events: [], nextBefore: null })} />);
    expect(await screen.findByText('기록이 없습니다.')).toBeInTheDocument();
    unmount();
    render(<AuditLog load={vi.fn().mockRejectedValue(new Error('down'))} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('기록을 불러오지 못했습니다.');
  });
});
