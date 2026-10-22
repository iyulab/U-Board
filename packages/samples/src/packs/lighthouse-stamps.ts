import type { Binding, CanvasView, ElementDefinition, Node, Widget } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { svgDataUrl } from '../frame.js';
import { snapshot } from '../snapshots/lighthouse-stamps.js';

// A coast's lighthouses kept as a stamp collection — a stock book's dark page with its glassine strips, and on it a
// stamp for every light: perforated edges, the lighthouse drawn in its frame with its beam, its name, how far its light
// reaches as the face value, its light character and when it was last checked. The state is the postmark struck over
// it: none when the light is steady, a machine cancel's lines when its fog signal is sounding, a square cancel when it is being
// serviced, a red round postmark — and the stamp faded — when the light is out. On the right, an envelope with the
// morning's round and the visibility over the night. The coast and its lights are made up, so the values are example data.

export const LIGHTS: ExampleSampleConnector = {
  key: 'lights',
  name: '예시 항로표지 관리 API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 등대·항로표지가 아닙니다' },
};

/** The lights report every five minutes over the radio link; twenty minutes without one is a link to check. */
const MAX_AGE_SECONDS = 20 * 60;

const bind = (path: string, valuePath: string): Binding => ({
  adapter: LIGHTS.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
});

const WIDTH = 1600;
const HEIGHT = 1000;
const PAGE = '#1f2733';
const STOCK = '#fbf6ea';
const INK = '#26313f';
const RED = '#c0392b';
const SEA = '#2f6f9f';
const SERIF = '"Nanum Myeongjo", "Batang", "AppleMyungjo", serif';
const TEXT = '"Pretendard", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';

/** The stamps, two rows of four in the stock book's strips. */
const STAMPS = [
  { id: 's1', x: 70, y: 150 },
  { id: 's2', x: 340, y: 150 },
  { id: 's3', x: 610, y: 150 },
  { id: 's4', x: 880, y: 150 },
  { id: 's5', x: 70, y: 540 },
  { id: 's6', x: 340, y: 540 },
  { id: 's7', x: 610, y: 540 },
  { id: 's8', x: 880, y: 540 },
] as const;
const STAMP_W = 240;
const STAMP_H = 330;

// ── The stock book ─────────────────────────────────────────────────────────────────────────────────────────────

function drawing(): string {
  // A glassine strip under each row: the pocket a stamp stands in, a shine along its top edge.
  const strip = (y: number) =>
    `<rect x="44" y="${y}" width="1072" height="150" fill="#2b3544"/><rect x="44" y="${y}" width="1072" height="150" fill="url(#glassine)"/><line x1="44" x2="1116" y1="${y}" y2="${y}" stroke="#7d8ba0" stroke-width="1.5"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<defs>
<linearGradient id="glassine" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".18"/><stop offset=".25" stop-color="#ffffff" stop-opacity=".05"/><stop offset="1" stop-color="#ffffff" stop-opacity=".02"/></linearGradient>
<pattern id="linen" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="4" fill="${PAGE}"/><path d="M0 2 H4 M2 0 V4" stroke="#232c39" stroke-width=".6"/></pattern>
</defs>
<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#linen)"/>
<rect x="30" y="30" width="1100" height="940" rx="6" fill="none" stroke="#3a4657" stroke-width="2"/>
${strip(330)}${strip(720)}
<g transform="translate(1160 120) rotate(-2)">
<rect width="400" height="820" fill="#f3ead6" stroke="#cbbd9c"/>
<path d="M0 0 L200 150 L400 0" fill="none" stroke="#cbbd9c" stroke-width="2"/>
${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => `<rect x="${i * 40}" y="0" width="20" height="10" fill="${i % 2 ? SEA : RED}"/><rect x="${i * 40 + 20}" y="810" width="20" height="10" fill="${i % 2 ? RED : SEA}"/>`).join('')}
</g>
</svg>`;
  return svgDataUrl(svg);
}

// ── Elements ───────────────────────────────────────────────────────────────────────────────────────────────────

/** A light as a stamp — read from `s`: the drawing in its frame, the face value (how far it reaches), its name, light
 *  character and last check; its state (`ok`, `fog`, `service`, `out`) is the postmark struck over it. */
