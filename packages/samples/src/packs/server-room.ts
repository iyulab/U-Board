import type { Binding, CanvasView, ElementDefinition, Node, Shape } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { escapeXml, svgDataUrl } from '../frame.js';
import { snapshot } from '../snapshots/server-room.js';

// A server room drawn from above: two rows of racks facing a cold aisle, the cooling units on the walls. Each rack
// shows the temperature of the air it draws in — quiet while it is within the recommended range for IT equipment
// (ASHRAE: up to 27 °C), amber above it, red past the allowable 32 °C — and the power it uses against its budget; each
// cooling unit its state and the temperature it supplies. The room's PUE, its IT load and how it has run beside it.
// No public source carries a room's racks, so the values are example data written for the board.

const WIDTH = 1280;
const HEIGHT = 800;

export const DCIM: ExampleSampleConnector = {
  key: 'dcim',
  name: '예시 DCIM API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 서버실이 아닙니다' },
};

/** The sensors report every minute; five minutes without one is a source that has stopped. */
const MAX_AGE_SECONDS = 5 * 60;

const bindItem = (path: string, id: string, field: string, map?: Binding['map']): Binding => ({
  adapter: DCIM.key,
  ref: { path, item: { list: '/value', where: { id } }, valuePath: `/${field}`, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
  ...(map ? { map } : {}),
});

const bindRoom = (valuePath: string): Binding => ({
  adapter: DCIM.key,
  ref: { path: '/room/summary', valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
});

/** ASHRAE's bands for the air a server draws in: recommended up to 27 °C, allowable (A1) up to 32 °C. */
const INLET_BAND = { ranges: [{ min: 32, value: 'hot' }, { min: 27, value: 'warm' }], otherwise: 'ok' };

const rack: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['name', 'inlet', 'band', 'kw', 'budget'],
    properties: {
      name: { type: 'string' },
      inlet: { type: 'number', description: 'Inlet air, °C.' },
      band: { enum: ['ok', 'warm', 'hot'] },
      kw: { type: 'number', minimum: 0, description: 'Power drawn, kW.' },
      budget: { type: 'number', minimum: 0, description: 'The power the rack is provisioned for, kW.' },
    },
  },
  template: `<div class="rack {{band}}" style="--kw: {{kw}}; --budget: {{budget}}" role="img" aria-label="{{name}} 흡기 {{inlet}}°C, {{kw}} kW">
  <b>{{name}}</b>
  <span class="inlet">{{inlet | fixed:1}}<small>°C</small></span>
  <span class="kw">{{kw | fixed:1}} kW</span>
  <span class="bar"><span></span></span>
</div>`,
  style: `.rack{box-sizing:border-box;height:100%;display:grid;grid-template-rows:auto 1fr auto auto;justify-items:center;gap:2px;padding:7px 6px 8px;
border:1px solid var(--u-widget-border);border-top:5px solid var(--c);border-radius:4px;background:var(--u-widget-surface);
font-family:var(--u-widget-font-family);color:var(--u-widget-text);--c:var(--u-widget-text-secondary)}
b{font-size:12px;font-weight:600;color:var(--u-widget-text-secondary)}
.inlet{align-self:center;font-size:21px;font-weight:600;font-variant-numeric:tabular-nums}
.inlet small{font-size:11px;font-weight:500;color:var(--u-widget-text-secondary)}
.kw{font-size:11px;color:var(--u-widget-text-secondary);font-variant-numeric:tabular-nums}
.bar{width:100%;height:5px;border-radius:3px;background:var(--u-widget-border);overflow:hidden}
.bar span{display:block;height:100%;width:min(100%, calc(var(--kw) * 100% / var(--budget)));background:var(--u-widget-text-secondary)}
.warm{--c:var(--u-widget-warning)}
.hot{--c:var(--u-widget-negative);border-color:var(--c);border-width:2px 2px 2px;border-top-width:5px}
.warm .inlet,.hot .inlet{color:var(--c)}`,
  size: { width: 80, height: 120 },
};

const ROWS = [
  { id: 'A', y: 216 },
  { id: 'B', y: 456 },
];
const RACK_X = (i: number) => 216 + i * 88;
const RACKS = ROWS.flatMap(row => Array.from({ length: 8 }, (_, i) => ({ id: `${row.id}${String(i + 1).padStart(2, '0')}`, x: RACK_X(i), y: row.y })));

