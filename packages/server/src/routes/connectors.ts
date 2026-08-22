import { Router } from 'express';
import type { AppConfig } from '../app.js';
import { requireAuth } from '../middleware/require-auth.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { requireWorkspaceMember, requireWorkspaceOwner } from '../middleware/require-workspace-role.js';
import {
  createConnector,
  listConnectorsForWorkspace,
  findConnector,
  updateConnector,
  deleteConnector,
  type Connector,
} from '../db/connectors.js';
import { isValidRef, buildResolveTarget, resolveConnectorValue } from '../resolve-connector.js';

const AUTH_TYPES = new Set(['none', 'bearer', 'header']);

/**
 * A connector's baseUrl must be an absolute http(s) URL. The scheme allowlist is load-bearing,
 * not cosmetic: the resolve proxy pins the request target to the baseUrl's origin, and a
 * non-special scheme has the opaque origin `"null"`, which would make that comparison vacuous.
 */
function parseBaseUrl(value: unknown): URL | null {
  if (typeof value !== 'string' || value.trim() === '') return null;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
}

/**
 * A secret-bearing auth field is satisfied when the request supplies a non-blank string, or —
 * when the request omits it entirely — when the connector already has one stored. Omitting the
 * field means "keep the stored secret" (the console's edit form leaves it blank on purpose so a
 * rename does not require re-typing the secret); an explicitly supplied blank/non-string value is
 * still rejected, and so is omission when nothing is stored, because storing nothing would make
 * the resolve proxy send a literal `Bearer undefined`.
 */
function authFieldSatisfied(provided: unknown, stored: string | undefined): boolean {
  if (provided === undefined) return typeof stored === 'string' && stored.trim() !== '';
  return typeof provided === 'string' && provided.trim() !== '';
}

function validateAuthFields(body: any, existing?: Connector): string | null {
  if (!AUTH_TYPES.has(body.authType)) return 'INVALID_INPUT';
  if (body.authType === 'header') {
    // Only fall back to a stored header name if the connector is *currently* header-auth —
    // otherwise the stored value is not a live header name we may keep.
    const storedHeaderName = existing?.authType === 'header' ? existing.authHeaderName : undefined;
    if (!authFieldSatisfied(body.authHeaderName, storedHeaderName)) return 'INVALID_INPUT';
  }
  if (body.authType !== 'none') {
    const storedValue = existing?.authType === 'none' ? undefined : existing?.authValue;
    if (!authFieldSatisfied(body.authValue, storedValue)) return 'INVALID_INPUT';
  }
  return null;
}

export function createConnectorsRouter(config: AppConfig, resolveCache: Map<string, unknown>): Router {
  const { db, sessionSecret } = config;
  const router = Router({ mergeParams: true }); // :workspaceId comes from the parent mount path
  router.use(requireAuth(db, sessionSecret));

  router.get('/', requireWorkspaceMember(db), asyncHandler(async (req, res) => {
    res.status(200).json({ connectors: await listConnectorsForWorkspace(db, req.params.workspaceId) });
  }));

  router.post('/', requireWorkspaceOwner(db), asyncHandler(async (req, res) => {
    const body = req.body ?? {};
    if (typeof body.name !== 'string' || body.name.trim() === '') {
      res.status(400).json({ code: 'INVALID_INPUT' });
      return;
    }
    if (!parseBaseUrl(body.baseUrl)) {
      res.status(400).json({ code: 'INVALID_INPUT' });
      return;
    }
    const authError = validateAuthFields(body);
    if (authError) {
      res.status(400).json({ code: authError });
      return;
    }
    const connector = await createConnector(db, {
      workspaceId: req.params.workspaceId,
      name: body.name,
      baseUrl: body.baseUrl,
      authType: body.authType,
      authHeaderName: body.authType === 'header' ? body.authHeaderName : undefined,
      authValue: body.authType === 'none' ? undefined : body.authValue,
    });
    res.status(201).json({
      id: connector.id, name: connector.name, type: connector.type, baseUrl: connector.baseUrl,
      authType: connector.authType, authHeaderName: connector.authHeaderName, updatedAt: connector.updatedAt,
    });
  }));

  router.put('/:connectorId', requireWorkspaceOwner(db), asyncHandler(async (req, res) => {
    const body = req.body ?? {};
    if (body.name !== undefined && (typeof body.name !== 'string' || body.name.trim() === '')) {
      res.status(400).json({ code: 'INVALID_INPUT' });
      return;
    }
    if (body.baseUrl !== undefined && !parseBaseUrl(body.baseUrl)) {
      res.status(400).json({ code: 'INVALID_INPUT' });
      return;
    }
    // Auth validation runs against the *merged* state, so the existing connector has to be read
    // first: `{authType: 'bearer'}` with no `authValue` is valid when a secret is already stored
    // (a rename that leaves the secret alone) and invalid when there is none to fall back on.
    const existing = await findConnector(db, req.params.workspaceId, req.params.connectorId);
    if (!existing) {
      res.status(404).json({ code: 'NOT_FOUND' });
      return;
    }
    if (body.authType !== undefined) {
      const authError = validateAuthFields(body, existing);
      if (authError) {
        res.status(400).json({ code: authError });
        return;
      }
    }
    // Compute authHeaderName and authValue based on authType change:
    // - undefined authType: don't touch either field
    // - authType === 'none': explicitly clear both authHeaderName and authValue
    // - authType === 'header': set authHeaderName to new value, clear authValue if not provided
    // - authType === 'bearer': clear authHeaderName, keep or set authValue if provided
    let authHeaderName: string | null | undefined;
    let authValue: string | null | undefined;
    if (body.authType === undefined) {
      authHeaderName = undefined;
      authValue = undefined;
    } else if (body.authType === 'none') {
      authHeaderName = null;
      authValue = null;
    } else if (body.authType === 'header') {
      authHeaderName = body.authHeaderName;
      authValue = body.authValue ?? undefined;
    } else if (body.authType === 'bearer') {
      authHeaderName = null;
      authValue = body.authValue ?? undefined;
    }
    const updated = await updateConnector(db, req.params.workspaceId, req.params.connectorId, {
      name: body.name,
      baseUrl: body.baseUrl,
      authType: body.authType,
      authHeaderName,
      authValue,
    });
    if (!updated) {
      res.status(404).json({ code: 'NOT_FOUND' });
      return;
    }
    res.status(200).json({
      id: updated.id, name: updated.name, type: updated.type, baseUrl: updated.baseUrl,
      authType: updated.authType, authHeaderName: updated.authHeaderName, updatedAt: updated.updatedAt,
    });
  }));

  router.delete('/:connectorId', requireWorkspaceOwner(db), asyncHandler(async (req, res) => {
    const deleted = await deleteConnector(db, req.params.workspaceId, req.params.connectorId);
    if (!deleted) {
      res.status(404).json({ code: 'NOT_FOUND' });
      return;
    }
    res.status(204).send();
  }));

  router.post('/:connectorId/resolve', requireWorkspaceMember(db), asyncHandler(async (req, res) => {
    const connector = await findConnector(db, req.params.workspaceId, req.params.connectorId);
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
    const result = await resolveConnectorValue(connector, target, ref, resolveCache);
    res.status(200).json(result);
  }));

  return router;
}
