// Example data written for the sample, not recorded from a source — no public source carries one home's meters.
// Keep it consistent: it is 18:40 on a clear autumn Wednesday in a flat with panels on the balcony rail. The day has used
// a little less than yesterday by this hour; the evening peak is just starting; the panels made most of their power
// around noon, which is why the advice puts the washing in the middle of tomorrow.
import type { SampleSnapshot } from '../sample-pack.js';

const at = '2026-10-21T09:30:00Z';

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-21T09:40:00.000Z',
  responses: {
    home: {
      '/home/now': { home: '우리 집', date: '10월 21일 수요일', time: '18:40', updatedAt: at },
      '/home/today': { used: 6.2, yesterday: 7.1, change: '13% 적게', advice: '내일 맑음 — 세탁기와 건조기는 낮 12시에서 3시 사이에 돌리면 태양광으로 됩니다.', updatedAt: at },
      '/home/figures': {
        value: [
          { label: '태양광 생산', value: '2.8', unit: 'kWh' },
          { label: '가스', value: '1.4', unit: 'm³' },
          { label: '이달 예상 요금', value: '68,400', unit: '원' },
        ],
        updatedAt: at,
      },
      '/home/hours': {
        value: [
          { hour: '0시', kwh: 0.21 },
          { hour: '2시', kwh: 0.18 },
          { hour: '4시', kwh: 0.17 },
          { hour: '6시', kwh: 0.42 },
          { hour: '7시', kwh: 0.66 },
          { hour: '8시', kwh: 0.38 },
          { hour: '10시', kwh: 0.19 },
          { hour: '12시', kwh: 0.24 },
          { hour: '14시', kwh: 0.2 },
          { hour: '16시', kwh: 0.27 },
          { hour: '17시', kwh: 0.48 },
          { hour: '18시', kwh: 0.71 },
        ],
        updatedAt: at,
      },
      '/home/weather': {
        value: [
          { day: '오늘 밤', sky: '맑음', low: 9, high: 14 },
          { day: '내일', sky: '맑음', low: 7, high: 19 },
          { day: '목요일', sky: '흐리고 비', low: 11, high: 16 },
        ],
        updatedAt: at,
      },
    },
  },
};
