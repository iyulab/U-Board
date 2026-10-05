import { describe, it, expect } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { createDb, SCHEMA_SQL } from './db.js';

describe('createDb', () => {
  it('creates all nine tables on an in-memory (PGlite) database', async () => {
    const db = await createDb(':memory:');
    const { rows } = await db.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
    );
    expect(rows.map(r => r.table_name)).toEqual([
      'audit_events',
      'board_share_tokens',
      'boards',
      'connectors',
      'password_reset_tokens',
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

  it('rejects a nested withTransaction call rather than allowing it to hang', async () => {
    const db = await createDb(':memory:');
    await expect(
      Promise.race([
        db.withTransaction(async tx => {
          await tx.withTransaction(async () => {});
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timed out — likely deadlocked')), 2000)),
      ])
    ).rejects.toThrow(/nested transactions are not supported/);
  });

  it('upgrades a connectors table from before OAuth2 support without losing rows, idempotently', async () => {
    const pglite = new PGlite();
    await pglite.exec(SCHEMA_SQL);
    // Put the table back in its earlier shape: no oauth columns, auth_type limited to three values.
    await pglite.exec(`
      ALTER TABLE connectors DROP COLUMN oauth_token_url, DROP COLUMN oauth_client_id,
        DROP COLUMN oauth_scope, DROP COLUMN oauth_client_auth;
      ALTER TABLE connectors DROP CONSTRAINT connectors_auth_type_check;
      ALTER TABLE connectors ADD CONSTRAINT connectors_auth_type_check CHECK (auth_type IN ('none', 'bearer', 'header'));
      INSERT INTO workspaces (id, name, created_at) VALUES ('w1', 'W', now());
      INSERT INTO connectors (id, workspace_id, name, type, base_url, auth_type, auth_value, created_at, updated_at)
        VALUES ('c1', 'w1', 'Old', 'http', 'https://a.example.com', 'bearer', 'tok', 't', 't');
    `);

    await pglite.exec(SCHEMA_SQL);
    await pglite.exec(SCHEMA_SQL); // a second start against the upgraded database is a no-op

    const old = await pglite.query<{ auth_type: string; auth_value: string }>(`SELECT auth_type, auth_value FROM connectors WHERE id = 'c1'`);
    expect(old.rows).toEqual([{ auth_type: 'bearer', auth_value: 'tok' }]);
    await pglite.exec(`
      INSERT INTO connectors (id, workspace_id, name, type, base_url, auth_type, auth_value,
        oauth_token_url, oauth_client_id, oauth_client_auth, created_at, updated_at)
      VALUES ('c2', 'w1', 'New', 'http', 'https://a.example.com', 'oauth2-client-credentials', 'secret',
        'https://auth.example.com/token', 'client', 'basic', 't', 't');
    `);
    await expect(
      pglite.exec(`UPDATE connectors SET auth_type = 'bogus' WHERE id = 'c1'`)
    ).rejects.toThrow(/connectors_auth_type_check/);
    await expect(
      pglite.exec(`UPDATE connectors SET oauth_client_auth = 'bogus' WHERE id = 'c2'`)
    ).rejects.toThrow(/check constraint/);
    const constraints = await pglite.query(`SELECT 1 FROM pg_constraint WHERE conrelid = 'connectors'::regclass AND conname = 'connectors_auth_type_check'`);
    expect(constraints.rows).toHaveLength(1);
  });
  it('gives an installation from before instance roles one operator — its first account — idempotently', async () => {
    const pglite = new PGlite();
    await pglite.exec(SCHEMA_SQL);
    await pglite.exec(`
      ALTER TABLE users DROP COLUMN instance_role;
      INSERT INTO users (id, email, password_hash, name, created_at) VALUES
        ('u2', 'second@x.com', 'h', 'Second', '2026-01-02T00:00:00.000Z'),
        ('u1', 'first@x.com', 'h', 'First', '2026-01-01T00:00:00.000Z');
    `);

    await pglite.exec(SCHEMA_SQL);
    await pglite.exec(SCHEMA_SQL);

    const roles = await pglite.query<{ id: string; instance_role: string }>(`SELECT id, instance_role FROM users ORDER BY id`);
    expect(roles.rows).toEqual([
      { id: 'u1', instance_role: 'operator' },
      { id: 'u2', instance_role: 'user' },
    ]);
    await expect(pglite.exec(`UPDATE users SET instance_role = 'admin' WHERE id = 'u2'`)).rejects.toThrow(/check constraint/);
  });

  it('leaves the operators alone once one exists', async () => {
    const pglite = new PGlite();
    await pglite.exec(SCHEMA_SQL);
    await pglite.exec(`
      INSERT INTO users (id, email, password_hash, name, created_at, instance_role) VALUES
        ('u1', 'first@x.com', 'h', 'First', '2026-01-01T00:00:00.000Z', 'user'),
        ('u2', 'second@x.com', 'h', 'Second', '2026-01-02T00:00:00.000Z', 'operator');
    `);
    await pglite.exec(SCHEMA_SQL);
    const roles = await pglite.query<{ id: string; instance_role: string }>(`SELECT id, instance_role FROM users ORDER BY id`);
    expect(roles.rows.map(r => r.instance_role)).toEqual(['user', 'operator']);
  });
  it('lets an account be deleted while its invitations and share links stay, idempotently upgrading the old keys', async () => {
    const pglite = new PGlite();
    await pglite.exec(SCHEMA_SQL);
    // Put both references back in their earlier shape: NOT NULL, no ON DELETE action.
    await pglite.exec(`
      ALTER TABLE workspace_invitations DROP CONSTRAINT workspace_invitations_invited_by_user_id_fkey;
      ALTER TABLE workspace_invitations ADD CONSTRAINT workspace_invitations_invited_by_user_id_fkey FOREIGN KEY (invited_by_user_id) REFERENCES users(id);
      ALTER TABLE workspace_invitations ALTER COLUMN invited_by_user_id SET NOT NULL;
      ALTER TABLE board_share_tokens DROP CONSTRAINT board_share_tokens_created_by_user_id_fkey;
      ALTER TABLE board_share_tokens ADD CONSTRAINT board_share_tokens_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES users(id);
      ALTER TABLE board_share_tokens ALTER COLUMN created_by_user_id SET NOT NULL;
      INSERT INTO users (id, email, password_hash, name, created_at) VALUES ('u1', 'a@x.com', 'h', 'A', 't');
      INSERT INTO workspaces (id, name, created_at) VALUES ('w1', 'W', 't');
      INSERT INTO boards (id, workspace_id, name, document, created_at, updated_at) VALUES ('b1', 'w1', 'B', '{}', 't', 't');
      INSERT INTO workspace_invitations (id, workspace_id, email, role, token, invited_by_user_id, expires_at)
        VALUES ('i1', 'w1', 'n@x.com', 'member', 'tok', 'u1', 't');
      INSERT INTO board_share_tokens (id, board_id, workspace_id, token_hash, token_mask, created_by_user_id, created_at)
        VALUES ('s1', 'b1', 'w1', 'hash', 'mask', 'u1', 't');
    `);

    await pglite.exec(SCHEMA_SQL);
    await pglite.exec(SCHEMA_SQL);
    await pglite.exec(`DELETE FROM users WHERE id = 'u1'`);

    expect((await pglite.query(`SELECT invited_by_user_id FROM workspace_invitations WHERE id = 'i1'`)).rows).toEqual([{ invited_by_user_id: null }]);
    expect((await pglite.query(`SELECT created_by_user_id FROM board_share_tokens WHERE id = 's1'`)).rows).toEqual([{ created_by_user_id: null }]);
  });
});
