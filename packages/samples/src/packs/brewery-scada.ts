import type { Binding, CanvasView, ElementDefinition, Node, Widget } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { svgDataUrl } from '../frame.js';
import { snapshot } from '../snapshots/brewery-scada.js';

// A craft brewery's brewhouse and cellar on the operator's panel, drawn the old way a SCADA screen was: brushed steel,
// vessels shaded as metal cylinders, pipes with flanges, a screwed nameplate under each vessel with its reading on a
// backlit display and its level in a sight glass, round gauges with a bezel and a needle, and an annunciator panel of
// lamps. The process runs left to right — mash tun, lauter tun, kettle, wort cooler, three fermenters, the bright
// beer tank — and the fermentation curve of the batch in tank 2 sits beside the gauges. Skeuomorphic: every part looks
// like the thing it stands for. No public source carries a brewery's process this way, so the values are example data.

export const BREWERY: ExampleSampleConnector = {
  key: 'brewery',
  name: '예시 양조 공정 API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 양조장이 아닙니다' },
};

/** The PLC is read every few seconds; a minute without an answer is a source that has stopped. */
const MAX_AGE_SECONDS = 60;

const bind = (path: string, valuePath: string, map?: Binding['map']): Binding => ({
  adapter: BREWERY.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
  ...(map ? { map } : {}),
});

