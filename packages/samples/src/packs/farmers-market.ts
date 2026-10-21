import type { Binding, CanvasView, ElementDefinition, Node, Widget } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { svgDataUrl } from '../frame.js';
import { snapshot } from '../snapshots/farmers-market.js';

// A weekend farmers' market drawn as a risograph print: two inks only — fluorescent pink and blue — on off-white
// stock, a speckled grain, tints as halftone, the blue drum printed a hair out of register with the pink, and purple
// wherever the two overprint. The park is a plan of its paths, trees and fountain; the stalls stand in two rows along the
// avenue and the food trucks by the lawn, each a card saying what it sells and whether it still has it — blue on sale,
// a pink halftone when a few are left, solid pink and struck through once sold out. On the right the morning's figures,
// what is on at noon and the visitors by the half hour. The market is made up, so the values are example data.

export const MARKET: ExampleSampleConnector = {
  key: 'market',
  name: '예시 장터 API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 장터가 아닙니다' },
};

/** Stallholders tap a tablet when they run low; a quarter of an hour without an answer is a source that has stopped. */
const MAX_AGE_SECONDS = 15 * 60;

const bind = (path: string, valuePath: string): Binding => ({
  adapter: MARKET.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
});

const WIDTH = 1600;
const HEIGHT = 1000;
const STOCK = '#f4efe3';
/** The two inks, and what they make where they overprint. */
const PINK = '#ff48b0';
const BLUE = '#0078bf';
const PURPLE = '#5a3f9e';
const SANS = '"Archivo Black", "Arial Black", "Noto Sans KR", "Malgun Gothic", sans-serif';
const BODY = '"Space Grotesk", "Noto Sans KR", "Malgun Gothic", sans-serif';

const CARD = { width: 150, height: 92 };
const ROW_X = [60, 225, 390, 555, 720, 885];
const STALLS = [
  ...['a1', 'a2', 'a3', 'a4', 'a5', 'a6'].map((id, i) => ({ id, x: ROW_X[i]!, y: 180 })),
  ...['b1', 'b2', 'b3', 'b4', 'b5', 'b6'].map((id, i) => ({ id, x: ROW_X[i]!, y: 520 })),
  ...['t1', 't2', 't3'].map((id, i) => ({ id, x: 130 + i * 300, y: 790 })),
];

// ── The print ───────────────────────────────────────────────────────────────────────────────────────────────────

