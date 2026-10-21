// Example data written for the sample — the harbour, its islands and its ferries are made up. Keep it consistent: it is
// 14:30 on a Wednesday in late October; a gale warning stands on the open sea beyond the lighthouse island, so the
// far island's run is cancelled and the gull island's waits at the rock island for the swell to drop. The inner runs
// sail on time. The day's count is the passengers boarded at every pier so far.
import type { SampleSnapshot } from '../sample-pack.js';

const at = '2026-10-21T05:30:00Z';

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-21T05:30:20.000Z',
  responses: {
    ferry: {
      '/ferry/now': { name: '해솔항 여객선', sub: '섬 항로 운항 현황', date: '10월 21일 수요일', time: '14:30', updatedAt: at },
      '/ferry/piers': {
        port: { name: '해솔항', status: 'ok', word: '운항', next: '15:00', ship: '해솔1호 → 솔섬' },
        sol: { name: '솔섬', status: 'ok', word: '운항', next: '15:40', ship: '해솔1호 → 해솔항' },
        sand: { name: '모래섬', status: 'ok', word: '운항', next: '15:20', ship: '모래섬호 → 해솔항' },
        rock: { name: '큰바위섬', status: 'ok', word: '운항', next: '15:10', ship: '새벽별호 → 해솔항' },
        light: { name: '등대섬', status: 'delay', word: '지연', next: '16:00', ship: '솔바람호 → 솔섬' },
        gull: { name: '갈매기섬', status: 'delay', word: '지연', next: '16:30', ship: '갈매기호 · 너울 대기' },
        far: { name: '먼섬', status: 'cancel', word: '결항', next: '내일 07:30', ship: '풍랑주의보' },
        updatedAt: at,
      },
      '/ferry/routes': {
        'port-sol': { status: 'ok', label: '15:00' },
        'port-sand': { status: 'ok', label: '15:20' },
        'port-rock': { status: 'ok', label: '15:10' },
        'sol-light': { status: 'delay', label: '16:00 · 20분 지연' },
        'rock-gull': { status: 'delay', label: '너울 대기' },
        'light-far': { status: 'cancel', label: '결항' },
        updatedAt: at,
      },
      '/ferry/sea': {
        value: [
          { label: '파고', value: '2.4', unit: 'm', level: 4, note: '먼바다 · 주의보 3.0' },
          { label: '풍속', value: '13', unit: 'm/s', level: 3, note: '북서 · 돌풍 18' },
          { label: '시정', value: '9', unit: 'km', level: 1, note: '맑음' },
        ],
        warning: '먼바다 풍랑주의보 · 11시 발효',
        updatedAt: at,
      },
      '/ferry/departures': {
        value: [
          { time: '15:00', route: '해솔항 → 솔섬', ship: '해솔1호', word: '운항', status: 'ok' },
          { time: '15:10', route: '큰바위섬 → 해솔항', ship: '새벽별호', word: '운항', status: 'ok' },
          { time: '15:20', route: '모래섬 → 해솔항', ship: '모래섬호', word: '운항', status: 'ok' },
          { time: '16:00', route: '등대섬 → 솔섬', ship: '솔바람호', word: '20분 지연', status: 'delay' },
          { time: '16:30', route: '큰바위섬 → 갈매기섬', ship: '갈매기호', word: '너울 대기', status: 'delay' },
          { time: '16:40', route: '등대섬 → 먼섬', ship: '솔바람호', word: '결항', status: 'cancel' },
        ],
        updatedAt: at,
      },
      '/ferry/boarded': {
        value: [
          { hour: '7시', people: 120 },
          { hour: '8시', people: 340 },
          { hour: '9시', people: 410 },
          { hour: '10시', people: 380 },
          { hour: '11시', people: 260 },
          { hour: '12시', people: 190 },
          { hour: '13시', people: 310 },
          { hour: '14시', people: 280 },
        ],
        updatedAt: at,
      },
    },
  },
};
