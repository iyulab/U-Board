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
| `@iyulab/u-board/viewer` | Read-only `ViewerPage` and `BoardView`, and the `useResolvedDocument` hook | Yes |
| `@iyulab/u-board` | Everything in `domain`, plus `AuthoringView` and `ViewerPage` | Yes |
| `@iyulab/u-board/board-v2` | The board language's second version — its types, JSON Schema (`boardV2Schema`), check (`validateBoardV2`), drawing (`toViewDocument`) and the conversion of a first-version document (`fromV1`). Not stable yet: it may change in a minor release until it becomes the stored format | No (reads the widget catalog of `@iyulab/u-widgets`) |

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

The authoring view's binding form writes one of two reference shapes. An adapter that lists its
references (`references()`) is bound by picking one, and the reference is that string. Any other adapter
takes the HTTP connector's reference, `{ path, item?, valuePath?, observedAtPath?, timeZone?, maxAgeSeconds?, requestTime? }`:

- `path`: the request. For a source asked for the data of a given time, it holds time places —
  `?date={{now:yyyyMMdd}}&time={{now:HHmm}}` — that each request fills in on `timeZone`'s clock, at the
  time `requestTime: { delaySeconds?, stepSeconds? }` names: the time of the request, that much earlier,
  rounded down to that step.
- `valuePath`: an RFC 6901 JSON Pointer into the response.
- `item: { list, where }`: one element of the list at `list`, named by its fields rather than its
  position — sources reorder their lists. `valuePath` is then read inside that element.
- `items: { list, where }`: every element of the list whose fields match, in the source's order — the rows a table
  shows, kept to the part of the list it is about. It goes without `item`, `valuePath` and `observedAtPath`.
- `observedAtPath`: a pointer, read where `valuePath` is, to the time the source says it observed the
  value; `timeZone` (IANA) is the zone of a time written without an offset. The reading's `observedAt`
  is then the source's time rather than the time of the request.
- `maxAgeSeconds`: how old the source's value may normally be; older, it reads `stale` with reason
  `lagging`. It also spaces the source's requests to an eighth of it.

The form's response explorer writes the pointer, offers `item` when the picked value sits inside a
list, and offers the fields that read as a time for `observedAtPath`. Implement the same shape to have the form fill it in for you — `readHttpRef` (from
`@iyulab/u-board/domain`) reads a parsed response with it the way the hosted connector does.

## Showing a board

`ViewerPage` renders a view document read-only. Without `width`/`height` it fills its parent and
follows its size, so give the parent a definite height:

```tsx
import { ViewerPage } from '@iyulab/u-board/viewer';

<div style={{ height: '100vh' }}>
  <ViewerPage document={doc} adapters={adapters} pollIntervalMs={30_000} />
</div>;
```

A board as it is stored — a document in either version of the board language — is shown with `BoardView`, which
makes the view document itself, reading through the same adapters which items a grid lays out a part per item of:

```tsx
import { BoardView } from '@iyulab/u-board/viewer';

<BoardView board={storedBoard} adapters={adapters} pollIntervalMs={30_000} />;
```

`pictureOf(board, read)` (from `@iyulab/u-board/board-v2`) makes that view document on its own — with
`readerOf(adapters)`, or any function that reads a binding's adapter and reference.

An adapter whose source asks to be credited sets `attribution` (`{ text, url? }`); the viewer names
every credited source the board binds to on a line under it. `attribution={false}` leaves that line
to the host.

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

`onBoardState` hands the host what the board shows each time new values are drawn — each part’s state, its connection
quality and why, how old its data is, no values (`BoardState`) — for a host that acts on it: a count of faults in its
own header, a sound.

A board’s triggers (`triggers` — a part clicked, an element’s event, a state entered or left, the board opened) run in
`ViewerPage`. What they ask of the page is the host’s: `onTrigger` receives an `emit`’s event (its name, the part and
state it came from, never a value), `onNavigate` a request to show another board — nothing happens without it — and
`linkOrigins` narrows where a trigger’s link may go. `boardId` is what `{{board}}` in a link becomes. `AuthoringView`
takes the same props and runs triggers in View only; its property panel edits a part’s states and triggers, and its
board panel the triggers that run when the board opens.

How long ago a value was obtained is measured against `clock` (default `Date.now`). Its
`observedAt` comes from the source's side, so on a screen whose own clock may drift, pass a clock
set by the server's: `serverClock()` follows the `Date` of the responses you hand it.

```tsx
import { ViewerPage, serverClock } from '@iyulab/u-board/viewer';

const clock = serverClock();
// in your adapter: const sentAt = Date.now(); const res = await fetch(…); clock.observe(res, sentAt);
<ViewerPage document={doc} adapters={adapters} pollIntervalMs={30_000} clock={clock.now} />;
```

