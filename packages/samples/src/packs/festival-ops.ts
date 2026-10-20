import type { Binding, CanvasView, ElementDefinition, Node, Widget } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { svgDataUrl } from '../frame.js';
import { snapshot } from '../snapshots/festival-ops.js';

// A festival's operations wall, the kind hung in a city's situation room for the night of a riverside fireworks show:
// a winged title bar across the top, three columns of bracketed panels, and in the middle the venue itself — the
// river, the lawns, the stages and the food street — each area glowing with how crowded it is, people per square
// metre. On the left the crowd now and through the evening, and who came; on the right the shuttles, what the safety
// staff are dealing with, and the weather the show depends on; under the map, each gate's flow. The big-screen style
// of a city's situation room: deep blue, neon edges, few words, very large numbers. No public source carries a
// festival's floor this way, so the values are example data written for the board.

export const FESTIVAL: ExampleSampleConnector = {
  key: 'festival',
  name: '예시 행사 운영 API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 행사가 아닙니다' },
};

/** Counted every minute; five minutes without a count is a source that has stopped. */
const MAX_AGE_SECONDS = 5 * 60;

const bind = (path: string, valuePath: string, map?: Binding['map']): Binding => ({
  adapter: FESTIVAL.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
  ...(map ? { map } : {}),
});

