import type { Binding, CanvasView, ElementDefinition, Node, Widget } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { svgDataUrl } from '../frame.js';
import { snapshot } from '../snapshots/coldchain-vapor.js';

// A cold-chain warehouse drawn as vaporwave: a pastel sunset over a magenta perspective grid, and in front of it the six
// temperature zones as frosted glass cards in a row — each zone's temperature in chrome, a thermometer from −80 to
// +25 ℃ with the zone's band and a marker where it is now, its load and door count — and its state in a mark, a word
// and the card's edge: ● steady (a mint edge), ❄ defrosting (cyan, the brief rise is expected), ▮ door held open
// (dashed yellow), ▲ out of band (hot pink). Below, the zone out of band over the last day against its limit, and the
// reefer trucks at the docks. The warehouse is made up, so the values are example data.

export const WAREHOUSE: ExampleSampleConnector = {
  key: 'warehouse',
  name: '예시 콜드체인 물류센터 API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 물류센터가 아닙니다' },
};

/** The zone loggers report every minute; ten minutes without one is a logger to check before the zone is. */
const MAX_AGE_SECONDS = 10 * 60;

const bind = (path: string, valuePath: string): Binding => ({
  adapter: WAREHOUSE.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
});

const WIDTH = 1600;
const HEIGHT = 1000;
const NIGHT = '#1a0b2e';
const PINK = '#ff71ce';
const CYAN = '#01cdfe';
const MINT = '#05ffa1';
const LEMON = '#fffb96';
const LILAC = '#b967ff';
const TEXT = '"Pretendard", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';

const CARD_W = 230;
const CARD_H = 330;
const ZONES = ['frzA', 'frzB', 'chl1', 'chl2', 'amb', 'ult'] as const;
const cardAt = (i: number) => ({ x: 60 + i * (CARD_W + 15), y: 130 });
const HORIZON = 480;

// ── The sunset ─────────────────────────────────────────────────────────────────────────────────────────────────

