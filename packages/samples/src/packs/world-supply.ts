import type { Binding, CanvasView, Connector, ConnectorArrow, ElementDefinition, Node, Widget } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { project, referencePoints, svgDataUrl } from '../frame.js';
import { landDots, worldFrame } from '../world.js';
import { snapshot } from '../snapshots/world-supply.js';

// An electronics maker's supply chain on one page, drawn the way a newspaper's data desk draws a story: a headline that
// says what changed this week, a world of grey dots, and the lanes as arcs — each from where its parts are made to the
// assembly plant, or from the plant to where the products are sold — its width the containers on it each week, its
// colour whether it is on time, slow or late. Beside the map the week's figures and the suppliers at risk; under it a
// note on what happened, the lead times of three lanes over twelve weeks, and the shipments at sea. Editorial: paper,
// a serif headline, thin rules, one colour that means late. No public source carries a company's lanes, so the values are
// example data written for the board.

export const SUPPLY: ExampleSampleConnector = {
  key: 'supply',
  name: '예시 공급망 API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 기업이 아닙니다' },
};

/** The lanes are recomputed from the carriers' updates every few hours; a day without one is a source that has stopped. */
const MAX_AGE_SECONDS = 24 * 60 * 60;

const bind = (path: string, valuePath: string): Binding => ({
  adapter: SUPPLY.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
});

