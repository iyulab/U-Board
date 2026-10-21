// Example data written for the sample — the café, its seats and its players are made up. Keep it consistent: it is
// 21:30 on a Saturday, the busiest hour; the premium booths are full, the duo seats nearly, and a few general seats are
// free or being wiped down. Two machines are out (one with a dead monitor, one without a network). The kitchen has four
// orders on the stove and two waiting at the counter. Seats in use are counted on the hour since noon.
import type { SampleSnapshot } from '../sample-pack.js';

const at = '2026-10-24T12:30:00Z';

/** A row of seats from a code per seat: o in use, e ending within ten minutes, f free, c being cleaned, x out of order. */
const seats = (prefix: string, codes: string, width = 2) =>
  [...codes].map((code, i) => ({
    n: `${prefix}${String(i + 1).padStart(width, '0')}`,
    st: ({ o: 'on', e: 'end', f: 'free', c: 'clean', x: 'out' } as const)[code as 'o' | 'e' | 'f' | 'c' | 'x'],
  }));

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-24T12:30:20.000Z',
  responses: {
    cafe: {
      '/cafe/now': { name: '픽셀스테이션', sub: 'PC방 · 54석 · 24시간', date: '10월 24일 토요일', time: '21:30', updatedAt: at },
      '/cafe/zones': {
        value: {
          a: { name: '일반석 A', note: '17 / 20 사용', seats: seats('A', 'oooeooeoooooxooocoof') },
          b: { name: '일반석 B', note: '16 / 20 사용', seats: seats('B', 'ooooffoooeoocooooofo') },
          p: { name: '프리미엄', note: '8 / 8 사용', seats: seats('P', 'oooooooe', 1) },
          d: { name: '2인석', note: '5 / 6 사용', seats: seats('D', 'oooxoo', 1) },
        },
        updatedAt: at,
      },
      '/cafe/orders': { value: { cooking: '4', ready: '2', note: '라면 · 볶음밥 · 떡볶이' }, updatedAt: at },
      '/cafe/figures': {
        value: [
          { label: '사용 중', value: '46/54', note: '석 — 곧 끝남 4' },
          { label: '평균 이용', value: '2:10', note: '시간 — 오늘' },
          { label: '대기 손님', value: '3', note: '명 — 빈자리 안내 중' },
        ],
        updatedAt: at,
      },
      '/cafe/games': {
        value: [
          { name: 'AOS', seats: '19석', share: 41 },
          { name: 'FPS', seats: '12석', share: 26 },
          { name: 'MMORPG', seats: '7석', share: 15 },
          { name: '레이싱', seats: '4석', share: 9 },
          { name: '스포츠', seats: '4석', share: 9 },
        ],
        updatedAt: at,
      },
      '/cafe/hours': {
        value: [
          { hour: '12시', seats: 14 },
          { hour: '13시', seats: 18 },
          { hour: '14시', seats: 22 },
          { hour: '15시', seats: 25 },
          { hour: '16시', seats: 29 },
          { hour: '17시', seats: 31 },
          { hour: '18시', seats: 34 },
          { hour: '19시', seats: 40 },
          { hour: '20시', seats: 44 },
          { hour: '21시', seats: 46 },
        ],
        updatedAt: at,
      },
    },
  },
};
