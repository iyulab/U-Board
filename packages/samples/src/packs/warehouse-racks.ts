// A distribution centre's storage hall drawn as a blueprint: white lines on blue paper, a column grid with its
// bubbles, dimension lines and a title block in the corner. Each rack row is one component — the row's bins, four
// levels by twelve bays, filled as full as they are, its conveyor lane, and the line between them as thick as the row
// is being picked. Along the bottom the dock doors, inbound and outbound; on the right the hall's figures, inbound and
// outbound by the hour, and what needs a hand. No public source carries a warehouse's bins, so the values are example
// data written for it.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/warehouse-racks.js';

const board: Board = {
  "board": {
    "theme": "dark",
    "accent": "#ffb020"
  },
  "presets": {
    "rack-row": {
      "as": "group",
      "size": [
        980,
        64
      ],
      "parts": {
        "rack": {
          "as": "element",
          "element": "rack",
          "bind": {
            "zone": "zone",
            "fill": "fill",
            "bins": "bins",
            "id": "id"
          }
        },
        "lane": {
          "as": "element",
          "element": "lane",
          "bind": {
            "pickers": "pickers",
            "backlog": "backlog"
          }
        }
      },
      "place": {
        "rack": [
          0,
          0,
          800,
          64
        ],
        "lane": [
          860,
          8,
          120,
          48
        ]
      },
      "links": {
        "picks": {
          "from": "rack",
          "to": "lane",
          "label": "{{picks}}",
          "tone": "warn",
          "weight": {
            "field": "picks",
            "bands": [
              2,
              120,
              5,
              240,
              9
            ]
          },
          "width": 4,
          "arrow": "end"
        }
      }
    }
  },
  "elements": {
    "dock": {
      "template": "<figure class=\"dk {{state}}\"><b>{{name}}</b><span>{{truck}}</span><div><i style=\"width: {{pct}}%\"></i></div></figure>",
      "style": ".dk{margin:0;height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr auto;gap:4px;padding:6px 8px;border:1.5px solid #e8f1ff;border-top:5px solid #e8f1ff;font-family:ui-monospace, \"Cascadia Mono\", Consolas, monospace;color:#e8f1ff}\n.idle{opacity:.55;border-style:dashed;border-top-style:solid}\n.late{border-color:#ff6b5b}\nb{font-size:15px}\nspan{font-size:12px;color:#9fd3ff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\ndiv{height:6px;border:1px solid #e8f1ff}\ni{display:block;height:100%;background:#ffb020}\n.late i{background:#ff6b5b}",
      "props": {
        "name": "string",
        "state": "string",
        "truck": "string",
        "pct": "number"
      }
    },
    "heading": {
      "template": "<h2 class=\"hd\">{{text}}</h2>",
      "style": ".hd{margin:0;height:100%;display:flex;align-items:end;font:700 13px ui-monospace, \"Cascadia Mono\", Consolas, monospace;letter-spacing:.12em;color:#9fd3ff}",
      "props": {
        "text": "string"
      }
    },
    "figures": {
      "template": "<dl class=\"fg\">{{#items}}<div><dt>{{label}}</dt><dd>{{value}}<small>{{unit}}</small></dd><p>{{note}}</p></div>{{/items}}</dl>",
      "style": ".fg{margin:0;height:100%;box-sizing:border-box;display:grid;grid-template-columns:1fr 1fr;border:1.5px solid #e8f1ff;font-family:ui-monospace, \"Cascadia Mono\", Consolas, monospace;color:#e8f1ff}\ndiv{padding:10px 12px;border:.75px solid rgba(232,241,255,.4)}\ndt{font-size:12px;color:#9fd3ff;letter-spacing:.04em}\ndd{margin:2px 0 0;font-size:32px;line-height:1.1;font-variant-numeric:tabular-nums}\ndd small{font-size:14px;margin-left:4px;color:#9fd3ff}\np{margin:2px 0 0;font-size:11px;color:#9fd3ff;opacity:.85;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      "props": {
        "items": "list"
      }
    },
    "alerts": {
      "template": "<section class=\"al\"><h3>조치 필요</h3><ul>{{#items}}<li class=\"{{level}}\"><b>{{at}}</b><span>{{text}}</span></li>{{/items}}</ul></section>",
      "style": ".al{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr;gap:6px;font-family:ui-monospace, \"Cascadia Mono\", Consolas, monospace;color:#e8f1ff}\nh3{margin:0;font-size:13px;font-weight:700;letter-spacing:.12em;color:#9fd3ff;border-bottom:1.5px solid #e8f1ff;padding-bottom:4px}\nul{margin:0;padding:0;list-style:none;display:grid;align-content:start;gap:6px}\nli{display:grid;grid-template-columns:82px 1fr;gap:8px;font-size:13px;align-items:baseline}\nli::before{content:\"\";display:none}\nb{color:#9fd3ff;white-space:nowrap}\n.warn b{color:#ffb020}.stop b{color:#ff6b5b}\nspan{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      "props": {
        "items": "list"
      }
    },
    "title-block": {
      "template": "<table class=\"tb\"><tr><th colspan=\"2\">{{title}}</th></tr><tr><td>현장</td><td>{{site}}</td></tr><tr><td>도면</td><td>{{number}} · {{scale}}</td></tr><tr><td>기준</td><td>{{stamp}}</td></tr></table>",
      "style": ".tb{width:100%;height:100%;box-sizing:border-box;border-collapse:collapse;font-family:ui-monospace, \"Cascadia Mono\", Consolas, monospace;color:#e8f1ff;font-size:13px}\nth{text-align:left;font-size:18px;padding:8px 10px;border:1.5px solid #e8f1ff}\ntd{padding:4px 10px;border:1px solid rgba(232,241,255,.55);white-space:nowrap}\ntd:first-child{width:56px;color:#9fd3ff}",
      "props": {
        "title": "string",
        "site": "string",
        "number": "string",
        "scale": "string",
        "stamp": "string"
      }
    },
    "rack": {
      "template": "<section class=\"rk\"><header><b>{{id}}</b><span>{{fill}}%</span><small>{{zone}}</small></header><div class=\"bins\">{{#bins}}<i class=\"f{{.}}\"></i>{{/bins}}</div></section>",
      "style": ".rk{height:100%;box-sizing:border-box;display:grid;grid-template-columns:96px 1fr;grid-template-rows:minmax(0,1fr);gap:10px;font-family:ui-monospace, \"Cascadia Mono\", Consolas, monospace;color:#e8f1ff}\nheader{display:grid;align-content:center;justify-items:start;border-right:1.5px solid #e8f1ff;padding-right:8px}\nb{font-size:24px;line-height:1}\nspan{font-size:15px;color:#9fd3ff;font-variant-numeric:tabular-nums}\nsmall{font-size:11px;color:#9fd3ff;opacity:.8;white-space:nowrap}\n.bins{display:grid;grid-template-columns:repeat(12,1fr);grid-template-rows:repeat(4,minmax(0,1fr));gap:2px;border:1.5px solid #e8f1ff;padding:2px}\ni{border:1px solid rgba(232,241,255,.35)}\n.f1{background:rgba(232,241,255,.22)}.f2{background:rgba(232,241,255,.45)}.f3{background:rgba(232,241,255,.7)}.f4{background:#e8f1ff}\n.fx{background:repeating-linear-gradient(45deg,#ffb020 0 3px,transparent 3px 6px);border-color:#ffb020}\n.fq{border:2px solid #ff6b5b}",
      "props": {
        "id": "string",
        "zone": "string",
        "fill": "number",
        "bins": "list"
      }
    },
    "lane": {
      "template": "<p class=\"ln\"><span>작업자 <b>{{pickers}}</b></span><span>대기 <b>{{backlog}}</b>줄</span></p>",
      "style": ".ln{margin:0;height:100%;box-sizing:border-box;display:grid;align-content:center;gap:2px;padding:0 8px;border:1.5px solid #ffb020;font-family:ui-monospace, \"Cascadia Mono\", Consolas, monospace;color:#9fd3ff;font-size:12px;white-space:nowrap}\nb{color:#e8f1ff;font-size:15px}",
      "props": {
        "pickers": "number",
        "backlog": "number"
      }
    }
  },
  "data": {
    "docks": {
      "from": "wms",
      "path": "/wms/docks",
      "list": "/value",
      "key": "id",
      "time": "updatedAt",
      "fresh": 900,
      "fields": {
        "state": {},
        "truck": {},
        "pct": {}
      }
    },
    "figures": {
      "from": "wms",
      "path": "/wms/figures",
      "time": "updatedAt",
      "fresh": 900,
      "fields": {
        "value": {}
      }
    },
    "flow": {
      "from": "wms",
      "path": "/wms/flow",
      "list": "/value",
      "fresh": 900,
      "answerTime": "/updatedAt"
    },
    "alerts": {
      "from": "wms",
      "path": "/wms/alerts",
      "time": "updatedAt",
      "fresh": 900,
      "fields": {
        "value": {}
      }
    },
    "now": {
      "from": "wms",
      "path": "/wms/now",
      "time": "updatedAt",
      "fresh": 900,
      "fields": {
        "site": {},
        "stamp": {}
      }
    },
    "racks": {
      "from": "wms",
      "path": "/wms/racks",
      "list": "/value",
      "key": "id",
      "time": "updatedAt",
      "fresh": 900,
      "fields": {
        "zone": {},
        "fill": {},
        "bins": {},
        "id": {},
        "pickers": {},
        "backlog": {},
        "picks": {}
      }
    }
  },
  "parts": {
    "dock-D1": {
      "as": "element",
      "element": "dock",
      "of": "docks[D1]",
      "props": {
        "name": "D1"
      },
      "bind": {
        "state": "state",
        "truck": "truck",
        "pct": "pct"
      }
    },
    "dock-D2": {
      "as": "element",
      "element": "dock",
      "of": "docks[D2]",
      "props": {
        "name": "D2"
      },
      "bind": {
        "state": "state",
        "truck": "truck",
        "pct": "pct"
      }
    },
    "dock-D3": {
      "as": "element",
      "element": "dock",
      "of": "docks[D3]",
      "props": {
        "name": "D3"
      },
      "bind": {
        "state": "state",
        "truck": "truck",
        "pct": "pct"
      }
    },
    "dock-D4": {
      "as": "element",
      "element": "dock",
      "of": "docks[D4]",
      "props": {
        "name": "D4"
      },
      "bind": {
        "state": "state",
        "truck": "truck",
        "pct": "pct"
      }
    },
    "dock-D5": {
      "as": "element",
      "element": "dock",
      "of": "docks[D5]",
      "props": {
        "name": "D5"
      },
      "bind": {
        "state": "state",
        "truck": "truck",
        "pct": "pct"
      }
    },
    "dock-D6": {
      "as": "element",
      "element": "dock",
      "of": "docks[D6]",
      "props": {
        "name": "D6"
      },
      "bind": {
        "state": "state",
        "truck": "truck",
        "pct": "pct"
      }
    },
    "dock-D7": {
      "as": "element",
      "element": "dock",
      "of": "docks[D7]",
      "props": {
        "name": "D7"
      },
      "bind": {
        "state": "state",
        "truck": "truck",
        "pct": "pct"
      }
    },
    "dock-D8": {
      "as": "element",
      "element": "dock",
      "of": "docks[D8]",
      "props": {
        "name": "D8"
      },
      "bind": {
        "state": "state",
        "truck": "truck",
        "pct": "pct"
      }
    },
    "figures-head": {
      "as": "element",
      "element": "heading",
      "props": {
        "text": "보관동 2 · 지금"
      }
    },
    "figures": {
      "as": "element",
      "element": "figures",
      "of": "figures",
      "bind": {
        "items": "value"
      }
    },
    "flow-head": {
      "as": "element",
      "element": "heading",
      "props": {
        "text": "시간대별 입출고(팔레트)"
      }
    },
    "flow": {
      "as": "chart.line",
      "of": "flow",
      "x": "hour",
      "y": [
        "inbound",
        "outbound"
      ],
      "series": [
        {
          "label": "입고",
          "color": "#9fd3ff"
        },
        {
          "label": "출고",
          "color": "#ffb020"
        }
      ]
    },
    "alerts": {
      "as": "element",
      "element": "alerts",
      "of": "alerts",
      "bind": {
        "items": "value"
      }
    },
    "title-block": {
      "as": "element",
      "element": "title-block",
      "of": "now",
      "props": {
        "title": "랙 점유 · 피킹 현황",
        "number": "W-02-03",
        "scale": "1:400"
      },
      "bind": {
        "site": "site",
        "stamp": "stamp"
      }
    },
    "A": {
      "use": "rack-row",
      "of": "racks[A]"
    },
    "B": {
      "use": "rack-row",
      "of": "racks[B]"
    },
    "C": {
      "use": "rack-row",
      "of": "racks[C]"
    },
    "D": {
      "use": "rack-row",
      "of": "racks[D]"
    },
    "E": {
      "use": "rack-row",
      "of": "racks[E]"
    },
    "F": {
      "use": "rack-row",
      "of": "racks[F]"
    }
  },
  "layout": {
    "kind": "canvas",
    "size": [
      1600,
      1000
    ],
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221600%22%20height%3D%221000%22%20viewBox%3D%220%200%201600%201000%22%3E%0A%3Cdefs%3E%3Cpattern%20id%3D%22g%22%20width%3D%2220%22%20height%3D%2220%22%20patternUnits%3D%22userSpaceOnUse%22%3E%3Cpath%20d%3D%22M%2020%200%20H%200%20V%2020%22%20fill%3D%22none%22%20stroke%3D%22%23e8f1ff%22%20stroke-opacity%3D%22.07%22%2F%3E%3C%2Fpattern%3E%3C%2Fdefs%3E%0A%3Crect%20width%3D%221600%22%20height%3D%221000%22%20fill%3D%22%230b3a75%22%2F%3E%0A%3Crect%20width%3D%221600%22%20height%3D%221000%22%20fill%3D%22url(%23g)%22%2F%3E%0A%3Cline%20x1%3D%2280%22%20y1%3D%2260%22%20x2%3D%2280%22%20y2%3D%22960%22%20stroke%3D%22%23e8f1ff%22%20stroke-opacity%3D%22.14%22%20stroke-dasharray%3D%2214%204%202%204%22%2F%3E%3Ccircle%20cx%3D%2280%22%20cy%3D%2238%22%20r%3D%2213%22%20fill%3D%22none%22%20stroke%3D%22%23e8f1ff%22%20stroke-width%3D%221.2%22%2F%3E%3Ctext%20x%3D%2280%22%20y%3D%2243%22%20fill%3D%22%23e8f1ff%22%20font-size%3D%2213%22%20text-anchor%3D%22middle%22%20font-family%3D'ui-monospace%2C%20%22Cascadia%20Mono%22%2C%20Consolas%2C%20monospace'%3E1%3C%2Ftext%3E%3Cline%20x1%3D%22230%22%20y1%3D%2260%22%20x2%3D%22230%22%20y2%3D%22960%22%20stroke%3D%22%23e8f1ff%22%20stroke-opacity%3D%22.14%22%20stroke-dasharray%3D%2214%204%202%204%22%2F%3E%3Ccircle%20cx%3D%22230%22%20cy%3D%2238%22%20r%3D%2213%22%20fill%3D%22none%22%20stroke%3D%22%23e8f1ff%22%20stroke-width%3D%221.2%22%2F%3E%3Ctext%20x%3D%22230%22%20y%3D%2243%22%20fill%3D%22%23e8f1ff%22%20font-size%3D%2213%22%20text-anchor%3D%22middle%22%20font-family%3D'ui-monospace%2C%20%22Cascadia%20Mono%22%2C%20Consolas%2C%20monospace'%3E2%3C%2Ftext%3E%3Cline%20x1%3D%22380%22%20y1%3D%2260%22%20x2%3D%22380%22%20y2%3D%22960%22%20stroke%3D%22%23e8f1ff%22%20stroke-opacity%3D%22.14%22%20stroke-dasharray%3D%2214%204%202%204%22%2F%3E%3Ccircle%20cx%3D%22380%22%20cy%3D%2238%22%20r%3D%2213%22%20fill%3D%22none%22%20stroke%3D%22%23e8f1ff%22%20stroke-width%3D%221.2%22%2F%3E%3Ctext%20x%3D%22380%22%20y%3D%2243%22%20fill%3D%22%23e8f1ff%22%20font-size%3D%2213%22%20text-anchor%3D%22middle%22%20font-family%3D'ui-monospace%2C%20%22Cascadia%20Mono%22%2C%20Consolas%2C%20monospace'%3E3%3C%2Ftext%3E%3Cline%20x1%3D%22530%22%20y1%3D%2260%22%20x2%3D%22530%22%20y2%3D%22960%22%20stroke%3D%22%23e8f1ff%22%20stroke-opacity%3D%22.14%22%20stroke-dasharray%3D%2214%204%202%204%22%2F%3E%3Ccircle%20cx%3D%22530%22%20cy%3D%2238%22%20r%3D%2213%22%20fill%3D%22none%22%20stroke%3D%22%23e8f1ff%22%20stroke-width%3D%221.2%22%2F%3E%3Ctext%20x%3D%22530%22%20y%3D%2243%22%20fill%3D%22%23e8f1ff%22%20font-size%3D%2213%22%20text-anchor%3D%22middle%22%20font-family%3D'ui-monospace%2C%20%22Cascadia%20Mono%22%2C%20Consolas%2C%20monospace'%3E4%3C%2Ftext%3E%3Cline%20x1%3D%22680%22%20y1%3D%2260%22%20x2%3D%22680%22%20y2%3D%22960%22%20stroke%3D%22%23e8f1ff%22%20stroke-opacity%3D%22.14%22%20stroke-dasharray%3D%2214%204%202%204%22%2F%3E%3Ccircle%20cx%3D%22680%22%20cy%3D%2238%22%20r%3D%2213%22%20fill%3D%22none%22%20stroke%3D%22%23e8f1ff%22%20stroke-width%3D%221.2%22%2F%3E%3Ctext%20x%3D%22680%22%20y%3D%2243%22%20fill%3D%22%23e8f1ff%22%20font-size%3D%2213%22%20text-anchor%3D%22middle%22%20font-family%3D'ui-monospace%2C%20%22Cascadia%20Mono%22%2C%20Consolas%2C%20monospace'%3E5%3C%2Ftext%3E%3Cline%20x1%3D%22830%22%20y1%3D%2260%22%20x2%3D%22830%22%20y2%3D%22960%22%20stroke%3D%22%23e8f1ff%22%20stroke-opacity%3D%22.14%22%20stroke-dasharray%3D%2214%204%202%204%22%2F%3E%3Ccircle%20cx%3D%22830%22%20cy%3D%2238%22%20r%3D%2213%22%20fill%3D%22none%22%20stroke%3D%22%23e8f1ff%22%20stroke-width%3D%221.2%22%2F%3E%3Ctext%20x%3D%22830%22%20y%3D%2243%22%20fill%3D%22%23e8f1ff%22%20font-size%3D%2213%22%20text-anchor%3D%22middle%22%20font-family%3D'ui-monospace%2C%20%22Cascadia%20Mono%22%2C%20Consolas%2C%20monospace'%3E6%3C%2Ftext%3E%3Cline%20x1%3D%22980%22%20y1%3D%2260%22%20x2%3D%22980%22%20y2%3D%22960%22%20stroke%3D%22%23e8f1ff%22%20stroke-opacity%3D%22.14%22%20stroke-dasharray%3D%2214%204%202%204%22%2F%3E%3Ccircle%20cx%3D%22980%22%20cy%3D%2238%22%20r%3D%2213%22%20fill%3D%22none%22%20stroke%3D%22%23e8f1ff%22%20stroke-width%3D%221.2%22%2F%3E%3Ctext%20x%3D%22980%22%20y%3D%2243%22%20fill%3D%22%23e8f1ff%22%20font-size%3D%2213%22%20text-anchor%3D%22middle%22%20font-family%3D'ui-monospace%2C%20%22Cascadia%20Mono%22%2C%20Consolas%2C%20monospace'%3E7%3C%2Ftext%3E%3Cline%20x1%3D%221130%22%20y1%3D%2260%22%20x2%3D%221130%22%20y2%3D%22960%22%20stroke%3D%22%23e8f1ff%22%20stroke-opacity%3D%22.14%22%20stroke-dasharray%3D%2214%204%202%204%22%2F%3E%3Ccircle%20cx%3D%221130%22%20cy%3D%2238%22%20r%3D%2213%22%20fill%3D%22none%22%20stroke%3D%22%23e8f1ff%22%20stroke-width%3D%221.2%22%2F%3E%3Ctext%20x%3D%221130%22%20y%3D%2243%22%20fill%3D%22%23e8f1ff%22%20font-size%3D%2213%22%20text-anchor%3D%22middle%22%20font-family%3D'ui-monospace%2C%20%22Cascadia%20Mono%22%2C%20Consolas%2C%20monospace'%3E8%3C%2Ftext%3E%3Cline%20x1%3D%2240%22%20y1%3D%22100%22%20x2%3D%221140%22%20y2%3D%22100%22%20stroke%3D%22%23e8f1ff%22%20stroke-opacity%3D%22.14%22%20stroke-dasharray%3D%2214%204%202%204%22%2F%3E%3Ccircle%20cx%3D%2218%22%20cy%3D%22100%22%20r%3D%2213%22%20fill%3D%22none%22%20stroke%3D%22%23e8f1ff%22%20stroke-width%3D%221.2%22%2F%3E%3Ctext%20x%3D%2218%22%20y%3D%22105%22%20fill%3D%22%23e8f1ff%22%20font-size%3D%2213%22%20text-anchor%3D%22middle%22%20font-family%3D'ui-monospace%2C%20%22Cascadia%20Mono%22%2C%20Consolas%2C%20monospace'%3EA%3C%2Ftext%3E%3Cline%20x1%3D%2240%22%20y1%3D%22232%22%20x2%3D%221140%22%20y2%3D%22232%22%20stroke%3D%22%23e8f1ff%22%20stroke-opacity%3D%22.14%22%20stroke-dasharray%3D%2214%204%202%204%22%2F%3E%3Ccircle%20cx%3D%2218%22%20cy%3D%22232%22%20r%3D%2213%22%20fill%3D%22none%22%20stroke%3D%22%23e8f1ff%22%20stroke-width%3D%221.2%22%2F%3E%3Ctext%20x%3D%2218%22%20y%3D%22237%22%20fill%3D%22%23e8f1ff%22%20font-size%3D%2213%22%20text-anchor%3D%22middle%22%20font-family%3D'ui-monospace%2C%20%22Cascadia%20Mono%22%2C%20Consolas%2C%20monospace'%3EB%3C%2Ftext%3E%3Cline%20x1%3D%2240%22%20y1%3D%22364%22%20x2%3D%221140%22%20y2%3D%22364%22%20stroke%3D%22%23e8f1ff%22%20stroke-opacity%3D%22.14%22%20stroke-dasharray%3D%2214%204%202%204%22%2F%3E%3Ccircle%20cx%3D%2218%22%20cy%3D%22364%22%20r%3D%2213%22%20fill%3D%22none%22%20stroke%3D%22%23e8f1ff%22%20stroke-width%3D%221.2%22%2F%3E%3Ctext%20x%3D%2218%22%20y%3D%22369%22%20fill%3D%22%23e8f1ff%22%20font-size%3D%2213%22%20text-anchor%3D%22middle%22%20font-family%3D'ui-monospace%2C%20%22Cascadia%20Mono%22%2C%20Consolas%2C%20monospace'%3EC%3C%2Ftext%3E%3Cline%20x1%3D%2240%22%20y1%3D%22496%22%20x2%3D%221140%22%20y2%3D%22496%22%20stroke%3D%22%23e8f1ff%22%20stroke-opacity%3D%22.14%22%20stroke-dasharray%3D%2214%204%202%204%22%2F%3E%3Ccircle%20cx%3D%2218%22%20cy%3D%22496%22%20r%3D%2213%22%20fill%3D%22none%22%20stroke%3D%22%23e8f1ff%22%20stroke-width%3D%221.2%22%2F%3E%3Ctext%20x%3D%2218%22%20y%3D%22501%22%20fill%3D%22%23e8f1ff%22%20font-size%3D%2213%22%20text-anchor%3D%22middle%22%20font-family%3D'ui-monospace%2C%20%22Cascadia%20Mono%22%2C%20Consolas%2C%20monospace'%3ED%3C%2Ftext%3E%3Cline%20x1%3D%2240%22%20y1%3D%22628%22%20x2%3D%221140%22%20y2%3D%22628%22%20stroke%3D%22%23e8f1ff%22%20stroke-opacity%3D%22.14%22%20stroke-dasharray%3D%2214%204%202%204%22%2F%3E%3Ccircle%20cx%3D%2218%22%20cy%3D%22628%22%20r%3D%2213%22%20fill%3D%22none%22%20stroke%3D%22%23e8f1ff%22%20stroke-width%3D%221.2%22%2F%3E%3Ctext%20x%3D%2218%22%20y%3D%22633%22%20fill%3D%22%23e8f1ff%22%20font-size%3D%2213%22%20text-anchor%3D%22middle%22%20font-family%3D'ui-monospace%2C%20%22Cascadia%20Mono%22%2C%20Consolas%2C%20monospace'%3EE%3C%2Ftext%3E%3Cline%20x1%3D%2240%22%20y1%3D%22760%22%20x2%3D%221140%22%20y2%3D%22760%22%20stroke%3D%22%23e8f1ff%22%20stroke-opacity%3D%22.14%22%20stroke-dasharray%3D%2214%204%202%204%22%2F%3E%3Ccircle%20cx%3D%2218%22%20cy%3D%22760%22%20r%3D%2213%22%20fill%3D%22none%22%20stroke%3D%22%23e8f1ff%22%20stroke-width%3D%221.2%22%2F%3E%3Ctext%20x%3D%2218%22%20y%3D%22765%22%20fill%3D%22%23e8f1ff%22%20font-size%3D%2213%22%20text-anchor%3D%22middle%22%20font-family%3D'ui-monospace%2C%20%22Cascadia%20Mono%22%2C%20Consolas%2C%20monospace'%3EF%3C%2Ftext%3E%3Cline%20x1%3D%2240%22%20y1%3D%22892%22%20x2%3D%221140%22%20y2%3D%22892%22%20stroke%3D%22%23e8f1ff%22%20stroke-opacity%3D%22.14%22%20stroke-dasharray%3D%2214%204%202%204%22%2F%3E%3Ccircle%20cx%3D%2218%22%20cy%3D%22892%22%20r%3D%2213%22%20fill%3D%22none%22%20stroke%3D%22%23e8f1ff%22%20stroke-width%3D%221.2%22%2F%3E%3Ctext%20x%3D%2218%22%20y%3D%22897%22%20fill%3D%22%23e8f1ff%22%20font-size%3D%2213%22%20text-anchor%3D%22middle%22%20font-family%3D'ui-monospace%2C%20%22Cascadia%20Mono%22%2C%20Consolas%2C%20monospace'%3EG%3C%2Ftext%3E%0A%3Crect%20x%3D%2240%22%20y%3D%2260%22%20width%3D%221100%22%20height%3D%22900%22%20fill%3D%22none%22%20stroke%3D%22%23e8f1ff%22%20stroke-width%3D%223%22%2F%3E%0A%3Cline%20x1%3D%2240%22%20y1%3D%22982%22%20x2%3D%221140%22%20y2%3D%22982%22%20stroke%3D%22%23e8f1ff%22%20stroke-width%3D%221%22%2F%3E%3Cline%20x1%3D%2240%22%20y1%3D%22975%22%20x2%3D%2240%22%20y2%3D%22989%22%20stroke%3D%22%23e8f1ff%22%2F%3E%3Cline%20x1%3D%221140%22%20y1%3D%22975%22%20x2%3D%221140%22%20y2%3D%22989%22%20stroke%3D%22%23e8f1ff%22%2F%3E%3Ctext%20x%3D%22590%22%20y%3D%22976%22%20fill%3D%22%23e8f1ff%22%20font-size%3D%2213%22%20text-anchor%3D%22middle%22%20font-family%3D'ui-monospace%2C%20%22Cascadia%20Mono%22%2C%20Consolas%2C%20monospace'%3E84%20000%3C%2Ftext%3E%0A%3Crect%20x%3D%221100%22%20y%3D%22130%22%20width%3D%2224%22%20height%3D%22700%22%20fill%3D%22none%22%20stroke%3D%22%23e8f1ff%22%20stroke-width%3D%221.5%22%2F%3E%3Cline%20x1%3D%221100%22%20y1%3D%22130%22%20x2%3D%221124%22%20y2%3D%22130%22%20stroke%3D%22%23e8f1ff%22%20stroke-opacity%3D%22.5%22%2F%3E%3Cline%20x1%3D%221100%22%20y1%3D%22146%22%20x2%3D%221124%22%20y2%3D%22146%22%20stroke%3D%22%23e8f1ff%22%20stroke-opacity%3D%22.5%22%2F%3E%3Cline%20x1%3D%221100%22%20y1%3D%22162%22%20x2%3D%221124%22%20y2%3D%22162%22%20stroke%3D%22%23e8f1ff%22%20stroke-opacity%3D%22.5%22%2F%3E%3Cline%20x1%3D%221100%22%20y1%3D%22178%22%20x2%3D%221124%22%20y2%3D%22178%22%20stroke%3D%22%23e8f1ff%22%20stroke-opacity%3D%22.5%22%2F%3E%3Cline%20x1%3D%221100%22%20y1%3D%22194%22%20x2%3D%221124%22%20y2%3D%22194%22%20stroke%3D%22%23e8f1ff%22%20stroke-opacity%3D%22.5%22%2F%3E%3Cline%20x1%3D%221100%22%20y1%3D%22210%22%20x2%3D%221124%22%20y2%3D%22210%22%20stroke%3D%22%23e8f1ff%22%20stroke-opacity%3D%22.5%22%2F%3E%3Cline%20x1%3D%221100%22%20y1%3D%22226%22%20x2%3D%221124%22%20y2%3D%22226%22%20stroke%3D%22%23e8f1ff%22%20stroke-opacity%3D%22.5%22%2F%3E%3Cline%20x1%3D%221100%22%20y1%3D%22242%22%20x2%3D%221124%22%20y2%3D%22242%22%20stroke%3D%22%23e8f1ff%22%20stroke-opacity%3D%22.5%22%2F%3E%3Cline%20x1%3D%221100%22%20y1%3D%22258%22%20x2%3D%221124%22%20y2%3D%22258%22%20stroke%3D%22%23e8f1ff%22%20stroke-opacity%3D%22.5%22%2F%3E%3Cline%20x1%3D%221100%22%20y1%3D%22274%22%20x2%3D%221124%22%20y2%3D%22274%22%20stroke%3D%22%23e8f1ff%22%20stroke-opacity%3D%22.5%22%2F%3E%3Cline%20x1%3D%221100%22%20y1%3D%22290%22%20x2%3D%221124%22%20y2%3D%22290%22%20stroke%3D%22%23e8f1ff%22%20stroke-opacity%3D%22.5%22%2F%3E%3Cline%20x1%3D%221100%22%20y1%3D%22306%22%20x2%3D%221124%22%20y2%3D%22306%22%20stroke%3D%22%23e8f1ff%22%20stroke-opacity%3D%22.5%22%2F%3E%3Cline%20x1%3D%221100%22%20y1%3D%22322%22%20x2%3D%221124%22%20y2%3D%22322%22%20stroke%3D%22%23e8f1ff%22%20stroke-opacity%3D%22.5%22%2F%3E%3Cline%20x1%3D%221100%22%20y1%3D%22338%22%20x2%3D%221124%22%20y2%3D%22338%22%20stroke%3D%22%23e8f1ff%22%20stroke-opacity%3D%22.5%22%2F%3E%3Cline%20x1%3D%221100%22%20y1%3D%22354%22%20x2%3D%221124%22%20y2%3D%22354%22%20stroke%3D%22%23e8f1ff%22%20stroke-opacity%3D%22.5%22%2F%3E%3Cline%20x1%3D%221100%22%20y1%3D%22370%22%20x2%3D%221124%22%20y2%3D%22370%22%20stroke%3D%22%23e8f1ff%22%20stroke-opacity%3D%22.5%22%2F%3E%3Cline%20x1%3D%221100%22%20y1%3D%22386%22%20x2%3D%221124%22%20y2%3D%22386%22%20stroke%3D%22%23e8f1ff%22%20stroke-opacity%3D%22.5%22%2F%3E%3Cline%20x1%3D%221100%22%20y1%3D%22402%22%20x2%3D%221124%22%20y2%3D%22402%22%20stroke%3D%22%23e8f1ff%22%20stroke-opacity%3D%22.5%22%2F%3E%3Cline%20x1%3D%221100%22%20y1%3D%22418%22%20x2%3D%221124%22%20y2%3D%22418%22%20stroke%3D%22%23e8f1ff%22%20stroke-opacity%3D%22.5%22%2F%3E%3Cline%20x1%3D%221100%22%20y1%3D%22434%22%20x2%3D%221124%22%20y2%3D%22434%22%20stroke%3D%22%23e8f1ff%22%20stroke-opacity%3D%22.5%22%2F%3E%3Cline%20x1%3D%221100%22%20y1%3D%22450%22%20x2%3D%221124%22%20y2%3D%22450%22%20stroke%3D%22%23e8f1ff%22%20stroke-opacity%3D%22.5%22%2F%3E%3Cline%20x1%3D%221100%22%20y1%3D%22466%22%20x2%3D%221124%22%20y2%3D%22466%22%20stroke%3D%22%23e8f1ff%22%20stroke-opacity%3D%22.5%22%2F%3E%3Cline%20x1%3D%221100%22%20y1%3D%22482%22%20x2%3D%221124%22%20y2%3D%22482%22%20stroke%3D%22%23e8f1ff%22%20stroke-opacity%3D%22.5%22%2F%3E%3Cline%20x1%3D%221100%22%20y1%3D%22498%22%20x2%3D%221124%22%20y2%3D%22498%22%20stroke%3D%22%23e8f1ff%22%20stroke-opacity%3D%22.5%22%2F%3E%3Cline%20x1%3D%221100%22%20y1%3D%22514%22%20x2%3D%221124%22%20y2%3D%22514%22%20stroke%3D%22%23e8f1ff%22%20stroke-opacity%3D%22.5%22%2F%3E%3Cline%20x1%3D%221100%22%20y1%3D%22530%22%20x2%3D%221124%22%20y2%3D%22530%22%20stroke%3D%22%23e8f1ff%22%20stroke-opacity%3D%22.5%22%2F%3E%3Cline%20x1%3D%221100%22%20y1%3D%22546%22%20x2%3D%221124%22%20y2%3D%22546%22%20stroke%3D%22%23e8f1ff%22%20stroke-opacity%3D%22.5%22%2F%3E%3Cline%20x1%3D%221100%22%20y1%3D%22562%22%20x2%3D%221124%22%20y2%3D%22562%22%20stroke%3D%22%23e8f1ff%22%20stroke-opacity%3D%22.5%22%2F%3E%3Cline%20x1%3D%221100%22%20y1%3D%22578%22%20x2%3D%221124%22%20y2%3D%22578%22%20stroke%3D%22%23e8f1ff%22%20stroke-opacity%3D%22.5%22%2F%3E%3Cline%20x1%3D%221100%22%20y1%3D%22594%22%20x2%3D%221124%22%20y2%3D%22594%22%20stroke%3D%22%23e8f1ff%22%20stroke-opacity%3D%22.5%22%2F%3E%3Cline%20x1%3D%221100%22%20y1%3D%22610%22%20x2%3D%221124%22%20y2%3D%22610%22%20stroke%3D%22%23e8f1ff%22%20stroke-opacity%3D%22.5%22%2F%3E%3Cline%20x1%3D%221100%22%20y1%3D%22626%22%20x2%3D%221124%22%20y2%3D%22626%22%20stroke%3D%22%23e8f1ff%22%20stroke-opacity%3D%22.5%22%2F%3E%3Cline%20x1%3D%221100%22%20y1%3D%22642%22%20x2%3D%221124%22%20y2%3D%22642%22%20stroke%3D%22%23e8f1ff%22%20stroke-opacity%3D%22.5%22%2F%3E%3Cline%20x1%3D%221100%22%20y1%3D%22658%22%20x2%3D%221124%22%20y2%3D%22658%22%20stroke%3D%22%23e8f1ff%22%20stroke-opacity%3D%22.5%22%2F%3E%3Cline%20x1%3D%221100%22%20y1%3D%22674%22%20x2%3D%221124%22%20y2%3D%22674%22%20stroke%3D%22%23e8f1ff%22%20stroke-opacity%3D%22.5%22%2F%3E%3Cline%20x1%3D%221100%22%20y1%3D%22690%22%20x2%3D%221124%22%20y2%3D%22690%22%20stroke%3D%22%23e8f1ff%22%20stroke-opacity%3D%22.5%22%2F%3E%3Cline%20x1%3D%221100%22%20y1%3D%22706%22%20x2%3D%221124%22%20y2%3D%22706%22%20stroke%3D%22%23e8f1ff%22%20stroke-opacity%3D%22.5%22%2F%3E%3Cline%20x1%3D%221100%22%20y1%3D%22722%22%20x2%3D%221124%22%20y2%3D%22722%22%20stroke%3D%22%23e8f1ff%22%20stroke-opacity%3D%22.5%22%2F%3E%3Cline%20x1%3D%221100%22%20y1%3D%22738%22%20x2%3D%221124%22%20y2%3D%22738%22%20stroke%3D%22%23e8f1ff%22%20stroke-opacity%3D%22.5%22%2F%3E%3Cline%20x1%3D%221100%22%20y1%3D%22754%22%20x2%3D%221124%22%20y2%3D%22754%22%20stroke%3D%22%23e8f1ff%22%20stroke-opacity%3D%22.5%22%2F%3E%3Cline%20x1%3D%221100%22%20y1%3D%22770%22%20x2%3D%221124%22%20y2%3D%22770%22%20stroke%3D%22%23e8f1ff%22%20stroke-opacity%3D%22.5%22%2F%3E%3Cline%20x1%3D%221100%22%20y1%3D%22786%22%20x2%3D%221124%22%20y2%3D%22786%22%20stroke%3D%22%23e8f1ff%22%20stroke-opacity%3D%22.5%22%2F%3E%3Cline%20x1%3D%221100%22%20y1%3D%22802%22%20x2%3D%221124%22%20y2%3D%22802%22%20stroke%3D%22%23e8f1ff%22%20stroke-opacity%3D%22.5%22%2F%3E%0A%3Cpath%20d%3D%22M%201112%20830%20V%20834%20H%20636%22%20fill%3D%22none%22%20stroke%3D%22%23e8f1ff%22%20stroke-width%3D%221.5%22%20stroke-dasharray%3D%226%204%22%2F%3E%0A%3Ctext%20x%3D%221094%22%20y%3D%22120%22%20fill%3D%22%239fd3ff%22%20font-size%3D%2212%22%20text-anchor%3D%22start%22%20font-family%3D'ui-monospace%2C%20%22Cascadia%20Mono%22%2C%20Consolas%2C%20monospace'%3ECV-01%3C%2Ftext%3E%0A%3Ctext%20x%3D%2252%22%20y%3D%22852%22%20fill%3D%22%239fd3ff%22%20font-size%3D%2213%22%20text-anchor%3D%22start%22%20font-family%3D'ui-monospace%2C%20%22Cascadia%20Mono%22%2C%20Consolas%2C%20monospace'%3E%EC%9E%85%EA%B3%A0%20%EC%8A%A4%ED%85%8C%EC%9D%B4%EC%A7%95%3C%2Ftext%3E%0A%3Ctext%20x%3D%22636%22%20y%3D%22852%22%20fill%3D%22%239fd3ff%22%20font-size%3D%2213%22%20text-anchor%3D%22start%22%20font-family%3D'ui-monospace%2C%20%22Cascadia%20Mono%22%2C%20Consolas%2C%20monospace'%3E%EC%B6%9C%EA%B3%A0%20%EC%8A%A4%ED%85%8C%EC%9D%B4%EC%A7%95%3C%2Ftext%3E%0A%3Cline%20x1%3D%2240%22%20y1%3D%22826%22%20x2%3D%221140%22%20y2%3D%22826%22%20stroke%3D%22%23e8f1ff%22%20stroke-opacity%3D%22.5%22%20stroke-dasharray%3D%224%206%22%2F%3E%0A%3Cline%20x1%3D%221155%22%20y1%3D%2220%22%20x2%3D%221155%22%20y2%3D%22980%22%20stroke%3D%22%23e8f1ff%22%20stroke-opacity%3D%22.35%22%2F%3E%0A%3C%2Fsvg%3E",
    "place": {
      "dock-D1": [
        80,
        860,
        104,
        80
      ],
      "dock-D2": [
        204,
        860,
        104,
        80
      ],
      "dock-D3": [
        328,
        860,
        104,
        80
      ],
      "dock-D4": [
        452,
        860,
        104,
        80
      ],
      "dock-D5": [
        636,
        860,
        104,
        80
      ],
      "dock-D6": [
        760,
        860,
        104,
        80
      ],
      "dock-D7": [
        884,
        860,
        104,
        80
      ],
      "dock-D8": [
        1008,
        860,
        104,
        80
      ],
      "figures-head": [
        1170,
        34,
        400,
        22
      ],
      "figures": [
        1170,
        62,
        400,
        200
      ],
      "flow-head": [
        1170,
        282,
        400,
        22
      ],
      "flow": [
        1170,
        308,
        400,
        250
      ],
      "alerts": [
        1170,
        586,
        400,
        190
      ],
      "title-block": [
        1170,
        800,
        400,
        160
      ],
      "A": [
        120,
        130,
        980,
        64
      ],
      "B": [
        120,
        242,
        980,
        64
      ],
      "C": [
        120,
        354,
        980,
        64
      ],
      "D": [
        120,
        466,
        980,
        64
      ],
      "E": [
        120,
        578,
        980,
        64
      ],
      "F": [
        120,
        690,
        980,
        64
      ]
    }
  }
};

