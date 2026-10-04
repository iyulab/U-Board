import type { DbClient } from '../db.js';
import { randomUUID } from 'node:crypto';

export interface BoardShareToken {
  id: string;
  boardId: string;
  workspaceId: string;
  tokenHash: string;
  tokenMask: string;
  createdByUserId: string;
  createdAt: string;
  lastUsedAt?: string;
  /** When the link stops working (ISO 8601). Absent: it works until it is revoked. */
  expiresAt?: string;
}

export interface BoardShareTokenSummary {
  id: string;
  tokenMask: string;
  createdAt: string;
  lastUsedAt?: string;
  expiresAt?: string;
}

interface BoardShareTokenRow {
  id: string;
  board_id: string;
  workspace_id: string;
  token_hash: string;
  token_mask: string;
  created_by_user_id: string;
  created_at: string;
  last_used_at: string | null;
  expires_at: string | null;
}

function rowToToken(row: BoardShareTokenRow): BoardShareToken {
  return {
    id: row.id,
    boardId: row.board_id,
    workspaceId: row.workspace_id,
    tokenHash: row.token_hash,
    tokenMask: row.token_mask,
    createdByUserId: row.created_by_user_id,
    createdAt: row.created_at,
    lastUsedAt: row.last_used_at ?? undefined,
    expiresAt: row.expires_at ?? undefined,
  };
}

export async function createBoardShareToken(
  db: DbClient,
  input: { boardId: string; workspaceId: string; tokenHash: string; tokenMask: string; createdByUserId: string; expiresAt?: string }
): Promise<BoardShareToken> {
  const token: BoardShareToken = {
    id: randomUUID(),
    boardId: input.boardId,
    workspaceId: input.workspaceId,
    tokenHash: input.tokenHash,
    tokenMask: input.tokenMask,
    createdByUserId: input.createdByUserId,
    createdAt: new Date().toISOString(),
    ...(input.expiresAt && { expiresAt: input.expiresAt }),
  };
  await db.query(
    `INSERT INTO board_share_tokens (id, board_id, workspace_id, token_hash, token_mask, created_by_user_id, created_at, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [token.id, token.boardId, token.workspaceId, token.tokenHash, token.tokenMask, token.createdByUserId, token.createdAt, token.expiresAt ?? null]
  );
  return token;
}

export async function listBoardShareTokensForBoard(
  db: DbClient,
  workspaceId: string,
  boardId: string
): Promise<BoardShareTokenSummary[]> {
  const { rows } = await db.query<{ id: string; token_mask: string; created_at: string; last_used_at: string | null; expires_at: string | null }>(
    `SELECT id, token_mask, created_at, last_used_at, expires_at FROM board_share_tokens WHERE board_id = $1 AND workspace_id = $2`,
    [boardId, workspaceId]
  );
  return rows.map(r => ({
    id: r.id,
    tokenMask: r.token_mask,
    createdAt: r.created_at,
    lastUsedAt: r.last_used_at ?? undefined,
    expiresAt: r.expires_at ?? undefined,
  }));
}

export async function findBoardShareTokenByHash(db: DbClient, tokenHash: string): Promise<BoardShareToken | undefined> {
  const { rows } = await db.query<BoardShareTokenRow>(`SELECT * FROM board_share_tokens WHERE token_hash = $1`, [tokenHash]);
  return rows[0] ? rowToToken(rows[0]) : undefined;
}

export async function deleteBoardShareToken(db: DbClient, workspaceId: string, boardId: string, tokenId: string): Promise<boolean> {
  const { rowCount } = await db.query(
    `DELETE FROM board_share_tokens WHERE id = $1 AND board_id = $2 AND workspace_id = $3`,
    [tokenId, boardId, workspaceId]
  );
  return (rowCount ?? 0) > 0;
}

export async function touchBoardShareTokenLastUsed(db: DbClient, tokenId: string): Promise<void> {
  await db.query(`UPDATE board_share_tokens SET last_used_at = $1 WHERE id = $2`, [new Date().toISOString(), tokenId]);
}
