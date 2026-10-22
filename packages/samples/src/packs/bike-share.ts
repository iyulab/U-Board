import type { Binding, CanvasView, Connector, ElementDefinition, Node, Widget } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { svgDataUrl } from '../frame.js';
import { snapshot } from '../snapshots/bike-share.js';

// A city's bike-share stations drawn in the Isotype manner of the 1930s picture statistics: flat colour on cream,
// a plain map of the river, the parks and the main roads, and quantities shown by counting one pictogram. Each station
// is a card with a bike for every bike in its rack and an empty outline for every free dock — so a full rack and an
// empty one are seen at a glance before any number is read; a red tag and red bikes where riders will find none, a blue
// tag where they cannot return one, grey where docks are out for repair. Two trucks moving bikes from full racks to
// empty ones follow dashed lines. On the right the rentals by the hour, one bike for twenty, the last one cut where
// the count falls short, and the trucks' jobs. The city is made up, so the values are example data.

export const BIKES: ExampleSampleConnector = {
  key: 'bikes',
  name: '예시 공공자전거 API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 도시가 아닙니다' },
};

/** Docks report every minute; five minutes without an answer is a source that has stopped. */
const MAX_AGE_SECONDS = 5 * 60;

const bind = (path: string, valuePath: string): Binding => ({
  adapter: BIKES.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
});

const WIDTH = 1600;
const HEIGHT = 1000;
const CREAM = '#f3eee2';
const BLACK = '#1c1b19';
const RED = '#d23c2a';
const BLUE = '#2a5aa8';
const OCHRE = '#e3a72f';
const GREY = '#b5afa3';
const SANS = '"Jost", "Futura", "Century Gothic", "Noto Sans KR", "Malgun Gothic", sans-serif';

/** One bike, as Gerd Arntz might have cut it: two wheels, a frame, a saddle and a bar. */
function bike(colour: string, outline = false): string {
  const fill = outline ? 'none' : colour;
  return svgDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="16" viewBox="0 0 20 16">
<g fill="${fill}" stroke="${colour}" stroke-width="${outline ? 1.4 : 0}">
<circle cx="4.5" cy="11" r="${outline ? 3.6 : 4.2}"/><circle cx="15.5" cy="11" r="${outline ? 3.6 : 4.2}"/>
</g>
<path d="M 4.5 11 L 8 4.5 L 14 4.5 L 15.5 11 M 8 4.5 L 10 11 L 14 4.5 M 6.5 3 H 9.5 M 13 2.5 H 15.5" fill="none" stroke="${colour}" stroke-width="${outline ? 1.4 : 2}" stroke-linecap="round" ${outline ? '' : `stroke-opacity="1"`}/>
</svg>`);
}

const BIKE = bike(BLACK);
const BIKE_RED = bike(RED);
const BIKE_EMPTY = bike(GREY, true);

const CARD = { width: 224, height: 104 };
type StationId = 's1' | 's2' | 's3' | 's4' | 's5' | 's6' | 's7' | 's8' | 's9' | 's10';
const STATIONS: Record<StationId, [number, number]> = {
  s1: [70, 110],
  s2: [320, 80],
  s3: [580, 110],
  s4: [830, 150],
  s5: [100, 380],
  s6: [420, 350],
  s7: [780, 400],
  s8: [80, 700],
  s9: [420, 690],
  s10: [790, 730],
};
const TRUCKS: { id: 't1' | 't2'; from: StationId; to: StationId }[] = [
  { id: 't1', from: 's5', to: 's3' },
  { id: 't2', from: 's10', to: 's7' },
];

// ── The map ─────────────────────────────────────────────────────────────────────────────────────────────────────

function drawing(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<rect width="${WIDTH}" height="${HEIGHT}" fill="${CREAM}"/>
<rect x="40" y="40" width="1040" height="920" fill="#ebe4d3"/>
<rect x="40" y="250" width="300" height="100" fill="${OCHRE}" fill-opacity=".45"/>
<rect x="40" y="840" width="360" height="120" fill="${OCHRE}" fill-opacity=".45"/>
<path d="M 40 560 C 300 600, 600 540, 1080 600 L 1080 660 C 600 600, 300 660, 40 625 Z" fill="${BLUE}" fill-opacity=".85"/>
<path d="M 40 300 H 1080 M 40 520 H 1080 M 360 40 V 960 M 720 40 V 960" stroke="${BLACK}" stroke-width="6" stroke-opacity=".18"/>
<rect x="348" y="560" width="24" height="96" fill="${BLACK}"/><rect x="708" y="560" width="24" height="96" fill="${BLACK}"/>
<text x="1060" y="640" text-anchor="end" fill="${CREAM}" font-size="18" font-family='${SANS}' font-weight="600" letter-spacing=".2em">가람천</text>
<text x="56" y="335" fill="${BLACK}" font-size="15" font-family='${SANS}' letter-spacing=".15em">강변공원</text>
<text x="56" y="945" fill="${BLACK}" font-size="15" font-family='${SANS}' letter-spacing=".15em">체육공원</text>
<rect x="20" y="20" width="1080" height="960" fill="none" stroke="${BLACK}" stroke-width="3"/>
</svg>`;
  return svgDataUrl(svg);
}

