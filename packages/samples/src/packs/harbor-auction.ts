import type { Binding, CanvasView, Connector, ElementDefinition, Node, Widget } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { svgDataUrl } from '../frame.js';
import { snapshot } from '../snapshots/harbor-auction.js';

// A fishing harbour's dawn auction drawn as an ukiyo-e woodblock print: Prussian blue and indigo on warm washi, black
// key-block outlines, the sky graded (bokashi) from blue into the paper, curling waves with claw-shaped foam, a
// vermilion sun on the horizon and a vermilion seal. The sea is the top of the print, the harbour mouth between two
// breakwaters the middle and the quay with the auction hall the bottom; each boat is a card saying what it caught and
// where it is — a dashed outline still out fishing, graded blue on its way in (its minutes to the breakwater on the
// line it follows), solid indigo unloading, a pale ochre hatch once its catch is sold. On the right the morning's
// figures, the auction's order and the boxes sold by the half hour. The harbour is made up, so the values are example
// data.

export const HARBOR: ExampleSampleConnector = {
  key: 'harbor',
  name: '예시 위판장 API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 어항이 아닙니다' },
};

/** The auction clerk's tablet answers every few minutes; a quarter of an hour of silence is a source that has stopped. */
const MAX_AGE_SECONDS = 15 * 60;

const bind = (path: string, valuePath: string): Binding => ({
  adapter: HARBOR.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
});

const WIDTH = 1600;
const HEIGHT = 1000;
const WASHI = '#f2e8d0';
const PRUSSIAN = '#1f3f72';
const INDIGO = '#14254a';
const PALE = '#9fb6d3';
const VERMILION = '#c9442c';
const OCHRE = '#d8a948';
const KEY = '#1b1a18';
const SERIF = '"Noto Serif KR", "Nanum Myeongjo", "Batang", serif';

const CARD = { width: 190, height: 96 };
type BoatId = 's1' | 's2' | 'r1' | 'r2' | 'r3' | 'u1' | 'u2' | 'd1' | 'd2';
const BOATS: Record<BoatId, [number, number]> = {
  s1: [120, 150],
  s2: [760, 190],
  r1: [230, 390],
  r2: [500, 340],
  r3: [800, 410],
  u1: [80, 660],
  u2: [290, 660],
  d1: [600, 660],
  d2: [810, 660],
};
const RETURNING: BoatId[] = ['r1', 'r2', 'r3'];

// ── The print ───────────────────────────────────────────────────────────────────────────────────────────────────

/** One big curling wave: a body of Prussian blue, a pale lip and a row of foam claws along its crest. */
function wave(x: number, y: number, w: number, h: number): string {
  const claws = Array.from({ length: Math.max(3, Math.round(w / 34)) }, (_, i) => {
    const cx = x + w * 0.18 + i * 30;
    const cy = y - h * 0.62 + Math.sin(i * 0.9) * 6;
    return `<path d="M ${cx} ${cy} q 7 -14 16 -4 q -7 -2 -8 8" fill="${WASHI}" stroke="${KEY}" stroke-width="1.6"/>`;
  }).join('');
  return `<path d="M ${x} ${y} C ${x + w * 0.15} ${y - h}, ${x + w * 0.7} ${y - h * 1.15}, ${x + w * 0.85} ${y - h * 0.55} C ${x + w * 0.78} ${y - h * 0.7}, ${x + w * 0.62} ${y - h * 0.6}, ${x + w * 0.66} ${y - h * 0.28} C ${x + w * 0.75} ${y - h * 0.1}, ${x + w * 0.92} ${y - h * 0.08}, ${x + w} ${y} Z" fill="${PRUSSIAN}" stroke="${KEY}" stroke-width="3"/>
<path d="M ${x + w * 0.12} ${y - h * 0.45} C ${x + w * 0.3} ${y - h * 0.9}, ${x + w * 0.62} ${y - h * 0.98}, ${x + w * 0.8} ${y - h * 0.6}" fill="none" stroke="${PALE}" stroke-width="5"/>
${claws}`;
}

