import type { Binding, CanvasView, ElementDefinition, Node, Widget } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { svgDataUrl } from '../frame.js';
import { snapshot } from '../snapshots/parcel-hub.js';

// A parcel hub's night sort modelled in soft clay: a warm pastel floor, every part a rounded lump of matte clay with a
// light top edge and a soft shadow under it, chunky rounded type. The dock doors stand along the top, each with its
// truck's state; the four sorting lines run across the floor as long clay belts saying how many parcels an hour they
// move; the rework table sits beside them; and along the bottom every region's outbound cart fills like a jar. The state
// of a line or a dock is told by a sign as well as a colour — a play mark running, a double bang jammed, a square
// stopped; a down arrow unloading, three dots waiting, an empty ring free — and the carts that are nearly full get a
// coral rim. On the right the night's count, the rate now and the parcels in rework, and the parcels by the hour. The
// hub is made up, so the values are example data.

export const HUB: ExampleSampleConnector = {
  key: 'hub',
  name: '예시 분류센터 API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 분류센터가 아닙니다' },
};

/** Scanners report every few seconds; three minutes of silence is a source that has stopped. */
const MAX_AGE_SECONDS = 3 * 60;

const bind = (path: string, valuePath: string): Binding => ({
  adapter: HUB.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
});

const WIDTH = 1600;
const HEIGHT = 1000;
const FLOOR = '#f3e7df';
const INK = '#4a3f45';
const PEACH = '#f4a98a';
const MINT = '#8fd3b8';
const LILAC = '#c3b5f0';
const BUTTER = '#f6d67a';
const SKY = '#9cc8f0';
const CORAL = '#ef6b5b';
const STONE = '#cfc5c0';
const ROUND = '"Nunito", "Jua", "Noto Sans KR", "Malgun Gothic", sans-serif';

/** A lump of clay: a rounded body with a light top edge and a soft shadow under it. */
const clay = (colour: string, radius = 28) =>
  `background:${colour};border-radius:${radius}px;box-shadow:inset 0 6px 0 rgba(255,255,255,.45),inset 0 -8px 0 rgba(0,0,0,.08),0 10px 18px rgba(74,63,69,.18)`;

type DockId = 'd1' | 'd2' | 'd3' | 'd4' | 'd5' | 'd6';
type LineId = 'l1' | 'l2' | 'l3' | 'l4';

// ── The floor ───────────────────────────────────────────────────────────────────────────────────────────────────

function drawing(): string {
  const blob = (cx: number, cy: number, rx: number, ry: number, c: string) =>
    `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${c}"/><ellipse cx="${cx - rx * 0.3}" cy="${cy - ry * 0.35}" rx="${rx * 0.35}" ry="${ry * 0.22}" fill="#ffffff" fill-opacity=".45"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<rect width="${WIDTH}" height="${HEIGHT}" fill="${FLOOR}"/>
<rect x="40" y="40" width="1040" height="920" rx="48" fill="#eedfd5"/>
<rect x="56" y="232" width="1008" height="460" rx="40" fill="#e8d6cb"/>
${blob(1010, 210, 26, 14, LILAC)}${blob(90, 712, 30, 16, SKY)}${blob(1030, 714, 22, 12, BUTTER)}
<text x="76" y="270" fill="${INK}" font-size="16" font-family='${ROUND}' font-weight="800" letter-spacing=".1em">분류장</text>
<text x="76" y="752" fill="${INK}" font-size="16" font-family='${ROUND}' font-weight="800" letter-spacing=".1em">지역별 출고 카트</text>
</svg>`;
  return svgDataUrl(svg);
}

// ── Elements ────────────────────────────────────────────────────────────────────────────────────────────────────

