import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import type express from 'express';
import type { DbClient } from '../db.js';
import { createTestDb } from '../test-support/test-db.js';
import { createApp } from '../app.js';
import { purgeAuditEventsBefore } from '../db/audit.js';

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
  return { agent, userId: res.body.userId as string, workspaceId: res.body.workspaceId as string };
}

async function joinAs(inviter: Agent, workspaceId: string, email: string, name: string, role: 'owner' | 'member') {
  const invite = await inviter.post(`/api/workspaces/${workspaceId}/invitations`).send({ email, role });
  const agent = request.agent(app);
  const res = await agent.post('/api/auth/signup').send({ email, password: 'p4ssword!', name, invitationToken: invite.body.token });
  return { agent, userId: res.body.userId as string };
}

function actions(body: { events: Array<{ action: string }> }): string[] {
  return body.events.map(e => e.action);
}

describe('GET /workspaces/:workspaceId/audit', () => {
  it("records a workspace's membership history, newest first, with names joined from accounts", async () => {
    const { agent: owner, userId: ownerId, workspaceId } = await bootstrapOperator();
    const member = await joinAs(owner, workspaceId, 'kim@x.com', 'Kim', 'member');
    await owner.patch(`/api/workspaces/${workspaceId}/members/${member.userId}`).send({ role: 'owner' });
    await member.agent.delete(`/api/workspaces/${workspaceId}/members/${member.userId}`);

    const res = await owner.get(`/api/workspaces/${workspaceId}/audit`);
    expect(res.status).toBe(200);
    expect(actions(res.body)).toEqual([
      'member.left',
      'member.role_changed',
      'member.joined',
      'invitation.created',
      'workspace.created',
    ]);
    const [left, roleChanged, joined, invited] = res.body.events;
    expect(left.actor).toEqual({ userId: member.userId, name: 'Kim' });
    expect(roleChanged).toMatchObject({ actor: { userId: ownerId, name: 'Operator' }, subject: { userId: member.userId, name: 'Kim' }, role: 'owner' });
    expect(joined).toMatchObject({ actor: { userId: member.userId }, role: 'member', subject: null });
    expect(invited).toMatchObject({ actor: { userId: ownerId }, subject: { userId: null, email: 'kim@x.com' }, role: 'member' });
    expect(res.body.nextBefore).toBeNull();
  });

  it('records an invitation resent and revoked, and a member removed by an owner', async () => {
    const { agent: owner, workspaceId } = await bootstrapOperator();
    const invite = await owner.post(`/api/workspaces/${workspaceId}/invitations`).send({ email: 'lee@x.com', role: 'member' });
    const pending = (await owner.get(`/api/workspaces/${workspaceId}/invitations`)).body.invitations[0];
    expect(invite.status).toBe(201);
    await owner.post(`/api/workspaces/${workspaceId}/invitations/${pending.id}/resend`);
    await owner.delete(`/api/workspaces/${workspaceId}/invitations/${pending.id}`);
    const member = await joinAs(owner, workspaceId, 'park@x.com', 'Park', 'member');
    await owner.delete(`/api/workspaces/${workspaceId}/members/${member.userId}`);

    const events = (await owner.get(`/api/workspaces/${workspaceId}/audit`)).body.events;
    expect(events[0]).toMatchObject({ action: 'member.removed', subject: { userId: member.userId, name: 'Park' } });
    expect(actions({ events })).toContain('invitation.resent');
    expect(events.find((e: { action: string }) => e.action === 'invitation.revoked')).toMatchObject({ subject: { email: 'lee@x.com' } });
  });

  it('is for owners: a member gets 403', async () => {
    const { agent: owner, workspaceId } = await bootstrapOperator();
    const member = await joinAs(owner, workspaceId, 'kim@x.com', 'Kim', 'member');
    expect((await member.agent.get(`/api/workspaces/${workspaceId}/audit`)).status).toBe(403);
  });

  it('pages with limit and before, and rejects a malformed limit', async () => {
    const { agent: owner, workspaceId } = await bootstrapOperator();
    for (const email of ['a@x.com', 'b@x.com', 'c@x.com']) {
      await owner.post(`/api/workspaces/${workspaceId}/invitations`).send({ email, role: 'member' });
    }
    const first = await owner.get(`/api/workspaces/${workspaceId}/audit?limit=2`);
    expect(first.body.events).toHaveLength(2);
    expect(first.body.nextBefore).toEqual(expect.any(String));
    const rest = await owner.get(`/api/workspaces/${workspaceId}/audit`).query({ limit: 2, before: first.body.nextBefore });
    expect(rest.body.events).toHaveLength(2);
    expect(rest.body.nextBefore).toBeNull();
    const ids = [...first.body.events, ...rest.body.events].map((e: { id: string }) => e.id);
    expect(new Set(ids).size).toBe(4);

    for (const limit of ['0', '201', 'x']) {
      expect((await owner.get(`/api/workspaces/${workspaceId}/audit?limit=${limit}`)).status).toBe(400);
    }
  });
});

