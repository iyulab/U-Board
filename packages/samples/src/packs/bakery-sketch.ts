import type { Binding, CanvasView, Connector, ElementDefinition, Node, Widget } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { svgDataUrl } from '../frame.js';
import { snapshot } from '../snapshots/bakery-sketch.js';

// A neighbourhood bakery's afternoon on the tablet by the kitchen door, drawn as if sketched in pencil in a notebook:
// the shop's plan in wobbly lines — the two deck ovens, the proofer, the mixer and the bench in the kitchen; the counter,
// the display case and the café tables in front — with each oven's and the proofer's card beside it, a dashed line
// from each oven to the case for the batch it is baking, the case's trays with what is left and what has sold out, and
// down the side the day's takings, the loaves sold by the hour and two sticky notes. Hand-drawn: pencil on squared
// paper, a yellow highlighter, red pen for what has run out. No public source carries a bakery's day this way, so the
// values are example data written for the board.

export const BAKERY: ExampleSampleConnector = {
  key: 'bakery',
  name: '예시 빵집 API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 가게가 아닙니다' },
};

/** The ovens and the till report every minute; a quarter of an hour without one is a source that has stopped. */
const MAX_AGE_SECONDS = 15 * 60;

const bind = (path: string, valuePath: string): Binding => ({
  adapter: BAKERY.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
});

const bindStation = (id: string, field: string): Binding => ({
  adapter: BAKERY.key,
  ref: { path: '/bakery/stations', item: { list: '/value', where: { id } }, valuePath: `/${field}`, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
});

const WIDTH = 1600;
const HEIGHT = 900;
const PAPER = '#fbf8f1';
const GRID = '#e6e0d2';
const PENCIL = '#2f2d2a';
const SOFT = '#7a756b';
const MARKER = '#ffe066';
const RED_PEN = '#d9480f';
const BLUE_PEN = '#1c64b8';
/** A hand that writes: the system's handwriting faces where there is one, the board's own face where not. */
const HAND = '"Segoe Print", "Bradley Hand", "Comic Sans MS", var(--u-widget-font-family), cursive';
/** A box's edge as a pencil draws it — a little uneven at every corner. */
const SKETCH_EDGE = 'border:2px solid #2f2d2a;border-radius:255px 14px 225px 14px / 14px 225px 14px 255px';

// ── The drawing ─────────────────────────────────────────────────────────────────────────────────────────────────

/** The same wobble every time it is drawn: a small generator seeded once. */
function wobble(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648 - 0.5;
  };
}
const jitter = wobble(43);

