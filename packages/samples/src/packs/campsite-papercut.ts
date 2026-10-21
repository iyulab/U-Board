import type { Binding, CanvasView, ElementDefinition, Node, Widget } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { svgDataUrl } from '../frame.js';
import { snapshot } from '../snapshots/campsite-papercut.js';

// A campground's afternoon made in cut paper: hills of coloured card laid one over another with their shadows, a lake,
// pine trees snipped from green, and every pitch a card cut out and set on the meadow in layers. A pitch's state is told
// by the tent cut on its card, as well as by the card's colour: a solid tent when campers are in, a tent cut only as an
// outline with a dashed cutting line when they are on their way, an empty circle for a free pitch, a cross over hatched
// card when it is closed. Above, the facilities as paper chips; below, the day's arrivals and departures and the
// evening's weather with the campfire rule; on the right the campground's name cut from card, the figures now, the key
// and the pitches booked through the week. The campground is made up, so the values are example data.

export const CAMP: ExampleSampleConnector = {
  key: 'camp',
  name: '예시 캠핑장 API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 캠핑장이 아닙니다' },
};

/** The front office updates the board as campers come and go; an hour of silence is a source that has stopped. */
const MAX_AGE_SECONDS = 60 * 60;

const bind = (path: string, valuePath: string): Binding => ({
  adapter: CAMP.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
});

const WIDTH = 1600;
const HEIGHT = 1000;
const SKY = '#f6ead8';
const CARD = '#fffaf0';
const PINE = '#2f6b4f';
const MOSS = '#7fa865';
const CLAY = '#d9774a';
const SUN = '#f3b33d';
const LAKE = '#7fb6c9';
const INK = '#2c2a25';
const TEXT = '"Pretendard", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';

/** Paper laid in layers: the card itself and two sheets peeking out behind it, offset, each with its shadow. */
const layers = (under: string, deeper: string) => `box-shadow:5px 5px 0 ${under},10px 10px 0 ${deeper},12px 14px 14px rgba(60,40,20,.3)`;

/** A tent, as a polygon. */
const TENT = 'polygon(50% 0,100% 100%,62% 100%,50% 62%,38% 100%,0 100%)';

// ── The landscape ──────────────────────────────────────────────────────────────────────────────────────────────

function drawing(): string {
  const hill = (d: string, fill: string) => `<path d="${d}" fill="${fill}" filter="url(#s)"/>`;
  const pine = (x: number, y: number, h: number) =>
    `<path d="M ${x} ${y - h} L ${x + h * 0.35} ${y - h * 0.45} L ${x + h * 0.18} ${y - h * 0.45} L ${x + h * 0.42} ${y} L ${x - h * 0.42} ${y} L ${x - h * 0.18} ${y - h * 0.45} L ${x - h * 0.35} ${y - h * 0.45} Z" fill="${PINE}" filter="url(#s)"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<defs><filter id="s" x="-10%" y="-10%" width="130%" height="140%"><feDropShadow dx="3" dy="5" stdDeviation="4" flood-color="#5a3d22" flood-opacity=".35"/></filter></defs>
<rect width="${WIDTH}" height="${HEIGHT}" fill="${SKY}"/>
<circle cx="860" cy="150" r="70" fill="${SUN}" filter="url(#s)"/>
${hill('M 0 330 C 180 210 330 250 470 300 C 620 200 780 220 1010 320 L 1010 1000 L 0 1000 Z', '#c9b48e')}
${hill('M 0 420 C 200 330 360 380 520 430 C 700 340 860 360 1010 430 L 1010 1000 L 0 1000 Z', '#a7c08a')}
${hill('M 0 520 C 260 450 520 500 1010 470 L 1010 1000 L 0 1000 Z', MOSS)}
${hill('M 380 640 C 470 610 640 612 720 640 C 650 668 470 670 380 640 Z', LAKE)}
${pine(70, 470, 90)}${pine(130, 480, 70)}${pine(940, 450, 100)}${pine(985, 470, 70)}
${hill('M 0 640 L 1010 640 L 1010 1000 L 0 1000 Z', '#6a9452')}
${hill('M 1020 0 L 1600 0 L 1600 1000 L 1020 1000 Z', '#efe1c8')}
<rect x="1030" y="450" width="540" height="510" fill="${CARD}" filter="url(#s)"/>
</svg>`;
  return svgDataUrl(svg);
}

// ── Elements ───────────────────────────────────────────────────────────────────────────────────────────────────

