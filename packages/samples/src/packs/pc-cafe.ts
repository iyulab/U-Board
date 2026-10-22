import type { Binding, CanvasView, ElementDefinition, Node, Widget } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { svgDataUrl } from '../frame.js';
import { snapshot } from '../snapshots/pc-cafe.js';

// A gaming café's floor drawn in the Y2K chrome look of the turn of the millennium: a deep space-blue room with a
// glowing perspective grid, liquid-chrome blobs and sparkles, brushed-metal panels with bevelled edges, and glossy gel
// pills for the seats. Each zone is a chrome panel holding its seats; a seat in use is a lit aqua pill, one whose time
// ends within ten minutes a lime pill, a free seat a dark empty socket, one being wiped down a lilac pill and a broken
// one a red pill with a cross — each with its own glyph so the state does not rest on the glow alone. On the right the
// seats in use, the average session and the guests waiting, the games being played by genre and the seats in use by
// the hour. The café is made up, so the values are example data.

export const CAFE: ExampleSampleConnector = {
  key: 'cafe',
  name: '예시 PC방 API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 PC방이 아닙니다' },
};

/** The seat manager reports every minute; five minutes of silence is a source that has stopped. */
const MAX_AGE_SECONDS = 5 * 60;

const bind = (path: string, valuePath: string): Binding => ({
  adapter: CAFE.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
});

const WIDTH = 1600;
const HEIGHT = 1000;
const SPACE = '#0a0f2e';
const AQUA = '#22d3ff';
const LIME = '#b6ff3b';
const LILAC = '#c9a7ff';
const PINK = '#ff5fd2';
const RED = '#ff4d5e';
const CHROME = 'linear-gradient(180deg,#fdfdff 0%,#c9d1db 22%,#7d8794 48%,#dfe5ec 62%,#a5aeb9 100%)';
const DISPLAY = '"Orbitron", "Michroma", "Eurostile", "Noto Sans KR", "Malgun Gothic", sans-serif';
const SANS = '"Noto Sans KR", "Malgun Gothic", sans-serif';

// ── The room ────────────────────────────────────────────────────────────────────────────────────────────────────

function drawing(): string {
  const gridX = Array.from({ length: 19 }, (_, i) => {
    const x = 40 + i * 58;
    return `<path d="M ${560 + (x - 560) * 0.25} 600 L ${x} 960" stroke="${AQUA}" stroke-opacity=".35" stroke-width="1.5"/>`;
  }).join('');
  const gridY = [612, 630, 656, 690, 735, 792, 864, 952].map(y => `<path d="M 40 ${y} H 1080" stroke="${AQUA}" stroke-opacity=".3" stroke-width="1.5"/>`).join('');
  const sparkle = (x: number, y: number, r: number) =>
    `<path d="M ${x} ${y - r} Q ${x} ${y} ${x + r} ${y} Q ${x} ${y} ${x} ${y + r} Q ${x} ${y} ${x - r} ${y} Q ${x} ${y} ${x} ${y - r} Z" fill="#ffffff" fill-opacity=".9"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<defs>
<radialGradient id="glow" cx=".5" cy=".3" r=".8"><stop offset="0" stop-color="#28307a"/><stop offset="1" stop-color="${SPACE}"/></radialGradient>
<linearGradient id="chrome" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".25" stop-color="#c3ccd8"/><stop offset=".5" stop-color="#6c7684"/><stop offset=".62" stop-color="#e6ebf1"/><stop offset="1" stop-color="#9aa3af"/></linearGradient>
<linearGradient id="holo" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${PINK}"/><stop offset=".5" stop-color="${AQUA}"/><stop offset="1" stop-color="${LILAC}"/></linearGradient>
</defs>
<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#glow)"/>
<rect x="40" y="40" width="1040" height="920" rx="28" fill="none" stroke="url(#holo)" stroke-width="3"/>
${gridX}${gridY}
<path d="M 960 620 C 1030 600, 1050 680, 1010 710 C 980 735, 940 700, 935 670 C 930 645, 935 630, 960 620 Z" fill="url(#chrome)"/>
<path d="M 120 650 C 100 610, 150 580, 180 600 C 210 620, 200 670, 170 680 C 145 688, 130 675, 120 650 Z" fill="url(#chrome)"/>
<ellipse cx="1040" cy="900" rx="26" ry="18" fill="url(#holo)" fill-opacity=".85"/>
${sparkle(1050, 80, 12)}${sparkle(1060, 600, 8)}${sparkle(210, 600, 10)}${sparkle(560, 380, 7)}${sparkle(1040, 640, 9)}
<text x="70" y="96" fill="#e8eef6" font-size="18" font-family='${DISPLAY}' letter-spacing=".25em">FLOOR 2F</text>
<text x="1050" y="940" text-anchor="end" fill="${AQUA}" font-size="15" font-family='${SANS}' letter-spacing=".2em">입구 · 카운터 →</text>
</svg>`;
  return svgDataUrl(svg);
}

