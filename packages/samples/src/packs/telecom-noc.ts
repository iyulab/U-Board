import type { Binding, ElementDefinition, GridItem, GridView, Widget } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/telecom-noc.js';

// A carrier's network operations centre, the wall the night shift watches: dark and dense, as much as reads at a
// glance. Six figures with the last hours under each, every region against every service in one matrix of cells,
// the backbone links filling up, the last 24 hours of traffic over last week's, the alarms by region and severity, and the
// alarms still open. A grid only — no map: density is the point. No public source carries a network's state, so
// the values are example data written for the board.

export const NMS: ExampleSampleConnector = {
  key: 'nms',
  name: '예시 망 관리 시스템(NMS)',
  example: true,
  attribution: { text: '예시 데이터 — 실제 통신망이 아닙니다' },
};

/** The network reports every thirty seconds; five minutes without a report is a source that has stopped. */
const MAX_AGE_SECONDS = 5 * 60;

const bind = (path: string, valuePath: string, map?: Binding['map']): Binding => ({
  adapter: NMS.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
  ...(map ? { map } : {}),
});

/** A field of one item of a list, by its id. */
const bindItem = (path: string, id: string, field: string, map?: Binding['map']): Binding => ({
  adapter: NMS.key,
  ref: { path, item: { list: '/value', where: { id } }, valuePath: `/${field}`, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
  ...(map ? { map } : {}),
});

const MONO = "ui-monospace,'Cascadia Mono',Consolas,monospace";

// ── Elements ────────────────────────────────────────────────────────────────────────────────────────────────────

/** Every region against every service: a cell each, its colour the state and its number the availability. */
const matrix: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['services', 'regions'],
    properties: {
      services: { type: 'array', items: { type: 'string' } },
      regions: {
        type: 'array',
        items: {
          type: 'object',
          required: ['name', 'cells'],
          properties: {
            name: { type: 'string' },
            cells: {
              type: 'array',
              items: { type: 'object', properties: { state: { enum: ['ok', 'warn', 'down'] }, availability: { type: 'number' } } },
            },
          },
        },
      },
    },
  },
  template: `<section class="matrix">
  <header><b>권역 × 서비스</b><span class="key"><i class="ok"></i>정상<i class="warn"></i>저하<i class="down"></i>장애</span></header>
  <table>
    <thead><tr><th></th>{{#services}}<th>{{.}}</th>{{/services}}</tr></thead>
    <tbody>{{#regions}}<tr><th>{{name}}</th>{{#cells}}<td class="{{state}}">{{availability | fixed:2}}</td>{{/cells}}</tr>{{/regions}}</tbody>
  </table>
</section>`,
  style: `.matrix{container-type:inline-size;height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr;gap:8px;padding:12px 14px;border:1px solid var(--u-widget-border);border-radius:6px;background:var(--u-widget-bg);color:var(--u-widget-text);font-family:${MONO}}
header{display:flex;justify-content:space-between;align-items:center;font-size:13px}
.key{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--u-widget-text-secondary)}
.key i{width:9px;height:9px;border-radius:2px;margin-left:6px}
table{width:100%;height:100%;border-collapse:separate;border-spacing:3px;table-layout:fixed}
th{font-size:11px;font-weight:600;color:var(--u-widget-text-secondary);text-align:center;white-space:nowrap}
tbody th{text-align:left}
td{font-size:12px;text-align:center;border-radius:3px;white-space:nowrap;font-variant-numeric:tabular-nums}
.ok{background:#14532d;color:#bbf7d0}
.warn{background:#713f12;color:#fde68a}
.down{background:#7f1d1d;color:#fecaca;box-shadow:0 0 0 1px #ef4444 inset}
.key .ok{background:#22c55e}.key .warn{background:#eab308}.key .down{background:#ef4444}
/* On a phone the matrix is a few hundred px wide: the figures and the names shrink with it rather than wrap. */
@container (max-width: 420px){td{font-size:min(12px,3.1cqi)}th{font-size:min(11px,2.9cqi);overflow:hidden;text-overflow:ellipsis}tbody th{font-size:min(11px,3.6cqi)}table{border-spacing:2px}.key{display:none}}`,
  size: { width: 640, height: 330 },
};

/** The backbone links, each a bar filling with its load, red past eighty percent, and its round-trip time. */
const links: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: {
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: { name: { type: 'string' }, load: { type: 'number' }, rtt: { type: 'number' }, level: { enum: ['normal', 'high'] } },
        },
      },
    },
  },
  template: `<section class="links">
  <header><b>백본 회선 사용률</b><span>RTT</span></header>
  <ul>{{#items}}<li class="{{level}}" style="--u: {{load}}"><span class="name">{{name}}</span><span class="bar"><i></i></span><span class="pct">{{load}}%</span><span class="rtt">{{rtt | fixed:1}}ms</span></li>{{/items}}</ul>
</section>`,
  style: `.links{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr;gap:8px;padding:12px 14px;border:1px solid var(--u-widget-border);border-radius:6px;background:var(--u-widget-bg);color:var(--u-widget-text);font-family:${MONO}}
header{display:flex;justify-content:space-between;font-size:13px}
header span{font-size:11px;color:var(--u-widget-text-secondary)}
ul{margin:0;padding:0;list-style:none;display:grid;align-content:space-around;gap:6px}
li{display:grid;grid-template-columns:76px 1fr 34px 52px;align-items:center;gap:8px;font-size:12px;font-variant-numeric:tabular-nums}
.name{color:var(--u-widget-text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bar{height:8px;border-radius:2px;background:color-mix(in srgb,var(--u-widget-text) 10%,transparent);overflow:hidden}
.bar i{display:block;height:100%;width:calc(var(--u) * 1%);background:var(--u-widget-primary)}
.high .bar i{background:#ef4444}
.high .pct{color:#f87171}
.pct,.rtt{text-align:right}
.rtt{color:var(--u-widget-text-secondary)}`,
  size: { width: 400, height: 260 },
};

