import type { Binding, CanvasView, Connector, ElementDefinition, Node, Widget } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { svgDataUrl } from '../frame.js';
import { snapshot } from '../snapshots/park-trails.js';

// A national park's trail board painted as a watercolour map: the mountain in washes of sap green and slate that bleed
// at their edges, the stream in a blue wash, a few soft contour lines in sepia, on grained paper. The trails are drawn
// over it in ink — indigo open, ochre crowded, carmine and dashed closed — between the gates, the fork, the falls, the
// shelter, the summit and the lookout, each carrying its length and state. Cards on the places say what a walker needs
// there now (parking left, seats at the shelter, the summit's wind); on the right the mountain's weather, the day's
// notices and walkers through the gates by the hour. The park is made up, so the values are example data.

export const PARK: ExampleSampleConnector = {
  key: 'park',
  name: '예시 국립공원 탐방 API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 국립공원이 아닙니다' },
};

/** The rangers' office posts every few minutes; a quarter of an hour without an answer is a source that has stopped. */
const MAX_AGE_SECONDS = 15 * 60;

const bind = (path: string, valuePath: string, map?: Binding['map']): Binding => ({
  adapter: PARK.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
  ...(map ? { map } : {}),
});

const WIDTH = 1600;
const HEIGHT = 1000;
const PAPER = '#f7f2e6';
const SEPIA = '#3b3127';
const SOFT = '#7a6d5e';
/** A trail's state, in ink over the washes: indigo open, ochre crowded, carmine closed. */
const OPEN = '#2f4f6f';
const BUSY = '#c96f14';
const CLOSED = '#b8322a';
const SERIF = '"Gowun Batang", "Nanum Myeongjo", "Noto Serif KR", Batang, serif';

const STATE_STROKE = { values: { open: OPEN, busy: BUSY, closed: CLOSED }, otherwise: SOFT };
const STATE_DASH = { values: { closed: 'dashed' }, otherwise: 'solid' };

/** The places on the trails: where each is on the map and what kind of place it is. */
const SPOTS = {
  centre: { x: 300, y: 860, kind: 'gate' },
  east: { x: 900, y: 800, kind: 'gate' },
  fork: { x: 360, y: 620, kind: 'fork' },
  falls: { x: 640, y: 600, kind: 'falls' },
  shelter: { x: 330, y: 380, kind: 'shelter' },
  summit: { x: 520, y: 200, kind: 'summit' },
  lookout: { x: 800, y: 330, kind: 'lookout' },
} as const;
type SpotId = keyof typeof SPOTS;

/** The places with a card, and where it sits — clear of the trails out of the place. */
const CARD_AT: Partial<Record<SpotId, [number, number]>> = {
  centre: [340, 880],
  east: [820, 860],
  falls: [560, 480],
  shelter: [60, 330],
  summit: [570, 80],
};

const TRAILS: { id: string; from: SpotId; to: SpotId }[] = [
  { id: 'centre-fork', from: 'centre', to: 'fork' },
  { id: 'fork-falls', from: 'fork', to: 'falls' },
  { id: 'fork-shelter', from: 'fork', to: 'shelter' },
  { id: 'shelter-summit', from: 'shelter', to: 'summit' },
  { id: 'summit-lookout', from: 'summit', to: 'lookout' },
  { id: 'lookout-east', from: 'lookout', to: 'east' },
  { id: 'east-falls', from: 'east', to: 'falls' },
];

// ── The painting ────────────────────────────────────────────────────────────────────────────────────────────────

function drawing(): string {
  // A wash: blobs pushed out of true by noise and softened, so their edges bleed the way wet paint does on paper, with
  // the pigment pooling darker along the edge as it dries.
  const wash = (blobs: [number, number, number, number, number][], fill: string, opacity: number, seed: number) =>
    `<g filter="url(#bleed${seed})">${blobs
      .map(([cx, cy, rx, ry, rot]) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${cx} ${cy})" fill="${fill}" fill-opacity="${opacity}" stroke="${fill}" stroke-opacity="${Math.min(1, opacity * 1.6)}" stroke-width="3"/>`)
      .join('')}</g>`;
  const bleed = (seed: number) =>
    `<filter id="bleed${seed}" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="4" seed="${seed}" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="56"/><feGaussianBlur stdDeviation="1.6"/></filter>`;
  const contour = (rx: number, ry: number) =>
    `<ellipse cx="520" cy="230" rx="${rx}" ry="${ry}" fill="none" stroke="${SEPIA}" stroke-opacity=".18" stroke-width="1.5" filter="url(#wobble)"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<defs>
