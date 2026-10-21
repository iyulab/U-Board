// Example data written for the sample — the campground, its pitches and its numbers are made up. Keep it consistent: it
// is 16:30 on a Thursday in late October. Of ten pitches five have campers in, three are booked for parties arriving this
// evening, one is free and one is closed while its drain is mended — eight booked today, the bar for Thursday. Tonight's
// campers are the parties in and arriving; the weekend is full.
import type { SampleSnapshot } from '../sample-pack.js';

const at = '2026-10-22T07:30:00Z';

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-22T07:30:20.000Z',
  responses: {
    camp: {
      '/camp/now': { value: { series: '사이트 안내 · 가을', name: '누리 숲 캠핑장', date: '10월 22일 목요일', time: '16:30' }, updatedAt: at },
      '/camp/pitches': {
        value: {
          a1: { no: 'A-1', kind: '오토캠핑 · 전기', party: '4인 가족', state: 'in', word: '입실', note: '2박 중 첫날' },
          a2: { no: 'A-2', kind: '오토캠핑 · 전기', party: '2인', state: 'in', word: '입실', note: '14:00 입실' },
          a3: { no: 'A-3', kind: '오토캠핑 · 전기', party: '5인 가족', state: 'in', word: '입실', note: '3박 중 둘째 날' },
          a4: { no: 'A-4', kind: '데크 · 전기', party: '3인', state: 'in', word: '입실', note: '15:10 입실' },
          a5: { no: 'A-5', kind: '데크 · 전기', party: '4인', state: 'in', word: '입실', note: '반려견 동반' },
          b1: { no: 'B-1', kind: '데크', party: '4인 가족', state: 'arriving', word: '도착 중', note: '16:40 도착 예정' },
          b2: { no: 'B-2', kind: '데크', party: '—', state: 'free', word: '빈 사이트', note: '오늘 밤 예약 가능' },
          b3: { no: 'B-3', kind: '숲속 · 솔밭', party: '2인', state: 'arriving', word: '오는 중', note: '17:30 예정' },
          b4: { no: 'B-4', kind: '숲속 · 솔밭', party: '—', state: 'closed', word: '닫힘', note: '배수로 보수 — 토요일까지' },
          b5: { no: 'B-5', kind: '숲속 · 솔밭', party: '3인', state: 'arriving', word: '오는 중', note: '18:00 예정' },
        },
        updatedAt: at,
      },
      '/camp/facilities': {
        value: [
          { name: '샤워장', word: '온수 나옴', state: 'ok' },
          { name: '화장실', word: '청소 15:00', state: 'ok' },
          { name: '개수대', word: '붐빔', state: 'busy' },
          { name: '매점', word: '21시까지', state: 'ok' },
          { name: '장작', word: '12묶음 남음', state: 'busy' },
          { name: '놀이터', word: '점검 중', state: 'closed' },
        ],
        updatedAt: at,
      },
      '/camp/moves': {
        value: [
          { time: '11:00', what: '퇴실 — 2팀', pitch: 'B-1·B-3', state: 'done', word: '마침' },
          { time: '14:00', what: '입실 — 2인', pitch: 'A-2', state: 'done', word: '마침' },
          { time: '15:10', what: '입실 — 3인', pitch: 'A-4', state: 'done', word: '마침' },
          { time: '16:40', what: '입실 — 4인 가족', pitch: 'B-1', state: 'now', word: '도착 중' },
          { time: '17:30', what: '입실 — 2인', pitch: 'B-3', state: 'next', word: '예정' },
          { time: '18:00', what: '입실 — 3인', pitch: 'B-5', state: 'next', word: '예정' },
        ],
        updatedAt: at,
      },
      '/camp/weather': {
        value: { now: '14 °C', low: '6 °C', wind: '2 m/s', sunset: '17:48', fire: 'allowed', word: '화로대에서만' },
        updatedAt: at,
      },
      '/camp/figures': {
        value: [
          { label: '오늘 사이트', value: '8 / 10', note: '입실 5 · 오는 중 3' },
          { label: '오늘 밤 인원', value: '27', note: '명 — 입실·예정 합' },
          { label: '주말 예약', value: '20 / 20', note: '금·토 모두 참' },
        ],
        updatedAt: at,
      },
      '/camp/week': {
        value: [
          { day: '월', booked: 3 },
          { day: '화', booked: 2 },
          { day: '수', booked: 4 },
          { day: '목', booked: 8 },
          { day: '금', booked: 10 },
          { day: '토', booked: 10 },
          { day: '일', booked: 6 },
        ],
        updatedAt: at,
      },
    },
  },
};
