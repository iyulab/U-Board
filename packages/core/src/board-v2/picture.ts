// A board in the language's second version, drawn by the renderer it has today: the picture model is the view
// document the renderer reads (nodes and grid items holding widgets, with their bindings), made from the board. It is
// an inside representation — not stored and not a public contract — so the language can change without rewriting the
// renderer.
//
// The board is taken as valid (`validateBoardV2` first): what is wrong in it is reported there, with where and how to
// write it instead. What the picture model cannot draw yet is a `PictureError`.

import type { Binding, CellCanvas, Connector, ElementDefinition, GridItem, GridLayout, ItemField, Node, Shape as ViewShape, ValueMap, ValueRange, ViewDocument, Widget } from '../view-document.js';
import type { HttpRef } from '../http-ref.js';
import { LABEL, LEGEND, MARKER, MARKER_SYMBOL, lineElement } from './builtins.js';
import { partKind } from './kinds.js';
import { TONES } from './types.js';
import type { BoardV2, CanvasLayout, ElementDefinition as V2ElementDefinition, Field, GridItem as V2GridItem, Link, Part, Place, Shape, StateRule, Status, Tone, ValueMapping } from './types.js';

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
      if (q.where !== undefined) {
        // The rows a list or a table shows: every item the data keeps, each whole.
        if (valueAt !== undefined) throw new PictureError(at, `"${field}" of every item of "${query}" is not one value — read the list, or a field of one item`);
        ref.items = { list: q.list!, where: q.where };
      } else {
        const path = `${q.list ?? ''}${valueAt ?? ''}`;
        if (path !== '') ref.valuePath = path;
      }
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

  /**
   * The key a field lives under in an item — its `at` (`/sky` → `sky`), else its own name — where a list's rows and a
   * text read it. A field deeper in an item is read only one value at a time.
   */
  const keyOf = (query: string, name: string, at: string): string => {
    const where = fieldOf(query, name).at;
    if (where === undefined) return name;
    if (where.indexOf('/', 1) >= 0) throw new PictureError(at, `"${name}" lives deeper in an item (${where}) — a list's rows and a text read a field at the top of it`);
    return where.slice(1);
  };

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

  // ── the board's own drawings ──

  const elements: Record<string, ElementDefinition> = {};
  /** The widget type of one of U-Board's own drawings, defined once in the document. */
  const builtin = (name: string, definition: ElementDefinition) => {
    elements[name] ??= definition;
    return `element:${name}`;
  };

  /** The statuses a field's state names, in the order the board declares them — what a legend lists. */
  const usedStatuses = (): string[] => {
    const used = new Set<string>();
    for (const q of Object.values(data)) {
      for (const f of Object.values(q.fields ?? {})) {
        if (f.state === undefined) continue;
        const words = f.state === 'raw' ? Object.keys(statuses) : Array.isArray(f.state) ? f.state.filter((w, i) => i % 2 === 0) : Object.values(f.state);
        for (const w of words) used.add(String(w));
      }
    }
    return Object.keys(statuses).filter(name => used.has(name));
  };

  /**
   * A text of words and fields read from one item (or a read that is not a list): the item bound whole and written into
   * the text — each field in its words when it names them, with its digits — and `{{key}}` the item's key.
   */
  const textBinding = (t: string, reads: Reads, at: string): Binding => {
    const q = data[reads.query]!;
    if (reads.item === undefined && q.list !== undefined) {
      throw new PictureError(at, `a text of fields reads one item — "${reads.query}" is a list: write "${reads.query}[<key>]"`);
    }
    const gained: Record<string, ItemField> = {};
    const written = t.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_m, name: string) => {
      if (name === 'key') return reads.item ?? '';
      const f = fieldOf(reads.query, name);
      const key = keyOf(reads.query, name, at);
      if (f.names !== undefined) gained[`${name}$name`] = { from: key, map: mapOf(f.names, w => w) };
      const shown = f.names !== undefined ? `${name}$name` : key;
      const digits = f.digits !== undefined ? ` | ${f.format === 'number' ? 'grouped' : 'fixed'}:${f.digits}` : f.format === 'number' ? ' | grouped:0' : '';
      return `{{${shown}${digits}}}`;
    });
    return {
      adapter: q.from,
      ref: refFor(reads.query, reads.item, undefined, at),
      ...(Object.keys(gained).length > 0 ? { itemFields: gained } : {}),
      text: written,
    };
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
     * The whole list bound at `key`, each item gaining `gained` — a row's tone from its state (`<field>$tone`), a field
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
        ...(f.state !== undefined ? { [`${name}$tone`]: { from: key(name), map: stateMaps(f.state).tone } } : {}),
        ...(f.names !== undefined ? { [`${name}$name`]: { from: key(name), map: mapOf(f.names, w => w) } } : {}),
      };
    };
    /** Where a row holds field `name`. */
    const key = (name: string) => keyOf(query!, name, at);
    /** The field a row shows `name` by: its words when it names them, else the field where it lives. */
    const shown = (name: string) => (field(name).names !== undefined ? `${name}$name` : key(name));
    /** The first of `names` whose field has a state. */
    const stateIn = (names: readonly (string | undefined)[]) => names.find(n => n !== undefined && field(n).state !== undefined);
    const text = (t: string | undefined, key: string): string | undefined => {
      if (t === undefined) return undefined;
      const holes = [...t.matchAll(/\{\{\s*([\w.-]+)\s*\}\}/g)];
      if (holes.length === 0) return t;
      const only = /^\{\{\s*([\w.-]+)\s*\}\}$/.exec(t);
      if (only && only[1] !== 'key') { bindValue(key, only[1]!); return ''; }
      if (holes.every(h => h[1] === 'key')) return t.replace(/\{\{\s*key\s*\}\}/g, item ?? '');
      if (query !== undefined) bindings[key] = textBinding(t, { query, ...(item !== undefined ? { item } : {}) }, at);
      return '';
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
            ...(f.unit ? { unit: f.unit } : {}), ...(format ? { format } : {}), ...(f.state !== undefined ? { toneField: `${name}$tone` } : {}),
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
          ...(time !== undefined ? { time: key(time) } : {}),
          ...(tone !== undefined ? { tone: `${tone}$tone` } : {}),
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
          ...(labelField !== undefined ? { label: { from: key(labelField), ...(field(labelField).names ? { map: mapOf(field(labelField).names!, w => w) } : {}) } } : {}),
          ...(valueField !== undefined ? { value: { from: key(valueField) } } : {}),
          ...(tone !== undefined && toneMap !== undefined ? { tone: { from: key(tone), map: stateMaps(toneMap).tone } } : {}),
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
      case 'marker': {
        const { shape = 'dot', symbol, note } = options as { shape?: string; symbol?: string; note?: string };
        const stateField = stateIn(fields);
        if (stateField) bindState('', stateField, { words: true });
        const props = { name: text(title, 'name') ?? item ?? '', tone: '', status: '', note: text(note, 'note') ?? '' };
        // A marker with a symbol draws the board's drawing — one, or the one a field names — in its status's colour.
        if (symbol !== undefined) return { type: builtin('u-board-marker-symbol', MARKER_SYMBOL), props: { ...props, symbol: text(symbol, 'symbol') ?? '' }, bindings };
        return { type: builtin('u-board-marker', MARKER), props: { ...props, shape }, bindings };
      }
      case 'label': {
        const name = fields[0];
        const textProp = title !== undefined ? text(title, 'text') : name !== undefined ? (bindValue('text', name), '') : '';
        if (name !== undefined) bindState('', name);
        return { type: builtin('u-board-label', LABEL), props: { text: textProp ?? '', tone: '' }, bindings };
      }
      case 'legend': {
        const items = usedStatuses().map(name => {
          const s = statuses[name]!;
          return { tone: s.tone, label: s.label ?? name, glyph: s.glyph ?? '' };
        });
        return { type: builtin('u-board-legend', LEGEND), props: { items } };
      }
      case 'element': {
        // One of the board's own drawings: its fixed props, and props bound to a field, its status or its tone.
        const { element, props: fixed = {}, bind: bound = {} } = options as { element: string; props?: Record<string, unknown>; bind?: Record<string, string> };
        const definition = board.elements![element]!;
        elements[element] ??= elementDefinition(definition);
        for (const [prop, ref] of Object.entries(bound)) {
          const [name, what] = ref.split('.') as [string, 'status' | 'tone' | undefined];
          if (what === undefined) bindValue(prop, name);
          else bind(prop, name, what === 'tone' ? stateMaps(field(name).state!).tone : statusNames(field(name).state!));
        }
        const blank = { number: 0, string: '', boolean: false, list: [] } as const;
        const props = Object.fromEntries(Object.entries(definition.props ?? {}).map(([k, t]) => [k, blank[t]]));
        return { type: `element:${element}`, props: { ...props, ...fixed }, bindings };
      }
      case 'group':
        throw new PictureError(at, 'a group is drawn by the layout that places it');
    }
  };

  /** A field's state as the status name each raw value is in — what an element's `<field>.status` reads. */
  const statusNames = (rule: StateRule): ValueMap<string> =>
    rule === 'raw'
      ? { values: Object.fromEntries([...Object.keys(statuses), ...TONES].map(n => [n, n])), otherwise: 'off' }
      : mapOf(rule, w => w);

  /** The data a part reads, for an item `key` of an `each` part or as its `of` says. */
  const readsOf = (part: Part, key?: string): Reads | undefined => {
    const p = resolve(part);
    if (p.each !== undefined) return { query: p.each, ...(key !== undefined ? { item: key } : {}) };
    return p.of !== undefined ? target(p.of) : undefined;
  };

  // ── layouts ──

  /**
   * A canvas: its parts placed as nodes, its shapes as decorations, its links as connectors — `prefix` keeps the ids of
   * a cell's or a group's shapes and links apart from another's. A group placed on it is its own small canvas drawn
   * into its box — its parts' nodes named `<group>/<part>`, reading the group's data unless they name their own.
   * `frame` moves and scales what a group places into the box it is placed in.
   */
  const canvasOf = (
    canvas: Omit<CanvasLayout, 'kind'>, at: string, prefix = '', parts: Record<string, Part> = board.parts, frame: Frame = WHOLE,
  ): Pick<CellCanvas, 'nodes' | 'connectors' | 'decorations'> => {
    const nodes: Node[] = [];
    const connectors: Connector[] = [];
    const decorations: ViewShape[] = [];
    const lines: Node[] = [];
    const placeOne = (partId: string, id: string, part: Part, place: Place, reads: Reads | undefined) => {
      const nodeId = `${frame.ids}${id}`;
      const p = resolve(part);
      const [x, y] = [frame.dx + place[0] * frame.sx, frame.dy + place[1] * frame.sy];
      if (p.as === 'group') {
        const size = p.size as [number, number];
        const [w, h] = place.length === 4 ? [place[2] * frame.sx, place[3] * frame.sy] : [size[0] * frame.sx, size[1] * frame.sy];
        const inner = canvasOf(groupCanvas(p), `/parts/${partId}`, `${nodeId}/`, p.parts as Record<string, Part>, {
          dx: x, dy: y, sx: w / size[0], sy: h / size[1], ids: `${nodeId}/`, reads: reads ?? null,
        });
        nodes.push(...inner.nodes);
        connectors.push(...inner.connectors);
        decorations.push(...(inner.decorations ?? []));
        return;
      }
      const placed = place.length === 4 ? { width: place[2] * frame.sx, height: place[3] * frame.sy } : {};
      nodes.push({ id: nodeId, x, y, ...placed, anchored: true, widget: widgetFor(part, `/parts/${partId}`, reads) });
    };
    for (const [id, place] of Object.entries(canvas.place)) {
      const part = parts[id]!;
      // A part inside a group reads the group's data unless it names its own.
      const own = (key?: string) => readsOf(part, key) ?? (frame.reads === null ? undefined : frame.reads);
      if (Array.isArray(place)) placeOne(id, id, part, place, own());
      else for (const [key, p] of Object.entries(place)) placeOne(id, `${id}/${key}`, part, p, own(key));
    }
    for (const [id, shape] of Object.entries(canvas.shapes ?? {})) {
      const moved = moveShape(shape, frame);
      if (moved.line !== undefined || moved.path !== undefined) lines.push(lineNode(moved, `${prefix}shape.${id}`));
      else decorations.push(shapeOf(moved, `${prefix}shape.${id}`));
    }
    for (const [id, link] of Object.entries(canvas.links ?? {})) {
      connectors.push(connectorOf({ ...link, from: `${frame.ids}${link.from}`, to: `${frame.ids}${link.to}` }, `${prefix}link.${id}`, `${at}/links/${id}`));
    }
    // Lines are drawn under the parts, as the decorations are.
    return { nodes: [...lines, ...nodes], connectors, ...(decorations.length > 0 ? { decorations } : {}) };
  };

  /** A group's own canvas. */
  const groupCanvas = (group: Part): Omit<CanvasLayout, 'kind'> => ({
    size: group.size as [number, number],
    place: group.place as CanvasLayout['place'],
    ...(group.shapes !== undefined ? { shapes: group.shapes as CanvasLayout['shapes'] } : {}),
    ...(group.links !== undefined ? { links: group.links as CanvasLayout['links'] } : {}),
  });

  /** A shape moved and scaled by `frame` — a group's shape into the box the group is placed in. */
  const moveShape = (shape: Shape, frame: Frame): Shape => {
    if (frame === WHOLE) return shape;
    const px = (x: number) => frame.dx + x * frame.sx;
    const py = (y: number) => frame.dy + y * frame.sy;
    let k = 0;
    return {
      ...shape,
      ...(shape.box !== undefined ? { box: [px(shape.box[0]), py(shape.box[1]), shape.box[2] * frame.sx, shape.box[3] * frame.sy] } : {}),
      ...(shape.at !== undefined ? { at: [px(shape.at[0]), py(shape.at[1])] } : {}),
      ...(shape.line !== undefined ? { line: shape.line.map(([x, y]) => [px(x), py(y)] as [number, number]) } : {}),
      ...(shape.path !== undefined ? { path: shape.path.replace(/-?\d*\.?\d+/g, n => String(k++ % 2 === 0 ? px(Number(n)) : py(Number(n)))) } : {}),
    };
  };

  /** A shape as a decoration: a box with its label, or a text at a point — in its tone, else the board's muted line. */
  const shapeOf = (shape: Shape, id: string): ViewShape => {
    if (shape.box !== undefined) {
      const [x, y, width, height] = shape.box;
      return {
        id, type: 'rect', x, y, width, height, fill: 'none', stroke: shape.tone ?? 'idle', strokeWidth: shape.width ?? 1.5,
        ...(shape.dash ? { dash: 'dashed' as const } : {}),
        ...(shape.label !== undefined ? { label: shape.label, labelAt: 'top-start' as const } : {}),
      };
    }
    const at = shape.at!;
    return { id, type: 'text', x: at[0], y: at[1], text: shape.text!, fill: shape.tone ?? 'next', ...(shape.size !== undefined ? { fontSize: shape.size } : {}) };
  };

  /** A line or a path as a node of its own, boxed around its points with room for its width. */
  const lineNode = (shape: Shape, id: string): Node => {
    const width = shape.width ?? 3;
    const numbers = shape.line !== undefined ? shape.line.flat() : (shape.path!.match(/-?\d*\.?\d+/g) ?? []).map(Number);
    const xs = numbers.filter((_, i) => i % 2 === 0);
    const ys = numbers.filter((_, i) => i % 2 === 1);
    const x = Math.min(...xs) - width;
    const y = Math.min(...ys) - width;
    const box = { width: Math.max(...xs) + width - x, height: Math.max(...ys) + width - y };
    // The points in the box's own coordinates.
    let k = 0;
    const d = shape.line !== undefined
      ? `M${shape.line.map(([px, py]) => `${px - x} ${py - y}`).join(' L')}`
      : shape.path!.replace(/-?\d*\.?\d+/g, n => String(Number(n) - (k++ % 2 === 0 ? x : y)));
    const name = `u-board-${id.replace(/[^a-z0-9-]+/gi, '-').toLowerCase()}`;
    return { id, x, y, ...box, anchored: true, widget: { type: builtin(name, lineElement(d, box, { tone: shape.tone, width, dash: shape.dash === true })) } };
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
      } else if (label !== undefined && /\{\{/.test(label)) {
        bindings.label = textBinding(label, { query, ...(item !== undefined ? { item } : {}) }, at);
        label = '';
      }
    }
    return {
      id, fromNodeId: link.from, toNodeId: link.to,
      ...(label !== undefined ? { label } : {}),
      style: { stroke: 'idle', strokeWidth: width, ...(link.dash ? { dash: 'dashed' as const } : {}), arrow: link.arrow ? 'end' : 'none' },
      ...(Object.keys(bindings).length > 0 ? { bindings } : {}),
    };
  };

  const background = (canvas: Omit<CanvasLayout, 'kind'>) =>
    (canvas.background !== undefined ? { image: { src: canvas.background, width: canvas.size[0], height: canvas.size[1] } } : {});

  /** What a grid places for one entry — a part (once, or once per item of an `each` part), a group, or a canvas. */
  const unitsOf = (entry: V2GridItem, at: string, i: number): Unit[] => {
    const layout: GridLayout = typeof entry === 'string' ? {}
      : Array.isArray(entry) ? { span: entry[1] }
        : { ...(entry.span !== undefined ? { span: entry.span } : {}), ...(entry.height !== undefined ? { height: entry.height } : {}) };
    if (typeof entry === 'object' && !Array.isArray(entry) && entry.grid !== undefined) {
      return [{
        layout,
        grid: entry.grid.flatMap((inner, j) => {
          const units = unitsOf(inner, `${at}/${i}/grid`, j);
          if (units.some(u => u.grid !== undefined)) throw new PictureError(`${at}/${i}/grid/${j}`, 'a grid in a grid in a grid cell is not drawn yet');
          return units;
        }),
      }];
    }
    if (typeof entry === 'object' && !Array.isArray(entry) && entry.canvas !== undefined) {
      const canvas = entry.canvas;
      const id = `cell${at.replace(/\D+/g, '-')}${i}`;
      return [{ layout, make: extra => ({ id, canvas: { background: background(canvas), ...canvasOf(canvas, `${at}/${i}/canvas`, `${id}:`) }, ...layout, ...extra }) }];
    }
    const id = typeof entry === 'string' ? entry : Array.isArray(entry) ? entry[0] : entry.id!;
    const part = board.parts[id]!;
    const p = resolve(part);
    const one = (itemId: string, reads: Reads | undefined): Unit => ({
      layout,
      make: extra => (p.as === 'group'
        ? { id: itemId, canvas: { background: {}, ...canvasOf(groupCanvas(p), `/parts/${id}`, `${itemId}/`, p.parts as Record<string, Part>, { ...WHOLE, ids: `${itemId}/`, reads: reads ?? null }) }, ...layout, ...extra }
        : { id: itemId, widget: widgetFor(part, `/parts/${id}`, reads), ...layout, ...extra }),
    });
    if (p.each !== undefined) {
      const keys = options.keysOf?.(p.each);
      if (keys === undefined) throw new PictureError(`${at}/${i}`, `the items of "${p.each}" are not known — give keysOf`);
      return keys.map(key => one(`${id}/${key}`, readsOf(part, key)));
    }
    return [one(id, readsOf(part))];
  };

  /**
   * The rows a grid in a cell of `cell` columns lays its items in, each item with the columns it takes of the whole
   * grid: an item's span is twelfths of the cell (12 when absent — one under another), and each row fills the cell, so
   * the grid's own flow puts the next row's items back in the cell's columns.
   */
  const cellRows = (stack: Unit, cell: number, at: string): { unit: Unit; span: number }[][] => {
    const rows: { unit: Unit; span: number }[][] = [];
    let used = 12;
    for (const unit of stack.grid!) {
      const twelfths = unit.layout.span ?? 12;
      const span = (cell * twelfths) / 12;
      if (!Number.isInteger(span)) {
        throw new PictureError(at, `a grid in a cell of ${cell} columns takes items of whole columns — ${twelfths} of 12 is ${span.toFixed(2)} of them`);
      }
      if (used + twelfths > 12) {
        if (used < 12) throw new PictureError(at, `each row of a grid in a cell fills the cell — a row takes ${used} of 12`);
        rows.push([]);
        used = 0;
      }
      rows.at(-1)!.push({ unit, span });
      used += twelfths;
    }
    if (used < 12) throw new PictureError(at, `each row of a grid in a cell fills the cell — the last row takes ${used} of 12`);
    return rows;
  };

  /**
   * A grid's items in order. A cell holding a grid lays its items out in the cell's columns, in rows that fill it: the
   * row it sits in becomes as many rows as the cell has, the items beside it spanning them all.
   */
  const gridItems = (entries: V2GridItem[], at: string): GridItem[] => {
    const units = entries.flatMap((entry, i) => unitsOf(entry, at, i));
    const out: GridItem[] = [];
    let row: Unit[] = [];
    let used = 0;
    const flush = () => {
      const stacks = row.filter(u => u.grid !== undefined);
      if (stacks.length === 0) out.push(...row.map(u => u.make!({})));
      else {
        const rowsOf = new Map(stacks.map(u => [u, cellRows(u, u.layout.span ?? 4, at)]));
        const depth = rowsOf.get(stacks[0]!)!.length;
        if (stacks.some(u => rowsOf.get(u)!.length !== depth)) throw new PictureError(at, 'grid cells side by side lay out the same number of rows — or put them in rows of their own');
        if (depth > 6) throw new PictureError(at, 'a grid cell lays out at most six rows');
        const cellRow = (u: Unit, r: number) => rowsOf.get(u)![r]!.map(({ unit, span }) => unit.make!({ span }));
        for (const u of row) out.push(...(u.grid ? cellRow(u, 0) : [u.make!(depth > 1 ? { rowSpan: depth } : {})]));
        for (let r = 1; r < depth; r++) for (const u of stacks) out.push(...cellRow(u, r));
      }
      row = [];
      used = 0;
    };
    for (const u of units) {
      const span = u.layout.span ?? 4;
      if (used + span > 12 && row.length > 0) flush();
      row.push(u);
      used += span;
    }
    if (row.length > 0) flush();
    return out;
  };

  const withElements = () => ({
    ...(Object.keys(elements).length > 0 ? { elements } : {}),
    ...(board.symbols !== undefined && Object.keys(board.symbols).length > 0
      ? { symbols: Object.fromEntries(Object.entries(board.symbols).map(([name, sym]) => [name, { ...(sym.viewBox !== undefined ? { viewBox: sym.viewBox } : {}), markup: `<path d="${sym.path ?? ''}"/>` }])) }
      : {}),
  });
  const head = board.board ?? {};
  const look = { ...(head.theme !== undefined ? { appearance: head.theme } : {}), ...(head.accent !== undefined ? { accent: head.accent } : {}) };
  const layout = board.layout;
  if (layout.kind === 'canvas') {
    const canvas = canvasOf(layout, '/layout');
    return { kind: 'canvas', background: background(layout), ...canvas, ...look, ...withElements() };
  }
  const items = gridItems(layout.items, '/layout/items');
  return { kind: 'grid', items, ...look, ...withElements() };
}

