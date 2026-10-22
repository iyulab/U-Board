import type { Binding, CanvasView, ComponentDefinition, ElementDefinition, Node, Widget } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { svgDataUrl } from '../frame.js';
import { BAYS, snapshot } from '../snapshots/bus-terminal.js';

// The departure wall over the boarding bays of an intercity bus terminal: one ultrawide strip, wider than four
// screens side by side, lit as an LED dot-matrix sign — amber for times, green for what is boarding, red for what is
// late or sold out, on black with the dots showing. The terminal's clock on the left, then every boarding bay as one
// component — its routes' colour band and the next departures from it with the seats still free — and a running
// line of notices along the bottom. No public source carries a terminal's bays this way, so the values are example
// data written for it.

export const TERMINAL: ExampleSampleConnector = {
  key: 'terminal',
  name: '예시 버스 터미널 발권 API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 터미널·노선이 아닙니다' },
};

/** Seats sell by the minute; five minutes without an answer is a source that has stopped. */
const MAX_AGE_SECONDS = 5 * 60;

const bind = (path: string, valuePath: string): Binding => ({
  adapter: TERMINAL.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
});

/** One field of the bay an instance is given — `{{bay}}` is its number. */
const bindBay = (field: string): Binding => ({
  adapter: TERMINAL.key,
  ref: { path: '/terminal/bays', item: { list: '/value', where: { id: '{{bay}}' } }, valuePath: `/${field}`, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
});

const WIDTH = 3840;
const HEIGHT = 900;
const AMBER = '#ffb000';
const GREEN = '#3dff6a';
const RED = '#ff3b30';
const DIM = '#5a4a1a';
const MONO = 'ui-monospace, "Cascadia Mono", Consolas, monospace';
/** Lit dots: the glow an LED sign has, and the grid of dots behind every panel. */
const GLOW = 'text-shadow:0 0 6px currentColor,0 0 14px color-mix(in srgb,currentColor 45%,transparent)';
const DOTS = 'background:#050505 radial-gradient(circle,#1b1b1b 1.2px,transparent 1.6px) 0 0/6px 6px';

const HEAD = { x: 40, y: 40, width: 560, height: 740 };
const BAY = { x: 640, y: 40, width: 250, height: 740, gap: 13 };
const TICKER = { y: 806, height: 60 };

// ── The drawing ─────────────────────────────────────────────────────────────────────────────────────────────────

function drawing(): string {
  // The wall's housing: a dark frame with the bays' steel dividers between the panels.
  const dividers = BAYS.map((_, i) => {
    const x = BAY.x + i * (BAY.width + BAY.gap) - BAY.gap / 2;
    return `<rect x="${x - 2}" y="20" width="4" height="${TICKER.y - 30}" fill="#2a2a2a"/>`;
  }).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<rect width="${WIDTH}" height="${HEIGHT}" fill="#121212"/>
<rect x="8" y="8" width="${WIDTH - 16}" height="${HEIGHT - 16}" rx="10" fill="none" stroke="#2f2f2f" stroke-width="6"/>
${dividers}
<rect x="20" y="${TICKER.y - 10}" width="${WIDTH - 40}" height="4" fill="#2a2a2a"/>
</svg>`;
  return svgDataUrl(svg);
}

// ── Elements ────────────────────────────────────────────────────────────────────────────────────────────────────

/** The terminal's panel: its name, the clock very large, the day, and the counter for help. */
const head: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['name', 'time'],
    properties: { name: { type: 'string' }, english: { type: 'string' }, time: { type: 'string' }, date: { type: 'string' }, today: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, value: { type: 'string' }, red: { type: 'boolean' } } } } },
  },
  template: `<section class="hd"><h1>{{name}}</h1><p>{{english}}</p><time>{{time}}</time><span>{{date}}</span><dl>{{#today}}<div class="{{#red}}red{{/red}}"><dt>{{label}}</dt><dd>{{value}}</dd></div>{{/today}}</dl></section>`,
  style: `.hd{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto auto 1fr auto auto;padding:28px 30px;${DOTS};font-family:${MONO};color:${AMBER}}
h1{margin:0;font-size:52px;font-weight:800;letter-spacing:.06em;${GLOW}}
p{margin:4px 0 0;font-size:20px;letter-spacing:.3em;color:${DIM}}
time{align-self:center;font-size:150px;font-weight:800;line-height:1;letter-spacing:.04em;${GLOW}}
span{font-size:26px;letter-spacing:.1em;margin-bottom:24px}
dl{margin:0;display:grid;gap:10px;border-top:3px solid #2a2a2a;padding-top:18px}
div{display:flex;justify-content:space-between;font-size:26px}
dt{color:${DIM}}
dd{margin:0;font-weight:800;color:${GREEN};${GLOW}}
.red dd{color:${RED}}`,
  size: { width: HEAD.width, height: HEAD.height },
};

/** A boarding bay: its number and its routes' colour, and the next departures from it — time, where to, the seats
 *  still free, and whether it is boarding, on time, late or full. */
const bay: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['no', 'departures'],
    properties: {
      no: { type: 'string' },
      line: { type: 'string' },
      colour: { type: 'string' },
      departures: {
        type: 'array',
        items: { type: 'object', properties: { time: { type: 'string' }, to: { type: 'string' }, seats: { type: 'string' }, state: { enum: ['boarding', 'ontime', 'late', 'full'] }, note: { type: 'string' } } },
      },
    },
  },
  template: `<section class="by" style="--c: {{colour}}"><header><b>{{no}}</b><span>{{line}}</span></header><ol>{{#departures}}<li class="{{state}}"><time>{{time}}</time><strong>{{to}}</strong><p><em>{{note}}</em><i>{{seats}}</i></p></li>{{/departures}}</ol></section>`,
  style: `.by{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr;${DOTS};font-family:${MONO};color:${AMBER}}
header{display:flex;align-items:baseline;justify-content:space-between;padding:14px 16px 10px;border-bottom:8px solid var(--c)}
b{font-size:44px;font-weight:800;${GLOW}}
header span{font-size:19px;color:var(--c);letter-spacing:.04em}
ol{margin:0;padding:0;list-style:none;display:grid;grid-template-rows:repeat(4,1fr)}
li{display:grid;align-content:center;gap:2px;padding:0 16px;border-bottom:2px solid #1f1f1f}
time{font-size:40px;font-weight:800;line-height:1.05;letter-spacing:.04em;${GLOW}}
strong{font-size:30px;color:#ffd36b;white-space:nowrap;overflow:hidden;text-overflow:clip;${GLOW}}
p{margin:0;display:flex;justify-content:space-between;align-items:baseline;font-size:19px}
em{font-style:normal;color:${DIM}}
i{font-style:normal;font-weight:800}
.boarding em,.boarding time{color:${GREEN}}
.late em{color:${RED};${GLOW}}
.full i{color:${RED};${GLOW}}
.ontime i,.boarding i,.late i{color:${GREEN}}`,
  size: { width: BAY.width, height: BAY.height },
};

/** The line of notices along the bottom of the wall. */
const ticker: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['items'], properties: { items: { type: 'array', items: { type: 'string' } } } },
  template: `<p class="tk">{{#items}}<span>{{.}}</span>{{/items}}</p>`,
  style: `.tk{margin:0;height:100%;box-sizing:border-box;display:flex;align-items:center;gap:80px;padding:0 30px;overflow:hidden;white-space:nowrap;${DOTS};font:700 30px ${MONO};color:${AMBER};letter-spacing:.06em}
span{${GLOW}}
span::before{content:"▶ ";color:${GREEN}}`,
  size: { width: WIDTH - 80, height: TICKER.height },
};

