import type { ViewDocument } from '@iyulab/u-board';
import type { SamplePack } from '@iyulab/u-board-samples';
import { createBoard, createConnector, listConnectors, updateBoard, type ConnectorSummary } from './api-client.js';

/** The samples, loaded when they are first offered — they carry drawings and recordings the rest of the
 *  console never needs. */
export async function loadSamplePacks(): Promise<readonly SamplePack[]> {
  return (await import('@iyulab/u-board-samples')).SAMPLE_PACKS;
}

/** A data source this workspace already has for a sample's connector: the same address, asked the same way.
 *  Its stored key may be the owner's own rather than the sample's — reusing it keeps that. */
function existingFor(connectors: readonly ConnectorSummary[], sample: SamplePack['connectors'][number]): ConnectorSummary | undefined {
  return connectors.find(
    c => c.baseUrl === sample.baseUrl && c.authType === sample.authType && (sample.authType !== 'query' || c.authParamName === sample.authParamName)
  );
}

/**
 * Creates a board from `pack` in the workspace: its data sources (or the workspace's existing ones for the
 * same address), then the board with its bindings pointed at them. Returns the new board's id.
 */
export async function createBoardFromSample(workspaceId: string, pack: SamplePack, name: string): Promise<string> {
  const { connectors } = await listConnectors(workspaceId);
  const ids = new Map<string, string>();
  for (const sample of pack.connectors) {
    const existing = existingFor(connectors, sample);
    if (existing) {
      ids.set(sample.key, existing.id);
      continue;
    }
    const { key: _key, ...settings } = sample;
    ids.set(sample.key, (await createConnector(workspaceId, settings)).id);
  }
  const document: ViewDocument = structuredClone(pack.document);
  for (const node of document.nodes) {
    for (const binding of Object.values(node.widget.bindings ?? {})) binding.adapter = ids.get(binding.adapter) ?? binding.adapter;
  }
  const board = await createBoard(workspaceId, name);
  await updateBoard(workspaceId, board.id, { document });
  return board.id;
}

/** The hosts a sample reads, to name where its data sources will connect. */
export function sampleHosts(pack: SamplePack): string[] {
  return [...new Set(pack.connectors.map(c => new URL(c.baseUrl.replace('{key}', 'key')).host))];
}
