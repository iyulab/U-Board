import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import type { DbClient } from '../db.js';
import { createTestDb } from '../test-support/test-db.js';
import { createApp } from '../app.js';
import { createUser } from '../db/users.js';
import { createWorkspace, addWorkspaceUser } from '../db/workspaces.js';
import { signSession } from '../auth/session.js';
import { SESSION_COOKIE_NAME } from '../middleware/require-auth.js';

// A source that answers, but not in a form a binding reads: public APIs answer XML unless asked for
// JSON, and some report an error (a bad key, a range out of bounds) in a 200 body.

const SECRET = 'test-secret-at-least-16-chars';
const XML_ERROR = '<RESULT><CODE>ERROR-335</CODE><MESSAGE>The sample key reads at most 5 rows.</MESSAGE></RESULT>';
let db: DbClient;
let workspaceId: string;
let ownerCookie: string;
let answer: () => Response;

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

function test(path: string) {
  return request(app()).post(`/api/workspaces/${workspaceId}/connectors/test`).set('Cookie', ownerCookie)
    .send({ baseUrl: 'http://open.example.com', authType: 'none', path });
}

async function connector() {
  const { body } = await request(app()).post(`/api/workspaces/${workspaceId}/connectors`).set('Cookie', ownerCookie)
    .send({ name: 'Open', baseUrl: 'http://open.example.com', authType: 'none' });
  return body.id as string;
}

describe('a connection test', () => {
  it('fails an XML answer as an unreadable format and shows what came back', async () => {
    answer = () => new Response(XML_ERROR, { headers: { 'Content-Type': 'application/xml;charset=UTF-8' } });
    const { body } = await test('/sample/xml/RealtimeCityAir/1/50/');
    expect(body).toMatchObject({ ok: false, stage: 'response', reason: 'format', message: 'the response is application/xml, not JSON' });
    expect(body.excerpt).toBe(XML_ERROR);
  });

  it('fails an HTML page — usually a login or error page — the same way', async () => {
    answer = () => new Response('<!doctype html><title>Sign in</title>', { headers: { 'Content-Type': 'text/html' } });
    expect((await test('/data')).body).toMatchObject({ ok: false, reason: 'format' });
  });

  it('passes JSON and shows its start, so an error answered with 200 can be seen', async () => {
    answer = () => new Response(JSON.stringify({ RESULT: { CODE: 'ERROR-500', MESSAGE: 'Server error' } }), { headers: { 'Content-Type': 'application/json' } });
    const { body } = await test('/sample/json/NoSuchService/1/2/');
    expect(body).toEqual({ ok: true, excerpt: '{"RESULT":{"CODE":"ERROR-500","MESSAGE":"Server error"}}' });
  });

  it('cuts a long answer short', async () => {
    answer = () => new Response(JSON.stringify({ rows: 'x'.repeat(1000) }), { headers: { 'Content-Type': 'application/json' } });
    const { body } = await test('/rows');
    expect(body.excerpt).toHaveLength(401);
    expect(body.excerpt.endsWith('…')).toBe(true);
  });
});

describe('a binding', () => {
  it('reads an XML answer as a format problem, not as a value missing at the source, and logs no body', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    answer = () => new Response(XML_ERROR, { headers: { 'Content-Type': 'application/xml' } });
    const id = await connector();
    const { body } = await request(app()).post(`/api/workspaces/${workspaceId}/connectors/${id}/resolve`).set('Cookie', ownerCookie)
      .send({ ref: { path: '/sample/xml/RealtimeCityAir/1/2/', valuePath: '/RealtimeCityAir/row/0/PM' } });
    expect(body).toEqual({ quality: 'disconnected', reason: 'format' });
    expect(JSON.stringify(warn.mock.calls)).not.toContain('ERROR-335');
    warn.mockRestore();
  });

  it('reads plain text whole, and a value path into it as a format problem', async () => {
    answer = () => new Response('running', { headers: { 'Content-Type': 'text/plain' } });
    const id = await connector();
    const resolve = (ref: unknown) => request(app()).post(`/api/workspaces/${workspaceId}/connectors/${id}/resolve`).set('Cookie', ownerCookie).send({ ref });
    expect((await resolve({ path: '/pump/state' })).body).toMatchObject({ value: 'running', quality: 'live' });
    expect((await resolve({ path: '/pump/state', valuePath: '/status' })).body).toEqual({ quality: 'disconnected', reason: 'format' });
  });
});
