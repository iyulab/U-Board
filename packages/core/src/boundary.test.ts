/// <reference types="node" />
import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

// This package is the board language and the renderer, under its own license. The authoring tool and the check an
// assistant reads live in packages that depend on this one — never the other way. The package boundary already keeps
// a relative import from crossing it; this keeps a dependency on one of those packages from being added by name, and
// keeps the declared dependencies the whole of what the shipped entries reach.
const root = process.cwd();
const manifest = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')) as {
  exports: Record<string, string | { import?: string }>;
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

const isTest = (file: string) => /\.(test|spec)\.tsx?$/.test(file);

function sourcesIn(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = resolve(dir, entry.name);
    if (entry.isDirectory()) return sourcesIn(path);
    return /\.tsx?$/.test(entry.name) && !isTest(entry.name) ? [path] : [];
  });
}

/** The `import` / `export … from` statements and dynamic imports of a source, with comments stripped. */
function specifiersOf(file: string): string[] {
  const code = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:\\])\/\/.*$/gm, '$1');
  const statement = /\b(?:import|export)\s+(?:type\s+)?(?:[\w*{}\s,$]*?\s+from\s+)?['"]([^'"]+)['"]|\bimport\(\s*['"]([^'"]+)['"]\s*\)/g;
  return [...code.matchAll(statement)].map(match => match[1] ?? match[2] ?? '');
}

function packagesImportedBy(file: string): string[] {
  const names = new Set<string>();
  for (const spec of specifiersOf(file)) {
    if (spec.startsWith('.')) continue;
    names.add(spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0]!);
  }
  return [...names];
}

/** The entry sources the package ships, read off its export map (dist/lib/x.js -> src/x.ts). */
function entrySources(): string[] {
  return Object.values(manifest.exports).flatMap(target => {
    const path = typeof target === 'string' ? target : target.import;
    const match = path?.match(/^\.\/dist\/lib\/(.+)\.js$/);
    return match ? [resolve(root, 'src', `${match[1]}.ts`)] : [];
  });
}

describe('the package boundary', () => {
  it('imports no package that depends on this one', () => {
    const found = sourcesIn(resolve(root, 'src')).flatMap(file =>
      packagesImportedBy(file)
        .filter(name => name.startsWith('@iyulab/u-board-'))
        .map(name => `${file} -> ${name}`),
    );
    expect(found).toEqual([]);
  });

  it('reaches, from every entry, only packages it declares', () => {
    const declared = new Set([...Object.keys(manifest.dependencies ?? {}), ...Object.keys(manifest.peerDependencies ?? {})]);
    const reached = new Set<string>();
    const seen = new Set<string>();
    const visit = (file: string) => {
      if (seen.has(file)) return;
      seen.add(file);
      for (const name of packagesImportedBy(file)) reached.add(name);
      for (const spec of specifiersOf(file).filter(name => name.startsWith('.'))) {
        const base = resolve(dirname(file), spec).replace(/\.js$/, '');
        const next = [`${base}.ts`, `${base}.tsx`, resolve(base, 'index.ts')].find(path => existsSync(path) && statSync(path).isFile());
        if (next) visit(next);
      }
    };
    for (const entry of entrySources()) visit(entry);
    const undeclared = [...reached].filter(name => !declared.has(name)).sort();
    expect(undeclared).toEqual([]);
  });
});
