// Example data written for the sample — the market, its park and its stalls are made up. Keep it consistent: it is 11:30
// on a Saturday morning in late October, a clear cold day; the bakery sold out its country loaves by eleven, the cheese
// and the tofu went soon after, the honey and the laver are nearly gone. The hotteok truck has the longest queue. The
// day's count is the visitors through the park's two gates since nine.
import type { SampleSnapshot } from '../sample-pack.js';

const at = '2026-10-24T02:30:00Z';

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-24T02:30:20.000Z',
  responses: {
    market: {
      '/market/now': { name: '느티나무 공원 주말 장터', sub: '토요 파머스마켓 · 09–14시', date: '10월 24일 토요일', time: '11:30', updatedAt: at },
      '/market/stalls': {
        value: {
          a1: { name: '햇살농장', item: '부사 사과', state: 'open', word: '판매 중', note: '5kg 3만 원' },
          a2: { name: '산들벌꿀', item: '아카시아 꿀', state: 'few', word: '6병 남음', note: '1병 2만 원' },
          a3: { name: '모락빵집', item: '깜빠뉴', state: 'sold', word: '완판', note: '다음 주 예약 받음' },
          a4: { name: '초록텃밭', item: '김장 배추', state: 'open', word: '판매 중', note: '3포기 1만 원' },
          a5: { name: '달콤잼 공방', item: '무화과 잼', state: 'open', word: '판매 중', note: '시식 가능' },
          a6: { name: '바다마을', item: '햇김', state: 'few', word: '4톳 남음', note: '1톳 9천 원' },
          b1: { name: '들깨방앗간', item: '들기름', state: 'open', word: '판매 중', note: '즉석 착유' },
          b2: { name: '고소치즈', item: '수제 치즈', state: 'sold', word: '완판', note: '10:40 완판' },
          b3: { name: '꽃담화원', item: '소국 화분', state: 'open', word: '판매 중', note: '2개 1만 원' },
          b4: { name: '버섯골', item: '표고버섯', state: 'few', word: '3봉 남음', note: '1봉 7천 원' },
          b5: { name: '할머니 손두부', item: '손두부', state: 'sold', word: '완판', note: '11:05 완판' },
          b6: { name: '숲속 로스터리', item: '핸드드립', state: 'open', word: '판매 중', note: '줄 10분' },
          t1: { name: '떡볶이 트럭', item: '떡볶이 · 순대', state: 'open', word: '대기 15분' },
          t2: { name: '호떡 트럭', item: '씨앗호떡', state: 'few', word: '대기 25분' },
          t3: { name: '어묵 트럭', item: '어묵 · 국물', state: 'open', word: '대기 5분' },
        },
        updatedAt: at,
      },
      '/market/figures': {
        value: [
          { label: '방문객', value: '2,340', note: '9시부터 두 출입구' },
          { label: '장바구니 대여', value: '186', note: '반납 141' },
          { label: '다회용기', value: '412', note: '일회용 대신' },
        ],
        updatedAt: at,
      },
      '/market/events': {
        value: [
          { time: '12:00', name: '어쿠스틱 공연', place: '분수 무대' },
          { time: '12:30', name: '김장 배추 고르는 법', place: '초록텃밭 앞' },
          { time: '13:30', name: '남은 채소 나눔', place: '안내소' },
        ],
        updatedAt: at,
      },
      '/market/visitors': {
        value: [
          { hour: '9:00', people: 120 },
          { hour: '9:30', people: 190 },
          { hour: '10:00', people: 380 },
          { hour: '10:30', people: 480 },
          { hour: '11:00', people: 610 },
          { hour: '11:30', people: 560 },
        ],
        updatedAt: at,
      },
    },
  },
};
