// Example data written for the sample — the park and its rides are made up. Keep it consistent: it is 14:30 on a
// Wednesday in late October, the Halloween season; a school holiday crowd queues for the coaster and the haunted house,
// the drop tower is down for an inspection and the rapids are shut for the cold. The suggested route strings together
// the shortest waits from the gate. The day's count is the gates' entries so far.
import type { SampleSnapshot } from '../sample-pack.js';

const at = '2026-10-21T05:30:00Z';

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-21T05:30:20.000Z',
  responses: {
    park: {
      '/park/now': { name: '젤리랜드', sub: '놀이기구 대기 시간', date: '10월 21일 수요일', time: '14:30', updatedAt: at },
      '/park/rides': {
        value: {
          coaster: { name: '번개 코스터', wait: '75', level: 'long', note: '키 130cm 이상' },
          jungle: { name: '정글 보트', wait: '35', level: 'mid' },
          drop: { name: '자이로 드롭', wait: '운휴', level: 'closed', note: '정기 점검 · 16시 재개' },
          wheel: { name: '무지개 관람차', wait: '15', level: 'short' },
          teacup: { name: '회전 찻잔', wait: '10', level: 'short' },
          rapids: { name: '급류 타기', wait: '운휴', level: 'closed', note: '기온 12℃ 미만 운휴' },
          haunted: { name: '유령의 집', wait: '60', level: 'long', note: '할로윈 특별판' },
          cinema: { name: '4D 극장', wait: '20', level: 'mid', note: '다음 회 14:40' },
          carousel: { name: '회전목마', wait: '5', level: 'short' },
          bumper: { name: '범퍼카', wait: '25', level: 'mid' },
        },
        updatedAt: at,
      },
      '/park/route': {
        'gate-carousel': '도보 4분',
        'carousel-teacup': '도보 5분',
        'teacup-wheel': '도보 3분',
        updatedAt: at,
      },
      '/park/figures': {
        value: [
          { label: '오늘 입장', value: '12,480', note: '평일 평균의 1.6배' },
          { label: '평균 대기', value: '28분', note: '한 시간 전 34분' },
          { label: '운휴', value: '2', note: '드롭 · 급류' },
        ],
        updatedAt: at,
      },
      '/park/shows': {
        value: [
          { time: '15:00', name: '마녀의 마술 쇼', place: '광장 무대', left: '좌석 여유' },
          { time: '16:00', name: '할로윈 퍼레이드', place: '정문 → 광장', left: '자리 잡기 15:30' },
          { time: '18:30', name: '호박 불꽃놀이', place: '관람차 언덕', left: '' },
        ],
        updatedAt: at,
      },
      '/park/waits': {
        value: [
          { hour: '10시', wait: 18 },
          { hour: '11시', wait: 29 },
          { hour: '12시', wait: 37 },
          { hour: '13시', wait: 34 },
          { hour: '14시', wait: 28 },
        ],
        updatedAt: at,
      },
    },
  },
};
