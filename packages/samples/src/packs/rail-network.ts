import type { Binding, CanvasView, Connector, ElementDefinition, Node, Shape, Widget } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { svgDataUrl } from '../frame.js';
import { snapshot } from '../snapshots/rail-network.js';

// A high-speed rail network's operations board, drawn as a transit map: the country's lines as coloured strokes from
// station to station, each section as thick as the trains on it and dashed where they run late, with the delay on
// it; the stations a dot each, ringed red where trains wait. Beside the map, the day's figures, punctuality by line
// against its target and the trains running late. A wide area on one canvas — a schematic, not a survey: stations
// sit where a rider reads them. No public source carries a network's running this way, so the values are example
// data written for the board.

export const OPS: ExampleSampleConnector = {
  key: 'ops',
  name: '예시 열차 운행 관리 시스템',
  example: true,
  attribution: { text: '예시 데이터 — 실제 열차 운행 정보가 아닙니다' },
};

/** Running is reported every thirty seconds; five minutes without a report is a source that has stopped. */
const MAX_AGE_SECONDS = 5 * 60;

const bind = (path: string, valuePath: string, map?: Binding['map']): Binding => ({
  adapter: OPS.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
  ...(map ? { map } : {}),
});

/** A field of one item of a list, by its id. */
const bindItem = (path: string, id: string, field: string, map?: Binding['map']): Binding => ({
  adapter: OPS.key,
  ref: { path, item: { list: '/value', where: { id } }, valuePath: `/${field}`, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
  ...(map ? { map } : {}),
});

const INK = '#0f172a';
const MUTED = '#64748b';

// ── Elements ────────────────────────────────────────────────────────────────────────────────────────────────────

/** A station: a white dot with the line's ring, a red one where trains are held. */
const station: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['name', 'state'],
    properties: { name: { type: 'string' }, state: { enum: ['normal', 'held'] }, hub: { type: 'boolean' } },
  },
  template: `<span class="dot {{state}}{{#hub}} hub{{/hub}}" role="img" aria-label="{{name}}"></span>`,
  style: `.dot{display:block;box-sizing:border-box;width:100%;height:100%;border-radius:50%;background:#fff;border:3px solid ${INK}}
.hub{border-width:4px}
.held{border-color:#dc2626;box-shadow:0 0 0 4px rgb(220 38 38 / 25%)}`,
  size: { width: 18, height: 18 },
};

/** The board's heading and the time it shows. */
const masthead: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['asOf'], properties: { asOf: { type: 'string' } } },
  template: `<header class="mast"><span>고속철도 운행 관제</span><b>전국 노선도</b><em>{{asOf}} 기준</em></header>`,
  style: `.mast{height:100%;box-sizing:border-box;display:grid;align-content:center;gap:2px;color:${INK};font-family:var(--u-widget-font-family)}
span{font-size:12px;font-weight:700;letter-spacing:.08em;color:#2563eb}
b{font-size:26px;letter-spacing:-.01em}
em{font-style:normal;font-size:12px;color:${MUTED}}`,
  size: { width: 280, height: 80 },
};

/** A figure of the day — a label, a large number, a line under it. */
const figure: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['label', 'value'],
    properties: {
      label: { type: 'string' },
      value: { type: 'number' },
      unit: { type: 'string' },
      note: { type: 'string' },
      decimal: { type: 'boolean', description: 'Shown with one digit after the point; otherwise whole, grouped by thousands.' },
      tone: { enum: ['normal', 'warn'] },
    },
  },
  template: `<div class="fig {{tone}}"><span>{{label}}</span><b>{{#decimal}}{{value | fixed:1}}{{/decimal}}{{^decimal}}{{value | grouped:0}}{{/decimal}}<small>{{unit}}</small></b>{{#note}}<em>{{note}}</em>{{/note}}</div>`,
  style: `.fig{height:100%;box-sizing:border-box;display:grid;align-content:center;gap:2px;padding:10px 14px;border-radius:10px;background:#fff;border:1px solid #e2e8f0;color:${INK};font-family:var(--u-widget-font-family)}
span{font-size:12px;color:${MUTED}}
b{font-size:24px;line-height:1.1;white-space:nowrap;font-variant-numeric:tabular-nums}
small{font-size:13px;font-weight:500;margin-left:2px;color:${MUTED}}
em{font-style:normal;font-size:11px;color:${MUTED}}
.warn b{color:#dc2626}`,
  size: { width: 134, height: 84 },
};

