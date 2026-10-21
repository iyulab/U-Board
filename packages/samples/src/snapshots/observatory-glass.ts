// Example data written for the sample — the observatory, its domes and its numbers are made up. Keep it consistent: it
// is 23:40 on a Thursday in late October, a clear night. Domes A and B observe, C is out for service after a cooler
// alarm at 22:40, D waits for its next target at 02:00. Tonight's exposures are the sum of the domes'; the cloud cover
// now in the rose window is the last point of the night's line; the dark left runs to astronomical dawn at 05:30.
import type { SampleSnapshot } from '../sample-pack.js';

const at = '2026-10-22T14:40:00Z';

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-22T14:40:20.000Z',
  responses: {
    observatory: {
      '/observatory/now': { value: { series: '관측 일지 · 맑은 밤', name: '누리 천문대', date: '10월 22일 목요일', time: '23:40' }, updatedAt: at },
      '/observatory/domes': {
        value: {
          a: { name: 'A 돔', scope: '1.0 m 반사 망원경', target: 'M31 안드로메다은하 — 장노출', state: 'open', word: '관측 중', frames: '96장', slit: '열림' },
          b: { name: 'B 돔', scope: '60 cm 반사 망원경', target: '목성 — 행성 영상', state: 'open', word: '관측 중', frames: '64장', slit: '열림' },
          c: { name: 'C 돔', scope: '40 cm 굴절 망원경', target: '— 냉각기 점검', state: 'service', word: '정비', frames: '0장', slit: '닫힘' },
          d: { name: 'D 돔', scope: '35 cm 광시야 망원경', target: '다음: M42 오리온성운 02:00', state: 'standby', word: '대기', frames: '24장', slit: '열림' },
        },
        updatedAt: at,
      },
      '/observatory/sky': {
        value: {
          state: 'good',
          word: '관측 적합',
          note: '맑음 · 달 없음',
          readings: [
            { label: '구름량', value: '10 %' },
            { label: '시상', value: '1.2″' },
            { label: '습도', value: '62 %' },
            { label: '바람', value: '3 m/s' },
          ],
        },
        updatedAt: at,
      },
      '/observatory/programme': {
        value: [
          { time: '19:20', dome: '전체', what: '플랫 보정 촬영', state: 'done', word: '마침' },
          { time: '20:00', dome: 'A', what: 'M31 장노출 — 새벽까지', state: 'now', word: '진행' },
          { time: '21:30', dome: 'B', what: '목성 행성 영상', state: 'now', word: '진행' },
          { time: '22:40', dome: 'C', what: '냉각기 경보 — 돔 닫음', state: 'alarm', word: '정비' },
          { time: '02:00', dome: 'D', what: 'M42 오리온성운', state: 'next', word: '다음' },
          { time: '05:10', dome: '전체', what: '박명 전 돔 닫기', state: 'next', word: '예정' },
        ],
        updatedAt: at,
      },
      '/observatory/figures': {
        value: [
          { label: '관측 중인 돔', value: '2 / 4', note: '대기 1 · 정비 1' },
          { label: '오늘 밤 노출', value: '184', note: '장 — 네 돔 합' },
          { label: '남은 어둠', value: '5:50', note: '천문 박명 05:30' },
        ],
        updatedAt: at,
      },
      '/observatory/cloud': {
        value: [
          { hour: '19시', cloud: 40 },
          { hour: '20시', cloud: 25 },
          { hour: '21시', cloud: 15 },
          { hour: '22시', cloud: 10 },
          { hour: '23시', cloud: 10 },
        ],
        updatedAt: at,
      },
    },
  },
};
