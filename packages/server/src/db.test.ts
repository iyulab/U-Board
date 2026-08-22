import { describe, it, expect } from 'vitest';
import { createDb } from './db.js';

describe('createDb', () => {
  it('creates all seven tables on an in-memory (PGlite) database', async () => {
    const db = await createDb(':memory:');
    const { rows } = await db.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
    );
    expect(rows.map(r => r.table_name)).toEqual([
      'board_share_tokens',
      'boards',
      'connectors',
      'users',
      'workspace_invitations',
      'workspace_users',
      'workspaces',
    ]);
  });

  it('indexes boards.workspace_id, the column listBoardsForWorkspace filters on', async () => {
    const db = await createDb(':memory:');
    const { rows } = await db.query<{ indexdef: string }>(
      `SELECT indexdef FROM pg_indexes WHERE tablename = 'boards' AND indexname = 'idx_boards_workspace_id'`
    );
    expect(rows).toHaveLength(1);
  });

  it('enforces unique (workspace_id, user_id) on workspace_users', async () => {
    const db = await createDb(':memory:');
    await db.query(
      `INSERT INTO users (id, email, password_hash, name, created_at) VALUES ('u1','a@x.com','h','A', now())`
    );
    await db.query(`INSERT INTO workspaces (id, name, created_at) VALUES ('w1','W', now())`);
    await db.query(
      `INSERT INTO workspace_users (id, workspace_id, user_id, role, created_at) VALUES ('wu1','w1','u1','owner', now())`
    );
    await expect(
      db.query(
        `INSERT INTO workspace_users (id, workspace_id, user_id, role, created_at) VALUES ('wu2','w1','u1','member', now())`
      )
    ).rejects.toThrow();
  });

  it('runs a transaction that rolls back on error, leaving no rows behind', async () => {
    const db = await createDb(':memory:');
    await expect(
      db.withTransaction(async tx => {
        await tx.query(`INSERT INTO workspaces (id, name, created_at) VALUES ('w1','W', now())`);
        throw new Error('boom');
      })
    ).rejects.toThrow('boom');
    const { rows } = await db.query<{ count: string }>(`SELECT COUNT(*) as count FROM workspaces`);
    expect(Number(rows[0].count)).toBe(0);
  });

  it('commits a transaction whose callback resolves', async () => {
    const db = await createDb(':memory:');
    const result = await db.withTransaction(async tx => {
      await tx.query(`INSERT INTO workspaces (id, name, created_at) VALUES ('w1','W', now())`);
      return 'ok';
    });
    expect(result).toBe('ok');
    const { rows } = await db.query<{ count: string }>(`SELECT COUNT(*) as count FROM workspaces`);
    expect(Number(rows[0].count)).toBe(1);
  });
});
