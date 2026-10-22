import type { Binding, CanvasView, ElementDefinition, Node, Widget } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { svgDataUrl } from '../frame.js';
import { snapshot } from '../snapshots/kiln-porcelain.js';

// A pottery studio's kilns drawn as blue-and-white porcelain: every kiln a plate painted in cobalt — a band of waves on
// the rim, the kiln's name and kind, its temperature large in the well — with a ring round the well filled as far as the
// firing has gone and a motif in the centre for its stage: flames heating up, a cloud holding at the top, waves cooling,
// a plain well when it waits. On the right the wood kiln's firing curve, planned against measured, and the glaze batches
// of the day on a strip of hanji. The studio and its kilns are made up, so the values are example data.

export const STUDIO: ExampleSampleConnector = {
  key: 'studio',
  name: '예시 공방 가마 제어 API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 공방·가마가 아닙니다' },
};

/** The kiln controllers report every minute; ten minutes without one is a controller to check before the kiln is. */
const MAX_AGE_SECONDS = 10 * 60;

const bind = (path: string, valuePath: string): Binding => ({
  adapter: STUDIO.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
});

const WIDTH = 1600;
const HEIGHT = 1000;
const WHITE = '#f6f8fb';
const COBALT = '#1f3f8f';
const COBALT_LIGHT = '#6f8ccc';
const WASH = '#dfe7f5';
const CELADON = '#e9efe6';
const TEXT = '"Pretendard", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
const BRUSH = '"Nanum Brush Script", "Nanum Pen Script", "Gungsuh", serif';

const PLATE = 400;
const KILNS = ['gas', 'electric1', 'electric2', 'wood'] as const;
const plateAt = (i: number) => ({ x: 60 + (i % 2) * 460, y: 120 + Math.floor(i / 2) * 440 });

// ── The table ──────────────────────────────────────────────────────────────────────────────────────────────────

function drawing(): string {
  // Plum branches in cobalt wash across the cloth, behind the plates: decoration that says nothing.
  const branch = (x: number, y: number, s: number) =>
    `<g transform="translate(${x} ${y}) scale(${s})" stroke="${COBALT_LIGHT}" fill="none" opacity=".35"><path d="M0 0 C 40 -20, 70 -60, 120 -70 M60 -40 C 80 -70, 90 -90, 110 -120" stroke-width="5" stroke-linecap="round"/>${[
      [118, -72],
      [108, -122],
      [70, -50],
      [40, -18],
    ]
      .map(([cx, cy]) => `<circle cx="${cx}" cy="${cy}" r="9" fill="${WASH}" stroke-width="2"/>`)
      .join('')}</g>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<defs>
<pattern id="cloth" width="40" height="40" patternUnits="userSpaceOnUse"><rect width="40" height="40" fill="${CELADON}"/><path d="M0 20 H40 M20 0 V40" stroke="#dde5d9" stroke-width="1"/></pattern>
</defs>
<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#cloth)"/>
${branch(980, 980, 1.6)}${branch(40, 1000, 1.2)}
<rect x="1010" y="36" width="560" height="928" rx="6" fill="${WHITE}" stroke="${COBALT}" stroke-width="2"/>
<rect x="1022" y="48" width="536" height="904" rx="4" fill="none" stroke="${COBALT}" stroke-width="1"/>
</svg>`;
  return svgDataUrl(svg);
}

// ── Elements ───────────────────────────────────────────────────────────────────────────────────────────────────

/** A kiln as a porcelain plate — read from `k`: a wave band on the rim, name and kind, the temperature large in the well,
 *  a ring filled as far as the firing has gone (`--p`, 0–100), and the stage in a word and a motif. */
