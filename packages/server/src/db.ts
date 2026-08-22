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

// Distinct from routes/auth.ts's SIGNUP_BOOTSTRAP_LOCK_KEY (727100) — Postgres advisory locks
// share one global per-database keyspace, so every key used anywhere in this app must stay
// distinct. This one serializes schema bootstrap against concurrent cold-start replicas racing
// to CREATE TABLE at once — not atomic on its own in Postgres.
const SCHEMA_BOOTSTRAP_LOCK_KEY = 727101;

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
      client.release();
      return result;
    } catch (err) {
      try {
        await client.query('ROLLBACK');
        client.release();
      } catch (rollbackErr) {
        // ROLLBACK itself failed — the connection is broken. Destroy it (don't return it to the
        // pool healthy) rather than let it fail every future checkout with "current transaction
        // is aborted".
        client.release(rollbackErr instanceof Error ? rollbackErr : new Error(String(rollbackErr)));
      }
      throw err;
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
    if (this.runner !== this.root) {
      throw new Error('nested transactions are not supported');
    }
    return this.root.transaction(async pgliteTx => fn(new PgliteDbClient(pgliteTx, this.root)));
  }
}

export async function createDb(url: string): Promise<DbClient> {
  if (url.startsWith('postgres://') || url.startsWith('postgresql://')) {
    const pool = new Pool({ connectionString: url });
    pool.on('error', err => {
      // A pooled client can emit this for an *idle* connection dropped by the network/gateway —
      // routine in cloud Postgres. Without a listener, Node's EventEmitter rethrows and crashes the
      // process; the pool itself recovers on its own (the broken idle client is simply evicted).
      console.error('pg pool idle client error', err);
    });
    const bootstrapClient = await pool.connect();
    try {
      await bootstrapClient.query('SELECT pg_advisory_lock($1)', [SCHEMA_BOOTSTRAP_LOCK_KEY]);
      await bootstrapClient.query(SCHEMA_SQL);
      await bootstrapClient.query('SELECT pg_advisory_unlock($1)', [SCHEMA_BOOTSTRAP_LOCK_KEY]);
      bootstrapClient.release();
    } catch (err) {
      try {
        await bootstrapClient.query('SELECT pg_advisory_unlock($1)', [SCHEMA_BOOTSTRAP_LOCK_KEY]);
        bootstrapClient.release();
      } catch (unlockErr) {
        // Unlock itself failed — the connection is broken. Destroy it rather than leak it or
        // return it to the pool still holding the advisory lock.
        bootstrapClient.release(unlockErr instanceof Error ? unlockErr : new Error(String(unlockErr)));
      }
      throw err;
    }
    return new PgDbClient(pool);
  }
  // `:memory:` (tests) or any local path (local `npm run dev` default) both use PGlite — a real
  // Postgres engine compiled to WASM, not a mock, so the SQL executed is identical to production.
  const pglite = url === ':memory:' ? new PGlite() : new PGlite(url);
  await pglite.exec(SCHEMA_SQL); // .exec (not .query) runs the semicolon-separated statement list
  return new PgliteDbClient(pglite, pglite);
}
