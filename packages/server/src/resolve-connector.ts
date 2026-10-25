import { PATH_KEY_PLACEHOLDER, type Connector, type HttpConnector, type StaticConnector } from './db/connectors.js';
import { ClientCredentialsTokens, type ClientCredentials } from './oauth-client-credentials.js';
import { type QualityReason, type ResolvedBinding } from '@iyulab/u-board/domain';
import { isHttpRef, readHttpRef, requestPath, resolvedReading, sourceErrorIn, type HttpRef } from '@iyulab/u-board/picture';
import { HttpStatusError } from './http-status-error.js';
import { CONNECTOR_ADDRESS_REFUSED } from './connector-network.js';

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
  /** Upstream reads per connector and URL — the ones still open, and successful ones for as long as some
   * binding reuses them (`reuseWindowMs`). Bindings that read different `valuePath`s of the same response
   * (one collection, many assets) share one request instead of each fetching it, and so do the polls of
   * every viewer that has the board open: the upstream sees about one call per URL per window, however
   * many nodes read it and however many screens show it. */
  reads: Map<string, UpstreamRead>;
  /** How long a successful upstream read answers later resolves of the same URL (milliseconds), unless
   * the binding's reference allows longer (`maxAgeSeconds`). 0: only resolves that start while the read
   * is still open share it. */
  reuseMs: number;
  /** How long after its last successful read a value may still be served as `stale` (milliseconds) —
   * counted from the read, not from the time the source says it observed the value, which for a source
   * that publishes on a schedule is older from the start. Past it, a failed read is `disconnected` — the
   * value is too old to stand in for the current one. Unset: no limit, the last value is served however
   * old (its `observedAt` says how old). */
  staleMaxAgeMs?: number;
  /** The last successful read per connector and URL (same key as `reads`), kept past its reuse window for as long as
   * it is still the freshest answer that can exist (`LastRead.keepMs`): what a resolve answers with while a new read
   * of a slow source is still out (stale-while-revalidate, RFC 5861). */
  lastReads: Map<string, LastRead>;
  /** How long a resolve waits for an upstream read before it answers without it (milliseconds) — the read itself goes
   * on to `readTimeoutMs` and serves the next resolve. Default `DEFAULT_RESOLVE_WAIT_MS`. */
  waitMs?: number;
  /** How long an upstream read, and a connection test, may take before it is given up (milliseconds). Default
   * `DEFAULT_READ_TIMEOUT_MS`. */
  readTimeoutMs?: number;
}

/** A successful read kept after its reuse window: its body, when it was read, and how long after that it may still
 * answer — its reuse window plus the read time limit, the latest a read started when the window closed can finish. */
export interface LastRead {
  body: unknown;
  readAt: number;
  /** When the response was made, as it says (`answeredAtOf`) — `readAt` when it says nothing. */
  answeredAt: number;
  keepMs: number;
}

/** How long a resolve waits for its upstream read by default — a viewer's whole board waits on its slowest binding. */
export const DEFAULT_RESOLVE_WAIT_MS = 5_000;

/** How long an upstream read may take by default — under the 30 s a client gives a request, so a connection test
 * answers with what the source did rather than the client's own timeout. */
export const DEFAULT_READ_TIMEOUT_MS = 25_000;

/** One read of a data source URL: its parsed body, when it was read (epoch ms) — which the cache's windows count from,
 * however much later a resolve reuses it — and when the response was made, as it says (`answeredAt`): the time a value
 * taken from it was observed when the source's answer names none. `settledAt` is set
 * once a successful read finishes, which starts its reuse window; `keepMs` is the longest window a
 * binding has asked of it, how long it is kept for one to reuse. */
export interface UpstreamRead {
  result: Promise<{ body: unknown; readAt: number; answeredAt: number }>;
  settledAt?: number;
  keepMs: number;
}

/** How long a binding reuses a successful read of its URL: the installation's window, or an eighth of the
 *  age its reference allows the source's value (`maxAgeSeconds`), whichever is longer. A source that is
 *  current while ninety minutes old need not be asked every ten seconds — every eleven minutes still shows
 *  its new value within an eighth of that, and spends a daily request quota a hundred times more slowly. */
