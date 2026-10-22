import type { Binding, CanvasView, ComponentDefinition, ElementDefinition, Node, Widget } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { svgDataUrl } from '../frame.js';
import { RACKS, snapshot } from '../snapshots/warehouse-racks.js';

// A distribution centre's storage hall drawn as a blueprint: white lines on blue paper, a column grid with its
// bubbles, dimension lines and a title block in the corner. Each rack row is one component — the row's bins, four
// levels by twelve bays, filled as full as they are, its conveyor lane, and the line between them as thick as the row
// is being picked. Along the bottom the dock doors, inbound and outbound; on the right the hall's figures, inbound and
// outbound by the hour, and what needs a hand. No public source carries a warehouse's bins, so the values are example
// data written for it.

export const WMS: ExampleSampleConnector = {
  key: 'wms',
  name: '예시 창고 관리(WMS) API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 물류센터가 아닙니다' },
};

/** Bins and picks are counted every few minutes; a quarter of an hour without an answer is a source that has stopped. */
const MAX_AGE_SECONDS = 15 * 60;

const bind = (path: string, valuePath: string): Binding => ({
  adapter: WMS.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
});

/** One field of the rack row an instance is given — `{{rack}}` is its id. */
const bindRack = (field: string, map?: Binding['map']): Binding => ({
  adapter: WMS.key,
  ref: { path: '/wms/racks', item: { list: '/value', where: { id: '{{rack}}' } }, valuePath: `/${field}`, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
  ...(map ? { map } : {}),
});

const WIDTH = 1600;
const HEIGHT = 1000;
const PAPER = '#0b3a75';
const LINE = '#e8f1ff';
const CYAN = '#9fd3ff';
const AMBER = '#ffb020';
const RED = '#ff6b5b';
const MONO = 'ui-monospace, "Cascadia Mono", Consolas, monospace';

/** The hall, and where its parts are drawn. */
const HALL = { x: 40, y: 60, width: 1100, height: 900 };
const RACK = { x: 120, y: 130, width: 800, height: 64, pitch: 112 };
const LANE = { dx: 860, dy: 8, width: 120, height: 48 };
const CONVEYOR = { x: 1100, width: 24 };
const DOCKS = { y: 860, width: 104, height: 80, gap: 20 };
const PANEL = { x: 1170, width: 400 };

// ── The drawing ─────────────────────────────────────────────────────────────────────────────────────────────────

function drawing(): string {
  const text = (x: number, y: number, body: string, size = 14, anchor = 'start', fill = CYAN) =>
    `<text x="${x}" y="${y}" fill="${fill}" font-size="${size}" text-anchor="${anchor}" font-family='${MONO}'>${body}</text>`;
  // The column grid: bubbles along the top and the left, faint lines across the hall.
  const columns = Array.from({ length: 8 }, (_, i) => HALL.x + 40 + i * 150);
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G'].map((name, i) => ({ name, y: HALL.y + 40 + i * 132 }));
  const grid = [
    ...columns.map((x, i) => `<line x1="${x}" y1="${HALL.y}" x2="${x}" y2="${HALL.y + HALL.height}" stroke="${LINE}" stroke-opacity=".14" stroke-dasharray="14 4 2 4"/><circle cx="${x}" cy="${HALL.y - 22}" r="13" fill="none" stroke="${LINE}" stroke-width="1.2"/>${text(x, HALL.y - 17, String(i + 1), 13, 'middle', LINE)}`),
    ...rows.map(({ name, y }) => `<line x1="${HALL.x}" y1="${y}" x2="${HALL.x + HALL.width}" y2="${y}" stroke="${LINE}" stroke-opacity=".14" stroke-dasharray="14 4 2 4"/><circle cx="${HALL.x - 22}" cy="${y}" r="13" fill="none" stroke="${LINE}" stroke-width="1.2"/>${text(HALL.x - 22, y + 5, name, 13, 'middle', LINE)}`),
  ].join('');
  // A dimension line under the hall, with its ticks and the length in millimetres.
  const dimension = (() => {
    const y = HALL.y + HALL.height + 22;
    const x1 = HALL.x;
    const x2 = HALL.x + HALL.width;
    return `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${LINE}" stroke-width="1"/><line x1="${x1}" y1="${y - 7}" x2="${x1}" y2="${y + 7}" stroke="${LINE}"/><line x1="${x2}" y1="${y - 7}" x2="${x2}" y2="${y + 7}" stroke="${LINE}"/>${text((x1 + x2) / 2, y - 6, '84 000', 13, 'middle', LINE)}`;
  })();
  // The conveyor down the east wall to the outbound docks, its rollers drawn as rungs.
  const conveyor = (() => {
    const top = RACK.y;
    const bottom = DOCKS.y - 30;
    const rungs = Array.from({ length: Math.floor((bottom - top) / 16) }, (_, i) => `<line x1="${CONVEYOR.x}" y1="${top + i * 16}" x2="${CONVEYOR.x + CONVEYOR.width}" y2="${top + i * 16}" stroke="${LINE}" stroke-opacity=".5"/>`).join('');
    return `<rect x="${CONVEYOR.x}" y="${top}" width="${CONVEYOR.width}" height="${bottom - top}" fill="none" stroke="${LINE}" stroke-width="1.5"/>${rungs}
<path d="M ${CONVEYOR.x + CONVEYOR.width / 2} ${bottom} V ${bottom + 4} H ${dockX(4)}" fill="none" stroke="${LINE}" stroke-width="1.5" stroke-dasharray="6 4"/>
${text(CONVEYOR.x - 6, top - 10, 'CV-01', 12)}`;
  })();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<defs><pattern id="g" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 H 0 V 20" fill="none" stroke="${LINE}" stroke-opacity=".07"/></pattern></defs>
<rect width="${WIDTH}" height="${HEIGHT}" fill="${PAPER}"/>
<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#g)"/>
${grid}
<rect x="${HALL.x}" y="${HALL.y}" width="${HALL.width}" height="${HALL.height}" fill="none" stroke="${LINE}" stroke-width="3"/>
${dimension}
${conveyor}
${text(HALL.x + 12, DOCKS.y - 8, '입고 스테이징', 13)}
${text(dockX(4), DOCKS.y - 8, '출고 스테이징', 13)}
<line x1="${HALL.x}" y1="${DOCKS.y - 34}" x2="${HALL.x + HALL.width}" y2="${DOCKS.y - 34}" stroke="${LINE}" stroke-opacity=".5" stroke-dasharray="4 6"/>
<line x1="${PANEL.x - 15}" y1="20" x2="${PANEL.x - 15}" y2="${HEIGHT - 20}" stroke="${LINE}" stroke-opacity=".35"/>
</svg>`;
  return svgDataUrl(svg);
}

const dockX = (i: number) => HALL.x + 40 + i * (DOCKS.width + DOCKS.gap) + (i >= 4 ? 60 : 0);

// ── Elements ────────────────────────────────────────────────────────────────────────────────────────────────────

/** A rack row: its letter and how full it is, and its bins — four levels by twelve bays, each filled as full as it is. */
const rack: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['id', 'bins'],
    properties: { id: { type: 'string' }, zone: { type: 'string' }, fill: { type: 'number' }, bins: { type: 'array', items: { type: 'string' } } },
  },
  template: `<section class="rk"><header><b>{{id}}</b><span>{{fill}}%</span><small>{{zone}}</small></header><div class="bins">{{#bins}}<i class="f{{.}}"></i>{{/bins}}</div></section>`,
  style: `.rk{height:100%;box-sizing:border-box;display:grid;grid-template-columns:96px 1fr;grid-template-rows:minmax(0,1fr);gap:10px;font-family:${MONO};color:${LINE}}
header{display:grid;align-content:center;justify-items:start;border-right:1.5px solid ${LINE};padding-right:8px}
b{font-size:24px;line-height:1}
span{font-size:15px;color:${CYAN};font-variant-numeric:tabular-nums}
small{font-size:11px;color:${CYAN};opacity:.8;white-space:nowrap}
.bins{display:grid;grid-template-columns:repeat(12,1fr);grid-template-rows:repeat(4,minmax(0,1fr));gap:2px;border:1.5px solid ${LINE};padding:2px}
i{border:1px solid rgba(232,241,255,.35)}
.f1{background:rgba(232,241,255,.22)}.f2{background:rgba(232,241,255,.45)}.f3{background:rgba(232,241,255,.7)}.f4{background:${LINE}}
.fx{background:repeating-linear-gradient(45deg,${AMBER} 0 3px,transparent 3px 6px);border-color:${AMBER}}
.fq{border:2px solid ${RED}}`,
  size: { width: 800, height: 64 },
};

/** Where a row's picks meet the conveyor: who is picking it and how many order lines wait. */
const lane: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['pickers', 'backlog'], properties: { pickers: { type: 'number' }, backlog: { type: 'number' } } },
  template: `<p class="ln"><span>작업자 <b>{{pickers}}</b></span><span>대기 <b>{{backlog}}</b>줄</span></p>`,
  style: `.ln{margin:0;height:100%;box-sizing:border-box;display:grid;align-content:center;gap:2px;padding:0 8px;border:1.5px solid ${AMBER};font-family:${MONO};color:${CYAN};font-size:12px;white-space:nowrap}
b{color:${LINE};font-size:15px}`,
  size: { width: 120, height: 48 },
};

/** A dock door: the truck at it and how far its loading has gone. */
const dock: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['name', 'state'],
    properties: { name: { type: 'string' }, state: { enum: ['idle', 'working', 'late'] }, truck: { type: 'string' }, pct: { type: 'number' } },
  },
  template: `<figure class="dk {{state}}"><b>{{name}}</b><span>{{truck}}</span><div><i style="width: {{pct}}%"></i></div></figure>`,
  style: `.dk{margin:0;height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr auto;gap:4px;padding:6px 8px;border:1.5px solid ${LINE};border-top:5px solid ${LINE};font-family:${MONO};color:${LINE}}
.idle{opacity:.55;border-style:dashed;border-top-style:solid}
.late{border-color:${RED}}
b{font-size:15px}
span{font-size:12px;color:${CYAN};white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
div{height:6px;border:1px solid ${LINE}}
i{display:block;height:100%;background:${AMBER}}
.late i{background:${RED}}`,
  size: { width: 104, height: 80 },
};

