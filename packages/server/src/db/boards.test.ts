import { describe, it, expect, beforeEach } from 'vitest';
import type { DbClient } from '../db.js';
import { createTestDb } from '../test-support/test-db.js';
import { createWorkspace } from './workspaces.js';
import { createBoard, listBoardsForWorkspace, findBoard, updateBoard, deleteBoard } from './boards.js';
import type { Board } from '@iyulab/u-board/domain';

let db: DbClient;
let workspaceId: string;
beforeEach(async () => {
  db = await createTestDb();
  workspaceId = (await createWorkspace(db, 'W1')).id;
});

describe('board repository', () => {
  it('creates a board with no parts yet', async () => {
    const board = await createBoard(db, { actorUserId: 'test-actor', workspaceId, name: 'My Board' });
    expect(board.name).toBe('My Board');
    expect(board.document).toEqual({ parts: {}, layout: { kind: 'canvas', size: [1280, 720], place: {} } });
    expect(board.createdAt).toBe(board.updatedAt);
  });

  it('creates each board with a unique document object (not a shared singleton)', async () => {
    const board1 = await createBoard(db, { actorUserId: 'test-actor', workspaceId, name: 'A' });
    const board2 = await createBoard(db, { actorUserId: 'test-actor', workspaceId, name: 'B' });
    expect(board1.document).not.toBe(board2.document);
    expect((board1.document as Board).parts).not.toBe((board2.document as Board).parts);
  });

  it('lists boards for a workspace without the document body', async () => {
    await createBoard(db, { actorUserId: 'test-actor', workspaceId, name: 'A' });
    await createBoard(db, { actorUserId: 'test-actor', workspaceId, name: 'B' });
    const list = await listBoardsForWorkspace(db, workspaceId);
    expect(list.map(b => b.name).sort()).toEqual(['A', 'B']);
    expect(list[0]).not.toHaveProperty('document');
  });

  it('does not list boards belonging to another workspace', async () => {
    const otherWorkspaceId = (await createWorkspace(db, 'Other')).id;
    await createBoard(db, { actorUserId: 'test-actor', workspaceId: otherWorkspaceId, name: 'Not mine' });
    expect(await listBoardsForWorkspace(db, workspaceId)).toEqual([]);
  });

  it('finds a board only when workspaceId matches', async () => {
    const board = await createBoard(db, { actorUserId: 'test-actor', workspaceId, name: 'A' });
    expect(await findBoard(db, workspaceId, board.id)).toEqual(board);

    const otherWorkspaceId = (await createWorkspace(db, 'Other')).id;
    expect(await findBoard(db, otherWorkspaceId, board.id)).toBeUndefined();
  });

  it('updates name and document, bumping updatedAt', async () => {
    const board = await createBoard(db, { actorUserId: 'test-actor', workspaceId, name: 'A' });
    await new Promise(r => setTimeout(r, 2)); // ensure a distinguishable ISO timestamp
    const newDoc: Board = { parts: { n1: { as: 'label', title: 'N1' } }, layout: { kind: 'canvas', size: [400, 300], place: { n1: [0, 0] } } };
    const result = await updateBoard(db, workspaceId, board.id, { name: 'Renamed', document: newDoc });
    if (!('board' in result)) throw new Error('expected the board');
    expect(result.board).toMatchObject({ name: 'Renamed', document: newDoc, revision: 2 });
    expect(result.board.updatedAt).not.toBe(board.updatedAt);
    expect(result.board.createdAt).toBe(board.createdAt);
  });

  it('starts a board at revision 1 and counts each save', async () => {
    const board = await createBoard(db, { actorUserId: 'test-actor', workspaceId, name: 'A' });
    expect(board.revision).toBe(1);
    await updateBoard(db, workspaceId, board.id, { name: 'B' });
    await updateBoard(db, workspaceId, board.id, { name: 'C' });
    expect((await findBoard(db, workspaceId, board.id))?.revision).toBe(3);
  });

  it('saves against the revision it names, and refuses a save made against an older one', async () => {
    const board = await createBoard(db, { actorUserId: 'test-actor', workspaceId, name: 'A' });
    expect('board' in (await updateBoard(db, workspaceId, board.id, { name: 'Mine' }, 1))).toBe(true);
    // A second save of the same copy (revision 1) would overwrite the first one unseen.
    expect(await updateBoard(db, workspaceId, board.id, { name: 'Theirs' }, 1)).toEqual({ conflict: { revision: 2 } });
    expect((await findBoard(db, workspaceId, board.id))?.name).toBe('Mine');
  });

  it('keeps what a save leaves out', async () => {
    const board = await createBoard(db, { actorUserId: 'test-actor', workspaceId, name: 'A' });
    await updateBoard(db, workspaceId, board.id, { name: 'Renamed' });
    expect((await findBoard(db, workspaceId, board.id))?.document).toEqual(board.document);
  });

  it('updateBoard finds no board in another workspace', async () => {
    const board = await createBoard(db, { actorUserId: 'test-actor', workspaceId, name: 'A' });
    const otherWorkspaceId = (await createWorkspace(db, 'Other')).id;
    expect(await updateBoard(db, otherWorkspaceId, board.id, { name: 'X' })).toEqual({ notFound: true });
  });

  it('deletes a board and returns true, false if it did not exist', async () => {
    const board = await createBoard(db, { actorUserId: 'test-actor', workspaceId, name: 'A' });
    expect(await deleteBoard(db, workspaceId, board.id, 'test-actor')).toBe(true);
    expect(await findBoard(db, workspaceId, board.id)).toBeUndefined();
    expect(await deleteBoard(db, workspaceId, board.id, 'test-actor')).toBe(false);
  });
});