const bindVessel = (id: string, field: string): Binding => ({
  adapter: BREWERY.key,
  ref: { path: '/brewery/vessels', item: { list: '/value', where: { id } }, valuePath: `/${field}`, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
});

const WIDTH = 1600;
const HEIGHT = 900;
const STEEL = '#c3cad1';
const INK = '#1f2933';
const FONT = 'var(--u-widget-font-family)';

interface Vessel {
  id: string;
  name: string;
  /** Its shape: a flat-bottomed vessel, a cylinder with a cone under it, or a plate cooler. */
  shape: 'flat' | 'cone' | 'cooler';
  x: number;
}

const PITCH = 190;
const VESSELS: Vessel[] = [
  { id: 'mash', name: '당화조', shape: 'flat', x: 50 },
  { id: 'lauter', name: '여과조', shape: 'flat', x: 50 + PITCH },
  { id: 'kettle', name: '끓임솥', shape: 'flat', x: 50 + PITCH * 2 },
  { id: 'cooler', name: '맥즙 냉각기', shape: 'cooler', x: 50 + PITCH * 3 },
  { id: 'fv1', name: '발효조 1', shape: 'cone', x: 50 + PITCH * 4 },
  { id: 'fv2', name: '발효조 2', shape: 'cone', x: 50 + PITCH * 5 },
  { id: 'fv3', name: '발효조 3', shape: 'cone', x: 50 + PITCH * 6 },
  { id: 'bbt', name: '숙성 탱크', shape: 'flat', x: 50 + PITCH * 7 },
];
const PLATE = { width: 170, height: 132, y: 404 };
const TANK = { width: 130, top: 130, bottom: 340 };

// ── The drawing ─────────────────────────────────────────────────────────────────────────────────────────────────

/** A vessel shaded as a metal cylinder: a domed top, its body, a flat or coned bottom on legs, a manway. */
function vessel({ shape, x, name }: Vessel): string {
  const left = x + (PLATE.width - TANK.width) / 2;
  const right = left + TANK.width;
  const mid = (left + right) / 2;
  const label = `<text x="${mid}" y="${TANK.top - 22}" text-anchor="middle" fill="${INK}" font-size="15" font-weight="700" font-family="sans-serif">${name}</text>`;
  if (shape === 'cooler') {
    const top = TANK.top + 60;
    return `${label}<rect x="${left + 20}" y="${top}" width="${TANK.width - 40}" height="170" rx="6" fill="url(#steel)" stroke="#5f6b75"/>
${Array.from({ length: 9 }, (_, i) => `<path d="M ${left + 28} ${top + 14 + i * 17} H ${right - 28}" stroke="#7b858e" stroke-width="3"/>`).join('')}
<rect x="${left + 14}" y="${top - 10}" width="${TANK.width - 28}" height="14" rx="3" fill="url(#steel)" stroke="#5f6b75"/>
<rect x="${left + 14}" y="${top + 166}" width="${TANK.width - 28}" height="14" rx="3" fill="url(#steel)" stroke="#5f6b75"/>`;
  }
  const body = TANK.bottom - (shape === 'cone' ? 60 : 0);
  const bottom =
    shape === 'cone'
      ? `<path d="M ${left} ${body} L ${mid - 12} ${TANK.bottom + 10} H ${mid + 12} L ${right} ${body} Z" fill="url(#steel)" stroke="#5f6b75"/>`
      : `<path d="M ${left} ${body} Q ${mid} ${body + 26} ${right} ${body}" fill="url(#steel)" stroke="#5f6b75"/>`;
  return `${label}<path d="M ${left} ${TANK.top + 24} Q ${mid} ${TANK.top - 14} ${right} ${TANK.top + 24} Z" fill="url(#steel)" stroke="#5f6b75"/>
<rect x="${left}" y="${TANK.top + 24}" width="${TANK.width}" height="${body - TANK.top - 24}" fill="url(#steel)" stroke="#5f6b75"/>
${bottom}
<path d="M ${left + 8} ${body} V ${TANK.bottom + 26} M ${right - 8} ${body} V ${TANK.bottom + 26}" stroke="#5f6b75" stroke-width="5"/>
<ellipse cx="${mid}" cy="${TANK.top + 70}" rx="18" ry="22" fill="url(#steel)" stroke="#5f6b75" stroke-width="2"/>
<ellipse cx="${mid}" cy="${TANK.top + 70}" rx="12" ry="15" fill="#8b959e" opacity=".5"/>
${[0, 1, 2].map(i => `<path d="M ${left} ${TANK.top + 120 + i * 30} H ${right}" stroke="#ffffff" stroke-opacity=".35"/>`).join('')}`;
}

/** A pipe from one vessel to the next: a shaded run with a flange at each end and an arrow for the flow. */
function pipe(from: Vessel, to: Vessel, y: number): string {
  const x1 = from.x + PLATE.width / 2 + TANK.width / 2;
  const x2 = to.x + PLATE.width / 2 - TANK.width / 2;
  const mid = (x1 + x2) / 2;
  return `<rect x="${x1}" y="${y - 7}" width="${x2 - x1}" height="14" fill="url(#pipe)" stroke="#4b5560" stroke-width=".8"/>
<rect x="${x1 - 2}" y="${y - 11}" width="5" height="22" fill="#7b858e"/><rect x="${x2 - 3}" y="${y - 11}" width="5" height="22" fill="#7b858e"/>
<path d="M ${mid - 6} ${y - 5} L ${mid + 6} ${y} L ${mid - 6} ${y + 5} Z" fill="#2f3a44"/>`;
}

/** A plate screwed to the panel, a little raised: what the nameplates, gauges and lamps are mounted on. */
function plate(x: number, y: number, width: number, height: number): string {
  const screws = [
    [x + 10, y + 10],
    [x + width - 10, y + 10],
    [x + 10, y + height - 10],
    [x + width - 10, y + height - 10],
  ];
  return `<rect x="${x + 3}" y="${y + 4}" width="${width}" height="${height}" rx="8" fill="#000" opacity=".25"/>
<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="8" fill="url(#plate)" stroke="#6b757e"/>
${screws.map(([cx, cy]) => `<circle cx="${cx}" cy="${cy}" r="4" fill="url(#screw)" stroke="#4b5560" stroke-width=".6"/><path d="M ${cx - 2.5} ${cy - 2.5} L ${cx + 2.5} ${cy + 2.5}" stroke="#4b5560" stroke-width="1"/>`).join('')}`;
}

const LOWER = { y: 586, height: 290 };
const GAUGES = { x: 50, width: 560 };
const LAMPS = { x: 640, width: 360 };
const CURVE = { x: 1030, width: 520 };

function drawing(): string {
  const brushed = Array.from({ length: 90 }, (_, i) => `<path d="M 0 ${i * 10 + 3} H ${WIDTH}" stroke="#ffffff" stroke-opacity="${i % 3 === 0 ? 0.18 : 0.08}"/>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<defs>
<linearGradient id="panel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9dee3"/><stop offset="1" stop-color="#aeb6be"/></linearGradient>
<linearGradient id="steel" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7b858e"/><stop offset=".35" stop-color="#eef2f5"/><stop offset=".55" stop-color="#c9d0d6"/><stop offset="1" stop-color="#6b757e"/></linearGradient>
<linearGradient id="pipe" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6b757e"/><stop offset=".4" stop-color="#f1f4f6"/><stop offset="1" stop-color="#59636c"/></linearGradient>
<linearGradient id="plate" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9edf0"/><stop offset="1" stop-color="#b9c1c8"/></linearGradient>
<radialGradient id="screw" cx=".35" cy=".35" r=".8"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#8b959e"/></radialGradient>
</defs>
<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#panel)"/>
${brushed}
${plate(30, 14, WIDTH - 60, 70)}
${VESSELS.slice(0, -1).map((v, i) => pipe(v, VESSELS[i + 1], v.shape === 'cone' || VESSELS[i + 1].shape === 'cone' ? 300 : 320)).join('\n')}
${VESSELS.map(vessel).join('\n')}
${VESSELS.map(v => plate(v.x, PLATE.y, PLATE.width, PLATE.height)).join('\n')}
${plate(GAUGES.x, LOWER.y, GAUGES.width, LOWER.height)}
${plate(LAMPS.x, LOWER.y, LAMPS.width, LOWER.height)}
${plate(CURVE.x, LOWER.y, CURVE.width, LOWER.height)}
</svg>`;
  return svgDataUrl(svg);
}

// ── Elements ────────────────────────────────────────────────────────────────────────────────────────────────────

/** The plate across the top: the brewery, the batch in the brewhouse, and the time, engraved. */
const nameplate: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['name', 'batch', 'time'], properties: { name: { type: 'string' }, batch: { type: 'string' }, time: { type: 'string' } } },
  template: `<header class="np"><h1>{{name}}</h1><p>{{batch}}</p><time>{{time}}</time></header>`,
  style: `.np{height:100%;box-sizing:border-box;display:flex;align-items:center;gap:28px;padding:0 24px;font-family:${FONT};color:#2f3a44}
h1{margin:0;font-size:26px;font-weight:800;letter-spacing:.08em;color:#36414b;text-shadow:0 1px 0 #fff,0 -1px 0 rgba(0,0,0,.25)}
p{margin:0;font-size:15px;color:#4b5560;text-shadow:0 1px 0 #fff}
time{margin-left:auto;padding:4px 14px;border-radius:4px;background:#1b2a1f;box-shadow:inset 0 2px 4px rgba(0,0,0,.7),0 1px 0 #fff;font:700 22px/1.2 ui-monospace,Consolas,monospace;color:#7dffa0;text-shadow:0 0 6px rgba(125,255,160,.6)}`,
  size: { width: 1500, height: 60 },
};

