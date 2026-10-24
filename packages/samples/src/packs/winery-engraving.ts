// A winery's harvest-time cellar drawn as a copperplate engraving: sepia ink on cream, every shade laid in hatched and
// cross-hatched lines, a ruled border with corner flourishes, and serif lettering. Above, the fermentation hall — six
// tanks, each engraved with the wine inside at its level; below, the barrel cellar — eight barrels with their wine and
// their months in oak. A tank tells its state by a small engraved vignette as well as by the ink: rising bubbles while
// it ferments, an hourglass while it rests, a thermometer when it runs warm, a cross when it stands empty for cleaning.
// On the right the cartouche with the winery's name, the figures now, the key, the day's work and the temperatures of
// two fermenting tanks through the day. The winery is made up, so the values are example data.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/winery-engraving.js';

const board: Board = {
  "board": {
    "theme": "light",
    "accent": "#6e1f2c"
  },
  "elements": {
    "tank": {
      "template": "<article class=\"tk {{k.state}}\"><div class=\"vessel\" style=\"--v: {{k.level}}\"><span class=\"wine\"></span><i></i></div><h3>{{k.name}}</h3><small>{{k.grape}}</small><dl><dt>온도</dt><dd>{{k.temp}}</dd><dt>당도</dt><dd>{{k.brix}}</dd></dl><em>{{k.word}}</em></article>",
      "style": ".tk{height:100%;box-sizing:border-box;display:grid;grid-template-rows:1fr auto auto auto auto;justify-items:center;gap:3px;font-family:\"Nanum Myeongjo\", \"Noto Serif KR\", \"Batang\", serif;color:#3b2a1a;text-align:center}\n.vessel{position:relative;width:96px;height:100%;min-height:150px;box-sizing:border-box;border:2px solid #3b2a1a;border-radius:46px 46px 6px 6px / 26px 26px 6px 6px;background:repeating-linear-gradient(90deg,#cdbb98 0 1px,transparent 1px 6px),#f3ead6;overflow:hidden}\n.wine{position:absolute;left:0;right:0;bottom:0;height:calc(var(--v) * 1%);background:repeating-linear-gradient(45deg,#6e1f2c 0 1px,transparent 1px 5px),repeating-linear-gradient(-45deg,#6e1f2c 0 1px,transparent 1px 5px);border-top:2px solid #6e1f2c}\ni{position:absolute;left:50%;top:18px;transform:translateX(-50%);display:grid;place-items:center;width:34px;height:34px;border-radius:50%;background:#f3ead6;border:1.5px solid #3b2a1a;font:700 16px \"Nanum Myeongjo\", \"Noto Serif KR\", \"Batang\", serif;font-style:normal}\nh3{margin:4px 0 0;font-size:18px;font-weight:800}\nsmall{font-size:13px;font-style:italic;color:#7a6248}\ndl{margin:0;display:grid;grid-template-columns:auto auto;column-gap:8px;font-size:13px}\ndt{color:#7a6248}\ndd{margin:0;font-weight:800}\nem{font-size:13px;font-weight:800;font-style:normal;border-top:1px solid #3b2a1a;padding-top:2px}\n.fermenting i::before{content:\"∘°\"}\n.resting i::before{content:\"⧗\"}\n.warm i{background:#b5361f;color:#f3ead6;border-color:#b5361f}\n.warm i::before{content:\"▲\"}\n.warm em,.warm dd:first-of-type{color:#b5361f}\n.empty .vessel{background:#f3ead6}\n.empty i::before{content:\"✕\"}\n.empty em{color:#7a6248}",
      "props": {
        "k": "object"
      }
    },
    "barrel": {
      "template": "<article class=\"br {{b.state}}\"><div class=\"end\"><b>{{b.no}}</b></div><p>{{b.wine}}</p><small>{{b.months}}</small></article>",
      "style": ".br{height:100%;box-sizing:border-box;display:grid;grid-template-rows:1fr auto auto;justify-items:center;gap:2px;font-family:\"Nanum Myeongjo\", \"Noto Serif KR\", \"Batang\", serif;color:#3b2a1a;text-align:center}\n.end{position:relative;width:96px;height:96px;box-sizing:border-box;border-radius:50%;border:2px solid #3b2a1a;display:grid;place-items:center;background:radial-gradient(circle,transparent 0 30px,#3b2a1a 30px 31.5px,transparent 31.5px 38px,#3b2a1a 38px 39.5px,transparent 39.5px),repeating-linear-gradient(0deg,#b49b74 0 1px,transparent 1px 5px),#f3ead6}\nb{font-size:16px;font-weight:800;background:#f3ead6;padding:0 4px}\np{margin:2px 0 0;font-size:14px;font-weight:800}\nsmall{font-size:12px;font-style:italic;color:#7a6248}\n.topping .end{box-shadow:0 0 0 3px #f3ead6,0 0 0 5px #6e1f2c}\n.topping small{color:#6e1f2c;font-weight:800}\n.ready .end{background:radial-gradient(circle,transparent 0 30px,#3b2a1a 30px 31.5px,transparent 31.5px 38px,#3b2a1a 38px 39.5px,transparent 39.5px),repeating-linear-gradient(45deg,#6e1f2c 0 1px,transparent 1px 5px),repeating-linear-gradient(-45deg,#6e1f2c 0 1px,transparent 1px 5px),#f3ead6}",
      "props": {
        "b": "object"
      }
    },
    "title": {
      "template": "<header class=\"ct\"><small>{{t.series}}</small><h1>{{t.name}}</h1><div><span>{{t.date}}</span><b>{{t.time}}</b></div></header>",
      "style": ".ct{height:100%;box-sizing:border-box;display:grid;align-content:center;justify-items:center;gap:4px;padding:12px 28px;border:2px solid #3b2a1a;border-radius:60px/30px;background:#f3ead6;box-shadow:inset 0 0 0 5px #f3ead6,inset 0 0 0 6px #3b2a1a;font-family:\"Nanum Myeongjo\", \"Noto Serif KR\", \"Batang\", serif;color:#3b2a1a;text-align:center}\nsmall{font-size:13px;font-style:italic;letter-spacing:.2em}\nh1{margin:0;font-size:38px;font-weight:800;letter-spacing:.1em}\ndiv{display:flex;gap:18px;align-items:baseline}\nspan{font-size:15px}\nb{font-size:22px;color:#6e1f2c}",
      "props": {
        "t": "object"
      }
    },
    "figures": {
      "template": "<dl class=\"fg\">{{#items}}<div><dt>{{label}}</dt><dd>{{value}}</dd><small>{{note}}</small></div>{{/items}}</dl>",
      "style": ".fg{margin:0;height:100%;box-sizing:border-box;display:grid;grid-template-columns:repeat(3,1fr);gap:12px;font-family:\"Nanum Myeongjo\", \"Noto Serif KR\", \"Batang\", serif;color:#3b2a1a}\ndiv{display:grid;align-content:center;justify-items:center;text-align:center;background:#f3ead6;border-top:3px double #3b2a1a;border-bottom:3px double #3b2a1a}\ndt{font-size:13px;font-style:italic}\ndd{margin:0;font-size:30px;font-weight:800;color:#6e1f2c}\nsmall{font-size:12px}",
      "props": {
        "items": "list"
      }
    },
    "legend": {
      "template": "<ul class=\"ky\"><li><i>∘°</i>발효 중</li><li><i>⧗</i>안정</li><li><i class=\"warm\">▲</i>온도 높음</li><li><i>✕</i>비움·세척</li></ul>",
      "style": ".ky{height:100%;box-sizing:border-box;margin:0;padding:0 18px;list-style:none;display:flex;align-items:center;justify-content:space-between;background:#f3ead6;border:1px solid #3b2a1a;font:700 14px \"Nanum Myeongjo\", \"Noto Serif KR\", \"Batang\", serif;color:#3b2a1a}\nli{display:flex;align-items:center;gap:8px}\ni{display:grid;place-items:center;width:26px;height:26px;border-radius:50%;border:1.5px solid #3b2a1a;font:700 13px \"Nanum Myeongjo\", \"Noto Serif KR\", \"Batang\", serif;font-style:normal}\n.warm{background:#b5361f;color:#f3ead6;border-color:#b5361f}"
    },
    "work": {
      "template": "<section class=\"wk\"><h2>오늘의 셀러 일</h2><ol>{{#items}}<li class=\"{{state}}\"><b>{{time}}</b><span>{{what}}</span><small>{{where}}</small></li>{{/items}}</ol></section>",
      "style": ".wk{height:100%;box-sizing:border-box;padding:12px 20px;background:#f3ead6;border:1px solid #3b2a1a;font-family:\"Nanum Myeongjo\", \"Noto Serif KR\", \"Batang\", serif;color:#3b2a1a}\nh2{margin:0 0 8px;font-size:18px;font-weight:800;font-style:italic;border-bottom:1px solid #3b2a1a;padding-bottom:4px}\nol{margin:0;padding:0;list-style:none;display:grid;gap:5px}\nli{display:grid;grid-template-columns:58px 1fr 90px;align-items:baseline;gap:10px;font-size:14px}\nb{font-weight:800}\nsmall{text-align:right;font-style:italic;color:#7a6248}\n.done{color:#7a6248;text-decoration:line-through;text-decoration-thickness:1px}\n.now b::before{content:\"☞ \";color:#6e1f2c}\n.now span{font-weight:800;color:#6e1f2c}",
      "props": {
        "items": "list"
      }
    },
    "note": {
      "template": "<aside class=\"nt\"><dl><div><dt>셀러 온도</dt><dd>{{n.cellar}}</dd></div><div><dt>셀러 습도</dt><dd>{{n.humidity}}</dd></div><div><dt>올해 수확</dt><dd>{{n.harvest}}</dd></div><div><dt>다음 병입</dt><dd>{{n.bottling}}</dd></div></dl><p>{{n.text}}</p></aside>",
      "style": ".nt{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr;gap:8px;padding:12px 22px;background:#f3ead6;border:1px solid #3b2a1a;font-family:\"Nanum Myeongjo\", \"Noto Serif KR\", \"Batang\", serif;color:#3b2a1a}\ndl{margin:0;display:grid;grid-template-columns:repeat(4,1fr);gap:14px}\ndiv{border-left:2px solid #3b2a1a;padding-left:10px}\ndt{font-size:12px;font-style:italic;color:#7a6248}\ndd{margin:0;font-size:20px;font-weight:800}\np{margin:0;font-size:14px;font-style:italic;align-self:center}",
      "props": {
        "n": "object"
      }
    }
  },
  "data": {
    "tanks": {
      "from": "cellar",
      "path": "/cellar/tanks",
      "time": "updatedAt",
      "fresh": 1800,
      "fields": {
        "t1": {
          "at": "/value/t1"
        },
        "t2": {
          "at": "/value/t2"
        },
        "t3": {
          "at": "/value/t3"
        },
        "t4": {
          "at": "/value/t4"
        },
        "t5": {
          "at": "/value/t5"
        },
        "t6": {
          "at": "/value/t6"
        }
      }
    },
    "barrels": {
      "from": "cellar",
      "path": "/cellar/barrels",
      "time": "updatedAt",
      "fresh": 1800,
      "fields": {
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
        "b5": {
          "at": "/value/b5"
        },
        "b6": {
          "at": "/value/b6"
        },
        "b7": {
          "at": "/value/b7"
        },
        "b8": {
          "at": "/value/b8"
        }
      }
    },
    "now": {
      "from": "cellar",
      "path": "/cellar/now",
      "time": "updatedAt",
      "fresh": 1800,
      "fields": {
        "value": {}
      }
    },
    "figures": {
      "from": "cellar",
      "path": "/cellar/figures",
      "time": "updatedAt",
      "fresh": 1800,
      "fields": {
        "value": {}
      }
    },
    "work": {
      "from": "cellar",
      "path": "/cellar/work",
      "time": "updatedAt",
      "fresh": 1800,
      "fields": {
        "value": {}
      }
    },
    "temps": {
      "from": "cellar",
      "path": "/cellar/temps",
      "list": "/value",
      "fresh": 1800,
      "answerTime": "/updatedAt"
    },
    "note": {
      "from": "cellar",
      "path": "/cellar/note",
      "time": "updatedAt",
      "fresh": 1800,
      "fields": {
        "value": {}
      }
    }
  },
  "parts": {
    "tank-t1": {
      "as": "element",
      "element": "tank",
      "of": "tanks",
      "bind": {
        "k": "t1"
      }
    },
    "tank-t2": {
      "as": "element",
      "element": "tank",
      "of": "tanks",
      "bind": {
        "k": "t2"
      }
    },
    "tank-t3": {
      "as": "element",
      "element": "tank",
      "of": "tanks",
      "bind": {
        "k": "t3"
      }
    },
    "tank-t4": {
      "as": "element",
      "element": "tank",
      "of": "tanks",
      "bind": {
        "k": "t4"
      }
    },
    "tank-t5": {
      "as": "element",
      "element": "tank",
      "of": "tanks",
      "bind": {
        "k": "t5"
      }
    },
    "tank-t6": {
      "as": "element",
      "element": "tank",
      "of": "tanks",
      "bind": {
        "k": "t6"
      }
    },
    "barrel-b1": {
      "as": "element",
      "element": "barrel",
      "of": "barrels",
      "bind": {
        "b": "b1"
      }
    },
    "barrel-b2": {
      "as": "element",
      "element": "barrel",
      "of": "barrels",
      "bind": {
        "b": "b2"
      }
    },
    "barrel-b3": {
      "as": "element",
      "element": "barrel",
      "of": "barrels",
      "bind": {
        "b": "b3"
      }
    },
    "barrel-b4": {
      "as": "element",
      "element": "barrel",
      "of": "barrels",
      "bind": {
        "b": "b4"
      }
    },
    "barrel-b5": {
      "as": "element",
      "element": "barrel",
      "of": "barrels",
      "bind": {
        "b": "b5"
      }
    },
    "barrel-b6": {
      "as": "element",
      "element": "barrel",
      "of": "barrels",
      "bind": {
        "b": "b6"
      }
    },
    "barrel-b7": {
      "as": "element",
      "element": "barrel",
      "of": "barrels",
      "bind": {
        "b": "b7"
      }
    },
    "barrel-b8": {
      "as": "element",
      "element": "barrel",
      "of": "barrels",
      "bind": {
        "b": "b8"
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
    "work": {
      "as": "element",
      "element": "work",
      "of": "work",
      "bind": {
        "items": "value"
      }
    },
    "temps": {
      "as": "chart.line",
      "of": "temps",
      "title": "발효 온도 — 오늘 (°C)",
      "x": "hour",
      "y": [
        "t1",
        "t3"
      ],
      "valueAxisZero": false,
      "series": [
        {
          "label": "1번 탱크",
          "color": "#6e1f2c"
        },
        {
          "label": "3번 탱크",
          "color": "#b5361f"
        }
      ]
    },
    "cellar-note": {
      "as": "element",
      "element": "note",
      "of": "note",
      "bind": {
        "n": "value"
      }
    }
  },
  "layout": {
    "kind": "canvas",
    "size": [
      1600,
      1000
    ],
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221600%22%20height%3D%221000%22%20viewBox%3D%220%200%201600%201000%22%3E%0A%3Cdefs%3E%3CclipPath%20id%3D%22plate%22%3E%3Crect%20x%3D%2220%22%20y%3D%2220%22%20width%3D%221560%22%20height%3D%22960%22%2F%3E%3C%2FclipPath%3E%3C%2Fdefs%3E%0A%3Crect%20width%3D%221600%22%20height%3D%221000%22%20fill%3D%22%23f3ead6%22%2F%3E%0A%3Cg%20clip-path%3D%22url(%23plate)%22%20opacity%3D%22.7%22%3E%3Cpath%20d%3D%22M-1000%201000%20L%200%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-993%201000%20L%207%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-986%201000%20L%2014%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-979%201000%20L%2021%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-972%201000%20L%2028%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-965%201000%20L%2035%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-958%201000%20L%2042%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-951%201000%20L%2049%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-944%201000%20L%2056%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-937%201000%20L%2063%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-930%201000%20L%2070%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-923%201000%20L%2077%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-916%201000%20L%2084%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-909%201000%20L%2091%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-902%201000%20L%2098%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-895%201000%20L%20105%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-888%201000%20L%20112%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-881%201000%20L%20119%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-874%201000%20L%20126%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-867%201000%20L%20133%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-860%201000%20L%20140%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-853%201000%20L%20147%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-846%201000%20L%20154%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-839%201000%20L%20161%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-832%201000%20L%20168%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-825%201000%20L%20175%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-818%201000%20L%20182%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-811%201000%20L%20189%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-804%201000%20L%20196%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-797%201000%20L%20203%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-790%201000%20L%20210%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-783%201000%20L%20217%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-776%201000%20L%20224%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-769%201000%20L%20231%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-762%201000%20L%20238%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-755%201000%20L%20245%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-748%201000%20L%20252%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-741%201000%20L%20259%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-734%201000%20L%20266%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-727%201000%20L%20273%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-720%201000%20L%20280%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-713%201000%20L%20287%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-706%201000%20L%20294%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-699%201000%20L%20301%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-692%201000%20L%20308%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-685%201000%20L%20315%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-678%201000%20L%20322%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-671%201000%20L%20329%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-664%201000%20L%20336%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-657%201000%20L%20343%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-650%201000%20L%20350%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-643%201000%20L%20357%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-636%201000%20L%20364%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-629%201000%20L%20371%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-622%201000%20L%20378%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-615%201000%20L%20385%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-608%201000%20L%20392%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-601%201000%20L%20399%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-594%201000%20L%20406%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-587%201000%20L%20413%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-580%201000%20L%20420%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-573%201000%20L%20427%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-566%201000%20L%20434%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-559%201000%20L%20441%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-552%201000%20L%20448%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-545%201000%20L%20455%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-538%201000%20L%20462%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-531%201000%20L%20469%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-524%201000%20L%20476%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-517%201000%20L%20483%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-510%201000%20L%20490%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-503%201000%20L%20497%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-496%201000%20L%20504%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-489%201000%20L%20511%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-482%201000%20L%20518%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-475%201000%20L%20525%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-468%201000%20L%20532%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-461%201000%20L%20539%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-454%201000%20L%20546%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-447%201000%20L%20553%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-440%201000%20L%20560%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-433%201000%20L%20567%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-426%201000%20L%20574%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-419%201000%20L%20581%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-412%201000%20L%20588%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-405%201000%20L%20595%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-398%201000%20L%20602%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-391%201000%20L%20609%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-384%201000%20L%20616%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-377%201000%20L%20623%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-370%201000%20L%20630%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-363%201000%20L%20637%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-356%201000%20L%20644%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-349%201000%20L%20651%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-342%201000%20L%20658%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-335%201000%20L%20665%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-328%201000%20L%20672%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-321%201000%20L%20679%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-314%201000%20L%20686%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-307%201000%20L%20693%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-300%201000%20L%20700%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-293%201000%20L%20707%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-286%201000%20L%20714%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-279%201000%20L%20721%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-272%201000%20L%20728%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-265%201000%20L%20735%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-258%201000%20L%20742%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-251%201000%20L%20749%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-244%201000%20L%20756%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-237%201000%20L%20763%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-230%201000%20L%20770%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-223%201000%20L%20777%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-216%201000%20L%20784%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-209%201000%20L%20791%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-202%201000%20L%20798%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-195%201000%20L%20805%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-188%201000%20L%20812%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-181%201000%20L%20819%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-174%201000%20L%20826%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-167%201000%20L%20833%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-160%201000%20L%20840%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-153%201000%20L%20847%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-146%201000%20L%20854%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-139%201000%20L%20861%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-132%201000%20L%20868%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-125%201000%20L%20875%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-118%201000%20L%20882%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-111%201000%20L%20889%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-104%201000%20L%20896%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-97%201000%20L%20903%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-90%201000%20L%20910%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-83%201000%20L%20917%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-76%201000%20L%20924%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-69%201000%20L%20931%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-62%201000%20L%20938%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-55%201000%20L%20945%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-48%201000%20L%20952%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-41%201000%20L%20959%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-34%201000%20L%20966%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-27%201000%20L%20973%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-20%201000%20L%20980%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-13%201000%20L%20987%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M-6%201000%20L%20994%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1%201000%20L%201001%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M8%201000%20L%201008%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M15%201000%20L%201015%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M22%201000%20L%201022%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M29%201000%20L%201029%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M36%201000%20L%201036%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M43%201000%20L%201043%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M50%201000%20L%201050%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M57%201000%20L%201057%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M64%201000%20L%201064%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M71%201000%20L%201071%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M78%201000%20L%201078%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M85%201000%20L%201085%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M92%201000%20L%201092%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M99%201000%20L%201099%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M106%201000%20L%201106%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M113%201000%20L%201113%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M120%201000%20L%201120%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M127%201000%20L%201127%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M134%201000%20L%201134%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M141%201000%20L%201141%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M148%201000%20L%201148%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M155%201000%20L%201155%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M162%201000%20L%201162%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M169%201000%20L%201169%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M176%201000%20L%201176%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M183%201000%20L%201183%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M190%201000%20L%201190%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M197%201000%20L%201197%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M204%201000%20L%201204%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M211%201000%20L%201211%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M218%201000%20L%201218%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M225%201000%20L%201225%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M232%201000%20L%201232%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M239%201000%20L%201239%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M246%201000%20L%201246%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M253%201000%20L%201253%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M260%201000%20L%201260%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M267%201000%20L%201267%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M274%201000%20L%201274%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M281%201000%20L%201281%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M288%201000%20L%201288%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M295%201000%20L%201295%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M302%201000%20L%201302%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M309%201000%20L%201309%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M316%201000%20L%201316%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M323%201000%20L%201323%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M330%201000%20L%201330%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M337%201000%20L%201337%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M344%201000%20L%201344%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M351%201000%20L%201351%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M358%201000%20L%201358%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M365%201000%20L%201365%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M372%201000%20L%201372%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M379%201000%20L%201379%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M386%201000%20L%201386%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M393%201000%20L%201393%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M400%201000%20L%201400%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M407%201000%20L%201407%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M414%201000%20L%201414%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M421%201000%20L%201421%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M428%201000%20L%201428%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M435%201000%20L%201435%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M442%201000%20L%201442%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M449%201000%20L%201449%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M456%201000%20L%201456%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M463%201000%20L%201463%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M470%201000%20L%201470%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M477%201000%20L%201477%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M484%201000%20L%201484%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M491%201000%20L%201491%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M498%201000%20L%201498%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M505%201000%20L%201505%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M512%201000%20L%201512%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M519%201000%20L%201519%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M526%201000%20L%201526%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M533%201000%20L%201533%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M540%201000%20L%201540%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M547%201000%20L%201547%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M554%201000%20L%201554%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M561%201000%20L%201561%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M568%201000%20L%201568%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M575%201000%20L%201575%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M582%201000%20L%201582%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M589%201000%20L%201589%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M596%201000%20L%201596%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M603%201000%20L%201603%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M610%201000%20L%201610%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M617%201000%20L%201617%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M624%201000%20L%201624%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M631%201000%20L%201631%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M638%201000%20L%201638%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M645%201000%20L%201645%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M652%201000%20L%201652%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M659%201000%20L%201659%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M666%201000%20L%201666%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M673%201000%20L%201673%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M680%201000%20L%201680%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M687%201000%20L%201687%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M694%201000%20L%201694%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M701%201000%20L%201701%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M708%201000%20L%201708%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M715%201000%20L%201715%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M722%201000%20L%201722%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M729%201000%20L%201729%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M736%201000%20L%201736%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M743%201000%20L%201743%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M750%201000%20L%201750%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M757%201000%20L%201757%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M764%201000%20L%201764%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M771%201000%20L%201771%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M778%201000%20L%201778%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M785%201000%20L%201785%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M792%201000%20L%201792%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M799%201000%20L%201799%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M806%201000%20L%201806%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M813%201000%20L%201813%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M820%201000%20L%201820%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M827%201000%20L%201827%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M834%201000%20L%201834%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M841%201000%20L%201841%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M848%201000%20L%201848%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M855%201000%20L%201855%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M862%201000%20L%201862%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M869%201000%20L%201869%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M876%201000%20L%201876%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M883%201000%20L%201883%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M890%201000%20L%201890%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M897%201000%20L%201897%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M904%201000%20L%201904%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M911%201000%20L%201911%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M918%201000%20L%201918%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M925%201000%20L%201925%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M932%201000%20L%201932%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M939%201000%20L%201939%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M946%201000%20L%201946%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M953%201000%20L%201953%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M960%201000%20L%201960%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M967%201000%20L%201967%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M974%201000%20L%201974%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M981%201000%20L%201981%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M988%201000%20L%201988%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M995%201000%20L%201995%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1002%201000%20L%202002%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1009%201000%20L%202009%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1016%201000%20L%202016%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1023%201000%20L%202023%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1030%201000%20L%202030%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1037%201000%20L%202037%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1044%201000%20L%202044%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1051%201000%20L%202051%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1058%201000%20L%202058%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1065%201000%20L%202065%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1072%201000%20L%202072%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1079%201000%20L%202079%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1086%201000%20L%202086%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1093%201000%20L%202093%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1100%201000%20L%202100%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1107%201000%20L%202107%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1114%201000%20L%202114%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1121%201000%20L%202121%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1128%201000%20L%202128%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1135%201000%20L%202135%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1142%201000%20L%202142%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1149%201000%20L%202149%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1156%201000%20L%202156%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1163%201000%20L%202163%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1170%201000%20L%202170%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1177%201000%20L%202177%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1184%201000%20L%202184%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1191%201000%20L%202191%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1198%201000%20L%202198%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1205%201000%20L%202205%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1212%201000%20L%202212%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1219%201000%20L%202219%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1226%201000%20L%202226%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1233%201000%20L%202233%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1240%201000%20L%202240%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1247%201000%20L%202247%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1254%201000%20L%202254%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1261%201000%20L%202261%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1268%201000%20L%202268%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1275%201000%20L%202275%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1282%201000%20L%202282%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1289%201000%20L%202289%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1296%201000%20L%202296%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1303%201000%20L%202303%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1310%201000%20L%202310%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1317%201000%20L%202317%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1324%201000%20L%202324%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1331%201000%20L%202331%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1338%201000%20L%202338%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1345%201000%20L%202345%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1352%201000%20L%202352%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1359%201000%20L%202359%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1366%201000%20L%202366%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1373%201000%20L%202373%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1380%201000%20L%202380%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1387%201000%20L%202387%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1394%201000%20L%202394%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1401%201000%20L%202401%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1408%201000%20L%202408%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1415%201000%20L%202415%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1422%201000%20L%202422%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1429%201000%20L%202429%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1436%201000%20L%202436%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1443%201000%20L%202443%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1450%201000%20L%202450%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1457%201000%20L%202457%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1464%201000%20L%202464%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1471%201000%20L%202471%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1478%201000%20L%202478%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1485%201000%20L%202485%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1492%201000%20L%202492%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1499%201000%20L%202499%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1506%201000%20L%202506%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1513%201000%20L%202513%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1520%201000%20L%202520%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1527%201000%20L%202527%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1534%201000%20L%202534%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1541%201000%20L%202541%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1548%201000%20L%202548%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1555%201000%20L%202555%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1562%201000%20L%202562%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1569%201000%20L%202569%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1576%201000%20L%202576%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1583%201000%20L%202583%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1590%201000%20L%202590%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1597%201000%20L%202597%200%22%20stroke%3D%22%23e6d9bd%22%20stroke-width%3D%221%22%2F%3E%3C%2Fg%3E%0A%3Crect%20x%3D%2220%22%20y%3D%2220%22%20width%3D%221560%22%20height%3D%22960%22%20fill%3D%22none%22%20stroke%3D%22%233b2a1a%22%20stroke-width%3D%223%22%2F%3E%0A%3Crect%20x%3D%2230%22%20y%3D%2230%22%20width%3D%221540%22%20height%3D%22940%22%20fill%3D%22none%22%20stroke%3D%22%233b2a1a%22%20stroke-width%3D%221%22%2F%3E%0A%3Cpath%20transform%3D%22translate(40%2040)%20scale(1%201)%22%20d%3D%22M0%200%20C%2030%200%2040%2010%2040%2030%20M0%200%20C%200%2030%2010%2040%2030%2040%20M8%208%20C%2022%208%2026%2014%2026%2026%20M8%208%20C%208%2022%2014%2026%2026%2026%22%20stroke%3D%22%233b2a1a%22%20stroke-width%3D%221.6%22%20fill%3D%22none%22%2F%3E%3Cpath%20transform%3D%22translate(1560%2040)%20scale(-1%201)%22%20d%3D%22M0%200%20C%2030%200%2040%2010%2040%2030%20M0%200%20C%200%2030%2010%2040%2030%2040%20M8%208%20C%2022%208%2026%2014%2026%2026%20M8%208%20C%208%2022%2014%2026%2026%2026%22%20stroke%3D%22%233b2a1a%22%20stroke-width%3D%221.6%22%20fill%3D%22none%22%2F%3E%3Cpath%20transform%3D%22translate(40%20960)%20scale(1%20-1)%22%20d%3D%22M0%200%20C%2030%200%2040%2010%2040%2030%20M0%200%20C%200%2030%2010%2040%2030%2040%20M8%208%20C%2022%208%2026%2014%2026%2026%20M8%208%20C%208%2022%2014%2026%2026%2026%22%20stroke%3D%22%233b2a1a%22%20stroke-width%3D%221.6%22%20fill%3D%22none%22%2F%3E%3Cpath%20transform%3D%22translate(1560%20960)%20scale(-1%20-1)%22%20d%3D%22M0%200%20C%2030%200%2040%2010%2040%2030%20M0%200%20C%200%2030%2010%2040%2030%2040%20M8%208%20C%2022%208%2026%2014%2026%2026%20M8%208%20C%208%2022%2014%2026%2026%2026%22%20stroke%3D%22%233b2a1a%22%20stroke-width%3D%221.6%22%20fill%3D%22none%22%2F%3E%0A%3Crect%20x%3D%2252%22%20y%3D%2260%22%20width%3D%22940%22%20height%3D%2244%22%20fill%3D%22%23f3ead6%22%2F%3E%0A%3Ctext%20x%3D%22522%22%20y%3D%2292%22%20font-family%3D%22Batang%2C%20serif%22%20font-size%3D%2226%22%20font-style%3D%22italic%22%20fill%3D%22%233b2a1a%22%20text-anchor%3D%22middle%22%20letter-spacing%3D%228%22%3E%EB%B0%9C%20%ED%9A%A8%20%EC%8B%A4%3C%2Ftext%3E%0A%3Cpath%20d%3D%22M140%2082%20H%20400%20M644%2082%20H%20904%22%20stroke%3D%22%233b2a1a%22%20stroke-width%3D%221%22%2F%3E%0A%3Crect%20x%3D%2252%22%20y%3D%22566%22%20width%3D%22940%22%20height%3D%2244%22%20fill%3D%22%23f3ead6%22%2F%3E%0A%3Ctext%20x%3D%22522%22%20y%3D%22598%22%20font-family%3D%22Batang%2C%20serif%22%20font-size%3D%2226%22%20font-style%3D%22italic%22%20fill%3D%22%233b2a1a%22%20text-anchor%3D%22middle%22%20letter-spacing%3D%228%22%3E%EC%88%99%20%EC%84%B1%20%EC%85%80%20%EB%9F%AC%3C%2Ftext%3E%0A%3Cpath%20d%3D%22M140%20588%20H%20390%20M654%20588%20H%20904%22%20stroke%3D%22%233b2a1a%22%20stroke-width%3D%221%22%2F%3E%0A%3Crect%20x%3D%221030%22%20y%3D%22640%22%20width%3D%22520%22%20height%3D%22312%22%20fill%3D%22%23f3ead6%22%20stroke%3D%22%233b2a1a%22%20stroke-width%3D%221%22%2F%3E%0A%3C%2Fsvg%3E",
    "place": {
      "tank-t1": [
        64,
        118,
        140,
        430
      ],
      "tank-t2": [
        218,
        118,
        140,
        430
      ],
      "tank-t3": [
        372,
        118,
        140,
        430
      ],
      "tank-t4": [
        526,
        118,
        140,
        430
      ],
      "tank-t5": [
        680,
        118,
        140,
        430
      ],
      "tank-t6": [
        834,
        118,
        140,
        430
      ],
      "barrel-b1": [
        60,
        640,
        110,
        150
      ],
      "barrel-b2": [
        176,
        640,
        110,
        150
      ],
      "barrel-b3": [
        292,
        640,
        110,
        150
      ],
      "barrel-b4": [
        408,
        640,
        110,
        150
      ],
      "barrel-b5": [
        524,
        640,
        110,
        150
      ],
      "barrel-b6": [
        640,
        640,
        110,
        150
      ],
      "barrel-b7": [
        756,
        640,
        110,
        150
      ],
      "barrel-b8": [
        872,
        640,
        110,
        150
      ],
      "title": [
        1030,
        44,
        520,
        160
      ],
      "figures": [
        1030,
        218,
        520,
        106
      ],
      "legend": [
        1030,
        338,
        520,
        50
      ],
      "work": [
        1030,
        404,
        520,
        220
      ],
      "temps": [
        1040,
        650,
        500,
        292
      ],
      "cellar-note": [
        52,
        810,
        940,
        140
      ]
    }
  }
};

export const wineryEngraving: SamplePack = {
  id: "winery-engraving",
  title: {
    "ko": "와이너리의 수확철 — 동판화",
    "en": "A winery at harvest — a copperplate engraving"
  },
  field: {
    "ko": "와인 양조",
    "en": "Winemaking"
  },
  kind: {
    "ko": "발효 탱크·숙성 오크통·셀러 일",
    "en": "Fermentation tanks, barrels and the cellar’s work"
  },
  domain: "agrifood",
  styles: [
    "print"
  ],
  summary: {
    "ko": "수확철 와이너리 셀러를 동판화로 — 크림 종이에 세피아 잉크, 모든 음영을 빗금과 교차 빗금으로, 괘선 테두리와 모서리 덩굴, 명조 글자. 위는 발효실 — 탱크 여섯, 안의 와인을 그 높이까지 새김; 아래는 숙성 셀러 — 오크통 여덟, 와인과 오크에 든 달 수. 탱크 상태는 잉크와 함께 작은 새김 그림으로: 발효 중이면 오르는 기포, 안정되면 모래시계, 온도가 높으면 붉은 온도 표시, 비워 세척 중이면 ✕. 오른쪽에 와이너리 이름 카르투슈, 지금 수치, 범례, 오늘의 셀러 일, 두 탱크의 오늘 발효 온도. 와이너리는 지어낸 것이라 예시 데이터입니다.",
    "en": "A winery’s cellar at harvest drawn as a copperplate engraving — sepia ink on cream, every shade laid in hatching and cross-hatching, a ruled border with corner flourishes, serif lettering. Above, the fermentation hall — six tanks, the wine inside engraved at its level; below, the barrel cellar — eight barrels with their wine and their months in oak. A tank tells its state with a small engraved vignette as well as by the ink: rising bubbles while it ferments, an hourglass when it rests, a red mark when it runs warm, a cross when it stands empty for cleaning. On the right the cartouche with the winery’s name, the figures now, the key, the day’s work in the cellar and two tanks’ fermentation temperatures through the day. The winery is made up. Example data."
  },
  connectors: [
    {
      "key": "cellar",
      "name": "예시 와이너리 API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 와이너리가 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
