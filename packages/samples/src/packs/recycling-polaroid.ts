import type { Binding, CanvasView, ElementDefinition, Node, Widget } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { svgDataUrl } from '../frame.js';
import { snapshot } from '../snapshots/recycling-polaroid.js';

// A recycling centre's sorting lines kept as an instant-photo album: every line a photo on the black album page, held by
// paper corners — the photo shows the line's bale bay filled as far as it is, the white edge below carries the material,
// today's tonnage and purity in pen — and the line's state is what has been stuck on the photo as well as the word:
// nothing but a tick when it runs (정상), a strip of yellow tape when other material is getting in (혼입 주의), a red pin
// and a circled word when the bay is full and wants a truck (만재), crossed tape over a faded photo when it has stopped
// (정지). On the right, the day's intake by hour and the trucks out, on paper taped into the album. The centre is made
// up, so the values are example data.

export const CENTRE: ExampleSampleConnector = {
  key: 'centre',
  name: '예시 자원순환센터 선별장 API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 자원순환센터가 아닙니다' },
};

/** The line PLCs report every minute; fifteen minutes without one is a PLC to check before the line is. */
const MAX_AGE_SECONDS = 15 * 60;

const bind = (path: string, valuePath: string): Binding => ({
  adapter: CENTRE.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
});

const WIDTH = 1600;
const HEIGHT = 1000;
const PAGE = '#1c1c1e';
const PENCIL = '#e9e6dc';
const PHOTO_EDGE = '#fbfaf5';
const INK = '#2a2f3a';
const TAPE = 'rgba(244, 206, 82, .88)';
const PIN = '#d23a2f';
const TEXT = '"Pretendard", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
const PEN = '"Nanum Pen Script", "Nanum Brush Script", cursive';

const PHOTO_W = 270;
const PHOTO_H = 330;
const LINES = [
  { id: 'pet', tilt: '-2' },
  { id: 'can', tilt: '1.5' },
  { id: 'glass', tilt: '-1' },
  { id: 'carton', tilt: '2' },
  { id: 'plastic', tilt: '-1.5' },
  { id: 'vinyl', tilt: '1' },
] as const;
const photoAt = (i: number) => ({ x: 60 + (i % 3) * (PHOTO_W + 30), y: 120 + Math.floor(i / 3) * (PHOTO_H + 40) });

// ── The album page ─────────────────────────────────────────────────────────────────────────────────────────────

function drawing(): string {
  // Paper corners at every photo's four corners — from the same positions as the photos.
  const corners = LINES.map((_, i) => {
    const { x, y } = photoAt(i);
    const c = (cx: number, cy: number, sx: number, sy: number) =>
      `<path d="M${cx} ${cy} l${30 * sx} 0 l${-30 * sx} ${30 * sy} z" fill="#0c0c0d" stroke="#3b3b3f" stroke-width="1"/>`;
    return c(x + 2, y + 2, 1, 1) + c(x + PHOTO_W - 2, y + 2, -1, 1) + c(x + 2, y + PHOTO_H - 2, 1, -1) + c(x + PHOTO_W - 2, y + PHOTO_H - 2, -1, -1);
  }).join('');
  // Taped paper cards on the right, slightly askew like anything pasted in by hand.
  const card = (x: number, y: number, w: number, h: number, angle: number, lined: boolean) =>
    `<g transform="rotate(${angle} ${x + w / 2} ${y + h / 2})"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#f6f3ea"/>${
      lined ? Array.from({ length: Math.floor((h - 70) / 34) }, (_, i) => `<line x1="${x + 16}" x2="${x + w - 16}" y1="${y + 78 + i * 34}" y2="${y + 78 + i * 34}" stroke="#c9d6e6" stroke-width="1"/>`).join('') + `<line x1="${x + 64}" x2="${x + 64}" y1="${y}" y2="${y + h}" stroke="#e6a4a0" stroke-width="1"/>` : ''
    }<rect x="${x + w / 2 - 60}" y="${y - 14}" width="120" height="30" fill="${TAPE}" opacity=".8" transform="rotate(-3 ${x + w / 2} ${y})"/></g>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<defs>
<pattern id="grain" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="${PAGE}"/><circle cx="1" cy="2" r=".6" fill="#242427"/><circle cx="4" cy="5" r=".5" fill="#18181a"/></pattern>
</defs>
<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#grain)"/>
${corners}
${card(1030, 52, 520, 456, -0.8, false)}${card(1030, 540, 520, 420, 0.6, true)}
</svg>`;
  return svgDataUrl(svg);
}

// ── Elements ───────────────────────────────────────────────────────────────────────────────────────────────────

