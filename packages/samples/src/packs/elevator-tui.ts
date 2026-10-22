import type { Binding, CanvasView, ElementDefinition, Node, Widget } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { svgDataUrl } from '../frame.js';
import { snapshot } from '../snapshots/elevator-tui.js';

// An office tower's lifts watched on a text-mode console: the deep blue screen of an old terminal program, double-line
// box borders, a grey menu bar and a status line, and every character on a fixed grid. Each of the six lifts is a
// shaft from the ground to the twenty-second floor with its car drawn at the floor it is at now — the car's height in
// the shaft is the data. A car tells its state by its mark as well as by its colour: an arrow while it travels, a dot
// when it waits, a shaded block while it is in service mode, a flashing-red pair of bangs when someone is trapped.
// On the right the console's title, the figures now, the key, the hall calls waiting, the alarm log and the trips by
// the hour. The tower is made up, so the values are example data.

export const LIFT: ExampleSampleConnector = {
  key: 'lift',
  name: '예시 승강기 관제 API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 건물이 아닙니다' },
};

/** The group controller reports every second; a minute of silence is a controller that has stopped. */
const MAX_AGE_SECONDS = 60;

const bind = (path: string, valuePath: string): Binding => ({
  adapter: LIFT.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
});

const WIDTH = 1600;
const HEIGHT = 1000;
const FLOORS = 22;
const BLUE = '#0000a8';
const CYAN = '#55ffff';
const WHITE = '#ffffff';
const GREY = '#aaaaaa';
const YELLOW = '#ffff55';
const RED = '#ff5555';
const GREEN = '#55ff55';
const BLACK = '#000000';
const MONO = '"D2Coding", "Consolas", "Courier New", monospace';

/** The shaft area — the board's y of the ground floor and the height of one floor. */
const SHAFT_TOP = 120;
const SHAFT_HEIGHT = 770;
const FLOOR_H = SHAFT_HEIGHT / FLOORS;

// ── The screen ─────────────────────────────────────────────────────────────────────────────────────────────────

