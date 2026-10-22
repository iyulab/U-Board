import type { Binding, CanvasView, Connector, ElementDefinition, Node, Widget } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { svgDataUrl } from '../frame.js';
import { snapshot } from '../snapshots/charging-pcb.js';

// An electric-vehicle charging hub drawn as a printed circuit board: green solder mask, a board outline with mounting
// holes and fiducials, white silkscreen, and a copper power trunk down the middle fed by the grid intake and the
// battery at the top. Every charger is a chip on the board — eight of them, two rows of four — and every chip takes
// its power through a via on the trunk and a short copper trace. The trace carries what the charger draws now: its
// width and its kilowatts, bright copper while it charges, dull copper while it stands, red and broken when the
// charger is faulted. A chip tells its state by its status LED and the sign beside it, as well as by colour — a lit
// triangle charging, a dark ring free, a half ring when a full car is still plugged in, a cross when it is down. On the
// right the board's title block, the figures now, the key, the cars waiting and the energy through the day. The hub is
// made up, so the values are example data.

export const HUB: ExampleSampleConnector = {
  key: 'hub',
  name: '예시 충전 허브 API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 충전소가 아닙니다' },
};

/** The chargers report every few seconds; five minutes of silence is a hub that has stopped reporting. */
const MAX_AGE_SECONDS = 5 * 60;

const bind = (path: string, valuePath: string, map?: Binding['map']): Binding => ({
  adapter: HUB.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
  ...(map && { map }),
});

const WIDTH = 1600;
const HEIGHT = 1000;
const MASK = '#0d5a3a';
const MASK_DEEP = '#08402a';
const COPPER = '#d9a24a';
const COPPER_DULL = '#8a6a36';
const SILK = '#f4f1e6';
const CHIP = '#1c1d1f';
const LED_ON = '#7dff9a';
const AMBER = '#ffc04d';
const FAULT = '#ff5a4f';
const TEXT = '"Pretendard", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
const MONO = '"JetBrains Mono", "Consolas", "D2Coding", monospace';

/** The power trunk down the middle of the board, and where each row of chargers taps it. */
const TRUNK_X = 510;
const ROWS = [312, 492, 672, 852] as const;

// ── The board ──────────────────────────────────────────────────────────────────────────────────────────────────

function drawing(): string {
  const hole = (x: number, y: number) =>
    `<circle cx="${x}" cy="${y}" r="16" fill="${COPPER}"/><circle cx="${x}" cy="${y}" r="9" fill="${MASK_DEEP}"/>`;
  const fiducial = (x: number, y: number) => `<circle cx="${x}" cy="${y}" r="7" fill="${COPPER}"/><circle cx="${x}" cy="${y}" r="13" fill="none" stroke="${MASK_DEEP}" stroke-width="4"/>`;
  // Stitching vias: the little rings a board is dotted with where its copper layers are tied together.
  const vias: string[] = [];
  for (let x = 345; x <= 680; x += 30) {
    for (const y of [210, 945]) vias.push(`<circle cx="${x}" cy="${y}" r="4" fill="none" stroke="${COPPER_DULL}" stroke-width="2"/>`);
  }
  const silk = (x: number, y: number, text: string, size = 14, anchor = 'start') =>
    `<text x="${x}" y="${y}" font-family="Consolas, monospace" font-size="${size}" fill="${SILK}" text-anchor="${anchor}" letter-spacing="1">${text}</text>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<defs><pattern id="g" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M 24 0 L 0 0 0 24" fill="none" stroke="#0f6342" stroke-width="1"/></pattern>
<pattern id="h" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="10" height="10" fill="${MASK_DEEP}"/><path d="M 0 0 L 0 10" stroke="#145f40" stroke-width="3"/></pattern></defs>
<rect width="${WIDTH}" height="${HEIGHT}" fill="#06291b"/>
<rect x="16" y="16" width="${WIDTH - 32}" height="${HEIGHT - 32}" rx="28" fill="${MASK}"/>
<rect x="16" y="16" width="${WIDTH - 32}" height="${HEIGHT - 32}" rx="28" fill="url(#g)"/>
<rect x="1008" y="16" width="${WIDTH - 1024}" height="${HEIGHT - 32}" fill="url(#h)" opacity=".55"/>
<line x1="1008" y1="30" x2="1008" y2="970" stroke="${SILK}" stroke-width="2" stroke-dasharray="10 8"/>
${hole(46, 46)}${hole(WIDTH - 46, 46)}${hole(46, HEIGHT - 46)}${hole(WIDTH - 46, HEIGHT - 46)}
${fiducial(320, 975)}${fiducial(700, 975)}
<rect x="${TRUNK_X - 16}" y="196" width="32" height="${ROWS[3] - 196 + 16}" rx="6" fill="${COPPER}"/>
<rect x="${TRUNK_X - 9}" y="196" width="18" height="${ROWS[3] - 196 + 16}" rx="4" fill="#efc171" opacity=".55"/>
${vias.join('')}
${silk(TRUNK_X + 26, 236, 'DC BUS 800 V', 13)}
${silk(56, 222, 'A — 급속 200 kW', 15)}
${silk(964, 222, 'B — 초급속 350 kW', 15, 'end')}
${silk(990, 990, 'UB-CHG-01 · REV 10.22', 12, 'end')}
</svg>`;
  return svgDataUrl(svg);
}

