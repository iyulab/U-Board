// Example data written for the sample — the dam, its gates and its numbers are made up. Keep it consistent: it is 13:40
// on a Thursday after heavy autumn rain. Gates 1 and 2 are 40 % open (120 m³/s each), gate 6 20 % (60 m³/s), gates 3
// and 4 shut, gate 5 out for repair after a hydraulic alarm — 300 m³/s through the gates, with 50 m³/s through the
// turbines, is the 350 m³/s discharged now. The inflow is greater, so the level still rises, below the normal high
// water mark. The marks on the sight glass are placed on a 70–85 m scale. The last hour's bar is the discharge now.
import type { SampleSnapshot } from '../sample-pack.js';

const at = '2026-10-22T04:40:00Z';

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-22T04:40:20.000Z',
  responses: {
    dam: {
      '/dam/now': { value: { series: '수문 운영 · 기관실', name: '누리댐', date: '10월 22일 목요일', time: '13:40' }, updatedAt: at },
      '/dam/gates': {
        value: {
          g1: { name: '1번 수문', state: 'open', open: 40, word: '방류', flow: '120 m³/s' },
          g2: { name: '2번 수문', state: 'open', open: 40, word: '방류', flow: '120 m³/s' },
          g3: { name: '3번 수문', state: 'shut', open: 0, word: '닫힘', flow: '0 m³/s' },
          g4: { name: '4번 수문', state: 'shut', open: 0, word: '닫힘', flow: '0 m³/s' },
          g5: { name: '5번 수문', state: 'fault', open: 0, word: '점검', flow: '유압 경보 — 닫힘 유지' },
          g6: { name: '6번 수문', state: 'open', open: 20, word: '방류', flow: '60 m³/s' },
        },
        updatedAt: at,
      },
      '/dam/reservoir': {
        value: {
          el: 'EL 79.3 m',
          level: 62,
          note: '시간당 +4 cm',
          marks: [
            { kind: 'flood', at: 80, label: '홍수위 82.0' },
            { kind: 'high', at: 66.7, label: '상시만수 80.0' },
            { kind: 'low', at: 20, label: '저수위 73.0' },
          ],
        },
        updatedAt: at,
      },
      '/dam/log': {
        value: [
          { time: '13:10', text: '6번 수문 20 % 개방 — 유입 증가', state: 'info' },
          { time: '12:30', text: '5번 수문 유압 경보 — 닫힘 유지, 점검반 출동', state: 'alarm' },
          { time: '11:00', text: '1·2번 수문 40 %로 올림', state: 'info' },
          { time: '10:20', text: '하류 경보 방송 — 둔치 출입 통제 요청', state: 'warn' },
          { time: '09:40', text: '1·2번 수문 20 % 개방 시작', state: 'info' },
          { time: '09:00', text: '방류 계획 승인 — 최대 400 m³/s', state: 'warn' },
          { time: '06:00', text: '발전 방류 50 m³/s 유지', state: 'info' },
        ],
        updatedAt: at,
      },
      '/dam/figures': {
        value: [
          { label: '유입량', value: '420', note: 'm³/s — 상류 3곳 합' },
          { label: '총 방류', value: '350', note: '수문 300 · 발전 50' },
          { label: '저수율', value: '71 %', note: '상시만수 대비' },
        ],
        updatedAt: at,
      },
      '/dam/discharge': {
        value: [
          { hour: '06시', discharge: 50 },
          { hour: '07시', discharge: 50 },
          { hour: '08시', discharge: 50 },
          { hour: '09시', discharge: 50 },
          { hour: '10시', discharge: 170 },
          { hour: '11시', discharge: 290 },
          { hour: '12시', discharge: 290 },
          { hour: '13시', discharge: 350 },
        ],
        updatedAt: at,
      },
    },
  },
};
