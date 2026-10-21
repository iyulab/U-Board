import type { Binding, CanvasView, ComponentDefinition, ElementDefinition, Node, Widget } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { svgDataUrl } from '../frame.js';
import { BEDS, snapshot } from '../snapshots/ward-beds.js';

// The bed board on the wall of a hospital ward's nurse station, set in the Swiss style: white paper, black type
// in a heavy grotesque, one red, everything on a strict grid. The ward's plan — eight rooms either side of the
// corridor, an isolation room, the station — with every bed one component: its number, who is in it (masked), the
// day of their stay, and its state in black, red, grey or outline. On the right the census in very large figures,
// today's admissions and discharges, the staffing, the week's occupancy and who is coming up from the emergency
// room. No public source carries a ward's beds, so the values are example data written for it.

export const WARD: ExampleSampleConnector = {
  key: 'ward',
  name: '예시 병동 병상 관리 API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 병원·환자가 아닙니다' },
};

/** Bed states change when a nurse marks them; ten minutes without an answer is a source that has stopped. */
const MAX_AGE_SECONDS = 10 * 60;

const bind = (path: string, valuePath: string): Binding => ({
  adapter: WARD.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
});

/** One field of the bed an instance is given — `{{bed}}` is its number. */
const bindBed = (field: string): Binding => ({
  adapter: WARD.key,
  ref: { path: '/ward/beds', item: { list: '/value', where: { id: '{{bed}}' } }, valuePath: `/${field}`, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
});

const WIDTH = 1600;
const HEIGHT = 900;
const BLACK = '#111111';
const GREY = '#8a8a8a';
const RULE = '#d4d4d4';
const RED = '#e3001b';
const SWISS = '"Helvetica Neue", Helvetica, Arial, sans-serif';

/** The ward's plan: rooms above and below the corridor, each with the beds it holds, left to right. */
const PLAN = { x: 40, y: 150, width: 1000, height: 700 };
const ROOM_HEIGHT = 290;
const CORRIDOR = { y: PLAN.y + ROOM_HEIGHT, height: 120 };
const BED = { width: 104, height: 112, gap: 10 };

interface Room {
  id: string;
  x: number;
  width: number;
  top: boolean;
  kind: string;
}

const ROOMS: Room[] = [
  { id: '701', x: 0, width: 250, top: true, kind: '4인실' },
  { id: '702', x: 250, width: 250, top: true, kind: '4인실' },
  { id: '703', x: 500, width: 250, top: true, kind: '2인실' },
  { id: '704', x: 750, width: 125, top: true, kind: '격리' },
  { id: '705', x: 875, width: 125, top: true, kind: '1인실' },
  { id: '706', x: 0, width: 250, top: false, kind: '4인실' },
  { id: '707', x: 250, width: 250, top: false, kind: '4인실' },
  { id: '708', x: 500, width: 250, top: false, kind: '2인실' },
];
const STATION = { x: 750, width: 250 };

/** Where each bed of a room stands: two by two in a four-bed room, side by side otherwise — centred across the room,
 *  below its number. */
function bedPlaces(room: Room): Array<{ x: number; y: number }> {
  const count = BEDS.filter(id => id.startsWith(room.id)).length;
  const columns = Math.min(count, 2);
  const rows = Math.ceil(count / 2);
  const across = columns * BED.width + (columns - 1) * BED.gap;
  const down = rows * BED.height + (rows - 1) * BED.gap;
  const left = PLAN.x + room.x + (room.width - across) / 2;
  const roomTop = room.top ? PLAN.y : CORRIDOR.y + CORRIDOR.height;
  const top = roomTop + 44 + (ROOM_HEIGHT - 44 - down) / 2;
  return Array.from({ length: count }, (_, i) => ({ x: left + (i % 2) * (BED.width + BED.gap), y: top + Math.floor(i / 2) * (BED.height + BED.gap) }));
}

// ── The drawing ─────────────────────────────────────────────────────────────────────────────────────────────────

function drawing(): string {
  const text = (x: number, y: number, body: string, size: number, weight = 700, fill = BLACK, anchor = 'start') =>
    `<text x="${x}" y="${y}" fill="${fill}" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}" font-family='${SWISS}'>${body}</text>`;
  const room = (r: Room) => {
    const y = r.top ? PLAN.y : CORRIDOR.y + CORRIDOR.height;
    const x = PLAN.x + r.x;
    return `<rect x="${x}" y="${y}" width="${r.width}" height="${ROOM_HEIGHT}" fill="none" stroke="${BLACK}" stroke-width="2"/>${text(x + 12, y + 30, r.id, 22)}${text(x + r.width - 10, y + 28, r.kind, 13, 500, GREY, 'end')}`;
  };
  const stationY = CORRIDOR.y + CORRIDOR.height;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<rect width="${WIDTH}" height="${HEIGHT}" fill="#ffffff"/>
<rect x="40" y="40" width="64" height="64" fill="${RED}"/>
<path d="M 64 48 h 16 v 16 h 16 v 16 h -16 v 16 h -16 v -16 h -16 v -16 h 16 Z" fill="#ffffff"/>
<line x1="40" y1="128" x2="${WIDTH - 40}" y2="128" stroke="${BLACK}" stroke-width="4"/>
${ROOMS.map(room).join('\n')}
<rect x="${PLAN.x + STATION.x}" y="${stationY}" width="${STATION.width}" height="${ROOM_HEIGHT}" fill="#f2f2f2" stroke="${BLACK}" stroke-width="2"/>
${text(PLAN.x + STATION.x + 16, stationY + 34, '간호사실', 22)}
${text(PLAN.x + 16, CORRIDOR.y + CORRIDOR.height / 2 + 8, '복도', 18, 500, GREY)}
<line x1="1080" y1="150" x2="1080" y2="${HEIGHT - 40}" stroke="${BLACK}" stroke-width="2"/>
</svg>`;
  return svgDataUrl(svg);
}

// ── Elements ────────────────────────────────────────────────────────────────────────────────────────────────────

/** The ward's name and the hour, set large on the top rule. */
const masthead: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['ward', 'time'], properties: { ward: { type: 'string' }, hospital: { type: 'string' }, date: { type: 'string' }, time: { type: 'string' } } },
  template: `<header class="ms"><h1>{{ward}}</h1><p>{{hospital}}</p><time><b>{{time}}</b>{{date}}</time></header>`,
  style: `.ms{height:100%;box-sizing:border-box;display:grid;grid-template-columns:auto 1fr auto;align-items:end;gap:24px;font-family:${SWISS};color:${BLACK}}
h1{margin:0;font-size:56px;line-height:.9;font-weight:800;letter-spacing:-.02em}
p{margin:0 0 4px;font-size:18px;color:${GREY}}
time{display:grid;justify-items:end;font-size:16px;color:${GREY}}
b{font-size:44px;line-height:1;font-weight:800;color:${BLACK};font-variant-numeric:tabular-nums}`,
  size: { width: 1440, height: 72 },
};

/** A bed: its number, who is in it (masked) and the day of their stay, and its state as black, red, grey or outline. */
const bed: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['no', 'state'],
    properties: {
      no: { type: 'string' },
      state: { enum: ['in', 'out-today', 'cleaning', 'free', 'isolation', 'coming'] },
      who: { type: 'string' },
      day: { type: 'string' },
      note: { type: 'string' },
      fall: { type: 'boolean' },
    },
  },
  template: `<article class="bed {{state}}"><header><b>{{no}}</b>{{#fall}}<i>낙상</i>{{/fall}}</header><span>{{who}}</span><em>{{day}}</em><small>{{note}}</small></article>`,
  style: `.bed{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto auto 1fr auto;padding:8px 9px;font-family:${SWISS};background:${BLACK};color:#fff;overflow:hidden}
header{display:flex;justify-content:space-between;align-items:center;gap:4px;white-space:nowrap}
b{font-size:22px;font-weight:800;letter-spacing:-.02em}
i{flex:none;font-style:normal;font-size:10px;font-weight:700;padding:1px 4px;background:#fff;color:${BLACK}}
span{font-size:15px;font-weight:700;margin-top:2px}
em{font-style:normal;font-size:13px;opacity:.75}
small{font-size:12px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.out-today{background:${RED}}
.cleaning{background:repeating-linear-gradient(135deg,${RULE} 0 6px,#f4f4f4 6px 12px);color:${BLACK}}
.free{background:#fff;color:${BLACK};outline:2px solid ${BLACK};outline-offset:-2px}
.free span,.cleaning span{color:${GREY}}
.isolation{outline:5px solid ${RED};outline-offset:-5px;padding:10px 12px}
.coming{background:#fff;color:${RED};outline:2px dashed ${RED};outline-offset:-2px}`,
  size: { width: BED.width, height: BED.height },
};

/** The census: beds filled out of the ward's, very large, and what makes up the rest. */
const census: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['filled', 'total'],
    properties: { filled: { type: 'number' }, total: { type: 'number' }, rate: { type: 'number' }, parts: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, value: { type: 'number' }, red: { type: 'boolean' } } } } },
  },
  template: `<section class="cs"><p class="big"><b>{{filled}}</b><span>/{{total}}</span><em>재원 {{rate}}%</em></p><dl>{{#parts}}<div class="{{#red}}red{{/red}}"><dt>{{label}}</dt><dd>{{value}}</dd></div>{{/parts}}</dl></section>`,
  style: `.cs{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr;gap:12px;font-family:${SWISS};color:${BLACK}}
.big{margin:0;display:flex;align-items:baseline;gap:6px}
.big b{font-size:132px;line-height:.8;font-weight:800;letter-spacing:-.05em;font-variant-numeric:tabular-nums}
.big span{font-size:44px;font-weight:800;color:${GREY}}
.big em{font-style:normal;margin-left:auto;font-size:18px;font-weight:700}
dl{margin:0;display:grid;grid-template-columns:repeat(3,1fr);border-top:2px solid ${BLACK}}
div{padding:8px 0 0;border-right:1px solid ${RULE};padding-left:10px}
div:first-child{padding-left:0}
dt{font-size:13px;color:${GREY}}
dd{margin:0;font-size:36px;font-weight:800;font-variant-numeric:tabular-nums}
.red dd{color:${RED}}`,
  size: { width: 480, height: 220 },
};

