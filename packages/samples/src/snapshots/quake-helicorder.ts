// Example data written for the sample — the network, its stations and the event are made up. Keep it consistent: it is
// 14:36 on a Thursday in late October. A small earthquake (magnitude 2.4) struck at 14:33 under the network's
// north-west: the nearest station crossed its alert level, two farther ones felt it, two did not, one has not reported
// since a power cut. Its row is the newest in the recent events; the week's count for Thursday includes it.
import type { SampleSnapshot } from '../sample-pack.js';

const at = '2026-10-22T05:36:00Z';

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-22T05:36:20.000Z',
  responses: {
    net: {
      '/net/now': { value: { series: 'SEISMIC NETWORK · 실시간 기록', name: '너울 지진 관측망', date: '10월 22일 목요일', time: '14:36' }, updatedAt: at },
      '/net/stations': {
        value: {
          a1: { code: 'NW-1', place: '북서 능선 · 암반', state: 'alert', word: '경보', pga: '8.6' },
          a2: { code: 'NW-2', place: '저수지 둑', state: 'felt', word: '감지', pga: '3.1' },
          a3: { code: 'N-3', place: '북쪽 터널 입구', state: 'felt', word: '감지', pga: '1.8' },
          a4: { code: 'C-4', place: '관측망 중심', state: 'calm', word: '평온', pga: '0.2' },
          a5: { code: 'SE-5', place: '남동 해안 절벽', state: 'calm', word: '평온', pga: '0.1' },
          a6: { code: 'S-6', place: '남쪽 계곡', state: 'offline', word: '끊김', pga: '—' },
        },
        updatedAt: at,
      },
      '/net/event': {
        value: {
          level: 'felt',
          kind: 'EVENT 2026-1022-01 · 자동 분석',
          title: '관측망 북서쪽 9 km 지진',
          magnitude: '2.4',
          time: '14:33:12',
          depth: '7 km',
          stations: '3 / 5',
          note: '경보 1곳(NW-1) · 감지 2곳 — 사람이 느낄 수 있는 흔들림은 NW-1 둘레뿐. 분석관 확인 대기.',
        },
        updatedAt: at,
      },
      '/net/figures': {
        value: [
          { label: '보고 중 관측소', value: '5 / 6', note: 'S-6 끊김 — 14:28부터' },
          { label: '최대 가속도', value: '8.6', note: 'gal — NW-1' },
          { label: '오늘 감지', value: '3', note: '건 — 규모 2 이상 1' },
        ],
        updatedAt: at,
      },
      '/net/recent': {
        value: [
          { when: '10-22 14:33', where: '관측망 북서쪽 9 km', magnitude: '2.4', state: 'new' },
          { when: '10-22 06:12', where: '남동 해안 앞바다 21 km', magnitude: '1.3', state: 'old' },
          { when: '10-22 02:47', where: '관측망 중심 아래', magnitude: '0.9', state: 'old' },
          { when: '10-21 23:05', where: '북쪽 14 km', magnitude: '1.1', state: 'old' },
          { when: '10-20 17:40', where: '남쪽 계곡 아래', magnitude: '1.6', state: 'old' },
        ],
        updatedAt: at,
      },
      '/net/week': {
        value: [
          { day: '월', events: 2 },
          { day: '화', events: 4 },
          { day: '수', events: 1 },
          { day: '목', events: 3 },
        ],
        updatedAt: at,
      },
    },
  },
};
