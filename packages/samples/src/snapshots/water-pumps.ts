// Example data written for the sample, not recorded from a source — no public source carries a plant's SCADA
// tags. Keep it consistent: pump P-103 tripped at 13:40 (its discharge pressure is zero), so the transfer flow
// falls from about 1,300 to about 1,180 m³/h on the trend, and the two reservoirs it feeds are drawing down.
import type { SampleSnapshot } from '../sample-pack.js';

export const snapshot: SampleSnapshot = {
  "capturedAt": "2026-10-15T05:30:00.000Z",
  "responses": {
    "scada": {
      "/scada/pumps": {
        "value": [
          { "id": "P-101", "state": "running", "pressure": 4.3, "updatedAt": "2026-10-15T05:29:50Z" },
          { "id": "P-102", "state": "running", "pressure": 4.2, "updatedAt": "2026-10-15T05:29:50Z" },
          { "id": "P-103", "state": "fault", "pressure": 0, "updatedAt": "2026-10-15T05:29:50Z" }
        ]
      },
      "/scada/levels": {
        "intake": 3.4,
        "clearWell": 72,
        "reservoirA": 64,
        "reservoirB": 41,
        "updatedAt": "2026-10-15T05:29:50Z"
      },
      "/scada/quality": {
        "flow": 1180,
        "turbidity": 0.08,
        "chlorine": 0.62,
        "updatedAt": "2026-10-15T05:29:50Z"
      },
      "/scada/flow-trend": {
        "value": [
          { "t": "2026-10-14T23:30:00Z", "flow": 1290 },
          { "t": "2026-10-15T00:00:00Z", "flow": 1305 },
          { "t": "2026-10-15T00:30:00Z", "flow": 1312 },
          { "t": "2026-10-15T01:00:00Z", "flow": 1298 },
          { "t": "2026-10-15T01:30:00Z", "flow": 1320 },
          { "t": "2026-10-15T02:00:00Z", "flow": 1315 },
          { "t": "2026-10-15T02:30:00Z", "flow": 1302 },
          { "t": "2026-10-15T03:00:00Z", "flow": 1296 },
          { "t": "2026-10-15T03:30:00Z", "flow": 1308 },
          { "t": "2026-10-15T04:00:00Z", "flow": 1301 },
          { "t": "2026-10-15T04:30:00Z", "flow": 1192 },
          { "t": "2026-10-15T05:00:00Z", "flow": 1185 },
          { "t": "2026-10-15T05:30:00Z", "flow": 1180 }
        ],
        "updatedAt": "2026-10-15T05:29:50Z"
      }
    }
  }
};
