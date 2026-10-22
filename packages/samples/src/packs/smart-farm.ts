import type { Binding, CanvasView, ElementDefinition, Node, Shape, Widget } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { svgDataUrl } from '../frame.js';
import { snapshot } from '../snapshots/smart-farm.js';

// A smart farm seen from above at an angle, as a model on a table: four glasshouses with their rows of crops showing
// through the glass, the seedling house, the nutrient room with its tanks, and the packing house with its cold store.
// A tag stands over each building, pinned to its roof — the temperature inside, a second figure, and what the house is
// doing now (vents open, misting, irrigating) — and on the side the weather outside that the vents answer to, the
// day's harvest, each glasshouse's temperature through the day against the heat alarm, and the water and power used.
// Flat isometric: the drawing is the building plan raised into blocks. No public source carries a farm's houses, so
// the values are example data written for the board.

export const FARM: ExampleSampleConnector = {
  key: 'farm',
  name: '예시 스마트팜 환경제어 API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 농장이 아닙니다' },
};

/** The controller reports every minute; ten minutes without a report is a controller that has stopped. */
const MAX_AGE_SECONDS = 10 * 60;

const bind = (path: string, valuePath: string): Binding => ({
  adapter: FARM.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
});

const bindHouse = (id: string, field: string): Binding => ({
  adapter: FARM.key,
  ref: { path: '/farm/houses', item: { list: '/value', where: { id } }, valuePath: `/${field}`, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
});

const WIDTH = 1280;
const HEIGHT = 680;
const GREEN = '#15803d';
const INK = '#1f2937';

// ── The isometric drawing ─────────────────────────────────────────────────────────────────────────────────────────

/** The site's grid: `gx` runs down to the right, `gy` down to the left, a unit is 40 × 20 on the board. */
const ORIGIN = { x: 380, y: 200 };
const UX = 20;
const UY = 10;
const SITE = { gx: 24, gy: 16 };

/** Where a point of the site, `z` above the ground, falls on the board. */
const iso = (gx: number, gy: number, z = 0) => ({ x: ORIGIN.x + (gx - gy) * UX, y: ORIGIN.y + (gx + gy) * UY - z });

const poly = (points: { x: number; y: number }[], attrs: string) =>
  `<polygon points="${points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}" ${attrs}/>`;

interface Footprint {
  gx0: number;
  gy0: number;
  gx1: number;
  gy1: number;
}

/** A block standing on its footprint: its top and the two faces turned to the viewer. */
function block({ gx0, gy0, gx1, gy1 }: Footprint, z: number, top: string, left: string, right: string, attrs = 'stroke="#64748b" stroke-width=".6" stroke-linejoin="round"'): string {
  return [
    poly([iso(gx0, gy1), iso(gx1, gy1), iso(gx1, gy1, z), iso(gx0, gy1, z)], `fill="${left}" ${attrs}`),
    poly([iso(gx1, gy0), iso(gx1, gy1), iso(gx1, gy1, z), iso(gx1, gy0, z)], `fill="${right}" ${attrs}`),
    poly([iso(gx0, gy0, z), iso(gx1, gy0, z), iso(gx1, gy1, z), iso(gx0, gy1, z)], `fill="${top}" ${attrs}`),
  ].join('');
}

/** A glasshouse: rows of crops on its floor, seen through glass walls and a gabled roof whose ridge runs along it. */
function glasshouse(f: Footprint, crop: string): string {
  const { gx0, gy0, gx1, gy1 } = f;
  const eave = 24;
  const ridge = 40;
  const mid = (gy0 + gy1) / 2;
  const glass = 'stroke="#475569" stroke-width=".7" stroke-linejoin="round"';
  const rows: string[] = [];
  for (let gy = gy0 + 0.5; gy < gy1; gy += 0.75) {
    const a = iso(gx0 + 0.4, gy, 4);
    const b = iso(gx1 - 0.4, gy, 4);
    rows.push(`<path d="M ${a.x} ${a.y} L ${b.x} ${b.y}" stroke="${crop}" stroke-width="5" stroke-linecap="round"/>`);
  }
  // The roof's far slope, then the crops, then the near walls and the near slope over them.
  const farSlope = poly([iso(gx0, gy0, eave), iso(gx1, gy0, eave), iso(gx1, mid, ridge), iso(gx0, mid, ridge)], `fill="#e0f2fe" fill-opacity=".7" ${glass}`);
  const floor = poly([iso(gx0, gy0), iso(gx1, gy0), iso(gx1, gy1), iso(gx0, gy1)], `fill="#d9e8cf" ${glass}`);
  const front = poly([iso(gx0, gy1), iso(gx1, gy1), iso(gx1, gy1, eave), iso(gx0, gy1, eave)], `fill="#bae6fd" fill-opacity=".45" ${glass}`);
  const gable = poly([iso(gx1, gy0), iso(gx1, gy1), iso(gx1, gy1, eave), iso(gx1, mid, ridge), iso(gx1, gy0, eave)], `fill="#93c5fd" fill-opacity=".5" ${glass}`);
  const nearSlope = poly([iso(gx0, gy1, eave), iso(gx1, gy1, eave), iso(gx1, mid, ridge), iso(gx0, mid, ridge)], `fill="#f0f9ff" fill-opacity=".55" ${glass}`);
  // The glazing bars across the near slope.
  const bars: string[] = [];
  for (let gx = gx0 + 1; gx < gx1; gx += 1) {
    const a = iso(gx, gy1, eave);
    const b = iso(gx, mid, ridge);
    bars.push(`<path d="M ${a.x} ${a.y} L ${b.x} ${b.y}" stroke="#94a3b8" stroke-width=".5"/>`);
  }
  return floor + farSlope + rows.join('') + front + gable + nearSlope + bars.join('');
}

/** A round tank: its wall, and its lid as an ellipse. */
function tank(gx: number, gy: number, height: number, fill: string): string {
  const base = iso(gx, gy);
  const rx = 18;
  const ry = 9;
  return `<path d="M ${base.x - rx} ${base.y} V ${base.y - height} A ${rx} ${ry} 0 0 0 ${base.x + rx} ${base.y - height} V ${base.y} A ${rx} ${ry} 0 0 1 ${base.x - rx} ${base.y} Z" fill="${fill}" stroke="#1e3a8a" stroke-width=".6"/>`
    + `<ellipse cx="${base.x}" cy="${base.y - height}" rx="${rx}" ry="${ry}" fill="#bfdbfe" stroke="#1e3a8a" stroke-width=".6"/>`;
}

/** A tree beside the paths: a shadow, a trunk and a round crown. */
function tree(gx: number, gy: number): string {
  const p = iso(gx, gy);
  return `<ellipse cx="${p.x + 4}" cy="${p.y}" rx="11" ry="5" fill="#000" fill-opacity=".12"/><path d="M ${p.x} ${p.y} V ${p.y - 10}" stroke="#78350f" stroke-width="2.5"/><circle cx="${p.x}" cy="${p.y - 18}" r="10" fill="#4ade80" stroke="#15803d" stroke-width=".8"/>`;
}

const HOUSES = {
  g1: { gx0: 1, gy0: 1, gx1: 11, gy1: 4 },
  g2: { gx0: 1, gy0: 5, gx1: 11, gy1: 8 },
  g3: { gx0: 13, gy0: 1, gx1: 23, gy1: 4 },
  g4: { gx0: 13, gy0: 5, gx1: 23, gy1: 8 },
  nursery: { gx0: 1, gy0: 10, gx1: 6, gy1: 14 },
  nutrient: { gx0: 8, gy0: 10, gx1: 12, gy1: 14 },
  packing: { gx0: 14, gy0: 10, gx1: 22, gy1: 14 },
} satisfies Record<string, Footprint>;

/** Where each tag's pin stands: the top of its building, in the middle. */
const centre = ({ gx0, gy0, gx1, gy1 }: Footprint, z: number) => iso((gx0 + gx1) / 2, (gy0 + gy1) / 2, z);
const PINS = {
  g1: centre(HOUSES.g1, 40),
  g2: centre(HOUSES.g2, 40),
  g3: centre(HOUSES.g3, 40),
  g4: centre(HOUSES.g4, 40),
  nursery: centre(HOUSES.nursery, 30),
  nutrient: centre(HOUSES.nutrient, 22),
  packing: centre(HOUSES.packing, 34),
};

const TAG = { width: 188, height: 82 };
/** Each tag's place, chosen clear of the buildings it is not about: the near houses' tags stand off to the side. */
const TAGS: Record<keyof typeof PINS, { x: number; y: number }> = {
  g1: { x: 364, y: 98 },
  g3: { x: 646, y: 168 },
  g2: { x: 56, y: 150 },
  g4: { x: 760, y: 292 },
  nursery: { x: 32, y: 420 },
  nutrient: { x: 214, y: 534 },
  packing: { x: 600, y: 560 },
};

function drawing(): string {
  const ground = poly([iso(0, 0), iso(SITE.gx, 0), iso(SITE.gx, SITE.gy), iso(0, SITE.gy)], 'fill="#e7efdc" stroke="#a3b18a" stroke-width="1"');
  // The paths between the houses: one along the site, one across it.
  const paths = [
    poly([iso(0, 4.3), iso(SITE.gx, 4.3), iso(SITE.gx, 4.7), iso(0, 4.7)], 'fill="#f5f0e6"'),
    poly([iso(0, 8.7), iso(SITE.gx, 8.7), iso(SITE.gx, 9.3), iso(0, 9.3)], 'fill="#f5f0e6"'),
    poly([iso(11.6, 0), iso(12.4, 0), iso(12.4, SITE.gy), iso(11.6, SITE.gy)], 'fill="#f5f0e6"'),
  ].join('');
  const leaders = (Object.keys(PINS) as (keyof typeof PINS)[]).map(key => {
    const pin = PINS[key];
    const tag = TAGS[key];
    const end = { x: Math.min(Math.max(pin.x, tag.x + 16), tag.x + TAG.width - 16), y: pin.y < tag.y ? tag.y : tag.y + TAG.height - 8 };
    return `<path d="M ${pin.x} ${pin.y} L ${end.x} ${end.y}" stroke="${INK}" stroke-width="1" stroke-dasharray="3 3" stroke-opacity=".55"/><circle cx="${pin.x}" cy="${pin.y}" r="4" fill="#fff" stroke="${INK}" stroke-width="1.5"/>`;
  }).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<rect width="${WIDTH}" height="${HEIGHT}" fill="#f6f8f3"/>
<rect x="930" y="0" width="${WIDTH - 930}" height="${HEIGHT}" fill="#eef2e8"/>
${ground}${paths}
${tree(0.6, 9)}${tree(23.4, 9)}${tree(7, 15.2)}${tree(13, 15.2)}
${glasshouse(HOUSES.g1, '#65a30d')}${glasshouse(HOUSES.g3, '#dc2626')}${glasshouse(HOUSES.g2, '#16a34a')}${glasshouse(HOUSES.g4, '#ca8a04')}
${glasshouse(HOUSES.nursery, '#86efac')}
${block(HOUSES.nutrient, 22, '#f8fafc', '#e2e8f0', '#cbd5e1')}${tank(9.4, 11.2, 22, '#60a5fa')}${tank(10.8, 12.2, 22, '#3b82f6')}
${block(HOUSES.packing, 34, '#f1f5f9', '#cbd5e1', '#94a3b8')}
${poly([iso(22, 11.2), iso(22, 12.8), iso(22, 12.8, 22), iso(22, 11.2, 22)], 'fill="#475569"')}
${leaders}
</svg>`;
  return svgDataUrl(svg);
}

// ── Elements ────────────────────────────────────────────────────────────────────────────────────────────────────

/** The board's title, what it shows, and when the controller last reported. */
const masthead: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['asOf'], properties: { asOf: { type: 'string' } } },
  template: `<header class="mast"><span class="kicker">스마트팜 단지 · {{asOf}} 기준</span><h1>햇살농원 온실 네 동과 부속동</h1><p>동마다 안의 온도와 지금 하는 일 — 환기창·차광·관수는 바깥 날씨를 따라 자동으로 움직입니다</p></header>`,
  style: `.mast{height:100%;box-sizing:border-box;display:grid;align-content:center;gap:4px;color:${INK};font-family:var(--u-widget-font-family)}
.kicker{font-size:13px;font-weight:700;letter-spacing:.06em;color:${GREEN}}
h1{margin:0;font-size:26px;line-height:1.15;letter-spacing:-.01em}
p{margin:0;font-size:13px;color:#4b5563}`,
  size: { width: 580, height: 74 },
};

/** A building's tag: its name and what grows there, the figure that matters inside, a second one, and what it does now. */
const tag: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['name', 'value', 'unit', 'level', 'note'],
    properties: {
      name: { type: 'string' },
      what: { type: 'string', description: 'What grows or is kept there.' },
      value: { type: 'number' },
      unit: { type: 'string' },
      label2: { type: 'string' },
      value2: { type: 'number' },
      unit2: { type: 'string' },
      level: { enum: ['ok', 'warn', 'alert'] },
      note: { type: 'string', description: 'What the house is doing now.' },
    },
  },
  template: `<div class="tag {{level}}">
  <header><b>{{name}}</b><span>{{what}}</span></header>
  <p><strong>{{value | fixed:1}}<small>{{unit}}</small></strong><em>{{label2}} {{value2 | fixed:0}}{{unit2}}</em></p>
  <footer><i></i>{{note}}</footer>
</div>`,
  style: `.tag{--c:#16a34a;height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr auto;gap:2px;padding:8px 12px 7px;border-radius:10px;background:#fff;border:1px solid #d1d5db;border-left:5px solid var(--c);box-shadow:0 4px 10px rgba(15,23,42,.10);color:${INK};font-family:var(--u-widget-font-family)}
.warn{--c:#d97706}.alert{--c:#dc2626}
header{display:flex;align-items:baseline;gap:6px;white-space:nowrap;overflow:hidden}
header b{font-size:14px}
header span{font-size:12px;color:#6b7280;overflow:hidden;text-overflow:ellipsis}
p{margin:0;display:flex;align-items:baseline;justify-content:space-between;gap:8px;white-space:nowrap}
strong{font-size:24px;line-height:1.1;font-variant-numeric:tabular-nums}
small{font-size:13px;font-weight:600;color:#4b5563;margin-left:1px}
em{font-style:normal;font-size:12px;color:#4b5563;font-variant-numeric:tabular-nums}
footer{display:flex;align-items:center;gap:5px;font-size:12px;font-weight:600;color:var(--c);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
footer i{flex:none;width:7px;height:7px;border-radius:50%;background:var(--c)}`,
  size: TAG,
};