// ── The map ─────────────────────────────────────────────────────────────────────────────────────────────────────

type Side = 'right' | 'left' | 'above' | 'below' | 'above-right';

/** Where a name sits for each side: its offset from the dot's centre and which point of the text that is. */
const NAME_AT: Record<Side, { dx: number; dy: number; anchor: 'start' | 'end' | 'bottom' | 'top' | 'bottom-start' }> = {
  right: { dx: 14, dy: 0, anchor: 'start' },
  left: { dx: -14, dy: 0, anchor: 'end' },
  above: { dx: 0, dy: -14, anchor: 'bottom' },
  below: { dx: 0, dy: 14, anchor: 'top' },
  'above-right': { dx: 9, dy: -9, anchor: 'bottom-start' },
};

interface Station {
  id: string;
  name: string;
  x: number;
  y: number;
  hub?: boolean;
  /** Where its name sits beside the dot — off the line that runs through it. */
  side?: Side;
}

const STATIONS: Station[] = [
  { id: 'seoul', name: '서울', x: 250, y: 140, hub: true, side: 'left' },
  { id: 'cheongnyangni', name: '청량리', x: 320, y: 100, side: 'above' },
  { id: 'suseo', name: '수서', x: 350, y: 175 },
  { id: 'gwangmyeong', name: '광명', x: 250, y: 210, side: 'left' },
  { id: 'dongtan', name: '동탄', x: 350, y: 235 },
  { id: 'pyeongtaek', name: '평택지제', x: 330, y: 295 },
  { id: 'cheonan', name: '천안아산', x: 250, y: 300, side: 'left' },
  { id: 'osong', name: '오송', x: 290, y: 370, hub: true },
  { id: 'daejeon', name: '대전', x: 340, y: 440, hub: true },
  { id: 'gimcheon', name: '김천구미', x: 440, y: 515, side: 'above-right' },
  { id: 'dongdaegu', name: '동대구', x: 550, y: 560, hub: true, side: 'above-right' },
  { id: 'singyeongju', name: '신경주', x: 650, y: 610, side: 'above-right' },
  { id: 'ulsan', name: '울산', x: 710, y: 670 },
  { id: 'busan', name: '부산', x: 690, y: 760, hub: true },
  { id: 'gongju', name: '공주', x: 230, y: 445, side: 'left' },
  { id: 'iksan', name: '익산', x: 190, y: 525, side: 'left' },
  { id: 'jeongeup', name: '정읍', x: 170, y: 605, side: 'left' },
  { id: 'gwangju', name: '광주송정', x: 150, y: 685, hub: true, side: 'left' },
  { id: 'mokpo', name: '목포', x: 90, y: 765, side: 'left' },
  { id: 'manjong', name: '만종', x: 470, y: 115, side: 'below' },
  { id: 'jinbu', name: '진부', x: 620, y: 95, side: 'above' },
  { id: 'gangneung', name: '강릉', x: 760, y: 85, hub: true },
];

const LINES = {
  gyeongbu: { name: '경부선', color: '#2563eb' },
  srt: { name: 'SRT', color: '#7c3aed' },
  honam: { name: '호남선', color: '#16a34a' },
  gangneung: { name: '강릉선', color: '#ea580c' },
} as const;
type Line = keyof typeof LINES;

