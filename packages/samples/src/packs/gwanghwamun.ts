import { placeAt, type Background, type Binding, type GridItem, type GridView, type Node, type Widget } from '@iyulab/u-board/domain';
import type { SampleConnector, SamplePack } from '../sample-pack.js';
import { escapeXml, project, referencePoints, svgDataUrl, type AreaFrame } from '../frame.js';
import { snapshot } from '../snapshots/gwanghwamun.js';

// Gwanghwamun and Deoksugung as Seoul's real-time city data describes them every few minutes — a mixed board,
// the way a city's situation room lays one out: how crowded the area is and the traffic across the top, the area's
// plan in a wide cell with the public bikes docked at each station and the cars in the public car park where they
// stand, the crowd forecast beside it, the weather below. The plan is a canvas in a grid cell; the figures around it
// are the grid's cards, laid out to the screen's width. The sample key the source publishes reads this one place,
// which is enough for the board to be real.

const MAP: AreaFrame = { x: 0, y: 0, width: 680, height: 820, north: 37.5775, south: 37.563, west: 126.9692, east: 126.9844 };
/** The plan's size and what it stands for; its `src` is drawn below. */
const BACKGROUND: Background = { image: { src: '', width: MAP.width, height: MAP.height, referencePoints: referencePoints(MAP) } };

export const SEOUL_CITY_DATA: SampleConnector = {
  key: 'seoul-city-data',
  name: '서울 실시간 도시데이터',
  baseUrl: 'http://openapi.seoul.go.kr:8088/{key}',
  authType: 'path',
  authValue: 'sample',
  // An error comes as `{ RESULT: { CODE: 'ERROR-500', MESSAGE } }` at the top; a service's own answer carries its
  // status inside itself (or, for city data, under keys named `RESULT.CODE`), never at `/RESULT/CODE`.
  sourceError: { path: '/RESULT/CODE', ok: ['INFO-000'], messagePath: '/RESULT/MESSAGE' },
  attribution: { text: '서울특별시 서울 열린데이터광장 (공공누리 제1유형)', url: 'https://data.seoul.go.kr' },
};

/** The request: the city data of one place, by its name. */
export const CITY_DATA_PATH = `/json/citydata/1/5/${encodeURIComponent('광화문·덕수궁')}`;

/** The time zone the source writes its times in — `2026-10-09 19:10`, with no offset. */
export const SEOUL_TIME_ZONE = 'Asia/Seoul';

/** A part of the answer that says when it was observed: where it is, its time field there, and how old its
 *  values normally are — each part is measured on its own clock and published some minutes later. */
interface Section {
  at: string;
  time: string;
  maxAgeSeconds: number;
}

/** Estimated every five minutes, published about half an hour later. */
const PEOPLE: Section = { at: '/LIVE_PPLTN_STTS/0', time: '/PPLTN_TIME', maxAgeSeconds: 60 * 60 };
/** Updated every ten minutes or so, within minutes. */
const WEATHER: Section = { at: '/WEATHER_STTS/0', time: '/WEATHER_TIME', maxAgeSeconds: 30 * 60 };
/** Updated every five minutes, within minutes. */
const ROADS: Section = { at: '/ROAD_TRAFFIC_STTS/AVG_ROAD_DATA', time: '/ROAD_TRAFFIC_TIME', maxAgeSeconds: 20 * 60 };

/** A field of `section`, observed when the section says — the people count every few minutes, the weather and
 *  traffic on their own clocks. */
const bind = (section: Section, field: string, map?: Binding['map']): Binding => ({
  adapter: SEOUL_CITY_DATA.key,
  ref: {
    path: CITY_DATA_PATH,
    valuePath: `/CITYDATA${section.at}${field}`,
    observedAtPath: `/CITYDATA${section.at}${section.time}`,
    timeZone: SEOUL_TIME_ZONE,
    maxAgeSeconds: section.maxAgeSeconds,
  },
  ...(map ? { map } : {}),
});

/** A field of one item of a list in the answer, named by the item's id — the source lists its stations and
 *  car parks in a different order from one read to the next, so a position would name another one. */
const bindItem = (list: string, where: Record<string, string>, valuePath: string, map?: Binding['map']): Binding => ({
  adapter: SEOUL_CITY_DATA.key,
  ref: { path: CITY_DATA_PATH, item: { list: `/CITYDATA${list}`, where }, valuePath },
  ...(map ? { map } : {}),
});

