# Changelog — @iyulab/u-board

All notable changes to this package are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the package follows
[Semantic Versioning](https://semver.org/) — below 1.0, a minor release may contain breaking changes.

## [Unreleased]

### Added

- A polling `ViewerPage` (`pollIntervalMs`) suits a board left open on a screen: it shows when its
  values were last updated, and once no update has arrived for two intervals it says it is not
  updating — an announced status — and shows every value as last known (`stale`) rather than
  current. Only a result in which some value arrived counts as an update — a viewer that reaches
  nothing does not read as "updated just now". It also re-reads within a few seconds when the page is
  shown again (`visibilitychange`, `pageshow`) instead of waiting for the next interval.
  `useResolvedDocument` returns `resolvedAt` and `stalled`.
- `Binding.map` (`ValueMap`): translates a source's value into the one a prop takes — `"Fault"` into
  a status level `"error"` — looked up by the value's text, with `otherwise` for a value with no
  entry (else it passes through). Applied to a shown (`live`/`stale`) value before it reaches the
  prop; `validateViewDocument` checks its shape. `applyValueMap(map, value)` exported. The binding
  form of `AuthoringView` edits it — rows of source value → shown value and a value for anything
  else — previews the mapped value, and marks a mapped binding in the list (labels
  `valueMapHeading`, `mapFrom`, `mapTo`, `addMapping`, `removeMapping`, `mapOtherwise`,
  `mapOtherwisePlaceholder`, `mapped`).
- Labels `lastUpdated`, `notUpdating` and `time` (a time-of-day formatter), and `timeText(locale)` to
  build one.
- `ViewerPage` and `AuthoringView` `clock` (default `Date.now`): what a stale value's age and the
  time of the last update are measured by (`AuthoringView` passes it to its preview and binding form). `serverClock()` estimates a server's clock from the `Date` of its responses
  (`observe(response, sentAt)`), so a screen whose own clock has drifted still says "2 minutes ago"
  when it is. `toCanvasKit` takes `now`, `useResolvedDocument` takes `clock`.

### Fixed

- `AuthoringView`'s property panel has a fixed width (320 px). Sized by its content, the binding
  form's fields widened it until the editor and the live preview were squeezed to a sliver. Its
  fields are one per line, each with its label.

### Changed — breaking

- `UBoardLabels` has new required members — `lastUpdated`, `notUpdating`, `time` and the value-map
  form's `valueMapHeading`, `mapFrom`, `mapTo`, `addMapping`, `removeMapping`, `mapOtherwise`,
  `mapOtherwisePlaceholder`, `mapped`. Code that builds a whole `UBoardLabels` (rather than the
  `Partial` the components' `labels` prop takes) must add them; spreading `DEFAULT_LABELS` covers it.

### Changed

- Requires `@canvas-kit/viewer` `^0.5.0` (was `^0.4.0`; nothing here changes with it).
- Requires `@iyulab/u-widgets` `^0.26.1` (was `^0.24.0`). Widgets' own built-in text — region names,
  fallback cards — now goes through the u-widgets locale table, so a host can translate it with
  that library's `registerLocale`/`setDefaultLocale`.

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
