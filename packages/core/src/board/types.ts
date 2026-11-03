// The board language — the document a board is written and stored as.
//
// A board says where its values come from and what they mean (`data`), what it shows (`parts`) and where (`layout`),
// and declares its statuses and its look once (`statuses`, `board.skin`). Everything a person picks is addressed by
// id, within its own map, and there is one way to write each thing. Coordinates appear only in a canvas layout.

import type { Emphasis, Tone } from '../tones.js';

/**
 * The eleven tones a status is drawn in (`ok` · `info` · `watch` · `warn` · `alarm` · `off` · `idle` · `accent`, and
 * the places in a sequence `past` · `now` · `next`) and the emphases that add a second channel besides colour — the
 * widget library's vocabulary (`tones.ts`), so a board and the widgets drawing it agree on every word.
 */
export { EMPHASES, TONES } from '../tones.js';
export type { Emphasis, Tone };

/** The panel a framed part is drawn in. */
export const FRAMES = ['card', 'flat', 'glow', 'plate', 'ticket', 'postage', 'tape', 'bevel', 'well', 'block', 'double'] as const;
export { NUMERAL_SCALES, type NumeralScale } from '../numerals.js';
export type Frame = (typeof FRAMES)[number];

/** One of the board's own statuses: the tone it is drawn in, its words, and optionally a glyph and an emphasis. */
export interface Status {
  tone: Tone;
  label?: string;
  glyph?: string;
  emphasis?: Emphasis;
}

/**
 * How a value maps to a word or a status name — the same two forms wherever a value is mapped:
 * - a map, raw value → name, `"*"` for anything else: `{ "down": "alarm", "*": "off" }`;
 * - bands of numbers, starting with the name below the first number, then «from this number up, this name»:
 *   `["ok", 1, "warn", 5, "alarm"]`.
 */
export type ValueMapping = Record<string, string> | (string | number)[];

/**
 * A state that follows the clock: bands over the seconds from the time the board is read to the field's value — a time (ISO
 * text, or epoch seconds or milliseconds) — negative once it has passed. `{ "relative": ["past", -2700, "now", 1, "next", 2700, "later"] }`
 * reads «started more than 45 minutes ago: past; up to 45 minutes ago: now; starting within 45 minutes: next; later».
 */
export interface RelativeRule { relative: (string | number)[] }

/** How a field's value is doing, as a status name: `"raw"` when the value already is one, else a mapping — or, for a time, a relative one. */
export type StateRule = 'raw' | ValueMapping | RelativeRule;

/** What a field of a data item means. The value itself stays as the source sends it. */
export interface Field {
  /** Where the value lives in the item (a JSON Pointer), when it is not `/<field name>` — `""` for an adapter's value
   *  that is itself the value (`ref`). */
  at?: string;
  label?: string;
  unit?: string;
  /** Decimal places. */
  digits?: number;
  /** A value format, in the grammar the widget library writes values in (`number:1`, `percent`, `time` …). */
  format?: string;
  /** The words a raw value is shown as. */
  names?: ValueMapping;
  state?: StateRule;
  /**
   * For a field that holds a list of objects (an element's `list` prop is bound to it): what each field of those items
   * means — the same things a field of a read means (`at`, `names`, `state`), once for every item. `at` is relative to
   * the item (`/state`); an item field gains its words under its own name and its tone, status words, emphasis and
   * mark under `<name>$tone`, `<name>$status`, `<name>$emphasis`, `<name>$glyph`. Items do not nest.
   */
  items?: Record<string, Field>;
  /**
   * For a field with `items`: the field of those items that names each one — as a data's `key` names its items. The parts a
   * group makes per item of the list (`each: "/assets"`) then name them by it (`<part>/<key value>`), and the read of an item
   * finds it by that field, so a list the source sends in another order is still the same items. Absent: an item is named by
   * its place in the list, as before.
   */
  key?: string;
  /**
   * A field the read computes from the items of its list, not one the source sends: how many items there are, or the
   * sum, smallest, largest or mean of one field of them, over the items equal to `where`. It is a number like any other
   * reading — it has `names`, `digits`, `format` and a `state`, so "the number of products out of stock" can raise a
   * status — and is only as current as the list it is computed from. The data is read whole; a part that shows it reads
   * the list (`of: "<data>"`), not an item. The smallest, largest and mean of nothing are no value.
   */
  derive?: FieldDerive;
}

