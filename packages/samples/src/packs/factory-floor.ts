// A plant floor: three production lines drawn where they stand, each machine's state and its open work
// orders on the machine's place, each line's OEE and output beside it, and the plant's totals on the side.
// No public source carries a plant's machines, so the values are example data written for the board.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/factory-floor.js';

const board: Board = {
  "data": {
    "equipment": {
      "from": "plant",
      "path": "/plant/equipment",
      "list": "/value",
      "key": "id",
      "time": "updatedAt",
      "fresh": 60,
      "fields": {
        "state": {
          "label": "프레스 1호",
          "names": {
            "running": "가동",
            "idle": "대기",
            "down": "정지",
            "maintenance": "점검",
            "*": "알 수 없음"
          },
          "state": {
            "running": "ok",
            "idle": "info",
            "down": "alarm",
            "maintenance": "warn",
            "*": "idle"
          }
        },
        "openWorkOrders": {
          "label": "미결 작업",
          "state": [
            "ok",
            1,
            "warn"
          ]
        },
        "state-2": {
          "label": "프레스 2호",
          "names": {
            "running": "가동",
            "idle": "대기",
            "down": "정지",
            "maintenance": "점검",
            "*": "알 수 없음"
          },
          "at": "/state",
          "state": {
            "running": "ok",
            "idle": "info",
            "down": "alarm",
            "maintenance": "warn",
            "*": "idle"
          }
        },
        "state-3": {
          "label": "CNC 1호",
          "names": {
            "running": "가동",
            "idle": "대기",
            "down": "정지",
            "maintenance": "점검",
            "*": "알 수 없음"
          },
          "at": "/state",
          "state": {
            "running": "ok",
            "idle": "info",
            "down": "alarm",
            "maintenance": "warn",
            "*": "idle"
          }
        },
        "state-4": {
          "label": "CNC 2호",
          "names": {
            "running": "가동",
            "idle": "대기",
            "down": "정지",
            "maintenance": "점검",
            "*": "알 수 없음"
          },
          "at": "/state",
          "state": {
            "running": "ok",
            "idle": "info",
            "down": "alarm",
            "maintenance": "warn",
            "*": "idle"
          }
        },
        "state-5": {
          "label": "용접 로봇 1",
          "names": {
            "running": "가동",
            "idle": "대기",
            "down": "정지",
            "maintenance": "점검",
            "*": "알 수 없음"
          },
          "at": "/state",
          "state": {
            "running": "ok",
            "idle": "info",
            "down": "alarm",
            "maintenance": "warn",
            "*": "idle"
          }
        },
        "state-6": {
          "label": "용접 로봇 2",
          "names": {
            "running": "가동",
            "idle": "대기",
            "down": "정지",
            "maintenance": "점검",
            "*": "알 수 없음"
          },
          "at": "/state",
          "state": {
            "running": "ok",
            "idle": "info",
            "down": "alarm",
            "maintenance": "warn",
            "*": "idle"
          }
        },
        "state-7": {
          "label": "조립 스테이션",
          "names": {
            "running": "가동",
            "idle": "대기",
            "down": "정지",
            "maintenance": "점검",
            "*": "알 수 없음"
          },
          "at": "/state",
          "state": {
            "running": "ok",
            "idle": "info",
            "down": "alarm",
            "maintenance": "warn",
            "*": "idle"
          }
        },
        "state-8": {
          "label": "체결기",
          "names": {
            "running": "가동",
            "idle": "대기",
            "down": "정지",
            "maintenance": "점검",
            "*": "알 수 없음"
          },
          "at": "/state",
          "state": {
            "running": "ok",
            "idle": "info",
            "down": "alarm",
            "maintenance": "warn",
            "*": "idle"
          }
        },
        "state-9": {
          "label": "비전 검사기",
          "names": {
            "running": "가동",
            "idle": "대기",
            "down": "정지",
            "maintenance": "점검",
            "*": "알 수 없음"
          },
          "at": "/state",
          "state": {
            "running": "ok",
            "idle": "info",
            "down": "alarm",
            "maintenance": "warn",
            "*": "idle"
          }
        },
        "state-10": {
          "label": "누설 시험기",
          "names": {
            "running": "가동",
            "idle": "대기",
            "down": "정지",
            "maintenance": "점검",
            "*": "알 수 없음"
          },
          "at": "/state",
          "state": {
            "running": "ok",
            "idle": "info",
            "down": "alarm",
            "maintenance": "warn",
            "*": "idle"
          }
        },
        "state-11": {
          "label": "포장기",
          "names": {
            "running": "가동",
            "idle": "대기",
            "down": "정지",
            "maintenance": "점검",
            "*": "알 수 없음"
          },
          "at": "/state",
          "state": {
            "running": "ok",
            "idle": "info",
            "down": "alarm",
            "maintenance": "warn",
            "*": "idle"
          }
        },
        "state-12": {
          "label": "팔레타이저",
          "names": {
            "running": "가동",
            "idle": "대기",
            "down": "정지",
            "maintenance": "점검",
            "*": "알 수 없음"
          },
          "at": "/state",
          "state": {
            "running": "ok",
            "idle": "info",
            "down": "alarm",
            "maintenance": "warn",
            "*": "idle"
          }
        }
      }
    },
    "lines": {
      "from": "plant",
      "path": "/plant/lines",
      "list": "/value",
      "key": "id",
      "time": "updatedAt",
      "fresh": 60,
      "fields": {
        "oee": {
          "label": "OEE",
          "unit": "%"
        },
        "output": {
          "label": "생산 실적 (목표 1,100)",
          "unit": "개",
          "format": "number"
        },
        "output-2": {
          "label": "생산 실적 (목표 1,500)",
          "unit": "개",
          "format": "number",
          "at": "/output"
        }
      }
    },
    "summary": {
      "from": "plant",
      "path": "/plant/summary",
      "time": "updatedAt",
      "fresh": 60,
      "fields": {
        "openWorkOrders": {
          "label": "미결 작업",
          "unit": "건"
        },
        "overdueWorkOrders": {
          "label": "기한 지난 작업",
          "unit": "건"
        },
        "availability": {
          "unit": "%"
        }
      }
    },
    "output": {
      "from": "plant",
      "path": "/plant/output",
      "list": "/value",
      "fresh": 60,
      "answerTime": "/updatedAt"
    }
  },
  "parts": {
    "machine-PR-01": {
      "as": "stat-list",
      "of": "equipment[PR-01]",
      "show": [
        "state",
        "openWorkOrders"
      ]
    },
    "machine-PR-02": {
      "as": "stat-list",
      "of": "equipment[PR-02]",
      "show": [
        "state-2",
        "openWorkOrders"
      ]
    },
    "machine-CN-01": {
      "as": "stat-list",
      "of": "equipment[CN-01]",
      "show": [
        "state-3",
        "openWorkOrders"
      ]
    },
    "machine-CN-02": {
      "as": "stat-list",
      "of": "equipment[CN-02]",
      "show": [
        "state-4",
        "openWorkOrders"
      ]
    },
    "machine-WR-01": {
      "as": "stat-list",
      "of": "equipment[WR-01]",
      "show": [
        "state-5",
        "openWorkOrders"
      ]
    },
    "machine-WR-02": {
      "as": "stat-list",
      "of": "equipment[WR-02]",
      "show": [
        "state-6",
        "openWorkOrders"
      ]
    },
    "machine-AS-01": {
      "as": "stat-list",
      "of": "equipment[AS-01]",
      "show": [
        "state-7",
        "openWorkOrders"
      ]
    },
    "machine-SC-01": {
      "as": "stat-list",
      "of": "equipment[SC-01]",
      "show": [
        "state-8",
        "openWorkOrders"
      ]
    },
    "machine-VI-01": {
      "as": "stat-list",
      "of": "equipment[VI-01]",
      "show": [
        "state-9",
        "openWorkOrders"
      ]
    },
    "machine-LT-01": {
      "as": "stat-list",
      "of": "equipment[LT-01]",
      "show": [
        "state-10",
        "openWorkOrders"
      ]
    },
    "machine-PK-01": {
      "as": "stat-list",
      "of": "equipment[PK-01]",
      "show": [
        "state-11",
        "openWorkOrders"
      ]
    },
    "machine-PL-01": {
      "as": "stat-list",
      "of": "equipment[PL-01]",
      "show": [
        "state-12",
        "openWorkOrders"
      ]
    },
    "oee-L1": {
      "as": "stat",
      "of": "lines[L1]",
      "show": "oee"
    },
    "output-L1": {
      "as": "stat",
      "of": "lines[L1]",
      "show": "output"
    },
    "oee-L2": {
      "as": "stat",
      "of": "lines[L2]",
      "show": "oee"
    },
    "output-L2": {
      "as": "stat",
      "of": "lines[L2]",
      "show": "output-2"
    },
    "oee-L3": {
      "as": "stat",
      "of": "lines[L3]",
      "show": "oee"
    },
    "output-L3": {
      "as": "stat",
      "of": "lines[L3]",
      "show": "output-2"
    },
    "open-orders": {
      "as": "stat",
      "of": "summary",
      "show": "openWorkOrders"
    },
    "overdue-orders": {
      "as": "stat",
      "of": "summary",
      "show": "overdueWorkOrders"
    },
    "availability": {
      "as": "gauge",
      "of": "summary",
      "show": "availability",
      "subtitle": "공장 가동률(오늘)",
      "max": 100
    },
    "hourly-output": {
      "as": "chart.bar",
      "of": "output",
      "title": "시간대별 생산량(전 라인)",
      "x": "hour",
      "y": "count",
      "xFormat": "time"
    }
  },
  "layout": {
    "kind": "canvas",
    "size": [
      1280,
      800
    ],
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221280%22%20height%3D%22800%22%20viewBox%3D%220%200%201280%20800%22%3E%0A%3Crect%20width%3D%221280%22%20height%3D%22800%22%20fill%3D%22%23f4f6f7%22%2F%3E%0A%3Crect%20x%3D%2228%22%20y%3D%2284%22%20width%3D%22932%22%20height%3D%22680%22%20fill%3D%22%23fbfcfc%22%20stroke%3D%22%237f939e%22%20stroke-width%3D%224%22%2F%3E%0A%3Crect%20x%3D%22964%22%20y%3D%2260%22%20width%3D%22300%22%20height%3D%22720%22%20rx%3D%228%22%20fill%3D%22%23ffffff%22%20stroke%3D%22%23d6dedb%22%2F%3E%0A%3Crect%20x%3D%2266%22%20y%3D%22158%22%20width%3D%22162%22%20height%3D%2288%22%20rx%3D%226%22%20fill%3D%22%23e3e9ec%22%20stroke%3D%22%23c3ced4%22%2F%3E%0A%3Crect%20x%3D%22238%22%20y%3D%22158%22%20width%3D%22162%22%20height%3D%2288%22%20rx%3D%226%22%20fill%3D%22%23e3e9ec%22%20stroke%3D%22%23c3ced4%22%2F%3E%0A%3Crect%20x%3D%22410%22%20y%3D%22158%22%20width%3D%22162%22%20height%3D%2288%22%20rx%3D%226%22%20fill%3D%22%23e3e9ec%22%20stroke%3D%22%23c3ced4%22%2F%3E%0A%3Crect%20x%3D%22582%22%20y%3D%22158%22%20width%3D%22162%22%20height%3D%2288%22%20rx%3D%226%22%20fill%3D%22%23e3e9ec%22%20stroke%3D%22%23c3ced4%22%2F%3E%0A%3Crect%20x%3D%2266%22%20y%3D%22378%22%20width%3D%22162%22%20height%3D%2288%22%20rx%3D%226%22%20fill%3D%22%23e3e9ec%22%20stroke%3D%22%23c3ced4%22%2F%3E%0A%3Crect%20x%3D%22238%22%20y%3D%22378%22%20width%3D%22162%22%20height%3D%2288%22%20rx%3D%226%22%20fill%3D%22%23e3e9ec%22%20stroke%3D%22%23c3ced4%22%2F%3E%0A%3Crect%20x%3D%22410%22%20y%3D%22378%22%20width%3D%22162%22%20height%3D%2288%22%20rx%3D%226%22%20fill%3D%22%23e3e9ec%22%20stroke%3D%22%23c3ced4%22%2F%3E%0A%3Crect%20x%3D%22582%22%20y%3D%22378%22%20width%3D%22162%22%20height%3D%2288%22%20rx%3D%226%22%20fill%3D%22%23e3e9ec%22%20stroke%3D%22%23c3ced4%22%2F%3E%0A%3Crect%20x%3D%2266%22%20y%3D%22598%22%20width%3D%22162%22%20height%3D%2288%22%20rx%3D%226%22%20fill%3D%22%23e3e9ec%22%20stroke%3D%22%23c3ced4%22%2F%3E%0A%3Crect%20x%3D%22238%22%20y%3D%22598%22%20width%3D%22162%22%20height%3D%2288%22%20rx%3D%226%22%20fill%3D%22%23e3e9ec%22%20stroke%3D%22%23c3ced4%22%2F%3E%0A%3Crect%20x%3D%22410%22%20y%3D%22598%22%20width%3D%22162%22%20height%3D%2288%22%20rx%3D%226%22%20fill%3D%22%23e3e9ec%22%20stroke%3D%22%23c3ced4%22%2F%3E%0A%3Crect%20x%3D%22582%22%20y%3D%22598%22%20width%3D%22162%22%20height%3D%2288%22%20rx%3D%226%22%20fill%3D%22%23e3e9ec%22%20stroke%3D%22%23c3ced4%22%2F%3E%0A%3Crect%20x%3D%2264%22%20y%3D%22266%22%20width%3D%22680%22%20height%3D%2214%22%20rx%3D%223%22%20fill%3D%22%23cfd8dd%22%2F%3E%0A%3Cpath%20d%3D%22M%2078%20273%20H%20730%22%20stroke%3D%22%239aa9b2%22%20stroke-width%3D%222%22%20stroke-dasharray%3D%228%206%22%2F%3E%0A%3Ctext%20x%3D%22736%22%20y%3D%22296%22%20font-size%3D%2211%22%20fill%3D%22%237a8a93%22%20text-anchor%3D%22end%22%20font-family%3D%22sans-serif%22%3E%EC%BB%A8%EB%B2%A0%EC%9D%B4%EC%96%B4%20%E2%86%92%3C%2Ftext%3E%0A%3Crect%20x%3D%2264%22%20y%3D%22486%22%20width%3D%22680%22%20height%3D%2214%22%20rx%3D%223%22%20fill%3D%22%23cfd8dd%22%2F%3E%0A%3Cpath%20d%3D%22M%2078%20493%20H%20730%22%20stroke%3D%22%239aa9b2%22%20stroke-width%3D%222%22%20stroke-dasharray%3D%228%206%22%2F%3E%0A%3Ctext%20x%3D%22736%22%20y%3D%22516%22%20font-size%3D%2211%22%20fill%3D%22%237a8a93%22%20text-anchor%3D%22end%22%20font-family%3D%22sans-serif%22%3E%EC%BB%A8%EB%B2%A0%EC%9D%B4%EC%96%B4%20%E2%86%92%3C%2Ftext%3E%0A%3Crect%20x%3D%2264%22%20y%3D%22706%22%20width%3D%22680%22%20height%3D%2214%22%20rx%3D%223%22%20fill%3D%22%23cfd8dd%22%2F%3E%0A%3Cpath%20d%3D%22M%2078%20713%20H%20730%22%20stroke%3D%22%239aa9b2%22%20stroke-width%3D%222%22%20stroke-dasharray%3D%228%206%22%2F%3E%0A%3Ctext%20x%3D%22736%22%20y%3D%22736%22%20font-size%3D%2211%22%20fill%3D%22%237a8a93%22%20text-anchor%3D%22end%22%20font-family%3D%22sans-serif%22%3E%EC%BB%A8%EB%B2%A0%EC%9D%B4%EC%96%B4%20%E2%86%92%3C%2Ftext%3E%0A%3Crect%20x%3D%22776%22%20y%3D%22748%22%20width%3D%22120%22%20height%3D%2216%22%20fill%3D%22%23f0c36d%22%2F%3E%0A%3Ctext%20x%3D%22836%22%20y%3D%22790%22%20font-size%3D%2211%22%20fill%3D%22%237a8a93%22%20text-anchor%3D%22middle%22%20font-family%3D%22sans-serif%22%3E%EC%B6%9C%ED%95%98%20%EB%8F%84%ED%81%AC%3C%2Ftext%3E%0A%3Ctext%20x%3D%2240%22%20y%3D%22788%22%20font-size%3D%2211%22%20fill%3D%22%235b6b70%22%20font-family%3D%22sans-serif%22%3E%EC%95%BD%EB%8F%84%20%E2%80%94%20%EC%98%88%EC%8B%9C%20%EA%B3%B5%EC%9E%A5%2C%20%EC%8B%A4%EC%A0%9C%20%EB%B0%B0%EC%B9%98%EC%99%80%20%EB%8B%A4%EB%A6%84%3C%2Ftext%3E%0A%3C%2Fsvg%3E",
    "place": {
      "machine-PR-01": [
        72,
        164,
        150,
        76
      ],
      "machine-PR-02": [
        244,
        164,
        150,
        76
      ],
      "machine-CN-01": [
        416,
        164,
        150,
        76
      ],
      "machine-CN-02": [
        588,
        164,
        150,
        76
      ],
      "machine-WR-01": [
        72,
        384,
        150,
        76
      ],
      "machine-WR-02": [
        244,
        384,
        150,
        76
      ],
      "machine-AS-01": [
        416,
        384,
        150,
        76
      ],
      "machine-SC-01": [
        588,
        384,
        150,
        76
      ],
      "machine-VI-01": [
        72,
        604,
        150,
        76
      ],
      "machine-LT-01": [
        244,
        604,
        150,
        76
      ],
      "machine-PK-01": [
        416,
        604,
        150,
        76
      ],
      "machine-PL-01": [
        588,
        604,
        150,
        76
      ],
      "oee-L1": [
        780,
        120,
        160,
        76
      ],
      "output-L1": [
        780,
        208,
        160,
        76
      ],
      "oee-L2": [
        780,
        340,
        160,
        76
      ],
      "output-L2": [
        780,
        428,
        160,
        76
      ],
      "oee-L3": [
        780,
        560,
        160,
        76
      ],
      "output-L3": [
        780,
        648,
        160,
        76
      ],
      "open-orders": [
        980,
        100,
        130,
        76
      ],
      "overdue-orders": [
        1120,
        100,
        130,
        76
      ],
      "availability": [
        980,
        196,
        270,
        150
      ],
      "hourly-output": [
        980,
        366,
        270,
        220
      ]
    },
    "shapes": {
      "title": {
        "text": "공장 설비 상태판",
        "at": [
          24,
          22
        ],
        "size": 24,
        "tone": "next"
      },
      "note": {
        "text": "설비마다 상태와 미결 작업 · 라인마다 OEE와 생산 실적 · 예시 데이터",
        "at": [
          24,
          56
        ],
        "size": 13,
        "tone": "past"
      },
      "bay-L1": {
        "box": [
          48,
          100,
          712,
          200
        ],
        "label": "1라인 · 프레스, 가공",
        "width": 1.5
      },
      "bay-L2": {
        "box": [
          48,
          320,
          712,
          200
        ],
        "label": "2라인 · 조립",
        "width": 1.5
      },
      "bay-L3": {
        "box": [
          48,
          540,
          712,
          200
        ],
        "label": "3라인 · 검사, 포장",
        "width": 1.5
      },
      "side-title": {
        "text": "공장 전체",
        "at": [
          980,
          72
        ],
        "size": 15,
        "tone": "next"
      }
    }
  }
};

export const factoryFloor: SamplePack = {
  id: "factory-floor",
  title: {
    "ko": "공장 설비 상태판",
    "en": "Plant floor"
  },
  field: {
    "ko": "제조·설비보전",
    "en": "Manufacturing & maintenance"
  },
  kind: {
    "ko": "공장 배치도",
    "en": "Plant layout"
  },
  domain: "manufacturing",
  styles: [
    "operations"
  ],
  summary: {
    "ko": "세 라인의 설비마다 가동 상태와 미결 작업을 설비가 선 자리에, 라인마다 OEE와 생산 실적을, 오른쪽은 공장 전체 가동률과 시간대별 생산량. 예시 데이터입니다.",
    "en": "Each machine’s state and open work orders where it stands on three lines, each line’s OEE and output beside it, and the plant’s availability and hourly output on the side. Example data."
  },
  connectors: [
    {
      "key": "plant",
      "name": "예시 공장 API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 설비가 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
