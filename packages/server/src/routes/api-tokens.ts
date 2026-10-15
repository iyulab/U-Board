import { Router } from 'express';
import type { AppConfig } from '../app.js';
import { requireAuth, type AuthedRequest } from '../middleware/require-auth.js';
import { pathParam } from '../middleware/path-param.js';
import { requireWorkspaceMember } from '../middleware/require-workspace-role.js';
import { findWorkspaceUser, findWorkspaceById } from '../db/workspaces.js';
import { createApiToken, deleteApiToken, listApiTokens, type ApiTokenScope } from '../db/api-tokens.js';
import { generateApiToken } from '../auth/api-token.js';

const MAX_NAME_LENGTH = 100;

/**
 * A workspace's API tokens, managed by people in the console — never with a token. Anyone in the workspace makes
 * tokens that act as themselves; an owner sees and deletes every token of the workspace, a member their own.
 */
export function createApiTokensRouter(config: AppConfig): Router {
  const { db, sessionSecret } = config;
  const router = Router({ mergeParams: true });
  router.use(requireAuth(db, sessionSecret));
  router.use(requireWorkspaceMember(db));

  /** The person whose tokens alone this request may see: `undefined` for an owner (every token). */
  async function limitedTo(req: AuthedRequest): Promise<string | undefined> {
    const membership = await findWorkspaceUser(db, pathParam(req, 'workspaceId'), req.userId!);
    return membership?.role === 'owner' ? undefined : req.userId;
  }

  router.get('/', async (req: AuthedRequest, res) => {
    res.status(200).json({ tokens: await listApiTokens(db, pathParam(req, 'workspaceId'), await limitedTo(req)) });
  });

  router.post('/', async (req: AuthedRequest, res) => {
    const { name, scope, expiresAt } = req.body ?? {};
    const expiry = expiresAt === undefined || expiresAt === null ? undefined : typeof expiresAt === 'string' ? Date.parse(expiresAt) : NaN;
    if (
      typeof name !== 'string' || name.trim() === '' || name.length > MAX_NAME_LENGTH ||
      (scope !== 'read' && scope !== 'write') ||
      (expiry !== undefined && (Number.isNaN(expiry) || expiry <= Date.now()))
    ) {
      res.status(400).json({ code: 'INVALID_INPUT' });
      return;
    }
    const { plain, hash, mask } = generateApiToken();
    const created = await createApiToken(db, {
      workspaceId: pathParam(req, 'workspaceId'),
      userId: req.userId!,
      name: name.trim(),
      scope: scope as ApiTokenScope,
      tokenHash: hash,
      tokenMask: mask,
      ...(expiry !== undefined && { expiresAt: new Date(expiry).toISOString() }),
    });
    // The token's text, this once: only its hash is kept.
    res.status(201).json({ ...created, token: plain });
  });

  router.delete('/:tokenId', async (req: AuthedRequest<{ tokenId: string }>, res) => {
    const workspaceId = pathParam(req, 'workspaceId');
    const deleted = await deleteApiToken(db, workspaceId, req.params.tokenId, req.userId!, await limitedTo(req));
    if (!deleted) {
      res.status(404).json({ code: 'NOT_FOUND' });
      return;
    }
    res.status(204).send();
  });

  return router;
}

/**
 * `GET /api/token` — what a program's API token is: the workspace it reaches, its scope, its name, and the person and
 * role it acts as. The first thing a program asks, so it can address the workspace without being told.
 */
export function createTokenInfoRouter(config: AppConfig): Router {
  const { db, sessionSecret } = config;
  const router = Router();
  router.use(requireAuth(db, sessionSecret, { acceptApiTokens: true }));

  router.get('/', async (req: AuthedRequest, res) => {
    if (!req.apiToken) {
      res.status(400).json({ code: 'NOT_AN_API_TOKEN' });
      return;
    }
    const [workspace, membership] = await Promise.all([
      findWorkspaceById(db, req.apiToken.workspaceId),
      findWorkspaceUser(db, req.apiToken.workspaceId, req.userId!),
    ]);
    if (!workspace || !membership) {
      res.status(403).json({ code: 'FORBIDDEN' });
      return;
    }
    res.status(200).json({
      workspace: { id: workspace.id, name: workspace.name },
      scope: req.apiToken.scope,
      role: membership.role,
    });
  });

  return router;
}
