import { describe, expect, it } from 'vitest';
import type { Adapter } from '../adapter.js';
import { drawBoard, pictureOf, readKeys, readerOf } from './draw.js';
import type { Board } from './types.js';

const PUMPS = [{ id: 'P1', flow: 41.5 }, { id: 'P2', flow: 0 }];

const board: Board = {
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

});

describe('drawing a board that reads variables', () => {
  const variable = {
    ...board,
    variables: { line: { options: ['L1', 'L2'], default: 'L1' }, pump: { options: { from: 'pumps', key: 'id' }, default: 'first' } },
    data: { pumps: { ...board.data!.pumps, where: { line: { variable: 'line' } } } },
    parts: {
      rows: { as: 'list', of: 'pumps', show: ['id'] },
      one: { as: 'status-card', of: 'pumps[$pump]', show: ['state'], title: 'Pump {{$pump}} on {{$line}}' },
    },
    layout: { kind: 'grid', items: ['rows', 'one'] },
  } as unknown as Board;
  const text = (picture: unknown) => JSON.stringify(picture);

  it('draws the values asked for when they are options, and says what each variable took', async () => {
    const drawn = await drawBoard(variable, readerOf([plant]), { variables: { line: 'L2', pump: 'P2' } });
    expect(drawn.variables).toEqual({ values: { line: 'L2', pump: 'P2' }, unknown: [] });
    expect(text(drawn.picture)).toContain('"where":{"line":"L2"}');
    expect(text(drawn.picture)).toContain('Pump P2 on L2');
  });

  it('takes the default for a value that is not an option and names the variable it was asked of', async () => {
    const drawn = await drawBoard(variable, readerOf([plant]), { variables: { line: 'L9', pump: 'P7', stray: 'x' } });
    expect(drawn.variables).toEqual({ values: { line: 'L1', pump: 'P1' }, unknown: ['line', 'pump'] });
    expect(text(drawn.picture)).toContain('Pump P1 on L1');
    expect(text(drawn.picture)).not.toContain('L9');
  });

  it('draws the one picture for the one set of values — what a share route builds all three of its answers from', async () => {
    const asked = { variables: { line: 'L2' } };
    const a = await pictureOf(variable, readerOf([plant]), asked);
    const b = (await drawBoard(variable, readerOf([plant]), asked)).picture;
    expect(text(a)).toBe(text(b));
  });

  it('draws a board with no variables as it did, whatever values are asked', async () => {
    const plain = await pictureOf(board, readerOf([plant]));
    expect(text(await pictureOf(board, readerOf([plant]), { variables: { line: 'L2' } }))).toBe(text(plain));
    expect((await drawBoard(board, readerOf([plant]), { variables: { line: 'L2' } })).variables).toEqual({ values: {}, unknown: [] });
  });
});
