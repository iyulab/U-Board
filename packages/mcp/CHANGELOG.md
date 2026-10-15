# Changelog — @iyulab/u-board-mcp

All notable changes to this package are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the package follows
[Semantic Versioning](https://semver.org/) — below 1.0, a minor release may contain breaking changes.

## [Unreleased]

### Changed

- The rules tell an assistant that a script element's code must always return.
- `describe` answers in smaller topics: `rules` is the workflow, JSON Patch, the kinds and how a widget's props are
  written; `canvas` (new) gives coordinates, default sizes, connectors, decorations, colours and drawing order; `data`
  (new) holds sources and bindings. `widgets` lists one line per widget by category and takes a `query`;
  `widget:<type>` gives its examples as a board places them (`{ type, props }`).
- An unknown id (404) answers with where to find the ids.
- `validate` checks as the server saves: a field the document format does not have, a decoration colour a canvas
  cannot read and a connector to a missing node are issues, each naming what that place takes.

- `@iyulab/u-widgets` ^0.33.2.

## [0.1.0] - 2026-10-15

### Added

- The first release: an MCP server that lets an AI assistant read and draw the boards of a U-Board workspace
  through a workspace API token (`UBOARD_URL`, `UBOARD_TOKEN`), run with `npx -y @iyulab/u-board-mcp`.
- Tools: `describe` (the rules for writing a board, elements, the JSON Schema by pointer, the prepared widgets),
  `list_boards`, `get_board` (one part of a document by JSON Pointer), `create_board`, `patch_board` (JSON Patch on
  a revision, answering the new revision and advice), `validate` (without saving), `list_sources`, `sample_source`
  (what a data source's response looks like, not the response itself) and `create_source` (a source that needs no
  credential). Answers are compact, and a failure says what to do next.
