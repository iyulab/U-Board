# Changelog — @iyulab/u-board-mcp

All notable changes to this package are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the package follows
[Semantic Versioning](https://semver.org/) — below 1.0, a minor release may contain breaking changes.

## [Unreleased]

### Changed

- `look` reports text that reads under 3:1 against what is actually drawn behind it (measured on the picture, so a
  panel painted under a widget counts) — on either paper. A focused part is taken with room around it (at least half
  its size), so what spills past its box shows.
- The `canvas` and `data` topics teach a connector's `bindings` (label and style from live values).
- The `canvas` topic teaches a node's `caption` — a device's name under its icon, with the box kept icon-sized.

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