const plate: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['k'], properties: { k: { type: 'object' } } },
  template: `<article class="pl {{k.stage}}" style="--p: {{k.progress}}"><div class="rim"></div><div class="ring"></div><div class="well"><p class="kind">{{k.kind}}</p><h2>{{k.name}}</h2><p class="t"><b>{{k.temp}}</b>℃</p><p class="goal">목표 {{k.target}}℃ · {{k.eta}}</p><p class="word"><i></i>{{k.word}}</p></div></article>`,
  style: `.pl{position:relative;height:100%;box-sizing:border-box;border-radius:50%;background:${WHITE};box-shadow:inset 0 0 0 3px ${COBALT},inset 0 0 0 7px ${WHITE},inset 0 0 0 9px ${COBALT};font-family:${TEXT};color:${COBALT}}
.rim{position:absolute;inset:12px;border-radius:50%;background:repeating-conic-gradient(${COBALT} 0 4deg, ${WHITE} 4deg 9deg, ${COBALT_LIGHT} 9deg 12deg, ${WHITE} 12deg 15deg);-webkit-mask:radial-gradient(closest-side, transparent 86%, #000 86.5% 95%, transparent 95.5%);mask:radial-gradient(closest-side, transparent 86%, #000 86.5% 95%, transparent 95.5%)}
.ring{position:absolute;inset:60px;border-radius:50%;background:conic-gradient(${COBALT} calc(var(--p) * 1%), ${WASH} 0);-webkit-mask:radial-gradient(closest-side, transparent 84%, #000 84.5% 99%, transparent 99.5%);mask:radial-gradient(closest-side, transparent 84%, #000 84.5% 99%, transparent 99.5%)}
.well{position:absolute;inset:86px;border-radius:50%;display:grid;align-content:center;justify-items:center;text-align:center;background:radial-gradient(circle, ${WHITE} 60%, ${WASH})}
.kind{margin:0;font-size:13px;letter-spacing:.2em;color:${COBALT_LIGHT}}
h2{margin:2px 0 0;font:700 34px ${BRUSH};color:${COBALT}}
.t{margin:0;font-size:18px}
.t b{font:800 48px ${TEXT};letter-spacing:-1px}
.goal{margin:0;font-size:12px;color:${COBALT_LIGHT}}
.word{margin:8px 0 0;display:flex;align-items:center;gap:6px;padding:2px 12px;border:2px solid ${COBALT};border-radius:999px;font-size:14px;font-weight:800}
i{font-style:normal;font-size:16px}
.heat i::before{content:"火"}.soak i::before{content:"雲"}.cool i::before{content:"水"}.idle i::before{content:"空"}
.heat .word{background:${COBALT};color:${WHITE}}
.soak .word{border-style:double;border-width:4px}
.cool .word{border-style:dashed}
.idle{opacity:.75}.idle .word{border-color:${COBALT_LIGHT};color:${COBALT_LIGHT}}`,
  size: { width: PLATE, height: PLATE },
};

/** The studio's name, brushed in cobalt. */
const banner: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['n'], properties: { n: { type: 'object' } } },
  template: `<header class="bn"><h1>물빛 도예 공방</h1><p>가마 넷 · {{n.date}} {{n.time}}</p></header>`,
  style: `.bn{height:100%;display:flex;align-items:baseline;gap:22px;font-family:${TEXT};color:${COBALT}}
h1{margin:0;font:700 46px ${BRUSH}}
p{margin:0;font-size:16px;letter-spacing:.08em;color:${COBALT_LIGHT}}`,
  size: { width: 900, height: 80 },
};

