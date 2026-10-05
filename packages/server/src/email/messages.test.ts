import { describe, expect, it } from 'vitest';
import { invitationMessage, passwordResetMessage } from './messages.js';

describe('passwordResetMessage', () => {
  it('carries the code in the body and keeps it out of the subject', () => {
    const message = passwordResetMessage('the-code');
    expect(message.body).toContain('the-code');
    expect(message.subject).not.toContain('the-code');
    expect(message.body).toContain('1시간');
  });
});

describe('invitationMessage', () => {
  const invitation = {
    email: 'new@example.com',
    invitationId: 'inv-1',
    workspaceName: 'Plant A',
    inviterName: 'Operator',
    role: 'member' as const,
    link: 'https://board.example.com/invite/tok',
    expiresAt: '2026-10-12T23:59:30.000Z',
  };

  it('states the inviter, workspace, role, link and expiry', () => {
    const { body } = invitationMessage(invitation);
    expect(body).toContain('Operator님이');
    expect(body).toContain('"Plant A" 워크스페이스');
    expect(body).toContain('member 역할');
    expect(body).toContain('https://board.example.com/invite/tok');
    expect(body).toContain('2026-10-12 23:59 (UTC)');
  });

  it('keeps workspace-controlled text out of the subject', () => {
    const { subject } = invitationMessage({ ...invitation, workspaceName: 'Injected\r\nBcc: x@y.z' });
    expect(subject).toBe('U-Board 워크스페이스 초대');
  });
});
