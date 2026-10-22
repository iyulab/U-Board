import type { Binding, CanvasView, ElementDefinition, Node, Widget } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { svgDataUrl } from '../frame.js';
import { snapshot } from '../snapshots/wildlife-chaekgado.js';

// A nature park's camera traps painted as a chaekgado — the Joseon bookshelf screen: the shelf's staggered compartments
// in lacquered wood, two of them holding the still life such screens are known for (books, a vase, a brush pot), and
// every other one a camera's station — its place, the last animal it caught and when, today's shots, its battery and
// memory as ink bars — with the state as a seal and a word: 安 steady, 珍 a rare or protected animal caught (a vermilion
// seal), 電 battery low, 障 a fault (no shots), 滿 memory full. On the right, a hanging scroll with today's catches by
// species and the morning round. The park and its stations are made up, so the values are example data.

export const PARK: ExampleSampleConnector = {
  key: 'park',
  name: '예시 자연공원 무인 센서 카메라 API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 공원·카메라가 아닙니다' },
};

/** The cameras send a status every hour over the park's radio link; three hours without one is a link to check. */
const MAX_AGE_SECONDS = 3 * 60 * 60;

const bind = (path: string, valuePath: string): Binding => ({
  adapter: PARK.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
});

const WIDTH = 1600;
const HEIGHT = 1000;
const WOOD = '#7a3f22';
const WOOD_DARK = '#4a2412';
const INSIDE = '#efe3c6';
const INK = '#2a2420';
const VERMILION = '#c8442f';
const MALACHITE = '#4f8a63';
const INDIGO = '#2f4f7f';
const OCHRE = '#d9a63a';
const SERIF = '"Nanum Myeongjo", "Batang", "AppleMyungjo", serif';
const TEXT = '"Pretendard", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';

/** The shelf's compartments, row by row (staggered widths, as on the screens); `still` holds the painted still life. */
const CELLS = [
  { id: 'c1', x: 70, y: 120, w: 360 },
  { id: 'c2', x: 450, y: 120, w: 300 },
  { id: 'still1', x: 770, y: 120, w: 270, still: true },
  { id: 'c3', x: 70, y: 400, w: 290 },
  { id: 'c4', x: 380, y: 400, w: 330 },
  { id: 'c5', x: 730, y: 400, w: 310 },
  { id: 'c6', x: 70, y: 680, w: 330 },
  { id: 'still2', x: 420, y: 680, w: 270, still: true },
  { id: 'c7', x: 710, y: 680, w: 330 },
] as const;
const CELL_H = 260;
const CAMERAS = CELLS.filter(c => !('still' in c));

// ── The painted shelf ──────────────────────────────────────────────────────────────────────────────────────────

