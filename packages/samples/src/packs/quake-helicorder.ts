import type { Binding, CanvasView, ElementDefinition, Node, Widget } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { svgDataUrl } from '../frame.js';
import { snapshot } from '../snapshots/quake-helicorder.js';

// A seismic network's stations drawn as a drum recorder's paper: cream chart paper ruled by the minute, a red margin,
// and every station a channel across it with its trace inked as the recorder would draw it now. A channel tells its
// state by the trace itself as well as by its ink: a fine tremor when quiet, a swelling wiggle in blue when it felt
// something, a burst in red when it crossed its alert level, a dashed flat line in grey when it stopped reporting —
// and by a sign at its end. Below, the event the network picked out; on the right the network's name stamped on the
// paper's header, the figures now, the key, the recent events and the detections through the week. The network and
// its stations are made up, so the values are example data.

export const NET: ExampleSampleConnector = {
  key: 'net',
  name: '예시 지진 관측망 API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 관측망·지진이 아닙니다' },
};

/** Stations report every second; two minutes of silence is a station that has stopped. */
const MAX_AGE_SECONDS = 2 * 60;

const bind = (path: string, valuePath: string): Binding => ({
  adapter: NET.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
});

const WIDTH = 1600;
const HEIGHT = 1000;
const PAPER = '#f6f0e1';
const RULE = '#e2d6bb';
const MARGIN = '#d2554a';
const INK = '#1d1f24';
const BLUE = '#2357a6';
const RED = '#c4231b';
const GREY = '#8f8a80';
const TEXT = '"Pretendard", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
const MONO = '"JetBrains Mono", "Consolas", "D2Coding", monospace';

/** A deterministic tremor — the same trace on every render. */
function noise(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648 - 0.5;
  };
}

/** One trace as the recorder draws it across a 700×60 strip: a base tremor and, for some, a burst towards now. */
function trace(colour: string, base: number, burst: number, from: number, seed: number, dashed = false): string {
  const r = noise(seed);
  const points: string[] = [];
  for (let x = 0; x <= 700; x += 2.5) {
    const t = x < from ? 0 : Math.exp(-((x - from) / 70)) * Math.min(1, (x - from) / 12);
    const amp = dashed ? 0 : base + burst * t;
    points.push(`${x.toFixed(1)},${(30 + r() * 2 * amp).toFixed(1)}`);
  }
  const line = dashed
    ? `<path d="M0 30 H 420" stroke="${colour}" stroke-width="1.6" stroke-dasharray="6 5" fill="none"/>`
    : `<polyline points="${points.join(' ')}" stroke="${colour}" stroke-width="1.4" fill="none" stroke-linejoin="round"/>`;
  return `url("${svgDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 60" preserveAspectRatio="none">${line}</svg>`)}")`;
}

// ── The paper ──────────────────────────────────────────────────────────────────────────────────────────────────

