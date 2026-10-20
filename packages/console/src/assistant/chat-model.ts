// A chat completions endpoint as OpenAI defines it — the wire most model servers speak (OpenAI itself, a gateway, a
// self-hosted open model). The person using the panel gives its address, model and key; the request goes from this
// browser to that endpoint, never through the U-Board server, which neither holds the key nor calls a model.
import type { FunctionTool } from '@iyulab/u-board-mcp/tools';

export interface ModelSettings {
  /** Where the endpoint is, up to and without `/chat/completions`: "https://api.openai.com/v1". */
  baseUrl: string;
  model: string;
  /** Sent as a bearer token; an endpoint that takes none may leave it empty. */
  apiKey: string;
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

export type ChatMessage =
  | { role: 'system' | 'user'; content: string }
  | { role: 'assistant'; content: string | null; tool_calls?: ToolCall[] }
  | { role: 'tool'; tool_call_id: string; content: string };

/** What the model is doing while its answer arrives. */
export interface StreamEvents {
  /** Words of the answer, as they arrive. */
  onText?(delta: string): void;
  /** The model reasons before it answers (a reasoning model's thinking, which is not shown). */
  onThinking?(): void;
  /** A tool call has started to arrive — its name is known, its arguments are still coming. */
  onToolCall?(name: string): void;
}

/** What went wrong reaching the model, in words the panel shows. */
export class ModelError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = 'ModelError';
  }
}

export const chatCompletionsUrl = (baseUrl: string) => `${baseUrl.trim().replace(/\/+$/, '')}/chat/completions`;

/**
 * One answer of the model to `messages`, streamed: its text and the tools it calls. Every endpoint streams the same
 * server-sent events — a `choices[0].delta` each, tool calls arriving in pieces by `index`.
 */
export async function streamChat(
  settings: ModelSettings,
  messages: ChatMessage[],
  tools: FunctionTool[],
  events: StreamEvents = {},
  signal?: AbortSignal,
  fetchImpl: typeof fetch = (...args) => fetch(...args)
): Promise<{ content: string; toolCalls: ToolCall[] }> {
  let response: Response;
  try {
    response = await fetchImpl(chatCompletionsUrl(settings.baseUrl), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(settings.apiKey && { Authorization: `Bearer ${settings.apiKey}` }) },
      body: JSON.stringify({ model: settings.model, messages, tools, tool_choice: 'auto', stream: true }),
      signal,
    });
  } catch (error) {
    if ((error as { name?: string }).name === 'AbortError') throw error;
    // A browser reports a refused cross-origin request, a wrong address and a server that is down alike.
    throw new ModelError('모델 엔드포인트에 닿지 못했습니다 — 주소가 맞는지, 그 서버가 이 사이트에서 오는 요청(CORS)을 받는지 확인하세요.');
  }
  if (!response.ok || !response.body) {
    const text = await response.text().catch(() => '');
    throw new ModelError(`모델 엔드포인트가 ${response.status}로 답했습니다${detail(text)}`, response.status);
  }

  let content = '';
  const calls: ToolCall[] = [];
  let thinking = false;
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += value;
    const lines = buffer.split('\n');
    buffer = lines.pop()!;
    for (const line of lines) {
      const data = line.startsWith('data:') ? line.slice(5).trim() : '';
      if (!data || data === '[DONE]') continue;
      let chunk: StreamChunk;
      try {
        chunk = JSON.parse(data);
      } catch {
        continue;
      }
      if (chunk.error) throw new ModelError(`모델이 오류로 답했습니다${detail(JSON.stringify(chunk.error))}`);
      const delta = chunk.choices?.[0]?.delta;
      if (!delta) continue;
      if ((delta.reasoning_content || delta.reasoning) && !thinking) {
        thinking = true;
        events.onThinking?.();
      }
      if (delta.content) {
        content += delta.content;
        events.onText?.(delta.content);
      }
      for (const piece of delta.tool_calls ?? []) {
        const index = piece.index ?? calls.length;
        const call = (calls[index] ??= { id: '', type: 'function', function: { name: '', arguments: '' } });
        if (piece.id) call.id = piece.id;
        if (piece.function?.name) {
          call.function.name += piece.function.name;
          events.onToolCall?.(call.function.name);
        }
        if (piece.function?.arguments) call.function.arguments += piece.function.arguments;
      }
    }
  }
  // An endpoint that leaves a call's id out still needs one to answer it by.
  const toolCalls = calls.filter(Boolean).map((call, i) => ({ ...call, id: call.id || `call_${i}` }));
  return { content, toolCalls };
}

interface StreamChunk {
  error?: unknown;
  choices?: Array<{
    delta?: {
      content?: string | null;
      reasoning_content?: string;
      reasoning?: string;
      tool_calls?: Array<{ index?: number; id?: string; function?: { name?: string; arguments?: string } }>;
    };
  }>;
}

/** The start of what an endpoint said with an error — enough to tell a wrong model name from a wrong key. */
function detail(text: string): string {
  const said = text.trim().slice(0, 300);
  return said ? `: ${said}` : '';
}
