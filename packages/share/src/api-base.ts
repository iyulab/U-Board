import { serverClock } from '@iyulab/u-board/viewer';

/** Where the server's API lives — `/api` on this viewer's own origin, or on `VITE_API_BASE_URL` when
 * the server is hosted elsewhere. Callers append a leading-slash path (`/share/boards/…`). */
export function getApiBase(): string {
  return `${(import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '')}/api`;
}

// A scale-to-zero production host's cold start has been observed to exceed 20s before
// the first byte arrives — longer than a typical client-side timeout — so a plain `fetch` here
// can read as "just broken" rather than "slow". One retry after the timeout absorbs exactly that
// case (the instance is warm by the second attempt) without masking a genuinely dead backend.
const REQUEST_TIMEOUT_MS = 30_000;

/** The server's clock, as its responses tell it. The values this viewer shows are stamped by the
 * server, and the screen it runs on may be left unattended long enough for its own clock to drift:
 * "N minutes ago" and "updated at" are measured by this. */
export const apiClock = serverClock();

/** One request, its response's `Date` taken into `apiClock`. */
async function timedFetch(url: string, init?: RequestInit): Promise<Response> {
  const sentAt = Date.now();
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  apiClock.observe(res, sentAt);
  return res;
}

/** `fetch`, but bounded by a timeout and retried once if that timeout is what failed it. Used by
 * every request this viewer makes so a cold-start origin reads as "loading" for a while longer
 * rather than an indefinite hang or an immediate, spurious failure. */
export async function fetchWithRetry(url: string, init?: RequestInit): Promise<Response> {
  try {
    return await timedFetch(url, init);
  } catch (err) {
    // Checked via `.name` rather than `instanceof DOMException`/`instanceof Error` — the abort
    // reason `AbortSignal.timeout` throws is a `DOMException`, but whether that inherits from
    // `Error` varies across environments (true in real browsers and Node, not in jsdom's test
    // implementation); `.name` is the one property both agree on.
    if ((err as { name?: string } | null)?.name === 'TimeoutError') {
      return timedFetch(url, init);
    }
    throw err;
  }
}