function drawing(): string {
  const rules: string[] = [];
  for (let y = 40; y < 980; y += 20) rules.push(`<path d="M24 ${y} H 1016" stroke="${RULE}" stroke-width="1"/>`);
  const minutes: string[] = [];
  for (let i = 0; i <= 10; i++) {
    const x = 160 + i * 71;
    minutes.push(`<path d="M${x} 110 V 740" stroke="${i % 5 === 0 ? '#cdbd98' : RULE}" stroke-width="${i % 5 === 0 ? 1.6 : 1}"/>`);
    minutes.push(`<text x="${x}" y="100" font-family="Consolas, monospace" font-size="13" fill="${i === 10 ? RED : '#7d6f55'}" text-anchor="middle">14:${String(26 + i).padStart(2, '0')}${i === 10 ? ' ▼' : ''}</text>`);
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<rect width="${WIDTH}" height="${HEIGHT}" fill="#4b4a47"/>
<rect x="24" y="24" width="992" height="952" fill="${PAPER}"/>
${rules.join('')}
${minutes.join('')}
<path d="M34 24 V 976" stroke="${MARGIN}" stroke-width="2"/>
<text x="160" y="66" font-family="Malgun Gothic, sans-serif" font-weight="800" font-size="20" fill="#5e5340" letter-spacing="2">기록 — 최근 10분</text>
<rect x="1032" y="24" width="544" height="952" fill="#3d3c39"/>
<rect x="1040" y="652" width="528" height="316" rx="3" fill="${PAPER}"/>
</svg>`;
  return svgDataUrl(svg);
}

// ── Elements ───────────────────────────────────────────────────────────────────────────────────────────────────

/** A station's channel across the paper — read from `c`. */
const channel: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['c'], properties: { c: { type: 'object' } } },
  template: `<article class="ch {{c.state}}"><header><b>{{c.code}}</b><small>{{c.place}}</small></header><div class="tr"></div><aside><i></i><strong>{{c.pga}}</strong><span>gal</span><em>{{c.word}}</em></aside></article>`,
  style: `.ch{height:100%;box-sizing:border-box;display:grid;grid-template-columns:120px 1fr 130px;align-items:center;gap:0;font-family:${TEXT};color:${INK}}
header{display:grid;gap:2px;padding-left:4px}
b{font:800 20px ${MONO};letter-spacing:.04em}
small{font-size:12px;color:#6b604c}
.tr{height:100%;background-repeat:no-repeat;background-size:100% 100%}
aside{display:grid;grid-template-columns:28px auto 1fr;grid-template-rows:auto auto;column-gap:6px;align-items:center;padding:6px 8px;margin-left:8px;border-left:2px solid ${RULE}}
i{grid-row:1/3;display:grid;place-items:center;width:26px;height:26px;border-radius:50%;box-sizing:border-box;font:900 12px ${TEXT};font-style:normal}
strong{font:800 22px ${MONO}}
aside span{font-size:12px;color:#6b604c;align-self:end;padding-bottom:3px}
em{grid-column:2/4;font-style:normal;font-size:13px;font-weight:800;white-space:nowrap}
.calm .tr{background-image:${trace(INK, 1.6, 0, 700, 7)}}
.calm i{border:2px solid ${INK}}
.felt .tr{background-image:${trace(BLUE, 2, 11, 560, 11)}}
.felt i{background:${BLUE};color:#fff}
.felt i::before{content:"◆"}
.felt em,.felt strong{color:${BLUE}}
.alert .tr{background-image:${trace(RED, 2, 26, 520, 23)}}
.alert i{background:${RED};color:#fff;clip-path:polygon(50% 4%,98% 94%,2% 94%);border-radius:0}
.alert i::before{content:"!";padding-top:6px}
.alert em,.alert strong{color:${RED}}
.alert{background:linear-gradient(90deg,transparent 0 120px,rgba(196,35,27,.07) 120px)}
.offline .tr{background-image:${trace(GREY, 0, 0, 700, 3, true)}}
.offline i{background:${GREY};color:#fff}
.offline i::before{content:"✕"}
.offline strong,.offline em{color:${GREY}}`,
  size: { width: 960, height: 92 },
};

/** The event the network picked out — read from `e`. */
const event: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['e'], properties: { e: { type: 'object' } } },
  template: `<section class="ev {{e.level}}"><header><small>{{e.kind}}</small><h2>{{e.title}}</h2></header><dl><div><dt>규모</dt><dd>{{e.magnitude}}</dd></div><div><dt>발생</dt><dd>{{e.time}}</dd></div><div><dt>진원 깊이</dt><dd>{{e.depth}}</dd></div><div><dt>감지 관측소</dt><dd>{{e.stations}}</dd></div></dl><p>{{e.note}}</p></section>`,
  style: `.ev{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr auto;gap:8px;padding:14px 20px;border:2px solid ${INK};background:rgba(255,255,255,.55);font-family:${TEXT};color:${INK}}
small{font:700 12px ${MONO};letter-spacing:.12em;color:#6b604c}
h2{margin:2px 0 0;font-size:22px;font-weight:900}
dl{margin:0;display:grid;grid-template-columns:repeat(4,1fr);gap:12px;align-items:center}
div{border-left:3px solid ${INK};padding-left:10px}
dt{font-size:12px;font-weight:700;color:#6b604c}
dd{margin:0;font:800 24px ${MONO}}
p{margin:0;font-size:14px;font-weight:600}
.felt div:first-child{border-color:${BLUE}}
.felt div:first-child dd{color:${BLUE}}`,
  size: { width: 960, height: 196 },
};

/** The network's name, stamped on the paper's header. */
const title: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['t'], properties: { t: { type: 'object' } } },
  template: `<header class="tt"><small>{{t.series}}</small><h1>{{t.name}}</h1><div><span>{{t.date}}</span><b>{{t.time}}</b></div></header>`,
  style: `.tt{height:100%;box-sizing:border-box;display:grid;align-content:center;gap:6px;padding:14px 20px;background:${PAPER};border:3px double ${INK};font-family:${TEXT};color:${INK}}
small{font:700 13px ${MONO};letter-spacing:.16em;color:#6b604c}
h1{margin:0;font-size:36px;font-weight:900;letter-spacing:.04em}
div{display:flex;justify-content:space-between;align-items:baseline;border-top:1px solid ${INK};padding-top:6px}
span{font-size:15px;font-weight:700}
b{font:800 26px ${MONO};color:${RED}}`,
  size: { width: 528, height: 160 },
};

/** The figures now. */
const figures: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, value: { type: 'string' }, note: { type: 'string' } } } } },
  },
  template: `<dl class="fg">{{#items}}<div><dt>{{label}}</dt><dd>{{value}}</dd><small>{{note}}</small></div>{{/items}}</dl>`,
  style: `.fg{margin:0;height:100%;box-sizing:border-box;display:grid;grid-template-columns:repeat(3,1fr);gap:12px;font-family:${TEXT};color:${INK}}
div{display:grid;align-content:center;justify-items:center;text-align:center;background:${PAPER};border:1px solid #b9ad92}
dt{font-size:13px;font-weight:700}
dd{margin:0;font:800 28px ${MONO}}
small{font-size:12px;color:#6b604c}`,
  size: { width: 528, height: 106 },
};

/** The key to the traces. */
const legend: ElementDefinition = {
  render: 'template',
  props: { type: 'object', properties: {} },
  template: `<ul class="ky"><li><i class="calm"></i>평온</li><li><i class="felt">◆</i>감지</li><li><i class="alert">!</i>경보</li><li><i class="offline">✕</i>끊김</li></ul>`,
  style: `.ky{height:100%;box-sizing:border-box;margin:0;padding:0 18px;list-style:none;display:flex;align-items:center;justify-content:space-between;background:${PAPER};border:1px solid #b9ad92;font:800 14px ${TEXT};color:${INK}}
li{display:flex;align-items:center;gap:8px}
i{display:grid;place-items:center;width:22px;height:22px;border-radius:50%;box-sizing:border-box;font:900 11px ${TEXT};font-style:normal;color:#fff}
.calm{border:2px solid ${INK}}
.felt{background:${BLUE}}
.alert{background:${RED};clip-path:polygon(50% 4%,98% 94%,2% 94%);border-radius:0;padding-top:5px}
.offline{background:${GREY}}`,
  size: { width: 528, height: 50 },
};

/** Recent events, as the network logged them. */
const recent: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { when: { type: 'string' }, where: { type: 'string' }, magnitude: { type: 'string' }, state: { type: 'string' } } } } },
  },
  template: `<section class="rc"><h2>최근 지진 기록</h2><ol>{{#items}}<li class="{{state}}"><b>{{when}}</b><span>{{where}}</span><strong>{{magnitude}}</strong></li>{{/items}}</ol></section>`,
  style: `.rc{height:100%;box-sizing:border-box;padding:14px 18px;background:${PAPER};border:1px solid #b9ad92;font-family:${TEXT};color:${INK}}
h2{margin:0 0 8px;font-size:17px;font-weight:900}
ol{margin:0;padding:0;list-style:none;display:grid;gap:4px}
li{display:grid;grid-template-columns:118px 1fr 56px;align-items:center;gap:10px;padding:5px 4px;border-bottom:1px dotted #b9ad92;font-size:14px}
b{font:700 13px ${MONO}}
strong{font:800 16px ${MONO};text-align:right}
.new{background:rgba(35,87,166,.1)}
.new strong{color:${BLUE}}
.new b::before{content:"◆ ";color:${BLUE}}`,
  size: { width: 528, height: 216 },
};

// ── The board ──────────────────────────────────────────────────────────────────────────────────────────────────

const node = (id: string, x: number, y: number, width: number, height: number, widget: Widget): Node => ({ id, x, y, width, height, anchored: false, widget });

const STATIONS = ['a1', 'a2', 'a3', 'a4', 'a5', 'a6'] as const;

const nodes: Node[] = [
  ...STATIONS.map((id, i) =>
    node(`channel-${id}`, 40, 116 + i * 104, 960, 92, { type: 'element:channel', props: { c: {} }, bindings: { c: bind('/net/stations', `/value/${id}`) } })
  ),
  node('event', 40, 762, 960, 196, { type: 'element:event', props: { e: {} }, bindings: { e: bind('/net/event', '/value') } }),
  node('title', 1040, 36, 528, 160, { type: 'element:title', props: { t: {} }, bindings: { t: bind('/net/now', '/value') } }),
  node('figures', 1040, 210, 528, 106, { type: 'element:figures', props: { items: [] }, bindings: { items: bind('/net/figures', '/value') } }),
  node('legend', 1040, 330, 528, 50, { type: 'element:legend', props: {} }),
  node('recent', 1040, 394, 528, 244, { type: 'element:recent', props: { items: [] }, bindings: { items: bind('/net/recent', '/value') } }),
  node('week', 1050, 664, 508, 294, {
    type: 'chart.bar',
    props: { title: '이번 주 감지한 지진 (건)', data: [], mapping: { x: 'day', y: 'events' }, options: { series: [{ label: '감지', color: BLUE }] } },
    bindings: { data: bind('/net/week', '/value') },
  }),
];

const document: CanvasView = {
  kind: 'canvas',
  appearance: 'light',
  accent: RED,
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes,
  connectors: [],
  elements: { channel, event, title, figures, legend, recent },
};

export const quakeHelicorder: SamplePack = {
  id: 'quake-helicorder',
  title: { ko: '지진 관측망 — 드럼 기록지', en: 'A seismic network — a drum recorder’s paper' },
  field: { ko: '지진 관측', en: 'Seismic monitoring' },
  kind: { ko: '관측소 진동·지진 기록·감지 건수', en: 'Station shaking, events and detections' },
  summary: {
    ko: '지진 관측망을 드럼 기록지로 — 분 단위 눈금이 그어진 크림색 기록지, 빨간 여백선, 그리고 관측소마다 기록지를 가로지르는 채널 하나와 기록계가 지금 그리는 대로 잉크로 그은 파형. 채널 상태는 잉크 색과 함께 파형 자체로: 평온하면 가는 잔떨림, 무언가를 감지하면 파랗게 부푸는 흔들림, 경보 수준을 넘으면 빨간 폭발, 보고가 끊기면 회색 점선 — 끝에는 기호(빈 원 · ◆ · ! 세모 · ✕). 아래에 관측망이 골라낸 지진, 오른쪽에 기록지 머리에 찍은 관측망 이름, 지금 수치, 범례, 최근 지진 기록, 이번 주 감지 건수. 관측망과 관측소는 지어낸 것이라 예시 데이터입니다.',
    en: 'A seismic network drawn as a drum recorder’s paper — cream chart paper ruled by the minute, a red margin, and every station a channel across it with its trace inked as the recorder draws it now. A channel tells its state by the trace itself as well as by its ink: a fine tremor when quiet, a swelling wiggle in blue when it felt something, a burst in red when it crossed its alert level, a dashed grey line when it stopped reporting — and by a sign at its end (an empty ring, a diamond, a triangle, a cross). Below, the event the network picked out; on the right the network’s name stamped on the paper’s header, the figures now, the key, the recent events and the detections through the week. The network and its stations are made up. Example data.',
  },
  connectors: [NET],
  document,
  snapshot,
};
