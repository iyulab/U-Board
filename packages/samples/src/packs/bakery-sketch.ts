// A neighbourhood bakery's afternoon on the tablet by the kitchen door, drawn as if sketched in pencil in a notebook:
// the shop's plan in wobbly lines — the two deck ovens, the proofer, the mixer and the bench in the kitchen; the counter,
// the display case and the café tables in front — with each oven's and the proofer's card beside it, a dashed line
// from each oven to the case for the batch it is baking, the case's trays with what is left and what has sold out, and
// down the side the day's takings, the loaves sold by the hour and two sticky notes. Hand-drawn: pencil on squared
// paper, a yellow highlighter, red pen for what has run out. No public source carries a bakery's day this way, so the
// values are example data written for the board.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/bakery-sketch.js';

const board: Board = {
  "board": {
    "theme": "light",
    "accent": "#1c64b8"
  },
  "elements": {
    "head": {
      "template": "<header class=\"hd\"><h1>{{name}}</h1><span>{{date}} · {{weather}}</span><time>{{time}}</time></header>",
      "style": ".hd{height:100%;box-sizing:border-box;display:flex;align-items:baseline;gap:22px;font-family:\"Segoe Print\", \"Bradley Hand\", \"Comic Sans MS\", var(--u-widget-font-family), cursive;color:#2f2d2a}\nh1{margin:0;font-size:34px;font-weight:700;letter-spacing:.01em}\nspan{font-size:17px;color:#7a756b}\ntime{margin-left:auto;font-size:30px;font-variant-numeric:tabular-nums;color:#1c64b8}",
      "props": {
        "name": "string",
        "date": "string",
        "time": "string",
        "weather": "string"
      }
    },
    "station": {
      "template": "<section class=\"st {{state}}\" style=\"--tilt: {{tilt}}\"><p class=\"it\">{{item}}</p><p class=\"tm\"><b>{{minutes}}</b>분 남음</p><p class=\"tp\">{{temp}}° / {{target}}°</p></section>",
      "style": ".st{height:100%;box-sizing:border-box;display:grid;align-content:center;gap:2px;padding:8px 14px;background:#fffdf7;border:2px solid #2f2d2a;border-radius:255px 14px 225px 14px / 14px 225px 14px 255px;transform:rotate(calc(var(--tilt) * 1deg));font-family:\"Segoe Print\", \"Bradley Hand\", \"Comic Sans MS\", var(--u-widget-font-family), cursive;color:#2f2d2a;box-shadow:2px 3px 0 rgba(47,45,42,.12)}\np{margin:0}\n.it{font-size:16px;font-weight:700;background:linear-gradient(transparent 55%,#ffe066 55%);justify-self:start}\n.tm{font-size:15px;color:#7a756b}\n.tm b{font-size:30px;color:#1c64b8;font-variant-numeric:tabular-nums}\n.tp{font-size:14px;color:#7a756b}\n.heating .tp{color:#d9480f}\n.idle{opacity:.6}",
      "props": {
        "name": "string",
        "item": "string",
        "temp": "number",
        "target": "number",
        "minutes": "number",
        "state": "string",
        "tilt": "number"
      }
    },
    "trays": {
      "template": "<ul class=\"tr\">{{#items}}<li class=\"{{state}}\"><span>{{name}}</span><b>{{left}}</b></li>{{/items}}</ul>",
      "style": ".tr{height:100%;box-sizing:border-box;margin:0;padding:0;list-style:none;display:grid;grid-template-columns:repeat(3,1fr);gap:6px 10px;align-content:center;font-family:\"Segoe Print\", \"Bradley Hand\", \"Comic Sans MS\", var(--u-widget-font-family), cursive;color:#2f2d2a}\nli{display:flex;align-items:baseline;justify-content:space-between;gap:6px;padding:2px 8px;border-bottom:1.5px dashed #7a756b;white-space:nowrap}\nspan{font-size:14px}\nb{font-size:18px;font-variant-numeric:tabular-nums}\n.low b{color:#d9480f}\n.out{color:#d9480f;text-decoration:line-through 2px #d9480f}",
      "props": {
        "items": "list"
      }
    },
    "seats": {
      "template": "<p class=\"se\"><b>{{taken}}</b> / {{total}}석</p>",
      "style": ".se{margin:0;height:100%;display:flex;align-items:center;font:16px \"Segoe Print\", \"Bradley Hand\", \"Comic Sans MS\", var(--u-widget-font-family), cursive;color:#7a756b}\nb{font-size:26px;color:#1c64b8;margin-right:4px}",
      "props": {
        "taken": "number",
        "total": "number"
      }
    },
    "tally": {
      "template": "<figure class=\"ty\"><b>{{value}}</b><figcaption>{{label}}<small>{{note}}</small></figcaption></figure>",
      "style": ".ty{margin:0;height:100%;box-sizing:border-box;display:grid;align-content:center;justify-items:start;gap:2px;font-family:\"Segoe Print\", \"Bradley Hand\", \"Comic Sans MS\", var(--u-widget-font-family), cursive;color:#2f2d2a}\nb{font-size:46px;line-height:1;padding:4px 14px;border:2px solid #2f2d2a;border-radius:255px 14px 225px 14px / 14px 225px 14px 255px;border-color:#1c64b8;color:#1c64b8;font-variant-numeric:tabular-nums}\nfigcaption{font-size:16px;display:grid}\nsmall{font-size:13px;color:#7a756b}",
      "props": {
        "value": "string",
        "label": "string",
        "note": "string"
      }
    },
    "sticky": {
      "template": "<p class=\"sn {{colour}}\" style=\"--tilt: {{tilt}}\">{{text}}</p>",
      "style": ".sn{margin:0;height:100%;box-sizing:border-box;padding:16px 16px 12px;background:#fff3a3;box-shadow:3px 4px 0 rgba(47,45,42,.15);transform:rotate(calc(var(--tilt) * 1deg));font:16px/1.45 \"Segoe Print\", \"Bradley Hand\", \"Comic Sans MS\", var(--u-widget-font-family), cursive;color:#2f2d2a;word-break:keep-all}\n.pink{background:#ffd6e0}",
      "props": {
        "text": "string",
        "tilt": "number",
        "colour": "string"
      }
    }
  },
  "data": {
    "now": {
      "from": "bakery",
      "path": "/bakery/now",
      "time": "updatedAt",
      "fresh": 900,
      "fields": {
        "name": {},
        "date": {},
        "time": {},
        "weather": {}
      }
    },
    "stations": {
      "from": "bakery",
      "path": "/bakery/stations",
      "list": "/value",
      "key": "id",
      "time": "updatedAt",
      "fresh": 900,
      "fields": {
        "item": {},
        "temp": {},
        "target": {},
        "minutes": {},
        "state": {},
        "next": {}
      }
    },
    "case": {
      "from": "bakery",
      "path": "/bakery/case",
      "time": "updatedAt",
      "fresh": 900,
      "fields": {
        "value": {}
      }
    },
    "cafe": {
      "from": "bakery",
      "path": "/bakery/cafe",
      "time": "updatedAt",
      "fresh": 900,
      "fields": {
        "taken": {},
        "total": {}
      }
    },
    "today": {
      "from": "bakery",
      "path": "/bakery/today",
      "time": "updatedAt",
      "fresh": 900,
      "fields": {
        "takings": {},
        "againstLastWeek": {},
        "loaves": {},
        "soldOut": {}
      }
    },
    "hours": {
      "from": "bakery",
      "path": "/bakery/hours",
      "list": "/value",
      "fresh": 900,
      "answerTime": "/updatedAt"
    },
    "notes": {
      "from": "bakery",
      "path": "/bakery/notes",
      "time": "updatedAt",
      "fresh": 900,
      "fields": {
        "first": {},
        "second": {}
      }
    }
  },
  "parts": {
    "head": {
      "as": "element",
      "element": "head",
      "of": "now",
      "bind": {
        "name": "name",
        "date": "date",
        "time": "time",
        "weather": "weather"
      }
    },
    "station-oven1": {
      "as": "element",
      "element": "station",
      "of": "stations[oven1]",
      "props": {
        "name": "oven1",
        "tilt": -2
      },
      "bind": {
        "item": "item",
        "temp": "temp",
        "target": "target",
        "minutes": "minutes",
        "state": "state"
      }
    },
    "station-oven2": {
      "as": "element",
      "element": "station",
      "of": "stations[oven2]",
      "props": {
        "name": "oven2",
        "tilt": 1.5
      },
      "bind": {
        "item": "item",
        "temp": "temp",
        "target": "target",
        "minutes": "minutes",
        "state": "state"
      }
    },
    "station-proofer": {
      "as": "element",
      "element": "station",
      "of": "stations[proofer]",
      "props": {
        "name": "proofer",
        "tilt": -1
      },
      "bind": {
        "item": "item",
        "temp": "temp",
        "target": "target",
        "minutes": "minutes",
        "state": "state"
      }
    },
    "trays": {
      "as": "element",
      "element": "trays",
      "of": "case",
      "bind": {
        "items": "value"
      }
    },
    "seats": {
      "as": "element",
      "element": "seats",
      "of": "cafe",
      "bind": {
        "taken": "taken",
        "total": "total"
      }
    },
    "takings": {
      "as": "element",
      "element": "tally",
      "of": "today",
      "props": {
        "label": "오늘 매출"
      },
      "bind": {
        "value": "takings",
        "note": "againstLastWeek"
      }
    },
    "loaves": {
      "as": "element",
      "element": "tally",
      "of": "today",
      "props": {
        "label": "나간 빵"
      },
      "bind": {
        "value": "loaves",
        "note": "soldOut"
      }
    },
    "by-hour": {
      "as": "chart.bar",
      "of": "hours",
      "title": "시간대별 판매(개)",
      "x": "hour",
      "y": [
        "bread",
        "drinks"
      ],
      "stack": true,
      "series": [
        {
          "label": "빵",
          "color": "#c08a3e"
        },
        {
          "label": "음료",
          "color": "#8fa9c7"
        }
      ]
    },
    "note-1": {
      "as": "element",
      "element": "sticky",
      "of": "notes",
      "props": {
        "tilt": -3,
        "colour": "yellow"
      },
      "bind": {
        "text": "first"
      }
    },
    "note-2": {
      "as": "element",
      "element": "sticky",
      "of": "notes",
      "props": {
        "tilt": 2.5,
        "colour": "pink"
      },
      "bind": {
        "text": "second"
      }
    }
  },
  "layout": {
    "kind": "canvas",
    "size": [
      1600,
      900
    ],
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221600%22%20height%3D%22900%22%20viewBox%3D%220%200%201600%20900%22%3E%0A%3Crect%20width%3D%221600%22%20height%3D%22900%22%20fill%3D%22%23fbf8f1%22%2F%3E%0A%3Cpath%20d%3D%22M%2020%200%20V%20900%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%2044%200%20V%20900%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%2068%200%20V%20900%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%2092%200%20V%20900%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%20116%200%20V%20900%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%20140%200%20V%20900%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%20164%200%20V%20900%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%20188%200%20V%20900%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%20212%200%20V%20900%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%20236%200%20V%20900%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%20260%200%20V%20900%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%20284%200%20V%20900%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%20308%200%20V%20900%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%20332%200%20V%20900%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%20356%200%20V%20900%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%20380%200%20V%20900%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%20404%200%20V%20900%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%20428%200%20V%20900%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%20452%200%20V%20900%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%20476%200%20V%20900%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%20500%200%20V%20900%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%20524%200%20V%20900%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%20548%200%20V%20900%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%20572%200%20V%20900%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%20596%200%20V%20900%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%20620%200%20V%20900%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%20644%200%20V%20900%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%20668%200%20V%20900%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%20692%200%20V%20900%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%20716%200%20V%20900%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%20740%200%20V%20900%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%20764%200%20V%20900%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%20788%200%20V%20900%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%20812%200%20V%20900%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%20836%200%20V%20900%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%20860%200%20V%20900%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%20884%200%20V%20900%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%20908%200%20V%20900%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%20932%200%20V%20900%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%20956%200%20V%20900%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%20980%200%20V%20900%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%201004%200%20V%20900%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%201028%200%20V%20900%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%201052%200%20V%20900%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%201076%200%20V%20900%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%201100%200%20V%20900%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%201124%200%20V%20900%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%201148%200%20V%20900%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%201172%200%20V%20900%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%201196%200%20V%20900%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%201220%200%20V%20900%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%201244%200%20V%20900%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%201268%200%20V%20900%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%201292%200%20V%20900%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%201316%200%20V%20900%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%201340%200%20V%20900%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%201364%200%20V%20900%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%201388%200%20V%20900%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%201412%200%20V%20900%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%201436%200%20V%20900%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%201460%200%20V%20900%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%201484%200%20V%20900%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%201508%200%20V%20900%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%201532%200%20V%20900%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%201556%200%20V%20900%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%201580%200%20V%20900%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%200%2020%20H%201600%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%200%2044%20H%201600%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%200%2068%20H%201600%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%200%2092%20H%201600%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%200%20116%20H%201600%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%200%20140%20H%201600%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%200%20164%20H%201600%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%200%20188%20H%201600%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%200%20212%20H%201600%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%200%20236%20H%201600%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%200%20260%20H%201600%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%200%20284%20H%201600%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%200%20308%20H%201600%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%200%20332%20H%201600%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%200%20356%20H%201600%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%200%20380%20H%201600%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%200%20404%20H%201600%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%200%20428%20H%201600%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%200%20452%20H%201600%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%200%20476%20H%201600%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%200%20500%20H%201600%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%200%20524%20H%201600%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%200%20548%20H%201600%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%200%20572%20H%201600%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%200%20596%20H%201600%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%200%20620%20H%201600%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%200%20644%20H%201600%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%200%20668%20H%201600%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%200%20692%20H%201600%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%200%20716%20H%201600%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%200%20740%20H%201600%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%200%20764%20H%201600%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%200%20788%20H%201600%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%200%20812%20H%201600%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%200%20836%20H%201600%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%200%20860%20H%201600%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%200%20884%20H%201600%22%20stroke%3D%22%23e6e0d2%22%20stroke-width%3D%221%22%2F%3E%0A%3Cpath%20d%3D%22M%201020%200%20V%20900%22%20stroke%3D%22%23e8b4b4%22%20stroke-width%3D%221.5%22%2F%3E%0A%3Cpath%20d%3D%22M%2058.8%20498.6%20L%2061.4%20437.3%20L%2059.3%20374.6%20L%2059.3%20311.4%20L%2059.3%20245.5%20L%2059.0%20184.7%20L%2058.5%20118.5%20L%20121.2%20120.9%20L%20182.9%20120.1%20L%20245.1%20118.7%20L%20306.6%20121.2%20L%20366.4%20119.2%20L%20429.4%20121.5%20L%20488.9%20119.0%20L%20549.7%20119.2%20L%20612.6%20120.4%20L%20672.3%20121.5%20L%20733.6%20118.8%20L%20797.2%20120.0%20L%20855.9%20118.9%20L%20918.7%20121.4%20L%20979.5%20119.6%20L%20980.9%20181.9%20L%20981.0%20242.3%20L%20981.0%20303.7%20L%20979.9%20367.2%20L%20979.5%20429.6%20L%20981.1%20490.2%20L%20979.4%20550.3%20L%20981.3%20614.7%20L%20980.9%20676.0%20L%20980.5%20736.7%20L%20981.0%20797.7%20L%20980.3%20860.4%20L%20940.7%20859.9%22%20fill%3D%22none%22%20stroke%3D%22%232f2d2a%22%20stroke-width%3D%223.2%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%2061.2%20500.0%20L%2060.4%20436.3%20L%2059.7%20373.3%20L%2061.1%20308.9%20L%2061.0%20245.3%20L%2060.2%20183.7%20L%2061.3%20118.9%20L%20120.9%20118.4%20L%20183.2%20119.2%20L%20242.9%20118.1%20L%20304.2%20120.1%20L%20367.8%20118.8%20L%20426.1%20118.2%20L%20488.8%20120.0%20L%20548.9%20119.3%20L%20610.8%20121.4%20L%20674.1%20120.7%20L%20733.5%20119.3%20L%20795.9%20121.7%20L%20857.2%20118.7%20L%20917.0%20120.1%20L%20981.1%20120.2%20L%20982.0%20179.8%20L%20981.4%20243.1%20L%20978.6%20305.1%20L%20978.6%20367.1%20L%20980.3%20429.8%20L%20979.4%20489.8%20L%20981.8%20552.7%20L%20979.6%20612.4%20L%20978.5%20673.5%20L%20978.1%20735.7%20L%20980.3%20800.1%20L%20980.6%20861.4%20L%20941.6%20858.9%22%20fill%3D%22none%22%20stroke%3D%22%232f2d2a%22%20stroke-width%3D%221.92%22%20opacity%3D%22.55%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%0A%3Cpath%20d%3D%22M%20849.2%20860.7%20L%20789.0%20860.4%20L%20728.2%20859.4%20L%20669.1%20858.5%20L%20606.2%20861.1%20L%20547.1%20859.3%20L%20484.0%20861.4%20L%20424.2%20859.8%20L%20364.4%20859.8%20L%20303.8%20860.9%20L%20243.1%20860.5%20L%20181.2%20861.1%20L%20120.5%20859.3%20L%2061.3%20860.3%20L%2060.1%20802.7%20L%2060.3%20744.9%20L%2060.7%20684.9%20L%2060.5%20629.2%20L%2059.0%20568.9%22%20fill%3D%22none%22%20stroke%3D%22%232f2d2a%22%20stroke-width%3D%223.2%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20851.8%20861.9%20L%20790.0%20858.4%20L%20729.2%20858.4%20L%20667.5%20860.7%20L%20606.7%20858.2%20L%20547.3%20859.0%20L%20484.3%20859.1%20L%20423.5%20859.5%20L%20364.9%20861.1%20L%20305.1%20859.5%20L%20242.8%20861.2%20L%20183.5%20859.1%20L%20122.6%20861.8%20L%2059.6%20858.4%20L%2059.1%20801.2%20L%2061.0%20745.8%20L%2059.8%20685.6%20L%2060.5%20626.7%20L%2061.7%20571.8%22%20fill%3D%22none%22%20stroke%3D%22%232f2d2a%22%20stroke-width%3D%221.92%22%20opacity%3D%22.55%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%0A%3Cpath%20d%3D%22M%20521.5%20118.6%20L%20518.8%20180.8%20L%20518.9%20239.9%20L%20520.9%20298.6%20L%20520.6%20359.7%20L%20520.2%20419.6%22%20fill%3D%22none%22%20stroke%3D%22%232f2d2a%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20519.1%20118.4%20L%20518.1%20182.0%20L%20518.2%20241.6%20L%20521.6%20300.2%20L%20519.7%20359.2%20L%20521.9%20420.3%22%20fill%3D%22none%22%20stroke%3D%22%232f2d2a%22%20stroke-width%3D%221.7999999999999998%22%20opacity%3D%22.55%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20520.4%20510.2%20L%20519.1%20568.9%20L%20519.9%20626.2%20L%20520.3%20684.0%20L%20519.9%20743.7%20L%20520.6%20801.1%20L%20519.7%20860.4%22%20fill%3D%22none%22%20stroke%3D%22%232f2d2a%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20521.6%20509.0%20L%20521.0%20566.4%20L%20521.0%20628.5%20L%20518.5%20687.0%20L%20519.8%20743.7%20L%20521.9%20800.6%20L%20520.3%20860.5%22%20fill%3D%22none%22%20stroke%3D%22%232f2d2a%22%20stroke-width%3D%221.7999999999999998%22%20opacity%3D%22.55%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%0A%3Ctext%20x%3D%22858%22%20y%3D%22882%22%20font-family%3D'%22Segoe%20Print%22%2C%20%22Bradley%20Hand%22%2C%20%22Comic%20Sans%20MS%22%2C%20var(--u-widget-font-family)%2C%20cursive'%20font-size%3D%2215%22%20fill%3D%22%237a756b%22%3E%EC%9E%85%EA%B5%AC%20%E2%86%92%3C%2Ftext%3E%0A%3Ctext%20x%3D%22530%22%20y%3D%22470%22%20font-family%3D'%22Segoe%20Print%22%2C%20%22Bradley%20Hand%22%2C%20%22Comic%20Sans%20MS%22%2C%20var(--u-widget-font-family)%2C%20cursive'%20font-size%3D%2214%22%20fill%3D%22%237a756b%22%3E%E2%86%90%20%EC%A3%BC%EB%B0%A9%EB%AC%B8%3C%2Ftext%3E%0A%3Cpath%20d%3D%22M%2099.2%20169.0%20L%20155.4%20170.8%20L%20213.1%20169.0%20L%20270.7%20171.0%20L%20270.6%20219.3%20L%20270.4%20264.6%20L%20211.9%20266.9%20L%20155.3%20267.3%20L%2098.7%20265.1%20L%20100.4%20218.4%20L%20101.1%20169.4%22%20fill%3D%22none%22%20stroke%3D%22%232f2d2a%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20101.4%20168.3%20L%20157.2%20169.3%20L%20214.1%20171.7%20L%20271.3%20170.9%20L%20268.4%20218.0%20L%20270.6%20266.6%20L%20214.5%20267.5%20L%20157.3%20266.2%20L%20101.0%20267.7%20L%2098.5%20219.9%20L%2098.6%20171.6%22%20fill%3D%22none%22%20stroke%3D%22%232f2d2a%22%20stroke-width%3D%221.2%22%20opacity%3D%22.55%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20111.7%20203.4%20L%20183.7%20203.1%20L%20259.2%20201.2%22%20fill%3D%22none%22%20stroke%3D%22%232f2d2a%22%20stroke-width%3D%221.4%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20112.6%20200.5%20L%20183.0%20200.9%20L%20256.0%20201.8%22%20fill%3D%22none%22%20stroke%3D%22%232f2d2a%22%20stroke-width%3D%220.84%22%20opacity%3D%22.55%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20112.1%20235.0%20L%20185.9%20233.6%20L%20256.7%20232.8%22%20fill%3D%22none%22%20stroke%3D%22%232f2d2a%22%20stroke-width%3D%221.4%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20110.4%20233.6%20L%20183.9%20233.4%20L%20259.9%20235.7%22%20fill%3D%22none%22%20stroke%3D%22%232f2d2a%22%20stroke-width%3D%220.84%22%20opacity%3D%22.55%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%0A%3Cpath%20d%3D%22M%20300.4%20170.4%20L%20358.0%20169.4%20L%20413.0%20169.0%20L%20470.4%20169.7%20L%20469.4%20219.0%20L%20469.1%20266.5%20L%20414.3%20266.1%20L%20355.2%20265.2%20L%20300.8%20265.3%20L%20300.1%20217.5%20L%20300.1%20170.7%22%20fill%3D%22none%22%20stroke%3D%22%232f2d2a%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20298.2%20171.7%20L%20357.6%20168.4%20L%20411.4%20170.5%20L%20469.8%20170.1%20L%20469.0%20218.1%20L%20468.3%20267.9%20L%20414.4%20266.4%20L%20356.9%20267.8%20L%20299.6%20267.8%20L%20301.1%20219.6%20L%20300.1%20168.4%22%20fill%3D%22none%22%20stroke%3D%22%232f2d2a%22%20stroke-width%3D%221.2%22%20opacity%3D%22.55%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20313.2%20202.0%20L%20385.7%20202.0%20L%20457.6%20202.6%22%20fill%3D%22none%22%20stroke%3D%22%232f2d2a%22%20stroke-width%3D%221.4%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20313.6%20203.0%20L%20386.4%20202.1%20L%20458.4%20202.9%22%20fill%3D%22none%22%20stroke%3D%22%232f2d2a%22%20stroke-width%3D%220.84%22%20opacity%3D%22.55%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20311.2%20234.8%20L%20384.1%20234.4%20L%20458.8%20234.2%22%20fill%3D%22none%22%20stroke%3D%22%232f2d2a%22%20stroke-width%3D%221.4%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20311.0%20233.9%20L%20384.5%20233.4%20L%20458.8%20234.2%22%20fill%3D%22none%22%20stroke%3D%22%232f2d2a%22%20stroke-width%3D%220.84%22%20opacity%3D%22.55%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%0A%3Ctext%20x%3D%22104%22%20y%3D%22160%22%20font-family%3D'%22Segoe%20Print%22%2C%20%22Bradley%20Hand%22%2C%20%22Comic%20Sans%20MS%22%2C%20var(--u-widget-font-family)%2C%20cursive'%20font-size%3D%2215%22%20fill%3D%22%237a756b%22%3E%EB%8D%B0%ED%81%AC%20%EC%98%A4%EB%B8%90%201%3C%2Ftext%3E%3Ctext%20x%3D%22304%22%20y%3D%22160%22%20font-family%3D'%22Segoe%20Print%22%2C%20%22Bradley%20Hand%22%2C%20%22Comic%20Sans%20MS%22%2C%20var(--u-widget-font-family)%2C%20cursive'%20font-size%3D%2215%22%20fill%3D%22%237a756b%22%3E%EB%8D%B0%ED%81%AC%20%EC%98%A4%EB%B8%90%202%3C%2Ftext%3E%0A%3Cpath%20d%3D%22M%2099.4%20360.4%20L%20153.9%20359.9%20L%20209.0%20361.3%20L%20209.4%20409.4%20L%20210.9%20460.8%20L%20209.5%20511.4%20L%20154.3%20510.8%20L%20100.4%20510.3%20L%20100.7%20460.0%20L%2099.3%20411.5%20L%2098.6%20360.2%22%20fill%3D%22none%22%20stroke%3D%22%232f2d2a%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%2099.2%20361.6%20L%20153.9%20360.3%20L%20208.5%20358.1%20L%20210.2%20410.2%20L%20209.1%20461.0%20L%20208.4%20511.9%20L%20155.4%20509.1%20L%2099.0%20508.6%20L%2098.2%20458.8%20L%20101.9%20409.1%20L%2099.4%20361.4%22%20fill%3D%22none%22%20stroke%3D%22%232f2d2a%22%20stroke-width%3D%221.2%22%20opacity%3D%22.55%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3Ctext%20x%3D%22104%22%20y%3D%22350%22%20font-family%3D'%22Segoe%20Print%22%2C%20%22Bradley%20Hand%22%2C%20%22Comic%20Sans%20MS%22%2C%20var(--u-widget-font-family)%2C%20cursive'%20font-size%3D%2215%22%20fill%3D%22%237a756b%22%3E%EB%B0%9C%ED%9A%A8%EA%B8%B0%3C%2Ftext%3E%0A%3Cpath%20d%3D%22M%20485.1%20421.4%20L%20478.6%20436.8%20L%20468.5%20446.7%20L%20453.8%20450.2%20L%20440.6%20451.0%20L%20425.8%20448.6%20L%20412.8%20438.9%20L%20407.4%20426.9%20L%20401.6%20411.6%20L%20405.4%20397.2%20L%20410.7%20384.6%20L%20422.3%20373.9%20L%20435.6%20370.2%20L%20451.6%20368.6%20L%20465.5%20374.0%20L%20476.0%20381.8%20L%20483.3%20393.4%20L%20486.4%20409.3%20L%20484.8%20422.3%22%20fill%3D%22none%22%20stroke%3D%22%232f2d2a%22%20stroke-width%3D%221.6%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20485.2%20424.3%20L%20477.6%20436.3%20L%20466.0%20443.7%20L%20455.4%20451.8%20L%20441.7%20453.3%20L%20425.3%20448.1%20L%20413.0%20437.7%20L%20407.6%20424.6%20L%20402.1%20414.0%20L%20405.1%20398.0%20L%20411.2%20386.5%20L%20420.5%20375.4%20L%20436.3%20368.9%20L%20450.0%20369.3%20L%20462.5%20371.8%20L%20474.4%20382.2%20L%20483.4%20392.6%20L%20486.9%20407.7%20L%20484.0%20421.6%22%20fill%3D%22none%22%20stroke%3D%22%232f2d2a%22%20stroke-width%3D%220.96%22%20opacity%3D%22.55%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20459.3%20412.9%20L%20456.8%20419.2%20L%20453.4%20423.0%20L%20447.9%20424.7%20L%20442.0%20424.0%20L%20438.0%20423.5%20L%20436.0%20420.6%20L%20432.7%20414.6%20L%20431.6%20409.5%20L%20431.6%20405.3%20L%20434.3%20401.0%20L%20437.4%20397.7%20L%20441.2%20395.5%20L%20448.1%20395.5%20L%20451.6%20396.9%20L%20455.2%20400.7%20L%20456.9%20404.7%20L%20459.4%20408.8%20L%20459.1%20414.4%22%20fill%3D%22none%22%20stroke%3D%22%232f2d2a%22%20stroke-width%3D%221.6%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20457.7%20416.1%20L%20456.2%20420.1%20L%20453.0%20422.7%20L%20449.1%20425.3%20L%20444.6%20423.2%20L%20436.9%20423.5%20L%20434.4%20419.6%20L%20432.9%20414.0%20L%20430.4%20409.0%20L%20431.4%20404.4%20L%20433.1%20402.6%20L%20438.4%20396.7%20L%20440.8%20396.3%20L%20448.4%20395.4%20L%20453.3%20396.3%20L%20456.3%20401.2%20L%20459.2%20403.5%20L%20458.5%20409.0%20L%20456.5%20414.8%22%20fill%3D%22none%22%20stroke%3D%22%232f2d2a%22%20stroke-width%3D%220.96%22%20opacity%3D%22.55%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3Ctext%20x%3D%22418%22%20y%3D%22474%22%20font-family%3D'%22Segoe%20Print%22%2C%20%22Bradley%20Hand%22%2C%20%22Comic%20Sans%20MS%22%2C%20var(--u-widget-font-family)%2C%20cursive'%20font-size%3D%2215%22%20fill%3D%22%237a756b%22%3E%EB%B0%98%EC%A3%BD%EA%B8%B0%3C%2Ftext%3E%0A%3Cpath%20d%3D%22M%20250.1%20519.6%20L%20306.6%20520.6%20L%20365.4%20520.9%20L%20421.3%20519.6%20L%20480.1%20518.7%20L%20478.6%20603.7%20L%20421.5%20604.9%20L%20365.6%20603.2%20L%20309.0%20604.1%20L%20249.4%20604.9%20L%20250.2%20520.8%22%20fill%3D%22none%22%20stroke%3D%22%232f2d2a%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20249.3%20520.7%20L%20307.9%20520.0%20L%20366.5%20519.9%20L%20421.9%20520.5%20L%20481.8%20520.2%20L%20478.6%20602.4%20L%20423.9%20605.0%20L%20364.6%20603.2%20L%20307.5%20604.6%20L%20249.9%20603.6%20L%20249.9%20520.6%22%20fill%3D%22none%22%20stroke%3D%22%232f2d2a%22%20stroke-width%3D%221.2%22%20opacity%3D%22.55%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3Ctext%20x%3D%22256%22%20y%3D%22622%22%20font-family%3D'%22Segoe%20Print%22%2C%20%22Bradley%20Hand%22%2C%20%22Comic%20Sans%20MS%22%2C%20var(--u-widget-font-family)%2C%20cursive'%20font-size%3D%2215%22%20fill%3D%22%237a756b%22%3E%EC%9E%91%EC%97%85%EB%8C%80%20%E2%80%94%20%EC%84%B1%ED%98%95%3C%2Ftext%3E%0A%3Cpath%20d%3D%22M%20100.5%20640.3%20L%20160.6%20640.2%20L%20221.2%20640.9%20L%20219.7%20704.8%20L%20160.9%20705.0%20L%2098.7%20704.6%20L%20100.4%20641.2%22%20fill%3D%22none%22%20stroke%3D%22%232f2d2a%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20100.3%20640.9%20L%20158.9%20638.2%20L%20220.2%20638.6%20L%20220.5%20702.2%20L%20159.8%20704.5%20L%2098.6%20703.5%20L%20101.7%20640.5%22%20fill%3D%22none%22%20stroke%3D%22%232f2d2a%22%20stroke-width%3D%221.2%22%20opacity%3D%22.55%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20178.9%20677.7%20L%20176.2%20684.4%20L%20169.4%20688.3%20L%20163.9%20692.3%20L%20157.2%20692.2%20L%20150.9%20689.1%20L%20145.2%20685.4%20L%20143.0%20678.3%20L%20139.6%20672.2%20L%20140.2%20666.6%20L%20144.6%20660.5%20L%20150.3%20655.0%20L%20155.5%20651.3%20L%20161.8%20651.7%20L%20168.0%20655.4%20L%20175.0%20659.7%20L%20177.7%20662.8%20L%20179.6%20670.0%20L%20178.9%20677.2%22%20fill%3D%22none%22%20stroke%3D%22%232f2d2a%22%20stroke-width%3D%221.6%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20177.6%20679.1%20L%20177.4%20685.5%20L%20171.7%20689.3%20L%20163.4%20693.3%20L%20157.8%20691.7%20L%20152.5%20690.7%20L%20145.2%20687.5%20L%20142.1%20679.7%20L%20141.7%20674.4%20L%20142.1%20664.9%20L%20142.2%20661.1%20L%20147.8%20656.8%20L%20154.1%20653.3%20L%20162.8%20650.6%20L%20168.7%20652.4%20L%20173.8%20658.5%20L%20178.3%20663.0%20L%20181.9%20669.9%20L%20179.2%20677.4%22%20fill%3D%22none%22%20stroke%3D%22%232f2d2a%22%20stroke-width%3D%220.96%22%20opacity%3D%22.55%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3Ctext%20x%3D%22104%22%20y%3D%22724%22%20font-family%3D'%22Segoe%20Print%22%2C%20%22Bradley%20Hand%22%2C%20%22Comic%20Sans%20MS%22%2C%20var(--u-widget-font-family)%2C%20cursive'%20font-size%3D%2215%22%20fill%3D%22%237a756b%22%3E%EC%8B%B1%ED%81%AC%3C%2Ftext%3E%0A%3Cpath%20d%3D%22M%20300.7%20680.8%20L%20356.6%20679.5%20L%20413.6%20678.9%20L%20468.6%20679.7%20L%20470.5%20746.5%20L%20468.8%20810.0%20L%20412.4%20810.1%20L%20358.1%20811.4%20L%20301.0%20811.0%20L%20298.6%20745.2%20L%20300.4%20679.3%22%20fill%3D%22none%22%20stroke%3D%22%232f2d2a%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20299.1%20681.0%20L%20357.5%20680.1%20L%20412.4%20678.9%20L%20471.0%20681.5%20L%20471.6%20744.2%20L%20471.4%20810.1%20L%20414.7%20809.3%20L%20355.5%20808.5%20L%20298.9%20809.8%20L%20299.8%20743.0%20L%20301.2%20678.3%22%20fill%3D%22none%22%20stroke%3D%22%232f2d2a%22%20stroke-width%3D%221.2%22%20opacity%3D%22.55%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20383.6%20679.2%20L%20386.1%20744.3%20L%20384.8%20811.4%22%20fill%3D%22none%22%20stroke%3D%22%232f2d2a%22%20stroke-width%3D%221.4%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20385.2%20678.6%20L%20385.0%20743.4%20L%20383.7%20810.6%22%20fill%3D%22none%22%20stroke%3D%22%232f2d2a%22%20stroke-width%3D%220.84%22%20opacity%3D%22.55%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3Ctext%20x%3D%22306%22%20y%3D%22830%22%20font-family%3D'%22Segoe%20Print%22%2C%20%22Bradley%20Hand%22%2C%20%22Comic%20Sans%20MS%22%2C%20var(--u-widget-font-family)%2C%20cursive'%20font-size%3D%2215%22%20fill%3D%22%237a756b%22%3E%EB%83%89%EC%9E%A5%EA%B3%A0%3C%2Ftext%3E%0A%3Cpath%20d%3D%22M%20559.2%20158.8%20L%20623.8%20160.1%20L%20687.8%20160.4%20L%20748.6%20159.9%20L%20812.5%20161.3%20L%20876.0%20159.4%20L%20940.0%20158.6%20L%20938.8%20230.8%20L%20875.4%20231.0%20L%20813.8%20229.4%20L%20750.1%20229.5%20L%20687.2%20231.4%20L%20622.5%20231.4%20L%20560.8%20229.3%20L%20558.8%20159.8%22%20fill%3D%22none%22%20stroke%3D%22%232f2d2a%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20558.3%20158.4%20L%20624.1%20161.4%20L%20686.7%20160.1%20L%20751.1%20159.8%20L%20815.2%20161.8%20L%20876.3%20161.5%20L%20939.5%20161.5%20L%20938.4%20229.2%20L%20877.5%20228.6%20L%20814.8%20230.8%20L%20750.7%20229.5%20L%20687.4%20229.0%20L%20621.5%20230.3%20L%20560.1%20230.6%20L%20561.5%20158.8%22%20fill%3D%22none%22%20stroke%3D%22%232f2d2a%22%20stroke-width%3D%221.2%22%20opacity%3D%22.55%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3Ctext%20x%3D%22566%22%20y%3D%22150%22%20font-family%3D'%22Segoe%20Print%22%2C%20%22Bradley%20Hand%22%2C%20%22Comic%20Sans%20MS%22%2C%20var(--u-widget-font-family)%2C%20cursive'%20font-size%3D%2215%22%20fill%3D%22%237a756b%22%3E%EC%B9%B4%EC%9A%B4%ED%84%B0%20%C2%B7%20%EA%B3%84%EC%82%B0%EB%8C%80%3C%2Ftext%3E%0A%3Cpath%20d%3D%22M%20600.5%20301.2%20L%20663.1%20299.6%20L%20727.1%20299.9%20L%20791.5%20299.0%20L%20855.3%20300.9%20L%20921.2%20299.0%20L%20921.2%20343.8%20L%20919.5%20390.6%20L%20857.0%20390.3%20L%20790.5%20389.1%20L%20727.8%20388.9%20L%20664.8%20390.6%20L%20600.0%20389.1%20L%20598.7%20343.7%20L%20599.7%20300.0%22%20fill%3D%22none%22%20stroke%3D%22%232f2d2a%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20601.6%20298.5%20L%20664.9%20300.3%20L%20728.0%20299.1%20L%20790.5%20299.7%20L%20855.2%20300.2%20L%20920.1%20301.8%20L%20920.2%20344.9%20L%20921.9%20389.5%20L%20857.9%20392.0%20L%20793.5%20389.6%20L%20728.1%20389.7%20L%20663.2%20391.0%20L%20601.7%20391.6%20L%20601.1%20346.9%20L%20599.4%20301.1%22%20fill%3D%22none%22%20stroke%3D%22%232f2d2a%22%20stroke-width%3D%221.2%22%20opacity%3D%22.55%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3Ctext%20x%3D%22604%22%20y%3D%22412%22%20font-family%3D'%22Segoe%20Print%22%2C%20%22Bradley%20Hand%22%2C%20%22Comic%20Sans%20MS%22%2C%20var(--u-widget-font-family)%2C%20cursive'%20font-size%3D%2215%22%20fill%3D%22%237a756b%22%3E%EC%A7%84%EC%97%B4%EB%8C%80%3C%2Ftext%3E%0A%3Cpath%20d%3D%22M%20675.0%20570.7%20L%20671.6%20583.7%20L%20659.3%20591.9%20L%20648.7%20596.2%20L%20635.1%20596.9%20L%20621.4%20595.2%20L%20612.9%20585.0%20L%20605.0%20574.7%20L%20603.0%20561.1%20L%20605.1%20548.2%20L%20610.8%20536.6%20L%20618.4%20528.5%20L%20630.4%20521.5%20L%20646.2%20523.5%20L%20658.5%20525.4%20L%20666.4%20532.9%20L%20674.0%20544.1%20L%20679.0%20559.1%20L%20675.4%20571.0%22%20fill%3D%22none%22%20stroke%3D%22%232f2d2a%22%20stroke-width%3D%221.6%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20674.4%20571.0%20L%20669.6%20584.6%20L%20662.3%20590.5%20L%20647.9%20598.5%20L%20635.6%20596.4%20L%20623.6%20595.6%20L%20614.1%20586.3%20L%20604.6%20575.2%20L%20600.2%20561.2%20L%20603.1%20547.5%20L%20608.1%20535.3%20L%20620.2%20526.8%20L%20631.0%20521.1%20L%20645.4%20523.0%20L%20656.2%20524.6%20L%20668.1%20532.4%20L%20673.2%20543.7%20L%20677.0%20558.2%20L%20676.0%20572.2%22%20fill%3D%22none%22%20stroke%3D%22%232f2d2a%22%20stroke-width%3D%220.96%22%20opacity%3D%22.55%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20814.9%20570.1%20L%20809.2%20583.7%20L%20801.7%20593.4%20L%20789.7%20596.1%20L%20774.6%20596.5%20L%20762.3%20594.5%20L%20750.8%20586.5%20L%20745.6%20574.7%20L%20743.1%20562.2%20L%20744.2%20549.5%20L%20749.3%20537.4%20L%20760.7%20527.9%20L%20772.3%20522.8%20L%20785.1%20522.8%20L%20798.6%20524.9%20L%20806.4%20533.5%20L%20815.1%20546.4%20L%20816.9%20559.2%20L%20815.3%20571.7%22%20fill%3D%22none%22%20stroke%3D%22%232f2d2a%22%20stroke-width%3D%221.6%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20815.7%20569.5%20L%20809.2%20584.3%20L%20801.4%20590.9%20L%20788.7%20596.1%20L%20774.8%20596.9%20L%20762.3%20592.5%20L%20750.7%20584.5%20L%20745.6%20574.4%20L%20741.9%20560.3%20L%20742.4%20547.6%20L%20751.6%20537.4%20L%20761.2%20529.3%20L%20771.8%20524.4%20L%20783.5%20521.2%20L%20797.6%20525.4%20L%20807.3%20535.5%20L%20814.0%20546.0%20L%20816.2%20558.2%20L%20816.2%20571.9%22%20fill%3D%22none%22%20stroke%3D%22%232f2d2a%22%20stroke-width%3D%220.96%22%20opacity%3D%22.55%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20957.4%20572.6%20L%20949.2%20582.7%20L%20940.9%20592.3%20L%20927.0%20598.1%20L%20915.3%20596.2%20L%20901.5%20593.6%20L%20892.2%20585.7%20L%20884.8%20575.1%20L%20881.1%20562.6%20L%20883.1%20549.0%20L%20889.0%20538.4%20L%20900.0%20529.4%20L%20911.4%20524.3%20L%20924.4%20522.2%20L%20938.6%20525.1%20L%20948.4%20534.3%20L%20956.0%20546.1%20L%20957.4%20558.0%20L%20957.2%20571.2%22%20fill%3D%22none%22%20stroke%3D%22%232f2d2a%22%20stroke-width%3D%221.6%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20955.5%20570.1%20L%20950.7%20583.8%20L%20940.4%20593.3%20L%20926.9%20596.5%20L%20916.4%20598.6%20L%20901.2%20591.9%20L%20894.1%20587.0%20L%20884.6%20575.5%20L%20883.3%20561.0%20L%20884.0%20548.4%20L%20888.5%20538.9%20L%20899.3%20527.1%20L%20910.3%20522.3%20L%20924.3%20523.1%20L%20938.0%20526.4%20L%20948.5%20534.8%20L%20954.1%20544.1%20L%20959.1%20557.6%20L%20956.9%20569.5%22%20fill%3D%22none%22%20stroke%3D%22%232f2d2a%22%20stroke-width%3D%220.96%22%20opacity%3D%22.55%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20676.2%20740.1%20L%20670.4%20752.3%20L%20660.7%20760.6%20L%20648.0%20767.4%20L%20633.9%20766.4%20L%20621.5%20764.2%20L%20611.7%20754.5%20L%20605.9%20744.2%20L%20603.4%20730.5%20L%20604.5%20718.5%20L%20609.2%20706.8%20L%20619.3%20698.3%20L%20632.4%20693.1%20L%20644.3%20692.7%20L%20656.0%20696.2%20L%20668.4%20704.5%20L%20675.1%20715.4%20L%20678.7%20727.0%20L%20676.1%20740.5%22%20fill%3D%22none%22%20stroke%3D%22%232f2d2a%22%20stroke-width%3D%221.6%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20675.4%20739.8%20L%20670.3%20752.1%20L%20659.4%20761.9%20L%20648.9%20767.7%20L%20633.9%20765.8%20L%20624.4%20764.1%20L%20610.7%20755.5%20L%20605.2%20746.5%20L%20601.4%20732.2%20L%20605.1%20719.7%20L%20611.6%20707.3%20L%20618.9%20697.7%20L%20631.2%20693.9%20L%20646.7%20694.0%20L%20659.0%20696.3%20L%20667.2%20702.4%20L%20676.6%20714.2%20L%20676.9%20727.9%20L%20675.8%20740.0%22%20fill%3D%22none%22%20stroke%3D%22%232f2d2a%22%20stroke-width%3D%220.96%22%20opacity%3D%22.55%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20816.0%20740.4%20L%20810.2%20751.6%20L%20801.5%20762.6%20L%20788.5%20767.2%20L%20775.8%20766.5%20L%20762.4%20764.6%20L%20752.1%20755.7%20L%20746.2%20743.8%20L%20743.0%20730.5%20L%20744.6%20720.1%20L%20750.4%20706.1%20L%20759.7%20699.1%20L%20771.1%20692.7%20L%20784.9%20691.7%20L%20796.5%20695.4%20L%20808.3%20704.8%20L%20816.0%20714.6%20L%20816.5%20729.3%20L%20814.9%20739.9%22%20fill%3D%22none%22%20stroke%3D%22%232f2d2a%22%20stroke-width%3D%221.6%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20816.6%20742.5%20L%20810.9%20754.6%20L%20802.0%20762.5%20L%20788.8%20767.4%20L%20775.9%20766.7%20L%20762.0%20765.5%20L%20753.3%20756.2%20L%20744.6%20745.6%20L%20740.7%20731.1%20L%20745.3%20720.6%20L%20748.8%20707.4%20L%20761.3%20699.1%20L%20771.0%20693.6%20L%20785.2%20692.9%20L%20796.1%20695.9%20L%20806.7%20705.8%20L%20813.8%20716.8%20L%20818.1%20728.6%20L%20815.5%20743.1%22%20fill%3D%22none%22%20stroke%3D%22%232f2d2a%22%20stroke-width%3D%220.96%22%20opacity%3D%22.55%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%0A%3Ctext%20x%3D%22600%22%20y%3D%22806%22%20font-family%3D'%22Segoe%20Print%22%2C%20%22Bradley%20Hand%22%2C%20%22Comic%20Sans%20MS%22%2C%20var(--u-widget-font-family)%2C%20cursive'%20font-size%3D%2215%22%20fill%3D%22%237a756b%22%3E%EC%B9%B4%ED%8E%98%20%EC%9E%90%EB%A6%AC%20%E2%80%94%20%EB%8B%A4%EC%84%AF%20%ED%83%81%EC%9E%90%3C%2Ftext%3E%0A%3C%2Fsvg%3E",
    "place": {
      "head": [
        60,
        30,
        920,
        56
      ],
      "station-oven1": [
        92,
        280,
        168,
        112
      ],
      "station-oven2": [
        310,
        280,
        168,
        112
      ],
      "station-proofer": [
        216,
        396,
        168,
        112
      ],
      "trays": [
        610,
        307,
        300,
        76
      ],
      "seats": [
        820,
        640,
        140,
        40
      ],
      "takings": [
        1052,
        120,
        240,
        120
      ],
      "loaves": [
        1310,
        120,
        240,
        120
      ],
      "by-hour": [
        1044,
        262,
        516,
        300
      ],
      "note-1": [
        1060,
        600,
        230,
        140
      ],
      "note-2": [
        1316,
        620,
        230,
        140
      ]
    },
    "links": {
      "batch-oven1": {
        "from": "station-oven1",
        "to": "trays",
        "label": "{{next}}",
        "tone": "info",
        "of": "stations[oven1]",
        "width": 2,
        "dash": true,
        "arrow": "end",
        "route": "curved"
      },
      "batch-oven2": {
        "from": "station-oven2",
        "to": "trays",
        "label": "{{next}}",
        "tone": "info",
        "of": "stations[oven2]",
        "width": 2,
        "dash": true,
        "arrow": "end",
        "route": "curved"
      }
    }
  }
};

