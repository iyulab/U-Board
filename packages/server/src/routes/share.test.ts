import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import type { DbClient } from '../db.js';
import type express from 'express';
import { createTestDb } from '../test-support/test-db.js';
import { createApp } from '../app.js';
import { createUser } from '../db/users.js';
import { createWorkspace, addWorkspaceUser } from '../db/workspaces.js';
import { createBoard, updateBoard } from '../db/boards.js';
import { createConnector } from '../db/connectors.js';
import { signSession } from '../auth/session.js';
import { SESSION_COOKIE_NAME } from '../middleware/require-auth.js';

const SECRET = 'test-secret-at-least-16-chars';
let db: DbClient;
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
  db = await createTestDb();
  app = createApp({ db, sessionSecret: SECRET });

  const owner = await createUser(db, { email: 'owner@x.com', passwordHash: 'h', name: 'Owner' });
  const workspace = await createWorkspace(db, 'W1');
  await addWorkspaceUser(db, { workspaceId: workspace.id, userId: owner.id, role: 'owner' });
  workspaceId = workspace.id;
  ownerCookie = cookieFor(owner.id, workspace.id);
  boardId = (await createBoard(db, { workspaceId, name: 'Board A' })).id;
});

async function createShareToken(): Promise<string> {
  const res = await request(app)
    .post(`/workspaces/${workspaceId}/boards/${boardId}/share-tokens`)
    .set('Cookie', ownerCookie);
  return res.body.token;
}

