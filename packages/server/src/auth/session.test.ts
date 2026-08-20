import { describe, it, expect, vi } from 'vitest';
import { signSession, verifySession, type SessionPayload } from './session.js';

const SECRET = 'test-secret-at-least-16-chars';

describe('session cookie signing', () => {
  it('round-trips a payload through sign then verify', () => {
    const payload: SessionPayload = { userId: 'u1', activeWorkspaceId: 'w1', issuedAt: Date.now() };
    const token = signSession(payload, SECRET);
    expect(verifySession(token, SECRET)).toEqual(payload);
  });

  it('rejects a token signed with a different secret', () => {
    const payload: SessionPayload = { userId: 'u1', activeWorkspaceId: 'w1', issuedAt: Date.now() };
    const token = signSession(payload, SECRET);
    expect(verifySession(token, 'a-different-secret-16chars')).toBeNull();
  });

  it('rejects a tampered payload', () => {
    const payload: SessionPayload = { userId: 'u1', activeWorkspaceId: 'w1', issuedAt: Date.now() };
    const token = signSession(payload, SECRET);
    const [body, signature] = token.split('.');
    const tamperedPayload = Buffer.from(
      JSON.stringify({ ...payload, userId: 'attacker' })
    ).toString('base64url');
    expect(verifySession(`${tamperedPayload}.${signature}`, SECRET)).toBeNull();
  });

  it('rejects a token older than 30 days', () => {
    const old: SessionPayload = {
      userId: 'u1',
      activeWorkspaceId: 'w1',
      issuedAt: Date.now() - 31 * 24 * 60 * 60 * 1000,
    };
    const token = signSession(old, SECRET);
    expect(verifySession(token, SECRET)).toBeNull();
  });

  it('rejects a malformed token', () => {
    expect(verifySession('not-a-valid-token', SECRET)).toBeNull();
  });
});
