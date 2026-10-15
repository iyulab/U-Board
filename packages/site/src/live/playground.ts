// The "build one in your browser" page: the product's authoring view on the pump-room sample, with
// the same in-page source the board at the top of the home page reads. Nothing leaves the browser —
// saving keeps the board in localStorage, so it opens again where it was left.

import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthoringView, KO_LABELS, type ViewDocument } from '@iyulab/u-board';
import '@iyulab/u-board/styles.css';
import { savedBoard, STORAGE_KEY } from './saved-board';
import { sampleBoard, SampleAdapter, SAMPLE_ADAPTER_ID, type SampleBoardText } from './sample-board';

interface PlaygroundText extends SampleBoardText {
  source: string;
  references: Record<string, string>;
  saved: string;
  unsaved: string;
}

function storage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

for (const host of document.querySelectorAll<HTMLElement>('[data-playground]')) {
  const text = JSON.parse(host.dataset.playground ?? '{}') as PlaygroundText;
  const status = document.querySelector<HTMLElement>('[data-playground-status]');
  const reset = document.querySelector<HTMLButtonElement>('[data-playground-reset]');
  const korean = document.documentElement.lang === 'ko';

  const save = (doc: ViewDocument) => {
    try {
      storage()?.setItem(STORAGE_KEY, JSON.stringify(doc));
      if (status) status.textContent = text.saved;
    } catch {
      // A browser that refuses storage (private mode, full) still lets the board be exported.
    }
  };

  reset?.addEventListener('click', () => {
    try {
      storage()?.removeItem(STORAGE_KEY);
    } catch {
      // nothing stored to remove
    }
    window.location.reload();
  });

  host.replaceChildren();
  createRoot(host).render(
    createElement(AuthoringView, {
      initialDocument: savedBoard(storage()) ?? sampleBoard(text),
      adapters: [new SampleAdapter(Date.now, text.references)],
      connectorLabels: { [SAMPLE_ADAPTER_ID]: text.source },
      onSave: save,
      onDirtyChange: dirty => {
        if (status && dirty) status.textContent = text.unsaved;
      },
      labels: korean ? KO_LABELS : undefined,
    })
  );
}