<filter id="paper"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2" seed="11"/><feColorMatrix values="0 0 0 0 .5  0 0 0 0 .44  0 0 0 0 .34  0 0 0 .08 0"/></filter>
${[1, 2, 3, 4, 5].map(bleed).join('')}
<filter id="wobble"><feTurbulence type="fractalNoise" baseFrequency=".03" numOctaves="2" seed="9" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="14"/></filter>
</defs>
<rect width="${WIDTH}" height="${HEIGHT}" fill="${PAPER}"/>
${wash([[540, 640, 470, 330, -8], [300, 760, 260, 220, 0], [820, 620, 240, 260, 10]], '#a9c28d', 0.38, 1)}
${wash([[520, 470, 330, 260, -4], [400, 560, 200, 170, 20], [700, 520, 180, 200, -15]], '#7fa06c', 0.36, 2)}
${wash([[520, 300, 190, 150, 0], [430, 380, 110, 90, 30], [640, 380, 120, 100, -25]], '#5c7f5d', 0.34, 3)}
${wash([[520, 220, 110, 80, 0], [470, 260, 60, 50, 0]], '#8a97a8', 0.5, 4)}
${wash([[690, 650, 70, 34, 38], [780, 720, 80, 36, 36], [880, 800, 90, 40, 45], [960, 900, 80, 40, 60]], '#6f9fc8', 0.5, 5)}
${contour(120, 80)}${contour(210, 150)}${contour(310, 230)}${contour(410, 320)}
<rect width="${WIDTH}" height="${HEIGHT}" filter="url(#paper)"/>
<text x="384" y="660" fill="${SOFT}" font-size="17" font-style="italic" font-family='${SERIF}'>갈림길</text>
<text x="822" y="322" fill="${SOFT}" font-size="17" font-style="italic" font-family='${SERIF}'>능선 전망대</text>
<text x="700" y="790" fill="#40698c" font-size="16" font-style="italic" font-family='${SERIF}'>물소리 계곡</text>
<path d="M 1000 60 L 1000 120 M 990 76 L 1000 60 L 1010 76" stroke="${SEPIA}" stroke-width="2" fill="none"/>
<text x="993" y="142" fill="${SEPIA}" font-size="16" font-family='${SERIF}'>N</text>
<path d="M 1086 40 C 1084 300 1090 700 1086 960" stroke="${SEPIA}" stroke-opacity=".3" stroke-width="2" fill="none"/>
</svg>`;
  return svgDataUrl(svg);
}

// ── Elements ────────────────────────────────────────────────────────────────────────────────────────────────────

const STATES = `.open{--c:${OPEN}}.busy{--c:${BUSY}}.closed{--c:${CLOSED}}`;

/** A place on the trails, marked by its kind: a gate, the fork, the falls, a shelter, the summit, a lookout. */
const spot: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['kind'], properties: { kind: { enum: ['gate', 'fork', 'falls', 'shelter', 'summit', 'lookout'] } } },
  template: `<i class="sp {{kind}}"></i>`,
  style: `.sp{display:block;width:100%;height:100%;box-sizing:border-box;border:3px solid ${SEPIA};border-radius:50%;background:${PAPER}}
