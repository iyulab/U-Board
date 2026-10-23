import type { Binding, CellCanvas, Connector, ElementDefinition, GridItem, GridView, Node, Shape, Widget } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { svgDataUrl } from '../frame.js';
import { snapshot } from '../snapshots/port-terminal.js';

// A container terminal's control room, the way one is put on the wall: dark, the day's figures in big numbers across
// the top, the terminal itself in the middle — the ships at their berths with how far their discharge has come, the
// yard blocks filling up, the moves flowing quay to yard and in at the gate — and beside it the berth schedule, the
// cranes' rates and the alarms. A mixed board: the terminal is a canvas in a grid cell spanning the column beside it.
// No public source carries a terminal's operations, so the values are example data written for the board.

export const TOS: ExampleSampleConnector = {
  key: 'tos',
  name: '예시 터미널 운영 시스템(TOS)',
  example: true,
  attribution: { text: '예시 데이터 — 실제 터미널이 아닙니다' },
};

/** The terminal reports every minute; ten minutes without a report is a source that has stopped. */
const MAX_AGE_SECONDS = 10 * 60;

const bind = (path: string, valuePath: string, map?: Binding['map']): Binding => ({
  adapter: TOS.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
  ...(map ? { map } : {}),
});

/** A field of one item of a list, by its id. */
const bindItem = (path: string, id: string, field: string, map?: Binding['map']): Binding => ({
  adapter: TOS.key,
  ref: { path, item: { list: '/value', where: { id } }, valuePath: `/${field}`, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
  ...(map ? { map } : {}),
});

// ── Elements: what no prepared widget draws the way a control room's wall does ──────────────────────────────────

/** A day's figure in a big number, with a line under it — the accent's glow on the dark board. */
const stat: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['label', 'value'],
    properties: {
      label: { type: 'string' },
      value: { type: 'number' },
      unit: { type: 'string' },
      note: { type: 'string', description: 'A line under the number — the target, the trend.' },
      tone: { enum: ['normal', 'warn'], description: 'warn draws it in the warning colour.' },
      decimal: { type: 'boolean', description: 'Shown with one digit after the point; otherwise whole, grouped by thousands.' },
    },
  },
  template: `<div class="stat {{tone}}">
  <span class="label">{{label}}</span>
  <b class="value">{{#decimal}}{{value | grouped:1}}{{/decimal}}{{^decimal}}{{value | grouped:0}}{{/decimal}}<small>{{unit}}</small></b>
  {{#note}}<span class="note">{{note}}</span>{{/note}}
</div>`,
  style: `.stat{--c:var(--u-widget-primary);height:100%;box-sizing:border-box;display:grid;align-content:center;gap:2px;padding:10px 14px;border-top:2px solid var(--c);background:linear-gradient(180deg,color-mix(in srgb,var(--c) 14%,transparent),transparent 70%);font-family:var(--u-widget-font-family)}
.stat.warn{--c:var(--u-widget-warning)}
.label{font-size:12px;letter-spacing:.04em;color:var(--u-widget-text-secondary)}
.value{font-size:34px;line-height:1.1;font-weight:700;color:var(--c);font-variant-numeric:tabular-nums;text-shadow:0 0 18px color-mix(in srgb,var(--c) 55%,transparent)}
.value small{font-size:14px;font-weight:600;margin-left:4px;color:var(--u-widget-text-secondary);text-shadow:none}
.note{font-size:12px;color:var(--u-widget-text-secondary)}`,
  size: { width: 200, height: 104 },
};

