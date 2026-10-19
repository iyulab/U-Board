import type { Binding, CanvasView, ComponentDefinition, ElementDefinition, Node } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/line-flow.js';

// A line's stations in the order work flows through them, each a card with its state and its cycle time against
// target, the line's figures above and every station's cycle time against target below. The card is drawn once, as a component that takes a station's id; each
// station is an instance of it that reads its own row of the source — a line with more stations adds instances,
// not cards. No public source carries a line's stations, so the values are example data written for the board.

export const MES: ExampleSampleConnector = {
  key: 'mes',
  name: '예시 MES API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 라인이 아닙니다' },
};

/** The MES reports every minute; five minutes without a report is a source that has stopped. */
const MAX_AGE_SECONDS = 5 * 60;

const bindLine = (valuePath: string, map?: Binding['map']): Binding => ({
  adapter: MES.key,
  ref: { path: '/line/summary', valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
  ...(map ? { map } : {}),
});

/** One field of the station the instance is given — `{{station}}` is its id. */
const bindStation = (field: string, map?: Binding['map']): Binding => ({
  adapter: MES.key,
  ref: { path: '/line/stations', item: { list: '/value', where: { id: '{{station}}' } }, valuePath: `/${field}`, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
  ...(map ? { map } : {}),
});

const STATE_TEXT = { values: { running: '가동', delayed: '지연', stopped: '정지' }, otherwise: '알 수 없음' };

const stationCard: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['name', 'state', 'stateText', 'cycleTime', 'target'],
    properties: { name: { type: 'string' }, state: { type: 'string' }, stateText: { type: 'string' }, cycleTime: { type: 'number' }, target: { type: 'number' } },
  },
  size: { width: 200, height: 112 },
  template:
    '<div class="card" data-state="{{state}}"><span class="name">{{name}}</span><span class="state"><span class="dot"></span>{{stateText}}</span>' +
    '<span class="ct">{{cycleTime}}<small> 초</small></span><span class="target">목표 {{target}}초</span></div>',
  style:
    ':host{display:flex} .card{width:100%;height:100%;box-sizing:border-box;border:1px solid var(--u-widget-border);border-radius:10px;' +
    'background:var(--u-widget-surface);padding:10px 14px;font-family:var(--u-widget-font-family);display:grid;grid-template-columns:1fr auto;' +
    'grid-template-rows:auto 1fr auto;row-gap:4px;color:var(--u-widget-text)} ' +
    '.name{grid-column:1/3;font-size:13px;font-weight:600} ' +
    '.state{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600;align-self:center} ' +
    '.dot{width:9px;height:9px;border-radius:50%;background:var(--u-widget-text-secondary);flex:none} ' +
    '.ct{grid-row:2/4;grid-column:2;align-self:end;font-size:22px;font-weight:600;font-variant-numeric:tabular-nums} ' +
    '.ct small{font-size:12px;font-weight:500;color:var(--u-widget-text-secondary)} ' +
    '.target{font-size:11px;color:var(--u-widget-text-secondary);align-self:end} ' +
    '[data-state="running"] .dot{background:var(--u-widget-positive)} [data-state="running"] .state{color:var(--u-widget-positive)} ' +
    '[data-state="delayed"] .dot{background:var(--u-widget-warning)} ' +
    '[data-state="stopped"] .dot{background:var(--u-widget-negative)} [data-state="stopped"] .state{color:var(--u-widget-negative)} ' +
    '[data-state="stopped"]{border-color:var(--u-widget-negative)}',
};

const station: ComponentDefinition = {
  params: { type: 'object', required: ['station'], properties: { station: { type: 'string' } } },
  nodes: [
    {
      id: 'card',
      x: 0,
      y: 0,
      widget: {
        type: 'element:station-card',
        props: { name: '{{station}}', state: '', stateText: '—', cycleTime: 0, target: 0 },
        bindings: {
          name: bindStation('name'),
          state: bindStation('state'),
          stateText: bindStation('state', STATE_TEXT),
          cycleTime: bindStation('cycleTime'),
          target: bindStation('targetCycleTime'),
        },
      },
    },
  ],
};

/** The stations in the order work flows through them. */
export const STATIONS = ['input', 'process-01', 'process-02', 'inspection', 'packaging'];

const COLUMN = 250;
const LEFT = 40;

const figure = (id: string, i: number, widget: Node['widget']): Node => ({ id, x: LEFT + i * COLUMN, y: 30, width: 200, height: 64, anchored: false, widget });
const metric = (label: string, valuePath: string, suffix: string): Node['widget'] => ({
  type: 'metric',
  props: { data: { value: 0, label, suffix } },
  bindings: { 'data.value': bindLine(valuePath) },
});

const nodes: Node[] = [
  figure('line-state', 0, {
    type: 'status',
    props: { data: { label: '라인 상태', value: '—', level: 'neutral' } },
    bindings: {
      'data.value': bindLine('/state', STATE_TEXT),
      'data.level': bindLine('/state', { values: { running: 'success', delayed: 'warning', stopped: 'error' }, otherwise: 'neutral' }),
    },
  }),
  figure('throughput', 1, metric('현재 생산량', '/throughput', ' 개/시')),
  figure('target', 2, metric('목표', '/target', ' 개/시')),
  figure('oee', 3, metric('OEE', '/oee', '%')),
  figure('downtime', 4, metric('비가동(오늘)', '/downtimeMinutes', '분')),
  {
    id: 'cycle-times',
    x: LEFT,
    y: 300,
    width: 4 * COLUMN + 200,
    height: 230,
    anchored: false,
    widget: {
      type: 'chart.bar',
      props: {
        title: '공정별 사이클 시간 — 실적과 목표 (초)',
        data: [],
        mapping: { x: 'name', y: ['cycleTime', 'targetCycleTime'] },
        options: { series: [{ label: '사이클 시간' }, { label: '목표', type: 'line', lineStyle: 'dashed', symbol: 'none' }] },
      },
      bindings: { data: { adapter: MES.key, ref: { path: '/line/stations', valuePath: '/value', observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS } } },
    },
  },
];

const document: CanvasView = {
  kind: 'canvas',
  background: {},
  nodes,
  connectors: STATIONS.slice(1).map((id, i) => ({
    id: `flow-${i + 1}`,
    fromNodeId: `${STATIONS[i]}/card`,
    toNodeId: `${id}/card`,
    style: { arrow: 'end', strokeWidth: 2 },
  })),
  elements: { 'station-card': stationCard },
  components: { station },
  instances: STATIONS.map((id, i) => ({ id, component: 'station', x: LEFT + i * COLUMN, y: 150, anchored: false, params: { station: id } })),
};

export const lineFlow: SamplePack = {
  id: 'line-flow',
  title: { ko: '생산 라인 공정 흐름', en: 'Production line flow' },
  field: { ko: '제조·생산', en: 'Manufacturing & production' },
  kind: { ko: '없음 — 흐름도', en: 'None — flow diagram' },
  summary: {
    ko: '작업이 흐르는 순서대로 놓은 공정 카드와 라인의 지표. 카드는 공정 id 하나를 받는 컴포넌트로 한 번만 그리고, 공정마다 그 인스턴스가 자기 행을 읽습니다 — 공정이 늘면 인스턴스만 더합니다. 예시 데이터입니다.',
    en: 'A line’s stations in the order work flows through them, with the line’s figures. The card is drawn once, as a component that takes a station’s id, and each station is an instance of it that reads its own row — more stations are more instances. Example data.',
  },
  connectors: [MES],
  document,
  snapshot,
};
