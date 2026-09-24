import { describe, it, expect } from 'vitest';
import { createTestDb } from './test-db.js';
import { createUser } from '../db/users.js';
import { createWorkspace } from '../db/workspaces.js';

describe('createTestDb', () => {
  it('hands out a database with the full schema and no rows', async () => {
    const db = await createTestDb();
    const { rows } = await db.query<{ n: string }>(
      `SELECT count(*)::text AS n FROM pg_tables WHERE schemaname = 'public'`
    );
    expect(Number(rows[0].n)).toBeGreaterThan(0);
    expect((await db.query('SELECT * FROM users')).rows).toEqual([]);
  });

  it('empties every table, including rows referenced by foreign keys, between calls', async () => {
    const first = await createTestDb();
    await createUser(first, { email: 'a@example.com', passwordHash: 'h', name: 'A' });
    await createWorkspace(first, 'W');

    const second = await createTestDb();
    expect((await second.query('SELECT * FROM users')).rows).toEqual([]);
    expect((await second.query('SELECT * FROM workspaces')).rows).toEqual([]);
  });

  it('reuses one engine instance per test file instead of starting a new one each call', async () => {
    const a = await createTestDb();
    const b = await createTestDb();
    expect(a).toBe(b);
  });

  it('fails loudly, naming the fix, when an earlier test changed the schema', async () => {
    const db = await createTestDb();
    await db.query('DROP TABLE password_reset_tokens');
    await expect(createTestDb()).rejects.toThrow(/schema.*createDb/);
  });
});
