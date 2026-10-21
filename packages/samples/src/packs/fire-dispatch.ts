import type { Binding, CanvasView, Connector, ElementDefinition, Node, Widget } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { svgDataUrl } from '../frame.js';
import { snapshot } from '../snapshots/fire-dispatch.js';

// A city's fire and rescue dispatch drawn in the manner of Russian Constructivist posters: red, black and cream only,
// a composition built on diagonals, heavy condensed type set at an angle, circles and bars cut from flat paper. The
// map is reduced to a red diagonal band (the river), black blocks and a few roads; each station is a black-headed card
// listing its vehicles, each vehicle's state told by a shape as well as a colour — a black square waiting in the
// station, a red triangle on its way, a red diamond at the scene, an outlined triangle pointing back on its way home.
// The calls in progress are red discs, and the vehicles heading to them follow lines labelled with their minutes. On
// the right the day's calls, the average arrival and the vehicles free, the calls in progress and the calls by two
// hours. The city is made up, so the values are example data.

export const FIRE: ExampleSampleConnector = {
  key: 'fire',
  name: '예시 119 상황 API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 도시가 아닙니다' },
};

/** Vehicles report their state every few seconds; two minutes of silence is a source that has stopped. */
const MAX_AGE_SECONDS = 2 * 60;

const bind = (path: string, valuePath: string): Binding => ({
  adapter: FIRE.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
});

const WIDTH = 1600;
const HEIGHT = 1000;
const CREAM = '#efe6d2';
const RED = '#d62718';
const BLACK = '#161414';
const GREY = '#8c857a';
const HEAVY = '"Bebas Neue", "Oswald", "Impact", "Noto Sans KR", "Malgun Gothic", sans-serif';
const SANS = '"Oswald", "Noto Sans KR", "Malgun Gothic", sans-serif';

const CARD = { width: 236, height: 136 };
type StationId = 'c1' | 'c2' | 'c3' | 'c4' | 'c5' | 'c6';
const STATIONS: Record<StationId, [number, number]> = {
  c1: [70, 100],
  c2: [420, 80],
  c3: [800, 110],
  c4: [80, 600],
  c5: [440, 680],
  c6: [800, 620],
};
type CallId = 'i1' | 'i2' | 'i3';
const CALLS: Record<CallId, [number, number]> = {
  i1: [520, 330],
  i2: [150, 340],
  i3: [860, 360],
};
const ROUTES: { id: string; from: StationId; to: CallId }[] = [
  { id: 'r1', from: 'c1', to: 'i1' },
  { id: 'r2', from: 'c2', to: 'i1' },
  { id: 'r3', from: 'c5', to: 'i1' },
  { id: 'r4', from: 'c1', to: 'i2' },
  { id: 'r5', from: 'c3', to: 'i3' },
];

// ── The poster ──────────────────────────────────────────────────────────────────────────────────────────────────

