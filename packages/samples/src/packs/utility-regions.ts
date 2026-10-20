import type { Binding, CanvasView, ElementDefinition, Node, Shape } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { escapeXml, svgDataUrl } from '../frame.js';
import { snapshot } from '../snapshots/utility-regions.js';

// A water utility's service area on a sketch map: four districts, the booster stations and reservoirs in each, as its
// maintenance system sees them. Each site shows its state and the work orders open on it — grey while it runs as it
// should, amber with a warning, red when it has stopped (ISA-101). Each district's health — the share of its sites
// running without an alarm, weighed down by overdue inspections — paints its badge: quiet while healthy, amber below 85,
// red below 70. No public source carries a utility's assets, so the values are example data written for the board.

const WIDTH = 1280;
const HEIGHT = 800;

export const CMMS: ExampleSampleConnector = {
  key: 'cmms',
  name: '예시 CMMS API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 상수도 사업소가 아닙니다' },
};

/** The telemetry behind the states reports every few minutes; fifteen without one is a link that has dropped. */
const MAX_AGE_SECONDS = 15 * 60;

const bindItem = (path: string, id: string, field: string, map?: Binding['map']): Binding => ({
  adapter: CMMS.key,
  ref: { path, item: { list: '/value', where: { id } }, valuePath: `/${field}`, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
  ...(map ? { map } : {}),
});

const bindArea = (valuePath: string): Binding => ({
  adapter: CMMS.key,
  ref: { path: '/area/summary', valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
});

const STATE_TEXT = { values: { running: '정상', warning: '경고', stopped: '정지' }, otherwise: '알 수 없음' };

const site: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['name', 'state', 'stateText', 'orders'],
    properties: {
      name: { type: 'string' },
      state: { enum: ['running', 'warning', 'stopped', 'unknown'] },
      stateText: { type: 'string' },
      orders: { type: 'number', minimum: 0, description: 'Work orders open on the site.' },
    },
  },
  template: `<div class="s {{state}}" role="img" aria-label="{{name}} {{stateText}}, 작업 {{orders}}건">
  <i></i><b>{{name}}</b>
  <span>{{stateText}} · 작업 {{orders}}</span>
</div>`,
  style: `.s{box-sizing:border-box;height:100%;display:grid;grid-template-columns:auto 1fr;align-items:center;column-gap:6px;padding:4px 8px;
border:1px solid var(--u-widget-border);border-radius:6px;background:var(--u-widget-surface);
font-family:var(--u-widget-font-family);color:var(--u-widget-text);--c:var(--u-widget-text-secondary)}
i{width:9px;height:9px;border-radius:50%;background:var(--c);grid-row:1/3}
b{font-size:12px;font-weight:600}
span{font-size:11px;color:var(--u-widget-text-secondary)}
.warning{--c:var(--u-widget-warning)}
.stopped{--c:var(--u-widget-negative);border-color:var(--c);border-width:2px}
.warning span,.stopped span{color:var(--c);font-weight:600}`,
  size: { width: 140, height: 44 },
};

/** A district's health in words and colour: quiet at 85 and above, amber below, red below 70. */
const HEALTH_BAND = { ranges: [{ min: 85, value: 'ok' }, { min: 70, value: 'low' }], otherwise: 'poor' };

const region: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['name', 'health', 'band', 'overdue'],
    properties: {
      name: { type: 'string' },
      health: { type: 'number', minimum: 0, maximum: 100 },
      band: { enum: ['ok', 'low', 'poor'] },
      overdue: { type: 'number', minimum: 0, description: 'Inspections past their date.' },
    },
  },
  template: `<div class="r {{band}}" role="img" aria-label="{{name}} 건강도 {{health}}, 점검 지연 {{overdue}}건">
  <b>{{name}}</b>
  <span class="h">{{health | fixed:0}}<small> / 100</small></span>
  <span class="o">점검 지연 {{overdue}}건</span>
</div>`,
  style: `.r{box-sizing:border-box;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;
border:2px solid var(--c);border-radius:8px;background:color-mix(in srgb, var(--c) 14%, var(--u-widget-surface));
font-family:var(--u-widget-font-family);color:var(--u-widget-text);--c:var(--u-widget-border)}
b{font-size:13px;font-weight:600;color:var(--u-widget-text-secondary)}
.h{font-size:24px;font-weight:600;font-variant-numeric:tabular-nums}
.h small{font-size:12px;font-weight:500;color:var(--u-widget-text-secondary)}
.o{font-size:11px;color:var(--u-widget-text-secondary)}
.low{--c:var(--u-widget-warning)}
.poor{--c:var(--u-widget-negative)}
.low .h,.poor .h{color:var(--c)}`,
  size: { width: 150, height: 86 },
};

