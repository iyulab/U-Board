// An office tower's lifts watched on a text-mode console: the deep blue screen of an old terminal program, double-line
// box borders, a grey menu bar and a status line, and every character on a fixed grid. Each of the six lifts is a
// shaft from the ground to the twenty-second floor with its car drawn at the floor it is at now — the car's height in
// the shaft is the data. A car tells its state by its mark as well as by its colour: an arrow while it travels, a dot
// when it waits, a shaded block while it is in service mode, a flashing-red pair of bangs when someone is trapped.
// On the right the console's title, the figures now, the key, the hall calls waiting, the alarm log and the trips by
// the hour. The tower is made up, so the values are example data.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/elevator-tui.js';

const board: Board = {
  "board": {
    "theme": "dark",
    "accent": "#55ffff"
  },
  "elements": {
    "shaft": {
      "template": "<article class=\"sh {{e.state}}\" style=\"--f: {{e.floor}}\"><div class=\"car\"><b>{{e.id}}</b><i></i><strong>{{e.floor}}F</strong><small>{{e.load}}%</small></div></article>",
      "style": ".sh{position:relative;height:100%;box-sizing:border-box;border-left:2px dotted #5555ff;border-right:2px dotted #5555ff;background:repeating-linear-gradient(180deg,transparent 0 34px,rgba(85,85,255,.35) 34px 35px);font-family:\"D2Coding\", \"Consolas\", \"Courier New\", monospace}\n.car{position:absolute;left:6px;right:6px;height:35px;bottom:calc((var(--f) - 1) * 35px);box-sizing:border-box;display:grid;grid-template-columns:auto auto 1fr auto;align-items:center;column-gap:4px;padding:0 6px;background:#55ffff;color:#000000;border:2px solid #ffffff}\nb{font-size:15px}\ni{font-style:normal;font-size:15px;font-weight:900}\nstrong{font-size:14px;justify-self:end}\nsmall{justify-self:end;font-size:12px}\n.up i::before{content:\"▲\"}\n.down i::before{content:\"▼\"}\n.idle .car{background:#ffffff}\n.idle i::before{content:\"·\"}\n.service .car{background:repeating-linear-gradient(90deg,#ffff55 0 6px,#a8a800 6px 8px);}\n.service i::before{content:\"░\"}\n.trapped .car{background:#ff5555;color:#ffffff;border-color:#ffff55;box-shadow:0 0 0 3px #ff5555}\n.trapped i::before{content:\"!!\"}",
      "props": {
        "e": "object"
      }
    },
    "tag": {
      "template": "<p class=\"tg {{e.state}}\"><b>{{e.id}}호기</b><span>{{e.word}}</span></p>",
      "style": ".tg{margin:0;height:100%;box-sizing:border-box;display:grid;justify-items:center;align-content:center;font:15px \"D2Coding\", \"Consolas\", \"Courier New\", monospace;color:#ffffff}\nb{color:#ffff55}\nspan{font-size:13px;white-space:nowrap}\n.trapped span{background:#ff5555;color:#ffffff;padding:0 4px}\n.service span{color:#ffff55}",
      "props": {
        "e": "object"
      }
    },
    "title": {
      "template": "<header class=\"tt\"><small>{{t.series}}</small><h1>{{t.name}}</h1><div><span>{{t.date}}</span><b>{{t.time}}</b></div></header>",
      "style": ".tt{height:100%;box-sizing:border-box;display:grid;align-content:center;gap:6px;padding:10px 18px;border:4px double #aaaaaa;background:#0000a8;color:#ffffff;font-family:\"D2Coding\", \"Consolas\", \"Courier New\", monospace}\nsmall{color:#55ffff;font-size:14px}\nh1{margin:0;font-size:32px;font-weight:700;color:#ffff55}\ndiv{display:flex;justify-content:space-between;align-items:baseline}\nspan{font-size:16px}\nb{background:#55ffff;color:#000000;padding:0 10px;font-size:24px}",
      "props": {
        "t": "object"
      }
    },
    "figures": {
      "template": "<dl class=\"fg\">{{#items}}<div><dt>{{label}}</dt><dd>{{value}}</dd><small>{{note}}</small></div>{{/items}}</dl>",
      "style": ".fg{margin:0;height:100%;box-sizing:border-box;display:grid;grid-template-columns:repeat(3,1fr);gap:10px;font-family:\"D2Coding\", \"Consolas\", \"Courier New\", monospace}\ndiv{display:grid;align-content:center;justify-items:center;text-align:center;border:4px double #aaaaaa;background:#0000a8;color:#ffffff;font-family:\"D2Coding\", \"Consolas\", \"Courier New\", monospace}\ndt{font-size:13px;color:#55ffff}\ndd{margin:0;font-size:28px;color:#ffffff}\nsmall{font-size:12px;color:#aaaaaa}",
      "props": {
        "items": "list"
      }
    },
    "legend": {
      "template": "<ul class=\"ky\"><li><i class=\"run\">▲▼</i>운행</li><li><i class=\"idle\">·</i>대기</li><li><i class=\"svc\">░</i>정비 모드</li><li><i class=\"trap\">!!</i>갇힘 경보</li></ul>",
      "style": ".ky{height:100%;box-sizing:border-box;margin:0;padding:0 16px;list-style:none;display:flex;align-items:center;justify-content:space-between;border:4px double #aaaaaa;background:#0000a8;color:#ffffff;font-family:\"D2Coding\", \"Consolas\", \"Courier New\", monospace;font-size:14px}\nli{display:flex;align-items:center;gap:8px}\ni{font-style:normal;padding:0 6px;color:#000000;font-weight:900}\n.run{background:#55ffff}\n.idle{background:#ffffff}\n.svc{background:#ffff55}\n.trap{background:#ff5555;color:#ffffff}"
    },
    "calls": {
      "template": "<section class=\"cl\"><h2>═ 승강장 호출 ═</h2><ol>{{#items}}<li class=\"{{state}}\"><b>{{floor}}</b><i>{{dir}}</i><span>{{wait}}</span><small>{{car}}</small></li>{{/items}}</ol></section>",
      "style": ".cl{height:100%;box-sizing:border-box;padding:6px 16px;border:4px double #aaaaaa;background:#0000a8;color:#ffffff;font-family:\"D2Coding\", \"Consolas\", \"Courier New\", monospace}\nh2{margin:0 0 4px;font-size:15px;font-weight:400;color:#ffff55;text-align:center}\nol{margin:0;padding:0;list-style:none;display:grid;gap:2px}\nli{display:grid;grid-template-columns:52px 30px 1fr 88px;font-size:15px}\nb{color:#ffffff}\ni{font-style:normal;color:#55ffff}\nsmall{text-align:right;color:#aaaaaa;font-size:14px}\n.long{background:#a80000}\n.long span{color:#ffff55}",
      "props": {
        "items": "list"
      }
    },
    "log": {
      "template": "<section class=\"lg\"><h2>═ 경보 기록 ═</h2><ol>{{#items}}<li class=\"{{state}}\"><b>{{time}}</b><span>{{text}}</span></li>{{/items}}</ol></section>",
      "style": ".lg{height:100%;box-sizing:border-box;padding:6px 16px;border:4px double #aaaaaa;background:#0000a8;color:#ffffff;font-family:\"D2Coding\", \"Consolas\", \"Courier New\", monospace}\nh2{margin:0 0 4px;font-size:15px;font-weight:400;color:#ffff55;text-align:center}\nol{margin:0;padding:0;list-style:none;display:grid;gap:2px}\nli{display:grid;grid-template-columns:76px 1fr;font-size:14px}\nb{font-weight:400;color:#aaaaaa}\n.alarm{background:#ff5555;color:#ffffff}\n.alarm b{color:#ffffff}\n.ok span{color:#55ff55}",
      "props": {
        "items": "list"
      }
    }
  },
  "data": {
    "cars": {
      "from": "lift",
      "path": "/lift/cars",
      "time": "updatedAt",
      "fresh": 60,
      "fields": {
        "a": {
          "at": "/value/a"
        },
        "b": {
          "at": "/value/b"
        },
        "c": {
          "at": "/value/c"
        },
        "d": {
          "at": "/value/d"
        },
        "e": {
          "at": "/value/e"
        },
        "f": {
          "at": "/value/f"
        }
      }
    },
    "now": {
      "from": "lift",
      "path": "/lift/now",
      "time": "updatedAt",
      "fresh": 60,
      "fields": {
        "value": {}
      }
    },
    "figures": {
      "from": "lift",
      "path": "/lift/figures",
      "time": "updatedAt",
      "fresh": 60,
      "fields": {
        "value": {}
      }
    },
    "calls": {
      "from": "lift",
      "path": "/lift/calls",
      "time": "updatedAt",
      "fresh": 60,
      "fields": {
        "value": {}
      }
    },
    "log": {
      "from": "lift",
      "path": "/lift/log",
      "time": "updatedAt",
      "fresh": 60,
      "fields": {
        "value": {}
      }
    },
    "trips": {
      "from": "lift",
      "path": "/lift/trips",
      "list": "/value",
      "fresh": 60,
      "answerTime": "/updatedAt"
    }
  },
  "parts": {
    "shaft-a": {
      "as": "element",
      "element": "shaft",
      "of": "cars",
      "bind": {
        "e": "a"
      }
    },
    "tag-a": {
      "as": "element",
      "element": "tag",
      "of": "cars",
      "bind": {
        "e": "a"
      }
    },
    "shaft-b": {
      "as": "element",
      "element": "shaft",
      "of": "cars",
      "bind": {
        "e": "b"
      }
    },
    "tag-b": {
      "as": "element",
      "element": "tag",
      "of": "cars",
      "bind": {
        "e": "b"
      }
    },
    "shaft-c": {
      "as": "element",
      "element": "shaft",
      "of": "cars",
      "bind": {
        "e": "c"
      }
    },
    "tag-c": {
      "as": "element",
      "element": "tag",
      "of": "cars",
      "bind": {
        "e": "c"
      }
    },
    "shaft-d": {
      "as": "element",
      "element": "shaft",
      "of": "cars",
      "bind": {
        "e": "d"
      }
    },
    "tag-d": {
      "as": "element",
      "element": "tag",
      "of": "cars",
      "bind": {
        "e": "d"
      }
    },
    "shaft-e": {
      "as": "element",
      "element": "shaft",
      "of": "cars",
      "bind": {
        "e": "e"
      }
    },
    "tag-e": {
      "as": "element",
      "element": "tag",
      "of": "cars",
      "bind": {
        "e": "e"
      }
    },
    "shaft-f": {
      "as": "element",
      "element": "shaft",
      "of": "cars",
      "bind": {
        "e": "f"
      }
    },
    "tag-f": {
      "as": "element",
      "element": "tag",
      "of": "cars",
      "bind": {
        "e": "f"
      }
    },
    "title": {
      "as": "element",
      "element": "title",
      "of": "now",
      "bind": {
        "t": "value"
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
    "legend": {
      "as": "element",
      "element": "legend"
    },
    "calls": {
      "as": "element",
      "element": "calls",
      "of": "calls",
      "bind": {
        "items": "value"
      }
    },
    "log": {
      "as": "element",
      "element": "log",
      "of": "log",
      "bind": {
        "items": "value"
      }
    },
    "trips": {
      "as": "chart.bar",
      "of": "trips",
      "title": "시간별 운행 횟수",
      "x": "hour",
      "y": "trips",
      "series": [
        {
          "label": "운행",
          "color": "#55ffff"
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
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221600%22%20height%3D%221000%22%20viewBox%3D%220%200%201600%201000%22%3E%0A%3Crect%20width%3D%221600%22%20height%3D%221000%22%20fill%3D%22%230000a8%22%2F%3E%0A%3Crect%20width%3D%221600%22%20height%3D%2232%22%20fill%3D%22%23aaaaaa%22%2F%3E%0A%3Ctext%20x%3D%2220%22%20y%3D%2222%22%20font-family%3D%22Consolas%2C%20monospace%22%20font-size%3D%2217%22%20fill%3D%22%23000000%22%3E%20%ED%8C%8C%EC%9D%BC%20%20%EB%B3%B4%EA%B8%B0%20%20%ED%98%B8%EC%B6%9C%20%20%EC%A0%95%EB%B9%84%20%20%EA%B2%BD%EB%B3%B4%20%20%EB%8F%84%EC%9B%80%EB%A7%90%3C%2Ftext%3E%0A%3Ctext%20x%3D%221580%22%20y%3D%2222%22%20font-family%3D%22Consolas%2C%20monospace%22%20font-size%3D%2217%22%20fill%3D%22%23000000%22%20text-anchor%3D%22end%22%3ELIFT-CON%20v3.1%3C%2Ftext%3E%0A%3Crect%20x%3D%2214%22%20y%3D%2246%22%20width%3D%22992%22%20height%3D%22900%22%20fill%3D%22none%22%20stroke%3D%22%23aaaaaa%22%20stroke-width%3D%222%22%2F%3E%3Crect%20x%3D%2219%22%20y%3D%2251%22%20width%3D%22982%22%20height%3D%22890%22%20fill%3D%22none%22%20stroke%3D%22%23aaaaaa%22%20stroke-width%3D%222%22%2F%3E%0A%3Crect%20x%3D%22380%22%20y%3D%2238%22%20width%3D%22260%22%20height%3D%2222%22%20fill%3D%22%230000a8%22%2F%3E%0A%3Ctext%20x%3D%22510%22%20y%3D%2256%22%20font-family%3D%22Consolas%2C%20monospace%22%20font-size%3D%2217%22%20fill%3D%22%23ffffff%22%20text-anchor%3D%22middle%22%3E%5B%20%EC%8A%B9%EA%B0%95%EB%A1%9C%201F%20%E2%80%93%2022F%20%5D%3C%2Ftext%3E%0A%3Ctext%20x%3D%2270%22%20y%3D%22877.5%22%20font-family%3D%22Consolas%2C%20monospace%22%20font-size%3D%2214%22%20fill%3D%22%23aaaaaa%22%20text-anchor%3D%22end%22%3E1F%3C%2Ftext%3E%3Cpath%20d%3D%22M78%20855.0%20H%20990%22%20stroke%3D%22%232a2ac0%22%20stroke-width%3D%221%22%2F%3E%3Ctext%20x%3D%2270%22%20y%3D%22842.5%22%20font-family%3D%22Consolas%2C%20monospace%22%20font-size%3D%2214%22%20fill%3D%22%23aaaaaa%22%20text-anchor%3D%22end%22%3E2%3C%2Ftext%3E%3Cpath%20d%3D%22M78%20820.0%20H%20990%22%20stroke%3D%22%232a2ac0%22%20stroke-width%3D%221%22%2F%3E%3Ctext%20x%3D%2270%22%20y%3D%22807.5%22%20font-family%3D%22Consolas%2C%20monospace%22%20font-size%3D%2214%22%20fill%3D%22%23aaaaaa%22%20text-anchor%3D%22end%22%3E3%3C%2Ftext%3E%3Cpath%20d%3D%22M78%20785.0%20H%20990%22%20stroke%3D%22%232a2ac0%22%20stroke-width%3D%221%22%2F%3E%3Ctext%20x%3D%2270%22%20y%3D%22772.5%22%20font-family%3D%22Consolas%2C%20monospace%22%20font-size%3D%2214%22%20fill%3D%22%23aaaaaa%22%20text-anchor%3D%22end%22%3E4%3C%2Ftext%3E%3Cpath%20d%3D%22M78%20750.0%20H%20990%22%20stroke%3D%22%232a2ac0%22%20stroke-width%3D%221%22%2F%3E%3Ctext%20x%3D%2270%22%20y%3D%22737.5%22%20font-family%3D%22Consolas%2C%20monospace%22%20font-size%3D%2214%22%20fill%3D%22%23ffffff%22%20text-anchor%3D%22end%22%3E5%3C%2Ftext%3E%3Cpath%20d%3D%22M78%20715.0%20H%20990%22%20stroke%3D%22%232a2ac0%22%20stroke-width%3D%221%22%2F%3E%3Ctext%20x%3D%2270%22%20y%3D%22702.5%22%20font-family%3D%22Consolas%2C%20monospace%22%20font-size%3D%2214%22%20fill%3D%22%23aaaaaa%22%20text-anchor%3D%22end%22%3E6%3C%2Ftext%3E%3Cpath%20d%3D%22M78%20680.0%20H%20990%22%20stroke%3D%22%232a2ac0%22%20stroke-width%3D%221%22%2F%3E%3Ctext%20x%3D%2270%22%20y%3D%22667.5%22%20font-family%3D%22Consolas%2C%20monospace%22%20font-size%3D%2214%22%20fill%3D%22%23aaaaaa%22%20text-anchor%3D%22end%22%3E7%3C%2Ftext%3E%3Cpath%20d%3D%22M78%20645.0%20H%20990%22%20stroke%3D%22%232a2ac0%22%20stroke-width%3D%221%22%2F%3E%3Ctext%20x%3D%2270%22%20y%3D%22632.5%22%20font-family%3D%22Consolas%2C%20monospace%22%20font-size%3D%2214%22%20fill%3D%22%23aaaaaa%22%20text-anchor%3D%22end%22%3E8%3C%2Ftext%3E%3Cpath%20d%3D%22M78%20610.0%20H%20990%22%20stroke%3D%22%232a2ac0%22%20stroke-width%3D%221%22%2F%3E%3Ctext%20x%3D%2270%22%20y%3D%22597.5%22%20font-family%3D%22Consolas%2C%20monospace%22%20font-size%3D%2214%22%20fill%3D%22%23aaaaaa%22%20text-anchor%3D%22end%22%3E9%3C%2Ftext%3E%3Cpath%20d%3D%22M78%20575.0%20H%20990%22%20stroke%3D%22%232a2ac0%22%20stroke-width%3D%221%22%2F%3E%3Ctext%20x%3D%2270%22%20y%3D%22562.5%22%20font-family%3D%22Consolas%2C%20monospace%22%20font-size%3D%2214%22%20fill%3D%22%23ffffff%22%20text-anchor%3D%22end%22%3E10%3C%2Ftext%3E%3Cpath%20d%3D%22M78%20540.0%20H%20990%22%20stroke%3D%22%232a2ac0%22%20stroke-width%3D%221%22%2F%3E%3Ctext%20x%3D%2270%22%20y%3D%22527.5%22%20font-family%3D%22Consolas%2C%20monospace%22%20font-size%3D%2214%22%20fill%3D%22%23aaaaaa%22%20text-anchor%3D%22end%22%3E11%3C%2Ftext%3E%3Cpath%20d%3D%22M78%20505.0%20H%20990%22%20stroke%3D%22%232a2ac0%22%20stroke-width%3D%221%22%2F%3E%3Ctext%20x%3D%2270%22%20y%3D%22492.5%22%20font-family%3D%22Consolas%2C%20monospace%22%20font-size%3D%2214%22%20fill%3D%22%23aaaaaa%22%20text-anchor%3D%22end%22%3E12%3C%2Ftext%3E%3Cpath%20d%3D%22M78%20470.0%20H%20990%22%20stroke%3D%22%232a2ac0%22%20stroke-width%3D%221%22%2F%3E%3Ctext%20x%3D%2270%22%20y%3D%22457.5%22%20font-family%3D%22Consolas%2C%20monospace%22%20font-size%3D%2214%22%20fill%3D%22%23aaaaaa%22%20text-anchor%3D%22end%22%3E13%3C%2Ftext%3E%3Cpath%20d%3D%22M78%20435.0%20H%20990%22%20stroke%3D%22%232a2ac0%22%20stroke-width%3D%221%22%2F%3E%3Ctext%20x%3D%2270%22%20y%3D%22422.5%22%20font-family%3D%22Consolas%2C%20monospace%22%20font-size%3D%2214%22%20fill%3D%22%23aaaaaa%22%20text-anchor%3D%22end%22%3E14%3C%2Ftext%3E%3Cpath%20d%3D%22M78%20400.0%20H%20990%22%20stroke%3D%22%232a2ac0%22%20stroke-width%3D%221%22%2F%3E%3Ctext%20x%3D%2270%22%20y%3D%22387.5%22%20font-family%3D%22Consolas%2C%20monospace%22%20font-size%3D%2214%22%20fill%3D%22%23ffffff%22%20text-anchor%3D%22end%22%3E15%3C%2Ftext%3E%3Cpath%20d%3D%22M78%20365.0%20H%20990%22%20stroke%3D%22%232a2ac0%22%20stroke-width%3D%221%22%2F%3E%3Ctext%20x%3D%2270%22%20y%3D%22352.5%22%20font-family%3D%22Consolas%2C%20monospace%22%20font-size%3D%2214%22%20fill%3D%22%23aaaaaa%22%20text-anchor%3D%22end%22%3E16%3C%2Ftext%3E%3Cpath%20d%3D%22M78%20330.0%20H%20990%22%20stroke%3D%22%232a2ac0%22%20stroke-width%3D%221%22%2F%3E%3Ctext%20x%3D%2270%22%20y%3D%22317.5%22%20font-family%3D%22Consolas%2C%20monospace%22%20font-size%3D%2214%22%20fill%3D%22%23aaaaaa%22%20text-anchor%3D%22end%22%3E17%3C%2Ftext%3E%3Cpath%20d%3D%22M78%20295.0%20H%20990%22%20stroke%3D%22%232a2ac0%22%20stroke-width%3D%221%22%2F%3E%3Ctext%20x%3D%2270%22%20y%3D%22282.5%22%20font-family%3D%22Consolas%2C%20monospace%22%20font-size%3D%2214%22%20fill%3D%22%23aaaaaa%22%20text-anchor%3D%22end%22%3E18%3C%2Ftext%3E%3Cpath%20d%3D%22M78%20260.0%20H%20990%22%20stroke%3D%22%232a2ac0%22%20stroke-width%3D%221%22%2F%3E%3Ctext%20x%3D%2270%22%20y%3D%22247.5%22%20font-family%3D%22Consolas%2C%20monospace%22%20font-size%3D%2214%22%20fill%3D%22%23aaaaaa%22%20text-anchor%3D%22end%22%3E19%3C%2Ftext%3E%3Cpath%20d%3D%22M78%20225.0%20H%20990%22%20stroke%3D%22%232a2ac0%22%20stroke-width%3D%221%22%2F%3E%3Ctext%20x%3D%2270%22%20y%3D%22212.5%22%20font-family%3D%22Consolas%2C%20monospace%22%20font-size%3D%2214%22%20fill%3D%22%23ffffff%22%20text-anchor%3D%22end%22%3E20%3C%2Ftext%3E%3Cpath%20d%3D%22M78%20190.0%20H%20990%22%20stroke%3D%22%232a2ac0%22%20stroke-width%3D%221%22%2F%3E%3Ctext%20x%3D%2270%22%20y%3D%22177.5%22%20font-family%3D%22Consolas%2C%20monospace%22%20font-size%3D%2214%22%20fill%3D%22%23aaaaaa%22%20text-anchor%3D%22end%22%3E21%3C%2Ftext%3E%3Cpath%20d%3D%22M78%20155.0%20H%20990%22%20stroke%3D%22%232a2ac0%22%20stroke-width%3D%221%22%2F%3E%3Ctext%20x%3D%2270%22%20y%3D%22142.5%22%20font-family%3D%22Consolas%2C%20monospace%22%20font-size%3D%2214%22%20fill%3D%22%23aaaaaa%22%20text-anchor%3D%22end%22%3E22%3C%2Ftext%3E%3Cpath%20d%3D%22M78%20120.0%20H%20990%22%20stroke%3D%22%232a2ac0%22%20stroke-width%3D%221%22%2F%3E%0A%3Crect%20width%3D%221600%22%20height%3D%2234%22%20y%3D%22966%22%20fill%3D%22%2300a8a8%22%2F%3E%0A%3Ctext%20x%3D%2220%22%20y%3D%22989%22%20font-family%3D%22Consolas%2C%20monospace%22%20font-size%3D%2216%22%20fill%3D%22%23000000%22%3EF1%20%EB%8F%84%EC%9B%80%EB%A7%90%20%20F2%20%ED%98%B8%EC%B6%9C%20%EB%B0%B0%EC%A0%95%20%20F5%20%EC%83%88%EB%A1%9C%EA%B3%A0%EC%B9%A8%20%20F8%20%EC%A0%95%EB%B9%84%20%EB%AA%A8%EB%93%9C%20%20F10%20%EC%A2%85%EB%A3%8C%3C%2Ftext%3E%0A%3Crect%20x%3D%221030%22%20y%3D%22630%22%20width%3D%22556%22%20height%3D%22322%22%20fill%3D%22%23000080%22%2F%3E%0A%3C%2Fsvg%3E",
    "place": {
      "shaft-a": [
        100,
        120,
        130,
        770
      ],
      "tag-a": [
        100,
        892,
        130,
        30
      ],
      "shaft-b": [
        250,
        120,
        130,
        770
      ],
      "tag-b": [
        250,
        892,
        130,
        30
      ],
      "shaft-c": [
        400,
        120,
        130,
        770
      ],
      "tag-c": [
        400,
        892,
        130,
        30
      ],
      "shaft-d": [
        550,
        120,
        130,
        770
      ],
      "tag-d": [
        550,
        892,
        130,
        30
      ],
      "shaft-e": [
        700,
        120,
        130,
        770
      ],
      "tag-e": [
        700,
        892,
        130,
        30
      ],
      "shaft-f": [
        850,
        120,
        130,
        770
      ],
      "tag-f": [
        850,
        892,
        130,
        30
      ],
      "title": [
        1030,
        46,
        556,
        124
      ],
      "figures": [
        1030,
        180,
        556,
        94
      ],
      "legend": [
        1030,
        284,
        556,
        44
      ],
      "calls": [
        1030,
        338,
        556,
        150
      ],
      "log": [
        1030,
        498,
        556,
        122
      ],
      "trips": [
        1040,
        638,
        536,
        306
      ]
    }
  }
};

export const elevatorTui: SamplePack = {
  id: "elevator-tui",
  title: {
    "ko": "업무용 빌딩 승강기 관제 — 텍스트 모드 화면",
    "en": "An office tower’s lifts — a text-mode console"
  },
  field: {
    "ko": "승강기·건물 설비",
    "en": "Lifts & building services"
  },
  kind: {
    "ko": "승강기 위치·상태·호출·경보",
    "en": "Car positions, states, hall calls and alarms"
  },
  domain: "construction",
  styles: [
    "retro"
  ],
  summary: {
    "ko": "업무용 빌딩 승강기를 옛 텍스트 모드 관제 프로그램으로 — 짙은 파란 화면, 이중선 상자, 회색 메뉴 줄과 아래 기능키 줄, 모든 글자가 고정 칸에. 승강기 여섯 대는 1층부터 22층까지의 승강로이고, 그 안에 지금 있는 층에 칸이 그려진다 — 칸의 높이가 곧 데이터. 칸 상태는 색과 함께 표시로: 운행 중이면 화살표, 대기면 점, 정비 모드면 음영 블록, 사람이 갇히면 빨간 느낌표 둘. 오른쪽에 관제 제목, 지금 수치, 범례, 승강장 호출, 경보 기록, 시간별 운행 횟수. 건물은 지어낸 것이라 예시 데이터입니다.",
    "en": "An office tower’s lifts on an old text-mode control console — a deep blue screen, double-line boxes, a grey menu bar and a function-key line, every character on a fixed grid. The six lifts are shafts from the ground to the twenty-second floor, each with its car drawn at the floor it is at now — the car’s height in the shaft is the data. A car tells its state by its mark as well as its colour: an arrow while it travels, a dot when it waits, a shaded block in service mode, two red bangs when someone is trapped. On the right the console’s title, the figures now, the key, the hall calls waiting, the alarm log and the trips by the hour. The tower is made up. Example data."
  },
  connectors: [
    {
      "key": "lift",
      "name": "예시 승강기 관제 API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 건물이 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
