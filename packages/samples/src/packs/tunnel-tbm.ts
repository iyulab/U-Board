import type { Binding, CanvasView, Connector, ElementDefinition, Node, Widget } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { svgDataUrl } from '../frame.js';
import { snapshot } from '../snapshots/tunnel-tbm.js';

// A subway extension's tunnel boring machine on the site office's wall, drawn as the long section an engineer reads:
// the ground in its layers, the buildings and the stream on top, the tunnel already lined behind the machine and the
// dashed line still to bore ahead of it, the shafts it started from and will break through into. Over the ground the
// surface settlement points, each a mark on the surface with its reading in a card above; under the section the rings
// built so far, the rings a day, the machine's own readings and the air in the tunnel. Amber on black, one colour,
// the way an old monochrome terminal drew — a reading past its limit is the only thing shown in reverse. No public
// source carries a TBM's data this way, so the values are example data written for the board.

export const TBM: ExampleSampleConnector = {
  key: 'tbm',
  name: '예시 TBM 굴진 관리 API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 공사 현장이 아닙니다' },
};

/** The machine's PLC and the settlement loggers report every minute; ten minutes without one is a source that has stopped. */
const MAX_AGE_SECONDS = 10 * 60;

const bind = (path: string, valuePath: string): Binding => ({
  adapter: TBM.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
});

