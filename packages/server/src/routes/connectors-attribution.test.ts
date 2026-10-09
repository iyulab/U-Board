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
import { createBoard, updateBoard } from '../db/boards.js';

// How a data source asks to be credited (open-data licenses commonly make it a condition of use): set
// on the connector, served with a share link for each source the board binds to.

const SECRET = 'test-secret-at-least-16-chars';
const CREDIT = { text: 'Seoul Open Data Plaza (KOGL Type 1)', url: 'https://data.example.org' };
let db: DbClient;
let app: express.Express;
let workspaceId: string;
let ownerCookie: string;

beforeEach(async () => {
  db = await createTestDb();
  app = createApp({ db, sessionSecret: SECRET });
  const owner = await createUser(db, { email: 'owner@x.com', passwordHash: 'h', name: 'Owner' });
  const workspace = await createWorkspace(db, 'W1');
  await addWorkspaceUser(db, { workspaceId: workspace.id, userId: owner.id, role: 'owner' });
  workspaceId = workspace.id;
  ownerCookie = `${SESSION_COOKIE_NAME}=${signSession({ userId: owner.id, activeWorkspaceId: workspace.id, issuedAt: Date.now() }, SECRET)}`;
});

const base = () => `/api/workspaces/${workspaceId}/connectors`;
const create = (body: Record<string, unknown>) =>
  request(app).post(base()).set('Cookie', ownerCookie).send({ name: 'Air', baseUrl: 'https://api.example.com', authType: 'none', ...body });

describe('a connector’s attribution', () => {
  it('is stored, listed, kept on a rename, replaced, and cleared with null', async () => {
    const { body: created } = await create({ attribution: { text: ` ${CREDIT.text} `, url: CREDIT.url } });
    expect(created.attribution).toEqual(CREDIT);
    expect((await request(app).get(base()).set('Cookie', ownerCookie)).body.connectors[0].attribution).toEqual(CREDIT);

    const renamed = await request(app).put(`${base()}/${created.id}`).set('Cookie', ownerCookie).send({ name: 'Air quality' });
    expect(renamed.body.attribution).toEqual(CREDIT);

    const replaced = await request(app).put(`${base()}/${created.id}`).set('Cookie', ownerCookie).send({ attribution: { text: 'Another' } });
    expect(replaced.body.attribution).toEqual({ text: 'Another' });

    const cleared = await request(app).put(`${base()}/${created.id}`).set('Cookie', ownerCookie).send({ attribution: null });
    expect(cleared.body.attribution).toBeUndefined();
  });

  it('needs text, keeps to a line, and links only to an http(s) address', async () => {
    for (const attribution of [{ text: '' }, { text: 'x'.repeat(201) }, { text: 'A', url: 'javascript:alert(1)' }, 'A credit']) {
      expect((await create({ attribution })).status, JSON.stringify(attribution)).toBe(400);
    }
    expect((await create({ attribution: { text: 'A', url: '' } })).body.attribution).toEqual({ text: 'A' });
  });

  it('reaches a share link for each source the board binds to — and nothing else about the source', async () => {
    const { body: credited } = await create({ attribution: CREDIT });
    const { body: plain } = await create({ name: 'Plain' });
    const board = await createBoard(db, { actorUserId: 'test-actor', workspaceId, name: 'Air' });
    const bound = (adapter: string, i: number) => ({ id: `n${i}`, x: 0, y: 0, anchored: false, widget: { type: 'metric', bindings: { 'data.value': { adapter, ref: { path: '/a' } } } } });
    await updateBoard(db, workspaceId, board.id, { document: { kind: 'canvas', background: {}, connectors: [], nodes: [bound(credited.id, 0), bound(plain.id, 1)] } });
    const { body: link } = await request(app).post(`/api/workspaces/${workspaceId}/boards/${board.id}/share-tokens`).set('Cookie', ownerCookie);

    const { body } = await request(app).get(`/api/share/boards/${board.id}`).set('Authorization', `Bearer ${link.token}`);
    expect(body.connectorIds.sort()).toEqual([credited.id, plain.id].sort());
    expect(body.attributions).toEqual({ [credited.id]: CREDIT });
    expect(JSON.stringify(body)).not.toContain('api.example.com');
  });
});
