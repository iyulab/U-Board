// Example data written for the sample — the apiary, its hives and its numbers are made up. Keep it consistent: it is
// 10:40 on a Thursday in late October. Of eight hives, five are sound, two to watch (one short of stores, one with mites
// rising after treatment), one has lost its queen and is to be united with its neighbour. The average weight is the mean
// of the eight hives; it fell through the week and turned when feeding began on the 21st. This year's harvest is the sum
// of the harvests done.
import type { SampleSnapshot } from '../sample-pack.js';

const at = '2026-10-22T01:30:00Z';

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-22T01:40:20.000Z',
  responses: {
    apiary: {
      '/apiary/now': { value: { series: '벌통 기록 · 가을', name: '누리 양봉장', date: '10월 22일 목요일', time: '10:40' }, updatedAt: at },
      '/apiary/hives': {
        value: {
          h1: { no: '1번 통', state: 'ok', weight: '32.4 kg', frames: '소비 8장', queen: '흰 점', note: '월동 준비 끝' },
          h2: { no: '2번 통', state: 'ok', weight: '30.8 kg', frames: '소비 7장', queen: '흰 점', note: '양호' },
          h3: { no: '3번 통', state: 'ok', weight: '34.1 kg', frames: '소비 8장', queen: '파란 점', note: '양호' },
          h4: { no: '4번 통', state: 'ok', weight: '29.5 kg', frames: '소비 7장', queen: '흰 점', note: '양호' },
          h5: { no: '5번 통', state: 'ok', weight: '31.2 kg', frames: '소비 7장', queen: '파란 점', note: '양호' },
          h6: { no: '6번 통', state: 'watch', weight: '24.6 kg', frames: '소비 6장', queen: '흰 점', note: '먹이 부족 — 설탕물' },
          h7: { no: '7번 통', state: 'watch', weight: '30.1 kg', frames: '소비 7장', queen: '파란 점', note: '응애 늘어남' },
          h8: { no: '8번 통', state: 'alarm', weight: '22.3 kg', frames: '소비 5장', queen: '여왕 없음', note: '7번과 합봉 예정' },
        },
        updatedAt: at,
      },
      '/apiary/harvest': {
        value: [
          { when: '5월', what: '아카시아꿀', amount: '120 kg', state: 'done', word: '채밀' },
          { when: '6월', what: '밤꿀', amount: '85 kg', state: 'done', word: '채밀' },
          { when: '7월', what: '잡화꿀', amount: '60 kg', state: 'done', word: '채밀' },
          { when: '9월', what: '메밀꿀', amount: '32 kg', state: 'done', word: '채밀' },
          { when: '10월', what: '설탕물 먹이 — 6번부터', amount: '40 L', state: 'next', word: '진행 중' },
          { when: '10월', what: '8번 → 7번 합봉', amount: '1통', state: 'plan', word: '이번 주' },
          { when: '11월', what: '월동 포장 · 보온', amount: '8통', state: 'plan', word: '예정' },
        ],
        updatedAt: at,
      },
      '/apiary/flowers': {
        value: [
          { name: '쑥부쟁이', state: 'bloom', word: '한창', distance: '뒷산 비탈 · 300 m' },
          { name: '산국', state: 'bloom', word: '피는 중', distance: '개울가 · 500 m' },
          { name: '메밀', state: 'fade', word: '거의 짐', distance: '아랫마을 밭 · 1.2 km' },
          { name: '들깨', state: 'fade', word: '짐', distance: '논두렁 · 800 m' },
          { name: '비파나무', state: 'bud', word: '11월', distance: '마을 길 · 400 m' },
        ],
        updatedAt: at,
      },
      '/apiary/figures': {
        value: [
          { label: '벌통 양호', value: '5 / 8', note: '주의 2 · 여왕 없음 1' },
          { label: '평균 무게', value: '29.4', note: 'kg — 8통' },
          { label: '올해 채밀', value: '297', note: 'kg — 네 번' },
        ],
        updatedAt: at,
      },
      '/apiary/weight': {
        value: [
          { day: '10/16', kg: 30.9 },
          { day: '10/17', kg: 30.6 },
          { day: '10/18', kg: 30.2 },
          { day: '10/19', kg: 29.8 },
          { day: '10/20', kg: 29.5 },
          { day: '10/21', kg: 29.3 },
          { day: '10/22', kg: 29.4 },
        ],
        updatedAt: at,
      },
    },
  },
};