/** A vessel's nameplate: its step, its temperature on a backlit display, its level in a sight glass, and a lamp. */
const faceplate: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['temp', 'level', 'state'],
    properties: {
      temp: { type: 'number' },
      level: { type: 'number', minimum: 0, maximum: 100 },
      state: { enum: ['run', 'idle', 'cip', 'alarm'] },
      step: { type: 'string' },
    },
  },
  template: `<section class="fp {{state}}"><div class="glass" style="--l: {{level}}"><i></i></div><div class="read"><p class="lcd">{{temp | fixed:1}}<small>°C</small></p><p class="step"><span class="lamp"></span>{{step}}</p></div></section>`,
  style: `.fp{--c:#3ccf64;height:100%;box-sizing:border-box;display:grid;grid-template-columns:30px 1fr;gap:10px;padding:16px 14px 14px;font-family:${FONT};color:#2f3a44}
.idle{--c:#9aa4ad}.cip{--c:#3aa0ff}.alarm{--c:#ff4d3d}
.glass{position:relative;border-radius:15px;background:linear-gradient(90deg,#55606a,#e8edf0 40%,#9aa4ad);box-shadow:inset 0 0 0 3px #6b757e;overflow:hidden}
.glass i{position:absolute;inset:auto 5px 5px 5px;height:calc(var(--l) * 0.82%);border-radius:10px;background:linear-gradient(90deg,#b8742a,#f4c055 45%,#c98a33);box-shadow:inset 0 2px 2px rgba(255,255,255,.5)}
.read{display:grid;align-content:center;gap:8px}
.lcd{margin:0;padding:6px 8px;border-radius:4px;background:#1b2a1f;box-shadow:inset 0 2px 5px rgba(0,0,0,.75),0 1px 0 #fff;text-align:right;white-space:nowrap;font:700 21px/1 ui-monospace,Consolas,monospace;color:#7dffa0;text-shadow:0 0 6px rgba(125,255,160,.6)}
.lcd small{font-size:13px;margin-left:2px}
.step{margin:0;display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600;line-height:1.25}
.lamp{flex:none;width:12px;height:12px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#fff,var(--c) 45%,color-mix(in srgb,var(--c) 60%,#000));box-shadow:0 0 8px var(--c),0 0 0 2px #6b757e}
.alarm .lamp{animation:blink 1s steps(2) infinite}
@keyframes blink{50%{opacity:.25}}
@media (prefers-reduced-motion: reduce){.alarm .lamp{animation:none}}`,
  size: { width: 150, height: 112 },
};

