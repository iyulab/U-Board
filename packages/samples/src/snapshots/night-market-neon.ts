// Example data written for the sample — the market and its trucks are made up. Keep it consistent: it is 20:40 on a
// Thursday in late October. Six of the eight trucks are serving (two of them with a long line), one has sold out and
// one has closed for the night; the average wait is that of the six serving. The orders by the half hour run from the
// 18:00 opening to the slot now.
import type { SampleSnapshot } from '../sample-pack.js';

const at = '2026-10-22T11:39:00Z';

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-22T11:40:00.000Z',
  responses: {
    market: {
      '/market/now': { value: { date: '10월 22일 목요일', time: '20:40', visitors: '1,240', open: '6 / 8', wait: '11분' }, updatedAt: at },
      '/market/trucks': {
        value: {
          a: { name: 'Taco Moon', menu: '불고기 타코 · 감자튀김', wait: '22', line: '31', state: 'busy', word: '줄 김', color: '#ff4fa3' },
          b: { name: 'Bao Bao', menu: '삼겹 바오번 · 만두', wait: '8', line: '9', state: 'open', word: '영업 중', color: '#3ef0ff' },
          c: { name: 'Fire Wok', menu: '불맛 볶음면 · 꿔바로우', wait: '0', line: '0', state: 'soldout', word: '품절', color: '#ffb23e' },
          d: { name: 'Crêpe', menu: '딸기 크레페 · 레모네이드', wait: '6', line: '7', state: 'open', word: '영업 중', color: '#b77bff' },
          e: { name: 'Grill 77', menu: '닭꼬치 · 소시지', wait: '19', line: '26', state: 'busy', word: '줄 김', color: '#a6ff4d' },
          f: { name: 'Kimbap', menu: '꼬마김밥 · 어묵', wait: '4', line: '5', state: 'open', word: '영업 중', color: '#3ef0ff' },
          g: { name: 'Gelato', menu: '피스타치오 · 우유', wait: '0', line: '0', state: 'closed', word: '영업 끝', color: '#ff4fa3' },
          h: { name: 'Hotteok', menu: '씨앗호떡 · 식혜', wait: '7', line: '8', state: 'open', word: '영업 중', color: '#ffb23e' },
        },
        updatedAt: at,
      },
      '/market/orders': {
        value: [
          { slot: '18:00', orders: 64 },
          { slot: '18:30', orders: 118 },
          { slot: '19:00', orders: 176 },
          { slot: '19:30', orders: 203 },
          { slot: '20:00', orders: 188 },
          { slot: '20:30', orders: 97 },
        ],
        updatedAt: at,
      },
    },
  },
};
