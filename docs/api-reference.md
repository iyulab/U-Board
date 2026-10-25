# API Reference

This is the reference for the library's public surface (see the root [`README.md`](../README.md#domain-layer) for how
to install it). [`concepts.md`](concepts.md) explains what each term *means*; this document gives the concrete
shapes and a runnable example, so a consumer — human or automated — can write a board, implement an `Adapter` and
draw the board without guessing.

## Walkthrough

A minimal end-to-end example: one board with a single bound part, one `Adapter`
implementation, and the resolved picture a renderer would consume. It is an ES module (the package
ships ESM only) using top-level `await` — save it as `walkthrough.mts`, or in a project with
`"type": "module"`, and run it with `npx tsx walkthrough.mts` (or plain `node` on a version that strips
TypeScript types by default).

```ts
import type { Adapter, Board, ResolvedBinding } from '@iyulab/u-board/domain';
import { pictureOf, readerOf } from '@iyulab/u-board/domain';
import { resolveDocument } from '@iyulab/u-board/picture';

// 1. An Adapter resolves this system's own reference shape to a value + connection quality.
//    Nothing about `ref`'s shape is fixed by the core — each adapter defines and interprets it.
export class ExampleAdapter implements Adapter {
  readonly id = 'demo'; // matches the `from` a data read names to select this Adapter

  async resolve(ref: unknown): Promise<ResolvedBinding> {
    const key = ref as string;
    if (key === 'pump-a.state') {
      return { value: 'running', quality: 'live' };
    }
    return { value: undefined, quality: 'disconnected' };
  }
}

// 2. A board: one data read through that adapter, one part that shows it, and where the part is.
export const board: Board = {
  data: { pumpA: { from: 'demo', ref: 'pump-a.state' } },
  parts: { 'pump-a': { as: 'stat', of: 'pumpA', title: 'Pump A' } },
  layout: { kind: 'canvas', size: [400, 200], place: { 'pump-a': [0, 0, 160, 80] } },
};

// 3. pictureOf draws the board as the renderer reads it — every part a widget bound to its read —
//    and resolveDocument runs those bindings against the given adapters: every widget's bound props
//    carry resolved values, and a `quality` map records how current each bound prop is.
const picture = await pictureOf(board, readerOf([new ExampleAdapter()]));
export const resolved = await resolveDocument(picture, [new ExampleAdapter()]);

const [pumpA] = resolved.kind === 'canvas' ? resolved.nodes : [];
console.log(pumpA?.widget.quality); // { 'data.value': 'live' }
```

This exact file also lives at [`packages/core/src/examples/walkthrough.ts`](../packages/core/src/examples/walkthrough.ts),
where a test (`walkthrough.test.ts`) re-runs it and asserts on the value printed above — so if a future change to
drawing or resolving a board, or to this package's exports, makes it wrong, that test fails instead of this page
silently drifting. A second test in the same file checks this code block is byte-identical to that source file, so
the two can't quietly diverge from each other either.

## Entry points

| Import | Contents | React / canvas |
|---|---|---|
| `@iyulab/u-board/domain` | The board language — its types, `boardSchema`, `validateBoard`, `checkBoard`, `emptyBoard`, `sourceAdvice`, the part kinds, `boardRulebook` — drawing a board's picture (`pictureOf`, `readerOf`, `toViewDocument`), the `Adapter` contract, JSON Patch, connection-quality text | No — and no package at runtime |
| `@iyulab/u-board/picture` | The picture a board is drawn as: `ViewDocument` and its parts, `resolveDocument`, `boardStateOf`, the trigger decisions, the HTTP connector's reference, element frames, `lintViewDocument` — what a server or an assistant reads off a drawn board | No — and no package at runtime |
| `@iyulab/u-board/viewer` | `BoardView`, `ViewerPage` (a picture drawn as given), the labels, `serverClock` | Yes |
| `@iyulab/u-board` | Everything in `domain` and `viewer`, plus `BoardAuthoring` | Yes |

A board is what is written, stored and sent; the picture is what the renderer makes of it, and nobody writes one.

## The board

```ts
interface Board {
  board?: { title?: string; theme?: 'light' | 'dark'; accent?: string; skin?: Skin };
  statuses?: Record<string, Status>;
  symbols?: Record<string, { viewBox?: string; path?: string }>;
  elements?: Record<string, ElementDefinition>;
  data?: Record<string, Query>;
  presets?: Record<string, Part>;
  parts: Record<string, Part>;
  layout: CanvasLayout | GridLayout;
  triggers?: Trigger[];
}
```

A board is one JSON object. It says once where its values come from and what they mean (`data`), what it shows
(`parts`) and where (`layout`), and declares its statuses and its look once for the whole board. Everything a person
picks is addressed by id — the key of its own map — and there is one way to write each thing. Coordinates appear only
in a canvas layout. A worked board, valid as written, is exported as `RULEBOOK_EXAMPLE`:

