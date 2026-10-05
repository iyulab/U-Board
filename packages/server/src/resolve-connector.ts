import type { Connector } from './db/connectors.js';
import { ClientCredentialsTokens, type ClientCredentials } from './oauth-client-credentials.js';
import { HttpStatusError } from './http-status-error.js';
import { CONNECTOR_ADDRESS_REFUSED } from './connector-network.js';

export type ResolveQuality = 'live' | 'stale' | 'disconnected';

/** Why a resolve is not `live` — the core's `QualityReason`, same four words. */
export type ResolveReason = 'transport' | 'auth' | 'address' | 'throttled';

export interface ResolveResult {
  value: unknown;
  quality: ResolveQuality;
  reason?: ResolveReason;
  /** When `value` was read from the data source (ISO 8601) — now for `live`, the last
   * successful read for `stale`; absent for `disconnected`. The core's `ResolvedBinding.observedAt`. */
  observedAt?: string;
}

/** A last-known value and when it was read from the data source (ISO 8601). */
export interface CachedValue {
  value: unknown;
  observedAt: string;
}

/** Process-wide state the resolve proxy keeps between requests. */
export interface ResolveState {
  /** Last value resolved per connector and ref, so a failure can degrade to `stale` — and say how
   * old the value it serves is. */
  values: Map<string, CachedValue>;
  /** Access tokens for `oauth2-client-credentials` connectors. */
  tokens: ClientCredentialsTokens;
  /** Makes the requests to data sources — kept to the addresses the installation allows connectors
   *  (`createConnectorFetch`). */
  fetch: typeof fetch;
  /** The failure currently logged per connector and ref (same key as `values`). A binding polled
   * against a data source that is down fails on every poll; logging only when the failure starts,
   * changes, or clears keeps the log a record of what happened rather than a repeat of it. */
  failures: Map<string, string>;
  /** Upstream requests currently open, per connector and URL. Bindings that read different
   * `valuePath`s of the same response (one collection, many assets) share one request instead of
   * each fetching it — the upstream sees one call per distinct URL, however many nodes read it. */
  inflight: Map<string, Promise<unknown>>;
  /** How old a last-known value may be and still be served as `stale` (milliseconds). Past it, a
   * failed read is `disconnected` — the value is too old to stand in for the current one. Unset:
   * no limit, the last value is served however old (its `observedAt` says how old). */
  staleMaxAgeMs?: number;
}

type ResolveStage = 'token' | 'request' | 'response';

/** A loggable reason for a failure — never the request itself, whose headers carry credentials. */
function describeFailure(err: unknown): string {
  if (err instanceof Error) {
    if (err.name === 'TimeoutError') return 'timed out';
    const code = (err.cause as { code?: unknown } | undefined)?.code;
    return typeof code === 'string' ? `${err.message} (${code})` : err.message;
  }
  return String(err);
}

/** The keys `valuePath` names, in order. A path starting with `/` is an RFC 6901 JSON Pointer —
 * the form the authoring path explorer writes, and the only one that can name a key containing a
 * dot (`/@odata.count`) or a slash (`/a~1b`). Anything else is the older dot-separated form
 * (`value.0.Status`), still read so bindings saved before pointers keep resolving. */
function pathTokens(path: string): string[] {
  if (!path.startsWith('/')) return path.split('.');
  return path.slice(1).split('/').map(token => token.replace(/~1/g, '/').replace(/~0/g, '~'));
}

/** Follows `path` through `obj`, telling "the path ends at `null`/`undefined`" (a value the source
 * sent) apart from "the path leads nowhere" (a response that does not contain what the binding
 * addresses — an empty result set, a renamed field). Only the first is a live reading. Only the
 * response's own keys count, and an array index is a plain decimal without leading zeros
 * (RFC 6901 §4) — never an inherited property or the append token `-`. */