/** A round gauge: a chrome bezel, a dial with its scale over 270°, a needle at the value, the value and unit below. */
const dial: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['label', 'value', 'min', 'max', 'unit'],
    properties: { label: { type: 'string' }, value: { type: 'number' }, min: { type: 'number' }, max: { type: 'number' }, unit: { type: 'string' }, high: { type: 'number', description: 'Where the red band starts.' } },
  },
  template: `<figure class="dial" style="--v: {{value}}; --min: {{min}}; --max: {{max}}; --hi: {{high}}"><div class="face"><svg viewBox="0 0 100 100"><path class="band" d="M 21 79 A 40 40 0 1 1 79 79"/><path class="red" d="M 21 79 A 40 40 0 1 1 79 79" pathLength="100"/><g class="ticks">${Array.from({ length: 11 }, (_, i) => `<path d="M 50 13 V 19" transform="rotate(${-135 + i * 27} 50 50)"/>`).join('')}</g></svg><i class="needle"></i><i class="hub"></i><span class="min">{{min}}</span><span class="max">{{max}}</span></div><figcaption><b>{{value | fixed:1}}</b> {{unit}}<small>{{label}}</small></figcaption></figure>`,
  style: `.dial{margin:0;height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto auto;align-content:center;justify-items:center;gap:16px;font-family:${FONT};color:#2f3a44}
.face{position:relative;width:132px;aspect-ratio:1;border-radius:50%;background:radial-gradient(circle at 50% 45%,#fdfdfb 55%,#e4e6e1);box-shadow:0 0 0 7px #d9dee3,0 0 0 9px #7b858e,0 0 0 11px #eef2f5,0 4px 10px 9px rgba(0,0,0,.25),inset 0 2px 6px rgba(0,0,0,.25)}
svg{position:absolute;inset:0;width:100%;height:100%}
.band{fill:none;stroke:#cfd5da;stroke-width:4}
.red{fill:none;stroke:#e5484d;stroke-width:4;stroke-dasharray:0 calc((var(--hi) - var(--min)) / (var(--max) - var(--min)) * 100) 100}
.ticks path{stroke:#2f3a44;stroke-width:1.6}
.needle{position:absolute;left:calc(50% - 2px);top:14%;width:4px;height:36%;border-radius:2px;background:linear-gradient(90deg,#b91c1c,#ef4444);transform-origin:50% 100%;transform:rotate(calc((clamp(var(--min), var(--v), var(--max)) - var(--min)) / (var(--max) - var(--min)) * 270deg - 135deg));box-shadow:1px 1px 2px rgba(0,0,0,.4)}
.hub{position:absolute;left:calc(50% - 7px);top:calc(50% - 7px);width:14px;height:14px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#fff,#4b5560)}
.min,.max{position:absolute;bottom:14%;font-size:10px;color:#4b5560}.min{left:22%}.max{right:22%}
figcaption{display:grid;justify-items:center;font-size:13px}
figcaption b{font:700 18px/1.1 ui-monospace,Consolas,monospace}
figcaption small{font-size:12px;color:#4b5560}`,
  size: { width: 160, height: 220 },
};

/** The annunciator: a grid of lamp windows, each lit in its colour while its condition holds. */
const annunciator: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['lamps'],
    properties: { lamps: { type: 'array', items: { type: 'object', properties: { text: { type: 'string' }, level: { enum: ['off', 'info', 'warn', 'alarm'] } } } } },
  },
  template: `<ul class="ann">{{#lamps}}<li class="{{level}}">{{text}}</li>{{/lamps}}</ul>`,
  style: `.ann{height:100%;box-sizing:border-box;margin:0;padding:0;list-style:none;display:grid;grid-template-columns:repeat(3,1fr);grid-auto-rows:1fr;gap:8px;font-family:${FONT}}
li{display:grid;place-items:center;padding:4px;border-radius:3px;text-align:center;font-size:12px;font-weight:700;line-height:1.2;color:#59636c;background:linear-gradient(#e8ebe6,#c9cdc6);box-shadow:inset 0 0 0 2px #6b757e,inset 0 3px 4px rgba(0,0,0,.25)}
.info{color:#0b2a12;background:radial-gradient(circle,#c8ffd5,#3ccf64);box-shadow:inset 0 0 0 2px #2f7a43,0 0 12px rgba(60,207,100,.6)}
.warn{color:#3a2700;background:radial-gradient(circle,#fff1c2,#f5b52e);box-shadow:inset 0 0 0 2px #9a6a00,0 0 12px rgba(245,181,46,.6)}
.alarm{color:#3a0500;background:radial-gradient(circle,#ffd1cc,#ff4d3d);box-shadow:inset 0 0 0 2px #a1170b,0 0 14px rgba(255,77,61,.7);animation:blink 1s steps(2) infinite}
@keyframes blink{50%{filter:brightness(.6)}}
@media (prefers-reduced-motion: reduce){.alarm{animation:none}}`,
  size: { width: 320, height: 230 },
};

