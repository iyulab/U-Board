import type { Binding, CanvasView, Connector, ElementDefinition, Node, Widget } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { svgDataUrl } from '../frame.js';
import { snapshot } from '../snapshots/drone-routes.js';

// An island group's drone deliveries drawn as a vintage airline route map: a pale sea with wave strokes, cream islands
// with hatched hills, a compass rose, and every route an arc from the base to a stop. A route carries its flight as an
// airline map carried its services — a solid red arc with the minutes to arrival while a drone is on it, a dashed navy
// arc with the departure time when one is due, a dotted orange arc when the wind holds it, a thin grey arc once the
// drop is made. Every stop is a luggage label with what it gets today and a stamp for its state. On the right the
// service's banner, the figures now, the key, the drones in the fleet and the drops through the day. The islands and
// the service are made up, so the values are example data.

export const FLEET: ExampleSampleConnector = {
  key: 'fleet',
  name: '예시 드론 배송 API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 섬·배송망이 아닙니다' },
};

/** Drones report their position every few seconds; two minutes of silence is a link that has dropped. */
const MAX_AGE_SECONDS = 2 * 60;

const bind = (path: string, valuePath: string, map?: Binding['map']): Binding => ({
  adapter: FLEET.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
  ...(map && { map }),
});

const WIDTH = 1600;
const HEIGHT = 1000;
const SEA = '#bfdcd6';
const SEA_LINE = '#9cc5bd';
const LAND = '#f3e4c0';
const HILL = '#c9a86a';
const NAVY = '#203a5c';
const RED = '#c8342b';
const ORANGE = '#e08a1e';
const GREY = '#8a8f93';
const CREAM = '#fbf3df';
const TEXT = '"Pretendard", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
const POSTER = '"Futura", "Century Gothic", "Malgun Gothic", sans-serif';

/** Where the stops are — each sits on its own island, drawn from the same place. */
const STOPS = [
  { id: 'light', x: 90, y: 190 },
  { id: 'north', x: 420, y: 150 },
  { id: 'salt', x: 770, y: 130 },
  { id: 'clinic', x: 790, y: 440 },
  { id: 'school', x: 690, y: 770 },
  { id: 'harbour', x: 370, y: 840 },
  { id: 'farm', x: 70, y: 690 },
] as const;

// ── The map ────────────────────────────────────────────────────────────────────────────────────────────────────

function drawing(): string {
  const waves: string[] = [];
  for (let y = 60; y < 980; y += 46) {
    for (let x = 40 + ((y / 46) % 2) * 40; x < 990; x += 90) waves.push(`<path d="M${x} ${y} q 8 -6 16 0 t 16 0" stroke="${SEA_LINE}" stroke-width="2" fill="none"/>`);
  }
  const island = (d: string) => `<path d="${d}" fill="${LAND}" stroke="${NAVY}" stroke-width="2"/>`;
  /** A small island under a stop's label, a little irregular. */
  const islet = (cx: number, cy: number, k: number) => {
    const rx = 118 + (k % 3) * 8;
    const ry = 74 + (k % 2) * 8;
    return island(`M${cx - rx} ${cy} C ${cx - rx} ${cy - ry * 0.9} ${cx - rx * 0.3} ${cy - ry} ${cx + rx * 0.2} ${cy - ry * 0.95} C ${cx + rx * 0.9} ${cy - ry * 0.8} ${cx + rx} ${cy - ry * 0.2} ${cx + rx * 0.95} ${cy + ry * 0.2} C ${cx + rx * 0.9} ${cy + ry} ${cx} ${cy + ry} ${cx - rx * 0.5} ${cy + ry * 0.9} C ${cx - rx * 0.95} ${cy + ry * 0.8} ${cx - rx} ${cy + ry * 0.4} ${cx - rx} ${cy} Z`);
  };
  const hills = (x: number, y: number) =>
    `<path d="M${x} ${y} l 14 -18 l 14 18 M${x + 18} ${y} l 12 -14 l 12 14" stroke="${HILL}" stroke-width="2" fill="none"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<rect width="${WIDTH}" height="${HEIGHT}" fill="${CREAM}"/>
<rect x="24" y="24" width="992" height="952" rx="10" fill="${SEA}"/>
${waves.join('')}
<path d="M24 300 H 1016 M24 640 H 1016 M360 24 V 976 M700 24 V 976" stroke="${NAVY}" stroke-width="1" stroke-dasharray="3 7" opacity=".35"/>
${island('M220 470 C 250 420 360 410 450 440 C 520 470 540 560 500 620 C 450 690 330 700 260 650 C 200 610 190 520 220 470 Z')}
${hills(300, 600)}${hills(410, 470)}
${STOPS.map(({ x, y }, k) => islet(x + 80, y + 42, k)).join('')}
<g transform="translate(930 880)"><circle r="44" fill="${CREAM}" stroke="${NAVY}" stroke-width="2"/><path d="M0 -40 L 8 0 L 0 40 L -8 0 Z" fill="${NAVY}"/><path d="M-40 0 L 0 -8 L 40 0 L 0 8 Z" fill="${NAVY}" opacity=".45"/><text y="-48" font-family="Century Gothic, Malgun Gothic, sans-serif" font-size="16" font-weight="700" fill="${NAVY}" text-anchor="middle">N</text></g>
<text x="60" y="80" font-family="Century Gothic, Malgun Gothic, sans-serif" font-size="30" font-weight="800" fill="${NAVY}" letter-spacing="6">물결 군도 · 항로도</text>
<text x="62" y="108" font-family="Malgun Gothic, sans-serif" font-size="15" fill="${NAVY}">드론 배송 — 본부 섬에서 일곱 곳으로</text>
<rect x="1040" y="650" width="532" height="306" rx="10" fill="#ffffff" stroke="${NAVY}" stroke-width="2"/>
</svg>`;
  return svgDataUrl(svg);
}

