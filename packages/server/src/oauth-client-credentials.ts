import { createHash } from 'node:crypto';
import { HttpStatusError } from './http-status-error.js';

/** How the client authenticates to the token endpoint — the two password-based methods of
 * RFC 6749 §2.3.1, named as OpenID Connect's `token_endpoint_auth_method` values name them. The
 * authorization server MUST support `basic`; `body` is for servers that only accept the
 * credentials as form parameters. */
export type ClientAuthMethod = 'basic' | 'body';

export interface ClientCredentials {
  /** Identifies whose token this is (a connector id) — distinct from the credentials themselves
   * so a rotated secret replaces the cached token instead of sitting beside it. */
  cacheKey: string;
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  scope?: string;
  clientAuth: ClientAuthMethod;
}

interface CachedToken {
  fingerprint: string;
  accessToken: string;
  /** Epoch ms after which the token is no longer handed out; `undefined` when the server gave
   * no `expires_in`, in which case only a rejected request (invalidate) retires it. */
  refreshAt?: number;
}

/** A token is renewed this long before the server says it expires, so a request that picks it up
 * still has time to reach the resource server — capped at half the lifetime for short-lived
 * tokens, which would otherwise never be reused at all. */
const REFRESH_MARGIN_MS = 60_000;

/** `application/x-www-form-urlencoded` encoding of a single value — what RFC 6749 §2.3.1 requires
 * the client id and secret to go through before being joined for HTTP Basic. It differs from
 * `encodeURIComponent` (space becomes `+`, and `!'()*` are escaped). */
function formEncode(value: string): string {
  return new URLSearchParams([['', value]]).toString().slice(1);
}

function fingerprintOf(credentials: ClientCredentials): string {
  const { tokenUrl, clientId, clientSecret, scope, clientAuth } = credentials;
  return createHash('sha256').update(JSON.stringify([tokenUrl, clientId, clientSecret, scope ?? null, clientAuth])).digest('hex');
}

/** Access tokens obtained with the OAuth 2.0 client credentials grant (RFC 6749 §4.4), cached per
 * `cacheKey`. Concurrent callers share one token request, so a board whose bindings resolve in
 * parallel costs the authorization server a single round trip. Failures are thrown and never
 * cached — the next call tries again. */
export class ClientCredentialsTokens {
  private readonly cached = new Map<string, CachedToken>();
  private readonly pending = new Map<string, { fingerprint: string; promise: Promise<string> }>();

  /** `fetchFn` makes the token requests — the connector `fetch`, so they keep to the same addresses
   *  as the data source requests. */
  constructor(
    private readonly now: () => number = Date.now,
    private readonly fetchFn: typeof fetch = (input, init) => fetch(input, init)
  ) {}

  async get(credentials: ClientCredentials): Promise<string> {
    const fingerprint = fingerprintOf(credentials);
    const cached = this.cached.get(credentials.cacheKey);
    if (cached && cached.fingerprint === fingerprint && (cached.refreshAt === undefined || this.now() < cached.refreshAt)) {
      return cached.accessToken;
    }
    const inFlight = this.pending.get(credentials.cacheKey);
    if (inFlight && inFlight.fingerprint === fingerprint) return inFlight.promise;

    const promise = this.request(credentials, fingerprint).finally(() => {
      if (this.pending.get(credentials.cacheKey)?.promise === promise) this.pending.delete(credentials.cacheKey);
    });
    this.pending.set(credentials.cacheKey, { fingerprint, promise });
    return promise;
  }

  /** Drops the cached token — call it when the resource server rejects the token (401), since the
   * authorization server may have revoked it before its advertised expiry. */
  invalidate(cacheKey: string): void {
    this.cached.delete(cacheKey);
  }

  private async request(credentials: ClientCredentials, fingerprint: string): Promise<string> {
    const params = new URLSearchParams({ grant_type: 'client_credentials' });
    if (credentials.scope) params.set('scope', credentials.scope);
    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    };
    if (credentials.clientAuth === 'basic') {
      const pair = `${formEncode(credentials.clientId)}:${formEncode(credentials.clientSecret)}`;
      headers.Authorization = `Basic ${Buffer.from(pair).toString('base64')}`;
    } else {
      params.set('client_id', credentials.clientId);
      params.set('client_secret', credentials.clientSecret);
    }

    // Same discipline as the resource request: no redirects (a 3xx must not carry the client
    // secret elsewhere), and a bounded wait.
    const response = await this.fetchFn(credentials.tokenUrl, {
      method: 'POST',
      headers,
      body: params.toString(),
      redirect: 'manual',
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new HttpStatusError(response.status, `token endpoint responded ${response.status}`);
    const body = (await response.json()) as { access_token?: unknown; token_type?: unknown; expires_in?: unknown };
    if (typeof body.access_token !== 'string' || body.access_token === '') {
      throw new Error('token response has no access_token');
    }
    // The token is sent as a Bearer credential, which is only correct for a Bearer token.
    if (typeof body.token_type !== 'string' || body.token_type.toLowerCase() !== 'bearer') {
      throw new Error('token response is not a Bearer token');
    }

    // RFC 6749 §5.1 makes expires_in a number, but some servers send it as a numeric string.
    const expiresIn = typeof body.expires_in === 'string' ? Number(body.expires_in) : body.expires_in;
    const lifetimeMs = typeof expiresIn === 'number' && Number.isFinite(expiresIn) && expiresIn > 0 ? expiresIn * 1000 : undefined;
    const refreshAt = lifetimeMs === undefined ? undefined : this.now() + lifetimeMs - Math.min(REFRESH_MARGIN_MS, lifetimeMs / 2);
    this.cached.set(credentials.cacheKey, { fingerprint, accessToken: body.access_token, refreshAt });
    return body.access_token;
  }
}
