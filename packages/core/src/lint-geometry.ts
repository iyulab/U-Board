import { DEFAULT_NODE_HEIGHT, DEFAULT_NODE_WIDTH } from './layout-defaults.js';
import { captionBox, estimateTextWidth } from './caption-geometry.js';
import { chipOf, placeConnectors } from './connector-geometry.js';
import type { CanvasView, TextShape } from './view-document.js';
import type { ViewDocumentAdvice } from './lint-view-document.js';

/** A text decoration's font size when it gives none — the canvas's default. */
const DEFAULT_TEXT_SIZE = 16;
/** How many layout findings a document gets one by one — advice an assistant reads is context too, but a writer
 *  sent only a few fixes the board in many rounds, resending it each time. The rest are counted by kind. */
export const GEOMETRY_ADVICE_LIMIT = 30;

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** The box a text decoration takes, estimated as a reader without a canvas can: one line, x/y its top-left. */
export function textBox(text: TextShape): Box {
  const size = text.fontSize ?? DEFAULT_TEXT_SIZE;
  return { x: text.x, y: text.y, width: estimateTextWidth(text.text, size), height: size };
}

/**
 * Where a canvas board's parts would be drawn over one another — what a person sees at a glance and a writer
 * without a picture cannot: two nodes whose boxes overlap; a text — a decoration, a node's caption, a connector's
 * label — under a node (nodes draw over everything on the canvas) or running into another text; a connector running
 * through a text decoration; a frame's edge running through a text. Connectors are placed as the renderer places
 * them (`placeConnectors`). The most damaging first, at most {@link GEOMETRY_ADVICE_LIMIT}, then the rest counted.
 */
export function lintGeometry(doc: CanvasView): ViewDocumentAdvice[] {
  const nodes = doc.nodes.map((node, i) => ({ id: node.id, at: `/nodes/${i}`, box: nodeBox(node) }));
  const decorationTexts = (doc.decorations ?? []).flatMap((shape, i) => (shape.type === 'text' && shape.text.trim() !== '' ? [{ at: `/decorations/${i}`, box: textBox(shape) }] : []));
  // A caption sits on a chip over the lines, so a line under it is hidden, not crossed — but it can still lie under a
  // node or run into another text.
  const captions = doc.nodes.flatMap((node, i) => (node.caption?.trim() ? [{ at: `/nodes/${i}/caption`, box: captionBox(node) }] : []));
  const placements = placeConnectors(doc.nodes, doc.connectors);
  // A label sits on its chip, which covers the lines under it — so, like a caption, it is judged by its chip.
  const labels = placements.flatMap(({ label, index }) => (label ? [{ at: `/connectors/${index}/label`, box: chipOf(label) }] : []));
  const texts = [...decorationTexts, ...captions, ...labels];
  const found: Array<ViewDocumentAdvice & { kind: string }> = [];

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      if (overlaps(nodes[i].box, nodes[j].box)) {
        found.push({ kind: 'overlapping nodes', path: nodes[i].at, message: `its box overlaps node "${nodes[j].id}" (${nodes[j].at}) — one widget draws over the other; move or resize one` });
      }
    }
  }
  for (const text of texts) {
    const under = nodes.find(node => overlaps(text.box, node.box));
    if (under) found.push({ kind: 'texts under a node', path: text.at, message: `this text lies under node "${under.id}" (${under.at}), which draws over it — move it clear of ${describe(under.box)}` });
  }
  for (const text of decorationTexts) {
    const crossing = placements.find(({ segment: [x1, y1, x2, y2] }) => crosses({ x: x1, y: y1 }, { x: x2, y: y2 }, inset(text.box, 1)));
    if (crossing) found.push({ kind: 'texts on a connector', path: text.at, message: `connector "${crossing.connector.id}" runs through this text — place it beside the line, or use the connector’s label` });
  }
  for (const { at, box } of edgeCrossings(doc, texts)) {
    found.push({ kind: 'frame edges through a text', path: at, message: `the edge of ${box} runs through this text — move it fully inside the frame or clear of its edge, or put a filled tag under it` });
  }
  for (let i = 0; i < texts.length; i++) {
    for (let j = i + 1; j < texts.length; j++) {
      if (overlaps(texts[i].box, texts[j].box)) found.push({ kind: 'texts running together', path: texts[i].at, message: `this text runs into ${texts[j].at} — the two overlap` });
    }
  }

  const shown = found.slice(0, GEOMETRY_ADVICE_LIMIT).map(({ path, message }) => ({ path, message }));
  if (found.length <= GEOMETRY_ADVICE_LIMIT) return shown;
  const rest = new Map<string, number>();
  for (const { kind } of found.slice(GEOMETRY_ADVICE_LIMIT)) rest.set(kind, (rest.get(kind) ?? 0) + 1);
  const counted = [...rest].map(([kind, n]) => `${n} ${kind}`).join(', ');
  return [...shown, { path: '', message: `${found.length - GEOMETRY_ADVICE_LIMIT} more: ${counted} — fix the ones above, then check again` }];
}

