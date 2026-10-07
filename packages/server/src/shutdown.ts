import type { Server } from 'node:http';
import type { Database } from './db.js';

/** How long requests already under way get to finish once the server is told to stop, before their
 *  connections are cut. Below the 10 seconds `docker stop` waits before it kills the process. */
export const SHUTDOWN_GRACE_MS = 8_000;

/**
 * Stops the server the way a container platform asks it to (`SIGTERM` from `docker stop`, or
 * `SIGINT`): it takes no new connections, lets requests under way finish (cutting what is left after
 * `graceMs`), then closes the database — so an embedded database's files are left closed, not
 * mid-write, when the container stops. Resolves once everything is closed; the caller exits.
 */
export async function shutDown(server: Server, db: Database, graceMs = SHUTDOWN_GRACE_MS): Promise<void> {
  const closed = new Promise<void>(resolve => server.close(() => resolve()));
  server.closeIdleConnections();
  const cutOff = setTimeout(() => server.closeAllConnections(), graceMs);
  await closed;
  clearTimeout(cutOff);
  await db.close();
}

/** Runs `shutDown` on the first `SIGTERM` or `SIGINT` and exits — 0 when it closed cleanly, 1 when
 *  closing failed. A second signal while it runs is ignored. */
export function exitOnStopSignal(server: Server, db: Database): void {
  let stopping = false;
  const onSignal = (signal: NodeJS.Signals) => {
    if (stopping) return;
    stopping = true;
    console.log(`[server] ${signal} received — finishing requests under way, then closing the database`);
    shutDown(server, db).then(
      () => process.exit(0),
      err => {
        console.error('[server] shutting down failed:', err);
        process.exit(1);
      }
    );
  };
  process.on('SIGTERM', onSignal);
  process.on('SIGINT', onSignal);
}
