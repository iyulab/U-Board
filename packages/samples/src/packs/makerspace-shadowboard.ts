import type { Binding, CanvasView, ElementDefinition, Node, Widget } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { svgDataUrl } from '../frame.js';
import { snapshot } from '../snapshots/makerspace-shadowboard.js';

// A makerspace's tool wall as a shadow board: a pegboard with every tool hung on it over its own shadow, painted in red,
// so a missing tool is seen at a glance — the shadow shows. A tool lent out shows its shadow and a black embossed
// label tape with who has it and when it is due back; one overdue shows a red tape with a bang; one away for repair a
// yellow tape with a gear. Below, the machines — three printers, a laser cutter, a CNC router — each a card with what
// it is doing, how far it is and who booked it. On the right the space's name on label tape, the figures now, the
// key, the machine bookings for the evening and the loans through the day. The space is made up, so the values are
// example data.

export const SHOP: ExampleSampleConnector = {
  key: 'shop',
  name: '예시 메이커스페이스 API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 메이커스페이스가 아닙니다' },
};

/** Loans are scanned at the desk; an hour of silence is a desk that has stopped reporting. */
const MAX_AGE_SECONDS = 60 * 60;

const bind = (path: string, valuePath: string): Binding => ({
  adapter: SHOP.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
});

const WIDTH = 1600;
const HEIGHT = 1000;
const BOARD = '#c9a26b';
const BOARD_DARK = '#a8834f';
const SHADOW = '#c8321f';
const STEEL = '#3b4651';
const TAPE = '#16181b';
const TAPE_RED = '#c21f1a';
const TAPE_YELLOW = '#f2c230';
const PAPER = '#faf7f0';
const INK = '#1e2226';
const TEXT = '"Pretendard", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
const EMBOSS = '"Arial Black", "Malgun Gothic", sans-serif';

/** Tool outlines, each a filled path in a 120×48 box — the shape of the tool and of its painted shadow. */
const TOOLS: Record<string, string> = {
  hammer: 'M6 20h86v8H6z M88 5h24v38H88z',
  screwdriver: 'M4 17h40a7 7 0 0 1 0 14H4a7 7 0 0 1 0-14z M44 21h60l10 3-10 3H44z',
  wrench: 'M24 20h62v8H24z M18 9a15 15 0 1 0 0 30l8-8v-14z M100 10a14 14 0 1 1 0 28a14 14 0 1 1 0-28z',
  saw: 'M4 14h30v20H4z M34 11h82l-8 26H34z',
  pliers: 'M4 18l52-3v6L4 24z M4 28l52 1v6L4 34z M56 15l56 9-56 11z',
  drill: 'M8 6h66v22H8z M30 28h20v18H30z M74 14h38v6H74z',
  tape: 'M38 4a20 20 0 1 1 0 40a20 20 0 1 1 0-40z M56 19h56v8H56z',
  level: 'M4 15h112v18H4z',
  clamp: 'M8 4h10v40H8z M8 4h74v9H8z M18 30h50v8H18z M58 38h7v10h-7z',
  chisel: 'M4 17h46a7 7 0 0 1 0 14H4z M50 20h52l12 4-12 4H50z',
  glue: 'M8 8h58v20H8z M24 28h18v18H24z M66 15h34l14 3-14 3H66z',
  square: 'M8 6h14v36H8z M8 30h104v12H8z',
};

const mask = (kind: string) =>
  `url("${svgDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 48"><path d="${TOOLS[kind]}" fill="black"/></svg>`)}")`;

// ── The wall ───────────────────────────────────────────────────────────────────────────────────────────────────

