import { DEFAULT_NODE_HEIGHT, DEFAULT_NODE_WIDTH, getByPointer } from '@iyulab/u-board/domain';
import { help } from '@iyulab/u-widgets/tools';
// Imported rather than read from disk, so `describe` runs where there is no file system — a browser's chat panel.
import schema from '@iyulab/u-board/view-document.schema.json' with { type: 'json' };

/** The published JSON Schema of a board document. */
function documentSchema(): unknown {
  return schema;
}

/** The topics `describe` answers, each in one line — what an assistant reads first. */
export const TOPICS: Record<string, string> = {
  rules: 'How to write a board: the workflow, JSON Patch, the two kinds, widgets, triggers. Read this first.',
  canvas: 'A canvas board: coordinates and sizes, connectors, decorations (frames, labels), colours, what draws over what.',
  data: 'Live values: data sources, bindings, picking an item of a list, mapping a source’s words to a prop.',
  elements: 'Elements — what a board draws when no widget does: template (HTML/SVG + CSS) or script (sandboxed frame).',
  mixed: 'A grid with a canvas in a cell — a plan or map among KPI cards: its shape and what stays on the board.',
  components: 'Components — a group of canvas parts (frame, widgets, lines) defined once and drawn per instance with its own values.',
  widgets: 'The prepared widgets, one line each by category; pass `query` ("list of messages") for only the ones that match.',
  'widget:<type>': 'One prepared widget in full, its examples in board form — e.g. "widget:gauge".',
  schema: 'The board document JSON Schema; pass `pointer` for one part, e.g. "/$defs/elementDefinition".',
};

const RULES = `# Writing a U-Board board

## Workflow
1. list_boards → pick a board (rename_board renames it), or create_board({ name, kind }). For live values: describe("data").
2. get_board({ board, pointer }) — read only the part you need ("/nodes/3"); note its revision.
3. Change it with patch_board({ board, revision, patch }) — a JSON Patch (RFC 6902). Start small (its frame, a few parts), then add and fix.
   Each save is a new revision; a new board is revision 1, create_board with a document saves revision 2.
   Rename or remove an element, symbol or component, remove a node with its lines, make or detach a component: edit_board rewrites every use.
4. Read the answer: the new revision and advice — act on it. A 412: someone saved since — get_board, patch again.
5. validate({ document } | { board, patch }) checks without saving, exactly as saving does.
6. board_state({ board }) — what each part shows now (state, quality), no picture: the cheap check after a change to states or bindings.
7. look({ board }) after a change — a picture as viewers see it, what went wrong while drawing, and the advice that still stands. Fix both — the board is done when both are empty (its status says so); focus a part to see it up close.

## JSON Patch
- \`add\` sets an object member, existing or not, and inserts into an array ("/items/-" appends, "/items/0" prepends).
- \`replace\` and \`remove\` need the member to exist — use \`add\` for a field that may be absent (a grid item's span).
- Escape "/" in a key as "~1" and "~" as "~0". A patch applies entirely or not at all; an error names the operation.

## Kinds
- grid: { kind: "grid", items: [{ id, span?: 1-12 (4), spanMedium?: 1-6, height?: px, widget | canvas }] } — a dashboard in order, to its width; a canvas item: a plan among cards (describe("mixed")).
- canvas: { kind: "canvas", background: { image? }, nodes: [{ id, x, y, width?, height?, anchored, widget }], connectors: [], decorations?, components?, instances? } — placed by coordinates, over a drawing or plan. describe("canvas") before drawing one; describe("components") when the same group of parts repeats.
- Every id is unique in the document. appearance: "light" (default) | "dark". accent: the board's primary colour (a gauge's arc, the first series, --u-widget-primary in an element) in place of the theme's; set it to match the reference instead of fixing colours in widgets or elements.
- The format is closed: an unknown field is refused, and the issue lists the fields that place takes.

## Widgets
- widget = { type, props?, bindings? }. type is a prepared widget ("gauge", "list", "chart.bar" — describe("widgets", query)) or "element:<name>".
- A prepared widget's props are its u-widgets spec without "widget": { title?, data, mapping?, options?, … } — describe("widget:<type>") gives examples ready to paste.
- A widget draws inside its node's box (or grid cell), clipped to it. Title a chart with props.title, not a header item above it.
- When no widget draws it — a symbol, a schematic part, a custom gauge — define an element once and place it by name: describe("elements").

## Triggers — what a viewer does when something happens
- triggers: [{ on, when?, do: [action, …] }] at the top level, either kind.
- on: { event: "click", node } | { event: "enter" | "leave", node, state } (the part's state changes) | { event: "element", node, name } | { event: "open" }. An element raises name with data-ub-event="name" on template markup (a click there) or ub.emit("name") in a script.
- when: { node, state: "fault" | ["fault", "hot"] } — only while that part is in one of those states.
- do: { action: "open-link", url } (https:// or a /path; fills only {{node}}, {{state}}, {{board}}) | { action: "focus", node } | { action: "emit", name } (tells the page the board is on) | { action: "go-to-board", board } (that page decides).
- Triggers show, move and tell — they never write to a source. A part with a click trigger becomes a button named by its caption (else its id).`;