/** What a derived field computes: see `Field.derive`. */
export interface FieldDerive {
  op: 'count' | 'sum' | 'min' | 'max' | 'avg';
  /** The item field the number is taken from — not for `count`. */
  field?: string;
  /** Only the items whose fields equal these values. */
  where?: Record<string, string | number | boolean | VariableRef>;
}

/** When a request's `{{now:…}}` places stand, for a source asked for the data of a given time. */
export interface RequestTime {
  /** How long after a time the source has its data, in seconds. */
  delay?: number;
  /** How often the source has new data, in seconds — the time is rounded down to a multiple of it. */
  step?: number;
}

/**
 * Where a set of values comes from — read once, for every part that shows them. An HTTP connector is asked a `path`; any
 * other adapter is given its own `ref` and answers one item (an object of fields, or a value a field reads with `at: ""`)
 * and how current it is — so a `ref` read takes only `fields`.
 */
export interface Query {
  /** The connector, or the adapter. */
  from: string;
  /** The request, relative to the connector — `{{now:yyyyMMdd}}`-style places take the request's time. */
  path?: string;
  /** What an adapter that is not an HTTP connector reads — its own reference, as it defines it. */
  ref?: unknown;
  /** A JSON Pointer to the list of items in the answer; absent: the answer is one item. */
  list?: string;
  /** The field that names each item — parts address one as `<data>[<key>]`. */
  key?: string;
  /** Only the items whose fields equal these values. A board that reads a variable writes `{ "variable": "line" }` (`VariableRef`) in place of a value;
   *  `expandVariables` writes it out before the board is drawn, so what is drawn (`Expanded<Board>`) has values only. */
  where?: Record<string, string | number | boolean | VariableRef>;
  /** The field holding when the source observed the item — its own name, or a field declared with where it lives (`at`). */
  time?: string;
  /** Where the answer says when it was observed as a whole (a JSON Pointer) — the time of a part that reads the whole
   *  list, whose items carry none of their own. */
  answerTime?: string;
  /** A list of one row per name (`{ "category": "T1H", "obsrValue": 3.1 }`) read as one item: each row's `key` field names a
   *  field, its `value` field is that field's value — parts read the data whole, its fields by those names. */
  pivot?: { key: string; value: string };
  /** Seconds a value may be old and still be current. */
  fresh?: number;
  /** The time the request's `{{now:…}}` places stand for. */
  now?: RequestTime;
  /** The IANA time zone the source writes times in, and `now` counts on. */
  zone?: string;
  fields?: Record<string, Field>;
}

/**
 * A part: what is shown, of which data, with which fields — never where. `as` names the kind; `use` takes a preset's
 * settings (the part's own win); `each` makes one part per item of a data list (ids `<part>/<key>`).
 */
export interface Part {
  as?: string;
  use?: string;
  /** `<data>[<key>]` for one item, `<data>` for the whole list or object. */
  of?: string;
  each?: string;
  title?: string;
  show?: string | string[];
  [option: string]: unknown;
}

/**
 * A group: several parts drawn together on a small canvas of their own — a pump's card, level and valve. Its parts
 * read the group's `of` unless they name their own, and are addressed `<group>/<part>`.
 */
export interface GroupPart extends Part {
  as: 'group';
  size: [number, number];
  parts: Record<string, Part>;
  place: Record<string, Place>;
  shapes?: Record<string, Shape>;
  links?: Record<string, Link>;
}

