import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import type Database from 'better-sqlite3';
import type express from 'express';
import { createDb } from '../db.js';
import { createApp } from '../app.js';
import { createUser } from '../db/users.js';
import { createWorkspace, addWorkspaceUser } from '../db/workspaces.js';
import { signSession } from '../auth/session.js';
import { SESSION_COOKIE_NAME } from '../middleware/require-auth.js';
import { findConnector } from '../db/connectors.js';

const SECRET = 'test-secret-at-least-16-chars';
let db: Database.Database;
let app: express.Express;
let workspaceId: string;
let ownerCookie: string;
let memberCookie: string;
let strangerCookie: string;

function cookieFor(userId: string, activeWorkspaceId: string) {
  return `${SESSION_COOKIE_NAME}=${signSession({ userId, activeWorkspaceId, issuedAt: Date.now() }, SECRET)}`;
}

beforeEach(() => {
  db = createDb(':memory:');
  app = createApp({ db, sessionSecret: SECRET });

  const owner = createUser(db, { email: 'owner@x.com', passwordHash: 'h', name: 'Owner' });
  const member = createUser(db, { email: 'member@x.com', passwordHash: 'h', name: 'Member' });
  const stranger = createUser(db, { email: 'stranger@x.com', passwordHash: 'h', name: 'Stranger' });
  const workspace = createWorkspace(db, 'W1');
  addWorkspaceUser(db, { workspaceId: workspace.id, userId: owner.id, role: 'owner' });
  addWorkspaceUser(db, { workspaceId: workspace.id, userId: member.id, role: 'member' });
  workspaceId = workspace.id;
  ownerCookie = cookieFor(owner.id, workspace.id);
  memberCookie = cookieFor(member.id, workspace.id);
  strangerCookie = cookieFor(stranger.id, workspace.id);
});

