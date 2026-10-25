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
import { STATIC_ANSWERS_MAX_BYTES } from './connectors.js';

// A static data source answers what its owner stored, by path, as an HTTP source would answer there — so a board reads
// it the way it reads any source, and a share link, the board's picture and its state read it the same way too.

const SECRET = 'test-secret-at-least-16-chars';
const PUMPS = [
  { id: 'P1', flow: 31, updatedAt: '2026-10-24T08:00:00Z' },
  { id: 'P2', flow: 57, updatedAt: '2026-10-24T08:00:00Z' },
];
let db: DbClient;
let app: express.Express;
let workspaceId: string;
let ownerCookie: string;
const upstream = vi.fn<typeof fetch>();

beforeEach(async () => {
  db = await createTestDb();
  upstream.mockReset();
  app = createApp({ db, sessionSecret: SECRET, connectorFetch: upstream });
  const owner = await createUser(db, { email: 'owner@x.com', passwordHash: 'h', name: 'Owner' });
  const workspace = await createWorkspace(db, 'W1');
  await addWorkspaceUser(db, { workspaceId: workspace.id, userId: owner.id, role: 'owner' });
  workspaceId = workspace.id;
  ownerCookie = `${SESSION_COOKIE_NAME}=${signSession({ userId: owner.id, activeWorkspaceId: workspace.id, issuedAt: Date.now() }, SECRET)}`;
});

const base = () => `/api/workspaces/${workspaceId}/connectors`;
const create = (body: Record<string, unknown>) =>
  request(app).post(base()).set('Cookie', ownerCookie).send({ name: 'Plant (example)', type: 'static', ...body });
const resolve = (id: string, ref: unknown) => request(app).post(`${base()}/${id}/resolve`).set('Cookie', ownerCookie).send({ ref });