/** The day's glaze batches, as a strip of hanji — read from `items`. */
const batches: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { kiln: { type: 'string' }, what: { type: 'string' }, glaze: { type: 'string' }, state: { type: 'string' }, word: { type: 'string' } } } } },
  },
  template: `<section class="bt"><h2>오늘 굽는 것</h2><ol>{{#items}}<li class="{{state}}"><b>{{kiln}}</b><span>{{what}}</span><small>{{glaze}}</small><em>{{word}}</em></li>{{/items}}</ol></section>`,
  style: `.bt{height:100%;box-sizing:border-box;padding:14px 20px;background:#fbf7ee;border-top:3px solid ${COBALT};border-bottom:3px solid ${COBALT};font-family:${TEXT};color:${COBALT}}
h2{margin:0 0 8px;font:700 24px ${BRUSH}}
ol{margin:0;padding:0;list-style:none;display:grid;gap:4px}
li{display:grid;grid-template-columns:70px 1fr 110px 74px;gap:8px;align-items:baseline;font-size:13px;line-height:28px;border-bottom:1px dashed ${COBALT_LIGHT}}
small{color:${COBALT_LIGHT}}
em{font-style:normal;font-weight:800;text-align:center;border:1.5px solid currentColor;border-radius:4px;line-height:20px}
.done em{color:${COBALT_LIGHT}}.firing em{background:${COBALT};color:${WHITE};border-color:${COBALT}}.loading em{border-style:dashed}`,
  size: { width: 520, height: 300 },
};

// ── The board ──────────────────────────────────────────────────────────────────────────────────────────────────

const node = (id: string, x: number, y: number, width: number, height: number, widget: Widget): Node => ({ id, x, y, width, height, anchored: false, widget });

const nodes: Node[] = [
  node('banner', 60, 24, 900, 80, { type: 'element:banner', props: { n: {} }, bindings: { n: bind('/studio/now', '/value') } }),
  ...KILNS.map((id, i) => {
    const { x, y } = plateAt(i);
    return node(`kiln-${id}`, x, y, PLATE, PLATE, { type: 'element:plate', props: { k: {} }, bindings: { k: bind('/studio/kilns', `/value/${id}`) } });
  }),
  node('curve', 1040, 64, 500, 520, {
    type: 'chart.line',
    props: {
      title: '장작가마 소성 곡선 (℃)',
      data: [],
      mapping: { x: 'hour', y: ['plan', 'measured'] },
      options: { series: [{ label: '계획', color: COBALT_LIGHT }, { label: '실측', color: COBALT }] },
    },
    bindings: { data: bind('/studio/curve', '/value') },
  }),
  node('batches', 1030, 620, 520, 300, { type: 'element:batches', props: { items: [] }, bindings: { items: bind('/studio/batches', '/value') } }),
];

const document: CanvasView = {
  kind: 'canvas',
  appearance: 'light',
  accent: COBALT,
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes,
  connectors: [],
  elements: { plate, banner, batches },
};

export const kilnPorcelain: SamplePack = {
  id: 'kiln-porcelain',
  title: { ko: '도예 공방 가마 — 청화백자', en: 'A pottery studio’s kilns — blue-and-white porcelain' },
  field: { ko: '공예·도예 공방', en: 'Crafts and pottery' },
  kind: { ko: '가마별 소성 진행', en: 'Firings by kiln' },
  summary: {
    ko: '도예 공방의 가마 넷을 청화백자로 — 가마마다 코발트로 그린 접시 하나: 전에 물결 띠, 가마 이름과 종류, 굽 안에 큰 온도, 굽을 두른 고리가 소성이 나아간 만큼 차고, 가운데 단계가 낱말과 글자 문양으로 — 오르는 중 火(채운 띠), 머무는 중 雲(겹선), 식는 중 水(점선), 쉬는 중 空(흐리게). 오른쪽에 장작가마의 계획 대 실측 소성 곡선, 한지 띠 위에 오늘 굽는 것. 공방과 가마는 지어낸 것이라 예시 데이터입니다.',
    en: 'A pottery studio’s four kilns drawn as blue-and-white porcelain — a plate painted in cobalt for every kiln: a band of waves on the rim, the kiln’s name and kind, its temperature large in the well, a ring round the well filled as far as the firing has gone, and the stage in a word and a character — 火 heating up (a filled band), 雲 holding at the top (a double line), 水 cooling (dashed), 空 waiting (faded). On the right the wood kiln’s firing curve, planned against measured, and the day’s glaze batches on a strip of hanji. The studio and its kilns are made up. Example data.',
  },
  connectors: [STUDIO],
  document,
  snapshot,
};
