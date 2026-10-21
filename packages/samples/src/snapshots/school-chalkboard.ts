// Example data written for the sample — the school, its classes and its numbers are made up. Keep it consistent: it is
// 10:52 on a Wednesday, the third period; class 2-3 has gone down the corridor to the science lab and class 1-2 to the
// music room, so both their rooms stand empty; class 2-1 is sitting a unit test; the library is free this period; the
// nurse has two pupils, one each from 1-3 and 2-4. Eight classes of 26, 208 on the roll; five absent today, so 203 in school —
// 201 in the rooms and 2 with the nurse. The absences chart is the last ten school days (the 9th was a holiday), today last.
import type { SampleSnapshot } from '../sample-pack.js';

const at = '2026-10-21T01:50:00Z';

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-21T01:52:10.000Z',
  responses: {
    school: {
      '/school/now': { name: '누리중학교', date: '10월 21일 수요일', period: '3교시', time: '10:52', updatedAt: at },
      '/school/rooms': {
        value: {
          'c1-1': { name: '1-1', state: 'lesson', word: '국어', note: '25명 · 결석 1' },
          'c1-2': { name: '1-2', state: 'moved', word: '음악실로', note: '빈 교실' },
          'c1-3': { name: '1-3', state: 'lesson', word: '수학', note: '25명 · 1명 보건실' },
          'c1-4': { name: '1-4', state: 'lesson', word: '영어', note: '25명 · 결석 1' },
          science: { name: '과학실', state: 'lesson', word: '2-3 과학', note: '실험 · 26명' },
          music: { name: '음악실', state: 'lesson', word: '1-2 음악', note: '합주 · 26명' },
          'c2-1': { name: '2-1', state: 'test', word: '단원평가', note: '수학 · 25명' },
          'c2-2': { name: '2-2', state: 'lesson', word: '사회', note: '24명 · 결석 2' },
          'c2-3': { name: '2-3', state: 'moved', word: '과학실로', note: '빈 교실' },
          'c2-4': { name: '2-4', state: 'lesson', word: '기술·가정', note: '25명 · 1명 보건실' },
          library: { name: '도서실', state: 'free', word: '비어 있음', note: '4교시 1-4 독서' },
          nurse: { name: '보건실', state: 'care', word: '2명 휴식', note: '두통 · 찰과상' },
        },
        updatedAt: at,
      },
      '/school/lunch': {
        value: [
          { time: '12:20', who: '1학년 먼저', note: '1-1 → 1-4 순서 · 손 씻기' },
          { time: '12:40', who: '2학년', note: '2-1은 평가 뒤라 2분 늦게' },
          { time: '13:10', who: '점심 끝', note: '5교시 13:20' },
        ],
        updatedAt: at,
      },
      '/school/notes': {
        value: [
          { text: '1교시 아침 독서 — 끝', kind: 'done' },
          { text: '2-1 단원평가 3교시', kind: 'plan' },
          { text: '6교시 동아리 — 체육관 공사로 강당', kind: 'alert' },
          { text: '방과후 신청 금요일까지', kind: 'plan' },
        ],
        updatedAt: at,
      },
      '/school/attendance': {
        value: [
          { label: '등교', value: '203', note: '/ 208명' },
          { label: '결석', value: '5', note: '병결 4 · 기타 1' },
          { label: '보건실', value: '2', note: '명 휴식 중' },
        ],
        updatedAt: at,
      },
      '/school/absences': {
        value: [
          { day: '7(수)', absent: 7 },
          { day: '8(목)', absent: 4 },
          { day: '12(월)', absent: 9 },
          { day: '13(화)', absent: 6 },
          { day: '14(수)', absent: 5 },
          { day: '15(목)', absent: 8 },
          { day: '16(금)', absent: 6 },
          { day: '19(월)', absent: 10 },
          { day: '20(화)', absent: 7 },
          { day: '21(수)', absent: 5 },
        ],
        updatedAt: at,
      },
    },
  },
};
