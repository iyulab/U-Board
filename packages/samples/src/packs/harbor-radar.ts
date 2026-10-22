import type { Binding, CanvasView, ElementDefinition, Node, Widget } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { svgDataUrl } from '../frame.js';
import { snapshot } from '../snapshots/harbor-radar.js';

// A fishing harbour's night watch on an old green-phosphor radar scope: range rings, bearing ticks, the sweep and the
// coast round the station, and every boat out tonight a blip placed where it is — its call sign, speed and state in a
// mark and a word: ● fishing, ▶ under way, ▲ in amber when it nears a closed area, ✕ dimmed when its position report has
// stopped. On the right the boats' roster and the sea's wave height against the advisory level. The harbour and its
// boats are made up, so the values are example data.

export const WATCH: ExampleSampleConnector = {
  key: 'watch',
  name: '예시 어항 출입항 관제 API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 어항·어선이 아닙니다' },
};

/** Position reports come every few minutes; fifteen minutes without one from the watch is a feed to check. */
const MAX_AGE_SECONDS = 15 * 60;

const bind = (path: string, valuePath: string): Binding => ({
  adapter: WATCH.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
});

const WIDTH = 1600;
const HEIGHT = 1000;
const GLASS = '#021006';
const PHOSPHOR = '#39ff7a';
const PHOSPHOR_DIM = '#1d8a44';
const AMBER = '#ffb627';
const MONO = '"D2Coding", "Consolas", "Menlo", monospace';
const TEXT = '"Pretendard", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';

/** The station at the scope's centre, and the scope's radius — the boats are placed in this frame. */
const CX = 520;
const CY = 560;
const R = 400;

/** Where each boat's blip sits on the scope (the blip's mark, not its label). */
const BOATS = [
  { id: 'v1', x: 690, y: 350 },
  { id: 'v2', x: 600, y: 475 },
  { id: 'v3', x: 290, y: 295 },
  { id: 'v4', x: 740, y: 560 },
  { id: 'v5', x: 385, y: 220 },
  { id: 'v6', x: 230, y: 490 },
  { id: 'v7', x: 800, y: 430 },
] as const;
const BLIP_W = 200;
const BLIP_H = 60;

// ── The scope ──────────────────────────────────────────────────────────────────────────────────────────────────

function drawing(): string {
  const rings = [1, 2, 3, 4].map(k => `<circle cx="${CX}" cy="${CY}" r="${(R * k) / 4}" fill="none" stroke="${PHOSPHOR_DIM}" stroke-width="${k === 4 ? 3 : 1.2}"/>`).join('');
  const ringLabels = [1, 2, 3].map(k => `<text x="${CX + 6}" y="${CY - (R * k) / 4 - 6}" fill="${PHOSPHOR_DIM}" font-family="Consolas, monospace" font-size="14">${k * 3} NM</text>`).join('');
  const ticks = Array.from({ length: 36 }, (_, i) => {
    const a = (i * 10 * Math.PI) / 180;
    const r1 = i % 3 === 0 ? R - 18 : R - 9;
    const [x1, y1, x2, y2] = [CX + Math.sin(a) * r1, CY - Math.cos(a) * r1, CX + Math.sin(a) * R, CY - Math.cos(a) * R].map(v => v.toFixed(1));
    const label = i % 9 === 0 ? `<text x="${(CX + Math.sin(a) * (R + 22)).toFixed(1)}" y="${(CY - Math.cos(a) * (R + 22) + 5).toFixed(1)}" fill="${PHOSPHOR_DIM}" font-family="Consolas, monospace" font-size="16" text-anchor="middle">${String(i * 10).padStart(3, '0')}</text>` : '';
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${PHOSPHOR_DIM}" stroke-width="2"/>${label}`;
  }).join('');
  // The sweep: a wedge trailing behind the beam, fading out.
  const beam = (60 * Math.PI) / 180;
  const tail = (20 * Math.PI) / 180;
  const p = (a: number) => `${(CX + Math.sin(a) * R).toFixed(1)} ${(CY - Math.cos(a) * R).toFixed(1)}`;
  const sweep = `<path d="M${CX} ${CY} L${p(tail)} A${R} ${R} 0 0 1 ${p(beam)} Z" fill="url(#trail)"/><line x1="${CX}" y1="${CY}" x2="${p(beam).split(' ')[0]}" y2="${p(beam).split(' ')[1]}" stroke="${PHOSPHOR}" stroke-width="2.5"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<defs>
<radialGradient id="glass" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#06301a"/><stop offset="1" stop-color="${GLASS}"/></radialGradient>
<linearGradient id="trail" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${PHOSPHOR}" stop-opacity="0"/><stop offset="1" stop-color="${PHOSPHOR}" stop-opacity=".28"/></linearGradient>
<clipPath id="scope"><circle cx="${CX}" cy="${CY}" r="${R}"/></clipPath>
<pattern id="land" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="10" height="10" fill="#0a2a16"/><line x1="0" y1="0" x2="0" y2="10" stroke="${PHOSPHOR_DIM}" stroke-width="1.4"/></pattern>
</defs>
<rect width="${WIDTH}" height="${HEIGHT}" fill="#0b0f0c"/>
<rect x="60" y="80" width="920" height="900" rx="40" fill="#151a16" stroke="#2a332c" stroke-width="3"/>
<circle cx="${CX}" cy="${CY}" r="${R + 30}" fill="#050806" stroke="#2a332c" stroke-width="4"/>
<circle cx="${CX}" cy="${CY}" r="${R}" fill="url(#glass)"/>
<g clip-path="url(#scope)">
<path transform="translate(0 20)" d="M110 720 C 250 650, 380 640, 470 590 L 520 562 L 570 590 C 660 640, 800 650, 930 700 L 930 960 L 110 960 Z" fill="url(#land)" stroke="${PHOSPHOR}" stroke-width="2" opacity=".85"/>
<path d="M${CX} ${CY - R} V${CY + R} M${CX - R} ${CY} H${CX + R}" stroke="${PHOSPHOR_DIM}" stroke-width="1" stroke-dasharray="4 8"/>
${sweep}
</g>
${rings}${ringLabels}${ticks}
<circle cx="${CX}" cy="${CY}" r="7" fill="${PHOSPHOR}"/>
<text x="${CX}" y="${CY + 30}" fill="${PHOSPHOR}" font-family="Consolas, monospace" font-size="15" text-anchor="middle">HARBOR</text>
<rect x="1010" y="80" width="550" height="900" rx="16" fill="#101512" stroke="#2a332c" stroke-width="3"/>
</svg>`;
  return svgDataUrl(svg);
}

