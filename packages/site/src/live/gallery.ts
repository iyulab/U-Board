// Draws each sample board of the gallery with the library viewer, its bindings answered from the
// sample's recording — nothing is fetched: the page runs without a server, under the site's own CSP.
//
// A board is drawn when it comes near the screen, not when the page opens: the gallery holds a few dozen boards and
// a few hundred widgets, and drawing them all at once is a long wait for the one being looked at. A board once drawn
// stays drawn. Its pack — board and recording — is fetched then too, as a chunk of its own, so the page does
// not open by loading every board in the gallery.

import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { BoardView, KO_LABELS } from '@iyulab/u-board/viewer';
import '@iyulab/u-board/styles.css';
import { loadSamplePack, snapshotAdapters } from '@iyulab/u-board-samples/lazy';

const korean = document.documentElement.lang === 'ko';

async function draw(host: HTMLElement) {
  const pack = await loadSamplePack(host.dataset.sampleBoard ?? '');
  if (!pack) return;
  host.replaceChildren();
  host.classList.add('live');
  createRoot(host).render(
    createElement(BoardView, {
      board: pack.board,
      adapters: snapshotAdapters(pack),
      ariaLabel: host.dataset.label,
      labels: korean ? KO_LABELS : undefined,
    })
  );
}

const hosts = [...document.querySelectorAll<HTMLElement>('[data-sample-board]')];

if ('IntersectionObserver' in window) {
  // A screen ahead, so a board is drawn by the time it scrolls in.
  const observer = new IntersectionObserver(
    entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        void draw(entry.target as HTMLElement);
      }
    },
    { rootMargin: '100% 0px' }
  );
  for (const host of hosts) observer.observe(host);
} else {
  for (const host of hosts) void draw(host);
}
