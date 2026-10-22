import type { Binding, Node, Shape, CanvasView } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { escapeXml, svgDataUrl } from '../frame.js';
import { snapshot } from '../snapshots/factory-floor.js';

// A plant floor: three production lines drawn where they stand, each machine's state and its open work
// orders on the machine's place, each line's OEE and output beside it, and the plant's totals on the side.
// No public source carries a plant's machines, so the values are example data written for the board.

const WIDTH = 1280;
const HEIGHT = 800;

export const PLANT: ExampleSampleConnector = {
  key: 'plant',
  name: '예시 공장 API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 설비가 아닙니다' },
};

/** How old a machine's reading may be before the board calls it behind: the example source reports every
 *  few seconds, so a minute without one is a source that has stopped. */
const MAX_AGE_SECONDS = 60;

const bindItem = (path: string, id: string, field: string, map?: Binding['map']): Binding => ({
  adapter: PLANT.key,
  ref: { path, item: { list: '/value', where: { id } }, valuePath: `/${field}`, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
  ...(map ? { map } : {}),
});

const bindSummary = (valuePath: string): Binding => ({
  adapter: PLANT.key,
  ref: { path: '/plant/summary', valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
});

/** A machine's state in words, and in the color the board gives it. */
const STATE_TEXT = { values: { running: '가동', idle: '대기', down: '정지', maintenance: '점검' }, otherwise: '알 수 없음' };
const STATE_LEVEL = { values: { running: 'success', idle: 'info', down: 'error', maintenance: 'warning' }, otherwise: 'neutral' };
/** Open work orders: none is fine, any is something to look at. */
const ORDERS_LEVEL = { ranges: [{ max: 1, value: 'success' }, { min: 1, value: 'warning' }] };

interface Line {
  id: string;
  name: string;
  y: number;
  target: number;
  machines: { id: string; name: string }[];
}

const BAY = { x: 48, width: 712, height: 200 };
const LINES: Line[] = [
  { id: 'L1', name: '1라인 · 프레스, 가공', y: 100, target: 1100, machines: [
    { id: 'PR-01', name: '프레스 1호' }, { id: 'PR-02', name: '프레스 2호' }, { id: 'CN-01', name: 'CNC 1호' }, { id: 'CN-02', name: 'CNC 2호' },
  ] },
  { id: 'L2', name: '2라인 · 조립', y: 320, target: 1500, machines: [
    { id: 'WR-01', name: '용접 로봇 1' }, { id: 'WR-02', name: '용접 로봇 2' }, { id: 'AS-01', name: '조립 스테이션' }, { id: 'SC-01', name: '체결기' },
  ] },
  { id: 'L3', name: '3라인 · 검사, 포장', y: 540, target: 1500, machines: [
    { id: 'VI-01', name: '비전 검사기' }, { id: 'LT-01', name: '누설 시험기' }, { id: 'PK-01', name: '포장기' }, { id: 'PL-01', name: '팔레타이저' },
  ] },
];

const TILE = { width: 150, height: 76 };
/** Where a machine stands in its bay — four stations, left to right along the line's conveyor. */
const machineX = (i: number) => BAY.x + 24 + i * 172;
const machineY = (line: Line) => line.y + 64;

function machine(line: Line, { id, name }: Line['machines'][number], i: number): Node {
  return {
    id: `machine-${id}`,
    x: machineX(i),
    y: machineY(line),
    ...TILE,
    anchored: true,
    widget: {
      type: 'status',
      props: { data: [{ label: name, value: '', level: 'neutral' }, { label: '미결 작업', value: 0, level: 'neutral' }] },
      bindings: {
        'data.0.value': bindItem('/plant/equipment', id, 'state', STATE_TEXT),
        'data.0.level': bindItem('/plant/equipment', id, 'state', STATE_LEVEL),
        'data.1.value': bindItem('/plant/equipment', id, 'openWorkOrders'),
        'data.1.level': bindItem('/plant/equipment', id, 'openWorkOrders', ORDERS_LEVEL),
      },
    },
  };
}

const LINE_PANEL_X = 780;
function lineFigures(line: Line): Node[] {
  return [
    {
      id: `oee-${line.id}`,
      x: LINE_PANEL_X,
      y: line.y + 20,
      width: 160,
      height: 76,
      anchored: false,
      widget: { type: 'metric', props: { data: { label: 'OEE', value: 0, unit: '%' } }, bindings: { 'data.value': bindItem('/plant/lines', line.id, 'oee') } },
    },
    {
      id: `output-${line.id}`,
      x: LINE_PANEL_X,
      y: line.y + 108,
      width: 160,
      height: 76,
      anchored: false,
      widget: {
        type: 'metric',
        props: { data: { label: `생산 실적 (목표 ${line.target.toLocaleString('en-US')})`, value: 0, unit: '개' }, options: { format: 'number' } },
        bindings: { 'data.value': bindItem('/plant/lines', line.id, 'output') },
      },
    },
  ];
}

const SIDE_X = 980;
const SIDE: Node[] = [
  {
    id: 'open-orders',
    x: SIDE_X,
    y: 100,
    width: 130,
    height: 76,
    anchored: false,
    widget: { type: 'metric', props: { data: { label: '미결 작업', value: 0, unit: '건' } }, bindings: { 'data.value': bindSummary('/openWorkOrders') } },
  },
  {
    id: 'overdue-orders',
    x: SIDE_X + 140,
    y: 100,
    width: 130,
    height: 76,
    anchored: false,
    widget: { type: 'metric', props: { data: { label: '기한 지난 작업', value: 0, unit: '건' } }, bindings: { 'data.value': bindSummary('/overdueWorkOrders') } },
  },
  {
    id: 'availability',
    x: SIDE_X,
    y: 196,
    width: 270,
    height: 150,
    anchored: false,
    widget: {
      type: 'gauge',
      props: { data: { value: 0, max: 100 }, options: { unit: '%', subtitle: '공장 가동률(오늘)' } },
      bindings: { 'data.value': bindSummary('/availability') },
    },
  },
  {
    id: 'hourly-output',
    x: SIDE_X,
    y: 366,
    width: 270,
    height: 220,
    anchored: false,
    widget: {
      type: 'chart.bar',
      props: { title: '시간대별 생산량(전 라인)', data: [], mapping: { x: 'hour', y: 'count' }, options: { xFormat: { type: 'time' } } },
      bindings: { data: { adapter: PLANT.key, ref: { path: '/plant/output', valuePath: '/value', observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS } } },
    },
  },
];

const frame = (line: Line): Shape[] => [
  { id: `bay-${line.id}`, type: 'rect', x: BAY.x, y: line.y, width: BAY.width, height: BAY.height, stroke: '#5f7a8c', strokeWidth: 1.5, label: line.name, labelSize: 15, labelFill: '#22313b' },
];

const DECORATIONS: Shape[] = [
  { id: 'title', type: 'text', x: 24, y: 22, text: '공장 설비 상태판', fontSize: 24, fill: '#17252b' },
  { id: 'note', type: 'text', x: 24, y: 56, text: '설비마다 상태와 미결 작업 · 라인마다 OEE와 생산 실적 · 예시 데이터', fontSize: 13, fill: '#5b6b70' },
  ...LINES.flatMap(frame),
  { id: 'side-title', type: 'text', x: SIDE_X, y: 72, text: '공장 전체', fontSize: 15, fill: '#22313b' },
];

/** The plant drawn plainly: its walls, each line's bay with the conveyor its machines stand along and a
 *  footprint under each machine, the dock and the utility room. */
function drawing(): string {
  const conveyors = LINES.map(line => {
    const y = machineY(line) + TILE.height + 26;
    return `<rect x="${BAY.x + 16}" y="${y}" width="${BAY.width - 32}" height="14" rx="3" fill="#cfd8dd"/>
<path d="M ${BAY.x + 30} ${y + 7} H ${BAY.x + BAY.width - 30}" stroke="#9aa9b2" stroke-width="2" stroke-dasharray="8 6"/>
<text x="${BAY.x + BAY.width - 24}" y="${y + 30}" font-size="11" fill="#7a8a93" text-anchor="end" font-family="sans-serif">${escapeXml('컨베이어 →')}</text>`;
  }).join('\n');
  const footprints = LINES.flatMap(line =>
    line.machines.map((_, i) => `<rect x="${machineX(i) - 6}" y="${machineY(line) - 6}" width="${TILE.width + 12}" height="${TILE.height + 12}" rx="6" fill="#e3e9ec" stroke="#c3ced4"/>`)
  ).join('\n');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<rect width="${WIDTH}" height="${HEIGHT}" fill="#f4f6f7"/>
<rect x="28" y="84" width="932" height="680" fill="#fbfcfc" stroke="#7f939e" stroke-width="4"/>
<rect x="${SIDE_X - 16}" y="60" width="${WIDTH - SIDE_X}" height="${HEIGHT - 80}" rx="8" fill="#ffffff" stroke="#d6dedb"/>
${footprints}
${conveyors}
<rect x="776" y="748" width="120" height="16" fill="#f0c36d"/>
<text x="836" y="790" font-size="11" fill="#7a8a93" text-anchor="middle" font-family="sans-serif">${escapeXml('출하 도크')}</text>
<text x="40" y="${HEIGHT - 12}" font-size="11" fill="#5b6b70" font-family="sans-serif">${escapeXml('약도 — 예시 공장, 실제 배치와 다름')}</text>
</svg>`;
  return svgDataUrl(svg);
}

const document: CanvasView = {
  kind: 'canvas',
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes: [...LINES.flatMap(line => line.machines.map((m, i) => machine(line, m, i))), ...LINES.flatMap(lineFigures), ...SIDE],
  connectors: [],
  decorations: DECORATIONS,
};

export const factoryFloor: SamplePack = {
  id: 'factory-floor',
  title: { ko: '공장 설비 상태판', en: 'Plant floor' },
  field: { ko: '제조·설비보전', en: 'Manufacturing & maintenance' },
  kind: { ko: '공장 배치도', en: 'Plant layout' },
  domain: 'manufacturing',
  styles: ['operations'],
  summary: {
    ko: '세 라인의 설비마다 가동 상태와 미결 작업을 설비가 선 자리에, 라인마다 OEE와 생산 실적을, 오른쪽은 공장 전체 가동률과 시간대별 생산량. 예시 데이터입니다.',
    en: 'Each machine’s state and open work orders where it stands on three lines, each line’s OEE and output beside it, and the plant’s availability and hourly output on the side. Example data.',
  },
  connectors: [PLANT],
  document,
  snapshot,
};
