// A board, drawn: the picture is the view document the renderer reads (nodes and grid items holding widgets, with their
// bindings), made from the board. It is never stored or written — what code that reads a drawn board sees (`./picture`)
// — so the language can change without rewriting the renderer.
//
// The board is taken as valid (`validateBoard` first): what is wrong in it is reported there, with where and how to
// write it instead. What the picture model cannot draw yet is a `PictureError`.

import { has, last, matchesOf, replaceEvery } from '../portable.js';
import { placedAt, type Binding, type CellCanvas, type Connector, type ElementDefinition, type GridItem, type GridLayout, type ItemField, type Node, type Shape as ViewShape, type Trigger as ViewTrigger, type TriggerAction as ViewTriggerAction, type ValueMap, type ValueRange, type ViewDocument, type Widget } from '../view-document.js';
import type { HttpRef } from '../http-ref.js';
import { DEFAULT_NODE_HEIGHT, DEFAULT_NODE_WIDTH } from '../layout-defaults.js';
import { isSkinColor } from '../css-color.js';
import { LABEL, LEGEND, MARKER, MARKER_JOINT, MARKER_SYMBOL, lineElement, stateLineElement } from './builtins.js';

const MARKER_JOINT_SIDES = ['right', 'left', 'above', 'below'];

/** The options that style a part rather than choose what it shows, by kind — each a word, read by the board and never handed to the widget. */
const STYLE_KEYS: Readonly<Record<string, readonly string[]>> = {
  header: ['scale', 'kickerInk'],
  label: ['scale', 'ink', 'face'],
  stat: ['numerals'],
  'status-card': ['numerals'],
  'stat-list': ['numerals'],
  list: ['numerals'],
};

/** A part's styling options, as written. */
function styleOf(part: Record<string, unknown>, kind: string): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of STYLE_KEYS[kind] ?? []) if (key in part) out[key] = part[key];
  return out;
}

/** A part's styling options, taken out of `options` — what is left is for the widget. */
function takeStyle(options: Record<string, unknown>, kind: string): Record<string, unknown> {
  const taken = styleOf(options, kind);
  for (const key of Object.keys(taken)) delete options[key];
  return taken;
}

/**
 * The tokens a part's styling is handed to its widget as (`Widget.tokens`): a header's heading size and kicker colour, the
 * numerals of a stat's headline figure (`figure`), and those of the values in a card, a row or a stat list (`value`) — which a skin's
 * `numerals` does not reach. A word that is not one gives none.
 */
function partTokens(kind: string, style: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  const numerals = isRecord(style.numerals) ? style.numerals : undefined;
  if (kind === 'header') {
    const scale = style.scale;
    if (typeof scale === 'string' && has(NUMERAL_SCALES, scale)) out['--u-widget-title-scale'] = String(NUMERAL_SCALES[scale as NumeralScale]);
    if (style.kickerInk === 'accent') out['--u-widget-kicker-color'] = 'var(--u-widget-primary)';
  } else if (kind === 'stat') Object.assign(out, numeralTokens(numerals, 'figure'));
  else if (kind === 'list' || kind === 'status-card' || kind === 'stat-list') Object.assign(out, numeralTokens(numerals, 'value'));
  return out;
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * Puts the words of each marker in `auto` on the first side its links do not leave — below, then right, above, left: a station on
 * a horizontal line names itself below it, one on a vertical line to its right. A marker every side of which has a link takes right.
 */
function sideFreeOfLinks(nodes: Node[], connectors: Connector[], auto: ReadonlySet<string>): void {
  const centre = new Map(nodes.map(n => [n.id, { x: n.x + (n.width ?? 0) / 2, y: n.y + (n.height ?? 0) / 2 }]));
  for (const node of nodes) {
    if (!auto.has(node.id)) continue;
    const here = centre.get(node.id)!;
    const taken = new Set<string>();
    for (const c of connectors) {
      const other = c.fromNodeId === node.id ? c.toNodeId : c.toNodeId === node.id ? c.fromNodeId : undefined;
      const there = other === undefined ? undefined : centre.get(other);
      if (!there) continue;
      const dx = there.x - here.x;
      const dy = there.y - here.y;
      taken.add(Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? 'right' : 'left') : dy >= 0 ? 'below' : 'above');
    }
    const side = ['below', 'right', 'above', 'left'].find(s => !taken.has(s)) ?? 'right';
    const widget = node.widget as { props?: Record<string, unknown> };
    node.widget = { ...node.widget, props: { ...widget.props, labelAt: side } } as Node['widget'];
  }
}
import { chartMapping, partKind } from './kinds.js';
import { expandVariables, variableValues, variablesOf } from './variables.js';
import { TONES } from './types.js';
import { groupReach } from './group-reach.js';
import { NUMERAL_SCALES, numeralTokens, type NumeralScale } from '../numerals.js';
import type { Board, CanvasLayout, DataPlace, FlowPlace, RelativeRule, ElementDefinition as BoardElementDefinition, Expanded, Field as WrittenField, GridItem as BoardGridItem, Link, Meter, Part, Place, Query as WrittenQuery, Shape, StateRule, Status, Tone, Trigger, ValueMapping } from './types.js';

// A board is drawn after its variables are written out: its `where`s hold values, never a reference to a variable.
type Query = Expanded<WrittenQuery>;
type Field = Expanded<WrittenField>;

/** A weight's or an arrow's bands or map as the value map a connector binding takes: bands as ranges, a map as values
 *  and `otherwise`. */
function bandsOrMap<T>(spec: { bands?: (T | number)[]; map?: Record<string, T> }): ValueMap {
  if (spec.bands !== undefined) {
    const b = spec.bands;
    const ranges: { min?: number; max?: number; value: T | number }[] = [];
    for (let i = 0; i < b.length; i += 2) ranges.push({ ...(i > 0 ? { min: b[i - 1] as number } : {}), ...(i + 1 < b.length ? { max: b[i + 1] as number } : {}), value: b[i]! });
    return { ranges } as ValueMap;
  }
  const { '*': otherwise, ...values } = spec.map ?? {};
  return { values, ...(otherwise !== undefined ? { otherwise } : {}) } as ValueMap;
}

/** A weight as the value map a connector's width binding takes: bands as ranges, a map as values and `otherwise`. */
function weightMap(weight: { bands?: number[]; map?: Record<string, number> }): ValueMap {
  if (weight.bands !== undefined) {
    const b = weight.bands;
    const ranges: { min?: number; max?: number; value: number }[] = [];
    for (let i = 0; i < b.length; i += 2) ranges.push({ ...(i > 0 ? { min: b[i - 1]! } : {}), ...(i + 1 < b.length ? { max: b[i + 1]! } : {}), value: b[i]! });
    return { ranges } as ValueMap;
  }
  const { '*': otherwise, ...values } = weight.map ?? {};
  return { values, ...(otherwise !== undefined ? { otherwise } : {}) } as ValueMap;
}

/** A field's decimal places as a text's value pipe: its `digits`, or the places a `number:N` format gives; a plain
 *  `number` groups its thousands. */
function pipeOf(f: Field): string {
  const places = f.digits ?? (/^number:(\d+)$/.exec(f.format ?? '')?.[1] !== undefined ? Number(/^number:(\d+)$/.exec(f.format!)![1]) : undefined);
  if (places !== undefined) return ` | ${f.format === 'number' ? 'grouped' : 'fixed'}:${places}`;
  return f.format === 'number' ? ' | grouped:0' : '';
}

/** Whether a field's values are figures — a number format, decimal places or a unit — which a table sets right. */
export function isFigure(field: Field): boolean {
  return field.digits !== undefined || field.unit !== undefined || /^(number|compact|currency|percent|bytes)\b/.test(field.format ?? '');
}

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
  /** The value each of the board's variables is asked to take — one that is not among its options (or none) takes its default. */
  variables?: Readonly<Record<string, string>>;
  /**
   * The items of a data list, for a part a canvas places by its items' fields (`DataPlace`): each item as the list gave it.
   * Where the board names none of its own, nothing is drawn for an item whose field says nothing.
   */
  rowsOf?: (data: string) => readonly unknown[];
  /** Told, for a part placed by its items' fields, how many of its items were not drawn — no number in a field, or
   *  outside the frame. Not told of a part that drew them all. */
  onUnplaced?: (part: string, count: number) => void;
}

/** The value at a JSON Pointer in `item`, or `undefined` where the item has nothing there. */
function valueAtPointer(item: unknown, pointer: string): unknown {
  let at = item;
  for (const raw of pointer.split('/').slice(1)) {
    if (typeof at !== 'object' || at === null) return undefined;
    at = (at as Record<string, unknown>)[raw.replace(/~1/g, '/').replace(/~0/g, '~')];
  }
  return at;
}

/** A list inside an item, read as a data of its own: `base` is the data it is in, `outer` the item of it (its key, or its
 *  place when it has none) and `within` the pointer in that item where the list is. Its fields are what the list field's
 *  `items` say. It exists only for the parts a group draws per item of it (`each: '/assets'`). */
interface DerivedQuery extends Query {
  baseName: string;
  base: Query;
  outer: string;
  within: string;
}

/** Whether a canvas's place for a part is by its items' fields: an object whose `at` names two fields (a place for an
 *  item called "at" is two numbers). */
export function isDataPlace(place: unknown): place is DataPlace {
  return typeof place === 'object' && place !== null && !Array.isArray(place) && Array.isArray((place as { at?: unknown }).at)
    && (place as { at: unknown[] }).at.every(f => typeof f === 'string');
}

/** Whether a field's state is read against the clock (`RelativeRule`): an object whose `relative` is the bands. */
export function isRelativeRule(rule: unknown): rule is RelativeRule {
  return typeof rule === 'object' && rule !== null && !Array.isArray(rule) && Array.isArray((rule as { relative?: unknown }).relative);
}

