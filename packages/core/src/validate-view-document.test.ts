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
  it('says what it got where a value is of the wrong kind — a writer does not re-read what it sent', () => {
    const issues = validateViewDocument(broken(d => { d.nodes[0].anchored = { enum: ['false'] }; d.connectors = { id: 'c1' }; d.nodes[1].x = undefined; }));
    expect(issues).toHaveLength(3);
    expect(issues).toEqual(expect.arrayContaining([
      { path: '/nodes/1/x', message: 'expected a finite number — it is missing' },
      { path: '/nodes/0/anchored', message: 'expected true or false — got an object {"enum":["false"]}' },
      { path: '/connectors', message: 'expected an array — got an object {"id":"c1"}' },
    ]));
  });

  it('checks symbols and the uses that place them', () => {
    const grid = (symbols: unknown, template: string) => ({ kind: 'grid', items: [], symbols, elements: { dot: { render: 'template', template } } });
    const sym = { valve: { viewBox: '0 0 24 24', markup: '<path d="M0 0"/>' } };
    expect(validateViewDocument(grid(sym, '<svg><use href="#valve"/><use href="#state-{{s}}"/></svg>'), { strict: true })).toEqual([]);
    expect(validateViewDocument(grid(sym, '<svg><defs><g id="dot"/></defs><use href="#dot"/></svg>'))).toEqual([]);
    expect(validateViewDocument(grid(sym, '<svg><use href="#pump"/></svg>'))).toEqual([
      { path: '/elements/dot/template', message: expect.stringContaining('no symbol "pump"') },
    ]);
    expect(validateViewDocument(grid({ valve: { viewBox: '0 0 24', markup: '<path d="{{d}}"/><script/>', fill: 'red' } }, '<b/>'), { strict: true }).map(i => i.path)).toEqual([
      '/symbols/valve/fill', '/symbols/valve/viewBox', '/symbols/valve/markup', '/symbols/valve/markup',
    ]);
  });

  it('says when a document is wrapped in its own "kind"', () => {
    expect(validateViewDocument({ kind: { kind: 'canvas', background: {}, nodes: [], connectors: [] } })).toEqual([
      { path: '/kind', message: expect.stringContaining('the document is wrapped one level too deep') },
    ]);
  });

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
    expect(validateViewDocument({ kind: 'table' })[0].message).toBe('expected "canvas" or "grid" — got the text "table"');
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
      expect(issues[0].message).toContain('A connector has: id, fromNodeId, toNodeId, label, labelAt, labelSize, style, bindings.');
      expect(issues[0].message).toContain('style: { stroke, strokeWidth, dash, arrow, route }');
    });

    it('checks a connector’s label, where it sits, and its style', () => {
      expect(strict(broken(d => { d.connectors[0].label = '26 Kbps'; d.connectors[0].labelAt = 0.25; d.connectors[0].style = { stroke: '#2563eb', strokeWidth: 2, dash: 'dotted', arrow: 'both' }; }))).toEqual([]);
      expect(strict(broken(d => { d.connectors[0].label = 3; d.connectors[0].labelAt = 1.5; d.connectors[0].style = { stroke: 'var(--x)', strokeWidth: 0, dash: 'dash', arrow: 'forward' }; })).map(i => i.path)).toEqual([
        '/connectors/0/label', '/connectors/0/labelAt', '/connectors/0/style/stroke', '/connectors/0/style/strokeWidth', '/connectors/0/style/dash', '/connectors/0/style/arrow',
      ]);
      expect(strict(broken(d => { d.connectors[0].style = { arrow: 'forward' }; }))[0].message).toBe('expected "none", "end" (pointing at toNodeId), "start" (pointing at fromNodeId) or "both"');
      expect(strict(broken(d => { d.connectors[0].style = { route: 'orthogonal' }; }))).toEqual([]);
      expect(strict(broken(d => { d.connectors[0].style = { route: 'curved' }; }))).toEqual([]);
      expect(strict(broken(d => { d.connectors[0].label = '도보 2분'; d.connectors[0].labelSize = 28; }))).toEqual([]);
      expect(strict(broken(d => { d.connectors[0].labelSize = 0; })).map(i => i.path)).toEqual(['/connectors/0/labelSize']);
      expect(strict(broken(d => { d.connectors[0].style = { route: 'elbow' }; }))).toEqual([
        { path: '/connectors/0/style/route', message: 'expected "straight", "orthogonal" (out of the facing side, one turn, into the other) or "curved" (bowing to the left of the way it runs)' },
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

    it('takes a bound label’s {{value}} pattern, and refuses one that names something else or has no label binding', () => {
      const bound = { label: { adapter: 's', ref: { path: '/bps' } } };
      expect(strict(broken(d => { d.connectors[0].label = '{{value | fixed:1}} Mbps'; d.connectors[0].bindings = bound; }))).toEqual([]);
      const messages = (label: string, bindings?: object) => strict(broken(d => { d.connectors[0].label = label; if (bindings) d.connectors[0].bindings = bindings; })).map(i => `${i.path} ${i.message}`);
      expect(messages('{{bps}} Mbps', bound)).toEqual(['/connectors/0/label "{{bps}}" names nothing — a connector label names its bound value as {{value}}']);
      expect(messages('{{value | round}}', bound)[0]).toContain('is not a format — use "fixed:N"');
      expect(messages('{{#value}}x{{/value}}', bound)[0]).toContain('takes no sections');
      expect(messages('{{value}} Mbps')).toEqual(['/connectors/0/label {{value}} is filled by a binding of label — add bindings.label, or write the label without it']);
      expect(validateViewDocument(broken(d => { d.connectors[0].label = '{{bps}}'; }))).toEqual([]);
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

    it('takes a theme colour’s name — a tone too — wherever a part is coloured, and says it among the forms — never as the board’s accent', () => {
      for (const colour of ['positive', 'warning', 'negative', 'accent', 'Negative', 'ok', 'alarm', 'idle', 'now']) {
        expect(strict(broken(d => { d.decorations[0].stroke = colour; d.connectors[0].style = { stroke: colour }; })), colour).toEqual([]);
      }
      expect(strict(broken(d => { d.decorations[0].stroke = 'var(--u-widget-positive)'; }))[0].message).toContain('or a theme colour: "positive", "warning", "negative", "ok", "info", "watch", "warn", "alarm", "off", "idle", "accent", "past", "now", "next"');
      expect(strict(broken(d => { d.accent = 'accent'; })).map(i => `${i.path} ${i.message}`)).toEqual([
        "/accent the board's accent is a colour itself — a theme name (positive, warning, negative, ok, info, watch, warn, alarm, off, idle, accent, past, now, next) goes where a part is coloured",
      ]);
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

describe('binding at', () => {
  const doc = (binding: unknown) => ({ kind: 'canvas', background: {}, connectors: [], nodes: [{ id: 'a', x: 0, y: 0, anchored: false, widget: { type: 'metric', bindings: { 'data.value': binding } } }] });

  it('takes where the value is inside what the adapter resolved, as a JSON Pointer', () => {
    expect(validateViewDocument(doc({ adapter: 'host', ref: 'asset-7', at: '/temp' }), { strict: true })).toEqual([]);
    expect(validateViewDocument(doc({ adapter: 'host', ref: 'asset-7', at: 'temp' }))).toEqual([
      { path: '/nodes/0/widget/bindings/data.value/at', message: 'expected where the value is inside what the adapter resolved — a JSON Pointer starting with "/"' },
    ]);
  });
});

describe('state rules', () => {
  const bound = { type: 'status', bindings: { 'data.value': { adapter: 'plant', ref: '/p1' } } };
  const node = (states: unknown, widget: unknown = bound) => ({ kind: 'canvas', background: {}, connectors: [], nodes: [{ id: 'a', x: 0, y: 0, anchored: false, widget, states }] });

  it('accepts a rule on a node and on a grid item, with looks', () => {
    const states = { from: 'data.value', map: { values: { Fault: 'fault' }, ranges: [{ min: 80, value: 'hot' }], otherwise: 'ok' }, looks: { fault: { outline: '#dc2626', blink: true }, ok: { hidden: true } } };
    expect(validateViewDocument(node(states), { strict: true })).toEqual([]);
    expect(validateViewDocument({ kind: 'grid', items: [{ id: 'a', widget: bound, states }] }, { strict: true })).toEqual([]);
  });

  it('names the bindings the widget has when from names none of them', () => {
    expect(validateViewDocument(node({ from: 'value', map: { values: { a: 'b' } } }))).toEqual([
      { path: '/nodes/0/states/from', message: '"value" names no binding of this widget — it has: data.value' },
    ]);
    expect(validateViewDocument(node({ from: 'value', map: { values: { a: 'b' } } }, { type: 'text' }))[0]).toMatchObject({
      path: '/nodes/0/states/from', message: expect.stringContaining('this widget has no bindings'),
    });
  });

  it('wants every name the map gives to be text', () => {
    const issues = validateViewDocument(node({ from: 'data.value', map: { values: { a: 2 }, ranges: [{ min: 1, value: {} }], otherwise: '' } }));
    expect(issues.map(i => i.path)).toEqual(['/nodes/0/states/map/values/a', '/nodes/0/states/map/ranges/0/value', '/nodes/0/states/map/otherwise']);
    expect(issues[0].message).toMatch(/^expected a state name/);
  });

  it('checks a look’s fields, and with strict the fields a rule and a look have', () => {
    const issues = validateViewDocument(node({ from: 'data.value', map: { values: { a: 'b' } }, looks: { b: { outline: 3, blink: 'yes', glow: true } }, colour: 'x' }), { strict: true });
    expect(issues.map(i => i.path).sort()).toEqual(['/nodes/0/states/colour', '/nodes/0/states/looks/b/blink', '/nodes/0/states/looks/b/glow', '/nodes/0/states/looks/b/outline'].sort());
  });

  it('wants a map', () => {
    expect(validateViewDocument(node({ from: 'data.value' }))).toEqual([{ path: '/nodes/0/states/map', message: 'expected an object — it is missing' }]);
  });
});

describe('naming a field a part does not have', () => {
  it('reads as a sentence, whatever the part is called', () => {
    const doc = { kind: 'grid', items: [], elements: { device: { render: 'template', template: '<b></b>', symbols: {} } } };
    expect(validateViewDocument(doc, { strict: true })).toEqual([
      { path: '/elements/device/symbols', message: expect.stringMatching(/^an element definition has no "symbols" — .* An element definition has: /) },
    ]);
  });
});

describe('triggers', () => {
  const nodes = [
    { id: 'pump', x: 0, y: 0, anchored: false, widget: { type: 'status' } },
    { id: 'valve', x: 200, y: 0, anchored: false, widget: { type: 'status' } },
  ];
  const canvas = (triggers: unknown) => ({ kind: 'canvas', background: {}, nodes, connectors: [], triggers });

  it('accepts each event and action, on both kinds', () => {
    const triggers = [
      { on: { event: 'click', node: 'pump' }, do: [{ action: 'open-link', url: 'https://cmms.example.com/assets/{{node}}' }] },
      { on: { event: 'element', node: 'valve', name: 'open' }, do: [{ action: 'emit', name: 'valve-open' }] },
      { on: { event: 'enter', node: 'pump', state: 'fault' }, when: { node: 'valve', state: ['open', 'stuck'] }, do: [{ action: 'focus', node: 'pump' }] },
      { on: { event: 'leave', node: 'pump', state: 'fault' }, do: [{ action: 'go-to-board', board: 'b2' }] },
      { on: { event: 'open' }, do: [{ action: 'open-link', url: '/share/?board=b2' }] },
    ];
    expect(validateViewDocument(canvas(triggers), { strict: true })).toEqual([]);
    const grid = { kind: 'grid', items: [{ id: 'pump', widget: { type: 'status' } }], triggers: [{ on: { event: 'click', node: 'pump' }, do: [{ action: 'emit', name: 'x' }] }] };
    expect(validateViewDocument(grid, { strict: true })).toEqual([]);
  });

  it('names the parts the board has when a trigger names one it does not', () => {
    expect(validateViewDocument(canvas([{ on: { event: 'click', node: 'pump9' }, do: [{ action: 'emit', name: 'x' }] }]))).toEqual([
      { path: '/triggers/0/on/node', message: '"pump9" names no node — the board has: pump, valve' },
    ]);
    const grid = { kind: 'grid', items: [{ id: 'a', widget: { type: 'gauge' } }], triggers: [{ on: { event: 'open' }, do: [{ action: 'focus', node: 'b' }] }] };
    expect(validateViewDocument(grid)).toEqual([{ path: '/triggers/0/do/0/node', message: '"b" names no item — the board has: a' }]);
  });

  it('lists the events and actions it knows', () => {
    const issues = validateViewDocument(canvas([{ on: { event: 'hover', node: 'pump' }, do: [{ action: 'write', value: 1 }] }]));
    expect(issues.map(i => i.path)).toEqual(['/triggers/0/on/event', '/triggers/0/do/0/action']);
    expect(issues[0].message).toMatch(/^expected one of "click", "element", "enter", "leave", "open"/);
    expect(issues[1].message).toMatch(/^expected one of "open-link", "focus", "emit", "go-to-board"/);
  });

  it('wants at least one action', () => {
    expect(validateViewDocument(canvas([{ on: { event: 'open' }, do: [] }]))).toEqual([{ path: '/triggers/0/do', message: 'expected at least one action' }]);
  });

  it('opens only an https address or a path on this installation', () => {
    const link = (url: string) => validateViewDocument(canvas([{ on: { event: 'open' }, do: [{ action: 'open-link', url }] }]));
    for (const url of ['javascript:alert(1)', 'http://plant.example.com', '//evil.example', '/\\evil.example', 'data:text/html,x']) {
      expect(link(url)[0], url).toMatchObject({ path: '/triggers/0/do/0/url', message: expect.stringMatching(/^expected an https:\/\/ address or a path on this installation/) });
    }
    expect(link('https://plant.example.com/a?b=1')).toEqual([]);
  });

  it('wants names of 1 to 64 characters, and a state for enter and leave', () => {
    const issues = validateViewDocument(canvas([
      { on: { event: 'element', node: 'pump', name: '' }, do: [{ action: 'emit', name: 'x'.repeat(65) }] },
      { on: { event: 'enter', node: 'pump' }, when: { node: 'pump', state: [] }, do: [{ action: 'emit', name: 'y' }] },
    ]));
    expect(issues.map(i => i.path)).toEqual(['/triggers/0/on/name', '/triggers/0/do/0/name', '/triggers/1/on/state', '/triggers/1/when/state']);
  });
});