`AuthoringView` sizes the same way: without `width`/`height` the board fills the parent's width
beside the property panel, and its height. The document opens fitted into view the same way; a new
node or decoration is placed where the author is looking. The board is shown in one of two modes,
switched from the toolbar with pan and zoom kept. **Edit**: each node's widget is drawn in place,
live, over its footprint, its widget type named above it; drag across empty space to select several
items and drag one of them to move them all; select two nodes (Shift + click the second) to join them with
a connector, which opens selected; click a connector's line or label to edit it (it follows its nodes, so it is
never dragged); Delete removes the selection, a node with its connectors; pan with Space + drag or the middle mouse button, or
from the keyboard (arrow keys move the selection, or pan when nothing is selected; Tab steps through
the items). **View**: the board exactly as a shared link shows it, where a drag pans. The wheel
zooms in both.

The board's **elements** are edited in the editor too. While nothing is selected, the panel lists them — how each
is drawn and where it is placed — and opens one to edit its name (the widgets placing it follow), its template or
script, its CSS, its props schema, its origins and size, saying what is wrong as it is typed; a template is
previewed as it is typed, with the props of its first placement. A selected widget can be any of them (the type
choice lists them), and the props its schema lists get a control each, like a prepared widget's.

### Elements

Beside the prepared widgets, a board can define its own elements — markup and CSS drawn with the
board's props, in an isolated root that takes the board's theme — and place them by name
([API reference — Elements](https://github.com/iyulab/U-Board/blob/main/docs/api-reference.md#elements--elementdefinition)). An element
loads nothing from another origin unless it lists the origin in its `resources` and the host allows it:

```tsx
<ViewerPage document={doc} adapters={adapters} elementOrigins={['https://cdn.example.com']} />
```

A script element runs in a sandboxed frame its server builds; on a U-Board server, pass where they are
served — `elementFrames={`/api/element-frames/${boardId}`}`. Without it, a script element shows a notice.

### Text in another language

The components show English text by default. Pass `labels` — any subset of `UBoardLabels`, the
rest stays English — to show your own; `DEFAULT_LABELS` lists every key with its English text.
`labels.qualityText` holds the words for connection quality (the node tooltip and screen-reader
announcement), and `labels.time` writes the time of day — `timeText(locale)` builds one.
`labels.locale` is the language of the labels: the widgets on the board speak it too (their own text,
such as a table's pagination), and the property panel names widget types, data fields and options
in it, as the widget library names them.

Korean ships with the package as `KO_LABELS`, every key included — with it the widgets' own text
and names are Korean too. Lay your own words over it as over the English:

```tsx
import { ViewerPage, KO_LABELS } from '@iyulab/u-board/viewer';

<ViewerPage document={doc} adapters={adapters} labels={KO_LABELS} />;
<ViewerPage document={doc} adapters={adapters} labels={{ ...KO_LABELS, boardRegion: '2라인 펌프실' }} />;
```

### Styling

The components carry only the layout they need to work; how they look is up to the host. For a
finished look without writing CSS, import the default stylesheet once:

```ts
import '@iyulab/u-board/styles.css';
```

It reads `--ub-*` custom properties and falls back to its own values for any you leave out, so a
host themes it by defining them on `:root` or on an ancestor of the view:

```css
:root {
  --ub-brand-solid: #1d4ed8; /* primary buttons */
  --ub-border: #d4d4d8;
  --ub-panel-width: 360px;
}
```

| Token | Used for |
|---|---|
| `--ub-bg-surface`, `--ub-bg-subtle` | Panels, the editor and preview frames, buttons; hover and code backgrounds |
| `--ub-border`, `--ub-border-strong` | Frames and dividers; button and input outlines |
| `--ub-text-strong`, `--ub-text-normal`, `--ub-text-muted` | Headings and input text; body text; hints and secondary text |
| `--ub-brand-solid`, `--ub-text-inverse`, `--ub-brand-subtle` | Primary buttons (Save, Save binding) and their text; a highlighted entry |
| `--ub-error` | Failure messages |
| `--ub-warning`, `--ub-warning-bg` | The viewer's "not updating" notice |
| `--ub-quality-stale`, `--ub-quality-disconnected` | A node's frame when its headline value is stale or disconnected |
| `--ub-radius-sm`, `--ub-radius-md` | Corners of controls; corners of frames and panels |
| `--ub-space-1`, `--ub-space-2`, `--ub-space-3`, `--ub-space-4` | Gaps and padding (4, 8, 12, 16 px by default) |
| `--ub-font-sans` | Typeface |
| `--ub-font-size-xs`, `--ub-font-size-sm`, `--ub-font-size-md`, `--ub-font-size-base` | Text sizes (11, 12, 13, 14 px by default) |
| `--ub-panel-width` | Width of the authoring view's property panel (320 px by default) |
| `--ub-board-bg` | The board's paper inside the editor and viewer frames — white by default, in the dark theme too |
| `--ub-board-bg-dark` | The paper of a dark board (`appearance: "dark"`) — `#111827` by default |
| `--ub-grid-cell-bg`, `--ub-grid-cell-bg-dark` | The cell under each item of a grid view, on a light and on a dark board — a faint translucent tint by default |

Light or dark, the fallbacks follow the page's declared theme (`<html data-theme="dark" | "light">`) and,
without one, the system preference — the rule the widgets themselves follow. The board keeps its own
tone in both: its paper and the widgets on it sit on the board's drawing rather than on the page, so
they follow the document's `appearance` — light (`--ub-board-bg`) unless the author made a dark board
for a dark drawing (`--ub-board-bg-dark`, the widgets in their dark palette).

The tokens marked for failures, the "not updating" notice and node frames apply without the
stylesheet too — those colors carry meaning. The sheet's rules select these class names, mostly one
class each: they hold against a host's element styles (`h2`, `button`), and a host rule on the same
class, loaded after the sheet, overrides them. The class names are stable hooks:

| Class | Element |
|---|---|
| `ub-authoring` | The authoring view |
| `ub-authoring__toolbar`, `ub-authoring__group` | Its toolbar, and each group of related actions in it |
| `ub-authoring__scope` | Above the toolbar while a component is edited: which one, and the way back to the board |
| `ub-authoring__appearance` | The board tone picker (light or dark board), with the board's settings in the panel |
| `ub-authoring__mode` | The Edit / View switch in the toolbar (the chosen button has `aria-pressed="true"`) |
| `ub-authoring__panes`, `ub-authoring__pane` | The row holding the board and the panel; the board's column |
| `ub-authoring__surface` | The frame the board draws in — the editor, or the board in view mode |
| `ub-authoring__node`, `ub-authoring__node-tag` | A node's (or grid item's) widget drawn in place on the editor; the widget type named above it |
| `ub-authoring__pick`, `ub-authoring__layout-width` | On a grid view's editor: the button over each item that selects it (`aria-pressed` when selected); the Wide / Medium / Narrow layout width switch |
| `ub-authoring__panel` | The column holding the board, property or decoration panel |
| `ub-authoring__error`, `ub-authoring__status`, `ub-authoring__source` | A file that could not be used; "resolving"; the document source (`showDocumentSource`) |
| `ub-panel` (`--board`, `--properties`, `--decoration`, `--connector`, `--instance`, `--component`, `--item`, `--elements`, `--element`, `--symbols`, `--symbol`, `--part`, `--data`, `--statuses`) | The board's settings (background, tone, accent — while nothing is selected), a node's, decoration's or connector's properties, a component instance's values, the component being edited (its parameters), a grid item's layout (its widths, height and place in the order), the board's elements, one element's definition, the board's symbols, one symbol, a part of a board in the language's second version, or that board's data or statuses |
| `ub-panel__heading`, `ub-panel__subheading`, `ub-panel__field`, `ub-panel__hint`, `ub-panel__error` | Its heading, section heading, a labelled field, hint text and an error |
| `ub-panel__findings` | What a board's check finds at the selected part, listed under its settings |
| `ub-panel__widget-form`, `ub-panel__group` | The widget's own fields, and each group of them (data, display options) |
| `ub-panel__list` | The board's elements or symbols, one row each, in their panel |
| `ub-panel__field-name`, `ub-panel__field--check` | A field's name (with its key); a checkbox field |
| `ub-panel__advanced`, `ub-panel__json` | The folded "edit as JSON" section, and its editor |
| `ub-panel__bindings`, `ub-panel__binding`, `ub-panel__binding-path`, `ub-panel__binding-ref`, `ub-panel__binding-tag` | The list of bindings, one entry, its prop path, what it points at, and its "mapped" tag |
| `ub-panel__binding-form`, `ub-panel__value-map`, `ub-panel__map-row`, `ub-panel__actions` | The binding form, its value map, a row of the map, and its buttons |
| `ub-panel__section` | A section of a panel under its own subheading — a part’s states, its triggers |
| `ub-panel__state-looks`, `ub-panel__state-look` | How each state is shown, and one state’s row |
| `ub-panel__trigger`, `ub-panel__trigger-action` | One trigger, and one of its actions |
| `ub-panel__preview`, `ub-panel__quality` | A binding's previewed value, and its connection quality |
| `ub-json-tree`, `ub-json-tree__leaf` | The response explorer, and a value in it to pick |
| `ub-viewer`, `ub-viewer__toolbar`, `ub-viewer__surface` | The viewer, its toolbar and the frame the board draws in |
| `ub-viewer__status` | "Resolving", before the board's values first arrive |
| `ub-grid`, `ub-grid__items`, `ub-grid__item` | A grid view in the viewer (it carries `data-appearance`), the grid of its items, and one item's cell (`data-item-id`) |
| `ub-grid__canvas` | A grid cell's canvas — its viewer and zoom buttons, sized to the cell |
| `ub-viewer__attribution` | The line under a board naming where its data comes from (`Adapter.attribution`) — in `ViewerPage` and in `AuthoringView`'s view mode |
| `ub-view-controls` | The zoom out / zoom in / fit buttons |
| `ub-freshness`, `ub-freshness__time`, `ub-freshness__alert` | When the values were last updated, and the "not updating" notice |
| `ub-action` (`--primary`, `--icon`) | Every button; the primary one; a button holding one symbol |
| `ub-state-blink` (`--ring`) | A part in a state whose look blinks (`StateLook.blink`) — the part, or its ring when the look has one; still under `prefers-reduced-motion` |

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
| `status` | `{ data: { label, tone, value } }` | `data.value` |
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