// ── Elements ────────────────────────────────────────────────────────────────────────────────────────────────────

/** A zone: a chrome panel with its name, its count and a gel pill for each seat — read from `z`. */
const zone: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['z'], properties: { z: { type: 'object' } } },
  template: `<section class="zn"><header><b>{{z.name}}</b><span>{{z.note}}</span></header><ol>{{#z.seats}}<li class="{{st}}"><i></i><small>{{n}}</small></li>{{/z.seats}}</ol></section>`,
  style: `.zn{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr;gap:10px;padding:12px 16px 14px;border-radius:22px;background:${CHROME};box-shadow:inset 0 2px 0 #fff,inset 0 -3px 0 rgba(0,0,0,.25),0 8px 24px rgba(0,0,0,.45);font-family:${SANS};color:#0d1330}
header{display:flex;justify-content:space-between;align-items:center}
b{font:700 18px ${DISPLAY};letter-spacing:.06em}
span{font-size:13px;font-weight:700;padding:2px 12px;border-radius:999px;background:rgba(10,15,46,.82);color:${AQUA}}
ol{margin:0;padding:10px;list-style:none;display:grid;grid-template-columns:repeat(auto-fit,minmax(36px,1fr));gap:6px;border-radius:14px;background:rgba(10,15,46,.88);box-shadow:inset 0 2px 6px rgba(0,0,0,.6)}
li{display:grid;justify-items:center;align-content:center;gap:3px;border-radius:12px;padding:6px 0}
i{width:28px;height:28px;border-radius:999px;display:grid;place-items:center;font:700 15px ${SANS};font-style:normal;color:#0a0f2e}
i::after{content:""}
small{font:600 11px ${DISPLAY};color:#c9d3e0}
.on i{background:radial-gradient(circle at 35% 30%,#fff 0 18%,${AQUA} 45%,#0a7fa8 100%);box-shadow:0 0 10px ${AQUA}}
.on i::after{content:"●"}
.end i{background:radial-gradient(circle at 35% 30%,#fff 0 18%,${LIME} 45%,#5a8a10 100%);box-shadow:0 0 10px ${LIME}}
.end i::after{content:"◔"}
.free i{background:#121a44;border:2px solid #4b5a8f}
.free i::after{content:"○";color:#8fa0d6}
.clean i{background:radial-gradient(circle at 35% 30%,#fff 0 18%,${LILAC} 45%,#6a4fb0 100%)}
.clean i::after{content:"~"}
.out i{background:radial-gradient(circle at 35% 30%,#fff 0 18%,${RED} 45%,#8a1020 100%)}
.out i::after{content:"✕";color:#fff}`,
  size: { width: 470, height: 250 },
};

/** The kitchen hatch: orders on the stove and waiting to be picked up. */
const orders: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['o'], properties: { o: { type: 'object' } } },
  template: `<section class="od"><h3>주문</h3><p><span>조리 중</span><b>{{o.cooking}}</b></p><p class="r"><span>픽업 대기</span><b>{{o.ready}}</b></p><small>{{o.note}}</small></section>`,
  style: `.od{height:100%;box-sizing:border-box;display:grid;grid-template-columns:auto 1fr 1fr;grid-template-rows:1fr auto;align-items:center;column-gap:14px;padding:12px 18px;border-radius:22px;background:${CHROME};box-shadow:inset 0 2px 0 #fff,0 8px 24px rgba(0,0,0,.45);font-family:${SANS};color:#0d1330}
h3{grid-row:span 2;margin:0;font:700 18px ${DISPLAY};writing-mode:vertical-rl;letter-spacing:.2em}
p{margin:0;display:grid}
span{font-size:12px;font-weight:700}
b{font:700 34px ${DISPLAY}}
.r b{color:#7a0f6a}
small{grid-column:2 / span 2;font-size:12px}`,
  size: { width: 330, height: 120 },
};

