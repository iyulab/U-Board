import { z } from 'zod';
import {
  applyEditCommands,
  applyJsonPatch,
  documentPatch,
  EditCommandError,
  getByPointer,
  JsonPatchError,
  lintViewDocument,
  validateViewDocument,
  type EditCommand,
  type ViewDocument,
} from '@iyulab/u-board/domain';
import { UBoardApiError, type UBoardClient } from './client.js';
import { describeTopic, TOPICS } from './describe.js';
import { shapeOf } from './shape.js';
import { widgetAdvice } from './widget-advice.js';
import type { Looker } from './look.js';

/** What a tool answers: compact JSON text, and for `look` a picture with it — the shape an MCP tool result takes. */
export type ToolResult = { content: Array<{ type: 'text'; text: string } | { type: 'image'; data: string; mimeType: string }>; isError?: boolean };

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
  if (error instanceof EditCommandError) {
    return { content: [{ type: 'text', text: JSON.stringify({ code: 'INVALID_COMMAND', command: error.index, path: error.path, message: error.message }) }], isError: true };
  }
  if (error instanceof JsonPatchError) return { content: [{ type: 'text', text: JSON.stringify({ code: 'INVALID_PATCH', operation: error.index, message: error.message }) }], isError: true };
  return { content: [{ type: 'text', text: JSON.stringify({ error: error instanceof Error ? error.message : String(error) }) }], isError: true };
}

/** What is left after a look, in one line — first in the answer, so a writer that skims to the picture still reads that
 *  the board is not done while problems or advice stand. A part seen up close says so for the part only. */
function lookStatus(problems: number, advice: number, focus: string | undefined): string {
  const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
  const left = [problems > 0 && count(problems, 'problem', 'problems'), advice > 0 && count(advice, 'piece of advice', 'pieces of advice')].filter(Boolean).join(' and ');
  if (left) return `not done — ${left} to fix${focus ? ' on this part' : ''}`;
  return focus ? 'nothing to fix on this part — look at the whole board before finishing' : 'done — nothing to fix';
}

/** Whether advice is about the part at `focus`: at it or inside it, or naming it ("overlaps node … (/nodes/3)") — and for
 *  a component instance, what is said of its component (`within`, "/components/card/"), which it draws too. */
function concerns(advice: { path?: string; message: string }, focus: string, within?: string): boolean {
  return advice.path === focus || !!advice.path?.startsWith(`${focus}/`) || advice.message.includes(`(${focus})`) || (!!within && !!advice.path?.startsWith(within));
}

/** The pointer prefix of the component the instance at `focus` draws, when `focus` is one. */
function componentOf(document: ViewDocument, focus: string | undefined): string | undefined {
  const instance = focus && /^\/instances\/(\d+)$/.exec(focus);
  if (!instance || document.kind !== 'canvas') return undefined;
  const name = document.instances?.[Number(instance[1])]?.component;
  return name === undefined ? undefined : `/components/${name.replace(/~/g, '~0').replace(/\//g, '~1')}/`;
}

async function tool(run: () => Promise<unknown> | unknown): Promise<ToolResult> {
  try {
    return ok(await run());
  } catch (error) {
    return failed(error);
  }
}

/** What to do when a source could not be read, by the reason — a reading that failed says where to go next; without
 *  it, an assistant that cannot find a path keeps guessing new ones. */
