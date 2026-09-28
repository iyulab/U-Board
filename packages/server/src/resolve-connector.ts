import type { Connector } from './db/connectors.js';
import type { ClientCredentials, ClientCredentialsTokens } from './oauth-client-credentials.js';
import { HttpStatusError } from './http-status-error.js';

export type ResolveQuality = 'live' | 'stale' | 'disconnected';

/** Why a resolve is not `live` — the core's `QualityReason`, same four words. */
export type ResolveReason = 'transport' | 'auth' | 'address' | 'throttled';

export interface ResolveResult {
  value: unknown;
  quality: ResolveQuality;
  reason?: ResolveReason;
}

/** Process-wide state the resolve proxy keeps between requests. */
export interface ResolveState {
  /** Last value resolved per connector and ref, so a failure can degrade to `stale`. */
  values: Map<string, unknown>;
  /** Access tokens for `oauth2-client-credentials` connectors. */
  tokens: ClientCredentialsTokens;
  /** The failure currently logged per connector and ref (same key as `values`). A binding polled
   * against a data source that is down fails on every poll; logging only when the failure starts,
   * changes, or clears keeps the log a record of what happened rather than a repeat of it. */
  failures: Map<string, string>;
  /** Upstream requests currently open, per connector and URL. Bindings that read different
   * `valuePath`s of the same response (one collection, many assets) share one request instead of
   * each fetching it — the upstream sees one call per distinct URL, however many nodes read it. */
  inflight: Map<string, Promise<unknown>>;
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

/** Follows `path` through `obj`, telling "the path ends at `null`/`undefined`" (a value the source
 * sent) apart from "the path leads nowhere" (a response that does not contain what the binding
 * addresses — an empty result set, a renamed field). Only the first is a live reading. */
function getByPath(obj: unknown, path: string): { found: true; value: unknown } | { found: false } {
  let cursor = obj;
  for (const key of path.split('.')) {
    if (!cursor || typeof cursor !== 'object' || !(key in (cursor as Record<string, unknown>))) {
      return { found: false };
    }
    cursor = (cursor as Record<string, unknown>)[key];
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
  constructor(readonly stage: ResolveStage, cause: unknown, reason?: ResolveReason) {
    super(describeFailure(cause));
    this.reason = reason ?? reasonFor(stage, cause);
  }
}

/** What an upstream failure means for whoever has to fix it. A status the data source or token
 * endpoint answered with says it; anything else (network, timeout, 5xx, a redirect not followed,
 * an unparseable body) means the source could not be used at all. */
function reasonFor(stage: ResolveStage, cause: unknown): ResolveReason {
  if (!(cause instanceof HttpStatusError)) return 'transport';
  const { status } = cause;
  if (status === 429) return 'throttled';
  if (status === 401 || status === 403) return 'auth';
  // RFC 6749 §5.2: the token endpoint answers a bad client or grant with 400 as well.
  if (stage === 'token' && status === 400) return 'auth';
  if (stage !== 'token' && (status === 404 || status === 410)) return 'address';
  return 'transport';
}

/** Fetches and parses `target` with `connector`'s auth headers. An OAuth connector whose token is
 * rejected (401) gets one fresh token and one retry — the authorization server may revoke a token
 * before the expiry it advertised. */
async function fetchBody(connector: Connector, target: URL, tokens: ClientCredentialsTokens): Promise<unknown> {
  // `redirect: 'manual'` closes the same credential-exfiltration hole from the other side: a
  // compromised upstream must not be able to bounce the credentialed request to a host of its
  // choosing. A manual-redirect response is not `ok`, so it falls into the failure path below.
  let stage: ResolveStage = 'request';
  const send = async () => {
    stage = 'token';
    const headers = await authHeaders(connector, tokens);
    stage = 'request';
    return fetch(target, { headers, redirect: 'manual', signal: AbortSignal.timeout(5000) });
  };
  try {
    let response = await send();
    if (response.status === 401 && connector.authType === 'oauth2-client-credentials') {
      tokens.invalidate(connector.id);
      response = await send();
    }
    if (!response.ok) throw new HttpStatusError(response.status, `upstream responded ${response.status}`);
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
    request = fetchBody(connector, target, state.tokens).finally(() => state.inflight.delete(requestKey));
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
    state.values.set(cacheKey, value);
    if (state.failures.delete(cacheKey)) console.warn(`${where}: recovered`);
    return { value, quality: 'live' };
  } catch (err) {
    const { stage, message, reason } = err as StageError;
    const stale = state.values.has(cacheKey);
    const failure = `${stage} failed: ${message}`;
    if (state.failures.get(cacheKey) !== failure) {
      state.failures.set(cacheKey, failure);
      console.warn(`${where}: ${failure} — ${stale ? 'serving the last value as stale' : 'no value to serve'}`);
    }
    return stale ? { value: state.values.get(cacheKey), quality: 'stale', reason } : { value: undefined, quality: 'disconnected', reason };
  }
}
