# Changelog — @iyulab/u-board

All notable changes to this package are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the package follows
[Semantic Versioning](https://semver.org/) — below 1.0, a minor release may contain breaking changes.

## [Unreleased]

### Added

- A binding whose value is a list can give each item fields of its own: `itemFields: { "<name>": { from, map? } }` —
  each the value of the item's `from` field, translated by `map` when there is one. A list's or a table's rows keep the
  source's words and gain the tone they are coloured by (`mapping.tone`); a field the widget reads by another name is
  the source's field under that name. `withItemFields(fields, value)` applies them for a host's own code; the view
  document's JSON Schema and validator take the new field, and the binding form keeps it when the binding is edited.
- A drawing colour — a decoration's, a connector's, a state's ring — takes the widgets' tones by name (`ok`, `info`,
  `watch`, `warn`, `alarm`, `off`, `idle`, `past`, `now`, `next`), drawn in the widgets' palette for the board's
  appearance, beside `positive`, `warning`, `negative` and `accent`. An element's markup reads the same colours as the
  widgets name them (`var(--u-widget-tone-alarm)` …).

- An HTTP connector reference can ask a source for the data of a given time rather than for its latest: time places
  in its `path` (`base_date={{now:yyyyMMdd}}&base_time={{now:HHmm}}`) are filled in each time a request is sent, on
  `timeZone`'s clock, at the time `requestTime: { delaySeconds?, stepSeconds? }` names — the time of the request,
  that much earlier, rounded down to that step (`{ delaySeconds: 2400, stepSeconds: 3600 }` for hourly data out forty
  minutes after the hour). `requestPath(ref, now)` gives the request a reference makes; a path with any other `{{…}}`
  is not a reference. The binding form asks for the zone, the delay and the step when a path has time places, shows
  the request it makes now, and explores the source with them.

### Changed

- Requires `@iyulab/u-widgets` 0.41: a `status` item's state is `data.tone` (`ok` · `warn` · `alarm` · `idle` · …)
  where it was `data.level` (`success` · `warning` · `error` · `neutral`), a `metric`'s is `data.tone` where it was
  `data.variant`, and a chart's axis format is a string (`xFormat: 'time'`). A new status widget starts with
  `tone: 'idle'`. The property panel offers the fields the library now describes — a status item's tone and emphasis,
  a gauge's tone and form. A binding's value map translates into whatever the prop takes, so maps that set a tone
  write the new words.
- Requires `@iyulab/u-widgets` 0.40, whose `form` widget draws its fields with `<formdown-ui>` and loads it only when a
  form is first drawn, and `@canvas-kit/viewer` 0.6.1, where dragging to pan no longer selects overlay text.

## [0.33.1] - 2026-10-21

### Changed

- Requires `@iyulab/u-widgets` 0.39, whose charts with axes are laid out to their box at every size — the plot fills a
  chart a few hundred pixels tall instead of about half of it, and the legend sits on top, clear of the axis labels.

## [0.33.0] - 2026-10-21

### Fixed

- A grid item placing an element without a `height` takes the element's `size.height` as the least height, not a fixed
  one: it stretches to its row and to the rows it spans as every other item does, and at narrow width — one item per
  row, `rowSpan` ignored — it is its own height again instead of a wide layout's.

### Added

- **`Connector.labelSize`** — the label's font size in scene units, 11 when left out; its chip grows with it in the
  same proportion. A board drawn large — a 1080 × 1920 kiosk, a wall — sets it so a connector's label reads at the size
  the board is seen. The validator checks it (a number above 0), the schema carries it, and the editor's connector panel
  sets it.

## [0.32.0] - 2026-10-21

### Added

- A connector's `style.route` takes `curved`: the line bows to the left of the way it runs, from `fromNodeId` toward
  `toNodeId`, as flows on a map are drawn — two connectors running opposite ways between the same nodes bow apart. It
  leaves and enters the boxes' edges as a straight line does, carries its label and arrowheads along the curve, and is
  drawn straight when the boxes overlap. The editor's connector panel offers it.

## [0.31.1] - 2026-10-21

Widgets from `@iyulab/u-widgets` 0.38.2 (funnel and reference line labels placed clear of the data).

### Fixed

- A grid item without `spanMedium` now takes its share of the row it sits on at full width, so a row that fills the
  twelve columns fills the six at medium width. Each item used to take half its span rounded up on its own, which
  pushed rows of odd spans (7 + 5, 9 + 3, four 3s) past six columns: the last item wrapped and left its row half
  empty. A row that divides at its middle becomes two medium rows (four 3s → 3 + 3, 3 + 3); one beside an item
  spanning rows shares what that item leaves.

## [0.31.0] - 2026-10-21

### Changed

- Widgets from `@iyulab/u-widgets` 0.38.1: a pie's legend sits where an `echarts` passthrough places it, a metric with a
  sparkline keeps inside a short box, and a reference line's label reads plainly on a dark board.

### Fixed

- In View, a grid board's canvas cells label their zoom and fit buttons in the editor's language — they were English
  whatever `labels` the editor was given.

### Added

- `AuthoringView` takes `initialMode` (`'edit'` or `'view'`) and `onModeChange`: a host that opens the board again —
  after a change saved elsewhere — gives the mode the author was in, so one watching the board in View stays in View.

## [0.30.0] - 2026-10-20

### Changed

- Widgets come from `@iyulab/u-widgets` 0.38 — `metric` and `stat-group` draw `data.sparkline` (the recent values, as a
  small line under the value), a misspelt field of a reference line or a series is named by the widget checks, an area
  chart takes reference lines, and a horizontal bar chart labels one at its top. Needs `@iyulab/u-widgets` `^0.38.0`.

## [0.29.0] - 2026-10-20

### Changed

- Widgets come from `@iyulab/u-widgets` 0.37 — a `form` writes a toggle in formdown as `c[switch]`, and its parser
  no longer brings a YAML reader (about 30 KB lighter). Needs `@canvas-kit/viewer` `^0.6.0`.

### Added

- **Breaking: a grid cell can hold a canvas** — `GridItem` is `GridWidgetItem | GridCanvasItem`. A canvas cell
  (`{ id, canvas: { background, nodes, connectors, decorations }, span, spanMedium, height }`) is the spatial panel of
  a mixed board; the board's elements, symbols and triggers stay on the board, and ids are unique across every cell.
  The validator, the JSON Schema, `resolveDocument` (`ResolvedCanvasItem`), `bindingsIn` and `lintViewDocument` (at
  `/items/<i>/canvas/…`) know it. `placedIn` walks a cell's nodes with the grid's widget items, and `placedAt` gives
  each with its JSON Pointer; `isCanvasItem` tells the two items apart. Code that read `item.widget` on a grid item
  narrows first: `if (!isCanvasItem(item)) item.widget`, or walks `placedIn(doc)`. The viewer draws a canvas cell as
  a canvas board, fitted to its cell (without a `height`, the cell keeps the canvas's proportions) with its own zoom
  buttons; the grid scrolls over it, and Ctrl/⌘ + wheel zooms it. The grid editor adds one (**Add canvas**) and
  edits its canvas in the canvas editor (**Edit canvas**, back with **← Grid**), in the grid's own history. The
  `remove` edit command takes a canvas cell's nodes, connectors and decorations.
- A grid item can span rows: `rowSpan` (1–6, from medium width up) — a map or a large panel beside a column of
  smaller cards, the items after it filling the rows beside it in order. The grid editor sets it (`UBoardLabels.itemRowSpan`).
- A template value or a connector label can show a number with a comma every three digits: `{{orders | grouped:0}}`
  reads `61,700` — `fixed:N`'s digits after the point, grouped.
- `UBoardLabels.canvasCell` (a canvas cell's name — its tag in the grid editor, its region's in the viewer),
  `wheelZoomHint` (the line a canvas cell shows when the wheel scrolls past it), `addCanvas`, `editCanvas`,
  `backToGrid` and `canvasHeightAuto`. A host writing its own labels in full needs them.

## [0.28.0] - 2026-10-20

### Changed

- Widgets come from `@iyulab/u-widgets` 0.36. A `form` written in formdown (`formdown`) is read by formdown itself:
  attributes are separated by spaces (`R[min=0 max=100]`), a multiselect is `s[multiple]`, and a toggle needs a
  `fields` array. A `form` takes `fieldStates` — values suggested for its fields, picked with a click.

### Added

- **Breaking: `QualityReason` has `pending`** — the source is being read and has not answered yet, with no earlier
  answer to show meanwhile (a slow source, the first time a board reads it). `REASON_LABEL`, the default `QualityText`
  and the Korean labels have text for it. A `QualityText` or a `Record<QualityReason, string>` written out in full
  needs a `pending` entry.

## [0.27.0] - 2026-10-20

### Added

- `QualityReason` `source`: the source answered with success but said in its answer that it could not serve the
  request. A host that keeps its own words for each reason (`QualityText`, `UBoardLabels.qualityText`) needs one for
  it — a `Record<QualityReason, string>` without it no longer compiles.
- `ResolvedBinding.message` — what went wrong, in words for whoever can fix the binding or its data source. The binding
  editor's preview shows it beside the cause, and a failed explore says it.
- `SourceErrorField`, `sourceErrorIn(body, field)` and `isSourceErrorField(field)` in `@iyulab/u-board/domain`: where a
  source that answers an error with success writes its status, and the error such an answer reports.

## [0.26.0] - 2026-10-20

### Added

- A drawing colour can be a theme colour's name — `positive`, `warning`, `negative`, `accent` — wherever a board
  colours a part: a state's ring, a connector, a frame, a text. It is drawn in the widgets' palette for the board's
  `appearance` (`accent` is the board's own, else the theme's primary), so a ring and a gauge mean the same green and
  a dark board needs no second set of colours. The states editor offers the names. The board's `accent` itself still
  takes a colour.
- A bound connector label can keep its unit: when its text names `{{value}}`, the bound value fills that place —
  `"{{value | fixed:1}} Mbps"` reads `820.4 Mbps` — and `—` stands in while there is no value. Text without `{{` is
  replaced by the value, as before. Strict validation refuses a pattern that names anything else, or one with no
  `label` binding.

### Changed

- Every size inside an element includes its padding and border (`box-sizing: border-box`, for a template's markup
  and a script element's page alike), so a root of `height: 100%` with padding fits its box instead of being cut off
  at the bottom. An element that relied on the old sizing can say `box-sizing: content-box` in its own CSS.

## [0.25.0] - 2026-10-20

### Added

- A `template` element may use a description list — `<dl>`, `<dt>`, `<dd>` — for names and their values.
- A template value may say how many digits a number shows after the point: `{{inlet | fixed:1}}` (0–6) — `24` and
  `24.25` read as `24.0` and `24.3` side by side. Anything that is not a number shows as it is.

### Changed

- A canvas document field written under `/components` (`instances` beside the definitions) is refused with where it
  belongs — `/instances`, beside `/components` — instead of «expected an object». A component can no longer be named
  after a document field (`nodes`, `instances`, …).

## [0.24.0] - 2026-10-19

### Added

- The grid editor duplicates the selected item (**Duplicate item**) right after it — its widget, bindings and layout;
  the copy is selected.
- `applyEditCommands(doc, commands)` (`@iyulab/u-board/domain`): the edits that change a board in more than one
  place, as the editor makes them — rename or remove an element or a symbol, remove parts with the lines and triggers
  that name them, make a component, detach an instance, rename or remove a component with its instances. All or
  nothing; a command that cannot run throws `EditCommandError` with the path it is about.
- `documentPatch(before, after)` (`@iyulab/u-board/domain`): the JSON Patch that turns one document into another —
  members and id-carrying list items changed where they are, removed from the last, added at the end — so a change
  made on a whole document is sent as the few operations it made.

### Changed

- **Edit component** draws the component's parts as an instance will: each `{{name}}` filled with the parameter's
  default, else with the first instance's value — it drew the `{{name}}` text itself. The component keeps its
  placeholders; a name nothing fills stays as written.
- A node or frame added while a component is edited goes near the component's origin, among its parts — it was
  placed from the visible corner of the view and stood off from every instance.

### Fixed

- Validation refuses an element placement's binding key that starts with `props.` (`"props.status"`) when the element
  declares no prop `props` — it wrote into `props.props` and the element never drew the value; the key is the path
  inside the props (`"status"`).
- Validation reports a component that does not hold at the component only: a connector or a trigger naming a part
  of one of its instances was reported as naming nothing too, with a hint that a connector joins only `/nodes`.
- `applyJsonPatch`: a `replace` keeps the member where it stands among the others — it moved it last.

## [0.23.0] - 2026-10-17

### Added

- The editor names a part a component instance draws by the instance and the part — a line's end ("Status 1 →
  press-2 › Temp"), and the choices of a trigger, which can now name such a part, its states offered too.
- The editor makes the selected nodes and frames a component (**Make component**) — the lines between them go with
  them, and an instance draws them where they were, the board's other lines and triggers to them renamed — and draws an
  instance as parts of the board's own again (**Detach into parts**), its values filled in.
- The editor edits a component as a board of its own (**Edit component** on an instance): its parts on the canvas,
  its parameters as a JSON Schema in its panel, a bar above the toolbar naming it with the way back — each change
  written into the board, so every instance draws it and Undo takes it back. A part taken out of it goes from every
  instance, with the board's lines and triggers to it. The board's elements and symbols stay edited on the board.

### Changed

- `@canvas-kit/core` `^0.8.0`, `@canvas-kit/designer` `^0.10.0`, `@canvas-kit/viewer` `^0.5.4`.

### Fixed

- In the editor, a line of the board's own that runs over a component instance is picked there too — the instance's
  box lay over it.
- In the editor, a selected component instance takes no resize or rotate handles — its size is its component's; they
  showed, and let go of, it sprang back.

## [0.22.0] - 2026-10-17

### Added

- Components: a canvas board defines a group of parts once (`components` — nodes, connectors between them and
  decorations, from its own origin, with declared `params`) and draws it any number of times (`instances` — a point,
  `anchored`, a value per parameter). `{{name}}` in any text of its parts, a binding's `ref` included, takes the
  instance's value. `expandComponents` gives the board as drawn — each part with the id `<instance id>/<part id>`
  (`instancePartId`), which a board connector, a trigger and the board state use — and `resolveDocument` and
  `bindingsIn` expand first, so a share link reads only what the instances name. `validateViewDocument`, the JSON
  Schema and the advice know components — the layout advice judges the board as drawn, saying what lies within one
  instance at the component and what involves an instance at the instance. In the editor an instance is selected,
  dragged and deleted as one (its parts drawn locked under it, the board's lines and triggers to its parts going with
  it), its parameter values edited in its own panel; renaming an element renames it inside components too. Editing a
  component itself comes later.

### Changed

- `validateViewDocument`: a field of an element definition written beside the elements (`/elements/template`) says it
  belongs inside one, `/elements/<name>/template`.

### Security

- `@iyulab/u-widgets` `^0.35.3`: a quote in a markdown widget's link can no longer add an attribute (an event handler)
  to the link, and a heatmap's tooltip escapes its row and column names. A board's widget specs are often written by a
  language model — take this.

## [0.21.0] - 2026-10-17

### Added

- Connector `style.route`: `straight` (the default) or `orthogonal` — out of the side facing the other node, one
  right-angle turn at the middle of the gap, into the other's facing side (straight when the two line up, or when the
  boxes overlap and leave no gap to turn in). Side-by-side connectors stay apart along the whole line; the label sits
  along the line's length, arrowheads point along the run they end, and the layout advice follows the turn. The
  editor's connector panel has a **Route** choice. `CONNECTOR_ROUTES` lists the routes.

### Changed

- `applyJsonPatch` (and `getByPointer`): a pointer naming a member an object does not have says what that object does
  have, and where the member is when one of its members holds it — `nothing at /nodes/0/props — /nodes/0 has id, x,
  widget; "props" is at /nodes/0/widget/props`.
- `@iyulab/u-widgets` `^0.35.2`: a Gantt's `color` and `label` and a histogram's `value` are described as theirs in the
  widget help (they read as another widget's).

## [0.20.0] - 2026-10-17

### Added

- `lintViewDocument(doc, { geometryLimit })`: how many layout findings are listed one by one before the rest fold into
  one counted line (`Infinity` lists them all). The folded line carries `count`, how many findings it stands for.

## [0.19.0] - 2026-10-16

### Added

- `AuthoringView` edits states and triggers: a **States** section in the property panel (which binding, the value →
  state rows of the value-map form, each state’s ring colour, blink and hide; renaming a state carries its look;
  removing the binding the states are read from takes them away in the same edit) and a **Triggers** section (the
  selected part’s triggers, and in the board panel the ones that run when the board opens). A trigger is written once
  it is complete and valid. Style contract: `ub-panel__section`, `ub-panel__state-looks`, `ub-panel__state-look`,
  `ub-panel__trigger`, `ub-panel__trigger-action`.

### Fixed

- Deleting a part in `AuthoringView` (`removeParts`, `removeGridItem`) also removes the triggers on it, those waiting on
  its state and actions bringing it into view — a trigger naming a part the board does not place is refused on save,
  so the board could not be saved.

## [0.18.0] - 2026-10-16

### Added

- **Triggers** — `triggers` at the top level of either kind: `on` an event (`click`, `element`, `enter`, `leave`,
  `open`), optionally `when` a part is in a state, `do` actions (`open-link`, `focus`, `emit`, `go-to-board`). Validated
  with paths, in the JSON Schema, and run by `ViewerPage` — a part with a click trigger becomes a button named by its
  caption (or id), each trigger fires at most once a second, links open only `https` or this installation’s paths.
  Host props `boardId`, `onTrigger`, `onNavigate`, `linkOrigins` on `ViewerPage` and `AuthoringView` (View only);
  `BoardEvent` is exported from `./viewer`.
- Elements raise events: `ub.emit(name)` in a script element; a region of a template element’s markup marked
  `data-ub-event="name"`, raised by a click — and, where a trigger listens for it, by Enter or Space (the region is made
  focusable and a button unless the markup says otherwise).
- `firedBy`, `stateChanges`, `linkFor`, `elementListeners`, `FiringLimit` and `isTriggerLink` in `./domain`, for a host
  that draws a board its own way.

### Changed

- `@iyulab/u-widgets` `^0.35.0`: gauge and progress show their value in the widget’s locale, `number:N`/`percent:N`
  format hints, a value x axis for line and area charts.
- `applyJsonPatch`: an index that is not in a list says how long the list is (“the list has 44 items (0–43)”).

## [0.17.0] - 2026-10-16

### Added

- **States** — `states` on a node or a grid item (`StateRule`: `from` one of its widget’s bindings, a `map` to state
  names, `looks` per state — `outline`, `blink`, `hidden`). Resolved parts carry `state`; the frame is marked
  `data-state`, says the state first in its title and announcement, and draws the look around itself — the quality
  border is unchanged. Blinking needs the default stylesheet (`.ub-state-blink`, with `--ring` when the look has a ring)
  and stops under `prefers-reduced-motion`. Authoring is through the document for now (the source view or a tool).
- **Board state** — `boardStateOf(resolved, { now, revision? })` and the `BoardState`/`PartState` types: each part’s
  state, worst connection quality and its cause, oldest observation — no values. `ViewerPage`’s `onBoardState` hands it
  to the host each time new values are drawn (`stale` once the view stops updating).
- `ValueMap` and `ValueRange` take the type of the value they give (`ValueMap<string>` for state names); existing uses
  are unchanged.
- `lintViewDocument` points at a look for a state its map never names.

### Changed

- `lintViewDocument` says two overlapping nodes once: their captions lying under each other or running together are
  no longer reported as well — moving the nodes apart fixes them.
- `applyJsonPatch`: a `replace` of an object member that is not there says that `add` sets one.
- `validateViewDocument` with `strict`: a field a part does not have reads “an element definition has no …”.

## [0.16.0] - 2026-10-16

### Added

- `RectShape.labelFill` — a frame's name in a colour of its own (a light frame line under a darker name), the stroke's
  when left out. The decoration panel sets it.
- **Symbols in the editor** — beside the board's elements, its symbols: each with how many templates and symbols
  place it by name, a new one, and the editor of one (name, `viewBox`, markup) with its problems said at once and a
  preview drawn as an element would draw it. Renaming a symbol renames its uses by name; one in use cannot be deleted.
- **Undo and Redo** in the editor, for every edit of either kind of board — the toolbar's buttons, or Ctrl+Z (⌘Z)
  and Ctrl+Shift+Z or Ctrl+Y. What is typed into one field, until focus moves on, is one step; in a field being typed
  into, Ctrl+Z is the field's own. The last 100 steps since the board was opened are kept; viewing turns them off.
  Labels `undo`, `redo`.
- The grid editor moves an item dragged onto another to that item's place (the panel's buttons still move it a
  place at a time, by keyboard too).
- The script element frame runtime keeps the clock a bounded loop asks (`__ubLoopStart`, `__ubLoopCheck` — a
  second): a server that bounds each loop of the element's code with it (U-Board's does) has a loop that never ends
  throw instead of holding the frame.
- `elementFrameLabel(hash)` and `{definition}` in `elementFrames` — a frames address with an origin per definition
  (`https://{definition}.frames.example.com/api/element-frames/<board>`); a script element's frame is loaded from the
  address with its definition's label in place.

### Fixed

- A JSON Patch `add` under a part the document does not have yet (`/symbols/valve` on a board without symbols) says
  to add that part first; a path `"/"` meant as the whole document is told the whole document is `""`.

### Changed

- **A node that gives no box takes the size of the element it places** (`ElementDefinition.size`), as an image without
  a size takes its own; a node placing a prepared widget, or an element without a size, is still 160 × 100. Every
  place that draws or measures a node — the renderer, the editor, the layout advice, anchors, the board's extent —
  asks one function, `nodeSize` (or `sizedNodes` for a board's nodes), exported from `@iyulab/u-board/domain`.
  `anchorPoint`, `coordinateOf` and `placeAt` now take a node whose size is settled.
- The editor selects a node or decoration it adds, as it already did a connector, so the panel to edit it opens at
  once.

## [0.15.0] - 2026-10-16

### Added

- **Connector arrowheads** — `style.arrow`: `none` (the default), `end` (pointing at `toNodeId`), `start` (pointing at
  `fromNodeId`) or `both`. A head is filled in the line's colour, grows with its width, and its tip touches the box it
  points at; the line stops inside it. `style.arrow` is bindable, so a flow that changes sign turns its arrow through a
  value map (`ranges: [{ max: 0, value: 'start' }, { min: 0, value: 'end' }]`). `CONNECTOR_ARROWS` and
  `STROKE_DASHES` list the words each takes.
- **`Connector.labelAt`** — where along the line its label sits, from 0 (the `fromNodeId` end) to 1 (the `toNodeId`
  end). Left out, the label stays at the middle, side-by-side connectors' labels taking turns along their line.
- The schema and strict validation know both, with the words `style.arrow` takes in the error.
- **Each connector has a place on the page.** The viewer lays a display-only mark (the pointer passes through it)
  over the box a connector's line, heads and label take, marked `data-connector-id`: its label is text for a screen
  reader and how current its bound values are is announced as a node's is — a canvas draws the line, so neither
  reached assistive technology before. A page reading the board (a test, a tool taking a picture of one connector)
  finds it there.
- **Connectors are authored in the editor.** Select two nodes (Shift + click the second) and "Connect nodes" joins
  them, the new line selected so its panel opens; click a line, its heads or its label chip to select it. The
  connector panel reverses its direction and sets its label and `labelAt`, colour, width, dash and arrowheads (named
  by the node they point at), and binds any of `CONNECTOR_BINDABLE` with the same binding editor a widget uses.
  Connectors follow their nodes, so they are selected but never dragged (canvas-kit `fixed`).
- **Delete** — a toolbar button and the Delete or Backspace key remove the selected nodes, decorations and connectors;
  a node takes the connectors that join it along.
- A node frame not showing a current headline value carries `data-quality` (`stale` or `disconnected`), as a
  connector's mark does — one attribute for how current any placed part is.
- **Frames name themselves** — a rect decoration's `label` is drawn inside it at `labelAt` (`top-start` when left
  out), `labelSize` (13) in the frame's stroke colour; `radius` rounds its corners and `dash` takes a connector's line
  styles. A text decoration's `anchor` says which point of the text its `x`/`y` is (`top-start`, the top-left, when
  left out — `center` centres it), and `background` fills a box around it. One vocabulary of nine points
  (`Placement`, `PLACEMENTS`) for both. The editor's decoration panel sets all of them; the schema, strict
  validation and the layout advice know them (a frame's name counts as a text a node can cover; a text's own
  background covers a frame edge under it).