const UNREAD: Record<string, string> = {
  address:
    'The source has nothing at this path. Its paths are in its description (list_sources) or its own documentation — read that, or ask the person for the request (the path and its query); do not guess them.',
  auth: 'The source refused the credential it was given. Its owner fixes that in the console; a board cannot.',
  throttled: 'The source asks for fewer requests. Wait before reading it again.',
  format: 'The source answered, but not with JSON — this path is not one a binding can read.',
  source:
    'The source answered, but said in its answer that it could not serve the request — its words are in message (a key it does not accept, a query it rejects, a spent quota). A key is fixed by the source’s owner in the console; a query, by the path.',
  transport: 'The source could not be reached. Try again later, or ask the person whether it is up.',
};

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
const name = z.string().min(1).max(40);
const command = z.discriminatedUnion('command', [
  z.strictObject({ command: z.literal('rename-element'), from: name, to: name }),
  z.strictObject({ command: z.literal('remove-element'), name }),
  z.strictObject({ command: z.literal('rename-symbol'), from: name, to: name }),
  z.strictObject({ command: z.literal('remove-symbol'), name }),
  z.strictObject({ command: z.literal('remove'), ids: z.array(z.string().min(1)).min(1).describe('Node, connector, decoration or instance ids (a grid: item ids, and node, connector or decoration ids of its canvas cells).') }),
  z.strictObject({
    command: z.literal('make-component'),
    ids: z.array(z.string().min(1)).min(1).describe('The board’s own nodes and frames to make one; the lines between them come along.'),
    name,
    instance: z.string().min(1).max(100).describe('The id of the instance that then draws them where they were.'),
  }),
  z.strictObject({ command: z.literal('detach'), instance: z.string().min(1).max(100) }),
  z.strictObject({ command: z.literal('rename-component'), from: name, to: name }),
  z.strictObject({ command: z.literal('remove-component'), name }),
]);
// `additionalProperties: true`, not the `{}` a passthrough object is written as: a widely used open-model tool-call
// parser (vLLM's, serving Qwen) rewrites the values under an empty schema — arrays came back as objects — and the
// model was told off for what it never sent.
const document = z
  .looseObject({ kind: z.enum(['canvas', 'grid'], { error: WRAPPED('kind', 'the document { "kind": "canvas", … }') }) })
  .meta({ additionalProperties: true })
  .describe('A whole board document: { kind: "canvas", background, nodes, connectors, decorations?, elements? } or { kind: "grid", items } — describe("rules").');

/** A tool an assistant draws boards with: what the MCP server lists, and what any other host of a model (the
 *  console's chat panel) offers it — the same names, descriptions, inputs and answers. */
export interface BoardTool {
  name: string;
  description: string;
  inputSchema: z.ZodObject;
  annotations?: { destructiveHint?: boolean; idempotentHint?: boolean };
  run(args: never): Promise<ToolResult>;
}

export interface BoardToolsOptions {
  /** Draws a saved board as a picture; without one there is no `look`. */
  looker?: Looker;
  /** Whether `board_state` is offered — it reads through the share route, which takes an API token, not a console
   *  session. True when left out. */
  boardState?: boolean;
}

/**
 * The tools an AI assistant reads and draws a workspace's boards with, through `client`. Few tools, each a whole task;
 * reads take a JSON Pointer so only the part needed travels; changes are JSON Patches answered with the new revision
 * and advice — never the document again. Nothing here needs Node: the MCP server registers them, and a browser can
 * hand them to a model as they are.
 */
