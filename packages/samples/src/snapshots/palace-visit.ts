// Example data written for the sample — the palace is made up, and its halls are named for what they were (the main
// gate, the throne hall, the council hall, the king's living quarters, the crown prince's quarters, the garden
// pavilion), not after any real palace's. Keep it consistent: it is 14:30 on a Wednesday in late October, autumn
// leaves at their best; a school trip fills the throne hall's courtyard, the pavilion opens its upper floor today only,
// the rear garden's timed tickets for the afternoon are nearly gone. The day's count is the gates' entries so far.
import type { SampleSnapshot } from '../sample-pack.js';

const at = '2026-10-21T05:30:00Z';

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-21T05:30:20.000Z',
  responses: {
    palace: {
      '/palace/now': { name: '가람궁', sub: '관람 안내 · 09:00–18:00', date: '10월 21일 수요일', time: '14:30', updatedAt: at },
      '/palace/halls': {
        gate: { name: '정문', crowd: 'busy', word: '보통', people: 180, next: '15:00 수문장 교대' },
        throne: { name: '정전', crowd: 'crowded', word: '붐빔', people: 640, next: '해설 15:00' },
        council: { name: '편전', crowd: 'busy', word: '보통', people: 210, next: '해설 15:20' },
        living: { name: '침전', crowd: 'calm', word: '여유', people: 95, next: '해설 15:40' },
        prince: { name: '동궁', crowd: 'calm', word: '여유', people: 70, next: '전시 «세자의 하루»' },
        pavilion: { name: '정자', crowd: 'busy', word: '보통', people: 260, next: '후원 16:00 입장', special: '오늘만 누마루 개방' },
        updatedAt: at,
      },
      '/palace/figures': {
        value: [
          { label: '오늘 관람객', value: '8,412', note: '평소 수요일의 1.4배', red: false },
          { label: '후원 잔여', value: '23', note: '16:00 회차 · 100명 중', red: true },
          { label: '한복 관람', value: '1,206', note: '무료 입장', red: false },
        ],
        updatedAt: at,
      },
      '/palace/tours': {
        value: [
          { time: '15:00', lang: '한국어', from: '정전 앞', left: '마감', full: true },
          { time: '15:20', lang: 'English', from: '편전 앞', left: '잔여 8', full: false },
          { time: '15:40', lang: '日本語', from: '침전 앞', left: '잔여 14', full: false },
          { time: '16:00', lang: '中文', from: '정문 안', left: '잔여 20', full: false },
        ],
        updatedAt: at,
      },
      '/palace/visitors': {
        value: [
          { hour: '9시', today: 420, usual: 310 },
          { hour: '10시', today: 1380, usual: 880 },
          { hour: '11시', today: 1910, usual: 1240 },
          { hour: '12시', today: 1260, usual: 990 },
          { hour: '13시', today: 1740, usual: 1180 },
          { hour: '14시', today: 1702, usual: 1210 },
        ],
        updatedAt: at,
      },
      '/palace/notices': {
        value: [
          { time: '안내', lang: '단풍 절정', from: '후원 연못 둘레', left: '절정', full: false },
          { time: '안내', lang: '수학여행 단체', from: '정전 마당 14–16시', left: '붐빔', full: true },
          { time: '안내', lang: '야간 관람', from: '금·토 19시', left: '예매', full: false },
        ],
        updatedAt: at,
      },
    },
  },
};
