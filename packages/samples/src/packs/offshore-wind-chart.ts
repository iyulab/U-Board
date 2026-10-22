import type { Binding, CanvasView, Connector, ElementDefinition, Node, Widget } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { svgDataUrl } from '../frame.js';
import { snapshot } from '../snapshots/offshore-wind-chart.js';

// An offshore wind farm drawn as a nautical chart: pale sea with depth contours and scattered soundings, buff land with its
// coastline, a graduated border, a compass rose, black chart lettering in italic for the sea and upright for the land. The
// turbines stand in three strings, each a chart-style box with its output; the inter-array and export cables run in
// magenta, as charts draw submarine cables, and a faulted length turns red and dashed. The service vessels, the weather
// buoy and the shore substation sit where they are. A turbine's state is told by a sign as well as a colour — a full disc
// generating, a half disc curtailed, a diamond under maintenance, a cross faulted. On the right a cartouche with the
// farm's name, the figures now, the key and the output through the day. The farm is made up, so the values are example
// data.

export const FARM: ExampleSampleConnector = {
  key: 'farm',
  name: '예시 풍력단지 API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 풍력단지가 아닙니다' },
};

/** The turbines report every ten seconds; three minutes of silence is a source that has stopped. */
const MAX_AGE_SECONDS = 3 * 60;

const bind = (path: string, valuePath: string, map?: Binding['map']): Binding => ({
  adapter: FARM.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
  ...(map && { map }),
});

const WIDTH = 1600;
const HEIGHT = 1000;
const SEA = '#eef6f9';
const SHALLOW = '#cfe6f1';
const LAND = '#f1e3bd';
const INK = '#1f2a33';
const CONTOUR = '#7fb0cc';
const MAGENTA = '#c2187a';
const FAULT = '#d1342b';
const PAPER = '#fbf8ef';
const SERIF = '"Noto Serif KR", "Batang", "Georgia", serif';

type TurbineId = 'a1' | 'a2' | 'a3' | 'a4' | 'b1' | 'b2' | 'b3' | 'b4' | 'c1' | 'c2' | 'c3' | 'c4';

/** Where each turbine stands on the chart: three strings running east from the offshore substation. */
const COLUMNS = [450, 620, 790, 960];
const ROWS: Record<'a' | 'b' | 'c', number> = { a: 300, b: 480, c: 660 };
const TURBINES = (['a', 'b', 'c'] as const).flatMap(row => COLUMNS.map((x, i) => ({ id: `${row}${i + 1}` as TurbineId, x, y: ROWS[row] })));

// ── The chart ──────────────────────────────────────────────────────────────────────────────────────────────────

