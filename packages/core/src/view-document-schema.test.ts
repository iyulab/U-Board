import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import { GRID_COLUMNS, GRID_COLUMNS_MEDIUM, GRID_MAX_ROW_SPAN } from './view-document';
import { validateViewDocument } from './validate-view-document';

// The published JSON Schema says the same rules as `validateViewDocument` for readers that only have the schema — an AI
// writing a board, another language's validator. These checks hold the two to the same constants and the same openness,
// and judge one set of documents with both.
const schema = JSON.parse(readFileSync(resolve(process.cwd(), 'schema/view-document.schema.json'), 'utf8'));
const schemaAccepts = new Ajv2020({ allErrors: true }).compile(schema);

const node = (id: string, widget: unknown = { type: 'gauge' }) => ({ id, x: 0, y: 0, anchored: false, widget });
const canvas = (extra: Record<string, unknown> = {}) => ({ kind: 'canvas', background: {}, nodes: [node('a')], connectors: [], ...extra });
const grid = (extra: Record<string, unknown> = {}) => ({ kind: 'grid', items: [{ id: 'a', widget: { type: 'gauge' } }], ...extra });
const dot = { render: 'template', props: { type: 'object', properties: { on: { type: 'boolean' } } }, template: '<b class="{{on}}"/>' };
const card = {
  params: { type: 'object', properties: { machine: { type: 'string' } }, required: ['machine'] },
  nodes: [{ id: 'temp', x: 0, y: 0, widget: { type: 'gauge', bindings: { value: { adapter: 'p', ref: '/machines/{{machine}}/temp' } } } }],
  decorations: [{ id: 'frame', type: 'rect', x: -10, y: -10, width: 200, height: 140, label: '{{machine}}' }],
};
const instance = (id: string, extra: Record<string, unknown> = {}) => ({ id, component: 'card', x: 100, y: 50, anchored: false, params: { machine: id }, ...extra });