const bindPoint = (id: string, field: string, map?: Binding['map']): Binding => ({
  adapter: TBM.key,
  ref: { path: '/tbm/settlement', item: { list: '/value', where: { id } }, valuePath: `/${field}`, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
  ...(map ? { map } : {}),
});

/** Surface settlement against the site's two management levels: the first asks for closer watching, the second
 *  for action at the face. */
const SETTLEMENT_BAND = { ranges: [{ min: 12, value: 'alarm' }, { min: 8, value: 'watch' }], otherwise: 'ok' };

const WIDTH = 1600;
const HEIGHT = 900;
const BLACK = '#0b0803';
const AMBER = '#ffb000';
const DIM = '#a87400';
const FAINT = '#4a3300';
const MONO = 'ui-monospace, "Cascadia Mono", Consolas, monospace';
const FONT = 'var(--u-widget-font-family)';

// ── The section ─────────────────────────────────────────────────────────────────────────────────────────────────

/** The bored length, from the launch shaft to the arrival shaft, and one ring of lining. */
const LENGTH_M = 2150;
const RING_M = 1.5;
/** The ring the machine is building now — where the drawing puts its face. */
const FACE_RING = 984;

const SEC = { x0: 80, x1: 1520, surface: 214, bottom: 540, axis: 420, bore: 22 };
const at = (chainage: number) => SEC.x0 + (chainage / LENGTH_M) * (SEC.x1 - SEC.x0);
const FACE_X = at(FACE_RING * RING_M);
const RIVER = { from: 1600, to: 1800 };

/** A layer boundary wandering a little across the section, the same every time it is drawn. */
function boundary(y: number, swing: number, phase: number): string {
  const points: string[] = [];
  for (let x = 60, i = 0; x <= 1540; x += 74, i++) points.push(`${x} ${(y + Math.sin(i * 0.9 + phase) * swing).toFixed(1)}`);
  return points.join(' L ');
}

function drawing(): string {
  const text = (x: number, y: number, body: string, size = 13, fill = DIM, anchor = 'start') =>
    `<text x="${x}" y="${y}" font-family='${MONO}' font-size="${size}" fill="${fill}" text-anchor="${anchor}" letter-spacing="1">${body}</text>`;
  const layers = [
    { name: '매립토', y: 236, swing: 3, phase: 0 },
    { name: '풍화토', y: 292, swing: 10, phase: 1.7 },
    { name: '풍화암', y: 352, swing: 14, phase: 3.1 },
  ];
  const buildings = [
    [130, 60, 46], [214, 40, 74], [300, 84, 30], [430, 54, 96], [520, 38, 58], [600, 72, 40], [700, 50, 66],
    [880, 44, 34], [960, 60, 52], [1340, 52, 62], [1420, 70, 38],
  ]
    .map(([x, w, h]) => `<rect x="${x}" y="${SEC.surface - h}" width="${w}" height="${h}" fill="none" stroke="${FAINT}" stroke-width="1.2"/>`)
    .join('');
  const rx0 = at(RIVER.from);
  const rx1 = at(RIVER.to);
  const river = `<path d="M ${rx0} ${SEC.surface} L ${rx0 + 10} ${SEC.surface + 20} L ${rx1 - 10} ${SEC.surface + 20} L ${rx1} ${SEC.surface} Z" fill="#1c1400" stroke="${DIM}" stroke-width="1"/>
${[0, 1, 2].map(i => `<path d="M ${rx0 + 16} ${SEC.surface + 5 + i * 5} q 8 -3 16 0 t 16 0 t 16 0 t 16 0 t 16 0 t 16 0 t 16 0" fill="none" stroke="${DIM}" stroke-width="1"/>`).join('')}
${text((rx0 + rx1) / 2, SEC.surface - 8, '하천 하부 통과 구간', 12, DIM, 'middle')}`;
  const shaft = (x: number, w: number, label: string) =>
    `<rect x="${x - w / 2}" y="${SEC.surface}" width="${w}" height="${SEC.axis + 40 - SEC.surface}" fill="${BLACK}" stroke="${AMBER}" stroke-width="1.5"/>${text(x, SEC.axis + 64, label, 12, DIM, 'middle')}`;
  const ticks: string[] = [];
  for (let ring = 100; ring * RING_M < LENGTH_M; ring += 100) {
    const x = at(ring * RING_M);
    const built = ring <= FACE_RING;
    ticks.push(`<path d="M ${x} ${SEC.axis - SEC.bore} L ${x} ${SEC.axis + SEC.bore}" stroke="${built ? DIM : FAINT}" stroke-width="1"/>`);
    if (ring % 200 === 0) ticks.push(text(x, SEC.axis - SEC.bore - 6, `R${ring}`, 10, built ? DIM : FAINT, 'middle'));
  }
  const chainage: string[] = [`<path d="M ${SEC.x0} 556 L ${SEC.x1} 556" stroke="${DIM}" stroke-width="1"/>`];
  for (let m = 0; m <= LENGTH_M; m += 250) {
    const x = at(m);
    chainage.push(`<path d="M ${x} 552 L ${x} 560" stroke="${DIM}" stroke-width="1"/>`, text(x, 576, `${Math.floor(m / 1000)}+${String(m % 1000).padStart(3, '0')}`, 11, DIM, 'middle'));
  }
  const shield = `<rect x="${FACE_X - 40}" y="${SEC.axis - SEC.bore - 4}" width="40" height="${SEC.bore * 2 + 8}" fill="#3a2800" stroke="${AMBER}" stroke-width="2"/>
<path d="M ${FACE_X + 3} ${SEC.axis - SEC.bore - 4} L ${FACE_X + 3} ${SEC.axis + SEC.bore + 4}" stroke="${AMBER}" stroke-width="3"/>
${[0, 1, 2, 3, 4].map(i => `<rect x="${FACE_X - 136 + i * 19}" y="${SEC.axis - 13}" width="15" height="26" fill="none" stroke="${DIM}" stroke-width="1"/>`).join('')}
${text(FACE_X - 20, SEC.axis + SEC.bore + 22, 'TBM-1', 12, AMBER, 'middle')}`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<defs>
<pattern id="hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M 0 0 L 0 10" stroke="${FAINT}" stroke-width="1"/></pattern>
<pattern id="dots" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="${FAINT}"/></pattern>
<pattern id="scan" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill="#ffb000" opacity=".035"/></pattern>
</defs>
<rect width="${WIDTH}" height="${HEIGHT}" fill="${BLACK}"/>
<rect x="60" y="${SEC.surface}" width="1480" height="${SEC.bottom - SEC.surface}" fill="url(#dots)"/>
<path d="M 60 ${SEC.bottom} L 60 ${layers[2]!.y} L ${boundary(layers[2]!.y, layers[2]!.swing, layers[2]!.phase)} L 1540 ${SEC.bottom} Z" fill="url(#hatch)"/>
${layers.map(l => `<path d="M ${boundary(l.y, l.swing, l.phase)}" fill="none" stroke="${DIM}" stroke-width="1" stroke-dasharray="6 4"/>`).join('')}
${text(110, 230, '매립토', 11)}${text(110, 272, '풍화토', 11)}${text(110, 334, '풍화암', 11)}${text(110, 520, '연암', 11)}
<path d="M 60 ${SEC.surface} L 1540 ${SEC.surface}" stroke="${AMBER}" stroke-width="1.5"/>
${buildings}
${river}
<rect x="${SEC.x0}" y="${SEC.axis - SEC.bore}" width="${FACE_X - 40 - SEC.x0}" height="${SEC.bore * 2}" fill="#1a1200" stroke="${AMBER}" stroke-width="1.5"/>
<rect x="${FACE_X + 4}" y="${SEC.axis - SEC.bore}" width="${SEC.x1 - FACE_X - 4}" height="${SEC.bore * 2}" fill="none" stroke="${DIM}" stroke-width="1.2" stroke-dasharray="8 6"/>
${ticks.join('')}
${shaft(SEC.x0, 40, '발진 수직구')}${shaft(at(1050), 28, '환기구')}${shaft(SEC.x1, 40, '도달 수직구')}
${shield}
${chainage.join('')}
${text(1540, 598, '종단면 · 수직 축척 5배 과장 · 거리 m', 11, DIM, 'end')}
<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#scan)"/>
</svg>`;
  return svgDataUrl(svg);
}

// ── Elements ────────────────────────────────────────────────────────────────────────────────────────────────────

/** A panel with the bracketed corners of the terminal's frames — shared by every element below. */
const BOX = `.box{position:relative;height:100%;box-sizing:border-box;border:1px solid ${FAINT};background:rgba(255,176,0,.03);color:${AMBER};font-family:${FONT}}
.box::before,.box::after{content:'';position:absolute;width:12px;height:12px;border:2px solid ${AMBER}}
.box::before{top:-1px;left:-1px;border-right:0;border-bottom:0}
.box::after{bottom:-1px;right:-1px;border-left:0;border-top:0}
h2{margin:0;font:600 13px/1 ${FONT};letter-spacing:.12em;color:${DIM}}
p{margin:0}`;

/** The project, the machine, the hour and the shift, as the screen's head. */
const head: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['project', 'time'],
    properties: { project: { type: 'string' }, machine: { type: 'string' }, shift: { type: 'string' }, time: { type: 'string' }, state: { type: 'string' } },
  },
  template: `<header class="box hd"><h1>{{project}}</h1><span>{{machine}}</span><span class="st">● {{state}}</span><span>{{shift}}</span><time>{{time}}</time></header>`,
  style: `${BOX}
.hd{display:flex;align-items:center;gap:28px;padding:0 22px}
h1{margin:0;font-size:22px;font-weight:700;letter-spacing:.06em;text-shadow:0 0 8px rgba(255,176,0,.45)}
span{font-size:14px;color:${DIM};letter-spacing:.06em}
.st{color:${AMBER}}
time{margin-left:auto;font:700 26px ${MONO};letter-spacing:.06em;font-variant-numeric:tabular-nums;text-shadow:0 0 8px rgba(255,176,0,.45)}`,
  size: { width: 1480, height: 56 },
};

/** The latest events, newest first; one past a management level is shown in reverse. */
const events: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: {
      items: { type: 'array', items: { type: 'object', properties: { time: { type: 'string' }, text: { type: 'string' }, level: { enum: ['alarm', 'watch', 'info'] } } } },
    },
  },
  template: `<section class="box ev"><h2>EVENTS · 최근 기록</h2><ol>{{#items}}<li class="{{level}}"><time>{{time}}</time><span>{{text}}</span></li>{{/items}}</ol></section>`,
  style: `${BOX}
.ev{display:grid;grid-template-rows:auto 1fr;gap:8px;padding:12px 16px}
ol{margin:0;padding:0;list-style:none;display:grid;align-content:start;gap:4px}
li{display:flex;gap:14px;padding:2px 6px;font-size:14px;line-height:1.35;white-space:nowrap;overflow:hidden}
li span{overflow:hidden;text-overflow:ellipsis}
time{font:13px ${MONO};color:${DIM};font-variant-numeric:tabular-nums}
.watch{outline:1px solid ${AMBER}}
.alarm{background:${AMBER};color:${BLACK};font-weight:700}
.alarm time{color:${BLACK}}`,
  size: { width: 680, height: 108 },
};

/** A settlement point's mark on the surface: a small square, filled when past the second level. */
const mark: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['band'], properties: { band: { enum: ['ok', 'watch', 'alarm'] }, name: { type: 'string' } } },
  template: '<span class="mk {{band}}" role="img" aria-label="{{name}}"></span>',
  style: `:host{display:grid;place-items:center}
.mk{box-sizing:border-box;width:12px;height:12px;border:2px solid ${AMBER};background:${BLACK}}
.watch{outline:2px solid ${AMBER};outline-offset:2px}
.alarm{background:${AMBER};box-shadow:0 0 10px ${AMBER}}`,
  size: { width: 16, height: 16 },
};

/** A settlement point's reading, in a card above the ground. */
const point: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['name', 'mm', 'band'],
    properties: { name: { type: 'string' }, mm: { type: 'number' }, band: { enum: ['ok', 'watch', 'alarm'] } },
  },
  template: `<section class="box pt {{band}}"><h2>{{name}}</h2><p><b>{{mm | fixed:1}}</b> mm</p></section>`,
  style: `${BOX}
.pt{display:grid;align-content:center;gap:4px;padding:6px 10px;font:12px ${MONO};white-space:nowrap}
.pt b{font-size:20px;font-variant-numeric:tabular-nums}
.watch{border-color:${AMBER}}
.alarm{background:${AMBER};color:${BLACK}}
.alarm h2{color:${BLACK}}`,
  size: { width: 92, height: 62 },
};

