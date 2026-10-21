// Example data written for the sample — the city, its by-election and its counting hall are made up, and the board
// carries no candidate's or party's figures, only how far the count has come. Keep it consistent: it is 22:40 on the
// Wednesday of the by-election; 148 ballot boxes, all received; sorter 4 is stopped for a jam, so its review table
// waits; the commission has published 70 boxes. A box moves receiving → sorter → review table → commission.
import type { SampleSnapshot } from '../sample-pack.js';

const at = '2026-10-21T13:40:00Z';

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-21T13:40:20.000Z',
  responses: {
    count: {
      '/count/now': { name: '가온시 시장 보궐선거 개표', rate: '47.3%', date: '10월 21일 수요일', time: '22:40', updatedAt: at },
      '/count/stations': {
        value: {
          desk: { name: '투표함 접수', state: 'done', word: '완료', count: '148함', sub: '148함 중 · 21:05 마감' },
          s1: { name: '분류기 1', state: 'run', word: '가동', count: '21함', sub: '분당 2,140매' },
          s2: { name: '분류기 2', state: 'run', word: '가동', count: '20함', sub: '분당 2,080매' },
          s3: { name: '분류기 3', state: 'run', word: '가동', count: '19함', sub: '분당 2,010매' },
          s4: { name: '분류기 4', state: 'stop', word: '정지', count: '14함', sub: '용지 걸림 · 22:31부터' },
          s5: { name: '분류기 5', state: 'run', word: '가동', count: '20함', sub: '분당 2,120매' },
          s6: { name: '분류기 6', state: 'idle', word: '대기', count: '18함', sub: '다음 투표함 이송 중' },
          t1: { name: '심사 A', state: 'run', word: '심사', count: '17함', sub: '1·2동' },
          t2: { name: '심사 B', state: 'run', word: '심사', count: '16함', sub: '3·4동' },
          t3: { name: '심사 C', state: 'run', word: '심사', count: '16함', sub: '5동' },
          t4: { name: '심사 D', state: 'idle', word: '대기', count: '12함', sub: '분류기 4 정지' },
          t5: { name: '심사 E', state: 'run', word: '심사', count: '18함', sub: '6·7동' },
          t6: { name: '심사 F', state: 'run', word: '심사', count: '17함', sub: '8동 · 관외사전' },
          board: { name: '위원 검열 · 공표', state: 'run', word: '진행', count: '70함', sub: '148함 중 · 다음 공표 22:50' },
        },
        updatedAt: at,
      },
      '/count/stages': {
        value: [
          { label: '접수', value: '148 / 148', tenth: 10 },
          { label: '분류', value: '112 / 148', tenth: 8 },
          { label: '심사', value: '96 / 148', tenth: 6 },
          { label: '공표', value: '70 / 148', tenth: 5 },
        ],
        updatedAt: at,
      },
      '/count/districts': {
        value: [
          { label: '1동', value: '72%', tenth: 7 },
          { label: '2동', value: '68%', tenth: 7 },
          { label: '3동', value: '55%', tenth: 6 },
          { label: '4동', value: '31%', tenth: 3 },
          { label: '5동', value: '49%', tenth: 5 },
          { label: '6동', value: '44%', tenth: 4 },
          { label: '7동', value: '38%', tenth: 4 },
          { label: '8동', value: '22%', tenth: 2 },
        ],
        updatedAt: at,
      },
      '/count/progress': {
        value: [
          { time: '20:40', rate: 0 },
          { time: '21:00', rate: 2.1 },
          { time: '21:20', rate: 8.4 },
          { time: '21:40', rate: 17.6 },
          { time: '22:00', rate: 27.0 },
          { time: '22:20', rate: 38.5 },
          { time: '22:40', rate: 47.3 },
        ],
        updatedAt: at,
      },
    },
  },
};