function drawing(): string {
  // The blue drum, printed a few units out of register with the pink.
  const blue = (content: string) => `<g transform="translate(4 3)" style="mix-blend-mode:multiply">${content}</g>`;
  const tree = (x: number, y: number, r: number) => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#dotsBlue)"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<defs>
<pattern id="dotsBlue" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="3.5" cy="3.5" r="2" fill="${BLUE}"/></pattern>
<pattern id="dotsPink" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><circle cx="4" cy="4" r="2.2" fill="${PINK}"/></pattern>
<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="1" seed="5"/><feColorMatrix values="0 0 0 0 .2  0 0 0 0 .2  0 0 0 0 .3  0 0 0 -2.2 1.25"/></filter>
</defs>
<rect width="${WIDTH}" height="${HEIGHT}" fill="${STOCK}"/>
<rect x="40" y="110" width="1030" height="650" rx="40" fill="url(#dotsPink)" opacity=".16"/>
<path d="M 40 380 H 1070 M 40 440 H 1070" stroke="${PINK}" stroke-width="6"/>
${blue(`<path d="M 40 410 H 1070" stroke="${BLUE}" stroke-width="58" stroke-opacity=".22"/>
<circle cx="555" cy="410" r="62" fill="${BLUE}" fill-opacity=".85"/>
${tree(80, 140, 34)}${tree(1030, 150, 40)}${tree(150, 470, 26)}${tree(960, 470, 30)}${tree(470, 740, 36)}${tree(780, 730, 30)}
<rect x="40" y="760" width="1030" height="200" fill="${BLUE}" fill-opacity=".14"/>`)}
<circle cx="555" cy="410" r="40" fill="none" stroke="${PINK}" stroke-width="8"/>
<text x="555" y="417" text-anchor="middle" fill="${STOCK}" font-size="16" font-family='${SANS}'>분수 무대</text>
<text x="48" y="402" fill="${PURPLE}" font-size="18" font-family='${SANS}'>느티나무 길 →</text>
<text x="1000" y="985" text-anchor="end" fill="${PURPLE}" font-size="18" font-family='${SANS}'>잔디 광장 · 푸드트럭</text>
<text x="48" y="985" fill="${PURPLE}" font-size="18" font-family='${SANS}'>↓ 정문 · 안내소</text>
<rect width="${WIDTH}" height="${HEIGHT}" filter="url(#grain)" opacity=".22"/>
<path d="M 1090 40 V 960" stroke="${PINK}" stroke-width="5" stroke-dasharray="2 10" stroke-linecap="round"/>
</svg>`;
  return svgDataUrl(svg);
}

// ── Elements ────────────────────────────────────────────────────────────────────────────────────────────────────

/** A stall or a food truck: who, what, and whether it still has it — read from `s`. */
const stall: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['s'], properties: { s: { type: 'object' } } },
  template: `<section class="sl {{s.state}}"><span>{{s.word}}</span><b>{{s.name}}</b><strong>{{s.item}}</strong>{{#s.note}}<small>{{s.note}}</small>{{/s.note}}</section>`,
  style: `.sl{position:relative;height:100%;box-sizing:border-box;display:grid;align-content:end;gap:1px;padding:8px 10px;background:${STOCK};border:3px solid ${BLUE};font-family:${BODY};color:${PURPLE}}
span{position:absolute;top:-12px;right:8px;padding:2px 8px;font:13px ${SANS};color:${STOCK};background:${BLUE}}
b{font:14px ${SANS};color:${BLUE}}
strong{font-size:18px;font-weight:800;line-height:1.15}
small{font-size:12px}
.few{border-color:${PINK};background:radial-gradient(rgba(255,72,176,.4) 40%,transparent 43%) 0 0/6px 6px,${STOCK}}
.few span{background:${STOCK};color:${PINK};outline:2px solid ${PINK}}
.sold{background:${PINK};border-color:${PINK};color:${STOCK}}
.sold span{background:${PURPLE}}
.sold b{color:${STOCK}}
.sold strong{text-decoration:line-through;text-decoration-thickness:3px}`,
  size: CARD,
};

/** The print's head: the market's name set big in pink, its shadow in blue out of register. */
const title: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['name'], properties: { name: { type: 'string' }, sub: { type: 'string' }, date: { type: 'string' }, time: { type: 'string' } } },
  template: `<header class="tt"><h1>{{name}}</h1><p>{{sub}}<br/>{{date}} <b>{{time}}</b></p></header>`,
  style: `.tt{height:100%;box-sizing:border-box;display:grid;align-content:center;gap:8px;font-family:${BODY};color:${PURPLE}}
h1{margin:0;font:42px/1.08 ${SANS};color:${PINK};text-shadow:4px 3px 0 rgba(0,120,191,.75)}
p{margin:0;font-size:17px;font-weight:600;line-height:1.5}
b{font:22px ${SANS};color:${BLUE}}`,
  size: { width: 460, height: 170 },
};

/** The morning's figures, each on a blue halftone. */
const figures: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, value: { type: 'string' }, note: { type: 'string' } } } } },
  },
  template: `<dl class="fg">{{#items}}<div><dt>{{label}}</dt><dd>{{value}}</dd><small>{{note}}</small></div>{{/items}}</dl>`,
  style: `.fg{margin:0;height:100%;box-sizing:border-box;display:grid;grid-template-columns:repeat(3,1fr);gap:10px;font-family:${BODY};color:${PURPLE}}
div{display:grid;align-content:center;padding:8px 10px;background:radial-gradient(rgba(0,120,191,.35) 40%,transparent 42%) 0 0/6px 6px}
dt{font-size:13px;font-weight:700}
dd{margin:2px 0;font:30px ${SANS};color:${BLUE}}
small{font-size:11px}`,
  size: { width: 460, height: 110 },
};

/** What is on later, as a stamped list. */
const events: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { time: { type: 'string' }, name: { type: 'string' }, place: { type: 'string' } } } } },
  },
  template: `<section class="ev"><h3>오늘의 행사</h3><ol>{{#items}}<li><b>{{time}}</b><span><strong>{{name}}</strong><small>{{place}}</small></span></li>{{/items}}</ol></section>`,
  style: `.ev{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr;gap:8px;font-family:${BODY};color:${PURPLE}}
h3{margin:0;justify-self:start;padding:2px 10px;font:17px ${SANS};color:${STOCK};background:${PINK};transform:rotate(-2deg)}
ol{margin:0;padding:0;list-style:none;display:grid;align-content:start;gap:6px}
li{display:grid;grid-template-columns:70px 1fr;align-items:center;gap:10px;padding:4px 0;border-bottom:3px dotted ${BLUE}}
b{font:22px ${SANS};color:${PINK}}
span{display:grid}
strong{font-size:16px}
small{font-size:13px}`,
  size: { width: 460, height: 200 },
};

