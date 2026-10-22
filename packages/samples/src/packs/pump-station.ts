import type { Binding, ElementDefinition, GridItem, GridView } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/pump-station.js';

// A pump station drawn with elements the board defines itself — the pump, valve and tank symbols no prepared widget
// has — beside a prepared chart. Each symbol is defined once and placed for every machine; the values reach it as
// props through bindings, as a widget's do. Normal states are drawn in quiet greys and only what needs attention in
// colour (ISA-101, as the water treatment sample): running and open are filled, stopped and closed are outlined in the
// same grey — told apart by shape, not by a colour too faint to see. No public source carries a station's machines:
// example data.

export const SCADA: ExampleSampleConnector = {
  key: 'scada',
  name: '예시 SCADA API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 펌프장이 아닙니다' },
};

/** The SCADA polls every half minute; three minutes without a reading is a source that has stopped. */
const MAX_AGE_SECONDS = 3 * 60;

const bindItem = (list: string, id: string, valuePath: string, map?: Binding['map']): Binding => ({
  adapter: SCADA.key,
  ref: { path: list, item: { list: '/value', where: { id } }, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
  ...(map ? { map } : {}),
});

const PUMP_LABEL = { values: { run: '운전', stop: '정지', fault: '고장', maint: '점검' }, otherwise: '알 수 없음' };
const VALVE_LABEL = { values: { open: '열림', closed: '닫힘', moving: '동작 중' }, otherwise: '알 수 없음' };

const pump: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['name', 'state'],
    properties: {
      name: { type: 'string' },
      state: { enum: ['run', 'stop', 'fault', 'maint'] },
      label: { type: 'string', description: 'The state in words.' },
      rpm: { type: 'number', minimum: 0 },
      flow: { type: 'number', minimum: 0, description: 'm³/h' },
    },
  },
  template: `<figure class="pump {{state}}">
  <svg viewBox="0 0 100 100" role="img" aria-label="{{name}} {{label}}">
    <path class="outlet" d="M50 16 H92 V32 H70"/>
    <circle class="casing" cx="50" cy="50" r="34"/>
    <g class="impeller">
      <ellipse cx="50" cy="35" rx="6" ry="14"/>
      <ellipse cx="50" cy="35" rx="6" ry="14" transform="rotate(120 50 50)"/>
      <ellipse cx="50" cy="35" rx="6" ry="14" transform="rotate(240 50 50)"/>
    </g>
    <circle class="hub" cx="50" cy="50" r="5"/>
  </svg>
  <figcaption><b>{{name}}</b> <span class="label">{{label}}</span>{{#rpm}}<span class="num">{{rpm}} rpm · {{flow}} m³/h</span>{{/rpm}}</figcaption>
</figure>`,
  style: `.pump{margin:0;height:100%;display:grid;grid-template-rows:1fr auto;place-items:center;gap:2px;--c:var(--u-widget-text-secondary)}
svg{height:100%;max-height:110px;overflow:visible}
.casing{fill:var(--u-widget-surface);stroke:var(--c);stroke-width:5}
.outlet{fill:none;stroke:var(--c);stroke-width:5;stroke-linejoin:round}
.impeller ellipse,.hub{fill:var(--c)}
.run .impeller{transform-origin:50px 50px;animation:spin 1.6s linear infinite}
.stop .casing{fill:none}
.stop .impeller ellipse{fill:none;stroke:var(--c);stroke-width:2.5}
.fault{--c:var(--u-widget-negative)}
.maint{--c:var(--u-widget-warning)}
figcaption{font-size:12px;line-height:1.4;text-align:center;color:var(--u-widget-text-secondary)}
figcaption b{color:var(--u-widget-text);font-size:13px}
.fault .label,.maint .label{color:var(--c);font-weight:600}
.num{display:block;font-variant-numeric:tabular-nums}
@keyframes spin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.run .impeller{animation:none}}`,
  size: { width: 150, height: 170 },
};

