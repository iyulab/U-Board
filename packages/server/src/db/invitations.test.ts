import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import type Database from 'better-sqlite3';
import { createDb } from '../db.js';
import { createUser } from './users.js';
import { createWorkspace } from './workspaces.js';
import { createInvitation, findInvitationByToken, markInvitationAccepted, isInvitationUsable } from './invitations.js';

let db: Database.Database;
beforeEach(() => {
  db = createDb(':memory:');
});
afterEach(() => {
  vi.useRealTimers();
});

describe('invitation repository', () => {
  it('creates an invitation with a unique token and finds it by token', () => {
    const owner = createUser(db, { email: 'owner@x.com', passwordHash: 'h', name: 'Owner' });
    const workspace = createWorkspace(db, 'W1');
    const invitation = createInvitation(db, {
      workspaceId: workspace.id,
      email: 'new@x.com',
      role: 'member',
      invitedByUserId: owner.id,
    });
    expect(invitation.token).toHaveLength(48);
    expect(findInvitationByToken(db, invitation.token)).toEqual(invitation);
  });

  it('is usable when unaccepted and unexpired', () => {
    const owner = createUser(db, { email: 'owner@x.com', passwordHash: 'h', name: 'Owner' });
    const workspace = createWorkspace(db, 'W1');
    const invitation = createInvitation(db, { workspaceId: workspace.id, email: 'new@x.com', role: 'member', invitedByUserId: owner.id });
    expect(isInvitationUsable(invitation)).toBe(true);
  });

  it('is not usable after being marked accepted', () => {
    const owner = createUser(db, { email: 'owner@x.com', passwordHash: 'h', name: 'Owner' });
    const workspace = createWorkspace(db, 'W1');
    const invitation = createInvitation(db, { workspaceId: workspace.id, email: 'new@x.com', role: 'member', invitedByUserId: owner.id });
    markInvitationAccepted(db, invitation.id);
    const reloaded = findInvitationByToken(db, invitation.token)!;
    expect(isInvitationUsable(reloaded)).toBe(false);
  });

  it('is not usable after expiring', () => {
    const owner = createUser(db, { email: 'owner@x.com', passwordHash: 'h', name: 'Owner' });
    const workspace = createWorkspace(db, 'W1');
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    const invitation = createInvitation(db, { workspaceId: workspace.id, email: 'new@x.com', role: 'member', invitedByUserId: owner.id });
    vi.setSystemTime(new Date('2026-01-09T00:00:00Z')); // 8 days later, TTL is 7
    expect(isInvitationUsable(invitation)).toBe(false);
  });
});
