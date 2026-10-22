import type { Binding, CanvasView, ElementDefinition, Node, Widget } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { svgDataUrl } from '../frame.js';
import { snapshot } from '../snapshots/aquarium-labels.js';

// An aquarium's life support set out as a natural history cabinet: a dark wood case lined with green felt, every tank a
// specimen label pinned to it — cream card, a double rule, the catalogue number typewritten, the tank's name in serif,
// the species in italic Latin, the water's readings set against dotted leaders. A tank's state is told the way a curator
// marks a card, as well as by a colour: a ring for sound, a triangle on a yellow tag to watch, a cross on a red ribbon
// across the corner when something is wrong. Below, the feeding rounds on a long label; on the right a brass plaque with
// the aquarium's name, the figures now, the key and the visitors coming in through the day on a card. The aquarium is made
// up, so the values are example data.

export const TANKS: ExampleSampleConnector = {
  key: 'aquarium',
  name: '예시 수족관 API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 수족관이 아닙니다' },
};

/** The probes report every minute; fifteen minutes of silence is a source that has stopped. */
const MAX_AGE_SECONDS = 15 * 60;

const bind = (path: string, valuePath: string): Binding => ({
  adapter: TANKS.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
});

const WIDTH = 1600;
const HEIGHT = 1000;
const WOOD = '#4a2f1d';
const FELT = '#27463a';
const CARD = '#f6f0dc';
const INK = '#2a2622';
const WATCH = '#e8c547';
const ALARM = '#b3261e';
const BRASS = '#c9a24a';
const SERIF = '"Noto Serif KR", "Batang", "Georgia", serif';
const TYPE = '"Courier New", "Nanum Gothic Coding", monospace';

/** A specimen card: cream, a fine double rule inside its edge, a little shadow where it stands off the felt. */
const card = `background:${CARD};box-shadow:inset 0 0 0 5px ${CARD},inset 0 0 0 6px ${INK},inset 0 0 0 8px ${CARD},inset 0 0 0 9px ${INK},2px 4px 0 rgba(0,0,0,.35)`;

type TankId = 't1' | 't2' | 't3' | 't4' | 't5' | 't6' | 't7' | 't8' | 't9';

// ── The cabinet ────────────────────────────────────────────────────────────────────────────────────────────────