```json
{
  "statuses": { "running": { "tone": "ok", "label": "Running" }, "down": { "tone": "alarm", "label": "Down", "emphasis": "blink" } },
  "data": {
    "pumps": {
      "from": "plant", "path": "/plant/pumps", "list": "/value", "key": "id", "time": "updatedAt", "fresh": 60,
      "fields": { "state": { "state": { "run": "running", "trip": "down", "*": "off" } }, "flow": { "label": "Flow", "unit": "m³/h", "digits": 1 } }
    },
    "hourly": { "from": "plant", "path": "/plant/flow/hourly", "list": "/value" }
  },
  "parts": {
    "P1": { "as": "status-card", "of": "pumps[P1]", "title": "Pump 1", "show": ["state", "flow"] },
    "P2": { "as": "status-card", "of": "pumps[P2]", "title": "Pump 2", "show": ["state", "flow"] },
    "flow": { "as": "chart.line", "of": "hourly", "title": "Flow by hour", "x": "hour", "y": "flow" }
  },
  "layout": {
    "kind": "canvas", "size": [720, 360],
    "place": { "P1": [40, 40, 200, 120], "P2": [440, 40, 200, 120], "flow": [40, 200, 640, 140] },
    "shapes": { "title": { "text": "Pump station", "at": [40, 24] } },
    "links": { "line": { "from": "P1", "to": "P2", "of": "pumps[P1]", "show": "state", "label": "{{flow}}", "arrow": "end" } }
  }
}
```

`emptyBoard(kind)` is a board of a canvas (1280 × 720) or a grid with nothing on it yet.

### `board` — the look

`title`, `theme` (`light`, the default, or `dark` — set to match the background, not the viewer's theme), `accent` —
the board's own primary colour, which a header's banner and the `accent` tone draw with — and `skin`:

```ts
interface Skin {
  font?: string;
  display?: string;
  mono?: string;
  palette?: { paper?: string; ink?: string; muted?: string; rule?: string; ground?: string };
  frame?: 'card' | 'flat' | 'glow' | 'plate' | 'ticket' | 'postage' | 'tape';   // FRAMES
  radius?: number;
  shadow?: 'none' | 'soft' | 'hard';
  density?: 'regular' | 'compact';
}
```

`paper` · `ink` · `muted` · `rule` draw a framed part; `ground` is text on the board's background. Every built-in
reads the skin; no part sets fonts or colours of its own.

### `statuses`

```ts
interface Status { tone: Tone; label?: string; glyph?: string; emphasis?: Emphasis }
```

A board names its own statuses — the words a field's `state` gives (`running`, `down`) — each drawn in one of eleven
tones (`TONES`: `ok` `info` `watch` `warn` `alarm` `off` `idle` `accent`, and the places in a sequence `past` `now`
`next`), with its words, optionally a mark and an emphasis (`EMPHASES`) that adds a second channel besides colour.
Anything showing a field with a state takes the status's colour, words and mark; a board never writes colours for
statuses. A part `as: "legend"` shows the statuses the board uses.

### `data` — where values come from, and what they mean

```ts
interface Query {
  from: string;                 // the connector, or the adapter
  path?: string;                // the request an HTTP connector is asked
  ref?: unknown;                // what any other adapter reads, as it defines it
  list?: string;                // a JSON Pointer to the list of items in the answer
  key?: string;                 // the field that names each item
  where?: Record<string, string | number | boolean>;
  time?: string;                // the field holding when the source observed an item
  answerTime?: string;          // where the answer says when it was observed as a whole
  pivot?: { key: string; value: string };
  fresh?: number;               // seconds a value may be old and still be current
  now?: { delay?: number; step?: number };
  zone?: string;                // the IANA time zone the source writes times in
  fields?: Record<string, Field>;
}

interface Field {
  at?: string;                  // where the value lives in the item, when not /<field name>
  label?: string;
  unit?: string;
  digits?: number;
  format?: string;              // the widget library's value format: 'number:1', 'percent', 'time' …
  names?: ValueMapping;         // the words a raw value is shown as
  state?: 'raw' | ValueMapping; // how the value is doing, as a status
}

type ValueMapping = Record<string, string> | (string | number)[];
```

A data read is read once, for every part that shows it. Data stays as the source sends it: names, units, digits and
statuses live in `fields`, never in the data. Parts name a read whole (`"pumps"`) or one item of it
(`"pumps[P1]"`, by its `key`; without a `key`, by its place in the list).

- **An HTTP connector** is asked a `path`, relative to the connector's address — a path starting with one `/`, with
  its query. `list` points at the items in the answer; `where` keeps the items whose fields equal those values
  (`"12"` and `12` match) — the rows a list or a table is about. `pivot` reads a list of one row per name
  (`{ "category": "T1H", "obsrValue": 3.1 }`) as one item: each row's `key` field names a field, its `value` field is
  that field's value.
- **Any other adapter** — one the host provides — is given its own `ref` and answers one item (an object of fields, or
  a value a field reads with `at: ""`); a `ref` read takes only `fields`.
- **Time.** `time` names the field (or a field declared with `at`) holding when the source observed an item, and
  `answerTime` a JSON Pointer to the time of the answer as a whole — the time of a part reading the whole list. A time
  is read as epoch seconds or milliseconds (a number, or a string of 10 or 13 digits), ISO 8601 and the variations
  sources write (`2026-10-09 19:10`, `2026.10.09`, a missing offset, or an offset in hours alone such as `+09`), or
  compact digits (`202610091900`, `20261009 1910`, `20261009`); a time without an offset is on `zone`'s clock (UTC when
  absent). A field holding something else makes the read `disconnected` with reason `format`, and so does a time more
  than five minutes after the read — a source cannot have observed it yet; the usual cause is a missing `zone`. A value
  whose answer names no time is observed when the response says it was made: its `Date` header, or — when a cache or
  proxy served an older answer — the `Age` it reports (the larger of the two counts, RFC 9111 §4.2.3); a response with
  neither, or a `Date` more than five minutes ahead of the server's clock, is taken as made when it was received.
- **`fresh`** — how old the source's value may normally be and still be current, as HTTP's `max-age` says of a
  response. Older than this by its observed time, a value reads `stale` with reason `lagging`: the source's latest, but
  behind. It also spaces the source's requests — a read answers later reads of the same request for an eighth of it —
  which spends a daily request quota that much more slowly.