export function boardTools(client: UBoardClient, { looker, boardState = true }: BoardToolsOptions = {}): BoardTool[] {
  const tools: BoardTool[] = [];
  function define<S extends z.ZodObject>(name: string, config: { description: string; inputSchema: S; annotations?: BoardTool['annotations'] }, run: (args: z.infer<S>) => Promise<ToolResult>): void {
    tools.push({ name, ...config, run: run as BoardTool['run'] });
  }

  define(
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

  define(
    'list_boards',
    { description: "The workspace's boards: id, name, kind (canvas or grid), when last saved.", inputSchema: z.strictObject({}) },
    async () => tool(async () => ({ workspace: (await client.tokenInfo()).workspace, boards: await client.listBoards() }))
  );

  define(
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

  if (boardState) {
    define(
      'board_state',
      {
        description:
          'What a saved board shows now, part by part: the state each part is in (its states rule), its connection quality and why, how old its data is — no values, a few hundred bytes. Ask it before look to check what a change does to the states; look shows how it is drawn.',
        inputSchema: z.strictObject({ board: boardId }),
      },
      async ({ board }) => tool(() => client.getBoardState(board))
    );
  }

  define(
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

  define(
    'delete_board',
    {
      description:
        'Deletes a board for good — one you made and no longer need, or one the user asked you to remove. A data source is removed by a person in the console.',
      inputSchema: z.strictObject({ board: boardId }),
      annotations: { destructiveHint: true, idempotentHint: true },
    },
    async ({ board }) =>
      tool(async () => {
        await client.deleteBoard(board);
        return { deleted: board };
      })
  );

  define(
    'rename_board',
    {
      description:
        'Renames a board. Its id stays, and with it the links it is shared by and its history — rename it rather than making a new board and deleting the old one. The name is not part of the document.',
      inputSchema: z.strictObject({ board: boardId, name: z.string().trim().min(1).max(200) }),
      annotations: { idempotentHint: true },
    },
    async ({ board, name }) =>
      tool(async () => {
        const saved = await client.renameBoard(board, name);
        return { id: saved.id, name: saved.name, revision: saved.revision };
      })
  );

  define(
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

  define(
    'edit_board',
    {
      description:
        'Makes edits that change a board in more than one place, as the editor does, and saves them as one patch: rename or remove an element or a symbol (every use follows), remove parts with the lines and triggers that name them, make a component of nodes and frames, detach an instance into parts, rename or remove a component with its instances. Commands run in order, all or nothing. dryRun answers the patch and the checks without saving.',
      inputSchema: z.strictObject({ board: boardId, revision, commands: z.array(command).min(1).max(50), dryRun: z.boolean().optional() }),
    },
    async ({ board, revision: expected, commands, dryRun }) =>
      tool(async () => {
        const current = await client.getBoard(board);
        if (expected !== undefined && expected !== current.revision) {
          throw new Error(`the board is at revision ${current.revision}, not ${expected} — get_board again and redo the change`);
        }
        const edited = applyEditCommands(current.document as ViewDocument, commands as EditCommand[]);
        const change = documentPatch(current.document, edited);
        if (change.length === 0) return { revision: current.revision, operations: 0, advice: [] };
        if (dryRun) {
          const issues = validateViewDocument(edited, { strict: true });
          const advice = issues.length === 0 ? [...lintViewDocument(edited), ...widgetAdvice(edited)] : [];
          return { valid: issues.length === 0, issues, advice, patch: change, next: `nothing is saved yet — run edit_board again without dryRun, on revision ${current.revision}` };
        }
        // Against the revision it was read at: a save in between answers 412 rather than being overwritten.
        const saved = await client.patchDocument(board, change, current.revision);
        return { ...saved, operations: change.length };
      })
  );

  define(
    'validate',
    {
      description: 'Checks without saving: a whole document, or what a board would become with a patch. Answers issues (each with its path) and advice.',
      inputSchema: z.strictObject({ document: document.optional(), board: boardId.optional(), patch: patch.optional() }),
    },
    async ({ document, board, patch }) =>
      tool(async () => {
        let candidate: unknown = document;
        let revision: number | undefined;
        if (candidate === undefined) {
          if (!board || !patch) throw new Error('give a document, or a board and a patch');
          const current = await client.getBoard(board);
          revision = current.revision;
          candidate = applyJsonPatch(current.document, patch);
        }
        const issues = validateViewDocument(candidate, { strict: true });
        const advice = issues.length === 0 ? [...lintViewDocument(candidate as ViewDocument), ...widgetAdvice(candidate)] : [];
        // A check of a change to a board saves nothing: say so, with the revision the change is to be sent on — a
        // writer that took the check for the save sends the next patch on a revision the board never reached.
        const unsaved = revision !== undefined && issues.length === 0 && { next: `nothing is saved yet — send this patch with patch_board, on revision ${revision}` };
        return { valid: issues.length === 0, issues, advice, ...unsaved };
      })
  );

  if (looker) {
    define(
      'look',
      {
        description:
          'Draws a saved board as its viewers see it and answers a picture of it, with what went wrong while drawing (problems: an element’s error, a widget whose content runs past its box, values not live) and the advice the board’s saving gave (parts drawn over one another). Look after a change, then fix what you see and what it advises. `focus` a node, grid item, connector or decoration to see it up close — and only its problems and advice.',
        inputSchema: z.strictObject({
          board: boardId,
          focus: z.string().max(200).optional().describe('A JSON Pointer to one part: "/nodes/3", "/items/0", "/connectors/2", "/decorations/5", or a component instance, "/instances/1".'),
          appearance: z.enum(['light', 'dark']).optional().describe('Draw it on this paper instead of the board’s own — to check the other one.'),
          width: z.number().int().min(320).max(2560).optional().describe('The screen width, px (1600).'),
          height: z.number().int().min(240).max(1600).optional().describe('The screen height, px (900).'),
        }),
      },
      async ({ board, focus, appearance, width = 1600, height = 900 }) => {
        try {
          const found = await client.getBoard(board);
          const { image, report } = await looker.look({ board, focus, appearance, width, height }, found.document);
          // What saving advised stands until it is fixed: the picture's last word must not read as «nothing wrong» over it.
          // Up close, every layout finding is read before keeping the part's own — a fold past the limit would hide some.
          const lint = lintViewDocument(found.document, focus ? { geometryLimit: Infinity } : {});
          const within = componentOf(found.document, focus);
          const advice = [...lint, ...widgetAdvice(found.document)].filter(a => !focus || concerns(a, focus, within));
          // A folded line stands for the findings it counts.
          const left = advice.reduce((n, a) => n + (a.count ?? 1), 0);
          // What went wrong while drawing is the whole board's; up close, only the part's — as its advice is.
          const problems = focus ? report.problems.filter(p => concerns(p, focus, within)) : report.problems;
          return {
            content: [
              { type: 'image', data: image, mimeType: 'image/png' },
              { type: 'text', text: JSON.stringify({ revision: found.revision, status: lookStatus(problems.length, left, focus), ...report, problems, advice }) },
            ],
          };
        } catch (error) {
          return failed(error);
        }
      }
    );
  }

  define(
    'list_sources',
    {
      description: "The workspace's data sources: id (a binding's adapter), name, base URL, how it authenticates, and the description its owner wrote — the paths it answers and what each holds. Never a credential.",
      inputSchema: z.strictObject({}),
    },
    async () => tool(async () => ({ sources: await client.listSources() }))
  );

  define(
    'sample_source',
    {
      description:
        "Reads a request from a data source and answers what the response looks like — each value's JSON Pointer, type and an example, and for each list of objects the fields that tell its items apart — not the response itself. Use it to choose a binding's ref.",
      inputSchema: z.strictObject({
        source: z.string().min(1).max(100).describe('The data source id, from list_sources — or its name, when no other source has it.'),
        path: z.string().min(1).max(2000).describe('The request, relative to the source’s base URL: "/api/readings?line=1".'),
      }),
    },
    async ({ source, path }) =>
      tool(async () => {
        const { id, read } = await readSource(source, path);
        // Named by its name: the answer gives the id, which is what a binding's adapter takes.
        const named = id !== source ? { source: id, note: `"${source}" is this source's name; a binding's adapter takes its id` } : {};
        if (read.quality === 'disconnected') return { ...named, read: false, reason: read.reason, message: read.message, next: UNREAD[read.reason ?? ''] ?? UNREAD.transport };
        return { ...named, read: true, quality: read.quality, shape: shapeOf(read.value) };
      })
  );

  /** A request read from a source named as people name it — by its id, or else by its name (case and spaces aside) when
   *  only that one source has it. Two of the same name are not guessed between: their ids are said instead. */
  async function readSource(source: string, path: string): Promise<{ id: string; read: Awaited<ReturnType<UBoardClient['resolve']>> }> {
    try {
      return { id: source, read: await client.resolve(source, { path }) };
    } catch (error) {
      if (!(error instanceof UBoardApiError && error.status === 404)) throw error;
      const key = source.trim().toLowerCase();
      const named = (await client.listSources()).filter(s => s.name.trim().toLowerCase() === key);
      if (named.length > 1) throw new UBoardApiError(404, { code: 'NOT_FOUND', message: `${named.length} sources are named "${source}" — use one's id: ${named.map(s => s.id).join(', ')}` });
      if (named.length === 0) throw error;
      return { id: named[0].id, read: await client.resolve(named[0].id, { path }) };
    }
  }

  define(
    'create_source',
    {
      description:
        'Makes a data source that needs no credential (a public or internal API with no key). A source that needs a key, token or OAuth is made by a person in the console — ask them, then use its id.',
      inputSchema: z.strictObject({
        name: z.string().min(1).max(200),
        baseUrl: z.string().url().max(2000).describe('Where the requests go, e.g. "https://api.example.com".'),
        attribution: z.strictObject({ text: z.string().min(1).max(200), url: z.string().url().optional() }).optional().describe('How the source asks to be credited, shown under a board that uses it.'),
        description: z.string().min(1).max(2000).optional().describe('The paths it answers and what each holds, for whoever binds to it next: "GET /readings?line=N — one row per machine, by id".'),
        sourceError: z
          .strictObject({
            path: z.string().regex(/^\/./).describe('A JSON Pointer to the status the source writes in its answer: "/code", "/response/header/resultCode".'),
            ok: z.array(z.string().min(1)).min(1).optional().describe('The statuses that mean success ("00"). Absent: the source writes a status there only when it fails.'),
            messagePath: z.string().regex(/^\/./).optional().describe('A JSON Pointer to its words for the error: "/message".'),
          })
          .optional()
          .describe('For a source that answers an error with success (HTTP 200) and a status in the body — where it says so, so a read fails with its words instead of a missing value.'),
      }),
    },
    async ({ name, baseUrl, attribution, description, sourceError }) =>
      tool(async () => ({ source: await client.createSource({ name, baseUrl, attribution, description, sourceError }) }))
  );

  return tools;
}
