// Example data written for the sample, not recorded from a source — no public source carries a pump station's
// machines. Keep it consistent: the station's outflow is the two running pumps' (412 + 398 = 810 m³/h at 05:00),
// the clear well is low because P-3 is stopped and P-4 has tripped, and V-2 throttles the line P-4 feeds.
import type { SampleSnapshot } from '../sample-pack.js';

export const snapshot: SampleSnapshot = {
  "capturedAt": "2026-10-15T05:30:00.000Z",
  "responses": {
    "scada": {
      "/station/pumps": {
        "value": [
          { "id": "P-1", "state": "run", "rpm": 1480, "flow": 412, "updatedAt": "2026-10-15T05:29:30Z" },
          { "id": "P-2", "state": "run", "rpm": 1475, "flow": 398, "updatedAt": "2026-10-15T05:29:30Z" },
          { "id": "P-3", "state": "stop", "rpm": 0, "flow": 0, "updatedAt": "2026-10-15T05:29:30Z" },
          { "id": "P-4", "state": "fault", "rpm": 0, "flow": 0, "updatedAt": "2026-10-15T05:29:30Z" }
        ]
      },
      "/station/valves": {
        "value": [
          { "id": "V-1", "state": "open", "position": 100, "updatedAt": "2026-10-15T05:29:30Z" },
          { "id": "V-2", "state": "moving", "position": 45, "updatedAt": "2026-10-15T05:29:30Z" },
          { "id": "V-3", "state": "closed", "position": 0, "updatedAt": "2026-10-15T05:29:30Z" }
        ]
      },
      "/station/tanks": {
        "value": [
          { "id": "T-1", "level": 72, "updatedAt": "2026-10-15T05:29:30Z" },
          { "id": "T-2", "level": 16, "updatedAt": "2026-10-15T05:29:30Z" }
        ]
      },
      "/station/flow": {
        "value": [
          { "time": "2026-10-15T00:00:00Z", "flow": 1240 },
          { "time": "2026-10-15T01:00:00Z", "flow": 1215 },
          { "time": "2026-10-15T02:00:00Z", "flow": 1190 },
          { "time": "2026-10-15T03:00:00Z", "flow": 1205 },
          { "time": "2026-10-15T04:00:00Z", "flow": 960 },
          { "time": "2026-10-15T05:00:00Z", "flow": 810 }
        ],
        "updatedAt": "2026-10-15T05:00:00Z"
      }
    }
  }
};
