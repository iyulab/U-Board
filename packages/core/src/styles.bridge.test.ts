/// <reference types="node" />
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { THEME_PALETTE } from './theme-colors';

// The default stylesheet lends a host's identity to the widgets of a board (brand colour, typeface, corner radius).
// Each value falls back to the widget library's own default for the board's theme, so a host that defines none sees
// no change — these fallbacks are what keeps that true, and they are copies: pin them to the palette the renderer
// already mirrors.

const sheet = readFileSync(resolve(process.cwd(), 'styles.css'), 'utf-8');

/** The declarations of the rule whose selector holds `selector`. */
function rule(selector: string): string {
  const at = sheet.indexOf(selector);
  expect(at, selector).toBeGreaterThan(-1);
  return sheet.slice(sheet.indexOf('{', at) + 1, sheet.indexOf('}', at));
}

describe('the stylesheet’s bridge to the widgets', () => {
  for (const theme of ['light', 'dark'] as const) {
    it(`falls back to the ${theme} palette's primary colour, for the widget and for the first chart colour`, () => {
      const body = rule(`:where(u-widget[theme='${theme}']) {`);
      const primary = THEME_PALETTE[theme].primary;
      expect(body).toContain(`--u-widget-primary: var(--ub-brand-solid, ${primary});`);
      expect(body).toContain(`--u-widget-chart-color-1: var(--ub-brand-solid, ${primary});`);
      expect(body).toContain('--u-widget-on-primary: var(--ub-text-inverse, ');
    });
  }

  it('names the host tokens the README lists, and no other', () => {
    const bridged = new Set(
      [...sheet.slice(sheet.indexOf(":where(u-widget[theme='light'])")).matchAll(/var\((--ub-[a-z-]+)/g)].map(m => m[1])
    );
    expect([...bridged].sort()).toEqual(['--ub-brand-solid', '--ub-font-sans', '--ub-radius-md', '--ub-text-inverse']);
  });

  it('applies to a widget of a board that has a theme, with no specificity of its own', () => {
    const tail = sheet.slice(sheet.indexOf(":where(u-widget[theme='light'])"), sheet.indexOf('@media print'));
    const selectors = [...tail.matchAll(/^([^{\n]+)\{/gm)].map(m => m[1].trim());
    expect(selectors.length).toBe(3);
    for (const selector of selectors) expect(selector.startsWith(':where(')).toBe(true);
  });
});