function drawing(): string {
  const floors: string[] = [];
  for (let f = 1; f <= FLOORS; f++) {
    const y = SHAFT_TOP + SHAFT_HEIGHT - f * FLOOR_H;
    floors.push(`<text x="70" y="${(y + FLOOR_H / 2 + 5).toFixed(1)}" font-family="Consolas, monospace" font-size="14" fill="${f % 5 === 0 ? WHITE : GREY}" text-anchor="end">${f === 1 ? '1F' : `${f}`}</text>`);
    floors.push(`<path d="M78 ${y.toFixed(1)} H 990" stroke="#2a2ac0" stroke-width="1"/>`);
  }
  const box = (x: number, y: number, w: number, h: number) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${GREY}" stroke-width="2"/><rect x="${x + 5}" y="${y + 5}" width="${w - 10}" height="${h - 10}" fill="none" stroke="${GREY}" stroke-width="2"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<rect width="${WIDTH}" height="${HEIGHT}" fill="${BLUE}"/>
<rect width="${WIDTH}" height="32" fill="${GREY}"/>
<text x="20" y="22" font-family="Consolas, monospace" font-size="17" fill="${BLACK}"> 파일  보기  호출  정비  경보  도움말</text>
<text x="${WIDTH - 20}" y="22" font-family="Consolas, monospace" font-size="17" fill="${BLACK}" text-anchor="end">LIFT-CON v3.1</text>
${box(14, 46, 992, 900)}
<rect x="380" y="38" width="260" height="22" fill="${BLUE}"/>
<text x="510" y="56" font-family="Consolas, monospace" font-size="17" fill="${WHITE}" text-anchor="middle">[ 승강로 1F – 22F ]</text>
${floors.join('')}
<rect width="${WIDTH}" height="34" y="${HEIGHT - 34}" fill="#00a8a8"/>
<text x="20" y="${HEIGHT - 11}" font-family="Consolas, monospace" font-size="16" fill="${BLACK}">F1 도움말  F2 호출 배정  F5 새로고침  F8 정비 모드  F10 종료</text>
<rect x="1030" y="630" width="556" height="322" fill="#000080"/>
</svg>`;
  return svgDataUrl(svg);
}

// ── Elements ───────────────────────────────────────────────────────────────────────────────────────────────────

/** A lift's shaft with its car at the floor it is at — read from `e`. */
const shaft: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['e'], properties: { e: { type: 'object' } } },
  template: `<article class="sh {{e.state}}" style="--f: {{e.floor}}"><div class="car"><b>{{e.id}}</b><i></i><strong>{{e.floor}}F</strong><small>{{e.load}}%</small></div></article>`,
  style: `.sh{position:relative;height:100%;box-sizing:border-box;border-left:2px dotted #5555ff;border-right:2px dotted #5555ff;background:repeating-linear-gradient(180deg,transparent 0 ${FLOOR_H - 1}px,rgba(85,85,255,.35) ${FLOOR_H - 1}px ${FLOOR_H}px);font-family:${MONO}}
.car{position:absolute;left:6px;right:6px;height:${FLOOR_H}px;bottom:calc((var(--f) - 1) * ${FLOOR_H}px);box-sizing:border-box;display:grid;grid-template-columns:auto auto 1fr auto;align-items:center;column-gap:4px;padding:0 6px;background:${CYAN};color:${BLACK};border:2px solid ${WHITE}}
b{font-size:15px}
i{font-style:normal;font-size:15px;font-weight:900}
strong{font-size:14px;justify-self:end}
small{justify-self:end;font-size:12px}
.up i::before{content:"▲"}
.down i::before{content:"▼"}
.idle .car{background:${WHITE}}
.idle i::before{content:"·"}
.service .car{background:repeating-linear-gradient(90deg,${YELLOW} 0 6px,#a8a800 6px 8px);}
.service i::before{content:"░"}
.trapped .car{background:${RED};color:${WHITE};border-color:${YELLOW};box-shadow:0 0 0 3px ${RED}}
.trapped i::before{content:"!!"}`,
  size: { width: 130, height: SHAFT_HEIGHT },
};

/** A lift's line under its shaft. */
const tag: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['e'], properties: { e: { type: 'object' } } },
  template: `<p class="tg {{e.state}}"><b>{{e.id}}호기</b><span>{{e.word}}</span></p>`,
  style: `.tg{margin:0;height:100%;box-sizing:border-box;display:grid;justify-items:center;align-content:center;font:15px ${MONO};color:${WHITE}}
b{color:${YELLOW}}
span{font-size:13px;white-space:nowrap}
.trapped span{background:${RED};color:${WHITE};padding:0 4px}
.service span{color:${YELLOW}}`,
  size: { width: 130, height: 30 },
};

/** A text-mode window: a title on a double-line box. */
const WINDOW = `border:4px double ${GREY};background:${BLUE};color:${WHITE};font-family:${MONO}`;

/** The console's title. */
const title: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['t'], properties: { t: { type: 'object' } } },
  template: `<header class="tt"><small>{{t.series}}</small><h1>{{t.name}}</h1><div><span>{{t.date}}</span><b>{{t.time}}</b></div></header>`,
  style: `.tt{height:100%;box-sizing:border-box;display:grid;align-content:center;gap:6px;padding:10px 18px;${WINDOW}}
small{color:${CYAN};font-size:14px}
h1{margin:0;font-size:32px;font-weight:700;color:${YELLOW}}
div{display:flex;justify-content:space-between;align-items:baseline}
span{font-size:16px}
b{background:${CYAN};color:${BLACK};padding:0 10px;font-size:24px}`,
  size: { width: 556, height: 124 },
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
  style: `.fg{margin:0;height:100%;box-sizing:border-box;display:grid;grid-template-columns:repeat(3,1fr);gap:10px;font-family:${MONO}}
div{display:grid;align-content:center;justify-items:center;text-align:center;${WINDOW}}
dt{font-size:13px;color:${CYAN}}
dd{margin:0;font-size:28px;color:${WHITE}}
small{font-size:12px;color:${GREY}}`,
  size: { width: 556, height: 94 },
};

/** The key to the cars. */
const legend: ElementDefinition = {
  render: 'template',
  props: { type: 'object', properties: {} },
  template: `<ul class="ky"><li><i class="run">▲▼</i>운행</li><li><i class="idle">·</i>대기</li><li><i class="svc">░</i>정비 모드</li><li><i class="trap">!!</i>갇힘 경보</li></ul>`,
  style: `.ky{height:100%;box-sizing:border-box;margin:0;padding:0 16px;list-style:none;display:flex;align-items:center;justify-content:space-between;${WINDOW};font-size:14px}
li{display:flex;align-items:center;gap:8px}
i{font-style:normal;padding:0 6px;color:${BLACK};font-weight:900}
.run{background:${CYAN}}
.idle{background:${WHITE}}
.svc{background:${YELLOW}}
.trap{background:${RED};color:${WHITE}}`,
  size: { width: 556, height: 44 },
};

/** The hall calls waiting for a car. */
const calls: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { floor: { type: 'string' }, dir: { type: 'string' }, wait: { type: 'string' }, car: { type: 'string' }, state: { type: 'string' } } } } },
  },
  template: `<section class="cl"><h2>═ 승강장 호출 ═</h2><ol>{{#items}}<li class="{{state}}"><b>{{floor}}</b><i>{{dir}}</i><span>{{wait}}</span><small>{{car}}</small></li>{{/items}}</ol></section>`,
  style: `.cl{height:100%;box-sizing:border-box;padding:6px 16px;${WINDOW}}
h2{margin:0 0 4px;font-size:15px;font-weight:400;color:${YELLOW};text-align:center}
ol{margin:0;padding:0;list-style:none;display:grid;gap:2px}
li{display:grid;grid-template-columns:52px 30px 1fr 88px;font-size:15px}
b{color:${WHITE}}
i{font-style:normal;color:${CYAN}}
small{text-align:right;color:${GREY};font-size:14px}
.long{background:#a80000}
.long span{color:${YELLOW}}`,
  size: { width: 556, height: 150 },
};

/** The alarm log, newest first. */
const log: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { time: { type: 'string' }, text: { type: 'string' }, state: { type: 'string' } } } } },
  },
  template: `<section class="lg"><h2>═ 경보 기록 ═</h2><ol>{{#items}}<li class="{{state}}"><b>{{time}}</b><span>{{text}}</span></li>{{/items}}</ol></section>`,
  style: `.lg{height:100%;box-sizing:border-box;padding:6px 16px;${WINDOW}}
h2{margin:0 0 4px;font-size:15px;font-weight:400;color:${YELLOW};text-align:center}
ol{margin:0;padding:0;list-style:none;display:grid;gap:2px}
li{display:grid;grid-template-columns:76px 1fr;font-size:14px}
b{font-weight:400;color:${GREY}}
.alarm{background:${RED};color:${WHITE}}
.alarm b{color:${WHITE}}
.ok span{color:${GREEN}}`,
  size: { width: 556, height: 122 },
};

