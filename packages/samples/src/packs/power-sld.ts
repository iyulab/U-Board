import type { Binding, CanvasView, ElementDefinition, Node, Shape } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { escapeXml, svgDataUrl } from '../frame.js';
import { snapshot } from '../snapshots/power-sld.js';

// A plant's power distribution as a single-line diagram: the utility supply through the main breaker and the main
// transformer to the low-voltage bus, and six feeders off the bus, each with its breaker and its load. Each feeder's
// breaker state and power on its feeder; the incoming power, power factor and transformer load at the top; today's
// demand against the contract below. Grey for what is normal; a tripped breaker is the one thing in colour. No
// public source carries a plant's switchgear, so the values are example data written for the board.

const WIDTH = 1280;
const HEIGHT = 780;

export const EMS: ExampleSampleConnector = {
  key: 'ems',
  name: '예시 전력 감시 API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 수배전반이 아닙니다' },
};

/** Power meters report every few seconds; a minute without one is a meter that has dropped off its gateway. */
const MAX_AGE_SECONDS = 60;

const bind = (path: string, valuePath: string): Binding => ({
  adapter: EMS.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
});

const bindFeeder = (id: string, field: string, map?: Binding['map']): Binding => ({
  adapter: EMS.key,
  ref: { path: '/ems/feeders', item: { list: '/value', where: { id } }, valuePath: `/${field}`, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
  ...(map ? { map } : {}),
});

/** A breaker's state in words: closed and opened on purpose are normal (grey), a trip is not. */
const BREAKER_TEXT = { values: { closed: '투입', open: '개방', tripped: '트립' }, otherwise: '알 수 없음' };
/** A source state the symbol does not know is drawn as unknown — a dashed outline — rather than as a closed breaker. */
const BREAKER_STATE = { values: { closed: 'closed', open: 'open', tripped: 'tripped' }, otherwise: 'unknown' };

/** The breaker symbol the drawing leaves to the board, so its state shows on it: closed filled, open hollow, tripped
 *  hollow and crossed in the alarm colour, unknown dashed — told apart by shape first, colour only for the trip
 *  (ISA-101), as in the rest of the drawing. */
const breakerSymbol: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      state: { enum: ['closed', 'open', 'tripped', 'unknown'], default: 'unknown' },
      text: { type: 'string', description: 'The state in words.' },
    },
  },
  template: `<div class="breaker {{state}}" role="img" aria-label="{{name}} 차단기 {{text}}">
  <svg viewBox="0 0 24 24" aria-hidden="true"><rect class="box" x="2" y="2" width="20" height="20"/><path class="cross" d="M6 6 L18 18 M18 6 L6 18"/></svg>
  <span><b>{{name}}</b> {{text}}</span>
</div>`,
  style: `.breaker{display:flex;align-items:center;gap:8px;height:100%;font:12px var(--u-widget-font-family);color:var(--u-widget-text-secondary)}
svg{width:22px;height:22px;flex:none}
.box{fill:var(--u-widget-surface);stroke:#5f6a70;stroke-width:2}
.cross{display:none;stroke:var(--u-widget-negative);stroke-width:2.5}
b{color:var(--u-widget-text);font-weight:600}
.closed .box{fill:#4a555b}
.unknown .box{stroke-dasharray:3 2}
.tripped .box{stroke:var(--u-widget-negative)}
.tripped .cross{display:inline}
.tripped span{color:var(--u-widget-negative);font-weight:600}`,
  size: { width: 150, height: 26 },
};

const BUS_Y = 360;
const FEEDER_XS = [160, 340, 520, 700, 880, 1060];
const FEEDERS = [
  { id: 'F1', load: '생산동 A' },
  { id: 'F2', load: '생산동 B' },
  { id: 'F3', load: '공조' },
  { id: 'F4', load: '컴프레서' },
  { id: 'F5', load: '조명·사무' },
  { id: 'F6', load: '냉각탑' },
];
const MAIN_X = 640;
const TILE = { width: 160, height: 64 };

