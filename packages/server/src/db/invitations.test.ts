import { describe, it, expect, beforeEach } from 'vitest';
import type { DbClient } from '../db.js';
import { createDb } from '../db.js';
import { createUser } from './users.js';
import { createWorkspace } from './workspaces.js';
import { createInvitation, findInvitationByToken, markInvitationAccepted, markInvitationAcceptedIfUnused, isInvitationUsable } from './invitations.js';

let db: DbClient;
let workspaceId: string;
let userId: string;

beforeEach(async () => {
  db = await createDb(':memory:');
  const user = await createUser(db, { email: 'owner@x.com', passwordHash: 'h', name: 'Owner' });
  userId = user.id;
  const workspace = await createWorkspace(db, 'W1');
  workspaceId = workspace.id;
});

describe('invitation repository', () => {
  it('creates an invitation and finds it by token', async () => {
    const inv = await createInvitation(db, { workspaceId, email: 'a@x.com', role: 'member', invitedByUserId: userId });
    expect(await findInvitationByToken(db, inv.token)).toEqual(inv);
  });

  it('is usable when unaccepted and unexpired', async () => {
    const inv = await createInvitation(db, { workspaceId, email: 'a@x.com', role: 'member', invitedByUserId: userId });
    expect(isInvitationUsable(inv)).toBe(true);
  });

  it('marks an invitation accepted unconditionally', async () => {
    const inv = await createInvitation(db, { workspaceId, email: 'a@x.com', role: 'member', invitedByUserId: userId });
    await markInvitationAccepted(db, inv.id);
    const reloaded = await findInvitationByToken(db, inv.token);
    expect(reloaded?.acceptedAt).toBeTruthy();
  });

  it('markInvitationAcceptedIfUnused claims an unused invitation and returns it', async () => {
    const inv = await createInvitation(db, { workspaceId, email: 'a@x.com', role: 'member', invitedByUserId: userId });
    const claimed = await markInvitationAcceptedIfUnused(db, inv.id);
    expect(claimed?.id).toBe(inv.id);
    expect(claimed?.workspaceId).toBe(workspaceId);
  });

  it('markInvitationAcceptedIfUnused returns undefined for an already-accepted invitation', async () => {
    const inv = await createInvitation(db, { workspaceId, email: 'a@x.com', role: 'member', invitedByUserId: userId });
    await markInvitationAcceptedIfUnused(db, inv.id);
    const second = await markInvitationAcceptedIfUnused(db, inv.id);
    expect(second).toBeUndefined();
  });
});
