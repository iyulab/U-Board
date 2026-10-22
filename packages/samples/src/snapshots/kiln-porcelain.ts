// Example data written for the sample — the studio and its kilns are made up. Keep it consistent: it is 16:20 on a
// Thursday in late October. The wood kiln was lit at 06:00 and is heating toward 1,280 ℃ (its curve runs from the
// lighting to the hour now and its last measured point is its temperature); the gas kiln holds at its top, one electric
// kiln is cooling and the other waits to be loaded. The batches name the kilns as the plates do.
import type { SampleSnapshot } from '../sample-pack.js';

const at = '2026-10-22T07:19:00Z';

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-22T07:20:00.000Z',
  responses: {
    studio: {
      '/studio/now': { value: { date: '10월 22일 목요일', time: '16:20' }, updatedAt: at },
      '/studio/kilns': {
        value: {
          gas: { name: '가스가마', kind: 'GAS · 환원', temp: '1,252', target: '1,250', stage: 'soak', word: '머무는 중', progress: '86', eta: '40분 더' },
          electric1: { name: '전기가마 一', kind: 'ELECTRIC · 재벌', temp: '612', target: '실온', stage: 'cool', word: '식는 중', progress: '70', eta: '내일 08시 열기' },
          electric2: { name: '전기가마 二', kind: 'ELECTRIC · 초벌', temp: '24', target: '850', stage: 'idle', word: '쉬는 중', progress: '0', eta: '17시 재임' },
          wood: { name: '장작가마', kind: 'WOOD · 오름', temp: '1,064', target: '1,280', stage: 'heat', word: '오르는 중', progress: '62', eta: '22시 무렵' },
        },
        updatedAt: at,
      },
      '/studio/curve': {
        value: [
          { hour: '06', plan: 20, measured: 18 },
          { hour: '07', plan: 120, measured: 104 },
          { hour: '08', plan: 220, measured: 205 },
          { hour: '09', plan: 320, measured: 318 },
          { hour: '10', plan: 420, measured: 436 },
          { hour: '11', plan: 520, measured: 527 },
          { hour: '12', plan: 600, measured: 589 },
          { hour: '13', plan: 700, measured: 684 },
          { hour: '14', plan: 820, measured: 801 },
          { hour: '15', plan: 940, measured: 932 },
          { hour: '16', plan: 1060, measured: 1064 },
        ],
        updatedAt: at,
      },
      '/studio/batches': {
        value: [
          { kiln: '장작가마', what: '달항아리 3 · 찻사발 24', glaze: '재유 · 자연유', state: 'firing', word: '소성 중' },
          { kiln: '가스가마', what: '청자 접시 40', glaze: '청자유', state: 'firing', word: '소성 중' },
          { kiln: '전기가마 一', what: '머그 60 · 화병 12', glaze: '분청 · 백유', state: 'done', word: '식힘' },
          { kiln: '전기가마 二', what: '수업 작품 초벌 80', glaze: '— (초벌)', state: 'loading', word: '재임 대기' },
          { kiln: '전기가마 二', what: '타일 견본 30', glaze: '천목 · 진사', state: 'loading', word: '내일' },
        ],
        updatedAt: at,
      },
    },
  },
};
