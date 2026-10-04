# Changelog — @iyulab/u-board

All notable changes to this package are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the package follows
[Semantic Versioning](https://semver.org/) — below 1.0, a minor release may contain breaking changes.

## [Unreleased]

### Added

- `validateViewDocument(value)` checks every field the `ViewDocument` type promises — nodes,
  widgets, bindings, connectors, decorations and the background — and returns each problem as an
  RFC 6901 pointer with a message (`ViewDocumentIssue`). It leaves a binding's `ref` and a widget's
  `type`/`props` opaque and ignores unknown fields. `parseViewDocument` reports the same issues
  through `InvalidViewDocumentError.issues`.
- Connection-quality text for hosts that render their own UI: `QUALITY_LABEL`, `REASON_LABEL`,
  `worstQuality` and `describeQuality`, exported from the package root and from
  `@iyulab/u-board/domain`.
- `ViewerPage` and `AuthoringView` fill their container when `width`/`height` are omitted, open with
  the whole document fitted into view (shrunk to fit, never magnified), and stay fitted as the
  container resizes until the user pans or zooms. "Fit to view" and zoom in/out controls sit next to
  the view, and the view pans and zooms from the keyboard. `ViewerPage` takes an `ariaLabel` for the
  board view (default "Board").
- In `AuthoringView`, the editor and the live preview share one pan/zoom, and a new node or
  decoration is placed where the author is looking.

### Changed

- `isViewDocumentShape` is now the type guard for `validateViewDocument` — it checks the whole
  document, not only the top-level fields, so it rejects documents it used to accept.
- Requires `@iyulab/u-widgets` 0.24.

### Fixed

- A widget keeps its static value when its binding is `disconnected`; only `live` and `stale`
  readings are merged into its props, as the API reference states. A numeric binding path segment
  (`items.1.value`) updates one array element instead of replacing the array with an object.
- Text decorations without a fill color are drawn in the viewer, the live preview and the share
  page; they were invisible there while the editor showed them. Text sits at the same place in the
  editor and the viewer (the viewer used to draw it one line higher).
- Fitting a document into view takes in the full box of each text decoration, not only its anchor
  point.
