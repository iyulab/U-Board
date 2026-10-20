// Example data written for the sample, not recorded from a source — no public source carries a farm's houses.
// Keep it consistent: it is 13:40 on a clear October day, the sun past 700 W/m², so the screens are out over the
// glasshouses; 3동's strawberries run warm (vents wide, misting) and are the one house near the heat alarm; the
// nutrient tank is low enough to be refilled this afternoon.
import type { SampleSnapshot } from '../sample-pack.js';

const at = '2026-10-21T04:40:00Z';

const house = (id: string, value: number, value2: number, level: string, note: string) => ({ id, value, value2, level, note, updatedAt: at });

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-21T04:40:20.000Z',
  responses: {
    farm: {
      '/farm/now': {
        asOf: '10월 21일 13:40',
        harvest: 1284,
        harvestByHour: [0, 96, 241, 412, 598, 806, 1012, 1160, 1284],
        water: 18.6,
        power: 412,
        updatedAt: at,
      },
      '/farm/weather': { temp: 21.4, solar: 742, wind: 3.2, sky: '맑음', updatedAt: at },
      '/farm/houses': {
        value: [
          house('g1', 26.8, 68, 'ok', '차광 · 환기창 40%'),
          house('g2', 27.5, 74, 'ok', '차광 · 관수 중'),
          house('g3', 29.6, 61, 'warn', '환기창 100% · 포그 분무'),
          house('g4', 25.9, 70, 'ok', '환기창 30%'),
          house('nursery', 24.2, 82, 'ok', '보광등 꺼짐'),
          house('nutrient', 2.4, 28, 'warn', '탱크 보충 · 15시 예정'),
          house('packing', 2.1, 412, 'ok', '출하 대기 412상자'),
        ],
        updatedAt: at,
      },
      '/farm/temps': {
        value: [
          { hour: '06', g1: 15.2, g2: 16.0, g3: 14.6, g4: 15.4 },
          { hour: '07', g1: 16.8, g2: 17.4, g3: 16.5, g4: 16.9 },
          { hour: '08', g1: 19.1, g2: 19.8, g3: 19.4, g4: 18.8 },
          { hour: '09', g1: 21.6, g2: 22.3, g3: 22.5, g4: 21.0 },
          { hour: '10', g1: 23.4, g2: 24.2, g3: 25.1, g4: 22.9 },
          { hour: '11', g1: 24.9, g2: 25.8, g3: 27.2, g4: 24.1 },
          { hour: '12', g1: 26.0, g2: 26.9, g3: 28.7, g4: 25.2 },
          { hour: '13', g1: 26.8, g2: 27.5, g3: 29.6, g4: 25.9 },
        ],
        updatedAt: at,
      },
    },
  },
};