/** The four districts on the sketch map: each an outline, its badge, and its sites. */
const REGIONS = [
  { id: 'north', name: '북부 권역', outline: '60,100 520,100 560,300 300,330 60,280', badge: { x: 90, y: 120 } },
  { id: 'east', name: '동부 권역', outline: '520,100 920,100 920,420 600,440 560,300', badge: { x: 750, y: 120 } },
  { id: 'west', name: '서부 권역', outline: '60,280 300,330 360,560 60,620', badge: { x: 80, y: 400 } },
  { id: 'south', name: '남부 권역', outline: '300,330 560,300 600,440 920,420 920,760 60,760 60,620 360,560', badge: { x: 470, y: 640 } },
];

const SITES = [
  { id: 'N-01', name: '북부 가압장', x: 160, y: 230 },
  { id: 'N-02', name: '산정 배수지', x: 330, y: 150 },
  { id: 'N-03', name: '하천 가압장', x: 380, y: 250 },
  { id: 'E-01', name: '동부 가압장', x: 610, y: 210 },
  { id: 'E-02', name: '고지 배수지', x: 760, y: 250 },
  { id: 'E-03', name: '산업단지 가압장', x: 690, y: 340 },
  { id: 'W-01', name: '서부 가압장', x: 110, y: 340 },
  { id: 'W-02', name: '해안 배수지', x: 200, y: 500 },
  { id: 'S-01', name: '남부 가압장', x: 300, y: 600 },
  { id: 'S-02', name: '신도시 배수지', x: 660, y: 520 },
  { id: 'S-03', name: '남부 2 가압장', x: 740, y: 640 },
  { id: 'S-04', name: '하류 가압장', x: 150, y: 690 },
];

const siteNode = ({ id, name, x, y }: (typeof SITES)[number]): Node => ({
  id: `site-${id}`,
  x,
  y,
  width: 140,
  height: 44,
  anchored: true,
  widget: {
    type: 'element:site',
    props: { name, state: 'unknown', stateText: '—', orders: 0 },
    bindings: {
      state: bindItem('/area/sites', id, 'state'),
      stateText: bindItem('/area/sites', id, 'state', STATE_TEXT),
      orders: bindItem('/area/sites', id, 'openOrders'),
    },
  },
});

const regionNode = ({ id, name, badge }: (typeof REGIONS)[number]): Node => ({
  id: `region-${id}`,
  x: badge.x,
  y: badge.y,
  width: 150,
  height: 86,
  anchored: true,
  widget: {
    type: 'element:region',
    props: { name, health: 0, band: 'ok', overdue: 0 },
    bindings: {
      health: bindItem('/area/regions', id, 'health'),
      band: bindItem('/area/regions', id, 'health', HEALTH_BAND),
      overdue: bindItem('/area/regions', id, 'overdueInspections'),
    },
  },
});

const SIDE_X = 980;
const SIDE: Node[] = [
  {
    id: 'availability',
    x: SIDE_X,
    y: 100,
    width: 270,
    height: 150,
    anchored: false,
    widget: {
      type: 'gauge',
      props: { data: { value: 0 }, options: { min: 0, max: 100, unit: '%', subtitle: '설비 가동률', thresholds: [{ to: 90, color: 'red' }, { to: 97, color: 'yellow' }, { to: 100, color: 'green' }] } },
      bindings: { 'data.value': bindArea('/availabilityPct') },
    },
  },
  {
    id: 'open-orders',
    x: SIDE_X,
    y: 266,
    width: 130,
    height: 76,
    anchored: false,
    widget: { type: 'metric', props: { data: { label: '열린 작업', value: 0, unit: '건' } }, bindings: { 'data.value': bindArea('/openOrders') } },
  },
  {
    id: 'overdue',
    x: SIDE_X + 140,
    y: 266,
    width: 130,
    height: 76,
    anchored: false,
    widget: { type: 'metric', props: { data: { label: '점검 지연', value: 0, unit: '건' } }, bindings: { 'data.value': bindArea('/overdueInspections') } },
  },
  {
    id: 'orders-by-region',
    x: SIDE_X,
    y: 360,
    width: 270,
    height: 300,
    anchored: false,
    widget: {
      type: 'chart.bar',
      props: {
        title: '권역별 열린 작업 (건)',
        data: [],
        mapping: { x: 'region', y: ['corrective', 'preventive'] },
        options: { stack: true, series: [{ label: '고장 수리', color: '#c2410c' }, { label: '예방 정비', color: '#8a96a0' }] },
      },
      bindings: { data: { adapter: CMMS.key, ref: { path: '/area/orders-by-region', valuePath: '/value', observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS } } },
    },
  },
];

