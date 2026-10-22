import type { Binding, CanvasView, ElementDefinition, Node, Widget } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { svgDataUrl } from '../frame.js';
import { snapshot } from '../snapshots/home-eink.js';

// A home's energy on an e-ink frame by the kitchen door, read in passing on the way out: the electricity used today in
// one very large number against yesterday at this hour, what the roof's panels made, the gas, the month's bill so far,
// the day's use hour by hour, the weather, and one line of advice. The minimal style: grey on paper, no colour, thin
// rules, a great deal of white, the largest number read first — what a screen that redraws a few times an hour shows.
// No public source carries one home's meters this way, so the values are example data written for the frame.

export const HOME: ExampleSampleConnector = {
  key: 'home',
  name: '예시 가정 에너지 API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 가정이 아닙니다' },
};

/** The frame redraws every fifteen minutes; an hour without an answer is a source that has stopped. */
const MAX_AGE_SECONDS = 60 * 60;

const bind = (path: string, valuePath: string): Binding => ({
  adapter: HOME.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
});

const WIDTH = 1200;
const HEIGHT = 900;
const M = 72;
const INK = '#1c1c1a';
const GREY = '#6b6b66';
const FAINT = '#b9b8b2';
const PAPER = '#f3f2ee';
const FONT = 'var(--u-widget-font-family)';

const COLUMN = { split: 760 };
const ROWS = { top: 72, hero: 150, chart: 470, foot: 720 };

// ── The drawing ─────────────────────────────────────────────────────────────────────────────────────────────────

function drawing(): string {
  const rule = (x1: number, y1: number, x2: number, y2: number) => `<path d="M ${x1} ${y1} L ${x2} ${y2}" stroke="${FAINT}" stroke-width="1"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<rect width="${WIDTH}" height="${HEIGHT}" fill="${PAPER}"/>
${rule(M, ROWS.hero - 20, WIDTH - M, ROWS.hero - 20)}
${rule(COLUMN.split, ROWS.hero + 10, COLUMN.split, ROWS.chart - 40)}
${rule(M, ROWS.chart - 20, WIDTH - M, ROWS.chart - 20)}
${rule(M, ROWS.foot - 20, WIDTH - M, ROWS.foot - 20)}
</svg>`;
  return svgDataUrl(svg);
}

// ── Elements ────────────────────────────────────────────────────────────────────────────────────────────────────

/** The day and the hour, small, as the frame's head. */
const clock: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['date', 'time'], properties: { date: { type: 'string' }, time: { type: 'string' }, home: { type: 'string' } } },
  template: `<header class="clk"><span>{{home}}</span><span>{{date}}</span><time>{{time}}</time></header>`,
  style: `.clk{height:100%;box-sizing:border-box;display:flex;align-items:baseline;gap:28px;font-family:${FONT};color:${GREY};font-size:18px;letter-spacing:.04em}
time{margin-left:auto;font-size:30px;font-weight:300;color:${INK};font-variant-numeric:tabular-nums}`,
  size: { width: 1056, height: 44 },
};

/** The one number read first: electricity used today, very large and thin, with yesterday at this hour under it. */
const hero: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['used', 'yesterday', 'change'],
    properties: { used: { type: 'number' }, yesterday: { type: 'number' }, change: { type: 'string' } },
  },
  template: `<section class="hero"><p class="lbl">오늘 쓴 전기</p><p class="big"><b>{{used | fixed:1}}</b><span>kWh</span></p><p class="cmp">어제 이 시간 {{yesterday | fixed:1}} kWh · {{change}}</p></section>`,
  style: `.hero{height:100%;box-sizing:border-box;display:grid;align-content:center;gap:4px;font-family:${FONT};color:${INK}}
p{margin:0}
.lbl{font-size:20px;color:${GREY};letter-spacing:.06em}
.big{display:flex;align-items:baseline;gap:14px}
.big b{font-size:168px;line-height:.95;font-weight:200;letter-spacing:-.04em;font-variant-numeric:tabular-nums}
.big span{font-size:30px;font-weight:300;color:${GREY}}
.cmp{font-size:19px;color:${GREY}}`,
  size: { width: 640, height: 280 },
};

/** A few figures beside it, one to a line: what it is, the number, its unit. */
const figures: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, value: { type: 'string' }, unit: { type: 'string' } } } } },
  },
  template: `<dl class="figs">{{#items}}<div><dt>{{label}}</dt><dd><b>{{value}}</b> {{unit}}</dd></div>{{/items}}</dl>`,
  style: `.figs{height:100%;box-sizing:border-box;margin:0;display:grid;align-content:center;gap:14px;font-family:${FONT};color:${INK}}
dt{font-size:16px;color:${GREY};letter-spacing:.04em}
dd{margin:2px 0 0;font-size:18px;color:${GREY}}
dd b{font-size:36px;font-weight:300;color:${INK};font-variant-numeric:tabular-nums}`,
  size: { width: 300, height: 280 },
};

