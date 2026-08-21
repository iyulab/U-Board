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

    // Exact body equality (not toMatchObject's partial match) so a future branch that adds an
    // extra field to one 404 body — e.g. {code:'NOT_FOUND', reason:'wrong-board'} — would fail
    // this test instead of silently passing, since that would defeat the "identical body shape
    // across all four failure modes" property this test exists to pin.
    const noToken = await request(app).get(`/share/boards/${boardId}`);
    expect(noToken.status).toBe(404);
    expect(noToken.body).toEqual({ code: 'NOT_FOUND' });

    const garbageToken = await request(app).get(`/share/boards/${boardId}?token=garbage`);
    expect(garbageToken.status).toBe(404);
    expect(garbageToken.body).toEqual({ code: 'NOT_FOUND' });

    const wrongBoardToken = await request(app).get(`/share/boards/${otherBoardId}?token=${token}`);
    expect(wrongBoardToken.status).toBe(404);
    expect(wrongBoardToken.body).toEqual({ code: 'NOT_FOUND' });
  });

  it('returns 404 for a missing or garbage token on the resolve route', async () => {
    const connector = createConnector(db, { workspaceId, name: 'Plant API', baseUrl: 'https://plant.example.com', authType: 'none' });
    const doc = {
      kind: 'canvas' as const, background: {},
      nodes: [{ id: 'n1', x: 0, y: 0, anchored: false, widget: { type: 'status', bindings: { value: { adapter: connector.id, ref: '/status' } } } }],
      connectors: [],
    };
    updateBoard(db, workspaceId, boardId, { document: doc });

    const noToken = await request(app)
      .post(`/share/boards/${boardId}/connectors/${connector.id}/resolve`)
      .send({ ref: { path: '/status' } });
    expect(noToken.status).toBe(404);
    expect(noToken.body).toEqual({ code: 'NOT_FOUND' });

    const garbageToken = await request(app)
      .post(`/share/boards/${boardId}/connectors/${connector.id}/resolve?token=garbage`)
      .send({ ref: { path: '/status' } });
    expect(garbageToken.status).toBe(404);
    expect(garbageToken.body).toEqual({ code: 'NOT_FOUND' });

    expect(fetch).not.toHaveBeenCalled();
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
    // The document's binding.ref must be the exact `{path, valuePath?}` shape the resolve
    // endpoint expects — that's what `HttpConnectorAdapter.resolve` forwards unmodified
    // (packages/console/src/http-connector-adapter.ts), and what `isDeclaredBinding` compares
    // against by value.
    const doc = {
      kind: 'canvas' as const, background: {},
      nodes: [{ id: 'n1', x: 0, y: 0, anchored: false, widget: { type: 'status', bindings: { value: { adapter: connector.id, ref: { path: '/status', valuePath: 'status' } } } } }],
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
    expect(res.body).toEqual({ code: 'NOT_FOUND' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('returns 404 resolving a connector the document uses, with a ref it does not declare', async () => {
    const connector = createConnector(db, { workspaceId, name: 'Plant API', baseUrl: 'https://plant.example.com', authType: 'none' });
    // Declares one specific ref (`/status`) for this connector. The resolve request below sends
    // a *differently-shaped but still individually valid* ref (`/other-metric`) for the SAME
    // connector, so a pass here would only be possible if the gate checks exact ref equality —
    // not just that the connector id is referenced somewhere in the document.
    const doc = {
      kind: 'canvas' as const, background: {},
      nodes: [{ id: 'n1', x: 0, y: 0, anchored: false, widget: { type: 'status', bindings: { value: { adapter: connector.id, ref: { path: '/status', valuePath: 'status' } } } } }],
      connectors: [],
    };
    updateBoard(db, workspaceId, boardId, { document: doc });
    const token = await createShareToken();

    // Same connector as the document's own binding, but a ref the document never declared — the
    // gate must check the exact (connectorId, ref) pair, not just connector membership, or a
    // share link would grant free-form access to the connector's whole origin.
    const res = await request(app)
      .post(`/share/boards/${boardId}/connectors/${connector.id}/resolve?token=${token}`)
      .send({ ref: { path: '/other-metric' } });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ code: 'NOT_FOUND' });
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
