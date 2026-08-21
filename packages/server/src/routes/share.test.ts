import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import type Database from 'better-sqlite3';
import type express from 'express';
import { createDb } from '../db.js';
import { createApp } from '../app.js';
import { createUser } from '../db/users.js';
import { createWorkspace, addWorkspaceUser } from '../db/workspaces.js';
import { createBoard, updateBoard } from '../db/boards.js';
import { createConnector } from '../db/connectors.js';
import { signSession } from '../auth/session.js';
import { SESSION_COOKIE_NAME } from '../middleware/require-auth.js';

const SECRET = 'test-secret-at-least-16-chars';
let db: Database.Database;
let app: express.Express;
let workspaceId: string;
let boardId: string;
let ownerCookie: string;

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

  const owner = createUser(db, { email: 'owner@x.com', passwordHash: 'h', name: 'Owner' });
  const workspace = createWorkspace(db, 'W1');
  addWorkspaceUser(db, { workspaceId: workspace.id, userId: owner.id, role: 'owner' });
  workspaceId = workspace.id;
  ownerCookie = cookieFor(owner.id, workspace.id);
  boardId = createBoard(db, { workspaceId, name: 'Board A' }).id;
});

async function createShareToken(): Promise<string> {
  const res = await request(app)
    .post(`/workspaces/${workspaceId}/boards/${boardId}/share-tokens`)
    .set('Cookie', ownerCookie);
  return res.body.token;
}

describe('public share routes', () => {
  it('returns the board document and connectorIds for a valid token', async () => {
    const connector = createConnector(db, { workspaceId, name: 'Plant API', baseUrl: 'https://plant.example.com', authType: 'none' });
    const doc = {
      kind: 'canvas' as const, background: {},
      nodes: [{ id: 'n1', x: 0, y: 0, anchored: false, widget: { type: 'status', bindings: { value: { adapter: connector.id, ref: '/status' } } } }],
      connectors: [],
    };
    updateBoard(db, workspaceId, boardId, { document: doc });
    const token = await createShareToken();

    const res = await request(app).get(`/share/boards/${boardId}?token=${token}`);
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Board A');
    expect(res.body.document).toEqual(doc);
    expect(res.body.connectorIds).toEqual([connector.id]);
  });

  it('excludes referenced adapter ids that are not real stored connectors (e.g. demo-cmms)', async () => {
    const doc = {
      kind: 'canvas' as const, background: {},
      nodes: [{ id: 'n1', x: 0, y: 0, anchored: false, widget: { type: 'status', bindings: { value: { adapter: 'demo-cmms', ref: 'pump-a.state' } } } }],
      connectors: [],
    };
    updateBoard(db, workspaceId, boardId, { document: doc });
    const token = await createShareToken();

    const res = await request(app).get(`/share/boards/${boardId}?token=${token}`);
    expect(res.body.connectorIds).toEqual([]);
  });

  it('returns 404 for a missing, invalid, or wrong-board token', async () => {
    const token = await createShareToken();
    const otherBoardId = createBoard(db, { workspaceId, name: 'Board B' }).id;

    await expect(request(app).get(`/share/boards/${boardId}`)).resolves.toMatchObject({ status: 404 });
    await expect(request(app).get(`/share/boards/${boardId}?token=garbage`)).resolves.toMatchObject({ status: 404 });
    await expect(request(app).get(`/share/boards/${otherBoardId}?token=${token}`)).resolves.toMatchObject({ status: 404 });
  });

  it('updates lastUsedAt on a successful access', async () => {
    const token = await createShareToken();
    await request(app).get(`/share/boards/${boardId}?token=${token}`);
    const list = await request(app)
      .get(`/workspaces/${workspaceId}/boards/${boardId}/share-tokens`)
      .set('Cookie', ownerCookie);
    expect(list.body.tokens[0].lastUsedAt).toBeTruthy();
  });

  it('resolves a referenced connector and returns live quality', async () => {
    const connector = createConnector(db, { workspaceId, name: 'Plant API', baseUrl: 'https://plant.example.com', authType: 'none' });
    const doc = {
      kind: 'canvas' as const, background: {},
      nodes: [{ id: 'n1', x: 0, y: 0, anchored: false, widget: { type: 'status', bindings: { value: { adapter: connector.id, ref: '/status' } } } }],
      connectors: [],
    };
    updateBoard(db, workspaceId, boardId, { document: doc });
    const token = await createShareToken();
    (fetch as any).mockResolvedValueOnce(jsonResponse({ status: 'running' }));

    const res = await request(app)
      .post(`/share/boards/${boardId}/connectors/${connector.id}/resolve?token=${token}`)
      .send({ ref: { path: '/status', valuePath: 'status' } });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ value: 'running', quality: 'live' });
  });

  it('returns 404 resolving a connector the board document does not reference', async () => {
    const referenced = createConnector(db, { workspaceId, name: 'Referenced', baseUrl: 'https://a.example.com', authType: 'none' });
    const other = createConnector(db, { workspaceId, name: 'Other', baseUrl: 'https://b.example.com', authType: 'none' });
    const doc = {
      kind: 'canvas' as const, background: {},
      nodes: [{ id: 'n1', x: 0, y: 0, anchored: false, widget: { type: 'status', bindings: { value: { adapter: referenced.id, ref: '/status' } } } }],
      connectors: [],
    };
    updateBoard(db, workspaceId, boardId, { document: doc });
    const token = await createShareToken();

    const res = await request(app)
      .post(`/share/boards/${boardId}/connectors/${other.id}/resolve?token=${token}`)
      .send({ ref: { path: '/status' } });
    expect(res.status).toBe(404);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('returns 400 for a malformed ref', async () => {
    const connector = createConnector(db, { workspaceId, name: 'Plant API', baseUrl: 'https://plant.example.com', authType: 'none' });
    const doc = {
      kind: 'canvas' as const, background: {},
      nodes: [{ id: 'n1', x: 0, y: 0, anchored: false, widget: { type: 'status', bindings: { value: { adapter: connector.id, ref: '/status' } } } }],
      connectors: [],
    };
    updateBoard(db, workspaceId, boardId, { document: doc });
    const token = await createShareToken();

    const res = await request(app)
      .post(`/share/boards/${boardId}/connectors/${connector.id}/resolve?token=${token}`)
      .send({ ref: { path: '@attacker.example/' } });
    expect(res.status).toBe(400);
  });
});
