import type { Binding, CanvasView, ElementDefinition, Node, Shape } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { escapeXml, svgDataUrl } from '../frame.js';
import { snapshot } from '../snapshots/building-floor.js';

// One floor of an office building drawn from above, each zone painted by its air: quiet while the temperature is within
// the comfort range (20–26 °C), blue below it, amber above, red past 28 °C — with the power the zone draws and its CO₂,
// marked past 1,000 ppm (the indoor air standard most building codes hold offices to). Beside it the building: today's
// energy per floor, the demand now against the contracted peak, the air outside. No public source carries a building's
// zones, so the values are example data written for the board.

const WIDTH = 1280;
const HEIGHT = 800;

export const BEMS: ExampleSampleConnector = {
  key: 'bems',
  name: '예시 BEMS API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 건물이 아닙니다' },
};

/** The meters and sensors report every five minutes; fifteen without one is a source that has stopped. */
const MAX_AGE_SECONDS = 15 * 60;

const bindZone = (id: string, field: string, map?: Binding['map']): Binding => ({
  adapter: BEMS.key,
  ref: { path: '/floor/3/zones', item: { list: '/value', where: { id } }, valuePath: `/${field}`, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
  ...(map ? { map } : {}),
});

const bindBuilding = (valuePath: string): Binding => ({
  adapter: BEMS.key,
  ref: { path: '/building/summary', valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
});

/** Comfort: 20–26 °C quiet; below, above, and past 28 °C each a colour. */
const TEMPERATURE_BAND = { ranges: [{ min: 28, value: 'hot' }, { min: 26, value: 'warm' }, { min: 20, value: 'ok' }], otherwise: 'cold' };
/** CO₂ past 1,000 ppm — the room needs more outside air. */
const AIR_BAND = { ranges: [{ min: 1000, value: 'stuffy' }], otherwise: 'fresh' };

const zone: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['name', 'temp', 'band', 'kw', 'co2', 'air'],
    properties: {
      name: { type: 'string' },
      temp: { type: 'number', description: 'Air temperature, °C.' },
      band: { enum: ['cold', 'ok', 'warm', 'hot'] },
      kw: { type: 'number', minimum: 0, description: 'Power the zone draws, kW.' },
      co2: { type: 'number', minimum: 0, description: 'CO₂, ppm.' },
      air: { enum: ['fresh', 'stuffy'] },
    },
  },
  template: `<div class="zone {{band}} {{air}}" role="img" aria-label="{{name}} {{temp}}°C, {{kw}} kW, CO₂ {{co2}} ppm">
  <b>{{name}}</b>
  <span class="t">{{temp | fixed:1}}<small>°C</small></span>
  <span class="m">{{kw | fixed:1}} kW · <span class="co2">CO₂ {{co2}} ppm</span></span>
</div>`,
  style: `.zone{box-sizing:border-box;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;
padding:6px;border:2px solid var(--c);border-radius:6px;background:color-mix(in srgb, var(--c) 14%, transparent);
font-family:var(--u-widget-font-family);color:var(--u-widget-text);--c:var(--u-widget-border)}
b{font-size:13px;font-weight:600;color:var(--u-widget-text-secondary)}
.t{font-size:24px;font-weight:600;font-variant-numeric:tabular-nums}
.t small{font-size:12px;font-weight:500;color:var(--u-widget-text-secondary)}
.m{font-size:12px;color:var(--u-widget-text-secondary);font-variant-numeric:tabular-nums}
.cold{--c:var(--u-widget-primary)}
.warm{--c:var(--u-widget-warning)}
.hot{--c:var(--u-widget-negative)}
.cold .t,.warm .t,.hot .t{color:var(--c)}
.stuffy .co2{color:var(--u-widget-negative);font-weight:600}`,
  size: { width: 200, height: 160 },
};

