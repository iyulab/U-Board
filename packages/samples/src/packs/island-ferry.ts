// A harbour's island ferry board drawn as a Bauhaus poster: the islands as plain geometric figures — a circle, a
// half-disc, a square, a triangle, a ring, a lozenge — in black and grey on cream, the mainland a black bar along the
// foot, the runs between the piers as straight bars. The three primaries are kept for one meaning each and paired with
// a shape, so the state reads without the colour: a blue circle sails, a yellow square is delayed, a red triangle is
// cancelled. On the right the sea's state, the next departures and the passengers boarded by the hour, in a geometric
// sans. The harbour and its islands are made up, so the values are example data written for them.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/island-ferry.js';

const board: Board = {
  "board": {
    "theme": "light",
    "accent": "#d7261e"
  },
  "statuses": {
    "cancel": {
      "tone": "alarm",
      "emphasis": "hatch"
    }
  },
  "elements": {
    "pier": {
      "template": "<i class=\"mk {{status}}\"></i>",
      "style": ".ok{--c:#1d4fa0}.delay{--c:#e8a800}.cancel{--c:#d7261e}\n.mk{display:inline-block;flex:none;width:var(--m,16px);height:var(--m,16px);background:var(--c)}\n.ok .mk,.mk.ok{border-radius:50%}\n.cancel .mk,.mk.cancel{clip-path:polygon(50% 0,100% 100%,0 100%)}\n.mk{--m:100%;display:block;outline:3px solid #efe8d8}\n.cancel{outline:0}",
      "props": {
        "status": "string"
      }
    },
    "dock": {
      "template": "<section class=\"dk {{status}}\"><header><i class=\"mk\"></i><b>{{name}}</b><span>{{word}}</span></header><p>다음 <strong>{{next}}</strong></p><small>{{ship}}</small></section>",
      "style": ".ok{--c:#1d4fa0}.delay{--c:#e8a800}.cancel{--c:#d7261e}\n.mk{display:inline-block;flex:none;width:var(--m,16px);height:var(--m,16px);background:var(--c)}\n.ok .mk,.mk.ok{border-radius:50%}\n.cancel .mk,.mk.cancel{clip-path:polygon(50% 0,100% 100%,0 100%)}\n.dk{height:100%;box-sizing:border-box;display:grid;align-content:center;gap:2px;padding:6px 10px;background:#efe8d8;border:3px solid #161513;font-family:\"Futura\", \"Jost\", \"Century Gothic\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif;color:#161513}\nheader{display:flex;align-items:center;gap:8px}\nb{font-size:19px;font-weight:800}\nspan{margin-left:auto;font-size:13px;font-weight:800;padding:1px 6px;background:var(--c);color:#fff}\n.delay span{color:#161513}\np{margin:0;font-size:14px;color:#6d675d}\nstrong{font-size:18px;color:#161513;font-variant-numeric:tabular-nums}\nsmall{font-size:12px;color:#6d675d;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      "props": {
        "name": "string",
        "status": "string",
        "word": "string",
        "next": "string",
        "ship": "string"
      }
    },
    "title": {
      "template": "<header class=\"tt\"><h1>{{name}}</h1><p>{{sub}} · {{date}} <b>{{time}}</b></p><ul><li class=\"ok\"><i class=\"mk\"></i>운항</li><li class=\"delay\"><i class=\"mk\"></i>지연</li><li class=\"cancel\"><i class=\"mk\"></i>결항</li></ul></header>",
      "style": ".ok{--c:#1d4fa0}.delay{--c:#e8a800}.cancel{--c:#d7261e}\n.mk{display:inline-block;flex:none;width:var(--m,16px);height:var(--m,16px);background:var(--c)}\n.ok .mk,.mk.ok{border-radius:50%}\n.cancel .mk,.mk.cancel{clip-path:polygon(50% 0,100% 100%,0 100%)}\n.tt{height:100%;box-sizing:border-box;display:grid;align-content:center;gap:8px;padding:0 0 0 18px;border-left:12px solid #161513;font-family:\"Futura\", \"Jost\", \"Century Gothic\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif;color:#161513}\nh1{margin:0;font-size:44px;font-weight:800;letter-spacing:.02em;line-height:1.05}\np{margin:0;font-size:17px;color:#6d675d}\nb{color:#161513;font-size:22px}\nul{margin:4px 0 0;padding:0;list-style:none;display:flex;gap:22px;font-size:16px;font-weight:700}\nli{display:flex;align-items:center;gap:8px;--m:20px}",
      "props": {
        "name": "string",
        "sub": "string",
        "date": "string",
        "time": "string"
      }
    },
    "sea": {
      "template": "<section class=\"se\"><h3>해상 상태</h3><dl>{{#items}}<div><dt>{{label}}</dt><dd>{{value}}<small>{{unit}}</small></dd><u class=\"l{{level}}\"><s></s><s></s><s></s><s></s><s></s></u><em>{{note}}</em></div>{{/items}}</dl>{{#warning}}<p>{{warning}}</p>{{/warning}}</section>",
      "style": ".se{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr auto;gap:6px;font-family:\"Futura\", \"Jost\", \"Century Gothic\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif;color:#161513}\nh3{margin:0;font-size:18px;font-weight:800;letter-spacing:.08em}\ndl{margin:0;display:grid;grid-template-columns:repeat(3,1fr);gap:12px}\ndiv{border-top:6px solid #161513;padding-top:6px}\ndt{font-size:14px;color:#6d675d}\ndd{margin:0;font-size:36px;font-weight:800;line-height:1.1;font-variant-numeric:tabular-nums}\ndd small{font-size:15px;margin-left:3px}\nu{display:grid;grid-template-columns:repeat(5,1fr);gap:3px;margin:4px 0}\ns{height:8px;background:#d9d1bf}\n.l1 s:nth-child(-n+1),.l2 s:nth-child(-n+2),.l3 s:nth-child(-n+3){background:#161513}\n.l4 s:nth-child(-n+4),.l5 s{background:#e8a800}\nem{font-style:normal;font-size:12px;color:#6d675d}\np{margin:0;padding:6px 10px;background:#161513;color:#e8a800;font-size:15px;font-weight:700}",
      "props": {
        "items": "list",
        "warning": "string"
      }
    },
    "departures": {
      "template": "<section class=\"dp\"><h3>출항 예정</h3><ol>{{#items}}<li class=\"{{status}}\"><b>{{time}}</b><span>{{route}} <small>· {{ship}}</small></span><em><i class=\"mk\"></i>{{word}}</em></li>{{/items}}</ol></section>",
      "style": ".ok{--c:#1d4fa0}.delay{--c:#e8a800}.cancel{--c:#d7261e}\n.mk{display:inline-block;flex:none;width:var(--m,16px);height:var(--m,16px);background:var(--c)}\n.ok .mk,.mk.ok{border-radius:50%}\n.cancel .mk,.mk.cancel{clip-path:polygon(50% 0,100% 100%,0 100%)}\n.dp{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr;gap:6px;font-family:\"Futura\", \"Jost\", \"Century Gothic\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif;color:#161513}\nh3{margin:0;font-size:18px;font-weight:800;letter-spacing:.08em;padding-bottom:6px;border-bottom:6px solid #161513}\nol{margin:0;padding:0;list-style:none;display:grid;align-content:start}\nli{display:grid;grid-template-columns:64px 1fr auto;gap:10px;align-items:center;padding:7px 0;border-bottom:1px solid #cfc6b2;font-size:15px}\nb{font-size:20px;font-weight:800;font-variant-numeric:tabular-nums}\nspan{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\nsmall{font-size:12px;color:#6d675d}\nem{font-style:normal;font-weight:800;font-size:14px;display:flex;align-items:center;gap:6px;--m:14px}\n.cancel b{text-decoration:line-through;color:#6d675d}",
      "props": {
        "items": "list"
      }
    }
  },
  "data": {
    "piers": {
      "from": "ferry",
      "path": "/ferry/piers",
      "time": "updatedAt",
      "fresh": 900,
      "fields": {
        "status": {
          "at": "/port/status"
        },
        "status-2": {
          "at": "/sol/status"
        },
        "status-3": {
          "at": "/sand/status"
        },
        "status-4": {
          "at": "/rock/status"
        },
        "status-5": {
          "at": "/light/status"
        },
        "status-6": {
          "at": "/gull/status"
        },
        "status-7": {
          "at": "/far/status"
        },
        "name": {
          "at": "/port/name"
        },
        "word": {
          "at": "/port/word"
        },
        "next": {
          "at": "/port/next"
        },
        "ship": {
          "at": "/port/ship"
        },
        "name-2": {
          "at": "/sol/name"
        },
        "word-2": {
          "at": "/sol/word"
        },
        "next-2": {
          "at": "/sol/next"
        },
        "ship-2": {
          "at": "/sol/ship"
        },
        "name-3": {
          "at": "/sand/name"
        },
        "word-3": {
          "at": "/sand/word"
        },
        "next-3": {
          "at": "/sand/next"
        },
        "ship-3": {
          "at": "/sand/ship"
        },
        "name-4": {
          "at": "/rock/name"
        },
        "word-4": {
          "at": "/rock/word"
        },
        "next-4": {
          "at": "/rock/next"
        },
        "ship-4": {
          "at": "/rock/ship"
        },
        "name-5": {
          "at": "/light/name"
        },
        "word-5": {
          "at": "/light/word"
        },
        "next-5": {
          "at": "/light/next"
        },
        "ship-5": {
          "at": "/light/ship"
        },
        "name-6": {
          "at": "/gull/name"
        },
        "word-6": {
          "at": "/gull/word"
        },
        "next-6": {
          "at": "/gull/next"
        },
        "ship-6": {
          "at": "/gull/ship"
        },
        "name-7": {
          "at": "/far/name"
        },
        "word-7": {
          "at": "/far/word"
        },
        "next-7": {
          "at": "/far/next"
        },
        "ship-7": {
          "at": "/far/ship"
        }
      }
    },
    "now": {
      "from": "ferry",
      "path": "/ferry/now",
      "time": "updatedAt",
      "fresh": 900,
      "fields": {
        "name": {},
        "sub": {},
        "date": {},
        "time": {}
      }
    },
    "sea": {
      "from": "ferry",
      "path": "/ferry/sea",
      "time": "updatedAt",
      "fresh": 900,
      "fields": {
        "value": {},
        "warning": {}
      }
    },
    "departures": {
      "from": "ferry",
      "path": "/ferry/departures",
      "time": "updatedAt",
      "fresh": 900,
      "fields": {
        "value": {}
      }
    },
    "boarded": {
      "from": "ferry",
      "path": "/ferry/boarded",
      "list": "/value",
      "fresh": 900,
      "answerTime": "/updatedAt"
    },
    "routes": {
      "from": "ferry",
      "path": "/ferry/routes",
      "time": "updatedAt",
      "fresh": 900,
      "fields": {
        "label": {
          "at": "/port-sol/label"
        },
        "status": {
          "at": "/port-sol/status",
          "state": {
            "ok": "info",
            "delay": "warn",
            "cancel": "cancel",
            "*": "off"
          }
        },
        "label-2": {
          "at": "/port-sand/label"
        },
        "status-2": {
          "at": "/port-sand/status",
          "state": {
            "ok": "info",
            "delay": "warn",
            "cancel": "cancel",
            "*": "off"
          }
        },
        "label-3": {
          "at": "/port-rock/label"
        },
        "status-3": {
          "at": "/port-rock/status",
          "state": {
            "ok": "info",
            "delay": "warn",
            "cancel": "cancel",
            "*": "off"
          }
        },
        "label-4": {
          "at": "/sol-light/label"
        },
        "status-4": {
          "at": "/sol-light/status",
          "state": {
            "ok": "info",
            "delay": "warn",
            "cancel": "cancel",
            "*": "off"
          }
        },
        "label-5": {
          "at": "/rock-gull/label"
        },
        "status-5": {
          "at": "/rock-gull/status",
          "state": {
            "ok": "info",
            "delay": "warn",
            "cancel": "cancel",
            "*": "off"
          }
        },
        "label-6": {
          "at": "/light-far/label"
        },
        "status-6": {
          "at": "/light-far/status",
          "state": {
            "ok": "info",
            "delay": "warn",
            "cancel": "cancel",
            "*": "off"
          }
        }
      }
    }
  },
  "parts": {
    "pier-port": {
      "as": "element",
      "element": "pier",
      "of": "piers",
      "bind": {
        "status": "status"
      }
    },
    "pier-sol": {
      "as": "element",
      "element": "pier",
      "of": "piers",
      "bind": {
        "status": "status-2"
      }
    },
    "pier-sand": {
      "as": "element",
      "element": "pier",
      "of": "piers",
      "bind": {
        "status": "status-3"
      }
    },
    "pier-rock": {
      "as": "element",
      "element": "pier",
      "of": "piers",
      "bind": {
        "status": "status-4"
      }
    },
    "pier-light": {
      "as": "element",
      "element": "pier",
      "of": "piers",
      "bind": {
        "status": "status-5"
      }
    },
    "pier-gull": {
      "as": "element",
      "element": "pier",
      "of": "piers",
      "bind": {
        "status": "status-6"
      }
    },
    "pier-far": {
      "as": "element",
      "element": "pier",
      "of": "piers",
      "bind": {
        "status": "status-7"
      }
    },
    "dock-port": {
      "as": "element",
      "element": "dock",
      "of": "piers",
      "bind": {
        "name": "name",
        "status": "status",
        "word": "word",
        "next": "next",
        "ship": "ship"
      }
    },
    "dock-sol": {
      "as": "element",
      "element": "dock",
      "of": "piers",
      "bind": {
        "name": "name-2",
        "status": "status-2",
        "word": "word-2",
        "next": "next-2",
        "ship": "ship-2"
      }
    },
    "dock-sand": {
      "as": "element",
      "element": "dock",
      "of": "piers",
      "bind": {
        "name": "name-3",
        "status": "status-3",
        "word": "word-3",
        "next": "next-3",
        "ship": "ship-3"
      }
    },
    "dock-rock": {
      "as": "element",
      "element": "dock",
      "of": "piers",
      "bind": {
        "name": "name-4",
        "status": "status-4",
        "word": "word-4",
        "next": "next-4",
        "ship": "ship-4"
      }
    },
    "dock-light": {
      "as": "element",
      "element": "dock",
      "of": "piers",
      "bind": {
        "name": "name-5",
        "status": "status-5",
        "word": "word-5",
        "next": "next-5",
        "ship": "ship-5"
      }
    },
    "dock-gull": {
      "as": "element",
      "element": "dock",
      "of": "piers",
      "bind": {
        "name": "name-6",
        "status": "status-6",
        "word": "word-6",
        "next": "next-6",
        "ship": "ship-6"
      }
    },
    "dock-far": {
      "as": "element",
      "element": "dock",
      "of": "piers",
      "bind": {
        "name": "name-7",
        "status": "status-7",
        "word": "word-7",
        "next": "next-7",
        "ship": "ship-7"
      }
    },
    "title": {
      "as": "element",
      "element": "title",
      "of": "now",
      "bind": {
        "name": "name",
        "sub": "sub",
        "date": "date",
        "time": "time"
      }
    },
    "sea": {
      "as": "element",
      "element": "sea",
      "of": "sea",
      "bind": {
        "items": "value",
        "warning": "warning"
      }
    },
    "departures": {
      "as": "element",
      "element": "departures",
      "of": "departures",
      "bind": {
        "items": "value"
      }
    },
    "boarded": {
      "as": "chart.bar",
      "of": "boarded",
      "title": "시간대별 승선(명)",
      "x": "hour",
      "y": "people",
      "series": [
        {
          "label": "승선",
          "color": "#161513"
        }
      ]
    }
  },
  "layout": {
    "kind": "canvas",
    "size": [
      1600,
      1000
    ],
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221600%22%20height%3D%221000%22%20viewBox%3D%220%200%201600%201000%22%3E%0A%3Crect%20width%3D%221600%22%20height%3D%221000%22%20fill%3D%22%23efe8d8%22%2F%3E%0A%3Ccircle%20cx%3D%22230%22%20cy%3D%22170%22%20r%3D%22160%22%20fill%3D%22none%22%20stroke%3D%22%23161513%22%20stroke-width%3D%222%22%20stroke-dasharray%3D%224%2010%22%2F%3E%0A%3Ctext%20x%3D%2240%22%20y%3D%2252%22%20fill%3D%22%23161513%22%20font-size%3D%2222%22%20font-weight%3D%22700%22%20letter-spacing%3D%226%22%20font-family%3D'%22Futura%22%2C%20%22Jost%22%2C%20%22Century%20Gothic%22%2C%20%22Noto%20Sans%20KR%22%2C%20%22Malgun%20Gothic%22%2C%20sans-serif'%3E%EB%A8%BC%EB%B0%94%EB%8B%A4%3C%2Ftext%3E%0A%3Cpath%20d%3D%22M%20170%20110%20L%20230%20170%20L%20170%20230%20L%20110%20170%20Z%22%20transform%3D%22translate(60%200)%22%20fill%3D%22%23a39d92%22%2F%3E%0A%3Cpath%20d%3D%22M%20440%20300%20L%20510%20430%20L%20370%20430%20Z%22%20fill%3D%22%23a39d92%22%2F%3E%0A%3Ccircle%20cx%3D%22270%22%20cy%3D%22640%22%20r%3D%2270%22%20fill%3D%22%23161513%22%2F%3E%0A%3Cpath%20d%3D%22M%20540%20760%20A%2080%2080%200%200%201%20700%20760%20Z%22%20fill%3D%22%23a39d92%22%2F%3E%0A%3Crect%20x%3D%22760%22%20y%3D%22500%22%20width%3D%22130%22%20height%3D%22130%22%20fill%3D%22%23161513%22%2F%3E%0A%3Ccircle%20cx%3D%22820%22%20cy%3D%22250%22%20r%3D%2240%22%20fill%3D%22none%22%20stroke%3D%22%23161513%22%20stroke-width%3D%2210%22%2F%3E%0A%3Crect%20x%3D%220%22%20y%3D%22900%22%20width%3D%221080%22%20height%3D%22100%22%20fill%3D%22%23161513%22%2F%3E%0A%3Ctext%20x%3D%2240%22%20y%3D%22962%22%20fill%3D%22%23efe8d8%22%20font-size%3D%2222%22%20font-weight%3D%22700%22%20letter-spacing%3D%226%22%20font-family%3D'%22Futura%22%2C%20%22Jost%22%2C%20%22Century%20Gothic%22%2C%20%22Noto%20Sans%20KR%22%2C%20%22Malgun%20Gothic%22%2C%20sans-serif'%3E%EB%B3%B8%ED%86%A0%3C%2Ftext%3E%0A%3Cpath%20d%3D%22M%201010%2060%20L%201030%20110%20L%20990%20110%20Z%22%20fill%3D%22%23161513%22%2F%3E%0A%3Ctext%20x%3D%221002%22%20y%3D%22140%22%20fill%3D%22%23161513%22%20font-size%3D%2218%22%20font-weight%3D%22700%22%20font-family%3D'%22Futura%22%2C%20%22Jost%22%2C%20%22Century%20Gothic%22%2C%20%22Noto%20Sans%20KR%22%2C%20%22Malgun%20Gothic%22%2C%20sans-serif'%3EN%3C%2Ftext%3E%0A%3Crect%20x%3D%221080%22%20y%3D%220%22%20width%3D%2212%22%20height%3D%221000%22%20fill%3D%22%23161513%22%2F%3E%0A%3C%2Fsvg%3E",
    "place": {
      "pier-port": [
        188,
        876,
        24,
        24
      ],
      "pier-sol": [
        340,
        630,
        24,
        24
      ],
      "pier-sand": [
        522,
        752,
        24,
        24
      ],
      "pier-rock": [
        740,
        480,
        24,
        24
      ],
      "pier-light": [
        346,
        428,
        24,
        24
      ],
      "pier-gull": [
        808,
        300,
        24,
        24
      ],
      "pier-far": [
        250,
        224,
        24,
        24
      ],
      "dock-port": [
        250,
        902,
        180,
        96
      ],
      "dock-sol": [
        30,
        712,
        180,
        96
      ],
      "dock-sand": [
        700,
        780,
        180,
        96
      ],
      "dock-rock": [
        902,
        540,
        180,
        96
      ],
      "dock-light": [
        530,
        380,
        180,
        96
      ],
      "dock-gull": [
        884,
        212,
        180,
        96
      ],
      "dock-far": [
        320,
        118,
        180,
        96
      ],
      "title": [
        1120,
        24,
        460,
        160
      ],
      "sea": [
        1120,
        204,
        460,
        180
      ],
      "departures": [
        1120,
        400,
        460,
        330
      ],
      "boarded": [
        1120,
        748,
        460,
        232
      ]
    },
    "links": {
      "run-port-sol": {
        "from": "pier-port",
        "to": "pier-sol",
        "label": "{{label}}",
        "show": "status",
        "of": "routes",
        "width": 6
      },
      "run-port-sand": {
        "from": "pier-port",
        "to": "pier-sand",
        "label": "{{label-2}}",
        "show": "status-2",
        "of": "routes",
        "width": 6
      },
      "run-port-rock": {
        "from": "pier-port",
        "to": "pier-rock",
        "label": "{{label-3}}",
        "show": "status-3",
        "of": "routes",
        "width": 6
      },
      "run-sol-light": {
        "from": "pier-sol",
        "to": "pier-light",
        "label": "{{label-4}}",
        "show": "status-4",
        "of": "routes",
        "width": 6
      },
      "run-rock-gull": {
        "from": "pier-rock",
        "to": "pier-gull",
        "label": "{{label-5}}",
        "show": "status-5",
        "of": "routes",
        "width": 6
      },
      "run-light-far": {
        "from": "pier-light",
        "to": "pier-far",
        "label": "{{label-6}}",
        "show": "status-6",
        "of": "routes",
        "width": 6
      }
    }
  }
};

