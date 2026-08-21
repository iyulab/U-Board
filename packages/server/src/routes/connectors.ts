import { Router } from 'express';
import type { AppConfig } from '../app.js';
import { requireAuth } from '../middleware/require-auth.js';
import { requireWorkspaceMember, requireWorkspaceOwner } from '../middleware/require-workspace-role.js';
import {
  createConnector,
  listConnectorsForWorkspace,
  updateConnector,
  deleteConnector,
} from '../db/connectors.js';

const AUTH_TYPES = new Set(['none', 'bearer', 'header']);

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
    // - authType === 'none': explicitly clear authValue
    // - authType === 'header': keep or set authHeaderName, clear authValue only if not provided
    // - authType === 'bearer': clear authHeaderName, keep or set authValue only if provided
    let authHeaderName: string | null | undefined;
    let authValue: string | null | undefined;
    if (body.authType === undefined) {
      authHeaderName = undefined;
      authValue = undefined;
    } else if (body.authType === 'none') {
      authHeaderName = body.authHeaderName === undefined ? undefined : null;
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

  return router;
}
