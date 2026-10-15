import type { DbClient } from '../db.js';
import { randomUUID } from 'node:crypto';
import { recordAuditEvent } from './audit.js';
import { emptyViewDocument, type ViewDocument, type ViewKind } from '@iyulab/u-board/domain';

export interface Board {
  id: string;
  workspaceId: string;
  name: string;
  document: ViewDocument;
  createdAt: string;
  updatedAt: string;
  /** How many times the board has been saved, counting its creation as 1 — what a save names to say
   *  which copy it was made against (`updateBoard`'s `expectedRevision`). */
  revision: number;
}

interface BoardRow {
  id: string;
  workspace_id: string;
  name: string;
  document: string;
  created_at: string;
  updated_at: string;
  revision: number;
}

function rowToBoard(row: BoardRow): Board {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    document: JSON.parse(row.document),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    revision: Number(row.revision),
  };
}

/** Creates a board with an empty document of `kind` — a canvas unless told otherwise. */
export async function createBoard(db: DbClient, input: { workspaceId: string; name: string; actorUserId: string; kind?: ViewKind }): Promise<Board> {
  const now = new Date().toISOString();
  const board: Board = {
    id: randomUUID(),
    workspaceId: input.workspaceId,
    name: input.name,
    document: emptyViewDocument(input.kind ?? 'canvas'),
    createdAt: now,
    updatedAt: now,
    revision: 1,
  };
  await db.withTransaction(async tx => {
    await tx.query(
      `INSERT INTO boards (id, workspace_id, name, document, kind, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [board.id, board.workspaceId, board.name, JSON.stringify(board.document), board.document.kind, board.createdAt, board.updatedAt]
    );
    await recordAuditEvent(tx, {
      action: 'board.created',
      workspaceId: board.workspaceId,
      actorUserId: input.actorUserId,
      target: { id: board.id, name: board.name },
    });
  });
  return board;
}

export async function listBoardsForWorkspace(
  db: DbClient,
  workspaceId: string
): Promise<Array<{ id: string; name: string; kind: ViewKind; updatedAt: string }>> {
  const { rows } = await db.query<{ id: string; name: string; kind: ViewKind; updated_at: string }>(
    `SELECT id, name, kind, updated_at FROM boards WHERE workspace_id = $1`,
    [workspaceId]
  );
  return rows.map(r => ({ id: r.id, name: r.name, kind: r.kind, updatedAt: r.updated_at }));
}

export async function findBoard(db: DbClient, workspaceId: string, boardId: string): Promise<Board | undefined> {
  const { rows } = await db.query<BoardRow>(`SELECT * FROM boards WHERE id = $1 AND workspace_id = $2`, [boardId, workspaceId]);
  return rows[0] ? rowToBoard(rows[0]) : undefined;
}

/** What a save came to: the board as saved, no such board, or — when the save named the revision it was
 *  made against and the board has been saved since — the revision it is at now. */
export type UpdateBoardResult = { board: Board } | { notFound: true } | { conflict: { revision: number } };

/** Saves a board's name and/or document. With `expectedRevision`, only if the board is still at that
 *  revision — checked and bumped in one statement, so two saves of the same copy cannot both succeed. */
export async function updateBoard(
  db: DbClient,
  workspaceId: string,
  boardId: string,
  input: { name?: string; document?: ViewDocument },
  expectedRevision?: number
): Promise<UpdateBoardResult> {
  const { rows } = await db.query<BoardRow>(
    `UPDATE boards
        SET name = COALESCE($1, name), document = COALESCE($2, document), kind = COALESCE($7, kind), updated_at = $3,
            revision = revision + 1
      WHERE id = $4 AND workspace_id = $5 AND ($6::integer IS NULL OR revision = $6::integer)
      RETURNING *`,
    [
      input.name ?? null,
      input.document === undefined ? null : JSON.stringify(input.document),
      new Date().toISOString(),
      boardId,
      workspaceId,
      expectedRevision ?? null,
      input.document?.kind ?? null,
    ]
  );
  if (rows[0]) return { board: rowToBoard(rows[0]) };
  const current = await findBoard(db, workspaceId, boardId);
  return current ? { conflict: { revision: current.revision } } : { notFound: true };
}

export async function deleteBoard(db: DbClient, workspaceId: string, boardId: string, actorUserId: string): Promise<boolean> {
  return db.withTransaction(async tx => {
    const { rows } = await tx.query<{ name: string }>(
      `DELETE FROM boards WHERE id = $1 AND workspace_id = $2 RETURNING name`,
      [boardId, workspaceId]
    );
    if (!rows[0]) return false;
    await recordAuditEvent(tx, { action: 'board.deleted', workspaceId, actorUserId, target: { id: boardId, name: rows[0].name } });
    return true;
  });
}
