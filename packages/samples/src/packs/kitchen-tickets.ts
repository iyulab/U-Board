import type { Binding, CanvasView, ElementDefinition, Node, Widget } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { svgDataUrl } from '../frame.js';
import { snapshot } from '../snapshots/kitchen-tickets.js';

// A restaurant kitchen's lunch rush on thermal paper: a brushed steel pass with a ticket rail along the top, every order
// hanging from it as a narrow receipt — fixed-width type, a dashed tear line, a torn zigzag foot — with the minutes since
// it was printed in big figures. An order's state is a rubber stamp across its paper as well as a colour: none on a new
// order, a blue «조리중» while it cooks, a red ring «완료» once it waits at the pass, and the paper turned black when it is
// late. Below, each station's queue printed like a register roll, the day's totals as a till receipt, and the average
// cooking time through the rush. The restaurant is made up, so the values are example data.

export const KITCHEN: ExampleSampleConnector = {
  key: 'kitchen',
  name: '예시 주방 API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 식당이 아닙니다' },
};

/** The order system updates every few seconds; two minutes of silence is a source that has stopped. */
const MAX_AGE_SECONDS = 2 * 60;

const bind = (path: string, valuePath: string): Binding => ({
  adapter: KITCHEN.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
});

const WIDTH = 1600;
const HEIGHT = 1000;
const STEEL = '#c9ced3';
const PAPER = '#fbfaf6';
const INK = '#1d1d1f';
const STAMP_BLUE = '#2456b8';
const STAMP_RED = '#cc2b2b';
const MONO = '"D2Coding", "Consolas", "Courier New", "Noto Sans Mono", monospace';

/** A receipt's torn foot: a zigzag along the bottom edge, as a clip path. */
function tornFoot(teeth: number, depth: number): string {
  const points = ['0 0', '100% 0'];
  for (let i = teeth; i >= 0; i--) {
    const x = (i / teeth) * 100;
    points.push(`${x.toFixed(2)}% ${i % 2 === 0 ? `calc(100% - ${depth}px)` : '100%'}`);
  }
  return `polygon(${points.join(',')})`;
}

const RECEIPT = `background:${PAPER};clip-path:${tornFoot(16, 10)};font-family:${MONO};color:${INK}`;

type TicketId = 't1' | 't2' | 't3' | 't4' | 't5' | 't6';

// ── The pass ───────────────────────────────────────────────────────────────────────────────────────────────────

