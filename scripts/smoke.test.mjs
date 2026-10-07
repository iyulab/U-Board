import { test } from 'node:test';
import assert from 'node:assert/strict';
import { smoke, CHECKS } from './smoke.mjs';

const CONSOLE_CSP = "script-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'";
const SHARE_CSP = "script-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors https:";
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
const html = csp => extra => new Response('<!doctype html>', { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Content-Security-Policy': csp, ...extra } });

/** A fake installation answering the way the server does; `override` changes one path's answer. */
function installation(override = {}) {
  const answers = {
    '/health': () => json(200, { status: 'ok' }),
    '/api/auth/me': () => json(401, { code: 'UNAUTHENTICATED' }),
    '/api/no-such-route': () => json(404, { code: 'NOT_FOUND' }),
    '/': () => html(CONSOLE_CSP)(),
    '/boards': () => html(CONSOLE_CSP)(),
    '/share/': () => html(SHARE_CSP)({ 'Referrer-Policy': 'no-referrer' }),
    '/share?board=smoke': () => new Response(null, { status: 301, headers: { Location: '/share/?board=smoke' } }),
    '/assets/smoke-missing.js': () => new Response('not found', { status: 404 }),
    ...override,
  };
  const requested = [];
  const fetchImpl = async url => {
    const { pathname, search } = new URL(url);
    requested.push(pathname + search);
    return answers[pathname + search]();
  };
  return { fetchImpl, requested };
}

test('passes an installation that answers as the image does, asking each path once', async () => {
  const { fetchImpl, requested } = installation();
  const results = await smoke('https://board.example.com/', fetchImpl);
  assert.deepEqual(results.filter(r => r.problem), []);
  assert.deepEqual(requested, CHECKS.map(c => c.path));
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
