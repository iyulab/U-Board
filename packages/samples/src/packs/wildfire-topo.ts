import type { Binding, CanvasView, Connector, ElementDefinition, Node, Widget } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { svgDataUrl } from '../frame.js';
import { snapshot } from '../snapshots/wildfire-topo.js';

// A mountain's fire watch drawn as a topographic map sheet — brown contour lines with a heavier one every fifth,
// woodland tint, blue streams and a reservoir, dashed trails, the kilometre grid with its numbers in the collar, a
// title block, a scale bar and a legend. Every lookout tower and camera sits on the map as a map symbol whose shape
// is its state (a hollow triangle steady, a triangle in a dotted ring a smoke being checked, a filled red triangle a
// smoke found, a dashed grey triangle out of contact); the suspected fire is a red cross-in-circle, and the crew and
// the helicopter are joined to it by lines that carry their way there. The mountain and its posts are made up, so the
// values are example data.

export const WATCH: ExampleSampleConnector = {
  key: 'watch',
  name: '예시 산림 감시 API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 산·감시탑이 아닙니다' },
};

/** The towers and cameras report every ten minutes; half an hour without one is a post to check. */
const MAX_AGE_SECONDS = 30 * 60;

const bind = (path: string, valuePath: string, map?: Binding['map']): Binding => ({
  adapter: WATCH.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
  ...(map && { map }),
});

const WIDTH = 1600;
const HEIGHT = 1000;
const PAPER = '#f6f1df';
const COLLAR = '#fdfcf7';
const WOOD = '#d7e7c2';
const CONTOUR = '#b2713c';
const WATER = '#3d7fb8';
const WATER_FILL = '#bcd8ee';
const GRID = '#2f5d86';
const INK = '#1f1d1a';
const RED = '#c62f22';
const ORANGE = '#d9822b';
const GREY = '#8a857a';
const TEXT = '"Pretendard", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
/** The text font list without quotes — the background is parsed as XML, where it sits inside an attribute. */
const PLAIN = 'Pretendard, Malgun Gothic, Apple SD Gothic Neo, sans-serif';
const SERIF = '"Nanum Myeongjo", "Batang", "AppleMyungjo", serif';

/** The map's frame (the neatline) inside the sheet's collar. */
const MAP = { x: 40, y: 80, w: 1140, h: 880 } as const;
/** One kilometre on the grid. */
const KM = 190;

// ── The map sheet ──────────────────────────────────────────────────────────────────────────────────────────────

/** A closed, slightly irregular ring around a summit — the shape every contour of that summit shares, scaled. */
function ring(cx: number, cy: number, r: number, squash: number, phase: number): string {
  const points: string[] = [];
  for (let i = 0; i < 72; i++) {
    const t = (i / 72) * Math.PI * 2;
    const k = 1 + 0.11 * Math.sin(3 * t + phase) + 0.06 * Math.sin(5 * t + phase * 2) + 0.04 * Math.cos(7 * t);
    points.push(`${(cx + Math.cos(t) * r * k).toFixed(1)} ${(cy + Math.sin(t) * r * k * squash).toFixed(1)}`);
  }
  return `M${points.join(' L')} Z`;
}

/** A summit's contours, every fifth one heavier (the index contour). */
function hill(cx: number, cy: number, rings: number, step: number, squash: number, phase: number): string {
  return Array.from({ length: rings }, (_, i) => {
    const index = (rings - i) % 5 === 0;
    return `<path d="${ring(cx, cy, 14 + i * step, squash, phase)}" fill="none" stroke="${CONTOUR}" stroke-width="${index ? 2.2 : 1}"/>`;
  }).join('');
}