function drawing(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<defs>
<linearGradient id="steel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dfe3e7"/><stop offset=".5" stop-color="${STEEL}"/><stop offset="1" stop-color="#b9bfc5"/></linearGradient>
<pattern id="brush" width="6" height="${HEIGHT}" patternUnits="userSpaceOnUse"><rect width="6" height="${HEIGHT}" fill="url(#steel)"/><line x1="2" y1="0" x2="2" y2="${HEIGHT}" stroke="#ffffff" stroke-opacity=".18"/></pattern>
<linearGradient id="rail" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4f6f8"/><stop offset="1" stop-color="#8f969d"/></linearGradient>
</defs>
<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#brush)"/>
<rect x="20" y="58" width="${WIDTH - 40}" height="26" rx="6" fill="url(#rail)"/>
<rect x="20" y="82" width="${WIDTH - 40}" height="4" fill="#6f767d"/>
<rect x="20" y="582" width="${WIDTH - 40}" height="3" fill="#9aa1a8"/>
<text x="24" y="40" fill="#4a5056" font-size="20" font-family='${MONO}' font-weight="700" letter-spacing=".12em">PASS · 주문표 레일</text>
</svg>`;
  return svgDataUrl(svg);
}

// ── Elements ───────────────────────────────────────────────────────────────────────────────────────────────────

/** An order hanging from the rail as a receipt — read from `t`. */
const ticket: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['t'], properties: { t: { type: 'object' } } },
  template: `<article class="tk {{t.state}}"><header><b>{{t.no}}</b><span>{{t.where}}</span></header><time>{{t.age}}</time><p>{{t.lines}}</p><footer><small>{{t.printed}}</small><em>{{t.word}}</em></footer></article>`,
  style: `.tk{position:relative;height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto auto 1fr auto;padding:16px 16px 26px;${RECEIPT};box-shadow:0 2px 0 rgba(0,0,0,.05)}
header{display:flex;justify-content:space-between;align-items:baseline;border-bottom:2px dashed ${INK};padding-bottom:6px}
b{font-size:24px;font-weight:800}
span{font-size:17px;font-weight:700}
time{font-size:46px;font-weight:800;letter-spacing:-.02em;padding:6px 0 4px}
p{margin:0;font-size:18px;line-height:1.5;white-space:pre-line;border-top:2px dashed ${INK};padding-top:8px}
footer{display:flex;justify-content:space-between;align-items:center;border-top:2px dashed ${INK};padding-top:6px;font-size:14px}
em{font-style:normal;font-weight:800;font-size:16px}
.tk::after{position:absolute;bottom:90px;right:22px;padding:4px 10px;font:900 26px ${MONO};transform:rotate(-14deg);opacity:.85}
.new header b::before{content:"NEW ";padding:0 6px;margin-right:4px;background:${INK};color:${PAPER};font-size:15px}
.cook::after{content:"조리중";color:${STAMP_BLUE};border:4px solid ${STAMP_BLUE};border-radius:6px}
.cook em{color:${STAMP_BLUE}}
.done::after{content:"완료";color:${STAMP_RED};border:4px solid ${STAMP_RED};border-radius:50%;padding:14px 12px}
.done em{color:${STAMP_RED}}
.late{background:${INK};color:${PAPER}}
.late header,.late p,.late footer{border-color:${PAPER}}
.late::after{content:"!! 지연";color:${INK};background:${PAPER};border-radius:4px}`,
  size: { width: 230, height: 480 },
};

/** Each station's queue, printed like a register roll. */
const stations: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: {
      items: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, state: { type: 'string' }, queue: { type: 'string' }, oldest: { type: 'string' }, note: { type: 'string' } } } },
    },
  },
  template: `<section class="st"><h2>스테이션별 대기</h2><ol>{{#items}}<li class="{{state}}"><i></i><b>{{name}}</b><span>{{queue}}</span><time>{{oldest}}</time><small>{{note}}</small></li>{{/items}}</ol></section>`,
  style: `.st{height:100%;box-sizing:border-box;padding:16px 22px 28px;${RECEIPT}}
h2{margin:0 0 8px;font-size:20px;font-weight:800;border-bottom:2px dashed ${INK};padding-bottom:6px;letter-spacing:.06em}
ol{margin:0;padding:0;list-style:none;display:grid;gap:4px}
li{display:grid;grid-template-columns:28px 1fr 90px 100px 1fr;align-items:center;gap:10px;padding:8px 0;border-bottom:1px dotted ${INK};font-size:19px}
i{font-style:normal;font-size:20px;font-weight:900;text-align:center}
b{font-weight:800}
span,time{text-align:right;font-weight:700}
small{font-size:15px;text-align:right}
.busy i::after{content:"▲"}
.busy{font-weight:800}
.busy time{background:${INK};color:${PAPER};padding:0 4px}
.steady i::after{content:"●"}
.idle i::after{content:"○"}
.idle{opacity:.7}`,
  size: { width: 720, height: 340 },
};

/** The day so far as a till receipt. */
const totals: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['s'],
    properties: { s: { type: 'object' }, items: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, value: { type: 'string' } } } } },
  },
  template: `<section class="tt"><h1>{{s.name}}</h1><p>{{s.date}}</p><p class="now">{{s.time}}</p><dl>{{#items}}<dt>{{label}}</dt><dd>{{value}}</dd>{{/items}}</dl><div class="bc"></div></section>`,
  style: `.tt{height:100%;box-sizing:border-box;display:grid;align-content:start;justify-items:center;gap:4px;padding:16px 20px 28px;${RECEIPT};text-align:center}
h1{margin:0;font-size:22px;font-weight:800}
p{margin:0;font-size:15px}
.now{font-size:34px;font-weight:800;border-bottom:2px dashed ${INK};width:100%;padding-bottom:6px}
dl{margin:4px 0 0;width:100%;display:grid;grid-template-columns:1fr auto;row-gap:5px;font-size:17px;text-align:left}
dd{margin:0;font-weight:800;text-align:right}
.bc{margin-top:8px;width:80%;height:34px;background:repeating-linear-gradient(90deg,${INK} 0 2px,transparent 2px 4px,${INK} 4px 7px,transparent 7px 9px,${INK} 9px 10px,transparent 10px 13px)}`,
  size: { width: 330, height: 340 },
};

