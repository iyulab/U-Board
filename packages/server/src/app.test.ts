import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import type { DbClient } from './db.js';
import { createDb } from './db.js';
import { createApp } from './app.js';
import { createUser } from './db/users.js';
import { createWorkspace, addWorkspaceUser } from './db/workspaces.js';
import { signSession } from './auth/session.js';
import { SESSION_COOKIE_NAME, requireAuth } from './middleware/require-auth.js';

const SECRET = 'test-secret-at-least-16-chars';
let db: DbClient;
let app: import('express').Express;

beforeEach(async () => {
  db = await createDb(':memory:');
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
    const member = await createUser(db, { email: 'member@x.com', passwordHash: 'h', name: 'Member' });
    const workspace = await createWorkspace(db, 'W1');
    await addWorkspaceUser(db, { workspaceId: workspace.id, userId: member.id, role: 'member' });
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

  it('returns 400 INVALID_JSON (not a generic 500) for a malformed JSON body, including on a public route', async () => {
    const malformed = await request(app).post('/auth/login').set('Content-Type', 'application/json').send('{not json');
    expect(malformed.status).toBe(400);
    expect(malformed.body.code).toBe('INVALID_JSON');

    const malformedPublicRoute = await request(app)
      .post('/share/boards/nonexistent/connectors/nonexistent/resolve')
      .set('Content-Type', 'application/json')
      .send('{not json');
    expect(malformedPublicRoute.status).toBe(400);
    expect(malformedPublicRoute.body.code).toBe('INVALID_JSON');
  });
});

describe('CORS', () => {
  it('reflects an allowed origin and marks credentials allowed', async () => {
    const corsApp = createApp({ db, sessionSecret: SECRET, corsOrigins: ['https://board.u-platform.kr'] });
    const res = await request(corsApp).get('/auth/bootstrap-status').set('Origin', 'https://board.u-platform.kr');
    expect(res.headers['access-control-allow-origin']).toBe('https://board.u-platform.kr');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('omits CORS headers for an origin not on the allowlist', async () => {
    const corsApp = createApp({ db, sessionSecret: SECRET, corsOrigins: ['https://board.u-platform.kr'] });
    const res = await request(corsApp).get('/auth/bootstrap-status').set('Origin', 'https://evil.example.com');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('adds no CORS middleware when corsOrigins is unset (dev/test default)', async () => {
    const res = await request(app).get('/auth/bootstrap-status').set('Origin', 'https://anything.example.com');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('still carries CORS headers on a 413 PAYLOAD_TOO_LARGE response (CORS must run before express.json())', async () => {
    const corsApp = createApp({ db, sessionSecret: SECRET, corsOrigins: ['https://board.u-platform.kr'] });
    // Well over the 10mb express.json() limit configured in createApp — triggers the same
    // entity.too.large path exercised in the 'errorHandler / body size limit' suite above.
    const hugeBody = { email: 'x@x.com', password: 'A'.repeat(11 * 1024 * 1024) };
    const res = await request(corsApp)
      .post('/auth/login')
      .set('Origin', 'https://board.u-platform.kr')
      .send(hugeBody);
    expect(res.status).toBe(413);
    expect(res.body.code).toBe('PAYLOAD_TOO_LARGE');
    expect(res.headers['access-control-allow-origin']).toBe('https://board.u-platform.kr');
  });
});

describe('auth rate limiting', () => {
  it('returns 429 after exceeding the login attempt limit', async () => {
    for (let i = 0; i < 10; i++) {
      await request(app).post('/auth/login').send({ email: 'x@x.com', password: 'wrong' });
    }
    const res = await request(app).post('/auth/login').send({ email: 'x@x.com', password: 'wrong' });
    expect(res.status).toBe(429);
  });

  it('does not rate-limit unrelated routes', async () => {
    for (let i = 0; i < 10; i++) {
      await request(app).post('/auth/login').send({ email: 'x@x.com', password: 'wrong' });
    }
    const res = await request(app).get('/auth/bootstrap-status');
    expect(res.status).not.toBe(429);
  });
});