// ── Elements ───────────────────────────────────────────────────────────────────────────────────────────────────

/** Pins down both sides of a chip, as a pattern on its edges. */
const PINS = `repeating-linear-gradient(180deg,#c9ccd1 0 7px,transparent 7px 16px)`;

/** A charger as a chip — read from `c`. */
const charger: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['c'], properties: { c: { type: 'object' } } },
  template: `<article class="ic {{c.state}}"><div class="body"><header><b>{{c.ref}}</b><i></i></header><small>{{c.kind}}</small><p><strong>{{c.kw}}</strong><span>kW</span><em>{{c.word}}</em></p><div class="soc" style="--v: {{c.soc}}"><span></span></div><footer>{{c.note}}</footer></div></article>`,
  style: `.ic{width:100%;height:100%;box-sizing:border-box;padding:0 10px;background:${PINS} left/8px 100% no-repeat,${PINS} right/8px 100% no-repeat;font-family:${TEXT};color:${SILK}}
.body{position:relative;height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto auto 1fr auto auto;gap:3px;padding:10px 14px 10px 22px;background:${CHIP};border-radius:4px;box-shadow:inset 0 0 0 1px #34363a}
.body::before{content:"";position:absolute;left:8px;top:10px;width:8px;height:8px;border-radius:50%;background:#3a3c40}
header{display:flex;justify-content:space-between;align-items:center}
b{font:800 18px ${MONO};letter-spacing:.04em}
i{display:grid;place-items:center;width:26px;height:26px;border-radius:50%;font:900 13px ${TEXT};font-style:normal;box-sizing:border-box}
small{font-size:12px;color:#b9bdc4}
p{margin:0;display:flex;align-items:baseline;gap:6px}
strong{font:800 34px ${MONO}}
p span{font-size:13px;color:#b9bdc4}
em{margin-left:auto;font-style:normal;font-weight:800;font-size:14px}
.soc{height:8px;border-radius:2px;background:#33363b;overflow:hidden}
.soc span{display:block;height:100%;width:calc(var(--v) * 1%);background:${COPPER}}
footer{font-size:12px;color:#d6d9de;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.charging i{background:${LED_ON};color:#063b1a;box-shadow:0 0 10px ${LED_ON}}
.charging i::before{content:"▶"}
.charging em{color:${LED_ON}}
.free i{border:3px solid #6f747c}
.free strong{color:#6f747c}
.free em{color:#c9ccd1}
.blocking i{background:conic-gradient(${AMBER} 0 50%,transparent 50%);border:3px solid ${AMBER}}
.blocking em{color:${AMBER}}
.fault .body{background:repeating-linear-gradient(-45deg,${CHIP} 0 8px,#2c1414 8px 16px);box-shadow:inset 0 0 0 2px ${FAULT}}
.fault i{background:${FAULT};color:#2b0605}
.fault i::before{content:"✕"}
.fault strong{color:#7c6060}
.fault em{color:${FAULT}}`,
  size: { width: 260, height: 165 },
};

/** A via on the trunk — where a row of chargers takes its power. */
const via: ElementDefinition = {
  render: 'template',
  props: { type: 'object', properties: {} },
  template: `<i class="via"></i>`,
  style: `.via{display:block;width:100%;height:100%;box-sizing:border-box;border-radius:50%;background:${MASK_DEEP};border:7px solid ${COPPER}}`,
  size: { width: 30, height: 30 },
};