// ── The board ───────────────────────────────────────────────────────────────────────────────────────────────────

/** A figure with the last six hours under it, in the danger colour when it crosses its limit. The line says which way
 *  it is going — no up-or-down arrow, which reads as good for traffic and bad for alarms. */
const kpi = (id: string, label: string, unit: string, danger?: Binding['map']): GridItem => ({
  id,
  span: 2,
  spanMedium: 2,
  widget: {
    type: 'metric',
    props: { data: { value: 0, label, unit, sparkline: [] } },
    bindings: {
      'data.value': bindItem('/noc/kpis', id, 'value'),
      'data.sparkline': bindItem('/noc/kpis', id, 'last6h'),
      ...(danger && { 'data.variant': bindItem('/noc/kpis', id, 'value', danger) }),
    },
  },
});

const card = (id: string, span: number, spanMedium: number, widget: Widget, extra: Partial<Pick<GridItem, 'rowSpan' | 'height'>> = {}): GridItem => ({
  id,
  span,
  spanMedium,
  ...extra,
  widget,
});

const items: GridItem[] = [
  kpi('traffic', '전체 트래픽', 'Tbps'),
  kpi('sessions', '5G 동시 접속', '만'),
  kpi('callSuccess', '호 성공률', '%', { ranges: [{ max: 99.5, value: 'danger' }, { min: 99.5, value: 'success' }] }),
  kpi('latency', '평균 지연', 'ms', { ranges: [{ max: 15, value: 'success' }, { min: 15, value: 'danger' }] }),
  kpi('alarms', '활성 경보', '건', { ranges: [{ max: 30, value: 'neutral' }, { min: 30, value: 'warning' }] }),
  kpi('impacted', '장애 영향 가입자', '명', { ranges: [{ max: 1000, value: 'neutral' }, { min: 1000, value: 'danger' }] }),
  card(
    'matrix',
    7,
    6,
    {
      type: 'element:matrix',
      props: { services: [], regions: [] },
      bindings: { services: bind('/noc/matrix', '/services'), regions: bind('/noc/matrix', '/regions') },
    },
    { rowSpan: 2 }
  ),
  card('traffic-day', 5, 6, {
    type: 'chart.line',
    props: {
      title: '최근 24시간 트래픽(Tbps) — 지난주 같은 시간과',
      data: [],
      mapping: { x: 'time', y: ['today', 'lastWeek'] },
      options: { smooth: true, series: [{ label: '최근 24시간', symbol: 'none' }, { label: '지난주', color: '#64748b', lineStyle: 'dashed', symbol: 'none' }] },
    },
    bindings: { data: bind('/noc/traffic', '/value') },
  }, { height: 162 }),
  card('alarm-regions', 5, 6, {
    type: 'chart.bar',
    props: {
      title: '권역별 활성 경보 — 심각 · 주요 · 경미',
      data: [],
      mapping: { x: 'region', y: ['critical', 'major', 'minor'] },
      options: {
        stack: true,
        series: [{ label: '심각', color: '#ef4444' }, { label: '주요', color: '#f59e0b' }, { label: '경미', color: '#64748b' }],
        // Seven regions in a narrow card: every one named, not every other.
        echarts: { xAxis: { axisLabel: { interval: 0, fontSize: 10 } } },
      },
    },
    bindings: { data: bind('/noc/alarmsByRegion', '/value') },
  }, { height: 162 }),
  card(
    'alarm-list',
    8,
    6,
    {
      type: 'table',
      props: {
        title: '미해결 경보',
        data: [],
        mapping: {
          columns: [
            { field: 'time', label: '발생' },
            { field: 'severity', label: '등급' },
            { field: 'region', label: '권역' },
            { field: 'element', label: '장비' },
            { field: 'text', label: '내용' },
            { field: 'age', label: '경과' },
          ],
        },
      },
      bindings: { data: bind('/noc/alarms', '/value') },
    },
    { height: 270 }
  ),
  card(
    'links',
    4,
    6,
    {
      type: 'element:links',
      props: { items: [] },
      bindings: { items: bind('/noc/links', '/value') },
    },
    { height: 270 }
  ),
];

const document: GridView = {
  kind: 'grid',
  appearance: 'dark',
  accent: '#4ade80',
  elements: { matrix, links },
  items,
};

export const telecomNoc: SamplePack = {
  id: 'telecom-noc',
  title: { ko: '전국 통신망 관제 NOC', en: 'Nationwide network operations centre' },
  field: { ko: '통신·네트워크', en: 'Telecom & networks' },
  kind: { ko: '없음 — 그리드(밀집, 다크)', en: 'None — grid (dense, dark)' },
  summary: {
    ko: '야간 근무자가 보는 밀집 다크 상황판 — 지난 6시간 추이선이 붙은 여섯 지표, 권역 × 서비스 가용률 격자, 지난주와 견준 최근 24시간 트래픽, 권역별·등급별 경보, 미해결 경보 목록, 백본 회선 사용률과 지연. 지도 없이 밀도로 읽는 화면. 예시 데이터입니다.',
    en: 'A dense dark wall for the night shift — six figures with the last six hours under each, a matrix of every region against every service, the last 24 hours of traffic over last week’s, alarms by region and severity, the alarms still open, and the backbone links’ load and round-trip time. No map: it reads by density. Example data.',
  },
  connectors: [NMS],
  document,
  snapshot,
};
