import type { Binding, CanvasView, Connector, ElementDefinition, Node, Widget } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { svgDataUrl } from '../frame.js';
import { snapshot } from '../snapshots/mall-wayfinding.js';

// The directory kiosk standing by the escalators on a shopping centre's third floor, read by shoppers who stop for
// a few seconds: where they are, the floor's plan with what is happening on it now — which restroom has a free
// stall and the way there, how long each restaurant's queue is, where the lifts are, what is on in the atrium — and,
// below the plan, every floor's crowd and the car park. A portrait kiosk drawn the way directory screens are: the
// plan in soft greys taking most of the screen, live facts as small badges on it, one bold route from «you are
// here». No public source carries a shopping centre's queues and stalls, so the values are example data written for it.

export const MALL: ExampleSampleConnector = {
  key: 'mall',
  name: '예시 쇼핑몰 시설 API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 쇼핑몰이 아닙니다' },
};

/** Stalls and queues change by the minute; five minutes without an answer is a source that has stopped. */
const MAX_AGE_SECONDS = 5 * 60;

const bind = (path: string, valuePath: string): Binding => ({
  adapter: MALL.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
});

const WIDTH = 1080;
const HEIGHT = 1920;
const INK = '#1e293b';
const SOFT = '#64748b';
const ROUTE = '#0284c7';
const FONT = 'var(--u-widget-font-family)';

const PAD = 48;
const INNER = WIDTH - PAD * 2;
/** The plan's box on the screen; everything on the plan is placed in its own coordinates and shifted by this. */
const MAP = { x: PAD, y: 236, width: INNER, height: 1060 };
const at = (x: number, y: number) => ({ x: MAP.x + x, y: MAP.y + y });

/** The food hall along the top of the plan — each restaurant's name is in the drawing, its queue a badge on it. */
const RESTAURANTS = [
  { id: 'noodle', name: '면가 칼국수', x: 20 },
  { id: 'bibim', name: '비빔 한상', x: 257 },
  { id: 'pasta', name: '트라토리아', x: 494 },
  { id: 'katsu', name: '돈가스 공방', x: 731 },
];
const RESTAURANT = { y: 20, width: 227, height: 200 };

/** The shops down both sides. */
const SHOPS = [
  { name: '리빙 · 주방', x: 20, y: 240, height: 160 },
  { name: '침구 · 패브릭', x: 20, y: 410, height: 160 },
  { name: '서점 · 문구', x: 20, y: 580, height: 160 },
  { name: '키즈 · 완구', x: 774, y: 240, height: 160 },
  { name: '가전 · 디지털', x: 774, y: 410, height: 160 },
  { name: '아웃도어', x: 774, y: 580, height: 160 },
];
const SHOP_WIDTH = 190;

/** The corridor across the bottom of the plan, and the rooms past it. */
const CORRIDOR = { y: 750, height: 110 };
const BOTTOM = { y: 870, height: 170 };
const ATRIUM = { cx: 492, cy: 485, rx: 190, ry: 200 };

// ── The drawing ─────────────────────────────────────────────────────────────────────────────────────────────────

