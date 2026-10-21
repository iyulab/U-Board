import type { Binding, CanvasView, Connector, ElementDefinition, Node, Widget } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { svgDataUrl } from '../frame.js';
import { snapshot } from '../snapshots/theme-park.js';

// A theme park's wait-time board drawn in the Memphis style of the eighties: pastel zones with zigzag and wavy edges,
// confetti of squiggles, dots and triangles, everything outlined in thick black. The decoration keeps to purple, black
// and pale tints, so the four strong colours mean one thing each: a ride's wait — teal short, yellow middling, hot pink
// long — and grey hatched for a ride that is down. Each ride is a badge with its wait in large type; a purple dashed
// route strings the shortest waits together from the gate. On the right the day's figures, the shows and the average
// wait by the hour. The park is made up, so the values are example data.

export const PARK: ExampleSampleConnector = {
  key: 'park',
  name: '예시 놀이공원 대기 API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 놀이공원이 아닙니다' },
};

/** Queue sensors post every minute or two; a quarter of an hour without an answer is a source that has stopped. */
const MAX_AGE_SECONDS = 15 * 60;

const bind = (path: string, valuePath: string): Binding => ({
  adapter: PARK.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
});

const WIDTH = 1600;
const HEIGHT = 1000;
const CREAM = '#fff7ea';
const INK = '#141414';
const PURPLE = '#6e4bff';
/** A ride's wait: teal short, yellow middling, hot pink long, grey down. Only the badges use these. */
const SHORT = '#13a89a';
const MID = '#ffc21a';
const LONG = '#ff3d7f';
const DOWN = '#9a9a9a';
const SANS = '"Futura", "Jost", "Century Gothic", "Noto Sans KR", "Malgun Gothic", sans-serif';

/** The rides, by zone: where each badge sits on the map. */
const RIDES = {
  coaster: [110, 120],
  jungle: [330, 220],
  drop: [110, 360],
  wheel: [620, 110],
  teacup: [860, 270],
  rapids: [620, 300],
  haunted: [110, 620],
  cinema: [300, 770],
  carousel: [700, 600],
  bumper: [860, 760],
} as const;
type RideId = keyof typeof RIDES;
/** The rides with something to say beside the wait — a height limit, why it is down, when its next show is. */
const NOTED: ReadonlySet<RideId> = new Set(['coaster', 'drop', 'rapids', 'haunted', 'cinema']);
const BADGE = { width: 160, height: 100 };

/** The suggested route: the shortest waits, from the gate. */
const ROUTE: { id: string; from: string; to: string }[] = [
  { id: 'gate-carousel', from: 'gate', to: 'ride-carousel' },
  { id: 'carousel-teacup', from: 'ride-carousel', to: 'ride-teacup' },
  { id: 'teacup-wheel', from: 'ride-teacup', to: 'ride-wheel' },
];

// ── The map ─────────────────────────────────────────────────────────────────────────────────────────────────────

