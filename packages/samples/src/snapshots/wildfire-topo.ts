// Example data written for the sample — the mountain and its posts are made up. Keep it consistent: it is 08:10 on a
// Friday in late October, a dry morning with a north-west wind. The camera on 범바위 caught a smoke at 07:52 on the
// slope below it; the tower on 갈매재 sees the same smoke from across the valley and is checking it; the crew is on its
// way and the helicopter is getting ready. The danger index climbs through the morning as the air dries.
import type { SampleSnapshot } from '../sample-pack.js';

const at = '2026-10-22T23:09:00Z';

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-22T23:10:00.000Z',
  responses: {
    watch: {
      '/watch/now': { value: { date: '10월 23일 금요일', time: '08:10', risk: '경계', level: 'high', note: '실효습도 31% · 북서풍' }, updatedAt: at },
      '/watch/posts': {
        value: {
          t1: { name: '솔매봉 감시탑', elev: '812', state: 'calm', word: '평온', view: '18', wind: '북서 4 m/s', time: '08:08' },
          t2: { name: '범바위 카메라', elev: '540', state: 'smoke', word: '연기 발견', view: '9', wind: '북서 5 m/s', time: '08:09' },
          t3: { name: '갈매재 감시탑', elev: '626', state: 'watch', word: '연기 확인 중', view: '14', wind: '서 3 m/s', time: '08:07' },
          t4: { name: '동막골 카메라', elev: '388', state: 'offline', word: '통신 끊김', view: '—', wind: '—', time: '07:31' },
          t5: { name: '큰골봉 감시탑', elev: '734', state: 'calm', word: '평온', view: '21', wind: '북서 6 m/s', time: '08:09' },
        },
        updatedAt: at,
      },
      '/watch/fire': { value: { title: '발화 의심 지점', seen: '07:52', area: '약 0.1 ha 추정', drift: '남동쪽으로' }, updatedAt: at },
      '/watch/bases': {
        value: {
          crew: { name: '진화대 대기소', status: '2조 출동 · 1조 대기' },
          heli: { name: '헬기 계류장', status: '이륙 준비 · 담수 확인' },
        },
        updatedAt: at,
      },
      '/watch/ways': {
        value: {
          crew: { state: 'moving', label: '진화대 2조 · 08:24 도착 예정' },
          heli: { state: 'ready', label: '헬기 · 08:20 이륙 예정' },
        },
        updatedAt: at,
      },
      '/watch/risk': {
        value: [
          { hour: '05시', index: 38 },
          { hour: '06시', index: 41 },
          { hour: '07시', index: 49 },
          { hour: '08시', index: 58 },
        ],
        updatedAt: at,
      },
      '/watch/crews': {
        value: [
          { name: '진화대 2조', what: '6명 · 범바위 아래로 이동', state: 'moving' },
          { name: '진화대 1조', what: '6명 · 대기소 대기', state: 'ready' },
          { name: '산불 헬기', what: '담수 2,000 L · 이륙 준비', state: 'ready' },
          { name: '감시원', what: '솔매봉·갈매재·큰골봉 근무', state: 'ready' },
          { name: '동막골 카메라', what: '현장 점검 요청 — 통신 장비', state: 'off' },
        ],
        updatedAt: at,
      },
    },
  },
};