/** The grid intake — read from `m`. */
const intake: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['m'], properties: { m: { type: 'object' } } },
  template: `<article class="pk"><b>U1</b><small>수전 · 계약 {{m.limit}} kW</small><p><strong>{{m.kw}}</strong><span>kW</span></p><div class="bar" style="--v: {{m.pct}}"><span></span></div><footer>{{m.word}}</footer></article>`,
  style: `.pk{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto auto 1fr auto auto;gap:3px;padding:10px 14px;background:${CHIP};border-radius:6px;border:2px solid ${COPPER};font-family:${TEXT};color:${SILK}}
b{font:800 18px ${MONO}}
small{font-size:12px;color:#b9bdc4}
p{margin:0;display:flex;align-items:baseline;gap:6px}
strong{font:800 30px ${MONO}}
span{font-size:13px;color:#b9bdc4}
.bar{height:8px;border-radius:2px;background:#33363b;overflow:hidden}
.bar span{display:block;height:100%;width:calc(var(--v) * 1%);background:${COPPER}}
footer{font-size:12px}`,
  size: { width: 170, height: 150 },
};

/** The battery that tops up the trunk at the evening peak — read from `e`. */
const battery: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['e'], properties: { e: { type: 'object' } } },
  template: `<article class="bt {{e.mode}}"><b>BT1</b><small>ESS · {{e.capacity}} kWh</small><p><strong>{{e.kw}}</strong><span>kW {{e.word}}</span></p><div class="cells" style="--v: {{e.soc}}"><span></span></div><footer>충전량 {{e.soc}}%</footer></article>`,
  style: `.bt{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto auto 1fr auto auto;gap:3px;padding:10px 14px;background:${CHIP};border-radius:6px;border:2px solid ${COPPER};font-family:${TEXT};color:${SILK}}
b{font:800 18px ${MONO}}
small{font-size:12px;color:#b9bdc4}
p{margin:0;display:flex;align-items:baseline;gap:6px}
strong{font:800 30px ${MONO}}
span{font-size:13px;color:#b9bdc4}
.cells{height:10px;border-radius:2px;background:repeating-linear-gradient(90deg,#33363b 0 14px,${CHIP} 14px 16px);overflow:hidden}
.cells span{display:block;height:100%;width:calc(var(--v) * 1%);background:repeating-linear-gradient(90deg,${COPPER} 0 14px,${CHIP} 14px 16px)}
footer{font-size:12px}
.discharging p span{color:${AMBER}}`,
  size: { width: 170, height: 150 },
};

/** The board's title block, in silkscreen. */
const title: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['t'], properties: { t: { type: 'object' } } },
  template: `<table class="tb"><tr><th colspan="2"><small>{{t.series}}</small><h1>{{t.name}}</h1></th></tr><tr><td>날짜</td><td><b>{{t.date}}</b></td></tr><tr><td>시각</td><td><b class="big">{{t.time}}</b></td></tr></table>`,
  style: `.tb{width:100%;height:100%;border-collapse:collapse;font-family:${TEXT};color:${SILK}}
th,td{border:2px solid ${SILK};padding:3px 14px;text-align:left}
th{padding:8px 14px}
small{display:block;font:700 13px ${MONO};letter-spacing:.14em;color:#cfe8da}
h1{margin:0;font-size:30px;font-weight:900;letter-spacing:.02em;line-height:1.2}
td:first-child{width:80px;font:700 13px ${MONO};letter-spacing:.1em;color:#cfe8da}
b{font-size:16px}
.big{font:800 22px ${MONO}}`,
  size: { width: 540, height: 160 },
};

/** The figures now, each a silkscreened box. */
const figures: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, value: { type: 'string' }, note: { type: 'string' } } } } },
  },
  template: `<dl class="fg">{{#items}}<div><dt>{{label}}</dt><dd>{{value}}</dd><small>{{note}}</small></div>{{/items}}</dl>`,
  style: `.fg{margin:0;height:100%;box-sizing:border-box;display:grid;grid-template-columns:repeat(3,1fr);gap:14px;font-family:${TEXT};color:${SILK}}
div{display:grid;align-content:center;justify-items:center;text-align:center;border:2px solid ${SILK};border-radius:4px;background:rgba(8,64,42,.85)}
dt{font-size:13px;font-weight:700;color:#cfe8da}
dd{margin:0;font:800 28px ${MONO};color:${COPPER}}
small{font-size:12px}`,
  size: { width: 540, height: 110 },
};

