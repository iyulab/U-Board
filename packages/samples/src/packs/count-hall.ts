import type { Binding, CanvasView, Connector, ElementDefinition, Node, Widget } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { svgDataUrl } from '../frame.js';
import { snapshot } from '../snapshots/count-hall.js';

// A by-election's counting hall drawn as a brutalist web page: raw grey floor, thick black rules, a monospace face, one
// highlighter yellow for what is moving and red for what has stopped. The hall's plan shows where a ballot box goes —
// received at the desk, opened at a sorter, checked at a review table, published by the commission — with every station
// a box saying how many ballot boxes it has done and the flow between them as arrows; the arrow out of a stopped sorter
// turns red. Beside it the count's stages, each district's progress as a bar of blocks, and the count over the evening.
// It carries no candidate's or party's figures — only how far the count has come. The city and its election are made
// up, so the values are example data.

export const COUNT: ExampleSampleConnector = {
  key: 'count',
  name: '예시 개표 진행 API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 선거가 아닙니다' },
};

/** The hall posts as boxes move; a quarter of an hour without an answer is a source that has stopped. */
const MAX_AGE_SECONDS = 15 * 60;

const bind = (path: string, valuePath: string, map?: Binding['map']): Binding => ({
  adapter: COUNT.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
  ...(map ? { map } : {}),
});

const WIDTH = 1600;
const HEIGHT = 1000;
const FLOOR = '#d9d9d6';
const INK = '#000000';
/** Moving, stopped — the only two colours besides black and white. */
const YELLOW = '#ffe500';
const RED = '#e5141b';
const MONO = '"IBM Plex Mono", "D2Coding", "JetBrains Mono", Consolas, "Courier New", monospace';

const STATION = { width: 150, height: 100 };
const COLUMN_X = [70, 235, 400, 565, 730, 895];
const SORTER_Y = 470;
const TABLE_Y = 270;
const DESK = { x: 395, y: 720, width: 320, height: 100 };
const BOARD = { x: 395, y: 80, width: 320, height: 100 };

const FLOW_STROKE = { values: { stop: RED }, otherwise: INK };
const FLOW_DASH = { values: { stop: 'dashed', idle: 'dotted' }, otherwise: 'solid' };

// ── The hall ────────────────────────────────────────────────────────────────────────────────────────────────────