/** The machine's face, marked on the section where its readings point to. */
const face: ElementDefinition = {
  render: 'template',
  props: { type: 'object', properties: {} },
  template: '<span class="fc" role="img" aria-label="TBM 막장"></span>',
  style: `:host{display:grid;place-items:center}
.fc{width:10px;height:10px;border-radius:50%;background:${AMBER};box-shadow:0 0 0 4px rgba(255,176,0,.25)}`,
  size: { width: 14, height: 14 },
};

/** The rings built against the whole bore, the day's rings, and what lies ahead. */
const progress: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['ring', 'total', 'pct'],
    properties: {
      ring: { type: 'number' },
      total: { type: 'number' },
      pct: { type: 'number' },
      today: { type: 'number' },
      perDay: { type: 'number' },
      toRiver: { type: 'number' },
      breakthrough: { type: 'string' },
    },
  },
  template: `<section class="box pg"><h2>PROGRESS · 굴진 진척</h2><p class="big"><b>{{ring}}</b><span>/ {{total}} 링</span></p><div class="bar" style="--p: {{pct}}"><i></i><em>{{pct | fixed:1}}%</em></div>
<dl><div><dt>오늘</dt><dd>{{today}} 링</dd></div><div><dt>일 평균</dt><dd>{{perDay | fixed:1}} 링</dd></div><div><dt>하천 하부까지</dt><dd>{{toRiver}} m</dd></div><div><dt>관통 예정</dt><dd>{{breakthrough}}</dd></div></dl></section>`,
  style: `${BOX}
.pg{display:grid;align-content:start;gap:10px;padding:14px 18px}
.big{display:flex;align-items:baseline;gap:10px}
.big b{font:700 52px/1 ${MONO};letter-spacing:-.02em;font-variant-numeric:tabular-nums;text-shadow:0 0 10px rgba(255,176,0,.45)}
.big span{font-size:16px;color:${DIM}}
.bar{position:relative;height:16px;border:1px solid ${DIM}}
.bar i{position:absolute;inset:2px auto 2px 2px;width:calc((100% - 4px) * var(--p) / 100);background:repeating-linear-gradient(90deg,${AMBER} 0 6px,transparent 6px 8px)}
.bar em{position:absolute;right:6px;top:-1px;font:700 12px/16px ${MONO};font-style:normal;color:${AMBER};background:${BLACK};padding:0 4px}
dl{margin:0;display:grid;grid-template-columns:1fr 1fr;gap:6px 16px}
dt{font-size:12px;color:${DIM}}
dd{margin:0;font-size:15px;font-variant-numeric:tabular-nums}`,
  size: { width: 360, height: 268 },
};

