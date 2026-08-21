import type Database from 'better-sqlite3';
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
}

export interface BoardShareTokenSummary {
  id: string;
  tokenMask: string;
  createdAt: string;
  lastUsedAt?: string;
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
  };
}

export function createBoardShareToken(
  db: Database.Database,
  input: { boardId: string; workspaceId: string; tokenHash: string; tokenMask: string; createdByUserId: string }
): BoardShareToken {
  const token: BoardShareToken = {
    id: randomUUID(),
    boardId: input.boardId,
    workspaceId: input.workspaceId,
    tokenHash: input.tokenHash,
    tokenMask: input.tokenMask,
    createdByUserId: input.createdByUserId,
    createdAt: new Date().toISOString(),
  };
  db.prepare(
    `INSERT INTO board_share_tokens (id, board_id, workspace_id, token_hash, token_mask, created_by_user_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(token.id, token.boardId, token.workspaceId, token.tokenHash, token.tokenMask, token.createdByUserId, token.createdAt);
  return token;
}

export function listBoardShareTokensForBoard(
  db: Database.Database,
  workspaceId: string,
  boardId: string
): BoardShareTokenSummary[] {
  const rows = db
    .prepare(`SELECT id, token_mask, created_at, last_used_at FROM board_share_tokens WHERE board_id = ? AND workspace_id = ?`)
    .all(boardId, workspaceId) as { id: string; token_mask: string; created_at: string; last_used_at: string | null }[];
  return rows.map(r => ({ id: r.id, tokenMask: r.token_mask, createdAt: r.created_at, lastUsedAt: r.last_used_at ?? undefined }));
}

export function findBoardShareTokenByHash(db: Database.Database, tokenHash: string): BoardShareToken | undefined {
  const row = db.prepare(`SELECT * FROM board_share_tokens WHERE token_hash = ?`).get(tokenHash) as BoardShareTokenRow | undefined;
  return row ? rowToToken(row) : undefined;
}

export function deleteBoardShareToken(db: Database.Database, workspaceId: string, boardId: string, tokenId: string): boolean {
  const result = db
    .prepare(`DELETE FROM board_share_tokens WHERE id = ? AND board_id = ? AND workspace_id = ?`)
    .run(tokenId, boardId, workspaceId);
  return result.changes > 0;
}

export function touchBoardShareTokenLastUsed(db: Database.Database, tokenId: string): void {
  db.prepare(`UPDATE board_share_tokens SET last_used_at = ? WHERE id = ?`).run(new Date().toISOString(), tokenId);
}
