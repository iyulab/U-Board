import { describe, it, expect, beforeEach } from 'vitest';
import type Database from 'better-sqlite3';
import { createDb } from '../db.js';
import { createUser, findUserByEmail, findUserById, countUsers } from './users.js';

let db: Database.Database;
beforeEach(() => {
  db = createDb(':memory:');
});

describe('user repository', () => {
  it('creates a user and finds it by email', () => {
    const created = createUser(db, { email: 'a@x.com', passwordHash: 'h', name: 'A' });
    expect(findUserByEmail(db, 'a@x.com')).toEqual(created);
  });

  it('finds a user by id', () => {
    const created = createUser(db, { email: 'b@x.com', passwordHash: 'h', name: 'B' });
    expect(findUserById(db, created.id)).toEqual(created);
  });

  it('returns undefined for an unknown email', () => {
    expect(findUserByEmail(db, 'nobody@x.com')).toBeUndefined();
  });

  it('counts users', () => {
    expect(countUsers(db)).toBe(0);
    createUser(db, { email: 'c@x.com', passwordHash: 'h', name: 'C' });
    expect(countUsers(db)).toBe(1);
  });
});
