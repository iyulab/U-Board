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
| `describe` | What a board can hold and how to write one: `rules` (read first — how the tools change a board, then the board language), `kind:<name>` (a kind of part in full — its options with their types and defaults; several by commas, `kind:stat,chart.bar`, up to 8 in one read), `schema` (with a JSON Pointer for one part). |
| `list_boards` | The workspace's boards. |
| `get_board` | A board, or one part of it by JSON Pointer (`/parts/pump`), with its revision. |
| `create_board` | A new board of a kind (`grid` or `canvas`), empty or with a first board. |
| `patch_board` | Changes part of a board with a JSON Patch (RFC 6902) on a revision; answers the new revision and advice. |
| `edit_text` | Changes words inside strings of a board — an element's CSS or markup, a title — without sending the whole string: each edit names the string by JSON Pointer and the text to replace, which stands once in it; all are made or none; answers the new revision and advice. `UBOARD_EDIT_TEXT=0` leaves it out. |
| `rename_board` | Renames a board; its id, share links and history stay. |
| `delete_board` | Deletes a board for good (marked destructive, so a client can ask first). A data source is removed in the console. |
| `validate` | Checks a board, a board with a patch, or — with neither — the board as it is saved, without saving. |
| `look` | A picture of a saved board as its viewers see it, with what went wrong while drawing; `focus` one part (`/parts/<id>`), or `appearance` the other paper. Needs Chrome or Edge on this computer, or `UBOARD_BROWSER`. |
| `list_sources` | The workspace's data sources — never a credential; a static one with the paths it answers and whether its answers are example data. |
| `sample_source` | What a source's response looks like: each value's JSON Pointer, type and example, and the fields that tell a list's items apart. |
| `create_source` | A data source that needs no credential — an API, or one that answers what is stored in it by path (example values when no source has them yet); one that needs a credential is made by a person in the console. |

Reads take a JSON Pointer so only the part needed travels, and a change is a patch answered with the new
revision — the document is never sent back. Every answer is compact JSON.

Every tool states its [MCP tool annotations](https://modelcontextprotocol.io/specification/2025-06-18/server/tools#tool), so a client can run a read without asking
and ask before a change: the tools that only read (`describe`, `list_boards`, `get_board`, `get_bundle`, `board_state`, `validate`, `look`,
`list_sources`, `describe_source`, `sample_source`) are `readOnlyHint`; the ones that may overwrite or remove what stands there (`patch_board`,
`edit_text`, `put_bundle`, `delete_board`) are `destructiveHint`; the ones that only add (`create_board`, `create_source`) or only rename (`rename_board`)
say `destructiveHint: false`. `openWorldHint` is `false` for the tools that read or write only the workspace's own records, and `true` where the
answer comes from a data source or from drawing a board from its data.

### A board as files (optional)

Start with `--bundle` (or `UBOARD_BUNDLE=1`) and two more tools read and write the same board as files — for an assistant that edits an
element's markup, style and script more than it moves parts. The board is still one stored document; the files are a way to read and write it.

| Tool | What it does |
|---|---|
| `get_bundle` | The board as files: `board.json` (parts, layout, states, skin — where an element's code or the background picture moved out it holds `{ "$file": path }`), `elements/<name>.html`, `.css`, `.js` (a name that is not word characters and dashes is percent-encoded) and `background.svg`. Without `files`: the list with sizes and `board.json`; with `files`: the text of those. |
| `put_bundle` | Saves the board from files, checked as any change is: `files` replace the files of the same path, `edits` (`{ file, old, new }`) change a file in place — `old` stands exactly once in it — so a long style is not sent again for a small change; the rest stays. An issue names the file it is in. |

## In your own app

The tools are not tied to the MCP server. `@iyulab/u-board-mcp/tools` hands a host the same tools to give its own model — a chat
panel in an admin screen, say — with nothing that needs Node, and `DocumentBoardStore` keeps the board in your app instead of on a U-Board
server: it checks every change as a server would, answers with the new revision, and calls your `save` before it says "saved".

```ts
import { boardTools, DocumentBoardStore, functionTool } from '@iyulab/u-board-mcp/tools';

const store = new DocumentBoardStore(await loadBoardFromMyDatabase(), {
  name: 'Line 3',
  revision: row.revision,
  save: document => saveBoardToMyDatabase(document), // rejects → the change is undone and the model is told
});
const tools = boardTools(store); // get_board, patch_board, edit_text, validate, describe …
const forYourModel = tools.map(functionTool); // chat-completions `tools`; call `tool.run(args)` for each call the model makes
```

A store that holds one board is offered the tools about that board; a store that is a whole workspace on a U-Board server
(`UBoardClient`) is offered the ones about lists and data sources too. Draw the saved board with `@iyulab/u-board/viewer` for the people who
only read it, and write the board's data side — what each `of` reads — as an adapter of your own.

## License

MIT.
