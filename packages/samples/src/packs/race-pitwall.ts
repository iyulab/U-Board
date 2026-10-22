import type { Binding, CanvasView, ElementDefinition, Node, Widget } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { svgDataUrl } from '../frame.js';
import { snapshot } from '../snapshots/race-pitwall.js';

// A race team's pit wall during a grand prix, drawn the way a race broadcast draws its graphics: black, white
// condensed italic type, one red, panels cut on a slant. The timing tower down the left — position, interval, the
// tyre each car is on and how old it is, its last lap with its sectors coloured as timing screens colour them
// (purple the session's best, green the driver's own best, yellow neither). The circuit on the right with its three
// sectors and who holds the best time in each, the pit lane and the DRS zones; below it the team's two cars' tyre
// strategy and their lap times. The race and its drivers are made up, so the values are example data written for it.

export const TIMING: ExampleSampleConnector = {
  key: 'timing',
  name: '예시 레이스 타이밍 API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 경기·선수가 아닙니다' },
};

/** Timing updates every lap; two minutes without an answer is a feed that has stopped. */
const MAX_AGE_SECONDS = 2 * 60;

const bind = (path: string, valuePath: string): Binding => ({
  adapter: TIMING.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
});

const WIDTH = 1920;
const HEIGHT = 1080;
const RED = '#e10600';
const PURPLE = '#b44dff';
const GREEN = '#27e36b';
const YELLOW = '#ffd500';
const RACE = '"Arial Narrow", "Roboto Condensed", "Helvetica Neue", Arial, sans-serif';
/** The broadcast's cut: a panel's corner sliced off on a slant. */
const CUT = 'clip-path:polygon(0 0,100% 0,100% calc(100% - 14px),calc(100% - 14px) 100%,0 100%)';

const MAP = { x: 560, y: 110, width: 1330, height: 610 };

/** The circuit's centre line, as points around the lap from the start line, clockwise. */
const TRACK: Array<[number, number]> = [
  [1010, 640], [1240, 640], [1440, 636], [1590, 612], [1700, 560], [1760, 480], [1770, 400], [1730, 330],
  [1650, 300], [1560, 320], [1500, 380], [1440, 420], [1360, 400], [1320, 330], [1340, 250], [1300, 190],
  [1200, 170], [1080, 190], [990, 240], [930, 300], [860, 330], [770, 330], [700, 380], [680, 460],
  [720, 540], [800, 600], [900, 632],
];
/** Where each sector ends, as an index into the line — sector 1 from the start to here, and so on. */
const SECTOR_ENDS = [9, 19, TRACK.length];
/** The sectors told apart on the map in light and darker greys — the timing colours are kept for what they mean. */
const SECTOR_COLOURS = ['#f2f2f2', '#8c8c96', '#f2f2f2'];

/** A closed smooth path through the points (Catmull–Rom as cubic Béziers), or an open one through a slice of them. */
function smooth(points: Array<[number, number]>, closed: boolean): string {
  const n = points.length;
  const at = (i: number) => points[closed ? (i + n) % n : Math.max(0, Math.min(n - 1, i))]!;
  let d = `M ${points[0]![0]} ${points[0]![1]}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0]} ${p2[1]}`;
  }
  return closed ? `${d} Z` : d;
}

// ── The drawing ─────────────────────────────────────────────────────────────────────────────────────────────────

