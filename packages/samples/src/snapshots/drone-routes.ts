// Example data written for the sample — the islands, the service and its numbers are made up. Keep it consistent: it
// is 13:50 on a Thursday in late October. Two drones are in the air (to the north village and the clinic), two drops
// are due within the hour, the south school's is held for a 12 m/s southerly, two drops were made earlier. Today's
// drops so far are 14 — the hours in the chart add up to it.
import type { SampleSnapshot } from '../sample-pack.js';

const at = '2026-10-22T04:50:00Z';

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-22T04:50:20.000Z',
  responses: {
    fleet: {
      '/fleet/now': { value: { series: 'ISLAND AIR DELIVERY', name: '물결 군도 드론 배송', date: '10월 22일 목요일', time: '13:50' }, updatedAt: at },
      '/fleet/base': { value: { name: '본부 섬', word: '대기 3 · 충전 1' }, updatedAt: at },
      '/fleet/stops': {
        value: {
          light: { name: '등대섬', cargo: '우편 2 · 상비약 1', state: 'done', word: '13:32 도착', route: '완료' },
          north: { name: '북쪽 마을', cargo: '식료품 3.2 kg', state: 'flying', word: 'D-03 · 4분 뒤 도착', route: '도착 4분' },
          salt: { name: '염전', cargo: '펌프 부품 1.1 kg', state: 'due', word: '14:10 출발 · D-05', route: '14:10 출발' },
          clinic: { name: '동쪽 진료소', cargo: '검체 수거 · 냉장', state: 'flying', word: 'D-04 · 7분 뒤 도착', route: '도착 7분' },
          school: { name: '남쪽 학교', cargo: '교재 2 kg', state: 'hold', word: '남풍 12 m/s · 보류', route: '바람 보류' },
          harbour: { name: '어촌', cargo: '그물 수선 실 0.8 kg', state: 'due', word: '14:25 출발 · D-02', route: '14:25 출발' },
          farm: { name: '서쪽 양식장', cargo: '수질 시약 0.5 kg', state: 'done', word: '12:58 도착', route: '완료' },
        },
        updatedAt: at,
      },
      '/fleet/figures': {
        value: [
          { label: '오늘 배송', value: '14', note: '건 — 13:50까지' },
          { label: '비행 중', value: '2', note: '대 — 북쪽·진료소' },
          { label: '보류', value: '1', note: '남쪽 학교 — 바람' },
        ],
        updatedAt: at,
      },
      '/fleet/drones': {
        value: [
          { id: 'D-01', job: '충전 중 — 15:00 준비', battery: 42, state: 'charging' },
          { id: 'D-02', job: '대기 — 14:25 어촌', battery: 100, state: 'standby' },
          { id: 'D-03', job: '비행 — 북쪽 마을', battery: 61, state: 'flying' },
          { id: 'D-04', job: '비행 — 동쪽 진료소', battery: 74, state: 'flying' },
          { id: 'D-05', job: '대기 — 14:10 염전', battery: 95, state: 'standby' },
          { id: 'D-06', job: '대기 — 남쪽 학교 보류', battery: 98, state: 'standby' },
        ],
        updatedAt: at,
      },
      '/fleet/drops': {
        value: [
          { hour: '08', drops: 1 },
          { hour: '09', drops: 3 },
          { hour: '10', drops: 2 },
          { hour: '11', drops: 4 },
          { hour: '12', drops: 2 },
          { hour: '13', drops: 2 },
        ],
        updatedAt: at,
      },
    },
  },
};
