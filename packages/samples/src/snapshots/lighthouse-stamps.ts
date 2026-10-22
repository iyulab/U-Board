// Example data written for the sample — the coast and its lights are made up. Keep it consistent: it is 05:40 on a
// Friday in late October, a foggy dawn. Fog has closed in on the outer islands overnight (the visibility falls through
// the night), so the two outermost lights are sounding their fog signals; one light is out since 03:12 and is the round's
// first stop; one is being serviced as planned.
import type { SampleSnapshot } from '../sample-pack.js';

const at = '2026-10-22T20:39:00Z';

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-22T20:40:00.000Z',
  responses: {
    lights: {
      '/lights/now': { value: { date: '10월 23일 금요일', time: '05:40', count: '8', summary: '안개 주의보 · 소등 1기' }, updatedAt: at },
      '/lights/stations': {
        value: {
          s1: { name: '갈매도 등대', range: '22', character: 'Fl W 10s', state: 'ok', word: '정상 점등', mark: '', note: '점검 10.20', time: '05:38' },
          s2: { name: '솔미도 등대', range: '18', character: 'Fl(2) W 15s', state: 'ok', word: '정상 점등', mark: '', note: '점검 10.18', time: '05:38' },
          s3: { name: '먼여 등대', range: '24', character: 'Fl W 12s', state: 'fog', word: '안개 신호 작동', mark: '', note: '시정 0.6 km', time: '05:39' },
          s4: { name: '새바위 등대', range: '15', character: 'Fl R 4s', state: 'out', word: '소등', mark: '소등', note: '03:12부터 — 전원 이상', time: '05:39' },
          s5: { name: '흑돌도 등대', range: '20', character: 'Fl G 6s', state: 'service', word: '정비 중', mark: '정비', note: '렌즈 청소 — 예비등 점등', time: '05:36' },
          s6: { name: '달무리섬 등대', range: '19', character: 'Iso W 6s', state: 'fog', word: '안개 신호 작동', mark: '', note: '시정 0.9 km', time: '05:38' },
          s7: { name: '물개섬 등대', range: '16', character: 'Oc R 5s', state: 'ok', word: '정상 점등', mark: '', note: '점검 10.21', time: '05:37' },
          s8: { name: '매바위 등대', range: '17', character: 'Q W', state: 'ok', word: '정상 점등', mark: '', note: '점검 10.19', time: '05:38' },
        },
        updatedAt: at,
      },
      '/lights/visibility': {
        value: [
          { hour: '22시', km: 9.5 },
          { hour: '23시', km: 8.2 },
          { hour: '00시', km: 6.4 },
          { hour: '01시', km: 4.8 },
          { hour: '02시', km: 3.1 },
          { hour: '03시', km: 2.0 },
          { hour: '04시', km: 1.2 },
          { hour: '05시', km: 0.7 },
        ],
        updatedAt: at,
      },
      '/lights/round': {
        value: [
          { at: '06:10', what: '새바위 — 전원 점검, 예비 전지 교체', state: 'now' },
          { at: '07:30', what: '흑돌도 — 렌즈 청소 마무리, 본등 복귀', state: 'next' },
          { at: '09:00', what: '먼여·달무리섬 — 안개 신호 작동 기록', state: 'next' },
          { at: '05:00', what: '관리소 — 야간 점등 기록 확인', state: 'done' },
        ],
        updatedAt: at,
      },
    },
  },
};
