import type { Binding, CanvasView, ElementDefinition, Node, Widget } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { svgDataUrl } from '../frame.js';
import { snapshot } from '../snapshots/museum-najeon.js';

// A craft museum's storage rooms drawn as lacquerware inlaid with mother-of-pearl (najeon): every room a black lacquer
// box framed in pearl — its collection, temperature and relative humidity large, a pearl gauge with the room's allowed
// humidity band and a marker where the air is now — and its state in a character, a word and the frame: 安 steady
// (a solid pearl frame), 注 watch (dashed), 離 out of band (vermilion lacquer, the traditional red), 檢 being checked
// (dotted, dimmed). On the right the painting store's humidity over the last day against its band, and the day's log.
// The museum and its rooms are made up, so the values are example data.

export const MUSEUM: ExampleSampleConnector = {
  key: 'museum',
  name: '예시 박물관 수장고 환경 감시 API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 박물관·수장고가 아닙니다' },
};

/** The room sensors report every five minutes; twenty minutes without one is a sensor to check before the room is. */
const MAX_AGE_SECONDS = 20 * 60;

const bind = (path: string, valuePath: string): Binding => ({
  adapter: MUSEUM.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
});

const WIDTH = 1600;
const HEIGHT = 1000;
const LACQUER = '#120d0b';
const LACQUER_LIGHT = '#1f1714';
const PEARL_TEXT = '#efe7d6';
const PEARL_DIM = '#a99f8c';
const VERMILION = '#b8352a';
/** Mother-of-pearl: the shimmer of the shell, pink through green to blue. */
const PEARL = 'linear-gradient(135deg, #e9d2f4, #bfe8dc 26%, #f4c9da 50%, #c4d8f6 74%, #efe3c4)';
const TEXT = '"Pretendard", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
const SERIF = '"Nanum Myeongjo", "Batang", "AppleMyungjo", serif';

const BOX_W = 280;
const BOX_H = 380;
const ROOMS = ['seohwa', 'jikmul', 'mokchil', 'dojagi', 'geumsok', 'gogo'] as const;
const boxAt = (i: number) => ({ x: 60 + (i % 3) * (BOX_W + 30), y: 120 + Math.floor(i / 3) * (BOX_H + 30) });

// ── The lacquer ────────────────────────────────────────────────────────────────────────────────────────────────

function drawing(): string {
  // Arabesque vines (dangchomun) and chrysanthemums in shell along the edges: decoration that says nothing.
  const vine = (x: number, y: number, flip: boolean) =>
    `<g transform="translate(${x} ${y}) scale(${flip ? -1 : 1} 1)" fill="none" stroke="url(#shell)" stroke-width="3" opacity=".8"><path d="M0 0 C 60 -40, 120 40, 180 0 S 300 -40, 360 0 S 480 40, 540 0"/>${[
      [90, -14],
      [270, -14],
      [450, -14],
    ]
      .map(([cx, cy]) => `<path d="M${cx} ${cy} c 10 -22, 34 -22, 30 -2 c -6 14, -24 12, -30 2" fill="url(#shell)" stroke="none"/>`)
      .join('')}</g>`;
  const flower = (cx: number, cy: number, r: number) =>
    `<g transform="translate(${cx} ${cy})" fill="url(#shell)" opacity=".75">${Array.from({ length: 12 }, (_, i) => `<ellipse rx="${r * 0.22}" ry="${r * 0.5}" cy="${-r * 0.55}" transform="rotate(${i * 30})"/>`).join('')}<circle r="${r * 0.18}" fill="${LACQUER}"/></g>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<defs>
<linearGradient id="shell" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e9d2f4"/><stop offset=".3" stop-color="#bfe8dc"/><stop offset=".55" stop-color="#f4c9da"/><stop offset=".8" stop-color="#c4d8f6"/><stop offset="1" stop-color="#efe3c4"/></linearGradient>
<radialGradient id="sheen" cx=".35" cy=".25" r=".9"><stop offset="0" stop-color="${LACQUER_LIGHT}"/><stop offset="1" stop-color="${LACQUER}"/></radialGradient>
</defs>
<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#sheen)"/>
${vine(40, 985, false)}${vine(1000, 985, true)}
${flower(30, 520, 18)}${flower(985, 945, 14)}
<rect x="1010" y="30" width="560" height="940" rx="4" fill="${LACQUER_LIGHT}" stroke="url(#shell)" stroke-width="3"/>
<rect x="1022" y="42" width="536" height="916" rx="2" fill="none" stroke="url(#shell)" stroke-width="1" opacity=".7"/>
</svg>`;
  return svgDataUrl(svg);
}

// ── Elements ───────────────────────────────────────────────────────────────────────────────────────────────────

/** A storage room as a lacquer box framed in shell — read from `r`: name and collection, temperature and humidity, the
 *  allowed bands, a gauge (20–80 % RH) with the allowed band (`--lo`–`--hi`) and a marker (`--v`), and the state. */
