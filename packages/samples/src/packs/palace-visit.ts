import type { Binding, CanvasView, ElementDefinition, Node, Widget } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { svgDataUrl } from '../frame.js';
import { snapshot } from '../snapshots/palace-visit.js';

// The visitor board at a royal palace's ticket gate, drawn on hanji in ink with the five colours of dancheong: the
// palace's plan along its north–south axis — the gates, the throne hall's courtyard, the council and living halls, the
// crown prince's quarters and the rear garden's pond — drawn with a brush, and on each hall a card saying how crowded it
// is (blue calm, yellow busy, red crowded), the next guided tour and what is open only today. On the right the day's
// visitors, the timed tickets left for the rear garden, the tours and the visitors by the hour, sealed in red as an
// old document is. The palace is made up, so the values are example data written for it.

export const PALACE: ExampleSampleConnector = {
  key: 'palace',
  name: '예시 궁궐 관람 API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 궁궐이 아닙니다' },
};

/** Gate counts post every few minutes; a quarter of an hour without an answer is a source that has stopped. */
const MAX_AGE_SECONDS = 15 * 60;

const bind = (path: string, valuePath: string): Binding => ({
  adapter: PALACE.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
});

const WIDTH = 1600;
const HEIGHT = 1000;
const PAPER = '#f2e8d5';
const INK = '#2a2622';
const SOFT = '#6f6559';
/** Dancheong's five colours, as the board uses them: blue calm, yellow busy, red crowded, green for the garden. */
const BLUE = '#1f5f8b';
const YELLOW = '#c99a06';
const RED = '#b5342b';
const GREEN = '#3e7d4f';
const SERIF = '"Nanum Myeongjo", "Noto Serif KR", Batang, "AppleMyungjo", serif';

/** The halls, south to north along the axis and beside it: where each is on the plan and its size. */
const HALLS = [
  { id: 'gate', x: 430, y: 840, w: 160, h: 56 },
  { id: 'throne', x: 400, y: 520, w: 220, h: 110 },
  { id: 'council', x: 420, y: 380, w: 180, h: 70 },
  { id: 'living', x: 420, y: 250, w: 180, h: 70 },
  { id: 'prince', x: 760, y: 420, w: 150, h: 90 },
  { id: 'pavilion', x: 760, y: 130, w: 80, h: 80 },
] as const;

// ── The drawing ─────────────────────────────────────────────────────────────────────────────────────────────────

