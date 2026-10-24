import { describe, expect, it } from 'vitest';
import type { Adapter } from '../adapter.js';
import type { ViewDocument } from '../view-document.js';
import { pictureOf, readKeys, readerOf } from './draw.js';
import type { BoardV2 } from './types.js';

const PUMPS = [{ id: 'P1', flow: 41.5 }, { id: 'P2', flow: 0 }];

const board: BoardV2 = {
  version: 2,
  data: { pumps: { from: 'plant', path: '/plant/pumps', list: '/value', key: 'id' } },
  parts: { pump: { as: 'stat', each: 'pumps', show: 'flow' } },
  layout: { kind: 'grid', items: ['pump'] },
};

/** An adapter of the host's own, answering a list read with its items. */
const plant: Adapter = { id: 'plant', resolve: async () => ({ value: PUMPS, quality: 'live' }) };

describe('drawing a board wherever it is hosted', () => {
  it('reads the items a grid lays out a part per item of through the host’s adapters', async () => {
    expect(await readKeys(board, readerOf([plant]))).toEqual({ pumps: ['P1', 'P2'] });
    const picture = await pictureOf(board, readerOf([plant]));
    expect(picture.kind === 'grid' && picture.items.map(item => item.id)).toEqual(['pump/P1', 'pump/P2']);
  });

  it('lays out no items of a list it cannot read — an adapter the host has none of, or one that fails', async () => {
    expect(await readKeys(board, readerOf([]))).toEqual({ pumps: [] });
    const failing: Adapter = { id: 'plant', resolve: () => Promise.reject(new Error('down')) };
    expect(await readKeys(board, readerOf([failing]))).toEqual({ pumps: [] });
  });

  it('draws a first-version document as it is', async () => {
    const v1: ViewDocument = { kind: 'canvas', background: {}, nodes: [], connectors: [] };
    expect(await pictureOf(v1, readerOf([plant]))).toBe(v1);
  });
});
