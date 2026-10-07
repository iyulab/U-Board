import { readFileSync } from 'node:fs';

/** The product's version — the one its release and container image are tagged with. Read from this
 *  package's manifest, which sits one level above both `src/` and `dist/`. */
export const productVersion: string = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;
