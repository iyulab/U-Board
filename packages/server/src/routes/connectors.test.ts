import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import type { DbClient } from '../db.js';
import type express from 'express';
import { createTestDb } from '../test-support/test-db.js';
import { createApp } from '../app.js';
import { createUser } from '../db/users.js';
import { createWorkspace, addWorkspaceUser } from '../db/workspaces.js';
import { signSession } from '../auth/session.js';
import { SESSION_COOKIE_NAME } from '../middleware/require-auth.js';
import { findConnector } from '../db/connectors.js';

const SECRET = 'test-secret-at-least-16-chars';
let db: DbClient;
let app: express.Express;
let workspaceId: string;
let ownerCookie: string;
let memberCookie: string;
let strangerCookie: string;

function cookieFor(userId: string, activeWorkspaceId: string) {
  return `${SESSION_COOKIE_NAME}=${signSession({ userId, activeWorkspaceId, issuedAt: Date.now() }, SECRET)}`;
}

beforeEach(async () => {
  db = await createTestDb();
  app = createApp({ db, sessionSecret: SECRET });

  const owner = await createUser(db, { email: 'owner@x.com', passwordHash: 'h', name: 'Owner' });
  const member = await createUser(db, { email: 'member@x.com', passwordHash: 'h', name: 'Member' });
  const stranger = await createUser(db, { email: 'stranger@x.com', passwordHash: 'h', name: 'Stranger' });
  const workspace = await createWorkspace(db, 'W1');
  await addWorkspaceUser(db, { workspaceId: workspace.id, userId: owner.id, role: 'owner' });
  await addWorkspaceUser(db, { workspaceId: workspace.id, userId: member.id, role: 'member' });
  workspaceId = workspace.id;
  ownerCookie = cookieFor(owner.id, workspace.id);
  memberCookie = cookieFor(member.id, workspace.id);
  strangerCookie = cookieFor(stranger.id, workspace.id);
});

