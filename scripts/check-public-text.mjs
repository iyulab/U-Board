#!/usr/bin/env node
// check-public-text.mjs
// Fails when a tracked file carries context that belongs to the maintainers' private workspace
// rather than to this public repository: work-tracking ids, paths into private notes or a local
// machine, and hostnames of real deployments.
//
// Hosts are checked the other way round from the rest: instead of listing hosts that must not
// appear (a list that would itself publish them), every hostname found must be a reserved example
// domain, loopback, or on the repository's own allowlist — `public-text.json` at its root:
//
//   { "hosts": ["github.com", ...], "githubRepos": ["owner/repo", ...] }
//
// `githubRepos` limits github.com links to those repositories. A new legitimate link means
// extending that file in the same change.
//
// This script is kept identical in every repository that runs it; only `public-text.json` differs.
//
// Usage:
//   node scripts/check-public-text.mjs     # exit 1 and list every violation

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

// Reserved for documentation (RFC 2606 / RFC 6761) and loopback.
const EXAMPLE_HOST = /(^|\.)example\.(com|org|net)$|^localhost$|^127\.0\.0\.1$|^0\.0\.0\.0$/;

const CONFIG_FILE = 'public-text.json';

// Generated or self-referential files: lockfiles (at any depth) list registry and funding URLs, and
// this checker, its tests and its allowlist necessarily spell out what they look for.
const LOCKFILE = /(^|\/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock)$/;
const SKIPPED_PATHS = new Set([CONFIG_FILE, 'scripts/check-public-text.mjs', 'scripts/check-public-text.test.mjs']);
const BINARY_EXTENSION = /\.(png|jpe?g|gif|webp|ico|woff2?|ttf|otf|pdf|zip|gz)$/i;
// Test-runner snapshots are generated, with the runner's own header link.
const GENERATED = /\.snap$/;
// Ignore files legitimately name the private directories they keep out of the repository.
const IGNORE_FILE = /(^|\/)\.[a-z]*ignore$/;

const PATTERNS = [
  { rule: 'tracking-id', re: /\bHD-\d+\b|\bBD-\d{8}(?:-\d+)?\b|\bcycle-\d+\b|\bdocket\s+#?\d+/gi },
  { rule: 'internal-path', re: /~\/\.claude\b|(?:^|[\s`'"(/])\.claude\/|\bclaudedocs\b/g, skipInIgnoreFiles: true },
  { rule: 'local-path', re: /\b[A-Za-z]:\\[A-Za-z]|\b[A-Za-z]:\/(?:Users|data|home)\b|\/(?:Users|home)\/[a-z][\w.-]*\//g },
];

const URL_HOST = /\bhttps?:\/\/([A-Za-z0-9.-]+)(?::\d+)?(\/[^\s'"`)<>\]]*)?/gi;
// A bare hostname: lower-case dotted labels ending in a common public TLD. Lower case only, so a
// product name such as "ASP.NET" is not read as a host; a host in a URL is matched in any case.
const BARE_HOST = /\b(?:[a-z0-9-]+\.)+(?:com|net|org|io|dev|app|cloud|ai|co|kr)\b/g;

export function isScannedPath(path) {
  return !SKIPPED_PATHS.has(path) && !LOCKFILE.test(path) && !GENERATED.test(path) && !BINARY_EXTENSION.test(path);
}

/** The allowlist as `scanText` uses it — lower-cased sets. */
export function allowlist({ hosts = [], githubRepos = [] } = {}) {
  return {
    hosts: new Set(hosts.map(h => h.toLowerCase())),
    githubRepos: new Set(githubRepos.map(r => r.toLowerCase())),
  };
}

function hostAllowed(host, allow) {
  const h = host.toLowerCase();
  return EXAMPLE_HOST.test(h) || allow.hosts.has(h);
}

function githubRepo(path) {
  const [owner, repo] = (path ?? '').split(/[?#]/)[0].split('/').filter(Boolean);
  return owner && repo ? `${owner}/${repo.replace(/\.git$/, '')}`.toLowerCase() : undefined;
}

/** Every violation in one file's text, in line order. `allow` comes from `allowlist`. */
export function scanText(path, text, allow) {
  const violations = [];
  const ignoreFile = IGNORE_FILE.test(path);
  text.split(/\r?\n/).forEach((lineText, index) => {
    const line = index + 1;
    const found = [];
    for (const { rule, re, skipInIgnoreFiles } of PATTERNS) {
      if (skipInIgnoreFiles && ignoreFile) continue;
      for (const m of lineText.matchAll(re)) found.push({ at: m.index, rule, match: m[0].trim() });
    }
    const urlSpans = [];
    for (const m of lineText.matchAll(URL_HOST)) {
      urlSpans.push([m.index, m.index + m[0].length]);
      const host = m[1];
      if (!hostAllowed(host, allow)) {
        found.push({ at: m.index, rule: 'host', match: host });
      } else if (host.toLowerCase() === 'github.com') {
        const repo = githubRepo(m[2]);
        if (repo && !allow.githubRepos.has(repo)) found.push({ at: m.index, rule: 'github-repo', match: repo });
      }
    }
    for (const m of lineText.matchAll(BARE_HOST)) {
      if (urlSpans.some(([start, end]) => m.index >= start && m.index < end)) continue; // already checked as a URL
      if (!hostAllowed(m[0], allow)) found.push({ at: m.index, rule: 'host', match: m[0] });
    }
    found.sort((a, b) => a.at - b.at);
    for (const { rule, match } of found) violations.push({ path, line, rule, match });
  });
  return violations;
}

function main() {
  const allow = allowlist(JSON.parse(readFileSync(CONFIG_FILE, 'utf8')));
  const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
  const violations = [];
  for (const path of files.filter(isScannedPath)) {
    const text = readFileSync(path, 'utf8');
    if (text.includes('\0')) continue; // binary without a known extension
    violations.push(...scanText(path, text, allow));
  }
  for (const v of violations) console.error(`${v.path}:${v.line}: [${v.rule}] ${v.match}`);
  if (violations.length > 0) {
    console.error(`\n${violations.length} violation(s). Remove the private context, or — for a legitimate public host or repository — extend the allowlist in ${CONFIG_FILE}.`);
    process.exit(1);
  }
  console.log(`Public text check: ${files.length} tracked files, no violations.`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main();
