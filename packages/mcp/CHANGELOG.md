# Changelog — @iyulab/u-board-mcp

All notable changes to this package are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the package follows
[Semantic Versioning](https://semver.org/) — below 1.0, a minor release may contain breaking changes.

## [Unreleased]

### Added

- `describe("components")` teaches components — a group of canvas parts defined once and drawn per instance with its own
  parameter values: when to use one, `{{param}}`, the `<instance id>/<part id>` names, where an issue is reported.
- `look` checks the parts component instances draw, reporting a problem at the part's node in the component and naming
  the instance; `focus: "/instances/1"` shows one instance, with what is said of its component.

### Fixed

- Widget advice judges a component's widgets as each instance draws them, its parameters filled in, rather than the
  `{{name}}` they are written with.

## [0.9.0] - 2026-10-17

### Added

- The rules teach a connector's `style.route: "orthogonal"` — pipes and wiring with right-angle turns.

### Fixed

- `look` no longer reports bold text on a gradient as reading at 1:1: the colour behind a text is the commonest one
  in its box other than its own ink — the glyph's pixels could outnumber each step of the gradient. Text drawn on its
  own colour is still reported.

### Changed

- `@iyulab/u-board` `^0.21.0` — a patch naming a member an object does not have says what the object has and where
  the member is; `@iyulab/u-widgets` `^0.35.2` — `describe("widget:chart.gantt")` says `color` groups its bars.

## [0.8.0] - 2026-10-17

### Added

- `look` answers a one-line `status` first: `done — nothing to fix`, or how many problems and pieces of advice are left
  (for the part, when it looks up close). The count includes the layout advice folded past the list's limit, and up
  close every finding about the part is kept, even one the whole board's list would fold.

### Fixed

- `look` with `focus` answers only that part's problems, as it already did its advice — it gave the whole board's
  problems while its status counted them as the part's.

### Changed

- `@iyulab/u-board` `^0.20.0`.

## [0.7.1] - 2026-10-16

### Changed

- `@iyulab/u-board` `^0.19.0`.

## [0.7.0] - 2026-10-16

### Added

- `describe("rules")` teaches triggers: their shape, the five events and four actions, how an element raises an event
  (`data-ub-event`, `ub.emit`), that a link fills only `{{node}}`, `{{state}}`, `{{board}}`, and that showing another
  board is the host’s to do.

### Changed

- `@iyulab/u-widgets` `^0.35.0` — the widget examples and option lists `describe` answers come from it.

## [0.6.0] - 2026-10-16

### Added

- The `board_state` tool — what a saved board shows now, part by part (state, connection quality and why, how old its
  data is), without values. The rules name it as the cheap check before `look`; `describe("data")` teaches `states`.

## [0.5.0] - 2026-10-16

### Added

- The `canvas` topic teaches a frame name's own colour, `labelFill`.

### Changed

- The `canvas` topic says a node without a box takes its element's size; `look` measures the board the same way.
- The `elements` topic says how a symbol's parts are styled: in the symbol, or by what they inherit from the `<use>` —
  an element's CSS selectors do not reach into what a `<use>` draws.

### Fixed

- `look` answers the advice that still stands with its picture — parts drawn over one another, as saving reported
  them. A picture with no drawing problems no longer reads as a board without faults; with `focus`, only that part's
  advice.

## [0.4.0] - 2026-10-16

### Added

- `look` can `focus` a connector (`"/connectors/2"`) — its line, heads and label up close.
- The `canvas` topic teaches a connector's `arrow` (and binding it to a value's sign) and `labelAt`.
- The `canvas` topic teaches a frame's own name (`label`, `labelAt`), `radius` and `dash`, and a text's `anchor` and
  `background` — a frame no longer needs a separate text for its name, nor a tag a rect behind it.
- `delete_board` — deletes a board for good, marked destructive so a client can ask first. A data source is still
  removed by a person in the console.
- The `elements` topic teaches document `symbols` — drawings every template element places with `<use href="#name">`.
- The rules teach a board's `accent` — the colour to set instead of fixing one in a widget or an element.

