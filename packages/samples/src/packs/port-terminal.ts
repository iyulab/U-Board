// A container terminal's control room, the way one is put on the wall: dark, the day's figures in big numbers across
// the top, the terminal itself in the middle — the ships at their berths with how far their discharge has come, the
// yard blocks filling up, the moves flowing quay to yard and in at the gate — and beside it the berth schedule, the
// cranes' rates and the alarms. A mixed board: the terminal is a canvas in a grid cell spanning the column beside it.
// No public source carries a terminal's operations, so the values are example data written for the board.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/port-terminal.js';

const board: Board = {
  "board": {
    "theme": "dark",
    "accent": "#22d3ee"
  },
  "elements": {
    "stat": {
      "template": "<div class=\"stat {{tone}}\">\n  <span class=\"label\">{{label}}</span>\n  <b class=\"value\">{{#decimal}}{{value | grouped:1}}{{/decimal}}{{^decimal}}{{value | grouped:0}}{{/decimal}}<small>{{unit}}</small></b>\n  {{#note}}<span class=\"note\">{{note}}</span>{{/note}}\n</div>",
      "style": ".stat{--c:var(--u-widget-primary);height:100%;box-sizing:border-box;display:grid;align-content:center;gap:2px;padding:10px 14px;border-top:2px solid var(--c);background:linear-gradient(180deg,color-mix(in srgb,var(--c) 14%,transparent),transparent 70%);font-family:var(--u-widget-font-family)}\n.stat.warn{--c:var(--u-widget-warning)}\n.label{font-size:12px;letter-spacing:.04em;color:var(--u-widget-text-secondary)}\n.value{font-size:34px;line-height:1.1;font-weight:700;color:var(--c);font-variant-numeric:tabular-nums;text-shadow:0 0 18px color-mix(in srgb,var(--c) 55%,transparent)}\n.value small{font-size:14px;font-weight:600;margin-left:4px;color:var(--u-widget-text-secondary);text-shadow:none}\n.note{font-size:12px;color:var(--u-widget-text-secondary)}",
      "props": {
        "label": "string",
        "value": "number",
        "unit": "string",
        "note": "string",
        "tone": "string",
        "decimal": "boolean"
      }
    },
    "berth": {
      "template": "<article class=\"berth {{state}}\" style=\"--p: {{progress}}\">\n  <header><span class=\"tag\">{{berth}}</span><span class=\"state\"><i></i>{{stateText}}</span></header>\n  <b class=\"vessel\">{{vessel}}</b>\n  <div class=\"bar\" role=\"img\" aria-label=\"{{progress}}%\"><span></span></div>\n  <footer><span>{{done | grouped:0}} / {{total | grouped:0}} moves · 크레인 {{cranes}}</span><span>{{etd}}</span></footer>\n</article>",
      "style": ".berth{--c:var(--u-widget-primary);height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr auto auto;gap:6px;padding:10px 12px;border:1px solid color-mix(in srgb,var(--c) 45%,transparent);border-radius:10px;background:color-mix(in srgb,var(--u-widget-bg) 82%,transparent);box-shadow:0 0 22px color-mix(in srgb,var(--c) 22%,transparent);font-family:var(--u-widget-font-family)}\n.waiting{--c:var(--u-widget-warning)}\n.idle{--c:var(--u-widget-text-secondary)}\nheader{display:flex;justify-content:space-between;font-size:11px;color:var(--u-widget-text-secondary)}\n.tag{font-weight:700;letter-spacing:.08em;color:var(--c)}\n.state{display:inline-flex;align-items:center;gap:5px}\n.state i{width:7px;height:7px;border-radius:50%;background:var(--c);box-shadow:0 0 8px var(--c)}\n.vessel{font-size:17px;letter-spacing:.03em;color:var(--u-widget-text);align-self:center}\n.bar{height:6px;border-radius:3px;background:color-mix(in srgb,var(--u-widget-text) 12%,transparent);overflow:hidden}\n.bar span{display:block;height:100%;width:calc(var(--p) * 1%);background:linear-gradient(90deg,color-mix(in srgb,var(--c) 55%,transparent),var(--c))}\nfooter{display:flex;justify-content:space-between;font-size:11px;color:var(--u-widget-text-secondary);font-variant-numeric:tabular-nums}",
      "props": {
        "berth": "string",
        "vessel": "string",
        "state": "string",
        "stateText": "string",
        "done": "number",
        "total": "number",
        "progress": "number",
        "etd": "string",
        "cranes": "number"
      }
    },
    "block": {
      "template": "<div class=\"block {{level}}\" style=\"--u: {{used}}\" role=\"img\" aria-label=\"{{name}} {{used}}%\">\n  <span class=\"fill\"></span>\n  <span class=\"name\">{{name}}</span>\n  <b class=\"used\">{{used}}<small>%</small></b>\n</div>",
      "style": ".block{--c:var(--u-widget-primary);position:relative;height:100%;box-sizing:border-box;border:1px solid color-mix(in srgb,var(--c) 40%,transparent);border-radius:6px;overflow:hidden;font-family:var(--u-widget-font-family);background:repeating-linear-gradient(90deg,transparent 0 14px,color-mix(in srgb,var(--u-widget-text) 6%,transparent) 14px 15px)}\n.block.high{--c:var(--u-widget-warning)}\n.fill{position:absolute;inset:auto 0 0 0;height:calc(var(--u) * 1%);background:linear-gradient(0deg,color-mix(in srgb,var(--c) 45%,transparent),color-mix(in srgb,var(--c) 12%,transparent))}\n.name{position:absolute;top:6px;left:8px;font-size:11px;font-weight:700;letter-spacing:.08em;color:var(--u-widget-text-secondary)}\n.used{position:absolute;right:8px;bottom:4px;font-size:22px;color:var(--c);font-variant-numeric:tabular-nums}\n.used small{font-size:12px}",
      "props": {
        "name": "string",
        "used": "number",
        "level": "string"
      }
    }
  },
  "data": {
    "summary": {
      "from": "tos",
      "path": "/terminal/summary",
      "time": "updatedAt",
      "fresh": 600,
      "fields": {
        "teuToday": {},
        "berthOccupancy": {},
        "gmph": {},
        "yardUtilization": {},
        "gateQueue": {},
        "gateQueue-2": {
          "names": [
            "normal",
            40,
            "warn"
          ],
          "at": "/gateQueue"
        },
        "turnTime": {}
      }
    },
    "berths": {
      "from": "tos",
      "path": "/terminal/berths",
      "list": "/value",
      "key": "id",
      "time": "updatedAt",
      "fresh": 600,
      "fields": {
        "vessel": {},
        "state": {},
        "state-2": {
          "names": {
            "working": "작업 중",
            "waiting": "접안 대기",
            "idle": "비어 있음",
            "*": "알 수 없음"
          },
          "at": "/state"
        },
        "done": {},
        "total": {},
        "progress": {},
        "etd": {},
        "cranes": {},
        "rate": {}
      }
    },
    "yard": {
      "from": "tos",
      "path": "/terminal/yard",
      "list": "/value",
      "key": "id",
      "time": "updatedAt",
      "fresh": 600,
      "fields": {
        "used": {},
        "used-2": {
          "names": [
            "normal",
            85,
            "high"
          ],
          "at": "/used"
        }
      }
    },
    "gate": {
      "from": "tos",
      "path": "/terminal/gate",
      "time": "updatedAt",
      "fresh": 600,
      "fields": {
        "inPerHour": {}
      }
    },
    "schedule": {
      "from": "tos",
      "path": "/terminal/schedule",
      "list": "/value",
      "fresh": 600,
      "answerTime": "/updatedAt"
    },
    "cranes": {
      "from": "tos",
      "path": "/terminal/cranes",
      "list": "/value",
      "fresh": 600,
      "answerTime": "/updatedAt"
    },
    "hourly": {
      "from": "tos",
      "path": "/terminal/hourly",
      "list": "/value",
      "fresh": 600,
      "answerTime": "/updatedAt"
    },
    "alarms": {
      "from": "tos",
      "path": "/terminal/alarms",
      "list": "/value",
      "fresh": 600,
      "answerTime": "/updatedAt",
      "fields": {
        "time": {
          "label": "시각"
        },
        "level": {
          "label": "등급"
        },
        "text": {
          "label": "내용"
        }
      }
    }
  },
  "parts": {
    "teu": {
      "as": "element",
      "element": "stat",
      "of": "summary",
      "props": {
        "label": "오늘 처리량",
        "unit": "TEU",
        "note": "목표 9,000"
      },
      "bind": {
        "value": "teuToday"
      }
    },
    "occupancy": {
      "as": "element",
      "element": "stat",
      "of": "summary",
      "props": {
        "label": "선석 점유율",
        "unit": "%",
        "decimal": true
      },
      "bind": {
        "value": "berthOccupancy"
      }
    },
    "gmph": {
      "as": "element",
      "element": "stat",
      "of": "summary",
      "props": {
        "label": "크레인 생산성",
        "unit": "GMPH",
        "note": "목표 30",
        "decimal": true
      },
      "bind": {
        "value": "gmph"
      }
    },
    "yard": {
      "as": "element",
      "element": "stat",
      "of": "summary",
      "props": {
        "label": "장치율",
        "unit": "%",
        "decimal": true
      },
      "bind": {
        "value": "yardUtilization"
      }
    },
    "queue": {
      "as": "element",
      "element": "stat",
      "of": "summary",
      "props": {
        "label": "게이트 대기",
        "unit": "대"
      },
      "bind": {
        "value": "gateQueue",
        "tone": "gateQueue-2"
      }
    },
    "turn": {
      "as": "element",
      "element": "stat",
      "of": "summary",
      "props": {
        "label": "평균 반출입 시간",
        "unit": "분"
      },
      "bind": {
        "value": "turnTime"
      }
    },
    "berth-B1": {
      "as": "element",
      "element": "berth",
      "of": "berths[B1]",
      "props": {
        "berth": "1번 선석"
      },
      "bind": {
        "vessel": "vessel",
        "state": "state",
        "stateText": "state-2",
        "done": "done",
        "total": "total",
        "progress": "progress",
        "etd": "etd",
        "cranes": "cranes"
      }
    },
    "berth-B2": {
      "as": "element",
      "element": "berth",
      "of": "berths[B2]",
      "props": {
        "berth": "2번 선석"
      },
      "bind": {
        "vessel": "vessel",
        "state": "state",
        "stateText": "state-2",
        "done": "done",
        "total": "total",
        "progress": "progress",
        "etd": "etd",
        "cranes": "cranes"
      }
    },
    "berth-B3": {
      "as": "element",
      "element": "berth",
      "of": "berths[B3]",
      "props": {
        "berth": "3번 선석"
      },
      "bind": {
        "vessel": "vessel",
        "state": "state",
        "stateText": "state-2",
        "done": "done",
        "total": "total",
        "progress": "progress",
        "etd": "etd",
        "cranes": "cranes"
      }
    },
    "block-A": {
      "as": "element",
      "element": "block",
      "of": "yard[A]",
      "props": {
        "name": "A 블록"
      },
      "bind": {
        "used": "used",
        "level": "used-2"
      }
    },
    "block-B": {
      "as": "element",
      "element": "block",
      "of": "yard[B]",
      "props": {
        "name": "B 블록"
      },
      "bind": {
        "used": "used",
        "level": "used-2"
      }
    },
    "block-C": {
      "as": "element",
      "element": "block",
      "of": "yard[C]",
      "props": {
        "name": "C 블록"
      },
      "bind": {
        "used": "used",
        "level": "used-2"
      }
    },
    "block-D": {
      "as": "element",
      "element": "block",
      "of": "yard[D]",
      "props": {
        "name": "D 블록"
      },
      "bind": {
        "used": "used",
        "level": "used-2"
      }
    },
    "block-E": {
      "as": "element",
      "element": "block",
      "of": "yard[E]",
      "props": {
        "name": "E 블록"
      },
      "bind": {
        "used": "used",
        "level": "used-2"
      }
    },
    "block-F": {
      "as": "element",
      "element": "block",
      "of": "yard[F]",
      "props": {
        "name": "F 블록"
      },
      "bind": {
        "used": "used",
        "level": "used-2"
      }
    },
    "gate": {
      "as": "element",
      "element": "stat",
      "of": "gate",
      "props": {
        "label": "게이트 반입 (대/시)",
        "unit": "대"
      },
      "bind": {
        "value": "inPerHour"
      }
    },
    "schedule": {
      "as": "chart.gantt",
      "of": "schedule",
      "title": "선석 계획",
      "y": "berth",
      "start": "start",
      "end": "end",
      "label": "vessel",
      "categories": [
        "1번 선석",
        "2번 선석",
        "3번 선석"
      ]
    },
    "cranes": {
      "as": "chart.bar",
      "of": "cranes",
      "title": "안벽 크레인 시간당 작업(mph)",
      "x": "crane",
      "y": "mph",
      "series": [
        {
          "label": "mph"
        }
      ],
      "referenceLines": [
        {
          "value": 30,
          "label": "목표",
          "style": "dashed"
        }
      ]
    },
    "hourly": {
      "as": "chart.bar",
      "of": "hourly",
      "title": "2시간 단위 처리 moves — 실적과 목표",
      "x": "hour",
      "y": [
        "moves",
        "target"
      ],
      "xFormat": "time",
      "series": [
        {
          "label": "실적"
        },
        {
          "label": "목표",
          "type": "line",
          "lineStyle": "dashed",
          "symbol": "none",
          "color": "#f59e0b"
        }
      ]
    },
    "alarms": {
      "as": "table",
      "of": "alarms",
      "show": [
        "time",
        "level",
        "text"
      ],
      "title": "알람"
    }
  },
  "layout": {
    "kind": "grid",
    "items": [
      [
        "teu",
        2
      ],
      [
        "occupancy",
        2
      ],
      [
        "gmph",
        2
      ],
      [
        "yard",
        2
      ],
      [
        "queue",
        2
      ],
      [
        "turn",
        2
      ],
      {
        "canvas": {
          "size": [
            1100,
            640
          ],
          "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221100%22%20height%3D%22640%22%20viewBox%3D%220%200%201100%20640%22%3E%0A%3Cdefs%3E%3ClinearGradient%20id%3D%22sea%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%220%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%2304101e%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23082038%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%0A%3Crect%20width%3D%221100%22%20height%3D%22640%22%20fill%3D%22%23070d18%22%2F%3E%0A%3Crect%20width%3D%221100%22%20height%3D%22170%22%20fill%3D%22url(%23sea)%22%2F%3E%0A%3Cpath%20d%3D%22M%200%2018%20H%201100%22%20stroke%3D%22%230f2a44%22%20stroke-width%3D%221%22%20opacity%3D%220.35%22%2F%3E%0A%3Cpath%20d%3D%22M%200%2035%20H%201100%22%20stroke%3D%22%230f2a44%22%20stroke-width%3D%221%22%20opacity%3D%220.5%22%2F%3E%0A%3Cpath%20d%3D%22M%200%2052%20H%201100%22%20stroke%3D%22%230f2a44%22%20stroke-width%3D%221%22%20opacity%3D%220.6499999999999999%22%2F%3E%0A%3Cpath%20d%3D%22M%200%2069%20H%201100%22%20stroke%3D%22%230f2a44%22%20stroke-width%3D%221%22%20opacity%3D%220.35%22%2F%3E%0A%3Cpath%20d%3D%22M%200%2086%20H%201100%22%20stroke%3D%22%230f2a44%22%20stroke-width%3D%221%22%20opacity%3D%220.5%22%2F%3E%0A%3Cpath%20d%3D%22M%200%20103%20H%201100%22%20stroke%3D%22%230f2a44%22%20stroke-width%3D%221%22%20opacity%3D%220.6499999999999999%22%2F%3E%0A%3Cpath%20d%3D%22M%200%20120%20H%201100%22%20stroke%3D%22%230f2a44%22%20stroke-width%3D%221%22%20opacity%3D%220.35%22%2F%3E%0A%3Cpath%20d%3D%22M%200%20137%20H%201100%22%20stroke%3D%22%230f2a44%22%20stroke-width%3D%221%22%20opacity%3D%220.5%22%2F%3E%0A%3Cpath%20d%3D%22M%200%20154%20H%201100%22%20stroke%3D%22%230f2a44%22%20stroke-width%3D%221%22%20opacity%3D%220.6499999999999999%22%2F%3E%0A%3Crect%20x%3D%220%22%20y%3D%22170%22%20width%3D%221100%22%20height%3D%2270%22%20fill%3D%22%230d1726%22%2F%3E%0A%3Cpath%20d%3D%22M%200%20216%20H%201100%20M%200%20230%20H%201100%22%20stroke%3D%22%2322d3ee%22%20stroke-opacity%3D%22.25%22%20stroke-width%3D%221.5%22%2F%3E%0A%3Crect%20x%3D%2240%22%20y%3D%22170%22%20width%3D%22300%22%20height%3D%2234%22%20fill%3D%22%23132238%22%2F%3E%0A%3Ctext%20x%3D%22190%22%20y%3D%22192%22%20font-size%3D%2212%22%20fill%3D%22%233f6b94%22%20text-anchor%3D%22middle%22%20font-family%3D%22sans-serif%22%20letter-spacing%3D%222%22%3E1%EB%B2%88%20%EC%84%A0%EC%84%9D%3C%2Ftext%3E%0A%3Crect%20x%3D%22400%22%20y%3D%22170%22%20width%3D%22300%22%20height%3D%2234%22%20fill%3D%22%23132238%22%2F%3E%0A%3Ctext%20x%3D%22550%22%20y%3D%22192%22%20font-size%3D%2212%22%20fill%3D%22%233f6b94%22%20text-anchor%3D%22middle%22%20font-family%3D%22sans-serif%22%20letter-spacing%3D%222%22%3E2%EB%B2%88%20%EC%84%A0%EC%84%9D%3C%2Ftext%3E%0A%3Crect%20x%3D%22760%22%20y%3D%22170%22%20width%3D%22300%22%20height%3D%2234%22%20fill%3D%22%23132238%22%2F%3E%0A%3Ctext%20x%3D%22910%22%20y%3D%22192%22%20font-size%3D%2212%22%20fill%3D%22%233f6b94%22%20text-anchor%3D%22middle%22%20font-family%3D%22sans-serif%22%20letter-spacing%3D%222%22%3E3%EB%B2%88%20%EC%84%A0%EC%84%9D%3C%2Ftext%3E%0A%3Cpath%20d%3D%22M%20640%20240%20V%20600%20H%201030%22%20fill%3D%22none%22%20stroke%3D%22%23122033%22%20stroke-width%3D%2222%22%2F%3E%0A%3Cpath%20d%3D%22M%20640%20240%20V%20600%20H%201030%22%20fill%3D%22none%22%20stroke%3D%22%231d3150%22%20stroke-width%3D%221%22%20stroke-dasharray%3D%2210%2010%22%2F%3E%0A%3Crect%20x%3D%221040%22%20y%3D%22470%22%20width%3D%2240%22%20height%3D%2214%22%20rx%3D%223%22%20fill%3D%22%231b2a3f%22%2F%3E%0A%3Crect%20x%3D%221040%22%20y%3D%22492%22%20width%3D%2240%22%20height%3D%2214%22%20rx%3D%223%22%20fill%3D%22%231b2a3f%22%2F%3E%0A%3Crect%20x%3D%221040%22%20y%3D%22514%22%20width%3D%2240%22%20height%3D%2214%22%20rx%3D%223%22%20fill%3D%22%231b2a3f%22%2F%3E%0A%3Crect%20x%3D%221040%22%20y%3D%22536%22%20width%3D%2240%22%20height%3D%2214%22%20rx%3D%223%22%20fill%3D%22%231b2a3f%22%2F%3E%0A%3Crect%20x%3D%221040%22%20y%3D%22558%22%20width%3D%2240%22%20height%3D%2214%22%20rx%3D%223%22%20fill%3D%22%231b2a3f%22%2F%3E%0A%3C%2Fsvg%3E",
          "place": {
            "berth-B1": [
              40,
              30,
              300,
              118
            ],
            "berth-B2": [
              400,
              30,
              300,
              118
            ],
            "berth-B3": [
              760,
              30,
              300,
              118
            ],
            "block-A": [
              60,
              300,
              150,
              92
            ],
            "block-B": [
              240,
              300,
              150,
              92
            ],
            "block-C": [
              420,
              300,
              150,
              92
            ],
            "block-D": [
              60,
              420,
              150,
              92
            ],
            "block-E": [
              240,
              420,
              150,
              92
            ],
            "block-F": [
              420,
              420,
              150,
              92
            ],
            "gate": [
              800,
              470,
              220,
              104
            ]
          },
          "shapes": {
            "yard-frame": {
              "box": [
                40,
                270,
                560,
                266
              ],
              "label": "CONTAINER YARD",
              "tone": "ok",
              "width": 1,
              "dash": true
            },
            "gate-label": {
              "text": "GATE",
              "at": [
                800,
                440
              ],
              "size": 12
            },
            "quay-label": {
              "text": "QUAY",
              "at": [
                1060,
                184
              ],
              "size": 12
            }
          },
          "links": {
            "flow-B1": {
              "from": "berth-B1",
              "to": "block-A",
              "label": "{{rate}} moves/h",
              "tone": "info",
              "of": "berths[B1]",
              "width": 2,
              "arrow": "end",
              "route": "orthogonal"
            },
            "flow-B2": {
              "from": "berth-B2",
              "to": "block-C",
              "label": "{{rate}} moves/h",
              "tone": "info",
              "of": "berths[B2]",
              "width": 2,
              "arrow": "end",
              "route": "orthogonal"
            },
            "flow-gate": {
              "from": "gate",
              "to": "block-F",
              "label": "{{inPerHour}} 대/h",
              "tone": "warn",
              "of": "gate",
              "width": 2,
              "dash": true,
              "arrow": "end",
              "route": "orthogonal"
            }
          }
        },
        "span": 8
      },
      {
        "grid": [
          {
            "id": "schedule",
            "span": 12,
            "height": 230
          },
          {
            "id": "cranes",
            "span": 12,
            "height": 220
          }
        ],
        "span": 4
      },
      [
        "hourly",
        8
      ],
      [
        "alarms",
        4
      ]
    ]
  }
};

export const portTerminal: SamplePack = {
  id: "port-terminal",
  title: {
    "ko": "컨테이너 터미널 관제실",
    "en": "Container terminal control room"
  },
  field: {
    "ko": "물류·항만",
    "en": "Logistics & ports"
  },
  kind: {
    "ko": "터미널 약도 + 카드(혼합, 다크)",
    "en": "Terminal plan among cards (mixed, dark)"
  },
  domain: "logistics",
  styles: [
    "control-room"
  ],
  summary: {
    "ko": "관제실 벽에 거는 다크 상황판 — 위에 오늘의 숫자들, 가운데 터미널: 선석의 배마다 하역 진척과 출항 시각, 채워지는 장치장 블록, 안벽→장치장과 게이트의 흐름. 옆에 선석 계획(간트), 크레인 생산성, 알람. 예시 데이터입니다.",
    "en": "A dark wall board for the control room — the day’s figures across the top; the terminal in the middle: each ship at its berth with its progress and departure, the yard blocks filling up, the moves flowing quay to yard and in at the gate; beside it the berth schedule (Gantt), the cranes’ rates and the alarms. Example data."
  },
  connectors: [
    {
      "key": "tos",
      "name": "예시 터미널 운영 시스템(TOS)",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 터미널이 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