function drawing(): string {
  const { x, y, w, h } = MAP;
  const gridX = Array.from({ length: Math.floor(w / KM) + 1 }, (_, i) => x + 50 + i * KM).filter(gx => gx < x + w);
  const gridY = Array.from({ length: Math.floor(h / KM) + 1 }, (_, i) => y + 40 + i * KM).filter(gy => gy < y + h);
  // The grid's numbers in the collar, as a sheet prints them: eastings above and below, northings on the left.
  const numbers = [
    ...gridX.map((gx, i) => `<text x="${gx}" y="${y - 8}" text-anchor="middle">${41 + i}</text><text x="${gx}" y="${y + h + 22}" text-anchor="middle">${41 + i}</text>`),
    ...gridY.map((gy, i) => `<text x="${x - 8}" y="${gy + 5}" text-anchor="end">${17 - i}</text>`),
  ].join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<defs><clipPath id="map"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath></defs>
<rect width="${WIDTH}" height="${HEIGHT}" fill="${COLLAR}"/>
<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${PAPER}"/>
<g clip-path="url(#map)">
<path d="${ring(400, 360, 330, 0.85, 0.4)}" fill="${WOOD}"/>
<path d="${ring(830, 560, 310, 0.8, 1.7)}" fill="${WOOD}"/>
<path d="M ${x} 700 C 200 640, 330 760, 470 800 S 560 900, 620 960 L ${x} 960 Z" fill="#e7efd8"/>
${hill(400, 360, 16, 19, 0.85, 0.4)}
${hill(830, 560, 14, 20, 0.8, 1.7)}
${hill(1080, 200, 7, 22, 0.9, 2.6)}
<path d="M 560 120 C 600 220, 560 330, 610 430 S 600 620, 640 760 S 700 860, 690 900" fill="none" stroke="${WATER}" stroke-width="2.5"/>
<path d="M 300 640 C 380 690, 470 720, 560 760 S 640 800, 690 860" fill="none" stroke="${WATER}" stroke-width="2"/>
<path d="M 1000 780 C 930 820, 850 840, 760 880" fill="none" stroke="${WATER}" stroke-width="2"/>
<path d="M 640 880 C 690 850, 790 850, 830 880 C 860 905, 820 950, 740 950 C 660 950, 610 915, 640 880 Z" fill="${WATER_FILL}" stroke="${WATER}" stroke-width="2"/>
<text x="735" y="925" text-anchor="middle" font-family="serif" font-style="italic" font-size="15" fill="${WATER}">솔매 저수지</text>
<path d="M 120 900 C 200 780, 260 640, 330 520 S 380 400, 400 360 M 400 360 C 480 400, 560 470, 640 520 S 760 560, 830 560 M 830 560 C 900 500, 980 380, 1080 200" fill="none" stroke="${INK}" stroke-width="1.6" stroke-dasharray="7 5"/>
<path d="M 1140 940 C 1060 880, 980 820, 900 760 S 840 640, 830 560" fill="none" stroke="${INK}" stroke-width="1.6" stroke-dasharray="7 5"/>
<g stroke="${GRID}" stroke-width=".8" opacity=".55">${gridX.map(gx => `<line x1="${gx}" y1="${y}" x2="${gx}" y2="${y + h}"/>`).join('')}${gridY.map(gy => `<line x1="${x}" y1="${gy}" x2="${x + w}" y2="${gy}"/>`).join('')}</g>
</g>
<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${INK}" stroke-width="2.5"/>
<rect x="${x - 6}" y="${y - 6}" width="${w + 12}" height="${h + 12}" fill="none" stroke="${INK}" stroke-width=".8"/>
<g font-family="${PLAIN}" font-size="12" fill="${GRID}">${numbers}</g>
<g font-family="${PLAIN}" fill="${INK}">
<rect x="1210" y="80" width="350" height="880" fill="none" stroke="${INK}" stroke-width="1"/>
<g transform="translate(1230 880)"><text font-size="12" y="-10">축척 1:25,000</text>${[0, 1, 2, 3].map(i => `<rect x="${i * 70}" y="0" width="70" height="8" fill="${i % 2 ? '#fff' : INK}" stroke="${INK}"/>`).join('')}<text font-size="11" y="24">0</text><text font-size="11" x="140" y="24" text-anchor="middle">1</text><text font-size="11" x="280" y="24" text-anchor="middle">2 km</text></g>
<g transform="translate(1520 860)"><path d="M0 -40 L12 0 L0 -8 L-12 0 Z" fill="${INK}"/><text y="18" text-anchor="middle" font-size="14" font-weight="700">N</text></g>
<text x="1230" y="935" font-size="11" fill="#5a564e">등고선 간격 20 m · 굵은 선 100 m · 격자 1 km</text>
</g>
</svg>`;
  return svgDataUrl(svg);
}

// ── Elements ───────────────────────────────────────────────────────────────────────────────────────────────────

/** A lookout tower or camera, as a map annotation — read from `p`: the symbol is the state (`calm`, `watch`,
 *  `smoke`, `offline`), with the post's name and height, what it sees, the wind there and when it last reported. */
const post: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['p'], properties: { p: { type: 'object' } } },
  template: `<article class="ps {{p.state}}"><i class="sym"></i><div><h2>{{p.name}} <small>{{p.elev}} m</small></h2><p class="word">{{p.word}}</p><p class="obs">가시 {{p.view}} km · {{p.wind}} · {{p.time}}</p></div></article>`,
  style: `.ps{height:100%;box-sizing:border-box;display:grid;grid-template-columns:34px 1fr;gap:8px;align-items:center;padding:6px 8px;background:rgba(253,252,247,.92);border:1.5px solid ${INK};font-family:${TEXT};color:${INK}}
.sym{position:relative;width:30px;height:30px;display:block}
.sym::before{content:"";position:absolute;inset:3px 2px 1px;clip-path:polygon(50% 0,100% 100%,0 100%);background:${INK}}
.sym::after{content:"";position:absolute;inset:9px 8px 4px;clip-path:polygon(50% 0,100% 100%,0 100%);background:${COLLAR}}
.watch .sym{border:2px dotted ${ORANGE};border-radius:50%;box-sizing:border-box}.watch .sym::before{inset:5px 5px 4px}.watch .sym::after{inset:10px 10px 6px}
.smoke{border:3px solid ${RED}}.smoke .sym::before{background:${RED}}.smoke .sym::after{display:none}
.offline{border-style:dashed;color:${GREY}}.offline .sym::before{background:${GREY}}
h2{margin:0;font-size:15px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
h2 small{font-size:11px;font-weight:400;color:#5a564e}
.word{margin:1px 0 0;font-size:14px;font-weight:700}
.watch .word{color:#a85a12}.smoke .word{color:${RED}}
.obs{margin:1px 0 0;font-size:11px;color:#5a564e;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}`,
  size: { width: 220, height: 84 },
};

/** The suspected fire — a red cross in a circle with what is known of it, read from `f`. */
const fire: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['f'], properties: { f: { type: 'object' } } },
  template: `<article class="fr"><i class="sym"></i><div><h2>{{f.title}}</h2><p>{{f.seen}} 발견 · {{f.area}}</p><p>연기 {{f.drift}}</p></div></article>`,
  style: `.fr{height:100%;box-sizing:border-box;display:grid;grid-template-columns:38px 1fr;gap:8px;align-items:center;padding:6px 8px;background:#fff4ef;border:2px solid ${RED};font-family:${TEXT};color:${INK}}
.sym{width:34px;height:34px;box-sizing:border-box;border:3px solid ${RED};border-radius:50%;background:linear-gradient(${RED},${RED}) center/3px 100% no-repeat,linear-gradient(${RED},${RED}) center/100% 3px no-repeat}
h2{margin:0;font-size:15px;font-weight:800;color:${RED};white-space:nowrap}
p{margin:1px 0 0;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}`,
  size: { width: 210, height: 76 },
};

/** A base on the map (the crew's station, the helicopter pad) — a filled square, as a building is drawn. */
const base: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['b'], properties: { b: { type: 'object' } } },
  template: `<article class="bs"><i class="sym"></i><div><h2>{{b.name}}</h2><p>{{b.status}}</p></div></article>`,
  style: `.bs{height:100%;box-sizing:border-box;display:grid;grid-template-columns:18px 1fr;gap:8px;align-items:center;padding:4px 8px;background:rgba(253,252,247,.92);border:1px solid ${INK};font-family:${TEXT};color:${INK}}
.sym{width:16px;height:16px;background:${INK}}
h2{margin:0;font-size:14px;font-weight:800;white-space:nowrap}
p{margin:1px 0 0;font-size:12px;color:#3d3a34;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}`,
  size: { width: 180, height: 56 },
};