/** The weather for today and the next two days, each a word and two temperatures. */
const weather: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['days'],
    properties: { days: { type: 'array', items: { type: 'object', properties: { day: { type: 'string' }, sky: { type: 'string' }, low: { type: 'number' }, high: { type: 'number' } } } } },
  },
  template: `<ul class="wx">{{#days}}<li><span>{{day}}</span><b>{{sky}}</b><em>{{low}}° / {{high}}°</em></li>{{/days}}</ul>`,
  style: `.wx{height:100%;box-sizing:border-box;margin:0;padding:0;list-style:none;display:grid;grid-template-columns:repeat(3,1fr);align-content:center;font-family:${FONT};color:${INK}}
li{display:grid;gap:4px;padding-left:18px;border-left:1px solid ${FAINT}}
li:first-child{padding-left:0;border-left:0}
span{font-size:15px;color:${GREY};letter-spacing:.06em}
b{font-size:24px;font-weight:400}
em{font-style:normal;font-size:18px;color:${GREY};font-variant-numeric:tabular-nums}`,
  size: { width: 600, height: 110 },
};

/** One line of advice for the day, set apart. */
const note: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['text'], properties: { text: { type: 'string' } } },
  template: `<p class="note">{{text}}</p>`,
  style: `.note{margin:0;height:100%;box-sizing:border-box;display:flex;align-items:center;font-family:${FONT};font-size:21px;line-height:1.5;color:${INK};word-break:keep-all}`,
  size: { width: 420, height: 110 },
};

// ── The board ───────────────────────────────────────────────────────────────────────────────────────────────────

const node = (id: string, x: number, y: number, width: number, height: number, widget: Widget): Node => ({ id, x, y, width, height, anchored: false, widget });

const nodes: Node[] = [
  node('clock', M, ROWS.top, WIDTH - M * 2, 44, {
    type: 'element:clock',
    props: { date: '', time: '', home: '' },
    bindings: { date: bind('/home/now', '/date'), time: bind('/home/now', '/time'), home: bind('/home/now', '/home') },
  }),
  node('hero', M, ROWS.hero + 10, COLUMN.split - M - 40, 280, {
    type: 'element:hero',
    props: { used: 0, yesterday: 0, change: '' },
    bindings: { used: bind('/home/today', '/used'), yesterday: bind('/home/today', '/yesterday'), change: bind('/home/today', '/change') },
  }),
  node('figures', COLUMN.split + 50, ROWS.hero + 10, WIDTH - M - COLUMN.split - 50, 280, { type: 'element:figures', props: { items: [] }, bindings: { items: bind('/home/figures', '/value') } }),
  node('hours', M - 8, ROWS.chart, WIDTH - M * 2 + 16, 220, {
    type: 'chart.bar',
    props: {
      title: '시간대별 전기 사용(kWh)',
      data: [],
      mapping: { x: 'hour', y: 'kwh' },
      options: { series: [{ label: '사용', color: '#8a8984' }] },
    },
    bindings: { data: bind('/home/hours', '/value') },
  }),
  node('weather', M, ROWS.foot, 600, 110, { type: 'element:weather', props: { days: [] }, bindings: { days: bind('/home/weather', '/value') } }),
  node('note', WIDTH - M - 420, ROWS.foot, 420, 110, { type: 'element:note', props: { text: '' }, bindings: { text: bind('/home/today', '/advice') } }),
];

const document: CanvasView = {
  kind: 'canvas',
  appearance: 'light',
  accent: '#5f5e59',
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes,
  connectors: [],
  elements: { clock, hero, figures, weather, note },
};

export const homeEink: SamplePack = {
  id: 'home-eink',
  title: { ko: '우리 집 에너지 — 미니멀 e-ink 액자', en: 'A home’s energy — a minimal e-ink frame' },
  field: { ko: '가정·생활', en: 'Home & daily life' },
  kind: { ko: '액자 화면(4:3 e-ink)', en: 'A frame screen (4:3 e-ink)' },
  domain: 'energy',
  styles: ['minimal'],
  summary: {
    ko: '부엌 문 옆 e-ink 액자 — 나가는 길에 한눈에. 오늘 쓴 전기를 아주 크고 가는 숫자 하나로(어제 이 시간과 견주어), 옆에 태양광·가스·이달 예상 요금, 시간대별 사용, 사흘 날씨, 오늘의 한 줄 조언. 색 없이 종이 위 회색, 가는 괘선과 넉넉한 여백. 예시 데이터입니다.',
    en: 'An e-ink frame by the kitchen door, read in passing on the way out — today’s electricity in one very large, thin number against yesterday at this hour; beside it the solar panels, the gas and the month’s bill so far; the day’s use by the hour, three days of weather and one line of advice. No colour: grey on paper, thin rules and plenty of white. Example data.',
  },
  connectors: [HOME],
  document,
  snapshot,
};