function drawing(): string {
  const ripples = Array.from({ length: 9 }, (_, i) => {
    const y = 150 + i * 44;
    return `<path d="M 40 ${y} q 30 -10 60 0 t 60 0 t 60 0 t 60 0 t 60 0 t 60 0 t 60 0 t 60 0 t 60 0 t 60 0 t 60 0 t 60 0 t 60 0 t 60 0 t 60 0 t 60 0 t 60 0 t 60 0" fill="none" stroke="${PALE}" stroke-width="1.6" opacity=".55"/>`;
  }).join('');
  const roofTiles = Array.from({ length: 22 }, (_, i) => `<path d="M ${330 + i * 20} 838 v 22" stroke="${KEY}" stroke-width="1.5"/>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<defs>
<linearGradient id="bokashi" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${PRUSSIAN}"/><stop offset="1" stop-color="${PRUSSIAN}" stop-opacity="0"/></linearGradient>
<linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3f6a9e"/><stop offset="1" stop-color="#6f92bb"/></linearGradient>
<filter id="fibre"><feTurbulence type="fractalNoise" baseFrequency=".9 .08" numOctaves="2" seed="11"/><feColorMatrix values="0 0 0 0 .45  0 0 0 0 .38  0 0 0 0 .25  0 0 0 -1.6 1.05"/></filter>
</defs>
<rect width="${WIDTH}" height="${HEIGHT}" fill="${WASHI}"/>
<rect x="40" y="40" width="1040" height="80" fill="url(#bokashi)"/>
<circle cx="960" cy="112" r="34" fill="${VERMILION}"/>
<rect x="40" y="112" width="1040" height="468" fill="url(#sea)" stroke="${KEY}" stroke-width="3"/>
${ripples}
${wave(40, 300, 260, 150)}${wave(900, 330, 180, 110)}${wave(56, 560, 150, 80)}
<rect x="40" y="580" width="1040" height="220" fill="${PALE}" stroke="${KEY}" stroke-width="3"/>
<path d="M 40 570 H 440 L 455 590 H 40 Z" fill="#8a8273" stroke="${KEY}" stroke-width="3"/>
<path d="M 1080 570 H 650 L 635 590 H 1080 Z" fill="#8a8273" stroke="${KEY}" stroke-width="3"/>
<rect x="430" y="532" width="16" height="44" fill="${WASHI}" stroke="${KEY}" stroke-width="2.5"/><rect x="430" y="532" width="16" height="12" fill="${VERMILION}"/>
<rect x="640" y="532" width="16" height="44" fill="${WASHI}" stroke="${KEY}" stroke-width="2.5"/><rect x="640" y="532" width="16" height="12" fill="${INDIGO}"/>
<rect x="40" y="800" width="1040" height="160" fill="${WASHI}" stroke="${KEY}" stroke-width="3"/>
<path d="M 310 860 L 340 820 H 760 L 790 860 Z" fill="${INDIGO}" stroke="${KEY}" stroke-width="3"/>
${roofTiles}
<rect x="330" y="860" width="440" height="90" fill="#e6d6b0" stroke="${KEY}" stroke-width="3"/>
<text x="520" y="92" fill="${WASHI}" font-size="22" font-family='${SERIF}' font-weight="700">동해 — 새벽 바다</text>
<text x="56" y="940" fill="${INDIGO}" font-size="20" font-family='${SERIF}' font-weight="700">물양장 · 하역</text>
<text x="1064" y="940" text-anchor="end" fill="${INDIGO}" font-size="20" font-family='${SERIF}' font-weight="700">얼음 창고 →</text>
<rect width="${WIDTH}" height="${HEIGHT}" filter="url(#fibre)" opacity=".18"/>
<rect x="18" y="18" width="1082" height="964" fill="none" stroke="${KEY}" stroke-width="2"/>
</svg>`;
  return svgDataUrl(svg);
}

// ── Elements ────────────────────────────────────────────────────────────────────────────────────────────────────

/** A boat: its name, what it caught and where it is — read from `b`. */
const boat: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['b'], properties: { b: { type: 'object' } } },
  template: `<section class="bt {{b.state}}"><span>{{b.word}}</span><b>{{b.name}}</b><strong>{{b.catch}}</strong><small>{{b.note}}</small></section>`,
  style: `.bt{height:100%;box-sizing:border-box;display:flex;flex-direction:column;gap:1px;padding:6px 10px 7px;background:${WASHI};border:3px solid ${KEY};font-family:${SERIF};color:${INDIGO}}
span{align-self:flex-start;margin-bottom:auto;padding:0 8px;font-size:13px;font-weight:700;color:${WASHI};background:${KEY}}
b{font-size:15px;font-weight:800}
strong{font-size:16px;font-weight:700;line-height:1.2}
small{font-size:12px}
.sea{border-style:dashed;border-color:${INDIGO}}
.sea span{background:${WASHI};color:${INDIGO};outline:2px dashed ${INDIGO}}
.return{padding-left:24px;background:linear-gradient(90deg,${PRUSSIAN} 0 14px,rgba(31,63,114,.38) 14px,${WASHI} 70%);border-color:${PRUSSIAN}}
.return span{background:${PRUSSIAN}}
.unload{background:${INDIGO};color:${WASHI}}
.unload span{background:${VERMILION}}
.done{padding-right:30px;background:repeating-linear-gradient(135deg,rgba(184,134,40,.75) 0 5px,transparent 5px 10px) right/22px 100% no-repeat,#ecdcb2;color:#43341a;border-color:#7a6a4a}
.done span{background:${OCHRE};color:${KEY}}`,
  size: CARD,
};