/** The zones of the third floor, laid out around the core (lifts, stairs, toilets) in the middle. */
const ZONES = [
  { id: 'open-a', name: '오픈 오피스 A', x: 52, y: 100, width: 420, height: 230 },
  { id: 'open-b', name: '오픈 오피스 B', x: 484, y: 100, width: 444, height: 230 },
  { id: 'meet-1', name: '회의실 1', x: 52, y: 342, width: 200, height: 176 },
  { id: 'it', name: '전산실', x: 576, y: 342, width: 160, height: 176 },
  { id: 'meet-2', name: '회의실 2', x: 748, y: 342, width: 180, height: 176 },
  { id: 'lounge', name: '라운지', x: 52, y: 530, width: 300, height: 218 },
  { id: 'open-c', name: '오픈 오피스 C', x: 364, y: 530, width: 564, height: 218 },
];
const CORE = { x: 264, y: 342, width: 300, height: 176 };

function zoneNode({ id, name, x, y, width, height }: (typeof ZONES)[number]): Node {
  return {
    id: `zone-${id}`,
    x,
    y,
    width,
    height,
    anchored: true,
    widget: {
      type: 'element:zone',
      props: { name, temp: 0, band: 'ok', kw: 0, co2: 0, air: 'fresh' },
      bindings: {
        temp: bindZone(id, 'tempC'),
        band: bindZone(id, 'tempC', TEMPERATURE_BAND),
        kw: bindZone(id, 'kw'),
        co2: bindZone(id, 'co2Ppm'),
        air: bindZone(id, 'co2Ppm', AIR_BAND),
      },
    },
  };
}

const SIDE_X = 980;
const SIDE: Node[] = [
  {
    id: 'demand',
    x: SIDE_X,
    y: 100,
    width: 270,
    height: 150,
    anchored: false,
    widget: {
      type: 'gauge',
      props: {
        data: { value: 0 },
        options: { min: 0, max: 600, unit: 'kW', subtitle: '지금 수요 전력', thresholds: [{ to: 480, color: 'green' }, { to: 560, color: 'yellow' }, { to: 600, color: 'red' }] },
      },
      bindings: { 'data.value': bindBuilding('/demandKw') },
    },
  },
  {
    id: 'today',
    x: SIDE_X,
    y: 270,
    width: 130,
    height: 76,
    anchored: false,
    widget: { type: 'metric', props: { data: { label: '오늘 사용량', value: 0, unit: 'kWh' } }, bindings: { 'data.value': bindBuilding('/todayKwh') } },
  },
  {
    id: 'outdoor',
    x: SIDE_X + 140,
    y: 270,
    width: 130,
    height: 76,
    anchored: false,
    widget: { type: 'metric', props: { data: { label: '외기 온도', value: 0, unit: '°C' } }, bindings: { 'data.value': bindBuilding('/outdoorC') } },
  },
  {
    id: 'floors',
    x: SIDE_X,
    y: 366,
    width: 270,
    height: 300,
    anchored: false,
    widget: {
      type: 'chart.bar',
      props: {
        title: '층별 오늘 사용량 (kWh)',
        data: [],
        mapping: { x: 'floor', y: 'kWh' },
        options: { horizontal: true, series: [{ label: '사용량', color: '#4a555b' }] },
      },
      bindings: { data: { adapter: BEMS.key, ref: { path: '/building/floors', valuePath: '/value', observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS } } },
    },
  },
];

const DECORATIONS: Shape[] = [
  { id: 'title', type: 'text', x: 24, y: 22, text: '3층 구역 에너지·환경', fontSize: 24, fill: '#17252b' },
  { id: 'note', type: 'text', x: 24, y: 56, text: '구역마다 실내 온도(쾌적 20~26 °C 밖이면 색)·전력·CO₂(1,000 ppm 넘으면 표시) · 예시 데이터', fontSize: 13, fill: '#5b6b70' },
  { id: 'side-title', type: 'text', x: SIDE_X, y: 72, text: '건물 전체 · 계약 전력 600 kW', fontSize: 15, fill: '#22313b' },
];

/** The floor drawn plainly: the outer wall with its windows, the zones' partitions, the core with its lifts, stairs and
 *  toilets, and the doors. */
