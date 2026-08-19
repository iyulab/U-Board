# API Reference

This is the reference for the domain layer's public surface — everything exported from the
package entry point (see the root [`README.md`](../README.md#domain-layer) for how to install it).
[`concepts.md`](concepts.md) explains what each of these terms *means*; this document gives the
concrete shapes and a runnable example so a consumer — human or automated — can implement an
`Adapter` and call `resolveDocument` without guessing.

## Walkthrough

A minimal end-to-end example: one `ViewDocument` with a single bound node, one `Adapter`
implementation, and the resolved result a renderer would consume.

```ts
import type { Adapter, ResolvedBinding, ViewDocument } from '@iyulab/u-board';
import { resolveDocument } from '@iyulab/u-board';

// 1. An Adapter resolves this system's own reference shape to a value + connection quality.
//    Nothing about `ref`'s shape is fixed by the core — each adapter defines and interprets it.
class DemoAdapter implements Adapter {
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
const doc: ViewDocument = {
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
const resolved = await resolveDocument(doc, [new DemoAdapter()]);

resolved.nodes[0].widget.props; //   { data: { label: 'Pump A', value: 'running' } }
resolved.nodes[0].widget.quality; // { 'data.value': 'live' }
```

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
  recorded as `disconnected`. One binding's adapter failing never fails the others.

### `ResolvedBinding`

```ts
interface ResolvedBinding {
  value: unknown;
  quality: ConnectionQuality;
}
```

What an `Adapter.resolve()` call returns — the current value plus how current it is.

### `ConnectionQuality`

```ts
type ConnectionQuality = 'live' | 'stale' | 'disconnected';
```

- `live` — the adapter reached the source system just now.
- `stale` — the adapter could not reach the source, but is showing a previously-live value as
  last-known.
- `disconnected` — no value has ever been reached (no matching adapter, the adapter rejected, or
  the source has never resolved).

This is deliberately narrower than a full alarm model (priority, acknowledgement, shelving) — see
[`concepts.md`](concepts.md#binding). A `stale` reading only ever comes from the adapter itself;
`resolveWidget` has no memory of past calls and cannot infer staleness on its own — an adapter that
wants to report `stale` must track "have I seen this value before, and can I still reach the
source" itself.

### `Binding`

```ts
interface Binding {
  adapter: string;
  ref: unknown;
}
```

- `adapter` — the `id` of the `Adapter` that should resolve this binding.
- `ref` — the adapter-specific reference to a value (for example, an asset id and field name).
  Opaque to the core binding surface; each adapter defines and interprets its own `ref` shape.

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
- `props` — static configuration in whatever shape that widget kind expects.
- `bindings` — a map from a dotted path into `props` (e.g. `'data.value'`, or a nested path like
  `'data.status'`) to a `Binding`. At resolution time, each entry's resolved value is written into
  `props` at that path — copying, never mutating, the objects along the way — so the same static
  `props` object safely provides defaults for any key that isn't bound, or that failed to resolve.

### `Node`, `Connector`, `Background`, `ViewDocument`

These carry no resolution logic — see [`concepts.md`](concepts.md) for what each represents, and
the exported TypeScript types themselves for the exact fields (`Node.anchored`,
`Connector.fromNodeId`/`toNodeId`, `Background.image`, `ViewDocument.kind`/`nodes`/`connectors`).
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
}
```

`resolveDocument`'s return value: the same document shape, with every node's `widget` replaced by
a `ResolvedWidget`. `background` and `connectors` pass through unchanged — they carry no bindings.

- `ResolvedWidget.type` — carried through unchanged from the source `Widget`.
- `ResolvedWidget.props` — the widget's static `props` merged with every binding that resolved
  successfully, at the dotted path each `Binding` named.
- `ResolvedWidget.quality` — connection quality per bound prop path. A key is present only for
  props that had a binding; a static-only prop carries no entry, since quality doesn't apply to
  it. This is what a renderer reads to show an operator which values are live, stale, or
  disconnected — see [`architecture.md`](architecture.md) for how the shipped renderer does this.

### `resolveWidget(widget, adapters)`

```ts
function resolveWidget(widget: Widget, adapters: readonly Adapter[]): Promise<ResolvedWidget>;
```

The single-widget building block `resolveDocument` calls once per node. Exported directly for a
consumer that resolves widgets outside the `ViewDocument`/`resolveDocument` flow (for example, a
custom renderer resolving one widget at a time).