- **A board's accent** — `accent` (a canvas or a grid view) is the colour its widgets and elements fill and highlight
  with, in place of the theme's primary colour: it sets `--u-widget-primary`, the first series colour and the ink on a
  primary fill (light, or dark on a light accent) for every widget and element on the board. Set in the editor's
  board panel; the schema and strict validation know it.
- **Shared symbols** — a document's `symbols` (`SymbolDefinition`: a `viewBox` and SVG `markup`, by name) are drawings
  every template element can place with `<use href="#name">`. Each element's isolated root receives the symbols its
  filled markup places, and those they place — so a value can choose one (`href="#state-{{state}}"`) — held to the
  template policy. Validation names a `<use>` of a symbol the document does not define, and a symbol with values.

### Changed

- `ConnectorDash` is now `StrokeDash` — the same line styles serve a connector and a frame.

## [0.14.0] - 2026-10-16

### Added

- **`Node.caption`** — a name drawn centred under a node's box, outside it, on a chip of the board's paper and over
  the connectors (viewer and editor alike). Connectors end at the box, so a device's lines meet its icon however long
  its name. The view fits it, `lintViewDocument` counts it as a text (under another node, running into a text), and
  the schema and strict validation know it.

### Changed

- `validateViewDocument` says what it got where a value is of the wrong kind — «expected true or false — got an object
  {"enum":["false"]}», «expected an array — got an object {…}», «… — it is missing».