const bindLane = (id: string, field: string, map?: Binding['map']): Binding => ({
  adapter: SUPPLY.key,
  ref: { path: '/supply/lanes', item: { list: '/value', where: { id } }, valuePath: `/${field}`, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
  ...(map ? { map } : {}),
});

const WIDTH = 1600;
const HEIGHT = 900;
const PAPER = '#f6f3ec';
const INK = '#1d1d1b';
const GREY = '#6b665e';
const RULE = '#cfc8b8';
const DOT = '#d6cfbf';
const ON_TIME = '#1f6f8b';
const SLOW = '#c98a0b';
const LATE = '#b42318';
const SERIF = 'Georgia, "Noto Serif KR", "Nanum Myeongjo", serif';
const FONT = 'var(--u-widget-font-family)';

/** A lane's colour by how it runs against its usual lead time, and its width by the containers on it each week. */
const STATUS_COLOR = { values: { ok: ON_TIME, slow: SLOW, late: LATE }, otherwise: GREY };
const TEU_WIDTH = { ranges: [{ min: 25, value: 7 }, { min: 15, value: 5 }, { min: 8, value: 3.5 }], otherwise: 2 };

// ── The map ─────────────────────────────────────────────────────────────────────────────────────────────────────────

/** The map's box — the world split in the Atlantic, 10 units to a 3° cell (`world.ts`). */
const MAP = worldFrame(40, 150, 10);

function drawing(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<rect width="${WIDTH}" height="${HEIGHT}" fill="${PAPER}"/>
<path d="M 40 138 L 1560 138" stroke="${INK}" stroke-width="2"/>
<path d="M 1250 150 L 1250 600 M 40 616 L 1560 616" stroke="${RULE}" stroke-width="1"/>
${landDots(MAP, DOT, 3.3)}
</svg>`;
  return svgDataUrl(svg);
}

// ── Elements ────────────────────────────────────────────────────────────────────────────────────────────────────

/** The page's head: a kicker, the week's headline and the line under it. */
const headline: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['title'],
    properties: { kicker: { type: 'string' }, title: { type: 'string' }, dek: { type: 'string' }, date: { type: 'string' } },
  },
  template: `<header class="hl"><p class="k">{{kicker}}<span>{{date}}</span></p><h1>{{title}}</h1><p class="d">{{dek}}</p></header>`,
  style: `.hl{height:100%;box-sizing:border-box;display:grid;align-content:end;gap:6px;color:${INK}}
p{margin:0}
.k{display:flex;gap:16px;font:700 14px ${FONT};letter-spacing:.12em;color:${LATE}}
.k span{margin-left:auto;font-weight:400;letter-spacing:.02em;color:${GREY}}
h1{margin:0;font:700 38px/1.15 ${SERIF};letter-spacing:-.01em;word-break:keep-all}
.d{font:17px/1.45 ${FONT};color:${GREY};word-break:keep-all}`,
  size: { width: 1520, height: 112 },
};

/** A place on the map: the plant a ring, a supplier or a sales centre a dot, coloured by its lane. */
const site: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['role'], properties: { role: { enum: ['plant', 'supplier', 'market'] }, status: { enum: ['ok', 'slow', 'late'] }, name: { type: 'string' } } },
  template: '<span class="s {{role}} {{status}}" role="img" aria-label="{{name}}"></span>',
  style: `:host{display:grid;place-items:center}
.s{box-sizing:border-box;width:10px;height:10px;border-radius:50%;background:${ON_TIME};border:2px solid ${PAPER}}
.slow{background:${SLOW}}
.late{background:${LATE};box-shadow:0 0 0 4px rgba(180,35,24,.18)}
.market{background:${INK}}
.plant{width:16px;height:16px;background:${PAPER};border:4px solid ${INK}}`,
  size: { width: 18, height: 18 },
};

/** A place's name and what it sends, set beside its mark. */
const tag: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['name'],
    properties: { name: { type: 'string' }, part: { type: 'string' }, days: { type: 'number' }, status: { enum: ['ok', 'slow', 'late'] }, align: { enum: ['left', 'right'] } },
  },
  template: `<p class="t {{align}} {{status}}"><b>{{name}}</b><span>{{part}} · {{days}}일</span></p>`,
  style: `.t{margin:0;height:100%;box-sizing:border-box;display:grid;align-content:center;font-family:${FONT};color:${INK};line-height:1.2;white-space:nowrap}
.right{text-align:right}
b{font-size:14px}
span{font-size:12px;color:${GREY}}
.slow span{color:${SLOW};font-weight:700}
.late span{color:${LATE};font-weight:700}`,
  size: { width: 120, height: 34 },
};

/** The week's figures, one to a row, the number large. */
const figures: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: {
      items: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, value: { type: 'string' }, note: { type: 'string' }, tone: { enum: ['plain', 'late'] } } } },
    },
  },
  template: `<dl class="f">{{#items}}<div class="{{tone}}"><dt>{{label}}</dt><dd><b>{{value}}</b><span>{{note}}</span></dd></div>{{/items}}</dl>`,
  style: `.f{height:100%;box-sizing:border-box;margin:0;display:grid;align-content:space-between;font-family:${FONT};color:${INK}}
.f div{border-top:1px solid ${RULE};padding-top:8px}
dt{font-size:13px;color:${GREY}}
dd{margin:2px 0 0;display:flex;align-items:baseline;gap:10px}
dd b{font:700 30px/1.1 ${SERIF};font-variant-numeric:tabular-nums}
dd span{font-size:13px;color:${GREY}}
.late b{color:${LATE}}`,
  size: { width: 290, height: 262 },
};

/** The suppliers at risk, each a name and one sentence. */
const risks: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, text: { type: 'string' }, tone: { enum: ['slow', 'late'] } } } } },
  },
  template: `<section class="r"><h2>위험 공급사</h2><ol>{{#items}}<li class="{{tone}}"><b>{{name}}</b>{{text}}</li>{{/items}}</ol></section>`,
  style: `.r{height:100%;box-sizing:border-box;font-family:${FONT};color:${INK};border-top:2px solid ${INK};padding-top:8px}
h2{margin:0 0 8px;font:700 15px ${FONT}}
ol{margin:0;padding:0 0 0 18px;display:grid;gap:6px;font-size:13px;line-height:1.4;word-break:keep-all}
b{display:block;font-size:14px}
.slow b{color:${SLOW}}
.late b{color:${LATE}}`,
  size: { width: 290, height: 172 },
};

/** The desk's note on what happened, numbered as a figure's note is. */
const note: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['text'], properties: { title: { type: 'string' }, text: { type: 'string' } } },
  template: `<aside class="n"><h2>{{title}}</h2><p>{{text}}</p></aside>`,
  style: `.n{height:100%;box-sizing:border-box;font-family:${FONT};color:${INK}}
h2{margin:0 0 8px;font:700 22px/1.25 ${SERIF};word-break:keep-all}
p{margin:0;font-size:15px;line-height:1.6;color:#3b3934;word-break:keep-all}`,
  size: { width: 360, height: 250 },
};

