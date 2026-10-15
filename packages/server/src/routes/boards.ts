import { Router } from 'express';
import { validateViewDocument } from '@iyulab/u-board/domain';
import type { AppConfig } from '../app.js';
import { requireAuth, type AuthedRequest } from '../middleware/require-auth.js';
import { pathParam } from '../middleware/path-param.js';
import { requireWorkspaceMember } from '../middleware/require-workspace-role.js';
import { createBoard, listBoardsForWorkspace, findBoard, updateBoard, deleteBoard } from '../db/boards.js';

/** How many document issues a 400 names at most. */
const MAX_REPORTED_ISSUES = 20;

/** A revision no board has (they count from 1): what a save names when its If-Match cannot match any. */
const NO_REVISION = 0;

/** A board revision as an entity tag. */
function etagOf(revision: number): string {
  return `"${revision}"`;
}

/** The revision an If-Match header names: `undefined` when there is none or it is `*` (any current
 *  board), a number for one strong tag of a revision, and `'unmatchable'` for anything else — a weak or
 *  foreign tag, or a list, which no revision of a board matches. */
function ifMatchRevision(header: string | undefined): number | undefined | 'unmatchable' {
  if (header === undefined || header.trim() === '*') return undefined;
  const match = /^\s*"(\d{1,9})"\s*$/.exec(header);
  return match ? Number(match[1]) : 'unmatchable';
}

export function createBoardsRouter(config: AppConfig): Router {
  const { db, sessionSecret } = config;
  const router = Router({ mergeParams: true }); // :workspaceId comes from the parent router's mount path
  router.use(requireAuth(db, sessionSecret));
  router.use(requireWorkspaceMember(db));

  router.get('/', async (req: AuthedRequest, res) => {
    const workspaceId = pathParam(req, 'workspaceId');
    res.status(200).json({ boards: await listBoardsForWorkspace(db, workspaceId) });
  });

  router.post('/', async (req: AuthedRequest, res) => {
    const workspaceId = pathParam(req, 'workspaceId');
    const { name, kind } = req.body ?? {};
    if (typeof name !== 'string' || name.trim() === '' || (kind !== undefined && kind !== 'canvas' && kind !== 'grid')) {
      res.status(400).json({ code: 'INVALID_INPUT' });
      return;
    }
    const board = await createBoard(db, { workspaceId, name, actorUserId: req.userId!, kind });
    res
      .status(201)
      .set('ETag', etagOf(board.revision))
      .json({ id: board.id, name: board.name, kind: board.document.kind, updatedAt: board.updatedAt, revision: board.revision });
  });

  router.get('/:boardId', async (req: AuthedRequest<{ boardId: string }>, res) => {
    const workspaceId = pathParam(req, 'workspaceId');
    const { boardId } = req.params;
    const board = await findBoard(db, workspaceId, boardId);
    if (!board) {
      res.status(404).json({ code: 'NOT_FOUND' });
      return;
    }
    res
      .status(200)
      .set('ETag', etagOf(board.revision))
      .json({
        id: board.id,
        name: board.name,
        document: board.document,
        updatedAt: board.updatedAt,
        revision: board.revision,
        elementOrigins: config.elementOrigins ?? [],
      });
  });

  router.put('/:boardId', async (req: AuthedRequest<{ boardId: string }>, res) => {
    const workspaceId = pathParam(req, 'workspaceId');
    const { boardId } = req.params;
    const { name, document } = req.body ?? {};
    // A save of nothing would still count as one, and make every open share link read the board again.
    if ((name !== undefined && (typeof name !== 'string' || name.trim() === '')) || (name === undefined && document === undefined)) {
      res.status(400).json({ code: 'INVALID_INPUT' });
      return;
    }
    if (document !== undefined) {
      // The API is a boundary like file import: a document stored here is later trusted by the
      // console, the share routes and the viewer, so every structural problem is refused now and
      // named (capped — a wholly wrong body would otherwise answer with one issue per field).
      const issues = validateViewDocument(document);
      if (issues.length > 0) {
        res.status(400).json({ code: 'INVALID_DOCUMENT', issues: issues.slice(0, MAX_REPORTED_ISSUES) });
        return;
      }
    }
    // A save names the copy it was made against with If-Match (RFC 9110 §13.1.1), the ETag its read
    // returned. Without it the save is unconditional — the header is how a client opts in, as HTTP has it.
    const precondition = ifMatchRevision(req.get('If-Match'));
    // A tag no revision has still finds a missing board missing (404), as any other save does.
    const result = await updateBoard(db, workspaceId, boardId, { name, document }, precondition === 'unmatchable' ? NO_REVISION : precondition);
    if ('notFound' in result) {
      res.status(404).json({ code: 'NOT_FOUND' });
      return;
    }
    if ('conflict' in result) {
      // Someone saved the board since this copy was read: refused, with the revision it is at now.
      res.status(412).json({ code: 'BOARD_CHANGED', revision: result.conflict.revision });
      return;
    }
    const { board } = result;
    res
      .status(200)
      .set('ETag', etagOf(board.revision))
      .json({ id: board.id, name: board.name, updatedAt: board.updatedAt, revision: board.revision });
  });

  router.delete('/:boardId', async (req: AuthedRequest<{ boardId: string }>, res) => {
    const workspaceId = pathParam(req, 'workspaceId');
    const { boardId } = req.params;
    const deleted = await deleteBoard(db, workspaceId, boardId, req.userId!);
    if (!deleted) {
      res.status(404).json({ code: 'NOT_FOUND' });
      return;
    }
    res.status(204).send();
  });

  return router;
}
