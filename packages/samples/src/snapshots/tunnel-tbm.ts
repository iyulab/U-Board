// Example data written for the sample, not recorded from a source — no public source carries a TBM's data.
// Keep it consistent: it is 14:26 on a Wednesday's day shift and the machine is building ring 984 of 1,433 (1.5 m a
// ring, so its face stands at 1,476 m of 2,150). Settlement grows behind the face and is nearly nothing ahead of it:
// the point 96 m back has just passed the second management level (12 mm), the one 196 m back sits between the two,
// and the stream bed starts 124 m ahead. Sunday's four rings are the day the cutters were changed. The face pressure
// is a little under its target, which is why the crew raised the conditioning; the air is clean.
import type { SampleSnapshot } from '../sample-pack.js';

const at = '2026-10-21T05:26:00Z';

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-21T05:30:00.000Z',
  responses: {
    tbm: {
      '/tbm/now': { project: '도시철도 연장 3공구 — 쉴드 TBM 굴진', machine: 'EPB Ø7.8 m · TBM-1', shift: '주간 2조', time: '14:26', state: '굴진 중', updatedAt: at },
      '/tbm/events': {
        value: [
          { time: '14:12', text: 'SP-03 지표 침하 12.6 mm — 2차 관리 기준(12 mm) 넘음 · 계측 1시간 → 15분', level: 'alarm' },
          { time: '13:40', text: '막장압 2.18 bar — 목표 2.30 bar 아래 · 첨가재 주입 상향', level: 'watch' },
          { time: '11:05', text: '링 983 조립 완료 · 뒤채움 주입 정상', level: 'info' },
        ],
        updatedAt: at,
      },
      '/tbm/settlement': {
        value: [
          { id: 'SP-01', mm: 5.2, updatedAt: at },
          { id: 'SP-02', mm: 8.9, updatedAt: at },
          { id: 'SP-03', mm: 12.6, updatedAt: at },
          { id: 'SP-04', mm: 7.4, updatedAt: at },
          { id: 'SP-05', mm: 1.2, updatedAt: at },
          { id: 'SP-06', mm: 0, updatedAt: at },
        ],
      },
      '/tbm/progress': { ring: 984, total: 1433, pct: 68.7, today: 6, perDay: 9.6, toRiver: 124, breakthrough: '12월 첫째 주', updatedAt: at },
      '/tbm/daily': {
        value: [
          { day: '10/15', rings: 9 },
          { day: '10/16', rings: 10 },
          { day: '10/17', rings: 8 },
          { day: '10/18', rings: 4 },
          { day: '10/19', rings: 11 },
          { day: '10/20', rings: 10 },
          { day: '10/21', rings: 6 },
        ],
        updatedAt: at,
      },
      '/tbm/machine': {
        title: 'TBM-1 · 막장 링 984',
        value: [
          { label: '커터헤드 토크', value: '4.1', unit: 'MN·m', pct: 68, state: 'ok' },
          { label: '총 추력', value: '28.4', unit: 'MN', pct: 71, state: 'ok' },
          { label: '막장압(토압)', value: '2.18', unit: 'bar', pct: 95, state: 'watch' },
          { label: '굴진 속도', value: '42', unit: 'mm/min', pct: 70, state: 'ok' },
          { label: '커터헤드 회전', value: '1.6', unit: 'rpm', pct: 53, state: 'ok' },
          { label: '방향 편차 수평/수직', value: '+18 / −6', unit: 'mm', pct: 36, state: 'ok' },
        ],
        updatedAt: at,
      },
      '/tbm/air': {
        value: [
          { label: '산소', value: '20.6', unit: '%', state: 'ok' },
          { label: '메탄', value: '0', unit: '%LEL', state: 'ok' },
          { label: '일산화탄소', value: '8', unit: 'ppm', state: 'ok' },
          { label: '황화수소', value: '0', unit: 'ppm', state: 'ok' },
          { label: '막장 온도', value: '27.4', unit: '°C', state: 'ok' },
          { label: '환기 풍량', value: '1,240', unit: 'm³/min', state: 'ok' },
        ],
        updatedAt: at,
      },
    },
  },
};