describe('connectors CRUD routes', () => {
  it('rejects a non-member with 403 on list', async () => {
    const res = await request(app).get(`/workspaces/${workspaceId}/connectors`).set('Cookie', strangerCookie);
    expect(res.status).toBe(403);
  });

  it('rejects a member (non-owner) with 403 on create', async () => {
    const res = await request(app)
      .post(`/workspaces/${workspaceId}/connectors`)
      .set('Cookie', memberCookie)
      .send({ name: 'A', baseUrl: 'https://a.example.com', authType: 'none' });
    expect(res.status).toBe(403);
  });

  it('owner creates, member lists, owner updates and deletes', async () => {
    const create = await request(app)
      .post(`/workspaces/${workspaceId}/connectors`)
      .set('Cookie', ownerCookie)
      .send({ name: 'Plant API', baseUrl: 'https://plant.example.com', authType: 'header', authHeaderName: 'X-API-Key', authValue: 'secret' });
    expect(create.status).toBe(201);
    expect(create.body).toMatchObject({ name: 'Plant API', type: 'http', baseUrl: 'https://plant.example.com', authType: 'header', authHeaderName: 'X-API-Key' });
    expect(create.body).not.toHaveProperty('authValue');
    const connectorId = create.body.id;

    const list = await request(app).get(`/workspaces/${workspaceId}/connectors`).set('Cookie', memberCookie);
    expect(list.status).toBe(200);
    expect(list.body.connectors).toHaveLength(1);
    expect(list.body.connectors[0]).not.toHaveProperty('authValue');

    const update = await request(app)
      .put(`/workspaces/${workspaceId}/connectors/${connectorId}`)
      .set('Cookie', ownerCookie)
      .send({ name: 'Renamed' });
    expect(update.status).toBe(200);
    expect(update.body.name).toBe('Renamed');

    const del = await request(app).delete(`/workspaces/${workspaceId}/connectors/${connectorId}`).set('Cookie', ownerCookie);
    expect(del.status).toBe(204);

    const listAfterDelete = await request(app).get(`/workspaces/${workspaceId}/connectors`).set('Cookie', ownerCookie);
    expect(listAfterDelete.body.connectors).toEqual([]);
  });

  it('returns 400 INVALID_INPUT when name is blank', async () => {
    const res = await request(app)
      .post(`/workspaces/${workspaceId}/connectors`)
      .set('Cookie', ownerCookie)
      .send({ name: '  ', baseUrl: 'https://a.example.com', authType: 'none' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_INPUT');
  });

  it('returns 400 INVALID_INPUT when authType is header but authHeaderName is missing', async () => {
    const res = await request(app)
      .post(`/workspaces/${workspaceId}/connectors`)
      .set('Cookie', ownerCookie)
      .send({ name: 'A', baseUrl: 'https://a.example.com', authType: 'header', authValue: 'secret' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_INPUT');
  });

  it('returns 400 INVALID_INPUT when authType is bearer but authValue is missing', async () => {
    const res = await request(app)
      .post(`/workspaces/${workspaceId}/connectors`)
      .set('Cookie', ownerCookie)
      .send({ name: 'A', baseUrl: 'https://a.example.com', authType: 'bearer' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_INPUT');
  });

  it('returns 404 for a connector id that belongs to a different workspace', async () => {
    const create = await request(app)
      .post(`/workspaces/${workspaceId}/connectors`)
      .set('Cookie', ownerCookie)
      .send({ name: 'A', baseUrl: 'https://a.example.com', authType: 'none' });

    const otherWorkspace = createWorkspace(db, 'Other');
    const otherOwner = createUser(db, { email: 'other@x.com', passwordHash: 'h', name: 'Other' });
    addWorkspaceUser(db, { workspaceId: otherWorkspace.id, userId: otherOwner.id, role: 'owner' });
    const otherCookie = cookieFor(otherOwner.id, otherWorkspace.id);

    const res = await request(app)
      .put(`/workspaces/${otherWorkspace.id}/connectors/${create.body.id}`)
      .set('Cookie', otherCookie)
      .send({ name: 'X' });
    expect(res.status).toBe(404);
  });

  it('clears authValue when authType changes to none', async () => {
    // Create connector with bearer auth
    const create = await request(app)
      .post(`/workspaces/${workspaceId}/connectors`)
      .set('Cookie', ownerCookie)
      .send({ name: 'API', baseUrl: 'https://api.example.com', authType: 'bearer', authValue: 'secret123' });
    expect(create.status).toBe(201);
    const connectorId = create.body.id;

    // Verify secret was stored (via database, since API doesn't expose it)
    let stored = findConnector(db, workspaceId, connectorId);
    expect(stored?.authValue).toBe('secret123');

    // Update authType to 'none', clearing the secret
    const update = await request(app)
      .put(`/workspaces/${workspaceId}/connectors/${connectorId}`)
      .set('Cookie', ownerCookie)
      .send({ authType: 'none' });
    expect(update.status).toBe(200);
    expect(update.body.authType).toBe('none');

    // Verify secret was cleared in database
    stored = findConnector(db, workspaceId, connectorId);
    expect(stored?.authValue).toBeUndefined();
  });

  it('clears authHeaderName when authType changes away from header', async () => {
    // Create connector with header auth
    const create = await request(app)
      .post(`/workspaces/${workspaceId}/connectors`)
      .set('Cookie', ownerCookie)
      .send({ name: 'API', baseUrl: 'https://api.example.com', authType: 'header', authHeaderName: 'X-API-Key', authValue: 'secret123' });
    expect(create.status).toBe(201);
    const connectorId = create.body.id;

    // Verify authHeaderName was stored
    let stored = findConnector(db, workspaceId, connectorId);
    expect(stored?.authHeaderName).toBe('X-API-Key');

    // Update authType to 'bearer', clearing authHeaderName
    const update = await request(app)
      .put(`/workspaces/${workspaceId}/connectors/${connectorId}`)
      .set('Cookie', ownerCookie)
      .send({ authType: 'bearer', authValue: 'newtoken' });
    expect(update.status).toBe(200);
    expect(update.body.authType).toBe('bearer');
    expect(update.body.authHeaderName).toBeUndefined();

    // Verify authHeaderName was cleared in database
    stored = findConnector(db, workspaceId, connectorId);
    expect(stored?.authHeaderName).toBeUndefined();
  });

  it('preserves auth fields when updating only name (partial update)', async () => {
    // Create connector with bearer auth
    const create = await request(app)
      .post(`/workspaces/${workspaceId}/connectors`)
      .set('Cookie', ownerCookie)
      .send({ name: 'API', baseUrl: 'https://api.example.com', authType: 'bearer', authValue: 'secret123' });
    expect(create.status).toBe(201);
    const connectorId = create.body.id;

    // Verify secret was stored
    let stored = findConnector(db, workspaceId, connectorId);
    expect(stored?.authValue).toBe('secret123');

    // Update only name, without touching authType
    const update = await request(app)
      .put(`/workspaces/${workspaceId}/connectors/${connectorId}`)
      .set('Cookie', ownerCookie)
      .send({ name: 'Renamed API' });
    expect(update.status).toBe(200);
    expect(update.body.name).toBe('Renamed API');
    expect(update.body.authType).toBe('bearer');

    // Verify secret was NOT cleared (partial update preserved it)
    stored = findConnector(db, workspaceId, connectorId);
    expect(stored?.authValue).toBe('secret123');
  });

  it('clears authHeaderName when switching to authType none (without providing authHeaderName in body)', async () => {
    // Create connector with header auth
    const create = await request(app)
      .post(`/workspaces/${workspaceId}/connectors`)
      .set('Cookie', ownerCookie)
      .send({ name: 'API', baseUrl: 'https://api.example.com', authType: 'header', authHeaderName: 'X-API-Key', authValue: 'secret123' });
    expect(create.status).toBe(201);
    const connectorId = create.body.id;

    // Verify authHeaderName was stored
    let stored = findConnector(db, workspaceId, connectorId);
    expect(stored?.authHeaderName).toBe('X-API-Key');

    // Update to authType 'none' WITHOUT providing authHeaderName in the body
    // This tests the gap: authHeaderName should be cleared unconditionally, not only if body.authHeaderName is absent
    const update = await request(app)
      .put(`/workspaces/${workspaceId}/connectors/${connectorId}`)
      .set('Cookie', ownerCookie)
      .send({ authType: 'none' });
    expect(update.status).toBe(200);
    expect(update.body.authType).toBe('none');
    expect(update.body.authHeaderName).toBeUndefined();

    // Verify authHeaderName was cleared in database
    stored = findConnector(db, workspaceId, connectorId);
    expect(stored?.authHeaderName).toBeUndefined();
  });
});