/** A line drawn by hand — twice, a little apart, the way a pencil goes over a line it is not sure of. */
function stroke(points: Array<[number, number]>, width = 2, colour = PENCIL): string {
  const pass = (amount: number) => {
    const out: string[] = [];
    for (let i = 0; i < points.length - 1; i++) {
      const [x1, y1] = points[i]!;
      const [x2, y2] = points[i + 1]!;
      const steps = Math.max(1, Math.round(Math.hypot(x2 - x1, y2 - y1) / 60));
      for (let k = i === 0 ? 0 : 1; k <= steps; k++) {
        const t = k / steps;
        out.push(`${(x1 + (x2 - x1) * t + jitter() * amount).toFixed(1)} ${(y1 + (y2 - y1) * t + jitter() * amount).toFixed(1)}`);
      }
    }
    return `<path d="M ${out.join(' L ')}" fill="none" stroke="${colour}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
  };
  return pass(3) + pass(4).replace(`stroke-width="${width}"`, `stroke-width="${width * 0.6}" opacity=".55"`);
}

const box = (x: number, y: number, w: number, h: number, width = 2) => stroke([[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]], width);

function circle(cx: number, cy: number, r: number): string {
  const points: Array<[number, number]> = [];
  for (let i = 0; i <= 18; i++) {
    const a = (i / 18) * Math.PI * 2 + 0.3;
    points.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return stroke(points, 1.6);
}

const label = (x: number, y: number, text: string, size = 15, fill = SOFT) =>
  `<text x="${x}" y="${y}" font-family='${HAND}' font-size="${size}" fill="${fill}">${text}</text>`;

/** The shop's plan, in the board's units: the kitchen on the left, the shop on the right. */
const PLAN = { x: 60, y: 120, width: 920, height: 740, wall: 520 };
const OVEN_A = { x: 100, y: 170, w: 170, h: 96 };
const OVEN_B = { x: 300, y: 170, w: 170, h: 96 };
const PROOFER = { x: 100, y: 360, w: 110, h: 150 };
const CASE = { x: 600, y: 300, w: 320, h: 90 };

function drawing(): string {
  const squares: string[] = [];
  for (let x = 20; x < WIDTH; x += 24) squares.push(`<path d="M ${x} 0 V ${HEIGHT}" stroke="${GRID}" stroke-width="1"/>`);
  for (let y = 20; y < HEIGHT; y += 24) squares.push(`<path d="M 0 ${y} H ${WIDTH}" stroke="${GRID}" stroke-width="1"/>`);
  const { x, y, width, height, wall } = PLAN;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<rect width="${WIDTH}" height="${HEIGHT}" fill="${PAPER}"/>
${squares.join('')}
<path d="M 1020 0 V ${HEIGHT}" stroke="#e8b4b4" stroke-width="1.5"/>
${stroke([[x, y + 380], [x, y], [x + width, y], [x + width, y + height], [x + width - 40, y + height]], 3.2)}
${stroke([[x + width - 130, y + height], [x, y + height], [x, y + 450]], 3.2)}
${stroke([[wall, y], [wall, 420]], 3)}${stroke([[wall, 510], [wall, y + height]], 3)}
${label(x + width - 122, y + height + 22, '입구 →', 15)}
${label(wall + 10, 470, '← 주방문', 14)}
${box(OVEN_A.x, OVEN_A.y, OVEN_A.w, OVEN_A.h)}${stroke([[OVEN_A.x + 12, OVEN_A.y + 32], [OVEN_A.x + OVEN_A.w - 12, OVEN_A.y + 32]], 1.4)}${stroke([[OVEN_A.x + 12, OVEN_A.y + 64], [OVEN_A.x + OVEN_A.w - 12, OVEN_A.y + 64]], 1.4)}
${box(OVEN_B.x, OVEN_B.y, OVEN_B.w, OVEN_B.h)}${stroke([[OVEN_B.x + 12, OVEN_B.y + 32], [OVEN_B.x + OVEN_B.w - 12, OVEN_B.y + 32]], 1.4)}${stroke([[OVEN_B.x + 12, OVEN_B.y + 64], [OVEN_B.x + OVEN_B.w - 12, OVEN_B.y + 64]], 1.4)}
${label(OVEN_A.x + 4, OVEN_A.y - 10, '데크 오븐 1')}${label(OVEN_B.x + 4, OVEN_B.y - 10, '데크 오븐 2')}
${box(PROOFER.x, PROOFER.y, PROOFER.w, PROOFER.h)}${label(PROOFER.x + 4, PROOFER.y - 10, '발효기')}
${circle(445, 410, 42)}${circle(445, 410, 14)}${label(418, 474, '반죽기')}
${box(250, 520, 230, 84)}${label(256, 622, '작업대 — 성형')}
${box(100, 640, 120, 64)}${circle(160, 672, 20)}${label(104, 724, '싱크')}
${box(300, 680, 170, 130)}${stroke([[385, 680], [385, 810]], 1.4)}${label(306, 830, '냉장고')}
${box(560, 160, 380, 70)}${label(566, 150, '카운터 · 계산대')}
${box(CASE.x, CASE.y, CASE.w, CASE.h)}${label(CASE.x + 4, CASE.y + CASE.h + 22, '진열대')}
${[ [640, 560], [780, 560], [920, 560], [640, 730], [780, 730] ].map(([cx, cy]) => circle(cx!, cy!, 38)).join('')}
${label(600, 806, '카페 자리 — 다섯 탁자')}
</svg>`;
  return svgDataUrl(svg);
}

// ── Elements ────────────────────────────────────────────────────────────────────────────────────────────────────

/** The shop's name, the day and the time, written across the top. */
const head: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['name'], properties: { name: { type: 'string' }, date: { type: 'string' }, time: { type: 'string' }, weather: { type: 'string' } } },
  template: `<header class="hd"><h1>{{name}}</h1><span>{{date}} · {{weather}}</span><time>{{time}}</time></header>`,
  style: `.hd{height:100%;box-sizing:border-box;display:flex;align-items:baseline;gap:22px;font-family:${HAND};color:${PENCIL}}
h1{margin:0;font-size:34px;font-weight:700;letter-spacing:.01em}
span{font-size:17px;color:${SOFT}}
time{margin-left:auto;font-size:30px;font-variant-numeric:tabular-nums;color:${BLUE_PEN}}`,
  size: { width: 920, height: 56 },
};