const bindZone = (id: string, field: string, map?: Binding['map']): Binding => ({
  adapter: FESTIVAL.key,
  ref: { path: '/festival/zones', item: { list: '/value', where: { id } }, valuePath: `/${field}`, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
  ...(map ? { map } : {}),
});

/** People per square metre: under 2 moves freely, 2–4 is crowded, 4 and more is the density crowd managers act at. */
const DENSITY = { ranges: [{ max: 2, value: 'free' }, { min: 2, max: 4, value: 'busy' }, { min: 4, value: 'packed' }] };

const WIDTH = 1920;
const HEIGHT = 1080;
const CYAN = '#22d3ee';
const MAGENTA = '#e879f9';
const AMBER = '#fbbf24';
const RED = '#fb7185';
const INK = '#e0f2fe';
const DIM = '#7dd3fc';
const FONT = 'var(--u-widget-font-family)';

const COLUMNS = { left: { x: 40, width: 480 }, middle: { x: 560, width: 800 }, right: { x: 1400, width: 480 } };

// ── The wall ────────────────────────────────────────────────────────────────────────────────────────────────────

/** A panel's frame: a thin box, brighter brackets at its corners, and its title on a tab — the big-screen look. */
function panel(x: number, y: number, width: number, height: number, title: string, colour = CYAN): string {
  const b = 18;
  const corners = [
    `M ${x} ${y + b} V ${y} H ${x + b}`,
    `M ${x + width - b} ${y} H ${x + width} V ${y + b}`,
    `M ${x + width} ${y + height - b} V ${y + height} H ${x + width - b}`,
    `M ${x + b} ${y + height} H ${x} V ${y + height - b}`,
  ];
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="url(#panel)" stroke="${colour}" stroke-opacity=".25"/>
${corners.map(d => `<path d="${d}" fill="none" stroke="${colour}" stroke-width="2.5" filter="url(#glow)"/>`).join('')}
<path d="M ${x + 14} ${y + 10} h 200 l 14 22 h -214 z" fill="${colour}" fill-opacity=".14"/>
<rect x="${x + 14}" y="${y + 14}" width="4" height="14" fill="${colour}"/>
<text x="${x + 26}" y="${y + 27}" fill="${INK}" font-size="16" font-weight="700" font-family="sans-serif">${title}</text>`;
}

/** The venue: a river along the bottom of the map, its bank, lawns and plazas, the paths between them, a grid of light. */
function venue(): string {
  const { x, width } = COLUMNS.middle;
  const y = 130;
  const height = 640;
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="url(#map)" stroke="${CYAN}" stroke-opacity=".35"/>
<g stroke="${CYAN}" stroke-opacity=".07">${Array.from({ length: 19 }, (_, i) => `<path d="M ${x + i * 44} ${y} V ${y + height}"/>`).join('')}${Array.from({ length: 15 }, (_, i) => `<path d="M ${x} ${y + i * 44} H ${x + width}"/>`).join('')}</g>
<path d="M ${x} ${y + 520} C ${x + 220} ${y + 470} ${x + 480} ${y + 600} ${x + width} ${y + 540} V ${y + height} H ${x} Z" fill="#0c4a6e" fill-opacity=".65"/>
<path d="M ${x} ${y + 520} C ${x + 220} ${y + 470} ${x + 480} ${y + 600} ${x + width} ${y + 540}" fill="none" stroke="${CYAN}" stroke-width="2" stroke-opacity=".8" filter="url(#glow)"/>
<text x="${x + 600}" y="${y + 612}" fill="${DIM}" fill-opacity=".6" font-size="15" font-family="sans-serif" letter-spacing="6">강 · RIVER</text>
${ZONES.map(z => `<polygon points="${z.shape}" fill="${z.tint}" fill-opacity=".10" stroke="${z.tint}" stroke-opacity=".75" stroke-width="1.5" filter="url(#glow)"/>`).join('')}
<path d="M ${x + 60} ${y + 300} H ${x + 740} M ${x + 400} ${y + 40} V ${y + 470}" stroke="${INK}" stroke-opacity=".18" stroke-width="6" stroke-linecap="round" stroke-dasharray="2 10"/>
<circle cx="${x + 640}" cy="${y + 470}" r="58" fill="none" stroke="${MAGENTA}" stroke-opacity=".5" stroke-dasharray="4 6"/>
<circle cx="${x + 640}" cy="${y + 470}" r="30" fill="none" stroke="${MAGENTA}" stroke-opacity=".7"/>
<text x="${x + 640}" y="${y + 476}" text-anchor="middle" fill="${MAGENTA}" font-size="13" font-family="sans-serif">발사 바지선</text>`;
}

interface Zone {
  id: string;
  name: string;
  shape: string;
  tint: string;
  /** Where its tag stands, on the map. */
  tag: { x: number; y: number };
}

const MX = COLUMNS.middle.x;
const MY = 130;
const ZONES: Zone[] = [
  { id: 'stage', name: '메인 무대', shape: `${MX + 40},${MY + 60} ${MX + 340},${MY + 60} ${MX + 340},${MY + 260} ${MX + 40},${MY + 260}`, tint: MAGENTA, tag: { x: MX + 70, y: MY + 110 } },
  { id: 'food', name: '먹거리 거리', shape: `${MX + 460},${MY + 60} ${MX + 760},${MY + 60} ${MX + 760},${MY + 260} ${MX + 460},${MY + 260}`, tint: AMBER, tag: { x: MX + 490, y: MY + 110 } },
  { id: 'lawn', name: '강변 잔디광장', shape: `${MX + 40},${MY + 330} ${MX + 340},${MY + 330} ${MX + 340},${MY + 470} ${MX + 40},${MY + 490}`, tint: CYAN, tag: { x: MX + 70, y: MY + 350 } },
  { id: 'deck', name: '불꽃 관람석', shape: `${MX + 460},${MY + 330} ${MX + 560},${MY + 330} ${MX + 560},${MY + 470} ${MX + 460},${MY + 480}`, tint: RED, tag: { x: MX + 400, y: MY + 360 } },
];
const TAG = { width: 230, height: 96 };

function drawing(): string {
  const title = `<path d="M 560 0 H 1360 L 1320 74 H 600 Z" fill="url(#title)"/>
<path d="M 40 52 H 520 L 560 0 M 1880 52 H 1400 L 1360 0" fill="none" stroke="${CYAN}" stroke-width="2" filter="url(#glow)"/>
<path d="M 600 74 H 1320" stroke="${CYAN}" stroke-width="2" filter="url(#glow)"/>
<path d="M 520 52 L 540 66 M 1400 52 L 1380 66" stroke="${CYAN}" stroke-opacity=".6"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<defs>
<radialGradient id="bg" cx="50%" cy="45%" r="75%"><stop offset="0" stop-color="#062a5c"/><stop offset="1" stop-color="#020a1c"/></radialGradient>
<linearGradient id="panel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b3a7a" stop-opacity=".45"/><stop offset="1" stop-color="#041634" stop-opacity=".25"/></linearGradient>
<linearGradient id="map" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05224d" stop-opacity=".75"/><stop offset="1" stop-color="#031226" stop-opacity=".9"/></linearGradient>
<linearGradient id="title" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0e7490" stop-opacity=".55"/><stop offset="1" stop-color="#0e7490" stop-opacity=".05"/></linearGradient>
<filter id="glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>
<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
${title}
${panel(COLUMNS.left.x, 100, COLUMNS.left.width, 250, '실시간 관람객')}
${panel(COLUMNS.left.x, 370, COLUMNS.left.width, 330, '시간대별 입장 · 퇴장')}
${panel(COLUMNS.left.x, 720, COLUMNS.left.width, 320, '관람객 구성', MAGENTA)}
${panel(COLUMNS.right.x, 100, COLUMNS.right.width, 360, '셔틀버스 운행')}
${panel(COLUMNS.right.x, 480, COLUMNS.right.width, 340, '안전 상황', RED)}
${panel(COLUMNS.right.x, 840, COLUMNS.right.width, 200, '기상 · 발사 조건', AMBER)}
${venue()}
${panel(COLUMNS.middle.x, 800, COLUMNS.middle.width, 240, '출입구별 통행')}
</svg>`;
  return svgDataUrl(svg);
}

// ── Elements ────────────────────────────────────────────────────────────────────────────────────────────────────

/** The title on the bar, and the evening it is. */
const masthead: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['title', 'time'], properties: { title: { type: 'string' }, time: { type: 'string' }, phase: { type: 'string' } } },
  template: `<header class="mast"><h1>{{title}}</h1><p><span>{{phase}}</span><b>{{time}}</b></p></header>`,
  style: `.mast{height:100%;box-sizing:border-box;display:grid;justify-items:center;align-content:center;gap:2px;font-family:${FONT};color:${INK}}
h1{margin:0;font-size:34px;font-weight:800;letter-spacing:.14em;text-shadow:0 0 18px ${CYAN},0 0 4px ${CYAN}}
p{margin:0;display:flex;gap:14px;font-size:14px;color:${DIM};letter-spacing:.08em}
b{color:${AMBER};font-variant-numeric:tabular-nums}`,
  size: { width: 720, height: 70 },
};

