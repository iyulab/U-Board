// The gallery list's filter: the tags picked narrow the cards to the boards that have every one of them. The pick lives
// in the address (`?tag=a,b`), so a filtered list can be linked to and comes back on reload or the back button.

import { pickedFromQuery, queryFor, matches } from './tag-filter';

const root = document.querySelector<HTMLElement>('[data-gallery-filter]');
if (root) {
  const chips = [...root.querySelectorAll<HTMLButtonElement>('[data-tag]')];
  const cards = [...document.querySelectorAll<HTMLElement>('.card[data-tags]')];
  const count = root.querySelector<HTMLElement>('[data-gallery-count]')!;
  const clear = root.querySelector<HTMLButtonElement>('[data-gallery-clear]')!;
  const none = document.querySelector<HTMLElement>('[data-gallery-none]')!;
  const known = new Set(chips.map(chip => chip.dataset.tag!));
  const countText = root.dataset.countText ?? '{n}';

  const show = (picked: Set<string>) => {
    for (const chip of chips) chip.setAttribute('aria-pressed', String(picked.has(chip.dataset.tag!)));
    let shown = 0;
    for (const card of cards) {
      const visible = matches(card.dataset.tags!.split(' '), picked);
      card.hidden = !visible;
      if (visible) shown++;
    }
    count.textContent = countText.replace('{n}', String(shown));
    clear.hidden = picked.size === 0;
    none.hidden = shown > 0;
  };

  const pick = (picked: Set<string>) => {
    const url = new URL(window.location.href);
    url.search = queryFor(picked, url.searchParams);
    history.replaceState(null, '', url);
    show(picked);
  };

  const current = () => pickedFromQuery(new URLSearchParams(window.location.search), known);

  for (const chip of chips) {
    chip.addEventListener('click', () => {
      const picked = current();
      const tag = chip.dataset.tag!;
      if (picked.has(tag)) picked.delete(tag);
      else picked.add(tag);
      pick(picked);
    });
  }
  clear.addEventListener('click', () => pick(new Set()));
  window.addEventListener('popstate', () => show(current()));
  show(current());
}
