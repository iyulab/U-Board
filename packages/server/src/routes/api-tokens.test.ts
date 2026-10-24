import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import type express from 'express';
import type { DbClient } from '../db.js';
import { createTestDb } from '../test-support/test-db.js';
import { createApp } from '../app.js';
import { createUser } from '../db/users.js';
import { createWorkspace, addWorkspaceUser } from '../db/workspaces.js';
import { createBoard } from '../db/boards.js';
import { signSession } from '../auth/session.js';
import { SESSION_COOKIE_NAME } from '../middleware/require-auth.js';

const SECRET = 'test-secret-at-least-16-chars';
let db: DbClient;
let app: express.Express;
let workspaceId: string;
let otherWorkspaceId: string;
let ownerId: string;
let ownerCookie: string;
let memberId: string;
let memberCookie: string;

function cookieFor(userId: string, activeWorkspaceId: string) {
  return `${SESSION_COOKIE_NAME}=${signSession({ userId, activeWorkspaceId, issuedAt: Date.now() }, SECRET)}`;
}

async function mint(cookie: string, body: object = { name: 'Assistant', scope: 'write' }) {
  const res = await request(app).post(`/api/workspaces/${workspaceId}/api-tokens`).set('Cookie', cookie).send(body);
  expect(res.status).toBe(201);
  return res.body as { id: string; token: string; tokenMask: string; scope: string };
}

const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

beforeEach(async () => {
  db = await createTestDb();
  app = createApp({ db, sessionSecret: SECRET });
  const owner = await createUser(db, { email: 'owner@x.com', passwordHash: 'h', name: 'Owner' });
  const member = await createUser(db, { email: 'member@x.com', passwordHash: 'h', name: 'Member' });
  const workspace = await createWorkspace(db, 'W1');
  const other = await createWorkspace(db, 'W2');
  await addWorkspaceUser(db, { workspaceId: workspace.id, userId: owner.id, role: 'owner' });
  await addWorkspaceUser(db, { workspaceId: workspace.id, userId: member.id, role: 'member' });
  await addWorkspaceUser(db, { workspaceId: other.id, userId: owner.id, role: 'owner' });
  workspaceId = workspace.id;
  otherWorkspaceId = other.id;
  ownerId = owner.id;
  memberId = member.id;
  ownerCookie = cookieFor(owner.id, workspace.id);
  memberCookie = cookieFor(member.id, workspace.id);
});

describe('managing API tokens', () => {
  it('shows a new token once, and lists it by name, scope and ending only', async () => {
    const created = await mint(memberCookie);
    expect(created.token).toMatch(/^ubt_[A-Za-z0-9_-]{43}$/);
    expect(created.tokenMask).toBe(`ubt_…${created.token.slice(-6)}`);
    const list = await request(app).get(`/api/workspaces/${workspaceId}/api-tokens`).set('Cookie', memberCookie);
    expect(list.body.tokens).toEqual([
      { id: created.id, userId: memberId, name: 'Assistant', scope: 'write', tokenMask: created.tokenMask, createdAt: expect.any(String) },
    ]);
    expect(JSON.stringify(list.body)).not.toContain(created.token);
  });

  it('lets an owner see and delete every token, a member only their own', async () => {
    const ownerToken = await mint(ownerCookie, { name: 'Owner tool', scope: 'read' });
    const memberToken = await mint(memberCookie);
    const asMember = await request(app).get(`/api/workspaces/${workspaceId}/api-tokens`).set('Cookie', memberCookie);
    expect(asMember.body.tokens.map((t: { id: string }) => t.id)).toEqual([memberToken.id]);
    const asOwner = await request(app).get(`/api/workspaces/${workspaceId}/api-tokens`).set('Cookie', ownerCookie);
    expect(asOwner.body.tokens).toHaveLength(2);
    expect((await request(app).delete(`/api/workspaces/${workspaceId}/api-tokens/${ownerToken.id}`).set('Cookie', memberCookie)).status).toBe(404);
    expect((await request(app).delete(`/api/workspaces/${workspaceId}/api-tokens/${memberToken.id}`).set('Cookie', ownerCookie)).status).toBe(204);
  });

  it('refuses a token without a name, with an unknown scope, or expiring in the past', async () => {
    for (const body of [{ scope: 'write' }, { name: ' ', scope: 'write' }, { name: 'x', scope: 'admin' }, { name: 'x', scope: 'read', expiresAt: '2000-01-01T00:00:00Z' }]) {
      expect((await request(app).post(`/api/workspaces/${workspaceId}/api-tokens`).set('Cookie', ownerCookie).send(body)).status).toBe(400);
    }
  });

  it('is managed by people only — a token cannot make or list tokens', async () => {
    const { token } = await mint(ownerCookie);
    const res = await request(app).get(`/api/workspaces/${workspaceId}/api-tokens`).set(bearer(token));
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('API_TOKEN_NOT_ACCEPTED');
  });

  it('records making and deleting a token, without its text', async () => {
    const created = await mint(memberCookie);
    await request(app).delete(`/api/workspaces/${workspaceId}/api-tokens/${created.id}`).set('Cookie', memberCookie);
    const { rows } = await db.query<{ action: string; detail: string; target_name: string }>(
      `SELECT action, detail, target_name FROM audit_events WHERE action LIKE 'api_token.%' ORDER BY seq`
    );
    expect(rows).toEqual([
      { action: 'api_token.created', detail: `write ${created.tokenMask}`, target_name: 'Assistant' },
      { action: 'api_token.deleted', detail: `write ${created.tokenMask}`, target_name: 'Assistant' },
    ]);
  });
});

