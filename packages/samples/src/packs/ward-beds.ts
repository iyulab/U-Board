// The bed board on the wall of a hospital ward's nurse station, set in the Swiss style: white paper, black type
// in a heavy grotesque, one red, everything on a strict grid. The ward's plan — eight rooms either side of the
// corridor, an isolation room, the station — with every bed one component: its number, who is in it (masked), the
// day of their stay, and its state in black, red, grey or outline. On the right the census in very large figures,
// today's admissions and discharges, the staffing, the week's occupancy and who is coming up from the emergency
// room. No public source carries a ward's beds, so the values are example data written for it.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/ward-beds.js';

const board: Board = {
  "board": {
    "theme": "light",
    "accent": "#e3001b"
  },
  "presets": {
    "bed": {
      "as": "group",
      "size": [
        104,
        112
      ],
      "parts": {
        "bed": {
          "as": "element",
          "element": "bed",
          "bind": {
            "state": "state",
            "who": "who",
            "day": "day",
            "note": "note",
            "fall": "fall",
            "no": "id"
          }
        }
      },
      "place": {
        "bed": [
          0,
          0,
          104,
          112
        ]
      }
    }
  },
  "elements": {
    "masthead": {
      "template": "<header class=\"ms\"><h1>{{ward}}</h1><p>{{hospital}}</p><time><b>{{time}}</b>{{date}}</time></header>",
      "style": ".ms{height:100%;box-sizing:border-box;display:grid;grid-template-columns:auto 1fr auto;align-items:end;gap:24px;font-family:\"Helvetica Neue\", Helvetica, Arial, sans-serif;color:#111111}\nh1{margin:0;font-size:56px;line-height:.9;font-weight:800;letter-spacing:-.02em}\np{margin:0 0 4px;font-size:18px;color:#8a8a8a}\ntime{display:grid;justify-items:end;font-size:16px;color:#8a8a8a}\nb{font-size:44px;line-height:1;font-weight:800;color:#111111;font-variant-numeric:tabular-nums}",
      "props": {
        "ward": "string",
        "hospital": "string",
        "date": "string",
        "time": "string"
      }
    },
    "legend": {
      "template": "<ul class=\"lg\"><li><i class=\"in\"></i>재원</li><li><i class=\"out\"></i>오늘 퇴원</li><li><i class=\"cl\"></i>청소 중</li><li><i class=\"fr\"></i>빈 병상</li><li><i class=\"co\"></i>입원 예정</li><li><i class=\"is\"></i>격리</li></ul>",
      "style": ".lg{height:100%;box-sizing:border-box;margin:0;padding:0;list-style:none;display:flex;align-items:center;gap:18px;font:600 14px \"Helvetica Neue\", Helvetica, Arial, sans-serif;color:#111111}\nli{display:flex;align-items:center;gap:6px;white-space:nowrap}\ni{width:16px;height:16px;background:#111111}\n.out{background:#e3001b}.cl{background:repeating-linear-gradient(135deg,#d4d4d4 0 3px,#f4f4f4 3px 6px)}\n.fr{background:#fff;outline:2px solid #111111;outline-offset:-2px}.co{background:#fff;outline:2px dashed #e3001b;outline-offset:-2px}\n.is{background:#fff;outline:4px solid #e3001b;outline-offset:-4px}"
    },
    "census": {
      "template": "<section class=\"cs\"><p class=\"big\"><b>{{filled}}</b><span>/{{total}}</span><em>재원 {{rate}}%</em></p><dl>{{#parts}}<div class=\"{{#red}}red{{/red}}\"><dt>{{label}}</dt><dd>{{value}}</dd></div>{{/parts}}</dl></section>",
      "style": ".cs{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr;gap:12px;font-family:\"Helvetica Neue\", Helvetica, Arial, sans-serif;color:#111111}\n.big{margin:0;display:flex;align-items:baseline;gap:6px}\n.big b{font-size:132px;line-height:.8;font-weight:800;letter-spacing:-.05em;font-variant-numeric:tabular-nums}\n.big span{font-size:44px;font-weight:800;color:#8a8a8a}\n.big em{font-style:normal;margin-left:auto;font-size:18px;font-weight:700}\ndl{margin:0;display:grid;grid-template-columns:repeat(3,1fr);border-top:2px solid #111111}\ndiv{padding:8px 0 0;border-right:1px solid #d4d4d4;padding-left:10px}\ndiv:first-child{padding-left:0}\ndt{font-size:13px;color:#8a8a8a}\ndd{margin:0;font-size:36px;font-weight:800;font-variant-numeric:tabular-nums}\n.red dd{color:#e3001b}",
      "props": {
        "filled": "number",
        "total": "number",
        "rate": "number",
        "parts": "list"
      }
    },
    "heading": {
      "template": "<h2 class=\"hd\">{{text}}<small>{{note}}</small></h2>",
      "style": ".hd{margin:0;height:100%;box-sizing:border-box;display:flex;align-items:end;justify-content:space-between;gap:12px;border-bottom:2px solid #111111;padding-bottom:4px;font:800 17px \"Helvetica Neue\", Helvetica, Arial, sans-serif;color:#111111}\nsmall{font-size:13px;font-weight:500;color:#8a8a8a}",
      "props": {
        "text": "string",
        "note": "string"
      }
    },
    "coming": {
      "template": "<ol class=\"cm\">{{#items}}<li><b>{{when}}</b><span>{{from}} · {{who}}</span><em>{{bed}}</em></li>{{/items}}</ol>",
      "style": ".cm{height:100%;box-sizing:border-box;margin:0;padding:0;list-style:none;display:grid;align-content:start;font-family:\"Helvetica Neue\", Helvetica, Arial, sans-serif;color:#111111}\nli{display:grid;grid-template-columns:64px 1fr auto;gap:12px;align-items:baseline;padding:7px 0;border-bottom:1px solid #d4d4d4;font-size:15px}\nb{font-size:18px;font-weight:800;font-variant-numeric:tabular-nums}\nem{font-style:normal;font-weight:800;color:#e3001b}",
      "props": {
        "items": "list"
      }
    },
    "bed": {
      "template": "<article class=\"bed {{state}}\"><header><b>{{no}}</b>{{#fall}}<i>낙상</i>{{/fall}}</header><span>{{who}}</span><em>{{day}}</em><small>{{note}}</small></article>",
      "style": ".bed{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto auto 1fr auto;padding:8px 9px;font-family:\"Helvetica Neue\", Helvetica, Arial, sans-serif;background:#111111;color:#fff;overflow:hidden}\nheader{display:flex;justify-content:space-between;align-items:center;gap:4px;white-space:nowrap}\nb{font-size:22px;font-weight:800;letter-spacing:-.02em}\ni{flex:none;font-style:normal;font-size:10px;font-weight:700;padding:1px 4px;background:#fff;color:#111111}\nspan{font-size:15px;font-weight:700;margin-top:2px}\nem{font-style:normal;font-size:13px;opacity:.75}\nsmall{font-size:12px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n.out-today{background:#e3001b}\n.cleaning{background:repeating-linear-gradient(135deg,#d4d4d4 0 6px,#f4f4f4 6px 12px);color:#111111}\n.free{background:#fff;color:#111111;outline:2px solid #111111;outline-offset:-2px}\n.free span,.cleaning span{color:#8a8a8a}\n.isolation{outline:5px solid #e3001b;outline-offset:-5px;padding:10px 12px}\n.coming{background:#fff;color:#e3001b;outline:2px dashed #e3001b;outline-offset:-2px}",
      "props": {
        "no": "string",
        "state": "string",
        "who": "string",
        "day": "string",
        "note": "string",
        "fall": "boolean"
      }
    }
  },
  "data": {
    "now": {
      "from": "ward",
      "path": "/ward/now",
      "time": "updatedAt",
      "fresh": 600,
      "fields": {
        "ward": {},
        "hospital": {},
        "date": {},
        "time": {}
      }
    },
    "census": {
      "from": "ward",
      "path": "/ward/census",
      "time": "updatedAt",
      "fresh": 600,
      "fields": {
        "filled": {},
        "total": {},
        "rate": {},
        "parts": {}
      }
    },
    "week": {
      "from": "ward",
      "path": "/ward/week",
      "list": "/value",
      "fresh": 600,
      "answerTime": "/updatedAt"
    },
    "coming": {
      "from": "ward",
      "path": "/ward/coming",
      "time": "updatedAt",
      "fresh": 600,
      "fields": {
        "note": {},
        "value": {}
      }
    },
    "beds": {
      "from": "ward",
      "path": "/ward/beds",
      "list": "/value",
      "key": "id",
      "time": "updatedAt",
      "fresh": 600,
      "fields": {
        "state": {},
        "who": {},
        "day": {},
        "note": {},
        "fall": {},
        "id": {}
      }
    }
  },
  "parts": {
    "masthead": {
      "as": "element",
      "element": "masthead",
      "of": "now",
      "bind": {
        "ward": "ward",
        "hospital": "hospital",
        "date": "date",
        "time": "time"
      }
    },
    "legend": {
      "as": "element",
      "element": "legend"
    },
    "census": {
      "as": "element",
      "element": "census",
      "of": "census",
      "bind": {
        "filled": "filled",
        "total": "total",
        "rate": "rate",
        "parts": "parts"
      }
    },
    "week-head": {
      "as": "element",
      "element": "heading",
      "props": {
        "text": "이번 주 재원율",
        "note": "정원 22병상 · %"
      }
    },
    "week": {
      "as": "chart.bar",
      "of": "week",
      "x": "day",
      "y": "rate",
      "series": [
        {
          "label": "재원율(%)",
          "color": "#111111"
        }
      ]
    },
    "coming-head": {
      "as": "element",
      "element": "heading",
      "of": "coming",
      "props": {
        "text": "올라올 환자"
      },
      "bind": {
        "note": "note"
      }
    },
    "coming": {
      "as": "element",
      "element": "coming",
      "of": "coming",
      "bind": {
        "items": "value"
      }
    },
    "bed-701-1": {
      "use": "bed",
      "of": "beds[701-1]"
    },
    "bed-701-2": {
      "use": "bed",
      "of": "beds[701-2]"
    },
    "bed-701-3": {
      "use": "bed",
      "of": "beds[701-3]"
    },
    "bed-701-4": {
      "use": "bed",
      "of": "beds[701-4]"
    },
    "bed-702-1": {
      "use": "bed",
      "of": "beds[702-1]"
    },
    "bed-702-2": {
      "use": "bed",
      "of": "beds[702-2]"
    },
    "bed-702-3": {
      "use": "bed",
      "of": "beds[702-3]"
    },
    "bed-702-4": {
      "use": "bed",
      "of": "beds[702-4]"
    },
    "bed-703-1": {
      "use": "bed",
      "of": "beds[703-1]"
    },
    "bed-703-2": {
      "use": "bed",
      "of": "beds[703-2]"
    },
    "bed-704-1": {
      "use": "bed",
      "of": "beds[704-1]"
    },
    "bed-705-1": {
      "use": "bed",
      "of": "beds[705-1]"
    },
    "bed-706-1": {
      "use": "bed",
      "of": "beds[706-1]"
    },
    "bed-706-2": {
      "use": "bed",
      "of": "beds[706-2]"
    },
    "bed-706-3": {
      "use": "bed",
      "of": "beds[706-3]"
    },
    "bed-706-4": {
      "use": "bed",
      "of": "beds[706-4]"
    },
    "bed-707-1": {
      "use": "bed",
      "of": "beds[707-1]"
    },
    "bed-707-2": {
      "use": "bed",
      "of": "beds[707-2]"
    },
    "bed-707-3": {
      "use": "bed",
      "of": "beds[707-3]"
    },
    "bed-707-4": {
      "use": "bed",
      "of": "beds[707-4]"
    },
    "bed-708-1": {
      "use": "bed",
      "of": "beds[708-1]"
    },
    "bed-708-2": {
      "use": "bed",
      "of": "beds[708-2]"
    }
  },
  "layout": {
    "kind": "canvas",
    "size": [
      1600,
      900
    ],
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221600%22%20height%3D%22900%22%20viewBox%3D%220%200%201600%20900%22%3E%0A%3Crect%20width%3D%221600%22%20height%3D%22900%22%20fill%3D%22%23ffffff%22%2F%3E%0A%3Crect%20x%3D%2240%22%20y%3D%2240%22%20width%3D%2264%22%20height%3D%2264%22%20fill%3D%22%23e3001b%22%2F%3E%0A%3Cpath%20d%3D%22M%2064%2048%20h%2016%20v%2016%20h%2016%20v%2016%20h%20-16%20v%2016%20h%20-16%20v%20-16%20h%20-16%20v%20-16%20h%2016%20Z%22%20fill%3D%22%23ffffff%22%2F%3E%0A%3Cline%20x1%3D%2240%22%20y1%3D%22128%22%20x2%3D%221560%22%20y2%3D%22128%22%20stroke%3D%22%23111111%22%20stroke-width%3D%224%22%2F%3E%0A%3Crect%20x%3D%2240%22%20y%3D%22150%22%20width%3D%22250%22%20height%3D%22290%22%20fill%3D%22none%22%20stroke%3D%22%23111111%22%20stroke-width%3D%222%22%2F%3E%3Ctext%20x%3D%2252%22%20y%3D%22180%22%20fill%3D%22%23111111%22%20font-size%3D%2222%22%20font-weight%3D%22700%22%20text-anchor%3D%22start%22%20font-family%3D'%22Helvetica%20Neue%22%2C%20Helvetica%2C%20Arial%2C%20sans-serif'%3E701%3C%2Ftext%3E%3Ctext%20x%3D%22280%22%20y%3D%22178%22%20fill%3D%22%238a8a8a%22%20font-size%3D%2213%22%20font-weight%3D%22500%22%20text-anchor%3D%22end%22%20font-family%3D'%22Helvetica%20Neue%22%2C%20Helvetica%2C%20Arial%2C%20sans-serif'%3E4%EC%9D%B8%EC%8B%A4%3C%2Ftext%3E%0A%3Crect%20x%3D%22290%22%20y%3D%22150%22%20width%3D%22250%22%20height%3D%22290%22%20fill%3D%22none%22%20stroke%3D%22%23111111%22%20stroke-width%3D%222%22%2F%3E%3Ctext%20x%3D%22302%22%20y%3D%22180%22%20fill%3D%22%23111111%22%20font-size%3D%2222%22%20font-weight%3D%22700%22%20text-anchor%3D%22start%22%20font-family%3D'%22Helvetica%20Neue%22%2C%20Helvetica%2C%20Arial%2C%20sans-serif'%3E702%3C%2Ftext%3E%3Ctext%20x%3D%22530%22%20y%3D%22178%22%20fill%3D%22%238a8a8a%22%20font-size%3D%2213%22%20font-weight%3D%22500%22%20text-anchor%3D%22end%22%20font-family%3D'%22Helvetica%20Neue%22%2C%20Helvetica%2C%20Arial%2C%20sans-serif'%3E4%EC%9D%B8%EC%8B%A4%3C%2Ftext%3E%0A%3Crect%20x%3D%22540%22%20y%3D%22150%22%20width%3D%22250%22%20height%3D%22290%22%20fill%3D%22none%22%20stroke%3D%22%23111111%22%20stroke-width%3D%222%22%2F%3E%3Ctext%20x%3D%22552%22%20y%3D%22180%22%20fill%3D%22%23111111%22%20font-size%3D%2222%22%20font-weight%3D%22700%22%20text-anchor%3D%22start%22%20font-family%3D'%22Helvetica%20Neue%22%2C%20Helvetica%2C%20Arial%2C%20sans-serif'%3E703%3C%2Ftext%3E%3Ctext%20x%3D%22780%22%20y%3D%22178%22%20fill%3D%22%238a8a8a%22%20font-size%3D%2213%22%20font-weight%3D%22500%22%20text-anchor%3D%22end%22%20font-family%3D'%22Helvetica%20Neue%22%2C%20Helvetica%2C%20Arial%2C%20sans-serif'%3E2%EC%9D%B8%EC%8B%A4%3C%2Ftext%3E%0A%3Crect%20x%3D%22790%22%20y%3D%22150%22%20width%3D%22125%22%20height%3D%22290%22%20fill%3D%22none%22%20stroke%3D%22%23111111%22%20stroke-width%3D%222%22%2F%3E%3Ctext%20x%3D%22802%22%20y%3D%22180%22%20fill%3D%22%23111111%22%20font-size%3D%2222%22%20font-weight%3D%22700%22%20text-anchor%3D%22start%22%20font-family%3D'%22Helvetica%20Neue%22%2C%20Helvetica%2C%20Arial%2C%20sans-serif'%3E704%3C%2Ftext%3E%3Ctext%20x%3D%22905%22%20y%3D%22178%22%20fill%3D%22%238a8a8a%22%20font-size%3D%2213%22%20font-weight%3D%22500%22%20text-anchor%3D%22end%22%20font-family%3D'%22Helvetica%20Neue%22%2C%20Helvetica%2C%20Arial%2C%20sans-serif'%3E%EA%B2%A9%EB%A6%AC%3C%2Ftext%3E%0A%3Crect%20x%3D%22915%22%20y%3D%22150%22%20width%3D%22125%22%20height%3D%22290%22%20fill%3D%22none%22%20stroke%3D%22%23111111%22%20stroke-width%3D%222%22%2F%3E%3Ctext%20x%3D%22927%22%20y%3D%22180%22%20fill%3D%22%23111111%22%20font-size%3D%2222%22%20font-weight%3D%22700%22%20text-anchor%3D%22start%22%20font-family%3D'%22Helvetica%20Neue%22%2C%20Helvetica%2C%20Arial%2C%20sans-serif'%3E705%3C%2Ftext%3E%3Ctext%20x%3D%221030%22%20y%3D%22178%22%20fill%3D%22%238a8a8a%22%20font-size%3D%2213%22%20font-weight%3D%22500%22%20text-anchor%3D%22end%22%20font-family%3D'%22Helvetica%20Neue%22%2C%20Helvetica%2C%20Arial%2C%20sans-serif'%3E1%EC%9D%B8%EC%8B%A4%3C%2Ftext%3E%0A%3Crect%20x%3D%2240%22%20y%3D%22560%22%20width%3D%22250%22%20height%3D%22290%22%20fill%3D%22none%22%20stroke%3D%22%23111111%22%20stroke-width%3D%222%22%2F%3E%3Ctext%20x%3D%2252%22%20y%3D%22590%22%20fill%3D%22%23111111%22%20font-size%3D%2222%22%20font-weight%3D%22700%22%20text-anchor%3D%22start%22%20font-family%3D'%22Helvetica%20Neue%22%2C%20Helvetica%2C%20Arial%2C%20sans-serif'%3E706%3C%2Ftext%3E%3Ctext%20x%3D%22280%22%20y%3D%22588%22%20fill%3D%22%238a8a8a%22%20font-size%3D%2213%22%20font-weight%3D%22500%22%20text-anchor%3D%22end%22%20font-family%3D'%22Helvetica%20Neue%22%2C%20Helvetica%2C%20Arial%2C%20sans-serif'%3E4%EC%9D%B8%EC%8B%A4%3C%2Ftext%3E%0A%3Crect%20x%3D%22290%22%20y%3D%22560%22%20width%3D%22250%22%20height%3D%22290%22%20fill%3D%22none%22%20stroke%3D%22%23111111%22%20stroke-width%3D%222%22%2F%3E%3Ctext%20x%3D%22302%22%20y%3D%22590%22%20fill%3D%22%23111111%22%20font-size%3D%2222%22%20font-weight%3D%22700%22%20text-anchor%3D%22start%22%20font-family%3D'%22Helvetica%20Neue%22%2C%20Helvetica%2C%20Arial%2C%20sans-serif'%3E707%3C%2Ftext%3E%3Ctext%20x%3D%22530%22%20y%3D%22588%22%20fill%3D%22%238a8a8a%22%20font-size%3D%2213%22%20font-weight%3D%22500%22%20text-anchor%3D%22end%22%20font-family%3D'%22Helvetica%20Neue%22%2C%20Helvetica%2C%20Arial%2C%20sans-serif'%3E4%EC%9D%B8%EC%8B%A4%3C%2Ftext%3E%0A%3Crect%20x%3D%22540%22%20y%3D%22560%22%20width%3D%22250%22%20height%3D%22290%22%20fill%3D%22none%22%20stroke%3D%22%23111111%22%20stroke-width%3D%222%22%2F%3E%3Ctext%20x%3D%22552%22%20y%3D%22590%22%20fill%3D%22%23111111%22%20font-size%3D%2222%22%20font-weight%3D%22700%22%20text-anchor%3D%22start%22%20font-family%3D'%22Helvetica%20Neue%22%2C%20Helvetica%2C%20Arial%2C%20sans-serif'%3E708%3C%2Ftext%3E%3Ctext%20x%3D%22780%22%20y%3D%22588%22%20fill%3D%22%238a8a8a%22%20font-size%3D%2213%22%20font-weight%3D%22500%22%20text-anchor%3D%22end%22%20font-family%3D'%22Helvetica%20Neue%22%2C%20Helvetica%2C%20Arial%2C%20sans-serif'%3E2%EC%9D%B8%EC%8B%A4%3C%2Ftext%3E%0A%3Crect%20x%3D%22790%22%20y%3D%22560%22%20width%3D%22250%22%20height%3D%22290%22%20fill%3D%22%23f2f2f2%22%20stroke%3D%22%23111111%22%20stroke-width%3D%222%22%2F%3E%0A%3Ctext%20x%3D%22806%22%20y%3D%22594%22%20fill%3D%22%23111111%22%20font-size%3D%2222%22%20font-weight%3D%22700%22%20text-anchor%3D%22start%22%20font-family%3D'%22Helvetica%20Neue%22%2C%20Helvetica%2C%20Arial%2C%20sans-serif'%3E%EA%B0%84%ED%98%B8%EC%82%AC%EC%8B%A4%3C%2Ftext%3E%0A%3Ctext%20x%3D%2256%22%20y%3D%22508%22%20fill%3D%22%238a8a8a%22%20font-size%3D%2218%22%20font-weight%3D%22500%22%20text-anchor%3D%22start%22%20font-family%3D'%22Helvetica%20Neue%22%2C%20Helvetica%2C%20Arial%2C%20sans-serif'%3E%EB%B3%B5%EB%8F%84%3C%2Ftext%3E%0A%3Cline%20x1%3D%221080%22%20y1%3D%22150%22%20x2%3D%221080%22%20y2%3D%22860%22%20stroke%3D%22%23111111%22%20stroke-width%3D%222%22%2F%3E%0A%3C%2Fsvg%3E",
    "place": {
      "masthead": [
        120,
        36,
        1440,
        72
      ],
      "legend": [
        40,
        862,
        700,
        30
      ],
      "census": [
        1110,
        156,
        450,
        220
      ],
      "week-head": [
        1110,
        396,
        450,
        30
      ],
      "week": [
        1110,
        430,
        450,
        220
      ],
      "coming-head": [
        1110,
        664,
        450,
        30
      ],
      "coming": [
        1110,
        700,
        450,
        150
      ],
      "bed-701-1": [
        56,
        200,
        104,
        112
      ],
      "bed-701-2": [
        170,
        200,
        104,
        112
      ],
      "bed-701-3": [
        56,
        322,
        104,
        112
      ],
      "bed-701-4": [
        170,
        322,
        104,
        112
      ],
      "bed-702-1": [
        306,
        200,
        104,
        112
      ],
      "bed-702-2": [
        420,
        200,
        104,
        112
      ],
      "bed-702-3": [
        306,
        322,
        104,
        112
      ],
      "bed-702-4": [
        420,
        322,
        104,
        112
      ],
      "bed-703-1": [
        556,
        261,
        104,
        112
      ],
      "bed-703-2": [
        670,
        261,
        104,
        112
      ],
      "bed-704-1": [
        800.5,
        261,
        104,
        112
      ],
      "bed-705-1": [
        925.5,
        261,
        104,
        112
      ],
      "bed-706-1": [
        56,
        610,
        104,
        112
      ],
      "bed-706-2": [
        170,
        610,
        104,
        112
      ],
      "bed-706-3": [
        56,
        732,
        104,
        112
      ],
      "bed-706-4": [
        170,
        732,
        104,
        112
      ],
      "bed-707-1": [
        306,
        610,
        104,
        112
      ],
      "bed-707-2": [
        420,
        610,
        104,
        112
      ],
      "bed-707-3": [
        306,
        732,
        104,
        112
      ],
      "bed-707-4": [
        420,
        732,
        104,
        112
      ],
      "bed-708-1": [
        556,
        671,
        104,
        112
      ],
      "bed-708-2": [
        670,
        671,
        104,
        112
      ]
    }
  }
};

