import { describe, it, expect } from 'vitest';
import type { ReactElement } from 'react';
import { skinTokens, boardTheme } from './element-template';
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

  it('sets the fonts, the corner radius and the shadow', () => {
    expect(skinTokens({ font: 'serif', display: 'Georgia', mono: 'monospace', radius: 0, shadow: 'none' })).toEqual({
      '--u-widget-font-family': 'serif', '--u-widget-font-display': 'Georgia',
      '--u-widget-font-mono': 'monospace', '--u-widget-radius': '0px', '--u-widget-shadow': 'none',
    });
    expect(skinTokens({ shadow: 'hard', palette: { rule: '#222' } })['--u-widget-shadow']).toBe('3px 3px 0 #222');
    expect(skinTokens({ shadow: 'hard' })['--u-widget-shadow']).toBe('3px 3px 0 currentColor');
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

  it('is drawn as it was with no skin', () => {
    const w = widgetOf(undefined);
    expect(w.spec).toEqual({ widget: 'status' });
    expect(w.style['--u-widget-bg']).toBeUndefined();
  });
});
