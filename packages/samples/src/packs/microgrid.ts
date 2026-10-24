// A site's microgrid as its energy management system sees it: the solar array, the battery, the building and the car
// chargers it feeds, and the utility grid, all meeting at the switchboard. Each line carries the power flowing on it —
// its width grows with the power, a line with nothing on it is dashed, and its arrowhead points the way it flows (the
// battery charging or discharging, the grid importing or exporting), read from the same item. Beside it the day: how much of the site's use the sun
// covered, what came from and went to the grid, and the solar output against the load since morning. No public source
// carries a site's power flows, so the values are example data written for the board.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/microgrid.js';

const board: Board = {
  "statuses": {
    "idle-hatch": {
      "tone": "warn",
      "emphasis": "hatch"
    },
    "idle-hatch-idle": {
      "tone": "idle",
      "emphasis": "hatch"
    },
    "idle-hatch-info": {
      "tone": "info",
      "emphasis": "hatch"
    },
    "idle-hatch-past": {
      "tone": "past",
      "emphasis": "hatch"
    }
  },
  "elements": {
    "asset": {
      "template": "<div class=\"a {{tone}}\" role=\"img\" aria-label=\"{{name}} {{kw}} kW, {{note}}\">\n  <b>{{name}}</b>\n  <span class=\"kw\">{{kw | fixed:0}}<small> kW</small></span>\n  <span class=\"n\">{{note}}</span>\n</div>",
      "style": ".a{box-sizing:border-box;height:100%;display:flex;flex-direction:column;justify-content:center;gap:3px;padding:10px 14px;\nborder:1px solid var(--u-widget-border);border-left:5px solid var(--c);border-radius:6px;background:var(--u-widget-surface);\nfont-family:var(--u-widget-font-family);color:var(--u-widget-text);--c:var(--u-widget-text-secondary)}\nb{font-size:13px;font-weight:600;color:var(--u-widget-text-secondary)}\n.kw{font-size:24px;font-weight:600;font-variant-numeric:tabular-nums}\n.kw small{font-size:12px;font-weight:500;color:var(--u-widget-text-secondary)}\n.n{font-size:12px;color:var(--u-widget-text-secondary)}\n.sun{--c:#d89a00}\n.grid{--c:#6b7780}\n.load{--c:#4a555b}\n.bus{--c:var(--u-widget-text)}",
      "props": {
        "name": "string",
        "kw": "number",
        "note": "string",
        "tone": "string"
      }
    },
    "battery": {
      "template": "<div class=\"a\" style=\"--soc: {{soc}}\" role=\"img\" aria-label=\"{{name}} {{state}} {{kw}} kW, {{soc}}%\">\n  <b>{{name}}</b>\n  <span class=\"kw\">{{kw | fixed:0}}<small> kW</small></span>\n  <span class=\"n\">{{state}} · 충전량 {{soc | fixed:0}}%</span>\n  <span class=\"bar\"><span></span></span>\n</div>",
      "style": ".a{box-sizing:border-box;height:100%;display:flex;flex-direction:column;justify-content:center;gap:3px;padding:10px 14px;\nborder:1px solid var(--u-widget-border);border-left:5px solid var(--c);border-radius:6px;background:var(--u-widget-surface);\nfont-family:var(--u-widget-font-family);color:var(--u-widget-text);--c:var(--u-widget-text-secondary);--c:#3f7fbf}\nb{font-size:13px;font-weight:600;color:var(--u-widget-text-secondary)}\n.kw{font-size:24px;font-weight:600;font-variant-numeric:tabular-nums}\n.kw small{font-size:12px;font-weight:500;color:var(--u-widget-text-secondary)}\n.n{font-size:12px;color:var(--u-widget-text-secondary)}\n.bar{height:5px;border-radius:3px;background:var(--u-widget-border);overflow:hidden}\n.bar span{display:block;height:100%;width:calc(var(--soc) * 1%);background:var(--c)}",
      "props": {
        "name": "string",
        "kw": "number",
        "state": "string",
        "soc": "number"
      }
    }
  },
  "data": {
    "assets": {
      "from": "ems",
      "path": "/site/assets",
      "list": "/value",
      "key": "id",
      "time": "updatedAt",
      "fresh": 300,
      "fields": {
        "kw": {
          "format": "number:0"
        },
        "note": {},
        "dir": {
          "names": {
            "forward": "충전 중",
            "reverse": "방전 중",
            "*": "대기"
          }
        },
        "socPct": {},
        "dir-2": {
          "at": "/dir",
          "state": {
            "idle": "idle-hatch",
            "*": "warn"
          }
        },
        "dir-3": {
          "at": "/dir",
          "state": {
            "idle": "idle-hatch-idle",
            "*": "idle"
          }
        },
        "dir-4": {
          "at": "/dir",
          "state": {
            "idle": "idle-hatch-info",
            "*": "info"
          }
        },
        "dir-5": {
          "at": "/dir",
          "state": {
            "idle": "idle-hatch-past",
            "*": "past"
          }
        }
      }
    },
    "summary": {
      "from": "ems",
      "path": "/site/summary",
      "time": "updatedAt",
      "fresh": 300,
      "fields": {
        "selfSufficiencyPct": {
          "unit": "%"
        },
        "pvKwhToday": {
          "label": "오늘 태양광 발전",
          "unit": "kWh"
        },
        "importKwhToday": {
          "label": "계통에서",
          "unit": "kWh"
        },
        "exportKwhToday": {
          "label": "계통으로",
          "unit": "kWh"
        }
      }
    },
    "history": {
      "from": "ems",
      "path": "/site/history",
      "list": "/value",
      "fresh": 300,
      "answerTime": "/updatedAt"
    }
  },
  "parts": {
    "pv": {
      "as": "element",
      "element": "asset",
      "of": "assets[pv]",
      "props": {
        "name": "태양광 (300 kWp)",
        "tone": "sun"
      },
      "bind": {
        "kw": "kw",
        "note": "note"
      }
    },
    "grid": {
      "as": "element",
      "element": "asset",
      "of": "assets[grid]",
      "props": {
        "name": "한전 계통",
        "tone": "grid"
      },
      "bind": {
        "kw": "kw",
        "note": "note"
      }
    },
    "switchboard": {
      "as": "element",
      "element": "asset",
      "of": "assets[switchboard]",
      "props": {
        "name": "수배전반",
        "tone": "bus"
      },
      "bind": {
        "kw": "kw",
        "note": "note"
      }
    },
    "building": {
      "as": "element",
      "element": "asset",
      "of": "assets[building]",
      "props": {
        "name": "건물 부하",
        "tone": "load"
      },
      "bind": {
        "kw": "kw",
        "note": "note"
      }
    },
    "ev": {
      "as": "element",
      "element": "asset",
      "of": "assets[ev]",
      "props": {
        "name": "전기차 충전",
        "tone": "load"
      },
      "bind": {
        "kw": "kw",
        "note": "note"
      }
    },
    "ess": {
      "as": "element",
      "element": "battery",
      "of": "assets[ess]",
      "props": {
        "name": "ESS (500 kWh)"
      },
      "bind": {
        "kw": "kw",
        "state": "dir",
        "soc": "socPct"
      }
    },
    "self-sufficiency": {
      "as": "gauge",
      "of": "summary",
      "show": "selfSufficiencyPct",
      "min": 0,
      "max": 100,
      "subtitle": "오늘 자립률",
      "thresholds": [
        {
          "to": 40,
          "color": "red"
        },
        {
          "to": 70,
          "color": "yellow"
        },
        {
          "to": 100,
          "color": "green"
        }
      ]
    },
    "pv-today": {
      "as": "stat",
      "of": "summary",
      "show": "pvKwhToday"
    },
    "import-today": {
      "as": "stat",
      "of": "summary",
      "show": "importKwhToday"
    },
    "export-today": {
      "as": "stat",
      "of": "summary",
      "show": "exportKwhToday"
    },
    "history": {
      "as": "chart.line",
      "of": "history",
      "title": "태양광과 부하 (kW)",
      "x": "time",
      "y": [
        "pvKw",
        "loadKw"
      ],
      "xFormat": "time",
      "series": [
        {
          "label": "태양광",
          "color": "#d89a00"
        },
        {
          "label": "부하",
          "color": "#4a555b"
        }
      ]
    }
  },
  "layout": {
    "kind": "canvas",
    "size": [
      1250,
      748
    ],
    "place": {
      "pv": [
        400,
        120,
        200,
        100
      ],
      "grid": [
        60,
        384,
        200,
        100
      ],
      "switchboard": [
        400,
        384,
        200,
        100
      ],
      "building": [
        740,
        290,
        200,
        100
      ],
      "ev": [
        740,
        478,
        200,
        100
      ],
      "ess": [
        400,
        640,
        200,
        108
      ],
      "self-sufficiency": [
        1000,
        100,
        250,
        150
      ],
      "pv-today": [
        1000,
        266,
        250,
        70
      ],
      "import-today": [
        1000,
        350,
        120,
        70
      ],
      "export-today": [
        1130,
        350,
        120,
        70
      ],
      "history": [
        1000,
        436,
        250,
        250
      ]
    },
    "shapes": {
      "title": {
        "text": "마이크로그리드 에너지 흐름",
        "at": [
          24,
          22
        ],
        "size": 24,
        "tone": "next"
      },
      "note": {
        "text": "선마다 지금 흐르는 전력 — 굵기는 크기, 점선은 멈춤 · 화살표는 흐르는 쪽 · 예시 데이터",
        "at": [
          24,
          56
        ],
        "size": 13,
        "tone": "past"
      },
      "site": {
        "box": [
          30,
          92,
          940,
          680
        ],
        "label": "사이트",
        "width": 1.5,
        "dash": true
      },
      "side": {
        "box": [
          984,
          72,
          282,
          632
        ],
        "label": "오늘",
        "width": 1
      }
    },
    "links": {
      "flow-pv": {
        "from": "pv",
        "to": "switchboard",
        "label": "{{kw}} kW",
        "show": "dir-2",
        "weight": {
          "field": "kw",
          "bands": [
            1.5,
            5,
            2.5,
            60,
            4.5,
            150,
            7
          ]
        },
        "of": "assets[pv]",
        "width": 2.5,
        "route": "orthogonal",
        "arrow": { "field": "dir", "map": { "forward": "end", "reverse": "start", "*": "none" } }
      },
      "flow-grid": {
        "from": "grid",
        "to": "switchboard",
        "label": "{{kw}} kW",
        "show": "dir-3",
        "weight": {
          "field": "kw",
          "bands": [
            1.5,
            5,
            2.5,
            60,
            4.5,
            150,
            7
          ]
        },
        "of": "assets[grid]",
        "width": 2.5,
        "route": "orthogonal",
        "arrow": { "field": "dir", "map": { "forward": "end", "reverse": "start", "*": "none" } }
      },
      "flow-ess": {
        "from": "switchboard",
        "to": "ess",
        "label": "{{kw}} kW",
        "show": "dir-4",
        "weight": {
          "field": "kw",
          "bands": [
            1.5,
            5,
            2.5,
            60,
            4.5,
            150,
            7
          ]
        },
        "of": "assets[ess]",
        "width": 2.5,
        "route": "orthogonal",
        "arrow": { "field": "dir", "map": { "forward": "end", "reverse": "start", "*": "none" } }
      },
      "flow-building": {
        "from": "switchboard",
        "to": "building",
        "label": "{{kw}} kW",
        "show": "dir-5",
        "weight": {
          "field": "kw",
          "bands": [
            1.5,
            5,
            2.5,
            60,
            4.5,
            150,
            7
          ]
        },
        "of": "assets[building]",
        "width": 2.5,
        "route": "orthogonal",
        "arrow": { "field": "dir", "map": { "forward": "end", "reverse": "start", "*": "none" } }
      },
      "flow-ev": {
        "from": "switchboard",
        "to": "ev",
        "label": "{{kw}} kW",
        "show": "dir-5",
        "weight": {
          "field": "kw",
          "bands": [
            1.5,
            5,
            2.5,
            60,
            4.5,
            150,
            7
          ]
        },
        "of": "assets[ev]",
        "width": 2.5,
        "route": "orthogonal",
        "arrow": { "field": "dir", "map": { "forward": "end", "reverse": "start", "*": "none" } }
      }
    }
  }
};

