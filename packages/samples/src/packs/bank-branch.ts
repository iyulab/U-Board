import type { Binding, CanvasView, ElementDefinition, Node, Widget } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { svgDataUrl } from '../frame.js';
import { snapshot } from '../snapshots/bank-branch.js';

// A bank branch's floor drawn in a Scandinavian minimal style: an off-white floor, pale birch for the counters and
// the lounge furniture, soft greys for the walls, one sage green and one dusty blue, and a single warm terracotta kept
// for what needs a hand. Thin lines, rounded corners and wide margins; a few plants. Every place a customer can be
// served — six teller windows, three consultation rooms, four cash machines — is a card saying what it does now, its
// state told by a mark as well as a colour: a full dot serving or working, a half dot away or running low, a ring free
// or out, a dash not open yet. On the right the waiting line by service, the morning's figures and the visitors by the
// hour. The branch is made up, so the values are example data.

export const BANK: ExampleSampleConnector = {
  key: 'bank',
  name: '예시 지점 API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 은행 지점이 아닙니다' },
};

/** The queue machine reports every minute; ten minutes without an answer is a source that has stopped. */
const MAX_AGE_SECONDS = 10 * 60;

const bind = (path: string, valuePath: string): Binding => ({
  adapter: BANK.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
});

const WIDTH = 1600;
const HEIGHT = 1000;
const FLOOR = '#f6f4ef';
const WALL = '#d9d6cf';
const BIRCH = '#e4d3b4';
const INK = '#2f3437';
const MUTED = '#7b7f80';
const SAGE = '#7f9e8c';
const DUSK = '#7b95ab';
const CLAY = '#c4694a';
const SANS = '"Inter", "Pretendard", "Noto Sans KR", "Malgun Gothic", sans-serif';

const DESK = { width: 150, height: 112 };
const ROOM = { width: 176, height: 124 };
const ATM = { width: 132, height: 112 };

// ── The floor ───────────────────────────────────────────────────────────────────────────────────────────────────

function drawing(): string {
  const plant = (x: number, y: number, r: number) =>
    `<circle cx="${x}" cy="${y}" r="${r}" fill="${SAGE}" fill-opacity=".55"/><circle cx="${x - r * 0.4}" cy="${y - r * 0.3}" r="${r * 0.55}" fill="${SAGE}" fill-opacity=".7"/><circle cx="${x}" cy="${y}" r="${r * 0.25}" fill="${BIRCH}"/>`;
  const sofa = (x: number, y: number, w: number) =>
    `<rect x="${x}" y="${y}" width="${w}" height="52" rx="18" fill="${WALL}"/><rect x="${x + 8}" y="${y + 14}" width="${w - 16}" height="30" rx="12" fill="#ecebe6"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<rect width="${WIDTH}" height="${HEIGHT}" fill="${FLOOR}"/>
<rect x="40" y="40" width="1040" height="920" rx="22" fill="#fbfaf7" stroke="${WALL}" stroke-width="10"/>
<rect x="56" y="212" width="1008" height="20" rx="10" fill="${BIRCH}"/>
<text x="64" y="70" fill="${MUTED}" font-size="15" font-family='${SANS}' letter-spacing=".12em">창구</text>
<rect x="760" y="610" width="304" height="334" rx="16" fill="#eef1f3" stroke="${WALL}" stroke-width="4"/>
<text x="780" y="600" fill="${MUTED}" font-size="15" font-family='${SANS}' letter-spacing=".12em">ATM · 24시간</text>
<text x="64" y="652" fill="${MUTED}" font-size="15" font-family='${SANS}' letter-spacing=".12em">상담실</text>
<path d="M 56 666 H 690" stroke="${WALL}" stroke-width="4"/>
<rect x="250" y="330" width="440" height="190" rx="28" fill="${BIRCH}" fill-opacity=".35"/>
${sofa(280, 350, 180)}${sofa(480, 350, 180)}${sofa(280, 450, 180)}${sofa(480, 450, 180)}
<text x="470" y="550" text-anchor="middle" fill="${MUTED}" font-size="15" font-family='${SANS}' letter-spacing=".12em">대기 공간</text>
${plant(120, 300, 30)}${plant(820, 300, 26)}${plant(1010, 520, 32)}${plant(110, 560, 22)}
<rect x="600" y="944" width="140" height="22" fill="${FLOOR}"/>
<path d="M 600 950 q 70 -40 140 0" fill="none" stroke="${WALL}" stroke-width="3" stroke-dasharray="4 6"/>
<text x="670" y="990" text-anchor="middle" fill="${MUTED}" font-size="15" font-family='${SANS}' letter-spacing=".12em">출입구</text>
</svg>`;
  return svgDataUrl(svg);
}

// ── Elements ────────────────────────────────────────────────────────────────────────────────────────────────────

/** The state marks every card shares: the mark carries the meaning, the colour repeats it. */
const MARK_STYLE = `i{font-style:normal;font-size:20px;line-height:1}
.busy i,.ok i{color:${SAGE}}
.away i,.low i{color:${CLAY}}
.free i{color:${DUSK}}
.off i,.closed i{color:${MUTED}}`;

