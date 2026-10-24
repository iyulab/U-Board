// A theme park's wait-time board drawn in the Memphis style of the eighties: pastel zones with zigzag and wavy edges,
// confetti of squiggles, dots and triangles, everything outlined in thick black. The decoration keeps to purple, black
// and pale tints, so the four strong colours mean one thing each: a ride's wait — teal short, yellow middling, hot pink
// long — and grey hatched for a ride that is down. Each ride is a badge with its wait in large type; a purple dashed
// route strings the shortest waits together from the gate. On the right the day's figures, the shows and the average
// wait by the hour. The park is made up, so the values are example data.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/theme-park.js';

const board: Board = {
  "board": {
    "theme": "light",
    "accent": "#6e4bff"
  },
  "elements": {
    "ride": {
      "template": "<section class=\"rd {{level}}\"><b>{{wait}}<small>분</small></b><p><strong>{{name}}</strong>{{#note}}<em>{{note}}</em>{{/note}}</p></section>",
      "style": ".short{--c:#13a89a}.mid{--c:#ffc21a}.long{--c:#ff3d7f}\n.closed{--c:#9a9a9a;--h:repeating-linear-gradient(45deg,rgba(255,255,255,.35) 0 6px,transparent 6px 12px)}\n.rd{height:100%;box-sizing:border-box;display:grid;grid-template-columns:auto 1fr;align-items:center;gap:8px;padding:6px 8px;background:#fff;border:4px solid #141414;box-shadow:6px 6px 0 #141414;font-family:\"Futura\", \"Jost\", \"Century Gothic\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif;color:#141414}\nb{display:grid;place-items:center;align-content:center;min-width:58px;height:58px;border:3px solid #141414;border-radius:50%;background:var(--h,none),var(--c);font-size:26px;font-weight:900;line-height:1;font-variant-numeric:tabular-nums}\n.closed b{font-size:17px}\n.closed small{display:none}\nsmall{font-size:11px;font-weight:800}\np{margin:0;display:grid;gap:2px;min-width:0}\nstrong{font-size:16px;font-weight:800;line-height:1.15}\nem{font-style:normal;font-size:12px;color:#555;line-height:1.2}",
      "props": {
        "name": "string",
        "wait": "string",
        "level": "string",
        "note": "string"
      }
    },
    "gate": {
      "template": "<div class=\"gt\">정문</div>",
      "style": ".gt{height:100%;box-sizing:border-box;display:grid;place-items:center;background:#6e4bff;color:#fff;border:4px solid #141414;font:900 18px \"Futura\", \"Jost\", \"Century Gothic\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif;letter-spacing:.3em}"
    },
    "legend": {
      "template": "<ul class=\"lg\"><li class=\"short\"><i></i>20분 미만</li><li class=\"mid\"><i></i>20–45분</li><li class=\"long\"><i></i>45분 이상</li><li class=\"closed\"><i></i>운휴</li><li class=\"rt\"><i></i>추천 동선</li></ul>",
      "style": ".short{--c:#13a89a}.mid{--c:#ffc21a}.long{--c:#ff3d7f}\n.closed{--c:#9a9a9a;--h:repeating-linear-gradient(45deg,rgba(255,255,255,.35) 0 6px,transparent 6px 12px)}\n.lg{height:100%;box-sizing:border-box;margin:0;padding:0;list-style:none;display:flex;align-items:center;gap:16px;font:800 14px \"Futura\", \"Jost\", \"Century Gothic\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif;color:#141414}\nli{display:flex;align-items:center;gap:6px}\ni{width:18px;height:18px;border-radius:50%;border:3px solid #141414;background:var(--h,none),var(--c)}\n.rt i{width:26px;height:0;border:0;border-top:5px dashed #6e4bff;border-radius:0}"
    },
    "title": {
      "template": "<header class=\"tt\"><h1>{{name}}</h1><svg viewBox=\"0 0 200 16\" aria-hidden=\"true\"><path d=\"M 2 8 q 12 -12 24 0 t 24 0 t 24 0 t 24 0 t 24 0 t 24 0 t 24 0 t 24 0\"/></svg><p>{{sub}} · {{date}} <b>{{time}}</b></p></header>",
      "style": ".tt{height:100%;box-sizing:border-box;display:grid;align-content:center;gap:6px;font-family:\"Futura\", \"Jost\", \"Century Gothic\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif;color:#141414}\nh1{margin:0;font-size:52px;font-weight:900;letter-spacing:.04em;line-height:1}\nsvg{width:220px;height:18px;fill:none;stroke:#6e4bff;stroke-width:5;stroke-linecap:round}\np{margin:0;font-size:17px;font-weight:600}\nb{font-size:22px}",
      "props": {
        "name": "string",
        "sub": "string",
        "date": "string",
        "time": "string"
      }
    },
    "figures": {
      "template": "<dl class=\"fg\">{{#items}}<div><dt>{{label}}</dt><dd>{{value}}</dd><small>{{note}}</small></div>{{/items}}</dl>",
      "style": ".fg{margin:0;height:100%;box-sizing:border-box;display:grid;grid-template-columns:repeat(3,1fr);gap:14px;padding:0 8px 8px 0;font-family:\"Futura\", \"Jost\", \"Century Gothic\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif;color:#141414}\ndiv{display:grid;align-content:center;padding:8px 10px;background:#fff;border:3px solid #141414;box-shadow:5px 5px 0 #6e4bff}\ndt{font-size:13px;font-weight:700}\ndd{margin:2px 0;font-size:30px;font-weight:900;font-variant-numeric:tabular-nums}\nsmall{font-size:11px;color:#555}",
      "props": {
        "items": "list"
      }
    },
    "shows": {
      "template": "<section class=\"sh\"><h3>오늘의 공연</h3><ol>{{#items}}<li><b>{{time}}</b><span><strong>{{name}}</strong><small>{{place}}{{#left}} · {{left}}{{/left}}</small></span></li>{{/items}}</ol></section>",
      "style": ".sh{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr;gap:8px;font-family:\"Futura\", \"Jost\", \"Century Gothic\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif;color:#141414}\nh3{margin:0;justify-self:start;padding:4px 12px;background:#141414;color:#fff;font-size:17px;font-weight:900;letter-spacing:.12em}\nol{margin:0;padding:0;list-style:none;display:grid;align-content:start;gap:8px}\nli{display:grid;grid-template-columns:70px 1fr;align-items:center;gap:10px;padding-bottom:8px;border-bottom:3px dotted #141414}\nb{font-size:22px;font-weight:900;font-variant-numeric:tabular-nums;color:#6e4bff}\nspan{display:grid}\nstrong{font-size:16px}\nsmall{font-size:13px;color:#555}",
      "props": {
        "items": "list"
      }
    }
  },
  "data": {
    "rides": {
      "from": "park",
      "path": "/park/rides",
      "time": "updatedAt",
      "fresh": 900,
      "fields": {
        "name": {
          "at": "/value/coaster/name"
        },
        "wait": {
          "at": "/value/coaster/wait"
        },
        "level": {
          "at": "/value/coaster/level"
        },
        "note": {
          "at": "/value/coaster/note"
        },
        "name-2": {
          "at": "/value/jungle/name"
        },
        "wait-2": {
          "at": "/value/jungle/wait"
        },
        "level-2": {
          "at": "/value/jungle/level"
        },
        "name-3": {
          "at": "/value/drop/name"
        },
        "wait-3": {
          "at": "/value/drop/wait"
        },
        "level-3": {
          "at": "/value/drop/level"
        },
        "note-2": {
          "at": "/value/drop/note"
        },
        "name-4": {
          "at": "/value/wheel/name"
        },
        "wait-4": {
          "at": "/value/wheel/wait"
        },
        "level-4": {
          "at": "/value/wheel/level"
        },
        "name-5": {
          "at": "/value/teacup/name"
        },
        "wait-5": {
          "at": "/value/teacup/wait"
        },
        "level-5": {
          "at": "/value/teacup/level"
        },
        "name-6": {
          "at": "/value/rapids/name"
        },
        "wait-6": {
          "at": "/value/rapids/wait"
        },
        "level-6": {
          "at": "/value/rapids/level"
        },
        "note-3": {
          "at": "/value/rapids/note"
        },
        "name-7": {
          "at": "/value/haunted/name"
        },
        "wait-7": {
          "at": "/value/haunted/wait"
        },
        "level-7": {
          "at": "/value/haunted/level"
        },
        "note-4": {
          "at": "/value/haunted/note"
        },
        "name-8": {
          "at": "/value/cinema/name"
        },
        "wait-8": {
          "at": "/value/cinema/wait"
        },
        "level-8": {
          "at": "/value/cinema/level"
        },
        "note-5": {
          "at": "/value/cinema/note"
        },
        "name-9": {
          "at": "/value/carousel/name"
        },
        "wait-9": {
          "at": "/value/carousel/wait"
        },
        "level-9": {
          "at": "/value/carousel/level"
        },
        "name-10": {
          "at": "/value/bumper/name"
        },
        "wait-10": {
          "at": "/value/bumper/wait"
        },
        "level-10": {
          "at": "/value/bumper/level"
        }
      }
    },
    "now": {
      "from": "park",
      "path": "/park/now",
      "time": "updatedAt",
      "fresh": 900,
      "fields": {
        "name": {},
        "sub": {},
        "date": {},
        "time": {}
      }
    },
    "figures": {
      "from": "park",
      "path": "/park/figures",
      "time": "updatedAt",
      "fresh": 900,
      "fields": {
        "value": {}
      }
    },
    "shows": {
      "from": "park",
      "path": "/park/shows",
      "time": "updatedAt",
      "fresh": 900,
      "fields": {
        "value": {}
      }
    },
    "waits": {
      "from": "park",
      "path": "/park/waits",
      "list": "/value",
      "fresh": 900,
      "answerTime": "/updatedAt"
    },
    "route": {
      "from": "park",
      "path": "/park/route",
      "time": "updatedAt",
      "fresh": 900,
      "fields": {
        "gate-carousel": {},
        "carousel-teacup": {},
        "teacup-wheel": {}
      }
    }
  },
  "parts": {
    "ride-coaster": {
      "as": "element",
      "element": "ride",
      "of": "rides",
      "bind": {
        "name": "name",
        "wait": "wait",
        "level": "level",
        "note": "note"
      }
    },
    "ride-jungle": {
      "as": "element",
      "element": "ride",
      "of": "rides",
      "props": {
        "note": ""
      },
      "bind": {
        "name": "name-2",
        "wait": "wait-2",
        "level": "level-2"
      }
    },
    "ride-drop": {
      "as": "element",
      "element": "ride",
      "of": "rides",
      "bind": {
        "name": "name-3",
        "wait": "wait-3",
        "level": "level-3",
        "note": "note-2"
      }
    },
    "ride-wheel": {
      "as": "element",
      "element": "ride",
      "of": "rides",
      "props": {
        "note": ""
      },
      "bind": {
        "name": "name-4",
        "wait": "wait-4",
        "level": "level-4"
      }
    },
    "ride-teacup": {
      "as": "element",
      "element": "ride",
      "of": "rides",
      "props": {
        "note": ""
      },
      "bind": {
        "name": "name-5",
        "wait": "wait-5",
        "level": "level-5"
      }
    },
    "ride-rapids": {
      "as": "element",
      "element": "ride",
      "of": "rides",
      "bind": {
        "name": "name-6",
        "wait": "wait-6",
        "level": "level-6",
        "note": "note-3"
      }
    },
    "ride-haunted": {
      "as": "element",
      "element": "ride",
      "of": "rides",
      "bind": {
        "name": "name-7",
        "wait": "wait-7",
        "level": "level-7",
        "note": "note-4"
      }
    },
    "ride-cinema": {
      "as": "element",
      "element": "ride",
      "of": "rides",
      "bind": {
        "name": "name-8",
        "wait": "wait-8",
        "level": "level-8",
        "note": "note-5"
      }
    },
    "ride-carousel": {
      "as": "element",
      "element": "ride",
      "of": "rides",
      "props": {
        "note": ""
      },
      "bind": {
        "name": "name-9",
        "wait": "wait-9",
        "level": "level-9"
      }
    },
    "ride-bumper": {
      "as": "element",
      "element": "ride",
      "of": "rides",
      "props": {
        "note": ""
      },
      "bind": {
        "name": "name-10",
        "wait": "wait-10",
        "level": "level-10"
      }
    },
    "gate": {
      "as": "element",
      "element": "gate"
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
        "sub": "sub",
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
    "shows": {
      "as": "element",
      "element": "shows",
      "of": "shows",
      "bind": {
        "items": "value"
      }
    },
    "waits": {
      "as": "chart.bar",
      "of": "waits",
      "title": "시간대별 평균 대기(분)",
      "x": "hour",
      "y": "wait",
      "series": [
        {
          "label": "평균 대기",
          "color": "#6e4bff"
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
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221600%22%20height%3D%221000%22%20viewBox%3D%220%200%201600%201000%22%3E%0A%3Cdefs%3E%3Cpattern%20id%3D%22grid%22%20width%3D%2222%22%20height%3D%2222%22%20patternUnits%3D%22userSpaceOnUse%22%3E%3Cpath%20d%3D%22M%2022%200%20H%200%20V%2022%22%20fill%3D%22none%22%20stroke%3D%22%23141414%22%20stroke-opacity%3D%22.08%22%20stroke-width%3D%222%22%2F%3E%3C%2Fpattern%3E%3C%2Fdefs%3E%0A%3Crect%20width%3D%221600%22%20height%3D%221000%22%20fill%3D%22%23fff7ea%22%2F%3E%0A%3Crect%20width%3D%221080%22%20height%3D%221000%22%20fill%3D%22url(%23grid)%22%2F%3E%0A%3Cpath%20d%3D%22M%2040%2070%20l%2012%20-10%20l%2012%2010%20l%2012%2010%20l%2012%20-10%20l%2012%20-10%20l%2012%2010%20l%2012%2010%20l%2012%20-10%20l%2012%20-10%20l%2012%2010%20l%2012%2010%20l%2012%20-10%20l%2012%20-10%20l%2012%2010%20l%2012%2010%20l%2012%20-10%20l%2012%20-10%20l%2012%2010%20l%2012%2010%20l%2012%20-10%20l%2012%20-10%20l%2012%2010%20l%2012%2010%20l%2012%20-10%20l%2012%20-10%20l%2012%2010%20l%2012%2010%20l%2012%20-10%20l%2012%20-10%20l%2012%2010%20l%2012%2010%20l%2012%20-10%20l%2012%20-10%20l%2012%2010%20l%2012%2010%20l%2012%20-10%20l%2012%20-10%20l%2012%2010%20l%2012%2010%20l%2012%20-10%20V%20510%20H%2040%20Z%22%20fill%3D%22%23e7defe%22%20stroke%3D%22%23141414%22%20stroke-width%3D%224%22%20stroke-linejoin%3D%22round%22%2F%3E%3Ctext%20x%3D%2260%22%20y%3D%22500%22%20fill%3D%22%23141414%22%20font-size%3D%2220%22%20font-weight%3D%22800%22%20letter-spacing%3D%224%22%20font-family%3D'%22Futura%22%2C%20%22Jost%22%2C%20%22Century%20Gothic%22%2C%20%22Noto%20Sans%20KR%22%2C%20%22Malgun%20Gothic%22%2C%20sans-serif'%3E%EB%AA%A8%ED%97%98%3C%2Ftext%3E%0A%3Cpath%20d%3D%22M%20560%2070%20l%2012%20-10%20l%2012%2010%20l%2012%2010%20l%2012%20-10%20l%2012%20-10%20l%2012%2010%20l%2012%2010%20l%2012%20-10%20l%2012%20-10%20l%2012%2010%20l%2012%2010%20l%2012%20-10%20l%2012%20-10%20l%2012%2010%20l%2012%2010%20l%2012%20-10%20l%2012%20-10%20l%2012%2010%20l%2012%2010%20l%2012%20-10%20l%2012%20-10%20l%2012%2010%20l%2012%2010%20l%2012%20-10%20l%2012%20-10%20l%2012%2010%20l%2012%2010%20l%2012%20-10%20l%2012%20-10%20l%2012%2010%20l%2012%2010%20l%2012%20-10%20l%2012%20-10%20l%2012%2010%20l%2012%2010%20l%2012%20-10%20l%2012%20-10%20l%2012%2010%20l%2012%2010%20l%2012%20-10%20V%20460%20H%20560%20Z%22%20fill%3D%22%23d9f4f0%22%20stroke%3D%22%23141414%22%20stroke-width%3D%224%22%20stroke-linejoin%3D%22round%22%2F%3E%3Ctext%20x%3D%22580%22%20y%3D%22450%22%20fill%3D%22%23141414%22%20font-size%3D%2220%22%20font-weight%3D%22800%22%20letter-spacing%3D%224%22%20font-family%3D'%22Futura%22%2C%20%22Jost%22%2C%20%22Century%20Gothic%22%2C%20%22Noto%20Sans%20KR%22%2C%20%22Malgun%20Gothic%22%2C%20sans-serif'%3E%ED%8C%90%ED%83%80%EC%A7%80%3C%2Ftext%3E%0A%3Cpath%20d%3D%22M%2040%20560%20C%20120%20540%20200%20580%20280%20560%20C%20360%20540%20440%20580%20520%20560%20V%20930%20H%2040%20Z%22%20fill%3D%22%23ffe0ec%22%20stroke%3D%22%23141414%22%20stroke-width%3D%224%22%20stroke-linejoin%3D%22round%22%2F%3E%3Ctext%20x%3D%2260%22%20y%3D%22916%22%20fill%3D%22%23141414%22%20font-size%3D%2220%22%20font-weight%3D%22800%22%20letter-spacing%3D%224%22%20font-family%3D'%22Futura%22%2C%20%22Jost%22%2C%20%22Century%20Gothic%22%2C%20%22Noto%20Sans%20KR%22%2C%20%22Malgun%20Gothic%22%2C%20sans-serif'%3E%ED%95%A0%EB%A1%9C%EC%9C%88%3C%2Ftext%3E%0A%3Cpath%20d%3D%22M%20560%20560%20C%20640%20540%20720%20580%20800%20560%20C%20880%20540%20960%20580%201040%20560%20V%20930%20H%20560%20Z%22%20fill%3D%22%23fff1c7%22%20stroke%3D%22%23141414%22%20stroke-width%3D%224%22%20stroke-linejoin%3D%22round%22%2F%3E%3Ctext%20x%3D%22960%22%20y%3D%22916%22%20fill%3D%22%23141414%22%20font-size%3D%2220%22%20font-weight%3D%22800%22%20letter-spacing%3D%224%22%20font-family%3D'%22Futura%22%2C%20%22Jost%22%2C%20%22Century%20Gothic%22%2C%20%22Noto%20Sans%20KR%22%2C%20%22Malgun%20Gothic%22%2C%20sans-serif'%3E%ED%82%A4%EC%A6%88%3C%2Ftext%3E%0A%3Ccircle%20cx%3D%22540%22%20cy%3D%22515%22%20r%3D%2262%22%20fill%3D%22%23fff7ea%22%20stroke%3D%22%23141414%22%20stroke-width%3D%224%22%2F%3E%0A%3Ccircle%20cx%3D%22540%22%20cy%3D%22515%22%20r%3D%2244%22%20fill%3D%22none%22%20stroke%3D%22%236e4bff%22%20stroke-width%3D%226%22%20stroke-dasharray%3D%222%2012%22%20stroke-linecap%3D%22round%22%2F%3E%0A%3Ctext%20x%3D%22540%22%20y%3D%22522%22%20text-anchor%3D%22middle%22%20fill%3D%22%23141414%22%20font-size%3D%2218%22%20font-weight%3D%22800%22%20font-family%3D'%22Futura%22%2C%20%22Jost%22%2C%20%22Century%20Gothic%22%2C%20%22Noto%20Sans%20KR%22%2C%20%22Malgun%20Gothic%22%2C%20sans-serif'%3E%EA%B4%91%EC%9E%A5%3C%2Ftext%3E%0A%3Cpath%20d%3D%22M%20470%2040%20q%2010%20-14%2020%200%20t%2020%200%20t%2020%200%20t%2020%200%22%20fill%3D%22none%22%20stroke%3D%22%236e4bff%22%20stroke-width%3D%225%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20960%20520%20q%2010%20-14%2020%200%20t%2020%200%20t%2020%200%20t%2020%200%22%20fill%3D%22none%22%20stroke%3D%22%236e4bff%22%20stroke-width%3D%225%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20300%20540%20q%2010%20-14%2020%200%20t%2020%200%20t%2020%200%20t%2020%200%22%20fill%3D%22none%22%20stroke%3D%22%23141414%22%20stroke-width%3D%225%22%20stroke-linecap%3D%22round%22%2F%3E%0A%3Ccircle%20cx%3D%22450%22%20cy%3D%22120%22%20r%3D%223.5%22%20fill%3D%22%23141414%22%2F%3E%3Ccircle%20cx%3D%22464%22%20cy%3D%22120%22%20r%3D%223.5%22%20fill%3D%22%23141414%22%2F%3E%3Ccircle%20cx%3D%22478%22%20cy%3D%22120%22%20r%3D%223.5%22%20fill%3D%22%23141414%22%2F%3E%3Ccircle%20cx%3D%22492%22%20cy%3D%22120%22%20r%3D%223.5%22%20fill%3D%22%23141414%22%2F%3E%3Ccircle%20cx%3D%22450%22%20cy%3D%22134%22%20r%3D%223.5%22%20fill%3D%22%23141414%22%2F%3E%3Ccircle%20cx%3D%22464%22%20cy%3D%22134%22%20r%3D%223.5%22%20fill%3D%22%23141414%22%2F%3E%3Ccircle%20cx%3D%22478%22%20cy%3D%22134%22%20r%3D%223.5%22%20fill%3D%22%23141414%22%2F%3E%3Ccircle%20cx%3D%22492%22%20cy%3D%22134%22%20r%3D%223.5%22%20fill%3D%22%23141414%22%2F%3E%3Ccircle%20cx%3D%22450%22%20cy%3D%22148%22%20r%3D%223.5%22%20fill%3D%22%23141414%22%2F%3E%3Ccircle%20cx%3D%22464%22%20cy%3D%22148%22%20r%3D%223.5%22%20fill%3D%22%23141414%22%2F%3E%3Ccircle%20cx%3D%22478%22%20cy%3D%22148%22%20r%3D%223.5%22%20fill%3D%22%23141414%22%2F%3E%3Ccircle%20cx%3D%22492%22%20cy%3D%22148%22%20r%3D%223.5%22%20fill%3D%22%23141414%22%2F%3E%3Ccircle%20cx%3D%22960%22%20cy%3D%22410%22%20r%3D%223.5%22%20fill%3D%22%23141414%22%2F%3E%3Ccircle%20cx%3D%22974%22%20cy%3D%22410%22%20r%3D%223.5%22%20fill%3D%22%23141414%22%2F%3E%3Ccircle%20cx%3D%22988%22%20cy%3D%22410%22%20r%3D%223.5%22%20fill%3D%22%23141414%22%2F%3E%3Ccircle%20cx%3D%221002%22%20cy%3D%22410%22%20r%3D%223.5%22%20fill%3D%22%23141414%22%2F%3E%3Ccircle%20cx%3D%22960%22%20cy%3D%22424%22%20r%3D%223.5%22%20fill%3D%22%23141414%22%2F%3E%3Ccircle%20cx%3D%22974%22%20cy%3D%22424%22%20r%3D%223.5%22%20fill%3D%22%23141414%22%2F%3E%3Ccircle%20cx%3D%22988%22%20cy%3D%22424%22%20r%3D%223.5%22%20fill%3D%22%23141414%22%2F%3E%3Ccircle%20cx%3D%221002%22%20cy%3D%22424%22%20r%3D%223.5%22%20fill%3D%22%23141414%22%2F%3E%3Ccircle%20cx%3D%22960%22%20cy%3D%22438%22%20r%3D%223.5%22%20fill%3D%22%23141414%22%2F%3E%3Ccircle%20cx%3D%22974%22%20cy%3D%22438%22%20r%3D%223.5%22%20fill%3D%22%23141414%22%2F%3E%3Ccircle%20cx%3D%22988%22%20cy%3D%22438%22%20r%3D%223.5%22%20fill%3D%22%23141414%22%2F%3E%3Ccircle%20cx%3D%221002%22%20cy%3D%22438%22%20r%3D%223.5%22%20fill%3D%22%23141414%22%2F%3E%3Ccircle%20cx%3D%22400%22%20cy%3D%22640%22%20r%3D%223.5%22%20fill%3D%22%23141414%22%2F%3E%3Ccircle%20cx%3D%22414%22%20cy%3D%22640%22%20r%3D%223.5%22%20fill%3D%22%23141414%22%2F%3E%3Ccircle%20cx%3D%22428%22%20cy%3D%22640%22%20r%3D%223.5%22%20fill%3D%22%23141414%22%2F%3E%3Ccircle%20cx%3D%22442%22%20cy%3D%22640%22%20r%3D%223.5%22%20fill%3D%22%23141414%22%2F%3E%3Ccircle%20cx%3D%22400%22%20cy%3D%22654%22%20r%3D%223.5%22%20fill%3D%22%23141414%22%2F%3E%3Ccircle%20cx%3D%22414%22%20cy%3D%22654%22%20r%3D%223.5%22%20fill%3D%22%23141414%22%2F%3E%3Ccircle%20cx%3D%22428%22%20cy%3D%22654%22%20r%3D%223.5%22%20fill%3D%22%23141414%22%2F%3E%3Ccircle%20cx%3D%22442%22%20cy%3D%22654%22%20r%3D%223.5%22%20fill%3D%22%23141414%22%2F%3E%3Ccircle%20cx%3D%22400%22%20cy%3D%22668%22%20r%3D%223.5%22%20fill%3D%22%23141414%22%2F%3E%3Ccircle%20cx%3D%22414%22%20cy%3D%22668%22%20r%3D%223.5%22%20fill%3D%22%23141414%22%2F%3E%3Ccircle%20cx%3D%22428%22%20cy%3D%22668%22%20r%3D%223.5%22%20fill%3D%22%23141414%22%2F%3E%3Ccircle%20cx%3D%22442%22%20cy%3D%22668%22%20r%3D%223.5%22%20fill%3D%22%23141414%22%2F%3E%0A%3Cpath%20d%3D%22M%201000%2020%20l%2018%2030%20h%20-36%20z%22%20fill%3D%22%23e7defe%22%20stroke%3D%22%23141414%22%20stroke-width%3D%223%22%20transform%3D%22rotate(20%201000%2035)%22%2F%3E%3Cpath%20d%3D%22M%20520%20840%20l%2018%2030%20h%20-36%20z%22%20fill%3D%22%23d9f4f0%22%20stroke%3D%22%23141414%22%20stroke-width%3D%223%22%20transform%3D%22rotate(-15%20520%20855)%22%2F%3E%3Cpath%20d%3D%22M%20250%20470%20l%2018%2030%20h%20-36%20z%22%20fill%3D%22%23fff1c7%22%20stroke%3D%22%23141414%22%20stroke-width%3D%223%22%20transform%3D%22rotate(35%20250%20485)%22%2F%3E%0A%3Cpath%20d%3D%22M%201080%200%20V%201000%22%20stroke%3D%22%23141414%22%20stroke-width%3D%226%22%2F%3E%0A%3Cpath%20d%3D%22M%201092%200%20V%201000%22%20stroke%3D%22%236e4bff%22%20stroke-width%3D%226%22%20stroke-dasharray%3D%2214%2010%22%2F%3E%0A%3C%2Fsvg%3E",
    "place": {
      "ride-coaster": [
        110,
        120,
        160,
        100
      ],
      "ride-jungle": [
        330,
        220,
        160,
        100
      ],
      "ride-drop": [
        110,
        360,
        160,
        100
      ],
      "ride-wheel": [
        620,
        110,
        160,
        100
      ],
      "ride-teacup": [
        860,
        270,
        160,
        100
      ],
      "ride-rapids": [
        620,
        300,
        160,
        100
      ],
      "ride-haunted": [
        110,
        620,
        160,
        100
      ],
      "ride-cinema": [
        300,
        770,
        160,
        100
      ],
      "ride-carousel": [
        700,
        600,
        160,
        100
      ],
      "ride-bumper": [
        860,
        760,
        160,
        100
      ],
      "gate": [
        480,
        900,
        120,
        44
      ],
      "legend": [
        40,
        956,
        600,
        30
      ],
      "title": [
        1120,
        30,
        460,
        140
      ],
      "figures": [
        1120,
        190,
        460,
        120
      ],
      "shows": [
        1120,
        336,
        460,
        230
      ],
      "waits": [
        1120,
        590,
        460,
        380
      ]
    },
    "links": {
      "route-gate-carousel": {
        "from": "gate",
        "to": "ride-carousel",
        "label": "{{gate-carousel}}",
        "tone": "info",
        "of": "route",
        "width": 5,
        "dash": true,
        "arrow": "end"
      },
      "route-carousel-teacup": {
        "from": "ride-carousel",
        "to": "ride-teacup",
        "label": "{{carousel-teacup}}",
        "tone": "info",
        "of": "route",
        "width": 5,
        "dash": true,
        "arrow": "end"
      },
      "route-teacup-wheel": {
        "from": "ride-teacup",
        "to": "ride-wheel",
        "label": "{{teacup-wheel}}",
        "tone": "info",
        "of": "route",
        "width": 5,
        "dash": true,
        "arrow": "end"
      }
    }
  }
};

export const themePark: SamplePack = {
  id: "theme-park",
  title: {
    "ko": "놀이공원 대기 시간 — 멤피스",
    "en": "A theme park’s waits — in the Memphis style"
  },
  field: {
    "ko": "여가·테마파크",
    "en": "Leisure & theme parks"
  },
  kind: {
    "ko": "파스텔 구역의 놀이공원 지도",
    "en": "A park map of pastel zones"
  },
  domain: "leisure",
  styles: [
    "art"
  ],
  summary: {
    "ko": "놀이공원 정문의 대기 시간 안내판을 80년대 멤피스 스타일로 — 지그재그·물결 테두리의 파스텔 구역, 물결선·점·삼각형 색종이, 모든 것에 굵은 검은 테. 장식은 보라·검정·옅은 색만 써서 강한 네 색은 뜻 하나씩: 놀이기구 대기 — 청록 짧음, 노랑 보통, 핫핑크 김, 회색 빗금 운휴. 놀이기구마다 대기 분을 큰 글자로 담은 배지, 정문에서 대기가 짧은 곳을 잇는 보라 점선 추천 동선(도보 분). 오른쪽에 오늘 입장·평균 대기·운휴, 오늘의 공연, 시간대별 평균 대기. 놀이공원은 지어낸 것이라 예시 데이터입니다.",
    "en": "A theme park’s wait-time board at its gate in the Memphis style of the eighties — pastel zones with zigzag and wavy edges, confetti of squiggles, dots and triangles, thick black outlines on everything. The decoration keeps to purple, black and pale tints, so the four strong colours mean one thing each: a ride’s wait — teal short, yellow middling, hot pink long, grey hatched down. Each ride is a badge with its wait in large type, and a purple dashed route strings the shortest waits together from the gate (minutes on foot). On the right the day’s entries, the average wait and the rides down, today’s shows and the average wait by the hour. The park is made up. Example data."
  },
  connectors: [
    {
      "key": "park",
      "name": "예시 놀이공원 대기 API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 놀이공원이 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
