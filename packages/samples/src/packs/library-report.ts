import type { Binding, CanvasView, ElementDefinition, Node, Widget } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { svgDataUrl } from '../frame.js';
import { snapshot } from '../snapshots/library-report.js';

// A public library's month on one printed page, the sheet handed to the board of trustees and pinned by the front
// desk: what the month came to in a paragraph, four figures, loans through the year, the subjects borrowed most, who
// came by age, and the programmes held. The print style: an A4 page, a serif masthead over a thin double rule,
// numbered sections, black ink and one muted accent, a colophon at the foot — made to read the same on paper as on
// screen. No public source carries a library's month this way, so the values are example data written for the page.

export const LIBRARY: ExampleSampleConnector = {
  key: 'library',
  name: '예시 도서관 통계 API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 도서관이 아닙니다' },
};

/** A month's report is written once, after the month closes; a day without an answer is a source that has stopped. */
const MAX_AGE_SECONDS = 24 * 60 * 60;

const bind = (path: string, valuePath: string): Binding => ({
  adapter: LIBRARY.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
});

/** A4, at the 96 dots an inch a screen draws a printed page with. */
const WIDTH = 794;
const HEIGHT = 1123;
const M = 56;
const INNER = WIDTH - M * 2;
const INK = '#1c1917';
const GREY = '#57534e';
const ACCENT = '#9a3412';
const SERIF = "'Noto Serif KR','Nanum Myeongjo',Georgia,'Times New Roman',serif";
const SANS = 'var(--u-widget-font-family)';

const SECTIONS = {
  loans: { y: 392, height: 238, title: '1. 월별 대출 권수' },
  subjects: { y: 650, height: 250, title: '2. 많이 빌린 분야' },
  ages: { y: 650, height: 250, title: '3. 연령대별 이용자' },
  programmes: { y: 920, height: 130, title: '4. 주요 프로그램' },
};
const HALF = (INNER - 32) / 2;

// ── The drawing ─────────────────────────────────────────────────────────────────────────────────────────────────

function heading(x: number, y: number, text: string, width: number): string {
  return `<text x="${x}" y="${y + 18}" fill="${INK}" font-size="15" font-weight="700" font-family="Georgia, serif">${text}</text>
<path d="M ${x} ${y + 28} H ${x + width}" stroke="${INK}" stroke-width=".8"/>`;
}