// ── Elements ────────────────────────────────────────────────────────────────────────────────────────────────────

/** A station: its name, a bike for every bike in its rack and an outline for every free dock — read from `s`. */
const station: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['s'], properties: { s: { type: 'object' } } },
  template: `<section class="st {{s.state}}"><header><b>{{s.name}}</b><span>{{s.word}}</span></header><p><i class="bk" style="--n: {{s.bikes}}"></i><i class="em" style="--n: {{s.empty}}"></i></p><small><b>{{s.bikes}}</b>대 · 빈 거치대 {{s.empty}}</small></section>`,
  style: `.st{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr auto;gap:4px;padding:8px 12px;background:${CREAM};border-top:6px solid ${BLACK};font-family:${SANS};color:${BLACK}}
header{display:flex;justify-content:space-between;align-items:center;gap:6px}
b{font-size:16px;font-weight:700}
span{font-size:12px;font-weight:600;padding:1px 8px;color:${CREAM};background:${BLACK}}
p{margin:0;display:flex;align-items:center}
i{display:block;height:16px;width:calc(var(--n) * 20px);background-repeat:repeat-x;background-size:20px 16px}
.bk{background-image:url("${BIKE}")}
.em{background-image:url("${BIKE_EMPTY}")}
small{font-size:12px}
small b{font-size:14px}
.low{border-top-color:${RED}}
.low span{background:${RED}}
.low .bk{background-image:url("${BIKE_RED}")}
.full{border-top-color:${BLUE}}
.full span{background:${BLUE}}
.off{border-top-color:${GREY};background:repeating-linear-gradient(45deg,${CREAM} 0 8px,#e2dccd 8px 10px)}
.off span{background:${GREY};color:${BLACK}}`,
  size: CARD,
};

/** The title, set like a picture-statistics plate. */
const title: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['name'], properties: { name: { type: 'string' }, sub: { type: 'string' }, date: { type: 'string' }, time: { type: 'string' } } },
  template: `<header class="tt"><h1>{{name}}</h1><p>{{sub}}</p><div><span>{{date}}</span><b>{{time}}</b></div></header>`,
  style: `.tt{height:100%;box-sizing:border-box;display:grid;align-content:center;gap:6px;font-family:${SANS};color:${BLACK}}
h1{margin:0;font-size:32px;font-weight:700;letter-spacing:.02em}
p{margin:0;font-size:15px}
div{display:flex;align-items:center;gap:12px;padding-top:8px;border-top:4px solid ${BLACK}}
span{font-size:16px}
b{margin-left:auto;padding:0 10px;font-size:34px;font-weight:700;color:${CREAM};background:${RED}}`,
  size: { width: 460, height: 160 },
};

