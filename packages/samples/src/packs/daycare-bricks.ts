import type { Binding, CanvasView, ElementDefinition, Node, Widget } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { svgDataUrl } from '../frame.js';
import { snapshot } from '../snapshots/daycare-bricks.js';

// A daycare centre's afternoon built from toy bricks: a green baseplate dotted with studs, a grey corridor plate, and
// every class a coloured plate with its studs along the top. A class counts its children as little round heads — a
// filled head for a child in the room, an empty ring for one who has gone home or did not come — and tells what it is
// doing on a round tile, by its symbol as well as its colour: a triangle for play indoors, a sun for the playground, a
// moon for a nap, an arrow for children leaving. On the right the centre's name brick, the figures now, the key, the
// buses home, the afternoon snack and the week's attendance. The centre is made up, so the values are example data.

export const CARE: ExampleSampleConnector = {
  key: 'care',
  name: '예시 어린이집 API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 어린이집이 아닙니다' },
};

/** The teachers update the board as children come and go; half an hour of silence is a board that has stopped. */
const MAX_AGE_SECONDS = 30 * 60;

const bind = (path: string, valuePath: string): Binding => ({
  adapter: CARE.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
});

const WIDTH = 1600;
const HEIGHT = 1000;
const BASE = '#5fae55';
const BASE_DARK = '#4b9443';
const CORRIDOR = '#a8adb3';
const WHITE = '#fbfaf6';
const INK = '#1f2328';
const RED = '#d9372b';
const YELLOW = '#f5c518';
const BLUE = '#1f6fbf';
const TEXT = '"Pretendard", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';

/** Studs: a row of raised circles, lit from the top left, on whatever colour is under them. */
const STUDS = 'radial-gradient(circle at 12px 11px,rgba(255,255,255,.6) 0 2.5px,rgba(255,255,255,.22) 3px 7.5px,rgba(0,0,0,.18) 8px 9px,transparent 9.5px) 0 0/24px 22px repeat-x';

/** A child's head, filled — a round yellow head on a 17px pitch. */
const HEAD = `radial-gradient(circle at 8px 9px,${YELLOW} 0 6.5px,#9a7b00 7px 8px,transparent 8.5px) 0 0/17px 18px repeat-x`;
/** An empty place — the ring of a head. */
const RING = `radial-gradient(circle at 8px 9px,transparent 0 5.5px,rgba(31,35,40,.45) 6px 7.5px,transparent 8px) 0 0/17px 18px repeat-x`;

// ── The baseplate ──────────────────────────────────────────────────────────────────────────────────────────────