- **A source asked for a given time.** `path` may hold time places, `{{now:yyyyMMdd}}` and `{{now:HHmm}}` — a pattern
  of `yyyy` `MM` `dd` `HH` `mm` with `-` `.` `:` `_` `T` between — that each request fills in on `zone`'s clock, at the
  time `now` names: the time the request is sent, `delay` seconds earlier — how long after a time the source has its
  data — rounded down to a multiple of `step` seconds — how often it has new data — counted from midnight. A source
  that publishes each hour's observations forty minutes after the hour is `{ "delay": 2400, "step": 3600 }`: at 13:31
  it is asked for 12:00, at 13:41 for 13:00. Any other `{{…}}` in a path is refused.
- **Mapping.** `state` and `names` take the same two forms: a map of raw values to names, `"*"` for anything else
  (`{ "trip": "down", "*": "off" }`), or bands of numbers — the name below the first number, then from each number up
  (`["ok", 70, "warn", 80, "alarm"]`). `state: "raw"` says the value already is a status name. A reading the mapping
  names nothing for is in no status.

### `parts` — what is shown, of which data

```ts
interface Part {
  as?: string;                  // the kind
  use?: string;                 // a preset whose settings this part takes; its own win
  of?: string;                  // '<data>' for the whole, '<data>[<key>]' for one item
  each?: string;                // a data list: one part per item, ids '<part>/<key>'
  title?: string;
  show?: string | string[];     // the fields it shows
  [option: string]: unknown;    // the kind's options
}
```

A part never says where it is — the layout does. `{{field}}` in a title or a label reads a field of what the part
reads, `{{key}}` its item's key. `presets` hold settings parts share (`use`). `each: "<data>"` makes one part per item
of a list, with the ids `<part>/<key>`; it takes no `of`, and the layout places it once — a grid lays out its items in
order, a canvas places them item by item inside its entry.

The kinds come from three places, listed with their options as `PART_KINDS` (`partKind(as)` finds one):

- **General built-ins**, each drawn by a widget of [`@iyulab/u-widgets`](https://github.com/iyulab/u-widgets):
  `status-card`, `header`, `stat`, `stat-list`, `list`, `table`, `bar-list`, `status-grid`, `gauge`. The board reads
  some options itself, as fields of what the part reads — a `status-card`'s `meter` (`"<field>"`, or
  `{ field, min?, max?, form?: 'bar' | 'ring' }`) and `state`, a `stat`'s `trend`, a `list`'s `primary` · `secondary` ·
  `trailing` · `badge` · `time` — and hands any other option to the widget, which takes only those it lists.
- **Charts** — every chart of the widget library (`chart.line`, `chart.bar` …), with their mapping options (`x`, `y`,
  `label`, `value`, `group` …) naming fields of the rows they read.
- **The board's own**: `marker` — a point on a canvas in its status, with a label (`shape`, or `symbol` naming one of
  the board's symbols); `label` — a text, fixed or from a field; `legend` — the statuses in use; `group` — several
  parts drawn together on a small canvas of their own (`size`, `parts`, `place`, `shapes`, `links`), its parts reading
  the group's `of` unless they name their own and addressed `<group>/<part>`; `element` — a drawing of the board's
  `elements` (`element`, fixed `props`, and `bind` from a prop to a field — `"<field>"`, its status `"<field>.status"`
  or tone `"<field>.tone"`).

### `layout` — where

```ts
interface CanvasLayout {
  kind: 'canvas';
  size: [number, number];
  background?: string;                                     // an image's address, drawn at the canvas's size
  place: Record<string, Place | Record<string, Place>>;    // an `each` part: by item key
  shapes?: Record<string, Shape>;
  links?: Record<string, Link>;
}
type Place = [number, number] | [number, number, number, number];   // [x, y] or [x, y, width, height]

interface GridLayout { kind: 'grid'; items: GridItem[] }
type GridItem =
  | string                                                  // a part
  | [string, number]                                        // [part, span]
  | { id?: string; span?: number; height?: number; canvas?: Omit<CanvasLayout, 'kind'>; grid?: GridItem[] };
```

- **Canvas** — parts placed by coordinates over a drawing. A part placed without a size takes its kind's. `shapes` are
  purely visual: a `box` (`[x, y, w, h]`, with a `label`), a `text` `at` a point (`size`), a `line` through points or a
  `path` (absolute `M` · `L` · `C` · `Q` · `Z`), each with an optional `tone`, `width` and `dash`.
- **Grid** — parts in order on a row of twelve columns, laid out to the width of the board's own container: one item
  per row below 600 pixels, six columns below 1024, twelve above. An item takes a `span` of the twelve, and optionally
  a fixed `height`; otherwise the widget's own. An item may hold a `canvas` of its own — the spatial panel of a mixed
  board, drawn fitted to its cell — or a `grid`, whose items span the cell's twelve columns and stack.
