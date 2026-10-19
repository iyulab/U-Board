import { describe, it, expect } from 'vitest';
import type { GridView } from '../view-document';
import { newSymbolName, removeSymbol, renameSymbol, symbolIssues, symbolNameProblem, symbolUses } from './symbol-editing';

const doc: GridView = {
  kind: 'grid',
  items: [],
  symbols: {
    pump: { viewBox: '0 0 24 24', markup: '<circle r="10"/><use href="#blade"/>' },
    blade: { markup: '<path d="M0 0"/>' },
    'state-run': { markup: '<circle r="5"/>' },
  },
  elements: {
    unit: { render: 'template', template: `<svg><use href="#pump"/><use xlink:href='#pump'/><use href="#state-{{state}}"/></svg>` },
    chart: { render: 'script', script: 'href="#pump"' },
  },
};

describe('symbol editing', () => {
  it('counts the templates and symbols that place each symbol by name — not by a value, not a script', () => {
    expect(Object.fromEntries(symbolUses(doc))).toEqual({ pump: 1, blade: 1, 'state-run': 0 });
  });

  it('names a new symbol, and says why a name cannot be taken', () => {
    expect(newSymbolName(doc)).toBe('symbol-1');
    expect(symbolNameProblem(doc, 'Pump')).toBe('invalid');
    expect(symbolNameProblem(doc, 'blade', 'pump')).toBe('taken');
    expect(symbolNameProblem(doc, 'pump', 'pump')).toBeUndefined();
  });

  it('renames a symbol and every use of it by name, in either attribute and quote', () => {
    const renamed = renameSymbol(doc, 'pump', 'motor');
    expect(Object.keys(renamed.symbols!)).toEqual(['motor', 'blade', 'state-run']);
    expect(renamed.elements!.unit.template).toBe(`<svg><use href="#motor"/><use xlink:href='#motor'/><use href="#state-{{state}}"/></svg>`);
    expect(renameSymbol(doc, 'blade', 'edge').symbols!.pump.markup).toBe('<circle r="10"/><use href="#edge"/>');
    expect(renameSymbol(doc, 'pump', 'blade')).toBe(doc);
  });

  it('removes only a symbol nothing places by name, and the record with its last symbol', () => {
    expect(removeSymbol(doc, 'pump')).toBe(doc);
    expect(Object.keys(removeSymbol(doc, 'state-run').symbols!)).toEqual(['pump', 'blade']);
    expect(removeSymbol({ kind: 'grid', items: [], symbols: { a: { markup: '<path/>' } } }, 'a')).not.toHaveProperty('symbols');
  });

  it('says what is wrong with a symbol at paths below it', () => {
    expect(symbolIssues(doc, 'blade', { viewBox: 'auto', markup: '<path d="{{d}}"/>' }).map(i => i.path)).toEqual(['/viewBox', '/markup']);
  });
});
