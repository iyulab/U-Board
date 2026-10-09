# Changelog — @iyulab/u-board

All notable changes to this package are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the package follows
[Semantic Versioning](https://semver.org/) — below 1.0, a minor release may contain breaking changes.

## [Unreleased]

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