- **Links** join two parts:

  ```ts
  interface Link {
    from: string; to: string;
    of?: string;                 // the item it reads — for show, weight and {{field}} in its label
    show?: string;               // the field whose status colours it
    label?: string;              // fixed, or {{field}} of what it reads
    tone?: Tone;                 // its colour when it shows no status — idle when absent
    route?: 'straight' | 'orthogonal' | 'curved';
    width?: number;
    weight?: { field: string; bands?: number[]; map?: Record<string, number> };
    dash?: boolean;
    arrow?: 'end' | 'start' | 'both'                       // fixed arrowheads
      | { field: string; map?: Record<string, 'end' | 'start' | 'both' | 'none'>; bands?: (string | number)[] };
  }
  ```

  A link that shows a status takes its tone, and its emphasis as the line's form — `hatch` dashed, `blink` a moving
  dash, `invert` thick. `orthogonal` runs with one turn between the two parts, as pipes and wiring are drawn;
  `curved` bows to the left of the way it runs, as flows on a map are drawn. `weight` reads the width from a field —
  an amount, not a status: bands from the width below the first number up (`[2, 8, 3.5, 15, 5]`), or a map of raw
  values (`"*"` for the rest). `arrow` puts arrowheads at the `end` (toward `to`), the `start` (toward `from`) or
  `both` — or reads them from a field when a flow reverses: a map of its words
  (`{ "field": "dir", "map": { "forward": "end", "reverse": "start", "*": "none" } }`) or bands of its sign
  (`{ "field": "power", "bands": ["start", 0, "end"] }` — zero falls in the band from 0 up, so map the word when zero
  should draw none). A direction is a meaning of the value, not a status, so it is read beside the status rather than
  through it.

Every part is placed by the layout — a part placed nowhere is refused.

### `elements` and `symbols` — drawings no built-in makes

```ts
interface ElementDefinition {
  template?: string;            // markup with {{prop}} holes
  style?: string;               // CSS for its own markup only
  script?: string;              // or code, run in a sandboxed frame
  resources?: string[];         // the https:// origins a script loads from
  props?: Record<string, 'number' | 'string' | 'boolean' | 'list' | 'object'>;
}
```

An element is one of two: a **template** or a **script**. Names are lowercase letters, digits and hyphens; a part
`{ "as": "element", "element": "tank", "bind": { "level": "level" } }` places one. Use a built-in whenever one shows
the thing — a title, a status and a few values are a `status-card`, `stat` or `stat-list`.

- **Template holes** — logic-less: `{{name}}` (a declared prop, or a dotted path into an `object` prop; every value
  escaped), `{{#list}}…{{/list}}` (repeated for each item, or shown once for any other truthy value; inside it a name
  is looked up in the item first and `{{.}}` is the item itself), `{{^flag}}…{{/flag}}` (shown when empty or false),
  `{{! comment}}`. `{{inlet | fixed:1}}` shows a number with that many digits after the point (0–6),
  `{{orders | grouped:0}}` the same with a comma every three digits. Nothing is computed inside the braces: numbers
  become a drawing through CSS — `style="--level: {{level}}"` and `height: calc(var(--level) * 1%)`.
- **Markup policy** — HTML text and structure tags, `img`, and SVG shapes, text, gradients, patterns, symbols and
  filters. No `script`, `style`, `iframe`, `a`, form or `foreignObject`; no event handler attribute; a URL (`href`,
  `src`, CSS `url()`) only to a fragment of the markup (`#id`) or an inline image (`data:image/…`); no `@import`. The
  renderer applies the same policy again after filling the holes, so a value cannot add what the template did not.
  A template element loads nothing from another origin.
- **Theme** — the board's tone reaches the markup as CSS variables: `--u-widget-bg`, `--u-widget-surface`,
  `--u-widget-text`, `--u-widget-text-secondary`, `--u-widget-border`, `--u-widget-primary`, `--u-widget-positive`,
  `--u-widget-negative`, `--u-widget-warning`, `--u-widget-font-family`, `--u-widget-font-mono`. A template is drawn
  in an isolated root of the page: its CSS reaches only its own markup, the page's does not reach in. Its root fills
  the part's box, every size in it includes its padding and border, and nothing it draws reaches past that box.
- **Symbols** — SVG drawings the board defines once (`{ "viewBox"?, "path": "M … Z" }`), drawn by a `marker`'s
  `symbol` and by any template element with `<use href="#name">`, in the colour around it.

**Script elements** run in a frame of their own: `<iframe sandbox="allow-scripts">`, whose document the board's
server builds from the saved definition. The frame has an origin of its own — it cannot reach the page, its storage or
the viewer's session — and no network: its data arrives as its props. Its code reads them through `ub`:

```js
ub.onProps((props, appearance) => draw(props));   // now, if props have arrived, and on every change
ub.emit('open-details');                          // an event the board's triggers can listen for
ub.reportError(error);                            // shown on the element's box
```

It loads from an origin only when it lists it in `resources` and the host allows it (`elementOrigins` on the viewer —
none by default; a U-Board server sends the origins its installation allows with every board). The frame loads when
the element nears the screen. A U-Board server serves the element's code with each loop bounded in time: a loop that
runs a second without finishing throws, reported like any error. The page asks a running frame every two seconds
whether it still answers, and removes one that has left a question unanswered for six seconds, with a notice on its
box. That keeps the page usable where the browser runs the frame in a process of its own, as Chrome and Edge do with
site isolation; a browser that runs it with the page (Firefox, Safari) is held by such code too — so an element's code
must always return. A server that serves each definition from an origin of its own (`UBOARD_ELEMENT_FRAME_ORIGIN`)
keeps the board's other script elements apart from it in Chrome and Edge. The console opens a board without running its
script elements at `…/boards/<id>/edit?scripts=off`, to fix such code. The viewer's `elementFrames` says where the
frames are served — `/api/element-frames/<board id>` on a U-Board server, which answers
`/api/element-frames/<board id>/<element>/<definition hash>` only while the saved board defines that element exactly
so (`{definition}` in the address is replaced by `elementFrameLabel(hash)`, for frames served from an origin per
definition). Without `elementFrames`, a script element shows a notice in its box.

### `triggers` — what the board does