/** The machine's readings, each a value and a bar against its range; one off its target is outlined. */
const machine: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: {
      title: { type: 'string' },
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: { label: { type: 'string' }, value: { type: 'string' }, unit: { type: 'string' }, pct: { type: 'number' }, state: { enum: ['ok', 'watch', 'alarm'] } },
        },
      },
    },
  },
  template: `<section class="box mc"><h2>{{title}}</h2><ul>{{#items}}<li class="{{state}}"><span>{{label}}</span><b>{{value}}</b><small>{{unit}}</small><i style="--p: {{pct}}"></i></li>{{/items}}</ul></section>`,
  style: `${BOX}
.mc{display:grid;grid-template-rows:auto 1fr;gap:8px;padding:14px 16px}
ul{margin:0;padding:0;list-style:none;display:grid;align-content:space-between}
li{display:grid;grid-template-columns:1fr auto 52px;align-items:baseline;column-gap:8px;padding:2px 6px}
li span{font-size:13px;color:${DIM}}
li b{font:700 17px ${MONO};font-variant-numeric:tabular-nums}
li small{font:11px ${MONO};color:${DIM}}
li i{grid-column:1 / -1;height:3px;margin-top:3px;background:linear-gradient(90deg,${AMBER} calc(var(--p) * 1%),${FAINT} 0)}
.watch{outline:1px solid ${AMBER}}
.alarm{background:${AMBER};color:${BLACK}}
.alarm span,.alarm small{color:${BLACK}}`,
  size: { width: 360, height: 268 },
};

