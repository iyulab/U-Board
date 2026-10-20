import type { Binding, Node, Shape, CanvasView } from '@iyulab/u-board/domain';
import type { SampleConnector, SamplePack } from '../sample-pack.js';
import { escapeXml, svgDataUrl } from '../frame.js';
import { SEOUL_TIME_ZONE } from './gwanghwamun.js';
import { snapshot } from '../snapshots/seoul-subway.js';

// The next train each way at five stations around Seoul City Hall, from the city's real-time subway arrivals,
// drawn on a diagram of the two lines that cross there. The source publishes no key to try with: each user
// registers for one, and an installation creating this sample asks for it.

const WIDTH = 1000;
const HEIGHT = 680;

export const SEOUL_SUBWAY: SampleConnector = {
  key: 'seoul-subway',
  name: '서울시 지하철 실시간 도착정보',
  baseUrl: 'http://swopenapi.seoul.go.kr/api/subway/{key}',
  authType: 'path',
  ownKey: { signUpUrl: 'https://data.seoul.go.kr', env: 'SEOUL_SUBWAY_KEY' },
  // A key it does not accept, or no train to report, comes as `{ status, code, message }` at the top — its answer
  // otherwise keeps its status under `errorMessage`.
  sourceError: { path: '/code', messagePath: '/message' },
  attribution: { text: '서울특별시 서울 열린데이터광장 (공공누리 제1유형)', url: 'https://data.seoul.go.kr' },
};

/** The arrivals at one station, by the name the source gives it — the first thirty, more than the lines through
 *  any of these stations list at once. */
const arrivalsAt = (station: string) => `/json/realtimeStationArrival/0/30/${encodeURIComponent(station)}`;

/** Each arrival says when the source received it (`recptnDt`, `2026-10-20 11:44:50`); trains report every
 *  minute or so, so one older than ten minutes is the source falling behind. */
const MAX_AGE_SECONDS = 10 * 60;

/** Where a train is, by the source's arrival code (`arvlCd`): entering or at the platform, one to three stops away,
 *  or running further off. */
const ARRIVAL_LEVEL: Binding['map'] = {
  values: { '0': 'success', '1': 'success', '2': 'info', '3': 'info', '4': 'info', '5': 'info' },
  otherwise: 'neutral',
};

/** A field of the first arrival the station lists for a line (`subwayId`) one way (`updnLine`) — the next train
 *  that way, wherever it is in the list. */
const bindNext = (station: string, line: string, way: string, field: string, map?: Binding['map']): Binding => ({
  adapter: SEOUL_SUBWAY.key,
  ref: {
    path: arrivalsAt(station),
    item: { list: '/realtimeArrivalList', where: { subwayId: line, updnLine: way } },
    valuePath: `/${field}`,
    observedAtPath: '/recptnDt',
    timeZone: SEOUL_TIME_ZONE,
    maxAgeSeconds: MAX_AGE_SECONDS,
  },
  ...(map ? { map } : {}),
});

const LINE_1 = { id: '1001', name: '1호선', colour: '#0052a4' };
const LINE_2 = { id: '1002', name: '2호선', colour: '#00a84d' };

/** A station on the diagram, and the boards beside it: one per line and way, saying where that way's next train is. */
interface Station {
  /** As the source names it. */
  name: string;
  /** As the diagram labels it. */
  label: string;
  at: [number, number];
  boards: { line: typeof LINE_1; way: string; toward: string; x: number; y: number }[];
}

const BOARD = { width: 230, height: 52 };
/** At a station two lines cross, a board names its line too, and is that much wider. */
const TRANSFER_BOARD = { width: 260, height: 52 };

const STATIONS: Station[] = [
  {
    name: '종각',
    label: '종각',
    at: [480, 110],
    boards: [
      { line: LINE_1, way: '상행', toward: '종로3가', x: 500, y: 82 },
      { line: LINE_1, way: '하행', toward: '시청', x: 500, y: 140 },
    ],
  },
  {
    name: '시청',
    label: '시청',
    at: [480, 330],
    boards: [
      { line: LINE_1, way: '상행', toward: '종각', x: 200, y: 200 },
      { line: LINE_1, way: '하행', toward: '서울역', x: 200, y: 258 },
      { line: LINE_2, way: '내선', toward: '을지로입구', x: 500, y: 360 },
      { line: LINE_2, way: '외선', toward: '충정로', x: 500, y: 418 },
    ],
  },
  {
    name: '충정로',
    label: '충정로',
    at: [150, 330],
    boards: [
      { line: LINE_2, way: '내선', toward: '시청', x: 40, y: 360 },
      { line: LINE_2, way: '외선', toward: '아현', x: 40, y: 418 },
    ],
  },
  {
    name: '을지로입구',
    label: '을지로입구',
    at: [800, 330],
    boards: [
      { line: LINE_2, way: '내선', toward: '을지로3가', x: 770, y: 360 },
      { line: LINE_2, way: '외선', toward: '시청', x: 770, y: 418 },
    ],
  },
  {
    name: '서울',
    label: '서울역',
    at: [480, 590],
    boards: [
      { line: LINE_1, way: '상행', toward: '시청', x: 500, y: 548 },
      { line: LINE_1, way: '하행', toward: '남영', x: 500, y: 606 },
    ],
  },
];

