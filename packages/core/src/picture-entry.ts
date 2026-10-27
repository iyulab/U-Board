// The picture: the model the renderer draws from, made from a board (`toViewDocument` · `pictureOf`) — what a server
// computes a board's state on and an assistant looks at. Not a format a board is written or stored in.
export type * from './document-types.js';
export { resolveWidget, applyValueMap, withItemFields, writeText } from './adapter.js';
export type {
  Resolved,
  ResolvedNode,
  ResolvedGridItem,
  ResolvedCanvasItem,
  ResolvedCellCanvas,
  ResolvedCanvasView,
  ResolvedGridView,
  ResolvedViewDocument,
  ResolvedOf,
} from './resolve-document.js';
export { placedIn, placedAt, isCanvasItem, isTriggerLink, CONNECTOR_BINDABLE, STROKE_DASHES, CONNECTOR_ARROWS, CONNECTOR_ROUTES, PLACEMENTS, TRIGGER_EVENTS, TRIGGER_ACTIONS, GRID_COLUMNS, GRID_COLUMNS_MEDIUM, GRID_DEFAULT_SPAN, GRID_MAX_ROW_SPAN } from './view-document.js';
export { bindingsIn } from './document-bindings.js';
export { DEFAULT_NODE_WIDTH, DEFAULT_NODE_HEIGHT } from './layout-defaults.js';
export { nodeSize, sizedNodes } from './node-size.js';
export type { BoxSize, SizedNode } from './node-size.js';
export { resolveDocument, resolveConnector } from './resolve-document.js';
export { boardStateOf } from './board-state.js';
export type { BoardState, PartState } from './board-state.js';
export { firedBy, stateChanges, linkFor, elementListeners, FiringLimit } from './triggers.js';
export type { FiredEvent } from './triggers.js';
export { lintViewDocument } from './lint-view-document.js';
export { elementFrameHtml, elementFrameScripts } from './elements/frame.js';
export { elementDefinitionHash, elementFrameLabel } from './elements/definition-hash.js';
export { applyJsonPatch, getByPointer, JsonPatchError } from './json-patch.js';
export type { JsonPatchOperation } from './json-patch.js';
export type { ElementFrameMessage } from './elements/frame.js';
export type { LintOptions, ViewDocumentAdvice } from './lint-view-document.js';
export { DEFAULT_QUALITY_TEXT, ageText, worstQuality, describeQuality } from './quality-text.js';
export type { QualityText, QualitySummary, DescribeQualityOptions } from './quality-text.js';
export { coordinateOf, placeAt } from './anchor.js';
export type { Coordinate } from './anchor.js';
export { isHttpRef, requestPath, requestTimeProblem, readHttpRef, resolvedReading, parseSourceTime, findHttpRefItem, isSourceErrorField, sourceErrorIn } from './http-ref.js';
export type { HttpRef, HttpRefItem, HttpRefReading, HttpRefRequestTime, SourceErrorField } from './http-ref.js';
