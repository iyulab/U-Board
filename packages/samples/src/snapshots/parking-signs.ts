// Example data written for the sample — the car park, its floors and its numbers are made up. Keep it consistent: it is
// 14:20 on a Thursday; 570 bays on seven floors, B4 (90) closed for repainting, so 480 in use. Free: 3F 34, 2F 9, 1F 0,
// B1 0, B2 6, B3 38 — 87 in all, 393 taken (82%, the last point of the hours chart). A floor under 15% free is busy. The
// kept bays sit in their floors' counts: the electric-car bays on B3 (3 of 12 free), the disabled and small-car bays on
// 1F (none free, as the floor is full).
import type { SampleSnapshot } from '../sample-pack.js';

const at = '2026-10-22T05:20:00Z';

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-22T05:20:15.000Z',
  responses: {
    park: {
      '/park/now': { name: '누리로 공영주차장', en: 'Nuri-ro Public Parking', date: '10월 22일 목요일', time: '14:20', updatedAt: at },
      '/park/total': { value: { label: '지금 빈 면', free: '87', note: '운영 480면 · B4 폐쇄' }, updatedAt: at },
      '/park/floors': {
        value: {
          f3: { name: '3F', state: 'free', word: '여유', free: '34', note: '옥상 · 60면' },
          f2: { name: '2F', state: 'busy', word: '혼잡', free: '9', note: '80면' },
          f1: { name: '1F', state: 'full', word: '만차', free: '0', note: '70면 · 장애인·경차' },
          b1: { name: 'B1', state: 'full', word: '만차', free: '0', note: '90면' },
          b2: { name: 'B2', state: 'busy', word: '혼잡', free: '6', note: '90면' },
          b3: { name: 'B3', state: 'free', word: '여유', free: '38', note: '90면 · 전기차 충전' },
          b4: { name: 'B4', state: 'shut', word: '폐쇄', free: '—', note: '바닥 도색 · 10/24까지' },
        },
        updatedAt: at,
      },
      '/park/bays': {
        value: [
          { mark: '⚡', label: '전기차 충전', free: '3 / 12', note: 'B3 · 충전 중 9' },
          { mark: '♿', label: '장애인 전용', free: '0 / 6', note: '1F 승강기 앞' },
          { mark: '경', label: '경차 전용', free: '0 / 10', note: '1F 입구 쪽' },
        ],
        updatedAt: at,
      },
      '/park/figures': {
        value: [
          { label: '점유율', value: '82%', note: '393 / 480면' },
          { label: '오늘 입차', value: '1,246', note: '대 — 0시부터' },
          { label: '평균 주차', value: '2:10', note: '시간:분' },
        ],
        updatedAt: at,
      },
      '/park/notices': {
        value: [{ text: '1F·B1 만차 — 3F 또는 B3로 가세요' }, { text: 'B4 바닥 도색으로 10월 24일까지 폐쇄' }],
        updatedAt: at,
      },
      '/park/hours': {
        value: [
          { hour: '7시', occupied: 18 },
          { hour: '8시', occupied: 41 },
          { hour: '9시', occupied: 63 },
          { hour: '10시', occupied: 74 },
          { hour: '11시', occupied: 81 },
          { hour: '12시', occupied: 86 },
          { hour: '13시', occupied: 84 },
          { hour: '14시', occupied: 82 },
        ],
        updatedAt: at,
      },
    },
  },
};
