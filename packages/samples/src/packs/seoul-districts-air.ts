import type { Binding, Node, Shape, CanvasView } from '@iyulab/u-board/domain';
import type { SampleConnector, SamplePack } from '../sample-pack.js';
import { escapeXml, svgDataUrl } from '../frame.js';
import { SEOUL_TIME_ZONE } from './gwanghwamun.js';
import { snapshot } from '../snapshots/seoul-districts-air.js';

// Fine dust in all twenty-five districts of Seoul, from the national air quality network's real-time readings: a
// tile for each district, set out roughly where it lies — north of the Han river above, south below — in the
// colour of the reading's grade. The source issues each user a key, and always says in its answer whether it
// served the request (`resultCode` "00").

const WIDTH = 1040;
const HEIGHT = 600;

export const AIR_KOREA: SampleConnector = {
  key: 'air-korea',
  name: '에어코리아 대기오염정보',
  baseUrl: 'https://apis.data.go.kr/B552584/ArpltnInforInqireSvc',
  authType: 'query',
  authParamName: 'serviceKey',
  ownKey: {
    signUpUrl: 'https://www.data.go.kr',
    env: 'DATA_GO_KR_KEY',
    hint: '공공데이터포털이 주는 두 키 가운데 일반 인증키(Decoding)를 넣습니다.',
  },
  sourceError: { path: '/response/header/resultCode', ok: ['00'], messagePath: '/response/header/resultMsg' },
  attribution: { text: '한국환경공단 에어코리아 (공공데이터포털)', url: 'https://www.airkorea.or.kr' },
};

/** Every station in Seoul — the twenty-five district stations and the roadside ones — in one answer. */
export const STATIONS_PATH = `/getCtprvnRltmMesureDnsty?returnType=json&sidoName=${encodeURIComponent('서울')}&numOfRows=100&pageNo=1&ver=1.0`;

/** Measured on the hour (`dataTime`, `2026-10-20 12:00`) and published within about half an hour, so a reading is
 *  up to two hours old before the next arrives. */
const MAX_AGE_SECONDS = 2 * 60 * 60;

/** A district station's field, by the station's name — the district's own. */
const bindStation = (name: string, field: string, map?: Binding['map']): Binding => ({
  adapter: AIR_KOREA.key,
  ref: {
    path: STATIONS_PATH,
    item: { list: '/response/body/items', where: { stationName: name } },
    valuePath: `/${field}`,
    observedAtPath: '/dataTime',
    timeZone: SEOUL_TIME_ZONE,
    maxAgeSeconds: MAX_AGE_SECONDS,
  },
  ...(map ? { map } : {}),
});

/** The grade the source gives a PM10 reading — 1 좋음, 2 보통, 3 나쁨, 4 매우나쁨 — in the colours Korea's public
 *  air sites give them. A station under maintenance has no grade, and reads `-`. */
const PM10_GRADE: Binding['map'] = { values: { '1': 'info', '2': 'success', '3': 'warning', '4': 'error' }, otherwise: 'neutral' };

/** The tile itself takes its grade's colour — a ring around it, so the map reads at a glance. */
const GRADE_STATES: Node['states'] = {
  from: 'data.level',
  map: { values: { '1': 'good', '2': 'moderate', '3': 'bad', '4': 'very-bad' } },
  looks: { good: { outline: '#2f7fd8' }, moderate: { outline: '#2ea44f' }, bad: { outline: '#e0911a' }, 'very-bad': { outline: '#d03b3b', blink: true } },
};

const TILE = { width: 128, height: 60 };
const ORIGIN = { x: 30, y: 100 };
const STEP = { x: 140, y: 80 };
/** The space the river takes between the north bank's rows and the south bank's. */
const RIVER_GAP = 24;

/** Each district at its place on a grid that keeps neighbours next to each other: rows 0–2 north of the river,
 *  3–4 south. */
