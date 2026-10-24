// A theatre's box-office board for tonight's performance, drawn in Art Deco: black and gold, a sunburst in the stage,
// stepped corners, a display face set wide. The house is drawn as its seating plan — the stalls in two rings of three
// blocks fanning out from the stage, the balcony's three blocks behind them, two boxes on each side wall — and each block
// is a shape of its own on the board, filled by how much of it is sold: emerald with seats to spare, copper with a few
// left, crimson sold out. Gold is kept for the ornament. Beside the plan the evening's figures, the week's performances
// and the tickets sold for tonight over the last fortnight. The theatre is made up, so the values are example data.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/theatre-boxoffice.js';

const board: Board = {
  "board": {
    "theme": "dark",
    "accent": "#c9a14a"
  },
  "elements": {
    "house": {
      "template": "<svg class=\"hs\" viewBox=\"0 0 960 510\"><g class=\"{{zones.a.level}}\"><path d=\"M 434 94.4 L 405 210.8 A 310 310 0 0 1 289.1 154.3 L 363 59.7 A 190 190 0 0 0 434 94.4 Z\"/><text x=\"370.4\" y=\"128.7\"><tspan class=\"n\">A</tspan><tspan class=\"v\" x=\"370.4\" dy=\"22\">{{zones.a.left}}</tspan></text></g><g class=\"{{zones.b.level}}\"><path d=\"M 519.5 95.8 L 544.5 213.2 A 310 310 0 0 1 415.5 213.2 L 440.5 95.8 A 190 190 0 0 0 519.5 95.8 Z\"/><text x=\"480\" y=\"154\"><tspan class=\"n\">B</tspan><tspan class=\"v\" x=\"480\" dy=\"22\">{{zones.b.left}}</tspan></text></g><g class=\"{{zones.c.level}}\"><path d=\"M 597 59.7 L 670.9 154.3 A 310 310 0 0 1 555 210.8 L 526 94.4 A 190 190 0 0 0 597 59.7 Z\"/><text x=\"589.6\" y=\"128.7\"><tspan class=\"n\">C</tspan><tspan class=\"v\" x=\"589.6\" dy=\"22\">{{zones.c.left}}</tspan></text></g><g class=\"{{zones.d.level}}\"><path d=\"M 402.6 220.5 L 373.6 336.9 A 440 440 0 0 1 209.1 256.7 L 283 162.2 A 320 320 0 0 0 402.6 220.5 Z\"/><text x=\"313.4\" y=\"245.5\"><tspan class=\"n\">D</tspan><tspan class=\"v\" x=\"313.4\" dy=\"22\">{{zones.d.left}}</tspan></text></g><g class=\"{{zones.e.level}}\"><path d=\"M 546.5 223 L 571.5 340.4 A 440 440 0 0 1 388.5 340.4 L 413.5 223 A 320 320 0 0 0 546.5 223 Z\"/><text x=\"480\" y=\"284\"><tspan class=\"n\">E</tspan><tspan class=\"v\" x=\"480\" dy=\"22\">{{zones.e.left}}</tspan></text></g><g class=\"{{zones.f.level}}\"><path d=\"M 677 162.2 L 750.9 256.7 A 440 440 0 0 1 586.4 336.9 L 557.4 220.5 A 320 320 0 0 0 677 162.2 Z\"/><text x=\"646.6\" y=\"245.5\"><tspan class=\"n\">F</tspan><tspan class=\"v\" x=\"646.6\" dy=\"22\">{{zones.f.left}}</tspan></text></g><g class=\"{{zones.g.level}}\"><path d=\"M 347.7 371.4 L 317.4 477.1 A 590 590 0 0 1 85.2 348.5 L 158.8 266.7 A 480 480 0 0 0 347.7 371.4 Z\"/><text x=\"220.6\" y=\"371.9\"><tspan class=\"n\">2층 G</tspan><tspan class=\"v\" x=\"220.6\" dy=\"22\">{{zones.g.left}}</tspan></text></g><g class=\"{{zones.h.level}}\"><path d=\"M 596.1 375.7 L 622.7 482.5 A 590 590 0 0 1 337.3 482.5 L 363.9 375.7 A 480 480 0 0 0 596.1 375.7 Z\"/><text x=\"480\" y=\"439\"><tspan class=\"n\">2층 H</tspan><tspan class=\"v\" x=\"480\" dy=\"22\">{{zones.h.left}}</tspan></text></g><g class=\"{{zones.i.level}}\"><path d=\"M 801.2 266.7 L 874.8 348.5 A 590 590 0 0 1 642.6 477.1 L 612.3 371.4 A 480 480 0 0 0 801.2 266.7 Z\"/><text x=\"739.4\" y=\"371.9\"><tspan class=\"n\">2층 I</tspan><tspan class=\"v\" x=\"739.4\" dy=\"22\">{{zones.i.left}}</tspan></text></g><g class=\"{{zones.box1.level}}\"><path d=\"M 6 10 h 84 v 96 h -84 Z\"/><text x=\"48\" y=\"52\"><tspan class=\"n\">박스 1</tspan><tspan class=\"v\" x=\"48\" dy=\"22\">{{zones.box1.left}}</tspan></text></g><g class=\"{{zones.box2.level}}\"><path d=\"M 6 120 h 84 v 96 h -84 Z\"/><text x=\"48\" y=\"162\"><tspan class=\"n\">박스 2</tspan><tspan class=\"v\" x=\"48\" dy=\"22\">{{zones.box2.left}}</tspan></text></g><g class=\"{{zones.box3.level}}\"><path d=\"M 870 10 h 84 v 96 h -84 Z\"/><text x=\"912\" y=\"52\"><tspan class=\"n\">박스 3</tspan><tspan class=\"v\" x=\"912\" dy=\"22\">{{zones.box3.left}}</tspan></text></g><g class=\"{{zones.box4.level}}\"><path d=\"M 870 120 h 84 v 96 h -84 Z\"/><text x=\"912\" y=\"162\"><tspan class=\"n\">박스 4</tspan><tspan class=\"v\" x=\"912\" dy=\"22\">{{zones.box4.left}}</tspan></text></g></svg>",
      "style": ".open{--c:#2e9c7c}.few{--c:#d9814a}.sold{--c:#a12a40}\n.hs{display:block;width:100%;height:100%}\npath{fill:var(--c);stroke:#c9a14a;stroke-width:1.5}\ntext{fill:#fff;text-anchor:middle;font-family:\"Josefin Sans\", \"Futura\", \"Century Gothic\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif}\n.n{font-size:17px;font-weight:700;letter-spacing:.12em}\n.v{font-size:14px;fill:rgba(255,255,255,.88)}",
      "props": {
        "zones": "object"
      }
    },
    "legend": {
      "template": "<ul class=\"lg\"><li><i style=\"background:#2e9c7c\"></i>여유</li><li><i style=\"background:#d9814a\"></i>얼마 남지 않음</li><li><i style=\"background:#a12a40\"></i>매진</li></ul>",
      "style": ".lg{height:100%;box-sizing:border-box;margin:0;padding:0;list-style:none;display:flex;justify-content:center;align-items:center;gap:22px;font:600 15px \"Josefin Sans\", \"Futura\", \"Century Gothic\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif;letter-spacing:.06em;color:#efe6d0}\nli{display:flex;align-items:center;gap:8px}\ni{width:18px;height:18px;border:1px solid #c9a14a}"
    },
    "title": {
      "template": "<header class=\"tt\"><svg viewBox=\"0 0 120 60\" aria-hidden=\"true\"><path d=\"M 0 60 A 60 60 0 0 1 120 60\"/><path d=\"M 60 60 L 0 60 M 60 60 L 8 30 M 60 60 L 30 8 M 60 60 L 60 0 M 60 60 L 90 8 M 60 60 L 112 30 M 60 60 L 120 60\"/></svg><h1>{{name}}</h1><p class=\"s\">{{show}}</p><p>{{date}} · <b>{{time}}</b></p></header>",
      "style": ".tt{height:100%;box-sizing:border-box;display:grid;justify-items:center;align-content:center;gap:4px;text-align:center;color:#efe6d0;font-family:\"Josefin Sans\", \"Futura\", \"Century Gothic\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif}\nsvg{width:96px;height:48px;fill:none;stroke:#c9a14a;stroke-width:2}\nh1{margin:4px 0 0;font-family:\"Didot\", \"Bodoni 72\", \"Playfair Display\", \"Noto Serif KR\", serif;font-size:44px;font-weight:700;letter-spacing:.18em;color:#c9a14a}\np{margin:0;font-size:16px;letter-spacing:.14em;color:#9b917c}\n.s{font-size:20px;color:#efe6d0}\nb{color:#efe6d0;font-size:20px}",
      "props": {
        "name": "string",
        "show": "string",
        "date": "string",
        "time": "string"
      }
    },
    "figures": {
      "template": "<dl class=\"fg\">{{#items}}<div><dt>{{label}}</dt><dd>{{value}}</dd><small>{{note}}</small></div>{{/items}}</dl>",
      "style": ".fg{margin:0;height:100%;box-sizing:border-box;display:grid;grid-template-columns:repeat(3,1fr);border-top:1px solid #c9a14a;border-bottom:1px solid #c9a14a;font-family:\"Josefin Sans\", \"Futura\", \"Century Gothic\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif;color:#efe6d0;text-align:center}\ndiv{display:grid;align-content:center;padding:8px 6px;border-right:1px solid rgba(201,161,74,.35)}\ndiv:last-child{border-right:0}\ndt{font-size:13px;letter-spacing:.08em;color:#9b917c}\ndd{margin:4px 0 2px;font-size:34px;font-weight:700;font-variant-numeric:tabular-nums}\nsmall{font-size:12px;color:#9b917c}",
      "props": {
        "items": "list"
      }
    },
    "performances": {
      "template": "<section class=\"pf\"><h3>이번 주 공연</h3><ol>{{#items}}<li class=\"{{level}}\"><span>{{day}}</span><b>{{time}}</b><small>{{note}}</small><em>{{word}}</em></li>{{/items}}</ol></section>",
      "style": ".open{--c:#2e9c7c}.few{--c:#d9814a}.sold{--c:#a12a40}\n.pf{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr;gap:8px;font-family:\"Josefin Sans\", \"Futura\", \"Century Gothic\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif;color:#efe6d0}\nh3{margin:0;font-size:16px;font-weight:700;letter-spacing:.3em;color:#c9a14a;text-align:center}\nol{margin:0;padding:0;list-style:none;display:grid;align-content:start}\nli{display:grid;grid-template-columns:76px 60px 1fr 64px;gap:10px;align-items:center;padding:7px 0;border-bottom:1px solid rgba(201,161,74,.25);font-size:15px}\nspan{color:#9b917c}\nb{font-size:18px;font-variant-numeric:tabular-nums}\nsmall{font-size:13px;color:#9b917c}\nem{font-style:normal;font-weight:700;text-align:center;padding:2px 0;background:var(--c);color:#fff}",
      "props": {
        "items": "list"
      }
    }
  },
  "data": {
    "zones": {
      "from": "theatre",
      "path": "/theatre/zones",
      "time": "updatedAt",
      "fresh": 900,
      "fields": {
        "value": {}
      }
    },
    "now": {
      "from": "theatre",
      "path": "/theatre/now",
      "time": "updatedAt",
      "fresh": 900,
      "fields": {
        "name": {},
        "show": {},
        "date": {},
        "time": {}
      }
    },
    "figures": {
      "from": "theatre",
      "path": "/theatre/figures",
      "time": "updatedAt",
      "fresh": 900,
      "fields": {
        "value": {}
      }
    },
    "performances": {
      "from": "theatre",
      "path": "/theatre/performances",
      "time": "updatedAt",
      "fresh": 900,
      "fields": {
        "value": {}
      }
    },
    "sales": {
      "from": "theatre",
      "path": "/theatre/sales",
      "list": "/value",
      "fresh": 900,
      "answerTime": "/updatedAt"
    }
  },
  "parts": {
    "house": {
      "as": "element",
      "element": "house",
      "of": "zones",
      "bind": {
        "zones": "value"
      }
    },
    "legend": {
      "as": "element",
      "element": "legend"
    },
    "title": {
      "as": "element",
      "element": "title",
      "of": "now",
      "bind": {
        "name": "name",
        "show": "show",
        "date": "date",
        "time": "time"
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
    "performances": {
      "as": "element",
      "element": "performances",
      "of": "performances",
      "bind": {
        "items": "value"
      }
    },
    "sales": {
      "as": "chart.line",
      "of": "sales",
      "title": "오늘 19:30 회차 — 누적 판매(석)",
      "x": "day",
      "y": "sold",
      "series": [
        {
          "label": "누적 판매",
          "color": "#c9a14a"
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
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221600%22%20height%3D%221000%22%20viewBox%3D%220%200%201600%201000%22%3E%0A%3Crect%20width%3D%221600%22%20height%3D%221000%22%20fill%3D%22%230e0d0b%22%2F%3E%0A%3Crect%20x%3D%2220%22%20y%3D%2220%22%20width%3D%221060%22%20height%3D%22960%22%20fill%3D%22none%22%20stroke%3D%22%23c9a14a%22%20stroke-width%3D%222%22%2F%3E%0A%3Crect%20x%3D%2228%22%20y%3D%2228%22%20width%3D%221044%22%20height%3D%22944%22%20fill%3D%22none%22%20stroke%3D%22%23c9a14a%22%20stroke-opacity%3D%22.5%22%20stroke-width%3D%221%22%2F%3E%0A%3Cpath%20d%3D%22M%2040%20100%20V%2040%20H%20100%22%20fill%3D%22none%22%20stroke%3D%22%23c9a14a%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M%2050%2090%20V%2050%20H%2090%22%20fill%3D%22none%22%20stroke%3D%22%23c9a14a%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M%2060%2080%20V%2060%20H%2080%22%20fill%3D%22none%22%20stroke%3D%22%23c9a14a%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M%201060%20100%20V%2040%20H%201000%22%20fill%3D%22none%22%20stroke%3D%22%23c9a14a%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M%201050%2090%20V%2050%20H%201010%22%20fill%3D%22none%22%20stroke%3D%22%23c9a14a%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M%201040%2080%20V%2060%20H%201020%22%20fill%3D%22none%22%20stroke%3D%22%23c9a14a%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M%2040%20900%20V%20960%20H%20100%22%20fill%3D%22none%22%20stroke%3D%22%23c9a14a%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M%2050%20910%20V%20950%20H%2090%22%20fill%3D%22none%22%20stroke%3D%22%23c9a14a%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M%2060%20920%20V%20940%20H%2080%22%20fill%3D%22none%22%20stroke%3D%22%23c9a14a%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M%201060%20900%20V%20960%20H%201000%22%20fill%3D%22none%22%20stroke%3D%22%23c9a14a%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M%201050%20910%20V%20950%20H%201010%22%20fill%3D%22none%22%20stroke%3D%22%23c9a14a%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M%201040%20920%20V%20940%20H%201020%22%20fill%3D%22none%22%20stroke%3D%22%23c9a14a%22%20stroke-width%3D%222%22%2F%3E%0A%3Cpath%20d%3D%22M%20420%20200%20A%20140%20140%200%200%201%20700%20200%20Z%22%20fill%3D%22%232b2416%22%2F%3E%0A%3Cline%20x1%3D%22560%22%20y1%3D%22200%22%20x2%3D%22422.1%22%20y2%3D%22175.7%22%20stroke%3D%22%23c9a14a%22%20stroke-opacity%3D%22.45%22%20stroke-width%3D%222%22%2F%3E%3Cline%20x1%3D%22560%22%20y1%3D%22200%22%20x2%3D%22428.4%22%20y2%3D%22152.1%22%20stroke%3D%22%23c9a14a%22%20stroke-opacity%3D%22.45%22%20stroke-width%3D%222%22%2F%3E%3Cline%20x1%3D%22560%22%20y1%3D%22200%22%20x2%3D%22438.8%22%20y2%3D%22130%22%20stroke%3D%22%23c9a14a%22%20stroke-opacity%3D%22.45%22%20stroke-width%3D%222%22%2F%3E%3Cline%20x1%3D%22560%22%20y1%3D%22200%22%20x2%3D%22452.8%22%20y2%3D%22110%22%20stroke%3D%22%23c9a14a%22%20stroke-opacity%3D%22.45%22%20stroke-width%3D%222%22%2F%3E%3Cline%20x1%3D%22560%22%20y1%3D%22200%22%20x2%3D%22470%22%20y2%3D%2292.8%22%20stroke%3D%22%23c9a14a%22%20stroke-opacity%3D%22.45%22%20stroke-width%3D%222%22%2F%3E%3Cline%20x1%3D%22560%22%20y1%3D%22200%22%20x2%3D%22490%22%20y2%3D%2278.8%22%20stroke%3D%22%23c9a14a%22%20stroke-opacity%3D%22.45%22%20stroke-width%3D%222%22%2F%3E%3Cline%20x1%3D%22560%22%20y1%3D%22200%22%20x2%3D%22512.1%22%20y2%3D%2268.4%22%20stroke%3D%22%23c9a14a%22%20stroke-opacity%3D%22.45%22%20stroke-width%3D%222%22%2F%3E%3Cline%20x1%3D%22560%22%20y1%3D%22200%22%20x2%3D%22535.7%22%20y2%3D%2262.1%22%20stroke%3D%22%23c9a14a%22%20stroke-opacity%3D%22.45%22%20stroke-width%3D%222%22%2F%3E%3Cline%20x1%3D%22560%22%20y1%3D%22200%22%20x2%3D%22560%22%20y2%3D%2260%22%20stroke%3D%22%23c9a14a%22%20stroke-opacity%3D%22.45%22%20stroke-width%3D%222%22%2F%3E%3Cline%20x1%3D%22560%22%20y1%3D%22200%22%20x2%3D%22584.3%22%20y2%3D%2262.1%22%20stroke%3D%22%23c9a14a%22%20stroke-opacity%3D%22.45%22%20stroke-width%3D%222%22%2F%3E%3Cline%20x1%3D%22560%22%20y1%3D%22200%22%20x2%3D%22607.9%22%20y2%3D%2268.4%22%20stroke%3D%22%23c9a14a%22%20stroke-opacity%3D%22.45%22%20stroke-width%3D%222%22%2F%3E%3Cline%20x1%3D%22560%22%20y1%3D%22200%22%20x2%3D%22630%22%20y2%3D%2278.8%22%20stroke%3D%22%23c9a14a%22%20stroke-opacity%3D%22.45%22%20stroke-width%3D%222%22%2F%3E%3Cline%20x1%3D%22560%22%20y1%3D%22200%22%20x2%3D%22650%22%20y2%3D%2292.8%22%20stroke%3D%22%23c9a14a%22%20stroke-opacity%3D%22.45%22%20stroke-width%3D%222%22%2F%3E%3Cline%20x1%3D%22560%22%20y1%3D%22200%22%20x2%3D%22667.2%22%20y2%3D%22110%22%20stroke%3D%22%23c9a14a%22%20stroke-opacity%3D%22.45%22%20stroke-width%3D%222%22%2F%3E%3Cline%20x1%3D%22560%22%20y1%3D%22200%22%20x2%3D%22681.2%22%20y2%3D%22130%22%20stroke%3D%22%23c9a14a%22%20stroke-opacity%3D%22.45%22%20stroke-width%3D%222%22%2F%3E%3Cline%20x1%3D%22560%22%20y1%3D%22200%22%20x2%3D%22691.6%22%20y2%3D%22152.1%22%20stroke%3D%22%23c9a14a%22%20stroke-opacity%3D%22.45%22%20stroke-width%3D%222%22%2F%3E%3Cline%20x1%3D%22560%22%20y1%3D%22200%22%20x2%3D%22697.9%22%20y2%3D%22175.7%22%20stroke%3D%22%23c9a14a%22%20stroke-opacity%3D%22.45%22%20stroke-width%3D%222%22%2F%3E%0A%3Cpath%20d%3D%22M%20420%20200%20A%20140%20140%200%200%201%20700%20200%20Z%22%20fill%3D%22none%22%20stroke%3D%22%23c9a14a%22%20stroke-width%3D%223%22%2F%3E%0A%3Cline%20x1%3D%22360%22%20y1%3D%22200%22%20x2%3D%22760%22%20y2%3D%22200%22%20stroke%3D%22%23c9a14a%22%20stroke-width%3D%224%22%2F%3E%0A%3Ctext%20x%3D%22560%22%20y%3D%22182%22%20fill%3D%22%23efe6d0%22%20font-size%3D%2220%22%20font-weight%3D%22700%22%20letter-spacing%3D%2210%22%20text-anchor%3D%22middle%22%20font-family%3D'%22Josefin%20Sans%22%2C%20%22Futura%22%2C%20%22Century%20Gothic%22%2C%20%22Noto%20Sans%20KR%22%2C%20%22Malgun%20Gothic%22%2C%20sans-serif'%3E%EB%AC%B4%EB%8C%80%3C%2Ftext%3E%0A%3Ctext%20x%3D%22560%22%20y%3D%22905%22%20fill%3D%22%239b917c%22%20font-size%3D%2216%22%20letter-spacing%3D%228%22%20text-anchor%3D%22middle%22%20font-family%3D'%22Josefin%20Sans%22%2C%20%22Futura%22%2C%20%22Century%20Gothic%22%2C%20%22Noto%20Sans%20KR%22%2C%20%22Malgun%20Gothic%22%2C%20sans-serif'%3E%EB%A1%9C%EB%B9%84%20%C2%B7%20%EB%A7%A4%ED%91%9C%EC%86%8C%3C%2Ftext%3E%0A%3Cpath%20d%3D%22M%20470%20880%20L%20560%20850%20L%20650%20880%22%20fill%3D%22none%22%20stroke%3D%22%23c9a14a%22%20stroke-width%3D%222%22%2F%3E%0A%3Cpath%20d%3D%22M%20500%20892%20L%20560%20872%20L%20620%20892%22%20fill%3D%22none%22%20stroke%3D%22%23c9a14a%22%20stroke-width%3D%222%22%2F%3E%0A%3Cline%20x1%3D%221100%22%20y1%3D%2240%22%20x2%3D%221100%22%20y2%3D%22960%22%20stroke%3D%22%23c9a14a%22%20stroke-width%3D%221%22%2F%3E%0A%3C%2Fsvg%3E",
    "place": {
      "house": [
        80,
        290,
        960,
        510
      ],
      "legend": [
        330,
        930,
        460,
        30
      ],
      "title": [
        1120,
        30,
        460,
        190
      ],
      "figures": [
        1120,
        236,
        460,
        120
      ],
      "performances": [
        1120,
        376,
        460,
        300
      ],
      "sales": [
        1120,
        690,
        460,
        270
      ]
    }
  }
};

export const theatreBoxoffice: SamplePack = {
  id: "theatre-boxoffice",
  title: {
    "ko": "공연장 예매 현황 — 아르데코",
    "en": "A theatre’s box office — in Art Deco"
  },
  field: {
    "ko": "공연·예매",
    "en": "Performing arts & ticketing"
  },
  kind: {
    "ko": "구역마다 칠한 객석 배치도",
    "en": "A seating plan, each block filled by its sales"
  },
  domain: "leisure",
  styles: [
    "art"
  ],
  summary: {
    "ko": "극장 매표소의 오늘 저녁 공연 판매 현황을 아르데코로 — 검정과 금, 무대 안의 햇살 무늬, 계단식 모서리, 넓게 띄운 제목 글꼴. 객석 배치도(1층 두 겹 여섯 구역, 2층 세 구역, 양쪽 벽 박스석 넷)의 구역마다 제 모양의 면을 판매 정도로 칠함: 에메랄드 여유, 구리색 얼마 남지 않음, 진홍 매진 — 금색은 장식에만. 오른쪽에 오늘 판매·현장 대기·취소표 알림, 이번 주 공연별 판매, 오늘 회차의 2주 누적 판매. 극장은 지어낸 것이라 예시 데이터입니다.",
    "en": "A theatre’s box-office board for tonight’s performance in Art Deco — black and gold, a sunburst in the stage, stepped corners, a display face set wide. On the seating plan (the stalls’ six blocks in two rings, the balcony’s three, two boxes on each side wall) each block is a shape of its own, filled by how much of it is sold: emerald with seats to spare, copper with a few left, crimson sold out — gold is kept for the ornament. On the right tonight’s sales, the queue for returns and the waiting list, the week’s performances with how much of each is sold, and tonight’s tickets sold over the last fortnight. The theatre is made up. Example data."
  },
  connectors: [
    {
      "key": "theatre",
      "name": "예시 공연장 예매 API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 공연장이 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
