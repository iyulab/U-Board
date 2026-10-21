import type { Binding, CanvasView, ElementDefinition, Node, Widget } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { svgDataUrl } from '../frame.js';
import { snapshot } from '../snapshots/hotel-glass.js';

// A city hotel's day at a glance, the screen behind the front desk and in the general manager's office: how full the
// house is and what a night sells for, every room's state floor by floor, who arrives and leaves through the day, the
// housekeeping crews' progress, what guests have asked for, and where the day's revenue comes from. The glass style:
// a dusk gradient with soft lights behind it, every panel a frosted pane that blurs what is behind it, white type.
// No public source carries a hotel's rooms this way, so the values are example data written for the board.

export const HOTEL: ExampleSampleConnector = {
  key: 'hotel',
  name: '예시 호텔 운영 API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 호텔이 아닙니다' },
};

/** The property system answers every few minutes; half an hour without an answer is a source that has stopped. */
const MAX_AGE_SECONDS = 30 * 60;

const bind = (path: string, valuePath: string): Binding => ({
  adapter: HOTEL.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
});

const WIDTH = 1600;
const HEIGHT = 960;
const INK = '#ffffff';
const DIM = 'rgba(255,255,255,.72)';
const PINK = '#f9a8d4';
const SKY = '#7dd3fc';
const MINT = '#6ee7b7';
const AMBER = '#fcd34d';
const CORAL = '#fda4af';
const FONT = 'var(--u-widget-font-family)';

interface Pane {
  x: number;
  y: number;
  width: number;
  height: number;
  title?: string;
}

const KPI = { y: 128, width: 365, height: 150, gap: 20 };
const kpiPane = (i: number): Pane => ({ x: 40 + i * (KPI.width + KPI.gap), y: KPI.y, width: KPI.width, height: KPI.height });
const PANES = {
  mast: { x: 40, y: 28, width: 1520, height: 80 },
  rooms: { x: 40, y: 298, width: 750, height: 400, title: '객실 현황' },
  arrivals: { x: 810, y: 298, width: 750, height: 400, title: '시간대별 체크인 · 체크아웃' },
  crews: { x: 40, y: 718, width: 500, height: 214, title: '객실 정비' },
  requests: { x: 560, y: 718, width: 500, height: 214, title: '고객 요청' },
  revenue: { x: 1080, y: 718, width: 480, height: 214, title: '오늘 매출 구성' },
} satisfies Record<string, Pane>;

// ── The drawing ─────────────────────────────────────────────────────────────────────────────────────────────────

/** The lights behind the glass: soft coloured glows, and a few sharp rings and dots the frosted panes blur. */
function lights(): string {
  const glows = [
    { cx: 260, cy: 220, r: 260, c: '#60a5fa' },
    { cx: 1320, cy: 180, r: 300, c: '#f472b6' },
    { cx: 820, cy: 760, r: 320, c: '#fbbf24' },
    { cx: 120, cy: 860, r: 220, c: '#a78bfa' },
    { cx: 1500, cy: 820, r: 240, c: '#fb7185' },
  ];
  const rings = [
    { cx: 600, cy: 420, r: 140 },
    { cx: 1180, cy: 560, r: 90 },
    { cx: 300, cy: 700, r: 60 },
  ];
  const dots = Array.from({ length: 36 }, (_, i) => ({ cx: (i * 389) % WIDTH, cy: (i * 233 + 80) % HEIGHT, r: 2 + (i % 4) }));
  return `<g filter="url(#soft)">${glows.map(g => `<circle cx="${g.cx}" cy="${g.cy}" r="${g.r}" fill="${g.c}" fill-opacity=".55"/>`).join('')}</g>
${rings.map(r => `<circle cx="${r.cx}" cy="${r.cy}" r="${r.r}" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="3"/>`).join('')}
${dots.map(d => `<circle cx="${d.cx}" cy="${d.cy}" r="${d.r}" fill="#fff" fill-opacity=".55"/>`).join('')}`;
}

const panes = (): Pane[] => [PANES.mast, ...[0, 1, 2, 3].map(kpiPane), PANES.rooms, PANES.arrivals, PANES.crews, PANES.requests, PANES.revenue];