/** A heading on a short black rule, as the Swiss style sets its sections. */
const heading: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['text'], properties: { text: { type: 'string' }, note: { type: 'string' } } },
  template: `<h2 class="hd">{{text}}<small>{{note}}</small></h2>`,
  style: `.hd{margin:0;height:100%;box-sizing:border-box;display:flex;align-items:end;justify-content:space-between;gap:12px;border-bottom:2px solid ${BLACK};padding-bottom:4px;font:800 17px ${SWISS};color:${BLACK}}
small{font-size:13px;font-weight:500;color:${GREY}}`,
  size: { width: 480, height: 30 },
};

/** Who is coming up to the ward: from where, when, and the bed kept for them. */
const coming: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { from: { type: 'string' }, who: { type: 'string' }, when: { type: 'string' }, bed: { type: 'string' } } } } },
  },
  template: `<ol class="cm">{{#items}}<li><b>{{when}}</b><span>{{from}} · {{who}}</span><em>{{bed}}</em></li>{{/items}}</ol>`,
  style: `.cm{height:100%;box-sizing:border-box;margin:0;padding:0;list-style:none;display:grid;align-content:start;font-family:${SWISS};color:${BLACK}}
li{display:grid;grid-template-columns:64px 1fr auto;gap:12px;align-items:baseline;padding:7px 0;border-bottom:1px solid ${RULE};font-size:15px}
b{font-size:18px;font-weight:800;font-variant-numeric:tabular-nums}
em{font-style:normal;font-weight:800;color:${RED}}`,
  size: { width: 480, height: 130 },
};

