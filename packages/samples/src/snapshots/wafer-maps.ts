// Example data written for the sample, not recorded from a source — no public source carries a fab's probe results.
// Keep it consistent: the dice are generated, the same every time, from each wafer's pattern — a few scattered
// failures on every wafer, a ring of threshold-voltage failures round the edge of four wafers of lot B2390 (the four
// that went through etch chamber C), a cluster of leakage failures at the centre of one, and a scratch of functional
// failures across A2381-03 after the polish pad change. The yields, the bins' counts and the lots' trend are counted
// from those dice, so they agree with the maps.
import type { SampleSnapshot } from '../sample-pack.js';

const at = '2026-10-21T04:10:00Z';

type Pattern = 'clean' | 'edge' | 'center' | 'scratch';

/** The lots in the order they ran, each wafer with the pattern its failures make. */
const PLAN: Array<{ id: string; note: string; wafers: Array<[string, Pattern]> }> = [
  {
    id: 'A2381',
    note: '· 10/19 투입 · 식각 챔버 A·B',
    wafers: [['A2381-01', 'clean'], ['A2381-02', 'clean'], ['A2381-03', 'scratch'], ['A2381-04', 'clean'], ['A2381-05', 'clean'], ['A2381-06', 'clean']],
  },
  {
    id: 'B2390',
    note: '· 10/20 투입 · 식각 챔버 C(01·02·04·05)',
    wafers: [['B2390-01', 'edge'], ['B2390-02', 'edge'], ['B2390-03', 'center'], ['B2390-04', 'edge'], ['B2390-05', 'edge'], ['B2390-06', 'clean']],
  },
];

/** The lots and their wafers, in the order the board lays them out. */
export const LOTS = PLAN.map(({ id, note, wafers }) => ({ id, note, wafers: wafers.map(([w]) => w) }));

const PATTERN_TEXT: Record<Pattern, string> = { clean: '무늬 없음', edge: '가장자리 링', center: '중앙 군집', scratch: '긁힘(대각선)' };

/** A number from 0 to 1 that is the same every time for the same wafer and die. */
function noise(seed: string, r: number, c: number): number {
  let h = 2166136261;
  for (const ch of `${seed}:${r}:${c}`) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return ((h >>> 0) % 10000) / 10000;
}

const N = 15;
const MID = (N - 1) / 2;

/** The wafer's dice row by row: 0 off the wafer, else the bin the tester gave. */
function dice(id: string, pattern: Pattern): number[] {
  const out: number[] = [];
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const d = Math.hypot(r - MID, c - MID);
      if (d > 7.1) {
        out.push(0);
        continue;
      }
      const n = noise(id, r, c);
      let bin = n < 0.025 ? 3 : n < 0.04 ? 6 : 1;
      if (pattern === 'edge' && d > 5.9 && n < 0.72) bin = 4;
      if (pattern === 'center' && d < 2.4 && n < 0.8) bin = 3;
      if (pattern === 'scratch' && Math.abs(r - c - 1) < 0.6 && r > 2 && r < 12) bin = 5;
      out.push(bin);
    }
  }
  return out;
}

const WAFERS = PLAN.flatMap(({ id: lot, wafers }) =>
  wafers.map(([id, pattern]) => {
    const bins = dice(id, pattern);
    const onWafer = bins.filter(b => b > 0);
    const good = onWafer.filter(b => b === 1).length;
    return { id, lot, pattern, bins, yield: Math.round((good / onWafer.length) * 1000) / 10, total: onWafer.length };
  }),
);

const count = (lot: string, bin: number) => WAFERS.filter(w => w.lot === lot).reduce((n, w) => n + w.bins.filter(b => b === bin).length, 0);

const lotYield = (lot: string) => {
  const of = WAFERS.filter(w => w.lot === lot);
  const good = of.reduce((n, w) => n + w.bins.filter(b => b === 1).length, 0);
  return Math.round((good / of.reduce((n, w) => n + w.total, 0)) * 1000) / 10;
};

const yieldA = lotYield('A2381');
const yieldB = lotYield('B2390');
const edgeLoss = WAFERS.filter(w => w.pattern === 'edge').reduce((n, w) => n + w.bins.filter(b => b === 4).length, 0);
const diesPerWafer = WAFERS[0]!.total;

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-21T04:20:00.000Z',
  responses: {
    fab: {
      '/fab/figure': {
        title: '그림 1. 로트 A2381 · B2390 웨이퍼 빈 맵',
        text: '웨이퍼마다 15 × 15 격자, 투입 순서대로. 회색은 양품, 색은 불량 빈. 노치는 아래. 수율 = 양품 다이 ÷ 웨이퍼 위 다이.',
        stamp: '프로브 2호기 · 10/21 13:10',
        updatedAt: at,
      },
      '/fab/wafers': {
        value: WAFERS.map(w => ({
          id: w.id,
          yield: w.yield,
          pattern: PATTERN_TEXT[w.pattern],
          flag: w.pattern === 'clean' ? 'none' : 'flagged',
          dice: w.bins.map(b => ({ b })),
          updatedAt: at,
        })),
      },
      '/fab/figures': {
        value: [
          { label: 'A2381 수율', value: `${yieldA.toFixed(1)}%`, note: '긁힘 한 장 빼면 평소대로' },
          { label: 'B2390 수율', value: `${yieldB.toFixed(1)}%`, note: '목표 92% 아래' },
          { label: '가장자리 손실', value: `${edgeLoss}`, note: '다이 — 챔버 C를 지난 네 장' },
        ],
        updatedAt: at,
      },
      '/fab/notes': {
        value: [
          { text: 'B2390의 가장자리 링은 식각 챔버 C를 지난 네 장(01·02·04·05)에만 있다 — 챔버 C의 가장자리 식각 균일도 점검.' },
          { text: 'B2390-03은 중앙 군집(누설 전류) — 챔버 B를 지났고 무늬가 다르다. 따로 본다.' },
          { text: 'A2381-03의 대각선 긁힘은 CMP 연마 패드를 바꾼 직후 첫 장이다.' },
        ],
        updatedAt: at,
      },
      '/fab/method': {
        value: [
          { text: '빈은 웨이퍼 테스트의 최종 판정. 빈 6(접촉 불량)은 재검사 전이다.' },
          { text: '무늬 이름은 엔지니어 판독 — 자동 분류가 아니다.' },
          { text: `그림의 격자는 다이를 줄여 그렸다(웨이퍼 위 ${diesPerWafer}칸).` },
        ],
        updatedAt: at,
      },
      '/fab/bins': {
        value: [3, 4, 5, 6].map(bin => ({ bin: `빈 ${bin}`, lotA: count('A2381', bin), lotB: count('B2390', bin) })),
        updatedAt: at,
      },
      '/fab/trend': {
        value: (
          [
            ['A2370', 93.4], ['A2372', 92.8], ['B2374', 93.9], ['A2375', 94.1], ['B2377', 92.6], ['A2378', 93.2],
            ['B2379', 93.7], ['A2380', 92.9], ['B2384', 93.3], ['A2381', yieldA], ['B2388', 91.8], ['B2390', yieldB],
          ] as Array<[string, number]>
        ).map(([lot, y]) => ({ lot, yield: y, target: 92 })),
        updatedAt: at,
      },
    },
  },
};
