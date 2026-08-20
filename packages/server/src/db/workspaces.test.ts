import { describe, it, expect, beforeEach } from 'vitest';
import type Database from 'better-sqlite3';
import { createDb } from '../db.js';
import { createUser } from './users.js';
import {
  createWorkspace,
  addWorkspaceUser,
  findWorkspaceUser,
  listWorkspacesForUser,
  listWorkspaceMembers,
} from './workspaces.js';

let db: Database.Database;
beforeEach(() => {
  db = createDb(':memory:');
});

describe('workspace repository', () => {
  it('creates a workspace and adds a member', () => {
    const workspace = createWorkspace(db, 'Default');
    const user = createUser(db, { email: 'a@x.com', passwordHash: 'h', name: 'A' });
    const wu = addWorkspaceUser(db, { workspaceId: workspace.id, userId: user.id, role: 'owner' });
    expect(wu.role).toBe('owner');
    expect(findWorkspaceUser(db, workspace.id, user.id)).toEqual(wu);
  });

  it('lists all workspaces a user belongs to', () => {
    const user = createUser(db, { email: 'a@x.com', passwordHash: 'h', name: 'A' });
    const w1 = createWorkspace(db, 'W1');
    const w2 = createWorkspace(db, 'W2');
    addWorkspaceUser(db, { workspaceId: w1.id, userId: user.id, role: 'owner' });
    addWorkspaceUser(db, { workspaceId: w2.id, userId: user.id, role: 'member' });
    const names = listWorkspacesForUser(db, user.id).map(w => w.name).sort();
    expect(names).toEqual(['W1', 'W2']);
  });

  it('lists members of a workspace with their role and profile', () => {
    const user = createUser(db, { email: 'a@x.com', passwordHash: 'h', name: 'A' });
    const workspace = createWorkspace(db, 'W1');
    addWorkspaceUser(db, { workspaceId: workspace.id, userId: user.id, role: 'owner' });
    expect(listWorkspaceMembers(db, workspace.id)).toEqual([
      { userId: user.id, email: 'a@x.com', name: 'A', role: 'owner' },
    ]);
  });

  it('returns undefined when the user is not a member of the workspace', () => {
    const workspace = createWorkspace(db, 'W1');
    const user = createUser(db, { email: 'a@x.com', passwordHash: 'h', name: 'A' });
    expect(findWorkspaceUser(db, workspace.id, user.id)).toBeUndefined();
  });
});
