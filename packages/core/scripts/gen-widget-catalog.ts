// Writes src/board/widget-catalog.generated.ts from the installed widget library. Run it after raising
// @iyulab/u-widgets; `widget-catalog.test.ts` fails until the written copy matches the library again.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getWidgetOptions, help } from '@iyulab/u-widgets/tools';
import { readWidgetCatalog, widgetCatalogModule } from '../src/board/widget-catalog.js';

const packageDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// The library does not export its package.json; find it above the resolved `./tools` file.
let libraryDir = dirname(fileURLToPath(import.meta.resolve('@iyulab/u-widgets/tools')));
while (!existsSync(resolve(libraryDir, 'package.json'))) libraryDir = dirname(libraryDir);
const libraryVersion = (JSON.parse(readFileSync(resolve(libraryDir, 'package.json'), 'utf8')) as { version: string }).version;

const target = resolve(packageDir, 'src/board/widget-catalog.generated.ts');
writeFileSync(target, widgetCatalogModule(readWidgetCatalog({ help, getWidgetOptions }), libraryVersion));
console.log(`wrote ${target} (u-widgets ${libraryVersion})`);
