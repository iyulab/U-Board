import type { Binding, CanvasView, ElementDefinition, Node, Widget } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { svgDataUrl } from '../frame.js';
import { snapshot } from '../snapshots/site-noise-score.js';

// A building site's noise readings written as a score: each measuring point a staff, every ten-minute reading a note
// set as high as it is loud — the daytime limit (65 dB) a red line across the staff — so an afternoon reads as a tune
// that rises and falls, and a note over the line is red and marked with an accent. Beside each staff the point's level
// now and what it means; on the right the score's title page, the loudest reading, and the readings over the limit by
// point. The site and its readings are made up, so the values are example data.

export const SITE: ExampleSampleConnector = {
  key: 'site',
  name: '예시 공사장 소음 측정 API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 공사 현장·측정값이 아닙니다' },
};

/** A reading comes every ten minutes; twenty-five without one is a meter that has stopped sending. */
const MAX_AGE_SECONDS = 25 * 60;

const bind = (path: string, valuePath: string): Binding => ({
  adapter: SITE.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
});

const WIDTH = 1600;
const HEIGHT = 1000;
const PAPER = '#f7f2e6';
const INK = '#1f1d1a';
const RED = '#c4302b';
const AMBER = '#b9770e';
const FAINT = '#8a8273';
const SERIF = '"Noto Serif KR", "Nanum Myeongjo", "Batang", Georgia, serif';
const TEXT = '"Pretendard", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';

const STAFF = { width: 1180, height: 128 };
const POINTS = ['a', 'b', 'c', 'd', 'e', 'f'] as const;
const staffAt = (i: number) => ({ x: 40, y: 150 + i * 138 });

// ── The page ───────────────────────────────────────────────────────────────────────────────────────────────────

