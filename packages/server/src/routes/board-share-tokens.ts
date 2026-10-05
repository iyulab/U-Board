import { Router } from 'express';
import { randomBytes, createHash } from 'node:crypto';
import type { AppConfig } from '../app.js';
import { requireAuth, type AuthedRequest } from '../middleware/require-auth.js';
import { pathParam } from '../middleware/path-param.js';
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
  const router = Router({ mergeParams: true });
  router.use(requireAuth(db, sessionSecret));
  router.use(requireWorkspaceOwner(db));

  router.get('/', async (req, res) => {
    const workspaceId = pathParam(req, 'workspaceId');
    const boardId = pathParam(req, 'boardId');
    if (!(await findBoard(db, workspaceId, boardId))) {
      res.status(404).json({ code: 'NOT_FOUND' });
      return;
    }
    res.status(200).json({ tokens: await listBoardShareTokensForBoard(db, workspaceId, boardId) });
  });

  router.post('/', async (req: AuthedRequest, res) => {
    const workspaceId = pathParam(req, 'workspaceId');
    const boardId = pathParam(req, 'boardId');
    if (!(await findBoard(db, workspaceId, boardId))) {
      res.status(404).json({ code: 'NOT_FOUND' });
      return;
    }
    // Optional: when the link stops working. A link without one works until it is revoked.
    const expiresAt: unknown = req.body?.expiresAt;
    if (expiresAt !== undefined && expiresAt !== null) {
      const time = typeof expiresAt === 'string' ? Date.parse(expiresAt) : NaN;
      if (Number.isNaN(time) || time <= Date.now()) {
        res.status(400).json({ code: 'INVALID_INPUT' });
        return;
      }
    }
    const { plain, hash, mask } = generateShareToken();
    const created = await createBoardShareToken(db, {
      boardId, workspaceId, tokenHash: hash, tokenMask: mask, createdByUserId: req.userId!,
      ...(typeof expiresAt === 'string' && { expiresAt: new Date(expiresAt).toISOString() }),
    });
    res.status(201).json({
      id: created.id,
      token: plain,
      tokenMask: created.tokenMask,
      createdAt: created.createdAt,
      ...(created.expiresAt && { expiresAt: created.expiresAt }),
    });
  });

  router.delete('/:tokenId', async (req: AuthedRequest<{ tokenId: string }>, res) => {
    const workspaceId = pathParam(req, 'workspaceId');
    const boardId = pathParam(req, 'boardId');
    const { tokenId } = req.params;
    const deleted = await deleteBoardShareToken(db, workspaceId, boardId, tokenId, req.userId!);
    if (!deleted) {
      res.status(404).json({ code: 'NOT_FOUND' });
      return;
    }
    res.status(204).send();
  });

  return router;
}