/** The hall's figures, each a value with its unit and a note. */
const figures: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, value: { type: 'string' }, unit: { type: 'string' }, note: { type: 'string' } } } } },
  },
  template: `<dl class="fg">{{#items}}<div><dt>{{label}}</dt><dd>{{value}}<small>{{unit}}</small></dd><p>{{note}}</p></div>{{/items}}</dl>`,
  style: `.fg{margin:0;height:100%;box-sizing:border-box;display:grid;grid-template-columns:1fr 1fr;border:1.5px solid ${LINE};font-family:${MONO};color:${LINE}}
div{padding:10px 12px;border:.75px solid rgba(232,241,255,.4)}
dt{font-size:12px;color:${CYAN};letter-spacing:.04em}
dd{margin:2px 0 0;font-size:32px;line-height:1.1;font-variant-numeric:tabular-nums}
dd small{font-size:14px;margin-left:4px;color:${CYAN}}
p{margin:2px 0 0;font-size:11px;color:${CYAN};opacity:.85;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}`,
  size: { width: 400, height: 200 },
};

/** What needs a hand, each with the bin or door it is at. */
const alerts: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { at: { type: 'string' }, text: { type: 'string' }, level: { enum: ['warn', 'stop', 'note'] } } } } },
  },
  template: `<section class="al"><h3>조치 필요</h3><ul>{{#items}}<li class="{{level}}"><b>{{at}}</b><span>{{text}}</span></li>{{/items}}</ul></section>`,
  style: `.al{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr;gap:6px;font-family:${MONO};color:${LINE}}
h3{margin:0;font-size:13px;font-weight:700;letter-spacing:.12em;color:${CYAN};border-bottom:1.5px solid ${LINE};padding-bottom:4px}
ul{margin:0;padding:0;list-style:none;display:grid;align-content:start;gap:6px}
li{display:grid;grid-template-columns:82px 1fr;gap:8px;font-size:13px;align-items:baseline}
li::before{content:"";display:none}
b{color:${CYAN};white-space:nowrap}
.warn b{color:${AMBER}}.stop b{color:${RED}}
span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}`,
  size: { width: 400, height: 190 },
};

