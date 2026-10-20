# Drawing boards with an AI assistant (MCP)

U-Board has no AI in it. It is the engine an assistant draws with: an assistant that speaks the
[Model Context Protocol](https://modelcontextprotocol.io) reads and changes a workspace's boards and
data sources through [`@iyulab/u-board-mcp`](../packages/mcp/README.md) on npm, a small MCP server that talks to a
U-Board server with a workspace API token.

## Set it up

1. In the console, open the workspace settings and, under **API 토큰**, make a token — `write` to let the
   assistant draw, `read` to let it only look. Copy it: it is shown once.
2. Give the assistant the MCP server with two settings: `UBOARD_URL`, where your U-Board server is, and
   `UBOARD_TOKEN`, the token — for example, with Claude Code:

   ```sh
   claude mcp add u-board --env UBOARD_URL=https://board.example.com --env UBOARD_TOKEN=ubt_… -- npx -y @iyulab/u-board-mcp
   ```

   The package's README shows the configuration for other clients.

The token acts as you, in that one workspace. It never carries a data source's credential: a source that
needs a key, a token or OAuth is set up by a person in the console, and the assistant uses it by its id.

## What the assistant can do

| Tool | What it does |
|---|---|
| `describe` | Explains the board format to the assistant, a topic at a time: `rules` first (with triggers — what a viewer does when a part is clicked, an element raises an event or a state changes), then `canvas` (coordinates, connectors, decorations, colours), `data` (sources and bindings), `elements`, `components` (a group of parts drawn once per instance, each with its own values), `mixed` (a canvas in a grid cell — a plan among cards), the prepared widgets (searchable by what they should show, each example in the form a board places it) and the JSON Schema by pointer. |
| `list_boards`, `get_board` | Reads boards — one part of a document at a time, by JSON Pointer. |
| `create_board`, `patch_board`, `delete_board` | Makes a board, changes it with JSON Patch (RFC 6902) on a revision — each answer carries the new revision and advice — and deletes one for good. |
| `rename_board` | Renames a board; its id — and so the links it is shared by and its history — stays. |
| `edit_board` | Makes the edits that change a board in more than one place, as the editor does — rename or remove an element, a symbol or a component, remove parts with the lines and triggers that name them, make a component, detach an instance — and saves what they changed as one JSON Patch on the revision it read. `dryRun` answers the patch and the checks without saving. |
| `validate` | Checks a document, or a board with a patch, without saving. |
| `board_state` | What a saved board shows now — each part’s state, its connection quality and why, how old its data is — without values or a picture. |
| `look` | Draws a saved board as its viewers see it and answers a picture, with what went wrong while drawing — an element's error, a widget whose content runs past its box, values not live — and the advice saving gave that still stands, such as parts drawn over one another — first a one-line status: done, or how many problems and pieces of advice are left. It can show one part up close (with only that part's problems and advice), or the board on the other paper. |
| `list_sources`, `sample_source`, `create_source` | Lists the data sources (with the description of the paths each answers), answers what a source's response looks like (each value's JSON Pointer and type, and the fields that tell a list's items apart), and makes a source that needs no credential — with, for a source that answers an error with success, where it says so. |

## How it stays reliable and light

- **One format, checked the same way everywhere.** What the assistant writes is the board document the
  console edits — validated by the same rules ([`api-reference.md`](api-reference.md), the published JSON
  Schema), with every problem named by its path and, where there is something to say, what to do instead.
- **Small changes, not whole documents.** The assistant reads the part it needs by pointer and sends a
  patch; the server applies it to the board as saved and saves it only on that revision, so two writers
  never overwrite each other unseen.
- **Draw once, place many times.** What no prepared widget draws is an element the board defines once —
  a template of HTML or SVG and CSS, isolated from the rest of the page, or a script in a sandboxed frame
  with no network ([`concepts.md`](concepts.md) — Element) — and places by name as often as needed.
- **The assistant sees what it drew.** `look` draws the board in a browser on the assistant's computer (installed
  Chrome or Edge, or the one `UBOARD_BROWSER` names) through the server's own share viewer, so the picture is what
  viewers see. The token goes on the server's API requests only — never into the page or its address — and the
  server needs nothing extra to run.
- **It tells the assistant what it sent.** Saving answers advice where parts would be drawn over one another, and
  an error names what came where something else was expected («expected an array — got an object …») — an
  assistant does not re-read its own output. A refused first document makes no board.
- **It works with open models, not only hosted ones.** The tools' inputs declare their shape and never use the
  empty schema for an open object, which some open-model tool-call parsers rewrite values under; the same board
  has been drawn through it by a 27B open model served with an OpenAI-compatible API.
- **Data comes through bindings only.** An element or widget never reaches a data source itself: a binding
  names a source and a value in its response, and the server reads it, within the addresses the
  installation allows.
