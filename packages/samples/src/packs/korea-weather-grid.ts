import type { Binding, CanvasView, ElementDefinition, Node } from '@iyulab/u-board/domain';
import type { SampleConnector, SamplePack } from '../sample-pack.js';
import { escapeXml, svgDataUrl } from '../frame.js';
import { SEOUL_TIME_ZONE } from './gwanghwamun.js';
import { snapshot } from '../snapshots/korea-weather-grid.js';

// The weather now in fourteen towns across Korea, from the national weather service's hourly observations on its
// forecast grid — drawn on that grid itself, the way a plotter draws: a lattice of points five kilometres apart,
// the grid numbers along the edges, and every town a dot at its own grid point with a card on a leader line. The
// source is asked for the data of a given hour (`base_date`, `base_time`), which it has out about forty minutes
// after the hour; it issues each user a key, and says in its answer whether it served the request.

export const KMA_NOW: SampleConnector = {
  key: 'kma-now',
  name: '기상청 단기예보 조회서비스',
  baseUrl: 'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0',
  authType: 'query',
  authParamName: 'serviceKey',
  ownKey: {
    signUpUrl: 'https://www.data.go.kr/data/15084084/openapi.do',
    env: 'DATA_GO_KR_KEY',
    hint: '공공데이터포털에서 «기상청_단기예보 조회서비스»를 활용신청하고, 일반 인증키(Decoding)를 넣습니다.',
  },
  sourceError: { path: '/response/header/resultCode', ok: ['00'], messagePath: '/response/header/resultMsg' },
  attribution: { text: '기상청 초단기실황 (공공데이터포털)', url: 'https://www.kma.go.kr' },
};

/** The hour's observations at grid point (`nx`, `ny`) — every kind in one answer, one item each (`category`). The
 *  hour is the latest the source has out: an hour's data is published about forty minutes after it. */
const nowPath = (nx: number, ny: number) =>
  `/getUltraSrtNcst?pageNo=1&numOfRows=10&dataType=JSON&base_date={{now:yyyyMMdd}}&base_time={{now:HHmm}}&nx=${nx}&ny=${ny}`;

/** Observed on the hour, out forty minutes later: up to a hundred minutes old before the next. */
const MAX_AGE_SECONDS = 2 * 60 * 60;

/** One kind of observation at a grid point: T1H temperature (℃), REH humidity (%), RN1 the last hour's rain (mm),
 *  WSD wind speed (m/s), PTY what is falling (0 nothing, 1 rain, 2 rain and snow, 3 snow, 5 drizzle, 6 drizzle and
 *  snow flurries, 7 snow flurries). */
const observed = (nx: number, ny: number, category: string): Binding => ({
  adapter: KMA_NOW.key,
  ref: {
    path: nowPath(nx, ny),
    item: { list: '/response/body/items/item', where: { category } },
    valuePath: '/obsrValue',
    timeZone: SEOUL_TIME_ZONE,
    requestTime: { delaySeconds: 40 * 60, stepSeconds: 60 * 60 },
    maxAgeSeconds: MAX_AGE_SECONDS,
  },
});

const WIDTH = 1600;
const HEIGHT = 1010;
const PAPER = '#f3efe4';
const INK = '#23303a';
const FAINT = '#c9c2ae';
const RULE = '#8d846c';
const RED = '#b8432f';
const MONO = '"D2Coding", "Consolas", "Menlo", monospace';
const TEXT = '"Pretendard", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
/** The same faces, as an SVG attribute takes them. */
const PLOT_MONO = 'D2Coding, Consolas, Menlo, monospace';

/** Where grid point (nx, ny) is drawn: nine pixels a grid step (5 km), north up. */
const SCALE = 9;
const at = (nx: number, ny: number) => ({ x: 60 + (nx - 15) * SCALE, y: 60 + (138 - ny) * SCALE });

const CARD = { width: 160, height: 76 };

/** Each town at the grid point of its city hall (the weather service's own conversion of its latitude and
 *  longitude), and where its card sits. */
