import type { Binding, CanvasView, Connector, ElementDefinition, Node, Widget } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { svgDataUrl } from '../frame.js';
import { snapshot } from '../snapshots/heating-nixie.js';

// A district heating network on a 1960s control-room console: the plant, two booster stations and four districts as
// bezel modules on a mimic panel, each with its supply and return temperatures glowing in Nixie tubes and a row of four
// engraved lamps — 정상 · 주의 · 경보 · 정비 — of which the lit one is the state, so it reads by place as well as
// colour. The pipes between them carry the flow (t/h) on their label, drawn wider the more water moves, dashed red where
// a leak is suspected and dashed grey where a district is bypassed. On the right the heat sent out over the day and an
// annunciator — engraved windows that light up for the conditions active now. The network is made up, so the values are
// example data.

export const PLANT: ExampleSampleConnector = {
  key: 'plant',
  name: '예시 지역난방 관망 감시 API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 지역난방 관망이 아닙니다' },
};

/** The network RTUs report every minute; ten minutes without one is a link to check before the pipe is. */
const MAX_AGE_SECONDS = 10 * 60;

const bind = (path: string, valuePath: string, map?: Binding['map']): Binding => ({
  adapter: PLANT.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
  ...(map ? { map } : {}),
});

const WIDTH = 1600;
const HEIGHT = 1000;
const CONSOLE = '#5f6b5f';
const MIMIC = '#22281f';
const BEZEL = '#d8d2bd';
const ENGRAVE = '#2b2a24';
const NIXIE = '#ff9a3c';
const PIPE = '#e8743b';
const LEAK = '#e0402f';
const TEXT = '"Pretendard", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
const MONO = '"D2Coding", "Consolas", "Menlo", monospace';

const MOD_W = 230;
const MOD_H = 200;
/** The modules on the mimic panel — the pipes run between these. */
const MODULES = [
  { id: 'plant', x: 90, y: 425 },
  { id: 'boosterA', x: 440, y: 215 },
  { id: 'boosterB', x: 440, y: 635 },
  { id: 'z1', x: 800, y: 110 },
  { id: 'z2', x: 800, y: 320 },
  { id: 'z3', x: 800, y: 530 },
  { id: 'z4', x: 800, y: 740 },
] as const;
const PIPES = [
  ['plant', 'boosterA'],
  ['plant', 'boosterB'],
  ['boosterA', 'z1'],
  ['boosterA', 'z2'],
  ['boosterB', 'z3'],
  ['boosterB', 'z4'],
] as const;

// ── The console ────────────────────────────────────────────────────────────────────────────────────────────────