function drawing(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<defs>
<pattern id="s" width="32" height="32" patternUnits="userSpaceOnUse"><circle cx="16" cy="17" r="10" fill="${BASE_DARK}"/><circle cx="16" cy="16" r="10" fill="${BASE}"/><circle cx="13" cy="13" r="3.5" fill="#86c97c"/></pattern>
<pattern id="c" width="32" height="32" patternUnits="userSpaceOnUse"><rect width="32" height="32" fill="${CORRIDOR}"/><rect x="0.5" y="0.5" width="31" height="31" fill="none" stroke="#959aa0"/></pattern>
</defs>
<rect width="${WIDTH}" height="${HEIGHT}" fill="${BASE}"/>
<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#s)"/>
<rect x="32" y="508" width="992" height="60" fill="url(#c)"/>
<rect x="32" y="508" width="992" height="60" fill="none" stroke="#7c8188" stroke-width="2"/>
<rect x="1036" y="682" width="532" height="286" rx="6" fill="${WHITE}"/>
<rect x="1036" y="960" width="532" height="8" fill="#d9d6cc"/>
<text x="528" y="546" font-family="Pretendard, 'Malgun Gothic', sans-serif" font-size="20" font-weight="800" fill="#4a4f55" text-anchor="middle" letter-spacing="6">복 도</text>
</svg>`;
  return svgDataUrl(svg);
}

// ── Elements ───────────────────────────────────────────────────────────────────────────────────────────────────

/** A class as a coloured plate — read from `r`. */
const room: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['r'], properties: { r: { type: 'object' } } },
  template: `<article class="rm {{r.state}}" style="--c: {{r.color}}"><div class="top"></div><header><b>{{r.name}}</b><i></i></header><small>{{r.age}} · {{r.teachers}}</small><p style="--n: {{r.here}}; --max: {{r.total}}"><span></span></p><em><strong>{{r.here}}</strong> / {{r.total}}명 <span>{{r.word}}</span></em><footer>{{r.note}}</footer></article>`,
  style: `.rm{height:100%;box-sizing:border-box;display:grid;grid-template-rows:22px auto auto 1fr auto auto;gap:6px;padding:0 16px 14px;background:var(--c);border-radius:6px;box-shadow:inset 0 -6px 0 rgba(0,0,0,.18),inset 0 0 0 2px rgba(0,0,0,.12);font-family:${TEXT};color:${INK}}
.top{margin:0 -16px;background:${STUDS}}
header{display:flex;justify-content:space-between;align-items:center}
b{font-size:22px;font-weight:900}
i{display:grid;place-items:center;width:34px;height:34px;border-radius:50%;background:${WHITE};box-shadow:inset 0 -3px 0 rgba(0,0,0,.2);font:900 18px ${TEXT};font-style:normal}
small{font-size:13px;font-weight:700}
p{margin:0;height:18px;width:calc(var(--max) * 17px);position:relative;align-self:center;background:${RING};background-size:17px 18px;background-repeat:repeat-x}
p span{position:absolute;left:0;top:0;bottom:0;width:calc(var(--n) * 17px);background:${HEAD}}
em{font-style:normal;font-size:15px;font-weight:800}
em strong{font-size:24px}
em span{margin-left:6px;padding:2px 8px;border-radius:999px;background:${WHITE};font-size:13px}
footer{font-size:13px;font-weight:600;padding:5px 8px;border-radius:4px;background:rgba(255,255,255,.65)}
.play i::before{content:"▶";color:${BLUE}}
.outside i{background:${YELLOW}}
.outside i::before{content:"☀";color:#8a5a00}
.nap i{background:#2c3e66}
.nap i::before{content:"☾";color:${YELLOW}}
.leaving i::before{content:"←";color:${RED}}
.leaving em span{background:${RED};color:${WHITE}}`,
  size: { width: 300, height: 240 },
};

/** The centre's name, on a long red brick. */
const title: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['t'], properties: { t: { type: 'object' } } },
  template: `<header class="tt"><div class="top"></div><small>{{t.series}}</small><h1>{{t.name}}</h1><div class="row"><span>{{t.date}}</span><b>{{t.time}}</b></div></header>`,
  style: `.tt{height:100%;box-sizing:border-box;display:grid;grid-template-rows:22px auto auto auto;align-content:start;gap:2px;padding:0 22px 14px;background:${RED};border-radius:6px;box-shadow:inset 0 -6px 0 rgba(0,0,0,.2);font-family:${TEXT};color:${WHITE}}
.top{margin:0 -22px;background:${STUDS}}
small{font-size:14px;font-weight:700;letter-spacing:.1em;opacity:.9}
h1{margin:0;font-size:44px;font-weight:900;letter-spacing:.02em;text-shadow:0 3px 0 rgba(0,0,0,.2)}
.row{display:flex;justify-content:space-between;align-items:baseline}
span{font-size:16px;font-weight:700}
b{font-size:28px;font-weight:900;background:${WHITE};color:${RED};padding:0 12px;border-radius:4px}`,
  size: { width: 540, height: 170 },
};

/** The figures now, each a white brick. */
const figures: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, value: { type: 'string' }, note: { type: 'string' } } } } },
  },
  template: `<dl class="fg">{{#items}}<div><dt>{{label}}</dt><dd>{{value}}</dd><small>{{note}}</small></div>{{/items}}</dl>`,
  style: `.fg{margin:0;height:100%;box-sizing:border-box;display:grid;grid-template-columns:repeat(3,1fr);gap:14px;font-family:${TEXT};color:${INK}}
div{display:grid;align-content:center;justify-items:center;text-align:center;background:${WHITE};border-radius:6px;box-shadow:inset 0 -5px 0 rgba(0,0,0,.14)}
dt{font-size:13px;font-weight:700}
dd{margin:0;font-size:32px;font-weight:900;color:${BLUE}}
small{font-size:12px;font-weight:600}`,
  size: { width: 540, height: 116 },
};

/** The key to the tiles and the heads. */
const legend: ElementDefinition = {
  render: 'template',
  props: { type: 'object', properties: {} },
  template: `<ul class="ky"><li><i class="play">▶</i>실내 놀이</li><li><i class="outside">☀</i>바깥 놀이</li><li><i class="nap">☾</i>낮잠</li><li><i class="leaving">←</i>하원 중</li><li><b class="head"></b>원내<b class="ring"></b>하원·결석</li></ul>`,
  style: `.ky{height:100%;box-sizing:border-box;margin:0;padding:0 14px;list-style:none;display:flex;align-items:center;justify-content:space-between;background:${WHITE};border-radius:6px;box-shadow:inset 0 -5px 0 rgba(0,0,0,.14);font:800 13px ${TEXT};color:${INK}}
li{display:flex;align-items:center;gap:6px}
i{display:grid;place-items:center;width:24px;height:24px;border-radius:50%;background:#eceae2;font:900 13px ${TEXT};font-style:normal}
.play{color:${BLUE}}
.outside{background:${YELLOW};color:#8a5a00}
.nap{background:#2c3e66;color:${YELLOW}}
.leaving{color:${RED}}
b{display:inline-block;width:17px;height:18px}
.head{background:${HEAD}}
.ring{margin-left:6px;background:${RING}}`,
  size: { width: 540, height: 52 },
};

/** The buses home, as a road plate. */
const buses: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { bus: { type: 'string' }, time: { type: 'string' }, route: { type: 'string' }, kids: { type: 'string' }, state: { type: 'string' }, word: { type: 'string' } } } } },
  },
  template: `<section class="bs"><h2>하원 차량</h2><ol>{{#items}}<li class="{{state}}"><b>{{bus}}</b><strong>{{time}}</strong><span>{{route}}</span><small>{{kids}}</small><em>{{word}}</em></li>{{/items}}</ol></section>`,
  style: `.bs{height:100%;box-sizing:border-box;padding:12px 18px;background:#50565d;border-radius:6px;box-shadow:inset 0 -5px 0 rgba(0,0,0,.25);font-family:${TEXT};color:${WHITE}}
h2{margin:0 0 8px;font-size:18px;font-weight:900}
ol{margin:0;padding:0;list-style:none;display:grid;gap:6px}
li{display:grid;grid-template-columns:56px 50px 1fr 40px 86px;align-items:center;gap:10px;padding:7px 10px;border-radius:4px;background:repeating-linear-gradient(90deg,#666c73 0 24px,#5c6268 24px 26px);font-size:14px}
b{padding:2px 6px;border-radius:4px;background:${YELLOW};color:${INK};text-align:center;font-weight:900}
strong{font-size:17px}
small{text-align:right;font-weight:700}
em{font-style:normal;font-weight:900;text-align:right;white-space:nowrap}
.ready em::before{content:"● ";color:${YELLOW}}
.later em{opacity:.75}
.later em::before{content:"○ "}`,
  size: { width: 540, height: 150 },
};

