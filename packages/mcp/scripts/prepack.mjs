// Runs on `npm pack` / `npm publish` for this package.
//
// - Rebuilds dist from a clean directory (the compiled code, the page `renderBoard` draws in, and the page `show_board` draws in), so a module whose source was removed or renamed is not
//   shipped from an older build.
// - Copies the repository's LICENSE next to package.json: npm only picks up a LICENSE from the
//   package's own directory, and the license text lives once, at the repository root.

import { execSync } from 'node:child_process';
import { copyFileSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');

rmSync(resolve(packageDir, 'dist'), { recursive: true, force: true });
execSync('npx tsc -p tsconfig.build.json', { cwd: packageDir, stdio: 'inherit' });
// The page `renderBoard` draws in, built into dist/render-page/ (the package ships it).
execSync('npx vite build --config render-page/vite.config.ts', { cwd: packageDir, stdio: 'inherit' });
// The page `show_board` draws a board in, built into dist/app/board.html — one file, as an MCP App is.
execSync('node scripts/build-app.mjs', { cwd: packageDir, stdio: 'inherit' });
copyFileSync(resolve(packageDir, '../../LICENSE'), resolve(packageDir, 'LICENSE'));