function drawing(): string {
  const floor = { x: 40, y: 88, width: 900, height: 672 };
  const windows: string[] = [];
  for (let x = floor.x + 30; x < floor.x + floor.width - 40; x += 70) {
    windows.push(`<path d="M ${x} ${floor.y} h 40"/>`, `<path d="M ${x} ${floor.y + floor.height} h 40"/>`);
  }
  const partitions = ZONES.map(z => `<rect x="${z.x - 6}" y="${z.y - 6}" width="${z.width + 12}" height="${z.height + 12}" fill="none" stroke="#c7d0d4" stroke-width="2"/>`).join('\n');
  const core = `<rect x="${CORE.x}" y="${CORE.y}" width="${CORE.width}" height="${CORE.height}" rx="4" fill="#e3e8eb" stroke="#b5c0c6"/>
<rect x="${CORE.x + 16}" y="${CORE.y + 20}" width="56" height="56" fill="#d3dade" stroke="#a9b5bc"/>
<rect x="${CORE.x + 80}" y="${CORE.y + 20}" width="56" height="56" fill="#d3dade" stroke="#a9b5bc"/>
<text x="${CORE.x + 76}" y="${CORE.y + 96}" font-size="11" fill="#5b6b70" text-anchor="middle" font-family="sans-serif">${escapeXml('승강기')}</text>
<g stroke="#a9b5bc">${Array.from({ length: 7 }, (_, i) => `<path d="M ${CORE.x + 160} ${CORE.y + 20 + i * 9} h 52"/>`).join('')}</g>
<text x="${CORE.x + 186}" y="${CORE.y + 96}" font-size="11" fill="#5b6b70" text-anchor="middle" font-family="sans-serif">${escapeXml('계단')}</text>
<rect x="${CORE.x + 224}" y="${CORE.y + 20}" width="60" height="136" fill="#dde3e6" stroke="#a9b5bc"/>
<text x="${CORE.x + 254}" y="${CORE.y + 92}" font-size="11" fill="#5b6b70" text-anchor="middle" font-family="sans-serif">${escapeXml('화장실')}</text>
<text x="${CORE.x + 100}" y="${CORE.y + 146}" font-size="12" fill="#5b6b70" text-anchor="middle" font-family="sans-serif">${escapeXml('코어')}</text>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<rect width="${WIDTH}" height="${HEIGHT}" fill="#f4f6f7"/>
<rect x="${floor.x}" y="${floor.y}" width="${floor.width}" height="${floor.height}" fill="#fbfcfc"/>
${partitions}
${core}
<rect x="${floor.x}" y="${floor.y}" width="${floor.width}" height="${floor.height}" fill="none" stroke="#7f939e" stroke-width="5"/>
<g stroke="#9cc3dc" stroke-width="5">${windows.join('')}</g>
<rect x="${SIDE_X - 16}" y="60" width="${WIDTH - SIDE_X}" height="${HEIGHT - 80}" rx="8" fill="#ffffff" stroke="#d6dedb"/>
<text x="40" y="${HEIGHT - 12}" font-size="11" fill="#5b6b70" font-family="sans-serif">${escapeXml('약도 — 예시 건물 3층, 실제 배치와 다름 · 창은 남북 두 면')}</text>
</svg>`;
  return svgDataUrl(svg);
}

const document: CanvasView = {
  kind: 'canvas',
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes: [...ZONES.map(zoneNode), ...SIDE],
  connectors: [],
  decorations: DECORATIONS,
  elements: { zone },
};

export const buildingFloor: SamplePack = {
  id: 'building-floor',
  title: { ko: '건물 층별 에너지·환경', en: 'Building floor energy and air' },
  field: { ko: '건물·에너지', en: 'Buildings & energy' },
  kind: { ko: '층 평면도', en: 'Floor plan' },
  summary: {
    ko: '사무동 3층의 구역마다 실내 온도(쾌적 20~26 °C 밖이면 구역째 색)와 전력·CO₂(1,000 ppm 넘으면 표시)를 구역이 선 자리에, 옆에는 지금 수요 전력과 계약 전력, 오늘 사용량, 외기 온도, 층별 사용량. 예시 데이터입니다.',
    en: 'Each zone of an office floor painted by its air where it lies — quiet within the 20–26 °C comfort range, coloured outside it — with its power and CO₂ (marked past 1,000 ppm); beside it the building’s demand against its contracted peak, today’s energy, the air outside and each floor’s use. Example data.',
  },
  connectors: [BEMS],
  document,
  snapshot,
};