/**
 * A status card's meter: one field against its range, as a bar or a ring — the field's name, or the field with its
 * range (`min` 0 and `max` 100 when absent) and its form. An end of the range is a number written in the board, or the
 * name of a field of what the part reads — a capacity — as a gauge's `max` is. The field's unit, format and state go with it.
 */
export type Meter = string | { field: string; min?: number | string; max?: number | string; form?: 'bar' | 'ring' };

/** `[x, y]`, or `[x, y, width, height]`, on the canvas. */
export type Place = [number, number] | [number, number, number, number];

/** A shape on a canvas: a box with a label, a text at a point, a line through points, or a path. */
export interface Shape {
  box?: [number, number, number, number];
  label?: string;
  text?: string;
  at?: [number, number];
  size?: number;
  line?: [number, number][];
  /** Absolute `M` · `L` · `C` · `Q` · `Z` only. */
  path?: string;
  tone?: Tone;
  width?: number;
  dash?: boolean;
  /** A box, a line or a path reads a state as a link does — the data item it reads and the field whose state colours its outline.
   *  A text is drawn as it is. */
  of?: string;
  show?: string;
  /** With `of` and `show`: a box or a path is filled with the state's tone (`tone`), or hatched in it (`hatch` — a second
   *  channel that reads without colour). A status whose emphasis is `hatch` draws a `tone` fill hatched too. */
  fill?: 'tone' | 'hatch';
}

/**
 * A link between two parts. With `of` and `show` it carries a field's status — its colour is the status's tone, its
 * emphasis the line's form (`hatch` dashed · `blink` a moving dash · `invert` thick); `width` and `dash` are fixed, and
 * its arrowheads are fixed or read from a field (`arrow`).
 */
export interface Link {
  from: string;
  to: string;
  of?: string;
  show?: string;
  label?: string;
  /** Its tone when it carries no status — `idle` when absent. */
  tone?: Tone;
  /** The way it runs: `straight` (when absent) from box to box, `orthogonal` with one turn between them, as pipes and
   *  wiring are drawn, or `curved`, bowing to the left of the way it runs, as flows on a map are drawn. */
  route?: 'straight' | 'orthogonal' | 'curved';
  width?: number;
  /** Its width read from a field of the item it reads — an amount (a flow, a count), not a status: `bands` from the
   *  width below the first number up (`[2, 8, 3.5, 15, 5]`), or a `map` of raw values (`"*"` for the rest). */
  weight?: Weight;
  dash?: boolean;
  /** Its arrowheads: at its `end` (toward `to`), its `start` (toward `from`) or `both` — or read from a field of the item
   *  it reads, as a direction is (a flow that reverses): a `map` of raw values, or `bands` of a number (its sign). */
  arrow?: ArrowEnds | Arrow;
}

/** Where a link's arrowheads are. */
export type ArrowEnds = 'end' | 'start' | 'both';

/** A link's arrowheads from a field: a map of raw values to ends (`"*"` for the rest), or bands — the ends below the
 *  first number, then each number and the ends from it up (`["start", 0, "end"]`); `none` draws none. */
export interface Arrow {
  field: string;
  map?: Record<string, ArrowEnds | 'none'>;
  bands?: (ArrowEnds | 'none' | number)[];
}

/** A link's width from a field: bands of widths and numbers, or a map of raw values to widths. */
export interface Weight {
  field: string;
  bands?: number[];
  map?: Record<string, number>;
}

/**
 * Where the items of an `each` part go when their own fields say it: `at` names the field of an item holding its x and
 * the field holding its y. `frame` is the value at the canvas's left, top, right and bottom edges (the canvas's own
 * coordinates when absent; `[-180, 90, 180, -90]` for longitude and latitude over a whole-world picture); the position is
 * the point of the part's box `anchor` says (its centre unless it says otherwise), `size` when it gives one. An item with no number in either field, or outside the frame,
 * is not drawn.
 */
