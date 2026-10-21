import type { Binding, CanvasView, ElementDefinition, Node, Widget } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { svgDataUrl } from '../frame.js';
import { snapshot } from '../snapshots/callcenter-cork.js';

// A call centre's afternoon pinned to a corkboard: a wooden frame, cork speckled brown, every agent a paper note fixed to
// it. A note's state is told by how it is fixed and by a mark in its corner, as well as by its paper's colour: a strip of
// masking tape across it and a handset while the agent is on a call, a round push pin and an open ring when they are
// ready, a folded corner and a pencil while they write up a call, a single tack and a pause mark on a break. Below, the
// calls waiting on an index card and the day's calls by kind as tally strokes; on the right a kraft paper banner, the
// figures on torn notes, the key and the calls coming in by the hour on a sheet of graph paper. The centre is made up, so
// the values are example data.

export const CENTRE: ExampleSampleConnector = {
  key: 'centre',
  name: '예시 콜센터 API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 콜센터가 아닙니다' },
};

/** The phone system reports every few seconds; five minutes of silence is a source that has stopped. */
const MAX_AGE_SECONDS = 5 * 60;

const bind = (path: string, valuePath: string): Binding => ({
  adapter: CENTRE.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
});

const WIDTH = 1600;
const HEIGHT = 1000;
const CORK = '#c49a6c';
const FRAME = '#7a5434';
const PAPER = '#fffdf6';
const INK = '#2b2a33';
const TALK = '#ffe27a';
const READY = '#c8efc1';
const WRAP = '#bfe1f5';
const BREAK = '#f2d0e4';
const RED = '#d4352b';
const HAND = '"Nanum Pen Script", "Gaegu", "Comic Sans MS", cursive';
const TEXT = '"Pretendard", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';

/** A paper's shadow where it stands off the cork. */
const lift = 'box-shadow:2px 4px 6px rgba(60,35,15,.35)';

/** Masking tape: a translucent cream strip with torn ends. */
const tape = `background:rgba(245,236,205,.82);clip-path:polygon(3% 0,97% 6%,100% 50%,96% 100%,2% 94%,0 45%)`;

/** A push pin's head. */
const pin = (colour: string) => `radial-gradient(circle at 40% 35%,#ffffff 0 2px,${colour} 3px 8px,rgba(0,0,0,.35) 9px,transparent 10px)`;

// ── The board ──────────────────────────────────────────────────────────────────────────────────────────────────

