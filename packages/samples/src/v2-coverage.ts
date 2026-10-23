// How far the one-time conversion of first-version boards to the board language's second version reaches over the
// samples: each board converted, checked, drawn again and read against its recorded answers — classified, never thrown.
// Not part of the package's entry: the coverage script and its ratchet test read it.

import { fromV1, toViewDocument, validateBoardV2, type V1Conversion } from '@iyulab/u-board/board-v2';
import { expandComponents, resolveConnector, resolveWidget, type ViewDocument, type Widget } from '@iyulab/u-board/domain';
import type { SamplePack } from './sample-pack.js';
import { snapshotAdapters } from './snapshot-adapter.js';

/** Every widget of a document by node id — a grid's own and those of the canvases in its cells. */
function widgets(doc: ViewDocument): Map<string, Widget> {
  const found = new Map<string, Widget>();
  if (doc.kind === 'canvas') for (const node of doc.nodes) found.set(node.id, node.widget);
  else {
    for (const item of doc.items) {
      if ('widget' in item) found.set(item.id, item.widget);
      else for (const node of item.canvas.nodes) found.set(node.id, node.widget);
    }
  }
  return found;
}

/** What a widget reads: each binding's value as JSON, and how many bindings came back live or not. */
async function reading(widget: Widget, adapters: Parameters<typeof resolveWidget>[1]) {
  const resolved = await resolveWidget(widget, adapters);
  const values: string[] = [];
  for (const key of Object.keys(widget.bindings ?? {})) {
    const value = key.split('.').reduce<unknown>((at, step) => (at as Record<string, unknown> | undefined)?.[step], resolved.props);
    values.push(JSON.stringify(value));
  }
  const qualities = Object.values(resolved.quality);
  return { values, live: qualities.filter(q => q !== 'disconnected').length, dead: qualities.filter(q => q === 'disconnected').length };
}

/** How one sample's board came through: read the same, read differently, has parts with no place yet, or is not a valid
 *  board; with what was unsupported, changed on the way or read differently, and how many of its widgets each way. */
export interface Outcome {
  id: string;
  result: 'same' | 'differs' | 'unsupported' | 'invalid';
  notes: string[];
  nodes: { same: number; differs: number; left: number };
}

/** Converts every given sample's board, checks it, draws it again and reads it against the sample's recorded answers. */
export async function v2Coverage(packs: readonly SamplePack[]): Promise<Outcome[]> {
  const outcomes: Outcome[] = [];
  for (const pack of packs) {
    const v1 = pack.document as ViewDocument;
    // A component instance's widgets read as the board draws them, each under its `<instance>/<part>` id.
    const before = widgets(expandComponents(v1));
    const nodes = { same: 0, differs: 0, left: before.size };
    let conversion: V1Conversion;
    try {
      conversion = fromV1(v1);
    } catch (error) {
      outcomes.push({ id: pack.id, result: 'unsupported', notes: [String((error as Error).message)], nodes });
      continue;
    }
    // What was converted is checked and read again even when part of the board has no place yet.
    const issues = validateBoardV2(conversion.board).filter(i => !i.hint);
    if (issues.length > 0) {
      outcomes.push({ id: pack.id, result: 'invalid', notes: issues.map(i => `${i.at}: ${i.message}`), nodes });
      continue;
    }
    let drawn: ViewDocument;
    try {
      drawn = toViewDocument(conversion.board);
    } catch (error) {
      outcomes.push({ id: pack.id, result: 'invalid', notes: [String((error as Error).message)], nodes });
      continue;
    }
    const adapters = snapshotAdapters(pack);
    const after = widgets(drawn);
    const differences: string[] = [];
    for (const [id, widget] of before) {
      const again = after.get(id);
      if (!again) continue;
      nodes.left--;
      const [a, b] = await Promise.all([reading(widget, adapters), reading(again, adapters)]);
      // Every value the first version read is read again, and nothing it read is lost.
      const missing = a.values.filter(v => v !== 'undefined' && !b.values.includes(v));
      const found: string[] = [];
      if (missing.length > 0) found.push(`${id}: no longer reads ${missing.slice(0, 3).join(', ').slice(0, 300)}`);
      if (b.live < a.live) found.push(`${id}: ${a.live - b.live} fewer live`);
      if (found.length > 0) nodes.differs++; else nodes.same++;
      differences.push(...found);
    }
    // A connector's bound label, colour and dash read again: the label's words, live where they were live, the same dash.
    if (v1.kind === 'canvas' && drawn.kind === 'canvas') {
      for (const connector of v1.connectors.filter(c => c.bindings)) {
        const again = drawn.connectors.find(c => c.id === `link.${connector.id.replace(/[^\w-]+/g, '-')}`);
        if (!again) continue;
        const [a, b] = await Promise.all([resolveConnector(connector, adapters), resolveConnector(again, adapters)]);
        if (connector.bindings!.label && a.label !== b.label) differences.push(`${connector.id}: label ${JSON.stringify(a.label)} → ${JSON.stringify(b.label)}`);
      // A bound dash is drawn the same (a solid line and none are the same line).
      const dash = (c: typeof a) => (c.style?.dash === 'solid' ? undefined : c.style?.dash);
      if (connector.bindings!['style.dash'] && dash(a) !== dash(b)) differences.push(`${connector.id}: dash ${JSON.stringify(dash(a))} → ${JSON.stringify(dash(b))}`);
        const live = (q: Record<string, string>) => Object.values(q).filter(v => v !== 'disconnected').length;
        if (live(b.quality) < live(a.quality)) differences.push(`${connector.id}: ${live(a.quality) - live(b.quality)} fewer live`);
      }
    }
    const result = conversion.unsupported.length > 0 ? 'unsupported' : differences.length === 0 ? 'same' : 'differs';
    outcomes.push({ id: pack.id, result, notes: [...conversion.unsupported.map(u => `unsupported: ${u}`), ...conversion.notes, ...differences], nodes });
  }
  return outcomes;
}
