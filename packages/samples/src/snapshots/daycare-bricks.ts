// Example data written for the sample — the centre, its classes and its numbers are made up. Keep it consistent: it is
// 15:40 on a Thursday in late October. Of 59 children enrolled 56 came today; six have gone home, so 50 are in. The
// first bus leaves at 16:10 with nine children, the second at 16:40.
import type { SampleSnapshot } from '../sample-pack.js';

const at = '2026-10-22T06:40:00Z';

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-22T06:40:20.000Z',
  responses: {
    care: {
      '/care/now': { value: { series: '우리 반 오늘 · 하원 시간', name: '도담 어린이집', date: '10월 22일 목요일', time: '15:40' }, updatedAt: at },
      '/care/rooms': {
        value: {
          star: { name: '아기별반', age: '만 0세', teachers: '교사 1', color: '#f7b2c4', state: 'nap', word: '낮잠', here: 3, total: 3, note: '16:00에 깨워 우유' },
          petal: { name: '꽃잎반', age: '만 1세', teachers: '교사 1', color: '#ffd166', state: 'play', word: '실내 놀이', here: 4, total: 5, note: '1명 결석 — 감기' },
          sprout: { name: '새싹반', age: '만 2세', teachers: '교사 1', color: '#9fd8a0', state: 'leaving', word: '하원 중', here: 5, total: 7, note: '2명 하원 · 15:30 보호자' },
          sun: { name: '햇살반', age: '만 3세', teachers: '교사 1', color: '#ffb36b', state: 'outside', word: '바깥 놀이', here: 13, total: 14, note: '놀이터 — 16:00까지' },
          sea: { name: '바다반', age: '만 4세', teachers: '교사 1', color: '#7cc6e8', state: 'play', word: '실내 놀이', here: 15, total: 15, note: '블록 쌓기 · 모두 등원' },
          sky: { name: '하늘반', age: '만 5세', teachers: '교사 1', color: '#b9a7ef', state: 'leaving', word: '하원 중', here: 10, total: 15, note: '4명 하원 · 1명 결석' },
        },
        updatedAt: at,
      },
      '/care/outdoor': { value: { who: '햇살반 13명이 놀고 있어요', temp: '17 °C', dust: '좋음', until: '16:00까지', check: '오늘 아침 완료' }, updatedAt: at },
      '/care/figures': {
        value: [
          { label: '지금 원내', value: '50', note: '명' },
          { label: '오늘 등원', value: '56 / 59', note: '결석 3' },
          { label: '하원', value: '6', note: '명 — 보호자 인계' },
        ],
        updatedAt: at,
      },
      '/care/buses': {
        value: [
          { bus: '1호차', time: '16:10', route: '느티마을 · 시장 앞', kids: '9명', state: 'ready', word: '탑승 준비' },
          { bus: '2호차', time: '16:40', route: '강변 아파트 · 도서관', kids: '11명', state: 'later', word: '예정' },
        ],
        updatedAt: at,
      },
      '/care/day': {
        value: [
          { time: '08:30', what: '등원', state: 'done' },
          { time: '10:00', what: '오전 놀이', state: 'done' },
          { time: '12:00', what: '점심', state: 'done' },
          { time: '13:00', what: '낮잠', state: 'done' },
          { time: '15:00', what: '간식', state: 'done' },
          { time: '15:30', what: '바깥 놀이 · 하원', state: 'now' },
          { time: '19:30', what: '문 닫음', state: 'next' },
        ],
        updatedAt: at,
      },
      '/care/notice': { value: { snack: '찐 고구마 · 우유', bring: '현장학습 — 모자·물통' }, updatedAt: at },
      '/care/week': {
        value: [
          { day: '월', kids: 55 },
          { day: '화', kids: 57 },
          { day: '수', kids: 54 },
          { day: '목', kids: 56 },
        ],
        updatedAt: at,
      },
    },
  },
};
