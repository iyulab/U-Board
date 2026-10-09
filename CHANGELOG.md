# Changelog — U-Board

The product: the server, the console and the share viewer, released together as one container image,
`ghcr.io/iyulab/u-board`, at the version in `packages/server/package.json`. The library,
`@iyulab/u-board`, has a version and a changelog of its own: [packages/core/CHANGELOG.md](packages/core/CHANGELOG.md).

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the product follows
[Semantic Versioning](https://semver.org/) — below 1.0, a minor release may contain breaking changes.
An entry that asks something of an installation — a setting to add, a path that moved — says what to
do when upgrading. Each release's notes carry its section.

## [Unreleased]

### Added

- A board can be dark: the editor's toolbar sets the board's tone to match its background. On a dark board — a
  dark drawing, or none — the widgets use their dark colours and the paper is dark, so values read; the shared
  board looks the same. Boards made before stay light.

### Changed

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