/** The crowd now: one very large number, against the venue's limit, and how many came all evening. */
const crowd: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['now', 'limit', 'share', 'total'],
    properties: { now: { type: 'number' }, limit: { type: 'number' }, share: { type: 'number', description: 'Percent of the limit.' }, total: { type: 'number' }, trend: { type: 'string' } },
  },
  template: `<section class="crowd" style="--s: {{share}}">
  <div class="big"><b>{{now | grouped:0}}</b><span>명</span></div>
  <div class="bar"><i></i></div>
  <dl><div><dt>수용 한도</dt><dd>{{limit | grouped:0}}명 · {{share | fixed:0}}%</dd></div><div><dt>누적 입장</dt><dd>{{total | grouped:0}}명</dd></div><div><dt>최근 10분</dt><dd>{{trend}}</dd></div></dl>
</section>`,
  style: `.crowd{height:100%;box-sizing:border-box;display:grid;align-content:center;gap:12px;font-family:${FONT};color:${INK}}
.big{display:flex;align-items:baseline;gap:8px}
.big b{font-size:64px;line-height:1;font-weight:800;font-variant-numeric:tabular-nums;color:#fff;text-shadow:0 0 22px ${CYAN}}
.big span{font-size:20px;color:${DIM}}
.bar{height:10px;border-radius:5px;background:rgba(125,211,252,.15);overflow:hidden}
.bar i{display:block;height:100%;width:calc(var(--s) * 1%);background:linear-gradient(90deg,${CYAN},${AMBER});box-shadow:0 0 12px ${CYAN}}
dl{margin:0;display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
dt{font-size:12px;color:${DIM}}
dd{margin:2px 0 0;font-size:16px;font-weight:700;font-variant-numeric:tabular-nums}`,
  size: { width: 440, height: 190 },
};