/** The café's name in chrome letters. */
const title: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['name'], properties: { name: { type: 'string' }, sub: { type: 'string' }, date: { type: 'string' }, time: { type: 'string' } } },
  template: `<header class="tt"><h1>{{name}}</h1><p>{{sub}}</p><div><span>{{date}}</span><b>{{time}}</b></div></header>`,
  style: `.tt{height:100%;box-sizing:border-box;display:grid;align-content:center;gap:6px;font-family:${SANS};color:#e8eef6}
h1{margin:0;font:800 42px/1.05 ${DISPLAY};letter-spacing:.03em;background:${CHROME};-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 2px 0 rgba(255,95,210,.7))}
p{margin:0;font-size:15px;color:${LILAC}}
div{display:flex;align-items:center;gap:12px;padding-top:8px;border-top:2px solid rgba(34,211,255,.5)}
span{font-size:16px}
b{margin-left:auto;font:700 38px ${DISPLAY};color:${AQUA};text-shadow:0 0 12px ${AQUA}}`,
  size: { width: 460, height: 170 },
};

/** The figures, each in a gel capsule. */
const figures: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, value: { type: 'string' }, note: { type: 'string' } } } } },
  },
  template: `<dl class="fg">{{#items}}<div><dt>{{label}}</dt><dd>{{value}}</dd><small>{{note}}</small></div>{{/items}}</dl>`,
  style: `.fg{margin:0;height:100%;box-sizing:border-box;display:grid;grid-template-columns:repeat(3,1fr);gap:10px;font-family:${SANS};color:#0d1330}
div{display:grid;align-content:center;padding:8px 14px;border-radius:18px;background:${CHROME};box-shadow:inset 0 2px 0 #fff,0 6px 16px rgba(0,0,0,.4)}
dt{font-size:12px;font-weight:700}
dd{margin:0;font:700 26px ${DISPLAY}}
small{font-size:11px}`,
  size: { width: 460, height: 100 },
};

/** The games being played by genre, each a holographic bar. */
const games: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, seats: { type: 'string' }, share: { type: 'number' } } } } },
  },
  template: `<section class="gm"><h3>지금 하는 게임</h3><ol>{{#items}}<li><b>{{name}}</b><i style="--s: {{share}}"></i><span>{{seats}}</span></li>{{/items}}</ol></section>`,
  style: `.gm{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr;gap:10px;font-family:${SANS};color:#e8eef6}
h3{margin:0;font:700 17px ${DISPLAY};letter-spacing:.08em;color:${AQUA}}
ol{margin:0;padding:0;list-style:none;display:grid;align-content:space-evenly}
li{display:grid;grid-template-columns:84px 1fr 52px;align-items:center;gap:10px}
b{font-size:15px}
i{display:block;height:18px;width:calc(var(--s) * 1%);min-width:18px;border-radius:999px;background:linear-gradient(90deg,${PINK},${AQUA},${LILAC});box-shadow:inset 0 2px 0 rgba(255,255,255,.7),0 0 10px rgba(34,211,255,.5)}
span{justify-self:end;font-size:14px;font-weight:700}`,
  size: { width: 460, height: 230 },
};

/** The key to the seat pills. */
const legend: ElementDefinition = {
  render: 'template',
  props: { type: 'object', properties: {} },
  template: `<ul class="lg"><li class="on"><i></i>사용 중</li><li class="end"><i></i>10분 안에 끝남</li><li class="free"><i></i>빈자리</li><li class="clean"><i></i>청소 중</li><li class="out"><i></i>고장</li></ul>`,
  style: `.lg{height:100%;box-sizing:border-box;margin:0;padding:0 14px;list-style:none;display:flex;align-items:center;gap:14px;border-radius:999px;background:rgba(10,15,46,.85);border:1.5px solid rgba(34,211,255,.5);font:600 13px ${SANS};color:#e8eef6}
li{display:flex;align-items:center;gap:6px}
i{width:20px;height:20px;border-radius:999px;display:grid;place-items:center;font:700 11px ${SANS};font-style:normal;color:#0a0f2e}
.on i{background:${AQUA}}
.on i::after{content:"●"}
.end i{background:${LIME}}
.end i::after{content:"◔"}
.free i{background:#121a44;border:2px solid #4b5a8f;box-sizing:border-box}
.free i::after{content:"○";color:#8fa0d6}
.clean i{background:${LILAC}}
.clean i::after{content:"~"}
.out i{background:${RED};color:#fff}
.out i::after{content:"✕"}`,
  size: { width: 560, height: 40 },
};

