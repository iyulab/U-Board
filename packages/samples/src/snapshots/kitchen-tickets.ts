// Example data written for the sample — the restaurant, its orders and its numbers are made up. Keep it consistent: it is
// 12:24 on a Thursday, the lunch rush. Six tickets hang on the rail: one new, three cooking, one done and waiting at the
// pass, one late (over 15 minutes). A ticket waits at every station its dishes need, so the queues count the five tickets
// still being made dish by dish: stews A-118 · 116 · 115 · 114, stir-fries and grills A-118 · 116 · 114, the fryer A-117;
// rice is served at the pass. Each station's oldest wait is its oldest ticket's age. The cooking time chart ends at the
// half hour before now.
import type { SampleSnapshot } from '../sample-pack.js';

const at = '2026-10-22T03:24:00Z';

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-22T03:24:05.000Z',
  responses: {
    kitchen: {
      '/kitchen/tickets': {
        value: {
          t1: { no: 'A-118', where: '테이블 7', state: 'new', age: '00:40', word: '대기', printed: '12:23 출력', lines: '2  김치찌개\n1  제육볶음\n   - 덜 맵게\n3  공기밥' },
          t2: { no: 'A-117', where: '포장', state: 'cook', age: '06:15', word: '조리 중', printed: '12:17 출력', lines: '1  돈가스\n1  우동\n   - 국물 따로' },
          t3: { no: 'A-116', where: '테이블 3', state: 'cook', age: '09:50', word: '조리 중', printed: '12:14 출력', lines: '2  제육볶음\n2  된장찌개\n2  공기밥' },
          t4: { no: 'A-115', where: '테이블 12', state: 'late', age: '17:30', word: '지연', printed: '12:06 출력', lines: '4  부대찌개\n   - 라면사리 2\n4  공기밥' },
          t5: { no: 'A-114', where: '배달', state: 'cook', age: '12:05', word: '조리 중', printed: '12:12 출력', lines: '1  순두부찌개\n1  고등어구이\n2  공기밥' },
          t6: { no: 'A-113', where: '테이블 5', state: 'done', age: '14:20', word: '픽업 대기', printed: '12:10 출력', lines: '1  비빔밥\n1  김치찌개\n1  공기밥' },
        },
        updatedAt: at,
      },
      '/kitchen/stations': {
        value: [
          { name: '찌개·탕', state: 'busy', queue: '4장', oldest: '17:30', note: 'A-115 부대찌개' },
          { name: '볶음·구이', state: 'steady', queue: '3장', oldest: '12:05', note: '고등어 굽는 중' },
          { name: '튀김', state: 'steady', queue: '1장', oldest: '06:15', note: '돈가스' },
          { name: '밥·반찬', state: 'idle', queue: '0장', oldest: '—', note: '공기밥은 배식대에서' },
        ],
        updatedAt: at,
      },
      '/kitchen/totals': {
        value: [
          { label: '오늘 주문', value: '214건' },
          { label: '평균 조리', value: '11분 40초' },
          { label: '지연(15분+)', value: '3건' },
          { label: '레일 위', value: '6장' },
        ],
        // The kitchen the totals are of — the panel's heading reads it from the same answer.
        kitchen: { name: '누리 한식당 · 주방', date: '2026-10-22 (목)', time: '12:24' },
        updatedAt: at,
      },
      '/kitchen/cooking': {
        value: [
          { at: '10:00', minutes: 7.9 },
          { at: '10:30', minutes: 8.4 },
          { at: '11:00', minutes: 9.6 },
          { at: '11:30', minutes: 11.2 },
          { at: '12:00', minutes: 13.1 },
        ],
        updatedAt: at,
      },
    },
  },
};
