// The visitor board at a royal palace's ticket gate, drawn on hanji in ink with the five colours of dancheong: the
// palace's plan along its north–south axis — the gates, the throne hall's courtyard, the council and living halls, the
// crown prince's quarters and the rear garden's pond — drawn with a brush, and on each hall a card saying how crowded it
// is (blue calm, yellow busy, red crowded), the next guided tour and what is open only today. On the right the day's
// visitors, the timed tickets left for the rear garden, the tours and the visitors by the hour, sealed in red as an
// old document is. The palace is made up, so the values are example data written for it.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/palace-visit.js';

const board: Board = {
  "board": {
    "theme": "light",
    "accent": "#b5342b"
  },
  "elements": {
    "title": {
      "template": "<header class=\"tt\"><h1>{{name}}</h1><i>觀覽</i><p>{{sub}}<br/>{{date}} <b>{{time}}</b></p></header>",
      "style": ".tt{height:100%;box-sizing:border-box;display:flex;align-items:center;gap:18px;font-family:\"Nanum Myeongjo\", \"Noto Serif KR\", Batang, \"AppleMyungjo\", serif;color:#2a2622}\nh1{margin:0;font-size:46px;font-weight:800;letter-spacing:.12em}\ni{font-style:normal;display:grid;place-items:center;width:58px;height:58px;border:3px solid #b5342b;color:#b5342b;font-size:20px;font-weight:800;line-height:1;writing-mode:vertical-rl;transform:rotate(-4deg)}\np{margin:0;font-size:17px;color:#6f6559;line-height:1.5}\nb{color:#2a2622;font-size:22px}",
      "props": {
        "name": "string",
        "sub": "string",
        "date": "string",
        "time": "string"
      }
    },
    "hall": {
      "template": "<section class=\"hc {{crowd}}\"><header><b>{{name}}</b><span>{{word}}</span></header><p><strong>{{people}}</strong>명 · {{next}}</p>{{#special}}<em>{{special}}</em>{{/special}}</section>",
      "style": ".hc{--c:#1f5f8b;height:100%;box-sizing:border-box;display:grid;align-content:center;gap:2px;padding:6px 10px;background:rgba(250,245,234,.94);border:2px solid #2a2622;box-shadow:inset 0 5px 0 var(--c);font-family:\"Nanum Myeongjo\", \"Noto Serif KR\", Batang, \"AppleMyungjo\", serif;color:#2a2622}\n.busy{--c:#c99a06}.crowded{--c:#b5342b}\nheader{display:flex;justify-content:space-between;align-items:baseline;gap:8px;margin-top:4px}\nb{font-size:20px;font-weight:800;letter-spacing:.06em}\nspan{font-size:14px;font-weight:700;color:var(--c)}\np{margin:0;font-size:14px;color:#6f6559;white-space:nowrap}\nstrong{font-size:18px;color:#2a2622}\nem{font-style:normal;font-size:13px;font-weight:700;color:#3e7d4f;white-space:nowrap}",
      "props": {
        "name": "string",
        "crowd": "string",
        "word": "string",
        "people": "number",
        "next": "string",
        "special": "string"
      }
    },
    "legend": {
      "template": "<ul class=\"lg\"><li><i style=\"background:#1f5f8b\"></i>여유</li><li><i style=\"background:#c99a06\"></i>보통</li><li><i style=\"background:#b5342b\"></i>붐빔</li><li><i style=\"background:#3e7d4f\"></i>오늘만 개방</li></ul>",
      "style": ".lg{height:100%;box-sizing:border-box;margin:0;padding:0;list-style:none;display:flex;align-items:center;gap:18px;font:600 15px \"Nanum Myeongjo\", \"Noto Serif KR\", Batang, \"AppleMyungjo\", serif;color:#2a2622}\nli{display:flex;align-items:center;gap:6px}\ni{width:22px;height:8px}"
    },
    "figures": {
      "template": "<dl class=\"fg\">{{#items}}<div class=\"{{#red}}red{{/red}}\"><dt>{{label}}</dt><dd>{{value}}</dd><small>{{note}}</small></div>{{/items}}</dl>",
      "style": ".fg{margin:0;height:100%;box-sizing:border-box;display:grid;grid-template-columns:repeat(3,1fr);border-top:3px double #2a2622;border-bottom:3px double #2a2622;font-family:\"Nanum Myeongjo\", \"Noto Serif KR\", Batang, \"AppleMyungjo\", serif;color:#2a2622}\ndiv{padding:12px 10px;border-right:1px solid rgba(42,38,34,.25)}\ndiv:last-child{border-right:0}\ndt{font-size:14px;color:#6f6559}\ndd{margin:4px 0 0;font-size:34px;font-weight:800;font-variant-numeric:tabular-nums}\n.red dd{color:#b5342b}\nsmall{font-size:12px;color:#6f6559}",
      "props": {
        "items": "list"
      }
    },
    "tours": {
      "template": "<section class=\"tr\"><h3>{{heading}}</h3><ol>{{#items}}<li class=\"{{#full}}full{{/full}}\"><b>{{time}}</b><span>{{lang}} · {{from}}</span><em>{{left}}</em></li>{{/items}}</ol></section>",
      "style": ".tr{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr;gap:6px;font-family:\"Nanum Myeongjo\", \"Noto Serif KR\", Batang, \"AppleMyungjo\", serif;color:#2a2622}\nh3{margin:0;font-size:20px;font-weight:800;letter-spacing:.1em;border-bottom:2px solid #2a2622;padding-bottom:4px}\nol{margin:0;padding:0;list-style:none;display:grid;align-content:start}\nli{display:grid;grid-template-columns:64px 1fr auto;gap:10px;align-items:baseline;padding:6px 0;border-bottom:1px dotted rgba(42,38,34,.4);font-size:15px}\nb{font-size:18px;font-variant-numeric:tabular-nums}\nem{font-style:normal;font-weight:800;color:#1f5f8b}\n.full em{color:#b5342b}",
      "props": {
        "heading": "string",
        "items": "list"
      }
    }
  },
  "data": {
    "now": {
      "from": "palace",
      "path": "/palace/now",
      "time": "updatedAt",
      "fresh": 900,
      "fields": {
        "name": {},
        "sub": {},
        "date": {},
        "time": {}
      }
    },
    "halls": {
      "from": "palace",
      "path": "/palace/halls",
      "time": "updatedAt",
      "fresh": 900,
      "fields": {
        "name": {
          "at": "/gate/name"
        },
        "crowd": {
          "at": "/gate/crowd"
        },
        "word": {
          "at": "/gate/word"
        },
        "people": {
          "at": "/gate/people"
        },
        "next": {
          "at": "/gate/next"
        },
        "name-2": {
          "at": "/throne/name"
        },
        "crowd-2": {
          "at": "/throne/crowd"
        },
        "word-2": {
          "at": "/throne/word"
        },
        "people-2": {
          "at": "/throne/people"
        },
        "next-2": {
          "at": "/throne/next"
        },
        "name-3": {
          "at": "/council/name"
        },
        "crowd-3": {
          "at": "/council/crowd"
        },
        "word-3": {
          "at": "/council/word"
        },
        "people-3": {
          "at": "/council/people"
        },
        "next-3": {
          "at": "/council/next"
        },
        "name-4": {
          "at": "/living/name"
        },
        "crowd-4": {
          "at": "/living/crowd"
        },
        "word-4": {
          "at": "/living/word"
        },
        "people-4": {
          "at": "/living/people"
        },
        "next-4": {
          "at": "/living/next"
        },
        "name-5": {
          "at": "/prince/name"
        },
        "crowd-5": {
          "at": "/prince/crowd"
        },
        "word-5": {
          "at": "/prince/word"
        },
        "people-5": {
          "at": "/prince/people"
        },
        "next-5": {
          "at": "/prince/next"
        },
        "name-6": {
          "at": "/pavilion/name"
        },
        "crowd-6": {
          "at": "/pavilion/crowd"
        },
        "word-6": {
          "at": "/pavilion/word"
        },
        "people-6": {
          "at": "/pavilion/people"
        },
        "next-6": {
          "at": "/pavilion/next"
        },
        "special": {
          "at": "/pavilion/special"
        }
      }
    },
    "figures": {
      "from": "palace",
      "path": "/palace/figures",
      "time": "updatedAt",
      "fresh": 900,
      "fields": {
        "value": {}
      }
    },
    "tours": {
      "from": "palace",
      "path": "/palace/tours",
      "time": "updatedAt",
      "fresh": 900,
      "fields": {
        "value": {}
      }
    },
    "visitors": {
      "from": "palace",
      "path": "/palace/visitors",
      "list": "/value",
      "fresh": 900,
      "answerTime": "/updatedAt"
    },
    "notices": {
      "from": "palace",
      "path": "/palace/notices",
      "time": "updatedAt",
      "fresh": 900,
      "fields": {
        "value": {}
      }
    }
  },
  "parts": {
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
    "hall-gate": {
      "as": "element",
      "element": "hall",
      "of": "halls",
      "props": {
        "special": ""
      },
      "bind": {
        "name": "name",
        "crowd": "crowd",
        "word": "word",
        "people": "people",
        "next": "next"
      }
    },
    "hall-throne": {
      "as": "element",
      "element": "hall",
      "of": "halls",
      "props": {
        "special": ""
      },
      "bind": {
        "name": "name-2",
        "crowd": "crowd-2",
        "word": "word-2",
        "people": "people-2",
        "next": "next-2"
      }
    },
    "hall-council": {
      "as": "element",
      "element": "hall",
      "of": "halls",
      "props": {
        "special": ""
      },
      "bind": {
        "name": "name-3",
        "crowd": "crowd-3",
        "word": "word-3",
        "people": "people-3",
        "next": "next-3"
      }
    },
    "hall-living": {
      "as": "element",
      "element": "hall",
      "of": "halls",
      "props": {
        "special": ""
      },
      "bind": {
        "name": "name-4",
        "crowd": "crowd-4",
        "word": "word-4",
        "people": "people-4",
        "next": "next-4"
      }
    },
    "hall-prince": {
      "as": "element",
      "element": "hall",
      "of": "halls",
      "props": {
        "special": ""
      },
      "bind": {
        "name": "name-5",
        "crowd": "crowd-5",
        "word": "word-5",
        "people": "people-5",
        "next": "next-5"
      }
    },
    "hall-pavilion": {
      "as": "element",
      "element": "hall",
      "of": "halls",
      "bind": {
        "name": "name-6",
        "crowd": "crowd-6",
        "word": "word-6",
        "people": "people-6",
        "next": "next-6",
        "special": "special"
      }
    },
    "legend": {
      "as": "element",
      "element": "legend"
    },
    "figures": {
      "as": "element",
      "element": "figures",
      "of": "figures",
      "bind": {
        "items": "value"
      }
    },
    "tours": {
      "as": "element",
      "element": "tours",
      "of": "tours",
      "props": {
        "heading": "해설 일정"
      },
      "bind": {
        "items": "value"
      }
    },
    "visitors": {
      "as": "chart.line",
      "of": "visitors",
      "title": "시간대별 입장(명)",
      "x": "hour",
      "y": [
        "today",
        "usual"
      ],
      "series": [
        {
          "label": "오늘",
          "color": "#b5342b"
        },
        {
          "label": "평소 수요일",
          "color": "#6f6559",
          "lineStyle": "dashed",
          "symbol": "none"
        }
      ]
    },
    "notice": {
      "as": "element",
      "element": "tours",
      "of": "notices",
      "props": {
        "heading": "오늘의 안내"
      },
      "bind": {
        "items": "value"
      }
    }
  },
  "layout": {
    "kind": "canvas",
    "size": [
      1600,
      1000
    ],
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221600%22%20height%3D%221000%22%20viewBox%3D%220%200%201600%201000%22%3E%0A%3Cdefs%3E%3Cfilter%20id%3D%22paper%22%3E%3CfeTurbulence%20type%3D%22fractalNoise%22%20baseFrequency%3D%22.9%22%20numOctaves%3D%222%22%20seed%3D%227%22%2F%3E%3CfeColorMatrix%20values%3D%220%200%200%200%20.55%20%200%200%200%200%20.48%20%200%200%200%200%20.38%20%200%200%200%20.09%200%22%2F%3E%3C%2Ffilter%3E%3C%2Fdefs%3E%0A%3Crect%20width%3D%221600%22%20height%3D%221000%22%20fill%3D%22%23f2e8d5%22%2F%3E%0A%3Crect%20width%3D%221600%22%20height%3D%221000%22%20filter%3D%22url(%23paper)%22%2F%3E%0A%3Cpath%20d%3D%22M%20510%20960%20V%20160%22%20stroke%3D%22%23b5342b%22%20stroke-opacity%3D%22.35%22%20stroke-width%3D%226%22%20stroke-dasharray%3D%222%2014%22%20stroke-linecap%3D%22round%22%2F%3E%0A%3Cpath%20d%3D%22M%20260%20960%20V%2090%20H%201020%20V%20960%20Z%22%20fill%3D%22none%22%20stroke%3D%22%232a2622%22%20stroke-opacity%3D%22.18%22%20stroke-width%3D%2212%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20260%20960%20V%2090%20H%201020%20V%20960%20Z%22%20fill%3D%22none%22%20stroke%3D%22%232a2622%22%20stroke-width%3D%224%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%0A%3Cpath%20d%3D%22M%20360%20960%20V%20470%20H%20660%20V%20960%22%20fill%3D%22none%22%20stroke%3D%22%232a2622%22%20stroke-opacity%3D%22.18%22%20stroke-width%3D%226%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20360%20960%20V%20470%20H%20660%20V%20960%22%20fill%3D%22none%22%20stroke%3D%22%232a2622%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20360%20470%20V%20200%20H%20660%20V%20470%22%20fill%3D%22none%22%20stroke%3D%22%232a2622%22%20stroke-opacity%3D%22.18%22%20stroke-width%3D%226%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20360%20470%20V%20200%20H%20660%20V%20470%22%20fill%3D%22none%22%20stroke%3D%22%232a2622%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%0A%3Cellipse%20cx%3D%22800%22%20cy%3D%22170%22%20rx%3D%22120%22%20ry%3D%2280%22%20fill%3D%22%23cfdccf%22%20opacity%3D%22.8%22%2F%3E%3Cpath%20d%3D%22M%20680%20170%20C%20680%20100%20920%20100%20920%20170%20C%20920%20240%20680%20240%20680%20170%22%20fill%3D%22none%22%20stroke%3D%22%232a2622%22%20stroke-opacity%3D%22.18%22%20stroke-width%3D%227.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20680%20170%20C%20680%20100%20920%20100%20920%20170%20C%20920%20240%20680%20240%20680%20170%22%20fill%3D%22none%22%20stroke%3D%22%232a2622%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20720%20255%20L%20790%20215%22%20fill%3D%22none%22%20stroke%3D%22%232a2622%22%20stroke-opacity%3D%22.18%22%20stroke-width%3D%226%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20720%20255%20L%20790%20215%22%20fill%3D%22none%22%20stroke%3D%22%232a2622%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%0A%3Crect%20x%3D%22422%22%20y%3D%22834%22%20width%3D%22176%22%20height%3D%2268%22%20fill%3D%22%23e6d8bd%22%2F%3E%0A%3Cpath%20d%3D%22M%20406%20846%20Q%20510%20826%20614%20846%22%20fill%3D%22none%22%20stroke%3D%22%232a2622%22%20stroke-opacity%3D%22.18%22%20stroke-width%3D%2210.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20406%20846%20Q%20510%20826%20614%20846%22%20fill%3D%22none%22%20stroke%3D%22%232a2622%22%20stroke-width%3D%223.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%0A%3Cpath%20d%3D%22M%20430%20850%20H%20590%20V%20896%20H%20430%20Z%22%20fill%3D%22none%22%20stroke%3D%22%232a2622%22%20stroke-opacity%3D%22.18%22%20stroke-width%3D%226%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20430%20850%20H%20590%20V%20896%20H%20430%20Z%22%20fill%3D%22none%22%20stroke%3D%22%232a2622%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%0A%3Crect%20x%3D%22392%22%20y%3D%22514%22%20width%3D%22236%22%20height%3D%22122%22%20fill%3D%22%23e6d8bd%22%2F%3E%0A%3Cpath%20d%3D%22M%20376%20526%20Q%20510%20506%20644%20526%22%20fill%3D%22none%22%20stroke%3D%22%232a2622%22%20stroke-opacity%3D%22.18%22%20stroke-width%3D%2210.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20376%20526%20Q%20510%20506%20644%20526%22%20fill%3D%22none%22%20stroke%3D%22%232a2622%22%20stroke-width%3D%223.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%0A%3Cpath%20d%3D%22M%20400%20530%20H%20620%20V%20630%20H%20400%20Z%22%20fill%3D%22none%22%20stroke%3D%22%232a2622%22%20stroke-opacity%3D%22.18%22%20stroke-width%3D%226%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20400%20530%20H%20620%20V%20630%20H%20400%20Z%22%20fill%3D%22none%22%20stroke%3D%22%232a2622%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%0A%3Crect%20x%3D%22412%22%20y%3D%22374%22%20width%3D%22196%22%20height%3D%2282%22%20fill%3D%22%23e6d8bd%22%2F%3E%0A%3Cpath%20d%3D%22M%20396%20386%20Q%20510%20366%20624%20386%22%20fill%3D%22none%22%20stroke%3D%22%232a2622%22%20stroke-opacity%3D%22.18%22%20stroke-width%3D%2210.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20396%20386%20Q%20510%20366%20624%20386%22%20fill%3D%22none%22%20stroke%3D%22%232a2622%22%20stroke-width%3D%223.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%0A%3Cpath%20d%3D%22M%20420%20390%20H%20600%20V%20450%20H%20420%20Z%22%20fill%3D%22none%22%20stroke%3D%22%232a2622%22%20stroke-opacity%3D%22.18%22%20stroke-width%3D%226%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20420%20390%20H%20600%20V%20450%20H%20420%20Z%22%20fill%3D%22none%22%20stroke%3D%22%232a2622%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%0A%3Crect%20x%3D%22412%22%20y%3D%22244%22%20width%3D%22196%22%20height%3D%2282%22%20fill%3D%22%23e6d8bd%22%2F%3E%0A%3Cpath%20d%3D%22M%20396%20256%20Q%20510%20236%20624%20256%22%20fill%3D%22none%22%20stroke%3D%22%232a2622%22%20stroke-opacity%3D%22.18%22%20stroke-width%3D%2210.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20396%20256%20Q%20510%20236%20624%20256%22%20fill%3D%22none%22%20stroke%3D%22%232a2622%22%20stroke-width%3D%223.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%0A%3Cpath%20d%3D%22M%20420%20260%20H%20600%20V%20320%20H%20420%20Z%22%20fill%3D%22none%22%20stroke%3D%22%232a2622%22%20stroke-opacity%3D%22.18%22%20stroke-width%3D%226%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20420%20260%20H%20600%20V%20320%20H%20420%20Z%22%20fill%3D%22none%22%20stroke%3D%22%232a2622%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%0A%3Crect%20x%3D%22752%22%20y%3D%22414%22%20width%3D%22166%22%20height%3D%22102%22%20fill%3D%22%23e6d8bd%22%2F%3E%0A%3Cpath%20d%3D%22M%20736%20426%20Q%20835%20406%20934%20426%22%20fill%3D%22none%22%20stroke%3D%22%232a2622%22%20stroke-opacity%3D%22.18%22%20stroke-width%3D%2210.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20736%20426%20Q%20835%20406%20934%20426%22%20fill%3D%22none%22%20stroke%3D%22%232a2622%22%20stroke-width%3D%223.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%0A%3Cpath%20d%3D%22M%20760%20430%20H%20910%20V%20510%20H%20760%20Z%22%20fill%3D%22none%22%20stroke%3D%22%232a2622%22%20stroke-opacity%3D%22.18%22%20stroke-width%3D%226%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20760%20430%20H%20910%20V%20510%20H%20760%20Z%22%20fill%3D%22none%22%20stroke%3D%22%232a2622%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%0A%3Cpath%20d%3D%22M%20800%20150%20L%20820%20130%20L%20840%20150%20L%20820%20170%20Z%22%20fill%3D%22none%22%20stroke%3D%22%232a2622%22%20stroke-opacity%3D%22.18%22%20stroke-width%3D%227.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20800%20150%20L%20820%20130%20L%20840%20150%20L%20820%20170%20Z%22%20fill%3D%22none%22%20stroke%3D%22%232a2622%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%0A%3Ctext%20x%3D%22290%22%20y%3D%22940%22%20fill%3D%22%236f6559%22%20font-size%3D%2218%22%20font-family%3D'%22Nanum%20Myeongjo%22%2C%20%22Noto%20Serif%20KR%22%2C%20Batang%2C%20%22AppleMyungjo%22%2C%20serif'%3E%EB%82%A8%EC%AA%BD%20%E2%86%93%20%EB%A7%A4%ED%91%9C%EC%86%8C%3C%2Ftext%3E%0A%3Ctext%20x%3D%22700%22%20y%3D%22290%22%20fill%3D%22%233e7d4f%22%20font-size%3D%2220%22%20font-family%3D'%22Nanum%20Myeongjo%22%2C%20%22Noto%20Serif%20KR%22%2C%20Batang%2C%20%22AppleMyungjo%22%2C%20serif'%20font-weight%3D%22700%22%3E%ED%9B%84%EC%9B%90%20%C2%B7%20%EC%8B%9C%EA%B0%84%EC%A0%9C%20%EC%9E%85%EC%9E%A5%3C%2Ftext%3E%0A%3Cline%20x1%3D%221080%22%20y1%3D%2260%22%20x2%3D%221080%22%20y2%3D%22940%22%20stroke%3D%22%232a2622%22%20stroke-opacity%3D%22.35%22%20stroke-width%3D%222%22%2F%3E%0A%3C%2Fsvg%3E",
    "place": {
      "title": [
        1110,
        24,
        470,
        80
      ],
      "hall-gate": [
        620,
        830,
        190,
        82
      ],
      "hall-throne": [
        650,
        560,
        190,
        82
      ],
      "hall-council": [
        140,
        372,
        190,
        82
      ],
      "hall-living": [
        140,
        242,
        190,
        82
      ],
      "hall-prince": [
        740,
        316,
        190,
        82
      ],
      "hall-pavilion": [
        880,
        70,
        190,
        100
      ],
      "legend": [
        270,
        965,
        520,
        30
      ],
      "figures": [
        1110,
        124,
        470,
        120
      ],
      "tours": [
        1110,
        268,
        470,
        210
      ],
      "visitors": [
        1110,
        500,
        470,
        280
      ],
      "notice": [
        1110,
        800,
        470,
        160
      ]
    }
  }
};

