// The one-time conversion of a stored first-version board to the board language's second version. A first-version
// node carries its widget, its bindings and its place together; the second version says once where values come from
// and what they mean (`data`), what is shown (`parts`) and where (`layout`). What the second version has no place for
// is reported as unsupported, never dropped without a word; what changes on the way (a placeholder's text) is noted.

import { expandComponents, instanceParts } from '../components.js';
import { isHttpRef, type HttpRef } from '../http-ref.js';
import { DEFAULT_NODE_HEIGHT, DEFAULT_NODE_WIDTH } from '../layout-defaults.js';
import { THEME_PALETTE, isThemeColor } from '../theme-colors.js';
import type { Binding, CanvasView, CellCanvas, ComponentDefinition, Connector, ElementDefinition, GridView, GridWidgetItem, Node, PropsSchema, Shape as V1Shape, ValueMap, ViewDocument, Widget } from '../view-document.js';
import { TONES, type BoardV2, type CanvasLayout, type ElementDefinition as V2Element, type Field, type GridItem as V2GridItem, type Link, type Part, type Place, type Query, type Shape, type Status, type Tone, type ValueMapping } from './types.js';
import { isFigure } from './picture.js';

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
  const elements = new Elements(doc.elements ?? {}, unsupported);
  const statuses: Record<string, Status> = {};
  const presets: Record<string, Part> = {};
  const ctx: Context = { reads, elements, parts, presets, statuses, notes, unsupported, appearance: doc.appearance };
  if ((doc.triggers ?? []).length > 0) unsupported.push('triggers');

  // Every binding first: a data read is shared by the parts that read it, so its key is known only once all are seen.
  const canvases: CellCanvas[] = doc.kind === 'canvas' ? [doc] : doc.items.flatMap(item => ('canvas' in item ? [item.canvas] : []));
  const widgets: Widget[] = doc.kind === 'grid' ? doc.items.flatMap(item => ('widget' in item ? [item.widget] : [])) : [];
  for (const canvas of canvases) {
    for (const node of canvas.nodes) widgets.push(node.widget);
    for (const connector of canvas.connectors) for (const binding of Object.values(connector.bindings ?? {})) reads.see(binding);
  }
  // An instance's bindings are its component's with the instance's values in them — seen as each instance reads them.
  if (doc.kind === 'canvas') for (const node of expandComponents(doc).nodes.slice(doc.nodes.length)) widgets.push(node.widget);
  for (const widget of widgets) for (const binding of Object.values(widget.bindings ?? {})) reads.see(binding);

  const layout: BoardV2['layout'] = doc.kind === 'canvas' ? { kind: 'canvas', ...canvasOf(doc, ctx) } : { kind: 'grid', items: gridOf(doc, ctx) };
  const look = {
    ...(doc.appearance !== undefined ? { theme: doc.appearance } : {}),
    ...(doc.accent !== undefined ? { accent: doc.accent } : {}),
  };
  const board: BoardV2 = {
    version: 2,
    ...(Object.keys(look).length > 0 ? { board: look } : {}),
    ...(Object.keys(statuses).length > 0 ? { statuses } : {}),
    ...(Object.keys(presets).length > 0 ? { presets } : {}),
    ...(Object.keys(elements.converted).length > 0 ? { elements: elements.converted } : {}),
    ...(Object.keys(reads.data).length > 0 ? { data: reads.data } : {}),
    parts,
    layout,
  };
  return { board, notes: [...new Set(notes)], unsupported: [...new Set(unsupported)] };
}

/** What every part of a conversion writes into: the data reads, the elements, the parts, and what it notes. */
interface Context {
  reads: Reads;
  elements: Elements;
  parts: Record<string, Part>;
  /** A group per component the board's instances use. */
  presets: Record<string, Part>;
  /** The board's statuses the conversion declares — a state that draws a line in a form of its own. */
  statuses: Record<string, Status>;
  notes: string[];
  unsupported: string[];
  appearance: CanvasView['appearance'];
}

/** A canvas — a board's own or a grid cell's: its nodes as parts placed on it, its decorations as shapes and its
 *  connectors as links. */