function getByPath(obj: unknown, path: string): { found: true; value: unknown } | { found: false } {
  let cursor = obj;
  for (const token of pathTokens(path)) {
    if (Array.isArray(cursor)) {
      if (!/^(0|[1-9][0-9]*)$/.test(token) || Number(token) >= cursor.length) return { found: false };
      cursor = cursor[Number(token)];
    } else if (cursor && typeof cursor === 'object' && Object.prototype.hasOwnProperty.call(cursor, token)) {
      cursor = (cursor as Record<string, unknown>)[token];
    } else {
      return { found: false };
    }
  }
  return { found: true, value: cursor };
}

/** `ref.path` is caller-controlled and the request carries the connector's credentials, so it
 * must not be able to move the request off the connector's origin. A path that does not start
 * with a single `/` could otherwise be parsed as URL authority — `"@attacker.example/"` appended
 * to `https://plant.example.com` yields `plant.example.com` as *userinfo* and `attacker.example`
 * as the host, sending the owner's secret to the caller's server. */
export function isValidRef(ref: unknown): ref is { path: string; valuePath?: string } {
  return (
    !!ref &&
    typeof (ref as { path?: unknown }).path === 'string' &&
    (ref as { path: string }).path.startsWith('/') &&
    !(ref as { path: string }).path.startsWith('//')
  );
}

/** Resolves `ref.path` against `connector.baseUrl`, pinned to the connector's own origin *and*,
 * when the owner configured `baseUrl` with a path prefix, pinned to that prefix too. Returns
 * `null` if the ref can't be turned into a same-prefix request — the caller should treat that as
 * `400 INVALID_INPUT`, not as a resolve outcome, since a malformed request never reaches the
 * network at all.
 *
 * The prefix check exists alongside the origin check because `..` dot-segments normalize *within*
 * the origin: `new URL('/../../admin', 'https://plant.example.com/api/v2/')` resolves to
 * `https://plant.example.com/admin` — the origin the owner scoped the connector's credentials to,
 * but not the path prefix the owner scoped the connector's *use* to. */
export function buildResolveTarget(connector: Connector, ref: { path: string }): URL | null {
  let target: URL;
  let base: URL;
  try {
    base = new URL(connector.baseUrl);
    // Concatenation (rather than `new URL(path, base)`) so a baseUrl with a path prefix keeps
    // it; the trailing-slash trim keeps the joined URL from doubling the separator.
    target = new URL(connector.baseUrl.replace(/\/+$/, '') + ref.path);
  } catch {
    return null;
  }
  if (target.origin !== base.origin) return null;
  const basePathname = base.pathname === '/' ? '' : base.pathname.replace(/\/+$/, '');
  if (basePathname && target.pathname !== basePathname && !target.pathname.startsWith(basePathname + '/')) {
    return null;
  }
  return target;
}

function clientCredentialsOf(connector: Connector): ClientCredentials {
  if (!connector.oauthTokenUrl || !connector.oauthClientId || !connector.authValue) {
    throw new Error('connector is missing its OAuth client credentials');
  }
  return {
    cacheKey: connector.id,
    tokenUrl: connector.oauthTokenUrl,
    clientId: connector.oauthClientId,
    clientSecret: connector.authValue,
    scope: connector.oauthScope,
    clientAuth: connector.oauthClientAuth ?? 'basic',
  };
}

async function authHeaders(connector: Connector, tokens: ClientCredentialsTokens): Promise<Record<string, string>> {
  switch (connector.authType) {
    case 'bearer':
      return { Authorization: `Bearer ${connector.authValue}` };
    case 'header':
      return connector.authHeaderName ? { [connector.authHeaderName]: connector.authValue ?? '' } : {};
    case 'oauth2-client-credentials':
      return { Authorization: `Bearer ${await tokens.get(clientCredentialsOf(connector))}` };
    default:
      return {};
  }
}

/** A failure tagged with the stage it happened in, so a shared request's failure is reported
 * the same way to every binding waiting on it. */
