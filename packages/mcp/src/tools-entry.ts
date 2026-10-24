// What a host other than the MCP server needs to offer a model the board tools — the console's chat panel. Nothing
// here needs Node.
import { z } from 'zod';
import type { BoardTool } from './tools.js';

export { boardTools, type BoardTool, type BoardToolsOptions, type ToolResult } from './tools.js';
export { UBoardClient, UBoardApiError, type SessionAuth } from './client.js';
export { TOPICS } from './describe.js';
// What `look` checks on the page a board is drawn in, for a host that draws it itself (the console's chat panel).
export { findProblems, countQualityMarks } from './look-page.js';
export { placedParts } from './look-parts.js';
export type { Looker, LookRequest, LookResult, LookReport } from './look.js';

/** A tool as an OpenAI-compatible chat completions request lists it: its name, its description, and its input as JSON
 *  Schema — what the MCP server lists, in the other wire's shape. */
export interface FunctionTool {
  type: 'function';
  function: { name: string; description: string; parameters: Record<string, unknown> };
}

export function functionTool(tool: BoardTool): FunctionTool {
  const { $schema: _dialect, ...parameters } = z.toJSONSchema(tool.inputSchema, { io: 'input' }) as Record<string, unknown>;
  return { type: 'function', function: { name: tool.name, description: tool.description, parameters } };
}
