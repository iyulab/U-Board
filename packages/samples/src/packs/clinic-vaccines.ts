import type { Binding, CanvasView, Connector, ElementDefinition, Node, Widget } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { svgDataUrl } from '../frame.js';
import { snapshot } from '../snapshots/clinic-vaccines.js';

// A health centre's vaccination line drawn in Art Nouveau: ivory paper, olive, gold, burgundy and a sea green, whiplash
// curves and climbing stems, arched frames with a gold rule, a medallion at the centre and an engraved serif. The four
// stages a visitor walks through — reception, screening, vaccination and observation — stand as arched panels along an
// S-shaped path, and the curves between them carry how many are waiting. Inside each panel every room shows what it is
// doing, the state told by a sign as well as a colour: a filled dot working, a ring free, two bars paused. On the right
// the vaccines in stock, one leaf for each level — three plenty, two some, one running low — the day's figures and the
// vaccinations by the hour. The centre is made up, so the values are example data.

export const CLINIC: ExampleSampleConnector = {
  key: 'clinic',
  name: '예시 보건소 API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 보건소가 아닙니다' },
};

/** The number-ticket system answers every minute; ten minutes of silence is a source that has stopped. */
const MAX_AGE_SECONDS = 10 * 60;

const bind = (path: string, valuePath: string): Binding => ({
  adapter: CLINIC.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
});

const WIDTH = 1600;
const HEIGHT = 1000;
const IVORY = '#f4ecd8';
const OLIVE = '#5f6b34';
const GOLD = '#b38b2d';
const WINE = '#7a2a34';
const SEA = '#3f6b5e';
const INK = '#2e2a22';
const SERIF = '"Cormorant Garamond", "Noto Serif KR", "Nanum Myeongjo", "Batang", serif';

/** A leaf, for the stock levels. */
const LEAF = svgDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22"><path d="M 3 19 C 3 9, 10 3, 19 3 C 19 12, 13 19, 3 19 Z" fill="${OLIVE}"/><path d="M 4 18 C 9 13, 13 9, 17 5" fill="none" stroke="${IVORY}" stroke-width="1.2"/></svg>`);

type StageId = 'reception' | 'screening' | 'injection' | 'observation';
const STAGE = { width: 340, height: 250 };
const STAGES: Record<StageId, [number, number]> = {
  reception: [80, 110],
  screening: [700, 110],
  injection: [700, 640],
  observation: [80, 640],
};
const QUEUES: { id: 'q1' | 'q2' | 'q3'; from: StageId; to: StageId }[] = [
  { id: 'q1', from: 'reception', to: 'screening' },
  { id: 'q2', from: 'screening', to: 'injection' },
  { id: 'q3', from: 'injection', to: 'observation' },
];

// ── The panel ───────────────────────────────────────────────────────────────────────────────────────────────────

