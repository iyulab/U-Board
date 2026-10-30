// The renderer's building blocks, for a tool that edits a board and wants to draw it the way the viewer does.
// Not the format a board is stored in (that is `./domain`) and not the viewer itself (`./viewer`).

export type { Adapter, ResolvedWidget } from './adapter.js';
export { readLists, readerOf } from './board/draw.js';
export { PART_KINDS, partKind } from './board/kinds.js';
export { PictureError, dataReadOf, isDataPlace, keyReadsOf, keysIn, toViewDocument } from './board/picture.js';
export type { PictureOptions } from './board/picture.js';
export { EMPHASES, TONES } from './board/types.js';
export type { ArrowEnds, Board, CanvasLayout, ElementDefinition, Emphasis, Field, GridItem, Link, Part, Place, Query, Shape, Status, Tone, Trigger, TriggerAction, ValueMapping } from './board/types.js';
export { elementNameOf } from './elements/element-type.js';
export { DEFAULT_LABELS } from './labels.js';
export type { UBoardLabels } from './labels.js';
export { DEFAULT_NODE_HEIGHT, DEFAULT_NODE_WIDTH } from './layout-defaults.js';
export { sizedNodes } from './node-size.js';
export { mayLoadBackground } from './renderer/background-media.js';
export { captionObjects, connectorObjects } from './renderer/connector-drawing.js';
export { decorationObjects } from './renderer/decoration-drawing.js';
export { ElementHost } from './renderer/element-view.js';
export { GRID_MEDIUM_MIN_WIDTH, GRID_WIDE_MIN_WIDTH, GridBoard } from './renderer/grid-board.js';
export { toCanvasKit } from './renderer/to-canvas-kit.js';
export { resolveDocument } from './resolve-document.js';
export type { ResolvedCanvasView, ResolvedCellCanvas, ResolvedGridView } from './resolve-document.js';
export { THEME_COLORS } from './theme-colors.js';
export { ERROR_STYLE, GROUP_STYLE, TOOLBAR_STYLE } from './ui-style.js';
export { useLabels } from './use-labels.js';
export { ViewControls } from './viewer/ViewControls.js';
export { ViewerPage } from './viewer/ViewerPage.js';
export type { ViewerPageProps } from './viewer/ViewerPage.js';
export { AttributionLine, boardAttributions, showsExampleData } from './viewer/attribution.js';
export { documentExtent } from './viewer/document-extent.js';
export { useFittedView } from './viewer/use-fitted-view.js';
export { focusPart, useTriggers } from './viewer/use-triggers.js';
export type { TriggerHandlers } from './viewer/use-triggers.js';
