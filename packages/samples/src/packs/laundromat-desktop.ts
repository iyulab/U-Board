import type { Binding, CanvasView, ElementDefinition, Node, Widget } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { svgDataUrl } from '../frame.js';
import { snapshot } from '../snapshots/laundromat-desktop.js';

// A coin laundry watched on a nineties desktop: a teal desktop with its icons, grey bevelled windows with navy title bars,
// sunken panels, block progress bars and a taskbar along the bottom. One window holds the washers, one the dryers, each
// machine a raised tile with its door, its state and the minutes left as a segmented bar; beside them a properties
// window with the shop's figures, a window with the uses by the hour, and a message box about the broken dryer. A
// machine's state is told by an icon as well as a colour — a play mark running, a tick done and waiting to be emptied,
// an empty door free, a cross out of order. The shop is made up, so the values are example data.

export const SHOP: ExampleSampleConnector = {
  key: 'shop',
  name: '예시 빨래방 API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 빨래방이 아닙니다' },
};

/** The machines report every minute; ten minutes of silence is a source that has stopped. */
const MAX_AGE_SECONDS = 10 * 60;

const bind = (path: string, valuePath: string): Binding => ({
  adapter: SHOP.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
});

const WIDTH = 1600;
const HEIGHT = 1000;
const DESKTOP = '#008080';
const FACE = '#c0c0c0';
const LIGHT = '#ffffff';
const SHADE = '#808080';
const DARK = '#000000';
const NAVY = '#000080';
const TITLE_END = '#1084d0';
const RED = '#c00000';
const GREEN = '#008000';
const UI = '"Tahoma", "Dotum", "Gulim", "Malgun Gothic", sans-serif';

/** A raised bevel: light on the top and left, shade and black on the bottom and right. */
const raised = `background:${FACE};box-shadow:inset -1px -1px 0 ${DARK},inset 1px 1px 0 ${LIGHT},inset -2px -2px 0 ${SHADE},inset 2px 2px 0 #dfdfdf`;
/** A sunken well: the bevel turned inside out. */
const sunken = `box-shadow:inset 1px 1px 0 ${SHADE},inset 2px 2px 0 ${DARK},inset -1px -1px 0 ${LIGHT},inset -2px -2px 0 #dfdfdf`;

/** A window's frame and title bar, the same in every element. */
const windowStyle = `.w{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr;padding:3px;${raised};font-family:${UI};color:${DARK}}
.bar{display:flex;align-items:center;gap:6px;height:26px;padding:0 4px 0 6px;background:linear-gradient(90deg,${NAVY},${TITLE_END});color:${LIGHT};font-size:15px;font-weight:700}
.bar span{flex:1}
.bar u{width:20px;height:18px;${raised};text-decoration:none;color:${DARK};display:grid;place-items:center;font-size:12px;font-weight:900}
.bar u::after{content:"✕"}
.bar s{width:20px;height:18px;${raised};text-decoration:none;display:grid;place-items:end center;color:${DARK};font-size:11px;font-weight:900;line-height:12px}
.bar s::after{content:"_"}`;

// ── The desktop ────────────────────────────────────────────────────────────────────────────────────────────────

function drawing(): string {
  const icon = (y: number, label: string, art: string) =>
    `<g transform="translate(22 ${y})">${art}<text x="28" y="66" text-anchor="middle" fill="${LIGHT}" font-size="13" font-family='${UI}'>${label}</text></g>`;
  const machine = `<rect x="8" y="4" width="40" height="44" fill="${FACE}" stroke="${DARK}"/><circle cx="28" cy="30" r="12" fill="#9fd3f0" stroke="${DARK}"/><rect x="12" y="8" width="14" height="5" fill="${SHADE}"/>`;
  const bin = `<path d="M14 12 h28 l-3 36 h-22 z" fill="${FACE}" stroke="${DARK}"/><rect x="11" y="7" width="34" height="5" fill="${SHADE}" stroke="${DARK}"/>`;
  const folder = `<path d="M6 14 h18 l4 5 h22 v28 h-44 z" fill="#f4d35e" stroke="${DARK}"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<rect width="${WIDTH}" height="${HEIGHT}" fill="${DESKTOP}"/>
${icon(30, '세탁실', machine)}${icon(120, '영수증', folder)}${icon(210, '휴지통', bin)}
</svg>`;
  return svgDataUrl(svg);
}

