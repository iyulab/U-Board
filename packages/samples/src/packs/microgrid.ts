import type { Binding, CanvasView, Connector, ElementDefinition, Node, Shape } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/microgrid.js';

// A site's microgrid as its energy management system sees it: the solar array, the battery, the building and the car
// chargers it feeds, and the utility grid, all meeting at the switchboard. Each line carries the power flowing on it —
// its arrow points the way it flows (the battery charging or discharging, the grid importing or exporting), its width
// grows with the power, and a line with nothing on it is dashed. Beside it the day: how much of the site's use the sun
// covered, what came from and went to the grid, and the solar output against the load since morning. No public source
// carries a site's power flows, so the values are example data written for the board.

export const EMS: ExampleSampleConnector = {
  key: 'ems',
  name: '예시 EMS API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 사이트가 아닙니다' },
};

/** The power meters report every minute; five minutes without one is a source that has stopped. */
const MAX_AGE_SECONDS = 5 * 60;

const bindAsset = (id: string, field: string, map?: Binding['map']): Binding => ({
  adapter: EMS.key,
  ref: { path: '/site/assets', item: { list: '/value', where: { id } }, valuePath: `/${field}`, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
  ...(map ? { map } : {}),
});

const bindSite = (valuePath: string): Binding => ({
  adapter: EMS.key,
  ref: { path: '/site/summary', valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
});

const BOX = `box-sizing:border-box;height:100%;display:flex;flex-direction:column;justify-content:center;gap:3px;padding:10px 14px;
border:1px solid var(--u-widget-border);border-left:5px solid var(--c);border-radius:6px;background:var(--u-widget-surface);
font-family:var(--u-widget-font-family);color:var(--u-widget-text);--c:var(--u-widget-text-secondary)`;
const TEXT = `b{font-size:13px;font-weight:600;color:var(--u-widget-text-secondary)}
.kw{font-size:24px;font-weight:600;font-variant-numeric:tabular-nums}
.kw small{font-size:12px;font-weight:500;color:var(--u-widget-text-secondary)}
.n{font-size:12px;color:var(--u-widget-text-secondary)}`;

/** One place power comes from or goes to: its name, the power on its line, a few words on what it is doing. */
const asset: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['name', 'kw', 'note', 'tone'],
    properties: {
      name: { type: 'string' },
      kw: { type: 'number', minimum: 0, description: 'Power on its line, kW.' },
      note: { type: 'string' },
      tone: { enum: ['sun', 'grid', 'load', 'bus'] },
    },
  },
  template: `<div class="a {{tone}}" role="img" aria-label="{{name}} {{kw}} kW, {{note}}">
  <b>{{name}}</b>
  <span class="kw">{{kw | fixed:0}}<small> kW</small></span>
  <span class="n">{{note}}</span>
</div>`,
  style: `.a{${BOX}}
${TEXT}
.sun{--c:#d89a00}
.grid{--c:#6b7780}
.load{--c:#4a555b}
.bus{--c:var(--u-widget-text)}`,
  size: { width: 200, height: 100 },
};

/** The battery: the power going in or out, which way, and how full it is. */
const battery: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['name', 'kw', 'state', 'soc'],
    properties: {
      name: { type: 'string' },
      kw: { type: 'number', minimum: 0, description: 'Power in or out, kW.' },
      state: { type: 'string' },
      soc: { type: 'number', minimum: 0, maximum: 100, description: 'State of charge, %.' },
    },
  },
  template: `<div class="a" style="--soc: {{soc}}" role="img" aria-label="{{name}} {{state}} {{kw}} kW, {{soc}}%">
  <b>{{name}}</b>
  <span class="kw">{{kw | fixed:0}}<small> kW</small></span>
  <span class="n">{{state}} · 충전량 {{soc | fixed:0}}%</span>
  <span class="bar"><span></span></span>
</div>`,
  style: `.a{${BOX};--c:#3f7fbf}
${TEXT}
.bar{height:5px;border-radius:3px;background:var(--u-widget-border);overflow:hidden}
.bar span{display:block;height:100%;width:calc(var(--soc) * 1%);background:var(--c)}`,
  size: { width: 200, height: 108 },
};

