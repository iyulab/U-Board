import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { getByPointer } from '@iyulab/u-board/domain';
import { help } from '@iyulab/u-widgets/tools';

const require = createRequire(import.meta.url);

/** The published JSON Schema of a board document, read once. */
let schema: unknown;
function documentSchema(): unknown {
  schema ??= JSON.parse(readFileSync(require.resolve('@iyulab/u-board/view-document.schema.json'), 'utf8'));
  return schema;
}

/** The topics `describe` answers, each in one line — what an assistant reads first. */
export const TOPICS: Record<string, string> = {
  rules: 'How to write a board well: the workflow, JSON Patch, kinds, bindings, elements. Read this first.',
  elements: 'Elements — what a board draws when no widget does: template (HTML/SVG + CSS) or script (sandboxed frame).',
  schema: 'The board document JSON Schema; pass `pointer` for one part, e.g. "/$defs/elementDefinition".',
  widgets: 'The prepared widgets (u-widgets): every type with one line.',
  'widget:<type>': 'One prepared widget in full: its data fields, mapping, options and an example — e.g. "widget:gauge".',
};

const RULES = `# Writing a U-Board board

## Workflow
1. list_boards → pick a board, or create_board({ name, kind }). For live values: list_sources, then sample_source to see a response.
2. get_board({ board, pointer }) — read only the part you need ("/items", "/elements/pump"); note its revision.
3. Change it with patch_board({ board, revision, patch }) — a JSON Patch (RFC 6902). Send the whole document only to start one.
4. Read the answer: the new revision and advice. A 412 means someone saved since — get_board again and redo the patch.
5. validate({ document } | { board, patch }) checks without saving.

## JSON Patch
- \`add\` sets an object member whether or not it exists, and inserts into an array ("/items/-" appends, "/items/0" prepends).
- \`replace\` and \`remove\` need the member to exist — use \`add\` for a field that may be absent (a grid item's span).
- Escape "/" in a key as "~1" and "~" as "~0". A patch applies entirely or not at all; an error names the operation.

## Kinds
- grid: { kind: "grid", items: [{ id, span?: 1-12 (4), spanMedium?: 1-6, height?: px, widget }] } — an ordinary dashboard, in order.
- canvas: { kind: "canvas", background: { image? }, nodes: [{ id, x, y, width?, height?, anchored, widget }], connectors: [], decorations? } — positioned over a drawing or plan.
- Every id is unique in the document. appearance: "light" | "dark".

## Widgets
- widget = { type, props?, bindings? }. A prepared widget's type and props come from u-widgets — describe("widgets"), then describe("widget:<type>").
- bindings: { "<dotted path into props>": { adapter: "<data source id>", ref: { path: "/api/…", valuePath?: "/json/pointer" }, map? } } — the value replaces that prop.

## Elements (when no widget draws it)
- Define once under /elements/<name>, place with widget.type "element:<name>" on as many items as needed — never repeat markup per item.
- Prefer render "template": HTML/SVG + CSS, no script, every {{value}} escaped. Numbers become drawing through CSS: style="--level: {{level}}", height: calc(var(--level) * 1%).
- Use the theme variables, never fixed colours: --u-widget-bg, -surface, -text, -text-secondary, -border, -primary, -positive, -negative, -warning, -font-family, -font-mono.
- Tell states apart by shape as well as colour (filled running, outlined stopped), with a graphic contrast of 3:1 against its background (WCAG 1.4.11) — never mark a state with the faintest token (--u-widget-border). Colour only what needs attention.
- Draw repeated shapes once (<symbol>/<use>, a {{#list}} section). Keep an element under 32 KB.
- render "script" only when a template cannot: it runs in a sandboxed frame with no network; read props with ub.onProps((props, appearance) => …). More than 30 placed script elements is too many.
- A props schema (type, enum, const, properties, required, items, minimum, maximum, minLength, maxLength, title, description, default) says what an element takes; placed props are checked against it.
- resources lists the https origins an element loads from; they work only where the installation allows them. describe("elements") has the full contract.

## Data sources
- list_sources gives each source's id — a binding's adapter. sample_source({ source, path }) reads one request and answers the shape of the response: each value's JSON Pointer, its type and an example, and the fields that tell a list's items apart.
- A binding reads one value: { adapter: "<source id>", ref: { path: "/request?query", valuePath: "/json/pointer" } }.
- An item of a list, by its fields rather than its place (lists reorder): ref: { path, item: { list: "/items", where: { "id": "P-101" } }, valuePath: "/temp" } — valuePath is then inside the item. Use a field sample_source lists among the list's keys.
- Without valuePath a binding takes the whole response (or the whole item) — give it to a widget that takes rows (a table, a chart's data).
- A value in the source's own words maps to a prop with map: { values: { "Fault": "error" }, ranges: [{ min: 80, value: "warning" }], otherwise: "ok" }.
- A source that publishes on a schedule says how old its value may be: maxAgeSeconds (an hourly feed: 5400); its time: observedAtPath.
- create_source makes a source that needs no credential. One that needs a key, token or OAuth is made by a person in the console — ask them for its id. Credentials never pass through you.`;

