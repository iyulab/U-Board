import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { DEFAULT_NODE_HEIGHT, DEFAULT_NODE_WIDTH, getByPointer } from '@iyulab/u-board/domain';
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
  rules: 'How to write a board: the workflow, JSON Patch, the two kinds, widgets. Read this first.',
  canvas: 'A canvas board: coordinates and sizes, connectors, decorations (frames, labels), colours, what draws over what.',
  data: 'Live values: data sources, bindings, picking an item of a list, mapping a source’s words to a prop.',
  elements: 'Elements — what a board draws when no widget does: template (HTML/SVG + CSS) or script (sandboxed frame).',
  widgets: 'The prepared widgets, one line each by category; pass `query` ("list of messages") for only the ones that match.',
  'widget:<type>': 'One prepared widget in full, its examples in board form — e.g. "widget:gauge".',
  schema: 'The board document JSON Schema; pass `pointer` for one part, e.g. "/$defs/elementDefinition".',
};

const RULES = `# Writing a U-Board board

## Workflow
1. list_boards → pick a board, or create_board({ name, kind }). For live values: describe("data").
2. get_board({ board, pointer }) — read only the part you need ("/items", "/nodes/3"); note its revision.
3. Change it with patch_board({ board, revision, patch }) — a JSON Patch (RFC 6902). Start a board small (its frame, a few parts), then add and fix in patches: validate({ board, patch }) sends only the patch, a whole document is sent again each time.
   Each save is a new revision; a new board is revision 1, and create_board with a document saves it as revision 2.
4. Read the answer: the new revision and advice — act on the advice. A 412 means someone saved since — get_board again and redo the patch.
5. validate({ document } | { board, patch }) checks without saving, exactly as saving does.
6. look({ board }) after a change — a picture as viewers see it, what went wrong while drawing, and the advice that still stands. Fix what you see and what it advises — the board is done when both are empty; focus one part to see it up close.

## JSON Patch
- \`add\` sets an object member whether or not it exists, and inserts into an array ("/items/-" appends, "/items/0" prepends).
- \`replace\` and \`remove\` need the member to exist — use \`add\` for a field that may be absent (a grid item's span).
- Escape "/" in a key as "~1" and "~" as "~0". A patch applies entirely or not at all; an error names the operation.

## Kinds
- grid: { kind: "grid", items: [{ id, span?: 1-12 (4), spanMedium?: 1-6, height?: px, widget }] } — an ordinary dashboard, laid out in order to the screen's width.
- canvas: { kind: "canvas", background: { image? }, nodes: [{ id, x, y, width?, height?, anchored, widget }], connectors: [], decorations? } — placed by coordinates, over a drawing or plan. describe("canvas") before drawing one.
- Every id is unique in the document. appearance: "light" (default) | "dark". accent: a colour — the board's primary colour (a gauge's arc, the first series, a tank's fill, --u-widget-primary in an element) in place of the theme's; set it to match the reference instead of fixing colours in widgets or elements.
- The format is closed: a field it does not have is refused, and the issue lists the fields that place takes.

## Widgets
- widget = { type, props?, bindings? }. type is a prepared widget ("gauge", "list", "chart.bar" — describe("widgets", query)) or "element:<name>".
- A prepared widget's props are its u-widgets spec without "widget": { data, mapping?, options?, … } — describe("widget:<type>") shows each example ready to paste.
- A widget draws inside its node's box (or grid cell) and is clipped to it.
- When no widget draws it — a symbol, a schematic part, a custom gauge — define an element once and place it by name: describe("elements").`;

