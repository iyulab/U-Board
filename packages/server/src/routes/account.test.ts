import { describe, it, expect, beforeEach, vi } from 'vitest';
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

  it('voids outstanding reset tokens', async () => {
    const sendPasswordResetEmail = vi.fn().mockResolvedValue(undefined);
    app = createApp({ db, sessionSecret: SECRET, sendPasswordResetEmail });
    const agent = await signedIn();
    await request(app).post('/api/auth/request-password-reset').send({ email: 'me@x.com' });
    const token = sendPasswordResetEmail.mock.calls[0][0].token;

    await agent.post('/api/auth/change-password').send({ currentPassword: 'old-p4ssword', newPassword: 'new-p4ssword' });
    expect((await request(app).post('/api/auth/reset-password').send({ token, newPassword: 'attacker-pass' })).status).toBe(410);
  });

  it('is limited separately from sign-in — other people signing in from the same address do not lock it', async () => {
    const agent = await signedIn();
    for (let i = 0; i < 9; i++) await request(app).post('/api/auth/login').send({ email: 'x@x.com', password: 'wrong-guess' });
    const res = await agent.post('/api/auth/change-password').send({ currentPassword: 'old-p4ssword', newPassword: 'new-p4ssword' });
    expect(res.status).toBe(204);
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

describe('DELETE /auth/me', () => {
  async function operatorWithMember() {
    const operator = request.agent(app);
    const op = await operator.post('/api/auth/signup').send({ email: 'op@x.com', password: 'op-p4ssword', name: 'Op' });
    const invite = await operator.post(`/api/workspaces/${op.body.workspaceId}/invitations`).send({ email: 'member@x.com', role: 'member' });
    const member = request.agent(app);
    await member.post('/api/auth/signup').send({ email: 'member@x.com', password: 'member-p4ss', name: 'Member', invitationToken: invite.body.token });
    return { operator, member, workspaceId: op.body.workspaceId as string };
  }

  it('deletes the account and its personal data, signing it out', async () => {
    const { operator, member, workspaceId } = await operatorWithMember();

    const res = await member.delete('/api/auth/me').send({ password: 'member-p4ss' });
    expect(res.status).toBe(204);
    expect(res.headers['set-cookie']?.[0]).toMatch(/^ub_session=;/);

    expect((await member.get('/api/auth/me')).status).toBe(401);
    expect((await request(app).post('/api/auth/login').send({ email: 'member@x.com', password: 'member-p4ss' })).status).toBe(401);
    const members = await operator.get(`/api/workspaces/${workspaceId}/members`);
    expect(members.body.members.map((m: { email: string }) => m.email)).toEqual(['op@x.com']);
    const users = await operator.get('/api/instance/users');
    expect(JSON.stringify(users.body)).not.toContain('member@x.com');
  });

  it('keeps the invitations and share links the account made — they belong to the workspace', async () => {
    const { operator, workspaceId } = await operatorWithMember();
    // A second operator so the first may leave; it invites someone and shares a board, then deletes itself.
    const second = request.agent(app);
    const invite = await operator.post(`/api/workspaces/${workspaceId}/invitations`).send({ email: 'second@x.com', role: 'owner' });
    await second.post('/api/auth/signup').send({ email: 'second@x.com', password: 'second-p4ss', name: 'Second', invitationToken: invite.body.token });
    const pending = await second.post(`/api/workspaces/${workspaceId}/invitations`).send({ email: 'later@x.com', role: 'member' });
    const board = await second.post(`/api/workspaces/${workspaceId}/boards`).send({ name: 'B', document: { kind: 'canvas', background: {}, nodes: [], connectors: [] } });
    const share = await second.post(`/api/workspaces/${workspaceId}/boards/${board.body.id}/share-tokens`).send({});

    expect((await second.delete('/api/auth/me').send({ password: 'second-p4ss' })).status).toBe(204);

    const peek = await request(app).get(`/api/invitations/${pending.body.token}`);
    expect(peek.status).toBe(200);
    expect(peek.body.inviterName).toBe('');
    const shared = await request(app).get(`/api/share/boards/${board.body.id}`).set('Authorization', `Bearer ${share.body.token}`);
    expect(shared.status).toBe(200);
  });

  it('also erases the invitations that were addressed to the person and accepted', async () => {
    const { member } = await operatorWithMember();
    await member.delete('/api/auth/me').send({ password: 'member-p4ss' });
    const { rows } = await db.query(`SELECT 1 FROM workspace_invitations WHERE email = 'member@x.com'`);
    expect(rows).toHaveLength(0);
  });

  it('refuses while the account is the only owner of a workspace (409 LAST_OWNER, naming it)', async () => {
    const { member } = await operatorWithMember();
    const operatorAgent = request.agent(app);
    await operatorAgent.post('/api/auth/login').send({ email: 'op@x.com', password: 'op-p4ssword' });
    // Make the member an operator too, so only the sole-owner rule applies to the operator below.
    const users = await operatorAgent.get('/api/instance/users');
    const memberId = users.body.users.find((u: { email: string }) => u.email === 'member@x.com').id;
    await operatorAgent.patch(`/api/instance/users/${memberId}`).send({ instanceRole: 'operator' });

    const res = await operatorAgent.delete('/api/auth/me').send({ password: 'op-p4ssword' });
    expect(res.status).toBe(409);
    expect(res.body).toEqual({ code: 'LAST_OWNER', workspaces: ['Default'] });
    expect((await member.get('/api/auth/me')).status).toBe(200);
  });

  it('refuses for the last operator (409 LAST_OPERATOR)', async () => {
    const operator = request.agent(app);
    const op = await operator.post('/api/auth/signup').send({ email: 'op@x.com', password: 'op-p4ssword', name: 'Op' });
    const invite = await operator.post(`/api/workspaces/${op.body.workspaceId}/invitations`).send({ email: 'co@x.com', role: 'owner' });
    await request(app).post('/api/auth/signup').send({ email: 'co@x.com', password: 'co-p4ssword', name: 'Co', invitationToken: invite.body.token });

    const res = await operator.delete('/api/auth/me').send({ password: 'op-p4ssword' });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('LAST_OPERATOR');
  });

  it('requires the current password (401 INVALID_CREDENTIALS) and a session (401)', async () => {
    const { member } = await operatorWithMember();
    const res = await member.delete('/api/auth/me').send({ password: 'wrong-guess' });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_CREDENTIALS');
    expect((await request(app).delete('/api/auth/me').send({ password: 'x' })).status).toBe(401);
  });
});
