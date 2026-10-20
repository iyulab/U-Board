// Example data written for the sample, not recorded from a source — no public source carries a festival's floor.
// Keep it consistent: it is 19:42 on a fireworks night, eighteen minutes before the show; the crowd is near its peak,
// the viewing deck by the river is packed (the one area past 4 people a square metre) and the gate beside it busy,
// the shuttle to the station has its longest queue, and the wind is low enough for the launch to go ahead.
import type { SampleSnapshot } from '../sample-pack.js';

const at = '2026-10-21T10:42:00Z';

const zone = (id: string, density: number, people: number, note: string) => ({ id, density, people, note, updatedAt: at });
const gate = (name: string, inbound: number, outbound: number, load: number, level: string) => ({ name, inbound, outbound, load, level });
const route = (name: string, next: number, queue: number, load: number, level: string) => ({ name, next, queue, load, level });

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-21T10:42:20.000Z',
  responses: {
    festival: {
      '/festival/now': {
        title: '강변 빛축제 종합 상황판',
        phase: '불꽃 쇼 18분 전',
        time: '19:42',
        crowd: 86420,
        limit: 100000,
        share: 86.4,
        total: 128310,
        trend: '+2,140명',
        updatedAt: at,
      },
      '/festival/zones': {
        value: [
          zone('stage', 3.1, 18600, '공연 중 · 밴드 무대'),
          zone('food', 2.4, 9800, '대기 줄 평균 12분'),
          zone('lawn', 1.6, 24400, '돗자리 구역 여유'),
          zone('deck', 4.6, 7350, '진입 통제 · 우회 안내 중'),
        ],
        updatedAt: at,
      },
      '/festival/flow': {
        value: [
          { time: '16:00', inbound: 6200, outbound: 900 },
          { time: '17:00', inbound: 14800, outbound: 2100 },
          { time: '18:00', inbound: 23600, outbound: 3400 },
          { time: '19:00', inbound: 31200, outbound: 4700 },
          { time: '19:40', inbound: 18900, outbound: 2600 },
        ],
        updatedAt: at,
      },
      '/festival/visitors': {
        value: [
          { group: '20대', share: 31 },
          { group: '30대', share: 24 },
          { group: '40대', share: 18 },
          { group: '10대 이하', share: 15 },
          { group: '50대 이상', share: 12 },
        ],
        updatedAt: at,
      },
      '/festival/gates': {
        value: [
          gate('1번 출입구', 1420, 210, 62, 'free'),
          gate('2번 출입구', 1980, 260, 78, 'busy'),
          gate('3번 출입구', 2310, 180, 94, 'packed'),
          gate('4번 출입구', 860, 340, 41, 'free'),
          gate('5번 출입구', 1240, 150, 55, 'free'),
          gate('6번 출입구', 1690, 230, 71, 'busy'),
        ],
        updatedAt: at,
      },
      '/festival/shuttles': {
        value: [
          route('역 방면 A', 3, 640, 98, 'packed'),
          route('역 방면 B', 6, 280, 84, 'busy'),
          route('주차장 1', 4, 120, 61, 'free'),
          route('주차장 2', 8, 90, 47, 'free'),
          route('시청 순환', 5, 210, 73, 'busy'),
        ],
        updatedAt: at,
      },
      '/festival/incidents': {
        value: [
          { time: '19:38', kind: '관람석 밀집', place: '불꽃 관람석 · 진입로', state: '통제 중', level: 'alert' },
          { time: '19:31', kind: '미아 신고', place: '먹거리 거리 3구역', state: '보호 중', level: 'warn' },
          { time: '19:24', kind: '응급 처치', place: '메인 무대 앞', state: '이송 완료', level: 'info' },
          { time: '19:12', kind: '분실물', place: '2번 출입구', state: '보관', level: 'info' },
        ],
        updatedAt: at,
      },
      '/festival/weather': { temp: 16.8, wind: 2.6, gust: 4.1, humidity: 58, go: '발사 가능', launch: '20:00 발사 · 순간 최대 8m/s 넘으면 보류', updatedAt: at },
    },
  },
};