```ts
interface Trigger {
  on:
    | { event: 'click'; part: string }                                  // clicked, or activated from the keyboard
    | { event: 'element'; part: string; name: string }                  // its element raises `name`
    | { event: 'enter' | 'leave'; part: string; field?: string; status: string }
    | { event: 'open' };                                                // the board is first drawn
  when?: { part: string; field?: string; status: string | string[] };   // only while the part is in one of these
  do: Array<
    | { action: 'open-link'; url: string }      // a new tab
    | { action: 'focus'; part: string }         // bring a part into view
    | { action: 'emit'; name: string }          // hand the host an event
    | { action: 'go-to-board'; board: string }  // ask the host to show another board
  >;
}
```

A part's status is the state of one of its fields — `field`, or the part's own state (a status card's, a part's
`state` option) when left out. A part made per item is named per item (`"pumps/P1"`). Triggers only show, move and
tell: nothing a trigger does writes to the systems a board reads.

- `open-link` opens an `https://` address or a path on the installation the board is served from (`/…`, never `//…`)
  in a new tab, with no opener. `{{part}}`, `{{status}}` and `{{board}}` in it are filled in, each URL-encoded — a
  part's values are not.
- `enter` and `leave` fire on a change between two draws of one viewer, never on the first draw — `open` is for that.
- A part with a `click` trigger becomes a button: Enter and Space press it. A drag that starts on it pans the board and
  presses nothing.
- An element raises an event with `ub.emit(name)` in a script element, or, in a template, from a region marked
  `data-ub-event="name"` that is clicked; a marked region some trigger listens for is focusable and a button to
  assistive technology, and Enter or Space raise its event.
- Each trigger fires at most once a second, so a value hovering at a band's edge cannot drive it without end.

The viewer runs them; `BoardAuthoring` runs them in View only. Both take the host's side:

| Prop | |
|---|---|
| `boardId` | The board's id — what `{{board}}` becomes, and what the events it hands the host name. |
| `onTrigger(event: BoardEvent)` | An `emit`: `{ name, board?, node?, state? }` — the event's name and the part and status it came from, never a value. |
| `onNavigate({ board })` | A `go-to-board`. Without it, nothing happens: the viewer does not go anywhere on its own. |
| `linkOrigins` | The origins an `open-link` may open besides this installation's paths. Left out: any `https` address. |

## Checking a board

A board that comes from outside your own code — a file, a request body, an assistant's output — is checked before
anything stores or draws it. The hosted server applies the same check to every board it stores, and the MCP server's
`validate` to every board it is given.

```ts
interface BoardIssue { at: string; message: string; hint?: true }
function validateBoard(board: unknown): BoardIssue[];

interface BoardFinding { path: string; message: string }
interface BoardCheck { issues: BoardFinding[]; advice: BoardFinding[] }
function checkBoard(board: unknown): BoardCheck;

function boardSchema(): object;   // JSON Schema 2020-12
```

- `validateBoard` checks the language — every section, kind, option, field name, mapping, layout entry, link, element
  definition (template holes, markup policy) and trigger — and answers every problem, each at an RFC 6901 JSON Pointer
  into the board (`""` is the board itself), with what to do instead where there is something to say:

  ```ts
  validateBoard({ parts: { a: { as: 'stat', of: 'equipment/PR-01' } }, layout: { kind: 'grid', items: ['a'] } });
  // → [{ at: '/parts/a/of', message: 'an item of data is written "equipment[PR-01]" — "/" is only in the ids of parts "each" makes' }]
  ```

  An entry with `hint: true` is advice, not a problem.
- `checkBoard` is what a board meets before it is stored: the language, and then that it draws — a part the renderer
  cannot draw is refused when it is written, not on the page that shows it. `issues` are what it is refused for; with
  none, `advice` is what could be written better.
- `sourceAdvice(board, sources)` — the data reads whose `from` names none of the given data sources (`{ id, name }`),
  each saying which id to write when it names a source by its name. Advice, not a refusal: a source may be removed after
  a board reads it.
- `boardSchema()` — the same rules a JSON Schema can say, generated from the lists the validator reads.
- `boardRulebook()` — the language as Markdown, for an assistant that writes boards: generated from the schema and the
  part kinds, with `RULEBOOK_EXAMPLE`.

## Drawing a board

```ts
type ValueReader = (adapter: string, ref: unknown) => Promise<{ value?: unknown }>;
function readerOf(adapters: readonly Adapter[]): ValueReader;
function pictureOf(board: Board, read: ValueReader): Promise<ViewDocument>;
function toViewDocument(board: Board, options?: { keysOf?: (data: string) => readonly string[] }): ViewDocument;
```

The renderer draws a board through its picture (below). `pictureOf` makes it, reading through `read` which items a list
has — a grid laying out a part per item lays out one item per key; a canvas names its items where it places them.
`readerOf(adapters)` reads each reference through the adapter it names, and nothing for one there is none of. `toViewDocument`
is the same without reading, given the keys; it throws `PictureError` (with the board pointer `at`) for a board that
does not draw. `keyReadsOf(board)` lists the reads that give those keys, `keysIn(board, data, value)` the keys in a
read value, `readKeys(board, read)` both, and `dataReadOf(board, data)` how a board reads one of its data whole.
`elementDefinition(definition)` is an element as its picture draws it — what a server answers a script element's frame
with.

`BoardView` (from `@iyulab/u-board/viewer`) does all of this for a host, and redraws when the board changes.

## The `Adapter` contract

