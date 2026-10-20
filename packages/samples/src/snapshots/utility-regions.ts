// Example data written for the sample, not recorded from a source — no public source carries a utility's assets.
// Keep it consistent: the industrial-park booster (E-03) stopped this morning on a pump bearing — four orders open on it,
// the east district red; the south has a warning at S-03 and four inspections overdue — amber; north and west healthy.
// Open orders per site add up per district (N 3, E 7, W 2, S 8 = 20), overdue inspections too (0 + 2 + 1 + 4 = 7), and
// availability is the share of sites not stopped (11 of 12).
import type { SampleSnapshot } from '../sample-pack.js';

const updatedAt = '2026-10-20T01:40:00Z';
const site = (id: string, state: string, openOrders: number) => ({ id, state, openOrders, updatedAt });

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-20T01:45:00.000Z',
  responses: {
    cmms: {
      '/area/summary': { availabilityPct: 91.7, openOrders: 20, overdueInspections: 7, updatedAt },
      '/area/sites': {
        value: [
          site('N-01', 'running', 1),
          site('N-02', 'running', 0),
          site('N-03', 'running', 2),
          site('E-01', 'running', 1),
          site('E-02', 'warning', 2),
          site('E-03', 'stopped', 4),
          site('W-01', 'running', 1),
          site('W-02', 'running', 1),
          site('S-01', 'running', 2),
          site('S-02', 'running', 1),
          site('S-03', 'warning', 3),
          site('S-04', 'running', 2),
        ],
        updatedAt,
      },
      '/area/regions': {
        value: [
          { id: 'north', health: 96, overdueInspections: 0, updatedAt },
          { id: 'east', health: 64, overdueInspections: 2, updatedAt },
          { id: 'west', health: 91, overdueInspections: 1, updatedAt },
          { id: 'south', health: 78, overdueInspections: 4, updatedAt },
        ],
        updatedAt,
      },
      '/area/orders-by-region': {
        value: [
          { region: '북부', corrective: 1, preventive: 2 },
          { region: '동부', corrective: 5, preventive: 2 },
          { region: '서부', corrective: 0, preventive: 2 },
          { region: '남부', corrective: 3, preventive: 5 },
        ],
        updatedAt,
      },
    },
  },
};
