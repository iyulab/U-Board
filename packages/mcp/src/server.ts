import { createRequire } from 'node:module';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { applyJsonPatch, getByPointer, JsonPatchError, lintViewDocument, validateViewDocument, type ViewDocument } from '@iyulab/u-board/domain';
import { UBoardApiError, type UBoardClient } from './client.js';
import { describeTopic, TOPICS } from './describe.js';
import { shapeOf } from './shape.js';
import { widgetAdvice } from './widget-advice.js';
import type { Looker } from './look.js';

const { version } = createRequire(import.meta.url)('../package.json') as { version: string };

type ToolResult = { content: Array<{ type: 'text'; text: string } | { type: 'image'; data: string; mimeType: string }>; isError?: boolean };

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
      error.status === 404 ? 'Nothing in this workspace has that id — list_boards and list_sources give the ids.' :
      error.body.code === 'INVALID_DOCUMENT' ? 'Fix each issue at its path; describe("rules") or describe("canvas") says what goes there.' :
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
/** Said when a writer nests an object in its own first key — the commonest shape mistake, and one the plain schema
 *  error ("expected one of …") does not explain. */
const WRAPPED = (key: string, shape: string) => (issue: { input?: unknown }) =>
  typeof issue.input === 'object' && issue.input !== null && key in issue.input
    ? `this is wrapped in "${key}" — write ${shape} itself, not { "${key}": { … } }`
    : undefined;
const operation = z.object({
  op: z.enum(['add', 'remove', 'replace', 'move', 'copy', 'test'], { error: WRAPPED('op', '{ "op": "add", "path": "/…", "value": … }') }),
  path: z.string().describe('A JSON Pointer: "/nodes/-" appends to nodes, "/nodes/3/x" is a field.'),
  value: z.unknown().optional().describe('For add, replace and test.'),
  from: z.string().optional().describe('For move and copy.'),
});
const patch = z.array(operation).min(1).describe('A JSON Patch (RFC 6902), applied entirely or not at all.');
// `additionalProperties: true`, not the `{}` a passthrough object is written as: a widely used open-model tool-call
// parser (vLLM's, serving Qwen) rewrites the values under an empty schema — arrays came back as objects — and the
// model was told off for what it never sent.
const document = z
  .looseObject({ kind: z.enum(['canvas', 'grid'], { error: WRAPPED('kind', 'the document { "kind": "canvas", … }') }) })
  .meta({ additionalProperties: true })
  .describe('A whole board document: { kind: "canvas", background, nodes, connectors, decorations?, elements? } or { kind: "grid", items } — describe("rules").');

/**
 * The U-Board MCP server: an AI assistant reads and draws a workspace's boards through `client`. Few tools, each a
 * whole task; reads take a JSON Pointer so only the part needed travels; changes are JSON Patches answered with the
 * new revision and advice — never the document again.
 */
