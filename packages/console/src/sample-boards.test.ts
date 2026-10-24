import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SAMPLE_PACKS, isInstallable, type LiveSampleConnector, type SamplePack } from '@iyulab/u-board-samples';
import * as api from './api-client.js';
import type { ConnectorSummary } from './api-client.js';
import { createBoardFromSample, keysToAsk, loadSamplePacks, MissingSampleKeyError, sampleHosts } from './sample-boards.js';

vi.mock('./api-client.js');

describe('the samples a workspace can start from', () => {
  it('are the ones on live sources — a board on example data has nothing to connect to', async () => {
    const offered = await loadSamplePacks();
    expect(offered.length).toBeGreaterThan(0);
    expect(offered.every(isInstallable)).toBe(true);
    expect(SAMPLE_PACKS.some(pack => !isInstallable(pack)), 'the gallery has an example-data board to leave out').toBe(true);
    expect(offered).not.toContainEqual(expect.objectContaining({ id: 'factory-floor' }));
  });

  it('each name the hosts they will connect to', async () => {
    for (const pack of await loadSamplePacks()) expect(sampleHosts(pack).length, pack.id).toBeGreaterThan(0);
  });
});

describe('a sample on a source that asks each user for a key', () => {
  // A live sample whose source publishes no key to try with — the same board, asked with the workspace's own key.
  const base = SAMPLE_PACKS.find(pack => pack.id === 'seoul-air')!;
  const source = base.connectors[0] as LiveSampleConnector;
  const { authValue: _sampleKey, ...withoutKey } = source;
  const pack: SamplePack = { ...base, connectors: [{ ...withoutKey, ownKey: { signUpUrl: 'https://data.seoul.go.kr', env: 'SEOUL_KEY' } }] };
  const mine: ConnectorSummary = { id: 'mine', name: '내 키', type: 'http', baseUrl: source.baseUrl, authType: 'path', updatedAt: 't' };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(api.createConnector).mockImplementation(async (_w, input: any) => ({ id: 'new', type: 'http', updatedAt: 't', ...input, attribution: undefined, description: undefined, sourceError: undefined }));
    vi.mocked(api.createBoard).mockResolvedValue({ id: 'b1', name: 'x', kind: 'canvas', updatedAt: 't' });
    vi.mocked(api.updateBoard).mockResolvedValue({ id: 'b1', name: 'x', updatedAt: 't', revision: 2 });
  });

  it('asks for the key until the workspace has a data source for that address', () => {
    expect(keysToAsk(pack, []).map(c => c.key)).toEqual([source.key]);
    expect(keysToAsk(pack, [mine])).toEqual([]);
    expect(keysToAsk(base, []), 'a source with a key to try needs none').toEqual([]);
  });

  it('creates the data source with the key given — and never sends where the key is issued', async () => {
    vi.mocked(api.listConnectors).mockResolvedValue({ connectors: [] });
    await createBoardFromSample('w1', pack, 'x', { [source.key]: '  own-key  ' });
    const sent = vi.mocked(api.createConnector).mock.calls[0][1];
    expect(sent).toMatchObject({ authType: 'path', authValue: 'own-key' });
    expect(sent).not.toHaveProperty('ownKey');
    expect(sent).not.toHaveProperty('key');
  });

  it('refuses without a key, creating nothing', async () => {
    vi.mocked(api.listConnectors).mockResolvedValue({ connectors: [] });
    await expect(createBoardFromSample('w1', pack, 'x', { [source.key]: ' ' })).rejects.toBeInstanceOf(MissingSampleKeyError);
    expect(api.createConnector).not.toHaveBeenCalled();
    expect(api.createConnector).not.toHaveBeenCalled();
    expect(api.createBoard).not.toHaveBeenCalled();
  });

  it('uses the data source the workspace already has, keeping its key', async () => {
    vi.mocked(api.listConnectors).mockResolvedValue({ connectors: [mine] });
    await createBoardFromSample('w1', pack, 'x');
    expect(api.createConnector).not.toHaveBeenCalled();
  });

  it('stores the board, reading the data source made for it', async () => {
    vi.mocked(api.listConnectors).mockResolvedValue({ connectors: [mine] });
    await createBoardFromSample('w1', pack, 'x');
    const { document } = vi.mocked(api.updateBoard).mock.calls[0][2] as { document: { data?: Record<string, { from: string }> } };
    expect(Object.values(document.data ?? {}).map(read => read.from)).toContain('mine');
  });

});