- `applyJsonPatch` says when an operation is wrapped in `"op"`, and which fields an operation without a `path` has;
  `validateViewDocument` says when a document is wrapped in its own `"kind"`.
- **A connector's label and style can be bound** — `Connector.bindings` on `label`, `style.stroke`,
  `style.strokeWidth` and `style.dash` (`CONNECTOR_BINDABLE`), the same shape as a widget's bindings, maps included.
  `resolveDocument` reads them (`resolveConnector`; a value is taken only in the form its path draws, else the static
  value stays) and a resolved connector carries `quality` per path; a bound label not showing a current value is
  rimmed amber or grey. `bindingsIn(doc)` walks every binding of a document — widgets' and connectors' — for whatever
  needs to know what a board reads (the share routes, the attribution line). The schema and validation know them.
- **`lintViewDocument` also counts connector labels** (by their chip — under a node, running into another text) and
  **a frame's edge running through a text** (a rect decoration's stroke across a text, unless a filled rect drawn
  after the frame covers the text — a title tag). A text crossed by a connector is judged against the line as drawn,
  edge to edge and side by side. Connector placement (`placeConnectors`) is one geometry for the renderer and the advice.

## [0.13.0] - 2026-10-16

### Added

- **Editing a placed element in the property panel** — `AuthoringView` reads the board's `elements`: the widget-type
  choice lists them under "This board’s elements" (choosing one starts from its schema's defaults), the props its
  definition's schema lists get a control each — text, a choice, a number within its bounds (whole for `integer`),
  yes/no — and lists and objects stay in the JSON editor, and a binding offers those props as what it fills. An
  element is named by its name where the editor names widgets, and the type choice still shows an element the board
  no longer defines.
- **Editing the board's elements** — while nothing is selected, `AuthoringView` lists the board's elements (how each
  is drawn, where it is placed, one placed but not defined) and opens one to edit: its name (renaming moves every
  widget placing it), template or script, CSS, props schema, origins and size, with the document's own checks of the
  definition shown as it is typed and a template previewed as it is typed. A new element starts from a small template;
  one still placed cannot be deleted.
- **A script element whose code stops answering is stopped** — the page asks a running frame every two seconds
  whether it still answers (`ub:ping`/`ub:pong`) and removes one that leaves a question unanswered for six seconds, with
  a notice on its box. Where the browser runs the frame in a process of its own (Chrome and Edge with site isolation)
  the page stays usable meanwhile. A frame says it answers in its ready message, so frames from an older server are not
  asked.

### Changed

- **A connector can carry a `label` and a `style`** (`stroke`, `strokeWidth`, `dash`: `solid` | `dashed` | `dotted`),
  and is drawn from the edge of one node's box to the edge of the other's — it used to run between their centres,
  under both widgets. A label sits on a chip of the board's paper at the line's middle, over every line; connectors
  joining the same two nodes are drawn side by side. The viewer and the editor draw connectors with one function.
  (`ConnectorStyle`, `ConnectorDash` are exported types; the schema has both fields.)
- **`lintViewDocument` says where a canvas board's parts would be drawn over one another** — overlapping node boxes,
  a text decoration under a node, a connector through a text, texts running together; at most ten, then how many more.
- **`validateViewDocument` refuses a connector to a node the document does not have** (it was drawn as nothing).
- **`validateViewDocument(value, { strict: true })`** — for a document about to be written: it also refuses a field
  the format does not have, naming the fields that place has, and a decoration colour outside hex, `rgb()`/`rgba()`,
  `hsl()`/`hsla()`, CSS colour names, `transparent` and `none`. Without it, unknown fields are still ignored, so a
  document from a newer version opens.
- A decoration colour of `none` paints nothing, in the viewer and in the editor — it used to come out black, or in
  the colour of the decoration drawn before it.
- A canvas node's frame carries `data-node-id` (`NodeFrame`'s new `nodeId`) — how a page or a tool finds one node
  on screen; a grid cell already carries `data-item-id`.
