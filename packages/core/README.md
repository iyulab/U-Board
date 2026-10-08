# @iyulab/u-board

Spatial dashboard authoring middleware — the view document schema, the adapter contract for
binding widgets to external data, and the React authoring and viewing components built on them.

This is the library package of [U-Board](https://github.com/iyulab/U-Board). See the repository
README for what U-Board is for and what it deliberately is not.

## Install

```sh
npm install @iyulab/u-board react react-dom
```

`react` and `react-dom` (19.2 or later) are peer dependencies. The domain entry point below does not use
them at runtime, but npm installs peer dependencies by default. The package is ESM-only (`import`,
not `require`) and needs Node 22.12 or later.

## Entry points

| Import | Contents | Depends on React / canvas |
|---|---|---|
| `@iyulab/u-board/domain` | View document types, the `Adapter` contract, `resolveDocument`, `validateViewDocument`/`parseViewDocument`, connection-quality text (`describeQuality`) | No |
| `@iyulab/u-board/viewer` | Read-only `ViewerPage` and the `useResolvedDocument` hook | Yes |
| `@iyulab/u-board` | Everything in `domain`, plus `AuthoringView` and `ViewerPage` | Yes |
| `@iyulab/u-board/demo` | `DemoAdapter` (id `demo-cmms`), fixed sample values for refs `pump-a.state`, `pump-a.load` (live) and `pump-b.state` (stale), which it lists through `references()`; any other ref is disconnected | No |

Code that only reads or writes view documents, or implements an adapter for an external system,
should import from `@iyulab/u-board/domain` so it never pulls in the rendering stack.

## Implementing an adapter

An adapter resolves the binding references stored in a view document against a data source U-Board
does not own. The view document stores only the reference; the adapter decides what it means.

```ts
import { resolveDocument, type Adapter, type ViewDocument } from '@iyulab/u-board/domain';

const doc: ViewDocument = { kind: 'canvas', background: {}, nodes: [], connectors: [] };
const adapters: Adapter[] = [/* your Adapter implementations */];

const resolved = await resolveDocument(doc, adapters);
```

## Showing a board

`ViewerPage` renders a view document read-only. Without `width`/`height` it fills its parent and
follows its size, so give the parent a definite height:

```tsx
import { ViewerPage } from '@iyulab/u-board/viewer';

<div style={{ height: '100vh' }}>
  <ViewerPage initialDocument={doc} adapters={adapters} pollIntervalMs={30_000} />
</div>;
```

The board opens fitted into view — shrunk to fit, never magnified past its natural size — and stays
fitted as the view resizes until the viewer pans or zooms; a "Fit to view" control restores that,
and zoom in/out controls do what the wheel does from the keyboard. Pass `width`/`height` (CSS px) for a
fixed-size view instead.

With `pollIntervalMs` the board re-reads its bindings on that interval — and within a few seconds when
the page is shown again after a hidden tab or a sleeping machine — and is made to be left open on a
screen: it shows the time its values were last updated, and when no update (a result in which some
value arrived) has come for two intervals it says so prominently (an announced status) and shows
every value as last known (`stale`) rather than current. `useResolvedDocument` reports the same
through `resolvedAt` and `stalled` for a host that renders its own view.

How long ago a value was obtained is measured against `clock` (default `Date.now`). Its
`observedAt` comes from the source's side, so on a screen whose own clock may drift, pass a clock
set by the server's: `serverClock()` follows the `Date` of the responses you hand it.

```tsx
import { ViewerPage, serverClock } from '@iyulab/u-board/viewer';

const clock = serverClock();
// in your adapter: const sentAt = Date.now(); const res = await fetch(…); clock.observe(res, sentAt);
<ViewerPage initialDocument={doc} adapters={adapters} pollIntervalMs={30_000} clock={clock.now} />;
```

`AuthoringView` sizes the same way: without `width`/`height` the editor and its live preview split
the parent's width and fill its height. Both share one pan/zoom and the document opens fitted into
view the same way; a new node or decoration is placed where the author is looking. In the editor,
drag across empty space to select several items and drag one of them to move them all; pan with
Space + drag or the middle mouse button, or from the keyboard (arrow keys move the selection, or
pan when nothing is selected; Tab steps through the items). In the live preview a drag pans. The
wheel zooms either.

### Text in another language

The components show English text by default. Pass `labels` — any subset of `UBoardLabels`, the
rest stays English — to show your own; `DEFAULT_LABELS` lists every key with its English text.
`labels.qualityText` holds the words for connection quality (the node tooltip and screen-reader
announcement), and `labels.time` writes the time of day — `timeText(locale)` builds one.

Korean ships with the package as `KO_LABELS`, every key included; lay your own words over it as
over the English:

```tsx
import { ViewerPage, KO_LABELS } from '@iyulab/u-board/viewer';

<ViewerPage initialDocument={doc} adapters={adapters} labels={KO_LABELS} />;
<ViewerPage initialDocument={doc} adapters={adapters} labels={{ ...KO_LABELS, boardRegion: '2라인 펌프실' }} />;
```

## Widgets

A node's widget is drawn by [`@iyulab/u-widgets`](https://github.com/iyulab/u-widgets): the renderer
hands it the spec `{ widget: widget.type, ...widget.props }`. So `type` is a u-widgets widget name
and `props` is the rest of that widget's u-widgets spec (`data`, `mapping`, `options`) — any widget
u-widgets renders works, including `chart.*`, whose code the viewer loads on its own. A binding
replaces one value inside `props`; u-widgets keeps bindable values under `data`, so a typical
binding key is `data.value`.

The authoring UI's widget picker offers these, each starting from props that already render:

| `type` | Starting `props` | Headline field |
|---|---|---|
| `status` | `{ data: { label, level, value } }` | `data.value` |
| `gauge` | `{ data: { value } }` | `data.value` |
| `chart.line` | `{ data: [{ t, value }], mapping: { x: 't', y: 'value' } }` | none |

The headline field is the value the widget shows most prominently. When its binding is not live,
the node's frame shows it (dashed for stale, dotted for disconnected), while a problem in any other
binding of the same widget is reported only in its tooltip. A widget with no headline field
(charts, tables) frames on its least current binding.

The full type reference, with examples that are compiled and run as tests, is in
[`docs/api-reference.md`](https://github.com/iyulab/U-Board/blob/main/docs/api-reference.md).
Concepts and architecture: [`docs/concepts.md`](https://github.com/iyulab/U-Board/blob/main/docs/concepts.md),
[`docs/architecture.md`](https://github.com/iyulab/U-Board/blob/main/docs/architecture.md).

## Versioning

Pre-1.0: a minor version may change the public API, including the view document format.

## License

Copyright (c) 2026 iyulab.

AGPL-3.0-or-later. A commercial license is available for organizations that cannot adopt AGPL-3.0
terms.