/** Each line as the stations it runs through, in order — a section between each two. */
const ROUTES: Record<Line, string[]> = {
  gyeongbu: ['seoul', 'gwangmyeong', 'cheonan', 'osong', 'daejeon', 'gimcheon', 'dongdaegu', 'singyeongju', 'ulsan', 'busan'],
  srt: ['suseo', 'dongtan', 'pyeongtaek', 'osong'],
  honam: ['osong', 'gongju', 'iksan', 'jeongeup', 'gwangju', 'mokpo'],
  gangneung: ['seoul', 'cheongnyangni', 'manjong', 'jinbu', 'gangneung'],
};

const DOT = 18;

const stationNode = ({ id, name, x, y, hub }: Station): Node => ({
  id,
  x: x - DOT / 2,
  y: y - DOT / 2,
  width: DOT,
  height: DOT,
  anchored: false,
  widget: {
    type: 'element:station',
    props: { name, state: 'normal', ...(hub && { hub: true }) },
    bindings: { state: bindItem('/rail/stations', id, 'state') },
  },
});

/** A section: the line's colour, as thick as the trains on it in the last hour, dashed with its delay where late. */
const sectionConnector = (line: Line, from: string, to: string): Connector => {
  const id = `${from}-${to}`;
  return {
    id,
    fromNodeId: from,
    toNodeId: to,
    style: { stroke: LINES[line].color, strokeWidth: 6 },
    bindings: {
      'style.strokeWidth': bindItem('/rail/sections', id, 'trains', { ranges: [{ max: 6, value: 4 }, { min: 6, max: 12, value: 6 }, { min: 12, value: 9 }] }),
      'style.dash': bindItem('/rail/sections', id, 'state', { values: { late: 'dashed' }, otherwise: 'solid' }),
      label: bindItem('/rail/sections', id, 'delayText'),
    },
  };
};

const CONNECTORS: Connector[] = (Object.keys(ROUTES) as Line[]).flatMap(line =>
  ROUTES[line].slice(1).map((to, i) => sectionConnector(line, ROUTES[line][i], to))
);

const stationName = ({ id, name, x, y, hub, side = 'right' }: Station): Shape => ({
  id: `name-${id}`,
  type: 'text',
  x: x + NAME_AT[side].dx,
  y: y + NAME_AT[side].dy,
  text: name,
  fontSize: hub ? 15 : 13,
  fill: hub ? INK : '#334155',
  anchor: NAME_AT[side].anchor,
});

/** The key: a swatch and a name per line, and what a dashed section means. */
const legend = (): Shape[] => [
  ...(Object.keys(LINES) as Line[]).flatMap((line, i): Shape[] => [
    { id: `key-${line}`, type: 'rect', x: 520, y: 262 + i * 26, width: 26, height: 6, radius: 3, fill: LINES[line].color },
    { id: `key-${line}-name`, type: 'text', x: 556, y: 265 + i * 26, text: LINES[line].name, fontSize: 13, fill: '#334155', anchor: 'start' },
  ]),
  { id: 'key-late', type: 'text', x: 520, y: 372, text: '점선 = 지연 구간 · 굵기 = 시간당 운행 편수', fontSize: 12, fill: MUTED },
];

// ── The panel ───────────────────────────────────────────────────────────────────────────────────────────────────

const PANEL_X = 880;

const node = (id: string, x: number, y: number, width: number, height: number, widget: Widget): Node => ({ id, x, y, width, height, anchored: false, widget });

const fig = (id: string, x: number, y: number, label: string, unit: string, extra: { note?: string; decimal?: boolean; warnAbove?: number } = {}): Node =>
  node(id, x, y, 134, 84, {
    type: 'element:figure',
    props: { label, value: 0, unit, ...(extra.note && { note: extra.note }), ...(extra.decimal && { decimal: true }), tone: 'normal' },
    bindings: {
      value: bind('/rail/summary', `/${id}`),
      ...(extra.warnAbove !== undefined && { tone: bind('/rail/summary', `/${id}`, { ranges: [{ max: extra.warnAbove, value: 'normal' }, { min: extra.warnAbove, value: 'warn' }] }) }),
    },
  });