/** An oven or the proofer: what is in it, its heat, and the minutes left — a card leaning a little, as one taped up. */
const station: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['name', 'state'],
    properties: {
      name: { type: 'string' },
      item: { type: 'string' },
      temp: { type: 'number' },
      target: { type: 'number' },
      minutes: { type: 'number' },
      state: { enum: ['baking', 'proofing', 'heating', 'idle'] },
      tilt: { type: 'number' },
    },
  },
  template: `<section class="st {{state}}" style="--tilt: {{tilt}}"><p class="it">{{item}}</p><p class="tm"><b>{{minutes}}</b>분 남음</p><p class="tp">{{temp}}° / {{target}}°</p></section>`,
  style: `.st{height:100%;box-sizing:border-box;display:grid;align-content:center;gap:2px;padding:8px 14px;background:#fffdf7;${SKETCH_EDGE};transform:rotate(calc(var(--tilt) * 1deg));font-family:${HAND};color:${PENCIL};box-shadow:2px 3px 0 rgba(47,45,42,.12)}
p{margin:0}
.it{font-size:16px;font-weight:700;background:linear-gradient(transparent 55%,${MARKER} 55%);justify-self:start}
.tm{font-size:15px;color:${SOFT}}
.tm b{font-size:30px;color:${BLUE_PEN};font-variant-numeric:tabular-nums}
.tp{font-size:14px;color:${SOFT}}
.heating .tp{color:${RED_PEN}}
.idle{opacity:.6}`,
  size: { width: 168, height: 112 },
};

/** The display case's trays: each bread, how many are left, a red line through what has sold out. */
const trays: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, left: { type: 'number' }, state: { enum: ['plenty', 'low', 'out'] } } } } },
  },
  template: `<ul class="tr">{{#items}}<li class="{{state}}"><span>{{name}}</span><b>{{left}}</b></li>{{/items}}</ul>`,
  style: `.tr{height:100%;box-sizing:border-box;margin:0;padding:0;list-style:none;display:grid;grid-template-columns:repeat(3,1fr);gap:6px 10px;align-content:center;font-family:${HAND};color:${PENCIL}}
li{display:flex;align-items:baseline;justify-content:space-between;gap:6px;padding:2px 8px;border-bottom:1.5px dashed ${SOFT};white-space:nowrap}
span{font-size:14px}
b{font-size:18px;font-variant-numeric:tabular-nums}
.low b{color:${RED_PEN}}
.out{color:${RED_PEN};text-decoration:line-through 2px ${RED_PEN}}`,
  size: { width: 300, height: 76 },
};

