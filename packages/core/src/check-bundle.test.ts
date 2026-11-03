// @vitest-environment node
// The board check as one self-contained script (`check.bundle.js`, global `UBoardCheck`) — what a host that embeds a JavaScript
// engine of its own runs instead of writing the check a second time. Built here from the source, loaded into a context that has
// the language and nothing else, and held to the smoke vectors the package ships.

import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import vm from 'node:vm';
import { transformWithOxc } from 'vite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import * as entry from './check-entry';

const packageDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const vectors = JSON.parse(readFileSync(resolve(packageDir, 'check-vectors.json'), 'utf8')) as {
  vectors: { name: string; board: unknown; paths: string[] }[];
};

let out: string;
let bundle: string;

beforeAll(async () => {
  const builder = (await import(pathToFileURL(resolve(packageDir, 'scripts/build-check-bundle.mjs')).href)) as {
    buildCheckBundle(options: { outDir: string }): Promise<string>;
  };
  out = mkdtempSync(join(tmpdir(), 'u-board-check-bundle-'));
  bundle = readFileSync(await builder.buildCheckBundle({ outDir: out }), 'utf8');
}, 120_000);
afterAll(() => rmSync(out, { recursive: true, force: true }));

/**
 * A context with the language of ES2019 and nothing else: no `process`, `require`, `window`, `fetch`, `URL`, `TextEncoder`,
 * `structuredClone` or `console`, and none of the built-ins newer than ES2019 that a host's older engine may lack.
 */
function bareContext(): vm.Context {
  const context = vm.createContext({});
  vm.runInContext(
    [
      'delete Array.prototype.at', 'delete String.prototype.at', 'delete Array.prototype.findLast', 'delete Array.prototype.findLastIndex',
      'delete String.prototype.replaceAll', 'delete String.prototype.matchAll', 'delete Object.hasOwn', 'delete Promise.allSettled',
      'delete globalThis.structuredClone', 'delete globalThis.URL', 'delete globalThis.TextEncoder', 'delete globalThis.console',
      'delete globalThis.queueMicrotask', 'delete globalThis.setTimeout',
    ].join(';'),
    context
  );
  return context;
}

const asked = (context: vm.Context, board: unknown) => {
  context.__board = JSON.stringify(board);
  return JSON.parse(vm.runInContext('JSON.stringify(UBoardCheck.checkBoard(JSON.parse(__board)))', context) as string) as ReturnType<typeof entry.checkBoard>;
};

describe('the check bundle', () => {
  it('is one script of ES2019 syntax — nothing a host’s older engine would refuse to read', async () => {
    // Lowering to ES2019 changes a script only where it holds newer syntax (`?.`, `??`, `||=`, class fields …) — so a script that
    // comes out the same at ES2019 as at the newest target has none.
    const at = async (target: string) => (await transformWithOxc(bundle, 'check.bundle.js', { target })).code;
    expect(await at('es2019')).toBe(await at('esnext'));
    // And it is a script, not a module: nothing is imported or exported, and the global is defined by assignment.
    expect(bundle.startsWith('var UBoardCheck=')).toBe(true);
    expect(/(^|[;}])\s*(import|export)\s/.test(bundle)).toBe(false);
  });

  it('calls nothing by name that is newer than ES2019, or that is the page’s or Node’s and not the language’s', () => {
    // The built bundle holds only what the check reaches, so a name found here is one the check could call on a host's engine.
    for (const name of [
      '.at(', '.replaceAll(', '.matchAll(', 'Object.hasOwn', '.findLast(', '.findLastIndex(', 'structuredClone', 'globalThis',
      'new URL(', 'URL(', 'TextEncoder', 'TextDecoder', 'process.', 'require(', 'import(', 'window.', 'document.', 'console.', 'fetch(',
      'queueMicrotask', 'setTimeout', 'setInterval', 'BigInt', 'Intl.',
    ]) expect(bundle.includes(name), name).toBe(false);
  });

  it('defines one global, UBoardCheck, with what @iyulab/u-board/check exports', () => {
    const context = bareContext();
    vm.runInContext(bundle, context);
    const names = JSON.parse(vm.runInContext('JSON.stringify(Object.keys(UBoardCheck).sort())', context) as string) as string[];
    expect(names).toEqual(Object.keys(entry).sort());
    // Nothing else is left in the context for the host's other scripts to trip over.
    expect(JSON.parse(vm.runInContext('JSON.stringify(Object.getOwnPropertyNames(globalThis).filter(n => /^UBoard/.test(n)))', context) as string)).toEqual(['UBoardCheck']);
  });

  it('is one file of a size a host can carry', () => {
    expect(bundle.length).toBeLessThan(250_000);
  });

  describe('the smoke vectors', () => {
    it('are a dozen or so, each one board with the paths it is told off at', () => {
      expect(vectors.vectors.length).toBeGreaterThanOrEqual(10);
      expect(new Set(vectors.vectors.map(v => v.name)).size).toBe(vectors.vectors.length);
    });

    it('are what the check in the package says (so the vectors cannot drift from the code)', () => {
      for (const vector of vectors.vectors) {
        const paths = [...new Set(entry.checkBoard(vector.board as Parameters<typeof entry.checkBoard>[0]).issues.map(i => i.path))].sort();
        expect(paths, vector.name).toEqual([...vector.paths].sort());
      }
    });

    it('are what the bundle says on an engine with the language and nothing else — the same answer, not only the same paths', () => {
      const context = bareContext();
      vm.runInContext(bundle, context);
      for (const vector of vectors.vectors) {
        const there = asked(context, vector.board);
        expect([...new Set(there.issues.map(i => i.path))].sort(), vector.name).toEqual([...vector.paths].sort());
        // The whole answer — every message and the advice — is the one the package gives, as JSON.
        expect(there, vector.name).toEqual(JSON.parse(JSON.stringify(entry.checkBoard(vector.board as Parameters<typeof entry.checkBoard>[0]))));
      }
    });
  });

  it('gives the rulebook and an empty board as the package does', () => {
    const context = bareContext();
    vm.runInContext(bundle, context);
    expect(vm.runInContext('UBoardCheck.boardRulebook()', context)).toBe(entry.boardRulebook());
    expect(JSON.parse(vm.runInContext("JSON.stringify([UBoardCheck.emptyBoard('canvas'), UBoardCheck.emptyBoard('grid')])", context) as string)).toEqual(JSON.parse(JSON.stringify([entry.emptyBoard('canvas'), entry.emptyBoard('grid')])));
  });
});