- `@iyulab/u-board/domain` exports `DEFAULT_NODE_WIDTH` and `DEFAULT_NODE_HEIGHT` — the size a node without its own
  width/height is drawn at.
- `UBoardLabels` has two more labels, `elementProps` and `boardElements` (`DEFAULT_LABELS` and `KO_LABELS` carry
  them) — a host that builds a full labels object adds them.
- `@iyulab/u-widgets` ^0.33.2: a horizontal chart lists its categories in the data's order, a reference line the data
  does not reach is drawn with the value axis reaching it, its label is no longer cut off, and `status` keeps its rows
  together in a taller cell; ^0.34.0 since.
- `@canvas-kit/core` ^0.6.0, `@canvas-kit/viewer` ^0.5.2, `@canvas-kit/designer` ^0.8.0.

## [0.12.0] - 2026-10-15

### Added

- **Elements in the document format** — a board can define what no prepared widget draws, once, and place it by name:
  `elements: { <name>: ElementDefinition }` with `{ type: "element:<name>", props }` on any node or grid item. A
  definition is a `template` (HTML or SVG with `{{prop}}` values, `{{#list}}` and `{{^flag}}` sections, every value
  escaped, no script) or a `script` (code for a sandboxed frame), with a props schema (a JSON Schema subset), CSS for
  its own markup, its own size and the `https` origins it loads from.
