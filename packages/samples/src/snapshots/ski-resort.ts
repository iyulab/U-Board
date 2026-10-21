// Example data written for the sample, not recorded from a source — no public source carries a resort's lifts and
// runs this way. Keep it consistent: it is 11:00 on a Saturday in mid-January, cold and clear after a night of snow.
// The expert run is still closed for avalanche work after the snowfall; one advanced run is set for a race; the
// gondola's queue is the longest, lift B runs slow in the wind at the top. The counts are taken from the runs and lifts.
import type { SampleSnapshot } from '../sample-pack.js';

const at = '2026-01-17T02:00:00Z';

const RUNS = {
  rainbow: { name: '레인보우', state: 'closed', word: '닫힘', note: '눈사태 예방 · 13시' },
  challenge: { name: '챌린지', state: 'racing', word: '대회', note: '알파인 대회 중' },
  paradise: { name: '파라다이스', state: 'open', word: '열림', note: '05:30 정설 · 신설' },
  bravo: { name: '브라보', state: 'open', word: '열림', note: '05:00 정설' },
  family: { name: '패밀리', state: 'open', word: '열림', note: '04:30 정설 · 강습 중' },
  hill: { name: '초보 언덕', state: 'open', word: '열림', note: '04:30 정설' },
};

const LIFTS = {
  gondola: { name: '곤돌라', state: 'run', wait: '대기 25분' },
  'lift-a': { name: '리프트 A', state: 'run', wait: '대기 8분' },
  'lift-b': { name: '리프트 B', state: 'slow', wait: '감속 · 바람' },
  'lift-c': { name: '리프트 C', state: 'run', wait: '대기 3분' },
};

const openRuns = Object.values(RUNS).filter(r => r.state === 'open').length;
const runningLifts = Object.values(LIFTS).filter(l => l.state !== 'stop').length;

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-01-17T02:00:20.000Z',
  responses: {
    ski: {
      '/ski/now': { name: '하얀봉 리조트', date: '1월 17일 토요일', time: '11:00', updatedAt: at },
      '/ski/runs': { ...RUNS, updatedAt: at },
      '/ski/lifts': { ...LIFTS, updatedAt: at },
      '/ski/weather': {
        sky: '맑음 · 밤새 눈 12cm',
        items: [
          { label: '정상', value: '-14°C' },
          { label: '베이스', value: '-6°C' },
          { label: '정상 바람', value: '11 m/s' },
          { label: '적설', value: '84 cm' },
        ],
        updatedAt: at,
      },
      '/ski/score': {
        value: [
          { label: '슬로프', value: openRuns, of: Object.keys(RUNS).length },
          { label: '리프트', value: runningLifts, of: Object.keys(LIFTS).length },
          { label: '야간 개장', value: 4, of: 6 },
        ],
        updatedAt: at,
      },
      '/ski/crowd': {
        value: [
          { hour: '8시', riders: 1240 },
          { hour: '9시', riders: 3180 },
          { hour: '10시', riders: 4620 },
          { hour: '11시', riders: 5010 },
        ],
        updatedAt: at,
      },
    },
  },
};