function drawing(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<rect width="${WIDTH}" height="${HEIGHT}" fill="#fffdf8"/>
<path d="M ${M} 150 H ${WIDTH - M} M ${M} 154 H ${WIDTH - M}" stroke="${INK}" stroke-width="1"/>
<rect x="${M}" y="270" width="${INNER}" height="96" fill="${ACCENT}" fill-opacity=".05"/>
<path d="M ${M} 270 H ${WIDTH - M} M ${M} 366 H ${WIDTH - M}" stroke="${ACCENT}" stroke-width=".8"/>
${heading(M, SECTIONS.loans.y, SECTIONS.loans.title, INNER)}
${heading(M, SECTIONS.subjects.y, SECTIONS.subjects.title, HALF)}
${heading(M + HALF + 32, SECTIONS.ages.y, SECTIONS.ages.title, HALF)}
<path d="M ${M + HALF + 16} ${SECTIONS.subjects.y} V ${SECTIONS.subjects.y + SECTIONS.subjects.height}" stroke="${GREY}" stroke-width=".5"/>
${heading(M, SECTIONS.programmes.y, SECTIONS.programmes.title, INNER)}
<path d="M ${M} ${HEIGHT - 66} H ${WIDTH - M}" stroke="${INK}" stroke-width=".6"/>
</svg>`;
  return svgDataUrl(svg);
}

// ── Elements ────────────────────────────────────────────────────────────────────────────────────────────────────

/** The masthead: who issues it, the report's name and number, and the month it covers. */
const masthead: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['issuer', 'title', 'period'],
    properties: { issuer: { type: 'string' }, title: { type: 'string' }, period: { type: 'string' }, issue: { type: 'string' }, published: { type: 'string' } },
  },
  template: `<header class="mast"><p class="issuer">{{issuer}}</p><h1>{{title}}</h1><p class="meta"><span>{{period}}</span><span>{{issue}} · {{published}} 발행</span></p></header>`,
  style: `.mast{height:100%;box-sizing:border-box;display:grid;align-content:end;gap:4px;color:${INK}}
.issuer{margin:0;font:600 12px/1.2 ${SANS};letter-spacing:.24em;color:${ACCENT}}
h1{margin:0;font:700 34px/1.15 ${SERIF};letter-spacing:-.01em}
.meta{margin:0;display:flex;justify-content:space-between;font:13px/1.4 ${SANS};color:${GREY}}`,
  size: { width: 682, height: 100 },
};

/** The month in one paragraph, its figures set in the sentences. */
const lead: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['visits', 'visitsChange', 'loans', 'topSubject', 'note'],
    properties: { visits: { type: 'number' }, visitsChange: { type: 'string' }, loans: { type: 'number' }, topSubject: { type: 'string' }, note: { type: 'string' } },
  },
  template: `<p class="lead">9월 한 달 동안 <b>{{visits | grouped:0}}명</b>이 도서관을 찾았습니다. 지난달보다 {{visitsChange}}. 빌려 간 책은 <b>{{loans | grouped:0}}권</b>으로, {{topSubject}} 분야가 가장 많이 나갔습니다. {{note}}</p>`,
  style: `.lead{margin:0;height:100%;box-sizing:border-box;font:15px/1.75 ${SERIF};color:${INK};word-break:keep-all}
.lead::first-letter{font-size:1.9em;font-weight:700;color:${ACCENT}}
b{font-weight:700}`,
  size: { width: 682, height: 96 },
};

/** Four figures across the band: the number, what it counts, and against last month. */
const figures: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, value: { type: 'number' }, unit: { type: 'string' }, change: { type: 'string' } } } } },
  },
  template: `<dl class="figs">{{#items}}<div><dt>{{label}}</dt><dd><b>{{value | grouped:0}}</b><span>{{unit}}</span></dd><dd class="chg">{{change}}</dd></div>{{/items}}</dl>`,
  style: `.figs{height:100%;box-sizing:border-box;margin:0;display:grid;grid-template-columns:repeat(4,1fr);align-content:center;color:${INK}}
div{padding:0 14px;border-left:1px solid rgba(28,25,23,.18)}
div:first-child{border-left:0;padding-left:0}
dt{font:12px/1.3 ${SANS};color:${GREY}}
dd{margin:2px 0 0}
b{font:700 26px/1.1 ${SERIF};font-variant-numeric:tabular-nums}
span{margin-left:3px;font:13px ${SANS};color:${GREY}}
.chg{font:12px ${SANS};color:${ACCENT};font-variant-numeric:tabular-nums}`,
  size: { width: 682, height: 80 },
};

/** The month's programmes: what, when, and how many came against the places it had. */
const programmes: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['items'],
    properties: {
      items: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, when: { type: 'string' }, came: { type: 'number' }, places: { type: 'number' } } } },
    },
  },
  template: `<table class="prog"><tbody>{{#items}}<tr><td class="name">{{name}}</td><td>{{when}}</td><td class="num">{{came}} / {{places}}명</td></tr>{{/items}}</tbody></table>`,
  style: `.prog{width:100%;border-collapse:collapse;font:13px/1.5 ${SANS};color:${INK}}
td{padding:5px 0;border-bottom:1px dotted rgba(28,25,23,.3)}
.name{font-family:${SERIF};font-size:14px}
td+td{color:${GREY};padding-left:12px}
.num{text-align:right;font-variant-numeric:tabular-nums;color:${INK}}`,
  size: { width: 682, height: 90 },
};

/** The foot of the page: where the figures come from, and the page. */
const colophon: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['source', 'page'], properties: { source: { type: 'string' }, page: { type: 'string' } } },
  template: `<footer class="foot"><span>{{source}}</span><span>{{page}}</span></footer>`,
  style: `.foot{height:100%;box-sizing:border-box;display:flex;justify-content:space-between;align-items:center;font:11px ${SANS};color:${GREY}}`,
  size: { width: 682, height: 28 },
};

// ── The board ───────────────────────────────────────────────────────────────────────────────────────────────────

const node = (id: string, x: number, y: number, width: number, height: number, widget: Widget): Node => ({ id, x, y, width, height, anchored: false, widget });

const below = (section: { y: number; height: number }) => ({ y: section.y + 38, height: section.height - 42 });

