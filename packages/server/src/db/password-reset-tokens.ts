import type { DbClient } from '../db.js';
import { randomUUID } from 'node:crypto';

export interface PasswordResetToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
  usedAt: string | null;
}

/** Short-lived by design — unlike a workspace invitation (meant to sit in an inbox for days), a
 *  reset token is only ever needed for the few minutes between requesting it and using it, and a
 *  narrow window shrinks the blast radius of a leaked or intercepted email. */
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

interface PasswordResetTokenRow {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  used_at: string | null;
}

function rowToToken(row: PasswordResetTokenRow): PasswordResetToken {
  return { id: row.id, userId: row.user_id, tokenHash: row.token_hash, expiresAt: row.expires_at, usedAt: row.used_at };
}

export async function createPasswordResetToken(
  db: DbClient,
  input: { userId: string; tokenHash: string }
): Promise<PasswordResetToken> {
  const token: PasswordResetToken = {
    id: randomUUID(),
    userId: input.userId,
    tokenHash: input.tokenHash,
    expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString(),
    usedAt: null,
  };
  await db.query(
    `INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at, used_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [token.id, token.userId, token.tokenHash, token.expiresAt, token.usedAt]
  );
  return token;
}

export async function findPasswordResetTokenByHash(db: DbClient, tokenHash: string): Promise<PasswordResetToken | undefined> {
  const { rows } = await db.query<PasswordResetTokenRow>(`SELECT * FROM password_reset_tokens WHERE token_hash = $1`, [tokenHash]);
  return rows[0] ? rowToToken(rows[0]) : undefined;
}

/** Atomically claims a reset token only if nobody has used it yet — mirrors
 * `markInvitationAcceptedIfUnused`'s conditional-UPDATE pattern so two concurrent redemptions of
 * the same token (e.g. an email client's link-prefetching) can't both succeed. */
export async function markPasswordResetTokenUsedIfUnused(db: DbClient, id: string): Promise<PasswordResetToken | undefined> {
  const { rows } = await db.query<PasswordResetTokenRow>(
    `UPDATE password_reset_tokens SET used_at = $1 WHERE id = $2 AND used_at IS NULL RETURNING *`,
    [new Date().toISOString(), id]
  );
  return rows[0] ? rowToToken(rows[0]) : undefined;
}

export function isPasswordResetTokenUsable(token: PasswordResetToken): boolean {
  if (token.usedAt !== null) return false;
  return new Date(token.expiresAt).getTime() > Date.now();
}
