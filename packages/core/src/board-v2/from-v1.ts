// The one-time conversion of a stored first-version board to the board language's second version. A first-version
// node carries its widget, its bindings and its place together; the second version says once where values come from
// and what they mean (`data`), what is shown (`parts`) and where (`layout`). What the second version has no place for
// is reported as unsupported, never dropped without a word; what changes on the way (a placeholder's text) is noted.

import { isHttpRef, type HttpRef } from '../http-ref.js';
import { DEFAULT_NODE_HEIGHT, DEFAULT_NODE_WIDTH } from '../layout-defaults.js';
import type { Binding, CanvasView, Node, ValueMap, ViewDocument, Widget } from '../view-document.js';
import type { BoardV2, Field, Part, Place, Query, ValueMapping } from './types.js';

/** A converted board, what changed on the way, and what has no place in the second version yet. */
export interface V1Conversion {
  board: BoardV2;
  /** What the conversion changed without losing a value: a placeholder drawn as its text, a binding to an adapter that
   *  no longer reads anything. */
  notes: string[];
  /** What it could not carry; the board is not to be stored while this is not empty. */
  unsupported: string[];
}

/** Convert a first-version board. */
export function fromV1(doc: ViewDocument): V1Conversion {
  const notes: string[] = [];
  const unsupported: string[] = [];
  const reads = new Reads(unsupported);
  const parts: Record<string, Part> = {};
  const place: Record<string, Place> = {};

  if (doc.kind !== 'canvas') {
    unsupported.push('a grid board');
    return { board: { version: 2, parts: {}, layout: { kind: 'canvas', size: [1, 1], place: {} } }, notes, unsupported };
  }
  const canvas = doc as CanvasView;
  if (canvas.connectors.length > 0) unsupported.push('connectors');
  if ((canvas.decorations ?? []).length > 0) unsupported.push('decorations');
  if (canvas.components !== undefined || (canvas.instances ?? []).length > 0) unsupported.push('components');
  if ((canvas.triggers ?? []).length > 0) unsupported.push('triggers');

  // Every binding first: a data read is shared by the parts that read it, so its key is known only once all are seen.
  for (const node of canvas.nodes) for (const binding of Object.values(node.widget.bindings ?? {})) reads.see(binding);

  for (const node of canvas.nodes) {
    const part = partOf(node, reads, notes, unsupported);
    if (part === undefined) continue;
    parts[node.id] = part;
    place[node.id] = [node.x, node.y, node.width ?? DEFAULT_NODE_WIDTH, node.height ?? DEFAULT_NODE_HEIGHT];
    if (node.caption !== undefined) unsupported.push('a node caption');
    if (node.states !== undefined) unsupported.push('node states');
  }

  const image = canvas.background.image;
  const right = Math.max(1, ...Object.values(place).map(([x, , w = 0]) => x + w));
  const bottom = Math.max(1, ...Object.values(place).map(([, y, , h = 0]) => y + h));
  const look = {
    ...(canvas.appearance !== undefined ? { theme: canvas.appearance } : {}),
    ...(canvas.accent !== undefined ? { accent: canvas.accent } : {}),
  };
  const board: BoardV2 = {
    version: 2,
    ...(Object.keys(look).length > 0 ? { board: look } : {}),
    ...(Object.keys(reads.data).length > 0 ? { data: reads.data } : {}),
    parts,
    layout: {
      kind: 'canvas',
      size: image ? [image.width, image.height] : [Math.ceil(right), Math.ceil(bottom)],
      ...(image ? { background: image.src } : {}),
      place,
    },
  };
  return { board, notes: [...new Set(notes)], unsupported: [...new Set(unsupported)] };
}

// ── parts ──