function drawing(): string {
  const compartment = ({ x, y, w }: { x: number; y: number; w: number }) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${CELL_H}" fill="${INSIDE}"/><path d="M${x} ${y} h${w} l-14 14 h${-(w - 28)} v${CELL_H - 28} l-14 14 z" fill="#d8c7a0"/>`;
  // The still life: stacked books with coloured covers and a vase or a brush pot — decoration that says nothing.
  const books = (x: number, y: number) =>
    [INDIGO, MALACHITE, OCHRE, VERMILION]
      .map((c, i) => `<rect x="${x + i * 6}" y="${y - i * 22}" width="${150 - i * 12}" height="20" fill="${c}" stroke="${INK}" stroke-width="1.5"/><line x1="${x + i * 6 + 10}" x2="${x + i * 6 + 10}" y1="${y - i * 22}" y2="${y - i * 22 + 20}" stroke="#f3ead2" stroke-width="2"/>`)
      .join('');
  const vase = (x: number, y: number) =>
    `<path d="M${x} ${y} c -30 0, -40 -60, -18 -90 c 6 -10, 4 -24, -4 -30 h 44 c -8 6, -10 20, -4 30 c 22 30, 12 90, -18 90 z" fill="#f6f2e8" stroke="${INK}" stroke-width="2"/><path d="M${x - 26} ${y - 60} c 10 6, 42 6, 52 0" fill="none" stroke="${INDIGO}" stroke-width="5"/><path d="M${x - 2} ${y - 120} c -4 -30, -30 -50, -40 -70 M${x + 2} ${y - 120} c 10 -30, 30 -40, 44 -60" fill="none" stroke="${MALACHITE}" stroke-width="4"/><circle cx="${x - 40}" cy="${y - 190}" r="8" fill="${VERMILION}"/><circle cx="${x + 46}" cy="${y - 180}" r="8" fill="${VERMILION}"/>`;
  const brushPot = (x: number, y: number) =>
    `<rect x="${x}" y="${y - 70}" width="60" height="70" rx="6" fill="${MALACHITE}" stroke="${INK}" stroke-width="2"/>${[8, 20, 32, 44].map((dx, i) => `<line x1="${x + dx}" y1="${y - 70}" x2="${x + dx + (i - 1.5) * 8}" y2="${y - 150}" stroke="${INK}" stroke-width="3"/>`).join('')}`;
  const still1 = CELLS[2];
  const still2 = CELLS[7];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<defs>
<linearGradient id="wood" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8d4a28"/><stop offset="1" stop-color="${WOOD}"/></linearGradient>
<pattern id="silk" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#e9dcbc"/><path d="M0 3 H6 M3 0 V6" stroke="#e0d1ad" stroke-width=".8"/></pattern>
</defs>
<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#silk)"/>
<rect x="44" y="96" width="1022" height="868" fill="url(#wood)" stroke="${WOOD_DARK}" stroke-width="6"/>
${CELLS.map(compartment).join('')}
${books(still1.x + 40, still1.y + 220)}${vase(still1.x + 210, still1.y + 238)}
${books(still2.x + 30, still2.y + 220)}${brushPot(still2.x + 190, still2.y + 238)}
<rect x="1110" y="60" width="440" height="20" rx="4" fill="${WOOD_DARK}"/>
<rect x="1124" y="80" width="412" height="880" fill="#f4ecd8" stroke="#c9b48a" stroke-width="2"/>
<rect x="1124" y="80" width="412" height="40" fill="${INDIGO}"/>
<rect x="1124" y="920" width="412" height="40" fill="${INDIGO}"/>
<rect x="1100" y="960" width="460" height="22" rx="11" fill="${WOOD_DARK}"/>
</svg>`;
  return svgDataUrl(svg);
}

// ── Elements ───────────────────────────────────────────────────────────────────────────────────────────────────

/** A camera's station in a compartment — read from `c`: number and place, the last animal caught and when, today's
 *  shots and animals, battery and memory as ink bars (`--b`, `--m` in %), and the state as a seal and a word. */
const camera: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['c'], properties: { c: { type: 'object' } } },
  template: `<article class="cm {{c.state}}" style="--b: {{c.battery}}; --m: {{c.memory}}"><header><h2>{{c.no}}</h2><small>{{c.place}}</small><i class="seal"></i></header><p class="last"><span>마지막 포착</span><b>{{c.animal}}</b><time>{{c.time}}</time></p><p class="count">오늘 촬영 {{c.shots}} · 동물 {{c.hits}}</p><div class="bars"><p><span>전지</span><i class="bar b"></i><em>{{c.battery}}%</em></p><p><span>저장</span><i class="bar m"></i><em>{{c.memory}}%</em></p></div><p class="word">{{c.word}} <small>{{c.note}}</small></p></article>`,
  style: `.cm{height:100%;box-sizing:border-box;padding:22px 18px 10px 26px;font-family:${SERIF};color:${INK};display:grid;gap:5px;align-content:start}
header{display:grid;grid-template-columns:auto 1fr auto;align-items:baseline;gap:8px}
h2{margin:0;font-size:22px;font-weight:800}
header small{font-size:13px;color:#6b5a48;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.seal{align-self:start;display:grid;place-items:center;width:38px;height:38px;font:normal 800 24px ${SERIF};border:2.5px solid ${INK};border-radius:4px}
.ok .seal::before{content:"安"}
.rare .seal{background:${VERMILION};border-color:${VERMILION};color:#fff4e6;transform:rotate(-4deg)}.rare .seal::before{content:"珍"}
.battery .seal{color:${OCHRE};border-color:${OCHRE};border-style:dashed}.battery .seal::before{content:"電"}
.fault .seal{color:#fff;background:${INK}}.fault .seal::before{content:"障"}
.full .seal{color:${INDIGO};border-color:${INDIGO};border-width:4px;border-style:double}.full .seal::before{content:"滿"}
.last{margin:0;display:flex;align-items:baseline;gap:8px}
.last span{font-size:12px;color:#6b5a48}
.last b{font-size:26px}
.last time{font-family:${TEXT};font-size:13px;color:#6b5a48}
.count{margin:0;font-family:${TEXT};font-size:13px}
.bars{display:grid;gap:3px}
.bars p{margin:0;display:grid;grid-template-columns:30px 1fr 40px;align-items:center;gap:6px;font-size:12px}
.bar{display:block;height:9px;background:#dccba3;border-radius:5px;position:relative;overflow:hidden}
.bar::after{content:"";position:absolute;inset:0 auto 0 0;background:${INK}}
.b::after{width:calc(var(--b) * 1%)}.m::after{width:calc(var(--m) * 1%)}
em{font-style:normal;font-family:${TEXT};font-size:12px;text-align:right}
.battery .b::after{background:${OCHRE}}.full .m::after{background:${INDIGO}}
.word{margin:2px 0 0;font-size:15px;font-weight:800;line-height:1.3}
.word small{font-family:${TEXT};font-size:12px;font-weight:400;color:#5a4a3a}
.rare .word{color:${VERMILION}}.fault .last b{color:#8a7a6a}`,
  size: { width: 300, height: CELL_H },
};

/** The screen's title, brushed above the shelf. */
const banner: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['n'], properties: { n: { type: 'object' } } },
  template: `<header class="bn"><h1>구름골 자연공원 무인 카메라</h1><p>{{n.date}} {{n.time}} · 카메라 {{n.count}}대</p></header>`,
  style: `.bn{height:100%;display:flex;align-items:baseline;gap:20px;font-family:${SERIF};color:${INK}}
h1{margin:0;white-space:nowrap;font-size:34px;font-weight:800;letter-spacing:.08em}
p{margin:0;white-space:nowrap;font-size:15px;color:#6b5a48}`,
  size: { width: 1000, height: 64 },
};

/** The morning round on the scroll — read from `items`. */
const round: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { no: { type: 'string' }, what: { type: 'string' }, state: { type: 'string' } } } } },
  },
  template: `<section class="rd"><h2>아침 순회</h2><ol>{{#items}}<li class="{{state}}"><b>{{no}}</b><span>{{what}}</span></li>{{/items}}</ol></section>`,
  style: `.rd{height:100%;box-sizing:border-box;padding:0 6px;font-family:${SERIF};color:${INK}}
h2{margin:0 0 8px;font-size:22px;font-weight:800;letter-spacing:.1em}
ol{margin:0;padding:0;list-style:none;display:grid;gap:6px}
li{display:grid;grid-template-columns:62px 1fr;gap:6px;font-size:14px;line-height:1.35;padding-bottom:5px;border-bottom:1px solid #d8c7a0}
b{font-weight:800}
.done{color:#9a8a76}.done span{text-decoration:line-through}
.urgent b{color:${VERMILION}}`,
  size: { width: 380, height: 330 },
};

// ── The board ──────────────────────────────────────────────────────────────────────────────────────────────────

const node = (id: string, x: number, y: number, width: number, height: number, widget: Widget): Node => ({ id, x, y, width, height, anchored: false, widget });

const nodes: Node[] = [
  node('banner', 60, 24, 1000, 64, { type: 'element:banner', props: { n: {} }, bindings: { n: bind('/park/now', '/value') } }),
  ...CAMERAS.map(({ id, x, y, w }) => node(`camera-${id}`, x, y, w, CELL_H, { type: 'element:camera', props: { c: {} }, bindings: { c: bind('/park/cameras', `/value/${id}`) } })),
  node('species', 1140, 130, 380, 420, {
    type: 'chart.bar',
    props: { title: '오늘 종별 포착 (회)', data: [], mapping: { x: 'species', y: 'hits' }, options: { series: [{ label: '포착', color: MALACHITE }] } },
    bindings: { data: bind('/park/species', '/value') },
  }),
  node('round', 1140, 570, 380, 330, { type: 'element:round', props: { items: [] }, bindings: { items: bind('/park/round', '/value') } }),
];

const document: CanvasView = {
  kind: 'canvas',
  appearance: 'light',
  accent: VERMILION,
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes,
  connectors: [],
  elements: { camera, banner, round },
};

export const wildlifeChaekgado: SamplePack = {
  id: 'wildlife-chaekgado',
  title: { ko: '자연공원 무인 센서 카메라 — 책가도', en: 'A nature park’s camera traps — a chaekgado bookshelf screen' },
  field: { ko: '야생동물 조사·자연공원', en: 'Wildlife monitoring' },
  kind: { ko: '카메라 지점별 포착과 상태', en: 'Catches and state by camera' },
  summary: {
    ko: '자연공원의 무인 센서 카메라를 책가도로 — 칠한 나무 책장의 엇갈린 칸들, 그중 둘은 책가도의 정물(책 더미·꽃병·필통)이고 나머지 칸마다 카메라 지점 하나: 자리, 마지막으로 찍힌 동물과 시각, 오늘 촬영 수, 전지와 저장 공간을 먹 막대로, 그리고 상태가 낙관(도장)과 낱말로 — 安 정상, 珍 희귀·보호종 포착(주홍 도장), 電 전지 부족, 障 고장(촬영 없음), 滿 저장 공간 가득. 오른쪽 족자에 오늘 종별 포착과 아침 순회. 공원과 지점은 지어낸 것이라 예시 데이터입니다.',
    en: 'A nature park’s camera traps painted as a chaekgado, the Joseon bookshelf screen — the staggered compartments of a lacquered shelf, two of them holding the screen’s still life (stacked books, a vase, a brush pot) and every other one a camera’s station: its place, the last animal it caught and when, today’s shots, its battery and memory as ink bars, and the state as a seal and a word — 安 steady, 珍 a rare or protected animal caught (a vermilion seal), 電 battery low, 障 a fault (no shots), 滿 memory full. On the right a hanging scroll with today’s catches by species and the morning round. The park and its stations are made up. Example data.',
  },
  connectors: [PARK],
  document,
  snapshot,
};
