// Example data written for the sample, not recorded from a source — no public source carries a line's buffers.
// Keep it consistent: paint is the bottleneck (68 s against a 60 s takt), so the buffer before it is full and welding
// is blocked, the buffer after it is empty and trim 1 waits (its last cycle shown); the line makes what paint allows (3600 / 68 ≈ 53 an
// hour), and the WIP is the sum of the buffers.
import type { SampleSnapshot } from '../sample-pack.js';

export const snapshot: SampleSnapshot = {
  "capturedAt": "2026-10-20T01:30:00.000Z",
  "responses": {
    "mes": {
      "/line/summary": {
        "unitsPerHour": 53,
        "unitsToday": 204,
        "wip": 18,
        "bottleneckName": "도장",
        "lostMinutes": 27,
        "updatedAt": "2026-10-20T01:29:00Z"
      },
      "/line/stations": {
        "value": [
          {
            "id": "body-in",
            "name": "차체 투입",
            "state": "running",
            "cycleTime": 52,
            "bottleneck": false,
            "updatedAt": "2026-10-20T01:29:00Z"
          },
          {
            "id": "welding",
            "name": "용접",
            "state": "blocked",
            "cycleTime": 58,
            "bottleneck": false,
            "updatedAt": "2026-10-20T01:29:00Z"
          },
          {
            "id": "paint",
            "name": "도장",
            "state": "running",
            "cycleTime": 68,
            "bottleneck": true,
            "updatedAt": "2026-10-20T01:29:00Z"
          },
          {
            "id": "trim-1",
            "name": "의장 1",
            "state": "starved",
            "cycleTime": 54,
            "bottleneck": false,
            "updatedAt": "2026-10-20T01:29:00Z"
          },
          {
            "id": "trim-2",
            "name": "의장 2",
            "state": "running",
            "cycleTime": 55,
            "bottleneck": false,
            "updatedAt": "2026-10-20T01:29:00Z"
          },
          {
            "id": "final",
            "name": "최종 검사",
            "state": "running",
            "cycleTime": 49,
            "bottleneck": false,
            "updatedAt": "2026-10-20T01:29:00Z"
          }
        ],
        "updatedAt": "2026-10-20T01:29:00Z"
      },
      "/line/buffers": {
        "value": [
          {
            "id": "body-in--welding",
            "name": "투입 → 용접",
            "wip": 5,
            "capacity": 8,
            "state": "normal",
            "updatedAt": "2026-10-20T01:29:00Z"
          },
          {
            "id": "welding--paint",
            "name": "용접 → 도장",
            "wip": 8,
            "capacity": 8,
            "state": "full",
            "updatedAt": "2026-10-20T01:29:00Z"
          },
          {
            "id": "paint--trim-1",
            "name": "도장 → 의장 1",
            "wip": 0,
            "capacity": 10,
            "state": "empty",
            "updatedAt": "2026-10-20T01:29:00Z"
          },
          {
            "id": "trim-1--trim-2",
            "name": "의장 1 → 2",
            "wip": 2,
            "capacity": 6,
            "state": "normal",
            "updatedAt": "2026-10-20T01:29:00Z"
          },
          {
            "id": "trim-2--final",
            "name": "의장 2 → 검사",
            "wip": 3,
            "capacity": 6,
            "state": "normal",
            "updatedAt": "2026-10-20T01:29:00Z"
          }
        ],
        "updatedAt": "2026-10-20T01:29:00Z"
      }
    }
  }
};
