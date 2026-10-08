// Replaces the static figure with the live board once the page can run it. The figure stays for a
// browser without script, and is what search engines and link previews read.

import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { ViewerPage, KO_LABELS } from '@iyulab/u-board/viewer';
import '@iyulab/u-board/styles.css';
import { sampleBoard, SampleAdapter, type SampleBoardText } from './sample-board';

const POLL_INTERVAL_MS = 3000;

for (const host of document.querySelectorAll<HTMLElement>('[data-live-board]')) {
  const text = JSON.parse(host.dataset.liveBoard ?? '{}') as SampleBoardText;
  const korean = document.documentElement.lang === 'ko';
  host.replaceChildren();
  host.classList.add('live');
  createRoot(host).render(
    createElement(ViewerPage, {
      initialDocument: sampleBoard(text),
      adapters: [new SampleAdapter()],
      pollIntervalMs: POLL_INTERVAL_MS,
      ariaLabel: text.plant,
      labels: korean ? KO_LABELS : undefined,
    })
  );
}
