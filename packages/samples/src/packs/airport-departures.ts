import type { Binding, ElementDefinition, GridItem, GridView, Widget } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/airport-departures.js';

// An airport's departures board, the sign hung over a terminal hall and read from across it: black, amber, the
// time, flight and gate on split-flap tiles, the destination in Korean and English, and what each flight is doing
// now — boarding, delayed to a new time, gate closed, cancelled. Beside it the clock and the weather, the hour's
// departures planned against flown, the morning's punctuality, and the wait at each security checkpoint. Signage:
// few things, very large. No public source carries a terminal's board this way without registering for it, so the
// values are example data written for the board.

export const FIDS: ExampleSampleConnector = {
  key: 'fids',
  name: '예시 운항 정보 시스템(FIDS)',
  example: true,
  attribution: { text: '예시 데이터 — 실제 항공편이 아닙니다' },
};

/** The board is refreshed every thirty seconds; three minutes without a refresh is a source that has stopped. */
const MAX_AGE_SECONDS = 3 * 60;

const bind = (path: string, valuePath: string, map?: Binding['map']): Binding => ({
  adapter: FIDS.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
  ...(map ? { map } : {}),
});

const AMBER = '#fbbf24';
const MONO = "ui-monospace,'Cascadia Mono',Consolas,monospace";
/** A split-flap tile behind each character of a monospace text: dark cells a character wide, split across the
 *  middle, with a hair of gap between them. */
const FLAP = 'background:linear-gradient(180deg,transparent 0 48%,#000 48% 52%,transparent 52%),repeating-linear-gradient(90deg,#1f1f1f 0 calc(1ch - 2px),transparent calc(1ch - 2px) 1ch);padding:0 2px;border-radius:2px';

// ── Elements ────────────────────────────────────────────────────────────────────────────────────────────────────

/** The departures: one row a flight, the columns a departures board keeps. */
const departures: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['flights'],
    properties: {
      flights: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            time: { type: 'string' },
            flight: { type: 'string' },
            airline: { type: 'string' },
            dest: { type: 'string' },
            destEn: { type: 'string' },
            gate: { type: 'string' },
            status: { enum: ['scheduled', 'boarding', 'closed', 'delayed', 'cancelled', 'departed'] },
            remark: { type: 'string' },
            remarkEn: { type: 'string' },
          },
        },
      },
    },
  },
  template: `<section class="board">
  <header><b>출발 <span>DEPARTURES</span></b></header>
  <div class="rows"><table>
    <thead><tr><th>시각<i>TIME</i></th><th>편명<i>FLIGHT</i></th><th>목적지<i>DESTINATION</i></th><th>게이트<i>GATE</i></th><th>현황<i>REMARKS</i></th></tr></thead>
    <tbody>{{#flights}}<tr class="{{status}}">
      <td><span class="flap">{{time}}</span></td>
      <td><span class="flap">{{flight}}</span><small>{{airline}}</small></td>
      <td class="dest">{{dest}}<small>{{destEn}}</small></td>
      <td><span class="flap">{{gate}}</span></td>
      <td class="remark">{{remark}}<small>{{remarkEn}}</small></td>
    </tr>{{/flights}}</tbody>
  </table></div>
</section>`,
  style: `.board{container-type:inline-size;height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr;gap:10px;padding:16px 20px;border-radius:6px;background:#0a0a0a;color:${AMBER};font-family:var(--u-widget-font-family)}
header b{font-size:26px;letter-spacing:.04em;color:#fff}
header span{font-family:${MONO};font-size:15px;color:${AMBER};letter-spacing:.2em;margin-left:8px}
table{width:100%;border-collapse:collapse}
th{text-align:left;font-size:13px;font-weight:600;color:#a3a3a3;padding:0 8px 8px;border-bottom:1px solid #262626}
th i{display:block;font-style:normal;font-family:${MONO};font-size:10px;letter-spacing:.12em;color:#737373}
td{padding:6px 8px;border-bottom:1px solid #1a1a1a;vertical-align:middle;font-size:17px;white-space:nowrap}
td small{display:block;font-size:11px;color:#a3a3a3;margin-top:2px}
.flap{font-family:${MONO};font-size:20px;font-weight:700;letter-spacing:0;color:${AMBER};${FLAP}}
.dest{color:#fafafa;font-weight:600}
.remark{font-weight:700}
.boarding .remark{color:#4ade80}
.closed .remark{color:#a3a3a3}
.delayed .remark{color:#fb923c}
.cancelled .remark{color:#f87171}
.cancelled .dest,.cancelled .flap{text-decoration:line-through;text-decoration-color:#f87171}
.departed{opacity:.45}
.rows{min-width:0;overflow-x:auto;scrollbar-color:#404040 transparent}
th{white-space:nowrap}
/* On a phone: smaller tiles, the English lines and the airline left out — and what still does not fit scrolls across. */
@container (max-width: 640px){.board{padding:12px}td{padding:5px 4px;font-size:14px}th{padding:0 4px 6px}.flap{font-size:15px}td small,th i{display:none}}
@container (max-width: 360px){td{padding:4px 3px;font-size:13px}th{padding:0 3px 6px;font-size:12px}.flap{font-size:13px}header b{font-size:22px}.board{padding:10px 8px}.dest{white-space:normal;word-break:keep-all}}`,
  size: { width: 860, height: 640 },
};