/** A frosted pane: the lights behind it blurred inside its rounded box, a milky fill, a bright edge, its title. */
function pane({ x, y, width, height, title }: Pane): string {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="22" fill="#fff" fill-opacity=".13" stroke="url(#edge)" stroke-width="1.5"/>
${title ? `<text x="${x + 26}" y="${y + 38}" fill="${INK}" font-size="17" font-weight="700" font-family="sans-serif">${title}</text>` : ''}`;
}

function drawing(): string {
  const all = panes();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<defs>
<linearGradient id="dusk" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#312e81"/><stop offset=".5" stop-color="#9d174d"/><stop offset="1" stop-color="#c2410c"/></linearGradient>
<linearGradient id="edge" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".7"/><stop offset=".5" stop-color="#fff" stop-opacity=".15"/><stop offset="1" stop-color="#fff" stop-opacity=".45"/></linearGradient>
<filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="70"/></filter>
<filter id="frost" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="16"/></filter>
<clipPath id="panes">${all.map(p => `<rect x="${p.x}" y="${p.y}" width="${p.width}" height="${p.height}" rx="22"/>`).join('')}</clipPath>
<g id="behind"><rect width="${WIDTH}" height="${HEIGHT}" fill="url(#dusk)"/>${lights()}</g>
</defs>
<use href="#behind"/>
<g clip-path="url(#panes)"><g filter="url(#frost)"><use href="#behind"/></g></g>
${all.map(pane).join('\n')}
</svg>`;
  return svgDataUrl(svg);
}

// ── Elements ────────────────────────────────────────────────────────────────────────────────────────────────────

/** The hotel's name, the day, the hour, and the weather guests will walk out into. */
const masthead: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['name', 'date', 'time'],
    properties: { name: { type: 'string' }, date: { type: 'string' }, time: { type: 'string' }, weather: { type: 'string' }, temp: { type: 'number' } },
  },
  template: `<header class="mast"><h1>{{name}}</h1><p>{{date}}</p><span class="wx">{{weather}} <b>{{temp | fixed:0}}°</b></span><time>{{time}}</time></header>`,
  style: `.mast{height:100%;box-sizing:border-box;display:flex;align-items:center;gap:22px;padding:0 10px;font-family:${FONT};color:${INK}}
h1{margin:0;font-size:28px;font-weight:800;letter-spacing:.02em}
p{margin:0;font-size:16px;color:${DIM}}
.wx{margin-left:auto;padding:6px 14px;border-radius:999px;background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.35);font-size:15px}
.wx b{font-variant-numeric:tabular-nums}
time{font-size:34px;font-weight:300;font-variant-numeric:tabular-nums;letter-spacing:.04em}`,
  size: { width: 1480, height: 64 },
};

/** One figure the day is run by: its name, the number, against yesterday, and what it is made of. */
const kpi: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['label', 'value', 'unit'],
    properties: { label: { type: 'string' }, value: { type: 'number' }, unit: { type: 'string' }, delta: { type: 'string' }, trend: { enum: ['up', 'down', 'flat'] }, note: { type: 'string' } },
  },
  template: `<section class="kpi {{trend}}"><h2>{{label}}</h2><p><b>{{value | grouped:0}}</b><span>{{unit}}</span><em>{{delta}}</em></p><small>{{note}}</small></section>`,
  style: `.kpi{--c:${MINT};height:100%;box-sizing:border-box;display:grid;align-content:center;gap:4px;font-family:${FONT};color:${INK}}
.down{--c:${CORAL}}.flat{--c:${DIM}}
h2{margin:0;font-size:15px;font-weight:600;color:${DIM}}
p{margin:0;display:flex;align-items:baseline;gap:6px}
b{font-size:44px;line-height:1.1;font-weight:700;font-variant-numeric:tabular-nums}
span{font-size:17px;color:${DIM}}
em{margin-left:auto;padding:2px 10px;border-radius:999px;background:color-mix(in srgb,var(--c) 22%,transparent);color:var(--c);font-style:normal;font-size:14px;font-weight:700;font-variant-numeric:tabular-nums}
small{font-size:13px;color:${DIM}}`,
  size: { width: 325, height: 120 },
};

