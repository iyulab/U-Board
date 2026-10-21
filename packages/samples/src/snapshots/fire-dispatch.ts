// Example data written for the sample — the city, its stations and its calls are made up. Keep it consistent: it is
// 14:10 on a Thursday; a fire on the third floor of a shopping building has drawn engines from three stations, an
// ambulance is with a patient at a house in the west, and a rescue team is freeing people from a stuck lift in the
// east. The south station's ambulance is on its way back. Calls are counted since midnight.
import type { SampleSnapshot } from '../sample-pack.js';

const at = '2026-10-22T05:10:00Z';

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-22T05:10:20.000Z',
  responses: {
    fire: {
      '/fire/now': { name: '새벌시 119 상황판', sub: '안전센터 6 · 차량 22', date: '10월 22일 목요일', time: '14:10', updatedAt: at },
      '/fire/stations': {
        value: {
          c1: { name: '서부', vehicles: [{ n: '펌프 1', st: 'standby' }, { n: '물탱크 1', st: 'go' }, { n: '구급 1', st: 'scene' }, { n: '지휘 1', st: 'standby' }] },
          c2: { name: '중앙', vehicles: [{ n: '펌프 2', st: 'scene' }, { n: '사다리 2', st: 'scene' }, { n: '구급 2', st: 'standby' }, { n: '지휘 2', st: 'scene' }] },
          c3: { name: '동부', vehicles: [{ n: '펌프 3', st: 'standby' }, { n: '구조 3', st: 'scene' }, { n: '구급 3', st: 'standby' }] },
          c4: { name: '남부', vehicles: [{ n: '펌프 4', st: 'standby' }, { n: '물탱크 4', st: 'standby' }, { n: '구급 4', st: 'back' }] },
          c5: { name: '항만', vehicles: [{ n: '펌프 5', st: 'standby' }, { n: '구조 5', st: 'go' }, { n: '구급 5', st: 'standby' }, { n: '화학 5', st: 'standby' }] },
          c6: { name: '산단', vehicles: [{ n: '펌프 6', st: 'standby' }, { n: '물탱크 6', st: 'standby' }, { n: '구급 6', st: 'standby' }, { n: '화학 6', st: 'standby' }] },
        },
        updatedAt: at,
      },
      '/fire/calls': {
        value: {
          i1: { kind: '화재', place: '상가 3층', since: '13:52 접수', level: '대응 1단계' },
          i2: { kind: '구급', place: '단독주택', since: '13:58 접수', level: '환자 1명' },
          i3: { kind: '구조', place: '승강기 갇힘', since: '14:02 접수', level: '2명 구조 중' },
        },
        updatedAt: at,
      },
      '/fire/routes': {
        value: { r1: '물탱크 1 · 3분', r2: '펌프 2 · 현장', r3: '구조 5 · 6분', r4: '구급 1 · 현장', r5: '구조 3 · 현장' },
        updatedAt: at,
      },
      '/fire/figures': {
        value: [
          { label: '오늘 출동', value: '31', note: '건 — 0시부터' },
          { label: '평균 도착', value: '6:40', note: '분 — 오늘' },
          { label: '대기 차량', value: '14 / 22', note: '대' },
        ],
        updatedAt: at,
      },
      '/fire/hours': {
        value: [
          { hour: '0–2', calls: 3 },
          { hour: '2–4', calls: 2 },
          { hour: '4–6', calls: 1 },
          { hour: '6–8', calls: 4 },
          { hour: '8–10', calls: 6 },
          { hour: '10–12', calls: 7 },
          { hour: '12–14', calls: 8 },
        ],
        updatedAt: at,
      },
    },
  },
};