/** The source's own words for each level, in the colours its site gives them. */
const CROWD_LEVEL = { values: { 여유: 'success', 보통: 'neutral', '약간 붐빔': 'warning', 붐빔: 'error' }, otherwise: 'neutral' };
const AIR_LEVEL = { values: { 좋음: 'info', 보통: 'success', 나쁨: 'warning', 매우나쁨: 'error' }, otherwise: 'neutral' };
const TRAFFIC_LEVEL = { values: { 원활: 'success', 서행: 'warning', 정체: 'error' }, otherwise: 'neutral' };
/** Bikes docked: none, a couple, or enough to take one. */
const BIKES_LEVEL = { ranges: [{ max: 1, value: 'error' }, { min: 1, max: 3, value: 'warning' }, { min: 3, value: 'success' }] };

/** Where a node goes for its anchor — its box's center — to stand at a place on the map. */
function at(node: { width: number; height: number }, lat: number, lng: number): { x: number; y: number } {
  const { x, y } = placeAt(BACKGROUND, node, { x: lng, y: lat })!;
  return { x: Math.round(x), y: Math.round(y) };
}

/** Bike stations on the drawing, by their id in the source (`SBIKE_SPOT_ID`) and where they stand. */
export const BIKE_STATIONS: { id: string; lat: number; lng: number }[] = [
  { id: 'ST-119', lat: 37.5717697, lng: 126.9746628 },
  { id: 'ST-1611', lat: 37.5698929, lng: 126.9775696 },
  { id: 'ST-121', lat: 37.5725594, lng: 126.9783325 },
  { id: 'ST-977', lat: 37.565052, lng: 126.9734039 },
  { id: 'ST-3297', lat: 37.5655785, lng: 126.9770203 },
  { id: 'ST-3090', lat: 37.5757141, lng: 126.9805069 },
];
const STATION = { width: 160, height: 52 };

function bikeStation({ id, lat, lng }: (typeof BIKE_STATIONS)[number]): Node {
  const field = (name: string, map?: Binding['map']) => bindItem('/SBIKE_STTS', { SBIKE_SPOT_ID: id }, `/${name}`, map);
  return {
    id: `bike-${id}`,
    ...at(STATION, lat, lng),
    ...STATION,
    anchored: true,
    widget: {
      type: 'status',
      props: { data: { label: '따릉이', value: '', level: 'neutral' } },
      bindings: {
        'data.label': field('SBIKE_SPOT_NM'),
        'data.value': field('SBIKE_PARKING_CNT'),
        'data.level': field('SBIKE_PARKING_CNT', BIKES_LEVEL),
      },
    },
  };
}

/** 세종로 공영주차장, where it stands. Its gauge sits beside the spot, not on it — centered there it would cover
 *  the bike station next to it — so it is placed, not anchored. */
const CAR_PARK = { lat: 37.57340269, lng: 126.97588429 };

function carPark(): Node {
  const spot = project(MAP, CAR_PARK.lat, CAR_PARK.lng);
  // 세종로 공영주차장 — the car park in the area that reports how many cars are in it. The source lists it
  // twice under one code, once without the count; `CUR_PRK_YN` picks the entry that has it.
  const field = (name: string) => bindItem('/PRK_STTS', { PRK_CD: '171721', CUR_PRK_YN: 'Y' }, `/${name}`);
  return {
    id: 'car-park',
    x: Math.round(spot.x - 170),
    y: Math.round(spot.y - 60),
    width: 150,
    height: 120,
    anchored: false,
    widget: {
      type: 'gauge',
      props: { data: { value: 0, max: 1260 }, options: { unit: '대', subtitle: '세종로 공영주차장' } },
      bindings: {
        'data.value': field('CUR_PRK_CNT'),
        'data.max': field('CPCTY'),
        'options.subtitle': field('PRK_NM'),
      },
    },
  };
}

/** A widget among the cards around the plan, in the room it takes. */
const card = (id: string, span: number, spanMedium: number, widget: Widget): GridItem => ({ id, span, spanMedium, widget });