/** The sheet's title block in the collar — read from `n`. */
const title: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['n'], properties: { n: { type: 'object' } } },
  template: `<header class="tb"><p class="sheet">산림 감시도 · 도엽 3</p><h1>솔매산</h1><p class="when">{{n.date}} {{n.time}} 현재</p><p class="risk {{n.level}}">산불 위험 <b>{{n.risk}}</b> <small>{{n.note}}</small></p></header>`,
  style: `.tb{height:100%;box-sizing:border-box;padding:4px 4px 0;font-family:${TEXT};color:${INK}}
.sheet{margin:0;font-size:12px;letter-spacing:.12em;color:#5a564e}
h1{margin:2px 0 0;font-family:${SERIF};font-size:40px;font-weight:800;letter-spacing:.3em}
.when{margin:2px 0 8px;font-size:13px;color:#5a564e}
.risk{margin:0;padding:6px 10px;border:1.5px solid ${INK};font-size:14px;display:flex;align-items:baseline;gap:8px}
.risk b{font-size:20px}.risk small{font-size:12px;color:#5a564e;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.high{border-color:${RED};border-width:3px}.high b{color:${RED}}`,
  size: { width: 320, height: 176 },
};

/** The crews and aircraft on call — read from `items`. */
const crews: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, what: { type: 'string' }, state: { type: 'string' } } } } },
  },
  template: `<section class="cr"><h2>진화 자원</h2><ul>{{#items}}<li class="{{state}}"><b>{{name}}</b><span>{{what}}</span></li>{{/items}}</ul></section>`,
  style: `.cr{height:100%;box-sizing:border-box;font-family:${TEXT};color:${INK}}
h2{margin:0 0 6px;font-size:15px;font-weight:800;border-bottom:1.5px solid ${INK};padding-bottom:3px}
ul{margin:0;padding:0;list-style:none;display:grid;gap:4px}
li{display:grid;grid-template-columns:92px 1fr;gap:6px;font-size:13px;line-height:1.3}
li::before{content:none}
b{font-weight:800}
.moving b::after{content:" ▶";color:${RED}}.ready b::after{content:" ■"}.off{color:${GREY}}`,
  size: { width: 320, height: 170 },
};

