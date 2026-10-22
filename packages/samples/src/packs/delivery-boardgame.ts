import type { Binding, CanvasView, ElementDefinition, Node, Widget } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { svgDataUrl } from '../frame.js';
import { snapshot } from '../snapshots/delivery-boardgame.js';

// A parcel depot's delivery drivers played out as a board game: every driver a lane of twenty spaces from 출발 to 도착,
// the driver's pawn standing as far along as the share of the route delivered, and at the lane's end the card the
// driver holds — GO (green) on schedule, 한 턴 쉬기 (yellow, dashed) running late, 문제 카드 (red, a tilted card with
// a !) when parcels pile up undelivered, 완주 (gold) when the route is done. On the right the day's tally as dice and
// the deliveries by hour. The depot, its drivers and its neighbourhoods are made up, so the values are example data.

export const DEPOT: ExampleSampleConnector = {
  key: 'depot',
  name: '예시 택배 영업소 배송 API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 택배 영업소가 아닙니다' },
};

/** The drivers' scanners report each delivery; ten minutes without a report from the depot is a feed to check. */
const MAX_AGE_SECONDS = 10 * 60;

const bind = (path: string, valuePath: string): Binding => ({
  adapter: DEPOT.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
});

const WIDTH = 1600;
const HEIGHT = 1000;
const BOARD = '#f4ecd6';
const LINE = '#3b2f2a';
const RED = '#d6453d';
const BLUE = '#2f6fb3';
const GREEN = '#3c9a5f';
const YELLOW = '#f2c230';
const TEXT = '"Pretendard", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
const DISPLAY = '"Jua", "Do Hyeon", "Black Han Sans", "Pretendard", sans-serif';

const LANE_W = 1000;
const LANE_H = 118;
const DRIVERS = ['v1', 'v2', 'v3', 'v4', 'v5', 'v6'] as const;
const laneAt = (i: number) => ({ x: 70, y: 150 + i * (LANE_H + 12) });

// ── The game board ─────────────────────────────────────────────────────────────────────────────────────────────