function rackNode({ id, x, y }: (typeof RACKS)[number]): Node {
  return {
    id: `rack-${id}`,
    x,
    y,
    anchored: true,
    widget: {
      type: 'element:rack',
      props: { name: id, inlet: 0, band: 'ok', kw: 0, budget: 10 },
      bindings: {
        inlet: bindItem('/room/racks', id, 'inletC'),
        band: bindItem('/room/racks', id, 'inletC', INLET_BAND),
        kw: bindItem('/room/racks', id, 'kw'),
        budget: bindItem('/room/racks', id, 'budgetKw'),
      },
    },
  };
}

const CRAC_STATE = { values: { cooling: '냉각', standby: '대기', fault: '고장' }, otherwise: '알 수 없음' };
const CRAC_LEVEL = { values: { cooling: 'ok', standby: 'idle', fault: 'alarm' }, otherwise: 'idle' };
const CRACS = [
  { id: 'CRAC-1', x: 260, y: 108 },
  { id: 'CRAC-2', x: 600, y: 108 },
  { id: 'CRAC-3', x: 600, y: 616 },
  { id: 'CRAC-4', x: 260, y: 616 },
];

function cracNode({ id, x, y }: (typeof CRACS)[number]): Node {
  return {
    id: `crac-${id}`,
    x,
    y,
    width: 220,
    height: 64,
    anchored: true,
    widget: {
      type: 'status',
      props: { data: [{ label: id, value: '', tone: 'idle' }, { label: '공급(°C)', value: '', tone: 'idle' }] },
      bindings: {
        'data.0.value': bindItem('/room/cooling', id, 'state', CRAC_STATE),
        'data.0.tone': bindItem('/room/cooling', id, 'state', CRAC_LEVEL),
        'data.1.value': bindItem('/room/cooling', id, 'supplyC'),
      },
    },
  };
}

const SIDE_X = 980;
const SIDE: Node[] = [
  {
    id: 'pue',
    x: SIDE_X,
    y: 100,
    width: 270,
    height: 150,
    anchored: false,
    widget: {
      type: 'gauge',
      props: { data: { value: 1 }, options: { min: 1, max: 2.5, subtitle: 'PUE (지금)', thresholds: [{ to: 1.6, color: 'green' }, { to: 2, color: 'yellow' }, { to: 2.5, color: 'red' }] } },
      bindings: { 'data.value': bindRoom('/pue') },
    },
  },
  {
    id: 'it-load',
    x: SIDE_X,
    y: 270,
    width: 130,
    height: 76,
    anchored: false,
    widget: { type: 'metric', props: { data: { label: 'IT 부하', value: 0, unit: 'kW' } }, bindings: { 'data.value': bindRoom('/itKw') } },
  },
  {
    id: 'facility-load',
    x: SIDE_X + 140,
    y: 270,
    width: 130,
    height: 76,
    anchored: false,
    widget: { type: 'metric', props: { data: { label: '전체 전력', value: 0, unit: 'kW' } }, bindings: { 'data.value': bindRoom('/facilityKw') } },
  },
  {
    id: 'over-range',
    x: SIDE_X,
    y: 360,
    width: 270,
    height: 76,
    anchored: false,
    widget: {
      type: 'metric',
      props: { data: { label: '권장 범위(27 °C)를 넘은 랙', value: 0, unit: '대' } },
      bindings: { 'data.value': bindRoom('/racksOverRecommended') },
    },
  },
  {
    id: 'inlet-trend',
    x: SIDE_X,
    y: 456,
    width: 270,
    height: 220,
    anchored: false,
    widget: {
      type: 'chart.line',
      props: {
        title: '가장 더운 랙 흡기 온도(°C)',
        data: [],
        mapping: { x: 'time', y: 'maxInletC' },
        options: { xFormat: 'time', series: [{ label: '최고 흡기' }] },
      },
      bindings: { data: { adapter: DCIM.key, ref: { path: '/room/inlet-history', valuePath: '/value', observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS } } },
    },
  },
];

const DECORATIONS: Shape[] = [
  { id: 'title', type: 'text', x: 24, y: 22, text: '서버실 열 지도', fontSize: 24, fill: '#17252b' },
  { id: 'note', type: 'text', x: 24, y: 56, text: '랙마다 흡기 온도와 전력 · 항온항습기 상태 · 예시 데이터', fontSize: 13, fill: '#5b6b70' },
  { id: 'side-title', type: 'text', x: SIDE_X, y: 72, text: '서버실 전체', fontSize: 15, fill: '#22313b' },
];