/** Across the top: how crowded it is, and the roads. */
const TOP: GridItem[] = [
  card('crowd', 3, 3, {
    type: 'status',
    props: { data: { label: '지금 혼잡도', value: '', level: 'neutral' } },
    bindings: { 'data.value': bind(PEOPLE, '/AREA_CONGEST_LVL'), 'data.level': bind(PEOPLE, '/AREA_CONGEST_LVL', CROWD_LEVEL) },
  }),
  card('people', 3, 3, {
    type: 'metric',
    props: { data: { label: '추정 인구(최대)', value: 0, unit: '명' } },
    bindings: { 'data.value': bind(PEOPLE, '/AREA_PPLTN_MAX') },
  }),
  card('traffic', 3, 3, {
    type: 'status',
    props: { data: { label: '도로 소통', value: '', level: 'neutral' } },
    bindings: { 'data.value': bind(ROADS, '/ROAD_TRAFFIC_IDX'), 'data.level': bind(ROADS, '/ROAD_TRAFFIC_IDX', TRAFFIC_LEVEL) },
  }),
  card('speed', 3, 3, {
    type: 'metric',
    props: { data: { label: '평균 속도', value: 0, unit: 'km/h' } },
    bindings: { 'data.value': bind(ROADS, '/ROAD_TRAFFIC_SPD') },
  }),
];

/** Beside the plan: the crowd to come. */
const FORECAST: GridItem = card('forecast', 4, 6, {
  type: 'chart.line',
  props: { title: '향후 12시간 인구 예측(최대)', data: [], mapping: { x: 'FCST_TIME', y: 'FCST_PPLTN_MAX' }, options: { xFormat: { type: 'time' } } },
  bindings: { data: bind(PEOPLE, '/FCST_PPLTN') },
});

/** Below: the weather now and the day's temperature. */
const WEATHER_CARDS: GridItem[] = [
  card('temperature', 4, 2, {
    type: 'metric',
    props: { data: { label: '기온', value: 0, unit: '°C' } },
    bindings: { 'data.value': bind(WEATHER, '/TEMP') },
  }),
  card('humidity', 4, 2, {
    type: 'metric',
    props: { data: { label: '습도', value: 0, unit: '%' } },
    bindings: { 'data.value': bind(WEATHER, '/HUMIDITY') },
  }),
  card('fine-dust', 4, 2, {
    type: 'status',
    props: { data: { label: '미세먼지', value: '', level: 'neutral' } },
    bindings: { 'data.value': bind(WEATHER, '/PM10_INDEX'), 'data.level': bind(WEATHER, '/PM10_INDEX', AIR_LEVEL) },
  }),
  card('temperature-forecast', 12, 6, {
    type: 'chart.line',
    // The source writes each hour as digits (`202610092100`); the axis shows it as a date and time.
    props: { title: '24시간 기온 예보(°C)', data: [], mapping: { x: 'FCST_DT', y: 'TEMP' }, options: { xFormat: { type: 'time' } } },
    bindings: { data: bind(WEATHER, '/FCST24HOURS') },
  }),
];

