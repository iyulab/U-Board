import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { SAMPLE_PACKS } from '@iyulab/u-board-samples';
import thumbs from '../src/thumbs.json';
import { packHash } from '../src/thumb-hash';

const manifest = thumbs as Record<string, { width: number; height: number; hash: string }>;

describe('gallery thumbnails', () => {
  it.each(SAMPLE_PACKS.map(pack => [pack.id, pack] as const))('%s has a picture taken from the board as it is now', (id, pack) => {
    expect(manifest[id], `no thumbnail — npm run build && npm run thumbnails (packages/site)`).toBeDefined();
    expect(existsSync(new URL(`../public/gallery/thumbs/${id}.webp`, import.meta.url))).toBe(true);
    expect(manifest[id].hash, `the board changed since its thumbnail — npm run build && npm run thumbnails (packages/site)`).toBe(packHash(pack));
  });

  it('keeps no picture of a board that is gone', () => {
    const ids = new Set(SAMPLE_PACKS.map(p => p.id));
    expect(Object.keys(manifest).filter(id => !ids.has(id))).toEqual([]);
  });
});