describe('a static data source', () => {
  it('is created with its answers and example flag, listed with them, and changed — keeping its type', async () => {
    const created = await create({ answers: { '/pumps': PUMPS }, sample: true, description: 'GET /pumps — one row per pump' });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ type: 'static', answers: { '/pumps': PUMPS }, sample: true });
    expect(created.body.baseUrl).toBeUndefined();
    expect(created.body.authType).toBeUndefined();

    const listed = (await request(app).get(base()).set('Cookie', ownerCookie)).body.connectors;
    expect(listed).toEqual([expect.objectContaining({ id: created.body.id, type: 'static', answers: { '/pumps': PUMPS }, sample: true })]);

    const changed = await request(app).put(`${base()}/${created.body.id}`).set('Cookie', ownerCookie).send({ answers: { '/pumps': [PUMPS[0]] }, sample: false });
    expect(changed.body).toMatchObject({ type: 'static', answers: { '/pumps': [PUMPS[0]] }, sample: false });
    const { events } = (await request(app).get(`/api/workspaces/${workspaceId}/audit`).set('Cookie', ownerCookie)).body;
    expect(events[0]).toMatchObject({ action: 'connector.updated', detail: 'answers,sample' });

    for (const refused of [{ type: 'http' }, { baseUrl: 'https://a.example.com' }, { authType: 'bearer', authValue: 'x' }]) {
      expect((await request(app).put(`${base()}/${created.body.id}`).set('Cookie', ownerCookie).send(refused)).status, JSON.stringify(refused)).toBe(400);
    }
  });

  it('takes answers by path as written, of a bounded size, and nothing an HTTP source has', async () => {
    expect((await create({})).body.answers).toEqual({});
    for (const answers of [[], 'x', { pumps: 1 }, { '/pumps?x=1': 1 }, { '/a/../b': 1 }, { '/x': 'y'.repeat(STATIC_ANSWERS_MAX_BYTES) }]) {
      expect((await create({ answers })).status, JSON.stringify(answers).slice(0, 30)).toBe(400);
    }
    for (const http of [{ baseUrl: 'https://a.example.com' }, { authType: 'none' }, { sourceError: { at: '/error' } }, { sample: 'yes' }]) {
      expect((await create(http)).status, JSON.stringify(http)).toBe(400);
    }
    expect((await create({ type: 'ftp' })).status).toBe(400);
  });

  it('answers a read at a path with what it stores there, its query ignored — and a path it has none at as a wrong address', async () => {
    const { body: source } = await create({ answers: { '/pumps': PUMPS, '/plant': { name: 'North', shift: 'B' } } });
    const one = await resolve(source.id, { path: '/plant', valuePath: '/shift' });
    expect(one.body).toMatchObject({ value: 'B', quality: 'live' });
    const item = await resolve(source.id, { path: '/pumps?site=north', valuePath: '/1/flow', observedAtPath: '/1/updatedAt' });
    expect(item.body).toMatchObject({ value: 57, quality: 'live', observedAt: '2026-10-24T08:00:00.000Z' });
    const missing = await resolve(source.id, { path: '/valves', valuePath: '/0' });
    expect(missing.body).toMatchObject({ quality: 'disconnected', reason: 'address' });
    expect(upstream).not.toHaveBeenCalled();
  });

  it('is read anew once its answers are changed', async () => {
    const { body: source } = await create({ answers: { '/plant': { shift: 'B' } } });
    expect((await resolve(source.id, { path: '/plant', valuePath: '/shift' })).body.value).toBe('B');
    await request(app).put(`${base()}/${source.id}`).set('Cookie', ownerCookie).send({ answers: { '/plant': { shift: 'C' } } });
    expect((await resolve(source.id, { path: '/plant', valuePath: '/shift' })).body.value).toBe('C');
  });

  it('is tried as a connection test is — the answer at a path, before anything is stored', async () => {
    const tried = await request(app).post(`${base()}/test`).set('Cookie', ownerCookie).send({ type: 'static', answers: { '/plant': { shift: 'B' } }, path: '/plant' });
    expect(tried.body).toEqual({ ok: true, excerpt: '{"shift":"B"}' });
    const none = await request(app).post(`${base()}/test`).set('Cookie', ownerCookie).send({ type: 'static', answers: {}, path: '/plant' });
    expect(none.body).toMatchObject({ ok: false, reason: 'address', status: 404 });
    expect((await request(app).post(`${base()}/test`).set('Cookie', ownerCookie).send({ type: 'static', answers: {} })).body.code).toBe('PATH_REQUIRED');
  });

  it('may be set up by a program with an API token — its answers are not a credential', async () => {
    const issued = await request(app).post(`/api/workspaces/${workspaceId}/api-tokens`).set('Cookie', ownerCookie).send({ name: 'assistant', scope: 'write' });
    expect(issued.status).toBe(201);
    const made = await request(app).post(base()).set('Authorization', `Bearer ${issued.body.token}`).send({ name: 'Example', type: 'static', answers: { '/plant': { shift: 'B' } }, sample: true });
    expect(made.status).toBe(201);
  });

  it('is what a board draws its items from, as it is drawn for the editor and a share link', async () => {
    const { body: source } = await create({ answers: { '/pumps': PUMPS }, sample: true });
    const { body: board } = await request(app).post(`/api/workspaces/${workspaceId}/boards`).set('Cookie', ownerCookie).send({ name: 'Pumps', kind: 'grid' });
    const at = `/api/workspaces/${workspaceId}/boards/${board.id}`;
    const document = {
      data: { pumps: { from: source.id, path: '/pumps', list: '', key: 'id', fields: { flow: { unit: 'm³/h' } } } },
      parts: { pump: { as: 'stat', each: 'pumps', show: 'flow' } },
      layout: { kind: 'grid', items: ['pump'] },
    };
    const saved = await request(app).put(at).set('Cookie', ownerCookie).send({ document });
    expect(saved.status, JSON.stringify(saved.body)).toBe(200);
    const read = await request(app).get(at).set('Cookie', ownerCookie);
    expect(read.body.picture.items.map((i: { id: string }) => i.id)).toEqual(['pump/P1', 'pump/P2']);

    const token = (await request(app).post(`${at}/share-tokens`).set('Cookie', ownerCookie)).body.token;
    const shared = await request(app).get(`/api/share/boards/${board.id}`).set('Authorization', `Bearer ${token}`);
    expect(shared.status).toBe(200);
    expect(shared.body.picture.items.map((i: { id: string }) => i.id)).toEqual(['pump/P1', 'pump/P2']);
    // The share viewer is told its answers are example data, to say so under the board.
    expect(shared.body.samples).toEqual([source.id]);
    expect(upstream).not.toHaveBeenCalled();
  });

  it('is what a canvas places a part’s items by, and the board answers how many it left out', async () => {
    const quakes = [
      { id: 'q1', geometry: { coordinates: [0, 0] } },
      { id: 'q2', geometry: { coordinates: [90, -45] } },
      { id: 'q3', geometry: null },
      { id: 'q4', geometry: { coordinates: [400, 0] } },
    ];
    const { body: source } = await create({ answers: { '/quakes': quakes }, sample: true });
    const { body: board } = await request(app).post(`/api/workspaces/${workspaceId}/boards`).set('Cookie', ownerCookie).send({ name: 'Quakes', kind: 'canvas' });
    const at = `/api/workspaces/${workspaceId}/boards/${board.id}`;
    const document = {
      data: { quakes: { from: source.id, path: '/quakes', list: '', key: 'id', fields: { lon: { at: '/geometry/coordinates/0' }, lat: { at: '/geometry/coordinates/1' } } } },
      parts: { quake: { as: 'marker', each: 'quakes', title: '{{key}}' } },
      layout: { kind: 'canvas', size: [360, 180], place: { quake: { at: ['lon', 'lat'], frame: [-180, 90, 180, -90], size: [10, 10] } } },
    };
    const saved = await request(app).put(at).set('Cookie', ownerCookie).send({ document });
    expect(saved.status, JSON.stringify(saved.body)).toBe(200);
    const read = await request(app).get(at).set('Cookie', ownerCookie);
    expect(read.body.picture.nodes.map((n: { id: string }) => n.id)).toEqual(['quake/q1', 'quake/q2']);
    expect(read.body.unplaced).toEqual({ quake: 2 });
  });
});
