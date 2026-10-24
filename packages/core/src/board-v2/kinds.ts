// The kinds a part's `as` takes — generated from the widget library's own catalog and the board's own kinds, so the
// validator, the schema and the rulebook a model reads list the same kinds, and a kind the library adds is not missing
// from any of them. The catalog is the copy written at build time (`widget-catalog.generated.ts`), not the library
// itself, so this module reaches no package at runtime.

import { WIDGET_CATALOG } from './widget-catalog.generated.js';

/** A kind of part: its name, what draws it, what it shows, and whether it reads data. */
export interface PartKind {
  /** The name a part's `as` takes. */
  kind: string;
  /** The widget of the widget library that draws it; absent for a kind the board draws itself. */
  widget?: string;
  /** What it shows, in one line. */
  shows: string;
  /** Whether a part of this kind reads data (`of`, or `each`): `needs` · `may` · `no`. */
  of: 'needs' | 'may' | 'no';
  /** The options the widget takes, by name — empty for a kind the board draws itself. */
  options: string[];
  /** The options the board reads itself, before it hands the rest to the widget: which field a list's line shows, a
   *  chart's mapping, a marker's shape. */
  own: string[];
  /** The widget's options an option the board reads itself takes the place of — by the board's word, the widget's
   *  (a list's `max` is the widget's `maxItems`). The widget's word is not an option of the kind: one setting has one
   *  name. */
  stands?: Record<string, string>;
}

/** The options of a chart part that are its mapping — which field is x, y, … */
export const CHART_MAPPING: readonly string[] = ['x', 'y', 'start', 'end', 'label', 'name', 'value', 'group', 'color', 'size', 'task', 'category'];

/**
 * The general built-ins, each drawn by a widget of the library — under the board's name where the two differ: a
 * board's `stat` is the library's `metric`, its `stat-list` the library's `kv`.
 */
const GENERAL: readonly (readonly [kind: string, widget: string, of: PartKind['of'], own?: readonly string[], stands?: Readonly<Record<string, string>>])[] = [
  ['status-card', 'status-card', 'needs', ['meter', 'subtitle', 'note', 'state']],
  ['header', 'header', 'may', ['kicker', 'subtitle', 'clock']],
  ['stat', 'metric', 'needs', ['trend']],
  ['stat-list', 'kv', 'needs', ['state']],
  ['list', 'list', 'needs', ['primary', 'secondary', 'trailing', 'badge', 'time', 'state', 'max', 'variant'], { max: 'maxItems', variant: 'layout' }],
  ['table', 'table', 'needs'],
  ['bar-list', 'bar-list', 'needs', ['label', 'value', 'state']],
  ['status-grid', 'status-grid', 'needs', ['label', 'value', 'state']],
  ['gauge', 'gauge', 'needs'],
];

/** The kinds only a spatial board has, and the two that structure a board: a group of parts, and an own drawing. */
const BOARD_KINDS: readonly PartKind[] = [
  { kind: 'marker', shows: 'a point on a canvas, in its status, with a label', of: 'may', options: [], own: ['shape', 'symbol', 'note'] },
  { kind: 'label', shows: 'a text on a canvas, from a field or fixed', of: 'may', options: [], own: [] },
  { kind: 'legend', shows: "the board's statuses that are in use", of: 'no', options: [], own: [] },
  { kind: 'group', shows: 'several parts drawn together on a small canvas of their own', of: 'may', options: [], own: ['size', 'parts', 'place', 'shapes', 'links'] },
  { kind: 'element', shows: "a drawing no built-in makes, from the board's elements", of: 'may', options: [], own: ['element', 'props', 'bind'] },
];

function generate(): PartKind[] {
  const catalog = WIDGET_CATALOG;
  const entry = (widget: string) => {
    const found = catalog.find(c => c.widget === widget);
    if (!found) throw new Error(`the widget library has no "${widget}" widget`);
    return found;
  };
  const fromWidget = (kind: string, widget: string, of: PartKind['of'], own: readonly string[] = [], stands?: Readonly<Record<string, string>>): PartKind => {
    const replaced = new Set(Object.values(stands ?? {}));
    return {
      kind,
      widget,
      shows: entry(widget).description,
      of,
      options: entry(widget).options.filter(option => !replaced.has(option)),
      own: [...own],
      ...(stands !== undefined ? { stands: { ...stands } } : {}),
    };
  };
  return [
    ...GENERAL.map(([kind, widget, of, own, stands]) => fromWidget(kind, widget, of, own, stands)),
    ...catalog.filter(c => c.category === 'chart').map(c => fromWidget(c.widget, c.widget, 'needs', CHART_MAPPING)),
    ...BOARD_KINDS,
  ];
}

/** Every kind a part may be, in the order a rulebook lists them: general built-ins, charts, then the board's own. */
export const PART_KINDS: readonly PartKind[] = generate();

const BY_KIND = new Map(PART_KINDS.map(k => [k.kind, k]));

/**
 * The board's word for a widget the library names otherwise — what a writer who knows the library reaches for. A
 * `status` widget's rows are a stat list's: label · value pairs, each in its tone.
 */
const BOARD_WORD: Readonly<Record<string, string>> = {
  ...Object.fromEntries(GENERAL.filter(([kind, widget]) => kind !== widget).map(([kind, widget]) => [widget, kind])),
  status: 'stat-list',
};

/** The kind a part's `as` names, or `undefined` when it names none. */
export function partKind(as: string): PartKind | undefined {
  return BY_KIND.get(as);
}

/** The kind a board writes for a name of the widget library's that is not a kind of its own (`metric` → `stat`). */
export function boardWordFor(name: string): string | undefined {
  return BOARD_WORD[name];
}