/** A pitch as a cut card — read from `p`. */
const pitch: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['p'], properties: { p: { type: 'object' } } },
  template: `<article class="pc {{p.state}}"><header><b>{{p.no}}</b><i></i></header><small>{{p.kind}}</small><p>{{p.party}}</p><em>{{p.word}}</em><span>{{p.note}}</span></article>`,
  style: `.pc{width:calc(100% - 12px);height:calc(100% - 14px);box-sizing:border-box;display:grid;grid-template-rows:auto auto 1fr auto auto;gap:2px;padding:12px 14px;background:${CARD};${layers(MOSS, PINE)};font-family:${TEXT};color:${INK};border-radius:4px}
header{display:flex;justify-content:space-between;align-items:center}
b{font-size:24px;font-weight:900;letter-spacing:.02em}
i{position:relative;width:40px;height:30px;background:${CLAY};clip-path:${TENT}}
small{font-size:12px}
p{margin:4px 0 0;font-size:15px;font-weight:800}
em{font-style:normal;font-size:14px;font-weight:800}
span{font-size:12px;border-top:1px solid rgba(44,42,37,.25);padding-top:3px}
.arriving{${layers('#e8c78b', '#c79a4f')}}
.arriving i{background:${CLAY}}
.arriving i::after{content:"";position:absolute;inset:4px 6px 0;background:${CARD};clip-path:${TENT}}
.arriving{outline:2px dashed ${CLAY};outline-offset:-7px}
.free i{width:28px;height:28px;clip-path:none;border-radius:50%;background:transparent;border:3px solid ${PINE};box-sizing:border-box}
.free{${layers('#cfe0c0', '#a7c08a')}}
.free em{color:${PINE}}
.closed{background:repeating-linear-gradient(-45deg,${CARD} 0 7px,#eadfcd 7px 14px);${layers('#c8b9a2', '#9e8f78')}}
.closed i{clip-path:none;background:transparent;width:28px;height:28px}
.closed i::before{content:"✕";font:900 26px ${TEXT};color:#8c3a1e;line-height:28px}
.closed em{color:#8c3a1e}`,
  size: { width: 178, height: 200 },
};

/** The facilities as paper chips. */
const facilities: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, word: { type: 'string' }, state: { type: 'string' } } } } },
  },
  template: `<ul class="fc">{{#items}}<li class="{{state}}"><b>{{name}}</b><span>{{word}}</span></li>{{/items}}</ul>`,
  style: `.fc{height:100%;box-sizing:border-box;margin:0;padding:0 12px 14px 0;list-style:none;display:grid;grid-template-columns:repeat(6,1fr);gap:16px;align-items:center;font-family:${TEXT};color:${INK}}
li{display:grid;justify-items:center;gap:2px;padding:10px 6px;background:${CARD};border-radius:999px;${layers('#e3cfa9', '#c5a875')};text-align:center}
b{font-size:15px;font-weight:900}
span{font-size:12px;font-weight:700}
.ok span::before{content:"● ";color:${PINE}}
.busy{${layers('#f2c98d', CLAY)}}
.busy span::before{content:"▲ ";color:${CLAY}}
.closed{background:repeating-linear-gradient(-45deg,${CARD} 0 6px,#eadfcd 6px 12px)}
.closed span::before{content:"✕ ";color:#8c3a1e}`,
  size: { width: 950, height: 120 },
};

/** The day's arrivals and departures. */
const moves: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { time: { type: 'string' }, what: { type: 'string' }, pitch: { type: 'string' }, state: { type: 'string' }, word: { type: 'string' } } } } },
  },
  template: `<section class="mv"><h2>오늘 입실 · 퇴실</h2><ol>{{#items}}<li class="{{state}}"><b>{{time}}</b><span>{{what}}</span><strong>{{pitch}}</strong><small>{{word}}</small></li>{{/items}}</ol></section>`,
  style: `.mv{width:calc(100% - 12px);height:calc(100% - 14px);box-sizing:border-box;padding:16px 22px;background:${CARD};border-radius:4px;${layers('#e3cfa9', '#c5a875')};font-family:${TEXT};color:${INK}}
h2{margin:0 0 10px;font-size:20px;font-weight:900}
ol{margin:0;padding:0;list-style:none;display:grid;gap:5px}
li{display:grid;grid-template-columns:56px 1fr 56px 86px;align-items:center;gap:10px;padding:5px 8px;border-bottom:2px dotted #d8c7a6;font-size:15px}
b{font-weight:800}
strong{font-weight:900;text-align:center}
small{text-align:right;font-weight:800;font-size:13px}
.done{opacity:.6}
.done small::before{content:"✓ "}
.now{background:#fbe6c4}
.now small::before{content:"▶ "}
.next small::before{content:"○ "}`,
  size: { width: 600, height: 300 },
};

