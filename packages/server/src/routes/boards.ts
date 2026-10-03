import { Router } from 'express';
import { validateViewDocument } from '@iyulab/u-board/domain';
import type { AppConfig } from '../app.js';
import { requireAuth, type AuthedRequest } from '../middleware/require-auth.js';
import { pathParam } from '../middleware/path-param.js';
import { requireWorkspaceMember } from '../middleware/require-workspace-role.js';
import { createBoard, listBoardsForWorkspace, findBoard, updateBoard, deleteBoard } from '../db/boards.js';

/** How many document issues a 400 names at most. */
const MAX_REPORTED_ISSUES = 20;

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
    const { name } = req.body ?? {};
    if (typeof name !== 'string' || name.trim() === '') {
      res.status(400).json({ code: 'INVALID_INPUT' });
      return;
    }
    const board = await createBoard(db, { workspaceId, name });
    res.status(201).json({ id: board.id, name: board.name, updatedAt: board.updatedAt });
  });

  router.get('/:boardId', async (req: AuthedRequest<{ boardId: string }>, res) => {
    const workspaceId = pathParam(req, 'workspaceId');
    const { boardId } = req.params;
    const board = await findBoard(db, workspaceId, boardId);
    if (!board) {
      res.status(404).json({ code: 'NOT_FOUND' });
      return;
    }
    res.status(200).json({ id: board.id, name: board.name, document: board.document, updatedAt: board.updatedAt });
  });

  router.put('/:boardId', async (req: AuthedRequest<{ boardId: string }>, res) => {
    const workspaceId = pathParam(req, 'workspaceId');
    const { boardId } = req.params;
    const { name, document } = req.body ?? {};
    if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
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
    const updated = await updateBoard(db, workspaceId, boardId, { name, document });
    if (!updated) {
      res.status(404).json({ code: 'NOT_FOUND' });
      return;
    }
    res.status(200).json({ id: updated.id, name: updated.name, updatedAt: updated.updatedAt });
  });

  router.delete('/:boardId', async (req: AuthedRequest<{ boardId: string }>, res) => {
    const workspaceId = pathParam(req, 'workspaceId');
    const { boardId } = req.params;
    const deleted = await deleteBoard(db, workspaceId, boardId);
    if (!deleted) {
      res.status(404).json({ code: 'NOT_FOUND' });
      return;
    }
    res.status(204).send();
  });

  return router;
}