/** An area of the venue: its name, how dense the crowd is, how many are in it — the edge glows by the density. */
const zone: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['name', 'density', 'people', 'level'],
    properties: { name: { type: 'string' }, density: { type: 'number', description: 'People per square metre.' }, people: { type: 'number' }, level: { enum: ['free', 'busy', 'packed'] }, note: { type: 'string' } },
  },
  template: `<div class="zone {{level}}"><header><i></i>{{name}}</header><p><b>{{density | fixed:1}}</b><span>명/㎡</span><em>{{people | grouped:0}}명</em></p><small>{{note}}</small></div>`,
  style: `.zone{--c:#34d399;height:100%;box-sizing:border-box;display:grid;align-content:center;gap:2px;padding:8px 12px;border:1px solid var(--c);border-radius:4px;background:rgba(2,10,28,.78);box-shadow:0 0 18px color-mix(in srgb,var(--c) 45%,transparent),inset 0 0 12px color-mix(in srgb,var(--c) 18%,transparent);font-family:${FONT};color:${INK}}
.busy{--c:${AMBER}}.packed{--c:${RED};animation:pulse 1.6s ease-in-out infinite}
@keyframes pulse{50%{box-shadow:0 0 30px var(--c),inset 0 0 16px color-mix(in srgb,var(--c) 30%,transparent)}}
@media (prefers-reduced-motion: reduce){.packed{animation:none}}
header{display:flex;align-items:center;gap:6px;font-size:14px;font-weight:700}
header i{width:8px;height:8px;border-radius:50%;background:var(--c);box-shadow:0 0 8px var(--c)}
p{margin:0;display:flex;align-items:baseline;gap:5px}
b{font-size:30px;line-height:1.05;color:var(--c);font-variant-numeric:tabular-nums;text-shadow:0 0 10px var(--c)}
span{font-size:12px;color:${DIM}}
em{margin-left:auto;font-style:normal;font-size:14px;font-variant-numeric:tabular-nums}
small{font-size:12px;color:${DIM};white-space:nowrap;overflow:hidden;text-overflow:ellipsis}`,
  size: TAG,
};

/** Each gate's flow in and out the last ten minutes, against what it can pass. */
const gates: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['gates'],
    properties: {
      gates: {
        type: 'array',
        items: { type: 'object', properties: { name: { type: 'string' }, inbound: { type: 'number' }, outbound: { type: 'number' }, load: { type: 'number' }, level: { enum: ['free', 'busy', 'packed'] } } },
      },
    },
  },
  template: `<ul class="gates">{{#gates}}<li class="{{level}}" style="--l: {{load}}"><b>{{name}}</b><span class="meter"><i></i></span><em>{{load}}%</em><small>입장 {{inbound | grouped:0}} · 퇴장 {{outbound | grouped:0}}</small></li>{{/gates}}</ul>`,
  style: `.gates{height:100%;box-sizing:border-box;margin:0;padding:0;list-style:none;display:grid;grid-template-columns:repeat(3,1fr);gap:10px 18px;align-content:center;font-family:${FONT};color:${INK}}
li{--c:#34d399;display:grid;grid-template-columns:auto 1fr auto;grid-template-rows:auto auto;column-gap:10px;align-items:center}
.busy{--c:${AMBER}}.packed{--c:${RED}}
b{font-size:15px}
.meter{height:8px;border-radius:4px;background:rgba(125,211,252,.15);overflow:hidden}
.meter i{display:block;height:100%;width:calc(var(--l) * 1%);background:var(--c);box-shadow:0 0 10px var(--c)}
em{font-style:normal;font-size:15px;font-weight:700;color:var(--c);font-variant-numeric:tabular-nums}
small{grid-column:1/-1;font-size:12px;color:${DIM};font-variant-numeric:tabular-nums}`,
  size: { width: 760, height: 170 },
};

/** The shuttle routes: the next bus, how full the last one left, and the queue at its stop. */
const shuttles: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['routes'],
    properties: {
      routes: {
        type: 'array',
        items: { type: 'object', properties: { name: { type: 'string' }, next: { type: 'number' }, queue: { type: 'number' }, load: { type: 'number' }, level: { enum: ['free', 'busy', 'packed'] } } },
      },
    },
  },
  template: `<table class="routes"><thead><tr><th>노선</th><th>다음 차</th><th>대기</th><th>탑승률</th></tr></thead><tbody>{{#routes}}<tr class="{{level}}"><td>{{name}}</td><td><b>{{next}}</b>분</td><td>{{queue | grouped:0}}명</td><td><span style="--l: {{load}}"><i></i></span>{{load}}%</td></tr>{{/routes}}</tbody></table>`,
  style: `.routes{width:100%;height:100%;border-collapse:collapse;font-family:${FONT};color:${INK};font-size:15px}
th{text-align:left;font-size:12px;font-weight:600;color:${DIM};padding:0 6px 8px;border-bottom:1px solid rgba(34,211,238,.25)}
td{padding:9px 6px;border-bottom:1px solid rgba(34,211,238,.1);font-variant-numeric:tabular-nums;white-space:nowrap}
tr{--c:#34d399}.busy{--c:${AMBER}}.packed{--c:${RED}}
b{font-size:20px;color:var(--c);text-shadow:0 0 8px var(--c);margin-right:2px}
span{display:inline-block;width:70px;height:6px;margin-right:8px;border-radius:3px;background:rgba(125,211,252,.15);overflow:hidden;vertical-align:middle}
span i{display:block;height:100%;width:calc(var(--l) * 1%);background:var(--c)}`,
  size: { width: 440, height: 300 },
};

