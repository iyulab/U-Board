# Changelog — U-Board

The product: the server, the console and the share viewer, released together as one container image,
`ghcr.io/iyulab/u-board`, at the version in `packages/server/package.json`. The library,
`@iyulab/u-board`, has a version and a changelog of its own: [packages/core/CHANGELOG.md](packages/core/CHANGELOG.md).

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the product follows
[Semantic Versioning](https://semver.org/) — below 1.0, a minor release may contain breaking changes.
An entry that asks something of an installation — a setting to add, a path that moved — says what to
do when upgrading. Each release's notes carry its section.

## [Unreleased]

## [0.1.6] - 2026-10-10

### Added

- **A value's age as its source gives it.** An HTTP binding can name the field where the source says when it
  observed the value (`observedAtPath`) and the time zone the source writes in (`timeZone`); the binding form
  offers the response's time fields to pick from, fills in the author's time zone, and shows what the picked
  field reads as. The reading's time is then the source's — an hourly air measurement fetched at :50 was observed
  fifty minutes earlier — and a last-known value shown while the source is unreachable says its age by that
  time. How long such a value is still served counts from when it was last read.
- **A source that falls behind shows as stale.** A binding can say how old the source's value may normally be
  (`maxAgeSeconds`, minutes in the form). Older, the value shows as stale with the cause "the source has not
  updated it as often as expected" — not the network, not the binding. The source is then asked again no sooner
  than an eighth of that age instead of on every poll, which spends a daily request quota far more slowly.
- **Place nodes by coordinate.** A background image can carry two reference points — a point of the image and
  the coordinate it stands for, such as a map's longitude and latitude — set in the board panel. An anchored
  node then shows the coordinate it stands at, and moves there when one is typed.

### Changed

- The open-data samples name their sources' times and how old their values normally are, and the
  Gwanghwamun map declares its reference points. Its forecast charts label their time axes as dates instead of
  the source's digits (`202610092100`).

## [0.1.5] - 2026-10-09

### Added

- **Start a board from an open-data sample.** The new-board dialog offers sample boards built on public open
  data (Gwanghwamun live, fine dust in central Seoul): picking one creates its data sources — or uses the
  workspace's own for the same address, keeping a key the owner has put in — and the board, bound to them, and
  opens it in the editor. The dialog says which addresses the sources connect to; an installation that cannot
  reach them shows the values as disconnected.
- **Data sources that take their key in the address.** A connector can send its secret as a query parameter
  (`serviceKey=…`) or as a path segment (`{key}` in its base URL), as many public open-data APIs require, where it
  could only be a header. The key is sealed like every connector secret and put into the address only when the
  request is sent, so it is never stored in a board, never served with a share link, and never written to the log.
  The binding form warns when a request path itself carries what looks like a key — move it into the connector.
- **A binding can read one item of a list by its fields.** An HTTP connector reference can carry
  `item: { list, where }` — the first element of the list at `list` (a JSON Pointer) whose fields equal `where` —
  and the value path is then read inside that item. Lists of stations, sites or meters often come in another
  order from one read to the next; a binding by position then showed another record's value as live. When no
  item matches, the binding says the value is not at the source. The binding form offers it when a value is
  picked inside a list.
- **A data source's credit under every board that shows its data.** A connector can carry an attribution — the
  credit text and, optionally, a link — which the share viewer and the editor's view mode show under each board
  bound to it; a share link serves the credit and nothing else about the source. Open-data licenses such as
  KOGL Type 1 and CC BY make crediting the source a condition of use.
- **The connection test shows what the source answered.** Its first 400 characters appear under the result, so a
  source that reports an error in a successful answer (a bad key, an empty query) can be seen as such.

### Fixed

- **An answer in XML or HTML no longer passes the connection test.** A source answering XML (as many public APIs
  do unless asked for JSON) or an HTML page (a login or error page) reported "connected", and its bindings then
  showed "bound value not found at the source". Both now say the answer is not JSON — the test with a hint to ask
  for JSON, the bindings with the reason "the source answered in a form that cannot be read".

### Changed

- **Charts and tables read data as an API returns it** (`@iyulab/u-widgets` 0.30): a time series answered as one
  array per field, and records with nested fields (`properties.mag`), where the share viewer showed "Invalid widget
  spec" or `[object Object]`. A widget whose value still does not fit lists why in the board's language.

## [0.1.4] - 2026-10-09

### Changed

- A widget on a board stays inside the box its node was drawn with: a small chart switches to a compact layout, a
  gauge or image scales down, and a table or list scrolls inside the node, instead of running over neighbouring
  nodes.
- The board editor's toolbar fits one row: the board's background and tone moved to the side panel, which shows
  them while nothing is selected.

## [0.1.3] - 2026-10-09

### Added

- A board can be dark: the editor's toolbar sets the board's tone to match its background. On a dark board — a
  dark drawing, or none — the widgets use their dark colours and the paper is dark, so values read; the shared
  board looks the same. Boards made before stay light.

### Changed

- The board editor shows each widget where it sits on the board, live, with its type named above it, and uses
  the whole width for the board: the separate live preview is replaced by an Edit / View switch.
- Boards in a Korean console and share viewer are Korean throughout: the widgets write their own text in Korean
  (a table's pagination, a region's name a screen reader reads), and the property panel names every widget type,
  data field and option in Korean, with the widget library's description as a tooltip.

## [0.1.2] - 2026-10-08

### Changed

- The board editor's toolbar, its property panel and the share viewer's zoom buttons take the
  console's look — grouped toolbar actions, framed editor and preview, a panel with labelled fields
  — instead of the browser's default controls.
- The board editor has a header of its own: the way back to the board list, the board's name, whether
  it is saved — in a fixed place, so the editor no longer moves down when that changes — and Share.
- Sharing opens a dialog. A new link can be copied or opened in a new tab, and comes with the
  `<iframe>` code that embeds the board in another page. Issued links show when they were made, last
  used and expire.
- The binding form picks the value to bind from the widget's own fields (상태 이름, 값, 수준 …), starts on the
  headline value, says why "Save binding" cannot be pressed
  yet, lists what each binding points at, and shows previewed values and widget types in words
  (`running` and 정상 rather than `"running" (live)`; 상태, 게이지, 선 차트). A new node starts as
  새 노드 · 연결 전 instead of English.
- A widget's label, value, status level, gauge range and unit are edited in fields instead of JSON;
  the JSON stays under "고급" for the rest.
- In the dark theme the board editor's toolbar, panel and frames are dark as well; the board stays light — its
  paper and the widgets on it — so values read on the drawings boards are made on.
- Times read as dates and times in Korean, in the viewer's time zone — the board list, share links,
  invitations, the installation page and the activity log. The board list and share links used to
  show raw ISO timestamps, and the other pages followed the browser's language.

## [0.1.1] - 2026-10-08

### Changed

- The console's pages before sign-in — sign-in, the first account, an invitation, password reset and
  a page not found — share one layout with the product mark and the U-Platform affiliation instead of
  rendering as unstyled forms. Sign-in says that accounts come by invitation; the first account says
  it will run the installation. Inputs carry autocomplete hints for password managers.
- While the console checks the session, the product mark turns in the middle of the screen.
- The share viewer tells a malformed address, a link the server does not know (unknown or revoked), an
  expired link and a server that did not answer apart, instead of calling every failure an invalid
  link. It retries a server that did not answer on its own — after 2 seconds, doubling up to a minute,
  and at once when the network comes back — so a screen left open recovers from a deploy or an outage.
- The board editor offers Export beside Save: a board can be downloaded as a file that Import opens —
  to move it to another installation, or as a backup.

### Fixed

- In the board editor, the background image and the connector lines could be selected and dragged,
  which moved them in the editor only and showed the board shifted against its nodes. They stay in
  place now; a press on the drawing starts a box selection.

## [0.1.0] - 2026-10-08

The first release as a published image. What it does is described in the [README](README.md#status);
running, backing up and upgrading it in [docs/self-hosting.md](docs/self-hosting.md).

### Upgrading from an image built from source

An installation built from an earlier checkout upgrades as any other does — back up, then start this
image on the same database ([Upgrading](docs/self-hosting.md#upgrading)). If its build predates them,
it also needs:

- `UBOARD_SECRETS_KEY`, at least 32 characters. The server refuses to start without it, and on its
  first start seals the connector credentials stored in the clear before it.
- One origin for everything: the API under `/api`, the share viewer under `/share/` and the console
  at every other path. Share links made with the viewer on a host of its own keep working only if
  that host redirects to `/share/` with the query kept. `UBOARD_CORS_ORIGINS` is gone.