/** The drawing's title block, as a blueprint carries one in its corner. */
const titleBlock: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['title'],
    properties: { title: { type: 'string' }, site: { type: 'string' }, number: { type: 'string' }, scale: { type: 'string' }, stamp: { type: 'string' } },
  },
  template: `<table class="tb"><tr><th colspan="2">{{title}}</th></tr><tr><td>현장</td><td>{{site}}</td></tr><tr><td>도면</td><td>{{number}} · {{scale}}</td></tr><tr><td>기준</td><td>{{stamp}}</td></tr></table>`,
  style: `.tb{width:100%;height:100%;box-sizing:border-box;border-collapse:collapse;font-family:${MONO};color:${LINE};font-size:13px}
th{text-align:left;font-size:18px;padding:8px 10px;border:1.5px solid ${LINE}}
td{padding:4px 10px;border:1px solid rgba(232,241,255,.55);white-space:nowrap}
td:first-child{width:56px;color:${CYAN}}`,
  size: { width: 400, height: 140 },
};

/** A panel's heading, lettered as a drawing's notes are. */
const heading: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['text'], properties: { text: { type: 'string' } } },
  template: `<h2 class="hd">{{text}}</h2>`,
  style: `.hd{margin:0;height:100%;display:flex;align-items:end;font:700 13px ${MONO};letter-spacing:.12em;color:${CYAN}}`,
  size: { width: 400, height: 22 },
};

