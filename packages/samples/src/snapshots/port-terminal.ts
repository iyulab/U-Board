// Example data written for the sample, not recorded from a source — no public source carries a terminal's operations.
// Keep it consistent: the quay moves per hour are the three berths' rates (52 + 38 + 0 = 90 into the yard), the cranes
// working are the berths' (4 + 3), QC-05 is the slow crane the alarm names, block E is the one over 85 % the yard
// alarm names, and the day's TEU is the hourly moves × 1.6 TEU a move.
import type { SampleSnapshot } from '../sample-pack.js';

const at = '2026-10-20T05:58:00Z';

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-20T06:00:00.000Z',
  responses: {
    tos: {
      '/terminal/summary': {
        teuToday: 8420,
        berthOccupancy: 78.5,
        gmph: 31.4,
        yardUtilization: 72.3,
        gateQueue: 46,
        turnTime: 38,
        updatedAt: at,
      },
      '/terminal/berths': {
        value: [
          { id: 'B1', vessel: 'HANBADA STAR', state: 'working', done: 1840, total: 2600, progress: 71, etd: '21:30', cranes: 4, rate: 52, updatedAt: at },
          { id: 'B2', vessel: 'PACIFIC AURORA', state: 'working', done: 620, total: 1900, progress: 33, etd: '05:10 +1', cranes: 3, rate: 38, updatedAt: at },
          { id: 'B3', vessel: 'ORIENT PEARL', state: 'waiting', done: 0, total: 1200, progress: 0, etd: '접안 16:40', cranes: 0, rate: 0, updatedAt: at },
        ],
        updatedAt: at,
      },
      '/terminal/yard': {
        value: [
          { id: 'A', used: 81, updatedAt: at },
          { id: 'B', used: 74, updatedAt: at },
          { id: 'C', used: 66, updatedAt: at },
          { id: 'D', used: 58, updatedAt: at },
          { id: 'E', used: 91, updatedAt: at },
          { id: 'F', used: 45, updatedAt: at },
        ],
        updatedAt: at,
      },
      '/terminal/gate': { inPerHour: 64, outPerHour: 58, updatedAt: at },
      '/terminal/schedule': {
        value: [
          { berth: '1번 선석', vessel: 'HANBADA STAR', start: '2026-10-19T23:00:00Z', end: '2026-10-20T12:30:00Z' },
          { berth: '1번 선석', vessel: 'NORDIC WAVE', start: '2026-10-20T14:00:00Z', end: '2026-10-21T02:00:00Z' },
          { berth: '2번 선석', vessel: 'PACIFIC AURORA', start: '2026-10-20T03:30:00Z', end: '2026-10-20T20:10:00Z' },
          { berth: '3번 선석', vessel: 'SEOHAE 3', start: '2026-10-19T22:00:00Z', end: '2026-10-20T04:30:00Z' },
          { berth: '3번 선석', vessel: 'ORIENT PEARL', start: '2026-10-20T07:40:00Z', end: '2026-10-20T19:00:00Z' },
        ],
        updatedAt: at,
      },
      '/terminal/cranes': {
        value: [
          { crane: 'QC-01', mph: 34 },
          { crane: 'QC-02', mph: 33 },
          { crane: 'QC-03', mph: 31 },
          { crane: 'QC-04', mph: 35 },
          { crane: 'QC-05', mph: 21 },
          { crane: 'QC-06', mph: 30 },
          { crane: 'QC-07', mph: 32 },
        ],
        updatedAt: at,
      },
      '/terminal/alarms': {
        value: [
          { time: '14:52', text: 'QC-05 스프레더 경보 — 점검 중', level: '주의' },
          { time: '14:31', text: 'E 블록 장치율 90 % 초과', level: '주의' },
          { time: '14:05', text: '게이트 3번 레인 판독기 재시작', level: '정보' },
          { time: '13:48', text: 'ORIENT PEARL 도선 승선 완료', level: '정보' },
        ],
        updatedAt: at,
      },
      '/terminal/hourly': {
        value: [
          { hour: '2026-10-19T18:00:00Z', moves: 402, target: 420 },
          { hour: '2026-10-19T20:00:00Z', moves: 436, target: 420 },
          { hour: '2026-10-19T22:00:00Z', moves: 451, target: 420 },
          { hour: '2026-10-20T00:00:00Z', moves: 418, target: 420 },
          { hour: '2026-10-20T02:00:00Z', moves: 372, target: 420 },
          { hour: '2026-10-20T04:00:00Z', moves: 445, target: 420 },
        ],
        updatedAt: at,
      },
    },
  },
};
