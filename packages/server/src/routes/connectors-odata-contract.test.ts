import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { createServer, type IncomingMessage, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import request from 'supertest';
import type express from 'express';
import type { DbClient } from '../db.js';
import { createTestDb } from '../test-support/test-db.js';
import { createApp } from '../app.js';
import { createUser } from '../db/users.js';
import { createWorkspace, addWorkspaceUser } from '../db/workspaces.js';
import { signSession } from '../auth/session.js';
import { SESSION_COOKIE_NAME } from '../middleware/require-auth.js';

// The generic HTTP connector against a data source shaped like a typical OData v4 service behind
// OAuth 2.0 client credentials — real sockets and real `fetch`, no mocks — so the whole path a
// binding takes (token grant, query encoding, response shape, failure answers) is exercised the
// way a real integration would exercise it.

const SECRET = 'test-secret-at-least-16-chars';
const ASSETS = [
  { AssetNo: 'P-101', Status: 'Running', Temp: 71.5 },
  { AssetNo: 'P-102', Status: 'Fault', Temp: null },
];

const source = {
  server: undefined as unknown as Server,
  origin: '',
  issued: [] as string[],
  revoked: new Set<string>(),
  tokenRequests: [] as { authorization?: string; contentType?: string; body: string }[],
  dataRequests: [] as { url: string; authorization?: string }[],
};

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise(resolve => {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => resolve(body));
  });
}

function odataJson(res: import('node:http').ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; odata.metadata=minimal; odata.streaming=true');
  res.end(JSON.stringify(body));
}

beforeAll(async () => {
  source.server = createServer(async (req, res) => {
    const url = new URL(req.url!, 'http://localhost');
    if (req.method === 'POST' && url.pathname === '/auth/token') {
      const body = await readBody(req);
      source.tokenRequests.push({ authorization: req.headers.authorization, contentType: req.headers['content-type'], body });
      const token = `tok-${source.issued.length + 1}`;
      source.issued.push(token);
      odataJson(res, 200, { access_token: token, token_type: 'Bearer', expires_in: 3600 });
      return;
    }
    const bearer = req.headers.authorization?.replace(/^Bearer /, '');
    source.dataRequests.push({ url: req.url!, authorization: req.headers.authorization });
    if (!bearer || !source.issued.includes(bearer) || source.revoked.has(bearer)) {
      odataJson(res, 401, { error: { code: 'UNAUTHORIZED', message: 'token required' } });
      return;
    }
    if (url.pathname === '/data/Busy') {
      res.setHeader('Retry-After', '30');
      odataJson(res, 429, { error: { code: 'TooManyRequests' } });
      return;
    }
    const byKey = url.pathname.match(/^\/data\/Assets\('([^']+)'\)$/);
    if (byKey) {
      const asset = ASSETS.find(a => a.AssetNo === byKey[1]);
      if (!asset) odataJson(res, 404, { error: { code: 'KeyNotFound', message: 'no row with that key' } });
      else odataJson(res, 200, { '@odata.context': '$metadata#Assets/$entity', ...asset });
      return;
    }
    if (url.pathname === '/data/Broken') {
      // A 400 from something in front of the service (a proxy, a gateway) — not an OData error body.
      res.statusCode = 400;
      res.setHeader('Content-Type', 'text/plain');
      res.end('Bad Request');
      return;
    }
    // OData v4 answers a query naming a property the entity type does not have with 400 and an
    // error whose target is that property (OData JSON Format, "Error Response").
    const unknownProperty = (url.searchParams.get('$select') ?? '').split(',').find(p => p && !(p in ASSETS[0]));
    if (url.pathname === '/data/Assets' && unknownProperty) {
      odataJson(res, 400, {
        error: { code: 'BadRequest', message: `Could not find a property named '${unknownProperty}' on type 'Asset'.`, target: unknownProperty },
      });
      return;
    }
    if (url.pathname === '/data/Assets') {
      const filter = url.searchParams.get('$filter')?.match(/^AssetNo eq '([^']+)'$/);
      const value = filter ? ASSETS.filter(a => a.AssetNo === filter[1]) : ASSETS;
      odataJson(res, 200, {
        '@odata.context': '$metadata#Assets',
        ...(url.searchParams.get('$count') === 'true' ? { '@odata.count': value.length } : {}),
        value,
      });
      return;
    }
    odataJson(res, 404, { error: { code: 'NotFound' } });
  });
  await new Promise<void>(resolve => source.server.listen(0, '127.0.0.1', resolve));
  source.origin = `http://127.0.0.1:${(source.server.address() as AddressInfo).port}`;
});

afterAll(() => new Promise<void>(resolve => source.server.close(() => resolve())));

let db: DbClient;
let app: express.Express;
let workspaceId: string;
let memberCookie: string;
let connectorId: string;

function cookieFor(userId: string, activeWorkspaceId: string) {
  return `${SESSION_COOKIE_NAME}=${signSession({ userId, activeWorkspaceId, issuedAt: Date.now() }, SECRET)}`;
}

function resolve(ref: { path: string; valuePath?: string }) {
  return request(app)
    .post(`/workspaces/${workspaceId}/connectors/${connectorId}/resolve`)
    .set('Cookie', memberCookie)
    .send({ ref })
    .then(res => res.body);
}

