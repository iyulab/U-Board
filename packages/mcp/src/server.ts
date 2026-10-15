import { createRequire } from 'node:module';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { applyJsonPatch, getByPointer, JsonPatchError, lintViewDocument, validateViewDocument, type ViewDocument } from '@iyulab/u-board/domain';
import { UBoardApiError, type UBoardClient } from './client.js';
import { describeTopic, TOPICS } from './describe.js';

const { version } = createRequire(import.meta.url)('../package.json') as { version: string };

type ToolResult = { content: Array<{ type: 'text'; text: string }>; isError?: boolean };

/** Every answer is compact JSON (or the rules' text) — whitespace costs the assistant tokens and says nothing. */
function ok(value: unknown): ToolResult {
  return { content: [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value) }] };
}

/** A failure the assistant can act on: what the server said, and what to do next where there is something to say. */
function failed(error: unknown): ToolResult {
  if (error instanceof UBoardApiError) {
    const hint =
      error.status === 412 ? 'The board was saved since that revision — get_board again and redo the change.' :
      error.status === 401 ? 'The API token is not valid — ask for a new one (console → workspace settings → API 토큰).' :
      error.status === 403 && error.body.code === 'READ_ONLY_TOKEN' ? 'This token may only read — ask for a write token.' :
      error.status === 403 && error.body.code === 'CREDENTIALS_IN_CONSOLE' ? 'Credentials are entered by a person in the console, never here.' :
      error.body.code === 'INVALID_DOCUMENT' ? 'Fix each issue at its path; describe("rules") or describe("schema") says what goes there.' :
      undefined;
    return { content: [{ type: 'text', text: JSON.stringify({ status: error.status, ...error.body, ...(hint && { hint }) }) }], isError: true };
  }
  if (error instanceof JsonPatchError) return { content: [{ type: 'text', text: JSON.stringify({ code: 'INVALID_PATCH', operation: error.index, message: error.message }) }], isError: true };
  return { content: [{ type: 'text', text: JSON.stringify({ error: error instanceof Error ? error.message : String(error) }) }], isError: true };
}

async function tool(run: () => Promise<unknown> | unknown): Promise<ToolResult> {
  try {
    return ok(await run());
  } catch (error) {
    return failed(error);
  }
}

const boardId = z.string().min(1).max(100).describe('The board id, from list_boards.');
const revision = z.number().int().positive().optional().describe('The revision the change was made against (from get_board). A board saved since answers 412.');
const patch = z
  .array(z.record(z.string(), z.unknown()))
  .min(1)
  .describe('A JSON Patch (RFC 6902): [{ "op": "add" | "remove" | "replace" | "move" | "copy" | "test", "path": "/json/pointer", "value"?, "from"? }].');
const document = z.record(z.string(), z.unknown()).describe('A whole board document — describe("rules") and describe("schema").');

/**
 * The U-Board MCP server: an AI assistant reads and draws a workspace's boards through `client`. Few tools, each a
 * whole task; reads take a JSON Pointer so only the part needed travels; changes are JSON Patches answered with the
 * new revision and advice — never the document again.
 */
export function createServer(client: UBoardClient): McpServer {
  const server = new McpServer({ name: 'u-board-mcp', version });

  server.registerTool(
    'describe',
    {
      description: 'What a U-Board board can hold and how to write one. No topic: the list of topics. Start with "rules".',
      inputSchema: z.strictObject({
        topic: z.string().max(100).optional().describe(`One of: ${Object.keys(TOPICS).join(', ')}.`),
        pointer: z.string().max(200).optional().describe('With topic "schema": the JSON Pointer of one part, e.g. "/$defs/elementDefinition".'),
      }),
    },
    async ({ topic, pointer }) => tool(() => describeTopic(topic, pointer))
  );

  server.registerTool(
    'list_boards',
    { description: "The workspace's boards: id, name, kind (canvas or grid), when last saved.", inputSchema: z.strictObject({}) },
    async () => tool(async () => ({ workspace: (await client.tokenInfo()).workspace, boards: await client.listBoards() }))
  );

  server.registerTool(
    'get_board',
    {
      description: 'A board, or one part of its document by JSON Pointer ("/items", "/elements/pump", "/nodes/3/widget"), with its revision.',
      inputSchema: z.strictObject({
        board: boardId,
        pointer: z.string().max(200).optional().describe('A JSON Pointer into the document. Omit for the whole document.'),
      }),
    },
    async ({ board, pointer }) =>
      tool(async () => {
        const found = await client.getBoard(board);
        return {
          id: found.id,
          name: found.name,
          revision: found.revision,
          kind: found.document.kind,
          ...(pointer ? { pointer, value: getByPointer(found.document, pointer) } : { document: found.document }),
        };
      })
  );

  server.registerTool(
    'create_board',
    {
      description: 'Makes a board of a kind ("grid" for an ordinary dashboard, "canvas" to place over a drawing), optionally with a whole first document.',
      inputSchema: z.strictObject({
        name: z.string().min(1).max(200),
        kind: z.enum(['grid', 'canvas']),
        document: document.optional(),
      }),
    },
    async ({ name, kind, document }) =>
      tool(async () => {
        const created = await client.createBoard(name, kind);
        if (!document) return { id: created.id, revision: created.revision, advice: [] };
        try {
          return await client.putDocument(created.id, document, created.revision);
        } catch (error) {
          if (error instanceof UBoardApiError) error.body.message = `board ${created.id} was made empty; its document was refused`;
          throw error;
        }
      })
  );

  server.registerTool(
    'patch_board',
    {
      description: "Changes part of a board's document with a JSON Patch, applied entirely or not at all, and saves it. Answers the new revision and advice.",
      inputSchema: z.strictObject({ board: boardId, revision, patch }),
    },
    async ({ board, revision, patch }) => tool(() => client.patchDocument(board, patch, revision))
  );

  server.registerTool(
    'validate',
    {
      description: 'Checks without saving: a whole document, or what a board would become with a patch. Answers issues (each with its path) and advice.',
      inputSchema: z.strictObject({ document: document.optional(), board: boardId.optional(), patch: patch.optional() }),
    },
    async ({ document, board, patch }) =>
      tool(async () => {
        let candidate: unknown = document;
        if (candidate === undefined) {
          if (!board || !patch) throw new Error('give a document, or a board and a patch');
          candidate = applyJsonPatch((await client.getBoard(board)).document, patch);
        }
        const issues = validateViewDocument(candidate);
        return { valid: issues.length === 0, issues, advice: issues.length === 0 ? lintViewDocument(candidate as ViewDocument) : [] };
      })
  );

  return server;
}
