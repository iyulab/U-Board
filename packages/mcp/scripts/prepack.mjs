// Runs on `npm pack` / `npm publish` for this package.
//
// - Rebuilds dist from a clean directory, so a module whose source was removed or renamed is not
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
copyFileSync(resolve(packageDir, '../../LICENSE'), resolve(packageDir, 'LICENSE'));
