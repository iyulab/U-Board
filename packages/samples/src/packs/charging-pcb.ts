// An electric-vehicle charging hub drawn as a printed circuit board: green solder mask, a board outline with mounting
// holes and fiducials, white silkscreen, and a copper power trunk down the middle fed by the grid intake and the
// battery at the top. Every charger is a chip on the board — eight of them, two rows of four — and every chip takes
// its power through a via on the trunk and a short copper trace. The trace carries what the charger draws now: its
// width and its kilowatts, bright copper while it charges, dull copper while it stands, red and broken when the
// charger is faulted. A chip tells its state by its status LED and the sign beside it, as well as by colour — a lit
// triangle charging, a dark ring free, a half ring when a full car is still plugged in, a cross when it is down. On the
// right the board's title block, the figures now, the key, the cars waiting and the energy through the day. The hub is
// made up, so the values are example data.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/charging-pcb.js';

const board: Board = {
  "board": {
    "theme": "dark",
    "accent": "#d9a24a"
  },
  "statuses": {
    "fault": {
      "tone": "alarm",
      "emphasis": "hatch"
    }
  },
  "elements": {
    "intake": {
      "template": "<article class=\"pk\"><b>U1</b><small>수전 · 계약 {{m.limit}} kW</small><p><strong>{{m.kw}}</strong><span>kW</span></p><div class=\"bar\" style=\"--v: {{m.pct}}\"><span></span></div><footer>{{m.word}}</footer></article>",
      "style": ".pk{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto auto 1fr auto auto;gap:3px;padding:10px 14px;background:#1c1d1f;border-radius:6px;border:2px solid #d9a24a;font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#f4f1e6}\nb{font:800 18px \"JetBrains Mono\", \"Consolas\", \"D2Coding\", monospace}\nsmall{font-size:12px;color:#b9bdc4}\np{margin:0;display:flex;align-items:baseline;gap:6px}\nstrong{font:800 30px \"JetBrains Mono\", \"Consolas\", \"D2Coding\", monospace}\nspan{font-size:13px;color:#b9bdc4}\n.bar{height:8px;border-radius:2px;background:#33363b;overflow:hidden}\n.bar span{display:block;height:100%;width:calc(var(--v) * 1%);background:#d9a24a}\nfooter{font-size:12px}",
      "props": {
        "m": "object"
      }
    },
    "battery": {
      "template": "<article class=\"bt {{e.mode}}\"><b>BT1</b><small>ESS · {{e.capacity}} kWh</small><p><strong>{{e.kw}}</strong><span>kW {{e.word}}</span></p><div class=\"cells\" style=\"--v: {{e.soc}}\"><span></span></div><footer>충전량 {{e.soc}}%</footer></article>",
      "style": ".bt{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto auto 1fr auto auto;gap:3px;padding:10px 14px;background:#1c1d1f;border-radius:6px;border:2px solid #d9a24a;font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#f4f1e6}\nb{font:800 18px \"JetBrains Mono\", \"Consolas\", \"D2Coding\", monospace}\nsmall{font-size:12px;color:#b9bdc4}\np{margin:0;display:flex;align-items:baseline;gap:6px}\nstrong{font:800 30px \"JetBrains Mono\", \"Consolas\", \"D2Coding\", monospace}\nspan{font-size:13px;color:#b9bdc4}\n.cells{height:10px;border-radius:2px;background:repeating-linear-gradient(90deg,#33363b 0 14px,#1c1d1f 14px 16px);overflow:hidden}\n.cells span{display:block;height:100%;width:calc(var(--v) * 1%);background:repeating-linear-gradient(90deg,#d9a24a 0 14px,#1c1d1f 14px 16px)}\nfooter{font-size:12px}\n.discharging p span{color:#ffc04d}",
      "props": {
        "e": "object"
      }
    },
    "via": {
      "template": "<i class=\"via\"></i>",
      "style": ".via{display:block;width:100%;height:100%;box-sizing:border-box;border-radius:50%;background:#08402a;border:7px solid #d9a24a}"
    },
    "charger": {
      "template": "<article class=\"ic {{c.state}}\"><div class=\"body\"><header><b>{{c.ref}}</b><i></i></header><small>{{c.kind}}</small><p><strong>{{c.kw}}</strong><span>kW</span><em>{{c.word}}</em></p><div class=\"soc\" style=\"--v: {{c.soc}}\"><span></span></div><footer>{{c.note}}</footer></div></article>",
      "style": ".ic{width:100%;height:100%;box-sizing:border-box;padding:0 10px;background:repeating-linear-gradient(180deg,#c9ccd1 0 7px,transparent 7px 16px) left/8px 100% no-repeat,repeating-linear-gradient(180deg,#c9ccd1 0 7px,transparent 7px 16px) right/8px 100% no-repeat;font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#f4f1e6}\n.body{position:relative;height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto auto 1fr auto auto;gap:3px;padding:10px 14px 10px 22px;background:#1c1d1f;border-radius:4px;box-shadow:inset 0 0 0 1px #34363a}\n.body::before{content:\"\";position:absolute;left:8px;top:10px;width:8px;height:8px;border-radius:50%;background:#3a3c40}\nheader{display:flex;justify-content:space-between;align-items:center}\nb{font:800 18px \"JetBrains Mono\", \"Consolas\", \"D2Coding\", monospace;letter-spacing:.04em}\ni{display:grid;place-items:center;width:26px;height:26px;border-radius:50%;font:900 13px \"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;font-style:normal;box-sizing:border-box}\nsmall{font-size:12px;color:#b9bdc4}\np{margin:0;display:flex;align-items:baseline;gap:6px}\nstrong{font:800 34px \"JetBrains Mono\", \"Consolas\", \"D2Coding\", monospace}\np span{font-size:13px;color:#b9bdc4}\nem{margin-left:auto;font-style:normal;font-weight:800;font-size:14px}\n.soc{height:8px;border-radius:2px;background:#33363b;overflow:hidden}\n.soc span{display:block;height:100%;width:calc(var(--v) * 1%);background:#d9a24a}\nfooter{font-size:12px;color:#d6d9de;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n.charging i{background:#7dff9a;color:#063b1a;box-shadow:0 0 10px #7dff9a}\n.charging i::before{content:\"▶\"}\n.charging em{color:#7dff9a}\n.free i{border:3px solid #6f747c}\n.free strong{color:#6f747c}\n.free em{color:#c9ccd1}\n.blocking i{background:conic-gradient(#ffc04d 0 50%,transparent 50%);border:3px solid #ffc04d}\n.blocking em{color:#ffc04d}\n.fault .body{background:repeating-linear-gradient(-45deg,#1c1d1f 0 8px,#2c1414 8px 16px);box-shadow:inset 0 0 0 2px #ff5a4f}\n.fault i{background:#ff5a4f;color:#2b0605}\n.fault i::before{content:\"✕\"}\n.fault strong{color:#7c6060}\n.fault em{color:#ff5a4f}",
      "props": {
        "c": "object"
      }
    },
    "title": {
      "template": "<table class=\"tb\"><tr><th colspan=\"2\"><small>{{t.series}}</small><h1>{{t.name}}</h1></th></tr><tr><td>날짜</td><td><b>{{t.date}}</b></td></tr><tr><td>시각</td><td><b class=\"big\">{{t.time}}</b></td></tr></table>",
      "style": ".tb{width:100%;height:100%;border-collapse:collapse;font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#f4f1e6}\nth,td{border:2px solid #f4f1e6;padding:3px 14px;text-align:left}\nth{padding:8px 14px}\nsmall{display:block;font:700 13px \"JetBrains Mono\", \"Consolas\", \"D2Coding\", monospace;letter-spacing:.14em;color:#cfe8da}\nh1{margin:0;font-size:30px;font-weight:900;letter-spacing:.02em;line-height:1.2}\ntd:first-child{width:80px;font:700 13px \"JetBrains Mono\", \"Consolas\", \"D2Coding\", monospace;letter-spacing:.1em;color:#cfe8da}\nb{font-size:16px}\n.big{font:800 22px \"JetBrains Mono\", \"Consolas\", \"D2Coding\", monospace}",
      "props": {
        "t": "object"
      }
    },
    "figures": {
      "template": "<dl class=\"fg\">{{#items}}<div><dt>{{label}}</dt><dd>{{value}}</dd><small>{{note}}</small></div>{{/items}}</dl>",
      "style": ".fg{margin:0;height:100%;box-sizing:border-box;display:grid;grid-template-columns:repeat(3,1fr);gap:14px;font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#f4f1e6}\ndiv{display:grid;align-content:center;justify-items:center;text-align:center;border:2px solid #f4f1e6;border-radius:4px;background:rgba(8,64,42,.85)}\ndt{font-size:13px;font-weight:700;color:#cfe8da}\ndd{margin:0;font:800 28px \"JetBrains Mono\", \"Consolas\", \"D2Coding\", monospace;color:#d9a24a}\nsmall{font-size:12px}",
      "props": {
        "items": "list"
      }
    },
    "legend": {
      "template": "<ul class=\"ky\"><li><i class=\"charging\">▶</i>충전 중</li><li><i class=\"free\"></i>비어 있음</li><li><i class=\"blocking\"></i>완충 · 출차 대기</li><li><i class=\"fault\">✕</i>고장</li></ul>",
      "style": ".ky{height:100%;box-sizing:border-box;margin:0;padding:0 16px;list-style:none;display:flex;align-items:center;justify-content:space-between;border:2px dashed #f4f1e6;border-radius:4px;background:rgba(8,64,42,.85);font:800 14px \"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#f4f1e6}\nli{display:flex;align-items:center;gap:8px}\ni{display:grid;place-items:center;width:20px;height:20px;border-radius:50%;font:900 10px \"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;font-style:normal;box-sizing:border-box}\n.charging{background:#7dff9a;color:#063b1a}\n.free{border:3px solid #9aa0a8}\n.blocking{background:conic-gradient(#ffc04d 0 50%,transparent 50%);border:3px solid #ffc04d}\n.fault{background:#ff5a4f;color:#2b0605}"
    },
    "queue": {
      "template": "<section class=\"qu\"><h2>J2 · 대기 차량</h2><ol>{{#items}}<li class=\"{{state}}\"><i>{{pin}}</i><span>{{car}}</span><small>{{wants}}</small><b>{{wait}}</b></li>{{/items}}</ol></section>",
      "style": ".qu{height:100%;box-sizing:border-box;padding:12px 18px;border:2px solid #f4f1e6;border-radius:4px;background:rgba(8,64,42,.85);font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#f4f1e6}\nh2{margin:0 0 10px;font:800 16px \"JetBrains Mono\", \"Consolas\", \"D2Coding\", monospace;letter-spacing:.08em}\nol{margin:0;padding:0;list-style:none;display:grid;gap:8px}\nli{display:grid;grid-template-columns:34px 1fr auto 76px;align-items:center;gap:12px;font-size:15px}\ni{display:grid;place-items:center;width:30px;height:30px;box-sizing:border-box;border:3px solid #d9a24a;font:800 12px \"JetBrains Mono\", \"Consolas\", \"D2Coding\", monospace;font-style:normal;color:#d9a24a}\nsmall{font-size:13px;color:#cfe8da}\nb{font:800 16px \"JetBrains Mono\", \"Consolas\", \"D2Coding\", monospace;text-align:right}\n.next i{background:#d9a24a;color:#1c1d1f}\n.next b::before{content:\"▶ \";color:#7dff9a}",
      "props": {
        "items": "list"
      }
    }
  },
  "data": {
    "intake": {
      "from": "hub",
      "path": "/hub/intake",
      "time": "updatedAt",
      "fresh": 300,
      "fields": {
        "value": {}
      }
    },
    "battery": {
      "from": "hub",
      "path": "/hub/battery",
      "time": "updatedAt",
      "fresh": 300,
      "fields": {
        "value": {}
      }
    },
    "chargers": {
      "from": "hub",
      "path": "/hub/chargers",
      "time": "updatedAt",
      "fresh": 300,
      "fields": {
        "a1": {
          "at": "/value/a1"
        },
        "a2": {
          "at": "/value/a2"
        },
        "a3": {
          "at": "/value/a3"
        },
        "a4": {
          "at": "/value/a4"
        },
        "b1": {
          "at": "/value/b1"
        },
        "b2": {
          "at": "/value/b2"
        },
        "b3": {
          "at": "/value/b3"
        },
        "b4": {
          "at": "/value/b4"
        },
        "kw": {
          "at": "/value/a1/kw",
          "format": "number:0"
        },
        "state": {
          "at": "/value/a1/state",
          "state": {
            "charging": "warn",
            "blocking": "off",
            "free": "off",
            "fault": "fault",
            "*": "off"
          }
        },
        "kw-2": {
          "at": "/value/a2/kw",
          "format": "number:0"
        },
        "state-2": {
          "at": "/value/a2/state",
          "state": {
            "charging": "warn",
            "blocking": "off",
            "free": "off",
            "fault": "fault",
            "*": "off"
          }
        },
        "kw-3": {
          "at": "/value/a3/kw",
          "format": "number:0"
        },
        "state-3": {
          "at": "/value/a3/state",
          "state": {
            "charging": "warn",
            "blocking": "off",
            "free": "off",
            "fault": "fault",
            "*": "off"
          }
        },
        "kw-4": {
          "at": "/value/a4/kw",
          "format": "number:0"
        },
        "state-4": {
          "at": "/value/a4/state",
          "state": {
            "charging": "warn",
            "blocking": "off",
            "free": "off",
            "fault": "fault",
            "*": "off"
          }
        },
        "kw-5": {
          "at": "/value/b1/kw",
          "format": "number:0"
        },
        "state-5": {
          "at": "/value/b1/state",
          "state": {
            "charging": "warn",
            "blocking": "off",
            "free": "off",
            "fault": "fault",
            "*": "off"
          }
        },
        "kw-6": {
          "at": "/value/b2/kw",
          "format": "number:0"
        },
        "state-6": {
          "at": "/value/b2/state",
          "state": {
            "charging": "warn",
            "blocking": "off",
            "free": "off",
            "fault": "fault",
            "*": "off"
          }
        },
        "kw-7": {
          "at": "/value/b3/kw",
          "format": "number:0"
        },
        "state-7": {
          "at": "/value/b3/state",
          "state": {
            "charging": "warn",
            "blocking": "off",
            "free": "off",
            "fault": "fault",
            "*": "off"
          }
        },
        "kw-8": {
          "at": "/value/b4/kw",
          "format": "number:0"
        },
        "state-8": {
          "at": "/value/b4/state",
          "state": {
            "charging": "warn",
            "blocking": "off",
            "free": "off",
            "fault": "fault",
            "*": "off"
          }
        }
      }
    },
    "now": {
      "from": "hub",
      "path": "/hub/now",
      "time": "updatedAt",
      "fresh": 300,
      "fields": {
        "value": {}
      }
    },
    "figures": {
      "from": "hub",
      "path": "/hub/figures",
      "time": "updatedAt",
      "fresh": 300,
      "fields": {
        "value": {}
      }
    },
    "queue": {
      "from": "hub",
      "path": "/hub/queue",
      "time": "updatedAt",
      "fresh": 300,
      "fields": {
        "value": {}
      }
    },
    "today": {
      "from": "hub",
      "path": "/hub/today",
      "list": "/value",
      "fresh": 300,
      "answerTime": "/updatedAt"
    }
  },
  "parts": {
    "intake": {
      "as": "element",
      "element": "intake",
      "of": "intake",
      "bind": {
        "m": "value"
      }
    },
    "battery": {
      "as": "element",
      "element": "battery",
      "of": "battery",
      "bind": {
        "e": "value"
      }
    },
    "via-0": {
      "as": "element",
      "element": "via"
    },
    "via-1": {
      "as": "element",
      "element": "via"
    },
    "via-2": {
      "as": "element",
      "element": "via"
    },
    "via-3": {
      "as": "element",
      "element": "via"
    },
    "charger-a1": {
      "as": "element",
      "element": "charger",
      "of": "chargers",
      "bind": {
        "c": "a1"
      }
    },
    "charger-a2": {
      "as": "element",
      "element": "charger",
      "of": "chargers",
      "bind": {
        "c": "a2"
      }
    },
    "charger-a3": {
      "as": "element",
      "element": "charger",
      "of": "chargers",
      "bind": {
        "c": "a3"
      }
    },
    "charger-a4": {
      "as": "element",
      "element": "charger",
      "of": "chargers",
      "bind": {
        "c": "a4"
      }
    },
    "charger-b1": {
      "as": "element",
      "element": "charger",
      "of": "chargers",
      "bind": {
        "c": "b1"
      }
    },
    "charger-b2": {
      "as": "element",
      "element": "charger",
      "of": "chargers",
      "bind": {
        "c": "b2"
      }
    },
    "charger-b3": {
      "as": "element",
      "element": "charger",
      "of": "chargers",
      "bind": {
        "c": "b3"
      }
    },
    "charger-b4": {
      "as": "element",
      "element": "charger",
      "of": "chargers",
      "bind": {
        "c": "b4"
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
    "queue": {
      "as": "element",
      "element": "queue",
      "of": "queue",
      "bind": {
        "items": "value"
      }
    },
    "today": {
      "as": "chart.bar",
      "of": "today",
      "title": "오늘 시간별 충전량 (kWh)",
      "x": "hour",
      "y": "kwh",
      "series": [
        {
          "label": "충전량",
          "color": "#d9a24a"
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
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221600%22%20height%3D%221000%22%20viewBox%3D%220%200%201600%201000%22%3E%0A%3Cdefs%3E%3Cpattern%20id%3D%22g%22%20width%3D%2224%22%20height%3D%2224%22%20patternUnits%3D%22userSpaceOnUse%22%3E%3Cpath%20d%3D%22M%2024%200%20L%200%200%200%2024%22%20fill%3D%22none%22%20stroke%3D%22%230f6342%22%20stroke-width%3D%221%22%2F%3E%3C%2Fpattern%3E%0A%3Cpattern%20id%3D%22h%22%20width%3D%2210%22%20height%3D%2210%22%20patternUnits%3D%22userSpaceOnUse%22%20patternTransform%3D%22rotate(45)%22%3E%3Crect%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%2308402a%22%2F%3E%3Cpath%20d%3D%22M%200%200%20L%200%2010%22%20stroke%3D%22%23145f40%22%20stroke-width%3D%223%22%2F%3E%3C%2Fpattern%3E%3C%2Fdefs%3E%0A%3Crect%20width%3D%221600%22%20height%3D%221000%22%20fill%3D%22%2306291b%22%2F%3E%0A%3Crect%20x%3D%2216%22%20y%3D%2216%22%20width%3D%221568%22%20height%3D%22968%22%20rx%3D%2228%22%20fill%3D%22%230d5a3a%22%2F%3E%0A%3Crect%20x%3D%2216%22%20y%3D%2216%22%20width%3D%221568%22%20height%3D%22968%22%20rx%3D%2228%22%20fill%3D%22url(%23g)%22%2F%3E%0A%3Crect%20x%3D%221008%22%20y%3D%2216%22%20width%3D%22576%22%20height%3D%22968%22%20fill%3D%22url(%23h)%22%20opacity%3D%22.55%22%2F%3E%0A%3Cline%20x1%3D%221008%22%20y1%3D%2230%22%20x2%3D%221008%22%20y2%3D%22970%22%20stroke%3D%22%23f4f1e6%22%20stroke-width%3D%222%22%20stroke-dasharray%3D%2210%208%22%2F%3E%0A%3Ccircle%20cx%3D%2246%22%20cy%3D%2246%22%20r%3D%2216%22%20fill%3D%22%23d9a24a%22%2F%3E%3Ccircle%20cx%3D%2246%22%20cy%3D%2246%22%20r%3D%229%22%20fill%3D%22%2308402a%22%2F%3E%3Ccircle%20cx%3D%221554%22%20cy%3D%2246%22%20r%3D%2216%22%20fill%3D%22%23d9a24a%22%2F%3E%3Ccircle%20cx%3D%221554%22%20cy%3D%2246%22%20r%3D%229%22%20fill%3D%22%2308402a%22%2F%3E%3Ccircle%20cx%3D%2246%22%20cy%3D%22954%22%20r%3D%2216%22%20fill%3D%22%23d9a24a%22%2F%3E%3Ccircle%20cx%3D%2246%22%20cy%3D%22954%22%20r%3D%229%22%20fill%3D%22%2308402a%22%2F%3E%3Ccircle%20cx%3D%221554%22%20cy%3D%22954%22%20r%3D%2216%22%20fill%3D%22%23d9a24a%22%2F%3E%3Ccircle%20cx%3D%221554%22%20cy%3D%22954%22%20r%3D%229%22%20fill%3D%22%2308402a%22%2F%3E%0A%3Ccircle%20cx%3D%22320%22%20cy%3D%22975%22%20r%3D%227%22%20fill%3D%22%23d9a24a%22%2F%3E%3Ccircle%20cx%3D%22320%22%20cy%3D%22975%22%20r%3D%2213%22%20fill%3D%22none%22%20stroke%3D%22%2308402a%22%20stroke-width%3D%224%22%2F%3E%3Ccircle%20cx%3D%22700%22%20cy%3D%22975%22%20r%3D%227%22%20fill%3D%22%23d9a24a%22%2F%3E%3Ccircle%20cx%3D%22700%22%20cy%3D%22975%22%20r%3D%2213%22%20fill%3D%22none%22%20stroke%3D%22%2308402a%22%20stroke-width%3D%224%22%2F%3E%0A%3Crect%20x%3D%22494%22%20y%3D%22196%22%20width%3D%2232%22%20height%3D%22672%22%20rx%3D%226%22%20fill%3D%22%23d9a24a%22%2F%3E%0A%3Crect%20x%3D%22501%22%20y%3D%22196%22%20width%3D%2218%22%20height%3D%22672%22%20rx%3D%224%22%20fill%3D%22%23efc171%22%20opacity%3D%22.55%22%2F%3E%0A%3Ccircle%20cx%3D%22345%22%20cy%3D%22210%22%20r%3D%224%22%20fill%3D%22none%22%20stroke%3D%22%238a6a36%22%20stroke-width%3D%222%22%2F%3E%3Ccircle%20cx%3D%22345%22%20cy%3D%22945%22%20r%3D%224%22%20fill%3D%22none%22%20stroke%3D%22%238a6a36%22%20stroke-width%3D%222%22%2F%3E%3Ccircle%20cx%3D%22375%22%20cy%3D%22210%22%20r%3D%224%22%20fill%3D%22none%22%20stroke%3D%22%238a6a36%22%20stroke-width%3D%222%22%2F%3E%3Ccircle%20cx%3D%22375%22%20cy%3D%22945%22%20r%3D%224%22%20fill%3D%22none%22%20stroke%3D%22%238a6a36%22%20stroke-width%3D%222%22%2F%3E%3Ccircle%20cx%3D%22405%22%20cy%3D%22210%22%20r%3D%224%22%20fill%3D%22none%22%20stroke%3D%22%238a6a36%22%20stroke-width%3D%222%22%2F%3E%3Ccircle%20cx%3D%22405%22%20cy%3D%22945%22%20r%3D%224%22%20fill%3D%22none%22%20stroke%3D%22%238a6a36%22%20stroke-width%3D%222%22%2F%3E%3Ccircle%20cx%3D%22435%22%20cy%3D%22210%22%20r%3D%224%22%20fill%3D%22none%22%20stroke%3D%22%238a6a36%22%20stroke-width%3D%222%22%2F%3E%3Ccircle%20cx%3D%22435%22%20cy%3D%22945%22%20r%3D%224%22%20fill%3D%22none%22%20stroke%3D%22%238a6a36%22%20stroke-width%3D%222%22%2F%3E%3Ccircle%20cx%3D%22465%22%20cy%3D%22210%22%20r%3D%224%22%20fill%3D%22none%22%20stroke%3D%22%238a6a36%22%20stroke-width%3D%222%22%2F%3E%3Ccircle%20cx%3D%22465%22%20cy%3D%22945%22%20r%3D%224%22%20fill%3D%22none%22%20stroke%3D%22%238a6a36%22%20stroke-width%3D%222%22%2F%3E%3Ccircle%20cx%3D%22495%22%20cy%3D%22210%22%20r%3D%224%22%20fill%3D%22none%22%20stroke%3D%22%238a6a36%22%20stroke-width%3D%222%22%2F%3E%3Ccircle%20cx%3D%22495%22%20cy%3D%22945%22%20r%3D%224%22%20fill%3D%22none%22%20stroke%3D%22%238a6a36%22%20stroke-width%3D%222%22%2F%3E%3Ccircle%20cx%3D%22525%22%20cy%3D%22210%22%20r%3D%224%22%20fill%3D%22none%22%20stroke%3D%22%238a6a36%22%20stroke-width%3D%222%22%2F%3E%3Ccircle%20cx%3D%22525%22%20cy%3D%22945%22%20r%3D%224%22%20fill%3D%22none%22%20stroke%3D%22%238a6a36%22%20stroke-width%3D%222%22%2F%3E%3Ccircle%20cx%3D%22555%22%20cy%3D%22210%22%20r%3D%224%22%20fill%3D%22none%22%20stroke%3D%22%238a6a36%22%20stroke-width%3D%222%22%2F%3E%3Ccircle%20cx%3D%22555%22%20cy%3D%22945%22%20r%3D%224%22%20fill%3D%22none%22%20stroke%3D%22%238a6a36%22%20stroke-width%3D%222%22%2F%3E%3Ccircle%20cx%3D%22585%22%20cy%3D%22210%22%20r%3D%224%22%20fill%3D%22none%22%20stroke%3D%22%238a6a36%22%20stroke-width%3D%222%22%2F%3E%3Ccircle%20cx%3D%22585%22%20cy%3D%22945%22%20r%3D%224%22%20fill%3D%22none%22%20stroke%3D%22%238a6a36%22%20stroke-width%3D%222%22%2F%3E%3Ccircle%20cx%3D%22615%22%20cy%3D%22210%22%20r%3D%224%22%20fill%3D%22none%22%20stroke%3D%22%238a6a36%22%20stroke-width%3D%222%22%2F%3E%3Ccircle%20cx%3D%22615%22%20cy%3D%22945%22%20r%3D%224%22%20fill%3D%22none%22%20stroke%3D%22%238a6a36%22%20stroke-width%3D%222%22%2F%3E%3Ccircle%20cx%3D%22645%22%20cy%3D%22210%22%20r%3D%224%22%20fill%3D%22none%22%20stroke%3D%22%238a6a36%22%20stroke-width%3D%222%22%2F%3E%3Ccircle%20cx%3D%22645%22%20cy%3D%22945%22%20r%3D%224%22%20fill%3D%22none%22%20stroke%3D%22%238a6a36%22%20stroke-width%3D%222%22%2F%3E%3Ccircle%20cx%3D%22675%22%20cy%3D%22210%22%20r%3D%224%22%20fill%3D%22none%22%20stroke%3D%22%238a6a36%22%20stroke-width%3D%222%22%2F%3E%3Ccircle%20cx%3D%22675%22%20cy%3D%22945%22%20r%3D%224%22%20fill%3D%22none%22%20stroke%3D%22%238a6a36%22%20stroke-width%3D%222%22%2F%3E%0A%3Ctext%20x%3D%22536%22%20y%3D%22236%22%20font-family%3D%22Consolas%2C%20monospace%22%20font-size%3D%2213%22%20fill%3D%22%23f4f1e6%22%20text-anchor%3D%22start%22%20letter-spacing%3D%221%22%3EDC%20BUS%20800%20V%3C%2Ftext%3E%0A%3Ctext%20x%3D%2256%22%20y%3D%22222%22%20font-family%3D%22Consolas%2C%20monospace%22%20font-size%3D%2215%22%20fill%3D%22%23f4f1e6%22%20text-anchor%3D%22start%22%20letter-spacing%3D%221%22%3EA%20%E2%80%94%20%EA%B8%89%EC%86%8D%20200%20kW%3C%2Ftext%3E%0A%3Ctext%20x%3D%22964%22%20y%3D%22222%22%20font-family%3D%22Consolas%2C%20monospace%22%20font-size%3D%2215%22%20fill%3D%22%23f4f1e6%22%20text-anchor%3D%22end%22%20letter-spacing%3D%221%22%3EB%20%E2%80%94%20%EC%B4%88%EA%B8%89%EC%86%8D%20350%20kW%3C%2Ftext%3E%0A%3Ctext%20x%3D%22990%22%20y%3D%22990%22%20font-family%3D%22Consolas%2C%20monospace%22%20font-size%3D%2212%22%20fill%3D%22%23f4f1e6%22%20text-anchor%3D%22end%22%20letter-spacing%3D%221%22%3EUB-CHG-01%20%C2%B7%20REV%2010.22%3C%2Ftext%3E%0A%3C%2Fsvg%3E",
    "place": {
      "intake": [
        330,
        40,
        170,
        150
      ],
      "battery": [
        520,
        40,
        170,
        150
      ],
      "via-0": [
        495,
        297,
        30,
        30
      ],
      "via-1": [
        495,
        477,
        30,
        30
      ],
      "via-2": [
        495,
        657,
        30,
        30
      ],
      "via-3": [
        495,
        837,
        30,
        30
      ],
      "charger-a1": [
        50,
        230,
        260,
        165
      ],
      "charger-a2": [
        50,
        410,
        260,
        165
      ],
      "charger-a3": [
        50,
        590,
        260,
        165
      ],
      "charger-a4": [
        50,
        770,
        260,
        165
      ],
      "charger-b1": [
        710,
        230,
        260,
        165
      ],
      "charger-b2": [
        710,
        410,
        260,
        165
      ],
      "charger-b3": [
        710,
        590,
        260,
        165
      ],
      "charger-b4": [
        710,
        770,
        260,
        165
      ],
      "title": [
        1030,
        40,
        540,
        160
      ],
      "figures": [
        1030,
        218,
        540,
        110
      ],
      "legend": [
        1030,
        346,
        540,
        52
      ],
      "queue": [
        1030,
        416,
        540,
        196
      ],
      "today": [
        1030,
        632,
        540,
        324
      ]
    },
    "links": {
      "trace-a1": {
        "from": "via-0",
        "to": "charger-a1",
        "label": "{{kw}} kW",
        "show": "state",
        "weight": {
          "field": "kw",
          "bands": [
            3,
            1,
            5,
            120,
            7,
            250,
            9
          ]
        },
        "of": "chargers",
        "width": 5
      },
      "trace-a2": {
        "from": "via-1",
        "to": "charger-a2",
        "label": "{{kw-2}} kW",
        "show": "state-2",
        "weight": {
          "field": "kw-2",
          "bands": [
            3,
            1,
            5,
            120,
            7,
            250,
            9
          ]
        },
        "of": "chargers",
        "width": 5
      },
      "trace-a3": {
        "from": "via-2",
        "to": "charger-a3",
        "label": "{{kw-3}} kW",
        "show": "state-3",
        "weight": {
          "field": "kw-3",
          "bands": [
            3,
            1,
            5,
            120,
            7,
            250,
            9
          ]
        },
        "of": "chargers",
        "width": 5
      },
      "trace-a4": {
        "from": "via-3",
        "to": "charger-a4",
        "label": "{{kw-4}} kW",
        "show": "state-4",
        "weight": {
          "field": "kw-4",
          "bands": [
            3,
            1,
            5,
            120,
            7,
            250,
            9
          ]
        },
        "of": "chargers",
        "width": 5
      },
      "trace-b1": {
        "from": "via-0",
        "to": "charger-b1",
        "label": "{{kw-5}} kW",
        "show": "state-5",
        "weight": {
          "field": "kw-5",
          "bands": [
            3,
            1,
            5,
            120,
            7,
            250,
            9
          ]
        },
        "of": "chargers",
        "width": 5
      },
      "trace-b2": {
        "from": "via-1",
        "to": "charger-b2",
        "label": "{{kw-6}} kW",
        "show": "state-6",
        "weight": {
          "field": "kw-6",
          "bands": [
            3,
            1,
            5,
            120,
            7,
            250,
            9
          ]
        },
        "of": "chargers",
        "width": 5
      },
      "trace-b3": {
        "from": "via-2",
        "to": "charger-b3",
        "label": "{{kw-7}} kW",
        "show": "state-7",
        "weight": {
          "field": "kw-7",
          "bands": [
            3,
            1,
            5,
            120,
            7,
            250,
            9
          ]
        },
        "of": "chargers",
        "width": 5
      },
      "trace-b4": {
        "from": "via-3",
        "to": "charger-b4",
        "label": "{{kw-8}} kW",
        "show": "state-8",
        "weight": {
          "field": "kw-8",
          "bands": [
            3,
            1,
            5,
            120,
            7,
            250,
            9
          ]
        },
        "of": "chargers",
        "width": 5
      }
    }
  }
};

export const chargingPcb: SamplePack = {
  id: "charging-pcb",
  title: {
    "ko": "전기차 충전 허브 — 인쇄회로기판",
    "en": "An EV charging hub — a printed circuit board"
  },
  field: {
    "ko": "전기차 충전",
    "en": "EV charging"
  },
  kind: {
    "ko": "충전기 상태·전력·대기 차량",
    "en": "Chargers, power and the cars waiting"
  },
  domain: "energy",
  styles: [
    "drawing"
  ],
  summary: {
    "ko": "전기차 충전 허브를 인쇄회로기판으로 — 초록 솔더 마스크, 고정 구멍과 기준 마크가 있는 기판 테두리, 흰 실크스크린, 그리고 가운데를 내려가는 구리 전력 간선(위의 수전반과 ESS가 먹인다). 충전기 여덟 대는 기판 위의 칩이고, 칩마다 간선의 비아에서 짧은 구리 트레이스로 전력을 받는다. 트레이스는 그 충전기가 지금 끄는 전력을 싣는다 — 굵기와 kW, 충전 중이면 밝은 구리, 멈춰 있으면 흐린 구리, 고장이면 빨간 끊긴 선. 칩 상태는 색과 함께 상태 LED와 기호로: 켜진 삼각형 충전 중, 빈 고리 비어 있음, 반쪽 고리 완충된 차가 아직 꽂혀 있음, ✕ 고장. 오른쪽에 기판 표제란, 지금 수치, 범례, 대기 차량, 오늘 시간별 충전량. 충전 허브는 지어낸 것이라 예시 데이터입니다.",
    "en": "An EV charging hub drawn as a printed circuit board — green solder mask, a board outline with mounting holes and fiducials, white silkscreen, and a copper power trunk down the middle, fed by the grid intake and the battery at the top. The eight chargers are chips on the board, and each takes its power from a via on the trunk through a short copper trace. The trace carries what its charger draws now — its width and its kilowatts, bright copper while it charges, dull copper while it stands, red and broken when it is faulted. A chip tells its state by its status LED and a sign as well as by colour: a lit triangle charging, an empty ring free, a half ring when a full car is still plugged in, a cross when it is down. On the right the board’s title block, the figures now, the key, the cars waiting and the energy through the day. The hub is made up. Example data."
  },
  connectors: [
    {
      "key": "hub",
      "name": "예시 충전 허브 API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 충전소가 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
