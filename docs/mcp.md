# Drawing boards with an AI assistant (MCP)

U-Board has no AI in it. It is the engine an assistant draws with: an assistant that speaks the
[Model Context Protocol](https://modelcontextprotocol.io) reads and changes a workspace's boards and
data sources through `packages/mcp` (`u-board-mcp`), a small MCP server that talks to a U-Board server
with a workspace API token.

## Set it up

1. In the console, open the workspace settings and, under **API 토큰**, make a token — `write` to let the
   assistant draw, `read` to let it only look. Copy it: it is shown once.
2. Give the assistant the MCP server with two settings: `UBOARD_URL`, where your U-Board server is, and
   `UBOARD_TOKEN`, the token. The package's README shows the configuration for common clients.

The token acts as you, in that one workspace. It never carries a data source's credential: a source that
needs a key, a token or OAuth is set up by a person in the console, and the assistant uses it by its id.

## What the assistant can do

| Tool | What it does |
|---|---|
| `describe` | Explains the board format to the assistant: `rules` first, then `elements`, the JSON Schema by pointer, the prepared widgets. |
| `list_boards`, `get_board` | Reads boards — one part of a document at a time, by JSON Pointer. |
| `create_board`, `patch_board` | Makes a board and changes it with JSON Patch (RFC 6902) on a revision; each answer carries the new revision and advice. |
| `validate` | Checks a document, or a board with a patch, without saving. |
| `list_sources`, `sample_source`, `create_source` | Lists the data sources, answers what a source's response looks like (each value's JSON Pointer and type, and the fields that tell a list's items apart), and makes a source that needs no credential. |

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
- **Data comes through bindings only.** An element or widget never reaches a data source itself: a binding
  names a source and a value in its response, and the server reads it, within the addresses the
  installation allows.