const valve: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['name', 'state', 'position'],
    properties: {
      name: { type: 'string' },
      state: { enum: ['open', 'closed', 'moving'] },
      label: { type: 'string' },
      position: { type: 'number', minimum: 0, maximum: 100, description: 'Percent open.' },
    },
  },
  template: `<figure class="valve {{state}}" style="--pos: {{position}}">
  <svg viewBox="0 0 100 56" role="img" aria-label="{{name}} {{label}} {{position}}%">
    <path class="pipe" d="M0 34 H100"/>
    <path class="body" d="M24 18 L50 34 L24 50 Z M76 18 L50 34 L76 50 Z"/>
    <path class="stem" d="M50 34 V10"/>
    <rect class="actuator" x="38" y="2" width="24" height="9" rx="2"/>
  </svg>
  <div class="bar" aria-hidden="true"><span></span></div>
  <figcaption><b>{{name}}</b> {{label}} · {{position}}%</figcaption>
</figure>`,
  style: `.valve{margin:0;height:100%;display:grid;grid-template-rows:1fr auto auto;place-items:center;gap:4px;--c:var(--u-widget-text-secondary)}
svg{width:100%;max-width:150px;height:100%}
.pipe{stroke:var(--u-widget-border);stroke-width:6}
.body{fill:var(--u-widget-surface);stroke:var(--c);stroke-width:3;stroke-linejoin:round}
.open .body{fill:var(--c)}
.stem{stroke:var(--c);stroke-width:3}
.actuator{fill:var(--c)}
.closed .body{fill:none}
.closed .actuator{fill:none;stroke:var(--c);stroke-width:2}
.moving{--c:var(--u-widget-warning)}
.bar{width:80%;height:6px;border-radius:3px;background:var(--u-widget-surface);overflow:hidden}
.bar span{display:block;height:100%;width:calc(var(--pos) * 1%);background:var(--c)}
figcaption{font-size:12px;color:var(--u-widget-text-secondary)}
figcaption b{color:var(--u-widget-text);font-size:13px}`,
  size: { width: 150, height: 130 },
};

const tank: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['name', 'level', 'high', 'low'],
    properties: {
      name: { type: 'string' },
      level: { type: 'number', minimum: 0, maximum: 100, description: 'Percent full.' },
      high: { type: 'number', description: 'High-level alarm, percent.' },
      low: { type: 'number', description: 'Low-level alarm, percent.' },
      alarm: { enum: ['high', 'low', 'normal'] },
      alarmText: { type: 'string' },
    },
  },
  template: `<figure class="tank {{alarm}}" style="--level: {{level}}; --high: {{high}}; --low: {{low}}">
  <div class="vessel" role="img" aria-label="{{name}} {{level}}%">
    <div class="fill"></div>
    <i class="mark high"></i><i class="mark low"></i>
    <span class="value">{{level}}%</span>
  </div>
  <figcaption><b>{{name}}</b>{{#alarmText}} <span class="alarm">{{alarmText}}</span>{{/alarmText}}</figcaption>
</figure>`,
  style: `.tank{margin:0;height:100%;display:grid;grid-template-rows:1fr auto;gap:4px;--c:var(--u-widget-text-secondary)}
.vessel{position:relative;border:2px solid var(--u-widget-border);border-top:none;border-radius:0 0 10px 10px;overflow:hidden;background:var(--u-widget-surface)}
.fill{position:absolute;inset:auto 0 0 0;height:calc(var(--level) * 1%);background:var(--c);opacity:.45}
.mark{position:absolute;left:0;right:0;border-top:2px dashed var(--u-widget-border)}
.mark.high{bottom:calc(var(--high) * 1%)}
.mark.low{bottom:calc(var(--low) * 1%)}
.value{position:absolute;inset:0;display:grid;place-items:center;font:600 20px var(--u-widget-font-family);color:var(--u-widget-text);font-variant-numeric:tabular-nums}
.high,.low{--c:var(--u-widget-negative)}
.tank.high .mark.high,.tank.low .mark.low{border-top-color:var(--u-widget-negative)}
figcaption{font-size:12px;text-align:center;color:var(--u-widget-text-secondary)}
figcaption b{color:var(--u-widget-text);font-size:13px}
.alarm{color:var(--u-widget-negative);font-weight:600}`,
  size: { width: 150, height: 200 },
};

