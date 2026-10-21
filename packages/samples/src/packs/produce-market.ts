import type { Binding, CanvasView, ElementDefinition, Node, Widget } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { svgDataUrl } from '../frame.js';
import { snapshot } from '../snapshots/produce-market.js';

// A wholesale produce market's dawn auction set as the front page of a newspaper: black ink and one red on newsprint,
// a nameplate across the top, a serif headline over a deck, column rules and hairlines, and the market's plan printed
// as a halftone picture with its caption. Each auction hall is a boxed item on the plan — a black bar running while
// its auction is on, a full grey bar once it has ended, an empty outlined bar while it waits, the word beside it saying
// which; the price table marks a rise with a red triangle up and a fall with a black triangle down, so the direction
// reads without the colour. Beside them the cabbage price over a week, the day's figures and the notices. The market is
// made up, so the values are example data.

export const MARKET: ExampleSampleConnector = {
  key: 'market',
  name: '예시 도매시장 API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 도매시장이 아닙니다' },
};

/** The auction clock reports every minute; ten minutes of silence is a source that has stopped. */
const MAX_AGE_SECONDS = 10 * 60;

const bind = (path: string, valuePath: string): Binding => ({
  adapter: MARKET.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
});

const WIDTH = 1600;
const HEIGHT = 1000;
const PAPER = '#f1ede3';
const INK = '#141414';
const RED = '#a5161d';
const GREY = '#8a857b';
const SERIF = '"Noto Serif KR", "Nanum Myeongjo", "Batang", serif';
const SANS = '"Noto Sans KR", "Malgun Gothic", sans-serif';

const HALL = { width: 300, height: 190 };
type HallId = 'h1' | 'h2' | 'h3' | 'h4';
const HALLS: Record<HallId, [number, number]> = {
  h1: [70, 390],
  h2: [420, 390],
  h3: [70, 660],
  h4: [420, 660],
};

// ── The page ────────────────────────────────────────────────────────────────────────────────────────────────────