/** What a part reads: a data read, and the item when it names one. */
type Reads = { query: string; item?: string };

/** How a group's own canvas is drawn into the box it is placed in: moved, scaled, its node ids prefixed, reading the
 *  group's data (`null` when the group reads none). */
interface Frame {
  dx: number;
  dy: number;
  sx: number;
  sy: number;
  ids: string;
  reads?: Reads | null;
}
const WHOLE: Frame = { dx: 0, dy: 0, sx: 1, sy: 1, ids: '' };

/** A grid item to place — once its row knows how many rows the item beside it stacks — or a cell's stacked items. */
interface Unit {
  layout: GridLayout;
  make?: (extra: GridLayout) => GridItem;
  grid?: Unit[];
}

/** A v2 element definition as the view document's: its holes as a props schema. */
function elementDefinition(definition: V2ElementDefinition): ElementDefinition {
  const type = { number: 'number', string: 'string', boolean: 'boolean', list: 'array' } as const;
  return {
    render: 'template',
    props: { type: 'object', properties: Object.fromEntries(Object.entries(definition.props ?? {}).map(([k, t]) => [k, { type: type[t] }])) },
    template: definition.template,
    ...(definition.style !== undefined ? { style: definition.style } : {}),
  };
}

/** The options of a chart part that are its mapping — which field is x, y, … */
const CHART_MAPPING = ['x', 'y', 'start', 'end', 'label', 'name', 'value', 'group', 'color', 'size', 'task', 'category'];