/** The safety desk's open cases, newest first, each with what it is and where. */
const incidents: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: {
      items: {
        type: 'array',
        items: { type: 'object', properties: { time: { type: 'string' }, kind: { type: 'string' }, place: { type: 'string' }, state: { type: 'string' }, level: { enum: ['info', 'warn', 'alert'] } } },
      },
    },
  },
  template: `<ul class="cases">{{#items}}<li class="{{level}}"><time>{{time}}</time><b>{{kind}}</b><span>{{place}}</span><em>{{state}}</em></li>{{/items}}</ul>`,
  style: `.cases{height:100%;box-sizing:border-box;margin:0;padding:0;list-style:none;display:grid;align-content:start;gap:8px;font-family:${FONT};color:${INK}}
li{--c:${CYAN};display:grid;grid-template-columns:52px 1fr auto;grid-template-rows:auto auto;column-gap:10px;padding:8px 10px;border-left:3px solid var(--c);background:color-mix(in srgb,var(--c) 9%,transparent)}
.warn{--c:${AMBER}}.alert{--c:${RED}}
time{grid-row:span 2;font-size:15px;font-weight:700;color:var(--c);font-variant-numeric:tabular-nums}
b{font-size:15px}
span{grid-column:2;font-size:12px;color:${DIM}}
em{grid-row:1/3;grid-column:3;align-self:center;font-style:normal;font-size:13px;font-weight:700;color:var(--c)}`,
  size: { width: 440, height: 280 },
};

/** The wind the show depends on, and whether the fireworks can go up. */
const weather: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['temp', 'wind', 'go'],
    properties: { temp: { type: 'number' }, wind: { type: 'number' }, gust: { type: 'number' }, humidity: { type: 'number' }, go: { type: 'string' }, launch: { type: 'string' } },
  },
  template: `<section class="wx"><dl><div><dt>기온</dt><dd>{{temp | fixed:1}}<small>°C</small></dd></div><div><dt>풍속</dt><dd>{{wind | fixed:1}}<small>m/s</small></dd></div><div><dt>순간 최대</dt><dd>{{gust | fixed:1}}<small>m/s</small></dd></div><div><dt>습도</dt><dd>{{humidity}}<small>%</small></dd></div></dl><p><b>{{go}}</b><span>{{launch}}</span></p></section>`,
  style: `.wx{height:100%;box-sizing:border-box;display:grid;align-content:center;gap:10px;font-family:${FONT};color:${INK}}
dl{margin:0;display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
dt{font-size:12px;color:${DIM}}
dd{margin:2px 0 0;font-size:22px;font-weight:700;font-variant-numeric:tabular-nums}
small{font-size:12px;color:${DIM};margin-left:1px}
p{margin:0;display:flex;align-items:center;gap:10px;font-size:13px;color:${DIM}}
b{padding:3px 12px;border:1px solid ${AMBER};border-radius:3px;color:${AMBER};font-size:14px;box-shadow:0 0 12px rgba(251,191,36,.35)}`,
  size: { width: 440, height: 130 },
};

// ── The board ───────────────────────────────────────────────────────────────────────────────────────────────────

const node = (id: string, x: number, y: number, width: number, height: number, widget: Widget, anchored = false): Node => ({ id, x, y, width, height, anchored, widget });

const zoneNode = ({ id, name, tag }: Zone): Node =>
  node(
    `zone-${id}`,
    tag.x,
    tag.y,
    TAG.width,
    TAG.height,
    {
      type: 'element:zone',
      props: { name, density: 0, people: 0, level: 'free', note: '' },
      bindings: { density: bindZone(id, 'density'), people: bindZone(id, 'people'), level: bindZone(id, 'density', DENSITY), note: bindZone(id, 'note') },
    },
    true
  );

