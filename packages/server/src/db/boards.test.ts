import { describe, it, expect, beforeEach } from 'vitest';
import type Database from 'better-sqlite3';
import { createDb } from '../db.js';
import { createWorkspace } from './workspaces.js';
import { createBoard, listBoardsForWorkspace, findBoard, updateBoard, deleteBoard } from './boards.js';

let db: Database.Database;
let workspaceId: string;
beforeEach(() => {
  db = createDb(':memory:');
  workspaceId = createWorkspace(db, 'W1').id;
});

describe('board repository', () => {
  it('creates a board with an empty document', () => {
    const board = createBoard(db, { workspaceId, name: 'My Board' });
    expect(board.name).toBe('My Board');
    expect(board.document).toEqual({ kind: 'canvas', background: {}, nodes: [], connectors: [] });
    expect(board.createdAt).toBe(board.updatedAt);
  });

  it('creates each board with a unique document object (not a shared singleton)', () => {
    const board1 = createBoard(db, { workspaceId, name: 'A' });
    const board2 = createBoard(db, { workspaceId, name: 'B' });
    expect(board1.document.nodes).not.toBe(board2.document.nodes);
  });

  it('lists boards for a workspace without the document body', () => {
    createBoard(db, { workspaceId, name: 'A' });
    createBoard(db, { workspaceId, name: 'B' });
    const list = listBoardsForWorkspace(db, workspaceId);
    expect(list.map(b => b.name).sort()).toEqual(['A', 'B']);
    expect(list[0]).not.toHaveProperty('document');
  });

  it('does not list boards belonging to another workspace', () => {
    const otherWorkspaceId = createWorkspace(db, 'Other').id;
    createBoard(db, { workspaceId: otherWorkspaceId, name: 'Not mine' });
    expect(listBoardsForWorkspace(db, workspaceId)).toEqual([]);
  });

  it('finds a board only when workspaceId matches', () => {
    const board = createBoard(db, { workspaceId, name: 'A' });
    expect(findBoard(db, workspaceId, board.id)).toEqual(board);

    const otherWorkspaceId = createWorkspace(db, 'Other').id;
    expect(findBoard(db, otherWorkspaceId, board.id)).toBeUndefined();
  });

  it('updates name and document, bumping updatedAt', async () => {
    const board = createBoard(db, { workspaceId, name: 'A' });
    await new Promise(r => setTimeout(r, 2)); // ensure a distinguishable ISO timestamp
    const newDoc = { kind: 'canvas' as const, background: {}, nodes: [{ id: 'n1', x: 0, y: 0, anchored: false, widget: { type: 'status' } }], connectors: [] };
    const updated = updateBoard(db, workspaceId, board.id, { name: 'Renamed', document: newDoc });
    expect(updated).toMatchObject({ name: 'Renamed', document: newDoc });
    expect(updated!.updatedAt).not.toBe(board.updatedAt);
    expect(updated!.createdAt).toBe(board.createdAt);
  });

  it('updateBoard returns undefined for a board in another workspace', () => {
    const board = createBoard(db, { workspaceId, name: 'A' });
    const otherWorkspaceId = createWorkspace(db, 'Other').id;
    expect(updateBoard(db, otherWorkspaceId, board.id, { name: 'X' })).toBeUndefined();
  });

  it('deletes a board and returns true, false if it did not exist', () => {
    const board = createBoard(db, { workspaceId, name: 'A' });
    expect(deleteBoard(db, workspaceId, board.id)).toBe(true);
    expect(findBoard(db, workspaceId, board.id)).toBeUndefined();
    expect(deleteBoard(db, workspaceId, board.id)).toBe(false);
  });
});
