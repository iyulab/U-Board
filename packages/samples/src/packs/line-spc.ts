// A machining line's statistical process control, station by station along the line as it runs: each
// inspection point's control state and latest measurement under its place in the flow, a small control chart
// of its recent subgroups, its Cpk, and the line's nonconformities below. The source judges control (its SPC
// rules) and computes Cpk; the board shows what it judged. No public source carries a line's measurements, so
// the values are example data written for the board.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/line-spc.js';

const board: Board = {
  "data": {
    "stations": {
      "from": "quality",
      "path": "/qc/stations",
      "list": "/value",
      "key": "id",
      "time": "updatedAt",
      "fresh": 3600,
      "fields": {
        "state": {
          "label": "경도 HRC 28–34",
          "names": {
            "in": "관리 안",
            "ooc": "관리 이탈",
            "oos": "규격 이탈",
            "stale": "미수집",
            "*": "알 수 없음"
          },
          "state": {
            "in": "ok",
            "ooc": "warn",
            "oos": "alarm",
            "stale": "idle",
            "*": "idle"
          }
        },
        "last": {
          "label": "최근 측정"
        },
        "state-2": {
          "at": "/state",
          "state": {
            "in": "ok",
            "ooc": "warn",
            "oos": "alarm",
            "stale": "idle",
            "*": "idle"
          }
        },
        "cpk": {
          "label": "Cpk",
          "state": [
            "alarm",
            1,
            "warn",
            1.33,
            "ok"
          ]
        },
        "state-3": {
          "label": "외경 Ø25 ±0.02",
          "names": {
            "in": "관리 안",
            "ooc": "관리 이탈",
            "oos": "규격 이탈",
            "stale": "미수집",
            "*": "알 수 없음"
          },
          "at": "/state",
          "state": {
            "in": "ok",
            "ooc": "warn",
            "oos": "alarm",
            "stale": "idle",
            "*": "idle"
          }
        },
        "state-4": {
          "label": "홈 깊이 3.00 ±0.05",
          "names": {
            "in": "관리 안",
            "ooc": "관리 이탈",
            "oos": "규격 이탈",
            "stale": "미수집",
            "*": "알 수 없음"
          },
          "at": "/state",
          "state": {
            "in": "ok",
            "ooc": "warn",
            "oos": "alarm",
            "stale": "idle",
            "*": "idle"
          }
        },
        "state-5": {
          "label": "거칠기 Ra ≤ 0.8",
          "names": {
            "in": "관리 안",
            "ooc": "관리 이탈",
            "oos": "규격 이탈",
            "stale": "미수집",
            "*": "알 수 없음"
          },
          "at": "/state",
          "state": {
            "in": "ok",
            "ooc": "warn",
            "oos": "alarm",
            "stale": "idle",
            "*": "idle"
          }
        },
        "state-6": {
          "label": "전장 120.0 ±0.1",
          "names": {
            "in": "관리 안",
            "ooc": "관리 이탈",
            "oos": "규격 이탈",
            "stale": "미수집",
            "*": "알 수 없음"
          },
          "at": "/state",
          "state": {
            "in": "ok",
            "ooc": "warn",
            "oos": "alarm",
            "stale": "idle",
            "*": "idle"
          }
        }
      }
    },
    "IQC": {
      "from": "quality",
      "path": "/qc/subgroups/IQC",
      "list": "/value",
      "fresh": 3600,
      "answerTime": "/updatedAt"
    },
    "OP10": {
      "from": "quality",
      "path": "/qc/subgroups/OP10",
      "list": "/value",
      "fresh": 3600,
      "answerTime": "/updatedAt"
    },
    "OP20": {
      "from": "quality",
      "path": "/qc/subgroups/OP20",
      "list": "/value",
      "fresh": 3600,
      "answerTime": "/updatedAt"
    },
    "OP30": {
      "from": "quality",
      "path": "/qc/subgroups/OP30",
      "list": "/value",
      "fresh": 3600,
      "answerTime": "/updatedAt"
    },
    "FINAL": {
      "from": "quality",
      "path": "/qc/subgroups/FINAL",
      "list": "/value",
      "fresh": 3600,
      "answerTime": "/updatedAt"
    },
    "summary": {
      "from": "quality",
      "path": "/qc/summary",
      "time": "updatedAt",
      "fresh": 3600,
      "fields": {
        "openNcr": {
          "label": "미결 부적합(NCR)",
          "unit": "건"
        },
        "weekPpm": {
          "label": "이번 주 불량",
          "unit": "PPM",
          "format": "number"
        }
      }
    },
    "defects": {
      "from": "quality",
      "path": "/qc/defects",
      "list": "/value",
      "fresh": 3600,
      "answerTime": "/updatedAt"
    }
  },
  "parts": {
    "state-IQC": {
      "as": "stat-list",
      "of": "stations[IQC]",
      "show": [
        "state",
        "last"
      ],
      "state": "state-2"
    },
    "chart-IQC": {
      "as": "chart.line",
      "of": "IQC",
      "x": "t",
      "y": [
        "mean",
        "ucl",
        "lcl"
      ],
      "xFormat": "time",
      "series": [
        {
          "label": "평균"
        },
        {
          "label": "UCL",
          "lineStyle": "dashed",
          "symbol": "none"
        },
        {
          "label": "LCL",
          "lineStyle": "dashed",
          "symbol": "none"
        }
      ],
      "valueAxisZero": false
    },
    "cpk-IQC": {
      "as": "stat-list",
      "of": "stations[IQC]",
      "show": [
        "cpk"
      ]
    },
    "state-OP10": {
      "as": "stat-list",
      "of": "stations[OP10]",
      "show": [
        "state-3",
        "last"
      ],
      "state": "state-2"
    },
    "chart-OP10": {
      "as": "chart.line",
      "of": "OP10",
      "x": "t",
      "y": [
        "mean",
        "ucl",
        "lcl"
      ],
      "xFormat": "time",
      "series": [
        {
          "label": "평균"
        },
        {
          "label": "UCL",
          "lineStyle": "dashed",
          "symbol": "none"
        },
        {
          "label": "LCL",
          "lineStyle": "dashed",
          "symbol": "none"
        }
      ],
      "valueAxisZero": false
    },
    "cpk-OP10": {
      "as": "stat-list",
      "of": "stations[OP10]",
      "show": [
        "cpk"
      ]
    },
    "state-OP20": {
      "as": "stat-list",
      "of": "stations[OP20]",
      "show": [
        "state-4",
        "last"
      ],
      "state": "state-2"
    },
    "chart-OP20": {
      "as": "chart.line",
      "of": "OP20",
      "x": "t",
      "y": [
        "mean",
        "ucl",
        "lcl"
      ],
      "xFormat": "time",
      "series": [
        {
          "label": "평균"
        },
        {
          "label": "UCL",
          "lineStyle": "dashed",
          "symbol": "none"
        },
        {
          "label": "LCL",
          "lineStyle": "dashed",
          "symbol": "none"
        }
      ],
      "valueAxisZero": false
    },
    "cpk-OP20": {
      "as": "stat-list",
      "of": "stations[OP20]",
      "show": [
        "cpk"
      ]
    },
    "state-OP30": {
      "as": "stat-list",
      "of": "stations[OP30]",
      "show": [
        "state-5",
        "last"
      ],
      "state": "state-2"
    },
    "chart-OP30": {
      "as": "chart.line",
      "of": "OP30",
      "x": "t",
      "y": [
        "mean",
        "ucl",
        "lcl"
      ],
      "xFormat": "time",
      "series": [
        {
          "label": "평균"
        },
        {
          "label": "UCL",
          "lineStyle": "dashed",
          "symbol": "none"
        },
        {
          "label": "LCL",
          "lineStyle": "dashed",
          "symbol": "none"
        }
      ],
      "valueAxisZero": false
    },
    "cpk-OP30": {
      "as": "stat-list",
      "of": "stations[OP30]",
      "show": [
        "cpk"
      ]
    },
    "state-FINAL": {
      "as": "stat-list",
      "of": "stations[FINAL]",
      "show": [
        "state-6",
        "last"
      ],
      "state": "state-2"
    },
    "chart-FINAL": {
      "as": "chart.line",
      "of": "FINAL",
      "x": "t",
      "y": [
        "mean",
        "ucl",
        "lcl"
      ],
      "xFormat": "time",
      "series": [
        {
          "label": "평균"
        },
        {
          "label": "UCL",
          "lineStyle": "dashed",
          "symbol": "none"
        },
        {
          "label": "LCL",
          "lineStyle": "dashed",
          "symbol": "none"
        }
      ],
      "valueAxisZero": false
    },
    "cpk-FINAL": {
      "as": "stat-list",
      "of": "stations[FINAL]",
      "show": [
        "cpk"
      ]
    },
    "open-ncr": {
      "as": "stat",
      "of": "summary",
      "show": "openNcr"
    },
    "ppm": {
      "as": "stat",
      "of": "summary",
      "show": "weekPpm"
    },
    "pareto": {
      "as": "chart.bar",
      "of": "defects",
      "title": "이번 주 불량 유형(건)",
      "x": "type",
      "y": "count"
    }
  },
  "layout": {
    "kind": "canvas",
    "size": [
      1280,
      780
    ],
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221280%22%20height%3D%22780%22%20viewBox%3D%220%200%201280%20780%22%3E%0A%3Cdefs%3E%3Cmarker%20id%3D%22arrow%22%20viewBox%3D%220%200%208%208%22%20refX%3D%227%22%20refY%3D%224%22%20markerWidth%3D%226%22%20markerHeight%3D%226%22%20orient%3D%22auto%22%3E%3Cpath%20d%3D%22M0%200%20L8%204%20L0%208%20z%22%20fill%3D%22%237f939e%22%2F%3E%3C%2Fmarker%3E%3C%2Fdefs%3E%0A%3Crect%20width%3D%221280%22%20height%3D%22780%22%20fill%3D%22%23f4f6f7%22%2F%3E%0A%3Crect%20x%3D%2230%22%20y%3D%22112%22%20width%3D%22190%22%20height%3D%2256%22%20rx%3D%226%22%20fill%3D%22%23e9eef1%22%20stroke%3D%22%239aaab3%22%2F%3E%0A%3Ctext%20x%3D%22125%22%20y%3D%22145%22%20font-size%3D%2214%22%20fill%3D%22%2322313b%22%20text-anchor%3D%22middle%22%20font-family%3D%22sans-serif%22%3E%EC%88%98%EC%9E%85%20%EA%B2%80%EC%82%AC%3C%2Ftext%3E%0A%3Crect%20x%3D%22235%22%20y%3D%22112%22%20width%3D%22190%22%20height%3D%2256%22%20rx%3D%226%22%20fill%3D%22%23e9eef1%22%20stroke%3D%22%239aaab3%22%2F%3E%0A%3Ctext%20x%3D%22330%22%20y%3D%22145%22%20font-size%3D%2214%22%20fill%3D%22%2322313b%22%20text-anchor%3D%22middle%22%20font-family%3D%22sans-serif%22%3EOP10%20%EC%84%A0%EB%B0%98%3C%2Ftext%3E%0A%3Crect%20x%3D%22440%22%20y%3D%22112%22%20width%3D%22190%22%20height%3D%2256%22%20rx%3D%226%22%20fill%3D%22%23e9eef1%22%20stroke%3D%22%239aaab3%22%2F%3E%0A%3Ctext%20x%3D%22535%22%20y%3D%22145%22%20font-size%3D%2214%22%20fill%3D%22%2322313b%22%20text-anchor%3D%22middle%22%20font-family%3D%22sans-serif%22%3EOP20%20%EB%B0%80%EB%A7%81%3C%2Ftext%3E%0A%3Crect%20x%3D%22645%22%20y%3D%22112%22%20width%3D%22190%22%20height%3D%2256%22%20rx%3D%226%22%20fill%3D%22%23e9eef1%22%20stroke%3D%22%239aaab3%22%2F%3E%0A%3Ctext%20x%3D%22740%22%20y%3D%22145%22%20font-size%3D%2214%22%20fill%3D%22%2322313b%22%20text-anchor%3D%22middle%22%20font-family%3D%22sans-serif%22%3EOP30%20%EC%97%B0%EC%82%AD%3C%2Ftext%3E%0A%3Crect%20x%3D%22850%22%20y%3D%22112%22%20width%3D%22190%22%20height%3D%2256%22%20rx%3D%226%22%20fill%3D%22%23f3f5f6%22%20stroke%3D%22%239aaab3%22%2F%3E%0A%3Ctext%20x%3D%22945%22%20y%3D%22145%22%20font-size%3D%2214%22%20fill%3D%22%2322313b%22%20text-anchor%3D%22middle%22%20font-family%3D%22sans-serif%22%3E%EC%84%B8%EC%B2%99%3C%2Ftext%3E%0A%3Crect%20x%3D%221055%22%20y%3D%22112%22%20width%3D%22190%22%20height%3D%2256%22%20rx%3D%226%22%20fill%3D%22%23e9eef1%22%20stroke%3D%22%239aaab3%22%2F%3E%0A%3Ctext%20x%3D%221150%22%20y%3D%22145%22%20font-size%3D%2214%22%20fill%3D%22%2322313b%22%20text-anchor%3D%22middle%22%20font-family%3D%22sans-serif%22%3E%EC%B5%9C%EC%A2%85%20%EA%B2%80%EC%82%AC%3C%2Ftext%3E%0A%3Cpath%20d%3D%22M%20222%20140%20H%20232%22%20stroke%3D%22%237f939e%22%20stroke-width%3D%222%22%20marker-end%3D%22url(%23arrow)%22%2F%3E%0A%3Cpath%20d%3D%22M%20427%20140%20H%20437%22%20stroke%3D%22%237f939e%22%20stroke-width%3D%222%22%20marker-end%3D%22url(%23arrow)%22%2F%3E%0A%3Cpath%20d%3D%22M%20632%20140%20H%20642%22%20stroke%3D%22%237f939e%22%20stroke-width%3D%222%22%20marker-end%3D%22url(%23arrow)%22%2F%3E%0A%3Cpath%20d%3D%22M%20837%20140%20H%20847%22%20stroke%3D%22%237f939e%22%20stroke-width%3D%222%22%20marker-end%3D%22url(%23arrow)%22%2F%3E%0A%3Cpath%20d%3D%22M%201042%20140%20H%201052%22%20stroke%3D%22%237f939e%22%20stroke-width%3D%222%22%20marker-end%3D%22url(%23arrow)%22%2F%3E%0A%3Crect%20x%3D%2230%22%20y%3D%22556%22%20width%3D%22800%22%20height%3D%22204%22%20rx%3D%228%22%20fill%3D%22%23ffffff%22%20stroke%3D%22%23d6dedb%22%2F%3E%0A%3Ctext%20x%3D%221256%22%20y%3D%22768%22%20font-size%3D%2211%22%20fill%3D%22%235b6b70%22%20text-anchor%3D%22end%22%20font-family%3D%22sans-serif%22%3E%EB%8F%84%EC%8B%9D%20%E2%80%94%20%EC%98%88%EC%8B%9C%20%EB%9D%BC%EC%9D%B8%2C%20%EC%8B%A4%EC%A0%9C%20%EA%B3%B5%EC%A0%95%EA%B3%BC%20%EB%8B%A4%EB%A6%84%3C%2Ftext%3E%0A%3C%2Fsvg%3E",
    "place": {
      "state-IQC": [
        30,
        186,
        190,
        76
      ],
      "chart-IQC": [
        30,
        276,
        190,
        170
      ],
      "cpk-IQC": [
        30,
        460,
        190,
        44
      ],
      "state-OP10": [
        235,
        186,
        190,
        76
      ],
      "chart-OP10": [
        235,
        276,
        190,
        170
      ],
      "cpk-OP10": [
        235,
        460,
        190,
        44
      ],
      "state-OP20": [
        440,
        186,
        190,
        76
      ],
      "chart-OP20": [
        440,
        276,
        190,
        170
      ],
      "cpk-OP20": [
        440,
        460,
        190,
        44
      ],
      "state-OP30": [
        645,
        186,
        190,
        76
      ],
      "chart-OP30": [
        645,
        276,
        190,
        170
      ],
      "cpk-OP30": [
        645,
        460,
        190,
        44
      ],
      "state-FINAL": [
        1055,
        186,
        190,
        76
      ],
      "chart-FINAL": [
        1055,
        276,
        190,
        170
      ],
      "cpk-FINAL": [
        1055,
        460,
        190,
        44
      ],
      "open-ncr": [
        46,
        592,
        170,
        76
      ],
      "ppm": [
        46,
        680,
        170,
        76
      ],
      "pareto": [
        250,
        584,
        560,
        180
      ]
    },
    "shapes": {
      "title": {
        "text": "가공 라인 SPC 상황판",
        "at": [
          24,
          20
        ],
        "size": 24,
        "tone": "next"
      },
      "note": {
        "text": "검사 지점마다 관리 상태와 최근 측정값 · 최근 서브그룹 관리도 · Cpk · 예시 데이터",
        "at": [
          24,
          54
        ],
        "size": 13,
        "tone": "past"
      },
      "machining": {
        "box": [
          227,
          88,
          616,
          432
        ],
        "label": "가공 구역",
        "width": 1.5
      },
      "bottom-title": {
        "text": "라인 부적합",
        "at": [
          46,
          564
        ],
        "size": 15,
        "tone": "next"
      }
    }
  }
};

export const lineSpc: SamplePack = {
  id: "line-spc",
  title: {
    "ko": "가공 라인 SPC 상황판",
    "en": "Machining line SPC"
  },
  field: {
    "ko": "제조·품질",
    "en": "Manufacturing & quality"
  },
  kind: {
    "ko": "공정 흐름도",
    "en": "Process flow"
  },
  domain: "manufacturing",
  styles: [
    "operations"
  ],
  summary: {
    "ko": "라인을 흐르는 순서대로 검사 지점마다 관리 상태·최근 측정값·관리도·Cpk를 그 공정 아래에, 라인의 부적합은 아래에. 관리 판정과 Cpk는 원천이 계산한 값입니다. 예시 데이터입니다.",
    "en": "Each inspection point’s control state, latest measurement, control chart and Cpk under its step in the line’s flow, and the line’s nonconformities below. The source judges control and computes Cpk. Example data."
  },
  connectors: [
    {
      "key": "quality",
      "name": "예시 품질 API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 측정값이 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