function drawing(): string {
  const room = (x: number, y: number, width: number, height: number, name: string, fill = '#e2e8f0') => {
    const p = at(x, y);
    return `<rect x="${p.x}" y="${p.y}" width="${width}" height="${height}" rx="14" fill="${fill}" stroke="#cbd5e1" stroke-width="2"/>
<text x="${p.x + 16}" y="${p.y + 34}" fill="${SOFT}" font-size="22" font-weight="700" font-family="sans-serif">${name}</text>`;
  };
  const plan = at(0, 0);
  const atrium = at(ATRIUM.cx, ATRIUM.cy);
  // An escalator at each end of the atrium, running across it — the steps drawn as rungs.
  const escalator = (x: number) => {
    const p = at(x - 46, ATRIUM.cy - 22);
    return `<rect x="${p.x}" y="${p.y}" width="92" height="44" rx="6" fill="#cbd5e1"/>${Array.from({ length: 7 }, (_, i) => `<line x1="${p.x + 10 + i * 12}" y1="${p.y + 6}" x2="${p.x + 10 + i * 12}" y2="${p.y + 38}" stroke="#94a3b8" stroke-width="3"/>`).join('')}`;
  };
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<rect width="${WIDTH}" height="${HEIGHT}" fill="#f1f5f9"/>
<rect width="${WIDTH}" height="212" fill="#0f172a"/>
<rect x="${plan.x}" y="${plan.y}" width="${MAP.width}" height="${MAP.height}" rx="36" fill="#ffffff" stroke="#cbd5e1" stroke-width="3"/>
${RESTAURANTS.map(r => room(r.x, RESTAURANT.y, RESTAURANT.width, RESTAURANT.height, r.name, '#fde7d4')).join('\n')}
${SHOPS.map(s => room(s.x, s.y, SHOP_WIDTH, s.height, s.name)).join('\n')}
<ellipse cx="${atrium.x}" cy="${atrium.y}" rx="${ATRIUM.rx}" ry="${ATRIUM.ry}" fill="#e0f2fe" stroke="#7dd3fc" stroke-width="6" stroke-dasharray="2 10" stroke-linecap="round"/>
<text x="${atrium.x}" y="${atrium.y - ATRIUM.ry + 66}" text-anchor="middle" fill="#0369a1" font-size="20" font-weight="700" font-family="sans-serif">중앙 아트리움 · 아래로 1층</text>
${escalator(ATRIUM.cx - ATRIUM.rx)}
${escalator(ATRIUM.cx + ATRIUM.rx)}
${room(20, BOTTOM.y, 180, BOTTOM.height, '화장실 서', '#dbeafe')}
${room(210, BOTTOM.y, 170, BOTTOM.height, '수유실', '#fce7f3')}
${room(390, BOTTOM.y, 200, BOTTOM.height, '엘리베이터', '#e0e7ff')}
${room(600, BOTTOM.y, 174, BOTTOM.height, '고객센터')}
${room(784, BOTTOM.y, 180, BOTTOM.height, '화장실 동', '#dbeafe')}
</svg>`;
  return svgDataUrl(svg);
}

// ── Elements ────────────────────────────────────────────────────────────────────────────────────────────────────

/** The centre's name, the floor this kiosk stands on, very large, and the hour. */
const masthead: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['name', 'floor', 'time'],
    properties: { name: { type: 'string' }, floor: { type: 'string' }, floorName: { type: 'string' }, date: { type: 'string' }, time: { type: 'string' }, hours: { type: 'string' } },
  },
  template: `<header class="mast"><b class="fl">{{floor}}</b><div><h1>{{name}}</h1><p>{{floorName}}</p></div><aside><time>{{time}}</time><small>{{date}} · {{hours}}</small></aside></header>`,
  style: `.mast{height:100%;box-sizing:border-box;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:28px;font-family:${FONT};color:#fff}
.fl{display:grid;place-items:center;width:132px;height:132px;border-radius:28px;background:${ROUTE};font-size:68px;font-weight:800}
h1{margin:0;font-size:42px;font-weight:800}
p{margin:6px 0 0;font-size:26px;color:#cbd5e1}
aside{display:grid;justify-items:end}
time{font-size:64px;font-weight:700;font-variant-numeric:tabular-nums}
small{font-size:20px;color:#94a3b8}`,
  size: { width: 984, height: 150 },
};

/** «You are here» — a dot with a ring, and which way the screen faces. */
const here: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['label'], properties: { label: { type: 'string' }, facing: { type: 'string' } } },
  template: `<p class="here"><i></i><span><b>{{label}}</b><small>{{facing}}</small></span></p>`,
  style: `.here{margin:0;height:100%;box-sizing:border-box;display:flex;align-items:center;gap:14px;padding:0 18px 0 14px;white-space:nowrap;border-radius:999px;background:#fff;border:3px solid #dc2626;font-family:${FONT};color:${INK}}
i{flex:none;width:30px;height:30px;border-radius:50%;background:#dc2626;box-shadow:0 0 0 8px rgba(220,38,38,.22)}
span{display:grid}
b{font-size:24px;font-weight:800;color:#dc2626}
small{font-size:16px;color:${SOFT}}`,
  size: { width: 240, height: 76 },
};

/** A restroom at its door: free stalls on each side, and whether the accessible one is free. */
const restroom: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['women', 'men'],
    properties: { women: { type: 'number' }, men: { type: 'number' }, accessible: { type: 'string' }, level: { enum: ['free', 'busy', 'full'] } },
  },
  template: `<section class="wc {{level}}"><small>빈 칸</small><p><span>여</span><b>{{women}}</b></p><p><span>남</span><b>{{men}}</b></p><small>장애인 칸 {{accessible}}</small></section>`,
  style: `.wc{--c:#059669;height:100%;box-sizing:border-box;display:grid;grid-template-columns:1fr 1fr;align-content:center;gap:0 8px;padding:6px 12px;white-space:nowrap;border-radius:16px;background:#fff;border:3px solid var(--c);font-family:${FONT};color:${INK}}
.busy{--c:#d97706}.full{--c:#dc2626}
p{margin:0;display:flex;align-items:baseline;justify-content:center;gap:6px}
span{font-size:18px;color:${SOFT}}
b{font-size:40px;line-height:1;font-weight:800;color:var(--c);font-variant-numeric:tabular-nums}
small{grid-column:1/-1;text-align:center;font-size:15px;color:${SOFT}}`,
  size: { width: 180, height: 100 },
};