function drawing(): string {
  // A brush stroke: the same path twice, a wide pale wash under a firmer line, so it reads as ink, not a vector.
  const brush = (d: string, width = 3) => `<path d="${d}" fill="none" stroke="${INK}" stroke-opacity=".18" stroke-width="${width * 3}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${INK}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
  // A hall: its platform, its body and a roof whose eaves lift at the corners.
  const hall = ({ x, y, w, h }: { x: number; y: number; w: number; h: number }) => {
    const eave = Math.min(24, w / 6);
    return `<rect x="${x - 8}" y="${y - 6}" width="${w + 16}" height="${h + 12}" fill="#e6d8bd"/>
${brush(`M ${x - eave} ${y + 6} Q ${x + w / 2} ${y - 14} ${x + w + eave} ${y + 6}`, 3.5)}
${brush(`M ${x} ${y + 10} H ${x + w} V ${y + h} H ${x} Z`, 2)}`;
  };
  const walls = brush('M 260 960 V 90 H 1020 V 960 Z', 4);
  const inner = brush('M 360 960 V 470 H 660 V 960', 2) + brush('M 360 470 V 200 H 660 V 470', 2);
  const pond = `<ellipse cx="800" cy="170" rx="120" ry="80" fill="#cfdccf" opacity=".8"/>${brush('M 680 170 C 680 100 920 100 920 170 C 920 240 680 240 680 170', 2.5)}${brush('M 720 255 L 790 215', 2)}`;
  const axis = `<path d="M 510 960 V 160" stroke="${RED}" stroke-opacity=".35" stroke-width="6" stroke-dasharray="2 14" stroke-linecap="round"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<defs><filter id="paper"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="7"/><feColorMatrix values="0 0 0 0 .55  0 0 0 0 .48  0 0 0 0 .38  0 0 0 .09 0"/></filter></defs>
<rect width="${WIDTH}" height="${HEIGHT}" fill="${PAPER}"/>
<rect width="${WIDTH}" height="${HEIGHT}" filter="url(#paper)"/>
${axis}
${walls}
${inner}
${pond}
${HALLS.filter(h => h.id !== 'pavilion').map(hall).join('\n')}
${brush('M 800 150 L 820 130 L 840 150 L 820 170 Z', 2.5)}
<text x="290" y="940" fill="${SOFT}" font-size="18" font-family='${SERIF}'>남쪽 ↓ 매표소</text>
<text x="700" y="290" fill="${GREEN}" font-size="20" font-family='${SERIF}' font-weight="700">후원 · 시간제 입장</text>
<line x1="1080" y1="60" x2="1080" y2="${HEIGHT - 60}" stroke="${INK}" stroke-opacity=".35" stroke-width="2"/>
</svg>`;
  return svgDataUrl(svg);
}

// ── Elements ────────────────────────────────────────────────────────────────────────────────────────────────────

/** The board's title, set in a brush-like serif with a red seal beside it. */
const title: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['name'], properties: { name: { type: 'string' }, sub: { type: 'string' }, date: { type: 'string' }, time: { type: 'string' } } },
  template: `<header class="tt"><h1>{{name}}</h1><i>觀覽</i><p>{{sub}}<br/>{{date}} <b>{{time}}</b></p></header>`,
  style: `.tt{height:100%;box-sizing:border-box;display:flex;align-items:center;gap:18px;font-family:${SERIF};color:${INK}}
h1{margin:0;font-size:46px;font-weight:800;letter-spacing:.12em}
i{font-style:normal;display:grid;place-items:center;width:58px;height:58px;border:3px solid ${RED};color:${RED};font-size:20px;font-weight:800;line-height:1;writing-mode:vertical-rl;transform:rotate(-4deg)}
p{margin:0;font-size:17px;color:${SOFT};line-height:1.5}
b{color:${INK};font-size:22px}`,
  size: { width: 470, height: 80 },
};

/** A hall's card: its name, how crowded it is in dancheong's colours, the people in it, and what is next there. */
const hallCard: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['name', 'crowd'],
    properties: { name: { type: 'string' }, crowd: { enum: ['calm', 'busy', 'crowded'] }, word: { type: 'string' }, people: { type: 'number' }, next: { type: 'string' }, special: { type: 'string' } },
  },
  template: `<section class="hc {{crowd}}"><header><b>{{name}}</b><span>{{word}}</span></header><p><strong>{{people}}</strong>명 · {{next}}</p>{{#special}}<em>{{special}}</em>{{/special}}</section>`,
  style: `.hc{--c:${BLUE};height:100%;box-sizing:border-box;display:grid;align-content:center;gap:2px;padding:6px 10px;background:rgba(250,245,234,.94);border:2px solid ${INK};box-shadow:inset 0 5px 0 var(--c);font-family:${SERIF};color:${INK}}
.busy{--c:${YELLOW}}.crowded{--c:${RED}}
header{display:flex;justify-content:space-between;align-items:baseline;gap:8px;margin-top:4px}
b{font-size:20px;font-weight:800;letter-spacing:.06em}
span{font-size:14px;font-weight:700;color:var(--c)}
p{margin:0;font-size:14px;color:${SOFT};white-space:nowrap}
strong{font-size:18px;color:${INK}}
em{font-style:normal;font-size:13px;font-weight:700;color:${GREEN};white-space:nowrap}`,
  size: { width: 190, height: 82 },
};

/** The day's figures, each a large number under its name. */
const figures: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, value: { type: 'string' }, note: { type: 'string' }, red: { type: 'boolean' } } } } },
  },
  template: `<dl class="fg">{{#items}}<div class="{{#red}}red{{/red}}"><dt>{{label}}</dt><dd>{{value}}</dd><small>{{note}}</small></div>{{/items}}</dl>`,
  style: `.fg{margin:0;height:100%;box-sizing:border-box;display:grid;grid-template-columns:repeat(3,1fr);border-top:3px double ${INK};border-bottom:3px double ${INK};font-family:${SERIF};color:${INK}}
div{padding:12px 10px;border-right:1px solid rgba(42,38,34,.25)}
div:last-child{border-right:0}
dt{font-size:14px;color:${SOFT}}
dd{margin:4px 0 0;font-size:34px;font-weight:800;font-variant-numeric:tabular-nums}
.red dd{color:${RED}}
small{font-size:12px;color:${SOFT}}`,
  size: { width: 470, height: 120 },
};

