import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import type express from 'express';
import type { DbClient } from '../db.js';
import { createTestDb } from '../test-support/test-db.js';
import { createApp } from '../app.js';

const SECRET = 'test-secret-at-least-16-chars';
let db: DbClient;
let app: express.Express;
type Agent = ReturnType<typeof request.agent>;

beforeEach(async () => {
  db = await createTestDb();
  app = createApp({ db, sessionSecret: SECRET });
});

async function bootstrapOperator() {
  const agent = request.agent(app);
  const res = await agent.post('/api/auth/signup').send({ email: 'operator@x.com', password: 'p4ssword!', name: 'Operator' });
  return { agent, userId: res.body.userId as string, defaultWorkspaceId: res.body.workspaceId as string };
}

async function joinAs(inviter: Agent, workspaceId: string, email: string, role: 'owner' | 'member') {
  const invite = await inviter.post(`/api/workspaces/${workspaceId}/invitations`).send({ email, role });
  const agent = request.agent(app);
  const res = await agent.post('/api/auth/signup').send({ email, password: 'p4ssword!', name: email, invitationToken: invite.body.token });
  return { agent, userId: res.body.userId as string };
}

/** The R-13 shape: the operator creates a customer workspace, hands it to the customer's admin, leaves. */
async function customerWorkspace(operator: Agent, operatorId: string) {
  const ws = await operator.post('/api/workspaces').send({ name: 'Customer A' });
  const admin = await joinAs(operator, ws.body.id, 'admin@x.com', 'owner');
  await operator.delete(`/api/workspaces/${ws.body.id}/members/${operatorId}`);
  return { workspaceId: ws.body.id as string, admin };
}

describe('operator-only access', () => {
  it('refuses every instance route to an account that is not an operator (403), and to no session (401)', async () => {
    const { agent: operator, defaultWorkspaceId } = await bootstrapOperator();
    const member = await joinAs(operator, defaultWorkspaceId, 'member@x.com', 'member');

    for (const [method, path] of [
      ['get', '/api/instance/workspaces'],
      ['get', '/api/instance/users'],
      ['patch', `/api/instance/users/${member.userId}`],
      ['post', `/api/instance/workspaces/${defaultWorkspaceId}/owners`],
    ] as const) {
      const res = await member.agent[method](path).send({});
      expect(res.status, `${method} ${path}`).toBe(403);
      expect((await request(app)[method](path).send({})).status, `${method} ${path} anonymous`).toBe(401);
    }
  });
});

describe('GET /instance/workspaces', () => {
  it('lists every workspace with its member count and owners — including ones the operator left', async () => {
    const { agent: operator, userId: operatorId } = await bootstrapOperator();
    const { workspaceId } = await customerWorkspace(operator, operatorId);

    const res = await operator.get('/api/instance/workspaces');
    expect(res.status).toBe(200);
    expect(res.body.workspaces).toEqual([
      expect.objectContaining({ name: 'Default', memberCount: 1, owners: [{ userId: operatorId, email: 'operator@x.com', name: 'Operator' }] }),
      expect.objectContaining({ id: workspaceId, name: 'Customer A', memberCount: 1, owners: [expect.objectContaining({ email: 'admin@x.com' })] }),
    ]);
    // Metadata only — not boards, connectors or anything inside the workspace.
    expect(Object.keys(res.body.workspaces[1]).sort()).toEqual(['createdAt', 'id', 'memberCount', 'name', 'owners']);
  });
});

describe('GET /instance/users', () => {
  it('lists every account with its instance role and how many workspaces it belongs to, never a password hash', async () => {
    const { agent: operator, userId: operatorId } = await bootstrapOperator();
    await customerWorkspace(operator, operatorId);

    const res = await operator.get('/api/instance/users');
    expect(res.status).toBe(200);
    expect(res.body.users).toEqual([
      { id: operatorId, email: 'operator@x.com', name: 'Operator', instanceRole: 'operator', createdAt: expect.any(String), workspaceCount: 1 },
      expect.objectContaining({ email: 'admin@x.com', instanceRole: 'user', workspaceCount: 1 }),
    ]);
    expect(JSON.stringify(res.body)).not.toMatch(/password/i);
  });
});