- **Template elements are drawn** — `ViewerPage` and the editor draw each into an isolated root of its own: its CSS
  reaches only its markup, the page's does not reach in, and the board's theme arrives as `--u-widget-*` CSS variables
  (the colours of the prepared widgets). The markup policy is applied again after the values are filled, so a value
  cannot bring in a URL or CSS its template did not.
- **Script elements are drawn** — each in `<iframe sandbox="allow-scripts">` from a document its server builds, an origin
  of its own with no network, its props and the board's theme sent by message (`ub.onProps`), errors shown on its box,
  loaded as it nears the screen. `ViewerPage` and `AuthoringView` take `elementFrames`, where the frames are served;
  `elementDefinitionHash` names a definition for that address, and `elementFrameHtml`/`elementFrameScripts` build the
  frame for a server that serves one.
- `ViewerPage` and `AuthoringView` `elementOrigins` — the origins an element may load from when it also lists them;
  none by default.
- `validateViewDocument` holds definitions to the element contract and placed elements to their definitions — a
  template’s markup and CSS to the markup policy (no script, no event handler, a URL only to a fragment, an inline
  image or a declared origin), a props schema to its keyword subset, props to the schema — each problem with its path.
- `lintViewDocument` — advice on a valid document: an element placed nowhere, more than 30 script elements, an
  element heavier than 32 KB.
- The published JSON Schema describes `elements`, and names the rules it cannot express.
- `applyJsonPatch`, `getByPointer`, `JsonPatchError` — JSON Patch (RFC 6902) and JSON Pointer (RFC 6901): a document
  changed by a list of operations, entirely or not at all, with the failing operation named.

## [0.11.0] - 2026-10-15

### Added

- **A second view kind, the grid view** — widgets in order, each taking a span of a 12-column row (`GridView`,
  `GridItem`: `span`, `spanMedium`, `height`). `ViewerPage` shows it: items in order on cells, laid out to the width
  of the viewer's own container (one per row below 600px, 6 columns below 1024px, 12 above), rows as tall as their
  tallest item, each item's data quality marked as a canvas node's is; no pan or zoom, it scrolls. `AuthoringView`
  edits it: its items in order, "Add item" after the one selected, each item's width at full and medium size, its
  height and its place in the order in a layout panel above the widget's, and the layout seen at a wide, medium or
  narrow width. Importing a document of the other kind opens it in that kind's editor.
- **`emptyViewDocument(kind)`** — a document of either kind with nothing on it yet, what a new board starts as.
- **`placedIn(doc)`** — every placed widget of a document of either kind, resolved or not: the walk for code that
  looks at every binding. Both kinds place a `Placed` (`{ id, widget }`), which a canvas `Node` extends.
- **A JSON Schema of the view document**, `@iyulab/u-board/view-document.schema.json` (2020-12) — the rules
  `validateViewDocument` applies, for a reader that has only the schema.

### Changed

- **Breaking: `ViewDocument` is `CanvasView | GridView`.** Code that read `doc.nodes`, `doc.connectors`,
  `doc.background` or `doc.decorations` narrows first — `if (doc.kind === 'canvas')` — or takes a `CanvasView`;
  code that walks every widget uses `placedIn(doc)`. Likewise `ResolvedViewDocument` is
  `ResolvedCanvasView | ResolvedGridView`, `resolveDocument` returns the kind it is given, and
  `useResolvedDocument`'s `resolved` is the resolved form of the document passed. `AuthoringView`'s
  `initialDocument` and `onSave` are a `ViewDocument` — an `onSave` written for a canvas view takes the union.
- **Breaking: ids are unique across a document.** `validateViewDocument` reports an id a node, connector, decoration
  or grid item shares with another part of the same document.
- **Widgets come from `@iyulab/u-widgets` 0.33.** Bar, line and area charts take `valueAxisZero: false`, so a value
  axis spans the data instead of always reaching zero (a control chart around its centre line, a temperature near
  180 °C), and `series[].lineStyle` takes the keyword `referenceLines` uses — `'dashed'` now draws a dashed line
  where it was ignored.

## [0.10.0] - 2026-10-15

### Changed

- **Breaking: the `./demo` entry point and `DemoAdapter` are gone.** Its fixed values under the id `demo-cmms` were
  a stand-in for a data source, and they could not follow a board anywhere it was shared. Bind to a real adapter;
  a binding whose adapter is not given resolves `disconnected`, as before.
- **Breaking: a smaller public surface.** Removed exports nothing outside the package used:
  `anchorPoint`, `coordinateAt`, `pointAt` (use `coordinateOf` / `placeAt`); `QUALITY_LABEL`, `REASON_LABEL` (the
  same words are `DEFAULT_QUALITY_TEXT.quality` / `.reason`); `isViewDocumentShape` (an empty
  `validateViewDocument(value)`); `valueAtPath`, `isTimeZone`. `ViewerPage` drops its file-import mode — `document`
  is required — and with it the `noDocument` label and the `ub-viewer__error` class.
- **The entry points carry the same document types.** `ValueRange` is exported, and `./viewer` now has
  `ReferencePoint`; the package root exports everything `./domain` and `./viewer` do (so `useResolvedDocument` too).
- **Breaking: `ViewerPage`'s `initialDocument` is `document`, and it follows a new one.** A different document
  given later replaces the one shown — a board saved again while it is open — resolving its bindings and keeping the
  user's pan and zoom unless it covers a different area. Pass the same object until the document changes.
  `AuthoringView` keeps `initialDocument`: the editor owns its copy once opened.
- **Breaking: `QualityText` has `brief`** — a few words per state and per cause for the mark the renderer now shows
  on a node (below). A `QualityText` written out in full needs them; `DEFAULT_QUALITY_TEXT` and `KO_LABELS` have them.
- **Widgets come from `@iyulab/u-widgets` 0.32.** Widget text now takes the page's `--u-widget-font-family` (and
  `--u-widget-font-mono` for code); an app that set `--u-widget-shadow-hover` can drop it — nothing reads it. A chart
  axis can show the time of day alone (`xFormat: { type: 'time' }`).

