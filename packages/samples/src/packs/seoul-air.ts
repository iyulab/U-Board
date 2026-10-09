import type { Binding, Node, Shape, ViewDocument } from '@iyulab/u-board/domain';
import type { SampleConnector, SamplePack } from '../sample-pack.js';
import { svgDataUrl } from '../frame.js';
import { SEOUL_CITY_DATA } from './gwanghwamun.js';
import { snapshot } from '../snapshots/seoul-air.js';

// Fine dust in five central districts of Seoul, from the city's hourly air measurements: each district's
// reading where the district lies, coloured by Korea's air quality index bands, and the five side by side.
// The sample key the source publishes reads five rows — these five.

const WIDTH = 1000;
const HEIGHT = 640;

export const SEOUL_AIR: SampleConnector = { ...SEOUL_CITY_DATA, key: 'seoul-air', name: '서울시 실시간 대기환경' };
export const AIR_PATH = '/json/RealtimeCityAir/1/5/';

const bind = (valuePath: string, map?: Binding['map']): Binding => ({
  adapter: SEOUL_AIR.key,
  ref: { path: AIR_PATH, valuePath: `/RealtimeCityAir${valuePath}` },
  ...(map ? { map } : {}),
});

/** A district's row, by the station's name (`MSRSTN_NM`) — not its place in the list, which can change. */
const bindDistrict = (name: string, field: string, map?: Binding['map']): Binding => ({
  adapter: SEOUL_AIR.key,
  ref: { path: AIR_PATH, item: { list: '/RealtimeCityAir/row', where: { MSRSTN_NM: name } }, valuePath: `/${field}` },
  ...(map ? { map } : {}),
});

/** PM10 (㎍/㎥) in the bands of Korea's air quality index — 좋음 0–30, 보통 31–80, 나쁨 81–150, 매우나쁨
 *  151 and over — in the colours its public sites give them (blue, green, yellow, red). */
const PM10_LEVEL = {
  ranges: [{ max: 31, value: 'info' }, { min: 31, max: 81, value: 'success' }, { min: 81, max: 151, value: 'warning' }, { min: 151, value: 'error' }],
};

/** Each district by the station name the source gives it, the shape drawn for it, and where its reading sits. */
const DISTRICTS: { name: string; outline: string; at: [number, number] }[] = [
  { name: '은평구', outline: '70,90 250,62 300,190 210,270 80,240', at: [175, 165] },
  { name: '서대문구', outline: '80,240 210,270 300,190 340,310 270,392 130,372', at: [215, 312] },
  { name: '종로구', outline: '300,190 250,62 470,96 572,206 480,288 340,310', at: [420, 190] },
  { name: '중구', outline: '340,310 480,288 572,206 590,312 530,392 370,402 270,392', at: [430, 345] },
  { name: '용산구', outline: '270,392 370,402 530,392 560,512 410,580 280,512', at: [415, 480] },
];
const READING = { width: 150, height: 56 };

function reading({ name, at }: (typeof DISTRICTS)[number]): Node {
  return {
    id: `district-${name}`,
    x: at[0] - READING.width / 2,
    y: at[1] - READING.height / 2,
    ...READING,
    anchored: true,
    widget: {
      type: 'status',
      props: { data: { label: name, value: '', level: 'neutral' } },
      bindings: {
        'data.value': bindDistrict(name, 'PM'),
        'data.level': bindDistrict(name, 'PM', PM10_LEVEL),
      },
    },
  };
}

const PANEL_X = 640;

const PANEL: Node[] = [
  {
    id: 'districts-chart',
    x: PANEL_X,
    y: 96,
    width: 340,
    height: 280,
    anchored: false,
    widget: {
      type: 'chart.bar',
      props: { title: '미세먼지·초미세먼지(㎍/㎥)', data: [], mapping: { x: 'MSRSTN_NM', y: ['PM', 'FPM'] } },
      bindings: { data: bind('/row') },
    },
  },
  {
    id: 'ozone',
    x: PANEL_X,
    y: 396,
    width: 160,
    height: 80,
    anchored: false,
    widget: {
      type: 'metric',
      props: { data: { label: '오존(중구)', value: 0, unit: 'ppm' } },
      bindings: { 'data.value': bindDistrict('중구', 'OZON') },
    },
  },
  {
    id: 'index-grade',
    x: PANEL_X + 180,
    y: 404,
    width: 160,
    height: 60,
    anchored: false,
    widget: {
      type: 'status',
      props: { data: { label: '대기지수(중구)', value: '', level: 'neutral' } },
      bindings: {
        'data.value': bindDistrict('중구', 'CAI_GRD'),
        'data.level': bindDistrict('중구', 'CAI_GRD', { values: { 좋음: 'info', 보통: 'success', 나쁨: 'warning', 매우나쁨: 'error' }, otherwise: 'neutral' }),
      },
    },
  },
];

const DECORATIONS: Shape[] = [
  { id: 'title', type: 'text', x: 20, y: 18, text: '서울 도심 5개 구 — 미세먼지', fontSize: 24, fill: '#17252b' },
  { id: 'note', type: 'text', x: 20, y: 50, text: '구마다 PM10(㎍/㎥) · 색은 통합대기환경지수 단계', fontSize: 13, fill: '#5b6b70' },
  { id: 'panel-title', type: 'text', x: PANEL_X, y: 72, text: '다섯 구 나란히', fontSize: 15, fill: '#17252b' },
  { id: 'bands', type: 'text', x: PANEL_X, y: 500, text: '좋음 0–30 · 보통 31–80 · 나쁨 81–150 · 매우나쁨 151~', fontSize: 12, fill: '#5b6b70' },
];

function drawing(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<rect width="${WIDTH}" height="${HEIGHT}" fill="#f6f8f7"/>
<rect x="${PANEL_X - 16}" y="60" width="${WIDTH - PANEL_X}" height="${HEIGHT - 80}" rx="8" fill="#ffffff" stroke="#d6dedb"/>
${DISTRICTS.map(({ outline }) => `<polygon points="${outline}" fill="#eef2f0" stroke="#b8c4c0" stroke-width="2" stroke-linejoin="round"/>`).join('\n')}
<path d="M 250 560 C 330 600, 470 610, 600 560" fill="none" stroke="#9ccbe8" stroke-width="10" stroke-linecap="round"/>
<text x="560" y="600" font-size="12" fill="#2f7fa8" font-family="sans-serif">한강</text>
<text x="20" y="${HEIGHT - 16}" font-size="11" fill="#5b6b70" font-family="sans-serif">약도 — 구 경계는 실제와 다름 · 위가 북쪽</text>
</svg>`;
  return svgDataUrl(svg);
}

const document: ViewDocument = {
  kind: 'canvas',
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes: [...DISTRICTS.map(reading), ...PANEL],
  connectors: [],
  decorations: DECORATIONS,
};

export const seoulAir: SamplePack = {
  id: 'seoul-air',
  title: { ko: '서울 도심 미세먼지', en: 'Fine dust in central Seoul' },
  field: { ko: '환경·대기', en: 'Environment & air' },
  kind: { ko: '구 약도', en: 'District map' },
  summary: {
    ko: '도심 5개 구의 PM10을 구가 놓인 자리에, 통합대기환경지수 단계 색으로. 오른쪽은 다섯 구를 나란히.',
    en: 'Each district’s PM10 where the district lies, in the colours of Korea’s air quality index — and the five side by side.',
  },
  connectors: [SEOUL_AIR],
  document,
  snapshot,
};
