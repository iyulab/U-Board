import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import type { DbClient } from '../db.js';
import { createTestDb } from '../test-support/test-db.js';
import { createApp } from '../app.js';
import { createUser } from '../db/users.js';
import { createWorkspace, addWorkspaceUser } from '../db/workspaces.js';
import { signSession } from '../auth/session.js';
import { SESSION_COOKIE_NAME } from '../middleware/require-auth.js';

// A source that answers an error with success: HTTP 200, and a status of its own in the body. Its owner says
// where (`sourceError`), and a read of such an answer fails with what the source said instead of reading as a
// value missing from it.

const SECRET = 'test-secret-at-least-16-chars';
const KEY = 'owner-key-123';
const REFUSED = { status: 500, code: 'INFO-100', message: `The key ${KEY} is not valid.`, total: 0 };
const ARRIVALS = { errorMessage: { code: 'INFO-000', message: 'OK' }, realtimeArrivalList: [{ subwayId: '1002', arvlMsg2: '3 min' }] };
const SETTING = { path: '/code', messagePath: '/message' };
let db: DbClient;
let workspaceId: string;
let ownerCookie: string;
let answer: () => Response;

const json = (body: unknown) => new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json;charset=utf-8' } });

function app() {
  return createApp({ db, sessionSecret: SECRET, connectorFetch: async () => answer() });
}

beforeEach(async () => {
  db = await createTestDb();
  const owner = await createUser(db, { email: 'owner@x.com', passwordHash: 'h', name: 'Owner' });
  const workspace = await createWorkspace(db, 'W1');
  await addWorkspaceUser(db, { workspaceId: workspace.id, userId: owner.id, role: 'owner' });
  workspaceId = workspace.id;
  ownerCookie = `${SESSION_COOKIE_NAME}=${signSession({ userId: owner.id, activeWorkspaceId: workspace.id, issuedAt: Date.now() }, SECRET)}`;
});

const base = () => `/api/workspaces/${workspaceId}/connectors`;
const create = (body: Record<string, unknown>) =>
  request(app()).post(base()).set('Cookie', ownerCookie).send({ name: 'Subway', baseUrl: 'http://open.example.com/api/{key}', authType: 'path', authValue: KEY, ...body });
const resolve = (id: string, ref: unknown) => request(app()).post(`${base()}/${id}/resolve`).set('Cookie', ownerCookie).send({ ref });
const REF = { path: '/arrivals/City%20Hall', item: { list: '/realtimeArrivalList', where: { subwayId: '1002' } }, valuePath: '/arvlMsg2' };

describe('the setting', () => {
  it('is stored, listed, changed and cleared', async () => {
    const { body: created } = await create({ sourceError: SETTING });
    expect(created.sourceError).toEqual(SETTING);
    expect((await request(app()).get(base()).set('Cookie', ownerCookie)).body.connectors[0].sourceError).toEqual(SETTING);
    const always = { path: '/header/resultCode', ok: ['00'], messagePath: '/header/resultMsg' };
    const { body: changed } = await request(app()).put(`${base()}/${created.id}`).set('Cookie', ownerCookie).send({ sourceError: always });
    expect(changed.sourceError).toEqual(always);
    const { body: renamed } = await request(app()).put(`${base()}/${created.id}`).set('Cookie', ownerCookie).send({ name: 'Renamed' });
    expect(renamed.sourceError, 'left alone when absent').toEqual(always);
    const { body: cleared } = await request(app()).put(`${base()}/${created.id}`).set('Cookie', ownerCookie).send({ sourceError: null });
    expect(cleared).not.toHaveProperty('sourceError');
  });

  it('is refused in any other shape', async () => {
    for (const sourceError of ['/code', { path: 'code' }, { path: '/code', ok: [] }, { path: '/code', unknown: 1 }]) {
      expect((await create({ sourceError })).status, JSON.stringify(sourceError)).toBe(400);
    }
  });
});

describe('a binding on a source that says where it reports errors', () => {
  it('fails with what the source said — its key taken out — instead of a value missing from the answer', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    answer = () => json(REFUSED);
    const { body: connector } = await create({ sourceError: SETTING });
    const { body } = await resolve(connector.id, REF);
    expect(body).toEqual({ quality: 'disconnected', reason: 'source', message: 'The key … is not valid. (INFO-100)' });
    expect(JSON.stringify(warn.mock.calls)).not.toContain(KEY);
    warn.mockRestore();
  });

  it('reads an answer that succeeded as before', async () => {
    answer = () => json(ARRIVALS);
    const { body: connector } = await create({ sourceError: SETTING });
    expect((await resolve(connector.id, REF)).body).toMatchObject({ value: '3 min', quality: 'live' });
  });

  it('without the setting, reads the same answer as a value missing from it — and says so', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    answer = () => json(REFUSED);
    const { body: connector } = await create({});
    const { body } = await resolve(connector.id, REF);
    expect(body).toMatchObject({ quality: 'disconnected', reason: 'address' });
    expect(body.message).toContain('no item of');
    vi.restoreAllMocks();
  });
});

describe('a connection test', () => {
  it('fails on what the source said, and shows the answer', async () => {
    answer = () => json(REFUSED);
    const { body } = await request(app()).post(`${base()}/test`).set('Cookie', ownerCookie)
      .send({ baseUrl: 'http://open.example.com/api/{key}', authType: 'path', authValue: KEY, sourceError: SETTING, path: '/arrivals/x' });
    expect(body).toMatchObject({ ok: false, stage: 'response', reason: 'source', message: 'The key … is not valid. (INFO-100)' });
    expect(body.excerpt).toContain('INFO-100');
    expect(body.excerpt, 'the key the source echoed is taken out').not.toContain(KEY);
  });

  it('shows the start of what a source answered with when it refused the request — its reason is often there', async () => {
    answer = () => new Response(JSON.stringify({ result: { status: 403, message: 'This API needs an application before use.' } }), {
      status: 403, headers: { 'Content-Type': 'application/json' },
    });
    const { body } = await request(app()).post(`${base()}/test`).set('Cookie', ownerCookie)
      .send({ baseUrl: 'http://open.example.com/api/{key}', authType: 'path', authValue: KEY, path: '/stations' });
    expect(body).toMatchObject({ ok: false, stage: 'request', reason: 'auth', status: 403 });
    expect(body.excerpt).toContain('This API needs an application before use.');
  });
});