type AssetSpot = { id: string; name: string; x: number; y: number; tone: 'sun' | 'grid' | 'load' | 'bus' };
const ASSETS: AssetSpot[] = [
  { id: 'pv', name: '태양광 (300 kWp)', x: 400, y: 120, tone: 'sun' },
  { id: 'grid', name: '한전 계통', x: 60, y: 384, tone: 'grid' },
  { id: 'switchboard', name: '수배전반', x: 400, y: 384, tone: 'bus' },
  { id: 'building', name: '건물 부하', x: 740, y: 290, tone: 'load' },
  { id: 'ev', name: '전기차 충전', x: 740, y: 478, tone: 'load' },
];

const assetNode = ({ id, name, x, y, tone }: AssetSpot): Node => ({
  id,
  x,
  y,
  width: 200,
  height: 100,
  anchored: false,
  widget: {
    type: 'element:asset',
    props: { name, kw: 0, note: '—', tone },
    bindings: { kw: bindAsset(id, 'kw'), note: bindAsset(id, 'note') },
  },
});

const ESS_STATE = { values: { forward: '충전 중', reverse: '방전 중' }, otherwise: '대기' };
const essNode: Node = {
  id: 'ess',
  x: 400,
  y: 640,
  width: 200,
  height: 108,
  anchored: false,
  widget: {
    type: 'element:battery',
    props: { name: 'ESS (500 kWh)', kw: 0, state: '대기', soc: 0 },
    bindings: { kw: bindAsset('ess', 'kw'), state: bindAsset('ess', 'dir', ESS_STATE), soc: bindAsset('ess', 'socPct') },
  },
};

/** Which way power flows on a line, as the meter reports it: `forward` from its first end to its second, `reverse`
 *  back, `idle` nothing. */
const ARROW = { values: { forward: 'end', reverse: 'start' }, otherwise: 'none' };
const DASH = { values: { idle: 'dashed' }, otherwise: 'solid' };
/** The more power, the wider the line. */
const WIDTH = { ranges: [{ min: 150, value: 7 }, { min: 60, value: 4.5 }, { min: 5, value: 2.5 }], otherwise: 1.5 };

/** A line from the switchboard's side — `forward` is the way the meter on `id` counts positive. */
const flow = (id: string, from: string, to: string, stroke: string, labelAt?: number): Connector => ({
  id: `flow-${id}`,
  fromNodeId: from,
  toNodeId: to,
  label: '{{value | fixed:0}} kW',
  ...(labelAt !== undefined && { labelAt }),
  style: { stroke, strokeWidth: 2.5, arrow: 'end', route: 'orthogonal' },
  bindings: {
    label: bindAsset(id, 'kw'),
    'style.arrow': bindAsset(id, 'dir', ARROW),
    'style.dash': bindAsset(id, 'dir', DASH),
    'style.strokeWidth': bindAsset(id, 'kw', WIDTH),
  },
});

const CONNECTORS: Connector[] = [
  flow('pv', 'pv', 'switchboard', '#d89a00'),
  flow('grid', 'grid', 'switchboard', '#6b7780'),
  flow('ess', 'switchboard', 'ess', '#3f7fbf'),
  flow('building', 'switchboard', 'building', '#4a555b'),
  flow('ev', 'switchboard', 'ev', '#4a555b'),
];