/** Every room, floor by floor: a tile each, tinted by its state, with how many are in each state above. */
const rooms: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['rooms', 'counts'],
    properties: {
      rooms: {
        type: 'array',
        items: { type: 'object', properties: { no: { type: 'string' }, state: { enum: ['occupied', 'arriving', 'departing', 'vacant', 'dirty', 'blocked'] } } },
      },
      counts: {
        type: 'object',
        properties: { occupied: { type: 'number' }, arriving: { type: 'number' }, departing: { type: 'number' }, vacant: { type: 'number' }, dirty: { type: 'number' }, blocked: { type: 'number' } },
      },
    },
  },
  template: `<section class="house"><ul class="key"><li class="occupied">투숙 {{counts.occupied}}</li><li class="arriving">도착 예정 {{counts.arriving}}</li><li class="departing">퇴실 예정 {{counts.departing}}</li><li class="vacant">빈 방 {{counts.vacant}}</li><li class="dirty">정비 필요 {{counts.dirty}}</li><li class="blocked">점검 {{counts.blocked}}</li></ul><ol class="rooms">{{#rooms}}<li class="{{state}}">{{no}}</li>{{/rooms}}</ol></section>`,
  style: `.house{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr;gap:12px;font-family:${FONT};color:${INK}}
.key{margin:0;padding:0;list-style:none;display:flex;flex-wrap:wrap;gap:6px 16px;font-size:13px;color:${DIM};font-variant-numeric:tabular-nums}
.key li::before{content:'';display:inline-block;width:10px;height:10px;margin-right:6px;border-radius:3px;background:var(--c);vertical-align:-1px}
li{--c:rgba(255,255,255,.2)}
.occupied{--c:${SKY}}.arriving{--c:${MINT}}.departing{--c:${AMBER}}.vacant{--c:rgba(255,255,255,.28)}.dirty{--c:${CORAL}}.blocked{--c:#a8a29e}
.rooms{margin:0;padding:0;list-style:none;display:grid;grid-template-columns:repeat(16,1fr);grid-auto-rows:1fr;gap:4px}
.rooms li{display:grid;place-items:center;border-radius:5px;background:color-mix(in srgb,var(--c) 55%,transparent);border:1px solid color-mix(in srgb,var(--c) 85%,white);font-size:10px;font-variant-numeric:tabular-nums;color:#fff}
.rooms .vacant{background:rgba(255,255,255,.08);color:${DIM}}`,
  size: { width: 700, height: 330 },
};

/** The housekeeping crews: whose floors, rooms done of rooms to do. */
const crews: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['crews'],
    properties: {
      crews: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, floors: { type: 'string' }, done: { type: 'number' }, total: { type: 'number' }, share: { type: 'number' } } } },
    },
  },
  template: `<ul class="crews">{{#crews}}<li style="--s: {{share}}"><b>{{name}}</b><small>{{floors}}</small><span><i></i></span><em>{{done}}/{{total}}</em></li>{{/crews}}</ul>`,
  style: `.crews{height:100%;box-sizing:border-box;margin:0;padding:0;list-style:none;display:grid;align-content:center;gap:10px;font-family:${FONT};color:${INK}}
li{display:grid;grid-template-columns:64px 70px 1fr 54px;align-items:center;gap:10px}
b{font-size:15px}
small{font-size:13px;color:${DIM}}
span{height:8px;border-radius:4px;background:rgba(255,255,255,.18);overflow:hidden}
span i{display:block;height:100%;width:calc(var(--s) * 1%);border-radius:4px;background:linear-gradient(90deg,${SKY},${MINT})}
em{font-style:normal;font-size:14px;text-align:right;font-variant-numeric:tabular-nums}`,
  size: { width: 452, height: 150 },
};

/** What guests have asked for, newest first: the room, the request, and how far it has gone. */
const requests: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: {
      items: {
        type: 'array',
        items: { type: 'object', properties: { time: { type: 'string' }, room: { type: 'string' }, ask: { type: 'string' }, state: { type: 'string' }, level: { enum: ['done', 'doing', 'waiting'] } } },
      },
    },
  },
  template: `<ul class="asks">{{#items}}<li class="{{level}}"><time>{{time}}</time><b>{{room}}</b><span>{{ask}}</span><em>{{state}}</em></li>{{/items}}</ul>`,
  style: `.asks{height:100%;box-sizing:border-box;margin:0;padding:0;list-style:none;display:grid;align-content:center;gap:5px;font-family:${FONT};color:${INK}}
li{--c:${DIM};display:grid;grid-template-columns:46px 48px 1fr auto;align-items:center;gap:10px;padding:4px 10px;border-radius:10px;background:rgba(255,255,255,.1)}
.doing{--c:${AMBER}}.waiting{--c:${CORAL}}.done{--c:${MINT}}
time{font-size:13px;color:${DIM};font-variant-numeric:tabular-nums}
b{font-size:14px;font-variant-numeric:tabular-nums}
span{font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
em{font-style:normal;font-size:12px;font-weight:700;padding:2px 9px;border-radius:999px;color:var(--c);background:color-mix(in srgb,var(--c) 20%,transparent)}`,
  size: { width: 452, height: 150 },
};

// ── The board ───────────────────────────────────────────────────────────────────────────────────────────────────

const node = (id: string, x: number, y: number, width: number, height: number, widget: Widget): Node => ({ id, x, y, width, height, anchored: false, widget });

