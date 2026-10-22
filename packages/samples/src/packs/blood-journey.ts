import type { Binding, CanvasView, Connector, ElementDefinition, Node, Shape, Widget } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { svgDataUrl } from '../frame.js';
import { snapshot } from '../snapshots/blood-journey.js';

// A day of the blood supply told as an infographic, the kind printed on a poster or put on a lobby screen: a
// headline and the stock in days with the national level it sets, then the five steps a donation goes through —
// given, tested, separated, stored, supplied — each a large number, an arrow to the next — and below them the stock
// by blood type against the five days the supply aims for, who gave today, and the last thirty days of stock. A
// canvas with no plan behind it: the story's order is its layout. No public source carries a supply's day this way,
// so the values are example data written for the board.

export const BLOOD: ExampleSampleConnector = {
  key: 'blood',
  name: '예시 혈액 수급 API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 혈액 수급 현황이 아닙니다' },
};

/** The figures are summed every ten minutes; an hour without a sum is a source that has stopped. */
const MAX_AGE_SECONDS = 60 * 60;

const bind = (path: string, valuePath: string, map?: Binding['map']): Binding => ({
  adapter: BLOOD.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
  ...(map ? { map } : {}),
});

const today = (valuePath: string, map?: Binding['map']) => bind('/blood/today', valuePath, map);

/** The national stock levels by days of supply — five days or more is enough, then 관심 · 주의 · 경계 · 심각. */
const LEVEL = {
  ranges: [
    { max: 1, value: 'critical' },
    { min: 1, max: 2, value: 'alert' },
    { min: 2, max: 3, value: 'caution' },
    { min: 3, max: 5, value: 'watch' },
    { min: 5, value: 'enough' },
  ],
};
const LEVEL_TEXT = {
  ranges: [
    { max: 1, value: '심각' },
    { min: 1, max: 2, value: '경계' },
    { min: 2, max: 3, value: '주의' },
    { min: 3, max: 5, value: '관심' },
    { min: 5, value: '적정' },
  ],
};

const STEP_WIDTH = 184;
const SERIF = "Georgia,'Times New Roman',serif";
const INK = '#1c1917';
const RED = '#b91c1c';

/** The headline: what the board is about, and today's donors as the number to remember. */
const masthead: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['donors'],
    properties: { donors: { type: 'number', description: 'People who gave blood today so far.' }, asOf: { type: 'string' } },
  },
  template: `<header class="mast">
  <span class="kicker">오늘의 혈액 수급 · {{asOf}} 기준</span>
  <h1>혈액 한 팩이 환자에게 닿기까지</h1>
  <p><b>{{donors | grouped:0}}</b>명이 오늘 팔을 걷었습니다</p>
</header>`,
  style: `.mast{height:100%;box-sizing:border-box;display:grid;align-content:center;gap:6px;color:${INK};font-family:var(--u-widget-font-family)}
.kicker{font-size:13px;font-weight:700;letter-spacing:.08em;color:${RED}}
h1{margin:0;font-family:${SERIF};font-size:36px;line-height:1.1;font-weight:700;letter-spacing:-.01em}
p{margin:0;font-size:17px;color:#57534e}
p b{font-family:${SERIF};font-size:30px;color:${RED};font-variant-numeric:tabular-nums;margin-right:2px}`,
  size: { width: 640, height: 130 },
};

