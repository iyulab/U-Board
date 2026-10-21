import type { Binding, CanvasView, ElementDefinition, Node, Widget } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { svgDataUrl } from '../frame.js';
import { snapshot } from '../snapshots/pool-mosaic.js';

// An indoor pool's evening laid in mosaic: the pool seen from above in small glass tiles of blue, a band of tiles around
// it, the grout showing between. Every lane is a strip of white tile with its number on a tile of its own, what the lane
// is for, and its swimmers counted in tiles — one filled tile a swimmer, an empty tile a free place. A lane's state is
// told by a sign laid at its end and by the rope along it, as well as by a colour: a ring and a blue-and-white rope for
// free swimming, a diamond and a yellow rope for a class, a triangle and a red rope when the lane is full, a cross and a
// hatched rope when it is closed. Below, the water's quality and the evening's classes; on the right the pool's name in a
// tiled band, the figures now, the key and the admissions by the hour. The pool is made up, so the values are example data.

export const POOL: ExampleSampleConnector = {
  key: 'pool',
  name: '예시 수영장 API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 수영장이 아닙니다' },
};

/** The gate and the lane counters report every minute; ten minutes of silence is a source that has stopped. */
const MAX_AGE_SECONDS = 10 * 60;

const bind = (path: string, valuePath: string): Binding => ({
  adapter: POOL.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
});

const WIDTH = 1600;
const HEIGHT = 1000;
const TILE = '#fbfcfd';
const GROUT = '#c9d3da';
const DEEP = '#123f6b';
const BLUE = '#1f73b7';
const AQUA = '#5cc3d6';
const SUN = '#f2b632';
const RED = '#d13b30';
const INK = '#14283a';
const TEXT = '"Pretendard", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';

/** White tiles with the grout between, for a card. */
const tiles = `linear-gradient(${GROUT} 1px,transparent 1px) 0 0/14px 14px,linear-gradient(90deg,${GROUT} 1px,transparent 1px) 0 0/14px 14px,${TILE}`;

/** A tiled card: white tile, a band of blue tiles round its edge. */
const card = `box-sizing:border-box;background:${tiles};border:6px solid ${BLUE};border-image:repeating-linear-gradient(90deg,${BLUE} 0 10px,${AQUA} 10px 12px,${DEEP} 12px 22px,${AQUA} 22px 24px) 6;color:${INK}`;

// ── The pool ───────────────────────────────────────────────────────────────────────────────────────────────────

