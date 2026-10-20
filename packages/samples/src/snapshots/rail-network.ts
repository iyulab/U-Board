// Example data written for the sample, not recorded from a source — no public source carries a network's running.
// Keep it consistent: a signal fault between 익산 and 정읍 holds trains at 익산 and makes the 호남선's two sections
// south of it late (the worst punctuality, 88.1 %); a train late out of 동대구 carries a smaller delay down to 울산.
// The late trains listed are the seven the summary counts, and their sections are the dashed ones. It is the evening
// rush: the sections round 오송·대전, where the SRT joins, carry the most trains.
import type { SampleSnapshot } from '../sample-pack.js';

const at = '2026-10-20T09:40:00Z';

/** `from-to`, trains in the hour, and the delay where late. */
const SECTIONS: [string, number, string?][] = [
  ['seoul-gwangmyeong', 14],
  ['gwangmyeong-cheonan', 12],
  ['cheonan-osong', 12],
  ['osong-daejeon', 18],
  ['daejeon-gimcheon', 14],
  ['gimcheon-dongdaegu', 14],
  ['dongdaegu-singyeongju', 10, '+7분'],
  ['singyeongju-ulsan', 10, '+6분'],
  ['ulsan-busan', 10],
  ['suseo-dongtan', 8],
  ['dongtan-pyeongtaek', 8],
  ['pyeongtaek-osong', 8],
  ['osong-gongju', 6],
  ['gongju-iksan', 6],
  ['iksan-jeongeup', 5, '+18분'],
  ['jeongeup-gwangju', 5, '+15분'],
  ['gwangju-mokpo', 3],
  ['seoul-cheongnyangni', 4],
  ['cheongnyangni-manjong', 4],
  ['manjong-jinbu', 3],
  ['jinbu-gangneung', 3],
];

const STATIONS = [
  'seoul', 'cheongnyangni', 'suseo', 'gwangmyeong', 'dongtan', 'pyeongtaek', 'cheonan', 'osong', 'daejeon', 'gimcheon', 'dongdaegu',
  'singyeongju', 'ulsan', 'busan', 'gongju', 'iksan', 'jeongeup', 'gwangju', 'mokpo', 'manjong', 'jinbu', 'gangneung',
];
const HELD = new Set(['iksan']);

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-20T09:40:20.000Z',
  responses: {
    ops: {
      '/rail/summary': {
        asOf: '10월 20일 18:40',
        running: 64,
        punctuality: 93.8,
        late: 7,
        riders: 182450,
        updatedAt: at,
      },
      '/rail/stations': {
        value: STATIONS.map(id => ({ id, state: HELD.has(id) ? 'held' : 'normal', updatedAt: at })),
        updatedAt: at,
      },
      '/rail/sections': {
        value: SECTIONS.map(([id, trains, delay]) => ({ id, trains, state: delay ? 'late' : 'normal', delayText: delay ?? '', updatedAt: at })),
        updatedAt: at,
      },
      '/rail/lines': {
        value: [
          { line: '경부선', punctuality: 94.6 },
          { line: 'SRT', punctuality: 96.2 },
          { line: '호남선', punctuality: 88.1 },
          { line: '강릉선', punctuality: 98.4 },
        ],
        updatedAt: at,
      },
      '/rail/lateTrains': {
        value: [
          { train: 'KTX 507', route: '익산 → 광주송정', delay: '+18분' },
          { train: 'SRT 659', route: '익산 → 목포', delay: '+16분' },
          { train: 'KTX 509', route: '공주 → 정읍', delay: '+15분' },
          { train: 'KTX 1523', route: '용산 → 익산', delay: '+9분' },
          { train: 'KTX 137', route: '동대구 → 부산', delay: '+7분' },
          { train: 'SRT 341', route: '신경주 → 부산', delay: '+6분' },
          { train: 'KTX 139', route: '동대구 → 울산', delay: '+5분' },
        ],
        updatedAt: at,
      },
    },
  },
};
