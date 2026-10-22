import type { Binding, CanvasView, ElementDefinition, Node, Widget } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { svgDataUrl } from '../frame.js';
import { snapshot } from '../snapshots/winery-engraving.js';

// A winery's harvest-time cellar drawn as a copperplate engraving: sepia ink on cream, every shade laid in hatched and
// cross-hatched lines, a ruled border with corner flourishes, and serif lettering. Above, the fermentation hall — six
// tanks, each engraved with the wine inside at its level; below, the barrel cellar — eight barrels with their wine and
// their months in oak. A tank tells its state by a small engraved vignette as well as by the ink: rising bubbles while
// it ferments, an hourglass while it rests, a thermometer when it runs warm, a cross when it stands empty for cleaning.
// On the right the cartouche with the winery's name, the figures now, the key, the day's work and the temperatures of
// two fermenting tanks through the day. The winery is made up, so the values are example data.

export const CELLAR: ExampleSampleConnector = {
  key: 'cellar',
  name: '예시 와이너리 API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 와이너리가 아닙니다' },
};

/** The tank probes report every few minutes; half an hour of silence is a probe that has stopped. */
const MAX_AGE_SECONDS = 30 * 60;

const bind = (path: string, valuePath: string): Binding => ({
  adapter: CELLAR.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
});

const WIDTH = 1600;
const HEIGHT = 1000;
const CREAM = '#f3ead6';
const SEPIA = '#3b2a1a';
const SEPIA_SOFT = '#7a6248';
const WINE = '#6e1f2c';
const WARM = '#b5361f';
const SERIF = '"Nanum Myeongjo", "Noto Serif KR", "Batang", serif';

/** Engraved shading: lines at one angle, and cross-hatched for the deeper tone. */
const hatch = (colour: string, angle = 45, gap = 5) => `repeating-linear-gradient(${angle}deg,${colour} 0 1px,transparent 1px ${gap}px)`;
const crossHatch = (colour: string) => `${hatch(colour, 45, 5)},${hatch(colour, -45, 5)}`;

// ── The plate ──────────────────────────────────────────────────────────────────────────────────────────────────

