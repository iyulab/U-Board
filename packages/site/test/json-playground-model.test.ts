import { describe, it, expect } from 'vitest';
import { SAMPLE_PACKS } from '@iyulab/u-board-samples';
import { readPlayground } from '../src/live/json-playground-model';
import { dataOf } from '../src/gallery';

const pack = SAMPLE_PACKS.find(p => p.id === 'seoul-air')!;
const definition = JSON.stringify(pack.board);
const data = JSON.stringify(dataOf(pack));

describe('JSON playground', () => {
  it('reads a gallery board as published', () => {
    const reading = readPlayground(definition, data);
    expect(reading.problems).toEqual([]);
    expect(reading.board).toEqual(pack.board);
    expect(reading.data?.connectors.map(c => c.key)).toEqual(pack.connectors.map(c => c.key));
  });

  it('names a text that is not JSON', () => {
    const reading = readPlayground('{ "parts": ', data);
    expect(reading.board).toBeUndefined();
    expect(reading.problems).toHaveLength(1);
    expect(reading.problems[0]).toMatchObject({ in: 'definition', path: '' });
  });

  it('points at what the definition gets wrong', () => {
    const broken = { ...pack.board, board: { theme: 'dim' } };
    const reading = readPlayground(JSON.stringify(broken), data);
    expect(reading.board).toBeUndefined();
    expect(reading.problems).toContainEqual(expect.objectContaining({ in: 'definition', path: '/board/theme' }));
  });

  it('points at what the data is missing', () => {
    const reading = readPlayground(definition, JSON.stringify({ connectors: [{ key: '' }], responses: {} }));
    expect(reading.data).toBeUndefined();
    expect(reading.problems.map(p => p.path)).toEqual(['/connectors/0/key', '/capturedAt']);
  });
});