export const wardBeds: SamplePack = {
  id: "ward-beds",
  title: {
    "ko": "병동 병상 현황판 — 스위스 타이포그래피",
    "en": "A ward’s bed board — in the Swiss style"
  },
  field: {
    "ko": "의료",
    "en": "Healthcare"
  },
  kind: {
    "ko": "병동 평면(컴포넌트 반복)",
    "en": "A ward plan (one component, repeated)"
  },
  domain: "health",
  styles: [
    "minimal"
  ],
  summary: {
    "ko": "병동 간호사실 벽에 거는 병상 현황판을 스위스 타이포그래피로 — 흰 종이, 굵은 검은 글자, 빨강 하나, 엄격한 격자. 복도 양쪽 병실 여덟과 격리실·간호사실 평면 위에 병상마다 컴포넌트 하나: 병상 번호, 가린 환자 표시와 재원 일수, 낙상 위험, 상태(재원 검정 · 오늘 퇴원 빨강 · 청소 중 회색 빗금 · 빈 병상 테두리 · 입원 예정 빨간 점선 · 격리 빨간 테). 오른쪽에 아주 큰 재원 수, 오늘 입원·퇴원·간호 인력, 이번 주 재원율, 응급실에서 올라올 환자. 예시 데이터입니다.",
    "en": "The bed board on a ward’s nurse-station wall, set in the Swiss style — white paper, heavy black type, one red, a strict grid. On the plan of eight rooms either side of the corridor, the isolation room and the station, every bed is one component: its number, the patient masked with their day of stay, a fall-risk tag, and its state (in: black · going home today: red · being cleaned: grey hatching · free: outline · kept for an admission: red dashes · isolation: a red rim). On the right the census in very large figures, today’s admissions, discharges and staffing, the week’s occupancy, and who is coming up from the emergency room. Example data."
  },
  connectors: [
    {
      "key": "ward",
      "name": "예시 병동 병상 관리 API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 병원·환자가 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
