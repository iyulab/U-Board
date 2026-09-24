import { createDb, type DbClient } from '../db.js';

// Starting an in-memory PGlite and applying the schema costs about a second on an idle machine,
// and several times that when every test file does it in parallel — enough to push individual
// tests past vitest's 5s timeout. Vitest runs each test file in its own module scope, so this
// holds one engine per test file; each call empties it instead of starting another.
let shared: Promise<{ db: DbClient; tables: string }> | undefined;

async function listTables(db: DbClient): Promise<string[]> {
  const { rows } = await db.query<{ tablename: string }>(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`
  );
  return rows.map(r => r.tablename);
}

/** A database with the full schema and no rows. Every call in the same test file returns the
 *  same client, emptied — so call it once per test (e.g. in `beforeEach`), not once per suite.
 *
 *  A test that changes the schema itself (drops a table to force a failure, say) must use its
 *  own `createDb(':memory:')` instead: emptying rows cannot undo a schema change, so it would
 *  leak into every later test in the file. That case is detected and reported here rather than
 *  surfacing as unrelated failures further down. */
export async function createTestDb(): Promise<DbClient> {
  shared ??= (async () => {
    const db = await createDb(':memory:');
    return { db, tables: (await listTables(db)).join(',') };
  })();
  const { db, tables } = await shared;

  // Read the table list from the catalog rather than hard-coding it, so a table added to the
  // schema later is emptied too.
  const current = await listTables(db);
  if (current.join(',') !== tables) {
    shared = undefined;
    throw new Error(
      'An earlier test in this file changed the database schema, so the shared test database ' +
        "can't be reused. Give that test its own database with createDb(':memory:')."
    );
  }
  await db.query(`TRUNCATE ${current.map(t => `"${t}"`).join(', ')} CASCADE`);
  return db;
}