function drawing(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<rect width="${WIDTH}" height="${HEIGHT}" fill="#d9d2c2"/>
<rect x="20" y="16" width="1220" height="${HEIGHT - 32}" fill="${PAPER}"/>
<rect x="1260" y="16" width="320" height="${HEIGHT - 32}" fill="${PAPER}"/>
<path d="M1240 16 V ${HEIGHT - 16}" stroke="#bfb6a3" stroke-width="2"/>
<text x="630" y="70" font-family="Noto Serif KR, Nanum Myeongjo, Batang, serif" font-size="34" font-weight="700" fill="${INK}" text-anchor="middle">오후의 소음 — 여섯 성부</text>
<text x="630" y="102" font-family="Noto Serif KR, Nanum Myeongjo, Batang, serif" font-size="16" font-style="italic" fill="${FAINT}" text-anchor="middle">푸른마을 3단지 신축 현장 · 경계 측정점 다섯과 참고 하나 · 10분마다 1분 등가소음도(Leq)</text>
<text x="1220" y="134" font-family="Noto Serif KR, Batang, serif" font-size="13" fill="${FAINT}" text-anchor="end">한 칸 = 10분 · 위로 갈수록 시끄러움(40–90 dB) · 붉은 선 = 주간 기준 65 dB</text>
</svg>`;
  return svgDataUrl(svg);
}

// ── Elements ───────────────────────────────────────────────────────────────────────────────────────────────────

/** A measuring point as a staff — read from `s`: its name and level now on the left, then a note for every reading,
 *  set by its level (40 dB at the bottom line, 90 at the top), the limit a red line. A note over it is red with an
 *  accent (`>`), one near it amber — a mark as well as a colour. */
const staff: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['s'], properties: { s: { type: 'object' } } },
  template: `<section class="sf {{s.state}}"><header><b>{{s.name}}</b><span>{{s.where}}</span><strong>{{s.now | fixed:1}}<small> dB</small></strong><em>{{s.word}}</em></header><div class="staff"><i class="limit"></i><ol>{{#s.notes}}<li class="{{state}}" style="--v: {{db}}"><b></b><time>{{t}}</time></li>{{/s.notes}}</ol></div></section>`,
  style: `.sf{height:100%;box-sizing:border-box;display:grid;grid-template-columns:190px 1fr;gap:18px;align-items:stretch;font-family:${TEXT};color:${INK}}
header{display:grid;align-content:center;gap:2px;padding-right:14px;border-right:3px double ${INK};text-align:right}
header b{font:700 17px ${SERIF}}
header span{font-size:12px;color:${FAINT}}
strong{font:700 30px ${SERIF};letter-spacing:-.5px}
strong small{font-size:13px;font-weight:400}
em{font-style:normal;font-size:12px;font-weight:700}
.sf.over em{color:${RED}}.sf.near em{color:${AMBER}}.sf.ok em{color:${FAINT}}
.staff{position:relative;margin:14px 0 22px;background:repeating-linear-gradient(to bottom, ${INK} 0 1px, transparent 1px 22.5px);background-size:100% 91px;background-repeat:no-repeat;height:91px}
.limit{position:absolute;left:0;right:0;bottom:calc((65 - 40) * 2%);height:0;border-top:2px solid ${RED};opacity:.85}
ol{position:absolute;inset:0;margin:0;padding:0 8px;list-style:none;display:grid;grid-template-columns:repeat(12,1fr)}
li{position:relative}
li b{position:absolute;left:50%;bottom:calc((var(--v) - 40) * 2%);width:16px;height:11px;margin:0 0 -5px -8px;border-radius:50%;background:${INK};transform:rotate(-20deg)}
li b::after{content:"";position:absolute;right:0;bottom:6px;width:1.6px;height:34px;background:inherit;transform:rotate(20deg);transform-origin:bottom}
li.over b{background:${RED}}
li.over b::before{content:">";position:absolute;left:-2px;top:-30px;transform:rotate(20deg);font:900 15px ${TEXT};color:${RED}}
li.near b{background:${AMBER}}
time{position:absolute;left:0;right:0;bottom:-20px;text-align:center;font-size:10px;color:${FAINT}}`,
  size: STAFF,
};

/** The score's title page: the day, the limit, the loudest reading — read from `m`. */
const title: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['m'], properties: { m: { type: 'object' } } },
  template: `<section class="tp"><p class="op">Op. 1022 · 현장 소음 기록</p><h1>{{m.date}}</h1><p class="at">{{m.time}} 까지</p><dl><div><dt>주간 기준</dt><dd>{{m.limit}}</dd></div><div><dt>가장 큰 소리</dt><dd>{{m.max}}</dd></div><div><dt>그때·그곳</dt><dd>{{m.maxAt}}</dd></div><div><dt>경계에서 넘은 횟수</dt><dd>{{m.overCount}}</dd></div></dl><p class="nt">{{m.note}}</p></section>`,
  style: `.tp{height:100%;box-sizing:border-box;padding:20px 22px;font-family:${SERIF};color:${INK};border:1.5px solid ${INK};outline:4px double ${INK};outline-offset:-10px}
.op{margin:0;font-size:13px;font-style:italic;color:${FAINT}}
h1{margin:6px 0 0;font-size:26px}
.at{margin:0 0 12px;font-size:15px}
dl{margin:0;display:grid;gap:6px}
dl div{display:flex;justify-content:space-between;align-items:baseline;border-bottom:1px dotted ${FAINT};padding-bottom:3px}
dt{font:13px ${TEXT};color:${FAINT}}
dd{margin:0;font-size:19px;font-weight:700}
.nt{margin:12px 0 0;font:12px ${TEXT};color:${FAINT};line-height:1.5}`,
  size: { width: 280, height: 380 },
};

