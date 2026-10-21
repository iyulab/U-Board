import type { Binding, CanvasView, ElementDefinition, Node, Widget } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { svgDataUrl } from '../frame.js';
import { snapshot } from '../snapshots/apiary-stitch.js';

// An apiary's autumn worked as cross-stitch: cream Aida cloth with its weave showing, every hive an embroidery hoop — a
// wooden ring, the hive's number and its weight stitched inside. A hive's state is told by the honeycomb stitched at the
// top of its hoop, as well as by a colour: a comb filled with cross stitches when the colony is sound, half filled when it
// is short of food or its mites are rising, an empty comb crossed out in red when its queen is missing. Below, a sampler
// of the year's harvests and the work left before winter, and the flowers the bees can still reach; on the right the
// apiary's name stitched in a border, the figures now, the key and the average hive weight through the week. The apiary
// is made up, so the values are example data.

export const APIARY: ExampleSampleConnector = {
  key: 'apiary',
  name: '예시 양봉장 API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 양봉장이 아닙니다' },
};

/** The hive scales report every quarter of an hour; two hours of silence is a source that has stopped. */
const MAX_AGE_SECONDS = 2 * 60 * 60;

const bind = (path: string, valuePath: string): Binding => ({
  adapter: APIARY.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
});

const WIDTH = 1600;
const HEIGHT = 1000;
const CLOTH = '#f4ecd8';
const WEAVE = '#e3d7b9';
const WOOD = '#b98a52';
const THREAD = '#3b3226';
const HONEY = '#d99a1e';
const LEAF = '#5f7d3a';
const RED = '#b8322a';
const SERIF = '"Noto Serif KR", "Batang", "Georgia", serif';
const TEXT = '"Pretendard", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';

/** Cross stitches in a colour: two diagonal threads crossing in every square of the cloth. */
const stitches = (colour: string) =>
  `repeating-linear-gradient(45deg,transparent 0 2px,${colour} 2px 3.6px,transparent 3.6px 6px),repeating-linear-gradient(-45deg,transparent 0 2px,${colour} 2px 3.6px,transparent 3.6px 6px)`;

/** A running stitch along an edge: dashes of thread with gaps between. */
const running = (colour: string) => `2px dashed ${colour}`;

/** A comb cell, as a polygon. */
const HEX = 'polygon(25% 4%,75% 4%,100% 50%,75% 96%,25% 96%,0 50%)';

// ── The cloth ──────────────────────────────────────────────────────────────────────────────────────────────────

