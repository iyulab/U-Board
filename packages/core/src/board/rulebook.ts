// The rulebook an assistant reads to write a board. What the code knows — the kinds a
// part may be and their options, the tones, the emphases, the frames, the keys of a data read and of a link — is
// generated from the same lists the schema and the check read, so the rulebook never lists a kind the check refuses or
// leaves one out. Only what the code cannot say — why a board is written this way — is prose.

import { PART_KINDS, type PartKind } from './kinds.js';
import { boardSchema } from './schema.js';
import { EMPHASES, FRAMES, TONES, type Board } from './types.js';

type Schema = { properties?: Record<string, { description?: string }>; $defs?: Record<string, Schema> } & Record<string, unknown>;

/** A worked board: one read of a list, statuses, a status card per item, a chart and a link — valid as written. */
export const RULEBOOK_EXAMPLE: Board = {
  variables: { line: { options: ['L1', 'L2'], default: 'L1' } },
  statuses: { running: { tone: 'ok', label: '가동' }, down: { tone: 'alarm', label: '정지', emphasis: 'blink' } },
  data: {
    pumps: {
      from: 'plant', path: '/plant/pumps', list: '/value', key: 'id', time: 'updatedAt', fresh: 60,
      fields: { state: { state: { run: 'running', trip: 'down', '*': 'off' } }, flow: { label: '유량', unit: 'm³/h', digits: 1 } },
    },
    hourly: { from: 'plant', path: '/plant/flow/hourly', list: '/value', where: { line: { variable: 'line' } } },
  },
  parts: {
    P1: { as: 'status-card', of: 'pumps[P1]', title: '펌프 1', show: ['state', 'flow'], numerals: { scale: 'large', weight: 300 } },
    P2: { as: 'status-card', of: 'pumps[P2]', title: '펌프 2', show: ['state', 'flow'] },
    flow: { as: 'chart.line', of: 'hourly', title: '시간대별 유량', x: 'hour', y: 'flow' },
    note: { as: 'label', title: '예시 데이터', scale: 'small', ink: 'muted' },
  },
  layout: {
    kind: 'canvas', size: [720, 360],
    place: { P1: [40, 40, 200, 120], P2: [440, 40, 200, 120], flow: [40, 200, 640, 140], note: [40, 342, 300, 16] },
    shapes: { title: { text: '펌프장', at: [40, 24] } },
    links: { line: { from: 'P1', to: 'P2', of: 'pumps[P1]', show: 'state', label: '{{flow}}', arrow: 'end' } },
  },
};

/** The rulebook, as Markdown. */
export function boardRulebook(): string {
  const schema = boardSchema() as Schema;
  const defs = schema.$defs ?? {};
  const keys = (def: string, skip: readonly string[] = []) => Object.entries(defs[def]?.properties ?? {})
    .filter(([key]) => !skip.includes(key))
    .map(([key, p]) => `- \`${key}\`${p.description ? ` — ${p.description}` : ''}`)
    .join('\n');
  const code = (words: readonly string[]) => words.map(w => `\`${w}\``).join(' · ');
  return [
    `# Writing a board

A board is one JSON object. Say once where values come from and what they mean (\`data\`), what is shown (\`parts\`) and
where (\`layout\`); statuses and the look are said once for the board. Everything is addressed by id; there is one way
to write each thing.

${['board', 'statuses', 'symbols', 'elements', 'data', 'presets', 'parts', 'layout', 'triggers'].filter(k => k in (schema.properties ?? {})).map(k => `- \`${k}\`${schema.properties![k]!.description ? ` — ${schema.properties![k]!.description}` : ''}`).join('\n')}`,

    `## data — read once, give meaning once

