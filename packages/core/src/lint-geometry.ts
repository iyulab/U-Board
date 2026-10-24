import { sizedNodes } from './node-size.js';
import { captionBox, estimateTextWidth } from './caption-geometry.js';
import { boxOf, labelChipOf, placeConnectors, segmentsOf } from './connector-geometry.js';
import type { CanvasView, TextShape } from './view-document.js';
import { DEFAULT_TEXT_SIZE, frameLabelBox, textDecorationBox } from './decoration-geometry.js';
import type { ViewDocumentAdvice } from './lint-view-document.js';

/** How many layout findings a document gets one by one — advice an assistant reads is context too, but a writer
 *  sent only a few fixes the board in many rounds, resending it each time. The rest are counted by kind. */
export const GEOMETRY_ADVICE_LIMIT = 30;

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** The box a text decoration takes, estimated as a reader without a canvas can: one line, placed by its anchor, with
 *  its background's room around it. */
export function textBox(text: TextShape): Box {
  return textDecorationBox(text, estimateTextWidth(text.text, text.fontSize ?? DEFAULT_TEXT_SIZE));
}

/**
 * Where a canvas board's parts would be drawn over one another — what a person sees at a glance and a writer
 * without a picture cannot: two nodes whose boxes overlap; a text — a decoration, a node's caption, a connector's
 * label — under a node (nodes draw over everything on the canvas) or running into another text; a connector running
 * through a text decoration; a frame's edge running through a text. Connectors are placed as the renderer places
 * them (`placeConnectors`). The most damaging first, at most `limit` (by default {@link GEOMETRY_ADVICE_LIMIT}), then
 * the rest folded into one line that counts them by kind and carries how many it stands for (`count`).
 *
 * `base` is where the canvas sits in its document — `/items/2/canvas` for a grid's canvas cell; the paths found, and
 * those named in the messages, start there.
 */
export function lintGeometry(doc: CanvasView, limit = GEOMETRY_ADVICE_LIMIT, base = ''): ViewDocumentAdvice[] {
  const sized = sizedNodes(doc);
  const nodes = sized.map((node, i) => ({ id: node.id, at: ref('nodes', i), box: boxOf(node) }));
  // A text decoration, or a frame's name — drawn in the decoration's place in the order, so a later one's background
  // (or a frame's name inside it) is over an earlier frame's edge.
  const decorationTexts = (doc.decorations ?? []).flatMap((shape, i): DecorationText[] => {
    if (shape.type === 'text') return shape.text.trim() !== '' ? [{ at: ref('decorations', i), box: textBox(shape), drawn: i, backed: shape.background !== undefined }] : [];
    const name = frameLabelBox(shape, estimateTextWidth);
    return name ? [{ at: ref('decorations', i, '/label'), box: name, drawn: i, backed: false }] : [];
  });
  // A caption sits on a chip over the lines, so a line under it is hidden, not crossed — but it can still lie under a
  // node or run into another text.
  const captions = sized.flatMap((node, i) => (node.caption?.trim() ? [{ at: ref('nodes', i, '/caption'), box: captionBox(node), owner: i }] : []));
  const placements = placeConnectors(sized, doc.connectors);
  // A label sits on its chip, which covers the lines under it — so, like a caption, it is judged by its chip.
  const labels = placements.flatMap(({ label, index }) => (label ? [{ at: ref('connectors', index, '/label'), box: labelChipOf(label) }] : []));
  const texts: Array<{ at: Ref; box: Box; owner?: number }> = [...decorationTexts, ...captions, ...labels];
  const found: Finding[] = [];

  // Two overlapping nodes are said once: their captions' trouble with each other follows from it, and goes when they
  // are moved apart — saying it again only makes the answer longer.
  const overlapping = new Set<string>();
  const pair = (i: number, j: number) => (i < j ? `${i} ${j}` : `${j} ${i}`);
  const fromOverlap = (a?: number, b?: number) => a !== undefined && b !== undefined && overlapping.has(pair(a, b));
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      if (overlaps(nodes[i].box, nodes[j].box)) {
        overlapping.add(pair(i, j));
        found.push({ kind: 'overlapping nodes', at: nodes[i].at, other: nodes[j].at, message: (other, name) => `its box overlaps node "${name}" (${other}) — one widget draws over the other; move or resize one` });
      }
    }
  }
  for (const text of texts) {
    const under = nodes.find((node, k) => overlaps(text.box, node.box) && !fromOverlap(text.owner, k));
    if (under) found.push({ kind: 'texts under a node', at: text.at, other: under.at, message: (other, name) => `this text lies under node "${name}" (${other}), which draws over it — move it clear of ${describe(under.box)}` });
  }
  for (const text of decorationTexts) {
    const crossing = placements.find(({ points }) => segmentsOf(points).some(([x1, y1, x2, y2]) => crosses({ x: x1, y: y1 }, { x: x2, y: y2 }, inset(text.box, 1))));
    if (crossing) found.push({ kind: 'texts on a connector', at: text.at, other: ref('connectors', crossing.index), message: () => `connector "${crossing.connector.id}" runs through this text — place it beside the line, or use the connector’s label` });
  }
  for (const { at, frame } of edgeCrossings(doc, texts)) {
    found.push({ kind: 'frame edges through a text', at, other: ref('decorations', frame), message: other => `the edge of ${other} runs through this text — move it fully inside the frame or clear of its edge, give it a background, or name the frame with its label` });
  }
  for (let i = 0; i < texts.length; i++) {
    for (let j = i + 1; j < texts.length; j++) {
      if (overlaps(texts[i].box, texts[j].box) && !fromOverlap(texts[i].owner, texts[j].owner)) found.push({ kind: 'texts running together', at: texts[i].at, other: texts[j].at, message: other => `this text runs into ${other} — the two overlap` });
    }
  }

  const said = inDocument(doc, found, base);
  const shown = said.slice(0, limit).map(({ path, message }) => ({ path, message }));
  if (said.length <= limit) return shown;
  const rest = new Map<string, number>();
  for (const { kind } of said.slice(limit)) rest.set(kind, (rest.get(kind) ?? 0) + 1);
  const counted = [...rest].map(([kind, n]) => `${n} ${kind}`).join(', ');
  const more = said.length - limit;
  return [...shown, { path: '', message: `${more} more: ${counted} — fix the ones above, then check again`, count: more }];
}