const stamp: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['s'], properties: { s: { type: 'object' } } },
  template: `<article class="st {{s.state}}"><div class="face"><p class="value">{{s.range}}<small>해리</small></p><div class="art"><i class="beam"></i><i class="tower"></i><i class="rock"></i></div><h2>{{s.name}}</h2><p class="char">{{s.character}}</p><p class="word">{{s.word}}</p><p class="note">{{s.note}} · {{s.time}}</p><span class="mark" aria-hidden="true"><b>{{s.mark}}</b></span></div></article>`,
  style: `.st{height:100%;box-sizing:border-box;padding:11px;background:${STOCK};
-webkit-mask:radial-gradient(circle 5px,#0000 96%,#000) -10px -10px/20px 20px round,linear-gradient(#000 0 0) content-box;
mask:radial-gradient(circle 5px,#0000 96%,#000) -10px -10px/20px 20px round,linear-gradient(#000 0 0) content-box;
font-family:${TEXT};color:${INK}}
.face{position:relative;height:100%;box-sizing:border-box;border:2px solid ${SEA};padding:8px 10px;display:grid;grid-template-rows:auto 1fr auto auto auto auto;gap:2px;background:#fffdf7;overflow:hidden}
.value{margin:0;font:800 30px/1 ${SERIF};color:${SEA}}.value small{font:600 12px ${TEXT};margin-left:3px}
.art{position:relative;min-height:0;background:linear-gradient(#cfe3ef,#eaf3f8 60%,${SEA} 60%)}
.tower{position:absolute;left:50%;bottom:18%;width:30px;height:62%;transform:translateX(-50%);background:repeating-linear-gradient(#fff 0 12px,${RED} 12px 24px);clip-path:polygon(28% 0,72% 0,100% 100%,0 100%)}
.tower::before{content:"";position:absolute;left:30%;right:30%;top:0;height:10px;background:#fff6c2}
.rock{position:absolute;left:30%;right:30%;bottom:8%;height:14%;background:#5d5348;border-radius:40% 40% 0 0}
.beam{position:absolute;left:50%;top:24%;width:100%;height:18px;transform:translate(-50%,-50%);background:linear-gradient(90deg,#0000,#ffe98a 30% 70%,#0000)}
h2{margin:4px 0 0;font:800 20px/1.2 ${SERIF};white-space:nowrap}
.char{margin:0;font:600 12px ui-monospace,Consolas,monospace;color:#56606c}
.word{margin:0;font-size:15px;font-weight:800}
.note{margin:0;font-size:11px;color:#56606c;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mark{position:absolute;pointer-events:none}
.ok .mark{display:none}
.fog .mark{right:2px;top:44%;width:118px;height:60px;background:repeating-linear-gradient(180deg,#0000 0 9px,#2a3a52cc 9px 12px);transform:rotate(-8deg)}
.fog .mark b{display:none}
.fog .beam{background:linear-gradient(90deg,#0000,#d9dde2 30% 70%,#0000)}
.fog .word{color:#2a3a52}
.service .mark{right:14px;top:40%;display:grid;place-items:center;width:74px;height:46px;border:3px solid #2a3a52;color:#2a3a52;transform:rotate(-6deg);font:800 15px ${TEXT};background:#ffffff99}
.service .word{color:#2a3a52}
.out .mark{right:10px;top:36%;display:grid;place-items:center;width:86px;height:86px;border:4px double ${RED};border-radius:50%;color:${RED};transform:rotate(-12deg);font:800 17px ${TEXT};background:#fff3}
.out .art{filter:grayscale(1) brightness(.85)}.out .beam{display:none}.out .value{color:#8a8f96}
.out .word{color:${RED}}`,
  size: { width: STAMP_W, height: STAMP_H },
};

/** The office's name on the page — read from `n`. */
const banner: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['n'], properties: { n: { type: 'object' } } },
  template: `<header class="bn"><h1>남녘바다 항로표지</h1><p>{{n.date}} {{n.time}} · 등대 {{n.count}}기 · {{n.summary}}</p></header>`,
  style: `.bn{height:100%;display:flex;align-items:baseline;gap:20px;font-family:${SERIF};color:#f3ead6}
h1{margin:0;white-space:nowrap;font-size:34px;font-weight:800;letter-spacing:.06em}
p{margin:0;white-space:nowrap;font:15px ${TEXT};color:#c9d3df}`,
  size: { width: 1060, height: 64 },
};

