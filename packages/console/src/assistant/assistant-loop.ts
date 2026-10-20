// One turn of the chat panel: the person's words go to the model with the board tools; the tools it calls run here,
// on the board the editor has open, and their answers go back — until the model answers in words alone.
import { functionTool, type BoardTool } from '@iyulab/u-board-mcp/tools';
import { ModelError, streamChat, type ChatMessage, type ModelSettings } from './chat-model.js';

/** The tools that change the open board — after one of them succeeds, the editor reads the board again. */
export const BOARD_WRITES = new Set(['patch_board', 'edit_board', 'rename_board']);
/** The tools the panel does not offer: it draws the board that is open, it does not make or delete others. */
const LEFT_OUT = new Set(['create_board', 'delete_board']);

/** A turn may call this many tools before the panel stops it — a model caught in a loop of failing patches. */
export const MAX_TOOL_CALLS = 40;

export interface OpenBoard {
  id: string;
  name: string;
  kind: string;
}

export function panelTools(tools: BoardTool[]): BoardTool[] {
  return tools.filter(t => !LEFT_OUT.has(t.name));
}

/** What the model is told before the conversation: the board it draws and how to draw it well. */
export function systemPrompt(board: OpenBoard): string {
  return `You are the drawing assistant in U-Board's board editor. The person sees the board you draw beside this chat, and each change you save appears there at once.

The board open in the editor: id "${board.id}", named "${board.name}", a ${board.kind} board. Draw on this board only — read it with get_board, change it with patch_board (edit_board for renames and removals), check a change with validate when unsure. Its kind stays ${board.kind}.

Before the first change, read describe({ "topic": "rules" }); read describe({ "topic": "${board.kind === 'canvas' ? 'canvas' : 'widgets'}" }) too, and describe({ "topic": "widget:<type>" }) for a widget you have not used.

Make it beautiful and easy to read: a clear title, a balanced layout with room around each part, one consistent palette, the most important figures largest. When no data source holds what the person asks for, write example values into the widgets' props (no bindings), so the board shows something — and say that the values are examples.

Draw it in a few steps the person can watch: the layout and the main figures first, then the charts, then the finishing touches — each step one patch_board with several operations, not one operation per call. When a tool answers an error, fix what it says and go on.

Answer in the person's language, in two or three plain sentences (no Markdown — the chat shows text as it is): what you drew, and what they could ask for next. Before a step, say in one short sentence what you are about to draw.`;
}

export type TurnEvent =
  | { type: 'text'; delta: string }
  | { type: 'thinking' }
  | { type: 'tool-start'; id: string; name: string; args: unknown }
  | { type: 'tool-end'; id: string; name: string; ok: boolean; answer: string }
  | { type: 'board-changed' };

/**
 * Runs one turn on `history` (which it extends with what the model says and what the tools answer) and resolves when
 * the model is done. `signal` stops it between and during calls.
 */
export async function runTurn(
  settings: ModelSettings,
  history: ChatMessage[],
  tools: BoardTool[],
  board: OpenBoard,
  onEvent: (event: TurnEvent) => void,
  signal?: AbortSignal,
  fetchImpl?: typeof fetch
): Promise<void> {
  const byName = new Map(tools.map(t => [t.name, t]));
  const functions = tools.map(functionTool);
  let calls = 0;
  for (;;) {
    const { content, toolCalls } = await streamChat(
      settings,
      history,
      functions,
      { onText: delta => onEvent({ type: 'text', delta }), onThinking: () => onEvent({ type: 'thinking' }) },
      signal,
      fetchImpl
    );
    history.push({ role: 'assistant', content: content || null, ...(toolCalls.length > 0 && { tool_calls: toolCalls }) });
    if (toolCalls.length === 0) return;
    for (const call of toolCalls) {
      signal?.throwIfAborted();
      calls += 1;
      const args = parseArgs(call.function.arguments);
      onEvent({ type: 'tool-start', id: call.id, name: call.function.name, args });
      const { ok, answer } = await runTool(byName.get(call.function.name), call.function.name, args);
      history.push({ role: 'tool', tool_call_id: call.id, content: answer });
      onEvent({ type: 'tool-end', id: call.id, name: call.function.name, ok, answer });
      if (ok && BOARD_WRITES.has(call.function.name) && (args as { board?: unknown } | undefined)?.board === board.id) onEvent({ type: 'board-changed' });
    }
    if (calls >= MAX_TOOL_CALLS) throw new ModelError(`도구를 ${MAX_TOOL_CALLS}번 부른 뒤 멈췄습니다 — 보드는 거기까지 저장돼 있습니다. 이어서 하려면 다시 요청하세요.`);
  }
}

function parseArgs(text: string): unknown {
  if (!text.trim()) return {};
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

/** A tool's answer as the model reads it: its text, or what is wrong with the call — as the MCP server answers. */
async function runTool(tool: BoardTool | undefined, name: string, args: unknown): Promise<{ ok: boolean; answer: string }> {
  if (!tool) return { ok: false, answer: JSON.stringify({ error: `there is no tool "${name}"` }) };
  if (args === undefined) return { ok: false, answer: JSON.stringify({ error: 'the arguments are not JSON — send them as one JSON object' }) };
  const parsed = tool.inputSchema.safeParse(args);
  if (!parsed.success) {
    return { ok: false, answer: JSON.stringify({ error: 'invalid arguments', issues: parsed.error.issues.map(i => ({ path: i.path.join('/'), message: i.message })) }) };
  }
  const result = await tool.run(parsed.data as never);
  const answer = result.content.map(part => (part.type === 'text' ? part.text : '[image]')).join('\n');
  return { ok: !result.isError, answer };
}
