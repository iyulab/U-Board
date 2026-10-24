import { placedIn } from '@iyulab/u-board';
import { fromV1 } from '@iyulab/u-board/board-v2';
import type { LiveSampleConnector, SamplePack } from '@iyulab/u-board-samples';
import { createBoard, createConnector, listConnectors, updateBoard, type ConnectorSummary } from './api-client.js';

/** The samples an installation can create — those on live sources, not example data — loaded when they are
 *  first offered: they carry drawings and recordings the rest of the console never needs. */
export async function loadSamplePacks(): Promise<readonly SamplePack[]> {
  const { SAMPLE_PACKS, isInstallable } = await import('@iyulab/u-board-samples');
  return SAMPLE_PACKS.filter(isInstallable);
}

/** A sample's sources, every one live — what `loadSamplePacks` offers. */
const liveConnectors = (pack: SamplePack) => pack.connectors as LiveSampleConnector[];

/** A data source this workspace already has for a sample's connector: the same address, asked the same way.
 *  Its stored key may be the owner's own rather than the sample's — reusing it keeps that. */
function existingFor(connectors: readonly ConnectorSummary[], sample: LiveSampleConnector): ConnectorSummary | undefined {
  return connectors.find(
    c => c.baseUrl === sample.baseUrl && c.authType === sample.authType && (sample.authType !== 'query' || c.authParamName === sample.authParamName)
  );
}

/**
 * The sources of `pack` this workspace has to give its own key for: those whose source publishes no key to try
 * with, and that the workspace has no data source for yet (an existing one keeps the key it holds).
 */
export function keysToAsk(pack: SamplePack, connectors: readonly ConnectorSummary[]): LiveSampleConnector[] {
  return liveConnectors(pack).filter(sample => sample.ownKey !== undefined && !existingFor(connectors, sample));
}

/**
 * Creates a board from `pack` in the workspace: its data sources (or the workspace's existing ones for the
 * same address), then the board with its bindings pointed at them — in the board language's second version when that
 * carries all of it. A source that asks for the workspace's own
 * key is created with the one `keys` gives under its connector key (see `keysToAsk`). Returns the new board's id.
 */
export async function createBoardFromSample(workspaceId: string, pack: SamplePack, name: string, keys: Readonly<Record<string, string>> = {}): Promise<string> {
  const { connectors } = await listConnectors(workspaceId);
  const ids = new Map<string, string>();
  for (const sample of liveConnectors(pack)) {
    const existing = existingFor(connectors, sample);
    if (existing) {
      ids.set(sample.key, existing.id);
      continue;
    }
    const { key: _key, ownKey, authValue, ...settings } = sample;
    const value = ownKey ? keys[sample.key]?.trim() : authValue;
    if (ownKey && !value) throw new MissingSampleKeyError(sample);
    ids.set(sample.key, (await createConnector(workspaceId, { ...settings, ...(value !== undefined ? { authValue: value } : {}) })).id);
  }
  const v1 = structuredClone(pack.document);
  for (const placed of placedIn(v1)) {
    for (const binding of Object.values(placed.widget.bindings ?? {})) binding.adapter = ids.get(binding.adapter) ?? binding.adapter;
  }
  // Stored in the board language's second version when it carries the whole sample; until then, as the sample is.
  const converted = fromV1(v1);
  const document = converted.unsupported.length === 0 ? converted.board : v1;
  const board = await createBoard(workspaceId, name);
  await updateBoard(workspaceId, board.id, { document });
  return board.id;
}

/** A sample was to be created without the workspace's own key for a source that asks for one. */
export class MissingSampleKeyError extends Error {
  constructor(readonly connector: LiveSampleConnector) {
    super(`a key is needed for ${connector.name}`);
    this.name = 'MissingSampleKeyError';
  }
}

/** The hosts a sample reads, to name where its data sources will connect. */
export function sampleHosts(pack: SamplePack): string[] {
  return [...new Set(liveConnectors(pack).map(c => new URL(c.baseUrl.replace('{key}', 'key')).host))];
}