/** A dock door with its truck — read from `d`. */
const dock: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['d'], properties: { d: { type: 'object' } } },
  template: `<section class="dk {{d.state}}"><b>{{d.name}}</b><p><i></i>{{d.word}}</p><small>{{d.note}}</small></section>`,
  style: `.dk{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr auto;gap:2px;padding:10px 14px;${clay('#fff8f2', 26)};font-family:${ROUND};color:${INK}}
b{font-size:15px;font-weight:900}
p{margin:0;display:flex;align-items:center;gap:6px;font-size:17px;font-weight:800}
small{font-size:12px;font-weight:600}
i{width:24px;height:24px;border-radius:50%;display:grid;place-items:center;font:900 14px ${ROUND};font-style:normal;color:${INK}}
.unload i{background:${PEACH}}
.unload i::after{content:"↓"}
.wait i{background:${BUTTER}}
.wait i::after{content:"…"}
.empty i{border:3px solid ${STONE};box-sizing:border-box}
.empty{color:#8b7f84}`,
  size: { width: 152, height: 116 },
};

/** A sorting line as a long clay belt — read from `l`. */
const line: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['l'], properties: { l: { type: 'object' } } },
  template: `<section class="ln {{l.state}}"><i></i><div><b>{{l.name}}</b><small>{{l.note}}</small></div><strong>{{l.rate}}</strong><span>{{l.word}}</span></section>`,
  style: `.ln{height:100%;box-sizing:border-box;display:grid;grid-template-columns:44px 1fr auto auto;align-items:center;gap:14px;padding:0 18px;${clay(MINT, 46)};font-family:${ROUND};color:${INK}}
i{width:40px;height:40px;border-radius:50%;background:#fff8f2;display:grid;place-items:center;font:900 18px ${ROUND};font-style:normal;box-shadow:inset 0 -3px 0 rgba(0,0,0,.08)}
div{display:grid}
b{font-size:19px;font-weight:900}
small{font-size:13px;font-weight:600}
strong{font-size:20px;font-weight:900}
span{padding:3px 12px;border-radius:999px;background:#fff8f2;font-size:14px;font-weight:900}
.run i::after{content:"▶"}
.jam{background:${CORAL};color:#fff}
.jam i{color:${CORAL}}
.jam i::after{content:"‼"}
.jam span{color:${CORAL}}
.stop{background:${STONE}}
.stop i::after{content:"■"}`,
  size: { width: 760, height: 86 },
};

/** The rework table: parcels waiting for a hand. */
const rework: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['r'], properties: { r: { type: 'object' } } },
  template: `<section class="rw"><span>재작업대</span><b>{{r.count}}</b><small>{{r.note}}</small></section>`,
  style: `.rw{height:100%;box-sizing:border-box;display:grid;place-content:center;justify-items:center;gap:4px;${clay(LILAC, 40)};font-family:${ROUND};color:${INK};text-align:center}
span{font-size:16px;font-weight:900}
b{font-size:52px;font-weight:900;line-height:1}
small{font-size:13px;font-weight:700}`,
  size: { width: 200, height: 220 },
};

/** Every region's outbound cart, filling like a jar; a coral rim when nearly full. */
const chutes: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { region: { type: 'string' }, fill: { type: 'number' }, state: { type: 'string' } } } } },
  },
  template: `<ol class="ch">{{#items}}<li class="{{state}}" style="--p: {{fill}}"><i><u></u></i><b>{{fill}}%</b><span>{{region}}</span></li>{{/items}}</ol>`,
  style: `.ch{margin:0;padding:0;height:100%;box-sizing:border-box;list-style:none;display:grid;grid-template-columns:repeat(8,1fr);gap:14px;font-family:${ROUND};color:${INK}}
li{display:grid;grid-template-rows:1fr auto auto;justify-items:center;gap:4px}
i{position:relative;width:70%;border-radius:22px 22px 28px 28px;background:#fff8f2;box-shadow:inset 0 4px 0 rgba(255,255,255,.6),0 8px 14px rgba(74,63,69,.15);overflow:hidden;border:4px solid #fff8f2;box-sizing:border-box}
u{position:absolute;left:0;right:0;bottom:0;height:calc(var(--p) * 1%);background:${SKY};border-radius:16px 16px 22px 22px}
.near i{border-color:${CORAL}}
.near b{color:${CORAL}}
b{font-size:18px;font-weight:900}
span{font-size:13px;font-weight:800}`,
  size: { width: 1000, height: 200 },
};

