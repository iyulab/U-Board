// Example data written for the sample — the race, the circuit, the teams and the drivers are made up. Keep it
// consistent: lap 38 of 57, green flag, the team's two cars (KIM and PRK) running 2nd and 7th. The leaders stopped
// once for hards around lap 20; KIM is on a long first stint of mediums and is about to pit, PRK has pitted twice
// and is on fresh softs, setting the session's best first sector. The lap times show KIM's tyres fading.
import type { SampleSnapshot } from '../sample-pack.js';

const at = '2026-10-18T06:20:00Z';

type Sector = 'p' | 'g' | 'y';
type Car = [code: string, colour: string, gap: string, tyre: 'S' | 'M' | 'H', age: number, sectors: [Sector, Sector, Sector], ours?: boolean, pit?: boolean];

const TEAM = { red: '#e10600', blue: '#2f6bff', teal: '#00c2b3', orange: '#ff7a00', white: '#e6e6e6', green: '#2fbf5b', navy: '#1c3d7a', pink: '#ff4fa3', grey: '#8a8a8a', yellow: '#e8c400' };

const CARS: Car[] = [
  ['HAN', TEAM.blue, 'LEADER', 'H', 18, ['y', 'g', 'y']],
  ['KIM', TEAM.red, '+2.418', 'M', 38, ['y', 'y', 'y'], true],
  ['SEO', TEAM.teal, '+4.902', 'H', 19, ['g', 'y', 'y']],
  ['YUN', TEAM.orange, '+9.371', 'H', 17, ['y', 'y', 'g']],
  ['CHO', TEAM.blue, '+12.044', 'H', 18, ['y', 'y', 'y']],
  ['LIM', TEAM.teal, '+15.880', 'H', 20, ['y', 'g', 'y']],
  ['PRK', TEAM.red, '+18.205', 'S', 4, ['p', 'g', 'g'], true],
  ['JUN', TEAM.orange, '+21.617', 'H', 21, ['y', 'y', 'y']],
  ['OH', TEAM.white, '+24.090', 'M', 9, ['y', 'y', 'y']],
  ['KAN', TEAM.green, '+27.552', 'H', 22, ['y', 'y', 'y']],
  ['SHN', TEAM.navy, '+31.008', 'H', 16, ['y', 'y', 'y']],
  ['MUN', TEAM.white, '+33.775', 'M', 10, ['g', 'y', 'y']],
  ['BAE', TEAM.pink, '+38.140', 'H', 23, ['y', 'y', 'y']],
  ['NAM', TEAM.green, '+41.529', 'H', 21, ['y', 'y', 'y']],
  ['WOO', TEAM.navy, '+44.862', 'H', 24, ['y', 'y', 'y'], false, true],
  ['RYU', TEAM.grey, '+49.203', 'M', 12, ['y', 'y', 'y']],
  ['HWA', TEAM.pink, '+52.661', 'H', 25, ['y', 'y', 'y']],
  ['JIN', TEAM.yellow, '+1 LAP', 'H', 19, ['y', 'y', 'y']],
  ['GOH', TEAM.grey, '+1 LAP', 'H', 22, ['y', 'y', 'y']],
  ['SON', TEAM.yellow, '+1 LAP', 'M', 14, ['y', 'y', 'y']],
];

/** The last twelve laps of the team's two cars, in seconds: KIM's mediums fading, PRK quick on new softs after lap 34. */
const LAPS: Array<[number, number, number | null]> = [
  [27, 93.42, 93.61], [28, 93.48, 93.55], [29, 93.55, 93.70], [30, 93.61, 93.66], [31, 93.70, 93.74], [32, 93.79, 93.81],
  [33, 93.86, 93.90], [34, 93.95, null], [35, 94.04, 92.88], [36, 94.15, 92.71], [37, 94.29, 92.64], [38, 94.41, 92.59],
];

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-18T06:20:20.000Z',
  responses: {
    timing: {
      '/timing/race': { name: '남해 그랑프리', circuit: '남해 해안 서킷 · 5.31 km', lap: 38, laps: 57, flag: 'green', flagText: 'GREEN FLAG', air: '24°C', track: '41°C', updatedAt: at },
      '/timing/tower': {
        value: CARS.map(([code, colour, gap, tyre, age, [s1, s2, s3], ours = false, pit = false], i) => ({ pos: i + 1, code, colour, gap, tyre, age, s1, s2, s3, ours, pit })),
        updatedAt: at,
      },
      '/timing/sectors': {
        '0': { time: '28.914', who: 'PRK · 37랩' },
        '1': { time: '34.207', who: 'HAN · 31랩' },
        '2': { time: '29.336', who: 'YUN · 36랩' },
        updatedAt: at,
      },
      '/timing/strategy': {
        value: [
          { code: 'KIM', stints: [{ tyre: 'M', laps: 39, planned: false }, { tyre: 'H', laps: 18, planned: true }], note: '이번 랩 끝 피트 — 하드로 끝까지' },
          { code: 'PRK', stints: [{ tyre: 'M', laps: 14, planned: false }, { tyre: 'H', laps: 20, planned: false }, { tyre: 'S', laps: 23, planned: false }], note: '소프트 4랩째 — 7위에서 추격' },
        ],
        // The race's lap, as the strategy feed carries it — the plan is drawn against it.
        lap: 38,
        laps: 57,
        updatedAt: at,
      },
      '/timing/laps': { value: LAPS.map(([lap, kim, park]) => ({ lap: `L${lap}`, kim, park })), updatedAt: at },
    },
  },
};