/** The key to the chips' LEDs. */
const legend: ElementDefinition = {
  render: 'template',
  props: { type: 'object', properties: {} },
  template: `<ul class="ky"><li><i class="charging">▶</i>충전 중</li><li><i class="free"></i>비어 있음</li><li><i class="blocking"></i>완충 · 출차 대기</li><li><i class="fault">✕</i>고장</li></ul>`,
  style: `.ky{height:100%;box-sizing:border-box;margin:0;padding:0 16px;list-style:none;display:flex;align-items:center;justify-content:space-between;border:2px dashed ${SILK};border-radius:4px;background:rgba(8,64,42,.85);font:800 14px ${TEXT};color:${SILK}}
li{display:flex;align-items:center;gap:8px}
i{display:grid;place-items:center;width:20px;height:20px;border-radius:50%;font:900 10px ${TEXT};font-style:normal;box-sizing:border-box}
.charging{background:${LED_ON};color:#063b1a}
.free{border:3px solid #9aa0a8}
.blocking{background:conic-gradient(${AMBER} 0 50%,transparent 50%);border:3px solid ${AMBER}}
.fault{background:${FAULT};color:#2b0605}`,
  size: { width: 540, height: 52 },
};

/** The cars waiting for a charger, as the pins of a header connector. */
const queue: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { pin: { type: 'string' }, car: { type: 'string' }, wants: { type: 'string' }, wait: { type: 'string' }, state: { type: 'string' } } } } },
  },
  template: `<section class="qu"><h2>J2 · 대기 차량</h2><ol>{{#items}}<li class="{{state}}"><i>{{pin}}</i><span>{{car}}</span><small>{{wants}}</small><b>{{wait}}</b></li>{{/items}}</ol></section>`,
  style: `.qu{height:100%;box-sizing:border-box;padding:12px 18px;border:2px solid ${SILK};border-radius:4px;background:rgba(8,64,42,.85);font-family:${TEXT};color:${SILK}}
h2{margin:0 0 10px;font:800 16px ${MONO};letter-spacing:.08em}
ol{margin:0;padding:0;list-style:none;display:grid;gap:8px}
li{display:grid;grid-template-columns:34px 1fr auto 76px;align-items:center;gap:12px;font-size:15px}
i{display:grid;place-items:center;width:30px;height:30px;box-sizing:border-box;border:3px solid ${COPPER};font:800 12px ${MONO};font-style:normal;color:${COPPER}}
small{font-size:13px;color:#cfe8da}
b{font:800 16px ${MONO};text-align:right}
.next i{background:${COPPER};color:${CHIP}}
.next b::before{content:"▶ ";color:${LED_ON}}`,
  size: { width: 540, height: 196 },
};

// ── The board ──────────────────────────────────────────────────────────────────────────────────────────────────

const node = (id: string, x: number, y: number, width: number, height: number, widget: Widget): Node => ({ id, x, y, width, height, anchored: false, widget });

const CHARGERS = [
  { id: 'a1', side: 'a', row: 0 }, { id: 'a2', side: 'a', row: 1 }, { id: 'a3', side: 'a', row: 2 }, { id: 'a4', side: 'a', row: 3 },
  { id: 'b1', side: 'b', row: 0 }, { id: 'b2', side: 'b', row: 1 }, { id: 'b3', side: 'b', row: 2 }, { id: 'b4', side: 'b', row: 3 },
] as const;

const TRACE_COLOUR = { values: { charging: COPPER, blocking: COPPER_DULL, free: COPPER_DULL, fault: FAULT }, otherwise: COPPER_DULL };
const TRACE_DASH = { values: { fault: 'dashed' }, otherwise: 'solid' };
/** The more a charger draws, the wider its trace. */
const TRACE_WIDTH = { ranges: [{ min: 250, value: 9 }, { min: 120, value: 7 }, { min: 1, value: 5 }], otherwise: 3 };

/** A copper trace from the via on the trunk to a charger, carrying what the charger draws. */
const trace = (id: string, row: number): Connector => ({
  id: `trace-${id}`,
  fromNodeId: `via-${row}`,
  toNodeId: `charger-${id}`,
  label: '{{value | fixed:0}} kW',
  labelSize: 13,
  style: { stroke: COPPER, strokeWidth: 5, route: 'straight' },
  bindings: {
    label: bind('/hub/chargers', `/value/${id}/kw`),
    'style.stroke': bind('/hub/chargers', `/value/${id}/state`, TRACE_COLOUR),
    'style.dash': bind('/hub/chargers', `/value/${id}/state`, TRACE_DASH),
    'style.strokeWidth': bind('/hub/chargers', `/value/${id}/kw`, TRACE_WIDTH),
  },
});

