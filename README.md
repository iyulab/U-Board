# U-Board

Spatial dashboard authoring middleware. Build data-bound views on a canvas — a floor plan, a
network diagram, a map, or a freeform layout — and embed the result anywhere on the web.

![A pump room drawn as the background, with a running pump, its load on a gauge, a temperature, a stale pressure in a dashed amber frame tagged "No reply from source · 5 minutes ago", and a disconnected conveyor in a dotted grey frame tagged "No reply from source"](docs/images/board.png)

The board above runs live at the top of [board.u-platform.kr](https://board.u-platform.kr/) — the
library's own viewer, reading a sample source inside the page — and
[board.u-platform.kr/try/](https://board.u-platform.kr/try/) opens the authoring view on the same
board, kept in the browser and exported as a file. The
[gallery](https://board.u-platform.kr/gallery/) shows boards drawn with U-Board, each with its definition and data
as JSON, and the [playground](https://board.u-platform.kr/playground/) draws any of them as that JSON is edited.
iyulab also operates a demo instance at [board-app.u-platform.kr](https://board-app.u-platform.kr/), where invited accounts can
try authoring and sharing before installing; to install U-Board on your own network, see
[docs/self-hosting.md](docs/self-hosting.md).

## Who this is for

Teams building operational software (asset management, industrial monitoring, facility
operations, and similar domains) who need to embed a live status view — equipment on a floor
plan, a system topology, a site map — in their own application, without building a spatial canvas
renderer from scratch. A view reads its values from the systems that own them when it is shown;
nothing has to be collected into a platform of U-Board's first.

U-Board runs standalone against any external data source through its adapter surface — it does
not assume or require a specific host platform.

Several CMMS/facility-management products already ship their own interactive-floor-plan feature
(Hippo, FMX, eMaint, and similar) — U-Board isn't meant to replace that when one system already
covers the need. It's for the case a single vendor's built-in view can't: a live view spanning
more than one source system (e.g. CMMS asset status next to a separate SCADA feed on the same
floor plan), or embedding that view somewhere the source system's own UI has no reach. The
adapter surface is what buys that — a view isn't locked to whichever vendor's floor-plan feature
happened to be good enough.

Every bound value carries its own connection quality — live, stale, or disconnected — and, when it
is not live, the reason: the source is unreachable, the credentials were refused, the value was not
found at the source, the answer could not be read, the request was rate limited, or the source itself
has fallen behind on its updates. Each widget shows its own state — a distinct frame, and on a tag
above it the reason and how old the value is, readable on a wall display nobody hovers over (in full as
its tooltip and for screen readers) — so one failing source does not turn the whole view into an
error.

## What this is not

- Not a general business-intelligence tool — no chart-and-pivot-table dashboards over a data
  warehouse.
- Not an HMI/SCADA package. There is no built-in symbol library (a board draws its own), alarm handling, control output, or screen
  navigation; U-Board draws status views, and the host application around them keeps those
  responsibilities.
- Not a full 3D digital-twin engine. Views are 2D/2.5D; a rotating 3D model of a single object
  is out of scope and left to a dedicated component if one is ever needed.
- Not a business application. U-Board does not own or store domain data — it binds to values
  that live in the systems that already own them.

## Status

This project is in early development. A board is one JSON document in the board language — where its values
come from and what they mean, what it shows, and where — checked by one validator with a published JSON Schema and
drawn by the rendering pipeline (canvas-kit + u-widgets). The authoring UI (`BoardAuthoring`) draws the board as its
viewers see it and edits it in place: parts moved, sized, ordered, joined by links and deleted on the canvas or the
grid, undo and redo of any edit; panels for a selected part (its kind, what it reads, its fields and its kind's
options, with the controls the widget library describes), a link, a shape, the board's data reads (reading a source to
offer the fields its items have), its statuses, its elements and its triggers, and — with nothing selected — the board's
background, theme and accent; what the board's check finds is shown where it applies, and a setting the board cannot
be drawn with keeps the last picture it could, saying why. The board is exported as a file beside the host's own Save,
when it has one, and an Edit / View switch shows it as a shared link does. The editor and the viewer fill their
container, open with the board fitted into view, and pan and zoom by pointer or keyboard.
Besides the canvas there is a grid — parts in order on a 12-column grid, laid out to the viewer's width — edited, saved
and shared the same way. A grid cell can hold a canvas, or a grid of its own: a plan or map beside a column of cards,
the mixed board of a situation room. A board can define its own **elements** for what no built-in draws: markup and
CSS drawn in an isolated root, or a script run in a sandboxed frame with no network, which is stopped when it stops
answering — placed by parts like any built-in, their props bound to fields, their definitions edited in the editor. A
board's **symbols** — SVG drawings defined once — are drawn by its markers and its template elements. An AI assistant reads and draws a workspace's boards from outside, through the MCP
server [`@iyulab/u-board-mcp`](packages/mcp/README.md) and a workspace API token: JSON Patch on a board's
revision, a data source's response summarized by its shape, advice on what would be drawn over what, a picture of
the board as its viewers see it (`look`), and compact answers ([`docs/mcp.md`](docs/mcp.md)). The console's board
editor has a chat panel that draws with the same tools, against a model endpoint each person sets in it.
Reading a real external data source is implemented and deployed — a generic HTTP(S) connector
adapter (with SSRF-safe origin pinning, and either a static credential — a bearer token, a header, or a key in the address (a query parameter or a
path segment, put in only when the request is sent) — or OAuth 2.0
client credentials with cached, auto-renewed access tokens) is wired into both the authoring UI
and the read-only embed viewer. A board's data read names a list in a JSON response by an RFC 6901 JSON
Pointer and its items by a key field, reads the time the source says it observed a value, shows a source
that has fallen behind its own updates as stale, reports why a value is not
live (source unreachable, credentials refused, value not found at the source, an answer it cannot
read, rate limited, the source behind), and the embed viewer resolves all of a board's reads in one
request, again every 30 seconds while it is open — and shows the board as saved again within the same
interval. A connector's settings can be tried before they are saved, its credentials are kept on the server
sealed under an installation key, and the addresses connectors may
reach are an installation setting — never the server's own loopback, link-local or cloud host addresses. A connector to a specific external system that needs its own
domain knowledge (e.g. a real CMMS) still requires access to that system and doesn't exist yet. To see
a board on real data before connecting any of your own, start a new board from a sample: it brings its
own connectors to public open-data sources. The hosted
applications (see [Repository layout](#repository-layout)) add workspaces with members,
server-side board storage, managed connectors, and read-only share links — on an installation run by
an operator who creates each organization's workspace and can recover one whose owners are gone,
and a record of who changed members, roles, invitations, boards, share links and connectors. A save
made against an older copy of a board is refused rather than overwriting someone else's (HTTP
`If-Match`), and the console lets its author reload or keep their own.
They are released together as a versioned container image — on GitHub Releases with an archive for
networks without internet access, both carrying a build provenance attestation, and changes recorded
in [`CHANGELOG.md`](CHANGELOG.md); an operator sees the installed version in the console.

## Repository layout

| Workspace | Package | What it is |
|---|---|---|
| `packages/core` | `@iyulab/u-board` (npm) | The library: the board language and its schema, the adapter contract, drawing a board, the canvas rendering pipeline, the authoring UI and the read-only viewer. Everything below this section documents it. |
| `packages/mcp` | `@iyulab/u-board-mcp` (npm) | An MCP server through which an AI assistant reads and draws a workspace's boards and data sources with a workspace API token — see [`docs/mcp.md`](docs/mcp.md). |
| `packages/server` | private | HTTP API for workspaces, members and invitations, accounts (sign-in, password, deletion), the installation's operators, boards, data connectors, share links, and the activity record. Stores data in Postgres. |
| `packages/console` | private | Web console for that API: sign-in and account, members and the activity record, board editing (with the authoring UI above), connectors with a connection test, issuing share links, and an installation page for operators. Its sidebar carries the U-Platform affiliation. |
| `packages/share` | private | Read-only embed viewer that opens a board from a share link, using only the library's `viewer` entry point. |
| `packages/site` | private | The introduction site at board.u-platform.kr (Korean at `/`, English at `/en/`). Every statement it makes about the product has a row in its `claims.tsv` — status and the files that back it — checked against the pages by its tests. |

The three applications are how U-Board runs as a service installed on your own network; a host application that only
needs the library does not need any of them. They ship as one container image,
`ghcr.io/iyulab/u-board` — published with each GitHub release under the product's own version,
apart from the library's — serving one origin: the API under `/api`, the share viewer under
`/share/`, and the console at every other path — see [`docs/self-hosting.md`](docs/self-hosting.md). [`CONTRIBUTING.md`](CONTRIBUTING.md) covers building
and testing the whole workspace.

## Domain layer

The board language — its types, check and JSON Schema — the adapter contract, and drawing a board as the picture a
renderer reads are available as a package entry point independent of the authoring UI and the canvas rendering
pipeline described below. It is published to npm as [`@iyulab/u-board`](https://www.npmjs.com/package/@iyulab/u-board);
import it from the `/domain` subpath to leave the React and canvas stack out entirely:

```sh
npm install @iyulab/u-board react react-dom
```

```ts
import { pictureOf, readerOf, validateBoard, type Adapter, type Board } from '@iyulab/u-board/domain';

const board: Board = { parts: {}, layout: { kind: 'canvas', size: [1280, 720], place: {} } };
const adapters: Adapter[] = [/* your Adapter implementations */];

const issues = validateBoard(board);                         // [] — nothing to refuse
const picture = await pictureOf(board, readerOf(adapters));  // what the renderer draws
```

A board is what is written, stored and sent; its picture (`@iyulab/u-board/picture` — `resolveDocument`,
`boardStateOf`) is what a renderer, a server or an assistant reads off it, with no opinion on canvas-kit, u-widgets, or
any other rendering concern. See [`docs/concepts.md`](docs/concepts.md) for the vocabulary (board, data, part, layout,
status, adapter) and [`docs/architecture.md`](docs/architecture.md) for how this layer fits the rest of the system.
**See [`docs/api-reference.md`](docs/api-reference.md) for the full reference and a runnable example that implements an
`Adapter` and draws a board.** The package is ESM-only and needs Node 22.12 or later.

## Authoring UI

`BoardAuthoring` — the board drawn as its viewers see it, its parts moved, sized, ordered, joined and deleted on a
canvas-kit designer (or in order on a grid), beside a panel for what is selected: a part's kind, what it reads, its
fields and its kind's options; a link's ends, status, label, route and arrow; a shape; and, with nothing selected, the
board's background, theme and accent, its data reads, statuses, elements and triggers. A grid's cell opens in its own
editor. Undo, Redo, Save (`onSave`, when the host gives one) and Export are the board's. It is exported from the
package `@iyulab/u-board-designer`:

```ts
import { BoardAuthoring } from '@iyulab/u-board-designer';
import type { Adapter, Board } from '@iyulab/u-board/domain';
```

An Edit / View switch shows the board as a shared link does, pan and zoom kept; without a `width`/`height` the board
fills the parent beside the panel, so give the parent a definite height. The [package README](packages/designer/README.md)
covers sizing and view controls.

Unlike the domain layer above, this surface depends on canvas-kit and renders to the DOM directly — a host application
embeds it as-is rather than building its own authoring UI against the domain layer. `BoardView` alone (with none of
the authoring UI's weight) is also available from the lighter `@iyulab/u-board/viewer` entry point, for a host that only
needs to render, not author. See [`docs/architecture.md`](docs/architecture.md) for how this fits the editor/renderer
split.

## Documentation

| Topic | Doc |
|---|---|
| Problem, audience, role | [`docs/overview.md`](docs/overview.md) |
| Design principles and their costs | [`docs/principles.md`](docs/principles.md) |
| What's in scope, what's out | [`docs/scope.md`](docs/scope.md) |
| System structure | [`docs/architecture.md`](docs/architecture.md) |
| Core concepts and terms | [`docs/concepts.md`](docs/concepts.md) |
| Board language and API reference | [`docs/api-reference.md`](docs/api-reference.md) |
| Running the server, console and share viewer | [`docs/self-hosting.md`](docs/self-hosting.md) |
| Shaping an API a board reads | [`docs/data-sources.md`](docs/data-sources.md) |
| Drawing boards with an AI assistant (MCP) | [`docs/mcp.md`](docs/mcp.md) |

## Contributing

Bug reports and design questions are welcome. Because U-Board is dual-licensed, external code
contributions need a signed CLA before they can be merged — it is one file you add in your own
pull request. See [`CONTRIBUTING.md`](CONTRIBUTING.md) and [`CLA.md`](CLA.md).

## License

Copyright (c) 2026 iyulab.

AGPL-3.0-or-later. A commercial license is available for organizations that cannot adopt AGPL-3.0
terms.
See [`LICENSE`](LICENSE).

The console and the introduction site show U-Platform affiliation through the
[`@uplatform/brand`](https://www.npmjs.com/package/@uplatform/brand) package. Its code is MIT; the
marks and product names it carries are trademarks of iyulab with limited permitted use (see that
package's `LICENSE`), and are not covered by this repository's license.
