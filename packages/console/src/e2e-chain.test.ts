/// <reference types="node" />
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

// `test:e2e` runs each spec as its own `playwright test` invocation (playwright.config.ts says why), so nothing globs
// `e2e/`: a spec left out of the chain never runs, and nothing says so — one did for a whole release. This holds every
// spec in `e2e/` to being named in the chain, or in the single-origin configuration the chain ends with.
const root = process.cwd();
const chain: string = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf-8')).scripts['test:e2e'];
const singleOrigin = readFileSync(resolve(root, 'playwright.single-origin.config.ts'), 'utf-8').match(/testMatch: '([^']+)'/)?.[1];

describe('test:e2e', () => {
  it('runs every spec in e2e/', () => {
    const specs = readdirSync(resolve(root, 'e2e')).filter(name => name.endsWith('.spec.ts'));
    const run = new Set([...chain.matchAll(/e2e\/([\w.-]+\.spec\.ts)/g)].map(m => m[1]));
    if (singleOrigin && chain.includes('playwright.single-origin.config.ts')) run.add(singleOrigin);
    expect(specs.filter(spec => !run.has(spec))).toEqual([]);
  });
});
