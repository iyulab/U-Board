// Builds the board check as one self-contained script: `dist/lib/check.bundle.js`.
//
// `@iyulab/u-board/check` is a pure function of a board — no DOM, no network, no package at runtime — so a host that is not
// a JavaScript program (a .NET service, say) can run it on an embedded JS engine instead of writing the check a second time.
// The bundle is that entry with everything it imports inlined, written for the oldest engines such hosts embed (ES2019, no
// modules, no globals of a browser or of Node): it defines one global, `UBoardCheck`, with the entry's exports —
// `checkBoard` · `emptyBoard` · `sourceAdvice` · `boardRulebook` · `RULEBOOK_EXAMPLE`.
//
//   node scripts/build-check-bundle.mjs            (also run by `build:lib` and `prepack`)

import { rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'vite';

const packageDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** The name of the global the bundle defines. */
export const BUNDLE_GLOBAL = 'UBoardCheck';
/** The file the bundle is written to, in `outDir`. */
export const BUNDLE_FILE = 'check.bundle.js';

/**
 * Writes the bundle into `outDir` (`dist/lib` by default) and returns its path. The bundle is built from the TypeScript source,
 * not from `dist/lib`, so it does not wait for `tsc`.
 */
export async function buildCheckBundle({ outDir = resolve(packageDir, 'dist/lib') } = {}) {
  await build({
    root: packageDir,
    configFile: false,
    logLevel: 'warn',
    // The bundle runs where `process` does not exist: nothing of the toolchain's environment may be left in it.
    define: { 'process.env.NODE_ENV': '"production"' },
    build: {
      outDir,
      emptyOutDir: false,
      // The oldest syntax a host's engine is likely to know; the entry's own code is lowered to it.
      target: 'es2019',
      minify: true,
      sourcemap: false,
      lib: { entry: resolve(packageDir, 'src/check-entry.ts'), name: BUNDLE_GLOBAL, formats: ['iife'], fileName: () => BUNDLE_FILE },
    },
  });
  return resolve(outDir, BUNDLE_FILE);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  rmSync(resolve(packageDir, 'dist/lib', BUNDLE_FILE), { force: true });
  const file = await buildCheckBundle();
  console.log(`check bundle: ${file}`);
}