```ts
interface Adapter {
  readonly id: string;
  resolve(ref: unknown): Promise<ResolvedBinding>;
  readonly attribution?: Attribution;
  readonly sample?: boolean;
}

interface Attribution { text: string; url?: string }
```

- `id` — what a data read's `from` names to select this adapter. A board can read from several; the viewer is given all
  of them and routes each read by this id.
- `resolve(ref)` — reads one reference to its current value. For a read with a `path`, `ref` is the HTTP connector's
  reference ([`HttpRef`](#httpref)); for a read with a `ref`, the board's own `ref`, whatever shape this adapter
  defines. Returning a rejected promise (a thrown error, a network timeout) is a valid outcome, treated as no matching
  adapter: the value is left unread and its quality is `disconnected`. One read failing never fails the others. To say
  *why* there is no value, return `{ value: undefined, quality: 'disconnected', reason }` instead of rejecting. Only the
  adapter knows whether the value a reference points at was there, so reporting `address` when it was not is its job.
- `attribution` — optional: how the adapter's source asks to be credited where its data is shown (an agency and its
  open-data portal — a license often makes it a condition of use). The viewer names the credit of every adapter a board
  reads, once each, on a line under the board; `url` becomes a link when it is http(s). `attribution={false}` leaves the
  line to the host.
- `sample` — optional: the adapter's values are example data, not a live source's; a board that reads it says so on
  that line, so no one reads made-up figures as real ones.

### `ResolvedBinding`

```ts
interface ResolvedBinding {
  value: unknown;
  quality: ConnectionQuality;
  reason?: QualityReason;
  message?: string;
  observedAt?: string; // ISO 8601
}
```

What `Adapter.resolve()` returns — the current value, how current it is, and, when it is not `live` and the adapter can
tell, why. `reason` is ignored on a `live` reading. `observedAt`, when the adapter knows it, is when `value` was obtained
from the source: the time of this reading for `live`, of the last successful one for `stale` — what tells a last-known
value of seconds ago from one of days ago. It is ignored on a `disconnected` reading. The hosted HTTP connector reports
the time the source gives (the read's `time`), else the time it read the source. `message`, on a reading that is not
`live`, says what went wrong in words for whoever can fix the read or its data source — for `source`, what the source
itself said. The hosted server sends it to signed-in members and to API tokens, never through a share link.

### `ConnectionQuality`

```ts
type ConnectionQuality = 'live' | 'stale' | 'disconnected';
```

- `live` — the adapter reached the source system just now.
- `stale` — the value shown is not current: the adapter could not reach the source and shows a previously-live value
  as last-known, or the source answered with its latest value and that is older than the read expects of it (reason
  `lagging`).
- `disconnected` — no value has been reached (no matching adapter, the adapter rejected, the source could not be
  reached, or it answered without the value the read points at).

This is deliberately narrower than a full alarm model (priority, acknowledgement, shelving) — see
[`concepts.md`](concepts.md) ("Data"). A `stale` reading only ever comes from the adapter itself: resolving has no memory
of past calls, so an adapter that wants to report `stale` tracks "have I seen this value before, and can I still reach
the source" itself.

### `QualityReason`

```ts
type QualityReason = 'transport' | 'auth' | 'address' | 'format' | 'source' | 'throttled' | 'lagging' | 'pending';
```

Why a value is not `live`, reported by the adapter when it can tell. Each names a different fix, so an operator reading
"disconnected" knows where to look:

- `transport` — the source could not be reached (network, timeout, server error).
- `auth` — the source refused the credentials.
- `address` — the source answered, but not with what the read points at (an unknown path, an empty result, a renamed
  field). The board needs attention, not the network.
- `format` — the source answered in a form the read cannot use: XML or HTML where JSON was needed, or a time it cannot
  read. How the source is asked needs attention (many APIs answer JSON only when asked, with a parameter such as
  `returnType=json`).
- `source` — the source answered with success (HTTP 200) but said in its answer that it could not serve the request: a
  key it does not accept, a query it rejects, a spent quota. What it said (`message`) is the fix. The HTTP connector
  reports it for a data source whose owner said where the source writes such a status
  ([`sourceErrorIn`](#sourceerrorin)).
- `throttled` — requests are being rate limited.
- `lagging` — the source answered, but its latest value is older than the read's `fresh`: the source has stopped or
  fallen behind updating — neither the network nor the board needs attention.
- `pending` — the source is being read and has not answered yet, with no earlier answer to show meanwhile. Nothing
  needs fixing; the next refresh shows the value.

A reason annotates `quality`; it never changes it. A value with no matching adapter, or whose adapter rejected, carries
no reason — the core cannot tell a misconfiguration from a host that simply did not provide that adapter.

### Describing connection quality

```ts
interface QualityText {
  quality: Partial<Record<ConnectionQuality, string>>;
  reason: Record<QualityReason, string>;
  age: (elapsedMs: number) => string;
  brief: {
    quality: Partial<Record<ConnectionQuality, string>>;
    reason: Record<QualityReason, string>;
  };
}
const DEFAULT_QUALITY_TEXT: QualityText; // the English words, age by ageText('en')
function ageText(locale: string): (elapsedMs: number) => string;
function worstQuality(quality: Record<string, ConnectionQuality>): ConnectionQuality | undefined;
type QualitySummary = Pick<ResolvedWidget, 'quality' | 'reasons' | 'observedAt'>;
function describeQuality(
  widget: QualitySummary,
  options?: { text?: QualityText; now?: number }
): string | undefined;
```

The words the shipped renderer uses, for a host that renders its own UI from a resolved picture. `worstQuality` is the
least current of a widget's bindings (`disconnected`, then `stale`, then `live`). `describeQuality(widget)` is one line
of text for a `ResolvedWidget` — the renderer's tooltip and screen-reader announcement — or `undefined` when every
binding is `live`. It names the cause when the adapter reported one and, for a `stale` value with an `observedAt`, how
long ago it was obtained:

```ts
describeQuality({ quality: { 'data.value': 'disconnected' }, reasons: { 'data.value': 'address' } });
// → 'disconnected — no value has been reached (bound value not found at the source)'
describeQuality({
  quality: { 'data.value': 'stale' },
  reasons: { 'data.value': 'transport' },
  observedAt: { 'data.value': '2026-10-04T11:55:00Z' },
}, { now: Date.parse('2026-10-04T12:00:00Z') });
// → 'stale — showing last known value (data source unreachable, 5 minutes ago)'
```

The age is measured when the text is built (`now`, default `Date.now()`), so text that stays on screen should be rebuilt
as the widget re-resolves — the shipped components do on every refresh. When several bindings are at fault, the text
breaks them out per prop path, separated by `;`. `live` has no label on purpose: normal operation is not announced, only
departures from it.

The shipped renderer also marks a part whose headline value is not current with a few visible words on a tag just above
its frame — for a screen nobody hovers over or listens to, such as a wall display. They come from `brief`: the cause when
the adapter reported one ("Source behind" for `lagging`, "No reply from source" for `transport`), else the state, and for
a `stale` value how long ago it was obtained — "Source behind · 3 minutes ago". Assistive technology hears the full
`describeQuality` text instead. Pass `text` to describe quality in another language; `ageText(locale)` builds the `age`
words from the platform's relative-time formatting — `ageText('ko')` reads "5분 전". The shipped components take the same
words through their `labels` prop (`labels.qualityText`).

`observedAt` is stamped on the source's side, so the age is only as right as the two clocks agree. On a machine whose
clock may drift (a screen left running unattended), measure against the source's clock instead: the shipped components
take it as `clock`.

```ts
interface ServerClock {
  now: () => number; // the server's current time; this machine's until a response has carried a Date
  observe: (response: { headers: { get(name: string): string | null } }, sentAt: number) => void;
}
function serverClock(): ServerClock;   // from @iyulab/u-board/viewer
```

`serverClock()` estimates a server's clock from the `Date` header of its responses (RFC 9110): hand it each response with
the `Date.now()` the request was sent at, and pass `now` on as the clock. A response without a readable `Date` changes
nothing — a cross-origin response does not expose it unless the server lists it in `Access-Control-Expose-Headers`.

## Changing a board — `applyJsonPatch(board, patch)`

```ts
function applyJsonPatch<T>(document: T, patch: unknown): T;   // patch: JsonPatchOperation[]
function getByPointer(document: unknown, pointer: string): unknown;
```

A board is changed on the server by a JSON Patch (RFC 6902) against its revision. `applyJsonPatch` applies one —
entirely or not at all, a new value, the given board untouched; a failing operation throws `JsonPatchError` with its
`index`. A `replace` keeps a member where it stands among the others. `getByPointer` reads the value at an RFC 6901
JSON Pointer.

## The picture — `@iyulab/u-board/picture`

The picture is what the renderer draws: a board turned into widgets with their places and bindings. Nobody writes one —
`pictureOf` makes it — but a server computing a board's state, or an assistant looking at what a board draws, reads it.
It reaches no package at runtime.

### `ViewDocument`

```ts
type ViewDocument = CanvasView | GridView;   // told apart by `kind`
```

A `CanvasView` holds a background, `nodes` (each `{ id, x, y, width?, height?, widget }`), `connectors` between them and
`decorations`; a `GridView` holds `items` in order — each a widget, or a `canvas` of its own. Ids are the board's: a
part's id, `<part>/<key>` for a part made per item, `<group>/<part>` inside a group. `placedIn(picture)` returns every
placed widget of either kind (`placedAt` with its JSON Pointer); `isCanvasItem` tells a grid's canvas cell from a widget.
`nodeSize(node)` is the box of a node placed without one (`DEFAULT_NODE_WIDTH` × `DEFAULT_NODE_HEIGHT`, or its
element's).

```ts
interface Widget { type: string; props?: Record<string, unknown>; bindings?: Record<string, Binding> }
interface Binding { adapter: string; ref: unknown; at?: string; map?: ValueMap; itemFields?: Record<string, ItemField>; text?: string }
```

A widget's `type` is a widget of the widget library, or a drawing of U-Board's own (`element:<name>`); `bindings` map a
dotted path into `props` (`'data.value'`) to where its value is read. At resolution each value is written into `props`
at its path — copying, never mutating — so the static `props` keep the defaults for what is unbound or `disconnected`.
A binding's `map` is the board's mapping as the picture writes it (`applyValueMap(map, value)`), `itemFields` what each
row of a list gains (`withItemFields`), `text` a value written into a text (`writeText`).

### `resolveDocument(picture, adapters)`

```ts
function resolveDocument(doc: ViewDocument, adapters: readonly Adapter[]): Promise<ResolvedViewDocument>;
function resolveWidget(widget: Widget, adapters: readonly Adapter[]): Promise<ResolvedWidget>;

interface ResolvedWidget {
  type: string;
  props: Record<string, unknown>;
  quality: Record<string, ConnectionQuality>;
  reasons?: Record<string, QualityReason>;
  observedAt?: Record<string, string>;
}
```

Resolves every widget's bindings — and on a canvas every connector's (`resolveConnector`) — against the given adapters,
and returns the same picture with every `widget` a `ResolvedWidget`: its static `props` merged with every binding whose
reading has a value to show (`live`, or `stale` with its last-known value), `quality` per bound prop path (only props
that had a binding carry one), and the `reasons` and `observedAt` the adapters reported. A `disconnected` reading is never
merged, even if the adapter returned a value. `bindingsIn(picture)` yields every binding with the JSON Pointer of what it
fills — the one walk for whatever needs to know what a board reads.

### `boardStateOf(resolved, { now, revision? })`

```ts
function boardStateOf(doc: ResolvedViewDocument, options: { now: number; revision?: number }): BoardState;

interface BoardState {
  evaluatedAt: string; // ISO 8601
  revision?: number; // of the board, when the caller knows it
  parts: Record<string, PartState>;
}
interface PartState {
  state?: string;
  quality?: ConnectionQuality; // the worst among its bindings
  reason?: QualityReason; // why it is not live, when known
  observedAt?: string; // the oldest observation of its data
}
```

What a resolved board shows, part by part — no values. For example:

```json
{
  "evaluatedAt": "2026-10-16T09:00:00.000Z",
  "revision": 7,
  "parts": {
    "pump": { "state": "down", "quality": "stale", "reason": "transport", "observedAt": "2026-10-16T08:40:00Z" },
    "title": {}
  }
}
```

A part's `state` is the status of the field it is drawn in — a status card's own (its `state`, else the first field it
shows that has a status), a part's `state` option, else the first field it shows that has one — whether a trigger reads
it or not; a trigger that reads another field's status names that one. A part with no such field has no `state`.

The viewer hands it to its host through `onBoardState` each time it draws new values (a view that has stopped updating
reports its parts `stale`); a U-Board server answers it at `GET /api/share/boards/:id/state`.

### Triggers

The decisions a viewer makes, as pure functions for a host that draws a picture its own way: `firedBy(triggers, event,
states)` — the triggers an event fires, given the parts' states now; `stateChanges(before, now)` — the `leave` and
`enter` events between two draws; `linkFor(url, { node, state, board }, { origins })` — the address an `open-link` opens,
or `undefined` when it may not open; `elementListeners(triggers)` — by part, the element events triggers listen for;
`FiringLimit` — once a second per trigger. In the picture a trigger names a part as `node` and a status as `state`.

### `HttpRef`

```ts
interface HttpRef {
  path: string;
  item?: { list: string; where: Record<string, string | number | boolean> };
  items?: { list: string; where: Record<string, string | number | boolean> };
  valuePath?: string;
  observedAtPath?: string;
  timeZone?: string;
  maxAgeSeconds?: number;
  requestTime?: { delaySeconds?: number; stepSeconds?: number };
}
```

The reference a data read with a `path` becomes, and what the hosted HTTP connector reads — implement it in an adapter
that stands in for one. `path` is the read's request; `item` one element of the list (by `key`, or a `pivot`'s row),
`items` the elements `where` keeps, `valuePath` a JSON Pointer to the value inside the item or the answer;
`observedAtPath`, `timeZone`, `maxAgeSeconds` and `requestTime` the read's `time`, `zone`, `fresh` and `now`.
`readHttpRef(body, ref, readAt, now?)` reads a parsed response with it the way the hosted connector does — the value, its
observed time and whether it is `lagging`, or why it failed (`address`, `format`); `resolvedReading(reading)` turns a
reading that found its value into the binding's result; `requestPath(ref, now)` is the request a reference makes at a
time; `isHttpRef(ref)` checks the shape; `parseSourceTime(raw, timeZone?)` reads one time.

#### `sourceErrorIn`

```ts
interface SourceErrorField { path: string; ok?: string[]; messagePath?: string }
function sourceErrorIn(body: unknown, field: SourceErrorField): string | undefined;
```

Some sources answer a key they do not accept, a query they reject or a spent quota with success (HTTP 200) and a status
of their own in the body. A data source's owner says where such a source writes its status, as a setting of the data
source: `path`, a JSON Pointer to the status; `ok`, the statuses that mean success — absent when the source writes a
status there only when it fails (`{ "path": "/code", "messagePath": "/message" }`), present when it always writes one
(`{ "path": "/response/header/resultCode", "ok": ["00"], "messagePath": "/response/header/resultMsg" }`); and
`messagePath`, a JSON Pointer to its words for the error. `sourceErrorIn` answers those words with the status, or the
status alone, or `undefined` when the answer reports no error. The hosted HTTP connector checks every answer of such a
data source this way and fails its reads with reason `source` and that `message`. `isSourceErrorField(field)` checks the
shape.

### Element frames

`elementDefinitionHash(definition)` is the hash a script element's frame address carries, `elementFrameLabel(hash)` the
label of an origin per definition, and `elementFrameHtml` · `elementFrameScripts` the document a server answers the
frame with.

### `lintViewDocument(picture, options?)`

```ts
interface ViewDocumentAdvice { path: string; message: string; count?: number }
function lintViewDocument(doc: ViewDocument, options?: { geometryLimit?: number }): ViewDocumentAdvice[];
```

Advice on a drawn board — none of it stops it being saved or drawn. On a canvas, first where parts would be drawn over
one another: two boxes that overlap, a text under a part, a link running through a text, two texts running into each
other (a text's box estimated as one line, 0.6 × its font size per character). At most 30 of these (`geometryLimit`;
`Infinity` lists them all), then one line counting the rest by kind, whose `count` says how many it stands for. Then
more than 30 script elements on one board (each runs in a frame of its own), and an element whose markup, script and CSS
together pass 32 KB. The paths are the picture's; an assistant reads them back to the board's parts by id.