const nodes: Node[] = [
  node('intake', 330, 40, 170, 150, { type: 'element:intake', props: { m: {} }, bindings: { m: bind('/hub/intake', '/value') } }),
  node('battery', 520, 40, 170, 150, { type: 'element:battery', props: { e: {} }, bindings: { e: bind('/hub/battery', '/value') } }),
  ...ROWS.map((y, row) => node(`via-${row}`, TRUNK_X - 15, y - 15, 30, 30, { type: 'element:via', props: {} })),
  ...CHARGERS.map(({ id, side, row }) =>
    node(`charger-${id}`, side === 'a' ? 50 : 710, ROWS[row] - 82, 260, 165, { type: 'element:charger', props: { c: {} }, bindings: { c: bind('/hub/chargers', `/value/${id}`) } })
  ),
  node('title', 1030, 40, 540, 160, { type: 'element:title', props: { t: {} }, bindings: { t: bind('/hub/now', '/value') } }),
  node('figures', 1030, 218, 540, 110, { type: 'element:figures', props: { items: [] }, bindings: { items: bind('/hub/figures', '/value') } }),
  node('legend', 1030, 346, 540, 52, { type: 'element:legend', props: {} }),
  node('queue', 1030, 416, 540, 196, { type: 'element:queue', props: { items: [] }, bindings: { items: bind('/hub/queue', '/value') } }),
  node('today', 1030, 632, 540, 324, {
    type: 'chart.bar',
    props: { title: '오늘 시간별 충전량 (kWh)', data: [], mapping: { x: 'hour', y: 'kwh' }, options: { series: [{ label: '충전량', color: COPPER }] } },
    bindings: { data: bind('/hub/today', '/value') },
  }),
];

const document: CanvasView = {
  kind: 'canvas',
  appearance: 'dark',
  accent: COPPER,
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes,
  connectors: CHARGERS.map(({ id, row }) => trace(id, row)),
  elements: { charger, via, intake, battery, title, figures, legend, queue },
};

export const chargingPcb: SamplePack = {
  id: 'charging-pcb',
  title: { ko: '전기차 충전 허브 — 인쇄회로기판', en: 'An EV charging hub — a printed circuit board' },
  field: { ko: '전기차 충전', en: 'EV charging' },
  kind: { ko: '충전기 상태·전력·대기 차량', en: 'Chargers, power and the cars waiting' },
  domain: 'energy',
  styles: ['drawing'],
  summary: {
    ko: '전기차 충전 허브를 인쇄회로기판으로 — 초록 솔더 마스크, 고정 구멍과 기준 마크가 있는 기판 테두리, 흰 실크스크린, 그리고 가운데를 내려가는 구리 전력 간선(위의 수전반과 ESS가 먹인다). 충전기 여덟 대는 기판 위의 칩이고, 칩마다 간선의 비아에서 짧은 구리 트레이스로 전력을 받는다. 트레이스는 그 충전기가 지금 끄는 전력을 싣는다 — 굵기와 kW, 충전 중이면 밝은 구리, 멈춰 있으면 흐린 구리, 고장이면 빨간 끊긴 선. 칩 상태는 색과 함께 상태 LED와 기호로: 켜진 삼각형 충전 중, 빈 고리 비어 있음, 반쪽 고리 완충된 차가 아직 꽂혀 있음, ✕ 고장. 오른쪽에 기판 표제란, 지금 수치, 범례, 대기 차량, 오늘 시간별 충전량. 충전 허브는 지어낸 것이라 예시 데이터입니다.',
    en: 'An EV charging hub drawn as a printed circuit board — green solder mask, a board outline with mounting holes and fiducials, white silkscreen, and a copper power trunk down the middle, fed by the grid intake and the battery at the top. The eight chargers are chips on the board, and each takes its power from a via on the trunk through a short copper trace. The trace carries what its charger draws now — its width and its kilowatts, bright copper while it charges, dull copper while it stands, red and broken when it is faulted. A chip tells its state by its status LED and a sign as well as by colour: a lit triangle charging, an empty ring free, a half ring when a full car is still plugged in, a cross when it is down. On the right the board’s title block, the figures now, the key, the cars waiting and the energy through the day. The hub is made up. Example data.',
  },
  connectors: [HUB],
  document,
  snapshot,
};