/** The morning round on the envelope, written as its address lines — read from `items`. */
const round: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { at: { type: 'string' }, what: { type: 'string' }, state: { type: 'string' } } } } },
  },
  template: `<section class="rd"><h2>오늘 아침 순회</h2><ol>{{#items}}<li class="{{state}}"><b>{{at}}</b><span>{{what}}</span></li>{{/items}}</ol></section>`,
  style: `.rd{height:100%;box-sizing:border-box;font-family:${TEXT};color:${INK}}
h2{margin:0 0 8px;font:800 20px ${SERIF}}
ol{margin:0;padding:0;list-style:none;display:grid;gap:8px}
li{display:grid;grid-template-columns:68px 1fr;gap:8px;font-size:14px;line-height:1.35;padding-bottom:6px;border-bottom:1px dashed #b9ab8a}
b{font-weight:800}
.done{color:#8a8576}.done span{text-decoration:line-through}
.now b{color:${RED}}.now b::after{content:" ▶"}`,
  size: { width: 340, height: 300 },
};

// ── The board ──────────────────────────────────────────────────────────────────────────────────────────────────

const node = (id: string, x: number, y: number, width: number, height: number, widget: Widget): Node => ({ id, x, y, width, height, anchored: false, widget });

const nodes: Node[] = [
  node('banner', 60, 56, 1060, 64, { type: 'element:banner', props: { n: {} }, bindings: { n: bind('/lights/now', '/value') } }),
  ...STAMPS.map(({ id, x, y }) => node(`stamp-${id}`, x, y, STAMP_W, STAMP_H, { type: 'element:stamp', props: { s: {} }, bindings: { s: bind('/lights/stations', `/value/${id}`) } })),
  node('visibility', 1200, 300, 330, 300, {
    type: 'chart.line',
    props: { title: '밤사이 해상 시정 (km)', data: [], mapping: { x: 'hour', y: 'km' }, options: { series: [{ label: '시정', color: SEA }] } },
    bindings: { data: bind('/lights/visibility', '/value') },
  }),
  node('round', 1200, 620, 330, 300, { type: 'element:round', props: { items: [] }, bindings: { items: bind('/lights/round', '/value') } }),
];

const document: CanvasView = {
  kind: 'canvas',
  appearance: 'light',
  accent: SEA,
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes,
  connectors: [],
  elements: { stamp, banner, round },
};

export const lighthouseStamps: SamplePack = {
  id: 'lighthouse-stamps',
  title: { ko: '등대와 항로표지 — 우표 수집첩', en: 'A coast’s lighthouses — a stamp stock book' },
  field: { ko: '해양·항로표지', en: 'Lighthouses & aids to navigation' },
  kind: { ko: '등대별 점등 상태와 순회', en: 'Each light’s state and the round' },
  domain: 'transport',
  styles: ['print', 'craft'],
  summary: {
    ko: '한 바닷가의 등대를 우표 수집첩으로 — 어두운 수집첩 종이와 글라신 띠 위에 등대마다 우표 한 장: 톱니 가장자리, 테 안에 그린 등대와 빛줄기, 등대 이름, 빛이 닿는 거리를 액면가로, 등질과 마지막 점검. 상태는 우표 위에 찍힌 소인으로 — 정상 점등이면 소인 없음, 안개 신호가 울리면 기계 소인의 줄, 정비 중이면 네모 소인, 소등이면 붉은 둥근 소인과 바랜 우표. 오른쪽 봉투에 밤사이 해상 시정과 오늘 아침 순회. 바닷가와 등대는 지어낸 것이라 예시 데이터입니다.',
    en: 'A coast’s lighthouses kept as a stamp collection — a stock book’s dark page with its glassine strips and a stamp for every light: perforated edges, the lighthouse drawn in its frame with its beam, its name, how far its light reaches as the face value, its light character and last check. The state is the postmark over it: none when the light is steady, a machine cancel’s lines when its fog signal sounds, a square cancel while it is serviced, a red round postmark on a faded stamp when it is out. On the right, an envelope with the night’s visibility at sea and the morning round. The coast and its lights are made up. Example data.',
  },
  connectors: [LIGHTS],
  document,
  snapshot,
};