/** The weather the vents and screens answer to: the air, the sun, the wind — and what the wind is doing to the vents. */
const weather: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['temp', 'solar', 'wind'],
    properties: { temp: { type: 'number' }, solar: { type: 'number', description: 'Sunlight, W/m².' }, wind: { type: 'number', description: 'Wind, m/s.' }, sky: { type: 'string' } },
  },
  template: `<section class="wx">
  <header>바깥 날씨 <span>{{sky}}</span></header>
  <dl>
    <div><dt>기온</dt><dd>{{temp | fixed:1}}<small>°C</small></dd></div>
    <div><dt>일사량</dt><dd>{{solar | grouped:0}}<small>W/㎡</small></dd></div>
    <div><dt>풍속</dt><dd>{{wind | fixed:1}}<small>m/s</small></dd></div>
  </dl>
  <p>풍속 8m/s를 넘으면 환기창이 닫히고, 일사량 700W/㎡를 넘으면 차광막이 펼쳐집니다</p>
</section>`,
  style: `.wx{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr auto;gap:6px;padding:12px 14px;border-radius:10px;background:#fff;border:1px solid #d1d5db;color:${INK};font-family:var(--u-widget-font-family)}
header{font-size:14px;font-weight:700}
header span{font-weight:400;color:#6b7280;margin-left:4px}
dl{margin:0;display:grid;grid-template-columns:repeat(3,1fr);gap:6px;align-items:center}
dl div{display:grid;gap:1px}
dt{font-size:11px;color:#6b7280}
dd{margin:0;font-size:20px;font-weight:700;font-variant-numeric:tabular-nums;white-space:nowrap}
dd small{font-size:11px;font-weight:600;color:#6b7280;margin-left:1px}
p{margin:0;font-size:11px;line-height:1.4;color:#6b7280}`,
  size: { width: 290, height: 140 },
};

