/// <reference types="node" />
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

// The class names and `--ub-*` tokens are a public contract: hosts style the components through them. This package's
// README ("Styling") lists the ones only the authoring view uses; the viewer package's README lists the rest (the
// buttons, the viewer, the tokens both read). Keep the components, the default stylesheet and those lists from drifting.

const root = process.cwd();

/** The viewer package, found the way a module is: up the directory tree, in node_modules. */
function viewerPackageDir(): string {
  for (let dir = root; ; dir = dirname(dir)) {
    const candidate = join(dir, 'node_modules', '@iyulab', 'u-board');
    if (existsSync(join(candidate, 'README.md'))) return candidate;
    if (dirname(dir) === dir) throw new Error('@iyulab/u-board is not installed');
  }
}
const viewerDir = viewerPackageDir();

const stylingOf = (readme: string) => readme.match(/### Styling\n([\s\S]*?)\n## /)?.[1] ?? '';
const ownStyling = stylingOf(readFileSync(resolve(root, 'README.md'), 'utf-8'));
const viewerStyling = stylingOf(readFileSync(join(viewerDir, 'README.md'), 'utf-8'));
const stylesheet = readFileSync(resolve(root, 'styles.css'), 'utf-8');
const viewerStylesheet = readFileSync(join(viewerDir, 'styles.css'), 'utf-8');

function componentSources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return componentSources(path);
    return /\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name) ? [readFileSync(path, 'utf-8')] : [];
  });
}
const sources = componentSources(resolve(root, 'src')).join('\n');

/** Every `ub-*` class a component puts on an element — from the string literals that hold class names. */
const usedClasses = new Set(
  [...sources.matchAll(/["']([^"'\n]*)["']/g)].flatMap(m => m[1]!.split(/\s+/)).filter(name => /^ub-[a-z0-9_-]+$/.test(name)),
);

/** Rows of a README table whose first column names `ub-*` classes, modifiers given as `(--a, --b)`. */
function documentedClasses(styling: string): Set<string> {
  const names = new Set<string>();
  for (const line of styling.split('\n')) {
    const cell = line.match(/^\| (`ub-[^|]*) \|/)?.[1];
    if (!cell) continue;
    let base = '';
    for (const [, name = ''] of cell.matchAll(/`([^`]+)`/g)) {
      if (name.startsWith('ub-')) names.add((base = name));
      else if (name.startsWith('--')) names.add(base + name);
    }
  }
  return names;
}
const tokensOf = (styling: string) => new Set([...styling.matchAll(/`(--ub-[a-z0-9-]+)`/g)].map(m => m[1]!));

const viewerClasses = documentedClasses(viewerStyling);
const ownClasses = documentedClasses(ownStyling);

describe('styling contract', () => {
  it('documents every class its components use that the viewer package does not, and no other', () => {
    const own = [...usedClasses].filter(name => !viewerClasses.has(name));
    expect([...ownClasses].sort()).toEqual(own.sort());
  });

  it('styles only classes its components use', () => {
    const styled = new Set([...stylesheet.matchAll(/\.(ub-[a-z0-9_-]+)/g)].map(m => m[1]!));
    expect([...styled].filter(name => !usedClasses.has(name))).toEqual([]);
  });

  it('documents every token its stylesheet and components read, and none it does not', () => {
    const known = new Set([...tokensOf(ownStyling), ...tokensOf(viewerStyling)]);
    const read = new Set([...(stylesheet + sources).matchAll(/var\((--ub-[a-z0-9-]+)/g)].map(m => m[1]!));
    expect([...read].filter(token => !known.has(token))).toEqual([]);
    expect([...tokensOf(ownStyling)].filter(token => !read.has(token))).toEqual([]);
  });

  it('never sets a public token itself, so the host values reach every rule', () => {
    expect(stylesheet).not.toMatch(/(^|[\s;{])--ub-[a-z0-9-]+\s*:/);
  });

  it('resolves the shared tokens to the same fallbacks as the viewer stylesheet', () => {
    const fallbacks = (sheet: string) =>
      new Map([...sheet.matchAll(/^\s+(--_ub-[a-z0-9-]+):\s*(.+);$/gm)].map(m => [m[1]!, m[2]!] as const));
    const own = fallbacks(stylesheet);
    const viewer = fallbacks(viewerStylesheet);
    // Compare the first block of each (the light fallbacks): both define the same private names with the same values.
    const differing = [...own].filter(([name, value]) => viewer.has(name) && viewer.get(name) !== value).map(([name]) => name);
    expect(differing).toEqual([]);
  });

  it('ships the stylesheet as ./styles.css', () => {
    const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf-8'));
    expect(pkg.exports['./styles.css']).toBe('./styles.css');
    expect(pkg.files).toContain('styles.css');
  });
});