/** Documents both judge the same way. */
const AGREED: [string, unknown, boolean][] = [
  ['a click trigger opening a link', canvas({ triggers: [{ on: { event: 'click', node: 'a' }, do: [{ action: 'open-link', url: 'https://plant.example.com/{{node}}' }] }] }), true],
  ['an open trigger on a grid, with a condition', grid({ triggers: [{ on: { event: 'open' }, when: { node: 'a', state: ['x', 'y'] }, do: [{ action: 'emit', name: 'opened' }, { action: 'focus', node: 'a' }] }] }), true],
  ['a trigger with no action', canvas({ triggers: [{ on: { event: 'open' }, do: [] }] }), false],
  ['a trigger action it does not know', canvas({ triggers: [{ on: { event: 'open' }, do: [{ action: 'write' }] }] }), false],
  ['a link that is not https', canvas({ triggers: [{ on: { event: 'open' }, do: [{ action: 'open-link', url: 'http://plant.example.com' }] }] }), false],
  ['a node with states and looks', canvas({ nodes: [{ ...node('a', { type: 'status', bindings: { v: { adapter: 'p', ref: '/v' } } }), states: { from: 'v', map: { values: { Fault: 'fault' }, ranges: [{ min: 80, value: 'hot' }], otherwise: 'ok' }, looks: { fault: { outline: '#dc2626', blink: true }, ok: { hidden: true } } } }] }), true],
  ['a grid item with states', grid({ items: [{ id: 'a', widget: { type: 'gauge', bindings: { v: { adapter: 'p', ref: '/v' } } }, states: { from: 'v', map: { values: { a: 'b' } } } }] }), true],
  ['states without a map', canvas({ nodes: [{ ...node('a'), states: { from: 'v' } }] }), false],
  ['a state name that is not text', canvas({ nodes: [{ ...node('a', { type: 'status', bindings: { v: { adapter: 'p', ref: '/v' } } }), states: { from: 'v', map: { values: { a: 2 } } } }] }), false],
  ['a look whose blink is not true or false', canvas({ nodes: [{ ...node('a', { type: 'status', bindings: { v: { adapter: 'p', ref: '/v' } } }), states: { from: 'v', map: { values: { a: 'b' } }, looks: { b: { blink: 'yes' } } } }] }), false],
  ['a canvas view', canvas(), true],
  ['a grid view', grid(), true],
  ['a canvas view with every optional part', canvas({
    background: { image: { src: 'plan.svg', width: 100, height: 50, referencePoints: [{ x: 0, y: 0, coordinate: { x: 0, y: 0 } }, { x: 1, y: 1, coordinate: { x: 2, y: 2 } }] } },
    connectors: [{ id: 'c', fromNodeId: 'a', toNodeId: 'a' }],
    decorations: [{ id: 'r', type: 'rect', x: 0, y: 0, width: 1, height: 1 }, { id: 't', type: 'text', x: 0, y: 0, text: 'x' }],
    appearance: 'dark',
  }), true],
  ['a connector with its label placed, a style and arrowheads, bound', canvas({ nodes: [node('a'), node('b')], connectors: [{ id: 'c', fromNodeId: 'a', toNodeId: 'b', label: '3 kW', labelAt: 0.25, style: { stroke: '#2563eb', strokeWidth: 2, dash: 'dashed', arrow: 'end' }, bindings: { 'style.arrow': { adapter: 'ems', ref: '/flow', map: { ranges: [{ max: 0, value: 'start' }, { min: 0, value: 'end' }] } } } }] }), true],
  ['a grid item with its room', grid({ items: [{ id: 'a', span: 6, spanMedium: 3, height: 120, widget: { type: 'gauge' } }] }), true],
  ['a grid cell holding a canvas', grid({ items: [{ id: 'a', widget: { type: 'gauge' } }, { id: 'c', span: 8, height: 300, canvas: { background: {}, nodes: [node('n')], connectors: [{ id: 'l', fromNodeId: 'n', toNodeId: 'n' }], decorations: [] } }] }), true],
  ['a grid item spanning rows', grid({ items: [{ id: 'a', rowSpan: 3, widget: { type: 'gauge' } }] }), true],
  ['a grid item spanning more rows than it can', grid({ items: [{ id: 'a', rowSpan: 7, widget: { type: 'gauge' } }] }), false],
  ['a grid cell holding a widget and a canvas', grid({ items: [{ id: 'c', widget: { type: 'gauge' }, canvas: { background: {}, nodes: [], connectors: [] } }] }), false],
  ['a canvas cell without its nodes', grid({ items: [{ id: 'c', canvas: { background: {}, connectors: [] } }] }), false],
  ['a canvas cell node without anchored', grid({ items: [{ id: 'c', canvas: { background: {}, nodes: [{ id: 'n', x: 0, y: 0, widget: { type: 'gauge' } }], connectors: [] } }] }), false],
  ['a list binding whose items gain a field', canvas({ nodes: [node('a', { type: 'list', bindings: { data: { adapter: 'http', ref: {}, itemFields: { tone: { from: 'state', map: { values: { run: 'ok' }, otherwise: 'off' } } } } } })] }), true],
  ['an item field without its source field', canvas({ nodes: [node('a', { type: 'list', bindings: { data: { adapter: 'http', ref: {}, itemFields: { tone: { map: { values: {} } } } } } })] }), false],
  ['an item field whose map is empty', canvas({ nodes: [node('a', { type: 'list', bindings: { data: { adapter: 'http', ref: {}, itemFields: { tone: { from: 'state', map: {} } } } } })] }), false],
  ['a binding with a value map', canvas({ nodes: [node('a', { type: 'gauge', bindings: { value: { adapter: 'http', ref: {}, map: { values: { on: 1 }, ranges: [{ min: 0, max: 1, value: 'low' }] } } } })] }), true],
  ['elements of both renders, placed', canvas({ elements: { dot, chart: { render: 'script', script: 'x', resources: ['https://cdn.example.com'], size: { width: 2, height: 1 } } }, nodes: [node('a', { type: 'element:dot', props: { on: true } }), node('b', { type: 'element:chart' })] }), true],
  ['no kind', { nodes: [] }, false],
  ['an unknown kind', { kind: 'map' }, false],
  ['a canvas view without connectors', { kind: 'canvas', background: {}, nodes: [] }, false],
  ['a node without anchored', canvas({ nodes: [{ id: 'a', x: 0, y: 0, widget: { type: 'gauge' } }] }), false],
  ['a widget without a type', canvas({ nodes: [node('a', {})] }), false],
  ['a span past the columns', grid({ items: [{ id: 'a', span: 13, widget: { type: 'gauge' } }] }), false],
  ['a grid with 10 columns', grid({ columns: 10 }), false],
  ['an appearance not light or dark', grid({ appearance: 'sepia' }), false],
  ['a binding without a ref', canvas({ nodes: [node('a', { type: 'gauge', bindings: { value: { adapter: 'http' } } })] }), false],
  ['a value map with neither part', canvas({ nodes: [node('a', { type: 'gauge', bindings: { value: { adapter: 'http', ref: 1, map: {} } } })] }), false],
  ['a connector label past its line', canvas({ nodes: [node('a'), node('b')], connectors: [{ id: 'c', fromNodeId: 'a', toNodeId: 'b', labelAt: 1.5 }] }), false],
  ['a connector arrow not one of its words', canvas({ nodes: [node('a'), node('b')], connectors: [{ id: 'c', fromNodeId: 'a', toNodeId: 'b', style: { arrow: 'forward' } }] }), false],
  ['a connector binding a path it cannot', canvas({ nodes: [node('a'), node('b')], connectors: [{ id: 'c', fromNodeId: 'a', toNodeId: 'b', bindings: { 'style.opacity': { adapter: 'ems', ref: 1 } } }] }), false],
  ['decorations with every new part: a rounded, dashed, named frame and an anchored text on a background', canvas({ decorations: [
    { id: 'r', type: 'rect', x: 0, y: 0, width: 100, height: 60, stroke: '#5f7a8c', strokeWidth: 1, radius: 6, dash: 'dashed', label: 'Line 1', labelAt: 'top-end', labelSize: 12 },
    { id: 't', type: 'text', x: 50, y: 30, text: 'Zone A', anchor: 'center', background: '#ffffffcc' },
  ] }), true],
  ['a board with an accent colour', canvas({ accent: '#1a7fe8' }), true],
  ['symbols an element places', grid({ symbols: { valve: { viewBox: '0 0 24 24', markup: '<path d="M0 0"/>' } }, elements: { dot: { render: 'template', template: '<svg><use href="#valve"/></svg>' } } }), true],
  ['a symbol without markup', grid({ symbols: { valve: { viewBox: '0 0 24 24' } } }), false],
  ['a symbol name with capitals', grid({ symbols: { Valve: { markup: '<path/>' } } }), false],
  ['an accent that is not text', grid({ accent: 7 }), false],
  ['a text anchor not one of its words', canvas({ decorations: [{ id: 't', type: 'text', x: 0, y: 0, text: 'x', anchor: 'middle' }] }), false],
  ['a frame name placed by a word it does not take', canvas({ decorations: [{ id: 'r', type: 'rect', x: 0, y: 0, width: 1, height: 1, labelAt: 'left' }] }), false],
  ['a negative corner radius', canvas({ decorations: [{ id: 'r', type: 'rect', x: 0, y: 0, width: 1, height: 1, radius: -2 }] }), false],
  ['a frame dash not one of its words', canvas({ decorations: [{ id: 'r', type: 'rect', x: 0, y: 0, width: 1, height: 1, dash: [4, 2] }] }), false],
  ['a decoration of an unknown type', canvas({ decorations: [{ id: 'd', type: 'ellipse', x: 0, y: 0 }] }), false],
  ['an element with no render', grid({ elements: { dot: { template: '<b/>' } } }), false],
  ['an element name with capitals', grid({ elements: { Dot: dot } }), false],
  ['a template element without its template', grid({ elements: { dot: { render: 'template' } } }), false],
  ['a template element with a script', grid({ elements: { dot: { ...dot, script: 'x' } } }), false],
  ['a script element with a template', grid({ elements: { chart: { render: 'script', script: 'x', template: '<b/>' } } }), false],
  ['a resource with a path', grid({ elements: { chart: { render: 'script', script: 'x', resources: ['https://cdn.example.com/lib.js'] } } }), false],
  ['a resource over http', grid({ elements: { chart: { render: 'script', script: 'x', resources: ['http://cdn.example.com'] } } }), false],
  ['an element size of zero', grid({ elements: { dot: { ...dot, size: { width: 0, height: 1 } } } }), false],
  ['a props schema that is not an object schema', grid({ elements: { dot: { ...dot, props: { type: 'string' } } } }), false],
  ['a component placed twice, a connector to one of its parts', canvas({ components: { card }, instances: [instance('press-1'), instance('press-2')], connectors: [{ id: 'c', fromNodeId: 'a', toNodeId: 'press-2/temp' }] }), true],
  ['a component without nodes', canvas({ components: { card: { params: card.params } } }), false],
  ['a component node with an id that has a slash', canvas({ components: { card: { nodes: [{ id: 'a/b', x: 0, y: 0, widget: { type: 'gauge' } }] } } }), false],
  ['an instance without anchored', canvas({ components: { card }, instances: [{ id: 'p', component: 'card', x: 0, y: 0, params: { machine: 'p' } }] }), false],
  ['an instance id with a slash', canvas({ components: { card }, instances: [instance('line/1')] }), false],
  ['params that are not an object schema', canvas({ components: { card: { ...card, params: { type: 'string' } } } }), false],
];

