// Example data written for the sample, not recorded from a source — no public source carries a line's production.
// Keep it consistent: OEE is availability × performance × quality (91.2 % × 88.5 % × 98.6 % ≈ 79.6 %), the dip at
// 10:00 is the die change at the top of the downtime list, and the fastener that is down is the third reason.
import type { SampleSnapshot } from '../sample-pack.js';

export const snapshot: SampleSnapshot = {
  "capturedAt": "2026-10-15T05:30:00.000Z",
  "responses": {
    "mes": {
      "/line/summary": {
        "oee": 79.6,
        "availability": 91.2,
        "performance": 88.5,
        "quality": 98.6,
        "updatedAt": "2026-10-15T05:29:00Z"
      },
      "/line/hourly": {
        "value": [
          { "hour": "2026-10-14T23:00:00Z", "output": 112, "target": 120 },
          { "hour": "2026-10-15T00:00:00Z", "output": 118, "target": 120 },
          { "hour": "2026-10-15T01:00:00Z", "output": 96, "target": 120 },
          { "hour": "2026-10-15T02:00:00Z", "output": 121, "target": 120 },
          { "hour": "2026-10-15T03:00:00Z", "output": 117, "target": 120 },
          { "hour": "2026-10-15T04:00:00Z", "output": 104, "target": 120 }
        ],
        "updatedAt": "2026-10-15T05:00:00Z"
      },
      "/line/machines": {
        "value": [
          { "id": "PR-11", "state": "running", "updatedAt": "2026-10-15T05:29:00Z" },
          { "id": "WR-11", "state": "running", "updatedAt": "2026-10-15T05:29:00Z" },
          { "id": "SC-11", "state": "down", "updatedAt": "2026-10-15T05:29:00Z" },
          { "id": "VI-11", "state": "running", "updatedAt": "2026-10-15T05:29:00Z" },
          { "id": "PK-11", "state": "idle", "updatedAt": "2026-10-15T05:29:00Z" }
        ]
      },
      "/line/downtime": {
        "value": [
          { "reason": "금형 교체", "minutes": 34 },
          { "reason": "자재 대기", "minutes": 21 },
          { "reason": "체결기 고장", "minutes": 18 },
          { "reason": "품질 확인", "minutes": 9 },
          { "reason": "기타", "minutes": 5 }
        ],
        "updatedAt": "2026-10-15T05:29:00Z"
      },
      "/line/orders": {
        "value": [
          { "order": "WO-1015-21", "item": "브래킷 A", "planned": 480, "done": 480, "due": "11:00" },
          { "order": "WO-1015-22", "item": "브래킷 B", "planned": 360, "done": 188, "due": "15:00" },
          { "order": "WO-1015-23", "item": "하우징 C", "planned": 240, "done": 0, "due": "17:30" },
          { "order": "WO-1015-24", "item": "브래킷 A", "planned": 480, "done": 0, "due": "21:00" }
        ],
        "updatedAt": "2026-10-15T05:29:00Z"
      }
    }
  }
};
