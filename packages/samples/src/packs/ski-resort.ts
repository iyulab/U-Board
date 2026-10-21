import type { Binding, CanvasView, ElementDefinition, Node, Widget } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { svgDataUrl } from '../frame.js';
import { snapshot } from '../snapshots/ski-resort.js';

// A ski resort's slope board drawn as an 8-bit game's map: the mountain in square pixels on a flat sky, the runs
// stepped down it in their difficulty's colour, the lifts as dotted lines with their pylons — and on it, as a game's
// pop-ups, whether each run is open and groomed and how long each lift's queue is. Beside it the weather, the snow,
// what is running and the crowd by the hour, in chunky black-bordered windows. No public source carries a resort's
// lifts and runs this way, so the values are example data written for it.

export const SKI: ExampleSampleConnector = {
  key: 'ski',
  name: '예시 스키장 운영 API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 스키장이 아닙니다' },
};

/** Queues change by the minute; ten minutes without an answer is a source that has stopped. */
const MAX_AGE_SECONDS = 10 * 60;

const bind = (path: string, valuePath: string): Binding => ({
  adapter: SKI.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
});

const WIDTH = 1600;
const HEIGHT = 960;
/** One pixel of the map, in scene units. */
const PX = 8;
const SKY = '#3cbcfc';
const SNOW = '#fcfcfc';
const SHADE = '#bcbcd8';
const TREE = '#00a800';
const INK = '#000000';
const PIXEL = '"Courier New", ui-monospace, monospace';
/** A game window's frame: a thick black border and a hard shadow, no rounding. */
const WINDOW = `border:4px solid ${INK};box-shadow:6px 6px 0 ${INK};background:${SNOW}`;

/** The runs' difficulty colours, as Korean resorts mark them. */
const LEVEL = { easy: '#00a800', mid: '#0058f8', hard: '#d82800', expert: '#000000' } as const;

const MAP_WIDTH = 1100;
const BASE = 896;

/** The mountain's skyline, left to right: where the snow starts at each x. */
const RIDGE: Array<[number, number]> = [[0, 600], [200, 440], [360, 312], [520, 184], [640, 264], [768, 224], [904, 336], [1100, 488]];

const ridgeAt = (x: number): number => {
  for (let i = 1; i < RIDGE.length; i++) {
    const [x0, y0] = RIDGE[i - 1]!;
    const [x1, y1] = RIDGE[i]!;
    if (x <= x1) return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
  }
  return RIDGE[RIDGE.length - 1]![1];
};

const snap = (v: number) => Math.round(v / PX) * PX;

/** A run: its name, difficulty and the line it takes down the mountain, top first. */
const RUNS = [
  { id: 'rainbow', level: 'expert', line: [[520, 200], [432, 520], [392, 880]] },
  { id: 'challenge', level: 'hard', line: [[528, 208], [600, 520], [568, 880]] },
  { id: 'paradise', level: 'mid', line: [[776, 240], [848, 560], [784, 880]] },
  { id: 'bravo', level: 'mid', line: [[760, 248], [680, 560], [672, 880]] },
  { id: 'family', level: 'easy', line: [[208, 464], [248, 704], [304, 880]] },
  { id: 'hill', level: 'easy', line: [[952, 400], [1008, 704], [984, 880]] },
] as const;

/** A lift: from its base station to its top. */
const LIFTS = [
  { id: 'gondola', from: [472, 888], to: [520, 192] },
  { id: 'lift-a', from: [712, 888], to: [768, 240] },
  { id: 'lift-b', from: [968, 888], to: [944, 400] },
  { id: 'lift-c', from: [264, 888], to: [208, 472] },
] as const;

// ── The drawing ─────────────────────────────────────────────────────────────────────────────────────────────────

