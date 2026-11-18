// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ViewFont } from '../view-document.js';
import { registerFont, useDocumentFonts } from './use-document-fonts.js';

// jsdom has no font API: a stand-in that records what the page was given.
const added: Array<{ family: string; source: string; descriptors: Record<string, string>; load: ReturnType<typeof vi.fn> }> = [];
class FakeFontFace {
  load = vi.fn(() => Promise.resolve(this));
  constructor(public family: string, public source: string, public descriptors: Record<string, string>) {}
}

beforeEach(() => {
  added.length = 0;
  vi.stubGlobal('FontFace', FakeFontFace);
  Object.defineProperty(document, 'fonts', { configurable: true, value: { add: (face: (typeof added)[number]) => added.push(face) } });
});
afterEach(() => {
  vi.unstubAllGlobals();
  Reflect.deleteProperty(document, 'fonts');
});

const inline = 'data:font/woff2;base64,d09GMgABAAAAAA==';
let n = 0;
/** A source not used by an earlier test: a font is registered once per page. */
const fresh = (family = 'Test'): ViewFont => ({ family, src: `https://fonts.example.com/${encodeURIComponent(family)}-${++n}.woff2` });

describe('registerFont', () => {
  it('hands the page a face of the family, its address, weight and style, and starts loading it', () => {
    const font = { ...fresh('Noto Sans KR'), weight: 700, style: 'italic' as const };
    expect(registerFont(font)).toBe(true);
    expect(added).toHaveLength(1);
    expect(added[0]).toMatchObject({ family: 'Noto Sans KR', source: `url(${JSON.stringify(font.src)})`, descriptors: { weight: '700', style: 'italic', display: 'swap' } });
    expect(added[0]!.load).toHaveBeenCalledOnce();
  });

  it('says 400 and normal when the font names neither', () => {
    registerFont(fresh('Plain'));
    expect(added[0]!.descriptors).toMatchObject({ weight: '400', style: 'normal' });
  });

  it('registers the same font once, however many times a board is drawn', () => {
    const font = fresh();
    registerFont(font);
    registerFont({ ...font });
    expect(added).toHaveLength(1);
  });

  it('registers another weight of a family as another face', () => {
    const font = fresh();
    registerFont(font);
    registerFont({ ...font, weight: 700 });
    expect(added).toHaveLength(2);
  });

  it('loads nothing a check would have refused — a document can reach the viewer from outside it', () => {
    for (const src of ['http://fonts.example.com/a.woff2', 'javascript:alert(1)', 'https://fonts.example.com/a.woff2")', 'data:image/png;base64,AAAA', '/fonts/a.woff2']) expect(registerFont({ family: 'A', src })).toBe(false);
    expect(added).toHaveLength(0);
  });

  it('loads no family the check would have refused — a name is one family, not a list, a quote or a rule', () => {
    for (const family of ['A, serif', 'A"; x', "A'", 'url(x)', '', 'x'.repeat(65)]) expect(registerFont({ ...fresh(), family })).toBe(false);
    expect(added).toHaveLength(0);
  });

  it('accepts an inline font', () => {
    expect(registerFont({ family: 'Inline', src: inline })).toBe(true);
    expect(added[0]!.source).toBe(`url(${JSON.stringify(inline)})`);
  });

  it('does nothing where the page has no font API', () => {
    vi.unstubAllGlobals();
    expect(registerFont(fresh())).toBe(false);
  });

  it('lets a face that cannot be fetched fail without a sound — its family falls to the rest of the stack', async () => {
    vi.stubGlobal('FontFace', class { load = () => Promise.reject(new Error('404')); });
    expect(registerFont(fresh())).toBe(true);
    await Promise.resolve();
  });
});

describe('useDocumentFonts', () => {
  it('registers the fonts of a document when it opens, and not again for the same fonts in a new array', () => {
    const font = fresh('Hook');
    const { rerender } = renderHook(({ fonts }: { fonts: ViewFont[] | undefined }) => useDocumentFonts(fonts), { initialProps: { fonts: [font] as ViewFont[] | undefined } });
    expect(added).toHaveLength(1);
    rerender({ fonts: [{ ...font }] });
    expect(added).toHaveLength(1);
  });

  it('registers what a board adds, and nothing for a board without fonts', () => {
    const first = fresh('One');
    const second = fresh('Two');
    const { rerender } = renderHook(({ fonts }: { fonts: ViewFont[] | undefined }) => useDocumentFonts(fonts), { initialProps: { fonts: undefined as ViewFont[] | undefined } });
    expect(added).toHaveLength(0);
    rerender({ fonts: [first] });
    rerender({ fonts: [first, second] });
    expect(added.map(face => face.family)).toEqual(['One', 'Two']);
    rerender({ fonts: [] });
    expect(added).toHaveLength(2);
  });
});