/** The rentals by the hour: one bike for twenty, the last cut where the count falls short. */
const hours: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { hour: { type: 'string' }, n: { type: 'number' }, count: { type: 'string' } } } } },
  },
  template: `<section class="hr"><h3>시간대별 대여 <small>기호 하나 = 20건</small></h3><ol>{{#items}}<li><b>{{hour}}</b><span><i style="--n: {{n}}"></i><small>{{count}}</small></span></li>{{/items}}</ol></section>`,
  style: `.hr{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr;gap:10px;font-family:${SANS};color:${BLACK}}
h3{margin:0;font-size:18px;font-weight:700;border-bottom:4px solid ${BLACK};padding-bottom:6px}
h3 small{font-size:13px;font-weight:500;margin-left:8px}
ol{margin:0;padding:0;list-style:none;display:grid;align-content:space-evenly}
li{display:grid;grid-template-columns:52px 1fr;align-items:center;gap:8px}
b{font-size:16px}
span{display:grid;gap:2px}
i{display:block;height:16px;width:calc(var(--n) * 22px);background:url("${BIKE}") repeat-x 0 0/22px 16px}
span small{font-size:12px}`,
  size: { width: 460, height: 290 },
};

/** The morning's figures. */
const figures: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, value: { type: 'string' }, note: { type: 'string' } } } } },
  },
  template: `<dl class="fg">{{#items}}<div><dt>{{label}}</dt><dd>{{value}}</dd><small>{{note}}</small></div>{{/items}}</dl>`,
  style: `.fg{margin:0;height:100%;box-sizing:border-box;display:grid;grid-template-columns:repeat(3,1fr);gap:10px;font-family:${SANS};color:${BLACK}}
div{display:grid;align-content:center;padding:6px 10px;border-left:6px solid ${BLACK};background:#ebe4d3}
dt{font-size:12px;font-weight:600}
dd{margin:0;font-size:30px;font-weight:700}
small{font-size:11px}`,
  size: { width: 460, height: 96 },
};

/** The trucks' jobs: from which full rack to which empty one, how many bikes, when. */
const jobs: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: {
      items: {
        type: 'array',
        items: { type: 'object', properties: { truck: { type: 'string' }, from: { type: 'string' }, to: { type: 'string' }, bikes: { type: 'string' }, eta: { type: 'string' } } },
      },
    },
  },
  template: `<section class="jb"><h3>재배치</h3><ul>{{#items}}<li><b>{{truck}}</b><span><em class="f">{{from}}</em> → <em class="t">{{to}}</em></span><small>{{bikes}} · {{eta}}</small></li>{{/items}}</ul></section>`,
  style: `.jb{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr;gap:8px;font-family:${SANS};color:${BLACK}}
h3{margin:0;font-size:18px;font-weight:700;border-bottom:4px solid ${BLACK};padding-bottom:6px}
ul{margin:0;padding:0;list-style:none;display:grid;align-content:start;gap:8px}
li{display:grid;grid-template-columns:64px 1fr;grid-template-rows:auto auto;column-gap:10px;align-items:center}
b{grid-row:span 2;font-size:15px;padding:6px 0;text-align:center;color:${CREAM};background:${BLACK}}
em{font-style:normal;font-weight:700;padding:0 6px}
.f{color:${CREAM};background:${BLUE}}
.t{color:${CREAM};background:${RED}}
small{font-size:12px}`,
  size: { width: 460, height: 150 },
};

/** The key: what a pictogram and each tag mean. */
const legend: ElementDefinition = {
  render: 'template',
  props: { type: 'object', properties: {} },
  template: `<ul class="lg"><li><i class="bk"></i>자전거 1대</li><li><i class="em"></i>빈 거치대</li><li><u class="r"></u>대여 어려움</li><li><u class="b"></u>반납 어려움</li></ul>`,
  style: `.lg{height:100%;box-sizing:border-box;margin:0;padding:0 10px;list-style:none;display:flex;align-items:center;gap:16px;font:600 13px ${SANS};color:${BLACK};background:${CREAM}}
li{display:flex;align-items:center;gap:6px}
i{width:20px;height:16px;background-size:20px 16px}
.bk{background-image:url("${BIKE}")}
.em{background-image:url("${BIKE_EMPTY}")}
u{width:18px;height:12px}
.r{background:${RED}}
.b{background:${BLUE}}`,
  size: { width: 470, height: 34 },
};

// ── The board ───────────────────────────────────────────────────────────────────────────────────────────────────

const node = (id: string, x: number, y: number, width: number, height: number, widget: Widget): Node => ({ id, x, y, width, height, anchored: false, widget });