function drawing(): string {
  const cells: string[] = [];
  const cell = (x: number, y: number, fill: string, w = PX, h = PX) => cells.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`);
  // The mountain, a column of pixels at a time: snow from the ridge down, the right-hand faces shaded, forest below.
  for (let x = 0; x < MAP_WIDTH; x += PX) {
    const top = snap(ridgeAt(x + PX / 2));
    const falling = ridgeAt(x + PX) > ridgeAt(x);
    cell(x, top, SNOW, PX, BASE - top);
    if (falling) cell(x, top, SHADE, PX, 3 * PX);
  }
  // The forest below the tree line: small pixel firs on a loose grid, each row shifted half a step.
  for (let y = 656; y < BASE - 24; y += 40) {
    for (let x = ((y / 40) % 2) * 24; x < MAP_WIDTH - 24; x += 48) {
      if (snap(ridgeAt(x)) > y - 8) continue;
      cell(x + 8, y, TREE);
      cell(x, y + 8, TREE, 24, 8);
      cell(x + 8, y + 16, '#7c4800');
    }
  }
  // The runs, stepped down the mountain a pixel at a time.
  for (const run of RUNS) {
    const line = run.line;
    for (let i = 1; i < line.length; i++) {
      const [x0, y0] = line[i - 1]!;
      const [x1, y1] = line[i]!;
      const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) / PX;
      for (let s = 0; s <= steps; s++) cell(snap(x0 + ((x1 - x0) * s) / steps), snap(y0 + ((y1 - y0) * s) / steps), LEVEL[run.level]);
    }
  }
  // The lifts: a dotted cable with a pylon every so often, and a station at each end.
  const lifts = LIFTS.map(({ from: [x0, y0], to: [x1, y1] }) => {
    const pylons = [0.25, 0.5, 0.75].map(t => `<rect x="${snap(x0 + (x1 - x0) * t) - 4}" y="${snap(y0 + (y1 - y0) * t)}" width="8" height="24" fill="#7c7c7c"/>`).join('');
    return `<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke="${INK}" stroke-width="4" stroke-dasharray="8 8"/>${pylons}<rect x="${x0 - 12}" y="${y0 - 12}" width="24" height="16" fill="${INK}"/><rect x="${x1 - 12}" y="${y1 - 8}" width="24" height="16" fill="${INK}"/>`;
  }).join('');
  // A cloud or two, in pixels.
  const cloud = (x: number, y: number) => `<rect x="${x}" y="${y + 8}" width="96" height="16" fill="${SNOW}"/><rect x="${x + 16}" y="${y}" width="48" height="8" fill="${SNOW}"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" shape-rendering="crispEdges">
<rect width="${WIDTH}" height="${HEIGHT}" fill="${SKY}"/>
${cloud(96, 120)}${cloud(880, 96)}${cloud(1000, 200)}
${cells.join('')}
<rect x="0" y="${BASE}" width="${MAP_WIDTH}" height="${HEIGHT - BASE}" fill="#e4e4f8"/>
<rect x="536" y="${BASE + 8}" width="160" height="40" fill="#a81000"/><rect x="528" y="${BASE}" width="176" height="8" fill="#7c0800"/>
<rect x="584" y="${BASE + 24}" width="24" height="24" fill="#fcd8a8"/><rect x="624" y="${BASE + 24}" width="24" height="24" fill="#fcd8a8"/>
${lifts}
<rect x="1130" y="562" width="440" height="370" fill="${INK}"/><rect x="1124" y="556" width="440" height="370" fill="${SNOW}" stroke="${INK}" stroke-width="8"/>
</svg>`;
  return svgDataUrl(svg);
}

// ── Elements ────────────────────────────────────────────────────────────────────────────────────────────────────

/** The title window: the resort, the day and the time, as a game's top bar. */
const title: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['name', 'time'], properties: { name: { type: 'string' }, date: { type: 'string' }, time: { type: 'string' } } },
  template: `<header class="tt"><b>{{name}}</b><span>{{date}}</span><time>{{time}}</time></header>`,
  style: `.tt{height:100%;box-sizing:border-box;display:flex;align-items:center;gap:20px;padding:0 18px;${WINDOW};font-family:${PIXEL};font-weight:700;color:${INK}}
b{font-size:30px;letter-spacing:.04em}
span{font-size:18px;color:#585858}
time{margin-left:auto;font-size:34px;padding:0 10px;background:${INK};color:${SNOW}}`,
  size: { width: 1040, height: 64 },
};

/** A run's pop-up: its name on its difficulty's colour, open or closed, and when it was groomed. */
const run: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['name', 'state'],
    properties: { name: { type: 'string' }, colour: { type: 'string' }, state: { enum: ['open', 'closed', 'racing'] }, word: { type: 'string' }, note: { type: 'string' } },
  },
  template: `<p class="rn {{state}}" style="--c: {{colour}}"><b>{{name}}</b><span>{{word}}</span><small>{{note}}</small></p>`,
  style: `.rn{margin:0;height:100%;box-sizing:border-box;display:grid;grid-template-columns:1fr auto;grid-template-rows:auto auto;align-content:center;column-gap:8px;padding:4px 8px;border:4px solid ${INK};box-shadow:4px 4px 0 ${INK};background:${SNOW};font-family:${PIXEL};font-weight:700;color:${INK}}
b{padding:0 6px;background:var(--c);color:#fff;font-size:15px;white-space:nowrap}
span{font-size:14px;color:#00a800}
.closed span{color:#d82800}.racing span{color:#0058f8}
small{grid-column:1/-1;font-size:12px;color:#585858;white-space:nowrap;overflow:hidden}
.closed{background:#d8d8d8}`,
  size: { width: 196, height: 56 },
};

/** A lift's pop-up at its top station: running or stopped, and the queue at its base. */
const lift: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['name', 'state'], properties: { name: { type: 'string' }, state: { enum: ['run', 'slow', 'stop'] }, wait: { type: 'string' } } },
  template: `<p class="lf {{state}}"><b>{{name}}</b><span>{{wait}}</span></p>`,
  style: `.lf{margin:0;height:100%;box-sizing:border-box;display:grid;align-content:center;justify-items:center;padding:2px 6px;border:4px solid ${INK};box-shadow:4px 4px 0 ${INK};background:#fcfc00;font-family:${PIXEL};font-weight:700;color:${INK}}
.slow{background:#fca044}.stop{background:#d82800;color:#fff}
b{font-size:13px;line-height:1.2;white-space:nowrap}
span{font-size:17px;line-height:1.2;white-space:nowrap}`,
  size: { width: 148, height: 60 },
};

/** The weather window: the sky, the temperature at the top and the base, wind, and the snow. */
const weather: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { sky: { type: 'string' }, items: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, value: { type: 'string' } } } } },
  },
  template: `<section class="wx"><h3>▶ {{sky}}</h3><dl>{{#items}}<div><dt>{{label}}</dt><dd>{{value}}</dd></div>{{/items}}</dl></section>`,
  style: `.wx{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr;gap:8px;padding:12px 16px;${WINDOW};font-family:${PIXEL};font-weight:700;color:${INK}}
h3{margin:0;font-size:22px}
dl{margin:0;display:grid;grid-template-columns:1fr 1fr;gap:6px 16px;align-content:center}
div{display:flex;justify-content:space-between;align-items:baseline;border-bottom:4px dotted #bcbcbc}
dt{font-size:14px;color:#585858}
dd{margin:0;font-size:22px}`,
  size: { width: 440, height: 210 },
};

