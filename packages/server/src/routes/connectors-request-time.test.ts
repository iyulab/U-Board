import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import type { DbClient } from '../db.js';
import type express from 'express';
import { createTestDb } from '../test-support/test-db.js';
import { createApp } from '../app.js';
import { createUser } from '../db/users.js';
import { createWorkspace, addWorkspaceUser } from '../db/workspaces.js';
import { signSession } from '../auth/session.js';
import { SESSION_COOKIE_NAME } from '../middleware/require-auth.js';

// A source asked for the data of a given time — `base_date=20261022&base_time=1300` — rather than for its latest: the
// binding writes the time as a place (`{{now:yyyyMMdd}}`), filled in on the source's clock each time a request is sent.

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

afterEach(() => {
  vi.useRealTimers();
});

describe('a request path with time places', () => {
  const PATH = '/getUltraSrtNcst?base_date={{now:yyyyMMdd}}&base_time={{now:HHmm}}&nx=60&ny=127';
  const ref = { path: PATH, valuePath: '/items/0/pm10', timeZone: 'Asia/Seoul', requestTime: { delaySeconds: 2400, stepSeconds: 3600 } };

  it('is sent with the time the source has published by, on its clock — and a new time asks again', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-22T04:31:00Z')); // 13:31 in Seoul
    const { body: created } = await create({ baseUrl: 'https://api.example.com', authType: 'query', authParamName: 'serviceKey', authValue: KEY });

    expect((await resolve(created.id, ref)).body).toMatchObject({ value: 27, quality: 'live' });
    const sent = new URL(requested[0]);
    expect(sent.searchParams.get('base_date')).toBe('20261022');
    expect(sent.searchParams.get('base_time')).toBe('1200');
    expect(sent.searchParams.get('serviceKey')).toBe(KEY);

    vi.setSystemTime(new Date('2026-10-22T04:41:00Z')); // 13:41 — the 13:00 data is out
    await resolve(created.id, ref);
    expect(new URL(requested.at(-1)!).searchParams.get('base_time')).toBe('1300');
  });

  it('is tried by the connection test on the clock the caller names', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-22T04:31:00Z')); // 13:31 in Seoul
    const res = await request(app)
      .post(`/api/workspaces/${workspaceId}/connectors/test`)
      .set('Cookie', ownerCookie)
      .send({ baseUrl: 'https://api.example.com', authType: 'query', authParamName: 'serviceKey', authValue: KEY, path: '/obs?d={{now:yyyyMMdd}}&t={{now:HHmm}}', timeZone: 'Asia/Seoul' });
    expect(res.status).toBe(200);
    const sent = new URL(requested[0]);
    expect([sent.searchParams.get('d'), sent.searchParams.get('t')]).toEqual(['20261022', '1331']);
  });

  it('refuses a place that is not a time', async () => {
    const { body: created } = await create({ baseUrl: 'https://api.example.com', authType: 'query', authParamName: 'serviceKey', authValue: KEY });
    const res = await resolve(created.id, { path: '/air?host={{host}}' });
    expect(res.status).toBe(400);
    expect(requested).toEqual([]);
  });
});
