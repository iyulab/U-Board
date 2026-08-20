import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import type Database from 'better-sqlite3';
import { createDb } from '../db.js';
import { createUser } from '../db/users.js';
import { createWorkspace, addWorkspaceUser } from '../db/workspaces.js';
import { requireWorkspaceMember, requireWorkspaceOwner } from './require-workspace-role.js';
import type { AuthedRequest } from './require-auth.js';

let db: Database.Database;
let app: express.Express;
let ownerId: string;
let memberId: string;
let workspaceId: string;

beforeEach(() => {
  db = createDb(':memory:');
  const owner = createUser(db, { email: 'owner@x.com', passwordHash: 'h', name: 'Owner' });
  const member = createUser(db, { email: 'member@x.com', passwordHash: 'h', name: 'Member' });
  const workspace = createWorkspace(db, 'W1');
  addWorkspaceUser(db, { workspaceId: workspace.id, userId: owner.id, role: 'owner' });
  addWorkspaceUser(db, { workspaceId: workspace.id, userId: member.id, role: 'member' });
  ownerId = owner.id;
  memberId = member.id;
  workspaceId = workspace.id;

  app = express();
  app.use((req: AuthedRequest, _res, next) => {
    req.userId = req.header('x-test-user-id') ?? undefined;
    next();
  });
  app.get('/workspaces/:workspaceId/member-only', requireWorkspaceMember(db), (_req, res) => res.status(200).json({ ok: true }));
  app.get('/workspaces/:workspaceId/owner-only', requireWorkspaceOwner(db), (_req, res) => res.status(200).json({ ok: true }));
});

describe('requireWorkspaceMember', () => {
  it('allows a member', async () => {
    const res = await request(app).get(`/workspaces/${workspaceId}/member-only`).set('x-test-user-id', memberId);
    expect(res.status).toBe(200);
  });

  it('rejects a non-member with 403', async () => {
    const res = await request(app).get(`/workspaces/${workspaceId}/member-only`).set('x-test-user-id', 'stranger');
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });
});

describe('requireWorkspaceOwner', () => {
  it('allows an owner', async () => {
    const res = await request(app).get(`/workspaces/${workspaceId}/owner-only`).set('x-test-user-id', ownerId);
    expect(res.status).toBe(200);
  });

  it('rejects a member with 403', async () => {
    const res = await request(app).get(`/workspaces/${workspaceId}/owner-only`).set('x-test-user-id', memberId);
    expect(res.status).toBe(403);
  });
});
