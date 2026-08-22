import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import type { DbClient } from '../db.js';
import { createDb } from '../db.js';
import { createApp } from '../app.js';
import { createUser } from '../db/users.js';
import { createWorkspace, addWorkspaceUser } from '../db/workspaces.js';
import { createInvitation } from '../db/invitations.js';
import { hashPassword } from '../auth/password.js';

const SECRET = 'test-secret-at-least-16-chars';
let db: DbClient;
let app: import('express').Express;

beforeEach(async () => {
  db = await createDb(':memory:');
  app = createApp({ db, sessionSecret: SECRET });
});

afterEach(() => {
  vi.restoreAllMocks();
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
    const owner = await createUser(db, { email: 'owner@x.com', passwordHash: await hashPassword('x'), name: 'Owner' });
    const workspace = await createWorkspace(db, 'W1');
    await addWorkspaceUser(db, { workspaceId: workspace.id, userId: owner.id, role: 'owner' });
    const invitation = await createInvitation(db, { workspaceId: workspace.id, email: 'invitee@x.com', role: 'member', invitedByUserId: owner.id });

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
    await request(app).post('/auth/signup').send({ email: 'first@x.com', password: 'p4ssword!', name: 'First' });
    const res = await request(app).post('/auth/signup').send({
      email: 'nobody@x.com', password: 'p4ssword!', name: 'Nobody', invitationToken: 'garbage-token',
    });
    expect(res.status).toBe(410);
    expect(res.body.code).toBe('INVITATION_INVALID');
  });

  it('rejects an expired invitation with 410', async () => {
    const owner = await createUser(db, { email: 'owner2@x.com', passwordHash: await hashPassword('x'), name: 'Owner' });
    const workspace = await createWorkspace(db, 'W2');
    await addWorkspaceUser(db, { workspaceId: workspace.id, userId: owner.id, role: 'owner' });
    const invitation = await createInvitation(db, { workspaceId: workspace.id, email: 'late@x.com', role: 'member', invitedByUserId: owner.id });
    await db.query('UPDATE workspace_invitations SET expires_at = $1 WHERE id = $2', [
      new Date(Date.now() - 1000).toISOString(), invitation.id,
    ]);

    const res = await request(app).post('/auth/signup').send({
      email: 'late@x.com', password: 'p4ssword!', name: 'Late', invitationToken: invitation.token,
    });
    expect(res.status).toBe(410);
    expect(res.body.code).toBe('INVITATION_INVALID');
  });

  it('rejects an invitation whose email does not match the signup email with 410', async () => {
    const owner = await createUser(db, { email: 'owner3@x.com', passwordHash: await hashPassword('x'), name: 'Owner' });
    const workspace = await createWorkspace(db, 'W3');
    await addWorkspaceUser(db, { workspaceId: workspace.id, userId: owner.id, role: 'owner' });
    const invitation = await createInvitation(db, { workspaceId: workspace.id, email: 'invited@x.com', role: 'member', invitedByUserId: owner.id });

    const res = await request(app).post('/auth/signup').send({
      email: 'someone-else@x.com', password: 'p4ssword!', name: 'Mismatch', invitationToken: invitation.token,
    });
    expect(res.status).toBe(410);
    expect(res.body.code).toBe('INVITATION_INVALID');
  });

  it('rolls the entire signup back when a write inside the transaction fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    // Makes `addWorkspaceUser` — the last write of the sequence — fail, after the workspace and
    // the user rows have already been inserted within the same transaction.
    await db.query('DROP TABLE workspace_users');

    const res = await request(app).post('/auth/signup').send({ email: 'first@x.com', password: 'p4ssword!', name: 'First' });

    expect(res.status).toBe(500);
    expect(res.body.code).toBe('INTERNAL_ERROR');
    expect(Number((await db.query<{ c: string }>('SELECT COUNT(*) AS c FROM users')).rows[0].c)).toBe(0);
    expect(Number((await db.query<{ c: string }>('SELECT COUNT(*) AS c FROM workspaces')).rows[0].c)).toBe(0);
  });

  it('serializes two concurrent open bootstrap signups — only one becomes owner', async () => {
    // Both requests have no invitation token, so both race the "am I the first user" bootstrap
    // gate guarded by pg_advisory_xact_lock. The loser is rejected by that gate (403) before it
    // ever reaches the users.email UNIQUE constraint — a separate scenario below races on the
    // constraint itself.
    const attempt = () => request(app).post('/auth/signup').send({ email: 'race@x.com', password: 'p4ssword!', name: 'Racer' });
    const [a, b] = await Promise.all([attempt(), attempt()]);
    const statuses = [a.status, b.status].sort((x, y) => x - y);
    expect(statuses).toEqual([201, 403]);
    expect(Number((await db.query<{ c: string }>('SELECT COUNT(*) AS c FROM users')).rows[0].c)).toBe(1);
  });

  it('rejects one of two concurrent invited signups with the same email — the users.email UNIQUE constraint wins', async () => {
    // Two distinct, independently-valid invitations for the same email. Both skip the bootstrap
    // gate (an invitation is present) and both successfully claim their own distinct invitation
    // row via markInvitationAcceptedIfUnused — so this is the scenario that actually reaches two
    // concurrent createUser() calls for the same email and exercises the 23505 catch.
    const owner = await createUser(db, { email: 'owner5@x.com', passwordHash: await hashPassword('x'), name: 'Owner' });
    const workspace = await createWorkspace(db, 'W5');
    await addWorkspaceUser(db, { workspaceId: workspace.id, userId: owner.id, role: 'owner' });
    const invitationA = await createInvitation(db, { workspaceId: workspace.id, email: 'race2@x.com', role: 'member', invitedByUserId: owner.id });
    const invitationB = await createInvitation(db, { workspaceId: workspace.id, email: 'race2@x.com', role: 'member', invitedByUserId: owner.id });

    const attempt = (token: string) => request(app).post('/auth/signup').send({
      email: 'race2@x.com', password: 'p4ssword!', name: 'Racer2', invitationToken: token,
    });
    const [a, b] = await Promise.all([attempt(invitationA.token), attempt(invitationB.token)]);
    const statuses = [a.status, b.status].sort((x, y) => x - y);
    expect(statuses).toEqual([201, 409]);
    expect(
      Number((await db.query<{ c: string }>('SELECT COUNT(*) AS c FROM users WHERE email = $1', ['race2@x.com'])).rows[0].c)
    ).toBe(1);
  });

  it('rejects one of two concurrent signups redeeming the same invitation token', async () => {
    const owner = await createUser(db, { email: 'owner4@x.com', passwordHash: await hashPassword('x'), name: 'Owner' });
    const workspace = await createWorkspace(db, 'W4');
    await addWorkspaceUser(db, { workspaceId: workspace.id, userId: owner.id, role: 'owner' });
    const invitation = await createInvitation(db, { workspaceId: workspace.id, email: 'shared@x.com', role: 'member', invitedByUserId: owner.id });

    const attempt = () => request(app).post('/auth/signup').send({
      email: 'shared@x.com', password: 'p4ssword!', name: 'Shared', invitationToken: invitation.token,
    });
    const [a, b] = await Promise.all([attempt(), attempt()]);
    const statuses = [a.status, b.status].sort((x, y) => x - y);
    expect(statuses).toEqual([201, 410]);
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

  it('expires the cookie instead of re-issuing the 30-day one, and repeats SameSite', async () => {
    const res = await request(app).post('/auth/logout');
    const header = res.headers['set-cookie']?.[0] ?? '';
    expect(header).not.toMatch(/Max-Age=2592000/);
    expect(header).toMatch(/Expires=Thu, 01 Jan 1970/);
    expect(header).toMatch(/SameSite=Lax/);
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