const CANVAS = `# Canvas boards

## Coordinates and sizes
- Scene units = CSS px at 100%, x to the right, y down. The viewer fits the whole drawing into view (never above 100%), so absolute position does not matter — relative layout does.
- A node's x, y is the top-left of its box; width × height default to ${DEFAULT_NODE_WIDTH} × ${DEFAULT_NODE_HEIGHT}. Its widget is clipped to the box — make the box fit its content (a 12 px label needs about 7 px per character).
- caption: a node's name drawn centred under its box, outside it (12 px, on a chip, over the lines) — a device's name under its icon. Keep the box the size of the icon and put the name in caption, not in the element.
- anchored: true when x, y is a real place on the background (a plan's metres, a map's longitude/latitude via background.image.referencePoints), false when placed freely.
- background: {} for none, or { image: { src, width, height } } — the drawing is placed at 0, 0 at its own size. src is a URL or a data: URL (an SVG drawn for the board: "data:image/svg+xml,…").

## Connectors
- { id, fromNodeId, toNodeId, label?, labelAt?, style?: { stroke?, strokeWidth?, dash?: "solid" | "dashed" | "dotted", arrow?: "none" | "end" | "start" | "both" } } — a straight line from the edge of one node's box to the edge of the other's (2 px grey, no arrowheads unless styled). Both ends must be nodes of /nodes.
- label: text on a chip of the paper (a link's "26.78Kbps"), at the line's middle or at labelAt: 0 (the fromNodeId end) to 1 (the toNodeId end). Connectors joining the same two nodes are drawn side by side — one per link, no need to merge them.
- arrow: "end" points at toNodeId, "start" at fromNodeId — a flow's direction. The head's tip touches the box.
- bindings: live values for "label", "style.stroke", "style.strokeWidth", "style.dash", "style.arrow" — the same binding shape as a widget's (describe("data")); a map turns a source's numbers or words into a width, a colour or a direction (a flow that changes sign: "style.arrow" with map { ranges: [{ max: 0, value: "start" }, { min: 0, value: "end" }] }). A label not showing a current value is rimmed (amber stale, grey disconnected).
- A line stops at the edge of the box: with the name in caption, it meets the icon itself.

## Decorations (drawn under connectors and nodes, first one lowest)
- rect: { id, type: "rect", x, y, width, height, fill?, stroke?, strokeWidth?, radius?, dash?: "solid"|"dashed"|"dotted", label?, labelAt?, labelSize?: 13, labelFill? } — no fill: transparent; stroke needs strokeWidth; radius rounds the corners.
- A frame's name is its label: drawn inside it, 8 px in from the edges labelAt names (default "top-start"), in the stroke's colour (or labelFill). No separate text needed.
- text: { id, type: "text", x, y, text, fontSize?: 16, fill?, anchor?, background? } — one line, about 0.6 × fontSize px per character. anchor says which point of the text x, y is (default "top-start" = its top-left; "center" centres it on x, y). background fills a box 4 px around it — give fill too, so the text reads on it (a tag on a frame's edge: background in the frame's colour, a light fill).
- labelAt and anchor take: "top-start", "top", "top-end", "start", "center", "end", "bottom-start", "bottom", "bottom-end" (start = left, end = right).
- Colours: "#1f6feb", "#1f6feb33" (with alpha), rgb()/rgba(), hsl()/hsla(), a CSS name, "transparent", "none". Not var(--…): decorations draw on a canvas, which has no stylesheet.

## Order and appearance
- Drawn from the bottom: background image, decorations (in order), connectors, nodes. Nodes are always on top.
- Saving answers advice where parts would be drawn over one another (overlapping nodes, a text under a node or on a line) — fix it.
- appearance "dark": dark paper; a text decoration with no fill takes a light ink. Pick decoration colours that read on that paper.`;

const DATA = `# Data sources and bindings

- list_sources gives each source's id — a binding's adapter. sample_source({ source, path }) reads one request and answers the shape of the response: each value's JSON Pointer, its type and an example, and the fields that tell a list's items apart.
- A connector binds its label and style the same way (describe("canvas")).
- A binding replaces one prop with a live value: widget.bindings = { "<dotted path into props>": { adapter: "<source id>", ref: { path: "/request?query", valuePath: "/json/pointer" } } } — e.g. "data.value".
- An item of a list, by its fields rather than its place (lists reorder): ref: { path, item: { list: "/items", where: { "id": "P-101" } }, valuePath: "/temp" } — valuePath is then inside the item. Use a field sample_source lists among the list's keys.
- Without valuePath a binding takes the whole response (or the whole item) — give it to a widget that takes rows (a table, a chart's data).
- A value in the source's own words maps to a prop with map: { values: { "Fault": "error" }, ranges: [{ min: 80, value: "warning" }], otherwise: "ok" }.
- A source that publishes on a schedule says how old its value may be: maxAgeSeconds (an hourly feed: 5400); its time: observedAtPath.
- create_source makes a source that needs no credential. One that needs a key, token or OAuth is made by a person in the console — ask them for its id. Credentials never pass through you.`;