function drawing(): string {
  const shades = ['#2a86c4', '#2f8fcc', '#2479b5', '#3597d1', '#2c82bd'];
  // The pool's water as glass tiles: a 7 × 7 block of mixed shades, repeated — the block is wide enough that the repeat
  // does not read as a pattern.
  const block = Array.from({ length: 49 }, (_, i) => {
    const x = i % 7;
    const y = Math.floor(i / 7);
    return `<rect x="${x * 15}" y="${y * 15}" width="14" height="14" fill="${shades[(x * 3 + y * 2 + ((x * y) % 3)) % shades.length]}"/>`;
  }).join('');
  const band = (y: number) =>
    Array.from({ length: 106 }, (_, i) => `<rect x="${i * 15 + 2}" y="${y}" width="14" height="14" fill="${i % 3 === 0 ? DEEP : i % 3 === 1 ? AQUA : BLUE}"/>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<rect width="${WIDTH}" height="${HEIGHT}" fill="${GROUT}"/>
<defs><pattern id="t" width="15" height="15" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="#f1f4f6"/></pattern></defs>
<pattern id="g" x="36" y="30" width="105" height="105" patternUnits="userSpaceOnUse">${block}</pattern>
<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#t)"/>
${band(6)}${band(HEIGHT - 20)}
<rect x="30" y="24" width="1002" height="612" fill="${DEEP}"/>
<rect x="36" y="30" width="990" height="600" fill="url(#g)"/>
<rect x="1035" y="481" width="535" height="485" fill="${GROUT}"/>
<rect x="1030" y="476" width="535" height="485" fill="${TILE}" stroke="${BLUE}" stroke-width="6"/>
</svg>`;
  return svgDataUrl(svg);
}

// ── Elements ───────────────────────────────────────────────────────────────────────────────────────────────────

/** A lane — read from `l`; its swimmers counted in tiles. */
const lane: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['l'], properties: { l: { type: 'object' } } },
  template: `<article class="ln {{l.state}}"><b>{{l.no}}</b><header><strong>{{l.use}}</strong><small>{{l.who}}</small></header><p style="--n: {{l.swimmers}}; --max: {{l.places}}"><span></span></p><em>{{l.swimmers}} / {{l.places}}</em><i>{{l.word}}</i></article>`,
  style: `.ln{position:relative;height:100%;box-sizing:border-box;display:grid;grid-template-columns:52px 230px 1fr 76px 112px;align-items:center;gap:14px;padding:0 14px 6px 6px;background:${tiles};font-family:${TEXT};color:${INK};box-shadow:0 2px 0 rgba(0,0,0,.25)}
.ln::after{content:"";position:absolute;left:0;right:0;bottom:0;height:6px;background:repeating-linear-gradient(90deg,${BLUE} 0 12px,#ffffff 12px 24px)}
b{display:grid;place-items:center;width:46px;height:46px;background:${DEEP};color:#ffffff;font:800 24px ${TEXT};box-shadow:inset 0 0 0 2px ${AQUA}}
header{display:grid}
strong{font-size:18px;font-weight:800}
small{font-size:13px}
p{margin:0;height:18px;width:calc(var(--max) * 20px);background:repeating-linear-gradient(90deg,#ffffff 0 16px,transparent 16px 20px);box-shadow:inset 0 0 0 1px ${GROUT};position:relative}
p::before{content:"";position:absolute;inset:0;width:calc(var(--max) * 20px - 4px);background:repeating-linear-gradient(90deg,transparent 0 16px,${GROUT} 16px 20px)}
span{position:absolute;left:0;top:0;bottom:0;width:calc(var(--n) * 20px);background:repeating-linear-gradient(90deg,${BLUE} 0 16px,transparent 16px 20px)}
em{font-style:normal;font-size:17px;font-weight:800;text-align:right}
i{font-style:normal;font-size:15px;font-weight:800;text-align:center;padding:4px 0;border:2px solid ${INK};background:#ffffff}
.open i::before{content:"○ "}
.class i{background:${SUN}}
.class i::before{content:"◆ "}
.class::after{background:repeating-linear-gradient(90deg,${SUN} 0 12px,#ffffff 12px 24px)}
.class span{background:repeating-linear-gradient(90deg,#c98a00 0 16px,transparent 16px 20px)}
.full i{background:${RED};color:#ffffff;border-color:${RED}}
.full i::before{content:"▲ "}
.full::after{background:repeating-linear-gradient(90deg,${RED} 0 12px,#ffffff 12px 24px)}
.full span{background:repeating-linear-gradient(90deg,${RED} 0 16px,transparent 16px 20px)}
.closed{background:repeating-linear-gradient(-45deg,#eef1f3 0 8px,#dfe5ea 8px 16px)}
.closed i{background:${INK};color:#ffffff}
.closed i::before{content:"✕ "}
.closed::after{background:repeating-linear-gradient(-45deg,${INK} 0 4px,#ffffff 4px 8px)}
.closed b{background:#7b8a96}`,
  size: { width: 960, height: 64 },
};

/** The water's quality, each reading a tiled card with its range. */
const water: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, value: { type: 'string' }, range: { type: 'string' }, state: { type: 'string' } } } } },
  },
  template: `<section class="wq"><h2>수질 — 19:00 측정</h2><dl>{{#items}}<div class="{{state}}"><dt>{{label}}</dt><dd>{{value}}</dd><small>{{range}}</small></div>{{/items}}</dl></section>`,
  style: `.wq{height:100%;${card};padding:14px 18px;font-family:${TEXT}}
h2{margin:0 0 10px;font-size:19px;font-weight:800}
dl{margin:0;display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
div{display:grid;grid-template-columns:1fr auto;grid-template-rows:auto auto;align-items:baseline;padding:8px 12px;background:#ffffff;border:2px solid ${INK}}
dt{font-size:14px;font-weight:700}
dd{margin:0;grid-row:span 2;font-size:26px;font-weight:800;text-align:right}
small{font-size:12px}
.ok dt::before{content:"○ ";color:${BLUE}}
.watch{background:repeating-linear-gradient(-45deg,#ffffff 0 7px,#fdf0cf 7px 14px);border-color:#b07a00}
.watch dt::before{content:"▲ ";color:#b07a00}`,
  size: { width: 470, height: 310 },
};

