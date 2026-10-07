import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import type { DbClient } from './db.js';
import { createTestDb } from './test-support/test-db.js';
import { createApp } from './app.js';
import { createUser } from './db/users.js';
import { createWorkspace, addWorkspaceUser } from './db/workspaces.js';
import { signSession } from './auth/session.js';
import { SESSION_COOKIE_NAME, requireAuth } from './middleware/require-auth.js';

const SECRET = 'test-secret-at-least-16-chars';
let db: DbClient;
let app: import('express').Express;

beforeEach(async () => {
  db = await createTestDb();
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
      .post(`/api/workspaces/${workspace.id}/boards`)
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
      .put(`/api/workspaces/${workspace.id}/boards/${boardId}`)
      .set('Cookie', cookie)
      .send({ document: hugeDoc });

    expect(res.status).toBe(413);
    expect(res.body.code).toBe('PAYLOAD_TOO_LARGE');
  });

  it('returns 400 INVALID_JSON (not a generic 500) for a malformed JSON body, including on a public route', async () => {
    const malformed = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{not json');
    expect(malformed.status).toBe(400);
    expect(malformed.body.code).toBe('INVALID_JSON');

    const malformedPublicRoute = await request(app)
      .post('/api/share/boards/nonexistent/resolve')
      .set('Content-Type', 'application/json')
      .send('{not json');
    expect(malformedPublicRoute.status).toBe(400);
    expect(malformedPublicRoute.body.code).toBe('INVALID_JSON');
  });
});

describe('API caching', () => {
  // A share link's token travels in a header, so every link to one board fetches the same URL — a
  // stored answer for one token (an expired link's 410) would answer the next. No API answer is stored.
  it('marks every API answer, success or refusal, as not to be stored', async () => {
    const app = createApp({ db, sessionSecret: SECRET });
    for (const path of ['/api/share/boards/b1', '/api/auth/me', '/api/no-such-route']) {
      const res = await request(app).get(path).set('Authorization', 'Bearer some-token');
      expect(res.headers['cache-control']).toBe('no-store');
    }
  });
});

describe('CORS', () => {
  it('sends no CORS headers: the console and share viewer call the API on its own origin', async () => {
    const res = await request(app).get('/api/auth/bootstrap-status').set('Origin', 'https://anything.example.com');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});

describe('auth rate limiting', () => {
  it('returns 429 after exceeding the login attempt limit', async () => {
    for (let i = 0; i < 10; i++) {
      await request(app).post('/api/auth/login').send({ email: 'x@x.com', password: 'wrong' });
    }
    const res = await request(app).post('/api/auth/login').send({ email: 'x@x.com', password: 'wrong' });
    expect(res.status).toBe(429);
  });

  it('returns 429 after exceeding the request-password-reset attempt limit', async () => {
    for (let i = 0; i < 10; i++) {
      await request(app).post('/api/auth/request-password-reset').send({ email: 'x@x.com' });
    }
    const res = await request(app).post('/api/auth/request-password-reset').send({ email: 'x@x.com' });
    expect(res.status).toBe(429);
  });

  it('returns 429 after exceeding the reset-password attempt limit', async () => {
    for (let i = 0; i < 10; i++) {
      await request(app).post('/api/auth/reset-password').send({ token: 'garbage', newPassword: 'x' });
    }
    const res = await request(app).post('/api/auth/reset-password').send({ token: 'garbage', newPassword: 'x' });
    expect(res.status).toBe(429);
  });

  it('shares one bucket across login/signup/request-password-reset/reset-password (same IP)', async () => {
    for (let i = 0; i < 5; i++) {
      await request(app).post('/api/auth/login').send({ email: 'x@x.com', password: 'wrong' });
    }
    for (let i = 0; i < 5; i++) {
      await request(app).post('/api/auth/request-password-reset').send({ email: 'x@x.com' });
    }
    const res = await request(app).post('/api/auth/reset-password').send({ token: 'garbage', newPassword: 'x' });
    expect(res.status).toBe(429);
  });

  it('does not rate-limit unrelated routes', async () => {
    for (let i = 0; i < 10; i++) {
      await request(app).post('/api/auth/login').send({ email: 'x@x.com', password: 'wrong' });
    }
    const res = await request(app).get('/api/auth/bootstrap-status');
    expect(res.status).not.toBe(429);
  });

  it('keys by CF-Connecting-IP instead of req.ip when trustCloudflareProxy is set', async () => {
    const cfApp = createApp({ db, sessionSecret: SECRET, trustCloudflareProxy: true });
    for (let i = 0; i < 10; i++) {
      await request(cfApp)
        .post('/api/auth/login')
        .set('CF-Connecting-IP', '203.0.113.1')
        .send({ email: 'x@x.com', password: 'wrong' });
    }
    const sameIp = await request(cfApp)
      .post('/api/auth/login')
      .set('CF-Connecting-IP', '203.0.113.1')
      .send({ email: 'x@x.com', password: 'wrong' });
    expect(sameIp.status).toBe(429);

    // A different CF-Connecting-IP is a separate bucket even though supertest sends every
    // request from the same underlying req.ip — proves the key came from the header, not req.ip.
    const otherIp = await request(cfApp)
      .post('/api/auth/login')
      .set('CF-Connecting-IP', '203.0.113.2')
      .send({ email: 'x@x.com', password: 'wrong' });
    expect(otherIp.status).not.toBe(429);
  });

  it('keys an IPv6 CF-Connecting-IP by its /56 subnet, so rotating addresses shares one bucket', async () => {
    const cfApp = createApp({ db, sessionSecret: SECRET, trustCloudflareProxy: true });
    // Ten different addresses inside one /56 — one subscriber rotating through its allocation.
    for (let i = 0; i < 10; i++) {
      await request(cfApp)
        .post('/api/auth/login')
        .set('CF-Connecting-IP', `2001:db8:0:${i.toString(16)}::1`)
        .send({ email: 'x@x.com', password: 'wrong' });
    }
    const sameSubnet = await request(cfApp)
      .post('/api/auth/login')
      .set('CF-Connecting-IP', '2001:db8:0:ff::2')
      .send({ email: 'x@x.com', password: 'wrong' });
    expect(sameSubnet.status).toBe(429);

    const otherSubnet = await request(cfApp)
      .post('/api/auth/login')
      .set('CF-Connecting-IP', '2001:db8:0:100::1')
      .send({ email: 'x@x.com', password: 'wrong' });
    expect(otherSubnet.status).not.toBe(429);
  });
});

describe('GET /health', () => {
  it('returns 200 with an ok status when the database is reachable', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('returns 503 when the database is unreachable, without leaking driver detail', async () => {
    const brokenDb: DbClient = {
      query: async () => {
        throw new Error('connection terminated unexpectedly');
      },
      withTransaction: async fn => fn(brokenDb),
    };
    const brokenApp = createApp({ db: brokenDb, sessionSecret: SECRET });
    const res = await request(brokenApp).get('/health');
    expect(res.status).toBe(503);
    expect(res.body).toEqual({ status: 'error' });
  });

  it('requires no authentication', async () => {
    const res = await request(app).get('/health');
    expect(res.status).not.toBe(401);
  });
});
