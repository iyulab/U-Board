import { describe, expect, it } from 'vitest';
import { skinBackground, skinStyleImages } from './background-skin.js';

const svg = (inner: string) => `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10">${inner}</svg>`;
const uri = (text: string) => `data:image/svg+xml,${encodeURIComponent(text)}`;
const text = (src: string) => decodeURIComponent(src.slice('data:image/svg+xml,'.length));
const picture = uri(svg('<rect fill="var(--u-widget-bg, #f6f4ef)"/><path style="stroke:var(--u-widget-border,#d9d6cf)"/><text fill="#111">x</text>'));

describe('skinBackground', () => {
  it('writes the skin’s values in for the tokens the picture names, and leaves every other colour as it is', () => {
    const out = text(skinBackground(picture, { palette: { paper: '#102030', rule: 'rgb(1 2 3)' } }));
    expect(out).toContain('<rect fill="#102030"/>');
    expect(out).toContain('stroke:rgb(1 2 3)');
    expect(out).toContain('<text fill="#111">x</text>');
  });

  it('reads a picture whose encoder escaped the parentheses', () => {
    const escaped = `data:image/svg+xml,${encodeURIComponent(svg('<rect fill="var(--u-widget-bg, #f6f4ef)"/>')).replace(/\(/g, '%28').replace(/\)/g, '%29')}`;
    expect(escaped).toContain('var%28');
    expect(text(skinBackground(escaped, { palette: { paper: '#102030' } }))).toContain('<rect fill="#102030"/>');
  });

  it('reads a fallback that is itself a colour function', () => {
    const rgba = uri(svg('<rect fill="var(--u-widget-bg, rgba(246, 244, 239, .9))"/><rect fill="var(--u-widget-border, hsl(0 0% 50%))"/>'));
    const out = text(skinBackground(rgba, { palette: { paper: '#102030' } }));
    expect(out).toContain('<rect fill="#102030"/>');
    // the token the skin does not name keeps its own fallback whole
    expect(out).toContain('fill="var(--u-widget-border, hsl(0 0% 50%))"');
  });

  it('keeps the colour the picture has by itself where the skin names no such token', () => {
    const out = skinBackground(picture, { palette: { paper: '#102030' } });
    expect(text(out)).toContain('stroke:var(--u-widget-border,#d9d6cf)');
  });

  it('is the address it was given when there is no skin, nothing to write, or nothing asks', () => {
    expect(skinBackground(picture, undefined)).toBe(picture);
    expect(skinBackground(picture, {})).toBe(picture);
    expect(skinBackground(picture, { frame: 'flat' })).toBe(picture);
    const plain = uri(svg('<rect fill="#fff"/>'));
    expect(skinBackground(plain, { palette: { paper: '#000' } })).toBe(plain);
    expect(skinBackground('https://example.test/plan.svg', { palette: { paper: '#000' } })).toBe('https://example.test/plan.svg');
    expect(skinBackground('data:image/png;base64,AAAA', { palette: { paper: '#000' } })).toBe('data:image/png;base64,AAAA');
  });

  it('reads a base64 picture too, and never breaks the markup it writes into', () => {
    const b64 = `data:image/svg+xml;base64,${btoa(svg('<text style="font-family:var(--u-widget-font-family, serif)" fill="var(--u-widget-text,#000)">x</text>'))}`;
    const out = text(skinBackground(b64, { font: '"Noto Sans KR", sans-serif', palette: { ink: '#abc' } }));
    expect(out).toContain('font-family:&quot;Noto Sans KR&quot;, sans-serif');
    expect(out).toContain('fill="#abc"');
    expect(new DOMParser().parseFromString(out, 'image/svg+xml').querySelector('parsererror')).toBeNull();
  });

  it('leaves a picture it cannot decode as it is', () => {
    const broken = 'data:image/svg+xml,%E0%A4%A var(--u-widget-bg, #fff)';
    expect(skinBackground(broken, { palette: { paper: '#000' } })).toBe(broken);
  });
});

describe('skinStyleImages', () => {
  const bike = svg('<path fill="var(--u-widget-text, #1c1b19)" stroke="var(--u-widget-border,#d9d6cf)"/><circle fill="#abc"/>');
  const css = (quote: string, src = uri(bike)) => `.bk{background-image:url(${quote}${src}${quote});background-size:20px 16px}.x{color:red}`;
  const pictureOf = (sheet: string) => { const m = /url\("data:image\/svg\+xml,([^"]*)"\)|url\('data:image\/svg\+xml,([^']*)'\)/.exec(sheet)!; return decodeURIComponent(m[1] ?? m[2]!); };

  it('writes the skin’s values into the pictures a stylesheet carries, in either quote, and leaves the rest of it alone', () => {
    for (const quote of ['"', "'"]) {
      const out = skinStyleImages(css(quote), { palette: { ink: '#102030' } });
      expect(out.startsWith(`.bk{background-image:url(${quote}data:image/svg+xml,`)).toBe(true);
      expect(out.endsWith(`${quote});background-size:20px 16px}.x{color:red}`)).toBe(true);
      const drawn = pictureOf(out);
      expect(drawn).toContain('fill="#102030"');
      // a token the skin does not name keeps its own fallback; a literal is not touched
      expect(drawn).toContain('stroke="var(--u-widget-border,#d9d6cf)"');
      expect(drawn).toContain('<circle fill="#abc"/>');
    }
  });

  it('never ends a single-quoted address early', () => {
    // an address in single quotes has its own ' written %27 — and encoding the picture again must not turn it back into a bare one
    const quoted = uri(svg("<text font-family=\"var(--u-widget-font-family, serif)\" fill=\"var(--u-widget-text,#000)\">it's</text>")).replace(/'/g, '%27');
    const out = skinStyleImages(css("'", quoted), { palette: { ink: '#abc' } });
    expect(out).toMatch(/^\.bk\{background-image:url\('data:image\/svg\+xml,[^']*'\);background-size:20px 16px\}/);
    expect(pictureOf(out)).toContain("it's");
  });

  it('is the stylesheet it was given when there is no skin, nothing to write, or nothing asks', () => {
    expect(skinStyleImages(css('"'), undefined)).toBe(css('"'));
    expect(skinStyleImages(css('"'), {})).toBe(css('"'));
    expect(skinStyleImages(css('"'), { palette: { paper: '#000' } })).toBe(css('"'));
    const plain = `.a{background:url("https://example.test/a.svg")}.b{background:url("${uri(svg('<rect fill="#fff"/>'))}")}`;
    expect(skinStyleImages(plain, { palette: { ink: '#000' } })).toBe(plain);
  });

  it('writes only a validated colour, XML-escaped, into the picture', () => {
    const out = pictureOf(skinStyleImages(css('"'), { palette: { ink: 'red" onload="x' } }));
    expect(out).toContain('fill="var(--u-widget-text, #1c1b19)"');
  });
});