function drawing(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<rect width="${WIDTH}" height="${HEIGHT}" fill="${CREAM}"/>
<rect x="40" y="40" width="1040" height="920" fill="#e6dcc4"/>
<path d="M 40 640 L 1080 380 L 1080 470 L 40 730 Z" fill="${RED}" fill-opacity=".9"/>
<path d="M 40 300 L 1080 300 M 40 560 L 1080 560 M 380 40 L 380 960 M 760 40 L 760 960" stroke="${BLACK}" stroke-width="3" stroke-opacity=".25"/>
<rect x="300" y="250" width="60" height="40" fill="${BLACK}" fill-opacity=".14"/><rect x="720" y="520" width="90" height="30" fill="${BLACK}" fill-opacity=".14"/>
<rect x="60" y="860" width="140" height="70" fill="${BLACK}" fill-opacity=".14"/><rect x="980" y="880" width="80" height="60" fill="${BLACK}" fill-opacity=".14"/>
<circle cx="1000" cy="112" r="68" fill="none" stroke="${BLACK}" stroke-width="12"/>
<text x="790" y="528" text-anchor="middle" fill="${CREAM}" font-size="26" font-family='${HEAVY}' letter-spacing=".25em" transform="rotate(-14 790 528)">새벌강</text>
<text x="60" y="950" fill="${BLACK}" font-size="56" font-family='${HEAVY}' letter-spacing=".05em" transform="rotate(-6 60 950)" fill-opacity=".85">119</text>
<rect x="20" y="20" width="1080" height="960" fill="none" stroke="${BLACK}" stroke-width="4"/>
</svg>`;
  return svgDataUrl(svg);
}

// ── Elements ────────────────────────────────────────────────────────────────────────────────────────────────────

/** A safety centre: its name on a black head and each vehicle with the shape of its state — read from `c`. */
const station: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['c'], properties: { c: { type: 'object' } } },
  template: `<section class="sc"><h3>{{c.name}} 안전센터</h3><ul>{{#c.vehicles}}<li class="{{st}}"><i></i>{{n}}</li>{{/c.vehicles}}</ul></section>`,
  style: `.sc{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr;background:${CREAM};border:3px solid ${BLACK};font-family:${SANS};color:${BLACK}}
h3{margin:0;padding:6px 12px;font:24px ${HEAVY};letter-spacing:.06em;color:${CREAM};background:${BLACK}}
ul{margin:0;padding:8px 12px;list-style:none;display:grid;grid-template-columns:1fr 1fr;align-content:center;gap:6px 12px}
li{display:flex;align-items:center;gap:8px;font-size:15px;font-weight:600}
i{width:16px;height:16px;flex:none}
.standby i{background:${BLACK}}
.go i{width:0;height:0;border-left:16px solid ${RED};border-top:9px solid transparent;border-bottom:9px solid transparent}
.go{color:${RED}}
.scene i{width:13px;height:13px;margin:0 2px;background:${RED};transform:rotate(45deg)}
.scene{color:${RED}}
.back i{width:0;height:0;border-right:16px solid ${GREY};border-top:9px solid transparent;border-bottom:9px solid transparent}
.back{color:${GREY}}`,
  size: CARD,
};

/** A call in progress: a red disc with the kind of call, where, since when and how big. */
const call: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['i'], properties: { i: { type: 'object' } } },
  template: `<section class="cl"><b>{{i.kind}}</b><span>{{i.place}}</span><small>{{i.since}}</small><em>{{i.level}}</em></section>`,
  style: `.cl{height:100%;box-sizing:border-box;display:grid;place-content:center;justify-items:center;gap:2px;border-radius:50%;background:${RED};color:${CREAM};font-family:${SANS};box-shadow:8px 8px 0 ${BLACK}}
b{font:44px/1 ${HEAVY};letter-spacing:.08em}
span{font-size:15px;font-weight:700}
small{font-size:12px}
em{font-style:normal;font-size:12px;font-weight:700;padding:1px 8px;background:${BLACK}}`,
  size: { width: 160, height: 160 },
};

/** The poster's head: the name set big at an angle on a red bar. */
const title: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['name'], properties: { name: { type: 'string' }, sub: { type: 'string' }, date: { type: 'string' }, time: { type: 'string' } } },
  template: `<header class="tt"><h1>{{name}}</h1><p>{{sub}}</p><div><span>{{date}}</span><b>{{time}}</b></div></header>`,
  style: `.tt{height:100%;box-sizing:border-box;display:grid;align-content:center;gap:8px;font-family:${SANS};color:${BLACK}}
h1{margin:0;justify-self:start;padding:4px 16px;font:44px/1.05 ${HEAVY};letter-spacing:.04em;color:${CREAM};background:${RED};transform:rotate(-3deg);transform-origin:left}
p{margin:0;font-size:16px;font-weight:600}
div{display:flex;align-items:center;gap:12px;border-top:6px solid ${BLACK};padding-top:6px}
span{font-size:16px}
b{margin-left:auto;font:48px/1 ${HEAVY};color:${RED}}`,
  size: { width: 460, height: 180 },
};