/** A restaurant's queue: minutes and teams waiting, or that it is between lunch and dinner. */
const queue: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['minutes', 'teams', 'state'],
    properties: { minutes: { type: 'number' }, teams: { type: 'number' }, state: { enum: ['seated', 'queue', 'long', 'break'] }, note: { type: 'string' } },
  },
  template: `<p class="q {{state}}"><b>{{minutes}}<small>분</small></b><span>대기 {{teams}}팀</span><em>{{note}}</em></p>`,
  style: `.q{--c:#059669;margin:0;height:100%;box-sizing:border-box;display:grid;grid-template-columns:auto 1fr;grid-template-rows:auto auto;align-items:center;column-gap:12px;padding:8px 14px;border-radius:14px;background:#fff;border:2px solid var(--c);font-family:${FONT};color:${INK}}
.queue{--c:#d97706}.long{--c:#dc2626}.break{--c:#94a3b8}
b{grid-row:span 2;font-size:40px;line-height:1;font-weight:800;color:var(--c);font-variant-numeric:tabular-nums}
b small{font-size:18px;margin-left:2px}
span{font-size:20px;font-weight:700;white-space:nowrap}
em{font-style:normal;font-size:16px;color:${SOFT};white-space:nowrap;overflow:hidden;text-overflow:ellipsis}`,
  size: { width: 200, height: 84 },
};

/** The lift cars: the floor each is on and the way it is going. */
const lifts: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['cars'],
    properties: { cars: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, floor: { type: 'string' }, arrow: { type: 'string' }, way: { enum: ['up', 'down', 'idle'] } } } } },
  },
  template: `<ul class="lifts">{{#cars}}<li class="{{way}}"><small>{{name}}</small><b>{{floor}}</b><i>{{arrow}}</i></li>{{/cars}}</ul>`,
  style: `.lifts{height:100%;box-sizing:border-box;margin:0;padding:0;list-style:none;display:grid;grid-template-columns:repeat(3,1fr);gap:8px;align-content:center;font-family:${FONT};color:${INK}}
li{display:grid;justify-items:center;padding:4px 0;border-radius:12px;background:#fff;border:2px solid #a5b4fc}
small{font-size:13px;color:${SOFT}}
b{font-size:28px;line-height:1.1;font-weight:800;font-variant-numeric:tabular-nums}
i{font-style:normal;font-size:14px;color:#4f46e5;white-space:nowrap}
.idle i{color:#94a3b8}`,
  size: { width: 190, height: 104 },
};

