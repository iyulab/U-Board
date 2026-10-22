import type { Binding, CanvasView, ElementDefinition, Node, Widget } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { svgDataUrl } from '../frame.js';
import { snapshot } from '../snapshots/observatory-glass.js';

// An observatory's night set in stained glass: lead lines on a dark wall, every dome a tall lancet window of coloured
// glass with the dome's telescope and its target leaded into it. A dome's state is told by the roundel at the top of its
// window, as well as by the colour of its glass: a gold star when the dome is open and observing, a half-lit disc when it
// waits for its next target, a dark disc when it is closed, a red cross when it is out for service. Below, the sky's
// readings in a rose window and the night's programme; on the right the observatory's name under an arch, the figures
// now, the key and the cloud cover through the night on a dark pane. The observatory is made up, so the values are
// example data.

export const OBSERVATORY: ExampleSampleConnector = {
  key: 'observatory',
  name: '예시 천문대 API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 천문대가 아닙니다' },
};

/** The dome controllers and the sky station report every minute; ten minutes of silence is a source that has stopped. */
const MAX_AGE_SECONDS = 10 * 60;

const bind = (path: string, valuePath: string): Binding => ({
  adapter: OBSERVATORY.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
});

const WIDTH = 1600;
const HEIGHT = 1000;
const WALL = '#14131b';
const LEAD = '#0b0a10';
const PALE = '#f1e6c8';
const GOLD = '#f0c04a';
const RUBY = '#c0392b';
const SAPPHIRE = '#2b4f9e';
const EMERALD = '#2f8a5f';
const AMETHYST = '#6b3f99';
const INK = '#1d1a24';
const SERIF = '"Noto Serif KR", "Batang", "Georgia", serif';
const TEXT = '"Pretendard", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';

/** Coloured glass in panes: a few quarries of one hue, the lead between them. */
const glass = (hue: string) =>
  `linear-gradient(115deg,transparent 0 31%,${LEAD} 31% 32%,transparent 32% 64%,${LEAD} 64% 65%,transparent 65%),linear-gradient(25deg,transparent 0 45%,${LEAD} 45% 46%,transparent 46%),radial-gradient(circle at 30% 20%,rgba(255,255,255,.35),transparent 55%),${hue}`;

/** A pale glass plate for words, leaded in. */
const plate = `background:linear-gradient(160deg,#fbf3da,${PALE});border:4px solid ${LEAD};color:${INK}`;

// ── The wall ───────────────────────────────────────────────────────────────────────────────────────────────────

