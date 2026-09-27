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
  type ConnectorOAuthSettings,
  type ConnectorSummary,
} from '../db/connectors.js';
import { isValidRef, buildResolveTarget, resolveConnectorValue, type ResolveState } from '../resolve-connector.js';

const OAUTH = 'oauth2-client-credentials';
const AUTH_TYPES = new Set(['none', 'bearer', 'header', OAUTH]);
const CLIENT_AUTH_METHODS = new Set(['basic', 'body']);

/**
 * A connector's baseUrl (and an OAuth connector's token URL) must be an absolute http(s) URL. The
 * scheme allowlist is load-bearing, not cosmetic: the resolve proxy pins the request target to the
 * baseUrl's origin, and a non-special scheme has the opaque origin `"null"`, which would make that
 * comparison vacuous. The token URL is deliberately *not* pinned to the baseUrl's origin — an
 * authorization server commonly lives on its own host — and needs no pinning: unlike `ref.path`,
 * it is set only by the workspace owner, who also supplied the secret it receives.
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
    // A bearer token and a header value are the same kind of secret, so switching between those
    // two may keep it; an OAuth client secret is not, so crossing into or out of OAuth needs a
    // new one.
    const sameKindOfSecret = existing !== undefined && existing.authType !== 'none' && (existing.authType === OAUTH) === (body.authType === OAUTH);
    const storedValue = sameKindOfSecret ? existing.authValue : undefined;
    if (!authFieldSatisfied(body.authValue, storedValue)) return 'INVALID_INPUT';
  }
  if (body.authType === OAUTH) {
    const stored = existing?.authType === OAUTH ? existing : undefined;
    if (body.oauthTokenUrl === undefined ? !stored?.oauthTokenUrl : !parseBaseUrl(body.oauthTokenUrl)) return 'INVALID_INPUT';
    if (!authFieldSatisfied(body.oauthClientId, stored?.oauthClientId)) return 'INVALID_INPUT';
    if (body.oauthScope !== undefined && body.oauthScope !== null && typeof body.oauthScope !== 'string') return 'INVALID_INPUT';
    if (body.oauthClientAuth !== undefined && !CLIENT_AUTH_METHODS.has(body.oauthClientAuth)) return 'INVALID_INPUT';
  }
  return null;
}

/** The OAuth settings to store for a validated `oauth2-client-credentials` request: supplied
 * fields win, omitted ones keep what an OAuth connector already had. The client authentication
 * method defaults to HTTP Basic, the one every authorization server must support (RFC 6749
 * §2.3.1); a blank scope means "no scope parameter". */
function oauthSettings(body: any, existing?: Connector): ConnectorOAuthSettings {
  const stored = existing?.authType === OAUTH ? existing : undefined;
  const scope = body.oauthScope === undefined ? stored?.oauthScope : body.oauthScope;
  return {
    oauthTokenUrl: body.oauthTokenUrl ?? stored?.oauthTokenUrl,
    oauthClientId: body.oauthClientId ?? stored?.oauthClientId,
    oauthScope: typeof scope === 'string' && scope.trim() !== '' ? scope.trim() : undefined,
    oauthClientAuth: body.oauthClientAuth ?? stored?.oauthClientAuth ?? 'basic',
  };
}

function toSummary(connector: Connector): ConnectorSummary {
  const { workspaceId: _workspaceId, authValue: _authValue, createdAt: _createdAt, ...summary } = connector;
  return summary;
}

export function createConnectorsRouter(config: AppConfig, resolveState: ResolveState): Router {
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
      ...(body.authType === OAUTH ? oauthSettings(body) : {}),
    });
    res.status(201).json(toSummary(connector));
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
    // - authType === OAUTH: clear authHeaderName, keep or set authValue (the client secret)
    // Leaving OAuth for any other type clears the OAuth settings along with it.
    let authHeaderName: string | null | undefined;
    let authValue: string | null | undefined;
    let oauth: ConnectorOAuthSettings | null | undefined;
    if (body.authType !== undefined) oauth = body.authType === OAUTH ? oauthSettings(body, existing) : null;
    if (body.authType === undefined) {
      authHeaderName = undefined;
      authValue = undefined;
    } else if (body.authType === 'none') {
      authHeaderName = null;
      authValue = null;
    } else if (body.authType === 'header') {
      authHeaderName = body.authHeaderName;
      authValue = body.authValue ?? undefined;
    } else if (body.authType === 'bearer' || body.authType === OAUTH) {
      authHeaderName = null;
      authValue = body.authValue ?? undefined;
    }
    const updated = await updateConnector(db, req.params.workspaceId, req.params.connectorId, {
      name: body.name,
      baseUrl: body.baseUrl,
      authType: body.authType,
      authHeaderName,
      authValue,
      oauth,
    });
    if (!updated) {
      res.status(404).json({ code: 'NOT_FOUND' });
      return;
    }
    res.status(200).json(toSummary(updated));
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
    const result = await resolveConnectorValue(connector, target, ref, resolveState);
    res.status(200).json(result);
  }));

  return router;
}
