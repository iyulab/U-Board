import type { Adapter, ResolvedBinding } from '@iyulab/u-board/viewer';
import { getApiBase, fetchWithRetry } from './api-base.js';

/** Delegates to the server's public `/share` resolve proxy instead of the session-authenticated
 * one — the auth mechanism differs (query-string token vs. cookie), so this is a separate class
 * from console's `HttpConnectorAdapter` rather than a forced shared abstraction over two
 * different auth models. */
export class ShareConnectorAdapter implements Adapter {
  constructor(private boardId: string, private token: string, readonly id: string) {}

  async resolve(ref: unknown): Promise<ResolvedBinding> {
    const base = getApiBase();
    const res = await fetchWithRetry(
      `${base}/share/boards/${this.boardId}/connectors/${this.id}/resolve?token=${encodeURIComponent(this.token)}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ref }) }
    );
    if (!res.ok) return { value: undefined, quality: 'disconnected' };
    return res.json();
  }
}