const TOWNS = [
  { id: 'baengnyeong', name: '백령도', nx: 20, ny: 135, card: { x: 125, y: 60 } },
  { id: 'seoul', name: '서울', nx: 60, ny: 127, card: { x: 300, y: 92 } },
  { id: 'incheon', name: '인천', nx: 55, ny: 124, card: { x: 240, y: 192 } },
  { id: 'chuncheon', name: '춘천', nx: 73, ny: 134, card: { x: 604, y: 24 } },
  { id: 'gangneung', name: '강릉', nx: 92, ny: 132, card: { x: 784, y: 122 } },
  { id: 'ulleung', name: '울릉도', nx: 127, ny: 127, card: { x: 980, y: 196 } },
  { id: 'cheongju', name: '청주', nx: 69, ny: 107, card: { x: 572, y: 250 } },
  { id: 'daejeon', name: '대전', nx: 67, ny: 100, card: { x: 330, y: 380 } },
  { id: 'andong', name: '안동', nx: 91, ny: 106, card: { x: 776, y: 300 } },
  { id: 'jeonju', name: '전주', nx: 63, ny: 89, card: { x: 300, y: 490 } },
  { id: 'daegu', name: '대구', nx: 89, ny: 91, card: { x: 764, y: 430 } },
  { id: 'gwangju', name: '광주', nx: 58, ny: 74, card: { x: 250, y: 620 } },
  { id: 'busan', name: '부산', nx: 98, ny: 76, card: { x: 842, y: 600 } },
  { id: 'jeju', name: '제주', nx: 53, ny: 38, card: { x: 440, y: 900 } },
] as const;

/** The point of a card's edge nearest `p` — where its leader line meets it. */
function nearestOnCard(p: { x: number; y: number }, card: { x: number; y: number }) {
  return {
    x: Math.min(Math.max(p.x, card.x), card.x + CARD.width),
    y: Math.min(Math.max(p.y, card.y), card.y + CARD.height),
  };
}

// ── The plot ───────────────────────────────────────────────────────────────────────────────────────────────────

