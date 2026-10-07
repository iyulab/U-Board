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
one of days ago. It is ignored on a `disconnected` reading. The hosted HTTP connector reports it.

### `ConnectionQuality`

```ts
type ConnectionQuality = 'live' | 'stale' | 'disconnected';
```

- `live` — the adapter reached the source system just now.
- `stale` — the adapter could not reach the source, but is showing a previously-live value as
  last-known.
- `disconnected` — no value has been reached (no matching adapter, the adapter rejected, the
  source could not be reached, or it answered without the value the binding points at).

This is deliberately narrower than a full alarm model (priority, acknowledgement, shelving) — see
[`concepts.md`](concepts.md) ("Binding"). A `stale` reading only ever comes from the adapter itself;
`resolveWidget` has no memory of past calls and cannot infer staleness on its own — an adapter that
wants to report `stale` must track "have I seen this value before, and can I still reach the
source" itself.

### `QualityReason`

```ts
type QualityReason = 'transport' | 'auth' | 'address' | 'throttled';
```

Why a binding is not `live`, reported by the adapter when it can tell. Each names a different fix,
so an operator reading "disconnected" knows where to look:

- `transport` — the source could not be reached (network, timeout, server error).
- `auth` — the source refused the credentials.
- `address` — the source answered, but not with what the binding points at (an unknown path, an
  empty result, a renamed field). The binding needs attention, not the network.
- `throttled` — requests are being rate limited.

A reason annotates `quality`; it never changes it. A binding with no matching adapter, or whose
adapter rejected, carries no reason — the core cannot tell a misconfiguration from a host that
simply did not provide that adapter.

### Describing connection quality

```ts
const QUALITY_LABEL: Partial<Record<ConnectionQuality, string>>; // stale, disconnected
const REASON_LABEL: Record<QualityReason, string>;
interface QualityText {
  quality: Partial<Record<ConnectionQuality, string>>;
  reason: Record<QualityReason, string>;
  age: (elapsedMs: number) => string;
}
const DEFAULT_QUALITY_TEXT: QualityText; // { quality: QUALITY_LABEL, reason: REASON_LABEL, age: ageText('en') }
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
- `bindings` — a map from a dotted path into `props` (e.g. `'data.value'`, or a nested path like
  `'data.status'`, or an array element like `'items.1.value'`) to a `Binding`. At resolution time,
  each entry's resolved value is written into `props` at that path — copying, never mutating, the
  objects and arrays along the way — so the same static `props` object safely provides defaults for
  any key that isn't bound, or whose binding is `disconnected`.

### `Node`, `Connector`, `Background`, `Shape`, `ViewDocument`

These carry no resolution logic — see [`concepts.md`](concepts.md) for what each represents, and
the exported TypeScript types themselves for the exact fields (`Node.anchored`,
`Connector.fromNodeId`/`toNodeId`, `Background.image`, `Shape` (`RectShape`/`TextShape`, the
`decorations` array's element type), `ViewDocument.kind`/`nodes`/`connectors`/`decorations`).
They are included in the walkthrough above for context, not repeated field-by-field here since
none of them have a resolution-time contract to document.

### `resolveDocument(doc, adapters)`

```ts
function resolveDocument(
  doc: ViewDocument,
  adapters: readonly Adapter[]
): Promise<ResolvedViewDocument>;
```

The single entry point a renderer calls to go from a saved `ViewDocument` to something paintable.
Resolves every node's widget bindings against the given `adapters` and returns a
`ResolvedViewDocument` — it has no opinion on canvas-kit, u-widgets, or any other rendering
concern (see [`architecture.md`](architecture.md)).

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

### `validateViewDocument(value)` / `isViewDocumentShape(value)`

```ts
interface ViewDocumentIssue { path: string; message: string }
function validateViewDocument(value: unknown): ViewDocumentIssue[];
function isViewDocumentShape(value: unknown): value is ViewDocument;
```

`validateViewDocument` checks every field the `ViewDocument` type promises — nodes, each widget
and binding, connectors, decorations, the background — and returns every problem it finds, each
located by an RFC 6901 JSON Pointer into the value
(`""` is the value itself). An empty array means the value is a valid document;
`isViewDocumentShape` is that test as a type guard.

It checks structure only: a binding's `ref` belongs to its adapter and a widget's `type`/`props`
(and the values a binding's `map` gives) to its widget library, so their contents are not inspected; references between parts of a
document (a connector naming a node that is not there) are not judged; fields it does not know
are ignored.

```ts
validateViewDocument({
  kind: 'canvas', background: {}, connectors: [],
  nodes: [{ id: 'n1', x: 0, y: 0, anchored: false, widget: { type: 'gauge', bindings: { value: null } } }],
});
// → [{ path: '/nodes/0/widget/bindings/value', message: 'expected a binding object ({ adapter, ref })' }]
```

### `parseViewDocument(text)` / `InvalidViewDocumentError`

```ts
function parseViewDocument(text: string): ViewDocument;
class InvalidViewDocumentError extends Error { readonly issues: ViewDocumentIssue[] }
```

Parses JSON **text** (for example a file's contents — not an already-parsed object) and validates
it. Throws `InvalidViewDocumentError` when the text is not JSON or the result is not a valid
document; the message names the first problem, and `issues` lists them all.