/** A sorting line as an instant photo — read from `p`: the picture is the bale bay filled to `--f` %, the edge below
 *  carries material, tonnage and purity in pen; `tilt` is how askew it was pasted in. */
const photo: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['p'], properties: { p: { type: 'object' }, tilt: { type: 'string' } } },
  template: `<figure class="ph {{p.state}}" style="--f: {{p.fill}}; --tint: {{p.tint}}; --tilt: {{tilt}}deg"><div class="pic"><div class="bales"></div><span class="bay">베일장 {{p.fill}}%</span><i class="tape"></i><i class="pin"></i><i class="x"></i></div><figcaption><b>{{p.name}}</b><span>오늘 {{p.today}} · 순도 {{p.purity}}</span><em>{{p.word}}</em><small>{{p.note}}</small></figcaption></figure>`,
  style: `.ph{position:absolute;inset:10px;margin:0;box-sizing:border-box;padding:12px 12px 0;background:${PHOTO_EDGE};transform:rotate(var(--tilt));box-shadow:0 6px 14px rgba(0,0,0,.55);font-family:${TEXT};color:${INK};display:grid;grid-template-rows:160px 1fr;overflow:hidden}
.pic{position:relative;overflow:hidden;background:linear-gradient(#cfd9df, #e8ecef 55%, #b9b4a8 56%, #a29d91)}
.bales{position:absolute;left:10px;right:10px;bottom:0;height:calc(var(--f) * 0.9%);background:repeating-linear-gradient(90deg, transparent 0 40px, rgba(0,0,0,.28) 40px 43px), repeating-linear-gradient(0deg, var(--tint) 0 30px, rgba(0,0,0,.35) 30px 33px);border-top:2px solid rgba(0,0,0,.25)}
.bay{position:absolute;left:8px;top:6px;padding:0 6px;font:22px ${PEN};background:rgba(255,255,255,.75);color:${INK}}
figcaption{display:grid;grid-template-columns:minmax(0,1fr) auto;grid-template-rows:auto auto auto;column-gap:6px;align-content:start;padding:6px 2px 0}
b{font:28px/1.05 ${PEN};grid-column:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
span{font:19px/1.15 ${PEN};grid-column:1 / span 2;margin-top:10px;color:#444b57;white-space:nowrap}
em{grid-column:2;grid-row:1;align-self:center;white-space:nowrap;font:normal 27px/1 ${PEN};color:${INK};padding:0 6px}
small{grid-column:1 / span 2;margin-top:6px;font:17px/1.15 ${PEN};color:#5b6270}
i{position:absolute;display:none}
.ok em::before{content:"✓ ";color:#2d7a4b}
.warn .tape{display:block;top:14px;right:-22px;width:120px;height:26px;background:${TAPE};transform:rotate(32deg)}
.warn .tape::after{content:"!";position:absolute;left:54px;top:-2px;font:800 22px ${TEXT};color:#6b4b00}
.warn em{text-decoration:underline wavy #c48a00;text-underline-offset:4px}
.full .pin{display:block;top:8px;left:80%;width:18px;height:18px;margin-left:-9px;border-radius:50%;background:radial-gradient(circle at 35% 35%, #ff8a80, ${PIN} 60%);box-shadow:0 3px 4px rgba(0,0,0,.45)}
.full em{border:2.5px solid ${PIN};border-radius:50%;color:${PIN};padding:4px 10px}
.stop .pic{filter:grayscale(1) contrast(.85) brightness(1.1)}
.stop .x{display:block;inset:0;background:linear-gradient(35deg, transparent 46%, ${TAPE} 46% 56%, transparent 56%), linear-gradient(-35deg, transparent 46%, ${TAPE} 46% 56%, transparent 56%)}
.stop em{border:2.5px solid ${INK};padding:2px 8px}`,
  size: { width: PHOTO_W, height: PHOTO_H },
};

/** The album's title, written in white pencil. */
const banner: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['n'], properties: { n: { type: 'object' } } },
  template: `<header class="bn"><h1>한빛 자원순환센터 · 선별장 앨범</h1><p>{{n.date}} {{n.time}} — 오늘 반입 {{n.intake}}</p></header>`,
  style: `.bn{height:100%;display:flex;flex-direction:column;justify-content:center;gap:4px;font-family:${PEN};color:${PENCIL}}
h1{margin:0;white-space:nowrap;font:40px/1 ${PEN}}
p{margin:0;white-space:nowrap;font:22px ${PEN};opacity:.8}`,
  size: { width: 900, height: 80 },
};

