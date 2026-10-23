import type { Binding, CanvasView, Node, Shape } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { escapeXml, svgDataUrl } from '../frame.js';
import { snapshot } from '../snapshots/water-pumps.js';

// A water treatment plant's transfer system as a SCADA screen draws it: the intake well, three pumps in parallel,
// the clear well and the two reservoirs it feeds, each value on its place in the process. Grey for what is normal,
// colour only for what is not (ISA-101 high-performance HMI): a running pump is not green, a tripped one is red.
// No public source carries a plant's SCADA tags, so the values are example data written for the board.

const WIDTH = 1280;
const HEIGHT = 780;

export const SCADA: ExampleSampleConnector = {
  key: 'scada',
  name: '예시 SCADA API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 정수장이 아닙니다' },
};

/** SCADA tags update every few seconds; a minute without one is a link that has dropped. */
const MAX_AGE_SECONDS = 60;

const bind = (path: string, valuePath: string): Binding => ({
  adapter: SCADA.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
});

const bindPump = (id: string, field: string, map?: Binding['map']): Binding => ({
  adapter: SCADA.key,
  ref: { path: '/scada/pumps', item: { list: '/value', where: { id } }, valuePath: `/${field}`, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
  ...(map ? { map } : {}),
});

/** A pump's state in words and in the board's colour: normal states (running, standby) stay grey — ISA-101. */
const PUMP_TEXT = { values: { running: '운전', standby: '대기', fault: '고장 정지', maintenance: '정비' }, otherwise: '알 수 없음' };
const PUMP_LEVEL = { values: { running: 'idle', standby: 'idle', fault: 'alarm', maintenance: 'warn' }, otherwise: 'warn' };

// The process, left to right: intake well → suction header → pumps → discharge header → clear well → flow meter →
// the two reservoirs. The drawing and the nodes share these numbers.
const INTAKE = { x: 50, y: 200, width: 160, height: 220 };
const SUCTION_X = 250;
const PUMP_X = 300;
const PUMP_YS = [230, 360, 490];
const PUMPS = ['P-101', 'P-102', 'P-103'];
const DISCHARGE_X = 600;
const CLEAR_WELL = { x: 660, y: 200, width: 170, height: 300 };
const MAIN_Y = 350;
const METER = { x: 885, y: MAIN_Y };
const BRANCH_X = 1010;
const RESERVOIRS = [
  { key: 'reservoirA', name: '1 배수지', x: 1040, y: 150 },
  { key: 'reservoirB', name: '2 배수지', x: 1040, y: 400 },
];
const RESERVOIR = { width: 210, height: 170 };

const pumpNode = (id: string, i: number): Node => ({
  id: `pump-${id}`,
  x: PUMP_X + 46,
  y: PUMP_YS[i] - 78,
  width: 230,
  height: 64,
  anchored: true,
  widget: {
    type: 'status',
    props: { data: [{ label: id, value: '', tone: 'idle' }, { label: '토출 압력(bar)', value: 0, tone: 'idle' }] },
    bindings: {
      'data.0.value': bindPump(id, 'state', PUMP_TEXT),
      'data.0.tone': bindPump(id, 'state', PUMP_LEVEL),
      'data.1.value': bindPump(id, 'pressure'),
      'data.1.tone': bindPump(id, 'state', PUMP_LEVEL),
    },
  },
});

/** A vessel's level in grey while it is in its normal band; only a low level (a quarter or less) takes colour. */
const LEVEL_THRESHOLDS = [{ to: 25, color: 'orange' }, { to: 100, color: '#6b7680' }];

const levelGauge = (id: string, x: number, y: number, label: string, valuePath: string): Node => ({
  id,
  x,
  y,
  width: 150,
  height: 120,
  anchored: true,
  widget: {
    type: 'gauge',
    props: { data: { value: 0, max: 100 }, options: { unit: '%', subtitle: label, thresholds: LEVEL_THRESHOLDS } },
    bindings: { 'data.value': bind('/scada/levels', valuePath) },
  },
});

const metric = (id: string, x: number, y: number, label: string, unit: string, path: string, valuePath: string): Node => ({
  id,
  x,
  y,
  width: 170,
  height: 70,
  anchored: false,
  widget: { type: 'metric', props: { data: { label, value: 0, unit } }, bindings: { 'data.value': bind(path, valuePath) } },
});

const NODES: Node[] = [
  { ...metric('intake-level', INTAKE.x + 6, INTAKE.y + 120, '착수정 수위', 'm', '/scada/levels', '/intake'), width: 148, anchored: true },
  ...PUMPS.map(pumpNode),
  levelGauge('clear-well', CLEAR_WELL.x + 10, CLEAR_WELL.y + 90, '정수지 수위', '/clearWell'),
  { ...metric('transfer-flow', METER.x - 50, MAIN_Y + 30, '송수 유량', 'm³/h', '/scada/quality', '/flow'), anchored: true },
  ...RESERVOIRS.map(({ key, name, x, y }) => levelGauge(key, x + 30, y + 40, `${name} 수위`, `/${key}`)),
  {
    id: 'flow-trend',
    x: 40,
    y: 590,
    width: 600,
    height: 160,
    anchored: false,
    widget: {
      type: 'chart.line',
      props: {
        title: '송수 유량 (m³/h, 6시간)',
        data: [],
        mapping: { x: 't', y: 'flow' },
        options: { xFormat: 'time', valueAxisZero: false, series: [{ label: '송수 유량', symbol: 'none', color: '#4a555b' }] },
      },
      bindings: { data: bind('/scada/flow-trend', '/value') },
    },
  },
  metric('turbidity', 680, 600, '탁도', 'NTU', '/scada/quality', '/turbidity'),
  metric('chlorine', 860, 600, '잔류염소', 'mg/L', '/scada/quality', '/chlorine'),
];

const DECORATIONS: Shape[] = [
  { id: 'title', type: 'text', x: 24, y: 20, text: '정수장 송수 계통', fontSize: 24, fill: '#1f2a30' },
  { id: 'note', type: 'text', x: 24, y: 54, text: '착수정 → 송수 펌프 → 정수지 → 배수지 · 정상은 회색, 이상만 색 · 예시 데이터', fontSize: 13, fill: '#5b666c' },
];

/** The process drawn in greys: vessels as outlines, pipes as plain lines, pumps as circles with their outlet, the
 *  flow meter on the main. No colour carries meaning in the drawing — the widgets on it do. */
function drawing(): string {
  const stroke = '#7d8890';
  const pipe = (d: string) => `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="5" stroke-linejoin="round"/>`;
  const label = (x: number, y: number, text: string, anchor = 'start') =>
    `<text x="${x}" y="${y}" font-size="13" fill="#4a555b" text-anchor="${anchor}" font-family="sans-serif">${escapeXml(text)}</text>`;
  const vessel = (box: { x: number; y: number; width: number; height: number }, name: string) =>
    `<rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" rx="6" fill="#f1f3f4" stroke="#5f6a70" stroke-width="2"/>${label(box.x + 10, box.y + 22, name)}`;
  const pumps = PUMP_YS.map((y, i) => `${pipe(`M ${SUCTION_X} ${y} H ${PUMP_X - 30}`)}${pipe(`M ${PUMP_X + 30} ${y} H ${DISCHARGE_X}`)}
<circle cx="${PUMP_X}" cy="${y}" r="30" fill="#f1f3f4" stroke="#5f6a70" stroke-width="2"/>
<path d="M ${PUMP_X - 14} ${y - 18} L ${PUMP_X + 22} ${y} L ${PUMP_X - 14} ${y + 18} Z" fill="none" stroke="#5f6a70" stroke-width="2"/>
${label(PUMP_X, y + 50, PUMPS[i], 'middle')}`).join('\n');
  const reservoirs = RESERVOIRS.map(r => `${vessel({ ...r, ...RESERVOIR }, r.name)}${pipe(`M ${BRANCH_X} ${r.y + RESERVOIR.height / 2} H ${r.x}`)}`).join('\n');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<rect width="${WIDTH}" height="${HEIGHT}" fill="#e6e9eb"/>
${vessel(INTAKE, '착수정')}
${pipe(`M ${INTAKE.x + INTAKE.width} ${INTAKE.y + 110} H ${SUCTION_X}`)}
${pipe(`M ${SUCTION_X} ${PUMP_YS[0]} V ${PUMP_YS[2]}`)}
${label(SUCTION_X - 8, PUMP_YS[2] + 52, '흡입 헤더', 'end')}
${pumps}
${pipe(`M ${DISCHARGE_X} ${PUMP_YS[0]} V ${PUMP_YS[2]}`)}
${pipe(`M ${DISCHARGE_X} ${MAIN_Y} H ${CLEAR_WELL.x}`)}
${label(DISCHARGE_X + 8, PUMP_YS[2] + 52, '토출 헤더')}
${vessel(CLEAR_WELL, '정수지')}
${pipe(`M ${CLEAR_WELL.x + CLEAR_WELL.width} ${MAIN_Y} H ${BRANCH_X}`)}
<circle cx="${METER.x}" cy="${METER.y}" r="15" fill="#f1f3f4" stroke="#5f6a70" stroke-width="2"/>${label(METER.x, METER.y + 5, 'FT', 'middle')}
${pipe(`M ${BRANCH_X} ${RESERVOIRS[0].y + RESERVOIR.height / 2} V ${RESERVOIRS[1].y + RESERVOIR.height / 2}`)}
${reservoirs}
<rect x="24" y="570" width="1010" height="190" rx="8" fill="#f4f5f6" stroke="#cdd3d6"/>
<text x="${WIDTH - 24}" y="${HEIGHT - 10}" font-size="11" fill="#5b666c" text-anchor="end" font-family="sans-serif">${escapeXml('계통도 — 예시 정수장, 실제 시설과 다름')}</text>
</svg>`;
  return svgDataUrl(svg);
}

const document: CanvasView = {
  kind: 'canvas',
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes: NODES,
  connectors: [],
  decorations: DECORATIONS,
};

export const waterPumps: SamplePack = {
  id: 'water-pumps',
  title: { ko: '정수장 송수 계통', en: 'Water treatment transfer system' },
  field: { ko: '상하수도·유틸리티', en: 'Water & utilities' },
  kind: { ko: '계통도', en: 'Process diagram' },
  domain: 'energy',
  styles: ['operations'],
  summary: {
    ko: '착수정부터 송수 펌프 셋, 정수지, 두 배수지까지 계통도 위에 수위·펌프 상태·토출 압력·송수 유량을 그 자리에. 정상은 회색으로 두고 이상만 색으로 드러내는 SCADA 화면 원칙(ISA-101)을 따랐습니다. 예시 데이터입니다.',
    en: 'Levels, pump states, discharge pressures and the transfer flow on their places in the process diagram, from the intake well through three transfer pumps and the clear well to two reservoirs. Normal stays grey and only the abnormal takes colour, as SCADA screens are drawn (ISA-101). Example data.',
  },
  connectors: [SCADA],
  document,
  snapshot,
};