// ── The board ──────────────────────────────────────────────────────────────────────────────────────────────────

const node = (id: string, x: number, y: number, width: number, height: number, widget: Widget): Node => ({ id, x, y, width, height, anchored: false, widget });

/** The posts, each beside the summit or ridge it stands on. */
const POSTS = [
  { id: 't1', x: 300, y: 250 },
  { id: 't2', x: 140, y: 520 },
  { id: 't3', x: 560, y: 410 },
  { id: 't4', x: 920, y: 690 },
  { id: 't5', x: 900, y: 150 },
] as const;

const LINE_COLOUR = { values: { moving: RED, ready: INK, off: GREY }, otherwise: INK };
const LINE_DASH = { values: { moving: 'solid', ready: 'dashed', off: 'dotted' }, otherwise: 'dashed' };

/** A base's way to the fire, carrying when it gets there. */
const way = (id: string, from: string): Connector => ({
  id: `way-${id}`,
  fromNodeId: from,
  toNodeId: 'fire',
  label: '{{value}}',
  labelSize: 13,
  style: { stroke: INK, strokeWidth: 3, route: 'curved' },
  bindings: {
    label: bind('/watch/ways', `/value/${id}/label`),
    'style.stroke': bind('/watch/ways', `/value/${id}/state`, LINE_COLOUR),
    'style.dash': bind('/watch/ways', `/value/${id}/state`, LINE_DASH),
  },
});

