import type { Binding, CanvasView, Connector, ElementDefinition, Node, Shape } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { escapeXml, svgDataUrl } from '../frame.js';
import { snapshot } from '../snapshots/body-gap.js';

// A car body's gap and flush, measured where its panels meet: each measuring point is a ring on the body's outline,
// led by a line to a card with what was measured there and how much of the tolerance it uses — quiet below 75 %,
// amber up to the tolerance, red past it, as quality boards colour a part's measurements. The latest body measured,
// how many of its points are out, and every point's share of its tolerance beside it. No public source carries a
// line's measurements, so the values are example data written for the board.

const WIDTH = 1280;
const HEIGHT = 800;

export const QMS: ExampleSampleConnector = {
  key: 'qms',
  name: '예시 품질 측정 API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 측정값이 아닙니다' },
};

/** A body is measured every few minutes; half an hour without one is a station that has stopped. */
const MAX_AGE_SECONDS = 30 * 60;

const bindPoint = (id: string, field: string, map?: Binding['map']): Binding => ({
  adapter: QMS.key,
  ref: { path: '/body/latest', item: { list: '/points', where: { id } }, valuePath: `/${field}`, observedAtPath: '/measuredAt', maxAgeSeconds: MAX_AGE_SECONDS },
  ...(map ? { map } : {}),
});

const bindBody = (valuePath: string): Binding => ({
  adapter: QMS.key,
  ref: { path: '/body/latest', valuePath, observedAtPath: '/measuredAt', maxAgeSeconds: MAX_AGE_SECONDS },
});

/** How much of its tolerance a measurement uses: below 75 % fine, up to 100 % one to watch, past it out. */
const USAGE_BAND = { ranges: [{ min: 100, value: 'out' }, { min: 75, value: 'watch' }], otherwise: 'ok' };

const ring: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['band'], properties: { band: { enum: ['ok', 'watch', 'out'] }, name: { type: 'string' } } },
  template: '<span class="ring {{band}}" role="img" aria-label="{{name}}"></span>',
  style: `:host{display:grid;place-items:center}
.ring{box-sizing:border-box;width:18px;height:18px;border-radius:50%;border:4px solid var(--c);background:var(--u-widget-surface);--c:var(--u-widget-text-secondary)}
.watch{--c:var(--u-widget-warning)}
.out{--c:var(--u-widget-negative);width:22px;height:22px;border-width:5px}`,
  size: { width: 24, height: 24 },
};

const card: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['name', 'gap', 'flush', 'usage', 'band'],
    properties: {
      name: { type: 'string' },
      gap: { type: 'number', description: 'Gap, mm.' },
      flush: { type: 'number', description: 'Flush, mm — positive when the second panel stands out.' },
      usage: { type: 'number', description: 'The larger share of its tolerance either uses, %.' },
      band: { enum: ['ok', 'watch', 'out'] },
    },
  },
  template: `<div class="card {{band}}">
  <b>{{name}}</b>
  <dl><dt>간극</dt><dd>{{gap | fixed:2}} mm</dd><dt>단차</dt><dd>{{flush | fixed:2}} mm</dd></dl>
  <span class="usage">공차 {{usage}}%</span>
</div>`,
  style: `.card{box-sizing:border-box;height:100%;display:grid;grid-template-rows:auto 1fr auto;gap:2px;padding:8px 12px;border:1px solid var(--u-widget-border);
border-left:5px solid var(--c);border-radius:6px;background:var(--u-widget-surface);font-family:var(--u-widget-font-family);color:var(--u-widget-text);
--c:var(--u-widget-text-secondary)}
b{font-size:13px;font-weight:600}
dl{margin:0;display:grid;grid-template-columns:auto 1fr;column-gap:8px;font-size:12px;align-content:center}
dt{color:var(--u-widget-text-secondary)}
dd{margin:0;font-variant-numeric:tabular-nums}
.usage{font-size:12px;font-weight:600;color:var(--u-widget-text-secondary)}
.watch{--c:var(--u-widget-warning)}
.out{--c:var(--u-widget-negative)}
.watch .usage,.out .usage{color:var(--c)}`,
  size: { width: 170, height: 92 },
};

