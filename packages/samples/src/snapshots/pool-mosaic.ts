// Example data written for the sample — the pool, its lanes and its numbers are made up. Keep it consistent: it is 19:10
// on a Thursday, the evening rush. Of eight lanes seven are open — three for free swimming, one of them full; three for
// classes; one closed while a tile is repaired. The swimmers in the water now are the sum of the lanes; today's
// admissions are the sum of the hourly bars; the combined chlorine is near its limit, so it is watched.
import type { SampleSnapshot } from '../sample-pack.js';

const at = '2026-10-22T10:10:00Z';

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-22T10:10:20.000Z',
  responses: {
    pool: {
      '/pool/now': { value: { series: '레인 안내 · 저녁', name: '누리 수영장', date: '10월 22일 목요일', time: '19:10' }, updatedAt: at },
      '/pool/lanes': {
        value: {
          l1: { no: '1', use: '걷기', who: '수중 걷기 · 천천히', state: 'open', swimmers: 4, places: 12, word: '자유' },
          l2: { no: '2', use: '자유 수영 — 초급', who: '한 방향 돌기', state: 'open', swimmers: 9, places: 12, word: '자유' },
          l3: { no: '3', use: '자유 수영 — 중급', who: '한 방향 돌기', state: 'full', swimmers: 12, places: 12, word: '만원' },
          l4: { no: '4', use: '자유 수영 — 상급', who: '50 m 왕복', state: 'open', swimmers: 7, places: 12, word: '자유' },
          l5: { no: '5', use: '성인 접영반', who: '강습 · 박 강사', state: 'class', swimmers: 10, places: 12, word: '강습' },
          l6: { no: '6', use: '성인 자유형반', who: '강습 · 윤 강사', state: 'class', swimmers: 8, places: 12, word: '강습' },
          l7: { no: '7', use: '아쿠아로빅', who: '강습 · 정 강사', state: 'class', swimmers: 11, places: 12, word: '강습' },
          l8: { no: '8', use: '타일 보수', who: '내일 06시에 열림', state: 'closed', swimmers: 0, places: 12, word: '닫힘' },
        },
        updatedAt: at,
      },
      '/pool/water': {
        value: [
          { label: '잔류 염소', value: '0.6', range: 'mg/L · 기준 0.4~1.0', state: 'ok' },
          { label: '결합 염소', value: '0.42', range: 'mg/L · 기준 0.5 이하', state: 'watch' },
          { label: 'pH', value: '7.4', range: '기준 5.8~8.6', state: 'ok' },
          { label: '수온', value: '28.0', range: '°C · 운영 27~29', state: 'ok' },
          { label: '탁도', value: '1.2', range: 'NTU · 기준 2.8 이하', state: 'ok' },
          { label: '물 순환', value: '4.1', range: '시간에 한 번', state: 'ok' },
        ],
        updatedAt: at,
      },
      '/pool/classes': {
        value: [
          { time: '18:00', name: '어린이 초급반', lane: '5·6 레인', state: 'done', word: '마침' },
          { time: '19:00', name: '성인 접영반', lane: '5 레인', state: 'now', word: '진행' },
          { time: '19:00', name: '성인 자유형반', lane: '6 레인', state: 'now', word: '진행' },
          { time: '19:00', name: '아쿠아로빅', lane: '7 레인', state: 'now', word: '진행' },
          { time: '20:00', name: '성인 평영반', lane: '5 레인', state: 'next', word: '다음' },
          { time: '21:00', name: '마감 · 바닥 청소', lane: '전체', state: 'next', word: '예정' },
        ],
        updatedAt: at,
      },
      '/pool/figures': {
        value: [
          { label: '지금 물속', value: '61', note: '명 — 레인 합' },
          { label: '오늘 입장', value: '784', note: '명 — 6시부터' },
          { label: '레인 운영', value: '7 / 8', note: '8번 보수' },
        ],
        updatedAt: at,
      },
      '/pool/admissions': {
        value: [
          { hour: '6시', admissions: 85 },
          { hour: '7시', admissions: 112 },
          { hour: '8시', admissions: 46 },
          { hour: '9시', admissions: 30 },
          { hour: '10시', admissions: 52 },
          { hour: '11시', admissions: 48 },
          { hour: '12시', admissions: 38 },
          { hour: '13시', admissions: 26 },
          { hour: '14시', admissions: 34 },
          { hour: '15시', admissions: 41 },
          { hour: '16시', admissions: 58 },
          { hour: '17시', admissions: 74 },
          { hour: '18시', admissions: 96 },
          { hour: '19시', admissions: 44 },
        ],
        updatedAt: at,
      },
    },
  },
};
