// The board language: its shapes, its schema, its check, and the picture the renderer draws from a board — with the
// adapter contract a host reads its data through. Reaches no package at runtime, so a server or an MCP process loads it.

export type * from './board/types.js';
export { EMPHASES, FRAMES, TONES } from './board/types.js';
export { boardSchema } from './board/schema.js';
export { validateBoard } from './board/validate.js';
export type { BoardIssue } from './board/validate.js';
export { checkBoard, emptyBoard, sourceAdvice } from './board/check.js';
export type { BoardCheck, BoardFinding, KnownSource } from './board/check.js';
export { PART_KINDS, partKind } from './board/kinds.js';
export type { PartKind } from './board/kinds.js';
export { toViewDocument, dataReadOf, elementDefinition, keyReadsOf, keysIn, PictureError } from './board/picture.js';
export type { KeyRead, PictureOptions } from './board/picture.js';
export { drawBoard, pictureOf, readKeys, readLists, readerOf } from './board/draw.js';
export type { ValueReader } from './board/draw.js';
export { boardRulebook, RULEBOOK_EXAMPLE } from './board/rulebook.js';
export type { Adapter, Attribution, ConnectionQuality, QualityReason, ResolvedBinding } from './adapter.js';
export { applyJsonPatch, getByPointer, JsonPatchError } from './json-patch.js';
export type { JsonPatchOperation } from './json-patch.js';
export { DEFAULT_QUALITY_TEXT, ageText, worstQuality, describeQuality } from './quality-text.js';
export type { QualityText, QualitySummary, DescribeQualityOptions } from './quality-text.js';
