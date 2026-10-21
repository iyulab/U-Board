# Changelog — U-Board

The product: the server, the console and the share viewer, released together as one container image,
`ghcr.io/iyulab/u-board`, at the version in `packages/server/package.json`. The library,
`@iyulab/u-board`, has a version and a changelog of its own: [packages/core/CHANGELOG.md](packages/core/CHANGELOG.md).

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the product follows
[Semantic Versioning](https://semver.org/) — below 1.0, a minor release may contain breaking changes.
An entry that asks something of an installation — a setting to add, a path that moved — says what to
do when upgrading. Each release's notes carry its section.

## [Unreleased]

## [0.22.0] - 2026-10-21

Built on `@iyulab/u-board` 0.31.1 and `@iyulab/u-board-mcp` 0.19.0, with widgets from `@iyulab/u-widgets` 0.38.2.

### Added

- A gallery sample in the glass style: a city hotel's day — frosted panes over a dusk gradient, every room's state floor
  by floor, check-ins and check-outs, housekeeping progress, guest requests and the revenue mix (example data).
- A gallery sample in the portrait kiosk form: a hospital's outpatient hall screen — each clinic's number being called
  and who is next, the test rooms' queues, prescriptions ready, the car park, in very large type (example data).
- A gallery sample in the print form: a public library's month on one A4 page — a serif masthead, the month in a
  paragraph with its figures in the sentences, numbered sections, a source line at the foot (example data).
- A gallery sample in the skeuomorphic SCADA style: a brewery's process on a brushed-steel panel — vessels shaded as
  metal, flanged pipes, screwed nameplates with backlit displays and sight glasses, bezel gauges and an annunciator of
  lamps (example data).
- A gallery sample in the minimal style: a home's energy on an e-ink frame — one very large, thin number, a few
  figures beside it, the day by the hour, the weather and one line of advice, grey on paper (example data).

### Changed

- The home page's film of the AI chat panel is recorded again on example carriers (A–D택배), with the panel's newer
  prompt and the grid's medium-width rows; the caption says how long it took and how much faster it is shown.
- The AI chat panel asks the model to title a chart in the chart's own title, not with a separate heading above it.
- The AI chat panel asks the model to read the widgets a step uses in one `describe` call, not one call each.
- The AI chat panel names the language of the person's first message to the model (Korean, Japanese or Chinese, read
  from its script) instead of asking for "the person's language", which models left for English more often.
- After the tools answer, the AI chat panel reminds the model of that language, in that language, with the request
  (not kept in the conversation) — the English of the tools' answers pulled the next message into English.

## [0.21.0] - 2026-10-21

Built on `@iyulab/u-board` 0.31.0 and `@iyulab/u-board-mcp` 0.18.0.

### Added

- An AI chat panel beside the board editor (✦ AI 비서): say what the board should show, and a model draws it on the open
  board, each change appearing as it is saved, and checks its own drawing as it goes: `look` draws the saved board out of
  sight in the page and reports what runs past its box or failed to draw. It calls the same board tools as the MCP server, as the signed-in person,
  against a chat completions endpoint (OpenAI-compatible) that each person sets in the panel — its address, model and
  key are kept in that browser only, and the model is called from the browser: the server neither holds a key nor
  calls a model. The endpoint must accept requests from the console's address (CORS). Sending waits while the editor
  has unsaved edits, and the editor keeps its mode (Edit or View) as it shows each change.
- The site's home page shows the chat panel at work: a film of it drawing a dispatch board from two requests, sped
  up, with the poster alone where less motion is asked for.
- A gallery sample in the style of a city situation room's wall: a festival's operations on a fireworks night — a winged
  title bar, bracketed panels in three columns, and the venue map in the middle with each area glowing by people per
  square metre; the crowd, the gates, the shuttles, the safety desk and the launch conditions around it. On example data.
- A gallery sample drawn in flat isometric: a smart farm seen from above at an angle — four glasshouses with their crop
  rows showing through the glass and the buildings beside them, a tag pinned to each roof with the temperature inside
  and what the house is doing now, and on the side the weather the vents answer to and each house's temperature
  against the heat alarm. On example data.

