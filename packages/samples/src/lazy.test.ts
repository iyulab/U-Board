import { describe, it, expect } from 'vitest';
import { SAMPLE_PACKS } from './index.js';
import { SAMPLE_PACK_IDS, loadSamplePack } from './lazy.js';

describe('loading a pack on its own', () => {
  it('offers every pack the index holds, in the same order', () => {
    expect(SAMPLE_PACK_IDS).toEqual(SAMPLE_PACKS.map(pack => pack.id));
  });

  it('loads the very pack the index holds under each id', async () => {
    for (const pack of SAMPLE_PACKS) expect(await loadSamplePack(pack.id), pack.id).toBe(pack);
  });

  it('loads nothing for an id no pack has', async () => {
    expect(await loadSamplePack('no-such-pack')).toBeUndefined();
  });
});