/** Trucks out today, on lined paper — read from `items`. */
const trucks: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { time: { type: 'string' }, what: { type: 'string' }, to: { type: 'string' }, state: { type: 'string' }, word: { type: 'string' } } } } },
  },
  template: `<section class="tr"><h2>오늘 나가는 트럭</h2><ol>{{#items}}<li class="{{state}}"><time>{{time}}</time><b>{{what}}</b><span>{{to}}</span><em>{{word}}</em></li>{{/items}}</ol></section>`,
  style: `.tr{height:100%;box-sizing:border-box;padding:14px 18px 0 72px;font-family:${PEN};color:${INK}}
h2{margin:0 0 10px;font:36px/1 ${PEN}}
ol{margin:0;padding:0;list-style:none}
li{display:grid;grid-template-columns:52px minmax(0,1fr) 124px 62px;gap:8px;align-items:baseline;height:34px;font:21px/34px ${PEN};white-space:nowrap}
li>*{overflow:hidden;text-overflow:ellipsis}
time{font:14px ${TEXT};font-variant-numeric:tabular-nums;color:#5b6270}
span{color:#5b6270}
em{font-style:normal;text-align:center}
.done{color:#8a8f99}.done em{text-decoration:line-through}
.loading em{border-bottom:2px solid ${INK}}
.waiting em{color:${PIN}}`,
  size: { width: 520, height: 400 },
};

// ── The board ──────────────────────────────────────────────────────────────────────────────────────────────────

const node = (id: string, x: number, y: number, width: number, height: number, widget: Widget): Node => ({ id, x, y, width, height, anchored: false, widget });

const nodes: Node[] = [
  node('banner', 60, 24, 900, 80, { type: 'element:banner', props: { n: {} }, bindings: { n: bind('/centre/now', '/value') } }),
  ...LINES.map(({ id, tilt }, i) => {
    const { x, y } = photoAt(i);
    return node(`line-${id}`, x, y, PHOTO_W, PHOTO_H, { type: 'element:photo', props: { p: {}, tilt }, bindings: { p: bind('/centre/lines', `/value/${id}`) } });
  }),
  node('intake', 1050, 76, 480, 410, {
    type: 'chart.bar',
    props: {
      title: '시간대별 반입량 (t) — 15시는 10분까지',
      data: [],
      mapping: { x: 'hour', y: 'tonnes' },
      options: { series: [{ label: '반입', color: '#4f6d5a' }] },
    },
    bindings: { data: bind('/centre/intake', '/value') },
  }),
  node('trucks', 1030, 548, 520, 400, { type: 'element:trucks', props: { items: [] }, bindings: { items: bind('/centre/trucks', '/value') } }),
];

const document: CanvasView = {
  kind: 'canvas',
  appearance: 'light',
  accent: '#4f6d5a',
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes,
  connectors: [],
  elements: { photo, banner, trucks },
};

export const recyclingPolaroid: SamplePack = {
  id: 'recycling-polaroid',
  title: { ko: '자원순환센터 선별장 — 즉석사진 앨범', en: 'A recycling centre’s sorting lines — an instant-photo album' },
  field: { ko: '자원순환·재활용 선별', en: 'Recycling and sorting' },
  kind: { ko: '선별 라인별 적재·순도', en: 'Bays and purity by sorting line' },
  domain: 'environment',
  styles: ['craft'],
  summary: {
    ko: '자원순환센터의 선별 라인 여섯을 즉석사진 앨범으로 — 라인마다 검은 앨범 종이에 모서리로 붙인 사진 한 장: 사진 속 베일장이 찬 만큼 쌓인 압축 베일, 아래 흰 여백에 펜으로 품목·오늘 처리량·순도, 그리고 상태가 낱말과 사진에 붙인 것으로 — 정상은 체크만, 혼입 주의는 노란 테이프, 만재는 빨간 압정과 동그라미 친 낱말, 정지는 빛바랜 사진에 엇갈린 테이프. 오른쪽에 테이프로 붙인 종이 위 시간대별 반입량과 오늘 나가는 트럭. 센터는 지어낸 것이라 예시 데이터입니다.',
    en: 'A recycling centre’s six sorting lines kept as an instant-photo album — a photo held by paper corners on the black album page for every line: the line’s bale bay stacked as full as it is, the white edge below carrying the material, today’s tonnage and purity in pen, and the state in a word and in what is stuck on the photo — just a tick when it runs, a strip of yellow tape when other material is getting in, a red pin and a circled word when the bay is full and wants a truck, crossed tape over a faded photo when the line has stopped. On the right the day’s intake by hour and the trucks going out, on paper taped into the album. The centre is made up. Example data.',
  },
  connectors: [CENTRE],
  document,
  snapshot,
};
