import { test } from 'node:test';
import assert from 'node:assert/strict';
import { smoke, pageAssets, CHECKS } from './smoke.mjs';

const CONSOLE_CSP = "script-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'";
const SHARE_CSP = "script-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors https:";
const CONSOLE_HTML = '<!doctype html><script type="module" crossorigin src="/assets/index-a1.js"></script><link rel="stylesheet" crossorigin href="/assets/index-a1.css">';
const SHARE_HTML = '<!doctype html><link rel="icon" href="./favicon.svg"><script type="module" crossorigin src="./assets/index-b2.js"></script>';
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
const html = (csp, body = CONSOLE_HTML) => extra => new Response(body, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Content-Security-Policy': csp, ...extra } });
const file = type => () => new Response('/* built */', { status: 200, headers: { 'Content-Type': type } });
const notFound = () => new Response('not found', { status: 404 });

/** A fake installation answering the way the server does; `override` changes one path's answer. */
function installation(override = {}) {
  const answers = {
    '/health': () => json(200, { status: 'ok' }),
    '/api/auth/me': () => json(401, { code: 'UNAUTHENTICATED' }),
    '/api/no-such-route': () => json(404, { code: 'NOT_FOUND' }),
    '/': () => html(CONSOLE_CSP)(),
    '/assets/index-a1.js': file('text/javascript; charset=utf-8'),
    '/assets/index-a1.css': file('text/css; charset=utf-8'),
    '/boards': () => html(CONSOLE_CSP)(),
    '/share/': () => html(SHARE_CSP, SHARE_HTML)({ 'Referrer-Policy': 'no-referrer' }),
    '/share/assets/index-b2.js': file('text/javascript; charset=utf-8'),
    '/share?board=smoke': () => new Response(null, { status: 301, headers: { Location: '/share/?board=smoke' } }),
    '/assets/smoke-missing.js': notFound,
    ...override,
  };
  const requested = [];
  const fetchImpl = async url => {
    const { pathname, search } = new URL(url);
    requested.push(pathname + search);
    return (answers[pathname + search] ?? notFound)();
  };
  return { fetchImpl, requested };
}

test('passes an installation that answers as the image does, asking each path once', async () => {
  const { fetchImpl, requested } = installation();
  const results = await smoke('https://board.example.com/', fetchImpl);
  assert.deepEqual(results.filter(r => r.problem), []);
  assert.deepEqual(requested, [
    '/health',
    '/api/auth/me',
    '/api/no-such-route',
    '/',
    '/assets/index-a1.js',
    '/assets/index-a1.css',
    '/boards',
    '/share/',
    '/share/assets/index-b2.js',
    '/share?board=smoke',
    '/assets/smoke-missing.js',
  ]);
  assert.deepEqual(
    results.map(r => r.path),
    CHECKS.map(c => c.path),
  );
});

test('names what is wrong', async () => {
  const { fetchImpl } = installation({
    '/': () => html("script-src 'self'")(),
    '/api/no-such-route': () => html(CONSOLE_CSP)(),
    '/health': () => {
      throw new Error('connect ECONNREFUSED');
    },
  });
  const problems = Object.fromEntries((await smoke('https://board.example.com', fetchImpl)).filter(r => r.problem).map(r => [r.path, r.problem]));
  assert.deepEqual(problems, {
    '/health': 'request failed: connect ECONNREFUSED',
    '/api/no-such-route': 'status 200',
    '/': "console may be framed (no frame-ancestors 'none')",
  });
});

// The page is served from an edge cache that outlived the deploy: it points at the build before it.
test('fails a page whose scripts or stylesheets are not there', async () => {
  const { fetchImpl } = installation({
    '/assets/index-a1.css': notFound,
    '/share/assets/index-b2.js': () => html(SHARE_CSP, '<!doctype html>')(),
  });
  const problems = Object.fromEntries((await smoke('https://board.example.com', fetchImpl)).filter(r => r.problem).map(r => [r.path, r.problem]));
  assert.match(problems['/'], /^\/assets\/index-a1\.css: status 404 — /);
  assert.match(problems['/'], /cache/);
  assert.equal(problems['/share/'], '/share/assets/index-b2.js: content-type text/html; charset=utf-8, not a script');
  assert.equal(Object.keys(problems).length, 2);
});

test('fails a page that loads no script', async () => {
  const { fetchImpl } = installation({ '/': () => html(CONSOLE_CSP, '<!doctype html><div id="root"></div>')() });
  const problems = (await smoke('https://board.example.com', fetchImpl)).filter(r => r.problem);
  assert.deepEqual(
    problems.map(r => [r.path, r.problem]),
    [['/', 'the page loads no script']],
  );
});

test('finds the scripts and stylesheets a page loads from its own origin', () => {
  const page = 'https://board.example.com/share/?board=1';
  const markup = `
    <link rel="icon" href="./favicon.svg" type="image/svg+xml" />
    <script type="module" crossorigin src="./assets/index-b2.js"></script>
    <script>inline()</script>
    <script src='https://cdn.example.net/lib.js'></script>
    <link rel="stylesheet" href="/assets/app.css">
    <link href="./assets/late.css" rel="stylesheet" crossorigin>
    <link rel="modulepreload" href="./assets/chunk.js">`;
  assert.deepEqual(pageAssets(markup, page), [
    { url: 'https://board.example.com/share/assets/index-b2.js', kind: 'script' },
    { url: 'https://board.example.com/assets/app.css', kind: 'stylesheet' },
    { url: 'https://board.example.com/share/assets/late.css', kind: 'stylesheet' },
  ]);
});