function drawing(): string {
  const pin = (x: number, y: number) => `<circle cx="${x}" cy="${y}" r="5" fill="#d9d4c7"/><circle cx="${x - 1.5}" cy="${y - 1.5}" r="1.6" fill="#ffffff"/>`;
  const pins = [0, 1, 2].flatMap(r => [0, 1, 2].map(c => pin(200 + c * 320, 58 + r * 226))).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<rect width="${WIDTH}" height="${HEIGHT}" fill="${WOOD}"/>
<rect x="18" y="18" width="984" height="964" fill="${FELT}"/>
<rect x="18" y="18" width="984" height="964" fill="none" stroke="#2d1c11" stroke-width="6"/>
<rect x="1018" y="18" width="564" height="964" fill="#3a2416"/>
<rect x="1030" y="470" width="540" height="490" fill="${CARD}" stroke="${INK}"/>
<rect x="1036" y="476" width="528" height="478" fill="none" stroke="${INK}" stroke-width=".8"/>
<line x1="18" y1="728" x2="1002" y2="728" stroke="#1d362c" stroke-width="2"/>
${pins}
</svg>`;
  return svgDataUrl(svg);
}

// ── Elements ───────────────────────────────────────────────────────────────────────────────────────────────────

/** A tank as a specimen label — read from `t`. */
const tank: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['t'], properties: { t: { type: 'object' } } },
  template: `<article class="lb {{t.state}}"><header><span>{{t.no}}</span><i></i></header><h2>{{t.name}}</h2><p>{{t.latin}}</p><dl><dt>수온</dt><dd><span>{{t.temp}}</span></dd><dt>pH</dt><dd><span>{{t.ph}}</span></dd><dt>용존 산소</dt><dd><span>{{t.oxygen}}</span></dd></dl><small>{{t.note}}</small></article>`,
  style: `.lb{position:relative;height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto auto auto 1fr auto;padding:16px 20px 12px;${card};font-family:${SERIF};color:${INK};overflow:hidden}
header{display:flex;justify-content:space-between;align-items:center;font:700 14px ${TYPE};letter-spacing:.08em}
i{width:22px;height:22px;display:grid;place-items:center;font:700 15px ${SERIF};font-style:normal;box-sizing:border-box}
h2{margin:2px 0 0;font-size:21px;font-weight:700}
p{margin:0;font-size:15px;font-style:italic}
dl{margin:6px 0 0;display:grid;grid-template-columns:auto 1fr;column-gap:8px;row-gap:1px;font-size:14px;align-content:start}
dd{margin:0;text-align:right;font:700 14px ${TYPE};background:radial-gradient(circle,${INK} .8px,transparent 1px) 0 72%/6px 6px repeat-x;padding-left:30px}
dd span{background:${CARD};padding-left:6px}
small{font-size:13px;font-style:italic;border-top:1px solid ${INK};padding-top:4px}
.ok i{border:2px solid ${INK};border-radius:50%}
.watch i{background:${WATCH};clip-path:polygon(50% 6%,96% 94%,4% 94%);padding-top:5px;font-size:12px}
.watch i::after{content:"!"}
.watch small{background:${WATCH};padding:3px 6px;border-top:none;font-style:normal;font-weight:700}
.alarm::after{content:"✕ 경보";position:absolute;top:16px;right:-34px;width:130px;padding:3px 0;text-align:center;transform:rotate(45deg);background:${ALARM};color:${CARD};font:700 13px ${SERIF};letter-spacing:.2em}
.alarm i{visibility:hidden}
.alarm small{color:${ALARM};font-style:normal;font-weight:700}`,
  size: { width: 300, height: 206 },
};

/** The feeding rounds on a long label. */
const feeding: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { time: { type: 'string' }, tank: { type: 'string' }, what: { type: 'string' }, state: { type: 'string' }, word: { type: 'string' } } } } },
  },
  template: `<section class="fd"><h2>먹이 주기 — 오늘</h2><ol>{{#items}}<li class="{{state}}"><b>{{time}}</b><span>{{tank}}</span><em>{{what}}</em><small>{{word}}</small></li>{{/items}}</ol></section>`,
  style: `.fd{height:100%;box-sizing:border-box;padding:16px 24px;${card};font-family:${SERIF};color:${INK}}
h2{margin:0 0 4px;font-size:19px;font-weight:700;border-bottom:1px solid ${INK};padding-bottom:4px}
ol{margin:0;padding:0;list-style:none;display:grid;gap:2px}
li{display:grid;grid-template-columns:70px 170px 1fr 110px;align-items:baseline;gap:12px;font-size:16px;padding:3px 0;border-bottom:1px dotted ${INK}}
b{font:700 16px ${TYPE}}
em{font-size:15px}
small{font-size:14px;text-align:right}
.done{opacity:.65}
.done small::before{content:"✓ "}
.next small{font-weight:700}
.next small::before{content:"○ "}
.held small{color:${ALARM};font-weight:700}
.held small::before{content:"✕ "}`,
  size: { width: 940, height: 234 },
};

/** The aquarium's name on a brass plaque. */
const plaque: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['p'], properties: { p: { type: 'object' } } },
  template: `<header class="pq"><small>{{p.series}}</small><h1>{{p.name}}</h1><div><span>{{p.date}}</span><b>{{p.time}}</b></div></header>`,
  style: `.pq{height:100%;box-sizing:border-box;display:grid;align-content:center;justify-items:center;gap:6px;padding:14px;border-radius:6px;background:linear-gradient(160deg,#e3c574,${BRASS} 45%,#9c7a2e);box-shadow:inset 0 0 0 3px #7a5c1c,inset 0 0 0 6px #e9d08c,0 4px 0 rgba(0,0,0,.4);font-family:${SERIF};color:#2e2107;text-align:center}
small{font-size:13px;letter-spacing:.35em}
h1{margin:0;font-size:36px;font-weight:700;letter-spacing:.1em}
div{display:flex;gap:16px;align-items:baseline}
span{font-size:16px}
b{font:700 28px ${TYPE}}`,
  size: { width: 540, height: 170 },
};

/** The figures now, each on a small card. */
const figures: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, value: { type: 'string' }, note: { type: 'string' } } } } },
  },
  template: `<dl class="fg">{{#items}}<div><dt>{{label}}</dt><dd>{{value}}</dd><small>{{note}}</small></div>{{/items}}</dl>`,
  style: `.fg{margin:0;height:100%;box-sizing:border-box;display:grid;grid-template-columns:repeat(3,1fr);gap:14px;font-family:${SERIF};color:${INK}}
div{display:grid;align-content:center;justify-items:center;text-align:center;${card}}
dt{font-size:14px;font-style:italic}
dd{margin:0;font-size:30px;font-weight:700}
small{font-size:12px}`,
  size: { width: 540, height: 120 },
};

