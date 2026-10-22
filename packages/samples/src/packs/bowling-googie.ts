import type { Binding, CanvasView, ElementDefinition, Node, Widget } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { svgDataUrl } from '../frame.js';
import { snapshot } from '../snapshots/bowling-googie.js';

// A bowling alley's Thursday-night lanes in the Googie style of the 1950s roadside: turquoise and atomic orange on cream,
// boomerangs and starbursts, a sign like a motel's. Every lane is a strip of maple seen from above, with its arrows and
// its ten pins at the far end — the pins still standing in the frame being bowled, as they stand now. A lane tells
// its state by the lamp on its number as well as by colour: a lit starburst while a party bowls, an empty ring when it
// is free, a clock when it is booked, a gear over hatched wood while the oiling machine runs. On the right the alley's
// sign, the figures now, the key, the parties waiting and the lanes in use by the hour. The alley is made up, so the
// values are example data.

export const ALLEY: ExampleSampleConnector = {
  key: 'alley',
  name: '예시 볼링장 API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 볼링장이 아닙니다' },
};

/** The scoring system reports every throw; ten minutes of silence is a desk that has stopped. */
const MAX_AGE_SECONDS = 10 * 60;

const bind = (path: string, valuePath: string): Binding => ({
  adapter: ALLEY.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
});

const WIDTH = 1600;
const HEIGHT = 1000;
const CREAM = '#fff4dc';
const TEAL = '#25a5a3';
const TEAL_DEEP = '#16706f';
const ORANGE = '#f26b38';
const MUSTARD = '#f4b63f';
const CHARCOAL = '#2b2b2b';
const MAPLE = '#e8c48c';
const TEXT = '"Pretendard", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
const DISPLAY = '"Arial Rounded MT Bold", "Malgun Gothic", sans-serif';

/** An eight-point starburst. */
const STAR = 'polygon(50% 0,61% 31%,93% 18%,72% 45%,100% 62%,66% 66%,64% 100%,48% 74%,24% 96%,30% 64%,0 56%,30% 41%,12% 12%,40% 28%)';

// ── The alley ──────────────────────────────────────────────────────────────────────────────────────────────────

function drawing(): string {
  const boomerang = (x: number, y: number, s: number, fill: string) =>
    `<path transform="translate(${x} ${y}) scale(${s})" d="M0 0 C 40 -10 80 10 110 40 C 80 20 40 10 0 22 C 10 14 10 8 0 0 Z" fill="${fill}"/>`;
  const sparkle = (x: number, y: number, r: number, fill: string) =>
    `<path d="M${x} ${y - r} L ${x + r * 0.2} ${y - r * 0.2} L ${x + r} ${y} L ${x + r * 0.2} ${y + r * 0.2} L ${x} ${y + r} L ${x - r * 0.2} ${y + r * 0.2} L ${x - r} ${y} L ${x - r * 0.2} ${y - r * 0.2} Z" fill="${fill}"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<rect width="${WIDTH}" height="${HEIGHT}" fill="${CREAM}"/>
<path d="M0 0 H 1020 C 980 300 1060 700 1000 1000 H 0 Z" fill="#fbe6bd"/>
${boomerang(40, 40, 1.6, TEAL)}${boomerang(820, 920, 1.4, ORANGE)}${boomerang(900, 50, 0.9, MUSTARD)}
${sparkle(300, 70, 16, ORANGE)}${sparkle(700, 60, 10, TEAL)}${sparkle(980, 470, 12, ORANGE)}${sparkle(60, 960, 12, TEAL)}${sparkle(1570, 640, 14, MUSTARD)}
<text x="460" y="88" font-family="Arial Rounded MT Bold, Malgun Gothic, sans-serif" font-weight="900" font-size="30" fill="${CHARCOAL}" text-anchor="middle" letter-spacing="6">레인 1 – 10</text>
<path d="M40 104 H 1000" stroke="${CHARCOAL}" stroke-width="3"/>
<rect x="1040" y="630" width="524" height="330" rx="22" fill="#ffffff" stroke="${CHARCOAL}" stroke-width="3"/>
</svg>`;
  return svgDataUrl(svg);
}

