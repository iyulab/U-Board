import { Router } from 'express';
import type { ViewDocument } from '@iyulab/u-board/domain';
import type { AppConfig } from '../app.js';
import { findBoard } from '../db/boards.js';
import { findConnector } from '../db/connectors.js';
import { findBoardShareTokenByHash, touchBoardShareTokenLastUsed, type BoardShareToken } from '../db/board-share-tokens.js';
import { hashShareToken } from './board-share-tokens.js';
import { isValidRef, buildResolveTarget, resolveConnectorValue, type ResolveState, type ResolveResult } from '../resolve-connector.js';
import type { Connector } from '../db/connectors.js';

/** Upper bound on one batch resolve request. A board's own bindings are the only entries that
 * resolve, so this only bounds the work a malformed or hostile request can make the server do. */
const MAX_BATCH_BINDINGS = 500;

const DISCONNECTED: ResolveResult = { value: undefined, quality: 'disconnected' };

/** Every `(connectorId, ref)` pair a document's widgets declare via their bindings — the single
 * traversal `referencedConnectorIds` and `isDeclaredBinding` below both build on, so the
 * `doc.nodes` → `node.widget?.bindings` → `Object.values(...)` walk exists in exactly one place. */
function* declaredBindings(doc: ViewDocument): Generator<{ connectorId: string; ref: unknown }> {
  for (const node of doc.nodes) {
    for (const binding of Object.values(node.widget?.bindings ?? {})) {
      yield { connectorId: binding.adapter, ref: binding.ref };
    }
  }
}

/** Every adapter id a document's widgets reference, intersected with the connectors that actually
 * exist in this workspace — an id like `demo-cmms` (the client-side mock, never a DB row) is
 * dropped without any special-casing. Used to report the `connectorIds` list to the viewer, so it
 * knows which `ShareConnectorAdapter`s to construct. Access to the resolve endpoint is gated
 * separately and more narrowly by `isDeclaredBinding` below. Because `findConnector` is async,
 * candidate ids are checked via `Promise.all` rather than a plain synchronous `.filter(...)`. */
async function referencedConnectorIds(db: AppConfig['db'], workspaceId: string, doc: ViewDocument): Promise<string[]> {
  const ids = new Set<string>();
  for (const { connectorId } of declaredBindings(doc)) ids.add(connectorId);
  const checked = await Promise.all(
    [...ids].map(async id => ((await findConnector(db, workspaceId, id)) ? id : null))
  );
  return checked.filter((id): id is string => id !== null);
}

/** True when `(connectorId, ref)` matches some binding this board's document actually declares —
 * not just "this connector is used somewhere in the document" (that alone would let a caller vary
 * `ref` freely against any referenced connector: (a) it would grant access to the connector's
 * entire origin rather than just the specific values the board owner chose to expose, and (b) it
 * would let `ref.valuePath` — which never appears in the request URL, only the body, and plays no
 * part in the origin-pinning check — be varied without bound to grow the resolve cache
 * unboundedly, since the cache key includes it). Both sides of the comparison come from parsing
 * the same stored document (the client's `resolveWidget` call flow forwards `binding.ref`
 * unmodified), so canonical-JSON-string comparison is reliable — it is not a functional
 * restriction for any ref the legitimate embed viewer would ever send. */
function isDeclaredBinding(doc: ViewDocument, connectorId: string, ref: unknown): boolean {
  for (const binding of declaredBindings(doc)) {
    if (binding.connectorId === connectorId && JSON.stringify(binding.ref) === JSON.stringify(ref)) {
      return true;
    }
  }
  return false;
}

export function createShareRouter(config: AppConfig, resolveState: ResolveState): Router {
  const { db } = config;
  const router = Router();

  async function authenticate(boardId: string, tokenPlain: unknown): Promise<BoardShareToken | undefined> {
    if (typeof tokenPlain !== 'string' || tokenPlain === '') return undefined;
    const token = await findBoardShareTokenByHash(db, hashShareToken(tokenPlain));
    if (!token || token.boardId !== boardId) return undefined;
    return token;
  }

  router.get('/boards/:boardId', async (req, res) => {
    const boardId = req.params.boardId;
    const token = await authenticate(boardId, req.query.token);
    if (!token) {
      res.status(404).json({ code: 'NOT_FOUND' });
      return;
    }
    const board = await findBoard(db, token.workspaceId, boardId);
    if (!board) {
      res.status(404).json({ code: 'NOT_FOUND' });
      return;
    }
    await touchBoardShareTokenLastUsed(db, token.id);
    res.status(200).json({
      name: board.name,
      document: board.document,
      connectorIds: await referencedConnectorIds(db, token.workspaceId, board.document),
    });
  });

  /** Resolves many of a board's bindings in one request, answering in request order — the only
   * resolve route a share link has. The viewer sends every binding it renders here at once, so
   * opening a board costs the same number of requests however many bindings it has, against an edge
   * rate limit that counts every request. Each entry must be a valid ref that this board's document
   * declares for an existing connector (`isDeclaredBinding`); an entry that is not answers
   * `disconnected` — what the viewer shows for any binding it cannot resolve — rather than failing
   * the entries around it, and its upstream is never called. */
  router.post('/boards/:boardId/resolve', async (req, res) => {
    const boardId = req.params.boardId;
    const token = await authenticate(boardId, req.query.token);
    if (!token) {
      res.status(404).json({ code: 'NOT_FOUND' });
      return;
    }
    const bindings: unknown = req.body?.bindings;
    if (
      !Array.isArray(bindings) || bindings.length > MAX_BATCH_BINDINGS ||
      !bindings.every(b => b && typeof b === 'object' && typeof (b as { connectorId?: unknown }).connectorId === 'string')
    ) {
      res.status(400).json({ code: 'INVALID_INPUT' });
      return;
    }
    const board = await findBoard(db, token.workspaceId, boardId);
    if (!board) {
      res.status(404).json({ code: 'NOT_FOUND' });
      return;
    }
    await touchBoardShareTokenLastUsed(db, token.id);

    const connectors = new Map<string, Promise<Connector | undefined>>();
    const connectorOf = (id: string) => {
      if (!connectors.has(id)) connectors.set(id, findConnector(db, token.workspaceId, id));
      return connectors.get(id)!;
    };
    const results = await Promise.all(
      (bindings as { connectorId: string; ref?: unknown }[]).map(async ({ connectorId, ref }) => {
        if (!isValidRef(ref) || !isDeclaredBinding(board.document, connectorId, ref)) return DISCONNECTED;
        const connector = await connectorOf(connectorId);
        const target = connector && buildResolveTarget(connector, ref);
        if (!connector || !target) return DISCONNECTED;
        return resolveConnectorValue(connector, target, ref, resolveState);
      })
    );
    res.status(200).json({ results });
  });

  return router;
}
