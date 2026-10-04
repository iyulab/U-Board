import { describe, it, expect, beforeEach } from 'vitest';
import type { DbClient } from '../db.js';
import { createTestDb } from '../test-support/test-db.js';
import { createUser } from './users.js';
import { createWorkspace } from './workspaces.js';
import {
  createInvitation,
  findInvitationByToken,
  markInvitationAcceptedIfUnused,
  isInvitationUsable,
  listPendingInvitations,
  revokeInvitation,
} from './invitations.js';

let db: DbClient;
let workspaceId: string;
let userId: string;

beforeEach(async () => {
  db = await createTestDb();
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

  it('is not usable after being marked accepted', async () => {
    const owner = await createUser(db, { email: 'acceptowner@x.com', passwordHash: 'h', name: 'Owner' });
    const workspace = await createWorkspace(db, 'W');
    const inv = await createInvitation(db, { workspaceId: workspace.id, email: 'a@x.com', role: 'member', invitedByUserId: owner.id });
    await markInvitationAcceptedIfUnused(db, inv.id);
    const reloaded = await findInvitationByToken(db, inv.token);
    expect(isInvitationUsable(reloaded!)).toBe(false);
  });

  it('is not usable after expiring', async () => {
    const owner = await createUser(db, { email: 'expireowner@x.com', passwordHash: 'h', name: 'Owner2' });
    const workspace = await createWorkspace(db, 'W2');
    const inv = await createInvitation(db, { workspaceId: workspace.id, email: 'a@x.com', role: 'member', invitedByUserId: owner.id });
    // Directly backdate expires_at via a raw query — createInvitation always sets a future
    // expiry (INVITATION_TTL_MS from now), so there's no repository function for "create an
    // already-expired invitation"; going straight to SQL is the simplest way to test this branch.
    await db.query('UPDATE workspace_invitations SET expires_at = $1 WHERE id = $2', [
      new Date(Date.now() - 1000).toISOString(),
      inv.id,
    ]);
    const reloaded = await findInvitationByToken(db, inv.token);
    expect(isInvitationUsable(reloaded!)).toBe(false);
  });

  it('lists only redeemable invitations, without their tokens', async () => {
    const pending = await createInvitation(db, { workspaceId, email: 'p@x.com', role: 'owner', invitedByUserId: userId });
    const accepted = await createInvitation(db, { workspaceId, email: 'a@x.com', role: 'member', invitedByUserId: userId });
    await markInvitationAcceptedIfUnused(db, accepted.id);
    const expired = await createInvitation(db, { workspaceId, email: 'e@x.com', role: 'member', invitedByUserId: userId });
    await db.query('UPDATE workspace_invitations SET expires_at = $1 WHERE id = $2', [new Date(Date.now() - 1000).toISOString(), expired.id]);
    const elsewhere = await createWorkspace(db, 'Other');
    await createInvitation(db, { workspaceId: elsewhere.id, email: 'o@x.com', role: 'member', invitedByUserId: userId });

    expect(await listPendingInvitations(db, workspaceId)).toEqual([
      { id: pending.id, workspaceId, email: 'p@x.com', role: 'owner', invitedByUserId: userId, expiresAt: pending.expiresAt },
    ]);
  });

  it('revokes an unaccepted invitation of the given workspace only', async () => {
    const inv = await createInvitation(db, { workspaceId, email: 'a@x.com', role: 'member', invitedByUserId: userId });
    const elsewhere = await createWorkspace(db, 'Other');

    expect(await revokeInvitation(db, elsewhere.id, inv.id)).toBe(false);
    expect(await revokeInvitation(db, workspaceId, inv.id)).toBe(true);
    expect(await findInvitationByToken(db, inv.token)).toBeUndefined();
    expect(await revokeInvitation(db, workspaceId, inv.id)).toBe(false);
  });

  it('does not revoke an invitation that was already accepted', async () => {
    const inv = await createInvitation(db, { workspaceId, email: 'a@x.com', role: 'member', invitedByUserId: userId });
    await markInvitationAcceptedIfUnused(db, inv.id);
    expect(await revokeInvitation(db, workspaceId, inv.id)).toBe(false);
  });
});
