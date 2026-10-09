import type { Adapter, Attribution, ResolvedBinding } from '@iyulab/u-board/viewer';
import { API_BASE, fetchWithRetry } from './api-base.js';

/** Mirrors the server's cap on one batch request. */
const MAX_BATCH_BINDINGS = 500;

const DISCONNECTED: ResolvedBinding = { value: undefined, quality: 'disconnected' };

/** Why the viewer's own batch request was refused, as the cause every binding in it inherits — the
 * edge rate limit (429) and an unavailable server (5xx) are named; any other refusal (a revoked
 * link, say) says nothing about the data source, so it carries no cause. */
function refusalReason(status: number): ResolvedBinding['reason'] {
  if (status === 429) return 'throttled';
  if (status === 410) return 'auth'; // the share link expired while the board was open
  if (status >= 500) return 'transport';
  return undefined;
}

type Pending = { connectorId: string; ref: unknown; settle: (result: Promise<ResolvedBinding>) => void };

/** Collects every resolve a board's render asks for in the same turn and sends them as one request
 * to the server's public batch endpoint. A render resolves all of a document's bindings at once,
 * so without this a board costs one request per binding — against an edge rate limit that counts
 * each one, a board with enough bindings could not load in full. One instance per board, shared by
 * all of that board's connector adapters, so bindings on different connectors travel together. */
export class ShareResolveBatcher {
  private pending: Pending[] = [];

  /** `onExpired` runs when the server says the share link has expired (410) — the board is open,
   * and from now on every binding would only read `disconnected`. */
  constructor(private boardId: string, private token: string, private onExpired?: () => void) {}

  resolve(connectorId: string, ref: unknown): Promise<ResolvedBinding> {
    return new Promise<ResolvedBinding>(settle => {
      if (this.pending.length === 0) setTimeout(() => this.flush(), 0);
      this.pending.push({ connectorId, ref, settle });
    });
  }

  private flush() {
    // The same binding asked for more than once in a turn (two nodes showing one value, or a
    // re-render) travels once and answers every caller.
    const unique = new Map<string, Pending[]>();
    for (const entry of this.pending) {
      const key = JSON.stringify([entry.connectorId, entry.ref]);
      unique.set(key, [...(unique.get(key) ?? []), entry]);
    }
    this.pending = [];
    const groups = [...unique.values()];
    for (let i = 0; i < groups.length; i += MAX_BATCH_BINDINGS) {
      const chunk = groups.slice(i, i + MAX_BATCH_BINDINGS);
      const sent = this.send(chunk.map(([{ connectorId, ref }]) => ({ connectorId, ref })));
      chunk.forEach((group, index) => {
        const result = sent.then(results => results[index] ?? DISCONNECTED);
        for (const { settle } of group) settle(result);
      });
    }
  }

  /** Rejects only when the request itself cannot be made (network failure), which `resolveWidget`
   * reports as `disconnected` for every binding in the request. */
  private async send(bindings: { connectorId: string; ref: unknown }[]): Promise<ResolvedBinding[]> {
    const res = await fetchWithRetry(
      `${API_BASE}/share/boards/${this.boardId}/resolve`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.token}` },
        body: JSON.stringify({ bindings }),
      }
    );
    if (res.status === 410) this.onExpired?.();
    if (!res.ok) {
      const refused = { ...DISCONNECTED, reason: refusalReason(res.status) };
      return bindings.map(() => refused);
    }
    const body = (await res.json()) as { results: ResolvedBinding[] };
    return body.results;
  }
}

/** One board connector as the viewer's `Adapter`, resolving through the board's shared batcher —
 * the server's public `/share` proxy rather than the session-authenticated one. The auth mechanism
 * differs (share-link bearer token vs. cookie), so this is a separate class from console's
 * `HttpConnectorAdapter` rather than a forced shared abstraction over two different auth models. */
export class ShareConnectorAdapter implements Adapter {
  constructor(private batcher: ShareResolveBatcher, readonly id: string, readonly attribution?: Attribution) {}

  resolve(ref: unknown): Promise<ResolvedBinding> {
    return this.batcher.resolve(this.id, ref);
  }
}
