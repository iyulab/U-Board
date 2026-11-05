// The page `show_board` draws a board in, inside the assistant's window (an MCP App): the library's own viewer, with the values
// read through the server by the host — the page calls `read_sources`, a tool only it may call, and asks for no address of its own.
// It is bundled to one file when the package is built, and runs from that alone.

import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@modelcontextprotocol/ext-apps/app-with-deps';
import { BoardView, KO_LABELS, type Adapter, type Attribution, type ResolvedBinding } from '@iyulab/u-board/viewer';
import type { Board } from '@iyulab/u-board/domain';
import '@iyulab/u-board/styles.css';
import { frameHeight } from './frame.js';

/** What `show_board` answers the page with (its `structuredContent`). */
interface Shown {
  board: Board;
  name?: string;
  adapters: Array<{ id: string; attribution?: Attribution; sample?: boolean }>;
}

/** The most references one call to `read_sources` carries (the server's limit). */
const MAX_READS = 200;
/** How long to wait for the viewer to finish asking: what it asks in one moment goes in one call. */
const GATHER_MS = 5;
/** The viewer asks again this often, so the values and how current they are stay true while the board is open. */
const POLL_MS = 30_000;

const app = new App({ name: 'u-board-board-page', version: '1' }, {});
const frame = document.getElementById('root')!;
const root = createRoot(frame);

const disconnected = (message: string): ResolvedBinding => ({ value: undefined, quality: 'disconnected', reason: 'transport', message });

function textOf(result: { content?: Array<{ type: string; text?: string }> }): string {
  return (result.content ?? []).map(c => (c.type === 'text' ? c.text : undefined)).filter(Boolean).join(' ');
}

/** The viewer asks for one reference at a time; the host is asked for many at once, each round trip crossing the host. */
function reader(): (source: string, ref: unknown) => Promise<ResolvedBinding> {
  let waiting: Array<{ source: string; ref: unknown; done: (answer: ResolvedBinding) => void }> = [];
  let timer: ReturnType<typeof setTimeout> | undefined;
  async function send(batch: typeof waiting): Promise<void> {
    try {
      const result = await app.callServerTool({ name: 'read_sources', arguments: { reads: batch.map(({ source, ref }) => ({ source, ref })) } });
      const answers = (result.structuredContent as { answers?: ResolvedBinding[] } | undefined)?.answers;
      if (result.isError || !Array.isArray(answers)) throw new Error(textOf(result) || 'the values could not be read');
      batch.forEach((read, i) => read.done(answers[i] ?? disconnected('no answer for this read')));
    } catch (error) {
      for (const read of batch) read.done(disconnected(error instanceof Error ? error.message : String(error)));
    }
  }
  function flush(): void {
    timer = undefined;
    const all = waiting;
    waiting = [];
    for (let i = 0; i < all.length; i += MAX_READS) void send(all.slice(i, i + MAX_READS));
  }
  return (source, ref) =>
    new Promise(done => {
      waiting.push({ source, ref, done });
      timer ??= setTimeout(flush, GATHER_MS);
    });
}

function notice(text: string): void {
  root.render(createElement('p', { className: 'notice', role: 'status' }, text));
}

const read = reader();

/** The frame is as tall as the board is shaped — a wide board does not sit in a tall empty frame — and follows the host when it
 *  gives the page another width. The host is told the page's height as it changes. */
let shaped: Board | undefined;
function fit(): void {
  if (shaped) frame.style.height = `${frameHeight(shaped, document.documentElement.clientWidth || window.innerWidth)}px`;
}
window.addEventListener('resize', fit);

app.ontoolresult = result => {
  const shown = result.structuredContent as Shown | undefined;
  if (result.isError || !shown?.board) {
    notice(textOf(result) || 'no board to show');
    return;
  }
  const adapters: Adapter[] = (shown.adapters ?? []).map(a => ({
    id: a.id,
    ...(a.attribution && { attribution: a.attribution }),
    ...(a.sample !== undefined && { sample: a.sample }),
    resolve: ref => read(a.id, ref),
  }));
  shaped = shown.board;
  fit();
  const korean = app.getHostContext()?.locale?.toLowerCase().startsWith('ko') === true;
  root.render(
    createElement(BoardView, {
      board: shown.board,
      adapters,
      pollIntervalMs: POLL_MS,
      ...(shown.name && { ariaLabel: shown.name }),
      ...(korean && { labels: KO_LABELS }),
    })
  );
};

notice('…');
await app.connect();