function drawing(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<defs>
<pattern id="dots" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="3" cy="3" r="1.3" fill="${INK}"/></pattern>
<pattern id="dotsFine" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="2.5" cy="2.5" r=".8" fill="${INK}"/></pattern>
<filter id="paper"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2" seed="3"/><feColorMatrix values="0 0 0 0 .3  0 0 0 0 .28  0 0 0 0 .22  0 0 0 -1.4 .9"/></filter>
</defs>
<rect width="${WIDTH}" height="${HEIGHT}" fill="${PAPER}"/>
<path d="M 40 136 H 1560" stroke="${INK}" stroke-width="4"/><path d="M 40 142 H 1560" stroke="${INK}" stroke-width="1"/>
<path d="M 777 156 V 970 M 1287 156 V 970" stroke="${INK}" stroke-width="1"/>
<path d="M 40 336 H 760" stroke="${INK}" stroke-width="1"/>
<rect x="40" y="350" width="720" height="580" fill="url(#dotsFine)" opacity=".22"/>
<rect x="56" y="370" width="688" height="250" fill="url(#dots)" opacity=".12"/>
<rect x="56" y="640" width="688" height="250" fill="url(#dots)" opacity=".12"/>
<path d="M 40 630 H 760" stroke="${INK}" stroke-width="10" stroke-opacity=".35"/>
<path d="M 395 350 V 930" stroke="${INK}" stroke-width="10" stroke-opacity=".35"/>
<rect x="40" y="350" width="720" height="580" fill="none" stroke="${INK}" stroke-width="1.5"/>
<text x="40" y="956" fill="${INK}" font-size="14" font-family='${SERIF}'>▲ 경매동 배치 — 가운데 십자는 하차장 통로. 각 동의 막대는 반입량 기준 진행.</text>
<rect width="${WIDTH}" height="${HEIGHT}" filter="url(#paper)" opacity=".18"/>
</svg>`;
  return svgDataUrl(svg);
}

// ── Elements ────────────────────────────────────────────────────────────────────────────────────────────────────

/** The nameplate: the paper's name, its edition, the date and the time of this page. */
const masthead: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['name'], properties: { name: { type: 'string' }, edition: { type: 'string' }, date: { type: 'string' }, time: { type: 'string' } } },
  template: `<header class="mh"><span>{{date}}</span><h1>{{name}}</h1><p><b>{{edition}}</b> {{time}} 현재</p></header>`,
  style: `.mh{height:100%;box-sizing:border-box;display:grid;grid-template-columns:1fr auto 1fr;align-items:end;gap:20px;padding-bottom:6px;font-family:${SERIF};color:${INK}}
h1{margin:0;font-size:64px;font-weight:900;letter-spacing:.08em;line-height:1}
span{font-size:16px}
p{margin:0;justify-self:end;font-size:16px}
b{padding:2px 10px;color:${PAPER};background:${RED};font-weight:700}`,
  size: { width: 1520, height: 104 },
};

/** The lead: a headline and its deck. */
const lead: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['headline'], properties: { headline: { type: 'string' }, deck: { type: 'string' } } },
  template: `<article class="ld"><h2>{{headline}}</h2><p>{{deck}}</p></article>`,
  style: `.ld{height:100%;box-sizing:border-box;display:grid;align-content:center;gap:10px;font-family:${SERIF};color:${INK}}
h2{margin:0;font-size:40px;font-weight:900;line-height:1.15;letter-spacing:-.01em}
p{margin:0;font-size:17px;line-height:1.55;border-left:4px solid ${RED};padding-left:12px}`,
  size: { width: 720, height: 176 },
};

/** An auction hall boxed on the plan: what is under the hammer and how far along — read from `h`. */
const hall: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['h'], properties: { h: { type: 'object' } } },
  template: `<section class="hl {{h.state}}"><header><b>{{h.name}}</b><span>{{h.word}}</span></header><strong>{{h.item}}</strong><i style="--p: {{h.progress}}"><u></u></i><small>{{h.note}}</small></section>`,
  style: `.hl{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr auto auto;gap:8px;padding:12px 16px;background:${PAPER};border:2px solid ${INK};box-shadow:4px 4px 0 ${INK};font-family:${SERIF};color:${INK}}
header{display:flex;justify-content:space-between;align-items:baseline;border-bottom:1px solid ${INK};padding-bottom:4px}
b{font-size:18px;font-weight:800}
span{font:700 13px ${SANS};padding:1px 8px;border:1.5px solid ${INK}}
strong{align-self:center;font-size:30px;font-weight:900}
i{display:block;height:14px;border:1.5px solid ${INK};background:${PAPER}}
u{display:block;height:100%;width:calc(var(--p) * 1%);background:${INK}}
small{font:13px ${SANS}}
.now span{color:${PAPER};background:${RED};border-color:${RED}}
.done{color:#4b4740}
.done u{background:${GREY}}
.done span{color:${PAPER};background:${GREY};border-color:${GREY}}
.wait{border-style:dashed;box-shadow:none}`,
  size: HALL,
};

/** Today's prices: the item, its unit, the price and the change, with a triangle for its direction. */
const prices: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: {
      items: {
        type: 'array',
        items: { type: 'object', properties: { item: { type: 'string' }, unit: { type: 'string' }, price: { type: 'string' }, change: { type: 'string' }, dir: { type: 'string' } } },
      },
    },
  },
  template: `<section class="pr"><h3>오늘의 경락가</h3><table><thead><tr><th>품목</th><th>단위</th><th>경락가</th><th>전일 대비</th></tr></thead><tbody>{{#items}}<tr class="{{dir}}"><td>{{item}}</td><td>{{unit}}</td><td>{{price}}</td><td><i></i>{{change}}</td></tr>{{/items}}</tbody></table></section>`,
  style: `.pr{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr;gap:10px;font-family:${SERIF};color:${INK}}
h3{margin:0;font-size:24px;font-weight:900;border-bottom:3px double ${INK};padding-bottom:6px}
table{width:100%;border-collapse:collapse;align-self:start}
th{font:600 13px ${SANS};text-align:left;padding:6px 4px;border-bottom:1.5px solid ${INK}}
td{font-size:17px;padding:10px 4px;border-bottom:1px solid #bdb7aa}
td:nth-child(3),th:nth-child(3),td:nth-child(4),th:nth-child(4){text-align:right}
td:nth-child(3){font-weight:800}
td:nth-child(4){font-family:${SANS};font-weight:700;white-space:nowrap}
i{display:inline-block;width:0;height:0;margin-right:6px;vertical-align:middle}
.up td:nth-child(4){color:${RED}}
.up i{border-left:6px solid transparent;border-right:6px solid transparent;border-bottom:10px solid ${RED}}
.down i{border-left:6px solid transparent;border-right:6px solid transparent;border-top:10px solid ${INK}}
.flat i{width:12px;height:3px;background:${GREY}}
.flat td:nth-child(4){color:${GREY}}`,
  size: { width: 480, height: 420 },
};

/** The day's figures in a narrow column. */
const figures: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, value: { type: 'string' }, note: { type: 'string' } } } } },
  },
  template: `<dl class="fg">{{#items}}<div><dt>{{label}}</dt><dd>{{value}}</dd><small>{{note}}</small></div>{{/items}}</dl>`,
  style: `.fg{margin:0;height:100%;box-sizing:border-box;display:grid;align-content:space-between;font-family:${SERIF};color:${INK}}
div{display:grid;padding:10px 0;border-bottom:1px solid ${INK}}
div:first-child{border-top:3px solid ${INK}}
dt{font:700 14px ${SANS}}
dd{margin:2px 0;font-size:38px;font-weight:900;line-height:1.1}
small{font:13px ${SANS};color:#4b4740}`,
  size: { width: 260, height: 400 },
};

