// A water utility's service area on a sketch map: four districts, the booster stations and reservoirs in each, as its
// maintenance system sees them. Each site shows its state and the work orders open on it — grey while it runs as it
// should, amber with a warning, red when it has stopped (ISA-101). Each district's health — the share of its sites
// running without an alarm, weighed down by overdue inspections — paints its badge: quiet while healthy, amber below 85,
// red below 70. No public source carries a utility's assets, so the values are example data written for the board.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/utility-regions.js';

const board: Board = {
  "elements": {
    "region": {
      "template": "<div class=\"r {{band}}\" role=\"img\" aria-label=\"{{name}} 건강도 {{health}}, 점검 지연 {{overdue}}건\">\n  <b>{{name}}</b>\n  <span class=\"h\">{{health | fixed:0}}<small> / 100</small></span>\n  <span class=\"o\">점검 지연 {{overdue}}건</span>\n</div>",
      "style": ".r{box-sizing:border-box;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;\nborder:2px solid var(--c);border-radius:8px;background:color-mix(in srgb, var(--c) 14%, var(--u-widget-surface));\nfont-family:var(--u-widget-font-family);color:var(--u-widget-text);--c:var(--u-widget-border)}\nb{font-size:13px;font-weight:600;color:var(--u-widget-text-secondary)}\n.h{font-size:24px;font-weight:600;font-variant-numeric:tabular-nums}\n.h small{font-size:12px;font-weight:500;color:var(--u-widget-text-secondary)}\n.o{font-size:11px;color:var(--u-widget-text-secondary)}\n.low{--c:var(--u-widget-warning)}\n.poor{--c:var(--u-widget-negative)}\n.low .h,.poor .h{color:var(--c)}",
      "props": {
        "name": "string",
        "health": "number",
        "band": "string",
        "overdue": "number"
      }
    },
    "site": {
      "template": "<div class=\"s {{state}}\" role=\"img\" aria-label=\"{{name}} {{stateText}}, 작업 {{orders}}건\">\n  <i></i><b>{{name}}</b>\n  <span>{{stateText}} · 작업 {{orders}}</span>\n</div>",
      "style": ".s{box-sizing:border-box;height:100%;display:grid;grid-template-columns:auto 1fr;align-items:center;column-gap:6px;padding:4px 8px;\nborder:1px solid var(--u-widget-border);border-radius:6px;background:var(--u-widget-surface);\nfont-family:var(--u-widget-font-family);color:var(--u-widget-text);--c:var(--u-widget-text-secondary)}\ni{width:9px;height:9px;border-radius:50%;background:var(--c);grid-row:1/3}\nb{font-size:12px;font-weight:600}\nspan{font-size:11px;color:var(--u-widget-text-secondary)}\n.warning{--c:var(--u-widget-warning)}\n.stopped{--c:var(--u-widget-negative);border-color:var(--c);border-width:2px}\n.warning span,.stopped span{color:var(--c);font-weight:600}",
      "props": {
        "name": "string",
        "state": "string",
        "stateText": "string",
        "orders": "number"
      }
    }
  },
  "data": {
    "regions": {
      "from": "cmms",
      "path": "/area/regions",
      "list": "/value",
      "key": "id",
      "time": "updatedAt",
      "fresh": 900,
      "fields": {
        "health": {},
        "health-2": {
          "names": [
            "poor",
            70,
            "low",
            85,
            "ok"
          ],
          "at": "/health"
        },
        "overdueInspections": {}
      }
    },
    "sites": {
      "from": "cmms",
      "path": "/area/sites",
      "list": "/value",
      "key": "id",
      "time": "updatedAt",
      "fresh": 900,
      "fields": {
        "state": {},
        "state-2": {
          "names": {
            "running": "정상",
            "warning": "경고",
            "stopped": "정지",
            "*": "알 수 없음"
          },
          "at": "/state"
        },
        "openOrders": {}
      }
    },
    "summary": {
      "from": "cmms",
      "path": "/area/summary",
      "time": "updatedAt",
      "fresh": 900,
      "fields": {
        "availabilityPct": {
          "unit": "%"
        },
        "openOrders": {
          "label": "열린 작업",
          "unit": "건"
        },
        "overdueInspections": {
          "label": "점검 지연",
          "unit": "건"
        }
      }
    },
    "orders-by-region": {
      "from": "cmms",
      "path": "/area/orders-by-region",
      "list": "/value",
      "fresh": 900,
      "answerTime": "/updatedAt"
    }
  },
  "parts": {
    "region-north": {
      "as": "element",
      "element": "region",
      "of": "regions[north]",
      "props": {
        "name": "북부 권역"
      },
      "bind": {
        "health": "health",
        "band": "health-2",
        "overdue": "overdueInspections"
      }
    },
    "region-east": {
      "as": "element",
      "element": "region",
      "of": "regions[east]",
      "props": {
        "name": "동부 권역"
      },
      "bind": {
        "health": "health",
        "band": "health-2",
        "overdue": "overdueInspections"
      }
    },
    "region-west": {
      "as": "element",
      "element": "region",
      "of": "regions[west]",
      "props": {
        "name": "서부 권역"
      },
      "bind": {
        "health": "health",
        "band": "health-2",
        "overdue": "overdueInspections"
      }
    },
    "region-south": {
      "as": "element",
      "element": "region",
      "of": "regions[south]",
      "props": {
        "name": "남부 권역"
      },
      "bind": {
        "health": "health",
        "band": "health-2",
        "overdue": "overdueInspections"
      }
    },
    "site-N-01": {
      "as": "element",
      "element": "site",
      "of": "sites[N-01]",
      "props": {
        "name": "북부 가압장"
      },
      "bind": {
        "state": "state",
        "stateText": "state-2",
        "orders": "openOrders"
      }
    },
    "site-N-02": {
      "as": "element",
      "element": "site",
      "of": "sites[N-02]",
      "props": {
        "name": "산정 배수지"
      },
      "bind": {
        "state": "state",
        "stateText": "state-2",
        "orders": "openOrders"
      }
    },
    "site-N-03": {
      "as": "element",
      "element": "site",
      "of": "sites[N-03]",
      "props": {
        "name": "하천 가압장"
      },
      "bind": {
        "state": "state",
        "stateText": "state-2",
        "orders": "openOrders"
      }
    },
    "site-E-01": {
      "as": "element",
      "element": "site",
      "of": "sites[E-01]",
      "props": {
        "name": "동부 가압장"
      },
      "bind": {
        "state": "state",
        "stateText": "state-2",
        "orders": "openOrders"
      }
    },
    "site-E-02": {
      "as": "element",
      "element": "site",
      "of": "sites[E-02]",
      "props": {
        "name": "고지 배수지"
      },
      "bind": {
        "state": "state",
        "stateText": "state-2",
        "orders": "openOrders"
      }
    },
    "site-E-03": {
      "as": "element",
      "element": "site",
      "of": "sites[E-03]",
      "props": {
        "name": "산업단지 가압장"
      },
      "bind": {
        "state": "state",
        "stateText": "state-2",
        "orders": "openOrders"
      }
    },
    "site-W-01": {
      "as": "element",
      "element": "site",
      "of": "sites[W-01]",
      "props": {
        "name": "서부 가압장"
      },
      "bind": {
        "state": "state",
        "stateText": "state-2",
        "orders": "openOrders"
      }
    },
    "site-W-02": {
      "as": "element",
      "element": "site",
      "of": "sites[W-02]",
      "props": {
        "name": "해안 배수지"
      },
      "bind": {
        "state": "state",
        "stateText": "state-2",
        "orders": "openOrders"
      }
    },
    "site-S-01": {
      "as": "element",
      "element": "site",
      "of": "sites[S-01]",
      "props": {
        "name": "남부 가압장"
      },
      "bind": {
        "state": "state",
        "stateText": "state-2",
        "orders": "openOrders"
      }
    },
    "site-S-02": {
      "as": "element",
      "element": "site",
      "of": "sites[S-02]",
      "props": {
        "name": "신도시 배수지"
      },
      "bind": {
        "state": "state",
        "stateText": "state-2",
        "orders": "openOrders"
      }
    },
    "site-S-03": {
      "as": "element",
      "element": "site",
      "of": "sites[S-03]",
      "props": {
        "name": "남부 2 가압장"
      },
      "bind": {
        "state": "state",
        "stateText": "state-2",
        "orders": "openOrders"
      }
    },
    "site-S-04": {
      "as": "element",
      "element": "site",
      "of": "sites[S-04]",
      "props": {
        "name": "하류 가압장"
      },
      "bind": {
        "state": "state",
        "stateText": "state-2",
        "orders": "openOrders"
      }
    },
    "availability": {
      "as": "gauge",
      "of": "summary",
      "show": "availabilityPct",
      "min": 0,
      "max": 100,
      "subtitle": "설비 가동률",
      "thresholds": [
        {
          "to": 90,
          "color": "red"
        },
        {
          "to": 97,
          "color": "yellow"
        },
        {
          "to": 100,
          "color": "green"
        }
      ]
    },
    "open-orders": {
      "as": "stat",
      "of": "summary",
      "show": "openOrders"
    },
    "overdue": {
      "as": "stat",
      "of": "summary",
      "show": "overdueInspections"
    },
    "orders-by-region": {
      "as": "chart.bar",
      "of": "orders-by-region",
      "title": "권역별 열린 작업 (건)",
      "x": "region",
      "y": [
        "corrective",
        "preventive"
      ],
      "stack": true,
      "series": [
        {
          "label": "고장 수리",
          "color": "#c2410c"
        },
        {
          "label": "예방 정비",
          "color": "#8a96a0"
        }
      ]
    }
  },
  "layout": {
    "kind": "canvas",
    "size": [
      1280,
      800
    ],
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221280%22%20height%3D%22800%22%20viewBox%3D%220%200%201280%20800%22%3E%0A%3Crect%20width%3D%221280%22%20height%3D%22800%22%20fill%3D%22%23eef2f1%22%2F%3E%0A%3Cpolygon%20points%3D%2260%2C100%20520%2C100%20560%2C300%20300%2C330%2060%2C280%22%20fill%3D%22%23f3f6f4%22%20stroke%3D%22%23b9c6bf%22%20stroke-width%3D%222%22%20stroke-linejoin%3D%22round%22%2F%3E%0A%3Cpolygon%20points%3D%22520%2C100%20920%2C100%20920%2C420%20600%2C440%20560%2C300%22%20fill%3D%22%23f3f6f4%22%20stroke%3D%22%23b9c6bf%22%20stroke-width%3D%222%22%20stroke-linejoin%3D%22round%22%2F%3E%0A%3Cpolygon%20points%3D%2260%2C280%20300%2C330%20360%2C560%2060%2C620%22%20fill%3D%22%23f3f6f4%22%20stroke%3D%22%23b9c6bf%22%20stroke-width%3D%222%22%20stroke-linejoin%3D%22round%22%2F%3E%0A%3Cpolygon%20points%3D%22300%2C330%20560%2C300%20600%2C440%20920%2C420%20920%2C760%2060%2C760%2060%2C620%20360%2C560%22%20fill%3D%22%23f3f6f4%22%20stroke%3D%22%23b9c6bf%22%20stroke-width%3D%222%22%20stroke-linejoin%3D%22round%22%2F%3E%0A%3Cpath%20d%3D%22M%2060%20470%20C%20220%20430%20300%20470%20420%20430%20S%20640%20360%20760%20440%20S%20880%20520%20920%20500%22%20fill%3D%22none%22%20stroke%3D%22%23a9c9de%22%20stroke-width%3D%2210%22%20stroke-linecap%3D%22round%22%2F%3E%0A%3Ctext%20x%3D%22560%22%20y%3D%22372%22%20font-size%3D%2212%22%20fill%3D%22%235d86a3%22%20font-family%3D%22sans-serif%22%3E%EB%B3%B8%EB%A5%98%3C%2Ftext%3E%0A%3Cpath%20d%3D%22M%20230%20252%20L%20400%20172%20L%20450%20272%20L%20680%20232%20L%20830%20272%20M%20450%20272%20L%20760%20362%20M%20180%20362%20L%20270%20522%20L%20370%20622%20L%20730%20542%20L%20810%20662%20M%20270%20522%20L%20220%20712%22%20fill%3D%22none%22%20stroke%3D%22%239aa6ae%22%20stroke-width%3D%222%22%20stroke-dasharray%3D%226%204%22%2F%3E%0A%3Crect%20x%3D%22964%22%20y%3D%2260%22%20width%3D%22300%22%20height%3D%22720%22%20rx%3D%228%22%20fill%3D%22%23ffffff%22%20stroke%3D%22%23d6dedb%22%2F%3E%0A%3Ctext%20x%3D%2240%22%20y%3D%22788%22%20font-size%3D%2211%22%20fill%3D%22%235b6b70%22%20font-family%3D%22sans-serif%22%3E%EC%95%BD%EB%8F%84%20%E2%80%94%20%EC%98%88%EC%8B%9C%20%EA%B8%89%EC%88%98%20%EA%B5%AC%EC%97%AD%2C%20%EC%8B%A4%EC%A0%9C%20%EC%A7%80%ED%98%95%C2%B7%EA%B4%80%EB%A1%9C%EC%99%80%20%EB%8B%A4%EB%A6%84%20%C2%B7%20%EC%A0%90%EC%84%A0%EC%9D%80%20%EC%86%A1%EC%88%98%EA%B4%80%3C%2Ftext%3E%0A%3C%2Fsvg%3E",
    "place": {
      "region-north": [
        90,
        120,
        150,
        86
      ],
      "region-east": [
        750,
        120,
        150,
        86
      ],
      "region-west": [
        80,
        400,
        150,
        86
      ],
      "region-south": [
        470,
        640,
        150,
        86
      ],
      "site-N-01": [
        160,
        230,
        140,
        44
      ],
      "site-N-02": [
        330,
        150,
        140,
        44
      ],
      "site-N-03": [
        380,
        250,
        140,
        44
      ],
      "site-E-01": [
        610,
        210,
        140,
        44
      ],
      "site-E-02": [
        760,
        250,
        140,
        44
      ],
      "site-E-03": [
        690,
        340,
        140,
        44
      ],
      "site-W-01": [
        110,
        340,
        140,
        44
      ],
      "site-W-02": [
        200,
        500,
        140,
        44
      ],
      "site-S-01": [
        300,
        600,
        140,
        44
      ],
      "site-S-02": [
        660,
        520,
        140,
        44
      ],
      "site-S-03": [
        740,
        640,
        140,
        44
      ],
      "site-S-04": [
        150,
        690,
        140,
        44
      ],
      "availability": [
        980,
        100,
        270,
        150
      ],
      "open-orders": [
        980,
        266,
        130,
        76
      ],
      "overdue": [
        1120,
        266,
        130,
        76
      ],
      "orders-by-region": [
        980,
        360,
        270,
        300
      ]
    },
    "shapes": {
      "title": {
        "text": "상수도 광역 설비 지도",
        "at": [
          24,
          22
        ],
        "size": 24,
        "tone": "next"
      },
      "note": {
        "text": "가압장·배수지마다 상태와 열린 작업 · 권역마다 건강도(85 미만 주황, 70 미만 빨강) · 예시 데이터",
        "at": [
          24,
          56
        ],
        "size": 13,
        "tone": "past"
      },
      "side-title": {
        "text": "사업소 전체",
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

export const utilityRegions: SamplePack = {
  id: "utility-regions",
  title: {
    "ko": "상수도 광역 설비 지도",
    "en": "Water utility service area"
  },
  field: {
    "ko": "상하수도·유틸리티",
    "en": "Water & utilities"
  },
  kind: {
    "ko": "약도(지도)",
    "en": "Sketch map"
  },
  domain: "energy",
  styles: [
    "drawing"
  ],
  summary: {
    "ko": "급수 구역 약도 위 네 권역마다 가압장·배수지의 상태와 열린 작업을 설비가 선 자리에, 권역마다 건강도(가동 중인 설비 비율에서 점검 지연을 뺀 값 — 85 미만 주황, 70 미만 빨강)를 권역 표지에, 옆에는 사업소 가동률과 작업. 예시 데이터입니다.",
    "en": "A water utility’s four districts on a sketch map: each booster station and reservoir with its state and open work orders where it stands, each district’s health (its share of sites running without an alarm, less overdue inspections — amber below 85, red below 70) on its badge, and the utility’s availability and work beside them. Example data."
  },
  connectors: [
    {
      "key": "cmms",
      "name": "예시 CMMS API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 상수도 사업소가 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