/** The hub's name on a clay plate. */
const title: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['name'], properties: { name: { type: 'string' }, sub: { type: 'string' }, date: { type: 'string' }, time: { type: 'string' } } },
  template: `<header class="tt"><h1>{{name}}</h1><p>{{sub}}</p><div><span>{{date}}</span><b>{{time}}</b></div></header>`,
  style: `.tt{height:100%;box-sizing:border-box;display:grid;align-content:center;gap:6px;padding:16px 22px;${clay(BUTTER, 36)};font-family:${ROUND};color:${INK}}
h1{margin:0;font-size:34px;font-weight:900}
p{margin:0;font-size:15px;font-weight:700}
div{display:flex;align-items:center;gap:12px}
span{font-size:16px;font-weight:700}
b{margin-left:auto;padding:2px 16px;border-radius:999px;background:#fff8f2;font-size:34px;font-weight:900}`,
  size: { width: 460, height: 170 },
};

/** The night's figures, each a clay pebble. */
const figures: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, value: { type: 'string' }, note: { type: 'string' } } } } },
  },
  template: `<dl class="fg">{{#items}}<div><dt>{{label}}</dt><dd>{{value}}</dd><small>{{note}}</small></div>{{/items}}</dl>`,
  style: `.fg{margin:0;height:100%;box-sizing:border-box;display:grid;grid-template-columns:repeat(3,1fr);gap:12px;font-family:${ROUND};color:${INK}}
div{display:grid;align-content:center;justify-items:center;text-align:center;padding:8px;${clay('#fff8f2', 30)}}
div:nth-child(3){background:${LILAC}}
dt{font-size:13px;font-weight:800}
dd{margin:0;font-size:28px;font-weight:900}
small{font-size:11px;font-weight:700}`,
  size: { width: 460, height: 110 },
};

/** The key to the signs. */
const legend: ElementDefinition = {
  render: 'template',
  props: { type: 'object', properties: {} },
  template: `<ul class="lg"><li><i class="run">▶</i>가동</li><li><i class="jam">‼</i>정체</li><li><i class="stop">■</i>정지</li><li><i class="un">↓</i>하차 중</li><li><i class="wt">…</i>대기</li><li><i class="em"></i>비어 있음</li></ul>`,
  style: `.lg{height:100%;box-sizing:border-box;margin:0;padding:0 16px;list-style:none;display:flex;align-items:center;justify-content:space-between;${clay('#fff8f2', 999)};font:800 13px ${ROUND};color:${INK}}
li{display:flex;align-items:center;gap:5px}
i{width:20px;height:20px;border-radius:50%;display:grid;place-items:center;font-style:normal;font-size:11px;box-sizing:border-box}
.run{background:${MINT}}
.jam{background:${CORAL};color:#fff}
.stop{background:${STONE}}
.un{background:${PEACH}}
.wt{background:${BUTTER}}
.em{border:3px solid ${STONE}}`,
  size: { width: 460, height: 44 },
};

// ── The board ───────────────────────────────────────────────────────────────────────────────────────────────────

const node = (id: string, x: number, y: number, width: number, height: number, widget: Widget): Node => ({ id, x, y, width, height, anchored: false, widget });

const DOCKS: DockId[] = ['d1', 'd2', 'd3', 'd4', 'd5', 'd6'];
const LINES: LineId[] = ['l1', 'l2', 'l3', 'l4'];

