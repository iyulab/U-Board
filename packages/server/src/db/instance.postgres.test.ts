import { execSync } from 'node:child_process';
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import type { DbClient } from '../db.js';
import { createDb } from '../db.js';
import { createUser } from './users.js';
import { listInstanceUsers, setInstanceRole } from './instance.js';
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
 * PGlite serializes every query on one connection, so `instance.test.ts`-style checks would pass
 * without the row locks in `setInstanceRole`. Real concurrent connections are what prove the
 * "at least one operator" invariant.
 */
describe.skipIf(!dockerAvailable())('setInstanceRole — real Postgres concurrency (testcontainers)', () => {
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

  it('keeps one operator when two operators step down at the same moment', async () => {
    // A lost race only shows up when both transactions overlap, so repeat to make overlap likely.
    for (let round = 0; round < 10; round++) {
      const ids: string[] = [];
      for (const n of [0, 1]) {
        const user = await createUser(db, { email: `op${n}-${round}@x.com`, passwordHash: 'h', name: `Op${n}`, instanceRole: 'operator' });
        ids.push(user.id);
      }

      const results = await Promise.all(ids.map(id => setInstanceRole(db, id, 'user')));

      expect(results.sort()).toEqual(['changed', 'last-operator']);
      expect((await listInstanceUsers(db)).filter(u => u.instanceRole === 'operator')).toHaveLength(1);
      await truncateAllTables(db);
    }
  });
});
