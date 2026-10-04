#!/usr/bin/env node
// check-dependency-drift.mjs
// Detects dependency drift: an installed version sitting behind what is already published.
//
// Background: a caret range (e.g. "^0.16.1") already accepts a newer patch/minor once published,
// but a frozen install (`npm ci`, `pnpm install --frozen-lockfile`) reinstalls exactly what the
// lockfile says — only an update picks up a newer in-range version, and nothing announces a new
// major at all. Without this check in-range drift accumulates silently (it once let a sibling pin
// sit behind its own published version, and later let a month of third-party updates pile up).
//
// Works in an npm workspace (package-lock.json) and a pnpm workspace (pnpm-lock.yaml) alike. The
// same file is kept in every repository that uses it, so the rules cannot diverge between them.
//
// Rules, per direct dependency the package manager reports as outdated (the repository's own
// workspace packages are skipped — they resolve to the local source, which legitimately runs ahead
// of the registry on the commit that bumps them for release):
// - Sibling packages (`@iyulab/*`, `@canvas-kit/*`): any in-range gap fails — they move together
//   with this repo.
// - Third-party packages: an in-range gap of two or more minors fails; a patch or single-minor
//   gap is reported only, so routine upstream churn does not turn CI red.
// - Outside the declared range: a breaking release — a new major, or below 1.0 a new minor (the
//   line a caret range stops at, since 0.x minors may break) — is a deliberate adoption decision,
//   so it fails unless `dependency-deferrals.json` records why it is deferred and until when.
//   This holds for sibling packages too: they move with this repo, so a sibling release past the
//   range is followed, not tolerated. An expired deferral fails, and so does one that no longer
//   matches anything (a stale ledger entry would silently excuse the next release of that line).
//   A gap of five or more minors within one line (a tilde or exact pin at 1.x and up) fails
//   regardless.
//
// Usage:
//   node scripts/check-dependency-drift.mjs            # report only, exit 0
//   node scripts/check-dependency-drift.mjs --strict   # exit 1 on any failure above (used in CI)

import { execSync } from 'node:child_process';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

export const isSiblingPackage = (name) => name.startsWith('@iyulab/') || name.startsWith('@canvas-kit/');

// Within one major, a gap of this many minors to the newest release outside the declared range
// is neglect rather than a deliberate not-yet-adopted range.
export const MINOR_GAP_THRESHOLD = 5;
// A third-party in-range gap of this many minors fails; smaller gaps are reported only.
export const THIRD_PARTY_IN_RANGE_MINOR_GAP = 2;

/** 'pnpm' when the repository root has a pnpm lockfile, otherwise 'npm'. */
export function detectPackageManager(rootDir = process.cwd()) {
  return existsSync(join(rootDir, 'pnpm-lock.yaml')) ? 'pnpm' : 'npm';
}

/** The command that picks up newer in-range versions, for the drift message. */
export const updateCommand = (packageManager) => (packageManager === 'pnpm' ? 'pnpm update -r' : 'npm update');

// Names of the packages under the root package.json's `workspaces` entries (npm). Only the
// `dir/*` form is expanded, which is the only form these repositories use. pnpm leaves workspace
// packages out of its report by itself.
export function readWorkspacePackageNames(rootDir = process.cwd()) {
  const { workspaces = [] } = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf8'));
  const names = new Set();
  for (const pattern of workspaces) {
    const dirs = pattern.endsWith('/*')
      ? readdirSync(join(rootDir, pattern.slice(0, -2)), { withFileTypes: true })
          .filter(d => d.isDirectory())
          .map(d => join(rootDir, pattern.slice(0, -2), d.name))
      : [join(rootDir, pattern)];
    for (const dir of dirs) {
      const manifest = join(dir, 'package.json');
      if (existsSync(manifest)) names.add(JSON.parse(readFileSync(manifest, 'utf8')).name);
    }
  }
  return names;
}

export function parseVersion(v) {
  const [major, minor, patch] = v.split('.').map(n => parseInt(n, 10));
  return { major, minor, patch };
}

// The release line within which updates are expected to be compatible — what a caret range
// spans: the major from 1.0 on, and major.minor below it.
export function breakingLine(v) {
  const { major, minor } = parseVersion(v);
  return major > 0 ? `${major}` : `0.${minor}`;
}

const deferralLine = d => (d.major > 0 ? `${d.major}` : `0.${d.minor}`);

function compareVersions(a, b) {
  const x = parseVersion(a);
  const y = parseVersion(b);
  return x.major - y.major || x.minor - y.minor || (x.patch || 0) - (y.patch || 0);
}

// Minors from one version to another of the same major; Infinity across majors.
export function minorGap(from, to) {
  const a = parseVersion(from);
  const b = parseVersion(to);
  return a.major === b.major ? b.minor - a.minor : Infinity;
}

export function findDeferral(deferrals, name, latest) {
  const line = breakingLine(latest);
  return deferrals.find(d => d.package === name && deferralLine(d) === line);
}