/** The key to the cards. */
const legend: ElementDefinition = {
  render: 'template',
  props: { type: 'object', properties: {} },
  template: `<ul class="lg"><li><i class="o"></i>판매 중</li><li><i class="f"></i>몇 개 남음</li><li><i class="s"></i>완판</li></ul>`,
  style: `.lg{height:100%;box-sizing:border-box;margin:0;padding:0;list-style:none;display:flex;align-items:center;gap:18px;font:14px ${SANS};color:${PURPLE}}
li{display:flex;align-items:center;gap:6px}
i{width:22px;height:16px;border:3px solid ${BLUE};background:${STOCK}}
.f{border-color:${PINK};background:radial-gradient(${PINK} 45%,transparent 47%) 0 0/5px 5px,${STOCK}}
.s{border-color:${PINK};background:${PINK}}`,
  size: { width: 380, height: 30 },
};

// ── The board ───────────────────────────────────────────────────────────────────────────────────────────────────

const node = (id: string, x: number, y: number, width: number, height: number, widget: Widget): Node => ({ id, x, y, width, height, anchored: false, widget });

const nodes: Node[] = [
  ...STALLS.map(({ id, x, y }) =>
    node(`stall-${id}`, x, y, id.startsWith('t') ? 200 : CARD.width, CARD.height, { type: 'element:stall', props: { s: {} }, bindings: { s: bind('/market/stalls', `/value/${id}`) } })
  ),
  node('legend', 690, 50, 380, 30, { type: 'element:legend', props: {} }),
  node('title', 1120, 30, 460, 170, {
    type: 'element:title',
    props: { name: '', sub: '', date: '', time: '' },
    bindings: { name: bind('/market/now', '/name'), sub: bind('/market/now', '/sub'), date: bind('/market/now', '/date'), time: bind('/market/now', '/time') },
  }),
  node('figures', 1120, 220, 460, 110, { type: 'element:figures', props: { items: [] }, bindings: { items: bind('/market/figures', '/value') } }),
  node('events', 1120, 350, 460, 210, { type: 'element:events', props: { items: [] }, bindings: { items: bind('/market/events', '/value') } }),
  node('visitors', 1120, 590, 460, 370, {
    type: 'chart.bar',
    props: { title: '30분마다 들어온 방문객(명)', data: [], mapping: { x: 'hour', y: 'people' }, options: { series: [{ label: '방문객', color: PINK }] } },
    bindings: { data: bind('/market/visitors', '/value') },
  }),
];

const document: CanvasView = {
  kind: 'canvas',
  appearance: 'light',
  accent: PINK,
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes,
  connectors: [],
  elements: { stall, title, figures, events, legend },
};

export const farmersMarket: SamplePack = {
  id: 'farmers-market',
  title: { ko: '주말 파머스마켓 — 리소그래프', en: 'A weekend farmers’ market — a risograph print' },
  field: { ko: '지역 장터·소상공', en: 'Local markets & small traders' },
  kind: { ko: '공원 장터의 매대 지도', en: 'A map of a market’s stalls in a park' },
  summary: {
    ko: '공원 주말 장터의 안내판을 리소그래프 인쇄물로 — 형광 분홍과 청색 두 잉크만, 미색 종이, 점점이 박힌 결, 망점 틴트, 분홍과 반 칸 어긋난 청색 판, 두 잉크가 겹친 곳의 보라. 공원 평면(길·나무·분수 무대) 위 느티나무 길 양쪽 매대 열둘과 잔디 광장 푸드트럭 셋 — 카드마다 무엇을 파는지와 아직 있는지: 청색 판매 중, 분홍 망점 몇 개 남음, 분홍 단색에 줄 그은 완판. 오른쪽에 방문객·장바구니 대여·다회용기, 오늘의 행사, 30분마다 방문객. 장터는 지어낸 것이라 예시 데이터입니다.',
    en: 'A park’s weekend-market board as a risograph print — two inks only, fluorescent pink and blue, on off-white stock, a speckled grain, halftone tints, the blue drum a hair out of register with the pink and purple where they overprint. On the park’s plan (paths, trees, the fountain stage) twelve stalls along the avenue and three food trucks by the lawn, each card saying what it sells and whether it still has it: blue on sale, a pink halftone when a few are left, solid pink and struck through once sold out. On the right the visitors, the shopping baskets lent and reusable containers, what is on later and the visitors by the half hour. The market is made up. Example data.',
  },
  connectors: [MARKET],
  document,
  snapshot,
};
