import { describe, it, expect } from 'vitest';
import { markerSummary } from './marker-summary';
import { boardTheme } from './element-template';
import { THEME_PALETTE } from '../theme-colors';
import { TONES } from '../tones';

const marker = (props: Record<string, unknown> = {}) => ({ type: 'element:u-board-marker', props });
const light = boardTheme('light');

describe('markerSummary', () => {
  it('is a marker’s point: its shape and the colour of its tone in the board’s tokens', () => {
    expect(markerSummary(marker({ tone: 'alarm', shape: 'ring' }), light)).toEqual({ shape: 'ring', color: THEME_PALETTE.light.alarm });
    expect(markerSummary(marker({ tone: 'ok', shape: 'pin' }), light)).toEqual({ shape: 'pin', color: THEME_PALETTE.light.ok });
  });

  it('draws every tone in the colour the marker element draws it in', () => {
    for (const tone of TONES.filter(t => t !== 'accent')) {
      expect(markerSummary(marker({ tone }), boardTheme('dark'))?.color).toBe(THEME_PALETTE.dark[tone]);
    }
  });

  it('follows the board’s accent for the accent tone, as the element does', () => {
    expect(markerSummary(marker({ tone: 'accent' }), light)?.color).toBe(THEME_PALETTE.light.primary);
    expect(markerSummary(marker({ tone: 'accent' }), boardTheme('light', '#ff00aa'))?.color).toBe('#ff00aa');
  });

  it('is a dot, idle, for a marker with no shape and no status — as the element draws it', () => {
    expect(markerSummary(marker(), light)).toEqual({ shape: 'dot', color: THEME_PALETTE.light.idle });
    expect(markerSummary(marker({ tone: 'not-a-tone', shape: 'star' }), light)).toEqual({ shape: 'dot', color: THEME_PALETTE.light.idle });
  });

  it('rings a state that asks for attention: it blinks or has an outline', () => {
    expect(markerSummary(marker({ tone: 'alarm' }), light, { blink: true })).toMatchObject({ halo: true });
    expect(markerSummary(marker({ tone: 'alarm' }), light, { outline: 'negative' })).toMatchObject({ halo: true });
    expect(markerSummary(marker({ tone: 'alarm' }), light, {})).not.toHaveProperty('halo');
  });

  it('is a point of no colour for a part its state hides, so it leaves the page without being seen', () => {
    expect(markerSummary(marker({ tone: 'alarm' }), light, { hidden: true })).toEqual({ shape: 'dot', color: 'transparent' });
  });

  it('draws a value that is not current as an edge — dashed for stale, dotted for disconnected — apart from its tone', () => {
    // The same two border styles the part's frame uses, in the same colours (`--ub-quality-*`), so a far view says what a near one says.
    expect(markerSummary(marker({ tone: 'ok' }), light, undefined, 'stale')).toEqual({
      shape: 'dot', color: THEME_PALETTE.light.ok, edge: { dash: 'dashed', color: '#f59e0b' },
    });
    expect(markerSummary(marker({ tone: 'alarm', shape: 'pin' }), light, undefined, 'disconnected')).toEqual({
      shape: 'pin', color: THEME_PALETTE.light.alarm, edge: { dash: 'dotted', color: '#6b7280' },
    });
    // A tone does not stand for the quality and the quality does not change the tone: a stale alarm is an alarm, with an edge.
    expect(markerSummary(marker({ tone: 'alarm' }), light, { blink: true }, 'stale')).toMatchObject({ halo: true, edge: { dash: 'dashed' } });
  });

  it('has no edge for a current value, or when the quality is not known', () => {
    expect(markerSummary(marker({ tone: 'ok' }), light, undefined, 'live')).not.toHaveProperty('edge');
    expect(markerSummary(marker({ tone: 'ok' }), light, undefined, undefined)).not.toHaveProperty('edge');
  });

  it('takes the edge’s colour from the board’s tokens when the host defines them, as the frame does', () => {
    const theme = { ...light, '--ub-quality-stale': '#123456', '--ub-quality-disconnected': 'var(--u-widget-text-secondary)', '--u-widget-text-secondary': '#abcdef' };
    expect(markerSummary(marker(), theme, undefined, 'stale')?.edge?.color).toBe('#123456');
    expect(markerSummary(marker(), theme, undefined, 'disconnected')?.edge?.color).toBe('#abcdef');
  });

  it('draws no edge for a part its state hides', () => {
    expect(markerSummary(marker({ tone: 'alarm' }), light, { hidden: true }, 'stale')).toEqual({ shape: 'dot', color: 'transparent' });
  });

  it('is none for any other part — a widget, a chart, a label, an element of the board’s own, a marker drawn as a symbol', () => {
    for (const type of ['uw-status', 'chart.line', 'element:u-board-label', 'element:u-board-marker-symbol', 'element:gate']) {
      expect(markerSummary({ type, props: { tone: 'ok' } }, light)).toBeUndefined();
    }
  });
});
