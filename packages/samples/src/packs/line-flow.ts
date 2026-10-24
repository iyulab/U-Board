// A line's stations in the order work flows through them, each a card with its state and its cycle time against
// target, the line's figures above and every station's cycle time against target below. The card is drawn once, as a component that takes a station's id; each
// station is an instance of it that reads its own row of the source — a line with more stations adds instances,
// not cards. No public source carries a line's stations, so the values are example data written for the board.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/line-flow.js';

const board: Board = {
  "presets": {
    "station": {
      "as": "group",
      "size": [
        200,
        112
      ],
      "parts": {
        "card": {
          "as": "element",
          "element": "station-card",
          "bind": {
            "name": "name",
            "state": "state",
            "stateText": "state-2",
            "cycleTime": "cycleTime",
            "target": "targetCycleTime"
          }
        }
      },
      "place": {
        "card": [
          0,
          0,
          200,
          112
        ]
      }
    }
  },
  "elements": {
    "station-card": {
      "template": "<div class=\"card\" data-state=\"{{state}}\"><span class=\"name\">{{name}}</span><span class=\"state\"><span class=\"dot\"></span>{{stateText}}</span><span class=\"ct\">{{cycleTime | fixed:1}}<small> 초</small></span><span class=\"target\">목표 {{target}}초</span></div>",
      "style": ":host{display:flex} .card{width:100%;height:100%;box-sizing:border-box;border:1px solid var(--u-widget-border);border-radius:10px;background:var(--u-widget-surface);padding:10px 14px;font-family:var(--u-widget-font-family);display:grid;grid-template-columns:1fr auto;grid-template-rows:auto 1fr auto;row-gap:4px;color:var(--u-widget-text)} .name{grid-column:1/3;font-size:13px;font-weight:600} .state{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600;align-self:center} .dot{width:9px;height:9px;border-radius:50%;background:var(--u-widget-text-secondary);flex:none} .ct{grid-row:2/4;grid-column:2;align-self:end;font-size:22px;font-weight:600;font-variant-numeric:tabular-nums} .ct small{font-size:12px;font-weight:500;color:var(--u-widget-text-secondary)} .target{font-size:11px;color:var(--u-widget-text-secondary);align-self:end} [data-state=\"running\"] .dot{background:var(--u-widget-positive)} [data-state=\"running\"] .state{color:var(--u-widget-positive)} [data-state=\"delayed\"] .dot{background:var(--u-widget-warning)} [data-state=\"stopped\"] .dot{background:var(--u-widget-negative)} [data-state=\"stopped\"] .state{color:var(--u-widget-negative)} [data-state=\"stopped\"]{border-color:var(--u-widget-negative)}",
      "props": {
        "name": "string",
        "state": "string",
        "stateText": "string",
        "cycleTime": "number",
        "target": "number"
      }
    }
  },
  "data": {
    "summary": {
      "from": "mes",
      "path": "/line/summary",
      "time": "updatedAt",
      "fresh": 300,
      "fields": {
        "state": {
          "label": "라인 상태",
          "names": {
            "running": "가동",
            "delayed": "지연",
            "stopped": "정지",
            "*": "알 수 없음"
          },
          "state": {
            "running": "ok",
            "delayed": "warn",
            "stopped": "alarm",
            "*": "idle"
          }
        },
        "throughput": {
          "label": "현재 생산량"
        },
        "target": {
          "label": "목표"
        },
        "oee": {
          "label": "OEE"
        },
        "downtimeMinutes": {
          "label": "비가동(오늘)"
        }
      }
    },
    "stations": {
      "from": "mes",
      "path": "/line/stations",
      "list": "/value",
      "key": "id",
      "time": "updatedAt",
      "fresh": 300,
      "answerTime": "/updatedAt",
      "fields": {
        "name": {},
        "state": {},
        "state-2": {
          "names": {
            "running": "가동",
            "delayed": "지연",
            "stopped": "정지",
            "*": "알 수 없음"
          },
          "at": "/state"
        },
        "cycleTime": {},
        "targetCycleTime": {}
      }
    }
  },
  "parts": {
    "line-state": {
      "as": "stat-list",
      "of": "summary",
      "show": [
        "state"
      ]
    },
    "throughput": {
      "as": "stat",
      "of": "summary",
      "show": "throughput"
    },
    "target": {
      "as": "stat",
      "of": "summary",
      "show": "target"
    },
    "oee": {
      "as": "stat",
      "of": "summary",
      "show": "oee"
    },
    "downtime": {
      "as": "stat",
      "of": "summary",
      "show": "downtimeMinutes"
    },
    "cycle-times": {
      "as": "chart.bar",
      "of": "stations",
      "title": "공정별 사이클 시간 — 실적과 목표 (초)",
      "x": "name",
      "y": [
        "cycleTime",
        "targetCycleTime"
      ],
      "series": [
        {
          "label": "사이클 시간"
        },
        {
          "label": "목표",
          "type": "line",
          "lineStyle": "dashed",
          "symbol": "none"
        }
      ]
    },
    "input": {
      "use": "station",
      "of": "stations[input]"
    },
    "process-01": {
      "use": "station",
      "of": "stations[process-01]"
    },
    "process-02": {
      "use": "station",
      "of": "stations[process-02]"
    },
    "inspection": {
      "use": "station",
      "of": "stations[inspection]"
    },
    "packaging": {
      "use": "station",
      "of": "stations[packaging]"
    }
  },
  "layout": {
    "kind": "canvas",
    "size": [
      1240,
      530
    ],
    "place": {
      "line-state": [
        40,
        30,
        200,
        64
      ],
      "throughput": [
        290,
        30,
        200,
        64
      ],
      "target": [
        540,
        30,
        200,
        64
      ],
      "oee": [
        790,
        30,
        200,
        64
      ],
      "downtime": [
        1040,
        30,
        200,
        64
      ],
      "cycle-times": [
        40,
        300,
        1200,
        230
      ],
      "input": [
        40,
        150,
        200,
        112
      ],
      "process-01": [
        290,
        150,
        200,
        112
      ],
      "process-02": [
        540,
        150,
        200,
        112
      ],
      "inspection": [
        790,
        150,
        200,
        112
      ],
      "packaging": [
        1040,
        150,
        200,
        112
      ]
    },
    "links": {
      "flow-1": {
        "from": "input/card",
        "to": "process-01/card",
        "width": 2,
        "arrow": "end"
      },
      "flow-2": {
        "from": "process-01/card",
        "to": "process-02/card",
        "width": 2,
        "arrow": "end"
      },
      "flow-3": {
        "from": "process-02/card",
        "to": "inspection/card",
        "width": 2,
        "arrow": "end"
      },
      "flow-4": {
        "from": "inspection/card",
        "to": "packaging/card",
        "width": 2,
        "arrow": "end"
      }
    }
  }
};

export const lineFlow: SamplePack = {
  id: "line-flow",
  title: {
    "ko": "생산 라인 공정 흐름",
    "en": "Production line flow"
  },
  field: {
    "ko": "제조·생산",
    "en": "Manufacturing & production"
  },
  kind: {
    "ko": "없음 — 흐름도",
    "en": "None — flow diagram"
  },
  domain: "manufacturing",
  styles: [
    "operations"
  ],
  summary: {
    "ko": "작업이 흐르는 순서대로 놓은 공정 카드와 라인의 지표. 카드는 공정 id 하나를 받는 컴포넌트로 한 번만 그리고, 공정마다 그 인스턴스가 자기 행을 읽습니다 — 공정이 늘면 인스턴스만 더합니다. 예시 데이터입니다.",
    "en": "A line’s stations in the order work flows through them, with the line’s figures. The card is drawn once, as a component that takes a station’s id, and each station is an instance of it that reads its own row — more stations are more instances. Example data."
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
