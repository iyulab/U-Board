// The page `renderBoard` draws a board in: the library's own viewer, with the host's adapters standing at the other end of a
// function the browser reaches into Node by. It is bundled to `dist/render-page/` when the package is built, and runs from
// that alone — no server and no network.

import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { BoardView, KO_LABELS, type Adapter, type Attribution, type ResolvedBinding } from '@iyulab/u-board/viewer';
import type { Board } from '@iyulab/u-board/domain';
import '@iyulab/u-board/styles.css';

/** What Node hands the page before it loads: the board, which adapters stand behind the host's side, and how to draw. */
interface Job {
  board: Board;
  adapters: Array<{ id: string; attribution?: Attribution; sample?: boolean }>;
  width: number;
  height: number;
  variables?: Record<string, string>;
  /** The moment the board reads "now" by, epoch milliseconds; the machine's clock when left out. */
  now?: number;
  korean?: boolean;
}

declare global {
  interface Window {
    __ubJob: Job;
    /** Node's side: the adapter of that id resolves that reference. */
    __ubResolve(id: string, ref: unknown): Promise<ResolvedBinding>;
  }
}

const job = window.__ubJob;
const opened = Date.now();
const adapters: Adapter[] = job.adapters.map(a => ({
  id: a.id,
  ...(a.attribution && { attribution: a.attribution }),
  ...(a.sample !== undefined && { sample: a.sample }),
  resolve: ref => window.__ubResolve(a.id, ref),
}));

createRoot(document.getElementById('root')!).render(
  createElement(BoardView, {
    board: job.board,
    adapters,
    width: job.width,
    height: job.height,
    ...(job.variables && { variables: job.variables }),
    ...(job.now !== undefined && { clock: () => job.now! + (Date.now() - opened) }),
    ...(job.korean && { labels: KO_LABELS }),
  })
);