describe('GET /instance/audit', () => {
  it("shows the installation's own events, not a workspace's membership changes", async () => {
    const { agent: operator, userId: operatorId, workspaceId } = await bootstrapOperator();
    await operator.post('/api/workspaces').send({ name: 'Customer A' });
    await joinAs(operator, workspaceId, 'kim@x.com', 'Kim', 'member');

    const res = await operator.get('/api/instance/audit');
    expect(res.status).toBe(200);
    expect(actions(res.body)).toEqual(['workspace.created', 'workspace.created']);
    expect(res.body.events[0]).toMatchObject({ actor: { userId: operatorId }, workspace: { name: 'Customer A' } });
  });

  it('is for operators: anyone else gets 403', async () => {
    const { agent: operator, workspaceId } = await bootstrapOperator();
    const member = await joinAs(operator, workspaceId, 'kim@x.com', 'Kim', 'member');
    expect((await member.agent.get('/api/instance/audit')).status).toBe(403);
  });
});

describe('account deletion', () => {
  it('keeps what happened but no longer says who: name, id and invitation address are gone', async () => {
    const { agent: owner, workspaceId } = await bootstrapOperator();
    const member = await joinAs(owner, workspaceId, 'kim@x.com', 'Kim', 'member');
    expect((await member.agent.delete('/api/auth/me').send({ password: 'p4ssword!' })).status).toBe(204);

    const events = (await owner.get(`/api/workspaces/${workspaceId}/audit`)).body.events;
    const invited = events.find((e: { action: string }) => e.action === 'invitation.created');
    const joined = events.find((e: { action: string }) => e.action === 'member.joined');
    expect(invited.subject).toEqual({ userId: null, name: null, email: null });
    expect(joined.actor).toEqual({ userId: null, name: null });
    expect(JSON.stringify(events)).not.toContain('kim@x.com');
    expect(JSON.stringify(events)).not.toContain('Kim');

    const instance = (await owner.get('/api/instance/audit')).body.events;
    expect(instance[0]).toMatchObject({ action: 'account.deleted', actor: { userId: null, name: null } });
  });
});

describe('retention', () => {
  it('purges events recorded before the cutoff', async () => {
    const { agent: owner, workspaceId } = await bootstrapOperator();
    await owner.post(`/api/workspaces/${workspaceId}/invitations`).send({ email: 'a@x.com', role: 'member' });
    await db.query(`UPDATE audit_events SET occurred_at = '2020-01-01T00:00:00.000Z' WHERE action = 'workspace.created'`);

    expect(await purgeAuditEventsBefore(db, new Date('2021-01-01T00:00:00.000Z'))).toBe(1);
    expect(actions((await owner.get(`/api/workspaces/${workspaceId}/audit`)).body)).toEqual(['invitation.created']);
  });
});
