import type { Binding, CanvasView, ElementDefinition, Node, Widget } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { svgDataUrl } from '../frame.js';
import { snapshot } from '../snapshots/school-chalkboard.js';

// A middle school's day chalked on a blackboard: the slate-green board with its wooden ledge, the floor plan drawn in
// chalk lines, every room a chalk box, chalk-coloured headings in yellow, pink and blue. Each classroom says who is in it
// and what they are doing now; the special rooms say which class came to them, so a class that moved for science reads
// as an empty room at home and a full lab down the corridor. A room's state is told by a chalk sign as well as a colour —
// a full circle in lesson, an arrow moved out, a pencil a test, an empty ring free — and the room's outline is dashed when
// nobody is in it. Along the bottom the lunch rota and the day's notes; on the right the school's name, the period and
// the clock, today's attendance, the key, and the absences of the last two weeks. The school is made up, so the values
// are example data.

export const SCHOOL: ExampleSampleConnector = {
  key: 'school',
  name: '예시 학사 API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 학교가 아닙니다' },
};

/** The school office updates the board every period; an hour of silence is a source that has stopped. */
const MAX_AGE_SECONDS = 60 * 60;

const bind = (path: string, valuePath: string): Binding => ({
  adapter: SCHOOL.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
});

const WIDTH = 1600;
const HEIGHT = 1000;
const SLATE = '#2e4537';
const CHALK = '#eef0e6';
const YELLOW = '#f2dc7a';
const PINK = '#f2a7b8';
const BLUE = '#a9d3ef';
const WOOD = '#8a5a34';
const HAND = '"Gaegu", "Nanum Pen Script", "Comic Sans MS", "Noto Sans KR", cursive';

/** A chalk line: slightly rough, never perfectly solid. */
const chalkStroke = (colour = CHALK, opacity = 0.85) => `stroke="${colour}" stroke-opacity="${opacity}" stroke-width="3" stroke-linecap="round" fill="none"`;

// ── The board ──────────────────────────────────────────────────────────────────────────────────────────────────

function drawing(): string {
  // Chalk dust: a few faint smears where yesterday's writing was wiped.
  const smear = (x: number, y: number, w: number, h: number, r: number) =>
    `<ellipse cx="${x}" cy="${y}" rx="${w}" ry="${h}" transform="rotate(${r} ${x} ${y})" fill="${CHALK}" fill-opacity=".05"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<rect width="${WIDTH}" height="${HEIGHT}" fill="${WOOD}"/>
<rect x="18" y="18" width="${WIDTH - 36}" height="${HEIGHT - 60}" rx="6" fill="${SLATE}"/>
<rect x="18" y="${HEIGHT - 42}" width="${WIDTH - 36}" height="24" fill="#6e4526"/>
<rect x="300" y="${HEIGHT - 50}" width="46" height="10" rx="3" fill="${CHALK}"/><rect x="360" y="${HEIGHT - 50}" width="38" height="10" rx="3" fill="${YELLOW}"/><rect x="1220" y="${HEIGHT - 54}" width="90" height="16" rx="4" fill="#555"/>
${smear(400, 120, 260, 40, -4)}${smear(900, 820, 300, 50, 3)}${smear(1380, 600, 180, 60, -8)}
<path d="M60 96 H1084 M60 96 V584 M1084 96 V584 M60 584 H1084" ${chalkStroke()}/>
<path d="M60 324 H1084 M60 356 H1084" ${chalkStroke()} stroke-dasharray="14 10"/>
<text x="76" y="347" fill="${CHALK}" fill-opacity=".7" font-size="18" font-family='${HAND}'>복 도</text>
<text x="1030" y="347" fill="${CHALK}" fill-opacity=".7" font-size="18" font-family='${HAND}'>계단</text>
<text x="66" y="78" fill="${YELLOW}" font-size="26" font-family='${HAND}' font-weight="700">2층 교실 배치</text>
<path d="M66 84 q120 6 210 0" ${chalkStroke(YELLOW)}/>
<text x="66" y="640" fill="${PINK}" font-size="26" font-family='${HAND}' font-weight="700">점심 · 오늘 알림</text>
<path d="M66 646 q120 6 230 0" ${chalkStroke(PINK)}/>
<line x1="1120" y1="70" x2="1120" y2="${HEIGHT - 80}" ${chalkStroke(CHALK, 0.35)}/>
</svg>`;
  return svgDataUrl(svg);
}

// ── Elements ───────────────────────────────────────────────────────────────────────────────────────────────────

