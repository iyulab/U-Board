import { describe, it, expect, beforeEach } from 'vitest';
import type Database from 'better-sqlite3';
import { createDb } from '../db.js';
import { createWorkspace } from './workspaces.js';
import { createUser } from './users.js';
import { createBoard } from './boards.js';
import {
  createBoardShareToken,
  listBoardShareTokensForBoard,
  findBoardShareTokenByHash,
  deleteBoardShareToken,
  touchBoardShareTokenLastUsed,
} from './board-share-tokens.js';

let db: Database.Database;
let workspaceId: string;
let boardId: string;
let userId: string;

beforeEach(() => {
  db = createDb(':memory:');
  workspaceId = createWorkspace(db, 'W1').id;
  boardId = createBoard(db, { workspaceId, name: 'Board A' }).id;
  userId = createUser(db, { email: 'owner@x.com', passwordHash: 'h', name: 'Owner' }).id;
});

describe('board share token repository', () => {
  it('creates a token with the given fields', () => {
    const token = createBoardShareToken(db, {
      boardId, workspaceId, tokenHash: 'hash-1', tokenMask: 'ab12cd34', createdByUserId: userId,
    });
    expect(token).toMatchObject({ boardId, workspaceId, tokenHash: 'hash-1', tokenMask: 'ab12cd34', createdByUserId: userId });
    expect(token.lastUsedAt).toBeUndefined();
  });

  it('lists tokens for a board without the hash', () => {
    createBoardShareToken(db, { boardId, workspaceId, tokenHash: 'hash-1', tokenMask: 'ab12cd34', createdByUserId: userId });
    const list = listBoardShareTokensForBoard(db, workspaceId, boardId);
    expect(list).toEqual([expect.objectContaining({ tokenMask: 'ab12cd34' })]);
    expect(list[0]).not.toHaveProperty('tokenHash');
  });

  it('does not list tokens belonging to another board', () => {
    const otherBoardId = createBoard(db, { workspaceId, name: 'Board B' }).id;
    createBoardShareToken(db, { boardId: otherBoardId, workspaceId, tokenHash: 'hash-1', tokenMask: 'ab12cd34', createdByUserId: userId });
    expect(listBoardShareTokensForBoard(db, workspaceId, boardId)).toEqual([]);
  });

  it('finds a token by hash regardless of board', () => {
    createBoardShareToken(db, { boardId, workspaceId, tokenHash: 'hash-1', tokenMask: 'ab12cd34', createdByUserId: userId });
    const found = findBoardShareTokenByHash(db, 'hash-1');
    expect(found).toMatchObject({ boardId, workspaceId, tokenHash: 'hash-1' });
    expect(findBoardShareTokenByHash(db, 'nonexistent')).toBeUndefined();
  });

  it('deletes a token only when board and workspace match, returns false otherwise', () => {
    const token = createBoardShareToken(db, { boardId, workspaceId, tokenHash: 'hash-1', tokenMask: 'ab12cd34', createdByUserId: userId });
    const otherWorkspaceId = createWorkspace(db, 'Other').id;
    expect(deleteBoardShareToken(db, otherWorkspaceId, boardId, token.id)).toBe(false);
    expect(deleteBoardShareToken(db, workspaceId, boardId, token.id)).toBe(true);
    expect(findBoardShareTokenByHash(db, 'hash-1')).toBeUndefined();
    expect(deleteBoardShareToken(db, workspaceId, boardId, token.id)).toBe(false);
  });

  it('updates lastUsedAt when touched', () => {
    const token = createBoardShareToken(db, { boardId, workspaceId, tokenHash: 'hash-1', tokenMask: 'ab12cd34', createdByUserId: userId });
    expect(token.lastUsedAt).toBeUndefined();
    touchBoardShareTokenLastUsed(db, token.id);
    const found = findBoardShareTokenByHash(db, 'hash-1');
    expect(found!.lastUsedAt).toBeTruthy();
  });
});