// ── The board ──────────────────────────────────────────────────────────────────────────────────────────────────

const node = (id: string, x: number, y: number, width: number, height: number, widget: Widget): Node => ({ id, x, y, width, height, anchored: false, widget });

const LIFTS = ['a', 'b', 'c', 'd', 'e', 'f'] as const;

const nodes: Node[] = [
  ...LIFTS.flatMap((id, i) => [
    node(`shaft-${id}`, 100 + i * 150, SHAFT_TOP, 130, SHAFT_HEIGHT, { type: 'element:shaft', props: { e: {} }, bindings: { e: bind('/lift/cars', `/value/${id}`) } }),
    node(`tag-${id}`, 100 + i * 150, SHAFT_TOP + SHAFT_HEIGHT + 2, 130, 30, { type: 'element:tag', props: { e: {} }, bindings: { e: bind('/lift/cars', `/value/${id}`) } }),
  ]),
  node('title', 1030, 46, 556, 124, { type: 'element:title', props: { t: {} }, bindings: { t: bind('/lift/now', '/value') } }),
  node('figures', 1030, 180, 556, 94, { type: 'element:figures', props: { items: [] }, bindings: { items: bind('/lift/figures', '/value') } }),
  node('legend', 1030, 284, 556, 44, { type: 'element:legend', props: {} }),
  node('calls', 1030, 338, 556, 150, { type: 'element:calls', props: { items: [] }, bindings: { items: bind('/lift/calls', '/value') } }),
  node('log', 1030, 498, 556, 122, { type: 'element:log', props: { items: [] }, bindings: { items: bind('/lift/log', '/value') } }),
  node('trips', 1040, 638, 536, 306, {
    type: 'chart.bar',
    props: { title: '시간별 운행 횟수', data: [], mapping: { x: 'hour', y: 'trips' }, options: { series: [{ label: '운행', color: CYAN }] } },
    bindings: { data: bind('/lift/trips', '/value') },
  }),
];

const document: CanvasView = {
  kind: 'canvas',
  appearance: 'dark',
  accent: CYAN,
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes,
  connectors: [],
  elements: { shaft, tag, title, figures, legend, calls, log },
};

export const elevatorTui: SamplePack = {
  id: 'elevator-tui',
  title: { ko: '업무용 빌딩 승강기 관제 — 텍스트 모드 화면', en: 'An office tower’s lifts — a text-mode console' },
  field: { ko: '승강기·건물 설비', en: 'Lifts & building services' },
  kind: { ko: '승강기 위치·상태·호출·경보', en: 'Car positions, states, hall calls and alarms' },
  domain: 'construction',
  styles: ['retro'],
  summary: {
    ko: '업무용 빌딩 승강기를 옛 텍스트 모드 관제 프로그램으로 — 짙은 파란 화면, 이중선 상자, 회색 메뉴 줄과 아래 기능키 줄, 모든 글자가 고정 칸에. 승강기 여섯 대는 1층부터 22층까지의 승강로이고, 그 안에 지금 있는 층에 칸이 그려진다 — 칸의 높이가 곧 데이터. 칸 상태는 색과 함께 표시로: 운행 중이면 화살표, 대기면 점, 정비 모드면 음영 블록, 사람이 갇히면 빨간 느낌표 둘. 오른쪽에 관제 제목, 지금 수치, 범례, 승강장 호출, 경보 기록, 시간별 운행 횟수. 건물은 지어낸 것이라 예시 데이터입니다.',
    en: 'An office tower’s lifts on an old text-mode control console — a deep blue screen, double-line boxes, a grey menu bar and a function-key line, every character on a fixed grid. The six lifts are shafts from the ground to the twenty-second floor, each with its car drawn at the floor it is at now — the car’s height in the shaft is the data. A car tells its state by its mark as well as its colour: an arrow while it travels, a dot when it waits, a shaded block in service mode, two red bangs when someone is trapped. On the right the console’s title, the figures now, the key, the hall calls waiting, the alarm log and the trips by the hour. The tower is made up. Example data.',
  },
  connectors: [LIFT],
  document,
  snapshot,
};
