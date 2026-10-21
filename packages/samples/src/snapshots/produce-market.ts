// Example data written for the sample — the market, its halls and its prices are made up. Keep it consistent: it is
// 04:30 on a Thursday, the middle of the dawn auction; cabbage came in heavy for the kimchi season and fell for a
// second day, radish is up on a short supply, the fruit hall finished early and the special-crops hall starts at five.
// Prices are per unit as listed, against the day before.
import type { SampleSnapshot } from '../sample-pack.js';

const at = '2026-10-21T19:30:00Z';

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-21T19:30:20.000Z',
  responses: {
    market: {
      '/market/now': { name: '한빛 도매시장 일보', edition: '새벽판', date: '10월 22일 목요일', time: '04:30', updatedAt: at },
      '/market/lead': {
        headline: '김장철 배추 반입 늘어 경락가 이틀째 내려',
        deck: '배추 반입 1,240톤 — 지난주보다 18% 많아. 무는 반입이 줄며 오름세, 과일동 경매는 03:50에 끝났다.',
        updatedAt: at,
      },
      '/market/halls': {
        value: {
          h1: { name: '채소 1동', item: '배추', state: 'now', word: '경매 중', progress: 62, note: '62% · 남은 반입 470톤' },
          h2: { name: '채소 2동', item: '무', state: 'now', word: '경매 중', progress: 35, note: '35% · 남은 반입 210톤' },
          h3: { name: '과일동', item: '사과 · 배', state: 'done', word: '끝', progress: 100, note: '03:50 경매 끝' },
          h4: { name: '특작동', item: '버섯 · 고추', state: 'wait', word: '05:00 시작', progress: 0, note: '반입 확인 중' },
        },
        updatedAt: at,
      },
      '/market/prices': {
        value: [
          { item: '배추', unit: '10kg', price: '6,800원', change: '-9.3%', dir: 'down' },
          { item: '무', unit: '20kg', price: '14,200원', change: '+6.0%', dir: 'up' },
          { item: '대파', unit: '1kg', price: '2,350원', change: '-2.1%', dir: 'down' },
          { item: '사과(부사)', unit: '10kg', price: '42,000원', change: '+1.2%', dir: 'up' },
          { item: '배(신고)', unit: '15kg', price: '38,500원', change: '0.0%', dir: 'flat' },
          { item: '양파', unit: '20kg', price: '17,900원', change: '-0.6%', dir: 'down' },
        ],
        updatedAt: at,
      },
      '/market/cabbage': {
        value: [
          { day: '10/16', price: 8400 },
          { day: '10/17', price: 8100 },
          { day: '10/18', price: 8300 },
          { day: '10/19', price: 7900 },
          { day: '10/20', price: 8000 },
          { day: '10/21', price: 7500 },
          { day: '10/22', price: 6800 },
        ],
        updatedAt: at,
      },
      '/market/figures': {
        value: [
          { label: '오늘 반입', value: '3,860톤', note: '전일보다 +7%' },
          { label: '경매 진행', value: '58%', note: '네 동 반입량 기준' },
          { label: '낙찰 건수', value: '2,914', note: '건 — 00시부터' },
        ],
        updatedAt: at,
      },
      '/market/notices': {
        value: [
          { time: '05:00', text: '특작동 경매 시작 — 버섯·고추' },
          { time: '06:30', text: '채소 1동 하차장 2번 정비' },
          { time: '07:00', text: '정가·수의 매매 접수 시작' },
        ],
        updatedAt: at,
      },
    },
  },
};
