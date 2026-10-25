import { Router } from 'express';
import { applyJsonPatch, JsonPatchError } from '@iyulab/u-board/domain';
import type { Response } from 'express';
import type { AppConfig } from '../app.js';
import { requireAuth, type AuthedRequest } from '../middleware/require-auth.js';
import { pathParam } from '../middleware/path-param.js';
import { requireWorkspaceMember } from '../middleware/require-workspace-role.js';
import { createBoard, listBoardsForWorkspace, findBoard, updateBoard, deleteBoard } from '../db/boards.js';
import { elementFramesAddress } from '../element-frame.js';
import { listConnectorsForWorkspace } from '../db/connectors.js';
import { documentAdvice, documentIssues, documentKind } from '../board-document.js';
import { drawBoard, type Board } from '@iyulab/u-board/domain';
import type { ResolveState } from '../resolve-connector.js';
import { upstreamReader } from '../upstream-reader.js';

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

export function createBoardsRouter(config: AppConfig, resolveState: ResolveState): Router {
  const { db, sessionSecret } = config;
  const router = Router({ mergeParams: true }); // :workspaceId comes from the parent router's mount path
  // Boards are what a program writes for its person — an AI assistant drawing one — so an API token reaches them.
  router.use(requireAuth(db, sessionSecret, { acceptApiTokens: true }));
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
      .json({ id: board.id, name: board.name, kind: documentKind(board.document), updatedAt: board.updatedAt, revision: board.revision });
  });

  router.get('/:boardId', async (req: AuthedRequest<{ boardId: string }>, res) => {
    const workspaceId = pathParam(req, 'workspaceId');
    const { boardId } = req.params;
    const board = await findBoard(db, workspaceId, boardId);
    if (!board) {
      res.status(404).json({ code: 'NOT_FOUND' });
      return;
    }
    // With the picture its viewers draw it from — the one the share route answers, made here so every page shows a
    // board the same way — and, for the parts a canvas places by their items' fields, how many items were left out.
    const { picture, unplaced } = await drawBoard(board.document, upstreamReader(config, resolveState, workspaceId));
    res
      .status(200)
      .set('ETag', etagOf(board.revision))
      .json({
        id: board.id,
        name: board.name,
        document: board.document,
        picture,
        ...(Object.keys(unplaced).length > 0 && { unplaced }),
        updatedAt: board.updatedAt,
        revision: board.revision,
        elementOrigins: config.elementOrigins ?? [],
        ...(config.elementFrameOrigin && { elementFrames: elementFramesAddress(config.elementFrameOrigin, board.id) }),
      });
  });

  /** Saves a board's name and/or document — the one way PUT and PATCH store a change. A document is validated first,
   *  `expectedRevision` makes the save conditional, and the answer carries the new revision and advice on the document. */
  async function save(
    res: Response,
    workspaceId: string,
    boardId: string,
    change: { name?: string; document?: unknown },
    expectedRevision: number | undefined
  ): Promise<void> {
    if (change.document !== undefined) {
      // The API is a boundary like file import: a document stored here is later trusted by the
      // console, the share routes and the viewer, so every structural problem is refused now and
      // named (capped — a wholly wrong body would otherwise answer with one issue per field).
      const issues = documentIssues(change.document);
      if (issues.length > 0) {
        res.status(400).json({ code: 'INVALID_DOCUMENT', issues: issues.slice(0, MAX_REPORTED_ISSUES) });
        return;
      }
    }
    const document = change.document as Board | undefined;
    const result = await updateBoard(db, workspaceId, boardId, { name: change.name, document }, expectedRevision);
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
      .json({
        id: board.id,
        name: board.name,
        updatedAt: board.updatedAt,
        revision: board.revision,
        // What the saved document could do better — for a program writing it to act on.
        advice: documentAdvice(board.document, await listConnectorsForWorkspace(db, workspaceId)),
      });
  }

  router.put('/:boardId', async (req: AuthedRequest<{ boardId: string }>, res) => {
    const workspaceId = pathParam(req, 'workspaceId');
    const { boardId } = req.params;
    const { name, document } = req.body ?? {};
    // A save of nothing would still count as one, and make every open share link read the board again.
    if ((name !== undefined && (typeof name !== 'string' || name.trim() === '')) || (name === undefined && document === undefined)) {
      res.status(400).json({ code: 'INVALID_INPUT' });
      return;
    }
    // A save names the copy it was made against with If-Match (RFC 9110 §13.1.1), the ETag its read
    // returned. Without it the save is unconditional — the header is how a client opts in, as HTTP has it.
    const precondition = ifMatchRevision(req.get('If-Match'));
    // A tag no revision has still finds a missing board missing (404), as any other save does.
    await save(res, workspaceId, boardId, { name, document }, precondition === 'unmatchable' ? NO_REVISION : precondition);
  });

  /** Changes part of a board's document: the body is a JSON Patch (RFC 6902) — `[{ "op": "replace", "path":
   *  "/items/2/span", "value": 6 }]` — applied to the document as saved now, entirely or not at all. A patch is made
   *  against one revision, so the save is always conditional: on the one If-Match names, or else the one it was
   *  applied to — a save between the two answers 412 rather than landing on a document the patch was not made for. */
  router.patch('/:boardId', async (req: AuthedRequest<{ boardId: string }>, res) => {
    const workspaceId = pathParam(req, 'workspaceId');
    const { boardId } = req.params;
    const board = await findBoard(db, workspaceId, boardId);
    if (!board) {
      res.status(404).json({ code: 'NOT_FOUND' });
      return;
    }
    const precondition = ifMatchRevision(req.get('If-Match'));
    if (precondition !== undefined && precondition !== board.revision) {
      res.status(412).json({ code: 'BOARD_CHANGED', revision: board.revision });
      return;
    }
    let document: unknown;
    try {
      document = applyJsonPatch(board.document, req.body);
    } catch (error) {
      if (!(error instanceof JsonPatchError)) throw error;
      res.status(400).json({ code: 'INVALID_PATCH', operation: error.index, message: error.message });
      return;
    }
    await save(res, workspaceId, boardId, { document }, board.revision);
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