function drawing(): string {
  const stem = (d: string) => `<path d="${d}" fill="none" stroke="${OLIVE}" stroke-width="3" stroke-linecap="round"/>`;
  const bud = (x: number, y: number, r: number, c: string) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/><circle cx="${x}" cy="${y}" r="${r * 0.45}" fill="${IVORY}" fill-opacity=".7"/>`;
  const leaf = (x: number, y: number, a: number) =>
    `<path transform="translate(${x} ${y}) rotate(${a})" d="M 0 0 C 6 -14, 22 -16, 30 -10 C 22 -2, 10 2, 0 0 Z" fill="${OLIVE}" fill-opacity=".85"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<defs>
<radialGradient id="glow" cx=".5" cy=".5" r=".6"><stop offset="0" stop-color="#fbf5e6"/><stop offset="1" stop-color="${IVORY}"/></radialGradient>
</defs>
<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#glow)"/>
<rect x="40" y="40" width="1040" height="920" rx="40" fill="none" stroke="${GOLD}" stroke-width="4"/>
<rect x="52" y="52" width="1016" height="896" rx="32" fill="none" stroke="${GOLD}" stroke-width="1.2"/>
${stem('M 60 940 C 72 840, 54 760, 64 660 S 54 480, 64 380')}${stem('M 1062 70 C 1050 160, 1072 240, 1058 340 S 1070 520, 1056 620')}
${leaf(62, 760, -70)}${leaf(60, 560, -110)}${leaf(1062, 240, 110)}${leaf(1060, 450, 70)}
${bud(64, 380, 10, WINE)}${bud(1056, 620, 10, WINE)}${bud(64, 662, 7, GOLD)}${bud(1058, 338, 7, GOLD)}
<path d="M 560 380 C 640 380, 680 420, 680 500 C 680 580, 640 620, 560 620 C 480 620, 440 580, 440 500 C 440 420, 480 380, 560 380 Z" fill="none" stroke="${GOLD}" stroke-width="2.5"/>
<path d="M 440 500 C 380 500, 360 450, 320 460 M 680 500 C 740 500, 760 550, 800 540" fill="none" stroke="${GOLD}" stroke-width="2"/>
<text x="560" y="78" text-anchor="middle" fill="${WINE}" font-size="20" font-family='${SERIF}' font-style="italic" letter-spacing=".2em">접수 · 예진 · 접종 · 관찰</text>
</svg>`;
  return svgDataUrl(svg);
}

// ── Elements ────────────────────────────────────────────────────────────────────────────────────────────────────

/** A stage the visitor walks through: an arched panel with its rooms — read from `s`. */
const stage: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['s'], properties: { s: { type: 'object' } } },
  template: `<section class="sg"><h3>{{s.name}}</h3><p>{{s.note}}</p><ul>{{#s.rooms}}<li class="{{st}}"><i></i><b>{{n}}</b><span>{{who}}</span></li>{{/s.rooms}}</ul></section>`,
  style: `.sg{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto auto 1fr;justify-items:center;gap:4px;padding:26px 24px 16px;background:#fbf6ea;border:3px solid ${GOLD};border-radius:170px 170px 18px 18px;box-shadow:inset 0 0 0 6px #fbf6ea,inset 0 0 0 7.5px ${GOLD};font-family:${SERIF};color:${INK}}
h3{margin:0;font-size:34px;font-weight:700;color:${WINE};letter-spacing:.3em;padding-left:.3em}
p{margin:0;font-size:14px;font-style:italic;color:${OLIVE}}
ul{margin:4px 0 0;padding:0;list-style:none;align-self:center;display:grid;gap:6px;width:100%}
li{display:grid;grid-template-columns:22px 1fr auto;align-items:center;gap:8px;padding:4px 10px;border-bottom:1px solid rgba(179,139,45,.5);font-size:17px}
b{font-weight:700}
span{font-size:15px}
i{width:14px;height:14px;box-sizing:border-box;border-radius:50%}
.on i{background:${SEA}}
.free i{border:2px solid ${SEA}}
.free span{color:${SEA}}
.pause i{border-radius:0;width:12px;border-left:4px solid ${WINE};border-right:4px solid ${WINE}}
.pause span{color:${WINE};font-style:italic}`,
  size: STAGE,
};

/** The medallion at the centre: the number being vaccinated now and the next. */
const medallion: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['now'], properties: { now: { type: 'string' }, next: { type: 'string' } } },
  template: `<div class="md"><small>지금 접종</small><b>{{now}}</b><span>다음 {{next}}번</span></div>`,
  style: `.md{height:100%;box-sizing:border-box;display:grid;place-content:center;justify-items:center;gap:2px;border-radius:50%;background:${WINE};color:${IVORY};border:4px double ${GOLD};font-family:${SERIF}}
small{font-size:15px;font-style:italic;letter-spacing:.1em}
b{font-size:56px;font-weight:700;line-height:1}
span{font-size:15px}`,
  size: { width: 200, height: 200 },
};

/** The centre's name under a gold rule. */
const title: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['name'], properties: { name: { type: 'string' }, sub: { type: 'string' }, date: { type: 'string' }, time: { type: 'string' } } },
  template: `<header class="tt"><h1>{{name}}</h1><p>{{sub}}</p><div><span>{{date}}</span><b>{{time}}</b></div></header>`,
  style: `.tt{height:100%;box-sizing:border-box;display:grid;align-content:center;justify-items:center;gap:6px;font-family:${SERIF};color:${INK};text-align:center}
h1{margin:0;font-size:44px;font-weight:700;color:${WINE};letter-spacing:.12em}
p{margin:0;font-size:16px;font-style:italic;color:${OLIVE}}
div{display:flex;align-items:baseline;gap:18px;padding-top:8px;border-top:2px solid ${GOLD};width:80%;justify-content:center}
span{font-size:17px}
b{font-size:36px;font-weight:700;color:${SEA}}`,
  size: { width: 460, height: 180 },
};

