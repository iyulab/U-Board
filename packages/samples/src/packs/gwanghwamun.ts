import type { Binding, Node, Shape, ViewDocument } from '@iyulab/u-board/domain';
import type { SampleConnector, SamplePack } from '../sample-pack.js';
import { escapeXml, project, svgDataUrl, type AreaFrame } from '../frame.js';
import { snapshot } from '../snapshots/gwanghwamun.js';

// Gwanghwamun and Deoksugung as Seoul's real-time city data describes them every few minutes: how crowded
// the area is and will be, the weather, the traffic — and, placed where they stand, the public bikes
// docked at each station and the cars in the public car park. The sample key the source publishes reads
// this one place, which is enough for the board to be real.

const WIDTH = 1240;
const HEIGHT = 920;
const MAP: AreaFrame = { x: 20, y: 70, width: 680, height: 820, north: 37.5775, south: 37.563, west: 126.9692, east: 126.9844 };

export const SEOUL_CITY_DATA: SampleConnector = {
  key: 'seoul-city-data',
  name: '서울 실시간 도시데이터',
  baseUrl: 'http://openapi.seoul.go.kr:8088/{key}',
  authType: 'path',
  authValue: 'sample',
  attribution: { text: '서울특별시 서울 열린데이터광장 (공공누리 제1유형)', url: 'https://data.seoul.go.kr' },
};

/** The request: the city data of one place, by its name. */
export const CITY_DATA_PATH = `/json/citydata/1/5/${encodeURIComponent('광화문·덕수궁')}`;

