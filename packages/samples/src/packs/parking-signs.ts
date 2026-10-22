import type { Binding, CanvasView, ElementDefinition, Node, Widget } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { svgDataUrl } from '../frame.js';
import { snapshot } from '../snapshots/parking-signs.js';

// A public car park told the way a road tells a driver: on asphalt with its lane lines, under a gantry, every part is a
// road sign — a green guide sign with a white rim and bold sign lettering for the name and for each floor, a black
// variable-message panel with amber figures for the spaces free, blue information signs for the bays kept for electric
// cars, disabled drivers and small cars, and a white notice board. A floor's state is told by the shape of its sign, as
// road signs do, as well as by its colour — a blue square P free, a yellow triangle filling, a red ring full, an orange
// diamond closed. On the right the day's figures and how full the car park has been hour by hour. The car park is made
// up, so the values are example data.

export const PARK: ExampleSampleConnector = {
  key: 'park',
  name: '예시 주차장 API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 주차장이 아닙니다' },
};

/** The bay sensors report every half minute; five minutes of silence is a source that has stopped. */
const MAX_AGE_SECONDS = 5 * 60;

const bind = (path: string, valuePath: string): Binding => ({
  adapter: PARK.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
});

const WIDTH = 1600;
const HEIGHT = 1000;
const ASPHALT = '#2a2c2e';
const GUIDE = '#00703c';
const INFO = '#0f4c9c';
const AMBER = '#ffb81c';
const WARN = '#ffd100';
const STOP = '#d7261e';
const WORK = '#f28c28';
const WHITE = '#ffffff';
const SIGN = '"Hangil", "Noto Sans KR", "Malgun Gothic", "Arial", sans-serif';

/** A sign panel: its colour, a white rim inset from the edge, rounded corners. */
const panel = (colour: string) =>
  `background:${colour};border-radius:12px;box-shadow:inset 0 0 0 4px ${colour},inset 0 0 0 7px ${WHITE},0 6px 0 rgba(0,0,0,.35)`;

type FloorId = 'f3' | 'f2' | 'f1' | 'b1' | 'b2' | 'b3' | 'b4';

// ── The road ───────────────────────────────────────────────────────────────────────────────────────────────────

function drawing(): string {
  const dashes = (y: number) => `<line x1="0" y1="${y}" x2="${WIDTH}" y2="${y}" stroke="${WHITE}" stroke-opacity=".55" stroke-width="6" stroke-dasharray="60 50"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<rect width="${WIDTH}" height="${HEIGHT}" fill="${ASPHALT}"/>
<rect x="0" y="0" width="${WIDTH}" height="200" fill="#232527"/>
<rect x="24" y="20" width="18" height="190" fill="#7d8287"/><rect x="${WIDTH - 42}" y="20" width="18" height="190" fill="#7d8287"/>
<rect x="24" y="18" width="${WIDTH - 48}" height="12" fill="#9aa0a6"/>
<line x1="0" y1="212" x2="${WIDTH}" y2="212" stroke="${WARN}" stroke-width="5"/><line x1="0" y1="222" x2="${WIDTH}" y2="222" stroke="${WARN}" stroke-width="5"/>
${dashes(600)}${dashes(980)}
<path d="M0 ${HEIGHT - 6} H${WIDTH}" stroke="${WHITE}" stroke-opacity=".8" stroke-width="6"/>
</svg>`;
  return svgDataUrl(svg);
}

// ── Elements ───────────────────────────────────────────────────────────────────────────────────────────────────