// ── Elements ───────────────────────────────────────────────────────────────────────────────────────────────────

/** A stop, as a luggage label — read from `s`. */
const stop: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['s'], properties: { s: { type: 'object' } } },
  template: `<article class="lb {{s.state}}"><header><b>{{s.name}}</b><i></i></header><p>{{s.cargo}}</p><small>{{s.word}}</small></article>`,
  style: `.lb{position:relative;height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr auto;gap:2px;padding:8px 12px 8px 22px;background:${CREAM};border:2px solid ${NAVY};border-radius:4px 22px 22px 4px;font-family:${TEXT};color:${NAVY}}
.lb::before{content:"";position:absolute;left:7px;top:50%;width:8px;height:8px;margin-top:-4px;border-radius:50%;border:2px solid ${NAVY};background:${SEA}}
header{display:flex;justify-content:space-between;align-items:center;gap:6px}
b{font:800 15px ${POSTER};white-space:nowrap}
i{display:grid;place-items:center;width:24px;height:24px;border-radius:50%;font:900 12px ${TEXT};font-style:normal;color:#fff;transform:rotate(-12deg)}
p{margin:0;font-size:13px;font-weight:700}
small{font-size:12px;font-weight:800}
.flying i{background:${RED}}
.flying i::before{content:"▶"}
.flying small{color:${RED}}
.due i{background:${NAVY}}
.due i::before{content:"◷"}
.hold i{background:${ORANGE}}
.hold i::before{content:"▲"}
.hold small{color:#9a5a00}
.done{opacity:.8}
.done i{background:${GREY}}
.done i::before{content:"✓"}
.done small{color:${GREY}}`,
  size: { width: 160, height: 84 },
};

/** The base, a bigger label. */
const base: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['b'], properties: { b: { type: 'object' } } },
  template: `<article class="bs"><small>BASE</small><b>{{b.name}}</b><p>{{b.word}}</p></article>`,
  style: `.bs{height:100%;box-sizing:border-box;display:grid;align-content:center;justify-items:center;gap:2px;background:${NAVY};border:3px double ${CREAM};border-radius:50%;font-family:${TEXT};color:${CREAM};text-align:center}
small{font:700 11px ${POSTER};letter-spacing:.3em}
b{font:800 17px ${POSTER}}
p{margin:0;font-size:12px}`,
  size: { width: 150, height: 96 },
};

