// Example data written for the sample — the park, its mountain and its trails are made up. Keep it consistent: it is
// 14:30 on a Wednesday in late October, the autumn colours at their best; the valley trail to the falls is crowded, the
// ridge between the summit and the lookout is closed for a gale on the ridge, and the summit's entry closed at 13:00, so
// the shelter is the last stop for anyone setting out now. The day's count is the walkers through both gates so far.
import type { SampleSnapshot } from '../sample-pack.js';

const at = '2026-10-21T05:30:00Z';

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-21T05:30:20.000Z',
  responses: {
    park: {
      '/park/now': { name: '흰구름산 국립공원', sub: '탐방로 안내', date: '10월 21일 수요일', time: '14:30', updatedAt: at },
      '/park/places': {
        centre: { name: '솔바람 탐방지원센터', status: 'busy', word: '혼잡', line: '주차 잔여 12', note: '정상 방향 입산 마감 13:00' },
        east: { name: '물소리 계곡 입구', status: 'open', word: '여유', line: '주차 잔여 64', note: '계곡길 하산 권장 16:30' },
        falls: { name: '구름폭포', status: 'busy', word: '혼잡', line: '단풍 절정', note: '데크 한 방향 통행' },
        shelter: { name: '바위샘 대피소', status: 'open', word: '운영', line: '잔여 4자리', note: '예약자만 · 취사 18시까지' },
        summit: { name: '흰구름봉', status: 'closed', word: '입산 마감', line: '6℃ · 서풍 13m/s', note: '해발 1,214m · 하산만 가능' },
        updatedAt: at,
      },
      '/park/trails': {
        'centre-fork': { status: 'busy', label: '1.8km · 혼잡' },
        'fork-falls': { status: 'busy', label: '1.2km · 혼잡' },
        'fork-shelter': { status: 'open', label: '2.4km' },
        'shelter-summit': { status: 'open', label: '1.1km · 하산만' },
        'summit-lookout': { status: 'closed', label: '통제 · 강풍' },
        'lookout-east': { status: 'open', label: '2.9km' },
        'east-falls': { status: 'open', label: '2.0km' },
        updatedAt: at,
      },
      '/park/weather': {
        value: [
          { label: '정상 기온', value: '6', unit: '℃', note: '체감 0℃' },
          { label: '능선 바람', value: '13', unit: 'm/s', note: '강풍 · 통제 기준 12' },
          { label: '일몰', value: '17:48', unit: '', note: '하산 시작 15:30까지' },
        ],
        updatedAt: at,
      },
      '/park/notices': {
        value: [
          { title: '능선 통제', text: '흰구름봉 – 전망대 구간, 강풍으로 오늘 종일', closed: true },
          { title: '단풍 절정', text: '구름폭포 계곡길 혼잡 · 데크는 한 방향 통행', closed: false },
          { title: '입산 시간 지정', text: '정상 방향 13:00 마감 · 대피소는 예약자만', closed: false },
        ],
        updatedAt: at,
      },
      '/park/walkers': {
        value: [
          { hour: '6시', people: 140 },
          { hour: '7시', people: 420 },
          { hour: '8시', people: 880 },
          { hour: '9시', people: 1210 },
          { hour: '10시', people: 1060 },
          { hour: '11시', people: 690 },
          { hour: '12시', people: 380 },
          { hour: '13시', people: 260 },
          { hour: '14시', people: 150 },
        ],
        updatedAt: at,
      },
    },
  },
};
