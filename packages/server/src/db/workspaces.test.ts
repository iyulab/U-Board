import { describe, it, expect, beforeEach } from 'vitest';
import type { DbClient } from '../db.js';
import { createDb } from '../db.js';
import { createUser } from './users.js';
import { createWorkspace, addWorkspaceUser, findWorkspaceUser, listWorkspacesForUser, listWorkspaceMembers } from './workspaces.js';

let db: DbClient;
beforeEach(async () => {
  db = await createDb(':memory:');
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
