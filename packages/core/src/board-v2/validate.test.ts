import { describe, expect, it } from 'vitest';
import { validateBoardV2 } from './validate.js';

const data = {
  equipment: { from: 'plant', path: '/plant/equipment', list: '/value', key: 'id', fields: { state: { state: 'raw' } } },
  totals: { from: 'plant', path: '/plant/totals' },
};

/** A canvas board placing every part, one under the other. */
const canvas = (parts: Record<string, unknown>, more: Record<string, unknown> = {}) => ({
  version: 2,
  data,
  parts,
  layout: {
    kind: 'canvas', size: [400, 600],
    place: Object.fromEntries(Object.keys(parts).map((id, i) => [id, [10, 10 + i * 80, 150, 70]])),
    ...more,
  },
});

/** The problems with a board, without the advice. */
const issues = (board: unknown) => validateBoardV2(board).filter(i => !i.hint).map(i => `${i.at}: ${i.message}`);

describe('validateBoardV2', () => {
  it('takes a board that is right', () => {
    expect(issues(canvas({ a: { as: 'status-card', of: 'equipment[PR-01]', show: 'state' }, t: { as: 'stat', of: 'totals', show: 'count' } }))).toEqual([]);
  });

  it('asks for the version, and names the sections a board has', () => {
    expect(issues({ ...canvas({}), version: 1 })).toEqual(['/version: a board in this language says "version": 2']);
    expect(issues({ ...canvas({}), nodes: [] })).toEqual([
      '/nodes: a board has no "nodes" — its sections are version, board, statuses, symbols, elements, data, presets, parts, layout',
    ]);
  });

  it('says how to write an item of data, and names what there is', () => {
    expect(issues(canvas({ a: { as: 'stat', of: 'equipment/PR-01' } }))).toEqual([
      '/parts/a/of: an item of data is written "equipment[PR-01]" — "/" is only in the ids of parts "each" makes',
    ]);
    expect(issues(canvas({ a: { as: 'stat', of: 'machines[M1]' } }))).toEqual(['/parts/a/of: no data "machines" — data: equipment, totals']);
    expect(issues(canvas({ a: { as: 'stat', of: 'totals[T1]' } }))[0]).toContain('"totals" has no "list"');
  });

  it('checks presets and each', () => {
    expect(issues(canvas({ a: { use: 'card', of: 'equipment[PR-01]' } }))[0]).toBe('/parts/a/use: no preset "card" — presets: none');
    expect(issues(canvas({ a: { as: 'stat', each: 'equipment', of: 'equipment[PR-01]' } }))).toContain(
      '/parts/a/of: a part with "each" takes its items from "each" — leave "of" out',
    );
    expect(issues(canvas({ a: { as: 'stat', each: 'totals' } }))).toContain('/parts/a/each: "each" makes a part per item of a "list" — "totals" has none');
    expect(issues({ ...canvas({ a: { use: 'card', of: 'equipment[PR-01]' } }), presets: { card: { as: 'status-card' } } })).toEqual([]);
  });

  it('finds a part that is not placed, and a place of no part', () => {
    const board = canvas({ a: { as: 'stat', of: 'totals' } });
    (board.layout as Record<string, unknown>).place = { b: [0, 0] };
    expect(issues({ ...board, parts: { a: { as: 'stat', of: 'totals' } } })).toEqual([
      '/layout/place/b: no part "b" — parts: a',
      '/parts/a: "a" is not placed — put it in the layout, or remove it',
    ]);
  });

  it('lays out the items of a list with no key in a grid, and asks for a key to place them one by one', () => {
    const queue = { from: 'kitchen', path: '/tickets', list: '/value' };
    const parts = { t: { as: 'status-card', each: 'queue' } };
    expect(issues({ version: 2, data: { queue }, parts, layout: { kind: 'grid', items: [['t', 3]] } })).toEqual([]);
    expect(issues({ version: 2, data: { queue }, parts, layout: { kind: 'canvas', size: [400, 300], place: { t: { '1': [0, 0] } } } })).toEqual([
      '/layout/place/t: items placed one by one are named by their "key" — give "queue" a "key", or lay them out in a grid',
    ]);
  });

  it('places an each part item by item, inside its own entry', () => {
    const board = { version: 2, data, parts: { m: { as: 'status-card', each: 'equipment' } }, layout: { kind: 'canvas', size: [400, 300], place: { m: { 'PR-01': [0, 0, 100, 60] } } } };
    expect(issues(board)).toEqual([]);
    expect(issues({ ...board, layout: { ...board.layout, place: { 'm/PR-01': [0, 0] } } })).toEqual([
      '/layout/place/m/PR-01: "m/PR-01" is an item of the "each" part "m" — place it inside it: "m": { "PR-01": [x, y, w, h], … }',
      '/parts/m: "m" is not placed — put it in the layout, or remove it',
    ]);
  });

  it('stacks parts in a grid cell that holds a grid, and checks spans', () => {
    const parts = { map: { as: 'stat', of: 'totals' }, chart: { as: 'chart.bar', of: 'equipment' }, alarms: { as: 'list', of: 'equipment' } };
    const grid = (items: unknown[]) => ({ version: 2, data, parts, layout: { kind: 'grid', items } });
    expect(issues(grid([['map', 8], { grid: ['chart', ['alarms', 12]], span: 4 }]))).toEqual([]);
    expect(issues(grid(['map', { id: 'right', grid: ['chart', 'alarms'] }]))).toEqual([
      '/layout/items/1: "id" names the part a cell holds — a cell holding a canvas or a grid has none: leave "id" out',
      '/parts/chart: "chart" is not placed — put it in the layout, or remove it',
      '/parts/alarms: "alarms" is not placed — put it in the layout, or remove it',
    ]);
    expect(issues(grid([['map', 13], { grid: ['chart', 'alarms'], canvas: {} }]))).toEqual([
      '/layout/items/0/1: a span is a whole number of the 12 columns, 1 to 12',
      '/layout/items/1: a grid item holds one thing: a part ("id"), a "canvas" or a "grid"',
      '/parts/chart: "chart" is not placed — put it in the layout, or remove it',
      '/parts/alarms: "alarms" is not placed — put it in the layout, or remove it',
    ]);
  });

  it('lays a grid in a cell out in rows that fill the cell, of whole columns', () => {
    const parts = { map: { as: 'stat', of: 'totals' }, a: { as: 'stat', of: 'totals' }, b: { as: 'stat', of: 'totals' }, c: { as: 'stat', of: 'totals' } };
    const grid = (items: unknown[]) => ({ version: 2, data, parts, layout: { kind: 'grid', items } });
    expect(issues(grid([{ grid: [['a', 6], ['b', 6], 'c'], span: 4 }, ['map', 8]]))).toEqual([]);
    expect(issues(grid([{ grid: [['a', 6], 'b', ['c', 6]], span: 4 }, ['map', 8]]))).toEqual([
      '/layout/items/0/grid/1: each row of a grid in a cell fills the cell — the row before this item takes 6 of 12',
      '/layout/items/0/grid/2: each row of a grid in a cell fills the cell — the last row takes 6 of 12',
    ]);
    expect(issues(grid([{ grid: [['a', 4], ['b', 8]], span: 4 }, ['map', 8], 'c']))).toEqual([
      '/layout/items/0/grid/0/1: in a cell of 4 columns a span takes whole columns: one of 3, 6, 9, 12',
      '/layout/items/0/grid/1/1: in a cell of 4 columns a span takes whole columns: one of 3, 6, 9, 12',
    ]);
    expect(issues(grid([{ grid: [{ grid: ['a', 'b'] }, 'c'], span: 4 }, ['map', 8]]))).toEqual([
      '/layout/items/0/grid/0/grid: a grid in a grid in a cell is not drawn — lay its items out in the cell’s own rows',
    ]);
  });

  it('checks a group: its parts placed on its canvas, read of the group', () => {
    const pump = {
      as: 'group', size: [220, 140],
      parts: { card: { as: 'status-card', show: ['state'] }, level: { as: 'gauge', show: 'level' } },
      place: { card: [0, 0, 150, 140], level: [160, 0, 60, 140] },
    };
    const board = { version: 2, data, presets: { pump }, parts: { pumps: { use: 'pump', each: 'equipment' } }, layout: { kind: 'grid', items: ['pumps'] } };
    expect(issues(board)).toEqual([]);
    const broken = { ...board, presets: { pump: { ...pump, place: { card: [0, 0], valve: [1, 1] } } } };
    expect(issues(broken)).toEqual([
      '/parts/pumps/parts/level: "level" is not placed in the group — put it in its "place", or remove it',
      '/parts/pumps/place/valve: no part "valve" in the group — its parts: card, level',
    ]);
  });

  it('links parts, items of each parts and parts in groups; a link with a status reads a data item', () => {
    const parts = {
      P1: { as: 'status-card', of: 'equipment[P1]' },
      pumps: { as: 'group', each: 'equipment', size: [100, 60], parts: { valve: { as: 'stat', show: 'state' } }, place: { valve: [0, 0] } },
    };
    const board = (links: Record<string, unknown>) => ({
      version: 2, data, parts,
      layout: { kind: 'canvas', size: [800, 400], place: { P1: [0, 0], pumps: { P2: [200, 0] } }, links },
    });
    expect(issues(board({ a: { from: 'P1', to: 'pumps/P2' }, b: { from: 'pumps/P2/valve', to: 'P1', of: 'equipment[P2]', show: 'state' } }))).toEqual([]);
    expect(issues(board({ a: { from: 'P1', to: 'P9' }, b: { from: 'P1', to: 'pumps/P2', show: 'flow' } }))).toEqual([
      '/layout/links/a/to: no part "P9" to link',
      '/layout/links/b/show: a link shows a field "of" a data item — give "of" too',
    ]);
  });

  it('names the kinds there are for a kind that is not one, and asks what a kind shows', () => {
    const [unknown] = issues(canvas({ g: { as: 'timeline', of: 'equipment' } }));
    expect(unknown).toMatch(/^\/parts\/g\/as: unknown kind "timeline" — one of status-card, header, stat, /);
    expect(unknown).toContain('chart.gantt');
    expect(issues(canvas({ g: { as: 'chart.gantt', of: 'equipment' } }))).toEqual([]);
    expect(issues(canvas({ m: { as: 'metric', of: 'totals' }, s: { as: 'status', of: 'equipment[PR-01]' } }))).toEqual([
      '/parts/m/as: a board writes "stat" for the widget library\'s "metric" — "as": "stat"',
      '/parts/s/as: a board writes "stat-list" for the widget library\'s "status" — "as": "stat-list"',
    ]);
    expect(issues(canvas({ s: { as: 'stat' } }))).toEqual(['/parts/s/of: a stat shows data — give "of": "<data>" or "<data>[<key>]"']);
    expect(issues(canvas({ h: { as: 'header', title: 'Plant' }, l: { as: 'legend', of: 'totals' } }))).toEqual(['/parts/l/of: a legend reads no data — leave "of" out']);
  });

  it("takes a kind's options — the board's own and its widget's — and names them for a key that is neither", () => {
    expect(issues(canvas({
      g: { as: 'gauge', of: 'totals', show: 'load', form: 'tank', max: 120 },
      l: { as: 'list', of: 'equipment', primary: 'name', maxItems: 5 },
      c: { as: 'chart.bar', of: 'equipment', x: 'name', y: 'load', horizontal: true },
      m: { as: 'marker', of: 'equipment[PR-01]', shape: 'ring' },
    }))).toEqual([]);
    expect(issues(canvas({ s: { as: 'stat', of: 'totals', show: 'load', colour: 'red' }, l: { as: 'label', title: 'Line 1', size: 14 } }))).toEqual([
      '/parts/s/colour: "colour" is not an option — options of a stat: trend, format',
      '/parts/l/size: "size" is not an option — a label takes no options',
    ]);
    expect(issues(canvas({
      a: { as: 'status-card', of: 'equipment[PR-01]', meter: 'load', note: 'Seal {{seal}}', subtitle: 'Line 1' },
      b: { as: 'status-card', of: 'equipment[PR-02]', meter: { field: 'load', min: 10, max: 5, form: 'dial', colour: 'red' } },
      c: { as: 'status-card', of: 'equipment[PR-03]', meter: 42 },
    }))).toEqual([
      '/parts/b/meter/colour: a meter is "<field>" or { "field": "<field>", "min"?, "max"?, "form"?: "bar" | "ring" }',
      '/parts/b/meter/max: a meter’s max is above its min (10)',
      '/parts/b/meter/form: a meter’s form is "bar" or "ring"',
      '/parts/c/meter: a meter is "<field>" or { "field": "<field>", "min"?, "max"?, "form"?: "bar" | "ring" }',
    ]);
    // A preset's key is the preset's mistake, said once however many parts use it.
    const board = { ...canvas({ a: { use: 'card', of: 'equipment[PR-01]' }, b: { use: 'card', of: 'equipment[PR-02]' } }), presets: { card: { as: 'status-card', glow: true } } };
    expect(issues(board)).toEqual(['/presets/card/glow: "glow" is not an option — options of a status-card: meter, subtitle, note, state, overflow']);
  });

  it('reports a wrong "of" once, not again in what reads through it', () => {
    const board = {
      ...canvas({ a: { as: 'element', element: 'tank', of: 'tanks[T1]', title: '{{name}}', bind: { level: 'level.tone' } } }),
      elements: { tank: { template: '<svg style="--l: {{level}}"></svg>', props: { level: 'number' } } },
    };
    expect(issues(board)).toEqual(['/parts/a/of: no data "tanks" — data: equipment, totals']);
  });

  it('reads {{field}} in a title of what the part reads, and {{key}} as its item', () => {
    expect(issues(canvas({ a: { as: 'status-card', of: 'equipment[PR-01]', title: '{{key}} · {{state}}' } }))).toEqual([]);
    expect(issues(canvas({ h: { as: 'header', title: 'Line {{line}}' }, a: { as: 'stat', of: 'totals', title: '{{ count + 1 }}' } }))).toEqual([
      '/parts/h/title: "{{line}}" reads a field, but this reads no data — give "of"',
      '/parts/a/title: "{{ count + 1 }}" — write {{field}} with a field name, or {{key}} for the item\'s key',
    ]);
  });

  it('checks what a field means: a state names statuses, names take the same two forms', () => {
    const board = {
      ...canvas({}),
      statuses: { running: { tone: 'ok' } },
      data: {
        pumps: {
          from: 'plant', path: '/pumps', list: '/value', key: 'id',
          fields: {
            state: { state: { run: 'running', trip: 'alarm', '*': 'stopped' } },
            temp: { state: [60, 'ok', 80, 'alarm'], digits: 1.5 },
            level: { state: ['ok', 80, 'warn', 70, 'alarm'], names: ['low', 30, 'mid', 70, 'high'] },
            weather: { names: { '1': '맑음', '*': '흐림' }, at: 'sky' },
          },
        },
      },
    };
    expect(issues(board)).toEqual([
      '/data/pumps/fields/state/state/*: no status "stopped" — declare it under /statuses (running) or use a tone',
      '/data/pumps/fields/temp/digits: "digits" is a whole number of decimal places',
      '/data/pumps/fields/temp/state: bands start with the word below the first number — ["ok", 60, "warn"], not [60, "ok", …]',
      '/data/pumps/fields/level/state/3: the numbers of bands go up',
      '/data/pumps/fields/weather/at: "at" is where the value lives in an item, starting with "/"',
    ]);
  });

  it('checks shapes and the look', () => {
    const board = {
      ...canvas({}, {
        shapes: {
          zone: { box: [0, 0, 100, 60], label: 'Zone A', tone: 'accent' },
          pipe: { line: [[0, 0], [100, 50]] },
          bad: { line: [[0, 0]] },
          rel: { path: 'm 0 0 l 10 10' },
          two: { box: [0, 0, 1, 1], text: 'x', at: [0, 0] },
          note: { text: 'here' },
        },
      }),
      board: { theme: 'dim', skin: { frame: 'stamp', density: 'compact' } },
    };
    expect(issues(board)).toEqual([
      '/board/theme: a theme is "light" or "dark"',
      '/board/skin/frame: "stamp" is not a frame — use card · flat · glow · plate · ticket · postage · tape',
      '/layout/shapes/bad/line: a line is two or more [x, y] points',
      '/layout/shapes/rel/path: a path uses absolute M · L · C · Q · Z and numbers only',
      '/layout/shapes/two: a shape is one of a "box", a "text" with "at", a "line" or a "path"',
      '/layout/shapes/note/at: a text needs "at": [x, y]',
    ]);
  });

  it("checks the board's elements and the parts that draw them", () => {
    const elements = {
      tank: { template: '<svg><rect style="--l: {{level}}"/></svg><b>{{name}}</b><i class="{{state}}"></i>', props: { level: 'number', name: 'string', state: 'string' } },
      bad: { template: '<b>{{ level * 2 }}</b>', props: { level: 'float' } },
    };
    const board = {
      ...canvas({
        t: { as: 'element', element: 'tank', of: 'equipment[PR-01]', props: { name: 'T1' }, bind: { level: 'state', state: 'state.tone' } },
        u: { as: 'element', element: 'tank', of: 'totals', props: { colour: 'red' }, bind: { level: 'count.status', zz: 'count' } },
        v: { as: 'element', element: 'pump' },
      }),
      elements,
    };
    expect(issues(board)).toEqual([
      '/elements/bad/props/level: "float" is not a prop type — number · string · boolean · list · object',
      '/elements/bad/template: "{{ level * 2 }}" — a hole is a prop this element declares (level); compute with CSS calc() on a prop, not inside the braces',
      '/parts/u/props/colour: "tank" has no prop "colour" — props: level, name, state',
      '/parts/u/bind/level: "count" has no "state" in /data/totals/fields — its status needs one',
      '/parts/u/bind/zz: "tank" has no prop "zz" — props: level, name, state',
      '/parts/v/element: no element "pump" — elements: tank, bad',
    ]);
    // Inside a list's section a hole names a field of its item; still nothing is computed there.
    const listed = {
      gates: { template: '{{#gates}}<li style="--l: {{load}}">{{name}} {{inbound | grouped:0}}</li>{{/gates}}{{^gates}}none{{/gates}}<b>{{title}}</b>', props: { gates: 'list', title: 'string' } },
      sums: { template: '{{#rows}}<i>{{ a + b }}</i>{{/rows}}{{count}}', props: { rows: 'list' } },
    };
    expect(issues({ ...canvas({}), elements: listed })).toEqual([
      '/elements/sums/template: "{{ a + b }}" — a hole is a prop this element declares (rows); compute with CSS calc() on a prop, not inside the braces',
      '/elements/sums/template: "{{count}}" — a hole is a prop this element declares (rows); compute with CSS calc() on a prop, not inside the braces',
    ]);
    expect(issues({ ...canvas({}), symbols: { L1: { path: 'M0 0h1v1z' }, pump: { markup: '<path/>' } } })).toEqual([
      `/symbols/L1: a symbol's name is lowercase letters, digits and "-", starting with a letter — not "L1"`,
      '/symbols/pump/path: a symbol is { "viewBox"?, "path": "M … Z" } — an SVG path in its own coordinates',
    ]);
    expect(issues({ ...canvas({}), elements: { 'u-board-dial': { template: '<svg/>' }, Dial: { template: '<svg/>' } } })).toEqual([
      `/elements/u-board-dial: "u-board-" names U-Board's own drawings — name "u-board-dial" otherwise`,
      `/elements/Dial: an element's name is lowercase letters, digits and "-", starting with a letter — not "Dial"`,
    ]);
  });

  it('advises a built-in for an element that draws nothing of its own, without failing the board', () => {
    const board = {
      ...canvas({ c: { as: 'element', element: 'card', of: 'totals' }, d: { as: 'element', element: 'dial', of: 'totals' } }),
      elements: {
        card: { template: '<b>{{a}}</b><span>{{b}}</span>', props: { a: 'string', b: 'string' } },
        dial: { template: '<svg><circle r="{{a}}"/></svg>', props: { a: 'number' } },
      },
    };
    expect(validateBoardV2(board)).toEqual([{
      at: '/elements/card',
      message: '"card" draws no shape of its own — a title, a status and a few values are a status-card, stat or stat-list; keep an element for a drawing no built-in makes',
      hint: true,
    }]);
  });

  it('checks a data read: where on a list, the request time, and statuses', () => {
    const board = {
      ...canvas({}),
      statuses: { down: { tone: 'red' }, slow: { tone: 'warn', emphasis: 'glow' } },
      data: {
        air: { from: 'gov', path: '/air?date={{now:yyyyMMdd}}', list: '/items', key: 'station', where: { item: 'PM10' }, now: { delay: 2400, step: 3600 }, zone: 'Asia/Seoul' },
        bad: { from: 'gov', path: 'air', where: { item: ['PM10'] }, now: { step: 0 } },
      },
    };
    expect(issues(board)).toEqual([
      '/statuses/down/tone: "red" is not a tone — use ok · info · watch · warn · alarm · off · idle · accent · past · now · next',
      '/statuses/slow/emphasis: "glow" is not an emphasis — use invert · hatch · stamp · blink',
      '/data/bad/path: a data read needs "path": the request, starting with "/" — or "ref" for an adapter that is not an HTTP connector',
      '/data/bad/where: "where" keeps the items of a "list" whose fields equal its values: { "field": value }',
      '/data/bad/now/step: "step" is how often the source has new data, in seconds (more than 0)',
    ]);
  });

  it('takes an adapter’s own reference as one item that says itself how current it is', () => {
    const read = (q: Record<string, unknown>, show = 'load') => issues({ version: 2, data: { pump: { from: 'cmms', ref: 'pump-a', ...q } }, parts: { s: { as: 'stat', of: 'pump', show } }, layout: { kind: 'grid', items: ['s'] } });
    expect(read({ fields: { load: { unit: '%' } } })).toEqual([]);
    expect(read({ fields: { load: { at: '' } } })).toEqual([]);
    expect(read({ path: '/pumps' })).toEqual(['/data/pump/path: a data read is either asked a "path" (an HTTP connector) or given a "ref" (another adapter) — not both']);
    expect(read({ list: '/value', fresh: 60 })).toEqual([
      '/data/pump/list: a "ref" read answers one item and says itself how current it is — "list" belongs to a "path" read',
      '/data/pump/fresh: a "ref" read answers one item and says itself how current it is — "fresh" belongs to a "path" read',
    ]);
    expect(issues({ version: 2, data: { q: { from: 'gov', path: '/x', fields: { v: { at: '' } } } }, parts: { s: { as: 'stat', of: 'q', show: 'v' } }, layout: { kind: 'grid', items: ['s'] } }))
      .toEqual(['/data/q/fields/v/at: "at" is where the value lives in an item, starting with "/"']);
  });

  it('says a part binds only what it reads when a bind names another data', () => {
    const board = {
      version: 2,
      data: { gate: { from: 'x', path: '/gate' }, summary: { from: 'x', path: '/summary' } },
      elements: { box: { template: '<b>{{a}}</b>', props: { a: 'number' } } },
      parts: { g: { as: 'element', element: 'box', of: 'gate', bind: { a: 'summary.queue' } } },
      layout: { kind: 'grid', items: ['g'] },
    };
    expect(issues(board)).toEqual(['/parts/g/bind/a: "summary.queue" reads "summary", but this part reads "gate" — a part binds only fields of what it reads; show "summary" with a part of its own (in a group they sit together)']);
    expect(issues({ ...board, parts: { g: { ...board.parts.g, bind: { a: '190' } } } })).toEqual(['/parts/g/bind/a: "190" is a fixed value — it goes in "props"; "bind" names a field of "gate"']);
  });

  it('places a part once — an each part makes one per item by itself', () => {
    const board = { version: 2, data: { b: { from: 'x', path: '/b', list: '/v', key: 'id' } }, parts: { berth: { as: 'status-card', each: 'b' }, h: { as: 'header', title: 'H' } }, layout: { kind: 'grid', items: ['h', ['berth', 4], ['berth', 4]] } };
    expect(issues(board)).toEqual(['/layout/items/2/0: "berth" is placed twice — an "each" part makes one per item by itself: place it once']);
    expect(issues({ ...board, layout: { kind: 'grid', items: ['h', ['berth', 4], 'h'] } })).toEqual(['/layout/items/2: "h" is placed twice — a part is placed once; for another like it, add a part (a preset keeps them alike)']);
  });

  it('takes the time an answer says its whole list is of, only for a list', () => {
    const read = (q: Record<string, unknown>) => issues({ version: 2, data: { q: { from: 'bank', path: '/types', ...q } }, parts: { c: { as: 'chart.bar', of: 'q' } }, layout: { kind: 'grid', items: ['c'] } });
    expect(read({ list: '/value', answerTime: '/updatedAt' })).toEqual([]);
    expect(read({ list: '/value', answerTime: 'updatedAt' })).toEqual(['/data/q/answerTime: "answerTime" is where the answer holds its time, a JSON Pointer starting with "/"']);
    expect(read({ time: '/observedAt' })).toEqual(['/data/q/time: "time" names the field holding when the source observed the item — "observedAt", not a JSON Pointer; a field that lives deeper says where with its "at"']);
    expect(read({ answerTime: '/updatedAt' })).toEqual(['/data/q/answerTime: without a "list" the answer is the item — its time is "time"']);
  });
});
