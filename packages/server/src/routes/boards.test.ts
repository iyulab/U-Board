import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import type Database from 'better-sqlite3';
import type express from 'express';
import { createDb } from '../db.js';
import { createApp } from '../app.js';
import { createUser } from '../db/users.js';
import { createWorkspace, addWorkspaceUser } from '../db/workspaces.js';
import { signSession } from '../auth/session.js';
import { SESSION_COOKIE_NAME } from '../middleware/require-auth.js';

const SECRET = 'test-secret-at-least-16-chars';
let db: Database.Database;
let app: express.Express;
let workspaceId: string;
let memberCookie: string;
let strangerCookie: string;

function cookieFor(userId: string, activeWorkspaceId: string) {
  return `${SESSION_COOKIE_NAME}=${signSession({ userId, activeWorkspaceId, issuedAt: Date.now() }, SECRET)}`;
}

beforeEach(() => {
  db = createDb(':memory:');
  app = createApp({ db, sessionSecret: SECRET });

  const member = createUser(db, { email: 'member@x.com', passwordHash: 'h', name: 'Member' });
  const stranger = createUser(db, { email: 'stranger@x.com', passwordHash: 'h', name: 'Stranger' });
  const workspace = createWorkspace(db, 'W1');
  addWorkspaceUser(db, { workspaceId: workspace.id, userId: member.id, role: 'member' });
  workspaceId = workspace.id;
  memberCookie = cookieFor(member.id, workspace.id);
  strangerCookie = cookieFor(stranger.id, workspace.id);
});

describe('boards routes', () => {
  it('rejects a non-member with 403', async () => {
    const res = await request(app).get(`/workspaces/${workspaceId}/boards`).set('Cookie', strangerCookie);
    expect(res.status).toBe(403);
  });

  it('creates, lists, fetches, updates and deletes a board end to end', async () => {
    const create = await request(app)
      .post(`/workspaces/${workspaceId}/boards`)
      .set('Cookie', memberCookie)
      .send({ name: 'My Board' });
    expect(create.status).toBe(201);
    const boardId = create.body.id;

    const list = await request(app).get(`/workspaces/${workspaceId}/boards`).set('Cookie', memberCookie);
    expect(list.status).toBe(200);
    expect(list.body.boards).toEqual([{ id: boardId, name: 'My Board', updatedAt: create.body.updatedAt }]);

    const get = await request(app).get(`/workspaces/${workspaceId}/boards/${boardId}`).set('Cookie', memberCookie);
    expect(get.status).toBe(200);
    expect(get.body.document).toEqual({ kind: 'canvas', background: {}, nodes: [], connectors: [] });

    const newDoc = { kind: 'canvas', background: {}, nodes: [{ id: 'n1', x: 1, y: 2, anchored: false, widget: { type: 'status' } }], connectors: [] };
    const update = await request(app)
      .put(`/workspaces/${workspaceId}/boards/${boardId}`)
      .set('Cookie', memberCookie)
      .send({ document: newDoc });
    expect(update.status).toBe(200);

    const reget = await request(app).get(`/workspaces/${workspaceId}/boards/${boardId}`).set('Cookie', memberCookie);
    expect(reget.body.document).toEqual(newDoc);

    const del = await request(app).delete(`/workspaces/${workspaceId}/boards/${boardId}`).set('Cookie', memberCookie);
    expect(del.status).toBe(204);

    const getAfterDelete = await request(app).get(`/workspaces/${workspaceId}/boards/${boardId}`).set('Cookie', memberCookie);
    expect(getAfterDelete.status).toBe(404);
  });

  it('returns 400 INVALID_DOCUMENT when the PUT body is not a ViewDocument', async () => {
    const create = await request(app).post(`/workspaces/${workspaceId}/boards`).set('Cookie', memberCookie).send({ name: 'A' });
    const res = await request(app)
      .put(`/workspaces/${workspaceId}/boards/${create.body.id}`)
      .set('Cookie', memberCookie)
      .send({ document: { not: 'a document' } });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_DOCUMENT');
  });

  it('returns 404 for a board id that belongs to a different workspace', async () => {
    const create = await request(app).post(`/workspaces/${workspaceId}/boards`).set('Cookie', memberCookie).send({ name: 'A' });

    const otherWorkspace = createWorkspace(db, 'Other');
    const otherMember = createUser(db, { email: 'other@x.com', passwordHash: 'h', name: 'Other' });
    addWorkspaceUser(db, { workspaceId: otherWorkspace.id, userId: otherMember.id, role: 'member' });
    const otherCookie = cookieFor(otherMember.id, otherWorkspace.id);

    const res = await request(app)
      .get(`/workspaces/${otherWorkspace.id}/boards/${create.body.id}`)
      .set('Cookie', otherCookie);
    expect(res.status).toBe(404);
  });

  it('returns 404 for an unknown board id within the caller\'s own workspace', async () => {
    const res = await request(app).get(`/workspaces/${workspaceId}/boards/nonexistent-id`).set('Cookie', memberCookie);
    expect(res.status).toBe(404);
  });

  it('returns 400 INVALID_INPUT when PUT has an empty name', async () => {
    const create = await request(app).post(`/workspaces/${workspaceId}/boards`).set('Cookie', memberCookie).send({ name: 'A' });
    const boardId = create.body.id;
    const res = await request(app)
      .put(`/workspaces/${workspaceId}/boards/${boardId}`)
      .set('Cookie', memberCookie)
      .send({ name: '' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_INPUT');
  });

  it('returns 400 INVALID_INPUT when PUT has a non-string name', async () => {
    const create = await request(app).post(`/workspaces/${workspaceId}/boards`).set('Cookie', memberCookie).send({ name: 'A' });
    const boardId = create.body.id;
    const res = await request(app)
      .put(`/workspaces/${workspaceId}/boards/${boardId}`)
      .set('Cookie', memberCookie)
      .send({ name: 123 });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_INPUT');
  });

  it('allows a name-only PUT and keeps the document unchanged', async () => {
    const create = await request(app).post(`/workspaces/${workspaceId}/boards`).set('Cookie', memberCookie).send({ name: 'Original' });
    const boardId = create.body.id;
    const originalDoc = create.body.document ?? { kind: 'canvas', background: {}, nodes: [], connectors: [] };

    const update = await request(app)
      .put(`/workspaces/${workspaceId}/boards/${boardId}`)
      .set('Cookie', memberCookie)
      .send({ name: 'Updated Name' });
    expect(update.status).toBe(200);
    expect(update.body.name).toBe('Updated Name');

    const get = await request(app).get(`/workspaces/${workspaceId}/boards/${boardId}`).set('Cookie', memberCookie);
    expect(get.status).toBe(200);
    expect(get.body.name).toBe('Updated Name');
    expect(get.body.document).toEqual(originalDoc);
  });
});