/** The bed states as the board draws them. */
const legend: ElementDefinition = {
  render: 'template',
  props: { type: 'object', properties: {} },
  template: `<ul class="lg"><li><i class="in"></i>재원</li><li><i class="out"></i>오늘 퇴원</li><li><i class="cl"></i>청소 중</li><li><i class="fr"></i>빈 병상</li><li><i class="co"></i>입원 예정</li><li><i class="is"></i>격리</li></ul>`,
  style: `.lg{height:100%;box-sizing:border-box;margin:0;padding:0;list-style:none;display:flex;align-items:center;gap:18px;font:600 14px ${SWISS};color:${BLACK}}
li{display:flex;align-items:center;gap:6px;white-space:nowrap}
i{width:16px;height:16px;background:${BLACK}}
.out{background:${RED}}.cl{background:repeating-linear-gradient(135deg,${RULE} 0 3px,#f4f4f4 3px 6px)}
.fr{background:#fff;outline:2px solid ${BLACK};outline-offset:-2px}.co{background:#fff;outline:2px dashed ${RED};outline-offset:-2px}
.is{background:#fff;outline:4px solid ${RED};outline-offset:-4px}`,
  size: { width: 640, height: 30 },
};

// ── The board ───────────────────────────────────────────────────────────────────────────────────────────────────

const bedComponent: ComponentDefinition = {
  params: { type: 'object', required: ['bed'], properties: { bed: { type: 'string' } } },
  nodes: [
    {
      id: 'bed',
      x: 0,
      y: 0,
      width: BED.width,
      height: BED.height,
      widget: {
        type: 'element:bed',
        props: { no: '{{bed}}', state: 'free', who: '', day: '', note: '', fall: false },
        bindings: { state: bindBed('state'), who: bindBed('who'), day: bindBed('day'), note: bindBed('note'), fall: bindBed('fall') },
      },
    },
  ],
};

