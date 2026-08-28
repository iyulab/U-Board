#!/usr/bin/env node
// check-pin-drift.mjs
// Detects npm version drift between this repo's installed pin and the currently-published
// version of the packages produced by this umbrella's sibling submodules
// (`@iyulab/u-widgets`, `@canvas-kit/*`).
//
// Background: a caret range (e.g. "^0.16.1") already accepts a newer patch/minor once published,
// but `npm install`/`npm ci` does not re-resolve an already-satisfying lockfile entry — only
// `npm update` does. That gap let this repo's `@iyulab/u-widgets` pin sit one commit behind its
// own published version, caught only by a manual `npm outdated` sweep (umbrella HISTORY.md,
// 2026-08-28, cycle-61). This script automates that sweep.
//
// A pin can also be legitimately behind `latest` because the declared semver range doesn't cover
// it yet (e.g. a new major, or a not-yet-adopted minor) — that is a deliberate range decision, not
// drift, so it is not treated as a hard failure unless it crosses the threshold below.
//
// Usage:
//   node scripts/check-pin-drift.mjs            # report only, exit 0
//   node scripts/check-pin-drift.mjs --strict    # exit 1 if drift found (used in CI)

import { execSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

// Packages produced by this umbrella's own submodules (`upstream/canvas-kit`, `upstream/u-widgets`)
// — third-party packages are out of scope for this check.
export const isTrackedPackage = name => name.startsWith('@iyulab/') || name.startsWith('@canvas-kit/');

// A pin more than one major version behind, or 5+ minors behind, is treated as neglect rather
// than a deliberate not-yet-adopted range — mirrors the central pin-drift policy's threshold
// (`~/.claude/CLAUDE.md` §2: major diff, or a minor gap past a configured count).
export const MINOR_GAP_THRESHOLD = 5;

export function parseVersion(v) {
  const [major, minor] = v.split('.').map(n => parseInt(n, 10));
  return { major, minor };
}

export function exceedsThreshold(current, latest) {
  const c = parseVersion(current);
  const l = parseVersion(latest);
  if (l.major !== c.major) return true;
  return l.minor - c.minor >= MINOR_GAP_THRESHOLD;
}

// Classifies one `npm outdated --json` entry into a drift/stale/clean verdict. Pure function —
// the actual `npm outdated` call is kept out of this so the classification rules are testable
// without shelling out.
export function classify({ current, wanted, latest }) {
  if (current !== wanted) {
    return { verdict: 'drift', reason: 'npm update 로 즉시 해소 가능(현재 pin < 선언된 range 안의 최신)' };
  }
  if (current !== latest && exceedsThreshold(current, latest)) {
    return { verdict: 'drift', reason: `range 밖 최신(${latest})과의 격차가 임계치(major 차이 또는 minor ${MINOR_GAP_THRESHOLD}+) 초과` };
  }
  if (current !== latest) {
    return { verdict: 'stale-in-range', reason: null };
  }
  return { verdict: 'clean', reason: null };
}

function readOutdated() {
  try {
    // `npm outdated --json` exits 1 whenever anything anywhere in the workspace is outdated —
    // that is normal, not a failure of this script. Its stdout is what we actually want.
    // `execSync` (a fixed literal command, never user input) rather than `execFileSync` — on
    // Windows, `npm` resolves to `npm.cmd`, a batch script that `execFileSync` cannot spawn
    // without a shell.
    const out = execSync('npm outdated --json', { encoding: 'utf8' });
    return JSON.parse(out || '{}');
  } catch (err) {
    if (err.stdout) return JSON.parse(err.stdout || '{}');
    throw err;
  }
}

function main() {
  const strict = process.argv.includes('--strict');
  const outdated = readOutdated();
  const drift = [];
  const staleButInRange = [];

  for (const [name, value] of Object.entries(outdated)) {
    if (!isTrackedPackage(name)) continue;
    const entries = Array.isArray(value) ? value : [value];
    for (const entry of entries) {
      const { current, wanted, latest, dependent } = entry;
      const { verdict, reason } = classify({ current, wanted, latest });
      if (verdict === 'drift') drift.push({ name, dependent, current, wanted, latest, reason });
      else if (verdict === 'stale-in-range') staleButInRange.push({ name, dependent, current, latest });
    }
  }

  if (staleButInRange.length > 0) {
    console.log('range 밖 최신 버전이 있지만 임계치 이내(정보 제공용, 실패 아님):');
    for (const s of staleButInRange) {
      console.log(`  ${s.name} (${s.dependent}): ${s.current} → ${s.latest}`);
    }
  }

  if (drift.length > 0) {
    console.log('\nPIN DRIFT DETECTED — 다음 패키지가 이미 사용 가능한 상류 버전보다 뒤처져 있습니다:');
    for (const d of drift) {
      console.log(`  ${d.name} (${d.dependent}): ${d.current} → ${d.wanted !== d.current ? d.wanted : d.latest} — ${d.reason}`);
    }
    console.log('\n확인할 것: (1) 이 격차가 알려진 breaking change 때문인가 (2) 그냥 npm update를 안 돌린 것인가.');
    if (strict) process.exitCode = 1;
  } else {
    console.log('드리프트 없음 — 추적 대상 패키지(@iyulab/*, @canvas-kit/*) 전부 최신 또는 임계치 이내.');
  }
}

// Only run the CLI when this file is the entry point — lets the test file import the pure
// functions above without shelling out to `npm outdated`.
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