const PANEL: Node[] = [
  node('masthead', PANEL_X, 30, 280, 80, { type: 'element:masthead', props: { asOf: '' }, bindings: { asOf: bind('/rail/summary', '/asOf') } }),
  fig('running', PANEL_X, 124, '운행 중 열차', '편'),
  fig('punctuality', PANEL_X + 146, 124, '정시율', '%', { decimal: true, note: '목표 95%' }),
  fig('late', PANEL_X, 220, '지연 열차', '편', { warnAbove: 5 }),
  fig('riders', PANEL_X + 146, 220, '오늘 이용객', '명'),
  node('by-line', PANEL_X, 318, 280, 190, {
    type: 'chart.bar',
    props: {
      title: '노선별 정시율 (%)',
      data: [],
      mapping: { x: 'line', y: 'punctuality' },
      options: { horizontal: true, valueAxisZero: false, referenceLines: [{ axis: 'x', value: 95, label: '목표', style: 'dashed' }], series: [{ label: '정시율', color: '#2563eb' }] },
    },
    bindings: { data: bind('/rail/lines', '/value') },
  }),
  node('late-trains', PANEL_X, 520, 280, 270, {
    type: 'table',
    props: {
      title: '지연 열차',
      data: [],
      mapping: { columns: [{ field: 'train', label: '열차' }, { field: 'route', label: '구간' }, { field: 'delay', label: '지연' }] },
    },
    bindings: { data: bind('/rail/lateTrains', '/value') },
  }),
];

// ── The board ───────────────────────────────────────────────────────────────────────────────────────────────────

const WIDTH = 1200;
const HEIGHT = 820;

/** A pale page with the map's panel and the side panel set off from it. */
function paper(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<rect width="${WIDTH}" height="${HEIGHT}" fill="#f1f5f9"/>
<rect x="20" y="20" width="830" height="780" rx="18" fill="#ffffff" stroke="#e2e8f0"/>
<rect x="${PANEL_X - 12}" y="20" width="${WIDTH - PANEL_X - 8}" height="780" rx="18" fill="#f8fafc" stroke="#e2e8f0"/>
</svg>`;
  return svgDataUrl(svg);
}

const document: CanvasView = {
  kind: 'canvas',
  background: { image: { src: paper(), width: WIDTH, height: HEIGHT } },
  accent: '#2563eb',
  nodes: [...STATIONS.map(stationNode), ...PANEL],
  connectors: CONNECTORS,
  decorations: [...STATIONS.map(stationName), ...legend()],
  elements: { station, masthead, figure },
};

export const railNetwork: SamplePack = {
  id: 'rail-network',
  title: { ko: '고속철도 운행 관제 — 전국 노선도', en: 'High-speed rail operations — the network map' },
  field: { ko: '교통·철도', en: 'Transport & rail' },
  kind: { ko: '노선도(도식 지도, 광역)', en: 'Network map (schematic, nationwide)' },
  domain: 'transport',
  styles: ['control-room'],
  summary: {
    ko: '전국 고속철도를 노선도로 — 노선 색으로 이은 역과 역, 구간마다 시간당 운행 편수만큼의 굵기, 늦는 구간은 점선과 지연 분, 열차가 묶인 역은 붉은 고리. 옆에 오늘의 숫자, 목표와 견준 노선별 정시율, 지연 열차. 예시 데이터입니다.',
    en: 'The country’s high-speed rail as a transit map — stations joined in their line’s colour, each section as thick as the trains on it in the hour, dashed with its delay where late, a red ring where trains are held; beside it the day’s figures, punctuality by line against its target and the trains running late. Example data.',
  },
  connectors: [OPS],
  document,
  snapshot,
};
