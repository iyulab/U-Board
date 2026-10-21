// Example data written for the sample — the hub, its lines and its parcels are made up. Keep it consistent: it is 23:40
// on a Thursday, the night sort; four trucks are being unloaded, line 3 has jammed at a merge and is being cleared, line
// 4 is down for a belt change, and the outbound carts for the busiest regions are nearly full. Parcels are counted
// through the scanners since 20:00.
import type { SampleSnapshot } from '../sample-pack.js';

const at = '2026-10-22T14:40:00Z';

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-22T14:40:20.000Z',
  responses: {
    hub: {
      '/hub/now': { name: '누리 소포 분류센터', sub: '야간 분류 · 20:00–06:00', date: '10월 22일 목요일', time: '23:40', updatedAt: at },
      '/hub/docks': {
        value: {
          d1: { name: '도크 1', state: 'unload', word: '하차 중', note: '수도권 간선 · 62%' },
          d2: { name: '도크 2', state: 'unload', word: '하차 중', note: '충청 간선 · 35%' },
          d3: { name: '도크 3', state: 'wait', word: '대기', note: '00:10 도착' },
          d4: { name: '도크 4', state: 'unload', word: '하차 중', note: '영남 간선 · 80%' },
          d5: { name: '도크 5', state: 'unload', word: '하차 중', note: '호남 간선 · 12%' },
          d6: { name: '도크 6', state: 'empty', word: '비어 있음', note: '다음 01:30' },
        },
        updatedAt: at,
      },
      '/hub/lines': {
        value: {
          l1: { name: '분류 라인 1', state: 'run', word: '가동', rate: '시간당 4,200개', note: '소형 · 봉투' },
          l2: { name: '분류 라인 2', state: 'run', word: '가동', rate: '시간당 3,900개', note: '중형 상자' },
          l3: { name: '분류 라인 3', state: 'jam', word: '정체', rate: '시간당 1,100개', note: '합류부 걸림 · 처리 중' },
          l4: { name: '분류 라인 4', state: 'stop', word: '정지', rate: '시간당 0개', note: '벨트 교체 · 00:30 재가동' },
        },
        updatedAt: at,
      },
      '/hub/rework': { value: { count: '146', note: '주소 불명 · 파손 확인' }, updatedAt: at },
      '/hub/chutes': {
        value: [
          { region: '서울 북부', fill: 86, state: 'near' },
          { region: '서울 남부', fill: 91, state: 'near' },
          { region: '경기 서부', fill: 64, state: 'ok' },
          { region: '경기 동부', fill: 58, state: 'ok' },
          { region: '강원', fill: 22, state: 'ok' },
          { region: '충청', fill: 47, state: 'ok' },
          { region: '영남', fill: 73, state: 'ok' },
          { region: '호남', fill: 31, state: 'ok' },
        ],
        updatedAt: at,
      },
      '/hub/figures': {
        value: [
          { label: '오늘 처리', value: '31,480', note: '개 — 20시부터' },
          { label: '지금 처리', value: '9,200', note: '개 / 시간' },
          { label: '재작업', value: '146', note: '개 대기' },
        ],
        updatedAt: at,
      },
      '/hub/hours': {
        value: [
          { hour: '20시', parcels: 7600 },
          { hour: '21시', parcels: 9800 },
          { hour: '22시', parcels: 8400 },
          { hour: '23시', parcels: 5680 },
        ],
        updatedAt: at,
      },
    },
  },
};
