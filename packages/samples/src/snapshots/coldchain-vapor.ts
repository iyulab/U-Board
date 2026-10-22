// Example data written for the sample — the warehouse is made up. Keep it consistent: it is 13:10 on a Thursday in late
// October. Freezer B has been above its −20 ℃ limit for 18 minutes (its curve's last point is the card's −17.6 ℃);
// chiller 2 is in its defrost window, so its rise is expected; the ambient room's dock door has been open nine minutes;
// the truck held at dock 2 is the one waiting on freezer B.
import type { SampleSnapshot } from '../sample-pack.js';

const at = '2026-10-22T04:09:00Z';

const trend = [-23.1, -23.4, -23.0, -22.8, -23.2, -23.5, -23.3, -22.9, -23.1, -23.6, -23.4, -23.2, -22.7, -23.0, -23.3, -23.1, -22.9, -22.6, -22.8, -22.4, -22.1, -21.6, -20.4, -17.6];
const hours = Array.from({ length: 24 }, (_, i) => String((14 + i) % 24).padStart(2, '0'));

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-22T04:10:00.000Z',
  responses: {
    warehouse: {
      '/warehouse/now': { value: { date: '10월 22일 목요일', time: '13:10' }, updatedAt: at },
      '/warehouse/zones': {
        value: {
          frzA: { name: '냉동 A', en: 'FREEZER A', temp: '-23.8', lo: '-25', hi: '-20', load: '78%', doors: '14회', state: 'ok', word: '정상', note: '아이스크림·냉동 수산' },
          frzB: { name: '냉동 B', en: 'FREEZER B', temp: '-17.6', lo: '-25', hi: '-20', load: '64%', doors: '9회', state: 'alarm', word: '온도 이탈', note: '18분째 상한 위 · 증발기 점검 출동, 도크 2 출고 보류' },
          chl1: { name: '냉장 1', en: 'CHILLER 1', temp: '3.4', lo: '0', hi: '5', load: '82%', doors: '31회', state: 'ok', word: '정상', note: '유제품·신선 채소' },
          chl2: { name: '냉장 2', en: 'CHILLER 2', temp: '6.1', lo: '0', hi: '5', load: '57%', doors: '22회', state: 'defrost', word: '제상 중', note: '제상 12:50–13:20 · 끝나면 30분 안에 복귀' },
          amb: { name: '정온', en: 'AMBIENT', temp: '16.8', lo: '15', hi: '18', load: '69%', doors: '40회', state: 'door', word: '문 열림', note: '도크 3 쪽 문 9분째 열림 · 상차 중' },
          ult: { name: '초저온', en: 'ULTRA-LOW', temp: '-71.2', lo: '-80', hi: '-60', load: '35%', doors: '2회', state: 'ok', word: '정상', note: '의약품 · 이중 전원' },
        },
        updatedAt: at,
      },
      '/warehouse/frzb': {
        value: hours.map((hour, i) => ({ hour, temp: trend[i], limit: -20 })),
        updatedAt: at,
      },
      '/warehouse/docks': {
        value: [
          { dock: 'D1', truck: '냉동탑차 5톤', what: '아이스크림 18 팔레트 · 대형마트', time: '13:20', state: 'loading', word: '상차 중' },
          { dock: 'D2', truck: '냉동탑차 11톤', what: '냉동 수산 24 팔레트 · 급식센터', time: '13:00', state: 'held', word: '보류' },
          { dock: 'D3', truck: '정온 윙바디', what: '음료·과자 30 팔레트', time: '13:05', state: 'loading', word: '상차 중' },
          { dock: 'D4', truck: '냉장탑차 3.5톤', what: '유제품 12 팔레트 · 편의점', time: '13:40', state: 'waiting', word: '접안 대기' },
          { dock: 'D5', truck: '초저온 특장차', what: '백신 4 상자 · 병원', time: '14:30', state: 'waiting', word: '예약' },
          { dock: 'D6', truck: '냉장탑차 5톤', what: '신선 채소 16 팔레트 입고', time: '12:30', state: 'done', word: '완료' },
        ],
        updatedAt: at,
      },
    },
  },
};
