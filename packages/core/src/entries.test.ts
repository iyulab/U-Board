import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
// A static import, not `await import()` inside a test: loading an entry transforms its whole
// module graph, and inside a test body that cost counts against the per-test timeout — enough
// to time the first test out when the suite runs under load.
import * as domain from './domain-entry.js';
import * as picture from './picture-entry.js';
import * as viewer from './viewer-entry.js';
import * as examples from './examples-entry.js';
import * as toolkit from './toolkit-entry.js';
import * as root from './index.js';

// The public surface, value by value: an export appears or goes away here on purpose, not as a side effect — what a
// 0.x minor release adds or removes is read off these lists.
describe('the entry points', () => {
  it('./domain exports the board language and the adapter contract', () => {
    expect(Object.keys(domain).sort()).toEqual([
      'DEFAULT_QUALITY_TEXT', 'EMPHASES', 'FRAMES', 'JsonPatchError', 'PART_KINDS', 'PictureError', 'TONES', 'ageText',
      'applyJsonPatch', 'boardSchema', 'dataReadOf', 'describeQuality', 'drawBoard', 'elementDefinition',
      'getByPointer', 'keyReadsOf', 'keysIn', 'partKind', 'pictureOf', 'readKeys', 'readLists', 'readerOf', 'toViewDocument', 'validateBoard',
      'worstQuality',
    ]);
  });

  it('./picture exports the model the renderer draws from', () => {
    expect(Object.keys(picture).sort()).toEqual([
      'CONNECTOR_ARROWS', 'CONNECTOR_BINDABLE', 'CONNECTOR_ROUTES', 'DEFAULT_NODE_HEIGHT', 'DEFAULT_NODE_WIDTH', 'DEFAULT_QUALITY_TEXT', 'FiringLimit',
      'GRID_COLUMNS', 'GRID_COLUMNS_MEDIUM', 'GRID_DEFAULT_SPAN', 'GRID_MAX_ROW_SPAN', 'JsonPatchError', 'PLACEMENTS', 'STROKE_DASHES', 'TRIGGER_ACTIONS', 'TRIGGER_EVENTS', 'ageText', 'applyJsonPatch', 'applyValueMap', 'bindingsIn',
      'boardStateOf', 'coordinateOf', 'describeQuality', 'elementDefinitionHash', 'elementFrameHtml', 'elementFrameLabel', 'elementFrameScripts',
      'elementListeners', 'findHttpRefItem', 'firedBy', 'getByPointer', 'isCanvasItem', 'isHttpRef',
      'isSourceErrorField', 'isTriggerLink', 'linkFor', 'lintViewDocument', 'nodeSize', 'parseSourceTime', 'placeAt', 'placedAt', 'placedIn',
      'readHttpRef', 'requestPath', 'requestTimeProblem', 'resolveConnector', 'resolveDocument', 'resolveWidget', 'resolvedReading', 'sizedNodes',
      'sourceErrorIn', 'stateChanges', 'withItemFields', 'worstQuality', 'writeText',
    ]);
  });

  it('./viewer exports the board drawn in its host and a picture drawn as given', () => {
    expect(Object.keys(viewer).sort()).toEqual(['BoardView', 'DEFAULT_LABELS', 'DEFAULT_QUALITY_TEXT', 'KO_LABELS', 'ViewerPage', 'ageText', 'serverClock', 'timeText']);
  });

  it('exports from the package root everything ./domain and ./viewer do, and nothing else', () => {
    expect(Object.keys(root).sort()).toEqual([...new Set([...Object.keys(domain), ...Object.keys(viewer)])].sort());
  });

  it('./examples exports the sample boards and the fixture adapter', () => {
    expect(Object.keys(examples).sort()).toEqual(['FixtureAdapter', 'demoBoard', 'demoGrid', 'demoMixed', 'demoQuakes', 'elementsDemo']);
  });

  it('./toolkit carries building blocks, not the viewer board or the authoring tool', () => {
    expect('BoardView' in toolkit).toBe(false);
    expect('BoardAuthoring' in toolkit).toBe(false);
    expect(typeof toolkit.ViewerPage).toBe('function');
  });

  it('keeps React and the canvas out of ./domain and ./picture', () => {
    for (const entry of [domain, picture]) {
      expect('BoardView' in entry).toBe(false);
      expect('ViewerPage' in entry).toBe(false);
      expect('FixtureAdapter' in entry).toBe(false);
    }
  });

  // The server and the MCP server load these entries in a bare Node process, and the server image carries only the
  // workspace's root node_modules: a package that core alone depends on (the widget library, canvas-kit) is installed
  // under packages/core and is missing there — the process fails at start, not in a test. Every package an entry
  // reaches at runtime is listed here on purpose; a new one has to be one the server itself can resolve. The board
  // language's kinds come from the copy of the widget library's catalog written at build time
  // (widget-catalog.generated.ts), not from the library.
  it.each(['src/domain-entry.ts', 'src/picture-entry.ts'])('%s reaches no package at runtime', entry => {
    expect(runtimePackagesReachedFrom(resolve(process.cwd(), entry))).toEqual([]);
  });
});

/**
 * The packages a module's runtime import graph reaches, following the relative imports from `entry` (type-only imports
 * and exports are erased by the compiler and do not count). Reads the source, so it needs no build.
 */
function runtimePackagesReachedFrom(entry: string): string[] {
  const statement = /\b(?:import|export)\s+(type\s+)?(?:[\w*{}\s,$]*?\s+from\s+)?['"]([^'"]+)['"]|\bimport\(\s*['"]([^'"]+)['"]\s*\)/g;
  const visited = new Set<string>();
  const packages = new Set<string>();
  const sourceOf = (path: string): string => {
    const candidates = [path, path.replace(/\.js$/, '.ts'), path.replace(/\.js$/, '.tsx'), `${path}.ts`, `${path}/index.ts`];
    const found = candidates.find((candidate) => existsSync(candidate) && statSync(candidate).isFile());
    if (!found) throw new Error(`cannot find the source of ${path}`);
    return found;
  };
  const visit = (file: string): void => {
    if (visited.has(file)) return;
    visited.add(file);
    const code = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:\\])\/\/.*$/gm, '$1');
    for (const [, typeOnly, specifier = '', dynamic] of code.matchAll(statement)) {
      const target = dynamic ?? specifier;
      if (typeOnly) continue;
      if (target.startsWith('.')) visit(sourceOf(resolve(dirname(file), target)));
      else packages.add(target.startsWith('@') ? target.split('/').slice(0, 2).join('/') : target.split('/')[0]!);
    }
  };
  visit(entry);
  return [...packages].sort();
}