const node = (id: string, x: number, y: number, width: number, height: number, widget: Widget): Node => ({ id, x, y, width, height, anchored: false, widget });

const RIGHT = { x: 1110, width: 450 };

const nodes: Node[] = [
  node('masthead', 120, 36, 1440, 72, {
    type: 'element:masthead',
    props: { ward: '', hospital: '', date: '', time: '' },
    bindings: { ward: bind('/ward/now', '/ward'), hospital: bind('/ward/now', '/hospital'), date: bind('/ward/now', '/date'), time: bind('/ward/now', '/time') },
  }),
  node('legend', PLAN.x, 862, 700, 30, { type: 'element:legend', props: {} }),
  node('census', RIGHT.x, 156, RIGHT.width, 220, {
    type: 'element:census',
    props: { filled: 0, total: 0, rate: 0, parts: [] },
    bindings: { filled: bind('/ward/census', '/filled'), total: bind('/ward/census', '/total'), rate: bind('/ward/census', '/rate'), parts: bind('/ward/census', '/parts') },
  }),
  node('week-head', RIGHT.x, 396, RIGHT.width, 30, { type: 'element:heading', props: { text: '이번 주 재원율', note: '정원 22병상 · %' } }),
  node('week', RIGHT.x, 430, RIGHT.width, 220, {
    type: 'chart.bar',
    props: { data: [], mapping: { x: 'day', y: 'rate' }, options: { series: [{ label: '재원율(%)', color: BLACK }] } },
    bindings: { data: bind('/ward/week', '/value') },
  }),
  node('coming-head', RIGHT.x, 664, RIGHT.width, 30, { type: 'element:heading', props: { text: '올라올 환자', note: '' }, bindings: { note: bind('/ward/coming', '/note') } }),
  node('coming', RIGHT.x, 700, RIGHT.width, 150, { type: 'element:coming', props: { items: [] }, bindings: { items: bind('/ward/coming', '/value') } }),
];

const document: CanvasView = {
  kind: 'canvas',
  appearance: 'light',
  accent: RED,
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes,
  connectors: [],
  elements: { masthead, bed, census, heading, coming, legend },
  components: { bed: bedComponent },
  instances: ROOMS.flatMap(room => {
    const ids = BEDS.filter(id => id.startsWith(room.id));
    return bedPlaces(room).map((at, i) => ({ id: `bed-${ids[i]!}`, component: 'bed', x: at.x, y: at.y, anchored: false, params: { bed: ids[i]! } }));
  }),
};

export const wardBeds: SamplePack = {
  id: 'ward-beds',
  title: { ko: '병동 병상 현황판 — 스위스 타이포그래피', en: 'A ward’s bed board — in the Swiss style' },
  field: { ko: '의료', en: 'Healthcare' },
  kind: { ko: '병동 평면(컴포넌트 반복)', en: 'A ward plan (one component, repeated)' },
  summary: {
    ko: '병동 간호사실 벽에 거는 병상 현황판을 스위스 타이포그래피로 — 흰 종이, 굵은 검은 글자, 빨강 하나, 엄격한 격자. 복도 양쪽 병실 여덟과 격리실·간호사실 평면 위에 병상마다 컴포넌트 하나: 병상 번호, 가린 환자 표시와 재원 일수, 낙상 위험, 상태(재원 검정 · 오늘 퇴원 빨강 · 청소 중 회색 빗금 · 빈 병상 테두리 · 입원 예정 빨간 점선 · 격리 빨간 테). 오른쪽에 아주 큰 재원 수, 오늘 입원·퇴원·간호 인력, 이번 주 재원율, 응급실에서 올라올 환자. 예시 데이터입니다.',
    en: 'The bed board on a ward’s nurse-station wall, set in the Swiss style — white paper, heavy black type, one red, a strict grid. On the plan of eight rooms either side of the corridor, the isolation room and the station, every bed is one component: its number, the patient masked with their day of stay, a fall-risk tag, and its state (in: black · going home today: red · being cleaned: grey hatching · free: outline · kept for an admission: red dashes · isolation: a red rim). On the right the census in very large figures, today’s admissions, discharges and staffing, the week’s occupancy, and who is coming up from the emergency room. Example data.',
  },
  connectors: [WARD],
  document,
  snapshot,
};
