import type { Binding, CanvasView, ElementDefinition, Node, Widget } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { svgDataUrl } from '../frame.js';
import { snapshot } from '../snapshots/dam-steampunk.js';

// A dam's floodgates run from a steampunk engine room: an iron plate riveted in brass, copper pipes carrying the water's
// pressure from gauge to gauge. Every spillway gate is a pressure dial — a brass bezel, a cream face with its ticks, the
// needle at the gate's opening — with a signal lamp and an engraved plate below. A gate's state is told by its lamp and
// plate, as well as by a colour: a lit amber lamp while it discharges, a dark glass lamp when it is shut, a red lamp over
// hazard stripes when it is out for repair. In the middle the reservoir in a sight glass, its level against the marks;
// below, the operator's log on telegraph tape; on the right the dam's plaque, the flows now, the key and the discharge by
// the hour on a cream card. The dam is made up, so the values are example data.

export const DAM: ExampleSampleConnector = {
  key: 'dam',
  name: '예시 댐 운영 API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 댐이 아닙니다' },
};

/** The gate sensors report every minute; ten minutes of silence is a source that has stopped. */
const MAX_AGE_SECONDS = 10 * 60;

const bind = (path: string, valuePath: string): Binding => ({
  adapter: DAM.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
});

const WIDTH = 1600;
const HEIGHT = 1000;
const IRON = '#26201c';
const BRASS = '#c29a4a';
const COPPER = '#a85a32';
const FACE = '#efe3c2';
const INK = '#2a1f14';
const AMBER = '#ffb52e';
const RED = '#d23a26';
const SERIF = '"Noto Serif KR", "Batang", "Georgia", serif';
const TYPE = '"Courier New", "Nanum Gothic Coding", monospace';

/** Brushed brass, for a bezel or a plaque. */
const brass = `linear-gradient(160deg,#e6c77a,${BRASS} 40%,#8c6a28 70%,#d4b064)`;

/** Rivets along the edges of a plate. */
const rivets = `radial-gradient(circle at 10px 10px,#e9d08c 2.5px,#5c4418 3.5px,transparent 4px),radial-gradient(circle at calc(100% - 10px) 10px,#e9d08c 2.5px,#5c4418 3.5px,transparent 4px),radial-gradient(circle at 10px calc(100% - 10px),#e9d08c 2.5px,#5c4418 3.5px,transparent 4px),radial-gradient(circle at calc(100% - 10px) calc(100% - 10px),#e9d08c 2.5px,#5c4418 3.5px,transparent 4px)`;

/** A riveted brass plaque. */
const plaque = `box-sizing:border-box;border-radius:6px;background:${rivets},${brass};box-shadow:inset 0 0 0 2px #6e5220,inset 0 0 0 4px #e9d08c,0 4px 0 #120d0a;color:${INK}`;

// ── The engine room ────────────────────────────────────────────────────────────────────────────────────────────

function drawing(): string {
  const rivetRow = (y: number) =>
    Array.from({ length: 40 }, (_, i) => `<circle cx="${20 + i * 40}" cy="${y}" r="3" fill="#8c6a28"/>`).join('');
  const pipe = (d: string) => `<path d="${d}" fill="none" stroke="#5a2f17" stroke-width="16" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${COPPER}" stroke-width="11" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#d58a5c" stroke-width="3" stroke-linecap="round" opacity=".7"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<defs><pattern id="p" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="${IRON}"/><path d="M0 6 L6 0" stroke="#2f2823" stroke-width="1"/></pattern></defs>
<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#p)"/>
<rect x="6" y="6" width="${WIDTH - 12}" height="${HEIGHT - 12}" fill="none" stroke="${BRASS}" stroke-width="6"/>
${rivetRow(20)}${rivetRow(HEIGHT - 20)}
${pipe('M 155 288 H 905 V 40')}
${pipe('M 155 558 H 785')}
${pipe('M 155 288 V 558 M 405 288 V 558 M 655 288 V 558')}
<rect x="1035" y="451" width="540" height="514" rx="6" fill="#120d0a"/>
<rect x="1030" y="446" width="540" height="514" rx="6" fill="#16110e" stroke="${BRASS}" stroke-width="4"/>
</svg>`;
  return svgDataUrl(svg);
}

// ── Elements ───────────────────────────────────────────────────────────────────────────────────────────────────

