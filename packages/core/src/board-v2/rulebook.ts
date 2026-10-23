// The rulebook an assistant reads to write a board in the language's second version. What the code knows — the kinds a
// part may be and their options, the tones, the emphases, the frames, the keys of a data read and of a link — is
// generated from the same lists the schema and the check read, so the rulebook never lists a kind the check refuses or
// leaves one out. Only what the code cannot say — why a board is written this way — is prose.

import { PART_KINDS, type PartKind } from './kinds.js';
import { boardV2Schema } from './schema.js';
import { EMPHASES, FRAMES, TONES, type BoardV2 } from './types.js';

type Schema = { properties?: Record<string, { description?: string }>; $defs?: Record<string, Schema> } & Record<string, unknown>;

/** A worked board: one read of a list, statuses, a status card per item, a chart and a link — valid as written. */
export const RULEBOOK_EXAMPLE: BoardV2 = {
  version: 2,
  statuses: { running: { tone: 'ok', label: '가동' }, down: { tone: 'alarm', label: '정지', emphasis: 'blink' } },
  data: {
    pumps: {
      from: 'plant', path: '/plant/pumps', list: '/value', key: 'id', time: 'updatedAt', fresh: 60,
      fields: { state: { state: { run: 'running', trip: 'down', '*': 'off' } }, flow: { label: '유량', unit: 'm³/h', digits: 1 } },
    },
    hourly: { from: 'plant', path: '/plant/flow/hourly', list: '/value' },
  },
  parts: {
    P1: { as: 'status-card', of: 'pumps[P1]', title: '펌프 1', show: ['state', 'flow'] },
    P2: { as: 'status-card', of: 'pumps[P2]', title: '펌프 2', show: ['state', 'flow'] },
    flow: { as: 'chart.line', of: 'hourly', title: '시간대별 유량', x: 'hour', y: 'flow' },
  },
  layout: {
    kind: 'canvas', size: [720, 360],
    place: { P1: [40, 40, 200, 120], P2: [440, 40, 200, 120], flow: [40, 200, 640, 140] },
    shapes: { title: { text: '펌프장', at: [40, 24] } },
    links: { line: { from: 'P1', to: 'P2', of: 'pumps[P1]', show: 'state', label: '{{flow}}', arrow: true } },
  },
};

/** The rulebook, as Markdown. */
export function boardV2Rulebook(): string {
  const schema = boardV2Schema() as Schema;
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

${['version', 'board', 'statuses', 'symbols', 'elements', 'data', 'presets', 'parts', 'layout'].filter(k => k in (schema.properties ?? {})).map(k => `- \`${k}\`${schema.properties![k]!.description ? ` — ${schema.properties![k]!.description}` : ''}`).join('\n')}`,

    `## data — read once, give meaning once

A data read asks an HTTP connector a \`path\`, or gives another adapter its own \`ref\` (one item, its \`fields\` only).
Parts name a read (\`"pumps"\`, the whole list) or one item of it (\`"pumps[P1]"\`, by its \`key\`). Data stays raw —
names, units, places and statuses live in \`fields\`, never in the data.

${keys('query')}

A field is \`{ at?, label?, unit?, digits?, format?, names?, state? }\`; it reads \`/<its name>\` of the item unless \`at\`
says where. \`state\` says how the value is doing, as a status: \`"raw"\` (the value is a status name), a map
(\`{ "trip": "down", "*": "off" }\`, \`*\` for the rest) or bands (\`["ok", 1, "warn", 5, "alarm"]\` — the status below the
first number, then from each number up). \`names\` takes the same two forms for the words a value is shown as.`,

    `## statuses — how each status looks

Tones (always there): ${code(TONES)}. A board names its own statuses, each with a \`tone\`, a \`label\`, and optionally a
\`glyph\` and an \`emphasis\` (${code(EMPHASES)}). Anything showing a field with a \`state\` takes its status — colour,
label, glyph. Never write colours for statuses.`,

    `## parts — what, of what, which fields

\`{ "as": <kind>, "of": "<data>" | "<data>[<key>]", "show": "<field>" | ["<field>", …], "title"?, …options }\`. \`{{field}}\`
in a title or a label reads a field of \`of\`; \`{{key}}\` is the item's key. \`presets\` hold shared settings a part takes
with \`use\`; \`each: "<data>"\` makes one part per item (ids \`<part>/<key>\`) — it takes no \`of\`, and is placed once. A \`group\` is several parts on a small
canvas of their own — its parts and links read the group's \`of\` unless they name their own.

The board's own options take fields of what the part reads: a \`status-card\`'s \`meter\` is \`"<field>"\` or
\`{ "field", "min"?, "max"?, "form"?: "bar" | "ring" }\`, its \`state\` (and a \`stat-list\`'s) the field whose status colours
it, a \`stat\`'s \`trend\` a field holding its recent values, a \`list\`'s \`primary\` · \`secondary\` · \`trailing\` ·
\`badge\` · \`time\` fields of each row. Any other option is the widget's own — only those listed.

| kind | shows | reads data | options |
|---|---|---|---|
${PART_KINDS.map(kindRow).join('\n')}`,

    `## layout — where, per view kind

- canvas: \`{ "kind": "canvas", "size": [w, h], "background"?, "place": { "<part>": [x, y, w?, h?] }, "shapes"?, "links"? }\` —
  an \`each\` part is placed item by item inside its own entry. A shape is a \`box\` (with \`label\`), a \`text\` at a point,
  a \`line\` through points or a \`path\` (absolute M · L · C · Q · Z).
- grid: \`{ "kind": "grid", "items": ["<part>", ["<part>", span], { "grid": [ … ], "span": n }, { "canvas": { … }, "span": n }] }\` —
  12 columns; a grid inside an item stacks what it holds.

A link joins two parts:

${keys('groupLink')}`,

    `## elements and the look

Use a built-in whenever one shows the thing — a title, a status and a few values are a \`status-card\`, \`stat\` or
\`stat-list\`. Write an element only for a drawing no built-in makes:
\`"elements": { "tank": { "template": "<svg …>{{level}}</svg>", "style"?: "…", "props": { "level": "number", "tone": "string" } } }\`
— every \`{{hole}}\` is a declared prop (\`number\` · \`string\` · \`boolean\` · \`list\` · \`object\`). A part places it with
\`"as": "element", "element": "tank"\`, fixed \`props\` and \`bind\` (\`{ "level": "<field>", "tone": "<field>.tone" }\`). The look is \`board.skin\` — fonts, a
palette and a frame (${code(FRAMES)}) — once for the board; parts never set fonts or colours.`,

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

/** A kind's row: its name, what it shows, whether it reads data, and its options — the board's own, then the widget's. */
function kindRow(k: PartKind): string {
  const reads = { needs: 'yes', may: 'may', no: 'no' }[k.of];
  const options = [...k.own, ...k.options];
  return `| \`${k.kind}\` | ${k.shows.replace(/\|/g, '/')} | ${reads} | ${options.length > 0 ? options.map(o => `\`${o}\``).join(' ') : '—'} |`;
}