describe('connectors CRUD routes', () => {
  it('rejects a non-member with 403 on list', async () => {
    const res = await request(app).get(`/api/workspaces/${workspaceId}/connectors`).set('Cookie', strangerCookie);
    expect(res.status).toBe(403);
  });

  it('rejects a member (non-owner) with 403 on create', async () => {
    const res = await request(app)
      .post(`/api/workspaces/${workspaceId}/connectors`)
      .set('Cookie', memberCookie)
      .send({ name: 'A', baseUrl: 'https://a.example.com', authType: 'none' });
    expect(res.status).toBe(403);
  });

  it('owner creates, member lists, owner updates and deletes', async () => {
    const create = await request(app)
      .post(`/api/workspaces/${workspaceId}/connectors`)
      .set('Cookie', ownerCookie)
      .send({ name: 'Plant API', baseUrl: 'https://plant.example.com', authType: 'header', authHeaderName: 'X-API-Key', authValue: 'secret' });
    expect(create.status).toBe(201);
    expect(create.body).toMatchObject({ name: 'Plant API', type: 'http', baseUrl: 'https://plant.example.com', authType: 'header', authHeaderName: 'X-API-Key' });
    expect(create.body).not.toHaveProperty('authValue');
    const connectorId = create.body.id;

    const list = await request(app).get(`/api/workspaces/${workspaceId}/connectors`).set('Cookie', memberCookie);
    expect(list.status).toBe(200);
    expect(list.body.connectors).toHaveLength(1);
    expect(list.body.connectors[0]).not.toHaveProperty('authValue');

    const update = await request(app)
      .put(`/api/workspaces/${workspaceId}/connectors/${connectorId}`)
      .set('Cookie', ownerCookie)
      .send({ name: 'Renamed' });
    expect(update.status).toBe(200);
    expect(update.body.name).toBe('Renamed');

    const del = await request(app).delete(`/api/workspaces/${workspaceId}/connectors/${connectorId}`).set('Cookie', ownerCookie);
    expect(del.status).toBe(204);

    const listAfterDelete = await request(app).get(`/api/workspaces/${workspaceId}/connectors`).set('Cookie', ownerCookie);
    expect(listAfterDelete.body.connectors).toEqual([]);
  });

  it('returns 400 INVALID_INPUT when name is blank', async () => {
    const res = await request(app)
      .post(`/api/workspaces/${workspaceId}/connectors`)
      .set('Cookie', ownerCookie)
      .send({ name: '  ', baseUrl: 'https://a.example.com', authType: 'none' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_INPUT');
  });

  it('returns 400 INVALID_INPUT when authType is header but authHeaderName is missing', async () => {
    const res = await request(app)
      .post(`/api/workspaces/${workspaceId}/connectors`)
      .set('Cookie', ownerCookie)
      .send({ name: 'A', baseUrl: 'https://a.example.com', authType: 'header', authValue: 'secret' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_INPUT');
  });

  it('returns 400 INVALID_INPUT when authType is bearer but authValue is missing', async () => {
    const res = await request(app)
      .post(`/api/workspaces/${workspaceId}/connectors`)
      .set('Cookie', ownerCookie)
      .send({ name: 'A', baseUrl: 'https://a.example.com', authType: 'bearer' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_INPUT');
  });

  it('returns 404 for a connector id that belongs to a different workspace', async () => {
    const create = await request(app)
      .post(`/api/workspaces/${workspaceId}/connectors`)
      .set('Cookie', ownerCookie)
      .send({ name: 'A', baseUrl: 'https://a.example.com', authType: 'none' });

    const otherWorkspace = await createWorkspace(db, 'Other');
    const otherOwner = await createUser(db, { email: 'other@x.com', passwordHash: 'h', name: 'Other' });
    await addWorkspaceUser(db, { workspaceId: otherWorkspace.id, userId: otherOwner.id, role: 'owner' });
    const otherCookie = cookieFor(otherOwner.id, otherWorkspace.id);

    const res = await request(app)
      .put(`/api/workspaces/${otherWorkspace.id}/connectors/${create.body.id}`)
      .set('Cookie', otherCookie)
      .send({ name: 'X' });
    expect(res.status).toBe(404);
  });

  it('clears authValue when authType changes to none', async () => {
    // Create connector with bearer auth
    const create = await request(app)
      .post(`/api/workspaces/${workspaceId}/connectors`)
      .set('Cookie', ownerCookie)
      .send({ name: 'API', baseUrl: 'https://api.example.com', authType: 'bearer', authValue: 'secret123' });
    expect(create.status).toBe(201);
    const connectorId = create.body.id;

    // Verify secret was stored (via database, since API doesn't expose it)
    let stored = await findConnector(db, workspaceId, connectorId);
    expect(stored?.authValue).toBe('secret123');

    // Update authType to 'none', clearing the secret
    const update = await request(app)
      .put(`/api/workspaces/${workspaceId}/connectors/${connectorId}`)
      .set('Cookie', ownerCookie)
      .send({ authType: 'none' });
    expect(update.status).toBe(200);
    expect(update.body.authType).toBe('none');

    // Verify secret was cleared in database
    stored = await findConnector(db, workspaceId, connectorId);
    expect(stored?.authValue).toBeUndefined();
  });

  it('clears authHeaderName when authType changes away from header', async () => {
    // Create connector with header auth
    const create = await request(app)
      .post(`/api/workspaces/${workspaceId}/connectors`)
      .set('Cookie', ownerCookie)
      .send({ name: 'API', baseUrl: 'https://api.example.com', authType: 'header', authHeaderName: 'X-API-Key', authValue: 'secret123' });
    expect(create.status).toBe(201);
    const connectorId = create.body.id;

    // Verify authHeaderName was stored
    let stored = await findConnector(db, workspaceId, connectorId);
    expect(stored?.authHeaderName).toBe('X-API-Key');

    // Update authType to 'bearer', clearing authHeaderName
    const update = await request(app)
      .put(`/api/workspaces/${workspaceId}/connectors/${connectorId}`)
      .set('Cookie', ownerCookie)
      .send({ authType: 'bearer', authValue: 'newtoken' });
    expect(update.status).toBe(200);
    expect(update.body.authType).toBe('bearer');
    expect(update.body.authHeaderName).toBeUndefined();

    // Verify authHeaderName was cleared in database
    stored = await findConnector(db, workspaceId, connectorId);
    expect(stored?.authHeaderName).toBeUndefined();
  });

  it('preserves auth fields when updating only name (partial update)', async () => {
    // Create connector with bearer auth
    const create = await request(app)
      .post(`/api/workspaces/${workspaceId}/connectors`)
      .set('Cookie', ownerCookie)
      .send({ name: 'API', baseUrl: 'https://api.example.com', authType: 'bearer', authValue: 'secret123' });
    expect(create.status).toBe(201);
    const connectorId = create.body.id;

    // Verify secret was stored
    let stored = await findConnector(db, workspaceId, connectorId);
    expect(stored?.authValue).toBe('secret123');

    // Update only name, without touching authType
    const update = await request(app)
      .put(`/api/workspaces/${workspaceId}/connectors/${connectorId}`)
      .set('Cookie', ownerCookie)
      .send({ name: 'Renamed API' });
    expect(update.status).toBe(200);
    expect(update.body.name).toBe('Renamed API');
    expect(update.body.authType).toBe('bearer');

    // Verify secret was NOT cleared (partial update preserved it)
    stored = await findConnector(db, workspaceId, connectorId);
    expect(stored?.authValue).toBe('secret123');
  });

  it('clears authHeaderName when switching to authType none (without providing authHeaderName in body)', async () => {
    // Create connector with header auth
    const create = await request(app)
      .post(`/api/workspaces/${workspaceId}/connectors`)
      .set('Cookie', ownerCookie)
      .send({ name: 'API', baseUrl: 'https://api.example.com', authType: 'header', authHeaderName: 'X-API-Key', authValue: 'secret123' });
    expect(create.status).toBe(201);
    const connectorId = create.body.id;

    // Verify authHeaderName was stored
    let stored = await findConnector(db, workspaceId, connectorId);
    expect(stored?.authHeaderName).toBe('X-API-Key');

    // Update to authType 'none' WITHOUT providing authHeaderName in the body
    // This tests the gap: authHeaderName should be cleared unconditionally, not only if body.authHeaderName is absent
    const update = await request(app)
      .put(`/api/workspaces/${workspaceId}/connectors/${connectorId}`)
      .set('Cookie', ownerCookie)
      .send({ authType: 'none' });
    expect(update.status).toBe(200);
    expect(update.body.authType).toBe('none');
    expect(update.body.authHeaderName).toBeUndefined();

    // Verify authHeaderName was cleared in database
    stored = await findConnector(db, workspaceId, connectorId);
    expect(stored?.authHeaderName).toBeUndefined();
  });

  async function createBearerConnector(authValue = 'secret-1') {
    const create = await request(app)
      .post(`/api/workspaces/${workspaceId}/connectors`)
      .set('Cookie', ownerCookie)
      .send({ name: 'API', baseUrl: 'https://api.example.com', authType: 'bearer', authValue });
    expect(create.status).toBe(201);
    return create.body.id as string;
  }

  it('renames a bearer connector without re-sending the secret (authType echoed, authValue omitted)', async () => {
    const connectorId = await createBearerConnector();
    expect((await findConnector(db, workspaceId, connectorId))?.authValue).toBe('secret-1');

    // The console's edit form leaves the secret field blank and omits authValue, but still sends
    // the (unchanged) authType — this must not be read as "set bearer auth with no secret".
    const update = await request(app)
      .put(`/api/workspaces/${workspaceId}/connectors/${connectorId}`)
      .set('Cookie', ownerCookie)
      .send({ name: 'Renamed', authType: 'bearer' });
    expect(update.status).toBe(200);
    expect(update.body.name).toBe('Renamed');
    expect(update.body.authType).toBe('bearer');
    expect((await findConnector(db, workspaceId, connectorId))?.authValue).toBe('secret-1');
  });

  it('renames a header-auth connector without re-sending the secret or the header name', async () => {
    const create = await request(app)
      .post(`/api/workspaces/${workspaceId}/connectors`)
      .set('Cookie', ownerCookie)
      .send({ name: 'Legacy', baseUrl: 'https://legacy.example.com', authType: 'header', authHeaderName: 'X-API-Key', authValue: 'secret-2' });
    expect(create.status).toBe(201);
    const connectorId = create.body.id;

    const update = await request(app)
      .put(`/api/workspaces/${workspaceId}/connectors/${connectorId}`)
      .set('Cookie', ownerCookie)
      .send({ name: 'Legacy Renamed', authType: 'header', authHeaderName: 'X-API-Key' });
    expect(update.status).toBe(200);
    expect(update.body.name).toBe('Legacy Renamed');
    const stored = await findConnector(db, workspaceId, connectorId);
    expect(stored?.authHeaderName).toBe('X-API-Key');
    expect(stored?.authValue).toBe('secret-2');
  });

  it('returns 400 when switching to bearer with no authValue and none stored', async () => {
    const create = await request(app)
      .post(`/api/workspaces/${workspaceId}/connectors`)
      .set('Cookie', ownerCookie)
      .send({ name: 'Open', baseUrl: 'https://open.example.com', authType: 'none' });
    expect(create.status).toBe(201);

    // There is genuinely no secret to fall back on — accepting this would leave the resolve proxy
    // sending a literal `Bearer undefined`.
    const update = await request(app)
      .put(`/api/workspaces/${workspaceId}/connectors/${create.body.id}`)
      .set('Cookie', ownerCookie)
      .send({ authType: 'bearer' });
    expect(update.status).toBe(400);
    expect(update.body.code).toBe('INVALID_INPUT');
    expect((await findConnector(db, workspaceId, create.body.id))?.authType).toBe('none');
  });

  it('returns 400 when switching to header auth with no authHeaderName and none stored', async () => {
    const connectorId = await createBearerConnector();

    // The stored secret satisfies authValue, but a bearer connector has no header name to keep.
    const update = await request(app)
      .put(`/api/workspaces/${workspaceId}/connectors/${connectorId}`)
      .set('Cookie', ownerCookie)
      .send({ authType: 'header' });
    expect(update.status).toBe(400);
    expect(update.body.code).toBe('INVALID_INPUT');
  });

  it('returns 400 when an explicitly supplied authValue is blank, even with a secret stored', async () => {
    const connectorId = await createBearerConnector();

    const update = await request(app)
      .put(`/api/workspaces/${workspaceId}/connectors/${connectorId}`)
      .set('Cookie', ownerCookie)
      .send({ authType: 'bearer', authValue: '   ' });
    expect(update.status).toBe(400);
    expect(update.body.code).toBe('INVALID_INPUT');
    expect((await findConnector(db, workspaceId, connectorId))?.authValue).toBe('secret-1');
  });

  it('returns 400 INVALID_INPUT when baseUrl is not an absolute http(s) URL on create', async () => {
    for (const baseUrl of ['not a url', '/relative/path', 'file:///etc/passwd']) {
      const res = await request(app)
        .post(`/api/workspaces/${workspaceId}/connectors`)
        .set('Cookie', ownerCookie)
        .send({ name: 'A', baseUrl, authType: 'none' });
      expect(res.status, `baseUrl ${baseUrl}`).toBe(400);
      expect(res.body.code).toBe('INVALID_INPUT');
    }
  });

  it('returns 400 INVALID_INPUT when baseUrl is not an absolute http(s) URL on update', async () => {
    const connectorId = await createBearerConnector();

    const res = await request(app)
      .put(`/api/workspaces/${workspaceId}/connectors/${connectorId}`)
      .set('Cookie', ownerCookie)
      .send({ baseUrl: 'not a url' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_INPUT');
    expect((await findConnector(db, workspaceId, connectorId))?.baseUrl).toBe('https://api.example.com');
  });
});

describe('oauth2-client-credentials connectors', () => {
  const OAUTH_BODY = {
    name: 'Platform API', baseUrl: 'https://platform.example.com/api', authType: 'oauth2-client-credentials',
    oauthTokenUrl: 'https://auth.example.com/token', oauthClientId: 'board-reader', authValue: 'client-secret',
  };

  function create(body: Record<string, unknown> = OAUTH_BODY) {
    return request(app).post(`/api/workspaces/${workspaceId}/connectors`).set('Cookie', ownerCookie).send(body);
  }
  function update(id: string, body: Record<string, unknown>) {
    return request(app).put(`/api/workspaces/${workspaceId}/connectors/${id}`).set('Cookie', ownerCookie).send(body);
  }

  it('creates one with HTTP Basic client authentication by default and never returns the secret', async () => {
    const res = await create({ ...OAUTH_BODY, oauthScope: '  asset.read  ' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      authType: 'oauth2-client-credentials', oauthTokenUrl: 'https://auth.example.com/token',
      oauthClientId: 'board-reader', oauthScope: 'asset.read', oauthClientAuth: 'basic',
    });
    expect(res.body).not.toHaveProperty('authValue');
    const list = await request(app).get(`/api/workspaces/${workspaceId}/connectors`).set('Cookie', memberCookie);
    expect(list.body.connectors[0]).toMatchObject({ oauthClientId: 'board-reader', oauthClientAuth: 'basic' });
    expect(list.body.connectors[0]).not.toHaveProperty('authValue');
    expect((await findConnector(db, workspaceId, res.body.id))?.authValue).toBe('client-secret');
  });

  it.each([
    ['no token URL', { oauthTokenUrl: undefined }],
    ['a token URL that is not absolute http(s)', { oauthTokenUrl: 'ftp://auth.example.com/token' }],
    ['no client id', { oauthClientId: undefined }],
    ['no client secret', { authValue: undefined }],
    ['an unknown client authentication method', { oauthClientAuth: 'private_key_jwt' }],
  ])('rejects creation with %s', async (_label, override) => {
    const res = await create({ ...OAUTH_BODY, ...override });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_INPUT');
  });

  it('renames one without re-sending the client id or secret', async () => {
    const { body: created } = await create();
    const res = await update(created.id, { name: 'Renamed', authType: 'oauth2-client-credentials' });
    expect(res.status).toBe(200);
    const stored = await findConnector(db, workspaceId, created.id);
    expect(stored).toMatchObject({ name: 'Renamed', oauthClientId: 'board-reader', authValue: 'client-secret' });
  });

  it('does not reuse a bearer token as the client secret when switching to OAuth', async () => {
    const { body: created } = await create({ name: 'A', baseUrl: 'https://a.example.com', authType: 'bearer', authValue: 'bearer-token' });
    const res = await update(created.id, {
      authType: 'oauth2-client-credentials', oauthTokenUrl: 'https://auth.example.com/token', oauthClientId: 'c',
    });
    expect(res.status).toBe(400);
  });

  it('clears the OAuth settings when switching to bearer', async () => {
    const { body: created } = await create();
    const res = await update(created.id, { authType: 'bearer', authValue: 'new-token' });
    expect(res.status).toBe(200);
    expect(res.body).not.toHaveProperty('oauthTokenUrl');
    const stored = await findConnector(db, workspaceId, created.id);
    expect(stored).toMatchObject({ authType: 'bearer', authValue: 'new-token', oauthTokenUrl: undefined, oauthClientId: undefined });
  });
});
