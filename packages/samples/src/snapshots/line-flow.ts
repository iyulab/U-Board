// Example data written for the sample, not recorded from a source — no public source carries a line's stations.
// Keep it consistent: the line is delayed because Process 02 runs over its target cycle time, packaging has stopped
// behind it (the downtime so far is its stop), and the throughput is what the slowest running station allows.
import type { SampleSnapshot } from '../sample-pack.js';

export const snapshot: SampleSnapshot = {
  "capturedAt": "2026-10-20T01:30:00.000Z",
  "responses": {
    "mes": {
      "/line/summary": {
        "state": "delayed",
        "throughput": 74,
        "target": 85,
        "oee": 76.8,
        "downtimeMinutes": 18,
        "updatedAt": "2026-10-20T01:29:00Z"
      },
      "/line/stations": {
        "value": [
          { "id": "input", "name": "투입", "state": "running", "cycleTime": 38.2, "targetCycleTime": 40, "updatedAt": "2026-10-20T01:29:00Z" },
          { "id": "process-01", "name": "가공 1", "state": "running", "cycleTime": 41.5, "targetCycleTime": 42, "updatedAt": "2026-10-20T01:29:00Z" },
          { "id": "process-02", "name": "가공 2", "state": "delayed", "cycleTime": 48.6, "targetCycleTime": 42, "updatedAt": "2026-10-20T01:29:00Z" },
          { "id": "inspection", "name": "검사", "state": "running", "cycleTime": 30.4, "targetCycleTime": 32, "updatedAt": "2026-10-20T01:29:00Z" },
          { "id": "packaging", "name": "포장", "state": "stopped", "cycleTime": 0, "targetCycleTime": 25, "updatedAt": "2026-10-20T01:28:00Z" }
        ],
        "updatedAt": "2026-10-20T01:29:00Z"
      }
    }
  }
};