const STATION_IDS = Object.keys(STATIONS) as StationId[];

const haul = ({ id, from, to }: (typeof TRUCKS)[number]): Connector => ({
  id: `truck-${id}`,
  fromNodeId: `station-${from}`,
  toNodeId: `station-${to}`,
  label: '{{value}}',
  labelSize: 13,
  style: { route: 'curved', stroke: BLACK, strokeWidth: 4, dash: 'dashed', arrow: 'end' },
  bindings: { label: bind('/bikes/trucks', `/value/${id}`) },
});

const nodes: Node[] = [
  ...STATION_IDS.map(id =>
    node(`station-${id}`, STATIONS[id][0], STATIONS[id][1], CARD.width, CARD.height, { type: 'element:station', props: { s: {} }, bindings: { s: bind('/bikes/stations', `/value/${id}`) } })
  ),
  node('legend', 560, 900, 470, 34, { type: 'element:legend', props: {} }),
  node('title', 1120, 30, 460, 160, {
    type: 'element:title',
    props: { name: '', sub: '', date: '', time: '' },
    bindings: { name: bind('/bikes/now', '/name'), sub: bind('/bikes/now', '/sub'), date: bind('/bikes/now', '/date'), time: bind('/bikes/now', '/time') },
  }),
  node('figures', 1120, 210, 460, 96, { type: 'element:figures', props: { items: [] }, bindings: { items: bind('/bikes/figures', '/value') } }),
  node('hours', 1120, 330, 460, 290, { type: 'element:hours', props: { items: [] }, bindings: { items: bind('/bikes/hours', '/value') } }),
  node('jobs', 1120, 650, 460, 150, { type: 'element:jobs', props: { items: [] }, bindings: { items: bind('/bikes/jobs', '/value') } }),
];

const document: CanvasView = {
  kind: 'canvas',
  appearance: 'light',
  accent: RED,
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes,
  connectors: TRUCKS.map(haul),
  elements: { station, title, hours, figures, jobs, legend },
};

export const bikeShare: SamplePack = {
  id: 'bike-share',
  title: { ko: '공공자전거 대여소 — 아이소타입', en: 'A city’s bike-share stations — Isotype' },
  field: { ko: '공공자전거·도시 교통', en: 'Bike share & city transport' },
  kind: { ko: '대여소별 자전거와 빈 거치대', en: 'Bikes and free docks at each station' },
  domain: 'transport',
  styles: ['print'],
  summary: {
    ko: '도시 공공자전거 대여소 현황을 1930년대 아이소타입 그림 통계로 — 크림 바탕의 평평한 색, 강·공원·큰길만 남긴 지도, 양은 같은 기호를 세어서. 대여소마다 거치된 자전거 한 대에 자전거 기호 하나, 빈 거치대마다 빈 윤곽 하나라 숫자를 읽기 전에 꽉 찬 곳과 빈 곳이 보입니다 — 빌릴 자전거가 없으면 빨간 꼬리표와 빨간 자전거, 반납할 칸이 없으면 파란 꼬리표, 거치대 점검은 회색. 꽉 찬 곳에서 빈 곳으로 자전거를 옮기는 트럭 둘은 점선으로. 오른쪽에 지금 달리는 자전거·오늘 대여·재배치, 시간대별 대여(기호 하나 = 20건, 모자란 끝은 기호를 잘라), 트럭 작업. 도시는 지어낸 것이라 예시 데이터입니다.',
    en: 'A city’s bike-share stations as 1930s Isotype picture statistics — flat colour on cream, a map kept to the river, the parks and the main roads, and quantities shown by counting one symbol. Each station shows a bike for every bike in its rack and an empty outline for every free dock, so full racks and empty ones are seen before any number is read: a red tag and red bikes where there is none to rent, a blue tag where there is no dock to return to, grey where docks are out for repair. Two trucks moving bikes from full racks to empty ones follow dashed lines. On the right the bikes out now, the day’s rentals and the trucks running, the rentals by the hour (one bike for twenty, the last one cut where the count falls short) and the trucks’ jobs. The city is made up. Example data.',
  },
  connectors: [BIKES],
  document,
  snapshot,
};
