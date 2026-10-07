#!/usr/bin/env node
// check.mjs
// Everything the CI `verify` job checks, in the same order, as one command — so "it passed locally"
// and "CI passed" mean the same list. The workflow runs this script rather than its own copy of the
// steps (.github/workflows/ci.yml); only setting up the machine (Node, `npm ci`, browsers) stays there.
//
// Usage:
//   npm run check                          # every step; stops at the first that fails
//   npm run check -- --skip=postgres,e2e   # leave steps out (no Docker, no browsers) — named in the summary
//
// The `node-floor` CI job (the library and the server on their oldest supported Node) is not here:
// it needs other Node versions installed. `library-smoke` runs the same smoke on this Node.

import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export const STEPS = [
  // Cheapest first — fail fast before the slower test and build steps.
  { name: 'tooling', command: 'npm run test:tooling' },
  // Dependencies behind already-published versions: `npm ci` does not re-resolve a lockfile entry that
  // still satisfies its range, so this drift is otherwise silent. A new major is adopted or deferred
  // with a review date in dependency-deferrals.json.
  { name: 'dependency-drift', command: 'npm run check:dependency-drift' },
  // This repository is public: tracked text must not carry work-tracking ids, private paths or the
  // hosts of real deployments (hosts against an allowlist — a denylist would publish them).
  { name: 'public-text', command: 'npm run check:public-text' },
  // Relative Markdown links must reach a file and heading that exist.
  { name: 'doc-links', command: 'npm run check:doc-links' },
  { name: 'typecheck', command: 'npm run typecheck' },
  // oxlint: typescript-eslint cannot load the native TypeScript 7 compiler.
  { name: 'lint', command: 'npm run lint' },
  { name: 'test', command: 'npm test' },
  // Apart from `test` so it never competes with the PGlite-per-file suites (packages/server/vitest.config.ts).
  // Needs Docker.
  { name: 'postgres', command: 'npm run test:postgres --workspace=packages/server' },
  { name: 'build', command: 'npm run build' },
  { name: 'build-lib', command: 'npm run build:lib' },
  { name: 'library-smoke', command: 'npm run smoke:library' },
  // The published package is ESM-only; its declarations must resolve under node16 and bundler resolution.
  { name: 'package-types', command: 'npm run check:package-types' },
  // The container image — the product as installed: builds, starts on its required settings alone,
  // passes the smoke checks, and stops cleanly on SIGTERM. Needs Docker.
  { name: 'image', command: 'npm run check:image' },
  // Slowest last — jsdom cannot render <canvas> or shadow DOM, so only a real browser tells a chart
  // from a silent fallback. Needs Chromium (`npx playwright install chromium` in packages/core and packages/console).
  { name: 'e2e', command: 'npm run test:e2e' },
];

/** The steps to run for these arguments, and the ones left out. Throws on a name that is not a step. */
export function plan(args, steps = STEPS) {
  const skip = new Set(args.filter(a => a.startsWith('--skip=')).flatMap(a => a.slice('--skip='.length).split(',')).filter(Boolean));
  const unknownArgs = args.filter(a => !a.startsWith('--skip='));
  if (unknownArgs.length > 0) throw new Error(`unknown argument: ${unknownArgs.join(' ')}`);
  const names = new Set(steps.map(s => s.name));
  const unknown = [...skip].filter(n => !names.has(n));
  if (unknown.length > 0) throw new Error(`no such step: ${unknown.join(', ')} (steps: ${[...names].join(', ')})`);
  return { run: steps.filter(s => !skip.has(s.name)), skipped: steps.filter(s => skip.has(s.name)).map(s => s.name) };
}

function main() {
  let steps;
  try {
    steps = plan(process.argv.slice(2));
  } catch (err) {
    console.error(err.message);
    process.exit(2);
  }
  const inActions = process.env.GITHUB_ACTIONS === 'true';
  for (const step of steps.run) {
    console.log(inActions ? `::group::${step.name}` : `\n── ${step.name}: ${step.command}`);
    const started = Date.now();
    const { status } = spawnSync(step.command, { stdio: 'inherit', shell: true });
    if (inActions) console.log('::endgroup::');
    if (status !== 0) {
      console.error(`${inActions ? '::error::' : '\n'}check failed at ${step.name} (${step.command})`);
      process.exit(status ?? 1);
    }
    console.log(`   ${step.name} ok (${Math.round((Date.now() - started) / 1000)}s)`);
  }
  console.log(`\nAll ${steps.run.length} steps passed.${steps.skipped.length > 0 ? ` Skipped: ${steps.skipped.join(', ')}.` : ''}`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
