/// <reference lib="dom" />
// Runs inside the page `look` draws (passed to Playwright's `page.evaluate`) — it reads the drawn board's DOM.

/** Elements that failed or were held back, and widgets whose content runs past their box. */
export function findProblems(placed: Array<{ id: string; path: string; attr: string }>): Array<{ path?: string; message: string }> {
  // Everything this function uses is inside it: the page runs it from its source alone.
  /** How far anything drawn inside `root` reaches past `host`'s box, in px (0 when it stays inside). */
  function spillOf(host: HTMLElement, root: ShadowRoot): number {
    const box = host.getBoundingClientRect();
    let spill = 0;
    for (const part of root.querySelectorAll('*')) {
      if (part instanceof HTMLStyleElement) continue;
      const r = part.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      spill = Math.max(spill, box.left - r.left, r.right - box.right, box.top - r.top, r.bottom - box.bottom);
    }
    return spill;
  }

  const out: Array<{ path?: string; message: string }> = [];
  for (const { id, path, attr } of placed) {
    const frame = document.querySelector(`[${attr}="${CSS.escape(id)}"]`);
    if (!frame) continue;
    for (const notice of frame.querySelectorAll('[data-element-error],[data-element-notice]')) {
      out.push({ path, message: (notice.getAttribute('title') || notice.textContent || '').trim() });
    }
    const element = frame.querySelector('[data-element]') as HTMLElement | null;
    const spill = element?.shadowRoot ? spillOf(element, element.shadowRoot) : 0;
    if (spill > 1) out.push({ path, message: `its element draws up to ${Math.round(spill)} px past its box — over its neighbours; give the node more room or draw smaller` });
    const widget = frame.querySelector('u-widget') as HTMLElement | null;
    const inner = (widget?.shadowRoot?.firstElementChild ?? widget) as HTMLElement | null;
    if (inner && (inner.scrollWidth > inner.clientWidth + 1 || inner.scrollHeight > inner.clientHeight + 1)) {
      out.push({ path, message: `its content runs past its box (${inner.scrollWidth}×${inner.scrollHeight} in ${inner.clientWidth}×${inner.clientHeight}) — it scrolls or is cut off; give it more room` });
    }
    const text = widget?.shadowRoot?.textContent ?? '';
    if (/Invalid widget spec|잘못된 위젯 명세/i.test(text)) out.push({ path, message: 'the widget draws its "invalid spec" card — validate the board and read its advice' });
  }
  return out;
}

/** How many frames show each connection mark (stale, disconnected…). */
export function countQualityMarks(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const badge of document.querySelectorAll('[data-quality-badge]')) {
    const word = (badge.textContent ?? '').trim() || 'marked';
    counts[word] = (counts[word] ?? 0) + 1;
  }
  return counts;
}

