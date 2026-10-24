// A plant's power distribution as a single-line diagram: the utility supply through the main breaker and the main
// transformer to the low-voltage bus, and six feeders off the bus, each with its breaker and its load. Each feeder's
// breaker state and power on its feeder; the incoming power, power factor and transformer load at the top; today's
// demand against the contract below. Grey for what is normal; a tripped breaker is the one thing in colour. No
// public source carries a plant's switchgear, so the values are example data written for the board.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/power-sld.js';

const board: Board = {
  "elements": {
    "breaker": {
      "template": "<div class=\"breaker {{state}}\" role=\"img\" aria-label=\"{{name}} 차단기 {{text}}\">\n  <svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><rect class=\"box\" x=\"2\" y=\"2\" width=\"20\" height=\"20\"/><path class=\"cross\" d=\"M6 6 L18 18 M18 6 L6 18\"/></svg>\n  <span><b>{{name}}</b> {{text}}</span>\n</div>",
      "style": ".breaker{display:flex;align-items:center;gap:8px;height:100%;font:12px var(--u-widget-font-family);color:var(--u-widget-text-secondary)}\nsvg{width:22px;height:22px;flex:none}\n.box{fill:var(--u-widget-surface);stroke:#5f6a70;stroke-width:2}\n.cross{display:none;stroke:var(--u-widget-negative);stroke-width:2.5}\nb{color:var(--u-widget-text);font-weight:600}\n.closed .box{fill:#4a555b}\n.unknown .box{stroke-dasharray:3 2}\n.tripped .box{stroke:var(--u-widget-negative)}\n.tripped .cross{display:inline}\n.tripped span{color:var(--u-widget-negative);font-weight:600}",
      "props": {
        "name": "string",
        "state": "string",
        "text": "string"
      }
    }
  },
  "data": {
    "incoming": {
      "from": "ems",
      "path": "/ems/incoming",
      "time": "updatedAt",
      "fresh": 60,
      "fields": {
        "kw": {
          "label": "수전 전력",
          "unit": "kW"
        },
        "pf": {
          "label": "역률"
        },
        "transformerLoad": {
          "unit": "%"
        },
        "peakKw": {
          "label": "오늘 최대 수요",
          "unit": "kW"
        },
        "peakOfContract": {
          "label": "계약 전력 대비 최대",
          "unit": "%"
        }
      }
    },
    "feeders": {
      "from": "ems",
      "path": "/ems/feeders",
      "list": "/value",
      "key": "id",
      "time": "updatedAt",
      "fresh": 60,
      "fields": {
        "breaker": {
          "names": {
            "closed": "closed",
            "open": "open",
            "tripped": "tripped",
            "*": "unknown"
          }
        },
        "breaker-2": {
          "names": {
            "closed": "투입",
            "open": "개방",
            "tripped": "트립",
            "*": "알 수 없음"
          },
          "at": "/breaker"
        },
        "kw": {
          "label": "전력",
          "unit": "kW"
        }
      }
    },
    "demand": {
      "from": "ems",
      "path": "/ems/demand",
      "list": "/value",
      "fresh": 60,
      "answerTime": "/updatedAt"
    }
  },
  "parts": {
    "incoming": {
      "as": "stat",
      "of": "incoming",
      "show": "kw"
    },
    "power-factor": {
      "as": "stat",
      "of": "incoming",
      "show": "pf"
    },
    "transformer-load": {
      "as": "gauge",
      "of": "incoming",
      "show": "transformerLoad",
      "subtitle": "변압기 부하율",
      "thresholds": [
        {
          "to": 80,
          "color": "#6b7680"
        },
        {
          "to": 90,
          "color": "orange"
        },
        {
          "to": 100,
          "color": "red"
        }
      ],
      "max": 100
    },
    "breaker-F1": {
      "as": "element",
      "element": "breaker",
      "of": "feeders[F1]",
      "props": {
        "name": "F1"
      },
      "bind": {
        "state": "breaker",
        "text": "breaker-2"
      }
    },
    "power-F1": {
      "as": "stat",
      "of": "feeders[F1]",
      "show": "kw"
    },
    "breaker-F2": {
      "as": "element",
      "element": "breaker",
      "of": "feeders[F2]",
      "props": {
        "name": "F2"
      },
      "bind": {
        "state": "breaker",
        "text": "breaker-2"
      }
    },
    "power-F2": {
      "as": "stat",
      "of": "feeders[F2]",
      "show": "kw"
    },
    "breaker-F3": {
      "as": "element",
      "element": "breaker",
      "of": "feeders[F3]",
      "props": {
        "name": "F3"
      },
      "bind": {
        "state": "breaker",
        "text": "breaker-2"
      }
    },
    "power-F3": {
      "as": "stat",
      "of": "feeders[F3]",
      "show": "kw"
    },
    "breaker-F4": {
      "as": "element",
      "element": "breaker",
      "of": "feeders[F4]",
      "props": {
        "name": "F4"
      },
      "bind": {
        "state": "breaker",
        "text": "breaker-2"
      }
    },
    "power-F4": {
      "as": "stat",
      "of": "feeders[F4]",
      "show": "kw"
    },
    "breaker-F5": {
      "as": "element",
      "element": "breaker",
      "of": "feeders[F5]",
      "props": {
        "name": "F5"
      },
      "bind": {
        "state": "breaker",
        "text": "breaker-2"
      }
    },
    "power-F5": {
      "as": "stat",
      "of": "feeders[F5]",
      "show": "kw"
    },
    "breaker-F6": {
      "as": "element",
      "element": "breaker",
      "of": "feeders[F6]",
      "props": {
        "name": "F6"
      },
      "bind": {
        "state": "breaker",
        "text": "breaker-2"
      }
    },
    "power-F6": {
      "as": "stat",
      "of": "feeders[F6]",
      "show": "kw"
    },
    "demand": {
      "as": "chart.line",
      "of": "demand",
      "title": "수요 전력 (kW, 오늘)",
      "x": "t",
      "y": "kw",
      "xFormat": "time",
      "valueAxisZero": false,
      "series": [
        {
          "label": "수요 전력",
          "symbol": "none",
          "color": "#4a555b"
        }
      ],
      "referenceLines": [
        {
          "axis": "y",
          "value": 1500,
          "label": "계약 전력 1,500 kW",
          "style": "dashed",
          "color": "#5b666c"
        }
      ]
    },
    "peak": {
      "as": "stat",
      "of": "incoming",
      "show": "peakKw"
    },
    "contract": {
      "as": "stat",
      "of": "incoming",
      "show": "peakOfContract"
    }
  },
  "layout": {
    "kind": "canvas",
    "size": [
      1280,
      780
    ],
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221280%22%20height%3D%22780%22%20viewBox%3D%220%200%201280%20780%22%3E%0A%3Crect%20width%3D%221280%22%20height%3D%22780%22%20fill%3D%22%23e6e9eb%22%2F%3E%0A%3Ctext%20x%3D%22640%22%20y%3D%2288%22%20font-size%3D%2213%22%20fill%3D%22%234a555b%22%20text-anchor%3D%22middle%22%20font-family%3D%22sans-serif%22%3E%ED%95%9C%EC%A0%84%20%EC%88%98%EC%A0%84%2022.9%20kV%3C%2Ftext%3E%0A%3Cpath%20d%3D%22M%20640%2096%20V%20128%22%20fill%3D%22none%22%20stroke%3D%22%235f6a70%22%20stroke-width%3D%223%22%2F%3E%0A%3Crect%20x%3D%22629%22%20y%3D%22129%22%20width%3D%2222%22%20height%3D%2222%22%20fill%3D%22%23f1f3f4%22%20stroke%3D%22%235f6a70%22%20stroke-width%3D%222%22%2F%3E%3Ctext%20x%3D%22658%22%20y%3D%22145%22%20font-size%3D%2211%22%20fill%3D%22%234a555b%22%20text-anchor%3D%22start%22%20font-family%3D%22sans-serif%22%3E52M%3C%2Ftext%3E%0A%3Cpath%20d%3D%22M%20640%20152%20V%20186%22%20fill%3D%22none%22%20stroke%3D%22%235f6a70%22%20stroke-width%3D%223%22%2F%3E%0A%3Ccircle%20cx%3D%22640%22%20cy%3D%22206%22%20r%3D%2222%22%20fill%3D%22none%22%20stroke%3D%22%235f6a70%22%20stroke-width%3D%222%22%2F%3E%0A%3Ccircle%20cx%3D%22640%22%20cy%3D%22238%22%20r%3D%2222%22%20fill%3D%22none%22%20stroke%3D%22%235f6a70%22%20stroke-width%3D%222%22%2F%3E%0A%3Ctext%20x%3D%22606%22%20y%3D%22226%22%20font-size%3D%2212%22%20fill%3D%22%234a555b%22%20text-anchor%3D%22end%22%20font-family%3D%22sans-serif%22%3ETR-1%20%201%2C600%20kVA%3C%2Ftext%3E%0A%3Ctext%20x%3D%22606%22%20y%3D%22242%22%20font-size%3D%2211%22%20fill%3D%22%234a555b%22%20text-anchor%3D%22end%22%20font-family%3D%22sans-serif%22%3E22.9%20kV%20%2F%20380%20V%3C%2Ftext%3E%0A%3Cpath%20d%3D%22M%20640%20260%20V%20300%22%20fill%3D%22none%22%20stroke%3D%22%235f6a70%22%20stroke-width%3D%223%22%2F%3E%0A%3Crect%20x%3D%22629%22%20y%3D%22301%22%20width%3D%2222%22%20height%3D%2222%22%20fill%3D%22%23f1f3f4%22%20stroke%3D%22%235f6a70%22%20stroke-width%3D%222%22%2F%3E%3Ctext%20x%3D%22658%22%20y%3D%22317%22%20font-size%3D%2211%22%20fill%3D%22%234a555b%22%20text-anchor%3D%22start%22%20font-family%3D%22sans-serif%22%3EACB-M%3C%2Ftext%3E%0A%3Cpath%20d%3D%22M%20640%20324%20V%20360%22%20fill%3D%22none%22%20stroke%3D%22%235f6a70%22%20stroke-width%3D%223%22%2F%3E%0A%3Cpath%20d%3D%22M%20120%20360%20H%201100%22%20fill%3D%22none%22%20stroke%3D%22%235f6a70%22%20stroke-width%3D%227%22%2F%3E%0A%3Ctext%20x%3D%221108%22%20y%3D%22365%22%20font-size%3D%2212%22%20fill%3D%22%234a555b%22%20text-anchor%3D%22start%22%20font-family%3D%22sans-serif%22%3E380%20V%20%EB%AA%A8%EC%84%A0%3C%2Ftext%3E%0A%3Cpath%20d%3D%22M%20160%20360%20V%20498%22%20fill%3D%22none%22%20stroke%3D%22%235f6a70%22%20stroke-width%3D%223%22%2F%3E%3Cpath%20d%3D%22M%20160%20576%20V%20600%22%20fill%3D%22none%22%20stroke%3D%22%235f6a70%22%20stroke-width%3D%223%22%2F%3E%0A%3Cpath%20d%3D%22M%20152%20596%20L%20160%20610%20L%20168%20596%22%20fill%3D%22none%22%20stroke%3D%22%235f6a70%22%20stroke-width%3D%222%22%2F%3E%3Ctext%20x%3D%22160%22%20y%3D%22626%22%20font-size%3D%2213%22%20fill%3D%22%234a555b%22%20text-anchor%3D%22middle%22%20font-family%3D%22sans-serif%22%3E%EC%83%9D%EC%82%B0%EB%8F%99%20A%3C%2Ftext%3E%0A%3Cpath%20d%3D%22M%20340%20360%20V%20498%22%20fill%3D%22none%22%20stroke%3D%22%235f6a70%22%20stroke-width%3D%223%22%2F%3E%3Cpath%20d%3D%22M%20340%20576%20V%20600%22%20fill%3D%22none%22%20stroke%3D%22%235f6a70%22%20stroke-width%3D%223%22%2F%3E%0A%3Cpath%20d%3D%22M%20332%20596%20L%20340%20610%20L%20348%20596%22%20fill%3D%22none%22%20stroke%3D%22%235f6a70%22%20stroke-width%3D%222%22%2F%3E%3Ctext%20x%3D%22340%22%20y%3D%22626%22%20font-size%3D%2213%22%20fill%3D%22%234a555b%22%20text-anchor%3D%22middle%22%20font-family%3D%22sans-serif%22%3E%EC%83%9D%EC%82%B0%EB%8F%99%20B%3C%2Ftext%3E%0A%3Cpath%20d%3D%22M%20520%20360%20V%20498%22%20fill%3D%22none%22%20stroke%3D%22%235f6a70%22%20stroke-width%3D%223%22%2F%3E%3Cpath%20d%3D%22M%20520%20576%20V%20600%22%20fill%3D%22none%22%20stroke%3D%22%235f6a70%22%20stroke-width%3D%223%22%2F%3E%0A%3Cpath%20d%3D%22M%20512%20596%20L%20520%20610%20L%20528%20596%22%20fill%3D%22none%22%20stroke%3D%22%235f6a70%22%20stroke-width%3D%222%22%2F%3E%3Ctext%20x%3D%22520%22%20y%3D%22626%22%20font-size%3D%2213%22%20fill%3D%22%234a555b%22%20text-anchor%3D%22middle%22%20font-family%3D%22sans-serif%22%3E%EA%B3%B5%EC%A1%B0%3C%2Ftext%3E%0A%3Cpath%20d%3D%22M%20700%20360%20V%20498%22%20fill%3D%22none%22%20stroke%3D%22%235f6a70%22%20stroke-width%3D%223%22%2F%3E%3Cpath%20d%3D%22M%20700%20576%20V%20600%22%20fill%3D%22none%22%20stroke%3D%22%235f6a70%22%20stroke-width%3D%223%22%2F%3E%0A%3Cpath%20d%3D%22M%20692%20596%20L%20700%20610%20L%20708%20596%22%20fill%3D%22none%22%20stroke%3D%22%235f6a70%22%20stroke-width%3D%222%22%2F%3E%3Ctext%20x%3D%22700%22%20y%3D%22626%22%20font-size%3D%2213%22%20fill%3D%22%234a555b%22%20text-anchor%3D%22middle%22%20font-family%3D%22sans-serif%22%3E%EC%BB%B4%ED%94%84%EB%A0%88%EC%84%9C%3C%2Ftext%3E%0A%3Cpath%20d%3D%22M%20880%20360%20V%20498%22%20fill%3D%22none%22%20stroke%3D%22%235f6a70%22%20stroke-width%3D%223%22%2F%3E%3Cpath%20d%3D%22M%20880%20576%20V%20600%22%20fill%3D%22none%22%20stroke%3D%22%235f6a70%22%20stroke-width%3D%223%22%2F%3E%0A%3Cpath%20d%3D%22M%20872%20596%20L%20880%20610%20L%20888%20596%22%20fill%3D%22none%22%20stroke%3D%22%235f6a70%22%20stroke-width%3D%222%22%2F%3E%3Ctext%20x%3D%22880%22%20y%3D%22626%22%20font-size%3D%2213%22%20fill%3D%22%234a555b%22%20text-anchor%3D%22middle%22%20font-family%3D%22sans-serif%22%3E%EC%A1%B0%EB%AA%85%C2%B7%EC%82%AC%EB%AC%B4%3C%2Ftext%3E%0A%3Cpath%20d%3D%22M%201060%20360%20V%20498%22%20fill%3D%22none%22%20stroke%3D%22%235f6a70%22%20stroke-width%3D%223%22%2F%3E%3Cpath%20d%3D%22M%201060%20576%20V%20600%22%20fill%3D%22none%22%20stroke%3D%22%235f6a70%22%20stroke-width%3D%223%22%2F%3E%0A%3Cpath%20d%3D%22M%201052%20596%20L%201060%20610%20L%201068%20596%22%20fill%3D%22none%22%20stroke%3D%22%235f6a70%22%20stroke-width%3D%222%22%2F%3E%3Ctext%20x%3D%221060%22%20y%3D%22626%22%20font-size%3D%2213%22%20fill%3D%22%234a555b%22%20text-anchor%3D%22middle%22%20font-family%3D%22sans-serif%22%3E%EB%83%89%EA%B0%81%ED%83%91%3C%2Ftext%3E%0A%3Ctext%20x%3D%221256%22%20y%3D%22770%22%20font-size%3D%2211%22%20fill%3D%22%235b666c%22%20text-anchor%3D%22end%22%20font-family%3D%22sans-serif%22%3E%EB%8B%A8%EC%84%A0%EA%B2%B0%EC%84%A0%EB%8F%84%20%E2%80%94%20%EC%98%88%EC%8B%9C%20%EC%88%98%EB%B0%B0%EC%A0%84%EB%B0%98%2C%20%EC%8B%A4%EC%A0%9C%20%EC%84%A4%EB%B9%84%EC%99%80%20%EB%8B%A4%EB%A6%84%3C%2Ftext%3E%0A%3C%2Fsvg%3E",
    "place": {
      "incoming": [
        690,
        96,
        170,
        66
      ],
      "power-factor": [
        420,
        96,
        170,
        66
      ],
      "transformer-load": [
        690,
        176,
        170,
        120
      ],
      "breaker-F1": [
        148,
        391,
        150,
        26
      ],
      "power-F1": [
        80,
        506,
        160,
        64
      ],
      "breaker-F2": [
        328,
        391,
        150,
        26
      ],
      "power-F2": [
        260,
        506,
        160,
        64
      ],
      "breaker-F3": [
        508,
        391,
        150,
        26
      ],
      "power-F3": [
        440,
        506,
        160,
        64
      ],
      "breaker-F4": [
        688,
        391,
        150,
        26
      ],
      "power-F4": [
        620,
        506,
        160,
        64
      ],
      "breaker-F5": [
        868,
        391,
        150,
        26
      ],
      "power-F5": [
        800,
        506,
        160,
        64
      ],
      "breaker-F6": [
        1048,
        391,
        150,
        26
      ],
      "power-F6": [
        980,
        506,
        160,
        64
      ],
      "demand": [
        40,
        644,
        720,
        126
      ],
      "peak": [
        800,
        646,
        170,
        66
      ],
      "contract": [
        990,
        646,
        170,
        66
      ]
    },
    "shapes": {
      "title": {
        "text": "수배전 단선결선도",
        "at": [
          24,
          20
        ],
        "size": 24,
        "tone": "next"
      },
      "note": {
        "text": "수전 → 주차단기 → 주변압기 → 저압 모선 → 피더 6 · 차단기 트립만 색 · 예시 데이터",
        "at": [
          24,
          54
        ],
        "size": 13,
        "tone": "past"
      }
    }
  }
};

export const powerSld: SamplePack = {
  id: "power-sld",
  title: {
    "ko": "수배전 단선결선도",
    "en": "Power distribution single-line diagram"
  },
  field: {
    "ko": "에너지·전력",
    "en": "Energy & power"
  },
  kind: {
    "ko": "단선결선도",
    "en": "Single-line diagram"
  },
  domain: "energy",
  styles: [
    "drawing"
  ],
  summary: {
    "ko": "수전부터 주변압기, 저압 모선, 피더 여섯까지 단선결선도 위에 차단기 상태와 피더 전력을, 위에는 수전 전력·역률·변압기 부하율을, 아래에는 오늘의 수요 전력과 계약 전력 대비 최대 수요를. 트립한 차단기만 색으로 드러납니다. 예시 데이터입니다.",
    "en": "Each feeder’s breaker state and power on the single-line diagram from the utility supply through the main transformer and the low-voltage bus to six feeders, the incoming power, power factor and transformer load above, and today’s demand and its peak against the contract below. Only the tripped breaker takes colour. Example data."
  },
  connectors: [
    {
      "key": "ems",
      "name": "예시 전력 감시 API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 수배전반이 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