function drawing(): string {
  const sector = (i: number) => {
    const from = i === 0 ? 0 : SECTOR_ENDS[i - 1]!;
    const to = SECTOR_ENDS[i]!;
    const slice = TRACK.slice(from, to + 1 > TRACK.length ? to : to + 1);
    if (to === TRACK.length) slice.push(TRACK[0]!);
    const [x, y] = TRACK[to === TRACK.length ? 0 : to]!;
    const end = i < 2 ? `<circle cx="${x}" cy="${y}" r="9" fill="#0b0b0d" stroke="#ffffff" stroke-width="3"/>` : '';
    return `<path d="${smooth(slice, false)}" fill="none" stroke="${SECTOR_COLOURS[i]}" stroke-width="7" stroke-linecap="round"/>${end}`;
  };
  const pitLane = `<path d="M 960 668 H 1300" fill="none" stroke="#6b6b6b" stroke-width="4" stroke-dasharray="10 8"/>`;
  const drs = (x1: number, y1: number, x2: number, y2: number) => `<path d="M ${x1} ${y1} L ${x2} ${y2}" stroke="#ffffff" stroke-width="18" stroke-opacity=".12" stroke-linecap="round"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<rect width="${WIDTH}" height="${HEIGHT}" fill="#0b0b0d"/>
<path d="M ${MAP.x} ${MAP.y} H ${MAP.x + MAP.width} V ${MAP.y + MAP.height - 24} L ${MAP.x + MAP.width - 24} ${MAP.y + MAP.height} H ${MAP.x} Z" fill="#141418"/>
${drs(1060, 640, 1420, 638)}${drs(1200, 170, 1000, 236)}
<path d="${smooth(TRACK, true)}" fill="none" stroke="#2c2c33" stroke-width="22" stroke-linejoin="round"/>
${[0, 1, 2].map(sector).join('')}
${pitLane}
<path d="M 1010 622 V 658" stroke="#ffffff" stroke-width="5"/>
<text x="1018" y="616" fill="#ffffff" font-size="15" font-style="italic" font-weight="700" font-family='${RACE}'>START / FINISH</text>
<text x="1130" y="690" fill="#8a8a8a" font-size="14" font-style="italic" font-family='${RACE}'>PIT LANE</text>
<text x="1240" y="626" fill="#8a8a8a" font-size="13" font-style="italic" font-family='${RACE}'>DRS 1</text>
<text x="1090" y="168" fill="#8a8a8a" font-size="13" font-style="italic" font-family='${RACE}'>DRS 2</text>
</svg>`;
  return svgDataUrl(svg);
}

// ── Elements ────────────────────────────────────────────────────────────────────────────────────────────────────

/** The race's bar along the top: its name, the lap, the flag, and the time. */
const header: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['race', 'lap', 'laps'],
    properties: { race: { type: 'string' }, circuit: { type: 'string' }, lap: { type: 'number' }, laps: { type: 'number' }, flag: { enum: ['green', 'yellow', 'sc'] }, flagText: { type: 'string' }, air: { type: 'string' }, track: { type: 'string' } },
  },
  template: `<header class="rb"><b class="red">{{race}}</b><span>{{circuit}}</span><p class="lap">LAP <strong>{{lap}}</strong> / {{laps}}</p><p class="flag {{flag}}">{{flagText}}</p><p class="wx">AIR {{air}} · TRACK {{track}}</p></header>`,
  style: `.rb{height:100%;box-sizing:border-box;display:flex;align-items:stretch;gap:0;font-family:${RACE};font-style:italic;color:#fff;text-transform:uppercase}
.red{display:flex;align-items:center;padding:0 30px 0 24px;background:${RED};font-size:34px;font-weight:800;clip-path:polygon(0 0,100% 0,calc(100% - 22px) 100%,0 100%)}
span{display:flex;align-items:center;padding:0 24px;font-size:22px;color:#bdbdbd}
p{margin:0;display:flex;align-items:center;gap:10px;padding:0 26px;font-size:24px;font-weight:700;border-left:2px solid #2a2a2a}
.lap strong{font-size:44px;font-weight:800}
.lap{margin-left:auto}
.flag{gap:12px}.flag::before{content:"";width:34px;height:24px;background:${GREEN};transform:skewX(-14deg)}
.flag.yellow::before{background:${YELLOW}}.flag.sc::before{background:${YELLOW};outline:3px solid #fff}
.wx{font-size:18px;color:#bdbdbd}`,
  size: { width: 1860, height: 70 },
};

/** The timing tower: every car in order, its gap, tyre and last lap with its sectors coloured. */
const tower: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['cars'],
    properties: {
      cars: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            pos: { type: 'number' }, code: { type: 'string' }, colour: { type: 'string' }, gap: { type: 'string' }, tyre: { enum: ['S', 'M', 'H', 'I'] }, age: { type: 'number' },
            s1: { enum: ['p', 'g', 'y'] }, s2: { enum: ['p', 'g', 'y'] }, s3: { enum: ['p', 'g', 'y'] }, ours: { type: 'boolean' }, pit: { type: 'boolean' },
          },
        },
      },
    },
  },
  template: `<ol class="tw">{{#cars}}<li class="{{#ours}}ours{{/ours}}"><b>{{pos}}</b><i style="--t: {{colour}}"></i><strong>{{code}}</strong>{{#pit}}<span class="pit"><u>PIT</u></span>{{/pit}}{{^pit}}<span>{{gap}}</span>{{/pit}}<em class="t{{tyre}}">{{tyre}}</em><small>{{age}}</small><s class="{{s1}}"></s><s class="{{s2}}"></s><s class="{{s3}}"></s></li>{{/cars}}</ol>`,
  style: `.tw{height:100%;box-sizing:border-box;margin:0;padding:0;list-style:none;display:grid;grid-template-rows:repeat(20,1fr);gap:3px;font-family:${RACE};font-style:italic;color:#fff}
li{position:relative;display:grid;grid-template-columns:34px 6px 64px 1fr 30px 26px repeat(3,14px);align-items:center;gap:8px;padding:0 10px;background:#141418;${CUT};font-size:20px}
.ours{background:#2a0a0a;box-shadow:inset 4px 0 0 ${RED}}
b{font-size:22px;font-weight:800;text-align:right}
i{height:70%;background:var(--t)}
strong{font-size:22px;font-weight:800;letter-spacing:.04em}
span{text-align:right;color:#d0d0d0;font-variant-numeric:tabular-nums}
em{font-style:normal;display:grid;place-items:center;width:24px;height:24px;border-radius:50%;border:3px solid #fff;font-size:12px;font-weight:800}
.tS{border-color:${RED}}.tM{border-color:${YELLOW}}.tH{border-color:#f2f2f2}.tI{border-color:${GREEN}}
small{font-size:14px;color:#9a9a9a;font-style:normal}
s{display:block;height:10px;background:${YELLOW};transform:skewX(-14deg)}
s.p{background:${PURPLE}}s.g{background:${GREEN}}
u{text-decoration:none;padding:1px 10px;background:#fff;color:#000;font-size:15px;font-weight:800}`,
  size: { width: 500, height: 930 },
};