/** A number written large with what it is under it — circled in pen when it matters. */
const tally: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['value', 'label'], properties: { value: { type: 'string' }, label: { type: 'string' }, note: { type: 'string' } } },
  template: `<figure class="ty"><b>{{value}}</b><figcaption>{{label}}<small>{{note}}</small></figcaption></figure>`,
  style: `.ty{margin:0;height:100%;box-sizing:border-box;display:grid;align-content:center;justify-items:start;gap:2px;font-family:${HAND};color:${PENCIL}}
b{font-size:46px;line-height:1;padding:4px 14px;${SKETCH_EDGE};border-color:${BLUE_PEN};color:${BLUE_PEN};font-variant-numeric:tabular-nums}
figcaption{font-size:16px;display:grid}
small{font-size:13px;color:${SOFT}}`,
  size: { width: 240, height: 120 },
};

/** A sticky note, a little crooked. */
const sticky: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['text'], properties: { text: { type: 'string' }, tilt: { type: 'number' }, colour: { enum: ['yellow', 'pink'] } } },
  template: `<p class="sn {{colour}}" style="--tilt: {{tilt}}">{{text}}</p>`,
  style: `.sn{margin:0;height:100%;box-sizing:border-box;padding:16px 16px 12px;background:#fff3a3;box-shadow:3px 4px 0 rgba(47,45,42,.15);transform:rotate(calc(var(--tilt) * 1deg));font:16px/1.45 ${HAND};color:${PENCIL};word-break:keep-all}
.pink{background:#ffd6e0}`,
  size: { width: 230, height: 140 },
};

/** The café's seats, as a count. */
const seats: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['taken', 'total'], properties: { taken: { type: 'number' }, total: { type: 'number' } } },
  template: `<p class="se"><b>{{taken}}</b> / {{total}}석</p>`,
  style: `.se{margin:0;height:100%;display:flex;align-items:center;font:16px ${HAND};color:${SOFT}}
b{font-size:26px;color:${BLUE_PEN};margin-right:4px}`,
  size: { width: 140, height: 40 },
};

// ── The board ───────────────────────────────────────────────────────────────────────────────────────────────────

const node = (id: string, x: number, y: number, width: number, height: number, widget: Widget): Node => ({ id, x, y, width, height, anchored: false, widget });

const stationNode = (id: string, x: number, y: number, tilt: number): Node =>
  node(`station-${id}`, x, y, 168, 112, {
    type: 'element:station',
    props: { name: id, item: '', temp: 0, target: 0, minutes: 0, state: 'idle', tilt },
    bindings: {
      item: bindStation(id, 'item'),
      temp: bindStation(id, 'temp'),
      target: bindStation(id, 'target'),
      minutes: bindStation(id, 'minutes'),
      state: bindStation(id, 'state'),
    },
  });

/** A batch on its way: from an oven to the case, dashed and in pen, saying what comes out and when. */
const batch = (oven: string): Connector => ({
  id: `batch-${oven}`,
  fromNodeId: `station-${oven}`,
  toNodeId: 'trays',
  label: '{{value}}',
  style: { route: 'curved', arrow: 'end', dash: 'dashed', stroke: BLUE_PEN, strokeWidth: 2 },
  bindings: { label: bindStation(oven, 'next') },
});

