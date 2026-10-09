import { PATH_KEY_PLACEHOLDER, type Connector } from './db/connectors.js';
import { ClientCredentialsTokens, type ClientCredentials } from './oauth-client-credentials.js';
import { isHttpRef, readHttpRef, type HttpRef } from '@iyulab/u-board/domain';
import { HttpStatusError } from './http-status-error.js';
import { CONNECTOR_ADDRESS_REFUSED } from './connector-network.js';

export type ResolveQuality = 'live' | 'stale' | 'disconnected';

/** Why a resolve is not `live` — the core's `QualityReason`, same words. */
export type ResolveReason = 'transport' | 'auth' | 'address' | 'format' | 'throttled';

export interface ResolveResult {
  value: unknown;
  quality: ResolveQuality;
  reason?: ResolveReason;
  /** When `value` was read from the data source (ISO 8601) — now for `live`, the last
   * successful read for `stale`; absent for `disconnected`. The core's `ResolvedBinding.observedAt`. */
  observedAt?: string;
}

/** A last-known value: when the source says it observed it (ISO 8601) and when it was read from the
 *  source (epoch ms). The two differ for a source that publishes its readings on a schedule — an hourly
 *  measurement read at :50 is fifty minutes old the moment it arrives, but was as fresh as the source
 *  could give. */
export interface CachedValue {
  value: unknown;
  observedAt: string;
  readAt: number;
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
  /** Upstream reads per connector and URL — the ones still open, and successful ones for `reuseMs`
   * after they finished. Bindings that read different `valuePath`s of the same response (one
   * collection, many assets) share one request instead of each fetching it, and so do the polls of
   * every viewer that has the board open: the upstream sees about one call per URL per `reuseMs`,
   * however many nodes read it and however many screens show it. */
  reads: Map<string, UpstreamRead>;
  /** How long a successful upstream read answers later resolves of the same URL (milliseconds).
   * 0: only resolves that start while the read is still open share it. */
  reuseMs: number;
  /** How long after its last successful read a value may still be served as `stale` (milliseconds) —
   * counted from the read, not from the time the source says it observed the value, which for a source
   * that publishes on a schedule is older from the start. Past it, a failed read is `disconnected` — the
   * value is too old to stand in for the current one. Unset: no limit, the last value is served however
   * old (its `observedAt` says how old). */
  staleMaxAgeMs?: number;
}

/** One read of a data source URL: its parsed body and when it was read (epoch ms) — the time a
 * value taken from it was observed, however much later a resolve reuses it. `settledAt` is set
 * once a successful read finishes, which starts its reuse window. */
export interface UpstreamRead {
  result: Promise<{ body: unknown; readAt: number }>;
  settledAt?: number;
}

function sweepExpiredReads(state: ResolveState): void {
  const now = Date.now();
  for (const [key, read] of state.reads) {
    if (read.settledAt !== undefined && now - read.settledAt >= state.reuseMs) state.reads.delete(key);
  }
}

/** Drops everything the resolve proxy holds for `connectorId` — reads being reused, last-known values
 * served as `stale`, logged failures, its access token. Call it when the connector's settings change
 * or it is deleted: what was read with the old address or credentials must not answer for the new. */
export function forgetConnector(state: ResolveState, connectorId: string): void {
  for (const key of state.reads.keys()) if (key.startsWith(`${connectorId} `)) state.reads.delete(key);
  for (const map of [state.values, state.failures]) {
    for (const key of map.keys()) if (key.startsWith(`${connectorId}:`)) map.delete(key);
  }
  state.tokens.invalidate(connectorId);
}

/** How long a successful upstream read is reused by default — shorter than a viewer's poll
 * interval, so one screen still sees a fresh read on every poll, while many screens polling the
 * same board cost the data source a few reads per interval rather than one each. */
export const DEFAULT_UPSTREAM_REUSE_MS = 10_000;

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

/** An HTTP connector binding's reference — the core's, read the same way here as wherever else a board
 *  is shown (`readHttpRef`). */
export type { HttpRef } from '@iyulab/u-board/domain';

/** Whether `ref` is a reference this proxy may request — the core's `isHttpRef`, which also keeps the
 *  request on the connector's origin (a path that does not start with a single `/` could be read as URL
 *  authority, sending the owner's credentials elsewhere). */
export function isValidRef(ref: unknown): ref is HttpRef {
  return isHttpRef(ref);
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
  /** The start of a body the binding could not read — shown to whoever tries the connector, never logged. */
  excerpt?: string;
  constructor(readonly stage: ResolveStage, cause: unknown, reason?: ResolveReason) {
    super(describeFailure(cause));
    this.reason = reason ?? reasonFor(stage, cause);
    if (cause instanceof HttpStatusError) this.status = cause.status;
  }
}

/** How much of a response a connection test shows. */
const EXCERPT_LENGTH = 400;

function excerptOf(body: unknown): string {
  const text = typeof body === 'string' ? body : JSON.stringify(body);
  return text.length > EXCERPT_LENGTH ? `${text.slice(0, EXCERPT_LENGTH)}…` : text;
}

/** A body in a form no binding reads: markup (XML, HTML) or anything else that is neither JSON nor plain
 *  text. Public APIs commonly answer XML unless asked for JSON (`returnType=json`, `_type=json`), and an
 *  HTML page is usually a login or error page — either way the source was reached, and asked wrongly. */