function drawing(): string {
  // Cork's speckle: a block of dots in three browns, repeated.
  const dots = Array.from({ length: 36 }, (_, i) => {
    const x = (i * 37) % 60;
    const y = (i * 23 + Math.floor(i / 6) * 11) % 60;
    const fill = ['#a87b4f', '#d8b48a', '#8f6640'][i % 3];
    return `<circle cx="${x}" cy="${y}" r="${1 + (i % 3) * 0.6}" fill="${fill}"/>`;
  }).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<defs>
<pattern id="c" width="60" height="60" patternUnits="userSpaceOnUse"><rect width="60" height="60" fill="${CORK}"/>${dots}</pattern>
<pattern id="g" x="1030" y="446" width="20" height="20" patternUnits="userSpaceOnUse"><rect width="20" height="20" fill="#fbfdff"/><path d="M 20 0 L 0 0 0 20" fill="none" stroke="#bcd6ea" stroke-width="1"/></pattern>
</defs>
<rect width="${WIDTH}" height="${HEIGHT}" fill="${FRAME}"/>
<rect x="16" y="16" width="${WIDTH - 32}" height="${HEIGHT - 32}" fill="url(#c)"/>
<rect x="16" y="16" width="${WIDTH - 32}" height="${HEIGHT - 32}" fill="none" stroke="#5a3b22" stroke-width="4"/>
<rect x="1036" y="452" width="534" height="510" fill="rgba(60,35,15,.3)"/>
<rect x="1030" y="446" width="534" height="510" fill="url(#g)"/>
<circle cx="1297" cy="460" r="8" fill="${RED}"/><circle cx="1295" cy="458" r="2.5" fill="#ffffff"/>
</svg>`;
  return svgDataUrl(svg);
}

// ── Elements ───────────────────────────────────────────────────────────────────────────────────────────────────

/** An agent as a paper note — read from `a`. */
const agent: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['a'], properties: { a: { type: 'object' } } },
  template: `<article class="nt {{a.state}}"><s></s><header><b>{{a.name}}</b><i></i></header><p>{{a.word}}</p><dl><dt>지금</dt><dd>{{a.since}}</dd><dt>오늘</dt><dd>{{a.calls}}</dd></dl></article>`,
  style: `.nt{position:relative;height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto auto 1fr;gap:4px;padding:22px 16px 12px;background:${PAPER};${lift};font-family:${TEXT};color:${INK}}
s{position:absolute;text-decoration:none}
header{display:flex;justify-content:space-between;align-items:center}
b{font:700 26px ${HAND};line-height:1}
i{font-style:normal;font:700 20px ${TEXT};width:30px;height:30px;display:grid;place-items:center;border-radius:50%;border:2px solid ${INK}}
p{margin:0;font-size:16px;font-weight:800}
dl{margin:0;display:grid;grid-template-columns:auto 1fr;column-gap:10px;align-content:end;font-size:14px;border-top:1px dashed rgba(43,42,51,.4);padding-top:4px}
dt{color:#5b5960}
dd{margin:0;text-align:right;font-weight:700}
.talk{background:${TALK};transform:rotate(-1deg)}
.talk s{left:30%;right:30%;top:-8px;height:22px;${tape}}
.talk i::before{content:"☎"}
.ready{background:${READY};transform:rotate(1deg)}
.ready s{left:calc(50% - 10px);top:2px;width:20px;height:20px;background:${pin('#2f8f46')}}
.ready i{border-radius:50%;border:3px solid #2f8f46}
.wrap{background:${WRAP};clip-path:polygon(0 0,100% 0,100% calc(100% - 24px),calc(100% - 24px) 100%,0 100%)}
.wrap dl{margin-right:20px}
.wrap::after{content:"";position:absolute;right:0;bottom:0;width:24px;height:24px;background:linear-gradient(135deg,#8fb8d0 50%,transparent 50%)}
.wrap s{left:calc(50% - 10px);top:2px;width:20px;height:20px;background:${pin('#2f6fb0')}}
.wrap i{border:none}
.wrap i::before{content:"✎";font-size:24px}
.break{background:${BREAK};transform:rotate(4deg);opacity:.92}
.break s{left:14px;top:4px;width:16px;height:16px;background:${pin('#8a8a8a')}}
.break i{border-style:dashed}
.break i::before{content:"‖"}`,
  size: { width: 220, height: 170 },
};

/** The calls waiting, on an index card. */
const queue: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { no: { type: 'string' }, kind: { type: 'string' }, wait: { type: 'string' }, note: { type: 'string' }, state: { type: 'string' } } } } },
  },
  template: `<section class="qc"><h2>기다리는 전화</h2><ol>{{#items}}<li class="{{state}}"><b>{{no}}</b><span>{{kind}}</span><strong>{{wait}}</strong><small>{{note}}</small></li>{{/items}}</ol></section>`,
  style: `.qc{height:100%;box-sizing:border-box;padding:16px 22px;background:repeating-linear-gradient(${PAPER} 0 39px,#a9c8e6 39px 40px) 0 64px / 100% calc(100% - 64px) no-repeat,${PAPER};border-top:3px solid ${RED};${lift};font-family:${TEXT};color:${INK}}
h2{margin:0 0 16px;font:700 32px ${HAND};line-height:1}
ol{margin:0;padding:0;list-style:none;display:grid;grid-auto-rows:40px}
li{display:grid;grid-template-columns:34px 1fr 90px 120px;align-items:center;gap:10px;font-size:16px}
b{font-weight:800}
strong{text-align:right;font-weight:800}
small{font-size:13px;text-align:right}
.long strong{color:${RED};border:2px solid ${RED};border-radius:50% / 60%;padding:0 6px;text-align:center}
.long b::after{content:" !";color:${RED}}
.callback strong{color:${RED};border:2px solid ${RED};border-radius:50% / 60%;padding:0 6px;text-align:center}
.callback b::after{content:" !";color:${RED}}
.callback small{font-weight:700}
.callback small::before{content:"↺ "}`,
  size: { width: 560, height: 340 },
};

/** The day's calls by kind, as tally strokes — one stroke for every five calls. */
const tally: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { kind: { type: 'string' }, count: { type: 'string' }, marks: { type: 'number' } } } } },
  },
  template: `<section class="tl"><h2>오늘 문의 — 한 획 5콜</h2><ul>{{#items}}<li><b>{{kind}}</b><i style="--n: {{marks}}"></i><span>{{count}}</span></li>{{/items}}</ul></section>`,
  style: `.tl{height:100%;box-sizing:border-box;padding:16px 20px;background:${PAPER};transform:rotate(-1.2deg);${lift};font-family:${TEXT};color:${INK}}
h2{margin:0 0 12px;font:700 28px ${HAND};line-height:1}
ul{margin:0;padding:0;list-style:none;display:grid;gap:26px}
li{display:grid;grid-template-columns:82px 1fr 44px;align-items:center;gap:8px}
b{font-size:14px}
i{display:block;height:22px;width:calc(var(--n) * 6px);background:repeating-linear-gradient(90deg,${INK} 0 2px,transparent 2px 6px);-webkit-mask:repeating-linear-gradient(90deg,#000 0 30px,transparent 30px 36px);mask:repeating-linear-gradient(90deg,#000 0 30px,transparent 30px 36px)}
span{font-weight:800;text-align:right}`,
  size: { width: 360, height: 340 },
};

/** The centre's name on a kraft paper banner. */
const banner: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['b'], properties: { b: { type: 'object' } } },
  template: `<header class="bn"><s></s><u></u><small>{{b.series}}</small><h1>{{b.name}}</h1><div><span>{{b.date}}</span><b>{{b.time}}</b></div></header>`,
  style: `.bn{position:relative;height:100%;box-sizing:border-box;display:grid;align-content:center;gap:2px;padding:18px 26px 12px;background:#d8b98a;${lift};font-family:${TEXT};color:#3b2a18}
s,u{position:absolute;top:-8px;width:90px;height:24px;text-decoration:none;${tape}}
s{left:18px;transform:rotate(-6deg)}
u{right:18px;transform:rotate(5deg)}
small{font-size:14px;letter-spacing:.2em;font-weight:700}
h1{margin:0;font:700 56px ${HAND};line-height:1}
div{display:flex;justify-content:space-between;align-items:baseline}
span{font-size:16px}
b{font-size:28px;font-weight:800}`,
  size: { width: 540, height: 150 },
};

