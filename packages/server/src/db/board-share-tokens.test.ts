import { describe, it, expect, beforeEach } from 'vitest';
import type { DbClient } from '../db.js';
import { createDb } from '../db.js';
import { createWorkspace } from './workspaces.js';
import { createUser } from './users.js';
import { createBoard } from './boards.js';
import {
  createBoardShareToken, listBoardShareTokensForBoard, findBoardShareTokenByHash,
  deleteBoardShareToken, touchBoardShareTokenLastUsed,
} from './board-share-tokens.js';

let db: DbClient;
let workspaceId: string;
let boardId: string;
let userId: string;

beforeEach(async () => {
  db = await createDb(':memory:');
  workspaceId = (await createWorkspace(db, 'W1')).id;
  boardId = (await createBoard(db, { workspaceId, name: 'Board A' })).id;
  userId = (await createUser(db, { email: 'owner@x.com', passwordHash: 'h', name: 'Owner' })).id;
});

describe('board share token repository', () => {
  it('creates a token with the given fields', async () => {
    const token = await createBoardShareToken(db, {
      boardId, workspaceId, tokenHash: 'hash-1', tokenMask: 'ab12cd34', createdByUserId: userId,
    });
    expect(token).toMatchObject({ boardId, workspaceId, tokenHash: 'hash-1', tokenMask: 'ab12cd34', createdByUserId: userId });
    expect(token.lastUsedAt).toBeUndefined();
  });

  it('lists tokens for a board without the hash', async () => {
    await createBoardShareToken(db, { boardId, workspaceId, tokenHash: 'hash-1', tokenMask: 'ab12cd34', createdByUserId: userId });
    const list = await listBoardShareTokensForBoard(db, workspaceId, boardId);
    expect(list).toEqual([expect.objectContaining({ tokenMask: 'ab12cd34' })]);
    expect(list[0]).not.toHaveProperty('tokenHash');
  });

  it('does not list tokens belonging to another board', async () => {
    const otherBoardId = (await createBoard(db, { workspaceId, name: 'Board B' })).id;
    await createBoardShareToken(db, { boardId: otherBoardId, workspaceId, tokenHash: 'hash-1', tokenMask: 'ab12cd34', createdByUserId: userId });
    expect(await listBoardShareTokensForBoard(db, workspaceId, boardId)).toEqual([]);
  });

  it('finds a token by hash regardless of board', async () => {
    await createBoardShareToken(db, { boardId, workspaceId, tokenHash: 'hash-1', tokenMask: 'ab12cd34', createdByUserId: userId });
    const found = await findBoardShareTokenByHash(db, 'hash-1');
    expect(found).toMatchObject({ boardId, workspaceId, tokenHash: 'hash-1' });
    expect(await findBoardShareTokenByHash(db, 'nonexistent')).toBeUndefined();
  });

  it('deletes a token only when board and workspace match, returns false otherwise', async () => {
    const token = await createBoardShareToken(db, { boardId, workspaceId, tokenHash: 'hash-1', tokenMask: 'ab12cd34', createdByUserId: userId });
    const otherWorkspaceId = (await createWorkspace(db, 'Other')).id;
    expect(await deleteBoardShareToken(db, otherWorkspaceId, boardId, token.id)).toBe(false);
    expect(await deleteBoardShareToken(db, workspaceId, boardId, token.id)).toBe(true);
    expect(await findBoardShareTokenByHash(db, 'hash-1')).toBeUndefined();
    expect(await deleteBoardShareToken(db, workspaceId, boardId, token.id)).toBe(false);
  });

  it('updates lastUsedAt when touched', async () => {
    const token = await createBoardShareToken(db, { boardId, workspaceId, tokenHash: 'hash-1', tokenMask: 'ab12cd34', createdByUserId: userId });
    expect(token.lastUsedAt).toBeUndefined();
    await touchBoardShareTokenLastUsed(db, token.id);
    const found = await findBoardShareTokenByHash(db, 'hash-1');
    expect(found!.lastUsedAt).toBeTruthy();
  });
});