/** Where the returning boats are headed: the harbour mouth between the two lighthouses. */
const mouth: ElementDefinition = {
  render: 'template',
  props: { type: 'object', properties: {} },
  template: `<div class="mo">방파제 입구</div>`,
  style: `.mo{height:100%;box-sizing:border-box;display:grid;place-items:center;font:700 15px ${SERIF};color:${WASHI};background:${INDIGO};border:3px solid ${KEY}}`,
  size: { width: 150, height: 38 },
};

/** The auction hall's sign: which floor the lot is on now. */
const hall: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['lot'], properties: { lot: { type: 'string' } } },
  template: `<div class="hl"><b>위판장</b><span>{{lot}}</span></div>`,
  style: `.hl{height:100%;box-sizing:border-box;display:grid;place-items:center;align-content:center;gap:2px;font-family:${SERIF};color:${INDIGO}}
b{font-size:26px;font-weight:800;letter-spacing:.3em}
span{font-size:15px;font-weight:700;color:${VERMILION}}`,
  size: { width: 360, height: 76 },
};

/** The print's cartouche: the title in a framed block, the sub-title and time beside it, and a vermilion seal. */
const title: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['name'], properties: { name: { type: 'string' }, sub: { type: 'string' }, date: { type: 'string' }, time: { type: 'string' } } },
  template: `<header class="tt"><h1>{{name}}</h1><p>{{sub}}<br/>{{date}}<br/><b>{{time}}</b></p><i>어항</i></header>`,
  style: `.tt{position:relative;height:100%;box-sizing:border-box;display:grid;grid-template-columns:auto 1fr;align-items:center;gap:18px;padding:12px 16px;background:${WASHI};border:3px double ${KEY};outline:2px solid ${KEY};outline-offset:4px;font-family:${SERIF};color:${INDIGO}}
h1{margin:0;padding:8px 6px;writing-mode:vertical-rl;font-size:25px;font-weight:800;line-height:1.1;background:#e6d6b0;border:2px solid ${KEY}}
p{margin:0;font-size:17px;font-weight:600;line-height:1.55}
b{font-size:30px;font-weight:800;color:${PRUSSIAN}}
i{position:absolute;right:14px;bottom:14px;width:42px;height:42px;display:grid;place-items:center;font-style:normal;font-size:15px;font-weight:800;color:${WASHI};background:${VERMILION};border-radius:3px;transform:rotate(-4deg)}`,
  size: { width: 460, height: 190 },
};

