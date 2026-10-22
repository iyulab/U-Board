import type { Binding, CanvasView, ElementDefinition, Node, Widget } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { svgDataUrl } from '../frame.js';
import { snapshot } from '../snapshots/lost-found-dossier.js';

// A railway station's lost-and-found office as a desk of typed case files: manila folders with a tab for the case
// number, an index card typed on a typewriter in each — what was found, where, when, what marks it — and a rubber stamp
// across the card for where the case stands: kept, owner contacted, handed back, or due for disposal. On the right a
// label-maker title, the day's figures on a typed memo, what is kept by kind on a sheet of graph paper, and the claims
// waiting at the counter. The station and its office are made up, so the values are example data.

export const DESK: ExampleSampleConnector = {
  key: 'desk',
  name: '예시 분실물 관리 API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 역·분실물 센터가 아닙니다' },
};

/** The office updates its files as items come in and go out; a quarter of an hour without a word is a desk gone quiet. */
const MAX_AGE_SECONDS = 15 * 60;

const bind = (path: string, valuePath: string): Binding => ({
  adapter: DESK.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
});

const WIDTH = 1600;
const HEIGHT = 1000;
const DESK_TOP = '#4a3a2f';
const GRAIN = '#56443a';
const MANILA = '#e6c88c';
const MANILA_EDGE = '#b8975a';
const CARD = '#fbf8ef';
const RULE = '#a9c3dc';
const MARGIN_RED = '#d9837a';
const INK = '#26262b';
const STAMP_RED = '#c2362f';
const STAMP_BLUE = '#2b4f8c';
const STAMP_GREEN = '#2f7a4a';
const STAMP_AMBER = '#b86e0e';
const TYPE = '"Courier New", "Nanum Gothic Coding", "D2Coding", monospace';
const TEXT = '"Pretendard", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';

const FOLDER = { width: 240, height: 320 };
/** The case files, four to a row, in the order the office files them. */
const CASES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
const folderAt = (i: number) => ({ x: 40 + (i % 4) * 256, y: 124 + Math.floor(i / 4) * 340 });

// ── The desk ───────────────────────────────────────────────────────────────────────────────────────────────────