// ── The board ───────────────────────────────────────────────────────────────────────────────────────────────────

const bayComponent: ComponentDefinition = {
  params: { type: 'object', required: ['bay'], properties: { bay: { type: 'string' } } },
  nodes: [
    {
      id: 'board',
      x: 0,
      y: 0,
      width: BAY.width,
      height: BAY.height,
      widget: {
        type: 'element:bay',
        props: { no: '{{bay}}', line: '', colour: AMBER, departures: [] },
        bindings: { line: bindBay('line'), colour: bindBay('colour'), departures: bindBay('departures') },
      },
    },
  ],
};

const node = (id: string, x: number, y: number, width: number, height: number, widget: Widget): Node => ({ id, x, y, width, height, anchored: false, widget });

const nodes: Node[] = [
  node('head', HEAD.x, HEAD.y, HEAD.width, HEAD.height, {
    type: 'element:head',
    props: { name: '', english: '', time: '', date: '', today: [] },
    bindings: { name: bind('/terminal/now', '/name'), english: bind('/terminal/now', '/english'), time: bind('/terminal/now', '/time'), date: bind('/terminal/now', '/date'), today: bind('/terminal/now', '/today') },
  }),
  node('ticker', 40, TICKER.y, WIDTH - 80, TICKER.height, { type: 'element:ticker', props: { items: [] }, bindings: { items: bind('/terminal/notices', '/value') } }),
];

const document: CanvasView = {
  kind: 'canvas',
  appearance: 'dark',
  accent: AMBER,
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes,
  connectors: [],
  elements: { head, bay, ticker },
  components: { bay: bayComponent },
  instances: BAYS.map((id, i) => ({ id: `bay-${id}`, component: 'bay', x: BAY.x + i * (BAY.width + BAY.gap), y: BAY.y, anchored: false, params: { bay: id } })),
};

export const busTerminal: SamplePack = {
  id: 'bus-terminal',
  title: { ko: '고속버스 터미널 출발 안내 벽 — 울트라와이드 LED', en: 'An intercity bus terminal’s departure wall — an ultrawide LED sign' },
  field: { ko: '대중교통', en: 'Public transport' },
  kind: { ko: '울트라와이드 벽면(약 4:1, 컴포넌트 반복)', en: 'An ultrawide wall (about 4:1, one component repeated)' },
  domain: 'transport',
  styles: ['signage'],
  summary: {
    ko: '고속버스 터미널 승차홈 위에 길게 건 출발 안내 벽 — 화면 네 개를 이은 것보다 넓은 띠를 LED 도트 매트릭스처럼: 검은 바탕에 점이 보이고, 시각은 호박색, 탑승 중은 초록, 지연·매진은 빨강. 왼쪽에 터미널 이름과 아주 큰 시계·오늘 운행 현황, 이어서 승차홈 열둘이 같은 컴포넌트 하나(노선 계열 색 띠, 다음 출발 넷의 시각·행선지·남은 좌석·상태), 아래 안내 문구 띠. 예시 데이터입니다.',
    en: 'The departure wall hung along the boarding bays of an intercity bus terminal — a strip wider than four screens side by side, lit like an LED dot-matrix sign: black with the dots showing, times in amber, boarding in green, late and sold out in red. On the left the terminal’s name, a very large clock and the day’s running; then twelve bays as one component (its routes’ colour band, the next four departures with time, destination, seats left and state); and a line of notices along the bottom. Example data.',
  },
  connectors: [TERMINAL],
  document,
  snapshot,
};
