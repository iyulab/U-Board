// Example data written for the sample — the depot, its drivers and neighbourhoods are made up. Keep it consistent: it is
// 14:40 on a Thursday in late October. Each driver's step is round(done / total × 20); the tally sums the lanes
// (202 of 299 delivered) and the hourly bars sum to 202. Absences are counted from the notes (six on route 3, three
// elsewhere).
import type { SampleSnapshot } from '../sample-pack.js';

const at = '2026-10-22T05:39:00Z';

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-22T05:40:00.000Z',
  responses: {
    depot: {
      '/depot/now': { value: { date: '10월 22일 목요일', time: '14:40' }, updatedAt: at },
      '/depot/drivers': {
        value: {
          v1: { name: '1호차', area: '솔빛마을 아파트', color: '#d6453d', done: '42', total: '58', step: '14', state: 'ok', card: 'GO', word: '순조', note: '건당 평균 4분 · 부재 1건' },
          v2: { name: '2호차', area: '강변 상가거리', color: '#2f6fb3', done: '25', total: '50', step: '10', state: 'delay', card: '한 턴 쉬기', word: '지연 40분', note: '엘리베이터 점검 — 계단 배송 중' },
          v3: { name: '3호차', area: '언덕마을 주택가', color: '#8a4fbf', done: '18', total: '40', step: '9', state: 'problem', card: '문제', word: '부재 6 · 주소 2', note: '부재 6건 재방문 예약 · 주소 오류 2건 확인 중' },
          v4: { name: '4호차', area: '푸른 산업단지', color: '#3c9a5f', done: '36', total: '36', step: '20', state: 'done', card: '완주', word: '14:05 도착', note: '회수 3건 싣고 영업소로' },
          v5: { name: '5호차', area: '새솔 신도시', color: '#e07b22', done: '51', total: '70', step: '15', state: 'ok', card: 'GO', word: '순조', note: '건당 평균 3분 · 부재 2건' },
          v6: { name: '6호차', area: '역앞 오피스', color: '#1f8a8a', done: '30', total: '45', step: '13', state: 'ok', card: 'GO', word: '순조', note: '반송 2건 — 수취 거절' },
        },
        updatedAt: at,
      },
      '/depot/tally': { value: { done: '202', left: '97', absent: '9', returned: '2' }, updatedAt: at },
      '/depot/hourly': {
        value: [
          { hour: '08', done: 12 },
          { hour: '09', done: 30 },
          { hour: '10', done: 41 },
          { hour: '11', done: 38 },
          { hour: '12', done: 18 },
          { hour: '13', done: 35 },
          { hour: '14', done: 28 },
        ],
        updatedAt: at,
      },
    },
  },
};
