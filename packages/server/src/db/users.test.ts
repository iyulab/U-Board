import { describe, it, expect, beforeEach } from 'vitest';
import type { DbClient } from '../db.js';
import { createDb } from '../db.js';
import { createUser, findUserByEmail, findUserById, countUsers } from './users.js';

let db: DbClient;
beforeEach(async () => {
  db = await createDb(':memory:');
});

describe('user repository', () => {
  it('creates a user and finds it by email', async () => {
    const created = await createUser(db, { email: 'a@x.com', passwordHash: 'h', name: 'A' });
    expect(await findUserByEmail(db, 'a@x.com')).toEqual(created);
  });

  it('finds a user by id', async () => {
    const created = await createUser(db, { email: 'b@x.com', passwordHash: 'h', name: 'B' });
    expect(await findUserById(db, created.id)).toEqual(created);
  });

  it('returns undefined for an unknown email', async () => {
    expect(await findUserByEmail(db, 'nobody@x.com')).toBeUndefined();
  });

  it('normalizes email casing/whitespace on write, and on lookup', async () => {
    const created = await createUser(db, { email: 'alice@x.com', passwordHash: 'h', name: 'Alice' });
    expect(created.email).toBe('alice@x.com');
    expect(await findUserByEmail(db, 'ALICE@x.com')).toEqual(created);
    expect(await findUserByEmail(db, '  Alice@X.com  ')).toEqual(created);
  });

  it('stores a mixed-case email in normalized form, findable by the lowercase form', async () => {
    const created = await createUser(db, { email: '  Bob@X.COM ', passwordHash: 'h', name: 'Bob' });
    expect(created.email).toBe('bob@x.com');
    expect(await findUserByEmail(db, 'bob@x.com')).toEqual(created);
  });

  it('counts users', async () => {
    expect(await countUsers(db)).toBe(0);
    await createUser(db, { email: 'c@x.com', passwordHash: 'h', name: 'C' });
    expect(await countUsers(db)).toBe(1);
  });
});