function drawing(): string {
  const stars = Array.from({ length: 60 }, (_, i) => `<circle cx="${(i * 263) % WIDTH}" cy="${(i * 151) % HEIGHT}" r="${0.6 + (i % 3) * 0.5}" fill="#3a3852"/>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<rect width="${WIDTH}" height="${HEIGHT}" fill="${WALL}"/>
${stars}
<rect x="10" y="10" width="${WIDTH - 20}" height="${HEIGHT - 20}" fill="none" stroke="#2c2a3a" stroke-width="4"/>
<rect x="1030" y="450" width="540" height="510" rx="8" fill="#0f0e15" stroke="${LEAD}" stroke-width="8"/>
<rect x="1036" y="456" width="528" height="498" rx="5" fill="none" stroke="${AMETHYST}" stroke-width="3"/>
</svg>`;
  return svgDataUrl(svg);
}

// ── Elements ───────────────────────────────────────────────────────────────────────────────────────────────────

/** A dome as a lancet window — read from `d`. */
const dome: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['d'], properties: { d: { type: 'object' } } },
  template: `<article class="lc {{d.state}}"><i></i><div><b>{{d.name}}</b><small>{{d.scope}}</small><p>{{d.target}}</p><em>{{d.word}}</em><dl><dt>노출</dt><dd>{{d.frames}}</dd><dt>돔</dt><dd>{{d.slit}}</dd></dl></div></article>`,
  style: `.lc{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr;justify-items:center;gap:10px;padding:22px 14px 14px;border:8px solid ${LEAD};border-radius:112px 112px 6px 6px / 120px 120px 6px 6px;background:${glass(SAPPHIRE)};box-shadow:0 0 0 2px #2c2a3a;font-family:${TEXT}}
i{width:66px;height:66px;border-radius:50%;border:6px solid ${LEAD};box-sizing:border-box;display:grid;place-items:center;font-style:normal;font-size:30px;line-height:1;background:radial-gradient(circle,#2a2838,#14131b);color:#5a5870}
div{width:100%;box-sizing:border-box;${plate};display:grid;grid-template-rows:auto auto auto auto 1fr;gap:3px;padding:12px 12px;border-radius:4px}
b{font:700 21px ${SERIF}}
small{font-size:13px}
p{margin:4px 0 0;font:700 16px ${SERIF};min-height:42px}
em{font-style:normal;font-size:15px;font-weight:800;padding:3px 8px;justify-self:start;border:2px solid ${LEAD}}
dl{margin:6px 0 0;align-self:end;display:grid;grid-template-columns:auto 1fr;column-gap:8px;font-size:14px;border-top:2px solid ${LEAD};padding-top:6px}
dt{font-weight:700}
dd{margin:0;text-align:right}
.open{background:${glass(EMERALD)}}
.open i{background:radial-gradient(circle,#fff3c0,${GOLD} 60%,#a77a12);color:${INK}}
.open i::before{content:"✦"}
.open em{background:${GOLD}}
.standby{background:${glass(SAPPHIRE)}}
.standby i{background:linear-gradient(90deg,${GOLD} 50%,#2a2838 50%);color:${INK}}
.standby i::before{content:"◐";color:transparent}
.standby em{background:#dfe6f6}
.closed{background:${glass(AMETHYST)}}
.closed i::before{content:"○"}
.closed em{background:#e5dcef}
.service{background:${glass(RUBY)}}
.service i{background:radial-gradient(circle,#ffd7cf,${RUBY} 65%);color:#ffffff}
.service i::before{content:"✕"}
.service em{background:${RUBY};color:#ffffff}`,
  size: { width: 225, height: 420 },
};

/** The sky's readings in a rose window — read from `s`. */
const sky: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['s'], properties: { s: { type: 'object' } } },
  template: `<section class="rw {{s.state}}"><ol>{{#s.readings}}<li><small>{{label}}</small><b>{{value}}</b></li>{{/s.readings}}</ol><div><small>하늘</small><b>{{s.word}}</b><span>{{s.note}}</span></div></section>`,
  style: `.rw{position:relative;height:100%;aspect-ratio:1;margin:0 auto;box-sizing:border-box;border-radius:50%;border:10px solid ${LEAD};background:repeating-conic-gradient(from 22.5deg,${SAPPHIRE} 0 40deg,${LEAD} 40deg 45deg,${AMETHYST} 45deg 85deg,${LEAD} 85deg 90deg);font-family:${TEXT};overflow:hidden}
ol{position:absolute;inset:0;margin:0;padding:0;list-style:none}
li{position:absolute;width:118px;height:70px;margin:-35px -59px;box-sizing:border-box;${plate};border-radius:10px;display:grid;align-content:center;justify-items:center;text-align:center}
li:nth-child(1){left:50%;top:17%}
li:nth-child(2){left:83%;top:50%}
li:nth-child(3){left:50%;top:83%}
li:nth-child(4){left:17%;top:50%}
li small{font-size:12px;font-weight:700}
li b{font:700 21px ${SERIF}}
div{position:absolute;left:50%;top:50%;width:150px;height:150px;margin:-75px;box-sizing:border-box;border-radius:50%;border:8px solid ${LEAD};display:grid;align-content:center;justify-items:center;text-align:center;background:radial-gradient(circle,#fff3c0,${GOLD} 70%);color:${INK}}
div small{font-size:12px;font-weight:700}
div b{font:700 26px ${SERIF}}
div span{font-size:11px;padding:0 10px}
.poor div{background:radial-gradient(circle,#e8e2ef,#8d86a3 70%)}`,
  size: { width: 440, height: 440 },
};