/** The evening's weather and the campfire rule — read from `w`. */
const weather: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['w'], properties: { w: { type: 'object' } } },
  template: `<section class="wt {{w.fire}}"><h2>오늘 저녁</h2><dl><dt>지금 기온</dt><dd>{{w.now}}</dd><dt>밤 최저</dt><dd>{{w.low}}</dd><dt>바람</dt><dd>{{w.wind}}</dd><dt>해 지는 시각</dt><dd>{{w.sunset}}</dd></dl><p><b>모닥불</b><span>{{w.word}}</span></p></section>`,
  style: `.wt{width:calc(100% - 12px);height:calc(100% - 14px);box-sizing:border-box;display:grid;grid-template-rows:auto 1fr auto;gap:8px;padding:16px 20px;background:${CARD};border-radius:4px;${layers('#cfe0c0', '#a7c08a')};font-family:${TEXT};color:${INK}}
h2{margin:0;font-size:20px;font-weight:900}
dl{margin:0;display:grid;grid-template-columns:1fr auto;row-gap:6px;font-size:15px;align-content:start}
dt{font-weight:700}
dd{margin:0;font-weight:900}
p{margin:0;display:flex;justify-content:space-between;align-items:center;padding:8px 12px;border-radius:999px;background:${SUN};font-weight:800}
.allowed p span::before{content:"▲ "}
.banned p{background:repeating-linear-gradient(-45deg,#f1d8c9 0 6px,${CARD} 6px 12px);color:#8c3a1e}
.banned p span::before{content:"✕ "}`,
  size: { width: 330, height: 300 },
};

/** The campground's name, cut from card. */
const title: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['t'], properties: { t: { type: 'object' } } },
  template: `<header class="tt"><small>{{t.series}}</small><h1>{{t.name}}</h1><div><span>{{t.date}}</span><b>{{t.time}}</b></div></header>`,
  style: `.tt{width:calc(100% - 12px);height:calc(100% - 14px);box-sizing:border-box;display:grid;align-content:center;gap:4px;padding:14px 24px;background:${PINE};border-radius:6px;${layers(MOSS, '#c9b48e')};font-family:${TEXT};color:${CARD}}
small{font-size:14px;letter-spacing:.2em;font-weight:700;color:#d7e8c4}
h1{margin:0;font-size:50px;font-weight:900;letter-spacing:.04em;text-shadow:3px 3px 0 #1d4733}
div{display:flex;justify-content:space-between;align-items:baseline}
span{font-size:16px}
b{font-size:30px;font-weight:900;background:${CARD};color:${PINE};padding:0 12px;border-radius:4px}`,
  size: { width: 540, height: 170 },
};

/** The figures now, each a cut card. */
const figures: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, value: { type: 'string' }, note: { type: 'string' } } } } },
  },
  template: `<dl class="fg">{{#items}}<div><dt>{{label}}</dt><dd>{{value}}</dd><small>{{note}}</small></div>{{/items}}</dl>`,
  style: `.fg{margin:0;height:calc(100% - 14px);box-sizing:border-box;display:grid;grid-template-columns:repeat(3,1fr);gap:22px;padding-right:12px;font-family:${TEXT};color:${INK}}
div{display:grid;align-content:center;justify-items:center;text-align:center;background:${CARD};border-radius:4px;${layers('#e8c78b', CLAY)}}
dt{font-size:13px;font-weight:700}
dd{margin:0;font-size:32px;font-weight:900;color:${PINE}}
small{font-size:12px}`,
  size: { width: 540, height: 130 },
};

/** The key to the tents. */
const legend: ElementDefinition = {
  render: 'template',
  props: { type: 'object', properties: {} },
  template: `<ul class="ky"><li><i class="in"></i>입실</li><li><i class="arriving"></i>오는 중 — 오린 윤곽</li><li><i class="free"></i>빈 사이트</li><li><i class="closed">✕</i>닫힘</li></ul>`,
  style: `.ky{width:calc(100% - 12px);height:calc(100% - 14px);box-sizing:border-box;margin:0;padding:0 18px;list-style:none;display:flex;align-items:center;justify-content:space-between;background:${CARD};border-radius:999px;${layers('#e3cfa9', '#c5a875')};font:800 14px ${TEXT};color:${INK}}
li{display:flex;align-items:center;gap:8px}
i{position:relative;width:26px;height:20px;display:grid;place-items:center;font-style:normal}
.in{background:${CLAY};clip-path:${TENT}}
.arriving{background:${CLAY};clip-path:${TENT}}
.arriving::after{content:"";position:absolute;inset:3px 4px 0;background:${CARD};clip-path:${TENT}}
.free{width:18px;height:18px;border-radius:50%;border:3px solid ${PINE};box-sizing:border-box}
.closed{color:#8c3a1e;font-weight:900}`,
  size: { width: 540, height: 56 },
};