/** A ship at its berth: its name, how much of its discharge and loading is done, when it leaves, the cranes on it. */
const berth: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['berth', 'vessel'],
    properties: {
      berth: { type: 'string' },
      vessel: { type: 'string' },
      state: { enum: ['working', 'waiting', 'idle'] },
      stateText: { type: 'string' },
      done: { type: 'number' },
      total: { type: 'number' },
      progress: { type: 'number', minimum: 0, maximum: 100 },
      etd: { type: 'string' },
      cranes: { type: 'number' },
    },
  },
  template: `<article class="berth {{state}}" style="--p: {{progress}}">
  <header><span class="tag">{{berth}}</span><span class="state"><i></i>{{stateText}}</span></header>
  <b class="vessel">{{vessel}}</b>
  <div class="bar" role="img" aria-label="{{progress}}%"><span></span></div>
  <footer><span>{{done | grouped:0}} / {{total | grouped:0}} moves · 크레인 {{cranes}}</span><span>{{etd}}</span></footer>
</article>`,
  style: `.berth{--c:var(--u-widget-primary);height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr auto auto;gap:6px;padding:10px 12px;border:1px solid color-mix(in srgb,var(--c) 45%,transparent);border-radius:10px;background:color-mix(in srgb,var(--u-widget-bg) 82%,transparent);box-shadow:0 0 22px color-mix(in srgb,var(--c) 22%,transparent);font-family:var(--u-widget-font-family)}
.waiting{--c:var(--u-widget-warning)}
.idle{--c:var(--u-widget-text-secondary)}
header{display:flex;justify-content:space-between;font-size:11px;color:var(--u-widget-text-secondary)}
.tag{font-weight:700;letter-spacing:.08em;color:var(--c)}
.state{display:inline-flex;align-items:center;gap:5px}
.state i{width:7px;height:7px;border-radius:50%;background:var(--c);box-shadow:0 0 8px var(--c)}
.vessel{font-size:17px;letter-spacing:.03em;color:var(--u-widget-text);align-self:center}
.bar{height:6px;border-radius:3px;background:color-mix(in srgb,var(--u-widget-text) 12%,transparent);overflow:hidden}
.bar span{display:block;height:100%;width:calc(var(--p) * 1%);background:linear-gradient(90deg,color-mix(in srgb,var(--c) 55%,transparent),var(--c))}
footer{display:flex;justify-content:space-between;font-size:11px;color:var(--u-widget-text-secondary);font-variant-numeric:tabular-nums}`,
  size: { width: 300, height: 118 },
};

/** A yard block, filled to how full it is — over 85 % in the warning colour. */
const block: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['name', 'used'],
    properties: {
      name: { type: 'string' },
      used: { type: 'number', minimum: 0, maximum: 100, description: 'Percent of its slots in use.' },
      level: { enum: ['normal', 'high'] },
    },
  },
  template: `<div class="block {{level}}" style="--u: {{used}}" role="img" aria-label="{{name}} {{used}}%">
  <span class="fill"></span>
  <span class="name">{{name}}</span>
  <b class="used">{{used}}<small>%</small></b>
</div>`,
  style: `.block{--c:var(--u-widget-primary);position:relative;height:100%;box-sizing:border-box;border:1px solid color-mix(in srgb,var(--c) 40%,transparent);border-radius:6px;overflow:hidden;font-family:var(--u-widget-font-family);background:repeating-linear-gradient(90deg,transparent 0 14px,color-mix(in srgb,var(--u-widget-text) 6%,transparent) 14px 15px)}
.block.high{--c:var(--u-widget-warning)}
.fill{position:absolute;inset:auto 0 0 0;height:calc(var(--u) * 1%);background:linear-gradient(0deg,color-mix(in srgb,var(--c) 45%,transparent),color-mix(in srgb,var(--c) 12%,transparent))}
.name{position:absolute;top:6px;left:8px;font-size:11px;font-weight:700;letter-spacing:.08em;color:var(--u-widget-text-secondary)}
.used{position:absolute;right:8px;bottom:4px;font-size:22px;color:var(--c);font-variant-numeric:tabular-nums}
.used small{font-size:12px}`,
  size: { width: 150, height: 92 },
};

// ── The terminal, drawn ─────────────────────────────────────────────────────────────────────────────────────────

const WIDTH = 1100;
const HEIGHT = 640;
const QUAY_Y = 170;

const BERTHS = [
  { id: 'B1', name: '1번 선석', x: 40 },
  { id: 'B2', name: '2번 선석', x: 400 },
  { id: 'B3', name: '3번 선석', x: 760 },
];
const BERTH_STATE = { values: { working: '작업 중', waiting: '접안 대기', idle: '비어 있음' }, otherwise: '알 수 없음' };

const BLOCKS = [
  { id: 'A', x: 60, y: 300 },
  { id: 'B', x: 240, y: 300 },
  { id: 'C', x: 420, y: 300 },
  { id: 'D', x: 60, y: 420 },
  { id: 'E', x: 240, y: 420 },
  { id: 'F', x: 420, y: 420 },
];

function berthNode({ id, name, x }: (typeof BERTHS)[number]): Node {
  const field = (f: string, map?: Binding['map']) => bindItem('/terminal/berths', id, f, map);
  return {
    id: `berth-${id}`,
    x,
    y: 30,
    width: 300,
    height: 118,
    anchored: false,
    widget: {
      type: 'element:berth',
      props: { berth: name, vessel: '—', state: 'idle', stateText: '', done: 0, total: 0, progress: 0, etd: '', cranes: 0 },
      bindings: {
        vessel: field('vessel'),
        state: field('state'),
        stateText: field('state', BERTH_STATE),
        done: field('done'),
        total: field('total'),
        progress: field('progress'),
        etd: field('etd'),
        cranes: field('cranes'),
      },
    },
  };
}

