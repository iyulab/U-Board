import { Router } from 'express';
import type { ViewDocument } from '@iyulab/u-board';
import type { AppConfig } from '../app.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { findBoard } from '../db/boards.js';
import { findConnector } from '../db/connectors.js';
import { findBoardShareTokenByHash, touchBoardShareTokenLastUsed, type BoardShareToken } from '../db/board-share-tokens.js';
import { hashShareToken } from './board-share-tokens.js';
import { isValidRef, buildResolveTarget, resolveConnectorValue } from '../resolve-connector.js';

/** Every adapter id a document's widgets reference, intersected with the connectors that actually
 * exist in this workspace — an id like `demo-cmms` (the client-side mock, never a DB row) is
 * dropped without any special-casing. Used both to report `connectorIds` to the viewer and to gate
 * the resolve endpoint, so a board-scoped share token can never reach a connector its own document
 * doesn't use. */
function referencedConnectorIds(db: AppConfig['db'], workspaceId: string, doc: ViewDocument): string[] {
  const ids = new Set<string>();
  for (const node of doc.nodes) {
    for (const binding of Object.values(node.widget.bindings ?? {})) {
      ids.add(binding.adapter);
    }
  }
  return [...ids].filter(id => !!findConnector(db, workspaceId, id));
}

export function createShareRouter(config: AppConfig, resolveCache: Map<string, unknown>): Router {
  const { db } = config;
  const router = Router();

  function authenticate(boardId: string, tokenPlain: unknown): BoardShareToken | undefined {
    if (typeof tokenPlain !== 'string' || tokenPlain === '') return undefined;
    const token = findBoardShareTokenByHash(db, hashShareToken(tokenPlain));
    if (!token || token.boardId !== boardId) return undefined;
    return token;
  }

  router.get('/boards/:boardId', (req, res) => {
    const boardId = req.params.boardId;
    const token = authenticate(boardId, req.query.token);
    if (!token) {
      res.status(404).json({ code: 'NOT_FOUND' });
      return;
    }
    const board = findBoard(db, token.workspaceId, boardId);
    if (!board) {
      res.status(404).json({ code: 'NOT_FOUND' });
      return;
    }
    touchBoardShareTokenLastUsed(db, token.id);
    res.status(200).json({
      name: board.name,
      document: board.document,
      connectorIds: referencedConnectorIds(db, token.workspaceId, board.document),
    });
  });

  router.post('/boards/:boardId/connectors/:connectorId/resolve', asyncHandler(async (req, res) => {
    const boardId = req.params.boardId;
    const token = authenticate(boardId, req.query.token);
    if (!token) {
      res.status(404).json({ code: 'NOT_FOUND' });
      return;
    }
    const board = findBoard(db, token.workspaceId, boardId);
    if (!board) {
      res.status(404).json({ code: 'NOT_FOUND' });
      return;
    }
    const allowedIds = referencedConnectorIds(db, token.workspaceId, board.document);
    if (!allowedIds.includes(req.params.connectorId)) {
      res.status(404).json({ code: 'NOT_FOUND' });
      return;
    }
    const connector = findConnector(db, token.workspaceId, req.params.connectorId);
    if (!connector) {
      res.status(404).json({ code: 'NOT_FOUND' });
      return;
    }
    const ref = req.body?.ref;
    if (!isValidRef(ref)) {
      res.status(400).json({ code: 'INVALID_INPUT' });
      return;
    }
    const target = buildResolveTarget(connector, ref);
    if (!target) {
      res.status(400).json({ code: 'INVALID_INPUT' });
      return;
    }
    touchBoardShareTokenLastUsed(db, token.id);
    const result = await resolveConnectorValue(connector, target, ref, resolveCache);
    res.status(200).json(result);
  }));

  return router;
}