/** The night's programme. */
const programme: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { time: { type: 'string' }, dome: { type: 'string' }, what: { type: 'string' }, state: { type: 'string' }, word: { type: 'string' } } } } },
  },
  template: `<section class="pg"><h2>오늘 밤 관측 계획</h2><ol>{{#items}}<li class="{{state}}"><b>{{time}}</b><span>{{dome}}</span><em>{{what}}</em><small>{{word}}</small></li>{{/items}}</ol></section>`,
  style: `.pg{height:100%;box-sizing:border-box;${plate};border-width:8px;border-radius:8px;padding:16px 20px;font-family:${TEXT};box-shadow:inset 0 0 0 4px ${GOLD}}
h2{margin:0 0 10px;font:700 21px ${SERIF};border-bottom:3px solid ${LEAD};padding-bottom:6px}
ol{margin:0;padding:0;list-style:none;display:grid;gap:6px}
li{display:grid;grid-template-columns:56px 48px 1fr 82px;align-items:center;gap:8px;padding:13px 8px;border-bottom:1px solid rgba(11,10,16,.25);font-size:15px}
b{font:700 15px ${SERIF}}
span{font-weight:800}
em{font-style:normal}
small{text-align:right;font-weight:800;font-size:13px}
.done{opacity:.6}
.done small::before{content:"✓ "}
.now{background:rgba(240,192,74,.35)}
.now small::before{content:"✦ "}
.next small::before{content:"○ "}
.alarm{background:${RUBY};color:#ffffff}
.alarm small::before{content:"✕ "}`,
  size: { width: 500, height: 460 },
};

/** The observatory's name under an arch. */
const title: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['t'], properties: { t: { type: 'object' } } },
  template: `<header class="tt"><small>{{t.series}}</small><h1>{{t.name}}</h1><div><span>{{t.date}}</span><b>{{t.time}}</b></div></header>`,
  style: `.tt{height:100%;box-sizing:border-box;display:grid;align-content:center;justify-items:center;gap:4px;padding:26px 20px 12px;border:8px solid ${LEAD};border-radius:270px 270px 8px 8px / 90px 90px 8px 8px;background:radial-gradient(circle at 50% 20%,rgba(255,255,255,.3),transparent 60%),${AMETHYST};font-family:${SERIF};text-align:center}
small,div{${plate};border-width:3px;padding:2px 14px}
small{font-size:13px;letter-spacing:.25em}
h1{margin:0;font-size:46px;font-weight:700;letter-spacing:.12em;color:#fff7dc;text-shadow:0 2px 0 ${LEAD},0 0 12px rgba(240,192,74,.6)}
div{display:flex;gap:16px;align-items:baseline}
span{font-size:15px}
b{font-size:24px}`,
  size: { width: 540, height: 170 },
};

/** The figures now, each a pale pane. */
const figures: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, value: { type: 'string' }, note: { type: 'string' } } } } },
  },
  template: `<dl class="fg">{{#items}}<div><dt>{{label}}</dt><dd>{{value}}</dd><small>{{note}}</small></div>{{/items}}</dl>`,
  style: `.fg{margin:0;height:100%;box-sizing:border-box;display:grid;grid-template-columns:repeat(3,1fr);gap:12px;font-family:${TEXT}}
div{${plate};border-width:6px;border-radius:8px;box-shadow:inset 0 0 0 3px ${GOLD};display:grid;align-content:center;justify-items:center;text-align:center}
dt{font-size:13px;font-weight:700}
dd{margin:0;font:700 30px ${SERIF}}
small{font-size:12px}`,
  size: { width: 540, height: 130 },
};

/** The key to the roundels. */
const legend: ElementDefinition = {
  render: 'template',
  props: { type: 'object', properties: {} },
  template: `<ul class="ky"><li><i class="open">✦</i>관측 중</li><li><i class="standby"></i>대기</li><li><i class="closed">○</i>닫힘</li><li><i class="service">✕</i>정비</li></ul>`,
  style: `.ky{height:100%;box-sizing:border-box;margin:0;padding:0 18px;list-style:none;display:flex;align-items:center;justify-content:space-between;${plate};border-radius:8px;font:800 14px ${TEXT}}
li{display:flex;align-items:center;gap:8px}
i{width:26px;height:26px;box-sizing:border-box;border-radius:50%;border:3px solid ${LEAD};display:grid;place-items:center;font-style:normal;font-size:13px;background:#2a2838;color:#9a98b0}
.open{background:${GOLD};color:${INK}}
.standby{background:linear-gradient(90deg,${GOLD} 50%,#2a2838 50%)}
.service{background:${RUBY};color:#ffffff}`,
  size: { width: 540, height: 56 },
};

