import type { Binding, CanvasView, ComponentDefinition, ElementDefinition, Node, Widget } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { snapshot, LOTS } from '../snapshots/wafer-maps.js';

// A fab's probe results for two lots, laid out as a figure in a paper is: every wafer the same small map, side by side
// in the order the lot ran — each die a cell coloured by the bin the tester put it in, good dice a quiet grey and each
// failing bin a colour of its own from a palette colour-blind readers can tell apart — with the wafer's yield and the
// pattern its failures make under it. Beside the figure the bins' legend, the lots' yields and what the engineer
// noted; under it the failures by bin and the yield of the last twelve lots. Scientific: white, hairlines, small type,
// one figure caption. The wafer map is a component, drawn once and placed for each wafer. No public source carries a
// fab's probe results, so the values are example data written for the board.

export const FAB: ExampleSampleConnector = {
  key: 'fab',
  name: '예시 웨이퍼 검사 API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 팹이 아닙니다' },
};

/** The probe results are posted as each lot finishes; a day without one is a source that has stopped. */
const MAX_AGE_SECONDS = 24 * 60 * 60;

const bind = (path: string, valuePath: string): Binding => ({
  adapter: FAB.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
});

/** One field of the wafer an instance is given — `{{wafer}}` is its id. */
const bindWafer = (field: string): Binding => ({
  adapter: FAB.key,
  ref: { path: '/fab/wafers', item: { list: '/value', where: { id: '{{wafer}}' } }, valuePath: `/${field}`, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
});

const INK = '#111111';
const GREY = '#666666';
const GOOD = '#dcdcdc';
// Okabe–Ito: failing bins a colour-blind reader can tell apart.
const BIN3 = '#E69F00';
const BIN4 = '#D55E00';
const BIN5 = '#0072B2';
const BIN6 = '#CC79A7';
const FONT = 'var(--u-widget-font-family)';
const MONO = 'ui-monospace, "Cascadia Mono", Consolas, monospace';

// ── Elements ────────────────────────────────────────────────────────────────────────────────────────────────────

/** The figure's number and caption, set as a paper sets them. */
const caption: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['title'], properties: { title: { type: 'string' }, text: { type: 'string' }, stamp: { type: 'string' } } },
  template: `<header class="cp"><h1>{{title}}</h1><p>{{text}}</p><span>{{stamp}}</span></header>`,
  style: `.cp{height:100%;box-sizing:border-box;display:grid;grid-template-columns:1fr auto;align-content:end;column-gap:24px;row-gap:4px;border-bottom:1px solid ${INK};padding-bottom:10px;font-family:${FONT};color:${INK}}
h1{margin:0;font-size:24px;font-weight:600;letter-spacing:-.01em}
p{margin:0;grid-column:1;font-size:14px;color:${GREY};line-height:1.45}
span{grid-row:1 / 3;grid-column:2;align-self:end;font:12px ${MONO};color:${GREY}}`,
  size: { width: 1520, height: 84 },
};

/** One wafer: its dice on a 15 × 15 grid inside the wafer's circle, each the colour of its bin, with its name, yield
 *  and the pattern its failures make. */
const wafer: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['name', 'dice'],
    properties: {
      name: { type: 'string' },
      yield: { type: 'number' },
      pattern: { type: 'string' },
      flag: { enum: ['none', 'flagged'] },
      dice: { type: 'array', items: { type: 'object', properties: { b: { type: 'integer' } } } },
    },
  },
  template: `<figure class="wf {{flag}}"><div class="disc"><div class="grid">{{#dice}}<i class="b{{b}}"></i>{{/dice}}</div><span class="notch"></span></div><figcaption><b>{{name}}</b><span>{{yield | fixed:1}}%</span><em>{{pattern}}</em></figcaption></figure>`,
  style: `.wf{margin:0;height:100%;box-sizing:border-box;display:grid;grid-template-rows:1fr auto;gap:6px;font-family:${FONT};color:${INK}}
.disc{position:relative;justify-self:center;aspect-ratio:1;height:100%;max-width:100%;box-sizing:border-box;border:1px solid ${INK};border-radius:50%;display:grid;place-items:center;background:#fff}
.grid{width:86%;aspect-ratio:1;display:grid;grid-template-columns:repeat(15,1fr);gap:1px}
.notch{position:absolute;bottom:-1px;left:calc(50% - 6px);width:12px;height:5px;background:#fff;border:1px solid ${INK};border-bottom:0;border-radius:6px 6px 0 0}
i{display:block;aspect-ratio:1}
.b1{background:${GOOD}}
.b3{background:${BIN3}}
.b4{background:${BIN4}}
.b5{background:${BIN5}}
.b6{background:${BIN6}}
figcaption{display:grid;grid-template-columns:1fr auto;column-gap:6px;font-size:12px;line-height:1.35;white-space:nowrap}
figcaption b{font:600 11px ${MONO};overflow:hidden;text-overflow:ellipsis}
figcaption span{font:11px ${MONO};font-variant-numeric:tabular-nums}
figcaption em{grid-column:1 / -1;font-style:normal;color:${GREY}}
.flagged figcaption em{color:${BIN4};font-weight:600}`,
  size: { width: 156, height: 190 },
};

