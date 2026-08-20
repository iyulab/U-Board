import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import type Database from 'better-sqlite3';
import type express from 'express';
import { createDb } from './db.js';
import { createApp } from './app.js';
import { createUser } from './db/users.js';
import { createWorkspace, addWorkspaceUser } from './db/workspaces.js';
import { signSession } from './auth/session.js';
import { SESSION_COOKIE_NAME, requireAuth } from './middleware/require-auth.js';

const SECRET = 'test-secret-at-least-16-chars';
let db: Database.Database;
let app: express.Express;

beforeEach(() => {
  db = createDb(':memory:');
  app = createApp({ db, sessionSecret: SECRET });
  app.get('/_test/protected', requireAuth(db, SECRET), (req: any, res) => {
    res.status(200).json({ userId: req.userId });
  });
});

describe('createApp / requireAuth', () => {
  it('returns 401 with no session cookie', async () => {
    const res = await request(app).get('/_test/protected');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHENTICATED');
  });

  it('returns 401 with a garbage cookie', async () => {
    const res = await request(app).get('/_test/protected').set('Cookie', `${SESSION_COOKIE_NAME}=garbage`);
    expect(res.status).toBe(401);
  });
});

describe('errorHandler / body size limit', () => {
  it('returns 413 PAYLOAD_TOO_LARGE (not a generic 500) when the request body exceeds the limit', async () => {
    const member = createUser(db, { email: 'member@x.com', passwordHash: 'h', name: 'Member' });
    const workspace = createWorkspace(db, 'W1');
    addWorkspaceUser(db, { workspaceId: workspace.id, userId: member.id, role: 'member' });
    const cookie = `${SESSION_COOKIE_NAME}=${signSession({ userId: member.id, activeWorkspaceId: workspace.id, issuedAt: Date.now() }, SECRET)}`;

    const create = await request(app)
      .post(`/workspaces/${workspace.id}/boards`)
      .set('Cookie', cookie)
      .send({ name: 'Big Image Board' });
    expect(create.status).toBe(201);
    const boardId = create.body.id;

    // Well over the 10mb express.json() limit configured in createApp.
    const hugeSrc = `data:image/png;base64,${'A'.repeat(11 * 1024 * 1024)}`;
    const hugeDoc = {
      kind: 'canvas',
      background: { image: { src: hugeSrc, width: 100, height: 100 } },
      nodes: [],
      connectors: [],
    };

    const res = await request(app)
      .put(`/workspaces/${workspace.id}/boards/${boardId}`)
      .set('Cookie', cookie)
      .send({ document: hugeDoc });

    expect(res.status).toBe(413);
    expect(res.body.code).toBe('PAYLOAD_TOO_LARGE');
  });
});
