/// <reference types="node" />
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// A board printed or saved as PDF is the screen it is drawn on: colours print, nothing moves, the screen-only controls are left out.

const sheet = readFileSync(resolve(process.cwd(), 'styles.css'), 'utf-8');
const print = sheet.slice(sheet.indexOf('@media print'));

describe('the stylesheet’s print rules', () => {
  it('prints the board’s colours', () => {
    expect(print).toMatch(/\.ub-viewer\s*{[^}]*print-color-adjust: exact/);
  });

  it('leaves out the zoom controls and keeps the line of when the board was last updated', () => {
    expect(print).toMatch(/\.ub-viewer \.ub-view-controls\s*{\s*display: none !important/);
    expect(print).not.toContain('ub-freshness');
  });

  it('stops a blinking state where it is drawn on', () => {
    expect(print).toMatch(/\.ub-state-blink,\s*\.ub-state-blink--ring\s*{\s*animation: none/);
  });
});