// ── The board ───────────────────────────────────────────────────────────────────────────────────────────────────

const node = (id: string, x: number, y: number, width: number, height: number, widget: Widget, anchored = false): Node => ({ id, x, y, width, height, anchored, widget });

interface TagOf {
  id: keyof typeof PINS;
  name: string;
  what: string;
  unit: string;
  label2: string;
  unit2: string;
}

const TAG_OF: TagOf[] = [
  { id: 'g1', name: '1동', what: '방울토마토', unit: '°C', label2: '습도', unit2: '%' },
  { id: 'g2', name: '2동', what: '오이', unit: '°C', label2: '습도', unit2: '%' },
  { id: 'g3', name: '3동', what: '딸기', unit: '°C', label2: '습도', unit2: '%' },
  { id: 'g4', name: '4동', what: '파프리카', unit: '°C', label2: '습도', unit2: '%' },
  { id: 'nursery', name: '육묘장', what: '모종', unit: '°C', label2: '습도', unit2: '%' },
  { id: 'nutrient', name: '양액실', what: 'EC 농도', unit: 'dS/m', label2: '탱크', unit2: '%' },
  { id: 'packing', name: '선별장', what: '저온 저장고', unit: '°C', label2: '보관', unit2: '상자' },
];

const tagNode = ({ id, name, what, unit, label2, unit2 }: TagOf): Node =>
  node(
    `tag-${id}`,
    TAGS[id].x,
    TAGS[id].y,
    TAG.width,
    TAG.height,
    {
      type: 'element:tag',
      props: { name, what, value: 0, unit, label2, value2: 0, unit2, level: 'ok', note: '' },
      bindings: { value: bindHouse(id, 'value'), value2: bindHouse(id, 'value2'), level: bindHouse(id, 'level'), note: bindHouse(id, 'note') },
    },
    true
  );