### Added

- `resolvedReading(reading)` (`./domain`): a reading that found its value as the binding's result — `live`, or
  `stale` with reason `lagging`. One place for what every reader of a reference reports.
- **A node whose value is not current says why, on screen.** The renderer tags the node, just above its frame, with
  the cause of its headline binding's state and, for a stale value, its age ("Source behind · 3 minutes ago", "No
  reply from source · 30 seconds ago"), in full however narrow the node and covering none of the widget. Until now the cause and the age were in the tooltip and the screen-reader announcement
  only, so a wall display showed a source that stopped updating and one that could not be reached as the same
  dashed frame.
- **Anchored nodes keep their coordinates when the background changes.** Replacing the background image with one of
  the same size keeps its reference points (the same drawing redone); one of another size clears them and says so.
  After the points change — edited, or given again for a new image — the board panel names how many anchored nodes
  no longer sit at the coordinates they had and offers to put them back (`placeAt`) or leave them. New labels
  `referencePointsNeeded`, `anchorsMoved`, `relocateAnchors`, `keepAnchors` (`KO_LABELS` included).

### Fixed

- `ResolvedBinding.observedAt` is documented as what it is since 0.9.0: the time the source says it observed the
  value when the reference names one (`observedAtPath`), else the time it was read.

## [0.9.0] - 2026-10-10

### Changed

- **Breaking: `QualityReason` has `lagging`** (see `maxAgeSeconds` below). A `QualityText` written out in full needs
  text for it — `REASON_LABEL` and `KO_LABELS` have it. `observedAtReads` takes `{age}`.
- **Requires `@iyulab/u-widgets` 0.30.1**, whose `date` and `datetime` formats read dates as APIs write them
  (`202610092100`, `2026-10-09 21:00`) — a chart axis of such times shows dates instead of digits.

### Added

- **Bind a list item by its fields, not its position.** Picking a value inside a list's element in the binding
  form's response explorer offers to name that element by one of its fields (`pickItemBy` — "id = ST-2"); the
  HTTP connector reference then carries `item: { list, where }` and a value path inside the item. A source that
  lists its records in another order on the next read no longer moves another record's value into the binding.
  The form keeps an existing `item` when a binding is edited. New labels `pickItemBy`, `pickItemByPosition`,
  `listItem`, `clearListItem` (`KO_LABELS` included).
- **The time a source says it observed a value.** The HTTP connector reference takes `observedAtPath` — a
  pointer, read where `valuePath` is, to the source's own time for the value — and `timeZone`, the IANA zone of
  a time written without an offset. A reading's `observedAt` is then that time: an hourly measurement fetched at
  :50 says it is fifty minutes old instead of new. Epoch seconds and milliseconds, ISO 8601 and its common
  variations, and compact digits (`202610091900`, as text or as a number) are read; a field that holds no time,
  or one later than the read, makes the binding `disconnected` with reason `format`.
- **Pick the observed time in the binding form.** Once the response is explored, the form offers the fields
  that read as a time where the value is read (inside the list item when there is one) and the time zone of
  the source — filled in with the author's own for a time written without an offset — and shows what the
  picked field reads as, warning when that is later than now. A binding edited later keeps both; changing the
  list item drops the field, which was read inside it. New labels `observedAt`, `observedAtWhenRead`,
  `observedAtHint`, `timeZone`, `unknownTimeZone`, `observedAtReads`, `observedAtLater` (`KO_LABELS` included).
- **A source that falls behind shows as stale.** The HTTP connector reference takes `maxAgeSeconds`: how old
  the source's value may normally be, by the time it says it observed it, as HTTP's `max-age` says of a
  response. Older, the reading is `stale` with the new reason `lagging` — the source answered with its latest,
  but the source is behind, not the network or the binding. The binding form takes it in minutes, and shows how
  long ago the picked time field's value was observed to choose it by. `stale` now covers that case too: the
  value shown is not current. New labels `maxAge`, `maxAgeHint`, `invalidMaxAge`.
- **Anchors as coordinates.** A background image can declare two reference points — a point of the image
  and the coordinate it stands for (`referencePoints`) — and an anchored node's place is then a coordinate:
  `coordinateOf` reads it (the center of the node's box), `placeAt` places a node at one, `coordinateAt` and
  `pointAt` map any point. Each axis maps linearly; no projection is applied. `validateViewDocument` checks
  the two points are apart on both axes. New types `ReferencePoint`, `Coordinate`.
- **Place a node by coordinate in the editor.** With nothing selected, the board panel takes the background's
  two reference points (saved once all eight numbers are in and apart on both axes, cleared together). A
  node's panel anchors or frees it and, for an anchored node on such a background, shows its coordinate and
  moves it there when one is typed. New labels `referencePoints`, `referencePointsHint`, `referencePoint`,
  `imageX`, `imageY`, `coordinateX`, `coordinateY`, `referencePointsApart`, `referencePointsIncomplete`,
  `clearReferencePoints`, `anchored`, `anchorNeedsReferencePoints` (`KO_LABELS` included).
- **`@iyulab/u-board/domain` reads the HTTP connector reference.** `HttpRef`, `isHttpRef`, `readHttpRef` (a
  parsed response → the value and its observed time, or why not), `parseSourceTime`, `valueAtPath` and
  `findHttpRefItem` — the reading the hosted connector does, for a host that answers the same references.

## [0.8.0] - 2026-10-09

### Changed

- **Widgets take data as an API returns it.** A chart bound to a time series answered as one array per field
  (`{ "time": [...], "temp": [...] }`) now draws it, where the viewer showed "Invalid widget spec"; a chart or table
  bound to records with nested fields (GeoJSON `properties`) reads them by dotted path (`properties.mag`), and a
  table shows them as columns instead of `[object Object]`. A widget whose bound value still does not fit lists why in
  the board's language. Requires `@iyulab/u-widgets` 0.30, which this release depends on.

### Added

- **Where a board's data comes from, under the board.** An adapter can carry `attribution` (`{ text, url? }`,
  new type `Attribution`) — how its source asks to be credited, which open-data licenses commonly require.
  `ViewerPage`, and `AuthoringView` in view mode, name the credit of every adapter the board binds to, once each,
  on a line under the board ("Data:", `KO_LABELS` "데이터 출처:"); a link only for an http(s) `url`.
  `ViewerPage`'s new `attribution={false}` leaves the line to a host that shows it itself. New label `dataSources`.
- **A reason for an answer that cannot be read: `QualityReason` `format`.** The source answered, but in a form
  the binding cannot read — XML or HTML where JSON was needed, or a value path into plain text — which reported
  `address` ("bound value not found at the source") and sent the author looking for a wrong field.
  `REASON_LABEL.format` and `KO_LABELS` say it. A `QualityText` of your own needs a `format` entry.
- **The binding form warns about a key in the request path.** A path carrying what looks like a credential
  (`serviceKey=`, `apiKey=`, `access_token=`, …) shows `keyInPath` under it: a board keeps its paths and a share link
  hands them out. New label `keyInPath` (`KO_LABELS` included).

## [0.7.0] - 2026-10-09

### Changed

- **A widget stays inside its node.** The widget takes the node's box exactly, where before the box was only its
  minimum: in a node smaller than the widget drew itself, a gauge or chart ran past the box and over its neighbours.
  Now a chart lays itself out compactly, a gauge or image scales down whole, and a table or list scrolls inside the
  node. Requires `@iyulab/u-widgets` 0.29, which this release depends on.