/** The containers at sea: where each is bound, its ship and when it arrives. */
const shipments: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: {
      items: {
        type: 'array',
        items: { type: 'object', properties: { lane: { type: 'string' }, vessel: { type: 'string' }, eta: { type: 'string' }, delay: { type: 'string' }, tone: { enum: ['ok', 'slow', 'late'] } } },
      },
    },
  },
  template: `<section class="sh"><h2>운송 중</h2><table><thead><tr><th>구간</th><th>선박</th><th>도착</th><th></th></tr></thead><tbody>{{#items}}<tr class="{{tone}}"><td>{{lane}}</td><td>{{vessel}}</td><td>{{eta}}</td><td>{{delay}}</td></tr>{{/items}}</tbody></table></section>`,
  style: `.sh{height:100%;box-sizing:border-box;font-family:${FONT};color:${INK}}
h2{margin:0 0 6px;font:700 15px ${FONT}}
table{width:100%;border-collapse:collapse;font-size:13px}
th{text-align:left;font-weight:400;color:${GREY};border-bottom:1px solid ${INK};padding:4px 4px}
td{padding:5px 4px;border-bottom:1px solid ${RULE};white-space:nowrap}
td:last-child{text-align:right;font-weight:700}
.slow td:last-child{color:${SLOW}}
.late td:last-child{color:${LATE}}`,
  size: { width: 380, height: 250 },
};

/** What the arcs say. */
const legend: ElementDefinition = {
  render: 'template',
  props: { type: 'object', properties: {} },
  template: `<dl class="lg"><div><dt><i class="ok"></i></dt><dd>평소 리드타임</dd></div><div><dt><i class="slow"></i></dt><dd>평소보다 2일 이상 늦음</dd></div><div><dt><i class="late"></i></dt><dd>평소보다 4일 이상 늦음</dd></div><div><dt><i class="w"></i></dt><dd>굵기 = 주간 컨테이너(TEU)</dd></div><div><dt><i class="p"></i></dt><dd>조립공장 · <i class="m"></i> 판매 물류센터</dd></div></dl>`,
  style: `.lg{height:100%;box-sizing:border-box;margin:0;display:grid;align-content:start;gap:8px;font-family:${FONT};font-size:13px;color:${GREY}}
.lg div{display:flex;align-items:center;gap:10px}
dt{width:34px;display:flex;align-items:center}
dd{margin:0}
i{display:inline-block;width:34px;height:3px;border-radius:2px}
.ok{background:${ON_TIME}}
.slow{background:${SLOW}}
.late{background:${LATE}}
.w{height:7px;background:${GREY}}
.p{width:12px;height:12px;border-radius:50%;border:3px solid ${INK};box-sizing:border-box}
.m{width:9px;height:9px;border-radius:50%;background:${INK};vertical-align:-1px}`,
  size: { width: 290, height: 160 },
};

// ── The board ───────────────────────────────────────────────────────────────────────────────────────────────────

const node = (id: string, x: number, y: number, width: number, height: number, widget: Widget): Node => ({ id, x, y, width, height, anchored: false, widget });

interface Place {
  id: string;
  name: string;
  role: 'plant' | 'supplier' | 'market';
  lat: number;
  /** East of Greenwich, continuing past 180 for the Americas (the map runs from 25°W eastward round to 25°W). */
  lng: number;
  /** Where its tag sits from its mark's centre, and which side the tag's text lines up on. */
  tag?: { dx: number; dy: number; align: 'left' | 'right' };
}