function canvasOf(canvas: CellCanvas, ctx: Context): Omit<CanvasLayout, 'kind'> {
  const { reads, elements, parts, notes, unsupported } = ctx;
  const place: Record<string, Place> = {};
  for (const node of canvas.nodes) {
    const part = partOf(node, reads, elements, notes, unsupported);
    if (part === undefined) continue;
    parts[node.id] = part;
    const own = elements.sizeOf(node.widget.type);
    place[node.id] = [node.x, node.y, node.width ?? own?.width ?? DEFAULT_NODE_WIDTH, node.height ?? own?.height ?? DEFAULT_NODE_HEIGHT];
    if (node.caption !== undefined) unsupported.push('a node caption');
    if (node.states !== undefined) unsupported.push('node states');
  }
  if ('instances' in canvas) instancesOf(canvas as CanvasView, place, ctx);
  const links: Record<string, Link> = {};
  for (const connector of canvas.connectors) {
    // An end inside an instance is the node of its group's part: `<instance>/<part>`.
    const isEnd = (end: string) => {
      if (end in place) return true;
      const [head, inner, ...more] = end.split('/');
      const use = parts[head!]?.use;
      return more.length === 0 && inner !== undefined && use !== undefined && inner in ((ctx.presets[use]?.parts as Record<string, Part> | undefined) ?? {});
    };
    if (!isEnd(connector.fromNodeId) || !isEnd(connector.toNodeId)) { unsupported.push('a connector to a node not converted'); continue; }
    const link = linkOf(connector, ctx);
    if (link !== undefined) links[unique(connector.id.replace(/[^\w-]+/g, '-'), links)] = link;
  }
  const shapes: Record<string, Shape> = {};
  for (const decoration of canvas.decorations ?? []) shapes[unique(decoration.id.replace(/[^\w-]+/g, '-'), shapes)] = shapeOf(decoration, notes, ctx.appearance);
  const image = canvas.background.image;
  const right = Math.max(1, ...Object.values(place).map(([x, , w = 0]) => x + w));
  const bottom = Math.max(1, ...Object.values(place).map(([, y, , h = 0]) => y + h));
  return {
    size: image ? [image.width, image.height] : [Math.ceil(right), Math.ceil(bottom)],
    ...(image ? { background: image.src } : {}),
    place,
    ...(Object.keys(shapes).length > 0 ? { shapes } : {}),
    ...(Object.keys(links).length > 0 ? { links } : {}),
  };
}

/**
 * A grid's items in order. An item spanning several rows becomes a cell of its own beside a grid in a cell holding the
 * items that fill the rows beside it — found where the first version's flow puts them; a span at medium width is the
 * board's.
 */
function gridOf(grid: GridView, ctx: Context): V2GridItem[] {
  const items = grid.items;
  const spans = items.map(item => Math.min(12, item.span ?? 4));
  const rows = items.map(item => Math.max(1, item.rowSpan ?? 1));
  if (items.some(item => item.spanMedium !== undefined)) ctx.notes.push('the spans at medium width are the board\'s');
  // Where the first version's flow puts each item: rows of twelve columns, an item spanning rows keeping its columns.
  const taken: boolean[][] = [];
  const at: { row: number; col: number }[] = [];
  let cursor = { row: 0, col: 0 };
  const fits = (row: number, col: number, i: number) => {
    if (col + spans[i]! > 12) return false;
    for (let r = row; r < row + rows[i]!; r++) for (let c = col; c < col + spans[i]!; c++) if (taken[r]?.[c]) return false;
    return true;
  };
  for (let i = 0; i < items.length; i++) {
    let { row, col } = cursor;
    while (!fits(row, col, i)) { col++; if (col + spans[i]! > 12) { row++; col = 0; } }
    for (let r = row; r < row + rows[i]!; r++) for (let c = col; c < col + spans[i]!; c++) (taken[r] ??= [])[c] = true;
    at.push({ row, col });
    cursor = { row, col: col + spans[i]! };
  }
  // The items beside each tall one: in its rows, outside its columns, which must be filled by them alone.
  const besideOf = new Map<number, number[]>();
  const owner = new Map<number, number>();
  for (let x = 0; x < items.length; x++) {
    if (rows[x]! === 1) continue;
    const { row, col } = at[x]!;
    const beside = items.map((_, i) => i).filter(i => i !== x && at[i]!.row >= row && at[i]!.row < row + rows[x]!);
    const width = 12 - spans[x]!;
    const filled = beside.every(i => rows[i] === 1 && (col === 0 ? at[i]!.col >= spans[x]! : at[i]!.col < col))
      && [...Array(rows[x]!).keys()].every(r => beside.filter(i => at[i]!.row === row + r).reduce((n, i) => n + spans[i]!, 0) === width)
      && (col === 0 || col === width)
      && beside.every(i => (spans[i]! * 12) % width === 0);
    if (!filled || besideOf.has(x) || beside.some(i => owner.has(i) || rows[i]! > 1)) { ctx.unsupported.push('a grid item spanning rows beside items that do not fill them'); return []; }
    besideOf.set(x, beside);
    for (const i of beside) owner.set(i, x);
  }
  const entry = (i: number): V2GridItem | undefined => {
    const item = items[i]!;
    const extra = item.height !== undefined ? { height: item.height } : {};
    if ('canvas' in item) return { canvas: canvasOf(item.canvas, ctx), span: spans[i]!, ...extra };
    const part = partOf(item as GridWidgetItem as unknown as Node, ctx.reads, ctx.elements, ctx.notes, ctx.unsupported);
    if (part === undefined) return undefined;
    if (item.states !== undefined) ctx.unsupported.push('node states');
    ctx.parts[item.id] = part;
    return item.height !== undefined ? { id: item.id, span: spans[i]!, ...extra } : [item.id, spans[i]!];
  };
  const out: V2GridItem[] = [];
  const cell = (x: number): V2GridItem => {
    const width = 12 - spans[x]!;
    const inner = besideOf.get(x)!.flatMap(i => {
      const e = entry(i);
      if (e === undefined) return [];
      const twelfths = (spans[i]! * 12) / width;
      return [typeof e === 'string' ? [e, twelfths] as [string, number] : Array.isArray(e) ? [e[0], twelfths] as [string, number] : { ...e, span: twelfths }];
    });
    return { grid: inner, span: width };
  };
  for (let i = 0; i < items.length; i++) {
    const tall = owner.get(i);
    if (tall !== undefined) {
      // A tall item at the end of its rows: the cell beside it comes first, where its first item is.
      if (at[tall]!.col !== 0 && besideOf.get(tall)![0] === i) out.push(cell(tall));
      continue;
    }
    const e = entry(i);
    if (e !== undefined) out.push(e);
    if (besideOf.has(i) && at[i]!.col === 0) out.push(cell(i));
  }
  return out;
}

