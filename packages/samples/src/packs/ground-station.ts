import type { Binding, CanvasView, Connector, ElementDefinition, Node, Widget } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { project, referencePoints, svgDataUrl } from '../frame.js';
import { landDots, worldFrame } from '../world.js';
import { snapshot } from '../snapshots/ground-station.js';

// An earth-observation satellite's mission operations, on the console its operators watch through a shift: the world
// in grey dots with the satellite's ground track drawn across it — the orbit just flown solid, the next one dashed —
// the satellite where it is now, the ground stations with the one it is talking to linked to it, and beside the map
// the next passes. Under it the telemetry of the last two orbits (the battery dipping in each eclipse, the payload's
// temperature) and the commands of this pass as they go. Mission-control telemetry: dark grey panels, fixed-width
// readings, colour only for a state. No public source carries a satellite's telemetry this way, so the values are example
// data written for the board.

export const MISSION: ExampleSampleConnector = {
  key: 'mission',
  name: '예시 위성 관제 API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 위성이 아닙니다' },
};

/** Telemetry comes down on every pass and is relayed between them; two orbits without it is a source that has stopped. */
const MAX_AGE_SECONDS = 3 * 60 * 60;

const bind = (path: string, valuePath: string): Binding => ({
  adapter: MISSION.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
});

