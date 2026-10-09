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
import { createBoard, updateBoard } from '../db/boards.js';

// Data sources that take their key only in the address — as a query parameter, or as a path segment —
// as many public open-data APIs do. The key is a connector secret like any other: sealed, never listed,
// and put into the address only when the request is sent, so a board (and a share link) never holds it.

const SECRET = 'test-secret-at-least-16-chars';
const KEY = 'k3y/with+chars=';
let db: DbClient;
let app: express.Express;
let workspaceId: string;
let ownerCookie: string;
let requested: string[];

beforeEach(async () => {
  db = await createTestDb();
  requested = [];
  app = createApp({
    db,
    sessionSecret: SECRET,
    connectorFetch: async (input) => {
      requested.push(String(input));
      return new Response(JSON.stringify({ items: [{ pm10: 27 }] }), { headers: { 'Content-Type': 'application/json' } });
    },
  });
  const owner = await createUser(db, { email: 'owner@x.com', passwordHash: 'h', name: 'Owner' });
  const workspace = await createWorkspace(db, 'W1');
  await addWorkspaceUser(db, { workspaceId: workspace.id, userId: owner.id, role: 'owner' });
  workspaceId = workspace.id;
  ownerCookie = `${SESSION_COOKIE_NAME}=${signSession({ userId: owner.id, activeWorkspaceId: workspace.id, issuedAt: Date.now() }, SECRET)}`;
});

function create(body: Record<string, unknown>) {
  return request(app).post(`/api/workspaces/${workspaceId}/connectors`).set('Cookie', ownerCookie).send({ name: 'Air', ...body });
}

function resolve(connectorId: string, ref: unknown) {
  return request(app).post(`/api/workspaces/${workspaceId}/connectors/${connectorId}/resolve`).set('Cookie', ownerCookie).send({ ref });
}

describe('a key sent as a query parameter', () => {
  it('is added to every request under its name, and listed only by name', async () => {
    const { body: created, status } = await create({ baseUrl: 'https://api.example.com', authType: 'query', authParamName: 'serviceKey', authValue: KEY });
    expect(status).toBe(201);
    expect(created).toMatchObject({ authType: 'query', authParamName: 'serviceKey' });
    expect(JSON.stringify(created)).not.toContain(KEY);

    const res = await resolve(created.id, { path: '/air?returnType=json&sidoName=Seoul', valuePath: '/items/0/pm10' });
    expect(res.body).toMatchObject({ value: 27, quality: 'live' });
    const sent = new URL(requested[0]);
    expect(sent.searchParams.get('serviceKey')).toBe(KEY);
    expect(sent.searchParams.get('sidoName')).toBe('Seoul');

    const { body: list } = await request(app).get(`/api/workspaces/${workspaceId}/connectors`).set('Cookie', ownerCookie);
    expect(JSON.stringify(list)).not.toContain(KEY);
  });

  it('wins over a parameter of the same name written in the binding', async () => {
    const { body: created } = await create({ baseUrl: 'https://api.example.com', authType: 'query', authParamName: 'key', authValue: KEY });
    await resolve(created.id, { path: '/air?key=typed-by-hand' });
    expect(new URL(requested[0]).searchParams.getAll('key')).toEqual([KEY]);
  });

  it('needs the parameter name', async () => {
    expect((await create({ baseUrl: 'https://api.example.com', authType: 'query', authValue: KEY })).status).toBe(400);
    expect((await create({ baseUrl: 'https://api.example.com', authType: 'query', authParamName: ' ', authValue: KEY })).status).toBe(400);
  });

  it('keeps the name and the key on a rename, and drops the name on leaving query', async () => {
    const { body: created } = await create({ baseUrl: 'https://api.example.com', authType: 'query', authParamName: 'serviceKey', authValue: KEY });
    const renamed = await request(app).put(`/api/workspaces/${workspaceId}/connectors/${created.id}`).set('Cookie', ownerCookie)
      .send({ name: 'Air quality', authType: 'query' });
    expect(renamed.body).toMatchObject({ name: 'Air quality', authParamName: 'serviceKey' });
    await resolve(created.id, { path: '/air' });
    expect(new URL(requested[0]).searchParams.get('serviceKey')).toBe(KEY);

    const toHeader = await request(app).put(`/api/workspaces/${workspaceId}/connectors/${created.id}`).set('Cookie', ownerCookie)
      .send({ authType: 'header', authHeaderName: 'X-Key' });
    expect(toHeader.body.authParamName).toBeUndefined();
  });
});

describe('a key sent in the path', () => {
  it('takes the place of {key} in the base URL', async () => {
    const { body: created, status } = await create({ baseUrl: 'http://open.example.com:8088/{key}', authType: 'path', authValue: KEY });
    expect(status).toBe(201);
    await resolve(created.id, { path: '/json/RealtimeCityAir/1/5/' });
    expect(requested[0]).toBe(`http://open.example.com:8088/${encodeURIComponent(KEY)}/json/RealtimeCityAir/1/5/`);
  });

  it('needs {key} once, in the path', async () => {
    for (const baseUrl of ['http://open.example.com', 'http://open.example.com/{key}/{key}', 'http://open.example.com/?k={key}']) {
      expect((await create({ baseUrl, authType: 'path', authValue: KEY })).status, baseUrl).toBe(400);
    }
  });

  it('refuses a base URL edit that would drop {key}', async () => {
    const { body: created } = await create({ baseUrl: 'http://open.example.com/{key}', authType: 'path', authValue: KEY });
    const res = await request(app).put(`/api/workspaces/${workspaceId}/connectors/${created.id}`).set('Cookie', ownerCookie)
      .send({ baseUrl: 'http://open.example.com/v2' });
    expect(res.status).toBe(400);
  });
});

describe('a board bound through such a connector', () => {
  it('reaches a share link without the key, and its failures are logged without it', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const failing = createApp({
      db,
      sessionSecret: SECRET,
      connectorFetch: async () => new Response('nope', { status: 503 }),
    });
    const { body: created } = await create({ baseUrl: 'https://api.example.com', authType: 'query', authParamName: 'serviceKey', authValue: KEY });
    const board = await createBoard(db, { actorUserId: 'test-actor', workspaceId, name: 'Air' });
    const ref = { path: '/air?sidoName=Seoul', valuePath: '/items/0/pm10' };
    await updateBoard(db, workspaceId, board.id, {
      document: { kind: 'canvas', background: {}, connectors: [], nodes: [{ id: 'n', x: 0, y: 0, anchored: false, widget: { type: 'metric', bindings: { 'data.value': { adapter: created.id, ref } } } }] },
    });
    const { body: link } = await request(app).post(`/api/workspaces/${workspaceId}/boards/${board.id}/share-tokens`).set('Cookie', ownerCookie);
    const shared = await request(app).get(`/api/share/boards/${board.id}`).set('Authorization', `Bearer ${link.token}`);
    expect(shared.status).toBe(200);
    expect(JSON.stringify(shared.body)).not.toContain(KEY);

    await request(failing).post(`/api/workspaces/${workspaceId}/connectors/${created.id}/resolve`).set('Cookie', ownerCookie).send({ ref });
    expect(warn).toHaveBeenCalled();
    expect(JSON.stringify(warn.mock.calls)).not.toContain(KEY);
    warn.mockRestore();
  });
});