beforeEach(async () => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  source.issued.length = 0;
  source.revoked.clear();
  source.tokenRequests.length = 0;
  source.dataRequests.length = 0;

  db = await createTestDb();
  app = createApp({ db, sessionSecret: SECRET });
  const owner = await createUser(db, { email: 'owner@example.com', passwordHash: 'h', name: 'Owner' });
  const member = await createUser(db, { email: 'member@example.com', passwordHash: 'h', name: 'Member' });
  const workspace = await createWorkspace(db, 'W1');
  await addWorkspaceUser(db, { workspaceId: workspace.id, userId: owner.id, role: 'owner' });
  await addWorkspaceUser(db, { workspaceId: workspace.id, userId: member.id, role: 'member' });
  workspaceId = workspace.id;
  memberCookie = cookieFor(member.id, workspace.id);

  const created = await request(app)
    .post(`/workspaces/${workspaceId}/connectors`)
    .set('Cookie', cookieFor(owner.id, workspace.id))
    .send({
      name: 'Asset register', baseUrl: `${source.origin}/data`, authType: 'oauth2-client-credentials',
      oauthTokenUrl: `${source.origin}/auth/token`, oauthClientId: 'board-reader', authValue: 's3cret:with/chars',
      oauthScope: 'asset.read',
    });
  expect(created.status).toBe(201);
  connectorId = created.body.id;
});

describe('generic HTTP connector against an OData v4 source behind OAuth 2.0 client credentials', () => {
  it('reads one entity picked by $filter, with the grant and the query sent as the standards expect', async () => {
    const result = await resolve({ path: "/Assets?$filter=AssetNo eq 'P-102'&$select=AssetNo,Status", valuePath: 'value.0.Status' });
    expect(result).toEqual({ value: 'Fault', quality: 'live', observedAt: expect.any(String) });

    // RFC 6749 §4.4 with HTTP Basic client authentication (§2.3.1: form-encoded, then base64).
    expect(source.tokenRequests).toHaveLength(1);
    const [grant] = source.tokenRequests;
    expect(grant.contentType).toBe('application/x-www-form-urlencoded');
    expect(new URLSearchParams(grant.body).get('grant_type')).toBe('client_credentials');
    expect(new URLSearchParams(grant.body).get('scope')).toBe('asset.read');
    expect(grant.authorization).toBe(`Basic ${Buffer.from('board-reader:s3cret%3Awith%2Fchars').toString('base64')}`);

    // The OData system query reaches the source intact, and with the issued token.
    const [data] = source.dataRequests;
    expect(new URL(data.url, 'http://localhost').searchParams.get('$filter')).toBe("AssetNo eq 'P-102'");
    expect(data.authorization).toBe('Bearer tok-1');
  });

  it('reads an entity by key, and reports an unknown key as a binding that points nowhere', async () => {
    expect(await resolve({ path: "/Assets('P-101')", valuePath: 'Status' })).toEqual({ value: 'Running', quality: 'live', observedAt: expect.any(String) });
    expect(await resolve({ path: "/Assets('P-999')", valuePath: 'Status' })).toEqual({ quality: 'disconnected', reason: 'address' });
  });

  it('reports a property the source does not have (a renamed field) as a binding that points nowhere', async () => {
    expect(await resolve({ path: '/Assets?$select=AssetNo,Statuss', valuePath: '/value/0/Statuss' }))
      .toEqual({ quality: 'disconnected', reason: 'address' });
  });

  it('keeps a 400 that is not an OData error a transport failure', async () => {
    expect(await resolve({ path: '/Broken', valuePath: '/x' })).toEqual({ quality: 'disconnected', reason: 'transport' });
  });

  it('reports a $filter that matches nothing as a binding that points nowhere, not as a live empty value', async () => {
    expect(await resolve({ path: "/Assets?$filter=AssetNo eq 'P-999'", valuePath: 'value.0.Status' }))
      .toEqual({ quality: 'disconnected', reason: 'address' });
  });

  it('reads a count through a JSON Pointer, whose key contains a dot', async () => {
    expect(await resolve({ path: "/Assets?$filter=AssetNo eq 'P-101'&$count=true&$top=0", valuePath: '/@odata.count' }))
      .toEqual({ value: 1, quality: 'live', observedAt: expect.any(String) });
  });

  it('keeps a null the source sent as a live value', async () => {
    expect(await resolve({ path: "/Assets('P-102')", valuePath: 'Temp' })).toEqual({ value: null, quality: 'live', observedAt: expect.any(String) });
  });

  it('serves many bindings on one collection with one token grant and one data request', async () => {
    const results = await Promise.all(ASSETS.map((_, i) => resolve({ path: '/Assets', valuePath: `value.${i}.Status` })));
    expect(results).toEqual([{ value: 'Running', quality: 'live', observedAt: expect.any(String) }, { value: 'Fault', quality: 'live', observedAt: expect.any(String) }]);
    expect(source.tokenRequests).toHaveLength(1);
    expect(source.dataRequests).toHaveLength(1);
  });

  it('takes a fresh token and retries once when the source revokes the one in use', async () => {
    expect(await resolve({ path: "/Assets('P-101')", valuePath: 'Status' })).toEqual({ value: 'Running', quality: 'live', observedAt: expect.any(String) });
    source.revoked.add('tok-1');
    expect(await resolve({ path: "/Assets('P-101')", valuePath: 'Status' })).toEqual({ value: 'Running', quality: 'live', observedAt: expect.any(String) });
    expect(source.issued).toEqual(['tok-1', 'tok-2']);
    expect(source.dataRequests.map(r => r.authorization)).toEqual(['Bearer tok-1', 'Bearer tok-1', 'Bearer tok-2']);
  });

  it('reports rate limiting by the source as throttled', async () => {
    expect(await resolve({ path: '/Busy' })).toEqual({ quality: 'disconnected', reason: 'throttled' });
  });
});
