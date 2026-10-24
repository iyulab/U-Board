// A server room drawn from above: two rows of racks facing a cold aisle, the cooling units on the walls. Each rack
// shows the temperature of the air it draws in — quiet while it is within the recommended range for IT equipment
// (ASHRAE: up to 27 °C), amber above it, red past the allowable 32 °C — and the power it uses against its budget; each
// cooling unit its state and the temperature it supplies. The room's PUE, its IT load and how it has run beside it.
// No public source carries a room's racks, so the values are example data written for the board.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/server-room.js';

const board: Board = {
  "elements": {
    "rack": {
      "template": "<div class=\"rack {{band}}\" style=\"--kw: {{kw}}; --budget: {{budget}}\" role=\"img\" aria-label=\"{{name}} 흡기 {{inlet}}°C, {{kw}} kW\">\n  <b>{{name}}</b>\n  <span class=\"inlet\">{{inlet | fixed:1}}<small>°C</small></span>\n  <span class=\"kw\">{{kw | fixed:1}} kW</span>\n  <span class=\"bar\"><span></span></span>\n</div>",
      "style": ".rack{box-sizing:border-box;height:100%;display:grid;grid-template-rows:auto 1fr auto auto;justify-items:center;gap:2px;padding:7px 6px 8px;\nborder:1px solid var(--u-widget-border);border-top:5px solid var(--c);border-radius:4px;background:var(--u-widget-surface);\nfont-family:var(--u-widget-font-family);color:var(--u-widget-text);--c:var(--u-widget-text-secondary)}\nb{font-size:12px;font-weight:600;color:var(--u-widget-text-secondary)}\n.inlet{align-self:center;font-size:21px;font-weight:600;font-variant-numeric:tabular-nums}\n.inlet small{font-size:11px;font-weight:500;color:var(--u-widget-text-secondary)}\n.kw{font-size:11px;color:var(--u-widget-text-secondary);font-variant-numeric:tabular-nums}\n.bar{width:100%;height:5px;border-radius:3px;background:var(--u-widget-border);overflow:hidden}\n.bar span{display:block;height:100%;width:min(100%, calc(var(--kw) * 100% / var(--budget)));background:var(--u-widget-text-secondary)}\n.warm{--c:var(--u-widget-warning)}\n.hot{--c:var(--u-widget-negative);border-color:var(--c);border-width:2px 2px 2px;border-top-width:5px}\n.warm .inlet,.hot .inlet{color:var(--c)}",
      "props": {
        "name": "string",
        "inlet": "number",
        "band": "string",
        "kw": "number",
        "budget": "number"
      }
    }
  },
  "data": {
    "racks": {
      "from": "dcim",
      "path": "/room/racks",
      "list": "/value",
      "key": "id",
      "time": "updatedAt",
      "fresh": 300,
      "fields": {
        "inletC": {},
        "inletC-2": {
          "names": [
            "ok",
            27,
            "warm",
            32,
            "hot"
          ],
          "at": "/inletC"
        },
        "kw": {},
        "budgetKw": {}
      }
    },
    "cooling": {
      "from": "dcim",
      "path": "/room/cooling",
      "list": "/value",
      "key": "id",
      "time": "updatedAt",
      "fresh": 300,
      "fields": {
        "state": {
          "label": "CRAC-1",
          "names": {
            "cooling": "냉각",
            "standby": "대기",
            "fault": "고장",
            "*": "알 수 없음"
          },
          "state": {
            "cooling": "ok",
            "standby": "idle",
            "fault": "alarm",
            "*": "idle"
          }
        },
        "supplyC": {
          "label": "공급(°C)"
        },
        "state-2": {
          "label": "CRAC-2",
          "names": {
            "cooling": "냉각",
            "standby": "대기",
            "fault": "고장",
            "*": "알 수 없음"
          },
          "at": "/state",
          "state": {
            "cooling": "ok",
            "standby": "idle",
            "fault": "alarm",
            "*": "idle"
          }
        },
        "state-3": {
          "label": "CRAC-3",
          "names": {
            "cooling": "냉각",
            "standby": "대기",
            "fault": "고장",
            "*": "알 수 없음"
          },
          "at": "/state",
          "state": {
            "cooling": "ok",
            "standby": "idle",
            "fault": "alarm",
            "*": "idle"
          }
        },
        "state-4": {
          "label": "CRAC-4",
          "names": {
            "cooling": "냉각",
            "standby": "대기",
            "fault": "고장",
            "*": "알 수 없음"
          },
          "at": "/state",
          "state": {
            "cooling": "ok",
            "standby": "idle",
            "fault": "alarm",
            "*": "idle"
          }
        }
      }
    },
    "summary": {
      "from": "dcim",
      "path": "/room/summary",
      "time": "updatedAt",
      "fresh": 300,
      "fields": {
        "pue": {},
        "itKw": {
          "label": "IT 부하",
          "unit": "kW"
        },
        "facilityKw": {
          "label": "전체 전력",
          "unit": "kW"
        },
        "racksOverRecommended": {
          "label": "권장 범위(27 °C)를 넘은 랙",
          "unit": "대"
        }
      }
    },
    "inlet-history": {
      "from": "dcim",
      "path": "/room/inlet-history",
      "list": "/value",
      "fresh": 300,
      "answerTime": "/updatedAt"
    }
  },
  "parts": {
    "rack-A01": {
      "as": "element",
      "element": "rack",
      "of": "racks[A01]",
      "props": {
        "name": "A01"
      },
      "bind": {
        "inlet": "inletC",
        "band": "inletC-2",
        "kw": "kw",
        "budget": "budgetKw"
      }
    },
    "rack-A02": {
      "as": "element",
      "element": "rack",
      "of": "racks[A02]",
      "props": {
        "name": "A02"
      },
      "bind": {
        "inlet": "inletC",
        "band": "inletC-2",
        "kw": "kw",
        "budget": "budgetKw"
      }
    },
    "rack-A03": {
      "as": "element",
      "element": "rack",
      "of": "racks[A03]",
      "props": {
        "name": "A03"
      },
      "bind": {
        "inlet": "inletC",
        "band": "inletC-2",
        "kw": "kw",
        "budget": "budgetKw"
      }
    },
    "rack-A04": {
      "as": "element",
      "element": "rack",
      "of": "racks[A04]",
      "props": {
        "name": "A04"
      },
      "bind": {
        "inlet": "inletC",
        "band": "inletC-2",
        "kw": "kw",
        "budget": "budgetKw"
      }
    },
    "rack-A05": {
      "as": "element",
      "element": "rack",
      "of": "racks[A05]",
      "props": {
        "name": "A05"
      },
      "bind": {
        "inlet": "inletC",
        "band": "inletC-2",
        "kw": "kw",
        "budget": "budgetKw"
      }
    },
    "rack-A06": {
      "as": "element",
      "element": "rack",
      "of": "racks[A06]",
      "props": {
        "name": "A06"
      },
      "bind": {
        "inlet": "inletC",
        "band": "inletC-2",
        "kw": "kw",
        "budget": "budgetKw"
      }
    },
    "rack-A07": {
      "as": "element",
      "element": "rack",
      "of": "racks[A07]",
      "props": {
        "name": "A07"
      },
      "bind": {
        "inlet": "inletC",
        "band": "inletC-2",
        "kw": "kw",
        "budget": "budgetKw"
      }
    },
    "rack-A08": {
      "as": "element",
      "element": "rack",
      "of": "racks[A08]",
      "props": {
        "name": "A08"
      },
      "bind": {
        "inlet": "inletC",
        "band": "inletC-2",
        "kw": "kw",
        "budget": "budgetKw"
      }
    },
    "rack-B01": {
      "as": "element",
      "element": "rack",
      "of": "racks[B01]",
      "props": {
        "name": "B01"
      },
      "bind": {
        "inlet": "inletC",
        "band": "inletC-2",
        "kw": "kw",
        "budget": "budgetKw"
      }
    },
    "rack-B02": {
      "as": "element",
      "element": "rack",
      "of": "racks[B02]",
      "props": {
        "name": "B02"
      },
      "bind": {
        "inlet": "inletC",
        "band": "inletC-2",
        "kw": "kw",
        "budget": "budgetKw"
      }
    },
    "rack-B03": {
      "as": "element",
      "element": "rack",
      "of": "racks[B03]",
      "props": {
        "name": "B03"
      },
      "bind": {
        "inlet": "inletC",
        "band": "inletC-2",
        "kw": "kw",
        "budget": "budgetKw"
      }
    },
    "rack-B04": {
      "as": "element",
      "element": "rack",
      "of": "racks[B04]",
      "props": {
        "name": "B04"
      },
      "bind": {
        "inlet": "inletC",
        "band": "inletC-2",
        "kw": "kw",
        "budget": "budgetKw"
      }
    },
    "rack-B05": {
      "as": "element",
      "element": "rack",
      "of": "racks[B05]",
      "props": {
        "name": "B05"
      },
      "bind": {
        "inlet": "inletC",
        "band": "inletC-2",
        "kw": "kw",
        "budget": "budgetKw"
      }
    },
    "rack-B06": {
      "as": "element",
      "element": "rack",
      "of": "racks[B06]",
      "props": {
        "name": "B06"
      },
      "bind": {
        "inlet": "inletC",
        "band": "inletC-2",
        "kw": "kw",
        "budget": "budgetKw"
      }
    },
    "rack-B07": {
      "as": "element",
      "element": "rack",
      "of": "racks[B07]",
      "props": {
        "name": "B07"
      },
      "bind": {
        "inlet": "inletC",
        "band": "inletC-2",
        "kw": "kw",
        "budget": "budgetKw"
      }
    },
    "rack-B08": {
      "as": "element",
      "element": "rack",
      "of": "racks[B08]",
      "props": {
        "name": "B08"
      },
      "bind": {
        "inlet": "inletC",
        "band": "inletC-2",
        "kw": "kw",
        "budget": "budgetKw"
      }
    },
    "crac-CRAC-1": {
      "as": "stat-list",
      "of": "cooling[CRAC-1]",
      "show": [
        "state",
        "supplyC"
      ]
    },
    "crac-CRAC-2": {
      "as": "stat-list",
      "of": "cooling[CRAC-2]",
      "show": [
        "state-2",
        "supplyC"
      ]
    },
    "crac-CRAC-3": {
      "as": "stat-list",
      "of": "cooling[CRAC-3]",
      "show": [
        "state-3",
        "supplyC"
      ]
    },
    "crac-CRAC-4": {
      "as": "stat-list",
      "of": "cooling[CRAC-4]",
      "show": [
        "state-4",
        "supplyC"
      ]
    },
    "pue": {
      "as": "gauge",
      "of": "summary",
      "show": "pue",
      "min": 1,
      "max": 2.5,
      "subtitle": "PUE (지금)",
      "thresholds": [
        {
          "to": 1.6,
          "color": "green"
        },
        {
          "to": 2,
          "color": "yellow"
        },
        {
          "to": 2.5,
          "color": "red"
        }
      ]
    },
    "it-load": {
      "as": "stat",
      "of": "summary",
      "show": "itKw"
    },
    "facility-load": {
      "as": "stat",
      "of": "summary",
      "show": "facilityKw"
    },
    "over-range": {
      "as": "stat",
      "of": "summary",
      "show": "racksOverRecommended"
    },
    "inlet-trend": {
      "as": "chart.line",
      "of": "inlet-history",
      "title": "가장 더운 랙 흡기 온도(°C)",
      "x": "time",
      "y": "maxInletC",
      "xFormat": "time",
      "series": [
        {
          "label": "최고 흡기"
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
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221280%22%20height%3D%22800%22%20viewBox%3D%220%200%201280%20800%22%3E%0A%3Crect%20width%3D%221280%22%20height%3D%22800%22%20fill%3D%22%23f4f6f7%22%2F%3E%0A%3Crect%20x%3D%2240%22%20y%3D%2288%22%20width%3D%22900%22%20height%3D%22672%22%20fill%3D%22%23fbfcfc%22%2F%3E%0A%3Cg%20stroke%3D%22%23e6ebed%22%20stroke-width%3D%221%22%3E%3Cpath%20d%3D%22M%2040%2088%20V%20760%22%2F%3E%3Cpath%20d%3D%22M%2084%2088%20V%20760%22%2F%3E%3Cpath%20d%3D%22M%20128%2088%20V%20760%22%2F%3E%3Cpath%20d%3D%22M%20172%2088%20V%20760%22%2F%3E%3Cpath%20d%3D%22M%20216%2088%20V%20760%22%2F%3E%3Cpath%20d%3D%22M%20260%2088%20V%20760%22%2F%3E%3Cpath%20d%3D%22M%20304%2088%20V%20760%22%2F%3E%3Cpath%20d%3D%22M%20348%2088%20V%20760%22%2F%3E%3Cpath%20d%3D%22M%20392%2088%20V%20760%22%2F%3E%3Cpath%20d%3D%22M%20436%2088%20V%20760%22%2F%3E%3Cpath%20d%3D%22M%20480%2088%20V%20760%22%2F%3E%3Cpath%20d%3D%22M%20524%2088%20V%20760%22%2F%3E%3Cpath%20d%3D%22M%20568%2088%20V%20760%22%2F%3E%3Cpath%20d%3D%22M%20612%2088%20V%20760%22%2F%3E%3Cpath%20d%3D%22M%20656%2088%20V%20760%22%2F%3E%3Cpath%20d%3D%22M%20700%2088%20V%20760%22%2F%3E%3Cpath%20d%3D%22M%20744%2088%20V%20760%22%2F%3E%3Cpath%20d%3D%22M%20788%2088%20V%20760%22%2F%3E%3Cpath%20d%3D%22M%20832%2088%20V%20760%22%2F%3E%3Cpath%20d%3D%22M%20876%2088%20V%20760%22%2F%3E%3Cpath%20d%3D%22M%20920%2088%20V%20760%22%2F%3E%3Cpath%20d%3D%22M%2040%2088%20H%20940%22%2F%3E%3Cpath%20d%3D%22M%2040%20132%20H%20940%22%2F%3E%3Cpath%20d%3D%22M%2040%20176%20H%20940%22%2F%3E%3Cpath%20d%3D%22M%2040%20220%20H%20940%22%2F%3E%3Cpath%20d%3D%22M%2040%20264%20H%20940%22%2F%3E%3Cpath%20d%3D%22M%2040%20308%20H%20940%22%2F%3E%3Cpath%20d%3D%22M%2040%20352%20H%20940%22%2F%3E%3Cpath%20d%3D%22M%2040%20396%20H%20940%22%2F%3E%3Cpath%20d%3D%22M%2040%20440%20H%20940%22%2F%3E%3Cpath%20d%3D%22M%2040%20484%20H%20940%22%2F%3E%3Cpath%20d%3D%22M%2040%20528%20H%20940%22%2F%3E%3Cpath%20d%3D%22M%2040%20572%20H%20940%22%2F%3E%3Cpath%20d%3D%22M%2040%20616%20H%20940%22%2F%3E%3Cpath%20d%3D%22M%2040%20660%20H%20940%22%2F%3E%3Cpath%20d%3D%22M%2040%20704%20H%20940%22%2F%3E%3Cpath%20d%3D%22M%2040%20748%20H%20940%22%2F%3E%3C%2Fg%3E%0A%3Crect%20x%3D%22204%22%20y%3D%22184%22%20width%3D%22720%22%20height%3D%2228%22%20fill%3D%22%23f6e7dc%22%2F%3E%0A%3Ctext%20x%3D%22190%22%20y%3D%22202%22%20font-size%3D%2212%22%20fill%3D%22%235b6b70%22%20text-anchor%3D%22end%22%20font-family%3D%22sans-serif%22%3E%EC%97%B4%EB%B3%B5%EB%8F%84%3C%2Ftext%3E%0A%3Crect%20x%3D%22204%22%20y%3D%22340%22%20width%3D%22720%22%20height%3D%22112%22%20fill%3D%22%23e2eef6%22%2F%3E%0A%3Ctext%20x%3D%22190%22%20y%3D%22400%22%20font-size%3D%2212%22%20fill%3D%22%235b6b70%22%20text-anchor%3D%22end%22%20font-family%3D%22sans-serif%22%3E%EB%83%89%EB%B3%B5%EB%8F%84%3C%2Ftext%3E%0A%3Crect%20x%3D%22204%22%20y%3D%22580%22%20width%3D%22720%22%20height%3D%2228%22%20fill%3D%22%23f6e7dc%22%2F%3E%0A%3Ctext%20x%3D%22190%22%20y%3D%22598%22%20font-size%3D%2212%22%20fill%3D%22%235b6b70%22%20text-anchor%3D%22end%22%20font-family%3D%22sans-serif%22%3E%EC%97%B4%EB%B3%B5%EB%8F%84%3C%2Ftext%3E%0A%3Crect%20x%3D%22226%22%20y%3D%22378%22%20width%3D%2260%22%20height%3D%2244%22%20fill%3D%22none%22%20stroke%3D%22%238fb3c9%22%20stroke-dasharray%3D%223%203%22%2F%3E%0A%3Crect%20x%3D%22314%22%20y%3D%22378%22%20width%3D%2260%22%20height%3D%2244%22%20fill%3D%22none%22%20stroke%3D%22%238fb3c9%22%20stroke-dasharray%3D%223%203%22%2F%3E%0A%3Crect%20x%3D%22402%22%20y%3D%22378%22%20width%3D%2260%22%20height%3D%2244%22%20fill%3D%22none%22%20stroke%3D%22%238fb3c9%22%20stroke-dasharray%3D%223%203%22%2F%3E%0A%3Crect%20x%3D%22490%22%20y%3D%22378%22%20width%3D%2260%22%20height%3D%2244%22%20fill%3D%22none%22%20stroke%3D%22%238fb3c9%22%20stroke-dasharray%3D%223%203%22%2F%3E%0A%3Crect%20x%3D%22578%22%20y%3D%22378%22%20width%3D%2260%22%20height%3D%2244%22%20fill%3D%22none%22%20stroke%3D%22%238fb3c9%22%20stroke-dasharray%3D%223%203%22%2F%3E%0A%3Crect%20x%3D%22666%22%20y%3D%22378%22%20width%3D%2260%22%20height%3D%2244%22%20fill%3D%22none%22%20stroke%3D%22%238fb3c9%22%20stroke-dasharray%3D%223%203%22%2F%3E%0A%3Crect%20x%3D%22754%22%20y%3D%22378%22%20width%3D%2260%22%20height%3D%2244%22%20fill%3D%22none%22%20stroke%3D%22%238fb3c9%22%20stroke-dasharray%3D%223%203%22%2F%3E%0A%3Crect%20x%3D%22842%22%20y%3D%22378%22%20width%3D%2260%22%20height%3D%2244%22%20fill%3D%22none%22%20stroke%3D%22%238fb3c9%22%20stroke-dasharray%3D%223%203%22%2F%3E%0A%3Crect%20x%3D%22213%22%20y%3D%22213%22%20width%3D%2286%22%20height%3D%22126%22%20rx%3D%223%22%20fill%3D%22%23dfe5e8%22%2F%3E%0A%3Crect%20x%3D%22301%22%20y%3D%22213%22%20width%3D%2286%22%20height%3D%22126%22%20rx%3D%223%22%20fill%3D%22%23dfe5e8%22%2F%3E%0A%3Crect%20x%3D%22389%22%20y%3D%22213%22%20width%3D%2286%22%20height%3D%22126%22%20rx%3D%223%22%20fill%3D%22%23dfe5e8%22%2F%3E%0A%3Crect%20x%3D%22477%22%20y%3D%22213%22%20width%3D%2286%22%20height%3D%22126%22%20rx%3D%223%22%20fill%3D%22%23dfe5e8%22%2F%3E%0A%3Crect%20x%3D%22565%22%20y%3D%22213%22%20width%3D%2286%22%20height%3D%22126%22%20rx%3D%223%22%20fill%3D%22%23dfe5e8%22%2F%3E%0A%3Crect%20x%3D%22653%22%20y%3D%22213%22%20width%3D%2286%22%20height%3D%22126%22%20rx%3D%223%22%20fill%3D%22%23dfe5e8%22%2F%3E%0A%3Crect%20x%3D%22741%22%20y%3D%22213%22%20width%3D%2286%22%20height%3D%22126%22%20rx%3D%223%22%20fill%3D%22%23dfe5e8%22%2F%3E%0A%3Crect%20x%3D%22829%22%20y%3D%22213%22%20width%3D%2286%22%20height%3D%22126%22%20rx%3D%223%22%20fill%3D%22%23dfe5e8%22%2F%3E%0A%3Crect%20x%3D%22213%22%20y%3D%22453%22%20width%3D%2286%22%20height%3D%22126%22%20rx%3D%223%22%20fill%3D%22%23dfe5e8%22%2F%3E%0A%3Crect%20x%3D%22301%22%20y%3D%22453%22%20width%3D%2286%22%20height%3D%22126%22%20rx%3D%223%22%20fill%3D%22%23dfe5e8%22%2F%3E%0A%3Crect%20x%3D%22389%22%20y%3D%22453%22%20width%3D%2286%22%20height%3D%22126%22%20rx%3D%223%22%20fill%3D%22%23dfe5e8%22%2F%3E%0A%3Crect%20x%3D%22477%22%20y%3D%22453%22%20width%3D%2286%22%20height%3D%22126%22%20rx%3D%223%22%20fill%3D%22%23dfe5e8%22%2F%3E%0A%3Crect%20x%3D%22565%22%20y%3D%22453%22%20width%3D%2286%22%20height%3D%22126%22%20rx%3D%223%22%20fill%3D%22%23dfe5e8%22%2F%3E%0A%3Crect%20x%3D%22653%22%20y%3D%22453%22%20width%3D%2286%22%20height%3D%22126%22%20rx%3D%223%22%20fill%3D%22%23dfe5e8%22%2F%3E%0A%3Crect%20x%3D%22741%22%20y%3D%22453%22%20width%3D%2286%22%20height%3D%22126%22%20rx%3D%223%22%20fill%3D%22%23dfe5e8%22%2F%3E%0A%3Crect%20x%3D%22829%22%20y%3D%22453%22%20width%3D%2286%22%20height%3D%22126%22%20rx%3D%223%22%20fill%3D%22%23dfe5e8%22%2F%3E%0A%3Crect%20x%3D%22254%22%20y%3D%22102%22%20width%3D%22232%22%20height%3D%2276%22%20rx%3D%226%22%20fill%3D%22%23e3e9ec%22%20stroke%3D%22%23c3ced4%22%2F%3E%0A%3Crect%20x%3D%22594%22%20y%3D%22102%22%20width%3D%22232%22%20height%3D%2276%22%20rx%3D%226%22%20fill%3D%22%23e3e9ec%22%20stroke%3D%22%23c3ced4%22%2F%3E%0A%3Crect%20x%3D%22594%22%20y%3D%22610%22%20width%3D%22232%22%20height%3D%2276%22%20rx%3D%226%22%20fill%3D%22%23e3e9ec%22%20stroke%3D%22%23c3ced4%22%2F%3E%0A%3Crect%20x%3D%22254%22%20y%3D%22610%22%20width%3D%22232%22%20height%3D%2276%22%20rx%3D%226%22%20fill%3D%22%23e3e9ec%22%20stroke%3D%22%23c3ced4%22%2F%3E%0A%3Crect%20x%3D%2240%22%20y%3D%2288%22%20width%3D%22900%22%20height%3D%22672%22%20fill%3D%22none%22%20stroke%3D%22%237f939e%22%20stroke-width%3D%224%22%2F%3E%0A%3Crect%20x%3D%2238%22%20y%3D%22608%22%20width%3D%226%22%20height%3D%2280%22%20fill%3D%22%23f4f6f7%22%2F%3E%0A%3Ctext%20x%3D%2254%22%20y%3D%22654%22%20font-size%3D%2211%22%20fill%3D%22%237a8a93%22%20font-family%3D%22sans-serif%22%3E%EC%B6%9C%EC%9E%85%EB%AC%B8%3C%2Ftext%3E%0A%3Crect%20x%3D%22964%22%20y%3D%2260%22%20width%3D%22300%22%20height%3D%22720%22%20rx%3D%228%22%20fill%3D%22%23ffffff%22%20stroke%3D%22%23d6dedb%22%2F%3E%0A%3Ctext%20x%3D%2240%22%20y%3D%22788%22%20font-size%3D%2211%22%20fill%3D%22%235b6b70%22%20font-family%3D%22sans-serif%22%3E%EC%95%BD%EB%8F%84%20%E2%80%94%20%EC%98%88%EC%8B%9C%20%EC%84%9C%EB%B2%84%EC%8B%A4%2C%20%EC%8B%A4%EC%A0%9C%20%EB%B0%B0%EC%B9%98%EC%99%80%20%EB%8B%A4%EB%A6%84%3C%2Ftext%3E%0A%3C%2Fsvg%3E",
    "place": {
      "rack-A01": [
        216,
        216,
        80,
        120
      ],
      "rack-A02": [
        304,
        216,
        80,
        120
      ],
      "rack-A03": [
        392,
        216,
        80,
        120
      ],
      "rack-A04": [
        480,
        216,
        80,
        120
      ],
      "rack-A05": [
        568,
        216,
        80,
        120
      ],
      "rack-A06": [
        656,
        216,
        80,
        120
      ],
      "rack-A07": [
        744,
        216,
        80,
        120
      ],
      "rack-A08": [
        832,
        216,
        80,
        120
      ],
      "rack-B01": [
        216,
        456,
        80,
        120
      ],
      "rack-B02": [
        304,
        456,
        80,
        120
      ],
      "rack-B03": [
        392,
        456,
        80,
        120
      ],
      "rack-B04": [
        480,
        456,
        80,
        120
      ],
      "rack-B05": [
        568,
        456,
        80,
        120
      ],
      "rack-B06": [
        656,
        456,
        80,
        120
      ],
      "rack-B07": [
        744,
        456,
        80,
        120
      ],
      "rack-B08": [
        832,
        456,
        80,
        120
      ],
      "crac-CRAC-1": [
        260,
        108,
        220,
        64
      ],
      "crac-CRAC-2": [
        600,
        108,
        220,
        64
      ],
      "crac-CRAC-3": [
        600,
        616,
        220,
        64
      ],
      "crac-CRAC-4": [
        260,
        616,
        220,
        64
      ],
      "pue": [
        980,
        100,
        270,
        150
      ],
      "it-load": [
        980,
        270,
        130,
        76
      ],
      "facility-load": [
        1120,
        270,
        130,
        76
      ],
      "over-range": [
        980,
        360,
        270,
        76
      ],
      "inlet-trend": [
        980,
        456,
        270,
        220
      ]
    },
    "shapes": {
      "title": {
        "text": "서버실 열 지도",
        "at": [
          24,
          22
        ],
        "size": 24,
        "tone": "next"
      },
      "note": {
        "text": "랙마다 흡기 온도와 전력 · 항온항습기 상태 · 예시 데이터",
        "at": [
          24,
          56
        ],
        "size": 13,
        "tone": "past"
      },
      "side-title": {
        "text": "서버실 전체",
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

export const serverRoom: SamplePack = {
  id: "server-room",
  title: {
    "ko": "서버실 열 지도",
    "en": "Server room thermal map"
  },
  field: {
    "ko": "데이터센터·에너지",
    "en": "Data center & energy"
  },
  kind: {
    "ko": "서버실 평면도",
    "en": "Room floor plan"
  },
  domain: "it",
  styles: [
    "operations"
  ],
  summary: {
    "ko": "두 줄의 랙마다 흡기 온도(권장 27 °C·허용 32 °C 구간 색)와 전력을 랙이 선 자리에, 벽의 항온항습기마다 상태와 공급 온도를, 옆에는 PUE와 IT 부하, 가장 더운 랙의 흐름. 예시 데이터입니다.",
    "en": "Each rack’s inlet temperature (coloured by the recommended 27 °C and allowable 32 °C bands) and power where it stands in two rows, each cooling unit’s state and supply temperature on the walls, and the room’s PUE, IT load and its hottest rack over time beside them. Example data."
  },
  connectors: [
    {
      "key": "dcim",
      "name": "예시 DCIM API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 서버실이 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