/** A room in use or free, and for how long. */
const room: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['state'], properties: { state: { type: 'string' }, note: { type: 'string' }, free: { type: 'boolean' } } },
  template: `<p class="rm {{#free}}free{{/free}}"><b>{{state}}</b><small>{{note}}</small></p>`,
  style: `.rm{--c:#d97706;margin:0;height:100%;box-sizing:border-box;display:grid;align-content:center;justify-items:center;gap:2px;border-radius:14px;background:#fff;border:2px solid var(--c);font-family:${FONT};color:${INK}}
.free{--c:#059669}
b{font-size:24px;font-weight:800;color:var(--c)}
small{font-size:15px;color:${SOFT}}`,
  size: { width: 150, height: 80 },
};

/** What is on in the atrium below: the event, its hours and how full it is now. */
const event: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['title'],
    properties: { title: { type: 'string' }, where: { type: 'string' }, hours: { type: 'string' }, next: { type: 'string' } },
  },
  template: `<section class="ev"><small>{{where}}</small><h2>{{title}}</h2><p>{{hours}}</p><em>{{next}}</em></section>`,
  style: `.ev{height:100%;box-sizing:border-box;display:grid;align-content:center;justify-items:center;gap:4px;text-align:center;font-family:${FONT};color:${INK}}
small{font-size:18px;font-weight:700;color:#0369a1}
h2{margin:0;font-size:34px;font-weight:800;word-break:keep-all}
p{margin:0;font-size:20px;color:${SOFT}}
em{font-style:normal;margin-top:6px;padding:6px 16px;border-radius:999px;background:#0369a1;color:#fff;font-size:18px;font-weight:700}`,
  size: { width: 300, height: 190 },
};

/** Every floor, top to bottom: what is on it and how crowded it is now — this floor marked. */
const floors: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['floors'],
    properties: {
      floors: {
        type: 'array',
        items: { type: 'object', properties: { floor: { type: 'string' }, name: { type: 'string' }, crowd: { enum: ['calm', 'busy', 'packed'] }, word: { type: 'string' }, here: { type: 'boolean' } } },
      },
    },
  },
  template: `<ol class="floors">{{#floors}}<li class="{{crowd}} {{#here}}here{{/here}}"><b>{{floor}}</b><span>{{name}}</span><em><i></i>{{word}}</em></li>{{/floors}}</ol>`,
  style: `.floors{height:100%;box-sizing:border-box;margin:0;padding:0;list-style:none;display:grid;align-content:space-between;font-family:${FONT};color:${INK}}
li{--c:#059669;display:grid;grid-template-columns:72px 1fr 110px;align-items:center;gap:12px;padding:6px 12px;border-radius:12px}
.busy{--c:#d97706}.packed{--c:#dc2626}
.here{background:#e0f2fe;outline:3px solid ${ROUTE}}
b{font-size:28px;font-weight:800;font-variant-numeric:tabular-nums}
.here b{color:${ROUTE}}
span{font-size:20px;color:${SOFT};white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
em{font-style:normal;display:flex;align-items:center;gap:8px;font-size:18px;font-weight:700;color:var(--c)}
i{width:14px;height:14px;border-radius:50%;background:var(--c)}`,
  size: { width: 560, height: 520 },
};