// ── The board ──────────────────────────────────────────────────────────────────────────────────────────────────

const node = (id: string, x: number, y: number, width: number, height: number, widget: Widget): Node => ({ id, x, y, width, height, anchored: false, widget });

const TICKETS: TicketId[] = ['t1', 't2', 't3', 't4', 't5', 't6'];

const nodes: Node[] = [
  ...TICKETS.map((id, i) => node(`ticket-${id}`, 40 + i * 256, 86, 230, 480, { type: 'element:ticket', props: { t: {} }, bindings: { t: bind('/kitchen/tickets', `/value/${id}`) } })),
  node('stations', 40, 610, 720, 340, { type: 'element:stations', props: { items: [] }, bindings: { items: bind('/kitchen/stations', '/value') } }),
  node('totals', 790, 610, 330, 340, {
    type: 'element:totals',
    props: { s: {}, items: [] },
    bindings: { s: bind('/kitchen/totals', '/kitchen'), items: bind('/kitchen/totals', '/value') },
  }),
  node('cooking', 1150, 610, 410, 340, {
    type: 'chart.line',
    props: { title: '평균 조리 시간(분) — 30분마다', data: [], mapping: { x: 'at', y: 'minutes' }, options: { series: [{ label: '평균', color: STAMP_RED }] } },
    bindings: { data: bind('/kitchen/cooking', '/value') },
  }),
];

const document: CanvasView = {
  kind: 'canvas',
  appearance: 'light',
  accent: STAMP_RED,
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes,
  connectors: [],
  elements: { ticket, stations, totals },
};

export const kitchenTickets: SamplePack = {
  id: 'kitchen-tickets',
  title: { ko: '식당 주방 점심 — 감열지 주문표', en: 'A restaurant kitchen’s lunch rush — thermal tickets' },
  field: { ko: '외식·식당 주방', en: 'Restaurants & kitchens' },
  kind: { ko: '주문표·스테이션 대기·조리 시간', en: 'Order tickets, station queues and cooking time' },
  domain: 'services',
  styles: ['print'],
  summary: {
    ko: '식당 주방의 점심 몰림을 감열지로 — 스테인리스 배식대 위 주문표 레일에 주문마다 좁은 영수증이 매달립니다. 고정폭 글자, 점선 절취선, 찢긴 톱니 아랫단, 출력된 뒤 지난 시간이 큰 숫자로. 주문의 상태는 색과 함께 종이 위 고무도장으로: 새 주문은 도장 없이 NEW, 조리 중엔 파란 «조리중», 배식대에서 기다리면 빨간 원 «완료», 늦어지면 종이가 검게 뒤집힙니다. 아래에는 스테이션별 대기를 금전등록기 롤처럼, 오늘 합계를 계산 영수증처럼, 몰림 동안의 평균 조리 시간. 식당은 지어낸 것이라 예시 데이터입니다.',
    en: 'A restaurant kitchen’s lunch rush on thermal paper — on a brushed steel pass a ticket rail runs along the top, every order hanging from it as a narrow receipt with fixed-width type, a dashed tear line and a torn zigzag foot, the minutes since it printed in big figures. An order’s state is a rubber stamp across its paper as well as a colour: NEW and no stamp when it arrives, a blue «cooking» stamp, a red ring «done» once it waits at the pass, and the paper turned black when it is late. Below, each station’s queue printed like a register roll, the day’s totals as a till receipt, and the average cooking time through the rush. The restaurant is made up. Example data.',
  },
  connectors: [KITCHEN],
  document,
  snapshot,
};
