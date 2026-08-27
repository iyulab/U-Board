import type { DbClient } from '../db.js';
import { randomUUID } from 'node:crypto';
import { normalizeEmail } from './email.js';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  createdAt: string;
}

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  created_at: string;
}

function rowToUser(row: UserRow): User {
  return { id: row.id, email: row.email, passwordHash: row.password_hash, name: row.name, createdAt: row.created_at };
}

export async function createUser(
  db: DbClient,
  input: { email: string; passwordHash: string; name: string }
): Promise<User> {
  const user: User = {
    id: randomUUID(),
    email: normalizeEmail(input.email),
    passwordHash: input.passwordHash,
    name: input.name,
    createdAt: new Date().toISOString(),
  };
  await db.query(`INSERT INTO users (id, email, password_hash, name, created_at) VALUES ($1, $2, $3, $4, $5)`, [
    user.id, user.email, user.passwordHash, user.name, user.createdAt,
  ]);
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

export async function updateUserPassword(db: DbClient, userId: string, passwordHash: string): Promise<void> {
  await db.query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [passwordHash, userId]);
}

export async function countUsers(db: DbClient): Promise<number> {
  // Postgres COUNT(*) returns bigint, which node-postgres/PGlite surface as a string to avoid
  // precision loss beyond Number.MAX_SAFE_INTEGER — Number(...) is safe here (user counts never
  // approach that range).
  const { rows } = await db.query<{ count: string }>(`SELECT COUNT(*) as count FROM users`);
  return Number(rows[0].count);
}
