// How far the one-time conversion of first-version boards to the board language's second version reaches over every
// sample: each board converted, checked, drawn again and read against its recorded answers — classified, never thrown.
//
// Usage: npm run v2-coverage --workspace=packages/samples [-- <sample id> …] [-- --detail]

// The board language's second version is not a published entry point yet: read from the source.
import { fromV1, type V1Conversion } from '../../core/src/board-v2/from-v1.js';
import { toViewDocument } from '../../core/src/board-v2/picture.js';
import { validateBoardV2 } from '../../core/src/board-v2/validate.js';
import { resolveConnector, resolveWidget, type ViewDocument, type Widget } from '@iyulab/u-board/domain';
import { SAMPLE_PACKS } from '../src/index.js';
import { snapshotAdapters } from '../src/snapshot-adapter.js';

const args = process.argv.slice(2);
const detail = args.includes('--detail');
const only = new Set(args.filter(a => !a.startsWith('--')));

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

type Outcome = { id: string; result: 'same' | 'differs' | 'unsupported' | 'invalid'; notes: string[]; nodes: { same: number; differs: number; left: number } };
const outcomes: Outcome[] = [];

for (const pack of SAMPLE_PACKS.filter(p => only.size === 0 || only.has(p.id))) {
  const v1 = pack.document as ViewDocument;
  const before = widgets(v1);
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
  // A connector's bound label and colour read again: the label's words, and live where they were live.
  if (v1.kind === 'canvas' && drawn.kind === 'canvas') {
    for (const connector of v1.connectors.filter(c => c.bindings)) {
      const again = drawn.connectors.find(c => c.id === `link.${connector.id.replace(/[^\w-]+/g, '-')}`);
      if (!again) continue;
      const [a, b] = await Promise.all([resolveConnector(connector, adapters), resolveConnector(again, adapters)]);
      if (connector.bindings!.label && a.label !== b.label) differences.push(`${connector.id}: label ${JSON.stringify(a.label)} → ${JSON.stringify(b.label)}`);
      const live = (q: Record<string, string>) => Object.values(q).filter(v => v !== 'disconnected').length;
      if (live(b.quality) < live(a.quality)) differences.push(`${connector.id}: ${live(a.quality) - live(b.quality)} fewer live`);
    }
  }
  const result = conversion.unsupported.length > 0 ? 'unsupported' : differences.length === 0 ? 'same' : 'differs';
  outcomes.push({ id: pack.id, result, notes: [...conversion.unsupported.map(u => `unsupported: ${u}`), ...conversion.notes, ...differences], nodes });
}

const count = (r: Outcome['result']) => outcomes.filter(o => o.result === r).length;
const sum = (k: keyof Outcome['nodes']) => outcomes.reduce((n, o) => n + o.nodes[k], 0);
console.log(`${outcomes.length} boards: ${count('same')} read the same · ${count('differs')} differ · ${count('invalid')} invalid · ${count('unsupported')} with unsupported parts`);
console.log(`nodes: ${sum('same')} read the same · ${sum('differs')} differ · ${sum('left')} not converted`);
const reasons = new Map<string, number>();
for (const o of outcomes) for (const n of new Set(o.notes.filter(n => n.startsWith('unsupported: ')))) reasons.set(n, (reasons.get(n) ?? 0) + 1);
for (const [reason, n] of [...reasons].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(3)} boards × ${reason}`);
for (const o of outcomes.filter(o => detail || o.result === 'differs' || o.result === 'invalid' || o.nodes.differs > 0)) {
  const shown = o.notes.filter(n => detail || !n.startsWith('unsupported: '));
  const lines = shown.slice(0, detail ? 50 : 6).map(n => `\n    ${n}`).join('');
  console.log(`${o.result.padEnd(11)} ${o.id} (${o.nodes.same} same · ${o.nodes.differs} differ · ${o.nodes.left} left)${lines}`);
}
