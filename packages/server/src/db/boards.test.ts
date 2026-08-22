import { describe, it, expect, beforeEach } from 'vitest';
import type { DbClient } from '../db.js';
import { createDb } from '../db.js';
import { createWorkspace } from './workspaces.js';
import { createBoard, listBoardsForWorkspace, findBoard, updateBoard, deleteBoard } from './boards.js';

let db: DbClient;
let workspaceId: string;
beforeEach(async () => {
  db = await createDb(':memory:');
  workspaceId = (await createWorkspace(db, 'W1')).id;
});

describe('board repository', () => {
  it('creates a board with an empty document', async () => {
    const board = await createBoard(db, { workspaceId, name: 'My Board' });
    expect(board.name).toBe('My Board');
    expect(board.document).toEqual({ kind: 'canvas', background: {}, nodes: [], connectors: [] });
    expect(board.createdAt).toBe(board.updatedAt);
  });

  it('creates each board with a unique document object (not a shared singleton)', async () => {
    const board1 = await createBoard(db, { workspaceId, name: 'A' });
    const board2 = await createBoard(db, { workspaceId, name: 'B' });
    expect(board1.document.nodes).not.toBe(board2.document.nodes);
  });

  it('lists boards for a workspace without the document body', async () => {
    await createBoard(db, { workspaceId, name: 'A' });
    await createBoard(db, { workspaceId, name: 'B' });
    const list = await listBoardsForWorkspace(db, workspaceId);
    expect(list.map(b => b.name).sort()).toEqual(['A', 'B']);
    expect(list[0]).not.toHaveProperty('document');
  });

  it('does not list boards belonging to another workspace', async () => {
    const otherWorkspaceId = (await createWorkspace(db, 'Other')).id;
    await createBoard(db, { workspaceId: otherWorkspaceId, name: 'Not mine' });
    expect(await listBoardsForWorkspace(db, workspaceId)).toEqual([]);
  });

  it('finds a board only when workspaceId matches', async () => {
    const board = await createBoard(db, { workspaceId, name: 'A' });
    expect(await findBoard(db, workspaceId, board.id)).toEqual(board);

    const otherWorkspaceId = (await createWorkspace(db, 'Other')).id;
    expect(await findBoard(db, otherWorkspaceId, board.id)).toBeUndefined();
  });

  it('updates name and document, bumping updatedAt', async () => {
    const board = await createBoard(db, { workspaceId, name: 'A' });
    await new Promise(r => setTimeout(r, 2)); // ensure a distinguishable ISO timestamp
    const newDoc = { kind: 'canvas' as const, background: {}, nodes: [{ id: 'n1', x: 0, y: 0, anchored: false, widget: { type: 'status' } }], connectors: [] };
    const updated = await updateBoard(db, workspaceId, board.id, { name: 'Renamed', document: newDoc });
    expect(updated).toMatchObject({ name: 'Renamed', document: newDoc });
    expect(updated!.updatedAt).not.toBe(board.updatedAt);
    expect(updated!.createdAt).toBe(board.createdAt);
  });

  it('updateBoard returns undefined for a board in another workspace', async () => {
    const board = await createBoard(db, { workspaceId, name: 'A' });
    const otherWorkspaceId = (await createWorkspace(db, 'Other')).id;
    expect(await updateBoard(db, otherWorkspaceId, board.id, { name: 'X' })).toBeUndefined();
  });

  it('deletes a board and returns true, false if it did not exist', async () => {
    const board = await createBoard(db, { workspaceId, name: 'A' });
    expect(await deleteBoard(db, workspaceId, board.id)).toBe(true);
    expect(await findBoard(db, workspaceId, board.id)).toBeUndefined();
    expect(await deleteBoard(db, workspaceId, board.id)).toBe(false);
  });
});