export const bakerySketch: SamplePack = {
  id: "bakery-sketch",
  title: {
    "ko": "동네 빵집의 오후 — 손그림 스케치",
    "en": "A neighbourhood bakery’s afternoon — a pencil sketch"
  },
  field: {
    "ko": "소상공인·외식",
    "en": "Small business & food"
  },
  kind: {
    "ko": "가게 평면 스케치",
    "en": "A sketched shop plan"
  },
  domain: "services",
  styles: [
    "craft"
  ],
  summary: {
    "ko": "주방 문 옆 태블릿에 띄운 동네 빵집의 오후를 공책에 연필로 그린 듯이 — 흔들리는 선으로 그린 가게 평면(데크 오븐 둘·발효기·반죽기·작업대, 카운터·진열대·카페 탁자) 위에 오븐·발효기마다 붙인 카드, 오븐에서 진열대로 다음 판이 언제 나오는지 점선, 진열대 쟁반의 남은 개수와 다 팔린 것엔 빨간 줄. 옆에 오늘 매출과 나간 빵, 시간대별 판매, 포스트잇 메모 둘. 모눈종이에 연필, 노란 형광펜, 빨간 펜. 예시 데이터입니다.",
    "en": "A neighbourhood bakery’s afternoon on the tablet by the kitchen door, drawn as if in pencil in a notebook — the shop’s plan in wobbly lines (two deck ovens, the proofer, the mixer and the bench; the counter, the display case and the café tables), a card taped by each oven and the proofer, a dashed line from each oven to the case saying when the next batch comes out, and the case’s trays with what is left, a red line through what has sold out. Beside it the day’s takings and loaves, sales by the hour and two sticky notes. Pencil on squared paper, a yellow highlighter, red pen. Example data."
  },
  connectors: [
    {
      "key": "bakery",
      "name": "예시 빵집 API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 가게가 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
