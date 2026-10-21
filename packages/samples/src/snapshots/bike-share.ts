// Example data written for the sample — the city, its stations and its riders are made up. Keep it consistent: it is
// 08:40 on a Thursday, the morning commute; riders have emptied the stations by the flats and the bus terminal's side
// of the river and filled the ones by the station, the city hall and the library. Two trucks are moving bikes back —
// one from the full library rack to the empty station, one from the full flats rack to the hospital. Every station has
// ten docks. Rentals are counted since five.
import type { SampleSnapshot } from '../sample-pack.js';

const at = '2026-10-21T23:40:00Z';

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-21T23:40:20.000Z',
  responses: {
    bikes: {
      '/bikes/now': { name: '가람시 공공자전거', sub: '대여소 10곳 · 거치대 100', date: '10월 22일 목요일', time: '08:40', updatedAt: at },
      '/bikes/stations': {
        value: {
          s1: { name: '강변공원', bikes: 7, empty: 3, state: 'ok', word: '넉넉' },
          s2: { name: '시청', bikes: 9, empty: 1, state: 'ok', word: '넉넉' },
          s3: { name: '중앙역', bikes: 0, empty: 10, state: 'low', word: '자전거 없음' },
          s4: { name: '대학 정문', bikes: 6, empty: 4, state: 'ok', word: '넉넉' },
          s5: { name: '도서관', bikes: 10, empty: 0, state: 'full', word: '반납 불가' },
          s6: { name: '시장', bikes: 5, empty: 5, state: 'ok', word: '넉넉' },
          s7: { name: '병원', bikes: 1, empty: 9, state: 'low', word: '1대 남음' },
          s8: { name: '체육공원', bikes: 4, empty: 6, state: 'ok', word: '넉넉' },
          s9: { name: '버스터미널', bikes: 2, empty: 6, state: 'off', word: '거치대 2칸 점검' },
          s10: { name: '주택단지', bikes: 10, empty: 0, state: 'full', word: '반납 불가' },
        },
        updatedAt: at,
      },
      '/bikes/trucks': {
        value: {
          t1: '트럭 1 · 6대',
          t2: '트럭 2 · 5대',
        },
        updatedAt: at,
      },
      '/bikes/figures': {
        value: [
          { label: '지금 달리는 자전거', value: '412', note: '대' },
          { label: '오늘 대여', value: '730', note: '건 — 05시부터' },
          { label: '재배치', value: '2', note: '대 트럭 운행 중' },
        ],
        updatedAt: at,
      },
      '/bikes/hours': {
        value: [
          { hour: '05시', n: 2, count: '40건' },
          { hour: '06시', n: 6, count: '120건' },
          { hour: '07시', n: 15.5, count: '310건' },
          { hour: '08시', n: 13, count: '260건 (40분)' },
        ],
        updatedAt: at,
      },
      '/bikes/jobs': {
        value: [
          { truck: '트럭 1', from: '도서관', to: '중앙역', bikes: '6대', eta: '08:55 도착' },
          { truck: '트럭 2', from: '주택단지', to: '병원', bikes: '5대', eta: '09:05 도착' },
        ],
        updatedAt: at,
      },
    },
  },
};