/** The service's banner, as a poster headline. */
const banner: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['t'], properties: { t: { type: 'object' } } },
  template: `<header class="bn"><small>{{t.series}}</small><h1>{{t.name}}</h1><div><span>{{t.date}}</span><b>{{t.time}}</b></div></header>`,
  style: `.bn{height:100%;box-sizing:border-box;display:grid;align-content:center;gap:6px;padding:14px 24px;background:linear-gradient(160deg,${RED} 0 58%,${NAVY} 58%);border-radius:10px;font-family:${TEXT};color:${CREAM}}
small{font:700 13px ${POSTER};letter-spacing:.24em}
h1{margin:0;font:800 38px ${POSTER};letter-spacing:.04em}
div{display:flex;justify-content:space-between;align-items:baseline}
span{font-size:16px}
b{font:800 26px ${POSTER};background:${CREAM};color:${NAVY};padding:0 12px;border-radius:4px}`,
  size: { width: 532, height: 160 },
};

/** The figures now. */
const figures: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, value: { type: 'string' }, note: { type: 'string' } } } } },
  },
  template: `<dl class="fg">{{#items}}<div><dt>{{label}}</dt><dd>{{value}}</dd><small>{{note}}</small></div>{{/items}}</dl>`,
  style: `.fg{margin:0;height:100%;box-sizing:border-box;display:grid;grid-template-columns:repeat(3,1fr);gap:12px;font-family:${TEXT};color:${NAVY}}
div{display:grid;align-content:center;justify-items:center;text-align:center;background:#ffffff;border:2px solid ${NAVY};border-radius:8px}
dt{font-size:13px;font-weight:700}
dd{margin:0;font:800 30px ${POSTER};color:${RED}}
small{font-size:12px}`,
  size: { width: 532, height: 104 },
};

/** The key to the arcs. */
const legend: ElementDefinition = {
  render: 'template',
  props: { type: 'object', properties: {} },
  template: `<ul class="ky"><li><i class="fly"></i>비행 중</li><li><i class="due"></i>출발 예정</li><li><i class="hold"></i>바람 보류</li><li><i class="done"></i>배송 완료</li></ul>`,
  style: `.ky{height:100%;box-sizing:border-box;margin:0;padding:0 18px;list-style:none;display:flex;align-items:center;justify-content:space-between;background:#ffffff;border:2px solid ${NAVY};border-radius:999px;font:800 14px ${TEXT};color:${NAVY}}
li{display:flex;align-items:center;gap:8px}
i{display:inline-block;width:34px;height:0;border-top:4px solid}
.fly{border-color:${RED}}
.due{border-top-style:dashed;border-color:${NAVY}}
.hold{border-top-style:dotted;border-color:${ORANGE}}
.done{border-top-width:2px;border-color:${GREY}}`,
  size: { width: 532, height: 50 },
};

/** The drones in the fleet. */
const drones: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, job: { type: 'string' }, battery: { type: 'number' }, state: { type: 'string' } } } } },
  },
  template: `<section class="dr"><h2>기체 현황</h2><ol>{{#items}}<li class="{{state}}"><b>{{id}}</b><span>{{job}}</span><div class="bat" style="--v: {{battery}}"><i></i></div><small>{{battery}}%</small></li>{{/items}}</ol></section>`,
  style: `.dr{height:100%;box-sizing:border-box;padding:12px 18px;background:#ffffff;border:2px solid ${NAVY};border-radius:10px;font-family:${TEXT};color:${NAVY}}
h2{margin:0 0 6px;font:800 17px ${POSTER};letter-spacing:.1em}
ol{margin:0;padding:0;list-style:none;display:grid;gap:4px}
li{display:grid;grid-template-columns:54px 1fr 90px 42px;align-items:center;gap:10px;font-size:14px}
b{font:800 14px ${POSTER}}
.bat{height:10px;border:2px solid ${NAVY};border-radius:3px;position:relative}
.bat i{position:absolute;left:0;top:0;bottom:0;width:calc(var(--v) * 1%);background:${NAVY}}
small{text-align:right;font-weight:800}
.flying b{color:${RED}}
.charging .bat i{background:${ORANGE}}`,
  size: { width: 532, height: 196 },
};

// ── The board ──────────────────────────────────────────────────────────────────────────────────────────────────

const node = (id: string, x: number, y: number, width: number, height: number, widget: Widget): Node => ({ id, x, y, width, height, anchored: false, widget });


const ROUTE_COLOUR = { values: { flying: RED, due: NAVY, hold: ORANGE, done: GREY }, otherwise: NAVY };
const ROUTE_DASH = { values: { flying: 'solid', due: 'dashed', hold: 'dotted', done: 'solid' }, otherwise: 'solid' };
const ROUTE_WIDTH = { values: { flying: 4, due: 3, hold: 3, done: 1.5 }, otherwise: 2 };