const nodes: Node[] = [
  node('head', 60, 30, 920, 56, {
    type: 'element:head',
    props: { name: '', date: '', time: '', weather: '' },
    bindings: { name: bind('/bakery/now', '/name'), date: bind('/bakery/now', '/date'), time: bind('/bakery/now', '/time'), weather: bind('/bakery/now', '/weather') },
  }),
  stationNode('oven1', OVEN_A.x - 8, OVEN_A.y + OVEN_A.h + 14, -2),
  stationNode('oven2', OVEN_B.x + 10, OVEN_B.y + OVEN_B.h + 14, 1.5),
  stationNode('proofer', PROOFER.x + PROOFER.w + 6, PROOFER.y + 36, -1),
  node('trays', CASE.x + 10, CASE.y + 7, CASE.w - 20, CASE.h - 14, { type: 'element:trays', props: { items: [] }, bindings: { items: bind('/bakery/case', '/value') } }),
  node('seats', 820, 640, 140, 40, { type: 'element:seats', props: { taken: 0, total: 0 }, bindings: { taken: bind('/bakery/cafe', '/taken'), total: bind('/bakery/cafe', '/total') } }),
  node('takings', 1052, 120, 240, 120, {
    type: 'element:tally',
    props: { value: '', label: '오늘 매출', note: '' },
    bindings: { value: bind('/bakery/today', '/takings'), note: bind('/bakery/today', '/againstLastWeek') },
  }),
  node('loaves', 1310, 120, 240, 120, {
    type: 'element:tally',
    props: { value: '', label: '나간 빵', note: '' },
    bindings: { value: bind('/bakery/today', '/loaves'), note: bind('/bakery/today', '/soldOut') },
  }),
  node('by-hour', 1044, 262, 516, 300, {
    type: 'chart.bar',
    props: {
      title: '시간대별 판매(개)',
      data: [],
      mapping: { x: 'hour', y: ['bread', 'drinks'] },
      options: { stack: true, series: [{ label: '빵', color: '#c08a3e' }, { label: '음료', color: '#8fa9c7' }] },
    },
    bindings: { data: bind('/bakery/hours', '/value') },
  }),
  node('note-1', 1060, 600, 230, 140, { type: 'element:sticky', props: { text: '', tilt: -3, colour: 'yellow' }, bindings: { text: bind('/bakery/notes', '/first') } }),
  node('note-2', 1316, 620, 230, 140, { type: 'element:sticky', props: { text: '', tilt: 2.5, colour: 'pink' }, bindings: { text: bind('/bakery/notes', '/second') } }),
];

const document: CanvasView = {
  kind: 'canvas',
  appearance: 'light',
  accent: BLUE_PEN,
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes,
  connectors: [batch('oven1'), batch('oven2')],
  elements: { head, station, trays, tally, sticky, seats },
};

export const bakerySketch: SamplePack = {
  id: 'bakery-sketch',
  title: { ko: '동네 빵집의 오후 — 손그림 스케치', en: 'A neighbourhood bakery’s afternoon — a pencil sketch' },
  field: { ko: '소상공인·외식', en: 'Small business & food' },
  kind: { ko: '가게 평면 스케치', en: 'A sketched shop plan' },
  summary: {
    ko: '주방 문 옆 태블릿에 띄운 동네 빵집의 오후를 공책에 연필로 그린 듯이 — 흔들리는 선으로 그린 가게 평면(데크 오븐 둘·발효기·반죽기·작업대, 카운터·진열대·카페 탁자) 위에 오븐·발효기마다 붙인 카드, 오븐에서 진열대로 다음 판이 언제 나오는지 점선, 진열대 쟁반의 남은 개수와 다 팔린 것엔 빨간 줄. 옆에 오늘 매출과 나간 빵, 시간대별 판매, 포스트잇 메모 둘. 모눈종이에 연필, 노란 형광펜, 빨간 펜. 예시 데이터입니다.',
    en: 'A neighbourhood bakery’s afternoon on the tablet by the kitchen door, drawn as if in pencil in a notebook — the shop’s plan in wobbly lines (two deck ovens, the proofer, the mixer and the bench; the counter, the display case and the café tables), a card taped by each oven and the proofer, a dashed line from each oven to the case saying when the next batch comes out, and the case’s trays with what is left, a red line through what has sold out. Beside it the day’s takings and loaves, sales by the hour and two sticky notes. Pencil on squared paper, a yellow highlighter, red pen. Example data.',
  },
  connectors: [BAKERY],
  document,
  snapshot,
};