/** A spillway gate as a pressure dial — read from `g`; the needle stands at the gate's opening. */
const gate: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['g'], properties: { g: { type: 'object' } } },
  template: `<article class="gt {{g.state}}"><div class="dl" style="--v: {{g.open}}"><i></i><span>{{g.open}} %</span></div><footer><u></u><b>{{g.name}}</b><em>{{g.word}}</em><small>{{g.flow}}</small></footer></article>`,
  style: `.gt{height:100%;box-sizing:border-box;display:grid;grid-template-rows:1fr auto;justify-items:center;gap:6px;font-family:${SERIF};color:${INK}}
.dl{position:relative;width:166px;height:166px;border-radius:50%;box-sizing:border-box;border:12px solid transparent;background:radial-gradient(circle,${FACE} 0 60%,transparent 60.5%) padding-box,conic-gradient(from -135deg,transparent 0 270.5deg,${FACE} 270.5deg) padding-box,repeating-conic-gradient(from -135deg,${INK} 0 1.4deg,transparent 1.4deg 27deg) padding-box,radial-gradient(circle,transparent 0 64%,${INK} 64.5% 66%,transparent 66.5%) padding-box,linear-gradient(${FACE},${FACE}) padding-box,${brass} border-box;box-shadow:0 0 0 2px #5c4418,0 5px 0 #120d0a}
.dl::after{content:"";position:absolute;left:50%;top:50%;width:14px;height:14px;margin:-7px;border-radius:50%;background:${brass};box-shadow:0 0 0 2px #5c4418}
i{position:absolute;left:50%;top:50%;width:4px;height:60px;margin-left:-2px;margin-top:-56px;background:${RED};transform-origin:50% 56px;transform:rotate(calc(var(--v) * 2.7deg - 135deg));clip-path:polygon(50% 0,100% 85%,100% 100%,0 100%,0 85%)}
span{position:absolute;left:0;right:0;bottom:30px;text-align:center;font:700 16px ${TYPE}}
footer{width:100%;${plaque};display:grid;grid-template-columns:auto 1fr auto;grid-template-rows:auto auto;column-gap:10px;align-items:center;padding:6px 14px}
u{grid-row:span 2;width:22px;height:22px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#6d6a64,#1c1a18);box-shadow:0 0 0 2px #5c4418}
b{font-size:17px;font-weight:700}
em{font-style:normal;font:700 14px ${TYPE};text-align:right}
small{grid-column:2 / span 2;font:13px ${TYPE}}
.open u{background:radial-gradient(circle at 35% 35%,#fff3c4,${AMBER} 55%,#a86a00);box-shadow:0 0 0 2px #5c4418,0 0 12px 3px rgba(255,181,46,.7)}
.open em::before{content:"● "}
.shut em::before{content:"○ "}
.shut .dl{filter:saturate(.6)}
.fault u{background:radial-gradient(circle at 35% 35%,#ffc2b8,${RED} 55%,#6e1208);box-shadow:0 0 0 2px #5c4418,0 0 12px 3px rgba(210,58,38,.6)}
.fault footer{background:repeating-linear-gradient(-45deg,#e8c23a 0 10px,${INK} 10px 20px);color:#ffffff}
.fault footer b,.fault footer em,.fault footer small{background:${INK};padding:0 4px}
.fault em::before{content:"✕ "}
.fault i{background:#8b8178}`,
  size: { width: 230, height: 250 },
};

/** The reservoir in a sight glass, its level against the marks — read from `r`. */
const sight: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['r'], properties: { r: { type: 'object' } } },
  template: `<section class="sg"><h2>저수위</h2><div class="tb" style="--l: {{r.level}}"><s></s><ol>{{#r.marks}}<li class="{{kind}}" style="--at: {{at}}"><span>{{label}}</span></li>{{/r.marks}}</ol></div><p><b>{{r.el}}</b><small>{{r.note}}</small></p></section>`,
  style: `.sg{height:100%;${plaque};display:grid;grid-template-rows:auto 1fr auto;justify-items:center;gap:8px;padding:16px 14px;font-family:${SERIF}}
h2{margin:0;font-size:19px;font-weight:700;letter-spacing:.2em}
.tb{position:relative;justify-self:start;margin-left:18px;width:56px;border-radius:32px;box-sizing:border-box;border:6px solid #8c6a28;background:linear-gradient(90deg,rgba(255,255,255,.35),rgba(255,255,255,.05) 40%,rgba(0,0,0,.15)),#cfd8d2;overflow:visible}
s{position:absolute;left:0;right:0;bottom:0;height:calc(var(--l) * 1%);border-radius:0 0 26px 26px;background:linear-gradient(90deg,#5fa2b8,#2c6f88 60%,#1f5266);text-decoration:none}
ol{position:absolute;inset:0;margin:0;padding:0;list-style:none}
li{position:absolute;left:-14px;right:-14px;bottom:calc(var(--at) * 1%);border-top:2px solid ${INK}}
li span{position:absolute;left:100%;top:-9px;white-space:nowrap;padding-left:4px;font:700 11px ${TYPE}}
.flood{border-top:3px solid ${RED}}
.flood span{color:#7e1a0e}
p{margin:0;display:grid;justify-items:center}
b{font:700 22px ${TYPE}}
small{font-size:12px}`,
  size: { width: 200, height: 520 },
};

