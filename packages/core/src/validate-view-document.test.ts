import { describe, it, expect } from 'vitest';
import { validateViewDocument, isViewDocumentShape } from './validate-view-document';
import type { ViewDocument } from './view-document';

const valid: ViewDocument = {
  kind: 'canvas',
  background: { image: { src: 'plan.png', width: 800, height: 600 } },
  nodes: [
    {
      id: 'n1',
      x: 10,
      y: 20,
      width: 160,
      height: 90,
      anchored: true,
      widget: {
        type: 'status',
        props: { data: { label: 'Pump A' } },
        bindings: { 'data.value': { adapter: 'cmms', ref: { path: '/assets', valuePath: '/value/0/status' } } },
      },
    },
    { id: 'n2', x: 0, y: 0, anchored: false, widget: { type: 'gauge' } },
  ],
  connectors: [{ id: 'c1', fromNodeId: 'n1', toNodeId: 'n2' }],
  decorations: [
    { id: 'd1', type: 'rect', x: 0, y: 0, width: 300, height: 200, stroke: '#888', strokeWidth: 2 },
    { id: 'd2', type: 'text', x: 4, y: 4, text: 'Pump room', fontSize: 14 },
  ],
};

/** A deep copy of the valid document with one change applied — each case breaks exactly one field. */
function broken(mutate: (doc: any) => void): unknown {
  const copy = structuredClone(valid) as any;
  mutate(copy);
  return copy;
}

const paths = (value: unknown) => validateViewDocument(value).map(issue => issue.path);

