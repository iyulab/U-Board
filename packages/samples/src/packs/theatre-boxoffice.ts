import type { Binding, CanvasView, ElementDefinition, Node, Widget } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { svgDataUrl } from '../frame.js';
import { snapshot } from '../snapshots/theatre-boxoffice.js';

// A theatre's box-office board for tonight's performance, drawn in Art Deco: black and gold, a sunburst in the stage,
// stepped corners, a display face set wide. The house is drawn as its seating plan — the stalls in two rings of three
// blocks fanning out from the stage, the balcony's three blocks behind them, two boxes on each side wall — and each block
// is a shape of its own on the board, filled by how much of it is sold: emerald with seats to spare, copper with a few
// left, crimson sold out. Gold is kept for the ornament. Beside the plan the evening's figures, the week's performances
// and the tickets sold for tonight over the last fortnight. The theatre is made up, so the values are example data.

export const THEATRE: ExampleSampleConnector = {
  key: 'theatre',
  name: '예시 공연장 예매 API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 공연장이 아닙니다' },
};

/** Sales post as they happen; a quarter of an hour without an answer is a source that has stopped. */
const MAX_AGE_SECONDS = 15 * 60;

const bind = (path: string, valuePath: string): Binding => ({
  adapter: THEATRE.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
});

const WIDTH = 1600;
const HEIGHT = 1000;
const NIGHT = '#0e0d0b';
const GOLD = '#c9a14a';
const CREAM = '#efe6d0';
const DIM = '#9b917c';
/** How much of a block is sold: seats to spare, a few left, sold out. Gold stays ornament. */
const OPEN = '#2e9c7c';
const FEW = '#d9814a';
const SOLD = '#a12a40';
const DISPLAY = '"Josefin Sans", "Futura", "Century Gothic", "Noto Sans KR", "Malgun Gothic", sans-serif';
const SERIF = '"Didot", "Bodoni 72", "Playfair Display", "Noto Serif KR", serif';

// ── The seating plan ────────────────────────────────────────────────────────────────────────────────────────────

/** The stage's front edge at the middle — the point the blocks fan out from. */
const CENTRE = { x: 560, y: 200 };

/** A block of seats: a ring between two radii and two angles (degrees, measured downward from the right), or a box. */
type Block = { id: string; name: string } & ({ r1: number; r2: number; a1: number; a2: number } | { box: [number, number, number, number] });

const BLOCKS: Block[] = [
  { id: 'a', name: 'A', r1: 190, r2: 310, a1: 104, a2: 128 },
  { id: 'b', name: 'B', r1: 190, r2: 310, a1: 78, a2: 102 },
  { id: 'c', name: 'C', r1: 190, r2: 310, a1: 52, a2: 76 },
  { id: 'd', name: 'D', r1: 320, r2: 440, a1: 104, a2: 128 },
  { id: 'e', name: 'E', r1: 320, r2: 440, a1: 78, a2: 102 },
  { id: 'f', name: 'F', r1: 320, r2: 440, a1: 52, a2: 76 },
  { id: 'g', name: '2층 G', r1: 480, r2: 590, a1: 106, a2: 132 },
  { id: 'h', name: '2층 H', r1: 480, r2: 590, a1: 76, a2: 104 },
  { id: 'i', name: '2층 I', r1: 480, r2: 590, a1: 48, a2: 74 },
  { id: 'box1', name: '박스 1', box: [86, 300, 84, 96] },
  { id: 'box2', name: '박스 2', box: [86, 410, 84, 96] },
  { id: 'box3', name: '박스 3', box: [950, 300, 84, 96] },
  { id: 'box4', name: '박스 4', box: [950, 410, 84, 96] },
];

const at = (r: number, deg: number) => ({ x: CENTRE.x + r * Math.cos((deg * Math.PI) / 180), y: CENTRE.y + r * Math.sin((deg * Math.PI) / 180) });
const round = (n: number) => Math.round(n * 10) / 10;

/** Where the house plan sits on the board: one element draws every block, so the blocks' outlines — fans whose boxes
 *  would overlap — are one node, reading each block's fill and seats left from one bound object. */
const HOUSE = { x: 80, y: 290, width: 960, height: 510 };

