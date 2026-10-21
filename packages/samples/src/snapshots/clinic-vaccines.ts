// Example data written for the sample — the health centre, its rooms and its visitors are made up. Keep it consistent:
// it is 14:20 on a Thursday in the flu-shot season; the afternoon line is back after lunch, one screening room is
// paused while its doctor takes a call, and the observation room holds the people vaccinated in the last quarter of an
// hour. The pneumococcal vaccine is running low. Vaccinations are counted since nine.
import type { SampleSnapshot } from '../sample-pack.js';

const at = '2026-10-22T05:20:00Z';

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-22T05:20:20.000Z',
  responses: {
    clinic: {
      '/clinic/now': { name: '새솔구 보건소', sub: '예방접종실 · 09–17시', date: '10월 22일 목요일', time: '14:20', updatedAt: at },
      '/clinic/stages': {
        value: {
          reception: { name: '접수', note: '번호표 162번까지', rooms: [{ n: '창구 1', st: 'on', who: '162번' }, { n: '창구 2', st: 'on', who: '161번' }] },
          screening: { name: '예진', note: '문진표 확인 · 체온', rooms: [{ n: '예진실 1', st: 'on', who: '158번' }, { n: '예진실 2', st: 'pause', who: '잠시 멈춤' }] },
          injection: { name: '접종', note: '독감 · 코로나19 · 폐렴구균', rooms: [{ n: '접종실 1', st: 'on', who: '153번' }, { n: '접종실 2', st: 'on', who: '154번' }, { n: '접종실 3', st: 'free', who: '비어 있음' }] },
          observation: { name: '관찰', note: '접종 뒤 15분 머묾', rooms: [{ n: '관찰실', st: 'on', who: '9명' }] },
        },
        updatedAt: at,
      },
      '/clinic/queues': { value: { q1: '대기 8명', q2: '대기 5명', q3: '대기 0명' }, updatedAt: at },
      '/clinic/serving': { value: { now: '153', next: '155' }, updatedAt: at },
      '/clinic/stock': {
        value: [
          { name: '인플루엔자 4가', level: 'high', leaves: 3, word: '충분 · 180회분' },
          { name: '코로나19 (26–27)', level: 'mid', leaves: 2, word: '보통 · 64회분' },
          { name: '폐렴구균 23가', level: 'low', leaves: 1, word: '부족 · 7회분' },
        ],
        updatedAt: at,
      },
      '/clinic/figures': {
        value: [
          { label: '오늘 접종', value: '222', note: '명 — 09시부터' },
          { label: '평균 소요', value: '34분', note: '접수부터 관찰 끝까지' },
          { label: '관찰 중', value: '9', note: '명' },
        ],
        updatedAt: at,
      },
      '/clinic/hours': {
        value: [
          { hour: '09시', people: 38 },
          { hour: '10시', people: 52 },
          { hour: '11시', people: 49 },
          { hour: '12시', people: 20 },
          { hour: '13시', people: 46 },
          { hour: '14시', people: 17 },
        ],
        updatedAt: at,
      },
    },
  },
};