function drawing(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<defs><pattern id="p" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="12" cy="12" r="3.6" fill="#5b4122"/><circle cx="12.6" cy="12.8" r="3.6" fill="${BOARD_DARK}" opacity=".5"/></pattern>
<pattern id="w" width="200" height="40" patternUnits="userSpaceOnUse"><path d="M0 12 C 50 8 120 18 200 12 M0 30 C 70 34 140 26 200 31" stroke="#b8925c" stroke-width="2" fill="none" opacity=".5"/></pattern></defs>
<rect width="${WIDTH}" height="${HEIGHT}" fill="#3a3f45"/>
<rect x="24" y="24" width="992" height="664" rx="4" fill="${BOARD}"/>
<rect x="24" y="24" width="992" height="664" rx="4" fill="url(#w)"/>
<rect x="24" y="24" width="992" height="664" rx="4" fill="url(#p)"/>
<rect x="24" y="24" width="992" height="664" rx="4" fill="none" stroke="#7d5f35" stroke-width="6"/>
<rect x="44" y="60" width="640" height="58" rx="3" fill="${PAPER}"/>
<text x="62" y="102" font-family="Malgun Gothic, sans-serif" font-weight="900" font-size="32" fill="${SHADOW}" letter-spacing="4">공구 벽</text>
<text x="224" y="98" font-family="Malgun Gothic, sans-serif" font-weight="700" font-size="16" fill="#5b4122">빨간 그림자가 보이면 그 공구는 나가 있습니다</text>
<rect x="24" y="704" width="992" height="272" rx="4" fill="#545a61"/>
<rect x="24" y="704" width="992" height="10" fill="#6b7279"/>
<text x="56" y="748" font-family="Arial Black, Malgun Gothic, sans-serif" font-size="22" fill="${PAPER}" letter-spacing="3">장비</text>
<rect x="1032" y="648" width="544" height="328" rx="4" fill="${PAPER}"/>
</svg>`;
  return svgDataUrl(svg);
}

// ── Elements ───────────────────────────────────────────────────────────────────────────────────────────────────

/** A tool's place on the wall — read from `t`. */
const slot: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['t'], properties: { t: { type: 'object' } } },
  template: `<figure class="sl {{t.kind}} {{t.state}}"><i class="shadow"></i><i class="tool"></i><figcaption><b>{{t.name}}</b><span class="tag">{{t.tag}}</span></figcaption></figure>`,
  style: `.sl{position:relative;height:100%;margin:0;box-sizing:border-box;display:grid;grid-template-rows:1fr auto;gap:6px;padding:12px 10px 10px;font-family:${TEXT};color:${INK}}
.shadow,.tool{grid-row:1;grid-column:1;width:100%;height:100%;-webkit-mask:var(--m) center/contain no-repeat;mask:var(--m) center/contain no-repeat}
.shadow{background:${SHADOW}}
.tool{background:linear-gradient(180deg,#5d6b78,${STEEL} 55%,#262d34);transform:translate(-3px,-4px);filter:drop-shadow(0 0 0 transparent)}
figcaption{display:flex;justify-content:space-between;align-items:center;gap:8px;min-height:28px}
b{font-size:14px;font-weight:800;color:#3d2b14}
.tag{padding:3px 10px;border-radius:2px;background:${TAPE};color:#fff;font:700 13px ${EMBOSS};letter-spacing:.06em;text-shadow:0 1px 0 rgba(0,0,0,.6),0 -1px 0 rgba(255,255,255,.25);white-space:nowrap}
.in .tag{display:none}
.out .tool,.overdue .tool,.repair .tool{display:none}
.overdue .tag{background:${TAPE_RED}}
.overdue .tag::before{content:"! "}
.repair .tag{background:${TAPE_YELLOW};color:${INK};text-shadow:0 1px 0 rgba(255,255,255,.5)}
.repair .tag::before{content:"⚙ "}
.repair .shadow{background:repeating-linear-gradient(-45deg,${SHADOW} 0 6px,#e8a08f 6px 12px)}
.hammer{--m:${mask('hammer')}}
.screwdriver{--m:${mask('screwdriver')}}
.wrench{--m:${mask('wrench')}}
.saw{--m:${mask('saw')}}
.pliers{--m:${mask('pliers')}}
.drill{--m:${mask('drill')}}
.tape{--m:${mask('tape')}}
.level{--m:${mask('level')}}
.clamp{--m:${mask('clamp')}}
.chisel{--m:${mask('chisel')}}
.glue{--m:${mask('glue')}}
.square{--m:${mask('square')}}`,
  size: { width: 220, height: 160 },
};

/** A machine on the bench — read from `m`. */
const machine: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['m'], properties: { m: { type: 'object' } } },
  template: `<article class="mc {{m.state}}"><header><b>{{m.name}}</b><i></i></header><small>{{m.kind}}</small><p>{{m.job}}</p><div class="bar" style="--v: {{m.pct}}"><span></span></div><footer><em>{{m.word}}</em><span>{{m.left}}</span></footer></article>`,
  style: `.mc{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto auto 1fr auto auto;gap:5px;padding:12px 14px;background:${PAPER};border-radius:4px;box-shadow:0 3px 0 #2c3136;font-family:${TEXT};color:${INK}}
header{display:flex;justify-content:space-between;align-items:center}
b{font-size:17px;font-weight:900}
i{display:grid;place-items:center;width:24px;height:24px;border-radius:50%;font:900 12px ${TEXT};font-style:normal;box-sizing:border-box}
small{font-size:12px;color:#5b6168}
p{margin:0;font-size:14px;font-weight:700}
.bar{height:8px;border-radius:4px;background:#e2ddd2;overflow:hidden}
.bar span{display:block;height:100%;width:calc(var(--v) * 1%);background:${STEEL}}
footer{display:flex;justify-content:space-between;font-size:13px}
em{font-style:normal;font-weight:900}
.running i{background:#2e8b57;color:#fff}
.running i::before{content:"▶"}
.idle i{border:3px solid #9aa0a6}
.booked i{background:${TAPE_YELLOW};color:${INK}}
.booked i::before{content:"◷"}
.fault{background:repeating-linear-gradient(-45deg,${PAPER} 0 8px,#f1dfda 8px 16px)}
.fault i{background:${TAPE_RED};color:#fff}
.fault i::before{content:"✕"}
.fault em{color:${TAPE_RED}}`,
  size: { width: 176, height: 196 },
};

/** The space's name, on label tape. */
const title: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['t'], properties: { t: { type: 'object' } } },
  template: `<header class="tt"><small>{{t.series}}</small><h1><span>{{t.name}}</span></h1><div><span>{{t.date}}</span><b>{{t.time}}</b></div></header>`,
  style: `.tt{height:100%;box-sizing:border-box;display:grid;align-content:center;gap:6px;font-family:${TEXT};color:${PAPER}}
small{font-size:14px;font-weight:700;letter-spacing:.14em;color:#c9ced3}
h1{margin:0}
h1 span{display:inline-block;padding:6px 18px;background:${TAPE_RED};color:#fff;font:400 38px ${EMBOSS};letter-spacing:.08em;text-shadow:0 2px 0 rgba(0,0,0,.45),0 -1px 0 rgba(255,255,255,.3);transform:rotate(-1deg)}
div{display:flex;justify-content:space-between;align-items:baseline}
div span{font-size:16px}
b{padding:0 12px;background:${TAPE};color:#fff;font:400 26px ${EMBOSS};letter-spacing:.06em}`,
  size: { width: 532, height: 160 },
};

/** The figures now, on paper tags. */
const figures: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, value: { type: 'string' }, note: { type: 'string' } } } } },
  },
  template: `<dl class="fg">{{#items}}<div><dt>{{label}}</dt><dd>{{value}}</dd><small>{{note}}</small></div>{{/items}}</dl>`,
  style: `.fg{margin:0;height:100%;box-sizing:border-box;display:grid;grid-template-columns:repeat(3,1fr);gap:14px;font-family:${TEXT};color:${INK}}
div{display:grid;align-content:center;justify-items:center;text-align:center;background:${PAPER};border-radius:4px;box-shadow:0 3px 0 #2c3136}
dt{font-size:13px;font-weight:700}
dd{margin:0;font-size:30px;font-weight:900;color:${SHADOW}}
small{font-size:12px}`,
  size: { width: 532, height: 110 },
};

/** The key to the shadows and the tapes. */
const legend: ElementDefinition = {
  render: 'template',
  props: { type: 'object', properties: {} },
  template: `<ul class="ky"><li><i class="tool"></i>제자리</li><li><i class="sh"></i><b>회원 214</b>대여 중</li><li><b class="red">! 기한</b>지남</li><li><b class="yel">⚙ 수리</b>중</li></ul>`,
  style: `.ky{height:100%;box-sizing:border-box;margin:0;padding:0 14px;list-style:none;display:flex;align-items:center;justify-content:space-between;background:${PAPER};border-radius:4px;box-shadow:0 3px 0 #2c3136;font:800 13px ${TEXT};color:${INK}}
li{display:flex;align-items:center;gap:6px}
i{display:inline-block;width:30px;height:12px;border-radius:2px}
.tool{background:${STEEL}}
.sh{background:${SHADOW}}
b{padding:2px 6px;background:${TAPE};color:#fff;font:700 11px ${EMBOSS};letter-spacing:.05em}
.red{background:${TAPE_RED}}
.yel{background:${TAPE_YELLOW};color:${INK}}`,
  size: { width: 532, height: 50 },
};

/** The evening's machine bookings. */
const bookings: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { time: { type: 'string' }, machine: { type: 'string' }, who: { type: 'string' }, what: { type: 'string' }, state: { type: 'string' } } } } },
  },
  template: `<section class="bk"><h2>오늘 저녁 장비 예약</h2><ol>{{#items}}<li class="{{state}}"><b>{{time}}</b><strong>{{machine}}</strong><span>{{what}}</span><small>{{who}}</small></li>{{/items}}</ol></section>`,
  style: `.bk{height:100%;box-sizing:border-box;padding:14px 18px;background:${PAPER};border-radius:4px;box-shadow:0 3px 0 #2c3136;font-family:${TEXT};color:${INK}}
h2{margin:0 0 8px;font-size:17px;font-weight:900}
ol{margin:0;padding:0;list-style:none;display:grid;gap:4px}
li{display:grid;grid-template-columns:68px 96px 1fr 70px;align-items:center;gap:10px;padding:5px 6px;border-bottom:1px dashed #cfc8b8;font-size:14px}
b{font-weight:900}
strong{font-weight:800}
small{text-align:right;color:#5b6168}
.now{background:#fbe9c6}
.now b::before{content:"▶ "}
.done{opacity:.55}`,
  size: { width: 532, height: 226 },
};

// ── The board ──────────────────────────────────────────────────────────────────────────────────────────────────

const node = (id: string, x: number, y: number, width: number, height: number, widget: Widget): Node => ({ id, x, y, width, height, anchored: false, widget });

const SLOTS = ['hammer', 'saw', 'drill', 'level', 'wrench', 'pliers', 'screwdriver', 'clamp', 'tape', 'chisel', 'glue', 'square'] as const;
const MACHINES = ['p1', 'p2', 'p3', 'laser', 'cnc'] as const;

const nodes: Node[] = [
  ...SLOTS.map((id, i) =>
    node(`slot-${id}`, 48 + (i % 4) * 240, 130 + Math.floor(i / 4) * 184, 220, 160, { type: 'element:slot', props: { t: {} }, bindings: { t: bind('/shop/tools', `/value/${id}`) } })
  ),
  ...MACHINES.map((id, i) =>
    node(`machine-${id}`, 48 + i * 192, 766, 176, 196, { type: 'element:machine', props: { m: {} }, bindings: { m: bind('/shop/machines', `/value/${id}`) } })
  ),
  node('title', 1040, 30, 532, 160, { type: 'element:title', props: { t: {} }, bindings: { t: bind('/shop/now', '/value') } }),
  node('figures', 1040, 204, 532, 110, { type: 'element:figures', props: { items: [] }, bindings: { items: bind('/shop/figures', '/value') } }),
  node('legend', 1040, 330, 532, 50, { type: 'element:legend', props: {} }),
  node('bookings', 1040, 398, 532, 226, { type: 'element:bookings', props: { items: [] }, bindings: { items: bind('/shop/bookings', '/value') } }),
  node('loans', 1052, 660, 508, 300, {
    type: 'chart.bar',
    props: { title: '오늘 시간별 공구 대여 (건)', data: [], mapping: { x: 'hour', y: 'loans' }, options: { series: [{ label: '대여', color: SHADOW }] } },
    bindings: { data: bind('/shop/loans', '/value') },
  }),
];

const document: CanvasView = {
  kind: 'canvas',
  appearance: 'light',
  accent: SHADOW,
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes,
  connectors: [],
  elements: { slot, machine, title, figures, legend, bookings },
};

export const makerspaceShadowboard: SamplePack = {
  id: 'makerspace-shadowboard',
  title: { ko: '메이커스페이스 공구 벽 — 그림자판', en: 'A makerspace’s tool wall — a shadow board' },
  field: { ko: '메이커스페이스·공방', en: 'Makerspace & workshop' },
  kind: { ko: '공구 대여·장비 상태·예약', en: 'Tool loans, machines and bookings' },
  summary: {
    ko: '메이커스페이스의 공구 벽을 그림자판으로 — 타공판에 공구마다 제 모양의 빨간 그림자를 칠해 두고 그 위에 공구를 건다. 그래서 빠진 공구는 한눈에 보인다: 그림자가 드러난다. 빌려 간 공구는 그림자와 검은 엠보싱 라벨(누가·언제까지), 기한이 지난 것은 빨간 라벨에 느낌표, 수리 중인 것은 노란 라벨에 톱니와 빗금 그림자. 아래에는 장비 — 3D 프린터 셋, 레이저 커터, CNC — 를 카드마다 지금 하는 일·진행·예약자로. 오른쪽에 라벨 테이프로 쓴 공간 이름, 지금 수치, 범례, 오늘 저녁 장비 예약, 시간별 대여. 메이커스페이스는 지어낸 것이라 예시 데이터입니다.',
    en: 'A makerspace’s tool wall as a shadow board — a pegboard with every tool hung over its own shadow painted in red, so a missing tool is seen at a glance: its shadow shows. A tool lent out shows its shadow and a black embossed label tape with who has it and until when; one overdue a red tape with a bang; one away for repair a yellow tape with a gear over a hatched shadow. Below, the machines — three 3D printers, a laser cutter, a CNC router — each a card with what it is doing, how far along and who booked it. On the right the space’s name on label tape, the figures now, the key, the evening’s machine bookings and the loans through the day. The space is made up. Example data.',
  },
  connectors: [SHOP],
  document,
  snapshot,
};