interface Point {
  id: string;
  name: string;
  /** Where it is on the body's outline. */
  at: { x: number; y: number };
  /** Where its card stands, off the body. */
  card: { x: number; y: number };
}

const POINTS: Point[] = [
  { id: 'P1', name: '후드 – 펜더', at: { x: 300, y: 418 }, card: { x: 170, y: 130 } },
  { id: 'P3', name: '앞문 – 뒷문', at: { x: 556, y: 452 }, card: { x: 470, y: 130 } },
  { id: 'P5', name: '트렁크 – 쿼터', at: { x: 846, y: 404 }, card: { x: 770, y: 130 } },
  { id: 'P6', name: '범퍼 – 펜더', at: { x: 152, y: 468 }, card: { x: 50, y: 640 } },
  { id: 'P2', name: '앞문 – 펜더', at: { x: 404, y: 462 }, card: { x: 330, y: 640 } },
  { id: 'P4', name: '뒷문 – 쿼터', at: { x: 700, y: 452 }, card: { x: 640, y: 640 } },
];

const pointNodes = ({ id, name, at, card: c }: Point): Node[] => [
  {
    id: `point-${id}`,
    x: at.x - 12,
    y: at.y - 12,
    anchored: true,
    widget: { type: 'element:ring', props: { band: 'ok', name }, bindings: { band: bindPoint(id, 'usagePct', USAGE_BAND) } },
  },
  {
    id: `card-${id}`,
    x: c.x,
    y: c.y,
    anchored: false,
    widget: {
      type: 'element:card',
      props: { name, gap: 0, flush: 0, usage: 0, band: 'ok' },
      bindings: {
        gap: bindPoint(id, 'gapMm'),
        flush: bindPoint(id, 'flushMm'),
        usage: bindPoint(id, 'usagePct'),
        band: bindPoint(id, 'usagePct', USAGE_BAND),
      },
    },
  },
];

const leader = ({ id }: Point): Connector => ({ id: `lead-${id}`, fromNodeId: `point-${id}`, toNodeId: `card-${id}`, style: { stroke: '#55636b', strokeWidth: 1.5 } });

const SIDE_X = 980;
const SIDE: Node[] = [
  {
    id: 'body-no',
    x: SIDE_X,
    y: 100,
    width: 270,
    height: 76,
    anchored: false,
    widget: { type: 'metric', props: { data: { label: '마지막 측정 차체', value: '—' } }, bindings: { 'data.value': bindBody('/bodyNo') } },
  },
  {
    id: 'out-of-tolerance',
    x: SIDE_X,
    y: 190,
    width: 270,
    height: 76,
    anchored: false,
    widget: { type: 'metric', props: { data: { label: '공차를 넘은 측정점', value: 0, unit: '곳' } }, bindings: { 'data.value': bindBody('/pointsOut') } },
  },
  {
    id: 'usage-by-point',
    x: SIDE_X,
    y: 290,
    width: 270,
    height: 300,
    anchored: false,
    widget: {
      type: 'chart.bar',
      props: {
        title: '측정점별 공차 사용률(%)',
        data: [],
        mapping: { x: 'name', y: 'usagePct' },
        options: { horizontal: true, series: [{ label: '공차 사용률' }] },
      },
      bindings: { data: bindBody('/points') },
    },
  },
];

const DECORATIONS: Shape[] = [
  { id: 'title', type: 'text', x: 24, y: 22, text: '차체 간극·단차 품질 맵', fontSize: 24, fill: '#17252b' },
  { id: 'note', type: 'text', x: 24, y: 56, text: '측정점마다 간극과 단차, 공차를 얼마나 쓰는지 · 예시 데이터', fontSize: 13, fill: '#5b6b70' },
  { id: 'side-title', type: 'text', x: SIDE_X, y: 72, text: '이번 차체', fontSize: 15, fill: '#22313b' },
  { id: 'legend', type: 'text', x: SIDE_X, y: 612, text: '공차 사용률: 75 % 미만 회색', fontSize: 12, fill: '#5b6b70' },
  { id: 'legend-2', type: 'text', x: SIDE_X, y: 632, text: '75~100 % 주황 · 100 % 초과 빨강', fontSize: 12, fill: '#5b6b70' },
];