const bind = (valuePath: string, map?: Binding['map']): Binding => ({
  adapter: SEOUL_CITY_DATA.key,
  ref: { path: CITY_DATA_PATH, valuePath: `/CITYDATA${valuePath}` },
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

/** Bike stations on the drawing, by their id in the source (`SBIKE_SPOT_ID`) and where they stand. */
const BIKE_STATIONS: { id: string; lat: number; lng: number }[] = [
  { id: 'ST-119', lat: 37.5717697, lng: 126.9746628 },
  { id: 'ST-1611', lat: 37.5698929, lng: 126.9775696 },
  { id: 'ST-121', lat: 37.5725594, lng: 126.9783325 },
  { id: 'ST-977', lat: 37.565052, lng: 126.9734039 },
  { id: 'ST-3297', lat: 37.5655785, lng: 126.9770203 },
  { id: 'ST-3090', lat: 37.5757141, lng: 126.9805069 },
];
const STATION = { width: 160, height: 52 };

function bikeStation({ id, lat, lng }: (typeof BIKE_STATIONS)[number]): Node {
  const at = project(MAP, lat, lng);
  const field = (name: string, map?: Binding['map']) => bindItem('/SBIKE_STTS', { SBIKE_SPOT_ID: id }, `/${name}`, map);
  return {
    id: `bike-${id}`,
    x: Math.round(at.x - STATION.width / 2),
    y: Math.round(at.y - STATION.height / 2),
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

function carPark(): Node {
  const at = project(MAP, 37.57340269, 126.97588429);
  // 세종로 공영주차장 — the car park in the area that reports how many cars are in it. The source lists it
  // twice under one code, once without the count; `CUR_PRK_YN` picks the entry that has it.
  const field = (name: string) => bindItem('/PRK_STTS', { PRK_CD: '171721', CUR_PRK_YN: 'Y' }, `/${name}`);
  return {
    id: 'car-park',
    x: Math.round(at.x - 170),
    y: Math.round(at.y - 60),
    width: 150,
    height: 120,
    anchored: true,
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

const PANEL_X = 744;

function panel(): Node[] {
  const node = (id: string, x: number, y: number, width: number, height: number, widget: Node['widget']): Node => ({
    id, x, y, width, height, anchored: false, widget,
  });
  const people = '/LIVE_PPLTN_STTS/0';
  const weather = '/WEATHER_STTS/0';
  return [
    node('crowd', PANEL_X, 104, 220, 60, {
      type: 'status',
      props: { data: { label: '지금 혼잡도', value: '', level: 'neutral' } },
      bindings: { 'data.value': bind(`${people}/AREA_CONGEST_LVL`), 'data.level': bind(`${people}/AREA_CONGEST_LVL`, CROWD_LEVEL) },
    }),
    node('people', PANEL_X + 240, 96, 220, 80, {
      type: 'metric',
      props: { data: { label: '추정 인구(최대)', value: 0, unit: '명' } },
      bindings: { 'data.value': bind(`${people}/AREA_PPLTN_MAX`) },
    }),
    node('forecast', PANEL_X, 190, 460, 210, {
      type: 'chart.line',
      props: { title: '향후 12시간 인구 예측(최대)', data: [], mapping: { x: 'FCST_TIME', y: 'FCST_PPLTN_MAX' } },
      bindings: { data: bind(`${people}/FCST_PPLTN`) },
    }),
    node('temperature', PANEL_X, 424, 140, 80, {
      type: 'metric',
      props: { data: { label: '기온', value: 0, unit: '°C' } },
      bindings: { 'data.value': bind(`${weather}/TEMP`) },
    }),
    node('humidity', PANEL_X + 160, 424, 140, 80, {
      type: 'metric',
      props: { data: { label: '습도', value: 0, unit: '%' } },
      bindings: { 'data.value': bind(`${weather}/HUMIDITY`) },
    }),
    node('fine-dust', PANEL_X + 320, 432, 140, 60, {
      type: 'status',
      props: { data: { label: '미세먼지', value: '', level: 'neutral' } },
      bindings: { 'data.value': bind(`${weather}/PM10_INDEX`), 'data.level': bind(`${weather}/PM10_INDEX`, AIR_LEVEL) },
    }),
    node('temperature-forecast', PANEL_X, 524, 460, 200, {
      type: 'chart.line',
      props: { title: '24시간 기온 예보(°C)', data: [], mapping: { x: 'FCST_DT', y: 'TEMP' } },
      bindings: { data: bind(`${weather}/FCST24HOURS`) },
    }),
    node('traffic', PANEL_X, 752, 220, 60, {
      type: 'status',
      props: { data: { label: '도로 소통', value: '', level: 'neutral' } },
      bindings: {
        'data.value': bind('/ROAD_TRAFFIC_STTS/AVG_ROAD_DATA/ROAD_TRAFFIC_IDX'),
        'data.level': bind('/ROAD_TRAFFIC_STTS/AVG_ROAD_DATA/ROAD_TRAFFIC_IDX', TRAFFIC_LEVEL),
      },
    }),
    node('speed', PANEL_X + 240, 744, 220, 80, {
      type: 'metric',
      props: { data: { label: '평균 속도', value: 0, unit: 'km/h' } },
      bindings: { 'data.value': bind('/ROAD_TRAFFIC_STTS/AVG_ROAD_DATA/ROAD_TRAFFIC_SPD') },
    }),
  ];
}

const DECORATIONS: Shape[] = [
  { id: 'title', type: 'text', x: 20, y: 18, text: '광화문·덕수궁 — 지금', fontSize: 24, fill: '#17252b' },
  { id: 'map-note', type: 'text', x: 20, y: 50, text: '따릉이 대여소의 남은 자전거와 공영주차장의 주차 대수 — 서 있는 자리에', fontSize: 13, fill: '#5b6b70' },
  { id: 'panel-title', type: 'text', x: PANEL_X, y: 74, text: '지역 전체', fontSize: 15, fill: '#17252b' },
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
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<rect width="${WIDTH}" height="${HEIGHT}" fill="#f6f8f7"/>
<rect x="${MAP.x}" y="${MAP.y}" width="${MAP.width}" height="${MAP.height}" rx="8" fill="#eef2f0" stroke="#d6dedb"/>
<rect x="${PANEL_X - 16}" y="${MAP.y - 6}" width="${WIDTH - PANEL_X}" height="${MAP.height + 6}" rx="8" fill="#ffffff" stroke="#d6dedb"/>
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

const document: ViewDocument = {
  kind: 'canvas',
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes: [...BIKE_STATIONS.map(bikeStation), carPark(), ...panel()],
  connectors: [],
  decorations: DECORATIONS,
};

export const gwanghwamun: SamplePack = {
  id: 'gwanghwamun',
  title: { ko: '광화문·덕수궁 실시간', en: 'Gwanghwamun, live' },
  field: { ko: '도시·인파', en: 'City & crowds' },
  kind: { ko: '지역 약도', en: 'Area plan' },
  summary: {
    ko: '혼잡도·인구 예측·날씨·도로 소통, 그리고 대여소마다 남은 따릉이와 공영주차장의 주차 대수를 서 있는 자리에.',
    en: 'How crowded the area is and will be, the weather and traffic — and, where they stand, the bikes left at each station and the cars in the public car park.',
  },
  connectors: [SEOUL_CITY_DATA],
  document,
  snapshot,
};