/** A timetable under its heading — the guided tours (when, in which language, where they start, places left), or the
 *  day's notices in the same rows. */
const tours: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['heading', 'items'],
    properties: { heading: { type: 'string' }, items: { type: 'array', items: { type: 'object', properties: { time: { type: 'string' }, lang: { type: 'string' }, from: { type: 'string' }, left: { type: 'string' }, full: { type: 'boolean' } } } } },
  },
  template: `<section class="tr"><h3>{{heading}}</h3><ol>{{#items}}<li class="{{#full}}full{{/full}}"><b>{{time}}</b><span>{{lang}} · {{from}}</span><em>{{left}}</em></li>{{/items}}</ol></section>`,
  style: `.tr{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr;gap:6px;font-family:${SERIF};color:${INK}}
h3{margin:0;font-size:20px;font-weight:800;letter-spacing:.1em;border-bottom:2px solid ${INK};padding-bottom:4px}
ol{margin:0;padding:0;list-style:none;display:grid;align-content:start}
li{display:grid;grid-template-columns:64px 1fr auto;gap:10px;align-items:baseline;padding:6px 0;border-bottom:1px dotted rgba(42,38,34,.4);font-size:15px}
b{font-size:18px;font-variant-numeric:tabular-nums}
em{font-style:normal;font-weight:800;color:${BLUE}}
.full em{color:${RED}}`,
  size: { width: 470, height: 230 },
};

/** The legend of the halls' colours. */
const legend: ElementDefinition = {
  render: 'template',
  props: { type: 'object', properties: {} },
  template: `<ul class="lg"><li><i style="background:${BLUE}"></i>여유</li><li><i style="background:${YELLOW}"></i>보통</li><li><i style="background:${RED}"></i>붐빔</li><li><i style="background:${GREEN}"></i>오늘만 개방</li></ul>`,
  style: `.lg{height:100%;box-sizing:border-box;margin:0;padding:0;list-style:none;display:flex;align-items:center;gap:18px;font:600 15px ${SERIF};color:${INK}}
li{display:flex;align-items:center;gap:6px}
i{width:22px;height:8px}`,
  size: { width: 400, height: 30 },
};

// ── The board ───────────────────────────────────────────────────────────────────────────────────────────────────

const node = (id: string, x: number, y: number, width: number, height: number, widget: Widget): Node => ({ id, x, y, width, height, anchored: false, widget });

/** Where each hall's card sits: beside the hall, clear of the axis it stands on. */
const CARD_AT: Record<(typeof HALLS)[number]['id'], [number, number]> = {
  gate: [620, 830],
  throne: [650, 560],
  council: [140, 372],
  living: [140, 242],
  prince: [740, 316],
  pavilion: [880, 70],
};

