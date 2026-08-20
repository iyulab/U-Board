import { Router, type Request } from 'express';
import { isViewDocumentShape } from '@iyulab/u-board';
import type { AppConfig } from '../app.js';
import { requireAuth, type AuthedRequest } from '../middleware/require-auth.js';
import { requireWorkspaceMember } from '../middleware/require-workspace-role.js';
import { createBoard, listBoardsForWorkspace, findBoard, updateBoard, deleteBoard } from '../db/boards.js';

export function createBoardsRouter(config: AppConfig): Router {
  const { db, sessionSecret } = config;
  const router = Router({ mergeParams: true }); // :workspaceId comes from the parent router's mount path
  router.use(requireAuth(db, sessionSecret));
  router.use(requireWorkspaceMember(db));

  router.get('/', (req: AuthedRequest, res) => {
    const workspaceId = (req.params as { workspaceId: string }).workspaceId;
    res.status(200).json({ boards: listBoardsForWorkspace(db, workspaceId) });
  });

  router.post('/', (req: AuthedRequest, res) => {
    const workspaceId = (req.params as { workspaceId: string }).workspaceId;
    const { name } = req.body ?? {};
    if (typeof name !== 'string' || name.trim() === '') {
      res.status(400).json({ code: 'INVALID_INPUT' });
      return;
    }
    const board = createBoard(db, { workspaceId, name });
    res.status(201).json({ id: board.id, name: board.name, updatedAt: board.updatedAt });
  });

  router.get('/:boardId', (req: AuthedRequest, res) => {
    const { workspaceId, boardId } = req.params as { workspaceId: string; boardId: string };
    const board = findBoard(db, workspaceId, boardId);
    if (!board) {
      res.status(404).json({ code: 'NOT_FOUND' });
      return;
    }
    res.status(200).json({ id: board.id, name: board.name, document: board.document, updatedAt: board.updatedAt });
  });

  router.put('/:boardId', (req: AuthedRequest, res) => {
    const { workspaceId, boardId } = req.params as { workspaceId: string; boardId: string };
    const { name, document } = req.body ?? {};
    if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
      res.status(400).json({ code: 'INVALID_INPUT' });
      return;
    }
    if (document !== undefined && !isViewDocumentShape(document)) {
      res.status(400).json({ code: 'INVALID_DOCUMENT' });
      return;
    }
    const updated = updateBoard(db, workspaceId, boardId, { name, document });
    if (!updated) {
      res.status(404).json({ code: 'NOT_FOUND' });
      return;
    }
    res.status(200).json({ id: updated.id, name: updated.name, updatedAt: updated.updatedAt });
  });

  router.delete('/:boardId', (req: AuthedRequest, res) => {
    const { workspaceId, boardId } = req.params as { workspaceId: string; boardId: string };
    const deleted = deleteBoard(db, workspaceId, boardId);
    if (!deleted) {
      res.status(404).json({ code: 'NOT_FOUND' });
      return;
    }
    res.status(204).send();
  });

  return router;
}