const DISTRICTS: { name: string; col: number; row: number }[] = [
  { name: '은평구', col: 1, row: 0 },
  { name: '종로구', col: 2, row: 0 },
  { name: '강북구', col: 3, row: 0 },
  { name: '도봉구', col: 4, row: 0 },
  { name: '노원구', col: 5, row: 0 },
  { name: '서대문구', col: 1, row: 1 },
  { name: '중구', col: 2, row: 1 },
  { name: '성북구', col: 3, row: 1 },
  { name: '동대문구', col: 4, row: 1 },
  { name: '중랑구', col: 5, row: 1 },
  { name: '마포구', col: 1, row: 2 },
  { name: '용산구', col: 2, row: 2 },
  { name: '성동구', col: 3, row: 2 },
  { name: '광진구', col: 4, row: 2 },
  { name: '강서구', col: 0, row: 3 },
  { name: '영등포구', col: 1, row: 3 },
  { name: '동작구', col: 2, row: 3 },
  { name: '서초구', col: 3, row: 3 },
  { name: '강남구', col: 4, row: 3 },
  { name: '송파구', col: 5, row: 3 },
  { name: '강동구', col: 6, row: 3 },
  { name: '양천구', col: 0, row: 4 },
  { name: '구로구', col: 1, row: 4 },
  { name: '금천구', col: 2, row: 4 },
  { name: '관악구', col: 3, row: 4 },
];

const tileAt = (col: number, row: number) => ({
  x: ORIGIN.x + col * STEP.x,
  y: ORIGIN.y + row * STEP.y + (row >= 3 ? RIVER_GAP : 0),
});

function tile({ name, col, row }: (typeof DISTRICTS)[number]): Node {
  return {
    id: `district-${name}`,
    ...tileAt(col, row),
    ...TILE,
    anchored: true,
    widget: {
      type: 'status',
      props: { data: { label: name, value: '', level: 'neutral' } },
      bindings: {
        'data.value': bindStation(name, 'pm10Value'),
        'data.level': bindStation(name, 'pm10Grade', PM10_GRADE),
      },
    },
    states: GRADE_STATES,
  };
}

const DECORATIONS: Shape[] = [
  { id: 'title', type: 'text', x: 20, y: 18, text: '서울 25개 구 — 미세먼지', fontSize: 24, fill: '#17252b' },
  { id: 'note', type: 'text', x: 20, y: 50, text: '구마다 PM10(㎍/㎥) · 색은 에어코리아 등급(좋음·보통·나쁨·매우나쁨) · ‘-’는 점검 중', fontSize: 13, fill: '#5b6b70' },
];

function drawing(): string {
  const riverY = ORIGIN.y + 3 * STEP.y - (STEP.y - TILE.height) / 2 + RIVER_GAP / 2 - 6;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<rect width="${WIDTH}" height="${HEIGHT}" fill="#f6f8f7"/>
${DISTRICTS.map(({ col, row }) => {
  const { x, y } = tileAt(col, row);
  return `<rect x="${x}" y="${y}" width="${TILE.width}" height="${TILE.height}" rx="6" fill="#ffffff" stroke="#d6dedb"/>`;
}).join('\n')}
<path d="M 20 ${riverY + 6} C 260 ${riverY - 10}, 520 ${riverY + 22}, 760 ${riverY + 2} S 980 ${riverY - 8}, ${WIDTH - 20} ${riverY + 4}" fill="none" stroke="#9ccbe8" stroke-width="12" stroke-linecap="round"/>
<text x="${WIDTH - 70}" y="${riverY - 10}" font-size="12" fill="#2f7fa8" font-family="sans-serif">${escapeXml('한강')}</text>
<text x="20" y="${HEIGHT - 16}" font-size="11" fill="#5b6b70" font-family="sans-serif">${escapeXml('타일 지도 — 구의 크기·모양은 실제와 다름, 이웃한 구를 이웃한 칸에 · 위가 북쪽')}</text>
</svg>`;
  return svgDataUrl(svg);
}

const document: CanvasView = {
  kind: 'canvas',
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes: DISTRICTS.map(tile),
  connectors: [],
  decorations: DECORATIONS,
};

export const seoulDistrictsAir: SamplePack = {
  id: 'seoul-districts-air',
  title: { ko: '서울 25개 구 미세먼지', en: 'Fine dust in Seoul’s 25 districts' },
  field: { ko: '환경·대기', en: 'Environment & air' },
  kind: { ko: '타일 지도', en: 'Tile map' },
  domain: 'environment',
  styles: ['operations'],
  summary: {
    ko: '25개 구마다 PM10과 에어코리아 등급 색을, 이웃한 구를 이웃한 칸에 놓은 타일 지도로. 원천이 이용자마다 키를 발급해, 설치본에서 만들 때 발급받은 키가 필요합니다.',
    en: 'Each of the 25 districts’ PM10 in the colour of its grade, on a tile map that keeps neighbouring districts side by side. The source issues each user a key, so creating it in an installation needs one.',
  },
  connectors: [AIR_KOREA],
  document,
  snapshot,
};