// ── Elements ───────────────────────────────────────────────────────────────────────────────────────────────────

/** Ten pins in their triangle, a lit pin standing and a ring one knocked down — the pins as data: `--p` is a bit mask. */
const PIN = (on: boolean) => (on ? `radial-gradient(circle,${CHARCOAL} 0 5.5px,transparent 6px)` : `radial-gradient(circle,transparent 0 4px,rgba(43,43,43,.3) 4.5px 5.5px,transparent 6px)`);

/** A lane seen from above — read from `l`. */
const lane: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['l'], properties: { l: { type: 'object' } } },
  template: `<article class="ln {{l.state}}"><b class="no">{{l.no}}</b><div class="who"><strong>{{l.party}}</strong><small>{{l.note}}</small></div><div class="wood"><span class="frame">{{l.frame}}</span><span class="best">최고 {{l.best}}</span></div><ol class="pins">{{#l.pins}}<li class="p{{.}}"></li>{{/l.pins}}</ol></article>`,
  style: `.ln{height:100%;box-sizing:border-box;display:grid;grid-template-columns:62px 190px 1fr 104px;align-items:center;gap:10px;padding:0 10px 0 6px;background:${CREAM};border:3px solid ${CHARCOAL};border-radius:34px 10px 10px 34px;font-family:${TEXT};color:${CHARCOAL}}
.no{display:grid;place-items:center;width:56px;height:56px;font:900 22px ${DISPLAY};color:${CHARCOAL};background:#ffffff;border-radius:50%;border:3px solid ${CHARCOAL};box-sizing:border-box}
.who{display:grid;gap:2px;min-width:0}
strong{font-size:17px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
small{font-size:12px;font-weight:700;color:#6d6458;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wood{height:40px;display:flex;align-items:center;justify-content:space-between;padding:0 14px;border-radius:4px;background:repeating-linear-gradient(90deg,transparent 0 22px,rgba(122,78,30,.18) 22px 23px),linear-gradient(180deg,#f2d39f,${MAPLE} 50%,#d9ae6e);box-shadow:inset 0 0 0 2px rgba(43,43,43,.25)}
.frame{font:900 15px ${DISPLAY}}
.best{font-size:13px;font-weight:800}
.pins{position:relative;margin:0 auto;padding:0;list-style:none;width:59px;height:53px}
.pins li{position:absolute;width:14px;height:14px;background:${PIN(false)}}
.pins li.p1{background:${PIN(true)}}
.pins li:nth-child(1){left:0px;top:19.5px}
.pins li:nth-child(2){left:15px;top:13px}
.pins li:nth-child(3){left:15px;top:26px}
.pins li:nth-child(4){left:30px;top:6.5px}
.pins li:nth-child(5){left:30px;top:19.5px}
.pins li:nth-child(6){left:30px;top:32.5px}
.pins li:nth-child(7){left:45px;top:0px}
.pins li:nth-child(8){left:45px;top:13px}
.pins li:nth-child(9){left:45px;top:26px}
.pins li:nth-child(10){left:45px;top:39px}
.playing{border-color:${TEAL_DEEP};background:#e7f6f5}
.playing .no{background:${MUSTARD};clip-path:${STAR};border:none;width:62px;height:62px;color:${CHARCOAL}}
.free .wood{opacity:.55}
.free .no{border-style:dashed}
.booked .no{background:${TEAL};color:#fff}
.booked .frame::before{content:"◷ "}
.oiling .no{background:${ORANGE};color:#fff}
.oiling .wood{background:repeating-linear-gradient(-45deg,${MAPLE} 0 10px,#c99a5b 10px 20px)}
.oiling .frame::before{content:"⚙ "}`,
  size: { width: 960, height: 66 },
};

