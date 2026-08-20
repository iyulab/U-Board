import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import type Database from 'better-sqlite3';
import type express from 'express';
import { createDb } from './db.js';
import { createApp } from './app.js';
import { createUser } from './db/users.js';
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
