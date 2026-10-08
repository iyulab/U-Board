/// <reference types="node" />
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

// The class names and `--ub-*` tokens are a public contract: hosts style the components through
// them. The package README's "Styling" section lists both. Keep the components, the default
// stylesheet and that list from drifting apart.

const root = process.cwd();
const readme = readFileSync(resolve(root, 'README.md'), 'utf-8');
const styling = readme.match(/### Styling\n([\s\S]*?)\n## /)?.[1] ?? '';
const stylesheet = readFileSync(resolve(root, 'styles.css'), 'utf-8');

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
  [...sources.matchAll(/["']([^"'\n]*)["']/g)].flatMap(m => m[1].split(/\s+/)).filter(name => /^ub-[a-z0-9_-]+$/.test(name))
);

/** Rows of the README table whose first column names `ub-*` classes, modifiers given as `(--a, --b)`. */
function documentedClasses(): Set<string> {
  const names = new Set<string>();
  for (const line of styling.split('\n')) {
    const cell = line.match(/^\| (`ub-[^|]*) \|/)?.[1];
    if (!cell) continue;
    let base = '';
    for (const [, name] of cell.matchAll(/`([^`]+)`/g)) {
      if (name.startsWith('ub-')) names.add((base = name));
      else if (name.startsWith('--')) names.add(base + name);
    }
  }
  return names;
}

const documentedTokens = new Set([...styling.matchAll(/`(--ub-[a-z0-9-]+)`/g)].map(m => m[1]));

describe('styling contract', () => {
  it('documents every class the components use, and no class they do not', () => {
    expect([...documentedClasses()].sort()).toEqual([...usedClasses].sort());
  });

  it('styles only classes the components use', () => {
    const styled = new Set([...stylesheet.matchAll(/\.(ub-[a-z0-9_-]+)/g)].map(m => m[1]));
    expect([...styled].filter(name => !usedClasses.has(name))).toEqual([]);
  });

  it('documents every token the stylesheet and the components read', () => {
    const read = new Set([...(stylesheet + sources).matchAll(/var\((--ub-[a-z0-9-]+)/g)].map(m => m[1]));
    expect([...read].filter(token => !documentedTokens.has(token))).toEqual([]);
    expect([...documentedTokens].filter(token => !read.has(token))).toEqual([]);
  });

  it('never sets a public token itself, so the host values reach every rule', () => {
    expect(stylesheet).not.toMatch(/(^|[\s;{])--ub-[a-z0-9-]+\s*:/);
  });

  it('ships the stylesheet as ./styles.css', () => {
    const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf-8'));
    expect(pkg.exports['./styles.css']).toBe('./styles.css');
    expect(pkg.files).toContain('styles.css');
  });
});