class StageError extends Error {
  readonly reason: ResolveReason;
  /** The status the upstream answered with, when it answered at all. */
  readonly status?: number;
  constructor(readonly stage: ResolveStage, cause: unknown, reason?: ResolveReason) {
    super(describeFailure(cause));
    this.reason = reason ?? reasonFor(stage, cause);
    if (cause instanceof HttpStatusError) this.status = cause.status;
  }
}

/** What an upstream failure means for whoever has to fix it. A status the data source or token
 * endpoint answered with says it; anything else (network, timeout, 5xx, a redirect not followed,
 * an unparseable body) means the source could not be used at all. */
function reasonFor(stage: ResolveStage, cause: unknown): ResolveReason {
  // An address the installation does not let connectors reach: the connector points somewhere it
  // may not go, which its owner fixes like an address that does not exist.
  if ((cause as { cause?: { code?: unknown } } | null)?.cause?.code === CONNECTOR_ADDRESS_REFUSED) return 'address';
  if (!(cause instanceof HttpStatusError)) return 'transport';
  const { status } = cause;
  if (status === 429) return 'throttled';
  if (status === 401 || status === 403) return 'auth';
  // RFC 6749 §5.2: the token endpoint answers a bad client or grant with 400 as well.
  if (stage === 'token' && status === 400) return 'auth';
  if (stage !== 'token' && (status === 404 || status === 410)) return 'address';
  // An OData service answers a query naming a property its entity type does not have (a renamed
  // field) with 400 and an OData error body, not 404 — the binding points nowhere, like a 404. A 400
  // without that body (from a proxy, say) says nothing about the binding and stays a transport fault.
  if (stage !== 'token' && status === 400 && isODataError(cause.body)) return 'address';
  return 'transport';
}

/** The OData v4 JSON error shape (OData JSON Format, "Error Response"): `{ error: { code, message } }`. */
function isODataError(body: unknown): boolean {
  const error = (body as { error?: unknown } | null | undefined)?.error;
  return typeof error === 'object' && error !== null && typeof (error as { code?: unknown }).code === 'string' && 'message' in error;
}

/** A failed response's body, if it is JSON — read only to diagnose the failure, so any problem
 * reading it just means "no body". */
