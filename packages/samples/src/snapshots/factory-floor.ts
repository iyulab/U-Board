// Example data written for the sample, not recorded from a source — no public source carries a plant's
// machines. Keep it consistent: the machines and lines the board names, read within a minute of `capturedAt`.
import type { SampleSnapshot } from '../sample-pack.js';

export const snapshot: SampleSnapshot = {
  "capturedAt": "2026-10-15T05:30:00.000Z",
  "responses": {
    "plant": {
      "/plant/equipment": {
        "value": [
          {
            "id": "PR-01",
            "line": "L1",
            "state": "running",
            "openWorkOrders": 0,
            "updatedAt": "2026-10-15T05:29:52Z"
          },
          {
            "id": "PR-02",
            "line": "L1",
            "state": "down",
            "openWorkOrders": 2,
            "updatedAt": "2026-10-15T05:29:52Z"
          },
          {
            "id": "CN-01",
            "line": "L1",
            "state": "running",
            "openWorkOrders": 0,
            "updatedAt": "2026-10-15T05:29:52Z"
          },
          {
            "id": "CN-02",
            "line": "L1",
            "state": "maintenance",
            "openWorkOrders": 1,
            "updatedAt": "2026-10-15T05:29:52Z"
          },
          {
            "id": "WR-01",
            "line": "L2",
            "state": "running",
            "openWorkOrders": 0,
            "updatedAt": "2026-10-15T05:29:52Z"
          },
          {
            "id": "WR-02",
            "line": "L2",
            "state": "running",
            "openWorkOrders": 0,
            "updatedAt": "2026-10-15T05:29:52Z"
          },
          {
            "id": "AS-01",
            "line": "L2",
            "state": "idle",
            "openWorkOrders": 0,
            "updatedAt": "2026-10-15T05:29:52Z"
          },
          {
            "id": "SC-01",
            "line": "L2",
            "state": "running",
            "openWorkOrders": 0,
            "updatedAt": "2026-10-15T05:29:52Z"
          },
          {
            "id": "VI-01",
            "line": "L3",
            "state": "running",
            "openWorkOrders": 0,
            "updatedAt": "2026-10-15T05:29:52Z"
          },
          {
            "id": "LT-01",
            "line": "L3",
            "state": "idle",
            "openWorkOrders": 1,
            "updatedAt": "2026-10-15T05:29:52Z"
          },
          {
            "id": "PK-01",
            "line": "L3",
            "state": "running",
            "openWorkOrders": 0,
            "updatedAt": "2026-10-15T05:29:52Z"
          },
          {
            "id": "PL-01",
            "line": "L3",
            "state": "running",
            "openWorkOrders": 0,
            "updatedAt": "2026-10-15T05:29:52Z"
          }
        ]
      },
      "/plant/lines": {
        "value": [
          {
            "id": "L1",
            "oee": 71.3,
            "output": 812,
            "updatedAt": "2026-10-15T05:29:52Z"
          },
          {
            "id": "L2",
            "oee": 86.0,
            "output": 1405,
            "updatedAt": "2026-10-15T05:29:52Z"
          },
          {
            "id": "L3",
            "oee": 79.4,
            "output": 1320,
            "updatedAt": "2026-10-15T05:29:52Z"
          }
        ]
      },
      "/plant/summary": {
        "openWorkOrders": 4,
        "overdueWorkOrders": 1,
        "availability": 91.6,
        "updatedAt": "2026-10-15T05:29:52Z"
      },
      "/plant/output": {
        "value": [
          {
            "hour": "2026-10-15T06:00:00+09:00",
            "count": 402
          },
          {
            "hour": "2026-10-15T07:00:00+09:00",
            "count": 431
          },
          {
            "hour": "2026-10-15T08:00:00+09:00",
            "count": 388
          },
          {
            "hour": "2026-10-15T09:00:00+09:00",
            "count": 96
          },
          {
            "hour": "2026-10-15T10:00:00+09:00",
            "count": 415
          },
          {
            "hour": "2026-10-15T11:00:00+09:00",
            "count": 440
          },
          {
            "hour": "2026-10-15T12:00:00+09:00",
            "count": 452
          },
          {
            "hour": "2026-10-15T13:00:00+09:00",
            "count": 413
          }
        ],
        "updatedAt": "2026-10-15T05:29:52Z"
      }
    }
  }
};
