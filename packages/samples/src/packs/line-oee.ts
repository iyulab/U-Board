// An assembly line's production at a glance, the way most plant dashboards are laid out: no drawing behind it,
// the line's OEE and its three factors on top, output against plan by the hour, the machines' states, why the
// line stood still and the work orders on it — in order, each item in the room it needs, at any screen width. No
// public source carries a line's production, so the values are example data written for the board.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/line-oee.js';

const board: Board = {
  "data": {
    "summary": {
      "from": "mes",
      "path": "/line/summary",
      "time": "updatedAt",
      "fresh": 300,
      "fields": {
        "oee": {
          "unit": "%"
        },
        "availability": {
          "unit": "%"
        },
        "performance": {
          "unit": "%"
        },
        "quality": {
          "unit": "%"
        }
      }
    },
    "hourly": {
      "from": "mes",
      "path": "/line/hourly",
      "list": "/value",
      "fresh": 5400,
      "answerTime": "/updatedAt"
    },
    "machines": {
      "from": "mes",
      "path": "/line/machines",
      "list": "/value",
      "pivot": {
        "key": "id",
        "value": "state"
      },
      "time": "updatedAt",
      "fresh": 300,
      "fields": {
        "PR-11": {
          "label": "프레스",
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
        "WR-11": {
          "label": "용접 로봇",
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
        "SC-11": {
          "label": "체결기",
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
        "VI-11": {
          "label": "비전 검사기",
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
        "PK-11": {
          "label": "포장기",
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
        }
      }
    },
    "downtime": {
      "from": "mes",
      "path": "/line/downtime",
      "list": "/value",
      "fresh": 300,
      "answerTime": "/updatedAt"
    },
    "orders": {
      "from": "mes",
      "path": "/line/orders",
      "list": "/value",
      "fresh": 300,
      "answerTime": "/updatedAt",
      "fields": {
        "order": {
          "label": "지시 번호"
        },
        "item": {
          "label": "품목"
        },
        "planned": {
          "label": "계획",
          "format": "number"
        },
        "done": {
          "label": "실적",
          "format": "number"
        },
        "due": {
          "label": "납기"
        }
      }
    }
  },
  "parts": {
    "oee": {
      "as": "gauge",
      "of": "summary",
      "show": "oee",
      "subtitle": "OEE (오늘)",
      "max": 100
    },
    "availability": {
      "as": "gauge",
      "of": "summary",
      "show": "availability",
      "subtitle": "가동률",
      "max": 100
    },
    "performance": {
      "as": "gauge",
      "of": "summary",
      "show": "performance",
      "subtitle": "성능률",
      "max": 100
    },
    "quality": {
      "as": "gauge",
      "of": "summary",
      "show": "quality",
      "subtitle": "양품률",
      "max": 100
    },
    "hourly": {
      "as": "chart.bar",
      "of": "hourly",
      "title": "시간대별 생산 — 실적과 계획",
      "x": "hour",
      "y": [
        "output",
        "target"
      ],
      "xFormat": "time",
      "series": [
        {
          "label": "실적"
        },
        {
          "label": "계획",
          "type": "line",
          "lineStyle": "dashed",
          "symbol": "none"
        }
      ]
    },
    "machines": {
      "as": "stat-list",
      "of": "machines",
      "show": [
        "PR-11",
        "WR-11",
        "SC-11",
        "VI-11",
        "PK-11"
      ]
    },
    "downtime": {
      "as": "chart.bar",
      "of": "downtime",
      "title": "비가동 사유 (오늘, 분)",
      "x": "reason",
      "y": "minutes",
      "horizontal": true,
      "series": [
        {
          "label": "비가동(분)"
        }
      ]
    },
    "orders": {
      "as": "table",
      "of": "orders",
      "show": [
        "order",
        "item",
        "planned",
        "done",
        "due"
      ],
      "title": "작업 지시"
    }
  },
  "layout": {
    "kind": "grid",
    "items": [
      [
        "oee",
        3
      ],
      [
        "availability",
        3
      ],
      [
        "performance",
        3
      ],
      [
        "quality",
        3
      ],
      [
        "hourly",
        8
      ],
      [
        "machines",
        4
      ],
      [
        "downtime",
        6
      ],
      [
        "orders",
        6
      ]
    ]
  }
};

export const lineOee: SamplePack = {
  id: "line-oee",
  title: {
    "ko": "조립 라인 OEE 현황",
    "en": "Assembly line OEE"
  },
  field: {
    "ko": "제조·생산",
    "en": "Manufacturing & production"
  },
  kind: {
    "ko": "없음 — 그리드 배치",
    "en": "None — grid layout"
  },
  domain: "manufacturing",
  styles: [
    "operations"
  ],
  summary: {
    "ko": "도면 없이 순서대로 놓은 일반 대시보드 — 라인의 OEE와 세 요소, 시간대별 생산 실적과 계획, 설비 상태, 비가동 사유, 작업 지시. 화면 폭에 맞춰 줄을 바꿉니다. 예시 데이터입니다.",
    "en": "An ordinary dashboard with no drawing, laid out in order — the line’s OEE and its three factors, output against plan by the hour, the machines’ states, why the line stood still and its work orders. It rewraps to the screen’s width. Example data."
  },
  connectors: [
    {
      "key": "mes",
      "name": "예시 MES API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 라인이 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
