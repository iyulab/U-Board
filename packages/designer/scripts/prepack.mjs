// Runs on `npm pack` / `npm publish` for this package: rebuilds dist/lib from a clean directory (tsc never deletes
// output for a source file that has since been removed) and copies the repository's LICENSE next to package.json.
import { execSync } from 'node:child_process';
import { copyFileSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');

rmSync(resolve(packageDir, 'dist/lib'), { recursive: true, force: true });
execSync('npx tsc -p tsconfig.build.json', { cwd: packageDir, stdio: 'inherit' });
copyFileSync(resolve(packageDir, '../../LICENSE'), resolve(packageDir, 'LICENSE'));
