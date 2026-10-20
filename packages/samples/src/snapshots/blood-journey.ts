// Example data written for the sample, not recorded from a source — no public source carries a supply's day this way.
// Keep it consistent: every donor gave once (donors = donated), 1.2 % failed a test (5,412 → 5,347), a passed
// donation becomes about two and a half units (5,347 → 13,640), the stock in days is the red-cell stock over a day's
// use (4.6 sets the 관심 level — under five), the stock by type averages to it, the ages add up to 100, and the
// thirty days end at today's 4.6.
import type { SampleSnapshot } from '../sample-pack.js';

const at = '2026-10-20T06:00:00Z';

const trend = [5.4, 5.5, 5.3, 5.2, 5.4, 5.6, 5.5, 5.3, 5.1, 5.0, 5.2, 5.3, 5.1, 4.9, 4.8, 5.0, 5.1, 4.9, 4.7, 4.8, 4.9, 4.7, 4.6, 4.8, 4.9, 4.7, 4.5, 4.6, 4.7, 4.6];
const day = (i: number) => {
  const d = new Date(Date.UTC(2026, 8, 21 + i));
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
};

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-20T06:00:00.000Z',
  responses: {
    blood: {
      '/blood/today': {
        asOf: '10월 20일 15:00',
        donors: 5412,
        donated: 5412,
        passed: 5347,
        units: 13640,
        stockUnits: 24860,
        supplied: 12980,
        stockDays: 4.6,
        updatedAt: at,
      },
      '/blood/types': {
        value: [
          { type: 'O형', days: 3.4 },
          { type: 'A형', days: 5.1 },
          { type: 'B형', days: 4.9 },
          { type: 'AB형', days: 5.8 },
        ],
        updatedAt: at,
      },
      '/blood/ages': {
        value: [
          { age: '10대', share: 18 },
          { age: '20대', share: 31 },
          { age: '30대', share: 17 },
          { age: '40대', share: 16 },
          { age: '50대 이상', share: 18 },
        ],
        updatedAt: at,
      },
      '/blood/trend': {
        value: trend.map((days, i) => ({ date: day(i), days })),
        updatedAt: at,
      },
    },
  },
};