export const microgrid: SamplePack = {
  id: "microgrid",
  title: {
    "ko": "마이크로그리드 에너지 흐름",
    "en": "Microgrid energy flow"
  },
  field: {
    "ko": "건물·에너지",
    "en": "Buildings & energy"
  },
  kind: {
    "ko": "없음 — 흐름도",
    "en": "None — flow diagram"
  },
  domain: "energy",
  styles: [
    "operations"
  ],
  summary: {
    "ko": "태양광·ESS·건물 부하·전기차 충전·한전 계통이 수배전반에서 만나는 사이트에서, 선마다 지금 흐르는 전력을 굵기·점선(멈춤)으로, 충전과 방전 · 수전과 역송은 ESS · 계통 카드에, 옆에는 오늘 자립률과 계통에서 받고 보낸 양, 아침부터의 태양광과 부하. 예시 데이터입니다.",
    "en": "Solar, a battery, the building, car chargers and the utility grid meeting at the switchboard, each line showing the power on it now — its width the amount, dashed when idle, which way it flows (charging or discharging, importing or exporting) on the battery’s and the grid’s cards; beside it the day’s self-sufficiency, what came from and went to the grid, and solar output against the load since morning. Example data."
  },
  connectors: [
    {
      "key": "ems",
      "name": "예시 EMS API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 사이트가 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
