import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import type { DbClient } from '../db.js';
import type express from 'express';
import { createDb } from '../db.js';
import { createApp } from '../app.js';

const SECRET = 'test-secret-at-least-16-chars';
let db: DbClient;
let app: express.Express;

beforeEach(async () => {
  db = await createDb(':memory:');
  app = createApp({ db, sessionSecret: SECRET });
});

async function bootstrapOwner() {
  const agent = request.agent(app);
  const res = await agent.post('/auth/signup').send({ email: 'owner@x.com', password: 'p4ssword!', name: 'Owner' });
  return { agent, workspaceId: res.body.workspaceId as string };
}

describe('GET /workspaces/me', () => {
  it('lists the workspaces the current session user belongs to', async () => {
    const { agent, workspaceId } = await bootstrapOwner();
    const res = await agent.get('/workspaces/me');
    expect(res.status).toBe(200);
    expect(res.body.workspaces).toHaveLength(1);
    expect(res.body.workspaces[0].id).toBe(workspaceId);
  });

  it('returns 401 when not authenticated', async () => {
    const res = await request(app).get('/workspaces/me');
    expect(res.status).toBe(401);
  });
});

describe('POST /workspaces', () => {
  it('creates a new workspace and makes the current user its owner', async () => {
    const { agent } = await bootstrapOwner();
    const res = await agent.post('/workspaces').send({ name: 'Second Site' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Second Site');
    expect(res.body.id).toBeTruthy();

    const membersRes = await agent.get(`/workspaces/${res.body.id}/members`);
    expect(membersRes.body.members).toEqual([{ userId: expect.any(String), email: 'owner@x.com', name: 'Owner', role: 'owner' }]);
  });

  it('activates the newly created workspace on the session', async () => {
    const { agent } = await bootstrapOwner();
    const res = await agent.post('/workspaces').send({ name: 'Second Site' });
    expect(res.headers['set-cookie']?.[0]).toMatch(/^ub_session=/);

    const meRes = await agent.get('/workspaces/me');
    expect(meRes.body.activeWorkspaceId).toBe(res.body.id);
  });

  it('keeps the user a member of their original workspace as well', async () => {
    const { agent, workspaceId } = await bootstrapOwner();
    const res = await agent.post('/workspaces').send({ name: 'Second Site' });

    const meRes = await agent.get('/workspaces/me');
    expect(meRes.body.workspaces.map((w: { id: string }) => w.id).sort()).toEqual([workspaceId, res.body.id].sort());
  });

  it('rejects an empty name with 400', async () => {
    const { agent } = await bootstrapOwner();
    const res = await agent.post('/workspaces').send({ name: '   ' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_INPUT');
  });

  it('returns 401 when not authenticated', async () => {
    const res = await request(app).post('/workspaces').send({ name: 'Second Site' });
    expect(res.status).toBe(401);
  });
});

describe('GET /workspaces/:id/members', () => {
  it('lists members for a workspace the user belongs to', async () => {
    const { agent, workspaceId } = await bootstrapOwner();
    const res = await agent.get(`/workspaces/${workspaceId}/members`);
    expect(res.status).toBe(200);
    expect(res.body.members).toEqual([{ userId: expect.any(String), email: 'owner@x.com', name: 'Owner', role: 'owner' }]);
  });

  it('returns 403 for a workspace the user does not belong to', async () => {
    const { agent } = await bootstrapOwner();
    const res = await agent.get('/workspaces/some-other-workspace/members');
    expect(res.status).toBe(403);
  });
});

describe('POST /workspaces/:id/invitations', () => {
  it('lets an owner create an invitation', async () => {
    const { agent, workspaceId } = await bootstrapOwner();
    const res = await agent.post(`/workspaces/${workspaceId}/invitations`).send({ email: 'new@x.com', role: 'member' });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
  });

  it('rejects re-inviting an existing member with 409, without minting a token', async () => {
    const { agent: ownerAgent, workspaceId } = await bootstrapOwner();
    const inviteRes = await ownerAgent.post(`/workspaces/${workspaceId}/invitations`).send({ email: 'member@x.com', role: 'member' });
    await request(app).post('/auth/signup').send({
      email: 'member@x.com', password: 'p4ssword!', name: 'Member', invitationToken: inviteRes.body.token,
    });
    const invitationsBefore = (await db.query<{ c: string }>('SELECT COUNT(*) AS c FROM workspace_invitations')).rows[0];

    const res = await ownerAgent.post(`/workspaces/${workspaceId}/invitations`).send({ email: 'member@x.com', role: 'member' });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('ALREADY_MEMBER');
    expect((await db.query<{ c: string }>('SELECT COUNT(*) AS c FROM workspace_invitations')).rows[0]).toEqual(invitationsBefore);
  });

  it('rejects re-inviting an existing member regardless of email casing', async () => {
    const { agent: ownerAgent, workspaceId } = await bootstrapOwner();
    const res = await ownerAgent.post(`/workspaces/${workspaceId}/invitations`).send({ email: 'OWNER@X.com', role: 'member' });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('ALREADY_MEMBER');
  });

  it('rejects a member trying to invite (403)', async () => {
    const { agent: ownerAgent, workspaceId } = await bootstrapOwner();
    const inviteRes = await ownerAgent.post(`/workspaces/${workspaceId}/invitations`).send({ email: 'member@x.com', role: 'member' });
    const memberAgent = request.agent(app);
    await memberAgent.post('/auth/signup').send({
      email: 'member@x.com', password: 'p4ssword!', name: 'Member', invitationToken: inviteRes.body.token,
    });
    const res = await memberAgent.post(`/workspaces/${workspaceId}/invitations`).send({ email: 'x@x.com', role: 'member' });
    expect(res.status).toBe(403);
  });
});

describe('POST /workspaces/:id/switch', () => {
  it('updates the session cookie to the new active workspace', async () => {
    const { agent, workspaceId } = await bootstrapOwner();
    const res = await agent.post(`/workspaces/${workspaceId}/switch`);
    expect(res.status).toBe(200);
    expect(res.headers['set-cookie']?.[0]).toMatch(/^ub_session=/);
  });
});