/** The operator's log on telegraph tape. */
const log: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { time: { type: 'string' }, text: { type: 'string' }, state: { type: 'string' } } } } },
  },
  template: `<section class="lg"><h2>운영 일지 — 오늘</h2><ol>{{#items}}<li class="{{state}}"><b>{{time}}</b><span>{{text}}</span><i></i></li>{{/items}}</ol></section>`,
  style: `.lg{height:100%;${plaque};padding:16px 24px;font-family:${SERIF}}
h2{margin:0 0 8px;font-size:19px;font-weight:700;letter-spacing:.1em}
ol{margin:0;padding:6px 0;list-style:none;display:grid;gap:4px;background:${FACE};border-radius:3px;box-shadow:inset 0 0 0 2px #8c6a28;background-image:radial-gradient(circle,#c9b98d 2px,transparent 2.5px);background-size:14px 14px;background-position:0 50%;background-repeat:repeat-y}
li{display:grid;grid-template-columns:66px 1fr 30px;align-items:center;gap:12px;padding:8px 16px 8px 22px;font:16px ${TYPE};border-bottom:1px dashed #b9a77a}
li b{font:700 15px ${TYPE}}
i{font-style:normal;text-align:center;font-weight:700}
.info i::before{content:"·"}
.warn{background:rgba(255,181,46,.22)}
.warn i::before{content:"!";color:#8a5200}
.alarm{background:${RED};color:#ffffff}
.alarm i::before{content:"✕"}`,
  size: { width: 960, height: 370 },
};

/** The dam's name on a plaque. */
const title: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['t'], properties: { t: { type: 'object' } } },
  template: `<header class="tt"><small>{{t.series}}</small><h1>{{t.name}}</h1><div><span>{{t.date}}</span><b>{{t.time}}</b></div></header>`,
  style: `.tt{height:100%;${plaque};display:grid;align-content:center;justify-items:center;gap:4px;padding:14px;font-family:${SERIF};text-align:center}
small{font-size:14px;letter-spacing:.3em}
h1{margin:0;font-size:44px;font-weight:700;letter-spacing:.16em;text-shadow:0 1px 0 #f3dc9a,0 -1px 0 #5c4418}
div{display:flex;gap:18px;align-items:baseline}
span{font-size:16px}
b{font:700 28px ${TYPE}}`,
  size: { width: 540, height: 160 },
};

/** The flows now, each on a small plaque. */
const figures: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, value: { type: 'string' }, note: { type: 'string' } } } } },
  },
  template: `<dl class="fg">{{#items}}<div><dt>{{label}}</dt><dd>{{value}}</dd><small>{{note}}</small></div>{{/items}}</dl>`,
  style: `.fg{margin:0;height:100%;box-sizing:border-box;display:grid;grid-template-columns:repeat(3,1fr);gap:14px;font-family:${SERIF}}
div{${plaque};display:grid;align-content:center;justify-items:center;text-align:center}
dt{font-size:14px;font-weight:700}
dd{margin:0;font:700 30px ${TYPE}}
small{font-size:12px}`,
  size: { width: 540, height: 130 },
};

/** The key to the lamps. */
const legend: ElementDefinition = {
  render: 'template',
  props: { type: 'object', properties: {} },
  template: `<ul class="ky"><li><u class="open"></u>● 방류 — 등 켜짐</li><li><u></u>○ 닫힘 — 등 꺼짐</li><li><u class="fault"></u>✕ 점검 — 붉은 등·줄무늬</li></ul>`,
  style: `.ky{height:100%;${plaque};margin:0;padding:0 18px;list-style:none;display:flex;align-items:center;justify-content:space-between;font:700 14px ${SERIF}}
li{display:flex;align-items:center;gap:8px}
u{width:18px;height:18px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#6d6a64,#1c1a18);box-shadow:0 0 0 2px #5c4418}
.open{background:radial-gradient(circle at 35% 35%,#fff3c4,${AMBER} 55%,#a86a00)}
.fault{background:radial-gradient(circle at 35% 35%,#ffc2b8,${RED} 55%,#6e1208)}`,
  size: { width: 540, height: 56 },
};