/** Whether a canvas's place for a part is a rule for its items (`FlowPlace`): an object whose `flow` is an object (an item called "flow" has a place that is an array). */
export function isFlowPlace(place: unknown): place is FlowPlace {
  return typeof place === 'object' && place !== null && !Array.isArray(place)
    && typeof (place as { flow?: unknown }).flow === 'object' && (place as { flow?: unknown }).flow !== null && !Array.isArray((place as { flow?: unknown }).flow);
}

/** The tone and the words a raw value maps to, through a field's `state`. */
interface StateMaps {
  /** The status each raw value is in, by name — what a trigger compares. */
  named: ValueMap<string>;
  tone: ValueMap<string>;
  status: ValueMap<string>;
  emphasis?: ValueMap<string>;
  /** The mark of each status that names one — none when no status does, and the widget marks by tone. */
  glyph?: ValueMap<string>;
}

/** Where a binding reads: the adapter, and its reference — for an HTTP connector the request, the item, the value in it
 *  and how current it must be; for another adapter its own reference and where in its item the value is. */
function readOf(data: Record<string, Query>, query: string, item: string | undefined, field: string | undefined, at: string): Pick<Binding, 'adapter' | 'ref' | 'at'> {
  const q = data[query]!;
  const valueAt = field === undefined ? undefined : q.fields?.[field]?.at ?? `/${field}`;
  if (q.ref !== undefined) return { adapter: q.from, ref: q.ref, ...(valueAt ? { at: valueAt } : {}) };
  return { adapter: q.from, ref: refFor(q, query, item, field, valueAt, at) };
}

