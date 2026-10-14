import { describe, it, expect } from 'vitest';
import { SAMPLE_PACKS, isInstallable } from '@iyulab/u-board-samples';
import { loadSamplePacks, sampleHosts } from './sample-boards.js';

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