/** Each block's outline and label point, in the house element's own units. */
const SHAPES = BLOCKS.map(block => {
  const local = (p: { x: number; y: number }) => `${round(p.x - HOUSE.x)} ${round(p.y - HOUSE.y)}`;
  if ('box' in block) {
    const [x, y, w, h] = block.box;
    return { block, d: `M ${local({ x, y })} h ${w} v ${h} h ${-w} Z`, tx: round(x + w / 2 - HOUSE.x), ty: round(y + h / 2 - 6 - HOUSE.y) };
  }
  const { r1, r2, a1, a2 } = block;
  const d = `M ${local(at(r1, a1))} L ${local(at(r2, a1))} A ${r2} ${r2} 0 0 1 ${local(at(r2, a2))} L ${local(at(r1, a2))} A ${r1} ${r1} 0 0 0 ${local(at(r1, a1))} Z`;
  const mid = at((r1 + r2) / 2, (a1 + a2) / 2);
  return { block, d, tx: round(mid.x - HOUSE.x), ty: round(mid.y - 6 - HOUSE.y) };
});

function drawing(): string {
  const rays = Array.from({ length: 17 }, (_, i) => {
    const end = at(140, 190 + i * 10);
    return `<line x1="${CENTRE.x}" y1="${CENTRE.y}" x2="${round(end.x)}" y2="${round(end.y)}" stroke="${GOLD}" stroke-opacity=".45" stroke-width="2"/>`;
  }).join('');
  // A stepped corner, the motif of the period's doorways: three nested L-shapes.
  const corner = (x: number, y: number, sx: number, sy: number) =>
    [0, 10, 20].map(o => `<path d="M ${x + sx * o} ${y + sy * (60 - o)} V ${y + sy * o} H ${x + sx * (60 - o)}" fill="none" stroke="${GOLD}" stroke-width="2"/>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<rect width="${WIDTH}" height="${HEIGHT}" fill="${NIGHT}"/>
<rect x="20" y="20" width="1060" height="960" fill="none" stroke="${GOLD}" stroke-width="2"/>
<rect x="28" y="28" width="1044" height="944" fill="none" stroke="${GOLD}" stroke-opacity=".5" stroke-width="1"/>
${corner(40, 40, 1, 1)}${corner(1060, 40, -1, 1)}${corner(40, 960, 1, -1)}${corner(1060, 960, -1, -1)}
<path d="M ${CENTRE.x - 140} ${CENTRE.y} A 140 140 0 0 1 ${CENTRE.x + 140} ${CENTRE.y} Z" fill="#2b2416"/>
${rays}
<path d="M ${CENTRE.x - 140} ${CENTRE.y} A 140 140 0 0 1 ${CENTRE.x + 140} ${CENTRE.y} Z" fill="none" stroke="${GOLD}" stroke-width="3"/>
<line x1="${CENTRE.x - 200}" y1="${CENTRE.y}" x2="${CENTRE.x + 200}" y2="${CENTRE.y}" stroke="${GOLD}" stroke-width="4"/>
<text x="${CENTRE.x}" y="${CENTRE.y - 18}" fill="${CREAM}" font-size="20" font-weight="700" letter-spacing="10" text-anchor="middle" font-family='${DISPLAY}'>무대</text>
<text x="${CENTRE.x}" y="905" fill="${DIM}" font-size="16" letter-spacing="8" text-anchor="middle" font-family='${DISPLAY}'>로비 · 매표소</text>
<path d="M 470 880 L 560 850 L 650 880" fill="none" stroke="${GOLD}" stroke-width="2"/>
<path d="M 500 892 L 560 872 L 620 892" fill="none" stroke="${GOLD}" stroke-width="2"/>
<line x1="1100" y1="40" x2="1100" y2="960" stroke="${GOLD}" stroke-width="1"/>
</svg>`;
  return svgDataUrl(svg);
}

// ── Elements ────────────────────────────────────────────────────────────────────────────────────────────────────

const LEVELS = `.open{--c:${OPEN}}.few{--c:${FEW}}.sold{--c:${SOLD}}`;

/** The house plan: every block as its own shape, filled by how much of it is sold, with its name and the seats left —
 *  read from `zones`, the blocks' states by their ids. */
const house: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    properties: { zones: { type: 'object' } },
  },
  template: `<svg class="hs" viewBox="0 0 ${HOUSE.width} ${HOUSE.height}">${SHAPES.map(
    ({ block, d, tx, ty }) =>
      `<g class="{{zones.${block.id}.level}}"><path d="${d}"/><text x="${tx}" y="${ty}"><tspan class="n">${block.name}</tspan><tspan class="v" x="${tx}" dy="22">{{zones.${block.id}.left}}</tspan></text></g>`
  ).join('')}</svg>`,
  style: `${LEVELS}
.hs{display:block;width:100%;height:100%}
path{fill:var(--c);stroke:${GOLD};stroke-width:1.5}
text{fill:#fff;text-anchor:middle;font-family:${DISPLAY}}
.n{font-size:17px;font-weight:700;letter-spacing:.12em}
.v{font-size:14px;fill:rgba(255,255,255,.88)}`,
  size: { width: HOUSE.width, height: HOUSE.height },
};

