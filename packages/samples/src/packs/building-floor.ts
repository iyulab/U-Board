// One floor of an office building drawn from above, each zone painted by its air: quiet while the temperature is within
// the comfort range (20–26 °C), blue below it, amber above, red past 28 °C — with the power the zone draws and its CO₂,
// marked past 1,000 ppm (the indoor air standard most building codes hold offices to). Beside it the building: today's
// energy per floor, the demand now against the contracted peak, the air outside. No public source carries a building's
// zones, so the values are example data written for the board.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/building-floor.js';

const board: Board = {
  "elements": {
    "zone": {
      "template": "<div class=\"zone {{band}} {{air}}\" role=\"img\" aria-label=\"{{name}} {{temp}}°C, {{kw}} kW, CO₂ {{co2}} ppm\">\n  <b>{{name}}</b>\n  <span class=\"t\">{{temp | fixed:1}}<small>°C</small></span>\n  <span class=\"m\">{{kw | fixed:1}} kW · <span class=\"co2\">CO₂ {{co2}} ppm</span></span>\n</div>",
      "style": ".zone{box-sizing:border-box;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;\npadding:6px;border:2px solid var(--c);border-radius:6px;background:color-mix(in srgb, var(--c) 14%, transparent);\nfont-family:var(--u-widget-font-family);color:var(--u-widget-text);--c:var(--u-widget-border)}\nb{font-size:13px;font-weight:600;color:var(--u-widget-text-secondary)}\n.t{font-size:24px;font-weight:600;font-variant-numeric:tabular-nums}\n.t small{font-size:12px;font-weight:500;color:var(--u-widget-text-secondary)}\n.m{font-size:12px;color:var(--u-widget-text-secondary);font-variant-numeric:tabular-nums}\n.cold{--c:var(--u-widget-primary)}\n.warm{--c:var(--u-widget-warning)}\n.hot{--c:var(--u-widget-negative)}\n.cold .t,.warm .t,.hot .t{color:var(--c)}\n.stuffy .co2{color:var(--u-widget-negative);font-weight:600}",
      "props": {
        "name": "string",
        "temp": "number",
        "band": "string",
        "kw": "number",
        "co2": "number",
        "air": "string"
      }
    }
  },
  "data": {
    "zones": {
      "from": "bems",
      "path": "/floor/3/zones",
      "list": "/value",
      "key": "id",
      "time": "updatedAt",
      "fresh": 900,
      "fields": {
        "tempC": {},
        "tempC-2": {
          "names": [
            "cold",
            20,
            "ok",
            26,
            "warm",
            28,
            "hot"
          ],
          "at": "/tempC"
        },
        "kw": {},
        "co2Ppm": {},
        "co2Ppm-2": {
          "names": [
            "fresh",
            1000,
            "stuffy"
          ],
          "at": "/co2Ppm"
        }
      }
    },
    "summary": {
      "from": "bems",
      "path": "/building/summary",
      "time": "updatedAt",
      "fresh": 900,
      "fields": {
        "demandKw": {
          "unit": "kW"
        },
        "todayKwh": {
          "label": "오늘 사용량",
          "unit": "kWh"
        },
        "outdoorC": {
          "label": "외기 온도",
          "unit": "°C"
        }
      }
    },
    "floors": {
      "from": "bems",
      "path": "/building/floors",
      "list": "/value",
      "fresh": 900,
      "answerTime": "/updatedAt"
    }
  },
  "parts": {
    "zone-open-a": {
      "as": "element",
      "element": "zone",
      "of": "zones[open-a]",
      "props": {
        "name": "오픈 오피스 A"
      },
      "bind": {
        "temp": "tempC",
        "band": "tempC-2",
        "kw": "kw",
        "co2": "co2Ppm",
        "air": "co2Ppm-2"
      }
    },
    "zone-open-b": {
      "as": "element",
      "element": "zone",
      "of": "zones[open-b]",
      "props": {
        "name": "오픈 오피스 B"
      },
      "bind": {
        "temp": "tempC",
        "band": "tempC-2",
        "kw": "kw",
        "co2": "co2Ppm",
        "air": "co2Ppm-2"
      }
    },
    "zone-meet-1": {
      "as": "element",
      "element": "zone",
      "of": "zones[meet-1]",
      "props": {
        "name": "회의실 1"
      },
      "bind": {
        "temp": "tempC",
        "band": "tempC-2",
        "kw": "kw",
        "co2": "co2Ppm",
        "air": "co2Ppm-2"
      }
    },
    "zone-it": {
      "as": "element",
      "element": "zone",
      "of": "zones[it]",
      "props": {
        "name": "전산실"
      },
      "bind": {
        "temp": "tempC",
        "band": "tempC-2",
        "kw": "kw",
        "co2": "co2Ppm",
        "air": "co2Ppm-2"
      }
    },
    "zone-meet-2": {
      "as": "element",
      "element": "zone",
      "of": "zones[meet-2]",
      "props": {
        "name": "회의실 2"
      },
      "bind": {
        "temp": "tempC",
        "band": "tempC-2",
        "kw": "kw",
        "co2": "co2Ppm",
        "air": "co2Ppm-2"
      }
    },
    "zone-lounge": {
      "as": "element",
      "element": "zone",
      "of": "zones[lounge]",
      "props": {
        "name": "라운지"
      },
      "bind": {
        "temp": "tempC",
        "band": "tempC-2",
        "kw": "kw",
        "co2": "co2Ppm",
        "air": "co2Ppm-2"
      }
    },
    "zone-open-c": {
      "as": "element",
      "element": "zone",
      "of": "zones[open-c]",
      "props": {
        "name": "오픈 오피스 C"
      },
      "bind": {
        "temp": "tempC",
        "band": "tempC-2",
        "kw": "kw",
        "co2": "co2Ppm",
        "air": "co2Ppm-2"
      }
    },
    "demand": {
      "as": "gauge",
      "of": "summary",
      "show": "demandKw",
      "min": 0,
      "max": 600,
      "subtitle": "지금 수요 전력",
      "thresholds": [
        {
          "to": 480,
          "color": "green"
        },
        {
          "to": 560,
          "color": "yellow"
        },
        {
          "to": 600,
          "color": "red"
        }
      ]
    },
    "today": {
      "as": "stat",
      "of": "summary",
      "show": "todayKwh"
    },
    "outdoor": {
      "as": "stat",
      "of": "summary",
      "show": "outdoorC"
    },
    "floors": {
      "as": "chart.bar",
      "of": "floors",
      "title": "층별 오늘 사용량 (kWh)",
      "x": "floor",
      "y": "kWh",
      "horizontal": true,
      "series": [
        {
          "label": "사용량",
          "color": "#4a555b"
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
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221280%22%20height%3D%22800%22%20viewBox%3D%220%200%201280%20800%22%3E%0A%3Crect%20width%3D%221280%22%20height%3D%22800%22%20fill%3D%22%23f4f6f7%22%2F%3E%0A%3Crect%20x%3D%2240%22%20y%3D%2288%22%20width%3D%22900%22%20height%3D%22672%22%20fill%3D%22%23fbfcfc%22%2F%3E%0A%3Crect%20x%3D%2246%22%20y%3D%2294%22%20width%3D%22432%22%20height%3D%22242%22%20fill%3D%22none%22%20stroke%3D%22%23c7d0d4%22%20stroke-width%3D%222%22%2F%3E%0A%3Crect%20x%3D%22478%22%20y%3D%2294%22%20width%3D%22456%22%20height%3D%22242%22%20fill%3D%22none%22%20stroke%3D%22%23c7d0d4%22%20stroke-width%3D%222%22%2F%3E%0A%3Crect%20x%3D%2246%22%20y%3D%22336%22%20width%3D%22212%22%20height%3D%22188%22%20fill%3D%22none%22%20stroke%3D%22%23c7d0d4%22%20stroke-width%3D%222%22%2F%3E%0A%3Crect%20x%3D%22570%22%20y%3D%22336%22%20width%3D%22172%22%20height%3D%22188%22%20fill%3D%22none%22%20stroke%3D%22%23c7d0d4%22%20stroke-width%3D%222%22%2F%3E%0A%3Crect%20x%3D%22742%22%20y%3D%22336%22%20width%3D%22192%22%20height%3D%22188%22%20fill%3D%22none%22%20stroke%3D%22%23c7d0d4%22%20stroke-width%3D%222%22%2F%3E%0A%3Crect%20x%3D%2246%22%20y%3D%22524%22%20width%3D%22312%22%20height%3D%22230%22%20fill%3D%22none%22%20stroke%3D%22%23c7d0d4%22%20stroke-width%3D%222%22%2F%3E%0A%3Crect%20x%3D%22358%22%20y%3D%22524%22%20width%3D%22576%22%20height%3D%22230%22%20fill%3D%22none%22%20stroke%3D%22%23c7d0d4%22%20stroke-width%3D%222%22%2F%3E%0A%3Crect%20x%3D%22264%22%20y%3D%22342%22%20width%3D%22300%22%20height%3D%22176%22%20rx%3D%224%22%20fill%3D%22%23e3e8eb%22%20stroke%3D%22%23b5c0c6%22%2F%3E%0A%3Crect%20x%3D%22280%22%20y%3D%22362%22%20width%3D%2256%22%20height%3D%2256%22%20fill%3D%22%23d3dade%22%20stroke%3D%22%23a9b5bc%22%2F%3E%0A%3Crect%20x%3D%22344%22%20y%3D%22362%22%20width%3D%2256%22%20height%3D%2256%22%20fill%3D%22%23d3dade%22%20stroke%3D%22%23a9b5bc%22%2F%3E%0A%3Ctext%20x%3D%22340%22%20y%3D%22438%22%20font-size%3D%2211%22%20fill%3D%22%235b6b70%22%20text-anchor%3D%22middle%22%20font-family%3D%22sans-serif%22%3E%EC%8A%B9%EA%B0%95%EA%B8%B0%3C%2Ftext%3E%0A%3Cg%20stroke%3D%22%23a9b5bc%22%3E%3Cpath%20d%3D%22M%20424%20362%20h%2052%22%2F%3E%3Cpath%20d%3D%22M%20424%20371%20h%2052%22%2F%3E%3Cpath%20d%3D%22M%20424%20380%20h%2052%22%2F%3E%3Cpath%20d%3D%22M%20424%20389%20h%2052%22%2F%3E%3Cpath%20d%3D%22M%20424%20398%20h%2052%22%2F%3E%3Cpath%20d%3D%22M%20424%20407%20h%2052%22%2F%3E%3Cpath%20d%3D%22M%20424%20416%20h%2052%22%2F%3E%3C%2Fg%3E%0A%3Ctext%20x%3D%22450%22%20y%3D%22438%22%20font-size%3D%2211%22%20fill%3D%22%235b6b70%22%20text-anchor%3D%22middle%22%20font-family%3D%22sans-serif%22%3E%EA%B3%84%EB%8B%A8%3C%2Ftext%3E%0A%3Crect%20x%3D%22488%22%20y%3D%22362%22%20width%3D%2260%22%20height%3D%22136%22%20fill%3D%22%23dde3e6%22%20stroke%3D%22%23a9b5bc%22%2F%3E%0A%3Ctext%20x%3D%22518%22%20y%3D%22434%22%20font-size%3D%2211%22%20fill%3D%22%235b6b70%22%20text-anchor%3D%22middle%22%20font-family%3D%22sans-serif%22%3E%ED%99%94%EC%9E%A5%EC%8B%A4%3C%2Ftext%3E%0A%3Ctext%20x%3D%22364%22%20y%3D%22488%22%20font-size%3D%2212%22%20fill%3D%22%235b6b70%22%20text-anchor%3D%22middle%22%20font-family%3D%22sans-serif%22%3E%EC%BD%94%EC%96%B4%3C%2Ftext%3E%0A%3Crect%20x%3D%2240%22%20y%3D%2288%22%20width%3D%22900%22%20height%3D%22672%22%20fill%3D%22none%22%20stroke%3D%22%237f939e%22%20stroke-width%3D%225%22%2F%3E%0A%3Cg%20stroke%3D%22%239cc3dc%22%20stroke-width%3D%225%22%3E%3Cpath%20d%3D%22M%2070%2088%20h%2040%22%2F%3E%3Cpath%20d%3D%22M%2070%20760%20h%2040%22%2F%3E%3Cpath%20d%3D%22M%20140%2088%20h%2040%22%2F%3E%3Cpath%20d%3D%22M%20140%20760%20h%2040%22%2F%3E%3Cpath%20d%3D%22M%20210%2088%20h%2040%22%2F%3E%3Cpath%20d%3D%22M%20210%20760%20h%2040%22%2F%3E%3Cpath%20d%3D%22M%20280%2088%20h%2040%22%2F%3E%3Cpath%20d%3D%22M%20280%20760%20h%2040%22%2F%3E%3Cpath%20d%3D%22M%20350%2088%20h%2040%22%2F%3E%3Cpath%20d%3D%22M%20350%20760%20h%2040%22%2F%3E%3Cpath%20d%3D%22M%20420%2088%20h%2040%22%2F%3E%3Cpath%20d%3D%22M%20420%20760%20h%2040%22%2F%3E%3Cpath%20d%3D%22M%20490%2088%20h%2040%22%2F%3E%3Cpath%20d%3D%22M%20490%20760%20h%2040%22%2F%3E%3Cpath%20d%3D%22M%20560%2088%20h%2040%22%2F%3E%3Cpath%20d%3D%22M%20560%20760%20h%2040%22%2F%3E%3Cpath%20d%3D%22M%20630%2088%20h%2040%22%2F%3E%3Cpath%20d%3D%22M%20630%20760%20h%2040%22%2F%3E%3Cpath%20d%3D%22M%20700%2088%20h%2040%22%2F%3E%3Cpath%20d%3D%22M%20700%20760%20h%2040%22%2F%3E%3Cpath%20d%3D%22M%20770%2088%20h%2040%22%2F%3E%3Cpath%20d%3D%22M%20770%20760%20h%2040%22%2F%3E%3Cpath%20d%3D%22M%20840%2088%20h%2040%22%2F%3E%3Cpath%20d%3D%22M%20840%20760%20h%2040%22%2F%3E%3C%2Fg%3E%0A%3Crect%20x%3D%22964%22%20y%3D%2260%22%20width%3D%22300%22%20height%3D%22720%22%20rx%3D%228%22%20fill%3D%22%23ffffff%22%20stroke%3D%22%23d6dedb%22%2F%3E%0A%3Ctext%20x%3D%2240%22%20y%3D%22788%22%20font-size%3D%2211%22%20fill%3D%22%235b6b70%22%20font-family%3D%22sans-serif%22%3E%EC%95%BD%EB%8F%84%20%E2%80%94%20%EC%98%88%EC%8B%9C%20%EA%B1%B4%EB%AC%BC%203%EC%B8%B5%2C%20%EC%8B%A4%EC%A0%9C%20%EB%B0%B0%EC%B9%98%EC%99%80%20%EB%8B%A4%EB%A6%84%20%C2%B7%20%EC%B0%BD%EC%9D%80%20%EB%82%A8%EB%B6%81%20%EB%91%90%20%EB%A9%B4%3C%2Ftext%3E%0A%3C%2Fsvg%3E",
    "place": {
      "zone-open-a": [
        52,
        100,
        420,
        230
      ],
      "zone-open-b": [
        484,
        100,
        444,
        230
      ],
      "zone-meet-1": [
        52,
        342,
        200,
        176
      ],
      "zone-it": [
        576,
        342,
        160,
        176
      ],
      "zone-meet-2": [
        748,
        342,
        180,
        176
      ],
      "zone-lounge": [
        52,
        530,
        300,
        218
      ],
      "zone-open-c": [
        364,
        530,
        564,
        218
      ],
      "demand": [
        980,
        100,
        270,
        150
      ],
      "today": [
        980,
        270,
        130,
        76
      ],
      "outdoor": [
        1120,
        270,
        130,
        76
      ],
      "floors": [
        980,
        366,
        270,
        300
      ]
    },
    "shapes": {
      "title": {
        "text": "3층 구역 에너지·환경",
        "at": [
          24,
          22
        ],
        "size": 24,
        "tone": "next"
      },
      "note": {
        "text": "구역마다 실내 온도(쾌적 20~26 °C 밖이면 색)·전력·CO₂(1,000 ppm 넘으면 표시) · 예시 데이터",
        "at": [
          24,
          56
        ],
        "size": 13,
        "tone": "past"
      },
      "side-title": {
        "text": "건물 전체 · 계약 전력 600 kW",
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

export const buildingFloor: SamplePack = {
  id: "building-floor",
  title: {
    "ko": "건물 층별 에너지·환경",
    "en": "Building floor energy and air"
  },
  field: {
    "ko": "건물·에너지",
    "en": "Buildings & energy"
  },
  kind: {
    "ko": "층 평면도",
    "en": "Floor plan"
  },
  domain: "energy",
  styles: [
    "operations"
  ],
  summary: {
    "ko": "사무동 3층의 구역마다 실내 온도(쾌적 20~26 °C 밖이면 구역째 색)와 전력·CO₂(1,000 ppm 넘으면 표시)를 구역이 선 자리에, 옆에는 지금 수요 전력과 계약 전력, 오늘 사용량, 외기 온도, 층별 사용량. 예시 데이터입니다.",
    "en": "Each zone of an office floor painted by its air where it lies — quiet within the 20–26 °C comfort range, coloured outside it — with its power and CO₂ (marked past 1,000 ppm); beside it the building’s demand against its contracted peak, today’s energy, the air outside and each floor’s use. Example data."
  },
  connectors: [
    {
      "key": "bems",
      "name": "예시 BEMS API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 건물이 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