const bindStation = (id: string, field: string, map?: Binding['map']): Binding => ({
  adapter: MISSION.key,
  ref: { path: '/mission/stations', item: { list: '/value', where: { id } }, valuePath: `/${field}`, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
  ...(map ? { map } : {}),
});

const WIDTH = 1600;
const HEIGHT = 900;
const BG = '#14171b';
const PANEL = '#1c2026';
const LINE = '#2d333b';
const TEXT = '#d5dbe3';
const MUTED = '#8b95a1';
const DOT = '#323941';
const TRACK = '#56c2ff';
const NOMINAL = '#3ddc97';
const CAUTION = '#f2b33d';
const MONO = 'ui-monospace, "Cascadia Mono", Consolas, monospace';
const FONT = 'var(--u-widget-font-family)';

const LINK_STROKE = { values: { contact: NOMINAL }, otherwise: 'transparent' };

// ── The map and the ground track ────────────────────────────────────────────────────────────────────────────────────

/** The world, 9 units to a 3° cell (`world.ts`). */
const MAP = worldFrame(40, 112, 9);

/** The orbit: sun-synchronous, 98° inclined, 95 minutes round. Where the satellite is now — over the Yellow Sea on a
 *  descending pass toward Daejeon — fixes the rest of the track. */
const INCLINATION = (98 * Math.PI) / 180;
const PERIOD_MIN = 95;
const EARTH_DEG_PER_MIN = 360 / 1436;
const NOW = { lat: 42, lng: 121 };
const U_NOW = Math.PI - Math.asin(Math.sin((NOW.lat * Math.PI) / 180) / Math.sin(INCLINATION));

/** Where the satellite is `minutes` from now: its latitude, and its longitude kept within the map's −25…335. */
function trackAt(minutes: number): { lat: number; lng: number } {
  const u = U_NOW + (2 * Math.PI * minutes) / PERIOD_MIN;
  const lat = (Math.asin(Math.sin(INCLINATION) * Math.sin(u)) * 180) / Math.PI;
  const along = (u: number) => (Math.atan2(Math.cos(INCLINATION) * Math.sin(u), Math.cos(u)) * 180) / Math.PI;
  let lng = NOW.lng + along(u) - along(U_NOW) - EARTH_DEG_PER_MIN * minutes;
  while (lng < -25) lng += 360;
  while (lng >= 335) lng -= 360;
  return { lat, lng };
}

/** The track from `from` to `to` minutes as SVG paths, broken where it leaves one edge of the map for the other. */
function trackPaths(from: number, to: number, style: string): string {
  const runs: string[][] = [[]];
  let last: { x: number; y: number } | undefined;
  for (let t = from; t <= to; t += 1) {
    const { lat, lng } = trackAt(t);
    const p = project(MAP, lat, lng);
    if (last && Math.abs(p.x - last.x) > MAP.width / 2) runs.push([]);
    runs[runs.length - 1]!.push(`${p.x.toFixed(1)} ${p.y.toFixed(1)}`);
    last = p;
  }
  return runs.filter(r => r.length > 1).map(r => `<path d="M ${r.join(' L ')}" fill="none" ${style}/>`).join('');
}

function drawing(): string {
  const graticule: string[] = [];
  for (let lat = 60; lat >= -45; lat -= 30) {
    const { y } = project(MAP, lat, 0);
    graticule.push(`<path d="M ${MAP.x} ${y} H ${MAP.x + MAP.width}" stroke="${LINE}" stroke-width="1"/>`);
  }
  for (let lng = 0; lng <= 330; lng += 30) {
    const { x } = project(MAP, 0, lng);
    graticule.push(`<path d="M ${x} ${MAP.y} V ${MAP.y + MAP.height}" stroke="${LINE}" stroke-width="1"/>`);
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<rect width="${WIDTH}" height="${HEIGHT}" fill="${BG}"/>
<rect x="${MAP.x - 10}" y="${MAP.y - 10}" width="${MAP.width + 20}" height="${MAP.height + 20}" fill="${PANEL}" stroke="${LINE}"/>
${graticule.join('')}
${landDots(MAP, DOT, 2.9)}
<clipPath id="map"><rect x="${MAP.x}" y="${MAP.y}" width="${MAP.width}" height="${MAP.height}"/></clipPath>
<g clip-path="url(#map)">
${trackPaths(-PERIOD_MIN, 0, `stroke="${TRACK}" stroke-width="2" opacity=".55"`)}
${trackPaths(0, PERIOD_MIN, `stroke="${TRACK}" stroke-width="1.6" stroke-dasharray="6 5" opacity=".9"`)}
</g>
<rect x="1140" y="${MAP.y - 10}" width="420" height="${MAP.height + 20}" fill="${PANEL}" stroke="${LINE}"/>
<rect x="30" y="548" width="1530" height="332" fill="${PANEL}" stroke="${LINE}"/>
</svg>`;
  return svgDataUrl(svg);
}

// ── Elements ────────────────────────────────────────────────────────────────────────────────────────────────────

/** The mission, the orbit number, its mode and the time in UTC and at the operations centre. */
const head: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['mission'],
    properties: { mission: { type: 'string' }, orbit: { type: 'string' }, mode: { type: 'string' }, utc: { type: 'string' }, local: { type: 'string' } },
  },
  template: `<header class="hd"><h1>{{mission}}</h1><span>궤도 <b>{{orbit}}</b></span><span class="md">● {{mode}}</span><time>{{utc}} UTC</time><time class="lt">{{local}} KST</time></header>`,
  style: `.hd{height:100%;box-sizing:border-box;display:flex;align-items:center;gap:26px;font-family:${FONT};color:${TEXT}}
h1{margin:0;font-size:22px;font-weight:600;letter-spacing:.02em}
span{font-size:14px;color:${MUTED}}
span b{font:600 15px ${MONO};color:${TEXT}}
.md{color:${NOMINAL}}
time{margin-left:auto;font:600 22px ${MONO};font-variant-numeric:tabular-nums}
.lt{margin-left:0;font-size:15px;color:${MUTED}}`,
  size: { width: 1520, height: 56 },
};

/** The satellite on its track. */
const satellite: ElementDefinition = {
  render: 'template',
  props: { type: 'object', properties: { name: { type: 'string' } } },
  template: '<span class="sat" role="img" aria-label="{{name}}"><i></i></span>',
  style: `:host{display:grid;place-items:center}
.sat{position:relative;width:18px;height:18px;display:grid;place-items:center}
.sat::before{content:'';position:absolute;inset:-6px;border:1.5px solid ${TRACK};border-radius:50%;opacity:.6}
i{width:10px;height:10px;background:${TRACK};transform:rotate(45deg);box-shadow:0 0 10px ${TRACK}}`,
  size: { width: 18, height: 18 },
};

/** A ground station: its mark coloured by what it is doing, and its name. */
const station: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['name', 'state'],
    properties: { name: { type: 'string' }, state: { enum: ['contact', 'next', 'idle', 'maintenance'] } },
  },
  template: '<span class="st {{state}}"><i></i><b>{{name}}</b></span>',
  style: `.st{height:100%;display:flex;align-items:center;gap:6px;font:600 12px ${FONT};color:${MUTED};white-space:nowrap}
i{flex:none;width:10px;height:10px;border:2px solid ${MUTED};border-radius:2px;box-sizing:border-box}
.contact{color:${NOMINAL}}
.contact i{background:${NOMINAL};border-color:${NOMINAL};box-shadow:0 0 0 4px rgba(61,220,151,.25)}
.next{color:${TEXT}}
.next i{border-color:${TRACK}}
.maintenance i{border-style:dashed;border-color:${CAUTION}}`,
  size: { width: 110, height: 20 },
};

/** The next passes over the ground stations: when the satellite rises and sets over each, how high it goes. */
const passes: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: {
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: { station: { type: 'string' }, aos: { type: 'string' }, los: { type: 'string' }, elevation: { type: 'number' }, state: { enum: ['contact', 'next', 'later'] } },
        },
      },
    },
  },
  template: `<section class="ps"><h2>다음 통과</h2><table><thead><tr><th>지상국</th><th>AOS</th><th>LOS</th><th>최대 앙각</th></tr></thead><tbody>{{#items}}<tr class="{{state}}"><td>{{station}}</td><td>{{aos}}</td><td>{{los}}</td><td>{{elevation}}°</td></tr>{{/items}}</tbody></table></section>`,
  style: `.ps{height:100%;box-sizing:border-box;font-family:${FONT};color:${TEXT}}
h2{margin:0 0 8px;font:600 12px ${FONT};letter-spacing:.12em;color:${MUTED}}
table{width:100%;border-collapse:collapse;font-size:13px}
th{text-align:left;font-weight:400;color:${MUTED};border-bottom:1px solid ${LINE};padding:4px 6px}
td{padding:6px;border-bottom:1px solid ${LINE};font:13px ${MONO};font-variant-numeric:tabular-nums}
td:first-child{font-family:${FONT}}
.contact td{color:${NOMINAL};font-weight:600}
.contact td:first-child::before{content:'▶ '}
.next td{color:${TRACK}}
.later td{color:${MUTED}}`,
  size: { width: 390, height: 230 },
};

/** The satellite's state, one reading to a tile — a tile out of its band in amber. */
const tiles: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: {
      items: {
        type: 'array',
        items: { type: 'object', properties: { label: { type: 'string' }, value: { type: 'string' }, unit: { type: 'string' }, state: { enum: ['nominal', 'caution'] } } },
      },
    },
  },
  template: `<ul class="tl">{{#items}}<li class="{{state}}"><span>{{label}}</span><b>{{value}}</b><small>{{unit}}</small></li>{{/items}}</ul>`,
  style: `.tl{height:100%;box-sizing:border-box;margin:0;padding:0;list-style:none;display:grid;grid-template-columns:repeat(3,1fr);gap:8px;font-family:${FONT};color:${TEXT}}
li{display:grid;align-content:center;gap:2px;padding:6px 10px;border:1px solid ${LINE};border-left:3px solid ${NOMINAL}}
span{font-size:12px;color:${MUTED}}
b{font:600 20px ${MONO};font-variant-numeric:tabular-nums}
small{font:11px ${MONO};color:${MUTED}}
.caution{border-left-color:${CAUTION}}
.caution b{color:${CAUTION}}`,
  size: { width: 390, height: 150 },
};

/** The commands and events of this pass, newest last, as a console prints them. */
const log: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { time: { type: 'string' }, text: { type: 'string' }, kind: { enum: ['event', 'command', 'caution'] } } } } },
  },
  template: `<section class="lg"><h2>이번 통과 — 명령·이벤트</h2><ol>{{#items}}<li class="{{kind}}"><time>{{time}}</time><span>{{text}}</span></li>{{/items}}</ol></section>`,
  style: `.lg{height:100%;box-sizing:border-box;font-family:${FONT};color:${TEXT}}
h2{margin:0 0 8px;font:600 12px ${FONT};letter-spacing:.12em;color:${MUTED}}
ol{margin:0;padding:0;list-style:none;display:grid;gap:5px;font-size:13px}
li{display:grid;grid-template-columns:76px 1fr;gap:10px;line-height:1.4}
time{font:12px ${MONO};color:${MUTED};font-variant-numeric:tabular-nums}
.command span::before{content:'> ';font-family:${MONO};color:${TRACK}}
.caution span{color:${CAUTION}}`,
  size: { width: 470, height: 300 },
};

