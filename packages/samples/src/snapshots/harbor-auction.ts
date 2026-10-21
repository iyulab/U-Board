// Example data written for the sample — the harbour, its boats and its auction are made up. Keep it consistent: it is
// 05:40 on a Saturday at the end of October, a calm dawn after a windy night. The red-crab boats came in first and their
// catch is sold; the flatfish lot is on the floor now; squid, octopus and yellowtail wait for the boats still coming
// in. Two boats are still out fishing. Boxes are counted on the auction floor since three o'clock.
import type { SampleSnapshot } from '../sample-pack.js';

const at = '2026-10-23T20:40:00Z';

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-23T20:40:20.000Z',
  responses: {
    harbor: {
      '/harbor/now': { name: '물결포 새벽 위판장', sub: '동쪽 어항 · 위판 03:00 시작', date: '10월 24일 토요일', time: '05:40', updatedAt: at },
      '/harbor/boats': {
        value: {
          s1: { name: '해돋이호', catch: '삼치 걸그물', state: 'sea', word: '조업 중', note: '07시 귀항 예정' },
          s2: { name: '갈매기호', catch: '문어 통발', state: 'sea', word: '조업 중', note: '통발 40틀 남음' },
          r1: { name: '청파호', catch: '오징어 210상자', state: 'return', word: '귀항 중', note: '방파제까지 15분' },
          r2: { name: '동백호', catch: '방어 64상자', state: 'return', word: '귀항 중', note: '방파제까지 25분' },
          r3: { name: '은빛호', catch: '문어 48상자', state: 'return', word: '귀항 중', note: '방파제까지 40분' },
          u1: { name: '대양호', catch: '가자미 120상자', state: 'unload', word: '하역 중', note: '지금 경매대' },
          u2: { name: '새벽별호', catch: '가자미 86상자', state: 'unload', word: '하역 중', note: '3번 줄' },
          d1: { name: '홍게1호', catch: '붉은대게 320상자', state: 'done', word: '위판 끝', note: '04:50 낙찰' },
          d2: { name: '홍게2호', catch: '붉은대게 280상자', state: 'done', word: '위판 끝', note: '05:10 낙찰' },
        },
        updatedAt: at,
      },
      '/harbor/eta': { value: { r1: '15분', r2: '25분', r3: '40분' }, updatedAt: at },
      '/harbor/figures': {
        value: [
          { label: '위판 상자', value: '806', note: '03시부터 경매대' },
          { label: '입항', value: '4 / 9', note: '척 — 귀항 중 3' },
          { label: '붉은대게 평균', value: '4.2만', note: '원 / 상자' },
        ],
        updatedAt: at,
      },
      '/harbor/lots': {
        value: [
          { fish: '붉은대게', boxes: '600상자', price: '4.2만 원', state: 'done', word: '낙찰' },
          { fish: '가자미', boxes: '206상자', price: '3.1만 원', state: 'now', word: '경매 중' },
          { fish: '오징어', boxes: '210상자', price: '—', state: 'wait', word: '06:00 예정' },
          { fish: '방어', boxes: '64상자', price: '—', state: 'wait', word: '06:20 예정' },
          { fish: '문어', boxes: '48상자', price: '—', state: 'wait', word: '06:40 예정' },
        ],
        updatedAt: at,
      },
      '/harbor/boxes': {
        value: [
          { hour: '03:00', boxes: 0 },
          { hour: '03:30', boxes: 0 },
          { hour: '04:00', boxes: 180 },
          { hour: '04:30', boxes: 240 },
          { hour: '05:00', boxes: 200 },
          { hour: '05:30', boxes: 186 },
        ],
        updatedAt: at,
      },
    },
  },
};