/** A room on the plan as a chalk box — read from `r`. */
const room: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['r'], properties: { r: { type: 'object' } } },
  template: `<section class="rm {{r.state}}"><header><b>{{r.name}}</b><i></i></header><p>{{r.word}}</p><small>{{r.note}}</small></section>`,
  style: `.rm{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr auto;gap:2px;padding:8px 12px;border:3px solid rgba(238,240,230,.85);border-radius:4px 10px 6px 12px;font-family:${HAND};color:${CHALK}}
header{display:flex;align-items:center;justify-content:space-between}
b{font-size:24px;font-weight:700}
i{width:22px;height:22px;display:grid;place-items:center;font:700 18px ${HAND};font-style:normal}
p{margin:0;align-self:center;font-size:22px}
small{font-size:16px;opacity:.85}
.lesson i::after{content:"";width:14px;height:14px;border-radius:50%;background:${CHALK}}
.moved{border-style:dashed}
.moved i::after{content:"→";color:${BLUE}}
.moved p{color:${BLUE}}
.test i::after{content:"✎";color:${YELLOW}}
.test p{color:${YELLOW}}
.test{border-color:${YELLOW}}
.free{border-style:dashed;border-color:rgba(238,240,230,.4)}
.free i{border:2px solid rgba(238,240,230,.6);border-radius:50%;width:16px;height:16px;box-sizing:border-box}
.free p,.free b{opacity:.6}
.care i::after{content:"+";color:${PINK}}
.care p{color:${PINK}}
.care{border-color:${PINK}}`,
  size: { width: 160, height: 170 },
};

/** The lunch rota, written as chalk lines. */
const lunch: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { time: { type: 'string' }, who: { type: 'string' }, note: { type: 'string' } } } } },
  },
  template: `<ol class="lu">{{#items}}<li><b>{{time}}</b><span>{{who}}</span><small>{{note}}</small></li>{{/items}}</ol>`,
  style: `.lu{margin:0;padding:0;height:100%;box-sizing:border-box;list-style:none;display:grid;align-content:start;gap:8px;font-family:${HAND};color:${CHALK}}
li{display:grid;grid-template-columns:80px 1fr;column-gap:12px}
b{grid-row:span 2;font-size:26px;color:${YELLOW}}
span{font-size:23px}
small{font-size:17px;opacity:.8}`,
  size: { width: 470, height: 230 },
};

/** The day's notes, each with its own chalk mark. */
const notes: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { text: { type: 'string' }, kind: { type: 'string' } } } } },
  },
  template: `<ul class="nt">{{#items}}<li class="{{kind}}">{{text}}</li>{{/items}}</ul>`,
  style: `.nt{margin:0;padding:0;height:100%;box-sizing:border-box;list-style:none;display:grid;align-content:start;gap:10px;font:22px ${HAND};color:${CHALK}}
li{padding-left:30px;position:relative}
li::before{position:absolute;left:0;top:0;width:24px;text-align:center}
.plan::before{content:"☐"}
.done::before{content:"☑";color:${BLUE}}
.done{opacity:.7;text-decoration:line-through;text-decoration-color:rgba(238,240,230,.6)}
.alert::before{content:"!";color:${PINK};font-weight:700}
.alert{color:${PINK}}`,
  size: { width: 500, height: 230 },
};

/** The school's name, the period and the clock, chalked at the top of the board. */
const title: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['name'], properties: { name: { type: 'string' }, date: { type: 'string' }, period: { type: 'string' }, time: { type: 'string' } } },
  template: `<header class="tt"><h1>{{name}}</h1><p>{{date}}</p><div><span>{{period}}</span><b>{{time}}</b></div></header>`,
  style: `.tt{height:100%;box-sizing:border-box;display:grid;align-content:center;gap:4px;font-family:${HAND};color:${CHALK}}
h1{margin:0;font-size:46px;font-weight:700;line-height:1.05}
p{margin:0;font-size:24px;color:${BLUE}}
div{display:flex;align-items:baseline;gap:16px}
span{font-size:30px;color:${YELLOW}}
b{margin-left:auto;font-size:52px;font-weight:700;border-bottom:3px solid rgba(238,240,230,.8)}`,
  size: { width: 430, height: 180 },
};

/** Today's attendance, tallied in chalk. */
const figures: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, value: { type: 'string' }, note: { type: 'string' } } } } },
  },
  template: `<dl class="fg">{{#items}}<div><dt>{{label}}</dt><dd>{{value}}</dd><small>{{note}}</small></div>{{/items}}</dl>`,
  style: `.fg{margin:0;height:100%;box-sizing:border-box;display:grid;grid-template-columns:repeat(3,1fr);gap:10px;font-family:${HAND};color:${CHALK}}
div{display:grid;align-content:center;justify-items:center;text-align:center;border:2px dashed rgba(238,240,230,.5);border-radius:10px 4px 12px 6px}
dt{font-size:20px;color:${BLUE}}
dd{margin:0;font-size:40px;font-weight:700}
small{font-size:16px;opacity:.8}`,
  size: { width: 430, height: 120 },
};

