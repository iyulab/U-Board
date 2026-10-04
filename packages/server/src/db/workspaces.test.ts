import { describe, it, expect, beforeEach } from 'vitest';
import type { DbClient } from '../db.js';
import { createTestDb } from '../test-support/test-db.js';
import { createUser } from './users.js';
import {
  createWorkspace,
  addWorkspaceUser,
  findWorkspaceUser,
  listWorkspacesForUser,
  listWorkspaceMembers,
  changeWorkspaceMembership,
} from './workspaces.js';

let db: DbClient;
beforeEach(async () => {
  db = await createTestDb();
});

describe('workspace repository', () => {
  it('creates a workspace', async () => {
    const ws = await createWorkspace(db, 'My Workspace');
    expect(ws.name).toBe('My Workspace');
    expect(ws.id).toBeTruthy();
  });

  it('adds a user to a workspace and finds the membership', async () => {
    const user = await createUser(db, { email: 'a@x.com', passwordHash: 'h', name: 'A' });
    const ws = await createWorkspace(db, 'W');
    await addWorkspaceUser(db, { workspaceId: ws.id, userId: user.id, role: 'owner' });
    const found = await findWorkspaceUser(db, ws.id, user.id);
    expect(found?.role).toBe('owner');
  });

  it('returns undefined for a non-member', async () => {
    const ws = await createWorkspace(db, 'W');
    expect(await findWorkspaceUser(db, ws.id, 'nobody')).toBeUndefined();
  });

  it('lists workspaces for a user, oldest first', async () => {
    const user = await createUser(db, { email: 'a@x.com', passwordHash: 'h', name: 'A' });
    const ws1 = await createWorkspace(db, 'First');
    await addWorkspaceUser(db, { workspaceId: ws1.id, userId: user.id, role: 'owner' });
    const ws2 = await createWorkspace(db, 'Second');
    await addWorkspaceUser(db, { workspaceId: ws2.id, userId: user.id, role: 'owner' });
    const list = await listWorkspacesForUser(db, user.id);
    expect(list.map(w => w.id)).toEqual([ws1.id, ws2.id]);
  });

  it('lists members of a workspace', async () => {
    const owner = await createUser(db, { email: 'owner@x.com', passwordHash: 'h', name: 'Owner' });
    const member = await createUser(db, { email: 'member@x.com', passwordHash: 'h', name: 'Member' });
    const ws = await createWorkspace(db, 'W');
    await addWorkspaceUser(db, { workspaceId: ws.id, userId: owner.id, role: 'owner' });
    await addWorkspaceUser(db, { workspaceId: ws.id, userId: member.id, role: 'member' });
    const members = await listWorkspaceMembers(db, ws.id);
    expect(members).toHaveLength(2);
    expect(members.find(m => m.userId === owner.id)?.role).toBe('owner');
  });
});

describe('changeWorkspaceMembership', () => {
  async function workspaceWith(roles: Array<'owner' | 'member'>) {
    const ws = await createWorkspace(db, 'W');
    const userIds: string[] = [];
    for (const [i, role] of roles.entries()) {
      const user = await createUser(db, { email: `u${i}@x.com`, passwordHash: 'h', name: `U${i}` });
      await addWorkspaceUser(db, { workspaceId: ws.id, userId: user.id, role });
      userIds.push(user.id);
    }
    return { workspaceId: ws.id, userIds };
  }

  it('removes a member', async () => {
    const { workspaceId, userIds } = await workspaceWith(['owner', 'member']);
    expect(await changeWorkspaceMembership(db, { workspaceId, userId: userIds[1], change: { kind: 'remove' } })).toBe('changed');
    expect(await findWorkspaceUser(db, workspaceId, userIds[1])).toBeUndefined();
  });

  it('changes a role in both directions', async () => {
    const { workspaceId, userIds } = await workspaceWith(['owner', 'member']);
    await changeWorkspaceMembership(db, { workspaceId, userId: userIds[1], change: { kind: 'set-role', role: 'owner' } });
    expect((await findWorkspaceUser(db, workspaceId, userIds[1]))?.role).toBe('owner');
    await changeWorkspaceMembership(db, { workspaceId, userId: userIds[0], change: { kind: 'set-role', role: 'member' } });
    expect((await findWorkspaceUser(db, workspaceId, userIds[0]))?.role).toBe('member');
  });

  it('refuses to remove or demote the last owner', async () => {
    const { workspaceId, userIds } = await workspaceWith(['owner', 'member']);
    expect(await changeWorkspaceMembership(db, { workspaceId, userId: userIds[0], change: { kind: 'remove' } })).toBe('last-owner');
    expect(
      await changeWorkspaceMembership(db, { workspaceId, userId: userIds[0], change: { kind: 'set-role', role: 'member' } })
    ).toBe('last-owner');
    expect((await findWorkspaceUser(db, workspaceId, userIds[0]))?.role).toBe('owner');
  });

  it('lets the last owner keep the owner role (a no-op is not a demotion)', async () => {
    const { workspaceId, userIds } = await workspaceWith(['owner']);
    expect(
      await changeWorkspaceMembership(db, { workspaceId, userId: userIds[0], change: { kind: 'set-role', role: 'owner' } })
    ).toBe('changed');
  });

  it('reports a user who is not a member', async () => {
    const { workspaceId } = await workspaceWith(['owner']);
    expect(await changeWorkspaceMembership(db, { workspaceId, userId: 'nobody', change: { kind: 'remove' } })).toBe('not-member');
  });

  it('leaves one owner when two owners remove each other at once', async () => {
    const { workspaceId, userIds } = await workspaceWith(['owner', 'owner']);
    const results = await Promise.all([
      changeWorkspaceMembership(db, { workspaceId, userId: userIds[0], change: { kind: 'remove' } }),
      changeWorkspaceMembership(db, { workspaceId, userId: userIds[1], change: { kind: 'remove' } }),
    ]);
    expect(results.sort()).toEqual(['changed', 'last-owner']);
    expect((await listWorkspaceMembers(db, workspaceId)).filter(m => m.role === 'owner')).toHaveLength(1);
  });
});
