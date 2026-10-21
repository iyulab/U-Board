// Example data written for the sample, not recorded from a source — no public source carries a hospital's queues.
// Keep it consistent: it is 10:15 on a Tuesday morning, the busiest hour of the outpatient day. Orthopaedics has the
// longest wait (Monday's injuries come back on Tuesday), the paediatric clinic the shortest; the scan room is backed
// up behind an emergency case, and the car park's upper levels are nearly full. The hours are an average Tuesday's.
import type { SampleSnapshot } from '../sample-pack.js';

const at = '2026-10-20T01:15:00Z';

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-20T01:15:20.000Z',
  responses: {
    clinic: {
      '/clinic/now': { name: '온새미 종합병원', date: '10월 20일 화요일', time: '10:15', help: '도움이 필요하면 1층 안내데스크', updatedAt: at },
      '/clinic/queues': {
        internal: { calling: 1042, desk: '3번 진료실', next: [1043, 1045, 1046], waiting: 18, minutes: 35 },
        ortho: { calling: 2117, desk: '1번 진료실', next: [2118, 2120, 2121], waiting: 26, minutes: 55 },
        paediatric: { calling: 3058, desk: '2번 진료실', next: [3059, 3060, 3062], waiting: 7, minutes: 15 },
        eye: { calling: 4031, desk: '검사실 앞', next: [4032, 4033, 4035], waiting: 12, minutes: 25 },
        updatedAt: at,
      },
      '/clinic/tests': {
        value: [
          { name: 'CT · MRI', place: '지하 1층', waiting: 9, minutes: 50, share: 100, level: 'long' },
          { name: 'X-ray', place: '1층 영상의학', waiting: 6, minutes: 20, share: 40, level: 'usual' },
          { name: '채혈', place: '1층 검체실', waiting: 14, minutes: 10, share: 20, level: 'short' },
        ],
        updatedAt: at,
      },
      '/clinic/pharmacy': {
        ready: [
          { no: 518, fresh: true },
          { no: 517, fresh: true },
          { no: 515, fresh: false },
          { no: 514, fresh: false },
          { no: 511, fresh: false },
          { no: 509, fresh: false },
        ],
        counter: '원내 약국 1층 정문 옆 · 번호가 뜨면 창구로 오세요',
        updatedAt: at,
      },
      '/clinic/parking': {
        value: [
          { name: 'B1', free: 4, level: 'full' },
          { name: 'B2', free: 18, level: 'few' },
          { name: 'B3', free: 63, level: 'free' },
          { name: '야외', free: 21, level: 'few' },
        ],
        updatedAt: at,
      },
      '/clinic/visits': {
        value: [
          { hour: '8시', visits: 142 },
          { hour: '9시', visits: 318 },
          { hour: '10시', visits: 286 },
          { hour: '11시', visits: 241 },
          { hour: '13시', visits: 198 },
          { hour: '14시', visits: 224 },
          { hour: '15시', visits: 176 },
          { hour: '16시', visits: 103 },
        ],
        updatedAt: at,
      },
    },
  },
};
