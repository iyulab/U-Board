import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import type Database from 'better-sqlite3';
import type express from 'express';
import { createDb } from './db.js';
import { createApp } from './app.js';

// The realistic trigger: an async route handler whose awaited work rejects. Express 4 does not
// forward such a rejection on its own, so without `asyncHandler` plus the app's error
// middleware it would surface as an unhandled rejection and terminate the process.
vi.mock('./auth/password.js', () => ({
  hashPassword: vi.fn().mockRejectedValue(new Error('hashing backend unavailable')),
  verifyPassword: vi.fn().mockRejectedValue(new Error('hashing backend unavailable')),
}));

const SECRET = 'test-secret-at-least-16-chars';
let db: Database.Database;
let app: express.Express;

beforeEach(() => {
  db = createDb(':memory:');
  app = createApp({ db, sessionSecret: SECRET });
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('error-handling middleware', () => {
  it('answers 500 INTERNAL_ERROR when an async route handler rejects', async () => {
    const res = await request(app)
      .post('/auth/signup')
      .send({ email: 'first@x.com', password: 'p4ssword!', name: 'First' });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ code: 'INTERNAL_ERROR' });
    expect(console.error).toHaveBeenCalled();
  });

  it('answers 500 INTERNAL_ERROR when the login handler rejects', async () => {
    createDbUser(db);
    const res = await request(app).post('/auth/login').send({ email: 'first@x.com', password: 'p4ssword!' });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ code: 'INTERNAL_ERROR' });
  });
});

function createDbUser(database: Database.Database): void {
  database
    .prepare(`INSERT INTO users (id, email, password_hash, name, created_at) VALUES (?, ?, ?, ?, ?)`)
    .run('u1', 'first@x.com', 'hash', 'First', new Date().toISOString());
}
