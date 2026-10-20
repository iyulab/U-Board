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

  /** How far down the boxes drawn inside `root` reach, shadow roots within it included — the bottom of the content.
   *  Boxes, not the scroll height: a line's text may reach a few px past its line box (a font's own height over a
   *  tight line height), which scrolls nothing and cuts nothing off. */
  function contentBottom(root: ShadowRoot | Element): number {
    let bottom = -Infinity;
    for (const part of root.querySelectorAll('*')) {
      if (part instanceof HTMLStyleElement) continue;
      const r = part.getBoundingClientRect();
      if (r.width > 0 || r.height > 0) bottom = Math.max(bottom, r.bottom);
      if (part.shadowRoot) bottom = Math.max(bottom, contentBottom(part.shadowRoot));
    }
    return bottom;
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
    if (inner) {
      // Across, what runs past is a line too long for the width — the scroll width says it. Down, it is rows, items
      // and charts — boxes; their bottom says it.
      const box = inner.getBoundingClientRect();
      const height = Math.max(inner.clientHeight, Math.round(contentBottom(inner.shadowRoot ?? inner) - box.top));
      if (inner.scrollWidth > inner.clientWidth + 1 || height > inner.clientHeight + 1) {
        out.push({ path, message: `its content runs past its box (${inner.scrollWidth}×${height} in ${inner.clientWidth}×${inner.clientHeight}) — it scrolls or is cut off; give it more room` });
      }
    }
    const text = widget?.shadowRoot?.textContent ?? '';
    if (/Invalid widget spec|잘못된 위젯 명세/i.test(text)) out.push({ path, message: 'the widget draws its "invalid spec" card — validate the board and read its advice' });
  }
  return out;
}

/** How many parts — nodes, grid items, connectors — show each quality short of live (`stale`, `disconnected`). */
export function countQualityMarks(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const part of document.querySelectorAll('[data-quality]')) {
    const quality = part.getAttribute('data-quality') || 'marked';
    counts[quality] = (counts[quality] ?? 0) + 1;
  }
  return counts;
}


/**
 * Text in the placed parts that reads poorly against what is actually drawn behind it — measured on the picture the
 * page was just taken as, so a panel painted on the canvas under a widget counts, not only CSS backgrounds. For each
 * run of text: its ink (computed colour) against the most common colour in its box on the picture; under 3:1 (WCAG
 * 1.4.11's floor, and well under 1.4.3's 4.5:1 for small text) it is reported — the worst run per part, at most `limit`.
 */
export async function findLowContrast(args: { picture: string; ratio: number; placed: Array<{ id: string; path: string; attr: string }>; limit: number }): Promise<Array<{ path: string; message: string }>> {
  // Everything this function uses is inside it: the page runs it from its source alone.
  const parse = (css: string): [number, number, number] | undefined => {
    const m = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+%?))?/.exec(css);
    if (!m) return undefined;
    if (m[4] !== undefined && parseFloat(m[4]) === 0) return undefined; // transparent ink draws nothing
    return [Number(m[1]), Number(m[2]), Number(m[3])];
  };
  const luminance = ([r, g, b]: [number, number, number]) => {
    const c = (v: number) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * c(r) + 0.7152 * c(g) + 0.0722 * c(b);
  };
  const contrast = (a: [number, number, number], b: [number, number, number]) => {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };

  const image = new Image();
  image.src = args.picture;
  await image.decode();
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(image, 0, 0);
  const bucket = (r: number, g: number, b: number) => ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
  /** The commonest colour in the text's box other than its own ink — the glyph's pixels are in the box too, and on a
   *  gradient (each step a colour of its own) a bold glyph's one ink can outnumber every one of them. A box of nothing
   *  but the ink is text on its own colour. */
  const behind = (rect: DOMRect, ink: [number, number, number]): [number, number, number] | undefined => {
    const x = Math.max(0, Math.floor(rect.left * args.ratio));
    const y = Math.max(0, Math.floor(rect.top * args.ratio));
    const w = Math.min(canvas.width - x, Math.ceil(rect.width * args.ratio));
    const h = Math.min(canvas.height - y, Math.ceil(rect.height * args.ratio));
    if (w <= 0 || h <= 0) return undefined;
    const data = ctx.getImageData(x, y, w, h).data;
    const own = bucket(...ink);
    const counts = new Map<number, number>();
    for (let i = 0; i < data.length; i += 4) {
      const key = bucket(data[i], data[i + 1], data[i + 2]);
      if (key !== own) counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    if (counts.size === 0) return ink;
    const [key] = [...counts].sort((a, b) => b[1] - a[1])[0];
    return [((key >> 10) & 31) * 8 + 4, ((key >> 5) & 31) * 8 + 4, (key & 31) * 8 + 4];
  };
  const texts = (root: Node, out: Text[]) => {
    for (const child of root.childNodes) {
      if (child.nodeType === Node.TEXT_NODE && (child.textContent ?? '').trim()) out.push(child as Text);
      if (child instanceof Element) {
        if (child.shadowRoot) texts(child.shadowRoot, out);
        texts(child, out);
      }
    }
    return out;
  };

  const found: Array<{ path: string; message: string; ratio: number }> = [];
  for (const { id, path, attr } of args.placed) {
    const frame = document.querySelector(`[${attr}="${CSS.escape(id)}"]`);
    if (!frame) continue;
    let worst: { ratio: number; text: string } | undefined;
    for (const node of texts(frame, [])) {
      // SVG text is painted with its fill; HTML text with its colour.
      const owner = node.parentElement;
      // Text inside a definition (a <symbol> drawn where a <use> points, <defs>, a pattern) is not where it is drawn;
      // hidden text is not drawn at all, nor is text kept in a box of a pixel for assistive technology alone.
      if (!owner || owner.closest('symbol, defs, pattern, marker, mask, clipPath') || !owner.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) continue;
      const box = owner.getBoundingClientRect();
      if (box.width <= 1 && box.height <= 1) continue;
      const ink = owner ? parse(owner instanceof SVGElement ? getComputedStyle(owner).fill : getComputedStyle(owner).color) : undefined;
      if (!ink) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      for (const rect of range.getClientRects()) {
        const paper = behind(rect, ink);
        if (!paper) continue;
        const ratio = contrast(ink, paper);
        if (!worst || ratio < worst.ratio) worst = { ratio, text: (node.textContent ?? '').trim().slice(0, 30) };
      }
    }
    if (worst && worst.ratio < 3) found.push({ path, ratio: worst.ratio, message: `its text "${worst.text}" reads at ${worst.ratio.toFixed(1)}:1 against what is drawn behind it — under 3:1; change the ink or what lies behind (on a dark board, a light panel under a widget keeps the widget’s light ink)` });
  }
  return found.sort((a, b) => a.ratio - b.ratio).slice(0, args.limit).map(({ path, message }) => ({ path, message }));
}