function drawing(): string {
  // Soundings: depths in metres scattered over the sea, deeper to the south-east.
  const soundings: [number, number, string][] = [
    [600, 120, '8'], [760, 160, '11'], [930, 110, '12'], [1040, 220, '15'], [440, 420, '13'], [700, 430, '17'], [1040, 420, '19'],
    [460, 600, '18'], [690, 610, '21'], [1050, 600, '23'], [380, 760, '20'], [620, 800, '24'], [760, 900, '27'], [1040, 880, '29'],
    [200, 640, '14'], [120, 450, '7'], [300, 920, '22'],
  ];
  const ticks = (from: number, to: number, at: number, horizontal: boolean) =>
    Array.from({ length: Math.floor((to - from) / 40) }, (_, i) => {
      const p = from + i * 40;
      const fill = i % 2 === 0 ? INK : PAPER;
      return horizontal ? `<rect x="${p}" y="${at}" width="40" height="8" fill="${fill}"/>` : `<rect x="${at}" y="${p}" width="8" height="40" fill="${fill}"/>`;
    }).join('');
  const rose = (cx: number, cy: number) => `<g transform="translate(${cx} ${cy})" stroke="${INK}" stroke-width="1.2" fill="none">
<circle r="70"/><circle r="62"/><circle r="40" stroke-dasharray="2 4"/>
<path d="M0 -70 L8 0 L0 70 L-8 0 Z M-70 0 L0 8 L70 0 L0 -8 Z" fill="${INK}" fill-opacity=".85"/>
<path d="M0 -70 L8 0 L-8 0 Z" fill="${MAGENTA}" stroke="none"/>
<text y="-78" text-anchor="middle" fill="${INK}" stroke="none" font-size="18" font-family='${SERIF}' font-weight="700">N</text></g>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<rect width="${WIDTH}" height="${HEIGHT}" fill="${PAPER}"/>
<rect x="28" y="28" width="1072" height="944" fill="${SEA}"/>
<path d="M28 28 H560 C520 90 470 120 420 150 C360 190 300 210 250 260 C200 310 140 330 28 360 Z" fill="${SHALLOW}"/>
<path d="M28 28 H500 C470 70 420 100 370 120 C310 145 250 160 200 200 C150 240 100 260 28 280 Z" fill="${LAND}" stroke="${INK}" stroke-width="1.5"/>
<path d="M28 450 C200 420 330 330 480 240 C620 160 800 120 1100 90" stroke="${CONTOUR}" stroke-width="1.4" fill="none" stroke-dasharray="10 4 2 4"/>
<path d="M28 640 C260 600 420 520 600 420 C780 330 940 300 1100 280" stroke="${CONTOUR}" stroke-width="1.4" fill="none" stroke-dasharray="10 4 2 4 2 4"/>
<path d="M28 860 C300 820 520 760 720 650 C880 570 990 540 1100 520" stroke="${CONTOUR}" stroke-width="1.4" fill="none"/>
<text x="860" y="124" fill="${CONTOUR}" font-size="13" font-family='${SERIF}' font-style="italic">10</text>
<text x="640" y="440" fill="${CONTOUR}" font-size="13" font-family='${SERIF}' font-style="italic">20</text>
<text x="700" y="680" fill="${CONTOUR}" font-size="13" font-family='${SERIF}' font-style="italic">30</text>
${soundings.map(([x, y, d]) => `<text x="${x}" y="${y}" fill="${INK}" fill-opacity=".75" font-size="14" font-family='${SERIF}' font-style="italic">${d}</text>`).join('')}
<text x="60" y="80" fill="${INK}" font-size="24" font-family='${SERIF}' font-weight="700" letter-spacing=".3em">누 리 곶</text>
<text x="600" y="960" fill="${INK}" fill-opacity=".7" font-size="26" font-family='${SERIF}' font-style="italic" letter-spacing=".6em">누 리 해</text>
<rect x="400" y="250" width="660" height="510" fill="none" stroke="${MAGENTA}" stroke-width="1.5" stroke-dasharray="14 6"/>
<text x="410" y="244" fill="${MAGENTA}" font-size="14" font-family='${SERIF}' font-style="italic">풍력발전구역 · 항행 제한</text>
${rose(170, 820)}
<rect x="20" y="20" width="1088" height="960" fill="none" stroke="${INK}" stroke-width="2"/>
<rect x="28" y="28" width="1072" height="944" fill="none" stroke="${INK}" stroke-width="1"/>
${ticks(28, 1100, 20, true)}${ticks(28, 1100, 972, true)}${ticks(28, 972, 20, false)}${ticks(28, 972, 1100, false)}
</svg>`;
  return svgDataUrl(svg);
}

// ── Elements ───────────────────────────────────────────────────────────────────────────────────────────────────

/** A turbine as a chart-style box — read from `t`. */
const turbine: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['t'], properties: { t: { type: 'object' } } },
  template: `<section class="wt {{t.state}}"><i></i><b>{{t.name}}</b><strong>{{t.mw}}</strong><small>{{t.note}}</small></section>`,
  style: `.wt{height:100%;box-sizing:border-box;display:grid;grid-template-columns:22px 1fr;grid-template-rows:auto auto auto;column-gap:6px;align-items:center;padding:5px 7px;background:${PAPER};border:1.5px solid ${INK};font-family:${SERIF};color:${INK}}
i{grid-row:span 2;width:18px;height:18px;box-sizing:border-box;border:2px solid ${INK};border-radius:50%}
b{font-size:15px;font-weight:700}
strong{font-size:14px;font-weight:700;font-variant-numeric:tabular-nums;white-space:nowrap}
small{grid-column:span 2;font-size:12px;font-style:italic;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.run i{background:${INK}}
.limit i{background:linear-gradient(90deg,${INK} 50%,transparent 50%)}
.service i{border-radius:0;transform:rotate(45deg) scale(.8);background:${CONTOUR}}
.fault{border-color:${FAULT};border-width:2.5px}
.fault i{border:none;border-radius:0;background:none;position:relative}
.fault i::before,.fault i::after{content:"";position:absolute;left:8px;top:-1px;width:3px;height:20px;background:${FAULT};transform:rotate(45deg)}
.fault i::after{transform:rotate(-45deg)}
.fault small{color:${FAULT}}`,
  size: { width: 96, height: 70 },
};