- **The board's settings are in the panel.** While nothing is selected, the panel shows the board itself — its
  background image and its tone — where it showed only "Select a node."; the toolbar keeps adding, saving, the mode
  and the view, and fits one row at 1024px. Labels: `boardHeading` is new (the panel's heading), `appearance` now
  names the tone picker ("Tone", `KO_LABELS` "바탕") rather than the board, and `selectNode` says how to edit a node
  or a decoration. The `ub-authoring__appearance` class stays on the picker; the panel is `ub-panel--board`.

## [0.6.0] - 2026-10-09

### Added

- `labels.locale` — the language of the labels (`en` in `DEFAULT_LABELS`, `ko-KR` in `KO_LABELS`). The widgets on
  the board speak it (their own text, such as a table's pagination or a region's name), and the property panel
  names widget types, data fields and options in it — short names from the widget library ("Minimum", "최솟값"),
  with the library's description as the field's tooltip. With `KO_LABELS` the widgets' own text is Korean too.

- `ViewDocument.appearance` (`'light' | 'dark'`, light when absent) — the board's tone, set to match its
  background. On a dark board the widgets take their dark palette and the paper is dark (`--ub-board-bg-dark`),
  so a dark drawing's widgets read; a text decoration given no colour is drawn in a light ink there. The
  authoring toolbar picks it (`labels.appearance`, `appearanceLight`, `appearanceDark`); a light board leaves the
  field out. The validator accepts only the two values.

### Changed

- **The authoring view edits the board where its widgets are.** Each node's widget is drawn live in place on the
  editor, over the node's footprint, with its widget type named above it; the pointer passes through to the
  node, so selecting, dragging and resizing work as before. The live preview beside the editor is gone: an
  Edit / View switch in the toolbar shows the same board as a shared link does, pan and zoom kept — the editor
  has the width the two panes used to share. **Breaking:** `labels.editorHeading` and `labels.previewHeading`
  are removed and `labels.mode`, `editMode`, `viewMode` added; the class `ub-authoring__pane-heading` and the
  `ub-authoring__pane--editor`/`--preview` modifiers are gone, `ub-authoring__mode`, `ub-authoring__node` and
  `ub-authoring__node-tag` are new. The editor's accessible role is `application` (canvas-kit designer 0.7).
- **Breaking:** `labels.widgetTypeNames` is removed — the type picker names every widget type as the widget library
  does, in `labels.locale`, where the labels named three. Requires `@iyulab/u-widgets` 0.28.

## [0.5.0] - 2026-10-08

### Added

- The default stylesheet has dark fallbacks: the authoring view and the viewer follow the page's declared theme
  (`<html data-theme="dark" | "light">`) and, without one, the system preference — the rule the widgets follow.
  The board itself stays light: its paper (`--ub-board-bg`, white) and the widgets on it.
- The widget form shows each option's default where the value is left out (a gauge's range 0–100, a layout's
  default choice).
- The property panel edits a widget's values with controls: the data fields the widget library
  describes (`@iyulab/u-widgets/tools` `WIDGET_DATA_FIELDS` — a text box, a number, or a choice for a
  set of words such as a status level) and every option whose value is a text, a number, a yes/no or a
  choice (`getWidgetOptions`), each named by the library's description with its key. A value is written when its field is left; a cleared number is
  removed, so the widget's default applies; a bound field is marked. The JSON editor stays for
  everything else, folded under "Advanced", and the panel says how many options only it holds.
- The binding form picks the prop to bind from the widget's data fields — named, with the bound ones
  marked — and takes any other path when "Another path…" is chosen (or for a widget with no known
  data fields).
- Styling hooks: every element of `AuthoringView` and `ViewerPage` carries a stable class name
  (`ub-authoring`, `ub-panel`, `ub-viewer`, `ub-action`, …), and an optional default stylesheet,
  `@iyulab/u-board/styles.css`, gives them a finished look. The sheet reads `--ub-*` custom
  properties (colors, spacing, type, `--ub-panel-width`) with its own values as fallbacks, so a host
  restyles it with its own tokens, or with its own rules on the class names. Classes and tokens are
  listed in the README ("Styling").
- Label `wholeResponse`: the response explorer's name for the whole response (it was fixed Korean
  text).
- `AuthoringView` offers Export beside Save when the host saves (`onSave`): a board kept by the host
  can still be downloaded as the file Import opens — to carry it to another installation, or as a
  backup. That download does not count as saving.
- `Adapter.references()` (optional) and `AdapterReference`: an adapter with a known set of references
  lists them, and the binding form of `AuthoringView` offers them to pick from — by `label` when given
  — instead of the HTTP connector's path and value path. A binding's reference the adapter no longer
  lists stays selected. `DemoAdapter` lists its keys.
- `KO_LABELS`: every label in Korean, with times of day and ages in Korean (`timeText('ko')`,
  `ageText('ko')`), from the package root and `./viewer`. Pass it as `labels`, or lay your own words
  over it.
- `AuthoringView` sets the background image: "Background image" takes a PNG, JPEG, WebP, GIF or SVG
  file of up to 4 MB and keeps it inside the document as a `data:` URL at the image's own size in
  pixels — so a board needs no other store, opens the same on a network without internet access,
  and travels whole in a backup or an exported file — then fits the view to it; "Remove background"
  takes it away. A refused file says why (labels `setBackground`, `removeBackground`,
  `backgroundType`, `backgroundTooLarge`, `backgroundUnreadable`).
- A polling `ViewerPage` (`pollIntervalMs`) suits a board left open on a screen: it shows when its
  values were last updated, and once no update has arrived for two intervals it says it is not
  updating — an announced status — and shows every value as last known (`stale`) rather than
  current. Only a result in which some value arrived counts as an update — a viewer that reaches
  nothing does not read as "updated just now". It also re-reads within a few seconds when the page is
  shown again (`visibilitychange`, `pageshow`) instead of waiting for the next interval.
  `useResolvedDocument` returns `resolvedAt` and `stalled`.
- `Binding.map` (`ValueMap`): translates a source's value into the one a prop takes — `"Fault"` into
  a status level `"error"`, a temperature of 85 into `"error"` too. Tried in order: `values`, looked
  up by the value's text; `ranges` (`ValueRange` — `{ min?, max?, value }`, from `min` up to but not
  including `max`), the first one a number — or text that reads as one — falls in; `otherwise`;
  else the value passes through. Applied to a shown (`live`/`stale`) value before it reaches the
  prop; `validateViewDocument` checks its shape (`values`, `ranges` or both; each range a bound and
  `min` below `max`). `applyValueMap(map, value)` exported. The binding form of `AuthoringView`
  edits it — rows of source value → shown value, numeric range rows (a row with no end, or an inverted one, is named and
  keeps the binding from being saved), and a value for anything else — previews the mapped value,
  and marks a mapped binding in the list (labels `valueMapHeading`, `mapFrom`, `mapTo`,
  `addMapping`, `removeMapping`, `rangeMin`, `rangeMax`, `rangeTo`, `addRange`, `removeRange`,
  `rangeInvalid`, `mapOtherwise`, `mapOtherwisePlaceholder`, `mapped`).
- Labels `lastUpdated`, `notUpdating` and `time` (a time-of-day formatter), and `timeText(locale)` to
  build one.
- `ViewerPage` and `AuthoringView` `clock` (default `Date.now`): what a stale value's age and the
  time of the last update are measured by (`AuthoringView` passes it to its preview and binding form). `serverClock()` estimates a server's clock from the `Date` of its responses
  (`observe(response, sentAt)`), so a screen whose own clock has drifted still says "2 minutes ago"
  when it is. `toCanvasKit` takes `now`, `useResolvedDocument` takes `clock`.