/** The vaccines in stock: one leaf for each level, with the doses left. */
const stock: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, level: { type: 'string' }, leaves: { type: 'number' }, word: { type: 'string' } } } } },
  },
  template: `<section class="sk"><h3>백신 재고</h3><ul>{{#items}}<li class="{{level}}"><b>{{name}}</b><i style="--n: {{leaves}}"></i><span>{{word}}</span></li>{{/items}}</ul></section>`,
  style: `.sk{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr;gap:6px;font-family:${SERIF};color:${INK}}
h3{margin:0;text-align:center;font-size:24px;font-weight:700;color:${WINE};letter-spacing:.2em;border-bottom:2px solid ${GOLD};padding-bottom:4px}
ul{margin:0;padding:0;list-style:none;display:grid;align-content:space-evenly}
li{display:grid;grid-template-columns:1fr 72px 120px;align-items:center;gap:8px;font-size:17px}
b{font-weight:700}
i{height:22px;width:calc(var(--n) * 22px);background:url("${LEAF}") repeat-x 0 0/22px 22px}
span{font-size:14px;text-align:right}
.low span{color:${WINE};font-weight:700}
.low b{color:${WINE}}`,
  size: { width: 460, height: 190 },
};

/** The day's figures, each under an arch. */
const figures: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, value: { type: 'string' }, note: { type: 'string' } } } } },
  },
  template: `<dl class="fg">{{#items}}<div><dt>{{label}}</dt><dd>{{value}}</dd><small>{{note}}</small></div>{{/items}}</dl>`,
  style: `.fg{margin:0;height:100%;box-sizing:border-box;display:grid;grid-template-columns:repeat(3,1fr);gap:10px;font-family:${SERIF};color:${INK}}
div{display:grid;justify-items:center;align-content:center;text-align:center;padding:12px 6px 8px;background:#fbf6ea;border:2px solid ${GOLD};border-radius:60px 60px 10px 10px}
dt{font-size:14px;font-style:italic;color:${OLIVE}}
dd{margin:0;font-size:32px;font-weight:700;color:${SEA}}
small{font-size:11px}`,
  size: { width: 460, height: 120 },
};

/** The key to the room signs. */
const legend: ElementDefinition = {
  render: 'template',
  props: { type: 'object', properties: {} },
  template: `<ul class="lg"><li class="on"><i></i>진행 중</li><li class="free"><i></i>비어 있음</li><li class="pause"><i></i>잠시 멈춤</li></ul>`,
  style: `.lg{height:100%;box-sizing:border-box;margin:0;padding:0;list-style:none;display:flex;justify-content:center;align-items:center;gap:22px;font:italic 15px ${SERIF};color:${INK}}
li{display:flex;align-items:center;gap:6px}
i{width:12px;height:12px;box-sizing:border-box;border-radius:50%}
.on i{background:${SEA}}
.free i{border:2px solid ${SEA}}
.pause i{border-radius:0;width:10px;border-left:3px solid ${WINE};border-right:3px solid ${WINE}}`,
  size: { width: 360, height: 30 },
};

// ── The board ───────────────────────────────────────────────────────────────────────────────────────────────────

const node = (id: string, x: number, y: number, width: number, height: number, widget: Widget): Node => ({ id, x, y, width, height, anchored: false, widget });

const line = ({ id, from, to }: (typeof QUEUES)[number]): Connector => ({
  id: `queue-${id}`,
  fromNodeId: `stage-${from}`,
  toNodeId: `stage-${to}`,
  label: '{{value}}',
  labelSize: 15,
  style: { route: 'curved', stroke: GOLD, strokeWidth: 4, arrow: 'end' },
  bindings: { label: bind('/clinic/queues', `/value/${id}`) },
});

