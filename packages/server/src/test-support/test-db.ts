import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { inject } from 'vitest';
import { openPglite, type Database, type DbClient } from '../db.js';

// Starting a PGlite engine is mostly `initdb`, which the global setup (pglite-template.ts) runs once
// for the whole run; an engine here starts from the data directory it saved, schema included. Vitest
// runs each test file in its own module scope, so `createTestDb` still holds one engine per test
// file and empties it on each call instead of starting another.
let template: Blob | undefined;
let shared: Promise<{ db: DbClient; tables: string }> | undefined;

async function listTables(db: DbClient): Promise<string[]> {
  const { rows } = await db.query<{ tablename: string }>(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`
  );
  return rows.map(r => r.tablename);
}

/** Empties every table in the public schema. The table list comes from the catalog rather than
 *  a hard-coded list, so a table added to the schema later is covered — works against PGlite and a
 *  real Postgres alike. */
export async function truncateAllTables(db: DbClient): Promise<void> {
  const tables = await listTables(db);
  if (tables.length > 0) {
    await db.query(`TRUNCATE ${tables.map(t => `"${t}"`).join(', ')} CASCADE`);
  }
}

/** A database of its own — a new engine with the full schema and no rows — for a test that changes
 *  the schema (drops a table to force a failure, say), which the shared one cannot undo. Close it
 *  when done. */
export async function createIsolatedTestDb(): Promise<Database> {
  template ??= new Blob([readFileSync(inject('pgliteTemplate'))]);
  return openPglite(new PGlite({ loadDataDir: template }));
}

/** A database with the full schema and no rows. Every call in the same test file returns the
 *  same client, emptied — so call it once per test (e.g. in `beforeEach`), not once per suite.
 *
 *  A test that changes the schema itself must use `createIsolatedTestDb` instead: emptying rows
 *  cannot undo a schema change, so it would leak into every later test in the file. That case is
 *  detected and reported here rather than surfacing as unrelated failures further down. */
export async function createTestDb(): Promise<DbClient> {
  shared ??= (async () => {
    const db = await createIsolatedTestDb();
    return { db, tables: (await listTables(db)).join(',') };
  })();
  const { db, tables } = await shared;

  const current = await listTables(db);
  if (current.join(',') !== tables) {
    shared = undefined;
    throw new Error(
      'An earlier test in this file changed the database schema, so the shared test database ' +
        "can't be reused. Give that test its own database with createIsolatedTestDb()."
    );
  }
  await truncateAllTables(db);
  return db;
}