### Changed

- `look`'s `quality` counts the parts — nodes, grid items and now connectors — by the quality they show (`stale`,
  `disconnected`) instead of by the words on a node's mark, so a connector whose bound label or style is not current is
  counted too.

### Fixed

- `look` no longer reports text kept for a screen reader alone (in a box of a pixel) as reading poorly against the
  picture.

## [0.3.0] - 2026-10-16

### Changed

- `create_board` makes no board when its first document is refused: the document is checked first, as the server
  would, and a board the server then refuses is taken away again — failed attempts used to leave empty boards.
- The tools' inputs declare their shape: a patch operation is `{ op, path, value?, from? }` and a document needs
  `kind`; an operation or a document nested in its own first key is refused with what to write instead.
- Open objects in the tools' inputs are written `additionalProperties: true`, never the empty schema `{}`: a widely
  used open-model tool-call parser rewrites the values under an empty schema (arrays came back as objects), so the
  model was refused for what it never sent. A test keeps `{}` out.
- `look` reports text that reads under 3:1 against what is actually drawn behind it (measured on the picture, so a
  panel painted under a widget counts) — on either paper. A focused part is taken with room around it (at least half
  its size), so what spills past its box shows.
- The `canvas` and `data` topics teach a connector's `bindings` (label and style from live values).
- The `canvas` topic teaches a node's `caption` — a device's name under its icon, with the box kept icon-sized.

- `@iyulab/u-board` ^0.14.0.
## [0.2.0] - 2026-10-16

### Added

- **`look`** — draws a saved board as its viewers see it, in Chrome or Edge on this computer (or the browser
  `UBOARD_BROWSER` names), through the server's share viewer, and answers a picture with a report: how big it was
  drawn, an element's error or notice, a widget whose content runs past its box, how many values are not live, and
  the page's own errors. `focus` takes a JSON Pointer to one node, grid item or decoration; `appearance` draws it on
  the other paper. The token goes on the server's API requests only. Needs a server that lets a workspace API token
  read through its share routes (U-Board 0.4.0).

### Changed

- The rules tell an assistant that a script element's code must always return.
- `describe` answers in smaller topics: `rules` is the workflow, JSON Patch, the kinds and how a widget's props are
  written; `canvas` (new) gives coordinates, default sizes, connectors, decorations, colours and drawing order; `data`
  (new) holds sources and bindings. `widgets` lists one line per widget by category and takes a `query`;
  `widget:<type>` gives its examples as a board places them (`{ type, props }`).
- An unknown id (404) answers with where to find the ids.
- The `canvas` topic teaches a connector's `label` and `style`, and that links between the same nodes are drawn
  side by side.
- `validate`, `create_board` and `patch_board` advise on the prepared widgets they check or write, with the widget
  library's own check (`checkSpec`): a type it does not have (and a near spelling), a prop no widget reads, an option
  the widget does not have or of the wrong type. A prop a binding fills is not reported.
- `validate` checks as the server saves: a field the document format does not have, a decoration colour a canvas
  cannot read and a connector to a missing node are issues, each naming what that place takes.
- `@iyulab/u-board` ^0.13.0, `@iyulab/u-widgets` ^0.34.0 (its `checkSpec`), `playwright-core` ^1.64.1 (for `look`).

## [0.1.0] - 2026-10-15

### Added

- The first release: an MCP server that lets an AI assistant read and draw the boards of a U-Board workspace
  through a workspace API token (`UBOARD_URL`, `UBOARD_TOKEN`), run with `npx -y @iyulab/u-board-mcp`.
- Tools: `describe` (the rules for writing a board, elements, the JSON Schema by pointer, the prepared widgets),
  `list_boards`, `get_board` (one part of a document by JSON Pointer), `create_board`, `patch_board` (JSON Patch on
  a revision, answering the new revision and advice), `validate` (without saving), `list_sources`, `sample_source`
  (what a data source's response looks like, not the response itself) and `create_source` (a source that needs no
  credential). Answers are compact, and a failure says what to do next.
