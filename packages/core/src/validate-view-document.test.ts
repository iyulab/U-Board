import { describe, it, expect } from 'vitest';
import { validateViewDocument } from './validate-view-document';
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
    expect(paths({ kind: 'table', items: [] })).toEqual(['/kind']);
    expect(validateViewDocument({ kind: 'table' })[0].message).toBe('expected "canvas" or "grid"');
  });

  it('names the top-level fields that are missing or of the wrong type', () => {
    expect(paths({ kind: 'canvas' })).toEqual(['/background', '/nodes', '/connectors']);
    expect(paths(broken(d => { d.decorations = {}; }))).toEqual(['/decorations']);
    expect(paths(broken(d => { d.background.image = { src: 'plan.png' }; }))).toEqual(['/background/image/width', '/background/image/height']);
  });

  it("checks a background's reference points: two of them, numbers, apart on both axes", () => {
    const points = (value: unknown) => paths(broken(d => { (d.background.image as unknown as Record<string, unknown>).referencePoints = value; }));
    const a = { x: 0, y: 0, coordinate: { x: 126.9, y: 37.6 } };
    const b = { x: 800, y: 600, coordinate: { x: 127.1, y: 37.4 } };
    expect(points([a, b])).toEqual([]);
    expect(points([a])).toEqual(['/background/image/referencePoints']);
    expect(points([a, { x: 800, y: '600', coordinate: { x: 127.1 } }])).toEqual([
      '/background/image/referencePoints/1/y',
      '/background/image/referencePoints/1/coordinate/y',
    ]);
    expect(points([a, { ...b, y: 0 }])).toEqual(['/background/image/referencePoints']);
    expect(points([a, { ...b, coordinate: { x: 126.9, y: 37.4 } }])).toEqual(['/background/image/referencePoints']);
  });

  it('checks every field a node promises', () => {
    expect(paths(broken(d => { d.nodes[0] = { foo: 1 }; }))).toEqual([
      '/nodes/0/id', '/nodes/0/x', '/nodes/0/y', '/nodes/0/anchored', '/nodes/0/widget',
      // with no id, the node the connector starts from is gone
      '/connectors/0/fromNodeId',
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

  it('takes a board appearance of light or dark, and no other', () => {
    expect(validateViewDocument(broken(d => { d.appearance = 'dark'; }))).toEqual([]);
    expect(paths(broken(d => { d.appearance = 'dim'; }))).toEqual(['/appearance']);
  });

  it('takes a connector to join two nodes the document has', () => {
    expect(validateViewDocument(broken(d => { d.connectors[0].toNodeId = 'gone'; }))).toEqual([
      { path: '/connectors/0/toNodeId', message: 'no node has the id "gone" — a connector joins two nodes of /nodes' },
    ]);
  });

  it('takes ids unique across the document — a node, connector and decoration may not share one', () => {
    expect(validateViewDocument(broken(d => { d.connectors[0].id = 'n1'; }))).toEqual([
      { path: '/connectors/0/id', message: 'expected an id not used elsewhere in the document — /nodes/0 has it' },
    ]);
    expect(paths(broken(d => { d.nodes[1].id = 'n1'; d.decorations[1].id = 'n1'; }))).toEqual([
      '/nodes/1/id',
      '/connectors/0/toNodeId', // n2 is no longer there
      '/decorations/1/id',
    ]);
  });

  describe('a grid view', () => {
    const grid = {
      kind: 'grid',
      items: [
        { id: 'oee', span: 4, spanMedium: 3, height: 160, widget: { type: 'gauge', bindings: { value: { adapter: 'mes', ref: '/oee' } } } },
        { id: 'trend', span: 8, widget: { type: 'chart.line' } },
        { id: 'note', widget: { type: 'markdown' } },
      ],
    };
    const brokenGrid = (mutate: (doc: any) => void): unknown => {
      const copy = structuredClone(grid) as any;
      mutate(copy);
      return copy;
    };

    it('accepts items with or without the room they take, and the empty grid', () => {
      expect(validateViewDocument(grid)).toEqual([]);
      expect(validateViewDocument({ kind: 'grid', items: [], columns: 12, appearance: 'dark' })).toEqual([]);
    });

    it('needs items, and no canvas fields', () => {
      expect(paths({ kind: 'grid' })).toEqual(['/items']);
      expect(paths({ kind: 'grid', nodes: [], connectors: [], background: {} })).toEqual(['/items']);
    });

    it('takes a span of 1–12 columns, and at medium width 1–6, as whole numbers', () => {
      expect(paths(brokenGrid(d => { d.items[0].span = 0; d.items[1].span = 13; d.items[2].span = 2.5; }))).toEqual([
        '/items/0/span', '/items/1/span', '/items/2/span',
      ]);
      expect(paths(brokenGrid(d => { d.items[0].spanMedium = 7; }))).toEqual(['/items/0/spanMedium']);
      expect(validateViewDocument(brokenGrid(d => { d.items[0].span = 12; d.items[0].spanMedium = 6; }))).toEqual([]);
    });

    it('takes a height above zero, and only 12 columns', () => {
      expect(paths(brokenGrid(d => { d.items[0].height = 0; d.columns = 6; }))).toEqual(['/columns', '/items/0/height']);
    });

    it("checks each item's id and widget as it does a node's", () => {
      expect(paths(brokenGrid(d => { d.items[2].id = 'oee'; delete d.items[1].widget.type; d.items[0].widget.bindings.value = {}; }))).toEqual([
        '/items/0/widget/bindings/value/adapter', '/items/0/widget/bindings/value/ref', '/items/1/widget/type', '/items/2/id',
      ]);
    });
  });

  it('answers the example in docs/api-reference.md exactly as documented', () => {
    expect(validateViewDocument({
      kind: 'canvas', background: {}, connectors: [],
      nodes: [{ id: 'n1', x: 0, y: 0, anchored: false, widget: { type: 'gauge', bindings: { value: null } } }],
    })).toEqual([{ path: '/nodes/0/widget/bindings/value', message: 'expected a binding object ({ adapter, ref })' }]);
  });

  describe('strict — a document about to be written', () => {
    const strict = (value: unknown) => validateViewDocument(value, { strict: true });

    it('takes the valid document as it is', () => {
      expect(strict(valid)).toEqual([]);
    });

    it('refuses a field the format does not have, naming the fields that place has and what to do instead', () => {
      const issues = strict(broken(d => { d.connectors[0].color = 'blue'; }));
      expect(issues).toHaveLength(1);
      expect(issues[0].path).toBe('/connectors/0/color');
      expect(issues[0].message).toContain('A connector has: id, fromNodeId, toNodeId, label, style, bindings.');
      expect(issues[0].message).toContain('style: { stroke, strokeWidth, dash }');
    });

    it('checks a connector’s label and style', () => {
      expect(strict(broken(d => { d.connectors[0].label = '26 Kbps'; d.connectors[0].style = { stroke: '#2563eb', strokeWidth: 2, dash: 'dotted' }; }))).toEqual([]);
      expect(strict(broken(d => { d.connectors[0].label = 3; d.connectors[0].style = { stroke: 'var(--x)', strokeWidth: 0, dash: 'dash', arrow: true }; })).map(i => i.path)).toEqual([
        '/connectors/0/label', '/connectors/0/style/arrow', '/connectors/0/style/stroke', '/connectors/0/style/strokeWidth', '/connectors/0/style/dash',
      ]);
    });

    it('finds unknown fields at every level', () => {
      const issues = strict(
        broken(d => {
          d.title = 'Plant';
          d.nodes[0].label = 'Pump';
          d.nodes[0].widget.data = {};
          d.nodes[0].widget.bindings['data.value'].transform = 'x';
          d.decorations[0].strokeDasharray = '4 2';
          d.decorations[1].align = 'center';
          d.background.color = '#fff';
        })
      );
      expect(issues.map(issue => issue.path)).toEqual([
        '/title',
        '/background/color',
        '/nodes/0/label',
        '/nodes/0/widget/data',
        '/nodes/0/widget/bindings/data.value/transform',
        '/decorations/0/strokeDasharray',
        '/decorations/1/align',
      ]);
    });

    it('ignores unknown fields when reading, so a document from a newer version still opens', () => {
      expect(validateViewDocument(broken(d => { d.connectors[0].color = 'blue'; d.decorations[0].fill = 'var(--x)'; }))).toEqual([]);
    });

    it('takes a connector’s bindings on its label and style only, each a binding', () => {
      const bound = { label: { adapter: 's', ref: { path: '/bps' } }, 'style.strokeWidth': { adapter: 's', ref: '/load', map: { ranges: [{ min: 50, value: 5 }] } } };
      expect(strict(broken(d => { d.connectors[0].bindings = bound; }))).toEqual([]);
      expect(strict(broken(d => { d.connectors[0].bindings = { fromNodeId: { adapter: 's', ref: 1 }, label: { ref: 1 } }; })).map(i => i.path)).toEqual([
        '/connectors/0/bindings/fromNodeId', '/connectors/0/bindings/label/adapter',
      ]);
    });

    it('takes a node’s caption, as text', () => {
      expect(strict(broken(d => { d.nodes[0].caption = 'Pump A'; }))).toEqual([]);
      expect(strict(broken(d => { d.nodes[0].caption = 3; })).map(i => i.path)).toEqual(['/nodes/0/caption']);
    });

    it('takes the decoration colours every canvas reads', () => {
      for (const colour of ['#1f6feb', '#abc', '#1f6feb33', 'rgb(1, 2, 3)', 'rgba(110,170,225,0.16)', 'rgb(1 2 3 / 50%)', 'hsl(210deg 50% 40%)', 'hsla(210, 50%, 40%, .5)', 'SteelBlue', 'transparent', 'none']) {
        expect(strict(broken(d => { d.decorations[0].fill = colour; })), colour).toEqual([]);
      }
    });

    it('refuses a colour a canvas cannot read, and says which forms it takes', () => {
      for (const colour of ['var(--u-widget-border)', 'dashed', '#12345', 'rgb(1, 2)', 'currentColor', 'oklch(0.7 0.1 200)']) {
        const issues = strict(broken(d => { d.decorations[0].stroke = colour; }));
        expect(issues.map(issue => issue.path), colour).toEqual(['/decorations/0/stroke']);
        expect(issues[0].message).toContain('a hex colour');
      }
    });
  });
});
