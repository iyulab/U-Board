#!/usr/bin/env node
// check-image.mjs
// Builds the container image — the product as it is installed — and checks it the way an
// installation meets it: it starts with only its required settings and an embedded database,
// answers the smoke checks (scripts/smoke.mjs) from the outside, and stops cleanly when told to
// (`docker stop` sends SIGTERM; a server that ignores it is killed after the timeout, exit 137).
// Needs Docker. Removes its container and image afterwards.
//
// Usage:
//   npm run check:image

import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { smoke } from './smoke.mjs';

const START_TIMEOUT_MS = 60_000;

function docker(args, { quiet = false } = {}) {
  const r = spawnSync('docker', args, { encoding: 'utf8', stdio: quiet ? 'pipe' : ['ignore', 'inherit', 'inherit'] });
  if (r.error) throw r.error;
  if (r.status !== 0) throw new Error(`docker ${args[0]} failed (exit ${r.status})${quiet ? `: ${r.stderr.trim()}` : ''}`);
  return quiet ? r.stdout.trim() : '';
}

/** The host port `docker port` reports for the container's port 4000 (`127.0.0.1:49153`, or an
 *  IPv6 line besides it). */
export function hostPort(dockerPortOutput) {
  const match = /:(\d+)\s*$/m.exec(dockerPortOutput.split('\n')[0] ?? '');
  if (!match) throw new Error(`no host port in "${dockerPortOutput}"`);
  return Number(match[1]);
}

async function waitForHealth(base) {
  const deadline = Date.now() + START_TIMEOUT_MS;
  while (Date.now() < deadline) {
    try {
      if ((await fetch(`${base}/health`, { signal: AbortSignal.timeout(2_000) })).status === 200) return;
    } catch {
      // not listening yet
    }
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error(`the server did not answer ${base}/health within ${START_TIMEOUT_MS / 1000} s`);
}

async function main() {
  const tag = `u-board-check:${process.pid}`;
  const name = `u-board-check-${process.pid}`;
  let started = false;
  let failed = false;
  try {
    console.log(`Building ${tag} …`);
    docker(['build', '-f', 'packages/server/Dockerfile', '-t', tag, '.']);
    docker(
      [
        'run', '-d', '--name', name, '-p', '127.0.0.1::4000',
        '-e', 'UBOARD_DATABASE_URL=/tmp/u-board',
        '-e', `UBOARD_SESSION_SECRET=${randomBytes(24).toString('base64url')}`,
        '-e', `UBOARD_SECRETS_KEY=${randomBytes(32).toString('base64url')}`,
        tag,
      ],
      { quiet: true }
    );
    started = true;
    const base = `http://127.0.0.1:${hostPort(docker(['port', name, '4000'], { quiet: true }))}`;
    await waitForHealth(base);

    const results = await smoke(base);
    for (const r of results) console.log(`${r.problem ? 'FAIL' : 'ok  '}  ${r.name} (${r.path})${r.problem ? ` — ${r.problem}` : ''}`);
    if (results.some(r => r.problem)) failed = true;

    const stopStarted = Date.now();
    docker(['stop', name], { quiet: true });
    const stopMs = Date.now() - stopStarted;
    const exitCode = docker(['inspect', name, '--format', '{{.State.ExitCode}}'], { quiet: true });
    const stopProblem = exitCode !== '0' ? `exited ${exitCode} (137: killed — SIGTERM not handled)` : undefined;
    console.log(`${stopProblem ? 'FAIL' : 'ok  '}  stops on SIGTERM (${stopMs} ms)${stopProblem ? ` — ${stopProblem}` : ''}`);
    if (stopProblem) failed = true;
  } catch (err) {
    console.error(err.message);
    failed = true;
    if (started) spawnSync('docker', ['logs', name], { stdio: 'inherit' });
  } finally {
    spawnSync('docker', ['rm', '-f', name], { stdio: 'ignore' });
    spawnSync('docker', ['rmi', tag], { stdio: 'ignore' });
  }
  console.log(failed ? '\nThe image check failed.' : '\nThe image builds, serves and stops as installed.');
  process.exitCode = failed ? 1 : 0;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