function drawing(): string {
  const lattice: string[] = [];
  for (let nx = 15; nx <= 130; nx += 5) {
    for (let ny = 35; ny <= 138; ny += 5) {
      const { x, y } = at(nx, ny);
      lattice.push(`<circle cx="${x}" cy="${y}" r="${nx % 25 === 0 && ny % 25 === 0 ? 2 : 1}" fill="${FAINT}"/>`);
    }
  }
  const ticks: string[] = [];
  for (let nx = 25; nx <= 125; nx += 25) {
    const { x } = at(nx, 0);
    ticks.push(`<path d="M${x} 40 v 10 M${x} ${HEIGHT - 50} v 10" stroke="${RULE}"/><text x="${x}" y="34" font-family="${PLOT_MONO}" font-size="12" fill="${RULE}" text-anchor="middle">nx ${nx}</text>`);
  }
  for (let ny = 50; ny <= 125; ny += 25) {
    const { y } = at(0, ny);
    ticks.push(`<path d="M40 ${y} h 10" stroke="${RULE}"/><text x="36" y="${y + 4}" font-family="${PLOT_MONO}" font-size="12" fill="${RULE}" text-anchor="end">${ny}</text>`);
  }
  const towns = TOWNS.map(({ nx, ny, card }) => {
    const p = at(nx, ny);
    const q = nearestOnCard(p, card);
    // The grid number goes on the side of the dot away from its card.
    const cardRight = card.x > p.x - CARD.width / 2;
    const cardBelow = card.y > p.y - CARD.height / 2;
    return `<path d="M${p.x} ${p.y} L ${q.x} ${q.y}" stroke="${INK}" stroke-width="1" stroke-dasharray="2 3"/>
<circle cx="${p.x}" cy="${p.y}" r="5" fill="${PAPER}" stroke="${RED}" stroke-width="2"/><circle cx="${p.x}" cy="${p.y}" r="1.6" fill="${RED}"/>
<text x="${p.x + (cardRight ? -8 : 8)}" y="${p.y + (cardBelow ? -9 : 17)}" font-family="${PLOT_MONO}" font-size="10" fill="${RULE}" text-anchor="${cardRight ? 'end' : 'start'}">${nx},${ny}</text>`;
  });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<rect width="${WIDTH}" height="${HEIGHT}" fill="${PAPER}"/>
<rect x="50" y="50" width="${1150 - 50}" height="${HEIGHT - 100}" fill="none" stroke="${RULE}" stroke-width="1.5"/>
${lattice.join('')}
${ticks.join('')}
${towns.join('\n')}
<text x="60" y="${HEIGHT - 20}" font-family="${PLOT_MONO}" font-size="12" fill="${RULE}">${escapeXml('기상청 동네예보 격자 — 점 하나가 5 km, 굵은 점은 25칸마다 · 해안선은 그리지 않음 · 위가 북쪽')}</text>
</svg>`;
  return svgDataUrl(svg);
}

// ── Elements ───────────────────────────────────────────────────────────────────────────────────────────────────

/** A town's card: its name and what is falling — a word as well as the edge's colour, with the last hour's rain
 *  when anything falls — then the temperature large, and humidity and wind beside it. */
const town: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string' },
      temp: { type: 'string' },
      humidity: { type: 'string' },
      wind: { type: 'string' },
      rain: { type: 'string' },
      falling: { type: 'string' },
    },
  },
  template: `<article class="tw p{{falling}}"><header><b>{{name}}</b><i><em>{{rain}} mm</em></i></header><strong>{{temp | fixed:1}}<sup>℃</sup></strong><p><span>습도 {{humidity}}%</span><span>바람 {{wind | fixed:1}}m/s</span></p></article>`,
  style: `.tw{height:100%;box-sizing:border-box;display:grid;grid-template-columns:auto 1fr;grid-template-rows:auto 1fr;column-gap:10px;padding:6px 10px 6px 9px;background:#fffdf7;border:1.5px solid ${INK};border-left-width:6px;font-family:${TEXT};color:${INK}}
header{grid-column:1/-1;display:flex;justify-content:space-between;align-items:baseline;gap:6px}
b{font-size:15px;white-space:nowrap}
strong{align-self:center;white-space:nowrap;font:700 26px/1 ${MONO};letter-spacing:-1px}
sup{font-size:12px;margin-left:1px;letter-spacing:0}
p{align-self:center;justify-self:end;margin:0;display:grid;gap:2px;text-align:right;font:11px ${MONO};color:#4b5862;white-space:nowrap}
i{font-style:normal;font:700 12px ${TEXT};white-space:nowrap}
em{display:none;margin-left:4px;font-style:normal;font:11px ${MONO}}
i::before{content:'맑음·흐림';color:${RULE};font-weight:400}
.p1,.p5{border-left-color:#2f6fb5}.p1 i::before{content:'비';color:#2f6fb5}.p5 i::before{content:'빗방울';color:#2f6fb5}
.p2,.p6{border-left-color:#6a5fb0}.p2 i::before{content:'비·눈';color:#6a5fb0}.p6 i::before{content:'빗방울·눈날림';color:#6a5fb0}
.p3,.p7{border-left-color:#8fa8c0}.p3 i::before{content:'눈';color:#5d7f9e}.p7 i::before{content:'눈날림';color:#5d7f9e}
.p1 em,.p2 em,.p3 em,.p5 em,.p6 em,.p7 em{display:inline}`,
};

/** What the card's edge and word say. */
const legend: ElementDefinition = {
  render: 'template',
  props: { type: 'object', properties: {} },
  template: `<section class="lg"><h2>읽는 법</h2><dl><div><dt class="c0"></dt><dd>내리는 것 없음</dd></div><div><dt class="c1"></dt><dd>비 · 빗방울</dd></div><div><dt class="c2"></dt><dd>비·눈 · 빗방울·눈날림</dd></div><div><dt class="c3"></dt><dd>눈 · 눈날림</dd></div></dl><p>큰 숫자는 기온, 옆은 습도와 풍속. 비나 눈이 오면 낱말 옆에 지난 한 시간 강수량(mm)이 붙습니다. 점 옆의 숫자는 격자 번호(nx,ny).</p></section>`,
  style: `.lg{height:100%;box-sizing:border-box;padding:14px 18px;background:#fffdf7;border:1.5px solid ${INK};font-family:${TEXT};color:${INK}}
h2{margin:0 0 8px;font-size:15px}
dl{margin:0;display:grid;gap:6px}
dl div{display:flex;align-items:center;gap:10px;font-size:13px}
dt{width:22px;height:14px;border:1.5px solid ${INK};border-left-width:6px;background:#fffdf7}
dd{margin:0}
.c1{border-left-color:#2f6fb5}.c2{border-left-color:#6a5fb0}.c3{border-left-color:#8fa8c0}
p{margin:10px 0 0;font-size:12px;line-height:1.5;color:#4b5862}`,
};

/** The plot's title block, as a drawing's: what it shows and where it comes from. */
const title: ElementDefinition = {
  render: 'template',
  props: { type: 'object', properties: {} },
  template: `<header class="tb"><small>KMA · ULTRA-SHORT OBSERVATION</small><h1>지금, 전국 열네 곳</h1><p>기상청 초단기실황 — 정시 관측을 40분쯤 뒤에 냅니다. 동네예보 격자(5 km) 위에 도시마다 시청이 든 격자점.</p></header>`,
  style: `.tb{height:100%;box-sizing:border-box;padding:16px 18px;background:${INK};color:${PAPER};font-family:${TEXT};display:grid;align-content:center;gap:6px}
small{font:11px ${MONO};letter-spacing:2px;color:#c9c2ae}
h1{margin:0;font-size:26px}
p{margin:0;font-size:12.5px;line-height:1.5;color:#e4dfd0}`,
};

// ── The board ──────────────────────────────────────────────────────────────────────────────────────────────────

function townNode({ id, name, nx, ny, card }: (typeof TOWNS)[number]): Node {
  return {
    id: `town-${id}`,
    ...card,
    ...CARD,
    anchored: true,
    widget: {
      type: 'element:town',
      props: { name, temp: '', humidity: '', wind: '', rain: '', falling: '0' },
      bindings: {
        temp: observed(nx, ny, 'T1H'),
        humidity: observed(nx, ny, 'REH'),
        wind: observed(nx, ny, 'WSD'),
        rain: observed(nx, ny, 'RN1'),
        falling: observed(nx, ny, 'PTY'),
      },
    },
  };
}

const document: CanvasView = {
  kind: 'canvas',
  appearance: 'light',
  accent: RED,
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes: [
    ...TOWNS.map(townNode),
    { id: 'title', x: 1230, y: 50, width: 330, height: 170, anchored: false, widget: { type: 'element:title', props: {} } },
    { id: 'legend', x: 1230, y: 240, width: 330, height: 230, anchored: false, widget: { type: 'element:legend', props: {} } },
  ],
  connectors: [],
  elements: { town, legend, title },
};

export const koreaWeatherGrid: SamplePack = {
  id: 'korea-weather-grid',
  title: { ko: '전국 열네 곳 지금 날씨 — 예보 격자 도면', en: 'The weather now in fourteen towns — on the forecast grid' },
  field: { ko: '기상', en: 'Weather' },
  kind: { ko: '격자 도면', en: 'Grid plot' },
  summary: {
    ko: '기상청 초단기실황으로 전국 열네 곳의 지금 기온·습도·풍속과 내리는 것(비·눈)을, 기상청 동네예보 격자 자체 위에 — 5 km마다 찍은 점, 가장자리의 격자 번호, 도시마다 시청이 든 격자점에 점과 지시선으로 이은 카드. 원천은 «몇 시의 자료»로 묻는 API라 요청 경로에 시각 자리(`{{now:yyyyMMdd}}`)를 쓰고, 발표가 정시 40분쯤 뒤이므로 그만큼 앞선 정시를 묻습니다. 원천이 이용자마다 키를 발급해, 설치본에서 만들 때 발급받은 키가 필요합니다.',
    en: 'The temperature, humidity, wind and anything falling in fourteen Korean towns now, from the weather service’s hourly observations — drawn on its forecast grid itself: a point every 5 km, the grid numbers along the edges, and every town a dot at the grid point of its city hall with a card on a leader line. The source is asked for the data of a given hour, so the request path carries time places (`{{now:yyyyMMdd}}`), and since an hour is out about forty minutes after it, it asks for the hour that is. The source issues each user a key, so creating it in an installation needs one.',
  },
  connectors: [KMA_NOW],
  document,
  snapshot,
};