/** The car park's name as a green guide sign on the gantry. */
const title: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['name'], properties: { name: { type: 'string' }, en: { type: 'string' }, date: { type: 'string' }, time: { type: 'string' } } },
  template: `<header class="tt"><b class="p">P</b><div><h1>{{name}}</h1><p>{{en}}</p></div><aside><span>{{date}}</span><strong>{{time}}</strong></aside></header>`,
  style: `.tt{height:100%;box-sizing:border-box;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:22px;padding:0 30px;${panel(GUIDE)};font-family:${SIGN};color:${WHITE}}
.p{width:84px;height:84px;border-radius:8px;background:${INFO};box-shadow:inset 0 0 0 4px ${WHITE};display:grid;place-items:center;font-size:62px;font-weight:900}
h1{margin:0;font-size:46px;font-weight:900;letter-spacing:.02em}
p{margin:0;font-size:22px;font-weight:700;opacity:.92}
aside{display:grid;justify-items:end}
span{font-size:20px;font-weight:700}
strong{font-size:44px;font-weight:900}`,
  size: { width: 980, height: 150 },
};

/** A variable-message panel: black, amber figures. */
const vms: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['v'], properties: { v: { type: 'object' } } },
  template: `<section class="vm"><span>{{v.label}}</span><b>{{v.free}}</b><small>{{v.note}}</small></section>`,
  style: `.vm{height:100%;box-sizing:border-box;display:grid;grid-template-columns:auto auto;grid-template-rows:1fr auto;align-items:center;column-gap:22px;padding:14px 28px;background:#0b0b0b;border:6px solid #3d4146;border-radius:6px;font-family:${SIGN};color:${AMBER}}
span{font-size:30px;font-weight:800}
b{grid-row:span 2;justify-self:end;font-size:96px;font-weight:900;line-height:1;font-variant-numeric:tabular-nums}
small{font-size:18px;font-weight:700;opacity:.85}`,
  size: { width: 480, height: 150 },
};

/** A floor as a guide-sign row, its state told by the shape of a sign — read from `f`. */
const floor: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['f'], properties: { f: { type: 'object' } } },
  template: `<section class="fl {{f.state}}"><b>{{f.name}}</b><i></i><span>{{f.word}}</span><strong>{{f.free}}</strong><small>{{f.note}}</small></section>`,
  style: `.fl{height:100%;box-sizing:border-box;display:grid;grid-template-columns:76px 56px 1fr auto 210px;align-items:center;gap:16px;padding:0 22px;${panel(GUIDE)};font-family:${SIGN};color:${WHITE}}
b{width:64px;height:52px;border-radius:26px;background:${WHITE};color:${GUIDE};display:grid;place-items:center;font-size:30px;font-weight:900}
i{width:48px;height:48px;display:grid;place-items:center;font:900 26px ${SIGN};font-style:normal;box-sizing:border-box}
span{font-size:28px;font-weight:800}
strong{font-size:44px;font-weight:900;font-variant-numeric:tabular-nums}
small{font-size:17px;font-weight:700;opacity:.92;text-align:right}
.free i{background:${INFO};border-radius:6px;box-shadow:inset 0 0 0 3px ${WHITE};color:${WHITE}}
.free i::after{content:"P"}
.busy i{background:${WARN};clip-path:polygon(50% 4%,98% 94%,2% 94%);color:#111;padding-top:12px}
.busy i::after{content:"!"}
.full i{border-radius:50%;background:${WHITE};box-shadow:inset 0 0 0 7px ${STOP};color:#111;font-size:15px}
.full i::after{content:"만차"}
.full strong{color:#ffd3cf}
.shut{background:#3f4448;box-shadow:inset 0 0 0 4px #3f4448,inset 0 0 0 7px #c8ccd0,0 6px 0 rgba(0,0,0,.35)}
.shut b{color:#3f4448}
.shut i{background:${WORK};transform:rotate(45deg) scale(.78);border:3px solid #111}
.shut i::after{content:"";}
.shut strong{opacity:.6}`,
  size: { width: 820, height: 80 },
};

