import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import type express from 'express';
import type { DbClient } from '../db.js';
import { createTestDb } from '../test-support/test-db.js';
import { createApp } from '../app.js';

const SECRET = 'test-secret-at-least-16-chars';
let db: DbClient;
let app: express.Express;

beforeEach(async () => {
  db = await createTestDb();
  app = createApp({ db, sessionSecret: SECRET });
});

async function signedIn() {
  const agent = request.agent(app);
  await agent.post('/api/auth/signup').send({ email: 'me@x.com', password: 'old-p4ssword', name: 'Me' });
  return agent;
}

describe('GET /auth/me', () => {
  it('describes the signed-in account', async () => {
    const agent = await signedIn();
    const res = await agent.get('/api/auth/me');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: expect.any(String), email: 'me@x.com', name: 'Me' });
  });

  it('requires a session (401)', async () => {
    expect((await request(app).get('/api/auth/me')).status).toBe(401);
  });
});

describe('PATCH /auth/me', () => {
  it('renames the account, trimmed', async () => {
    const agent = await signedIn();
    const res = await agent.patch('/api/auth/me').send({ name: '  New Name  ' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('New Name');
    expect((await agent.get('/api/auth/me')).body.name).toBe('New Name');
  });

  it('refuses a blank name (400 INVALID_NAME)', async () => {
    const agent = await signedIn();
    const res = await agent.patch('/api/auth/me').send({ name: '   ' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_NAME');
  });
});

describe('POST /auth/change-password', () => {
  it('changes the password, keeps this session and signs out every other one', async () => {
    const agent = await signedIn();
    const other = request.agent(app);
    await other.post('/api/auth/login').send({ email: 'me@x.com', password: 'old-p4ssword' });

    const res = await agent.post('/api/auth/change-password').send({ currentPassword: 'old-p4ssword', newPassword: 'new-p4ssword' });
    expect(res.status).toBe(204);

    expect((await agent.get('/api/auth/me')).status).toBe(200);
    expect((await other.get('/api/auth/me')).status).toBe(401);
    expect((await request(app).post('/api/auth/login').send({ email: 'me@x.com', password: 'old-p4ssword' })).status).toBe(401);
    expect((await request(app).post('/api/auth/login').send({ email: 'me@x.com', password: 'new-p4ssword' })).status).toBe(200);
  });

  it('refuses a wrong current password (401 INVALID_CREDENTIALS), changing nothing', async () => {
    const agent = await signedIn();
    const res = await agent.post('/api/auth/change-password').send({ currentPassword: 'wrong-guess', newPassword: 'new-p4ssword' });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_CREDENTIALS');
    expect((await agent.get('/api/auth/me')).status).toBe(200);
  });

  it('holds the new password to the same rules as sign-up', async () => {
    const agent = await signedIn();
    const res = await agent.post('/api/auth/change-password').send({ currentPassword: 'old-p4ssword', newPassword: 'short' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('PASSWORD_TOO_SHORT');
  });

  it('requires a session (401) and both fields (400)', async () => {
    expect((await request(app).post('/api/auth/change-password').send({ currentPassword: 'a', newPassword: 'b' })).status).toBe(401);
    const agent = await signedIn();
    expect((await agent.post('/api/auth/change-password').send({ newPassword: 'new-p4ssword' })).status).toBe(400);
  });
});
