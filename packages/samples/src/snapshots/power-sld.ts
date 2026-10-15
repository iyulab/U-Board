// Example data written for the sample, not recorded from a source — no public source carries a plant's switchgear.
// Keep it consistent: the feeders sum to 1,012 kW and the incoming 1,031 kW covers them with the transformer's
// losses; the compressor feeder tripped at 13:15, which is the step down on the demand trend; the cooling tower
// feeder is opened for maintenance. Today's peak, 1,262 kW at 11:30, is under the 1,500 kW contract.
import type { SampleSnapshot } from '../sample-pack.js';

export const snapshot: SampleSnapshot = {
  "capturedAt": "2026-10-15T05:30:00.000Z",
  "responses": {
    "ems": {
      "/ems/incoming": {
        "kw": 1031,
        "pf": 0.96,
        "transformerLoad": 67,
        "peakKw": 1262,
        "peakOfContract": 84.1,
        "updatedAt": "2026-10-15T05:29:45Z"
      },
      "/ems/feeders": {
        "value": [
          { "id": "F1", "breaker": "closed", "kw": 412, "updatedAt": "2026-10-15T05:29:45Z" },
          { "id": "F2", "breaker": "closed", "kw": 318, "updatedAt": "2026-10-15T05:29:45Z" },
          { "id": "F3", "breaker": "closed", "kw": 186, "updatedAt": "2026-10-15T05:29:45Z" },
          { "id": "F4", "breaker": "tripped", "kw": 0, "updatedAt": "2026-10-15T05:29:45Z" },
          { "id": "F5", "breaker": "closed", "kw": 96, "updatedAt": "2026-10-15T05:29:45Z" },
          { "id": "F6", "breaker": "open", "kw": 0, "updatedAt": "2026-10-15T05:29:45Z" }
        ]
      },
      "/ems/demand": {
        "value": [
          { "t": "2026-10-15T00:00:00Z", "kw": 1148 },
          { "t": "2026-10-15T00:30:00Z", "kw": 1196 },
          { "t": "2026-10-15T01:00:00Z", "kw": 1221 },
          { "t": "2026-10-15T01:30:00Z", "kw": 1240 },
          { "t": "2026-10-15T02:00:00Z", "kw": 1255 },
          { "t": "2026-10-15T02:30:00Z", "kw": 1262 },
          { "t": "2026-10-15T03:00:00Z", "kw": 1188 },
          { "t": "2026-10-15T03:30:00Z", "kw": 1204 },
          { "t": "2026-10-15T04:00:00Z", "kw": 1213 },
          { "t": "2026-10-15T04:30:00Z", "kw": 1046 },
          { "t": "2026-10-15T05:00:00Z", "kw": 1038 },
          { "t": "2026-10-15T05:30:00Z", "kw": 1031 }
        ],
        "updatedAt": "2026-10-15T05:29:45Z"
      }
    }
  }
};