const MIXED = `# Mixed boards — a canvas in a grid cell

- A grid item holds a widget or a canvas: { id, span?, spanMedium?, rowSpan?, height?, canvas: { background, nodes, connectors, decorations? } }. Use it when a board is a plan, map or diagram with cards around it: the plan in a wide cell (span 8, rowSpan 3), then the cards — the next ones fill the rows beside it in order (span 4 each), the rest go below.
- The canvas's nodes, connectors and decorations are written as a canvas board's (describe("canvas")) and it is drawn fitted to its cell. Without height the cell keeps the canvas's proportions; give height to make it a fixed size.
- What a board defines once stays at the top level: elements, symbols, triggers, appearance, accent. A cell's nodes place the board's elements, and a trigger names a cell's node by its id.
- Every id is unique in the whole document — items and every cell's nodes, connectors and decorations. A connector joins two nodes of the same cell.
- Patch a cell at "/items/<i>/canvas/nodes/-"; edit_board's remove takes a cell's node, connector or decoration ids; look checks and focuses a cell's nodes.`;

const CANVAS = `# Canvas boards

## Coordinates and sizes
- Scene units = CSS px at 100%, x to the right, y down. The viewer fits the whole drawing into view (never above 100%), so absolute position does not matter — relative layout does.
- A node's x, y is the top-left of its box. width × height left out: the size of the element it places (its definition's size), else ${DEFAULT_NODE_WIDTH} × ${DEFAULT_NODE_HEIGHT}. Its widget is clipped to the box — make the box fit its content (a 12 px label needs about 7 px per character).
- caption: a node's name drawn centred under its box, outside it (12 px, on a chip, over the lines) — a device's name under its icon. Keep the box the size of the icon and put the name in caption, not in the element.
- anchored: true when x, y is a real place on the background (a plan's metres, a map's longitude/latitude via background.image.referencePoints), false when placed freely.
- background: {} for none, or { image: { src, width, height } } — the drawing is placed at 0, 0 at its own size. src is a URL or a data: URL (an SVG drawn for the board: "data:image/svg+xml,…").

## Connectors
- { id, fromNodeId, toNodeId, label?, labelAt?, style?: { stroke?, strokeWidth?, dash?: "solid"|"dashed"|"dotted", arrow?: "none"|"end"|"start"|"both", route?: "straight"|"orthogonal" } } — a line from the edge of one node's box to the other's, 2 px grey. route "orthogonal": right angles as pipes and wiring — out of the side facing the other node, one turn mid-gap. Both ends must be nodes of /nodes.
- label: text on a chip of the paper (a link's "26.78Kbps"; bound, "{{value | fixed:1}} Mbps" keeps the unit), at the middle or at labelAt: 0 (the fromNodeId end) to 1. Connectors joining the same two nodes are drawn side by side — one per link.
- arrow: "end" points at toNodeId, "start" at fromNodeId — a flow's direction.
- bindings: live values for "label", "style.stroke", "style.strokeWidth", "style.dash", "style.arrow" — the same binding shape as a widget's (describe("data")); a map turns a source's numbers or words into a width, a colour or a direction (a flow that changes sign: "style.arrow" with map { ranges: [{ max: 0, value: "start" }, { min: 0, value: "end" }] }). A label not showing a current value is rimmed (amber stale, grey disconnected).
- A line stops at the edge of the box: with the name in caption, it meets the icon itself.

## Decorations (drawn under connectors and nodes, first one lowest)
- rect: { id, type: "rect", x, y, width, height, fill?, stroke?, strokeWidth?, radius?, dash?: "solid"|"dashed"|"dotted", label?, labelAt?, labelSize?: 13, labelFill? } — no fill: transparent; stroke needs strokeWidth; radius rounds the corners.
- A frame's name is its label: drawn inside it, 8 px in from the edges labelAt names (default "top-start"), in the stroke's colour (or labelFill) — no separate text.
- text: { id, type: "text", x, y, text, fontSize?: 16, fill?, anchor?, background? } — one line, about 0.6 × fontSize px per character. anchor says which point of the text x, y is (default "top-start" = its top-left; "center" centres it on x, y). background fills a box 4 px around it — give fill too, so the text reads on it (a tag on a frame's edge: background in the frame's colour, a light fill).
- labelAt and anchor take: "top-start", "top", "top-end", "start", "center", "end", "bottom-start", "bottom", "bottom-end" (start = left, end = right).
- Colours: "#1f6feb", "#1f6feb33" (with alpha), rgb()/rgba(), hsl()/hsla(), a CSS name, "transparent", "none" — or a theme name: "positive", "warning", "negative", "accent". Not var(--…): a canvas has no stylesheet.

## Order and appearance
- Drawn from the bottom: background image, decorations (in order), connectors, nodes. Nodes are always on top.
- Saving answers advice where parts would be drawn over one another (overlapping nodes, a text under a node or on a line) — fix it.
- appearance "dark": dark paper; a text with no fill takes a light ink, a theme colour name its dark value. Pick others that read on it.`;

