# API Reference

This is the reference for the domain layer's public surface — everything exported from the
package entry point (see the root [`README.md`](../README.md#domain-layer) for how to install it).
[`concepts.md`](concepts.md) explains what each of these terms *means*; this document gives the
concrete shapes and a runnable example so a consumer — human or automated — can implement an
`Adapter` and call `resolveDocument` without guessing.

## Walkthrough

A minimal end-to-end example: one `ViewDocument` with a single bound node, one `Adapter`
implementation, and the resolved result a renderer would consume. It is an ES module (the package
ships ESM only) using top-level `await` — save it as `walkthrough.mts`, or in a project with
`"type": "module"`, and run it with `npx tsx walkthrough.mts` (or plain `node` on a version that strips
TypeScript types by default).

```ts
import type { Adapter, ResolvedBinding, ViewDocument } from '@iyulab/u-board/domain';
import { resolveDocument } from '@iyulab/u-board/domain';

// 1. An Adapter resolves this system's own reference shape to a value + connection quality.
//    Nothing about `ref`'s shape is fixed by the core — each adapter defines and interprets it.
export class ExampleAdapter implements Adapter {
  readonly id = 'demo'; // matches the `adapter` field a Binding uses to select this Adapter

  async resolve(ref: unknown): Promise<ResolvedBinding> {
    const key = ref as string;
    if (key === 'pump-a.state') {
      return { value: 'running', quality: 'live' };
    }
    return { value: undefined, quality: 'disconnected' };
  }
}

// 2. A ViewDocument node whose widget has one bound prop (`data.value`) and one static prop
//    (`data.label`). `bindings` keys are dotted paths into `props` — resolution overwrites
//    that path's value, everything else in `props` passes through untouched.
export const doc: ViewDocument = {
  kind: 'canvas',
  background: {},
  nodes: [
    {
      id: 'pump-a',
      x: 0,
      y: 0,
      anchored: false,
      widget: {
        type: 'status',
        props: { data: { label: 'Pump A' } },
        bindings: { 'data.value': { adapter: 'demo', ref: 'pump-a.state' } },
      },
    },
  ],
  connectors: [],
};

// 3. resolveDocument runs every node's bindings against the given adapters and returns a
//    ResolvedViewDocument — the same document shape, but every node's `widget` is now a
//    ResolvedWidget: its bound props carry resolved values, and a `quality` map records how
//    current each bound prop is.
export const resolved = await resolveDocument(doc, [new ExampleAdapter()]);

const [pumpA] = resolved.nodes;
console.log(pumpA?.widget.props); //   { data: { label: 'Pump A', value: 'running' } }
console.log(pumpA?.widget.quality); // { 'data.value': 'live' }
```

This exact file also lives at [`packages/core/src/examples/walkthrough.ts`](../packages/core/src/examples/walkthrough.ts),
where a test (`walkthrough.test.ts`) re-runs it and asserts on the two values printed above — so if a future change to
`resolveDocument`'s behavior or this package's exports makes either wrong, that test fails instead of
this page silently drifting. A second test in the same file checks this code block is byte-identical
to that source file, so the two can't quietly diverge from each other either.

## Types

### `Adapter`

```ts
interface Adapter {
  readonly id: string;
  resolve(ref: unknown): Promise<ResolvedBinding>;
  references?(): Promise<readonly AdapterReference[]>;
  readonly attribution?: Attribution;
}

interface AdapterReference {
  ref: string;
  label?: string;
}

interface Attribution {
  text: string;
  url?: string;
}
```

- `id` — matched against a [`Binding`](#binding)'s `adapter` field to select which `Adapter`
  resolves it. A document can list bindings for several adapters; `resolveDocument` is given all
  of them and routes each binding by this id.
- `resolve(ref)` — resolves one binding's opaque `ref` to its current value. `ref` is whatever the
  `Binding` that pointed at this adapter put there — the core places no constraint on its shape;
  an adapter is free to expect a string, an object, anything its own integration needs. Returning
  a rejected promise (a thrown error, a network timeout) is a valid outcome — `resolveWidget`
  treats it the same as no matching adapter: the prop is left unresolved and its quality is
  recorded as `disconnected`. One binding's adapter failing never fails the others. To say *why*
  a binding has no value, return `{ value: undefined, quality: 'disconnected', reason }` instead of
  rejecting: the reason reaches the renderer, and the widget keeps its static value.
  The core does not look inside the source's answer — only the adapter knows whether the value a
  `ref` points at was there, so reporting `address` when it was not is the adapter's job.
- `references()` — optional: the references this adapter resolves, for an adapter with a known set
  of them (a sample's keys, the fields of a store in the host app, a broker's topics). The binding
  form of `AuthoringView` then offers them to pick from, shown by `label` when given, and binds the
  chosen `ref` string. Without it, the form takes an HTTP connector reference — a request path and a
  JSON Pointer into the response. It plays no part in resolving.
- `attribution` — optional: how the adapter's source asks to be credited where its data is shown
  (an agency and its open-data portal, a weather service — a license often makes it a condition of
  use). `ViewerPage`, and `AuthoringView` in view mode, name the credit of every adapter a board's
  bindings use, once each, on a line under the board; `url` becomes a link when it is http(s).
  `ViewerPage`'s `attribution={false}` leaves the line out, for a host that shows it itself.

### `ResolvedBinding`

```ts
interface ResolvedBinding {
  value: unknown;
  quality: ConnectionQuality;
  reason?: QualityReason;
  observedAt?: string; // ISO 8601
}
```

What an `Adapter.resolve()` call returns — the current value, how current it is, and, when it is
not `live` and the adapter can tell, why. `reason` is ignored on a `live` reading. `observedAt`, when
the adapter knows it, is when `value` was obtained from the source: the time of this reading for
`live`, of the last successful one for `stale` — what tells a last-known value of seconds ago from
one of days ago. It is ignored on a `disconnected` reading. The hosted HTTP connector reports it —
the time the source gives when the binding's reference names one ([`HttpRef`](#httpref)), else the
time it read the source.

### `ConnectionQuality`

```ts
type ConnectionQuality = 'live' | 'stale' | 'disconnected';
```

- `live` — the adapter reached the source system just now.
- `stale` — the value shown is not current: the adapter could not reach the source and shows a
  previously-live value as last-known, or the source answered with its latest value and that is older
  than the binding expects of it (reason `lagging`).
- `disconnected` — no value has been reached (no matching adapter, the adapter rejected, the
  source could not be reached, or it answered without the value the binding points at).

This is deliberately narrower than a full alarm model (priority, acknowledgement, shelving) — see
[`concepts.md`](concepts.md) ("Binding"). A `stale` reading only ever comes from the adapter itself;
`resolveWidget` has no memory of past calls and cannot infer staleness on its own — an adapter that
wants to report `stale` must track "have I seen this value before, and can I still reach the
source" itself.

### `QualityReason`

```ts
type QualityReason = 'transport' | 'auth' | 'address' | 'format' | 'throttled' | 'lagging';
```

Why a binding is not `live`, reported by the adapter when it can tell. Each names a different fix,
so an operator reading "disconnected" knows where to look:

- `transport` — the source could not be reached (network, timeout, server error).
- `auth` — the source refused the credentials.
- `address` — the source answered, but not with what the binding points at (an unknown path, an
  empty result, a renamed field). The binding needs attention, not the network.
- `format` — the source answered in a form the binding cannot read: XML or HTML where JSON was needed,
  or a value path into plain text. How the source is asked needs attention (many APIs answer JSON only
  when asked, with a parameter such as `returnType=json`).
- `throttled` — requests are being rate limited.
- `lagging` — the source answered, but its latest value is older than the binding expects of it (the
  HTTP connector's `maxAgeSeconds`): the source has stopped or fallen behind updating — neither the
  network nor the binding needs attention.

A reason annotates `quality`; it never changes it. A binding with no matching adapter, or whose
adapter rejected, carries no reason — the core cannot tell a misconfiguration from a host that
simply did not provide that adapter.

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

The words the shipped renderer uses, for a host that renders its own UI from a `ResolvedWidget`.
`worstQuality` is the least current of a widget's bindings (`disconnected`, then `stale`, then
`live`). `describeQuality(widget)` is one line of text for a `ResolvedWidget` — the renderer's
tooltip and screen-reader announcement — or `undefined` when every binding is `live`. It names the
cause when the adapter reported one and, for a `stale` value with an `observedAt`, how long ago it
was obtained:

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

The age is measured when the text is built (`now`, default `Date.now()`), so text that stays on
screen should be rebuilt as the widget re-resolves — the shipped components do on every refresh.
When several bindings are at fault, the text breaks them out per prop path, separated by `;`.

`observedAt` is stamped on the source's side, so the age is only as right as the two clocks agree.
On a machine whose clock may drift (a screen left running unattended), measure against the source's
clock instead: the shipped components take it as `clock` (`ViewerPage`, `AuthoringView`), and
`toCanvasKit` as `now`.

```ts
interface ServerClock {
  now: () => number; // the server's current time; this machine's until a response has carried a Date
  observe: (response: { headers: { get(name: string): string | null } }, sentAt: number) => void;
}
function serverClock(): ServerClock;
```

`serverClock()` estimates a server's clock from the `Date` header of its responses (RFC 9110): hand
it each response with the `Date.now()` the request was sent at, and pass `now` on as the clock. A
response without a readable `Date` changes nothing — a cross-origin response does not expose it
unless the server lists it in `Access-Control-Expose-Headers`.

`live` has no label on purpose: normal operation is not announced, only departures from it.

The shipped renderer also marks a node whose headline value is not current with a few visible words on
a tag just above its frame — for a screen nobody hovers over or listens to, such as a wall display. They come from
`brief`: the cause when the adapter reported one (`brief.reason` — "Source behind" for `lagging`, "No
reply from source" for `transport`), else the state (`brief.quality`), and for a `stale` value how long
ago it was obtained — "Source behind · 3 minutes ago". The frame's style shows how current the value is;
the mark says why, because the cause decides whom an operator calls. Assistive technology hears the full
`describeQuality` text instead.

Pass `text` to describe quality in another language; it defaults to `DEFAULT_QUALITY_TEXT`.
`ageText(locale)` builds the `age` words from the platform's relative-time formatting
(`Intl.RelativeTimeFormat`) — `ageText('ko')` reads "5분 전". The
shipped components take the same words through their `labels` prop (`labels.qualityText`).

### `Binding`

```ts
interface Binding {
  adapter: string;
  ref: unknown;
  map?: ValueMap;
}

interface ValueMap {
  values?: Record<string, unknown>;
  ranges?: ValueRange[];
  otherwise?: unknown;
}

interface ValueRange {
  min?: number;
  max?: number;
  value: unknown;
}
```

- `adapter` — the `id` of the `Adapter` that should resolve this binding.
- `ref` — the adapter-specific reference to a value (for example, an asset id and field name).
  Opaque to the core binding surface; each adapter defines and interprets its own `ref` shape.
- `map` — translates the source's value into the one the prop takes. A data source speaks its own
  vocabulary (`"Fault"`, `3`, a temperature); a widget prop takes its own (a status widget's level).
  It is tried in order:
  1. `values` — a source value is looked up by its text (`"Fault"`, `"3"`, `"true"`, `"null"`).
  2. `ranges` — a number, or text that reads as one (`"92.5"`), takes the first range it falls in:
     from `min` up to but not including `max`, so adjacent ranges meet without overlapping. A missing
     bound leaves that end open; a range gives at least one.
  3. `otherwise` — or, when there is none, the value passes through unchanged.

  A map has `values`, `ranges` or both. It applies to a value that is shown (`live` or `stale`),
  before it reaches the prop. `applyValueMap(map, value)` is the same lookup for a host's own code.

Bind the same source field twice to show it and color by it — the raw value as the text, the mapped
one as the level (a `status` widget draws an item only when it has a `label`, so the label is set as a
static prop):

```ts
props: { data: { label: 'Pump A' } },
bindings: {
  'data.value': { adapter: 'plant', ref: { path: '/pumps/a', valuePath: '/status' } },
  'data.level': {
    adapter: 'plant',
    ref: { path: '/pumps/a', valuePath: '/status' },
    map: { values: { Running: 'success', Fault: 'error' }, otherwise: 'neutral' },
  },
}
```

A measurement becomes a level the same way, by bands — a bearing temperature that warns from 70 and
alarms from 80:

```ts
'data.level': {
  adapter: 'plant',
  ref: { path: '/pumps/a', valuePath: '/bearingTemp' },
  map: { ranges: [{ min: 80, value: 'error' }, { min: 70, max: 80, value: 'warning' }], otherwise: 'neutral' },
}
```

### `HttpRef`

```ts
interface HttpRef {
  path: string;
  item?: { list: string; where: Record<string, string | number | boolean> };
  valuePath?: string;
  observedAtPath?: string;
  timeZone?: string;
  maxAgeSeconds?: number;
}
```

The reference the hosted HTTP connector reads, and the one the authoring view's binding form writes
for an adapter that lists no references of its own. Implement this shape to have the form fill it in.

- `path` — the request, relative to the connector's base URL: a path starting with a single `/`,
  with its query.
- `item` — one element of the list at the JSON Pointer `list`: the first whose fields equal every one
  in `where` (`"12"` and `12` match). Sources reorder their lists, so a position would name another
  element.
- `valuePath` — an RFC 6901 JSON Pointer to the value, inside `item` when there is one, else inside
  the whole response. Absent or `''`: the whole of it.
- `observedAtPath` — a JSON Pointer, read where `valuePath` is, to the time the source says it
  observed the value. A source that publishes its readings on a schedule says how old they are this
  way: an hourly measurement fetched at :50 is fifty minutes old. Absent, or the field empty: the
  value counts as observed when it was read.
- `timeZone` — the IANA time zone (`Asia/Seoul`) a time without an offset is in. Absent: UTC.
- `maxAgeSeconds` — how old the source's value may normally be and still be current, as HTTP's
  `max-age` says of a response. A source that publishes on a schedule, and late, has values that are
  always some minutes old: an hourly measurement published forty minutes after the hour is up to two
  hours old before the next one arrives. Older than this by the observed time, the reading is `stale`
  with reason `lagging` — the source's latest, but behind. It also spaces the source's requests: a read
  answers later resolves of the same request for an eighth of it (at least the installation's reuse
  window), which spends a daily request quota that much more slowly. Absent: no age limit.

The observed time is read as epoch seconds or milliseconds (a number, or a string of 10 or 13
digits), ISO 8601 and the variations sources write (`2026-10-09 19:10`, `2026.10.09`, a missing
offset, or an offset in hours alone such as `+09`), or compact digits (`202610091900`, `20261009 1910`,
`20261009` — also when written as a number). A field that holds
something else makes the binding `disconnected` with reason `format`; a time more than five minutes
after the read does too, since a source cannot have observed it yet — the usual cause is a missing
`timeZone`.

`readHttpRef(body, ref, readAt, now?)` is that reading of a parsed response — the value, its observed
time (epoch ms) and whether it is `lagging` at `now` (the read, by default), or why it failed (`address`: the response lacks what the reference names; `format`:
it has it in a form the reference cannot read). `resolvedReading(reading)` turns a reading that found its
value into the binding's result — `live`, or `stale` with reason `lagging` — so every reader of a reference
reports it alike. `isHttpRef(ref)` checks the shape, and `parseSourceTime(raw, timeZone?)` reads one time.
All are exported from `@iyulab/u-board/domain`.

### `Widget`

```ts
interface Widget {
  type: string;
  props?: Record<string, unknown>;
  bindings?: Record<string, Binding>;
}
```

- `type` — identifies which widget kind to render (for example, a specific
  [`@iyulab/u-widgets`](https://github.com/iyulab/u-widgets) element). Opaque to U-Board — it is
  passed through to the renderer without interpretation.
- `props` — static configuration in whatever shape that widget kind expects. The shipped renderer
  passes `{ widget: type, ...props }` to u-widgets — the
  [package README](../packages/core/README.md#widgets) lists the widgets the authoring UI offers and
  their props.
- A `type` of `element:<name>` places an element the document defines under `elements` (below):
  U-Board draws it itself, and `props` are what its definition's props schema describes.
- `bindings` — a map from a dotted path into `props` (e.g. `'data.value'`, or a nested path like
  `'data.status'`, or an array element like `'items.1.value'`) to a `Binding`. At resolution time,
  each entry's resolved value is written into `props` at that path — copying, never mutating, the
  objects and arrays along the way — so the same static `props` object safely provides defaults for
  any key that isn't bound, or whose binding is `disconnected`.

### `ViewDocument` — `CanvasView` or `GridView`

`ViewDocument` is a union told apart by `kind`. Narrow it before reading a kind's fields:

```ts
if (doc.kind === 'canvas') doc.nodes;   // CanvasView: background, nodes, connectors, decorations
else doc.items;                         // GridView: items in order, each a GridItem
```

Both kinds place a `Placed` — `{ id, widget }`: a canvas `Node` adds a position, a `GridItem` adds the
room it takes (`span` 1–12, absent 4; `spanMedium` 1–6 for a medium-width board, absent half of
`span` rounded up; `height` in pixels, absent the widget's own). `placedIn(doc)` returns every placed
widget of either kind, resolved or not — the walk to use for anything that looks at every binding.
`resolveDocument` returns the same kind it is given (`ResolvedCanvasView`, `ResolvedGridView`).
`emptyViewDocument(kind)` is a document of either kind with nothing on it yet. `ViewerPage` shows either kind and
`AuthoringView` edits either (`onSave` receives a `ViewDocument`); importing
a document of the other kind in the editor opens it in that kind's editor.

`validateViewDocument` checks either kind, and ids are unique across the whole document. The same
rules, apart from those its description names (id uniqueness, element references and props, the
markup policy), are published as a JSON Schema (2020-12): `@iyulab/u-board/view-document.schema.json`.

### Elements — `ElementDefinition`

```ts
interface ElementDefinition {
  render: 'template' | 'script';
  props?: PropsSchema;        // a JSON Schema object schema, in the subset below
  template?: string;          // render: 'template' — HTML or SVG with {{values}}
  script?: string;            // render: 'script'
  style?: string;             // CSS for its own markup only
  size?: { width: number; height: number };
  resources?: string[];       // https origins it loads from, e.g. 'https://cdn.example.com'
}
```

Either kind of view may carry `elements: Record<string, ElementDefinition>` — names of lowercase
letters, digits and hyphens. A widget `{ type: 'element:pump', props: { state: 'run' } }` places one.

```ts
elements: {
  pump: {
    render: 'template',
    props: { type: 'object', required: ['state'], properties: { state: { enum: ['run', 'stop', 'fault'] }, rpm: { type: 'number' } } },
    template: '<svg viewBox="0 0 64 64"><circle class="{{state}}" cx="32" cy="32" r="26"/></svg><p>{{rpm}} rpm</p>',
    style: '.run { fill: var(--u-widget-positive) } .fault { fill: var(--u-widget-negative) }',
    size: { width: 140, height: 160 },
  },
}
```

- **Template values** — logic-less: `{{name}}` (a dotted path into the props, every value escaped),
  `{{#list}}…{{/list}}` (repeated for each item, or shown once for any other truthy value; inside it
  a name is looked up in the item first and `{{.}}` is the item itself), `{{^flag}}…{{/flag}}` (shown
  when empty or false), `{{! comment}}`. There is no unescaped output and no partial. Numbers become
  a drawing through CSS: `style="--level: {{level}}"` and `height: calc(var(--level) * 1%)`.
- **Markup policy** — HTML text and structure tags, `img`, and SVG shapes, text, gradients, patterns,
  symbols and filters. No `script`, `style`, `iframe`, `a`, form or `foreignObject`; no event handler
  attribute; a URL (`href`, `src`, CSS `url()`) only to a fragment of the markup (`#id`), an inline
  image (`data:image/…`) or an origin in `resources`; no `@import`. The renderer applies the same
  policy again after filling the values, so a value cannot add what the template did not.
- **Theme** — the board's tone reaches the markup as CSS variables: `--u-widget-bg`, `--u-widget-surface`,
  `--u-widget-text`, `--u-widget-text-secondary`, `--u-widget-border`, `--u-widget-primary`, `--u-widget-positive`,
  `--u-widget-negative`, `--u-widget-warning`, `--u-widget-font-family`, `--u-widget-font-mono`.
- **Props schema** — the keywords `type`, `enum`, `const`, `properties`, `required`, `items`,
  `minimum`, `maximum`, `minLength`, `maxLength`, `title`, `description` and `default`; any other is
  an error. A placed element's static props are checked against it; a prop a binding fills is
  taken as given.
- **Size** — in a grid, an item placing the element takes `size.height` when it gives none. On a
  canvas the node's box is the layout, and the element fills it.
- **Origins** — an element reaches an origin only when it lists it in `resources` and the host
  allows it: `ViewerPage`'s `elementOrigins` (none by default). A U-Board server sends the origins its
  installation allows with every board (`elementOrigins` in the board's answer, from
  `UBOARD_ELEMENT_ORIGINS`).

**Script elements** run in a frame of their own: `<iframe sandbox="allow-scripts">`, whose document the
board's server builds from the saved definition. The frame has an origin of its own — it cannot reach
the page, its storage or the viewer's session — and no network (`connect-src 'none'`): its data arrives
as its props, through the board's bindings like any widget's. Its code reads them through `ub`:

```js
ub.onProps((props, appearance) => draw(props));   // now, if props have arrived, and on every change
ub.reportError(error);                             // shown on the element's box
```

The board's theme is set on the frame's root as the same `--u-widget-*` variables; an uncaught error,
or a load its policy blocks, is reported on the element's box as well. The frame loads when the element
nears the screen. The page asks a running frame every two seconds whether it still answers, and removes one
that has left a question unanswered for six seconds — code that never yields, such as a loop that never ends —
with a notice on its box. That keeps the page usable where the browser runs the frame in a process of its own, as
Chrome and Edge do with site isolation; a browser that runs it with the page (Firefox, Safari) is held by such code
too. Either way the code keeps running in the browser until it is restarted, and the board's other script elements,
which share its process, stop answering as well — so an element's code must always return. The console opens a
board without running its script elements at `…/boards/<id>/edit?scripts=off`, to fix such code. `ViewerPage`'s and `AuthoringView`'s `elementFrames` says where the frames are served —
`/api/element-frames/<board id>` on a U-Board server, which answers
`/api/element-frames/<board id>/<element>/<definition hash>` (`elementDefinitionHash`) only while the
saved board defines that element exactly so. Without `elementFrames`, a script element shows a notice in
its box; an element edited in the editor is drawn again once the board is saved.

### `Node`, `Connector`, `Background`, `Shape`

These carry no resolution logic — see [`concepts.md`](concepts.md) for what each represents, and
the exported TypeScript types themselves for the exact fields (`Node.anchored`,
`Connector.fromNodeId`/`toNodeId`, `Background.image`, `Shape` (`RectShape`/`TextShape`, the
`decorations` array's element type), `CanvasView.kind`/`nodes`/`connectors`/`decorations`/`appearance`).
They are included in the walkthrough above for context, not repeated field-by-field here since
none of them have a resolution-time contract to document.

### Anchors and reference points

```ts
interface BackgroundImage {
  src: string;
  width: number;
  height: number;
  referencePoints?: [ReferencePoint, ReferencePoint];
}

interface ReferencePoint {
  x: number; // a point of the image, in scene units
  y: number;
  coordinate: { x: number; y: number }; // what it stands for
}
```

A background image can declare two of its points and the coordinates they stand for in the space it
depicts — a floor plan's metres, a map's longitude and latitude. An anchored node's place is then a
coordinate: its anchor is the center of its box (default-sized when it has none), read through the two
points.

- `coordinateOf(background, node)` — the coordinate a node is anchored at.
- `placeAt(background, node, coordinate)` — where a node goes (`x`/`y`) for its anchor to be at a
  coordinate.

Each returns `null` for a background without reference points. Each axis maps linearly between the two
points, which differ on both axes in the image and in their coordinates (`validateViewDocument` checks
it). U-Board does not interpret what the image depicts, and so applies no projection: an image drawn in
a projection (a web map in Mercator, say) is read in that projection's coordinates, and a small area —
a site, a few city blocks — is flat enough to draw in longitude and latitude directly. The node stores
its scene `x`/`y` as before, so a renderer needs none of this.

### `resolveDocument(doc, adapters)`

```ts
function resolveDocument(
  doc: ViewDocument,
  adapters: readonly Adapter[]
): Promise<ResolvedViewDocument>;
```

The single entry point a renderer calls to go from a saved `ViewDocument` to something paintable.
Resolves every widget's bindings — and on a canvas board every connector's (`resolveConnector`) — against the given
`adapters` and returns a `ResolvedViewDocument` — it has no opinion on canvas-kit, u-widgets, or any other rendering
concern (see [`architecture.md`](architecture.md)).

A connector binds its `label` and `style` (`CONNECTOR_BINDABLE`: `label`, `style.stroke`, `style.strokeWidth`,
`style.dash`, `style.arrow`) with the same binding shape as a widget's. A value is taken only in the form its path
draws — a label as text (a number as it reads), a width as a positive number, a dash as one of `CONNECTOR_DASHES`, an
arrow as one of `CONNECTOR_ARROWS`, a colour as text — otherwise the static value stays, as for a disconnected
binding. A resolved connector carries `quality` per
bound path.

`bindingsIn(doc)` yields every binding a document declares, widgets' and connectors', with the JSON Pointer of what
it fills — the one walk for whatever needs to know what a board reads.

### `ResolvedViewDocument` / `ResolvedNode` / `ResolvedWidget`

```ts
interface ResolvedViewDocument extends Omit<ViewDocument, 'nodes'> {
  nodes: ResolvedNode[];
}

interface ResolvedNode extends Omit<Node, 'widget'> {
  widget: ResolvedWidget;
}

interface ResolvedWidget {
  type: string;
  props: Record<string, unknown>;
  quality: Record<string, ConnectionQuality>;
  reasons?: Record<string, QualityReason>;
  observedAt?: Record<string, string>;
}
```

`resolveDocument`'s return value: the same document shape, with every node's `widget` replaced by
a `ResolvedWidget`. `background` and `connectors` pass through unchanged — they carry no bindings.

- `ResolvedWidget.type` — carried through unchanged from the source `Widget`.
- `ResolvedWidget.props` — the widget's static `props` merged with every binding whose reading has
  a value to show (`live`, or `stale` with its last-known value), at the dotted path each `Binding`
  named. A `disconnected` reading is never merged, even if the adapter returned a `value`.
- `ResolvedWidget.quality` — connection quality per bound prop path. A key is present only for
  props that had a binding; a static-only prop carries no entry, since quality doesn't apply to
  it. This is what a renderer reads to show an operator which values are live, stale, or
  disconnected — see [`architecture.md`](architecture.md) for how the shipped renderer does this.
- `ResolvedWidget.reasons` — the `QualityReason` per bound prop path, for bindings whose adapter
  reported one on a non-`live` reading. Absent when none did.
- `ResolvedWidget.observedAt` — when each `live` or `stale` value was obtained from its source,
  per bound prop path, for bindings whose adapter reported it. Absent when none did.

### `resolveWidget(widget, adapters)`

```ts
function resolveWidget(widget: Widget, adapters: readonly Adapter[]): Promise<ResolvedWidget>;
```

The single-widget building block `resolveDocument` calls once per node. Exported directly for a
consumer that resolves widgets outside the `ViewDocument`/`resolveDocument` flow (for example, a
custom renderer resolving one widget at a time).

## Reading and checking documents

A `ViewDocument` that comes from outside your own code — a file the author picked, a request
body — should be checked before anything renders it. These functions do that, and the hosted
server applies the same check to every document it stores.

### `validateViewDocument(value, options?)`

```ts
interface ViewDocumentIssue { path: string; message: string }
function validateViewDocument(value: unknown, options?: { strict?: boolean }): ViewDocumentIssue[];
```

`validateViewDocument` checks every field the `ViewDocument` type promises — nodes, each widget
and binding, connectors, decorations, the background — and returns every problem it finds, each
located by an RFC 6901 JSON Pointer into the value
(`""` is the value itself). An empty array means the value is a valid document.

It checks structure, and the elements the document defines: a binding's `ref` belongs to its adapter
and a prepared widget's `type`/`props` (and the values a binding's `map` gives) to its widget library,
so their contents are not inspected. A connector joins two nodes the document has. Fields it does not
know are ignored, so a document written by a newer version still opens. An element definition
is held to the element contract (markup policy, props schema subset, `resources` origins), and a
widget of type `element:<name>` must name a defined element and give props its schema accepts —
each problem with what to do instead where there is something to say:

```ts
// → [{ path: '/elements/pump/template', message: '<script> is not allowed in a template — a template runs no script — use render: "script" for code' }]
```

```ts
validateViewDocument({
  kind: 'canvas', background: {}, connectors: [],
  nodes: [{ id: 'n1', x: 0, y: 0, anchored: false, widget: { type: 'gauge', bindings: { value: null } } }],
});
// → [{ path: '/nodes/0/widget/bindings/value', message: 'expected a binding object ({ adapter, ref })' }]
```

**`strict`** is for a document about to be written — the hosted server saves with it, and so does the MCP server's
`validate`. It also refuses what this version would keep but never draw: a field the format does not have — the
issue names the fields that place has — and a decoration colour outside the forms every canvas reads: hex
(`#1f6feb`, `#1f6feb33`), `rgb()`/`rgba()`, `hsl()`/`hsla()`, a CSS colour name, `transparent`, or `none` (paint
nothing, the same as leaving the field out). A CSS variable is refused — a canvas has no stylesheet to resolve it.

```ts
validateViewDocument(doc, { strict: true });
// → [{ path: '/connectors/0/color', message: 'a connector has no "color" — it would be kept but never drawn. A connector has: id, fromNodeId, toNodeId, label, labelAt, style, bindings. …' }]
```

### `lintViewDocument(doc)`

```ts
interface ViewDocumentAdvice { path: string; message: string }
function lintViewDocument(doc: ViewDocument): ViewDocumentAdvice[];
```

Advice on a valid document — none of it stops it being saved or drawn. On a canvas board, first where parts would
be drawn over one another: two nodes whose boxes overlap (a node without a size counts at 160 × 100), a text
decoration under a node (nodes draw over decorations), a connector running through a text, two texts running into
each other — a text's box estimated as one line, 0.6 × its font size per character. At most ten of these, then one
line saying how many more. Then an element defined but placed
nowhere, more than 30 script elements on one board (each runs in a frame of its own), an element whose
markup, script and CSS together pass 32 KB.

### `parseViewDocument(text)` / `InvalidViewDocumentError`

```ts
function parseViewDocument(text: string): ViewDocument;
class InvalidViewDocumentError extends Error { readonly issues: ViewDocumentIssue[] }
```

Parses JSON **text** (for example a file's contents — not an already-parsed object) and validates
it. Throws `InvalidViewDocumentError` when the text is not JSON or the result is not a valid
document; the message names the first problem, and `issues` lists them all.