/** The afternoon snack and what to bring tomorrow. */
const notice: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['n'], properties: { n: { type: 'object' } } },
  template: `<section class="nt"><div><small>오후 간식</small><b>{{n.snack}}</b></div><div><small>내일 준비물</small><b>{{n.bring}}</b></div></section>`,
  style: `.nt{height:100%;box-sizing:border-box;display:grid;grid-template-columns:1fr 1fr;gap:14px;font-family:${TEXT};color:${INK}}
div{display:grid;align-content:center;gap:2px;padding:0 16px;border-radius:6px;background:${YELLOW};box-shadow:inset 0 -5px 0 rgba(0,0,0,.16)}
div + div{background:#7cc6e8}
small{font-size:13px;font-weight:700}
b{font-size:17px;font-weight:900}`,
  size: { width: 540, height: 76 },
};

/** The day's timetable along the bottom, the part of the day now marked. */
const day: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { time: { type: 'string' }, what: { type: 'string' }, state: { type: 'string' } } } } },
  },
  template: `<ol class="dy">{{#items}}<li class="{{state}}"><b>{{time}}</b><span>{{what}}</span></li>{{/items}}</ol>`,
  style: `.dy{height:100%;box-sizing:border-box;margin:0;padding:22px 14px 14px;list-style:none;display:grid;grid-template-columns:repeat(7,1fr);gap:10px;background:${STUDS},${WHITE};border-radius:6px;box-shadow:inset 0 -6px 0 rgba(0,0,0,.14);font-family:${TEXT};color:${INK}}
li{display:grid;align-content:center;justify-items:center;gap:2px;border-radius:4px;background:#eceae2;text-align:center}
b{font-size:15px;font-weight:900}
span{font-size:13px;font-weight:700}
.done{opacity:.55}
.done b::before{content:"✓ "}
.now{background:${RED};color:${WHITE}}
.now b::before{content:"▶ "}`,
  size: { width: 956, height: 120 },
};

// ── The board ──────────────────────────────────────────────────────────────────────────────────────────────────

const node = (id: string, x: number, y: number, width: number, height: number, widget: Widget): Node => ({ id, x, y, width, height, anchored: false, widget });

const ROOMS = ['star', 'petal', 'sprout', 'sun', 'sea', 'sky'] as const;