// ── The board ──────────────────────────────────────────────────────────────────────────────────────────────────

const node = (id: string, x: number, y: number, width: number, height: number, widget: Widget): Node => ({ id, x, y, width, height, anchored: false, widget });

const PITCHES = ['a1', 'a2', 'a3', 'a4', 'a5', 'b1', 'b2', 'b3', 'b4', 'b5'] as const;

const nodes: Node[] = [
  node('facilities', 40, 40, 950, 120, { type: 'element:facilities', props: { items: [] }, bindings: { items: bind('/camp/facilities', '/value') } }),
  ...PITCHES.map((id, i) =>
    node(`pitch-${id}`, 40 + (i % 5) * 193, 196 + Math.floor(i / 5) * 222, 178, 200, { type: 'element:pitch', props: { p: {} }, bindings: { p: bind('/camp/pitches', `/value/${id}`) } })
  ),
  node('moves', 40, 650, 600, 300, { type: 'element:moves', props: { items: [] }, bindings: { items: bind('/camp/moves', '/value') } }),
  node('weather', 660, 650, 330, 300, { type: 'element:weather', props: { w: {} }, bindings: { w: bind('/camp/weather', '/value') } }),
  node('title', 1030, 36, 540, 170, { type: 'element:title', props: { t: {} }, bindings: { t: bind('/camp/now', '/value') } }),
  node('figures', 1030, 228, 540, 130, { type: 'element:figures', props: { items: [] }, bindings: { items: bind('/camp/figures', '/value') } }),
  node('legend', 1030, 380, 540, 56, { type: 'element:legend', props: {} }),
  node('week', 1050, 470, 500, 470, {
    type: 'chart.bar',
    props: { title: '이번 주 예약한 사이트(10곳 중)', data: [], mapping: { x: 'day', y: 'booked' }, options: { series: [{ label: '예약', color: CLAY }] } },
    bindings: { data: bind('/camp/week', '/value') },
  }),
];

const document: CanvasView = {
  kind: 'canvas',
  appearance: 'light',
  accent: CLAY,
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes,
  connectors: [],
  elements: { pitch, facilities, moves, weather, title, figures, legend },
};

export const campsitePapercut: SamplePack = {
  id: 'campsite-papercut',
  title: { ko: '캠핑장의 오후 — 종이 오리기', en: 'A campground’s afternoon — cut paper' },
  field: { ko: '캠핑·야외 여가', en: 'Camping & the outdoors' },
  kind: { ko: '사이트 입실·편의시설·입퇴실·날씨', en: 'Pitches, facilities, arrivals and the weather' },
  summary: {
    ko: '캠핑장의 오후를 종이 오리기로 — 겹겹이 놓은 색 판지 언덕과 그 그림자, 호수, 초록 종이를 오린 소나무, 그리고 풀밭 위에 층층이 오려 놓은 사이트 카드. 사이트 상태는 카드 색과 함께 카드에 오린 텐트로: 입실이면 꽉 찬 텐트, 오는 중이면 윤곽만 오린 텐트와 점선 오림선, 빈 사이트는 빈 원, 닫힌 곳은 빗금 판지에 ✕. 위에는 편의시설을 종이 칩으로, 아래에는 오늘 입실·퇴실과 저녁 날씨·모닥불 규칙, 오른쪽에 판지를 오린 캠핑장 이름, 지금 수치, 범례, 이번 주 예약. 캠핑장은 지어낸 것이라 예시 데이터입니다.',
    en: 'A campground’s afternoon made in cut paper — hills of coloured card laid over one another with their shadows, a lake, pines snipped from green, and every pitch a card cut out and set on the meadow in layers. A pitch tells its state by the tent cut on its card, as well as by the card’s colour: a solid tent when campers are in, a tent cut only as an outline with a dashed cutting line when they are on their way, an empty circle for a free pitch, a cross over hatched card when it is closed. Above, the facilities as paper chips; below, the day’s arrivals and departures and the evening’s weather with the campfire rule; on the right the campground’s name cut from card, the figures now, the key and the pitches booked through the week. The campground is made up. Example data.',
  },
  connectors: [CAMP],
  document,
  snapshot,
};
