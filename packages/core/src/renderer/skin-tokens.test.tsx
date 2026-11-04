import { describe, it, expect } from 'vitest';
import type { ReactElement } from 'react';
import { skinTokens, titleTokens, boardTheme } from './element-template';
import { NodeFrame } from './node-frame';
import type { ResolvedWidget } from '../adapter';

describe('the tokens a skin sets', () => {
  it('sets nothing for no skin or one that names none of them', () => {
    expect(skinTokens(undefined)).toEqual({});
    expect(skinTokens({})).toEqual({});
    expect(skinTokens({ density: 'compact', frame: 'plate' })).toEqual({});
  });

  it('maps the palette to the widgets\' background, text, secondary text and border, and a surface a little toward the ink', () => {
    expect(skinTokens({ palette: { paper: '#fff', ink: '#111', muted: '#777', rule: '#ccc' } })).toEqual({
      '--u-widget-bg': '#fff', '--u-widget-text': '#111', '--u-widget-text-secondary': '#777', '--u-widget-border': '#ccc',
      '--u-widget-surface': 'color-mix(in srgb, #111 8%, #fff)',
    });
    // ground is text on the board's background, not a widget token; a surface needs both paper and ink
    expect(skinTokens({ palette: { ground: '#000', paper: '#fff' } })).toEqual({ '--u-widget-bg': '#fff' });
  });

  it('sets the scale and the weight of the big figures', () => {
    expect(skinTokens({ numerals: { scale: 'large', weight: 300 } })).toEqual({ '--u-widget-figure-scale': '1.25', '--u-widget-figure-weight': '300' });
    expect(skinTokens({ numerals: { scale: 'small' } })).toEqual({ '--u-widget-figure-scale': '0.75' });
    expect(skinTokens({ numerals: { weight: 200 } })).toEqual({ '--u-widget-figure-weight': '200' });
    // regular is the figure as it is drawn; a word the board language does not have is no scale, and a weight outside 100–900 is no weight
    expect(skinTokens({ numerals: { scale: 'regular' } })).toEqual({ '--u-widget-figure-scale': '1' });
    expect(skinTokens({ numerals: { scale: 'toString' as never, weight: 1000 } })).toEqual({});
    expect(skinTokens({ numerals: {} })).toEqual({});
  });

  it('sets the fonts, the corner radius and the shadow', () => {
    expect(skinTokens({ font: 'serif', display: 'Georgia', mono: 'monospace', radius: 0, shadow: 'none' })).toEqual({
      '--u-widget-font-family': 'serif', '--u-widget-font-display': 'Georgia',
      '--u-widget-font-mono': 'monospace', '--u-widget-radius': '0px', '--u-widget-shadow': 'none',
    });
    expect(skinTokens({ shadow: 'hard', palette: { rule: '#222' } })['--u-widget-shadow']).toBe('3px 3px 0 #222');
    expect(skinTokens({ shadow: 'hard' })['--u-widget-shadow']).toBe('3px 3px 0 currentColor');
    // The title above a widget: plain draws none of the tokens; a band is a strip in the ink and the paper's colour, a tab a strip that fits its words.
    expect(Object.keys(skinTokens({ titles: 'plain' })).filter(k => k.includes('title'))).toEqual([]);
    expect(skinTokens({ titles: 'band' })).toMatchObject({ '--u-widget-title-bg': 'var(--u-widget-text)', '--u-widget-title-ink': 'var(--u-widget-bg)', '--u-widget-title-pad': '3px 10px' });
    expect(titleTokens('band', true)).toMatchObject({ '--u-widget-title-radius': 'initial', '--u-widget-title-display': 'initial', '--u-widget-title-width': 'initial' });
    expect(skinTokens({ titles: 'tab' })).toMatchObject({ '--u-widget-title-display': 'inline-block', '--u-widget-title-width': 'max-content', '--u-widget-title-radius': '6px 6px 0 0' });
  });

  it('leaves out what is not a colour, a font or a radius — a document need not have been validated', () => {
    // `url(…)` as a background would load an image the board's media origins never allowed
    expect(skinTokens({ palette: { paper: 'url(https://example.test/p.gif)', ink: 'var(--x)', muted: 'none', rule: 'red;background:url(x)' } })).toEqual({});
    expect(skinTokens({ font: 'x;y', display: 'url(https://example.test/f.woff)', mono: '{}', radius: -2 })).toEqual({});
    expect(skinTokens({ radius: Number.NaN })).toEqual({});
    // a surface is mixed from a paper and an ink that both held
    expect(skinTokens({ palette: { paper: '#fff', ink: 'url(x)' } })).toEqual({ '--u-widget-bg': '#fff' });
    expect(skinTokens({ shadow: 'hard', palette: { rule: 'url(x)' } })['--u-widget-shadow']).toBe('3px 3px 0 currentColor');
  });

  it('reaches an element\'s theme after the theme\'s and the accent\'s', () => {
    const theme = boardTheme('light', '#0a0', { palette: { paper: '#eee' } });
    expect(theme['--u-widget-bg']).toBe('#eee');
    expect(theme['--u-widget-primary']).toBe('#0a0');
    expect(theme['--u-widget-text']).toBe('#1a1a2e'); // untouched
  });
});

describe('a widget drawn in a skin', () => {
  const widget: ResolvedWidget = { type: 'status', props: {}, quality: { 'data.value': 'live' } };
  const widgetOf = (skin: Parameters<typeof NodeFrame>[0]['skin'], props: Record<string, unknown> = {}) => {
    const el = NodeFrame({ widget: { ...widget, props }, now: 0, skin }) as ReactElement<Record<string, any>>;
    const children = Array.isArray(el.props.children) ? el.props.children : [el.props.children];
    return (children as ReactElement<Record<string, any>>[]).find(c => c?.props?.spec)!.props;
  };

  it('gets the skin\'s tokens on its host and its frame as an option', () => {
    const w = widgetOf({ frame: 'plate', palette: { paper: '#fff' } });
    expect(w.style['--u-widget-bg']).toBe('#fff');
    expect(w.spec).toMatchObject({ widget: 'status', options: { frame: 'plate' } });
  });

  it('keeps a frame the widget names itself', () => {
    expect(widgetOf({ frame: 'plate' }, { options: { frame: 'tape', dense: true } }).spec.options).toEqual({ frame: 'tape', dense: true });
  });

  it("takes the title style a part names for itself over the skin's, and keeps it out of the widget's options", () => {
    const tab = widgetOf({ titles: 'band' }, { options: { titles: 'tab', frame: 'block' } });
    expect(tab.style).toMatchObject({ '--u-widget-title-display': 'inline-block', '--u-widget-title-radius': '6px 6px 0 0', '--u-widget-title-pad': '2px 14px' });
    expect(tab.spec.options).toEqual({ frame: 'block' });
    // a plain title under a skin that bands them sets each token back to the widget's own
    const plain = widgetOf({ titles: 'band' }, { options: { titles: 'plain' } });
    for (const key of ['bg', 'ink', 'pad', 'radius', 'display', 'width']) expect(plain.style[`--u-widget-title-${key}`], key).toBe('initial');
    expect(plain.spec.options).toEqual({});
    // a part that names none follows the skin
    expect(widgetOf({ titles: 'band' }, { options: { compact: true } }).style['--u-widget-title-pad']).toBe('3px 10px');
  });

  it('is drawn as it was with no skin', () => {
    const w = widgetOf(undefined);
    expect(w.spec).toEqual({ widget: 'status' });
    expect(w.style['--u-widget-bg']).toBeUndefined();
  });
});