/** The bins' key: a swatch and what the tester means by it. */
const legend: ElementDefinition = {
  render: 'template',
  props: { type: 'object', properties: {} },
  template: `<dl class="lg"><div><dt class="b1"></dt><dd>빈 1 — 양품</dd></div><div><dt class="b3"></dt><dd>빈 3 — 누설 전류 초과</dd></div><div><dt class="b4"></dt><dd>빈 4 — 문턱 전압 이탈</dd></div><div><dt class="b5"></dt><dd>빈 5 — 기능 불량(연속 불량)</dd></div><div><dt class="b6"></dt><dd>빈 6 — 접촉 불량(재검사 대상)</dd></div></dl>`,
  style: `.lg{height:100%;box-sizing:border-box;margin:0;display:grid;align-content:start;gap:6px;font-family:${FONT};font-size:13px;color:${INK}}
.lg div{display:flex;align-items:center;gap:10px}
dt{width:14px;height:14px;flex:none}
dd{margin:0}
.b1{background:${GOOD}}
.b3{background:${BIN3}}
.b4{background:${BIN4}}
.b5{background:${BIN5}}
.b6{background:${BIN6}}`,
  size: { width: 480, height: 130 },
};

/** A row of figures, each a number and what it counts. */
const figures: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, value: { type: 'string' }, note: { type: 'string' } } } } },
  },
  template: `<dl class="fg">{{#items}}<div><dt>{{label}}</dt><dd>{{value}}</dd><small>{{note}}</small></div>{{/items}}</dl>`,
  style: `.fg{height:100%;box-sizing:border-box;margin:0;display:grid;grid-template-columns:repeat(3,1fr);gap:16px;font-family:${FONT};color:${INK}}
.fg div{border-top:1px solid ${INK};padding-top:8px;display:grid;align-content:start;gap:2px}
dt{font-size:12px;color:${GREY}}
dd{margin:0;font:600 28px ${MONO};font-variant-numeric:tabular-nums}
small{font-size:12px;color:${GREY};line-height:1.35}`,
  size: { width: 480, height: 120 },
};

/** The engineer's notes, numbered. */
const notes: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { title: { type: 'string' }, items: { type: 'array', items: { type: 'object', properties: { text: { type: 'string' } } } } },
  },
  template: `<section class="nt"><h2>{{title}}</h2><ol>{{#items}}<li>{{text}}</li>{{/items}}</ol></section>`,
  style: `.nt{height:100%;box-sizing:border-box;font-family:${FONT};color:${INK};border-top:1px solid ${INK};padding-top:8px}
h2{margin:0 0 6px;font-size:13px;font-weight:600}
ol{margin:0;padding-left:18px;display:grid;gap:6px;font-size:13px;line-height:1.5;word-break:keep-all}`,
  size: { width: 480, height: 200 },
};

/** A small heading over a row of wafers. */
const rowLabel: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['text'], properties: { text: { type: 'string' }, sub: { type: 'string' } } },
  template: `<p class="rl"><b>{{text}}</b> {{sub}}</p>`,
  style: `.rl{margin:0;height:100%;display:flex;align-items:end;gap:8px;font-family:${FONT};font-size:13px;color:${GREY}}
b{font:600 13px ${MONO};color:${INK}}`,
  size: { width: 980, height: 22 },
};

// ── The board ───────────────────────────────────────────────────────────────────────────────────────────────────

const waferComponent: ComponentDefinition = {
  params: { type: 'object', required: ['wafer'], properties: { wafer: { type: 'string' } } },
  nodes: [
    {
      id: 'map',
      x: 0,
      y: 0,
      widget: {
        type: 'element:wafer',
        props: { name: '{{wafer}}', yield: 0, pattern: '', flag: 'none', dice: [] },
        bindings: { yield: bindWafer('yield'), pattern: bindWafer('pattern'), flag: bindWafer('flag'), dice: bindWafer('dice') },
      },
    },
  ],
};

