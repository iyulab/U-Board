import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
// A static import, not `await import()` inside a test: loading an entry transforms its whole
// module graph, and inside a test body that cost counts against the per-test timeout — enough
// to time the first test out when the suite runs under load.
import * as mod from './domain-entry.js';
import * as viewer from './viewer-entry.js';
import * as root from './index.js';
import * as boardV2 from './board-v2-entry.js';
// Compiles only while every entry point carries the types of the fields it exports (document-types.ts).
import type { ReferencePoint, ValueRange, BackgroundImage } from './viewer-entry.js';
import type { ReferencePoint as DomainReferencePoint, ValueRange as DomainValueRange } from './domain-entry.js';

describe('domain entry', () => {
  it('does not export AuthoringView or ViewerPage, so importing it never pulls in React/canvas-kit', () => {
    expect('AuthoringView' in mod).toBe(false);
    expect('ViewerPage' in mod).toBe(false);
  });

  it("does not export FixtureAdapter — the fixture serves only this package's demo app and tests", () => {
    expect('FixtureAdapter' in mod).toBe(false);
  });

  it('re-exports the domain surface a server process needs', () => {
    expect(typeof mod.resolveDocument).toBe('function');
    expect(typeof mod.validateViewDocument).toBe('function');
    expect(typeof mod.readHttpRef).toBe('function');
    expect(typeof mod.isHttpRef).toBe('function');
  });

  // The public surface, value by value: an export appears or goes away here on purpose, not as a side
  // effect — what a 0.x minor release adds or removes is read off this list.
  it('exports exactly these values', () => {
    expect(Object.keys(mod).sort()).toEqual([
      'CONNECTOR_ARROWS', 'CONNECTOR_BINDABLE', 'CONNECTOR_ROUTES', 'DEFAULT_NODE_HEIGHT', 'DEFAULT_NODE_WIDTH', 'DEFAULT_QUALITY_TEXT', 'EDIT_COMMANDS', 'EditCommandError',
      'FiringLimit', 'InvalidViewDocumentError', 'JsonPatchError', 'PLACEMENTS', 'STROKE_DASHES', 'TRIGGER_ACTIONS',
      'TRIGGER_EVENTS', 'ageText', 'applyEditCommands', 'applyJsonPatch', 'applyValueMap', 'bindingsIn', 'boardStateOf', 'coordinateOf',
      'describeQuality', 'documentPatch', 'elementDefinitionHash', 'elementFrameHtml', 'elementFrameLabel', 'elementFrameScripts', 'elementListeners',
      'emptyViewDocument', 'expandComponents', 'findHttpRefItem', 'firedBy', 'getByPointer', 'instancePartId', 'isCanvasItem', 'isHttpRef', 'isSourceErrorField', 'isTriggerLink', 'linkFor',
      'lintViewDocument', 'nodeSize', 'parseSourceTime', 'parseViewDocument', 'placeAt', 'placedAt', 'placedIn', 'readHttpRef', 'requestPath', 'requestTimeProblem',
      'resolveConnector', 'resolveDocument', 'resolveWidget', 'resolvedReading', 'sizedNodes', 'sourceErrorIn', 'stateChanges',
      'validateViewDocument', 'withItemFields', 'worstQuality', 'writeText',
    ]);
    expect(Object.keys(viewer).sort()).toEqual([
      'DEFAULT_LABELS', 'DEFAULT_QUALITY_TEXT', 'KO_LABELS', 'ViewerPage', 'ageText', 'serverClock', 'timeText', 'useResolvedDocument',
    ]);
  });

  it('exports from the package root everything ./domain and ./viewer do, and the authoring tool', () => {
    expect(Object.keys(root).sort()).toEqual([...new Set([...Object.keys(mod), ...Object.keys(viewer), 'AuthoringView'])].sort());
  });

  // The server and the MCP server load this entry in a bare Node process, and the server image carries only the
  // workspace's root node_modules: a package that core alone depends on (the widget library, canvas-kit) is installed
  // under packages/core and is missing there — the process fails at start, not in a test. Every package this entry
  // reaches at runtime is listed here on purpose; a new one has to be one the server itself can resolve.
  it('reaches no package at runtime, so a Node process without the widgets or the canvas can load it', () => {
    expect(runtimePackagesReachedFrom(resolve(process.cwd(), 'src/domain-entry.ts'))).toEqual([]);
  });

  it('carries the same document types in every entry point', () => {
    const point: ReferencePoint = { x: 0, y: 0, coordinate: { x: 0, y: 0 } };
    const same: DomainReferencePoint = point;
    const range: ValueRange = { max: 1, value: 'low' };
    const sameRange: DomainValueRange = range;
    const image: BackgroundImage = { src: '', width: 1, height: 1, referencePoints: [same, same] };
    expect([sameRange, image].length).toBe(2);
  });
});

// The board language's second version has its own entry: it is not part of the package root (nothing there reads it yet).
// The server validates boards with it, so like ./domain it reaches no package at runtime — its kinds come from the copy of
// the widget library's catalog written at build time (widget-catalog.generated.ts), not from the library.
describe('board-v2 entry', () => {
  it('exports exactly these values', () => {
    expect(Object.keys(boardV2).sort()).toEqual([
      'BOARD_LANGUAGE_VERSION', 'EMPHASES', 'FRAMES', 'PART_KINDS', 'PictureError', 'RULEBOOK_EXAMPLE', 'TONES', 'boardV2Rulebook', 'boardV2Schema', 'checkBoardV2',
      'fromV1', 'keyReadsOf', 'keysIn', 'partKind', 'toViewDocument', 'validateBoardV2',
    ]);
    for (const key of Object.keys(boardV2)) expect(key in root).toBe(false);
  });

  it('reaches no package at runtime, so a Node process without the widgets can load it', () => {
    expect(runtimePackagesReachedFrom(resolve(process.cwd(), 'src/board-v2-entry.ts'))).toEqual([]);
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
