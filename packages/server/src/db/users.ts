import type Database from 'better-sqlite3';
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

export function createUser(
  db: Database.Database,
  input: { email: string; passwordHash: string; name: string }
): User {
  const user: User = { id: randomUUID(), email: normalizeEmail(input.email), passwordHash: input.passwordHash, name: input.name, createdAt: new Date().toISOString() };
  db.prepare(`INSERT INTO users (id, email, password_hash, name, created_at) VALUES (?, ?, ?, ?, ?)`).run(
    user.id, user.email, user.passwordHash, user.name, user.createdAt
  );
  return user;
}

export function findUserByEmail(db: Database.Database, email: string): User | undefined {
  const row = db.prepare(`SELECT * FROM users WHERE email = ?`).get(normalizeEmail(email)) as UserRow | undefined;
  return row ? rowToUser(row) : undefined;
}

export function findUserById(db: Database.Database, id: string): User | undefined {
  const row = db.prepare(`SELECT * FROM users WHERE id = ?`).get(id) as UserRow | undefined;
  return row ? rowToUser(row) : undefined;
}

export function countUsers(db: Database.Database): number {
  const row = db.prepare(`SELECT COUNT(*) as count FROM users`).get() as { count: number };
  return row.count;
}