function drawing(): string {
  // A zone: a pastel field with a thick black edge — zigzag or wavy, as Memphis trims its shapes.
  const zigzag = (x: number, y: number, w: number, h: number, step = 24) => {
    let d = `M ${x} ${y}`;
    for (let i = 0; i < w / step; i++) d += ` l ${step / 2} ${i % 2 ? 10 : -10} l ${step / 2} ${i % 2 ? -10 : 10}`;
    return `${d} V ${y + h} H ${x} Z`;
  };
  const zone = (d: string, fill: string, label: string, lx: number, ly: number) =>
    `<path d="${d}" fill="${fill}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><text x="${lx}" y="${ly}" fill="${INK}" font-size="20" font-weight="800" letter-spacing="4" font-family='${SANS}'>${label}</text>`;
  const squiggle = (x: number, y: number, color: string) =>
    `<path d="M ${x} ${y} q 10 -14 20 0 t 20 0 t 20 0 t 20 0" fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round"/>`;
  const dots = (x: number, y: number) =>
    Array.from({ length: 12 }, (_, i) => `<circle cx="${x + (i % 4) * 14}" cy="${y + Math.floor(i / 4) * 14}" r="3.5" fill="${INK}"/>`).join('');
  const tri = (x: number, y: number, color: string, rot: number) =>
    `<path d="M ${x} ${y} l 18 30 h -36 z" fill="${color}" stroke="${INK}" stroke-width="3" transform="rotate(${rot} ${x} ${y + 15})"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<defs><pattern id="grid" width="22" height="22" patternUnits="userSpaceOnUse"><path d="M 22 0 H 0 V 22" fill="none" stroke="${INK}" stroke-opacity=".08" stroke-width="2"/></pattern></defs>
<rect width="${WIDTH}" height="${HEIGHT}" fill="${CREAM}"/>
<rect width="1080" height="${HEIGHT}" fill="url(#grid)"/>
${zone(zigzag(40, 70, 480, 440), '#e7defe', '모험', 60, 500)}
${zone(zigzag(560, 70, 480, 390), '#d9f4f0', '판타지', 580, 450)}
${zone('M 40 560 C 120 540 200 580 280 560 C 360 540 440 580 520 560 V 930 H 40 Z', '#ffe0ec', '할로윈', 60, 916)}
${zone('M 560 560 C 640 540 720 580 800 560 C 880 540 960 580 1040 560 V 930 H 560 Z', '#fff1c7', '키즈', 960, 916)}
<circle cx="540" cy="515" r="62" fill="${CREAM}" stroke="${INK}" stroke-width="4"/>
<circle cx="540" cy="515" r="44" fill="none" stroke="${PURPLE}" stroke-width="6" stroke-dasharray="2 12" stroke-linecap="round"/>
<text x="540" y="522" text-anchor="middle" fill="${INK}" font-size="18" font-weight="800" font-family='${SANS}'>광장</text>
${squiggle(470, 40, PURPLE)}${squiggle(960, 520, PURPLE)}${squiggle(300, 540, INK)}
${dots(450, 120)}${dots(960, 410)}${dots(400, 640)}
${tri(1000, 20, '#e7defe', 20)}${tri(520, 840, '#d9f4f0', -15)}${tri(250, 470, '#fff1c7', 35)}
<path d="M 1080 0 V ${HEIGHT}" stroke="${INK}" stroke-width="6"/>
<path d="M 1092 0 V ${HEIGHT}" stroke="${PURPLE}" stroke-width="6" stroke-dasharray="14 10"/>
</svg>`;
  return svgDataUrl(svg);
}

// ── Elements ────────────────────────────────────────────────────────────────────────────────────────────────────

const LEVELS = `.short{--c:${SHORT}}.mid{--c:${MID}}.long{--c:${LONG}}
.closed{--c:${DOWN};--h:repeating-linear-gradient(45deg,rgba(255,255,255,.35) 0 6px,transparent 6px 12px)}`;

/** A ride's badge: its wait in large type on its colour, the ride's name and a note, all outlined in black. */
const ride: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['name', 'level'],
    properties: { name: { type: 'string' }, wait: { type: 'string' }, level: { enum: ['short', 'mid', 'long', 'closed'] }, note: { type: 'string' } },
  },
  template: `<section class="rd {{level}}"><b>{{wait}}<small>분</small></b><p><strong>{{name}}</strong>{{#note}}<em>{{note}}</em>{{/note}}</p></section>`,
  style: `${LEVELS}
.rd{height:100%;box-sizing:border-box;display:grid;grid-template-columns:auto 1fr;align-items:center;gap:8px;padding:6px 8px;background:#fff;border:4px solid ${INK};box-shadow:6px 6px 0 ${INK};font-family:${SANS};color:${INK}}
b{display:grid;place-items:center;align-content:center;min-width:58px;height:58px;border:3px solid ${INK};border-radius:50%;background:var(--h,none),var(--c);font-size:26px;font-weight:900;line-height:1;font-variant-numeric:tabular-nums}
.closed b{font-size:17px}
.closed small{display:none}
small{font-size:11px;font-weight:800}
p{margin:0;display:grid;gap:2px;min-width:0}
strong{font-size:16px;font-weight:800;line-height:1.15}
em{font-style:normal;font-size:12px;color:#555;line-height:1.2}`,
  size: BADGE,
};

/** The park's gate, where the suggested route starts. */
const gate: ElementDefinition = {
  render: 'template',
  props: { type: 'object', properties: {} },
  template: `<div class="gt">정문</div>`,
  style: `.gt{height:100%;box-sizing:border-box;display:grid;place-items:center;background:${PURPLE};color:#fff;border:4px solid ${INK};font:900 18px ${SANS};letter-spacing:.3em}`,
  size: { width: 120, height: 44 },
};