function drawing(): string {
  // A border of coloured spaces round the board, like the edge of a family board game.
  const colours = [RED, BLUE, YELLOW, GREEN];
  const S = 40;
  const edge: string[] = [];
  for (let x = 0; x < WIDTH; x += S) {
    edge.push(`<rect x="${x}" y="0" width="${S}" height="${S}" fill="${colours[(x / S) % 4]}"/>`, `<rect x="${x}" y="${HEIGHT - S}" width="${S}" height="${S}" fill="${colours[(x / S + 2) % 4]}"/>`);
  }
  for (let y = S; y < HEIGHT - S; y += S) {
    edge.push(`<rect x="0" y="${y}" width="${S}" height="${S}" fill="${colours[(y / S + 1) % 4]}"/>`, `<rect x="${WIDTH - S}" y="${y}" width="${S}" height="${S}" fill="${colours[(y / S + 3) % 4]}"/>`);
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<rect width="${WIDTH}" height="${HEIGHT}" fill="${BOARD}"/>
<g stroke="${LINE}" stroke-width="2">${edge.join('')}</g>
<rect x="${S}" y="${S}" width="${WIDTH - 2 * S}" height="${HEIGHT - 2 * S}" fill="none" stroke="${LINE}" stroke-width="3"/>
<rect x="1100" y="140" width="440" height="790" rx="18" fill="#fffaf0" stroke="${LINE}" stroke-width="3"/>
<rect x="1110" y="150" width="420" height="770" rx="12" fill="none" stroke="${LINE}" stroke-width="1" stroke-dasharray="6 6"/>
</svg>`;
  return svgDataUrl(svg);
}

// ── Elements ───────────────────────────────────────────────────────────────────────────────────────────────────

/** A driver's route as a lane of twenty spaces — read from `d`: the pawn stands on space `--step` (0–20) in the driver's
 *  colour `--c`, spaces behind it are walked; the card at the end is the driver's state. */
const lane: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['d'], properties: { d: { type: 'object' } } },
  template: `<article class="ln {{d.state}}" style="--step: {{d.step}}; --c: {{d.color}}"><header><b>{{d.name}}</b><small>{{d.area}}</small><p>{{d.done}} / {{d.total}}건</p></header><div class="track"><span class="st">출발</span><div class="cells"><div class="walked"></div><i class="pawn"></i></div><span class="go">도착</span></div><aside class="card"><em>{{d.card}}</em><small>{{d.word}}</small></aside><p class="note">{{d.note}}</p></article>`,
  style: `.ln{height:100%;box-sizing:border-box;display:grid;grid-template-columns:150px 1fr 120px;grid-template-rows:1fr auto;column-gap:14px;align-items:center;padding:8px 12px;background:#fffaf0;border:3px solid ${LINE};border-radius:14px;font-family:${TEXT};color:${LINE}}
header{grid-row:1 / span 2;display:grid;gap:2px}
b{font:28px/1 ${DISPLAY};color:var(--c)}
small{font-size:12px;color:#6b5d55}
header p{margin:4px 0 0;font:800 18px ${TEXT}}
.track{display:grid;grid-template-columns:42px 1fr 42px;align-items:center;gap:4px}
.st,.go{display:grid;place-items:center;height:44px;border:2px solid ${LINE};border-radius:8px;font:13px ${DISPLAY};background:${YELLOW}}
.go{background:${GREEN};color:#fff}
.cells{position:relative;height:44px;border:2px solid ${LINE};border-radius:6px;background:repeating-linear-gradient(90deg, #fffdf6 0 calc(5% - 2px), ${LINE} calc(5% - 2px) 5%)}
.walked{position:absolute;inset:0;background:repeating-linear-gradient(90deg, color-mix(in srgb, var(--c) 35%, #fff) 0 calc(5% - 2px), ${LINE} calc(5% - 2px) 5%);clip-path:inset(0 calc(100% - var(--step) * 5%) 0 0)}
.pawn{position:absolute;bottom:4px;width:26px;height:34px;left:calc(var(--step) * 5% - 2.5% - 13px);background:var(--c);clip-path:polygon(50% 0, 72% 10%, 74% 34%, 100% 48%, 88% 62%, 70% 58%, 82% 100%, 18% 100%, 30% 58%, 12% 62%, 0 48%, 26% 34%, 28% 10%);filter:drop-shadow(0 1px 0 ${LINE})}
.card{grid-row:1 / span 2;grid-column:3;display:grid;place-items:center;align-content:center;gap:2px;height:96px;border:3px solid ${LINE};border-radius:10px;background:${GREEN};color:#fff;box-shadow:3px 3px 0 ${LINE}}
.card em{font:normal 22px/1 ${DISPLAY};white-space:nowrap}
.card small{color:inherit;font-weight:800;font-size:13px}
.note{grid-column:2;margin:2px 0 0;font-size:13px;color:#6b5d55}
.delay .card{background:${YELLOW};color:${LINE};border-style:dashed}
.problem .card{background:${RED};transform:rotate(-6deg)}
.problem .card em::before{content:"! "}
.done .card{background:linear-gradient(135deg, #f7d774, #c9962b);color:${LINE}}
.done .cells{opacity:.7}`,
  size: { width: LANE_W, height: LANE_H },
};

/** The game's title on the box lid. */
const banner: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['n'], properties: { n: { type: 'object' } } },
  template: `<header class="bn"><h1>배송 대작전</h1><p>푸른길 택배 영업소 · 오늘의 판 — {{n.date}} {{n.time}}</p></header>`,
  style: `.bn{height:100%;display:flex;align-items:center;gap:20px;font-family:${TEXT};color:${LINE}}
h1{margin:0;white-space:nowrap;padding:4px 18px;font:48px/1.1 ${DISPLAY};color:#fff;background:${RED};border:3px solid ${LINE};border-radius:12px;box-shadow:4px 4px 0 ${LINE};transform:rotate(-2deg)}
p{margin:0;white-space:nowrap;font-size:18px;font-weight:700}`,
  size: { width: 1000, height: 80 },
};

/** The day's tally as four dice — read from `t`. */
const tally: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['t'], properties: { t: { type: 'object' } } },
  template: `<section class="tl"><h2>오늘의 점수</h2><ul><li><b>{{t.done}}</b><small>배송 완료</small></li><li><b>{{t.left}}</b><small>남은 배송</small></li><li class="w"><b>{{t.absent}}</b><small>부재 · 재방문</small></li><li class="r"><b>{{t.returned}}</b><small>반송</small></li></ul></section>`,
  style: `.tl{height:100%;box-sizing:border-box;padding:4px 8px;font-family:${TEXT};color:${LINE}}
h2{margin:0 0 12px;font:30px ${DISPLAY}}
ul{margin:0;padding:0;list-style:none;display:grid;grid-template-columns:1fr 1fr;gap:14px}
li{position:relative;display:grid;place-items:center;align-content:center;height:104px;background:#fff;border:3px solid ${LINE};border-radius:16px;box-shadow:3px 3px 0 ${LINE}}
li::before,li::after{content:"";position:absolute;width:9px;height:9px;border-radius:50%;background:${LINE};top:10px;left:10px}
li::after{top:auto;left:auto;bottom:10px;right:10px}
b{font:40px/1 ${DISPLAY}}
small{font-size:13px;font-weight:700;color:#6b5d55}
.w b{color:#b08400}.r b{color:${RED}}`,
  size: { width: 400, height: 300 },
};

// ── The board ──────────────────────────────────────────────────────────────────────────────────────────────────

const node = (id: string, x: number, y: number, width: number, height: number, widget: Widget): Node => ({ id, x, y, width, height, anchored: false, widget });

const nodes: Node[] = [
  node('banner', 70, 56, 1000, 80, { type: 'element:banner', props: { n: {} }, bindings: { n: bind('/depot/now', '/value') } }),
  ...DRIVERS.map((id, i) => {
    const { x, y } = laneAt(i);
    return node(`driver-${id}`, x, y, LANE_W, LANE_H, { type: 'element:lane', props: { d: {} }, bindings: { d: bind('/depot/drivers', `/value/${id}`) } });
  }),
  node('tally', 1120, 160, 400, 300, { type: 'element:tally', props: { t: {} }, bindings: { t: bind('/depot/tally', '/value') } }),
  node('hourly', 1120, 480, 400, 430, {
    type: 'chart.bar',
    props: { title: '시간대별 배송 완료 (건) — 14시는 40분까지', data: [], mapping: { x: 'hour', y: 'done' }, options: { series: [{ label: '완료', color: BLUE }] } },
    bindings: { data: bind('/depot/hourly', '/value') },
  }),
];

const document: CanvasView = {
  kind: 'canvas',
  appearance: 'light',
  accent: RED,
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes,
  connectors: [],
  elements: { lane, banner, tally },
};

export const deliveryBoardgame: SamplePack = {
  id: 'delivery-boardgame',
  title: { ko: '택배 배송 기사 순회 — 보드게임 판', en: 'A parcel depot’s delivery rounds — a board game' },
  field: { ko: '택배·근거리 배송', en: 'Parcel delivery' },
  kind: { ko: '기사별 배송 진행', en: 'Delivery progress by driver' },
  domain: 'logistics',
  styles: ['craft'],
  summary: {
    ko: '택배 영업소의 배송 기사 여섯을 보드게임 판으로 — 기사마다 출발에서 도착까지 스무 칸 길 하나, 기사의 말이 배송을 마친 만큼 나아가 서 있고, 길 끝에 기사가 든 카드가 상태를 말한다 — GO(초록) 순조, 한 턴 쉬기(노랑·점선) 지연, 문제 카드(빨강·기운 카드에 !) 부재·주소 오류가 쌓임, 완주(금색) 배송 끝. 오른쪽에 주사위로 오늘의 점수와 시간대별 배송 완료. 영업소·기사·동네는 지어낸 것이라 예시 데이터입니다.',
    en: 'A parcel depot’s six delivery drivers played out as a board game — a lane of twenty spaces from start to finish for every driver, the driver’s pawn standing as far along as the share of the route delivered, and at the lane’s end the card the driver holds for the state — GO (green) on schedule, “skip a turn” (yellow, dashed) running late, a problem card (red, tilted, with a !) when parcels pile up undelivered, a gold card when the route is done. On the right the day’s tally as dice and the deliveries by hour. The depot, its drivers and its neighbourhoods are made up. Example data.',
  },
  connectors: [DEPOT],
  document,
  snapshot,
};
