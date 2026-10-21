import type { Binding, CanvasView, Connector, ElementDefinition, Node, Widget } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { svgDataUrl } from '../frame.js';
import { snapshot } from '../snapshots/island-ferry.js';

// A harbour's island ferry board drawn as a Bauhaus poster: the islands as plain geometric figures — a circle, a
// half-disc, a square, a triangle, a ring, a lozenge — in black and grey on cream, the mainland a black bar along the
// foot, the runs between the piers as straight bars. The three primaries are kept for one meaning each and paired with
// a shape, so the state reads without the colour: a blue circle sails, a yellow square is delayed, a red triangle is
// cancelled. On the right the sea's state, the next departures and the passengers boarded by the hour, in a geometric
// sans. The harbour and its islands are made up, so the values are example data written for them.

export const FERRY: ExampleSampleConnector = {
  key: 'ferry',
  name: '예시 여객선 운항 API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 항로가 아닙니다' },
};

/** The operator posts the runs every few minutes; a quarter of an hour without an answer is a source that has stopped. */
const MAX_AGE_SECONDS = 15 * 60;

const bind = (path: string, valuePath: string, map?: Binding['map']): Binding => ({
  adapter: FERRY.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
  ...(map ? { map } : {}),
});

const WIDTH = 1600;
const HEIGHT = 1000;
const PAPER = '#efe8d8';
const INK = '#161513';
const SOFT = '#6d675d';
const GREY = '#a39d92';
/** One meaning each: blue sails, yellow is delayed, red is cancelled. */
const BLUE = '#1d4fa0';
const YELLOW = '#e8a800';
const RED = '#d7261e';
const SANS = '"Futura", "Jost", "Century Gothic", "Noto Sans KR", "Malgun Gothic", sans-serif';

const STATUS_STROKE = { values: { ok: BLUE, delay: YELLOW, cancel: RED }, otherwise: SOFT };
const STATUS_DASH = { values: { cancel: 'dashed' }, otherwise: 'solid' };

/** The piers — where each island's ferries tie up, on the edge of its figure that faces its runs. */
const PIERS = {
  port: { x: 200, y: 888 },
  sol: { x: 352, y: 642 },
  sand: { x: 534, y: 764 },
  rock: { x: 752, y: 492 },
  light: { x: 358, y: 440 },
  gull: { x: 820, y: 312 },
  far: { x: 262, y: 236 },
} as const;
type PierId = keyof typeof PIERS;

/** Where each pier's card sits, clear of its island and the runs out of it. */
const CARD_AT: Record<PierId, [number, number]> = {
  port: [250, 902],
  sol: [30, 712],
  sand: [700, 780],
  rock: [902, 540],
  light: [530, 380],
  gull: [884, 212],
  far: [320, 118],
};

/** The runs, each between two piers. */
const ROUTES: { id: string; from: PierId; to: PierId }[] = [
  { id: 'port-sol', from: 'port', to: 'sol' },
  { id: 'port-sand', from: 'port', to: 'sand' },
  { id: 'port-rock', from: 'port', to: 'rock' },
  { id: 'sol-light', from: 'sol', to: 'light' },
  { id: 'rock-gull', from: 'rock', to: 'gull' },
  { id: 'light-far', from: 'light', to: 'far' },
];

// ── The drawing ─────────────────────────────────────────────────────────────────────────────────────────────────

