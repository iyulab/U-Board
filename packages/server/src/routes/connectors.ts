import { Router } from 'express';
import type { AppConfig } from '../app.js';
import { requireAuth } from '../middleware/require-auth.js';
import { requireWorkspaceMember, requireWorkspaceOwner } from '../middleware/require-workspace-role.js';
import {
  createConnector,
  listConnectorsForWorkspace,
  findConnector,
  updateConnector,
  deleteConnector,
} from '../db/connectors.js';

const AUTH_TYPES = new Set(['none', 'bearer', 'header']);

function getByPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((cursor, key) => {
    if (cursor && typeof cursor === 'object' && key in (cursor as Record<string, unknown>)) {
      return (cursor as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function validateAuthFields(body: any): string | null {
  if (!AUTH_TYPES.has(body.authType)) return 'INVALID_INPUT';
  if (body.authType === 'header' && (typeof body.authHeaderName !== 'string' || body.authHeaderName.trim() === '')) {
    return 'INVALID_INPUT';
  }
  if (body.authType !== 'none' && (typeof body.authValue !== 'string' || body.authValue.trim() === '')) {
    return 'INVALID_INPUT';
  }
  return null;
}

export function createConnectorsRouter(config: AppConfig): Router {
  const { db, sessionSecret } = config;
  const router = Router({ mergeParams: true }); // :workspaceId comes from the parent mount path
  router.use(requireAuth(db, sessionSecret));
  const cache = new Map<string, unknown>();

  router.get('/', requireWorkspaceMember(db), (req, res) => {
    res.status(200).json({ connectors: listConnectorsForWorkspace(db, req.params.workspaceId) });
  });

  router.post('/', requireWorkspaceOwner(db), (req, res) => {
    const body = req.body ?? {};
    if (typeof body.name !== 'string' || body.name.trim() === '') {
      res.status(400).json({ code: 'INVALID_INPUT' });
      return;
    }
    if (typeof body.baseUrl !== 'string' || body.baseUrl.trim() === '') {
      res.status(400).json({ code: 'INVALID_INPUT' });
      return;
    }
    const authError = validateAuthFields(body);
    if (authError) {
      res.status(400).json({ code: authError });
      return;
    }
    const connector = createConnector(db, {
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
  });

  router.put('/:connectorId', requireWorkspaceOwner(db), (req, res) => {
    const body = req.body ?? {};
    if (body.name !== undefined && (typeof body.name !== 'string' || body.name.trim() === '')) {
      res.status(400).json({ code: 'INVALID_INPUT' });
      return;
    }
    if (body.baseUrl !== undefined && (typeof body.baseUrl !== 'string' || body.baseUrl.trim() === '')) {
      res.status(400).json({ code: 'INVALID_INPUT' });
      return;
    }
    if (body.authType !== undefined) {
      const authError = validateAuthFields(body);
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
    const updated = updateConnector(db, req.params.workspaceId, req.params.connectorId, {
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
  });

  router.delete('/:connectorId', requireWorkspaceOwner(db), (req, res) => {
    const deleted = deleteConnector(db, req.params.workspaceId, req.params.connectorId);
    if (!deleted) {
      res.status(404).json({ code: 'NOT_FOUND' });
      return;
    }
    res.status(204).send();
  });

  router.post('/:connectorId/resolve', requireWorkspaceMember(db), async (req, res) => {
    const connector = findConnector(db, req.params.workspaceId, req.params.connectorId);
    if (!connector) {
      res.status(404).json({ code: 'NOT_FOUND' });
      return;
    }
    const ref = req.body?.ref;
    if (!ref || typeof ref.path !== 'string') {
      res.status(400).json({ code: 'INVALID_INPUT' });
      return;
    }
    const cacheKey = `${connector.id}:${JSON.stringify(ref)}`;

    const headers: Record<string, string> = {};
    if (connector.authType === 'bearer') headers.Authorization = `Bearer ${connector.authValue}`;
    if (connector.authType === 'header' && connector.authHeaderName) {
      headers[connector.authHeaderName] = connector.authValue ?? '';
    }

    try {
      const response = await fetch(connector.baseUrl + ref.path, { headers, signal: AbortSignal.timeout(5000) });
      if (!response.ok) throw new Error(`upstream responded ${response.status}`);
      const contentType = response.headers.get('content-type') ?? '';
      const body = contentType.includes('json') ? await response.json() : await response.text();
      const value = ref.valuePath ? getByPath(body, ref.valuePath) : body;
      cache.set(cacheKey, value);
      res.status(200).json({ value, quality: 'live' });
    } catch {
      if (cache.has(cacheKey)) {
        res.status(200).json({ value: cache.get(cacheKey), quality: 'stale' });
      } else {
        res.status(200).json({ value: undefined, quality: 'disconnected' });
      }
    }
  });

  return router;
}
