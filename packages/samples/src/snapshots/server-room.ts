// Example data written for the sample, not recorded from a source — no public source carries a room's racks.
// Keep it consistent: CRAC-3, on the wall by the B row's far end, failed shortly after 00:30 (its supply air has risen to
// the room's), so B05–B08 nearest it run above the recommended 27 °C and B06, the most loaded, past the allowable 32 °C;
// the hottest-rack line climbs from then. PUE is the facility's power over the IT load (156.6 / 99.1).
import type { SampleSnapshot } from '../sample-pack.js';

export const snapshot: SampleSnapshot = {
  "capturedAt": "2026-10-20T01:30:00.000Z",
  "responses": {
    "dcim": {
      "/room/summary": {
        "pue": 1.58,
        "itKw": 99.1,
        "facilityKw": 156.6,
        "racksOverRecommended": 4,
        "updatedAt": "2026-10-20T01:29:00Z"
      },
      "/room/racks": {
        "value": [
          {
            "id": "A01",
            "inletC": 23.8,
            "kw": 5.6,
            "budgetKw": 10,
            "updatedAt": "2026-10-20T01:29:00Z"
          },
          {
            "id": "A02",
            "inletC": 24.1,
            "kw": 6.2,
            "budgetKw": 10,
            "updatedAt": "2026-10-20T01:29:00Z"
          },
          {
            "id": "A03",
            "inletC": 24.6,
            "kw": 7.4,
            "budgetKw": 10,
            "updatedAt": "2026-10-20T01:29:00Z"
          },
          {
            "id": "A04",
            "inletC": 24.9,
            "kw": 6.8,
            "budgetKw": 10,
            "updatedAt": "2026-10-20T01:29:00Z"
          },
          {
            "id": "A05",
            "inletC": 25.2,
            "kw": 5.9,
            "budgetKw": 10,
            "updatedAt": "2026-10-20T01:29:00Z"
          },
          {
            "id": "A06",
            "inletC": 25.8,
            "kw": 6.4,
            "budgetKw": 10,
            "updatedAt": "2026-10-20T01:29:00Z"
          },
          {
            "id": "A07",
            "inletC": 26.1,
            "kw": 4.8,
            "budgetKw": 10,
            "updatedAt": "2026-10-20T01:29:00Z"
          },
          {
            "id": "A08",
            "inletC": 25.6,
            "kw": 5.2,
            "budgetKw": 10,
            "updatedAt": "2026-10-20T01:29:00Z"
          },
          {
            "id": "B01",
            "inletC": 24.2,
            "kw": 6.1,
            "budgetKw": 10,
            "updatedAt": "2026-10-20T01:29:00Z"
          },
          {
            "id": "B02",
            "inletC": 24.4,
            "kw": 7.9,
            "budgetKw": 10,
            "updatedAt": "2026-10-20T01:29:00Z"
          },
          {
            "id": "B03",
            "inletC": 25.3,
            "kw": 6.6,
            "budgetKw": 10,
            "updatedAt": "2026-10-20T01:29:00Z"
          },
          {
            "id": "B04",
            "inletC": 26.4,
            "kw": 5.4,
            "budgetKw": 10,
            "updatedAt": "2026-10-20T01:29:00Z"
          },
          {
            "id": "B05",
            "inletC": 28.4,
            "kw": 6.3,
            "budgetKw": 10,
            "updatedAt": "2026-10-20T01:29:00Z"
          },
          {
            "id": "B06",
            "inletC": 33.4,
            "kw": 8.6,
            "budgetKw": 10,
            "updatedAt": "2026-10-20T01:29:00Z"
          },
          {
            "id": "B07",
            "inletC": 31.2,
            "kw": 5.5,
            "budgetKw": 10,
            "updatedAt": "2026-10-20T01:29:00Z"
          },
          {
            "id": "B08",
            "inletC": 29.3,
            "kw": 4.4,
            "budgetKw": 10,
            "updatedAt": "2026-10-20T01:29:00Z"
          }
        ]
      },
      "/room/cooling": {
        "value": [
          {
            "id": "CRAC-1",
            "state": "cooling",
            "supplyC": 17.8,
            "updatedAt": "2026-10-20T01:29:00Z"
          },
          {
            "id": "CRAC-2",
            "state": "cooling",
            "supplyC": 18.1,
            "updatedAt": "2026-10-20T01:29:00Z"
          },
          {
            "id": "CRAC-3",
            "state": "fault",
            "supplyC": 24.6,
            "updatedAt": "2026-10-20T01:29:00Z"
          },
          {
            "id": "CRAC-4",
            "state": "cooling",
            "supplyC": 17.6,
            "updatedAt": "2026-10-20T01:29:00Z"
          }
        ]
      },
      "/room/inlet-history": {
        "value": [
          {
            "time": "2026-10-19T19:30:00Z",
            "maxInletC": 25.9
          },
          {
            "time": "2026-10-19T20:30:00Z",
            "maxInletC": 26.0
          },
          {
            "time": "2026-10-19T21:30:00Z",
            "maxInletC": 26.2
          },
          {
            "time": "2026-10-19T22:30:00Z",
            "maxInletC": 26.1
          },
          {
            "time": "2026-10-19T23:30:00Z",
            "maxInletC": 26.3
          },
          {
            "time": "2026-10-20T00:00:00Z",
            "maxInletC": 26.4
          },
          {
            "time": "2026-10-20T00:30:00Z",
            "maxInletC": 27.9
          },
          {
            "time": "2026-10-20T01:00:00Z",
            "maxInletC": 31.6
          },
          {
            "time": "2026-10-20T01:29:00Z",
            "maxInletC": 33.4
          }
        ],
        "updatedAt": "2026-10-20T01:29:00Z"
      }
    }
  }
};