/** The car park, level by level: free spaces, red when nearly full. */
const parking: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['levels'],
    properties: { levels: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, free: { type: 'number' }, level: { enum: ['free', 'few', 'full'] } } } } },
  },
  template: `<ul class="park">{{#levels}}<li class="{{level}}"><span>{{name}}</span><b>{{free}}</b></li>{{/levels}}</ul>`,
  style: `.park{height:100%;box-sizing:border-box;margin:0;padding:0;list-style:none;display:grid;grid-template-columns:repeat(4,1fr);gap:8px;align-content:center;font-family:${FONT};color:${INK}}
li{--c:#059669;display:grid;justify-items:center;padding:6px 0;border-radius:12px;border:2px solid var(--c);background:color-mix(in srgb,var(--c) 8%,white)}
.few{--c:#d97706}.full{--c:#dc2626}
span{font-size:16px;color:${SOFT}}
b{font-size:30px;line-height:1.1;font-weight:800;color:var(--c);font-variant-numeric:tabular-nums}`,
  size: { width: 360, height: 90 },
};

/** A panel's heading on the screen's paper. */
const heading: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['text'], properties: { text: { type: 'string' }, note: { type: 'string' } } },
  template: `<h3 class="hd">{{text}}<small>{{note}}</small></h3>`,
  style: `.hd{margin:0;height:100%;display:flex;align-items:baseline;gap:12px;font:800 28px ${FONT};color:${INK}}
small{font-size:18px;font-weight:600;color:${SOFT}}`,
  size: { width: 400, height: 40 },
};

// ── The board ───────────────────────────────────────────────────────────────────────────────────────────────────

const node = (id: string, x: number, y: number, width: number, height: number, widget: Widget): Node => ({ id, x, y, width, height, anchored: false, widget });
const onPlan = (id: string, x: number, y: number, width: number, height: number, widget: Widget): Node => {
  const p = at(x, y);
  return node(id, p.x, p.y, width, height, widget);
};

const restaurantNode = ({ id, x }: (typeof RESTAURANTS)[number]): Node => {
  const field = (name: string) => bind('/mall/restaurants', `/${id}/${name}`);
  return onPlan(`queue-${id}`, x + 12, RESTAURANT.y + 96, RESTAURANT.width - 24, 84, {
    type: 'element:queue',
    props: { minutes: 0, teams: 0, state: 'seated', note: '' },
    bindings: { minutes: field('minutes'), teams: field('teams'), state: field('state'), note: field('note') },
  });
};

const restroomNode = (side: 'west' | 'east', x: number): Node => {
  const field = (name: string) => bind('/mall/restrooms', `/${side}/${name}`);
  // At the restroom's door in the corridor, level with «you are here», so the way there runs along the corridor.
  return onPlan(`wc-${side}`, x, CORRIDOR.y + 5, 180, 100, {
    type: 'element:restroom',
    props: { women: 0, men: 0, accessible: '', level: 'free' },
    bindings: { women: field('women'), men: field('men'), accessible: field('accessible'), level: field('level') },
  });
};

