# @iyulab/u-board

Spatial dashboard authoring middleware — the board language, the adapter contract for reading a board's data from
external systems, and the React authoring and viewing components built on them.

This is the library package of [U-Board](https://github.com/iyulab/U-Board). See the repository
README for what U-Board is for and what it deliberately is not.

## Install

```sh
npm install @iyulab/u-board react react-dom
```

`react` and `react-dom` (19.2 or later) are peer dependencies. The `domain` and `picture` entry points do not use
them at runtime, but npm installs peer dependencies by default. The package is ESM-only (`import`,
not `require`) and needs Node 22.12 or later.

## Entry points

| Import | Contents | Depends on React / canvas |
|---|---|---|
| `@iyulab/u-board/domain` | The board language — its types, JSON Schema (`boardSchema`), check (`validateBoard`, `checkBoard`), `emptyBoard`, the part kinds, the rulebook an assistant reads (`boardRulebook`) — drawing a board's picture (`pictureOf`, `readerOf`), the `Adapter` contract, JSON Patch, connection-quality text (`describeQuality`) | No |
| `@iyulab/u-board/picture` | The picture a board is drawn as — `ViewDocument`, `resolveDocument`, `boardStateOf`, the trigger decisions, the HTTP connector's reference (`readHttpRef`), element frames, `lintViewDocument` | No |
| `@iyulab/u-board/viewer` | `BoardView`, and `ViewerPage` for a picture made elsewhere (a server's) | Yes |
| `@iyulab/u-board` | Everything in `domain` and `viewer`, plus `BoardAuthoring` | Yes |

Code that only reads, checks or writes boards, or implements an adapter for an external system,
should import from `@iyulab/u-board/domain` so it never pulls in the rendering stack.

## Writing a board

A board is one JSON object: where its values come from and what they mean (`data`), what it shows (`parts`) and where
(`layout`), with its statuses and its look said once:

```ts
import { checkBoard, type Board } from '@iyulab/u-board/domain';

const board: Board = {
  statuses: { running: { tone: 'ok', label: 'Running' }, down: { tone: 'alarm', label: 'Down' } },
  data: {
    pumps: {
      from: 'plant', path: '/pumps', list: '/value', key: 'id', time: 'updatedAt', fresh: 60,
      fields: { state: { state: { run: 'running', trip: 'down', '*': 'off' } }, flow: { label: 'Flow', unit: 'm³/h' } },
    },
  },
  parts: { P1: { as: 'status-card', of: 'pumps[P1]', title: 'Pump 1', show: ['state', 'flow'] } },
  layout: { kind: 'canvas', size: [720, 360], place: { P1: [40, 40, 200, 120] } },
};

checkBoard(board).issues; // [] — what a server checks before it stores one
```

The language in full — every section, the part kinds and their options, links, elements and triggers — is in the
[API reference](https://github.com/iyulab/U-Board/blob/main/docs/api-reference.md#the-board).

## Implementing an adapter

An adapter reads a board's data from a source U-Board does not own; a data read's `from` names it by its `id`. The
board stores only the reference; the adapter decides what it means.

```ts
import type { Adapter } from '@iyulab/u-board/domain';

const plant: Adapter = {
  id: 'plant',
  async resolve(ref) {
    // a read with a `path` hands the HTTP connector's reference: { path, item?, items?, valuePath?, … }
    // a read with a `ref` hands the board's own `ref`, in whatever shape this adapter defines
    return { value: await readFromMySystem(ref), quality: 'live' };
  },
};
```

A read with a `path` is given the HTTP connector's reference (`HttpRef` — the request, the list item named by its key,
a JSON Pointer to the value, the time the source observed it and how old it may be). `readHttpRef` (from
`@iyulab/u-board/picture`) reads a parsed response with it the way the hosted connector does, so an adapter that
stands in for a connector reports values, times and reasons alike. A read with a `ref` is given that `ref` and answers
one item — an object of fields, or a value a field reads with `at: ""`.

## Showing a board

`BoardView` draws a board, reading its data through the host's adapters. Without `width`/`height` it fills its parent
and follows its size, so give the parent a definite height:

```tsx
import { BoardView } from '@iyulab/u-board/viewer';

<div style={{ height: '100vh' }}>
  <BoardView board={board} adapters={adapters} pollIntervalMs={30_000} />
</div>;
```

It draws the board through its picture, reading which items each list has when the board opens and whenever the board
changes; pass the same board object until it changes. `pictureOf(board, readerOf(adapters))` (from
`@iyulab/u-board/domain`) makes that picture on its own. `ViewerPage` draws a picture made elsewhere as given — the one
a U-Board server answers with a board — and takes the same props as `BoardView` otherwise.

An adapter whose source asks to be credited sets `attribution` (`{ text, url? }`); the viewer names
every credited source the board reads on a line under it. `attribution={false}` leaves that line
to the host.

The board opens fitted into view — shrunk to fit, never magnified past its natural size — and stays
fitted as the view resizes until the viewer pans or zooms; a "Fit to view" control restores that,
and zoom in/out controls do what the wheel does from the keyboard. Pass `width`/`height` (CSS px) for a
fixed-size view instead.

With `pollIntervalMs` the board re-reads its data on that interval — and within a few seconds when
the page is shown again after a hidden tab or a sleeping machine — and is made to be left open on a
screen: it shows the time its values were last updated, and when no update (a result in which some
value arrived) has come for two intervals it says so prominently (an announced status) and shows
every value as last known (`stale`) rather than current.

`onBoardState` hands the host what the board shows each time new values are drawn — each part’s status, its connection
quality and why, how old its data is, no values (`BoardState`) — for a host that acts on it: a count of faults in its
own header, a sound.

A board’s triggers (`triggers` — a part clicked, an element’s event, a status entered or left, the board opened) run in
the viewer. What they ask of the page is the host’s: `onTrigger` receives an `emit`’s event (its name, the part and
status it came from, never a value), `onNavigate` a request to show another board — nothing happens without it — and
`linkOrigins` narrows where a trigger’s link may go. `boardId` is what `{{board}}` in a link becomes. `BoardAuthoring`
takes the same props and runs triggers in View only.

How long ago a value was obtained is measured against `clock` (default `Date.now`). Its
`observedAt` comes from the source's side, so on a screen whose own clock may drift, pass a clock
set by the server's: `serverClock()` follows the `Date` of the responses you hand it.

```tsx
import { BoardView, serverClock } from '@iyulab/u-board/viewer';

const clock = serverClock();
// in your adapter: const sentAt = Date.now(); const res = await fetch(…); clock.observe(res, sentAt);
<BoardView board={board} adapters={adapters} pollIntervalMs={30_000} clock={clock.now} />;
```

## Authoring a board

```tsx
import { BoardAuthoring } from '@iyulab/u-board';

<div style={{ height: '80vh' }}>
  <BoardAuthoring initialBoard={board} adapters={adapters} onSave={next => save(next)} />
</div>;
```

`BoardAuthoring` sizes the same way: without `width`/`height` the board fills the parent's width beside the panel, and
its height. The board opens fitted into view and is shown in one of two modes, switched from the toolbar with pan and
zoom kept. **Edit**: the board drawn as its viewers see it, each part's widget in place over its footprint, its kind
named above it; drag a part to move it, its handles to size it; drag across empty space to select several; select two
parts (Shift + click the second) to join them with a link; Delete removes the selection; on a grid, drag an item onto
another to move it there, and lay the grid out at a wide, medium or narrow width. **View**: the board exactly as a
shared link shows it, where a drag pans. The wheel zooms in both.

The panel edits what is selected — a part's title, kind, what it reads (a data read, and one item of it by key), the
fields it shows and its kind's options, with the controls the widget library describes; a link; a shape; a grid item's
span and height — and, with nothing selected, the board: its background, theme and accent, its data reads (reading a
source to offer the fields its items have), its statuses, its elements and its triggers. What the board's check finds is
listed where it applies, and a setting the board cannot be drawn with keeps the last picture it could, saying why. A
grid's cell — a canvas, or a grid of its own — opens in its own editor. Undo and Redo walk the edits; Save calls
`onSave` with the board (without it there is no Save), and Export downloads the board as a file. `sourceLabels` names
each adapter's source in the data panel.

### Elements

Beside the built-ins, a board can define its own elements — markup and CSS drawn with the part's props, in an isolated
root that takes the board's theme, or a script in a sandboxed frame — and place them by name
([API reference — elements](https://github.com/iyulab/U-Board/blob/main/docs/api-reference.md#elements-and-symbols--drawings-no-built-in-makes)).
A script element loads nothing from another origin unless it lists the origin in its `resources` and the host allows it:

```tsx
<BoardView board={board} adapters={adapters} elementOrigins={['https://cdn.example.com']} />
```

A script element runs in a sandboxed frame its server builds; on a U-Board server, pass where they are
served — `elementFrames={`/api/element-frames/${boardId}`}`. Without it, a script element shows a notice.

### Text in another language

The components show English text by default. Pass `labels` — any subset of `UBoardLabels`, the
rest stays English — to show your own; `DEFAULT_LABELS` lists every key with its English text.
`labels.qualityText` holds the words for connection quality (the node tooltip and screen-reader
announcement), and `labels.time` writes the time of day — `timeText(locale)` builds one.
`labels.locale` is the language of the labels: the widgets on the board speak it too (their own text,
such as a table's pagination), and the panel names part kinds, data fields and options
in it, as the widget library names them.

Korean ships with the package as `KO_LABELS`, every key included — with it the widgets' own text
and names are Korean too. Lay your own words over it as over the English:

```tsx
import { BoardView, KO_LABELS } from '@iyulab/u-board/viewer';

<BoardView board={board} adapters={adapters} labels={KO_LABELS} />;
<BoardView board={board} adapters={adapters} labels={{ ...KO_LABELS, boardRegion: '2라인 펌프실' }} />;
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
| `--ub-brand-solid`, `--ub-text-inverse`, `--ub-brand-subtle` | Primary buttons (Save) and their text; a highlighted entry |
| `--ub-error` | Failure messages |
| `--ub-warning`, `--ub-warning-bg` | The viewer's "not updating" notice |
| `--ub-quality-stale`, `--ub-quality-disconnected` | A part's frame when its headline value is stale or disconnected |
| `--ub-radius-sm`, `--ub-radius-md` | Corners of controls; corners of frames and panels |
| `--ub-space-1`, `--ub-space-2`, `--ub-space-3`, `--ub-space-4` | Gaps and padding (4, 8, 12, 16 px by default) |
| `--ub-font-sans` | Typeface |
| `--ub-font-size-xs`, `--ub-font-size-sm`, `--ub-font-size-md`, `--ub-font-size-base` | Text sizes (11, 12, 13, 14 px by default) |
| `--ub-panel-width` | Width of the authoring view's panel (320 px by default) |
| `--ub-board-bg` | The board's paper inside the editor and viewer frames — white by default, in the dark theme too |
| `--ub-board-bg-dark` | The paper of a dark board (`theme: "dark"`) — `#111827` by default |
| `--ub-grid-cell-bg`, `--ub-grid-cell-bg-dark` | The cell under each item of a grid view, on a light and on a dark board — a faint translucent tint by default |

Light or dark, the fallbacks follow the page's declared theme (`<html data-theme="dark" | "light">`) and,
without one, the system preference — the rule the widgets themselves follow. The board keeps its own
tone in both: its paper and the widgets on it sit on the board's drawing rather than on the page, so
they follow the board's `theme` — light (`--ub-board-bg`) unless the author made a dark board
for a dark drawing (`--ub-board-bg-dark`, the widgets in their dark palette).

The tokens marked for failures, the "not updating" notice and node frames apply without the
stylesheet too — those colors carry meaning. The sheet's rules select these class names, mostly one
class each: they hold against a host's element styles (`h2`, `button`), and a host rule on the same
class, loaded after the sheet, overrides them. The class names are stable hooks:

| Class | Element |
|---|---|
| `ub-authoring` | The authoring view |
| `ub-authoring__toolbar`, `ub-authoring__group` | Its toolbar, and each group of related actions in it |
| `ub-authoring__appearance` | The board tone picker (light or dark board), with the board's settings in the panel |
| `ub-authoring__mode` | The Edit / View switch in the toolbar (the chosen button has `aria-pressed="true"`) |
| `ub-authoring__panes`, `ub-authoring__pane` | The row holding the board and the panel; the board's column |
| `ub-authoring__surface` | The frame the board draws in — the editor, or the board in view mode |
| `ub-authoring__node`, `ub-authoring__node-tag` | A part's widget drawn in place on the editor; its kind named above it |
| `ub-authoring__pick`, `ub-authoring__layout-width` | On a grid view's editor: the button over each item that selects it (`aria-pressed` when selected); the Wide / Medium / Narrow layout width switch |
| `ub-authoring__panel` | The column holding the panel |
| `ub-authoring__error`, `ub-authoring__status` | A setting the board cannot be drawn with; "resolving" |
| `ub-panel` (`--board`, `--item`, `--elements`, `--part`, `--link`, `--shape`, `--data`, `--statuses`) | The board's settings (while nothing is selected), a grid item's layout (its widths, height and place in the order), the board's elements, a part, a link or a shape, or the board's data or statuses |
| `ub-panel__heading`, `ub-panel__subheading`, `ub-panel__field`, `ub-panel__hint`, `ub-panel__error` | Its heading, section heading, a labelled field, hint text and an error |
| `ub-panel__findings` | What a board's check finds at the selected part, listed under its settings |
| `ub-panel__widget-form`, `ub-panel__group` | The widget's own fields, and each group of them (data, display options) |
| `ub-panel__details` | A fold for the finer settings of a data read (which items, their time, the request time) |
| `ub-panel__field-name`, `ub-panel__field--check` | A field's name (with its key); a checkbox field |
| `ub-panel__binding-tag` | A field's "mapped" tag |
| `ub-panel__value-map`, `ub-panel__map-row`, `ub-panel__actions` | A value map, a row of the map, and its buttons |
| `ub-panel__section` | A section of a panel under its own subheading — a part’s states, its triggers |
| `ub-panel__state-looks`, `ub-panel__state-look` | How each state is shown, and one state’s row |
| `ub-panel__trigger`, `ub-panel__trigger-action` | One trigger, and one of its actions |
| `ub-viewer`, `ub-viewer__toolbar`, `ub-viewer__surface` | The viewer, its toolbar and the frame the board draws in |
| `ub-viewer__status` | "Resolving", before the board's values first arrive |
| `ub-grid`, `ub-grid__items`, `ub-grid__item` | A grid view in the viewer (it carries `data-appearance`), the grid of its items, and one item's cell (`data-item-id`) |
| `ub-grid__canvas` | A grid cell's canvas — its viewer and zoom buttons, sized to the cell |
| `ub-viewer__attribution` | The line under a board naming where its data comes from (`Adapter.attribution`) — in the viewer and in `BoardAuthoring`'s view mode |
| `ub-viewer__example` | In that line, first: that the board shows example data — it binds to an adapter whose values are (`Adapter.sample`) |
| `ub-view-controls` | The zoom out / zoom in / fit buttons |
| `ub-freshness`, `ub-freshness__time`, `ub-freshness__alert` | When the values were last updated, and the "not updating" notice |
| `ub-action` (`--primary`, `--icon`) | Every button; the primary one; a button holding one symbol |
| `ub-state-blink` (`--ring`) | A part in a state whose look blinks (`StateLook.blink`) — the part, or its ring when the look has one; still under `prefers-reduced-motion` |

## Widgets

A built-in part is drawn by a widget of [`@iyulab/u-widgets`](https://github.com/iyulab/u-widgets) — `stat` by its
`metric`, `stat-list` by its `kv`, `chart.*` by its charts, whose code the viewer loads on its own — with the options the
board hands it. A part's frame shows how current its headline field is (dashed for stale, dotted for disconnected),
while a problem in any other value it reads is reported only in its tooltip; a widget with no headline field (charts,
tables) frames on its least current value. The headline fields of the widgets a new part starts from:

| `type` | Starting `props` | Headline field |
|---|---|---|
| `status` | `{ data: { label, tone, value } }` | `data.value` |
| `gauge` | `{ data: { value } }` | `data.value` |
| `chart.line` | `{ data: [{ t, value }], mapping: { x: 't', y: 'value' } }` | none |

The full type reference, with examples that are compiled and run as tests, is in
[`docs/api-reference.md`](https://github.com/iyulab/U-Board/blob/main/docs/api-reference.md).
Concepts and architecture: [`docs/concepts.md`](https://github.com/iyulab/U-Board/blob/main/docs/concepts.md),
[`docs/architecture.md`](https://github.com/iyulab/U-Board/blob/main/docs/architecture.md).

## Versioning

Pre-1.0: a minor version may change the public API, including the board language.

## License

Copyright (c) 2026 iyulab.

AGPL-3.0-or-later. A commercial license is available for organizations that cannot adopt AGPL-3.0
terms.
