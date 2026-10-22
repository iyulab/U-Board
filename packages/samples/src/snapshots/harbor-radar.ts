// Example data written for the sample — the harbour and its boats are made up. Keep it consistent: it is 21:20 on a
// Thursday in late October. The roster names the boats on the scope with the same states; 은빛 2호 is nearing a closed
// area, 대양 5호's position reports stopped at 20:52, 바다별 7호 is heading in. Seven boats are out (the banner's count).
import type { SampleSnapshot } from '../sample-pack.js';

const at = '2026-10-22T12:19:00Z';

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-22T12:20:00.000Z',
  responses: {
    watch: {
      '/watch/now': { value: { date: '10월 22일 목요일', time: '21:20', out: '7' }, updatedAt: at },
      '/watch/boats': {
        value: {
          v1: { call: '해솔 3호', knots: '4.2', state: 'fishing', word: '조업' },
          v2: { call: '바다별 7호', knots: '9.8', state: 'underway', word: '귀항' },
          v3: { call: '청파 11호', knots: '3.1', state: 'fishing', word: '조업' },
          v4: { call: '은빛 2호', knots: '6.5', state: 'alarm', word: '금지구역 접근' },
          v5: { call: '대양 5호', knots: '—', state: 'lost', word: '20:52 끊김' },
          v6: { call: '금강 9호', knots: '8.7', state: 'underway', word: '출항' },
          v7: { call: '해돋이 1호', knots: '2.6', state: 'fishing', word: '조업' },
        },
        updatedAt: at,
      },
      '/watch/roster': {
        value: [
          { call: '은빛 2호', kind: '연안복합 · 4.9톤', state: 'alarm', word: '경보', note: '보호수면 경계까지 0.4해리 — 무전 경고 21:14' },
          { call: '대양 5호', kind: '연안자망 · 7.3톤', state: 'lost', word: '끊김', note: '마지막 위치 20:52 · 무전 호출 3회 · 인근 해솔 3호에 확인 요청' },
          { call: '바다별 7호', kind: '연안통발 · 9.7톤', state: 'underway', word: '귀항', note: '입항 예정 21:45 · 위판 내일 05시' },
          { call: '금강 9호', kind: '근해채낚기 · 29톤', state: 'underway', word: '출항', note: '21:05 출항 · 오징어 채낚기' },
          { call: '해솔 3호', kind: '연안자망 · 6.1톤', state: 'fishing', word: '조업', note: '그물 걷는 중' },
          { call: '청파 11호', kind: '연안복합 · 4.2톤', state: 'fishing', word: '조업', note: '23시 귀항 신고' },
          { call: '해돋이 1호', kind: '연안통발 · 3.8톤', state: 'fishing', word: '조업', note: '통발 투하 중' },
        ],
        updatedAt: at,
      },
      '/watch/waves': {
        value: [1.2, 1.2, 1.3, 1.3, 1.4, 1.5, 1.6, 1.8, 1.9, 2.1, 2.2, 2.4].map((wave, i) => ({ hour: String(10 + i).padStart(2, '0'), wave, advisory: 3 })),
        updatedAt: at,
      },
    },
  },
};