function drawing(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<defs><pattern id="w" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="${CLOTH}"/><rect x="0" y="0" width="6" height="6" fill="#efe5cc"/><circle cx="7" cy="7" r="0.9" fill="${WEAVE}"/></pattern></defs>
<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#w)"/>
<rect x="18" y="18" width="${WIDTH - 36}" height="${HEIGHT - 36}" fill="none" stroke="${HONEY}" stroke-width="3" stroke-dasharray="9 6"/>
<rect x="28" y="28" width="${WIDTH - 56}" height="${HEIGHT - 56}" fill="none" stroke="${LEAF}" stroke-width="2" stroke-dasharray="4 5"/>
<rect x="1020" y="470" width="545" height="490" fill="#fbf8ef" stroke="${THREAD}" stroke-width="2"/>
<rect x="1028" y="478" width="529" height="474" fill="none" stroke="${HONEY}" stroke-width="2" stroke-dasharray="6 5"/>
</svg>`;
  return svgDataUrl(svg);
}

// ── Elements ───────────────────────────────────────────────────────────────────────────────────────────────────

/** A hive as an embroidery hoop — read from `h`. */
const hoop: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['h'], properties: { h: { type: 'object' } } },
  template: `<article class="hp {{h.state}}"><i></i><small>{{h.no}}</small><b>{{h.weight}}</b><span>{{h.frames}} · {{h.queen}}</span><em>{{h.note}}</em></article>`,
  style: `.hp{position:relative;height:100%;box-sizing:border-box;border-radius:50%;border:11px solid ${WOOD};box-shadow:inset 0 0 0 2px #8a6233,inset 0 3px 8px rgba(0,0,0,.18),0 0 0 2px #8a6233,3px 5px 0 rgba(80,50,20,.25);background:#fbf6e8;display:grid;align-content:center;justify-items:center;text-align:center;gap:1px;padding:0 26px;font-family:${TEXT};color:${THREAD};overflow:hidden}
.hp::before{content:"";position:absolute;inset:6px;border-radius:50%;border:${running(LEAF)}}
i{width:40px;height:34px;clip-path:${HEX};background:${THREAD};position:relative;margin-bottom:2px}
i::after{content:"";position:absolute;inset:2.5px;clip-path:${HEX};background:${stitches(HONEY)},#fbf6e8}
small{font:700 13px ${SERIF};letter-spacing:.12em}
b{font:700 26px ${SERIF}}
span{font-size:12px}
em{font-style:normal;font-size:12px;font-weight:700;margin-top:2px}
.watch i::after{background:linear-gradient(to bottom,#fbf6e8 0 48%,transparent 48%),${stitches(HONEY)},#fbf6e8}
.watch em{color:#8a5a00;border-bottom:${running(HONEY)}}
.alarm i{background:${RED}}
.alarm i::after{background:#fbf6e8}
.alarm i::before{content:"✕";position:absolute;inset:0;z-index:1;display:grid;place-items:center;color:${RED};font:700 24px ${TEXT}}
.alarm::before{border-color:${RED}}
.alarm em{color:${RED}}`,
  size: { width: 220, height: 220 },
};

/** The year's harvests and the work left, as a sampler. */
const harvest: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { when: { type: 'string' }, what: { type: 'string' }, amount: { type: 'string' }, state: { type: 'string' }, word: { type: 'string' } } } } },
  },
  template: `<section class="sm"><h2>올해 채밀과 남은 일</h2><ol>{{#items}}<li class="{{state}}"><b>{{when}}</b><span>{{what}}</span><strong>{{amount}}</strong><small>{{word}}</small></li>{{/items}}</ol></section>`,
  style: `.sm{height:100%;box-sizing:border-box;padding:18px 26px;background:#fbf6e8;border:2px solid ${THREAD};box-shadow:inset 0 0 0 7px #fbf6e8,inset 0 0 0 9px ${HONEY};font-family:${TEXT};color:${THREAD}}
h2{margin:0 0 8px;font:700 21px ${SERIF};text-align:center;border-bottom:${running(LEAF)};padding-bottom:6px}
ol{margin:0;padding:0;list-style:none;display:grid;gap:3px}
li{display:grid;grid-template-columns:64px 1fr 90px 100px;align-items:center;gap:12px;font-size:17px;padding:8px 6px;border-bottom:1px dotted ${WEAVE}}
b{font:700 15px ${SERIF}}
strong{text-align:right;font:700 17px ${SERIF}}
small{text-align:right;font-size:14px;font-weight:700}
.done small{color:${LEAF}}
.done small::before{content:"✕ "}
.next{background:${stitches('#f1d48c')},#fbf6e8}
.next small{color:#8a5a00}
.next small::before{content:"▸ "}
.plan small{color:#7a6e5c;font-weight:400}
.plan small::before{content:"○ "}`,
  size: { width: 600, height: 400 },
};

/** The flowers within the bees' reach. */
const flowers: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, state: { type: 'string' }, word: { type: 'string' }, distance: { type: 'string' } } } } },
  },
  template: `<section class="fl"><h2>꿀이 나는 꽃</h2><ul>{{#items}}<li class="{{state}}"><i>✿</i><b>{{name}}</b><span>{{word}}</span><small>{{distance}}</small></li>{{/items}}</ul></section>`,
  style: `.fl{height:100%;box-sizing:border-box;padding:18px 20px;background:#fbf6e8;border:2px solid ${THREAD};box-shadow:inset 0 0 0 7px #fbf6e8,inset 0 0 0 9px ${LEAF};font-family:${TEXT};color:${THREAD}}
h2{margin:0 0 10px;font:700 21px ${SERIF};text-align:center;border-bottom:${running(HONEY)};padding-bottom:6px}
ul{margin:0;padding:0;list-style:none;display:grid;gap:10px}
li{display:grid;grid-template-columns:34px 1fr auto;grid-template-rows:auto auto;column-gap:8px;align-items:center}
i{grid-row:span 2;font-style:normal;font-size:30px;line-height:1;text-align:center}
b{font:700 17px ${SERIF}}
span{grid-column:3;grid-row:1;font-size:13px;font-weight:700}
small{grid-column:2 / span 2;font-size:12px}
.bloom i{color:${HONEY};text-shadow:0 0 0 ${THREAD}}
.bloom span{color:${LEAF}}
.fade i{color:transparent;-webkit-text-stroke:1px #8f8270}
.fade span{color:#8f8270}
.bud i{color:${LEAF};font-size:14px}
.bud span{color:#8f8270;font-weight:400}`,
  size: { width: 330, height: 400 },
};

/** The apiary's name in a stitched border. */
const title: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['t'], properties: { t: { type: 'object' } } },
  template: `<header class="tt"><small>{{t.series}}</small><h1>{{t.name}}</h1><div><span>{{t.date}}</span><b>{{t.time}}</b></div></header>`,
  style: `.tt{height:100%;box-sizing:border-box;display:grid;align-content:center;justify-items:center;gap:4px;padding:14px;background:#fbf6e8;border:2px solid ${THREAD};box-shadow:inset 0 0 0 6px #fbf6e8,inset 0 0 0 9px ${HONEY},inset 0 0 0 13px #fbf6e8,inset 0 0 0 15px ${LEAF};font-family:${SERIF};color:${THREAD};text-align:center}
small{font-size:14px;letter-spacing:.3em}
h1{margin:0;font-size:44px;font-weight:700;letter-spacing:.14em;color:#7a4e0c}
div{display:flex;gap:18px;align-items:baseline}
span{font-size:16px}
b{font-size:28px}`,
  size: { width: 545, height: 180 },
};