export function reuseWindowMs(ref: HttpRef, reuseMs: number): number {
  return ref.maxAgeSeconds === undefined ? reuseMs : Math.max(reuseMs, (ref.maxAgeSeconds * 1000) / 8);
}

function sweepExpiredReads(state: ResolveState): void {
  const now = Date.now();
  for (const [key, read] of state.reads) {
    if (read.settledAt !== undefined && now - read.settledAt >= read.keepMs) state.reads.delete(key);
  }
  for (const [key, last] of state.lastReads) {
    if (now - last.readAt > last.keepMs) state.lastReads.delete(key);
  }
}

/** Whether `promise` settles — either way — within `ms`; the timer is cleared as soon as it does. */
async function settledWithin(promise: Promise<unknown>, ms: number): Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<boolean>(done => {
    timer = setTimeout(() => done(false), ms);
  });
  try {
    return await Promise.race([promise.then(() => true, () => true), timeout]);
  } finally {
    clearTimeout(timer);
  }
}

/** Drops everything the resolve proxy holds for `connectorId` — reads being reused, last-known values
 * served as `stale`, logged failures, its access token. Call it when the connector's settings change
 * or it is deleted: what was read with the old address or credentials must not answer for the new. */
export function forgetConnector(state: ResolveState, connectorId: string): void {
  for (const reads of [state.reads, state.lastReads]) {
    for (const key of reads.keys()) if (key.startsWith(`${connectorId} `)) reads.delete(key);
  }
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
export type { HttpRef } from '@iyulab/u-board/picture';

/** Whether `ref` is a reference this proxy may request — the core's `isHttpRef`, which also keeps the
 *  request on the connector's origin (a path that does not start with a single `/` could be read as URL
 *  authority, sending the owner's credentials elsewhere). */
export function isValidRef(ref: unknown): ref is HttpRef {
  return isHttpRef(ref);
}

/** Resolves `ref.path` — its time places filled in for a request sent `now` (`requestPath`) — against
 * `connector.baseUrl`, pinned to the connector's own origin *and*,
 * when the owner configured `baseUrl` with a path prefix, pinned to that prefix too. Returns
 * `null` if the ref can't be turned into a same-prefix request — the caller should treat that as
 * `400 INVALID_INPUT`, not as a resolve outcome, since a malformed request never reaches the
 * network at all.
 *
 * The prefix check exists alongside the origin check because `..` dot-segments normalize *within*
 * the origin: `new URL('/../../admin', 'https://plant.example.com/api/v2/')` resolves to
 * `https://plant.example.com/admin` — the origin the owner scoped the connector's credentials to,
 * but not the path prefix the owner scoped the connector's *use* to. */
export function buildResolveTarget(
  connector: Connector,
  ref: Pick<HttpRef, 'path' | 'timeZone' | 'requestTime'>,
  now = Date.now()
): URL | null {
  if (connector.type === 'static') return staticTarget(ref.path);
  let target: URL;
  let base: URL;
  try {
    base = new URL(connector.baseUrl);
    // Concatenation (rather than `new URL(path, base)`) so a baseUrl with a path prefix keeps
    // it; the trailing-slash trim keeps the joined URL from doubling the separator.
    target = new URL(connector.baseUrl.replace(/\/+$/, '') + requestPath(ref, now));
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

/** Where a static source's answers are addressed: a namespace of their own, never requested — it keeps a static read
 *  shared, cached and logged by its path exactly as an HTTP read is by its URL. */
const STATIC_ORIGIN = 'https://static.invalid';

/** The address of the answer a static source keeps at `path` — its query left out, as a static source answers the
 *  same at a path whatever is asked there — or `null` for a path that is not one as written (one with `..` or `.`
 *  segments, which would name another). The path as written is the key: time places are not filled in. */
export function staticTarget(path: string): URL | null {
  const bare = path.split('?')[0]!;
  try {
    const target = new URL(STATIC_ORIGIN + bare);
    return staticPathOf(target) === bare ? target : null;
  } catch {
    return null;
  }
}

/** The path, as its owner stored it, that a static target addresses. */
function staticPathOf(target: URL): string {
  try {
    return decodeURIComponent(target.pathname);
  } catch {
    return target.pathname;
  }
}

/** What a static source answers at `target`: the answer stored at its path — or, with none there, the failure an HTTP
 *  source's «not found» is, so a binding to a path the source does not have reads as a wrong address. */
async function staticBody(connector: StaticConnector, target: URL): Promise<unknown> {
  const path = staticPathOf(target);
  if (!Object.hasOwn(connector.answers, path)) {
    throw new StageError('request', new HttpStatusError(404, `no answer is stored at ${path}`));
  }
  return connector.answers[path];
}

function clientCredentialsOf(connector: HttpConnector): ClientCredentials {
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

async function authHeaders(connector: HttpConnector, tokens: ClientCredentialsTokens): Promise<Record<string, string>> {
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
  readonly reason: QualityReason;
  /** The status the upstream answered with, when it answered at all. */
  readonly status?: number;
  /** The start of a body the binding could not read — shown to whoever tries the connector, never logged. */
  excerpt?: string;
  constructor(readonly stage: ResolveStage, cause: unknown, reason?: QualityReason) {
    super(describeFailure(cause));
    this.reason = reason ?? reasonFor(stage, cause);
    if (cause instanceof HttpStatusError) {
      this.status = cause.status;
      this.excerpt = cause.excerpt;
    }
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

/** An answer the source gave with success but in which it says it failed (`Connector.sourceError`) — its words,
 *  with the connector's secret taken out should the source echo the request back. */
function sourceReported(connector: HttpConnector, said: string, body: unknown): StageError {
  const words = withoutSecret(connector, said);
  const error = new StageError('response', new Error(words), 'source');
  error.excerpt = excerptOf(body);
  return error;
}

/** What an upstream failure means for whoever has to fix it. A status the data source or token
 * endpoint answered with says it; anything else (network, timeout, 5xx, a redirect not followed,
 * an unparseable body) means the source could not be used at all. */
function reasonFor(stage: ResolveStage, cause: unknown): QualityReason {
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

/** A failed response's body — as text, whose start a connection test shows (a source says why it refused: a key
 *  not yet registered for this API, a gateway timeout), and parsed when it is JSON, for a finer diagnosis than the
 *  status alone (`reasonFor`). Read only to diagnose the failure, so any problem reading it just means "no body". */
async function errorBody(response: Response): Promise<{ body: unknown; text: string }> {
  let text: string;
  try {
    text = await response.text();
  } catch {
    return { body: undefined, text: '' };
  }
  if (!(response.headers.get('content-type') ?? '').toLowerCase().includes('json')) return { body: undefined, text };
  try {
    return { body: JSON.parse(text), text };
  } catch {
    return { body: undefined, text };
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

function requestUrl(connector: HttpConnector, target: URL): URL {
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

/** How far ahead of this server's clock a response's `Date` may be and still be taken at its word — the two clocks are
 *  not the same clock. Further ahead, the header is not a time the answer could have been made at. */
const RESPONSE_CLOCK_TOLERANCE_MS = 5 * 60_000;

/** When the response was made, as far as the response says (epoch ms), for a response received at `receivedAt`: the
 *  age it has reached (RFC 9111 §4.2.3 — the larger of `receivedAt - Date` and `Age`) before it got here, taken off
 *  `receivedAt`. A source that answers from its database says "now" (`Date`); a proxy or cache in front of it that
 *  serves an old answer says how old (`Date` unchanged, `Age` growing). Without a usable `Date` (absent, unparseable,
 *  or ahead of this clock by more than the tolerance) and without an `Age`, the response is taken as made when it was
 *  received — what a read without headers always was. */
export function answeredAtOf(headers: Headers, receivedAt: number): number {
  const date = Date.parse(headers.get('date') ?? '');
  const age = Number(headers.get('age'));
  const apparent = Number.isNaN(date) || date - receivedAt > RESPONSE_CLOCK_TOLERANCE_MS ? 0 : Math.max(0, receivedAt - date);
  const reported = headers.get('age') !== null && Number.isFinite(age) && age >= 0 ? age * 1000 : 0;
  return receivedAt - Math.max(apparent, reported);
}

/** Fetches and parses `target` with `connector`'s auth headers. An OAuth connector whose token is
 * rejected (401) gets one fresh token and one retry — the authorization server may revoke a token
 * before the expiry it advertised. */
async function fetchBody(
  connector: HttpConnector,
  target: URL,
  tokens: ClientCredentialsTokens,
  fetchFn: typeof fetch,
  timeoutMs: number
): Promise<{ body: unknown; answeredAt: number }> {
  // `redirect: 'manual'` closes the same credential-exfiltration hole from the other side: a
  // compromised upstream must not be able to bounce the credentialed request to a host of its
  // choosing. A manual-redirect response is not `ok`, so it falls into the failure path below.
  let stage: ResolveStage = 'request';
  const send = async () => {
    stage = 'token';
    const headers = await authHeaders(connector, tokens);
    stage = 'request';
    return fetchFn(requestUrl(connector, target), { headers, redirect: 'manual', signal: AbortSignal.timeout(timeoutMs) });
  };
  try {
    let response = await send();
    if (response.status === 401 && connector.authType === 'oauth2-client-credentials') {
      tokens.invalidate(connector.id);
      response = await send();
    }
    if (!response.ok) {
      const { body, text } = await errorBody(response);
      throw new HttpStatusError(response.status, `upstream responded ${response.status}`, body, text === '' ? undefined : excerptOf(text));
    }
    stage = 'response';
    const answeredAt = answeredAtOf(response.headers, Date.now());
    const contentType = (response.headers.get('content-type') ?? '').toLowerCase();
    if (contentType.includes('json')) {
      const body: unknown = await response.json();
      const said = connector.sourceError ? sourceErrorIn(body, connector.sourceError) : undefined;
      if (said !== undefined) throw sourceReported(connector, said, body);
      return { body, answeredAt };
    }
    const text = await response.text();
    if (contentType !== '' && !contentType.startsWith('text/plain')) throw unreadable(contentType, text);
    return { body: text, answeredAt };
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
): Promise<ResolvedBinding> {
  const cacheKey = `${connector.id}:${JSON.stringify(ref)}`;
  const requestKey = `${connector.id} ${target.href}`;
  const where = `[resolve] connector ${connector.id} ${ref.path}`;

  const windowMs = reuseWindowMs(ref, state.reuseMs);
  let read = state.reads.get(requestKey);
  if (read?.settledAt !== undefined && Date.now() - read.settledAt >= windowMs) read = undefined;
  if (read) read.keepMs = Math.max(read.keepMs, windowMs);
  if (!read) {
    // Each entry holds a whole response body, so finished reads past their window go whenever a new
    // read starts: what stays is at most the reads of the last window (and the ones still open).
    sweepExpiredReads(state);
    const readTimeoutMs = state.readTimeoutMs ?? DEFAULT_READ_TIMEOUT_MS;
    const started: UpstreamRead = {
      result: (connector.type === 'static'
        ? staticBody(connector, target).then(body => ({ body, answeredAt: Date.now() }))
        : fetchBody(connector, target, state.tokens, state.fetch, readTimeoutMs)
      ).then(({ body, answeredAt }) => ({ body, readAt: Date.now(), answeredAt })),
      keepMs: windowMs,
    };
    state.reads.set(requestKey, started);
    // A failed read is never reused — the next resolve asks the data source again.
    started.result.then(
      ({ body, readAt, answeredAt }) => {
        state.lastReads.set(requestKey, { body, readAt, answeredAt, keepMs: started.keepMs + readTimeoutMs });
        if (started.keepMs > 0) started.settledAt = Date.now();
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
    let answeredAt: number;
    let fromLast = false;
    if (read.settledAt === undefined && !(await settledWithin(read.result, state.waitMs ?? DEFAULT_RESOLVE_WAIT_MS))) {
      // The source is slow: answer now with the last read while this one goes on and serves the next resolve. It is
      // not a failure — nothing is logged, and nothing recovers when the read lands.
      const last = state.lastReads.get(requestKey);
      if (last === undefined || Date.now() - last.readAt > last.keepMs) return stillReading(state.values.get(cacheKey), state);
      ({ body, readAt, answeredAt } = last);
      fromLast = true;
    } else {
      try {
        ({ body, readAt, answeredAt } = await read.result);
      } catch (err) {
        throw err instanceof StageError ? err : new StageError('request', err);
      }
    }
    // The answer's own statement of when it was observed wins; without one, the value is as old as the response says.
    const reading = readHttpRef(body, ref, ref.observedAtPath === undefined ? Math.min(answeredAt, readAt) : readAt, Date.now());
    if (!reading.ok) throw new StageError('response', new Error(reading.message), reading.reason);
    const result = resolvedReading(reading);
    state.values.set(cacheKey, { value: result.value, observedAt: result.observedAt!, readAt });
    // An answer from the last read says nothing about whether the source works again.
    if (!fromLast && state.failures.delete(cacheKey)) console.warn(`${where}: recovered`);
    // The source answered with its latest — shown as `stale` (`lagging`) when older than the binding expects.
    return result;
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
      ? { value: cached.value, quality: 'stale', reason, message, observedAt: cached.observedAt }
      : { value: undefined, quality: 'disconnected', reason, message };
  }
}

/** Reads `ref` from `connector` — an HTTP source over the network, a static one from what it stores — through the one
 *  path every read takes (`resolveConnectorValue`), or `undefined` when `ref` is not something this source may be
 *  asked: not a valid reference, or one that would leave the source's address. */
export function readSource(connector: Connector, ref: unknown, state: ResolveState): Promise<ResolvedBinding> | undefined {
  if (!isValidRef(ref)) return undefined;
  const target = buildResolveTarget(connector, ref);
  return target ? resolveConnectorValue(connector, target, ref, state) : undefined;
}

/** What a resolve answers while the first read of a slow source is still out: the last value it served, as `stale`
 *  — a read is under way, nothing has failed — or, with none (or one past the stale age limit), `pending`. */
function stillReading(cached: CachedValue | undefined, state: ResolveState): ResolvedBinding {
  const tooOld = cached !== undefined && state.staleMaxAgeMs !== undefined && Date.now() - cached.readAt > state.staleMaxAgeMs;
  return cached !== undefined && !tooOld
    ? { value: cached.value, quality: 'stale', observedAt: cached.observedAt }
    : { value: undefined, quality: 'disconnected', reason: 'pending' };
}

/** The outcome of trying a connector's settings: `ok`, or where it failed (`stage`), what that
 *  means for whoever fixes it (`reason`), the status the upstream answered with, and a message
 *  that names the failure — never the request, whose headers carry the credentials. */
export type ConnectorTestResult =
  | { ok: true; excerpt?: string }
  | { ok: false; stage: ResolveStage; reason: QualityReason; status?: number; message: string; excerpt?: string };

/** Tries `connector` as a binding would use it: obtains an OAuth access token, then, given a
 *  target, requests it once. A token cache of its own, so a token already obtained with the stored
 *  settings cannot vouch for the ones being tried; nothing is cached or logged for bindings. */
export async function testConnector(
  connector: Connector,
  target: URL | null,
  fetchFn: typeof fetch,
  timeoutMs = DEFAULT_READ_TIMEOUT_MS
): Promise<ConnectorTestResult> {
  const tokens = new ClientCredentialsTokens(Date.now, fetchFn);
  try {
    if (target) {
      // The start of what came back, so the owner sees whether it is the data or an error the source
      // answered with success (some report a bad key or an empty query in a 200 body).
      if (connector.type === 'static') return { ok: true, excerpt: excerptOf(await staticBody(connector, target)) };
      return { ok: true, excerpt: withoutSecret(connector, excerptOf((await fetchBody(connector, target, tokens, fetchFn, timeoutMs)).body)) };
    } else if (connector.type === 'http' && connector.authType === 'oauth2-client-credentials') {
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
      ...(failure.excerpt !== undefined && { excerpt: connector.type === 'http' ? withoutSecret(connector, failure.excerpt) : failure.excerpt }),
    };
  }
}

/** `text` with the connector's secret taken out, should the source echo the request back in what a test shows. */
function withoutSecret(connector: HttpConnector, text: string): string {
  return connector.authValue ? text.split(connector.authValue).join('…') : text;
}