.fork{transform:scale(.6);background:${SEPIA}}
.summit{border:0;border-radius:0;background:${SEPIA};clip-path:polygon(50% 0,100% 100%,0 100%)}
.shelter{border-radius:3px;background:${SEPIA};clip-path:polygon(50% 0,100% 40%,100% 100%,0 100%,0 40%)}
.falls{background:#6f9fc8}
.lookout{border-radius:0;transform:rotate(45deg) scale(.75)}`,
  size: { width: 26, height: 26 },
};

/** A place's card: its name, its state, the one line a walker needs there now and a note. */
const card: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['name', 'status'],
    properties: { name: { type: 'string' }, status: { enum: ['open', 'busy', 'closed'] }, word: { type: 'string' }, line: { type: 'string' }, note: { type: 'string' } },
  },
  template: `<section class="cd {{status}}"><header><b>{{name}}</b><span>{{word}}</span></header><p>{{line}}</p><small>{{note}}</small></section>`,
  style: `${STATES}
.cd{height:100%;box-sizing:border-box;display:grid;align-content:center;gap:2px;padding:6px 10px 6px 12px;background:rgba(250,246,236,.92);border-left:5px solid var(--c);box-shadow:0 1px 0 rgba(59,49,39,.25),0 0 0 1px rgba(59,49,39,.15);font-family:${SERIF};color:${SEPIA}}
header{display:flex;align-items:baseline;gap:8px}
b{font-size:16px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
span{margin-left:auto;flex:none;font-size:13px;font-weight:800;color:var(--c)}
p{margin:0;font-size:17px;font-weight:700}
small{font-size:12px;color:${SOFT};white-space:nowrap;overflow:hidden;text-overflow:ellipsis}`,
  size: { width: 210, height: 90 },
};

/** The board's title. */
const title: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['name'], properties: { name: { type: 'string' }, sub: { type: 'string' }, date: { type: 'string' }, time: { type: 'string' } } },
  template: `<header class="tt"><h1>{{name}}</h1><p>{{sub}} · {{date}} <b>{{time}}</b></p></header>`,
  style: `.tt{height:100%;box-sizing:border-box;display:grid;align-content:center;gap:8px;font-family:${SERIF};color:${SEPIA};border-bottom:2px solid rgba(59,49,39,.5)}
h1{margin:0;font-size:40px;font-weight:800;font-style:italic;letter-spacing:.02em}
p{margin:0;font-size:17px;color:${SOFT}}
b{color:${SEPIA};font-size:22px}`,
  size: { width: 460, height: 120 },
};

/** The mountain's weather, each figure on a pale wash. */
const weather: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, value: { type: 'string' }, unit: { type: 'string' }, note: { type: 'string' } } } } },
  },
  template: `<dl class="wx">{{#items}}<div><dt>{{label}}</dt><dd>{{value}}<small>{{unit}}</small></dd><em>{{note}}</em></div>{{/items}}</dl>`,
  style: `.wx{margin:0;height:100%;box-sizing:border-box;display:grid;grid-template-columns:repeat(3,1fr);gap:10px;font-family:${SERIF};color:${SEPIA}}
div{display:grid;align-content:center;padding:10px 12px;background:radial-gradient(closest-side,rgba(127,160,108,.3),rgba(127,160,108,.12) 80%,transparent)}
dt{font-size:14px;color:${SOFT}}
dd{margin:2px 0;font-size:34px;font-weight:800;font-variant-numeric:tabular-nums}
dd small{font-size:15px;margin-left:2px}
em{font-style:normal;font-size:12px;color:${SOFT}}`,
  size: { width: 460, height: 140 },
};

/** The day's notices; a closure in carmine. */
const notices: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, text: { type: 'string' }, closed: { type: 'boolean' } } } } },
  },
  template: `<section class="nt"><h3>오늘의 안내</h3><ul>{{#items}}<li class="{{#closed}}x{{/closed}}"><b>{{title}}</b><span>{{text}}</span></li>{{/items}}</ul></section>`,
  style: `.nt{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr;gap:6px;font-family:${SERIF};color:${SEPIA}}
h3{margin:0;font-size:19px;font-weight:800;font-style:italic}
ul{margin:0;padding:0;list-style:none;display:grid;align-content:start;gap:8px}
li{display:grid;gap:2px;padding:6px 10px;border-left:4px solid ${OPEN};background:rgba(255,255,255,.45)}
li.x{border-left-color:${CLOSED}}
b{font-size:16px}
li.x b{color:${CLOSED}}
span{font-size:14px;color:${SOFT}}`,
  size: { width: 460, height: 240 },
};

/** The key to the trails' ink. */
const legend: ElementDefinition = {
  render: 'template',
  props: { type: 'object', properties: {} },
  template: `<ul class="lg"><li><i style="border-color:${OPEN}"></i>열림</li><li><i style="border-color:${BUSY}"></i>혼잡</li><li><i class="d" style="border-color:${CLOSED}"></i>통제</li></ul>`,
  style: `.lg{height:100%;box-sizing:border-box;margin:0;padding:0;list-style:none;display:flex;align-items:center;gap:20px;font:600 15px ${SERIF};color:${SEPIA}}
li{display:flex;align-items:center;gap:8px}
i{width:30px;border-top:5px solid}
.d{border-top-style:dashed}`,
  size: { width: 300, height: 30 },
};

// ── The board ───────────────────────────────────────────────────────────────────────────────────────────────────

const node = (id: string, x: number, y: number, width: number, height: number, widget: Widget): Node => ({ id, x, y, width, height, anchored: false, widget });

const SPOT_IDS = Object.keys(SPOTS) as SpotId[];

