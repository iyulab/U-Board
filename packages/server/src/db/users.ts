import type { DbClient } from '../db.js';
import { randomUUID } from 'node:crypto';
import { normalizeEmail } from './email.js';

/** `operator` runs the installation; every other account is a `user`. Distinct from a workspace
 *  role — owning a workspace does not make anyone an operator. */
export type InstanceRole = 'operator' | 'user';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  instanceRole: InstanceRole;
  /** Sessions issued before this moment (ISO 8601) are refused; undefined when none are. */
  sessionsValidAfter?: string;
  createdAt: string;
}

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  instance_role: InstanceRole;
  sessions_valid_after: string | null;
  created_at: string;
}

function rowToUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    name: row.name,
    instanceRole: row.instance_role,
    ...(row.sessions_valid_after ? { sessionsValidAfter: row.sessions_valid_after } : {}),
    createdAt: row.created_at,
  };
}

export async function createUser(
  db: DbClient,
  input: { email: string; passwordHash: string; name: string; instanceRole?: InstanceRole }
): Promise<User> {
  const user: User = {
    id: randomUUID(),
    email: normalizeEmail(input.email),
    passwordHash: input.passwordHash,
    name: input.name,
    instanceRole: input.instanceRole ?? 'user',
    createdAt: new Date().toISOString(),
  };
  await db.query(
    `INSERT INTO users (id, email, password_hash, name, instance_role, created_at) VALUES ($1, $2, $3, $4, $5, $6)`,
    [user.id, user.email, user.passwordHash, user.name, user.instanceRole, user.createdAt]
  );
  return user;
}

export async function findUserByEmail(db: DbClient, email: string): Promise<User | undefined> {
  const { rows } = await db.query<UserRow>(`SELECT * FROM users WHERE email = $1`, [normalizeEmail(email)]);
  return rows[0] ? rowToUser(rows[0]) : undefined;
}

export async function findUserById(db: DbClient, id: string): Promise<User | undefined> {
  const { rows } = await db.query<UserRow>(`SELECT * FROM users WHERE id = $1`, [id]);
  return rows[0] ? rowToUser(rows[0]) : undefined;
}

/** Replaces the password and signs out every session issued until now — they were opened with the
 *  old one. Returns that moment, so the caller can issue the one session it means to keep after it. */
export async function updateUserPassword(db: DbClient, userId: string, passwordHash: string): Promise<number> {
  const now = Date.now();
  await db.query(`UPDATE users SET password_hash = $1, sessions_valid_after = $2 WHERE id = $3`, [
    passwordHash,
    new Date(now).toISOString(),
    userId,
  ]);
  return now;
}

export async function updateUserName(db: DbClient, userId: string, name: string): Promise<void> {
  await db.query(`UPDATE users SET name = $1 WHERE id = $2`, [name, userId]);
}

export async function countUsers(db: DbClient): Promise<number> {
  // Postgres COUNT(*) returns bigint, which node-postgres/PGlite surface as a string to avoid
  // precision loss beyond Number.MAX_SAFE_INTEGER — Number(...) is safe here (user counts never
  // approach that range).
  const { rows } = await db.query<{ count: string }>(`SELECT COUNT(*) as count FROM users`);
  return Number(rows[0].count);
}