/** A sedan from the side, drawn plainly: its outline, the panel seams the points sit on, the windows and wheels. */
function drawing(): string {
  const outline =
    'M 96 522 L 92 476 Q 96 446 132 438 L 300 412 L 336 404 Q 380 330 432 300 L 640 294 Q 700 300 760 380 L 860 394 Q 900 400 906 430 L 908 500 Q 904 522 880 524 ' +
    'L 806 524 A 58 58 0 0 0 690 524 L 336 524 A 58 58 0 0 0 220 524 Z';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<rect width="${WIDTH}" height="${HEIGHT}" fill="#f4f6f7"/>
<path d="${outline}" fill="#e6ebee" stroke="#7f939e" stroke-width="3" stroke-linejoin="round"/>
<path d="M 360 400 Q 400 336 444 314 L 548 310 L 548 404 Z" fill="#d3dde3" stroke="#9aa9b2" stroke-width="2"/>
<path d="M 562 310 L 632 310 Q 680 318 720 392 L 562 404 Z" fill="#d3dde3" stroke="#9aa9b2" stroke-width="2"/>
<g fill="none" stroke="#9aa9b2" stroke-width="2">
  <path d="M 300 412 L 304 524"/>
  <path d="M 404 404 L 404 524"/>
  <path d="M 556 404 L 556 524"/>
  <path d="M 700 396 L 700 524"/>
  <path d="M 760 380 L 846 404"/>
  <path d="M 152 440 L 152 522"/>
</g>
<circle cx="278" cy="526" r="46" fill="#5f6e76"/><circle cx="278" cy="526" r="20" fill="#c3ced4"/>
<circle cx="748" cy="526" r="46" fill="#5f6e76"/><circle cx="748" cy="526" r="20" fill="#c3ced4"/>
<path d="M 60 576 H 940" stroke="#c3ced4" stroke-width="2"/>
<rect x="${SIDE_X - 16}" y="60" width="${WIDTH - SIDE_X}" height="${HEIGHT - 80}" rx="8" fill="#ffffff" stroke="#d6dedb"/>
<text x="40" y="${HEIGHT - 12}" font-size="11" fill="#5b6b70" font-family="sans-serif">${escapeXml('측면 약도 — 예시 차체, 실제 형상과 다름')}</text>
</svg>`;
  return svgDataUrl(svg);
}

const document: CanvasView = {
  kind: 'canvas',
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes: [...POINTS.flatMap(pointNodes), ...SIDE],
  connectors: POINTS.map(leader),
  decorations: DECORATIONS,
  elements: { ring, card },
};

export const bodyGap: SamplePack = {
  id: 'body-gap',
  title: { ko: '차체 간극·단차 품질 맵', en: 'Car body gap & flush' },
  field: { ko: '제조·품질', en: 'Manufacturing & quality' },
  kind: { ko: '부품 실루엣', en: 'Part silhouette' },
  domain: 'manufacturing',
  styles: ['operations'],
  summary: {
    ko: '차체 측면 실루엣의 측정점마다 공차 사용률 색의 고리와, 지시선으로 이은 간극·단차 카드. 옆에는 마지막 측정 차체, 공차를 넘은 측정점 수, 측정점별 공차 사용률. 예시 데이터입니다.',
    en: 'Each measuring point on a car body’s side outline as a ring in the colour of its tolerance use, led by a line to a card with its gap and flush; the latest body, how many points are out and each point’s tolerance use beside it. Example data.',
  },
  connectors: [QMS],
  document,
  snapshot,
};