/** The morning's figures, each a block cut in indigo. */
const figures: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, value: { type: 'string' }, note: { type: 'string' } } } } },
  },
  template: `<dl class="fg">{{#items}}<div><dt>{{label}}</dt><dd>{{value}}</dd><small>{{note}}</small></div>{{/items}}</dl>`,
  style: `.fg{margin:0;height:100%;box-sizing:border-box;display:grid;grid-template-columns:repeat(3,1fr);gap:10px;font-family:${SERIF}}
div{display:grid;align-content:center;padding:8px 10px;background:${INDIGO};color:${WASHI};border:2px solid ${KEY}}
dt{font-size:13px;font-weight:700;color:${PALE}}
dd{margin:2px 0;font-size:28px;font-weight:800}
small{font-size:11px;color:${PALE}}`,
  size: { width: 460, height: 100 },
};

/** The auction's order: sold lots carry a vermilion seal, the lot on the floor a bar, the rest wait in grey. */
const lots: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: {
      items: {
        type: 'array',
        items: { type: 'object', properties: { fish: { type: 'string' }, boxes: { type: 'string' }, price: { type: 'string' }, state: { type: 'string' }, word: { type: 'string' } } },
      },
    },
  },
  template: `<section class="lt"><h3>경매 순서</h3><ol>{{#items}}<li class="{{state}}"><b>{{fish}}</b><span>{{boxes}}</span><span>{{price}}</span><em>{{word}}</em></li>{{/items}}</ol></section>`,
  style: `.lt{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr;gap:8px;font-family:${SERIF};color:${INDIGO}}
h3{margin:0;justify-self:start;padding:2px 12px;font-size:18px;font-weight:800;color:${WASHI};background:${KEY}}
ol{margin:0;padding:0;list-style:none;display:grid;align-content:start;gap:4px}
li{display:grid;grid-template-columns:90px 80px 1fr 96px;align-items:center;gap:8px;padding:6px 8px;border-bottom:2px solid ${KEY};font-size:15px}
b{font-size:17px;font-weight:800}
em{justify-self:end;font-style:normal;font-size:13px;font-weight:700;padding:1px 8px}
.done em{color:${WASHI};background:${VERMILION};border-radius:3px}
.done{color:#6b5a3a}
.now{background:${INDIGO};color:${WASHI};border-left:8px solid ${VERMILION}}
.now em{color:${KEY};background:${WASHI}}
.wait{color:#7d7a72}
.wait em{border:1.5px dashed #7d7a72}`,
  size: { width: 460, height: 250 },
};

/** The key to the boat cards. */
const legend: ElementDefinition = {
  render: 'template',
  props: { type: 'object', properties: {} },
  template: `<ul class="lg"><li><i class="s"></i>조업 중</li><li><i class="r"></i>귀항 중</li><li><i class="u"></i>하역 중</li><li><i class="d"></i>위판 끝</li></ul>`,
  style: `.lg{height:100%;box-sizing:border-box;margin:0;padding:0 10px;list-style:none;display:flex;align-items:center;gap:16px;font:700 14px ${SERIF};color:${INDIGO};background:${WASHI};border:2px solid ${KEY}}
li{display:flex;align-items:center;gap:6px}
i{width:22px;height:15px;border:2.5px solid ${KEY};background:${WASHI}}
.s{border-style:dashed;border-color:${INDIGO}}
.r{background:linear-gradient(90deg,${PRUSSIAN} 40%,${WASHI})}
.u{background:${INDIGO}}
.d{background:repeating-linear-gradient(135deg,rgba(216,169,72,.7) 0 3px,${WASHI} 3px 6px)}`,
  size: { width: 420, height: 34 },
};

// ── The board ───────────────────────────────────────────────────────────────────────────────────────────────────

const node = (id: string, x: number, y: number, width: number, height: number, widget: Widget): Node => ({ id, x, y, width, height, anchored: false, widget });

const BOAT_IDS = Object.keys(BOATS) as BoatId[];

const course = (id: BoatId): Connector => ({
  id: `course-${id}`,
  fromNodeId: `boat-${id}`,
  toNodeId: 'mouth',
  label: '{{value}}',
  labelSize: 13,
  style: { route: 'curved', stroke: INDIGO, strokeWidth: 3, dash: 'dashed', arrow: 'end' },
  bindings: { label: bind('/harbor/eta', `/value/${id}`) },
});

