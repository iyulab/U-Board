import { Router } from 'express';
import { randomBytes, createHash } from 'node:crypto';
import type { AppConfig } from '../app.js';
import { requireAuth, type AuthedRequest } from '../middleware/require-auth.js';
import { requireWorkspaceOwner } from '../middleware/require-workspace-role.js';
import { findBoard } from '../db/boards.js';
import {
  createBoardShareToken,
  listBoardShareTokensForBoard,
  deleteBoardShareToken,
} from '../db/board-share-tokens.js';

export function hashShareToken(plain: string): string {
  return createHash('sha256').update(plain).digest('hex');
}

export function generateShareToken(): { plain: string; hash: string; mask: string } {
  const plain = randomBytes(32).toString('base64url');
  return { plain, hash: hashShareToken(plain), mask: plain.slice(-8) };
}

export function createBoardShareTokensRouter(config: AppConfig): Router {
  const { db, sessionSecret } = config;
  const router = Router({ mergeParams: true }); // :workspaceId, :boardId from the parent mount path
  router.use(requireAuth(db, sessionSecret));
  router.use(requireWorkspaceOwner(db));

  router.get('/', (req, res) => {
    const { workspaceId, boardId } = req.params as { workspaceId: string; boardId: string };
    if (!findBoard(db, workspaceId, boardId)) {
      res.status(404).json({ code: 'NOT_FOUND' });
      return;
    }
    res.status(200).json({ tokens: listBoardShareTokensForBoard(db, workspaceId, boardId) });
  });

  router.post('/', (req: AuthedRequest, res) => {
    const { workspaceId, boardId } = req.params as { workspaceId: string; boardId: string };
    if (!findBoard(db, workspaceId, boardId)) {
      res.status(404).json({ code: 'NOT_FOUND' });
      return;
    }
    const { plain, hash, mask } = generateShareToken();
    const created = createBoardShareToken(db, {
      boardId, workspaceId, tokenHash: hash, tokenMask: mask, createdByUserId: req.userId!,
    });
    res.status(201).json({ id: created.id, token: plain, tokenMask: created.tokenMask, createdAt: created.createdAt });
  });

  router.delete('/:tokenId', (req, res) => {
    const { workspaceId, boardId, tokenId } = req.params as { workspaceId: string; boardId: string; tokenId: string };
    const deleted = deleteBoardShareToken(db, workspaceId, boardId, tokenId);
    if (!deleted) {
      res.status(404).json({ code: 'NOT_FOUND' });
      return;
    }
    res.status(204).send();
  });

  return router;
}