/** The air at the face, one reading to a cell. */
const air: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: {
      items: {
        type: 'array',
        items: { type: 'object', properties: { label: { type: 'string' }, value: { type: 'string' }, unit: { type: 'string' }, state: { enum: ['ok', 'watch', 'alarm'] } } },
      },
    },
  },
  template: `<section class="box ar"><h2>AIR · 갱내 환경</h2><ul>{{#items}}<li class="{{state}}"><span>{{label}}</span><b>{{value}}</b><small>{{unit}}</small></li>{{/items}}</ul></section>`,
  style: `${BOX}
.ar{display:grid;grid-template-rows:auto 1fr;gap:10px;padding:14px 16px}
ul{margin:0;padding:0;list-style:none;display:grid;grid-template-columns:1fr 1fr;grid-auto-rows:1fr;gap:6px}
li{display:grid;align-content:center;gap:2px;padding:4px 8px;border:1px solid ${FAINT}}
li span{font-size:12px;color:${DIM}}
li b{font:700 20px ${MONO};font-variant-numeric:tabular-nums}
li small{font:11px ${MONO};color:${DIM}}
.watch{border-color:${AMBER}}
.alarm{background:${AMBER};color:${BLACK}}
.alarm span,.alarm small{color:${BLACK}}`,
  size: { width: 280, height: 268 },
};

// ── The board ───────────────────────────────────────────────────────────────────────────────────────────────────

const node = (id: string, x: number, y: number, width: number, height: number, widget: Widget): Node => ({ id, x, y, width, height, anchored: false, widget });

interface Point {
  id: string;
  /** Where along the bore it stands, in metres from the launch shaft. */
  chainage: number;
  /** Its card's left edge in the row above the ground. */
  card: number;
}

const POINTS: Point[] = [
  { id: 'SP-01', chainage: 1150, card: 760 },
  { id: 'SP-02', chainage: 1280, card: 862 },
  { id: 'SP-03', chainage: 1380, card: 964 },
  { id: 'SP-04', chainage: 1460, card: 1066 },
  { id: 'SP-05', chainage: 1560, card: 1168 },
  { id: 'SP-06', chainage: 1700, card: 1270 },
];
const CARD_Y = 100;

const pointNodes = ({ id, chainage, card }: Point): Node[] => [
  {
    id: `mark-${id}`,
    x: at(chainage) - 8,
    y: SEC.surface - 8,
    anchored: true,
    widget: { type: 'element:mark', props: { band: 'ok', name: id }, bindings: { band: bindPoint(id, 'mm', SETTLEMENT_BAND) } },
  },
  node(`card-${id}`, card, CARD_Y, 92, 62, {
    type: 'element:point',
    props: { name: id, mm: 0, band: 'ok' },
    bindings: { mm: bindPoint(id, 'mm'), band: bindPoint(id, 'mm', SETTLEMENT_BAND) },
  }),
];