/** The board's title, set big with a squiggle under it. */
const title: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['name'], properties: { name: { type: 'string' }, sub: { type: 'string' }, date: { type: 'string' }, time: { type: 'string' } } },
  template: `<header class="tt"><h1>{{name}}</h1><svg viewBox="0 0 200 16" aria-hidden="true"><path d="M 2 8 q 12 -12 24 0 t 24 0 t 24 0 t 24 0 t 24 0 t 24 0 t 24 0 t 24 0"/></svg><p>{{sub}} · {{date}} <b>{{time}}</b></p></header>`,
  style: `.tt{height:100%;box-sizing:border-box;display:grid;align-content:center;gap:6px;font-family:${SANS};color:${INK}}
h1{margin:0;font-size:52px;font-weight:900;letter-spacing:.04em;line-height:1}
svg{width:220px;height:18px;fill:none;stroke:${PURPLE};stroke-width:5;stroke-linecap:round}
p{margin:0;font-size:17px;font-weight:600}
b{font-size:22px}`,
  size: { width: 460, height: 140 },
};

/** The day's figures in black boxes with hard shadows. */
const figures: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, value: { type: 'string' }, note: { type: 'string' } } } } },
  },
  template: `<dl class="fg">{{#items}}<div><dt>{{label}}</dt><dd>{{value}}</dd><small>{{note}}</small></div>{{/items}}</dl>`,
  style: `.fg{margin:0;height:100%;box-sizing:border-box;display:grid;grid-template-columns:repeat(3,1fr);gap:14px;padding:0 8px 8px 0;font-family:${SANS};color:${INK}}
div{display:grid;align-content:center;padding:8px 10px;background:#fff;border:3px solid ${INK};box-shadow:5px 5px 0 ${PURPLE}}
dt{font-size:13px;font-weight:700}
dd{margin:2px 0;font-size:30px;font-weight:900;font-variant-numeric:tabular-nums}
small{font-size:11px;color:#555}`,
  size: { width: 460, height: 120 },
};

/** The shows today. */
const shows: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { time: { type: 'string' }, name: { type: 'string' }, place: { type: 'string' }, left: { type: 'string' } } } } },
  },
  template: `<section class="sh"><h3>오늘의 공연</h3><ol>{{#items}}<li><b>{{time}}</b><span><strong>{{name}}</strong><small>{{place}}{{#left}} · {{left}}{{/left}}</small></span></li>{{/items}}</ol></section>`,
  style: `.sh{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr;gap:8px;font-family:${SANS};color:${INK}}
h3{margin:0;justify-self:start;padding:4px 12px;background:${INK};color:#fff;font-size:17px;font-weight:900;letter-spacing:.12em}
ol{margin:0;padding:0;list-style:none;display:grid;align-content:start;gap:8px}
li{display:grid;grid-template-columns:70px 1fr;align-items:center;gap:10px;padding-bottom:8px;border-bottom:3px dotted ${INK}}
b{font-size:22px;font-weight:900;font-variant-numeric:tabular-nums;color:${PURPLE}}
span{display:grid}
strong{font-size:16px}
small{font-size:13px;color:#555}`,
  size: { width: 460, height: 220 },
};

/** The key to the badges' colours. */
const legend: ElementDefinition = {
  render: 'template',
  props: { type: 'object', properties: {} },
  template: `<ul class="lg"><li class="short"><i></i>20분 미만</li><li class="mid"><i></i>20–45분</li><li class="long"><i></i>45분 이상</li><li class="closed"><i></i>운휴</li><li class="rt"><i></i>추천 동선</li></ul>`,
  style: `${LEVELS}
.lg{height:100%;box-sizing:border-box;margin:0;padding:0;list-style:none;display:flex;align-items:center;gap:16px;font:800 14px ${SANS};color:${INK}}
li{display:flex;align-items:center;gap:6px}
i{width:18px;height:18px;border-radius:50%;border:3px solid ${INK};background:var(--h,none),var(--c)}
.rt i{width:26px;height:0;border:0;border-top:5px dashed ${PURPLE};border-radius:0}`,
  size: { width: 600, height: 30 },
};

// ── The board ───────────────────────────────────────────────────────────────────────────────────────────────────

const node = (id: string, x: number, y: number, width: number, height: number, widget: Widget): Node => ({ id, x, y, width, height, anchored: false, widget });