const L = COLUMNS.left;
const R = COLUMNS.right;
const nodes: Node[] = [
  node('masthead', 600, 2, 720, 70, { type: 'element:masthead', props: { title: '', time: '', phase: '' }, bindings: { title: bind('/festival/now', '/title'), time: bind('/festival/now', '/time'), phase: bind('/festival/now', '/phase') } }),
  node('crowd', L.x + 20, 146, L.width - 40, 190, {
    type: 'element:crowd',
    props: { now: 0, limit: 0, share: 0, total: 0, trend: '' },
    bindings: { now: bind('/festival/now', '/crowd'), limit: bind('/festival/now', '/limit'), share: bind('/festival/now', '/share'), total: bind('/festival/now', '/total'), trend: bind('/festival/now', '/trend') },
  }),
  node('flow', L.x + 16, 414, L.width - 32, 272, {
    type: 'chart.area',
    props: {
      data: [],
      mapping: { x: 'time', y: ['inbound', 'outbound'] },
      options: { smooth: true, series: [{ label: '입장', color: CYAN }, { label: '퇴장', color: MAGENTA }] },
    },
    bindings: { data: bind('/festival/flow', '/value') },
  }),
  node('ages', L.x + 16, 764, L.width - 32, 262, {
    type: 'chart.pie',
    props: { data: [], mapping: { label: 'group', value: 'share' }, options: { donut: true, showLabel: false, legend: true, colors: [CYAN, MAGENTA, AMBER, '#34d399', '#818cf8'] } },
    bindings: { data: bind('/festival/visitors', '/value') },
  }),
  ...ZONES.map(zoneNode),
  node('gates', MX + 20, 850, 760, 170, { type: 'element:gates', props: { gates: [] }, bindings: { gates: bind('/festival/gates', '/value') } }),
  node('shuttles', R.x + 20, 146, R.width - 40, 300, { type: 'element:shuttles', props: { routes: [] }, bindings: { routes: bind('/festival/shuttles', '/value') } }),
  node('incidents', R.x + 20, 526, R.width - 40, 280, { type: 'element:incidents', props: { items: [] }, bindings: { items: bind('/festival/incidents', '/value') } }),
  node('weather', R.x + 20, 888, R.width - 40, 130, {
    type: 'element:weather',
    props: { temp: 0, wind: 0, gust: 0, humidity: 0, go: '', launch: '' },
    bindings: {
      temp: bind('/festival/weather', '/temp'),
      wind: bind('/festival/weather', '/wind'),
      gust: bind('/festival/weather', '/gust'),
      humidity: bind('/festival/weather', '/humidity'),
      go: bind('/festival/weather', '/go'),
      launch: bind('/festival/weather', '/launch'),
    },
  }),
];

const document: CanvasView = {
  kind: 'canvas',
  appearance: 'dark',
  accent: CYAN,
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes,
  connectors: [],
  elements: { masthead, crowd, zone, gates, shuttles, incidents, weather },
};

export const festivalOps: SamplePack = {
  id: 'festival-ops',
  title: { ko: '축제 종합 상황판 — 대형 상황판', en: 'Festival operations wall — a situation room screen' },
  field: { ko: '문화·관광 행사', en: 'Events & tourism' },
  kind: { ko: '행사장 약도(16:9 대형 상황판)', en: 'Venue map (a 16:9 situation room wall)' },
  summary: {
    ko: '불꽃축제 밤 시청 상황실에 거는 대형 화면 — 날개 달린 제목 띠, 모서리 꺾쇠 패널 세 단, 가운데 행사장 약도의 구역마다 ㎡당 인원으로 빛나는 태그. 왼쪽은 지금 관람객과 수용 한도·시간대별 입장·퇴장·관람객 구성, 오른쪽은 셔틀버스·안전 상황·발사 조건, 약도 아래는 출입구별 통행. 예시 데이터입니다.',
    en: 'The big screen a city’s situation room hangs for a fireworks night — a winged title bar, three columns of bracketed panels, and in the middle the venue map with each area’s tag glowing by people per square metre. On the left the crowd now against the limit, the evening’s flow in and out and who came; on the right the shuttles, the safety desk and the launch conditions; under the map each gate’s flow. Example data.',
  },
  connectors: [FESTIVAL],
  document,
  snapshot,
};
