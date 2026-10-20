import { describe, it, expect } from 'vitest';
// A static import, not `await import()` inside a test: loading an entry transforms its whole
// module graph, and inside a test body that cost counts against the per-test timeout — enough
// to time the first test out when the suite runs under load.
import * as mod from './domain-entry.js';
import * as viewer from './viewer-entry.js';
import * as root from './index.js';
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
      'emptyViewDocument', 'expandComponents', 'findHttpRefItem', 'firedBy', 'getByPointer', 'instancePartId', 'isHttpRef', 'isSourceErrorField', 'isTriggerLink', 'linkFor',
      'lintViewDocument', 'nodeSize', 'parseSourceTime', 'parseViewDocument', 'placeAt', 'placedIn', 'readHttpRef',
      'resolveConnector', 'resolveDocument', 'resolveWidget', 'resolvedReading', 'sizedNodes', 'sourceErrorIn', 'stateChanges',
      'validateViewDocument', 'worstQuality',
    ]);
    expect(Object.keys(viewer).sort()).toEqual([
      'DEFAULT_LABELS', 'DEFAULT_QUALITY_TEXT', 'KO_LABELS', 'ViewerPage', 'ageText', 'serverClock', 'timeText', 'useResolvedDocument',
    ]);
  });

  it('exports from the package root everything ./domain and ./viewer do, and the authoring tool', () => {
    expect(Object.keys(root).sort()).toEqual([...new Set([...Object.keys(mod), ...Object.keys(viewer), 'AuthoringView'])].sort());
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
