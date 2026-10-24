// A call centre's afternoon pinned to a corkboard: a wooden frame, cork speckled brown, every agent a paper note fixed to
// it. A note's state is told by how it is fixed and by a mark in its corner, as well as by its paper's colour: a strip of
// masking tape across it and a handset while the agent is on a call, a round push pin and an open ring when they are
// ready, a folded corner and a pencil while they write up a call, a single tack and a pause mark on a break. Below, the
// calls waiting on an index card and the day's calls by kind as tally strokes; on the right a kraft paper banner, the
// figures on torn notes, the key and the calls coming in by the hour on a sheet of graph paper. The centre is made up, so
// the values are example data.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/callcenter-cork.js';

const board: Board = {
  "board": {
    "theme": "light",
    "accent": "#d4352b"
  },
  "elements": {
    "agent": {
      "template": "<article class=\"nt {{a.state}}\"><s></s><header><b>{{a.name}}</b><i></i></header><p>{{a.word}}</p><dl><dt>지금</dt><dd>{{a.since}}</dd><dt>오늘</dt><dd>{{a.calls}}</dd></dl></article>",
      "style": ".nt{position:relative;height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto auto 1fr;gap:4px;padding:22px 16px 12px;background:#fffdf6;box-shadow:2px 4px 6px rgba(60,35,15,.35);font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#2b2a33}\ns{position:absolute;text-decoration:none}\nheader{display:flex;justify-content:space-between;align-items:center}\nb{font:700 26px \"Nanum Pen Script\", \"Gaegu\", \"Comic Sans MS\", cursive;line-height:1}\ni{font-style:normal;font:700 20px \"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;width:30px;height:30px;display:grid;place-items:center;border-radius:50%;border:2px solid #2b2a33}\np{margin:0;font-size:16px;font-weight:800}\ndl{margin:0;display:grid;grid-template-columns:auto 1fr;column-gap:10px;align-content:end;font-size:14px;border-top:1px dashed rgba(43,42,51,.4);padding-top:4px}\ndt{color:#5b5960}\ndd{margin:0;text-align:right;font-weight:700}\n.talk{background:#ffe27a;transform:rotate(-1deg)}\n.talk s{left:30%;right:30%;top:-8px;height:22px;background:rgba(245,236,205,.82);clip-path:polygon(3% 0,97% 6%,100% 50%,96% 100%,2% 94%,0 45%)}\n.talk i::before{content:\"☎\"}\n.ready{background:#c8efc1;transform:rotate(1deg)}\n.ready s{left:calc(50% - 10px);top:2px;width:20px;height:20px;background:radial-gradient(circle at 40% 35%,#ffffff 0 2px,#2f8f46 3px 8px,rgba(0,0,0,.35) 9px,transparent 10px)}\n.ready i{border-radius:50%;border:3px solid #2f8f46}\n.wrap{background:#bfe1f5;clip-path:polygon(0 0,100% 0,100% calc(100% - 24px),calc(100% - 24px) 100%,0 100%)}\n.wrap dl{margin-right:20px}\n.wrap::after{content:\"\";position:absolute;right:0;bottom:0;width:24px;height:24px;background:linear-gradient(135deg,#8fb8d0 50%,transparent 50%)}\n.wrap s{left:calc(50% - 10px);top:2px;width:20px;height:20px;background:radial-gradient(circle at 40% 35%,#ffffff 0 2px,#2f6fb0 3px 8px,rgba(0,0,0,.35) 9px,transparent 10px)}\n.wrap i{border:none}\n.wrap i::before{content:\"✎\";font-size:24px}\n.break{background:#f2d0e4;transform:rotate(4deg);opacity:.92}\n.break s{left:14px;top:4px;width:16px;height:16px;background:radial-gradient(circle at 40% 35%,#ffffff 0 2px,#8a8a8a 3px 8px,rgba(0,0,0,.35) 9px,transparent 10px)}\n.break i{border-style:dashed}\n.break i::before{content:\"‖\"}",
      "props": {
        "a": "object"
      }
    },
    "queue": {
      "template": "<section class=\"qc\"><h2>기다리는 전화</h2><ol>{{#items}}<li class=\"{{state}}\"><b>{{no}}</b><span>{{kind}}</span><strong>{{wait}}</strong><small>{{note}}</small></li>{{/items}}</ol></section>",
      "style": ".qc{height:100%;box-sizing:border-box;padding:16px 22px;background:repeating-linear-gradient(#fffdf6 0 39px,#a9c8e6 39px 40px) 0 64px / 100% calc(100% - 64px) no-repeat,#fffdf6;border-top:3px solid #d4352b;box-shadow:2px 4px 6px rgba(60,35,15,.35);font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#2b2a33}\nh2{margin:0 0 16px;font:700 32px \"Nanum Pen Script\", \"Gaegu\", \"Comic Sans MS\", cursive;line-height:1}\nol{margin:0;padding:0;list-style:none;display:grid;grid-auto-rows:40px}\nli{display:grid;grid-template-columns:34px 1fr 90px 120px;align-items:center;gap:10px;font-size:16px}\nb{font-weight:800}\nstrong{text-align:right;font-weight:800}\nsmall{font-size:13px;text-align:right}\n.long strong{color:#d4352b;border:2px solid #d4352b;border-radius:50% / 60%;padding:0 6px;text-align:center}\n.long b::after{content:\" !\";color:#d4352b}\n.callback strong{color:#d4352b;border:2px solid #d4352b;border-radius:50% / 60%;padding:0 6px;text-align:center}\n.callback b::after{content:\" !\";color:#d4352b}\n.callback small{font-weight:700}\n.callback small::before{content:\"↺ \"}",
      "props": {
        "items": "list"
      }
    },
    "tally": {
      "template": "<section class=\"tl\"><h2>오늘 문의 — 한 획 5콜</h2><ul>{{#items}}<li><b>{{kind}}</b><i style=\"--n: {{marks}}\"></i><span>{{count}}</span></li>{{/items}}</ul></section>",
      "style": ".tl{height:100%;box-sizing:border-box;padding:16px 20px;background:#fffdf6;transform:rotate(-1.2deg);box-shadow:2px 4px 6px rgba(60,35,15,.35);font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#2b2a33}\nh2{margin:0 0 12px;font:700 28px \"Nanum Pen Script\", \"Gaegu\", \"Comic Sans MS\", cursive;line-height:1}\nul{margin:0;padding:0;list-style:none;display:grid;gap:26px}\nli{display:grid;grid-template-columns:82px 1fr 44px;align-items:center;gap:8px}\nb{font-size:14px}\ni{display:block;height:22px;width:calc(var(--n) * 6px);background:repeating-linear-gradient(90deg,#2b2a33 0 2px,transparent 2px 6px);-webkit-mask:repeating-linear-gradient(90deg,#000 0 30px,transparent 30px 36px);mask:repeating-linear-gradient(90deg,#000 0 30px,transparent 30px 36px)}\nspan{font-weight:800;text-align:right}",
      "props": {
        "items": "list"
      }
    },
    "banner": {
      "template": "<header class=\"bn\"><s></s><u></u><small>{{b.series}}</small><h1>{{b.name}}</h1><div><span>{{b.date}}</span><b>{{b.time}}</b></div></header>",
      "style": ".bn{position:relative;height:100%;box-sizing:border-box;display:grid;align-content:center;gap:2px;padding:18px 26px 12px;background:#d8b98a;box-shadow:2px 4px 6px rgba(60,35,15,.35);font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#3b2a18}\ns,u{position:absolute;top:-8px;width:90px;height:24px;text-decoration:none;background:rgba(245,236,205,.82);clip-path:polygon(3% 0,97% 6%,100% 50%,96% 100%,2% 94%,0 45%)}\ns{left:18px;transform:rotate(-6deg)}\nu{right:18px;transform:rotate(5deg)}\nsmall{font-size:14px;letter-spacing:.2em;font-weight:700}\nh1{margin:0;font:700 56px \"Nanum Pen Script\", \"Gaegu\", \"Comic Sans MS\", cursive;line-height:1}\ndiv{display:flex;justify-content:space-between;align-items:baseline}\nspan{font-size:16px}\nb{font-size:28px;font-weight:800}",
      "props": {
        "b": "object"
      }
    },
    "figures": {
      "template": "<dl class=\"fg\">{{#items}}<div><dt>{{label}}</dt><dd>{{value}}</dd><small>{{note}}</small></div>{{/items}}</dl>",
      "style": ".fg{margin:0;height:100%;box-sizing:border-box;display:grid;grid-template-columns:repeat(3,1fr);gap:16px;font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#2b2a33}\ndiv{display:grid;align-content:center;justify-items:center;text-align:center;background:#fffdf6;box-shadow:2px 4px 6px rgba(60,35,15,.35);clip-path:polygon(0 4%,8% 0,20% 3%,34% 0,48% 4%,62% 1%,76% 4%,90% 0,100% 3%,100% 100%,0 100%)}\ndiv:nth-child(2){transform:rotate(1.5deg)}\ndt{font-size:13px;font-weight:700}\ndd{margin:0;font:700 40px \"Nanum Pen Script\", \"Gaegu\", \"Comic Sans MS\", cursive;line-height:1}\nsmall{font-size:12px}",
      "props": {
        "items": "list"
      }
    },
    "legend": {
      "template": "<ul class=\"ky\"><li><i class=\"talk\">☎</i>테이프 — 통화</li><li><i class=\"ready\"></i>압정 — 받을 수 있음</li><li><i class=\"wrap\">✎</i>접힌 귀 — 후처리</li><li><i class=\"break\">‖</i>휴식</li></ul>",
      "style": ".ky{height:100%;box-sizing:border-box;margin:0;padding:0 14px;list-style:none;display:flex;align-items:center;justify-content:space-between;background:#fffdf6;box-shadow:2px 4px 6px rgba(60,35,15,.35);font:700 13px \"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#2b2a33}\nli{display:flex;align-items:center;gap:6px}\ni{width:24px;height:24px;display:grid;place-items:center;font-style:normal;font-size:14px;box-sizing:border-box}\n.talk{background:#ffe27a}\n.ready{background:#c8efc1;border-radius:50%;border:3px solid #2f8f46}\n.wrap{background:#bfe1f5}\n.break{background:#f2d0e4;border:2px dashed #2b2a33;border-radius:50%}"
    }
  },
  "data": {
    "agents": {
      "from": "centre",
      "path": "/centre/agents",
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
        "a5": {
          "at": "/value/a5"
        },
        "a6": {
          "at": "/value/a6"
        },
        "a7": {
          "at": "/value/a7"
        },
        "a8": {
          "at": "/value/a8"
        },
        "a9": {
          "at": "/value/a9"
        },
        "a10": {
          "at": "/value/a10"
        },
        "a11": {
          "at": "/value/a11"
        },
        "a12": {
          "at": "/value/a12"
        }
      }
    },
    "queue": {
      "from": "centre",
      "path": "/centre/queue",
      "time": "updatedAt",
      "fresh": 300,
      "fields": {
        "value": {}
      }
    },
    "tally": {
      "from": "centre",
      "path": "/centre/tally",
      "time": "updatedAt",
      "fresh": 300,
      "fields": {
        "value": {}
      }
    },
    "now": {
      "from": "centre",
      "path": "/centre/now",
      "time": "updatedAt",
      "fresh": 300,
      "fields": {
        "value": {}
      }
    },
    "figures": {
      "from": "centre",
      "path": "/centre/figures",
      "time": "updatedAt",
      "fresh": 300,
      "fields": {
        "value": {}
      }
    },
    "inbound": {
      "from": "centre",
      "path": "/centre/inbound",
      "list": "/value",
      "fresh": 300,
      "answerTime": "/updatedAt"
    }
  },
  "parts": {
    "agent-a1": {
      "as": "element",
      "element": "agent",
      "of": "agents",
      "bind": {
        "a": "a1"
      }
    },
    "agent-a2": {
      "as": "element",
      "element": "agent",
      "of": "agents",
      "bind": {
        "a": "a2"
      }
    },
    "agent-a3": {
      "as": "element",
      "element": "agent",
      "of": "agents",
      "bind": {
        "a": "a3"
      }
    },
    "agent-a4": {
      "as": "element",
      "element": "agent",
      "of": "agents",
      "bind": {
        "a": "a4"
      }
    },
    "agent-a5": {
      "as": "element",
      "element": "agent",
      "of": "agents",
      "bind": {
        "a": "a5"
      }
    },
    "agent-a6": {
      "as": "element",
      "element": "agent",
      "of": "agents",
      "bind": {
        "a": "a6"
      }
    },
    "agent-a7": {
      "as": "element",
      "element": "agent",
      "of": "agents",
      "bind": {
        "a": "a7"
      }
    },
    "agent-a8": {
      "as": "element",
      "element": "agent",
      "of": "agents",
      "bind": {
        "a": "a8"
      }
    },
    "agent-a9": {
      "as": "element",
      "element": "agent",
      "of": "agents",
      "bind": {
        "a": "a9"
      }
    },
    "agent-a10": {
      "as": "element",
      "element": "agent",
      "of": "agents",
      "bind": {
        "a": "a10"
      }
    },
    "agent-a11": {
      "as": "element",
      "element": "agent",
      "of": "agents",
      "bind": {
        "a": "a11"
      }
    },
    "agent-a12": {
      "as": "element",
      "element": "agent",
      "of": "agents",
      "bind": {
        "a": "a12"
      }
    },
    "queue": {
      "as": "element",
      "element": "queue",
      "of": "queue",
      "bind": {
        "items": "value"
      }
    },
    "tally": {
      "as": "element",
      "element": "tally",
      "of": "tally",
      "bind": {
        "items": "value"
      }
    },
    "banner": {
      "as": "element",
      "element": "banner",
      "of": "now",
      "bind": {
        "b": "value"
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
    "inbound": {
      "as": "chart.line",
      "of": "inbound",
      "title": "시간별 들어온 전화(콜) — 14시는 25분까지",
      "x": "hour",
      "y": "calls",
      "series": [
        {
          "label": "인입",
          "color": "#d4352b"
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
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221600%22%20height%3D%221000%22%20viewBox%3D%220%200%201600%201000%22%3E%0A%3Cdefs%3E%0A%3Cpattern%20id%3D%22c%22%20width%3D%2260%22%20height%3D%2260%22%20patternUnits%3D%22userSpaceOnUse%22%3E%3Crect%20width%3D%2260%22%20height%3D%2260%22%20fill%3D%22%23c49a6c%22%2F%3E%3Ccircle%20cx%3D%220%22%20cy%3D%220%22%20r%3D%221%22%20fill%3D%22%23a87b4f%22%2F%3E%3Ccircle%20cx%3D%2237%22%20cy%3D%2223%22%20r%3D%221.6%22%20fill%3D%22%23d8b48a%22%2F%3E%3Ccircle%20cx%3D%2214%22%20cy%3D%2246%22%20r%3D%222.2%22%20fill%3D%22%238f6640%22%2F%3E%3Ccircle%20cx%3D%2251%22%20cy%3D%229%22%20r%3D%221%22%20fill%3D%22%23a87b4f%22%2F%3E%3Ccircle%20cx%3D%2228%22%20cy%3D%2232%22%20r%3D%221.6%22%20fill%3D%22%23d8b48a%22%2F%3E%3Ccircle%20cx%3D%225%22%20cy%3D%2255%22%20r%3D%222.2%22%20fill%3D%22%238f6640%22%2F%3E%3Ccircle%20cx%3D%2242%22%20cy%3D%2229%22%20r%3D%221%22%20fill%3D%22%23a87b4f%22%2F%3E%3Ccircle%20cx%3D%2219%22%20cy%3D%2252%22%20r%3D%221.6%22%20fill%3D%22%23d8b48a%22%2F%3E%3Ccircle%20cx%3D%2256%22%20cy%3D%2215%22%20r%3D%222.2%22%20fill%3D%22%238f6640%22%2F%3E%3Ccircle%20cx%3D%2233%22%20cy%3D%2238%22%20r%3D%221%22%20fill%3D%22%23a87b4f%22%2F%3E%3Ccircle%20cx%3D%2210%22%20cy%3D%221%22%20r%3D%221.6%22%20fill%3D%22%23d8b48a%22%2F%3E%3Ccircle%20cx%3D%2247%22%20cy%3D%2224%22%20r%3D%222.2%22%20fill%3D%22%238f6640%22%2F%3E%3Ccircle%20cx%3D%2224%22%20cy%3D%2258%22%20r%3D%221%22%20fill%3D%22%23a87b4f%22%2F%3E%3Ccircle%20cx%3D%221%22%20cy%3D%2221%22%20r%3D%221.6%22%20fill%3D%22%23d8b48a%22%2F%3E%3Ccircle%20cx%3D%2238%22%20cy%3D%2244%22%20r%3D%222.2%22%20fill%3D%22%238f6640%22%2F%3E%3Ccircle%20cx%3D%2215%22%20cy%3D%227%22%20r%3D%221%22%20fill%3D%22%23a87b4f%22%2F%3E%3Ccircle%20cx%3D%2252%22%20cy%3D%2230%22%20r%3D%221.6%22%20fill%3D%22%23d8b48a%22%2F%3E%3Ccircle%20cx%3D%2229%22%20cy%3D%2253%22%20r%3D%222.2%22%20fill%3D%22%238f6640%22%2F%3E%3Ccircle%20cx%3D%226%22%20cy%3D%2227%22%20r%3D%221%22%20fill%3D%22%23a87b4f%22%2F%3E%3Ccircle%20cx%3D%2243%22%20cy%3D%2250%22%20r%3D%221.6%22%20fill%3D%22%23d8b48a%22%2F%3E%3Ccircle%20cx%3D%2220%22%20cy%3D%2213%22%20r%3D%222.2%22%20fill%3D%22%238f6640%22%2F%3E%3Ccircle%20cx%3D%2257%22%20cy%3D%2236%22%20r%3D%221%22%20fill%3D%22%23a87b4f%22%2F%3E%3Ccircle%20cx%3D%2234%22%20cy%3D%2259%22%20r%3D%221.6%22%20fill%3D%22%23d8b48a%22%2F%3E%3Ccircle%20cx%3D%2211%22%20cy%3D%2222%22%20r%3D%222.2%22%20fill%3D%22%238f6640%22%2F%3E%3Ccircle%20cx%3D%2248%22%20cy%3D%2256%22%20r%3D%221%22%20fill%3D%22%23a87b4f%22%2F%3E%3Ccircle%20cx%3D%2225%22%20cy%3D%2219%22%20r%3D%221.6%22%20fill%3D%22%23d8b48a%22%2F%3E%3Ccircle%20cx%3D%222%22%20cy%3D%2242%22%20r%3D%222.2%22%20fill%3D%22%238f6640%22%2F%3E%3Ccircle%20cx%3D%2239%22%20cy%3D%225%22%20r%3D%221%22%20fill%3D%22%23a87b4f%22%2F%3E%3Ccircle%20cx%3D%2216%22%20cy%3D%2228%22%20r%3D%221.6%22%20fill%3D%22%23d8b48a%22%2F%3E%3Ccircle%20cx%3D%2253%22%20cy%3D%2251%22%20r%3D%222.2%22%20fill%3D%22%238f6640%22%2F%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2225%22%20r%3D%221%22%20fill%3D%22%23a87b4f%22%2F%3E%3Ccircle%20cx%3D%227%22%20cy%3D%2248%22%20r%3D%221.6%22%20fill%3D%22%23d8b48a%22%2F%3E%3Ccircle%20cx%3D%2244%22%20cy%3D%2211%22%20r%3D%222.2%22%20fill%3D%22%238f6640%22%2F%3E%3Ccircle%20cx%3D%2221%22%20cy%3D%2234%22%20r%3D%221%22%20fill%3D%22%23a87b4f%22%2F%3E%3Ccircle%20cx%3D%2258%22%20cy%3D%2257%22%20r%3D%221.6%22%20fill%3D%22%23d8b48a%22%2F%3E%3Ccircle%20cx%3D%2235%22%20cy%3D%2220%22%20r%3D%222.2%22%20fill%3D%22%238f6640%22%2F%3E%3C%2Fpattern%3E%0A%3Cpattern%20id%3D%22g%22%20x%3D%221030%22%20y%3D%22446%22%20width%3D%2220%22%20height%3D%2220%22%20patternUnits%3D%22userSpaceOnUse%22%3E%3Crect%20width%3D%2220%22%20height%3D%2220%22%20fill%3D%22%23fbfdff%22%2F%3E%3Cpath%20d%3D%22M%2020%200%20L%200%200%200%2020%22%20fill%3D%22none%22%20stroke%3D%22%23bcd6ea%22%20stroke-width%3D%221%22%2F%3E%3C%2Fpattern%3E%0A%3C%2Fdefs%3E%0A%3Crect%20width%3D%221600%22%20height%3D%221000%22%20fill%3D%22%237a5434%22%2F%3E%0A%3Crect%20x%3D%2216%22%20y%3D%2216%22%20width%3D%221568%22%20height%3D%22968%22%20fill%3D%22url(%23c)%22%2F%3E%0A%3Crect%20x%3D%2216%22%20y%3D%2216%22%20width%3D%221568%22%20height%3D%22968%22%20fill%3D%22none%22%20stroke%3D%22%235a3b22%22%20stroke-width%3D%224%22%2F%3E%0A%3Crect%20x%3D%221036%22%20y%3D%22452%22%20width%3D%22534%22%20height%3D%22510%22%20fill%3D%22rgba(60%2C35%2C15%2C.3)%22%2F%3E%0A%3Crect%20x%3D%221030%22%20y%3D%22446%22%20width%3D%22534%22%20height%3D%22510%22%20fill%3D%22url(%23g)%22%2F%3E%0A%3Ccircle%20cx%3D%221297%22%20cy%3D%22460%22%20r%3D%228%22%20fill%3D%22%23d4352b%22%2F%3E%3Ccircle%20cx%3D%221295%22%20cy%3D%22458%22%20r%3D%222.5%22%20fill%3D%22%23ffffff%22%2F%3E%0A%3C%2Fsvg%3E",
    "place": {
      "agent-a1": [
        52,
        46,
        220,
        170
      ],
      "agent-a2": [
        292,
        46,
        220,
        170
      ],
      "agent-a3": [
        532,
        46,
        220,
        170
      ],
      "agent-a4": [
        772,
        46,
        220,
        170
      ],
      "agent-a5": [
        52,
        234,
        220,
        170
      ],
      "agent-a6": [
        292,
        234,
        220,
        170
      ],
      "agent-a7": [
        532,
        234,
        220,
        170
      ],
      "agent-a8": [
        772,
        234,
        220,
        170
      ],
      "agent-a9": [
        52,
        422,
        220,
        170
      ],
      "agent-a10": [
        292,
        422,
        220,
        170
      ],
      "agent-a11": [
        532,
        422,
        220,
        170
      ],
      "agent-a12": [
        772,
        422,
        220,
        170
      ],
      "queue": [
        44,
        618,
        560,
        340
      ],
      "tally": [
        632,
        618,
        360,
        340
      ],
      "banner": [
        1030,
        44,
        540,
        150
      ],
      "figures": [
        1030,
        214,
        540,
        140
      ],
      "legend": [
        1030,
        372,
        540,
        56
      ],
      "inbound": [
        1050,
        482,
        494,
        456
      ]
    }
  }
};

export const callcenterCork: SamplePack = {
  id: "callcenter-cork",
  title: {
    "ko": "콜센터의 오후 — 코르크판 메모",
    "en": "A call centre’s afternoon — notes on a corkboard"
  },
  field: {
    "ko": "고객 상담·콜센터",
    "en": "Customer service & call centres"
  },
  kind: {
    "ko": "상담원 상태·대기 콜·문의 유형·인입",
    "en": "Agents, waiting calls, kinds of call and calls in"
  },
  domain: "services",
  styles: [
    "craft"
  ],
  summary: {
    "ko": "콜센터의 오후를 코르크판에 — 나무 테 안 갈색 반점 코르크에 상담원마다 종이 메모 한 장. 메모의 상태는 종이 색과 함께 붙인 방식과 모서리 표시로: 통화 중이면 마스킹 테이프와 수화기, 받을 수 있으면 둥근 압정과 빈 원, 후처리 중이면 접힌 귀와 연필, 휴식이면 압정 하나에 기운 메모와 쉼표. 아래에는 기다리는 전화를 색인 카드에, 오늘 문의를 유형별 획으로, 오른쪽에 크라프트지 띠, 찢은 메모 위 수치, 범례, 모눈종이 위 시간별 인입. 콜센터는 지어낸 것이라 예시 데이터입니다.",
    "en": "A call centre’s afternoon pinned to a corkboard — cork speckled brown in a wooden frame, every agent a paper note. A note tells its state by how it is fixed and by the mark in its corner, as well as by its paper’s colour: masking tape and a handset while on a call, a round push pin and an open ring when ready, a folded corner and a pencil while writing up a call, a single tack, a tilt and a pause mark on a break. Below, the calls waiting on an index card and the day’s calls by kind as tally strokes; on the right a kraft paper banner, the figures on torn notes, the key and the calls coming in by the hour on graph paper. The centre is made up. Example data."
  },
  connectors: [
    {
      "key": "centre",
      "name": "예시 콜센터 API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 콜센터가 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
