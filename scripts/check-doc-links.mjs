#!/usr/bin/env node
// check-doc-links.mjs
// Fails when a tracked Markdown file links to a file in this repository that does not exist, or to
// a heading anchor that the target file does not have. Links into the repository move silently when
// files do (a workspace move once left the API reference pointing at a path that no longer
// existed), and nothing else notices: the test suites never follow a link.
//
// Checked: relative links `[text](path)`, `[text](path#anchor)` and same-file `[text](#anchor)`.
// Not checked: absolute URLs (they leave the repository), and links inside fenced code blocks.
// Anchors follow GitHub's heading slugs: lower-cased, punctuation other than `-` and `_` removed,
// spaces turned into `-`, and `-1`, `-2`, ... appended to repeated headings.
//
// Usage:
//   node scripts/check-doc-links.mjs     # exit 1 and list every broken link

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, normalize } from 'node:path';
import { pathToFileURL } from 'node:url';

const LINK = /\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
const FENCE = /^\s*(```|~~~)/;

/** GitHub's anchor for each heading in a Markdown text, in order. */
export function headingAnchors(text) {
  const anchors = new Set();
  const seen = new Map();
  let inFence = false;
  for (const line of text.split(/\r?\n/)) {
    if (FENCE.test(line)) inFence = !inFence;
    if (inFence) continue;
    const m = line.match(/^#{1,6}\s+(.*?)\s*#*\s*$/);
    if (!m) continue;
    const base = m[1]
      .replace(/`/g, '')
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s_-]/gu, '')
      .replace(/\s/g, '-');
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    anchors.add(count === 0 ? base : `${base}-${count}`);
  }
  return anchors;
}

/** Every relative link in a Markdown text, with its line number, skipping fenced code. */
export function relativeLinks(text) {
  const links = [];
  let inFence = false;
  text.split(/\r?\n/).forEach((line, index) => {
    if (FENCE.test(line)) inFence = !inFence;
    if (inFence) return;
    const withoutCode = line.replace(/`[^`]*`/g, '');
    for (const m of withoutCode.matchAll(LINK)) {
      const target = m[1];
      if (/^[a-z][a-z0-9+.-]*:/i.test(target)) continue; // http:, https:, mailto:, ...
      links.push({ line: index + 1, target });
    }
  });
  return links;
}

/**
 * Broken links in one file. `readText(path)` returns a repository file's text, or `undefined` when
 * the path is not a file; `isDirectory(path)` says whether it is a directory (a valid link target).
 */
export function brokenLinks(path, text, readText, isDirectory) {
  const broken = [];
  for (const { line, target } of relativeLinks(text)) {
    const [rawFile, anchor] = target.split('#');
    const file = rawFile === '' ? path : normalize(join(dirname(path), decodeURIComponent(rawFile))).replace(/\\/g, '/');
    if (file.startsWith('..')) {
      broken.push({ path, line, target, problem: 'points outside the repository' });
      continue;
    }
    if (isDirectory(file)) continue;
    const targetText = file === path ? text : readText(file);
    if (targetText === undefined) {
      broken.push({ path, line, target, problem: 'no such file' });
      continue;
    }
    if (anchor && file.endsWith('.md') && !headingAnchors(targetText).has(anchor.toLowerCase())) {
      broken.push({ path, line, target, problem: 'no such heading' });
    }
  }
  return broken;
}

function main() {
  const files = execFileSync('git', ['ls-files', '-z', '*.md'], { encoding: 'utf8' }).split('\0').filter(Boolean);
  const readText = file => (existsSync(file) && statSync(file).isFile() ? readFileSync(file, 'utf8') : undefined);
  const isDirectory = file => existsSync(file) && statSync(file).isDirectory();
  const broken = files.flatMap(path => brokenLinks(path, readFileSync(path, 'utf8'), readText, isDirectory));
  for (const b of broken) console.error(`${b.path}:${b.line}: ${b.target} — ${b.problem}`);
  if (broken.length > 0) {
    console.error(`\n${broken.length} broken link(s).`);
    process.exit(1);
  }
  console.log(`Doc link check: ${files.length} Markdown files, no broken links.`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main();