/** The figures now, each a patch. */
const figures: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, value: { type: 'string' }, note: { type: 'string' } } } } },
  },
  template: `<dl class="fg">{{#items}}<div><dt>{{label}}</dt><dd>{{value}}</dd><small>{{note}}</small></div>{{/items}}</dl>`,
  style: `.fg{margin:0;height:100%;box-sizing:border-box;display:grid;grid-template-columns:repeat(3,1fr);gap:14px;font-family:${TEXT};color:${THREAD}}
div{display:grid;align-content:center;justify-items:center;text-align:center;background:#fbf6e8;border:${running(THREAD)};outline:4px solid #fbf6e8;box-shadow:0 0 0 6px ${HONEY}}
dt{font-size:13px;font-weight:700}
dd{margin:0;font:700 30px ${SERIF};color:#7a4e0c}
small{font-size:12px}`,
  size: { width: 545, height: 130 },
};

/** The key to the combs. */
const legend: ElementDefinition = {
  render: 'template',
  props: { type: 'object', properties: {} },
  template: `<ul class="lg"><li><i class="ok"></i>꽉 찬 벌집 — 양호</li><li><i class="watch"></i>반 찬 벌집 — 주의</li><li><i class="alarm">✕</i>빈 벌집 ✕ — 여왕 없음</li></ul>`,
  style: `.lg{height:100%;box-sizing:border-box;margin:0;padding:0 16px;list-style:none;display:flex;align-items:center;justify-content:space-between;background:#fbf6e8;border:${running(THREAD)};font:700 14px ${TEXT};color:${THREAD}}
li{display:flex;align-items:center;gap:8px}
i{width:24px;height:21px;clip-path:${HEX};display:grid;place-items:center;font-style:normal;font-size:14px}
.ok{background:${stitches(HONEY)},${THREAD}}
.watch{background:linear-gradient(to bottom,#fbf6e8 0 48%,transparent 48%),${stitches(HONEY)},#fbf6e8;box-shadow:inset 0 0 0 2px ${THREAD}}
.alarm{background:#f7dcd8;color:${RED}}`,
  size: { width: 545, height: 56 },
};