/** The part a node's widget becomes, or `undefined` when it has none here (reported). */
function partOf(node: Node, reads: Reads, notes: string[], unsupported: string[]): Part | undefined {
  const widget = node.widget;
  const bindings = widget.bindings ?? {};
  const props = (widget.props ?? {}) as Record<string, unknown>;
  const data = (props.data ?? {}) as Record<string, unknown>;
  const options = isObject(props.options) ? props.options : {};

  if (widget.type.startsWith('element:')) { unsupported.push('an element node'); return undefined; }
  // A widget bound to nothing that reads anything shows only the text it was given — a placeholder.
  const live = Object.entries(bindings).filter(([, b]) => isHttpRef(b.ref));
  for (const [key, b] of Object.entries(bindings)) {
    if (!isHttpRef(b.ref)) notes.push(`${node.id}: the binding of ${key} to "${b.adapter}" reads no HTTP connector — left out (A622-1)`);
  }
  if (live.length === 0) {
    const words = [data.label, data.title, props.title].find(w => typeof w === 'string' && w.trim() !== '') as string | undefined;
    notes.push(`${node.id}: a ${widget.type} bound to nothing is drawn as its text`);
    return { as: 'label', title: words ?? widget.type };
  }

  switch (widget.type) {
    case 'metric':
    case 'gauge': {
      const value = bindings['data.value'];
      if (!value) { unsupported.push(`a ${widget.type} not bound at data.value`); return undefined; }
      const read = reads.read(value, { label: str(data.label), unit: str(data.unit) ?? str(options.unit), format: str(options.format) });
      if (!read) return undefined;
      tone(reads, bindings['data.tone'] ?? bindings['data.level'], value, read, unsupported, widget.type);
      for (const key of Object.keys(bindings)) if (!['data.value', 'data.tone', 'data.level'].includes(key)) unsupported.push(`a ${widget.type} bound at ${key}`);
      const { format: _format, unit: _unit, ...rest } = options;
      return {
        as: widget.type === 'metric' ? 'stat' : 'gauge',
        of: read.of,
        show: read.field,
        ...(widget.type === 'gauge' && typeof data.label === 'string' ? { title: data.label } : {}),
        ...(widget.type === 'metric' ? {} : rest),
      };
    }
    case 'status': {
      const rows = Array.isArray(data) ? (data as Record<string, unknown>[]) : [];
      const fields: string[] = [];
      let of: string | undefined;
      for (const [i, row] of rows.entries()) {
        const value = bindings[`data.${i}.value`];
        if (!value) { unsupported.push('a status row not bound at its value'); return undefined; }
        const read = reads.read(value, { label: str(row.label), unit: str(row.unit), format: str(row.format) });
        if (!read) return undefined;
        if (of !== undefined && of !== read.of) { unsupported.push('a status reading more than one item'); return undefined; }
        of = read.of;
        fields.push(read.field);
        tone(reads, bindings[`data.${i}.tone`] ?? bindings[`data.${i}.level`], value, read, unsupported, 'status row');
      }
      if (of === undefined) { unsupported.push('a status without rows'); return undefined; }
      return { as: 'stat-list', of, show: fields };
    }
    default:
      if (widget.type.startsWith('chart.')) return chartOf(widget, reads, unsupported);
      unsupported.push(`a ${widget.type} node`);
      return undefined;
  }
}

/** A chart: its whole list read, its mapping and options on the part. */
function chartOf(widget: Widget, reads: Reads, unsupported: string[]): Part | undefined {
  const bindings = widget.bindings ?? {};
  const props = (widget.props ?? {}) as Record<string, unknown>;
  if (Object.keys(bindings).some(k => k !== 'data')) { unsupported.push(`a ${widget.type} bound beyond its data`); return undefined; }
  const read = reads.readList(bindings.data!);
  if (!read) return undefined;
  const mapping = isObject(props.mapping) ? props.mapping : {};
  const options = isObject(props.options) ? props.options : {};
  return { as: widget.type, of: read, ...(typeof props.title === 'string' ? { title: props.title } : {}), ...mapping, ...options };
}

/** A widget's tone binding as the state of the field it shows — when it reads where its value binding does. */
function tone(reads: Reads, binding: Binding | undefined, value: Binding, read: { of: string; field: string }, unsupported: string[], what: string) {
  if (!binding) return;
  const where = (b: Binding) => (isHttpRef(b.ref) ? JSON.stringify([b.adapter, { ...b.ref, valuePath: toPointer(b.ref.valuePath ?? '') }]) : undefined);
  if (where(binding) === undefined || where(binding) !== where(value)) { unsupported.push(`a ${what} toned by another field than it shows`); return; }
  const state = binding.map === undefined ? 'raw' : mappingOf(binding.map);
  if (state === undefined) { unsupported.push(`a ${what}'s tone map that is not a mapping of words`); return; }
  reads.setState(read, state, unsupported);
}

// ── data ──

/** A field's meaning as a part shows it: its label, unit and format. */
type Meaning = { label?: string; unit?: string; format?: string };

/** The data reads of a board: one per request and list, shared by every binding that reads it. */
class Reads {
  readonly data: Record<string, Query> = {};
  /** The bindings seen per read, before any is named — a list's key is the field the items differ by. */
  private readonly seen = new Map<string, HttpRef[]>();
  private readonly names = new Map<string, string>();

  constructor(private readonly unsupported: string[]) {}

  see(binding: Binding) {
    if (!isHttpRef(binding.ref) || !binding.ref.item) return;
    const key = readKey(binding.adapter, binding.ref, binding.ref.item.list);
    this.seen.set(key, [...(this.seen.get(key) ?? []), binding.ref]);
  }