function drawing(): string {
  // A perspective grid: horizontal lines closing toward the horizon, rays from a vanishing point at its centre.
  const vx = WIDTH / 2;
  const rows = Array.from({ length: 14 }, (_, i) => {
    const y = HORIZON + Math.round((HEIGHT - HORIZON) * Math.pow(i / 13, 2.2));
    return `<line x1="0" x2="${WIDTH}" y1="${y}" y2="${y}"/>`;
  }).join('');
  const rays = Array.from({ length: 25 }, (_, i) => {
    const x = -1600 + i * (4800 / 24);
    return `<line x1="${vx}" y1="${HORIZON}" x2="${x}" y2="${HEIGHT}"/>`;
  }).join('');
  // The sun, cut by bands that thicken toward the horizon.
  const cuts = Array.from({ length: 7 }, (_, i) => {
    const y = 330 + i * 22;
    return `<rect x="560" y="${y}" width="480" height="${3 + i * 2}" fill="url(#sky)"/>`;
  }).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="${HORIZON}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${NIGHT}"/><stop offset=".45" stop-color="#4a1c6b"/><stop offset=".8" stop-color="#c2408f"/><stop offset="1" stop-color="#ff9a8b"/></linearGradient>
<linearGradient id="sun" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${LEMON}"/><stop offset=".6" stop-color="#ffb26b"/><stop offset="1" stop-color="${PINK}"/></linearGradient>
<linearGradient id="floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b0f45"/><stop offset="1" stop-color="${NIGHT}"/></linearGradient>
</defs>
<rect width="${WIDTH}" height="${HORIZON}" fill="url(#sky)"/>
<circle cx="${vx}" cy="${HORIZON - 10}" r="230" fill="url(#sun)"/>
${cuts}
<rect y="${HORIZON}" width="${WIDTH}" height="${HEIGHT - HORIZON}" fill="url(#floor)"/>
<g stroke="${PINK}" stroke-width="1.6" opacity=".55">${rows}${rays}</g>
<line x1="0" x2="${WIDTH}" y1="${HORIZON}" y2="${HORIZON}" stroke="${CYAN}" stroke-width="2" opacity=".8"/>
<rect x="50" y="500" width="780" height="470" rx="10" fill="${NIGHT}" fill-opacity=".82" stroke="${CYAN}" stroke-width="2"/>
<rect x="850" y="500" width="700" height="470" rx="10" fill="${NIGHT}" fill-opacity=".82" stroke="${LILAC}" stroke-width="2"/>
</svg>`;
  return svgDataUrl(svg);
}

// ── Elements ───────────────────────────────────────────────────────────────────────────────────────────────────

/** A temperature zone as a frosted glass card — read from `z`: name, temperature, band and set range, a thermometer from
 *  −80 to +25 ℃ with the band (`--lo`–`--hi`) and a marker (`--v`), load and door count, and the state. */
const zone: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['z'], properties: { z: { type: 'object' } } },
  template: `<article class="zc {{z.state}}" style="--v: {{z.temp}}; --lo: {{z.lo}}; --hi: {{z.hi}}"><p class="en">{{z.en}}</p><h2>{{z.name}}</h2><p class="t"><b>{{z.temp}}</b>℃</p><div class="th"><div class="band"></div><div class="mark"></div></div><p class="set">설정 {{z.lo}} ~ {{z.hi}}℃</p><dl><div><dt>적재</dt><dd>{{z.load}}</dd></div><div><dt>문 열림</dt><dd>{{z.doors}}</dd></div></dl><p class="word"><i></i>{{z.word}}</p><p class="note">{{z.note}}</p></article>`,
  style: `.zc{height:100%;box-sizing:border-box;padding:14px 16px;border:3px solid ${MINT};border-radius:14px;background:rgba(26,11,46,.62);backdrop-filter:blur(6px);font-family:${TEXT};color:#fff;display:grid;grid-template-rows:auto auto auto auto auto auto 1fr auto;gap:6px;box-shadow:0 0 18px rgba(5,255,161,.25)}
.en{margin:0;font-size:11px;letter-spacing:.5em;color:${CYAN}}
h2{margin:0;font-size:24px;font-weight:800}
.t{margin:0;font-size:16px}
.t b{font:italic 900 46px ${TEXT};letter-spacing:-1px;background:linear-gradient(180deg, #ffffff 0%, #c9d6ff 45%, #6b5bd6 52%, #f4c6ff 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
.th{position:relative;height:12px;border-radius:6px;background:linear-gradient(90deg, ${CYAN}, ${LILAC} 60%, ${PINK});opacity:.9}
.band{position:absolute;top:-3px;bottom:-3px;left:calc((var(--lo) + 80) * 100% / 105);width:calc((var(--hi) - var(--lo)) * 100% / 105);min-width:6px;border:2px solid #fff;border-radius:4px}
.mark{position:absolute;top:-8px;width:4px;height:28px;margin-left:-2px;left:calc((var(--v) + 80) * 100% / 105);background:#fff;box-shadow:0 0 0 2px ${NIGHT}}
.set{margin:0;font-size:12px;color:#d9c7f5}
dl{margin:0;display:grid;grid-template-columns:1fr 1fr;gap:4px}
dl div{background:rgba(255,255,255,.08);border-radius:6px;padding:4px 8px}
dt{font-size:11px;color:#d9c7f5}dd{margin:0;font-size:16px;font-weight:700}
.word{margin:0;align-self:end;justify-self:start;display:flex;gap:6px;align-items:center;padding:2px 12px;border:2px solid ${MINT};border-radius:999px;font-size:15px;font-weight:800;color:${MINT}}
i{font-style:normal}
.note{margin:0;font-size:12px;line-height:1.4;color:#e8dcff}
.ok i::before{content:"●"}
.defrost{border-color:${CYAN};box-shadow:0 0 18px rgba(1,205,254,.3)}.defrost .word{border-color:${CYAN};color:${CYAN}}.defrost i::before{content:"❄"}
.door{border-color:${LEMON};border-style:dashed;box-shadow:none}.door .word{border-color:${LEMON};border-style:dashed;color:${LEMON}}.door i::before{content:"▮"}
.alarm{border-color:${PINK};border-width:5px;box-shadow:0 0 26px rgba(255,113,206,.6)}.alarm .word{background:${PINK};border-color:${PINK};color:${NIGHT}}.alarm i::before{content:"▲"}.alarm .mark{background:${PINK};box-shadow:0 0 0 2px #fff}`,
  size: { width: CARD_W, height: CARD_H },
};

/** The warehouse's name in chrome on the sky, with the time and the four states as a key. */
const banner: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['n'], properties: { n: { type: 'object' } } },
  template: `<header class="bn"><h1>새벽별 콜드체인 센터</h1><p>{{n.date}} {{n.time}}</p><ul><li class="o">● 정상</li><li class="d">❄ 제상 중</li><li class="r">▮ 문 열림</li><li class="a">▲ 온도 이탈</li></ul></header>`,
  style: `.bn{height:100%;display:flex;align-items:center;gap:22px;font-family:${TEXT};color:#fff}
h1{margin:0;white-space:nowrap;font:italic 900 40px ${TEXT};letter-spacing:.02em;background:linear-gradient(180deg, #ffffff 0%, #c9d6ff 45%, #6b5bd6 52%, #f4c6ff 100%);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(2px 2px 0 ${PINK})}
p{margin:0;white-space:nowrap;font-size:16px;letter-spacing:.2em;color:${LEMON}}
ul{margin:0 0 0 auto;padding:0;list-style:none;display:flex;gap:8px}
li{white-space:nowrap;font-size:13px;font-weight:800;padding:2px 10px;border:2px solid;border-radius:999px}
.o{color:${MINT}}.d{color:${CYAN}}.r{color:${LEMON};border-style:dashed}.a{background:${PINK};border-color:${PINK};color:${NIGHT}}`,
  size: { width: 1480, height: 80 },
};

/** The reefer trucks at the docks — read from `items`. */
const docks: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { dock: { type: 'string' }, truck: { type: 'string' }, what: { type: 'string' }, time: { type: 'string' }, state: { type: 'string' }, word: { type: 'string' } } } } },
  },
  template: `<section class="dk"><h2>DOCKS · 도크 입출고</h2><ol>{{#items}}<li class="{{state}}"><b>{{dock}}</b><span><strong>{{truck}}</strong><small>{{what}}</small></span><time>{{time}}</time><em>{{word}}</em></li>{{/items}}</ol></section>`,
  style: `.dk{height:100%;box-sizing:border-box;padding:4px 6px;font-family:${TEXT};color:#fff}
h2{margin:0 0 12px;font:italic 900 22px ${TEXT};letter-spacing:.1em;color:${LILAC}}
ol{margin:0;padding:0;list-style:none;display:grid;gap:8px}
li{display:grid;grid-template-columns:64px minmax(0,1fr) 56px 88px;gap:10px;align-items:center;padding:6px 10px;border-radius:8px;background:rgba(255,255,255,.06)}
b{font:italic 900 20px ${TEXT};color:${CYAN}}
span{display:grid;min-width:0}strong{font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}small{font-size:12px;color:#d9c7f5;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
time{font-size:13px;color:#d9c7f5;font-variant-numeric:tabular-nums}
em{font-style:normal;font-size:13px;font-weight:800;text-align:center;border:2px solid #fff;border-radius:999px;padding:1px 0}
.loading em{border-color:${MINT};color:${MINT}}
.waiting em{border-color:${LEMON};border-style:dashed;color:${LEMON}}
.held em{background:${PINK};border-color:${PINK};color:${NIGHT}}
.done{opacity:.55}`,
  size: { width: 660, height: 430 },
};

// ── The board ──────────────────────────────────────────────────────────────────────────────────────────────────

const node = (id: string, x: number, y: number, width: number, height: number, widget: Widget): Node => ({ id, x, y, width, height, anchored: false, widget });

const nodes: Node[] = [
  node('banner', 60, 28, 1480, 80, { type: 'element:banner', props: { n: {} }, bindings: { n: bind('/warehouse/now', '/value') } }),
  ...ZONES.map((id, i) => {
    const { x, y } = cardAt(i);
    return node(`zone-${id}`, x, y, CARD_W, CARD_H, { type: 'element:zone', props: { z: {} }, bindings: { z: bind('/warehouse/zones', `/value/${id}`) } });
  }),
  node('frzb-trend', 70, 515, 740, 440, {
    type: 'chart.line',
    props: {
      title: '냉동 B — 지난 24시간 온도 (℃)',
      data: [],
      mapping: { x: 'hour', y: ['temp', 'limit'] },
      options: { series: [{ label: '온도', color: CYAN }, { label: '상한 -20℃', color: PINK }], echarts: { yAxis: { min: -26, max: -16 } } },
    },
    bindings: { data: bind('/warehouse/frzb', '/value') },
  }),
  node('docks', 870, 520, 660, 430, { type: 'element:docks', props: { items: [] }, bindings: { items: bind('/warehouse/docks', '/value') } }),
];

const document: CanvasView = {
  kind: 'canvas',
  appearance: 'dark',
  accent: PINK,
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes,
  connectors: [],
  elements: { zone, banner, docks },
};

export const coldchainVapor: SamplePack = {
  id: 'coldchain-vapor',
  title: { ko: '콜드체인 물류센터 — 베이퍼웨이브', en: 'A cold-chain warehouse — vaporwave' },
  field: { ko: '콜드체인·냉장 물류', en: 'Cold-chain logistics' },
  kind: { ko: '온도 구역별 상태', en: 'Temperature zones' },
  domain: 'logistics',
  styles: ['retro'],
  summary: {
    ko: '콜드체인 물류센터를 베이퍼웨이브로 — 파스텔 노을과 자홍 원근 격자 앞에 온도 구역 여섯이 서리 유리 카드로 한 줄: 크롬 글씨의 온도, −80~+25 ℃ 온도계 위에 구역의 설정 띠와 지금 표지, 적재와 문 열림 횟수, 그리고 상태가 기호·낱말·카드 테로 — ● 정상(민트), ❄ 제상 중(청록 — 잠깐 오르는 것은 정상), ▮ 문 열림(노란 점선), ▲ 온도 이탈(핫핑크). 아래에 이탈한 구역의 지난 24시간 온도와 상한, 도크의 냉동 탑차. 물류센터는 지어낸 것이라 예시 데이터입니다.',
    en: 'A cold-chain warehouse drawn as vaporwave — in front of a pastel sunset and a magenta perspective grid, the six temperature zones as frosted glass cards in a row: each zone’s temperature in chrome, a thermometer from −80 to +25 ℃ with the zone’s band and a marker where it is now, its load and door count, and its state in a mark, a word and the card’s edge — ● steady (mint), ❄ defrosting (cyan — the brief rise is expected), ▮ door held open (dashed yellow), ▲ out of band (hot pink). Below, the zone out of band over the last day against its limit, and the reefer trucks at the docks. The warehouse is made up. Example data.',
  },
  connectors: [WAREHOUSE],
  document,
  snapshot,
};
