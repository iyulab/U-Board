import { randomUUID } from 'node:crypto';
import type { DbClient } from '../db.js';
import { recordAuditEvent } from './audit.js';

/** What a token may do: `read` — look (GET); `write` — change as well, as far as its owner's role allows. */
export type ApiTokenScope = 'read' | 'write';

export interface ApiToken {
  id: string;
  workspaceId: string;
  /** Who made it — the person it acts as. */
  userId: string;
  name: string;
  scope: ApiTokenScope;
  tokenHash: string;
  /** Its visible ending, to tell tokens apart — never enough to use it. */
  tokenMask: string;
  createdAt: string;
  lastUsedAt?: string;
  /** When it stops working (ISO 8601). Absent: when it is deleted. */
  expiresAt?: string;
}

/** A token as the console lists it: no hash. */
export type ApiTokenSummary = Omit<ApiToken, 'tokenHash' | 'workspaceId'>;

interface ApiTokenRow {
  id: string;
  workspace_id: string;
  user_id: string;
  name: string;
  scope: ApiTokenScope;
  token_hash: string;
  token_mask: string;
  created_at: string;
  last_used_at: string | null;
  expires_at: string | null;
}

function rowToToken(row: ApiTokenRow): ApiToken {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    userId: row.user_id,
    name: row.name,
    scope: row.scope,
    tokenHash: row.token_hash,
    tokenMask: row.token_mask,
    createdAt: row.created_at,
    lastUsedAt: row.last_used_at ?? undefined,
    expiresAt: row.expires_at ?? undefined,
  };
}

function summaryOf({ tokenHash: _hash, workspaceId: _workspace, ...summary }: ApiToken): ApiTokenSummary {
  return summary;
}

export async function createApiToken(
  db: DbClient,
  input: { workspaceId: string; userId: string; name: string; scope: ApiTokenScope; tokenHash: string; tokenMask: string; expiresAt?: string }
): Promise<ApiTokenSummary> {
  const token: ApiToken = { id: randomUUID(), createdAt: new Date().toISOString(), ...input };
  await db.withTransaction(async tx => {
    await tx.query(
      `INSERT INTO api_tokens (id, workspace_id, user_id, name, scope, token_hash, token_mask, created_at, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [token.id, token.workspaceId, token.userId, token.name, token.scope, token.tokenHash, token.tokenMask, token.createdAt, token.expiresAt ?? null]
    );
    await recordAuditEvent(tx, {
      action: 'api_token.created',
      workspaceId: token.workspaceId,
      actorUserId: token.userId,
      target: { id: token.id, name: token.name },
      detail: `${token.scope} ${token.tokenMask}`,
    });
  });
  return summaryOf(token);
}

/** The workspace's tokens, newest first — every one for an owner, a member's own otherwise. */
export async function listApiTokens(db: DbClient, workspaceId: string, onlyUserId?: string): Promise<ApiTokenSummary[]> {
  const { rows } = onlyUserId
    ? await db.query<ApiTokenRow>(`SELECT * FROM api_tokens WHERE workspace_id = $1 AND user_id = $2 ORDER BY created_at DESC`, [workspaceId, onlyUserId])
    : await db.query<ApiTokenRow>(`SELECT * FROM api_tokens WHERE workspace_id = $1 ORDER BY created_at DESC`, [workspaceId]);
  return rows.map(row => summaryOf(rowToToken(row)));
}

export async function findApiTokenByHash(db: DbClient, tokenHash: string): Promise<ApiToken | undefined> {
  const { rows } = await db.query<ApiTokenRow>(`SELECT * FROM api_tokens WHERE token_hash = $1`, [tokenHash]);
  return rows[0] ? rowToToken(rows[0]) : undefined;
}

/** Notes that a token was used — at most once a minute, so a busy program does not write on every request. */
export async function touchApiTokenLastUsed(db: DbClient, tokenId: string): Promise<void> {
  const now = new Date();
  await db.query(`UPDATE api_tokens SET last_used_at = $2 WHERE id = $1 AND (last_used_at IS NULL OR last_used_at < $3)`, [
    tokenId,
    now.toISOString(),
    new Date(now.getTime() - 60_000).toISOString(),
  ]);
}

/** Deletes a token of the workspace — when `onlyUserId` is given, only if it is that person's. */
export async function deleteApiToken(db: DbClient, workspaceId: string, tokenId: string, actorUserId: string, onlyUserId?: string): Promise<boolean> {
  return db.withTransaction(async tx => {
    const { rows } = await tx.query<{ name: string; scope: string; token_mask: string }>(
      `DELETE FROM api_tokens WHERE id = $1 AND workspace_id = $2 AND ($3::text IS NULL OR user_id = $3) RETURNING name, scope, token_mask`,
      [tokenId, workspaceId, onlyUserId ?? null]
    );
    if (!rows[0]) return false;
    await recordAuditEvent(tx, {
      action: 'api_token.deleted',
      workspaceId,
      actorUserId,
      target: { id: tokenId, name: rows[0].name },
      detail: `${rows[0].scope} ${rows[0].token_mask}`,
    });
    return true;
  });
}