describe('public share routes', () => {
  it('returns the board document and connectorIds for a valid token', async () => {
    const connector = await createConnector(db, { workspaceId, name: 'Plant API', baseUrl: 'https://plant.example.com', authType: 'none' });
    const doc = {
      kind: 'canvas' as const, background: {},
      nodes: [{ id: 'n1', x: 0, y: 0, anchored: false, widget: { type: 'status', bindings: { value: { adapter: connector.id, ref: '/status' } } } }],
      connectors: [],
    };
    await updateBoard(db, workspaceId, boardId, { document: doc });
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
    await updateBoard(db, workspaceId, boardId, { document: doc });
    const token = await createShareToken();

    const res = await request(app).get(`/share/boards/${boardId}?token=${token}`);
    expect(res.body.connectorIds).toEqual([]);
  });

  it('returns 404 for a missing, invalid, or wrong-board token', async () => {
    const token = await createShareToken();
    const otherBoardId = (await createBoard(db, { workspaceId, name: 'Board B' })).id;

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

  it('updates lastUsedAt on a successful access', async () => {
    const token = await createShareToken();
    await request(app).get(`/share/boards/${boardId}?token=${token}`);
    const list = await request(app)
      .get(`/workspaces/${workspaceId}/boards/${boardId}/share-tokens`)
      .set('Cookie', ownerCookie);
    expect(list.body.tokens[0].lastUsedAt).toBeTruthy();
  });

  it('resolves every declared binding of a board in one batch request, in request order', async () => {
    const a = await createConnector(db, { workspaceId, name: 'A', baseUrl: 'https://a.example.com', authType: 'none' });
    const b = await createConnector(db, { workspaceId, name: 'B', baseUrl: 'https://b.example.com', authType: 'none' });
    const doc = {
      kind: 'canvas' as const, background: {},
      nodes: [
        { id: 'n1', x: 0, y: 0, anchored: false, widget: { type: 'status', bindings: { value: { adapter: a.id, ref: { path: '/assets', valuePath: 'value.0.Status' } } } } },
        { id: 'n2', x: 0, y: 0, anchored: false, widget: { type: 'status', bindings: { value: { adapter: a.id, ref: { path: '/assets', valuePath: 'value.1.Status' } } } } },
        { id: 'n3', x: 0, y: 0, anchored: false, widget: { type: 'status', bindings: { value: { adapter: b.id, ref: { path: '/pump', valuePath: 'on' } } } } },
      ],
      connectors: [],
    };
    await updateBoard(db, workspaceId, boardId, { document: doc });
    const token = await createShareToken();
    (fetch as any).mockImplementation(async (url: URL) => new URL(String(url)).hostname === 'a.example.com'
      ? jsonResponse({ value: [{ Status: 'Running' }, { Status: 'Fault' }] })
      : jsonResponse({ on: true }));

    const res = await request(app)
      .post(`/share/boards/${boardId}/resolve?token=${token}`)
      .send({ bindings: [
        { connectorId: b.id, ref: { path: '/pump', valuePath: 'on' } },
        { connectorId: a.id, ref: { path: '/assets', valuePath: 'value.1.Status' } },
        { connectorId: a.id, ref: { path: '/assets', valuePath: 'value.0.Status' } },
      ] });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ results: [
      { value: true, quality: 'live', observedAt: expect.any(String) },
      { value: 'Fault', quality: 'live', observedAt: expect.any(String) },
      { value: 'Running', quality: 'live', observedAt: expect.any(String) },
    ] });
    // The two bindings on one URL share a single upstream request.
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('answers disconnected for a batch entry the document does not declare, without calling its upstream', async () => {
    const connector = await createConnector(db, { workspaceId, name: 'Plant API', baseUrl: 'https://plant.example.com', authType: 'none' });
    const unreferenced = await createConnector(db, { workspaceId, name: 'Other', baseUrl: 'https://other.example.com', authType: 'none' });
    const doc = {
      kind: 'canvas' as const, background: {},
      nodes: [{ id: 'n1', x: 0, y: 0, anchored: false, widget: { type: 'status', bindings: { value: { adapter: connector.id, ref: { path: '/status', valuePath: 'status' } } } } }],
      connectors: [],
    };
    await updateBoard(db, workspaceId, boardId, { document: doc });
    const token = await createShareToken();
    (fetch as any).mockResolvedValueOnce(jsonResponse({ status: 'running' }));

    const res = await request(app)
      .post(`/share/boards/${boardId}/resolve?token=${token}`)
      .send({ bindings: [
        { connectorId: connector.id, ref: { path: '/status', valuePath: 'status' } },
        // The connector this board uses, with a ref it never declared: the gate compares the exact
        // (connectorId, ref) pair, or a share link would open the connector's whole origin.
        { connectorId: connector.id, ref: { path: '/other-metric' } },
        // A real connector of this workspace that the board does not reference.
        { connectorId: unreferenced.id, ref: { path: '/status', valuePath: 'status' } },
        { connectorId: 'missing', ref: { path: '/status' } },
        // Not a valid ref at all.
        { connectorId: connector.id, ref: { path: '@attacker.example/' } },
      ] });
    expect(res.status).toBe(200);
    expect(res.body.results).toEqual([
      { value: 'running', quality: 'live', observedAt: expect.any(String) },
      { quality: 'disconnected' },
      { quality: 'disconnected' },
      { quality: 'disconnected' },
      { quality: 'disconnected' },
    ]);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('rejects a batch request without a valid token, a bindings array, or within the size cap', async () => {
    const token = await createShareToken();
    expect((await request(app).post(`/share/boards/${boardId}/resolve`).send({ bindings: [] })).status).toBe(404);
    expect((await request(app).post(`/share/boards/${boardId}/resolve?token=wrong`).send({ bindings: [] })).status).toBe(404);
    expect((await request(app).post(`/share/boards/${boardId}/resolve?token=${token}`).send({})).status).toBe(400);
    expect((await request(app).post(`/share/boards/${boardId}/resolve?token=${token}`).send({ bindings: ['x'] })).status).toBe(400);
    const tooMany = Array.from({ length: 501 }, () => ({ connectorId: 'c', ref: { path: '/a' } }));
    expect((await request(app).post(`/share/boards/${boardId}/resolve?token=${token}`).send({ bindings: tooMany })).status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('resolves a binding using the exact (connectorId, ref) round-tripped through save -> DB -> share GET -> batch resolve', async () => {
    // Unlike the other tests in this file, the document here is saved through the real
    // PUT /workspaces/:id/boards/:id route (not the updateBoard() DB helper directly), and the
    // ref used against the resolve route is read back out of the share GET response rather than
    // the literal object above — so both sides of isDeclaredBinding's comparison actually pass
    // through JSON.stringify -> database storage -> JSON.parse -> HTTP response -> HTTP request,
    // the same path the embed viewer takes, instead of sharing one in-memory object by reference.
    const connector = await createConnector(db, { workspaceId, name: 'Plant API', baseUrl: 'https://plant.example.com', authType: 'none' });
    const doc = {
      kind: 'canvas' as const, background: {},
      nodes: [{ id: 'n1', x: 0, y: 0, anchored: false, widget: { type: 'status', bindings: { value: { adapter: connector.id, ref: { path: '/status', valuePath: 'status' } } } } }],
      connectors: [],
    };

    const saveRes = await request(app)
      .put(`/workspaces/${workspaceId}/boards/${boardId}`)
      .set('Cookie', ownerCookie)
      .send({ document: doc });
    expect(saveRes.status).toBe(200);

    const token = await createShareToken();
    const getRes = await request(app).get(`/share/boards/${boardId}?token=${token}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.connectorIds).toEqual([connector.id]);

    const binding = getRes.body.document.nodes[0].widget.bindings.value;
    expect(binding).toEqual({ adapter: connector.id, ref: { path: '/status', valuePath: 'status' } });

    (fetch as any).mockResolvedValueOnce(jsonResponse({ status: 'running' }));
    const resolveRes = await request(app)
      .post(`/share/boards/${boardId}/resolve?token=${token}`)
      .send({ bindings: [{ connectorId: binding.adapter, ref: binding.ref }] });
    expect(resolveRes.status).toBe(200);
    expect(resolveRes.body).toEqual({ results: [{ value: 'running', quality: 'live', observedAt: expect.any(String) }] });
  });
});
