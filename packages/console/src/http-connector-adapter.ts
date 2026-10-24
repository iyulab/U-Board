import type { Adapter, Attribution, ResolvedBinding } from '@iyulab/u-board';
import type { HttpRef } from '@iyulab/u-board/picture';
import { resolveConnector } from './api-client.js';

/** Delegates the actual HTTP call to the server's resolve proxy so a connector's credentials
 * never reach the browser (docs: 2026-08-21-u-board-console-connector-management-design.md). */
export class HttpConnectorAdapter implements Adapter {
  constructor(private workspaceId: string, readonly id: string, readonly attribution?: Attribution, readonly sample?: boolean) {}

  async resolve(ref: unknown): Promise<ResolvedBinding> {
    return resolveConnector(this.workspaceId, this.id, ref as HttpRef);
  }
}