/** A sector's best: its number in its colour, the time and who set it. */
const sectorBest: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['sector', 'time'], properties: { sector: { type: 'string' }, colour: { type: 'string' }, time: { type: 'string' }, who: { type: 'string' } } },
  template: `<p class="sb" style="--c: {{colour}}"><b>{{sector}}</b><span>{{time}}</span><small>{{who}}</small></p>`,
  style: `.sb{margin:0;height:100%;box-sizing:border-box;display:grid;grid-template-columns:auto 1fr;grid-template-rows:auto auto;column-gap:10px;align-content:center;padding:6px 14px 6px 0;background:#000;${CUT};font-family:${RACE};font-style:italic;color:#fff}
b{grid-row:span 2;display:grid;place-items:center;padding:0 12px;background:var(--c);font-size:22px;font-weight:800;color:#000}
span{font-size:24px;font-weight:800;font-variant-numeric:tabular-nums}
small{font-size:14px;color:#bdbdbd}`,
  size: { width: 210, height: 64 },
};

/** The team's tyre strategy: each car's stints across the race, the laps run and what is planned. */
const strategy: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['cars', 'lap', 'laps'],
    properties: {
      lap: { type: 'number' },
      laps: { type: 'number' },
      cars: { type: 'array', items: { type: 'object', properties: { code: { type: 'string' }, stints: { type: 'array', items: { type: 'object', properties: { tyre: { type: 'string' }, laps: { type: 'number' }, planned: { type: 'boolean' } } } }, note: { type: 'string' } } } },
    },
  },
  template: `<section class="st" style="--now: {{lap}}; --all: {{laps}}"><h3>TYRE STRATEGY <small>LAP {{lap}} / {{laps}}</small></h3>{{#cars}}<div class="row"><b>{{code}}</b><p>{{#stints}}<i class="t{{tyre}} {{#planned}}plan{{/planned}}" style="--n: {{laps}}">{{tyre}}</i>{{/stints}}</p><small>{{note}}</small></div>{{/cars}}<span class="now"></span></section>`,
  style: `.st{position:relative;height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr 1fr;gap:10px;padding:14px 18px;background:#141418;${CUT};font-family:${RACE};font-style:italic;color:#fff}
h3{margin:0;font-size:20px;font-weight:800;letter-spacing:.06em;display:flex;justify-content:space-between}
h3 small{font-size:16px;color:#9a9a9a}
.row{display:grid;grid-template-columns:60px 1fr;grid-template-rows:auto auto;column-gap:12px;align-content:center}
b{grid-row:span 2;font-size:24px;font-weight:800;align-self:center}
p{margin:0;display:flex;height:30px;gap:2px}
i{flex:var(--n) 0 0;display:grid;place-items:center;font-style:normal;font-weight:800;font-size:14px;color:#000;background:#f2f2f2}
.tS{background:${RED};color:#fff}.tM{background:${YELLOW}}.tH{background:#f2f2f2}.tI{background:${GREEN}}
.plan{opacity:.45;background-image:repeating-linear-gradient(135deg,rgba(0,0,0,.35) 0 4px,transparent 4px 8px)}
.row small{font-size:14px;color:#bdbdbd;margin-top:4px}
.now{position:absolute;top:44px;bottom:14px;left:calc(18px + 72px + (100% - 108px) * var(--now) / var(--all));width:2px;background:#fff}`,
  size: { width: 680, height: 290 },
};

