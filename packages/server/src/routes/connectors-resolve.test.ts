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
let db: DbClient;
let app: express.Express;
let workspaceId: string;
let memberCookie: string;
let connectorId: string;

function cookieFor(userId: string, activeWorkspaceId: string) {
  return `${SESSION_COOKIE_NAME}=${signSession({ userId, activeWorkspaceId, issuedAt: Date.now() }, SECRET)}`;
}

function jsonResponse(body: unknown) {
  return { ok: true, status: 200, headers: { get: () => 'application/json' }, json: async () => body, text: async () => JSON.stringify(body) };
}

beforeEach(async () => {
  vi.stubGlobal('fetch', vi.fn());
  vi.restoreAllMocks();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  db = await createTestDb();
  app = createApp({ db, sessionSecret: SECRET });

  const member = await createUser(db, { email: 'member@x.com', passwordHash: 'h', name: 'Member' });
  const owner = await createUser(db, { email: 'owner@x.com', passwordHash: 'h', name: 'Owner' });
  const workspace = await createWorkspace(db, 'W1');
  await addWorkspaceUser(db, { workspaceId: workspace.id, userId: member.id, role: 'member' });
  await addWorkspaceUser(db, { workspaceId: workspace.id, userId: owner.id, role: 'owner' });
  workspaceId = workspace.id;
  memberCookie = cookieFor(member.id, workspace.id);
  const ownerCookie = cookieFor(owner.id, workspace.id);

  const create = await request(app)
    .post(`/workspaces/${workspaceId}/connectors`)
    .set('Cookie', ownerCookie)
    .send({ name: 'Plant API', baseUrl: 'https://plant.example.com', authType: 'bearer', authValue: 'secret-token' });
  connectorId = create.body.id;
});