function blockNode({ id, x, y }: (typeof BLOCKS)[number]): Node {
  return {
    id: `block-${id}`,
    x,
    y,
    width: 150,
    height: 92,
    anchored: false,
    widget: {
      type: 'element:block',
      props: { name: `${id} 블록`, used: 0, level: 'normal' },
      bindings: {
        used: bindItem('/terminal/yard', id, 'used'),
        level: bindItem('/terminal/yard', id, 'used', { ranges: [{ max: 85, value: 'normal' }, { min: 85, value: 'high' }] }),
      },
    },
  };
}

const GATE: Node = {
  id: 'gate',
  x: 800,
  y: 470,
  width: 220,
  height: 104,
  anchored: false,
  widget: {
    type: 'element:stat',
    props: { label: '게이트 반입 (대/시)', value: 0, unit: '대' },
    bindings: { value: bind('/terminal/gate', '/inPerHour') },
  },
};

/** Quay to yard, the moves of each working berth an hour — the flow drawn in the accent, its rate on the line. */
const flow = (from: string, to: string, valuePath: string, id: string): Connector => ({
  id,
  fromNodeId: from,
  toNodeId: to,
  label: '{{value}} moves/h',
  style: { stroke: '#22d3ee', strokeWidth: 2, arrow: 'end', route: 'orthogonal' },
  bindings: { label: { adapter: TOS.key, ref: { path: '/terminal/berths', item: { list: '/value', where: { id: valuePath } }, valuePath: '/rate', observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS } } },
});

const CONNECTORS: Connector[] = [
  flow('berth-B1', 'block-A', 'B1', 'flow-B1'),
  flow('berth-B2', 'block-C', 'B2', 'flow-B2'),
  {
    id: 'flow-gate',
    fromNodeId: 'gate',
    toNodeId: 'block-F',
    label: '{{value}} 대/h',
    style: { stroke: '#f59e0b', strokeWidth: 2, arrow: 'end', dash: 'dashed', route: 'orthogonal' },
    bindings: { label: bind('/terminal/gate', '/inPerHour') },
  },
];

const DECORATIONS: Shape[] = [
  { id: 'yard-frame', type: 'rect', x: 40, y: 270, width: 560, height: 266, stroke: '#1e3a5f', strokeWidth: 1, dash: 'dashed', radius: 10, label: 'CONTAINER YARD', labelSize: 12, labelFill: '#5b7da3' },
  { id: 'gate-label', type: 'text', x: 800, y: 440, text: 'GATE', fontSize: 12, fill: '#5b7da3' },
  { id: 'quay-label', type: 'text', x: 1060, y: QUAY_Y + 14, text: 'QUAY', fontSize: 12, fill: '#5b7da3', anchor: 'top-end' },
];