const nodes: Node[] = [
  node('title', 1110, 24, 470, 80, {
    type: 'element:title',
    props: { name: '', sub: '', date: '', time: '' },
    bindings: { name: bind('/palace/now', '/name'), sub: bind('/palace/now', '/sub'), date: bind('/palace/now', '/date'), time: bind('/palace/now', '/time') },
  }),
  ...HALLS.map(({ id }) =>
    node(`hall-${id}`, CARD_AT[id][0], CARD_AT[id][1], 190, id === 'pavilion' ? 100 : 82, {
      type: 'element:hall',
      props: { name: '', crowd: 'calm', word: '', people: 0, next: '', special: '' },
      bindings: {
        name: bind('/palace/halls', `/${id}/name`),
        crowd: bind('/palace/halls', `/${id}/crowd`),
        word: bind('/palace/halls', `/${id}/word`),
        people: bind('/palace/halls', `/${id}/people`),
        next: bind('/palace/halls', `/${id}/next`),
        // Only a hall with something open today alone says so.
        ...(id === 'pavilion' && { special: bind('/palace/halls', `/${id}/special`) }),
      },
    })
  ),
  node('legend', 270, 965, 520, 30, { type: 'element:legend', props: {} }),
  node('figures', 1110, 124, 470, 120, { type: 'element:figures', props: { items: [] }, bindings: { items: bind('/palace/figures', '/value') } }),
  node('tours', 1110, 268, 470, 210, { type: 'element:tours', props: { heading: '해설 일정', items: [] }, bindings: { items: bind('/palace/tours', '/value') } }),
  node('visitors', 1110, 500, 470, 280, {
    type: 'chart.line',
    props: { title: '시간대별 입장(명)', data: [], mapping: { x: 'hour', y: ['today', 'usual'] }, options: { series: [{ label: '오늘', color: RED }, { label: '평소 수요일', color: SOFT, lineStyle: 'dashed', symbol: 'none' }] } },
    bindings: { data: bind('/palace/visitors', '/value') },
  }),
  node('notice', 1110, 800, 470, 160, { type: 'element:tours', props: { heading: '오늘의 안내', items: [] }, bindings: { items: bind('/palace/notices', '/value') } }),
];

const document: CanvasView = {
  kind: 'canvas',
  appearance: 'light',
  accent: RED,
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes,
  connectors: [],
  elements: { title, hall: hallCard, figures, tours, legend },
};

export const palaceVisit: SamplePack = {
  id: 'palace-visit',
  title: { ko: '궁궐 관람 현황 — 한지와 단청', en: 'A royal palace’s visitors — on hanji, in dancheong colours' },
  field: { ko: '문화유산·관광', en: 'Cultural heritage & tourism' },
  kind: { ko: '붓으로 그린 궁궐 배치도', en: 'A palace plan drawn with a brush' },
  domain: 'leisure',
  styles: ['korean'],
  summary: {
    ko: '궁궐 매표소 앞 관람 안내판을 한지에 먹과 단청 오방색으로 — 남북 축을 따라 붓으로 그린 배치도(정문·정전 마당·편전·침전·동궁·후원 연못과 정자) 위에 전각마다 카드: 혼잡도(청 여유·황 보통·적 붐빔), 지금 관람객, 다음 해설, 오늘만 개방. 오른쪽에 붉은 낙관을 찍은 제목, 오늘 관람객·후원 시간제 입장 잔여·한복 관람객, 해설 일정(언어·남은 자리), 시간대별 입장(평소 수요일과 비교), 안내 사항. 궁궐은 지어낸 것이라 예시 데이터입니다.',
    en: 'The visitor board at a royal palace’s ticket gate, on hanji in ink with dancheong’s five colours — the palace’s plan drawn with a brush along its north–south axis (the gate, the throne hall’s courtyard, the council and living halls, the crown prince’s quarters, the rear garden’s pond and pavilion), with a card on each hall: how crowded it is (blue calm, yellow busy, red crowded), visitors there now, the next guided tour and what is open only today. On the right a title sealed in red, the day’s visitors, timed tickets left for the rear garden and visitors in hanbok, the tours with their languages and places left, entries by the hour against a usual Wednesday, and notices. The palace is made up. Example data.',
  },
  connectors: [PALACE],
  document,
  snapshot,
};