const boards = (station: Station): Node[] => {
  const transfer = new Set(station.boards.map(b => b.line.id)).size > 1;
  return station.boards.map(({ line, way, toward, x, y }) => ({
    id: `next-${station.name}-${line.id}-${way}`,
    x,
    y,
    ...(transfer ? TRANSFER_BOARD : BOARD),
    anchored: true,
    widget: {
      type: 'status',
      props: { data: { label: `${transfer ? `${line.name} ` : ''}${toward} 방면`, value: '', level: 'neutral' } },
      bindings: {
        'data.value': bindNext(station.name, line.id, way, 'arvlMsg2'),
        'data.level': bindNext(station.name, line.id, way, 'arvlCd', ARRIVAL_LEVEL),
      },
    },
  }));
};

const DECORATIONS: Shape[] = [
  { id: 'title', type: 'text', x: 20, y: 18, text: '시청 일대 지하철 — 다음 열차', fontSize: 24, fill: '#17252b' },
  { id: 'note', type: 'text', x: 20, y: 50, text: '역마다 노선·방향별로 다음 열차가 있는 곳 · 초록 = 진입·도착, 파랑 = 1~3역 전', fontSize: 13, fill: '#5b6b70' },
];

function drawing(): string {
  const [jonggak, cityHall, chungjeongno, euljiro, seoulStation] = STATIONS.map(s => s.at);
  const line = (colour: string, points: [number, number][]) =>
    `<polyline points="${points.map(p => p.join(',')).join(' ')}" fill="none" stroke="${colour}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<rect width="${WIDTH}" height="${HEIGHT}" fill="#f6f8f7"/>
${line(LINE_2.colour, [[20, chungjeongno[1]], chungjeongno, cityHall, euljiro, [WIDTH - 20, euljiro[1]]])}
${line(LINE_1.colour, [[jonggak[0], 76], jonggak, cityHall, seoulStation, [seoulStation[0], HEIGHT - 12]])}
${STATIONS.map(({ at: [x, y], label, boards }) => {
  const transfer = new Set(boards.map(b => b.line.id)).size > 1;
  return `<circle cx="${x}" cy="${y}" r="${transfer ? 13 : 10}" fill="#ffffff" stroke="#17252b" stroke-width="${transfer ? 4 : 3}"/>
<text x="${x - 16}" y="${y - 16}" font-size="15" font-weight="600" fill="#17252b" text-anchor="end" font-family="sans-serif">${escapeXml(label)}</text>`;
}).join('\n')}
<text x="20" y="${HEIGHT - 16}" font-size="11" fill="#5b6b70" font-family="sans-serif">노선도 — 역 사이 거리는 실제와 다름 · 1호선 파랑, 2호선 초록</text>
</svg>`;
  return svgDataUrl(svg);
}

const document: CanvasView = {
  kind: 'canvas',
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes: STATIONS.flatMap(boards),
  connectors: [],
  decorations: DECORATIONS,
};

export const seoulSubway: SamplePack = {
  id: 'seoul-subway',
  title: { ko: '시청 일대 지하철 실시간 도착', en: 'Subway arrivals around Seoul City Hall' },
  field: { ko: '교통', en: 'Transport' },
  kind: { ko: '노선도', en: 'Line diagram' },
  summary: {
    ko: '1·2호선이 만나는 시청과 이웃한 네 역에서, 노선·방향마다 다음 열차가 있는 곳. 원천이 이용자마다 키를 발급해, 설치본에서 만들 때 발급받은 키가 필요합니다.',
    en: 'Where the next train is, each line and way, at City Hall — where lines 1 and 2 cross — and four stations beside it. The source issues each user a key, so creating it in an installation needs one.',
  },
  connectors: [SEOUL_SUBWAY],
  document,
  snapshot,
};