const feederNodes = ({ id }: (typeof FEEDERS)[number], i: number): Node[] => [
  {
    // The symbol sits on the feeder line where the drawing leaves room for it.
    id: `breaker-${id}`,
    x: FEEDER_XS[i] - 12,
    y: 391,
    width: 150,
    height: 26,
    anchored: true,
    widget: {
      type: 'element:breaker',
      props: { name: id, state: 'unknown', text: '' },
      bindings: { state: bindFeeder(id, 'breaker', BREAKER_STATE), text: bindFeeder(id, 'breaker', BREAKER_TEXT) },
    },
  },
  {
    id: `power-${id}`,
    x: FEEDER_XS[i] - TILE.width / 2,
    y: 506,
    ...TILE,
    anchored: true,
    widget: { type: 'metric', props: { data: { label: '전력', value: 0, unit: 'kW' } }, bindings: { 'data.value': bindFeeder(id, 'kw') } },
  },
];

const metric = (id: string, x: number, y: number, label: string, unit: string, valuePath: string): Node => ({
  id,
  x,
  y,
  width: 170,
  height: 66,
  anchored: false,
  widget: { type: 'metric', props: { data: { label, value: 0, unit } }, bindings: { 'data.value': bind('/ems/incoming', valuePath) } },
});

const NODES: Node[] = [
  { ...metric('incoming', MAIN_X + 50, 96, '수전 전력', 'kW', '/kw'), anchored: true },
  { ...metric('power-factor', MAIN_X - 220, 96, '역률', '', '/pf'), anchored: true },
  {
    id: 'transformer-load',
    x: MAIN_X + 50,
    y: 176,
    width: 170,
    height: 120,
    anchored: true,
    widget: {
      type: 'gauge',
      props: {
        data: { value: 0, max: 100 },
        // Grey while the transformer is within its rating; colour only near and past it.
        options: { unit: '%', subtitle: '변압기 부하율', thresholds: [{ to: 80, color: '#6b7680' }, { to: 90, color: 'orange' }, { to: 100, color: 'red' }] },
      },
      bindings: { 'data.value': bind('/ems/incoming', '/transformerLoad') },
    },
  },
  ...FEEDERS.flatMap(feederNodes),
  {
    id: 'demand',
    x: 40,
    y: 644,
    width: 720,
    height: 126,
    anchored: false,
    widget: {
      type: 'chart.line',
      props: {
        title: '수요 전력 (kW, 오늘)',
        data: [],
        mapping: { x: 't', y: 'kw' },
        options: {
          xFormat: { type: 'time' },
          valueAxisZero: false,
          series: [{ label: '수요 전력', symbol: 'none', color: '#4a555b' }],
          // The contract the demand is held under — above today's data, so the axis reaches up to show it.
          referenceLines: [{ axis: 'y', value: 1500, label: '계약 전력 1,500 kW', style: 'dashed', color: '#5b666c' }],
        },
      },
      bindings: { data: bind('/ems/demand', '/value') },
    },
  },
  metric('peak', 800, 646, '오늘 최대 수요', 'kW', '/peakKw'),
  metric('contract', 990, 646, '계약 전력 대비 최대', '%', '/peakOfContract'),
];

const DECORATIONS: Shape[] = [
  { id: 'title', type: 'text', x: 24, y: 20, text: '수배전 단선결선도', fontSize: 24, fill: '#1f2a30' },
  { id: 'note', type: 'text', x: 24, y: 54, text: '수전 → 주차단기 → 주변압기 → 저압 모선 → 피더 6 · 차단기 트립만 색 · 예시 데이터', fontSize: 13, fill: '#5b666c' },
];

/** The single-line diagram in greys: the supply, breakers as squares, the transformer as two circles, the bus as a
 *  heavy line, each feeder down to its load's name. */
