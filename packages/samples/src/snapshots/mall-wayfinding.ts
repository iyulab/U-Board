// Example data written for the sample, not recorded from a source — no public source carries a shopping centre's
// queues and stalls. Keep it consistent: it is 14:30 on a Saturday, after lunch but before the afternoon peak. The
// food hall's queues are short except the cutlet place, which a TV programme showed last week; the west restroom by
// the food hall is full, so the kiosk sends people east; the atrium's flea market is at its busiest, so the first
// floor reads packed and the car park's lower levels are nearly full.
import type { SampleSnapshot } from '../sample-pack.js';

const at = '2026-10-17T05:30:00Z';

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-17T05:30:20.000Z',
  responses: {
    mall: {
      '/mall/now': { name: '가람 스퀘어', floor: '3F', floorName: '리빙 · 식당가', date: '10월 17일 토요일', time: '14:30', hours: '10:30–22:00', updatedAt: at },
      '/mall/restaurants': {
        noodle: { minutes: 0, teams: 0, state: 'seated', note: '바로 입장' },
        bibim: { minutes: 10, teams: 3, state: 'queue', note: '자리 정리 중' },
        pasta: { minutes: 0, teams: 0, state: 'break', note: '17시 저녁 영업' },
        katsu: { minutes: 40, teams: 11, state: 'long', note: '번호표 받기' },
        updatedAt: at,
      },
      '/mall/restrooms': {
        west: { women: 0, men: 1, accessible: '사용 중', level: 'full' },
        east: { women: 4, men: 3, accessible: '비어 있음', level: 'free' },
        updatedAt: at,
      },
      '/mall/route': { label: '도보 2분 · 60 m', updatedAt: at },
      '/mall/nursing': { state: '사용 중', note: '2실 중 2실', free: false, updatedAt: at },
      '/mall/lifts': {
        value: [
          { name: '1호기', floor: '3', arrow: '▲ 상행', way: 'up' },
          { name: '2호기', floor: 'B2', arrow: '▼ 하행', way: 'down' },
          { name: '3호기', floor: '7', arrow: '대기', way: 'idle' },
        ],
        updatedAt: at,
      },
      '/mall/atrium': { title: '가을 플리마켓', where: '1층 아트리움', hours: '11:00–18:00 · 판매 부스 42곳', next: '15:00 버스킹 공연', updatedAt: at },
      '/mall/floors': {
        value: [
          { floor: '7F', name: '영화관 · 문화홀', crowd: 'busy', word: '보통', here: false },
          { floor: '6F', name: '스포츠 · 아웃렛', crowd: 'calm', word: '여유', here: false },
          { floor: '5F', name: '가전 · 키즈', crowd: 'calm', word: '여유', here: false },
          { floor: '4F', name: '남성 · 골프', crowd: 'calm', word: '여유', here: false },
          { floor: '3F', name: '리빙 · 식당가', crowd: 'busy', word: '보통', here: true },
          { floor: '2F', name: '여성 패션 · 잡화', crowd: 'busy', word: '보통', here: false },
          { floor: '1F', name: '화장품 · 아트리움', crowd: 'packed', word: '혼잡', here: false },
          { floor: 'B1', name: '식품관 · 마트', crowd: 'packed', word: '혼잡', here: false },
        ],
        updatedAt: at,
      },
      '/mall/parking': {
        note: '지하 2·3층 혼잡',
        value: [
          { name: 'B2', free: 6, level: 'full' },
          { name: 'B3', free: 14, level: 'few' },
          { name: 'B4', free: 92, level: 'free' },
          { name: '옥상', free: 37, level: 'free' },
        ],
        updatedAt: at,
      },
      '/mall/visitors': {
        value: [
          { hour: '10시', people: 820 },
          { hour: '11시', people: 2140 },
          { hour: '12시', people: 3380 },
          { hour: '13시', people: 3910 },
          { hour: '14시', people: 3460 },
        ],
        updatedAt: at,
      },
    },
  },
};
