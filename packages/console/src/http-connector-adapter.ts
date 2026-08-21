import type { Adapter, ResolvedBinding } from '@iyulab/u-board';
import { resolveConnector } from './api-client.js';

/** Delegates the actual HTTP call to the server's resolve proxy so a connector's credentials
 * never reach the browser (docs: 2026-08-21-u-board-console-connector-management-design.md). */
export class HttpConnectorAdapter implements Adapter {
  constructor(private workspaceId: string, readonly id: string) {}

  async resolve(ref: unknown): Promise<ResolvedBinding> {
    return resolveConnector(this.workspaceId, this.id, ref as { path: string; valuePath?: string });
  }
}