function unreadable(contentType: string, text: string): StageError {
  const error = new StageError('response', new Error(`the response is ${contentType.split(';')[0] || 'untyped'}, not JSON`), 'format');
  error.excerpt = excerptOf(text);
  return error;
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
  if (!(response.headers.get('content-type') ?? '').toLowerCase().includes('json')) return undefined;
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

/** The address a request for `target` is sent to: `target` itself, or — for a connector that sends
 *  its key in the address — `target` with the key put in. Only the request carries it: `target` is
 *  what a binding names, what reads are shared and cached by, and what a log may describe. */
/** The decoded name of one `name=value` pair of a query string — as written when it does not decode. */
function parameterName(pair: string): string {
  const raw = pair.split('=')[0].replace(/\+/g, ' ');
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function requestUrl(connector: Connector, target: URL): URL {
  if (connector.authValue === undefined) return target;
  if (connector.authType === 'query' && connector.authParamName) {
    // Appended to the query as the binding wrote it, rather than through `searchParams`, which would
    // re-encode every other parameter — `$filter=Name eq 'a'` must reach an OData source as written.
    // A parameter of the same name in the binding gives way to the key.
    const url = new URL(target);
    const name = encodeURIComponent(connector.authParamName);
    const others = url.search
      .slice(1)
      .split('&')
      .filter(pair => pair !== '' && parameterName(pair) !== connector.authParamName);
    url.search = [...others, `${name}=${encodeURIComponent(connector.authValue)}`].join('&');
    return url;
  }
  if (connector.authType === 'path') {
    const url = new URL(target);
    url.pathname = url.pathname.replace(encodeURI(PATH_KEY_PLACEHOLDER), encodeURIComponent(connector.authValue));
    return url;
  }
  return target;
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
    return fetchFn(requestUrl(connector, target), { headers, redirect: 'manual', signal: AbortSignal.timeout(5000) });
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
    const contentType = (response.headers.get('content-type') ?? '').toLowerCase();
    if (contentType.includes('json')) return await response.json();
    const text = await response.text();
    if (contentType !== '' && !contentType.startsWith('text/plain')) throw unreadable(contentType, text);
    return text;
  } catch (err) {
    throw err instanceof StageError ? err : new StageError(stage, err);
  }
}

/** Resolves one binding against `target`, caching the last-known value so a failure can degrade
 * to `stale` instead of `disconnected` when something was resolved before. Never throws — a
 * fetch/parse failure becomes a `disconnected`/`stale` result, not an exception, because resolve
 * is a status-carrying endpoint. That includes failing to obtain an OAuth access token: the
 * binding is as unavailable as if the data source itself had not answered. Resolves of the same URL
 * share one upstream read while it is open and for `ResolveState.reuseMs` after it succeeded
 * (`ResolveState.reads`). */
export async function resolveConnectorValue(
  connector: Connector,
  target: URL,
  ref: HttpRef,
  state: ResolveState
): Promise<ResolveResult> {
  const cacheKey = `${connector.id}:${JSON.stringify(ref)}`;
  const requestKey = `${connector.id} ${target.href}`;
  const where = `[resolve] connector ${connector.id} ${ref.path}`;

  let read = state.reads.get(requestKey);
  if (read?.settledAt !== undefined && Date.now() - read.settledAt >= state.reuseMs) read = undefined;
  if (!read) {
    // Each entry holds a whole response body, so finished reads past their window go whenever a new
    // read starts: what stays is at most the reads of the last window (and the ones still open).
    sweepExpiredReads(state);
    const started: UpstreamRead = {
      result: fetchBody(connector, target, state.tokens, state.fetch).then(body => ({ body, readAt: Date.now() })),
    };
    state.reads.set(requestKey, started);
    // A failed read is never reused — the next resolve asks the data source again.
    started.result.then(
      () => {
        if (state.reuseMs > 0) started.settledAt = Date.now();
        else if (state.reads.get(requestKey) === started) state.reads.delete(requestKey);
      },
      () => {
        if (state.reads.get(requestKey) === started) state.reads.delete(requestKey);
      }
    );
    read = started;
  }

  try {
    let body: unknown;
    let readAt: number;
    try {
      ({ body, readAt } = await read.result);
    } catch (err) {
      throw err instanceof StageError ? err : new StageError('request', err);
    }
    const reading = readHttpRef(body, ref, readAt);
    if (!reading.ok) throw new StageError('response', new Error(reading.message), reading.reason);
    const { value } = reading;
    const observedAt = new Date(reading.observedAt).toISOString();
    state.values.set(cacheKey, { value, observedAt, readAt });
    if (state.failures.delete(cacheKey)) console.warn(`${where}: recovered`);
    return { value, quality: 'live', observedAt };
  } catch (err) {
    const { stage, message, reason } = err as StageError;
    const cached = state.values.get(cacheKey);
    const tooOld =
      cached !== undefined &&
      state.staleMaxAgeMs !== undefined &&
      Date.now() - cached.readAt > state.staleMaxAgeMs;
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
  | { ok: true; excerpt?: string }
  | { ok: false; stage: ResolveStage; reason: ResolveReason; status?: number; message: string; excerpt?: string };

/** Tries `connector` as a binding would use it: obtains an OAuth access token, then, given a
 *  target, requests it once. A token cache of its own, so a token already obtained with the stored
 *  settings cannot vouch for the ones being tried; nothing is cached or logged for bindings. */
export async function testConnector(connector: Connector, target: URL | null, fetchFn: typeof fetch): Promise<ConnectorTestResult> {
  const tokens = new ClientCredentialsTokens(Date.now, fetchFn);
  try {
    if (target) {
      // The start of what came back, so the owner sees whether it is the data or an error the source
      // answered with success (some report a bad key or an empty query in a 200 body).
      return { ok: true, excerpt: excerptOf(await fetchBody(connector, target, tokens, fetchFn)) };
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
      ...(failure.excerpt !== undefined && { excerpt: failure.excerpt }),
    };
  }
}
