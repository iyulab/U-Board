import { Router, type Request, type Response } from 'express';
import { type Adapter } from '@iyulab/u-board/domain';
import { bindingsIn, boardStateOf, resolveDocument, type ViewDocument } from '@iyulab/u-board/picture';
import type { AppConfig } from '../app.js';
import { findBoard } from '../db/boards.js';
import { findConnector } from '../db/connectors.js';
import { findBoardShareTokenByHash, touchBoardShareTokenLastUsed } from '../db/board-share-tokens.js';
import { hashShareToken } from './board-share-tokens.js';
import { API_TOKEN_PREFIX, hashApiToken } from '../auth/api-token.js';
import { findApiTokenByHash, touchApiTokenLastUsed } from '../db/api-tokens.js';
import { findWorkspaceUser } from '../db/workspaces.js';
import type { ResolveState } from '../resolve-connector.js';
import { DISCONNECTED, upstreamReader as readerFor, type UpstreamReader } from '../upstream-reader.js';
import type { ResolvedBinding } from '@iyulab/u-board/domain';
import type { Connector } from '../db/connectors.js';
import { elementFramesAddress } from '../element-frame.js';
import { pictureOf } from '@iyulab/u-board/domain';

/** Upper bound on one batch resolve request. A board's own bindings are the only entries that
 * resolve, so this only bounds the work a malformed or hostile request can make the server do. */
const MAX_BATCH_BINDINGS = 500;

/** Every `(connectorId, ref)` pair a document declares via its bindings — widgets' and connectors' (`bindingsIn`) —
 * the single traversal `referencedConnectors` and `isDeclaredBinding` below both build on. */
function* declaredBindings(doc: ViewDocument): Generator<{ connectorId: string; ref: unknown }> {
  for (const { binding } of bindingsIn(doc)) yield { connectorId: binding.adapter, ref: binding.ref };
}

/** Every adapter id a document's widgets reference, intersected with the connectors that actually
 * exist in this workspace — an id with no stored connector (a binding to a data source since removed) is
 * dropped without any special-casing. Used to tell the viewer which `ShareConnectorAdapter`s to
 * construct, and how each source asks to be credited. Access to the resolve endpoint is gated
 * separately and more narrowly by `isDeclaredBinding` below. Because `findConnector` is async,
 * candidate ids are checked via `Promise.all` rather than a plain synchronous `.filter(...)`. */
async function referencedConnectors(db: AppConfig['db'], workspaceId: string, doc: ViewDocument): Promise<Connector[]> {
  const ids = new Set<string>();
  for (const { connectorId } of declaredBindings(doc)) ids.add(connectorId);
  const found = await Promise.all([...ids].map(id => findConnector(db, workspaceId, id)));
  return found.filter((connector): connector is Connector => connector !== undefined);
}

/** What the viewer needs about a board's data sources: their ids, the credit of each that has one, and those whose
 *  answers are example data (a static source's `sample`) — never their address or settings. */
