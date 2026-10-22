// Example data written for the sample — the hub, its chargers and its numbers are made up. Keep it consistent: it is
// 18:20 on a Thursday in late October, the evening peak. Of eight chargers five are charging (1,007 kW between them),
// one stands free and has a car on its way to it, one holds a car that finished charging six minutes ago, one is down.
// The battery gives 300 kW, so the grid intake carries 707 kW of its 1,200 kW contract. Two cars wait for an
// ultra-fast charger — the B row — which is why the free A charger does not take them.
import type { SampleSnapshot } from '../sample-pack.js';

const at = '2026-10-22T09:20:00Z';

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-22T09:20:20.000Z',
  responses: {
    hub: {
      '/hub/now': { value: { series: 'EV CHARGING HUB · 상행', name: '솔내 충전 허브', date: '10월 22일 목요일', time: '18:20' }, updatedAt: at },
      '/hub/chargers': {
        value: {
          a1: { ref: 'A1', kind: '급속 · 200 kW', state: 'charging', word: '충전 중', kw: 182, soc: 41, note: '충전량 41% · 약 22분 남음' },
          a2: { ref: 'A2', kind: '급속 · 200 kW', state: 'charging', word: '충전 중', kw: 96, soc: 84, note: '84% — 속도 줄이는 중' },
          a3: { ref: 'A3', kind: '급속 · 200 kW', state: 'free', word: '비어 있음', kw: 0, soc: 0, note: '대기 1번 차량 이동 중' },
          a4: { ref: 'A4', kind: '급속 · 200 kW', state: 'fault', word: '고장', kw: 0, soc: 0, note: '케이블 냉각 경보 — 출동 19:00' },
          b1: { ref: 'B1', kind: '초급속 · 350 kW', state: 'charging', word: '충전 중', kw: 310, soc: 22, note: '충전량 22% · 약 18분 남음' },
          b2: { ref: 'B2', kind: '초급속 · 350 kW', state: 'charging', word: '충전 중', kw: 248, soc: 57, note: '충전량 57% · 약 9분 남음' },
          b3: { ref: 'B3', kind: '초급속 · 350 kW', state: 'blocking', word: '출차 대기', kw: 0, soc: 100, note: '완충 6분 경과 · 유휴 요금' },
          b4: { ref: 'B4', kind: '초급속 · 350 kW', state: 'charging', word: '충전 중', kw: 171, soc: 78, note: '충전량 78% · 약 6분 남음' },
        },
        updatedAt: at,
      },
      '/hub/intake': { value: { limit: '1,200', kw: 707, pct: 59, word: '계약 전력의 59%' }, updatedAt: at },
      '/hub/battery': { value: { capacity: 600, kw: 300, soc: 46, mode: 'discharging', word: '방전' }, updatedAt: at },
      '/hub/figures': {
        value: [
          { label: '지금 충전 전력', value: '1,007', note: 'kW — 5기 합' },
          { label: '충전 중', value: '5 / 8', note: '비어 있음 1 · 고장 1' },
          { label: '대기 차량', value: '3', note: '대 — 초급속 2' },
        ],
        updatedAt: at,
      },
      '/hub/queue': {
        value: [
          { pin: '1', car: '중형 SUV', wants: 'A3 배정 · 이동 중', wait: '0분', state: 'next' },
          { pin: '2', car: '승용', wants: '초급속 B 대기', wait: '6분', state: 'waiting' },
          { pin: '3', car: '1톤 화물', wants: '초급속 B 대기', wait: '11분', state: 'waiting' },
        ],
        updatedAt: at,
      },
      '/hub/today': {
        value: [
          { hour: '06', kwh: 410 },
          { hour: '07', kwh: 620 },
          { hour: '08', kwh: 780 },
          { hour: '09', kwh: 690 },
          { hour: '10', kwh: 540 },
          { hour: '11', kwh: 720 },
          { hour: '12', kwh: 940 },
          { hour: '13', kwh: 880 },
          { hour: '14', kwh: 610 },
          { hour: '15', kwh: 580 },
          { hour: '16', kwh: 700 },
          { hour: '17', kwh: 910 },
          { hour: '18', kwh: 990 },
        ],
        updatedAt: at,
      },
    },
  },
};