const room: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['r'], properties: { r: { type: 'object' } } },
  template: `<article class="bx {{r.state}}"><header><h2>{{r.name}}</h2><small>{{r.items}}</small></header><div class="vals"><p><b>{{r.temp}}</b><span>℃</span></p><p><b>{{r.rh}}</b><span>%RH</span></p></div><div class="gauge" style="--v: {{r.rh}}; --lo: {{r.lo}}; --hi: {{r.hi}}"><div class="band"></div><div class="mark"></div></div><p class="std">기준 {{r.tband}}℃ · {{r.rhband}}%</p><p class="word"><i></i>{{r.word}}</p><p class="note">{{r.note}}</p></article>`,
  style: `.bx{position:relative;height:100%;box-sizing:border-box;padding:18px 18px 14px;border:6px solid transparent;border-radius:6px;background:linear-gradient(160deg, ${LACQUER_LIGHT}, ${LACQUER}) padding-box, ${PEARL} border-box;font-family:${TEXT};color:${PEARL_TEXT};display:grid;grid-template-rows:auto auto auto auto 1fr auto;gap:8px}
header{border-bottom:1px solid ${PEARL_DIM};padding-bottom:6px}
h2{margin:0;font:700 28px ${SERIF};letter-spacing:.06em}
small{font-size:12px;color:${PEARL_DIM}}
.vals{display:flex;justify-content:space-between;align-items:baseline}
.vals p{margin:0}
.vals b{font:800 50px ${TEXT};letter-spacing:-1px}
.vals span{font-size:13px;color:${PEARL_DIM};margin-left:2px}
.gauge{position:relative;margin-top:6px;height:16px;border-radius:8px;background:#2b211d;box-shadow:inset 0 0 0 1px #3a2e28}
.band{position:absolute;top:0;bottom:0;min-width:10px;left:calc((var(--lo) - 20) * 100% / 60);width:calc((var(--hi) - var(--lo)) * 100% / 60);border-radius:7px;background:${PEARL};opacity:.85}
.mark{position:absolute;top:-5px;width:4px;height:24px;margin-left:-2px;left:calc((var(--v) - 20) * 100% / 60);background:${PEARL_TEXT};box-shadow:0 0 0 2px ${LACQUER}}
.std{margin:0;font-size:12px;color:${PEARL_DIM}}
.word{margin:0;align-self:end;justify-self:start;display:flex;align-items:center;gap:8px;padding:3px 14px;border:2px solid ${PEARL_TEXT};border-radius:3px;font-size:16px;font-weight:800}
i{font:700 20px ${SERIF};font-style:normal}
.note{margin:0;font-size:12px;line-height:1.45;color:${PEARL_DIM}}
.ok i::before{content:"安"}.warn i::before{content:"注"}.alarm i::before{content:"離"}.check i::before{content:"檢"}
.warn .word{border-style:dashed}
.alarm{background:linear-gradient(160deg, ${LACQUER_LIGHT}, ${LACQUER}) padding-box, linear-gradient(135deg, ${VERMILION}, #e0705f 50%, ${VERMILION}) border-box}
.alarm .word{background:${VERMILION};border-color:${VERMILION};color:#fff}
.alarm .mark{background:${VERMILION};box-shadow:0 0 0 2px ${PEARL_TEXT}}
.check .word{border-style:dotted}.check .vals,.check .gauge{opacity:.6}`,
  size: { width: BOX_W, height: BOX_H },
};

/** The museum's name, with the four states as a key. */
const banner: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['n'], properties: { n: { type: 'object' } } },
  template: `<header class="bn"><h1>달빛 공예박물관 수장고</h1><p>보존 환경 · {{n.date}} {{n.time}}</p><ul><li>安 안정</li><li class="w">注 주의</li><li class="a">離 이탈</li><li class="c">檢 점검</li></ul></header>`,
  style: `.bn{height:100%;display:flex;align-items:baseline;gap:20px;font-family:${TEXT};color:${PEARL_TEXT}}
h1{margin:0;white-space:nowrap;font:700 32px ${SERIF};letter-spacing:.04em;background:${PEARL};-webkit-background-clip:text;background-clip:text;color:transparent}
p{margin:0;white-space:nowrap;font-size:14px;color:${PEARL_DIM}}
ul{margin:0 0 0 auto;padding:0;list-style:none;display:flex;gap:8px}
li{white-space:nowrap;font-size:13px;font-weight:700;padding:1px 8px;border:1.5px solid ${PEARL_TEXT};border-radius:3px}
.w{border-style:dashed}.a{background:${VERMILION};border-color:${VERMILION};color:#fff}.c{border-style:dotted;color:${PEARL_DIM}}`,
  size: { width: 900, height: 80 },
};

