import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import type Database from 'better-sqlite3';
import type express from 'express';
import { createDb } from '../db.js';
import { createApp } from '../app.js';
import { createUser } from '../db/users.js';
import { createWorkspace, addWorkspaceUser } from '../db/workspaces.js';
import { createBoard } from '../db/boards.js';
import { signSession } from '../auth/session.js';
import { SESSION_COOKIE_NAME } from '../middleware/require-auth.js';

const SECRET = 'test-secret-at-least-16-chars';
let db: Database.Database;
let app: express.Express;
let workspaceId: string;
let boardId: string;
let ownerCookie: string;
let memberCookie: string;

function cookieFor(userId: string, activeWorkspaceId: string) {
  return `${SESSION_COOKIE_NAME}=${signSession({ userId, activeWorkspaceId, issuedAt: Date.now() }, SECRET)}`;
}

beforeEach(() => {
  db = createDb(':memory:');
  app = createApp({ db, sessionSecret: SECRET });

  const owner = createUser(db, { email: 'owner@x.com', passwordHash: 'h', name: 'Owner' });
  const member = createUser(db, { email: 'member@x.com', passwordHash: 'h', name: 'Member' });
  const workspace = createWorkspace(db, 'W1');
  addWorkspaceUser(db, { workspaceId: workspace.id, userId: owner.id, role: 'owner' });
  addWorkspaceUser(db, { workspaceId: workspace.id, userId: member.id, role: 'member' });
  workspaceId = workspace.id;
  boardId = createBoard(db, { workspaceId, name: 'Board A' }).id;
  ownerCookie = cookieFor(owner.id, workspace.id);
  memberCookie = cookieFor(member.id, workspace.id);
});

describe('board share token management routes', () => {
  it('rejects a non-owner member with 403 on create', async () => {
    const res = await request(app)
      .post(`/workspaces/${workspaceId}/boards/${boardId}/share-tokens`)
      .set('Cookie', memberCookie);
    expect(res.status).toBe(403);
  });

  it('owner creates, lists, and deletes a share token', async () => {
    const create = await request(app)
      .post(`/workspaces/${workspaceId}/boards/${boardId}/share-tokens`)
      .set('Cookie', ownerCookie);
    expect(create.status).toBe(201);
    expect(create.body.token).toEqual(expect.any(String));
    expect(create.body.token.length).toBeGreaterThan(20);
    expect(create.body.tokenMask).toBe(create.body.token.slice(-8));
    const tokenId = create.body.id;

    const list = await request(app)
      .get(`/workspaces/${workspaceId}/boards/${boardId}/share-tokens`)
      .set('Cookie', ownerCookie);
    expect(list.status).toBe(200);
    expect(list.body.tokens).toEqual([expect.objectContaining({ id: tokenId, tokenMask: create.body.tokenMask })]);
    expect(list.body.tokens[0]).not.toHaveProperty('token');
    expect(list.body.tokens[0]).not.toHaveProperty('tokenHash');

    const del = await request(app)
      .delete(`/workspaces/${workspaceId}/boards/${boardId}/share-tokens/${tokenId}`)
      .set('Cookie', ownerCookie);
    expect(del.status).toBe(204);

    const listAfterDelete = await request(app)
      .get(`/workspaces/${workspaceId}/boards/${boardId}/share-tokens`)
      .set('Cookie', ownerCookie);
    expect(listAfterDelete.body.tokens).toEqual([]);
  });

  it('returns 404 when the board does not exist', async () => {
    const res = await request(app)
      .post(`/workspaces/${workspaceId}/boards/nonexistent/share-tokens`)
      .set('Cookie', ownerCookie);
    expect(res.status).toBe(404);
  });

  it('returns 404 deleting a token id that belongs to a different board', async () => {
    const create = await request(app)
      .post(`/workspaces/${workspaceId}/boards/${boardId}/share-tokens`)
      .set('Cookie', ownerCookie);
    const otherBoardId = createBoard(db, { workspaceId, name: 'Board B' }).id;

    const res = await request(app)
      .delete(`/workspaces/${workspaceId}/boards/${otherBoardId}/share-tokens/${create.body.id}`)
      .set('Cookie', ownerCookie);
    expect(res.status).toBe(404);
  });
});
