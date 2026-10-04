import { execSync } from 'node:child_process';
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import type { DbClient } from '../db.js';
import { createDb } from '../db.js';
import { createUser } from './users.js';
import { createWorkspace, addWorkspaceUser, changeWorkspaceMembership, listWorkspaceMembers } from './workspaces.js';
import { truncateAllTables } from '../test-support/test-db.js';

function dockerAvailable(): boolean {
  try {
    execSync('docker info', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * `workspaces.test.ts` runs the same race on PGlite, which serializes every query on one
 * connection — it would pass even without the row lock in `changeWorkspaceMembership`. Real
 * Postgres with real concurrent connections is what proves the "at least one owner" invariant.
 */
describe.skipIf(!dockerAvailable())('changeWorkspaceMembership — real Postgres concurrency (testcontainers)', () => {
  let container: StartedPostgreSqlContainer;
  let db: DbClient;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16').start();
    db = await createDb(container.getConnectionUri());
  }, 120_000);

  afterAll(async () => {
    await container?.stop();
  });

  afterEach(async () => {
    await truncateAllTables(db);
  });

  it('keeps one owner when two owners remove each other at the same moment', async () => {
    // A lost race only shows up when both transactions overlap, so repeat to make overlap likely.
    for (let round = 0; round < 10; round++) {
      const ws = await createWorkspace(db, `W${round}`);
      const ownerIds: string[] = [];
      for (const n of [0, 1]) {
        const user = await createUser(db, { email: `o${n}-${round}@x.com`, passwordHash: 'h', name: `O${n}` });
        await addWorkspaceUser(db, { workspaceId: ws.id, userId: user.id, role: 'owner' });
        ownerIds.push(user.id);
      }

      const results = await Promise.all(
        ownerIds.map(userId => changeWorkspaceMembership(db, { workspaceId: ws.id, userId, change: { kind: 'remove' } }))
      );

      expect(results.sort()).toEqual(['changed', 'last-owner']);
      expect((await listWorkspaceMembers(db, ws.id)).filter(m => m.role === 'owner')).toHaveLength(1);
    }
  });

  it('keeps one owner when one owner is demoted while the other leaves', async () => {
    for (let round = 0; round < 10; round++) {
      const ws = await createWorkspace(db, `W${round}`);
      const ownerIds: string[] = [];
      for (const n of [0, 1]) {
        const user = await createUser(db, { email: `d${n}-${round}@x.com`, passwordHash: 'h', name: `D${n}` });
        await addWorkspaceUser(db, { workspaceId: ws.id, userId: user.id, role: 'owner' });
        ownerIds.push(user.id);
      }

      await Promise.all([
        changeWorkspaceMembership(db, { workspaceId: ws.id, userId: ownerIds[0], change: { kind: 'set-role', role: 'member' } }),
        changeWorkspaceMembership(db, { workspaceId: ws.id, userId: ownerIds[1], change: { kind: 'remove' } }),
      ]);

      expect((await listWorkspaceMembers(db, ws.id)).filter(m => m.role === 'owner')).toHaveLength(1);
    }
  });
});