function drawing(): string {
  // The hall's fixed ways: the conveyor from the desk out to every sorter, and the trays from every review table in to
  // the commission — drawn once; the way from each sorter to its table is a connector, since it follows the sorter.
  const centres = COLUMN_X.map(x => x + STATION.width / 2);
  const deskTop = DESK.y;
  const sorterFoot = SORTER_Y + STATION.height;
  const belt = 650;
  const conveyor = `M ${DESK.x + DESK.width / 2} ${deskTop} V ${belt} M ${centres[0]} ${belt} H ${centres[5]} ${centres.map(c => `M ${c} ${belt} V ${sorterFoot + 4}`).join(' ')}`;
  const trayLine = 225;
  const trays = `${centres.map(c => `M ${c} ${TABLE_Y} V ${trayLine}`).join(' ')} M ${centres[0]} ${trayLine} H ${centres[5]} M ${BOARD.x + BOARD.width / 2} ${trayLine} V ${BOARD.y + BOARD.height + 4}`;
  const hatch = (x: number, y: number, w: number, h: number) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#hatch)" stroke="${INK}" stroke-width="3"/><text x="${x + 12}" y="${y + 30}" fill="${INK}" font-size="18" font-weight="700" font-family='${MONO}'>[참관인석]</text>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<defs>
<pattern id="tiles" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 H 0 V 40" fill="none" stroke="#c4c4c0" stroke-width="1"/></pattern>
<marker id="head" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M 0 0 L 10 5 L 0 10 Z" fill="${INK}"/></marker>
<pattern id="hatch" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="12" height="12" fill="#fff"/><line x1="0" y1="0" x2="0" y2="12" stroke="${INK}" stroke-width="3"/></pattern>
</defs>
<rect width="${WIDTH}" height="${HEIGHT}" fill="#fff"/>
<rect x="40" y="40" width="1030" height="920" fill="${FLOOR}"/>
<rect x="40" y="40" width="1030" height="920" fill="url(#tiles)"/>
<path d="M 40 40 H 1070 V 960 H 640 M 470 960 H 40 Z" fill="none" stroke="${INK}" stroke-width="8"/>
<text x="478" y="950" fill="${INK}" font-size="17" font-weight="700" font-family='${MONO}'>출입 · 투표함 반입 ↑</text>
${hatch(60, 760, 300, 160)}${hatch(750, 760, 300, 160)}
<path d="${conveyor}" fill="none" stroke="${INK}" stroke-width="3"/>
${centres.map(c => `<path d="M ${c} ${belt - 30} V ${sorterFoot + 4}" stroke="${INK}" stroke-width="3" marker-end="url(#head)"/>`).join('')}
<path d="${trays}" fill="none" stroke="${INK}" stroke-width="3"/>
<path d="M ${BOARD.x + BOARD.width / 2} ${trayLine} V ${BOARD.y + BOARD.height + 4}" stroke="${INK}" stroke-width="3" marker-end="url(#head)"/>
<text x="${centres[5] - 150}" y="${belt + 24}" fill="${INK}" font-size="14" font-weight="700" font-family='${MONO}'>투표함 이송 →</text>
<text x="60" y="250" fill="${INK}" font-size="16" font-weight="700" font-family='${MONO}'>## 심사 · 집계</text>
<text x="60" y="450" fill="${INK}" font-size="16" font-weight="700" font-family='${MONO}'>## 투표지 분류</text>
<rect x="1090" y="0" width="510" height="${HEIGHT}" fill="#fff"/>
<path d="M 1090 0 V ${HEIGHT}" stroke="${INK}" stroke-width="4"/>
</svg>`;
  return svgDataUrl(svg);
}

// ── Elements ────────────────────────────────────────────────────────────────────────────────────────────────────

/** A station in the hall — the desk, a sorter, a review table or the commission — as a raw box: its name, its state,
 *  the ballot boxes it has done in big type and one line under. Reads its station from `s`. */
const station: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['s'], properties: { s: { type: 'object' } } },
  template: `<section class="st {{s.state}}"><header><b>{{s.name}}</b><span>{{s.word}}</span></header><strong>{{s.count}}</strong><small>{{s.sub}}</small></section>`,
  style: `.st{height:100%;box-sizing:border-box;display:grid;align-content:space-between;padding:6px 8px;background:#fff;border:3px solid ${INK};font-family:${MONO};color:${INK}}
header{display:flex;justify-content:space-between;align-items:baseline;gap:6px}
b{font-size:15px;font-weight:700;text-decoration:underline}
span{font-size:13px;font-weight:700;padding:0 4px;border:2px solid ${INK}}
.run span{background:${YELLOW}}
.done span{background:${INK};color:#fff}
.stop{border-color:${RED};outline:3px solid ${RED}}
.stop span{background:${RED};color:#fff;border-color:${RED}}
strong{font-size:30px;font-weight:700;line-height:1;font-variant-numeric:tabular-nums}
small{font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}`,
  size: STATION,
};

/** The board's head: the election, the count's rate on a highlighter stripe, the time. */
const title: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['name'], properties: { name: { type: 'string' }, rate: { type: 'string' }, date: { type: 'string' }, time: { type: 'string' } } },
  template: `<header class="tt"><h1>{{name}}</h1><p class="r">개표율 <mark>{{rate}}</mark></p><p>{{date}} {{time}} 기준 · 후보별 득표는 싣지 않음</p></header>`,
  style: `.tt{height:100%;box-sizing:border-box;display:grid;align-content:center;gap:6px;font-family:${MONO};color:${INK}}
h1{margin:0;font-size:24px;font-weight:700;text-decoration:underline;text-underline-offset:4px}
.r{margin:0;font-size:22px;font-weight:700}
mark{background:${YELLOW};color:${INK};font-size:52px;padding:0 6px}
p{margin:0;font-size:14px}`,
  size: { width: 470, height: 160 },
};

/** Rows with a bar of blocks — the stages of the count, or each district's progress. Each row's `tenth` (0–10) sets
 *  its bar. */
const bars: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['heading', 'items'],
    properties: {
      heading: { type: 'string' },
      items: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, value: { type: 'string' }, tenth: { type: 'number' } } } },
    },
  },
  template: `<section class="br"><h3>{{heading}}</h3><table>{{#items}}<tr><th>{{label}}</th><td><i class="b{{tenth}}"></i></td><td class="v">{{value}}</td></tr>{{/items}}</table></section>`,
  style: `.br{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr;gap:6px;font-family:${MONO};color:${INK}}
h3{margin:0;font-size:16px;font-weight:700;padding:2px 6px;background:${INK};color:#fff;justify-self:start}
table{width:100%;border-collapse:collapse;align-self:start}
th{text-align:left;font-size:14px;width:56px;padding:3px 0}
td{padding:3px 0;border-bottom:1px solid ${INK}}
td.v{text-align:right;font-size:14px;font-weight:700;width:100px;font-variant-numeric:tabular-nums}
i{display:block;height:14px;border:2px solid ${INK};background:repeating-linear-gradient(90deg,${INK} 0 9px,transparent 9px 12px) 0 0/var(--w,0%) 100% no-repeat}
${Array.from({ length: 11 }, (_, i) => `.b${i}{--w:${i * 10}%}`).join('')}`,
  size: { width: 470, height: 200 },
};

// ── The board ───────────────────────────────────────────────────────────────────────────────────────────────────

const node = (id: string, x: number, y: number, width: number, height: number, widget: Widget): Node => ({ id, x, y, width, height, anchored: false, widget });

const stationNode = (id: string, x: number, y: number, width = STATION.width, height = STATION.height) =>
  node(id, x, y, width, height, { type: 'element:station', props: { s: {} }, bindings: { s: bind('/count/stations', `/value/${id}`) } });

/** The ballots' way from a sorter to its review table, following the sorter's state — red and dashed when it stops. */
const flow = (i: number): Connector => ({
  id: `flow-s${i}-t${i}`,
  fromNodeId: `s${i}`,
  toNodeId: `t${i}`,
  style: { stroke: INK, strokeWidth: 3, arrow: 'end' },
  bindings: {
    'style.stroke': bind('/count/stations', `/value/s${i}/state`, FLOW_STROKE),
    'style.dash': bind('/count/stations', `/value/s${i}/state`, FLOW_DASH),
  },
});

const COLUMNS = [1, 2, 3, 4, 5, 6];

const nodes: Node[] = [
  stationNode('desk', DESK.x, DESK.y, DESK.width, DESK.height),
  ...COLUMNS.map(i => stationNode(`s${i}`, COLUMN_X[i - 1]!, SORTER_Y)),
  ...COLUMNS.map(i => stationNode(`t${i}`, COLUMN_X[i - 1]!, TABLE_Y)),
  stationNode('board', BOARD.x, BOARD.y, BOARD.width, BOARD.height),
  node('title', 1110, 24, 470, 160, {
    type: 'element:title',
    props: { name: '', rate: '', date: '', time: '' },
    bindings: { name: bind('/count/now', '/name'), rate: bind('/count/now', '/rate'), date: bind('/count/now', '/date'), time: bind('/count/now', '/time') },
  }),
  node('stages', 1110, 204, 470, 160, {
    type: 'element:bars',
    props: { heading: '단계별 투표함', items: [] },
    bindings: { items: bind('/count/stages', '/value') },
  }),
  node('districts', 1110, 384, 470, 300, { type: 'element:bars', props: { heading: '동별 개표율', items: [] }, bindings: { items: bind('/count/districts', '/value') } }),
  node('progress', 1110, 704, 470, 270, {
    type: 'chart.line',
    props: { title: '개표율(%) — 20분마다', data: [], mapping: { x: 'time', y: 'rate' }, options: { series: [{ label: '개표율', color: INK }] } },
    bindings: { data: bind('/count/progress', '/value') },
  }),
];

const document: CanvasView = {
  kind: 'canvas',
  appearance: 'light',
  accent: INK,
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes,
  connectors: COLUMNS.map(flow),
  elements: { station, title, bars },
};

export const countHall: SamplePack = {
  id: 'count-hall',
  title: { ko: '개표소 진행 — 웹 브루탈리즘', en: 'A counting hall — in web brutalism' },
  field: { ko: '선거·행정', en: 'Elections & public administration' },
  kind: { ko: '투표함이 흐르는 개표소 평면', en: 'A counting hall’s plan, with the ballot boxes’ way through it' },
  domain: 'public',
  styles: ['art'],
  summary: {
    ko: '보궐선거 개표소의 진행판을 웹 브루탈리즘으로 — 날 회색 바닥, 굵은 검은 선, 고정폭 글꼴, 움직이는 것엔 형광 노랑 하나와 멈춘 것엔 빨강. 개표소 평면 위에 투표함의 길(접수대 → 분류기 여섯 → 심사석 여섯 → 위원 검열·공표)을 화살표로, 자리마다 처리한 투표함 수와 상태를 날것의 상자로 — 멈춘 분류기에서 나가는 화살표는 빨간 점선. 오른쪽에 개표율, 단계별 투표함, 동별 개표율(블록 막대), 저녁 동안의 개표율. 후보·정당의 득표는 싣지 않고 개표의 진행만. 도시와 선거는 지어낸 것이라 예시 데이터입니다.',
    en: 'A by-election’s counting-hall board as a brutalist web page — a raw grey floor, thick black rules, a monospace face, one highlighter yellow for what is moving and red for what has stopped. On the hall’s plan the ballot boxes’ way as arrows (the receiving desk → six sorters → six review tables → the commission, which publishes), each station a raw box with the boxes it has done and its state — the arrow out of a stopped sorter turns red and dashed. On the right the count’s rate, the boxes through each stage, each district’s progress as a bar of blocks and the rate over the evening. No candidate’s or party’s figures — only how far the count has come. The city and its election are made up. Example data.',
  },
  connectors: [COUNT],
  document,
  snapshot,
};