const DATA = `# Data sources and bindings

- list_sources gives each source's id — a binding's adapter. sample_source({ source, path }) reads one request and answers the shape of the response: each value's JSON Pointer, its type and an example, and the fields that tell a list's items apart.
- A connector binds its label and style the same way (describe("canvas")).
- A binding replaces one prop with a live value: widget.bindings = { "<dotted path inside props>": { adapter: "<source id>", ref: { path: "/request?query", valuePath: "/json/pointer" } } } — e.g. "data.value", or an element's own prop "status"; never "props.status".
- An item of a list, by its fields rather than its place (lists reorder): ref: { path, item: { list: "/items", where: { "id": "P-101" } }, valuePath: "/temp" } — valuePath is then inside the item. Use a field sample_source lists among the list's keys.
- Without valuePath a binding takes the whole response (or the whole item) — give it to a widget that takes rows (a table, a chart's data).
- A value in the source's own words maps to a prop with map: { values: { "Fault": "error" }, ranges: [{ min: 80, value: "warning" }], otherwise: "ok" }.
- A part can be in named states, read from one of its widget’s bindings: states: { from: "<that binding’s key>", map: { values: { "Fault": "fault" }, ranges: [{ min: 80, value: "hot" }], otherwise: "ok" }, looks: { "fault": { outline: "<colour>", blink: true }, "off": { hidden: true } } } — on the node or grid item, beside widget. map reads the source’s value before the binding’s own map; a value it names nothing for is no state. A state is named from the current reading only — no delay, no latch. Looks draw around the part (its border stays the connection quality); a state without a look is still named. board_state answers each part’s state.
- A source that publishes on a schedule says how old its value may be: maxAgeSeconds (an hourly feed: 5400); its time: observedAtPath.
- create_source makes a source that needs no credential. One that needs a key, token or OAuth is made by a person in the console — ask them for its id. Credentials never pass through you.`;

const ELEMENTS = `# Elements

definition = { render: "template" | "script", props?, template?, script?, style?, size?: { width, height }, resources?: ["https://cdn.example.com"] }
placement  = { type: "element:<name>", props: { … }, bindings?: { … } } — on as many nodes or items as needed; never repeat markup per item.
symbols    = { "<name>": { viewBox?, markup } } — top level: SVG drawings any template element places with <use href="#<name>"/>. No {{values}} in a symbol; pick one by value: href="#pump-{{state}}".
  CSS selectors (".icon path") do not reach into what a <use> draws — only inherited fill, stroke, color, --vars do: put each part's look in the symbol (fill="none" stroke="currentColor"), colour the <use>.

## Drawing well
- Prefer render "template": HTML/SVG + CSS, no script. Numbers become drawing through CSS: style="--level: {{level}}", height: calc(var(--level) * 1%).
- Use the theme variables, never fixed colours: --u-widget-bg, -surface, -text, -text-secondary, -border, -primary, -positive, -negative, -warning, -font-family, -font-mono. To match a brand colour, set the board's accent (it sets -primary), not a fixed colour.
- Tell states apart by shape as well as colour (filled running, outlined stopped), with a graphic contrast of 3:1 against its background (WCAG 1.4.11) — never mark a state with the faintest token (--u-widget-border). Colour only what needs attention.
- Choose by a value with an attribute and CSS: data-state="{{state}}" + [data-state="fault"] { … }, or a symbol per value. Sections test only empty/non-empty.
- Draw repeated shapes once (a symbol, <symbol>/<use>, a {{#list}} section). Keep an element under 32 KB.
- A props schema (type, enum, const, properties, required, items, minimum, maximum, minLength, maxLength, title, description, default) says what an element takes; placed props are checked against it. A default only seeds the editor — it is not applied when drawing, so give every prop the markup uses.
- render "script" only when a template cannot. Over 30 placed script elements is too many.

## template
- Markup: HTML text/structure tags, img, and SVG (shapes, text, gradients, patterns, symbol/use, markers, filters).
- Not allowed: script, style, iframe, a, form, foreignObject, event handler attributes (on*), srcset, @import.
- URLs (href, src, CSS url()): only "#id", "data:image/…", or an origin listed in resources.
- Values: {{name}} / {{a.b}} (escaped), {{#list}}…{{/list}} (each item; {{.}} is the item; any other value once), {{^flag}}…{{/flag}} (shown when empty), {{! comment}}, {{v | fixed:1}} (decimals 0–6), {{v | grouped:0}} (and commas). Empty = absent, null, false, "" or [] (not 0). No unescaped output or partials.
- The markup draws in an isolated root: its CSS reaches only itself, :host is its box, sizes are border-box. A grid item without a height takes size.height.
- Example:
  { "render": "template",
    "props": { "type": "object", "required": ["level"], "properties": { "level": { "type": "number", "minimum": 0, "maximum": 100 } } },
    "template": "<div class=\\"tank\\" style=\\"--level: {{level}}\\"><div class=\\"fill\\"></div><b>{{level}}%</b></div>",
    "style": ".tank{position:relative;height:100%;border:2px solid var(--u-widget-border)} .fill{position:absolute;inset:auto 0 0 0;height:calc(var(--level) * 1%);background:var(--u-widget-primary)}",
    "size": { "width": 140, "height": 160 } }

## script
- Runs in <iframe sandbox="allow-scripts"> served by the board's server: an origin of its own, no cookies, no page access, no network (connect-src 'none').
- ub.onProps((props, appearance) => draw(props)) — called with the latest props and on every change; ub.reportError(error) shows on its box.
- Code must return: a loop running 1 s throws; other endless work loses its frame.
- A library is loaded from an origin in resources (e.g. a <script src> it adds, or import()), and only where the installation allows that origin.
- The frame is drawn from the saved board — save before checking it.`;