function drawing(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<rect width="${WIDTH}" height="${HEIGHT}" fill="${PAPER}"/>
<circle cx="230" cy="170" r="160" fill="none" stroke="${INK}" stroke-width="2" stroke-dasharray="4 10"/>
<text x="40" y="52" fill="${INK}" font-size="22" font-weight="700" letter-spacing="6" font-family='${SANS}'>먼바다</text>
<path d="M 170 110 L 230 170 L 170 230 L 110 170 Z" transform="translate(60 0)" fill="${GREY}"/>
<path d="M 440 300 L 510 430 L 370 430 Z" fill="${GREY}"/>
<circle cx="270" cy="640" r="70" fill="${INK}"/>
<path d="M 540 760 A 80 80 0 0 1 700 760 Z" fill="${GREY}"/>
<rect x="760" y="500" width="130" height="130" fill="${INK}"/>
<circle cx="820" cy="250" r="40" fill="none" stroke="${INK}" stroke-width="10"/>
<rect x="0" y="900" width="1080" height="100" fill="${INK}"/>
<text x="40" y="962" fill="${PAPER}" font-size="22" font-weight="700" letter-spacing="6" font-family='${SANS}'>본토</text>
<path d="M 1010 60 L 1030 110 L 990 110 Z" fill="${INK}"/>
<text x="1002" y="140" fill="${INK}" font-size="18" font-weight="700" font-family='${SANS}'>N</text>
<rect x="1080" y="0" width="12" height="${HEIGHT}" fill="${INK}"/>
</svg>`;
  return svgDataUrl(svg);
}

// ── Elements ────────────────────────────────────────────────────────────────────────────────────────────────────

/** The three marks — the shape and colour of each state — as every element draws them. */
const MARKS = `.ok{--c:${BLUE}}.delay{--c:${YELLOW}}.cancel{--c:${RED}}
.mk{display:inline-block;flex:none;width:var(--m,16px);height:var(--m,16px);background:var(--c)}
.ok .mk,.mk.ok{border-radius:50%}
.cancel .mk,.mk.cancel{clip-path:polygon(50% 0,100% 100%,0 100%)}`;

/** The board's title, with the three marks as its key. */
const title: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['name'], properties: { name: { type: 'string' }, sub: { type: 'string' }, date: { type: 'string' }, time: { type: 'string' } } },
  template: `<header class="tt"><h1>{{name}}</h1><p>{{sub}} · {{date}} <b>{{time}}</b></p><ul><li class="ok"><i class="mk"></i>운항</li><li class="delay"><i class="mk"></i>지연</li><li class="cancel"><i class="mk"></i>결항</li></ul></header>`,
  style: `${MARKS}
.tt{height:100%;box-sizing:border-box;display:grid;align-content:center;gap:8px;padding:0 0 0 18px;border-left:12px solid ${INK};font-family:${SANS};color:${INK}}
h1{margin:0;font-size:44px;font-weight:800;letter-spacing:.02em;line-height:1.05}
p{margin:0;font-size:17px;color:${SOFT}}
b{color:${INK};font-size:22px}
ul{margin:4px 0 0;padding:0;list-style:none;display:flex;gap:22px;font-size:16px;font-weight:700}
li{display:flex;align-items:center;gap:8px;--m:20px}`,
  size: { width: 460, height: 160 },
};

/** A pier on the map: its state's mark. */
const pier: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['status'], properties: { status: { enum: ['ok', 'delay', 'cancel'] } } },
  template: `<i class="mk {{status}}"></i>`,
  style: `${MARKS}
.mk{--m:100%;display:block;outline:3px solid ${PAPER}}
.cancel{outline:0}`,
  size: { width: 24, height: 24 },
};

/** A pier's card: the island, its state, the next departure and the ship. */
const dock: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['name', 'status'],
    properties: { name: { type: 'string' }, status: { enum: ['ok', 'delay', 'cancel'] }, word: { type: 'string' }, next: { type: 'string' }, ship: { type: 'string' } },
  },
  template: `<section class="dk {{status}}"><header><i class="mk"></i><b>{{name}}</b><span>{{word}}</span></header><p>다음 <strong>{{next}}</strong></p><small>{{ship}}</small></section>`,
  style: `${MARKS}
.dk{height:100%;box-sizing:border-box;display:grid;align-content:center;gap:2px;padding:6px 10px;background:${PAPER};border:3px solid ${INK};font-family:${SANS};color:${INK}}
header{display:flex;align-items:center;gap:8px}
b{font-size:19px;font-weight:800}
span{margin-left:auto;font-size:13px;font-weight:800;padding:1px 6px;background:var(--c);color:#fff}
.delay span{color:${INK}}
p{margin:0;font-size:14px;color:${SOFT}}
strong{font-size:18px;color:${INK};font-variant-numeric:tabular-nums}
small{font-size:12px;color:${SOFT};white-space:nowrap;overflow:hidden;text-overflow:ellipsis}`,
  size: { width: 180, height: 96 },
};

/** The sea's state: wave height, wind and visibility, each with five steps of how rough, and the warning in force. */
const sea: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: {
      items: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, value: { type: 'string' }, unit: { type: 'string' }, level: { type: 'number' }, note: { type: 'string' } } } },
      warning: { type: 'string' },
    },
  },
  template: `<section class="se"><h3>해상 상태</h3><dl>{{#items}}<div><dt>{{label}}</dt><dd>{{value}}<small>{{unit}}</small></dd><u class="l{{level}}"><s></s><s></s><s></s><s></s><s></s></u><em>{{note}}</em></div>{{/items}}</dl>{{#warning}}<p>{{warning}}</p>{{/warning}}</section>`,
  style: `.se{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr auto;gap:6px;font-family:${SANS};color:${INK}}
h3{margin:0;font-size:18px;font-weight:800;letter-spacing:.08em}
dl{margin:0;display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
div{border-top:6px solid ${INK};padding-top:6px}
dt{font-size:14px;color:${SOFT}}
dd{margin:0;font-size:36px;font-weight:800;line-height:1.1;font-variant-numeric:tabular-nums}
dd small{font-size:15px;margin-left:3px}
u{display:grid;grid-template-columns:repeat(5,1fr);gap:3px;margin:4px 0}
s{height:8px;background:#d9d1bf}
.l1 s:nth-child(-n+1),.l2 s:nth-child(-n+2),.l3 s:nth-child(-n+3){background:${INK}}
.l4 s:nth-child(-n+4),.l5 s{background:${YELLOW}}
em{font-style:normal;font-size:12px;color:${SOFT}}
p{margin:0;padding:6px 10px;background:${INK};color:${YELLOW};font-size:15px;font-weight:700}`,
  size: { width: 460, height: 180 },
};

/** The next departures, each with its state's mark. */
const departures: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { time: { type: 'string' }, route: { type: 'string' }, ship: { type: 'string' }, word: { type: 'string' }, status: { enum: ['ok', 'delay', 'cancel'] } } } } },
  },
  template: `<section class="dp"><h3>출항 예정</h3><ol>{{#items}}<li class="{{status}}"><b>{{time}}</b><span>{{route}} <small>· {{ship}}</small></span><em><i class="mk"></i>{{word}}</em></li>{{/items}}</ol></section>`,
  style: `${MARKS}
.dp{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr;gap:6px;font-family:${SANS};color:${INK}}
h3{margin:0;font-size:18px;font-weight:800;letter-spacing:.08em;padding-bottom:6px;border-bottom:6px solid ${INK}}
ol{margin:0;padding:0;list-style:none;display:grid;align-content:start}
li{display:grid;grid-template-columns:64px 1fr auto;gap:10px;align-items:center;padding:7px 0;border-bottom:1px solid #cfc6b2;font-size:15px}
b{font-size:20px;font-weight:800;font-variant-numeric:tabular-nums}
span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
small{font-size:12px;color:${SOFT}}
em{font-style:normal;font-weight:800;font-size:14px;display:flex;align-items:center;gap:6px;--m:14px}
.cancel b{text-decoration:line-through;color:${SOFT}}`,
  size: { width: 460, height: 330 },
};

