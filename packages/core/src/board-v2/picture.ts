// A board in the language's second version, drawn by the renderer it has today: the picture model is the view
// document the renderer reads (nodes and grid items holding widgets, with their bindings), made from the board. It is
// an inside representation — not stored and not a public contract — so the language can change without rewriting the
// renderer.
//
// The board is taken as valid (`validateBoardV2` first): what is wrong in it is reported there, with where and how to
// write it instead. What the picture model cannot draw yet is a `PictureError`.

import type { Binding, CellCanvas, Connector, GridItem, ItemField, Node, Shape as ViewShape, ValueMap, ValueRange, ViewDocument, Widget } from '../view-document.js';
import type { HttpRef } from '../http-ref.js';
import { partKind } from './kinds.js';
import { TONES } from './types.js';
import type { BoardV2, CanvasLayout, Field, GridItem as V2GridItem, Link, Part, Place, Shape, StateRule, Status, Tone, ValueMapping } from './types.js';

/** Something in a board the picture model does not draw yet. */
export class PictureError extends Error {
  constructor(readonly at: string, message: string) {
    super(`${at}: ${message}`);
    this.name = 'PictureError';
  }
}

export interface PictureOptions {
  /**
   * The keys of a data list's items, for a part made per item (`each`) where the board does not name them — a grid
   * lays out one item per key. A canvas names its items where it places them.
   */
  keysOf?: (data: string) => readonly string[];
}

/** The tone and the words a raw value maps to, through a field's `state`. */
interface StateMaps {
  tone: ValueMap<string>;
  status: ValueMap<string>;
  emphasis?: ValueMap<string>;
}

