// Example data written for the sample, not recorded from a source — no public source carries a bakery's day.
// Keep it consistent: it is 14:40 on a clear Wednesday. The wholemeal loaves and the croissants sold out after lunch, so
// oven 1 is baking twelve more loaves (out at 14:52) and two trays of croissants are proving for it next; oven 2 has the
// salt rolls five minutes from done. The loaves sold by the hour add up to the day's 312, and the café's five tables of
// four have eleven people at them.
import type { SampleSnapshot } from '../sample-pack.js';

const at = '2026-10-21T05:38:00Z';

const station = (id: string, item: string, temp: number, target: number, minutes: number, state: string, next: string) => ({
  id,
  item,
  temp,
  target,
  minutes,
  state,
  next,
  updatedAt: at,
});

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-21T05:40:00.000Z',
  responses: {
    bakery: {
      '/bakery/now': { name: '밀과 소금 베이커리', date: '10월 21일 수요일', time: '14:40', weather: '맑음 18°', updatedAt: at },
      '/bakery/stations': {
        value: [
          station('oven1', '통밀 식빵', 182, 180, 12, 'baking', '통밀 식빵 12개 · 14:52'),
          station('oven2', '소금빵', 214, 220, 5, 'baking', '소금빵 30개 · 14:45'),
          station('proofer', '크루아상 2판', 27, 27, 25, 'proofing', '오븐 1로 · 15:05'),
        ],
      },
      '/bakery/case': {
        value: [
          { name: '소금빵', left: 4, state: 'low' },
          { name: '통밀 식빵', left: 0, state: 'out' },
          { name: '크루아상', left: 0, state: 'out' },
          { name: '단팥빵', left: 9, state: 'plenty' },
          { name: '바게트', left: 6, state: 'plenty' },
          { name: '스콘', left: 11, state: 'plenty' },
        ],
        updatedAt: at,
      },
      '/bakery/cafe': { taken: 11, total: 20, updatedAt: at },
      '/bakery/today': { takings: '84.2만', againstLastWeek: '지난 수요일보다 6% 많음', loaves: '312개', soldOut: '다 팔림 — 통밀 식빵 · 크루아상', updatedAt: at },
      '/bakery/hours': {
        value: [
          { hour: '8시', bread: 22, drinks: 9 },
          { hour: '9시', bread: 41, drinks: 18 },
          { hour: '10시', bread: 38, drinks: 22 },
          { hour: '11시', bread: 46, drinks: 25 },
          { hour: '12시', bread: 64, drinks: 31 },
          { hour: '13시', bread: 58, drinks: 27 },
          { hour: '14시', bread: 43, drinks: 19 },
        ],
        updatedAt: at,
      },
      '/bakery/notes': {
        first: '크루아상 발효 끝나면 바로 오븐 1에! (15:05)',
        second: '내일 아침 우유 두 박스 더 — 사장님께 말하기',
        updatedAt: at,
      },
    },
  },
};
