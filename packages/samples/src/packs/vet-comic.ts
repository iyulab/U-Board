import type { Binding, CanvasView, ElementDefinition, Node, Widget } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { svgDataUrl } from '../frame.js';
import { snapshot } from '../snapshots/vet-comic.js';

// An animal hospital's afternoon drawn as a comic book page: newsprint dotted with halftone, every room a panel with a
// heavy black border, a yellow caption box naming it and the room's line in a balloon. A room's state is told the way a
// comic tells a scene, as well as by a colour — the balloon's shape: a speech balloon while a patient is seen, a dotted
// thought balloon when the room stands empty, a jagged burst in red for an emergency, a cloud while it is being cleaned —
// and a sound effect in the panel's corner. The two wards are panels of kennels, each a box with its patient, hatched
// when it is watched closely and dashed when free. Below, the waiting room's queue; on the right the masthead, the
// figures in starbursts, the key and the patients registered by the hour. The hospital is made up, so the values are
// example data.

export const CLINIC: ExampleSampleConnector = {
  key: 'clinic',
  name: '예시 동물병원 API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 동물병원이 아닙니다' },
};

/** The front desk updates the board as patients move; fifteen minutes of silence is a source that has stopped. */
const MAX_AGE_SECONDS = 15 * 60;

const bind = (path: string, valuePath: string): Binding => ({
  adapter: CLINIC.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
});

const WIDTH = 1600;
const HEIGHT = 1000;
const PAPER = '#fff8ea';
const INK = '#141414';
const RED = '#e23b2e';
const YELLOW = '#ffd23f';
const CYAN = '#3fb0e0';
const COMIC = '"Black Han Sans", "Jua", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
const TEXT = '"Pretendard", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';

/** Ben-Day dots in a colour, for a panel's ground. */
const dots = (colour: string, size = 7) => `radial-gradient(circle,${colour} 1.3px,transparent 1.6px) 0 0/${size}px ${size}px`;

/** A panel: heavy black border, newsprint inside, a hard shadow off the page. */
const panel = `box-sizing:border-box;border:5px solid ${INK};box-shadow:5px 5px 0 ${INK};background:${dots('#cfe6f2')},${PAPER}`;

/** A caption box: yellow, black edge, set at a tilt. */
const caption = `display:inline-block;padding:3px 10px;background:${YELLOW};border:3px solid ${INK};font:900 17px ${COMIC};color:${INK};transform:rotate(-2deg)`;

/** A jagged burst, as a polygon. */
const BURST =
  'polygon(50% 0,61% 22%,85% 8%,78% 33%,100% 38%,80% 54%,96% 76%,70% 72%,64% 100%,50% 79%,36% 100%,30% 72%,4% 76%,20% 54%,0 38%,22% 33%,15% 8%,39% 22%)';

/** A softer starburst for figures — shallow spikes, so the text inside keeps its room. */
const STAR = `polygon(${Array.from({ length: 32 }, (_, i) => {
  const a = (i / 32) * 2 * Math.PI;
  const r = i % 2 === 0 ? 50 : 41;
  return `${(50 + r * Math.sin(a)).toFixed(1)}% ${(50 - r * Math.cos(a)).toFixed(1)}%`;
}).join(',')})`;

// ── The page ───────────────────────────────────────────────────────────────────────────────────────────────────