/** The alley's sign, a Googie roadside sign. */
const sign: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['t'], properties: { t: { type: 'object' } } },
  template: `<header class="sg"><i></i><small>{{t.series}}</small><h1>{{t.name}}</h1><div><span>{{t.date}}</span><b>{{t.time}}</b></div></header>`,
  style: `.sg{position:relative;height:100%;box-sizing:border-box;display:grid;align-content:center;gap:4px;padding:14px 30px 14px 120px;background:${TEAL};border:4px solid ${CHARCOAL};border-radius:80px 18px 80px 18px;font-family:${TEXT};color:#ffffff;overflow:hidden}
i{position:absolute;left:18px;top:50%;width:84px;height:84px;margin-top:-42px;background:${MUSTARD};clip-path:${STAR}}
small{font:800 13px ${DISPLAY};letter-spacing:.24em;color:${CREAM}}
h1{margin:0;font:900 42px ${DISPLAY};letter-spacing:.04em;color:${CREAM};text-shadow:3px 3px 0 ${ORANGE},5px 5px 0 ${CHARCOAL}}
div{display:flex;justify-content:space-between;align-items:baseline}
span{font-size:16px;font-weight:700}
b{padding:2px 14px;border-radius:999px;background:${ORANGE};font:900 24px ${DISPLAY}}`,
  size: { width: 524, height: 170 },
};

/** The figures now, each on a boomerang card. */
const figures: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, value: { type: 'string' }, note: { type: 'string' } } } } },
  },
  template: `<dl class="fg">{{#items}}<div><dt>{{label}}</dt><dd>{{value}}</dd><small>{{note}}</small></div>{{/items}}</dl>`,
  style: `.fg{margin:0;height:100%;box-sizing:border-box;display:grid;grid-template-columns:repeat(3,1fr);gap:12px;font-family:${TEXT};color:${CHARCOAL}}
div{display:grid;align-content:center;justify-items:center;text-align:center;background:#ffffff;border:3px solid ${CHARCOAL};border-radius:30px 6px 30px 6px}
dt{font-size:13px;font-weight:800}
dd{margin:0;font:900 30px ${DISPLAY};color:${ORANGE}}
small{font-size:12px;font-weight:700}`,
  size: { width: 524, height: 110 },
};

/** The key to the lamps. */
const legend: ElementDefinition = {
  render: 'template',
  props: { type: 'object', properties: {} },
  template: `<ul class="ky"><li><i class="playing"></i>게임 중</li><li><i class="free"></i>빈 레인</li><li><i class="booked">◷</i>예약</li><li><i class="oiling">⚙</i>오일 작업</li><li><b class="up"></b>선 핀</li></ul>`,
  style: `.ky{height:100%;box-sizing:border-box;margin:0;padding:0 16px;list-style:none;display:flex;align-items:center;justify-content:space-between;background:#ffffff;border:3px solid ${CHARCOAL};border-radius:999px;font:800 13px ${TEXT};color:${CHARCOAL}}
li{display:flex;align-items:center;gap:6px}
i{display:grid;place-items:center;width:24px;height:24px;border-radius:50%;box-sizing:border-box;font:900 12px ${TEXT};font-style:normal}
.playing{background:${MUSTARD};clip-path:${STAR};border-radius:0}
.free{border:2px dashed ${CHARCOAL}}
.booked{background:${TEAL};color:#fff}
.oiling{background:${ORANGE};color:#fff}
.up{display:inline-block;width:14px;height:14px;background:${PIN(true)}}`,
  size: { width: 524, height: 50 },
};

/** The parties waiting for a lane. */
const waiting: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { no: { type: 'string' }, party: { type: 'string' }, size: { type: 'string' }, wait: { type: 'string' }, state: { type: 'string' } } } } },
  },
  template: `<section class="wt"><h2>대기 명단</h2><ol>{{#items}}<li class="{{state}}"><b>{{no}}</b><span>{{party}}</span><small>{{size}}</small><em>{{wait}}</em></li>{{/items}}</ol></section>`,
  style: `.wt{height:100%;box-sizing:border-box;padding:12px 20px;background:${ORANGE};border:3px solid ${CHARCOAL};border-radius:18px 60px 18px 60px;font-family:${TEXT};color:#ffffff}
h2{margin:0 0 8px;font:900 19px ${DISPLAY};letter-spacing:.08em}
ol{margin:0;padding:0;list-style:none;display:grid;gap:6px}
li{display:grid;grid-template-columns:34px 1fr 50px 82px;align-items:center;gap:10px;padding:5px 10px;border-radius:999px;background:rgba(255,255,255,.18);font-size:15px;font-weight:700}
b{display:grid;place-items:center;width:28px;height:28px;border-radius:50%;background:${CREAM};color:${CHARCOAL};font:900 13px ${DISPLAY}}
small{font-size:13px;text-align:right}
em{font-style:normal;font-weight:900;text-align:right;white-space:nowrap}
.next{background:${CREAM};color:${CHARCOAL}}
.next em::before{content:"▶ ";color:${ORANGE}}`,
  size: { width: 524, height: 196 },
};

