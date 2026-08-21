import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import type Database from 'better-sqlite3';
import type express from 'express';
import { createDb } from '../db.js';
import { createApp } from '../app.js';
import { createUser } from '../db/users.js';
import { createWorkspace, addWorkspaceUser } from '../db/workspaces.js';
import { signSession } from '../auth/session.js';
import { SESSION_COOKIE_NAME } from '../middleware/require-auth.js';

const SECRET = 'test-secret-at-least-16-chars';
let db: Database.Database;
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
  db = createDb(':memory:');
  app = createApp({ db, sessionSecret: SECRET });

  const member = createUser(db, { email: 'member@x.com', passwordHash: 'h', name: 'Member' });
  const owner = createUser(db, { email: 'owner@x.com', passwordHash: 'h', name: 'Owner' });
  const workspace = createWorkspace(db, 'W1');
  addWorkspaceUser(db, { workspaceId: workspace.id, userId: member.id, role: 'member' });
  addWorkspaceUser(db, { workspaceId: workspace.id, userId: owner.id, role: 'owner' });
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
    expect(fetch).toHaveBeenCalledWith(
      'https://plant.example.com/pumps/a',
      expect.objectContaining({ headers: { Authorization: 'Bearer secret-token' } })
    );
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
});
