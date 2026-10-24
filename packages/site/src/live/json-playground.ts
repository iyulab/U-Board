// The JSON playground: a board's definition and its data as text, and the board drawn from them by the library viewer
// as they are typed — the page answers the bindings from the data, as the gallery does, with no server. A board of the
// gallery loads into it from its published files (`?board=<id>`); what is typed stays in this page.

import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { BoardView, KO_LABELS } from '@iyulab/u-board/viewer';
import '@iyulab/u-board/styles.css';
import { SnapshotAdapter } from '@iyulab/u-board-samples/lazy';
import { readPlayground, type Problem } from './json-playground-model';

interface Text {
  definition: string;
  data: string;
  loading: string;
  loadFailed: string;
  ok: string;
  problems: string;
}

const root = document.querySelector<HTMLElement>('[data-json-playground]');
if (root) {
  const text = JSON.parse(root.dataset.jsonPlayground ?? '{}') as Text;
  const korean = document.documentElement.lang === 'ko';
  const definition = root.querySelector<HTMLTextAreaElement>('[data-field="definition"]')!;
  const data = root.querySelector<HTMLTextAreaElement>('[data-field="data"]')!;
  const picker = root.querySelector<HTMLSelectElement>('[data-board-picker]')!;
  const status = root.querySelector<HTMLElement>('[data-status]')!;
  const list = root.querySelector<HTMLUListElement>('[data-problems]')!;
  const view = createRoot(root.querySelector<HTMLElement>('[data-view]')!);
  let revision = 0;

  const showProblems = (problems: Problem[]) => {
    list.replaceChildren(
      ...problems.map(p => {
        const item = document.createElement('li');
        item.textContent = `${p.in === 'definition' ? text.definition : text.data}${p.path ? ` ${p.path}` : ''} — ${p.message}`;
        return item;
      })
    );
    status.textContent = problems.length === 0 ? text.ok : text.problems.replace('{n}', String(problems.length));
  };

  const draw = () => {
    const reading = readPlayground(definition.value, data.value);
    showProblems(reading.problems);
    if (!reading.board || !reading.data) return;
    const { board, data: answers } = reading;
    revision++;
    view.render(
      createElement(BoardView, {
        key: revision,
        board,
        adapters: answers.connectors.map(c => new SnapshotAdapter(c, answers.responses[c.key] ?? {}, answers.capturedAt)),
        labels: korean ? KO_LABELS : undefined,
      })
    );
  };

  let timer: ReturnType<typeof setTimeout> | undefined;
  const later = () => {
    clearTimeout(timer);
    timer = setTimeout(draw, 400);
  };
  definition.addEventListener('input', later);
  data.addEventListener('input', later);
  // Tab indents rather than leaving the text box — the two boxes are for writing JSON.
  for (const box of [definition, data]) {
    box.addEventListener('keydown', event => {
      if (event.key !== 'Tab' || event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) return;
      event.preventDefault();
      box.setRangeText('  ', box.selectionStart, box.selectionEnd, 'end');
      later();
    });
  }

  const load = async (id: string) => {
    status.textContent = text.loading;
    try {
      const [board, answers] = await Promise.all(
        [`/gallery/${id}/board.json`, `/gallery/${id}/data.json`].map(async url => {
          const response = await fetch(url);
          if (!response.ok) throw new Error(String(response.status));
          return response.text();
        })
      );
      definition.value = board;
      data.value = answers;
      const url = new URL(window.location.href);
      url.searchParams.set('board', id);
      history.replaceState(null, '', url);
      draw();
    } catch {
      status.textContent = text.loadFailed;
    }
  };

  picker.addEventListener('change', () => void load(picker.value));
  const asked = new URLSearchParams(window.location.search).get('board');
  const first = asked && [...picker.options].some(o => o.value === asked) ? asked : picker.value;
  picker.value = first;
  void load(first);
}