const COMPONENTS = `# Components (canvas)

Use one when the same group of parts — a frame, its widgets, the lines between them — is drawn twice or more (a card per
machine). A group drawn once: draw its parts directly. A card that is one picture filled with values is an element placed
per card (describe("elements")); a component is for a group whose parts are nodes of their own — each its own widget,
binding or states, or a line's end.

components = { "<name>": { params?, nodes, connectors?, decorations? } } — top level.
  params:      { type: "object", properties: { "<param>": { type, default? } }, required?: [...] } — as an element's props.
  nodes:       [{ id, x, y, width?, height?, caption?, widget, states? }] — no anchored; x, y from the component's own 0, 0.
  connectors:  between its own nodes. decorations: frames and texts, from its 0, 0.
instances  = [{ id, component, x, y, anchored, params: { "<param>": value } }] — draws the component with its 0, 0 at x, y.

- "{{param}}" in any text of its parts — a label, a prop, a caption, a binding's ref ("/machines/{{machine}}") — takes the
  instance's value. A text that is only "{{max}}" takes the value itself (a number stays a number). Declare every
  parameter its parts use; an instance gives a value to each one without a default, and nothing else.
- Each part an instance draws has the id "<instance id>/<part id>": a board connector joins it, a trigger or focus names
  it, board_state reports it ("press-2/temp"). No "/" in an instance's or a part's id.
- Change the component once to change every instance ("/components/<name>/nodes/0/width"); move an instance by its x, y.
  A part an instance draws is not edited on its own — give the component a parameter instead.
- An issue in a component is at its path there, naming the instance it was found for: "… — for the instance "b"
  (/instances/1)". look reports a drawn part the same way; look({ focus: "/instances/1" }) shows one instance.
- get_board answers components and instances as written; board_state and look answer the parts as drawn.`;

/** One part of the schema — and when there is nothing there, the pointers that do lead somewhere. */
function schemaPart(pointer: string): unknown {
  try {
    return getByPointer(documentSchema(), pointer);
  } catch {
    const defs = Object.keys((documentSchema() as { $defs?: Record<string, unknown> }).$defs ?? {});
    throw new Error(`nothing at ${pointer} in the schema — leave pointer out for the whole schema; its parts are under /$defs: ${defs.map(name => `/$defs/${name}`).join(', ')}`);
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
  if (topic === 'components') return COMPONENTS;
  if (topic === 'mixed') return MIXED;
  if (topic === 'schema') return pointer ? schemaPart(pointer) : documentSchema();
  if (topic === 'widgets') return widgetCatalog(query);
  if (topic.startsWith('widget:')) return widgetDetail(topic.slice('widget:'.length));
  throw new Error(`no topic "${topic}" — one of ${Object.keys(TOPICS).join(', ')}`);
}
