// Example data written for the sample — the centre, its agents and its numbers are made up. Keep it consistent: it is
// 14:25 on a Thursday. Of twelve agents six are on a call, two ready, two writing up, two on a break. Six calls wait,
// two of them past two minutes and one asking to be called back. The day's calls by kind add up to the calls in by the
// hour; a tally stroke stands for five calls, rounded.
import type { SampleSnapshot } from '../sample-pack.js';

const at = '2026-10-22T05:25:00Z';

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-22T05:25:20.000Z',
  responses: {
    centre: {
      '/centre/now': { value: { series: '상담 현황 · 2팀', name: '누리 고객센터', date: '10월 22일 목요일', time: '14:25' }, updatedAt: at },
      '/centre/agents': {
        value: {
          a1: { name: '김하늘', state: 'talk', word: '통화 중', since: '4분 12초', calls: '31콜' },
          a2: { name: '이도윤', state: 'talk', word: '통화 중', since: '1분 40초', calls: '28콜' },
          a3: { name: '박서연', state: 'ready', word: '받을 수 있음', since: '0분 20초', calls: '33콜' },
          a4: { name: '최민준', state: 'wrap', word: '후처리', since: '0분 55초', calls: '26콜' },
          a5: { name: '정지우', state: 'talk', word: '통화 중', since: '7분 05초', calls: '22콜' },
          a6: { name: '강예린', state: 'break', word: '휴식', since: '6분 30초', calls: '30콜' },
          a7: { name: '조현우', state: 'talk', word: '통화 중', since: '2분 48초', calls: '29콜' },
          a8: { name: '윤채원', state: 'ready', word: '받을 수 있음', since: '0분 05초', calls: '35콜' },
          a9: { name: '장시우', state: 'talk', word: '통화 중', since: '0분 32초', calls: '24콜' },
          a10: { name: '임나은', state: 'wrap', word: '후처리', since: '1분 15초', calls: '27콜' },
          a11: { name: '한지호', state: 'break', word: '휴식', since: '12분 00초', calls: '19콜' },
          a12: { name: '오수아', state: 'talk', word: '통화 중', since: '3분 26초', calls: '32콜' },
        },
        updatedAt: at,
      },
      '/centre/queue': {
        value: [
          { no: '1', kind: '교환·반품', wait: '3분 10초', note: '두 번째 전화', state: 'long' },
          { no: '2', kind: '배송 문의', wait: '2분 25초', note: '콜백 요청', state: 'callback' },
          { no: '3', kind: '결제 오류', wait: '1분 40초', note: '—', state: 'wait' },
          { no: '4', kind: '배송 문의', wait: '0분 58초', note: '—', state: 'wait' },
          { no: '5', kind: '회원 정보', wait: '0분 31초', note: '—', state: 'wait' },
          { no: '6', kind: '기타', wait: '0분 09초', note: '—', state: 'wait' },
        ],
        updatedAt: at,
      },
      '/centre/tally': {
        value: [
          { kind: '배송 문의', count: '142', marks: 28 },
          { kind: '교환·반품', count: '96', marks: 19 },
          { kind: '결제', count: '58', marks: 12 },
          { kind: '회원 정보', count: '44', marks: 9 },
          { kind: '기타', count: '60', marks: 12 },
        ],
        updatedAt: at,
      },
      '/centre/figures': {
        value: [
          { label: '응답률', value: '87 %', note: '오늘 — 20초 안' },
          { label: '대기 콜', value: '6', note: '2분 넘음 2' },
          { label: '평균 대기', value: '48초', note: '오늘' },
        ],
        updatedAt: at,
      },
      '/centre/inbound': {
        value: [
          { hour: '9시', calls: 62 },
          { hour: '10시', calls: 88 },
          { hour: '11시', calls: 95 },
          { hour: '12시', calls: 54 },
          { hour: '13시', calls: 71 },
          { hour: '14시', calls: 30 },
        ],
        updatedAt: at,
      },
    },
  },
};