// ── The board ───────────────────────────────────────────────────────────────────────────────────────────────────

/** Picks per hour, as the width of the line from a row to its lane. */
const PICK_WIDTH: Binding['map'] = { ranges: [{ max: 120, value: 2 }, { min: 120, max: 240, value: 5 }, { min: 240, value: 9 }] };

/** A rack row with its lane: the row, the lane at the conveyor, and the picks between them. */
const rackRow: ComponentDefinition = {
  params: { type: 'object', required: ['rack'], properties: { rack: { type: 'string' } } },
  nodes: [
    {
      id: 'rack',
      x: 0,
      y: 0,
      width: RACK.width,
      height: RACK.height,
      widget: { type: 'element:rack', props: { id: '{{rack}}', zone: '', fill: 0, bins: [] }, bindings: { zone: bindRack('zone'), fill: bindRack('fill'), bins: bindRack('bins') } },
    },
    {
      id: 'lane',
      x: LANE.dx,
      y: LANE.dy,
      width: LANE.width,
      height: LANE.height,
      widget: { type: 'element:lane', props: { pickers: 0, backlog: 0 }, bindings: { pickers: bindRack('pickers'), backlog: bindRack('backlog') } },
    },
  ],
  connectors: [
    {
      id: 'picks',
      fromNodeId: 'rack',
      toNodeId: 'lane',
      label: '{{value}}',
      style: { stroke: AMBER, strokeWidth: 4, arrow: 'end' },
      bindings: { label: bindRack('picks'), 'style.strokeWidth': bindRack('picks', PICK_WIDTH) },
    },
  ],
};

const node = (id: string, x: number, y: number, width: number, height: number, widget: Widget): Node => ({ id, x, y, width, height, anchored: false, widget });

const DOOR_IDS = ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8'];

