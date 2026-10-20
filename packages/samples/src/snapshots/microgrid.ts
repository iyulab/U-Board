// Example data written for the sample, not recorded from a source — no public source carries a site's power flows.
// Keep it consistent: a clear October day at 13:00. The array gives 182 kW; the building takes 126 kW and two of the
// four chargers 20 kW; the battery charges at 28 kW (64 % full); the 8 kW left over goes back to the grid. Power in =
// power out at the switchboard: 182 = 126 + 20 + 28 + 8. Since midnight the site used 1,024 kWh, 248 of it from the
// grid — 76 % self-sufficient; the sun gave 812 kWh, 36 went to the grid and the rest was used (812 − 36 = 1,024 − 248).
import type { SampleSnapshot } from '../sample-pack.js';

const updatedAt = '2026-10-20T04:00:00Z';

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-20T04:01:00.000Z',
  responses: {
    ems: {
      '/site/assets': {
        value: [
          { id: 'pv', kw: 182, dir: 'forward', note: '발전 중 · 일사 812 W/m²', updatedAt },
          { id: 'grid', kw: 8, dir: 'reverse', note: '역송 중', updatedAt },
          { id: 'switchboard', kw: 182, dir: 'forward', note: '들어온 전력 합', updatedAt },
          { id: 'ess', kw: 28, dir: 'forward', socPct: 64, updatedAt },
          { id: 'building', kw: 126, dir: 'forward', note: '냉방 44 kW 포함', updatedAt },
          { id: 'ev', kw: 20, dir: 'forward', note: '4기 중 2기 충전 중', updatedAt },
        ],
        updatedAt,
      },
      '/site/summary': { selfSufficiencyPct: 76, pvKwhToday: 812, importKwhToday: 248, exportKwhToday: 36, updatedAt },
      '/site/history': {
        value: [
          { time: '2026-10-19T21:00:00Z', pvKw: 0, loadKw: 64 },
          { time: '2026-10-19T22:00:00Z', pvKw: 18, loadKw: 88 },
          { time: '2026-10-19T23:00:00Z', pvKw: 62, loadKw: 121 },
          { time: '2026-10-20T00:00:00Z', pvKw: 108, loadKw: 138 },
          { time: '2026-10-20T01:00:00Z', pvKw: 146, loadKw: 142 },
          { time: '2026-10-20T02:00:00Z', pvKw: 171, loadKw: 151 },
          { time: '2026-10-20T03:00:00Z', pvKw: 184, loadKw: 139 },
          { time: '2026-10-20T04:00:00Z', pvKw: 182, loadKw: 146 },
        ],
        updatedAt,
      },
    },
  },
};