function drawing(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<defs><pattern id="d" width="10" height="10" patternUnits="userSpaceOnUse"><circle cx="5" cy="5" r="1.4" fill="#f1d9c2"/></pattern></defs>
<rect width="${WIDTH}" height="${HEIGHT}" fill="${PAPER}"/>
<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#d)"/>
<rect x="12" y="12" width="${WIDTH - 24}" height="${HEIGHT - 24}" fill="none" stroke="${INK}" stroke-width="2"/>
<rect x="1035" y="481" width="540" height="480" fill="${INK}"/>
<rect x="1030" y="476" width="540" height="480" fill="#ffffff" stroke="${INK}" stroke-width="5"/>
</svg>`;
  return svgDataUrl(svg);
}

// ── Elements ───────────────────────────────────────────────────────────────────────────────────────────────────

/** A consulting, surgery or treatment room as a panel — read from `r`. */
const room: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['r'], properties: { r: { type: 'object' } } },
  template: `<article class="pn {{r.state}}"><header><b>{{r.room}}</b><i></i></header><div class="bb"><p>{{r.line}}</p></div><dl><dt>환자</dt><dd>{{r.patient}}</dd><dt>담당</dt><dd>{{r.vet}}</dd><dt>경과</dt><dd>{{r.elapsed}}</dd></dl></article>`,
  style: `.pn{height:100%;${panel};display:grid;grid-template-rows:auto 1fr auto;gap:8px;padding:12px 14px 12px;font-family:${TEXT};color:${INK};overflow:hidden}
header{display:flex;justify-content:space-between;align-items:flex-start}
header b{${caption}}
i{font:900 24px ${COMIC};font-style:normal;color:${INK};transform:rotate(6deg);-webkit-text-stroke:1px ${INK}}
.bb{position:relative;display:grid;place-items:center;margin:2px 14px 12px;padding:10px 14px;background:#ffffff;border:3px solid ${INK};border-radius:50% / 46%}
.bb::after{content:"";position:absolute;bottom:-17px;left:30%;width:22px;height:17px;background:${INK};clip-path:polygon(0 0,100% 0,10% 100%)}
p{margin:0;font:800 17px ${TEXT};text-align:center;line-height:1.3}
dl{margin:0;display:grid;grid-template-columns:auto 1fr;column-gap:10px;row-gap:1px;font-size:14px;background:#ffffff;border:2px solid ${INK};padding:5px 9px}
dt{font-weight:700}
dd{margin:0;text-align:right}
.busy i::before{content:"끄덕끄덕"}
.free .bb{border-style:dashed;border-radius:46%}
.free .bb::after{width:18px;height:13px;bottom:-22px;left:26%;border-radius:50%;clip-path:none;background:#ffffff;border:2px solid ${INK}}
.free .bb::before{content:"";position:absolute;width:9px;height:7px;bottom:-34px;left:22%;border-radius:50%;background:#ffffff;border:2px solid ${INK}}
.free p{font-weight:600;color:#555}
.free i::before{content:"쉿…";color:#777}
.urgent{background:${dots('#f7b9a8')},${PAPER}}
.urgent .bb{border:none;border-radius:0;background:${INK};clip-path:${BURST};padding:30px 40px;margin:0}
.urgent .bb::before{content:"";position:absolute;inset:4px;background:${RED};clip-path:${BURST}}
.urgent .bb::after{display:none}
.urgent p{position:relative;color:#ffffff;font:900 17px ${COMIC}}
.urgent i::before{content:"삐뽀!";color:${YELLOW};-webkit-text-stroke:1.5px ${INK};font-size:30px}
.clean .bb{border-radius:40% 44% 38% 46% / 52% 48% 56% 44%;border-color:${CYAN};border-width:4px;box-shadow:0 0 0 3px #ffffff,0 0 0 5px ${INK}}
.clean .bb::after{display:none}
.clean i::before{content:"치익—";color:${CYAN};-webkit-text-stroke:1px ${INK}}`,
  size: { width: 310, height: 290 },
};

/** A ward as a panel of kennels — read from `w`. */
const ward: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['w'], properties: { w: { type: 'object' } } },
  template: `<article class="wd"><header><b>{{w.room}}</b><span><strong>{{w.used}}</strong> / {{w.of}}</span></header><ol>{{#w.kennels}}<li class="{{state}}"><b>{{name}}</b><small>{{note}}</small></li>{{/w.kennels}}</ol><p>{{w.note}}</p></article>`,
  style: `.wd{height:100%;${panel};display:grid;grid-template-rows:auto 1fr auto;gap:8px;padding:12px 14px;font-family:${TEXT};color:${INK};overflow:hidden}
header{display:flex;justify-content:space-between;align-items:center}
header b{${caption}}
span{font:900 18px ${COMIC}}
strong{font-size:30px}
ol{margin:0;padding:0;list-style:none;display:grid;grid-template-columns:repeat(3,1fr);grid-auto-rows:1fr;gap:8px}
li{position:relative;display:grid;align-content:center;justify-items:center;text-align:center;background:#ffffff;border:3px solid ${INK};padding:2px;overflow:hidden}
li b{font:900 16px ${COMIC}}
li small{font-size:11px;line-height:1.2}
.watch{background:repeating-linear-gradient(-45deg,#ffffff 0 5px,#ffd9d2 5px 10px)}
.watch b::after{content:" !";color:${RED}}
.watch small{color:${RED};font-weight:700}
.empty{border-style:dashed;background:transparent;color:#777}
.empty b{font:600 13px ${TEXT}}
p{margin:0;font-size:13px;background:#ffffff;border:2px solid ${INK};padding:4px 8px}`,
  size: { width: 310, height: 290 },
};

/** The waiting room's queue. */
const queue: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: {
      items: {
        type: 'array',
        items: { type: 'object', properties: { no: { type: 'string' }, name: { type: 'string' }, kind: { type: 'string' }, why: { type: 'string' }, wait: { type: 'string' }, state: { type: 'string' }, word: { type: 'string' } } },
      },
    },
  },
  template: `<section class="qu"><header><b>대기실</b><span>접수 순서 — 응급은 먼저</span></header><ol>{{#items}}<li class="{{state}}"><b>{{no}}</b><strong>{{name}}</strong><span>{{kind}}</span><em>{{why}}</em><small>{{wait}}</small><i>{{word}}</i></li>{{/items}}</ol></section>`,
  style: `.qu{height:100%;${panel};background:${dots('#f3e2a6')},${PAPER};padding:12px 18px;font-family:${TEXT};color:${INK};overflow:hidden}
header{display:flex;align-items:center;gap:14px;margin-bottom:8px}
header b{${caption}}
header span{font-size:14px;font-style:italic}
ol{margin:0;padding:0;list-style:none;display:grid;gap:3px}
li{display:grid;grid-template-columns:52px 110px 130px 1fr 70px 96px;align-items:center;gap:10px;font-size:14px;background:#ffffff;border:2px solid ${INK};padding:1px 10px}
li b{font:900 15px ${COMIC}}
strong{font:900 16px ${COMIC}}
em{font-style:normal}
small{text-align:right;font-weight:700}
i{font-style:normal;font-weight:800;text-align:center;border-radius:999px;border:2px solid ${INK};padding:1px 0}
.wait i::before{content:"○ "}
.called i{background:${YELLOW}}
.called i::before{content:"▶ "}
.urgent{background:${RED};color:#ffffff}
.urgent i{background:${INK};color:${YELLOW};border-color:${INK}}
.urgent i::before{content:"✱ "}`,
  size: { width: 960, height: 318 },
};

/** The page's masthead. */
const masthead: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['m'], properties: { m: { type: 'object' } } },
  template: `<header class="mh"><small>{{m.series}}</small><h1>{{m.name}}</h1><div><span>{{m.date}}</span><b>{{m.time}}</b></div></header>`,
  style: `.mh{height:100%;box-sizing:border-box;display:grid;align-content:center;gap:4px;padding:12px 22px;border:5px solid ${INK};box-shadow:5px 5px 0 ${INK};background:${dots('#f28a6a', 9)},${YELLOW};color:${INK}}
small{justify-self:start;padding:2px 10px;background:${INK};color:${YELLOW};font:900 14px ${COMIC};letter-spacing:.08em;transform:rotate(-2deg)}
h1{margin:0;font:900 52px ${COMIC};color:#ffffff;-webkit-text-stroke:3px ${INK};paint-order:stroke fill;text-shadow:4px 4px 0 ${RED};letter-spacing:.02em}
div{display:flex;justify-content:space-between;align-items:baseline;font:700 17px ${TEXT}}
b{font:900 30px ${COMIC};background:#ffffff;border:3px solid ${INK};padding:0 10px}`,
  size: { width: 540, height: 170 },
};

/** The figures now, each in a starburst. */
const figures: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, value: { type: 'string' }, note: { type: 'string' } } } } },
  },
  template: `<dl class="fg">{{#items}}<div><dt>{{label}}</dt><dd>{{value}}</dd><small>{{note}}</small></div>{{/items}}</dl>`,
  style: `.fg{margin:0;height:100%;box-sizing:border-box;display:grid;grid-template-columns:repeat(3,1fr);gap:8px;font-family:${TEXT};color:${INK}}
div{position:relative;display:grid;align-content:center;justify-items:center;text-align:center;padding:0 22px}
div::before{content:"";position:absolute;inset:0;background:${INK};clip-path:${STAR}}
div::after{content:"";position:absolute;inset:5px;background:#ffffff;clip-path:${STAR}}
dt,dd,small{position:relative;z-index:1}
dt{font:800 13px ${TEXT}}
dd{margin:0;font:900 30px ${COMIC};color:${RED};-webkit-text-stroke:1px ${INK}}
small{font-size:11px;font-weight:700}`,
  size: { width: 540, height: 150 },
};