const nodes: Node[] = [
  node('masthead', M, 40, INNER, 100, {
    type: 'element:masthead',
    props: { issuer: '', title: '', period: '', issue: '', published: '' },
    bindings: { issuer: bind('/library/report', '/issuer'), title: bind('/library/report', '/title'), period: bind('/library/report', '/period'), issue: bind('/library/report', '/issue'), published: bind('/library/report', '/published') },
  }),
  node('lead', M, 168, INNER, 96, {
    type: 'element:lead',
    props: { visits: 0, visitsChange: '', loans: 0, topSubject: '', note: '' },
    bindings: {
      visits: bind('/library/report', '/visits'),
      visitsChange: bind('/library/report', '/visitsChange'),
      loans: bind('/library/report', '/loans'),
      topSubject: bind('/library/report', '/topSubject'),
      note: bind('/library/report', '/note'),
    },
  }),
  node('figures', M + 14, 278, INNER - 28, 80, { type: 'element:figures', props: { items: [] }, bindings: { items: bind('/library/figures', '/value') } }),
  node('loans', M, below(SECTIONS.loans).y, INNER, below(SECTIONS.loans).height, {
    type: 'chart.line',
    props: {
      data: [],
      mapping: { x: 'month', y: ['thisYear', 'lastYear'] },
      options: { valueAxisZero: false, series: [{ label: '올해', color: ACCENT }, { label: '지난해', color: '#a8a29e' }] },
    },
    bindings: { data: bind('/library/loans', '/value') },
  }),
  node('subjects', M, below(SECTIONS.subjects).y, HALF, below(SECTIONS.subjects).height, {
    type: 'table',
    props: {
      data: [],
      mapping: {
        columns: [
          { field: 'rank', label: '순위', align: 'right' },
          { field: 'subject', label: '분야' },
          { field: 'loans', label: '대출', format: 'number', align: 'right' },
          { field: 'share', label: '비중', align: 'right' },
        ],
      },
    },
    bindings: { data: bind('/library/subjects', '/value') },
  }),
  node('ages', M + HALF + 32, below(SECTIONS.ages).y, HALF, below(SECTIONS.ages).height, {
    type: 'chart.bar',
    props: { data: [], mapping: { x: 'age', y: 'people' }, options: { horizontal: true, series: [{ label: '이용자', color: GREY }] } },
    bindings: { data: bind('/library/ages', '/value') },
  }),
  node('programmes', M, below(SECTIONS.programmes).y, INNER, below(SECTIONS.programmes).height, {
    type: 'element:programmes',
    props: { items: [] },
    bindings: { items: bind('/library/programmes', '/value') },
  }),
  node('colophon', M, HEIGHT - 60, INNER, 28, {
    type: 'element:colophon',
    props: { source: '', page: '' },
    bindings: { source: bind('/library/report', '/source'), page: bind('/library/report', '/page') },
  }),
];

const document: CanvasView = {
  kind: 'canvas',
  appearance: 'light',
  accent: ACCENT,
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes,
  connectors: [],
  elements: { masthead, lead, figures, programmes, colophon },
};

export const libraryReport: SamplePack = {
  id: 'library-report',
  title: { ko: '도서관 월간 이용 리포트 — 인쇄 한 장', en: 'A library’s monthly report — one printed page' },
  field: { ko: '문화·공공 서비스', en: 'Culture & public services' },
  kind: { ko: '인쇄 지면(A4 한 장)', en: 'A printed page (one A4 sheet)' },
  summary: {
    ko: '운영위원회에 내고 안내데스크 옆에 붙이는 공공도서관의 한 달 — 명조 제호와 이중 괘선, 번호 붙은 절, 검은 잉크에 차분한 강조색 하나, 아래에 출처. 한 문단 요약(수치가 문장 안에), 네 가지 지표, 올해와 지난해 월별 대출, 많이 빌린 분야 표, 연령대별 이용자, 이달의 프로그램. 화면과 종이에서 같게 읽히는 지면. 예시 데이터입니다.',
    en: 'A public library’s month on one printed page, for the trustees and the notice board by the desk — a serif masthead over a double rule, numbered sections, black ink and one muted accent, the source at the foot. The month in a paragraph with its figures in the sentences, four figures, loans this year against last, the subjects borrowed most, visitors by age, and the month’s programmes. A page that reads the same on paper as on screen. Example data.',
  },
  connectors: [LIBRARY],
  document,
  snapshot,
};