/** The drawing under the map: the main roads, the stream, the palaces and the square, as a site plan. */
function drawing(): string {
  const p = (lat: number, lng: number) => {
    const { x, y } = project(MAP, lat, lng);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  };
  const line = (points: [number, number][]) => points.map(([lat, lng]) => p(lat, lng)).join(' ');
  const box = (north: number, west: number, south: number, east: number) => {
    const a = project(MAP, north, west);
    const b = project(MAP, south, east);
    return `x="${a.x.toFixed(1)}" y="${a.y.toFixed(1)}" width="${(b.x - a.x).toFixed(1)}" height="${(b.y - a.y).toFixed(1)}"`;
  };
  const label = (lat: number, lng: number, text: string, size = 12, fill = '#5b6b70') => {
    const { x, y } = project(MAP, lat, lng);
    return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="${size}" fill="${fill}" text-anchor="middle" font-family="sans-serif">${escapeXml(text)}</text>`;
  };
  const station = (lat: number, lng: number, name: string) => {
    const { x, y } = project(MAP, lat, lng);
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6" fill="#ffffff" stroke="#2f6f9f" stroke-width="2.5"/>` +
      `<text x="${(x + 10).toFixed(1)}" y="${(y + 4).toFixed(1)}" font-size="11" fill="#2f6f9f" font-family="sans-serif">${escapeXml(name)}</text>`;
  };
  const roads: [number, number][][] = [
    [[37.576, 126.9692], [37.576, 126.9844]], // 율곡로·사직로
    [[37.576, 126.9768], [37.5665, 126.9773], [37.563, 126.9757]], // 세종대로
    [[37.5704, 126.9692], [37.5704, 126.9768]], // 새문안로
    [[37.5703, 126.9772], [37.5703, 126.9844]], // 종로
    [[37.5661, 126.9778], [37.5661, 126.9844]], // 을지로
  ];
  const scale = (200 / 1610) * MAP.height; // 200 m
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${MAP.width}" height="${MAP.height}" viewBox="0 0 ${MAP.width} ${MAP.height}">
<rect width="${MAP.width}" height="${MAP.height}" fill="#eef2f0"/>
<rect ${box(37.5775, 126.974, 37.5763, 126.98)} fill="#e3e8d8"/>
<rect ${box(37.5668, 126.9732, 37.5648, 126.976)} rx="4" fill="#e3e8d8"/>
<rect ${box(37.5755, 126.9763, 37.5715, 126.9772)} rx="3" fill="#cfe3c7"/>
<ellipse cx="${project(MAP, 37.5655, 126.9781).x.toFixed(1)}" cy="${project(MAP, 37.5655, 126.9781).y.toFixed(1)}" rx="20" ry="16" fill="#cfe3c7"/>
${roads.map(r => `<polyline points="${line(r)}" fill="none" stroke="#c9d2cf" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/><polyline points="${line(r)}" fill="none" stroke="#ffffff" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>`).join('\n')}
<polyline points="${line([[37.5693, 126.9779], [37.5691, 126.981], [37.569, 126.9844]])}" fill="none" stroke="#9ccbe8" stroke-width="6" stroke-linecap="round"/>
${label(37.5769, 126.977, '경복궁', 14, '#4b5a3f')}
${label(37.5763, 126.9777, '광화문')}
${label(37.5737, 126.9779, '광화문광장', 12, '#4b6b3f')}
${label(37.5726, 126.9752, '세종문화회관')}
${label(37.5711, 126.979, '교보빌딩')}
${label(37.5697, 126.9805, '청계천', 12, '#2f7fa8')}
${label(37.5668, 126.9789, '서울시청')}
${label(37.5657, 126.9746, '덕수궁', 14, '#4b5a3f')}
${label(37.5735, 126.9792, '종로구청')}
${label(37.5763, 126.9715, '사직로')}
${label(37.5708, 126.9714, '새문안로')}
${label(37.5707, 126.9828, '종로')}
${label(37.5665, 126.9828, '을지로')}
${label(37.5683, 126.9764, '세종대로')}
${station(37.5715, 126.9772, '광화문역')}
${station(37.5657, 126.9771, '시청역')}
${station(37.5758, 126.9735, '경복궁역')}
<g font-family="sans-serif" font-size="11" fill="#5b6b70">
<line x1="${MAP.x + 20}" y1="${MAP.y + MAP.height - 20}" x2="${(MAP.x + 20 + scale).toFixed(1)}" y2="${MAP.y + MAP.height - 20}" stroke="#5b6b70" stroke-width="2"/>
<text x="${MAP.x + 20}" y="${MAP.y + MAP.height - 28}">200 m</text>
<text x="${MAP.x + MAP.width - 20}" y="${MAP.y + MAP.height - 16}" text-anchor="end">약도 — 실제 지도가 아님 · 위가 북쪽</text>
</g>
</svg>`;
  return svgDataUrl(svg);
}

/** The plan, as a canvas in a wide cell — in its own proportions, so the stations read at its size — the forecast
 *  beside it. */
const PLAN: GridItem = {
  id: 'plan',
  span: 8,
  spanMedium: 6,
  canvas: {
    background: { image: { ...BACKGROUND.image!, src: drawing() } },
    nodes: [...BIKE_STATIONS.map(bikeStation), carPark()],
    connectors: [],
  },
};

const document: GridView = { kind: 'grid', items: [...TOP, PLAN, FORECAST, ...WEATHER_CARDS] };

export const gwanghwamun: SamplePack = {
  id: 'gwanghwamun',
  title: { ko: '광화문·덕수궁 실시간', en: 'Gwanghwamun, live' },
  field: { ko: '도시·인파', en: 'City & crowds' },
  kind: { ko: '지역 약도 + 카드(혼합)', en: 'Area plan among cards (mixed)' },
  summary: {
    ko: '도시 상황판처럼 — 위에 혼잡도와 도로 소통, 가운데 지역 약도에 대여소마다 남은 따릉이와 공영주차장의 주차 대수를 서 있는 자리에, 옆에 인구 예측, 아래 날씨. 약도는 그리드 칸 안의 캔버스입니다.',
    en: 'Laid out like a city’s situation room — the crowd and the roads across the top; the area’s plan in the middle, the bikes left at each station and the cars in the public car park where they stand; the crowd forecast beside it; the weather below. The plan is a canvas in a grid cell.',
  },
  connectors: [SEOUL_CITY_DATA],
  document,
  snapshot,
};