/** The evening's classes. */
const classes: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { time: { type: 'string' }, name: { type: 'string' }, lane: { type: 'string' }, state: { type: 'string' }, word: { type: 'string' } } } } },
  },
  template: `<section class="cl"><h2>저녁 강습</h2><ol>{{#items}}<li class="{{state}}"><b>{{time}}</b><span>{{name}}</span><small>{{lane}}</small><i>{{word}}</i></li>{{/items}}</ol></section>`,
  style: `.cl{height:100%;${card};padding:14px 18px;font-family:${TEXT}}
h2{margin:0 0 8px;font-size:19px;font-weight:800}
ol{margin:0;padding:0;list-style:none;display:grid;gap:4px}
li{display:grid;grid-template-columns:54px 1fr 62px 76px;align-items:center;gap:8px;padding:4px 10px;background:#ffffff;border:2px solid ${GROUT};font-size:15px}
b{font-weight:800}
small{font-size:13px}
i{font-style:normal;font-weight:800;font-size:13px;text-align:right}
.done{opacity:.6}
.done i::before{content:"✓ "}
.now{border-color:${SUN};background:#fff7df}
.now i::before{content:"◆ "}
.next i::before{content:"○ "}`,
  size: { width: 470, height: 310 },
};

/** The pool's name in a tiled band. */
const title: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['t'], properties: { t: { type: 'object' } } },
  template: `<header class="tt"><small>{{t.series}}</small><h1>{{t.name}}</h1><div><span>{{t.date}}</span><b>{{t.time}}</b></div></header>`,
  style: `.tt{height:100%;box-sizing:border-box;display:grid;align-content:center;gap:4px;padding:14px 22px;background:linear-gradient(rgba(18,63,107,.18) 1px,transparent 1px) 0 0/16px 16px,linear-gradient(90deg,rgba(18,63,107,.18) 1px,transparent 1px) 0 0/16px 16px,${DEEP};border:6px solid ${AQUA};color:#ffffff;font-family:${TEXT}}
small{font-size:14px;letter-spacing:.2em;color:${AQUA};font-weight:700}
h1{margin:0;font-size:46px;font-weight:900;letter-spacing:.06em}
div{display:flex;justify-content:space-between;align-items:baseline}
span{font-size:16px}
b{font-size:30px;font-weight:800;background:${TILE};color:${DEEP};padding:0 10px}`,
  size: { width: 535, height: 170 },
};

/** The figures now, each on a tiled card. */
const figures: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, value: { type: 'string' }, note: { type: 'string' } } } } },
  },
  template: `<dl class="fg">{{#items}}<div><dt>{{label}}</dt><dd>{{value}}</dd><small>{{note}}</small></div>{{/items}}</dl>`,
  style: `.fg{margin:0;height:100%;box-sizing:border-box;display:grid;grid-template-columns:repeat(3,1fr);gap:12px;font-family:${TEXT}}
div{${card};display:grid;align-content:center;justify-items:center;text-align:center}
dt{font-size:14px;font-weight:700}
dd{margin:0;font-size:32px;font-weight:900;color:${DEEP}}
small{font-size:12px}`,
  size: { width: 535, height: 130 },
};

/** The key to the lane signs and ropes. */
const legend: ElementDefinition = {
  render: 'template',
  props: { type: 'object', properties: {} },
  template: `<ul class="ky"><li><s class="open"></s>○ 자유</li><li><s class="class"></s>◆ 강습</li><li><s class="full"></s>▲ 만원</li><li><s class="closed"></s>✕ 닫힘</li></ul>`,
  style: `.ky{height:100%;box-sizing:border-box;margin:0;padding:0 16px;list-style:none;display:flex;align-items:center;justify-content:space-between;background:#ffffff;border:2px solid ${INK};font:800 14px ${TEXT};color:${INK}}
li{display:flex;align-items:center;gap:8px}
s{width:40px;height:6px;text-decoration:none;display:block}
.open{background:repeating-linear-gradient(90deg,${BLUE} 0 8px,#d9e6f0 8px 16px)}
.class{background:repeating-linear-gradient(90deg,${SUN} 0 8px,#f5ead0 8px 16px)}
.full{background:repeating-linear-gradient(90deg,${RED} 0 8px,#f6d9d6 8px 16px)}
.closed{background:repeating-linear-gradient(-45deg,${INK} 0 3px,#ffffff 3px 6px)}`,
  size: { width: 535, height: 56 },
};

