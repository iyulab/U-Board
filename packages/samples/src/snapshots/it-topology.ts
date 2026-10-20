// Example data written for the sample, not recorded from a source — no public source carries a service's servers.
// Keep it consistent: was-02 runs hot (CPU 91%) because its link to the primary database is near capacity, which
// slows the service (p95 412 ms, degraded) and holds the replica behind (lag 4.2 s, within the 5 s it is allowed);
// three alerts are open — was-02, its database link and the replica. The internet line carries the sum of what
// the load balancer hands the web servers.
import type { SampleSnapshot } from '../sample-pack.js';

export const snapshot: SampleSnapshot = {
  "capturedAt": "2026-10-20T01:30:00.000Z",
  "responses": {
    "nms": {
      "/nms/summary": {
        "state": "degraded",
        "requestsPerSecond": 1840,
        "p95Ms": 412,
        "errorRate": 0.8,
        "openAlerts": 3,
        "updatedAt": "2026-10-20T01:29:30Z"
      },
      "/nms/servers": {
        "value": [
          {
            "id": "fw",
            "name": "방화벽",
            "role": "FIREWALL",
            "state": "up",
            "cpu": 22,
            "updatedAt": "2026-10-20T01:29:30Z"
          },
          {
            "id": "lb",
            "name": "L4 로드밸런서",
            "role": "LOAD BALANCER",
            "state": "up",
            "cpu": 31,
            "updatedAt": "2026-10-20T01:29:30Z"
          },
          {
            "id": "web-01",
            "name": "web-01",
            "role": "WEB",
            "state": "up",
            "cpu": 38,
            "updatedAt": "2026-10-20T01:29:30Z"
          },
          {
            "id": "web-02",
            "name": "web-02",
            "role": "WEB",
            "state": "up",
            "cpu": 41,
            "updatedAt": "2026-10-20T01:29:30Z"
          },
          {
            "id": "was-01",
            "name": "was-01",
            "role": "WAS",
            "state": "up",
            "cpu": 57,
            "updatedAt": "2026-10-20T01:29:30Z"
          },
          {
            "id": "was-02",
            "name": "was-02",
            "role": "WAS",
            "state": "degraded",
            "cpu": 91,
            "updatedAt": "2026-10-20T01:29:30Z"
          },
          {
            "id": "db-primary",
            "name": "db-primary",
            "role": "DB PRIMARY",
            "state": "up",
            "cpu": 64,
            "updatedAt": "2026-10-20T01:29:30Z"
          },
          {
            "id": "db-replica",
            "name": "db-replica",
            "role": "DB REPLICA",
            "state": "degraded",
            "cpu": 48,
            "updatedAt": "2026-10-20T01:29:30Z"
          },
          {
            "id": "cache",
            "name": "cache",
            "role": "CACHE",
            "state": "up",
            "cpu": 18,
            "updatedAt": "2026-10-20T01:29:30Z"
          }
        ],
        "updatedAt": "2026-10-20T01:29:30Z"
      },
      "/nms/links": {
        "value": [
          {
            "id": "isp-fw",
            "mbps": 642.7,
            "utilization": 64,
            "state": "ok",
            "updatedAt": "2026-10-20T01:29:30Z"
          },
          {
            "id": "fw-lb",
            "mbps": 618.2,
            "utilization": 62,
            "state": "ok",
            "updatedAt": "2026-10-20T01:29:30Z"
          },
          {
            "id": "lb-web-01",
            "mbps": 301.4,
            "utilization": 30,
            "state": "ok",
            "updatedAt": "2026-10-20T01:29:30Z"
          },
          {
            "id": "lb-web-02",
            "mbps": 316.8,
            "utilization": 32,
            "state": "ok",
            "updatedAt": "2026-10-20T01:29:30Z"
          },
          {
            "id": "web-01-was-01",
            "mbps": 188.5,
            "utilization": 19,
            "state": "ok",
            "updatedAt": "2026-10-20T01:29:30Z"
          },
          {
            "id": "web-02-was-02",
            "mbps": 204.9,
            "utilization": 20,
            "state": "ok",
            "updatedAt": "2026-10-20T01:29:30Z"
          },
          {
            "id": "was-01-db",
            "mbps": 236,
            "utilization": 24,
            "state": "ok",
            "updatedAt": "2026-10-20T01:29:30Z"
          },
          {
            "id": "was-02-db",
            "mbps": 871.3,
            "utilization": 87,
            "state": "busy",
            "updatedAt": "2026-10-20T01:29:30Z"
          },
          {
            "id": "was-02-cache",
            "mbps": 95.6,
            "utilization": 10,
            "state": "ok",
            "updatedAt": "2026-10-20T01:29:30Z"
          },
          {
            "id": "db-repl",
            "mbps": 142.2,
            "utilization": 14,
            "lagSeconds": 4.2,
            "state": "busy",
            "updatedAt": "2026-10-20T01:29:30Z"
          }
        ],
        "updatedAt": "2026-10-20T01:29:30Z"
      },
      "/nms/traffic": {
        "value": [
          {
            "t": "2026-10-20T00:30:00.000Z",
            "mbps": 512
          },
          {
            "t": "2026-10-20T00:35:00.000Z",
            "mbps": 528
          },
          {
            "t": "2026-10-20T00:40:00.000Z",
            "mbps": 540
          },
          {
            "t": "2026-10-20T00:45:00.000Z",
            "mbps": 566
          },
          {
            "t": "2026-10-20T00:50:00.000Z",
            "mbps": 571
          },
          {
            "t": "2026-10-20T00:55:00.000Z",
            "mbps": 589
          },
          {
            "t": "2026-10-20T01:00:00.000Z",
            "mbps": 602
          },
          {
            "t": "2026-10-20T01:05:00.000Z",
            "mbps": 598
          },
          {
            "t": "2026-10-20T01:10:00.000Z",
            "mbps": 611
          },
          {
            "t": "2026-10-20T01:15:00.000Z",
            "mbps": 624
          },
          {
            "t": "2026-10-20T01:20:00.000Z",
            "mbps": 633
          },
          {
            "t": "2026-10-20T01:24:30.000Z",
            "mbps": 642.7
          }
        ],
        "updatedAt": "2026-10-20T01:29:30Z"
      }
    }
  }
};