const SIDE_X = 950;
const SIDE_WIDTH = 290;

const nodes: Node[] = [
  node('masthead', 40, 18, 580, 74, { type: 'element:masthead', props: { asOf: '' }, bindings: { asOf: bind('/farm/now', '/asOf') } }),
  ...TAG_OF.map(tagNode),
  node('weather', SIDE_X, 24, SIDE_WIDTH, 140, {
    type: 'element:weather',
    props: { temp: 0, solar: 0, wind: 0, sky: '' },
    bindings: { temp: bind('/farm/weather', '/temp'), solar: bind('/farm/weather', '/solar'), wind: bind('/farm/weather', '/wind'), sky: bind('/farm/weather', '/sky') },
  }),
  node('harvest', SIDE_X, 178, SIDE_WIDTH, 112, {
    type: 'metric',
    props: { data: { value: 0, label: '오늘 수확', unit: 'kg', sparkline: [] } },
    bindings: { 'data.value': bind('/farm/now', '/harvest'), 'data.sparkline': bind('/farm/now', '/harvestByHour') },
  }),
  node('temps', SIDE_X, 304, SIDE_WIDTH, 232, {
    type: 'chart.line',
    props: {
      title: '동별 온도 — 오늘 (°C)',
      data: [],
      mapping: { x: 'hour', y: ['g1', 'g2', 'g3', 'g4'] },
      options: {
        smooth: true,
        valueAxisZero: false,
        referenceLines: [{ axis: 'y', value: 30, label: '고온 경보', style: 'dashed' }],
        series: [
          { label: '1동', color: '#65a30d' },
          { label: '2동', color: '#0891b2' },
          { label: '3동', color: '#dc2626' },
          { label: '4동', color: '#ca8a04' },
        ],
      },
    },
    bindings: { data: bind('/farm/temps', '/value') },
  }),
  node('water', SIDE_X, 550, 140, 104, {
    type: 'metric',
    props: { data: { value: 0, label: '오늘 관수', unit: '㎥' } },
    bindings: { 'data.value': bind('/farm/now', '/water') },
  }),
  node('power', SIDE_X + 150, 550, 140, 104, {
    type: 'metric',
    props: { data: { value: 0, label: '오늘 전력', unit: 'kWh' } },
    bindings: { 'data.value': bind('/farm/now', '/power') },
  }),
];