/** The key to the curator's marks. */
const legend: ElementDefinition = {
  render: 'template',
  props: { type: 'object', properties: {} },
  template: `<ul class="lg"><li><i class="ok"></i>양호</li><li><i class="watch">!</i>주의 — 노란 쪽지</li><li><i class="alarm">✕</i>경보 — 붉은 띠</li></ul>`,
  style: `.lg{height:100%;box-sizing:border-box;margin:0;padding:0 18px;list-style:none;display:flex;align-items:center;justify-content:space-between;${card};font:15px ${SERIF};color:${INK}}
li{display:flex;align-items:center;gap:8px}
i{width:20px;height:20px;box-sizing:border-box;display:grid;place-items:center;font-style:normal;font-weight:700}
.ok{border:2px solid ${INK};border-radius:50%}
.watch{background:${WATCH};clip-path:polygon(50% 6%,96% 94%,4% 94%);padding-top:5px;font-size:11px}
.alarm{color:${ALARM};font-size:18px}`,
  size: { width: 540, height: 50 },
};

// ── The board ──────────────────────────────────────────────────────────────────────────────────────────────────

const node = (id: string, x: number, y: number, width: number, height: number, widget: Widget): Node => ({ id, x, y, width, height, anchored: false, widget });

const TANK_IDS: TankId[] = ['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8', 't9'];

const nodes: Node[] = [
  ...TANK_IDS.map((id, i) =>
    node(`tank-${id}`, 50 + (i % 3) * 320, 60 + Math.floor(i / 3) * 226, 300, 206, { type: 'element:tank', props: { t: {} }, bindings: { t: bind('/aquarium/tanks', `/value/${id}`) } })
  ),
  node('feeding', 50, 738, 940, 234, { type: 'element:feeding', props: { items: [] }, bindings: { items: bind('/aquarium/feeding', '/value') } }),
  node('plaque', 1030, 40, 540, 170, { type: 'element:plaque', props: { p: {} }, bindings: { p: bind('/aquarium/now', '/value') } }),
  node('figures', 1030, 230, 540, 120, { type: 'element:figures', props: { items: [] }, bindings: { items: bind('/aquarium/figures', '/value') } }),
  node('legend', 1030, 380, 540, 50, { type: 'element:legend', props: {} }),
  node('visitors', 1050, 490, 500, 450, {
    type: 'chart.bar',
    props: { title: '시간별 입장(명) — 15시는 30분까지', data: [], mapping: { x: 'hour', y: 'visitors' }, options: { series: [{ label: '입장', color: '#3d6b58' }] } },
    bindings: { data: bind('/aquarium/visitors', '/value') },
  }),
];

const document: CanvasView = {
  kind: 'canvas',
  appearance: 'light',
  accent: ALARM,
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes,
  connectors: [],
  elements: { tank, feeding, plaque, figures, legend },
};

export const aquariumLabels: SamplePack = {
  id: 'aquarium-labels',
  title: { ko: '수족관 생명유지 — 박물관 표본 라벨', en: 'An aquarium’s life support — museum specimen labels' },
  field: { ko: '수족관·동물 관리', en: 'Aquariums & animal care' },
  kind: { ko: '수조 수질·먹이 주기·입장객', en: 'Tank water, feeding rounds and visitors' },
  domain: 'leisure',
  styles: ['print'],
  summary: {
    ko: '수족관의 생명유지를 자연사 박물관 표본장처럼 — 초록 펠트를 댄 짙은 나무 장에 수조마다 표본 라벨이 핀으로 꽂힙니다. 크림색 카드에 가는 이중 테, 타자기 글씨 목록 번호, 바른 글자 수조 이름, 기울인 라틴어 학명, 점선 지시선 옆 수온·pH·용존 산소. 수조 상태는 색과 함께 큐레이터의 표시로: 원 양호, 노란 쪽지의 세모 주의, 모서리를 가로지르는 붉은 띠와 ✕ 경보. 아래에는 먹이 주기를 긴 라벨로, 오른쪽에 놋쇠 명판, 지금 수치, 범례, 시간별 입장. 수족관은 지어낸 것이라 예시 데이터입니다.',
    en: 'An aquarium’s life support set out as a natural history cabinet — a dark wood case lined with green felt, every tank a specimen label pinned to it: cream card with a fine double rule, the catalogue number typewritten, the tank’s name in serif, the species in italic Latin, the water’s readings against dotted leaders. A tank tells its state the way a curator marks a card, as well as by colour — a ring sound, a triangle on a yellow tag to watch, a red ribbon across the corner with a cross when something is wrong. Below, the feeding rounds on a long label; on the right a brass plaque, the figures now, the key and the visitors by the hour. The aquarium is made up. Example data.',
  },
  connectors: [TANKS],
  document,
  snapshot,
};
