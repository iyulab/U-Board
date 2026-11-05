// Builds the page `show_board` draws a board in: `dist/app/board.html`, one file (the viewer, its styles and its script inside it) — what an
// MCP App is. Vite builds to `dist/app-build/`; this folds that into the one file and leaves the build directory out of the package.
//
// The page carries the MCP Apps library (`@modelcontextprotocol/ext-apps`, licensed MIT and Apache-2.0 by contribution): its licence text is
// written next to the page as `ext-apps.LICENSE`, as the licences ask of what they are redistributed in.

import { execSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const built = join(packageDir, 'dist', 'app-build');
const out = join(packageDir, 'dist', 'app');

execSync('npx vite build --config app/vite.config.ts', { cwd: packageDir, stdio: 'inherit' });

const assets = new Set(readdirSync(join(built, 'assets')));
let page = readFileSync(join(built, 'index.html'), 'utf8');
// Replacements are made by function: a bundle holds `$&` and `$'`, which a replacement string would read as patterns.
page = page.replace(/<script type="module"[^>]*src="\.\/assets\/([^"]+)"[^>]*><\/script>/g, (_, file) => {
  assets.delete(file);
  return `<script type="module">${readFileSync(join(built, 'assets', file), 'utf8').replaceAll('</script', '<\\/script')}</script>`;
});
page = page.replace(/<link rel="stylesheet"[^>]*href="\.\/assets\/([^"]+)"[^>]*>/g, (_, file) => {
  assets.delete(file);
  return `<style>${readFileSync(join(built, 'assets', file), 'utf8').replaceAll('</style', '<\\/style')}</style>`;
});
// What the build wrote beside the page must all be inside it: a file left out would be a request the host's sandbox cannot make.
if (assets.size > 0) throw new Error(`the page does not hold: ${[...assets].join(', ')}`);
if (/(src|href)="\.\/assets\//.test(page)) throw new Error('the page still points at a file outside itself');

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'board.html'), page);
// The package does not export its package.json: walk up from its entry file to the directory that holds the licence.
let root = dirname(createRequire(import.meta.url).resolve('@modelcontextprotocol/ext-apps'));
while (!existsSync(join(root, 'LICENSE'))) {
  const parent = dirname(root);
  if (parent === root) throw new Error('the licence of @modelcontextprotocol/ext-apps was not found');
  root = parent;
}
const licence = join(root, 'LICENSE');
copyFileSync(licence, join(out, 'ext-apps.LICENSE'));
rmSync(built, { recursive: true, force: true });
console.log(`app page: ${(page.length / 1024).toFixed(0)} kB`);