/** An HTTP connector's reference: the request, the item, the value in it, and how current it must be. */
function refFor(q: Query, query: string, item: string | undefined, field: string | undefined, valueAt: string | undefined, at: string): HttpRef {
  const ref: HttpRef = { path: q.path! };
  const derived = (q as DerivedQuery).within !== undefined ? (q as DerivedQuery) : undefined;
  if (derived !== undefined && item !== undefined) {
    // An item of a list inside an item (`each: '/assets'` in a group): the outer item, then the list in it and the place
    // of this one — the value is read from the one answer, never asked for again.
    const base = derived.base;
    if (base.key !== undefined) {
      ref.item = { list: base.list!, where: { ...base.where, [base.key]: derived.outer } };
      if (derived.key !== undefined) {
        // A list field with a `key` names its items by that field, so the one read is found by it, not by its place.
        ref.item.inside = { list: derived.within, where: { [derived.key]: item } };
        ref.valuePath = valueAt ?? '';
      } else {
        ref.valuePath = `${derived.within}/${item}${valueAt ?? ''}`;
      }
    } else {
      ref.valuePath = `${base.list}/${derived.outer}${derived.within}/${item}${valueAt ?? ''}`;
    }
    if (base.time !== undefined) ref.observedAtPath = base.fields?.[base.time]?.at ?? `/${base.time}`;
    if (base.zone !== undefined) ref.timeZone = base.zone;
    if (base.fresh !== undefined) ref.maxAgeSeconds = base.fresh;
    return ref;
  } else if (q.pivot !== undefined) {
    // A pivoted list is one item: its field is the row its name is, the value that row holds.
    if (field === undefined) throw new PictureError(at, `"${query}" is pivoted — name its fields, it has no whole item to write`);
    ref.item = { list: q.list!, where: { ...q.where, [q.pivot.key]: field } };
    ref.valuePath = `/${q.pivot.value}`;
  } else if (item !== undefined) {
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
  if (q.time !== undefined && (item !== undefined || q.list === undefined || q.pivot !== undefined)) ref.observedAtPath = q.fields?.[q.time]?.at ?? `/${q.time}`;
  // The whole list is as old as the answer says it is.
  else if (q.answerTime !== undefined && item === undefined && q.where === undefined && field === undefined) ref.observedAtPath = q.answerTime;
  if (q.zone !== undefined) ref.timeZone = q.zone;
  if (q.fresh !== undefined) ref.maxAgeSeconds = q.fresh;
  if (q.now !== undefined) {
    ref.requestTime = {
      ...(q.now.delay !== undefined ? { delaySeconds: q.now.delay } : {}),
      ...(q.now.step !== undefined ? { stepSeconds: q.now.step } : {}),
    };
  }
  return ref;
}

/** A data list whose items a board lays out one part each (`each` in a grid): the read of the whole list. */
export interface KeyRead extends Pick<Binding, 'adapter' | 'ref'> {
  /** The data's name — what `keysOf` is asked for. */
  data: string;
}

/**
 * The reads that tell a grid which items to lay out: one per data list a part made per item (`each`) stands for. A
 * canvas names its items where it places them and needs none. Read each, give `keysIn` the value, and draw with the
 * keys (`toViewDocument(board, { keysOf })`).
 */
export function keyReadsOf(board: Board, options: Pick<PictureOptions, 'variables'> = {}): KeyRead[] {
  const needed = new Set<string>();
  toViewDocument(board, { ...options, keysOf: name => (needed.add(name), []), rowsOf: name => (needed.add(name), []) });
  // The reads are of the board with its variables written out, as it is drawn.
  const data = expandVariables(board, variableValues(variablesOf(board), options.variables)).data ?? {};
  return [...needed].map(name => {
    const { adapter, ref } = readOf(data, name, undefined, undefined, `/data/${name}`);
    return { data: name, adapter, ref };
  });
}

/** How a board reads one of its data whole — the list, or the one item — as the parts that show it whole do. */
export function dataReadOf(board: Board, data: string, options: Pick<PictureOptions, 'variables'> = {}): KeyRead {
  const { adapter, ref } = readOf(expandVariables(board, variableValues(variablesOf(board), options.variables)).data ?? {}, data, undefined, undefined, `/data/${data}`);
  return { data, adapter, ref };
}

/** The keys of a data list's items, from the value its `KeyRead` read: each item's key field — or its place in the
 *  list, for a list with no key. Anything but a list has no items. */
export function keysIn(board: Board, data: string, value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const key = board.data?.[data]?.key;
  return value.flatMap((item, i) => {
    if (key === undefined) return [String(i)];
    const k = typeof item === 'object' && item !== null ? (item as Record<string, unknown>)[key] : undefined;
    return typeof k === 'string' || typeof k === 'number' ? [String(k)] : [];
  });
}

/** Make the view document that draws `board`. */
export function toViewDocument(input: Board, options: PictureOptions = {}): ViewDocument {
  // A board that reads variables is drawn with their values written out — the ones asked for that are among the options, else the defaults.
  const board = expandVariables(input, variableValues(variablesOf(input), options.variables, options.keysOf));
  // The board's data, and — as parts that a group makes per item of a list inside its item need them — the lists inside
  // an item, each as a data of its own (`insideOf`).
  const data: Record<string, Query> = { ...board.data };
  const statuses = board.statuses ?? {};
  const presets = board.presets ?? {};

  // ── what a part reads ──

  /** The data an `of` names, and the item when it names one. */
  const target = (of: string): { query: string; item?: string } => {
    const m = /^([\w-]+)(?:\[([^\]]+)\])?$/.exec(of)!;
    return m[2] === undefined ? { query: m[1]! } : { query: m[1]!, item: m[2] };
  };

  /** Where a binding reads, for a part of this board. */
  const readFor = (query: string, item: string | undefined, field: string | undefined, at: string) => readOf(data, query, item, field, at);

  /**
   * A state field's value in its status's words — what a value shown on its own reads as, where the field gives no `names` of
   * its own: the source's word to the label of the status it stands for. A value no status words are given for is left as the
   * source wrote it. A state of bands (numbers) has none: its value is the number.
   */
  const wordsOfState = (f: Field): ValueMapping | undefined => {
    if (f.names !== undefined || f.state === undefined || Array.isArray(f.state)) return undefined;
    const words: Record<string, string> = {};
    if (f.state === 'raw') {
      for (const [name, s] of Object.entries(statuses)) if (s.label !== undefined) words[name] = s.label;
    } else {
      for (const [raw, word] of Object.entries(f.state)) {
        const label = typeof word === 'string' ? statuses[word]?.label : undefined;
        if (raw !== '*' && label !== undefined) words[raw] = label;
      }
    }
    return Object.keys(words).length > 0 ? words : undefined;
  };
  /** A field with the words it is shown in: its own `names`, else its status's. */
  const withWords = (f: Field): Field => {
    const names = wordsOfState(f);
    return names === undefined ? f : { ...f, names };
  };
  const fieldOf = (query: string | undefined, name: string): Field => withWords(query === undefined ? {} : data[query]?.fields?.[name] ?? {});

  /**
   * Where a field lives in an item, as an item field reads it (`ItemField.from`): its key — `at` (`/sky` → `sky`), else
   * its own name — or, for a field deeper in the item (`/properties/mag`), the pointer itself.
   */
  const sourceOf = (query: string, name: string): string => {
    const where = fieldOf(query, name).at;
    if (where === undefined) return name;
    return where.indexOf('/', 1) >= 0 ? where : where.slice(1);
  };

  /** Whether a field lives deeper in an item than its top. */
  const isDeep = (query: string, name: string): boolean => sourceOf(query, name).startsWith('/');

  /**
   * The name a list's rows and a text read a field by: its key at the top of an item, and for a deeper field its own
   * name — which the item gains (`gainOf`), as it gains a field's words.
   */
  const columnOf = (query: string, name: string): string => (isDeep(query, name) ? name : sourceOf(query, name));

  /** What an item gains so `columnOf` finds a field that lives deeper: the field under its own name. */
  const gainOf = (query: string, name: string): Record<string, ItemField> => (isDeep(query, name) ? { [name]: { from: sourceOf(query, name) } } : {});

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

  /** Whether any status names a mark of its own — what a widget then draws for it, in place of its tone's. */
  const glyphed = Object.values(statuses).some(s => s.glyph !== undefined);

  /** How a field's state colours and names a value: the status of each raw value, as a tone and as words. */
  const stateMaps = (rule: StateRule): StateMaps => {
    if (isRelativeRule(rule)) {
      // The same maps over the bands, read against the clock.
      const maps = stateMaps(rule.relative);
      const against = <V>(m: ValueMap<V> | undefined): ValueMap<V> | undefined => (m ? { ...m, relativeTo: 'now' as const } : undefined);
      return {
        named: against(maps.named)!, tone: against(maps.tone)!, status: against(maps.status)!,
        ...(maps.emphasis ? { emphasis: against(maps.emphasis)! } : {}), ...(maps.glyph ? { glyph: against(maps.glyph)! } : {}),
      };
    }
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
    return {
      named: merge(mapOf(mapping, w => w), withTones),
      tone,
      status,
      ...(emphasised ? { emphasis: merge(mapOf(mapping, w => statuses[w]?.emphasis ?? '')) } : {}),
      ...(glyphed ? { glyph: merge(mapOf(mapping, w => statuses[w]?.glyph ?? '')) } : {}),
    };
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
        const bands = isRelativeRule(f.state) ? f.state.relative : f.state;
        const words = bands === 'raw' ? Object.keys(statuses) : Array.isArray(bands) ? bands.filter((w, i) => i % 2 === 0) : Object.values(bands);
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
      Object.assign(gained, gainOf(reads.query, name));
      if (f.names !== undefined) gained[`${name}$name`] = { from: sourceOf(reads.query, name), map: mapOf(f.names, w => w) };
      const shown = f.names !== undefined ? `${name}$name` : columnOf(reads.query, name);
      return `{{${shown}${pipeOf(f)}}}`;
    });
    return {
      ...readFor(reads.query, reads.item, undefined, at),
      ...(Object.keys(gained).length > 0 ? { itemFields: gained } : {}),
      text: written,
    };
  };

  // ── parts ──

  /** A part as drawn: its preset's settings under its own. */
  const resolve = (part: Part): Part => {
    const resolved = part.use !== undefined ? { ...presets[part.use], ...part } : part;
    // A group that gives no size is as large as the boxes of its parts reach.
    const reach = resolved.as === 'group' && resolved.size === undefined ? groupReach(resolved as { place?: unknown }) : undefined;
    return reach !== undefined ? { ...resolved, size: reach } : resolved;
  };

  /** The widget a part is drawn with, reading `query[item]` — or the whole of `query` when there is no item. */
  /** For each part (by its pointer), the binding key its fields' states are read at — what a trigger reads a status by. */
  const stateKeys = new Map<string, Map<string, string>>();
  /** The element name each shape is drawn as, by name — the shape id it stands for. */
  const shapeNames = new Map<string, string>();

  const drawnWidget = (raw: Part, at: string, reads?: { query: string; item?: string }): Widget => {
    const part = resolve(raw);
    const { as, use: _use, of: _of, each: _each, title, show, highlight, dim, ...options } = part;
    const kind = partKind(as!)!;
    // What styles the part (`scale`, `ink`, …) is read here, not handed to the widget as an option of its own.
    const partStyle = takeStyle(options, kind.kind);
    const fields = show === undefined ? [] : Array.isArray(show) ? show : [show];
    const query = reads?.query;
    const item = reads?.item;
    const bindings: Record<string, Binding> = {};
    const bind = (key: string, field: string | undefined, map?: ValueMap, scalar = false) => {
      if (query === undefined) return;
      const derive = field !== undefined ? fieldOf(query, field).derive : undefined;
      if (derive !== undefined) {
        // A derived field is the list reduced to a number: the whole list is read and the resolution computes it.
        if (item !== undefined) throw new PictureError(at, `"${field}" is computed from the items of "${query}" — show it from the list ("of": "${query}"), not from an item`);
        bindings[key] = {
          ...readFor(query, undefined, undefined, at),
          derive: {
            op: derive.op,
            ...(derive.field !== undefined ? { field: sourceOf(query, derive.field) } : {}),
            ...(derive.where !== undefined ? { where: Object.fromEntries(Object.entries(derive.where).map(([name, value]) => [sourceOf(query, name), value])) } : {}),
          },
          ...(map ? { map } : {}),
        };
        return;
      }
      bindings[key] = { ...readFor(query, item, field, at), ...(map ? { map } : {}), ...(scalar ? { scalar: true } : {}) };
    };
    const field = (name: string) => fieldOf(query, name);
    // `highlight` marks one item out from the others like it: the field's value, read beside the widget's own and drawn as a ring
    // around its frame, not as a prop of the widget (`$` — a reading only).
    if (highlight !== undefined) {
      if (typeof highlight !== 'string' || item === undefined) throw new PictureError(`${at}/highlight`, '"highlight" names a boolean field of one item — the part reads one: "of": "<data>[<key>]", or "each"');
      bind('$highlight', highlight);
    }
    // `dim` is `highlight`'s opposite: the same kind of field, and while it is true the part is drawn faded.
    if (dim !== undefined) {
      if (typeof dim !== 'string' || item === undefined) throw new PictureError(`${at}/dim`, '"dim" names a boolean field of one item — the part reads one: "of": "<data>[<key>]", or "each"');
      bind('$dim', dim);
    }
    const formatOf = (f: Field) => f.format ?? (f.digits !== undefined ? `number:${f.digits}` : undefined);
    /** A field's value bound at `key`, in its words when it names them. It is a text or a number the widget shows (`scalar`), unless the prop
     *  takes a structure: a trend's series, the data of a template element. */
    const bindValue = (key: string, name: string, scalar = true) => bind(key, name, field(name).names ? mapOf(field(name).names!, w => w) : undefined, scalar);
    /** A field's state bound at `<prefix>tone`, and at its words, emphasis and mark where the widget takes them. */
    const bindState = (prefix: string, name: string, takes: { words?: boolean; emphasis?: boolean; glyph?: boolean } = {}) => {
      const rule = field(name).state;
      if (rule === undefined) return;
      const maps = stateMaps(rule);
      bind(`${prefix}tone`, name, maps.tone);
      const keys = stateKeys.get(at) ?? new Map<string, string>();
      if (!keys.has(name)) keys.set(name, `${prefix}tone`);
      stateKeys.set(at, keys);
      if (takes.words) bind(`${prefix}status`, name, maps.status);
      if (takes.emphasis && maps.emphasis) bind(`${prefix}emphasis`, name, maps.emphasis);
      if (takes.glyph && maps.glyph) bind(`${prefix}glyph`, name, maps.glyph);
    };
    /**
     * The whole list bound at `key`, each item gaining `gained` — a row's tone from its state (`<field>$tone`), a field
     * under the name the widget reads it by.
     */
    const bindList = (key: string, gained: Record<string, ItemField>) => {
      bind(key, undefined);
      if (bindings[key] && Object.keys(gained).length > 0) bindings[key] = { ...bindings[key]!, itemFields: gained };
    };
    /** The fields a row gains for `name`: its tone (and mark) when the field has a state, its words when it names them. */
    const rowFields = (name: string | undefined): Record<string, ItemField> => {
      if (name === undefined) return {};
      const f = field(name);
      const maps = f.state !== undefined ? stateMaps(f.state) : undefined;
      return {
        ...gainOf(query!, name),
        ...(maps ? { [`${name}$tone`]: { from: source(name), map: maps.tone } } : {}),
        ...(maps?.glyph ? { [`${name}$glyph`]: { from: source(name), map: maps.glyph } } : {}),
        ...(f.names !== undefined ? { [`${name}$name`]: { from: source(name), map: mapOf(f.names, w => w) } } : {}),
      };
    };
    /**
     * What each item of a list gains for the fields `items` declares: a field's words under its own name, its tone,
     * status words, emphasis and mark under `<name>$tone` `$status` `$emphasis` `$glyph`. An item's `at` is relative to
     * the item: a key at its top, a pointer for a field deeper in it.
     */
    const itemFieldsOf = (items: Record<string, Field>): Record<string, ItemField> => {
      const gained: Record<string, ItemField> = {};
      for (const [name, field] of Object.entries(items)) {
        const f = withWords(field);
        const from = f.at === undefined ? name : f.at.indexOf('/', 1) >= 0 ? f.at : f.at.slice(1);
        if (f.names !== undefined) gained[name] = { from, map: mapOf(f.names, w => w) };
        else if (from !== name) gained[name] = { from };
        if (f.state !== undefined) {
          const maps = stateMaps(f.state);
          gained[`${name}$tone`] = { from, map: maps.tone };
          gained[`${name}$status`] = { from, map: maps.status };
          if (maps.emphasis) gained[`${name}$emphasis`] = { from, map: maps.emphasis };
          if (maps.glyph) gained[`${name}$glyph`] = { from, map: maps.glyph };
        }
      }
      return gained;
    };
    /** Where an item holds field `name`: a key, or a pointer for a field deeper in it. */
    const source = (name: string) => sourceOf(query!, name);
    /** The field a row shows `name` by: its words when it names them, else the field under its name (`rowFields` gains it). */
    const shown = (name: string) => (field(name).names !== undefined ? `${name}$name` : columnOf(query!, name));
    /** The first of `names` whose field has a state. */
    const stateIn = (names: readonly (string | undefined)[]) => names.find(n => n !== undefined && field(n).state !== undefined);
    const text = (t: string | undefined, key: string): string | undefined => {
      if (t === undefined) return undefined;
      const holes = matchesOf(t, /\{\{\s*([\w.-]+)\s*\}\}/g);
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
        // A trend is another field of the same item: the values the reading came from, drawn as a line under it.
        const { trend, ...rest } = options as { trend?: string };
        if (trend !== undefined) bindValue('data.sparkline', trend, false);
        const format = formatOf(f);
        return {
          type: 'metric',
          props: {
            data: { label: text(title, 'data.label') ?? f.label ?? name, value: '', ...(f.unit ? { unit: f.unit } : {}) },
            ...(format || Object.keys(rest).length ? { options: { ...(format ? { format } : {}), ...rest } } : {}),
          },
          bindings,
        };
      }
      case 'stat-list': {
        // A row is coloured by its own field's state, else by the `state` field's — a value toned by another field.
        const { state, ...rest } = options as { state?: string };
        const rows = fields.map((name, i) => {
          const f = field(name);
          bindValue(`data.${i}.value`, name);
          bindState(`data.${i}.`, f.state !== undefined || state === undefined ? name : state, { glyph: true });
          const format = formatOf(f);
          return { label: f.label ?? name, value: '', ...(f.unit ? { unit: f.unit } : {}), ...(format ? { format } : {}) };
        });
        return { type: 'kv', props: { ...(title !== undefined ? { title: text(title, 'title') } : {}), data: rows, ...(Object.keys(rest).length ? { options: rest } : {}) }, bindings };
      }
      case 'status-card': {
        // The first field with a state is the card's state; the others are its readings. A meter shows one field
        // against its range; a subtitle and a note are texts, as a title is.
        const { meter, note, subtitle, state, ...rest } = options as { meter?: Meter; note?: string; subtitle?: string; state?: string };
        const stateField = state ?? fields.find(n => field(n).state !== undefined);
        if (stateField) bindState('data.', stateField, { words: true, emphasis: true, glyph: true });
        const readings = fields.filter(n => n !== stateField).map((name, i) => {
          const f = field(name);
          bindValue(`data.readings.${i}.value`, name);
          bindState(`data.readings.${i}.`, name);
          const format = formatOf(f);
          return { label: f.label ?? name, value: '', ...(f.unit ? { unit: f.unit } : {}), ...(format ? { format } : {}) };
        });
        const gauge = meter === undefined ? undefined : typeof meter === 'string' ? { field: meter } : meter;
        let meterProp: Record<string, unknown> | undefined;
        if (gauge !== undefined) {
          const f = field(gauge.field);
          bindValue('data.meter.value', gauge.field);
          bindState('data.meter.', gauge.field);
          // An end of the range read from the item — a capacity — is a field's value; a number is the end itself.
          for (const end of ['min', 'max'] as const) {
            const value = gauge[end];
            if (typeof value === 'string') bindValue(`data.meter.${end}`, value);
          }
          const format = formatOf(f);
          meterProp = {
            value: 0,
            ...(typeof gauge.min === 'number' ? { min: gauge.min } : {}), ...(typeof gauge.max === 'number' ? { max: gauge.max } : {}),
            ...(f.unit ? { unit: f.unit } : {}), ...(format ? { format } : {}), ...(gauge.form !== undefined ? { form: gauge.form } : {}),
          };
        }
        const subtitleText = text(subtitle, 'data.subtitle');
        const noteText = text(note, 'data.note');
        return {
          type: 'status-card',
          props: {
            data: {
              title: text(title, 'data.title') ?? item ?? '',
              ...(subtitleText !== undefined ? { subtitle: subtitleText } : {}),
              ...(readings.length ? { readings } : {}),
              ...(meterProp ? { meter: meterProp } : {}),
              ...(noteText !== undefined ? { note: noteText } : {}),
            },
            ...(Object.keys(rest).length ? { options: rest } : {}),
          },
          bindings,
        };
      }
      case 'gauge': {
        const name = fields[0]!;
        const f = field(name);
        bindValue('data.value', name);
        bindState('data.', name);
        // An end read from the item — a capacity — is a field's value; a number is the end itself.
        const { max, ...gaugeOptions } = options as { max?: unknown };
        if (typeof max === 'string') bindValue('options.max', max);
        const format = formatOf(f);
        return {
          type: 'gauge',
          props: {
            data: { value: 0 },
            options: { ...(f.unit ? { unit: f.unit } : {}), ...(format ? { format } : {}), ...(title !== undefined ? { subtitle: text(title, 'options.subtitle') } : {}), ...(typeof max === 'number' ? { max } : {}), ...gaugeOptions },
          },
          bindings,
        };
      }
      case 'table': {
        // A column whose field has a state colours each of its cells by it; `state` names the field whose state colours the whole row
        // (a field the table need not show).
        const { state: rowState, ...tableOptions } = options as { state?: string };
        // The row takes its status's emphasis too — inverted, hatched, its mark blinking — as the status card draws it.
        const rowEmphasis = rowState !== undefined && field(rowState).state !== undefined ? stateMaps(field(rowState).state!).emphasis : undefined;
        bindList('data', Object.assign({}, ...fields.map(rowFields), rowState !== undefined && field(rowState).state !== undefined ? {
          [`${rowState}$tone`]: rowFields(rowState)[`${rowState}$tone`],
          ...(rowEmphasis ? { [`${rowState}$emphasis`]: { from: source(rowState), map: rowEmphasis } } : {}),
        } : {}));
        const columns = fields.map(name => {
          const f = field(name);
          const format = formatOf(f);
          return {
            field: shown(name), label: f.label ?? name,
            ...(f.unit ? { unit: f.unit } : {}), ...(format ? { format } : {}), ...(isFigure(f) ? { align: 'right' } : {}),
            ...(f.state !== undefined ? { toneField: `${name}$tone` } : {}),
          };
        });
        return {
          type: 'table',
          props: {
            ...(title !== undefined ? { title: text(title, 'title') } : {}), data: [],
            ...(columns.length || rowState !== undefined ? { mapping: { ...(columns.length ? { columns } : {}), ...(rowState !== undefined ? { tone: `${rowState}$tone`, ...(rowEmphasis ? { emphasis: `${rowState}$emphasis` } : {}) } : {}) } } : {}),
            ...(Object.keys(tableOptions).length ? { options: tableOptions } : {}),
          },
          bindings,
        };
      }
      case 'list': {
        // Rows: the first field (or `primary`) as the line, `secondary` under it, `trailing` at its end, a `badge` beside
        // it, `time` before it, coloured by a state.
        const { primary = fields[0], secondary, trailing, badge, time, state, max, variant, ...rest } = options as Record<string, string | undefined> & { max?: number };
        const tone = stateIn([state, ...fields]);
        bindList('data', Object.assign({}, rowFields(primary), rowFields(secondary), rowFields(trailing), rowFields(badge), rowFields(tone), time !== undefined ? gainOf(query!, time) : {}));
        const mapping = {
          ...(primary !== undefined ? { primary: shown(primary) } : {}),
          ...(secondary !== undefined ? { secondary: shown(secondary) } : {}),
          ...(trailing !== undefined ? { trailing: shown(trailing) } : {}),
          ...(badge !== undefined ? { badge: shown(badge) } : {}),
          ...(time !== undefined ? { time: columnOf(query!, time) } : {}),
          ...(tone !== undefined ? { tone: `${tone}$tone` } : {}),
          ...(tone !== undefined && glyphed ? { glyph: `${tone}$glyph` } : {}),
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
          ...(labelField !== undefined ? { label: { from: source(labelField), ...(field(labelField).names ? { map: mapOf(field(labelField).names!, w => w) } : {}) } } : {}),
          ...(valueField !== undefined ? { value: { from: source(valueField) } } : {}),
          // the value's unit and format, as every other part that shows a field writes it: the same for each item, so a map with no values
          // and an `otherwise` gives every item it
          ...(valueField !== undefined && field(valueField).unit ? { unit: { from: source(valueField), map: { otherwise: field(valueField).unit } } } : {}),
          ...(valueField !== undefined && formatOf(field(valueField)) ? { format: { from: source(valueField), map: { otherwise: formatOf(field(valueField)) } } } : {}),
          ...(tone !== undefined && toneMap !== undefined ? { tone: { from: source(tone), map: stateMaps(toneMap).tone } } : {}),
          // a grid's cells draw the second channel a status names (a bar's row has none)
          ...(kind.kind === 'status-grid' && tone !== undefined && toneMap !== undefined && stateMaps(toneMap).emphasis ? { emphasis: { from: source(tone), map: stateMaps(toneMap).emphasis! } } : {}),
        });
        return {
          type: kind.kind,
          props: { ...(title !== undefined ? { title: text(title, 'title') } : {}), data: [], ...(Object.keys(rest).length ? { options: rest } : {}) },
          bindings,
        };
      }
      case 'header': {
        const { kicker, subtitle, clock, time, date, since, ...rest } = options as { kicker?: string; subtitle?: string; clock?: unknown; time?: string; date?: string; since?: string };
        // The time and the date the data gives (a field of what the part reads, as an ISO string) are the widget's own — shown by
        // the viewer in the language and the form it shows a time in. They are not the clock, which is the time of day now.
        // `since` is the same time as how long ago it was.
        if (typeof time === 'string') bindValue('data.time', time);
        if (typeof date === 'string') bindValue('data.date', date);
        if (typeof since === 'string') bindValue('data.since', since);
        // The fields it shows: the first with a state is the state of the whole (its tone and words), the others are the values
        // set beside the title — as a status card reads its fields.
        const stateField = stateIn(fields);
        if (stateField) bindState('data.', stateField, { words: true });
        const aside = fields.filter(n => n !== stateField).map((name, i) => {
          const f = field(name);
          bindValue(`data.aside.${i}.value`, name);
          bindState(`data.aside.${i}.`, name);
          const format = formatOf(f);
          return { label: f.label ?? name, value: '', ...(f.unit ? { unit: f.unit } : {}), ...(format ? { format } : {}) };
        });
        // A time with an offset is shown on the clock of the zone the source writes its times in (the read's `zone`), not the viewer's.
        const zone = query !== undefined ? data[query]?.zone : undefined;
        if (typeof zone === 'string' && (time !== undefined || date !== undefined)) (rest as Record<string, unknown>).timeZone = zone;
        return {
          type: 'header',
          props: {
            data: {
              text: text(title, 'data.text') ?? '',
              // the kicker and the subtitle read `{{field}}` as the title does: a bound one is filled in when the value is read
              ...(kicker !== undefined ? { kicker: text(kicker, 'data.kicker') ?? '' } : {}),
              ...(subtitle !== undefined ? { subtitle: text(subtitle, 'data.subtitle') ?? '' } : {}),
              ...(clock === true ? { clock: true } : {}),
              ...(aside.length > 0 ? { aside } : {}),
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
          const mappingKeys = chartMapping(kind.widget);
          const mapping = Object.fromEntries(Object.entries(options).filter(([k]) => mappingKeys.includes(k)));
          const rest = Object.fromEntries(Object.entries(options).filter(([k]) => !mappingKeys.includes(k)));
          // The library's treemap reads rows that are already `{ name, value }` and takes no mapping; the part says which fields they are,
          // as every other chart's `name` and `value` do, so the rows gain them here.
          if (kind.widget === 'chart.treemap' && bindings['data'] !== undefined) {
            const named = Object.fromEntries((['name', 'value'] as const).flatMap(k => (typeof mapping[k] === 'string' ? [[k, { from: source(mapping[k] as string) }]] : [])));
            if (Object.keys(named).length > 0) {
              bindings['data'] = { ...bindings['data']!, itemFields: named };
              delete mapping['name'];
              delete mapping['value'];
            }
          }
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
        const { shape = 'dot', symbol, note, labelAt } = options as { shape?: string; symbol?: string; note?: string; labelAt?: string };
        const stateField = stateIn(fields);
        if (stateField) bindState('', stateField, { words: true, emphasis: true, glyph: true });
        const props = { name: text(title, 'name') ?? item ?? '', tone: '', status: '', emphasis: '', glyph: '', note: text(note, 'note') ?? '' };
        // A marker with a symbol draws the board's drawing — one, or the one a field names — in its status's colour.
        if (symbol !== undefined) return { type: builtin('u-board-marker-symbol', MARKER_SYMBOL), props: { ...props, symbol: text(symbol, 'symbol') ?? '' }, bindings };
        return { type: builtin('u-board-marker', MARKER), props: { ...props, shape, labelAt: labelAt === 'right' || labelAt === 'left' || labelAt === 'above' || labelAt === 'below' ? labelAt : labelAt === 'auto' ? 'below' : '' }, bindings };
      }
      case 'label': {
        const name = fields[0];
        const textProp = title !== undefined ? text(title, 'text') : name !== undefined ? (bindValue('text', name), '') : '';
        if (name !== undefined) bindState('', name);
        const { scale, ink, face } = partStyle as { scale?: string; ink?: string; face?: string };
        return {
          type: builtin('u-board-label', LABEL),
          props: {
            text: textProp ?? '', tone: '',
            // only what the part sets: a label that styles nothing is the props it always had
            ...(scale !== undefined && scale !== 'regular' && has(NUMERAL_SCALES, scale) ? { scale } : {}),
            ...(ink === 'muted' || ink === 'accent' ? { ink } : {}),
            ...(face === 'pill' ? { face } : {}),
          },
          bindings,
        };
      }
      case 'legend': {
        const items = usedStatuses().map(name => {
          const s = statuses[name]!;
          return { tone: s.tone, label: s.label ?? name, glyph: s.glyph ?? '' };
        });
        return { type: builtin('u-board-legend', LEGEND), props: { items, title: title ?? '' } };
      }
      case 'element': {
        // One of the board's own drawings: its fixed props, and props bound to a field, its status or its tone.
        const { element, props: fixed = {}, bind: bound = {} } = options as { element: string; props?: Record<string, unknown>; bind?: Record<string, string> };
        const definition = board.elements![element]!;
        elements[element] ??= elementDefinition(definition);
        for (const [prop, ref] of Object.entries(bound)) {
          const [name, what] = ref.split('.') as [string, 'status' | 'tone' | undefined];
          if (what === undefined) {
            bindValue(prop, name, false);
            const items = field(name).items;
            if (items !== undefined && bindings[prop] !== undefined) bindings[prop] = { ...bindings[prop]!, itemFields: itemFieldsOf(items) };
          } else bind(prop, name, what === 'tone' ? stateMaps(field(name).state!).tone : statusNames(field(name).state!));
        }
        // A prop the part does not set stays unset — a template's `{{#prop}}` section is then left out, as its author
        // wrote it; a blank stand-in (`0`, `''`) would be a value and open it.
        return { type: `element:${element}`, props: { ...fixed }, bindings };
      }
      case 'group':
        throw new PictureError(at, 'a group is drawn by the layout that places it');
    }
  };

  /** The widget a part is drawn with. A board whose skin says `density: "compact"` draws every widget that has a `compact`
   *  option compact, unless the part sets `compact` itself (`false` keeps it regular). */
  const compactBoard = board.board?.skin?.density === 'compact';
  const widgetFor = (raw: Part, at: string, reads?: { query: string; item?: string }): Widget => {
    const drawn = drawnWidget(raw, at, reads);
    // A part's own styling reaches the widget library as tokens on that widget only, over the skin's.
    const part = resolve(raw);
    const tokens = partTokens(part.as!, styleOf(part, part.as!));
    const widget: Widget = Object.keys(tokens).length > 0 ? { ...drawn, tokens } : drawn;
    if (!compactBoard || !partKind(part.as!)?.options.includes('compact')) return widget;
    const options = (widget.props?.options ?? {}) as Record<string, unknown>;
    if (options.compact !== undefined) return widget;
    return { ...widget, props: { ...widget.props, options: { ...options, compact: true } } };
  };

  /** A field's state as the status name each raw value is in — what an element's `<field>.status` reads. */
  const statusNames = (rule: StateRule): ValueMap<string> =>
    rule === 'raw'
      ? { values: Object.fromEntries([...Object.keys(statuses), ...TONES].map(n => [n, n])), otherwise: 'off' }
      : isRelativeRule(rule) ? { ...mapOf(rule.relative, w => w), relativeTo: 'now' as const } : mapOf(rule, w => w);

  /** The data a part reads, for an item `key` of an `each` part or as its `of` says. */
  const readsOf = (part: Part, key?: string): Reads | undefined => {
    const p = resolve(part);
    if (p.each !== undefined) return { query: p.each, ...(key !== undefined ? { item: key } : {}) };
    return p.of !== undefined ? target(p.of) : undefined;
  };

  /**
   * The list inside the group's item that a part inside the group is made per item of (`each: '/assets'`), as a data of
   * its own: the pointer says where the list is in the item (the same kind of pointer a field's `at` is), the fields are
   * what the list field's `items` say, and an item of it is addressed by its place in the list.
   */
  const insideOf = (pointer: string, reads: Reads | null | undefined, at: string): string => {
    if (reads === null || reads === undefined || reads.item === undefined) {
      throw new PictureError(at, `"each": "${pointer}" makes a part per item of a list inside the group's item — the group itself is made per item of a data ("each")`);
    }
    const base = data[reads.query]!;
    if (base.list === undefined || base.path === undefined) {
      throw new PictureError(at, `"each": "${pointer}" reads a list inside an item of "${reads.query}" — a data read of a connector's "path" with a "list"`);
    }
    const name = `${reads.query}[${reads.item}]${pointer}`;
    if (data[name] === undefined) {
      const holder = Object.entries(base.fields ?? {}).find(([n, f]) => (f.at ?? `/${n}`) === pointer)?.[1];
      if (holder?.key !== undefined && base.key === undefined) {
        throw new PictureError(at, `"each": "${pointer}" reads a list whose items are named by a "key" inside an item of "${reads.query}", which has none — an item named by its place cannot be found again when the list changes; give "${reads.query}" a "key" too`);
      }
      const derived: DerivedQuery = { from: base.from, path: base.path, fields: holder?.items ?? {}, ...(holder?.key !== undefined ? { key: holder.key } : {}), baseName: reads.query, base, outer: reads.item, within: pointer };
      data[name] = derived;
    }
    return name;
  };

  /** The items of a data the caller can tell: its rows — for a list inside an item, the ones in that item of its data. */
  const rowsFor = (query: string): readonly unknown[] | undefined => {
    const q = data[query] as DerivedQuery | undefined;
    if (q === undefined || q.within === undefined) return options.rowsOf?.(query);
    const rows = options.rowsOf?.(q.baseName);
    if (rows === undefined) return undefined;
    const row = q.base.key === undefined
      ? rows[Number(q.outer)]
      : rows.find(r => typeof r === 'object' && r !== null && String((r as Record<string, unknown>)[q.base.key!]) === q.outer);
    const list = typeof row === 'object' && row !== null ? valueAtPointer(row as Record<string, unknown>, q.within) : undefined;
    return Array.isArray(list) ? list : [];
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
    /** The markers whose words go on the side their links leave free (`labelAt: "auto"`). */
    const autoLabelled = new Set<string>();
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
      if (p.as === 'marker' && p.labelAt === 'auto') autoLabelled.add(nodeId);
      nodes.push({ id: nodeId, x, y, ...placed, anchored: true, ...(p.as === 'marker' && (MARKER_JOINT_SIDES.includes(p.labelAt as string) || p.labelAt === 'auto') ? { joint: MARKER_JOINT } : {}), widget: widgetFor(part, `/parts/${partId}`, reads) });
    };
    for (const [id, place] of Object.entries(canvas.place)) {
      const part = parts[id]!;
      // A part inside a group reads the group's data unless it names its own — or is made per item of a list inside the
      // group's item (`each: '/assets'`).
      const each = resolve(part).each;
      const inside = typeof each === 'string' && each.startsWith('/') ? insideOf(each, frame.reads, `${at}/place/${id}`) : undefined;
      const own = (key?: string): Reads | undefined => inside !== undefined
        ? { query: inside, ...(key !== undefined ? { item: key } : {}) }
        : readsOf(part, key) ?? (frame.reads === null ? undefined : frame.reads);
      if (Array.isArray(place)) placeOne(id, id, part, place, own());
      else if (isDataPlace(place)) placeByFields(id, part, place, canvas.size, `${at}/place/${id}`, own, placeOne, inside);
      else if (isFlowPlace(place)) placeByFlow(id, part, place, `${at}/place/${id}`, own, placeOne, (shape, name) => decorations.push(shapeOf(moveShape(shape, frame), `${prefix}shape.${name}`)), inside);
      else for (const [key, p] of Object.entries(place)) placeOne(id, `${id}/${key}`, part, p as Place, own(key));
    }
    for (const [id, shape] of Object.entries(canvas.shapes ?? {})) {
      const moved = moveShape(shape, frame);
      if (moved.line !== undefined || moved.path !== undefined) lines.push(lineNode(moved, `${prefix}shape.${id}`, `${at}/shapes/${id}`, frame.reads ?? undefined));
      else decorations.push(shapeOf(moved, `${prefix}shape.${id}`, `${at}/shapes/${id}`, frame.reads ?? undefined));
    }
    for (const [id, link] of Object.entries(canvas.links ?? {})) {
      // A link inside a group reads the group's data unless it names its own, as the group's parts do.
      const of = link.of ?? (frame.reads ? (frame.reads.item !== undefined ? `${frame.reads.query}[${frame.reads.item}]` : frame.reads.query) : undefined);
      connectors.push(connectorOf({ ...link, ...(of !== undefined ? { of } : {}), from: `${frame.ids}${link.from}`, to: `${frame.ids}${link.to}` }, `${prefix}link.${id}`, `${at}/links/${id}`));
    }
    if (autoLabelled.size > 0) sideFreeOfLinks(nodes, connectors, autoLabelled);
    // Lines are drawn under the parts, as the decorations are.
    return { nodes: [...lines, ...nodes], connectors, ...(decorations.length > 0 ? { decorations } : {}) };
  };

  /**
   * An `each` part placed by its items' fields: one place per item, from its two fields, linearly from the frame's
   * values onto the canvas. The position is the middle of the box — `size`, else the group's own size, else the default.
   */
  const placeByFields = (
    partId: string, part: Part, where: DataPlace, canvasSize: [number, number], at: string, own: (key?: string) => Reads | undefined,
    placeOne: (partId: string, id: string, part: Part, place: Place, reads: Reads | undefined) => void,
    inside?: string,
  ) => {
    const p = resolve(part);
    const query = inside ?? (typeof p.each === 'string' ? p.each : undefined);
    if (query === undefined) throw new PictureError(at, 'a place by fields is for a part made per item (each)');
    const rows = rowsFor(query);
    if (rows === undefined) throw new PictureError(at, `the items of "${query}" are not known — give rowsOf`);
    // A field lives where it says (`at`, a JSON Pointer into an item — a GeoJSON feature's `/geometry/coordinates/0`), else under its own name.
    const [xAt, yAt] = where.at.map(name => fieldOf(query, name).at ?? `/${name}`) as [string, string];
    const keyField = data[query]?.key;
    const [left, top, right, bottom] = where.frame ?? [0, 0, canvasSize[0], canvasSize[1]];
    const boxed = where.size ?? (p.as === 'group' ? (p.size as [number, number]) : undefined);
    const [w, h] = boxed ?? [DEFAULT_NODE_WIDTH, DEFAULT_NODE_HEIGHT];
    let skipped = 0;
    rows.forEach((row, i) => {
      const item = typeof row === 'object' && row !== null ? (row as Record<string, unknown>) : {};
      const named = keyField === undefined ? String(i) : item[keyField];
      const x = valueAtPointer(item, xAt);
      const y = valueAtPointer(item, yAt);
      const numbers = typeof x === 'number' && typeof y === 'number' && Number.isFinite(x) && Number.isFinite(y);
      // The point on the canvas: `frame` puts the values at its edges linearly; `matrix` turns and slants them (a plan turned on the page, isometric).
      const [cx, cy] = !numbers ? [NaN, NaN]
        : where.matrix !== undefined
          ? [where.matrix[0] * (x as number) + where.matrix[2] * (y as number) + where.matrix[4], where.matrix[1] * (x as number) + where.matrix[3] * (y as number) + where.matrix[5]]
          : [((x as number) - left) / (right - left) * canvasSize[0], ((y as number) - top) / (bottom - top) * canvasSize[1]];
      const inside = numbers && (where.matrix !== undefined
        ? cx >= 0 && cx <= canvasSize[0] && cy >= 0 && cy <= canvasSize[1]
        : (x as number) >= Math.min(left, right) && (x as number) <= Math.max(left, right) && (y as number) >= Math.min(top, bottom) && (y as number) <= Math.max(top, bottom));
      if ((typeof named !== 'string' && typeof named !== 'number') || !inside) { skipped += 1; return; }
      // The point of the box that is the position: its middle, or the middle of an edge (a dot at the left of its label).
      const reach = [where.anchor === 'left' ? 0 : where.anchor === 'right' ? w : w / 2, where.anchor === 'top' ? 0 : where.anchor === 'bottom' ? h : h / 2] as const;
      const corner = [cx - reach[0], cy - reach[1]] as const;
      const place: Place = boxed !== undefined && where.size !== undefined ? [...corner, w, h] : [...corner];
      placeOne(partId, `${partId}/${String(named)}`, part, place, own(String(named)));
    });
    if (skipped > 0) options.onUnplaced?.(partId, skipped);
  };

  /**
   * An `each` part placed by a rule (`FlowPlace`): the items in the order the data gives them, flowing in columns — or, with
   * `by`, grouped by a field's value into boxes, the items flowing inside each. An item with no key, or no value in the `by`
   * field, is not drawn.
   */
  const placeByFlow = (
    partId: string, part: Part, where: FlowPlace, at: string, own: (key?: string) => Reads | undefined,
    placeOne: (partId: string, id: string, part: Part, place: Place, reads: Reads | undefined) => void,
    addBox: (shape: Shape, name: string) => void,
    inside?: string,
  ) => {
    const p = resolve(part);
    const query = inside ?? (typeof p.each === 'string' ? p.each : undefined);
    if (query === undefined) throw new PictureError(at, 'a place by a rule is for a part made per item (each)');
    const rows = rowsFor(query);
    if (rows === undefined) throw new PictureError(at, `the items of "${query}" are not known — give rowsOf`);
    const keyField = data[query]?.key;
    const { flow } = where;
    const [cw, ch] = flow.cell;
    const [gx, gy] = flow.gap ?? [0, 0];
    // Each item's key and, with `by`, the value it is grouped by — in the order the data gives them.
    let skipped = 0;
    const entries: { key: string; group: string }[] = [];
    rows.forEach((row, i) => {
      const item = typeof row === 'object' && row !== null ? (row as Record<string, unknown>) : {};
      const named = keyField === undefined ? String(i) : item[keyField];
      const grouped = where.by === undefined ? '' : item[where.by];
      const valued = where.by === undefined || typeof grouped === 'string' || typeof grouped === 'number';
      if ((typeof named !== 'string' && typeof named !== 'number') || !valued) { skipped += 1; return; }
      entries.push({ key: String(named), group: String(grouped) });
    });
    const put = (key: string, x: number, y: number) => placeOne(partId, `${partId}/${key}`, part, [x, y, cw, ch], own(key));
    if (where.by === undefined) {
      const [x0, y0] = flow.at ?? [0, 0];
      entries.forEach(({ key }, i) => put(key, x0 + (i % flow.columns) * (cw + gx), y0 + Math.floor(i / flow.columns) * (ch + gy)));
    } else {
      const boxes = where.boxes!;
      const groups = new Map<string, string[]>();
      for (const { key, group } of entries) (groups.get(group) ?? groups.set(group, []).get(group)!).push(key);
      const [padX, padTop] = flow.pad ?? [0, 0];
      const most = Math.max(1, ...[...groups.values()].map(members => members.length));
      const innerRows = Math.ceil(most / flow.columns);
      const [bw, bh] = boxes.cell ?? [padX * 2 + flow.columns * cw + (flow.columns - 1) * gx, padTop + innerRows * ch + (innerRows - 1) * gy + padX];
      const [ox, oy] = boxes.at ?? [0, 0];
      const [bgx, bgy] = boxes.gap ?? [0, 0];
      [...groups.entries()].forEach(([value, members], gi) => {
        const x0 = ox + (gi % boxes.columns) * (bw + bgx);
        const y0 = oy + Math.floor(gi / boxes.columns) * (bh + bgy);
        addBox({ box: [x0, y0, bw, bh], label: replaceEvery(boxes.label ?? '{{key}}', '{{key}}', value) }, `${partId}-box-${gi}`);
        members.forEach((key, i) => put(key, x0 + padX + (i % flow.columns) * (cw + gx), y0 + padTop + Math.floor(i / flow.columns) * (ch + gy)));
      });
    }
    if (skipped > 0) options.onUnplaced?.(partId, skipped);
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

  /** A status's emphasis map with each word replaced by what `to` makes of it — a link's dash or width, a box's hatch. */
  const emphasisMap = (emphasis: ValueMap, to: (e: string) => unknown): ValueMap => ({
    ...emphasis,
    ...(emphasis.values ? { values: Object.fromEntries(Object.entries(emphasis.values).map(([k, e]) => [k, to(e as string)])) } : {}),
    ...(emphasis.ranges ? { ranges: emphasis.ranges.map(r => ({ ...r, value: to(r.value as string) })) } : {}),
    ...('otherwise' in emphasis ? { otherwise: to(emphasis.otherwise as string) } : {}),
  }) as ValueMap;

  /**
   * A shape as a decoration: a box with its label, or a text at a point — in its tone, else (a text) the skin's `ground`, else the
   * board's own text, and a box in the board's muted line. A box that
   * shows a state (`of` and `show`, the group's data when it names none) takes its outline's tone from the field's state, and
   * `fill` fills it in that tone (`tone`) or hatches it (`hatch`) — a status whose emphasis is `hatch` hatches a `tone` box too. Its
   * outline takes the emphasis's form as a link's does: dashed, dots that travel along it, twice as thick.
   */
  const shapeOf = (shape: Shape, id: string, path?: string, reads?: Reads): ViewShape => {
    if (shape.box !== undefined) {
      const [x, y, width, height] = shape.box;
      const rect: ViewShape = {
        id, type: 'rect', x, y, width, height, fill: 'none', stroke: shape.tone ?? 'idle', strokeWidth: shape.width ?? 1.5,
        ...(shape.dash ? { dash: 'dashed' as const } : {}),
        ...(shape.label !== undefined ? { label: shape.label, labelAt: 'top-start' as const } : {}),
      };
      const of = shape.of ?? (reads ? (reads.item !== undefined ? `${reads.query}[${reads.item}]` : reads.query) : undefined);
      // A fill with no state: the box's own tone, a tint of it or lines of it.
      if (shape.fill !== undefined && shape.show === undefined) {
        if (shape.fill === 'tone') rect.fillOpacity = STATE_TINT;
        else rect.hatch = true;
        rect.fill = shape.tone ?? 'idle';
        return rect;
      }
      if (of !== undefined && shape.show !== undefined && path !== undefined) {
        const { query, item } = target(of);
        const rule = fieldOf(query, shape.show).state;
        if (rule !== undefined) {
          const maps = stateMaps(rule);
          const binding = (map: ValueMap): Binding => ({ ...readFor(query, item, shape.show, path), map });
          const bindings: Record<string, Binding> = { stroke: binding(maps.tone) };
          if (shape.fill !== undefined) bindings.fill = binding(maps.tone);
          if (shape.fill === 'tone') rect.fillOpacity = STATE_TINT;
          if (shape.fill === 'hatch') rect.hatch = true;
          else if (shape.fill === 'tone' && maps.emphasis) bindings.hatch = binding(emphasisMap(maps.emphasis, e => e === 'hatch'));
          // The outline takes the status's emphasis as a link and a path do: `hatch` dashed, `blink` dots that travel along it, `invert` thick.
          if (maps.emphasis) {
            const width = rect.strokeWidth ?? 1.5;
            bindings.dash = binding(emphasisMap(maps.emphasis, e => (e === 'hatch' ? 'dashed' : e === 'blink' ? 'flowing' : shape.dash ? 'dashed' : 'solid')));
            bindings.strokeWidth = binding(emphasisMap(maps.emphasis, e => (e === 'invert' ? width * 2 : width)));
          }
          return { ...rect, bindings };
        }
      }
      return rect;
    }
    const at = shape.at!;
    const ground = board.board?.skin?.palette?.ground;
    return { id, type: 'text', x: at[0], y: at[1], text: shape.text!, fill: shape.tone ?? (isSkinColor(ground) ? ground : 'next'), ...(shape.size !== undefined ? { fontSize: shape.size } : {}) };
  };

  /**
   * A line or a path as a node of its own, boxed around its points with room for its width. One that shows a state (`of` and
   * `show` — the group's data when it names none) is drawn by an element whose tone is read from the field, and a path's inside
   * by `fill` (a tint, or hatch lines, which a status whose emphasis is `hatch` also turns on for a `tone` fill).
   */
  const lineNode = (shape: Shape, id: string, path?: string, reads?: Reads): Node => {
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
    // An element name per shape: ids that read the same once cleaned (`a.b`, `a-b`) are told apart by a count.
    const base = `u-board-${id.replace(/[^a-z0-9-]+/gi, '-').toLowerCase()}`;
    let name = base;
    for (let n = 2; shapeNames.has(name) && shapeNames.get(name) !== id; n++) name = `${base}-${n}`;
    shapeNames.set(name, id);
    const of = shape.of ?? (reads ? (reads.item !== undefined ? `${reads.query}[${reads.item}]` : reads.query) : undefined);
    // A path with a fill and no state: its own tone, the inside a tint of it or lines of it — the state element with nothing bound.
    if (shape.fill !== undefined && shape.show === undefined) {
      const props = { tone: shape.tone ?? 'idle', fill: shape.fill, hatch: shape.fill === 'hatch' ? 'true' : '', form: '' };
      return { id, x, y, ...box, anchored: true, widget: { type: builtin(name, stateLineElement(d, box, { width, dash: shape.dash === true })), props } };
    }
    if (of !== undefined && shape.show !== undefined && path !== undefined) {
      const { query, item } = target(of);
      const rule = fieldOf(query, shape.show).state;
      if (rule !== undefined) {
        const maps = stateMaps(rule);
        const binding = (map: ValueMap): Binding => ({ ...readFor(query, item, shape.show, path), map });
        const bindings: Record<string, Binding> = { tone: binding(maps.tone) };
        if (shape.fill === 'tone' && maps.emphasis) bindings.hatch = binding(emphasisMap(maps.emphasis, e => (e === 'hatch' ? 'true' : 'false')));
        // The outline takes the status's emphasis as a link does: `hatch` dashed, `blink` dots that travel along it, `invert` thick.
        if (maps.emphasis) bindings.form = binding(emphasisMap(maps.emphasis, e => (e === 'hatch' ? 'dashed' : e === 'blink' ? 'flowing' : e === 'invert' ? 'thick' : '')));
        const props = { tone: shape.tone ?? 'idle', fill: shape.fill ?? 'none', hatch: shape.fill === 'hatch' ? 'true' : '', form: '' };
        return { id, x, y, ...box, anchored: true, widget: { type: builtin(name, stateLineElement(d, box, { width, dash: shape.dash === true })), props, bindings } };
      }
    }
    return { id, x, y, ...box, anchored: true, widget: { type: builtin(name, lineElement(d, box, { tone: shape.tone, width, dash: shape.dash === true })) } };
  };

  /**
   * A link as a connector between the nodes of its parts. With `of` and `show` it carries the field's state: its colour
   * is the tone, its emphasis the line's form — `hatch` dashed, `blink` dots that travel along it, `invert` twice as thick.
   */
  const connectorOf = (link: Link, id: string, at: string): Connector => {
    const width = link.width ?? 2;
    const bindings: Record<string, Binding> = {};
    let label = link.label;
    if (link.of !== undefined) {
      const { query, item } = target(link.of);
      const binding = (field: string, map?: ValueMap): Binding => ({ ...readFor(query, item, field, at), ...(map ? { map } : {}) });
      const rule = link.show !== undefined ? fieldOf(query, link.show).state : undefined;
      if (rule !== undefined) {
        const maps = stateMaps(rule);
        bindings['style.stroke'] = binding(link.show!, maps.tone);
        if (maps.emphasis) {
          const form = (to: (e: string) => unknown) => emphasisMap(maps.emphasis!, to);
          bindings['style.dash'] = binding(link.show!, form(e => (e === 'hatch' ? 'dashed' : e === 'blink' ? 'flowing' : link.dash ? 'dashed' : 'solid')));
          bindings['style.strokeWidth'] = binding(link.show!, form(e => (e === 'invert' ? width * 2 : width)));
        }
      }
      // An amount sets the width itself — over a status's form, which then keeps only its colour and dash.
      if (link.weight !== undefined) bindings['style.strokeWidth'] = binding(link.weight.field, weightMap(link.weight));
      // A direction that reverses: the arrowheads read from a field, `none` until it answers.
      if (typeof link.arrow === 'object') bindings['style.arrow'] = binding(link.arrow.field, bandsOrMap(link.arrow));
      // A label of one field (with words around it) binds that field — wherever it lives in the item — and keeps its words
      // as the connector's own pattern, the field's places in it; a label of several fields is a text of the item.
      const one = label !== undefined ? /^([^{}]*)\{\{\s*([\w.-]+)\s*\}\}([^{}]*)$/.exec(label) : null;
      if (one && one[2] !== 'key') {
        const f = fieldOf(query, one[2]!);
        bindings.label = binding(one[2]!, f.names ? mapOf(f.names, w => w) : undefined);
        const pipe = f.names ? '' : pipeOf(f);
        label = one[1] === '' && one[3] === '' && pipe === '' ? '' : `${one[1]}{{value${pipe}}}${one[3]}`;
      } else if (label !== undefined && /\{\{/.test(label)) {
        bindings.label = textBinding(label, { query, ...(item !== undefined ? { item } : {}) }, at);
        label = '';
      }
    }
    return {
      id, fromNodeId: link.from, toNodeId: link.to,
      ...(label !== undefined ? { label } : {}),
      style: {
        stroke: link.tone ?? 'idle', strokeWidth: width, ...(link.dash ? { dash: 'dashed' as const } : {}), arrow: typeof link.arrow === 'string' ? link.arrow : 'none',
        ...(link.route !== undefined && link.route !== 'straight' ? { route: link.route } : {}),
      },
      ...(Object.keys(bindings).length > 0 ? { bindings } : {}),
    };
  };

  const background = (canvas: Omit<CanvasLayout, 'kind'>) =>
    (canvas.background !== undefined ? { image: { src: canvas.background, width: canvas.size[0], height: canvas.size[1] } } : {});

  /** What a grid places for one entry — a part (once, or once per item of an `each` part), a group, or a canvas. */
  const unitsOf = (entry: BoardGridItem, at: string, i: number): Unit[] => {
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
    if (typeof p.each === 'string' && p.each.startsWith('/')) {
      throw new PictureError(`${at}/${i}`, `"each": "${p.each}" is for a part inside a group — a group made per item of a data, with the part in its "parts"`);
    }
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
      last(rows)!.push({ unit, span });
      used += twelfths;
    }
    if (used < 12) throw new PictureError(at, `each row of a grid in a cell fills the cell — the last row takes ${used} of 12`);
    // a cell that holds only the parts of an `each` has nothing in it until its list has items — one empty row, not none
    if (rows.length === 0) rows.push([]);
    return rows;
  };

  /**
   * A grid's items in order. A cell holding a grid lays its items out in the cell's columns, in rows that fill it: the
   * row it sits in becomes as many rows as the cell has, the items beside it spanning them all.
   */
  const gridItems = (entries: BoardGridItem[], at: string): GridItem[] => {
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
      ? { symbols: Object.fromEntries(Object.entries(board.symbols).map(([name, sym]) => [name, { ...(sym.viewBox !== undefined ? { viewBox: sym.viewBox } : {}), markup: `<path d="${(sym.path ?? '').replace(/[&"<>]/g, c => `&#${c.charCodeAt(0)};`)}"/>` }])) }
      : {}),
  });
  const head = board.board ?? {};
  const look = { ...(head.theme !== undefined ? { appearance: head.theme } : {}), ...(head.accent !== undefined ? { accent: head.accent } : {}), ...(head.skin !== undefined ? { skin: head.skin } : {}) };
  const layout = board.layout;
  const drawn: ViewDocument = layout.kind === 'canvas'
    ? { kind: 'canvas', background: background(layout), ...canvasOf(layout, '/layout'), ...look, ...withElements() }
    : { kind: 'grid', items: gridItems(layout.items, '/layout/items'), ...look, ...withElements() };
  return withStates(drawn);

  // ── triggers ──

  /** The field whose status is a part's own — a status card's (its `state`, else the first field it shows that has
   *  one), or the part's `state` option. */
  function ownStateField(part: Part): string | undefined {
    return part.as === 'status-card'
      ? (part.state as string | undefined) ?? (Array.isArray(part.show) ? part.show : part.show === undefined ? [] : [part.show]).find(n => fieldOfPart(part, n).state !== undefined)
      : (part.state as string | undefined);
  }

  /**
   * The parts' states and the board's triggers, on the nodes the parts are drawn as. A part that shows a status of its
   * own is given the state rule that names it — the reading of the field's state binding, in the board's status names —
   * so the board state says what each part is in, read by a trigger or not. A trigger that reads another field's status
   * gives its part that field's rule instead.
   */
  function withStates(doc: ViewDocument): ViewDocument {
    const triggers = board.triggers ?? [];
    // A node by the part it draws: its id past a canvas cell's own prefix (`<cell>:`) — a part, or an item of an `each` part,
    // whose key may hold a colon (a time of day) as well.
    const nodes = new Map(placedAt(doc).map(({ placed, at }) => {
      const cell = /^\/items\/(\d+)\/canvas\//.exec(at);
      const prefix = cell !== null && doc.kind === 'grid' ? `${doc.items[Number(cell[1])]!.id}:` : '';
      return [prefix !== '' && placed.id.startsWith(prefix) ? placed.id.slice(prefix.length) : placed.id, placed];
    }));
    for (const [id, placed] of nodes) {
      if (placed.widget.bindings?.['$highlight'] !== undefined) placed.highlight = { from: '$highlight' };
      if (placed.widget.bindings?.['$dim'] !== undefined) placed.dim = { from: '$dim' };
      const raw = board.parts[id.split('/')[0]!];
      if (raw === undefined) continue;
      const part = resolve(raw);
      if (part.as === 'group') continue;
      // Its own status, else the first field it shows that has one — what its tone is drawn from.
      const keys = stateKeys.get(`/parts/${id.split('/')[0]}`);
      const shown = Array.isArray(part.show) ? part.show : part.show === undefined ? [] : [part.show];
      const field = ownStateField(part) ?? shown.find(n => keys?.has(n));
      const key = field === undefined ? undefined : keys?.get(field);
      if (key !== undefined) placed.states = { from: key, map: stateMaps(fieldOfPart(part, field!).state!).named };
    }
    if (triggers.length === 0) return doc;
    // An item of an `each` part is drawn only while its data has it: a trigger on one that is not there now is left out.
    const absent = new Error('absent');
    const nodeFor = (part: string, at: string) => {
      const placed = nodes.get(part);
      if (placed) return placed;
      if (part.includes('/')) throw absent;
      throw new PictureError(at, `"${part}" is not drawn on this board`);
    };
    const ruled = new Map<string, string>();
    /** The node of `part`, given the state rule for `field` (or the part's own state). */
    const stateOf = (holder: { part: string; field?: string }, at: string) => {
      const placed = nodeFor(holder.part, `${at}/part`);
      const partId = holder.part.split('/')[0]!;
      const part = resolve(board.parts[partId]!);
      const field = holder.field ?? ownStateField(part);
      const key = field === undefined ? undefined : stateKeys.get(`/parts/${partId}`)?.get(field);
      if (field === undefined || key === undefined) {
        throw new PictureError(`${at}/${holder.field !== undefined ? 'field' : 'part'}`, `"${holder.part}" does not show ${field !== undefined ? `"${field}"'s` : 'a'} status — a trigger reads a status the part shows`);
      }
      if (ruled.has(placed.id) && ruled.get(placed.id) !== field) {
        throw new PictureError(at, `"${holder.part}"'s triggers read one field's status — "${ruled.get(placed.id)}" and "${field}"`);
      }
      ruled.set(placed.id, field);
      placed.states = { from: key, map: stateMaps(fieldOfPart(part, field).state!).named };
      return placed.id;
    };
    const drawnTriggers = triggers.flatMap((t: Trigger, i): ViewTrigger[] => {
      // A trigger on an `each` part by its own id is one trigger per item the data has now, each with its item as the
      // context of what it does.
      const partId = t.on.event === 'open' ? undefined : t.on.part;
      const items = partId !== undefined && !partId.includes('/') && board.parts[partId] !== undefined && resolve(board.parts[partId]!).each !== undefined
        ? [...nodes.keys()].filter(k => k.startsWith(`${partId}/`) && !k.slice(partId.length + 1).includes('/'))
        : [undefined];
      return items.flatMap((item): ViewTrigger[] => {
        try {
          return [drawnTrigger(item === undefined || t.on.event === 'open' ? t : { ...t, on: { ...t.on, part: item } }, i)];
        } catch (error) {
          if (error === absent) return [];
          throw error;
        }
      });
    });
    return { ...doc, triggers: drawnTriggers };

    /**
     * A link's URL for the item an event is about: `{{key}}` its key and `{{<field>}}` that field's value, each as one URL
     * component. The address stays as written (validation keeps the holes out of it); an item that has no value for a
     * field cannot make the link and gets no trigger.
     */
    function itemUrl(url: string, part: string | undefined, at: string): string {
      const head = part?.split('/')[0];
      const query = head !== undefined && board.parts[head] !== undefined ? resolve(board.parts[head]!).each : undefined;
      if (part === undefined || head === undefined || typeof query !== 'string' || part === head) return url;
      const key = part.slice(head.length + 1);
      let row: Record<string, unknown> | undefined;
      return url.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (whole, name: string) => {
        if (name === 'part' || name === 'status' || name === 'board') return whole;
        if (name === 'key') return encodeURIComponent(key);
        if (row === undefined) {
          const rows = options.rowsOf?.(query);
          if (rows === undefined) throw new PictureError(at, `the items of "${query}" are not known — give rowsOf`);
          const keyField = data[query]?.key;
          row = rows.find((r, n) => String(keyField === undefined ? n : (r as Record<string, unknown> | null)?.[keyField]) === key) as Record<string, unknown> | undefined;
        }
        const value = row === undefined ? undefined : valueAtPointer(row, fieldOf(query, name).at ?? `/${name}`);
        if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') throw absent;
        return encodeURIComponent(String(value));
      });
    }

    function drawnTrigger(t: Trigger, i: number): ViewTrigger {
      const at = `/triggers/${i}`;
      const on: ViewTrigger['on'] = t.on.event === 'open' ? { event: 'open' }
        : t.on.event === 'click' ? { event: 'click', node: nodeFor(t.on.part, `${at}/on/part`).id }
          : t.on.event === 'element' ? { event: 'element', node: nodeFor(t.on.part, `${at}/on/part`).id, name: t.on.name }
            : { event: t.on.event, node: stateOf(t.on, `${at}/on`), state: t.on.status };
      const actions = t.do.map((a, j): ViewTriggerAction => a.action === 'focus' ? { action: 'focus', node: nodeFor(a.part, `${at}/do/${j}/part`).id }
        : a.action === 'open-link' ? { action: 'open-link', url: itemUrl(a.url, t.on.event === 'open' ? undefined : t.on.part, `${at}/do/${j}/url`).replace(/\{\{\s*part\s*\}\}/g, '{{node}}').replace(/\{\{\s*status\s*\}\}/g, '{{state}}') }
          : a);
      return { on, ...(t.when !== undefined ? { when: { node: stateOf(t.when, `${at}/when`), state: t.when.status } } : {}), do: actions };
    }
  }

  /** A field of what a part reads. */
  function fieldOfPart(part: Part, name: string): Field {
    const of = part.of ?? part.each;
    return of === undefined ? {} : fieldOf(target(of).query, name);
  }
}

/** How opaque the tint is that a box shape shows its state's colour in (`fill: "tone"`) — faint, so the drawing under it still reads. */
const STATE_TINT = 0.16;

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

/** A board's element definition as the picture's: its holes as a props schema. */
/** An element of a board as its picture draws it — a template, or a script run in a
 *  frame (what a server answers a script element's frame with, by the same definition). */
export function elementDefinition(definition: BoardElementDefinition): ElementDefinition {
  const type = { number: 'number', string: 'string', boolean: 'boolean', list: 'array', object: 'object' } as const;
  const props = { type: 'object' as const, properties: Object.fromEntries(Object.entries(definition.props ?? {}).map(([k, t]) => [k, { type: type[t] }])) };
  if (definition.script !== undefined) {
    return { render: 'script', props, script: definition.script, ...(definition.style !== undefined ? { style: definition.style } : {}), ...(definition.resources !== undefined ? { resources: definition.resources } : {}) };
  }
  return { render: 'template', props, template: definition.template ?? '', ...(definition.style !== undefined ? { style: definition.style } : {}) };
}