/** The key to the balloons. */
const legend: ElementDefinition = {
  render: 'template',
  props: { type: 'object', properties: {} },
  template: `<ul class="lg"><li><i class="busy"></i>말풍선 — 진료 중</li><li><i class="free"></i>생각 풍선 — 빔</li><li><i class="urgent"></i>터짐 — 응급</li><li><i class="clean"></i>구름 — 소독</li></ul>`,
  style: `.lg{height:100%;box-sizing:border-box;margin:0;padding:0 14px;list-style:none;display:flex;align-items:center;justify-content:space-between;border:4px solid ${INK};background:#ffffff;font:700 13px ${TEXT};color:${INK}}
li{display:flex;align-items:center;gap:6px}
i{width:26px;height:18px;box-sizing:border-box;display:block}
.busy{border:2px solid ${INK};border-radius:50%}
.free{border:2px dashed ${INK};border-radius:46%}
.urgent{background:${RED};clip-path:${BURST};width:24px;height:24px}
.clean{border:3px solid ${CYAN};border-radius:40% 44% 38% 46% / 52% 48% 56% 44%}`,
  size: { width: 540, height: 56 },
};

// ── The board ──────────────────────────────────────────────────────────────────────────────────────────────────

const node = (id: string, x: number, y: number, width: number, height: number, widget: Widget): Node => ({ id, x, y, width, height, anchored: false, widget });

