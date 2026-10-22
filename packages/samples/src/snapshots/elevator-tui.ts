// Example data written for the sample — the tower, its lifts and its numbers are made up. Keep it consistent: it is
// 12:05 on a Thursday in late October, the lunch rush down to the ground floor. Four cars run, one waits at the ground
// floor, one is in service mode for its door sensor. Car E stopped between floors at 14 at 12:03 with two people in
// it; the call to the maintenance company went out at once. Long waits in the hall calls come from that.
import type { SampleSnapshot } from '../sample-pack.js';

const at = '2026-10-22T03:05:00Z';

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-22T03:05:20.000Z',
  responses: {
    lift: {
      '/lift/now': { value: { series: 'LIFT GROUP CONTROL · 저층·고층 겸용', name: '한울 타워 승강기 관제', date: '10월 22일 목요일', time: '12:05' }, updatedAt: at },
      '/lift/cars': {
        value: {
          a: { id: 'A', floor: 3, state: 'down', load: 80, word: '하강 · 만원 근접' },
          b: { id: 'B', floor: 11, state: 'down', load: 55, word: '하강 중' },
          c: { id: 'C', floor: 1, state: 'idle', load: 0, word: '1층 대기' },
          d: { id: 'D', floor: 18, state: 'up', load: 20, word: '상승 중' },
          e: { id: 'E', floor: 14, state: 'trapped', load: 15, word: '갇힘 2명 · 12:03' },
          f: { id: 'F', floor: 22, state: 'service', load: 0, word: '정비 · 문 센서' },
        },
        updatedAt: at,
      },
      '/lift/figures': {
        value: [
          { label: '운행 중', value: '4 / 6', note: '대기 1 · 정비 1' },
          { label: '평균 대기', value: '48초', note: '점심 시간대' },
          { label: '갇힘 경보', value: '1', note: 'E호기 — 출동 중' },
        ],
        updatedAt: at,
      },
      '/lift/calls': {
        value: [
          { floor: '19층', dir: '▼', wait: '2분 10초', car: '배정 D', state: 'long' },
          { floor: '15층', dir: '▼', wait: '1분 35초', car: '배정 B', state: 'long' },
          { floor: '8층', dir: '▼', wait: '25초', car: '배정 B', state: 'normal' },
          { floor: '1층', dir: '▲', wait: '5초', car: '배정 C', state: 'normal' },
        ],
        updatedAt: at,
      },
      '/lift/log': {
        value: [
          { time: '12:03:41', text: 'E호기 14층 정지 — 갇힘 2명, 인터폰 연결', state: 'alarm' },
          { time: '12:03:55', text: '유지보수 업체 출동 요청 — 도착 예정 12:20', state: 'info' },
          { time: '11:40:12', text: 'F호기 정비 모드 — 문 센서 점검', state: 'info' },
        ],
        updatedAt: at,
      },
      '/lift/trips': {
        value: [
          { hour: '07', trips: 64 },
          { hour: '08', trips: 182 },
          { hour: '09', trips: 151 },
          { hour: '10', trips: 88 },
          { hour: '11', trips: 97 },
          { hour: '12', trips: 41 },
        ],
        updatedAt: at,
      },
    },
  },
};