const nodes: Node[] = [
  ...DOOR_IDS.map((id, i) => {
    const field = (name: string) => ({ adapter: WMS.key, ref: { path: '/wms/docks', item: { list: '/value', where: { id } }, valuePath: `/${name}`, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS } });
    return node(`dock-${id}`, dockX(i), DOCKS.y, DOCKS.width, DOCKS.height, {
      type: 'element:dock',
      props: { name: id, state: 'idle', truck: '', pct: 0 },
      bindings: { state: field('state'), truck: field('truck'), pct: field('pct') },
    });
  }),
  node('figures-head', PANEL.x, 34, PANEL.width, 22, { type: 'element:heading', props: { text: '보관동 2 · 지금' } }),
  node('figures', PANEL.x, 62, PANEL.width, 200, { type: 'element:figures', props: { items: [] }, bindings: { items: bind('/wms/figures', '/value') } }),
  node('flow-head', PANEL.x, 282, PANEL.width, 22, { type: 'element:heading', props: { text: '시간대별 입출고(팔레트)' } }),
  node('flow', PANEL.x, 308, PANEL.width, 250, {
    type: 'chart.line',
    props: {
      data: [],
      mapping: { x: 'hour', y: ['inbound', 'outbound'] },
      options: { series: [{ label: '입고', color: CYAN }, { label: '출고', color: AMBER }] },
    },
    bindings: { data: bind('/wms/flow', '/value') },
  }),
  node('alerts', PANEL.x, 586, PANEL.width, 190, { type: 'element:alerts', props: { items: [] }, bindings: { items: bind('/wms/alerts', '/value') } }),
  node('title-block', PANEL.x, 800, PANEL.width, 160, {
    type: 'element:title-block',
    props: { title: '랙 점유 · 피킹 현황', site: '', number: 'W-02-03', scale: '1:400', stamp: '' },
    bindings: { site: bind('/wms/now', '/site'), stamp: bind('/wms/now', '/stamp') },
  }),
];

const document: CanvasView = {
  kind: 'canvas',
  appearance: 'dark',
  accent: AMBER,
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes,
  connectors: [],
  elements: { rack, lane, dock, figures, alerts, 'title-block': titleBlock, heading },
  components: { 'rack-row': rackRow },
  instances: RACKS.map((id, i) => ({ id, component: 'rack-row', x: RACK.x, y: RACK.y + i * RACK.pitch, anchored: false, params: { rack: id } })),
};

export const warehouseRacks: SamplePack = {
  id: 'warehouse-racks',
  title: { ko: '물류센터 랙 점유와 피킹 — 청사진 도면', en: 'A distribution centre’s racks and picking — a blueprint' },
  field: { ko: '물류·창고', en: 'Logistics & warehousing' },
  kind: { ko: '창고 평면(컴포넌트 반복)', en: 'A warehouse plan (one component, repeated)' },
  domain: 'logistics',
  styles: ['drawing'],
  summary: {
    ko: '물류센터 보관동을 청사진처럼 — 파란 종이에 흰 선, 기둥 열 번호, 치수선, 구석의 표제란. 랙 줄 여섯이 같은 컴포넌트 하나: 4단 × 12열 빈을 찬 만큼 채우고(막힌 빈은 빗금, 품질 보류는 빨간 테), 컨베이어 레인까지 피킹 선이 시간당 피킹만큼 굵어지며, 레인에 작업자와 대기 줄. 아래 입고·출고 도크 여덟(트럭·적재 진행), 오른쪽에 점유율·빈 로케이션·출고 진행·정확도, 시간대별 입출고, 조치 필요 목록. 예시 데이터입니다.',
    en: 'A distribution centre’s storage hall drawn as a blueprint — white lines on blue paper, the column grid’s bubbles, a dimension line and a title block in the corner. The six rack rows are one component: four levels by twelve bays of bins, each filled as full as it is (blocked bins hatched, bins on quality hold rimmed red), a line to its conveyor lane as thick as the row is being picked, and at the lane who is picking and how many order lines wait. Along the bottom the eight dock doors with their trucks and loading; on the right the hall’s fill, free locations, outbound progress and accuracy, inbound and outbound by the hour, and what needs a hand. Example data.',
  },
  connectors: [WMS],
  document,
  snapshot,
};
