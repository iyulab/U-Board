# @iyulab/u-board-mcp

An [MCP](https://modelcontextprotocol.io) server that lets an AI assistant read and draw the boards of a
U-Board workspace — its own words to the assistant are in the tools it offers, starting with
`describe({ topic: "rules" })`.

It talks to a U-Board server with a **workspace API token**: in the console, open the workspace settings,
and under **API 토큰** make a token (`write` to draw, `read` to look). The token acts as you, in that
workspace only, and never handles a data source's credentials — you enter those in the console.

## Run it

```sh
UBOARD_URL=https://board.example.com UBOARD_TOKEN=ubt_… npx -y @iyulab/u-board-mcp
```

With Claude Code:

```sh
claude mcp add u-board --env UBOARD_URL=https://board.example.com --env UBOARD_TOKEN=ubt_… -- npx -y @iyulab/u-board-mcp
```

In a client's JSON configuration:

```json
{
  "mcpServers": {
    "u-board": {
      "command": "npx",
      "args": ["-y", "@iyulab/u-board-mcp"],
      "env": { "UBOARD_URL": "https://board.example.com", "UBOARD_TOKEN": "ubt_…" }
    }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `describe` | What a board can hold and how to write one: `rules` (read first), `canvas`, `data`, `elements`, `widgets` (with a `query` for only the matching ones), `widget:<type>` (examples as `{ type, props }`), `schema` (with a JSON Pointer for one part). |
| `list_boards` | The workspace's boards. |
| `get_board` | A board, or one part of its document by JSON Pointer, with its revision. |
| `create_board` | A new board of a kind (`grid` or `canvas`), optionally with a first document. |
| `patch_board` | Changes part of a board with a JSON Patch (RFC 6902) on a revision; answers the new revision and advice. |
| `edit_board` | Makes the edits that change a board in more than one place, as the editor does — rename or remove an element, a symbol or a component, remove parts with their lines, make or detach a component — saved as one JSON Patch; `dryRun` checks without saving. |
| `rename_board` | Renames a board; its id, share links and history stay. |
| `delete_board` | Deletes a board for good (marked destructive, so a client can ask first). A data source is removed in the console. |
| `validate` | Checks a document, or a board with a patch, without saving. |
| `look` | A picture of a saved board as its viewers see it, with what went wrong while drawing; `focus` one part, or `appearance` the other paper. Needs Chrome or Edge on this computer, or `UBOARD_BROWSER`. |
| `list_sources` | The workspace's data sources — never a credential. |
| `sample_source` | What a source's response looks like: each value's JSON Pointer, type and example, and the fields that tell a list's items apart. |
| `create_source` | A data source that needs no credential; one that does is made by a person in the console. |

Reads take a JSON Pointer so only the part needed travels, and a change is a patch answered with the new
revision — the document is never sent back. Every answer is compact JSON.

## License

AGPL-3.0-or-later, with a commercial license available — see the repository.
