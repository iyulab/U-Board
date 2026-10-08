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

/**
 * Each check: a name, the request, and what is wrong with the response (`undefined` when nothing).
 * `expect` also gets the page's URL and a `get` for what that page itself loads.
 */
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
    expect: async (res, page) =>
      expectHtml(res) ??
      (!/frame-ancestors 'none'/.test(res.headers.get('content-security-policy') ?? '') ? "console may be framed (no frame-ancestors 'none')" : undefined) ??
      (await expectAssets(res, page)),
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
    expect: async (res, page) =>
      expectHtml(res) ??
      (res.headers.get('referrer-policy') !== 'no-referrer' ? 'share viewer leaks its URL in Referer (no Referrer-Policy: no-referrer)' : undefined) ??
      (await expectAssets(res, page)),
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

/**
 * The scripts and stylesheets an HTML page loads from its own origin, resolved against the page's
 * URL. Other origins, inline scripts, icons and preloads are left out — the page renders without
 * checking them, or they are someone else's to serve.
 */
export function pageAssets(html, pageUrl) {
  const { origin } = new URL(pageUrl);
  const assets = [];
  const attr = (tag, name) => tag.match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'))?.slice(1).find(v => v !== undefined);
  for (const [tag, name] of html.matchAll(/<(script|link)\b[^>]*>/gi)) {
    const kind = name.toLowerCase() === 'script' ? 'script' : attr(tag, 'rel')?.toLowerCase() === 'stylesheet' ? 'stylesheet' : undefined;
    const ref = kind === 'script' ? attr(tag, 'src') : kind ? attr(tag, 'href') : undefined;
    if (!ref) continue;
    const url = new URL(ref, pageUrl);
    if (url.origin === origin) assets.push({ url: url.href, kind });
  }
  return assets;
}

/**
 * What is wrong with what an HTML page loads. A page whose build files are gone is the page an edge
 * cache kept from the previous deploy (the hashed file names change with every build), or a broken
 * build — either way it renders nothing.
 */
async function expectAssets(res, page) {
  const assets = pageAssets(await res.text(), page.url);
  if (!assets.some(a => a.kind === 'script')) return 'the page loads no script';
  for (const { url, kind } of assets) {
    const asset = await page.get(url);
    await asset.body?.cancel();
    const { pathname } = new URL(url);
    if (asset.status !== 200) return `${pathname}: status ${asset.status} — the page points at build files that are not there (an edge cache still holding the page from before the last deploy?)`;
    const type = asset.headers.get('content-type') ?? '';
    if (!(kind === 'script' ? /javascript/ : /^text\/css/).test(type)) return `${pathname}: content-type ${type}, not a ${kind}`;
  }
  return undefined;
}

/** Runs every check against `baseUrl`, one after another (the first may wake the server). */
export async function smoke(baseUrl, fetchImpl = fetch) {
  const base = baseUrl.replace(/\/+$/, '');
  const get = (url, headers) => fetchImpl(url, { headers, redirect: 'manual', signal: AbortSignal.timeout(TIMEOUT_MS) });
  const results = [];
  for (const check of CHECKS) {
    let problem;
    try {
      const url = `${base}${check.path}`;
      const res = await get(url, check.headers);
      problem = await check.expect(res, { url, get: assetUrl => get(assetUrl, { Accept: '*/*' }) });
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