/** The board's title: the theatre, tonight's work, the time — under a sunburst. */
const title: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['name'], properties: { name: { type: 'string' }, show: { type: 'string' }, date: { type: 'string' }, time: { type: 'string' } } },
  template: `<header class="tt"><svg viewBox="0 0 120 60" aria-hidden="true"><path d="M 0 60 A 60 60 0 0 1 120 60"/><path d="M 60 60 L 0 60 M 60 60 L 8 30 M 60 60 L 30 8 M 60 60 L 60 0 M 60 60 L 90 8 M 60 60 L 112 30 M 60 60 L 120 60"/></svg><h1>{{name}}</h1><p class="s">{{show}}</p><p>{{date}} · <b>{{time}}</b></p></header>`,
  style: `.tt{height:100%;box-sizing:border-box;display:grid;justify-items:center;align-content:center;gap:4px;text-align:center;color:${CREAM};font-family:${DISPLAY}}
svg{width:96px;height:48px;fill:none;stroke:${GOLD};stroke-width:2}
h1{margin:4px 0 0;font-family:${SERIF};font-size:44px;font-weight:700;letter-spacing:.18em;color:${GOLD}}
p{margin:0;font-size:16px;letter-spacing:.14em;color:${DIM}}
.s{font-size:20px;color:${CREAM}}
b{color:${CREAM};font-size:20px}`,
  size: { width: 460, height: 190 },
};

/** Tonight's figures between gold rules. */
const figures: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, value: { type: 'string' }, note: { type: 'string' } } } } },
  },
  template: `<dl class="fg">{{#items}}<div><dt>{{label}}</dt><dd>{{value}}</dd><small>{{note}}</small></div>{{/items}}</dl>`,
  style: `.fg{margin:0;height:100%;box-sizing:border-box;display:grid;grid-template-columns:repeat(3,1fr);border-top:1px solid ${GOLD};border-bottom:1px solid ${GOLD};font-family:${DISPLAY};color:${CREAM};text-align:center}
div{display:grid;align-content:center;padding:8px 6px;border-right:1px solid rgba(201,161,74,.35)}
div:last-child{border-right:0}
dt{font-size:13px;letter-spacing:.08em;color:${DIM}}
dd{margin:4px 0 2px;font-size:34px;font-weight:700;font-variant-numeric:tabular-nums}
small{font-size:12px;color:${DIM}}`,
  size: { width: 460, height: 120 },
};

/** The week's performances, each with how much of it is sold. */
const performances: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { day: { type: 'string' }, time: { type: 'string' }, note: { type: 'string' }, word: { type: 'string' }, level: { enum: ['open', 'few', 'sold'] } } } } },
  },
  template: `<section class="pf"><h3>이번 주 공연</h3><ol>{{#items}}<li class="{{level}}"><span>{{day}}</span><b>{{time}}</b><small>{{note}}</small><em>{{word}}</em></li>{{/items}}</ol></section>`,
  style: `${LEVELS}
.pf{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr;gap:8px;font-family:${DISPLAY};color:${CREAM}}
h3{margin:0;font-size:16px;font-weight:700;letter-spacing:.3em;color:${GOLD};text-align:center}
ol{margin:0;padding:0;list-style:none;display:grid;align-content:start}
li{display:grid;grid-template-columns:76px 60px 1fr 64px;gap:10px;align-items:center;padding:7px 0;border-bottom:1px solid rgba(201,161,74,.25);font-size:15px}
span{color:${DIM}}
b{font-size:18px;font-variant-numeric:tabular-nums}
small{font-size:13px;color:${DIM}}
em{font-style:normal;font-weight:700;text-align:center;padding:2px 0;background:var(--c);color:#fff}`,
  size: { width: 460, height: 300 },
};

