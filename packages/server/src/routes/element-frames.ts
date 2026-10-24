import { Router } from 'express';
import { elementDefinitionHash, elementFrameLabel } from '@iyulab/u-board/picture';
import type { AppConfig } from '../app.js';
import { findBoardById } from '../db/boards.js';
import { frameHostLabel, sendElementFrame } from '../element-frame.js';
import { elementDefinition } from '@iyulab/u-board/domain';

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
    // The frame serves the definition the board's picture draws (`elementDefinition`), which is the one the asking page
    // hashed.
    const elements = board?.document.elements;
    const defined = elements !== undefined && Object.hasOwn(elements, name) ? elements[name] : undefined;
    const definition = defined && elementDefinition(defined);
    const label = config.elementFrameOrigin ? frameHostLabel(config.elementFrameOrigin, req.headers.host) : undefined;
    if (!definition || (await elementDefinitionHash(definition)) !== hash || (label !== undefined && label !== elementFrameLabel(hash))) {
      res.status(404).json({ code: 'NOT_FOUND' });
      return;
    }
    sendElementFrame(res, definition, config.elementOrigins ?? [], frameAncestors);
  });

  return router;
}
