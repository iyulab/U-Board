/// <reference types="node" />
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// The default stylesheet's own fallback colors — what a host that defines no tokens gets — must read:
// text at WCAG AA (4.5:1) against what it sits on, in the light set and in the dark one.

const sheet = readFileSync(resolve(process.cwd(), 'styles.css'), 'utf-8');

/** `--_ub-name: var(--ub-…, #hex)` declarations of the first rule whose selector matches `selector`. */
function fallbacks(selector: RegExp): Record<string, string> {
  const start = sheet.search(selector);
  expect(start, `no rule matching ${selector}`).toBeGreaterThanOrEqual(0);
  const body = sheet.slice(sheet.indexOf('{', start) + 1, sheet.indexOf('}', start));
  return Object.fromEntries([...body.matchAll(/--_ub-([a-z-]+):\s*var\(--ub-[a-z0-9-]+,\s*(#[0-9a-f]{6})\)/gi)].map(m => [m[1], m[2]]));
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const light = fallbacks(/^\.ub-authoring,\s*\n\.ub-viewer\s*\{/m);
const dark = { ...light, ...fallbacks(/^:root\[data-theme='dark'\]/m) };

const PAIRS: [string, string][] = [
  ['text-strong', 'surface'],
  ['text', 'surface'],
  ['text-muted', 'surface'],
  ['text', 'subtle'],
  ['error', 'surface'],
  ['warning', 'warning-bg'],
  ['accent-text', 'accent'],
];

describe.each([
  ['light', light],
  ['dark', dark],
])('default stylesheet — %s fallbacks', (_, colors) => {
  it.each(PAIRS)('%s on %s reaches 4.5:1', (fg, bg) => {
    expect(colors[fg], fg).toBeDefined();
    expect(colors[bg], bg).toBeDefined();
    expect(contrast(colors[fg], colors[bg])).toBeGreaterThanOrEqual(4.5);
  });
});

describe('default stylesheet — dark set', () => {
  it('is declared the same for a page that declares dark and for a dark system', () => {
    const media = sheet.slice(sheet.indexOf('@media (prefers-color-scheme: dark)'));
    const fromMedia = Object.fromEntries([...media.matchAll(/--_ub-([a-z-]+):\s*var\(--ub-[a-z0-9-]+,\s*([^)]+\)?)\)/gi)].map(m => [m[1], m[2]]));
    const declared = sheet.slice(sheet.search(/^:root\[data-theme='dark'\]/m), sheet.indexOf('@media (prefers-color-scheme: dark)'));
    const fromDeclared = Object.fromEntries([...declared.matchAll(/--_ub-([a-z-]+):\s*var\(--ub-[a-z0-9-]+,\s*([^)]+\)?)\)/gi)].map(m => [m[1], m[2]]));
    expect(fromMedia).toEqual(fromDeclared);
  });
});
