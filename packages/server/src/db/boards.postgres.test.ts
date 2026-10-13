import { execSync } from 'node:child_process';
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import type { DbClient } from '../db.js';
import { createDb } from '../db.js';
import { createWorkspace } from './workspaces.js';
import { createBoard, findBoard, updateBoard } from './boards.js';
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
 * PGlite runs one query at a time, so it cannot show that two saves of the same copy, sent at once, do
 * not both pass — real concurrent connections do. They also check the statement's parameters as a
 * Postgres server types them (an absent revision, an absent name or document).
 */
describe.skipIf(!dockerAvailable())('updateBoard — real Postgres (testcontainers)', () => {
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

  it('saves unconditionally, and keeps what a save leaves out', async () => {
    const ws = await createWorkspace(db, 'W');
    const board = await createBoard(db, { workspaceId: ws.id, name: 'A', actorUserId: 'actor' });
    const result = await updateBoard(db, ws.id, board.id, { name: 'B' });
    expect(result).toMatchObject({ board: { name: 'B', revision: 2, document: board.document } });
  });

  it('lets exactly one of two saves of the same copy through when they arrive together', async () => {
    const ws = await createWorkspace(db, 'W');
    for (let round = 0; round < 10; round++) {
      const board = await createBoard(db, { workspaceId: ws.id, name: `R${round}`, actorUserId: 'actor' });
      const results = await Promise.all(
        ['mine', 'theirs'].map(name => updateBoard(db, ws.id, board.id, { name }, board.revision))
      );
      expect(results.filter(r => 'board' in r)).toHaveLength(1);
      expect(results.filter(r => 'conflict' in r)).toEqual([{ conflict: { revision: 2 } }]);
      expect((await findBoard(db, ws.id, board.id))?.revision).toBe(2);
    }
  });
});