const nodes: Node[] = [
  ...ROOMS.map((id, i) =>
    node(`room-${id}`, 48 + (i % 3) * 328, i < 3 ? 250 : 586, 300, 240, { type: 'element:room', props: { r: {} }, bindings: { r: bind('/care/rooms', `/value/${id}`) } })
  ),
  node('title', 1040, 36, 524, 170, { type: 'element:title', props: { t: {} }, bindings: { t: bind('/care/now', '/value') } }),
  node('figures', 1040, 224, 524, 116, { type: 'element:figures', props: { items: [] }, bindings: { items: bind('/care/figures', '/value') } }),
  node('legend', 1040, 356, 524, 52, { type: 'element:legend', props: {} }),
  node('buses', 1040, 424, 524, 150, { type: 'element:buses', props: { items: [] }, bindings: { items: bind('/care/buses', '/value') } }),
  node('notice', 1040, 590, 524, 76, { type: 'element:notice', props: { n: {} }, bindings: { n: bind('/care/notice', '/value') } }),
  node('week', 1052, 694, 504, 262, {
    type: 'chart.bar',
    props: { title: '이번 주 등원 (정원 59명)', data: [], mapping: { x: 'day', y: 'kids' }, options: { series: [{ label: '등원', color: RED }] } },
    bindings: { data: bind('/care/week', '/value') },
  }),
  node('day', 48, 846, 956, 120, { type: 'element:day', props: { items: [] }, bindings: { items: bind('/care/day', '/value') } }),
  node('outdoor', 48, 36, 956, 196, { type: 'element:outdoor', props: { o: {} }, bindings: { o: bind('/care/outdoor', '/value') } }),
];

/** The playground, a sand-yellow plate with what is out there now — read from `o`. */
const outdoor: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['o'], properties: { o: { type: 'object' } } },
  template: `<section class="od"><div class="top"></div><header><b>놀이터</b><span>{{o.who}}</span></header><ul><li><small>바깥 기온</small><strong>{{o.temp}}</strong></li><li><small>미세먼지</small><strong>{{o.dust}}</strong></li><li><small>바깥 놀이</small><strong>{{o.until}}</strong></li><li><small>안전 점검</small><strong>{{o.check}}</strong></li></ul></section>`,
  style: `.od{height:100%;box-sizing:border-box;display:grid;grid-template-rows:22px auto 1fr;gap:8px;padding:0 20px 16px;background:#f2d27a;border-radius:6px;box-shadow:inset 0 -6px 0 rgba(0,0,0,.15);font-family:${TEXT};color:${INK}}
.top{margin:0 -20px;background:${STUDS}}
header{display:flex;align-items:baseline;gap:14px}
b{font-size:24px;font-weight:900}
header span{font-size:15px;font-weight:700}
ul{margin:0;padding:0;list-style:none;display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
li{display:grid;align-content:center;justify-items:center;gap:2px;border-radius:6px;background:${WHITE};box-shadow:inset 0 -4px 0 rgba(0,0,0,.12)}
small{font-size:13px;font-weight:700}
strong{font-size:22px;font-weight:900}`,
  size: { width: 956, height: 196 },
};

const document: CanvasView = {
  kind: 'canvas',
  appearance: 'light',
  accent: RED,
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes,
  connectors: [],
  elements: { room, title, figures, legend, buses, notice, outdoor, day },
};

export const daycareBricks: SamplePack = {
  id: 'daycare-bricks',
  title: { ko: '어린이집의 오후 — 장난감 블록', en: 'A daycare centre’s afternoon — toy bricks' },
  field: { ko: '보육·어린이집', en: 'Childcare' },
  kind: { ko: '반별 원아·활동·하원 차량', en: 'Children by class, activities and the buses home' },
  summary: {
    ko: '어린이집의 오후를 장난감 블록으로 — 돌기가 박힌 초록 바닥판, 회색 복도 판, 그리고 위쪽에 돌기가 줄지은 반마다의 색 판. 반은 아이 수를 동그란 머리로 센다: 원내에 있는 아이는 채운 머리, 하원했거나 오지 않은 아이는 빈 고리. 지금 하는 일은 둥근 타일에 색과 함께 기호로: 삼각형 실내 놀이, 해 바깥 놀이, 달 낮잠, 화살표 하원 중. 위에는 놀이터 판(기온·미세먼지·바깥 놀이 시각·안전 점검), 아래에는 오늘 일과표, 오른쪽에 어린이집 이름 블록, 지금 수치, 범례, 하원 차량, 오후 간식과 내일 준비물, 이번 주 등원. 어린이집은 지어낸 것이라 예시 데이터입니다.',
    en: 'A daycare centre’s afternoon built from toy bricks — a green baseplate dotted with studs, a grey corridor plate, and every class a coloured plate with studs along its top. A class counts its children as round heads: a filled head for a child in the room, an empty ring for one who has gone home or did not come. What it is doing shows on a round tile, by a symbol as well as a colour: a triangle for play indoors, a sun for the playground, a moon for a nap, an arrow for children leaving. Above, the playground plate (temperature, fine dust, outdoor time, safety check); below, the day’s timetable; on the right the centre’s name brick, the figures now, the key, the buses home, the afternoon snack with what to bring tomorrow, and the week’s attendance. The centre is made up. Example data.',
  },
  connectors: [CARE],
  document,
  snapshot,
};
