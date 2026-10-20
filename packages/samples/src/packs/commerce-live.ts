import type { Binding, ElementDefinition, GridItem, GridView, Widget } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/commerce-live.js';

// An online shop's live sales room, the kind put on a big screen on a sale day: bright, in the brand's colour, the
// day's revenue against its target on a ring, the four figures that move it with how they compare with yesterday,
// where shoppers drop out on the way to an order, what sells by category and by channel, today's hours against
// yesterday's, when in the week orders come, and the orders arriving now. A grid only — the opposite of a control
// room's plan — laid out in order, every widget a different way of showing a number. No public source carries a
// shop's sales, so the values are example data written for the board.

export const SHOP: ExampleSampleConnector = {
  key: 'shop',
  name: '예시 쇼핑몰 API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 쇼핑몰이 아닙니다' },
};

/** Sales are summed every minute; five minutes without a sum is a source that has stopped. */
const MAX_AGE_SECONDS = 5 * 60;

const bind = (path: string, valuePath: string, map?: Binding['map']): Binding => ({
  adapter: SHOP.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
  ...(map ? { map } : {}),
});

/** The day's revenue on a ring filling to its target — the brand colour's gradient, the number in the middle. */
const hero: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['revenue', 'target', 'progress'],
    properties: {
      revenue: { type: 'number', description: 'Revenue so far today, in millions of won.' },
      target: { type: 'number', description: "The day's target, in millions of won." },
      progress: { type: 'number', minimum: 0, maximum: 100 },
    },
  },
  template: `<section class="hero" style="--p: {{progress}}">
  <header><span class="dot"></span>LIVE · 오늘 매출</header>
  <div class="ring" role="img" aria-label="목표의 {{progress}}%">
    <div class="inner"><b>{{revenue | fixed:1}}</b><span>백만 원</span></div>
  </div>
  <footer><span>목표 {{target | grouped:0}}백만</span><b>{{progress}}%</b></footer>
</section>`,
  style: `.hero{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr auto;gap:10px;padding:18px;border-radius:16px;color:#fff;background:linear-gradient(135deg,var(--u-widget-primary),color-mix(in srgb,var(--u-widget-primary) 55%,#f43f5e));box-shadow:0 12px 32px color-mix(in srgb,var(--u-widget-primary) 35%,transparent);font-family:var(--u-widget-font-family)}
header{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;letter-spacing:.04em;opacity:.92}
.dot{width:8px;height:8px;border-radius:50%;background:#fff;box-shadow:0 0 0 4px rgb(255 255 255 / 25%)}
.ring{place-self:center;width:min(100%,190px);aspect-ratio:1;border-radius:50%;background:conic-gradient(#fff calc(var(--p) * 1%),rgb(255 255 255 / 22%) 0);display:grid;place-items:center}
.inner{width:78%;aspect-ratio:1;border-radius:50%;display:grid;place-content:center;text-align:center;background:color-mix(in srgb,var(--u-widget-primary) 82%,#1e1b4b)}
.inner b{font-size:34px;line-height:1;font-variant-numeric:tabular-nums}
.inner span{font-size:12px;opacity:.8}
footer{display:flex;justify-content:space-between;font-size:13px;opacity:.95}
footer b{font-size:15px}`,
  size: { width: 280, height: 320 },
};

/** A figure and how it compares with yesterday, up in green and down in red, on a white card with the brand's edge. */
const pulse: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['label', 'value'],
    properties: {
      label: { type: 'string' },
      value: { type: 'number' },
      unit: { type: 'string' },
      prefix: { type: 'string' },
      decimal: { type: 'boolean', description: 'Shown with one digit after the point (a rate); otherwise whole, grouped by thousands.' },
      delta: { type: 'number', description: 'Change against yesterday at this hour, percent.' },
      direction: { enum: ['up', 'down'] },
    },
  },
  template: `<div class="pulse {{direction}}">
  <span class="label">{{label}}</span>
  <b class="value">{{prefix}}{{#decimal}}{{value | grouped:1}}{{/decimal}}{{^decimal}}{{value | grouped:0}}{{/decimal}}<small>{{unit}}</small></b>
  <span class="delta"><i></i>{{delta | fixed:1}}% <em>어제 같은 시각 대비</em></span>
</div>`,
  style: `.pulse{height:100%;box-sizing:border-box;display:grid;align-content:center;gap:4px;padding:14px 16px;border-radius:14px;background:var(--u-widget-bg);border:1px solid var(--u-widget-border);border-left:4px solid var(--u-widget-primary);font-family:var(--u-widget-font-family)}
.label{font-size:13px;color:var(--u-widget-text-secondary)}
.value{font-size:30px;line-height:1.15;color:var(--u-widget-text);font-variant-numeric:tabular-nums}
.value small{font-size:14px;margin-left:3px;color:var(--u-widget-text-secondary)}
.delta{display:inline-flex;align-items:center;gap:4px;width:max-content;padding:2px 8px;border-radius:999px;font-size:12px;font-weight:600;font-variant-numeric:tabular-nums}
.delta em{font-style:normal;font-weight:400;color:var(--u-widget-text-secondary)}
.delta i{width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent}
.up .delta{color:#15803d;background:#dcfce7}
.up .delta i{border-bottom:6px solid currentColor}
.down .delta{color:#b91c1c;background:#fee2e2}
.down .delta i{border-top:6px solid currentColor}`,
  size: { width: 240, height: 140 },
};