// ── Elements ───────────────────────────────────────────────────────────────────────────────────────────────────

/** A window of machines, each a raised tile with its door and a block progress bar. */
const machines: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['title', 'items'],
    properties: {
      title: { type: 'string' },
      columns: { type: 'number' },
      items: { type: 'array', items: { type: 'object', properties: { no: { type: 'string' }, state: { type: 'string' }, word: { type: 'string' }, left: { type: 'string' }, p: { type: 'number' } } } },
    },
  },
  template: `<section class="w"><div class="bar"><span>{{title}}</span><s></s><u></u></div><ol class="ms" style="--c: {{columns}}">{{#items}}<li class="{{state}}" style="--p: {{p}}"><header><b>{{no}}</b><i></i></header><em></em><p>{{word}}</p><div class="pg"><span></span></div><small>{{left}}</small></li>{{/items}}</ol></section>`,
  style: `${windowStyle}
.ms{margin:6px 0 0;padding:12px;list-style:none;display:grid;grid-template-columns:repeat(var(--c),1fr);gap:12px;background:${FACE};${sunken};overflow:hidden}
li{display:grid;grid-template-rows:auto 1fr auto auto auto;justify-items:center;gap:4px;padding:8px;${raised}}
header{justify-self:stretch;display:flex;align-items:center;justify-content:space-between}
b{font-size:17px}
i{width:20px;height:20px;display:grid;place-items:center;font:900 14px ${UI};font-style:normal;color:${LIGHT}}
em{width:62px;height:62px;border-radius:50%;background:#d8e8f0;box-shadow:inset 0 0 0 5px ${SHADE},inset 0 0 0 7px ${DARK};align-self:center}
p{margin:0;font-size:15px;font-weight:700}
.pg{justify-self:stretch;height:16px;padding:2px;background:${LIGHT};${sunken}}
.pg span{display:block;height:100%;width:calc(var(--p) * 1%);background:repeating-linear-gradient(90deg,${NAVY} 0 9px,transparent 9px 11px)}
small{font-size:13px}
.run i{background:${NAVY}}
.run i::after{content:"▶"}
.run em{background:radial-gradient(circle,#7fb8e0 0 40%,#4a8fc4 41% 60%,#d8e8f0 61%)}
.done i{background:${GREEN}}
.done i::after{content:"✓"}
.done p{color:${GREEN}}
.done em{background:radial-gradient(circle,#e8e2d0 0 55%,#d8e8f0 56%)}
.free i{background:${LIGHT};box-shadow:inset 0 0 0 2px ${SHADE}}
.free p{color:${SHADE}}
.out{background:repeating-linear-gradient(45deg,${FACE} 0 8px,#b0b0b0 8px 10px)}
.out i{background:${RED}}
.out i::after{content:"✕"}
.out p{color:${RED}}
.out em{opacity:.45}`,
  size: { width: 860, height: 448 },
};

