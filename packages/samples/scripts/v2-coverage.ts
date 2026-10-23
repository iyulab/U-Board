// How far the one-time conversion of first-version boards to the board language's second version reaches over every
// sample, printed (`src/v2-coverage.ts` measures; `src/v2-coverage.test.ts` holds what it reaches).
//
// Usage: npm run v2-coverage --workspace=packages/samples [-- <sample id> …] [-- --detail]

import { SAMPLE_PACKS } from '../src/index.js';
import { v2Coverage, type Outcome } from '../src/v2-coverage.js';

const args = process.argv.slice(2);
const detail = args.includes('--detail');
const only = new Set(args.filter(a => !a.startsWith('--')));

const outcomes = await v2Coverage(SAMPLE_PACKS.filter(p => only.size === 0 || only.has(p.id)));

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