export interface DataPlace {
  at: [string, string];
  frame?: [number, number, number, number];
  size?: [number, number];
  /** Which point of the part's box the position is: its middle (`center`, the default) or the middle of its `left`,
   *  `right`, `top` or `bottom` edge — a marker whose dot sits at the left of its label is `left`, a pin that rises from
   *  its point is `bottom`. */
  anchor?: 'center' | 'left' | 'right' | 'top' | 'bottom';
}

/**
 * Where the items of an `each` part go by a rule rather than one by one: in `columns` columns from `at`, each in a `cell`,
 * `gap` apart (an item follows the one before it in the data). With `by` — a field of the items — they are grouped by its value
 * instead: each group in a box (a labelled rectangle), the items flowing inside it with `pad` (left and bottom, then top) kept
 * clear, and the boxes themselves flowing in `boxes.columns` columns from `boxes.at`. Every box is one size — the biggest
 * group's, or `boxes.cell` — and a box's `label` writes `{{key}}` as the group's value.
 */
export interface FlowPlace {
  flow: { at?: [number, number]; cell: [number, number]; gap?: [number, number]; columns: number; pad?: [number, number] };
  by?: string;
  boxes?: { at?: [number, number]; cell?: [number, number]; gap?: [number, number]; columns: number; label?: string };
}

/** Parts placed on a drawing. An `each` part is placed item by item, inside its own entry — by its items' fields — or by a rule. */
export interface CanvasLayout {
  kind: 'canvas';
  size: [number, number];
  background?: string;
  place: Record<string, Place | Record<string, Place> | DataPlace | FlowPlace>;
  shapes?: Record<string, Shape>;
  links?: Record<string, Link>;
}

/**
 * A grid item: a part id, `[id, span]` of the twelve columns, or an object. An object may hold a canvas, or a grid
 * of its own — its items span the cell's twelve columns and stack when they take them all.
 */
export type GridItem =
  | string
  | [string, number]
  | {
      id?: string;
      span?: number;
      height?: number;
      canvas?: Omit<CanvasLayout, 'kind'>;
      grid?: GridItem[];
    };

/** Parts in order, by span and breakpoint. */
export interface GridLayout {
  kind: 'grid';
  items: GridItem[];
}

export type Layout = CanvasLayout | GridLayout;

/** The board's look, once — every built-in reads it; no part sets fonts or colours. */
export interface Skin {
  font?: string;
  display?: string;
  mono?: string;
  /** `paper` · `ink` · `muted` · `rule` draw a framed part; `ground` is text on the board's background; `backdrop` is the board's
   *  own background colour, behind every part (and under a background picture). */
  palette?: { paper?: string; ink?: string; muted?: string; rule?: string; ground?: string; backdrop?: string };
  frame?: Frame;
  radius?: number;
  shadow?: 'none' | 'soft' | 'hard';
  /** The title above a part: `plain` (default), a filled strip (`band`) or a filled tab that fits its words (`tab`). */
  titles?: 'plain' | 'band' | 'tab';
  density?: 'regular' | 'compact';
  /** The headline figure of a `metric` or `stat-group`: how large (`small` · `regular` · `large` · `xlarge` · `xxlarge`) and how heavy (100–900). */
  numerals?: { scale?: 'small' | 'regular' | 'large' | 'xlarge' | 'xxlarge'; weight?: number };
}

/**
 * A drawing no built-in makes, shown by a part `as: "element"`: markup with declared holes (`template`), drawn in an
 * isolated root — or code (`script`), run in a sandboxed frame that cannot reach the page, its viewer's session or the
 * network, its props arriving through `ub.onProps`. One of the two.
 */