const nodes: Node[] = [
  ...DOCKS.map((id, i) => node(`dock-${id}`, 70 + i * 168, 70, 152, 116, { type: 'element:dock', props: { d: {} }, bindings: { d: bind('/hub/docks', `/value/${id}`) } })),
  ...LINES.map((id, i) => node(`line-${id}`, 76, 290 + i * 98, 760, 86, { type: 'element:line', props: { l: {} }, bindings: { l: bind('/hub/lines', `/value/${id}`) } })),
  node('rework', 856, 360, 200, 220, { type: 'element:rework', props: { r: {} }, bindings: { r: bind('/hub/rework', '/value') } }),
  node('chutes', 70, 770, 1000, 170, { type: 'element:chutes', props: { items: [] }, bindings: { items: bind('/hub/chutes', '/value') } }),
  node('title', 1120, 40, 460, 170, {
    type: 'element:title',
    props: { name: '', sub: '', date: '', time: '' },
    bindings: { name: bind('/hub/now', '/name'), sub: bind('/hub/now', '/sub'), date: bind('/hub/now', '/date'), time: bind('/hub/now', '/time') },
  }),
  node('figures', 1120, 236, 460, 110, { type: 'element:figures', props: { items: [] }, bindings: { items: bind('/hub/figures', '/value') } }),
  node('legend', 1120, 372, 460, 44, { type: 'element:legend', props: {} }),
  node('hours', 1120, 446, 460, 510, {
    type: 'chart.bar',
    props: { title: '시간대별 처리(개) — 23시는 40분까지', data: [], mapping: { x: 'hour', y: 'parcels' }, options: { series: [{ label: '처리', color: SKY }] } },
    bindings: { data: bind('/hub/hours', '/value') },
  }),
];

const document: CanvasView = {
  kind: 'canvas',
  appearance: 'light',
  accent: PEACH,
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes,
  connectors: [],
  elements: { dock, line, rework, chutes, title, figures, legend },
};

export const parcelHub: SamplePack = {
  id: 'parcel-hub',
  title: { ko: '소포 분류센터 야간 분류 — 클레이 3D', en: 'A parcel hub’s night sort — soft clay' },
  field: { ko: '우편·택배 물류', en: 'Parcels & postal logistics' },
  kind: { ko: '도크·분류 라인·지역별 출고 카트', en: 'Docks, sorting lines and outbound carts by region' },
  domain: 'logistics',
  styles: ['craft'],
  summary: {
    ko: '소포 분류센터의 야간 분류를 말랑한 클레이 3D로 — 따뜻한 파스텔 바닥, 위쪽이 밝고 아래에 부드러운 그림자가 지는 무광 점토 덩어리, 둥글고 굵은 글자. 위에는 도크마다 트럭 상태, 가운데는 길쭉한 점토 벨트 넷이 시간당 처리량을, 옆에는 재작업대, 아래에는 지역별 출고 카트가 병처럼 차오릅니다. 라인과 도크의 상태는 색과 함께 기호로: ▶ 가동, ‼ 정체, ■ 정지, ↓ 하차 중, … 대기, 빈 원 비어 있음 — 거의 찬 카트는 산호색 테. 오른쪽에 오늘 처리·지금 처리·재작업, 시간대별 처리. 센터는 지어낸 것이라 예시 데이터입니다.',
    en: 'A parcel hub’s night sort modelled in soft clay — a warm pastel floor, matte clay lumps lit along the top with a soft shadow under them, chunky rounded type. Along the top each dock door with its truck’s state, across the floor four long clay belts with the parcels they move an hour, the rework table beside them, and along the bottom every region’s outbound cart filling like a jar. Lines and docks tell their state with a sign as well as a colour — ▶ running, ‼ jammed, ■ stopped, ↓ unloading, … waiting, an empty ring free — and the nearly full carts get a coral rim. On the right the night’s count, the rate now and the parcels in rework, and the parcels by the hour. The hub is made up. Example data.',
  },
  connectors: [HUB],
  document,
  snapshot,
};