/** The stock in days, the level it sets, and where it sits on the five-step scale. */
const stock: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['days', 'level', 'levelText'],
    properties: {
      days: { type: 'number', description: 'Red cells in stock, in days of supply.' },
      level: { enum: ['enough', 'watch', 'caution', 'alert', 'critical'] },
      levelText: { type: 'string' },
    },
  },
  template: `<section class="stock {{level}}" style="--d: {{days}}">
  <span class="label">혈액 보유량</span>
  <div class="row"><b>{{days | fixed:1}}</b><span>일분</span><em>{{levelText}}</em></div>
  <div class="scale" role="img" aria-label="보유 {{days}}일분, {{levelText}} 단계">
    <i class="s1">심각</i><i class="s2">경계</i><i class="s3">주의</i><i class="s4">관심</i><i class="s5">적정</i>
    <span class="mark"></span>
  </div>
  <small>적정 보유량은 5일분 이상입니다</small>
</section>`,
  style: `.stock{--c:#15803d;height:100%;box-sizing:border-box;display:grid;align-content:center;gap:8px;padding:16px 20px;border-radius:14px;background:#fff;border:1px solid #e7e5e4;color:${INK};font-family:var(--u-widget-font-family)}
.watch{--c:#ca8a04}.caution{--c:#ea580c}.alert{--c:#dc2626}.critical{--c:#7f1d1d}
.label{font-size:13px;font-weight:700;color:#78716c}
.row{display:flex;align-items:baseline;gap:6px}
.row b{font-family:${SERIF};font-size:44px;line-height:1;font-variant-numeric:tabular-nums}
.row span{font-size:15px;color:#57534e}
.row em{margin-left:auto;font-style:normal;font-size:14px;font-weight:700;color:#fff;background:var(--c);padding:3px 12px;border-radius:999px}
.scale{position:relative;display:grid;grid-template-columns:1fr 1fr 1fr 2fr 2fr;gap:2px;padding-top:12px}
.scale i{font-style:normal;font-size:11px;text-align:center;padding:3px 0;color:#fff}
.s1{background:#7f1d1d}.s2{background:#dc2626}.s3{background:#ea580c}.s4{background:#ca8a04}.s5{background:#15803d}
.mark{position:absolute;top:0;left:calc(min(var(--d),7) / 7 * 100%);width:0;height:0;transform:translateX(-6px);border-left:6px solid transparent;border-right:6px solid transparent;border-top:9px solid ${INK}}
small{font-size:12px;color:#78716c}`,
  size: { width: 400, height: 170 },
};

/** One step of the journey: its number, its name, the figure, and a sentence that says what happens there. */
const step: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['no', 'title', 'value', 'unit', 'caption'],
    properties: {
      no: { type: 'string' },
      title: { type: 'string' },
      value: { type: 'number' },
      unit: { type: 'string' },
      caption: { type: 'string' },
    },
  },
  template: `<article class="step">
  <span class="no">{{no}}</span>
  <h2>{{title}}</h2>
  <p class="figure"><b>{{value | grouped:0}}</b><span>{{unit}}</span></p>
  <p class="caption">{{caption}}</p>
</article>`,
  style: `.step{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto auto auto 1fr;gap:4px;padding:16px 18px;border-radius:14px;background:#fff;border:1px solid #e7e5e4;border-top:4px solid ${RED};color:${INK};font-family:var(--u-widget-font-family)}
.no{font-family:${SERIF};font-size:15px;font-weight:700;color:${RED}}
h2{margin:0;font-size:18px}
.figure{margin:6px 0 0;display:flex;align-items:baseline;gap:4px;white-space:nowrap}
.figure b{font-family:${SERIF};font-size:32px;line-height:1;font-variant-numeric:tabular-nums}
.figure span{font-size:14px;color:#57534e}
.caption{margin:4px 0 0;font-size:13px;line-height:1.45;color:#57534e}`,
  size: { width: STEP_WIDTH, height: 196 },
};