/** The key to the blocks' fills. */
const legend: ElementDefinition = {
  render: 'template',
  props: { type: 'object', properties: {} },
  template: `<ul class="lg"><li><i style="background:${OPEN}"></i>여유</li><li><i style="background:${FEW}"></i>얼마 남지 않음</li><li><i style="background:${SOLD}"></i>매진</li></ul>`,
  style: `.lg{height:100%;box-sizing:border-box;margin:0;padding:0;list-style:none;display:flex;justify-content:center;align-items:center;gap:22px;font:600 15px ${DISPLAY};letter-spacing:.06em;color:${CREAM}}
li{display:flex;align-items:center;gap:8px}
i{width:18px;height:18px;border:1px solid ${GOLD}}`,
  size: { width: 460, height: 30 },
};

// ── The board ───────────────────────────────────────────────────────────────────────────────────────────────────

const node = (id: string, x: number, y: number, width: number, height: number, widget: Widget): Node => ({ id, x, y, width, height, anchored: false, widget });

const nodes: Node[] = [
  node('house', HOUSE.x, HOUSE.y, HOUSE.width, HOUSE.height, {
    type: 'element:house',
    props: { zones: {} },
    bindings: { zones: bind('/theatre/zones', '/value') },
  }),
  node('legend', 330, 930, 460, 30, { type: 'element:legend', props: {} }),
  node('title', 1120, 30, 460, 190, {
    type: 'element:title',
    props: { name: '', show: '', date: '', time: '' },
    bindings: { name: bind('/theatre/now', '/name'), show: bind('/theatre/now', '/show'), date: bind('/theatre/now', '/date'), time: bind('/theatre/now', '/time') },
  }),
  node('figures', 1120, 236, 460, 120, { type: 'element:figures', props: { items: [] }, bindings: { items: bind('/theatre/figures', '/value') } }),
  node('performances', 1120, 376, 460, 300, { type: 'element:performances', props: { items: [] }, bindings: { items: bind('/theatre/performances', '/value') } }),
  node('sales', 1120, 690, 460, 270, {
    type: 'chart.line',
    props: { title: '오늘 19:30 회차 — 누적 판매(석)', data: [], mapping: { x: 'day', y: 'sold' }, options: { series: [{ label: '누적 판매', color: GOLD }] } },
    bindings: { data: bind('/theatre/sales', '/value') },
  }),
];

const document: CanvasView = {
  kind: 'canvas',
  appearance: 'dark',
  accent: GOLD,
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes,
  connectors: [],
  elements: { house, title, figures, performances, legend },
};

export const theatreBoxoffice: SamplePack = {
  id: 'theatre-boxoffice',
  title: { ko: '공연장 예매 현황 — 아르데코', en: 'A theatre’s box office — in Art Deco' },
  field: { ko: '공연·예매', en: 'Performing arts & ticketing' },
  kind: { ko: '구역마다 칠한 객석 배치도', en: 'A seating plan, each block filled by its sales' },
  domain: 'leisure',
  styles: ['art'],
  summary: {
    ko: '극장 매표소의 오늘 저녁 공연 판매 현황을 아르데코로 — 검정과 금, 무대 안의 햇살 무늬, 계단식 모서리, 넓게 띄운 제목 글꼴. 객석 배치도(1층 두 겹 여섯 구역, 2층 세 구역, 양쪽 벽 박스석 넷)의 구역마다 제 모양의 면을 판매 정도로 칠함: 에메랄드 여유, 구리색 얼마 남지 않음, 진홍 매진 — 금색은 장식에만. 오른쪽에 오늘 판매·현장 대기·취소표 알림, 이번 주 공연별 판매, 오늘 회차의 2주 누적 판매. 극장은 지어낸 것이라 예시 데이터입니다.',
    en: 'A theatre’s box-office board for tonight’s performance in Art Deco — black and gold, a sunburst in the stage, stepped corners, a display face set wide. On the seating plan (the stalls’ six blocks in two rings, the balcony’s three, two boxes on each side wall) each block is a shape of its own, filled by how much of it is sold: emerald with seats to spare, copper with a few left, crimson sold out — gold is kept for the ornament. On the right tonight’s sales, the queue for returns and the waiting list, the week’s performances with how much of each is sold, and tonight’s tickets sold over the last fortnight. The theatre is made up. Example data.',
  },
  connectors: [THEATRE],
  document,
  snapshot,
};