/** A part of the board as drawn: which list, its place there, and the member of it a finding is about. */
interface Ref {
  list: 'nodes' | 'connectors' | 'decorations';
  index: number;
  suffix: string;
}

function ref(list: Ref['list'], index: number, suffix = ''): Ref {
  return { list, index, suffix };
}

/** A layout finding on the board as drawn: about `at`, naming `other` when there is one — `message` is given where
 *  it is said to be and what it is called there. */
interface Finding {
  kind: string;
  at: Ref;
  other?: Ref;
  message: (other: string, name: string) => string;
}

/** Findings said at the paths of the parts they are about, each naming the other part by its path and id. */
function inDocument(doc: CanvasView, found: readonly Finding[], base: string): Array<ViewDocumentAdvice & { kind: string }> {
  const path = (r: Ref) => `${base}/${r.list}/${r.index}${r.suffix}`;
  const id = (r: Ref) => (doc[r.list] ?? [])[r.index]?.id ?? '';
  return found.map(finding => ({
    kind: finding.kind,
    path: path(finding.at),
    message: finding.message(finding.other ? path(finding.other) : '', finding.other ? id(finding.other) : ''),
  }));
}

/** Whether two boxes share some area — touching edges do not count. */
function overlaps(a: Box, b: Box): boolean {
  return Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x) > 0 && Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y) > 0;
}

interface DecorationText {
  at: Ref;
  box: Box;
  /** Its decoration's place in the drawing order. */
  drawn: number;
  /** A text with a background of its own. */
  backed: boolean;
}

/**
 * Texts a rect decoration's edge runs through: the text overlaps the rect without lying wholly inside it, and the rect
 * draws an edge (a stroke) — unless the text's own background, or a filled rect, drawn after that frame covers the
 * whole text (a title tag on the frame's edge). A text drawn before the frame is under its edge too.
 */
function edgeCrossings(doc: Pick<CanvasView, 'decorations'>, texts: ReadonlyArray<{ at: Ref; box: Box } & Partial<DecorationText>>): Array<{ at: Ref; frame: number }> {
  const decorations = doc.decorations ?? [];
  const out: Array<{ at: Ref; frame: number }> = [];
  decorations.forEach((frame, i) => {
    if (frame.type !== 'rect' || !frame.stroke || frame.stroke.trim().toLowerCase() === 'none' || !(frame.strokeWidth ?? 0)) return;
    const rect = { x: frame.x, y: frame.y, width: frame.width, height: frame.height };
    for (const text of texts) {
      if (!overlaps(text.box, rect) || contains(rect, text.box)) continue;
      if (text.backed && (text.drawn ?? -1) > i) continue; // its own background covers the edge
      const covered = decorations.some((tag, j) => j > i && tag.type === 'rect' && !!tag.fill && tag.fill.trim().toLowerCase() !== 'none' && contains(tag, text.box));
      if (!covered) out.push({ at: text.at, frame: i });
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