/** The figures now, each on a torn note. */
const figures: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, value: { type: 'string' }, note: { type: 'string' } } } } },
  },
  template: `<dl class="fg">{{#items}}<div><dt>{{label}}</dt><dd>{{value}}</dd><small>{{note}}</small></div>{{/items}}</dl>`,
  style: `.fg{margin:0;height:100%;box-sizing:border-box;display:grid;grid-template-columns:repeat(3,1fr);gap:16px;font-family:${TEXT};color:${INK}}
div{display:grid;align-content:center;justify-items:center;text-align:center;background:${PAPER};${lift};clip-path:polygon(0 4%,8% 0,20% 3%,34% 0,48% 4%,62% 1%,76% 4%,90% 0,100% 3%,100% 100%,0 100%)}
div:nth-child(2){transform:rotate(1.5deg)}
dt{font-size:13px;font-weight:700}
dd{margin:0;font:700 40px ${HAND};line-height:1}
small{font-size:12px}`,
  size: { width: 540, height: 140 },
};

/** The key to how a note is fixed. */
const legend: ElementDefinition = {
  render: 'template',
  props: { type: 'object', properties: {} },
  template: `<ul class="ky"><li><i class="talk">☎</i>테이프 — 통화</li><li><i class="ready"></i>압정 — 받을 수 있음</li><li><i class="wrap">✎</i>접힌 귀 — 후처리</li><li><i class="break">‖</i>휴식</li></ul>`,
  style: `.ky{height:100%;box-sizing:border-box;margin:0;padding:0 14px;list-style:none;display:flex;align-items:center;justify-content:space-between;background:${PAPER};${lift};font:700 13px ${TEXT};color:${INK}}
li{display:flex;align-items:center;gap:6px}
i{width:24px;height:24px;display:grid;place-items:center;font-style:normal;font-size:14px;box-sizing:border-box}
.talk{background:${TALK}}
.ready{background:${READY};border-radius:50%;border:3px solid #2f8f46}
.wrap{background:${WRAP}}
.break{background:${BREAK};border:2px dashed ${INK};border-radius:50%}`,
  size: { width: 540, height: 56 },
};