/** A fixed point on the chart — the substations, a vessel, the buoy — with a line of what it reports. */
const mark: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['m'], properties: { m: { type: 'object' } } },
  template: `<section class="mk {{m.kind}}"><b>{{m.name}}</b><span>{{m.text}}</span></section>`,
  style: `.mk{height:100%;box-sizing:border-box;display:grid;align-content:center;gap:2px;padding:4px 10px;background:${PAPER};border:1.5px solid ${INK};font-family:${SERIF};color:${INK}}
b{font-size:15px;font-weight:700}
span{font-size:13px;font-style:italic}
.station{border-width:3px;border-style:double}
.vessel{border-radius:999px 999px 999px 4px;padding-left:16px}
.buoy{border-color:${MAGENTA}}
.buoy b{color:${MAGENTA}}`,
  size: { width: 150, height: 60 },
};

/** The chart's cartouche: the farm's name, its chart line and the time. */
const cartouche: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['c'], properties: { c: { type: 'object' } } },
  template: `<header class="ct"><small>{{c.series}}</small><h1>{{c.name}}</h1><p>{{c.sub}}</p><div><span>{{c.date}}</span><b>{{c.time}}</b></div></header>`,
  style: `.ct{height:100%;box-sizing:border-box;display:grid;align-content:center;justify-items:center;gap:4px;padding:12px 20px;background:${PAPER};border:3px double ${INK};outline:1px solid ${INK};outline-offset:-10px;font-family:${SERIF};color:${INK};text-align:center}
small{font-size:13px;letter-spacing:.3em}
h1{margin:0;font-size:32px;font-weight:700;letter-spacing:.08em}
p{margin:0;font-size:15px;font-style:italic}
div{display:flex;gap:16px;align-items:baseline}
span{font-size:15px}
b{font-size:26px}`,
  size: { width: 460, height: 170 },
};

/** The figures now, as a chart's table of particulars. */
const figures: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, value: { type: 'string' }, note: { type: 'string' } } } } },
  },
  template: `<dl class="fg">{{#items}}<div><dt>{{label}}</dt><dd>{{value}}</dd><small>{{note}}</small></div>{{/items}}</dl>`,
  style: `.fg{margin:0;height:100%;box-sizing:border-box;display:grid;grid-template-columns:repeat(3,1fr);border:1.5px solid ${INK};background:${PAPER};font-family:${SERIF};color:${INK}}
div{display:grid;align-content:center;justify-items:center;text-align:center;padding:4px}
div+div{border-left:1px solid ${INK}}
dt{font-size:14px;font-style:italic}
dd{margin:0;font-size:28px;font-weight:700}
small{font-size:12px}`,
  size: { width: 460, height: 110 },
};

/** The key, set out like a chart's legend. */
const legend: ElementDefinition = {
  render: 'template',
  props: { type: 'object', properties: {} },
  template: `<ul class="lg"><li><i class="run"></i>발전</li><li><i class="limit"></i>출력 제한</li><li><i class="service"></i>정비</li><li><i class="fault">✕</i>고장</li><li><u></u>해저 케이블</li><li><u class="cut"></u>케이블 고장</li></ul>`,
  style: `.lg{height:100%;box-sizing:border-box;margin:0;padding:8px 16px;list-style:none;display:grid;grid-template-columns:repeat(3,1fr);align-content:center;gap:8px 12px;border:1.5px solid ${INK};background:${PAPER};font:14px ${SERIF};color:${INK}}
li{display:flex;align-items:center;gap:8px;white-space:nowrap}
i{width:16px;height:16px;box-sizing:border-box;border:2px solid ${INK};border-radius:50%;display:grid;place-items:center;font-style:normal}
.run{background:${INK}}
.limit{background:linear-gradient(90deg,${INK} 50%,transparent 50%)}
.service{border-radius:0;transform:rotate(45deg) scale(.8);background:${CONTOUR}}
.fault{border:none;color:${FAULT};font-weight:900;font-size:16px}
u{width:30px;height:0;border-top:3px solid ${MAGENTA}}
u.cut{border-top:3px dashed ${FAULT}}`,
  size: { width: 460, height: 90 },
};

// ── The board ──────────────────────────────────────────────────────────────────────────────────────────────────

const node = (id: string, x: number, y: number, width: number, height: number, widget: Widget): Node => ({ id, x, y, width, height, anchored: false, widget });

const markNode = (id: string, x: number, y: number, width: number) =>
  node(id, x, y, width, 60, { type: 'element:mark', props: { m: {} }, bindings: { m: bind('/farm/marks', `/value/${id}`) } });

/** A cable's colour and dash by its state: magenta in service, red and dashed when faulted. */
const CABLE_COLOUR = { values: { ok: MAGENTA, fault: FAULT }, otherwise: MAGENTA };
const CABLE_DASH = { values: { ok: 'solid', fault: 'dashed' }, otherwise: 'solid' };