// ── parts ──

/** The part a node's widget becomes, or `undefined` when it has none here (reported). */
function partOf(node: Node, reads: Reads, elements: Elements, notes: string[], unsupported: string[]): Part | undefined {
  const widget = node.widget;
  const bindings = widget.bindings ?? {};
  const props = (widget.props ?? {}) as Record<string, unknown>;
  const data = (props.data ?? {}) as Record<string, unknown>;
  const options = isObject(props.options) ? props.options : {};

  if (widget.type.startsWith('element:')) return elementPart(node.id, widget, reads, elements, notes, unsupported);
  // A widget bound to nothing shows only the text it was given — a placeholder.
  if (Object.keys(bindings).length === 0) {
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
      // A gauge's end and its subtitle may be read from the item its value is: the end a field, the subtitle its words.
      const sameItem = (key: string) => {
        const other = reads.read(bindings[key]!, {});
        if (other === undefined) return undefined;
        if (other.of !== read.of) { unsupported.push(`a ${widget.type} reading more than one item`); return undefined; }
        return other.field;
      };
      const bound: Record<string, unknown> = {};
      for (const key of Object.keys(bindings)) {
        if (['data.value', 'data.tone', 'data.level'].includes(key)) continue;
        const field = widget.type === 'gauge' && ['data.max', 'options.subtitle'].includes(key) ? sameItem(key) : undefined;
        if (field === undefined) { unsupported.push(`a ${widget.type} bound at ${key}`); continue; }
        if (key === 'data.max') bound.max = field;
        else bound.title = `{{${field}}}`;
      }
      const { format: _format, unit: _unit, ...rest } = options;
      return {
        as: widget.type === 'metric' ? 'stat' : 'gauge',
        of: read.of,
        show: read.field,
        ...(widget.type === 'gauge' && typeof data.label === 'string' ? { title: data.label } : {}),
        ...(widget.type === 'metric' ? {} : { ...rest, ...(typeof data.max === 'number' && bound.max === undefined ? { max: data.max } : {}) }),
        ...bound,
      };
    }
    case 'status': {
      // A status's rows, each with where its bindings sit — `data` a list of rows, or (the older form) one row itself.
      const rows: [Record<string, unknown>, string][] = Array.isArray(data)
        ? (data as Record<string, unknown>[]).map((row, i) => [row, `data.${i}.`])
        : Object.keys(data).length > 0 ? [[data, 'data.']] : [];
      const fields: string[] = [];
      let of: string | undefined;
      for (const [row, at] of rows) {
        const value = bindings[`${at}value`];
        if (!value) { unsupported.push('a status row not bound at its value'); return undefined; }
        const read = reads.read(value, { label: str(row.label), unit: str(row.unit), format: str(row.format) });
        if (!read) return undefined;
        if (of !== undefined && of !== read.of) { unsupported.push('a status reading more than one item'); return undefined; }
        of = read.of;
        fields.push(read.field);
        tone(reads, bindings[`${at}tone`] ?? bindings[`${at}level`], value, read, unsupported, 'status row');
      }
      if (of === undefined) { unsupported.push('a status without rows'); return undefined; }
      // A row's words or unit read from the source has no place in a row whose label is its field's.
      const read = new Set(rows.flatMap(([, at]) => ['value', 'tone', 'level'].map(k => `${at}${k}`)));
      for (const key of Object.keys(bindings)) if (!read.has(key)) { unsupported.push(`a status row bound at ${key.split('.').at(-1)}`); return undefined; }
      return { as: 'stat-list', of, show: fields };
    }
    default:
      if (widget.type.startsWith('chart.')) return chartOf(widget, reads, unsupported);
      if (widget.type === 'table') return tableOf(node.id, widget, reads, notes, unsupported);
      if (widget.type === 'list') return listOf(widget, reads, unsupported);
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

/**
 * A board's component instances: each component a `group` preset — its nodes the group's parts, reading the item the
 * instance reads — and each instance a part that uses it, reading `<data>[<its value>]`. A component takes one parameter
 * and it names the item: a prop that is the parameter alone shows the item's key. Anything an instance would change
 * beyond its item (a parameter written into a text, a node reading another item) has no place in a group yet — the
 * instances' parts then differ, and that is reported.
 */
function instancesOf(view: CanvasView, place: Record<string, Place>, ctx: Context): void {
  const { reads, elements, parts, presets, notes, unsupported } = ctx;
  for (const instance of view.instances ?? []) {
    const definition = view.components?.[instance.component];
    if (!definition) continue;
    const params = Object.keys(definition.params?.properties ?? {});
    if (params.length !== 1) { unsupported.push('a component with other than one parameter'); return; }
    if ((definition.connectors ?? []).length > 0 || (definition.decorations ?? []).length > 0) { unsupported.push('a component with connectors or decorations'); return; }
    const whole = `{{${params[0]}}}`;
    // A prop that is the parameter alone is the item's key, bound below; the rest of the component is filled per instance.
    const keyProps = new Map<string, string[]>();
    const plain: ComponentDefinition = {
      ...definition,
      nodes: definition.nodes.map(node => {
        const props = (node.widget.props ?? {}) as Record<string, unknown>;
        // A bound prop shows what it reads; its text is only the placeholder until then.
        const keyed = Object.keys(props).filter(k => props[k] === whole && !(k in (node.widget.bindings ?? {})));
        if (keyed.length === 0) return node;
        keyProps.set(node.id, keyed);
        return { ...node, widget: { ...node.widget, props: Object.fromEntries(Object.entries(props).filter(([k]) => !keyed.includes(k))) } };
      }),
    };
    const inner: Record<string, Part> = {};
    const innerPlace: Record<string, Place> = {};
    let of: string | undefined;
    for (const node of instanceParts(plain, instance).nodes) {
      const id = node.id.slice(instance.id.length + 1);
      const part = partOf(node, reads, elements, notes, unsupported);
      if (part === undefined) return;
      if (part.of === undefined || (of !== undefined && part.of !== of)) { unsupported.push('a component whose nodes read other than one item'); return; }
      of = part.of;
      const { of: _of, ...rest } = part;
      const keyed = keyProps.get(id);
      if (keyed !== undefined) {
        const query = of.replace(/\[.*$/, '');
        const key = reads.data[query]?.key;
        const field = key === undefined ? undefined : reads.itemField(query, key, {});
        if (field === undefined || rest.as !== 'element') { unsupported.push('a component parameter shown outside an element'); return; }
        rest.bind = { ...(rest.bind as Record<string, string> | undefined), ...Object.fromEntries(keyed.map(k => [k, field])) };
      }
      inner[id] = rest;
      const own = elements.sizeOf(node.widget.type);
      innerPlace[id] = [node.x - instance.x, node.y - instance.y, node.width ?? own?.width ?? DEFAULT_NODE_WIDTH, node.height ?? own?.height ?? DEFAULT_NODE_HEIGHT];
    }
    if (of === undefined) { unsupported.push('a component that reads nothing'); return; }
    const size: [number, number] = [
      Math.ceil(Math.max(1, ...Object.values(innerPlace).map(([x, , w = 0]) => x + w))),
      Math.ceil(Math.max(1, ...Object.values(innerPlace).map(([, y, , h = 0]) => y + h))),
    ];
    const preset: Part = { as: 'group', size, parts: inner, place: innerPlace };
    const name = instance.component.replace(/[^\w-]+/g, '-');
    if (presets[name] !== undefined && JSON.stringify(presets[name]) !== JSON.stringify(preset)) { unsupported.push('a component whose instances differ beyond their item'); return; }
    presets[name] = preset;
    parts[instance.id] = { use: name, of };
    place[instance.id] = [instance.x, instance.y, size[0], size[1]];
  }
}

/** A list: its whole list read, each slot of its rows a field of its items. */
function listOf(widget: Widget, reads: Reads, unsupported: string[]): Part | undefined {
  const bindings = widget.bindings ?? {};
  const props = (widget.props ?? {}) as Record<string, unknown>;
  if (Object.keys(bindings).some(k => k !== 'data')) { unsupported.push('a list bound beyond its data'); return undefined; }
  const mapping = isObject(props.mapping) ? props.mapping : {};
  const slots = ['primary', 'secondary', 'trailing', 'badge'];
  if (Object.keys(mapping).some(k => !slots.includes(k)) || typeof mapping.primary !== 'string') { unsupported.push('a list mapped beyond its text slots'); return undefined; }
  const read = reads.readList(bindings.data!);
  if (!read) return undefined;
  const part: Part = { as: 'list', of: read };
  for (const slot of slots) {
    if (typeof mapping[slot] !== 'string') continue;
    const field = reads.itemField(read, mapping[slot] as string, {});
    if (field === undefined) return undefined;
    if (slot === 'primary') part.show = field;
    else part[slot] = field;
  }
  const options = isObject(props.options) ? props.options : {};
  return { ...part, ...(typeof props.title === 'string' ? { title: props.title } : {}), ...options };
}

/** A table: its whole list read, each column a field of its items with the column's label and format as the field's. A
 *  column's alignment is the field's to say — a figure is set right — so one written otherwise is noted. */
function tableOf(id: string, widget: Widget, reads: Reads, notes: string[], unsupported: string[]): Part | undefined {
  const bindings = widget.bindings ?? {};
  const props = (widget.props ?? {}) as Record<string, unknown>;
  if (Object.keys(bindings).some(k => k !== 'data')) { unsupported.push('a table bound beyond its data'); return undefined; }
  const mapping = isObject(props.mapping) ? props.mapping : {};
  if (Object.keys(mapping).some(k => k !== 'columns')) { unsupported.push('a table mapped beyond its columns'); return undefined; }
  const columns = Array.isArray(mapping.columns) ? (mapping.columns as Record<string, unknown>[]) : [];
  if (columns.length === 0) { unsupported.push('a table without columns'); return undefined; }
  const read = reads.readList(bindings.data!);
  if (!read) return undefined;
  const show: string[] = [];
  for (const column of columns) {
    const other = Object.keys(column).filter(k => !['field', 'label', 'format', 'align'].includes(k));
    if (typeof column.field !== 'string' || other.length > 0) { unsupported.push(`a table column with ${other.join(', ') || 'no field'}`); return undefined; }
    const field = reads.itemField(read, column.field, { label: str(column.label), format: str(column.format) });
    if (field === undefined) return undefined;
    show.push(field);
    const right = isFigure(reads.data[read]!.fields![field]!);
    if ((column.align === 'right') !== right || column.align === 'center') notes.push(`${id}: its column ${column.field} is set ${right ? 'right, a figure' : 'left'}`);
  }
  const options = isObject(props.options) ? props.options : {};
  return { as: 'table', of: read, show, ...(typeof props.title === 'string' ? { title: props.title } : {}), ...options };
}

/** A widget's tone binding as the state of the field it shows — when it reads where its value binding does. */
function tone(reads: Reads, binding: Binding | undefined, value: Binding, read: { of: string; field: string }, unsupported: string[], what: string) {
  if (!binding) return;
  const where = sameValue;
  if (where(binding) === undefined || where(binding) !== where(value)) { unsupported.push(`a ${what} toned by another field than it shows`); return; }
  const state = binding.map === undefined ? 'raw' : mappingOf(binding.map);
  if (state === undefined) { unsupported.push(`a ${what}'s tone map that is not a mapping of words`); return; }
  reads.setState(read, state, unsupported);
}

/** A node drawing one of the board's elements: its name, its fixed props, and each bound prop as a field — its value, its
 *  words, or the tone of its state. */
function elementPart(id: string, widget: Widget, reads: Reads, elements: Elements, notes: string[], unsupported: string[]): Part | undefined {
  const name = elements.use(widget.type.slice('element:'.length));
  if (name === undefined) return undefined;
  const bindings = widget.bindings ?? {};
  const fixed = Object.fromEntries(Object.entries((widget.props ?? {}) as Record<string, unknown>).filter(([k]) => !(k in bindings)));
  const bind: Record<string, string> = {};
  let of: string | undefined;
  for (const [prop, binding] of Object.entries(bindings)) {
    if (prop.includes('.')) { unsupported.push('an element bound inside a prop'); return undefined; }
    if (binding.text !== undefined || binding.itemFields !== undefined) { unsupported.push('an element prop bound with a text or item fields'); return undefined; }
    const toned = binding.map !== undefined && mapsTo(binding.map, w => (TONES as readonly string[]).includes(w));
    const state = toned ? mappingOf(binding.map!) : undefined;
    const read = toned
      ? (state === undefined ? undefined : reads.read({ ...binding, map: undefined }, {}, state))
      : reads.read(binding, {});
    if (!read) { if (toned && state === undefined) unsupported.push('a tone map that is not a mapping of words'); return undefined; }
    if (of !== undefined && of !== read.of) { unsupported.push('an element reading more than one item'); return undefined; }
    of = read.of;
    bind[prop] = toned ? `${read.field}.tone` : read.field;
  }
  return {
    as: 'element',
    element: name,
    ...(of !== undefined ? { of } : {}),
    ...(Object.keys(fixed).length > 0 ? { props: fixed } : {}),
    ...(Object.keys(bind).length > 0 ? { bind } : {}),
  };
}

/** What a binding reads, the same for two bindings that read the same value — whatever they map it to. */
function sameValue(b: Binding): string {
  return isHttpRef(b.ref)
    ? JSON.stringify([b.adapter, { ...b.ref, valuePath: toPointer(b.ref.valuePath ?? '') }])
    : JSON.stringify(['ref', b.adapter, b.ref, b.at ?? '']);
}

/** Whether every word a value map gives — its values, its ranges' and its `otherwise` — is a word `test` takes. */
function mapsTo(map: ValueMap, test: (word: string) => boolean): boolean {
  const out = [...Object.values(map.values ?? {}), ...(map.ranges ?? []).map(r => r.value), ...(map.otherwise !== undefined ? [map.otherwise] : [])];
  return out.length > 0 && out.every(v => typeof v === 'string' && test(v));
}

/** The board's elements as the second version writes them, converted as they are used. */
class Elements {
  readonly converted: Record<string, V2Element> = {};
  private readonly names = new Map<string, string | undefined>();

  constructor(private readonly defined: Record<string, ElementDefinition>, private readonly unsupported: string[]) {}

  sizeOf(type: string): { width: number; height: number } | undefined {
    return type.startsWith('element:') ? this.defined[type.slice('element:'.length)]?.size : undefined;
  }

  /** The second version's name of a first-version element, converting it on first use — `undefined` when it cannot be. */
  use(name: string): string | undefined {
    if (this.names.has(name)) return this.names.get(name);
    const def = this.defined[name];
    const converted = def === undefined ? undefined : this.convert(def);
    let renamed: string | undefined;
    if (def === undefined) this.unsupported.push('an element the board does not define');
    else if (converted !== undefined) {
      const base = name.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^[^a-z]+/, '').replace(/-+$/, '') || 'element';
      renamed = unique(base.startsWith('u-board-') ? `el-${base}` : base, this.converted);
      this.converted[renamed] = converted;
    }
    this.names.set(name, renamed);
    return renamed;
  }

  private convert(def: ElementDefinition): V2Element | undefined {
    if (def.render !== 'template' || def.template === undefined) { this.unsupported.push('a script element'); return undefined; }
    if ((def.resources ?? []).length > 0) { this.unsupported.push('an element that loads resources'); return undefined; }
    const props: Record<string, 'number' | 'string' | 'boolean' | 'list' | 'object'> = {};
    for (const [prop, schema] of Object.entries(def.props?.properties ?? {})) {
      const type = propType(schema);
      if (type === undefined) { this.unsupported.push(`an element prop that is ${String(schema.type ?? 'of no type')}`); return undefined; }
      props[prop] = type;
    }
    return { template: def.template, ...(def.style !== undefined ? { style: def.style } : {}), ...(Object.keys(props).length > 0 ? { props } : {}) };
  }
}

/** A first-version prop schema as one of the second version's four prop types — a list of words is a string. */
function propType(schema: PropsSchema): 'number' | 'string' | 'boolean' | 'list' | 'object' | undefined {
  const words = [...(schema.enum ?? []), ...(schema.const !== undefined ? [schema.const] : [])];
  const type = schema.type ?? (words.length > 0 && words.every(v => typeof v === 'string') ? 'string' : undefined);
  if (type === 'number' || type === 'integer') return 'number';
  if (type === 'string' || type === 'boolean') return type;
  if (type === 'array') return 'list';
  if (type === 'object') return 'object';
  return undefined;
}

// ── links and shapes ──

/** A connector as a link: its ends, label, width, dash, arrow and route, its colour as the nearest tone, a bound label as
 *  a text of the item it reads, and a bound colour and dash as the state of that field — each value's colour as its
 *  tone, its dash as its emphasis. */
function linkOf(connector: Connector, ctx: Context): Link | undefined {
  const { reads, notes, unsupported, appearance } = ctx;
  const style = connector.style ?? {};
  const bindings = connector.bindings ?? {};
  const link: Link = { from: connector.fromNodeId, to: connector.toNodeId };
  let of: string | undefined;
  const reading = (key: string, read: { of: string; field: string } | undefined): boolean => {
    if (!read) return false;
    if (of !== undefined && of !== read.of) { unsupported.push('a connector reading more than one item'); return false; }
    of = read.of;
    return true;
  };
  for (const key of Object.keys(bindings)) {
    if (!['label', 'style.stroke', 'style.dash'].includes(key)) { unsupported.push(`a connector bound at ${key}`); return undefined; }
  }
  if (bindings.label) {
    {
      // A label written around its value (`{{value | fixed:1}} Mbps`) keeps its text, the field in the value's place and
      // its digits as the field's format.
      const pattern = connector.label?.includes('{{') ? connector.label : undefined;
      const holes = pattern === undefined ? [] : [...pattern.matchAll(/\{\{\s*value\s*(?:\|\s*fixed:(\d)\s*)?\}\}/g)];
      if (pattern !== undefined && (holes.length === 0 || pattern.replace(/\{\{\s*value\s*(?:\|\s*fixed:\d\s*)?\}\}/g, '').includes('{{'))) {
        unsupported.push('a connector label written in a form the second version has no place for');
        return undefined;
      }
      const digits = holes.find(h => h[1] !== undefined)?.[1];
      const read = reads.read(bindings.label, digits !== undefined ? { format: `number:${digits}` } : {});
      if (!reading('label', read)) return undefined;
      link.label = pattern !== undefined ? pattern.replace(/\{\{\s*value\s*(?:\|\s*fixed:\d\s*)?\}\}/g, `{{${read!.field}}}`) : `{{${read!.field}}}`;
    }
  } else if (connector.label !== undefined) link.label = connector.label;
  const look = bindings['style.stroke'] ?? bindings['style.dash'];
  if (look) {
    const state = lineState(connector, ctx);
    if (state === undefined) return undefined;
    const read = reads.read({ ...look, map: undefined }, {}, state);
    if (!reading('style', read)) return undefined;
    link.show = read!.field;
  } else if (style.stroke !== undefined) {
    const tone = nearestTone(style.stroke, appearance);
    if (tone === undefined) notes.push(`${connector.id}: its colour ${style.stroke} is not one a tone can stand for — drawn idle`);
    else {
      if (!(TONES as readonly string[]).includes(style.stroke.trim().toLowerCase())) notes.push(`${connector.id}: its colour ${style.stroke} is drawn in the nearest tone, ${tone}`);
      if (tone !== 'idle') link.tone = tone;
    }
  }
  if (of !== undefined) link.of = of;
  if (style.strokeWidth !== undefined) link.width = style.strokeWidth;
  if (style.dash !== undefined && style.dash !== 'solid' && !bindings['style.dash']) {
    link.dash = true;
    if (style.dash === 'dotted') notes.push(`${connector.id}: a dotted line is drawn dashed`);
  }
  if (style.arrow === 'end') link.arrow = true;
  else if (style.arrow !== undefined && style.arrow !== 'none') { unsupported.push(`a connector with its arrow at ${style.arrow}`); return undefined; }
  if (style.route !== undefined && style.route !== 'straight') link.route = style.route;
  if (connector.labelAt !== undefined || connector.labelSize !== undefined) notes.push(`${connector.id}: its label's place and size take the board's`);
  return link;
}

/** The state of the field a connector's colour and dash are bound to, as a mapping of its raw values: each value's colour
 *  as the nearest tone and its dash as an emphasis — `dashed` hatched, `dotted` blinking. A value drawn with an emphasis
 *  is a status of the board named by the value itself; one without is its tone. */
function lineState(connector: Connector, ctx: Context): Record<string, string> | undefined {
  const { notes, unsupported, statuses, appearance } = ctx;
  const style = connector.style ?? {};
  const { 'style.stroke': stroke, 'style.dash': dash } = connector.bindings ?? {};
  const where = sameValue;
  const bound = [stroke, dash].filter((b): b is Binding => b !== undefined);
  if (bound.some(b => where(b) === undefined) || new Set(bound.map(where)).size > 1) { unsupported.push('a connector coloured and dashed by different fields'); return undefined; }
  if (bound.some(b => b.map === undefined || (b.map.ranges ?? []).length > 0)) { unsupported.push('a connector coloured by a value that is not a tone'); return undefined; }
  const raws = [...new Set(bound.flatMap(b => Object.keys(b.map!.values ?? {})))];
  const at = (b: Binding | undefined, raw: string | undefined, fixed: string | undefined) => {
    if (b === undefined) return fixed;
    const v = raw !== undefined && raw in (b.map!.values ?? {}) ? b.map!.values![raw] : b.map!.otherwise;
    return v === undefined ? fixed : String(v);
  };
  const state: Record<string, string> = {};
  for (const raw of [...raws, undefined]) {
    const colour = at(stroke, raw, style.stroke);
    const tone = colour === undefined ? 'idle' : nearestTone(colour, appearance);
    if (tone === undefined) { unsupported.push('a connector coloured by a value that is not a tone'); return undefined; }
    if (colour !== undefined && !(TONES as readonly string[]).includes(colour.trim().toLowerCase())) notes.push(`${connector.id}: its colour ${colour} is drawn in the nearest tone, ${tone}`);
    // Only a bound dash is a state's form; a fixed one stays the link's own.
    const form = dash === undefined ? 'solid' : (at(dash, raw, style.dash) ?? 'solid');
    const emphasis = form === 'dashed' ? 'hatch' : form === 'dotted' ? 'blink' : undefined;
    let word: string = tone;
    if (emphasis !== undefined) {
      // A value that is itself a tone's name (`idle`), or every other value, names its status by its form too.
      word = raw !== undefined && !(TONES as readonly string[]).includes(raw) ? raw : `${raw ?? tone}-${emphasis}`;
      const status: Status = { tone, emphasis };
      if (word in statuses && JSON.stringify(statuses[word]) !== JSON.stringify(status)) { unsupported.push('one status drawn two ways'); return undefined; }
      statuses[word] = status;
    }
    state[raw ?? '*'] = word;
  }
  return state;
}

/** A decoration as a shape: a frame as a box with its label, a text at its point; colours as the nearest tone. */
function shapeOf(decoration: V1Shape, notes: string[], appearance: CanvasView['appearance']): Shape {
  const colour = decoration.type === 'rect' ? decoration.stroke : decoration.fill;
  const tone = colour === undefined ? undefined : nearestTone(colour, appearance);
  if (colour !== undefined && tone === undefined) notes.push(`${decoration.id}: its colour ${colour} is not one a tone can stand for — drawn idle`);
  else if (colour !== undefined && !(TONES as readonly string[]).includes(colour.trim().toLowerCase())) notes.push(`${decoration.id}: its colour ${colour} is drawn in the nearest tone, ${tone}`);
  const toned = tone !== undefined && tone !== 'idle' ? { tone } : {};
  if (decoration.type === 'rect') {
    const lost = (['fill', 'radius', 'labelAt', 'labelSize', 'labelFill'] as const).filter(k => decoration[k] !== undefined && decoration[k] !== 'none');
    if (lost.length > 0) notes.push(`${decoration.id}: its ${lost.join(', ')} take the board's`);
    return {
      box: [decoration.x, decoration.y, decoration.width, decoration.height],
      ...(decoration.label !== undefined ? { label: decoration.label } : {}),
      ...toned,
      ...(decoration.strokeWidth !== undefined ? { width: decoration.strokeWidth } : {}),
      ...(decoration.dash !== undefined && decoration.dash !== 'solid' ? { dash: true } : {}),
    };
  }
  const lost = (['anchor', 'background'] as const).filter(k => decoration[k] !== undefined && decoration[k] !== 'top-start');
  if (lost.length > 0) notes.push(`${decoration.id}: its ${lost.join(', ')} take the board's`);
  return { text: decoration.text, at: [decoration.x, decoration.y], ...(decoration.fontSize !== undefined ? { size: decoration.fontSize } : {}), ...toned };
}

/** The tone a colour is nearest to, on the board's own palette — `undefined` for a colour that is not written in a form
 *  that can be measured (a CSS variable, a gradient). A theme name is its tone. */
export function nearestTone(colour: string, appearance: CanvasView['appearance'] = 'light'): Tone | undefined {
  const name = colour.trim().toLowerCase();
  if (isThemeColor(name)) {
    const meaning: Record<string, Tone> = { positive: 'ok', warning: 'warn', negative: 'alarm' };
    return meaning[name] ?? (name as Tone);
  }
  const rgb = rgbOf(name);
  if (rgb === undefined) return undefined;
  const palette = THEME_PALETTE[appearance ?? 'light'];
  let best: Tone | undefined;
  let distance = Infinity;
  for (const tone of TONES) {
    if (tone === 'accent') continue;
    const other = rgbOf(palette[tone]);
    if (other === undefined) continue;
    const d = (rgb[0] - other[0]) ** 2 + (rgb[1] - other[1]) ** 2 + (rgb[2] - other[2]) ** 2;
    if (d < distance) { distance = d; best = tone; }
  }
  return best;
}

/** A colour written `#rgb`, `#rrggbb`, `#rrggbbaa` or `rgb()`/`rgba()` as its red, green and blue. */
function rgbOf(colour: string): [number, number, number] | undefined {
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(colour);
  if (hex) {
    const h = hex[1]!.length === 3 ? [...hex[1]!].map(c => c + c).join('') : hex[1]!.slice(0, 6);
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  const fn = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i.exec(colour);
  return fn ? [Number(fn[1]), Number(fn[2]), Number(fn[3])] : undefined;
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
  read(binding: Binding, meaning: Meaning, state?: Field['state']): { of: string; field: string } | undefined {
    if (!isHttpRef(binding.ref)) return this.readRef(binding, meaning, state);
    if (binding.at !== undefined) { this.unsupported.push('an HTTP reference read inside its value with "at"'); return undefined; }
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
    const field = this.field(q, pointer, binding.map, meaning, state);
    return field === undefined ? undefined : { of, field };
  }

  /** An adapter's own reference (not an HTTP connector's): a read of one item, the value at `at` in it — the whole
   *  item when there is none — one of its fields. */
  private readRef(binding: Binding, meaning: Meaning, state?: Field['state']): { of: string; field: string } | undefined {
    const key = JSON.stringify(['ref', binding.adapter, binding.ref]);
    let name = this.names.get(key);
    if (name === undefined) {
      name = unique(typeof binding.ref === 'string' ? nameOf(binding.ref.replace(/[.:]/g, '/')) : binding.adapter, this.data);
      this.names.set(key, name);
      this.data[name] = { from: binding.adapter, ref: binding.ref };
    }
    const field = this.field(this.data[name]!, binding.at ?? '', binding.map, meaning, state);
    return field === undefined ? undefined : { of: name, field };
  }

  /** A field of the items of a list read, at its name, with what it means. */
  itemField(query: string, name: string, meaning: Meaning): string | undefined {
    return this.field(this.data[query]!, toPointer(name), undefined, meaning);
  }

  /** The data a binding reads a whole list of. */
  readList(binding: Binding): string | undefined {
    if (!isHttpRef(binding.ref)) { this.unsupported.push('a list read of an adapter that is not an HTTP connector'); return undefined; }
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
      // A time deeper in the item is a field of its own, which `time` names.
      else q.time = this.field(q, time, undefined, {});
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
  private field(q: Query, pointer: string, map: ValueMap | undefined, meaning: Meaning, state?: Field['state']): string | undefined {
    let names: ValueMapping | undefined;
    if (map !== undefined) {
      names = mappingOf(map);
      if (names === undefined) { this.unsupported.push('a value map that is not a mapping of words'); return undefined; }
      if (Object.values(names).includes('')) { this.unsupported.push('a value map to an empty word'); return undefined; }
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
      if (state !== undefined && f.state !== undefined && JSON.stringify(f.state) !== JSON.stringify(state)) continue;
      for (const k of ['label', 'unit', 'format'] as const) if (f[k] === undefined && want[k] !== undefined) f[k] = want[k];
      if (state !== undefined) f.state = state;
      return name;
    }
    const name = unique(base, q.fields);
    q.fields[name] = { ...want, ...(name !== base || want.at !== undefined ? { at: pointer } : {}), ...(state !== undefined ? { state } : {}) };
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
    // Between each two numbers a range starts or ends at, the value is what the first version gives there: the first
    // range, in the order written, holding it (from its `min`, inclusive, to its `max`, exclusive), else `otherwise`.
    const edges = [...new Set(map.ranges.flatMap(r => [r.min, r.max]).filter((n): n is number => typeof n === 'number'))].sort((a, b) => a - b);
    const at = (v: number) => {
      const hit = map.ranges!.find(r => (r.min === undefined || v >= r.min) && (r.max === undefined || v < r.max));
      return word(hit !== undefined ? hit.value : map.otherwise);
    };
    const first = at(edges[0]! - 1);
    if (first === undefined) return undefined;
    const bands: (string | number)[] = [first];
    for (const edge of edges) {
      const name = at(edge);
      if (name === undefined) return undefined;
      if (name !== bands.at(-1)) bands.push(edge, name);
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
  if (pointer === '') return 'value';
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