async function connectorsForViewer(db: AppConfig['db'], workspaceId: string, doc: ViewDocument) {
  const connectors = await referencedConnectors(db, workspaceId, doc);
  return {
    connectorIds: connectors.map(c => c.id),
    attributions: Object.fromEntries(connectors.flatMap(c => (c.attribution ? [[c.id, c.attribution]] : []))),
    samples: connectors.flatMap(c => (c.type === 'static' && c.sample ? [c.id] : [])),
  };
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

/** Whoever a share route answers: the workspace it reads in, and how to record that it was used. */
interface Reader {
  workspaceId: string;
  used: () => Promise<void>;
}

export function createShareRouter(config: AppConfig, resolveState: ResolveState): Router {
  const { db } = config;
  const router = Router();

  /** Who may read this board here, from `Authorization: Bearer <token>` — a header, so it stays out of URLs and the
   * logs that record them: the board's share link, or a workspace API token of the board's workspace (a program
   * looking at the board as its viewers see it — an assistant's tool server — which may already read the board and
   * its sources). Answers the request itself when there is no usable token: 404 for a missing, unknown or revoked
   * one (no hint which), 410 for an expired share link. */
  async function authenticate(req: Request, res: Response): Promise<Reader | undefined> {
    const boardId = req.params.boardId;
    const match = /^Bearer (\S+)$/.exec(req.get('Authorization') ?? '');
    if (match?.[1].startsWith(API_TOKEN_PREFIX)) return apiTokenReader(match[1], res);
    const token = match ? await findBoardShareTokenByHash(db, hashShareToken(match[1])) : undefined;
    if (!token || token.boardId !== boardId) {
      res.status(404).json({ code: 'NOT_FOUND' });
      return undefined;
    }
    if (token.expiresAt && Date.parse(token.expiresAt) <= Date.now()) {
      res.status(410).json({ code: 'SHARE_LINK_EXPIRED' });
      return undefined;
    }
    return { workspaceId: token.workspaceId, used: () => touchBoardShareTokenLastUsed(db, token.id) };
  }

  /** An API token reads as its maker, in its workspace only, while they are still a member of it. */
  async function apiTokenReader(plain: string, res: Response): Promise<Reader | undefined> {
    const token = await findApiTokenByHash(db, hashApiToken(plain));
    const live = token && !(token.expiresAt && Date.parse(token.expiresAt) <= Date.now());
    if (!token || !live || !(await findWorkspaceUser(db, token.workspaceId, token.userId))) {
      res.status(404).json({ code: 'NOT_FOUND' });
      return undefined;
    }
    return { workspaceId: token.workspaceId, used: () => touchApiTokenLastUsed(db, token.id) };
  }

  router.get('/boards/:boardId', async (req, res) => {
    const boardId = req.params.boardId;
    const token = await authenticate(req, res);
    if (!token) return;
    const board = await findBoard(db, token.workspaceId, boardId);
    if (!board) {
      res.status(404).json({ code: 'NOT_FOUND' });
      return;
    }
    await token.used();
    // An open viewer whose board has no bindings has no value batch to learn the revision from, so it
    // asks here with the revision it shows (If-None-Match): unchanged, the answer is a bodiless 304.
    res.set('ETag', `"${board.revision}"`);
    // Express compares If-None-Match with the ETag as HTTP has it (weak comparison, lists, `*`).
    if (req.fresh) {
      res.status(304).end();
      return;
    }
    // The board travels as it is stored, with the picture the viewer draws it from.
    const picture = await pictureOf(board.document, upstreamReader(token.workspaceId));
    res.status(200).json({
      name: board.name,
      document: board.document,
      picture,
      revision: board.revision,
      elementOrigins: config.elementOrigins ?? [],
      ...(config.elementFrameOrigin && { elementFrames: elementFramesAddress(config.elementFrameOrigin, boardId) }),
      ...(await connectorsForViewer(db, token.workspaceId, picture)),
    });
  });

  const upstreamReader = (workspaceId: string) => readerFor(config, resolveState, workspaceId);

  /** Reads one of a board’s bindings for a request — only one the picture it is drawn from declares
   *  (`isDeclaredBinding`); anything else answers `disconnected` without calling an upstream. */
  const bindingReader = (read: UpstreamReader, document: ViewDocument) =>
    async (connectorId: string, ref: unknown): Promise<ResolvedBinding> =>
      isDeclaredBinding(document, connectorId, ref) ? read(connectorId, ref) : DISCONNECTED;

  /** Resolves many of a board's bindings in one request, answering in request order — the only
   * resolve route a share link has. The viewer sends every binding it renders here at once, so
   * opening a board costs the same number of requests however many bindings it has, against an edge
   * rate limit that counts every request. Each entry must be a valid ref that this board's document
   * declares for an existing connector (`isDeclaredBinding`); an entry that is not answers
   * `disconnected` — what the viewer shows for any binding it cannot resolve — rather than failing
   * the entries around it, and its upstream is never called. */
  router.post('/boards/:boardId/resolve', async (req, res) => {
    const boardId = req.params.boardId;
    const token = await authenticate(req, res);
    if (!token) return;
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
    await token.used();

    const upstream = upstreamReader(token.workspaceId);
    const read = bindingReader(upstream, await pictureOf(board.document, upstream));
    const results = await Promise.all(
      (bindings as { connectorId: string; ref?: unknown }[]).map(({ connectorId, ref }) => read(connectorId, ref))
    );
    // The board's revision rides along, so an open viewer learns its document was saved again since it
    // was read — and reads it again — without a request of its own.
    res.status(200).json({ results, revision: board.revision });
  });

  /** The board’s state now (`BoardState`): every binding the board declares read once, through the same gate and the
   *  same reuse of upstream reads as the batch resolve, and what the board makes of the readings — each part’s state,
   *  connection quality and its cause, how old its data is — with the revision it was computed from. No value leaves
   *  in it. Computed on request and kept nowhere: a program watching a board asks again, and reads `evaluatedAt`. */
  router.get('/boards/:boardId/state', async (req, res) => {
    const boardId = req.params.boardId;
    const token = await authenticate(req, res);
    if (!token) return;
    const board = await findBoard(db, token.workspaceId, boardId);
    if (!board) {
      res.status(404).json({ code: 'NOT_FOUND' });
      return;
    }
    await token.used();

    const upstream = upstreamReader(token.workspaceId);
    const picture = await pictureOf(board.document, upstream);
    const read = bindingReader(upstream, picture);
    const ids = new Set<string>();
    for (const { connectorId } of declaredBindings(picture)) ids.add(connectorId);
    const adapters: Adapter[] = [...ids].map(connectorId => ({ id: connectorId, resolve: ref => read(connectorId, ref) }));
    const resolved = await resolveDocument(picture, adapters);
    res.status(200).json(boardStateOf(resolved, { now: Date.now(), revision: board.revision }));
  });

  return router;
}