const KPIS = [
  { id: 'occupancy', label: '객실 점유율', unit: '%' },
  { id: 'adr', label: '평균 객실 단가(ADR)', unit: '원' },
  { id: 'revpar', label: '판매 가능 객실당 매출(RevPAR)', unit: '원' },
  { id: 'nps', label: '고객 추천 지수(NPS)', unit: '점' },
];

const kpiNode = ({ id, label, unit }: (typeof KPIS)[number], i: number): Node => {
  const { x, y } = kpiPane(i);
  return node(`kpi-${id}`, x + 20, y + 15, 325, 120, {
    type: 'element:kpi',
    props: { label, value: 0, unit, delta: '', trend: 'flat', note: '' },
    bindings: { value: bind('/hotel/kpi', `/${id}/value`), delta: bind('/hotel/kpi', `/${id}/delta`), trend: bind('/hotel/kpi', `/${id}/trend`), note: bind('/hotel/kpi', `/${id}/note`) },
  });
};

const inside = (pane: Pane, top = 54) => ({ x: pane.x + 24, y: pane.y + top, width: pane.width - 48, height: pane.height - top - 16 });

const R = inside(PANES.rooms);
const A = inside(PANES.arrivals);
const C = inside(PANES.crews);
const Q = inside(PANES.requests);
const V = inside(PANES.revenue);

const nodes: Node[] = [
  node('masthead', 60, 36, 1480, 64, {
    type: 'element:masthead',
    props: { name: '', date: '', time: '', weather: '', temp: 0 },
    bindings: { name: bind('/hotel/now', '/name'), date: bind('/hotel/now', '/date'), time: bind('/hotel/now', '/time'), weather: bind('/hotel/now', '/weather'), temp: bind('/hotel/now', '/temp') },
  }),
  ...KPIS.map(kpiNode),
  node('rooms', R.x, R.y, R.width, R.height, { type: 'element:rooms', props: { rooms: [], counts: {} }, bindings: { rooms: bind('/hotel/rooms', '/value'), counts: bind('/hotel/rooms', '/counts') } }),
  node('arrivals', A.x, A.y, A.width, A.height, {
    type: 'chart.area',
    props: {
      data: [],
      mapping: { x: 'hour', y: ['checkIn', 'checkOut'] },
      options: { smooth: true, series: [{ label: '체크인', color: MINT }, { label: '체크아웃', color: AMBER }] },
    },
    bindings: { data: bind('/hotel/arrivals', '/value') },
  }),
  node('crews', C.x, C.y, C.width, C.height, { type: 'element:crews', props: { crews: [] }, bindings: { crews: bind('/hotel/housekeeping', '/value') } }),
  node('requests', Q.x, Q.y, Q.width, Q.height, { type: 'element:requests', props: { items: [] }, bindings: { items: bind('/hotel/requests', '/value') } }),
  node('revenue', V.x, V.y, V.width, V.height, {
    type: 'chart.pie',
    props: { data: [], mapping: { label: 'source', value: 'amount' }, options: { donut: true, showLabel: false, legend: true, colors: [SKY, PINK, MINT, AMBER, '#c4b5fd'] } },
    bindings: { data: bind('/hotel/revenue', '/value') },
  }),
];

const document: CanvasView = {
  kind: 'canvas',
  appearance: 'dark',
  accent: PINK,
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes,
  connectors: [],
  elements: { masthead, kpi, rooms, crews, requests },
};

export const hotelGlass: SamplePack = {
  id: 'hotel-glass',
  title: { ko: '호텔 오늘의 운영 — 글래스', en: 'A hotel’s day — glass' },
  field: { ko: '숙박·관광', en: 'Hospitality' },
  kind: { ko: '패널 배치(글래스 화면)', en: 'Panel layout (a glass screen)' },
  summary: {
    ko: '프런트 뒤와 총지배인실에 거는 도심 호텔의 하루 — 노을빛 그라데이션 위에 뒤를 흐리게 비치는 반투명 유리 패널. 점유율·객실 단가·RevPAR·추천 지수, 층마다 객실 160개의 상태 타일, 시간대별 체크인·체크아웃, 객실 정비 조별 진행, 고객 요청, 매출 구성. 예시 데이터입니다.',
    en: 'A city hotel’s day on the screen behind the front desk and in the general manager’s office — frosted glass panes over a dusk gradient, blurring the lights behind them. Occupancy, average rate, RevPAR and the guest score; a tile for each of 160 rooms by its state, floor by floor; check-ins and check-outs through the day; the housekeeping crews’ progress; guest requests; where the revenue comes from. Example data.',
  },
  connectors: [HOTEL],
  document,
  snapshot,
};