// ── The board ──────────────────────────────────────────────────────────────────────────────────────────────────

const node = (id: string, x: number, y: number, width: number, height: number, widget: Widget): Node => ({ id, x, y, width, height, anchored: false, widget });

const LANES = ['l1', 'l2', 'l3', 'l4', 'l5', 'l6', 'l7', 'l8'] as const;

const nodes: Node[] = [
  ...LANES.map((id, i) => node(`lane-${id}`, 51, 42 + i * 73, 960, 64, { type: 'element:lane', props: { l: {} }, bindings: { l: bind('/pool/lanes', `/value/${id}`) } })),
  node('water', 40, 652, 470, 310, { type: 'element:water', props: { items: [] }, bindings: { items: bind('/pool/water', '/value') } }),
  node('classes', 532, 652, 470, 310, { type: 'element:classes', props: { items: [] }, bindings: { items: bind('/pool/classes', '/value') } }),
  node('title', 1030, 36, 535, 170, { type: 'element:title', props: { t: {} }, bindings: { t: bind('/pool/now', '/value') } }),
  node('figures', 1030, 224, 535, 130, { type: 'element:figures', props: { items: [] }, bindings: { items: bind('/pool/figures', '/value') } }),
  node('legend', 1030, 372, 535, 56, { type: 'element:legend', props: {} }),
  node('admissions', 1050, 496, 495, 445, {
    type: 'chart.bar',
    props: { title: '시간별 입장(명) — 19시는 10분까지', data: [], mapping: { x: 'hour', y: 'admissions' }, options: { series: [{ label: '입장', color: BLUE }] } },
    bindings: { data: bind('/pool/admissions', '/value') },
  }),
];

const document: CanvasView = {
  kind: 'canvas',
  appearance: 'light',
  accent: BLUE,
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes,
  connectors: [],
  elements: { lane, water, classes, title, figures, legend },
};

export const poolMosaic: SamplePack = {
  id: 'pool-mosaic',
  title: { ko: '실내 수영장의 저녁 — 모자이크 타일', en: 'An indoor pool’s evening — mosaic tiles' },
  field: { ko: '체육시설·수영장', en: 'Sports facilities & pools' },
  kind: { ko: '레인 사용·수질·강습·입장', en: 'Lanes, water quality, classes and admissions' },
  summary: {
    ko: '실내 수영장의 저녁을 모자이크로 — 위에서 본 수조가 작은 파란 유리 타일로 깔리고, 둘레에 타일 띠, 사이사이 줄눈. 레인마다 흰 타일 한 줄: 번호를 새긴 타일, 레인의 쓰임, 그리고 타일로 센 사람 수 — 채운 타일 하나가 한 사람, 빈 타일이 남은 자리. 레인 상태는 색과 함께 끝에 놓은 표지와 레인 줄로: 자유 수영은 ○와 파랑·흰 줄, 강습은 ◆와 노란 줄, 만원은 ▲와 붉은 줄, 닫힘은 ✕와 빗금 줄. 아래에는 수질과 저녁 강습, 오른쪽에 타일 띠 속 수영장 이름, 지금 수치, 범례, 시간별 입장. 수영장은 지어낸 것이라 예시 데이터입니다.',
    en: 'An indoor pool’s evening laid in mosaic — the pool seen from above in small glass tiles of blue, a band of tiles round it, the grout between. Every lane is a strip of white tile: its number on a tile of its own, what the lane is for, and its swimmers counted in tiles — a filled tile a swimmer, an empty one a free place. A lane tells its state by a sign at its end and by its rope, as well as by colour: a ring and a blue-and-white rope for free swimming, a diamond and a yellow rope for a class, a triangle and a red rope when it is full, a cross and a hatched rope when it is closed. Below, the water’s quality and the evening’s classes; on the right the pool’s name in a tiled band, the figures now, the key and the admissions by the hour. The pool is made up. Example data.',
  },
  connectors: [POOL],
  document,
  snapshot,
};
