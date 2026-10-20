// Example data written for the sample, not recorded from a source — no public source carries a building's zones.
// Keep it consistent: an October afternoon (14:00, 17.8 °C outside). Meeting room 2, on the west side, has the afternoon
// sun and a full meeting — warm and past 1,000 ppm; the lounge after lunch is crowded — past 1,000 ppm, still within
// comfort; the IT room's split cooler has tripped, so it runs past 28 °C; open office C along the north windows runs cool.
// Today's energy is the floors' sum (264 + 287 + 331 + 298 + 356 + 412 = 1,948 kWh), listed top floor first.
import type { SampleSnapshot } from '../sample-pack.js';

const updatedAt = '2026-10-20T04:55:00Z';

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-20T05:00:00.000Z',
  responses: {
    bems: {
      '/building/summary': { demandKw: 412, todayKwh: 1948, outdoorC: 17.8, updatedAt },
      '/building/floors': {
        value: [
          { floor: '5F', kWh: 264 },
          { floor: '4F', kWh: 287 },
          { floor: '3F', kWh: 331 },
          { floor: '2F', kWh: 298 },
          { floor: '1F', kWh: 356 },
          { floor: 'B1', kWh: 412 },
        ],
        updatedAt,
      },
      '/floor/3/zones': {
        value: [
          { id: 'open-a', tempC: 23.6, kw: 14.2, co2Ppm: 720, updatedAt },
          { id: 'open-b', tempC: 24.1, kw: 15.8, co2Ppm: 810, updatedAt },
          { id: 'meet-1', tempC: 24.8, kw: 2.1, co2Ppm: 940, updatedAt },
          { id: 'it', tempC: 29.3, kw: 6.4, co2Ppm: 430, updatedAt },
          { id: 'meet-2', tempC: 27.1, kw: 2.6, co2Ppm: 1060, updatedAt },
          { id: 'lounge', tempC: 25.2, kw: 4.3, co2Ppm: 1180, updatedAt },
          { id: 'open-c', tempC: 19.4, kw: 12.9, co2Ppm: 650, updatedAt },
        ],
        updatedAt,
      },
    },
  },
};