function nodeBox(node: CanvasView['nodes'][number]): Box {
  return { x: node.x, y: node.y, width: node.width ?? DEFAULT_NODE_WIDTH, height: node.height ?? DEFAULT_NODE_HEIGHT };
}

/** Whether two boxes share some area — touching edges do not count. */
function overlaps(a: Box, b: Box): boolean {
  return Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x) > 0 && Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y) > 0;
}

/**
 * Texts a rect decoration's edge runs through: the text overlaps the rect without lying wholly inside it, and the rect
 * draws an edge (a stroke) — unless a filled rect drawn after that frame covers the whole text (a title tag on the
 * frame's edge). A text drawn before the frame is under its edge too.
 */
function edgeCrossings(doc: CanvasView, texts: ReadonlyArray<{ at: string; box: Box }>): Array<{ at: string; box: string }> {
  const decorations = doc.decorations ?? [];
  const out: Array<{ at: string; box: string }> = [];
  decorations.forEach((frame, i) => {
    if (frame.type !== 'rect' || !frame.stroke || frame.stroke.trim().toLowerCase() === 'none' || !(frame.strokeWidth ?? 0)) return;
    const rect = { x: frame.x, y: frame.y, width: frame.width, height: frame.height };
    for (const text of texts) {
      if (!overlaps(text.box, rect) || contains(rect, text.box)) continue;
      const covered = decorations.some((tag, j) => j > i && tag.type === 'rect' && !!tag.fill && tag.fill.trim().toLowerCase() !== 'none' && contains(tag, text.box));
      if (!covered) out.push({ at: text.at, box: `/decorations/${i}` });
    }
  });
  return out;
}

/** Whether `inner` lies wholly within `outer`. */
function contains(outer: Box, inner: Box): boolean {
  return inner.x >= outer.x && inner.y >= outer.y && inner.x + inner.width <= outer.x + outer.width && inner.y + inner.height <= outer.y + outer.height;
}

function inset(box: Box, by: number): Box {
  return { x: box.x + by, y: box.y + by, width: Math.max(0, box.width - 2 * by), height: Math.max(0, box.height - 2 * by) };
}

function describe(box: Box): string {
  const r = Math.round;
  return `its box (x ${r(box.x)}–${r(box.x + box.width)}, y ${r(box.y)}–${r(box.y + box.height)})`;
}

/** Whether the segment p→q passes through `box` (Liang–Barsky clipping). */
function crosses(p: { x: number; y: number }, q: { x: number; y: number }, box: Box): boolean {
  if (box.width <= 0 || box.height <= 0) return false;
  const dx = q.x - p.x;
  const dy = q.y - p.y;
  let t0 = 0;
  let t1 = 1;
  const edges: Array<[number, number]> = [
    [-dx, p.x - box.x],
    [dx, box.x + box.width - p.x],
    [-dy, p.y - box.y],
    [dy, box.y + box.height - p.y],
  ];
  for (const [step, room] of edges) {
    if (step === 0) {
      if (room < 0) return false;
      continue;
    }
    const t = room / step;
    if (step < 0) t0 = Math.max(t0, t);
    else t1 = Math.min(t1, t);
    if (t0 > t1) return false;
  }
  return true;
}