/** Dark water above the quay, the quay with its crane rails and berth marks, the roads, the gate lanes. */
function drawing(): string {
  const waterLines = Array.from({ length: 9 }, (_, i) => `<path d="M 0 ${18 + i * 17} H ${WIDTH}" stroke="#0f2a44" stroke-width="1" opacity="${0.35 + (i % 3) * 0.15}"/>`).join('\n');
  const berthMarks = BERTHS.map(({ x, name }) => `<rect x="${x}" y="${QUAY_Y}" width="300" height="34" fill="#132238"/>
<text x="${x + 150}" y="${QUAY_Y + 22}" font-size="12" fill="#3f6b94" text-anchor="middle" font-family="sans-serif" letter-spacing="2">${name}</text>`).join('\n');
  const lanes = Array.from({ length: 5 }, (_, i) => `<rect x="${1040}" y="${470 + i * 22}" width="40" height="14" rx="3" fill="#1b2a3f"/>`).join('\n');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<defs><linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#04101e"/><stop offset="1" stop-color="#082038"/></linearGradient></defs>
<rect width="${WIDTH}" height="${HEIGHT}" fill="#070d18"/>
<rect width="${WIDTH}" height="${QUAY_Y}" fill="url(#sea)"/>
${waterLines}
<rect x="0" y="${QUAY_Y}" width="${WIDTH}" height="70" fill="#0d1726"/>
<path d="M 0 ${QUAY_Y + 46} H ${WIDTH} M 0 ${QUAY_Y + 60} H ${WIDTH}" stroke="#22d3ee" stroke-opacity=".25" stroke-width="1.5"/>
${berthMarks}
<path d="M 640 ${QUAY_Y + 70} V 600 H 1030" fill="none" stroke="#122033" stroke-width="22"/>
<path d="M 640 ${QUAY_Y + 70} V 600 H 1030" fill="none" stroke="#1d3150" stroke-width="1" stroke-dasharray="10 10"/>
${lanes}
</svg>`;
  return svgDataUrl(svg);
}

const TERMINAL: CellCanvas = {
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes: [...BERTHS.map(berthNode), ...BLOCKS.map(blockNode), GATE],
  connectors: CONNECTORS,
  decorations: DECORATIONS,
};

// ── The board ───────────────────────────────────────────────────────────────────────────────────────────────────

const statItem = (id: string, label: string, valuePath: string, unit: string, note?: string, decimal = false): GridItem => ({
  id,
  span: 2,
  spanMedium: 2,
  widget: {
    type: 'element:stat',
    props: { label, value: 0, unit, ...(note && { note }), ...(decimal && { decimal }) },
    bindings: { value: bind('/terminal/summary', valuePath) },
  },
});

const card = (id: string, span: number, spanMedium: number, widget: Widget, height?: number): GridItem => ({
  id,
  span,
  spanMedium,
  ...(height !== undefined && { height }),
  widget,
});

const items: GridItem[] = [
  statItem('teu', '오늘 처리량', '/teuToday', 'TEU', '목표 9,000'),
  statItem('occupancy', '선석 점유율', '/berthOccupancy', '%', undefined, true),
  statItem('gmph', '크레인 생산성', '/gmph', 'GMPH', '목표 30', true),
  statItem('yard', '장치율', '/yardUtilization', '%', undefined, true),
  // The queue at the gate turns to the warning colour past forty trucks.
  card('queue', 2, 2, {
    type: 'element:stat',
    props: { label: '게이트 대기', value: 0, unit: '대', tone: 'normal' },
    bindings: {
      value: bind('/terminal/summary', '/gateQueue'),
      tone: bind('/terminal/summary', '/gateQueue', { ranges: [{ max: 40, value: 'normal' }, { min: 40, value: 'warn' }] }),
    },
  }),
  statItem('turn', '평균 반출입 시간', '/turnTime', '분'),
  { id: 'terminal', span: 8, spanMedium: 6, rowSpan: 2, canvas: TERMINAL },
  card('schedule', 4, 6, {
    type: 'chart.gantt',
    props: {
      title: '선석 계획',
      data: [],
      mapping: { y: 'berth', start: 'start', end: 'end', label: 'vessel' },
      options: { categories: ['1번 선석', '2번 선석', '3번 선석'] },
    },
    bindings: { data: bind('/terminal/schedule', '/value') },
  }, 230),
  card('cranes', 4, 6, {
    type: 'chart.bar',
    props: {
      title: '안벽 크레인 시간당 작업(mph)',
      data: [],
      mapping: { x: 'crane', y: 'mph' },
      options: { series: [{ label: 'mph' }], referenceLines: [{ value: 30, label: '목표', style: 'dashed' }] },
    },
    bindings: { data: bind('/terminal/cranes', '/value') },
  }, 220),
  card('hourly', 8, 6, {
    type: 'chart.bar',
    props: {
      title: '2시간 단위 처리 moves — 실적과 목표',
      data: [],
      mapping: { x: 'hour', y: ['moves', 'target'] },
      options: { xFormat: 'time', series: [{ label: '실적' }, { label: '목표', type: 'line', lineStyle: 'dashed', symbol: 'none', color: '#f59e0b' }] },
    },
    bindings: { data: bind('/terminal/hourly', '/value') },
  }),
  card('alarms', 4, 6, {
    type: 'table',
    props: {
      title: '알람',
      data: [],
      mapping: { columns: [{ field: 'time', label: '시각' }, { field: 'level', label: '등급' }, { field: 'text', label: '내용' }] },
    },
    bindings: { data: bind('/terminal/alarms', '/value') },
  }),
];

const document: GridView = {
  kind: 'grid',
  appearance: 'dark',
  accent: '#22d3ee',
  elements: { stat, berth, block },
  items,
};

export const portTerminal: SamplePack = {
  id: 'port-terminal',
  title: { ko: '컨테이너 터미널 관제실', en: 'Container terminal control room' },
  field: { ko: '물류·항만', en: 'Logistics & ports' },
  kind: { ko: '터미널 약도 + 카드(혼합, 다크)', en: 'Terminal plan among cards (mixed, dark)' },
  domain: 'logistics',
  styles: ['control-room'],
  summary: {
    ko: '관제실 벽에 거는 다크 상황판 — 위에 오늘의 숫자들, 가운데 터미널: 선석의 배마다 하역 진척과 출항 시각, 채워지는 장치장 블록, 안벽→장치장과 게이트의 흐름. 옆에 선석 계획(간트), 크레인 생산성, 알람. 예시 데이터입니다.',
    en: 'A dark wall board for the control room — the day’s figures across the top; the terminal in the middle: each ship at its berth with its progress and departure, the yard blocks filling up, the moves flowing quay to yard and in at the gate; beside it the berth schedule (Gantt), the cranes’ rates and the alarms. Example data.',
  },
  connectors: [TOS],
  document,
  snapshot,
};