/** Make the view document that draws `board`. */
export function toViewDocument(board: BoardV2, options: PictureOptions = {}): ViewDocument {
  const data = board.data ?? {};
  const statuses = board.statuses ?? {};
  const presets = board.presets ?? {};

  // ── what a part reads ──

  /** The data an `of` names, and the item when it names one. */
  const target = (of: string): { query: string; item?: string } => {
    const m = /^([\w-]+)(?:\[([^\]]+)\])?$/.exec(of)!;
    return m[2] === undefined ? { query: m[1]! } : { query: m[1]!, item: m[2] };
  };

  /** Where a binding reads: the request, the item, the value in it, and how current it must be. */
  const refFor = (query: string, item: string | undefined, field: string | undefined, at: string): HttpRef => {
    const q = data[query]!;
    const valueAt = field === undefined ? undefined : q.fields?.[field]?.at ?? `/${field}`;
    const ref: HttpRef = { path: q.path };
    if (item !== undefined) {
      if (q.key !== undefined) {
        ref.item = { list: q.list!, where: { ...q.where, [q.key]: item } };
        if (valueAt !== undefined) ref.valuePath = valueAt;
      } else {
        ref.valuePath = `${q.list}/${item}${valueAt ?? ''}`;
      }
    } else {
      if (q.where !== undefined) throw new PictureError(at, `reading the whole of "${query}" kept by "where" is not drawn yet — read an item of it`);
      const path = `${q.list ?? ''}${valueAt ?? ''}`;
      if (path !== '') ref.valuePath = path;
    }
    // The time the source observed a value is the item's — a whole list has one per row, not one of its own.
    if (q.time !== undefined && (item !== undefined || q.list === undefined)) ref.observedAtPath = `/${q.time}`;
    if (q.zone !== undefined) ref.timeZone = q.zone;
    if (q.fresh !== undefined) ref.maxAgeSeconds = q.fresh;
    if (q.now !== undefined) {
      ref.requestTime = {
        ...(q.now.delay !== undefined ? { delaySeconds: q.now.delay } : {}),
        ...(q.now.step !== undefined ? { stepSeconds: q.now.step } : {}),
      };
    }
    return ref;
  };

  const fieldOf = (query: string | undefined, name: string): Field => (query === undefined ? {} : data[query]?.fields?.[name] ?? {});

  /** A status by name: one the board declares, or a tone standing for itself. */
  const statusOf = (name: string): Status => statuses[name] ?? { tone: name as Tone };

  /** A mapping as a value map, each word turned into what `to` says of it. */
  const mapOf = <V>(mapping: ValueMapping, to: (word: string) => V): ValueMap<V> => {
    if (Array.isArray(mapping)) {
      const ranges: ValueRange<V>[] = [];
      for (let i = 0; i < mapping.length; i += 2) {
        const min = i > 0 ? (mapping[i - 1] as number) : undefined;
        const max = i + 1 < mapping.length ? (mapping[i + 1] as number) : undefined;
        ranges.push({ ...(min !== undefined ? { min } : {}), ...(max !== undefined ? { max } : {}), value: to(String(mapping[i])) });
      }
      return { ranges };
    }
    const values: Record<string, V> = {};
    let otherwise: V | undefined;
    for (const [raw, word] of Object.entries(mapping)) {
      if (raw === '*') otherwise = to(word);
      else values[raw] = to(word);
    }
    return { values, ...(otherwise !== undefined ? { otherwise } : {}) };
  };

  /** How a field's state colours and names a value: the status of each raw value, as a tone and as words. */
  const stateMaps = (rule: StateRule): StateMaps => {
    // "raw": the value already is a status name — a declared status, or a tone.
    const mapping: ValueMapping = rule === 'raw'
      ? { ...Object.fromEntries(Object.keys(statuses).map(n => [n, n])), '*': 'off' }
      : rule;
    const withTones = rule === 'raw' ? { values: Object.fromEntries(TONES.map(t => [t, t])) } : undefined;
    const merge = (m: ValueMap<string>, extra?: ValueMap<string>): ValueMap<string> => (extra ? { ...m, values: { ...extra.values, ...m.values } } : m);
    const tone = merge(mapOf(mapping, w => statusOf(w).tone), withTones);
    // A bare tone has no words of its own — the widget names it in its locale.
    const status = merge(mapOf(mapping, w => statuses[w]?.label ?? (w in statuses ? w : '')), withTones && { values: Object.fromEntries(TONES.map(t => [t, ''])) });
    const emphasised = Object.values(statuses).some(s => s.emphasis !== undefined);
    return { tone, status, ...(emphasised ? { emphasis: merge(mapOf(mapping, w => statuses[w]?.emphasis ?? '')) } : {}) };
  };

  // ── parts ──

  /** A part as drawn: its preset's settings under its own. */
  const resolve = (part: Part): Part => (part.use !== undefined ? { ...presets[part.use], ...part } : part);

  /** The widget a part is drawn with, reading `query[item]` — or the whole of `query` when there is no item. */
  const widgetFor = (raw: Part, at: string, reads?: { query: string; item?: string }): Widget => {
    const part = resolve(raw);
    const { as, use: _use, of: _of, each: _each, title, show, ...options } = part;
    const kind = partKind(as!)!;
    const fields = show === undefined ? [] : Array.isArray(show) ? show : [show];
    const query = reads?.query;
    const item = reads?.item;
    const bindings: Record<string, Binding> = {};
    const bind = (key: string, field: string | undefined, map?: ValueMap) => {
      if (query === undefined) return;
      bindings[key] = { adapter: data[query]!.from, ref: refFor(query, item, field, at), ...(map ? { map } : {}) };
    };
    const field = (name: string) => fieldOf(query, name);
    const formatOf = (f: Field) => f.format ?? (f.digits !== undefined ? `number:${f.digits}` : undefined);
    /** A field's value bound at `key`, in its words when it names them. */
    const bindValue = (key: string, name: string) => bind(key, name, field(name).names ? mapOf(field(name).names!, w => w) : undefined);
    /** A field's state bound at `<prefix>tone`, and at its words and emphasis where the widget takes them. */
    const bindState = (prefix: string, name: string, takes: { words?: boolean; emphasis?: boolean } = {}) => {
      const rule = field(name).state;
      if (rule === undefined) return;
      const maps = stateMaps(rule);
      bind(`${prefix}tone`, name, maps.tone);
      if (takes.words) bind(`${prefix}status`, name, maps.status);
      if (takes.emphasis && maps.emphasis) bind(`${prefix}emphasis`, name, maps.emphasis);
    };
    /**
     * The whole list bound at `key`, each item gaining `gained` — a row's tone from its state (`<field>@tone`), a field
     * under the name the widget reads it by.
     */
    const bindList = (key: string, gained: Record<string, ItemField>) => {
      bind(key, undefined);
      if (bindings[key] && Object.keys(gained).length > 0) bindings[key] = { ...bindings[key]!, itemFields: gained };
    };
    /** The fields a row gains for `name`: its tone when the field has a state, its words when it names them. */
    const rowFields = (name: string | undefined): Record<string, ItemField> => {
      if (name === undefined) return {};
      const f = field(name);
      return {
        ...(f.state !== undefined ? { [`${name}@tone`]: { from: name, map: stateMaps(f.state).tone } } : {}),
        ...(f.names !== undefined ? { [`${name}@name`]: { from: name, map: mapOf(f.names, w => w) } } : {}),
      };
    };
    /** The field a row shows `name` by: its words when it names them, else the field itself. */
    const shown = (name: string) => (field(name).names !== undefined ? `${name}@name` : name);
    /** The first of `names` whose field has a state. */
    const stateIn = (names: readonly (string | undefined)[]) => names.find(n => n !== undefined && field(n).state !== undefined);
    const text = (t: string | undefined, key: string): string | undefined => {
      if (t === undefined) return undefined;
      const holes = [...t.matchAll(/\{\{\s*([\w.-]+)\s*\}\}/g)];
      if (holes.length === 0) return t;
      const only = /^\{\{\s*([\w.-]+)\s*\}\}$/.exec(t);
      if (only && only[1] !== 'key') { bindValue(key, only[1]!); return ''; }
      if (holes.every(h => h[1] === 'key')) return t.replace(/\{\{\s*key\s*\}\}/g, item ?? '');
      throw new PictureError(`${at}/title`, `a text mixing words and fields ("${t}") is not drawn yet — write the field alone, or {{key}}`);
    };

    switch (kind.kind) {
      case 'stat': {
        const name = fields[0]!;
        const f = field(name);
        bindValue('data.value', name);
        bindState('data.', name, { emphasis: true });
        const format = formatOf(f);
        return {
          type: 'metric',
          props: {
            data: { label: text(title, 'data.label') ?? f.label ?? name, value: '', ...(f.unit ? { unit: f.unit } : {}) },
            ...(format || Object.keys(options).length ? { options: { ...(format ? { format } : {}), ...options } } : {}),
          },
          bindings,
        };
      }
      case 'stat-list': {
        const rows = fields.map((name, i) => {
          const f = field(name);
          bindValue(`data.${i}.value`, name);
          bindState(`data.${i}.`, name);
          const format = formatOf(f);
          return { label: f.label ?? name, value: '', ...(f.unit ? { unit: f.unit } : {}), ...(format ? { format } : {}) };
        });
        return { type: 'kv', props: { data: rows, ...(Object.keys(options).length ? { options } : {}) }, bindings };
      }
      case 'status-card': {
        // The first field with a state is the card's state; the others are its readings.
        const stateField = fields.find(n => field(n).state !== undefined);
        if (stateField) bindState('data.', stateField, { words: true, emphasis: true });
        const readings = fields.filter(n => n !== stateField).map((name, i) => {
          const f = field(name);
          bindValue(`data.readings.${i}.value`, name);
          bindState(`data.readings.${i}.`, name);
          const format = formatOf(f);
          return { label: f.label ?? name, value: '', ...(f.unit ? { unit: f.unit } : {}), ...(format ? { format } : {}) };
        });
        return {
          type: 'status-card',
          props: { data: { title: text(title, 'data.title') ?? item ?? '', ...(readings.length ? { readings } : {}) }, ...(Object.keys(options).length ? { options } : {}) },
          bindings,
        };
      }
      case 'gauge': {
        const name = fields[0]!;
        const f = field(name);
        bindValue('data.value', name);
        bindState('data.', name);
        const format = formatOf(f);
        return {
          type: 'gauge',
          props: {
            data: { value: 0 },
            options: { ...(f.unit ? { unit: f.unit } : {}), ...(format ? { format } : {}), ...(title !== undefined ? { subtitle: text(title, 'options.subtitle') } : {}), ...options },
          },
          bindings,
        };
      }
      case 'table': {
        // A column whose field has a state colours each of its cells by it.
        bindList('data', Object.assign({}, ...fields.map(rowFields)));
        const columns = fields.map(name => {
          const f = field(name);
          const format = formatOf(f);
          return {
            field: shown(name), label: f.label ?? name,
            ...(f.unit ? { unit: f.unit } : {}), ...(format ? { format } : {}), ...(f.state !== undefined ? { toneField: `${name}@tone` } : {}),
          };
        });
        return {
          type: 'table',
          props: { ...(title !== undefined ? { title: text(title, 'title') } : {}), data: [], ...(columns.length ? { mapping: { columns } } : {}), ...(Object.keys(options).length ? { options } : {}) },
          bindings,
        };
      }
      case 'list': {
        // Rows: the first field (or `primary`) as the line, `secondary` under it, `time` before it, coloured by a state.
        const { primary = fields[0], secondary, time, state, max, variant, ...rest } = options as Record<string, string | undefined> & { max?: number };
        const tone = stateIn([state, ...fields]);
        bindList('data', Object.assign({}, rowFields(primary), rowFields(secondary), rowFields(tone)));
        const mapping = {
          ...(primary !== undefined ? { primary: shown(primary) } : {}),
          ...(secondary !== undefined ? { secondary: shown(secondary) } : {}),
          ...(time !== undefined ? { time } : {}),
          ...(tone !== undefined ? { tone: `${tone}@tone` } : {}),
        };
        const listOptions = { ...rest, ...(max !== undefined ? { maxItems: max } : {}), ...(variant === 'tiles' ? { layout: 'tiles' } : {}) };
        return {
          type: 'list',
          props: { ...(title !== undefined ? { title: text(title, 'title') } : {}), data: [], mapping, ...(Object.keys(listOptions).length ? { options: listOptions } : {}) },
          bindings,
        };
      }
      case 'bar-list':
      case 'status-grid': {
        // Each item's label, value and tone, under the names the widget reads.
        const { label, value, state, ...rest } = options as Record<string, string | undefined>;
        const labelField = kind.kind === 'bar-list' ? label ?? data[query!]?.key : label ?? fields[0] ?? data[query!]?.key;
        const valueField = kind.kind === 'bar-list' ? value ?? fields[0] : value ?? (fields[0] !== labelField ? fields[0] : undefined);
        const tone = stateIn([state, ...fields]);
        const toneMap = tone !== undefined ? field(tone).state : undefined;
        bindList('data', {
          ...(labelField !== undefined ? { label: { from: labelField, ...(field(labelField).names ? { map: mapOf(field(labelField).names!, w => w) } : {}) } } : {}),
          ...(valueField !== undefined ? { value: { from: valueField } } : {}),
          ...(tone !== undefined && toneMap !== undefined ? { tone: { from: tone, map: stateMaps(toneMap).tone } } : {}),
        });
        return {
          type: kind.kind,
          props: { ...(title !== undefined ? { title: text(title, 'title') } : {}), data: [], ...(Object.keys(rest).length ? { options: rest } : {}) },
          bindings,
        };
      }
      case 'header': {
        const { kicker, subtitle, clock, ...rest } = options as { kicker?: string; subtitle?: string; clock?: unknown };
        return {
          type: 'header',
          props: {
            data: {
              text: text(title, 'data.text') ?? '',
              ...(kicker !== undefined ? { kicker } : {}),
              ...(subtitle !== undefined ? { subtitle } : {}),
              ...(clock === true ? { clock: true } : {}),
            },
            ...(Object.keys(rest).length ? { options: rest } : {}),
          },
          bindings,
        };
      }
      default: {
        if (kind.widget !== undefined && kind.widget.startsWith('chart.')) {
          // A chart reads a list; its mapping (x, y, …) and options sit on the part.
          bind('data', undefined);
          const mappingKeys = CHART_MAPPING;
          const mapping = Object.fromEntries(Object.entries(options).filter(([k]) => mappingKeys.includes(k)));
          const rest = Object.fromEntries(Object.entries(options).filter(([k]) => !mappingKeys.includes(k)));
          return {
            type: kind.widget,
            props: {
              ...(title !== undefined ? { title: text(title, 'title') } : {}),
              data: [],
              ...(Object.keys(mapping).length ? { mapping } : {}),
              ...(Object.keys(rest).length ? { options: rest } : {}),
            },
            bindings,
          };
        }
        throw new PictureError(`${at}/as`, `a ${kind.kind} is not drawn yet`);
      }
    }
  };

  /** The data a part reads, for an item `key` of an `each` part or as its `of` says. */
  const readsOf = (part: Part, key?: string): { query: string; item?: string } | undefined => {
    const p = resolve(part);
    if (p.each !== undefined) return { query: p.each, ...(key !== undefined ? { item: key } : {}) };
    return p.of !== undefined ? target(p.of) : undefined;
  };

  // ── layouts ──

  const box = (place: Place) => ({ x: place[0], y: place[1], ...(place.length === 4 ? { width: place[2], height: place[3] } : {}) });

  /** A canvas: its parts placed as nodes, its shapes as decorations, its links as connectors. `prefix` keeps the ids of
   *  a cell's shapes and links apart from another cell's. */
  const canvasOf = (canvas: Omit<CanvasLayout, 'kind'>, at: string, prefix = ''): Pick<CellCanvas, 'nodes' | 'connectors' | 'decorations'> => {
    const nodes: Node[] = [];
    for (const [id, place] of Object.entries(canvas.place)) {
      const part = board.parts[id]!;
      if (Array.isArray(place)) {
        nodes.push({ id, ...box(place), anchored: true, widget: widgetFor(part, `/parts/${id}`, readsOf(part)) });
      } else {
        for (const [key, p] of Object.entries(place)) {
          nodes.push({ id: `${id}/${key}`, ...box(p), anchored: true, widget: widgetFor(part, `/parts/${id}`, readsOf(part, key)) });
        }
      }
    }
    const decorations = Object.entries(canvas.shapes ?? {}).map(([id, shape]) => shapeOf(shape, `${prefix}shape.${id}`, `${at}/shapes/${id}`));
    const connectors = Object.entries(canvas.links ?? {}).map(([id, link]) => connectorOf(link, `${prefix}link.${id}`, `${at}/links/${id}`));
    return { nodes, connectors, ...(decorations.length > 0 ? { decorations } : {}) };
  };

  /** A shape as a decoration: a box with its label, or a text at a point — in its tone, else the board's muted line. */
  const shapeOf = (shape: Shape, id: string, at: string): ViewShape => {
    if (shape.box !== undefined) {
      const [x, y, width, height] = shape.box;
      return {
        id, type: 'rect', x, y, width, height, fill: 'none', stroke: shape.tone ?? 'idle', strokeWidth: shape.width ?? 1.5,
        ...(shape.dash ? { dash: 'dashed' as const } : {}),
        ...(shape.label !== undefined ? { label: shape.label, labelAt: 'top-start' as const } : {}),
      };
    }
    if (shape.text !== undefined && shape.at !== undefined) {
      return { id, type: 'text', x: shape.at[0], y: shape.at[1], text: shape.text, fill: shape.tone ?? 'next', ...(shape.size !== undefined ? { fontSize: shape.size } : {}) };
    }
    throw new PictureError(at, 'a line or a path is not drawn yet');
  };

  /**
   * A link as a connector between the nodes of its parts. With `of` and `show` it carries the field's state: its colour
   * is the tone, its emphasis the line's form — `hatch` dashed, `blink` dotted, `invert` twice as thick.
   */
  const connectorOf = (link: Link, id: string, at: string): Connector => {
    const width = link.width ?? 2;
    const bindings: Record<string, Binding> = {};
    let label = link.label;
    if (link.of !== undefined) {
      const { query, item } = target(link.of);
      const binding = (field: string, map?: ValueMap): Binding => ({ adapter: data[query]!.from, ref: refFor(query, item, field, at), ...(map ? { map } : {}) });
      const rule = link.show !== undefined ? fieldOf(query, link.show).state : undefined;
      if (rule !== undefined) {
        const maps = stateMaps(rule);
        bindings['style.stroke'] = binding(link.show!, maps.tone);
        if (maps.emphasis) {
          const form = (to: (e: string) => unknown) => ({ ...maps.emphasis!, ...(maps.emphasis!.values ? { values: Object.fromEntries(Object.entries(maps.emphasis!.values).map(([k, e]) => [k, to(e)])) } : {}), ...(maps.emphasis!.ranges ? { ranges: maps.emphasis!.ranges.map(r => ({ ...r, value: to(r.value) })) } : {}), ...('otherwise' in maps.emphasis! ? { otherwise: to(maps.emphasis!.otherwise!) } : {}) }) as ValueMap;
          bindings['style.dash'] = binding(link.show!, form(e => (e === 'hatch' ? 'dashed' : e === 'blink' ? 'dotted' : link.dash ? 'dashed' : 'solid')));
          bindings['style.strokeWidth'] = binding(link.show!, form(e => (e === 'invert' ? width * 2 : width)));
        }
      }
      const only = label !== undefined ? /^\{\{\s*([\w.-]+)\s*\}\}$/.exec(label) : null;
      if (only) {
        bindings.label = binding(only[1]!, fieldOf(query, only[1]!).names ? mapOf(fieldOf(query, only[1]!).names!, w => w) : undefined);
        label = '';
      }
    }
    if (label !== undefined && /\{\{/.test(label)) throw new PictureError(`${at}/label`, `a label mixing words and fields ("${label}") is not drawn yet — write the field alone`);
    return {
      id, fromNodeId: link.from, toNodeId: link.to,
      ...(label !== undefined ? { label } : {}),
      style: { stroke: 'idle', strokeWidth: width, ...(link.dash ? { dash: 'dashed' as const } : {}), arrow: link.arrow ? 'end' : 'none' },
      ...(Object.keys(bindings).length > 0 ? { bindings } : {}),
    };
  };

  const background = (canvas: Omit<CanvasLayout, 'kind'>) =>
    (canvas.background !== undefined ? { image: { src: canvas.background, width: canvas.size[0], height: canvas.size[1] } } : {});

  const gridItems = (items: V2GridItem[], at: string): GridItem[] =>
    items.flatMap((entry, i): GridItem[] => {
      const itemAt = `${at}/${i}`;
      const [id, layout] = typeof entry === 'string' ? [entry, {}]
        : Array.isArray(entry) ? [entry[0], { span: entry[1] }]
          : [entry.id, { ...(entry.span !== undefined ? { span: entry.span } : {}), ...(entry.height !== undefined ? { height: entry.height } : {}) }];
      if (typeof entry === 'object' && !Array.isArray(entry) && entry.grid !== undefined) throw new PictureError(itemAt, 'a grid in a grid cell is not drawn yet');
      if (typeof entry === 'object' && !Array.isArray(entry) && entry.canvas !== undefined) {
        const canvas: CellCanvas = { background: background(entry.canvas), ...canvasOf(entry.canvas, `${itemAt}/canvas`, `cell-${i}:`) };
        return [{ id: `cell-${i}`, canvas, ...layout }];
      }
      const part = board.parts[id!]!;
      const p = resolve(part);
      if (p.each !== undefined) {
        const keys = options.keysOf?.(p.each);
        if (keys === undefined) throw new PictureError(itemAt, `the items of "${p.each}" are not known — give keysOf`);
        return keys.map(key => ({ id: `${id}/${key}`, widget: widgetFor(part, `/parts/${id}`, readsOf(part, key)), ...layout }));
      }
      return [{ id: id!, widget: widgetFor(part, `/parts/${id}`, readsOf(part)), ...layout }];
    });

  const head = board.board ?? {};
  const look = { ...(head.theme !== undefined ? { appearance: head.theme } : {}), ...(head.accent !== undefined ? { accent: head.accent } : {}) };
  const layout = board.layout;
  if (layout.kind === 'canvas') {
    return { kind: 'canvas', background: background(layout), ...canvasOf(layout, '/layout'), ...look };
  }
  return { kind: 'grid', items: gridItems(layout.items, '/layout/items'), ...look };
}

/** The options of a chart part that are its mapping — which field is x, y, … */
const CHART_MAPPING = ['x', 'y', 'start', 'end', 'label', 'name', 'value', 'group', 'color', 'size', 'task', 'category'];
