// Example data written for the sample, not recorded from a source — no public source carries a hotel's rooms.
// Keep it consistent: it is 14:30 on a weekday at a 160-room city hotel. The morning's check-outs are done but for four
// late ones; tonight 138 of the 157 sellable rooms are taken (three are out for repair), 26 of them guests still to
// arrive, with the afternoon's check-in wave about to start; nine rooms wait to be cleaned, which is why the crews on
// the upper floors are behind.
import type { SampleSnapshot } from '../sample-pack.js';

const at = '2026-10-21T05:30:00Z';

type State = 'occupied' | 'arriving' | 'departing' | 'vacant' | 'dirty' | 'blocked';
const counts: Record<State, number> = { occupied: 112, arriving: 26, departing: 4, vacant: 6, dirty: 9, blocked: 3 };

/** Ten floors (3–12) of sixteen rooms, each given a state so the counts above hold and the states lie scattered. */
function rooms(): { no: string; state: State }[] {
  const states = (Object.entries(counts) as [State, number][]).flatMap(([state, n]) => Array.from({ length: n }, () => state));
  return states.map((_, i) => {
    const floor = 3 + Math.floor(i / 16);
    return { no: `${floor}${String((i % 16) + 1).padStart(2, '0')}`, state: states[(i * 61) % states.length] };
  });
}

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-21T05:30:20.000Z',
  responses: {
    hotel: {
      '/hotel/now': { name: '루멘 호텔 서울', date: '10월 21일 수요일', time: '14:30', weather: '맑음', temp: 18, updatedAt: at },
      '/hotel/kpi': {
        occupancy: { value: 88, delta: '+4%p', trend: 'up', note: '오늘 밤 138 / 157실 · 점검 3실 제외' },
        adr: { value: 186400, delta: '+2.1%', trend: 'up', note: '전주 같은 요일 182,600원' },
        revpar: { value: 163800, delta: '+6.9%', trend: 'up', note: '점유율 × 평균 객실 단가' },
        nps: { value: 62, delta: '-3', trend: 'down', note: '최근 30일 응답 418건' },
        updatedAt: at,
      },
      '/hotel/rooms': { value: rooms(), counts, updatedAt: at },
      '/hotel/arrivals': {
        value: [
          { hour: '06시', checkIn: 0, checkOut: 6 },
          { hour: '08시', checkIn: 1, checkOut: 18 },
          { hour: '10시', checkIn: 2, checkOut: 41 },
          { hour: '11시', checkIn: 3, checkOut: 37 },
          { hour: '12시', checkIn: 6, checkOut: 9 },
          { hour: '14시', checkIn: 14, checkOut: 3 },
          { hour: '15시', checkIn: 31, checkOut: 2 },
          { hour: '16시', checkIn: 27, checkOut: 1 },
          { hour: '18시', checkIn: 18, checkOut: 0 },
          { hour: '20시', checkIn: 9, checkOut: 0 },
          { hour: '22시', checkIn: 4, checkOut: 0 },
        ],
        updatedAt: at,
      },
      '/hotel/housekeeping': {
        value: [
          { name: 'A조', floors: '3–4층', done: 21, total: 24, share: 88 },
          { name: 'B조', floors: '5–6층', done: 17, total: 26, share: 65 },
          { name: 'C조', floors: '7–8층', done: 22, total: 25, share: 88 },
          { name: 'D조', floors: '9–10층', done: 13, total: 27, share: 48 },
          { name: 'E조', floors: '11–12층', done: 16, total: 28, share: 57 },
        ],
        updatedAt: at,
      },
      '/hotel/requests': {
        value: [
          { time: '14:26', room: '1207', ask: '수건 2장 추가', state: '전달 중', level: 'doing' },
          { time: '14:18', room: '815', ask: '체크아웃 16시로 연장', state: '승인', level: 'done' },
          { time: '14:09', room: '1003', ask: '에어컨 소음 점검', state: '시설팀 대기', level: 'waiting' },
          { time: '13:52', room: '611', ask: '유아 침대 설치', state: '완료', level: 'done' },
        ],
        updatedAt: at,
      },
      '/hotel/revenue': {
        value: [
          { source: '객실', amount: 29480000 },
          { source: '식음', amount: 8120000 },
          { source: '연회', amount: 5300000 },
          { source: '스파', amount: 2640000 },
          { source: '기타', amount: 1210000 },
        ],
        updatedAt: at,
      },
    },
  },
};
