import type { ResolvedBinding } from '@iyulab/u-board/domain';
import type { AppConfig } from './app.js';
import { findConnector, type Connector } from './db/connectors.js';
import { readSource, type ResolveState } from './resolve-connector.js';

export const DISCONNECTED: ResolvedBinding = { value: undefined, quality: 'disconnected' };

/** Reads values from a workspace's data sources, as a board's bindings name them — a valid ref for a connector that
 *  exists, else `disconnected` without calling an upstream. Each connector is looked up once per reader, and upstream
 *  reads go through the shared reuse window (`resolveState`). Not gated: what reads a board's values for a share link
 *  checks the board declares them first; the server reads through this alone what a board itself needs to be drawn —
 *  the items a grid lays out (`pictureOf`). What went wrong is left out: it is for whoever can fix the data source. */
export function upstreamReader(config: Pick<AppConfig, 'db' | 'secrets'>, resolveState: ResolveState, workspaceId: string) {
  const { db, secrets } = config;
  const connectors = new Map<string, Promise<Connector | undefined>>();
  const connectorOf = (id: string) => {
    if (!connectors.has(id)) connectors.set(id, findConnector(db, workspaceId, id, secrets));
    return connectors.get(id)!;
  };
  return async (connectorId: string, ref: unknown): Promise<ResolvedBinding> => {
    const connector = await connectorOf(connectorId);
    const read = connector && readSource(connector, ref, resolveState);
    if (!read) return DISCONNECTED;
    const { message: _message, ...served } = await read;
    return served;
  };
}

/** A reader for one workspace, as a router holds it. */
export type UpstreamReader = ReturnType<typeof upstreamReader>;
