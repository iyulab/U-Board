// The board language's second version: its shapes, its schema, its check, the picture the renderer draws from a board,
// and the one-time conversion of a stored first-version board. Not stable before the release that makes it the stored
// format — what this entry exports may still change in a minor release.

export type * from './board-v2/types.js';
export { BOARD_LANGUAGE_VERSION, EMPHASES, FRAMES, TONES } from './board-v2/types.js';
export { boardV2Schema } from './board-v2/schema.js';
export { validateBoardV2 } from './board-v2/validate.js';
export type { BoardIssue } from './board-v2/validate.js';
export { checkBoardV2, isBoardV2, sourceAdvice } from './board-v2/check.js';
export type { BoardCheck, BoardFinding, KnownSource } from './board-v2/check.js';
export { PART_KINDS, partKind } from './board-v2/kinds.js';
export type { PartKind } from './board-v2/kinds.js';
export { toViewDocument, keyReadsOf, keysIn, PictureError } from './board-v2/picture.js';
export type { KeyRead, PictureOptions } from './board-v2/picture.js';
export { fromV1 } from './board-v2/from-v1.js';
export { boardV2Rulebook, RULEBOOK_EXAMPLE } from './board-v2/rulebook.js';
export type { V1Conversion } from './board-v2/from-v1.js';
