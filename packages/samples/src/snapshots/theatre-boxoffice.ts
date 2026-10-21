// Example data written for the sample — the theatre, its opera and its seats are made up. Keep it consistent: it is
// 17:30 on a Wednesday; the evening's 19:30 performance is nearly sold — the stalls' centre and the boxes are gone, a
// few seats are left at the sides and in the balcony. The afternoon matinee has played to a full house. The figures
// are for tonight's performance; the line is the tickets sold for it over the last fourteen days.
import type { SampleSnapshot } from '../sample-pack.js';

const at = '2026-10-21T08:30:00Z';

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-21T08:30:20.000Z',
  responses: {
    theatre: {
      '/theatre/now': { name: '오로라 극장', show: '오페라 «별의 정원»', date: '10월 21일 수요일', time: '17:30', updatedAt: at },
      '/theatre/zones': {
        value: {
          a: { level: 'few', left: '잔여 6' },
          b: { level: 'sold', left: '매진' },
          c: { level: 'few', left: '잔여 4' },
          d: { level: 'open', left: '잔여 21' },
          e: { level: 'sold', left: '매진' },
          f: { level: 'few', left: '잔여 9' },
          g: { level: 'open', left: '잔여 32' },
          h: { level: 'few', left: '잔여 5' },
          i: { level: 'open', left: '잔여 28' },
          box1: { level: 'sold', left: '매진' },
          box2: { level: 'sold', left: '매진' },
          box3: { level: 'sold', left: '매진' },
          box4: { level: 'few', left: '잔여 2' },
        },
        updatedAt: at,
      },
      '/theatre/figures': {
        value: [
          { label: '오늘 19:30 판매', value: '1,203', note: '1,320석 중 91%' },
          { label: '현장 대기', value: '42', note: '18:30 발매' },
          { label: '취소표 알림', value: '118', note: '신청' },
        ],
        updatedAt: at,
      },
      '/theatre/performances': {
        value: [
          { day: '10.21 수', time: '14:00', note: '마티네 · 종료', word: '매진', level: 'sold' },
          { day: '10.21 수', time: '19:30', note: '오늘 저녁', word: '91%', level: 'few' },
          { day: '10.22 목', time: '19:30', note: '', word: '64%', level: 'open' },
          { day: '10.23 금', time: '19:30', note: '', word: '매진', level: 'sold' },
          { day: '10.24 토', time: '15:00', note: '', word: '매진', level: 'sold' },
          { day: '10.24 토', time: '19:30', note: '마지막 공연', word: '88%', level: 'few' },
        ],
        updatedAt: at,
      },
      '/theatre/sales': {
        value: [
          { day: '10.08', sold: 610 },
          { day: '10.09', sold: 655 },
          { day: '10.10', sold: 702 },
          { day: '10.11', sold: 760 },
          { day: '10.12', sold: 790 },
          { day: '10.13', sold: 812 },
          { day: '10.14', sold: 850 },
          { day: '10.15', sold: 902 },
          { day: '10.16', sold: 948 },
          { day: '10.17', sold: 1010 },
          { day: '10.18', sold: 1064 },
          { day: '10.19', sold: 1098 },
          { day: '10.20', sold: 1151 },
          { day: '10.21', sold: 1203 },
        ],
        updatedAt: at,
      },
    },
  },
};