/** An arc from the base to a stop, carrying its flight. */
const route = (id: string): Connector => ({
  id: `route-${id}`,
  fromNodeId: 'base',
  toNodeId: `stop-${id}`,
  label: '{{value}}',
  labelSize: 13,
  style: { stroke: NAVY, strokeWidth: 3, route: 'curved' },
  bindings: {
    label: bind('/fleet/stops', `/value/${id}/route`),
    'style.stroke': bind('/fleet/stops', `/value/${id}/state`, ROUTE_COLOUR),
    'style.dash': bind('/fleet/stops', `/value/${id}/state`, ROUTE_DASH),
    'style.strokeWidth': bind('/fleet/stops', `/value/${id}/state`, ROUTE_WIDTH),
  },
});

const nodes: Node[] = [
  node('base', 290, 500, 150, 96, { type: 'element:base', props: { b: {} }, bindings: { b: bind('/fleet/base', '/value') } }),
  ...STOPS.map(({ id, x, y }) => node(`stop-${id}`, x, y, 160, 84, { type: 'element:stop', props: { s: {} }, bindings: { s: bind('/fleet/stops', `/value/${id}`) } })),
  node('banner', 1040, 36, 532, 160, { type: 'element:banner', props: { t: {} }, bindings: { t: bind('/fleet/now', '/value') } }),
  node('figures', 1040, 210, 532, 104, { type: 'element:figures', props: { items: [] }, bindings: { items: bind('/fleet/figures', '/value') } }),
  node('legend', 1040, 328, 532, 50, { type: 'element:legend', props: {} }),
  node('drones', 1040, 392, 532, 240, { type: 'element:drones', props: { items: [] }, bindings: { items: bind('/fleet/drones', '/value') } }),
  node('drops', 1052, 662, 508, 284, {
    type: 'chart.bar',
    props: { title: '오늘 시간별 배송 (건)', data: [], mapping: { x: 'hour', y: 'drops' }, options: { series: [{ label: '배송', color: RED }] } },
    bindings: { data: bind('/fleet/drops', '/value') },
  }),
];

const document: CanvasView = {
  kind: 'canvas',
  appearance: 'light',
  accent: RED,
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes,
  connectors: STOPS.map(({ id }) => route(id)),
  elements: { stop, base, banner, figures, legend, drones },
};

export const droneRoutes: SamplePack = {
  id: 'drone-routes',
  title: { ko: '섬 드론 배송 — 옛 항공 노선도', en: 'Island drone deliveries — a vintage airline route map' },
  field: { ko: '드론 배송·물류', en: 'Drone delivery' },
  kind: { ko: '항로·배송지·기체 현황', en: 'Routes, stops and the fleet' },
  domain: 'logistics',
  styles: ['print'],
  summary: {
    ko: '섬 지역 드론 배송을 옛 항공 노선도 포스터로 — 물결 무늬의 옅은 바다, 빗금 언덕이 있는 크림색 섬, 나침도, 그리고 본부에서 배송지마다 그은 호. 호는 옛 노선도가 운항을 싣듯 비행을 싣는다: 드론이 떠 있으면 빨간 실선과 도착까지 분, 출발 예정이면 남색 파선과 출발 시각, 바람으로 보류되면 주황 점선, 배송이 끝나면 가는 회색 선. 배송지는 수하물 꼬리표 — 오늘 받는 것과 상태 도장. 오른쪽에 노선 포스터 머리, 지금 수치, 범례, 기체 현황(배터리), 시간별 배송. 섬과 배송망은 지어낸 것이라 예시 데이터입니다.',
    en: 'An island group’s drone deliveries drawn as a vintage airline route map — a pale sea with wave strokes, cream islands with hatched hills, a compass rose, and an arc from the base to every stop. An arc carries its flight as an old route map carried its services: a solid red arc with the minutes to arrival while a drone is on it, a dashed navy arc with the departure time when one is due, a dotted orange arc when the wind holds it, a thin grey arc once the drop is made. Every stop is a luggage label with what it gets today and a stamp for its state. On the right the service’s poster banner, the figures now, the key, the drones with their batteries and the drops through the day. The islands and the service are made up. Example data.',
  },
  connectors: [FLEET],
  document,
  snapshot,
};
