import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import request from 'supertest';
import type express from 'express';
import { createTestDb } from './test-support/test-db.js';
import { createApp } from './app.js';

const SECRET = 'test-secret-at-least-16-chars';
let root: string;
let app: express.Express;

function writeBuild(dir: string, title: string) {
  mkdirSync(path.join(dir, 'assets'), { recursive: true });
  writeFileSync(path.join(dir, 'index.html'), `<!doctype html><title>${title}</title>`);
  writeFileSync(path.join(dir, 'assets', 'index-abc123.js'), `console.log(${JSON.stringify(title)});`);
}

beforeAll(async () => {
  root = mkdtempSync(path.join(tmpdir(), 'u-board-web-apps-'));
  writeBuild(path.join(root, 'console'), 'console');
  writeBuild(path.join(root, 'share'), 'share');
  const db = await createTestDb();
  app = createApp({
    db,
    sessionSecret: SECRET,
    webApps: { consoleDir: path.join(root, 'console'), shareDir: path.join(root, 'share') },
  });
});

afterAll(() => {
  rmSync(root, { recursive: true, force: true });
});

describe('serving the console and share viewer next to the API', () => {
  it('serves the console at the root, refusing to be framed', async () => {
    const res = await request(app).get('/').set('Accept', 'text/html');
    expect(res.status).toBe(200);
    expect(res.text).toContain('<title>console</title>');
    expect(res.headers['content-security-policy']).toBe("script-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['cache-control']).toBe('no-cache');
  });

  it("answers a page load of one of the console's own routes with the console", async () => {
    const res = await request(app).get('/boards/b1/edit').set('Accept', 'text/html');
    expect(res.status).toBe(200);
    expect(res.text).toContain('<title>console</title>');
    expect(res.headers['content-security-policy']).toContain("frame-ancestors 'none'");
  });

  it('keeps built assets cacheable for good, since their names change with their content', async () => {
    const res = await request(app).get('/assets/index-abc123.js');
    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toBe('public, max-age=31536000, immutable');
  });

  it('serves the share viewer under /share/, embeddable by HTTPS pages', async () => {
    const res = await request(app).get('/share/?board=b1&token=t').set('Accept', 'text/html');
    expect(res.status).toBe(200);
    expect(res.text).toContain('<title>share</title>');
    expect(res.headers['content-security-policy']).toBe("script-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors https:");
    expect(res.headers['referrer-policy']).toBe('no-referrer');
    const asset = await request(app).get('/share/assets/index-abc123.js');
    expect(asset.text).toContain('"share"');
  });

  it('redirects /share to /share/, keeping the board and token', async () => {
    const res = await request(app).get('/share?board=b1&token=t');
    expect(res.status).toBe(301);
    expect(res.headers.location).toBe('/share/?board=b1&token=t');
    expect((await request(app).get('/share')).headers.location).toBe('/share/');
  });

  it('never answers an API path with the console', async () => {
    const res = await request(app).get('/api/no-such-thing').set('Accept', 'text/html');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ code: 'NOT_FOUND' });
    const api = await request(app).get('/api/auth/bootstrap-status');
    expect(api.status).toBe(200);
    expect(api.body).toEqual({ hasAnyUser: false });
  });

  it('leaves the health check, non-page requests and unknown share files alone', async () => {
    expect((await request(app).get('/health')).body).toEqual({ status: 'ok' });
    expect((await request(app).post('/boards').set('Accept', 'text/html')).status).toBe(404);
    expect((await request(app).get('/boards').set('Accept', 'application/json')).status).toBe(404);
    expect((await request(app).get('/share/missing.js').set('Accept', 'text/html')).status).toBe(404);
  });

  it("answers a file the build doesn't have with 404, not the console — however the browser asks", async () => {
    // What a tab still holding the previous build's file names asks for after a redeploy.
    const res = await request(app).get('/assets/index-oldhash.js').set('Accept', '*/*');
    expect(res.status).toBe(404);
    expect((await request(app).get('/favicon.ico').set('Accept', '*/*')).status).toBe(404);
    expect((await request(app).get('/')).headers['x-powered-by']).toBeUndefined();
  });

  it('takes the list of pages allowed to embed the share viewer', async () => {
    const db = await createTestDb();
    const intranet = createApp({
      db,
      sessionSecret: SECRET,
      webApps: {
        consoleDir: path.join(root, 'console'),
        shareDir: path.join(root, 'share'),
        shareFrameAncestors: 'http://hmi.example.com https:',
      },
    });
    const res = await request(intranet).get('/share/');
    expect(res.headers['content-security-policy']).toContain('frame-ancestors http://hmi.example.com https:');
  });
});

describe('without the web apps', () => {
  it('serves the API alone', async () => {
    const db = await createTestDb();
    const apiOnly = createApp({ db, sessionSecret: SECRET });
    expect((await request(apiOnly).get('/').set('Accept', 'text/html')).status).toBe(404);
    expect((await request(apiOnly).get('/api/auth/bootstrap-status')).status).toBe(200);
  });
});