describe('validateViewDocument', () => {
  it('accepts a complete document, and the minimal empty one', () => {
    expect(validateViewDocument(valid)).toEqual([]);
    expect(validateViewDocument({ kind: 'canvas', background: {}, nodes: [], connectors: [] })).toEqual([]);
  });

  it('ignores fields it does not know, so a newer writer does not break an older reader', () => {
    expect(validateViewDocument(broken(d => { d.title = 'x'; d.nodes[0].note = 'y'; }))).toEqual([]);
  });

  it('rejects what is not a document at all', () => {
    expect(paths(null)).toEqual(['']);
    expect(paths('canvas')).toEqual(['']);
    expect(paths({ kind: 'grid', background: {}, nodes: [], connectors: [] })).toEqual(['/kind']);
  });

  it('names the top-level fields that are missing or of the wrong type', () => {
    expect(paths({ kind: 'canvas' })).toEqual(['/background', '/nodes', '/connectors']);
    expect(paths(broken(d => { d.decorations = {}; }))).toEqual(['/decorations']);
    expect(paths(broken(d => { d.background.image = { src: 'plan.png' }; }))).toEqual(['/background/image/width', '/background/image/height']);
  });

  it('checks every field a node promises', () => {
    expect(paths(broken(d => { d.nodes[0] = { foo: 1 }; }))).toEqual([
      '/nodes/0/id', '/nodes/0/x', '/nodes/0/y', '/nodes/0/anchored', '/nodes/0/widget',
    ]);
    // The layout of another tool's export: position/size objects instead of x/y/width/height.
    expect(paths(broken(d => {
      d.nodes[1] = { id: 'n2', position: { x: 0, y: 0 }, size: { width: 10, height: 10 }, anchored: false, widget: { type: 'gauge' } };
    }))).toEqual(['/nodes/1/x', '/nodes/1/y']);
    expect(paths(broken(d => { d.nodes[0].width = '160'; d.nodes[0].x = Number.NaN; }))).toEqual(['/nodes/0/x', '/nodes/0/width']);
  });

  it('checks the widget and each binding in it', () => {
    expect(paths(broken(d => { d.nodes[0].widget.type = 3; }))).toEqual(['/nodes/0/widget/type']);
    expect(paths(broken(d => { d.nodes[0].widget.props = []; }))).toEqual(['/nodes/0/widget/props']);
    expect(paths(broken(d => { d.nodes[0].widget.bindings['data.value'] = null; }))).toEqual(['/nodes/0/widget/bindings/data.value']);
    expect(paths(broken(d => { d.nodes[0].widget.bindings['data.value'] = 'not-an-object'; }))).toEqual(['/nodes/0/widget/bindings/data.value']);
    expect(paths(broken(d => { d.nodes[0].widget.bindings['data.value'] = { ref: 'x' }; }))).toEqual(['/nodes/0/widget/bindings/data.value/adapter']);
    expect(paths(broken(d => { d.nodes[0].widget.bindings['data.value'] = { adapter: 'cmms' }; }))).toEqual(['/nodes/0/widget/bindings/data.value/ref']);
  });

  it("checks a binding's value map, leaving the mapped values themselves to the widget", () => {
    const withMap = (map: unknown) => broken(d => { d.nodes[0].widget.bindings['data.value'].map = map; });
    expect(validateViewDocument(withMap({ values: { Fault: 'error', '3': { any: ['thing'] } }, otherwise: 'neutral' }))).toEqual([]);
    expect(validateViewDocument(withMap({ values: {} }))).toEqual([]);
    expect(paths(withMap('error'))).toEqual(['/nodes/0/widget/bindings/data.value/map']);
    expect(paths(withMap({ otherwise: 'x' }))).toEqual(['/nodes/0/widget/bindings/data.value/map']);
    expect(paths(withMap({ values: ['error'] }))).toEqual(['/nodes/0/widget/bindings/data.value/map/values']);
  });

  it("checks a value map's ranges — numeric bounds, at least one, in order, and a value", () => {
    const at = '/nodes/0/widget/bindings/data.value/map';
    const withRanges = (ranges: unknown) => broken(d => { d.nodes[0].widget.bindings['data.value'].map = { ranges }; });
    expect(validateViewDocument(withRanges([{ min: 80, value: 'error' }, { min: 70, max: 80, value: { any: 1 } }, { max: 70, value: null }]))).toEqual([]);
    expect(paths(withRanges({ min: 1 }))).toEqual([`${at}/ranges`]);
    expect(paths(withRanges(['x']))).toEqual([`${at}/ranges/0`]);
    expect(paths(withRanges([{ value: 'x' }]))).toEqual([`${at}/ranges/0`]);
    expect(paths(withRanges([{ min: '80', value: 'x' }]))).toEqual([`${at}/ranges/0/min`]);
    expect(paths(withRanges([{ min: 80, max: 80, value: 'x' }]))).toEqual([`${at}/ranges/0/max`]);
    expect(paths(withRanges([{ min: 80 }]))).toEqual([`${at}/ranges/0/value`]);
  });

  it('leaves a binding ref and widget props opaque — each adapter and widget library defines its own', () => {
    expect(validateViewDocument(broken(d => {
      d.nodes[0].widget.bindings['data.value'].ref = 'pump-a.state';
      d.nodes[0].widget.props = { anything: [1, { deep: true }] };
    }))).toEqual([]);
  });

  it('escapes "/" and "~" in a binding key the way JSON Pointer does', () => {
    expect(paths(broken(d => { d.nodes[0].widget.bindings = { 'a/b~c': null }; }))).toEqual(['/nodes/0/widget/bindings/a~1b~0c']);
  });

  it('checks connectors and decorations', () => {
    expect(paths(broken(d => { d.connectors[0] = { id: 'c1', fromNodeId: 'n1' }; }))).toEqual(['/connectors/0/toNodeId']);
    expect(paths(broken(d => { d.decorations[0].type = 'circle'; }))).toEqual(['/decorations/0/type']);
    expect(paths(broken(d => { delete d.decorations[0].height; }))).toEqual(['/decorations/0/height']);
    expect(paths(broken(d => { d.decorations[1].text = 5; d.decorations[1].fill = 0; }))).toEqual(['/decorations/1/text', '/decorations/1/fill']);
  });

  it('does not judge references between parts of a document — a connector to a missing node is drawn as nothing, not rejected', () => {
    expect(validateViewDocument(broken(d => { d.connectors[0].toNodeId = 'gone'; }))).toEqual([]);
  });

  it('answers the example in docs/api-reference.md exactly as documented', () => {
    expect(validateViewDocument({
      kind: 'canvas', background: {}, connectors: [],
      nodes: [{ id: 'n1', x: 0, y: 0, anchored: false, widget: { type: 'gauge', bindings: { value: null } } }],
    })).toEqual([{ path: '/nodes/0/widget/bindings/value', message: 'expected a binding object ({ adapter, ref })' }]);
  });
});

describe('isViewDocumentShape', () => {
  it('is true exactly when validateViewDocument finds nothing', () => {
    expect(isViewDocumentShape(valid)).toBe(true);
    expect(isViewDocumentShape(broken(d => { d.nodes[0].widget.bindings['data.value'] = null; }))).toBe(false);
  });
});
