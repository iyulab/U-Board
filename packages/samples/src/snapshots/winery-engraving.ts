// Example data written for the sample — the winery, its tanks and its numbers are made up. Keep it consistent: it is
// 10:30 on a Thursday in late October, harvest. Four tanks are fermenting; the third, filled with syrah three days
// ago, has climbed to 31 °C and its cooling jacket is being checked; the fifth has finished and rests; the sixth is
// empty for cleaning. The chart's 10:00 readings are the tanks' temperatures now.
import type { SampleSnapshot } from '../sample-pack.js';

const at = '2026-10-22T01:30:00Z';

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-22T01:30:20.000Z',
  responses: {
    cellar: {
      '/cellar/now': { value: { series: '수확 · 2026 빈티지', name: '솔바람 와이너리', date: '10월 22일 목요일', time: '10:30' }, updatedAt: at },
      '/cellar/tanks': {
        value: {
          t1: { name: '1번 탱크', grape: '카베르네 소비뇽', state: 'fermenting', word: '발효 5일째', temp: '26 °C', brix: '14.2', level: 82 },
          t2: { name: '2번 탱크', grape: '메를로', state: 'fermenting', word: '발효 7일째', temp: '24 °C', brix: '9.8', level: 78 },
          t3: { name: '3번 탱크', grape: '시라', state: 'warm', word: '온도 높음', temp: '31 °C', brix: '18.0', level: 85 },
          t4: { name: '4번 탱크', grape: '샤르도네', state: 'fermenting', word: '발효 9일째', temp: '16 °C', brix: '12.1', level: 70 },
          t5: { name: '5번 탱크', grape: '피노 누아', state: 'resting', word: '발효 끝 · 안정', temp: '18 °C', brix: '-1.2', level: 76 },
          t6: { name: '6번 탱크', grape: '—', state: 'empty', word: '비움 · 세척', temp: '—', brix: '—', level: 0 },
        },
        updatedAt: at,
      },
      '/cellar/barrels': {
        value: {
          b1: { no: 'B-01', wine: '카베르네 2025', months: '13개월째', state: 'aging' },
          b2: { no: 'B-02', wine: '카베르네 2025', months: '13개월째', state: 'aging' },
          b3: { no: 'B-03', wine: '메를로 2025', months: '12개월째', state: 'aging' },
          b4: { no: 'B-04', wine: '메를로 2025', months: '12개월째', state: 'aging' },
          b5: { no: 'B-05', wine: '시라 2025', months: '12개월째', state: 'aging' },
          b6: { no: 'B-06', wine: '시라 2025', months: '보충 필요', state: 'topping' },
          b7: { no: 'B-07', wine: '블렌드 2024', months: '병입 준비', state: 'ready' },
          b8: { no: 'B-08', wine: '블렌드 2024', months: '병입 준비', state: 'ready' },
        },
        updatedAt: at,
      },
      '/cellar/figures': {
        value: [
          { label: '발효 중', value: '4', note: '탱크 — 6기 중' },
          { label: '오늘 반입', value: '3.2 t', note: '시라 — 08:30' },
          { label: '오크통', value: '8', note: '병입 준비 2' },
        ],
        updatedAt: at,
      },
      '/cellar/work': {
        value: [
          { time: '07:00', what: '펀치다운', where: '1·3번 탱크', state: 'done' },
          { time: '08:30', what: '포도 반입 · 파쇄', where: '시라 3.2 t', state: 'done' },
          { time: '10:30', what: '냉각 재킷 점검', where: '3번 탱크', state: 'now' },
          { time: '13:00', what: '랙킹(따라내기)', where: '5번 탱크', state: 'next' },
          { time: '15:00', what: '오크통 보충', where: 'B-06', state: 'next' },
          { time: '16:30', what: '탱크 세척 마감', where: '6번 탱크', state: 'next' },
        ],
        updatedAt: at,
      },
      '/cellar/temps': {
        value: [
          { hour: '00', t1: 25.2, t3: 27.1 },
          { hour: '02', t1: 25.4, t3: 27.8 },
          { hour: '04', t1: 25.5, t3: 28.6 },
          { hour: '06', t1: 25.8, t3: 29.3 },
          { hour: '08', t1: 25.6, t3: 30.2 },
          { hour: '10', t1: 26.0, t3: 31.0 },
        ],
        updatedAt: at,
      },
      '/cellar/note': {
        value: {
          cellar: '13 °C',
          humidity: '74 %',
          harvest: '18.4 / 22 t',
          bottling: '11월 3일',
          text: '3번 탱크가 31 °C — 냉각수 밸브를 보는 중. 붉은 포도의 발효가 30 °C를 넘으면 향이 날아간다.',
        },
        updatedAt: at,
      },
    },
  },
};