const leader = (id: string, from: string, to: string): Connector => ({ id, fromNodeId: from, toNodeId: to, style: { stroke: DIM, strokeWidth: 1 } });

const LOWER = { y: 612, height: 268 };

const nodes: Node[] = [
  node('head', 60, 18, 1480, 56, {
    type: 'element:head',
    props: { project: '', machine: '', shift: '', time: '', state: '' },
    bindings: {
      project: bind('/tbm/now', '/project'),
      machine: bind('/tbm/now', '/machine'),
      shift: bind('/tbm/now', '/shift'),
      time: bind('/tbm/now', '/time'),
      state: bind('/tbm/now', '/state'),
    },
  }),
  node('events', 60, 92, 680, 108, { type: 'element:events', props: { items: [] }, bindings: { items: bind('/tbm/events', '/value') } }),
  ...POINTS.flatMap(pointNodes),
  { id: 'face', x: FACE_X - 7, y: SEC.axis - 7, anchored: true, widget: { type: 'element:face', props: {} } },
  node('progress', 60, LOWER.y, 360, LOWER.height, {
    type: 'element:progress',
    props: { ring: 0, total: 0, pct: 0, today: 0, perDay: 0, toRiver: 0, breakthrough: '' },
    bindings: {
      ring: bind('/tbm/progress', '/ring'),
      total: bind('/tbm/progress', '/total'),
      pct: bind('/tbm/progress', '/pct'),
      today: bind('/tbm/progress', '/today'),
      perDay: bind('/tbm/progress', '/perDay'),
      toRiver: bind('/tbm/progress', '/toRiver'),
      breakthrough: bind('/tbm/progress', '/breakthrough'),
    },
  }),
  node('daily', 440, LOWER.y, 420, LOWER.height, {
    type: 'chart.bar',
    props: {
      title: '일 굴진(링) — 최근 7일',
      data: [],
      mapping: { x: 'day', y: 'rings' },
      options: { series: [{ label: '링', color: AMBER }] },
    },
    bindings: { data: bind('/tbm/daily', '/value') },
  }),
  node('machine', 880, LOWER.y, 360, LOWER.height, {
    type: 'element:machine',
    props: { title: '', items: [] },
    bindings: { title: bind('/tbm/machine', '/title'), items: bind('/tbm/machine', '/value') },
  }),
  node('air', 1260, LOWER.y, 280, LOWER.height, { type: 'element:air', props: { items: [] }, bindings: { items: bind('/tbm/air', '/value') } }),
];

const document: CanvasView = {
  kind: 'canvas',
  appearance: 'dark',
  accent: AMBER,
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes,
  connectors: [...POINTS.map(({ id }) => leader(`lead-${id}`, `mark-${id}`, `card-${id}`)), leader('lead-face', 'face', 'machine')],
  elements: { head, events, mark, point, face, progress, machine, air },
};

export const tunnelTbm: SamplePack = {
  id: 'tunnel-tbm',
  title: { ko: '지하철 터널 굴진 — 앰버 단색 터미널', en: 'A subway tunnel’s boring — an amber monochrome terminal' },
  field: { ko: '건설·토목', en: 'Construction & civil works' },
  kind: { ko: '종단면도(지층·터널)', en: 'A long section (the ground and the tunnel)' },
  summary: {
    ko: '지하철 연장 공사의 TBM 굴진을 현장 사무실 벽면에 — 지층과 건물·하천이 그려진 종단면 위에 이미 라이닝을 친 구간과 앞으로 팔 점선, 발진·도달 수직구와 환기구, 지표 침하 측정점마다 지시선과 값 카드. 아래로 굴진 링 진척, 일 굴진, TBM 기계 값(토크·추력·막장압·속도·방향 편차), 갱내 공기. 검은 바탕에 앰버 한 색, 관리 기준을 넘은 값만 반전. 예시 데이터입니다.',
    en: 'A subway extension’s tunnel boring machine on the site office wall — the long section with its ground layers, the buildings and the stream above, the lined tunnel behind the machine and the dashed bore ahead, the shafts, and each surface settlement point with a leader to its reading. Under it the rings built, the rings a day, the machine’s torque, thrust, face pressure, speed and steering, and the air at the face. Amber on black in one colour; only a reading past its limit is shown in reverse. Example data.',
  },
  connectors: [TBM],
  document,
  snapshot,
};