describe('using an API token', () => {
  it('reads and writes the boards of its workspace, as the person who made it', async () => {
    const board = await createBoard(db, { workspaceId, name: 'B', actorUserId: ownerId, kind: 'grid' });
    const { token } = await mint(memberCookie);
    expect((await request(app).get(`/api/workspaces/${workspaceId}/boards`).set(bearer(token))).status).toBe(200);
    const saved = await request(app)
      .put(`/api/workspaces/${workspaceId}/boards/${board.id}`)
      .set(bearer(token))
      .send({ document: { parts: { a: { as: 'header', title: 'A' } }, layout: { kind: 'grid', items: ['a'] } } });
    expect(saved.status).toBe(200);
  });

  it('only looks with a read token', async () => {
    const board = await createBoard(db, { workspaceId, name: 'B', actorUserId: ownerId });
    const { token } = await mint(memberCookie, { name: 'Viewer', scope: 'read' });
    expect((await request(app).get(`/api/workspaces/${workspaceId}/boards/${board.id}`).set(bearer(token))).status).toBe(200);
    const write = await request(app).put(`/api/workspaces/${workspaceId}/boards/${board.id}`).set(bearer(token)).send({ name: 'C' });
    expect(write.status).toBe(403);
    expect(write.body.code).toBe('READ_ONLY_TOKEN');
  });

  it('reaches its own workspace only, even where its person belongs to another', async () => {
    const { token } = await mint(ownerCookie);
    expect((await request(app).get(`/api/workspaces/${otherWorkspaceId}/boards`).set(bearer(token))).status).toBe(403);
  });

  it('is not accepted where a person acts for themselves', async () => {
    const { token } = await mint(ownerCookie);
    for (const path of ['/api/auth/me', '/api/workspaces/me', `/api/workspaces/${workspaceId}/boards/x/share-tokens`]) {
      const res = await request(app).get(path).set(bearer(token));
      expect(res.status, path).toBe(401);
    }
  });

  it('sets a data source up but never its credential', async () => {
    const { token } = await mint(ownerCookie);
    const plain = { name: 'Plant API', baseUrl: 'https://plant.example.com', authType: 'none' };
    expect((await request(app).post(`/api/workspaces/${workspaceId}/connectors`).set(bearer(token)).send(plain)).status).toBe(201);
    const secret = await request(app)
      .post(`/api/workspaces/${workspaceId}/connectors`)
      .set(bearer(token))
      .send({ ...plain, authType: 'bearer', authValue: 's3cret' });
    expect(secret.status).toBe(403);
    expect(secret.body.code).toBe('CREDENTIALS_IN_CONSOLE');
  });

  it('acts with its person’s role: a member’s token cannot change data sources', async () => {
    const { token } = await mint(memberCookie);
    const res = await request(app).post(`/api/workspaces/${workspaceId}/connectors`).set(bearer(token)).send({ name: 'X', baseUrl: 'https://x.example.com', authType: 'none' });
    expect(res.status).toBe(403);
  });

  it('stops working once deleted, expired, or its person has left the workspace', async () => {
    const deleted = await mint(memberCookie);
    await request(app).delete(`/api/workspaces/${workspaceId}/api-tokens/${deleted.id}`).set('Cookie', memberCookie);
    expect((await request(app).get(`/api/workspaces/${workspaceId}/boards`).set(bearer(deleted.token))).status).toBe(401);

    const expiring = await mint(memberCookie, { name: 'Soon', scope: 'read', expiresAt: new Date(Date.now() + 60_000).toISOString() });
    await db.query(`UPDATE api_tokens SET expires_at = $2 WHERE id = $1`, [expiring.id, new Date(Date.now() - 1000).toISOString()]);
    expect((await request(app).get(`/api/workspaces/${workspaceId}/boards`).set(bearer(expiring.token))).status).toBe(401);

    const kept = await mint(memberCookie);
    await db.query(`DELETE FROM workspace_users WHERE workspace_id = $1 AND user_id = $2`, [workspaceId, memberId]);
    expect((await request(app).get(`/api/workspaces/${workspaceId}/boards`).set(bearer(kept.token))).status).toBe(403);
  });

  it('refuses an unknown token', async () => {
    expect((await request(app).get(`/api/workspaces/${workspaceId}/boards`).set(bearer('ubt_nope'))).status).toBe(401);
  });

  it('says what it is at GET /api/token', async () => {
    const { token } = await mint(memberCookie, { name: 'Viewer', scope: 'read' });
    const res = await request(app).get('/api/token').set(bearer(token));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ workspace: { id: workspaceId, name: 'W1' }, scope: 'read', role: 'member' });
    expect((await request(app).get('/api/token').set('Cookie', memberCookie)).status).toBe(400);
  });
});
