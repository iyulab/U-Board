import { describe, expect, it } from 'vitest';
import { expandVariables, isFree, isListed, isValueOfKind, variableValues, variablesOf } from './variables.js';
import type { Variable } from './types.js';

const declared: Record<string, Variable> = {
  line: { options: ['L1', 'L2', 'L3'], default: 'L2' },
  pump: { options: { from: 'pumps', key: 'id' }, default: 'first' },
  site: { options: { from: 'pumps', key: 'id' }, default: 'P2' },
};

describe('the value a variable takes', () => {
  it('is the one asked for when it is an option, else the default, else the first option', () => {
    expect(variableValues({ line: declared.line! }, { line: 'L3' })).toEqual({ line: 'L3' });
    expect(variableValues({ line: declared.line! }, { line: 'L9' })).toEqual({ line: 'L2' });
    expect(variableValues({ line: declared.line! })).toEqual({ line: 'L2' });
    expect(variableValues({ line: { options: ['a', 'b'] } })).toEqual({ line: 'a' });
    // an option the board does not list is not an option, whatever the default says
    expect(variableValues({ line: { options: ['a', 'b'], default: 'z' } })).toEqual({ line: 'a' });
  });

  it('is a key the data has when its options are read from it — the first key without a default that is one', () => {
    const keysOf = (d: string) => (d === 'pumps' ? ['P1', 'P2', 'P3'] : []);
    expect(variableValues(declared, { pump: 'P3', site: 'P9' }, keysOf)).toMatchObject({ pump: 'P3', site: 'P2' });
    expect(variableValues(declared, {}, keysOf)).toMatchObject({ pump: 'P1', site: 'P2' });
    expect(variableValues(declared, { pump: 'P9' }, keysOf).pump).toBe('P1');
  });

  it('is the default as written when the keys are not known — a board being checked, a data not read', () => {
    expect(variableValues(declared)).toMatchObject({ pump: 'first', site: 'P2' });
    expect(variableValues(declared, { pump: 'P3' }, () => [])).toMatchObject({ pump: 'first' });
  });
});

describe('a board with its variables written out', () => {
  const board = {
    variables: declared,
    elements: { tile: { template: '<b>{{$line}}</b>' } },
    data: { rows: { from: 'plant', path: '/plant/{{$line}}', where: { line: { variable: 'line' }, kind: 'pump' } } },
    parts: { a: { as: 'status-card', of: 'pumps[$pump]', title: 'Line {{ $line }}' } },
    layout: { kind: 'grid', items: ['a'] },
  };

  it('has each reference replaced by the value — a where, an item, a text, a path', () => {
    const out = expandVariables(board, { line: 'L3', pump: 'P7', site: 'P2' }) as typeof board;
    expect(out.data.rows.where).toEqual({ line: 'L3', kind: 'pump' });
    expect(out.data.rows.path).toBe('/plant/L3');
    expect(out.parts.a).toEqual({ as: 'status-card', of: 'pumps[P7]', title: 'Line L3' });
  });

  it('keeps the declarations and the markup of an element as they are, and leaves a name it was not given alone', () => {
    const out = expandVariables(board, { line: 'L3' }) as typeof board;
    expect(out.variables).toBe(board.variables);
    expect(out.elements).toBe(board.elements);
    expect(out.parts.a.of).toBe('pumps[$pump]');
  });

  it('is the board itself when it declares no variable', () => {
    const plain = { data: {}, parts: { a: { as: 'header', title: '{{$line}}' } }, layout: { kind: 'grid', items: ['a'] } };
    expect(expandVariables(plain, { line: 'L1' })).toBe(plain);
  });
});

describe('what is a variable', () => {
  it('reads the declared ones and says which list their options', () => {
    expect(Object.keys(variablesOf({ variables: { a: { options: ['x'] }, b: 'nope' } }))).toEqual(['a']);
    expect(variablesOf({ variables: 'x' })).toEqual({});
    expect(variablesOf(undefined)).toEqual({});
    expect(isListed(declared.line!)).toBe(true);
    expect(isListed(declared.pump!)).toBe(false);
  });

describe('a variable of a kind — a value no list names', () => {
  it('knows a value of each kind', () => {
    expect(['0', '12', '-3.5', '10.25'].every(v => isValueOfKind('number', v))).toBe(true);
    expect(['', '1e3', '01', '1.', '.5', 'x', '1,5'].some(v => isValueOfKind('number', v))).toBe(false);
    expect(['2026-11-03', '2024-02-29'].every(v => isValueOfKind('date', v))).toBe(true);
    expect(['2026-02-29', '2026-13-01', '2026-11-3', '20261103', '2026-11-03T09:00'].some(v => isValueOfKind('date', v))).toBe(false);
    expect(['2026-11-03T09:30', '2026-11-03T09:30:15Z', '2026-11-03T09:30:15.250+09:00'].every(v => isValueOfKind('datetime', v))).toBe(true);
    expect(['2026-11-03', '2026-11-03T24:00', '2026-02-30T09:00', '2026-11-03 09:30', 'now'].some(v => isValueOfKind('datetime', v))).toBe(false);
    expect(['', 'anything at all', '2026-11-03'].every(v => isValueOfKind('text', v))).toBe(true);
  });

  it('takes the value asked for when it is of its kind, else its default, else nothing', () => {
    const day: Variable = { kind: 'date', default: '2026-11-01' };
    expect(isFree(day)).toBe(true);
    expect(isFree({ options: ['a'] })).toBe(false);
    expect(variableValues({ day }, { day: '2026-12-25' })).toEqual({ day: '2026-12-25' });
    expect(variableValues({ day }, { day: 'tomorrow' })).toEqual({ day: '2026-11-01' });
    expect(variableValues({ day })).toEqual({ day: '2026-11-01' });
    expect(variableValues({ day: { kind: 'date', default: 'soon' } })).toEqual({ day: '' });
    expect(variableValues({ word: { kind: 'text', default: 'all' } }, { word: 'North wing' })).toEqual({ word: 'North wing' });
  });

  it('is written out in a where and a text like any other', () => {
    const board = {
      variables: { day: { kind: 'date', default: '2026-11-01' } },
      data: { rows: { from: 'plant', path: '/x', where: { day: { variable: 'day' } } } },
      parts: { c: { title: 'On {{$day}}' } },
    };
    const out = expandVariables(board, { day: '2026-12-25' }) as typeof board & { data: { rows: { where: unknown } } };
    expect(out.data.rows.where).toEqual({ day: '2026-12-25' });
    expect(out.parts.c.title).toBe('On 2026-12-25');
  });
});
});
