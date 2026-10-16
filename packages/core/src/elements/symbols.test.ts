import { describe, it, expect } from 'vitest';
import { symbolReferences, symbolsUsed, symbolSheet } from './symbols';

const symbols = {
  pump: { viewBox: '0 0 24 24', markup: '<circle cx="12" cy="12" r="10"/><use href="#impeller"/>' },
  impeller: { markup: '<path d="M12 4v16"/>' },
  valve: { markup: '<path d="M0 0L24 24"/>' },
};

describe('symbols', () => {
  it('reads the ids markup places, by href or xlink:href, in either quote', () => {
    expect(symbolReferences(`<use href="#pump"/><use xlink:href='#valve'/><use href="#pump"/><a href="https://x">`)).toEqual(['pump', 'valve']);
  });

  it('takes the symbols markup uses and those they use, each once — and nothing it does not', () => {
    expect(symbolsUsed('<svg><use href="#pump"/></svg>', symbols)).toEqual(['pump', 'impeller']);
    expect(symbolsUsed('<svg><use href="#missing"/></svg>', symbols)).toEqual([]);
    expect(symbolsUsed('<svg><use href="#pump"/></svg>', undefined)).toEqual([]);
  });

  it('defines them in one hidden SVG, with a viewBox only where it is four numbers', () => {
    const sheet = symbolSheet(['pump', 'impeller'], { ...symbols, impeller: { viewBox: 'auto', markup: '<path/>' } });
    expect(sheet).toContain('<symbol id="pump" viewBox="0 0 24 24">');
    expect(sheet).toContain('<symbol id="impeller"><path/></symbol>');
    expect(sheet).toMatch(/^<svg [^>]*aria-hidden="true"/);
  });
});