/** The room drawn plainly: its walls, the raised floor's tiles, the cold aisle between the rows (perforated tiles,
 *  a cool tint) and the hot aisles behind them, a footprint under each rack and cooling unit, and the door. */
function drawing(): string {
  const room = { x: 40, y: 88, width: 900, height: 672 };
  const tiles: string[] = [];
  for (let x = room.x; x <= room.x + room.width; x += 44) tiles.push(`<path d="M ${x} ${room.y} V ${room.y + room.height}"/>`);
  for (let y = room.y; y <= room.y + room.height; y += 44) tiles.push(`<path d="M ${room.x} ${y} H ${room.x + room.width}"/>`);
  const rowLeft = RACK_X(0) - 12;
  const rowWidth = RACK_X(7) + 80 + 12 - rowLeft;
  const aisle = (y: number, height: number, fill: string, label: string) =>
    `<rect x="${rowLeft}" y="${y}" width="${rowWidth}" height="${height}" fill="${fill}"/>
<text x="${rowLeft - 14}" y="${y + height / 2 + 4}" font-size="12" fill="#5b6b70" text-anchor="end" font-family="sans-serif">${escapeXml(label)}</text>`;
  const perforated = Array.from({ length: 8 }, (_, i) => `<rect x="${RACK_X(i) + 10}" y="378" width="60" height="44" fill="none" stroke="#8fb3c9" stroke-dasharray="3 3"/>`).join('\n');
  const footprints = [
    ...RACKS.map(r => `<rect x="${r.x - 3}" y="${r.y - 3}" width="86" height="126" rx="3" fill="#dfe5e8"/>`),
    ...CRACS.map(c => `<rect x="${c.x - 6}" y="${c.y - 6}" width="232" height="76" rx="6" fill="#e3e9ec" stroke="#c3ced4"/>`),
  ].join('\n');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<rect width="${WIDTH}" height="${HEIGHT}" fill="#f4f6f7"/>
<rect x="${room.x}" y="${room.y}" width="${room.width}" height="${room.height}" fill="#fbfcfc"/>
<g stroke="#e6ebed" stroke-width="1">${tiles.join('')}</g>
${aisle(184, 28, '#f6e7dc', '열복도')}
${aisle(340, 112, '#e2eef6', '냉복도')}
${aisle(580, 28, '#f6e7dc', '열복도')}
${perforated}
${footprints}
<rect x="${room.x}" y="${room.y}" width="${room.width}" height="${room.height}" fill="none" stroke="#7f939e" stroke-width="4"/>
<rect x="${room.x - 2}" y="${room.y + 520}" width="6" height="80" fill="#f4f6f7"/>
<text x="${room.x + 14}" y="${room.y + 566}" font-size="11" fill="#7a8a93" font-family="sans-serif">${escapeXml('출입문')}</text>
<rect x="${SIDE_X - 16}" y="60" width="${WIDTH - SIDE_X}" height="${HEIGHT - 80}" rx="8" fill="#ffffff" stroke="#d6dedb"/>
<text x="40" y="${HEIGHT - 12}" font-size="11" fill="#5b6b70" font-family="sans-serif">${escapeXml('약도 — 예시 서버실, 실제 배치와 다름')}</text>
</svg>`;
  return svgDataUrl(svg);
}

const document: CanvasView = {
  kind: 'canvas',
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes: [...RACKS.map(rackNode), ...CRACS.map(cracNode), ...SIDE],
  connectors: [],
  decorations: DECORATIONS,
  elements: { rack },
};

export const serverRoom: SamplePack = {
  id: 'server-room',
  title: { ko: '서버실 열 지도', en: 'Server room thermal map' },
  field: { ko: '데이터센터·에너지', en: 'Data center & energy' },
  kind: { ko: '서버실 평면도', en: 'Room floor plan' },
  domain: 'it',
  styles: ['operations'],
  summary: {
    ko: '두 줄의 랙마다 흡기 온도(권장 27 °C·허용 32 °C 구간 색)와 전력을 랙이 선 자리에, 벽의 항온항습기마다 상태와 공급 온도를, 옆에는 PUE와 IT 부하, 가장 더운 랙의 흐름. 예시 데이터입니다.',
    en: 'Each rack’s inlet temperature (coloured by the recommended 27 °C and allowable 32 °C bands) and power where it stands in two rows, each cooling unit’s state and supply temperature on the walls, and the room’s PUE, IT load and its hottest rack over time beside them. Example data.',
  },
  connectors: [DCIM],
  document,
  snapshot,
};
