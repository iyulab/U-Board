import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import type { DbClient } from '../db.js';
import type express from 'express';
import { createTestDb } from '../test-support/test-db.js';
import { createApp } from '../app.js';
import { createUser } from '../db/users.js';
import { createWorkspace, addWorkspaceUser } from '../db/workspaces.js';
import { createInvitation } from '../db/invitations.js';
import { hashPassword } from '../auth/password.js';

const SECRET = 'test-secret-at-least-16-chars';
let db: DbClient;
let app: express.Express;

beforeEach(async () => {
  db = await createTestDb();
  app = createApp({ db, sessionSecret: SECRET });
});

describe('GET /invitations/:token', () => {
  it('returns invitation details for a valid token, hasAccount=false for a new email', async () => {
    const owner = await createUser(db, { email: 'owner@x.com', passwordHash: await hashPassword('x'), name: 'Owner' });
    const workspace = await createWorkspace(db, 'W1');
    await addWorkspaceUser(db, { workspaceId: workspace.id, userId: owner.id, role: 'owner' });
    const invitation = await createInvitation(db, { workspaceId: workspace.id, email: 'new@x.com', role: 'member', invitedByUserId: owner.id });

    const res = await request(app).get(`/api/invitations/${invitation.token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ email: 'new@x.com', workspaceId: workspace.id, hasAccount: false });
  });

  it('returns 404 for an unknown token', async () => {
    const res = await request(app).get('/api/invitations/does-not-exist');
    expect(res.status).toBe(404);
  });
});

describe('POST /invitations/:token/accept', () => {
  it('joins the current session user to the invitation workspace', async () => {
    const owner = await createUser(db, { email: 'owner@x.com', passwordHash: await hashPassword('x'), name: 'Owner' });
    const workspace = await createWorkspace(db, 'W1');
    await addWorkspaceUser(db, { workspaceId: workspace.id, userId: owner.id, role: 'owner' });
    const invitation = await createInvitation(db, { workspaceId: workspace.id, email: 'existing@x.com', role: 'member', invitedByUserId: owner.id });

    const signupRes = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'existing@x.com', password: 'p4ssword!', name: 'Existing' }); // bootstrap already used by owner, so this needs its own invitation? no: this is the FIRST user overall in this test's db, so open signup is fine
    // (owner above was inserted directly via repository, not via /auth/signup, so countUsers()===0
    // is false already because of `owner` -> open signup for `existing` must fail; use login flow instead)
    expect(signupRes.status).toBe(403); // confirms guard from Task 10 still applies

    const cookie = request.agent(app);
    const passwordHash = await hashPassword('p4ssword!');
    await createUser(db, { email: 'existing@x.com', passwordHash, name: 'Existing' });
    const loginRes = await cookie.post('/api/auth/login').send({ email: 'existing@x.com', password: 'p4ssword!' });
    expect(loginRes.status).toBe(200);

    const acceptRes = await cookie.post(`/api/invitations/${invitation.token}/accept`);
    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.workspaceId).toBe(workspace.id);
  });

  it('returns 410 when the session user is not the invited email', async () => {
    const owner = await createUser(db, { email: 'owner@x.com', passwordHash: await hashPassword('x'), name: 'Owner' });
    const workspace = await createWorkspace(db, 'W1');
    await addWorkspaceUser(db, { workspaceId: workspace.id, userId: owner.id, role: 'owner' });
    // An owner-role invitation addressed to one person, redeemed by someone else who got the link.
    const invitation = await createInvitation(db, { workspaceId: workspace.id, email: 'invited@x.com', role: 'owner', invitedByUserId: owner.id });

    const passwordHash = await hashPassword('p4ssword!');
    await createUser(db, { email: 'someone-else@x.com', passwordHash, name: 'Someone Else' });
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ email: 'someone-else@x.com', password: 'p4ssword!' });

    const res = await agent.post(`/api/invitations/${invitation.token}/accept`);
    expect(res.status).toBe(410);
    expect(res.body.code).toBe('INVITATION_INVALID');
  });

  it('returns 401 when not authenticated', async () => {
    const owner = await createUser(db, { email: 'owner@x.com', passwordHash: await hashPassword('x'), name: 'Owner' });
    const workspace = await createWorkspace(db, 'W1');
    const invitation = await createInvitation(db, { workspaceId: workspace.id, email: 'x@x.com', role: 'member', invitedByUserId: owner.id });
    const res = await request(app).post(`/api/invitations/${invitation.token}/accept`);
    expect(res.status).toBe(401);
  });

  it('returns 410 for an already-accepted invitation', async () => {
    const owner = await createUser(db, { email: 'owner@x.com', passwordHash: await hashPassword('x'), name: 'Owner' });
    const workspace = await createWorkspace(db, 'W1');
    await addWorkspaceUser(db, { workspaceId: workspace.id, userId: owner.id, role: 'owner' });
    const invitation = await createInvitation(db, { workspaceId: workspace.id, email: 'x@x.com', role: 'member', invitedByUserId: owner.id });

    const cookie = request.agent(app);
    const passwordHash = await hashPassword('p4ssword!');
    await createUser(db, { email: 'x@x.com', passwordHash, name: 'X' });
    await cookie.post('/api/auth/login').send({ email: 'x@x.com', password: 'p4ssword!' });
    await cookie.post(`/api/invitations/${invitation.token}/accept`);

    const secondAttempt = await cookie.post(`/api/invitations/${invitation.token}/accept`);
    expect(secondAttempt.status).toBe(410);
  });

  it('admits once when the same invitation is accepted twice at the same time', async () => {
    const owner = await createUser(db, { email: 'owner@x.com', passwordHash: await hashPassword('x'), name: 'Owner' });
    const workspace = await createWorkspace(db, 'W1');
    await addWorkspaceUser(db, { workspaceId: workspace.id, userId: owner.id, role: 'owner' });
    const invitation = await createInvitation(db, { workspaceId: workspace.id, email: 'x@x.com', role: 'member', invitedByUserId: owner.id });
    await createUser(db, { email: 'x@x.com', passwordHash: await hashPassword('p4ssword!'), name: 'X' });
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ email: 'x@x.com', password: 'p4ssword!' });

    const statuses = (
      await Promise.all([agent.post(`/api/invitations/${invitation.token}/accept`), agent.post(`/api/invitations/${invitation.token}/accept`)])
    ).map(r => r.status);

    expect(statuses.sort()).toEqual([200, 410]);
  });

  it('lets someone who left rejoin through a new invitation', async () => {
    const ownerAgent = request.agent(app);
    const signup = await ownerAgent.post('/api/auth/signup').send({ email: 'owner@x.com', password: 'p4ssword!', name: 'Owner' });
    const workspaceId = signup.body.workspaceId as string;
    const first = await ownerAgent.post(`/api/workspaces/${workspaceId}/invitations`).send({ email: 'x@x.com', role: 'member' });
    const member = request.agent(app);
    const joined = await member.post('/api/auth/signup').send({ email: 'x@x.com', password: 'p4ssword!', name: 'X', invitationToken: first.body.token });
    await member.delete(`/api/workspaces/${workspaceId}/members/${joined.body.userId}`);

    const second = await ownerAgent.post(`/api/workspaces/${workspaceId}/invitations`).send({ email: 'x@x.com', role: 'member' });
    expect(second.status).toBe(201);
    expect((await member.post(`/api/invitations/${second.body.token}/accept`)).status).toBe(200);
    expect((await member.get(`/api/workspaces/${workspaceId}/members`)).status).toBe(200);
  });
});