function drawing(): string {
  const grain: string[] = [];
  for (let y = 18; y < HEIGHT; y += 26) {
    grain.push(`<path d="M0 ${y} C 400 ${y - 6}, 800 ${y + 8}, 1200 ${y - 2} S 1500 ${y + 4}, ${WIDTH} ${y}" stroke="${GRAIN}" stroke-width="3" fill="none"/>`);
  }
  // A shadow under each folder and the papers on the right, so they lie on the desk.
  const shadow = (x: number, y: number, w: number, h: number) => `<rect x="${x + 6}" y="${y + 8}" width="${w}" height="${h}" rx="4" fill="#000" opacity=".28"/>`;
  const folders = CASES.map((_, i) => {
    const { x, y } = folderAt(i);
    return shadow(x, y, FOLDER.width, FOLDER.height);
  });
  // Graph paper under the chart: the chart draws no ground of its own.
  const graph: string[] = [];
  for (let gx = 1094; gx <= 1556; gx += 14) graph.push(`<path d="M${gx} 372 V 650" stroke="#cfe3d6" stroke-width="1"/>`);
  for (let gy = 372; gy <= 650; gy += 14) graph.push(`<path d="M1094 ${gy} H 1556" stroke="#cfe3d6" stroke-width="1"/>`);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<rect width="${WIDTH}" height="${HEIGHT}" fill="${DESK_TOP}"/>
${grain.join('')}
${folders.join('')}
${shadow(1090, 360, 470, 296)}
<rect x="1090" y="360" width="470" height="296" fill="#f4f8f2"/>
${graph.join('')}
<rect x="1090" y="360" width="470" height="296" fill="none" stroke="#9fbfab" stroke-width="2"/>
<g transform="translate(1520 352) rotate(18)"><rect x="-6" y="-22" width="12" height="44" rx="6" fill="none" stroke="#c9cdd2" stroke-width="3"/></g>
${shadow(40, 812, 1008, 158)}
</svg>`;
  return svgDataUrl(svg);
}

// ── Elements ───────────────────────────────────────────────────────────────────────────────────────────────────

/** A case file: a manila folder with its number on the tab, the typed index card inside, and the stamp for where the
 *  case stands — read from `f`. A stamp says it in words and its colour, and the folder's edge takes the colour too. */
const folder: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['f'], properties: { f: { type: 'object' } } },
  template: `<article class="fd {{f.state}}"><div class="tab">{{f.no}}</div><div class="card"><dl><div><dt>품목</dt><dd>{{f.item}}</dd></div><div><dt>습득</dt><dd>{{f.where}}</dd></div><div><dt>일시</dt><dd>{{f.when}}</dd></div><div><dt>특징</dt><dd>{{f.note}}</dd></div></dl><p class="st"><b>{{f.stamp}}</b><small>{{f.since}}</small></p></div></article>`,
  style: `.fd{position:relative;height:100%;box-sizing:border-box;padding-top:30px;font-family:${TYPE};color:${INK}}
.tab{position:absolute;top:0;left:14px;width:142px;white-space:nowrap;height:34px;box-sizing:border-box;padding:7px 10px 0;background:${MANILA};border:1.5px solid ${MANILA_EDGE};border-bottom:0;border-radius:8px 8px 0 0;font:700 14px ${TYPE};letter-spacing:.06em}
.card{position:relative;height:100%;box-sizing:border-box;padding:14px 12px 10px 30px;background:${MANILA};border:1.5px solid ${MANILA_EDGE};border-radius:0 6px 6px 6px;border-left:8px solid ${MANILA_EDGE}}
dl{margin:0;height:200px;box-sizing:border-box;padding:6px 8px 0 26px;background:${CARD} repeating-linear-gradient(${CARD} 0 23px, ${RULE} 23px 24px);border-left:2px solid ${MARGIN_RED};display:grid;align-content:start;gap:0}
dl div{display:grid;grid-template-columns:40px 1fr;line-height:24px;font-size:13px}
dt{color:#6b6f78}
dd{margin:0;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.st{position:absolute;right:14px;bottom:14px;margin:0;display:grid;justify-items:center;padding:4px 10px;border:3px double currentColor;border-radius:6px;transform:rotate(-8deg);font-family:${TEXT};opacity:.9}
.st b{font-size:18px;letter-spacing:.12em}
.st small{font:11px ${TYPE}}
.kept .card{border-left-color:${STAMP_BLUE}}.kept .st{color:${STAMP_BLUE}}
.contacted .card{border-left-color:${STAMP_AMBER}}.contacted .st{color:${STAMP_AMBER};border-style:dashed;border-width:3px}
.returned .card{border-left-color:${STAMP_GREEN}}.returned .st{color:${STAMP_GREEN};border-radius:50%;padding:10px 12px}
.returned dl{opacity:.6}
.disposal .card{border-left-color:${STAMP_RED}}.disposal .st{color:${STAMP_RED};border-width:4px;border-style:solid;transform:rotate(6deg)}`,
  size: FOLDER,
};

/** The office's name on label-maker tape. */
const tape: ElementDefinition = {
  render: 'template',
  props: { type: 'object', properties: {} },
  template: `<header class="tp"><span>한빛역 분실물 센터</span><span class="en">LOST &amp; FOUND</span></header>`,
  style: `.tp{height:100%;display:flex;align-items:center;gap:14px}
span{padding:6px 16px;background:#1d1d1f;color:#f2f2f2;font:800 26px ${TEXT};letter-spacing:.16em;border-radius:3px;box-shadow:inset 0 -3px 0 rgba(255,255,255,.08);transform:rotate(-1deg)}
.en{background:${STAMP_RED};font:800 20px ${TYPE};letter-spacing:.3em;transform:rotate(1.5deg)}`,
  size: { width: 1008, height: 64 },
};

/** The day's figures, typed on a memo slip — read from `m`. */
const memo: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['m'], properties: { m: { type: 'object' } } },
  template: `<section class="mm"><header><b>일일 현황</b><span>{{m.date}} · {{m.time}} 현재</span></header><dl><div><dt>오늘 접수</dt><dd>{{m.received}}</dd></div><div><dt>오늘 인계</dt><dd>{{m.returned}}</dd></div><div><dt>보관 중</dt><dd>{{m.kept}}</dd></div><div><dt>이번 주 폐기 예정</dt><dd>{{m.disposal}}</dd></div></dl><p>{{m.note}}</p></section>`,
  style: `.mm{height:100%;box-sizing:border-box;padding:18px 22px;background:#fffdf5;border-top:22px solid #f0d9d5;font-family:${TYPE};color:${INK};box-shadow:0 6px 0 -2px #e9e2cf}
header{display:flex;justify-content:space-between;align-items:baseline;border-bottom:1.5px dashed #999;padding-bottom:8px}
b{font:800 22px ${TEXT}}
span{font-size:13px}
dl{margin:12px 0 0;display:grid;gap:4px}
dl div{display:flex;justify-content:space-between;align-items:baseline;font-size:16px;border-bottom:1px dotted #bbb;padding:3px 0}
dd{margin:0;font:800 24px ${TYPE}}
p{margin:10px 0 0;font-size:13px;color:#555}`,
  size: { width: 470, height: 300 },
};

/** The claims waiting at the counter, typed in a ledger — read from `items`. */
const queue: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { time: { type: 'string' }, who: { type: 'string' }, item: { type: 'string' }, state: { type: 'string' }, word: { type: 'string' } } } } },
  },
  template: `<section class="qu"><h2>창구 인계 대기</h2><ol>{{#items}}<li class="{{state}}"><time>{{time}}</time><span>{{who}}</span><span>{{item}}</span><b>{{word}}</b></li>{{/items}}</ol></section>`,
  style: `.qu{height:100%;box-sizing:border-box;padding:12px 20px;background:${CARD};border:1.5px solid #c9c2ae;font-family:${TYPE};color:${INK};display:grid;grid-template-columns:150px 1fr;gap:16px;align-items:start}
h2{margin:4px 0 0;font:800 18px ${TEXT};border-right:2px solid ${MARGIN_RED};height:100%}
ol{margin:0;padding:0;list-style:none;display:grid;grid-template-columns:1fr 1fr;column-gap:24px;row-gap:2px}
li{display:grid;grid-template-columns:52px 70px 1fr auto;gap:8px;align-items:baseline;font-size:13px;line-height:26px;border-bottom:1px solid ${RULE}}
time{color:#6b6f78}
b{font:700 12px ${TEXT};padding:0 8px;border-radius:3px;border:1.5px solid currentColor;line-height:20px}
.waiting b{color:${STAMP_AMBER}}
.checking b{color:${STAMP_BLUE}}
.ready b{color:${STAMP_GREEN}}`,
  size: { width: 1008, height: 158 },
};

/** What each stamp means. */
const legend: ElementDefinition = {
  render: 'template',
  props: { type: 'object', properties: {} },
  template: `<section class="lg"><h2>도장</h2><ul><li class="kept"><b>보관</b>등록해 보관함에 둠</li><li class="contacted"><b>연락</b>주인에게 연락함 — 점선</li><li class="returned"><b>인계</b>주인에게 돌려줌 — 둥근 도장</li><li class="disposal"><b>폐기</b>보관 기한이 다가옴 — 굵은 도장</li></ul></section>`,
  style: `.lg{height:100%;box-sizing:border-box;padding:14px 20px;background:#fffdf5;font-family:${TEXT};color:${INK}}
h2{margin:0 0 8px;font-size:16px}
ul{margin:0;padding:0;list-style:none;display:grid;gap:8px}
li{display:flex;align-items:center;gap:12px;font-size:13px}
b{display:inline-block;min-width:44px;text-align:center;padding:2px 6px;border:3px double currentColor;border-radius:5px;font-size:13px;letter-spacing:.1em;transform:rotate(-6deg)}
.kept b{color:${STAMP_BLUE}}.contacted b{color:${STAMP_AMBER};border-style:dashed}.returned b{color:${STAMP_GREEN};border-radius:50%}.disposal b{color:${STAMP_RED};border:4px solid}`,
  size: { width: 470, height: 300 },
};

// ── The board ──────────────────────────────────────────────────────────────────────────────────────────────────

const node = (id: string, x: number, y: number, width: number, height: number, widget: Widget): Node => ({ id, x, y, width, height, anchored: false, widget });

const nodes: Node[] = [
  node('tape', 40, 34, 1008, 64, { type: 'element:tape', props: {} }),
  ...CASES.map((id, i) => {
    const { x, y } = folderAt(i);
    return node(`case-${id}`, x, y, FOLDER.width, FOLDER.height, { type: 'element:folder', props: { f: {} }, bindings: { f: bind('/desk/cases', `/value/${id}`) } });
  }),
  node('queue', 40, 812, 1008, 158, { type: 'element:queue', props: { items: [] }, bindings: { items: bind('/desk/queue', '/value') } }),
  node('memo', 1090, 40, 470, 300, { type: 'element:memo', props: { m: {} }, bindings: { m: bind('/desk/today', '/value') } }),
  node('kept', 1100, 372, 450, 274, {
    type: 'chart.bar',
    props: { title: '보관 중 — 종류별 (건)', data: [], mapping: { x: 'kind', y: 'count' }, options: { series: [{ label: '보관 중', color: STAMP_BLUE }] } },
    bindings: { data: bind('/desk/kinds', '/value') },
  }),
  node('legend', 1090, 670, 470, 300, { type: 'element:legend', props: {} }),
];

const document: CanvasView = {
  kind: 'canvas',
  appearance: 'light',
  accent: STAMP_RED,
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes,
  connectors: [],
  elements: { folder, tape, memo, queue, legend },
};

export const lostFoundDossier: SamplePack = {
  id: 'lost-found-dossier',
  title: { ko: '역 분실물 센터 — 타자기 사건 서류철', en: 'A station’s lost and found — typed case files' },
  field: { ko: '대중교통·분실물', en: 'Transit lost and found' },
  kind: { ko: '사건 서류철·창구 대기', en: 'Case files and the counter' },
  domain: 'transport',
  styles: ['print'],
  summary: {
    ko: '철도역 분실물 센터를 책상 위 타자기 서류철로 — 마닐라 폴더마다 탭에 사건 번호, 안에 타자로 친 색인 카드(품목·습득 장소·일시·특징), 그리고 카드에 찍힌 고무도장: 보관(파란 겹선), 연락(주황 점선), 인계(초록 둥근 도장, 카드는 흐리게), 폐기 예정(빨간 굵은 도장) — 도장 글자와 모양, 폴더 가장자리 색이 함께 말한다. 오른쪽에 라벨 테이프 제목, 타자 메모의 오늘 수치, 모눈종이 위 종류별 보관 건수, 아래에 창구 인계 대기 명부. 역과 센터는 지어낸 것이라 예시 데이터입니다.',
    en: 'A railway station’s lost-and-found office as a desk of typed case files — a manila folder for each case with its number on the tab, an index card typed on a typewriter inside (what was found, where, when, what marks it), and a rubber stamp across the card: kept (a blue double ring), owner contacted (an orange dashed one), handed back (a round green stamp, the card faded), due for disposal (a heavy red one) — the stamp’s word and shape and the folder’s edge say it together. On the right a label-maker title, the day’s figures on a typed memo and what is kept by kind on graph paper; below, the claims waiting at the counter. The station and its office are made up. Example data.',
  },
  connectors: [DESK],
  document,
  snapshot,
};
