// An indoor pool's evening laid in mosaic: the pool seen from above in small glass tiles of blue, a band of tiles around
// it, the grout showing between. Every lane is a strip of white tile with its number on a tile of its own, what the lane
// is for, and its swimmers counted in tiles — one filled tile a swimmer, an empty tile a free place. A lane's state is
// told by a sign laid at its end and by the rope along it, as well as by a colour: a ring and a blue-and-white rope for
// free swimming, a diamond and a yellow rope for a class, a triangle and a red rope when the lane is full, a cross and a
// hatched rope when it is closed. Below, the water's quality and the evening's classes; on the right the pool's name in a
// tiled band, the figures now, the key and the admissions by the hour. The pool is made up, so the values are example data.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/pool-mosaic.js';

const board: Board = {
  "board": {
    "theme": "light",
    "accent": "#1f73b7"
  },
  "elements": {
    "lane": {
      "template": "<article class=\"ln {{l.state}}\"><b>{{l.no}}</b><header><strong>{{l.use}}</strong><small>{{l.who}}</small></header><p style=\"--n: {{l.swimmers}}; --max: {{l.places}}\"><span></span></p><em>{{l.swimmers}} / {{l.places}}</em><i>{{l.word}}</i></article>",
      "style": ".ln{position:relative;height:100%;box-sizing:border-box;display:grid;grid-template-columns:52px 230px 1fr 76px 112px;align-items:center;gap:14px;padding:0 14px 6px 6px;background:linear-gradient(#c9d3da 1px,transparent 1px) 0 0/14px 14px,linear-gradient(90deg,#c9d3da 1px,transparent 1px) 0 0/14px 14px,#fbfcfd;font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#14283a;box-shadow:0 2px 0 rgba(0,0,0,.25)}\n.ln::after{content:\"\";position:absolute;left:0;right:0;bottom:0;height:6px;background:repeating-linear-gradient(90deg,#1f73b7 0 12px,#ffffff 12px 24px)}\nb{display:grid;place-items:center;width:46px;height:46px;background:#123f6b;color:#ffffff;font:800 24px \"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;box-shadow:inset 0 0 0 2px #5cc3d6}\nheader{display:grid}\nstrong{font-size:18px;font-weight:800}\nsmall{font-size:13px}\np{margin:0;height:18px;width:calc(var(--max) * 20px);background:repeating-linear-gradient(90deg,#ffffff 0 16px,transparent 16px 20px);box-shadow:inset 0 0 0 1px #c9d3da;position:relative}\np::before{content:\"\";position:absolute;inset:0;width:calc(var(--max) * 20px - 4px);background:repeating-linear-gradient(90deg,transparent 0 16px,#c9d3da 16px 20px)}\nspan{position:absolute;left:0;top:0;bottom:0;width:calc(var(--n) * 20px);background:repeating-linear-gradient(90deg,#1f73b7 0 16px,transparent 16px 20px)}\nem{font-style:normal;font-size:17px;font-weight:800;text-align:right}\ni{font-style:normal;font-size:15px;font-weight:800;text-align:center;padding:4px 0;border:2px solid #14283a;background:#ffffff}\n.open i::before{content:\"○ \"}\n.class i{background:#f2b632}\n.class i::before{content:\"◆ \"}\n.class::after{background:repeating-linear-gradient(90deg,#f2b632 0 12px,#ffffff 12px 24px)}\n.class span{background:repeating-linear-gradient(90deg,#c98a00 0 16px,transparent 16px 20px)}\n.full i{background:#d13b30;color:#ffffff;border-color:#d13b30}\n.full i::before{content:\"▲ \"}\n.full::after{background:repeating-linear-gradient(90deg,#d13b30 0 12px,#ffffff 12px 24px)}\n.full span{background:repeating-linear-gradient(90deg,#d13b30 0 16px,transparent 16px 20px)}\n.closed{background:repeating-linear-gradient(-45deg,#eef1f3 0 8px,#dfe5ea 8px 16px)}\n.closed i{background:#14283a;color:#ffffff}\n.closed i::before{content:\"✕ \"}\n.closed::after{background:repeating-linear-gradient(-45deg,#14283a 0 4px,#ffffff 4px 8px)}\n.closed b{background:#7b8a96}",
      "props": {
        "l": "object"
      }
    },
    "water": {
      "template": "<section class=\"wq\"><h2>수질 — 19:00 측정</h2><dl>{{#items}}<div class=\"{{state}}\"><dt>{{label}}</dt><dd>{{value}}</dd><small>{{range}}</small></div>{{/items}}</dl></section>",
      "style": ".wq{height:100%;box-sizing:border-box;background:linear-gradient(#c9d3da 1px,transparent 1px) 0 0/14px 14px,linear-gradient(90deg,#c9d3da 1px,transparent 1px) 0 0/14px 14px,#fbfcfd;border:6px solid #1f73b7;border-image:repeating-linear-gradient(90deg,#1f73b7 0 10px,#5cc3d6 10px 12px,#123f6b 12px 22px,#5cc3d6 22px 24px) 6;color:#14283a;padding:14px 18px;font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif}\nh2{margin:0 0 10px;font-size:19px;font-weight:800}\ndl{margin:0;display:grid;grid-template-columns:repeat(2,1fr);gap:10px}\ndiv{display:grid;grid-template-columns:1fr auto;grid-template-rows:auto auto;align-items:baseline;padding:8px 12px;background:#ffffff;border:2px solid #14283a}\ndt{font-size:14px;font-weight:700}\ndd{margin:0;grid-row:span 2;font-size:26px;font-weight:800;text-align:right}\nsmall{font-size:12px}\n.ok dt::before{content:\"○ \";color:#1f73b7}\n.watch{background:repeating-linear-gradient(-45deg,#ffffff 0 7px,#fdf0cf 7px 14px);border-color:#b07a00}\n.watch dt::before{content:\"▲ \";color:#b07a00}",
      "props": {
        "items": "list"
      }
    },
    "classes": {
      "template": "<section class=\"cl\"><h2>저녁 강습</h2><ol>{{#items}}<li class=\"{{state}}\"><b>{{time}}</b><span>{{name}}</span><small>{{lane}}</small><i>{{word}}</i></li>{{/items}}</ol></section>",
      "style": ".cl{height:100%;box-sizing:border-box;background:linear-gradient(#c9d3da 1px,transparent 1px) 0 0/14px 14px,linear-gradient(90deg,#c9d3da 1px,transparent 1px) 0 0/14px 14px,#fbfcfd;border:6px solid #1f73b7;border-image:repeating-linear-gradient(90deg,#1f73b7 0 10px,#5cc3d6 10px 12px,#123f6b 12px 22px,#5cc3d6 22px 24px) 6;color:#14283a;padding:14px 18px;font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif}\nh2{margin:0 0 8px;font-size:19px;font-weight:800}\nol{margin:0;padding:0;list-style:none;display:grid;gap:4px}\nli{display:grid;grid-template-columns:54px 1fr 62px 76px;align-items:center;gap:8px;padding:4px 10px;background:#ffffff;border:2px solid #c9d3da;font-size:15px}\nb{font-weight:800}\nsmall{font-size:13px}\ni{font-style:normal;font-weight:800;font-size:13px;text-align:right}\n.done{opacity:.6}\n.done i::before{content:\"✓ \"}\n.now{border-color:#f2b632;background:#fff7df}\n.now i::before{content:\"◆ \"}\n.next i::before{content:\"○ \"}",
      "props": {
        "items": "list"
      }
    },
    "title": {
      "template": "<header class=\"tt\"><small>{{t.series}}</small><h1>{{t.name}}</h1><div><span>{{t.date}}</span><b>{{t.time}}</b></div></header>",
      "style": ".tt{height:100%;box-sizing:border-box;display:grid;align-content:center;gap:4px;padding:14px 22px;background:linear-gradient(rgba(18,63,107,.18) 1px,transparent 1px) 0 0/16px 16px,linear-gradient(90deg,rgba(18,63,107,.18) 1px,transparent 1px) 0 0/16px 16px,#123f6b;border:6px solid #5cc3d6;color:#ffffff;font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif}\nsmall{font-size:14px;letter-spacing:.2em;color:#5cc3d6;font-weight:700}\nh1{margin:0;font-size:46px;font-weight:900;letter-spacing:.06em}\ndiv{display:flex;justify-content:space-between;align-items:baseline}\nspan{font-size:16px}\nb{font-size:30px;font-weight:800;background:#fbfcfd;color:#123f6b;padding:0 10px}",
      "props": {
        "t": "object"
      }
    },
    "figures": {
      "template": "<dl class=\"fg\">{{#items}}<div><dt>{{label}}</dt><dd>{{value}}</dd><small>{{note}}</small></div>{{/items}}</dl>",
      "style": ".fg{margin:0;height:100%;box-sizing:border-box;display:grid;grid-template-columns:repeat(3,1fr);gap:12px;font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif}\ndiv{box-sizing:border-box;background:linear-gradient(#c9d3da 1px,transparent 1px) 0 0/14px 14px,linear-gradient(90deg,#c9d3da 1px,transparent 1px) 0 0/14px 14px,#fbfcfd;border:6px solid #1f73b7;border-image:repeating-linear-gradient(90deg,#1f73b7 0 10px,#5cc3d6 10px 12px,#123f6b 12px 22px,#5cc3d6 22px 24px) 6;color:#14283a;display:grid;align-content:center;justify-items:center;text-align:center}\ndt{font-size:14px;font-weight:700}\ndd{margin:0;font-size:32px;font-weight:900;color:#123f6b}\nsmall{font-size:12px}",
      "props": {
        "items": "list"
      }
    },
    "legend": {
      "template": "<ul class=\"ky\"><li><s class=\"open\"></s>○ 자유</li><li><s class=\"class\"></s>◆ 강습</li><li><s class=\"full\"></s>▲ 만원</li><li><s class=\"closed\"></s>✕ 닫힘</li></ul>",
      "style": ".ky{height:100%;box-sizing:border-box;margin:0;padding:0 16px;list-style:none;display:flex;align-items:center;justify-content:space-between;background:#ffffff;border:2px solid #14283a;font:800 14px \"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#14283a}\nli{display:flex;align-items:center;gap:8px}\ns{width:40px;height:6px;text-decoration:none;display:block}\n.open{background:repeating-linear-gradient(90deg,#1f73b7 0 8px,#d9e6f0 8px 16px)}\n.class{background:repeating-linear-gradient(90deg,#f2b632 0 8px,#f5ead0 8px 16px)}\n.full{background:repeating-linear-gradient(90deg,#d13b30 0 8px,#f6d9d6 8px 16px)}\n.closed{background:repeating-linear-gradient(-45deg,#14283a 0 3px,#ffffff 3px 6px)}"
    }
  },
  "data": {
    "lanes": {
      "from": "pool",
      "path": "/pool/lanes",
      "time": "updatedAt",
      "fresh": 600,
      "fields": {
        "l1": {
          "at": "/value/l1"
        },
        "l2": {
          "at": "/value/l2"
        },
        "l3": {
          "at": "/value/l3"
        },
        "l4": {
          "at": "/value/l4"
        },
        "l5": {
          "at": "/value/l5"
        },
        "l6": {
          "at": "/value/l6"
        },
        "l7": {
          "at": "/value/l7"
        },
        "l8": {
          "at": "/value/l8"
        }
      }
    },
    "water": {
      "from": "pool",
      "path": "/pool/water",
      "time": "updatedAt",
      "fresh": 600,
      "fields": {
        "value": {}
      }
    },
    "classes": {
      "from": "pool",
      "path": "/pool/classes",
      "time": "updatedAt",
      "fresh": 600,
      "fields": {
        "value": {}
      }
    },
    "now": {
      "from": "pool",
      "path": "/pool/now",
      "time": "updatedAt",
      "fresh": 600,
      "fields": {
        "value": {}
      }
    },
    "figures": {
      "from": "pool",
      "path": "/pool/figures",
      "time": "updatedAt",
      "fresh": 600,
      "fields": {
        "value": {}
      }
    },
    "admissions": {
      "from": "pool",
      "path": "/pool/admissions",
      "list": "/value",
      "fresh": 600,
      "answerTime": "/updatedAt"
    }
  },
  "parts": {
    "lane-l1": {
      "as": "element",
      "element": "lane",
      "of": "lanes",
      "bind": {
        "l": "l1"
      }
    },
    "lane-l2": {
      "as": "element",
      "element": "lane",
      "of": "lanes",
      "bind": {
        "l": "l2"
      }
    },
    "lane-l3": {
      "as": "element",
      "element": "lane",
      "of": "lanes",
      "bind": {
        "l": "l3"
      }
    },
    "lane-l4": {
      "as": "element",
      "element": "lane",
      "of": "lanes",
      "bind": {
        "l": "l4"
      }
    },
    "lane-l5": {
      "as": "element",
      "element": "lane",
      "of": "lanes",
      "bind": {
        "l": "l5"
      }
    },
    "lane-l6": {
      "as": "element",
      "element": "lane",
      "of": "lanes",
      "bind": {
        "l": "l6"
      }
    },
    "lane-l7": {
      "as": "element",
      "element": "lane",
      "of": "lanes",
      "bind": {
        "l": "l7"
      }
    },
    "lane-l8": {
      "as": "element",
      "element": "lane",
      "of": "lanes",
      "bind": {
        "l": "l8"
      }
    },
    "water": {
      "as": "element",
      "element": "water",
      "of": "water",
      "bind": {
        "items": "value"
      }
    },
    "classes": {
      "as": "element",
      "element": "classes",
      "of": "classes",
      "bind": {
        "items": "value"
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
    "admissions": {
      "as": "chart.bar",
      "of": "admissions",
      "title": "시간별 입장(명) — 19시는 10분까지",
      "x": "hour",
      "y": "admissions",
      "series": [
        {
          "label": "입장",
          "color": "#1f73b7"
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
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221600%22%20height%3D%221000%22%20viewBox%3D%220%200%201600%201000%22%3E%0A%3Crect%20width%3D%221600%22%20height%3D%221000%22%20fill%3D%22%23c9d3da%22%2F%3E%0A%3Cdefs%3E%3Cpattern%20id%3D%22t%22%20width%3D%2215%22%20height%3D%2215%22%20patternUnits%3D%22userSpaceOnUse%22%3E%3Crect%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%23f1f4f6%22%2F%3E%3C%2Fpattern%3E%3C%2Fdefs%3E%0A%3Cpattern%20id%3D%22g%22%20x%3D%2236%22%20y%3D%2230%22%20width%3D%22105%22%20height%3D%22105%22%20patternUnits%3D%22userSpaceOnUse%22%3E%3Crect%20x%3D%220%22%20y%3D%220%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%232a86c4%22%2F%3E%3Crect%20x%3D%2215%22%20y%3D%220%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%233597d1%22%2F%3E%3Crect%20x%3D%2230%22%20y%3D%220%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%232f8fcc%22%2F%3E%3Crect%20x%3D%2245%22%20y%3D%220%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%232c82bd%22%2F%3E%3Crect%20x%3D%2260%22%20y%3D%220%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%232479b5%22%2F%3E%3Crect%20x%3D%2275%22%20y%3D%220%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%232a86c4%22%2F%3E%3Crect%20x%3D%2290%22%20y%3D%220%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%233597d1%22%2F%3E%3Crect%20x%3D%220%22%20y%3D%2215%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%232479b5%22%2F%3E%3Crect%20x%3D%2215%22%20y%3D%2215%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%232f8fcc%22%2F%3E%3Crect%20x%3D%2230%22%20y%3D%2215%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%232a86c4%22%2F%3E%3Crect%20x%3D%2245%22%20y%3D%2215%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%232f8fcc%22%2F%3E%3Crect%20x%3D%2260%22%20y%3D%2215%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%232a86c4%22%2F%3E%3Crect%20x%3D%2275%22%20y%3D%2215%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%232c82bd%22%2F%3E%3Crect%20x%3D%2290%22%20y%3D%2215%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%232a86c4%22%2F%3E%3Crect%20x%3D%220%22%20y%3D%2230%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%232c82bd%22%2F%3E%3Crect%20x%3D%2215%22%20y%3D%2230%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%232c82bd%22%2F%3E%3Crect%20x%3D%2230%22%20y%3D%2230%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%232f8fcc%22%2F%3E%3Crect%20x%3D%2245%22%20y%3D%2230%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%233597d1%22%2F%3E%3Crect%20x%3D%2260%22%20y%3D%2230%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%233597d1%22%2F%3E%3Crect%20x%3D%2275%22%20y%3D%2230%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%232a86c4%22%2F%3E%3Crect%20x%3D%2290%22%20y%3D%2230%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%232479b5%22%2F%3E%3Crect%20x%3D%220%22%20y%3D%2245%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%232f8fcc%22%2F%3E%3Crect%20x%3D%2215%22%20y%3D%2245%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%232c82bd%22%2F%3E%3Crect%20x%3D%2230%22%20y%3D%2245%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%232479b5%22%2F%3E%3Crect%20x%3D%2245%22%20y%3D%2245%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%232a86c4%22%2F%3E%3Crect%20x%3D%2260%22%20y%3D%2245%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%233597d1%22%2F%3E%3Crect%20x%3D%2275%22%20y%3D%2245%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%232f8fcc%22%2F%3E%3Crect%20x%3D%2290%22%20y%3D%2245%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%232c82bd%22%2F%3E%3Crect%20x%3D%220%22%20y%3D%2260%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%233597d1%22%2F%3E%3Crect%20x%3D%2215%22%20y%3D%2260%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%232479b5%22%2F%3E%3Crect%20x%3D%2230%22%20y%3D%2260%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%232f8fcc%22%2F%3E%3Crect%20x%3D%2245%22%20y%3D%2260%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%232479b5%22%2F%3E%3Crect%20x%3D%2260%22%20y%3D%2260%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%232f8fcc%22%2F%3E%3Crect%20x%3D%2275%22%20y%3D%2260%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%232a86c4%22%2F%3E%3Crect%20x%3D%2290%22%20y%3D%2260%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%232f8fcc%22%2F%3E%3Crect%20x%3D%220%22%20y%3D%2275%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%232a86c4%22%2F%3E%3Crect%20x%3D%2215%22%20y%3D%2275%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%232a86c4%22%2F%3E%3Crect%20x%3D%2230%22%20y%3D%2275%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%232479b5%22%2F%3E%3Crect%20x%3D%2245%22%20y%3D%2275%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%232c82bd%22%2F%3E%3Crect%20x%3D%2260%22%20y%3D%2275%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%232c82bd%22%2F%3E%3Crect%20x%3D%2275%22%20y%3D%2275%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%232f8fcc%22%2F%3E%3Crect%20x%3D%2290%22%20y%3D%2275%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%233597d1%22%2F%3E%3Crect%20x%3D%220%22%20y%3D%2290%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%232479b5%22%2F%3E%3Crect%20x%3D%2215%22%20y%3D%2290%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%232a86c4%22%2F%3E%3Crect%20x%3D%2230%22%20y%3D%2290%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%233597d1%22%2F%3E%3Crect%20x%3D%2245%22%20y%3D%2290%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%232f8fcc%22%2F%3E%3Crect%20x%3D%2260%22%20y%3D%2290%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%232c82bd%22%2F%3E%3Crect%20x%3D%2275%22%20y%3D%2290%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%232479b5%22%2F%3E%3Crect%20x%3D%2290%22%20y%3D%2290%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%232a86c4%22%2F%3E%3C%2Fpattern%3E%0A%3Crect%20width%3D%221600%22%20height%3D%221000%22%20fill%3D%22url(%23t)%22%2F%3E%0A%3Crect%20x%3D%222%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%23123f6b%22%2F%3E%3Crect%20x%3D%2217%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%235cc3d6%22%2F%3E%3Crect%20x%3D%2232%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%231f73b7%22%2F%3E%3Crect%20x%3D%2247%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%23123f6b%22%2F%3E%3Crect%20x%3D%2262%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%235cc3d6%22%2F%3E%3Crect%20x%3D%2277%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%231f73b7%22%2F%3E%3Crect%20x%3D%2292%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%23123f6b%22%2F%3E%3Crect%20x%3D%22107%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%235cc3d6%22%2F%3E%3Crect%20x%3D%22122%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%231f73b7%22%2F%3E%3Crect%20x%3D%22137%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%23123f6b%22%2F%3E%3Crect%20x%3D%22152%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%235cc3d6%22%2F%3E%3Crect%20x%3D%22167%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%231f73b7%22%2F%3E%3Crect%20x%3D%22182%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%23123f6b%22%2F%3E%3Crect%20x%3D%22197%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%235cc3d6%22%2F%3E%3Crect%20x%3D%22212%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%231f73b7%22%2F%3E%3Crect%20x%3D%22227%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%23123f6b%22%2F%3E%3Crect%20x%3D%22242%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%235cc3d6%22%2F%3E%3Crect%20x%3D%22257%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%231f73b7%22%2F%3E%3Crect%20x%3D%22272%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%23123f6b%22%2F%3E%3Crect%20x%3D%22287%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%235cc3d6%22%2F%3E%3Crect%20x%3D%22302%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%231f73b7%22%2F%3E%3Crect%20x%3D%22317%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%23123f6b%22%2F%3E%3Crect%20x%3D%22332%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%235cc3d6%22%2F%3E%3Crect%20x%3D%22347%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%231f73b7%22%2F%3E%3Crect%20x%3D%22362%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%23123f6b%22%2F%3E%3Crect%20x%3D%22377%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%235cc3d6%22%2F%3E%3Crect%20x%3D%22392%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%231f73b7%22%2F%3E%3Crect%20x%3D%22407%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%23123f6b%22%2F%3E%3Crect%20x%3D%22422%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%235cc3d6%22%2F%3E%3Crect%20x%3D%22437%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%231f73b7%22%2F%3E%3Crect%20x%3D%22452%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%23123f6b%22%2F%3E%3Crect%20x%3D%22467%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%235cc3d6%22%2F%3E%3Crect%20x%3D%22482%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%231f73b7%22%2F%3E%3Crect%20x%3D%22497%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%23123f6b%22%2F%3E%3Crect%20x%3D%22512%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%235cc3d6%22%2F%3E%3Crect%20x%3D%22527%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%231f73b7%22%2F%3E%3Crect%20x%3D%22542%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%23123f6b%22%2F%3E%3Crect%20x%3D%22557%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%235cc3d6%22%2F%3E%3Crect%20x%3D%22572%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%231f73b7%22%2F%3E%3Crect%20x%3D%22587%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%23123f6b%22%2F%3E%3Crect%20x%3D%22602%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%235cc3d6%22%2F%3E%3Crect%20x%3D%22617%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%231f73b7%22%2F%3E%3Crect%20x%3D%22632%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%23123f6b%22%2F%3E%3Crect%20x%3D%22647%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%235cc3d6%22%2F%3E%3Crect%20x%3D%22662%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%231f73b7%22%2F%3E%3Crect%20x%3D%22677%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%23123f6b%22%2F%3E%3Crect%20x%3D%22692%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%235cc3d6%22%2F%3E%3Crect%20x%3D%22707%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%231f73b7%22%2F%3E%3Crect%20x%3D%22722%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%23123f6b%22%2F%3E%3Crect%20x%3D%22737%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%235cc3d6%22%2F%3E%3Crect%20x%3D%22752%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%231f73b7%22%2F%3E%3Crect%20x%3D%22767%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%23123f6b%22%2F%3E%3Crect%20x%3D%22782%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%235cc3d6%22%2F%3E%3Crect%20x%3D%22797%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%231f73b7%22%2F%3E%3Crect%20x%3D%22812%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%23123f6b%22%2F%3E%3Crect%20x%3D%22827%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%235cc3d6%22%2F%3E%3Crect%20x%3D%22842%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%231f73b7%22%2F%3E%3Crect%20x%3D%22857%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%23123f6b%22%2F%3E%3Crect%20x%3D%22872%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%235cc3d6%22%2F%3E%3Crect%20x%3D%22887%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%231f73b7%22%2F%3E%3Crect%20x%3D%22902%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%23123f6b%22%2F%3E%3Crect%20x%3D%22917%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%235cc3d6%22%2F%3E%3Crect%20x%3D%22932%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%231f73b7%22%2F%3E%3Crect%20x%3D%22947%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%23123f6b%22%2F%3E%3Crect%20x%3D%22962%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%235cc3d6%22%2F%3E%3Crect%20x%3D%22977%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%231f73b7%22%2F%3E%3Crect%20x%3D%22992%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%23123f6b%22%2F%3E%3Crect%20x%3D%221007%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%235cc3d6%22%2F%3E%3Crect%20x%3D%221022%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%231f73b7%22%2F%3E%3Crect%20x%3D%221037%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%23123f6b%22%2F%3E%3Crect%20x%3D%221052%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%235cc3d6%22%2F%3E%3Crect%20x%3D%221067%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%231f73b7%22%2F%3E%3Crect%20x%3D%221082%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%23123f6b%22%2F%3E%3Crect%20x%3D%221097%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%235cc3d6%22%2F%3E%3Crect%20x%3D%221112%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%231f73b7%22%2F%3E%3Crect%20x%3D%221127%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%23123f6b%22%2F%3E%3Crect%20x%3D%221142%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%235cc3d6%22%2F%3E%3Crect%20x%3D%221157%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%231f73b7%22%2F%3E%3Crect%20x%3D%221172%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%23123f6b%22%2F%3E%3Crect%20x%3D%221187%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%235cc3d6%22%2F%3E%3Crect%20x%3D%221202%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%231f73b7%22%2F%3E%3Crect%20x%3D%221217%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%23123f6b%22%2F%3E%3Crect%20x%3D%221232%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%235cc3d6%22%2F%3E%3Crect%20x%3D%221247%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%231f73b7%22%2F%3E%3Crect%20x%3D%221262%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%23123f6b%22%2F%3E%3Crect%20x%3D%221277%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%235cc3d6%22%2F%3E%3Crect%20x%3D%221292%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%231f73b7%22%2F%3E%3Crect%20x%3D%221307%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%23123f6b%22%2F%3E%3Crect%20x%3D%221322%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%235cc3d6%22%2F%3E%3Crect%20x%3D%221337%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%231f73b7%22%2F%3E%3Crect%20x%3D%221352%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%23123f6b%22%2F%3E%3Crect%20x%3D%221367%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%235cc3d6%22%2F%3E%3Crect%20x%3D%221382%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%231f73b7%22%2F%3E%3Crect%20x%3D%221397%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%23123f6b%22%2F%3E%3Crect%20x%3D%221412%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%235cc3d6%22%2F%3E%3Crect%20x%3D%221427%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%231f73b7%22%2F%3E%3Crect%20x%3D%221442%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%23123f6b%22%2F%3E%3Crect%20x%3D%221457%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%235cc3d6%22%2F%3E%3Crect%20x%3D%221472%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%231f73b7%22%2F%3E%3Crect%20x%3D%221487%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%23123f6b%22%2F%3E%3Crect%20x%3D%221502%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%235cc3d6%22%2F%3E%3Crect%20x%3D%221517%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%231f73b7%22%2F%3E%3Crect%20x%3D%221532%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%23123f6b%22%2F%3E%3Crect%20x%3D%221547%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%235cc3d6%22%2F%3E%3Crect%20x%3D%221562%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%231f73b7%22%2F%3E%3Crect%20x%3D%221577%22%20y%3D%226%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%23123f6b%22%2F%3E%3Crect%20x%3D%222%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%23123f6b%22%2F%3E%3Crect%20x%3D%2217%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%235cc3d6%22%2F%3E%3Crect%20x%3D%2232%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%231f73b7%22%2F%3E%3Crect%20x%3D%2247%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%23123f6b%22%2F%3E%3Crect%20x%3D%2262%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%235cc3d6%22%2F%3E%3Crect%20x%3D%2277%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%231f73b7%22%2F%3E%3Crect%20x%3D%2292%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%23123f6b%22%2F%3E%3Crect%20x%3D%22107%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%235cc3d6%22%2F%3E%3Crect%20x%3D%22122%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%231f73b7%22%2F%3E%3Crect%20x%3D%22137%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%23123f6b%22%2F%3E%3Crect%20x%3D%22152%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%235cc3d6%22%2F%3E%3Crect%20x%3D%22167%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%231f73b7%22%2F%3E%3Crect%20x%3D%22182%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%23123f6b%22%2F%3E%3Crect%20x%3D%22197%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%235cc3d6%22%2F%3E%3Crect%20x%3D%22212%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%231f73b7%22%2F%3E%3Crect%20x%3D%22227%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%23123f6b%22%2F%3E%3Crect%20x%3D%22242%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%235cc3d6%22%2F%3E%3Crect%20x%3D%22257%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%231f73b7%22%2F%3E%3Crect%20x%3D%22272%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%23123f6b%22%2F%3E%3Crect%20x%3D%22287%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%235cc3d6%22%2F%3E%3Crect%20x%3D%22302%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%231f73b7%22%2F%3E%3Crect%20x%3D%22317%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%23123f6b%22%2F%3E%3Crect%20x%3D%22332%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%235cc3d6%22%2F%3E%3Crect%20x%3D%22347%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%231f73b7%22%2F%3E%3Crect%20x%3D%22362%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%23123f6b%22%2F%3E%3Crect%20x%3D%22377%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%235cc3d6%22%2F%3E%3Crect%20x%3D%22392%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%231f73b7%22%2F%3E%3Crect%20x%3D%22407%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%23123f6b%22%2F%3E%3Crect%20x%3D%22422%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%235cc3d6%22%2F%3E%3Crect%20x%3D%22437%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%231f73b7%22%2F%3E%3Crect%20x%3D%22452%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%23123f6b%22%2F%3E%3Crect%20x%3D%22467%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%235cc3d6%22%2F%3E%3Crect%20x%3D%22482%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%231f73b7%22%2F%3E%3Crect%20x%3D%22497%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%23123f6b%22%2F%3E%3Crect%20x%3D%22512%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%235cc3d6%22%2F%3E%3Crect%20x%3D%22527%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%231f73b7%22%2F%3E%3Crect%20x%3D%22542%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%23123f6b%22%2F%3E%3Crect%20x%3D%22557%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%235cc3d6%22%2F%3E%3Crect%20x%3D%22572%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%231f73b7%22%2F%3E%3Crect%20x%3D%22587%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%23123f6b%22%2F%3E%3Crect%20x%3D%22602%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%235cc3d6%22%2F%3E%3Crect%20x%3D%22617%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%231f73b7%22%2F%3E%3Crect%20x%3D%22632%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%23123f6b%22%2F%3E%3Crect%20x%3D%22647%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%235cc3d6%22%2F%3E%3Crect%20x%3D%22662%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%231f73b7%22%2F%3E%3Crect%20x%3D%22677%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%23123f6b%22%2F%3E%3Crect%20x%3D%22692%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%235cc3d6%22%2F%3E%3Crect%20x%3D%22707%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%231f73b7%22%2F%3E%3Crect%20x%3D%22722%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%23123f6b%22%2F%3E%3Crect%20x%3D%22737%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%235cc3d6%22%2F%3E%3Crect%20x%3D%22752%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%231f73b7%22%2F%3E%3Crect%20x%3D%22767%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%23123f6b%22%2F%3E%3Crect%20x%3D%22782%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%235cc3d6%22%2F%3E%3Crect%20x%3D%22797%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%231f73b7%22%2F%3E%3Crect%20x%3D%22812%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%23123f6b%22%2F%3E%3Crect%20x%3D%22827%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%235cc3d6%22%2F%3E%3Crect%20x%3D%22842%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%231f73b7%22%2F%3E%3Crect%20x%3D%22857%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%23123f6b%22%2F%3E%3Crect%20x%3D%22872%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%235cc3d6%22%2F%3E%3Crect%20x%3D%22887%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%231f73b7%22%2F%3E%3Crect%20x%3D%22902%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%23123f6b%22%2F%3E%3Crect%20x%3D%22917%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%235cc3d6%22%2F%3E%3Crect%20x%3D%22932%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%231f73b7%22%2F%3E%3Crect%20x%3D%22947%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%23123f6b%22%2F%3E%3Crect%20x%3D%22962%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%235cc3d6%22%2F%3E%3Crect%20x%3D%22977%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%231f73b7%22%2F%3E%3Crect%20x%3D%22992%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%23123f6b%22%2F%3E%3Crect%20x%3D%221007%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%235cc3d6%22%2F%3E%3Crect%20x%3D%221022%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%231f73b7%22%2F%3E%3Crect%20x%3D%221037%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%23123f6b%22%2F%3E%3Crect%20x%3D%221052%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%235cc3d6%22%2F%3E%3Crect%20x%3D%221067%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%231f73b7%22%2F%3E%3Crect%20x%3D%221082%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%23123f6b%22%2F%3E%3Crect%20x%3D%221097%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%235cc3d6%22%2F%3E%3Crect%20x%3D%221112%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%231f73b7%22%2F%3E%3Crect%20x%3D%221127%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%23123f6b%22%2F%3E%3Crect%20x%3D%221142%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%235cc3d6%22%2F%3E%3Crect%20x%3D%221157%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%231f73b7%22%2F%3E%3Crect%20x%3D%221172%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%23123f6b%22%2F%3E%3Crect%20x%3D%221187%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%235cc3d6%22%2F%3E%3Crect%20x%3D%221202%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%231f73b7%22%2F%3E%3Crect%20x%3D%221217%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%23123f6b%22%2F%3E%3Crect%20x%3D%221232%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%235cc3d6%22%2F%3E%3Crect%20x%3D%221247%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%231f73b7%22%2F%3E%3Crect%20x%3D%221262%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%23123f6b%22%2F%3E%3Crect%20x%3D%221277%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%235cc3d6%22%2F%3E%3Crect%20x%3D%221292%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%231f73b7%22%2F%3E%3Crect%20x%3D%221307%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%23123f6b%22%2F%3E%3Crect%20x%3D%221322%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%235cc3d6%22%2F%3E%3Crect%20x%3D%221337%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%231f73b7%22%2F%3E%3Crect%20x%3D%221352%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%23123f6b%22%2F%3E%3Crect%20x%3D%221367%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%235cc3d6%22%2F%3E%3Crect%20x%3D%221382%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%231f73b7%22%2F%3E%3Crect%20x%3D%221397%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%23123f6b%22%2F%3E%3Crect%20x%3D%221412%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%235cc3d6%22%2F%3E%3Crect%20x%3D%221427%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%231f73b7%22%2F%3E%3Crect%20x%3D%221442%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%23123f6b%22%2F%3E%3Crect%20x%3D%221457%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%235cc3d6%22%2F%3E%3Crect%20x%3D%221472%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%231f73b7%22%2F%3E%3Crect%20x%3D%221487%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%23123f6b%22%2F%3E%3Crect%20x%3D%221502%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%235cc3d6%22%2F%3E%3Crect%20x%3D%221517%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%231f73b7%22%2F%3E%3Crect%20x%3D%221532%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%23123f6b%22%2F%3E%3Crect%20x%3D%221547%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%235cc3d6%22%2F%3E%3Crect%20x%3D%221562%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%231f73b7%22%2F%3E%3Crect%20x%3D%221577%22%20y%3D%22980%22%20width%3D%2214%22%20height%3D%2214%22%20fill%3D%22%23123f6b%22%2F%3E%0A%3Crect%20x%3D%2230%22%20y%3D%2224%22%20width%3D%221002%22%20height%3D%22612%22%20fill%3D%22%23123f6b%22%2F%3E%0A%3Crect%20x%3D%2236%22%20y%3D%2230%22%20width%3D%22990%22%20height%3D%22600%22%20fill%3D%22url(%23g)%22%2F%3E%0A%3Crect%20x%3D%221035%22%20y%3D%22481%22%20width%3D%22535%22%20height%3D%22485%22%20fill%3D%22%23c9d3da%22%2F%3E%0A%3Crect%20x%3D%221030%22%20y%3D%22476%22%20width%3D%22535%22%20height%3D%22485%22%20fill%3D%22%23fbfcfd%22%20stroke%3D%22%231f73b7%22%20stroke-width%3D%226%22%2F%3E%0A%3C%2Fsvg%3E",
    "place": {
      "lane-l1": [
        51,
        42,
        960,
        64
      ],
      "lane-l2": [
        51,
        115,
        960,
        64
      ],
      "lane-l3": [
        51,
        188,
        960,
        64
      ],
      "lane-l4": [
        51,
        261,
        960,
        64
      ],
      "lane-l5": [
        51,
        334,
        960,
        64
      ],
      "lane-l6": [
        51,
        407,
        960,
        64
      ],
      "lane-l7": [
        51,
        480,
        960,
        64
      ],
      "lane-l8": [
        51,
        553,
        960,
        64
      ],
      "water": [
        40,
        652,
        470,
        310
      ],
      "classes": [
        532,
        652,
        470,
        310
      ],
      "title": [
        1030,
        36,
        535,
        170
      ],
      "figures": [
        1030,
        224,
        535,
        130
      ],
      "legend": [
        1030,
        372,
        535,
        56
      ],
      "admissions": [
        1050,
        496,
        495,
        445
      ]
    }
  }
};

export const poolMosaic: SamplePack = {
  id: "pool-mosaic",
  title: {
    "ko": "실내 수영장의 저녁 — 모자이크 타일",
    "en": "An indoor pool’s evening — mosaic tiles"
  },
  field: {
    "ko": "체육시설·수영장",
    "en": "Sports facilities & pools"
  },
  kind: {
    "ko": "레인 사용·수질·강습·입장",
    "en": "Lanes, water quality, classes and admissions"
  },
  domain: "leisure",
  styles: [
    "craft"
  ],
  summary: {
    "ko": "실내 수영장의 저녁을 모자이크로 — 위에서 본 수조가 작은 파란 유리 타일로 깔리고, 둘레에 타일 띠, 사이사이 줄눈. 레인마다 흰 타일 한 줄: 번호를 새긴 타일, 레인의 쓰임, 그리고 타일로 센 사람 수 — 채운 타일 하나가 한 사람, 빈 타일이 남은 자리. 레인 상태는 색과 함께 끝에 놓은 표지와 레인 줄로: 자유 수영은 ○와 파랑·흰 줄, 강습은 ◆와 노란 줄, 만원은 ▲와 붉은 줄, 닫힘은 ✕와 빗금 줄. 아래에는 수질과 저녁 강습, 오른쪽에 타일 띠 속 수영장 이름, 지금 수치, 범례, 시간별 입장. 수영장은 지어낸 것이라 예시 데이터입니다.",
    "en": "An indoor pool’s evening laid in mosaic — the pool seen from above in small glass tiles of blue, a band of tiles round it, the grout between. Every lane is a strip of white tile: its number on a tile of its own, what the lane is for, and its swimmers counted in tiles — a filled tile a swimmer, an empty one a free place. A lane tells its state by a sign at its end and by its rope, as well as by colour: a ring and a blue-and-white rope for free swimming, a diamond and a yellow rope for a class, a triangle and a red rope when it is full, a cross and a hatched rope when it is closed. Below, the water’s quality and the evening’s classes; on the right the pool’s name in a tiled band, the figures now, the key and the admissions by the hour. The pool is made up. Example data."
  },
  connectors: [
    {
      "key": "pool",
      "name": "예시 수영장 API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 수영장이 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