// ── The board ───────────────────────────────────────────────────────────────────────────────────────────────────

const node = (id: string, x: number, y: number, width: number, height: number, widget: Widget): Node => ({ id, x, y, width, height, anchored: false, widget });

interface Station {
  id: string;
  name: string;
  lat: number;
  /** East of Greenwich, past 180 for the Americas and the Pacific (the map runs from 25°W eastward). */
  lng: number;
  /** Which side of its mark the name sits on. */
  left?: boolean;
}

const STATIONS: Station[] = [
  { id: 'daejeon', name: '대전', lat: 36.35, lng: 127.38 },
  { id: 'kiruna', name: '키루나', lat: 67.86, lng: 21.07 },
  { id: 'hartebeesthoek', name: '하르트비스후크', lat: -25.89, lng: 27.69 },
  { id: 'hawaii', name: '하와이', lat: 19.8, lng: 204.5 },
  { id: 'santiago', name: '산티아고', lat: -33.45, lng: 289.33 },
];

const stationNode = (s: Station): Node => {
  const { x, y } = project(MAP, s.lat, s.lng);
  return {
    id: `station-${s.id}`,
    x: x - 5,
    y: y - 10,
    width: 110,
    height: 20,
    anchored: true,
    widget: { type: 'element:station', props: { name: s.name, state: 'idle' }, bindings: { state: bindStation(s.id, 'state') } },
  };
};