  /** The data and field a binding reads one value of. */
  read(binding: Binding, meaning: Meaning): { of: string; field: string } | undefined {
    if (!isHttpRef(binding.ref)) return undefined;
    const ref = binding.ref;
    if (ref.items) { this.unsupported.push('a value read of the items a list keeps'); return undefined; }
    const name = this.query(binding.adapter, ref, ref.item?.list);
    const q = this.data[name]!;
    let of = name;
    if (ref.item) {
      const id = ref.item.where[q.key!];
      if (id === undefined) { this.unsupported.push('items of one list picked by different fields'); return undefined; }
      of = `${name}[${String(id)}]`;
    }
    const pointer = toPointer(ref.valuePath ?? '');
    if (pointer === '') { this.unsupported.push('a value read as a whole item'); return undefined; }
    const field = this.field(q, pointer, binding.map, meaning);
    return field === undefined ? undefined : { of, field };
  }

  /** The data a binding reads a whole list of. */
  readList(binding: Binding): string | undefined {
    if (!isHttpRef(binding.ref)) return undefined;
    if (binding.map !== undefined || binding.itemFields !== undefined || binding.text !== undefined) {
      this.unsupported.push('a list read with a value map or item fields');
      return undefined;
    }
    const ref = binding.ref;
    if (ref.item || ref.items) { this.unsupported.push('a list read of an item or of kept items'); return undefined; }
    const list = toPointer(ref.valuePath ?? '');
    const name = this.query(binding.adapter, ref, list === '' ? undefined : list);
    if (ref.observedAtPath !== undefined) {
      const q = this.data[name]!;
      const at = toPointer(ref.observedAtPath);
      if (q.list === undefined) this.unsupported.push('a whole answer read with its time');
      else if (q.answerTime !== undefined && q.answerTime !== at) this.unsupported.push('one list read with two times');
      else q.answerTime = at;
    }
    return name;
  }