function drawing(): string {
  const rivets = (x: number, y: number, w: number, h: number) =>
    [
      [x + 14, y + 14],
      [x + w - 14, y + 14],
      [x + 14, y + h - 14],
      [x + w - 14, y + h - 14],
    ]
      .map(([cx, cy]) => `<circle cx="${cx}" cy="${cy}" r="5" fill="#8a948a" stroke="#3c443c" stroke-width="1.5"/>`)
      .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<defs>
<pattern id="hammer" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="${CONSOLE}"/><circle cx="2" cy="3" r="1.4" fill="#677366"/><circle cx="6" cy="6" r="1.1" fill="#56614f"/></pattern>
</defs>
<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#hammer)"/>
<rect x="50" y="90" width="1030" height="880" rx="8" fill="${MIMIC}" stroke="#151912" stroke-width="6"/>
${rivets(50, 90, 1030, 880)}
<rect x="1100" y="90" width="460" height="880" rx="8" fill="#4d574c" stroke="#2c332b" stroke-width="4"/>
${rivets(1100, 90, 460, 880)}
<rect x="70" y="930" width="300" height="26" rx="3" fill="${BEZEL}"/>
<text x="84" y="949" font-family="Consolas, monospace" font-size="14" fill="${ENGRAVE}">MIMIC · 공급관 기준 유량 t/h</text>
</svg>`;
  return svgDataUrl(svg);
}

// ── Elements ───────────────────────────────────────────────────────────────────────────────────────────────────

/** A station as a console module — read from `s`: name and code, supply and return temperatures in Nixie tubes, one more
 *  reading, and four engraved lamps of which the one matching the state is lit. */
const station: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['s'], properties: { s: { type: 'object' } } },
  template: `<article class="md {{s.state}}"><header><b>{{s.name}}</b><small>{{s.code}}</small></header><div class="tubes"><p><span class="nx">{{s.supply}}</span><small>공급 ℃</small></p><p><span class="nx">{{s.ret}}</span><small>회수 ℃</small></p></div><p class="extra">{{s.extraLabel}} <b>{{s.extra}}</b></p><ul class="lamps"><li class="l-ok">정상</li><li class="l-warn">주의</li><li class="l-alarm">경보</li><li class="l-maint">정비</li></ul><p class="note">{{s.note}}</p></article>`,
  style: `.md{height:100%;box-sizing:border-box;padding:7px 10px;background:linear-gradient(180deg, #e6e0cb, ${BEZEL});border:4px solid #8f8a76;border-radius:6px;box-shadow:inset 0 0 0 2px #f4efdc, 0 4px 0 #151912;font-family:${TEXT};color:${ENGRAVE};display:grid;gap:4px;align-content:start}
header{display:flex;justify-content:space-between;align-items:baseline;padding:2px 6px;background:${ENGRAVE};color:#f1ecd8;border-radius:3px}
b{font-size:15px}small{font-size:11px}
header small{font-family:${MONO};color:#bdb7a2}
.tubes{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.tubes p{margin:0;display:grid;justify-items:center}
.nx{display:block;width:100%;box-sizing:border-box;text-align:center;padding:1px 0;font:500 28px ${MONO};letter-spacing:2px;color:${NIXIE};text-shadow:0 0 3px #ff6a00, 0 0 10px #ff4500;background:radial-gradient(circle, rgba(255,140,60,.08) 1px, transparent 1.5px) 0 0 / 5px 5px, #160c06;border:2px solid #4a3a2c;border-radius:12px 12px 6px 6px}
.extra{margin:0;font-size:12px}.extra b{font-family:${MONO};font-size:13px}
.lamps{margin:0;padding:0;list-style:none;display:grid;grid-template-columns:repeat(4,1fr);gap:4px;text-align:center}
.lamps li{font-size:10px;font-weight:700;color:#5b584c}
.lamps li::before{content:"";display:block;width:14px;height:14px;margin:0 auto 1px;border-radius:50%;background:#3a3832;box-shadow:inset 0 2px 3px rgba(0,0,0,.6);border:2px solid #77725f}
.ok .l-ok::before{background:radial-gradient(circle at 35% 35%, #b9ffb0, #2fbf3a);box-shadow:0 0 8px #3dff52}
.warn .l-warn::before{background:radial-gradient(circle at 35% 35%, #fff2a8, #e2a312);box-shadow:0 0 8px #ffc21a}
.alarm .l-alarm::before{background:radial-gradient(circle at 35% 35%, #ffc2b5, #d92b1c);box-shadow:0 0 10px #ff3b24}
.maint .l-maint::before{background:radial-gradient(circle at 35% 35%, #ffffff, #8fb4d9);box-shadow:0 0 8px #bcd8ff}
.ok .l-ok,.warn .l-warn,.alarm .l-alarm,.maint .l-maint{color:${ENGRAVE}}
.note{margin:0;font-size:11px;line-height:1.3;color:#4a473d}
.maint .nx{color:#6b5a4a;text-shadow:none}
.alarm{border-color:${LEAK}}`,
  size: { width: MOD_W, height: MOD_H },
};

/** The console's engraved name plate. */
const banner: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['n'], properties: { n: { type: 'object' } } },
  template: `<header class="bn"><h1>누리 지역난방 · 열수송관망 감시반</h1><p>{{n.date}} <span>{{n.time}}</span> · 외기 {{n.outside}}℃</p></header>`,
  style: `.bn{height:100%;display:flex;align-items:center;gap:18px;padding:0 16px;box-sizing:border-box;background:linear-gradient(180deg, #e6e0cb, ${BEZEL});border:3px solid #8f8a76;border-radius:6px;font-family:${TEXT};color:${ENGRAVE}}
h1{margin:0;white-space:nowrap;font-size:26px;font-weight:800;letter-spacing:.06em}
p{margin:0;white-space:nowrap;font-size:15px}
span{font:500 22px ${MONO};color:${NIXIE};text-shadow:0 0 6px #ff4500;background:#160c06;padding:0 8px;border-radius:6px}`,
  size: { width: 1030, height: 64 },
};

/** The annunciator — engraved windows that light up for the conditions active now; read from `items`. */
const annunciator: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, state: { type: 'string' } } } } },
  },
  template: `<section class="an"><h2>경보 표시반</h2><ul>{{#items}}<li class="{{state}}">{{label}}</li>{{/items}}</ul></section>`,
  style: `.an{height:100%;box-sizing:border-box;padding:4px;font-family:${TEXT}}
h2{margin:0 0 8px;font-size:16px;font-weight:800;letter-spacing:.1em;color:#e9e4cf}
ul{margin:0;padding:8px;list-style:none;display:grid;grid-template-columns:repeat(3,1fr);gap:6px;background:#1c201b;border-radius:4px}
li{display:grid;place-items:center;height:52px;padding:0 4px;text-align:center;font-size:13px;font-weight:700;color:#77806f;background:#30362e;border:2px solid #121510;border-radius:3px}
.warn{background:#ffd34d;color:#3a2a00;box-shadow:0 0 10px #ffc21a}
.alarm{background:#ff5a45;color:#fff;box-shadow:0 0 12px #ff3b24;border-style:double;border-width:4px}
.maint{background:#bcd8ff;color:#1d2f45}`,
  size: { width: 420, height: 290 },
};

// ── The board ──────────────────────────────────────────────────────────────────────────────────────────────────

const node = (id: string, x: number, y: number, width: number, height: number, widget: Widget): Node => ({ id, x, y, width, height, anchored: false, widget });

/** A pipe's look from its state: a suspected leak is dashed red, a bypassed run dashed grey. */
const STROKE = { values: { leak: LEAK, bypass: '#9aa39a' }, otherwise: PIPE };
const DASH = { values: { leak: 'dashed', bypass: 'dashed' }, otherwise: 'solid' };
/** The more water moves, the wider the pipe. */
const WIDE = { ranges: [{ min: 600, value: 9 }, { min: 300, value: 6 }, { min: 100, value: 4 }], otherwise: 2.5 };

const pipe = ([from, to]: readonly [string, string]): Connector => {
  const id = `${from}-${to}`;
  return {
    id: `pipe-${id}`,
    fromNodeId: from,
    toNodeId: to,
    label: '{{value | fixed:0}} t/h',
    style: { stroke: PIPE, strokeWidth: 4, arrow: 'end', route: 'orthogonal' },
    bindings: {
      label: bind('/net/pipes', `/value/${id}/flow`),
      'style.strokeWidth': bind('/net/pipes', `/value/${id}/flow`, WIDE),
      'style.stroke': bind('/net/pipes', `/value/${id}/state`, STROKE),
      'style.dash': bind('/net/pipes', `/value/${id}/state`, DASH),
    },
  };
};

const nodes: Node[] = [
  node('banner', 50, 16, 1030, 64, { type: 'element:banner', props: { n: {} }, bindings: { n: bind('/net/now', '/value') } }),
  ...MODULES.map(({ id, x, y }) => node(id, x, y, MOD_W, MOD_H, { type: 'element:station', props: { s: {} }, bindings: { s: bind('/net/stations', `/value/${id}`) } })),
  node('heat', 1120, 110, 420, 520, {
    type: 'chart.line',
    props: {
      title: '열 공급량 — 지난 24시간 (Gcal/h)',
      data: [],
      mapping: { x: 'hour', y: 'heat' },
      options: { series: [{ label: '공급량', color: NIXIE }], echarts: { yAxis: { min: 150, max: 400 } } },
    },
    bindings: { data: bind('/net/heat', '/value') },
  }),
  node('annunciator', 1120, 660, 420, 290, { type: 'element:annunciator', props: { items: [] }, bindings: { items: bind('/net/annunciator', '/value') } }),
];

const document: CanvasView = {
  kind: 'canvas',
  appearance: 'dark',
  accent: NIXIE,
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes,
  connectors: PIPES.map(pipe),
  elements: { station, banner, annunciator },
};

export const heatingNixie: SamplePack = {
  id: 'heating-nixie',
  title: { ko: '지역난방 열수송관망 — 1960년대 관제반', en: 'A district heating network — a 1960s control console' },
  field: { ko: '지역난방·열 공급', en: 'District heating' },
  kind: { ko: '관망 계통과 지점별 상태', en: 'Network and stations' },
  summary: {
    ko: '지역난방 열수송관망을 1960년대 관제반으로 — 열원·가압장 둘·지구 넷이 계통판 위 베젤 모듈: 공급·회수 온도가 닉시관에 빛나고, 정상·주의·경보·정비 네 개의 새긴 램프 가운데 켜진 하나가 상태(색과 자리로 읽힘). 모듈 사이 관로는 유량(t/h)을 라벨에 싣고 물이 많을수록 굵게, 누수 의심은 빨간 점선, 우회는 회색 점선. 오른쪽에 하루 열 공급량과 지금 켜진 조건만 불 들어오는 경보 표시반. 관망은 지어낸 것이라 예시 데이터입니다.',
    en: 'A district heating network on a 1960s control console — the plant, two booster stations and four districts as bezel modules on a mimic panel: supply and return temperatures glowing in Nixie tubes, and of four engraved lamps — steady, watch, alarm, maintenance — the lit one is the state, read by place as well as colour. The pipes carry the flow (t/h) on their label, wider the more water moves, dashed red where a leak is suspected and dashed grey where a district is bypassed. On the right the heat sent out over the day and an annunciator whose windows light up for the conditions active now. The network is made up. Example data.',
  },
  connectors: [PLANT],
  document,
  snapshot,
};
