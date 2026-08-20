import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import type Database from 'better-sqlite3';
import type express from 'express';
import { createDb } from '../db.js';
import { createApp } from '../app.js';
import { createUser } from '../db/users.js';
import { createWorkspace, addWorkspaceUser } from '../db/workspaces.js';
import { createInvitation } from '../db/invitations.js';
import { hashPassword } from '../auth/password.js';

const SECRET = 'test-secret-at-least-16-chars';
let db: Database.Database;
let app: express.Express;

beforeEach(() => {
  db = createDb(':memory:');
  app = createApp({ db, sessionSecret: SECRET });
});

describe('GET /invitations/:token', () => {
  it('returns invitation details for a valid token, hasAccount=false for a new email', async () => {
    const owner = createUser(db, { email: 'owner@x.com', passwordHash: await hashPassword('x'), name: 'Owner' });
    const workspace = createWorkspace(db, 'W1');
    addWorkspaceUser(db, { workspaceId: workspace.id, userId: owner.id, role: 'owner' });
    const invitation = createInvitation(db, { workspaceId: workspace.id, email: 'new@x.com', role: 'member', invitedByUserId: owner.id });

    const res = await request(app).get(`/invitations/${invitation.token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ email: 'new@x.com', workspaceId: workspace.id, hasAccount: false });
  });

  it('returns 404 for an unknown token', async () => {
    const res = await request(app).get('/invitations/does-not-exist');
    expect(res.status).toBe(404);
  });
});

describe('POST /invitations/:token/accept', () => {
  it('joins the current session user to the invitation workspace', async () => {
    const owner = createUser(db, { email: 'owner@x.com', passwordHash: await hashPassword('x'), name: 'Owner' });
    const workspace = createWorkspace(db, 'W1');
    addWorkspaceUser(db, { workspaceId: workspace.id, userId: owner.id, role: 'owner' });
    const invitation = createInvitation(db, { workspaceId: workspace.id, email: 'existing@x.com', role: 'member', invitedByUserId: owner.id });

    const signupRes = await request(app)
      .post('/auth/signup')
      .send({ email: 'existing@x.com', password: 'p4ssword!', name: 'Existing' }); // bootstrap already used by owner, so this needs its own invitation? no: this is the FIRST user overall in this test's db, so open signup is fine
    // (owner above was inserted directly via repository, not via /auth/signup, so countUsers()===0
    // is false already because of `owner` -> open signup for `existing` must fail; use login flow instead)
    expect(signupRes.status).toBe(403); // confirms guard from Task 10 still applies

    const cookie = request.agent(app);
    const passwordHash = await hashPassword('p4ssword!');
    createUser(db, { email: 'existing@x.com', passwordHash, name: 'Existing' });
    const loginRes = await cookie.post('/auth/login').send({ email: 'existing@x.com', password: 'p4ssword!' });
    expect(loginRes.status).toBe(200);

    const acceptRes = await cookie.post(`/invitations/${invitation.token}/accept`);
    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.workspaceId).toBe(workspace.id);
  });

  it('returns 401 when not authenticated', async () => {
    const owner = createUser(db, { email: 'owner@x.com', passwordHash: await hashPassword('x'), name: 'Owner' });
    const workspace = createWorkspace(db, 'W1');
    const invitation = createInvitation(db, { workspaceId: workspace.id, email: 'x@x.com', role: 'member', invitedByUserId: owner.id });
    const res = await request(app).post(`/invitations/${invitation.token}/accept`);
    expect(res.status).toBe(401);
  });

  it('returns 410 for an already-accepted invitation', async () => {
    const owner = createUser(db, { email: 'owner@x.com', passwordHash: await hashPassword('x'), name: 'Owner' });
    const workspace = createWorkspace(db, 'W1');
    addWorkspaceUser(db, { workspaceId: workspace.id, userId: owner.id, role: 'owner' });
    const invitation = createInvitation(db, { workspaceId: workspace.id, email: 'x@x.com', role: 'member', invitedByUserId: owner.id });

    const cookie = request.agent(app);
    const passwordHash = await hashPassword('p4ssword!');
    createUser(db, { email: 'x@x.com', passwordHash, name: 'X' });
    await cookie.post('/auth/login').send({ email: 'x@x.com', password: 'p4ssword!' });
    await cookie.post(`/invitations/${invitation.token}/accept`);

    const secondAttempt = await cookie.post(`/invitations/${invitation.token}/accept`);
    expect(secondAttempt.status).toBe(410);
  });
});
