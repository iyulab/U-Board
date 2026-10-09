import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import type { DbClient } from '../db.js';
import type express from 'express';
import { createTestDb } from '../test-support/test-db.js';
import { createApp } from '../app.js';
import { createUser } from '../db/users.js';
import { createWorkspace, addWorkspaceUser } from '../db/workspaces.js';
import { signSession } from '../auth/session.js';
import { SESSION_COOKIE_NAME } from '../middleware/require-auth.js';

const SECRET = 'test-secret-at-least-16-chars';
const TOKEN_URL = 'https://login.example.com/oauth/token';
let db: DbClient;
let app: express.Express;
let workspaceId: string;
let ownerCookie: string;
let memberCookie: string;
let bearerConnectorId: string;

function cookieFor(userId: string, activeWorkspaceId: string) {
  return `${SESSION_COOKIE_NAME}=${signSession({ userId, activeWorkspaceId, issuedAt: Date.now() }, SECRET)}`;
}

function jsonResponse(body: unknown) {
  return { ok: true, status: 200, headers: { get: () => 'application/json' }, json: async () => body, text: async () => JSON.stringify(body) };
}

function tokenResponse(accessToken: string) {
  return { ok: true, status: 200, json: async () => ({ access_token: accessToken, token_type: 'Bearer', expires_in: 3600 }) };
}

const OAUTH_SETTINGS = {
  baseUrl: 'https://platform.example.com',
  authType: 'oauth2-client-credentials',
  oauthTokenUrl: TOKEN_URL,
  oauthClientId: 'board-reader',
  authValue: 'client-secret',
};

function test(body: Record<string, unknown>, cookie = ownerCookie) {
  return request(app).post(`/api/workspaces/${workspaceId}/connectors/test`).set('Cookie', cookie).send(body);
}

beforeEach(async () => {
  vi.stubGlobal('fetch', vi.fn());
  vi.restoreAllMocks();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  db = await createTestDb();
  app = createApp({ db, sessionSecret: SECRET });

  const owner = await createUser(db, { email: 'owner@x.com', passwordHash: 'h', name: 'Owner' });
  const member = await createUser(db, { email: 'member@x.com', passwordHash: 'h', name: 'Member' });
  const workspace = await createWorkspace(db, 'W1');
  await addWorkspaceUser(db, { workspaceId: workspace.id, userId: owner.id, role: 'owner' });
  await addWorkspaceUser(db, { workspaceId: workspace.id, userId: member.id, role: 'member' });
  workspaceId = workspace.id;
  ownerCookie = cookieFor(owner.id, workspace.id);
  memberCookie = cookieFor(member.id, workspace.id);

  const create = await request(app)
    .post(`/api/workspaces/${workspaceId}/connectors`)
    .set('Cookie', ownerCookie)
    .send({ name: 'Plant API', baseUrl: 'https://plant.example.com', authType: 'bearer', authValue: 'stored-token' });
  bearerConnectorId = create.body.id;
});