export const warehouseRacks: SamplePack = {
  id: "warehouse-racks",
  title: {
    "ko": "물류센터 랙 점유와 피킹 — 청사진 도면",
    "en": "A distribution centre’s racks and picking — a blueprint"
  },
  field: {
    "ko": "물류·창고",
    "en": "Logistics & warehousing"
  },
  kind: {
    "ko": "창고 평면(컴포넌트 반복)",
    "en": "A warehouse plan (one component, repeated)"
  },
  domain: "logistics",
  styles: [
    "drawing"
  ],
  summary: {
    "ko": "물류센터 보관동을 청사진처럼 — 파란 종이에 흰 선, 기둥 열 번호, 치수선, 구석의 표제란. 랙 줄 여섯이 같은 컴포넌트 하나: 4단 × 12열 빈을 찬 만큼 채우고(막힌 빈은 빗금, 품질 보류는 빨간 테), 컨베이어 레인까지 피킹 선이 시간당 피킹만큼 굵어지며, 레인에 작업자와 대기 줄. 아래 입고·출고 도크 여덟(트럭·적재 진행), 오른쪽에 점유율·빈 로케이션·출고 진행·정확도, 시간대별 입출고, 조치 필요 목록. 예시 데이터입니다.",
    "en": "A distribution centre’s storage hall drawn as a blueprint — white lines on blue paper, the column grid’s bubbles, a dimension line and a title block in the corner. The six rack rows are one component: four levels by twelve bays of bins, each filled as full as it is (blocked bins hatched, bins on quality hold rimmed red), a line to its conveyor lane as thick as the row is being picked, and at the lane who is picking and how many order lines wait. Along the bottom the eight dock doors with their trucks and loading; on the right the hall’s fill, free locations, outbound progress and accuracy, inbound and outbound by the hour, and what needs a hand. Example data."
  },
  connectors: [
    {
      "key": "wms",
      "name": "예시 창고 관리(WMS) API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 물류센터가 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
