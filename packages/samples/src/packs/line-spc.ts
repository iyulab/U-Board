import type { Binding, Node, Shape, ViewDocument } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { escapeXml, svgDataUrl } from '../frame.js';
import { snapshot } from '../snapshots/line-spc.js';

// A machining line's statistical process control, station by station along the line as it runs: each
// inspection point's control state and latest measurement under its place in the flow, a small control chart
// of its recent subgroups, its Cpk, and the line's nonconformities below. The source judges control (its SPC
// rules) and computes Cpk; the board shows what it judged. No public source carries a line's measurements, so
// the values are example data written for the board.

const WIDTH = 1280;
const HEIGHT = 780;

export const QUALITY: ExampleSampleConnector = {
  key: 'quality',
  name: '예시 품질 API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 측정값이 아닙니다' },
};

/** Measurements arrive with each subgroup, every half hour; an hour without one is a station not reporting. */
const MAX_AGE_SECONDS = 60 * 60;

const bindStation = (id: string, field: string, map?: Binding['map']): Binding => ({
  adapter: QUALITY.key,
  ref: { path: '/qc/stations', item: { list: '/value', where: { id } }, valuePath: `/${field}`, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
  ...(map ? { map } : {}),
});

const bindPath = (path: string, valuePath: string): Binding => ({
  adapter: QUALITY.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
});

/** What the source judged: in control, out of control (a run rule broken), out of specification (a part
 *  outside its limits), or no subgroup in time. */
const STATE_TEXT = { values: { in: '관리 안', ooc: '관리 이탈', oos: '규격 이탈', stale: '미수집' }, otherwise: '알 수 없음' };
const STATE_LEVEL = { values: { in: 'success', ooc: 'warning', oos: 'error', stale: 'neutral' }, otherwise: 'neutral' };
/** Cpk in the bands most plants read it by: 1.33 and over capable, 1.0 to 1.33 marginal, under 1.0 not. */
const CPK_LEVEL = { ranges: [{ max: 1, value: 'error' }, { min: 1, max: 1.33, value: 'warning' }, { min: 1.33, value: 'success' }] };

/** The line's process boxes, left to right; the ones with an inspection point carry its characteristic. */
const STEPS: { id: string; name: string; characteristic?: string }[] = [
  { id: 'IQC', name: '수입 검사', characteristic: '소재 경도 HRC 28–34' },
  { id: 'OP10', name: 'OP10 선반', characteristic: '외경 Ø25 ±0.02' },
  { id: 'OP20', name: 'OP20 밀링', characteristic: '홈 깊이 3.00 ±0.05' },
  { id: 'OP30', name: 'OP30 연삭', characteristic: '거칠기 Ra ≤ 0.8' },
  { id: 'WASH', name: '세척' },
  { id: 'FINAL', name: '최종 검사', characteristic: '전장 120.0 ±0.1' },
];

const COLUMN = { x: 30, width: 190, gap: 15 };
const columnX = (i: number) => COLUMN.x + i * (COLUMN.width + COLUMN.gap);
const BOX_Y = 104;
const BOX_HEIGHT = 56;

function station(i: number): Node[] {
  const { id, characteristic } = STEPS[i];
  if (!characteristic) return [];
  const x = columnX(i);
  return [
    {
      id: `state-${id}`,
      x,
      y: 186,
      width: COLUMN.width,
      height: 76,
      anchored: true,
      widget: {
        type: 'status',
        props: { data: [{ label: characteristic, value: '', level: 'neutral' }, { label: '최근 측정', value: 0, level: 'neutral' }] },
        bindings: {
          'data.0.value': bindStation(id, 'state', STATE_TEXT),
          'data.0.level': bindStation(id, 'state', STATE_LEVEL),
          'data.1.value': bindStation(id, 'last'),
          'data.1.level': bindStation(id, 'state', STATE_LEVEL),
        },
      },
    },
    {
      id: `chart-${id}`,
      x,
      y: 276,
      width: COLUMN.width,
      height: 170,
      anchored: false,
      widget: {
        type: 'chart.line',
        props: {
          data: [],
          mapping: { x: 't', y: ['mean', 'ucl', 'lcl'] },
          options: {
            xFormat: { type: 'time' },
            series: [{ label: '평균' }, { label: 'UCL', lineStyle: 'dashed', symbol: 'none' }, { label: 'LCL', lineStyle: 'dashed', symbol: 'none' }],
            // A control chart reads around its centre line: the axis spans the limits, not zero. The widget has
            // no option for an axis's range yet, so this goes to the chart engine directly.
            echarts: { yAxis: { scale: true } },
          },
        },
        bindings: { data: bindPath(`/qc/subgroups/${id}`, '/value') },
      },
    },
    {
      id: `cpk-${id}`,
      x,
      y: 460,
      width: COLUMN.width,
      height: 44,
      anchored: false,
      widget: {
        type: 'status',
        props: { data: { label: 'Cpk', value: 0, level: 'neutral' } },
        bindings: { 'data.value': bindStation(id, 'cpk'), 'data.level': bindStation(id, 'cpk', CPK_LEVEL) },
      },
    },
  ];
}

const BOTTOM_Y = 556;
const BOTTOM: Node[] = [
  {
    id: 'open-ncr',
    x: 46,
    y: BOTTOM_Y + 36,
    width: 170,
    height: 76,
    anchored: false,
    widget: { type: 'metric', props: { data: { label: '미결 부적합(NCR)', value: 0, unit: '건' } }, bindings: { 'data.value': bindPath('/qc/summary', '/openNcr') } },
  },
  {
    id: 'ppm',
    x: 46,
    y: BOTTOM_Y + 124,
    width: 170,
    height: 76,
    anchored: false,
    widget: {
      type: 'metric',
      props: { data: { label: '이번 주 불량', value: 0, unit: 'PPM' }, options: { format: 'number' } },
      bindings: { 'data.value': bindPath('/qc/summary', '/weekPpm') },
    },
  },
  {
    id: 'pareto',
    x: 250,
    y: BOTTOM_Y + 28,
    width: 560,
    height: 180,
    anchored: false,
    widget: {
      type: 'chart.bar',
      props: { title: '이번 주 불량 유형(건)', data: [], mapping: { x: 'type', y: 'count' } },
      bindings: { data: bindPath('/qc/defects', '/value') },
    },
  },
];

const DECORATIONS: Shape[] = [
  { id: 'title', type: 'text', x: 24, y: 20, text: '가공 라인 SPC 상황판', fontSize: 24, fill: '#17252b' },
  {
    id: 'note',
    type: 'text',
    x: 24,
    y: 54,
    text: '검사 지점마다 관리 상태와 최근 측정값 · 최근 서브그룹 관리도 · Cpk · 예시 데이터',
    fontSize: 13,
    fill: '#5b6b70',
  },
  { id: 'machining', type: 'rect', x: columnX(1) - 8, y: 88, width: columnX(3) + COLUMN.width - columnX(1) + 16, height: 432, stroke: '#5f7a8c', strokeWidth: 1.5 },
  { id: 'machining-name', type: 'text', x: columnX(1), y: 92, text: '가공 구역', fontSize: 12, fill: '#5f7a8c' },
  { id: 'bottom-title', type: 'text', x: 46, y: BOTTOM_Y + 8, text: '라인 부적합', fontSize: 15, fill: '#22313b' },
];

/** The line as a flow: a box per process step joined by arrows, the wash step without an inspection point. */
function drawing(): string {
  const boxes = STEPS.map(({ name, characteristic }, i) => {
    const x = columnX(i);
    const fill = characteristic ? '#e9eef1' : '#f3f5f6';
    return `<rect x="${x}" y="${BOX_Y + 8}" width="${COLUMN.width}" height="${BOX_HEIGHT}" rx="6" fill="${fill}" stroke="#9aaab3"/>
<text x="${x + COLUMN.width / 2}" y="${BOX_Y + 8 + BOX_HEIGHT / 2 + 5}" font-size="14" fill="#22313b" text-anchor="middle" font-family="sans-serif">${escapeXml(name)}</text>`;
  }).join('\n');
  const arrows = STEPS.slice(1).map((_, i) => {
    const from = columnX(i) + COLUMN.width;
    const y = BOX_Y + 8 + BOX_HEIGHT / 2;
    return `<path d="M ${from + 2} ${y} H ${from + COLUMN.gap - 3}" stroke="#7f939e" stroke-width="2" marker-end="url(#arrow)"/>`;
  }).join('\n');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<defs><marker id="arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L8 4 L0 8 z" fill="#7f939e"/></marker></defs>
<rect width="${WIDTH}" height="${HEIGHT}" fill="#f4f6f7"/>
${boxes}
${arrows}
<rect x="30" y="${BOTTOM_Y}" width="800" height="${HEIGHT - BOTTOM_Y - 20}" rx="8" fill="#ffffff" stroke="#d6dedb"/>
<text x="${WIDTH - 24}" y="${HEIGHT - 12}" font-size="11" fill="#5b6b70" text-anchor="end" font-family="sans-serif">${escapeXml('도식 — 예시 라인, 실제 공정과 다름')}</text>
</svg>`;
  return svgDataUrl(svg);
}

const document: ViewDocument = {
  kind: 'canvas',
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes: [...STEPS.flatMap((_, i) => station(i)), ...BOTTOM],
  connectors: [],
  decorations: DECORATIONS,
};

export const lineSpc: SamplePack = {
  id: 'line-spc',
  title: { ko: '가공 라인 SPC 상황판', en: 'Machining line SPC' },
  field: { ko: '제조·품질', en: 'Manufacturing & quality' },
  kind: { ko: '공정 흐름도', en: 'Process flow' },
  summary: {
    ko: '라인을 흐르는 순서대로 검사 지점마다 관리 상태·최근 측정값·관리도·Cpk를 그 공정 아래에, 라인의 부적합은 아래에. 관리 판정과 Cpk는 원천이 계산한 값입니다. 예시 데이터입니다.',
    en: 'Each inspection point’s control state, latest measurement, control chart and Cpk under its step in the line’s flow, and the line’s nonconformities below. The source judges control and computes Cpk. Example data.',
  },
  connectors: [QUALITY],
  document,
  snapshot,
};