// ── The board ───────────────────────────────────────────────────────────────────────────────────────────────────

const node = (id: string, x: number, y: number, width: number, height: number, widget: Widget): Node => ({ id, x, y, width, height, anchored: false, widget });

const zoneNode = (id: 'a' | 'b' | 'p' | 'd', x: number, y: number, height: number): Node =>
  node(`zone-${id}`, x, y, 470, height, { type: 'element:zone', props: { z: {} }, bindings: { z: bind('/cafe/zones', `/value/${id}`) } });

const nodes: Node[] = [
  zoneNode('a', 70, 120, 250),
  zoneNode('b', 580, 120, 250),
  zoneNode('p', 70, 400, 180),
  zoneNode('d', 580, 400, 180),
  node('orders', 70, 820, 330, 120, { type: 'element:orders', props: { o: {} }, bindings: { o: bind('/cafe/orders', '/value') } }),
  node('legend', 460, 840, 560, 40, { type: 'element:legend', props: {} }),
  node('title', 1120, 30, 460, 170, {
    type: 'element:title',
    props: { name: '', sub: '', date: '', time: '' },
    bindings: { name: bind('/cafe/now', '/name'), sub: bind('/cafe/now', '/sub'), date: bind('/cafe/now', '/date'), time: bind('/cafe/now', '/time') },
  }),
  node('figures', 1120, 220, 460, 100, { type: 'element:figures', props: { items: [] }, bindings: { items: bind('/cafe/figures', '/value') } }),
  node('games', 1120, 340, 460, 230, { type: 'element:games', props: { items: [] }, bindings: { items: bind('/cafe/games', '/value') } }),
  node('hours', 1120, 600, 460, 360, {
    type: 'chart.area',
    props: { title: '시간대별 사용 좌석', data: [], mapping: { x: 'hour', y: 'seats' }, options: { smooth: true, series: [{ label: '좌석', color: AQUA }] } },
    bindings: { data: bind('/cafe/hours', '/value') },
  }),
];

const document: CanvasView = {
  kind: 'canvas',
  appearance: 'dark',
  accent: AQUA,
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes,
  connectors: [],
  elements: { zone, orders, title, figures, games, legend },
};

export const pcCafe: SamplePack = {
  id: 'pc-cafe',
  title: { ko: 'PC방 좌석 현황 — Y2K 크롬', en: 'A gaming café’s seats — Y2K chrome' },
  field: { ko: '여가·PC방', en: 'Leisure & gaming cafés' },
  kind: { ko: '구역별 좌석과 주문', en: 'Seats by zone and kitchen orders' },
  domain: 'leisure',
  styles: ['retro'],
  summary: {
    ko: 'PC방 객장 현황을 2000년 무렵의 Y2K 크롬으로 — 깊은 우주색 방에 빛나는 원근 격자, 액체 크롬 덩어리와 반짝이, 모서리가 둥글고 빛이 도는 금속 판, 광택 젤 알약. 구역마다 크롬 판 안에 좌석을 알약으로: 사용 중은 켜진 하늘색, 10분 안에 끝나는 자리는 라임, 빈자리는 어두운 빈 홈, 청소 중은 라일락, 고장은 빨강에 ✕ — 빛만으로 읽지 않게 알약마다 기호(● ◔ ○ ~ ✕). 아래에 주방 주문(조리 중·픽업 대기), 오른쪽에 사용 좌석·평균 이용·대기 손님, 장르별 지금 하는 게임(홀로그램 막대), 시간대별 사용 좌석. 매장은 지어낸 것이라 예시 데이터입니다.',
    en: 'A gaming café’s floor in the Y2K chrome look of the turn of the millennium — a deep space-blue room with a glowing perspective grid, liquid-chrome blobs and sparkles, rounded brushed-metal panels and glossy gel pills. In each zone’s chrome panel every seat is a pill: lit aqua in use, lime when its time ends within ten minutes, a dark empty socket when free, lilac while being wiped down, red with a cross when broken — each with its own glyph (● ◔ ○ ~ ✕) so the state does not rest on the glow alone. Below, the kitchen’s orders on the stove and waiting; on the right the seats in use, the average session and the guests waiting, the games played by genre as holographic bars and the seats in use by the hour. The café is made up. Example data.',
  },
  connectors: [CAFE],
  document,
  snapshot,
};