// ── Elements ───────────────────────────────────────────────────────────────────────────────────────────────────

/** A boat's blip — read from `v`: the mark (the state's shape), call sign, speed and state word. */
const blip: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['v'], properties: { v: { type: 'object' } } },
  template: `<div class="bp {{v.state}}"><i></i><p><b>{{v.call}}</b><small>{{v.knots}} kn · {{v.word}}</small></p></div>`,
  style: `.bp{height:100%;display:flex;align-items:center;gap:8px;font-family:${MONO};color:${PHOSPHOR};text-shadow:0 0 6px rgba(57,255,122,.7)}
i{flex:none;width:28px;height:28px;display:grid;place-items:center;font-style:normal;font-size:20px;line-height:1}
p{margin:0;display:grid;padding:2px 6px;background:rgba(2,16,6,.75);border-left:2px solid currentColor}
b{font-size:15px;white-space:nowrap}
small{font-size:12px;white-space:nowrap;opacity:.9}
.fishing i::before{content:"●"}
.underway i::before{content:"▶"}
.alarm{color:${AMBER};text-shadow:0 0 8px rgba(255,182,39,.8)}.alarm i::before{content:"▲"}.alarm i{outline:2px solid ${AMBER};outline-offset:2px;border-radius:50%}
.lost{opacity:.55}.lost i::before{content:"✕"}.lost p{border-left-style:dashed}`,
  size: { width: BLIP_W, height: BLIP_H },
};

/** The watch's heading. */
const banner: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['n'], properties: { n: { type: 'object' } } },
  template: `<header class="bn"><h1>물안개항 야간 출입항 관제</h1><p>{{n.date}} {{n.time}} · 출어 {{n.out}}척</p></header>`,
  style: `.bn{height:100%;display:flex;align-items:baseline;gap:20px;font-family:${MONO};color:${PHOSPHOR};text-shadow:0 0 8px rgba(57,255,122,.6)}
h1{margin:0;white-space:nowrap;font:700 30px ${TEXT};letter-spacing:.04em}
p{margin:0;white-space:nowrap;font-size:16px;color:${PHOSPHOR_DIM}}`,
  size: { width: 900, height: 44 },
};