const DECORATIONS: Shape[] = [
  { id: 'title', type: 'text', x: 24, y: 22, text: '상수도 광역 설비 지도', fontSize: 24, fill: '#17252b' },
  { id: 'note', type: 'text', x: 24, y: 56, text: '가압장·배수지마다 상태와 열린 작업 · 권역마다 건강도(85 미만 주황, 70 미만 빨강) · 예시 데이터', fontSize: 13, fill: '#5b6b70' },
  { id: 'side-title', type: 'text', x: SIDE_X, y: 72, text: '사업소 전체', fontSize: 15, fill: '#22313b' },
];

/** The sketch map: the districts' outlines, the river and the main water line between the sites. */
function drawing(): string {
  const outlines = REGIONS.map(
    r => `<polygon points="${r.outline}" fill="#f3f6f4" stroke="#b9c6bf" stroke-width="2" stroke-linejoin="round"/>`,
  ).join('\n');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<rect width="${WIDTH}" height="${HEIGHT}" fill="#eef2f1"/>
${outlines}
<path d="M 60 470 C 220 430 300 470 420 430 S 640 360 760 440 S 880 520 920 500" fill="none" stroke="#a9c9de" stroke-width="10" stroke-linecap="round"/>
<text x="560" y="372" font-size="12" fill="#5d86a3" font-family="sans-serif">${escapeXml('본류')}</text>
<path d="M 230 252 L 400 172 L 450 272 L 680 232 L 830 272 M 450 272 L 760 362 M 180 362 L 270 522 L 370 622 L 730 542 L 810 662 M 270 522 L 220 712" fill="none" stroke="#9aa6ae" stroke-width="2" stroke-dasharray="6 4"/>
<rect x="${SIDE_X - 16}" y="60" width="${WIDTH - SIDE_X}" height="${HEIGHT - 80}" rx="8" fill="#ffffff" stroke="#d6dedb"/>
<text x="40" y="${HEIGHT - 12}" font-size="11" fill="#5b6b70" font-family="sans-serif">${escapeXml('약도 — 예시 급수 구역, 실제 지형·관로와 다름 · 점선은 송수관')}</text>
</svg>`;
  return svgDataUrl(svg);
}

const document: CanvasView = {
  kind: 'canvas',
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes: [...REGIONS.map(regionNode), ...SITES.map(siteNode), ...SIDE],
  connectors: [],
  decorations: DECORATIONS,
  elements: { site, region },
};

export const utilityRegions: SamplePack = {
  id: 'utility-regions',
  title: { ko: '상수도 광역 설비 지도', en: 'Water utility service area' },
  field: { ko: '상하수도·유틸리티', en: 'Water & utilities' },
  kind: { ko: '약도(지도)', en: 'Sketch map' },
  summary: {
    ko: '급수 구역 약도 위 네 권역마다 가압장·배수지의 상태와 열린 작업을 설비가 선 자리에, 권역마다 건강도(가동 중인 설비 비율에서 점검 지연을 뺀 값 — 85 미만 주황, 70 미만 빨강)를 권역 표지에, 옆에는 사업소 가동률과 작업. 예시 데이터입니다.',
    en: 'A water utility’s four districts on a sketch map: each booster station and reservoir with its state and open work orders where it stands, each district’s health (its share of sites running without an alarm, less overdue inspections — amber below 85, red below 70) on its badge, and the utility’s availability and work beside them. Example data.',
  },
  connectors: [CMMS],
  document,
  snapshot,
};
