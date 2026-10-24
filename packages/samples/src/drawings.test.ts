// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { toViewDocument } from '@iyulab/u-board/domain';
import { isCanvasItem, type CanvasView, type ViewDocument } from '@iyulab/u-board/picture';
import { SAMPLE_PACKS } from './index.js';

// A drawing that is not well-formed XML — an attribute written twice, an unescaped `&` — is dropped by the browser
// without a word, and the board shows its nodes over nothing.

const canvasesOf = (document: ViewDocument): CanvasView[] =>
  document.kind === 'canvas' ? [document] : document.items.filter(isCanvasItem).map(item => ({ kind: 'canvas', ...item.canvas }));

/** The SVG text of a `data:image/svg+xml` image, or nothing for any other image. */
function svgOf(src: string): string | undefined {
  if (!src.startsWith('data:image/svg+xml')) return undefined;
  const comma = src.indexOf(',');
  const data = src.slice(comma + 1);
  return src.slice(0, comma).endsWith(';base64') ? atob(data) : decodeURIComponent(data);
}

const drawn = SAMPLE_PACKS.flatMap(pack =>
  // Backgrounds do not depend on the items a list has.
  canvasesOf(toViewDocument(pack.board, { keysOf: () => [] })).flatMap(canvas => {
    const svg = canvas.background.image && svgOf(canvas.background.image.src);
    return svg === undefined ? [] : [[pack.id, svg] as const];
  }),
);

describe('sample drawings', () => {
  it.each(drawn)('%s draws its background as SVG a browser can read', (_id, svg) => {
    const parsed = new DOMParser().parseFromString(svg, 'image/svg+xml');
    expect(parsed.querySelector('parsererror')?.textContent ?? null).toBeNull();
    expect(parsed.documentElement.localName).toBe('svg');
  });

  it('reads a drawing with an attribute written twice as broken', () => {
    const parsed = new DOMParser().parseFromString('<svg xmlns="http://www.w3.org/2000/svg"><line stroke-opacity="1" stroke-opacity=".5"/></svg>', 'image/svg+xml');
    expect(parsed.querySelector('parsererror')).not.toBeNull();
  });
});
