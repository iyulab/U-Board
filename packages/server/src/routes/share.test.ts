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
import type { Board } from '@iyulab/u-board/domain';
import { bindingsIn, type ViewDocument } from '@iyulab/u-board/picture';

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
  boardId = (await createBoard(db, { actorUserId: 'test-actor', workspaceId, name: 'Board A' })).id;
});

/** The reads a board's picture declares, as a share link sees it: each binding's connector and ref, by where it is. */
async function declaredReads(token: string): Promise<Record<string, { connectorId: string; ref: unknown }>> {
  const read = await request(app).get(`/api/share/boards/${boardId}`).set('Authorization', `Bearer ${token}`);
  return Object.fromEntries([...bindingsIn(read.body.picture as ViewDocument)].map(({ binding, at }) => [at, { connectorId: binding.adapter, ref: binding.ref }]));
}

/** The one read the picture declares whose pointer ends with `end`. */
function readAt(reads: Record<string, { connectorId: string; ref: unknown }>, end: string) {
  const found = Object.entries(reads).filter(([at]) => at.endsWith(end));
  if (found.length !== 1) throw new Error(`expected one read at …${end}, found ${Object.keys(reads).join(', ')}`);
  return found[0]![1];
}

async function createShareToken(): Promise<string> {
  const res = await request(app)
    .post(`/api/workspaces/${workspaceId}/boards/${boardId}/share-tokens`)
    .set('Cookie', ownerCookie);
  return res.body.token;
}