function drawing(): string {
  const flourish = (x: number, y: number, sx: number, sy: number) =>
    `<path transform="translate(${x} ${y}) scale(${sx} ${sy})" d="M0 0 C 30 0 40 10 40 30 M0 0 C 0 30 10 40 30 40 M8 8 C 22 8 26 14 26 26 M8 8 C 8 22 14 26 26 26" stroke="${SEPIA}" stroke-width="1.6" fill="none"/>`;
  const hatchLines: string[] = [];
  for (let x = -1000; x < WIDTH; x += 7) hatchLines.push(`<path d="M${x} 1000 L ${x + 1000} 0" stroke="#e6d9bd" stroke-width="1"/>`);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<defs><clipPath id="plate"><rect x="20" y="20" width="${WIDTH - 40}" height="${HEIGHT - 40}"/></clipPath></defs>
<rect width="${WIDTH}" height="${HEIGHT}" fill="${CREAM}"/>
<g clip-path="url(#plate)" opacity=".7">${hatchLines.join('')}</g>
<rect x="20" y="20" width="${WIDTH - 40}" height="${HEIGHT - 40}" fill="none" stroke="${SEPIA}" stroke-width="3"/>
<rect x="30" y="30" width="${WIDTH - 60}" height="${HEIGHT - 60}" fill="none" stroke="${SEPIA}" stroke-width="1"/>
${flourish(40, 40, 1, 1)}${flourish(WIDTH - 40, 40, -1, 1)}${flourish(40, HEIGHT - 40, 1, -1)}${flourish(WIDTH - 40, HEIGHT - 40, -1, -1)}
<rect x="52" y="60" width="940" height="44" fill="${CREAM}"/>
<text x="522" y="92" font-family="Batang, serif" font-size="26" font-style="italic" fill="${SEPIA}" text-anchor="middle" letter-spacing="8">발 효 실</text>
<path d="M140 82 H 400 M644 82 H 904" stroke="${SEPIA}" stroke-width="1"/>
<rect x="52" y="566" width="940" height="44" fill="${CREAM}"/>
<text x="522" y="598" font-family="Batang, serif" font-size="26" font-style="italic" fill="${SEPIA}" text-anchor="middle" letter-spacing="8">숙 성 셀 러</text>
<path d="M140 588 H 390 M654 588 H 904" stroke="${SEPIA}" stroke-width="1"/>
<rect x="1030" y="640" width="520" height="312" fill="${CREAM}" stroke="${SEPIA}" stroke-width="1"/>
</svg>`;
  return svgDataUrl(svg);
}

// ── Elements ───────────────────────────────────────────────────────────────────────────────────────────────────

/** A fermentation tank, the wine engraved at its level — read from `k`. */
const tank: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['k'], properties: { k: { type: 'object' } } },
  template: `<article class="tk {{k.state}}"><div class="vessel" style="--v: {{k.level}}"><span class="wine"></span><i></i></div><h3>{{k.name}}</h3><small>{{k.grape}}</small><dl><dt>온도</dt><dd>{{k.temp}}</dd><dt>당도</dt><dd>{{k.brix}}</dd></dl><em>{{k.word}}</em></article>`,
  style: `.tk{height:100%;box-sizing:border-box;display:grid;grid-template-rows:1fr auto auto auto auto;justify-items:center;gap:3px;font-family:${SERIF};color:${SEPIA};text-align:center}
.vessel{position:relative;width:96px;height:100%;min-height:150px;box-sizing:border-box;border:2px solid ${SEPIA};border-radius:46px 46px 6px 6px / 26px 26px 6px 6px;background:${hatch('#cdbb98', 90, 6)},${CREAM};overflow:hidden}
.wine{position:absolute;left:0;right:0;bottom:0;height:calc(var(--v) * 1%);background:${crossHatch(WINE)};border-top:2px solid ${WINE}}
i{position:absolute;left:50%;top:18px;transform:translateX(-50%);display:grid;place-items:center;width:34px;height:34px;border-radius:50%;background:${CREAM};border:1.5px solid ${SEPIA};font:700 16px ${SERIF};font-style:normal}
h3{margin:4px 0 0;font-size:18px;font-weight:800}
small{font-size:13px;font-style:italic;color:${SEPIA_SOFT}}
dl{margin:0;display:grid;grid-template-columns:auto auto;column-gap:8px;font-size:13px}
dt{color:${SEPIA_SOFT}}
dd{margin:0;font-weight:800}
em{font-size:13px;font-weight:800;font-style:normal;border-top:1px solid ${SEPIA};padding-top:2px}
.fermenting i::before{content:"∘°"}
.resting i::before{content:"⧗"}
.warm i{background:${WARM};color:${CREAM};border-color:${WARM}}
.warm i::before{content:"▲"}
.warm em,.warm dd:first-of-type{color:${WARM}}
.empty .vessel{background:${CREAM}}
.empty i::before{content:"✕"}
.empty em{color:${SEPIA_SOFT}}`,
  size: { width: 140, height: 430 },
};

/** A barrel in the cellar — read from `b`. */
const barrel: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['b'], properties: { b: { type: 'object' } } },
  template: `<article class="br {{b.state}}"><div class="end"><b>{{b.no}}</b></div><p>{{b.wine}}</p><small>{{b.months}}</small></article>`,
  style: `.br{height:100%;box-sizing:border-box;display:grid;grid-template-rows:1fr auto auto;justify-items:center;gap:2px;font-family:${SERIF};color:${SEPIA};text-align:center}
.end{position:relative;width:96px;height:96px;box-sizing:border-box;border-radius:50%;border:2px solid ${SEPIA};display:grid;place-items:center;background:radial-gradient(circle,transparent 0 30px,${SEPIA} 30px 31.5px,transparent 31.5px 38px,${SEPIA} 38px 39.5px,transparent 39.5px),${hatch('#b49b74', 0, 5)},${CREAM}}
b{font-size:16px;font-weight:800;background:${CREAM};padding:0 4px}
p{margin:2px 0 0;font-size:14px;font-weight:800}
small{font-size:12px;font-style:italic;color:${SEPIA_SOFT}}
.topping .end{box-shadow:0 0 0 3px ${CREAM},0 0 0 5px ${WINE}}
.topping small{color:${WINE};font-weight:800}
.ready .end{background:radial-gradient(circle,transparent 0 30px,${SEPIA} 30px 31.5px,transparent 31.5px 38px,${SEPIA} 38px 39.5px,transparent 39.5px),${crossHatch(WINE)},${CREAM}}`,
  size: { width: 110, height: 150 },
};

/** The winery's name in its cartouche. */
const title: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['t'], properties: { t: { type: 'object' } } },
  template: `<header class="ct"><small>{{t.series}}</small><h1>{{t.name}}</h1><div><span>{{t.date}}</span><b>{{t.time}}</b></div></header>`,
  style: `.ct{height:100%;box-sizing:border-box;display:grid;align-content:center;justify-items:center;gap:4px;padding:12px 28px;border:2px solid ${SEPIA};border-radius:60px/30px;background:${CREAM};box-shadow:inset 0 0 0 5px ${CREAM},inset 0 0 0 6px ${SEPIA};font-family:${SERIF};color:${SEPIA};text-align:center}
small{font-size:13px;font-style:italic;letter-spacing:.2em}
h1{margin:0;font-size:38px;font-weight:800;letter-spacing:.1em}
div{display:flex;gap:18px;align-items:baseline}
span{font-size:15px}
b{font-size:22px;color:${WINE}}`,
  size: { width: 520, height: 160 },
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
  style: `.fg{margin:0;height:100%;box-sizing:border-box;display:grid;grid-template-columns:repeat(3,1fr);gap:12px;font-family:${SERIF};color:${SEPIA}}
div{display:grid;align-content:center;justify-items:center;text-align:center;background:${CREAM};border-top:3px double ${SEPIA};border-bottom:3px double ${SEPIA}}
dt{font-size:13px;font-style:italic}
dd{margin:0;font-size:30px;font-weight:800;color:${WINE}}
small{font-size:12px}`,
  size: { width: 520, height: 106 },
};

/** The key to the vignettes. */
const legend: ElementDefinition = {
  render: 'template',
  props: { type: 'object', properties: {} },
  template: `<ul class="ky"><li><i>∘°</i>발효 중</li><li><i>⧗</i>안정</li><li><i class="warm">▲</i>온도 높음</li><li><i>✕</i>비움·세척</li></ul>`,
  style: `.ky{height:100%;box-sizing:border-box;margin:0;padding:0 18px;list-style:none;display:flex;align-items:center;justify-content:space-between;background:${CREAM};border:1px solid ${SEPIA};font:700 14px ${SERIF};color:${SEPIA}}
li{display:flex;align-items:center;gap:8px}
i{display:grid;place-items:center;width:26px;height:26px;border-radius:50%;border:1.5px solid ${SEPIA};font:700 13px ${SERIF};font-style:normal}
.warm{background:${WARM};color:${CREAM};border-color:${WARM}}`,
  size: { width: 520, height: 50 },
};

/** The day's work in the cellar. */
const work: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { time: { type: 'string' }, what: { type: 'string' }, where: { type: 'string' }, state: { type: 'string' } } } } },
  },
  template: `<section class="wk"><h2>오늘의 셀러 일</h2><ol>{{#items}}<li class="{{state}}"><b>{{time}}</b><span>{{what}}</span><small>{{where}}</small></li>{{/items}}</ol></section>`,
  style: `.wk{height:100%;box-sizing:border-box;padding:12px 20px;background:${CREAM};border:1px solid ${SEPIA};font-family:${SERIF};color:${SEPIA}}
h2{margin:0 0 8px;font-size:18px;font-weight:800;font-style:italic;border-bottom:1px solid ${SEPIA};padding-bottom:4px}
ol{margin:0;padding:0;list-style:none;display:grid;gap:5px}
li{display:grid;grid-template-columns:58px 1fr 90px;align-items:baseline;gap:10px;font-size:14px}
b{font-weight:800}
small{text-align:right;font-style:italic;color:${SEPIA_SOFT}}
.done{color:${SEPIA_SOFT};text-decoration:line-through;text-decoration-thickness:1px}
.now b::before{content:"☞ ";color:${WINE}}
.now span{font-weight:800;color:${WINE}}`,
  size: { width: 520, height: 192 },
};

// ── The board ──────────────────────────────────────────────────────────────────────────────────────────────────

const node = (id: string, x: number, y: number, width: number, height: number, widget: Widget): Node => ({ id, x, y, width, height, anchored: false, widget });

const TANKS = ['t1', 't2', 't3', 't4', 't5', 't6'] as const;
const BARRELS = ['b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7', 'b8'] as const;

const nodes: Node[] = [
  ...TANKS.map((id, i) =>
    node(`tank-${id}`, 64 + i * 154, 118, 140, 430, { type: 'element:tank', props: { k: {} }, bindings: { k: bind('/cellar/tanks', `/value/${id}`) } })
  ),
  ...BARRELS.map((id, i) =>
    node(`barrel-${id}`, 60 + (i % 8) * 116, 640, 110, 150, { type: 'element:barrel', props: { b: {} }, bindings: { b: bind('/cellar/barrels', `/value/${id}`) } })
  ),
  node('title', 1030, 44, 520, 160, { type: 'element:title', props: { t: {} }, bindings: { t: bind('/cellar/now', '/value') } }),
  node('figures', 1030, 218, 520, 106, { type: 'element:figures', props: { items: [] }, bindings: { items: bind('/cellar/figures', '/value') } }),
  node('legend', 1030, 338, 520, 50, { type: 'element:legend', props: {} }),
  node('work', 1030, 404, 520, 220, { type: 'element:work', props: { items: [] }, bindings: { items: bind('/cellar/work', '/value') } }),
  node('temps', 1040, 650, 500, 292, {
    type: 'chart.line',
    props: {
      title: '발효 온도 — 오늘 (°C)',
      data: [],
      mapping: { x: 'hour', y: ['t1', 't3'] },
      options: { valueAxisZero: false, series: [{ label: '1번 탱크', color: WINE }, { label: '3번 탱크', color: WARM }] },
    },
    bindings: { data: bind('/cellar/temps', '/value') },
  }),
  node('cellar-note', 52, 810, 940, 140, { type: 'element:note', props: { n: {} }, bindings: { n: bind('/cellar/note', '/value') } }),
];

/** The cellar master's note at the foot of the plate — read from `n`. */
const note: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['n'], properties: { n: { type: 'object' } } },
  template: `<aside class="nt"><dl><div><dt>셀러 온도</dt><dd>{{n.cellar}}</dd></div><div><dt>셀러 습도</dt><dd>{{n.humidity}}</dd></div><div><dt>올해 수확</dt><dd>{{n.harvest}}</dd></div><div><dt>다음 병입</dt><dd>{{n.bottling}}</dd></div></dl><p>{{n.text}}</p></aside>`,
  style: `.nt{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr;gap:8px;padding:12px 22px;background:${CREAM};border:1px solid ${SEPIA};font-family:${SERIF};color:${SEPIA}}
dl{margin:0;display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
div{border-left:2px solid ${SEPIA};padding-left:10px}
dt{font-size:12px;font-style:italic;color:${SEPIA_SOFT}}
dd{margin:0;font-size:20px;font-weight:800}
p{margin:0;font-size:14px;font-style:italic;align-self:center}`,
  size: { width: 940, height: 140 },
};