/** One donation, three patients — a drop and the three people it can reach, drawn from the board's symbols. */
const fact: ElementDefinition = {
  render: 'template',
  props: { type: 'object', properties: {} },
  template: `<aside class="fact">
  <svg class="drop" viewBox="0 0 24 32" aria-hidden="true"><use href="#drop"/></svg>
  <span class="eq">=</span>
  <div class="people" aria-hidden="true"><svg viewBox="0 0 24 32"><use href="#person"/></svg><svg viewBox="0 0 24 32"><use href="#person"/></svg><svg viewBox="0 0 24 32"><use href="#person"/></svg></div>
  <p>한 번의 헌혈은 적혈구·혈장·혈소판으로 나뉘어 <b>최대 세 명</b>의 환자에게 갑니다</p>
</aside>`,
  style: `.fact{height:100%;box-sizing:border-box;display:grid;grid-template-columns:auto auto 1fr;align-items:center;column-gap:10px;padding:16px 18px;border-radius:14px;background:${RED};color:#fff;font-family:var(--u-widget-font-family)}
.drop{width:34px;height:46px;fill:#fff}
.eq{font-family:${SERIF};font-size:30px;opacity:.85}
.people{display:flex;gap:4px}
.people svg{width:26px;height:36px;fill:#fecaca}
p{grid-column:1/-1;margin:10px 0 0;font-size:14px;line-height:1.5}
p b{font-weight:800}`,
  size: { width: 300, height: 150 },
};

const DROP = '<path d="M12 1 C12 1 2 14 2 21 a10 10 0 0 0 20 0 C22 14 12 1 12 1 Z"/>';
const PERSON = '<circle cx="12" cy="7" r="6"/><path d="M1 32 v-8 a11 11 0 0 1 22 0 v8 Z"/>';

// ── The page ──────────────────────────────────────────────────────────────────────────────────────────────────────

const WIDTH = 1200;
const HEIGHT = 820;
const STEP_Y = 210;
/** Five cards across the page with room between them for the arrows to read as arrows. */
const STEP_X = Array.from({ length: 5 }, (_, i) => 40 + i * (STEP_WIDTH + 50));

const node = (id: string, x: number, y: number, width: number, height: number, widget: Widget): Node => ({ id, x, y, width, height, anchored: false, widget });

const STEPS = [
  { id: 'donate', no: '01', title: '헌혈', field: '/donated', unit: '건', caption: '헌혈의 집과 헌혈버스에서 오늘 받은 전혈·성분헌혈.' },
  { id: 'test', no: '02', title: '검사', field: '/passed', unit: '건 적격', caption: '혈액형과 감염 표지자를 검사해 적격 혈액만 넘깁니다.' },
  { id: 'separate', no: '03', title: '제제', field: '/units', unit: '단위', caption: '적혈구·혈장·혈소판으로 나눠, 한 건이 두세 단위가 됩니다.' },
  { id: 'store', no: '04', title: '보관', field: '/stockUnits', unit: '단위', caption: '혈액원에 있는 양. 적혈구는 35일, 혈소판은 5일까지.' },
  { id: 'supply', no: '05', title: '공급', field: '/supplied', unit: '단위', caption: '오늘 병원으로 나간 양 — 응급·수술·항암 치료에.' },
];

const stepNode = ({ id, no, title, field, unit, caption }: (typeof STEPS)[number], i: number): Node =>
  node(id, STEP_X[i], STEP_Y, STEP_WIDTH, 196, {
    type: 'element:step',
    props: { no, title, value: 0, unit, caption },
    bindings: { value: today(field) },
  });

/** The story's arrows — the cards carry the numbers, the arrows only the order to read them in. */
const CONNECTORS: Connector[] = STEPS.slice(1).map((to, i) => ({
  id: `flow-${STEPS[i].id}`,
  fromNodeId: STEPS[i].id,
  toNodeId: to.id,
  style: { stroke: RED, strokeWidth: 3, arrow: 'end' },
}));

const BOTTOM_Y = 470;