const PLACES: Place[] = [
  { id: 'pyeongtaek', name: '평택 조립공장', role: 'plant', lat: 37.0, lng: 127.1 },
  { id: 'hsinchu', name: '신주', role: 'supplier', lat: 24.8, lng: 121.0, tag: { dx: 12, dy: -2, align: 'left' } },
  { id: 'osaka', name: '오사카', role: 'supplier', lat: 34.7, lng: 135.5, tag: { dx: 12, dy: -4, align: 'left' } },
  { id: 'shenzhen', name: '선전', role: 'supplier', lat: 22.5, lng: 114.1, tag: { dx: -132, dy: -6, align: 'right' } },
  { id: 'penang', name: '페낭', role: 'supplier', lat: 5.4, lng: 100.3, tag: { dx: -132, dy: -22, align: 'right' } },
  { id: 'munich', name: '뮌헨', role: 'supplier', lat: 48.1, lng: 11.6, tag: { dx: 10, dy: 8, align: 'left' } },
  { id: 'austin', name: '오스틴', role: 'supplier', lat: 30.3, lng: 262.3, tag: { dx: 12, dy: -6, align: 'left' } },
  { id: 'rotterdam', name: '로테르담', role: 'market', lat: 51.9, lng: 4.5, tag: { dx: -24, dy: -44, align: 'left' } },
  { id: 'longbeach', name: '롱비치', role: 'market', lat: 33.8, lng: 241.8, tag: { dx: -132, dy: 6, align: 'right' } },
  { id: 'singapore', name: '싱가포르', role: 'market', lat: 1.3, lng: 103.8, tag: { dx: 12, dy: 0, align: 'left' } },
];

const placeAt = (place: Place) => project(MAP, place.lat, place.lng);

const siteNode = (place: Place): Node => {
  const { x, y } = placeAt(place);
  const lane = place.role === 'plant' ? undefined : place.id;
  return {
    id: `site-${place.id}`,
    x: x - 9,
    y: y - 9,
    anchored: true,
    widget: { type: 'element:site', props: { role: place.role, status: 'ok', name: place.name }, ...(lane && { bindings: { status: bindLane(lane, 'status') } }) },
  };
};

const tagNode = (place: Place): Node[] => {
  if (!place.tag) return [];
  const { x, y } = placeAt(place);
  return [
    node(`tag-${place.id}`, x + place.tag.dx, y + place.tag.dy - 17, 120, 34, {
      type: 'element:tag',
      props: { name: place.name, part: '', days: 0, status: 'ok', align: place.tag.align },
      bindings: { part: bindLane(place.id, 'part'), days: bindLane(place.id, 'days'), status: bindLane(place.id, 'status') },
    }),
  ];
};

/**
 * A lane between a place and the plant, drawn from the western end to the eastern so every arc bows north as a flight
 * path does; its arrow points the way the goods go. A long one carries its lead time on the arc.
 */
const lane = (id: string, toPlant: boolean, labelled: boolean): Connector => {
  const place = PLACES.find(p => p.id === id)!;
  const plant = PLACES[0]!;
  const westward = place.lng < plant.lng;
  const [from, to] = westward ? [place, plant] : [plant, place];
  // The goods run place → plant for a supplier, plant → place for a market.
  const goodsToEast = toPlant === westward;
  const arrow: ConnectorArrow = goodsToEast ? 'end' : 'start';
  return {
    id: `lane-${id}`,
    fromNodeId: `site-${from.id}`,
    toNodeId: `site-${to.id}`,
    ...(labelled && { label: '{{value}}일' }),
    style: { route: 'curved', arrow, strokeWidth: 3, stroke: ON_TIME },
    bindings: {
      ...(labelled && { label: bindLane(id, 'days') }),
      'style.stroke': bindLane(id, 'status', STATUS_COLOR),
      'style.strokeWidth': bindLane(id, 'teu', TEU_WIDTH),
    },
  };
};

const LANES: Connector[] = [
  lane('hsinchu', true, false),
  lane('osaka', true, false),
  lane('shenzhen', true, false),
  lane('penang', true, false),
  lane('munich', true, true),
  lane('austin', true, true),
  lane('rotterdam', false, true),
  lane('longbeach', false, true),
  lane('singapore', false, false),
];

const LOWER = { y: 636, height: 244 };

