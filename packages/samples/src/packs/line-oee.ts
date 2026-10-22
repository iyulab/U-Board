import type { Binding, GridItem, GridView } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/line-oee.js';

// An assembly line's production at a glance, the way most plant dashboards are laid out: no drawing behind it,
// the line's OEE and its three factors on top, output against plan by the hour, the machines' states, why the
// line stood still and the work orders on it — in order, each item in the room it needs, at any screen width. No
// public source carries a line's production, so the values are example data written for the board.

export const MES: ExampleSampleConnector = {
  key: 'mes',
  name: '예시 MES API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 라인이 아닙니다' },
};

/** The MES reports every minute; five minutes without a report is a source that has stopped. */
const MAX_AGE_SECONDS = 5 * 60;

const bind = (path: string, valuePath: string, map?: Binding['map']): Binding => ({
  adapter: MES.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
  ...(map ? { map } : {}),
});

/** The hourly figures are closed on the hour, so an hour and a half without one is late. */
const bindHourly = (): Binding => ({
  adapter: MES.key,
  ref: { path: '/line/hourly', valuePath: '/value', observedAtPath: '/updatedAt', maxAgeSeconds: 90 * 60 },
});

const bindMachine = (id: string, map: Binding['map']): Binding => ({
  adapter: MES.key,
  ref: { path: '/line/machines', item: { list: '/value', where: { id } }, valuePath: '/state', observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
  map,
});

const STATE_TEXT = { values: { running: '가동', idle: '대기', down: '정지', maintenance: '점검' }, otherwise: '알 수 없음' };
const STATE_LEVEL = { values: { running: 'success', idle: 'info', down: 'error', maintenance: 'warning' }, otherwise: 'neutral' };

const MACHINES = [
  { id: 'PR-11', name: '프레스' },
  { id: 'WR-11', name: '용접 로봇' },
  { id: 'SC-11', name: '체결기' },
  { id: 'VI-11', name: '비전 검사기' },
  { id: 'PK-11', name: '포장기' },
];

/** A percentage on a dial — the four figures across the top, a quarter of the width each. */
const dial = (id: string, label: string, valuePath: string): GridItem => ({
  id,
  span: 3,
  spanMedium: 2,
  widget: {
    type: 'gauge',
    props: { data: { value: 0, max: 100 }, options: { unit: '%', subtitle: label } },
    bindings: { 'data.value': bind('/line/summary', valuePath) },
  },
});

const items: GridItem[] = [
  dial('oee', 'OEE (오늘)', '/oee'),
  dial('availability', '가동률', '/availability'),
  dial('performance', '성능률', '/performance'),
  dial('quality', '양품률', '/quality'),
  {
    id: 'hourly',
    span: 8,
    widget: {
      type: 'chart.bar',
      props: {
        title: '시간대별 생산 — 실적과 계획',
        data: [],
        mapping: { x: 'hour', y: ['output', 'target'] },
        options: {
          xFormat: { type: 'time' },
          series: [{ label: '실적' }, { label: '계획', type: 'line', lineStyle: 'dashed', symbol: 'none' }],
        },
      },
      bindings: { data: bindHourly() },
    },
  },
  {
    id: 'machines',
    span: 4,
    widget: {
      type: 'status',
      props: { title: '설비 상태', data: MACHINES.map(({ name }) => ({ label: name, value: '', level: 'neutral' })) },
      bindings: Object.fromEntries(
        MACHINES.flatMap(({ id }, i) => [
          [`data.${i}.value`, bindMachine(id, STATE_TEXT)],
          [`data.${i}.level`, bindMachine(id, STATE_LEVEL)],
        ])
      ),
    },
  },
  {
    id: 'downtime',
    span: 6,
    widget: {
      type: 'chart.bar',
      props: {
        title: '비가동 사유 (오늘, 분)',
        data: [],
        mapping: { x: 'reason', y: 'minutes' },
        options: { horizontal: true, series: [{ label: '비가동(분)' }] },
      },
      bindings: { data: bind('/line/downtime', '/value') },
    },
  },
  {
    id: 'orders',
    span: 6,
    widget: {
      type: 'table',
      props: {
        title: '작업 지시',
        data: [],
        mapping: {
          columns: [
            { field: 'order', label: '지시 번호' },
            { field: 'item', label: '품목' },
            { field: 'planned', label: '계획', format: 'number', align: 'right' },
            { field: 'done', label: '실적', format: 'number', align: 'right' },
            { field: 'due', label: '납기' },
          ],
        },
      },
      bindings: { data: bind('/line/orders', '/value') },
    },
  },
];

const document: GridView = { kind: 'grid', items };

export const lineOee: SamplePack = {
  id: 'line-oee',
  title: { ko: '조립 라인 OEE 현황', en: 'Assembly line OEE' },
  field: { ko: '제조·생산', en: 'Manufacturing & production' },
  kind: { ko: '없음 — 그리드 배치', en: 'None — grid layout' },
  domain: 'manufacturing',
  styles: ['operations'],
  summary: {
    ko: '도면 없이 순서대로 놓은 일반 대시보드 — 라인의 OEE와 세 요소, 시간대별 생산 실적과 계획, 설비 상태, 비가동 사유, 작업 지시. 화면 폭에 맞춰 줄을 바꿉니다. 예시 데이터입니다.',
    en: 'An ordinary dashboard with no drawing, laid out in order — the line’s OEE and its three factors, output against plan by the hour, the machines’ states, why the line stood still and its work orders. It rewraps to the screen’s width. Example data.',
  },
  connectors: [MES],
  document,
  snapshot,
};