  setState(read: { of: string; field: string }, state: Field['state'], unsupported: string[]) {
    const q = this.data[read.of.replace(/\[.*$/, '')]!;
    const f = q.fields![read.field]!;
    if (f.state !== undefined && JSON.stringify(f.state) !== JSON.stringify(state)) unsupported.push('one field toned two ways');
    f.state = state;
  }

  /** The name of the data read a reference is part of, made on first use. */
  private query(adapter: string, ref: HttpRef, list: string | undefined): string {
    const key = readKey(adapter, ref, list);
    const known = this.names.get(key);
    if (known !== undefined) return known;
    const name = unique(nameOf(ref.path), this.data);
    this.names.set(key, name);
    const q: Query = { from: adapter, path: ref.path };
    const items = (this.seen.get(key) ?? [ref]).flatMap(r => (r.item ? [r.item.where] : []));
    if (list !== undefined) q.list = list;
    if (items.length > 0) {
      // The field the items differ by names them; the fields they share keep the list to them.
      const fields = Object.keys(items[0]!);
      const varying = fields.filter(f => new Set(items.map(w => String(w[f]))).size > 1);
      const keyField = varying.length === 1 ? varying[0]! : varying.length === 0 ? fields.at(-1)! : undefined;
      if (keyField === undefined) this.unsupported.push('items of one list told apart by more than one field');
      else {
        q.key = keyField;
        const fixed = Object.fromEntries(fields.filter(f => f !== keyField).map(f => [f, items[0]![f]!]));
        if (Object.keys(fixed).length > 0) q.where = fixed;
      }
    }
    // An item's time where items are read one by one; the answer's own when the answer is the item.
    const time = (list === undefined ? [ref] : this.seen.get(key) ?? []).map(r => r.observedAtPath).find(p => p !== undefined);
    if (time !== undefined) {
      if (/^\/[^/]+$/.test(time)) q.time = time.slice(1).replace(/~1/g, '/').replace(/~0/g, '~');
      else this.unsupported.push('an observed time deeper in an item');
    }
    if (ref.timeZone !== undefined) q.zone = ref.timeZone;
    if (ref.maxAgeSeconds !== undefined) q.fresh = ref.maxAgeSeconds;
    if (ref.requestTime !== undefined) {
      q.now = {
        ...(ref.requestTime.delaySeconds !== undefined ? { delay: ref.requestTime.delaySeconds } : {}),
        ...(ref.requestTime.stepSeconds !== undefined ? { step: ref.requestTime.stepSeconds } : {}),
      };
    }
    this.data[name] = q;
    return name;
  }

  /** The field of `q` at `pointer` with `map`'s words and `meaning` — a new one when an existing one means otherwise. */
  private field(q: Query, pointer: string, map: ValueMap | undefined, meaning: Meaning): string | undefined {
    let names: ValueMapping | undefined;
    if (map !== undefined) {
      names = mappingOf(map);
      if (names === undefined) { this.unsupported.push('a value map that is not a mapping of words'); return undefined; }
    }
    const want: Field = {
      ...(pointer !== `/${fieldName(pointer)}` ? { at: pointer } : {}),
      ...(meaning.label !== undefined ? { label: meaning.label } : {}),
      ...(meaning.unit !== undefined ? { unit: meaning.unit } : {}),
      ...(meaning.format !== undefined ? { format: meaning.format } : {}),
      ...(names !== undefined ? { names } : {}),
    };
    q.fields ??= {};
    const base = fieldName(pointer);
    // A field at the same place serves when nothing it says contradicts what this binding needs; it gains what it lacks.
    for (const [name, f] of Object.entries(q.fields)) {
      if ((f.at ?? `/${name}`) !== pointer) continue;
      const agrees = (['label', 'unit', 'format', 'names'] as const).every(k => want[k] === undefined || f[k] === undefined || JSON.stringify(want[k]) === JSON.stringify(f[k]));
      if (!agrees || (want.names === undefined) !== (f.names === undefined)) continue;
      for (const k of ['label', 'unit', 'format'] as const) if (f[k] === undefined && want[k] !== undefined) f[k] = want[k];
      return name;
    }
    const name = unique(base, q.fields);
    q.fields[name] = { ...want, ...(name !== base || want.at !== undefined ? { at: pointer } : {}) };
    return name;
  }
}

/** What makes two references one read: the connector, the request and how it is timed, and the list. */
function readKey(adapter: string, ref: HttpRef, list: string | undefined): string {
  return JSON.stringify([adapter, ref.path, list ?? null, ref.requestTime ?? null, ref.timeZone ?? null, ref.maxAgeSeconds ?? null]);
}

/** A first-version value map as the second version's: raw value → words (`"*"` for the rest), or bands. */
function mappingOf(map: ValueMap): ValueMapping | undefined {
  const word = (v: unknown) => (typeof v === 'string' ? v : typeof v === 'number' || typeof v === 'boolean' ? String(v) : undefined);
  if (map.ranges !== undefined && map.ranges.length > 0) {
    if (map.values !== undefined && Object.keys(map.values).length > 0) return undefined;
    const ranges = [...map.ranges].sort((a, b) => (a.min ?? -Infinity) - (b.min ?? -Infinity));
    const bands: (string | number)[] = [];
    const below = ranges[0]!.min === undefined ? word(ranges.shift()!.value) : word(map.otherwise);
    if (below === undefined) return undefined;
    bands.push(below);
    let edge = ranges[0]?.min;
    for (const [i, r] of ranges.entries()) {
      const name = word(r.value);
      if (name === undefined || r.min === undefined || r.min !== edge) return undefined;
      bands.push(r.min, name);
      const next = ranges[i + 1];
      if (r.max !== undefined && (next === undefined ? true : r.max !== next.min)) {
        // A band that ends before the next starts gives the rest to `otherwise`.
        const rest = word(map.otherwise);
        if (rest === undefined) return undefined;
        bands.push(r.max, rest);
        if (next !== undefined && next.min !== r.max) return undefined;
      }
      edge = next?.min;
    }
    return bands;
  }
  const out: Record<string, string> = {};
  for (const [raw, v] of Object.entries(map.values ?? {})) {
    const w = word(v);
    if (w === undefined) return undefined;
    out[raw] = w;
  }
  if (map.otherwise !== undefined) {
    const w = word(map.otherwise);
    if (w === undefined) return undefined;
    out['*'] = w;
  }
  return out;
}

/** A first-version value path as a JSON Pointer — the older dot-separated form too. */
function toPointer(path: string): string {
  if (path === '' || path.startsWith('/')) return path;
  return `/${path.split('.').map(t => t.replace(/~/g, '~0').replace(/\//g, '~1')).join('/')}`;
}

/** A field's name from where it lives: its last step, in letters, digits, `_` and `-`. */
function fieldName(pointer: string): string {
  const last = pointer.split('/').at(-1)!.replace(/~1/g, '/').replace(/~0/g, '~');
  const name = last.replace(/[^\w-]+/g, '-').replace(/^-+|-+$/g, '');
  return name === '' || /^\d/.test(name) ? `v${name}` : name;
}

/** A data read's name from its request: the path's last step. */
function nameOf(path: string): string {
  const step = path.split('?')[0]!.split('/').filter(Boolean).at(-1) ?? 'data';
  const name = step.replace(/[^\w-]+/g, '-').replace(/^-+|-+$/g, '');
  return name === '' ? 'data' : name;
}

function unique(base: string, taken: Record<string, unknown>): string {
  if (!Object.hasOwn(taken, base)) return base;
  for (let i = 2; ; i++) if (!Object.hasOwn(taken, `${base}-${i}`)) return `${base}-${i}`;
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v !== '' ? v : undefined;
}