const nodes: Node[] = [
  node('headline', 40, 18, 1520, 112, {
    type: 'element:headline',
    props: { kicker: '', title: '', dek: '', date: '' },
    bindings: {
      kicker: bind('/supply/story', '/kicker'),
      title: bind('/supply/story', '/title'),
      dek: bind('/supply/story', '/dek'),
      date: bind('/supply/story', '/date'),
    },
  }),
  ...PLACES.map(siteNode),
  ...PLACES.flatMap(tagNode),
  node('plant-tag', placeAt(PLACES[0]!).x + 14, placeAt(PLACES[0]!).y - 52, 130, 34, {
    type: 'element:tag',
    props: { name: '평택 조립공장', part: '부품 재고', days: 0, status: 'ok', align: 'left' },
    bindings: { days: bind('/supply/plant', '/stockDays') },
  }),
  node('figures', 1270, 150, 290, 262, { type: 'element:figures', props: { items: [] }, bindings: { items: bind('/supply/figures', '/value') } }),
  node('risks', 1270, 428, 290, 172, { type: 'element:risks', props: { items: [] }, bindings: { items: bind('/supply/risks', '/value') } }),
  node('note', 40, LOWER.y, 360, LOWER.height, { type: 'element:note', props: { title: '', text: '' }, bindings: { title: bind('/supply/note', '/title'), text: bind('/supply/note', '/text') } }),
  node('lead-times', 420, LOWER.y - 6, 420, LOWER.height + 6, {
    type: 'chart.line',
    props: {
      title: '리드타임 12주(일)',
      data: [],
      mapping: { x: 'week', y: ['hsinchu', 'penang', 'shenzhen'] },
      options: { valueAxisZero: false, series: [{ label: '신주 → 평택', color: LATE }, { label: '페낭 → 평택', color: SLOW }, { label: '선전 → 평택', color: ON_TIME }] },
    },
    bindings: { data: bind('/supply/leadTimes', '/value') },
  }),
  node('shipments', 860, LOWER.y, 380, LOWER.height, { type: 'element:shipments', props: { items: [] }, bindings: { items: bind('/supply/shipments', '/value') } }),
  node('legend', 1270, LOWER.y + 4, 290, 160, { type: 'element:legend', props: {} }),
];

const document: CanvasView = {
  kind: 'canvas',
  appearance: 'light',
  accent: LATE,
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT, referencePoints: referencePoints(MAP) } },
  nodes,
  connectors: LANES,
  elements: { headline, site, tag, figures, risks, note, shipments, legend },
};

export const worldSupply: SamplePack = {
  id: 'world-supply',
  title: { ko: '전자부품 공급망 — 신문 데이터 지면', en: 'An electronics supply chain — a newspaper’s data page' },
  field: { ko: '제조·공급망', en: 'Manufacturing & supply chain' },
  kind: { ko: '세계 지도(점 지도 · 흐름 호)', en: 'A world map (dots and flow arcs)' },
  domain: 'manufacturing',
  styles: ['print'],
  summary: {
    ko: '전자제품 회사의 공급망을 신문 데이터 지면처럼 — 이번 주에 무엇이 바뀌었는지 말하는 제목, 회색 점으로 찍은 세계, 부품 공급사에서 조립공장으로, 공장에서 판매 물류센터로 가는 구간을 곡선 호로(굵기 = 주간 컨테이너, 색 = 제때·느림·늦음). 옆에 이번 주 수치와 위험 공급사, 아래에 무슨 일이 있었는지 한 단락, 세 구간의 12주 리드타임, 운송 중인 선적. 종이색 바탕, 세리프 제목, 늦음만 붉은색. 예시 데이터입니다.',
    en: 'An electronics maker’s supply chain drawn as a newspaper’s data page — a headline saying what changed this week, a world of grey dots, and the lanes as arcs from the parts suppliers to the assembly plant and from the plant to the sales centres (width = containers a week, colour = on time, slow or late). Beside it the week’s figures and the suppliers at risk; under it a paragraph on what happened, three lanes’ lead times over twelve weeks and the shipments at sea. Paper, a serif headline, red only for late. Example data.',
  },
  connectors: [SUPPLY],
  document,
  snapshot,
};
