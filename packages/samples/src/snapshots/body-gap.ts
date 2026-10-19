// Example data written for the sample, not recorded from a source — no public source carries a line's measurements.
// Keep it consistent: the gap's nominal is 4.0 ± 0.5 mm and the flush's 0 ± 0.7 mm; a point's tolerance use is the
// larger of the two shares (|gap − 4.0| / 0.5, |flush| / 0.7). The front door stands 0.62 mm wide of the fender — out;
// its rear edge against the rear door stands proud (0.58 mm flush) — one to watch.
import type { SampleSnapshot } from '../sample-pack.js';

export const snapshot: SampleSnapshot = {
  "capturedAt": "2026-10-20T01:30:00.000Z",
  "responses": {
    "qms": {
      "/body/latest": {
        "bodyNo": "KMH-24-118372",
        "measuredAt": "2026-10-20T01:24:00Z",
        "pointsOut": 1,
        "points": [
          {
            "id": "P1",
            "name": "후드 – 펜더",
            "gapMm": 3.86,
            "flushMm": -0.18,
            "usagePct": 28,
            "measuredAt": "2026-10-20T01:24:00Z"
          },
          {
            "id": "P2",
            "name": "앞문 – 펜더",
            "gapMm": 4.62,
            "flushMm": 0.35,
            "usagePct": 124,
            "measuredAt": "2026-10-20T01:24:00Z"
          },
          {
            "id": "P3",
            "name": "앞문 – 뒷문",
            "gapMm": 4.18,
            "flushMm": 0.58,
            "usagePct": 83,
            "measuredAt": "2026-10-20T01:24:00Z"
          },
          {
            "id": "P4",
            "name": "뒷문 – 쿼터",
            "gapMm": 3.91,
            "flushMm": -0.25,
            "usagePct": 36,
            "measuredAt": "2026-10-20T01:24:00Z"
          },
          {
            "id": "P5",
            "name": "트렁크 – 쿼터",
            "gapMm": 4.31,
            "flushMm": 0.12,
            "usagePct": 62,
            "measuredAt": "2026-10-20T01:24:00Z"
          },
          {
            "id": "P6",
            "name": "범퍼 – 펜더",
            "gapMm": 4.12,
            "flushMm": 0.21,
            "usagePct": 30,
            "measuredAt": "2026-10-20T01:24:00Z"
          }
        ]
      }
    }
  }
};
