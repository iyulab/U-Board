// The board language, version 2 — the document a board is stored as.
//
// A board says where its values come from and what they mean (`data`), what it shows (`parts`) and where (`layout`),
// and declares its statuses and its look once (`statuses`, `board.skin`). Everything a person picks is addressed by
// id, within its own map, and there is one way to write each thing. Coordinates appear only in a canvas layout.

import type { Emphasis, Tone } from '@iyulab/u-widgets';

/**
 * The eleven tones a status is drawn in (`ok` · `info` · `watch` · `warn` · `alarm` · `off` · `idle` · `accent`, and
 * the places in a sequence `past` · `now` · `next`) and the emphases that add a second channel besides colour — the
 * widget library's own vocabulary, so a board and the widgets drawing it agree on every word.
 */
export { EMPHASES, TONES } from '@iyulab/u-widgets';
export type { Emphasis, Tone };

/** The panel a framed part is drawn in. */
export const FRAMES = ['card', 'flat', 'glow', 'plate', 'ticket', 'postage', 'tape'] as const;
export type Frame = (typeof FRAMES)[number];

/** The version a board in this language declares (`version: 2`). A stored board without it is the first version. */
export const BOARD_LANGUAGE_VERSION = 2;

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

/** How a field's value is doing, as a status name: `"raw"` when the value already is one, else a mapping. */
export type StateRule = 'raw' | ValueMapping;

/** What a field of a data item means. The value itself stays as the source sends it. */
export interface Field {
  /** Where the value lives in the item (a JSON Pointer), when it is not `/<field name>`. */
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
}

/** When a request's `{{now:…}}` places stand, for a source asked for the data of a given time. */
export interface RequestTime {
  /** How long after a time the source has its data, in seconds. */
  delay?: number;
  /** How often the source has new data, in seconds — the time is rounded down to a multiple of it. */
  step?: number;
}

/** Where a set of values comes from — read once, for every part that shows them. */
export interface Query {
  /** The connector. */
  from: string;
  /** The request, relative to the connector — `{{now:yyyyMMdd}}`-style places take the request's time. */
  path: string;
  /** A JSON Pointer to the list of items in the answer; absent: the answer is one item. */
  list?: string;
  /** The field that names each item — parts address one as `<data>[<key>]`. */
  key?: string;
  /** Only the items whose fields equal these values. */
  where?: Record<string, string | number | boolean>;
  /** The field holding when the source observed the item. */
  time?: string;
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
}

/**
 * A link between two parts. With `of` and `show` it carries a field's status — its colour is the status's tone, its
 * emphasis the line's form (`hatch` dashed · `blink` a moving dash · `invert` thick); `width`, `dash` and `arrow`
 * are fixed.
 */
export interface Link {
  from: string;
  to: string;
  of?: string;
  show?: string;
  label?: string;
  width?: number;
  dash?: boolean;
  arrow?: boolean;
}

/** Parts placed on a drawing. An `each` part is placed item by item, inside its own entry. */
export interface CanvasLayout {
  kind: 'canvas';
  size: [number, number];
  background?: string;
  place: Record<string, Place | Record<string, Place>>;
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
  /** `paper` · `ink` · `muted` · `rule` draw a framed part; `ground` is text on the board's background. */
  palette?: { paper?: string; ink?: string; muted?: string; rule?: string; ground?: string };
  frame?: Frame;
  radius?: number;
  shadow?: 'none' | 'soft' | 'hard';
  density?: 'regular' | 'compact';
}

/** A drawing no built-in makes: markup with declared holes, shown by a part `as: "element"`. */
export interface ElementDefinition {
  template: string;
  style?: string;
  props?: Record<string, 'number' | 'string' | 'boolean' | 'list'>;
}

/** A board in the language's second version. */
export interface BoardV2 {
  version: typeof BOARD_LANGUAGE_VERSION;
  board?: { title?: string; theme?: 'light' | 'dark'; skin?: Skin };
  statuses?: Record<string, Status>;
  symbols?: Record<string, { viewBox?: string; path?: string }>;
  elements?: Record<string, ElementDefinition>;
  data?: Record<string, Query>;
  presets?: Record<string, Part>;
  parts: Record<string, Part>;
  layout: Layout;
}