/** How to read a note. */
const key: ElementDefinition = {
  render: 'template',
  props: { type: 'object', properties: {} },
  template: `<ul class="ky"><li><b class="ok"></b>기준 안</li><li><b class="near"></b>기준 가까움(62 dB부터) — 황색</li><li><b class="over"></b>기준 넘음 — 붉은 음표와 악센트 ></li><li><i></i>주간 기준 65 dB</li></ul>`,
  style: `.ky{height:100%;box-sizing:border-box;margin:0;padding:12px 16px;list-style:none;display:grid;gap:8px;align-content:center;font:13px ${TEXT};color:${INK};border-top:3px double ${INK}}
li{display:flex;align-items:center;gap:12px}
b{display:inline-block;width:16px;height:11px;border-radius:50%;background:${INK};transform:rotate(-20deg)}
.near{background:${AMBER}}.over{background:${RED}}
i{display:inline-block;width:22px;border-top:2px solid ${RED}}`,
  size: { width: 280, height: 150 },
};

// ── The board ──────────────────────────────────────────────────────────────────────────────────────────────────

const node = (id: string, x: number, y: number, width: number, height: number, widget: Widget): Node => ({ id, x, y, width, height, anchored: false, widget });

const nodes: Node[] = [
  ...POINTS.map((id, i) => {
    const { x, y } = staffAt(i);
    return node(`point-${id}`, x, y, STAFF.width, STAFF.height, { type: 'element:staff', props: { s: {} }, bindings: { s: bind('/site/staves', `/value/${id}`) } });
  }),
  node('title', 1280, 40, 280, 380, { type: 'element:title', props: { m: {} }, bindings: { m: bind('/site/summary', '/value') } }),
  node('over', 1280, 440, 280, 330, {
    type: 'chart.bar',
    props: { title: '기준 넘은 측정 — 측정점별', data: [], mapping: { x: 'point', y: 'over' }, options: { series: [{ label: '넘음(회)', color: RED }] } },
    bindings: { data: bind('/site/over', '/value') },
  }),
  node('key', 1280, 800, 280, 150, { type: 'element:key', props: {} }),
];

const document: CanvasView = {
  kind: 'canvas',
  appearance: 'light',
  accent: RED,
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes,
  connectors: [],
  elements: { staff, title, key },
};

export const siteNoiseScore: SamplePack = {
  id: 'site-noise-score',
  title: { ko: '공사장 소음 — 악보로 쓴 오후', en: 'A building site’s noise — an afternoon as a score' },
  field: { ko: '건설·소음 관리', en: 'Construction noise' },
  kind: { ko: '측정점별 시간 흐름', en: 'Readings over time by point' },
  domain: 'construction',
  styles: ['print'],
  summary: {
    ko: '공사 현장의 소음 측정을 악보로 — 측정점마다 오선 하나, 10분마다 잰 소리가 그 크기만큼 높이 놓인 음표(아래 줄 40 dB, 위 줄 90 dB), 주간 기준 65 dB는 오선을 가로지르는 붉은 선. 오후가 오르내리는 선율로 읽히고, 기준을 넘은 음표는 붉고 악센트(>)가, 가까운 음표는 황색 — 표시와 색 둘. 오선 왼쪽에 측정점의 지금 크기와 뜻, 오른쪽에 악보의 속표지(기준·가장 큰 소리·넘은 횟수)와 측정점별 넘은 횟수, 읽는 법. 현장과 측정값은 지어낸 것이라 예시 데이터입니다.',
    en: 'A building site’s noise readings written as a score — a staff for every measuring point, every ten-minute reading a note set as high as it is loud (40 dB on the bottom line, 90 on the top), the daytime limit of 65 dB a red line across the staff. The afternoon reads as a tune that rises and falls; a note over the limit is red with an accent (>), one near it amber — a mark as well as a colour. Left of each staff the point’s level now and what it means; on the right the score’s title page (the limit, the loudest reading, the readings over it), the readings over the limit by point, and how to read a note. The site and its readings are made up. Example data.',
  },
  connectors: [SITE],
  document,
  snapshot,
};