// ── The board ───────────────────────────────────────────────────────────────────────────────────────────────────

const node = (id: string, x: number, y: number, width: number, height: number, widget: Widget): Node => ({ id, x, y, width, height, anchored: false, widget });

const sectorNode = (i: number, x: number, y: number): Node =>
  node(`sector-${i + 1}`, x, y, 210, 64, {
    type: 'element:sector-best',
    props: { sector: `S${i + 1}`, colour: PURPLE, time: '', who: '' },
    bindings: { time: bind('/timing/sectors', `/${i}/time`), who: bind('/timing/sectors', `/${i}/who`) },
  });

const nodes: Node[] = [
  node('header', 30, 20, 1860, 70, {
    type: 'element:header',
    props: { race: '', circuit: '', lap: 0, laps: 0, flag: 'green', flagText: '', air: '', track: '' },
    bindings: {
      race: bind('/timing/race', '/name'),
      circuit: bind('/timing/race', '/circuit'),
      lap: bind('/timing/race', '/lap'),
      laps: bind('/timing/race', '/laps'),
      flag: bind('/timing/race', '/flag'),
      flagText: bind('/timing/race', '/flagText'),
      air: bind('/timing/race', '/air'),
      track: bind('/timing/race', '/track'),
    },
  }),
  node('tower', 30, 110, 500, 940, { type: 'element:tower', props: { cars: [] }, bindings: { cars: bind('/timing/tower', '/value') } }),
  sectorNode(0, 1560, 640),
  sectorNode(1, 1110, 214),
  sectorNode(2, 590, 380),
  node('strategy', 560, 750, 680, 300, {
    type: 'element:strategy',
    props: { cars: [], lap: 0, laps: 0 },
    bindings: { cars: bind('/timing/strategy', '/value'), lap: bind('/timing/race', '/lap'), laps: bind('/timing/race', '/laps') },
  }),
  node('laps', 1260, 750, 630, 300, {
    type: 'chart.line',
    props: {
      title: 'LAP TIMES — 최근 12랩(초, 피트 랩 제외)',
      data: [],
      mapping: { x: 'lap', y: ['kim', 'park'] },
      options: { valueAxisZero: false, series: [{ label: 'KIM', color: RED }, { label: 'PRK', color: '#ffffff' }] },
    },
    bindings: { data: bind('/timing/laps', '/value') },
  }),
];

const document: CanvasView = {
  kind: 'canvas',
  appearance: 'dark',
  accent: RED,
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes,
  connectors: [],
  elements: { header, tower, 'sector-best': sectorBest, strategy },
};

export const racePitwall: SamplePack = {
  id: 'race-pitwall',
  title: { ko: '레이스 피트월 — 모터스포츠 중계 그래픽', en: 'A race team’s pit wall — in the style of race broadcast graphics' },
  field: { ko: '모터스포츠', en: 'Motorsport' },
  kind: { ko: '서킷 지도 + 타이밍 타워', en: 'A circuit map beside a timing tower' },
  domain: 'leisure',
  styles: ['control-room'],
  summary: {
    ko: '그랑프리 중 팀 피트월 화면을 레이스 중계 그래픽처럼 — 검정 바탕, 흰 기울인 좁은 글자, 빨강 하나, 비스듬히 잘린 패널. 왼쪽 타이밍 타워(순위·간격·타이어와 사용 랩·지난 랩의 섹터 색 — 보라 세션 최고, 초록 개인 최고, 노랑 그 밖, 피트 중 표시, 우리 팀 두 대 강조), 오른쪽 서킷(세 섹터 색·피트 레인·DRS 구간)과 섹터마다 최고 기록 보유자, 아래 두 대의 타이어 전략(지난 스틴트·계획, 지금 랩 표시)과 랩 타임. 경기와 선수는 지어낸 것이라 예시 데이터입니다.',
    en: 'A race team’s pit-wall screen during a grand prix, drawn like race broadcast graphics — black, white condensed italic type, one red, panels cut on a slant. The timing tower on the left (position, interval, tyre and its age, last lap’s sectors coloured purple for the session’s best, green for a personal best, yellow otherwise, a pit flag, the team’s two cars marked); the circuit on the right (its three sectors in colour, the pit lane and the DRS zones) with who holds each sector’s best; below, the two cars’ tyre strategy (stints run and planned, the current lap marked) and their lap times. The race and drivers are made up. Example data.',
  },
  connectors: [TIMING],
  document,
  snapshot,
};
