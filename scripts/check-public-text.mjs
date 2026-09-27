#!/usr/bin/env node
// check-public-text.mjs
// Fails when a tracked file carries context that belongs to the maintainers' private workspace
// rather than to this public repository: work-tracking ids, paths into private notes or a local
// machine, and hostnames of real deployments.
//
// Hosts are checked the other way round from the rest: instead of listing hosts that must not
// appear (a list that would itself publish them), every hostname found must be on the allowlist
// below — reserved example domains, loopback, and a handful of public services the docs link to.
// A new legitimate link means extending the allowlist in the same change.
//
// Usage:
//   node scripts/check-public-text.mjs     # exit 1 and list every violation

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

// Reserved for documentation (RFC 2606 / RFC 6761) and loopback.
const EXAMPLE_HOST = /(^|\.)example\.(com|org|net)$|^localhost$|^127\.0\.0\.1$|^0\.0\.0\.0$/;

const ALLOWED_HOSTS = new Set([
  'github.com',
  'www.npmjs.com',
  'registry.npmjs.org',
  'www.gnu.org',
  'fsf.org',
  'www.w3.org',
  // Domains of made-up email addresses in test fixtures (`owner@x.com`).
  'x.com',
  'test.com',
]);

// GitHub links may point only at this project's public repositories and its public siblings.
const ALLOWED_GITHUB_REPOS = new Set(['iyulab/u-board', 'iyulab/u-widgets', 'iyulab/canvas-kit']);

// Generated or self-referential files: the lockfile lists registry tarball URLs, and this checker
// and its tests necessarily spell out what they look for.
const SKIPPED_PATHS = new Set(['package-lock.json', 'scripts/check-public-text.mjs', 'scripts/check-public-text.test.mjs']);
const BINARY_EXTENSION = /\.(png|jpe?g|gif|webp|ico|woff2?|ttf|otf|pdf|zip|gz)$/i;
// Ignore files legitimately name the private directories they keep out of the repository.
const IGNORE_FILE = /(^|\/)\.[a-z]*ignore$/;

const PATTERNS = [
  { rule: 'tracking-id', re: /\bHD-\d+\b|\bBD-\d{8}(?:-\d+)?\b|\bcycle-\d+\b|\bdocket\s+#?\d+/gi },
  { rule: 'internal-path', re: /~\/\.claude\b|(?:^|[\s`'"(/])\.claude\/|\bclaudedocs\b/g, skipInIgnoreFiles: true },
  { rule: 'local-path', re: /\b[A-Za-z]:\\[A-Za-z]|\b[A-Za-z]:\/(?:Users|data|home)\b|\/(?:Users|home)\/[a-z][\w.-]*\//g },
];

const URL_HOST = /\bhttps?:\/\/([A-Za-z0-9.-]+)(?::\d+)?(\/[^\s'"`)<>\]]*)?/g;
// A bare hostname: dotted labels ending in a common public TLD.
const BARE_HOST = /\b(?:[a-z0-9-]+\.)+(?:com|net|org|io|dev|app|cloud|ai|co|kr)\b/gi;

export function isScannedPath(path) {
  return !SKIPPED_PATHS.has(path) && !BINARY_EXTENSION.test(path);
}

function hostAllowed(host) {
  const h = host.toLowerCase();
  return EXAMPLE_HOST.test(h) || ALLOWED_HOSTS.has(h);
}

function githubRepo(path) {
  const [owner, repo] = (path ?? '').split(/[?#]/)[0].split('/').filter(Boolean);
  return owner && repo ? `${owner}/${repo.replace(/\.git$/, '')}`.toLowerCase() : undefined;
}

/** Every violation in one file's text, in line order. */
export function scanText(path, text) {
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
      if (!hostAllowed(host)) {
        found.push({ at: m.index, rule: 'host', match: host });
      } else if (host.toLowerCase() === 'github.com') {
        const repo = githubRepo(m[2]);
        if (repo && !ALLOWED_GITHUB_REPOS.has(repo)) found.push({ at: m.index, rule: 'github-repo', match: repo });
      }
    }
    for (const m of lineText.matchAll(BARE_HOST)) {
      if (urlSpans.some(([start, end]) => m.index >= start && m.index < end)) continue; // already checked as a URL
      if (!hostAllowed(m[0])) found.push({ at: m.index, rule: 'host', match: m[0] });
    }
    found.sort((a, b) => a.at - b.at);
    for (const { rule, match } of found) violations.push({ path, line, rule, match });
  });
  return violations;
}

function main() {
  const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
  const violations = [];
  for (const path of files.filter(isScannedPath)) {
    const text = readFileSync(path, 'utf8');
    if (text.includes('\0')) continue; // binary without a known extension
    violations.push(...scanText(path, text));
  }
  for (const v of violations) console.error(`${v.path}:${v.line}: [${v.rule}] ${v.match}`);
  if (violations.length > 0) {
    console.error(`\n${violations.length} violation(s). Remove the private context, or — for a legitimate public host or repository — extend the allowlist in scripts/check-public-text.mjs.`);
    process.exit(1);
  }
  console.log(`Public text check: ${files.length} tracked files, no violations.`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main();
