import type { Binding, CanvasView, ElementDefinition, Node, Widget } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { svgDataUrl } from '../frame.js';
import { snapshot } from '../snapshots/night-market-neon.js';

// A riverside night market's food trucks as neon signs on a brick wall: every truck a sign of glass tubes — its name
// lit in its own colour, what it is serving, the minutes of the wait and the people in line — and the sign itself
// telling the state: lit steady when serving, an orange tube underneath when the line is long, a red «품절» tube across
// it when sold out, the tubes dark when closed. On the right a neon clock, the market's figures now and the orders by
// the half hour on a dark panel. The market and its trucks are made up, so the values are example data.

export const MARKET: ExampleSampleConnector = {
  key: 'market',
  name: '예시 야시장 운영 API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 야시장·푸드트럭이 아닙니다' },
};

/** The trucks report their line every minute or two; five minutes of silence is a till gone off the network. */
const MAX_AGE_SECONDS = 5 * 60;

const bind = (path: string, valuePath: string): Binding => ({
  adapter: MARKET.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
});

const WIDTH = 1600;
const HEIGHT = 900;
const BRICK = '#2a1a1c';
const MORTAR = '#1a1012';
const PINK = '#ff4fa3';
const CYAN = '#3ef0ff';
const LIME = '#a6ff4d';
const AMBER = '#ffb23e';
const RED = '#ff3b3b';
const VIOLET = '#b77bff';
const SIGN = '"Pretendard", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
const SCRIPT = '"Brush Script MT", "Segoe Script", cursive';

const SIGN_BOX = { width: 240, height: 320 };
const TRUCKS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
const signAt = (i: number) => ({ x: 48 + (i % 4) * 264, y: 170 + Math.floor(i / 4) * 352 });

// ── The wall ───────────────────────────────────────────────────────────────────────────────────────────────────