/** The notices, as a short-items column. */
const notices: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { time: { type: 'string' }, text: { type: 'string' } } } } },
  },
  template: `<section class="nt"><h3>알림</h3><ul>{{#items}}<li><b>{{time}}</b>{{text}}</li>{{/items}}</ul></section>`,
  style: `.nt{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr;gap:8px;font-family:${SERIF};color:${INK}}
h3{margin:0;padding:2px 0;font-size:20px;font-weight:900;color:${PAPER};background:${INK};text-align:center}
ul{margin:0;padding:0;list-style:none;display:grid;align-content:start;gap:12px}
li{font-size:16px;line-height:1.5;padding-bottom:10px;border-bottom:1px dotted ${INK}}
b{display:block;font:800 14px ${SANS};color:${RED}}`,
  size: { width: 260, height: 380 },
};

// ── The board ───────────────────────────────────────────────────────────────────────────────────────────────────

const node = (id: string, x: number, y: number, width: number, height: number, widget: Widget): Node => ({ id, x, y, width, height, anchored: false, widget });

const nodes: Node[] = [
  node('masthead', 40, 24, 1520, 104, {
    type: 'element:masthead',
    props: { name: '', edition: '', date: '', time: '' },
    bindings: { name: bind('/market/now', '/name'), edition: bind('/market/now', '/edition'), date: bind('/market/now', '/date'), time: bind('/market/now', '/time') },
  }),
  node('lead', 40, 154, 720, 176, {
    type: 'element:lead',
    props: { headline: '', deck: '' },
    bindings: { headline: bind('/market/lead', '/headline'), deck: bind('/market/lead', '/deck') },
  }),
  ...(Object.keys(HALLS) as HallId[]).map(id =>
    node(`hall-${id}`, HALLS[id][0], HALLS[id][1], HALL.width, HALL.height, { type: 'element:hall', props: { h: {} }, bindings: { h: bind('/market/halls', `/value/${id}`) } })
  ),
  node('prices', 795, 156, 480, 420, { type: 'element:prices', props: { items: [] }, bindings: { items: bind('/market/prices', '/value') } }),
  node('cabbage', 795, 600, 480, 360, {
    type: 'chart.line',
    props: { title: '배추 경락가 — 7일 (원/10kg)', data: [], mapping: { x: 'day', y: 'price' }, options: { valueAxisZero: false, series: [{ label: '배추', color: RED }] } },
    bindings: { data: bind('/market/cabbage', '/value') },
  }),
  node('figures', 1300, 156, 260, 400, { type: 'element:figures', props: { items: [] }, bindings: { items: bind('/market/figures', '/value') } }),
  node('notices', 1300, 580, 260, 380, { type: 'element:notices', props: { items: [] }, bindings: { items: bind('/market/notices', '/value') } }),
];

const document: CanvasView = {
  kind: 'canvas',
  appearance: 'light',
  accent: RED,
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes,
  connectors: [],
  elements: { masthead, lead, hall, prices, figures, notices },
};

export const produceMarket: SamplePack = {
  id: 'produce-market',
  title: { ko: '농산물 도매시장 새벽 경매 — 신문 1면', en: 'A wholesale produce market’s dawn auction — a newspaper front page' },
  field: { ko: '농산물 유통', en: 'Produce wholesale' },
  kind: { ko: '경매동 진행과 품목별 경락가', en: 'The halls’ auctions and the prices by item' },
  summary: {
    ko: '농산물 도매시장의 새벽 경매를 신문 1면으로 — 신문 용지에 먹 한 색과 빨강 한 색, 위를 가로지르는 제호, 세리프 큰 제목과 부제, 단을 가르는 괘선, 망점으로 인쇄한 시장 배치 그림과 사진 설명. 경매동마다 배치 그림 위 상자 기사로: 경매 중은 검은 막대가 차오르고 빨간 표지, 끝난 동은 회색 막대, 기다리는 동은 점선 상자에 빈 막대. 경락가 표는 오르면 빨간 위 삼각, 내리면 검은 아래 삼각이라 색 없이도 방향이 읽힙니다. 옆 단에 배추 경락가 7일, 오늘 반입·경매 진행·낙찰 건수, 알림. 시장은 지어낸 것이라 예시 데이터입니다.',
    en: 'A wholesale produce market’s dawn auction set as a newspaper front page — black ink and one red on newsprint, a nameplate across the top, a serif headline over its deck, column rules, and the market’s plan printed as a halftone picture with its caption. Each auction hall is a boxed item on the plan: a black bar filling with a red tag while its auction is on, a grey bar once it has ended, a dashed box with an empty bar while it waits. The price table marks a rise with a red triangle up and a fall with a black triangle down, so the direction reads without the colour. Beside them the cabbage price over a week, the produce brought in, the auction’s progress and the lots sold, and the notices. The market is made up. Example data.',
  },
  connectors: [MARKET],
  document,
  snapshot,
};