const nodes: Node[] = [
  ...POSTS.map(({ id, x, y }) => node(`post-${id}`, x, y, 220, 84, { type: 'element:post', props: { p: {} }, bindings: { p: bind('/watch/posts', `/value/${id}`) } })),
  node('fire', 250, 700, 210, 76, { type: 'element:fire', props: { f: {} }, bindings: { f: bind('/watch/fire', '/value') } }),
  node('crew', 640, 650, 180, 56, { type: 'element:base', props: { b: {} }, bindings: { b: bind('/watch/bases', '/value/crew') } }),
  node('heli', 60, 880, 180, 56, { type: 'element:base', props: { b: {} }, bindings: { b: bind('/watch/bases', '/value/heli') } }),
  node('title', 1225, 95, 320, 176, { type: 'element:title', props: { n: {} }, bindings: { n: bind('/watch/now', '/value') } }),
  node('risk', 1225, 285, 320, 310, {
    type: 'chart.bar',
    props: { title: '오늘 시간별 산불위험지수', data: [], mapping: { x: 'hour', y: 'index' }, options: { series: [{ label: '위험지수', color: ORANGE }] } },
    bindings: { data: bind('/watch/risk', '/value') },
  }),
  node('crews', 1225, 610, 320, 170, { type: 'element:crews', props: { items: [] }, bindings: { items: bind('/watch/crews', '/value') } }),
];

const document: CanvasView = {
  kind: 'canvas',
  appearance: 'light',
  accent: RED,
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes,
  connectors: [way('crew', 'crew'), way('heli', 'heli')],
  elements: { post, fire, base, title, crews },
};

export const wildfireTopo: SamplePack = {
  id: 'wildfire-topo',
  title: { ko: '산불 감시 — 지형도 도엽', en: 'A mountain’s fire watch — a topographic map sheet' },
  field: { ko: '산림·산불 감시', en: 'Forest fire watch' },
  kind: { ko: '감시탑·카메라 상태와 진화 자원', en: 'Lookouts, cameras and the crews on call' },
  domain: 'public',
  styles: ['drawing'],
  summary: {
    ko: '한 산의 산불 감시를 지형도 도엽으로 — 갈색 등고선(100 m마다 굵게), 숲 색, 파란 물길과 저수지, 점선 등산로, 테두리 밖에 번호를 단 1 km 격자, 도엽 제목 칸·축척·방위표. 감시탑과 무인 카메라는 지도 기호로 놓이고 그 모양이 상태입니다 — 속 빈 세모 평온, 점선 원 속 세모 연기 확인 중, 붉게 채운 세모 연기 발견, 회색 점선 세모 통신 끊김. 발화 의심 지점은 붉은 원 속 십자, 진화대와 헬기는 그곳까지 가는 길로 이어져 도착 예정을 싣습니다. 오른쪽 여백에 시간별 산불위험지수와 진화 자원. 산과 감시탑은 지어낸 것이라 예시 데이터입니다.',
    en: 'A mountain’s fire watch as a topographic map sheet — brown contours with a heavier one every 100 m, woodland tint, blue streams and a reservoir, dashed trails, the kilometre grid numbered in the collar, a title block, a scale bar and a north arrow. Lookout towers and unmanned cameras sit on the map as map symbols whose shape is their state: a hollow triangle steady, a triangle in a dotted ring a smoke being checked, a filled red triangle a smoke found, a dashed grey triangle out of contact. The suspected fire is a red cross in a circle, and the crew and the helicopter are joined to it by lines that carry when they get there. In the collar, today’s fire danger by hour and the crews on call. The mountain and its posts are made up. Example data.',
  },
  connectors: [WATCH],
  document,
  snapshot,
};