// ── The board ───────────────────────────────────────────────────────────────────────────────────────────────────

const node = (id: string, x: number, y: number, width: number, height: number, widget: Widget): Node => ({ id, x, y, width, height, anchored: false, widget });

const PIER_IDS = Object.keys(PIERS) as PierId[];

const route = ({ id, from, to }: (typeof ROUTES)[number]): Connector => ({
  id: `run-${id}`,
  fromNodeId: `pier-${from}`,
  toNodeId: `pier-${to}`,
  label: '{{value}}',
  labelSize: 14,
  style: { stroke: BLUE, strokeWidth: 6 },
  bindings: {
    label: bind('/ferry/routes', `/${id}/label`),
    'style.stroke': bind('/ferry/routes', `/${id}/status`, STATUS_STROKE),
    'style.dash': bind('/ferry/routes', `/${id}/status`, STATUS_DASH),
  },
});

const nodes: Node[] = [
  ...PIER_IDS.map(id =>
    node(`pier-${id}`, PIERS[id].x - 12, PIERS[id].y - 12, 24, 24, { type: 'element:pier', props: { status: 'ok' }, bindings: { status: bind('/ferry/piers', `/${id}/status`) } })
  ),
  ...PIER_IDS.map(id =>
    node(`dock-${id}`, CARD_AT[id][0], CARD_AT[id][1], 180, 96, {
      type: 'element:dock',
      props: { name: '', status: 'ok', word: '', next: '', ship: '' },
      bindings: {
        name: bind('/ferry/piers', `/${id}/name`),
        status: bind('/ferry/piers', `/${id}/status`),
        word: bind('/ferry/piers', `/${id}/word`),
        next: bind('/ferry/piers', `/${id}/next`),
        ship: bind('/ferry/piers', `/${id}/ship`),
      },
    })
  ),
  node('title', 1120, 24, 460, 160, {
    type: 'element:title',
    props: { name: '', sub: '', date: '', time: '' },
    bindings: { name: bind('/ferry/now', '/name'), sub: bind('/ferry/now', '/sub'), date: bind('/ferry/now', '/date'), time: bind('/ferry/now', '/time') },
  }),
  node('sea', 1120, 204, 460, 180, {
    type: 'element:sea',
    props: { items: [], warning: '' },
    bindings: { items: bind('/ferry/sea', '/value'), warning: bind('/ferry/sea', '/warning') },
  }),
  node('departures', 1120, 400, 460, 330, { type: 'element:departures', props: { items: [] }, bindings: { items: bind('/ferry/departures', '/value') } }),
  node('boarded', 1120, 748, 460, 232, {
    type: 'chart.bar',
    props: { title: '시간대별 승선(명)', data: [], mapping: { x: 'hour', y: 'people' }, options: { series: [{ label: '승선', color: INK }] } },
    bindings: { data: bind('/ferry/boarded', '/value') },
  }),
];