// ── The board ───────────────────────────────────────────────────────────────────────────────────────────────────

const node = (id: string, x: number, y: number, width: number, height: number, widget: Widget): Node => ({ id, x, y, width, height, anchored: false, widget });

const faceNode = ({ id, x }: Vessel): Node =>
  node(`face-${id}`, x + 10, PLATE.y + 12, PLATE.width - 20, PLATE.height - 20, {
    type: 'element:faceplate',
    props: { temp: 0, level: 0, state: 'idle', step: '' },
    bindings: { temp: bindVessel(id, 'temp'), level: bindVessel(id, 'level'), state: bindVessel(id, 'state'), step: bindVessel(id, 'step') },
  });

const DIALS = [
  { id: 'steam', label: '끓임솥 증기압', unit: 'bar', min: 0, max: 4, high: 3.2 },
  { id: 'glycol', label: '냉매(글리콜) 온도', unit: '°C', min: -10, max: 10, high: 2 },
  { id: 'co2', label: '숙성 탱크 CO₂ 압력', unit: 'bar', min: 0, max: 2, high: 1.6 },
];

const dialNode = ({ id, label, unit, min, max, high }: (typeof DIALS)[number], i: number): Node =>
  node(`dial-${id}`, GAUGES.x + 24 + i * 180, LOWER.y + 34, 160, 228, {
    type: 'element:dial',
    props: { label, value: min, min, max, unit, high },
    bindings: { value: bind('/brewery/gauges', `/${id}`) },
  });

const nodes: Node[] = [
  node('nameplate', 50, 19, 1500, 60, {
    type: 'element:nameplate',
    props: { name: '', batch: '', time: '' },
    bindings: { name: bind('/brewery/now', '/name'), batch: bind('/brewery/now', '/batch'), time: bind('/brewery/now', '/time') },
  }),
  ...VESSELS.map(faceNode),
  ...DIALS.map(dialNode),
  node('annunciator', LAMPS.x + 20, LOWER.y + 30, LAMPS.width - 40, LOWER.height - 50, { type: 'element:annunciator', props: { lamps: [] }, bindings: { lamps: bind('/brewery/annunciator', '/value') } }),
  node('curve', CURVE.x + 22, LOWER.y + 22, CURVE.width - 44, LOWER.height - 40, {
    type: 'chart.line',
    props: {
      title: '발효조 2 — 발효 곡선(일)',
      data: [],
      mapping: { x: 'day', y: ['gravity', 'temp'] },
      options: { smooth: true, valueAxisZero: false, series: [{ label: '비중(°P)', color: '#b8742a' }, { label: '온도(°C)', color: '#2f6fb3' }] },
    },
    bindings: { data: bind('/brewery/fermentation', '/value') },
  }),
];

const document: CanvasView = {
  kind: 'canvas',
  appearance: 'light',
  accent: STEEL,
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes,
  connectors: [],
  elements: { nameplate, faceplate, dial, annunciator },
};

export const breweryScada: SamplePack = {
  id: 'brewery-scada',
  title: { ko: '양조장 공정 — 스큐어모픽 SCADA', en: 'A brewery’s process — skeuomorphic SCADA' },
  field: { ko: '식음료 제조', en: 'Food & beverage' },
  kind: { ko: '공정 그림(금속 패널)', en: 'Process picture (a steel panel)' },
  summary: {
    ko: '수제 맥주 양조장의 운전 화면을 옛 SCADA처럼 — 헤어라인 금속 패널, 금속 원통으로 그린 용기와 플랜지 배관, 용기마다 나사로 박은 명판(백라이트 온도 표시창·사이트글라스 액위·램프), 베젤 달린 아날로그 계기, 램프 경보 표시반, 발효조 2의 발효 곡선. 당화조에서 숙성 탱크까지 왼쪽에서 오른쪽으로. 예시 데이터입니다.',
    en: 'A craft brewery’s operator screen drawn as an old SCADA panel — brushed steel, vessels shaded as metal cylinders with flanged pipes, a screwed nameplate under each vessel (a backlit temperature display, the level in a sight glass, a lamp), round gauges with a bezel, an annunciator of lamps, and the fermentation curve of tank 2. Mash tun to bright beer tank, left to right. Example data.',
  },
  connectors: [BREWERY],
  document,
  snapshot,
};