/** A properties window with the shop's name and figures. */
const shop: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['s'],
    properties: { s: { type: 'object' }, items: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, value: { type: 'string' } } } } },
  },
  template: `<section class="w"><div class="bar"><span>매장 정보</span><s></s><u></u></div><div class="bd"><h1>{{s.name}}</h1><p>{{s.date}} · {{s.hours}}</p><div class="fs"><b>지금</b><dl>{{#items}}<dt>{{label}}</dt><dd>{{value}}</dd>{{/items}}</dl></div></div></section>`,
  style: `${windowStyle}
.bd{display:grid;align-content:start;gap:6px;padding:12px 16px}
h1{margin:0;font-size:28px;font-weight:700}
p{margin:0;font-size:15px}
.fs{position:relative;margin:10px 0 0;border:none;box-shadow:inset 1px 1px 0 ${SHADE},inset -1px -1px 0 ${LIGHT},inset 2px 2px 0 ${LIGHT},inset -2px -2px 0 ${SHADE};padding:10px 14px}
.fs b{position:absolute;top:-9px;left:10px;padding:0 4px;background:${FACE};font-size:14px;font-weight:400}
dl{margin:0;display:grid;grid-template-columns:1fr auto;row-gap:6px;font-size:16px}
dd{margin:0;font-weight:700;padding:1px 8px;background:${LIGHT};${sunken};text-align:right;min-width:90px}`,
  size: { width: 560, height: 250 },
};

/** A message box. */
const message: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['m'], properties: { m: { type: 'object' } } },
  template: `<section class="w"><div class="bar"><span>{{m.title}}</span><u></u></div><div class="bd"><i>!</i><p>{{m.text}}</p><span class="ok">확인</span></div></section>`,
  style: `${windowStyle}
.bd{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:14px;padding:0 16px}
i{width:36px;height:36px;display:grid;place-items:center;background:#ffcc00;clip-path:polygon(50% 0,100% 100%,0 100%);font:900 20px ${UI};font-style:normal;padding-top:8px;box-sizing:border-box}
p{margin:0;font-size:16px;line-height:1.4}
.ok{font:15px ${UI};padding:4px 22px;${raised};outline:1px dotted ${DARK};outline-offset:-5px}`,
  size: { width: 560, height: 130 },
};

/** The taskbar: the start button, a button for each window, the clock. */
const taskbar: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['time'], properties: { time: { type: 'string' } } },
  template: `<footer class="tb"><b>⊞ 시작</b><span>세탁기</span><span>건조기</span><span>매장 정보</span><span>시간대별 이용</span><time>{{time}}</time></footer>`,
  style: `.tb{height:100%;box-sizing:border-box;display:flex;align-items:center;gap:6px;padding:4px;${raised};font:14px ${UI};color:${DARK}}
b{padding:4px 12px;${raised};font-weight:700}
span{padding:4px 14px;width:150px;${raised}}
span:first-of-type{${sunken};background:repeating-conic-gradient(${FACE} 0 25%,#dcdcdc 0 50%) 0 0/2px 2px}
time{margin-left:auto;padding:4px 14px;${sunken}}`,
  size: { width: 1600, height: 40 },
};

/** The uses by the hour as a bar chart drawn in a window's white well, scaled to `max`. */
const uses: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['title', 'items'],
    properties: {
      title: { type: 'string' },
      max: { type: 'number' },
      items: { type: 'array', items: { type: 'object', properties: { hour: { type: 'string' }, uses: { type: 'number' } } } },
    },
  },
  template: `<section class="w"><div class="bar"><span>{{title}}</span><s></s><u></u></div><ol class="well" style="--max: {{max}}">{{#items}}<li style="--v: {{uses}}"><div><i></i><b>{{uses}}</b></div><small>{{hour}}</small></li>{{/items}}</ol></section>`,
  style: `${windowStyle}
.well{margin:6px 0 0;padding:14px 12px 8px;list-style:none;background:${LIGHT};${sunken};display:grid;grid-auto-flow:column;grid-auto-columns:1fr;column-gap:4px}
li{display:grid;grid-template-rows:1fr auto}
div{position:relative;background:repeating-linear-gradient(to top,#d8d8d8 0 1px,transparent 1px 20%)}
i{position:absolute;bottom:0;left:16%;right:16%;height:calc(var(--v) / var(--max) * 100%);background:repeating-linear-gradient(to top,${NAVY} 0 9px,#3434b0 9px 11px)}
b{position:absolute;left:0;right:0;bottom:calc(var(--v) / var(--max) * 100% + 2px);text-align:center;font-size:13px}
small{padding-top:4px;text-align:center;font-size:12px}`,
  size: { width: 560, height: 500 },
};