/** The time, the date and the weather outside, as the hall's sign shows them. */
const clock: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['time'],
    properties: { time: { type: 'string' }, date: { type: 'string' }, temp: { type: 'number' }, sky: { type: 'string' } },
  },
  template: `<div class="clock"><b class="flap">{{time}}</b><span>{{date}}</span><em>{{sky}} · {{temp | fixed:0}}°C</em></div>`,
  style: `.clock{height:100%;box-sizing:border-box;display:grid;place-content:center;justify-items:center;gap:6px;border-radius:6px;background:#0a0a0a;color:#e5e5e5;font-family:var(--u-widget-font-family)}
.flap{font-family:${MONO};font-size:54px;line-height:1.1;color:${AMBER};${FLAP}}
span{font-size:14px;color:#a3a3a3}
em{font-style:normal;font-size:15px}`,
  size: { width: 300, height: 170 },
};

/** The wait at each security checkpoint, a bar against twenty minutes, warm past ten. */
const queues: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['checkpoints'],
    properties: {
      checkpoints: {
        type: 'array',
        items: { type: 'object', properties: { name: { type: 'string' }, minutes: { type: 'number' }, share: { type: 'number' }, level: { enum: ['short', 'long'] } } },
      },
    },
  },
  template: `<section class="queues"><header>보안검색 대기 <span>SECURITY</span></header>
  <ul>{{#checkpoints}}<li class="{{level}}" style="--s: {{share}}"><span>{{name}}</span><i><u></u></i><b>{{minutes}}분</b></li>{{/checkpoints}}</ul>
</section>`,
  style: `.queues{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr;gap:10px;padding:14px 16px;border-radius:6px;background:#0a0a0a;color:#e5e5e5;font-family:var(--u-widget-font-family)}
header{font-size:15px;font-weight:700}
header span{font-family:${MONO};font-size:11px;letter-spacing:.14em;color:#737373;margin-left:6px}
ul{margin:0;padding:0;list-style:none;display:grid;align-content:space-around;gap:6px}
li{display:grid;grid-template-columns:64px 1fr 44px;align-items:center;gap:10px;font-size:14px}
i{height:10px;border-radius:2px;background:#262626;overflow:hidden}
u{display:block;height:100%;width:calc(var(--s) * 1%);background:#4ade80}
.long u{background:#fb923c}
b{text-align:right;font-family:${MONO};color:${AMBER}}`,
  size: { width: 300, height: 220 },
};

// ── The board ───────────────────────────────────────────────────────────────────────────────────────────────────

const card = (id: string, span: number, spanMedium: number, widget: Widget, extra: Partial<Pick<GridItem, 'rowSpan' | 'height'>> = {}): GridItem => ({
  id,
  span,
  spanMedium,
  ...extra,
  widget,
});

const items: GridItem[] = [
  card(
    'departures',
    9,
    6,
    { type: 'element:departures', props: { flights: [] }, bindings: { flights: bind('/fids/departures', '/value') } },
    { rowSpan: 4, height: 716 }
  ),
  card(
    'clock',
    3,
    3,
    {
      type: 'element:clock',
      props: { time: '', date: '', temp: 0, sky: '' },
      bindings: { time: bind('/fids/now', '/time'), date: bind('/fids/now', '/date'), temp: bind('/fids/now', '/temp'), sky: bind('/fids/now', '/sky') },
    },
    { height: 150 }
  ),
  card(
    'punctuality',
    3,
    3,
    {
      type: 'metric',
      props: { data: { value: 0, label: '오전 정시 출발률', unit: '%', sparkline: [] } },
      bindings: {
        'data.value': bind('/fids/now', '/punctuality'),
        'data.sparkline': bind('/fids/now', '/punctualityByHour'),
        'data.variant': bind('/fids/now', '/punctuality', { ranges: [{ max: 85, value: 'warning' }, { min: 85, value: 'success' }] }),
      },
    },
    { height: 130 }
  ),
  card(
    'hourly',
    3,
    6,
    {
      type: 'chart.bar',
      props: {
        title: '시간대별 출발 — 계획과 실제',
        data: [],
        mapping: { x: 'hour', y: ['planned', 'flown'] },
        options: { series: [{ label: '계획', color: '#525252' }, { label: '실제', color: AMBER }] },
      },
      bindings: { data: bind('/fids/hourly', '/value') },
    },
    { height: 222 }
  ),
  card(
    'queues',
    3,
    6,
    { type: 'element:queues', props: { checkpoints: [] }, bindings: { checkpoints: bind('/fids/security', '/value') } },
    { height: 166 }
  ),
];

const document: GridView = {
  kind: 'grid',
  appearance: 'dark',
  accent: AMBER,
  elements: { departures, clock, queues },
  items,
};

export const airportDepartures: SamplePack = {
  id: 'airport-departures',
  title: { ko: '공항 출발 안내판', en: 'Airport departures board' },
  field: { ko: '항공·공항', en: 'Aviation & airports' },
  kind: { ko: '없음 — 사이니지(그리드, 다크)', en: 'None — signage (grid, dark)' },
  summary: {
    ko: '터미널 홀 건너편에서 읽는 출발 안내판 — 스플릿 플랩 칸의 시각·편명·게이트, 한·영 목적지, 탑승 중·지연·마감·결항 현황. 옆에 시계와 날씨, 오전 정시 출발률, 시간대별 계획과 실제 출발, 보안검색 대기. 큰 글자 몇 가지로 읽는 화면. 예시 데이터입니다.',
    en: 'A departures board read from across the terminal hall — time, flight and gate on split-flap tiles, the destination in Korean and English, and each flight boarding, delayed, closed or cancelled; beside it the clock and the weather, the morning’s punctuality, the hour’s departures planned against flown, and the security wait. A few things, very large. Example data.',
  },
  connectors: [FIDS],
  document,
  snapshot,
};