describe('public share routes', () => {
  it('lets a workspace API token read the board as a share link does — a program looking at what viewers see', async () => {
    const issue = (cookie: string, ws: string) =>
      request(app).post(`/api/workspaces/${ws}/api-tokens`).set('Cookie', cookie).send({ name: 'tool', scope: 'read' }).then(r => r.body.token as string);
    const token = await issue(ownerCookie, workspaceId);
    const read = await request(app).get(`/api/share/boards/${boardId}`).set('Authorization', `Bearer ${token}`);
    expect(read.status).toBe(200);
    expect(read.body.name).toBe('Board A');
    const resolve = await request(app).post(`/api/share/boards/${boardId}/resolve`).set('Authorization', `Bearer ${token}`).send({ bindings: [] });
    expect(resolve.status).toBe(200);

    // A token of another workspace does not reach this board.
    const other = await createUser(db, { email: 'other@x.com', passwordHash: 'h', name: 'Other' });
    const otherWorkspace = await createWorkspace(db, 'W2');
    await addWorkspaceUser(db, { workspaceId: otherWorkspace.id, userId: other.id, role: 'owner' });
    const foreign = await issue(cookieFor(other.id, otherWorkspace.id), otherWorkspace.id);
    expect((await request(app).get(`/api/share/boards/${boardId}`).set('Authorization', `Bearer ${foreign}`)).status).toBe(404);
    expect((await request(app).get(`/api/share/boards/${boardId}`).set('Authorization', 'Bearer ubt_unknown')).status).toBe(404);
  });

  it('returns the board document and connectorIds for a valid token', async () => {
    const connector = await createConnector(db, {
      actorUserId: 'test-actor', workspaceId, name: 'Plant API', baseUrl: 'https://plant.example.com', authType: 'none' });
    const doc: Board = {
      data: { plant: { from: connector.id, path: '/status' } },
      parts: { n1: { as: 'stat', of: 'plant', show: 'status' } },
      layout: { kind: 'canvas', size: [400, 300], place: { n1: [0, 0] } },
    };
    await updateBoard(db, workspaceId, boardId, { document: doc });
    const token = await createShareToken();
    (fetch as any).mockImplementation(async () => jsonResponse({ status: 'running' }));

    const res = await request(app).get(`/api/share/boards/${boardId}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Board A');
    expect(res.body.document).toEqual(doc);
    expect(res.body.revision).toBe(2);
    expect(res.body.connectorIds).toEqual([connector.id]);

    // Asked again with the revision it shows, an open viewer gets a bodiless 304 until the board changes.
    expect(res.headers.etag).toBe('"2"');
    const unchanged = await request(app).get(`/api/share/boards/${boardId}`).set('Authorization', `Bearer ${token}`).set('If-None-Match', '"2"');
    expect(unchanged.status).toBe(304);
    // A proxy may weaken the tag; it still matches (weak comparison).
    const weakened = await request(app).get(`/api/share/boards/${boardId}`).set('Authorization', `Bearer ${token}`).set('If-None-Match', 'W/"2"');
    expect(weakened.status).toBe(304);
    await updateBoard(db, workspaceId, boardId, { name: 'Board A, again' });
    const changed = await request(app).get(`/api/share/boards/${boardId}`).set('Authorization', `Bearer ${token}`).set('If-None-Match', '"2"');
    expect(changed.status).toBe(200);
    expect(changed.body.revision).toBe(3);
  });

  it('excludes referenced adapter ids that are not real stored connectors (a data source since removed)', async () => {
    const doc: Board = {
      data: { pump: { from: 'removed-source', path: '/pump' } },
      parts: { n1: { as: 'stat', of: 'pump', show: 'state' } },
      layout: { kind: 'canvas', size: [400, 300], place: { n1: [0, 0] } },
    };
    await updateBoard(db, workspaceId, boardId, { document: doc });
    const token = await createShareToken();

    const res = await request(app).get(`/api/share/boards/${boardId}`).set('Authorization', `Bearer ${token}`);
    expect(res.body.connectorIds).toEqual([]);
  });

  it('returns 404 for a missing, invalid, or wrong-board token', async () => {
    const token = await createShareToken();
    const otherBoardId = (await createBoard(db, { actorUserId: 'test-actor', workspaceId, name: 'Board B' })).id;

    // Exact body equality (not toMatchObject's partial match) so a future branch that adds an
    // extra field to one 404 body — e.g. {code:'NOT_FOUND', reason:'wrong-board'} — would fail
    // this test instead of silently passing, since that would defeat the "identical body shape
    // across all four failure modes" property this test exists to pin.
    const noToken = await request(app).get(`/api/share/boards/${boardId}`);
    expect(noToken.status).toBe(404);
    expect(noToken.body).toEqual({ code: 'NOT_FOUND' });

    const garbageToken = await request(app).get(`/api/share/boards/${boardId}`).set('Authorization', `Bearer garbage`);
    expect(garbageToken.status).toBe(404);
    expect(garbageToken.body).toEqual({ code: 'NOT_FOUND' });

    const wrongBoardToken = await request(app).get(`/api/share/boards/${otherBoardId}`).set('Authorization', `Bearer ${token}`);
    expect(wrongBoardToken.status).toBe(404);
    expect(wrongBoardToken.body).toEqual({ code: 'NOT_FOUND' });
  });

  it('takes the token only from the Authorization header, never from the URL', async () => {
    const token = await createShareToken();
    const inQuery = await request(app).get(`/api/share/boards/${boardId}?token=${token}`);
    expect(inQuery.status).toBe(404);
    expect((await request(app).get(`/api/share/boards/${boardId}`).set('Authorization', token)).status).toBe(404);
  });

  it('answers 410 once a link with an expiry has expired, on both share routes', async () => {
    const expiresAt = new Date(Date.now() + 7 * 86_400_000).toISOString();
    const created = await request(app)
      .post(`/api/workspaces/${workspaceId}/boards/${boardId}/share-tokens`)
      .set('Cookie', ownerCookie)
      .send({ expiresAt });
    expect(created.status).toBe(201);
    expect(created.body.expiresAt).toBe(expiresAt);
    const list = await request(app).get(`/api/workspaces/${workspaceId}/boards/${boardId}/share-tokens`).set('Cookie', ownerCookie);
    expect(list.body.tokens[0].expiresAt).toBe(expiresAt);

    const auth = `Bearer ${created.body.token}`;
    expect((await request(app).get(`/api/share/boards/${boardId}`).set('Authorization', auth)).status).toBe(200);

    vi.spyOn(Date, 'now').mockReturnValue(Date.parse(expiresAt) + 1);
    const expired = await request(app).get(`/api/share/boards/${boardId}`).set('Authorization', auth);
    expect(expired.status).toBe(410);
    expect(expired.body).toEqual({ code: 'SHARE_LINK_EXPIRED' });
    const resolve = await request(app).post(`/api/share/boards/${boardId}/resolve`).set('Authorization', auth).send({ bindings: [] });
    expect(resolve.status).toBe(410);
    vi.restoreAllMocks();
  });

  it('keeps a link without an expiry working, and refuses an expiry that is not a future time', async () => {
    const created = await request(app).post(`/api/workspaces/${workspaceId}/boards/${boardId}/share-tokens`).set('Cookie', ownerCookie);
    expect(created.body.expiresAt).toBeUndefined();
    for (const expiresAt of ['2020-01-01T00:00:00Z', 'next week', 7]) {
      const res = await request(app)
        .post(`/api/workspaces/${workspaceId}/boards/${boardId}/share-tokens`)
        .set('Cookie', ownerCookie)
        .send({ expiresAt });
      expect(res.status).toBe(400);
    }
  });

  it('updates lastUsedAt on a successful access', async () => {
    const token = await createShareToken();
    await request(app).get(`/api/share/boards/${boardId}`).set('Authorization', `Bearer ${token}`);
    const list = await request(app)
      .get(`/api/workspaces/${workspaceId}/boards/${boardId}/share-tokens`)
      .set('Cookie', ownerCookie);
    expect(list.body.tokens[0].lastUsedAt).toBeTruthy();
  });

  it('resolves every declared binding of a board in one batch request, in request order', async () => {
    const a = await createConnector(db, {
      actorUserId: 'test-actor', workspaceId, name: 'A', baseUrl: 'https://a.example.com', authType: 'none' });
    const b = await createConnector(db, {
      actorUserId: 'test-actor', workspaceId, name: 'B', baseUrl: 'https://b.example.com', authType: 'none' });
    const doc: Board = {
      data: { assets: { from: a.id, path: '/assets', list: '/value' }, pump: { from: b.id, path: '/pump' } },
      parts: { n1: { as: 'stat', of: 'assets[0]', show: 'Status' }, n2: { as: 'stat', of: 'assets[1]', show: 'Status' }, n3: { as: 'stat', of: 'pump', show: 'on' } },
      layout: { kind: 'canvas', size: [400, 300], place: { n1: [0, 0], n2: [0, 100], n3: [0, 200] } },
    };
    await updateBoard(db, workspaceId, boardId, { document: doc });
    const token = await createShareToken();
    (fetch as any).mockImplementation(async (url: URL) => new URL(String(url)).hostname === 'a.example.com'
      ? jsonResponse({ value: [{ Status: 'Running' }, { Status: 'Fault' }] })
      : jsonResponse({ on: true }));
    const reads = await declaredReads(token);
    (fetch as any).mockClear();

    const res = await request(app)
      .post(`/api/share/boards/${boardId}/resolve`).set('Authorization', `Bearer ${token}`)
      .send({ bindings: [readAt(reads, '/2/widget/bindings/data.value'), readAt(reads, '/1/widget/bindings/data.value'), readAt(reads, '/0/widget/bindings/data.value')] });
    expect(res.status).toBe(200);
    // The board's revision rides along — created, then saved once with these bindings.
    expect(res.body).toEqual({ revision: 2, results: [
      { value: true, quality: 'live', observedAt: expect.any(String) },
      { value: 'Fault', quality: 'live', observedAt: expect.any(String) },
      { value: 'Running', quality: 'live', observedAt: expect.any(String) },
    ] });
    // The two bindings on one URL share a single upstream request.
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('resolves a link’s binding as a declared read, and lists its source for the viewer', async () => {
    const nms = await createConnector(db, {
      actorUserId: 'test-actor', workspaceId, name: 'NMS', baseUrl: 'https://nms.example.com', authType: 'none' });
    const doc: Board = {
      data: { link: { from: nms.id, path: '/links/core-edge' } },
      parts: { a: { as: 'marker' }, b: { as: 'marker' } },
      layout: { kind: 'canvas', size: [400, 300], place: { a: [0, 0], b: [200, 0] }, links: { c: { from: 'a', to: 'b', of: 'link', label: '{{bps}}' } } },
    };
    await updateBoard(db, workspaceId, boardId, { document: doc });
    const token = await createShareToken();
    (fetch as any).mockImplementation(async () => jsonResponse({ bps: '26.78Kbps' }));

    const board = await request(app).get(`/api/share/boards/${boardId}`).set('Authorization', `Bearer ${token}`);
    expect(board.body.connectorIds).toEqual([nms.id]);
    const reads = Object.values(await declaredReads(token));
    expect(reads.length).toBeGreaterThan(0);
    const res = await request(app)
      .post(`/api/share/boards/${boardId}/resolve`).set('Authorization', `Bearer ${token}`)
      .send({ bindings: reads });
    expect(res.body.results.every((r: { quality: string }) => r.quality === 'live')).toBe(true);
    expect(JSON.stringify(res.body.results)).toContain('26.78Kbps');
  });

  it('reads what a grid’s canvas cell declares — its parts’ and its links’ bindings', async () => {
    const plant = await createConnector(db, {
      actorUserId: 'test-actor', workspaceId, name: 'Plant', baseUrl: 'https://plant.example.com', authType: 'none' });
    const doc: Board = {
      data: { pump: { from: plant.id, path: '/pump' }, flow: { from: plant.id, path: '/flow' } },
      parts: { a: { as: 'stat', of: 'pump', show: 'state' }, b: { as: 'marker' } },
      layout: { kind: 'grid', items: [{ id: 'plan', canvas: { size: [400, 300], place: { a: [0, 0], b: [200, 0] }, links: { c: { from: 'a', to: 'b', of: 'flow', label: '{{rate}}' } } } }] },
    };
    await updateBoard(db, workspaceId, boardId, { document: doc });
    const token = await createShareToken();
    (fetch as any).mockImplementation(async (url: unknown) => jsonResponse(String(url).endsWith('/flow') ? { rate: 12 } : { state: 'Running' }));

    const board = await request(app).get(`/api/share/boards/${boardId}`).set('Authorization', `Bearer ${token}`);
    expect(board.body.connectorIds).toEqual([plant.id]);
    const reads = await declaredReads(token);
    const res = await request(app)
      .post(`/api/share/boards/${boardId}/resolve`).set('Authorization', `Bearer ${token}`)
      .send({ bindings: [readAt(reads, '/widget/bindings/data.value'), ...Object.entries(reads).filter(([at]) => at.includes('/connectors/')).map(([, r]) => r)] });
    expect(res.body.results.map((r: { value: unknown; quality: string }) => [r.value, r.quality])).toEqual([['Running', 'live'], [12, 'live']]);
  });

  it('says why a read failed, but never what went wrong in words — a share link is public', async () => {
    const source = await createConnector(db, {
      actorUserId: 'test-actor', workspaceId, name: 'Open data', baseUrl: 'https://open.example.com', authType: 'none',
      sourceError: { path: '/code', messagePath: '/message' } });
    const doc: Board = {
      data: { air: { from: source.id, path: '/air' } },
      parts: { n1: { as: 'stat', of: 'air', show: 'pm10' } },
      layout: { kind: 'canvas', size: [400, 300], place: { n1: [0, 0] } },
    };
    await updateBoard(db, workspaceId, boardId, { document: doc });
    const token = await createShareToken();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    (fetch as any).mockImplementation(async () => jsonResponse({ code: 'INFO-100', message: 'The key is not valid.' }));

    const res = await request(app)
      .post(`/api/share/boards/${boardId}/resolve`).set('Authorization', `Bearer ${token}`)
      .send({ bindings: [readAt(await declaredReads(token), '/widget/bindings/data.value')] });
    expect(res.body.results).toEqual([{ quality: 'disconnected', reason: 'source' }]);
  });

  it('answers disconnected for a batch entry the board does not declare, without calling its upstream', async () => {
    const connector = await createConnector(db, {
      actorUserId: 'test-actor', workspaceId, name: 'Plant API', baseUrl: 'https://plant.example.com', authType: 'none' });
    const unreferenced = await createConnector(db, {
      actorUserId: 'test-actor', workspaceId, name: 'Other', baseUrl: 'https://other.example.com', authType: 'none' });
    const doc: Board = {
      data: { plant: { from: connector.id, path: '/status' } },
      parts: { n1: { as: 'stat', of: 'plant', show: 'status' } },
      layout: { kind: 'canvas', size: [400, 300], place: { n1: [0, 0] } },
    };
    await updateBoard(db, workspaceId, boardId, { document: doc });
    const token = await createShareToken();
    (fetch as any).mockImplementation(async () => jsonResponse({ status: 'running' }));
    const declared = readAt(await declaredReads(token), '/widget/bindings/data.value');
    (fetch as any).mockClear();

    const res = await request(app)
      .post(`/api/share/boards/${boardId}/resolve`).set('Authorization', `Bearer ${token}`)
      .send({ bindings: [
        declared,
        // The connector this board uses, with a ref it never declared: the gate compares the exact
        // (connectorId, ref) pair, or a share link would open the connector's whole origin.
        { connectorId: connector.id, ref: { path: '/other-metric' } },
        // A real connector of this workspace that the board does not reference.
        { connectorId: unreferenced.id, ref: declared.ref },
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
    expect((await request(app).post(`/api/share/boards/${boardId}/resolve`).send({ bindings: [] })).status).toBe(404);
    expect((await request(app).post(`/api/share/boards/${boardId}/resolve`).set('Authorization', `Bearer wrong`).send({ bindings: [] })).status).toBe(404);
    expect((await request(app).post(`/api/share/boards/${boardId}/resolve`).set('Authorization', `Bearer ${token}`).send({})).status).toBe(400);
    expect((await request(app).post(`/api/share/boards/${boardId}/resolve`).set('Authorization', `Bearer ${token}`).send({ bindings: ['x'] })).status).toBe(400);
    const tooMany = Array.from({ length: 501 }, () => ({ connectorId: 'c', ref: { path: '/a' } }));
    expect((await request(app).post(`/api/share/boards/${boardId}/resolve`).set('Authorization', `Bearer ${token}`).send({ bindings: tooMany })).status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('resolves a binding using the exact (connectorId, ref) round-tripped through save -> DB -> share GET -> batch resolve', async () => {
    // Unlike the other tests in this file, the document here is saved through the real
    // PUT /workspaces/:id/boards/:id route (not the updateBoard() DB helper directly), and the
    // ref used against the resolve route is read back out of the share GET response rather than
    // the literal object above — so both sides of isDeclaredBinding's comparison actually pass
    // through JSON.stringify -> database storage -> JSON.parse -> HTTP response -> HTTP request,
    // the same path the embed viewer takes, instead of sharing one in-memory object by reference.
    const connector = await createConnector(db, {
      actorUserId: 'test-actor', workspaceId, name: 'Plant API', baseUrl: 'https://plant.example.com', authType: 'none' });
    const doc = {
      data: { plant: { from: connector.id, path: '/status', fields: { status: {} } } },
      parts: { n1: { as: 'stat', of: 'plant', show: 'status' } },
      layout: { kind: 'canvas', size: [400, 300], place: { n1: [0, 0] } },
    };

    const saveRes = await request(app)
      .put(`/api/workspaces/${workspaceId}/boards/${boardId}`)
      .set('Cookie', ownerCookie)
      .send({ document: doc });
    expect(saveRes.status).toBe(200);

    const token = await createShareToken();
    const getRes = await request(app).get(`/api/share/boards/${boardId}`).set('Authorization', `Bearer ${token}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.connectorIds).toEqual([connector.id]);

    // The board's viewers draw it from its picture: the binding they resolve is the picture's.
    const binding = getRes.body.picture.nodes[0].widget.bindings['data.value'];
    expect(binding).toMatchObject({ adapter: connector.id, ref: { path: '/status' } });

    (fetch as any).mockResolvedValueOnce(jsonResponse({ status: 'running' }));
    const resolveRes = await request(app)
      .post(`/api/share/boards/${boardId}/resolve`).set('Authorization', `Bearer ${token}`)
      .send({ bindings: [{ connectorId: binding.adapter, ref: binding.ref }] });
    expect(resolveRes.status).toBe(200);
    expect(resolveRes.body).toEqual({ revision: 2, results: [{ value: 'running', quality: 'live', observedAt: expect.any(String) }] });
  });

  it('answers the board’s state — each part’s state and quality, no values — for a share link and an API token', async () => {
    const plant = await createConnector(db, {
      actorUserId: 'test-actor', workspaceId, name: 'Plant', baseUrl: 'https://plant.example.com', authType: 'none' });
    const doc: Board = {
      statuses: { fault: { tone: 'alarm' }, running: { tone: 'ok' } },
      data: { pump: { from: plant.id, path: '/pump', fields: { state: { state: { Fault: 'fault', '*': 'running' } } } } },
      parts: { pump: { as: 'stat', of: 'pump', show: 'state' }, title: { as: 'label', title: 'Plant' } },
      layout: { kind: 'canvas', size: [400, 300], place: { pump: [0, 0], title: [0, 200] } },
    };
    await updateBoard(db, workspaceId, boardId, { document: doc });
    (fetch as any).mockImplementation(async () => jsonResponse({ state: 'Fault', temp: 73.2 }));
    const token = await createShareToken();

    const res = await request(app).get(`/api/share/boards/${boardId}/state`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      evaluatedAt: expect.any(String),
      revision: 2,
      parts: { pump: { state: 'fault', quality: 'live', observedAt: expect.any(String) }, title: {} },
    });
    expect(JSON.stringify(res.body)).not.toContain('Fault');

    const issue = await request(app).post(`/api/workspaces/${workspaceId}/api-tokens`).set('Cookie', ownerCookie).send({ name: 'tool', scope: 'read' });
    const asTool = await request(app).get(`/api/share/boards/${boardId}/state`).set('Authorization', `Bearer ${issue.body.token}`);
    expect(asTool.status).toBe(200);
    expect(asTool.body.parts.pump.state).toBe('fault');
  });

  it('answers 404 for the state of a board without a valid token', async () => {
    const res = await request(app).get(`/api/share/boards/${boardId}/state`).set('Authorization', 'Bearer nope');
    expect(res.status).toBe(404);
  });

  it('draws a board from its picture — a grid laying out a part per item of a list as it is now', async () => {
    const plant = await createConnector(db, {
      actorUserId: 'test-actor', workspaceId, name: 'Plant', baseUrl: 'https://plant.example.com', authType: 'none' });
    const board: Board = {
      data: { pumps: { from: plant.id, path: '/pumps', list: '/value', key: 'id' } },
      parts: { pump: { as: 'stat', each: 'pumps', show: 'flow' } },
      layout: { kind: 'grid', items: ['pump'] },
    };
    await updateBoard(db, workspaceId, boardId, { document: board });
    const token = await createShareToken();
    const auth = `Bearer ${token}`;
    (fetch as any).mockImplementation(async () => jsonResponse({ value: [{ id: 'P1', flow: 3 }, { id: 'P2', flow: 5 }] }));

    const read = await request(app).get(`/api/share/boards/${boardId}`).set('Authorization', auth);
    expect(read.status).toBe(200);
    expect(read.body.document).toEqual(board);
    expect(read.body.picture.items.map((i: { id: string }) => i.id)).toEqual(['pump/P1', 'pump/P2']);
    expect(read.body.connectorIds).toEqual([plant.id]);

    const binding = read.body.picture.items[1].widget.bindings['data.value'];
    const resolve = await request(app).post(`/api/share/boards/${boardId}/resolve`).set('Authorization', auth)
      .send({ bindings: [{ connectorId: binding.adapter, ref: binding.ref }, { connectorId: plant.id, ref: { path: '/pumps', valuePath: '/value' } }] });
    // The item's value is a read of the board's; the whole list, read only to lay the grid out, is not one.
    expect(resolve.body.results.map((r: { value?: unknown; quality: string }) => [r.value, r.quality])).toEqual([[5, 'live'], [undefined, 'disconnected']]);

    const state = await request(app).get(`/api/share/boards/${boardId}/state`).set('Authorization', auth);
    expect(state.status).toBe(200);
    expect(state.body.parts).toEqual({ 'pump/P1': { quality: 'live', observedAt: expect.any(String) }, 'pump/P2': { quality: 'live', observedAt: expect.any(String) } });
  });
});