export const islandFerry: SamplePack = {
  id: "island-ferry",
  title: {
    "ko": "섬 여객선 운항 — 바우하우스 기하",
    "en": "Island ferries — a Bauhaus poster"
  },
  field: {
    "ko": "해운·여객선",
    "en": "Shipping & ferries"
  },
  kind: {
    "ko": "기하 도형으로 그린 섬 항로도",
    "en": "A route map of islands as geometric figures"
  },
  domain: "transport",
  styles: [
    "art"
  ],
  summary: {
    "ko": "항구 여객선 터미널의 섬 항로 안내판을 바우하우스 포스터로 — 섬을 원·반원·정사각형·삼각형·고리·마름모로, 본토를 아래의 검은 띠로 그리고, 부두 사이 항로를 굵은 막대로. 세 원색은 뜻 하나씩에 모양과 짝지어 색 없이도 읽힘: 파란 원 운항, 노란 사각형 지연, 빨간 삼각형 결항(점선). 부두마다 카드(상태·다음 출항·배), 오른쪽에 해상 상태(파고·풍속·시정 다섯 단계와 풍랑주의보), 출항 예정, 시간대별 승선. 항구와 섬은 지어낸 것이라 예시 데이터입니다.",
    "en": "The island-ferry board at a harbour’s passenger terminal as a Bauhaus poster — the islands as a circle, a half-disc, a square, a triangle, a ring and a lozenge, the mainland a black bar along the foot, the runs between the piers as thick bars. Each of the three primaries keeps one meaning and a shape, so the state reads without the colour: a blue circle sails, a yellow square is delayed, a red triangle is cancelled (and dashed). A card on each pier (its state, the next departure, the ship), and on the right the sea’s state (wave height, wind and visibility in five steps, and the gale warning), the next departures and passengers boarded by the hour. The harbour and its islands are made up. Example data."
  },
  connectors: [
    {
      "key": "ferry",
      "name": "예시 여객선 운항 API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 항로가 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