/** What is running: the counts as a game's score, each with a bar of blocks. */
const score: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, value: { type: 'number' }, of: { type: 'number' } } } } },
  },
  template: `<ul class="sc">{{#items}}<li><span>{{label}}</span><b>{{value}}<small>/{{of}}</small></b><i style="--v: {{value}}; --of: {{of}}"></i></li>{{/items}}</ul>`,
  style: `.sc{height:100%;box-sizing:border-box;margin:0;padding:12px 16px;list-style:none;display:grid;align-content:center;gap:10px;${WINDOW};font-family:${PIXEL};font-weight:700;color:${INK}}
li{display:grid;grid-template-columns:110px 70px 1fr;align-items:center;gap:10px}
span{font-size:16px}
b{font-size:24px;text-align:right}
small{font-size:14px;color:#585858}
i{height:16px;background:repeating-linear-gradient(90deg,#00a800 0 12px,transparent 12px 16px) 0 0/calc(100% * var(--v) / var(--of)) 100% no-repeat,repeating-linear-gradient(90deg,#d8d8d8 0 12px,transparent 12px 16px)}`,
  size: { width: 440, height: 150 },
};

/** A window's heading, as a game's menu labels it. */
const label: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['text'], properties: { text: { type: 'string' } } },
  template: `<h2 class="lb">{{text}}</h2>`,
  style: `.lb{margin:0;height:100%;display:flex;align-items:center;padding:0 12px;width:max-content;background:${INK};color:${SNOW};font:700 16px ${PIXEL};letter-spacing:.08em}`,
  size: { width: 200, height: 28 },
};

// ── The board ───────────────────────────────────────────────────────────────────────────────────────────────────

const node = (id: string, x: number, y: number, width: number, height: number, widget: Widget): Node => ({ id, x, y, width, height, anchored: false, widget });

/** Where each run's pop-up sits: beside the middle of its line. */
const RUN_AT: Record<(typeof RUNS)[number]['id'], [number, number]> = {
  rainbow: [232, 560],
  challenge: [608, 600],
  paradise: [864, 560],
  bravo: [680, 448],
  family: [64, 688],
  hill: [896, 744],
};

