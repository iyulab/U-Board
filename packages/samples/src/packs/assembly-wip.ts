import type { Binding, CanvasView, Connector, ElementDefinition, Node, Shape } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/assembly-wip.js';

// An assembly line read through the buffers between its stations: each station's state and cycle time against the
// takt, and on the line from one station to the next how many bodies wait in that buffer out of what it holds. A
// full buffer blocks the station before it, an empty one starves the station after it — those two are the only
// lines in colour, and the station holding the line back is marked as its bottleneck. The line's output against
// plan above, every buffer against its size below. No public source carries a line's buffers, so the values are
// example data written for the board.

export const MES: ExampleSampleConnector = {
  key: 'mes',
  name: '예시 MES API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 라인이 아닙니다' },
};

/** The line reports every takt; five minutes without a report is a source that has stopped. */
const MAX_AGE_SECONDS = 5 * 60;

const bindPath = (path: string, valuePath: string, map?: Binding['map']): Binding => ({
  adapter: MES.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
  ...(map ? { map } : {}),
});

const bindItem = (path: string, id: string, field: string, map?: Binding['map']): Binding => ({
  adapter: MES.key,
  ref: { path, item: { list: '/value', where: { id } }, valuePath: `/${field}`, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
  ...(map ? { map } : {}),
});

const STATE_TEXT = { values: { running: '가동', blocked: '막힘 — 다음 버퍼 가득', starved: '대기 — 앞 버퍼 빔', stopped: '정지' }, otherwise: '알 수 없음' };

/** The takt the line is planned at, seconds. */
const TAKT = 60;

/** A station: its name, its state with a mark, its cycle time against the takt, and a «병목» tag on the one holding
 *  the line back. Grey while it runs; amber when blocked or starved, red when stopped. */
const station: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['name', 'state', 'stateText', 'cycleTime'],
    properties: {
      name: { type: 'string' },
      state: { enum: ['running', 'blocked', 'starved', 'stopped', 'unknown'], default: 'unknown' },
      stateText: { type: 'string' },
      cycleTime: { type: 'number', minimum: 0, description: 'The last cycle, seconds.' },
      bottleneck: { type: 'boolean', default: false },
    },
  },
  template: `<div class="st {{state}}" role="img" aria-label="{{name}} {{stateText}}, 사이클 {{cycleTime}}초{{#bottleneck}}, 병목{{/bottleneck}}">
  <b>{{name}}</b>{{#bottleneck}}<span class="tag">병목</span>{{/bottleneck}}
  <span class="state"><i></i>{{stateText}}</span>
  <span class="ct">{{cycleTime | fixed:0}}<small> 초 / 택트 ${TAKT}</small></span>
</div>`,
  style: `.st{box-sizing:border-box;height:100%;display:grid;grid-template-columns:1fr auto;grid-template-rows:auto 1fr auto;row-gap:4px;padding:10px 14px;
border:1px solid var(--u-widget-border);border-top:4px solid var(--c);border-radius:8px;background:var(--u-widget-surface);
font-family:var(--u-widget-font-family);color:var(--u-widget-text);--c:#8a96a0}
b{font-size:15px;font-weight:600}
.tag{align-self:start;font-size:11px;font-weight:700;padding:1px 7px;border-radius:9px;border:1.5px solid var(--u-widget-text);color:var(--u-widget-text)}
.state{grid-column:1/3;display:flex;align-items:center;gap:6px;font-size:12px;color:var(--u-widget-text-secondary)}
i{width:9px;height:9px;border-radius:50%;background:var(--c);flex:none}
.ct{grid-column:1/3;font-size:22px;font-weight:600;font-variant-numeric:tabular-nums}
.ct small{font-size:12px;font-weight:500;color:var(--u-widget-text-secondary)}
.blocked,.starved{--c:var(--u-widget-warning)}
.blocked .state,.starved .state{color:var(--u-widget-text);font-weight:600}
.stopped{--c:var(--u-widget-negative)}
.stopped .state{color:var(--u-widget-negative);font-weight:600}`,
  size: { width: 220, height: 112 },
};

/** The stations in the order bodies flow, laid out in two rows that turn at the end of the first. */
const STATIONS = [
  { id: 'body-in', x: 60, y: 196 },
  { id: 'welding', x: 520, y: 196 },
  { id: 'paint', x: 980, y: 196 },
  { id: 'trim-1', x: 980, y: 430 },
  { id: 'trim-2', x: 520, y: 430 },
  { id: 'final', x: 60, y: 430 },
];

const stationNode = ({ id, x, y }: (typeof STATIONS)[number]): Node => ({
  id,
  x,
  y,
  width: 220,
  height: 112,
  anchored: false,
  widget: {
    type: 'element:station',
    props: { name: id, state: 'unknown', stateText: '—', cycleTime: 0, bottleneck: false },
    bindings: {
      name: bindItem('/line/stations', id, 'name'),
      state: bindItem('/line/stations', id, 'state'),
      stateText: bindItem('/line/stations', id, 'state', STATE_TEXT),
      cycleTime: bindItem('/line/stations', id, 'cycleTime'),
      bottleneck: bindItem('/line/stations', id, 'bottleneck'),
    },
  },
});

