import { Pool, type PoolClient } from 'pg';
import { PGlite } from '@electric-sql/pglite';

export interface DbClient {
  query<T = unknown>(sql: string, params?: unknown[]): Promise<{ rows: T[]; rowCount: number | null }>;
  withTransaction<T>(fn: (tx: DbClient) => Promise<T>): Promise<T>;
}

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS workspace_users (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner','member')),
  created_at TEXT NOT NULL,
  UNIQUE (workspace_id, user_id)
);

CREATE TABLE IF NOT EXISTS workspace_invitations (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner','member')),
  token TEXT NOT NULL UNIQUE,
  invited_by_user_id TEXT NOT NULL REFERENCES users(id),
  expires_at TEXT NOT NULL,
  accepted_at TEXT
);

CREATE TABLE IF NOT EXISTS boards (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  document TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_boards_workspace_id ON boards(workspace_id);

CREATE TABLE IF NOT EXISTS connectors (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('http')),
  base_url TEXT NOT NULL,
  auth_type TEXT NOT NULL CHECK (auth_type IN ('none', 'bearer', 'header')),
  auth_header_name TEXT,
  auth_value TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_connectors_workspace_id ON connectors(workspace_id);

CREATE TABLE IF NOT EXISTS board_share_tokens (
  id TEXT PRIMARY KEY,
  board_id TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  token_mask TEXT NOT NULL,
  created_by_user_id TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL,
  last_used_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_board_share_tokens_board_id ON board_share_tokens(board_id);
`;

class PgDbClient implements DbClient {
  constructor(private readonly runner: Pool | PoolClient) {}

  async query<T = unknown>(sql: string, params: unknown[] = []): Promise<{ rows: T[]; rowCount: number | null }> {
    const result = await this.runner.query<T extends Record<string, unknown> ? T : any>(sql, params as any[]);
    return { rows: result.rows as T[], rowCount: result.rowCount };
  }

  async withTransaction<T>(fn: (tx: DbClient) => Promise<T>): Promise<T> {
    if (!(this.runner instanceof Pool)) {
      throw new Error('nested transactions are not supported');
    }
    const client = await this.runner.connect();
    try {
      await client.query('BEGIN');
      const result = await fn(new PgDbClient(client));
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

class PgliteDbClient implements DbClient {
  // `runner` is a PGlite instance for the top-level client, or a PGlite Transaction object once
  // inside withTransaction — both expose a structurally identical `query()` method.
  constructor(private readonly runner: { query: PGlite['query'] }, private readonly root: PGlite) {}

  async query<T = unknown>(sql: string, params: unknown[] = []): Promise<{ rows: T[]; rowCount: number | null }> {
    const result = await this.runner.query<T>(sql, params);
    return { rows: result.rows, rowCount: result.rowCount ?? result.rows.length };
  }

  async withTransaction<T>(fn: (tx: DbClient) => Promise<T>): Promise<T> {
    return this.root.transaction(async pgliteTx => fn(new PgliteDbClient(pgliteTx, this.root)));
  }
}

export async function createDb(url: string): Promise<DbClient> {
  if (url.startsWith('postgres://') || url.startsWith('postgresql://')) {
    const pool = new Pool({ connectionString: url });
    await pool.query(SCHEMA_SQL);
    return new PgDbClient(pool);
  }
  // `:memory:` (tests) or any local path (local `npm run dev` default) both use PGlite — a real
  // Postgres engine compiled to WASM, not a mock, so the SQL executed is identical to production.
  const pglite = url === ':memory:' ? new PGlite() : new PGlite(url);
  await pglite.exec(SCHEMA_SQL); // .exec (not .query) runs the semicolon-separated statement list
  return new PgliteDbClient(pglite, pglite);
}