## [0.20.0] - 2026-10-20

### Added

- A gallery sample laid out as an infographic: a day of the blood supply read like a poster — a headline, the stock in
  days and the level it sets, the five steps from donation to hospital as large numbers joined by arrows, and the stock
  by blood type against five days. A canvas with no plan behind it, on example data.
- A gallery sample of a dense dark operations wall: a carrier's network at night — six figures with the last hours
  under each, every region against every service in one matrix, the backbone links' load, and the alarms by region
  and still open. A grid with no map, on example data.
- A gallery sample drawn as a transit map: a high-speed rail network nationwide — each section in its line's colour,
  as thick as the trains on it and dashed with its delay where late, stations ringed red where trains are held, and
  punctuality by line beside it. One canvas over a wide area, on example data.
- A gallery sample of signage: an airport's departures board — time, flight and gate on split-flap tiles, the
  destination in Korean and English, each flight boarding, delayed, closed or cancelled, with the clock, punctuality
  and the security wait beside it. On example data.

### Changed

- The site's gallery lists its boards at the top, each a link to the board, and draws a board as it comes near the
  screen rather than every board when the page opens — at the top of the page, two boards and ten widgets instead of
  all 23 boards and some 200 widgets.
- The container terminal sample draws its crane target as a dashed line, as it meant to.
- Widgets come from `@iyulab/u-widgets` 0.38: a metric can draw its recent values as a small line under it
  (`data.sparkline`); a horizontal bar chart labels a reference line at its top, clear of the value axis; an area
  chart's reference lines are accepted by the checks.

## [0.19.0] - 2026-10-20

### Added

- A grid board can hold a canvas in a cell — a plan or map among cards. The editor adds one (**Add canvas**) and
  edits its canvas in the canvas editor; the viewer and share links draw it fitted to its cell, the page scrolling
  past it and Ctrl/⌘ + wheel zooming it. The AI tools (MCP) write and check it.
- A grid item can span rows — a map beside a column of cards.
- A gallery sample of a dark control room: a container terminal — the day's figures in big numbers, the ships at their
  berths with their progress, the yard filling up, the berth schedule, the cranes' rates and the alarms (example data).
- A gallery sample of a bright sales room: an online shop on a sale day — revenue on a ring against its target, the figures
  against yesterday, the funnel, a category treemap, a channel donut, an hourly comparison, a weekday × hour heatmap and the
  orders arriving now (example data).

### Changed

- The Gwanghwamun sample is a mixed board now: the crowd and the roads across the top, the area's plan in a wide cell
  with the bike stations and the car park where they stand, the forecast beside it, the weather below. A board
  created from it before keeps its form.

## [0.18.0] - 2026-10-20

### Changed

- Widgets come from `@iyulab/u-widgets` 0.36. A `form` written in formdown (`formdown`) is read by formdown itself:
  attributes are separated by spaces (`R[min=0 max=100]`), a multiselect is `s[multiple]`, and a toggle needs a
  `fields` array. A `form` takes `fieldStates` — values suggested for its fields, picked with a click.
- A slow data source no longer leaves a board empty. A board's refresh waits up to 5 seconds for a source; a slower
  read goes on in the background for up to 25 seconds (it was cut at 5) and its answer serves the next refresh. Until
  then the board shows the last answer, as current while it is still the freshest the source can give, and the first
  time it reads the source, "still reading" (reason `pending`) instead of "disconnected — unreachable". A connection
  test waits up to 25 seconds too.

## [0.17.0] - 2026-10-20

### Added

- A data source can say where its source writes an error it answers with success (HTTP 200) — the status, the
  statuses that mean success, and its words for the error («응답 속 오류 위치» in the data source form). Its bindings
  then fail with what the source said (a key it does not accept, no data for the request) instead of reading as a
  value missing from the answer, and the connection test shows those words.
- A sample on a source that issues each user a key of their own — subway arrivals around Seoul City Hall, on a line
  diagram — asks for that key when it is created; a data source the workspace already has for that address is used
  as it is. Fine dust in all 25 districts of Seoul, on a tile map whose tiles take their grade's colour, is another.