const RIDE_IDS = Object.keys(RIDES) as RideId[];

const leg = ({ id, from, to }: (typeof ROUTE)[number]): Connector => ({
  id: `route-${id}`,
  fromNodeId: from,
  toNodeId: to,
  label: '{{value}}',
  labelSize: 13,
  style: { stroke: PURPLE, strokeWidth: 5, dash: 'dashed', arrow: 'end' },
  bindings: { label: bind('/park/route', `/${id}`) },
});

const nodes: Node[] = [
  ...RIDE_IDS.map(id =>
    node(`ride-${id}`, RIDES[id][0], RIDES[id][1], BADGE.width, BADGE.height, {
      type: 'element:ride',
      props: { name: '', wait: '', level: 'short', note: '' },
      bindings: {
        name: bind('/park/rides', `/value/${id}/name`),
        wait: bind('/park/rides', `/value/${id}/wait`),
        level: bind('/park/rides', `/value/${id}/level`),
        ...(NOTED.has(id) && { note: bind('/park/rides', `/value/${id}/note`) }),
      },
    })
  ),
  node('gate', 480, 900, 120, 44, { type: 'element:gate', props: {} }),
  node('legend', 40, 956, 600, 30, { type: 'element:legend', props: {} }),
  node('title', 1120, 30, 460, 140, {
    type: 'element:title',
    props: { name: '', sub: '', date: '', time: '' },
    bindings: { name: bind('/park/now', '/name'), sub: bind('/park/now', '/sub'), date: bind('/park/now', '/date'), time: bind('/park/now', '/time') },
  }),
  node('figures', 1120, 190, 460, 120, { type: 'element:figures', props: { items: [] }, bindings: { items: bind('/park/figures', '/value') } }),
  node('shows', 1120, 336, 460, 230, { type: 'element:shows', props: { items: [] }, bindings: { items: bind('/park/shows', '/value') } }),
  node('waits', 1120, 590, 460, 380, {
    type: 'chart.bar',
    props: { title: '시간대별 평균 대기(분)', data: [], mapping: { x: 'hour', y: 'wait' }, options: { series: [{ label: '평균 대기', color: PURPLE }] } },
    bindings: { data: bind('/park/waits', '/value') },
  }),
];

const document: CanvasView = {
  kind: 'canvas',
  appearance: 'light',
  accent: PURPLE,
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes,
  connectors: ROUTE.map(leg),
  elements: { ride, gate, title, figures, shows, legend },
};

export const themePark: SamplePack = {
  id: 'theme-park',
  title: { ko: '놀이공원 대기 시간 — 멤피스', en: 'A theme park’s waits — in the Memphis style' },
  field: { ko: '여가·테마파크', en: 'Leisure & theme parks' },
  kind: { ko: '파스텔 구역의 놀이공원 지도', en: 'A park map of pastel zones' },
  summary: {
    ko: '놀이공원 정문의 대기 시간 안내판을 80년대 멤피스 스타일로 — 지그재그·물결 테두리의 파스텔 구역, 물결선·점·삼각형 색종이, 모든 것에 굵은 검은 테. 장식은 보라·검정·옅은 색만 써서 강한 네 색은 뜻 하나씩: 놀이기구 대기 — 청록 짧음, 노랑 보통, 핫핑크 김, 회색 빗금 운휴. 놀이기구마다 대기 분을 큰 글자로 담은 배지, 정문에서 대기가 짧은 곳을 잇는 보라 점선 추천 동선(도보 분). 오른쪽에 오늘 입장·평균 대기·운휴, 오늘의 공연, 시간대별 평균 대기. 놀이공원은 지어낸 것이라 예시 데이터입니다.',
    en: 'A theme park’s wait-time board at its gate in the Memphis style of the eighties — pastel zones with zigzag and wavy edges, confetti of squiggles, dots and triangles, thick black outlines on everything. The decoration keeps to purple, black and pale tints, so the four strong colours mean one thing each: a ride’s wait — teal short, yellow middling, hot pink long, grey hatched down. Each ride is a badge with its wait in large type, and a purple dashed route strings the shortest waits together from the gate (minutes on foot). On the right the day’s entries, the average wait and the rides down, today’s shows and the average wait by the hour. The park is made up. Example data.',
  },
  connectors: [PARK],
  document,
  snapshot,
};
