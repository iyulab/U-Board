import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import type { DbClient } from '../db.js';
import type express from 'express';
import { createTestDb } from '../test-support/test-db.js';
import { createApp } from '../app.js';

const SECRET = 'test-secret-at-least-16-chars';
let db: DbClient;
let app: express.Express;

beforeEach(async () => {
  db = await createTestDb();
  app = createApp({ db, sessionSecret: SECRET });
});

async function bootstrapOwner() {
  const agent = request.agent(app);
  const res = await agent.post('/api/auth/signup').send({ email: 'owner@x.com', password: 'p4ssword!', name: 'Owner' });
  return { agent, workspaceId: res.body.workspaceId as string };
}

describe('GET /workspaces/me', () => {
  it('lists the workspaces the current session user belongs to', async () => {
    const { agent, workspaceId } = await bootstrapOwner();
    const res = await agent.get('/api/workspaces/me');
    expect(res.status).toBe(200);
    expect(res.body.workspaces).toHaveLength(1);
    expect(res.body.workspaces[0].id).toBe(workspaceId);
  });

  it('returns 401 when not authenticated', async () => {
    const res = await request(app).get('/api/workspaces/me');
    expect(res.status).toBe(401);
  });
});

describe('POST /workspaces', () => {
  it('creates a new workspace and makes the current user its owner', async () => {
    const { agent } = await bootstrapOwner();
    const res = await agent.post('/api/workspaces').send({ name: 'Second Site' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Second Site');
    expect(res.body.id).toBeTruthy();

    const membersRes = await agent.get(`/api/workspaces/${res.body.id}/members`);
    expect(membersRes.body.members).toEqual([{ userId: expect.any(String), email: 'owner@x.com', name: 'Owner', role: 'owner' }]);
  });

  it('activates the newly created workspace on the session', async () => {
    const { agent } = await bootstrapOwner();
    const res = await agent.post('/api/workspaces').send({ name: 'Second Site' });
    expect(res.headers['set-cookie']?.[0]).toMatch(/^ub_session=/);

    const meRes = await agent.get('/api/workspaces/me');
    expect(meRes.body.activeWorkspaceId).toBe(res.body.id);
  });

  it('keeps the user a member of their original workspace as well', async () => {
    const { agent, workspaceId } = await bootstrapOwner();
    const res = await agent.post('/api/workspaces').send({ name: 'Second Site' });

    const meRes = await agent.get('/api/workspaces/me');
    expect(meRes.body.workspaces.map((w: { id: string }) => w.id).sort()).toEqual([workspaceId, res.body.id].sort());
  });

  it('rejects an empty name with 400', async () => {
    const { agent } = await bootstrapOwner();
    const res = await agent.post('/api/workspaces').send({ name: '   ' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_INPUT');
  });

  it('returns 401 when not authenticated', async () => {
    const res = await request(app).post('/api/workspaces').send({ name: 'Second Site' });
    expect(res.status).toBe(401);
  });
});

describe('GET /workspaces/:id/members', () => {
  it('lists members for a workspace the user belongs to', async () => {
    const { agent, workspaceId } = await bootstrapOwner();
    const res = await agent.get(`/api/workspaces/${workspaceId}/members`);
    expect(res.status).toBe(200);
    expect(res.body.members).toEqual([{ userId: expect.any(String), email: 'owner@x.com', name: 'Owner', role: 'owner' }]);
  });

  it('returns 403 for a workspace the user does not belong to', async () => {
    const { agent } = await bootstrapOwner();
    const res = await agent.get('/api/workspaces/some-other-workspace/members');
    expect(res.status).toBe(403);
  });
});

describe('POST /workspaces/:id/invitations', () => {
  it('lets an owner create an invitation', async () => {
    const { agent, workspaceId } = await bootstrapOwner();
    const res = await agent.post(`/api/workspaces/${workspaceId}/invitations`).send({ email: 'new@x.com', role: 'member' });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
  });

  it('rejects re-inviting an existing member with 409, without minting a token', async () => {
    const { agent: ownerAgent, workspaceId } = await bootstrapOwner();
    const inviteRes = await ownerAgent.post(`/api/workspaces/${workspaceId}/invitations`).send({ email: 'member@x.com', role: 'member' });
    await request(app).post('/api/auth/signup').send({
      email: 'member@x.com', password: 'p4ssword!', name: 'Member', invitationToken: inviteRes.body.token,
    });
    const invitationsBefore = (await db.query<{ c: string }>('SELECT COUNT(*) AS c FROM workspace_invitations')).rows[0];

    const res = await ownerAgent.post(`/api/workspaces/${workspaceId}/invitations`).send({ email: 'member@x.com', role: 'member' });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('ALREADY_MEMBER');
    expect((await db.query<{ c: string }>('SELECT COUNT(*) AS c FROM workspace_invitations')).rows[0]).toEqual(invitationsBefore);
  });

  it('rejects an address that is not an email with 400, minting nothing', async () => {
    const { agent, workspaceId } = await bootstrapOwner();
    const res = await agent.post(`/api/workspaces/${workspaceId}/invitations`).send({ email: 'alice', role: 'member' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_INPUT');
    expect(Number((await db.query<{ c: string }>('SELECT COUNT(*) AS c FROM workspace_invitations')).rows[0].c)).toBe(0);
  });

  it('rejects re-inviting an existing member regardless of email casing', async () => {
    const { agent: ownerAgent, workspaceId } = await bootstrapOwner();
    const res = await ownerAgent.post(`/api/workspaces/${workspaceId}/invitations`).send({ email: 'OWNER@X.com', role: 'member' });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('ALREADY_MEMBER');
  });

  it('rejects a member trying to invite (403)', async () => {
    const { agent: ownerAgent, workspaceId } = await bootstrapOwner();
    const inviteRes = await ownerAgent.post(`/api/workspaces/${workspaceId}/invitations`).send({ email: 'member@x.com', role: 'member' });
    const memberAgent = request.agent(app);
    await memberAgent.post('/api/auth/signup').send({
      email: 'member@x.com', password: 'p4ssword!', name: 'Member', invitationToken: inviteRes.body.token,
    });
    const res = await memberAgent.post(`/api/workspaces/${workspaceId}/invitations`).send({ email: 'x@x.com', role: 'member' });
    expect(res.status).toBe(403);
  });
});

describe('POST /workspaces/:id/switch', () => {
  it('updates the session cookie to the new active workspace', async () => {
    const { agent, workspaceId } = await bootstrapOwner();
    const res = await agent.post(`/api/workspaces/${workspaceId}/switch`);
    expect(res.status).toBe(200);
    expect(res.headers['set-cookie']?.[0]).toMatch(/^ub_session=/);
  });
});

type Agent = ReturnType<typeof request.agent>;

async function joinAs(ownerAgent: Agent, workspaceId: string, email: string, role: 'owner' | 'member') {
  const inviteRes = await ownerAgent.post(`/api/workspaces/${workspaceId}/invitations`).send({ email, role });
  const agent = request.agent(app);
  const res = await agent.post('/api/auth/signup').send({ email, password: 'p4ssword!', name: email, invitationToken: inviteRes.body.token });
  return { agent, userId: res.body.userId as string };
}

async function userIdOf(agent: Agent) {
  return (await agent.get('/api/workspaces/me')).body.userId as string;
}

describe('DELETE /workspaces/:id/members/:userId', () => {
  it('lets an owner remove a member, who then loses access at once', async () => {
    const { agent: ownerAgent, workspaceId } = await bootstrapOwner();
    const member = await joinAs(ownerAgent, workspaceId, 'member@x.com', 'member');

    const res = await ownerAgent.delete(`/api/workspaces/${workspaceId}/members/${member.userId}`);
    expect(res.status).toBe(204);

    // The removed member's session is still valid, but every workspace route re-checks membership.
    expect((await member.agent.get(`/api/workspaces/${workspaceId}/boards`)).status).toBe(403);
    expect((await ownerAgent.get(`/api/workspaces/${workspaceId}/members`)).body.members).toHaveLength(1);
  });

  it('lets a member leave on their own', async () => {
    const { agent: ownerAgent, workspaceId } = await bootstrapOwner();
    const member = await joinAs(ownerAgent, workspaceId, 'member@x.com', 'member');
    expect((await member.agent.delete(`/api/workspaces/${workspaceId}/members/${member.userId}`)).status).toBe(204);
    expect((await member.agent.get(`/api/workspaces/${workspaceId}/members`)).status).toBe(403);
  });

  it('forbids a member from removing someone else', async () => {
    const { agent: ownerAgent, workspaceId } = await bootstrapOwner();
    const member = await joinAs(ownerAgent, workspaceId, 'member@x.com', 'member');
    const res = await member.agent.delete(`/api/workspaces/${workspaceId}/members/${await userIdOf(ownerAgent)}`);
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('refuses to let the last owner leave (409 LAST_OWNER)', async () => {
    const { agent, workspaceId } = await bootstrapOwner();
    const res = await agent.delete(`/api/workspaces/${workspaceId}/members/${await userIdOf(agent)}`);
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('LAST_OWNER');
  });

  it('lets an owner leave once another owner exists — handing a workspace over', async () => {
    const { agent: operator, workspaceId } = await bootstrapOwner();
    const customer = await joinAs(operator, workspaceId, 'customer-admin@x.com', 'owner');

    expect((await operator.delete(`/api/workspaces/${workspaceId}/members/${await userIdOf(operator)}`)).status).toBe(204);
    expect((await customer.agent.get(`/api/workspaces/${workspaceId}/members`)).body.members).toEqual([
      { userId: customer.userId, email: 'customer-admin@x.com', name: 'customer-admin@x.com', role: 'owner' },
    ]);
  });

  it('returns 404 for a user who is not a member', async () => {
    const { agent, workspaceId } = await bootstrapOwner();
    const res = await agent.delete(`/api/workspaces/${workspaceId}/members/nobody`);
    expect(res.status).toBe(404);
  });

  it('returns 403 to a signed-in user outside the workspace', async () => {
    const { agent: ownerAgent, workspaceId } = await bootstrapOwner();
    const other = await ownerAgent.post('/api/workspaces').send({ name: 'Other' });
    const outsider = await joinAs(ownerAgent, other.body.id, 'outsider@x.com', 'owner');
    const res = await outsider.agent.delete(`/api/workspaces/${workspaceId}/members/${await userIdOf(ownerAgent)}`);
    expect(res.status).toBe(403);
  });
});

describe('PATCH /workspaces/:id/members/:userId', () => {
  it('lets an owner promote and demote', async () => {
    const { agent: ownerAgent, workspaceId } = await bootstrapOwner();
    const member = await joinAs(ownerAgent, workspaceId, 'member@x.com', 'member');

    expect((await ownerAgent.patch(`/api/workspaces/${workspaceId}/members/${member.userId}`).send({ role: 'owner' })).status).toBe(204);
    expect(
      (await ownerAgent.patch(`/api/workspaces/${workspaceId}/members/${await userIdOf(ownerAgent)}`).send({ role: 'member' })).status
    ).toBe(204);

    const members = (await member.agent.get(`/api/workspaces/${workspaceId}/members`)).body.members as Array<{ email: string; role: string }>;
    expect(Object.fromEntries(members.map(m => [m.email, m.role]))).toEqual({ 'owner@x.com': 'member', 'member@x.com': 'owner' });
  });

  it('refuses to demote the last owner', async () => {
    const { agent, workspaceId } = await bootstrapOwner();
    const res = await agent.patch(`/api/workspaces/${workspaceId}/members/${await userIdOf(agent)}`).send({ role: 'member' });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('LAST_OWNER');
  });

  it('rejects an unknown role with 400', async () => {
    const { agent, workspaceId } = await bootstrapOwner();
    const res = await agent.patch(`/api/workspaces/${workspaceId}/members/${await userIdOf(agent)}`).send({ role: 'admin' });
    expect(res.status).toBe(400);
  });

  it('forbids a member from changing roles', async () => {
    const { agent: ownerAgent, workspaceId } = await bootstrapOwner();
    const member = await joinAs(ownerAgent, workspaceId, 'member@x.com', 'member');
    const res = await member.agent.patch(`/api/workspaces/${workspaceId}/members/${member.userId}`).send({ role: 'owner' });
    expect(res.status).toBe(403);
  });
});

describe('GET /workspaces/me after losing membership', () => {
  it('falls back to a workspace the user still belongs to', async () => {
    const { agent: ownerAgent, workspaceId } = await bootstrapOwner();
    const member = await joinAs(ownerAgent, workspaceId, 'member@x.com', 'member');
    const own = await member.agent.post('/api/workspaces').send({ name: 'Mine' });
    await member.agent.post(`/api/workspaces/${workspaceId}/switch`);

    await ownerAgent.delete(`/api/workspaces/${workspaceId}/members/${member.userId}`);

    const me = await member.agent.get('/api/workspaces/me');
    expect(me.body.activeWorkspaceId).toBe(own.body.id);
    expect(me.body.workspaces.map((w: { id: string }) => w.id)).toEqual([own.body.id]);
  });

  it('reports no active workspace when none remain', async () => {
    const { agent: ownerAgent, workspaceId } = await bootstrapOwner();
    const member = await joinAs(ownerAgent, workspaceId, 'member@x.com', 'member');
    await member.agent.delete(`/api/workspaces/${workspaceId}/members/${member.userId}`);

    const me = await member.agent.get('/api/workspaces/me');
    expect(me.status).toBe(200);
    expect(me.body).toMatchObject({ activeWorkspaceId: '', workspaces: [] });
  });
});

describe('workspace invitations: list and revoke', () => {
  it('lists pending invitations for an owner, without tokens', async () => {
    const { agent, workspaceId } = await bootstrapOwner();
    await agent.post(`/api/workspaces/${workspaceId}/invitations`).send({ email: 'new@x.com', role: 'owner' });

    const res = await agent.get(`/api/workspaces/${workspaceId}/invitations`);
    expect(res.status).toBe(200);
    expect(res.body.invitations).toEqual([
      { id: expect.any(String), workspaceId, email: 'new@x.com', role: 'owner', invitedByUserId: expect.any(String), expiresAt: expect.any(String) },
    ]);
  });

  it('revokes an invitation so its link no longer admits anyone', async () => {
    const { agent, workspaceId } = await bootstrapOwner();
    const invite = await agent.post(`/api/workspaces/${workspaceId}/invitations`).send({ email: 'new@x.com', role: 'member' });
    const [{ id }] = (await agent.get(`/api/workspaces/${workspaceId}/invitations`)).body.invitations;

    expect((await agent.delete(`/api/workspaces/${workspaceId}/invitations/${id}`)).status).toBe(204);
    expect((await agent.get(`/api/workspaces/${workspaceId}/invitations`)).body.invitations).toEqual([]);

    const signup = await request(app).post('/api/auth/signup').send({
      email: 'new@x.com', password: 'p4ssword!', name: 'New', invitationToken: invite.body.token,
    });
    expect(signup.status).toBe(410);
    expect((await agent.delete(`/api/workspaces/${workspaceId}/invitations/${id}`)).status).toBe(404);
  });

  it('forbids members from listing or revoking invitations', async () => {
    const { agent: ownerAgent, workspaceId } = await bootstrapOwner();
    const member = await joinAs(ownerAgent, workspaceId, 'member@x.com', 'member');
    expect((await member.agent.get(`/api/workspaces/${workspaceId}/invitations`)).status).toBe(403);
    expect((await member.agent.delete(`/api/workspaces/${workspaceId}/invitations/x`)).status).toBe(403);
  });
});

describe('POST /workspaces/:id/invitations — email delivery', () => {
  async function ownerOn(appUnderTest: express.Express) {
    const agent = request.agent(appUnderTest);
    const res = await agent.post('/api/auth/signup').send({ email: 'owner@x.com', password: 'p4ssword!', name: 'Owner' });
    return { agent, workspaceId: res.body.workspaceId as string };
  }

  it('emails the invitation link built on the configured public URL', async () => {
    const sendInvitationEmail = vi.fn().mockResolvedValue(undefined);
    const emailingApp = createApp({ db, sessionSecret: SECRET, publicUrl: 'https://board.example.com', sendInvitationEmail });
    const { agent, workspaceId } = await ownerOn(emailingApp);

    const res = await agent
      .post(`/api/workspaces/${workspaceId}/invitations`)
      .set('Host', 'attacker.example') // the link must not follow the request
      .send({ email: 'New@x.com', role: 'owner' });

    expect(res.status).toBe(201);
    expect(res.body.emailed).toBe(true);
    expect(sendInvitationEmail).toHaveBeenCalledWith({
      email: 'new@x.com',
      invitationId: expect.any(String),
      workspaceName: 'Default',
      inviterName: 'Owner',
      role: 'owner',
      link: `https://board.example.com/invite/${res.body.token}`,
      expiresAt: res.body.expiresAt,
    });
  });

  it('does not email without a public URL, even with a sender', async () => {
    const sendInvitationEmail = vi.fn();
    const { agent, workspaceId } = await ownerOn(createApp({ db, sessionSecret: SECRET, sendInvitationEmail }));

    const res = await agent.post(`/api/workspaces/${workspaceId}/invitations`).send({ email: 'new@x.com', role: 'member' });

    expect(res.body.emailed).toBe(false);
    expect(sendInvitationEmail).not.toHaveBeenCalled();
  });

  it('still creates the invitation when the email fails, reporting it as not emailed', async () => {
    const sendInvitationEmail = vi.fn().mockRejectedValue(new Error('provider down'));
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { agent, workspaceId } = await ownerOn(
      createApp({ db, sessionSecret: SECRET, publicUrl: 'https://board.example.com', sendInvitationEmail })
    );

    const res = await agent.post(`/api/workspaces/${workspaceId}/invitations`).send({ email: 'new@x.com', role: 'member' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ token: expect.any(String), emailed: false });
    expect(errorLog).toHaveBeenCalledWith('[workspaces] sendInvitationEmail failed:', expect.any(Error));
    errorLog.mockRestore();
  });
});
