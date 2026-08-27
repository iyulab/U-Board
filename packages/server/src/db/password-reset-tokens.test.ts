import { describe, it, expect, beforeEach } from 'vitest';
import type { DbClient } from '../db.js';
import { createDb } from '../db.js';
import { createUser } from './users.js';
import {
  createPasswordResetToken,
  findPasswordResetTokenByHash,
  markPasswordResetTokenUsedIfUnused,
  isPasswordResetTokenUsable,
} from './password-reset-tokens.js';

let db: DbClient;
let userId: string;

beforeEach(async () => {
  db = await createDb(':memory:');
  const user = await createUser(db, { email: 'owner@x.com', passwordHash: 'h', name: 'Owner' });
  userId = user.id;
});

describe('password reset token repository', () => {
  it('creates a token and finds it by hash', async () => {
    const created = await createPasswordResetToken(db, { userId, tokenHash: 'hash1' });
    expect(await findPasswordResetTokenByHash(db, 'hash1')).toEqual(created);
  });

  it('is usable when unused and unexpired', async () => {
    const created = await createPasswordResetToken(db, { userId, tokenHash: 'hash2' });
    expect(isPasswordResetTokenUsable(created)).toBe(true);
  });

  it('markPasswordResetTokenUsedIfUnused claims an unused token and returns it', async () => {
    const created = await createPasswordResetToken(db, { userId, tokenHash: 'hash3' });
    const claimed = await markPasswordResetTokenUsedIfUnused(db, created.id);
    expect(claimed?.id).toBe(created.id);
    expect(claimed?.userId).toBe(userId);
  });

  it('markPasswordResetTokenUsedIfUnused returns undefined for an already-used token', async () => {
    const created = await createPasswordResetToken(db, { userId, tokenHash: 'hash4' });
    await markPasswordResetTokenUsedIfUnused(db, created.id);
    const second = await markPasswordResetTokenUsedIfUnused(db, created.id);
    expect(second).toBeUndefined();
  });

  it('is not usable after being marked used', async () => {
    const created = await createPasswordResetToken(db, { userId, tokenHash: 'hash5' });
    await markPasswordResetTokenUsedIfUnused(db, created.id);
    const reloaded = await findPasswordResetTokenByHash(db, 'hash5');
    expect(isPasswordResetTokenUsable(reloaded!)).toBe(false);
  });

  it('is not usable after expiring', async () => {
    const created = await createPasswordResetToken(db, { userId, tokenHash: 'hash6' });
    // createPasswordResetToken always sets a future expiry — backdate directly via SQL to test
    // this branch, same technique routes/invitations.test.ts uses for its expiry case.
    await db.query('UPDATE password_reset_tokens SET expires_at = $1 WHERE id = $2', [
      new Date(Date.now() - 1000).toISOString(),
      created.id,
    ]);
    const reloaded = await findPasswordResetTokenByHash(db, 'hash6');
    expect(isPasswordResetTokenUsable(reloaded!)).toBe(false);
  });
});
