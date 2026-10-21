// Example data written for the sample — the farm, its turbines and its numbers are made up. Keep it consistent: it is
// 14:10 on a Thursday with a steady 9 m/s westerly. Twelve 10 MW turbines; nine generating (C2 curtailed for a passing
// flock), A3 under maintenance with a service vessel alongside, B4 cut off by a fault on the B3–B4 cable, C4 stopped on a
// pitch fault. Output now is the sum of the nine, 76.7 MW; today's energy is the sum of the hourly averages from 0:00 to
// 14:00, 1,019 MWh.
import type { SampleSnapshot } from '../sample-pack.js';

const at = '2026-10-22T05:10:00Z';

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-22T05:10:12.000Z',
  responses: {
    farm: {
      '/farm/now': { value: { series: '해도 · 축척 1:50,000', name: '누리 해상풍력단지', sub: '설비 120 MW · 10 MW × 12기', date: '10월 22일 목요일', time: '14:10' }, updatedAt: at },
      '/farm/turbines': {
        value: {
          a1: { name: 'A1', state: 'run', mw: '9.1 MW', note: '정상' },
          a2: { name: 'A2', state: 'run', mw: '8.8 MW', note: '정상' },
          a3: { name: 'A3', state: 'service', mw: '0 MW', note: '정기 정비' },
          a4: { name: 'A4', state: 'run', mw: '9.4 MW', note: '정상' },
          b1: { name: 'B1', state: 'run', mw: '8.9 MW', note: '정상' },
          b2: { name: 'B2', state: 'run', mw: '9.0 MW', note: '정상' },
          b3: { name: 'B3', state: 'run', mw: '8.7 MW', note: '정상' },
          b4: { name: 'B4', state: 'fault', mw: '0 MW', note: '케이블 고장' },
          c1: { name: 'C1', state: 'run', mw: '8.6 MW', note: '정상' },
          c2: { name: 'C2', state: 'limit', mw: '5.0 MW', note: '철새 감속' },
          c3: { name: 'C3', state: 'run', mw: '9.2 MW', note: '정상' },
          c4: { name: 'C4', state: 'fault', mw: '0 MW', note: '피치 오류' },
        },
        updatedAt: at,
      },
      '/farm/cables': {
        value: {
          a0: { state: 'ok' }, a1: { state: 'ok' }, a2: { state: 'ok' }, a3: { state: 'ok' },
          b0: { state: 'ok' }, b1: { state: 'ok' }, b2: { state: 'ok' }, b3: { state: 'fault' },
          c0: { state: 'ok' }, c1: { state: 'ok' }, c2: { state: 'ok' }, c3: { state: 'ok' },
          export: { state: 'ok' },
        },
        updatedAt: at,
      },
      '/farm/marks': {
        value: {
          oss: { kind: 'station', name: '해상 변전소', text: '154 kV · 정상' },
          shore: { kind: 'station', name: '육상 변전소', text: '정비 기지 · 계통 연계' },
          ctv1: { kind: 'vessel', name: '정비선 누리 1', text: 'A3 옆 · 작업 중' },
          ctv2: { kind: 'vessel', name: '정비선 누리 2', text: 'B4로 이동 · 8 kn' },
          buoy: { kind: 'buoy', name: '기상 부이', text: '서풍 9.2 m/s · 파고 1.4 m' },
        },
        updatedAt: at,
      },
      '/farm/figures': {
        value: [
          { label: '지금 출력', value: '76.7', note: 'MW / 120' },
          { label: '발전 중', value: '9', note: '기 / 12' },
          { label: '오늘 발전량', value: '1,019', note: 'MWh · 0–14시' },
        ],
        updatedAt: at,
      },
      '/farm/hours': {
        value: [
          { hour: '0시', mw: 62 }, { hour: '1시', mw: 65 }, { hour: '2시', mw: 70 }, { hour: '3시', mw: 74 }, { hour: '4시', mw: 71 },
          { hour: '5시', mw: 68 }, { hour: '6시', mw: 66 }, { hour: '7시', mw: 72 }, { hour: '8시', mw: 78 }, { hour: '9시', mw: 81 },
          { hour: '10시', mw: 80 }, { hour: '11시', mw: 79 }, { hour: '12시', mw: 77 }, { hour: '13시', mw: 76 },
        ],
        updatedAt: at,
      },
    },
  },
};