const document: CanvasView = {
  kind: 'canvas',
  appearance: 'light',
  accent: WINE,
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes,
  connectors: [],
  elements: { tank, barrel, title, figures, legend, work, note },
};

export const wineryEngraving: SamplePack = {
  id: 'winery-engraving',
  title: { ko: '와이너리의 수확철 — 동판화', en: 'A winery at harvest — a copperplate engraving' },
  field: { ko: '와인 양조', en: 'Winemaking' },
  kind: { ko: '발효 탱크·숙성 오크통·셀러 일', en: 'Fermentation tanks, barrels and the cellar’s work' },
  domain: 'agrifood',
  styles: ['print'],
  summary: {
    ko: '수확철 와이너리 셀러를 동판화로 — 크림 종이에 세피아 잉크, 모든 음영을 빗금과 교차 빗금으로, 괘선 테두리와 모서리 덩굴, 명조 글자. 위는 발효실 — 탱크 여섯, 안의 와인을 그 높이까지 새김; 아래는 숙성 셀러 — 오크통 여덟, 와인과 오크에 든 달 수. 탱크 상태는 잉크와 함께 작은 새김 그림으로: 발효 중이면 오르는 기포, 안정되면 모래시계, 온도가 높으면 붉은 온도 표시, 비워 세척 중이면 ✕. 오른쪽에 와이너리 이름 카르투슈, 지금 수치, 범례, 오늘의 셀러 일, 두 탱크의 오늘 발효 온도. 와이너리는 지어낸 것이라 예시 데이터입니다.',
    en: 'A winery’s cellar at harvest drawn as a copperplate engraving — sepia ink on cream, every shade laid in hatching and cross-hatching, a ruled border with corner flourishes, serif lettering. Above, the fermentation hall — six tanks, the wine inside engraved at its level; below, the barrel cellar — eight barrels with their wine and their months in oak. A tank tells its state with a small engraved vignette as well as by the ink: rising bubbles while it ferments, an hourglass when it rests, a red mark when it runs warm, a cross when it stands empty for cleaning. On the right the cartouche with the winery’s name, the figures now, the key, the day’s work in the cellar and two tanks’ fermentation temperatures through the day. The winery is made up. Example data.',
  },
  connectors: [CELLAR],
  document,
  snapshot,
};
