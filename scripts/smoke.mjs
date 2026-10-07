#!/usr/bin/env node
// smoke.mjs
// Checks a running installation from the outside, the way it is reached — run it after deploying
// the image. It changes nothing: every request is a GET to a public path.
//
// Usage:
//   npm run smoke -- https://board.example.com     # exit 1 when any check fails
//
// The first request may wait on a server starting from zero instances, so each one allows a minute.

import { pathToFileURL } from 'node:url';

const TIMEOUT_MS = 60_000;

/** Each check: a name, the request, and what is wrong with the response (`undefined` when nothing). */
export const CHECKS = [
  {
    name: 'health',
    path: '/health',
    expect: async res => (res.status !== 200 ? `status ${res.status}` : (await res.json()).status !== 'ok' ? 'body is not {"status":"ok"}' : undefined),
  },
  {
    name: 'API refuses without a session',
    path: '/api/auth/me',
    expect: res => expectJson(res, 401) ?? (!/no-store/.test(res.headers.get('cache-control') ?? '') ? 'API response is cacheable' : undefined),
  },
  {
    name: 'unknown API path is a JSON 404',
    path: '/api/no-such-route',
    expect: res => expectJson(res, 404),
  },
  {
    name: 'console',
    path: '/',
    headers: { Accept: 'text/html' },
    expect: res => expectHtml(res) ?? (!/frame-ancestors 'none'/.test(res.headers.get('content-security-policy') ?? '') ? "console may be framed (no frame-ancestors 'none')" : undefined),
  },
  {
    name: 'console route loads the console',
    path: '/boards',
    headers: { Accept: 'text/html' },
    expect: res => expectHtml(res),
  },
  {
    name: 'share viewer',
    path: '/share/',
    headers: { Accept: 'text/html' },
    expect: res => expectHtml(res) ?? (res.headers.get('referrer-policy') !== 'no-referrer' ? 'share viewer leaks its URL in Referer (no Referrer-Policy: no-referrer)' : undefined),
  },
  {
    name: 'share link without the trailing slash',
    path: '/share?board=smoke',
    expect: res =>
      res.status !== 301 ? `status ${res.status}` : res.headers.get('location') !== '/share/?board=smoke' ? `redirects to ${res.headers.get('location')}` : undefined,
  },
  {
    name: 'missing build file is a 404, not the console',
    path: '/assets/smoke-missing.js',
    headers: { Accept: '*/*' },
    expect: res => (res.status !== 404 ? `status ${res.status}` : undefined),
  },
];

function expectJson(res, status) {
  if (res.status !== status) return `status ${res.status}`;
  if (!(res.headers.get('content-type') ?? '').startsWith('application/json')) return `content-type ${res.headers.get('content-type')}`;
  return undefined;
}

function expectHtml(res) {
  if (res.status !== 200) return `status ${res.status}`;
  if (!(res.headers.get('content-type') ?? '').startsWith('text/html')) return `content-type ${res.headers.get('content-type')}`;
  if (!/script-src 'self'/.test(res.headers.get('content-security-policy') ?? '')) return "no Content-Security-Policy script-src 'self'";
  return undefined;
}

/** Runs every check against `baseUrl`, one after another (the first may wake the server). */
export async function smoke(baseUrl, fetchImpl = fetch) {
  const base = baseUrl.replace(/\/+$/, '');
  const results = [];
  for (const check of CHECKS) {
    let problem;
    try {
      const res = await fetchImpl(`${base}${check.path}`, {
        headers: check.headers,
        redirect: 'manual',
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      problem = await check.expect(res);
    } catch (err) {
      problem = `request failed: ${err.message}`;
    }
    results.push({ name: check.name, path: check.path, problem });
  }
  return results;
}

async function main() {
  const baseUrl = process.argv[2];
  if (!baseUrl || !/^https?:\/\//.test(baseUrl)) {
    console.error('usage: npm run smoke -- <base-url>   (e.g. https://board.example.com)');
    process.exit(2);
  }
  const results = await smoke(baseUrl);
  for (const r of results) console.log(`${r.problem ? 'FAIL' : 'ok  '}  ${r.name} (${r.path})${r.problem ? ` — ${r.problem}` : ''}`);
  const failed = results.filter(r => r.problem).length;
  console.log(failed > 0 ? `\n${failed} of ${results.length} checks failed.` : `\nAll ${results.length} checks passed.`);
  // Not `process.exit()`: it can cut off sockets that are still closing (Node on Windows aborts on it).
  process.exitCode = failed > 0 ? 1 : 0;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