describe('POST /workspaces/:id/connectors/test', () => {
  it("obtains a new OAuth connector's token without a path, saving nothing", async () => {
    (fetch as any).mockResolvedValueOnce(tokenResponse('tok-1'));

    const res = await test(OAUTH_SETTINGS);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect((fetch as any).mock.calls.map((c: unknown[]) => c[0])).toEqual([TOKEN_URL]);
    const list = await request(app).get(`/api/workspaces/${workspaceId}/connectors`).set('Cookie', ownerCookie);
    expect(list.body.connectors).toHaveLength(1);
  });

  it('says a rejected client is an auth failure at the token stage, without echoing the secret', async () => {
    (fetch as any).mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({ error: 'invalid_client' }) });

    const res = await test({ ...OAUTH_SETTINGS, path: '/assets' });

    expect(res.body).toMatchObject({ ok: false, stage: 'token', reason: 'auth', status: 401 });
    expect(JSON.stringify(res.body)).not.toContain('client-secret');
    expect(fetch).toHaveBeenCalledTimes(1); // the data source is never called without a token
  });

  it('tries an edit of a saved connector with its stored secret when the form leaves it blank', async () => {
    (fetch as any).mockResolvedValueOnce(jsonResponse({ status: 'running' }));

    const res = await test({ connectorId: bearerConnectorId, baseUrl: 'https://plant-2.example.com', path: '/pumps/a' });

    expect(res.body).toMatchObject({ ok: true });
    const [url, options] = (fetch as any).mock.calls[0];
    expect(String(url)).toBe('https://plant-2.example.com/pumps/a');
    expect(options.headers).toEqual({ Authorization: 'Bearer stored-token' });
    // The saved connector is untouched.
    const list = await request(app).get(`/api/workspaces/${workspaceId}/connectors`).set('Cookie', ownerCookie);
    expect(list.body.connectors[0].baseUrl).toBe('https://plant.example.com');
  });

  it('says what the data source answered', async () => {
    (fetch as any).mockResolvedValueOnce({ ok: false, status: 404, headers: { get: () => null } });
    const res = await test({ connectorId: bearerConnectorId, path: '/nowhere' });
    expect(res.body).toMatchObject({ ok: false, stage: 'request', reason: 'address', status: 404 });
  });

  it('does not let a token the stored settings obtained vouch for the settings being tried', async () => {
    const oauth = await request(app)
      .post(`/api/workspaces/${workspaceId}/connectors`)
      .set('Cookie', ownerCookie)
      .send({ name: 'Platform', ...OAUTH_SETTINGS });
    (fetch as any)
      .mockResolvedValueOnce(tokenResponse('tok-stored'))
      .mockResolvedValueOnce(jsonResponse({ status: 'running' }))
      .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({ error: 'invalid_client' }) });
    await request(app)
      .post(`/api/workspaces/${workspaceId}/connectors/${oauth.body.id}/resolve`)
      .set('Cookie', memberCookie)
      .send({ ref: { path: '/assets/7' } });

    const res = await test({ connectorId: oauth.body.id, authType: 'oauth2-client-credentials', authValue: 'mistyped-secret' });

    expect(res.body).toMatchObject({ ok: false, stage: 'token', reason: 'auth' });
    expect((fetch as any).mock.calls[2][0]).toBe(TOKEN_URL);
  });

  it("leaves bindings' last-known values alone", async () => {
    (fetch as any)
      .mockResolvedValueOnce(jsonResponse({ status: 'running' }))
      .mockRejectedValueOnce(new Error('network error'));
    await test({ connectorId: bearerConnectorId, path: '/pumps/a' });

    const resolve = await request(app)
      .post(`/api/workspaces/${workspaceId}/connectors/${bearerConnectorId}/resolve`)
      .set('Cookie', memberCookie)
      .send({ ref: { path: '/pumps/a' } });

    expect(resolve.body).toEqual({ value: undefined, quality: 'disconnected', reason: 'transport' });
  });

  it('needs a path for anything but an OAuth token, and refuses one that leaves the connector', async () => {
    expect((await test({ connectorId: bearerConnectorId })).body).toEqual({ code: 'PATH_REQUIRED' });
    expect((await test({ connectorId: bearerConnectorId, path: '@attacker.example/' })).status).toBe(400);
    expect((await test({ connectorId: bearerConnectorId, path: '/../admin' })).status).toBe(200); // same origin, no prefix to escape
    expect((await test({ baseUrl: 'ftp://x', authType: 'none', path: '/a' })).status).toBe(400);
    expect((await test({ connectorId: 'nope', path: '/a' })).status).toBe(404);
  });

  it('is for owners: a member gets 403', async () => {
    expect((await test({ connectorId: bearerConnectorId, path: '/a' }, memberCookie)).status).toBe(403);
    expect(fetch).not.toHaveBeenCalled();
  });
});