const SIDE_X = 1000;
const SIDE: Node[] = [
  {
    id: 'self-sufficiency',
    x: SIDE_X,
    y: 100,
    width: 250,
    height: 150,
    anchored: false,
    widget: {
      type: 'gauge',
      props: { data: { value: 0 }, options: { min: 0, max: 100, unit: '%', subtitle: '오늘 자립률', thresholds: [{ to: 40, color: 'red' }, { to: 70, color: 'yellow' }, { to: 100, color: 'green' }] } },
      bindings: { 'data.value': bindSite('/selfSufficiencyPct') },
    },
  },
  {
    id: 'pv-today',
    x: SIDE_X,
    y: 266,
    width: 250,
    height: 70,
    anchored: false,
    widget: { type: 'metric', props: { data: { label: '오늘 태양광 발전', value: 0, unit: 'kWh' } }, bindings: { 'data.value': bindSite('/pvKwhToday') } },
  },
  {
    id: 'import-today',
    x: SIDE_X,
    y: 350,
    width: 120,
    height: 70,
    anchored: false,
    widget: { type: 'metric', props: { data: { label: '계통에서', value: 0, unit: 'kWh' } }, bindings: { 'data.value': bindSite('/importKwhToday') } },
  },
  {
    id: 'export-today',
    x: SIDE_X + 130,
    y: 350,
    width: 120,
    height: 70,
    anchored: false,
    widget: { type: 'metric', props: { data: { label: '계통으로', value: 0, unit: 'kWh' } }, bindings: { 'data.value': bindSite('/exportKwhToday') } },
  },
  {
    id: 'history',
    x: SIDE_X,
    y: 436,
    width: 250,
    height: 250,
    anchored: false,
    widget: {
      type: 'chart.line',
      props: {
        title: '태양광과 부하 (kW)',
        data: [],
        mapping: { x: 'time', y: ['pvKw', 'loadKw'] },
        options: { xFormat: 'time', series: [{ label: '태양광', color: '#d89a00' }, { label: '부하', color: '#4a555b' }] },
      },
      bindings: { data: { adapter: EMS.key, ref: { path: '/site/history', valuePath: '/value', observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS } } },
    },
  },
];

const DECORATIONS: Shape[] = [
  { id: 'title', type: 'text', x: 24, y: 22, text: '마이크로그리드 에너지 흐름', fontSize: 24, fill: '#17252b' },
  { id: 'note', type: 'text', x: 24, y: 56, text: '선마다 지금 흐르는 전력 — 화살표는 흐르는 방향, 굵기는 크기, 점선은 멈춤 · 예시 데이터', fontSize: 13, fill: '#5b6b70' },
  { id: 'site', type: 'rect', x: 30, y: 92, width: 940, height: 680, stroke: '#9aa6ae', strokeWidth: 1.5, dash: 'dashed', label: '사이트', labelSize: 14, labelFill: '#3d4a52' },
  { id: 'side', type: 'rect', x: SIDE_X - 16, y: 72, width: 282, height: 632, stroke: '#d6dedb', strokeWidth: 1, label: '오늘', labelSize: 14, labelFill: '#3d4a52' },
];

const document: CanvasView = {
  kind: 'canvas',
  background: {},
  nodes: [...ASSETS.map(assetNode), essNode, ...SIDE],
  connectors: CONNECTORS,
  decorations: DECORATIONS,
  elements: { asset, battery },
};

export const microgrid: SamplePack = {
  id: 'microgrid',
  title: { ko: '마이크로그리드 에너지 흐름', en: 'Microgrid energy flow' },
  field: { ko: '건물·에너지', en: 'Buildings & energy' },
  kind: { ko: '없음 — 흐름도', en: 'None — flow diagram' },
  domain: 'energy',
  styles: ['operations'],
  summary: {
    ko: '태양광·ESS·건물 부하·전기차 충전·한전 계통이 수배전반에서 만나는 사이트에서, 선마다 지금 흐르는 전력을 화살표 방향(충전과 방전, 수전과 역송)·굵기·점선(멈춤)으로, 옆에는 오늘 자립률과 계통에서 받고 보낸 양, 아침부터의 태양광과 부하. 예시 데이터입니다.',
    en: 'Solar, a battery, the building, car chargers and the utility grid meeting at the switchboard, each line showing the power on it now — its arrow the way it flows (charging or discharging, importing or exporting), its width the amount, dashed when idle; beside it the day’s self-sufficiency, what came from and went to the grid, and solar output against the load since morning. Example data.',
  },
  connectors: [EMS],
  document,
  snapshot,
};