const nodes: Node[] = [
  ...BOAT_IDS.map(id =>
    node(`boat-${id}`, BOATS[id][0], BOATS[id][1], CARD.width, CARD.height, { type: 'element:boat', props: { b: {} }, bindings: { b: bind('/harbor/boats', `/value/${id}`) } })
  ),
  node('mouth', 470, 530, 150, 38, { type: 'element:mouth', props: {} }),
  node('hall', 370, 870, 360, 76, { type: 'element:hall', props: { lot: '' }, bindings: { lot: bind('/harbor/lots', '/value/1/word') } }),
  node('legend', 60, 54, 420, 34, { type: 'element:legend', props: {} }),
  node('title', 1120, 30, 460, 190, {
    type: 'element:title',
    props: { name: '', sub: '', date: '', time: '' },
    bindings: { name: bind('/harbor/now', '/name'), sub: bind('/harbor/now', '/sub'), date: bind('/harbor/now', '/date'), time: bind('/harbor/now', '/time') },
  }),
  node('figures', 1120, 240, 460, 100, { type: 'element:figures', props: { items: [] }, bindings: { items: bind('/harbor/figures', '/value') } }),
  node('lots', 1120, 360, 460, 250, { type: 'element:lots', props: { items: [] }, bindings: { items: bind('/harbor/lots', '/value') } }),
  node('boxes', 1120, 630, 460, 330, {
    type: 'chart.bar',
    props: { title: '30분마다 위판한 상자', data: [], mapping: { x: 'hour', y: 'boxes' }, options: { series: [{ label: '상자', color: PRUSSIAN }] } },
    bindings: { data: bind('/harbor/boxes', '/value') },
  }),
];

const document: CanvasView = {
  kind: 'canvas',
  appearance: 'light',
  accent: VERMILION,
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes,
  connectors: RETURNING.map(course),
  elements: { boat, mouth, hall, title, figures, lots, legend },
};

export const harborAuction: SamplePack = {
  id: 'harbor-auction',
  title: { ko: '어항 새벽 위판장 — 우키요에 목판', en: 'A fishing harbour’s dawn auction — an ukiyo-e woodblock print' },
  field: { ko: '수산·어항', en: 'Fisheries & harbours' },
  kind: { ko: '어선 위치와 위판 진행', en: 'Where the boats are and how the auction runs' },
  summary: {
    ko: '어항의 새벽 위판 현황을 우키요에 목판화로 — 따뜻한 화지에 프러시안 블루와 남색, 검은 윤곽판, 위에서 종이로 번지는 하늘(보카시), 발톱 같은 물보라가 달린 큰 파도, 수평선의 붉은 해와 붉은 낙관. 위는 바다, 가운데는 두 방파제 사이 입구, 아래는 위판장이 있는 물양장 — 배마다 무엇을 잡았고 어디 있는지 카드로: 점선 테두리는 조업 중, 남색이 번진 카드는 귀항 중(방파제까지 남은 분을 따라가는 선에), 남색 단색은 하역 중, 엷은 황토 빗금은 위판 끝. 오른쪽에 위판 상자·입항 척수·평균 낙찰가, 경매 순서, 30분마다 위판한 상자. 어항은 지어낸 것이라 예시 데이터입니다.',
    en: 'A fishing harbour’s dawn auction as an ukiyo-e woodblock print — Prussian blue and indigo on warm washi, black key-block outlines, a sky graded from blue into the paper, big curling waves with claw-shaped foam, a vermilion sun on the horizon and a vermilion seal. The sea at the top, the mouth between two breakwaters in the middle, the quay with the auction hall at the bottom; each boat is a card saying what it caught and where it is: a dashed outline still fishing, graded blue on its way in (its minutes to the breakwater on the line it follows), solid indigo unloading, a pale ochre hatch once its catch is sold. On the right the boxes sold, the boats in and the average price, the auction’s order and the boxes sold by the half hour. The harbour is made up. Example data.',
  },
  connectors: [HARBOR],
  document,
  snapshot,
};