const document: CanvasView = {
  kind: 'canvas',
  appearance: 'light',
  accent: RED,
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes,
  connectors: ROUTES.map(route),
  elements: { title, pier, dock, sea, departures },
};

export const islandFerry: SamplePack = {
  id: 'island-ferry',
  title: { ko: '섬 여객선 운항 — 바우하우스 기하', en: 'Island ferries — a Bauhaus poster' },
  field: { ko: '해운·여객선', en: 'Shipping & ferries' },
  kind: { ko: '기하 도형으로 그린 섬 항로도', en: 'A route map of islands as geometric figures' },
  summary: {
    ko: '항구 여객선 터미널의 섬 항로 안내판을 바우하우스 포스터로 — 섬을 원·반원·정사각형·삼각형·고리·마름모로, 본토를 아래의 검은 띠로 그리고, 부두 사이 항로를 굵은 막대로. 세 원색은 뜻 하나씩에 모양과 짝지어 색 없이도 읽힘: 파란 원 운항, 노란 사각형 지연, 빨간 삼각형 결항(점선). 부두마다 카드(상태·다음 출항·배), 오른쪽에 해상 상태(파고·풍속·시정 다섯 단계와 풍랑주의보), 출항 예정, 시간대별 승선. 항구와 섬은 지어낸 것이라 예시 데이터입니다.',
    en: 'The island-ferry board at a harbour’s passenger terminal as a Bauhaus poster — the islands as a circle, a half-disc, a square, a triangle, a ring and a lozenge, the mainland a black bar along the foot, the runs between the piers as thick bars. Each of the three primaries keeps one meaning and a shape, so the state reads without the colour: a blue circle sails, a yellow square is delayed, a red triangle is cancelled (and dashed). A card on each pier (its state, the next departure, the ship), and on the right the sea’s state (wave height, wind and visibility in five steps, and the gale warning), the next departures and passengers boarded by the hour. The harbour and its islands are made up. Example data.',
  },
  connectors: [FERRY],
  document,
  snapshot,
};