const at = (i: number) => ({ x: 40 + (i % 3) * 325, y: 40 + Math.floor(i / 3) * 305 });

const ROOMS = ['exam1', 'exam2', 'surgery', 'treatment'] as const;
const WARDS = ['dogs', 'cats'] as const;

const nodes: Node[] = [
  ...ROOMS.map((id, i) => node(`room-${id}`, at(i).x, at(i).y, 310, 290, { type: 'element:room', props: { r: {} }, bindings: { r: bind('/clinic/rooms', `/value/${id}`) } })),
  ...WARDS.map((id, i) => node(`ward-${id}`, at(i + 4).x, at(i + 4).y, 310, 290, { type: 'element:ward', props: { w: {} }, bindings: { w: bind('/clinic/wards', `/value/${id}`) } })),
  node('queue', 40, 652, 960, 318, { type: 'element:queue', props: { items: [] }, bindings: { items: bind('/clinic/queue', '/value') } }),
  node('masthead', 1030, 40, 540, 170, { type: 'element:masthead', props: { m: {} }, bindings: { m: bind('/clinic/now', '/value') } }),
  node('figures', 1030, 228, 540, 150, { type: 'element:figures', props: { items: [] }, bindings: { items: bind('/clinic/figures', '/value') } }),
  node('legend', 1030, 396, 540, 56, { type: 'element:legend', props: {} }),
  node('registered', 1050, 496, 500, 440, {
    type: 'chart.bar',
    props: { title: '시간별 접수(마리) — 15시는 20분까지', data: [], mapping: { x: 'hour', y: 'patients' }, options: { series: [{ label: '접수', color: CYAN }] } },
    bindings: { data: bind('/clinic/registered', '/value') },
  }),
];

const document: CanvasView = {
  kind: 'canvas',
  appearance: 'light',
  accent: RED,
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes,
  connectors: [],
  elements: { room, ward, queue, masthead, figures, legend },
};

export const vetComic: SamplePack = {
  id: 'vet-comic',
  title: { ko: '동물병원의 오후 — 만화책 지면', en: 'An animal hospital’s afternoon — a comic book page' },
  field: { ko: '동물병원·반려동물', en: 'Veterinary care & pets' },
  kind: { ko: '진료실·입원장·대기실·접수', en: 'Rooms, kennels, the waiting room and registrations' },
  summary: {
    ko: '동물병원의 오후를 만화책 한 쪽처럼 — 망점이 찍힌 신문 종이에 진료실·수술실·처치실이 굵은 검은 테의 칸으로, 노란 해설 상자가 방 이름을, 말풍선이 그 방의 한마디를 싣습니다. 방의 상태는 색과 함께 만화가 장면을 말하는 방식으로: 진료 중이면 말풍선, 비어 있으면 점선 생각 풍선, 응급이면 붉게 터지는 풍선, 소독 중이면 구름 — 칸 모서리에는 의성어. 입원실 두 칸은 입원장마다 상자 하나로, 집중 관찰은 빗금, 빈 장은 점선. 아래에는 대기실 순서, 오른쪽에 제호, 별 모양 수치, 범례, 시간별 접수. 동물병원은 지어낸 것이라 예시 데이터입니다.',
    en: 'An animal hospital’s afternoon drawn as a comic book page — newsprint dotted with halftone, the consulting, surgery and treatment rooms as panels with heavy black borders, a yellow caption box naming each and the room’s line in a balloon. A room tells its state the way a comic tells a scene, as well as by colour: a speech balloon while a patient is seen, a dotted thought balloon when it stands empty, a red burst for an emergency, a cloud while it is cleaned — and a sound effect in the corner. The two wards are panels of kennels, hatched when a patient is watched closely and dashed when free. Below, the waiting room’s queue; on the right the masthead, the figures in starbursts, the key and the patients registered by the hour. The hospital is made up. Example data.',
  },
  connectors: [CLINIC],
  document,
  snapshot,
};