/** Bays kept for some drivers, each a blue information sign. */
const bays: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { mark: { type: 'string' }, label: { type: 'string' }, free: { type: 'string' }, note: { type: 'string' } } } } },
  },
  template: `<ul class="by">{{#items}}<li><i>{{mark}}</i><span>{{label}}</span><b>{{free}}</b><small>{{note}}</small></li>{{/items}}</ul>`,
  style: `.by{margin:0;padding:0;height:100%;box-sizing:border-box;list-style:none;display:grid;grid-template-columns:repeat(3,1fr);gap:14px;font-family:${SIGN};color:${WHITE}}
li{display:grid;justify-items:center;align-content:center;gap:2px;text-align:center;${panel(INFO)}}
i{width:44px;height:44px;border-radius:50%;background:${WHITE};color:${INFO};display:grid;place-items:center;font:900 24px ${SIGN};font-style:normal}
span{font-size:19px;font-weight:800}
b{font-size:34px;font-weight:900}
small{font-size:14px;font-weight:700;opacity:.9}`,
  size: { width: 620, height: 170 },
};

/** The day's figures on a white notice panel. */
const figures: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, value: { type: 'string' }, note: { type: 'string' } } } } },
  },
  template: `<dl class="fg">{{#items}}<div><dt>{{label}}</dt><dd>{{value}}</dd><small>{{note}}</small></div>{{/items}}</dl>`,
  style: `.fg{margin:0;height:100%;box-sizing:border-box;display:grid;grid-template-columns:repeat(3,1fr);padding:10px 8px;${panel(WHITE)};box-shadow:inset 0 0 0 4px ${WHITE},inset 0 0 0 7px #111,0 6px 0 rgba(0,0,0,.35);font-family:${SIGN};color:#111}
div{display:grid;justify-items:center;align-content:center;text-align:center}
div+div{border-left:2px solid #111}
dt{font-size:17px;font-weight:800}
dd{margin:0;font-size:34px;font-weight:900}
small{font-size:14px;font-weight:700}`,
  size: { width: 620, height: 124 },
};

/** Notices to drivers, on a yellow warning board. */
const notices: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['items'], properties: { items: { type: 'array', items: { type: 'object', properties: { text: { type: 'string' } } } } } },
  template: `<ul class="nt">{{#items}}<li>{{text}}</li>{{/items}}</ul>`,
  style: `.nt{margin:0;height:100%;box-sizing:border-box;list-style:none;display:grid;align-content:center;gap:4px;padding:0 26px;${panel(WARN)};box-shadow:inset 0 0 0 4px ${WARN},inset 0 0 0 7px #111,0 6px 0 rgba(0,0,0,.35);font:800 21px ${SIGN};color:#111}
li::before{content:"▶ "}`,
  size: { width: 820, height: 100 },
};

/** The key to the sign shapes. */
const legend: ElementDefinition = {
  render: 'template',
  props: { type: 'object', properties: {} },
  template: `<ul class="lg"><li><i class="fr">P</i>여유</li><li><i class="bs">!</i>혼잡 — 15% 미만</li><li><i class="fu"></i>만차</li><li><i class="sh"></i>폐쇄</li></ul>`,
  style: `.lg{height:100%;box-sizing:border-box;margin:0;padding:0 18px;list-style:none;display:flex;align-items:center;justify-content:space-between;background:#111;border-radius:8px;font:800 17px ${SIGN};color:${WHITE};white-space:nowrap}
li{display:flex;align-items:center;gap:8px}
i{width:26px;height:26px;display:grid;place-items:center;font-style:normal;font-weight:900;box-sizing:border-box}
.fr{background:${INFO};border-radius:4px;box-shadow:inset 0 0 0 2px ${WHITE}}
.bs{background:${WARN};clip-path:polygon(50% 4%,98% 94%,2% 94%);color:#111;padding-top:7px;font-size:13px}
.fu{border-radius:50%;background:${WHITE};box-shadow:inset 0 0 0 5px ${STOP}}
.sh{background:${WORK};transform:rotate(45deg) scale(.75);border:2px solid ${WHITE}}`,
  size: { width: 620, height: 46 },
};

// ── The board ──────────────────────────────────────────────────────────────────────────────────────────────────

const node = (id: string, x: number, y: number, width: number, height: number, widget: Widget): Node => ({ id, x, y, width, height, anchored: false, widget });