/** A teller window, a room or a machine: its name, what it is doing and the mark of its state — read from `p`. */
const place: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['p'], properties: { p: { type: 'object' } } },
  template: `<section class="pl {{p.state}}"><header><b>{{p.name}}</b>{{#p.task}}<span>{{p.task}}</span>{{/p.task}}</header><p><i>{{p.mark}}</i>{{p.word}}</p><small>{{p.note}}</small></section>`,
  style: `.pl{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr auto;gap:4px;padding:12px 14px;background:#fff;border:1.5px solid ${WALL};border-radius:14px;font-family:${SANS};color:${INK};box-shadow:0 1px 0 rgba(0,0,0,.03)}
header{display:flex;justify-content:space-between;align-items:baseline;gap:6px}
b{font-size:15px;font-weight:600}
span{font-size:12px;color:${MUTED};padding:1px 8px;border-radius:999px;background:${FLOOR}}
p{margin:0;display:flex;align-items:center;gap:8px;font-size:16px;font-weight:600}
small{font-size:12px;color:${MUTED}}
${MARK_STYLE}
.away{border-color:${CLAY}}
.low{border-color:${CLAY}}
.closed,.off{background:${FLOOR};color:${MUTED};border-style:dashed}`,
  size: DESK,
};

/** The number-ticket machine by the door. */
const ticket: ElementDefinition = {
  render: 'template',
  props: { type: 'object', properties: {} },
  template: `<div class="tk"><b>번호표</b><span>업무를 고르세요</span></div>`,
  style: `.tk{height:100%;box-sizing:border-box;display:grid;place-content:center;text-align:center;gap:2px;background:${INK};color:${FLOOR};border-radius:14px;font-family:${SANS}}
b{font-size:16px;font-weight:700}
span{font-size:11px;opacity:.8}`,
  size: { width: 120, height: 70 },
};

/** The branch's name, the hours and the time, set plainly. */
const title: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['name'], properties: { name: { type: 'string' }, sub: { type: 'string' }, date: { type: 'string' }, time: { type: 'string' } } },
  template: `<header class="tt"><h1>{{name}}</h1><p>{{sub}}</p><div><span>{{date}}</span><b>{{time}}</b></div></header>`,
  style: `.tt{height:100%;box-sizing:border-box;display:grid;align-content:center;gap:8px;font-family:${SANS};color:${INK}}
h1{margin:0;font-size:30px;font-weight:600;letter-spacing:-.01em}
p{margin:0;font-size:15px;color:${MUTED}}
div{display:flex;align-items:baseline;gap:14px;padding-top:10px;border-top:1.5px solid ${WALL}}
span{font-size:16px}
b{margin-left:auto;font-size:40px;font-weight:300;color:${INK}}`,
  size: { width: 460, height: 170 },
};

/** The waiting line by service: how many wait, how long, and the number being served. */
const queue: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { task: { type: 'string' }, waiting: { type: 'string' }, wait: { type: 'string' }, now: { type: 'string' } } } } },
  },
  template: `<section class="qu"><h3><span>업무</span><span>대기</span><span>예상</span><span>지금 번호</span></h3><ul>{{#items}}<li><b>{{task}}</b><span>{{waiting}}</span><span>{{wait}}</span><strong>{{now}}</strong></li>{{/items}}</ul></section>`,
  style: `.qu{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr;font-family:${SANS};color:${INK}}
h3,li{display:grid;grid-template-columns:1.1fr .8fr 1fr 1fr;align-items:center;gap:8px}
h3{margin:0;padding:0 4px 8px;font-size:12px;font-weight:500;color:${MUTED};letter-spacing:.06em;border-bottom:1.5px solid ${WALL}}
ul{margin:0;padding:0;list-style:none;display:grid;align-content:start}
li{padding:8px 4px;border-bottom:1px solid ${WALL};font-size:16px;line-height:1.3}
b{font-weight:600}
strong{font-size:20px;font-weight:300;line-height:1.2;font-variant-numeric:tabular-nums}`,
  size: { width: 460, height: 230 },
};

/** The morning's figures, each on its own pale tile. */
const figures: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, value: { type: 'string' }, note: { type: 'string' } } } } },
  },
  template: `<dl class="fg">{{#items}}<div><dt>{{label}}</dt><dd>{{value}}</dd><small>{{note}}</small></div>{{/items}}</dl>`,
  style: `.fg{margin:0;height:100%;box-sizing:border-box;display:grid;grid-template-columns:repeat(3,1fr);gap:10px;font-family:${SANS};color:${INK}}
div{display:grid;align-content:center;padding:10px 14px;background:#fff;border:1.5px solid ${WALL};border-radius:14px}
dt{font-size:12px;color:${MUTED}}
dd{margin:2px 0;font-size:28px;font-weight:300}
small{font-size:11px;color:${MUTED}}`,
  size: { width: 460, height: 100 },
};