const ELEMENTS = `# Elements

definition = { render: "template" | "script", props?, template?, script?, style?, size?: { width, height }, resources?: ["https://cdn.example.com"] }
placement  = { type: "element:<name>", props: { … }, bindings?: { … } } — on as many nodes or items as needed; never repeat markup per item.
symbols    = { "<name>": { viewBox?, markup } } — top level: SVG drawings any template element places with <use href="#<name>"/>. No {{values}} in a symbol; pick one by value: href="#pump-{{state}}".

## Drawing well
- Prefer render "template": HTML/SVG + CSS, no script. Numbers become drawing through CSS: style="--level: {{level}}", height: calc(var(--level) * 1%).
- Use the theme variables, never fixed colours: --u-widget-bg, -surface, -text, -text-secondary, -border, -primary, -positive, -negative, -warning, -font-family, -font-mono. To match a brand colour, set the board's accent (it sets -primary), not a fixed colour.
- Tell states apart by shape as well as colour (filled running, outlined stopped), with a graphic contrast of 3:1 against its background (WCAG 1.4.11) — never mark a state with the faintest token (--u-widget-border). Colour only what needs attention.
- Choose by a value with an attribute and CSS: data-state="{{state}}" + [data-state="fault"] { … }, or <use href="#icon-{{kind}}"> for a symbol per kind. Sections test only empty/non-empty.
- Draw repeated shapes once (a document symbol, <symbol>/<use>, a {{#list}} section). Keep an element under 32 KB.
- A props schema (type, enum, const, properties, required, items, minimum, maximum, minLength, maxLength, title, description, default) says what an element takes; placed props are checked against it. A default only seeds the editor — it is not applied when drawing, so give every prop the markup uses.
- render "script" only when a template cannot. More than 30 placed script elements is too many.

## template
- Markup: HTML text/structure tags, img, and SVG (shapes, text, gradients, patterns, symbol/use, markers, filters).
- Not allowed: script, style, iframe, a, form, foreignObject, event handler attributes (on*), srcset, @import.
- URLs (href, src, CSS url()): only "#id", "data:image/…", or an origin listed in resources.
- Values: {{name}} / {{a.b}} (escaped), {{#list}}…{{/list}} (each item of a list; {{.}} is the item; any other value shows it once), {{^flag}}…{{/flag}} (shown when empty), {{! comment}}. Empty = absent, null, false, "" or []; 0 is not empty. No unescaped output, no partials.
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

/** One part of the schema — and when there is nothing there, the pointers that do lead somewhere. */
function schemaPart(pointer: string): unknown {
  try {
    return getByPointer(documentSchema(), pointer);
  } catch {
    const defs = Object.keys((documentSchema() as { $defs?: Record<string, unknown> }).$defs ?? {});
    throw new Error(`nothing at ${pointer} in the schema — its parts are under /$defs: ${defs.map(name => `/$defs/${name}`).join(', ')}`);
  }
}

/** One line per prepared widget, by category — the catalog an assistant scans to pick one. */
function widgetCatalog(query: string | undefined): unknown {
  const words = (query ?? '').toLowerCase().split(/[^\p{L}\p{N}.]+/u).filter(word => word.length > 1);
  const byCategory: Record<string, string[]> = {};
  for (const info of help()) {
    const line = `${info.widget} — ${info.description}`;
    if (words.length > 0 && !words.some(word => `${line} ${info.category} ${info.label ?? ''}`.toLowerCase().includes(word))) continue;
    (byCategory[info.category] ??= []).push(line);
  }
  if (words.length > 0 && Object.keys(byCategory).length === 0) return { matches: {}, hint: 'nothing matched — describe({ topic: "widgets" }) without a query lists them all' };
  return { [words.length > 0 ? 'matches' : 'widgets']: byCategory, next: 'describe({ topic: "widget:<type>" }) for one in full' };
}

/** A prepared widget in full, with its examples as a board places them: { type, props } — props is the spec without "widget". */
function widgetDetail(type: string): unknown {
  const detail = help(type);
  if (!detail || Array.isArray(detail)) throw new Error(`no widget "${type}" — describe({ topic: "widgets", query: "<what it should show>" }) finds one`);
  const { widget, examples, ...rest } = detail as unknown as { widget: string; examples?: Array<{ label: string; spec: Record<string, unknown> }> } & Record<string, unknown>;
  return {
    type: widget,
    ...rest,
    examples: (examples ?? []).map(({ label, spec: { widget: _type, ...props } }) => ({ label, widget: { type: widget, props } })),
  };
}

export function describeTopic(topic: string | undefined, pointer: string | undefined, query?: string): unknown {
  if (!topic) return { topics: TOPICS, start: 'describe({ topic: "rules" })' };
  if (topic === 'rules') return RULES;
  if (topic === 'canvas') return CANVAS;
  if (topic === 'data') return DATA;
  if (topic === 'elements') return ELEMENTS;
  if (topic === 'schema') return pointer ? schemaPart(pointer) : documentSchema();
  if (topic === 'widgets') return widgetCatalog(query);
  if (topic.startsWith('widget:')) return widgetDetail(topic.slice('widget:'.length));
  throw new Error(`no topic "${topic}" — one of ${Object.keys(TOPICS).join(', ')}`);
}