// Classifies one outdated entry. Pure — the ledger and `today` (YYYY-MM-DD) are passed in, so the
// rules are testable without the registry or the clock.
// Verdicts: 'clean' | 'info' (reported only) | 'deferred' | 'drift' (fails under --strict).
export function classify(
  { name, current, wanted, latest },
  { sibling = false, deferrals = [], today = '', update = 'npm update' } = {}
) {
  if (current !== wanted) {
    if (sibling) {
      return { verdict: 'drift', reason: `\`${update}\` would pick up a newer in-range version` };
    }
    if (minorGap(current, wanted) >= THIRD_PARTY_IN_RANGE_MINOR_GAP) {
      return { verdict: 'drift', reason: `in-range gap of ${THIRD_PARTY_IN_RANGE_MINOR_GAP}+ minors — run \`${update}\`` };
    }
    return { verdict: 'info', reason: 'small in-range gap' };
  }
  if (current === latest) return { verdict: 'clean', reason: null };
  // `latest` can sit behind what is installed: the package manager reports the newest version
  // whose `engines` accept the Node running this check, so a release that needs a newer Node is
  // left out (as are a stale metadata cache and a tag moved back). Nothing newer exists to adopt
  // here, so it is reported, never drift — and the message says which of these to suspect.
  if (compareVersions(latest, current) < 0) {
    return {
      verdict: 'info',
      reason: `installed ahead of ${latest}, the newest version offered for this Node — the installed one may need a newer Node (check its engines)`,
    };
  }
  if (breakingLine(latest) !== breakingLine(current)) {
    const deferral = findDeferral(deferrals, name, latest);
    if (!deferral) {
      const what = parseVersion(latest).major > 0 ? `new major ${latest}` : `new 0.x line ${latest} (past the caret range)`;
      return { verdict: 'drift', reason: `${what} — adopt it, or record why not in dependency-deferrals.json` };
    }
    if (deferral.reviewBy < today) {
      return { verdict: 'drift', reason: `deferral expired on ${deferral.reviewBy} — adopt ${latest} or renew it with a current reason` };
    }
    return { verdict: 'deferred', reason: `until ${deferral.reviewBy}: ${deferral.reason}` };
  }
  if (minorGap(current, latest) >= MINOR_GAP_THRESHOLD) {
    return { verdict: 'drift', reason: `${MINOR_GAP_THRESHOLD}+ minors behind the newest release (outside the declared range)` };
  }
  return { verdict: 'info', reason: 'newer release outside the declared range, within tolerance' };
}

// Ledger entries that excuse nothing currently outdated.
export function staleDeferrals(deferrals, entries) {
  return deferrals.filter(d => !entries.some(e =>
    e.name === d.package && e.current === e.wanted
    && breakingLine(e.latest) === deferralLine(d) && breakingLine(e.current) !== deferralLine(d)));
}

export function readDeferrals(file = fileURLToPath(new URL('../dependency-deferrals.json', import.meta.url))) {
  if (!existsSync(file)) return [];
  return JSON.parse(readFileSync(file, 'utf8')).deferrals ?? [];
}

// `npm outdated --json` keys entries by package name, with one entry — or, in a workspace, an
// array of them, one per dependent — per name.
export function entriesFromNpm(outdated, workspacePackages = new Set()) {
  const entries = [];
  for (const [name, value] of Object.entries(outdated)) {
    if (workspacePackages.has(name)) continue;
    for (const e of Array.isArray(value) ? value : [value]) {
      entries.push({ name, current: e.current, wanted: e.wanted, latest: e.latest, dependents: e.dependent ?? '' });
    }
  }
  return entries;
}

// `pnpm outdated -r --format json` keys entries by package name; one entry covers every workspace
// package that depends on it.
export function entriesFromPnpm(outdated) {
  return Object.entries(outdated).map(([name, e]) => ({
    name,
    current: e.current,
    wanted: e.wanted,
    latest: e.latest,
    dependents: (e.dependentPackages ?? []).map(p => p.name).join(', '),
  }));
}

function readOutdated(packageManager) {
  // A fixed literal command, never user input. `execSync` rather than `execFileSync`: on Windows
  // `npm`/`pnpm` are `.cmd` shims that `execFileSync` cannot spawn without a shell.
  const command = packageManager === 'pnpm' ? 'pnpm outdated -r --format json' : 'npm outdated --json';
  try {
    return JSON.parse(execSync(command, { encoding: 'utf8' }) || '{}');
  } catch (err) {
    // Both exit 1 whenever anything is outdated — normal, not a failure of this script.
    if (err.stdout) return JSON.parse(err.stdout || '{}');
    throw err;
  }
}

function main() {
  const strict = process.argv.includes('--strict');
  const today = new Date().toISOString().slice(0, 10);
  const packageManager = detectPackageManager();
  const update = updateCommand(packageManager);
  const deferrals = readDeferrals();
  const outdated = readOutdated(packageManager);
  const entries = packageManager === 'pnpm'
    ? entriesFromPnpm(outdated)
    : entriesFromNpm(outdated, readWorkspacePackageNames());

  const found = { info: [], deferred: [], drift: [] };
  for (const e of entries) {
    const { verdict, reason } = classify(e, { sibling: isSiblingPackage(e.name), deferrals, today, update });
    if (verdict !== 'clean') found[verdict].push({ ...e, reason });
  }
  const stale = staleDeferrals(deferrals, entries);

  const line = e => `  ${e.name} (${e.dependents}): ${e.current} → ${e.current !== e.wanted ? e.wanted : e.latest} — ${e.reason}`;
  if (found.info.length > 0) {
    console.log('Behind, within tolerance (not a failure):');
    found.info.forEach(e => console.log(line(e)));
  }
  if (found.deferred.length > 0) {
    console.log('\nDeferred breaking releases (dependency-deferrals.json):');
    found.deferred.forEach(e => console.log(line(e)));
  }
  if (stale.length > 0) {
    console.log('\nSTALE DEFERRALS — these entries match nothing outdated; remove them:');
    stale.forEach(d => console.log(`  ${d.package}@${deferralLine(d)}`));
  }
  if (found.drift.length > 0) {
    console.log('\nDEPENDENCY DRIFT:');
    found.drift.forEach(e => console.log(line(e)));
  }
  if (found.drift.length === 0 && stale.length === 0) {
    console.log('\nNo dependency drift beyond tolerance.');
  } else if (strict) {
    process.exitCode = 1;
  }
}

// Only run the CLI when this file is the entry point — lets the test file import the pure
// functions above without shelling out to the package manager.
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
