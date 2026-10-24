// A pump station drawn with elements the board defines itself — the pump, valve and tank symbols no prepared widget
// has — beside a prepared chart. Each symbol is defined once and placed for every machine; the values reach it as
// props through bindings, as a widget's do. Normal states are drawn in quiet greys and only what needs attention in
// colour (ISA-101, as the water treatment sample): running and open are filled, stopped and closed are outlined in the
// same grey — told apart by shape, not by a colour too faint to see. No public source carries a station's machines:
// example data.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/pump-station.js';

const board: Board = {
  "elements": {
    "pump": {
      "template": "<figure class=\"pump {{state}}\">\n  <svg viewBox=\"0 0 100 100\" role=\"img\" aria-label=\"{{name}} {{label}}\">\n    <path class=\"outlet\" d=\"M50 16 H92 V32 H70\"/>\n    <circle class=\"casing\" cx=\"50\" cy=\"50\" r=\"34\"/>\n    <g class=\"impeller\">\n      <ellipse cx=\"50\" cy=\"35\" rx=\"6\" ry=\"14\"/>\n      <ellipse cx=\"50\" cy=\"35\" rx=\"6\" ry=\"14\" transform=\"rotate(120 50 50)\"/>\n      <ellipse cx=\"50\" cy=\"35\" rx=\"6\" ry=\"14\" transform=\"rotate(240 50 50)\"/>\n    </g>\n    <circle class=\"hub\" cx=\"50\" cy=\"50\" r=\"5\"/>\n  </svg>\n  <figcaption><b>{{name}}</b> <span class=\"label\">{{label}}</span>{{#rpm}}<span class=\"num\">{{rpm}} rpm · {{flow}} m³/h</span>{{/rpm}}</figcaption>\n</figure>",
      "style": ".pump{margin:0;height:100%;display:grid;grid-template-rows:1fr auto;place-items:center;gap:2px;--c:var(--u-widget-text-secondary)}\nsvg{height:100%;max-height:110px;overflow:visible}\n.casing{fill:var(--u-widget-surface);stroke:var(--c);stroke-width:5}\n.outlet{fill:none;stroke:var(--c);stroke-width:5;stroke-linejoin:round}\n.impeller ellipse,.hub{fill:var(--c)}\n.run .impeller{transform-origin:50px 50px;animation:spin 1.6s linear infinite}\n.stop .casing{fill:none}\n.stop .impeller ellipse{fill:none;stroke:var(--c);stroke-width:2.5}\n.fault{--c:var(--u-widget-negative)}\n.maint{--c:var(--u-widget-warning)}\nfigcaption{font-size:12px;line-height:1.4;text-align:center;color:var(--u-widget-text-secondary)}\nfigcaption b{color:var(--u-widget-text);font-size:13px}\n.fault .label,.maint .label{color:var(--c);font-weight:600}\n.num{display:block;font-variant-numeric:tabular-nums}\n@keyframes spin{to{transform:rotate(360deg)}}\n@media (prefers-reduced-motion:reduce){.run .impeller{animation:none}}",
      "props": {
        "name": "string",
        "state": "string",
        "label": "string",
        "rpm": "number",
        "flow": "number"
      }
    },
    "tank": {
      "template": "<figure class=\"tank {{alarm}}\" style=\"--level: {{level}}; --high: {{high}}; --low: {{low}}\">\n  <div class=\"vessel\" role=\"img\" aria-label=\"{{name}} {{level}}%\">\n    <div class=\"fill\"></div>\n    <i class=\"mark high\"></i><i class=\"mark low\"></i>\n    <span class=\"value\">{{level}}%</span>\n  </div>\n  <figcaption><b>{{name}}</b> <span class=\"alarm\">{{alarmText}}</span></figcaption>\n</figure>",
      "style": ".tank{margin:0;height:100%;display:grid;grid-template-rows:1fr auto;gap:4px;--c:var(--u-widget-text-secondary)}\n.vessel{position:relative;border:2px solid var(--u-widget-border);border-top:none;border-radius:0 0 10px 10px;overflow:hidden;background:var(--u-widget-surface)}\n.fill{position:absolute;inset:auto 0 0 0;height:calc(var(--level) * 1%);background:var(--c);opacity:.45}\n.mark{position:absolute;left:0;right:0;border-top:2px dashed var(--u-widget-border)}\n.mark.high{bottom:calc(var(--high) * 1%)}\n.mark.low{bottom:calc(var(--low) * 1%)}\n.value{position:absolute;inset:0;display:grid;place-items:center;font:600 20px var(--u-widget-font-family);color:var(--u-widget-text);font-variant-numeric:tabular-nums}\n.high,.low{--c:var(--u-widget-negative)}\n.tank.high .mark.high,.tank.low .mark.low{border-top-color:var(--u-widget-negative)}\nfigcaption{font-size:12px;text-align:center;color:var(--u-widget-text-secondary)}\nfigcaption b{color:var(--u-widget-text);font-size:13px}\n.alarm{color:var(--u-widget-negative);font-weight:600}\n.tank.normal .alarm{display:none}",
      "props": {
        "name": "string",
        "level": "number",
        "high": "number",
        "low": "number",
        "alarm": "string",
        "alarmText": "string"
      }
    },
    "valve": {
      "template": "<figure class=\"valve {{state}}\" style=\"--pos: {{position}}\">\n  <svg viewBox=\"0 0 100 56\" role=\"img\" aria-label=\"{{name}} {{label}} {{position}}%\">\n    <path class=\"pipe\" d=\"M0 34 H100\"/>\n    <path class=\"body\" d=\"M24 18 L50 34 L24 50 Z M76 18 L50 34 L76 50 Z\"/>\n    <path class=\"stem\" d=\"M50 34 V10\"/>\n    <rect class=\"actuator\" x=\"38\" y=\"2\" width=\"24\" height=\"9\" rx=\"2\"/>\n  </svg>\n  <div class=\"bar\" aria-hidden=\"true\"><span></span></div>\n  <figcaption><b>{{name}}</b> {{label}} · {{position}}%</figcaption>\n</figure>",
      "style": ".valve{margin:0;height:100%;display:grid;grid-template-rows:1fr auto auto;place-items:center;gap:4px;--c:var(--u-widget-text-secondary)}\nsvg{width:100%;max-width:150px;height:100%}\n.pipe{stroke:var(--u-widget-border);stroke-width:6}\n.body{fill:var(--u-widget-surface);stroke:var(--c);stroke-width:3;stroke-linejoin:round}\n.open .body{fill:var(--c)}\n.stem{stroke:var(--c);stroke-width:3}\n.actuator{fill:var(--c)}\n.closed .body{fill:none}\n.closed .actuator{fill:none;stroke:var(--c);stroke-width:2}\n.moving{--c:var(--u-widget-warning)}\n.bar{width:80%;height:6px;border-radius:3px;background:var(--u-widget-surface);overflow:hidden}\n.bar span{display:block;height:100%;width:calc(var(--pos) * 1%);background:var(--c)}\nfigcaption{font-size:12px;color:var(--u-widget-text-secondary)}\nfigcaption b{color:var(--u-widget-text);font-size:13px}",
      "props": {
        "name": "string",
        "state": "string",
        "label": "string",
        "position": "number"
      }
    }
  },
  "data": {
    "pumps": {
      "from": "scada",
      "path": "/station/pumps",
      "list": "/value",
      "key": "id",
      "time": "updatedAt",
      "fresh": 180,
      "fields": {
        "state": {},
        "state-2": {
          "names": {
            "run": "운전",
            "stop": "정지",
            "fault": "고장",
            "maint": "점검",
            "*": "알 수 없음"
          },
          "at": "/state"
        },
        "rpm": {},
        "flow": {}
      }
    },
    "tanks": {
      "from": "scada",
      "path": "/station/tanks",
      "list": "/value",
      "key": "id",
      "time": "updatedAt",
      "fresh": 180,
      "fields": {
        "level": {},
        "level-2": {
          "names": [
            "low",
            20,
            "normal",
            90,
            "high"
          ],
          "at": "/level"
        },
        "level-3": {
          "names": [
            "저수위",
            20,
            "정상",
            90,
            "고수위"
          ],
          "at": "/level"
        },
        "level-4": {
          "names": [
            "low",
            25,
            "normal",
            85,
            "high"
          ],
          "at": "/level"
        },
        "level-5": {
          "names": [
            "저수위",
            25,
            "정상",
            85,
            "고수위"
          ],
          "at": "/level"
        }
      }
    },
    "flow": {
      "from": "scada",
      "path": "/station/flow",
      "list": "/value",
      "fresh": 5400,
      "answerTime": "/updatedAt"
    },
    "valves": {
      "from": "scada",
      "path": "/station/valves",
      "list": "/value",
      "key": "id",
      "time": "updatedAt",
      "fresh": 180,
      "fields": {
        "state": {},
        "state-2": {
          "names": {
            "open": "열림",
            "closed": "닫힘",
            "moving": "동작 중",
            "*": "알 수 없음"
          },
          "at": "/state"
        },
        "position": {}
      }
    }
  },
  "parts": {
    "p-1": {
      "as": "element",
      "element": "pump",
      "of": "pumps[P-1]",
      "props": {
        "name": "P-1"
      },
      "bind": {
        "state": "state",
        "label": "state-2",
        "rpm": "rpm",
        "flow": "flow"
      }
    },
    "p-2": {
      "as": "element",
      "element": "pump",
      "of": "pumps[P-2]",
      "props": {
        "name": "P-2"
      },
      "bind": {
        "state": "state",
        "label": "state-2",
        "rpm": "rpm",
        "flow": "flow"
      }
    },
    "p-3": {
      "as": "element",
      "element": "pump",
      "of": "pumps[P-3]",
      "props": {
        "name": "P-3"
      },
      "bind": {
        "state": "state",
        "label": "state-2",
        "rpm": "rpm",
        "flow": "flow"
      }
    },
    "p-4": {
      "as": "element",
      "element": "pump",
      "of": "pumps[P-4]",
      "props": {
        "name": "P-4"
      },
      "bind": {
        "state": "state",
        "label": "state-2",
        "rpm": "rpm",
        "flow": "flow"
      }
    },
    "t-1": {
      "as": "element",
      "element": "tank",
      "of": "tanks[T-1]",
      "props": {
        "name": "배수지",
        "high": 90,
        "low": 20
      },
      "bind": {
        "level": "level",
        "alarm": "level-2",
        "alarmText": "level-3"
      }
    },
    "t-2": {
      "as": "element",
      "element": "tank",
      "of": "tanks[T-2]",
      "props": {
        "name": "흡수정",
        "high": 85,
        "low": 25
      },
      "bind": {
        "level": "level",
        "alarm": "level-4",
        "alarmText": "level-5"
      }
    },
    "flow": {
      "as": "chart.line",
      "of": "flow",
      "title": "송수 유량 (m³/h)",
      "x": "time",
      "y": "flow",
      "xFormat": "time",
      "valueAxisZero": false,
      "series": [
        {
          "label": "유량"
        }
      ]
    },
    "v-1": {
      "as": "element",
      "element": "valve",
      "of": "valves[V-1]",
      "props": {
        "name": "V-1"
      },
      "bind": {
        "state": "state",
        "label": "state-2",
        "position": "position"
      }
    },
    "v-2": {
      "as": "element",
      "element": "valve",
      "of": "valves[V-2]",
      "props": {
        "name": "V-2"
      },
      "bind": {
        "state": "state",
        "label": "state-2",
        "position": "position"
      }
    },
    "v-3": {
      "as": "element",
      "element": "valve",
      "of": "valves[V-3]",
      "props": {
        "name": "V-3"
      },
      "bind": {
        "state": "state",
        "label": "state-2",
        "position": "position"
      }
    }
  },
  "layout": {
    "kind": "grid",
    "items": [
      [
        "p-1",
        3
      ],
      [
        "p-2",
        3
      ],
      [
        "p-3",
        3
      ],
      [
        "p-4",
        3
      ],
      [
        "t-1",
        3
      ],
      [
        "t-2",
        3
      ],
      [
        "flow",
        6
      ],
      [
        "v-1",
        4
      ],
      [
        "v-2",
        4
      ],
      [
        "v-3",
        4
      ]
    ]
  }
};

export const pumpStation: SamplePack = {
  id: "pump-station",
  title: {
    "ko": "펌프장 설비 — 보드가 그린 심볼",
    "en": "Pump station — symbols the board draws"
  },
  field: {
    "ko": "상하수도",
    "en": "Water & wastewater"
  },
  kind: {
    "ko": "없음 — 그리드 배치",
    "en": "None — grid layout"
  },
  domain: "energy",
  styles: [
    "operations"
  ],
  summary: {
    "ko": "위젯에 없는 펌프·밸브·수조 심볼을 보드가 직접 정의해(HTML/SVG와 CSS, 스크립트 없음) 설비마다 놓은 보드 — 펌프는 운전 중에 돌고, 수조는 경보 한계를 넘으면 붉게 표시됩니다. 유량 추세는 준비된 차트입니다. 예시 데이터입니다.",
    "en": "Pump, valve and tank symbols no widget has, defined by the board itself (HTML/SVG and CSS, no script) and placed for every machine — a running pump turns, a tank past an alarm limit turns red. The flow trend is a prepared chart. Example data."
  },
  connectors: [
    {
      "key": "scada",
      "name": "예시 SCADA API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 펌프장이 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