const nodes: Node[] = [
  node('masthead', PAD, 30, INNER, 150, {
    type: 'element:masthead',
    props: { name: '', floor: '', floorName: '', date: '', time: '', hours: '' },
    bindings: {
      name: bind('/mall/now', '/name'),
      floor: bind('/mall/now', '/floor'),
      floorName: bind('/mall/now', '/floorName'),
      date: bind('/mall/now', '/date'),
      time: bind('/mall/now', '/time'),
      hours: bind('/mall/now', '/hours'),
    },
  }),
  ...RESTAURANTS.map(restaurantNode),
  onPlan('atrium', ATRIUM.cx - 150, ATRIUM.cy - 70, 300, 190, {
    type: 'element:event',
    props: { title: '', where: '', hours: '', next: '' },
    bindings: { title: bind('/mall/atrium', '/title'), where: bind('/mall/atrium', '/where'), hours: bind('/mall/atrium', '/hours'), next: bind('/mall/atrium', '/next') },
  }),
  onPlan('here', 236, CORRIDOR.y + 17, 240, 76, { type: 'element:here', props: { label: '현재 위치', facing: '에스컬레이터 앞' } }),
  restroomNode('west', 30),
  restroomNode('east', 774),
  onPlan('nursing', 220, BOTTOM.y + 64, 150, 80, {
    type: 'element:room',
    props: { state: '', note: '', free: false },
    bindings: { state: bind('/mall/nursing', '/state'), note: bind('/mall/nursing', '/note'), free: bind('/mall/nursing', '/free') },
  }),
  onPlan('lifts', 395, BOTTOM.y + 52, 190, 104, { type: 'element:lifts', props: { cars: [] }, bindings: { cars: bind('/mall/lifts', '/value') } }),
  node('floors-head', PAD, 1330, 560, 40, { type: 'element:heading', props: { text: '층별 안내', note: '지금 붐비는 정도' } }),
  node('floors', PAD, 1380, 560, 500, { type: 'element:floors', props: { floors: [] }, bindings: { floors: bind('/mall/floors', '/value') } }),
  node('parking-head', 652, 1330, 380, 40, { type: 'element:heading', props: { text: '주차장 빈자리', note: '' }, bindings: { note: bind('/mall/parking', '/note') } }),
  node('parking', 652, 1380, 380, 96, { type: 'element:parking', props: { levels: [] }, bindings: { levels: bind('/mall/parking', '/value') } }),
  node('visitors-head', 652, 1510, 380, 40, { type: 'element:heading', props: { text: '오늘 시간대별 방문객', note: '' } }),
  node('visitors', 652, 1556, 380, 324, {
    type: 'chart.bar',
    props: { data: [], mapping: { x: 'hour', y: 'people' }, options: { series: [{ label: '입장(명)', color: ROUTE }] } },
    bindings: { data: bind('/mall/visitors', '/value') },
  }),
];

/** The way from the kiosk to the restroom with stalls free — the source picks which, and says how far. */
const route: Connector = {
  id: 'route',
  fromNodeId: 'here',
  toNodeId: 'wc-east',
  label: '{{value}}',
  labelSize: 24,
  style: { route: 'orthogonal', stroke: ROUTE, strokeWidth: 8, arrow: 'end' },
  bindings: { label: bind('/mall/route', '/label') },
};

const document: CanvasView = {
  kind: 'canvas',
  appearance: 'light',
  accent: ROUTE,
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes,
  connectors: [route],
  elements: { masthead, here, restroom, queue, lifts, room, event, floors, parking, heading },
};

export const mallWayfinding: SamplePack = {
  id: 'mall-wayfinding',
  title: { ko: '쇼핑몰 층별 안내 — 세로 길찾기 키오스크', en: 'A shopping centre’s floor directory — a portrait wayfinding kiosk' },
  field: { ko: '유통·리테일', en: 'Retail' },
  kind: { ko: '세로 화면(9:16 키오스크) × 층 평면도', en: 'Portrait screen (a 9:16 kiosk) over a floor plan' },
  domain: 'logistics',
  styles: ['signage'],
  summary: {
    ko: '쇼핑몰 3층 에스컬레이터 옆에 세워 둔 안내 키오스크 — 화면 대부분을 차지하는 층 평면도 위에 «현재 위치»와 지금의 일: 빈 칸이 있는 화장실까지 굵은 길(도보 시간), 식당가 가게마다 대기 시간·팀, 엘리베이터 세 대가 있는 층과 방향, 수유실 사용 여부, 아트리움 행사. 아래에 층마다 붐비는 정도(이 층 표시), 주차장 층별 빈자리, 시간대별 방문객. 예시 데이터입니다.',
    en: 'The directory kiosk by the escalators on a shopping centre’s third floor — the floor’s plan filling most of the screen, with «you are here» and what is happening now: a bold way to the restroom that has stalls free (and how long the walk is), each restaurant’s wait in minutes and parties, the floor and direction of the three lifts, whether the nursing room is in use, and the event in the atrium. Below, how crowded each floor is (this one marked), free spaces in the car park level by level, and visitors by the hour. Example data.',
  },
  connectors: [MALL],
  document,
  snapshot,
};