// ── The board ──────────────────────────────────────────────────────────────────────────────────────────────────

const node = (id: string, x: number, y: number, width: number, height: number, widget: Widget): Node => ({ id, x, y, width, height, anchored: false, widget });

const LANES = ['l1', 'l2', 'l3', 'l4', 'l5', 'l6', 'l7', 'l8', 'l9', 'l10'] as const;

const nodes: Node[] = [
  ...LANES.map((id, i) => node(`lane-${id}`, 40, 122 + i * 84, 960, 66, { type: 'element:lane', props: { l: {} }, bindings: { l: bind('/alley/lanes', `/value/${id}`) } })),
  node('sign', 1040, 36, 524, 170, { type: 'element:sign', props: { t: {} }, bindings: { t: bind('/alley/now', '/value') } }),
  node('figures', 1040, 222, 524, 110, { type: 'element:figures', props: { items: [] }, bindings: { items: bind('/alley/figures', '/value') } }),
  node('legend', 1040, 348, 524, 50, { type: 'element:legend', props: {} }),
  node('waiting', 1040, 414, 524, 196, { type: 'element:waiting', props: { items: [] }, bindings: { items: bind('/alley/waiting', '/value') } }),
  node('use', 1056, 646, 492, 302, {
    type: 'chart.bar',
    props: { title: '시간별 사용 레인 (10개 중)', data: [], mapping: { x: 'hour', y: 'lanes' }, options: { series: [{ label: '사용 레인', color: TEAL }] } },
    bindings: { data: bind('/alley/use', '/value') },
  }),
];

const document: CanvasView = {
  kind: 'canvas',
  appearance: 'light',
  accent: ORANGE,
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes,
  connectors: [],
  elements: { lane, sign, figures, legend, waiting },
};

export const bowlingGoogie: SamplePack = {
  id: 'bowling-googie',
  title: { ko: '볼링장의 목요일 밤 — 구기 양식', en: 'A bowling alley’s Thursday night — Googie' },
  field: { ko: '볼링·실내 레저', en: 'Bowling & indoor leisure' },
  kind: { ko: '레인 상태·남은 핀·대기 명단', en: 'Lanes, pins standing and the waiting list' },
  domain: 'leisure',
  styles: ['retro'],
  summary: {
    ko: '볼링장의 목요일 밤을 1950년대 길가의 구기(Googie) 양식으로 — 크림 바탕에 청록과 원자 시대 주황, 부메랑과 별 폭발, 모텔 간판 같은 표지판. 레인마다 위에서 본 단풍나무 바닥 한 줄과 그 끝의 핀 열 개 — 지금 굴리는 프레임에서 서 있는 핀은 지금 선 그대로. 레인 상태는 색과 함께 번호의 등으로: 게임 중이면 켜진 별, 빈 레인은 점선 고리, 예약은 시계, 오일 작업 중이면 빗금 바닥에 톱니. 오른쪽에 볼링장 간판, 지금 수치, 범례, 대기 명단, 시간별 사용 레인. 볼링장은 지어낸 것이라 예시 데이터입니다.',
    en: 'A bowling alley’s Thursday night in the Googie style of the 1950s roadside — turquoise and atomic orange on cream, boomerangs and starbursts, a sign like a motel’s. Every lane is a strip of maple seen from above with its ten pins at the far end — the pins still standing in the frame being bowled, as they stand now. A lane tells its state by the lamp on its number as well as by colour: a lit starburst while a party bowls, a dashed ring when it is free, a clock when it is booked, a gear over hatched wood while the oiling machine runs. On the right the alley’s sign, the figures now, the key, the parties waiting and the lanes in use by the hour. The alley is made up. Example data.',
  },
  connectors: [ALLEY],
  document,
  snapshot,
};