const cable = (id: string, from: string, to: string, route: 'straight' | 'curved' = 'straight'): Connector => ({
  id: `cable-${id}`,
  fromNodeId: from,
  toNodeId: to,
  style: { stroke: MAGENTA, strokeWidth: 3, route },
  bindings: {
    'style.stroke': bind('/farm/cables', `/value/${id}/state`, CABLE_COLOUR),
    'style.dash': bind('/farm/cables', `/value/${id}/state`, CABLE_DASH),
  },
});

const STRING_CABLES: Connector[] = (['a', 'b', 'c'] as const).flatMap(row => [
  cable(`${row}0`, 'oss', `turbine-${row}1`),
  cable(`${row}1`, `turbine-${row}1`, `turbine-${row}2`),
  cable(`${row}2`, `turbine-${row}2`, `turbine-${row}3`),
  cable(`${row}3`, `turbine-${row}3`, `turbine-${row}4`),
]);

const nodes: Node[] = [
  ...TURBINES.map(({ id, x, y }) => node(`turbine-${id}`, x, y, 96, 70, { type: 'element:turbine', props: { t: {} }, bindings: { t: bind('/farm/turbines', `/value/${id}`) } })),
  markNode('oss', 230, 470, 160),
  markNode('shore', 60, 120, 170),
  markNode('ctv1', 720, 400, 170),
  markNode('ctv2', 260, 330, 170),
  markNode('buoy', 860, 830, 200),
  node('cartouche', 1130, 30, 460, 170, { type: 'element:cartouche', props: { c: {} }, bindings: { c: bind('/farm/now', '/value') } }),
  node('figures', 1130, 220, 460, 110, { type: 'element:figures', props: { items: [] }, bindings: { items: bind('/farm/figures', '/value') } }),
  node('legend', 1130, 350, 460, 90, { type: 'element:legend', props: {} }),
  node('output', 1130, 460, 460, 500, {
    type: 'chart.area',
    props: { title: '오늘 시간별 평균 출력(MW) — 설비 120 MW', data: [], mapping: { x: 'hour', y: 'mw' }, options: { series: [{ label: '출력', color: MAGENTA }] } },
    bindings: { data: bind('/farm/hours', '/value') },
  }),
];

const document: CanvasView = {
  kind: 'canvas',
  appearance: 'light',
  accent: MAGENTA,
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes,
  connectors: [...STRING_CABLES, cable('export', 'oss', 'shore', 'curved')],
  elements: { turbine, mark, cartouche, figures, legend },
};

export const offshoreWindChart: SamplePack = {
  id: 'offshore-wind-chart',
  title: { ko: '해상풍력단지 — 해도', en: 'An offshore wind farm — a nautical chart' },
  field: { ko: '해상풍력·재생에너지', en: 'Offshore wind' },
  kind: { ko: '발전기 상태·해저 케이블·정비선', en: 'Turbines, submarine cables and service vessels' },
  domain: 'energy',
  styles: ['drawing'],
  summary: {
    ko: '해상풍력단지를 해도로 — 등심선과 흩어진 수심 숫자가 있는 옅은 바다, 해안선을 두른 담황색 육지, 눈금 테두리, 나침도, 바다는 기울인 글자·땅은 바른 글자. 발전기 열둘이 세 줄로 서고, 줄 사이 해저 케이블과 육지로 가는 송전 케이블은 해도가 해저 케이블을 그리듯 자홍색 — 고장 난 구간은 빨간 점선. 정비선 둘, 기상 부이, 해상·육상 변전소는 제자리에. 발전기 상태는 색과 함께 기호로: 꽉 찬 원 발전, 반원 출력 제한, 마름모 정비, ✕ 고장. 오른쪽에 단지 이름 표제, 지금 수치, 범례, 오늘 시간별 출력. 단지는 지어낸 것이라 예시 데이터입니다.',
    en: 'An offshore wind farm drawn as a nautical chart — pale sea with depth contours and scattered soundings, buff land inside its coastline, a graduated border, a compass rose, italic lettering on the sea and upright on the land. Twelve turbines stand in three strings; the inter-array cables and the export cable to shore run in magenta, as charts draw submarine cables, and a faulted length turns red and dashed. Two service vessels, a weather buoy and the substations sit where they are. A turbine tells its state with a sign as well as a colour — a full disc generating, a half disc curtailed, a diamond under maintenance, a cross faulted. On the right a cartouche with the farm’s name, the figures now, the key and the output through the day. The farm is made up. Example data.',
  },
  connectors: [FARM],
  document,
  snapshot,
};
