import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import type { DbClient } from '../db.js';
import { createTestDb } from '../test-support/test-db.js';
import { createApp } from '../app.js';
import { createUser } from '../db/users.js';
import { createWorkspace, addWorkspaceUser } from '../db/workspaces.js';
import { signSession } from '../auth/session.js';
import { SESSION_COOKIE_NAME } from '../middleware/require-auth.js';

// A list item named by its fields, not its position: sources reorder their lists between reads, and a
// position would then read another item's value as live.

const SECRET = 'test-secret-at-least-16-chars';
let db: DbClient;
let workspaceId: string;
let ownerCookie: string;
let stations: unknown[];

beforeEach(async () => {
  db = await createTestDb();
  const owner = await createUser(db, { email: 'owner@x.com', passwordHash: 'h', name: 'Owner' });
  const workspace = await createWorkspace(db, 'W1');
  await addWorkspaceUser(db, { workspaceId: workspace.id, userId: owner.id, role: 'owner' });
  workspaceId = workspace.id;
  ownerCookie = `${SESSION_COOKIE_NAME}=${signSession({ userId: owner.id, activeWorkspaceId: workspace.id, issuedAt: Date.now() }, SECRET)}`;
  stations = [
    { id: 'ST-1', name: 'Station hall', bikes: '3' },
    { id: 'ST-2', name: 'City hall', bikes: '0' },
  ];
});

async function resolve(ref: unknown) {
  const app = createApp({
    db, sessionSecret: SECRET,
    connectorFetch: async () => new Response(JSON.stringify({ data: { stations } }), { headers: { 'Content-Type': 'application/json' } }),
  });
  const { body: connector } = await request(app).post(`/api/workspaces/${workspaceId}/connectors`).set('Cookie', ownerCookie)
    .send({ name: 'Bikes', baseUrl: 'https://bikes.example.com', authType: 'none' });
  return request(app).post(`/api/workspaces/${workspaceId}/connectors/${connector.id}/resolve`).set('Cookie', ownerCookie).send({ ref });
}

const byId = (id: string | number) => ({ path: '/stations', item: { list: '/data/stations', where: { id } }, valuePath: '/bikes' });

describe('a binding to a list item by its fields', () => {
  it('reads the item that matches, wherever it is in the list', async () => {
    expect((await resolve(byId('ST-2'))).body).toMatchObject({ value: '0', quality: 'live' });
    stations.reverse();
    expect((await resolve(byId('ST-2'))).body).toMatchObject({ value: '0', quality: 'live' });
  });

  it('reads the whole item without a value path, and matches a code given as a number', async () => {
    stations = [{ code: 12, name: 'Twelve' }];
    const { body } = await resolve({ path: '/stations', item: { list: '/data/stations', where: { code: '12' } } });
    expect(body).toMatchObject({ value: { code: 12, name: 'Twelve' }, quality: 'live' });
  });

  it('says the item is not at the source when none matches — not another item’s value', async () => {
    expect((await resolve(byId('ST-9'))).body).toEqual({ quality: 'disconnected', reason: 'address' });
  });

  it('refuses an item that is not a list pointer and fields to match', async () => {
    for (const item of [{ list: 'data', where: { id: 'x' } }, { list: '/data/stations', where: {} }, { list: '/data/stations', where: { id: { nested: 1 } } }, '/data/stations/0']) {
      expect((await resolve({ path: '/stations', item })).status, JSON.stringify(item)).toBe(400);
    }
  });
});