const ELEMENTS = `# Elements

definition = { render: "template" | "script", props?, template?, script?, style?, size?: { width, height }, resources?: ["https://cdn.example.com"] }
placement  = { type: "element:<name>", props: { … }, bindings?: { … } }

## template
- Markup: HTML text/structure tags, img, and SVG (shapes, text, gradients, patterns, symbol/use, markers, filters).
- Not allowed: script, style, iframe, a, form, foreignObject, event handler attributes (on*), srcset, @import.
- URLs (href, src, CSS url()): only "#id", "data:image/…", or an origin listed in resources.
- Values: {{name}} / {{a.b}} (escaped), {{#list}}…{{/list}} (each item; {{.}} is the item; a truthy value shows once), {{^flag}}…{{/flag}} (empty or false), {{! comment}}. No unescaped output, no partials.
- The markup draws in an isolated root: its CSS reaches only itself, and :host is the element's box. A grid item without a height takes size.height.
- Example:
  { "render": "template",
    "props": { "type": "object", "required": ["level"], "properties": { "level": { "type": "number", "minimum": 0, "maximum": 100 } } },
    "template": "<div class=\\"tank\\" style=\\"--level: {{level}}\\"><div class=\\"fill\\"></div><b>{{level}}%</b></div>",
    "style": ".tank{position:relative;height:100%;border:2px solid var(--u-widget-border)} .fill{position:absolute;inset:auto 0 0 0;height:calc(var(--level) * 1%);background:var(--u-widget-primary)}",
    "size": { "width": 140, "height": 160 } }

## script
- Runs in <iframe sandbox="allow-scripts"> served by the board's server: an origin of its own, no cookies, no page access, no network (connect-src 'none').
- ub.onProps((props, appearance) => draw(props)) — called with the latest props and on every change; ub.reportError(error) shows on its box.
- Code must always return: no loop that waits for a condition, no long synchronous work. A frame that stops answering is removed; in some browsers it freezes the whole board first.
- A library is loaded from an origin in resources (e.g. a <script src> it adds, or import()), and only where the installation allows that origin.
- The frame is drawn from the saved board — save before checking it.`;

export function describeTopic(topic: string | undefined, pointer: string | undefined): unknown {
  if (!topic) return { topics: TOPICS, start: 'describe({ topic: "rules" })' };
  if (topic === 'rules') return RULES;
  if (topic === 'elements') return ELEMENTS;
  if (topic === 'schema') return pointer ? getByPointer(documentSchema(), pointer) : documentSchema();
  if (topic === 'widgets') return help();
  if (topic.startsWith('widget:')) {
    const detail = help(topic.slice('widget:'.length));
    if (!detail || (Array.isArray(detail) && detail.length === 0)) throw new Error(`no widget "${topic.slice(7)}" — describe({ topic: "widgets" }) lists them`);
    return detail;
  }
  throw new Error(`no topic "${topic}" — one of ${Object.keys(TOPICS).join(', ')}`);
}
