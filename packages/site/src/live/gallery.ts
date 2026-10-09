// Draws each sample board of the gallery with the library viewer, its bindings answered from the
// sample's recording — nothing is fetched: the page runs without a server, under the site's own CSP.

import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { ViewerPage, KO_LABELS } from '@iyulab/u-board/viewer';
import '@iyulab/u-board/styles.css';
import { SAMPLE_PACKS, snapshotAdapters } from '@iyulab/u-board-samples';

const korean = document.documentElement.lang === 'ko';

for (const host of document.querySelectorAll<HTMLElement>('[data-sample-board]')) {
  const pack = SAMPLE_PACKS.find(p => p.id === host.dataset.sampleBoard);
  if (!pack) continue;
  host.replaceChildren();
  host.classList.add('live');
  createRoot(host).render(
    createElement(ViewerPage, {
      initialDocument: pack.document,
      adapters: snapshotAdapters(pack),
      ariaLabel: host.dataset.label,
      labels: korean ? KO_LABELS : undefined,
    })
  );
}
