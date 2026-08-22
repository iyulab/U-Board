import type { DbClient } from '../db.js';
import { randomUUID } from 'node:crypto';
import type { ViewDocument } from '@iyulab/u-board/domain';

export interface Board {
  id: string;
  workspaceId: string;
  name: string;
  document: ViewDocument;
  createdAt: string;
  updatedAt: string;
}

interface BoardRow {
  id: string;
  workspace_id: string;
  name: string;
  document: string;
  created_at: string;
  updated_at: string;
}

function rowToBoard(row: BoardRow): Board {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    document: JSON.parse(row.document),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createBoard(db: DbClient, input: { workspaceId: string; name: string }): Promise<Board> {
  const now = new Date().toISOString();
  const board: Board = {
    id: randomUUID(),
    workspaceId: input.workspaceId,
    name: input.name,
    document: { kind: 'canvas', background: {}, nodes: [], connectors: [] },
    createdAt: now,
    updatedAt: now,
  };
  await db.query(
    `INSERT INTO boards (id, workspace_id, name, document, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6)`,
    [board.id, board.workspaceId, board.name, JSON.stringify(board.document), board.createdAt, board.updatedAt]
  );
  return board;
}

export async function listBoardsForWorkspace(
  db: DbClient,
  workspaceId: string
): Promise<Array<{ id: string; name: string; updatedAt: string }>> {
  const { rows } = await db.query<{ id: string; name: string; updated_at: string }>(
    `SELECT id, name, updated_at FROM boards WHERE workspace_id = $1`,
    [workspaceId]
  );
  return rows.map(r => ({ id: r.id, name: r.name, updatedAt: r.updated_at }));
}

export async function findBoard(db: DbClient, workspaceId: string, boardId: string): Promise<Board | undefined> {
  const { rows } = await db.query<BoardRow>(`SELECT * FROM boards WHERE id = $1 AND workspace_id = $2`, [boardId, workspaceId]);
  return rows[0] ? rowToBoard(rows[0]) : undefined;
}

export async function updateBoard(
  db: DbClient,
  workspaceId: string,
  boardId: string,
  input: { name?: string; document?: ViewDocument }
): Promise<Board | undefined> {
  const existing = await findBoard(db, workspaceId, boardId);
  if (!existing) return undefined;

  const updated: Board = {
    ...existing,
    name: input.name ?? existing.name,
    document: input.document ?? existing.document,
    updatedAt: new Date().toISOString(),
  };
  await db.query(
    `UPDATE boards SET name = $1, document = $2, updated_at = $3 WHERE id = $4 AND workspace_id = $5`,
    [updated.name, JSON.stringify(updated.document), updated.updatedAt, boardId, workspaceId]
  );
  return updated;
}

export async function deleteBoard(db: DbClient, workspaceId: string, boardId: string): Promise<boolean> {
  const { rowCount } = await db.query(`DELETE FROM boards WHERE id = $1 AND workspace_id = $2`, [boardId, workspaceId]);
  return (rowCount ?? 0) > 0;
}