/** The day's figures, each a black block. */
const figures: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, value: { type: 'string' }, note: { type: 'string' } } } } },
  },
  template: `<dl class="fg">{{#items}}<div><dt>{{label}}</dt><dd>{{value}}</dd><small>{{note}}</small></div>{{/items}}</dl>`,
  style: `.fg{margin:0;height:100%;box-sizing:border-box;display:grid;grid-template-columns:repeat(3,1fr);gap:8px;font-family:${SANS}}
div{display:grid;align-content:center;padding:6px 12px;background:${BLACK};color:${CREAM}}
dt{font-size:13px;font-weight:700}
dd{margin:0;font:40px/1.05 ${HEAVY};color:${CREAM}}
div:first-child dd{color:${RED}}
small{font-size:11px;color:#cfc6b4}`,
  size: { width: 460, height: 100 },
};

/** The calls in progress, as a list. */
const calls: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['i'], properties: { i: { type: 'object' } } },
  template: `<section class="ls"><h3>진행 중</h3><ol><li><b>{{i.i1.kind}}</b><span>{{i.i1.place}}</span><small>{{i.i1.since}} · {{i.i1.level}}</small></li><li><b>{{i.i2.kind}}</b><span>{{i.i2.place}}</span><small>{{i.i2.since}} · {{i.i2.level}}</small></li><li><b>{{i.i3.kind}}</b><span>{{i.i3.place}}</span><small>{{i.i3.since}} · {{i.i3.level}}</small></li></ol></section>`,
  style: `.ls{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr;gap:8px;font-family:${SANS};color:${BLACK}}
h3{margin:0;justify-self:start;padding:2px 14px;font:24px ${HEAVY};letter-spacing:.1em;color:${CREAM};background:${BLACK};transform:rotate(-2deg)}
ol{margin:0;padding:0;list-style:none;display:grid;align-content:space-evenly}
li{display:grid;grid-template-columns:64px 1fr;grid-template-rows:auto auto;column-gap:12px;padding:6px 0;border-bottom:3px solid ${BLACK}}
b{grid-row:span 2;align-self:center;font:30px ${HEAVY};color:${RED}}
span{font-size:17px;font-weight:700}
small{font-size:13px}`,
  size: { width: 460, height: 230 },
};

/** The key to the vehicle shapes. */
const legend: ElementDefinition = {
  render: 'template',
  props: { type: 'object', properties: {} },
  template: `<ul class="lg"><li class="standby"><i></i>대기</li><li class="go"><i></i>출동</li><li class="scene"><i></i>현장</li><li class="back"><i></i>복귀</li></ul>`,
  style: `.lg{height:100%;box-sizing:border-box;margin:0;padding:0 14px;list-style:none;display:flex;align-items:center;gap:20px;background:${CREAM};border:3px solid ${BLACK};font:700 15px ${SANS};color:${BLACK}}
li{display:flex;align-items:center;gap:8px}
i{width:14px;height:14px}
.standby i{background:${BLACK}}
.go i{width:0;height:0;border-left:14px solid ${RED};border-top:8px solid transparent;border-bottom:8px solid transparent}
.scene i{width:11px;height:11px;background:${RED};transform:rotate(45deg)}
.back i{width:0;height:0;border-right:14px solid ${GREY};border-top:8px solid transparent;border-bottom:8px solid transparent}`,
  size: { width: 360, height: 40 },
};

// ── The board ───────────────────────────────────────────────────────────────────────────────────────────────────

const node = (id: string, x: number, y: number, width: number, height: number, widget: Widget): Node => ({ id, x, y, width, height, anchored: false, widget });

const route = ({ id, from, to }: (typeof ROUTES)[number]): Connector => ({
  id: `route-${id}`,
  fromNodeId: `station-${from}`,
  toNodeId: `call-${to}`,
  label: '{{value}}',
  labelSize: 13,
  style: { stroke: BLACK, strokeWidth: 4, arrow: 'end' },
  bindings: { label: bind('/fire/routes', `/value/${id}`) },
});

