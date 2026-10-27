# @iyulab/u-board-designer

The authoring tool for [U-Board](https://github.com/iyulab/U-Board) boards — `BoardAuthoring`, a board edited in place —
and the board check and the rulebook an assistant writes by. It builds on
[`@iyulab/u-board`](https://www.npmjs.com/package/@iyulab/u-board), which holds the board language and the viewer.

## Install

```sh
npm install @iyulab/u-board-designer @iyulab/u-board react react-dom
```

`react` and `react-dom` (19.2 or later) are peer dependencies. The package is ESM-only and needs Node 22.12 or later.

## Entry points

| Import | Contents | Depends on React / canvas |
|---|---|---|
| `@iyulab/u-board-designer` | `BoardAuthoring`, `DesignerLabels`, `KO_DESIGNER_LABELS` | Yes |
| `@iyulab/u-board-designer/check` | `checkBoard`, `emptyBoard`, `sourceAdvice`, `boardRulebook`, `RULEBOOK_EXAMPLE` | No |

## Authoring a board

```tsx
import { BoardAuthoring } from '@iyulab/u-board-designer';

<div style={{ height: '80vh' }}>
  <BoardAuthoring initialBoard={board} adapters={adapters} onSave={next => save(next)} />
</div>;
```

`BoardAuthoring` sizes the same way: without `width`/`height` the board fills the parent's width beside the panel, and
its height. The board opens fitted into view and is shown in one of two modes, switched from the toolbar with pan and
zoom kept. **Edit**: the board drawn as its viewers see it, each part's widget in place over its footprint, its kind
named above it; drag a part to move it, its handles to size it; drag across empty space to select several; select two
parts (Shift + click the second) to join them with a link; Delete removes the selection; on a grid, drag an item onto
another to move it there, and lay the grid out at a wide, medium or narrow width. **View**: the board exactly as a
shared link shows it, where a drag pans. The wheel zooms in both.

The panel edits what is selected — a part's title, kind, what it reads (a data read, and one item of it by key), the
fields it shows and its kind's options, with the controls the widget library describes; a link; a shape; a grid item's
span and height — and, with nothing selected, the board: its background, theme and accent, its data reads (reading a
source to offer the fields its items have), its statuses, its elements and its triggers. What the board's check finds is
listed where it applies, and a setting the board cannot be drawn with keeps the last picture it could, saying why. A
grid's cell — a canvas, or a grid of its own — opens in its own editor. Undo and Redo walk the edits; Save calls
`onSave` with the board (without it there is no Save), and Export downloads the board as a file. `sourceLabels` names
each adapter's source in the data panel.

### Text in another language

The tool shows English text by default. Pass `labels` — any subset of `DesignerLabels`, the rest stays English — to
show your own; `DEFAULT_DESIGNER_LABELS` lists every key with its English text. `DesignerLabels` is the viewer's
`UBoardLabels` plus the authoring texts, and `labels.locale` is the language of both: the panel names part kinds, data
fields and options in it, as the widget library names them. Korean ships as `KO_DESIGNER_LABELS`:

```tsx
import { BoardAuthoring, KO_DESIGNER_LABELS } from '@iyulab/u-board-designer';

<BoardAuthoring initialBoard={board} adapters={adapters} labels={KO_DESIGNER_LABELS} />;
```

## Checking a board

`checkBoard` is what a board meets before it is stored: the language, and then that it draws. `sourceAdvice` and the
rulebook (`boardRulebook`) are what an assistant reads to write a board well. They load without React, so a server or an
MCP process imports them from the `check` entry point:

```ts
import { checkBoard, emptyBoard } from '@iyulab/u-board-designer/check';

const { issues } = checkBoard(emptyBoard());
```

### Styling

The components carry only the layout they need to work. Import the default stylesheet once, after the viewer's:

```ts
import '@iyulab/u-board/styles.css';
import '@iyulab/u-board-designer/styles.css';
```

It reads the same `--ub-*` custom properties as `@iyulab/u-board/styles.css` (listed in that package's README) and falls
back to its own values for any you leave out. These are the ones only the authoring view reads:

| Token | Used for |
|---|---|
| `--ub-panel-width` | Width of the authoring view's panel (320 px by default) |
| `--ub-space-4` | A gap of 16 px by default |

The sheet's rules select these class names, mostly one class each: they hold against a host's element styles, and a host
rule on the same class, loaded after the sheet, overrides them.

| Class | Element |
|---|---|
| `ub-action--primary` | The primary button (Save); with `ub-action`, which the viewer package styles |
| `ub-authoring` | The authoring view |
| `ub-authoring__toolbar`, `ub-authoring__group` | Its toolbar, and each group of related actions in it |
| `ub-authoring__appearance` | The board tone picker (light or dark board), with the board's settings in the panel |
| `ub-authoring__mode` | The Edit / View switch in the toolbar (the chosen button has `aria-pressed="true"`) |
| `ub-authoring__panes`, `ub-authoring__pane` | The row holding the board and the panel; the board's column |
| `ub-authoring__surface` | The frame the board draws in — the editor, or the board in view mode |
| `ub-authoring__node`, `ub-authoring__node-tag` | A part's widget drawn in place on the editor; its kind named above it |
| `ub-authoring__pick`, `ub-authoring__layout-width` | On a grid view's editor: the button over each item that selects it (`aria-pressed` when selected); the Wide / Medium / Narrow layout width switch |
| `ub-authoring__panel` | The column holding the panel |
| `ub-authoring__error`, `ub-authoring__status` | A setting the board cannot be drawn with; "resolving" |
| `ub-panel` (`--board`, `--item`, `--elements`, `--part`, `--link`, `--shape`, `--data`, `--statuses`) | The board's settings (while nothing is selected), a grid item's layout (its widths, height and place in the order), the board's elements, a part, a link or a shape, or the board's data or statuses |
| `ub-panel__heading`, `ub-panel__subheading`, `ub-panel__field`, `ub-panel__hint`, `ub-panel__error` | Its heading, section heading, a labelled field, hint text and an error |
| `ub-panel__findings` | What a board's check finds at the selected part, listed under its settings |
| `ub-panel__widget-form`, `ub-panel__group` | The widget's own fields, and each group of them (data, display options) |
| `ub-panel__details` | A fold for the finer settings of a data read (which items, their time, the request time) |
| `ub-panel__field-name`, `ub-panel__field--check` | A field's name (with its key); a checkbox field |
| `ub-panel__binding-tag` | A field's "mapped" tag |
| `ub-panel__value-map`, `ub-panel__map-row`, `ub-panel__actions` | A value map, a row of the map, and its buttons |
| `ub-panel__section` | A section of a panel under its own subheading — a part’s states, its triggers |
| `ub-panel__state-looks`, `ub-panel__state-look` | How each state is shown, and one state’s row |
| `ub-panel__trigger`, `ub-panel__trigger-action` | One trigger, and one of its actions |

## Versioning

Pre-1.0: a minor version may change the public API.

## License

Copyright (c) 2026 iyulab.

AGPL-3.0-or-later. A commercial license is available for organizations that cannot adopt AGPL-3.0
terms.