async function errorBody(response: Response): Promise<unknown> {
  if (!(response.headers.get('content-type') ?? '').includes('json')) return undefined;
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

/** Fetches and parses `target` with `connector`'s auth headers. An OAuth connector whose token is
 * rejected (401) gets one fresh token and one retry — the authorization server may revoke a token
 * before the expiry it advertised. */
async function fetchBody(connector: Connector, target: URL, tokens: ClientCredentialsTokens, fetchFn: typeof fetch): Promise<unknown> {
  // `redirect: 'manual'` closes the same credential-exfiltration hole from the other side: a
  // compromised upstream must not be able to bounce the credentialed request to a host of its
  // choosing. A manual-redirect response is not `ok`, so it falls into the failure path below.
  let stage: ResolveStage = 'request';
  const send = async () => {
    stage = 'token';
    const headers = await authHeaders(connector, tokens);
    stage = 'request';
    return fetchFn(target, { headers, redirect: 'manual', signal: AbortSignal.timeout(5000) });
  };
  try {
    let response = await send();
    if (response.status === 401 && connector.authType === 'oauth2-client-credentials') {
      tokens.invalidate(connector.id);
      response = await send();
    }
    if (!response.ok) {
      const body = response.status === 400 ? await errorBody(response) : undefined;
      throw new HttpStatusError(response.status, `upstream responded ${response.status}`, body);
    }
    stage = 'response';
    const contentType = response.headers.get('content-type') ?? '';
    return contentType.includes('json') ? await response.json() : await response.text();
  } catch (err) {
    throw new StageError(stage, err);
  }
}

/** Resolves one binding against `target`, caching the last-known value so a failure can degrade
 * to `stale` instead of `disconnected` when something was resolved before. Never throws — a
 * fetch/parse failure becomes a `disconnected`/`stale` result, not an exception, because resolve
 * is a status-carrying endpoint. That includes failing to obtain an OAuth access token: the
 * binding is as unavailable as if the data source itself had not answered. Concurrent resolves of
 * the same URL share one upstream request (`ResolveState.inflight`). */
export async function resolveConnectorValue(
  connector: Connector,
  target: URL,
  ref: { path: string; valuePath?: string },
  state: ResolveState
): Promise<ResolveResult> {
  const cacheKey = `${connector.id}:${JSON.stringify(ref)}`;
  const requestKey = `${connector.id} ${target.href}`;
  const where = `[resolve] connector ${connector.id} ${ref.path}`;

  let request = state.inflight.get(requestKey);
  if (!request) {
    request = fetchBody(connector, target, state.tokens, state.fetch).finally(() => state.inflight.delete(requestKey));
    state.inflight.set(requestKey, request);
  }

  try {
    let body: unknown;
    try {
      body = await request;
    } catch (err) {
      throw err instanceof StageError ? err : new StageError('request', err);
    }
    let value: unknown = body;
    if (ref.valuePath) {
      const extracted = getByPath(body, ref.valuePath);
      if (!extracted.found) {
        throw new StageError('response', new Error(`valuePath "${ref.valuePath}" not found in the response`), 'address');
      }
      value = extracted.value;
    }
    const observedAt = new Date().toISOString();
    state.values.set(cacheKey, { value, observedAt });
    if (state.failures.delete(cacheKey)) console.warn(`${where}: recovered`);
    return { value, quality: 'live', observedAt };
  } catch (err) {
    const { stage, message, reason } = err as StageError;
    const cached = state.values.get(cacheKey);
    const tooOld =
      cached !== undefined &&
      state.staleMaxAgeMs !== undefined &&
      Date.now() - Date.parse(cached.observedAt) > state.staleMaxAgeMs;
    const servable = cached !== undefined && !tooOld;
    // The served outcome is part of the logged failure, so crossing the age limit mid-outage logs once.
    const failure = `${stage} failed: ${message} — ${
      servable ? 'serving the last value as stale' : tooOld ? 'the last value is past the stale age limit' : 'no value to serve'
    }`;
    if (state.failures.get(cacheKey) !== failure) {
      state.failures.set(cacheKey, failure);
      console.warn(`${where}: ${failure}`);
    }
    return servable
      ? { value: cached.value, quality: 'stale', reason, observedAt: cached.observedAt }
      : { value: undefined, quality: 'disconnected', reason };
  }
}

/** The outcome of trying a connector's settings: `ok`, or where it failed (`stage`), what that
 *  means for whoever fixes it (`reason`), the status the upstream answered with, and a message
 *  that names the failure — never the request, whose headers carry the credentials. */
export type ConnectorTestResult =
  | { ok: true }
  | { ok: false; stage: ResolveStage; reason: ResolveReason; status?: number; message: string };

/** Tries `connector` as a binding would use it: obtains an OAuth access token, then, given a
 *  target, requests it once. A token cache of its own, so a token already obtained with the stored
 *  settings cannot vouch for the ones being tried; nothing is cached or logged for bindings. */
export async function testConnector(connector: Connector, target: URL | null, fetchFn: typeof fetch): Promise<ConnectorTestResult> {
  const tokens = new ClientCredentialsTokens(Date.now, fetchFn);
  try {
    if (target) {
      await fetchBody(connector, target, tokens, fetchFn);
    } else if (connector.authType === 'oauth2-client-credentials') {
      try {
        await tokens.get(clientCredentialsOf(connector));
      } catch (err) {
        throw new StageError('token', err);
      }
    }
    return { ok: true };
  } catch (err) {
    const failure = err instanceof StageError ? err : new StageError('request', err);
    return {
      ok: false,
      stage: failure.stage,
      reason: failure.reason,
      ...(failure.status !== undefined && { status: failure.status }),
      message: failure.message,
    };
  }
}
