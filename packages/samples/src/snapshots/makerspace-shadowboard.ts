// Example data written for the sample — the space, its members and its numbers are made up. Keep it consistent: it is
// 19:10 on a Thursday in late October, the evening session. Of twelve tools on the wall eight are in place, two are
// lent out, one is overdue since yesterday and one is away for repair. Two printers are printing, the third waits for
// its 19:30 booking, the laser cutter is cutting and the CNC router is down for a spindle bearing.
import type { SampleSnapshot } from '../sample-pack.js';

const at = '2026-10-22T10:10:00Z';

const tool = (name: string, kind: string, state: string, tag: string) => ({ name, kind, state, tag });

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-22T10:10:20.000Z',
  responses: {
    shop: {
      '/shop/now': { value: { series: 'MAKERSPACE · 저녁 개방', name: '두드림 공작소', date: '10월 22일 목요일', time: '19:10' }, updatedAt: at },
      '/shop/tools': {
        value: {
          hammer: tool('망치', 'hammer', 'in', '제자리'),
          saw: tool('톱', 'saw', 'out', '회원 214 · 20:00'),
          drill: tool('드릴', 'drill', 'out', '회원 087 · 21:00'),
          level: tool('수평자', 'level', 'in', '제자리'),
          wrench: tool('스패너', 'wrench', 'in', '제자리'),
          pliers: tool('펜치', 'pliers', 'in', '제자리'),
          screwdriver: tool('드라이버', 'screwdriver', 'in', '제자리'),
          clamp: tool('클램프', 'clamp', 'overdue', '회원 142 · 어제'),
          tape: tool('줄자', 'tape', 'in', '제자리'),
          chisel: tool('끌', 'chisel', 'repair', '날 연마'),
          glue: tool('글루건', 'glue', 'in', '제자리'),
          square: tool('직각자', 'square', 'in', '제자리'),
        },
        updatedAt: at,
      },
      '/shop/machines': {
        value: {
          p1: { name: '프린터 1', kind: '3D 프린터 · FDM', state: 'running', word: '출력 중', job: '드론 프레임', pct: 62, left: '48분 남음' },
          p2: { name: '프린터 2', kind: '3D 프린터 · FDM', state: 'running', word: '출력 중', job: '화분 받침 4개', pct: 18, left: '2시간 10분' },
          p3: { name: '프린터 3', kind: '3D 프린터 · 레진', state: 'booked', word: '19:30 예약', job: '피규어 시제품', pct: 0, left: '회원 301' },
          laser: { name: '레이저 커터', kind: '60 W · 합판 6 mm', state: 'running', word: '가공 중', job: '책꽂이 옆판', pct: 75, left: '7분 남음' },
          cnc: { name: 'CNC 라우터', kind: '600 × 900', state: 'fault', word: '고장', job: '스핀들 베어링 교체', pct: 0, left: '부품 금요일' },
        },
        updatedAt: at,
      },
      '/shop/figures': {
        value: [
          { label: '지금 회원', value: '14', note: '명 — 저녁 개방' },
          { label: '대여 중', value: '3', note: '기한 지남 1' },
          { label: '장비 가동', value: '3 / 5', note: '예약 1 · 고장 1' },
        ],
        updatedAt: at,
      },
      '/shop/bookings': {
        value: [
          { time: '18:40', machine: '레이저 커터', what: '책꽂이 옆판', who: '회원 214', state: 'now' },
          { time: '19:30', machine: '프린터 3', what: '피규어 시제품', who: '회원 301', state: 'next' },
          { time: '20:00', machine: '레이저 커터', what: '나무 명패 10개', who: '회원 118', state: 'next' },
          { time: '20:30', machine: '프린터 1', what: '케이스 뚜껑', who: '회원 087', state: 'next' },
        ],
        updatedAt: at,
      },
      '/shop/loans': {
        value: [
          { hour: '14', loans: 2 },
          { hour: '15', loans: 1 },
          { hour: '16', loans: 3 },
          { hour: '17', loans: 4 },
          { hour: '18', loans: 6 },
          { hour: '19', loans: 3 },
        ],
        updatedAt: at,
      },
    },
  },
};