export interface ElementDefinition {
  template?: string;
  /** CSS for its own markup — a template's, or what a script draws in its frame. */
  style?: string;
  script?: string;
  /** The `https://` origins a script element loads anything from — a library, a font — beyond which nothing is
   *  reachable; an installation allows them too. */
  resources?: string[];
  /** Its props and their types — an `object` is a record a template reads by `{{prop.field}}`. */
  props?: Record<string, 'number' | 'string' | 'boolean' | 'list' | 'object'>;
}

/**
 * Something that happens on a board: a part clicked (or activated from the keyboard), an event an element raises, a
 * part entering or leaving a status, the board opened. A part's status is the state of one of its fields — `field`, or
 * the part's own state (a status card's, a part's `state` option) when left out.
 */
export type TriggerEvent =
  | { event: 'click'; part: string }
  | { event: 'element'; part: string; name: string }
  | { event: 'enter' | 'leave'; part: string; field?: string; status: string }
  | { event: 'open' };

/** What a trigger does: open a link (`{{part}}`, `{{status}}` and `{{board}}` filled in), bring a part into view, hand
 *  the host page an event, or ask the host to show another board of the same workspace. */
export type TriggerAction =
  | { action: 'open-link'; url: string }
  | { action: 'focus'; part: string }
  | { action: 'emit'; name: string }
  | { action: 'go-to-board'; board: string };

/** `on` an event, only `when` a part is in one of the statuses (if given), `do` the actions in order. Triggers only show,
 *  move and tell — nothing a trigger does writes to the systems the board reads. */
export interface Trigger {
  on: TriggerEvent;
  when?: { part: string; field?: string; status: string | string[] };
  do: TriggerAction[];
}

/** A board. */
/** A value a `where` takes from the board's variable of that name. */
export interface VariableRef { variable: string }

/**
 * A board, or a piece of one, after its variables are written out (`expandVariables`): a `where` holds values only. What reads a
 * board to draw it takes this form; what a board is written as — and what `validateBoard` and `expandVariables` take — is `Board`.
 */
export type Expanded<T> = T extends VariableRef ? never : T extends object ? { [K in keyof T]: Expanded<T[K]> } : T;

/**
 * A value the board takes from outside — the address, the host, a move from another board — and reads in a `where` (`{ "variable": name }`),
 * an item an `of` names (`pumps[$name]`), a text (`{{$name}}`) and, when its options are listed, a data's `path`. The viewer gives one value at a
 * time: one of the options, else the `default`, else the first.
 */
export interface Variable {
  label?: string;
  /** The values it can take: listed here, or the keys of the items a data reads (`{ from, key }`) — the server checks a value against them.
   *  A variable has these or a `kind`, not both. */
  options?: string[] | { from: string; key: string };
  /** For a value that cannot be listed — a day, a moment, a number, a word the viewer chooses: what shape it takes. Such a variable is read in a
   *  `where` and a text only — never in a `path` or an `of`, which take a value from a set the board or its data has named. Needs a `default`. */
  kind?: VariableKind;
  /** A listed option, or `first` (the first key, when the options are read from a data); for a `kind`, a value of that kind. */
  default?: string;
}

/** The shapes of a value no list names: `text` (any words), `number` (`12`, `-3.5`), `date` (`2026-11-03`) and `datetime` (`2026-11-03T09:30:00Z`, a moment
 *  in ISO 8601). A value is compared in a `where` as text, as every field is. */
export type VariableKind = 'text' | 'number' | 'date' | 'datetime';

export interface Board {
  /** The board's title, theme, accent colour (the `accent` tone, a header's banner) and look. */
  board?: { title?: string; theme?: 'light' | 'dark'; accent?: string; skin?: Skin };
  statuses?: Record<string, Status>;
  symbols?: Record<string, { viewBox?: string; path?: string }>;
  elements?: Record<string, ElementDefinition>;
  variables?: Record<string, Variable>;
  data?: Record<string, Query>;
  presets?: Record<string, Part>;
  parts: Record<string, Part>;
  layout: Layout;
  triggers?: Trigger[];
}