/** The key to the chalk signs. */
const legend: ElementDefinition = {
  render: 'template',
  props: { type: 'object', properties: {} },
  template: `<ul class="lg"><li><i class="ls"></i>수업 중</li><li><i class="mv">→</i>이동 수업</li><li><i class="ts">✎</i>시험</li><li><i class="cr">+</i>보건</li><li><i class="fr"></i>비어 있음</li></ul>`,
  style: `.lg{height:100%;box-sizing:border-box;margin:0;padding:0;list-style:none;display:flex;align-items:center;justify-content:space-between;font:18px ${HAND};color:${CHALK};white-space:nowrap}
li{display:flex;align-items:center;gap:5px}
.ls::after{content:"";width:12px;height:12px;border-radius:50%;background:${CHALK}}
i{width:20px;height:20px;display:grid;place-items:center;font-style:normal;font-weight:700}
.mv{color:${BLUE}}
.ts{color:${YELLOW}}
.cr{color:${PINK}}
.fr{border:2px solid rgba(238,240,230,.6);border-radius:50%;width:14px;height:14px}`,
  size: { width: 430, height: 40 },
};

// ── The board ──────────────────────────────────────────────────────────────────────────────────────────────────

const node = (id: string, x: number, y: number, width: number, height: number, widget: Widget): Node => ({ id, x, y, width, height, anchored: false, widget });

const NORTH = ['c1-1', 'c1-2', 'c1-3', 'c1-4', 'science', 'music'] as const;
const SOUTH = ['c2-1', 'c2-2', 'c2-3', 'c2-4', 'library', 'nurse'] as const;

const roomNode = (id: string, i: number, y: number) =>
  node(`room-${id}`, 80 + i * 168, y, 160, 170, { type: 'element:room', props: { r: {} }, bindings: { r: bind('/school/rooms', `/value/${id}`) } });

const nodes: Node[] = [
  ...NORTH.map((id, i) => roomNode(id, i, 126)),
  ...SOUTH.map((id, i) => roomNode(id, i, 384)),
  node('lunch', 80, 674, 470, 230, { type: 'element:lunch', props: { items: [] }, bindings: { items: bind('/school/lunch', '/value') } }),
  node('notes', 580, 674, 500, 230, { type: 'element:notes', props: { items: [] }, bindings: { items: bind('/school/notes', '/value') } }),
  node('title', 1146, 50, 430, 180, {
    type: 'element:title',
    props: { name: '', date: '', period: '', time: '' },
    bindings: { name: bind('/school/now', '/name'), date: bind('/school/now', '/date'), period: bind('/school/now', '/period'), time: bind('/school/now', '/time') },
  }),
  node('figures', 1146, 250, 430, 120, { type: 'element:figures', props: { items: [] }, bindings: { items: bind('/school/attendance', '/value') } }),
  node('legend', 1146, 392, 430, 40, { type: 'element:legend', props: {} }),
  node('absences', 1146, 456, 430, 470, {
    type: 'chart.bar',
    props: { title: '최근 2주 결석(명)', data: [], mapping: { x: 'day', y: 'absent' }, options: { series: [{ label: '결석', color: BLUE }] } },
    bindings: { data: bind('/school/absences', '/value') },
  }),
];

const document: CanvasView = {
  kind: 'canvas',
  appearance: 'dark',
  accent: YELLOW,
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes,
  connectors: [],
  elements: { room, lunch, notes, title, figures, legend },
};

export const schoolChalkboard: SamplePack = {
  id: 'school-chalkboard',
  title: { ko: '중학교 하루 — 칠판과 분필', en: 'A middle school’s day — chalk on a blackboard' },
  field: { ko: '교육·학교', en: 'Education & schools' },
  kind: { ko: '교실 배치·출결·점심 순서', en: 'Classrooms, attendance and the lunch rota' },
  domain: 'education',
  styles: ['craft'],
  summary: {
    ko: '중학교의 하루를 칠판에 분필로 — 나무 받침이 달린 짙은 녹색 칠판, 분필 선으로 그린 2층 교실 배치, 노랑·분홍·하늘색 분필 제목. 교실마다 지금 누가 무엇을 하는지, 특별실은 어느 반이 와 있는지 적혀 있어, 과학 수업으로 옮긴 반은 제 교실이 비고 복도 끝 과학실이 찹니다. 상태는 색과 함께 분필 기호로: ● 수업 중, → 이동 수업, ✎ 시험, + 보건, 빈 원 비어 있음 — 아무도 없는 방은 테두리가 점선. 아래에는 점심 순서와 오늘 알림, 오른쪽에 교시와 시각, 오늘 출결, 최근 2주 결석. 학교는 지어낸 것이라 예시 데이터입니다.',
    en: 'A middle school’s day chalked on a blackboard — the slate-green board on its wooden ledge, the second floor’s rooms drawn in chalk lines, headings in yellow, pink and blue chalk. Each classroom says who is in it and what they are doing; each special room which class came to it, so a class that moved for science leaves its own room empty and fills the lab down the corridor. A room tells its state with a chalk sign as well as a colour — ● in lesson, → moved out, ✎ a test, + the nurse, an empty ring free — and a room nobody is in has a dashed outline. Along the bottom the lunch rota and the day’s notes; on the right the period and the clock, today’s attendance and the absences of the last two weeks. The school is made up. Example data.',
  },
  connectors: [SCHOOL],
  document,
  snapshot,
};
