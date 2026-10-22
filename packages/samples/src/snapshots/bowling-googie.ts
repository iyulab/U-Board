// Example data written for the sample — the alley, its parties and its numbers are made up. Keep it consistent: it is
// 20:15 on a Thursday in late October, league night. Seven lanes are in play, one is free, one is booked for 20:30 and
// one is being oiled. Three parties wait; the first takes the free lane. A lane in play shows the pins standing after
// the first ball of the frame being bowled — all ten mean the frame has not started.
import type { SampleSnapshot } from '../sample-pack.js';

const at = '2026-10-22T11:15:00Z';

const ALL = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
const NONE = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-22T11:15:20.000Z',
  responses: {
    alley: {
      '/alley/now': { value: { series: 'BOWL · OPEN TILL MIDNIGHT', name: '은하 볼링 센터', date: '10월 22일 목요일', time: '20:15' }, updatedAt: at },
      '/alley/lanes': {
        value: {
          l1: { no: '1', party: '목요 리그 · 번개팀', note: '4명 · 2게임째', state: 'playing', frame: '7프레임', best: '212', pins: [0, 0, 0, 0, 0, 0, 1, 0, 0, 1] },
          l2: { no: '2', party: '목요 리그 · 스페어즈', note: '4명 · 2게임째', state: 'playing', frame: '6프레임', best: '187', pins: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0] },
          l3: { no: '3', party: '가족 4명', note: '1게임째 · 범퍼', state: 'playing', frame: '3프레임', best: '96', pins: [0, 1, 0, 1, 0, 0, 1, 1, 0, 0] },
          l4: { no: '4', party: '회사 모임', note: '6명 · 1게임째', state: 'playing', frame: '9프레임', best: '158', pins: ALL },
          l5: { no: '5', party: '—', note: '바로 쓸 수 있음', state: 'free', frame: '빈 레인', best: '—', pins: ALL },
          l6: { no: '6', party: '동아리 연습', note: '3명 · 3게임째', state: 'playing', frame: '4프레임', best: '201', pins: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
          l7: { no: '7', party: '목요 리그 · 핀헌터', note: '4명 · 2게임째', state: 'playing', frame: '8프레임', best: '224', pins: [0, 0, 1, 0, 0, 1, 0, 0, 0, 1] },
          l8: { no: '8', party: '커플 2명', note: '1게임째', state: 'playing', frame: '5프레임', best: '131', pins: [0, 0, 0, 1, 0, 0, 1, 0, 0, 0] },
          l9: { no: '9', party: '예약 · 생일 모임', note: '8명 · 20:30부터', state: 'booked', frame: '20:30', best: '—', pins: ALL },
          l10: { no: '10', party: '레인 정비', note: '오일 패턴 다시 바르는 중', state: 'oiling', frame: '20:40까지', best: '—', pins: NONE },
        },
        updatedAt: at,
      },
      '/alley/figures': {
        value: [
          { label: '사용 중 레인', value: '7 / 10', note: '예약 1 · 정비 1' },
          { label: '지금 손님', value: '29', note: '명' },
          { label: '오늘 최고 점수', value: '224', note: '7번 레인 — 핀헌터' },
        ],
        updatedAt: at,
      },
      '/alley/waiting': {
        value: [
          { no: '1', party: '대학생 4명', size: '4명', wait: '5번 레인', state: 'next' },
          { no: '2', party: '가족 3명', size: '3명', wait: '약 15분', state: 'waiting' },
          { no: '3', party: '친구 5명', size: '5명', wait: '약 25분', state: 'waiting' },
        ],
        updatedAt: at,
      },
      '/alley/use': {
        value: [
          { hour: '15', lanes: 2 },
          { hour: '16', lanes: 3 },
          { hour: '17', lanes: 4 },
          { hour: '18', lanes: 6 },
          { hour: '19', lanes: 8 },
          { hour: '20', lanes: 7 },
        ],
        updatedAt: at,
      },
    },
  },
};