A data read asks an HTTP connector a \`path\` — the usual read. Only an adapter the host names itself is given its own
\`ref\` instead (one item, its \`fields\` only, never with \`path\`).
Parts name a read (\`"pumps"\`, the whole list) or one item of it (\`"pumps[P1]"\`, by its \`key\`). Data stays raw —
names, units, places and statuses live in \`fields\`, never in the data. A board takes values from outside with \`variables\` (see the example): \`{ "variable": "line" }\` in a \`where\`, \`[$line]\` in an \`of\`, \`{{$line}}\` in a text; a viewer asks for one in its address (\`?v.line=L2\`). A value no list names — a day, a number, a word — is a \`kind\` (\`date\`, \`datetime\`, \`number\`, \`text\`) with a \`default\`, read in a \`where\` or a text only. A field's \`at\` points into one item, so with a \`list\` what sits beside it (a count, a total) is out of reach: read that
with a read of its own and no \`list\` — \`{ from: 'plant', path: '/plant/pumps?limit=1', fields: { total: { at: '/total' } } }\`. With a \`list\`, \`time\` is a field of each item (an item lacking it has no value); the answer's own is \`answerTime\`.

${keys('query')}

A field is \`{ at?, label?, unit?, digits?, format?, names?, state? }\`; it reads \`/<its name>\` of the item unless \`at\`
says where. \`state\` says how the value is doing, as a status: \`"raw"\` (the value is a status name), a map
(\`{ "trip": "down", "*": "off" }\`, \`*\` for the rest) or bands (\`["ok", 1, "warn", 5, "alarm"]\` — the status below the
first number, then from each number up); a time's \`state\` can follow the clock: \`{ "relative": ["past", -2700, "now", 1, "next", 2700, "later"] }\` — bands over the seconds from now to it (negative: gone by). \`names\` takes the same two forms for what a value is shown as (a word, a count of marks). A field can also be computed from the items of the list: \`derive: { op: count | sum | min | max | avg, field?, where? }\` — a part that reads the list (no item) shows it, a \`state\` on it can raise a status. A field that holds a list of objects says what its items' fields mean with \`items\`.`,

    `## statuses — how each status looks

Tones (always there): ${code(TONES)}. A board names its own statuses, each with a \`tone\`, a \`label\`, and optionally a
\`glyph\` and an \`emphasis\` (${code(EMPHASES)}). Anything showing a field with a \`state\` takes its status — colour,
label, glyph. Never write colours for statuses.`,

    `## parts — what, of what, which fields

\`{ "as": <kind>, "of": "<data>" | "<data>[<key>]", "show": "<field>" | ["<field>", …], "title"?, …options }\`. \`{{field}}\`
in a title or a label reads a field of \`of\` (a status card's \`subtitle\` · \`note\` and a header's \`kicker\` · \`subtitle\` too; a header's \`clock\` is \`true\`; its \`time\` · \`date\` name a field of \`of\` that holds a date-time — the record's own, apart from \`clock\`, which is now — and \`since\` the same written as how long ago ("3 minutes ago"); an offset time shows on the clock of the read's \`zone\`); \`{{key}}\` is the item's key. \`presets\` hold shared settings a part takes
with \`use\`; \`each: "<data>"\` makes one part per item (ids \`<part>/<key>\`) — it takes no \`of\`, and is placed once. An answer keyed by names (\`{"g1": {…}}\`) is no list: write a list whose items hold the name, as \`key\`. A \`group\` is several parts on a small
canvas of their own (\`size\` [w, h], or the reach of their boxes) — its parts and links read the group's \`of\` unless they name their own.

The board's own options take fields of what the part reads: a \`status-card\`'s \`meter\` is \`"<field>"\` or
\`{ "field", "min"?, "max"? (a number, or a field of the item), "form"?: "bar" | "ring" }\`, its \`state\` (and a \`stat-list\`'s) the field whose status colours
it, a \`stat\`'s \`trend\` a field holding its recent values, a \`list\`'s \`primary\` · \`secondary\` · \`trailing\` ·
\`badge\` · \`time\` fields of each row. A part that reads one item takes \`highlight: "<boolean field>"\`: a ring while it is true, apart from the status. \`dim: "<boolean field>"\` is the opposite: faded while it is true. A part's look is said in words (\`scale\`: \`small\` … \`xxlarge\`): a \`label\`'s \`scale\` · \`ink\` (\`text\` · \`muted\` · \`accent\`) · \`face\` (\`pill\`), a header's \`scale\` · \`kickerInk\`, and \`numerals: { scale?, weight? }\` for the figures of a \`stat\`, \`status-card\`, \`list\` (a skin's: only a \`stat\`). Any other option is the widget's own — only those listed.

| kind | shows | reads data | options |
|---|---|---|---|
${PART_KINDS.map(kindRow).join('\n')}

Every \`chart.*\` also takes ${code(sharedChartOptions())}.`,

    `## layout — where, per view kind

- canvas: \`{ "kind": "canvas", "size": [w, h], "background"?, "place": { "<part>": [x, y, w?, h?] }, "shapes"?, "links"? }\` —
  an \`each\` part is placed item by item inside its own entry (\`{ "P1": [x, y, w, h], … }\`), or — when the items change and cannot be
  named — by their own fields: \`"quake": { "at": ["lon", "lat"], "frame": [-180, 90, 180, -90], "size": [14, 14] }\` puts each item
  at the point its two fields say; \`frame\` is the values at the canvas's left, top, right and bottom edges (the canvas's own
  coordinates when left out), \`size\` the box centred on the point (give one for a marker: a dot alone is [14, 14]; one with a name or note draws
  it right of the dot — about [150, 40] — and it is the box, not the dot, that is centred). An item with no number in a field, or
  outside the frame, is not drawn — \`look\` counts them. The data needs a \`key\`; the projection is linear (right for a plan or a flat map). A part is placed one way, not both. Or by a rule: \`"<part>": { "flow": { "cell": [w, h], "columns": n, "gap"?: [across, down], "at"?: [x, y] }, "by"?: "<field>", "boxes"?: { "columns": n, "label"?: "{{key}}" } }\` — items flow in columns, or with \`by\` are grouped into labelled boxes (\`flow.pad\` [sides, top] kept clear inside). A shape is a \`box\` (with \`label\`), a \`text\` at a point,
  a \`line\` through points or a \`path\` (absolute M · L · C · Q · Z). A \`box\`, \`line\` or \`path\` with \`of\` and \`show\` takes its outline's colour from that field's status, as a link does; a box or path with \`fill\` (\`tone\` or \`hatch\`, which reads without colour) is filled with it too.
- grid: \`{ "kind": "grid", "items": ["<part>", ["<part>", span], { "grid": [ … ], "span": n }, { "canvas": { … }, "span": n }] }\` —
  12 columns; an \`each\` part's items are cells (\`["pumps", 2]\`: six to a row); a grid in an item stacks what it holds.

A link joins two parts:

${keys('groupLink')}`,

    `## elements and the look

Use a built-in whenever one shows the thing — a title, a status and a few values are a \`status-card\`, \`stat\` or
\`stat-list\`. Write an element only for a drawing no built-in makes:
\`"elements": { "tank": { "template": "<svg …>{{level}}</svg>", "style"?: "…", "props": { "level": "number", "tone": "string" } } }\`
— every \`{{hole}}\` is a declared prop (\`number\` · \`string\` · \`boolean\` · \`list\` · \`object\`). A part places it with
\`"as": "element", "element": "tank"\`, fixed \`props\` and \`bind\` (\`{ "level": "<field>", "tone": "<field>.tone" }\`). What markup cannot draw runs as a
\`"script"\` in place of the template — in a sandboxed frame with no network, its props through \`ub.onProps\`, values out by \`ub.emit(name, value)\`, \`"resources"\` the
https:// origins it loads from. The look is \`board.skin\`, once for the board; parts never set fonts or colours:
\`{ "palette"?: { "paper", "ink", "muted", "rule", "ground"? (text on the board), "backdrop"? (the board's own colour) }, "font"? · "display"? · "mono"? (font stacks), "frame"?, "radius"? (px), "shadow"?: "none" | "soft" | "hard", "titles"?: "plain" | "band" | "tab" }\`
— a frame is ${code(FRAMES)}; paper is the ground the widgets sit on, ink their text, muted the quieter text, rule their lines; an element's CSS reads them as
\`var(--u-widget-bg)\` · \`var(--u-widget-text)\` · \`var(--u-widget-text-secondary)\` · \`var(--u-widget-border)\`; a background picture follows the skin when it writes a colour as \`var(--u-widget-bg, #f6f4ef)\` (its own colour is the fallback).`,

    `## triggers — what the board does

A trigger is \`{ "on", "when"?, "do": [ … ] }\`. \`on\` a part clicked (\`{ "event": "click", "part" }\`), an event its element
raises (\`"element"\` with \`name\`), a part entering or leaving a status (\`"enter"\` · \`"leave"\` with \`status\`, and the
\`field\` whose state it is unless the part has its own — a status card's, a \`state\` option's) or the board opened
(\`"open"\`); \`when\` keeps it to a part in one of the statuses; \`do\` opens a link (\`open-link\`, \`url\` with \`{{part}}\` ·
\`{{status}}\` · \`{{board}}\` filled in), brings a part into view (\`focus\`), hands the host an event (\`emit\`) or asks for
another board (\`go-to-board\`). A part made per item is named per item (\`"pumps/P1"\`) — or, in \`on\`, by its own id for every
item at once (\`{ "event": "click", "part": "pumps" }\`): the event is then about that item, and \`open-link\`'s \`url\` may hold
\`{{key}}\` (the item's key) and \`{{field}}\` (a field the data declares), each URL-encoded: \`"/orders/{{key}}?line={{line}}"\`.
The address (scheme, host, port) is written out; the holes go in the path, query or fragment. An item with no value for a field
gets no link. Triggers only show, move and tell — they write to nothing the board reads.`,

    `## Rules

- Ids are the keys of each map and unique within it. Never address by index.
- Every part is placed by the layout; a part placed nowhere is an error.
- Coordinates appear only in a canvas layout.

## Example

\`\`\`json
${JSON.stringify(RULEBOOK_EXAMPLE, null, 1)}
\`\`\``,
  ].join('\n\n');
}

const optionsOf = (k: PartKind) => [...k.own, ...k.options];

/** The options every `chart.*` kind takes — the data columns and the like — said once under the table, not on each chart's row. */
export function sharedChartOptions(): string[] {
  const charts = PART_KINDS.filter(k => k.kind.startsWith('chart.'));
  return charts.length === 0 ? [] : optionsOf(charts[0]!).filter(option => charts.every(k => optionsOf(k).includes(option)));
}

/** A kind's row: its name, what it shows, whether it reads data, and its options — the board's own, then the widget's. */
function kindRow(k: PartKind): string {
  const reads = { needs: 'yes', may: 'may', no: 'no' }[k.of];
  const shared = k.kind.startsWith('chart.') ? sharedChartOptions() : [];
  const options = optionsOf(k).filter(option => !shared.includes(option));
  return `| \`${k.kind}\` | ${k.shows.replace(/\|/g, '/')} | ${reads} | ${options.length > 0 ? options.map(o => `\`${o}\``).join(' ') : '—'} |`;
}
