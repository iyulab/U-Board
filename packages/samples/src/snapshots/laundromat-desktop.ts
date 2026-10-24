// Example data written for the sample — the shop, its machines and its numbers are made up. Keep it consistent: it is
// 19:40 on a Thursday evening. Washers: four running (1, 2, 5, 8), one done and waiting (3), two free (4, 7), one out of
// order (6). Dryers: three running (1, 2, 6), one done (3), one free (5), one out of order (4 — the message box). So 7 of
// the 12 working machines are running and 2 wait to be emptied. The hours chart sums to the 62 uses of the day.
import type { SampleSnapshot } from '../sample-pack.js';

const at = '2026-10-22T10:40:00Z';

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-22T10:40:30.000Z',
  responses: {
    shop: {
      '/shop/now': { time: '오후 7:40', updatedAt: at },
      '/shop/washers': {
        value: [
          { no: '세탁 1', state: 'run', word: '헹굼', left: '32분 남음', p: 30 },
          { no: '세탁 2', state: 'run', word: '탈수', left: '8분 남음', p: 85 },
          { no: '세탁 3', state: 'done', word: '끝남', left: '꺼내 주세요 · 6분 전', p: 100 },
          { no: '세탁 4', state: 'free', word: '사용 가능', left: '대형 · 20 kg', p: 0 },
          { no: '세탁 5', state: 'run', word: '세탁', left: '21분 남음', p: 55 },
          { no: '세탁 6', state: 'out', word: '고장', left: '배수 점검 중', p: 0 },
          { no: '세탁 7', state: 'free', word: '사용 가능', left: '일반 · 12 kg', p: 0 },
          { no: '세탁 8', state: 'run', word: '세탁', left: '40분 남음', p: 15 },
        ],
        updatedAt: at,
      },
      '/shop/dryers': {
        value: [
          { no: '건조 1', state: 'run', word: '건조', left: '12분 남음', p: 70 },
          { no: '건조 2', state: 'run', word: '건조', left: '25분 남음', p: 40 },
          { no: '건조 3', state: 'done', word: '끝남', left: '꺼내 주세요 · 2분 전', p: 100 },
          { no: '건조 4', state: 'out', word: '고장', left: '수리 15:00 → 내일', p: 0 },
          { no: '건조 5', state: 'free', word: '사용 가능', left: '대형 · 25 kg', p: 0 },
          { no: '건조 6', state: 'run', word: '식힘', left: '5분 남음', p: 90 },
        ],
        updatedAt: at,
      },
      '/shop/figures': {
        value: [
          { label: '작동 중', value: '7 / 12대' },
          { label: '꺼내기 대기', value: '2대' },
          { label: '오늘 이용', value: '62회' },
        ],
        // The shop the figures are of — the panel's heading reads it from the same answer.
        shop: { name: '누리 코인빨래방', date: '10월 22일 목요일', hours: '24시간 무인' },
        updatedAt: at,
      },
      '/shop/hours': {
        value: [
          { hour: '7시', uses: 2 },
          { hour: '8시', uses: 3 },
          { hour: '9시', uses: 5 },
          { hour: '10시', uses: 4 },
          { hour: '11시', uses: 3 },
          { hour: '12시', uses: 4 },
          { hour: '13시', uses: 6 },
          { hour: '14시', uses: 5 },
          { hour: '15시', uses: 4 },
          { hour: '16시', uses: 5 },
          { hour: '17시', uses: 6 },
          { hour: '18시', uses: 8 },
          { hour: '19시', uses: 7 },
        ],
        updatedAt: at,
      },
      '/shop/message': { value: { title: '알림', text: '건조 4 고장 — 오늘 수리 기사가 오지 못해 내일 오전에 옵니다.' }, updatedAt: at },
    },
  },
};
