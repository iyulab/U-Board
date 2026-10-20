import { describe, it, expect } from 'vitest';
import { placedIn, type CanvasView, type GridView } from '../view-document.js';
import { validateViewDocument } from '../validate-view-document.js';
import {
  NEW_ELEMENT,
  elementIssues,
  elementNameProblem,
  elementUses,
  newElementName,
  previewProps,
  removeElement,
  renameElement,
  setElement,
} from './element-editing.js';

const tank = { render: 'template' as const, template: '<p>{{level}}</p>', props: { type: 'object' as const, properties: { level: { type: 'number' as const, default: 50 } } } };
const grid: GridView = {
  kind: 'grid',
  elements: { tank, unused: NEW_ELEMENT },
  items: [
    { id: 'a', widget: { type: 'element:tank', props: { level: 64 } } },
    { id: 'b', widget: { type: 'gauge', props: { data: { value: 1 } } } },
    { id: 'c', widget: { type: 'element:tank', props: {} } },
    { id: 'd', widget: { type: 'element:gone' } },
  ],
};
const canvas: CanvasView = {
  kind: 'canvas',
  background: {},
  connectors: [],
  elements: { tank },
  nodes: [{ id: 'n', x: 0, y: 0, anchored: false, widget: { type: 'element:tank', props: { level: 1 } } }],
};

describe('element editing', () => {
  it('counts where each element is placed, the unplaced and the undefined ones too', () => {
    expect(Object.fromEntries(elementUses(grid))).toEqual({ tank: 2, unused: 0, gone: 1 });
  });

  it('starts a new element from a valid template, under a name not taken', () => {
    expect(newElementName(grid)).toBe('element-1');
    expect(newElementName(setElement(grid, 'element-1', NEW_ELEMENT))).toBe('element-2');
    const doc = setElement({ kind: 'grid', items: [{ id: 'x', widget: { type: 'element:element-1', props: {} } }] } as GridView, 'element-1', NEW_ELEMENT);
    expect(validateViewDocument(doc)).toEqual([]);
  });

  it('says why a name cannot be taken', () => {
    expect(elementNameProblem(grid, 'Tank')).toBe('invalid');
    expect(elementNameProblem(grid, 'unused', 'tank')).toBe('taken');
    expect(elementNameProblem(grid, 'tank', 'tank')).toBeUndefined();
    expect(elementNameProblem(grid, 'level-tank')).toBeUndefined();
  });

  it('renames an element and every widget placing it, in either kind, keeping the registry order', () => {
    const renamed = renameElement(grid, 'tank', 'level-tank');
    expect(Object.keys(renamed.elements!)).toEqual(['level-tank', 'unused']);
    expect(placedIn(renamed).map(i => i.widget.type)).toEqual(['element:level-tank', 'gauge', 'element:level-tank', 'element:gone']);
    expect(renameElement(canvas, 'tank', 'vessel').nodes[0].widget.type).toBe('element:vessel');
    expect(renameElement(grid, 'tank', 'unused')).toBe(grid);
    expect(renameElement(grid, 'tank', 'Bad Name')).toBe(grid);
  });

  it('removes an element only while nothing places it, and the registry once it is empty', () => {
    expect(removeElement(grid, 'tank')).toBe(grid);
    expect(Object.keys(removeElement(grid, 'unused').elements!)).toEqual(['tank']);
    const only: GridView = { kind: 'grid', items: [], elements: { unused: NEW_ELEMENT } };
    expect('elements' in removeElement(only, 'unused')).toBe(false);
  });

  it("reports what is wrong with a definition at paths below it", () => {
    const issues = elementIssues(grid, 'tank', { ...tank, template: '<p onclick="x">{{level}}</p>' });
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.every(i => i.path.startsWith('/template'))).toBe(true);
    // A placement's props that the new schema refuses are not the definition's problem.
    expect(elementIssues(grid, 'tank', tank)).toEqual([]);
  });

  it('previews with the first placement’s props over the schema’s defaults', () => {
    expect(previewProps(grid, 'tank', tank)).toEqual({ level: 64 });
    expect(previewProps(grid, 'unused', NEW_ELEMENT)).toEqual({ label: 'Label' });
  });
});
