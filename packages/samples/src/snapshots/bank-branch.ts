// Example data written for the sample — the bank, its branch and its customers are made up. Keep it consistent: it is
// 11:20 on a Friday near the end of the month, the busy hour before lunch; one teller has stepped away, the foreign-
// exchange window opens at one, and the lounge holds the people the queue says are waiting. One machine in the ATM
// corner is low on cash and one is out for service. Visitors are counted at the door since nine.
import type { SampleSnapshot } from '../sample-pack.js';

const at = '2026-10-23T02:20:00Z';

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-23T02:20:20.000Z',
  responses: {
    bank: {
      '/branch/now': { name: '솔빛은행 호수공원지점', sub: '창구 09–16시 · ATM 24시간', date: '10월 23일 금요일', time: '11:20', updatedAt: at },
      '/branch/desks': {
        value: {
          d1: { name: '창구 1', task: '입출금', state: 'busy', mark: '●', word: '응대 중', note: '번호 1042' },
          d2: { name: '창구 2', task: '입출금', state: 'busy', mark: '●', word: '응대 중', note: '번호 1043' },
          d3: { name: '창구 3', task: '입출금', state: 'away', mark: '◐', word: '자리 비움', note: '11:30 복귀' },
          d4: { name: '창구 4', task: '대출', state: 'busy', mark: '●', word: '응대 중', note: '번호 2018' },
          d5: { name: '창구 5', task: '기업', state: 'free', mark: '○', word: '대기 없음', note: '바로 응대' },
          d6: { name: '창구 6', task: '외환', state: 'closed', mark: '–', word: '13:00 열림', note: '점심 뒤 운영' },
        },
        updatedAt: at,
      },
      '/branch/rooms': {
        value: {
          r1: { name: '상담실 A', state: 'busy', mark: '●', word: '상담 중', note: '연금 · 11:40까지' },
          r2: { name: '상담실 B', state: 'free', mark: '○', word: '비어 있음', note: '다음 예약 13:00' },
          r3: { name: '상담실 C', state: 'busy', mark: '●', word: '상담 중', note: '주택담보 · 12:00까지' },
        },
        updatedAt: at,
      },
      '/branch/atms': {
        value: {
          a1: { name: 'ATM 1', state: 'ok', mark: '●', word: '사용 가능', note: '입출금' },
          a2: { name: 'ATM 2', state: 'low', mark: '◐', word: '현금 부족', note: '출금 50만 원까지' },
          a3: { name: 'ATM 3', state: 'ok', mark: '●', word: '사용 가능', note: '입출금 · 통장정리' },
          a4: { name: 'ATM 4', state: 'off', mark: '○', word: '점검 중', note: '12:00 재개 예정' },
        },
        updatedAt: at,
      },
      '/branch/queue': {
        value: [
          { task: '입출금', waiting: '7명', wait: '약 14분', now: '1043' },
          { task: '대출', waiting: '3명', wait: '약 25분', now: '2018' },
          { task: '기업', waiting: '0명', wait: '바로', now: '3007' },
          { task: '외환', waiting: '—', wait: '13:00부터', now: '—' },
        ],
        updatedAt: at,
      },
      '/branch/figures': {
        value: [
          { label: '오늘 내점', value: '186', note: '09시부터, 명' },
          { label: '평균 대기', value: '11분', note: '번호표 발급부터' },
          { label: '상담 예약', value: '9 / 14', note: '건 — 끝 / 오늘' },
        ],
        updatedAt: at,
      },
      '/branch/visitors': {
        value: [
          { hour: '09시', people: 52 },
          { hour: '10시', people: 88 },
          { hour: '11시 (20분)', people: 46 },
        ],
        updatedAt: at,
      },
    },
  },
};