const FLOORS: FloorId[] = ['f3', 'f2', 'f1', 'b1', 'b2', 'b3', 'b4'];

const nodes: Node[] = [
  node('title', 60, 40, 980, 150, {
    type: 'element:title',
    props: { name: '', en: '', date: '', time: '' },
    bindings: { name: bind('/park/now', '/name'), en: bind('/park/now', '/en'), date: bind('/park/now', '/date'), time: bind('/park/now', '/time') },
  }),
  node('vms', 1060, 40, 480, 150, { type: 'element:vms', props: { v: {} }, bindings: { v: bind('/park/total', '/value') } }),
  ...FLOORS.map((id, i) => node(`floor-${id}`, 60, 246 + i * 92, 820, 80, { type: 'element:floor', props: { f: {} }, bindings: { f: bind('/park/floors', `/value/${id}`) } })),
  node('notices', 60, 892, 820, 90, { type: 'element:notices', props: { items: [] }, bindings: { items: bind('/park/notices', '/value') } }),
  node('bays', 920, 246, 620, 170, { type: 'element:bays', props: { items: [] }, bindings: { items: bind('/park/bays', '/value') } }),
  node('figures', 920, 436, 620, 124, { type: 'element:figures', props: { items: [] }, bindings: { items: bind('/park/figures', '/value') } }),
  node('legend', 920, 578, 620, 46, { type: 'element:legend', props: {} }),
  node('hours', 920, 646, 620, 324, {
    type: 'chart.line',
    props: { title: '시간대별 점유율(%) — 운영 480면 기준', data: [], mapping: { x: 'hour', y: 'occupied' }, options: { series: [{ label: '점유율', color: AMBER }] } },
    bindings: { data: bind('/park/hours', '/value') },
  }),
];

const document: CanvasView = {
  kind: 'canvas',
  appearance: 'dark',
  accent: AMBER,
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes,
  connectors: [],
  elements: { title, vms, floor, bays, figures, notices, legend },
};

export const parkingSigns: SamplePack = {
  id: 'parking-signs',
  title: { ko: '공영주차장 층별 빈 면 — 도로 표지판', en: 'A public car park’s free spaces by floor — road signs' },
  field: { ko: '주차·도시 교통', en: 'Parking & city traffic' },
  kind: { ko: '층별 빈 면·전용 구획·시간대별 점유율', en: 'Free spaces by floor, kept bays and occupancy by the hour' },
  domain: 'transport',
  styles: ['signage'],
  summary: {
    ko: '공영주차장을 운전자에게 길이 말하는 방식으로 — 차선이 그어진 아스팔트와 문형 지주 아래, 모든 칸이 도로 표지판입니다. 흰 테를 두른 초록 안내 표지에 이름과 층마다 빈 면, 검은 가변 전광판에 호박색 숫자로 전체 빈 면, 파란 안내 표지에 전기차·장애인·경차 전용 구획, 노란 주의 표지에 운전자 안내. 층의 상태는 도로 표지처럼 모양으로도 말합니다: 파란 네모 P 여유, 노란 세모 혼잡, 빨간 원 만차, 주황 마름모 폐쇄. 오른쪽에 오늘 수치와 시간대별 점유율. 주차장은 지어낸 것이라 예시 데이터입니다.',
    en: 'A public car park told the way a road tells a driver — on lane-marked asphalt under a gantry, every part is a road sign. Green guide signs with a white rim carry the name and each floor’s free spaces, a black variable-message panel the total in amber, blue information signs the bays kept for electric cars, disabled drivers and small cars, and a yellow board the notices to drivers. A floor tells its state by the shape of its sign, as road signs do, as well as by colour — a blue square P free, a yellow triangle filling, a red ring full, an orange diamond closed. On the right the day’s figures and how full it has been hour by hour. The car park is made up. Example data.',
  },
  connectors: [PARK],
  document,
  snapshot,
};
