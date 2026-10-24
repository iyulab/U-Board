// A web service's servers in the zones they run in — the internet edge, the service tier, the data tier — and the
// links between them. Each server shows its state and CPU; each link its traffic as its label, its load as its width,
// and its colour only when it is busy or down; the replica's link its replication lag. The service's figures above,
// the internet line's traffic below. Grey for what is normal (ISA-101), as on an operations wall. No public source
// carries a service's servers, so the values are example data written for the board.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/it-topology.js';

const board: Board = {
  "elements": {
    "server": {
      "template": "<div class=\"srv {{state}}\" style=\"--cpu: {{cpu}}\" role=\"img\" aria-label=\"{{name}} {{stateText}}, CPU {{cpu}}%\">\n  <span class=\"role\">{{role}}</span>\n  <b>{{name}}</b>\n  <span class=\"st\"><i></i>{{stateText}}</span>\n  <span class=\"cpu\">CPU {{cpu | fixed:0}}%</span>\n  <span class=\"bar\"><span></span></span>\n</div>",
      "style": ".srv{box-sizing:border-box;height:100%;display:grid;grid-template-columns:1fr auto;grid-template-rows:auto auto 1fr auto;column-gap:8px;padding:7px 10px 8px;\nborder:1px solid var(--u-widget-border);border-left:4px solid var(--c);border-radius:6px;background:var(--u-widget-surface);\nfont-family:var(--u-widget-font-family);color:var(--u-widget-text);--c:#8a96a0}\n.role{grid-column:1/3;font-size:10px;letter-spacing:.06em;color:var(--u-widget-text-secondary)}\nb{font-size:14px;font-weight:600}\n.st{display:flex;align-items:center;gap:5px;font-size:12px;color:var(--u-widget-text-secondary);justify-self:end}\ni{width:8px;height:8px;border-radius:50%;background:var(--c)}\n.cpu{grid-column:1/3;align-self:end;font-size:12px;font-variant-numeric:tabular-nums}\n.bar{grid-column:1/3;height:4px;border-radius:2px;background:var(--u-widget-border);overflow:hidden}\n.bar span{display:block;height:100%;width:calc(var(--cpu) * 1%);background:var(--c)}\n.degraded{--c:var(--u-widget-warning)}\n.degraded .st{color:var(--u-widget-text);font-weight:600}\n.down{--c:var(--u-widget-negative)}\n.down .st{color:var(--u-widget-negative);font-weight:600}\n.unknown .st{font-style:italic}",
      "props": {
        "name": "string",
        "role": "string",
        "state": "string",
        "stateText": "string",
        "cpu": "number"
      }
    }
  },
  "data": {
    "summary": {
      "from": "nms",
      "path": "/nms/summary",
      "time": "updatedAt",
      "fresh": 120,
      "fields": {
        "state": {
          "label": "서비스",
          "names": {
            "up": "정상",
            "degraded": "저하",
            "down": "중단",
            "*": "알 수 없음"
          },
          "state": {
            "up": "ok",
            "degraded": "warn",
            "down": "alarm",
            "*": "idle"
          }
        },
        "requestsPerSecond": {
          "label": "요청",
          "unit": "건/초"
        },
        "p95Ms": {
          "label": "응답 시간 p95",
          "unit": "ms"
        },
        "errorRate": {
          "label": "오류율",
          "unit": "%"
        },
        "openAlerts": {
          "label": "열린 경보",
          "unit": "건"
        }
      }
    },
    "links": {
      "from": "nms",
      "path": "/nms/links",
      "list": "/value",
      "key": "id",
      "time": "updatedAt",
      "fresh": 120,
      "fields": {
        "state": {
          "label": "인터넷 회선",
          "names": {
            "ok": "정상",
            "busy": "혼잡",
            "down": "중단",
            "*": "알 수 없음"
          },
          "state": {
            "ok": "idle",
            "busy": "warn",
            "down": "alarm",
            "*": "idle"
          }
        },
        "lagSeconds": {
          "label": "복제 지연 (허용 5초)",
          "unit": "초",
          "format": "number:1"
        },
        "mbps": {
          "format": "number:0"
        },
        "state-2": {
          "at": "/state",
          "state": {
            "ok": "idle",
            "busy": "warn",
            "down": "alarm",
            "*": "idle"
          }
        },
        "utilization": {}
      }
    },
    "servers": {
      "from": "nms",
      "path": "/nms/servers",
      "list": "/value",
      "key": "id",
      "time": "updatedAt",
      "fresh": 120,
      "fields": {
        "name": {},
        "role": {},
        "state": {
          "names": {
            "up": "up",
            "degraded": "degraded",
            "down": "down",
            "*": "unknown"
          }
        },
        "state-2": {
          "names": {
            "up": "정상",
            "degraded": "저하",
            "down": "중단",
            "*": "알 수 없음"
          },
          "at": "/state"
        },
        "cpu": {}
      }
    },
    "traffic": {
      "from": "nms",
      "path": "/nms/traffic",
      "list": "/value",
      "fresh": 120,
      "answerTime": "/updatedAt"
    }
  },
  "parts": {
    "service": {
      "as": "stat-list",
      "of": "summary",
      "show": [
        "state"
      ]
    },
    "requests": {
      "as": "stat",
      "of": "summary",
      "show": "requestsPerSecond"
    },
    "latency": {
      "as": "stat",
      "of": "summary",
      "show": "p95Ms"
    },
    "errors": {
      "as": "stat",
      "of": "summary",
      "show": "errorRate"
    },
    "alerts": {
      "as": "stat",
      "of": "summary",
      "show": "openAlerts"
    },
    "isp": {
      "as": "stat-list",
      "of": "links[isp-fw]",
      "show": [
        "state"
      ]
    },
    "fw": {
      "as": "element",
      "element": "server",
      "of": "servers[fw]",
      "bind": {
        "name": "name",
        "role": "role",
        "state": "state",
        "stateText": "state-2",
        "cpu": "cpu"
      }
    },
    "lb": {
      "as": "element",
      "element": "server",
      "of": "servers[lb]",
      "bind": {
        "name": "name",
        "role": "role",
        "state": "state",
        "stateText": "state-2",
        "cpu": "cpu"
      }
    },
    "web-01": {
      "as": "element",
      "element": "server",
      "of": "servers[web-01]",
      "bind": {
        "name": "name",
        "role": "role",
        "state": "state",
        "stateText": "state-2",
        "cpu": "cpu"
      }
    },
    "web-02": {
      "as": "element",
      "element": "server",
      "of": "servers[web-02]",
      "bind": {
        "name": "name",
        "role": "role",
        "state": "state",
        "stateText": "state-2",
        "cpu": "cpu"
      }
    },
    "was-01": {
      "as": "element",
      "element": "server",
      "of": "servers[was-01]",
      "bind": {
        "name": "name",
        "role": "role",
        "state": "state",
        "stateText": "state-2",
        "cpu": "cpu"
      }
    },
    "was-02": {
      "as": "element",
      "element": "server",
      "of": "servers[was-02]",
      "bind": {
        "name": "name",
        "role": "role",
        "state": "state",
        "stateText": "state-2",
        "cpu": "cpu"
      }
    },
    "db-primary": {
      "as": "element",
      "element": "server",
      "of": "servers[db-primary]",
      "bind": {
        "name": "name",
        "role": "role",
        "state": "state",
        "stateText": "state-2",
        "cpu": "cpu"
      }
    },
    "db-replica": {
      "as": "element",
      "element": "server",
      "of": "servers[db-replica]",
      "bind": {
        "name": "name",
        "role": "role",
        "state": "state",
        "stateText": "state-2",
        "cpu": "cpu"
      }
    },
    "cache": {
      "as": "element",
      "element": "server",
      "of": "servers[cache]",
      "bind": {
        "name": "name",
        "role": "role",
        "state": "state",
        "stateText": "state-2",
        "cpu": "cpu"
      }
    },
    "traffic": {
      "as": "chart.line",
      "of": "traffic",
      "title": "인터넷 회선 트래픽 (Mbps, 최근 1시간)",
      "x": "t",
      "y": "mbps",
      "xFormat": "time",
      "series": [
        {
          "label": "트래픽",
          "symbol": "none",
          "color": "#4a555b"
        }
      ],
      "referenceLines": [
        {
          "axis": "y",
          "value": 1000,
          "label": "회선 용량 1 Gbps",
          "style": "dashed",
          "color": "#5b666c"
        }
      ]
    },
    "replica-lag": {
      "as": "stat",
      "of": "links[db-repl]",
      "show": "lagSeconds"
    }
  },
  "layout": {
    "kind": "canvas",
    "size": [
      1248,
      780
    ],
    "place": {
      "service": [
        32,
        76,
        220,
        66
      ],
      "requests": [
        278,
        76,
        220,
        66
      ],
      "latency": [
        524,
        76,
        220,
        66
      ],
      "errors": [
        770,
        76,
        220,
        66
      ],
      "alerts": [
        1016,
        76,
        220,
        66
      ],
      "isp": [
        52,
        230,
        150,
        26
      ],
      "fw": [
        290,
        200,
        180,
        84
      ],
      "lb": [
        290,
        353,
        180,
        84
      ],
      "web-01": [
        530,
        236,
        180,
        84
      ],
      "web-02": [
        530,
        470,
        180,
        84
      ],
      "was-01": [
        768,
        236,
        180,
        84
      ],
      "was-02": [
        768,
        470,
        180,
        84
      ],
      "db-primary": [
        1032,
        236,
        180,
        84
      ],
      "db-replica": [
        1032,
        392,
        180,
        84
      ],
      "cache": [
        1032,
        516,
        180,
        84
      ],
      "traffic": [
        32,
        640,
        940,
        140
      ],
      "replica-lag": [
        1000,
        640,
        248,
        66
      ]
    },
    "shapes": {
      "title": {
        "text": "서비스 운영 토폴로지",
        "at": [
          32,
          18
        ],
        "size": 24,
        "tone": "next"
      },
      "note": {
        "text": "영역마다 서버 · 링크 라벨은 트래픽, 굵기는 사용률, 색은 혼잡·중단일 때만 · 예시 데이터",
        "at": [
          32,
          50
        ],
        "size": 13,
        "tone": "past"
      },
      "zone-edge": {
        "box": [
          32,
          168,
          456,
          450
        ],
        "label": "인터넷 경계 (DMZ)",
        "width": 1.5,
        "dash": true
      },
      "zone-service": {
        "box": [
          508,
          168,
          464,
          450
        ],
        "label": "서비스 계층",
        "width": 1.5,
        "dash": true
      },
      "zone-data": {
        "box": [
          996,
          168,
          252,
          450
        ],
        "label": "데이터 계층",
        "width": 1.5,
        "dash": true
      }
    },
    "links": {
      "isp-fw": {
        "from": "isp",
        "to": "fw",
        "label": "{{mbps}} Mbps",
        "show": "state-2",
        "weight": {
          "field": "utilization",
          "bands": [
            2,
            60,
            3.5,
            85,
            5
          ]
        },
        "of": "links[isp-fw]",
        "width": 2,
        "route": "orthogonal"
      },
      "fw-lb": {
        "from": "fw",
        "to": "lb",
        "label": "{{mbps}} Mbps",
        "show": "state-2",
        "weight": {
          "field": "utilization",
          "bands": [
            2,
            60,
            3.5,
            85,
            5
          ]
        },
        "of": "links[fw-lb]",
        "width": 2,
        "route": "orthogonal"
      },
      "lb-web-01": {
        "from": "lb",
        "to": "web-01",
        "label": "{{mbps}} Mbps",
        "show": "state-2",
        "weight": {
          "field": "utilization",
          "bands": [
            2,
            60,
            3.5,
            85,
            5
          ]
        },
        "of": "links[lb-web-01]",
        "width": 2,
        "route": "orthogonal"
      },
      "lb-web-02": {
        "from": "lb",
        "to": "web-02",
        "label": "{{mbps}} Mbps",
        "show": "state-2",
        "weight": {
          "field": "utilization",
          "bands": [
            2,
            60,
            3.5,
            85,
            5
          ]
        },
        "of": "links[lb-web-02]",
        "width": 2,
        "route": "orthogonal"
      },
      "web-01-was-01": {
        "from": "web-01",
        "to": "was-01",
        "label": "{{mbps}} Mbps",
        "show": "state-2",
        "weight": {
          "field": "utilization",
          "bands": [
            2,
            60,
            3.5,
            85,
            5
          ]
        },
        "of": "links[web-01-was-01]",
        "width": 2,
        "route": "orthogonal"
      },
      "web-02-was-02": {
        "from": "web-02",
        "to": "was-02",
        "label": "{{mbps}} Mbps",
        "show": "state-2",
        "weight": {
          "field": "utilization",
          "bands": [
            2,
            60,
            3.5,
            85,
            5
          ]
        },
        "of": "links[web-02-was-02]",
        "width": 2,
        "route": "orthogonal"
      },
      "was-01-db": {
        "from": "was-01",
        "to": "db-primary",
        "label": "{{mbps}} Mbps",
        "show": "state-2",
        "weight": {
          "field": "utilization",
          "bands": [
            2,
            60,
            3.5,
            85,
            5
          ]
        },
        "of": "links[was-01-db]",
        "width": 2,
        "route": "orthogonal"
      },
      "was-02-db": {
        "from": "was-02",
        "to": "db-primary",
        "label": "{{mbps}} Mbps",
        "show": "state-2",
        "weight": {
          "field": "utilization",
          "bands": [
            2,
            60,
            3.5,
            85,
            5
          ]
        },
        "of": "links[was-02-db]",
        "width": 2
      },
      "was-02-cache": {
        "from": "was-02",
        "to": "cache",
        "label": "{{mbps}} Mbps",
        "show": "state-2",
        "weight": {
          "field": "utilization",
          "bands": [
            2,
            60,
            3.5,
            85,
            5
          ]
        },
        "of": "links[was-02-cache]",
        "width": 2,
        "route": "orthogonal"
      },
      "db-repl": {
        "from": "db-primary",
        "to": "db-replica",
        "label": "복제 지연 {{lagSeconds}}초",
        "show": "state-2",
        "weight": {
          "field": "utilization",
          "bands": [
            2,
            60,
            3.5,
            85,
            5
          ]
        },
        "of": "links[db-repl]",
        "width": 2,
        "route": "orthogonal"
      }
    }
  }
};

export const itTopology: SamplePack = {
  id: "it-topology",
  title: {
    "ko": "서비스 운영 토폴로지",
    "en": "Service operations topology"
  },
  field: {
    "ko": "IT 운영",
    "en": "IT operations"
  },
  kind: {
    "ko": "없음 — 영역 구성도",
    "en": "None — zone diagram"
  },
  domain: "it",
  styles: [
    "operations"
  ],
  summary: {
    "ko": "인터넷 경계·서비스 계층·데이터 계층의 영역 안에 서버마다 상태와 CPU를, 서버 사이 링크에는 트래픽을 라벨로·사용률을 굵기로, 혼잡하거나 끊긴 링크만 색으로. 복제 링크에는 복제 지연을. 위에는 서비스 지표, 아래에는 인터넷 회선 트래픽. 예시 데이터입니다.",
    "en": "Each server’s state and CPU inside its zone — the internet edge, the service tier, the data tier — and on the links between them the traffic as a label and the load as the width, with colour only for a busy or broken link; the replica’s link shows its replication lag. The service’s figures above, the internet line’s traffic below. Example data."
  },
  connectors: [
    {
      "key": "nms",
      "name": "예시 서버·네트워크 감시 API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 서비스가 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