function drawing(): string {
  const stroke = '#5f6a70';
  const line = (d: string, width = 3) => `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${width}"/>`;
  const text = (x: number, y: number, t: string, anchor = 'middle', size = 13) =>
    `<text x="${x}" y="${y}" font-size="${size}" fill="#4a555b" text-anchor="${anchor}" font-family="sans-serif">${escapeXml(t)}</text>`;
  const breaker = (x: number, y: number, name: string) =>
    `<rect x="${x - 11}" y="${y - 11}" width="22" height="22" fill="#f1f3f4" stroke="${stroke}" stroke-width="2"/>${text(x + 18, y + 5, name, 'start', 11)}`;
  // Each feeder's breaker is the board's own symbol (the breaker element), drawn over the line with its state.
  const feeders = FEEDER_XS.map((x, i) => `${line(`M ${x} ${BUS_Y} V 498`)}${line(`M ${x} 576 V 600`)}
<path d="M ${x - 8} 596 L ${x} 610 L ${x + 8} 596" fill="none" stroke="${stroke}" stroke-width="2"/>${text(x, 626, FEEDERS[i].load)}`).join('\n');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<rect width="${WIDTH}" height="${HEIGHT}" fill="#e6e9eb"/>
${text(MAIN_X, 88, '한전 수전 22.9 kV')}
${line(`M ${MAIN_X} 96 V 128`)}
${breaker(MAIN_X, 140, '52M')}
${line(`M ${MAIN_X} 152 V 186`)}
<circle cx="${MAIN_X}" cy="206" r="22" fill="none" stroke="${stroke}" stroke-width="2"/>
<circle cx="${MAIN_X}" cy="238" r="22" fill="none" stroke="${stroke}" stroke-width="2"/>
${text(MAIN_X - 34, 226, 'TR-1  1,600 kVA', 'end', 12)}
${text(MAIN_X - 34, 242, '22.9 kV / 380 V', 'end', 11)}
${line(`M ${MAIN_X} 260 V 300`)}
${breaker(MAIN_X, 312, 'ACB-M')}
${line(`M ${MAIN_X} 324 V ${BUS_Y}`)}
${line(`M ${FEEDER_XS[0] - 40} ${BUS_Y} H ${FEEDER_XS[FEEDER_XS.length - 1] + 40}`, 7)}
${text(FEEDER_XS[FEEDER_XS.length - 1] + 48, BUS_Y + 5, '380 V 모선', 'start', 12)}
${feeders}
<text x="${WIDTH - 24}" y="${HEIGHT - 10}" font-size="11" fill="#5b666c" text-anchor="end" font-family="sans-serif">${escapeXml('단선결선도 — 예시 수배전반, 실제 설비와 다름')}</text>
</svg>`;
  return svgDataUrl(svg);
}

const document: CanvasView = {
  kind: 'canvas',
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes: NODES,
  connectors: [],
  decorations: DECORATIONS,
  elements: { breaker: breakerSymbol },
};

export const powerSld: SamplePack = {
  id: 'power-sld',
  title: { ko: '수배전 단선결선도', en: 'Power distribution single-line diagram' },
  field: { ko: '에너지·전력', en: 'Energy & power' },
  kind: { ko: '단선결선도', en: 'Single-line diagram' },
  domain: 'energy',
  styles: ['drawing'],
  summary: {
    ko: '수전부터 주변압기, 저압 모선, 피더 여섯까지 단선결선도 위에 차단기 상태와 피더 전력을, 위에는 수전 전력·역률·변압기 부하율을, 아래에는 오늘의 수요 전력과 계약 전력 대비 최대 수요를. 트립한 차단기만 색으로 드러납니다. 예시 데이터입니다.',
    en: 'Each feeder’s breaker state and power on the single-line diagram from the utility supply through the main transformer and the low-voltage bus to six feeders, the incoming power, power factor and transformer load above, and today’s demand and its peak against the contract below. Only the tripped breaker takes colour. Example data.',
  },
  connectors: [EMS],
  document,
  snapshot,
};
