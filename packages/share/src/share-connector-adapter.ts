import type { Adapter, ResolvedBinding } from '@iyulab/u-board/viewer';
import { getApiBase, fetchWithRetry } from './api-base.js';

/** Mirrors the server's cap on one batch request. */
const MAX_BATCH_BINDINGS = 500;

const DISCONNECTED: ResolvedBinding = { value: undefined, quality: 'disconnected' };

/** Why the viewer's own batch request was refused, as the cause every binding in it inherits — the
 * edge rate limit (429) and an unavailable server (5xx) are named; any other refusal (a revoked
 * link, say) says nothing about the data source, so it carries no cause. */
function refusalReason(status: number): ResolvedBinding['reason'] {
  if (status === 429) return 'throttled';
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

  constructor(private boardId: string, private token: string) {}

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
      `${getApiBase()}/share/boards/${this.boardId}/resolve?token=${encodeURIComponent(this.token)}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bindings }) }
    );
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
 * differs (query-string token vs. cookie), so this is a separate class from console's
 * `HttpConnectorAdapter` rather than a forced shared abstraction over two different auth models. */
export class ShareConnectorAdapter implements Adapter {
  constructor(private batcher: ShareResolveBatcher, readonly id: string) {}

  resolve(ref: unknown): Promise<ResolvedBinding> {
    return this.batcher.resolve(this.id, ref);
  }
}
