// What helps a board get written well — the check an author or an assistant reads, and the rulebook an assistant
// writes by. Reaches no UI package at runtime, so a server or an MCP process loads it.
export { checkBoard, emptyBoard, sourceAdvice } from './board/check.js';
export type { BoardCheck, BoardFinding, KnownSource } from './board/check.js';
export { boardRulebook, RULEBOOK_EXAMPLE } from './board/rulebook.js';
