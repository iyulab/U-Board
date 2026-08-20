import type Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import type { ViewDocument } from '@iyulab/u-board';

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

const EMPTY_DOCUMENT: ViewDocument = { kind: 'canvas', background: {}, nodes: [], connectors: [] };

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

export function createBoard(db: Database.Database, input: { workspaceId: string; name: string }): Board {
  const now = new Date().toISOString();
  const board: Board = {
    id: randomUUID(),
    workspaceId: input.workspaceId,
    name: input.name,
    document: EMPTY_DOCUMENT,
    createdAt: now,
    updatedAt: now,
  };
  db.prepare(
    `INSERT INTO boards (id, workspace_id, name, document, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(board.id, board.workspaceId, board.name, JSON.stringify(board.document), board.createdAt, board.updatedAt);
  return board;
}

export function listBoardsForWorkspace(
  db: Database.Database,
  workspaceId: string
): Array<{ id: string; name: string; updatedAt: string }> {
  const rows = db
    .prepare(`SELECT id, name, updated_at FROM boards WHERE workspace_id = ?`)
    .all(workspaceId) as { id: string; name: string; updated_at: string }[];
  return rows.map(r => ({ id: r.id, name: r.name, updatedAt: r.updated_at }));
}

export function findBoard(db: Database.Database, workspaceId: string, boardId: string): Board | undefined {
  const row = db
    .prepare(`SELECT * FROM boards WHERE id = ? AND workspace_id = ?`)
    .get(boardId, workspaceId) as BoardRow | undefined;
  return row ? rowToBoard(row) : undefined;
}

export function updateBoard(
  db: Database.Database,
  workspaceId: string,
  boardId: string,
  input: { name?: string; document?: ViewDocument }
): Board | undefined {
  const existing = findBoard(db, workspaceId, boardId);
  if (!existing) return undefined;

  const updated: Board = {
    ...existing,
    name: input.name ?? existing.name,
    document: input.document ?? existing.document,
    updatedAt: new Date().toISOString(),
  };
  db.prepare(`UPDATE boards SET name = ?, document = ?, updated_at = ? WHERE id = ? AND workspace_id = ?`).run(
    updated.name, JSON.stringify(updated.document), updated.updatedAt, boardId, workspaceId
  );
  return updated;
}

export function deleteBoard(db: Database.Database, workspaceId: string, boardId: string): boolean {
  const result = db.prepare(`DELETE FROM boards WHERE id = ? AND workspace_id = ?`).run(boardId, workspaceId);
  return result.changes > 0;
}
