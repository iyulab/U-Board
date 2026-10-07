import { Router } from 'express';
import type { AppConfig } from '../app.js';
import { requireAuth, type AuthedRequest } from '../middleware/require-auth.js';
import { pathParam } from '../middleware/path-param.js';
import { requireWorkspaceMember, requireWorkspaceOwner } from '../middleware/require-workspace-role.js';
import {
  createConnector,
  listConnectorsForWorkspace,
  findConnector,
  updateConnector,
  deleteConnector,
  applyConnectorChanges,
  type Connector,
  type ConnectorChanges,
  type ConnectorOAuthSettings,
  type ConnectorSummary,
} from '../db/connectors.js';
import { isValidRef, buildResolveTarget, resolveConnectorValue, testConnector, forgetConnector, type ResolveState } from '../resolve-connector.js';

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

/** A new connector's settings from a create request (everything but its name), or the error code
 *  the request is refused with. */
function newConnectorSettings(body: any): Omit<Connector, 'id' | 'workspaceId' | 'name' | 'type' | 'createdAt' | 'updatedAt'> | string {
  if (!parseBaseUrl(body.baseUrl)) return 'INVALID_INPUT';
  const authError = validateAuthFields(body);
  if (authError) return authError;
  return {
    baseUrl: body.baseUrl,
    authType: body.authType,
    authHeaderName: body.authType === 'header' ? body.authHeaderName : undefined,
    authValue: body.authType === 'none' ? undefined : body.authValue,
    ...(body.authType === OAUTH ? oauthSettings(body) : {}),
  };
}

/** The change an update request makes to `existing`, or the error code it is refused with. Auth
 *  validation runs against the merged state: `{authType: 'bearer'}` with no `authValue` is valid
 *  when a secret is already stored (a rename that leaves the secret alone) and invalid when there
 *  is none to fall back on. By `authType`:
 *  - absent: neither the header name nor the secret is touched
 *  - `none`: both are cleared
 *  - `header`: the header name is set; the secret is kept unless a new one is given
 *  - `bearer` / OAuth: the header name is cleared; the secret is kept unless a new one is given
 *  Leaving OAuth for any other type clears the OAuth settings along with it. */
function connectorChanges(body: any, existing: Connector): ConnectorChanges | string {
  if (body.name !== undefined && (typeof body.name !== 'string' || body.name.trim() === '')) return 'INVALID_INPUT';
  if (body.baseUrl !== undefined && !parseBaseUrl(body.baseUrl)) return 'INVALID_INPUT';
  const changes: ConnectorChanges = { name: body.name, baseUrl: body.baseUrl };
  if (body.authType === undefined) return changes;
  const authError = validateAuthFields(body, existing);
  if (authError) return authError;
  return {
    ...changes,
    authType: body.authType,
    authHeaderName: body.authType === 'header' ? body.authHeaderName : null,
    authValue: body.authType === 'none' ? null : (body.authValue ?? undefined),
    oauth: body.authType === OAUTH ? oauthSettings(body, existing) : null,
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

  router.get('/', requireWorkspaceMember(db), async (req, res) => {
    res.status(200).json({ connectors: await listConnectorsForWorkspace(db, pathParam(req, 'workspaceId')) });
  });

  router.post('/', requireWorkspaceOwner(db), async (req: AuthedRequest, res) => {
    const body = req.body ?? {};
    if (typeof body.name !== 'string' || body.name.trim() === '') {
      res.status(400).json({ code: 'INVALID_INPUT' });
      return;
    }
    const settings = newConnectorSettings(body);
    if (typeof settings === 'string') {
      res.status(400).json({ code: settings });
      return;
    }
    const connector = await createConnector(db, {
      workspaceId: pathParam(req, 'workspaceId'),
      actorUserId: req.userId!,
      name: body.name,
      ...settings,
    });
    res.status(201).json(toSummary(connector));
  });

  // Tries settings before they are saved: an OAuth connector's token request and, given a `path`,
  // one request to the data source — the request a binding would make, under the same origin
  // pinning, without touching the values bindings are served from. With `connectorId` the body is
  // an edit of that connector (omitted secrets are the stored ones); without, a new connector.
  router.post('/test', requireWorkspaceOwner(db), async (req: AuthedRequest, res) => {
    const body = req.body ?? {};
    const workspaceId = pathParam(req, 'workspaceId');
    let candidate: Connector;
    if (body.connectorId !== undefined) {
      const existing = typeof body.connectorId === 'string' ? await findConnector(db, workspaceId, body.connectorId) : undefined;
      if (!existing) {
        res.status(404).json({ code: 'NOT_FOUND' });
        return;
      }
      const changes = connectorChanges(body, existing);
      if (typeof changes === 'string') {
        res.status(400).json({ code: changes });
        return;
      }
      candidate = applyConnectorChanges(existing, changes);
    } else {
      const settings = newConnectorSettings(body);
      if (typeof settings === 'string') {
        res.status(400).json({ code: settings });
        return;
      }
      const now = new Date().toISOString();
      candidate = { id: 'connection-test', workspaceId, name: '', type: 'http', createdAt: now, updatedAt: now, ...settings };
    }
    // Without a path there is nothing to call but an OAuth token endpoint.
    if (body.path === undefined && candidate.authType !== OAUTH) {
      res.status(400).json({ code: 'PATH_REQUIRED' });
      return;
    }
    let target: URL | null = null;
    if (body.path !== undefined) {
      target = isValidRef({ path: body.path }) ? buildResolveTarget(candidate, { path: body.path }) : null;
      if (!target) {
        res.status(400).json({ code: 'INVALID_INPUT' });
        return;
      }
    }
    res.status(200).json(await testConnector(candidate, target, resolveState.fetch));
  });

  router.put('/:connectorId', requireWorkspaceOwner(db), async (req: AuthedRequest<{ connectorId: string }>, res) => {
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
    const existing = await findConnector(db, pathParam(req, 'workspaceId'), req.params.connectorId);
    if (!existing) {
      res.status(404).json({ code: 'NOT_FOUND' });
      return;
    }
    const changes = connectorChanges(body, existing);
    if (typeof changes === 'string') {
      res.status(400).json({ code: changes });
      return;
    }
    const updated = await updateConnector(db, pathParam(req, 'workspaceId'), req.params.connectorId, changes, req.userId!);
    if (!updated) {
      res.status(404).json({ code: 'NOT_FOUND' });
      return;
    }
    forgetConnector(resolveState, updated.id);
    res.status(200).json(toSummary(updated));
  });

  router.delete('/:connectorId', requireWorkspaceOwner(db), async (req: AuthedRequest<{ connectorId: string }>, res) => {
    const deleted = await deleteConnector(db, pathParam(req, 'workspaceId'), req.params.connectorId, req.userId!);
    if (!deleted) {
      res.status(404).json({ code: 'NOT_FOUND' });
      return;
    }
    forgetConnector(resolveState, req.params.connectorId);
    res.status(204).send();
  });

  router.post('/:connectorId/resolve', requireWorkspaceMember(db), async (req, res) => {
    const connector = await findConnector(db, pathParam(req, 'workspaceId'), req.params.connectorId);
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
  });

  return router;
}