/** A buffer's colour: grey while it holds some, amber when full (it blocks the station before it) or empty (it
 *  starves the one after). */
const BUFFER_COLOUR = { values: { full: 'warning', empty: 'warning' }, otherwise: '#8a96a0' };
/** A buffer's line grows with what waits in it. */
const BUFFER_WIDTH = { ranges: [{ min: 6, value: 6 }, { min: 3, value: 4 }, { min: 1, value: 2.5 }], otherwise: 1.5 };

/** The buffer between two stations — the stations' ids joined — and how many bodies it holds. */
const buffer = (from: string, to: string, capacity: number): Connector => {
  const id = `${from}--${to}`;
  return {
    id,
    fromNodeId: from,
    toNodeId: to,
    label: `{{value}} / ${capacity}대`,
    style: { stroke: '#8a96a0', strokeWidth: 2, arrow: 'end' },
    bindings: {
      label: bindItem('/line/buffers', id, 'wip'),
      'style.stroke': bindItem('/line/buffers', id, 'state', BUFFER_COLOUR),
      'style.strokeWidth': bindItem('/line/buffers', id, 'wip', BUFFER_WIDTH),
    },
  };
};

const CONNECTORS: Connector[] = [
  buffer('body-in', 'welding', 8),
  buffer('welding', 'paint', 8),
  buffer('paint', 'trim-1', 10),
  buffer('trim-1', 'trim-2', 6),
  buffer('trim-2', 'final', 6),
];

const figure = (id: string, i: number, widget: Node['widget']): Node => ({ id, x: 40 + i * 244, y: 78, width: 220, height: 66, anchored: false, widget });
const metric = (label: string, valuePath: string, unit: string): Node['widget'] => ({
  type: 'metric',
  props: { data: { value: 0, label, unit } },
  bindings: { 'data.value': bindPath('/line/summary', valuePath) },
});

const NODES: Node[] = [
  figure('uph', 0, metric('시간당 생산 (목표 60)', '/unitsPerHour', '대')),
  figure('today', 1, metric('오늘 생산 (계획 480)', '/unitsToday', '대')),
  figure('wip', 2, metric('라인 재공', '/wip', '대')),
  figure('bottleneck', 3, { type: 'metric', props: { data: { value: '—', label: '병목 공정' } }, bindings: { 'data.value': bindPath('/line/summary', '/bottleneckName') } }),
  figure('lost', 4, metric('막힘·대기 손실 (오늘)', '/lostMinutes', '분')),
  ...STATIONS.map(stationNode),
  {
    id: 'buffers',
    x: 40,
    y: 600,
    width: 1180,
    height: 170,
    anchored: false,
    widget: {
      type: 'chart.bar',
      props: {
        title: '버퍼별 재공 — 지금과 크기 (대)',
        data: [],
        mapping: { x: 'name', y: ['wip', 'capacity'] },
        options: { series: [{ label: '재공', color: '#4a555b' }, { label: '버퍼 크기', type: 'line', lineStyle: 'dashed', symbol: 'none', color: '#8a96a0' }] },
      },
      bindings: { data: bindPath('/line/buffers', '/value') },
    },
  },
];

const DECORATIONS: Shape[] = [
  { id: 'title', type: 'text', x: 40, y: 20, text: '조립 라인 흐름과 재공', fontSize: 24, fill: '#1f2a30' },
  { id: 'note', type: 'text', x: 40, y: 52, text: `공정 사이 선 = 버퍼, 라벨은 기다리는 차체 수 · 가득 차거나 빈 버퍼만 색 · 택트 ${TAKT}초 · 예시 데이터`, fontSize: 13, fill: '#5b666c' },
];

const document: CanvasView = {
  kind: 'canvas',
  background: {},
  nodes: NODES,
  connectors: CONNECTORS,
  decorations: DECORATIONS,
  elements: { station },
};

export const assemblyWip: SamplePack = {
  id: 'assembly-wip',
  title: { ko: '조립 라인 흐름과 재공', en: 'Assembly line flow and WIP' },
  field: { ko: '제조·생산', en: 'Manufacturing & production' },
  kind: { ko: '없음 — 흐름도', en: 'None — flow diagram' },
  summary: {
    ko: '차체가 흐르는 순서대로 놓은 공정마다 상태와 택트 대비 사이클 시간을, 공정 사이 선에는 그 버퍼에서 기다리는 차체 수를 라벨로·굵기로. 가득 차 앞 공정을 막거나 비어 뒤 공정을 굶기는 버퍼만 색으로, 라인을 잡고 있는 공정에는 «병목». 위에는 생산 실적, 아래에는 버퍼별 재공. 예시 데이터입니다.',
    en: 'Each station’s state and cycle time against the takt, in the order bodies flow, and on the line between two stations how many bodies wait in that buffer — as its label and its width. Only a buffer that is full (blocking the station before it) or empty (starving the one after) takes colour, and the station holding the line back is marked as its bottleneck. Output against plan above, every buffer against its size below. Example data.',
  },
  connectors: [MES],
  document,
  snapshot,
};