const nodes: Node[] = [
  ...(Object.keys(STATIONS) as StationId[]).map(id =>
    node(`station-${id}`, STATIONS[id][0], STATIONS[id][1], CARD.width, CARD.height, { type: 'element:station', props: { c: {} }, bindings: { c: bind('/fire/stations', `/value/${id}`) } })
  ),
  ...(Object.keys(CALLS) as CallId[]).map(id =>
    node(`call-${id}`, CALLS[id][0], CALLS[id][1], 160, 160, { type: 'element:call', props: { i: {} }, bindings: { i: bind('/fire/calls', `/value/${id}`) } })
  ),
  node('legend', 680, 900, 360, 40, { type: 'element:legend', props: {} }),
  node('title', 1120, 30, 460, 180, {
    type: 'element:title',
    props: { name: '', sub: '', date: '', time: '' },
    bindings: { name: bind('/fire/now', '/name'), sub: bind('/fire/now', '/sub'), date: bind('/fire/now', '/date'), time: bind('/fire/now', '/time') },
  }),
  node('figures', 1120, 230, 460, 100, { type: 'element:figures', props: { items: [] }, bindings: { items: bind('/fire/figures', '/value') } }),
  node('calls', 1120, 350, 460, 230, { type: 'element:calls', props: { i: {} }, bindings: { i: bind('/fire/calls', '/value') } }),
  node('hours', 1120, 600, 460, 360, {
    type: 'chart.bar',
    props: { title: '두 시간마다 출동(건)', data: [], mapping: { x: 'hour', y: 'calls' }, options: { series: [{ label: '출동', color: RED }] } },
    bindings: { data: bind('/fire/hours', '/value') },
  }),
];

const document: CanvasView = {
  kind: 'canvas',
  appearance: 'light',
  accent: RED,
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes,
  connectors: ROUTES.map(route),
  elements: { station, call, title, figures, calls, legend },
};

export const fireDispatch: SamplePack = {
  id: 'fire-dispatch',
  title: { ko: '119 출동 상황판 — 구성주의 포스터', en: 'A fire and rescue dispatch board — a Constructivist poster' },
  field: { ko: '소방·119', en: 'Fire & rescue' },
  kind: { ko: '안전센터 차량과 진행 중 출동', en: 'Stations’ vehicles and the calls in progress' },
  summary: {
    ko: '도시의 119 출동 상황을 러시아 구성주의 포스터로 — 빨강·검정·크림 세 가지만, 사선 위에 세운 구도, 기울여 앉힌 굵은 글자, 평평한 종이를 오린 듯한 원과 띠. 지도는 붉은 사선 띠(강)와 검은 블록, 몇 줄의 길로만 남기고, 안전센터마다 검은 머리의 카드에 차량을 늘어놓아 상태를 색과 함께 도형으로: 검은 네모 대기, 빨간 삼각 출동, 빨간 마름모 현장, 회색 뒤집힌 삼각 복귀. 진행 중인 출동은 빨간 원, 그리로 가는 차량은 남은 분이 적힌 선으로. 오른쪽에 오늘 출동·평균 도착·대기 차량, 진행 중 목록, 두 시간마다 출동. 도시는 지어낸 것이라 예시 데이터입니다.',
    en: 'A city’s fire and rescue dispatch as a Russian Constructivist poster — red, black and cream only, a composition built on diagonals, heavy type set at an angle, circles and bars cut from flat paper. The map is kept to a red diagonal band (the river), black blocks and a few roads; each station is a black-headed card listing its vehicles, each state told by a shape as well as a colour: a black square waiting, a red triangle on its way, a red diamond at the scene, a grey triangle pointing back on its way home. The calls in progress are red discs, and the vehicles heading to them follow lines labelled with their minutes. On the right the day’s calls, the average arrival and the vehicles free, the calls in progress and the calls by two hours. The city is made up. Example data.',
  },
  connectors: [FIRE],
  document,
  snapshot,
};
