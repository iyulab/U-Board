// Takes a new @iyulab/u-widgets into this workspace: the range in each package that depends on it, the lock file, and the copy of
// the widget library's catalog the check reads (`gen:widget-catalog`). What is left is the part that needs a person: the options the
// new version adds (a test or rulebook line that names them), a CHANGELOG line, and `npm run check`.
//
//   npm run take:widgets -- 0.49.0
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const MANIFESTS = ['packages/core/package.json', 'packages/mcp/package.json'];
const NAME = '@iyulab/u-widgets';

/** The range a package declares for a version: a caret on a whole version, as every package here does. */
export function widgetsRange(version) {
  if (!/^\d+\.\d+\.\d+$/.test(version ?? '')) throw new Error(`give a whole version such as 0.49.0, not ${JSON.stringify(version)}`);
  return `^${version}`;
}

/** A manifest's text with its range for the widget library replaced — the rest of the text untouched. `changed` is false when the
 *  manifest does not depend on it, or already declares that range. */
export function withWidgetsRange(text, range) {
  const pattern = new RegExp(String.raw`("${NAME}"\s*:\s*")([^"]*)(")`, 'g');
  let changed = false;
  const next = text.replace(pattern, (whole, before, current, after) => {
    if (current === range) return whole;
    changed = true;
    return `${before}${range}${after}`;
  });
  return { text: next, changed };
}

function run(command) {
  const { status } = spawnSync(command, { stdio: 'inherit', shell: true });
  if (status !== 0) {
    console.error(`take:widgets failed at: ${command}`);
    process.exit(status ?? 1);
  }
}

function main() {
  const range = widgetsRange(process.argv[2]);
  for (const path of MANIFESTS) {
    const { text, changed } = withWidgetsRange(readFileSync(path, 'utf8'), range);
    if (changed) writeFileSync(path, text);
    console.log(`${changed ? 'set ' : 'kept'} ${path} ${NAME} ${range}`);
  }
  run(`npm install ${NAME}@${range.slice(1)} --workspace=packages/core --workspace=packages/mcp --no-audit --no-fund`);
  run('npm run gen:widget-catalog --workspace=packages/core');
  console.log('\nTaken. Left for a person: tests or rulebook lines that name the new options · the CHANGELOG line · `npm run check`.');
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