### Fixed

- The binding form starts a new binding on the widget's headline value (`data.value` for `status` and
  `gauge`) while it is unbound, instead of an empty prop path whose placeholder looked filled in;
  when "Save binding" still cannot be pressed, the reason is shown beside it (and is its accessible
  description).
- The binding list shows what each binding points at (its reference, or request path and value
  path), not only its data source.
- The binding preview shows the value as text — `running`, not `"running"` — and says `live` in the
  labels' words rather than the raw quality name.
- The widget type picker names types (`widgetTypeNames`: Status, Gauge, Line chart) instead of
  showing their ids, and a new node starts with `newNodeLabel` / `newNodeValue` (Korean in
  `KO_LABELS`) instead of fixed English text.
- In `AuthoringView`, the background image and the connector lines could be selected and dragged; the
  editor then showed the board moved against its nodes while the document, and the preview, were not.
  They are drawn locked now (`@canvas-kit/core` `Shape.locked`), so a press on the drawing is a press on
  empty space.
- A widget fills its node's height: a chart in a node taller than its own default height was drawn
  at that default, leaving the rest of the box empty. In a node smaller than what a widget can draw
  in, the widget keeps its size as before.
- `AuthoringView`'s property panel has a fixed width (320 px). Sized by its content, the binding
  form's fields widened it until the editor and the live preview were squeezed to a sliver. Its
  fields are one per line, each with its label.

### Changed — breaking

- Requires `@canvas-kit/core` ^0.5.0, `@canvas-kit/designer` ^0.6.0 and `@canvas-kit/viewer` ^0.5.1
  (`Shape.locked`, which keeps the background and connector lines in place in the editor).
- The binding form no longer recognises the demo adapter by its id: a string reference is picked
  from `Adapter.references()`, and the form starts on the first adapter given (it used to skip the
  demo adapter) — list the adapter to start on first. Label `demoReference` is now `reference`, with
  a new `chooseReference` for the picker's empty line.
- The `react` and `react-dom` peer range is `^19.2.0` (was `^19.0.0`): the views read the clock
  through `useEffectEvent`, which React 19.2 introduced.
- `UBoardLabels` has new required members — `lastUpdated`, `notUpdating`, `time` and the value-map
  form's `valueMapHeading`, `mapFrom`, `mapTo`, `addMapping`, `removeMapping`, `mapOtherwise`,
  `mapOtherwisePlaceholder`, `mapped`, the response explorer's `wholeResponse`, and the authoring
  view's `widgetTypeNames`, `newNodeLabel`, `newNodeValue`, `bindingNeedsPropPath`,
  `bindingNeedsReference`, `previewLive`, `widgetData`, `widgetOptions`, `boundField`, `choiceDefault`,
  `advancedProps`, `moreInAdvanced`, `choosePropPath`, `otherPropPath` and `typedPropPath`. Code that builds a whole `UBoardLabels` (rather than the
  `Partial` the components' `labels` prop takes) must add them; spreading `DEFAULT_LABELS` covers it.
- The components no longer set their own look inline — spacing, type, borders and button looks come
  from `styles.css`; import it, or style the class names. Without it the views still work, with the
  browser's own controls. Colors that carry meaning stay inline and read tokens: failure messages
  (`--ub-error`), the viewer's "not updating" notice (`--ub-warning`, `--ub-warning-bg`) and node frames
  (`--ub-quality-stale`, `--ub-quality-disconnected`). Failure messages are announced (`role="alert"`).

### Changed

- Requires `@iyulab/u-widgets` `^0.27.0`: its option metadata (types, choices, defaults) drives the widget form,
  and its widgets follow the page or system theme when the page declares none — which is why the board pins its
  widgets to the light palette (above).
- Requires `@canvas-kit/viewer` `^0.5.0` (was `^0.4.0`; nothing here changes with it).
- Requires `@iyulab/u-widgets` `^0.26.3` (was `^0.24.0`). Widgets' own built-in text — region names,
  fallback cards — now goes through the u-widgets locale table, so a host can translate it with
  that library's `registerLocale`/`setDefaultLocale`. From 0.26.3 a widget element
  carrying the `hidden` attribute stops drawing (it used to stay visible).

## [0.4.0] - 2026-10-05

### Added

- `validateViewDocument(value)` checks every field the `ViewDocument` type promises — nodes,
  widgets, bindings, connectors, decorations and the background — and returns each problem as an
  RFC 6901 pointer with a message (`ViewDocumentIssue`). It leaves a binding's `ref` and a widget's
  `type`/`props` opaque and ignores unknown fields. `parseViewDocument` reports the same issues
  through `InvalidViewDocumentError.issues`.
- `ResolvedBinding.observedAt` and `ResolvedWidget.observedAt` (ISO 8601): when a `live` or
  `stale` value was obtained from its source, so a host can tell a last-known value of seconds ago
  from one of days ago. The hosted HTTP connector reports it.
- Connection-quality text for hosts that render their own UI: `QUALITY_LABEL`, `REASON_LABEL`,
  `worstQuality` and `describeQuality(widget, { text, now })`, exported from the package root and
  from `@iyulab/u-board/domain`. For a `stale` value with an `observedAt`, the text says how long ago
  it was obtained ("5 minutes ago") — in the canvas tooltip, the screen-reader announcement and the
  binding preview. `ageText(locale)` builds those words for another language.
- `ViewerPage` and `AuthoringView` fill their container when `width`/`height` are omitted, open with
  the whole document fitted into view (shrunk to fit, never magnified), and stay fitted as the
  container resizes until the user pans or zooms. "Fit to view" and zoom in/out controls sit next to
  the view, and the view pans and zooms from the keyboard. `ViewerPage` takes an `ariaLabel` for the
  board view (default "Board").
- In `AuthoringView`, the editor and the live preview share one pan/zoom, and a new node or
  decoration is placed where the author is looking. In the editor, a drag across empty space
  selects several nodes and decorations to move together (one undo step); Space + drag or the
  middle mouse button pans; the editor works from the keyboard (arrows move the selection or pan,
  Tab steps through the items, Escape clears the selection). While several items are selected, the
  side panel says how many instead of showing one item's properties.
- `labels` on `AuthoringView` and `ViewerPage` replaces any of the text they show (`UBoardLabels`,
  English defaults in `DEFAULT_LABELS`), including the words for connection quality.
  `describeQuality` takes the same words as its `text` option (`QualityText`,
  `DEFAULT_QUALITY_TEXT`).

### Changed

- `isViewDocumentShape` is now the type guard for `validateViewDocument` — it checks the whole
  document, not only the top-level fields, so it rejects documents it used to accept.
- Requires `@iyulab/u-widgets` 0.24.
- Requires `@canvas-kit/core` 0.4, `@canvas-kit/viewer` 0.4 and `@canvas-kit/designer` 0.5.
- `AuthoringView` no longer shows the edited document as JSON below the editor; pass
  `showDocumentSource` to keep that development aid.
- The node property panel and the decoration panel show English by default, like the rest of the
  components; they used to be in Korean. Pass `labels` to show another language.

### Fixed

- A widget keeps its static value when its binding is `disconnected`; only `live` and `stale`
  readings are merged into its props, as the API reference states. A numeric binding path segment
  (`items.1.value`) updates one array element instead of replacing the array with an object.
- Text decorations without a fill color are drawn in the viewer, the live preview and the share
  page; they were invisible there while the editor showed them. Text sits at the same place in the
  editor and the viewer (the viewer used to draw it one line higher).
- Fitting a document into view takes in the full box of each text decoration, not only its anchor
  point.
