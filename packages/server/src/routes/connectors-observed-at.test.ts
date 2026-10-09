import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import type { DbClient } from '../db.js';
import { createTestDb } from '../test-support/test-db.js';
import { createApp } from '../app.js';
import { createUser } from '../db/users.js';
import { createWorkspace, addWorkspaceUser } from '../db/workspaces.js';
import { signSession } from '../auth/session.js';
import { SESSION_COOKIE_NAME } from '../middleware/require-auth.js';

// The time a source says it observed a value, read from the response (`observedAtPath`) — a source that
// publishes hourly is as current as it gets at :50, and a viewer should see the hour it reports, not the
// minute it was fetched.

const SECRET = 'test-secret-at-least-16-chars';
const NOW = Date.parse('2026-10-09T14:30:00Z');
let db: DbClient;
let workspaceId: string;
let ownerCookie: string;
let answer: () => Promise<Response>;

const json = (body: unknown) => new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } });

beforeEach(async () => {
  db = await createTestDb();
  const owner = await createUser(db, { email: 'owner@x.com', passwordHash: 'h', name: 'Owner' });
  const workspace = await createWorkspace(db, 'W1');
  await addWorkspaceUser(db, { workspaceId: workspace.id, userId: owner.id, role: 'owner' });
  workspaceId = workspace.id;
  ownerCookie = `${SESSION_COOKIE_NAME}=${signSession({ userId: owner.id, activeWorkspaceId: workspace.id, issuedAt: Date.now() }, SECRET)}`;
  answer = async () => json({ rows: [{ station: 'north', level: 36, measuredAt: '202610092300' }] });
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => vi.restoreAllMocks());

async function setup(options: { staleMaxAgeMs?: number } = {}) {
  const app = createApp({ db, sessionSecret: SECRET, upstreamReuseMs: 0, connectorFetch: () => answer(), ...options });
  const { body: connector } = await request(app).post(`/api/workspaces/${workspaceId}/connectors`).set('Cookie', ownerCookie)
    .send({ name: 'Air', baseUrl: 'https://air.example.org', authType: 'none' });
  return (ref: unknown) =>
    request(app).post(`/api/workspaces/${workspaceId}/connectors/${connector.id}/resolve`).set('Cookie', ownerCookie).send({ ref });
}

const north = { path: '/air', item: { list: '/rows', where: { station: 'north' } }, valuePath: '/level', observedAtPath: '/measuredAt', timeZone: 'Asia/Seoul' };

describe('a binding that names where the source says when it observed the value', () => {
  it('reports the source’s time as the value’s, in the reference’s time zone', async () => {
    const resolve = await setup();
    vi.spyOn(Date, 'now').mockReturnValue(NOW);
    expect((await resolve(north)).body).toEqual({ value: 36, quality: 'live', observedAt: '2026-10-09T14:00:00.000Z' });
  });

  it('keeps serving a last-known value as stale by when it was read, not by the source’s older time', async () => {
    const resolve = await setup({ staleMaxAgeMs: 60 * 60_000 });
    vi.spyOn(Date, 'now').mockReturnValue(NOW);
    await resolve(north);
    // Fifty minutes after the read — eighty after the source's time, past the limit if counted from it.
    vi.spyOn(Date, 'now').mockReturnValue(NOW + 50 * 60_000);
    answer = async () => { throw new Error('network error'); };
    expect((await resolve(north)).body).toEqual({ value: 36, quality: 'stale', reason: 'transport', observedAt: '2026-10-09T14:00:00.000Z' });
  });

  it('says the time zone is wrong when the source’s time would be later than the read', async () => {
    const resolve = await setup();
    vi.spyOn(Date, 'now').mockReturnValue(NOW);
    const { body } = await resolve({ ...north, timeZone: undefined });
    expect(body).toEqual({ quality: 'disconnected', reason: 'format' });
    expect(console.warn).toHaveBeenLastCalledWith(expect.stringContaining('check the reference\'s timeZone'));
  });

  it('says the binding’s address is wrong when the response has no such field', async () => {
    const resolve = await setup();
    expect((await resolve({ ...north, observedAtPath: '/updatedAt' })).body).toEqual({ quality: 'disconnected', reason: 'address' });
  });

  it('refuses a time zone it does not know and an observed-time path that is not a pointer', async () => {
    const resolve = await setup();
    expect((await resolve({ ...north, timeZone: 'Seoul' })).status).toBe(400);
    expect((await resolve({ ...north, observedAtPath: 'measuredAt' })).status).toBe(400);
  });
});