const DIRECTION = { ranges: [{ max: 0, value: 'down' }, { min: 0, value: 'up' }] };

const pulseItem = (id: string, label: string, field: string, unit: string, extra: { prefix?: string; decimal?: boolean } = {}): GridItem => ({
  id,
  span: 4,
  spanMedium: 3,
  widget: {
    type: 'element:pulse',
    props: { label, value: 0, unit, delta: 0, direction: 'up', ...extra },
    bindings: {
      value: bind('/sales/today', `/${field}`),
      delta: bind('/sales/today', `/${field}Delta`),
      direction: bind('/sales/today', `/${field}Delta`, DIRECTION),
    },
  },
});

const card = (id: string, span: number, spanMedium: number, widget: Widget, extra: Partial<Pick<GridItem, 'rowSpan' | 'height'>> = {}): GridItem => ({
  id,
  span,
  spanMedium,
  ...extra,
  widget,
});

const items: GridItem[] = [
  {
    id: 'hero',
    span: 4,
    spanMedium: 6,
    rowSpan: 2,
    widget: {
      type: 'element:hero',
      props: { revenue: 0, target: 0, progress: 0 },
      bindings: { revenue: bind('/sales/today', '/revenue'), target: bind('/sales/today', '/target'), progress: bind('/sales/today', '/progress') },
    },
  },
  pulseItem('orders', '주문', 'orders', '건'),
  pulseItem('aov', '객단가', 'aov', '', { prefix: '₩' }),
  pulseItem('conversion', '구매 전환율', 'conversion', '%', { decimal: true }),
  pulseItem('visitors', '방문자', 'visitors', '명'),
  card('funnel', 4, 3, {
    type: 'chart.funnel',
    props: { title: '구매 깔때기', data: [], mapping: { label: 'stage', value: 'count' }, options: { legend: false } },
    bindings: { data: bind('/sales/funnel', '/value') },
  }),
  card('categories', 5, 3, {
    type: 'chart.treemap',
    props: { title: '카테고리별 매출(백만 원)', data: [] },
    bindings: { data: bind('/sales/categories', '/value') },
  }),
  card('channels', 3, 6, {
    type: 'chart.pie',
    props: { title: '채널', data: [], mapping: { label: 'channel', value: 'revenue' }, options: { donut: true, showLabel: true, legend: true } },
    bindings: { data: bind('/sales/channels', '/value') },
  }),
  card('hourly', 8, 6, {
    type: 'chart.line',
    props: {
      title: '시간대별 주문 — 오늘과 어제',
      data: [],
      mapping: { x: 'hour', y: ['today', 'yesterday'] },
      options: { smooth: true, series: [{ label: '오늘' }, { label: '어제', lineStyle: 'dashed', symbol: 'none', color: '#94a3b8' }] },
    },
    bindings: { data: bind('/sales/hourly', '/value') },
  }),
  card(
    'live-orders',
    4,
    6,
    {
      type: 'list',
      props: { title: '방금 들어온 주문', data: [], mapping: { primary: 'item', secondary: 'who', trailing: 'amount', badge: 'badge' } },
      bindings: { data: bind('/sales/orders', '/value') },
    },
    { rowSpan: 2 }
  ),
  card('heat', 8, 6, {
    type: 'chart.heatmap',
    props: { title: '요일 × 시간대 주문 (지난 4주 평균)', data: [], mapping: { x: 'slot', y: 'day', value: 'orders' }, options: { colorRange: ['#f5f3ff', '#6d28d9'] } },
    bindings: { data: bind('/sales/heat', '/value') },
  }),
];

const document: GridView = {
  kind: 'grid',
  accent: '#7c3aed',
  elements: { hero, pulse },
  items,
};

export const commerceLive: SamplePack = {
  id: 'commerce-live',
  title: { ko: '쇼핑몰 라이브 매출 워룸', en: 'Online shop live sales room' },
  field: { ko: '유통·이커머스', en: 'Retail & e-commerce' },
  kind: { ko: '없음 — 그리드(브랜드 컬러)', en: 'None — grid (brand colour)' },
  summary: {
    ko: '세일 날 큰 화면에 띄우는 밝은 워룸 — 목표 대비 오늘 매출 링, 어제와 견준 주문·객단가·전환율·방문자, 구매 깔때기, 카테고리 트리맵, 채널 도넛, 오늘과 어제의 시간대 곡선, 요일×시간 히트맵, 방금 들어온 주문. 예시 데이터입니다.',
    en: 'A bright war room for the big screen on a sale day — today’s revenue on a ring against its target; orders, basket size, conversion and visitors against yesterday; the purchase funnel; categories as a treemap; channels as a donut; today’s hours over yesterday’s; a weekday × hour heatmap; the orders arriving now. Example data.',
  },
  connectors: [SHOP],
  document,
  snapshot,
};