describe('connector resolve proxy', () => {
  it('returns live quality and the extracted value on a successful JSON response', async () => {
    (fetch as any).mockResolvedValueOnce(jsonResponse({ data: { status: 'running' } }));
    const res = await request(app)
      .post(`/workspaces/${workspaceId}/connectors/${connectorId}/resolve`)
      .set('Cookie', memberCookie)
      .send({ ref: { path: '/pumps/a', valuePath: 'data.status' } });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ value: 'running', quality: 'live' });
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, options] = (fetch as any).mock.calls[0];
    expect(String(url)).toBe('https://plant.example.com/pumps/a');
    // No explicit method is set, so the proxied request is a GET by fetch's default.
    expect(options.method ?? 'GET').toBe('GET');
    expect(options.headers).toEqual({ Authorization: 'Bearer secret-token' });
    expect(options.redirect).toBe('manual');
  });

  it('returns disconnected quality on first failure with no cache', async () => {
    (fetch as any).mockRejectedValueOnce(new Error('network error'));
    const res = await request(app)
      .post(`/workspaces/${workspaceId}/connectors/${connectorId}/resolve`)
      .set('Cookie', memberCookie)
      .send({ ref: { path: '/pumps/a' } });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ value: undefined, quality: 'disconnected' });
  });

  it('returns stale quality with the last-known value on failure after a prior success', async () => {
    (fetch as any).mockResolvedValueOnce(jsonResponse({ status: 'running' }));
    await request(app)
      .post(`/workspaces/${workspaceId}/connectors/${connectorId}/resolve`)
      .set('Cookie', memberCookie)
      .send({ ref: { path: '/pumps/a', valuePath: 'status' } });

    (fetch as any).mockRejectedValueOnce(new Error('network error'));
    const res = await request(app)
      .post(`/workspaces/${workspaceId}/connectors/${connectorId}/resolve`)
      .set('Cookie', memberCookie)
      .send({ ref: { path: '/pumps/a', valuePath: 'status' } });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ value: 'running', quality: 'stale' });
  });

  it('returns disconnected when valuePath does not exist in a successful response', async () => {
    (fetch as any).mockResolvedValueOnce(jsonResponse({ value: [] }));
    const res = await request(app)
      .post(`/workspaces/${workspaceId}/connectors/${connectorId}/resolve`)
      .set('Cookie', memberCookie)
      .send({ ref: { path: '/assets', valuePath: 'value.0.Status' } });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ value: undefined, quality: 'disconnected' });
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('valuePath "value.0.Status" not found'));
  });

  it('serves the last value as stale when a previously resolvable valuePath stops resolving', async () => {
    (fetch as any).mockResolvedValueOnce(jsonResponse({ status: 'running' }));
    await request(app)
      .post(`/workspaces/${workspaceId}/connectors/${connectorId}/resolve`)
      .set('Cookie', memberCookie)
      .send({ ref: { path: '/pumps/a', valuePath: 'status' } });

    (fetch as any).mockResolvedValueOnce(jsonResponse({ state: 'running' }));
    const res = await request(app)
      .post(`/workspaces/${workspaceId}/connectors/${connectorId}/resolve`)
      .set('Cookie', memberCookie)
      .send({ ref: { path: '/pumps/a', valuePath: 'status' } });
    expect(res.body).toEqual({ value: 'running', quality: 'stale' });
  });

  it('keeps an explicit null at the end of valuePath as a live value', async () => {
    (fetch as any).mockResolvedValueOnce(jsonResponse({ value: [{ Temp: null }] }));
    const res = await request(app)
      .post(`/workspaces/${workspaceId}/connectors/${connectorId}/resolve`)
      .set('Cookie', memberCookie)
      .send({ ref: { path: '/assets', valuePath: 'value.0.Temp' } });
    expect(res.body).toEqual({ value: null, quality: 'live' });
  });

  it('returns disconnected when valuePath is given but the response is not JSON', async () => {
    (fetch as any).mockResolvedValueOnce({ ok: true, status: 200, headers: { get: () => 'text/plain' }, text: async () => 'running' });
    const res = await request(app)
      .post(`/workspaces/${workspaceId}/connectors/${connectorId}/resolve`)
      .set('Cookie', memberCookie)
      .send({ ref: { path: '/pumps/a', valuePath: 'status' } });
    expect(res.body).toEqual({ value: undefined, quality: 'disconnected' });
  });

  it('shares one upstream request among concurrent resolves of the same URL, each reading its own valuePath', async () => {
    let answer!: (response: unknown) => void;
    (fetch as any).mockReturnValueOnce(new Promise(resolve => { answer = resolve; }));
    const resolveAt = (valuePath: string) => request(app)
      .post(`/workspaces/${workspaceId}/connectors/${connectorId}/resolve`)
      .set('Cookie', memberCookie)
      .send({ ref: { path: '/assets', valuePath } })
      .then(res => res.body);

    const first = resolveAt('value.0.Status');
    const second = resolveAt('value.1.Status');
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    // Let the second request reach the server while the first upstream call is still open.
    await new Promise(r => setTimeout(r, 50));
    answer(jsonResponse({ value: [{ Status: 'Running' }, { Status: 'Fault' }] }));

    expect(await first).toEqual({ value: 'Running', quality: 'live' });
    expect(await second).toEqual({ value: 'Fault', quality: 'live' });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('fetches again for a resolve that starts after the previous one finished', async () => {
    (fetch as any)
      .mockResolvedValueOnce(jsonResponse({ status: 'running' }))
      .mockResolvedValueOnce(jsonResponse({ status: 'stopped' }));
    const resolveOnce = () => request(app)
      .post(`/workspaces/${workspaceId}/connectors/${connectorId}/resolve`)
      .set('Cookie', memberCookie)
      .send({ ref: { path: '/pumps/a', valuePath: 'status' } });
    expect((await resolveOnce()).body.value).toBe('running');
    expect((await resolveOnce()).body.value).toBe('stopped');
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('returns 404 for an unknown connectorId', async () => {
    const res = await request(app)
      .post(`/workspaces/${workspaceId}/connectors/nonexistent/resolve`)
      .set('Cookie', memberCookie)
      .send({ ref: { path: '/pumps/a' } });
    expect(res.status).toBe(404);
  });

  it('returns 400 INVALID_INPUT when ref.path is missing', async () => {
    const res = await request(app)
      .post(`/workspaces/${workspaceId}/connectors/${connectorId}/resolve`)
      .set('Cookie', memberCookie)
      .send({ ref: {} });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_INPUT');
  });

  describe('rejects a ref.path that could move the credentialed request off the connector origin', () => {
    // A workspace member is a lower-privileged principal than the owner who configured the
    // connector's secret. None of these may reach the network at all — the connector's
    // Authorization header would travel with the request.
    const cases: Array<[string, string]> = [
      ['userinfo injection that would make the path a new host', '@attacker.example/'],
      ['a path not anchored at the connector root', 'not-starting-with-slash'],
      ['a protocol-relative path', '//attacker.example/pumps'],
    ];

    for (const [label, path] of cases) {
      it(`rejects ${label}`, async () => {
        const res = await request(app)
          .post(`/workspaces/${workspaceId}/connectors/${connectorId}/resolve`)
          .set('Cookie', memberCookie)
          .send({ ref: { path } });
        expect(res.status).toBe(400);
        expect(res.body.code).toBe('INVALID_INPUT');
        expect(fetch).not.toHaveBeenCalled();
      });
    }
  });

  it('keeps a path-prefixed baseUrl intact and does not double the separator', async () => {
    const owner = await createUser(db, { email: 'owner2@x.com', passwordHash: 'h', name: 'Owner2' });
    await addWorkspaceUser(db, { workspaceId, userId: owner.id, role: 'owner' });
    const create = await request(app)
      .post(`/workspaces/${workspaceId}/connectors`)
      .set('Cookie', cookieFor(owner.id, workspaceId))
      .send({ name: 'Prefixed', baseUrl: 'https://plant.example.com/api/v2/', authType: 'none' });
    expect(create.status).toBe(201);

    (fetch as any).mockResolvedValueOnce(jsonResponse({ status: 'running' }));
    const res = await request(app)
      .post(`/workspaces/${workspaceId}/connectors/${create.body.id}/resolve`)
      .set('Cookie', memberCookie)
      .send({ ref: { path: '/pumps/a', valuePath: 'status' } });
    expect(res.status).toBe(200);
    expect(String((fetch as any).mock.calls[0][0])).toBe('https://plant.example.com/api/v2/pumps/a');
  });

  it('rejects a ref.path whose dot-segments resolve outside a path-prefixed baseUrl even though the origin stays the same', async () => {
    const owner = await createUser(db, { email: 'owner3@x.com', passwordHash: 'h', name: 'Owner3' });
    await addWorkspaceUser(db, { workspaceId, userId: owner.id, role: 'owner' });
    const create = await request(app)
      .post(`/workspaces/${workspaceId}/connectors`)
      .set('Cookie', cookieFor(owner.id, workspaceId))
      .send({ name: 'Prefixed2', baseUrl: 'https://plant.example.com/api/v2', authType: 'none' });
    expect(create.status).toBe(201);

    const res = await request(app)
      .post(`/workspaces/${workspaceId}/connectors/${create.body.id}/resolve`)
      .set('Cookie', memberCookie)
      .send({ ref: { path: '/../../admin' } });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_INPUT');
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('connector resolve proxy with an oauth2-client-credentials connector', () => {
  let oauthConnectorId: string;
  const TOKEN_URL = 'https://auth.example.com/token';

  function tokenResponse(accessToken: string) {
    return { ok: true, status: 200, json: async () => ({ access_token: accessToken, token_type: 'Bearer', expires_in: 3600 }) };
  }
  function resolve() {
    return request(app)
      .post(`/workspaces/${workspaceId}/connectors/${oauthConnectorId}/resolve`)
      .set('Cookie', memberCookie)
      .send({ ref: { path: '/assets/7', valuePath: 'status' } });
  }

  beforeEach(async () => {
    const owner = (await db.query<{ id: string }>(`SELECT id FROM users WHERE email = 'owner@x.com'`)).rows[0];
    const create = await request(app)
      .post(`/workspaces/${workspaceId}/connectors`)
      .set('Cookie', cookieFor(owner.id, workspaceId))
      .send({
        name: 'Platform', baseUrl: 'https://platform.example.com', authType: 'oauth2-client-credentials',
        oauthTokenUrl: TOKEN_URL, oauthClientId: 'board-reader', authValue: 'client-secret',
      });
    oauthConnectorId = create.body.id;
  });

  it('obtains a token and sends it as a Bearer credential, reusing it for the next resolve', async () => {
    (fetch as any)
      .mockResolvedValueOnce(tokenResponse('tok-1'))
      .mockResolvedValueOnce(jsonResponse({ status: 'running' }))
      .mockResolvedValueOnce(jsonResponse({ status: 'stopped' }));

    expect((await resolve()).body).toEqual({ value: 'running', quality: 'live' });
    expect((await resolve()).body).toEqual({ value: 'stopped', quality: 'live' });

    const calls = (fetch as any).mock.calls;
    expect(calls).toHaveLength(3);
    expect(calls[0][0]).toBe(TOKEN_URL);
    expect(String(calls[1][0])).toBe('https://platform.example.com/assets/7');
    expect(calls[1][1].headers).toEqual({ Authorization: 'Bearer tok-1' });
    expect(calls[2][1].headers).toEqual({ Authorization: 'Bearer tok-1' });
  });

  it('gets a fresh token and retries once when the data source rejects the token', async () => {
    (fetch as any)
      .mockResolvedValueOnce(tokenResponse('revoked'))
      .mockResolvedValueOnce({ ok: false, status: 401, headers: { get: () => null } })
      .mockResolvedValueOnce(tokenResponse('tok-2'))
      .mockResolvedValueOnce(jsonResponse({ status: 'running' }));

    expect((await resolve()).body).toEqual({ value: 'running', quality: 'live' });
    expect((fetch as any).mock.calls[3][1].headers).toEqual({ Authorization: 'Bearer tok-2' });
  });

  it('reports disconnected, not an error, when no token can be obtained', async () => {
    (fetch as any).mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({ error: 'invalid_client' }) });
    const res = await resolve();
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ value: undefined, quality: 'disconnected' });
    expect(fetch).toHaveBeenCalledTimes(1); // the data source is never called without a token
    expect((console.warn as any).mock.calls.map((c: unknown[]) => String(c[0]))).toEqual([
      `[resolve] connector ${oauthConnectorId} /assets/7: token failed: token endpoint responded 401 — no value to serve`,
    ]);
  });
});

describe('resolve failure logging', () => {
  function resolve(path = '/pumps/a') {
    return request(app)
      .post(`/workspaces/${workspaceId}/connectors/${connectorId}/resolve`)
      .set('Cookie', memberCookie)
      .send({ ref: { path, valuePath: 'status' } });
  }
  const warnings = () => (console.warn as any).mock.calls.map((c: unknown[]) => String(c[0]));

  it('logs a failure once when it starts, not on every repeated poll, and logs the recovery', async () => {
    (fetch as any)
      .mockResolvedValueOnce({ ok: false, status: 503, headers: { get: () => null } })
      .mockResolvedValueOnce({ ok: false, status: 503, headers: { get: () => null } })
      .mockResolvedValueOnce(jsonResponse({ status: 'running' }));
    await resolve();
    await resolve();
    await resolve();
    expect(warnings()).toEqual([
      `[resolve] connector ${connectorId} /pumps/a: request failed: upstream responded 503 — no value to serve`,
      `[resolve] connector ${connectorId} /pumps/a: recovered`,
    ]);
  });

  it('logs again when the reason changes, and says a stale value is being served', async () => {
    (fetch as any)
      .mockResolvedValueOnce(jsonResponse({ status: 'running' }))
      .mockResolvedValueOnce({ ok: false, status: 503, headers: { get: () => null } })
      .mockRejectedValueOnce(Object.assign(new Error('The operation was aborted due to timeout'), { name: 'TimeoutError' }));
    await resolve();
    await resolve();
    await resolve();
    expect(warnings()).toEqual([
      `[resolve] connector ${connectorId} /pumps/a: request failed: upstream responded 503 — serving the last value as stale`,
      `[resolve] connector ${connectorId} /pumps/a: request failed: timed out — serving the last value as stale`,
    ]);
  });

  it('names the network error code and never logs the credential', async () => {
    (fetch as any).mockRejectedValueOnce(new TypeError('fetch failed', { cause: { code: 'ECONNREFUSED' } }));
    await resolve();
    expect(warnings()).toEqual([
      `[resolve] connector ${connectorId} /pumps/a: request failed: fetch failed (ECONNREFUSED) — no value to serve`,
    ]);
    expect(warnings().join(' ')).not.toContain('secret-token');
  });
});
