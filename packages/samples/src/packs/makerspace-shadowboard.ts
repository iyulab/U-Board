// A makerspace's tool wall as a shadow board: a pegboard with every tool hung on it over its own shadow, painted in red,
// so a missing tool is seen at a glance — the shadow shows. A tool lent out shows its shadow and a black embossed
// label tape with who has it and when it is due back; one overdue shows a red tape with a bang; one away for repair a
// yellow tape with a gear. Below, the machines — three printers, a laser cutter, a CNC router — each a card with what
// it is doing, how far it is and who booked it. On the right the space's name on label tape, the figures now, the
// key, the machine bookings for the evening and the loans through the day. The space is made up, so the values are
// example data.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/makerspace-shadowboard.js';

const board: Board = {
  "board": {
    "theme": "light",
    "accent": "#c8321f"
  },
  "elements": {
    "slot": {
      "template": "<figure class=\"sl {{t.kind}} {{t.state}}\"><i class=\"shadow\"></i><i class=\"tool\"></i><figcaption><b>{{t.name}}</b><span class=\"tag\">{{t.tag}}</span></figcaption></figure>",
      "style": ".sl{position:relative;height:100%;margin:0;box-sizing:border-box;display:grid;grid-template-rows:1fr auto;gap:6px;padding:12px 10px 10px;font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#1e2226}\n.shadow,.tool{grid-row:1;grid-column:1;width:100%;height:100%;-webkit-mask:var(--m) center/contain no-repeat;mask:var(--m) center/contain no-repeat}\n.shadow{background:#c8321f}\n.tool{background:linear-gradient(180deg,#5d6b78,#3b4651 55%,#262d34);transform:translate(-3px,-4px);filter:drop-shadow(0 0 0 transparent)}\nfigcaption{display:flex;justify-content:space-between;align-items:center;gap:8px;min-height:28px}\nb{font-size:14px;font-weight:800;color:#3d2b14}\n.tag{padding:3px 10px;border-radius:2px;background:#16181b;color:#fff;font:700 13px \"Arial Black\", \"Malgun Gothic\", sans-serif;letter-spacing:.06em;text-shadow:0 1px 0 rgba(0,0,0,.6),0 -1px 0 rgba(255,255,255,.25);white-space:nowrap}\n.in .tag{display:none}\n.out .tool,.overdue .tool,.repair .tool{display:none}\n.overdue .tag{background:#c21f1a}\n.overdue .tag::before{content:\"! \"}\n.repair .tag{background:#f2c230;color:#1e2226;text-shadow:0 1px 0 rgba(255,255,255,.5)}\n.repair .tag::before{content:\"⚙ \"}\n.repair .shadow{background:repeating-linear-gradient(-45deg,#c8321f 0 6px,#e8a08f 6px 12px)}\n.hammer{--m:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20120%2048%22%3E%3Cpath%20d%3D%22M6%2020h86v8H6z%20M88%205h24v38H88z%22%20fill%3D%22black%22%2F%3E%3C%2Fsvg%3E\")}\n.screwdriver{--m:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20120%2048%22%3E%3Cpath%20d%3D%22M4%2017h40a7%207%200%200%201%200%2014H4a7%207%200%200%201%200-14z%20M44%2021h60l10%203-10%203H44z%22%20fill%3D%22black%22%2F%3E%3C%2Fsvg%3E\")}\n.wrench{--m:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20120%2048%22%3E%3Cpath%20d%3D%22M24%2020h62v8H24z%20M18%209a15%2015%200%201%200%200%2030l8-8v-14z%20M100%2010a14%2014%200%201%201%200%2028a14%2014%200%201%201%200-28z%22%20fill%3D%22black%22%2F%3E%3C%2Fsvg%3E\")}\n.saw{--m:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20120%2048%22%3E%3Cpath%20d%3D%22M4%2014h30v20H4z%20M34%2011h82l-8%2026H34z%22%20fill%3D%22black%22%2F%3E%3C%2Fsvg%3E\")}\n.pliers{--m:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20120%2048%22%3E%3Cpath%20d%3D%22M4%2018l52-3v6L4%2024z%20M4%2028l52%201v6L4%2034z%20M56%2015l56%209-56%2011z%22%20fill%3D%22black%22%2F%3E%3C%2Fsvg%3E\")}\n.drill{--m:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20120%2048%22%3E%3Cpath%20d%3D%22M8%206h66v22H8z%20M30%2028h20v18H30z%20M74%2014h38v6H74z%22%20fill%3D%22black%22%2F%3E%3C%2Fsvg%3E\")}\n.tape{--m:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20120%2048%22%3E%3Cpath%20d%3D%22M38%204a20%2020%200%201%201%200%2040a20%2020%200%201%201%200-40z%20M56%2019h56v8H56z%22%20fill%3D%22black%22%2F%3E%3C%2Fsvg%3E\")}\n.level{--m:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20120%2048%22%3E%3Cpath%20d%3D%22M4%2015h112v18H4z%22%20fill%3D%22black%22%2F%3E%3C%2Fsvg%3E\")}\n.clamp{--m:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20120%2048%22%3E%3Cpath%20d%3D%22M8%204h10v40H8z%20M8%204h74v9H8z%20M18%2030h50v8H18z%20M58%2038h7v10h-7z%22%20fill%3D%22black%22%2F%3E%3C%2Fsvg%3E\")}\n.chisel{--m:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20120%2048%22%3E%3Cpath%20d%3D%22M4%2017h46a7%207%200%200%201%200%2014H4z%20M50%2020h52l12%204-12%204H50z%22%20fill%3D%22black%22%2F%3E%3C%2Fsvg%3E\")}\n.glue{--m:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20120%2048%22%3E%3Cpath%20d%3D%22M8%208h58v20H8z%20M24%2028h18v18H24z%20M66%2015h34l14%203-14%203H66z%22%20fill%3D%22black%22%2F%3E%3C%2Fsvg%3E\")}\n.square{--m:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20120%2048%22%3E%3Cpath%20d%3D%22M8%206h14v36H8z%20M8%2030h104v12H8z%22%20fill%3D%22black%22%2F%3E%3C%2Fsvg%3E\")}",
      "props": {
        "t": "object"
      }
    },
    "machine": {
      "template": "<article class=\"mc {{m.state}}\"><header><b>{{m.name}}</b><i></i></header><small>{{m.kind}}</small><p>{{m.job}}</p><div class=\"bar\" style=\"--v: {{m.pct}}\"><span></span></div><footer><em>{{m.word}}</em><span>{{m.left}}</span></footer></article>",
      "style": ".mc{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto auto 1fr auto auto;gap:5px;padding:12px 14px;background:#faf7f0;border-radius:4px;box-shadow:0 3px 0 #2c3136;font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#1e2226}\nheader{display:flex;justify-content:space-between;align-items:center}\nb{font-size:17px;font-weight:900}\ni{display:grid;place-items:center;width:24px;height:24px;border-radius:50%;font:900 12px \"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;font-style:normal;box-sizing:border-box}\nsmall{font-size:12px;color:#5b6168}\np{margin:0;font-size:14px;font-weight:700}\n.bar{height:8px;border-radius:4px;background:#e2ddd2;overflow:hidden}\n.bar span{display:block;height:100%;width:calc(var(--v) * 1%);background:#3b4651}\nfooter{display:flex;justify-content:space-between;font-size:13px}\nem{font-style:normal;font-weight:900}\n.running i{background:#2e8b57;color:#fff}\n.running i::before{content:\"▶\"}\n.idle i{border:3px solid #9aa0a6}\n.booked i{background:#f2c230;color:#1e2226}\n.booked i::before{content:\"◷\"}\n.fault{background:repeating-linear-gradient(-45deg,#faf7f0 0 8px,#f1dfda 8px 16px)}\n.fault i{background:#c21f1a;color:#fff}\n.fault i::before{content:\"✕\"}\n.fault em{color:#c21f1a}",
      "props": {
        "m": "object"
      }
    },
    "title": {
      "template": "<header class=\"tt\"><small>{{t.series}}</small><h1><span>{{t.name}}</span></h1><div><span>{{t.date}}</span><b>{{t.time}}</b></div></header>",
      "style": ".tt{height:100%;box-sizing:border-box;display:grid;align-content:center;gap:6px;font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#faf7f0}\nsmall{font-size:14px;font-weight:700;letter-spacing:.14em;color:#c9ced3}\nh1{margin:0}\nh1 span{display:inline-block;padding:6px 18px;background:#c21f1a;color:#fff;font:400 38px \"Arial Black\", \"Malgun Gothic\", sans-serif;letter-spacing:.08em;text-shadow:0 2px 0 rgba(0,0,0,.45),0 -1px 0 rgba(255,255,255,.3);transform:rotate(-1deg)}\ndiv{display:flex;justify-content:space-between;align-items:baseline}\ndiv span{font-size:16px}\nb{padding:0 12px;background:#16181b;color:#fff;font:400 26px \"Arial Black\", \"Malgun Gothic\", sans-serif;letter-spacing:.06em}",
      "props": {
        "t": "object"
      }
    },
    "figures": {
      "template": "<dl class=\"fg\">{{#items}}<div><dt>{{label}}</dt><dd>{{value}}</dd><small>{{note}}</small></div>{{/items}}</dl>",
      "style": ".fg{margin:0;height:100%;box-sizing:border-box;display:grid;grid-template-columns:repeat(3,1fr);gap:14px;font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#1e2226}\ndiv{display:grid;align-content:center;justify-items:center;text-align:center;background:#faf7f0;border-radius:4px;box-shadow:0 3px 0 #2c3136}\ndt{font-size:13px;font-weight:700}\ndd{margin:0;font-size:30px;font-weight:900;color:#c8321f}\nsmall{font-size:12px}",
      "props": {
        "items": "list"
      }
    },
    "legend": {
      "template": "<ul class=\"ky\"><li><i class=\"tool\"></i>제자리</li><li><i class=\"sh\"></i><b>회원 214</b>대여 중</li><li><b class=\"red\">! 기한</b>지남</li><li><b class=\"yel\">⚙ 수리</b>중</li></ul>",
      "style": ".ky{height:100%;box-sizing:border-box;margin:0;padding:0 14px;list-style:none;display:flex;align-items:center;justify-content:space-between;background:#faf7f0;border-radius:4px;box-shadow:0 3px 0 #2c3136;font:800 13px \"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#1e2226}\nli{display:flex;align-items:center;gap:6px}\ni{display:inline-block;width:30px;height:12px;border-radius:2px}\n.tool{background:#3b4651}\n.sh{background:#c8321f}\nb{padding:2px 6px;background:#16181b;color:#fff;font:700 11px \"Arial Black\", \"Malgun Gothic\", sans-serif;letter-spacing:.05em}\n.red{background:#c21f1a}\n.yel{background:#f2c230;color:#1e2226}"
    },
    "bookings": {
      "template": "<section class=\"bk\"><h2>오늘 저녁 장비 예약</h2><ol>{{#items}}<li class=\"{{state}}\"><b>{{time}}</b><strong>{{machine}}</strong><span>{{what}}</span><small>{{who}}</small></li>{{/items}}</ol></section>",
      "style": ".bk{height:100%;box-sizing:border-box;padding:14px 18px;background:#faf7f0;border-radius:4px;box-shadow:0 3px 0 #2c3136;font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#1e2226}\nh2{margin:0 0 8px;font-size:17px;font-weight:900}\nol{margin:0;padding:0;list-style:none;display:grid;gap:4px}\nli{display:grid;grid-template-columns:68px 96px 1fr 70px;align-items:center;gap:10px;padding:5px 6px;border-bottom:1px dashed #cfc8b8;font-size:14px}\nb{font-weight:900}\nstrong{font-weight:800}\nsmall{text-align:right;color:#5b6168}\n.now{background:#fbe9c6}\n.now b::before{content:\"▶ \"}\n.done{opacity:.55}",
      "props": {
        "items": "list"
      }
    }
  },
  "data": {
    "tools": {
      "from": "shop",
      "path": "/shop/tools",
      "time": "updatedAt",
      "fresh": 3600,
      "fields": {
        "hammer": {
          "at": "/value/hammer"
        },
        "saw": {
          "at": "/value/saw"
        },
        "drill": {
          "at": "/value/drill"
        },
        "level": {
          "at": "/value/level"
        },
        "wrench": {
          "at": "/value/wrench"
        },
        "pliers": {
          "at": "/value/pliers"
        },
        "screwdriver": {
          "at": "/value/screwdriver"
        },
        "clamp": {
          "at": "/value/clamp"
        },
        "tape": {
          "at": "/value/tape"
        },
        "chisel": {
          "at": "/value/chisel"
        },
        "glue": {
          "at": "/value/glue"
        },
        "square": {
          "at": "/value/square"
        }
      }
    },
    "machines": {
      "from": "shop",
      "path": "/shop/machines",
      "time": "updatedAt",
      "fresh": 3600,
      "fields": {
        "p1": {
          "at": "/value/p1"
        },
        "p2": {
          "at": "/value/p2"
        },
        "p3": {
          "at": "/value/p3"
        },
        "laser": {
          "at": "/value/laser"
        },
        "cnc": {
          "at": "/value/cnc"
        }
      }
    },
    "now": {
      "from": "shop",
      "path": "/shop/now",
      "time": "updatedAt",
      "fresh": 3600,
      "fields": {
        "value": {}
      }
    },
    "figures": {
      "from": "shop",
      "path": "/shop/figures",
      "time": "updatedAt",
      "fresh": 3600,
      "fields": {
        "value": {}
      }
    },
    "bookings": {
      "from": "shop",
      "path": "/shop/bookings",
      "time": "updatedAt",
      "fresh": 3600,
      "fields": {
        "value": {}
      }
    },
    "loans": {
      "from": "shop",
      "path": "/shop/loans",
      "list": "/value",
      "fresh": 3600,
      "answerTime": "/updatedAt"
    }
  },
  "parts": {
    "slot-hammer": {
      "as": "element",
      "element": "slot",
      "of": "tools",
      "bind": {
        "t": "hammer"
      }
    },
    "slot-saw": {
      "as": "element",
      "element": "slot",
      "of": "tools",
      "bind": {
        "t": "saw"
      }
    },
    "slot-drill": {
      "as": "element",
      "element": "slot",
      "of": "tools",
      "bind": {
        "t": "drill"
      }
    },
    "slot-level": {
      "as": "element",
      "element": "slot",
      "of": "tools",
      "bind": {
        "t": "level"
      }
    },
    "slot-wrench": {
      "as": "element",
      "element": "slot",
      "of": "tools",
      "bind": {
        "t": "wrench"
      }
    },
    "slot-pliers": {
      "as": "element",
      "element": "slot",
      "of": "tools",
      "bind": {
        "t": "pliers"
      }
    },
    "slot-screwdriver": {
      "as": "element",
      "element": "slot",
      "of": "tools",
      "bind": {
        "t": "screwdriver"
      }
    },
    "slot-clamp": {
      "as": "element",
      "element": "slot",
      "of": "tools",
      "bind": {
        "t": "clamp"
      }
    },
    "slot-tape": {
      "as": "element",
      "element": "slot",
      "of": "tools",
      "bind": {
        "t": "tape"
      }
    },
    "slot-chisel": {
      "as": "element",
      "element": "slot",
      "of": "tools",
      "bind": {
        "t": "chisel"
      }
    },
    "slot-glue": {
      "as": "element",
      "element": "slot",
      "of": "tools",
      "bind": {
        "t": "glue"
      }
    },
    "slot-square": {
      "as": "element",
      "element": "slot",
      "of": "tools",
      "bind": {
        "t": "square"
      }
    },
    "machine-p1": {
      "as": "element",
      "element": "machine",
      "of": "machines",
      "bind": {
        "m": "p1"
      }
    },
    "machine-p2": {
      "as": "element",
      "element": "machine",
      "of": "machines",
      "bind": {
        "m": "p2"
      }
    },
    "machine-p3": {
      "as": "element",
      "element": "machine",
      "of": "machines",
      "bind": {
        "m": "p3"
      }
    },
    "machine-laser": {
      "as": "element",
      "element": "machine",
      "of": "machines",
      "bind": {
        "m": "laser"
      }
    },
    "machine-cnc": {
      "as": "element",
      "element": "machine",
      "of": "machines",
      "bind": {
        "m": "cnc"
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
    "bookings": {
      "as": "element",
      "element": "bookings",
      "of": "bookings",
      "bind": {
        "items": "value"
      }
    },
    "loans": {
      "as": "chart.bar",
      "of": "loans",
      "title": "오늘 시간별 공구 대여 (건)",
      "x": "hour",
      "y": "loans",
      "series": [
        {
          "label": "대여",
          "color": "#c8321f"
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
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221600%22%20height%3D%221000%22%20viewBox%3D%220%200%201600%201000%22%3E%0A%3Cdefs%3E%3Cpattern%20id%3D%22p%22%20width%3D%2224%22%20height%3D%2224%22%20patternUnits%3D%22userSpaceOnUse%22%3E%3Ccircle%20cx%3D%2212%22%20cy%3D%2212%22%20r%3D%223.6%22%20fill%3D%22%235b4122%22%2F%3E%3Ccircle%20cx%3D%2212.6%22%20cy%3D%2212.8%22%20r%3D%223.6%22%20fill%3D%22%23a8834f%22%20opacity%3D%22.5%22%2F%3E%3C%2Fpattern%3E%0A%3Cpattern%20id%3D%22w%22%20width%3D%22200%22%20height%3D%2240%22%20patternUnits%3D%22userSpaceOnUse%22%3E%3Cpath%20d%3D%22M0%2012%20C%2050%208%20120%2018%20200%2012%20M0%2030%20C%2070%2034%20140%2026%20200%2031%22%20stroke%3D%22%23b8925c%22%20stroke-width%3D%222%22%20fill%3D%22none%22%20opacity%3D%22.5%22%2F%3E%3C%2Fpattern%3E%3C%2Fdefs%3E%0A%3Crect%20width%3D%221600%22%20height%3D%221000%22%20fill%3D%22%233a3f45%22%2F%3E%0A%3Crect%20x%3D%2224%22%20y%3D%2224%22%20width%3D%22992%22%20height%3D%22664%22%20rx%3D%224%22%20fill%3D%22%23c9a26b%22%2F%3E%0A%3Crect%20x%3D%2224%22%20y%3D%2224%22%20width%3D%22992%22%20height%3D%22664%22%20rx%3D%224%22%20fill%3D%22url(%23w)%22%2F%3E%0A%3Crect%20x%3D%2224%22%20y%3D%2224%22%20width%3D%22992%22%20height%3D%22664%22%20rx%3D%224%22%20fill%3D%22url(%23p)%22%2F%3E%0A%3Crect%20x%3D%2224%22%20y%3D%2224%22%20width%3D%22992%22%20height%3D%22664%22%20rx%3D%224%22%20fill%3D%22none%22%20stroke%3D%22%237d5f35%22%20stroke-width%3D%226%22%2F%3E%0A%3Crect%20x%3D%2244%22%20y%3D%2260%22%20width%3D%22640%22%20height%3D%2258%22%20rx%3D%223%22%20fill%3D%22%23faf7f0%22%2F%3E%0A%3Ctext%20x%3D%2262%22%20y%3D%22102%22%20font-family%3D%22Malgun%20Gothic%2C%20sans-serif%22%20font-weight%3D%22900%22%20font-size%3D%2232%22%20fill%3D%22%23c8321f%22%20letter-spacing%3D%224%22%3E%EA%B3%B5%EA%B5%AC%20%EB%B2%BD%3C%2Ftext%3E%0A%3Ctext%20x%3D%22224%22%20y%3D%2298%22%20font-family%3D%22Malgun%20Gothic%2C%20sans-serif%22%20font-weight%3D%22700%22%20font-size%3D%2216%22%20fill%3D%22%235b4122%22%3E%EB%B9%A8%EA%B0%84%20%EA%B7%B8%EB%A6%BC%EC%9E%90%EA%B0%80%20%EB%B3%B4%EC%9D%B4%EB%A9%B4%20%EA%B7%B8%20%EA%B3%B5%EA%B5%AC%EB%8A%94%20%EB%82%98%EA%B0%80%20%EC%9E%88%EC%8A%B5%EB%8B%88%EB%8B%A4%3C%2Ftext%3E%0A%3Crect%20x%3D%2224%22%20y%3D%22704%22%20width%3D%22992%22%20height%3D%22272%22%20rx%3D%224%22%20fill%3D%22%23545a61%22%2F%3E%0A%3Crect%20x%3D%2224%22%20y%3D%22704%22%20width%3D%22992%22%20height%3D%2210%22%20fill%3D%22%236b7279%22%2F%3E%0A%3Ctext%20x%3D%2256%22%20y%3D%22748%22%20font-family%3D%22Arial%20Black%2C%20Malgun%20Gothic%2C%20sans-serif%22%20font-size%3D%2222%22%20fill%3D%22%23faf7f0%22%20letter-spacing%3D%223%22%3E%EC%9E%A5%EB%B9%84%3C%2Ftext%3E%0A%3Crect%20x%3D%221032%22%20y%3D%22648%22%20width%3D%22544%22%20height%3D%22328%22%20rx%3D%224%22%20fill%3D%22%23faf7f0%22%2F%3E%0A%3C%2Fsvg%3E",
    "place": {
      "slot-hammer": [
        48,
        130,
        220,
        160
      ],
      "slot-saw": [
        288,
        130,
        220,
        160
      ],
      "slot-drill": [
        528,
        130,
        220,
        160
      ],
      "slot-level": [
        768,
        130,
        220,
        160
      ],
      "slot-wrench": [
        48,
        314,
        220,
        160
      ],
      "slot-pliers": [
        288,
        314,
        220,
        160
      ],
      "slot-screwdriver": [
        528,
        314,
        220,
        160
      ],
      "slot-clamp": [
        768,
        314,
        220,
        160
      ],
      "slot-tape": [
        48,
        498,
        220,
        160
      ],
      "slot-chisel": [
        288,
        498,
        220,
        160
      ],
      "slot-glue": [
        528,
        498,
        220,
        160
      ],
      "slot-square": [
        768,
        498,
        220,
        160
      ],
      "machine-p1": [
        48,
        766,
        176,
        196
      ],
      "machine-p2": [
        240,
        766,
        176,
        196
      ],
      "machine-p3": [
        432,
        766,
        176,
        196
      ],
      "machine-laser": [
        624,
        766,
        176,
        196
      ],
      "machine-cnc": [
        816,
        766,
        176,
        196
      ],
      "title": [
        1040,
        30,
        532,
        160
      ],
      "figures": [
        1040,
        204,
        532,
        110
      ],
      "legend": [
        1040,
        330,
        532,
        50
      ],
      "bookings": [
        1040,
        398,
        532,
        226
      ],
      "loans": [
        1052,
        660,
        508,
        300
      ]
    }
  }
};

export const makerspaceShadowboard: SamplePack = {
  id: "makerspace-shadowboard",
  title: {
    "ko": "메이커스페이스 공구 벽 — 그림자판",
    "en": "A makerspace’s tool wall — a shadow board"
  },
  field: {
    "ko": "메이커스페이스·공방",
    "en": "Makerspace & workshop"
  },
  kind: {
    "ko": "공구 대여·장비 상태·예약",
    "en": "Tool loans, machines and bookings"
  },
  domain: "services",
  styles: [
    "craft"
  ],
  summary: {
    "ko": "메이커스페이스의 공구 벽을 그림자판으로 — 타공판에 공구마다 제 모양의 빨간 그림자를 칠해 두고 그 위에 공구를 건다. 그래서 빠진 공구는 한눈에 보인다: 그림자가 드러난다. 빌려 간 공구는 그림자와 검은 엠보싱 라벨(누가·언제까지), 기한이 지난 것은 빨간 라벨에 느낌표, 수리 중인 것은 노란 라벨에 톱니와 빗금 그림자. 아래에는 장비 — 3D 프린터 셋, 레이저 커터, CNC — 를 카드마다 지금 하는 일·진행·예약자로. 오른쪽에 라벨 테이프로 쓴 공간 이름, 지금 수치, 범례, 오늘 저녁 장비 예약, 시간별 대여. 메이커스페이스는 지어낸 것이라 예시 데이터입니다.",
    "en": "A makerspace’s tool wall as a shadow board — a pegboard with every tool hung over its own shadow painted in red, so a missing tool is seen at a glance: its shadow shows. A tool lent out shows its shadow and a black embossed label tape with who has it and until when; one overdue a red tape with a bang; one away for repair a yellow tape with a gear over a hatched shadow. Below, the machines — three 3D printers, a laser cutter, a CNC router — each a card with what it is doing, how far along and who booked it. On the right the space’s name on label tape, the figures now, the key, the evening’s machine bookings and the loans through the day. The space is made up. Example data."
  },
  connectors: [
    {
      "key": "shop",
      "name": "예시 메이커스페이스 API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 메이커스페이스가 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