### Changed

- The connection test shows the start of what a source answered with when it refused the request (`401`, `403`,
  `504` …) — its reason is often there, such as a key not yet registered for that API — with the data source's key
  taken out should the source echo it.
- A failed read tells signed-in members and API tokens what went wrong in words, beside its reason; a share link
  still says only the reason.

Upgrading: nothing to set — the new data source setting is optional, and its column is added when the server starts.

## [0.16.0] - 2026-10-20

### Added

- A colour on a board can be a theme colour's name — `positive`, `warning`, `negative`, `accent` — wherever a part
  is coloured (a state's ring, a connector, a frame, a text), drawn in the widgets' palette for the board's light or
  dark appearance. The states editor offers the names.
- A connector's bound label can keep its unit and digits: `{{value | fixed:1}} Mbps` reads `820.4 Mbps`, and `—`
  while there is no value.

### Changed

- Every size inside an element now includes its padding and border (`box-sizing: border-box`), so an element whose
  root is `height: 100%` with padding fits its box instead of being cut off at the bottom. Upgrading: an element
  that relied on the old sizing (a fixed width plus padding) draws its content slightly smaller — say
  `box-sizing: content-box` in its CSS to keep it.

## [0.15.0] - 2026-10-20

### Added

- An element's template may give a number its digits — `{{inlet | fixed:1}}` shows 24 as 24.0 — and use a
  description list (`<dl>`, `<dt>`, `<dd>`) for names and their values.

### Changed

- A board whose document puts a field of its own under `components` (`instances` beside the definitions) is refused
  with where that field belongs, and a component can no longer be named after a document field (`nodes`,
  `instances`, …). Upgrading: a board with a component of such a name is refused on its next save — rename the
  component first.

## [0.14.0] - 2026-10-19

### Added

- The console's grid editor duplicates an item (**Duplicate item**) right after it.
- A data source carries a **description** its owner writes in the console — the paths it answers and what each
  holds — for whoever binds to it next; an assistant reads it through `list_sources`. Not shown with a shared board.
  (`description` on the connector API, up to 2,000 characters; blank or `null` clears it.)

### Changed

- **Edit component** in the console draws the component's parts with their `{{name}}` filled — the parameter's
  default, else the first instance's value — instead of the placeholder text; a part added there goes near the
  component's origin.
- The console and the introduction site take `@uplatform/brand` 0.4.

## [0.13.0] - 2026-10-17

### Added

- **Components in the console editor**: an instance's parts are named by the instance in a line's panel and offered to
  triggers; the selected nodes and frames become a component (**Make component**), an instance becomes parts again
  (**Detach into parts**), and a component is edited as a board of its own (**Edit component**) — every instance
  draws the change.

### Fixed

- Console editor: a line that runs over a component instance is picked there too, and a selected instance takes no
  resize or rotate handles (its size is its component's).

## [0.12.0] - 2026-10-17

### Added

- **Components** (`@iyulab/u-board` 0.22.0, `@iyulab/u-board-mcp` 0.10.0): a board saved with components — a group of
  parts defined once and drawn by each instance with its own parameter values — is accepted, drawn in the share viewer
  and the console, and published in the board state part by part (`<instance id>/<part id>`). A share link reads only
  the bindings the board's instances name. In the console an instance is selected, moved and deleted as one, and its
  parameter values are edited in its panel; editing a component itself comes later.

### Security

- Widgets from `@iyulab/u-widgets` 0.35.3: a quote in a markdown widget's link could add an event handler attribute to
  the link, and a heatmap's tooltip put its row and column names in as markup — on any board a viewer opens, the share
  viewer included. Upgrade.

## [0.11.0] - 2026-10-17

### Added

- **Connectors at right angles** (`@iyulab/u-board` 0.21.0): a connector's route can be orthogonal — out of the side
  facing the other node, one turn at the middle of the gap, into the other's facing side, as pipes and wiring are
  drawn. Chosen in the console editor's connector panel (**Route**), drawn the same in the share viewer.

### Changed

- The advice a saved board answers with counts the layout findings it folds: the line that sums up the rest carries
  `count`. A patch naming a member an object does not have says what the object has and where the member is.
- Widgets from `@iyulab/u-widgets` 0.35.2.

## [0.10.0] - 2026-10-16

### Added

- **States and triggers in the console’s editor** (`@iyulab/u-board` 0.19.0): a part’s panel gives it states — the binding they are read from, a
  value → state map, and a ring, blink or hiding for each state — and triggers on it (clicked, its element’s event, a
  state entered or left; open a link, bring a part into view, tell the page, show another board). The board panel
  holds what runs when the board opens. A trigger is saved once it is complete; a link a board may not open is
  refused with the reason.

### Fixed

- Deleting a part that a trigger names in the console’s editor no longer leaves a board that cannot be saved.

## [0.9.0] - 2026-10-16

### Added

- **Boards act on what happens on them** (`@iyulab/u-board` 0.18.0): a part clicked, an element’s event, a part
  entering or leaving a state, or the board opened can open a link, bring a part into view, or tell the page — in the
  share viewer and in the console’s View. The share viewer posts each event to the page it is embedded in
  (`u-board:event` — its name, the board, the part and its state, never a value); the console’s View opens the board a
  trigger asks for, asking first when changes are unsaved. Written in the board’s source for now.

### Changed

- Widgets from `@iyulab/u-widgets` 0.35.0: a gauge’s and a progress bar’s value in the page’s locale, fixed-decimal
  number formats.

## [0.8.0] - 2026-10-16

### Added

- **A board can show the state each part is in** (`@iyulab/u-board` 0.17.0): a node or a grid item names its state
  from one of its bindings — `fault`, `running`, `hot` — and the share viewer and the console’s view draw it as a ring,
  a blink or the part hidden, and say it to assistive technology. Written in the board’s source for now.
- `GET /api/share/boards/:id/state` — a board’s state on request, for a share link or a workspace API token: each
  part’s state, connection quality and why, how old its data is, no values. Computed from the board’s declared
  bindings with the same reuse of upstream reads as the batch resolve; nothing is kept between requests.

### Changed

- Saving a board answers shorter advice: two overlapping parts are said once, not again for their captions.

## [0.7.0] - 2026-10-16

### Fixed

- **A script element's loop that never ends no longer holds the page.** The server serves an element's code with each
  loop that cannot yield bounded to a second: past it the loop throws, the element shows the error, and the frame — and
  in Firefox and Safari, the whole page — goes on. Before, such a loop held the page in browsers without site isolation
  and, in Chrome and Edge, kept every script element of the board stopped until the browser was restarted.

### Added

- **Undo and Redo** in the editor; a node or decoration the editor adds is selected at once.
- **Symbols in the editor** — a board's symbols listed beside its elements, each with how often it is placed, made
  and edited there with a preview; a frame's name can take a colour of its own.
- `look` (MCP) answers the advice that still stands with its picture, and the AI rules teach how a symbol's parts are
  styled; a JSON Patch that adds under a missing part says to add that part first.
- **`UBOARD_ELEMENT_FRAME_ORIGIN`** — serve each script element definition's frames from an origin of its own
  (`https://*.frames.example.com`, wildcard DNS and certificate), so in Chrome and Edge an element whose code never
  yields does not stop the board's other script elements. The frame hosts answer element frames only.
- The grid editor moves an item dragged onto another.

### Changed

- **A node without a box takes the size of the element it places** (its `size`), as an image takes its own; other
  nodes stay 160 × 100. When upgrading: a saved board whose element nodes give no `width`/`height` draws them at the
  element's size — give such a node a box to keep it as it was.

## [0.6.0] - 2026-10-16

### Added

- **Connectors are drawn and edited in the editor** — select two nodes and "Connect nodes" joins them; a connector
  takes arrowheads (bindable, so a flow's direction can follow its sign), a label placed along its line, a colour,
  width and line style, and the same bindings a widget takes. **Delete** (the toolbar button, or the Delete key)
  removes what is selected.
- **Frames name themselves** — a frame decoration carries its own name inside it, rounded corners and a dashed or
  dotted edge; a text decoration can be centred (or anchored at any corner or edge) on its position and sit on a
  background.
- **A board's accent colour** — set once in the board panel, the colour its widgets and elements fill and highlight
  with, in place of the theme's.
- **Shared symbols** — SVG drawings a board defines once, placed by its template elements, so a plant's symbol set is
  drawn the same everywhere.
- A connector's line and label have a place on the page, for a screen reader and for tools reading the board.

## [0.5.0] - 2026-10-16

### Added

- **A connector's label and style can be bound to live values** — a link's throughput as its label, its load as its
  width or colour; share links read them like any other binding.
- Saving a canvas board also advises on connector labels that sit under a node or run into a text, and on a frame's
  edge running through a text.
- A canvas node can carry a **caption** — its name drawn under its box, so links meet a device's icon however long
  its name.

## [0.4.0] - 2026-10-16

### Added

- The editor edits a placed **element** like a widget: the board's elements are in the widget-type choice, and an
  element's props get controls from its definition — text, choices, numbers within their bounds, yes/no — which a
  binding can fill. With nothing selected, the editor lists the board's elements and edits one's definition — its
  code, props schema, origins and size — with a template previewed as it is typed and problems shown at once.
- A **script element whose code stops answering** — a loop that never ends — is removed after six seconds, with a
  notice on its box, in the editor and on share links alike. In Chrome and Edge the board stays usable meanwhile; in
  browsers that run the element with the page, such code holds the page too, and either way it keeps running in the
  browser until it is restarted (`docs/api-reference.md`). The console opens a board without running its script
  elements at `/boards/<id>/edit?scripts=off`, to fix such code.

### Changed

- **Connectors carry a label and a style** — a link's throughput at its middle, its colour, width and dash — and
  run from edge to edge of their nodes' boxes; links between the same two nodes are drawn side by side.
- **The share routes also take a workspace API token** of the board's workspace — so a program that may read the
  board (an assistant's tool server) sees it as its viewers do, through the share viewer, without a share link.
- **Saving a board checks more** — a connector must join two nodes the board has, a field the document format does
  not have is refused (the answer names the fields that place has), and a decoration colour must be one every canvas
  reads (hex, `rgb()`/`rgba()`, `hsl()`/`hsla()`, a colour name, `transparent`, `none`). Each was stored before and
  then drawn as nothing, or in the wrong colour. A board stored with such a field is saved again once it is removed.
- Saving a canvas board answers, with its advice, where parts would be drawn over one another — overlapping nodes, a
  text under a node or crossed by a connector, texts running together.
- A decoration colour of `none` paints nothing — it used to come out black, or in the colour of the decoration drawn
  before it.

## [0.3.0] - 2026-10-15

### Added

- **Elements** — a board can define what no prepared widget draws, once, and place it on any number of nodes or grid
  items: a template of HTML or SVG with its own CSS, isolated from the page and running no script, or a script that
  runs in a sandboxed frame with no network, its data arriving through the board's bindings. The editor and share
  links draw both. The server serves a script element's frame at `/api/element-frames/<board>/<element>/<hash>`,
  named by the saved definition, with a policy that sandboxes it, allows only its own code and closes the network.
- **API tokens** — a program (an AI assistant's tool server, a script) reads and draws a workspace's boards with a
  token made in the workspace settings: it acts as the person who made it, in that workspace only, `read` or `write`,
  and is shown once. It reaches boards and data sources but never a data source's credential, which a person enters
  in the console. `GET /api/token` says what a token is. Making and deleting one is recorded in the activity record.
- **Replacing `UBOARD_SECRETS_KEY`** — start once with the new key as `UBOARD_SECRETS_KEY` and the old one as
  `UBOARD_SECRETS_KEY_PREVIOUS`: the server opens each connector credential with whichever key it was sealed under
  and seals it again under the new one, all or nothing, then says to remove the old key. Before, a key that had
  leaked could only be replaced by clearing every credential and having owners enter them again.
- **`PATCH …/boards/:id`** — changes part of a board's document with a JSON Patch (RFC 6902,
  `application/json-patch+json`), applied to the board as saved now and saved only on that revision (or the one
  `If-Match` names): a board saved in between answers `412`. A failed operation answers `400 INVALID_PATCH` with its
  index. `PUT` and `PATCH` answers carry `advice` on the saved document (an element placed nowhere, too many script
  elements).
- **An MCP server for AI assistants**, published on npm as `@iyulab/u-board-mcp` 0.1.0 (`npx -y @iyulab/u-board-mcp`) —
  over a workspace API token, an assistant reads
  boards by JSON Pointer, changes them with JSON Patch on a revision, checks a document without saving, lists data
  sources, reads what a source's response looks like, and makes a source that needs no credential. It explains the
  board format to the assistant itself (`describe`). See `docs/mcp.md`.
- `UBOARD_ELEMENT_ORIGINS` — the origins a board's elements may load from when they list them too (a font, a script
  library). Unset: none, so an installation on a closed network loads nothing from another origin, as before. Board
  answers carry `elementOrigins`.

## [0.2.0] - 2026-10-15

### Added

- **Grid boards** — widgets in order, laid out to the width of the page or panel they are shown in, for an ordinary
  dashboard with no drawing behind it. The new-board dialog asks which kind (canvas or grid), the board list says
  each board's kind, the editor edits both, and a share link shows both. The API's `POST …/boards` takes an optional
  `kind` (`"canvas"` by default) and the board list carries each board's `kind`.

### Changed

- Saving a board whose document gives two of its parts — nodes, connectors, decorations — the same id is refused
  with the place of each (`400 INVALID_DOCUMENT`).
- Widgets come from `@iyulab/u-widgets` 0.33: a chart can span its value axis over the data (`valueAxisZero: false`),
  and a series' `lineStyle: 'dashed'` draws dashed — before, the keyword was ignored and the line stayed solid.

## [0.1.8] - 2026-10-15

### Changed

- **The editor no longer offers «데모 데이터».** It was a stand-in that worked only in the editor — a shared board
  showed it as not connected. With no data source, the binding form now says where one comes from: a workspace
  owner adds it under «데이터소스», or a new board starts from a sample, which brings its own.
  **Upgrading:** a board that used it shows those widgets as not connected (the binding names `demo-cmms`). Bind
  them to a data source, or remove the binding.
- Widgets come from `@iyulab/u-widgets` 0.32. The sample boards' forecast charts label their axis with the time of
  day alone instead of repeating the date on every label.

### Fixed

- **A shared board follows a dark system theme to the page edge.** The page stayed white while the viewer's text
  took its dark colors, so the «갱신» time beside the board was too faint to read (contrast 2.6:1).
- **The mark of a node whose value is not current is shown in full.** It sits on a tag just above the node's frame
  instead of inside its corner, where a narrow node cut it short — first of all the value's age — and covered the
  widget.

## [0.1.7] - 2026-10-13

### Added

- **A save no longer overwrites someone else's unseen.** Each board counts its saves (`revision`); reading a board
  answers with it as an `ETag`, and a save that names the copy it was made against (`If-Match`) is refused with
  `412` (`BOARD_CHANGED`, with the revision the board is at now) when someone has saved it since. The console
  saves this way: when two people edit the same board, the second to save is told so and chooses between loading
  the board as saved and keeping their own over it. A save without `If-Match` stays unconditional.
- **An open share link follows the board.** A board saved again while its share link is open on a screen is shown
  as saved within one poll (30 seconds): each value batch carries the board's revision, and a newer one makes the
  viewer read the board again, in place. A board with no bindings, which sends no value batch, asks for the board
  itself instead (`If-None-Match`, answered `304` while unchanged) — one request a poll either way. Until now the
  screen kept the layout it opened with — while its update time said it was current — until someone reloaded it.
  A failed read leaves the board on screen and tries again at the next poll.
- **A node whose value is not current says why, on screen** — the cause and the age in its corner ("원천 갱신 늦음
  · 1분 전"), readable on a wall display with no tooltip to hover (see `@iyulab/u-board`).
- **Anchored nodes keep their coordinates when the background changes** (see `@iyulab/u-board`).

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