// ── The board ──────────────────────────────────────────────────────────────────────────────────────────────────

const node = (id: string, x: number, y: number, width: number, height: number, widget: Widget): Node => ({ id, x, y, width, height, anchored: false, widget });

const GATES = ['g1', 'g2', 'g3', 'g4', 'g5', 'g6'] as const;

const nodes: Node[] = [
  ...GATES.map((id, i) =>
    node(`gate-${id}`, 40 + (i % 3) * 250, 40 + Math.floor(i / 3) * 270, 230, 250, { type: 'element:gate', props: { g: {} }, bindings: { g: bind('/dam/gates', `/value/${id}`) } })
  ),
  node('reservoir', 805, 60, 200, 520, { type: 'element:sight', props: { r: {} }, bindings: { r: bind('/dam/reservoir', '/value') } }),
  node('log', 40, 596, 965, 370, { type: 'element:log', props: { items: [] }, bindings: { items: bind('/dam/log', '/value') } }),
  node('title', 1030, 40, 540, 160, { type: 'element:title', props: { t: {} }, bindings: { t: bind('/dam/now', '/value') } }),
  node('figures', 1030, 218, 540, 130, { type: 'element:figures', props: { items: [] }, bindings: { items: bind('/dam/figures', '/value') } }),
  node('legend', 1030, 366, 540, 56, { type: 'element:legend', props: {} }),
  node('discharge', 1050, 466, 500, 474, {
    type: 'chart.bar',
    props: { title: '시간별 총 방류(m³/s) — 수문 + 발전', data: [], mapping: { x: 'hour', y: 'discharge' }, options: { series: [{ label: '총 방류', color: COPPER }] } },
    bindings: { data: bind('/dam/discharge', '/value') },
  }),
];

const document: CanvasView = {
  kind: 'canvas',
  appearance: 'dark',
  accent: AMBER,
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes,
  connectors: [],
  elements: { gate, sight, log, title, figures, legend },
};

export const damSteampunk: SamplePack = {
  id: 'dam-steampunk',
  title: { ko: '댐 수문 방류 — 스팀펑크 기관실', en: 'A dam’s floodgates — a steampunk engine room' },
  field: { ko: '댐·수자원', en: 'Dams & water resources' },
  kind: { ko: '수문 개도·저수위·방류·운영 일지', en: 'Gate openings, reservoir level, discharge and the log' },
  domain: 'energy',
  styles: ['retro'],
  summary: {
    ko: '댐의 수문 방류를 스팀펑크 기관실처럼 — 놋쇠 리벳을 박은 쇠판 위로 구리 관이 계기에서 계기로 이어집니다. 수문마다 압력계 하나: 놋쇠 테, 눈금이 새겨진 크림색 판, 바늘이 가리키는 개도, 그 아래 신호등과 새긴 명판. 수문 상태는 색과 함께 등과 명판으로: 방류 중이면 호박색 등이 켜지고, 닫히면 등이 꺼진 유리, 점검 중이면 붉은 등과 경고 줄무늬. 가운데에는 저수지를 수위 유리관으로 표시선과 함께, 아래에는 전신 테이프 같은 운영 일지, 오른쪽에 댐 명판, 지금 유량, 범례, 크림색 카드 위 시간별 방류. 댐은 지어낸 것이라 예시 데이터입니다.',
    en: 'A dam’s floodgates run from a steampunk engine room — an iron plate riveted in brass, copper pipes running from gauge to gauge. Every spillway gate is a pressure dial: a brass bezel, a cream face with its ticks, the needle at the gate’s opening, a signal lamp and an engraved plate below. A gate tells its state by its lamp and plate, as well as by colour: an amber lamp lit while it discharges, dark glass when it is shut, a red lamp over hazard stripes when it is out for repair. In the middle the reservoir in a sight glass against its marks; below, the operator’s log on telegraph tape; on the right the dam’s plaque, the flows now, the key and the discharge by the hour on a cream card. The dam is made up. Example data.',
  },
  connectors: [DAM],
  document,
  snapshot,
};