const NOW_AT = project(MAP, NOW.lat, NOW.lng);

/** The radio link: drawn to a station only while the satellite is in contact with it. */
const link = (s: Station): Connector => ({
  id: `link-${s.id}`,
  fromNodeId: 'satellite',
  toNodeId: `station-${s.id}`,
  style: { dash: 'dotted', strokeWidth: 2, stroke: 'transparent' },
  bindings: { 'style.stroke': bindStation(s.id, 'state', LINK_STROKE) },
});

const LOWER = { y: 560, height: 310 };

const nodes: Node[] = [
  node('head', 40, 26, 1520, 56, {
    type: 'element:head',
    props: { mission: '', orbit: '', mode: '', utc: '', local: '' },
    bindings: {
      mission: bind('/mission/now', '/mission'),
      orbit: bind('/mission/now', '/orbit'),
      mode: bind('/mission/now', '/mode'),
      utc: bind('/mission/now', '/utc'),
      local: bind('/mission/now', '/local'),
    },
  }),
  { id: 'satellite', x: NOW_AT.x - 9, y: NOW_AT.y - 9, anchored: true, widget: { type: 'element:satellite', props: { name: '위성 현재 위치' } } },
  ...STATIONS.map(stationNode),
  node('passes', 1155, 116, 390, 230, { type: 'element:passes', props: { items: [] }, bindings: { items: bind('/mission/passes', '/value') } }),
  node('tiles', 1155, 360, 390, 150, { type: 'element:tiles', props: { items: [] }, bindings: { items: bind('/mission/state', '/value') } }),
  node('battery', 40, LOWER.y, 500, LOWER.height, {
    type: 'chart.line',
    props: {
      title: '배터리 SOC(%) — 지난 두 궤도',
      data: [],
      mapping: { x: 't', y: 'soc' },
      options: { valueAxisZero: false, series: [{ label: 'SOC', color: NOMINAL }] },
    },
    bindings: { data: bind('/mission/telemetry', '/value') },
  }),
  node('temperature', 560, LOWER.y, 500, LOWER.height, {
    type: 'chart.line',
    props: {
      title: '탑재체 온도(°C) — 지난 두 궤도',
      data: [],
      mapping: { x: 't', y: 'payload' },
      options: { valueAxisZero: false, series: [{ label: '탑재체', color: TRACK }] },
    },
    bindings: { data: bind('/mission/telemetry', '/value') },
  }),
  node('log', 1080, LOWER.y + 4, 470, 300, { type: 'element:log', props: { items: [] }, bindings: { items: bind('/mission/log', '/value') } }),
];

const document: CanvasView = {
  kind: 'canvas',
  appearance: 'dark',
  accent: TRACK,
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT, referencePoints: referencePoints(MAP) } },
  nodes,
  connectors: STATIONS.map(link),
  elements: { head, satellite, station, passes, tiles, log },
};

export const groundStation: SamplePack = {
  id: 'ground-station',
  title: { ko: '지구관측 위성 임무 관제', en: 'An earth-observation satellite’s mission operations' },
  field: { ko: '우주·위성', en: 'Space & satellites' },
  kind: { ko: '세계 지도(위성 지상 궤적)', en: 'A world map (the satellite’s ground track)' },
  domain: 'it',
  styles: ['control-room'],
  summary: {
    ko: '지구관측 위성의 운영 콘솔 — 회색 점으로 찍은 세계 위에 지상 궤적(방금 돈 궤도는 실선, 다음 궤도는 점선)과 지금 위성의 위치, 지상국 다섯 중 교신 중인 곳과의 무선 링크. 옆에 다음 통과 일정과 위성 상태, 아래에 지난 두 궤도의 배터리(식 구간마다 내려감)·탑재체 온도와 이번 통과의 명령·이벤트. 어두운 회색 패널, 고정폭 수치, 상태에만 색. 예시 데이터입니다.',
    en: 'An earth-observation satellite’s operations console — the world in grey dots with the ground track across it (the orbit just flown solid, the next dashed), the satellite where it is now and a radio link to the ground station it is talking to. Beside it the next passes and the satellite’s state; under it the last two orbits’ battery (dipping in each eclipse) and payload temperature, and this pass’s commands and events. Dark grey panels, fixed-width readings, colour only for a state. Example data.',
  },
  connectors: [MISSION],
  document,
  snapshot,
};