/** The key to the marks. */
const legend: ElementDefinition = {
  render: 'template',
  props: { type: 'object', properties: {} },
  template: `<ul class="lg"><li class="busy"><i>●</i>응대·사용 중</li><li class="away"><i>◐</i>자리 비움·부족</li><li class="free"><i>○</i>비어 있음</li><li class="closed"><i>–</i>점검·운영 전</li></ul>`,
  style: `.lg{height:100%;box-sizing:border-box;margin:0;padding:0;list-style:none;display:flex;align-items:center;gap:16px;font:13px ${SANS};color:${INK}}
li{display:flex;align-items:center;gap:5px}
${MARK_STYLE}
i{font-size:16px}`,
  size: { width: 440, height: 28 },
};

// ── The board ───────────────────────────────────────────────────────────────────────────────────────────────────

const node = (id: string, x: number, y: number, width: number, height: number, widget: Widget): Node => ({ id, x, y, width, height, anchored: false, widget });

const at = (kind: 'desks' | 'rooms' | 'atms', id: string): Widget => ({
  type: 'element:place',
  props: { p: {} },
  bindings: { p: bind(`/branch/${kind}`, `/value/${id}`) },
});

const nodes: Node[] = [
  ...['d1', 'd2', 'd3', 'd4', 'd5', 'd6'].map((id, i) => node(`desk-${id}`, 70 + i * 165, 88, DESK.width, DESK.height, at('desks', id))),
  ...['r1', 'r2', 'r3'].map((id, i) => node(`room-${id}`, 70 + i * 200, 690, ROOM.width, ROOM.height, at('rooms', id))),
  ...['a1', 'a2', 'a3', 'a4'].map((id, i) => node(`atm-${id}`, 784 + (i % 2) * 146, 640 + Math.floor(i / 2) * 140, ATM.width, ATM.height, at('atms', id))),
  node('ticket', 610, 850, 120, 70, { type: 'element:ticket', props: {} }),
  node('legend', 260, 254, 440, 28, { type: 'element:legend', props: {} }),
  node('title', 1120, 40, 460, 170, {
    type: 'element:title',
    props: { name: '', sub: '', date: '', time: '' },
    bindings: { name: bind('/branch/now', '/name'), sub: bind('/branch/now', '/sub'), date: bind('/branch/now', '/date'), time: bind('/branch/now', '/time') },
  }),
  node('queue', 1120, 240, 460, 230, { type: 'element:queue', props: { items: [] }, bindings: { items: bind('/branch/queue', '/value') } }),
  node('figures', 1120, 490, 460, 100, { type: 'element:figures', props: { items: [] }, bindings: { items: bind('/branch/figures', '/value') } }),
  node('visitors', 1120, 620, 460, 340, {
    type: 'chart.bar',
    props: { title: '시간대별 내점 고객(명)', data: [], mapping: { x: 'hour', y: 'people' }, options: { series: [{ label: '고객', color: SAGE }] } },
    bindings: { data: bind('/branch/visitors', '/value') },
  }),
];

const document: CanvasView = {
  kind: 'canvas',
  appearance: 'light',
  accent: SAGE,
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes,
  connectors: [],
  elements: { place, ticket, title, queue, figures, legend },
};

export const bankBranch: SamplePack = {
  id: 'bank-branch',
  title: { ko: '은행 지점 창구 — 스칸디나비안 미니멀', en: 'A bank branch’s floor — Scandinavian minimal' },
  field: { ko: '금융·은행', en: 'Banking & finance' },
  kind: { ko: '지점 창구·상담실·ATM 현황', en: 'A branch’s windows, rooms and cash machines' },
  domain: 'services',
  styles: ['minimal'],
  summary: {
    ko: '은행 지점의 객장 현황을 스칸디나비안 미니멀로 — 미색 바닥, 자작나무 빛 카운터와 소파, 부드러운 회색 벽, 세이지 초록과 탁한 파랑 한 가지씩, 손이 필요한 곳에만 쓰는 테라코타, 가는 선과 둥근 모서리, 넉넉한 여백과 화분 몇. 창구 여섯·상담실 셋·ATM 넷이 저마다 지금 무엇을 하는지 카드로 — 상태는 색과 함께 기호로: 꽉 찬 점 응대·사용 중, 반 점 자리 비움·현금 부족, 빈 원 비어 있음·점검, 줄표 운영 전. 오른쪽에 업무별 대기 인원·예상 시간·지금 번호, 오늘 내점·평균 대기·상담 예약, 시간대별 내점 고객. 지점은 지어낸 것이라 예시 데이터입니다.',
    en: 'A bank branch’s floor in a Scandinavian minimal style — an off-white floor, birch counters and sofas, soft grey walls, one sage green and one dusty blue, a terracotta kept for what needs a hand, thin lines, rounded corners, wide margins and a few plants. Six teller windows, three consultation rooms and four cash machines each say on a card what they are doing now, the state told by a mark as well as a colour: a full dot serving or working, a half dot away or low on cash, a ring free or out for service, a dash not open yet. On the right the waiting line by service with the expected wait and the number being served, the day’s visitors, the average wait and the appointments, and the visitors by the hour. The branch is made up. Example data.',
  },
  connectors: [BANK],
  document,
  snapshot,
};