const node = (id: string, x: number, y: number, width: number, height: number, widget: Widget): Node => ({ id, x, y, width, height, anchored: false, widget });

const LEFT = 40;
const PITCH = 166;
const ROWS = [150, 380];

const nodes: Node[] = [
  node('caption', 40, 20, 1520, 84, {
    type: 'element:caption',
    props: { title: '', text: '', stamp: '' },
    bindings: { title: bind('/fab/figure', '/title'), text: bind('/fab/figure', '/text'), stamp: bind('/fab/figure', '/stamp') },
  }),
  ...LOTS.map((lot, i) =>
    node(`lot-${lot.id}`, LEFT, ROWS[i]! - 30, 980, 22, { type: 'element:row-label', props: { text: lot.id, sub: lot.note } }),
  ),
  node('legend', 1080, 120, 480, 130, { type: 'element:legend', props: {} }),
  node('figures', 1080, 262, 480, 120, { type: 'element:figures', props: { items: [] }, bindings: { items: bind('/fab/figures', '/value') } }),
  node('notes', 1080, 400, 480, 200, { type: 'element:notes', props: { title: '판독', items: [] }, bindings: { items: bind('/fab/notes', '/value') } }),
  node('pareto', 34, 620, 500, 260, {
    type: 'chart.bar',
    props: {
      title: '불량 다이 — 빈별(두 로트, 12장)',
      data: [],
      mapping: { x: 'bin', y: ['lotA', 'lotB'] },
      options: { stack: true, series: [{ label: 'A2381', color: '#9e9e9e' }, { label: 'B2390', color: BIN4 }] },
    },
    bindings: { data: bind('/fab/bins', '/value') },
  }),
  node('trend', 560, 620, 500, 260, {
    type: 'chart.line',
    props: {
      title: '로트 수율(%) — 최근 12로트',
      data: [],
      mapping: { x: 'lot', y: ['yield', 'target'] },
      options: { valueAxisZero: false, series: [{ label: '수율', color: INK }, { label: '목표 92%', color: GREY, lineStyle: 'dashed', symbol: 'none' }] },
    },
    bindings: { data: bind('/fab/trend', '/value') },
  }),
  node('method', 1080, 640, 480, 230, {
    type: 'element:notes',
    props: { title: '방법', items: [] },
    bindings: { items: bind('/fab/method', '/value') },
  }),
];

const document: CanvasView = {
  kind: 'canvas',
  appearance: 'light',
  accent: BIN5,
  background: {},
  nodes,
  connectors: [],
  elements: { caption, wafer, legend, figures, notes, 'row-label': rowLabel },
  components: { wafer: waferComponent },
  instances: LOTS.flatMap((lot, row) =>
    lot.wafers.map((id, i) => ({ id, component: 'wafer', x: LEFT + i * PITCH, y: ROWS[row]!, anchored: false, params: { wafer: id } })),
  ),
};

export const waferMaps: SamplePack = {
  id: 'wafer-maps',
  title: { ko: '웨이퍼 빈 맵 — 논문 그림처럼', en: 'Wafer bin maps — set as a paper’s figure' },
  field: { ko: '반도체 제조', en: 'Semiconductor manufacturing' },
  kind: { ko: '없음 — 작은 여러 개(같은 컴포넌트)', en: 'None — small multiples of one component' },
  summary: {
    ko: '두 로트의 웨이퍼 검사 결과를 논문 그림처럼 — 웨이퍼마다 같은 작은 지도를 로트가 흐른 순서대로 나란히, 다이마다 검사기가 매긴 빈의 색(양품은 옅은 회색, 불량 빈은 색각 이상도 가려 보는 팔레트), 아래에 수율과 불량이 그리는 무늬. 옆에 빈 범례·로트 수율·판독 메모, 아래에 빈별 불량과 최근 12로트 수율. 흰 바탕, 가는 선, 작은 글자. 웨이퍼 지도는 한 번 그린 컴포넌트를 웨이퍼마다 놓은 것입니다. 예시 데이터입니다.',
    en: 'Two lots’ probe results set as a paper’s figure — every wafer the same small map, side by side in the order the lot ran, each die the colour of its bin (good dice a light grey, failing bins a palette colour-blind readers can tell apart), with its yield and the pattern its failures make. Beside it the bins’ legend, the lots’ yields and the engineer’s notes; under it the failures by bin and the last twelve lots’ yield. White, hairlines, small type. The wafer map is one component placed for each wafer. Example data.',
  },
  connectors: [FAB],
  document,
  snapshot,
};