const PUMPS = ['P-1', 'P-2', 'P-3', 'P-4'];
const VALVES = ['V-1', 'V-2', 'V-3'];
const TANKS = [
  { id: 'T-1', name: '배수지', high: 90, low: 20 },
  { id: 'T-2', name: '흡수정', high: 85, low: 25 },
];

const pumpItem = (id: string): GridItem => ({
  id: id.toLowerCase(),
  span: 3,
  spanMedium: 2,
  widget: {
    type: 'element:pump',
    props: { name: id, state: 'stop' },
    bindings: {
      state: bindItem('/station/pumps', id, '/state'),
      label: bindItem('/station/pumps', id, '/state', PUMP_LABEL),
      rpm: bindItem('/station/pumps', id, '/rpm'),
      flow: bindItem('/station/pumps', id, '/flow'),
    },
  },
});

const valveItem = (id: string): GridItem => ({
  id: id.toLowerCase(),
  span: 4,
  spanMedium: 2,
  widget: {
    type: 'element:valve',
    props: { name: id, state: 'closed', position: 0 },
    bindings: {
      state: bindItem('/station/valves', id, '/state'),
      label: bindItem('/station/valves', id, '/state', VALVE_LABEL),
      position: bindItem('/station/valves', id, '/position'),
    },
  },
});

const tankItem = ({ id, name, high, low }: (typeof TANKS)[number]): GridItem => ({
  id: id.toLowerCase(),
  span: 3,
  spanMedium: 3,
  widget: {
    type: 'element:tank',
    props: { name, level: 0, high, low },
    bindings: {
      level: bindItem('/station/tanks', id, '/level'),
      // One reading, read three ways: the level, whether it is past an alarm limit, and that in words.
      alarm: bindItem('/station/tanks', id, '/level', { ranges: [{ min: high, value: 'high' }, { max: low, value: 'low' }], otherwise: 'normal' }),
      alarmText: bindItem('/station/tanks', id, '/level', { ranges: [{ min: high, value: '고수위' }, { max: low, value: '저수위' }], otherwise: '' }),
    },
  },
});

const items: GridItem[] = [
  ...PUMPS.map(pumpItem),
  ...TANKS.map(tankItem),
  {
    id: 'flow',
    span: 6,
    widget: {
      type: 'chart.line',
      props: {
        title: '송수 유량 (m³/h)',
        data: [],
        mapping: { x: 'time', y: 'flow' },
        options: { xFormat: { type: 'time' }, valueAxisZero: false, series: [{ label: '유량' }] },
      },
      bindings: { data: { adapter: SCADA.key, ref: { path: '/station/flow', valuePath: '/value', observedAtPath: '/updatedAt', maxAgeSeconds: 90 * 60 } } },
    },
  },
  ...VALVES.map(valveItem),
];

const document: GridView = { kind: 'grid', items, elements: { pump, valve, tank } };

export const pumpStation: SamplePack = {
  id: 'pump-station',
  title: { ko: '펌프장 설비 — 보드가 그린 심볼', en: 'Pump station — symbols the board draws' },
  field: { ko: '상하수도', en: 'Water & wastewater' },
  kind: { ko: '없음 — 그리드 배치', en: 'None — grid layout' },
  domain: 'energy',
  styles: ['operations'],
  summary: {
    ko: '위젯에 없는 펌프·밸브·수조 심볼을 보드가 직접 정의해(HTML/SVG와 CSS, 스크립트 없음) 설비마다 놓은 보드 — 펌프는 운전 중에 돌고, 수조는 경보 한계를 넘으면 붉게 표시됩니다. 유량 추세는 준비된 차트입니다. 예시 데이터입니다.',
    en: 'Pump, valve and tank symbols no widget has, defined by the board itself (HTML/SVG and CSS, no script) and placed for every machine — a running pump turns, a tank past an alarm limit turns red. The flow trend is a prepared chart. Example data.',
  },
  connectors: [SCADA],
  document,
  snapshot,
};