export function createServer(client: UBoardClient, looker?: Looker): McpServer {
  const server = new McpServer({ name: 'u-board-mcp', version });

  server.registerTool(
    'describe',
    {
      description: 'What a U-Board board can hold and how to write one. No topic: the list of topics. Start with "rules"; read "canvas" before drawing a canvas board.',
      inputSchema: z.strictObject({
        topic: z.string().max(100).optional().describe(`One of: ${Object.keys(TOPICS).join(', ')}.`),
        pointer: z.string().max(200).optional().describe('With topic "schema": the JSON Pointer of one part, e.g. "/$defs/elementDefinition".'),
        query: z.string().max(200).optional().describe('With topic "widgets": words for what it should show, e.g. "list of messages" — only the widgets that match.'),
      }),
    },
    async ({ topic, pointer, query }) => tool(() => describeTopic(topic, pointer, query))
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
        // A refused first document makes no board: checked here first, as the server would — and should the server
        // still refuse it, the board just made is taken away again, so a retry never leaves empty boards behind.
        if (document) {
          const issues = validateViewDocument(document, { strict: true });
          if (document.kind !== kind) issues.unshift({ path: '/kind', message: `expected "${kind}", the kind asked for — got "${String(document.kind)}"` });
          if (issues.length > 0) throw new UBoardApiError(400, { code: 'INVALID_DOCUMENT', issues: issues.slice(0, 50), message: 'no board was made — fix the document and call create_board again' });
        }
        const created = await client.createBoard(name, kind);
        if (!document) return { id: created.id, revision: created.revision, advice: [] };
        try {
          const saved = await client.putDocument(created.id, document, created.revision);
          return { ...saved, advice: [...saved.advice, ...widgetAdvice(document)] };
        } catch (error) {
          await client.deleteBoard(created.id).catch(() => {});
          if (error instanceof UBoardApiError) error.body.message = 'no board was made — the server refused the document';
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
    async ({ board, revision, patch }) =>
      tool(async () => {
        const saved = await client.patchDocument(board, patch, revision);
        // The widgets the patch writes, checked where they land — the server does not read a widget's props.
        const added = patch.flatMap(op => ('value' in op ? widgetAdvice(op.value, String(op.path)) : []));
        return { ...saved, advice: [...saved.advice, ...added] };
      })
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
        const issues = validateViewDocument(candidate, { strict: true });
        const advice = issues.length === 0 ? [...lintViewDocument(candidate as ViewDocument), ...widgetAdvice(candidate)] : [];
        return { valid: issues.length === 0, issues, advice };
      })
  );

  if (looker) {
    server.registerTool(
      'look',
      {
        description:
          'Draws a saved board as its viewers see it and answers a picture of it, with what went wrong while drawing (an element’s error, a widget whose content runs past its box, values not live). Look after a change, then fix what you see. `focus` a node, grid item or decoration to see it up close.',
        inputSchema: z.strictObject({
          board: boardId,
          focus: z.string().max(200).optional().describe('A JSON Pointer to one part: "/nodes/3", "/items/0", "/decorations/5".'),
          appearance: z.enum(['light', 'dark']).optional().describe('Draw it on this paper instead of the board’s own — to check the other one.'),
          width: z.number().int().min(320).max(2560).optional().describe('The screen width, px (1600).'),
          height: z.number().int().min(240).max(1600).optional().describe('The screen height, px (900).'),
        }),
      },
      async ({ board, focus, appearance, width = 1600, height = 900 }) => {
        try {
          const found = await client.getBoard(board);
          const { image, report } = await looker.look({ board, focus, appearance, width, height }, found.document);
          return {
            content: [
              { type: 'image', data: image, mimeType: 'image/png' },
              { type: 'text', text: JSON.stringify({ revision: found.revision, ...report }) },
            ],
          };
        } catch (error) {
          return failed(error);
        }
      }
    );
  }

  server.registerTool(
    'list_sources',
    {
      description: "The workspace's data sources: id (a binding's adapter), name, base URL, how it authenticates. Never a credential.",
      inputSchema: z.strictObject({}),
    },
    async () => tool(async () => ({ sources: await client.listSources() }))
  );

  server.registerTool(
    'sample_source',
    {
      description:
        "Reads a request from a data source and answers what the response looks like — each value's JSON Pointer, type and an example, and for each list of objects the fields that tell its items apart — not the response itself. Use it to choose a binding's ref.",
      inputSchema: z.strictObject({
        source: z.string().min(1).max(100).describe('The data source id, from list_sources.'),
        path: z.string().min(1).max(2000).describe('The request, relative to the source’s base URL: "/api/readings?line=1".'),
      }),
    },
    async ({ source, path }) =>
      tool(async () => {
        const read = await client.resolve(source, { path });
        if (read.quality === 'disconnected') return { read: false, reason: read.reason, message: read.message };
        return { read: true, quality: read.quality, shape: shapeOf(read.value) };
      })
  );

  server.registerTool(
    'create_source',
    {
      description:
        'Makes a data source that needs no credential (a public or internal API with no key). A source that needs a key, token or OAuth is made by a person in the console — ask them, then use its id.',
      inputSchema: z.strictObject({
        name: z.string().min(1).max(200),
        baseUrl: z.string().url().max(2000).describe('Where the requests go, e.g. "https://api.example.com".'),
        attribution: z.strictObject({ text: z.string().min(1).max(200), url: z.string().url().optional() }).optional().describe('How the source asks to be credited, shown under a board that uses it.'),
      }),
    },
    async ({ name, baseUrl, attribution }) => tool(async () => ({ source: await client.createSource({ name, baseUrl, attribution }) }))
  );

  return server;
}
