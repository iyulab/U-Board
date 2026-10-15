import { Router } from 'express';
import { elementDefinitionHash } from '@iyulab/u-board/domain';
import type { AppConfig } from '../app.js';
import { findBoardById } from '../db/boards.js';
import { sendElementFrame } from '../element-frame.js';

/**
 * The frames script elements run in: `GET /api/element-frames/:boardId/:name/:hash`. The address names the definition
 * by its hash (`elementDefinitionHash`), so it is answered only while the board, as saved, defines that element exactly
 * so — and naming it takes having the definition already. That is what lets the console and a share link, which reach
 * a board by different credentials, load the same frame with none: the answer is the definition the asking page
 * already holds, built into a sandboxed document. Any other address answers 404, an unsaved edit included.
 */
export function createElementFramesRouter(config: AppConfig): Router {
  const { db } = config;
  const router = Router();
  // The frame is shown by the console, by the share viewer, and by any page that embeds the share viewer.
  const frameAncestors = `'self' ${config.webApps?.shareFrameAncestors ?? 'https:'}`;

  router.get('/:boardId/:name/:hash', async (req, res) => {
    const { boardId, name, hash } = req.params;
    const board = await findBoardById(db, boardId);
    const definition = board && Object.hasOwn(board.document.elements ?? {}, name) ? board.document.elements![name] : undefined;
    if (!board || !definition || (await elementDefinitionHash(definition)) !== hash) {
      res.status(404).json({ code: 'NOT_FOUND' });
      return;
    }
    sendElementFrame(res, board.document, name, config.elementOrigins ?? [], frameAncestors);
  });

  return router;
}