/** Where each lift's pop-up sits: by its top station. */
const LIFT_AT: Record<(typeof LIFTS)[number]['id'], [number, number]> = {
  gondola: [344, 168],
  'lift-a': [800, 168],
  'lift-b': [952, 328],
  'lift-c': [56, 400],
};

const nodes: Node[] = [
  node('title', 24, 20, 1040, 64, {
    type: 'element:title',
    props: { name: '', date: '', time: '' },
    bindings: { name: bind('/ski/now', '/name'), date: bind('/ski/now', '/date'), time: bind('/ski/now', '/time') },
  }),
  ...RUNS.map(({ id, level }) =>
    node(`run-${id}`, RUN_AT[id][0], RUN_AT[id][1], 196, 56, {
      type: 'element:run',
      props: { name: '', colour: LEVEL[level], state: 'open', word: '', note: '' },
      bindings: { name: bind('/ski/runs', `/${id}/name`), state: bind('/ski/runs', `/${id}/state`), word: bind('/ski/runs', `/${id}/word`), note: bind('/ski/runs', `/${id}/note`) },
    })
  ),
  ...LIFTS.map(({ id }) =>
    node(`lift-${id}`, LIFT_AT[id][0], LIFT_AT[id][1], 148, 60, {
      type: 'element:lift',
      props: { name: '', state: 'run', wait: '' },
      bindings: { name: bind('/ski/lifts', `/${id}/name`), state: bind('/ski/lifts', `/${id}/state`), wait: bind('/ski/lifts', `/${id}/wait`) },
    })
  ),
  node('weather-label', 1124, 40, 200, 28, { type: 'element:label', props: { text: 'WEATHER' } }),
  node('weather', 1124, 72, 440, 210, {
    type: 'element:weather',
    props: { sky: '', items: [] },
    bindings: { sky: bind('/ski/weather', '/sky'), items: bind('/ski/weather', '/items') },
  }),
  node('score-label', 1124, 312, 200, 28, { type: 'element:label', props: { text: 'OPEN NOW' } }),
  node('score', 1124, 344, 440, 150, { type: 'element:score', props: { items: [] }, bindings: { items: bind('/ski/score', '/value') } }),
  node('crowd-label', 1124, 524, 200, 28, { type: 'element:label', props: { text: 'CROWD' } }),
  node('crowd', 1136, 568, 416, 346, {
    type: 'chart.bar',
    props: { title: '시간대별 리프트 탑승(명)', data: [], mapping: { x: 'hour', y: 'riders' }, options: { series: [{ label: '탑승', color: '#0058f8' }] } },
    bindings: { data: bind('/ski/crowd', '/value') },
  }),
];

const document: CanvasView = {
  kind: 'canvas',
  appearance: 'light',
  accent: '#0058f8',
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes,
  connectors: [],
  elements: { title, run, lift, weather, score, label },
};

export const skiResort: SamplePack = {
  id: 'ski-resort',
  title: { ko: '스키장 슬로프 현황 — 레트로 픽셀 아트', en: 'A ski resort’s slopes — in retro pixel art' },
  field: { ko: '레저·관광', en: 'Leisure & tourism' },
  kind: { ko: '픽셀로 그린 산 지도', en: 'A mountain map drawn in pixels' },
  summary: {
    ko: '스키장 슬로프 현황판을 8비트 게임 지도처럼 — 평평한 하늘 아래 네모 픽셀로 그린 산, 난이도 색(초급 초록·중급 파랑·상급 빨강·최상급 검정)으로 계단처럼 내려오는 슬로프, 점선 케이블과 철탑의 리프트. 그 위에 게임 팝업처럼 슬로프마다 개장·정설 상태, 리프트마다 운행과 대기 시간. 옆에 굵은 검은 테 창으로 날씨·적설, 지금 연 슬로프·리프트 수, 시간대별 탑승. 예시 데이터입니다.',
    en: 'A ski resort’s slope board drawn as an 8-bit game’s map — the mountain in square pixels under a flat sky, the runs stepping down it in their difficulty’s colour (easy green, intermediate blue, advanced red, expert black), the lifts as dotted cables with pylons. On it, as game pop-ups, whether each run is open and when it was groomed, and each lift’s state and queue. Beside it, in chunky black-bordered windows, the weather and snow, the runs and lifts open now, and riders by the hour. Example data.',
  },
  connectors: [SKI],
  document,
  snapshot,
};
