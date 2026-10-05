import { execSync } from 'node:child_process';
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import type { DbClient } from '../db.js';
import { createDb } from '../db.js';
import { createUser, deleteAccount } from './users.js';
import { createWorkspace, addWorkspaceUser, listWorkspaceMembers } from './workspaces.js';
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
 * PGlite serializes every query on one connection, so route tests would pass without the row locks
 * in `deleteAccount`. Real concurrent connections are what prove a workspace keeps an owner.
 */
describe.skipIf(!dockerAvailable())('deleteAccount — real Postgres concurrency (testcontainers)', () => {
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

  it('keeps one owner when the two owners of a workspace delete their accounts at the same moment', async () => {
    for (let round = 0; round < 10; round++) {
      const ws = await createWorkspace(db, `W${round}`);
      const ids: string[] = [];
      for (const n of [0, 1]) {
        const user = await createUser(db, { email: `o${n}-${round}@x.com`, passwordHash: 'h', name: `O${n}` });
        await addWorkspaceUser(db, { workspaceId: ws.id, userId: user.id, role: 'owner' });
        ids.push(user.id);
      }

      const results = await Promise.all(ids.map(id => deleteAccount(db, id)));

      expect(results.map(r => r.kind).sort()).toEqual(['deleted', 'last-owner']);
      expect((await listWorkspaceMembers(db, ws.id)).filter(m => m.role === 'owner')).toHaveLength(1);
      await truncateAllTables(db);
    }
  });
});
