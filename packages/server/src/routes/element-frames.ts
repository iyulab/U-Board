import { Router } from 'express';
import { elementDefinitionHash, elementFrameLabel } from '@iyulab/u-board/domain';
import type { AppConfig } from '../app.js';
import { findBoardById } from '../db/boards.js';
import { frameHostLabel, sendElementFrame } from '../element-frame.js';
import { isBoardV2 } from '@iyulab/u-board/board-v2';

/**
 * The frames script elements run in: `GET /api/element-frames/:boardId/:name/:hash`. The address names the definition
 * by its hash (`elementDefinitionHash`), so it is answered only while the board, as saved, defines that element exactly
 * so — and naming it takes having the definition already. That is what lets the console and a share link, which reach
 * a board by different credentials, load the same frame with none: the answer is the definition the asking page
 * already holds, built into a sandboxed document. Any other address answers 404, an unsaved edit included.
 *
 * With a frame origin (`UBOARD_ELEMENT_FRAME_ORIGIN`), each definition is served from its own host under it, and a
 * host naming another definition answers 404 — one origin, one definition.
 */
export function createElementFramesRouter(config: AppConfig): Router {
  const { db } = config;
  const router = Router();
  // The frame is shown by the console, by the share viewer, and by any page that embeds the share viewer — from the
  // server's own origin, which is not the frame's when frames have origins of their own.
  const pages = config.webApps?.shareFrameAncestors ?? 'https:';
  const frameAncestors = config.elementFrameOrigin && config.publicUrl ? `${config.publicUrl} ${pages}` : `'self' ${pages}`;

  router.get('/:boardId/:name/:hash', async (req, res) => {
    const { boardId, name, hash } = req.params;
    const board = await findBoardById(db, boardId);
    // A board in the second version has no script elements — the elements it defines draw in an isolated root, not a
    // frame — so it has no frame to answer with.
    const document = board && !isBoardV2(board.document) ? board.document : undefined;
    const definition = document && Object.hasOwn(document.elements ?? {}, name) ? document.elements![name] : undefined;
    const label = config.elementFrameOrigin ? frameHostLabel(config.elementFrameOrigin, req.headers.host) : undefined;
    if (!document || !definition || (await elementDefinitionHash(definition)) !== hash || (label !== undefined && label !== elementFrameLabel(hash))) {
      res.status(404).json({ code: 'NOT_FOUND' });
      return;
    }
    sendElementFrame(res, document, name, config.elementOrigins ?? [], frameAncestors);
  });

  return router;
}