const trail = ({ id, from, to }: (typeof TRAILS)[number]): Connector => ({
  id: `trail-${id}`,
  fromNodeId: `spot-${from}`,
  toNodeId: `spot-${to}`,
  label: '{{value}}',
  labelSize: 13,
  style: { stroke: OPEN, strokeWidth: 5 },
  bindings: {
    label: bind('/park/trails', `/${id}/label`),
    'style.stroke': bind('/park/trails', `/${id}/status`, STATE_STROKE),
    'style.dash': bind('/park/trails', `/${id}/status`, STATE_DASH),
  },
});

const nodes: Node[] = [
  ...SPOT_IDS.map(id => node(`spot-${id}`, SPOTS[id].x - 13, SPOTS[id].y - 13, 26, 26, { type: 'element:spot', props: { kind: SPOTS[id].kind } })),
  ...SPOT_IDS.flatMap(id => {
    const at = CARD_AT[id];
    if (!at) return [];
    return [
      node(`card-${id}`, at[0], at[1], 210, 90, {
        type: 'element:card',
        props: { name: '', status: 'open', word: '', line: '', note: '' },
        bindings: {
          name: bind('/park/places', `/${id}/name`),
          status: bind('/park/places', `/${id}/status`),
          word: bind('/park/places', `/${id}/word`),
          line: bind('/park/places', `/${id}/line`),
          note: bind('/park/places', `/${id}/note`),
        },
      }),
    ];
  }),
  node('legend', 600, 958, 300, 30, { type: 'element:legend', props: {} }),
  node('title', 1120, 30, 460, 120, {
    type: 'element:title',
    props: { name: '', sub: '', date: '', time: '' },
    bindings: { name: bind('/park/now', '/name'), sub: bind('/park/now', '/sub'), date: bind('/park/now', '/date'), time: bind('/park/now', '/time') },
  }),
  node('weather', 1120, 170, 460, 140, { type: 'element:weather', props: { items: [] }, bindings: { items: bind('/park/weather', '/value') } }),
  node('notices', 1120, 330, 460, 250, { type: 'element:notices', props: { items: [] }, bindings: { items: bind('/park/notices', '/value') } }),
  node('walkers', 1120, 610, 460, 260, {
    type: 'chart.bar',
    props: { title: '시간대별 입산(명)', data: [], mapping: { x: 'hour', y: 'people' }, options: { series: [{ label: '입산', color: '#5f8160' }] } },
    bindings: { data: bind('/park/walkers', '/value') },
  }),
];

const document: CanvasView = {
  kind: 'canvas',
  appearance: 'light',
  accent: OPEN,
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes,
  connectors: TRAILS.map(trail),
  elements: { spot, card, title, weather, notices, legend },
};

export const parkTrails: SamplePack = {
  id: 'park-trails',
  title: { ko: '국립공원 탐방로 — 수채 지도', en: 'A national park’s trails — a watercolour map' },
  field: { ko: '자연·탐방', en: 'Parks & outdoors' },
  kind: { ko: '수채로 그린 산 지도', en: 'A mountain painted in watercolour' },
  domain: 'environment',
  styles: ['drawing'],
  summary: {
    ko: '국립공원 탐방지원센터의 탐방로 안내판을 수채 지도로 — 가장자리가 번지는 초록·회청 물감으로 산을, 푸른 물감으로 계곡을, 옅은 세피아 등고선과 종이 결 위에. 탐방로는 그 위에 잉크로: 남색 열림, 황토 혼잡, 진홍 점선 통제 — 구간마다 길이와 상태. 탐방지원센터·계곡 입구·폭포·대피소·정상에 카드(주차 잔여, 대피소 자리, 정상 바람과 입산 마감), 오른쪽에 산의 날씨(정상 기온·능선 바람·일몰), 오늘의 안내, 시간대별 입산. 공원은 지어낸 것이라 예시 데이터입니다.',
    en: 'A national park’s trail board painted as a watercolour map — the mountain in sap green and slate washes that bleed at their edges, the stream in a blue wash, faint sepia contours on grained paper. The trails over it in ink: indigo open, ochre crowded, carmine and dashed closed, each with its length and state. Cards at the gates, the falls, the shelter and the summit (parking left, seats at the shelter, the summit’s wind and entry cut-off), and on the right the mountain’s weather (the summit’s temperature, the ridge’s wind, sunset), the day’s notices and walkers by the hour. The park is made up. Example data.',
  },
  connectors: [PARK],
  document,
  snapshot,
};