/** The day's log of movements and checks — read from `items`. */
const log: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { time: { type: 'string' }, room: { type: 'string' }, what: { type: 'string' }, state: { type: 'string' }, word: { type: 'string' } } } } },
  },
  template: `<section class="lg"><h2>오늘의 수장고 일지</h2><ol>{{#items}}<li class="{{state}}"><time>{{time}}</time><b>{{room}}</b><span>{{what}}</span><em>{{word}}</em></li>{{/items}}</ol></section>`,
  style: `.lg{height:100%;box-sizing:border-box;padding:6px 10px;font-family:${TEXT};color:${PEARL_TEXT}}
h2{margin:0 0 12px;font:700 24px ${SERIF};letter-spacing:.06em}
ol{margin:0;padding:0;list-style:none;display:grid;gap:6px}
li{display:grid;grid-template-columns:48px 52px 1fr 70px;gap:8px;align-items:baseline;font-size:13px;line-height:34px;border-bottom:1px solid #3a2e28}
time{color:${PEARL_DIM};font-variant-numeric:tabular-nums}
em{font-style:normal;font-weight:800;text-align:center;border:1.5px solid ${PEARL_TEXT};border-radius:3px;line-height:22px}
li.alarm em{background:${VERMILION};border-color:${VERMILION};color:#fff}
li.doing em{border-style:dashed}
li.done{color:${PEARL_DIM}}li.done em{border-color:${PEARL_DIM}}
li.todo em{border-style:dotted}`,
  size: { width: 520, height: 400 },
};

// ── The board ──────────────────────────────────────────────────────────────────────────────────────────────────

const node = (id: string, x: number, y: number, width: number, height: number, widget: Widget): Node => ({ id, x, y, width, height, anchored: false, widget });

const nodes: Node[] = [
  node('banner', 60, 24, 900, 80, { type: 'element:banner', props: { n: {} }, bindings: { n: bind('/museum/now', '/value') } }),
  ...ROOMS.map((id, i) => {
    const { x, y } = boxAt(i);
    return node(`room-${id}`, x, y, BOX_W, BOX_H, { type: 'element:room', props: { r: {} }, bindings: { r: bind('/museum/rooms', `/value/${id}`) } });
  }),
  node('humidity', 1040, 56, 500, 440, {
    type: 'chart.line',
    props: {
      title: '서화 수장고 상대습도 — 지난 24시간 (%)',
      data: [],
      mapping: { x: 'hour', y: ['rh', 'high', 'low'] },
      options: { series: [{ label: '습도', color: '#e9dfc6' }, { label: '상한', color: VERMILION }, { label: '하한', color: '#7fa59f' }], echarts: { yAxis: { min: 40, max: 65 } } },
    },
    bindings: { data: bind('/museum/humidity', '/value') },
  }),
  node('log', 1030, 540, 520, 400, { type: 'element:log', props: { items: [] }, bindings: { items: bind('/museum/log', '/value') } }),
];

const document: CanvasView = {
  kind: 'canvas',
  appearance: 'dark',
  accent: '#d9c9a3',
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes,
  connectors: [],
  elements: { room, banner, log },
};

export const museumNajeon: SamplePack = {
  id: 'museum-najeon',
  title: { ko: '박물관 수장고 보존 환경 — 나전칠기', en: 'A museum’s storage rooms — lacquer inlaid with mother-of-pearl' },
  field: { ko: '문화재 보존·수장고', en: 'Collections care and storage' },
  kind: { ko: '수장고별 온습도', en: 'Temperature and humidity by room' },
  summary: {
    ko: '공예박물관의 수장고 여섯을 나전칠기로 — 방마다 자개 테를 두른 검은 옻칠 함 하나: 소장품, 큰 온도와 상대습도, 자개 눈금자 위에 그 방이 허용하는 습도 띠와 지금 공기의 자리, 그리고 상태가 글자·낱말·테로 — 安 안정(자개 실선), 注 주의(점선), 離 이탈(주칠 빨강), 檢 점검(점점선·흐리게). 오른쪽에 서화 수장고의 지난 24시간 습도와 기준 띠, 오늘의 수장고 일지. 박물관과 수장고는 지어낸 것이라 예시 데이터입니다.',
    en: 'A craft museum’s six storage rooms drawn as lacquerware inlaid with mother-of-pearl — a black lacquer box framed in shell for every room: its collection, temperature and relative humidity large, a pearl gauge with the humidity band the room allows and a marker where the air is now, and its state in a character, a word and the frame — 安 steady (a solid pearl frame), 注 watch (dashed), 離 out of band (vermilion lacquer), 檢 being checked (dotted, dimmed). On the right the painting store’s humidity over the last day against its band, and the day’s log of movements and checks. The museum and its rooms are made up. Example data.',
  },
  connectors: [MUSEUM],
  document,
  snapshot,
};