function drawing(): string {
  // Bricks in a running bond, as a pattern: a few hundred rects drawn once.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<defs>
<pattern id="brick" width="96" height="48" patternUnits="userSpaceOnUse">
<rect width="96" height="48" fill="${MORTAR}"/>
<rect x="2" y="2" width="92" height="20" rx="2" fill="${BRICK}"/>
<rect x="-46" y="26" width="92" height="20" rx="2" fill="#2f1d1f"/>
<rect x="50" y="26" width="92" height="20" rx="2" fill="#2f1d1f"/>
</pattern>
<radialGradient id="glow" cx="50%" cy="40%" r="70%"><stop offset="0" stop-color="#3a1f3a" stop-opacity=".9"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
</defs>
<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#brick)"/>
<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#glow)"/>
<rect width="${WIDTH}" height="${HEIGHT}" fill="#000" opacity=".25"/>
<rect x="1110" y="420" width="456" height="422" rx="14" fill="#120c14" stroke="#3b2b44" stroke-width="2"/>
<path d="M0 ${HEIGHT - 26} H ${WIDTH}" stroke="#000" stroke-width="52" opacity=".55"/>
</svg>`;
  return svgDataUrl(svg);
}

// ── Elements ───────────────────────────────────────────────────────────────────────────────────────────────────

/** A truck's neon sign — read from `t`. The tubes glow in the truck's colour (`--c`); the state adds a tube (busy, sold
 *  out) or puts them out (closed), and says itself in a word as well. The glow stays inside the box: what an element
 *  draws past it is cut. */
const sign: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['t'], properties: { t: { type: 'object' } } },
  template: `<article class="ns {{t.state}}" style="--c: {{t.color}}"><h2>{{t.name}}</h2><p class="menu">{{t.menu}}</p><div class="nums"><span><b>{{t.wait}}</b>분 대기</span><span><b>{{t.line}}</b>명 줄</span></div><p class="word">{{t.word}}</p></article>`,
  style: `.ns{position:relative;height:100%;box-sizing:border-box;padding:18px 16px 14px;display:grid;grid-template-rows:auto auto 1fr auto;gap:6px;border:3px solid var(--c);border-radius:22px;background:rgba(10,4,12,.72);box-shadow:0 0 12px var(--c) inset;font-family:${SIGN};color:#fff;text-align:center}
h2{margin:6px 0 0;font:400 36px/1.1 ${SCRIPT};color:#fff;text-shadow:0 0 4px #fff,0 0 10px var(--c),0 0 18px var(--c);white-space:nowrap}
.menu{margin:0;font-size:14px;color:var(--c);text-shadow:0 0 6px var(--c)}
.nums{display:flex;justify-content:center;gap:26px;align-items:center;font-size:13px;color:#e8dcef}
.nums b{display:block;font:800 48px ${SIGN};color:#fff;text-shadow:0 0 8px var(--c)}
.word{margin:0;justify-self:center;padding:2px 14px;border:2px solid var(--c);border-radius:999px;font-size:14px;font-weight:800;color:var(--c);text-shadow:0 0 6px var(--c)}
.busy .word{border-color:${AMBER};color:${AMBER};text-shadow:0 0 8px ${AMBER};box-shadow:0 0 10px ${AMBER}}
.busy::after{content:"";position:absolute;left:24px;right:24px;bottom:6px;height:3px;border-radius:2px;background:${AMBER};box-shadow:0 0 8px ${AMBER}}
.soldout::before{content:"품절";position:absolute;left:50%;top:44%;transform:translate(-50%,-50%) rotate(-14deg);white-space:nowrap;padding:2px 18px;border:3px solid ${RED};border-radius:12px;font:900 34px ${SIGN};color:${RED};text-shadow:0 0 8px ${RED};box-shadow:0 0 12px ${RED},0 0 12px ${RED} inset;background:rgba(20,0,0,.55);letter-spacing:.2em}
.soldout .nums,.soldout .menu{opacity:.35}
.soldout .word{border-color:${RED};color:${RED}}
.closed{border-color:#4a3f4f;box-shadow:none;background:rgba(10,4,12,.5)}
.closed h2,.closed .menu,.closed .nums b,.closed .word{color:#5d5262;text-shadow:none}
.closed .word{border-color:#4a3f4f;border-style:dashed}`,
  size: SIGN_BOX,
};

/** The market's name, as one neon sign across the top. */
const marquee: ElementDefinition = {
  render: 'template',
  props: { type: 'object', properties: {} },
  template: `<header class="mq"><h1>달무리 야시장</h1><p>RIVERSIDE NIGHT MARKET · 푸드트럭 여덟</p></header>`,
  style: `.mq{height:100%;box-sizing:border-box;display:flex;align-items:center;gap:28px;padding:0 28px;border:3px solid ${PINK};border-radius:20px;box-shadow:0 0 14px ${PINK} inset;font-family:${SIGN}}
h1{margin:0;font:400 58px ${SCRIPT};color:#fff;text-shadow:0 0 4px #fff,0 0 12px ${PINK},0 0 22px ${PINK}}
p{margin:0;font:700 16px ${SIGN};letter-spacing:.24em;color:${CYAN};text-shadow:0 0 8px ${CYAN}}`,
  size: { width: 1032, height: 110 },
};

/** The time and the figures now, as a clock sign — read from `n`. */
const clock: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['n'], properties: { n: { type: 'object' } } },
  template: `<section class="ck"><p class="day">{{n.date}}</p><p class="time">{{n.time}}</p><dl><div><dt>지금 방문객</dt><dd>{{n.visitors}}</dd></div><div><dt>영업 중</dt><dd>{{n.open}}</dd></div><div><dt>평균 대기</dt><dd>{{n.wait}}</dd></div></dl></section>`,
  style: `.ck{height:100%;box-sizing:border-box;padding:16px 22px;border:3px solid ${CYAN};border-radius:20px;box-shadow:0 0 14px ${CYAN} inset;background:rgba(6,10,14,.75);font-family:${SIGN};color:#fff;display:grid;gap:4px;align-content:start}
.day{margin:0;font-size:15px;color:${CYAN};text-shadow:0 0 6px ${CYAN}}
.time{margin:0;font:800 64px/1 ${SIGN};letter-spacing:.04em;text-shadow:0 0 6px #fff,0 0 16px ${CYAN}}
dl{margin:10px 0 0;display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
dl div{border-top:2px solid ${VIOLET};padding-top:6px}
dt{font-size:12px;color:#d9c8ef}
dd{margin:0;font:800 26px ${SIGN};color:#fff;text-shadow:0 0 8px ${VIOLET}}`,
  size: { width: 456, height: 230 },
};

/** What a sign's look means. */
const key: ElementDefinition = {
  render: 'template',
  props: { type: 'object', properties: {} },
  template: `<ul class="ky"><li><i class="on"></i>영업 중</li><li><i class="busy"></i>줄 김 — 주황 밑줄</li><li><i class="sold"></i>품절 — 빨간 «품절»</li><li><i class="off"></i>영업 끝 — 꺼진 관</li></ul>`,
  style: `.ky{height:100%;box-sizing:border-box;margin:0;padding:12px 18px;list-style:none;display:grid;grid-template-columns:1fr 1fr;gap:8px 16px;align-content:center;border:2px solid #4a3f4f;border-radius:16px;background:rgba(10,4,12,.7);font:600 14px ${SIGN};color:#efe6f5}
li{display:flex;align-items:center;gap:10px}
i{display:inline-block;width:34px;height:16px;border-radius:8px;border:2.5px solid ${LIME};box-shadow:0 0 8px ${LIME}}
.busy{border-color:${AMBER};box-shadow:0 0 8px ${AMBER};border-bottom-width:5px}
.sold{border-color:${RED};box-shadow:0 0 8px ${RED};background:linear-gradient(160deg,transparent 45%,${RED} 45% 58%,transparent 58%)}
.off{border-color:#5d5262;box-shadow:none;border-style:dashed}`,
  size: { width: 456, height: 110 },
};

// ── The board ──────────────────────────────────────────────────────────────────────────────────────────────────

const node = (id: string, x: number, y: number, width: number, height: number, widget: Widget): Node => ({ id, x, y, width, height, anchored: false, widget });

const nodes: Node[] = [
  node('marquee', 48, 30, 1032, 110, { type: 'element:marquee', props: {} }),
  ...TRUCKS.map((id, i) => {
    const { x, y } = signAt(i);
    return node(`truck-${id}`, x, y, SIGN_BOX.width, SIGN_BOX.height, { type: 'element:sign', props: { t: {} }, bindings: { t: bind('/market/trucks', `/value/${id}`) } });
  }),
  node('clock', 1110, 30, 456, 230, { type: 'element:clock', props: { n: {} }, bindings: { n: bind('/market/now', '/value') } }),
  node('key', 1110, 288, 456, 110, { type: 'element:key', props: {} }),
  node('orders', 1126, 436, 424, 392, {
    type: 'chart.bar',
    props: { title: '30분마다 주문 (건)', data: [], mapping: { x: 'slot', y: 'orders' }, options: { series: [{ label: '주문', color: PINK }] } },
    bindings: { data: bind('/market/orders', '/value') },
  }),
];

const document: CanvasView = {
  kind: 'canvas',
  appearance: 'dark',
  accent: PINK,
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes,
  connectors: [],
  elements: { sign, marquee, clock, key },
};

export const nightMarketNeon: SamplePack = {
  id: 'night-market-neon',
  title: { ko: '강변 야시장 푸드트럭 — 네온사인', en: 'A riverside night market’s food trucks — neon signs' },
  field: { ko: '야시장·푸드트럭', en: 'Night market and food trucks' },
  kind: { ko: '트럭별 대기·주문', en: 'Lines and orders by truck' },
  domain: 'services',
  styles: ['signage'],
  summary: {
    ko: '강변 야시장의 푸드트럭을 벽돌 벽 위 네온사인으로 — 트럭마다 유리관 간판 하나: 제 색으로 빛나는 이름, 지금 메뉴, 대기 분과 줄 선 사람 수, 그리고 간판 스스로 말하는 상태 — 영업 중이면 그대로, 줄이 길면 아래에 주황 관과 «줄 김», 품절이면 빨간 «품절» 관이 가로지르고 나머지는 흐리게, 영업이 끝나면 관이 꺼지고 점선. 오른쪽에 네온 시계와 지금 방문객·영업 중 트럭·평균 대기, 범례, 어두운 판 위의 30분마다 주문. 야시장과 트럭은 지어낸 것이라 예시 데이터입니다.',
    en: 'A riverside night market’s food trucks as neon signs on a brick wall — a sign of glass tubes for every truck: its name lit in its own colour, what it is serving, the minutes of the wait and the people in line, and the sign itself telling the state — lit steady when serving, an orange tube underneath and «busy» when the line is long, a red «sold out» tube across it with the rest dimmed, the tubes dark and dashed once closed. On the right a neon clock with the visitors now, the trucks open and the average wait, the key, and the orders by the half hour on a dark panel. The market and its trucks are made up. Example data.',
  },
  connectors: [MARKET],
  document,
  snapshot,
};
