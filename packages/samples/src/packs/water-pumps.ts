// A water treatment plant's transfer system as a SCADA screen draws it: the intake well, three pumps in parallel,
// the clear well and the two reservoirs it feeds, each value on its place in the process. Grey for what is normal,
// colour only for what is not (ISA-101 high-performance HMI): a running pump is not green, a tripped one is red.
// No public source carries a plant's SCADA tags, so the values are example data written for the board.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/water-pumps.js';

const board: Board = {
  "data": {
    "levels": {
      "from": "scada",
      "path": "/scada/levels",
      "time": "updatedAt",
      "fresh": 60,
      "fields": {
        "intake": {
          "label": "착수정 수위",
          "unit": "m"
        },
        "clearWell": {
          "unit": "%"
        },
        "reservoirA": {
          "unit": "%"
        },
        "reservoirB": {
          "unit": "%"
        }
      }
    },
    "pumps": {
      "from": "scada",
      "path": "/scada/pumps",
      "list": "/value",
      "key": "id",
      "time": "updatedAt",
      "fresh": 60,
      "fields": {
        "state": {
          "label": "P-101",
          "names": {
            "running": "운전",
            "standby": "대기",
            "fault": "고장 정지",
            "maintenance": "정비",
            "*": "알 수 없음"
          },
          "state": {
            "running": "idle",
            "standby": "idle",
            "fault": "alarm",
            "maintenance": "warn",
            "*": "warn"
          }
        },
        "pressure": {
          "label": "토출 압력(bar)"
        },
        "state-2": {
          "at": "/state",
          "state": {
            "running": "idle",
            "standby": "idle",
            "fault": "alarm",
            "maintenance": "warn",
            "*": "warn"
          }
        },
        "state-3": {
          "label": "P-102",
          "names": {
            "running": "운전",
            "standby": "대기",
            "fault": "고장 정지",
            "maintenance": "정비",
            "*": "알 수 없음"
          },
          "at": "/state",
          "state": {
            "running": "idle",
            "standby": "idle",
            "fault": "alarm",
            "maintenance": "warn",
            "*": "warn"
          }
        },
        "state-4": {
          "label": "P-103",
          "names": {
            "running": "운전",
            "standby": "대기",
            "fault": "고장 정지",
            "maintenance": "정비",
            "*": "알 수 없음"
          },
          "at": "/state",
          "state": {
            "running": "idle",
            "standby": "idle",
            "fault": "alarm",
            "maintenance": "warn",
            "*": "warn"
          }
        }
      }
    },
    "quality": {
      "from": "scada",
      "path": "/scada/quality",
      "time": "updatedAt",
      "fresh": 60,
      "fields": {
        "flow": {
          "label": "송수 유량",
          "unit": "m³/h"
        },
        "turbidity": {
          "label": "탁도",
          "unit": "NTU"
        },
        "chlorine": {
          "label": "잔류염소",
          "unit": "mg/L"
        }
      }
    },
    "flow-trend": {
      "from": "scada",
      "path": "/scada/flow-trend",
      "list": "/value",
      "fresh": 60,
      "answerTime": "/updatedAt"
    }
  },
  "parts": {
    "intake-level": {
      "as": "stat",
      "of": "levels",
      "show": "intake"
    },
    "pump-P-101": {
      "as": "stat-list",
      "of": "pumps[P-101]",
      "show": [
        "state",
        "pressure"
      ],
      "state": "state-2"
    },
    "pump-P-102": {
      "as": "stat-list",
      "of": "pumps[P-102]",
      "show": [
        "state-3",
        "pressure"
      ],
      "state": "state-2"
    },
    "pump-P-103": {
      "as": "stat-list",
      "of": "pumps[P-103]",
      "show": [
        "state-4",
        "pressure"
      ],
      "state": "state-2"
    },
    "clear-well": {
      "as": "gauge",
      "of": "levels",
      "show": "clearWell",
      "subtitle": "정수지 수위",
      "thresholds": [
        {
          "to": 25,
          "color": "orange"
        },
        {
          "to": 100,
          "color": "#6b7680"
        }
      ],
      "max": 100
    },
    "transfer-flow": {
      "as": "stat",
      "of": "quality",
      "show": "flow"
    },
    "reservoirA": {
      "as": "gauge",
      "of": "levels",
      "show": "reservoirA",
      "subtitle": "1 배수지 수위",
      "thresholds": [
        {
          "to": 25,
          "color": "orange"
        },
        {
          "to": 100,
          "color": "#6b7680"
        }
      ],
      "max": 100
    },
    "reservoirB": {
      "as": "gauge",
      "of": "levels",
      "show": "reservoirB",
      "subtitle": "2 배수지 수위",
      "thresholds": [
        {
          "to": 25,
          "color": "orange"
        },
        {
          "to": 100,
          "color": "#6b7680"
        }
      ],
      "max": 100
    },
    "flow-trend": {
      "as": "chart.line",
      "of": "flow-trend",
      "title": "송수 유량 (m³/h, 6시간)",
      "x": "t",
      "y": "flow",
      "xFormat": "time",
      "valueAxisZero": false,
      "series": [
        {
          "label": "송수 유량",
          "symbol": "none",
          "color": "#4a555b"
        }
      ]
    },
    "turbidity": {
      "as": "stat",
      "of": "quality",
      "show": "turbidity"
    },
    "chlorine": {
      "as": "stat",
      "of": "quality",
      "show": "chlorine"
    }
  },
  "layout": {
    "kind": "canvas",
    "size": [
      1280,
      780
    ],
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221280%22%20height%3D%22780%22%20viewBox%3D%220%200%201280%20780%22%3E%0A%3Crect%20width%3D%221280%22%20height%3D%22780%22%20fill%3D%22%23e6e9eb%22%2F%3E%0A%3Crect%20x%3D%2250%22%20y%3D%22200%22%20width%3D%22160%22%20height%3D%22220%22%20rx%3D%226%22%20fill%3D%22%23f1f3f4%22%20stroke%3D%22%235f6a70%22%20stroke-width%3D%222%22%2F%3E%3Ctext%20x%3D%2260%22%20y%3D%22222%22%20font-size%3D%2213%22%20fill%3D%22%234a555b%22%20text-anchor%3D%22start%22%20font-family%3D%22sans-serif%22%3E%EC%B0%A9%EC%88%98%EC%A0%95%3C%2Ftext%3E%0A%3Cpath%20d%3D%22M%20210%20310%20H%20250%22%20fill%3D%22none%22%20stroke%3D%22%237d8890%22%20stroke-width%3D%225%22%20stroke-linejoin%3D%22round%22%2F%3E%0A%3Cpath%20d%3D%22M%20250%20230%20V%20490%22%20fill%3D%22none%22%20stroke%3D%22%237d8890%22%20stroke-width%3D%225%22%20stroke-linejoin%3D%22round%22%2F%3E%0A%3Ctext%20x%3D%22242%22%20y%3D%22542%22%20font-size%3D%2213%22%20fill%3D%22%234a555b%22%20text-anchor%3D%22end%22%20font-family%3D%22sans-serif%22%3E%ED%9D%A1%EC%9E%85%20%ED%97%A4%EB%8D%94%3C%2Ftext%3E%0A%3Cpath%20d%3D%22M%20250%20230%20H%20270%22%20fill%3D%22none%22%20stroke%3D%22%237d8890%22%20stroke-width%3D%225%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20330%20230%20H%20600%22%20fill%3D%22none%22%20stroke%3D%22%237d8890%22%20stroke-width%3D%225%22%20stroke-linejoin%3D%22round%22%2F%3E%0A%3Ccircle%20cx%3D%22300%22%20cy%3D%22230%22%20r%3D%2230%22%20fill%3D%22%23f1f3f4%22%20stroke%3D%22%235f6a70%22%20stroke-width%3D%222%22%2F%3E%0A%3Cpath%20d%3D%22M%20286%20212%20L%20322%20230%20L%20286%20248%20Z%22%20fill%3D%22none%22%20stroke%3D%22%235f6a70%22%20stroke-width%3D%222%22%2F%3E%0A%3Ctext%20x%3D%22300%22%20y%3D%22280%22%20font-size%3D%2213%22%20fill%3D%22%234a555b%22%20text-anchor%3D%22middle%22%20font-family%3D%22sans-serif%22%3EP-101%3C%2Ftext%3E%0A%3Cpath%20d%3D%22M%20250%20360%20H%20270%22%20fill%3D%22none%22%20stroke%3D%22%237d8890%22%20stroke-width%3D%225%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20330%20360%20H%20600%22%20fill%3D%22none%22%20stroke%3D%22%237d8890%22%20stroke-width%3D%225%22%20stroke-linejoin%3D%22round%22%2F%3E%0A%3Ccircle%20cx%3D%22300%22%20cy%3D%22360%22%20r%3D%2230%22%20fill%3D%22%23f1f3f4%22%20stroke%3D%22%235f6a70%22%20stroke-width%3D%222%22%2F%3E%0A%3Cpath%20d%3D%22M%20286%20342%20L%20322%20360%20L%20286%20378%20Z%22%20fill%3D%22none%22%20stroke%3D%22%235f6a70%22%20stroke-width%3D%222%22%2F%3E%0A%3Ctext%20x%3D%22300%22%20y%3D%22410%22%20font-size%3D%2213%22%20fill%3D%22%234a555b%22%20text-anchor%3D%22middle%22%20font-family%3D%22sans-serif%22%3EP-102%3C%2Ftext%3E%0A%3Cpath%20d%3D%22M%20250%20490%20H%20270%22%20fill%3D%22none%22%20stroke%3D%22%237d8890%22%20stroke-width%3D%225%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20330%20490%20H%20600%22%20fill%3D%22none%22%20stroke%3D%22%237d8890%22%20stroke-width%3D%225%22%20stroke-linejoin%3D%22round%22%2F%3E%0A%3Ccircle%20cx%3D%22300%22%20cy%3D%22490%22%20r%3D%2230%22%20fill%3D%22%23f1f3f4%22%20stroke%3D%22%235f6a70%22%20stroke-width%3D%222%22%2F%3E%0A%3Cpath%20d%3D%22M%20286%20472%20L%20322%20490%20L%20286%20508%20Z%22%20fill%3D%22none%22%20stroke%3D%22%235f6a70%22%20stroke-width%3D%222%22%2F%3E%0A%3Ctext%20x%3D%22300%22%20y%3D%22540%22%20font-size%3D%2213%22%20fill%3D%22%234a555b%22%20text-anchor%3D%22middle%22%20font-family%3D%22sans-serif%22%3EP-103%3C%2Ftext%3E%0A%3Cpath%20d%3D%22M%20600%20230%20V%20490%22%20fill%3D%22none%22%20stroke%3D%22%237d8890%22%20stroke-width%3D%225%22%20stroke-linejoin%3D%22round%22%2F%3E%0A%3Cpath%20d%3D%22M%20600%20350%20H%20660%22%20fill%3D%22none%22%20stroke%3D%22%237d8890%22%20stroke-width%3D%225%22%20stroke-linejoin%3D%22round%22%2F%3E%0A%3Ctext%20x%3D%22608%22%20y%3D%22542%22%20font-size%3D%2213%22%20fill%3D%22%234a555b%22%20text-anchor%3D%22start%22%20font-family%3D%22sans-serif%22%3E%ED%86%A0%EC%B6%9C%20%ED%97%A4%EB%8D%94%3C%2Ftext%3E%0A%3Crect%20x%3D%22660%22%20y%3D%22200%22%20width%3D%22170%22%20height%3D%22300%22%20rx%3D%226%22%20fill%3D%22%23f1f3f4%22%20stroke%3D%22%235f6a70%22%20stroke-width%3D%222%22%2F%3E%3Ctext%20x%3D%22670%22%20y%3D%22222%22%20font-size%3D%2213%22%20fill%3D%22%234a555b%22%20text-anchor%3D%22start%22%20font-family%3D%22sans-serif%22%3E%EC%A0%95%EC%88%98%EC%A7%80%3C%2Ftext%3E%0A%3Cpath%20d%3D%22M%20830%20350%20H%201010%22%20fill%3D%22none%22%20stroke%3D%22%237d8890%22%20stroke-width%3D%225%22%20stroke-linejoin%3D%22round%22%2F%3E%0A%3Ccircle%20cx%3D%22885%22%20cy%3D%22350%22%20r%3D%2215%22%20fill%3D%22%23f1f3f4%22%20stroke%3D%22%235f6a70%22%20stroke-width%3D%222%22%2F%3E%3Ctext%20x%3D%22885%22%20y%3D%22355%22%20font-size%3D%2213%22%20fill%3D%22%234a555b%22%20text-anchor%3D%22middle%22%20font-family%3D%22sans-serif%22%3EFT%3C%2Ftext%3E%0A%3Cpath%20d%3D%22M%201010%20235%20V%20485%22%20fill%3D%22none%22%20stroke%3D%22%237d8890%22%20stroke-width%3D%225%22%20stroke-linejoin%3D%22round%22%2F%3E%0A%3Crect%20x%3D%221040%22%20y%3D%22150%22%20width%3D%22210%22%20height%3D%22170%22%20rx%3D%226%22%20fill%3D%22%23f1f3f4%22%20stroke%3D%22%235f6a70%22%20stroke-width%3D%222%22%2F%3E%3Ctext%20x%3D%221050%22%20y%3D%22172%22%20font-size%3D%2213%22%20fill%3D%22%234a555b%22%20text-anchor%3D%22start%22%20font-family%3D%22sans-serif%22%3E1%20%EB%B0%B0%EC%88%98%EC%A7%80%3C%2Ftext%3E%3Cpath%20d%3D%22M%201010%20235%20H%201040%22%20fill%3D%22none%22%20stroke%3D%22%237d8890%22%20stroke-width%3D%225%22%20stroke-linejoin%3D%22round%22%2F%3E%0A%3Crect%20x%3D%221040%22%20y%3D%22400%22%20width%3D%22210%22%20height%3D%22170%22%20rx%3D%226%22%20fill%3D%22%23f1f3f4%22%20stroke%3D%22%235f6a70%22%20stroke-width%3D%222%22%2F%3E%3Ctext%20x%3D%221050%22%20y%3D%22422%22%20font-size%3D%2213%22%20fill%3D%22%234a555b%22%20text-anchor%3D%22start%22%20font-family%3D%22sans-serif%22%3E2%20%EB%B0%B0%EC%88%98%EC%A7%80%3C%2Ftext%3E%3Cpath%20d%3D%22M%201010%20485%20H%201040%22%20fill%3D%22none%22%20stroke%3D%22%237d8890%22%20stroke-width%3D%225%22%20stroke-linejoin%3D%22round%22%2F%3E%0A%3Crect%20x%3D%2224%22%20y%3D%22570%22%20width%3D%221010%22%20height%3D%22190%22%20rx%3D%228%22%20fill%3D%22%23f4f5f6%22%20stroke%3D%22%23cdd3d6%22%2F%3E%0A%3Ctext%20x%3D%221256%22%20y%3D%22770%22%20font-size%3D%2211%22%20fill%3D%22%235b666c%22%20text-anchor%3D%22end%22%20font-family%3D%22sans-serif%22%3E%EA%B3%84%ED%86%B5%EB%8F%84%20%E2%80%94%20%EC%98%88%EC%8B%9C%20%EC%A0%95%EC%88%98%EC%9E%A5%2C%20%EC%8B%A4%EC%A0%9C%20%EC%8B%9C%EC%84%A4%EA%B3%BC%20%EB%8B%A4%EB%A6%84%3C%2Ftext%3E%0A%3C%2Fsvg%3E",
    "place": {
      "intake-level": [
        56,
        320,
        148,
        70
      ],
      "pump-P-101": [
        346,
        152,
        230,
        64
      ],
      "pump-P-102": [
        346,
        282,
        230,
        64
      ],
      "pump-P-103": [
        346,
        412,
        230,
        64
      ],
      "clear-well": [
        670,
        290,
        150,
        120
      ],
      "transfer-flow": [
        835,
        380,
        170,
        70
      ],
      "reservoirA": [
        1070,
        190,
        150,
        120
      ],
      "reservoirB": [
        1070,
        440,
        150,
        120
      ],
      "flow-trend": [
        40,
        590,
        600,
        160
      ],
      "turbidity": [
        680,
        600,
        170,
        70
      ],
      "chlorine": [
        860,
        600,
        170,
        70
      ]
    },
    "shapes": {
      "title": {
        "text": "정수장 송수 계통",
        "at": [
          24,
          20
        ],
        "size": 24,
        "tone": "next"
      },
      "note": {
        "text": "착수정 → 송수 펌프 → 정수지 → 배수지 · 정상은 회색, 이상만 색 · 예시 데이터",
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

export const waterPumps: SamplePack = {
  id: "water-pumps",
  title: {
    "ko": "정수장 송수 계통",
    "en": "Water treatment transfer system"
  },
  field: {
    "ko": "상하수도·유틸리티",
    "en": "Water & utilities"
  },
  kind: {
    "ko": "계통도",
    "en": "Process diagram"
  },
  domain: "energy",
  styles: [
    "operations"
  ],
  summary: {
    "ko": "착수정부터 송수 펌프 셋, 정수지, 두 배수지까지 계통도 위에 수위·펌프 상태·토출 압력·송수 유량을 그 자리에. 정상은 회색으로 두고 이상만 색으로 드러내는 SCADA 화면 원칙(ISA-101)을 따랐습니다. 예시 데이터입니다.",
    "en": "Levels, pump states, discharge pressures and the transfer flow on their places in the process diagram, from the intake well through three transfer pumps and the clear well to two reservoirs. Normal stays grey and only the abnormal takes colour, as SCADA screens are drawn (ISA-101). Example data."
  },
  connectors: [
    {
      "key": "scada",
      "name": "예시 SCADA API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 정수장이 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