const nodes: Node[] = [
  node('masthead', 40, 30, 640, 130, { type: 'element:masthead', props: { donors: 0, asOf: '' }, bindings: { donors: today('/donors'), asOf: today('/asOf') } }),
  node('stock', 760, 24, 400, 170, {
    type: 'element:stock',
    props: { days: 0, level: 'enough', levelText: '' },
    bindings: { days: today('/stockDays'), level: today('/stockDays', LEVEL), levelText: today('/stockDays', LEVEL_TEXT) },
  }),
  ...STEPS.map(stepNode),
  node('by-type', 40, BOTTOM_Y, 440, 310, {
    type: 'chart.bar',
    props: {
      title: '혈액형별 보유량 (일분)',
      data: [],
      mapping: { x: 'type', y: 'days' },
      options: { horizontal: true, referenceLines: [{ axis: 'x', value: 5, label: '적정 5일', style: 'dashed' }], series: [{ label: '보유량', color: RED }] },
    },
    bindings: { data: bind('/blood/types', '/value') },
  }),
  node('donors', 510, BOTTOM_Y, 320, 310, {
    type: 'chart.pie',
    props: { title: '오늘 헌혈자 연령대', data: [], mapping: { label: 'age', value: 'share' }, options: { donut: true, showLabel: false, legend: true } },
    bindings: { data: bind('/blood/ages', '/value') },
  }),
  node('fact', 860, BOTTOM_Y, 300, 150, { type: 'element:fact', props: {} }),
  node('trend', 860, BOTTOM_Y + 166, 300, 144, {
    type: 'chart.area',
    props: {
      title: '지난 30일 보유량 (일분)',
      data: [],
      mapping: { x: 'date', y: 'days' },
      options: { smooth: true, valueAxisZero: false, referenceLines: [{ axis: 'y', value: 5, style: 'dashed' }], series: [{ label: '보유량', color: RED }] },
    },
    bindings: { data: bind('/blood/trend', '/value') },
  }),
];

const DECORATIONS: Shape[] = [
  { id: 'journey-label', type: 'text', x: 40, y: 184, text: '한 팩의 여정', fontSize: 13, fill: '#a8a29e' },
  { id: 'detail-label', type: 'text', x: 40, y: BOTTOM_Y - 26, text: '들여다보기', fontSize: 13, fill: '#a8a29e' },
];

/** Warm paper, a thin rule under the headline, and a soft red band the five steps sit on. */
function paper(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<rect width="${WIDTH}" height="${HEIGHT}" fill="#faf7f2"/>
<path d="M 40 176 H ${WIDTH - 40}" stroke="#d6d3d1" stroke-width="1"/>
<rect x="20" y="${STEP_Y - 14}" width="${WIDTH - 40}" height="224" rx="20" fill="#fee2e2" opacity=".55"/>
<path d="M 40 ${BOTTOM_Y - 46} H ${WIDTH - 40}" stroke="#d6d3d1" stroke-width="1"/>
</svg>`;
  return svgDataUrl(svg);
}

const document: CanvasView = {
  kind: 'canvas',
  background: { image: { src: paper(), width: WIDTH, height: HEIGHT } },
  accent: RED,
  nodes,
  connectors: CONNECTORS,
  decorations: DECORATIONS,
  elements: { masthead, stock, step, fact },
  symbols: { drop: { viewBox: '0 0 24 32', markup: DROP }, person: { viewBox: '0 0 24 32', markup: PERSON } },
};

export const bloodJourney: SamplePack = {
  id: 'blood-journey',
  title: { ko: '혈액 한 팩의 여정 — 인포그래픽', en: 'The journey of a blood bag — an infographic' },
  field: { ko: '공공·보건의료', en: 'Public health' },
  kind: { ko: '없음 — 인포그래픽(이야기 순서)', en: 'None — infographic (the story’s order)' },
  domain: 'health',
  styles: ['print'],
  summary: {
    ko: '포스터처럼 읽는 하루의 혈액 수급 — 큰 제목과 오늘 헌혈자 수, 보유량 일수와 그것이 정하는 단계, 헌혈·검사·제제·보관·공급 다섯 단계를 화살표로 잇는 큰 숫자, 적정 5일과 견준 혈액형별 보유량, 헌혈자 연령대, 지난 30일 보유량. 예시 데이터입니다.',
    en: 'A day of the blood supply read like a poster — a headline with today’s donors, the stock in days and the level it sets, the five steps from donation to hospital as large numbers the arrows read in order, the stock by blood type against five days, who gave today, and the last thirty days of stock. Example data.',
  },
  connectors: [BLOOD],
  document,
  snapshot,
};