const nodes: Node[] = [
  ...(Object.keys(STAGES) as StageId[]).map(id =>
    node(`stage-${id}`, STAGES[id][0], STAGES[id][1], STAGE.width, STAGE.height, { type: 'element:stage', props: { s: {} }, bindings: { s: bind('/clinic/stages', `/value/${id}`) } })
  ),
  node('medallion', 460, 400, 200, 200, {
    type: 'element:medallion',
    props: { now: '', next: '' },
    bindings: { now: bind('/clinic/serving', '/value/now'), next: bind('/clinic/serving', '/value/next') },
  }),
  node('legend', 380, 912, 360, 30, { type: 'element:legend', props: {} }),
  node('title', 1120, 30, 460, 180, {
    type: 'element:title',
    props: { name: '', sub: '', date: '', time: '' },
    bindings: { name: bind('/clinic/now', '/name'), sub: bind('/clinic/now', '/sub'), date: bind('/clinic/now', '/date'), time: bind('/clinic/now', '/time') },
  }),
  node('stock', 1120, 230, 460, 190, { type: 'element:stock', props: { items: [] }, bindings: { items: bind('/clinic/stock', '/value') } }),
  node('figures', 1120, 440, 460, 120, { type: 'element:figures', props: { items: [] }, bindings: { items: bind('/clinic/figures', '/value') } }),
  node('hours', 1120, 590, 460, 370, {
    type: 'chart.bar',
    props: { title: '시간대별 접종(명) — 14시는 20분까지', data: [], mapping: { x: 'hour', y: 'people' }, options: { series: [{ label: '접종', color: SEA }] } },
    bindings: { data: bind('/clinic/hours', '/value') },
  }),
];

const document: CanvasView = {
  kind: 'canvas',
  appearance: 'light',
  accent: WINE,
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes,
  connectors: QUEUES.map(line),
  elements: { stage, medallion, title, stock, figures, legend },
};

export const clinicVaccines: SamplePack = {
  id: 'clinic-vaccines',
  title: { ko: '보건소 예방접종 — 아르누보', en: 'A health centre’s vaccination line — Art Nouveau' },
  field: { ko: '보건·예방접종', en: 'Public health & vaccination' },
  kind: { ko: '접수부터 관찰까지의 흐름과 백신 재고', en: 'The line from reception to observation and the vaccines in stock' },
  domain: 'health',
  styles: ['art'],
  summary: {
    ko: '보건소 예방접종 현황을 아르누보로 — 상아색 종이에 올리브·금·버건디·청록, 채찍처럼 휘는 곡선과 덩굴, 금줄을 두른 아치 액자, 가운데 원형 메달, 새긴 듯한 세리프. 방문객이 거치는 접수·예진·접종·관찰 네 단계가 S자 길을 따라 아치 판으로 서고, 그 사이 곡선이 대기 인원을 실어 나릅니다. 판 안의 방마다 무엇을 하는지 색과 함께 기호로: 채운 점 진행 중, 빈 원 비어 있음, 두 막대 잠시 멈춤. 가운데 메달은 지금 접종 번호와 다음 번호. 오른쪽에 백신 재고(잎 셋 충분 · 둘 보통 · 하나 부족), 오늘 접종·평균 소요·관찰 중, 시간대별 접종. 보건소는 지어낸 것이라 예시 데이터입니다.',
    en: 'A health centre’s vaccination line in Art Nouveau — ivory paper with olive, gold, burgundy and sea green, whiplash curves and climbing stems, arched frames with a gold rule, a medallion at the centre and an engraved serif. The four stages a visitor walks through — reception, screening, vaccination and observation — stand as arched panels along an S-shaped path, the curves between them carrying how many are waiting. In each panel every room says what it is doing with a sign as well as a colour: a filled dot working, a ring free, two bars paused. The medallion shows the number being vaccinated and the next. On the right the vaccines in stock (three leaves plenty, two some, one running low), the day’s vaccinations, the average visit and the people under observation, and the vaccinations by the hour. The centre is made up. Example data.',
  },
  connectors: [CLINIC],
  document,
  snapshot,
};