// ── The board ──────────────────────────────────────────────────────────────────────────────────────────────────

const node = (id: string, x: number, y: number, width: number, height: number, widget: Widget): Node => ({ id, x, y, width, height, anchored: false, widget });

const HIVES = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'h7', 'h8'] as const;

const nodes: Node[] = [
  ...HIVES.map((id, i) =>
    node(`hive-${id}`, 60 + (i % 4) * 240, 52 + Math.floor(i / 4) * 246, 220, 220, { type: 'element:hoop', props: { h: {} }, bindings: { h: bind('/apiary/hives', `/value/${id}`) } })
  ),
  node('harvest', 44, 560, 600, 400, { type: 'element:harvest', props: { items: [] }, bindings: { items: bind('/apiary/harvest', '/value') } }),
  node('flowers', 664, 560, 330, 400, { type: 'element:flowers', props: { items: [] }, bindings: { items: bind('/apiary/flowers', '/value') } }),
  node('title', 1020, 44, 545, 180, { type: 'element:title', props: { t: {} }, bindings: { t: bind('/apiary/now', '/value') } }),
  node('figures', 1020, 246, 545, 130, { type: 'element:figures', props: { items: [] }, bindings: { items: bind('/apiary/figures', '/value') } }),
  node('legend', 1020, 394, 545, 56, { type: 'element:legend', props: {} }),
  node('weight', 1040, 490, 505, 450, {
    type: 'chart.line',
    props: {
      title: '벌통 평균 무게(kg) — 이번 주, 21일부터 먹이',
      data: [],
      mapping: { x: 'day', y: 'kg' },
      options: { valueAxisZero: false, series: [{ label: '평균 무게', color: HONEY }] },
    },
    bindings: { data: bind('/apiary/weight', '/value') },
  }),
];

const document: CanvasView = {
  kind: 'canvas',
  appearance: 'light',
  accent: HONEY,
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes,
  connectors: [],
  elements: { hoop, harvest, flowers, title, figures, legend },
};

export const apiaryStitch: SamplePack = {
  id: 'apiary-stitch',
  title: { ko: '양봉장의 가을 — 십자수', en: 'An apiary’s autumn — cross-stitch' },
  field: { ko: '양봉·농촌', en: 'Beekeeping & farming' },
  kind: { ko: '벌통 상태·채밀·밀원·무게', en: 'Hives, harvests, forage and weight' },
  summary: {
    ko: '양봉장의 가을을 십자수로 — 올이 보이는 크림색 아이다 천에 벌통마다 나무 수틀 하나, 그 안에 번호와 무게가 수놓입니다. 벌통 상태는 색과 함께 수틀 위에 놓은 벌집 한 칸으로: 군세가 좋으면 십자 땀으로 꽉 찬 벌집, 먹이가 모자라거나 응애가 늘면 반만 찬 벌집, 여왕이 없으면 빈 벌집에 붉은 ✕. 아래에는 올해 채밀과 겨울 전 남은 일을 자수 견본처럼, 그 옆에 벌이 닿는 꽃, 오른쪽에 수놓은 테두리 속 양봉장 이름, 지금 수치, 범례, 이번 주 벌통 평균 무게. 양봉장은 지어낸 것이라 예시 데이터입니다.',
    en: 'An apiary’s autumn worked in cross-stitch — cream Aida cloth with its weave showing, every hive an embroidery hoop with its number and weight stitched inside. A hive tells its state by the honeycomb stitched at the top of its hoop, as well as by colour: a comb filled with cross stitches when the colony is sound, half filled when it is short of food or its mites are rising, an empty comb crossed in red when its queen is missing. Below, a sampler of the year’s harvests and the work left before winter, and the flowers the bees can still reach; on the right the apiary’s name in a stitched border, the figures now, the key and the average hive weight through the week. The apiary is made up. Example data.',
  },
  connectors: [APIARY],
  document,
  snapshot,
};
