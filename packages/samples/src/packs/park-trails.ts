// A national park's trail board painted as a watercolour map: the mountain in washes of sap green and slate that bleed
// at their edges, the stream in a blue wash, a few soft contour lines in sepia, on grained paper. The trails are drawn
// over it in ink — indigo open, ochre crowded, carmine and dashed closed — between the gates, the fork, the falls, the
// shelter, the summit and the lookout, each carrying its length and state. Cards on the places say what a walker needs
// there now (parking left, seats at the shelter, the summit's wind); on the right the mountain's weather, the day's
// notices and walkers through the gates by the hour. The park is made up, so the values are example data.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/park-trails.js';

const board: Board = {
  "board": {
    "theme": "light",
    "accent": "#2f4f6f"
  },
  "statuses": {
    "closed": {
      "tone": "alarm",
      "emphasis": "hatch"
    }
  },
  "elements": {
    "spot": {
      "template": "<i class=\"sp {{kind}}\"></i>",
      "style": ".sp{display:block;width:100%;height:100%;box-sizing:border-box;border:3px solid #3b3127;border-radius:50%;background:#f7f2e6}\n.fork{transform:scale(.6);background:#3b3127}\n.summit{border:0;border-radius:0;background:#3b3127;clip-path:polygon(50% 0,100% 100%,0 100%)}\n.shelter{border-radius:3px;background:#3b3127;clip-path:polygon(50% 0,100% 40%,100% 100%,0 100%,0 40%)}\n.falls{background:#6f9fc8}\n.lookout{border-radius:0;transform:rotate(45deg) scale(.75)}",
      "props": {
        "kind": "string"
      }
    },
    "card": {
      "template": "<section class=\"cd {{status}}\"><header><b>{{name}}</b><span>{{word}}</span></header><p>{{line}}</p><small>{{note}}</small></section>",
      "style": ".open{--c:#2f4f6f}.busy{--c:#c96f14}.closed{--c:#b8322a}\n.cd{height:100%;box-sizing:border-box;display:grid;align-content:center;gap:2px;padding:6px 10px 6px 12px;background:rgba(250,246,236,.92);border-left:5px solid var(--c);box-shadow:0 1px 0 rgba(59,49,39,.25),0 0 0 1px rgba(59,49,39,.15);font-family:\"Gowun Batang\", \"Nanum Myeongjo\", \"Noto Serif KR\", Batang, serif;color:#3b3127}\nheader{display:flex;align-items:baseline;gap:8px}\nb{font-size:16px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\nspan{margin-left:auto;flex:none;font-size:13px;font-weight:800;color:var(--c)}\np{margin:0;font-size:17px;font-weight:700}\nsmall{font-size:12px;color:#7a6d5e;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      "props": {
        "name": "string",
        "status": "string",
        "word": "string",
        "line": "string",
        "note": "string"
      }
    },
    "legend": {
      "template": "<ul class=\"lg\"><li><i style=\"border-color:#2f4f6f\"></i>열림</li><li><i style=\"border-color:#c96f14\"></i>혼잡</li><li><i class=\"d\" style=\"border-color:#b8322a\"></i>통제</li></ul>",
      "style": ".lg{height:100%;box-sizing:border-box;margin:0;padding:0;list-style:none;display:flex;align-items:center;gap:20px;font:600 15px \"Gowun Batang\", \"Nanum Myeongjo\", \"Noto Serif KR\", Batang, serif;color:#3b3127}\nli{display:flex;align-items:center;gap:8px}\ni{width:30px;border-top:5px solid}\n.d{border-top-style:dashed}"
    },
    "title": {
      "template": "<header class=\"tt\"><h1>{{name}}</h1><p>{{sub}} · {{date}} <b>{{time}}</b></p></header>",
      "style": ".tt{height:100%;box-sizing:border-box;display:grid;align-content:center;gap:8px;font-family:\"Gowun Batang\", \"Nanum Myeongjo\", \"Noto Serif KR\", Batang, serif;color:#3b3127;border-bottom:2px solid rgba(59,49,39,.5)}\nh1{margin:0;font-size:40px;font-weight:800;font-style:italic;letter-spacing:.02em}\np{margin:0;font-size:17px;color:#7a6d5e}\nb{color:#3b3127;font-size:22px}",
      "props": {
        "name": "string",
        "sub": "string",
        "date": "string",
        "time": "string"
      }
    },
    "weather": {
      "template": "<dl class=\"wx\">{{#items}}<div><dt>{{label}}</dt><dd>{{value}}<small>{{unit}}</small></dd><em>{{note}}</em></div>{{/items}}</dl>",
      "style": ".wx{margin:0;height:100%;box-sizing:border-box;display:grid;grid-template-columns:repeat(3,1fr);gap:10px;font-family:\"Gowun Batang\", \"Nanum Myeongjo\", \"Noto Serif KR\", Batang, serif;color:#3b3127}\ndiv{display:grid;align-content:center;padding:10px 12px;background:radial-gradient(closest-side,rgba(127,160,108,.3),rgba(127,160,108,.12) 80%,transparent)}\ndt{font-size:14px;color:#7a6d5e}\ndd{margin:2px 0;font-size:34px;font-weight:800;font-variant-numeric:tabular-nums}\ndd small{font-size:15px;margin-left:2px}\nem{font-style:normal;font-size:12px;color:#7a6d5e}",
      "props": {
        "items": "list"
      }
    },
    "notices": {
      "template": "<section class=\"nt\"><h3>오늘의 안내</h3><ul>{{#items}}<li class=\"{{#closed}}x{{/closed}}\"><b>{{title}}</b><span>{{text}}</span></li>{{/items}}</ul></section>",
      "style": ".nt{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr;gap:6px;font-family:\"Gowun Batang\", \"Nanum Myeongjo\", \"Noto Serif KR\", Batang, serif;color:#3b3127}\nh3{margin:0;font-size:19px;font-weight:800;font-style:italic}\nul{margin:0;padding:0;list-style:none;display:grid;align-content:start;gap:8px}\nli{display:grid;gap:2px;padding:6px 10px;border-left:4px solid #2f4f6f;background:rgba(255,255,255,.45)}\nli.x{border-left-color:#b8322a}\nb{font-size:16px}\nli.x b{color:#b8322a}\nspan{font-size:14px;color:#7a6d5e}",
      "props": {
        "items": "list"
      }
    }
  },
  "data": {
    "places": {
      "from": "park",
      "path": "/park/places",
      "time": "updatedAt",
      "fresh": 900,
      "fields": {
        "name": {
          "at": "/centre/name"
        },
        "status": {
          "at": "/centre/status"
        },
        "word": {
          "at": "/centre/word"
        },
        "line": {
          "at": "/centre/line"
        },
        "note": {
          "at": "/centre/note"
        },
        "name-2": {
          "at": "/east/name"
        },
        "status-2": {
          "at": "/east/status"
        },
        "word-2": {
          "at": "/east/word"
        },
        "line-2": {
          "at": "/east/line"
        },
        "note-2": {
          "at": "/east/note"
        },
        "name-3": {
          "at": "/falls/name"
        },
        "status-3": {
          "at": "/falls/status"
        },
        "word-3": {
          "at": "/falls/word"
        },
        "line-3": {
          "at": "/falls/line"
        },
        "note-3": {
          "at": "/falls/note"
        },
        "name-4": {
          "at": "/shelter/name"
        },
        "status-4": {
          "at": "/shelter/status"
        },
        "word-4": {
          "at": "/shelter/word"
        },
        "line-4": {
          "at": "/shelter/line"
        },
        "note-4": {
          "at": "/shelter/note"
        },
        "name-5": {
          "at": "/summit/name"
        },
        "status-5": {
          "at": "/summit/status"
        },
        "word-5": {
          "at": "/summit/word"
        },
        "line-5": {
          "at": "/summit/line"
        },
        "note-5": {
          "at": "/summit/note"
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
    "weather": {
      "from": "park",
      "path": "/park/weather",
      "time": "updatedAt",
      "fresh": 900,
      "fields": {
        "value": {}
      }
    },
    "notices": {
      "from": "park",
      "path": "/park/notices",
      "time": "updatedAt",
      "fresh": 900,
      "fields": {
        "value": {}
      }
    },
    "walkers": {
      "from": "park",
      "path": "/park/walkers",
      "list": "/value",
      "fresh": 900,
      "answerTime": "/updatedAt"
    },
    "trails": {
      "from": "park",
      "path": "/park/trails",
      "time": "updatedAt",
      "fresh": 900,
      "fields": {
        "label": {
          "at": "/centre-fork/label"
        },
        "status": {
          "at": "/centre-fork/status",
          "state": {
            "open": "past",
            "busy": "warn",
            "closed": "closed",
            "*": "off"
          }
        },
        "label-2": {
          "at": "/fork-falls/label"
        },
        "status-2": {
          "at": "/fork-falls/status",
          "state": {
            "open": "past",
            "busy": "warn",
            "closed": "closed",
            "*": "off"
          }
        },
        "label-3": {
          "at": "/fork-shelter/label"
        },
        "status-3": {
          "at": "/fork-shelter/status",
          "state": {
            "open": "past",
            "busy": "warn",
            "closed": "closed",
            "*": "off"
          }
        },
        "label-4": {
          "at": "/shelter-summit/label"
        },
        "status-4": {
          "at": "/shelter-summit/status",
          "state": {
            "open": "past",
            "busy": "warn",
            "closed": "closed",
            "*": "off"
          }
        },
        "label-5": {
          "at": "/summit-lookout/label"
        },
        "status-5": {
          "at": "/summit-lookout/status",
          "state": {
            "open": "past",
            "busy": "warn",
            "closed": "closed",
            "*": "off"
          }
        },
        "label-6": {
          "at": "/lookout-east/label"
        },
        "status-6": {
          "at": "/lookout-east/status",
          "state": {
            "open": "past",
            "busy": "warn",
            "closed": "closed",
            "*": "off"
          }
        },
        "label-7": {
          "at": "/east-falls/label"
        },
        "status-7": {
          "at": "/east-falls/status",
          "state": {
            "open": "past",
            "busy": "warn",
            "closed": "closed",
            "*": "off"
          }
        }
      }
    }
  },
  "parts": {
    "spot-centre": {
      "as": "element",
      "element": "spot",
      "props": {
        "kind": "gate"
      }
    },
    "spot-east": {
      "as": "element",
      "element": "spot",
      "props": {
        "kind": "gate"
      }
    },
    "spot-fork": {
      "as": "element",
      "element": "spot",
      "props": {
        "kind": "fork"
      }
    },
    "spot-falls": {
      "as": "element",
      "element": "spot",
      "props": {
        "kind": "falls"
      }
    },
    "spot-shelter": {
      "as": "element",
      "element": "spot",
      "props": {
        "kind": "shelter"
      }
    },
    "spot-summit": {
      "as": "element",
      "element": "spot",
      "props": {
        "kind": "summit"
      }
    },
    "spot-lookout": {
      "as": "element",
      "element": "spot",
      "props": {
        "kind": "lookout"
      }
    },
    "card-centre": {
      "as": "element",
      "element": "card",
      "of": "places",
      "bind": {
        "name": "name",
        "status": "status",
        "word": "word",
        "line": "line",
        "note": "note"
      }
    },
    "card-east": {
      "as": "element",
      "element": "card",
      "of": "places",
      "bind": {
        "name": "name-2",
        "status": "status-2",
        "word": "word-2",
        "line": "line-2",
        "note": "note-2"
      }
    },
    "card-falls": {
      "as": "element",
      "element": "card",
      "of": "places",
      "bind": {
        "name": "name-3",
        "status": "status-3",
        "word": "word-3",
        "line": "line-3",
        "note": "note-3"
      }
    },
    "card-shelter": {
      "as": "element",
      "element": "card",
      "of": "places",
      "bind": {
        "name": "name-4",
        "status": "status-4",
        "word": "word-4",
        "line": "line-4",
        "note": "note-4"
      }
    },
    "card-summit": {
      "as": "element",
      "element": "card",
      "of": "places",
      "bind": {
        "name": "name-5",
        "status": "status-5",
        "word": "word-5",
        "line": "line-5",
        "note": "note-5"
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
        "sub": "sub",
        "date": "date",
        "time": "time"
      }
    },
    "weather": {
      "as": "element",
      "element": "weather",
      "of": "weather",
      "bind": {
        "items": "value"
      }
    },
    "notices": {
      "as": "element",
      "element": "notices",
      "of": "notices",
      "bind": {
        "items": "value"
      }
    },
    "walkers": {
      "as": "chart.bar",
      "of": "walkers",
      "title": "시간대별 입산(명)",
      "x": "hour",
      "y": "people",
      "series": [
        {
          "label": "입산",
          "color": "#5f8160"
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
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221600%22%20height%3D%221000%22%20viewBox%3D%220%200%201600%201000%22%3E%0A%3Cdefs%3E%0A%3Cfilter%20id%3D%22paper%22%3E%3CfeTurbulence%20type%3D%22fractalNoise%22%20baseFrequency%3D%22.8%22%20numOctaves%3D%222%22%20seed%3D%2211%22%2F%3E%3CfeColorMatrix%20values%3D%220%200%200%200%20.5%20%200%200%200%200%20.44%20%200%200%200%200%20.34%20%200%200%200%20.08%200%22%2F%3E%3C%2Ffilter%3E%0A%3Cfilter%20id%3D%22bleed1%22%20x%3D%22-20%25%22%20y%3D%22-20%25%22%20width%3D%22140%25%22%20height%3D%22140%25%22%3E%3CfeTurbulence%20type%3D%22fractalNoise%22%20baseFrequency%3D%22.035%22%20numOctaves%3D%224%22%20seed%3D%221%22%20result%3D%22n%22%2F%3E%3CfeDisplacementMap%20in%3D%22SourceGraphic%22%20in2%3D%22n%22%20scale%3D%2256%22%2F%3E%3CfeGaussianBlur%20stdDeviation%3D%221.6%22%2F%3E%3C%2Ffilter%3E%3Cfilter%20id%3D%22bleed2%22%20x%3D%22-20%25%22%20y%3D%22-20%25%22%20width%3D%22140%25%22%20height%3D%22140%25%22%3E%3CfeTurbulence%20type%3D%22fractalNoise%22%20baseFrequency%3D%22.035%22%20numOctaves%3D%224%22%20seed%3D%222%22%20result%3D%22n%22%2F%3E%3CfeDisplacementMap%20in%3D%22SourceGraphic%22%20in2%3D%22n%22%20scale%3D%2256%22%2F%3E%3CfeGaussianBlur%20stdDeviation%3D%221.6%22%2F%3E%3C%2Ffilter%3E%3Cfilter%20id%3D%22bleed3%22%20x%3D%22-20%25%22%20y%3D%22-20%25%22%20width%3D%22140%25%22%20height%3D%22140%25%22%3E%3CfeTurbulence%20type%3D%22fractalNoise%22%20baseFrequency%3D%22.035%22%20numOctaves%3D%224%22%20seed%3D%223%22%20result%3D%22n%22%2F%3E%3CfeDisplacementMap%20in%3D%22SourceGraphic%22%20in2%3D%22n%22%20scale%3D%2256%22%2F%3E%3CfeGaussianBlur%20stdDeviation%3D%221.6%22%2F%3E%3C%2Ffilter%3E%3Cfilter%20id%3D%22bleed4%22%20x%3D%22-20%25%22%20y%3D%22-20%25%22%20width%3D%22140%25%22%20height%3D%22140%25%22%3E%3CfeTurbulence%20type%3D%22fractalNoise%22%20baseFrequency%3D%22.035%22%20numOctaves%3D%224%22%20seed%3D%224%22%20result%3D%22n%22%2F%3E%3CfeDisplacementMap%20in%3D%22SourceGraphic%22%20in2%3D%22n%22%20scale%3D%2256%22%2F%3E%3CfeGaussianBlur%20stdDeviation%3D%221.6%22%2F%3E%3C%2Ffilter%3E%3Cfilter%20id%3D%22bleed5%22%20x%3D%22-20%25%22%20y%3D%22-20%25%22%20width%3D%22140%25%22%20height%3D%22140%25%22%3E%3CfeTurbulence%20type%3D%22fractalNoise%22%20baseFrequency%3D%22.035%22%20numOctaves%3D%224%22%20seed%3D%225%22%20result%3D%22n%22%2F%3E%3CfeDisplacementMap%20in%3D%22SourceGraphic%22%20in2%3D%22n%22%20scale%3D%2256%22%2F%3E%3CfeGaussianBlur%20stdDeviation%3D%221.6%22%2F%3E%3C%2Ffilter%3E%0A%3Cfilter%20id%3D%22wobble%22%3E%3CfeTurbulence%20type%3D%22fractalNoise%22%20baseFrequency%3D%22.03%22%20numOctaves%3D%222%22%20seed%3D%229%22%20result%3D%22n%22%2F%3E%3CfeDisplacementMap%20in%3D%22SourceGraphic%22%20in2%3D%22n%22%20scale%3D%2214%22%2F%3E%3C%2Ffilter%3E%0A%3C%2Fdefs%3E%0A%3Crect%20width%3D%221600%22%20height%3D%221000%22%20fill%3D%22%23f7f2e6%22%2F%3E%0A%3Cg%20filter%3D%22url(%23bleed1)%22%3E%3Cellipse%20cx%3D%22540%22%20cy%3D%22640%22%20rx%3D%22470%22%20ry%3D%22330%22%20transform%3D%22rotate(-8%20540%20640)%22%20fill%3D%22%23a9c28d%22%20fill-opacity%3D%220.38%22%20stroke%3D%22%23a9c28d%22%20stroke-opacity%3D%220.6080000000000001%22%20stroke-width%3D%223%22%2F%3E%3Cellipse%20cx%3D%22300%22%20cy%3D%22760%22%20rx%3D%22260%22%20ry%3D%22220%22%20transform%3D%22rotate(0%20300%20760)%22%20fill%3D%22%23a9c28d%22%20fill-opacity%3D%220.38%22%20stroke%3D%22%23a9c28d%22%20stroke-opacity%3D%220.6080000000000001%22%20stroke-width%3D%223%22%2F%3E%3Cellipse%20cx%3D%22820%22%20cy%3D%22620%22%20rx%3D%22240%22%20ry%3D%22260%22%20transform%3D%22rotate(10%20820%20620)%22%20fill%3D%22%23a9c28d%22%20fill-opacity%3D%220.38%22%20stroke%3D%22%23a9c28d%22%20stroke-opacity%3D%220.6080000000000001%22%20stroke-width%3D%223%22%2F%3E%3C%2Fg%3E%0A%3Cg%20filter%3D%22url(%23bleed2)%22%3E%3Cellipse%20cx%3D%22520%22%20cy%3D%22470%22%20rx%3D%22330%22%20ry%3D%22260%22%20transform%3D%22rotate(-4%20520%20470)%22%20fill%3D%22%237fa06c%22%20fill-opacity%3D%220.36%22%20stroke%3D%22%237fa06c%22%20stroke-opacity%3D%220.576%22%20stroke-width%3D%223%22%2F%3E%3Cellipse%20cx%3D%22400%22%20cy%3D%22560%22%20rx%3D%22200%22%20ry%3D%22170%22%20transform%3D%22rotate(20%20400%20560)%22%20fill%3D%22%237fa06c%22%20fill-opacity%3D%220.36%22%20stroke%3D%22%237fa06c%22%20stroke-opacity%3D%220.576%22%20stroke-width%3D%223%22%2F%3E%3Cellipse%20cx%3D%22700%22%20cy%3D%22520%22%20rx%3D%22180%22%20ry%3D%22200%22%20transform%3D%22rotate(-15%20700%20520)%22%20fill%3D%22%237fa06c%22%20fill-opacity%3D%220.36%22%20stroke%3D%22%237fa06c%22%20stroke-opacity%3D%220.576%22%20stroke-width%3D%223%22%2F%3E%3C%2Fg%3E%0A%3Cg%20filter%3D%22url(%23bleed3)%22%3E%3Cellipse%20cx%3D%22520%22%20cy%3D%22300%22%20rx%3D%22190%22%20ry%3D%22150%22%20transform%3D%22rotate(0%20520%20300)%22%20fill%3D%22%235c7f5d%22%20fill-opacity%3D%220.34%22%20stroke%3D%22%235c7f5d%22%20stroke-opacity%3D%220.544%22%20stroke-width%3D%223%22%2F%3E%3Cellipse%20cx%3D%22430%22%20cy%3D%22380%22%20rx%3D%22110%22%20ry%3D%2290%22%20transform%3D%22rotate(30%20430%20380)%22%20fill%3D%22%235c7f5d%22%20fill-opacity%3D%220.34%22%20stroke%3D%22%235c7f5d%22%20stroke-opacity%3D%220.544%22%20stroke-width%3D%223%22%2F%3E%3Cellipse%20cx%3D%22640%22%20cy%3D%22380%22%20rx%3D%22120%22%20ry%3D%22100%22%20transform%3D%22rotate(-25%20640%20380)%22%20fill%3D%22%235c7f5d%22%20fill-opacity%3D%220.34%22%20stroke%3D%22%235c7f5d%22%20stroke-opacity%3D%220.544%22%20stroke-width%3D%223%22%2F%3E%3C%2Fg%3E%0A%3Cg%20filter%3D%22url(%23bleed4)%22%3E%3Cellipse%20cx%3D%22520%22%20cy%3D%22220%22%20rx%3D%22110%22%20ry%3D%2280%22%20transform%3D%22rotate(0%20520%20220)%22%20fill%3D%22%238a97a8%22%20fill-opacity%3D%220.5%22%20stroke%3D%22%238a97a8%22%20stroke-opacity%3D%220.8%22%20stroke-width%3D%223%22%2F%3E%3Cellipse%20cx%3D%22470%22%20cy%3D%22260%22%20rx%3D%2260%22%20ry%3D%2250%22%20transform%3D%22rotate(0%20470%20260)%22%20fill%3D%22%238a97a8%22%20fill-opacity%3D%220.5%22%20stroke%3D%22%238a97a8%22%20stroke-opacity%3D%220.8%22%20stroke-width%3D%223%22%2F%3E%3C%2Fg%3E%0A%3Cg%20filter%3D%22url(%23bleed5)%22%3E%3Cellipse%20cx%3D%22690%22%20cy%3D%22650%22%20rx%3D%2270%22%20ry%3D%2234%22%20transform%3D%22rotate(38%20690%20650)%22%20fill%3D%22%236f9fc8%22%20fill-opacity%3D%220.5%22%20stroke%3D%22%236f9fc8%22%20stroke-opacity%3D%220.8%22%20stroke-width%3D%223%22%2F%3E%3Cellipse%20cx%3D%22780%22%20cy%3D%22720%22%20rx%3D%2280%22%20ry%3D%2236%22%20transform%3D%22rotate(36%20780%20720)%22%20fill%3D%22%236f9fc8%22%20fill-opacity%3D%220.5%22%20stroke%3D%22%236f9fc8%22%20stroke-opacity%3D%220.8%22%20stroke-width%3D%223%22%2F%3E%3Cellipse%20cx%3D%22880%22%20cy%3D%22800%22%20rx%3D%2290%22%20ry%3D%2240%22%20transform%3D%22rotate(45%20880%20800)%22%20fill%3D%22%236f9fc8%22%20fill-opacity%3D%220.5%22%20stroke%3D%22%236f9fc8%22%20stroke-opacity%3D%220.8%22%20stroke-width%3D%223%22%2F%3E%3Cellipse%20cx%3D%22960%22%20cy%3D%22900%22%20rx%3D%2280%22%20ry%3D%2240%22%20transform%3D%22rotate(60%20960%20900)%22%20fill%3D%22%236f9fc8%22%20fill-opacity%3D%220.5%22%20stroke%3D%22%236f9fc8%22%20stroke-opacity%3D%220.8%22%20stroke-width%3D%223%22%2F%3E%3C%2Fg%3E%0A%3Cellipse%20cx%3D%22520%22%20cy%3D%22230%22%20rx%3D%22120%22%20ry%3D%2280%22%20fill%3D%22none%22%20stroke%3D%22%233b3127%22%20stroke-opacity%3D%22.18%22%20stroke-width%3D%221.5%22%20filter%3D%22url(%23wobble)%22%2F%3E%3Cellipse%20cx%3D%22520%22%20cy%3D%22230%22%20rx%3D%22210%22%20ry%3D%22150%22%20fill%3D%22none%22%20stroke%3D%22%233b3127%22%20stroke-opacity%3D%22.18%22%20stroke-width%3D%221.5%22%20filter%3D%22url(%23wobble)%22%2F%3E%3Cellipse%20cx%3D%22520%22%20cy%3D%22230%22%20rx%3D%22310%22%20ry%3D%22230%22%20fill%3D%22none%22%20stroke%3D%22%233b3127%22%20stroke-opacity%3D%22.18%22%20stroke-width%3D%221.5%22%20filter%3D%22url(%23wobble)%22%2F%3E%3Cellipse%20cx%3D%22520%22%20cy%3D%22230%22%20rx%3D%22410%22%20ry%3D%22320%22%20fill%3D%22none%22%20stroke%3D%22%233b3127%22%20stroke-opacity%3D%22.18%22%20stroke-width%3D%221.5%22%20filter%3D%22url(%23wobble)%22%2F%3E%0A%3Crect%20width%3D%221600%22%20height%3D%221000%22%20filter%3D%22url(%23paper)%22%2F%3E%0A%3Ctext%20x%3D%22384%22%20y%3D%22660%22%20fill%3D%22%237a6d5e%22%20font-size%3D%2217%22%20font-style%3D%22italic%22%20font-family%3D'%22Gowun%20Batang%22%2C%20%22Nanum%20Myeongjo%22%2C%20%22Noto%20Serif%20KR%22%2C%20Batang%2C%20serif'%3E%EA%B0%88%EB%A6%BC%EA%B8%B8%3C%2Ftext%3E%0A%3Ctext%20x%3D%22822%22%20y%3D%22322%22%20fill%3D%22%237a6d5e%22%20font-size%3D%2217%22%20font-style%3D%22italic%22%20font-family%3D'%22Gowun%20Batang%22%2C%20%22Nanum%20Myeongjo%22%2C%20%22Noto%20Serif%20KR%22%2C%20Batang%2C%20serif'%3E%EB%8A%A5%EC%84%A0%20%EC%A0%84%EB%A7%9D%EB%8C%80%3C%2Ftext%3E%0A%3Ctext%20x%3D%22700%22%20y%3D%22790%22%20fill%3D%22%2340698c%22%20font-size%3D%2216%22%20font-style%3D%22italic%22%20font-family%3D'%22Gowun%20Batang%22%2C%20%22Nanum%20Myeongjo%22%2C%20%22Noto%20Serif%20KR%22%2C%20Batang%2C%20serif'%3E%EB%AC%BC%EC%86%8C%EB%A6%AC%20%EA%B3%84%EA%B3%A1%3C%2Ftext%3E%0A%3Cpath%20d%3D%22M%201000%2060%20L%201000%20120%20M%20990%2076%20L%201000%2060%20L%201010%2076%22%20stroke%3D%22%233b3127%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%0A%3Ctext%20x%3D%22993%22%20y%3D%22142%22%20fill%3D%22%233b3127%22%20font-size%3D%2216%22%20font-family%3D'%22Gowun%20Batang%22%2C%20%22Nanum%20Myeongjo%22%2C%20%22Noto%20Serif%20KR%22%2C%20Batang%2C%20serif'%3EN%3C%2Ftext%3E%0A%3Cpath%20d%3D%22M%201086%2040%20C%201084%20300%201090%20700%201086%20960%22%20stroke%3D%22%233b3127%22%20stroke-opacity%3D%22.3%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%0A%3C%2Fsvg%3E",
    "place": {
      "spot-centre": [
        287,
        847,
        26,
        26
      ],
      "spot-east": [
        887,
        787,
        26,
        26
      ],
      "spot-fork": [
        347,
        607,
        26,
        26
      ],
      "spot-falls": [
        627,
        587,
        26,
        26
      ],
      "spot-shelter": [
        317,
        367,
        26,
        26
      ],
      "spot-summit": [
        507,
        187,
        26,
        26
      ],
      "spot-lookout": [
        787,
        317,
        26,
        26
      ],
      "card-centre": [
        340,
        880,
        210,
        90
      ],
      "card-east": [
        820,
        860,
        210,
        90
      ],
      "card-falls": [
        560,
        480,
        210,
        90
      ],
      "card-shelter": [
        60,
        330,
        210,
        90
      ],
      "card-summit": [
        570,
        80,
        210,
        90
      ],
      "legend": [
        600,
        958,
        300,
        30
      ],
      "title": [
        1120,
        30,
        460,
        120
      ],
      "weather": [
        1120,
        170,
        460,
        140
      ],
      "notices": [
        1120,
        330,
        460,
        250
      ],
      "walkers": [
        1120,
        610,
        460,
        260
      ]
    },
    "links": {
      "trail-centre-fork": {
        "from": "spot-centre",
        "to": "spot-fork",
        "label": "{{label}}",
        "show": "status",
        "of": "trails",
        "width": 5
      },
      "trail-fork-falls": {
        "from": "spot-fork",
        "to": "spot-falls",
        "label": "{{label-2}}",
        "show": "status-2",
        "of": "trails",
        "width": 5
      },
      "trail-fork-shelter": {
        "from": "spot-fork",
        "to": "spot-shelter",
        "label": "{{label-3}}",
        "show": "status-3",
        "of": "trails",
        "width": 5
      },
      "trail-shelter-summit": {
        "from": "spot-shelter",
        "to": "spot-summit",
        "label": "{{label-4}}",
        "show": "status-4",
        "of": "trails",
        "width": 5
      },
      "trail-summit-lookout": {
        "from": "spot-summit",
        "to": "spot-lookout",
        "label": "{{label-5}}",
        "show": "status-5",
        "of": "trails",
        "width": 5
      },
      "trail-lookout-east": {
        "from": "spot-lookout",
        "to": "spot-east",
        "label": "{{label-6}}",
        "show": "status-6",
        "of": "trails",
        "width": 5
      },
      "trail-east-falls": {
        "from": "spot-east",
        "to": "spot-falls",
        "label": "{{label-7}}",
        "show": "status-7",
        "of": "trails",
        "width": 5
      }
    }
  }
};

export const parkTrails: SamplePack = {
  id: "park-trails",
  title: {
    "ko": "국립공원 탐방로 — 수채 지도",
    "en": "A national park’s trails — a watercolour map"
  },
  field: {
    "ko": "자연·탐방",
    "en": "Parks & outdoors"
  },
  kind: {
    "ko": "수채로 그린 산 지도",
    "en": "A mountain painted in watercolour"
  },
  domain: "environment",
  styles: [
    "drawing"
  ],
  summary: {
    "ko": "국립공원 탐방지원센터의 탐방로 안내판을 수채 지도로 — 가장자리가 번지는 초록·회청 물감으로 산을, 푸른 물감으로 계곡을, 옅은 세피아 등고선과 종이 결 위에. 탐방로는 그 위에 잉크로: 남색 열림, 황토 혼잡, 진홍 점선 통제 — 구간마다 길이와 상태. 탐방지원센터·계곡 입구·폭포·대피소·정상에 카드(주차 잔여, 대피소 자리, 정상 바람과 입산 마감), 오른쪽에 산의 날씨(정상 기온·능선 바람·일몰), 오늘의 안내, 시간대별 입산. 공원은 지어낸 것이라 예시 데이터입니다.",
    "en": "A national park’s trail board painted as a watercolour map — the mountain in sap green and slate washes that bleed at their edges, the stream in a blue wash, faint sepia contours on grained paper. The trails over it in ink: indigo open, ochre crowded, carmine and dashed closed, each with its length and state. Cards at the gates, the falls, the shelter and the summit (parking left, seats at the shelter, the summit’s wind and entry cut-off), and on the right the mountain’s weather (the summit’s temperature, the ridge’s wind, sunset), the day’s notices and walkers by the hour. The park is made up. Example data."
  },
  connectors: [
    {
      "key": "park",
      "name": "예시 국립공원 탐방 API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 국립공원이 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