/** The boats' roster — read from `items`. */
const roster: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { call: { type: 'string' }, kind: { type: 'string' }, note: { type: 'string' }, state: { type: 'string' }, word: { type: 'string' } } } } },
  },
  template: `<section class="rs"><h2>출어 선박 · 7척</h2><ol>{{#items}}<li class="{{state}}"><i></i><b>{{call}}</b><span>{{kind}}</span><em>{{word}}</em><small>{{note}}</small></li>{{/items}}</ol><p class="key">● 조업 · ▶ 항해 · ▲ 경보 · ✕ 위치 끊김</p></section>`,
  style: `.rs{height:100%;box-sizing:border-box;padding:4px 6px;font-family:${MONO};color:${PHOSPHOR}}
h2{margin:0 0 10px;font:700 20px ${TEXT};letter-spacing:.06em}
ol{margin:0;padding:0;list-style:none;display:grid;gap:6px}
li{display:grid;grid-template-columns:22px 104px minmax(0,1fr) 74px;grid-template-rows:auto auto;column-gap:6px;align-items:baseline;padding:4px 0;border-bottom:1px solid #1d3a26}
i{font-style:normal;grid-row:1}
b{font-size:14px;white-space:nowrap}
span{font-size:12px;color:${PHOSPHOR_DIM};white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
em{font-style:normal;font-size:12px;text-align:center;border:1px solid currentColor;padding:0 2px;white-space:nowrap}
small{grid-column:2 / span 3;font-size:12px;color:#8fd8a8}
.fishing i::before{content:"●"}.underway i::before{content:"▶"}
.alarm{color:${AMBER}}.alarm i::before{content:"▲"}.alarm em{background:${AMBER};color:${GLASS}}
.lost{opacity:.6}.lost i::before{content:"✕"}.lost em{border-style:dashed}
.key{margin:10px 0 0;font-size:12px;color:${PHOSPHOR_DIM}}`,
  size: { width: 510, height: 470 },
};

// ── The board ──────────────────────────────────────────────────────────────────────────────────────────────────

const node = (id: string, x: number, y: number, width: number, height: number, widget: Widget): Node => ({ id, x, y, width, height, anchored: false, widget });

const nodes: Node[] = [
  node('banner', 90, 88, 900, 44, { type: 'element:banner', props: { n: {} }, bindings: { n: bind('/watch/now', '/value') } }),
  ...BOATS.map(({ id, x, y }) =>
    node(`boat-${id}`, x - 14, y - BLIP_H / 2, BLIP_W, BLIP_H, { type: 'element:blip', props: { v: {} }, bindings: { v: bind('/watch/boats', `/value/${id}`) } }),
  ),
  node('roster', 1030, 100, 510, 470, { type: 'element:roster', props: { items: [] }, bindings: { items: bind('/watch/roster', '/value') } }),
  node('waves', 1030, 600, 510, 360, {
    type: 'chart.line',
    props: {
      title: '근해 유의파고 — 지난 12시간 (m)',
      data: [],
      mapping: { x: 'hour', y: ['wave', 'advisory'] },
      options: { series: [{ label: '파고', color: PHOSPHOR }, { label: '풍랑주의보 3 m', color: AMBER }], echarts: { yAxis: { min: 0, max: 4 } } },
    },
    bindings: { data: bind('/watch/waves', '/value') },
  }),
];

const document: CanvasView = {
  kind: 'canvas',
  appearance: 'dark',
  accent: PHOSPHOR,
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes,
  connectors: [],
  elements: { blip, banner, roster },
};

export const harborRadar: SamplePack = {
  id: 'harbor-radar',
  title: { ko: '어항 야간 출입항 관제 — 녹색 인광 레이더', en: 'A fishing harbour’s night watch — a green-phosphor radar scope' },
  field: { ko: '어항·어선 안전', en: 'Fishing harbours and vessel safety' },
  kind: { ko: '선박 위치와 상태', en: 'Vessel positions and states' },
  summary: {
    ko: '어항의 야간 관제를 녹색 인광 레이더 화면으로 — 거리 고리·방위 눈금·지나가는 빛줄기와 해안선 위에, 오늘 밤 나간 배마다 지금 자리에 놓인 점 하나: 호출부호·속력·상태가 표지 모양과 낱말로 — ● 조업 중, ▶ 항해 중, ▲ 금지구역 가까움(호박색), ✕ 위치 보고 끊김(흐리게). 오른쪽에 출어 선박 명단과 근해 파고·풍랑주의보 기준. 어항과 어선은 지어낸 것이라 예시 데이터입니다.',
    en: 'A fishing harbour’s night watch on an old green-phosphor radar scope — over the range rings, bearing ticks, the sweep and the coast, a blip placed where it is for every boat out tonight: its call sign, speed and state in a mark and a word — ● fishing, ▶ under way, ▲ near a closed area (amber), ✕ its position reports stopped (dimmed). On the right the boats’ roster and the sea’s wave height against the advisory level. The harbour and its boats are made up. Example data.',
  },
  connectors: [WATCH],
  document,
  snapshot,
};