// ── The board ──────────────────────────────────────────────────────────────────────────────────────────────────

const node = (id: string, x: number, y: number, width: number, height: number, widget: Widget): Node => ({ id, x, y, width, height, anchored: false, widget });

const nodes: Node[] = [
  node('washers', 110, 24, 860, 448, { type: 'element:machines', props: { title: '세탁기 — 8대', columns: 4, items: [] }, bindings: { items: bind('/shop/washers', '/value') } }),
  node('dryers', 110, 490, 860, 448, { type: 'element:machines', props: { title: '건조기 — 6대', columns: 3, items: [] }, bindings: { items: bind('/shop/dryers', '/value') } }),
  node('shop', 1000, 24, 560, 250, {
    type: 'element:shop',
    props: { s: {}, items: [] },
    bindings: { s: bind('/shop/now', '/value'), items: bind('/shop/figures', '/value') },
  }),
  node('uses', 1000, 290, 560, 500, {
    type: 'element:uses',
    props: { title: '시간대별 이용(회) — 19시는 40분까지', max: 10, items: [] },
    bindings: { items: bind('/shop/hours', '/value') },
  }),
  node('message', 1000, 808, 560, 130, { type: 'element:message', props: { m: {} }, bindings: { m: bind('/shop/message', '/value') } }),
  node('taskbar', 0, 960, 1600, 40, { type: 'element:taskbar', props: { time: '' }, bindings: { time: bind('/shop/now', '/time') } }),
];

const document: CanvasView = {
  kind: 'canvas',
  appearance: 'light',
  accent: NAVY,
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes,
  connectors: [],
  elements: { machines, shop, uses, message, taskbar },
};

export const laundromatDesktop: SamplePack = {
  id: 'laundromat-desktop',
  title: { ko: '코인빨래방 저녁 — 90년대 데스크톱', en: 'A coin laundry’s evening — a nineties desktop' },
  field: { ko: '생활 서비스·무인 매장', en: 'Self-service shops' },
  kind: { ko: '세탁기·건조기 상태와 남은 시간', en: 'Washers and dryers, their states and minutes left' },
  domain: 'services',
  styles: ['retro'],
  summary: {
    ko: '코인빨래방을 90년대 데스크톱 화면으로 — 청록 바탕화면과 아이콘, 남색 제목 표시줄의 회색 입체 창, 움푹한 칸, 블록 진행 막대, 아래 작업 표시줄. 한 창에 세탁기, 한 창에 건조기 — 기계마다 문과 상태, 남은 시간을 칸칸이 차는 막대로. 옆에는 매장 정보 창, 시간대별 이용 창, 고장 난 건조기를 알리는 메시지 상자. 상태는 색과 함께 아이콘으로: ▶ 작동 중, ✓ 끝남(꺼내 주세요), 빈 칸 사용 가능, ✕ 고장 — 고장 난 기계는 빗금. 빨래방은 지어낸 것이라 예시 데이터입니다.',
    en: 'A coin laundry watched on a nineties desktop — a teal desktop with its icons, grey bevelled windows under navy title bars, sunken wells, block progress bars and a taskbar along the bottom. One window holds the washers and one the dryers, each machine with its door, its state and the minutes left as a segmented bar; beside them the shop’s properties, the uses by the hour, and a message box about the broken dryer. A machine tells its state with an icon as well as a colour — ▶ running, ✓ done and waiting to be emptied, an empty box free, ✕ out of order, hatched. The shop is made up. Example data.',
  },
  connectors: [SHOP],
  document,
  snapshot,
};
