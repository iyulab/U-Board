import type { Connector } from './db/connectors.js';

export type ResolveQuality = 'live' | 'stale' | 'disconnected';

export interface ResolveResult {
  value: unknown;
  quality: ResolveQuality;
}

function getByPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((cursor, key) => {
    if (cursor && typeof cursor === 'object' && key in (cursor as Record<string, unknown>)) {
      return (cursor as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
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

/** Fetches `target` with `connector`'s auth headers, caching the last-known value so a failure
 * can degrade to `stale` instead of `disconnected` when something was resolved before. Never
 * throws — a fetch/parse failure becomes a `disconnected`/`stale` result, not an exception,
 * because resolve is a status-carrying endpoint. */
export async function resolveConnectorValue(
  connector: Connector,
  target: URL,
  ref: { path: string; valuePath?: string },
  cache: Map<string, unknown>
): Promise<ResolveResult> {
  const cacheKey = `${connector.id}:${JSON.stringify(ref)}`;

  const headers: Record<string, string> = {};
  if (connector.authType === 'bearer') headers.Authorization = `Bearer ${connector.authValue}`;
  if (connector.authType === 'header' && connector.authHeaderName) {
    headers[connector.authHeaderName] = connector.authValue ?? '';
  }

  try {
    // `redirect: 'manual'` closes the same credential-exfiltration hole from the other side: a
    // compromised upstream must not be able to bounce the credentialed request to a host of its
    // choosing. A manual-redirect response is not `ok`, so it falls into the failure path below.
    const response = await fetch(target, { headers, redirect: 'manual', signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error(`upstream responded ${response.status}`);
    const contentType = response.headers.get('content-type') ?? '';
    const body = contentType.includes('json') ? await response.json() : await response.text();
    const value = ref.valuePath ? getByPath(body, ref.valuePath) : body;
    cache.set(cacheKey, value);
    return { value, quality: 'live' };
  } catch {
    if (cache.has(cacheKey)) {
      return { value: cache.get(cacheKey), quality: 'stale' };
    }
    return { value: undefined, quality: 'disconnected' };
  }
}