/** Documents the validator refuses for a rule the schema says it cannot express — named in its description. */
const VALIDATOR_ONLY: [string, unknown][] = [
  ['an id used twice', canvas({ nodes: [node('a'), node('a')] })],
  ['reference points on one axis', canvas({ background: { image: { src: 'p', width: 1, height: 1, referencePoints: [{ x: 0, y: 0, coordinate: { x: 0, y: 0 } }, { x: 0, y: 1, coordinate: { x: 1, y: 1 } }] } } })],
  ['a value range with min above max', canvas({ nodes: [node('a', { type: 'gauge', bindings: { v: { adapter: 'http', ref: 1, map: { ranges: [{ min: 2, max: 1, value: 'x' }] } } } })] })],
  ['a placed element not defined', canvas({ nodes: [node('a', { type: 'element:dot' })] })],
  ['props the definition refuses', canvas({ elements: { dot }, nodes: [node('a', { type: 'element:dot', props: { on: 'yes' } })] })],
  ['a template with a script tag', grid({ elements: { dot: { ...dot, template: '<script>x</script>' } } })],
  ['a template with an unclosed section', grid({ elements: { dot: { ...dot, template: '{{#on}}' } } })],
  ['a URL off the declared origins', grid({ elements: { dot: { ...dot, template: '<img src="https://x.example.com/a.png">' } } })],
  ['a props schema keyword outside the subset', grid({ elements: { dot: { ...dot, props: { type: 'object', pattern: 'x' } } } })],
  ['an instance of a component not defined', canvas({ instances: [instance('p')] })],
  ['an instance missing a required parameter', canvas({ components: { card }, instances: [instance('p', { params: {} })] })],
  ['an instance giving a parameter the component does not declare', canvas({ components: { card }, instances: [instance('p', { params: { machine: 'p', line: 2 } })] })],
  ['a component text using an undeclared parameter', canvas({ components: { card: { ...card, decorations: [{ id: 'f', type: 'text', x: 0, y: 0, text: '{{line}}' }] } } })],
  ['an instance part taking the id of a board node', canvas({ nodes: [node('p/temp')], components: { card }, instances: [instance('p')] })],
];

