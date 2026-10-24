// An island group's drone deliveries drawn as a vintage airline route map: a pale sea with wave strokes, cream islands
// with hatched hills, a compass rose, and every route an arc from the base to a stop. A route carries its flight as an
// airline map carried its services — a solid red arc with the minutes to arrival while a drone is on it, a dashed navy
// arc with the departure time when one is due, a dotted orange arc when the wind holds it, a thin grey arc once the
// drop is made. Every stop is a luggage label with what it gets today and a stamp for its state. On the right the
// service's banner, the figures now, the key, the drones in the fleet and the drops through the day. The islands and
// the service are made up, so the values are example data.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/drone-routes.js';

const board: Board = {
  "board": {
    "theme": "light",
    "accent": "#c8342b"
  },
  "statuses": {
    "due": {
      "tone": "next",
      "emphasis": "hatch"
    },
    "hold": {
      "tone": "warn",
      "emphasis": "blink"
    }
  },
  "elements": {
    "base": {
      "template": "<article class=\"bs\"><small>BASE</small><b>{{b.name}}</b><p>{{b.word}}</p></article>",
      "style": ".bs{height:100%;box-sizing:border-box;display:grid;align-content:center;justify-items:center;gap:2px;background:#203a5c;border:3px double #fbf3df;border-radius:50%;font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#fbf3df;text-align:center}\nsmall{font:700 11px \"Futura\", \"Century Gothic\", \"Malgun Gothic\", sans-serif;letter-spacing:.3em}\nb{font:800 17px \"Futura\", \"Century Gothic\", \"Malgun Gothic\", sans-serif}\np{margin:0;font-size:12px}",
      "props": {
        "b": "object"
      }
    },
    "stop": {
      "template": "<article class=\"lb {{s.state}}\"><header><b>{{s.name}}</b><i></i></header><p>{{s.cargo}}</p><small>{{s.word}}</small></article>",
      "style": ".lb{position:relative;height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr auto;gap:2px;padding:8px 12px 8px 22px;background:#fbf3df;border:2px solid #203a5c;border-radius:4px 22px 22px 4px;font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#203a5c}\n.lb::before{content:\"\";position:absolute;left:7px;top:50%;width:8px;height:8px;margin-top:-4px;border-radius:50%;border:2px solid #203a5c;background:#bfdcd6}\nheader{display:flex;justify-content:space-between;align-items:center;gap:6px}\nb{font:800 15px \"Futura\", \"Century Gothic\", \"Malgun Gothic\", sans-serif;white-space:nowrap}\ni{display:grid;place-items:center;width:24px;height:24px;border-radius:50%;font:900 12px \"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;font-style:normal;color:#fff;transform:rotate(-12deg)}\np{margin:0;font-size:13px;font-weight:700}\nsmall{font-size:12px;font-weight:800}\n.flying i{background:#c8342b}\n.flying i::before{content:\"▶\"}\n.flying small{color:#c8342b}\n.due i{background:#203a5c}\n.due i::before{content:\"◷\"}\n.hold i{background:#e08a1e}\n.hold i::before{content:\"▲\"}\n.hold small{color:#9a5a00}\n.done{opacity:.8}\n.done i{background:#8a8f93}\n.done i::before{content:\"✓\"}\n.done small{color:#8a8f93}",
      "props": {
        "s": "object"
      }
    },
    "banner": {
      "template": "<header class=\"bn\"><small>{{t.series}}</small><h1>{{t.name}}</h1><div><span>{{t.date}}</span><b>{{t.time}}</b></div></header>",
      "style": ".bn{height:100%;box-sizing:border-box;display:grid;align-content:center;gap:6px;padding:14px 24px;background:linear-gradient(160deg,#c8342b 0 58%,#203a5c 58%);border-radius:10px;font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#fbf3df}\nsmall{font:700 13px \"Futura\", \"Century Gothic\", \"Malgun Gothic\", sans-serif;letter-spacing:.24em}\nh1{margin:0;font:800 38px \"Futura\", \"Century Gothic\", \"Malgun Gothic\", sans-serif;letter-spacing:.04em}\ndiv{display:flex;justify-content:space-between;align-items:baseline}\nspan{font-size:16px}\nb{font:800 26px \"Futura\", \"Century Gothic\", \"Malgun Gothic\", sans-serif;background:#fbf3df;color:#203a5c;padding:0 12px;border-radius:4px}",
      "props": {
        "t": "object"
      }
    },
    "figures": {
      "template": "<dl class=\"fg\">{{#items}}<div><dt>{{label}}</dt><dd>{{value}}</dd><small>{{note}}</small></div>{{/items}}</dl>",
      "style": ".fg{margin:0;height:100%;box-sizing:border-box;display:grid;grid-template-columns:repeat(3,1fr);gap:12px;font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#203a5c}\ndiv{display:grid;align-content:center;justify-items:center;text-align:center;background:#ffffff;border:2px solid #203a5c;border-radius:8px}\ndt{font-size:13px;font-weight:700}\ndd{margin:0;font:800 30px \"Futura\", \"Century Gothic\", \"Malgun Gothic\", sans-serif;color:#c8342b}\nsmall{font-size:12px}",
      "props": {
        "items": "list"
      }
    },
    "legend": {
      "template": "<ul class=\"ky\"><li><i class=\"fly\"></i>비행 중</li><li><i class=\"due\"></i>출발 예정</li><li><i class=\"hold\"></i>바람 보류</li><li><i class=\"done\"></i>배송 완료</li></ul>",
      "style": ".ky{height:100%;box-sizing:border-box;margin:0;padding:0 18px;list-style:none;display:flex;align-items:center;justify-content:space-between;background:#ffffff;border:2px solid #203a5c;border-radius:999px;font:800 14px \"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#203a5c}\nli{display:flex;align-items:center;gap:8px}\ni{display:inline-block;width:34px;height:0;border-top:4px solid}\n.fly{border-color:#c8342b}\n.due{border-top-style:dashed;border-color:#203a5c}\n.hold{border-top-style:dotted;border-color:#e08a1e}\n.done{border-top-width:2px;border-color:#8a8f93}"
    },
    "drones": {
      "template": "<section class=\"dr\"><h2>기체 현황</h2><ol>{{#items}}<li class=\"{{state}}\"><b>{{id}}</b><span>{{job}}</span><div class=\"bat\" style=\"--v: {{battery}}\"><i></i></div><small>{{battery}}%</small></li>{{/items}}</ol></section>",
      "style": ".dr{height:100%;box-sizing:border-box;padding:12px 18px;background:#ffffff;border:2px solid #203a5c;border-radius:10px;font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#203a5c}\nh2{margin:0 0 6px;font:800 17px \"Futura\", \"Century Gothic\", \"Malgun Gothic\", sans-serif;letter-spacing:.1em}\nol{margin:0;padding:0;list-style:none;display:grid;gap:4px}\nli{display:grid;grid-template-columns:54px 1fr 90px 42px;align-items:center;gap:10px;font-size:14px}\nb{font:800 14px \"Futura\", \"Century Gothic\", \"Malgun Gothic\", sans-serif}\n.bat{height:10px;border:2px solid #203a5c;border-radius:3px;position:relative}\n.bat i{position:absolute;left:0;top:0;bottom:0;width:calc(var(--v) * 1%);background:#203a5c}\nsmall{text-align:right;font-weight:800}\n.flying b{color:#c8342b}\n.charging .bat i{background:#e08a1e}",
      "props": {
        "items": "list"
      }
    }
  },
  "data": {
    "base": {
      "from": "fleet",
      "path": "/fleet/base",
      "time": "updatedAt",
      "fresh": 120,
      "fields": {
        "value": {}
      }
    },
    "stops": {
      "from": "fleet",
      "path": "/fleet/stops",
      "time": "updatedAt",
      "fresh": 120,
      "fields": {
        "light": {
          "at": "/value/light"
        },
        "north": {
          "at": "/value/north"
        },
        "salt": {
          "at": "/value/salt"
        },
        "clinic": {
          "at": "/value/clinic"
        },
        "school": {
          "at": "/value/school"
        },
        "harbour": {
          "at": "/value/harbour"
        },
        "farm": {
          "at": "/value/farm"
        },
        "route": {
          "at": "/value/light/route"
        },
        "state": {
          "at": "/value/light/state",
          "state": {
            "flying": "alarm",
            "due": "due",
            "hold": "hold",
            "done": "idle",
            "*": "next"
          }
        },
        "route-2": {
          "at": "/value/north/route"
        },
        "state-2": {
          "at": "/value/north/state",
          "state": {
            "flying": "alarm",
            "due": "due",
            "hold": "hold",
            "done": "idle",
            "*": "next"
          }
        },
        "route-3": {
          "at": "/value/salt/route"
        },
        "state-3": {
          "at": "/value/salt/state",
          "state": {
            "flying": "alarm",
            "due": "due",
            "hold": "hold",
            "done": "idle",
            "*": "next"
          }
        },
        "route-4": {
          "at": "/value/clinic/route"
        },
        "state-4": {
          "at": "/value/clinic/state",
          "state": {
            "flying": "alarm",
            "due": "due",
            "hold": "hold",
            "done": "idle",
            "*": "next"
          }
        },
        "route-5": {
          "at": "/value/school/route"
        },
        "state-5": {
          "at": "/value/school/state",
          "state": {
            "flying": "alarm",
            "due": "due",
            "hold": "hold",
            "done": "idle",
            "*": "next"
          }
        },
        "route-6": {
          "at": "/value/harbour/route"
        },
        "state-6": {
          "at": "/value/harbour/state",
          "state": {
            "flying": "alarm",
            "due": "due",
            "hold": "hold",
            "done": "idle",
            "*": "next"
          }
        },
        "route-7": {
          "at": "/value/farm/route"
        },
        "state-7": {
          "at": "/value/farm/state",
          "state": {
            "flying": "alarm",
            "due": "due",
            "hold": "hold",
            "done": "idle",
            "*": "next"
          }
        }
      }
    },
    "now": {
      "from": "fleet",
      "path": "/fleet/now",
      "time": "updatedAt",
      "fresh": 120,
      "fields": {
        "value": {}
      }
    },
    "figures": {
      "from": "fleet",
      "path": "/fleet/figures",
      "time": "updatedAt",
      "fresh": 120,
      "fields": {
        "value": {}
      }
    },
    "drones": {
      "from": "fleet",
      "path": "/fleet/drones",
      "time": "updatedAt",
      "fresh": 120,
      "fields": {
        "value": {}
      }
    },
    "drops": {
      "from": "fleet",
      "path": "/fleet/drops",
      "list": "/value",
      "fresh": 120,
      "answerTime": "/updatedAt"
    }
  },
  "parts": {
    "base": {
      "as": "element",
      "element": "base",
      "of": "base",
      "bind": {
        "b": "value"
      }
    },
    "stop-light": {
      "as": "element",
      "element": "stop",
      "of": "stops",
      "bind": {
        "s": "light"
      }
    },
    "stop-north": {
      "as": "element",
      "element": "stop",
      "of": "stops",
      "bind": {
        "s": "north"
      }
    },
    "stop-salt": {
      "as": "element",
      "element": "stop",
      "of": "stops",
      "bind": {
        "s": "salt"
      }
    },
    "stop-clinic": {
      "as": "element",
      "element": "stop",
      "of": "stops",
      "bind": {
        "s": "clinic"
      }
    },
    "stop-school": {
      "as": "element",
      "element": "stop",
      "of": "stops",
      "bind": {
        "s": "school"
      }
    },
    "stop-harbour": {
      "as": "element",
      "element": "stop",
      "of": "stops",
      "bind": {
        "s": "harbour"
      }
    },
    "stop-farm": {
      "as": "element",
      "element": "stop",
      "of": "stops",
      "bind": {
        "s": "farm"
      }
    },
    "banner": {
      "as": "element",
      "element": "banner",
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
    "drones": {
      "as": "element",
      "element": "drones",
      "of": "drones",
      "bind": {
        "items": "value"
      }
    },
    "drops": {
      "as": "chart.bar",
      "of": "drops",
      "title": "오늘 시간별 배송 (건)",
      "x": "hour",
      "y": "drops",
      "series": [
        {
          "label": "배송",
          "color": "#c8342b"
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
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221600%22%20height%3D%221000%22%20viewBox%3D%220%200%201600%201000%22%3E%0A%3Crect%20width%3D%221600%22%20height%3D%221000%22%20fill%3D%22%23fbf3df%22%2F%3E%0A%3Crect%20x%3D%2224%22%20y%3D%2224%22%20width%3D%22992%22%20height%3D%22952%22%20rx%3D%2210%22%20fill%3D%22%23bfdcd6%22%2F%3E%0A%3Cpath%20d%3D%22M92.17391304347827%2060%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M182.17391304347825%2060%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M272.17391304347825%2060%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M362.17391304347825%2060%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M452.17391304347825%2060%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M542.1739130434783%2060%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M632.1739130434783%2060%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M722.1739130434783%2060%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M812.1739130434783%2060%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M902.1739130434783%2060%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M52.173913043478265%20106%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M142.17391304347825%20106%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M232.17391304347825%20106%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M322.17391304347825%20106%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M412.17391304347825%20106%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M502.17391304347825%20106%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M592.1739130434783%20106%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M682.1739130434783%20106%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M772.1739130434783%20106%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M862.1739130434783%20106%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M952.1739130434783%20106%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M92.17391304347827%20152%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M182.17391304347825%20152%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M272.17391304347825%20152%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M362.17391304347825%20152%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M452.17391304347825%20152%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M542.1739130434783%20152%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M632.1739130434783%20152%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M722.1739130434783%20152%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M812.1739130434783%20152%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M902.1739130434783%20152%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M52.173913043478244%20198%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M142.17391304347825%20198%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M232.17391304347825%20198%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M322.17391304347825%20198%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M412.17391304347825%20198%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M502.17391304347825%20198%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M592.1739130434783%20198%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M682.1739130434783%20198%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M772.1739130434783%20198%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M862.1739130434783%20198%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M952.1739130434783%20198%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M92.17391304347825%20244%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M182.17391304347825%20244%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M272.17391304347825%20244%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M362.17391304347825%20244%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M452.17391304347825%20244%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M542.1739130434783%20244%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M632.1739130434783%20244%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M722.1739130434783%20244%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M812.1739130434783%20244%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M902.1739130434783%20244%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M52.173913043478244%20290%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M142.17391304347825%20290%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M232.17391304347825%20290%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M322.17391304347825%20290%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M412.17391304347825%20290%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M502.17391304347825%20290%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M592.1739130434783%20290%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M682.1739130434783%20290%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M772.1739130434783%20290%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M862.1739130434783%20290%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M952.1739130434783%20290%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M92.17391304347825%20336%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M182.17391304347825%20336%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M272.17391304347825%20336%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M362.17391304347825%20336%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M452.17391304347825%20336%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M542.1739130434783%20336%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M632.1739130434783%20336%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M722.1739130434783%20336%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M812.1739130434783%20336%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M902.1739130434783%20336%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M52.17391304347828%20382%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M142.17391304347828%20382%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M232.17391304347828%20382%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M322.17391304347825%20382%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M412.17391304347825%20382%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M502.17391304347825%20382%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M592.1739130434783%20382%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M682.1739130434783%20382%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M772.1739130434783%20382%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M862.1739130434783%20382%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M952.1739130434783%20382%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M92.17391304347828%20428%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M182.17391304347828%20428%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M272.17391304347825%20428%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M362.17391304347825%20428%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M452.17391304347825%20428%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M542.1739130434783%20428%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M632.1739130434783%20428%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M722.1739130434783%20428%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M812.1739130434783%20428%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M902.1739130434783%20428%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M52.17391304347828%20474%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M142.17391304347828%20474%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M232.17391304347828%20474%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M322.17391304347825%20474%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M412.17391304347825%20474%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M502.17391304347825%20474%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M592.1739130434783%20474%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M682.1739130434783%20474%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M772.1739130434783%20474%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M862.1739130434783%20474%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M952.1739130434783%20474%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M92.17391304347828%20520%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M182.17391304347828%20520%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M272.17391304347825%20520%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M362.17391304347825%20520%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M452.17391304347825%20520%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M542.1739130434783%20520%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M632.1739130434783%20520%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M722.1739130434783%20520%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M812.1739130434783%20520%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M902.1739130434783%20520%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M52.17391304347828%20566%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M142.17391304347828%20566%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M232.17391304347828%20566%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M322.17391304347825%20566%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M412.17391304347825%20566%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M502.17391304347825%20566%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M592.1739130434783%20566%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M682.1739130434783%20566%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M772.1739130434783%20566%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M862.1739130434783%20566%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M952.1739130434783%20566%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M92.17391304347828%20612%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M182.17391304347828%20612%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M272.17391304347825%20612%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M362.17391304347825%20612%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M452.17391304347825%20612%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M542.1739130434783%20612%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M632.1739130434783%20612%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M722.1739130434783%20612%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M812.1739130434783%20612%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M902.1739130434783%20612%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M52.17391304347828%20658%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M142.17391304347828%20658%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M232.17391304347828%20658%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M322.17391304347825%20658%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M412.17391304347825%20658%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M502.17391304347825%20658%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M592.1739130434783%20658%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M682.1739130434783%20658%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M772.1739130434783%20658%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M862.1739130434783%20658%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M952.1739130434783%20658%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M92.17391304347828%20704%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M182.17391304347828%20704%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M272.17391304347825%20704%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M362.17391304347825%20704%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M452.17391304347825%20704%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M542.1739130434783%20704%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M632.1739130434783%20704%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M722.1739130434783%20704%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M812.1739130434783%20704%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M902.1739130434783%20704%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M52.17391304347828%20750%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M142.17391304347828%20750%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M232.17391304347828%20750%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M322.17391304347825%20750%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M412.17391304347825%20750%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M502.17391304347825%20750%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M592.1739130434783%20750%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M682.1739130434783%20750%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M772.1739130434783%20750%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M862.1739130434783%20750%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M952.1739130434783%20750%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M92.17391304347828%20796%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M182.17391304347828%20796%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M272.17391304347825%20796%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M362.17391304347825%20796%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M452.17391304347825%20796%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M542.1739130434783%20796%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M632.1739130434783%20796%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M722.1739130434783%20796%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M812.1739130434783%20796%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M902.1739130434783%20796%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M52.17391304347828%20842%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M142.17391304347828%20842%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M232.17391304347828%20842%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M322.17391304347825%20842%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M412.17391304347825%20842%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M502.17391304347825%20842%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M592.1739130434783%20842%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M682.1739130434783%20842%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M772.1739130434783%20842%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M862.1739130434783%20842%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M952.1739130434783%20842%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M92.17391304347828%20888%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M182.17391304347828%20888%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M272.17391304347825%20888%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M362.17391304347825%20888%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M452.17391304347825%20888%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M542.1739130434783%20888%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M632.1739130434783%20888%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M722.1739130434783%20888%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M812.1739130434783%20888%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M902.1739130434783%20888%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M52.17391304347828%20934%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M142.17391304347828%20934%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M232.17391304347828%20934%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M322.17391304347825%20934%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M412.17391304347825%20934%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M502.17391304347825%20934%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M592.1739130434783%20934%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M682.1739130434783%20934%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M772.1739130434783%20934%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M862.1739130434783%20934%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M952.1739130434783%20934%20q%208%20-6%2016%200%20t%2016%200%22%20stroke%3D%22%239cc5bd%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%0A%3Cpath%20d%3D%22M24%20300%20H%201016%20M24%20640%20H%201016%20M360%2024%20V%20976%20M700%2024%20V%20976%22%20stroke%3D%22%23203a5c%22%20stroke-width%3D%221%22%20stroke-dasharray%3D%223%207%22%20opacity%3D%22.35%22%2F%3E%0A%3Cpath%20d%3D%22M220%20470%20C%20250%20420%20360%20410%20450%20440%20C%20520%20470%20540%20560%20500%20620%20C%20450%20690%20330%20700%20260%20650%20C%20200%20610%20190%20520%20220%20470%20Z%22%20fill%3D%22%23f3e4c0%22%20stroke%3D%22%23203a5c%22%20stroke-width%3D%222%22%2F%3E%0A%3Cpath%20d%3D%22M300%20600%20l%2014%20-18%20l%2014%2018%20M318%20600%20l%2012%20-14%20l%2012%2014%22%20stroke%3D%22%23c9a86a%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M410%20470%20l%2014%20-18%20l%2014%2018%20M428%20470%20l%2012%20-14%20l%2012%2014%22%20stroke%3D%22%23c9a86a%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%0A%3Cpath%20d%3D%22M52%20232%20C%2052%20165.39999999999998%20134.6%20158%20193.6%20161.7%20C%20276.2%20172.8%20288%20217.2%20282.1%20246.8%20C%20276.2%20306%20170%20306%20111%20298.6%20C%2057.900000000000006%20291.2%2052%20261.6%2052%20232%20Z%22%20fill%3D%22%23f3e4c0%22%20stroke%3D%22%23203a5c%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M374%20192%20C%20374%20118.2%20462.2%20110%20525.2%20114.10000000000001%20C%20613.4%20126.39999999999999%20626%20175.6%20619.7%20208.4%20C%20613.4%20274%20500%20274%20437%20265.8%20C%20380.3%20257.6%20374%20224.8%20374%20192%20Z%22%20fill%3D%22%23f3e4c0%22%20stroke%3D%22%23203a5c%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M716%20172%20C%20716%20105.39999999999999%20809.8%2098%20876.8%20101.7%20C%20970.6%20112.8%20984%20157.2%20977.3%20186.8%20C%20970.6%20246%20850%20246%20783%20238.60000000000002%20C%20722.7%20231.2%20716%20201.6%20716%20172%20Z%22%20fill%3D%22%23f3e4c0%22%20stroke%3D%22%23203a5c%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M752%20482%20C%20752%20408.2%20834.6%20400%20893.6%20404.1%20C%20976.2%20416.4%20988%20465.6%20982.1%20498.4%20C%20976.2%20564%20870%20564%20811%20555.8%20C%20757.9%20547.6%20752%20514.8%20752%20482%20Z%22%20fill%3D%22%23f3e4c0%22%20stroke%3D%22%23203a5c%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M644%20812%20C%20644%20745.4%20732.2%20738%20795.2%20741.7%20C%20883.4%20752.8%20896%20797.2%20889.7%20826.8%20C%20883.4%20886%20770%20886%20707%20878.6%20C%20650.3%20871.2%20644%20841.6%20644%20812%20Z%22%20fill%3D%22%23f3e4c0%22%20stroke%3D%22%23203a5c%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M316%20882%20C%20316%20808.2%20409.8%20800%20476.8%20804.1%20C%20570.6%20816.4%20584%20865.6%20577.3%20898.4%20C%20570.6%20964%20450%20964%20383%20955.8%20C%20322.7%20947.6%20316%20914.8%20316%20882%20Z%22%20fill%3D%22%23f3e4c0%22%20stroke%3D%22%23203a5c%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M32%20732%20C%2032%20665.4%20114.6%20658%20173.6%20661.7%20C%20256.2%20672.8%20268%20717.2%20262.1%20746.8%20C%20256.2%20806%20150%20806%2091%20798.6%20C%2037.900000000000006%20791.2%2032%20761.6%2032%20732%20Z%22%20fill%3D%22%23f3e4c0%22%20stroke%3D%22%23203a5c%22%20stroke-width%3D%222%22%2F%3E%0A%3Cg%20transform%3D%22translate(930%20880)%22%3E%3Ccircle%20r%3D%2244%22%20fill%3D%22%23fbf3df%22%20stroke%3D%22%23203a5c%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M0%20-40%20L%208%200%20L%200%2040%20L%20-8%200%20Z%22%20fill%3D%22%23203a5c%22%2F%3E%3Cpath%20d%3D%22M-40%200%20L%200%20-8%20L%2040%200%20L%200%208%20Z%22%20fill%3D%22%23203a5c%22%20opacity%3D%22.45%22%2F%3E%3Ctext%20y%3D%22-48%22%20font-family%3D%22Century%20Gothic%2C%20Malgun%20Gothic%2C%20sans-serif%22%20font-size%3D%2216%22%20font-weight%3D%22700%22%20fill%3D%22%23203a5c%22%20text-anchor%3D%22middle%22%3EN%3C%2Ftext%3E%3C%2Fg%3E%0A%3Ctext%20x%3D%2260%22%20y%3D%2280%22%20font-family%3D%22Century%20Gothic%2C%20Malgun%20Gothic%2C%20sans-serif%22%20font-size%3D%2230%22%20font-weight%3D%22800%22%20fill%3D%22%23203a5c%22%20letter-spacing%3D%226%22%3E%EB%AC%BC%EA%B2%B0%20%EA%B5%B0%EB%8F%84%20%C2%B7%20%ED%95%AD%EB%A1%9C%EB%8F%84%3C%2Ftext%3E%0A%3Ctext%20x%3D%2262%22%20y%3D%22108%22%20font-family%3D%22Malgun%20Gothic%2C%20sans-serif%22%20font-size%3D%2215%22%20fill%3D%22%23203a5c%22%3E%EB%93%9C%EB%A1%A0%20%EB%B0%B0%EC%86%A1%20%E2%80%94%20%EB%B3%B8%EB%B6%80%20%EC%84%AC%EC%97%90%EC%84%9C%20%EC%9D%BC%EA%B3%B1%20%EA%B3%B3%EC%9C%BC%EB%A1%9C%3C%2Ftext%3E%0A%3Crect%20x%3D%221040%22%20y%3D%22650%22%20width%3D%22532%22%20height%3D%22306%22%20rx%3D%2210%22%20fill%3D%22%23ffffff%22%20stroke%3D%22%23203a5c%22%20stroke-width%3D%222%22%2F%3E%0A%3C%2Fsvg%3E",
    "place": {
      "base": [
        290,
        500,
        150,
        96
      ],
      "stop-light": [
        90,
        190,
        160,
        84
      ],
      "stop-north": [
        420,
        150,
        160,
        84
      ],
      "stop-salt": [
        770,
        130,
        160,
        84
      ],
      "stop-clinic": [
        790,
        440,
        160,
        84
      ],
      "stop-school": [
        690,
        770,
        160,
        84
      ],
      "stop-harbour": [
        370,
        840,
        160,
        84
      ],
      "stop-farm": [
        70,
        690,
        160,
        84
      ],
      "banner": [
        1040,
        36,
        532,
        160
      ],
      "figures": [
        1040,
        210,
        532,
        104
      ],
      "legend": [
        1040,
        328,
        532,
        50
      ],
      "drones": [
        1040,
        392,
        532,
        240
      ],
      "drops": [
        1052,
        662,
        508,
        284
      ]
    },
    "links": {
      "route-light": {
        "from": "base",
        "to": "stop-light",
        "label": "{{route}}",
        "show": "state",
        "weight": {
          "field": "state",
          "map": {
            "flying": 4,
            "due": 3,
            "hold": 3,
            "done": 1.5,
            "*": 2
          }
        },
        "of": "stops",
        "width": 3,
        "route": "curved"
      },
      "route-north": {
        "from": "base",
        "to": "stop-north",
        "label": "{{route-2}}",
        "show": "state-2",
        "weight": {
          "field": "state-2",
          "map": {
            "flying": 4,
            "due": 3,
            "hold": 3,
            "done": 1.5,
            "*": 2
          }
        },
        "of": "stops",
        "width": 3,
        "route": "curved"
      },
      "route-salt": {
        "from": "base",
        "to": "stop-salt",
        "label": "{{route-3}}",
        "show": "state-3",
        "weight": {
          "field": "state-3",
          "map": {
            "flying": 4,
            "due": 3,
            "hold": 3,
            "done": 1.5,
            "*": 2
          }
        },
        "of": "stops",
        "width": 3,
        "route": "curved"
      },
      "route-clinic": {
        "from": "base",
        "to": "stop-clinic",
        "label": "{{route-4}}",
        "show": "state-4",
        "weight": {
          "field": "state-4",
          "map": {
            "flying": 4,
            "due": 3,
            "hold": 3,
            "done": 1.5,
            "*": 2
          }
        },
        "of": "stops",
        "width": 3,
        "route": "curved"
      },
      "route-school": {
        "from": "base",
        "to": "stop-school",
        "label": "{{route-5}}",
        "show": "state-5",
        "weight": {
          "field": "state-5",
          "map": {
            "flying": 4,
            "due": 3,
            "hold": 3,
            "done": 1.5,
            "*": 2
          }
        },
        "of": "stops",
        "width": 3,
        "route": "curved"
      },
      "route-harbour": {
        "from": "base",
        "to": "stop-harbour",
        "label": "{{route-6}}",
        "show": "state-6",
        "weight": {
          "field": "state-6",
          "map": {
            "flying": 4,
            "due": 3,
            "hold": 3,
            "done": 1.5,
            "*": 2
          }
        },
        "of": "stops",
        "width": 3,
        "route": "curved"
      },
      "route-farm": {
        "from": "base",
        "to": "stop-farm",
        "label": "{{route-7}}",
        "show": "state-7",
        "weight": {
          "field": "state-7",
          "map": {
            "flying": 4,
            "due": 3,
            "hold": 3,
            "done": 1.5,
            "*": 2
          }
        },
        "of": "stops",
        "width": 3,
        "route": "curved"
      }
    }
  }
};

export const droneRoutes: SamplePack = {
  id: "drone-routes",
  title: {
    "ko": "섬 드론 배송 — 옛 항공 노선도",
    "en": "Island drone deliveries — a vintage airline route map"
  },
  field: {
    "ko": "드론 배송·물류",
    "en": "Drone delivery"
  },
  kind: {
    "ko": "항로·배송지·기체 현황",
    "en": "Routes, stops and the fleet"
  },
  domain: "logistics",
  styles: [
    "print"
  ],
  summary: {
    "ko": "섬 지역 드론 배송을 옛 항공 노선도 포스터로 — 물결 무늬의 옅은 바다, 빗금 언덕이 있는 크림색 섬, 나침도, 그리고 본부에서 배송지마다 그은 호. 호는 옛 노선도가 운항을 싣듯 비행을 싣는다: 드론이 떠 있으면 빨간 실선과 도착까지 분, 출발 예정이면 남색 파선과 출발 시각, 바람으로 보류되면 주황 점선, 배송이 끝나면 가는 회색 선. 배송지는 수하물 꼬리표 — 오늘 받는 것과 상태 도장. 오른쪽에 노선 포스터 머리, 지금 수치, 범례, 기체 현황(배터리), 시간별 배송. 섬과 배송망은 지어낸 것이라 예시 데이터입니다.",
    "en": "An island group’s drone deliveries drawn as a vintage airline route map — a pale sea with wave strokes, cream islands with hatched hills, a compass rose, and an arc from the base to every stop. An arc carries its flight as an old route map carried its services: a solid red arc with the minutes to arrival while a drone is on it, a dashed navy arc with the departure time when one is due, a dotted orange arc when the wind holds it, a thin grey arc once the drop is made. Every stop is a luggage label with what it gets today and a stamp for its state. On the right the service’s poster banner, the figures now, the key, the drones with their batteries and the drops through the day. The islands and the service are made up. Example data."
  },
  connectors: [
    {
      "key": "fleet",
      "name": "예시 드론 배송 API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 섬·배송망이 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