// ── The board ──────────────────────────────────────────────────────────────────────────────────────────────────

const node = (id: string, x: number, y: number, width: number, height: number, widget: Widget): Node => ({ id, x, y, width, height, anchored: false, widget });

const DOMES = ['a', 'b', 'c', 'd'] as const;

const nodes: Node[] = [
  ...DOMES.map((id, i) => node(`dome-${id}`, 40 + i * 245, 36, 225, 420, { type: 'element:dome', props: { d: {} }, bindings: { d: bind('/observatory/domes', `/value/${id}`) } })),
  node('sky', 30, 496, 460, 460, { type: 'element:sky', props: { s: {} }, bindings: { s: bind('/observatory/sky', '/value') } }),
  node('programme', 505, 496, 500, 460, { type: 'element:programme', props: { items: [] }, bindings: { items: bind('/observatory/programme', '/value') } }),
  node('title', 1030, 36, 540, 170, { type: 'element:title', props: { t: {} }, bindings: { t: bind('/observatory/now', '/value') } }),
  node('figures', 1030, 222, 540, 130, { type: 'element:figures', props: { items: [] }, bindings: { items: bind('/observatory/figures', '/value') } }),
  node('legend', 1030, 372, 540, 56, { type: 'element:legend', props: {} }),
  node('cloud', 1050, 472, 500, 466, {
    type: 'chart.line',
    props: { title: '구름량(%) — 해 진 뒤 시간마다', data: [], mapping: { x: 'hour', y: 'cloud' }, options: { series: [{ label: '구름량', color: GOLD }] } },
    bindings: { data: bind('/observatory/cloud', '/value') },
  }),
];

const document: CanvasView = {
  kind: 'canvas',
  appearance: 'dark',
  accent: GOLD,
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes,
  connectors: [],
  elements: { dome, sky, programme, title, figures, legend },
};

export const observatoryGlass: SamplePack = {
  id: 'observatory-glass',
  title: { ko: '천문대의 밤 — 스테인드글라스', en: 'An observatory’s night — stained glass' },
  field: { ko: '천문대·과학 관측', en: 'Observatories & science' },
  kind: { ko: '돔·망원경·하늘 상태·관측 계획', en: 'Domes, telescopes, the sky and the night’s programme' },
  domain: 'environment',
  styles: ['craft'],
  summary: {
    ko: '천문대의 밤을 스테인드글라스로 — 어두운 벽에 납선, 돔마다 색유리 긴 아치 창 하나, 그 안에 망원경과 관측 대상이 납땜된 판으로. 돔 상태는 유리 색과 함께 창 꼭대기의 둥근 장식으로: 돔을 열고 관측 중이면 금빛 별, 다음 대상을 기다리면 반만 밝은 원, 닫혔으면 어두운 원, 정비 중이면 붉은 ✕. 아래에는 하늘 상태를 장미창에, 오늘 밤 관측 계획을, 오른쪽에 아치 아래 천문대 이름, 지금 수치, 범례, 어두운 유리 위 밤새 구름량. 천문대는 지어낸 것이라 예시 데이터입니다.',
    en: 'An observatory’s night set in stained glass — lead lines on a dark wall, every dome a tall lancet window of coloured glass with its telescope and target leaded in. A dome tells its state by the roundel at the top of its window, as well as by its glass’s colour: a gold star when it is open and observing, a half-lit disc when it waits for its next target, a dark disc when it is closed, a red cross when it is out for service. Below, the sky’s readings in a rose window and the night’s programme; on the right the observatory’s name under an arch, the figures now, the key and the cloud cover through the night on a dark pane. The observatory is made up. Example data.',
  },
  connectors: [OBSERVATORY],
  document,
  snapshot,
};