// ── The board ──────────────────────────────────────────────────────────────────────────────────────────────────

const node = (id: string, x: number, y: number, width: number, height: number, widget: Widget): Node => ({ id, x, y, width, height, anchored: false, widget });

const AGENTS = ['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8', 'a9', 'a10', 'a11', 'a12'] as const;

const nodes: Node[] = [
  ...AGENTS.map((id, i) =>
    node(`agent-${id}`, 52 + (i % 4) * 240, 46 + Math.floor(i / 4) * 188, 220, 170, { type: 'element:agent', props: { a: {} }, bindings: { a: bind('/centre/agents', `/value/${id}`) } })
  ),
  node('queue', 44, 618, 560, 340, { type: 'element:queue', props: { items: [] }, bindings: { items: bind('/centre/queue', '/value') } }),
  node('tally', 632, 618, 360, 340, { type: 'element:tally', props: { items: [] }, bindings: { items: bind('/centre/tally', '/value') } }),
  node('banner', 1030, 44, 540, 150, { type: 'element:banner', props: { b: {} }, bindings: { b: bind('/centre/now', '/value') } }),
  node('figures', 1030, 214, 540, 140, { type: 'element:figures', props: { items: [] }, bindings: { items: bind('/centre/figures', '/value') } }),
  node('legend', 1030, 372, 540, 56, { type: 'element:legend', props: {} }),
  node('inbound', 1050, 482, 494, 456, {
    type: 'chart.line',
    props: { title: '시간별 들어온 전화(콜) — 14시는 25분까지', data: [], mapping: { x: 'hour', y: 'calls' }, options: { series: [{ label: '인입', color: RED }] } },
    bindings: { data: bind('/centre/inbound', '/value') },
  }),
];

const document: CanvasView = {
  kind: 'canvas',
  appearance: 'light',
  accent: RED,
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes,
  connectors: [],
  elements: { agent, queue, tally, banner, figures, legend },
};

export const callcenterCork: SamplePack = {
  id: 'callcenter-cork',
  title: { ko: '콜센터의 오후 — 코르크판 메모', en: 'A call centre’s afternoon — notes on a corkboard' },
  field: { ko: '고객 상담·콜센터', en: 'Customer service & call centres' },
  kind: { ko: '상담원 상태·대기 콜·문의 유형·인입', en: 'Agents, waiting calls, kinds of call and calls in' },
  summary: {
    ko: '콜센터의 오후를 코르크판에 — 나무 테 안 갈색 반점 코르크에 상담원마다 종이 메모 한 장. 메모의 상태는 종이 색과 함께 붙인 방식과 모서리 표시로: 통화 중이면 마스킹 테이프와 수화기, 받을 수 있으면 둥근 압정과 빈 원, 후처리 중이면 접힌 귀와 연필, 휴식이면 압정 하나에 기운 메모와 쉼표. 아래에는 기다리는 전화를 색인 카드에, 오늘 문의를 유형별 획으로, 오른쪽에 크라프트지 띠, 찢은 메모 위 수치, 범례, 모눈종이 위 시간별 인입. 콜센터는 지어낸 것이라 예시 데이터입니다.',
    en: 'A call centre’s afternoon pinned to a corkboard — cork speckled brown in a wooden frame, every agent a paper note. A note tells its state by how it is fixed and by the mark in its corner, as well as by its paper’s colour: masking tape and a handset while on a call, a round push pin and an open ring when ready, a folded corner and a pencil while writing up a call, a single tack, a tilt and a pause mark on a break. Below, the calls waiting on an index card and the day’s calls by kind as tally strokes; on the right a kraft paper banner, the figures on torn notes, the key and the calls coming in by the hour on graph paper. The centre is made up. Example data.',
  },
  connectors: [CENTRE],
  document,
  snapshot,
};
