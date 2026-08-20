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

describe('POST /auth/signup', () => {
  it('bootstraps: first-ever user becomes owner of a new Default workspace', async () => {
    const res = await request(app).post('/auth/signup').send({ email: 'first@x.com', password: 'p4ssword!', name: 'First' });
    expect(res.status).toBe(201);
    expect(res.headers['set-cookie']?.[0]).toMatch(/^ub_session=/);
    expect(res.body.workspaceId).toBeTruthy();
  });

  it('rejects a second open signup (no invitation) with 403', async () => {
    await request(app).post('/auth/signup').send({ email: 'first@x.com', password: 'p4ssword!', name: 'First' });
    const res = await request(app).post('/auth/signup').send({ email: 'second@x.com', password: 'p4ssword!', name: 'Second' });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('SIGNUP_REQUIRES_INVITATION');
  });

  it('accepts signup with a valid invitation token, joining the inviting workspace as member', async () => {
    const owner = createUser(db, { email: 'owner@x.com', passwordHash: await hashPassword('x'), name: 'Owner' });
    const workspace = createWorkspace(db, 'W1');
    addWorkspaceUser(db, { workspaceId: workspace.id, userId: owner.id, role: 'owner' });
    const invitation = createInvitation(db, { workspaceId: workspace.id, email: 'invitee@x.com', role: 'member', invitedByUserId: owner.id });

    const res = await request(app).post('/auth/signup').send({
      email: 'invitee@x.com', password: 'p4ssword!', name: 'Invitee', invitationToken: invitation.token,
    });
    expect(res.status).toBe(201);
    expect(res.body.workspaceId).toBe(workspace.id);
  });

  it('rejects a duplicate email with 409', async () => {
    await request(app).post('/auth/signup').send({ email: 'dup@x.com', password: 'p4ssword!', name: 'A' });
    const res = await request(app).post('/auth/signup').send({ email: 'dup@x.com', password: 'other!', name: 'B' });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('EMAIL_TAKEN');
  });

  it('rejects malformed input (missing password) with 400', async () => {
    const res = await request(app).post('/auth/signup').send({ email: 'bad@x.com', name: 'A' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_INPUT');
  });

  it('rejects an unknown/garbage invitation token with 410', async () => {
    // First user must exist so the request goes down the invitation-required branch
    // rather than the (also-403) open-bootstrap branch.
    await request(app).post('/auth/signup').send({ email: 'first@x.com', password: 'p4ssword!', name: 'First' });
    const res = await request(app).post('/auth/signup').send({
      email: 'nobody@x.com', password: 'p4ssword!', name: 'Nobody', invitationToken: 'garbage-token',
    });
    expect(res.status).toBe(410);
    expect(res.body.code).toBe('INVITATION_INVALID');
  });

  it('rejects an expired invitation with 410', async () => {
    const owner = createUser(db, { email: 'owner2@x.com', passwordHash: await hashPassword('x'), name: 'Owner' });
    const workspace = createWorkspace(db, 'W2');
    addWorkspaceUser(db, { workspaceId: workspace.id, userId: owner.id, role: 'owner' });
    const invitation = createInvitation(db, { workspaceId: workspace.id, email: 'late@x.com', role: 'member', invitedByUserId: owner.id });
    db.prepare('UPDATE workspace_invitations SET expires_at = ? WHERE id = ?').run(
      new Date(Date.now() - 1000).toISOString(), invitation.id
    );

    const res = await request(app).post('/auth/signup').send({
      email: 'late@x.com', password: 'p4ssword!', name: 'Late', invitationToken: invitation.token,
    });
    expect(res.status).toBe(410);
    expect(res.body.code).toBe('INVITATION_INVALID');
  });

  it('rejects an invitation whose email does not match the signup email with 410', async () => {
    const owner = createUser(db, { email: 'owner3@x.com', passwordHash: await hashPassword('x'), name: 'Owner' });
    const workspace = createWorkspace(db, 'W3');
    addWorkspaceUser(db, { workspaceId: workspace.id, userId: owner.id, role: 'owner' });
    const invitation = createInvitation(db, { workspaceId: workspace.id, email: 'invited@x.com', role: 'member', invitedByUserId: owner.id });

    const res = await request(app).post('/auth/signup').send({
      email: 'someone-else@x.com', password: 'p4ssword!', name: 'Mismatch', invitationToken: invitation.token,
    });
    expect(res.status).toBe(410);
    expect(res.body.code).toBe('INVITATION_INVALID');
  });
});

describe('POST /auth/login', () => {
  it('logs in with correct credentials', async () => {
    await request(app).post('/auth/signup').send({ email: 'login@x.com', password: 'p4ssword!', name: 'A' });
    const res = await request(app).post('/auth/login').send({ email: 'login@x.com', password: 'p4ssword!' });
    expect(res.status).toBe(200);
    expect(res.headers['set-cookie']?.[0]).toMatch(/^ub_session=/);
  });

  it('logs in when the email casing differs from how the account was created', async () => {
    await request(app).post('/auth/signup').send({ email: 'Mixed.Case@X.com', password: 'p4ssword!', name: 'A' });
    const res = await request(app).post('/auth/login').send({ email: 'mixed.case@x.com', password: 'p4ssword!' });
    expect(res.status).toBe(200);
    expect(res.headers['set-cookie']?.[0]).toMatch(/^ub_session=/);
  });

  it('rejects an unknown email with 401 (no enumeration)', async () => {
    const res = await request(app).post('/auth/login').send({ email: 'nobody@x.com', password: 'x' });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_CREDENTIALS');
  });

  it('rejects a wrong password with the same 401/code as unknown email', async () => {
    await request(app).post('/auth/signup').send({ email: 'wrongpw@x.com', password: 'correct!', name: 'A' });
    const res = await request(app).post('/auth/login').send({ email: 'wrongpw@x.com', password: 'incorrect!' });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_CREDENTIALS');
  });

  it('rejects malformed input (missing email) with 400', async () => {
    const res = await request(app).post('/auth/login').send({ password: 'p4ssword!' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_INPUT');
  });
});

describe('POST /auth/logout', () => {
  it('clears the session cookie', async () => {
    const res = await request(app).post('/auth/logout');
    expect(res.status).toBe(204);
    expect(res.headers['set-cookie']?.[0]).toMatch(/^ub_session=;/);
  });
});

describe('GET /auth/bootstrap-status', () => {
  it('reports hasAnyUser=false before the first signup', async () => {
    const res = await request(app).get('/auth/bootstrap-status');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ hasAnyUser: false });
  });

  it('reports hasAnyUser=true after the first signup', async () => {
    await request(app).post('/auth/signup').send({ email: 'first@x.com', password: 'p4ssword!', name: 'First' });
    const res = await request(app).get('/auth/bootstrap-status');
    expect(res.body).toEqual({ hasAnyUser: true });
  });
});