function* walk(value: unknown, at = ''): Generator<[string, Record<string, unknown>]> {
  if (typeof value !== 'object' || value === null) return;
  if (!Array.isArray(value)) yield [at, value as Record<string, unknown>];
  for (const [key, child] of Object.entries(value)) yield* walk(child, `${at}/${key}`);
}

describe('view-document.schema.json', () => {
  it('is a 2020-12 schema of the two kinds', () => {
    expect(schema.$schema).toBe('https://json-schema.org/draft/2020-12/schema');
    const kinds = schema.oneOf.map((ref: { $ref: string }) => schema.$defs[ref.$ref.replace('#/$defs/', '')].properties.kind.const);
    expect(kinds).toEqual(['canvas', 'grid']);
  });

  it('bounds a grid the way the validator does', () => {
    const { gridView, gridWidgetItem, gridCanvasItem } = schema.$defs;
    expect(gridView.properties.columns.const).toBe(GRID_COLUMNS);
    for (const item of [gridWidgetItem, gridCanvasItem]) {
      expect(item.properties.span).toMatchObject({ type: 'integer', minimum: 1, maximum: GRID_COLUMNS });
      expect(item.properties.spanMedium).toMatchObject({ type: 'integer', minimum: 1, maximum: GRID_COLUMNS_MEDIUM });
      expect(item.properties.rowSpan).toMatchObject({ type: 'integer', minimum: 1, maximum: GRID_MAX_ROW_SPAN });
    }
    expect(schema.$defs.appearance.enum).toEqual(['light', 'dark']);
  });

  it('allows fields it does not name anywhere, as the validator ignores them', () => {
    const closed = [...walk(schema)].filter(([, node]) => node.additionalProperties === false || node.unevaluatedProperties === false);
    expect(closed.map(([at]) => at)).toEqual([]);
  });

  it.each(AGREED)('judges %s as the validator does', (_, doc, valid) => {
    expect(schemaAccepts(doc), JSON.stringify(schemaAccepts.errors)).toBe(valid);
    expect(validateViewDocument(doc).length === 0).toBe(valid);
  });

  it.each(VALIDATOR_ONLY)('accepts %s, which only the validator refuses', (_, doc) => {
    expect(schemaAccepts(doc), JSON.stringify(schemaAccepts.errors)).toBe(true);
    expect(validateViewDocument(doc)).not.toEqual([]);
  });

  it('refers only to definitions it has', () => {
    const refs = [...walk(schema)].flatMap(([, node]) => (typeof node.$ref === 'string' ? [node.$ref] : []));
    expect(refs.length).toBeGreaterThan(0);
    for (const ref of refs) expect(schema.$defs[ref.replace('#/$defs/', '')], ref).toBeDefined();
  });
});