describe('PATCH /instance/users/:userId', () => {
  it('makes another account an operator, who can then create workspaces', async () => {
    const { agent: operator, userId: operatorId } = await bootstrapOperator();
    const { admin } = await customerWorkspace(operator, operatorId);

    const res = await operator.patch(`/api/instance/users/${admin.userId}`).send({ instanceRole: 'operator' });
    expect(res.status).toBe(204);
    expect((await admin.agent.post('/api/workspaces').send({ name: 'Own' })).status).toBe(201);
    const audit = await operator.get('/api/instance/audit');
    expect(audit.body.events).toContainEqual(
      expect.objectContaining({
        action: 'instance.role_changed',
        actor: { userId: operatorId, name: 'Operator' },
        subject: expect.objectContaining({ userId: admin.userId }),
        role: 'operator',
      })
    );
  });

  it('lets an operator step down once another operator exists', async () => {
    const { agent: operator, userId: operatorId } = await bootstrapOperator();
    const { admin } = await customerWorkspace(operator, operatorId);
    await operator.patch(`/api/instance/users/${admin.userId}`).send({ instanceRole: 'operator' });

    expect((await operator.patch(`/api/instance/users/${operatorId}`).send({ instanceRole: 'user' })).status).toBe(204);
    expect((await operator.get('/api/instance/users')).status).toBe(403);
  });

  it('refuses to leave the installation without an operator (409 LAST_OPERATOR)', async () => {
    const { agent: operator, userId: operatorId } = await bootstrapOperator();
    const res = await operator.patch(`/api/instance/users/${operatorId}`).send({ instanceRole: 'user' });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('LAST_OPERATOR');
  });

  it('rejects an unknown role with 400 and an unknown account with 404', async () => {
    const { agent: operator, userId: operatorId } = await bootstrapOperator();
    expect((await operator.patch(`/api/instance/users/${operatorId}`).send({ instanceRole: 'admin' })).status).toBe(400);
    expect((await operator.patch('/api/instance/users/nobody').send({ instanceRole: 'operator' })).status).toBe(404);
  });
});

describe('POST /instance/workspaces/:workspaceId/owners', () => {
  it('recovers a workspace whose owner is gone by making the operator its owner', async () => {
    const { agent: operator, userId: operatorId } = await bootstrapOperator();
    const { workspaceId, admin } = await customerWorkspace(operator, operatorId);
    expect((await operator.get(`/api/workspaces/${workspaceId}/members`)).status).toBe(403);

    const res = await operator.post(`/api/instance/workspaces/${workspaceId}/owners`).send({ userId: operatorId });
    expect(res.status).toBe(204);
    const members = await operator.get(`/api/workspaces/${workspaceId}/members`);
    expect(members.body.members).toContainEqual(expect.objectContaining({ userId: operatorId, role: 'owner' }));
    // The workspace's own owners see who let whom in — not only the operators.
    const restored = expect.objectContaining({
      action: 'workspace.owner_restored',
      actor: { userId: operatorId, name: 'Operator' },
      subject: expect.objectContaining({ userId: operatorId }),
    });
    expect((await admin.agent.get(`/api/workspaces/${workspaceId}/audit`)).body.events).toContainEqual(restored);
    expect((await operator.get('/api/instance/audit')).body.events).toContainEqual(restored);
  });

  it('promotes an existing member to owner rather than adding them twice', async () => {
    const { agent: operator, userId: operatorId } = await bootstrapOperator();
    const { workspaceId, admin } = await customerWorkspace(operator, operatorId);
    const staff = await joinAs(admin.agent, workspaceId, 'staff@x.com', 'member');

    await operator.post(`/api/instance/workspaces/${workspaceId}/owners`).send({ userId: staff.userId });
    const members = await admin.agent.get(`/api/workspaces/${workspaceId}/members`);
    expect(members.body.members.filter((m: { userId: string }) => m.userId === staff.userId)).toEqual([
      expect.objectContaining({ role: 'owner' }),
    ]);
  });

  it('answers 404 for an unknown workspace or account, and 400 without a userId', async () => {
    const { agent: operator, userId: operatorId, defaultWorkspaceId } = await bootstrapOperator();
    expect((await operator.post('/api/instance/workspaces/nowhere/owners').send({ userId: operatorId })).status).toBe(404);
    expect((await operator.post(`/api/instance/workspaces/${defaultWorkspaceId}/owners`).send({ userId: 'nobody' })).status).toBe(404);
    expect((await operator.post(`/api/instance/workspaces/${defaultWorkspaceId}/owners`).send({})).status).toBe(400);
  });
});