const DECORATIONS: Shape[] = [
  { id: 'site-note', type: 'text', x: 40, y: 650, text: '단지 배치 · 태그는 각 동의 지붕에 핀으로 꽂혀 있습니다 · 예시 데이터', fontSize: 12, fill: '#6b7280' },
];

const document: CanvasView = {
  kind: 'canvas',
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  accent: GREEN,
  nodes,
  connectors: [],
  decorations: DECORATIONS,
  elements: { masthead, tag, weather },
};

export const smartFarm: SamplePack = {
  id: 'smart-farm',
  title: { ko: '스마트팜 단지 — 아이소메트릭', en: 'A smart farm — isometric' },
  field: { ko: '농업·스마트팜', en: 'Agriculture & smart farming' },
  kind: { ko: '아이소메트릭 배치도', en: 'Isometric site plan' },
  domain: 'agrifood',
  styles: ['drawing'],
  summary: {
    ko: '탁자 위 모형처럼 비스듬히 내려다본 농장 — 유리 너머로 작물 줄이 보이는 온실 네 동과 육묘장·양액실·선별장, 지붕마다 꽂힌 태그에 안의 온도와 습도, 지금 하는 일(환기창 열림·차광·관수). 옆에 환기창이 따르는 바깥 날씨, 오늘 수확량, 고온 경보와 견준 동별 온도, 관수와 전력. 예시 데이터입니다.',
    en: 'A farm seen from above at an angle, like a model on a table — four glasshouses with their crop rows showing through the glass, the seedling house, the nutrient room and the packing house, each with a tag pinned to its roof: the temperature and humidity inside and what it is doing now (vents open, shading, irrigating). Beside it the weather the vents answer to, the day’s harvest, each house’s temperature against the heat alarm, and the water and power used. Example data.',
  },
  connectors: [FARM],
  document,
  snapshot,
};