export const palaceVisit: SamplePack = {
  id: "palace-visit",
  title: {
    "ko": "궁궐 관람 현황 — 한지와 단청",
    "en": "A royal palace’s visitors — on hanji, in dancheong colours"
  },
  field: {
    "ko": "문화유산·관광",
    "en": "Cultural heritage & tourism"
  },
  kind: {
    "ko": "붓으로 그린 궁궐 배치도",
    "en": "A palace plan drawn with a brush"
  },
  domain: "leisure",
  styles: [
    "korean"
  ],
  summary: {
    "ko": "궁궐 매표소 앞 관람 안내판을 한지에 먹과 단청 오방색으로 — 남북 축을 따라 붓으로 그린 배치도(정문·정전 마당·편전·침전·동궁·후원 연못과 정자) 위에 전각마다 카드: 혼잡도(청 여유·황 보통·적 붐빔), 지금 관람객, 다음 해설, 오늘만 개방. 오른쪽에 붉은 낙관을 찍은 제목, 오늘 관람객·후원 시간제 입장 잔여·한복 관람객, 해설 일정(언어·남은 자리), 시간대별 입장(평소 수요일과 비교), 안내 사항. 궁궐은 지어낸 것이라 예시 데이터입니다.",
    "en": "The visitor board at a royal palace’s ticket gate, on hanji in ink with dancheong’s five colours — the palace’s plan drawn with a brush along its north–south axis (the gate, the throne hall’s courtyard, the council and living halls, the crown prince’s quarters, the rear garden’s pond and pavilion), with a card on each hall: how crowded it is (blue calm, yellow busy, red crowded), visitors there now, the next guided tour and what is open only today. On the right a title sealed in red, the day’s visitors, timed tickets left for the rear garden and visitors in hanbok, the tours with their languages and places left, entries by the hour against a usual Wednesday, and notices. The palace is made up. Example data."
  },
  connectors: [
    {
      "key": "palace",
      "name": "예시 궁궐 관람 API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 궁궐이 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
