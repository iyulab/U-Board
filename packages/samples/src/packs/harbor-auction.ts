// A fishing harbour's dawn auction drawn as an ukiyo-e woodblock print: Prussian blue and indigo on warm washi, black
// key-block outlines, the sky graded (bokashi) from blue into the paper, curling waves with claw-shaped foam, a
// vermilion sun on the horizon and a vermilion seal. The sea is the top of the print, the harbour mouth between two
// breakwaters the middle and the quay with the auction hall the bottom; each boat is a card saying what it caught and
// where it is — a dashed outline still out fishing, graded blue on its way in (its minutes to the breakwater on the
// line it follows), solid indigo unloading, a pale ochre hatch once its catch is sold. On the right the morning's
// figures, the auction's order and the boxes sold by the half hour. The harbour is made up, so the values are example
// data.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/harbor-auction.js';

const board: Board = {
  "board": {
    "theme": "light",
    "accent": "#c9442c"
  },
  "elements": {
    "boat": {
      "template": "<section class=\"bt {{b.state}}\"><span>{{b.word}}</span><b>{{b.name}}</b><strong>{{b.catch}}</strong><small>{{b.note}}</small></section>",
      "style": ".bt{height:100%;box-sizing:border-box;display:flex;flex-direction:column;gap:1px;padding:6px 10px 7px;background:#f2e8d0;border:3px solid #1b1a18;font-family:\"Noto Serif KR\", \"Nanum Myeongjo\", \"Batang\", serif;color:#14254a}\nspan{align-self:flex-start;margin-bottom:auto;padding:0 8px;font-size:13px;font-weight:700;color:#f2e8d0;background:#1b1a18}\nb{font-size:15px;font-weight:800}\nstrong{font-size:16px;font-weight:700;line-height:1.2}\nsmall{font-size:12px}\n.sea{border-style:dashed;border-color:#14254a}\n.sea span{background:#f2e8d0;color:#14254a;outline:2px dashed #14254a}\n.return{padding-left:24px;background:linear-gradient(90deg,#1f3f72 0 14px,rgba(31,63,114,.38) 14px,#f2e8d0 70%);border-color:#1f3f72}\n.return span{background:#1f3f72}\n.unload{background:#14254a;color:#f2e8d0}\n.unload span{background:#c9442c}\n.done{padding-right:30px;background:repeating-linear-gradient(135deg,rgba(184,134,40,.75) 0 5px,transparent 5px 10px) right/22px 100% no-repeat,#ecdcb2;color:#43341a;border-color:#7a6a4a}\n.done span{background:#d8a948;color:#1b1a18}",
      "props": {
        "b": "object"
      }
    },
    "mouth": {
      "template": "<div class=\"mo\">방파제 입구</div>",
      "style": ".mo{height:100%;box-sizing:border-box;display:grid;place-items:center;font:700 15px \"Noto Serif KR\", \"Nanum Myeongjo\", \"Batang\", serif;color:#f2e8d0;background:#14254a;border:3px solid #1b1a18}"
    },
    "hall": {
      "template": "<div class=\"hl\"><b>위판장</b><span>{{lot}}</span></div>",
      "style": ".hl{height:100%;box-sizing:border-box;display:grid;place-items:center;align-content:center;gap:2px;font-family:\"Noto Serif KR\", \"Nanum Myeongjo\", \"Batang\", serif;color:#14254a}\nb{font-size:26px;font-weight:800;letter-spacing:.3em}\nspan{font-size:15px;font-weight:700;color:#c9442c}",
      "props": {
        "lot": "string"
      }
    },
    "legend": {
      "template": "<ul class=\"lg\"><li><i class=\"s\"></i>조업 중</li><li><i class=\"r\"></i>귀항 중</li><li><i class=\"u\"></i>하역 중</li><li><i class=\"d\"></i>위판 끝</li></ul>",
      "style": ".lg{height:100%;box-sizing:border-box;margin:0;padding:0 10px;list-style:none;display:flex;align-items:center;gap:16px;font:700 14px \"Noto Serif KR\", \"Nanum Myeongjo\", \"Batang\", serif;color:#14254a;background:#f2e8d0;border:2px solid #1b1a18}\nli{display:flex;align-items:center;gap:6px}\ni{width:22px;height:15px;border:2.5px solid #1b1a18;background:#f2e8d0}\n.s{border-style:dashed;border-color:#14254a}\n.r{background:linear-gradient(90deg,#1f3f72 40%,#f2e8d0)}\n.u{background:#14254a}\n.d{background:repeating-linear-gradient(135deg,rgba(216,169,72,.7) 0 3px,#f2e8d0 3px 6px)}"
    },
    "title": {
      "template": "<header class=\"tt\"><h1>{{name}}</h1><p>{{sub}}<br/>{{date}}<br/><b>{{time}}</b></p><i>어항</i></header>",
      "style": ".tt{position:relative;height:100%;box-sizing:border-box;display:grid;grid-template-columns:auto 1fr;align-items:center;gap:18px;padding:12px 16px;background:#f2e8d0;border:3px double #1b1a18;outline:2px solid #1b1a18;outline-offset:4px;font-family:\"Noto Serif KR\", \"Nanum Myeongjo\", \"Batang\", serif;color:#14254a}\nh1{margin:0;padding:8px 6px;writing-mode:vertical-rl;font-size:25px;font-weight:800;line-height:1.1;background:#e6d6b0;border:2px solid #1b1a18}\np{margin:0;font-size:17px;font-weight:600;line-height:1.55}\nb{font-size:30px;font-weight:800;color:#1f3f72}\ni{position:absolute;right:14px;bottom:14px;width:42px;height:42px;display:grid;place-items:center;font-style:normal;font-size:15px;font-weight:800;color:#f2e8d0;background:#c9442c;border-radius:3px;transform:rotate(-4deg)}",
      "props": {
        "name": "string",
        "sub": "string",
        "date": "string",
        "time": "string"
      }
    },
    "figures": {
      "template": "<dl class=\"fg\">{{#items}}<div><dt>{{label}}</dt><dd>{{value}}</dd><small>{{note}}</small></div>{{/items}}</dl>",
      "style": ".fg{margin:0;height:100%;box-sizing:border-box;display:grid;grid-template-columns:repeat(3,1fr);gap:10px;font-family:\"Noto Serif KR\", \"Nanum Myeongjo\", \"Batang\", serif}\ndiv{display:grid;align-content:center;padding:8px 10px;background:#14254a;color:#f2e8d0;border:2px solid #1b1a18}\ndt{font-size:13px;font-weight:700;color:#9fb6d3}\ndd{margin:2px 0;font-size:28px;font-weight:800}\nsmall{font-size:11px;color:#9fb6d3}",
      "props": {
        "items": "list"
      }
    },
    "lots": {
      "template": "<section class=\"lt\"><h3>경매 순서</h3><ol>{{#items}}<li class=\"{{state}}\"><b>{{fish}}</b><span>{{boxes}}</span><span>{{price}}</span><em>{{word}}</em></li>{{/items}}</ol></section>",
      "style": ".lt{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr;gap:8px;font-family:\"Noto Serif KR\", \"Nanum Myeongjo\", \"Batang\", serif;color:#14254a}\nh3{margin:0;justify-self:start;padding:2px 12px;font-size:18px;font-weight:800;color:#f2e8d0;background:#1b1a18}\nol{margin:0;padding:0;list-style:none;display:grid;align-content:start;gap:4px}\nli{display:grid;grid-template-columns:90px 80px 1fr 96px;align-items:center;gap:8px;padding:6px 8px;border-bottom:2px solid #1b1a18;font-size:15px}\nb{font-size:17px;font-weight:800}\nem{justify-self:end;font-style:normal;font-size:13px;font-weight:700;padding:1px 8px}\n.done em{color:#f2e8d0;background:#c9442c;border-radius:3px}\n.done{color:#6b5a3a}\n.now{background:#14254a;color:#f2e8d0;border-left:8px solid #c9442c}\n.now em{color:#1b1a18;background:#f2e8d0}\n.wait{color:#7d7a72}\n.wait em{border:1.5px dashed #7d7a72}",
      "props": {
        "items": "list"
      }
    }
  },
  "data": {
    "boats": {
      "from": "harbor",
      "path": "/harbor/boats",
      "time": "updatedAt",
      "fresh": 900,
      "fields": {
        "s1": {
          "at": "/value/s1"
        },
        "s2": {
          "at": "/value/s2"
        },
        "r1": {
          "at": "/value/r1"
        },
        "r2": {
          "at": "/value/r2"
        },
        "r3": {
          "at": "/value/r3"
        },
        "u1": {
          "at": "/value/u1"
        },
        "u2": {
          "at": "/value/u2"
        },
        "d1": {
          "at": "/value/d1"
        },
        "d2": {
          "at": "/value/d2"
        }
      }
    },
    "lots": {
      "from": "harbor",
      "path": "/harbor/lots",
      "time": "updatedAt",
      "fresh": 900,
      "fields": {
        "word": {
          "at": "/value/1/word"
        },
        "value": {}
      }
    },
    "now": {
      "from": "harbor",
      "path": "/harbor/now",
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
      "from": "harbor",
      "path": "/harbor/figures",
      "time": "updatedAt",
      "fresh": 900,
      "fields": {
        "value": {}
      }
    },
    "boxes": {
      "from": "harbor",
      "path": "/harbor/boxes",
      "list": "/value",
      "fresh": 900,
      "answerTime": "/updatedAt"
    },
    "eta": {
      "from": "harbor",
      "path": "/harbor/eta",
      "time": "updatedAt",
      "fresh": 900,
      "fields": {
        "r1": {
          "at": "/value/r1"
        },
        "r2": {
          "at": "/value/r2"
        },
        "r3": {
          "at": "/value/r3"
        }
      }
    }
  },
  "parts": {
    "boat-s1": {
      "as": "element",
      "element": "boat",
      "of": "boats",
      "bind": {
        "b": "s1"
      }
    },
    "boat-s2": {
      "as": "element",
      "element": "boat",
      "of": "boats",
      "bind": {
        "b": "s2"
      }
    },
    "boat-r1": {
      "as": "element",
      "element": "boat",
      "of": "boats",
      "bind": {
        "b": "r1"
      }
    },
    "boat-r2": {
      "as": "element",
      "element": "boat",
      "of": "boats",
      "bind": {
        "b": "r2"
      }
    },
    "boat-r3": {
      "as": "element",
      "element": "boat",
      "of": "boats",
      "bind": {
        "b": "r3"
      }
    },
    "boat-u1": {
      "as": "element",
      "element": "boat",
      "of": "boats",
      "bind": {
        "b": "u1"
      }
    },
    "boat-u2": {
      "as": "element",
      "element": "boat",
      "of": "boats",
      "bind": {
        "b": "u2"
      }
    },
    "boat-d1": {
      "as": "element",
      "element": "boat",
      "of": "boats",
      "bind": {
        "b": "d1"
      }
    },
    "boat-d2": {
      "as": "element",
      "element": "boat",
      "of": "boats",
      "bind": {
        "b": "d2"
      }
    },
    "mouth": {
      "as": "element",
      "element": "mouth"
    },
    "hall": {
      "as": "element",
      "element": "hall",
      "of": "lots",
      "bind": {
        "lot": "word"
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
    "figures": {
      "as": "element",
      "element": "figures",
      "of": "figures",
      "bind": {
        "items": "value"
      }
    },
    "lots": {
      "as": "element",
      "element": "lots",
      "of": "lots",
      "bind": {
        "items": "value"
      }
    },
    "boxes": {
      "as": "chart.bar",
      "of": "boxes",
      "title": "30분마다 위판한 상자",
      "x": "hour",
      "y": "boxes",
      "series": [
        {
          "label": "상자",
          "color": "#1f3f72"
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
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221600%22%20height%3D%221000%22%20viewBox%3D%220%200%201600%201000%22%3E%0A%3Cdefs%3E%0A%3ClinearGradient%20id%3D%22bokashi%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%220%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%231f3f72%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%231f3f72%22%20stop-opacity%3D%220%22%2F%3E%3C%2FlinearGradient%3E%0A%3ClinearGradient%20id%3D%22sea%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%220%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%233f6a9e%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%236f92bb%22%2F%3E%3C%2FlinearGradient%3E%0A%3Cfilter%20id%3D%22fibre%22%3E%3CfeTurbulence%20type%3D%22fractalNoise%22%20baseFrequency%3D%22.9%20.08%22%20numOctaves%3D%222%22%20seed%3D%2211%22%2F%3E%3CfeColorMatrix%20values%3D%220%200%200%200%20.45%20%200%200%200%200%20.38%20%200%200%200%200%20.25%20%200%200%200%20-1.6%201.05%22%2F%3E%3C%2Ffilter%3E%0A%3C%2Fdefs%3E%0A%3Crect%20width%3D%221600%22%20height%3D%221000%22%20fill%3D%22%23f2e8d0%22%2F%3E%0A%3Crect%20x%3D%2240%22%20y%3D%2240%22%20width%3D%221040%22%20height%3D%2280%22%20fill%3D%22url(%23bokashi)%22%2F%3E%0A%3Ccircle%20cx%3D%22960%22%20cy%3D%22112%22%20r%3D%2234%22%20fill%3D%22%23c9442c%22%2F%3E%0A%3Crect%20x%3D%2240%22%20y%3D%22112%22%20width%3D%221040%22%20height%3D%22468%22%20fill%3D%22url(%23sea)%22%20stroke%3D%22%231b1a18%22%20stroke-width%3D%223%22%2F%3E%0A%3Cpath%20d%3D%22M%2040%20150%20q%2030%20-10%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%22%20fill%3D%22none%22%20stroke%3D%22%239fb6d3%22%20stroke-width%3D%221.6%22%20opacity%3D%22.55%22%2F%3E%3Cpath%20d%3D%22M%2040%20194%20q%2030%20-10%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%22%20fill%3D%22none%22%20stroke%3D%22%239fb6d3%22%20stroke-width%3D%221.6%22%20opacity%3D%22.55%22%2F%3E%3Cpath%20d%3D%22M%2040%20238%20q%2030%20-10%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%22%20fill%3D%22none%22%20stroke%3D%22%239fb6d3%22%20stroke-width%3D%221.6%22%20opacity%3D%22.55%22%2F%3E%3Cpath%20d%3D%22M%2040%20282%20q%2030%20-10%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%22%20fill%3D%22none%22%20stroke%3D%22%239fb6d3%22%20stroke-width%3D%221.6%22%20opacity%3D%22.55%22%2F%3E%3Cpath%20d%3D%22M%2040%20326%20q%2030%20-10%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%22%20fill%3D%22none%22%20stroke%3D%22%239fb6d3%22%20stroke-width%3D%221.6%22%20opacity%3D%22.55%22%2F%3E%3Cpath%20d%3D%22M%2040%20370%20q%2030%20-10%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%22%20fill%3D%22none%22%20stroke%3D%22%239fb6d3%22%20stroke-width%3D%221.6%22%20opacity%3D%22.55%22%2F%3E%3Cpath%20d%3D%22M%2040%20414%20q%2030%20-10%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%22%20fill%3D%22none%22%20stroke%3D%22%239fb6d3%22%20stroke-width%3D%221.6%22%20opacity%3D%22.55%22%2F%3E%3Cpath%20d%3D%22M%2040%20458%20q%2030%20-10%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%22%20fill%3D%22none%22%20stroke%3D%22%239fb6d3%22%20stroke-width%3D%221.6%22%20opacity%3D%22.55%22%2F%3E%3Cpath%20d%3D%22M%2040%20502%20q%2030%20-10%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%20t%2060%200%22%20fill%3D%22none%22%20stroke%3D%22%239fb6d3%22%20stroke-width%3D%221.6%22%20opacity%3D%22.55%22%2F%3E%0A%3Cpath%20d%3D%22M%2040%20300%20C%2079%20150%2C%20222%20127.5%2C%20261%20217.5%20C%20242.8%20195%2C%20201.2%20210%2C%20211.6%20258%20C%20235%20285%2C%20279.20000000000005%20288%2C%20300%20300%20Z%22%20fill%3D%22%231f3f72%22%20stroke%3D%22%231b1a18%22%20stroke-width%3D%223%22%2F%3E%0A%3Cpath%20d%3D%22M%2071.2%20232.5%20C%20118%20165%2C%20201.2%20153%2C%20248%20210%22%20fill%3D%22none%22%20stroke%3D%22%239fb6d3%22%20stroke-width%3D%225%22%2F%3E%0A%3Cpath%20d%3D%22M%2086.8%20207%20q%207%20-14%2016%20-4%20q%20-7%20-2%20-8%208%22%20fill%3D%22%23f2e8d0%22%20stroke%3D%22%231b1a18%22%20stroke-width%3D%221.6%22%2F%3E%3Cpath%20d%3D%22M%20116.8%20211.6999614577649%20q%207%20-14%2016%20-4%20q%20-7%20-2%20-8%208%22%20fill%3D%22%23f2e8d0%22%20stroke%3D%22%231b1a18%22%20stroke-width%3D%221.6%22%2F%3E%3Cpath%20d%3D%22M%20146.8%20212.84308578526918%20q%207%20-14%2016%20-4%20q%20-7%20-2%20-8%208%22%20fill%3D%22%23f2e8d0%22%20stroke%3D%22%231b1a18%22%20stroke-width%3D%221.6%22%2F%3E%3Cpath%20d%3D%22M%20176.8%20209.56427928140297%20q%207%20-14%2016%20-4%20q%20-7%20-2%20-8%208%22%20fill%3D%22%23f2e8d0%22%20stroke%3D%22%231b1a18%22%20stroke-width%3D%221.6%22%2F%3E%3Cpath%20d%3D%22M%20206.8%20204.34487734023088%20q%207%20-14%2016%20-4%20q%20-7%20-2%20-8%208%22%20fill%3D%22%23f2e8d0%22%20stroke%3D%22%231b1a18%22%20stroke-width%3D%221.6%22%2F%3E%3Cpath%20d%3D%22M%20236.8%20201.13481929400942%20q%207%20-14%2016%20-4%20q%20-7%20-2%20-8%208%22%20fill%3D%22%23f2e8d0%22%20stroke%3D%22%231b1a18%22%20stroke-width%3D%221.6%22%2F%3E%3Cpath%20d%3D%22M%20266.8%20202.36341307466407%20q%207%20-14%2016%20-4%20q%20-7%20-2%20-8%208%22%20fill%3D%22%23f2e8d0%22%20stroke%3D%22%231b1a18%22%20stroke-width%3D%221.6%22%2F%3E%3Cpath%20d%3D%22M%20296.8%20207.1008834029061%20q%207%20-14%2016%20-4%20q%20-7%20-2%20-8%208%22%20fill%3D%22%23f2e8d0%22%20stroke%3D%22%231b1a18%22%20stroke-width%3D%221.6%22%2F%3E%3Cpath%20d%3D%22M%20900%20330%20C%20927%20220%2C%201026%20203.5%2C%201053%20269.5%20C%201040.4%20253%2C%201011.6%20264%2C%201018.8%20299.2%20C%201035%20319%2C%201065.6%20321.2%2C%201080%20330%20Z%22%20fill%3D%22%231f3f72%22%20stroke%3D%22%231b1a18%22%20stroke-width%3D%223%22%2F%3E%0A%3Cpath%20d%3D%22M%20921.6%20280.5%20C%20954%20231%2C%201011.6%20222.2%2C%201044%20264%22%20fill%3D%22none%22%20stroke%3D%22%239fb6d3%22%20stroke-width%3D%225%22%2F%3E%0A%3Cpath%20d%3D%22M%20932.4%20261.8%20q%207%20-14%2016%20-4%20q%20-7%20-2%20-8%208%22%20fill%3D%22%23f2e8d0%22%20stroke%3D%22%231b1a18%22%20stroke-width%3D%221.6%22%2F%3E%3Cpath%20d%3D%22M%20962.4%20266.4999614577649%20q%207%20-14%2016%20-4%20q%20-7%20-2%20-8%208%22%20fill%3D%22%23f2e8d0%22%20stroke%3D%22%231b1a18%22%20stroke-width%3D%221.6%22%2F%3E%3Cpath%20d%3D%22M%20992.4%20267.6430857852692%20q%207%20-14%2016%20-4%20q%20-7%20-2%20-8%208%22%20fill%3D%22%23f2e8d0%22%20stroke%3D%22%231b1a18%22%20stroke-width%3D%221.6%22%2F%3E%3Cpath%20d%3D%22M%201022.4%20264.364279281403%20q%207%20-14%2016%20-4%20q%20-7%20-2%20-8%208%22%20fill%3D%22%23f2e8d0%22%20stroke%3D%22%231b1a18%22%20stroke-width%3D%221.6%22%2F%3E%3Cpath%20d%3D%22M%201052.4%20259.1448773402309%20q%207%20-14%2016%20-4%20q%20-7%20-2%20-8%208%22%20fill%3D%22%23f2e8d0%22%20stroke%3D%22%231b1a18%22%20stroke-width%3D%221.6%22%2F%3E%3Cpath%20d%3D%22M%2056%20560%20C%2078.5%20480%2C%20161%20468%2C%20183.5%20516%20C%20173%20504%2C%20149%20512%2C%20155%20537.6%20C%20168.5%20552%2C%20194%20553.6%2C%20206%20560%20Z%22%20fill%3D%22%231f3f72%22%20stroke%3D%22%231b1a18%22%20stroke-width%3D%223%22%2F%3E%0A%3Cpath%20d%3D%22M%2074%20524%20C%20101%20488%2C%20149%20481.6%2C%20176%20512%22%20fill%3D%22none%22%20stroke%3D%22%239fb6d3%22%20stroke-width%3D%225%22%2F%3E%0A%3Cpath%20d%3D%22M%2083%20510.4%20q%207%20-14%2016%20-4%20q%20-7%20-2%20-8%208%22%20fill%3D%22%23f2e8d0%22%20stroke%3D%22%231b1a18%22%20stroke-width%3D%221.6%22%2F%3E%3Cpath%20d%3D%22M%20113%20515.0999614577648%20q%207%20-14%2016%20-4%20q%20-7%20-2%20-8%208%22%20fill%3D%22%23f2e8d0%22%20stroke%3D%22%231b1a18%22%20stroke-width%3D%221.6%22%2F%3E%3Cpath%20d%3D%22M%20143%20516.2430857852692%20q%207%20-14%2016%20-4%20q%20-7%20-2%20-8%208%22%20fill%3D%22%23f2e8d0%22%20stroke%3D%22%231b1a18%22%20stroke-width%3D%221.6%22%2F%3E%3Cpath%20d%3D%22M%20173%20512.9642792814029%20q%207%20-14%2016%20-4%20q%20-7%20-2%20-8%208%22%20fill%3D%22%23f2e8d0%22%20stroke%3D%22%231b1a18%22%20stroke-width%3D%221.6%22%2F%3E%0A%3Crect%20x%3D%2240%22%20y%3D%22580%22%20width%3D%221040%22%20height%3D%22220%22%20fill%3D%22%239fb6d3%22%20stroke%3D%22%231b1a18%22%20stroke-width%3D%223%22%2F%3E%0A%3Cpath%20d%3D%22M%2040%20570%20H%20440%20L%20455%20590%20H%2040%20Z%22%20fill%3D%22%238a8273%22%20stroke%3D%22%231b1a18%22%20stroke-width%3D%223%22%2F%3E%0A%3Cpath%20d%3D%22M%201080%20570%20H%20650%20L%20635%20590%20H%201080%20Z%22%20fill%3D%22%238a8273%22%20stroke%3D%22%231b1a18%22%20stroke-width%3D%223%22%2F%3E%0A%3Crect%20x%3D%22430%22%20y%3D%22532%22%20width%3D%2216%22%20height%3D%2244%22%20fill%3D%22%23f2e8d0%22%20stroke%3D%22%231b1a18%22%20stroke-width%3D%222.5%22%2F%3E%3Crect%20x%3D%22430%22%20y%3D%22532%22%20width%3D%2216%22%20height%3D%2212%22%20fill%3D%22%23c9442c%22%2F%3E%0A%3Crect%20x%3D%22640%22%20y%3D%22532%22%20width%3D%2216%22%20height%3D%2244%22%20fill%3D%22%23f2e8d0%22%20stroke%3D%22%231b1a18%22%20stroke-width%3D%222.5%22%2F%3E%3Crect%20x%3D%22640%22%20y%3D%22532%22%20width%3D%2216%22%20height%3D%2212%22%20fill%3D%22%2314254a%22%2F%3E%0A%3Crect%20x%3D%2240%22%20y%3D%22800%22%20width%3D%221040%22%20height%3D%22160%22%20fill%3D%22%23f2e8d0%22%20stroke%3D%22%231b1a18%22%20stroke-width%3D%223%22%2F%3E%0A%3Cpath%20d%3D%22M%20310%20860%20L%20340%20820%20H%20760%20L%20790%20860%20Z%22%20fill%3D%22%2314254a%22%20stroke%3D%22%231b1a18%22%20stroke-width%3D%223%22%2F%3E%0A%3Cpath%20d%3D%22M%20330%20838%20v%2022%22%20stroke%3D%22%231b1a18%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M%20350%20838%20v%2022%22%20stroke%3D%22%231b1a18%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M%20370%20838%20v%2022%22%20stroke%3D%22%231b1a18%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M%20390%20838%20v%2022%22%20stroke%3D%22%231b1a18%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M%20410%20838%20v%2022%22%20stroke%3D%22%231b1a18%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M%20430%20838%20v%2022%22%20stroke%3D%22%231b1a18%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M%20450%20838%20v%2022%22%20stroke%3D%22%231b1a18%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M%20470%20838%20v%2022%22%20stroke%3D%22%231b1a18%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M%20490%20838%20v%2022%22%20stroke%3D%22%231b1a18%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M%20510%20838%20v%2022%22%20stroke%3D%22%231b1a18%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M%20530%20838%20v%2022%22%20stroke%3D%22%231b1a18%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M%20550%20838%20v%2022%22%20stroke%3D%22%231b1a18%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M%20570%20838%20v%2022%22%20stroke%3D%22%231b1a18%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M%20590%20838%20v%2022%22%20stroke%3D%22%231b1a18%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M%20610%20838%20v%2022%22%20stroke%3D%22%231b1a18%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M%20630%20838%20v%2022%22%20stroke%3D%22%231b1a18%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M%20650%20838%20v%2022%22%20stroke%3D%22%231b1a18%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M%20670%20838%20v%2022%22%20stroke%3D%22%231b1a18%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M%20690%20838%20v%2022%22%20stroke%3D%22%231b1a18%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M%20710%20838%20v%2022%22%20stroke%3D%22%231b1a18%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M%20730%20838%20v%2022%22%20stroke%3D%22%231b1a18%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M%20750%20838%20v%2022%22%20stroke%3D%22%231b1a18%22%20stroke-width%3D%221.5%22%2F%3E%0A%3Crect%20x%3D%22330%22%20y%3D%22860%22%20width%3D%22440%22%20height%3D%2290%22%20fill%3D%22%23e6d6b0%22%20stroke%3D%22%231b1a18%22%20stroke-width%3D%223%22%2F%3E%0A%3Ctext%20x%3D%22520%22%20y%3D%2292%22%20fill%3D%22%23f2e8d0%22%20font-size%3D%2222%22%20font-family%3D'%22Noto%20Serif%20KR%22%2C%20%22Nanum%20Myeongjo%22%2C%20%22Batang%22%2C%20serif'%20font-weight%3D%22700%22%3E%EB%8F%99%ED%95%B4%20%E2%80%94%20%EC%83%88%EB%B2%BD%20%EB%B0%94%EB%8B%A4%3C%2Ftext%3E%0A%3Ctext%20x%3D%2256%22%20y%3D%22940%22%20fill%3D%22%2314254a%22%20font-size%3D%2220%22%20font-family%3D'%22Noto%20Serif%20KR%22%2C%20%22Nanum%20Myeongjo%22%2C%20%22Batang%22%2C%20serif'%20font-weight%3D%22700%22%3E%EB%AC%BC%EC%96%91%EC%9E%A5%20%C2%B7%20%ED%95%98%EC%97%AD%3C%2Ftext%3E%0A%3Ctext%20x%3D%221064%22%20y%3D%22940%22%20text-anchor%3D%22end%22%20fill%3D%22%2314254a%22%20font-size%3D%2220%22%20font-family%3D'%22Noto%20Serif%20KR%22%2C%20%22Nanum%20Myeongjo%22%2C%20%22Batang%22%2C%20serif'%20font-weight%3D%22700%22%3E%EC%96%BC%EC%9D%8C%20%EC%B0%BD%EA%B3%A0%20%E2%86%92%3C%2Ftext%3E%0A%3Crect%20width%3D%221600%22%20height%3D%221000%22%20filter%3D%22url(%23fibre)%22%20opacity%3D%22.18%22%2F%3E%0A%3Crect%20x%3D%2218%22%20y%3D%2218%22%20width%3D%221082%22%20height%3D%22964%22%20fill%3D%22none%22%20stroke%3D%22%231b1a18%22%20stroke-width%3D%222%22%2F%3E%0A%3C%2Fsvg%3E",
    "place": {
      "boat-s1": [
        120,
        150,
        190,
        96
      ],
      "boat-s2": [
        760,
        190,
        190,
        96
      ],
      "boat-r1": [
        230,
        390,
        190,
        96
      ],
      "boat-r2": [
        500,
        340,
        190,
        96
      ],
      "boat-r3": [
        800,
        410,
        190,
        96
      ],
      "boat-u1": [
        80,
        660,
        190,
        96
      ],
      "boat-u2": [
        290,
        660,
        190,
        96
      ],
      "boat-d1": [
        600,
        660,
        190,
        96
      ],
      "boat-d2": [
        810,
        660,
        190,
        96
      ],
      "mouth": [
        470,
        530,
        150,
        38
      ],
      "hall": [
        370,
        870,
        360,
        76
      ],
      "legend": [
        60,
        54,
        420,
        34
      ],
      "title": [
        1120,
        30,
        460,
        190
      ],
      "figures": [
        1120,
        240,
        460,
        100
      ],
      "lots": [
        1120,
        360,
        460,
        250
      ],
      "boxes": [
        1120,
        630,
        460,
        330
      ]
    },
    "links": {
      "course-r1": {
        "from": "boat-r1",
        "to": "mouth",
        "label": "{{r1}}",
        "tone": "next",
        "of": "eta",
        "width": 3,
        "dash": true,
        "arrow": "end",
        "route": "curved"
      },
      "course-r2": {
        "from": "boat-r2",
        "to": "mouth",
        "label": "{{r2}}",
        "tone": "next",
        "of": "eta",
        "width": 3,
        "dash": true,
        "arrow": "end",
        "route": "curved"
      },
      "course-r3": {
        "from": "boat-r3",
        "to": "mouth",
        "label": "{{r3}}",
        "tone": "next",
        "of": "eta",
        "width": 3,
        "dash": true,
        "arrow": "end",
        "route": "curved"
      }
    }
  }
};

export const harborAuction: SamplePack = {
  id: "harbor-auction",
  title: {
    "ko": "어항 새벽 위판장 — 우키요에 목판",
    "en": "A fishing harbour’s dawn auction — an ukiyo-e woodblock print"
  },
  field: {
    "ko": "수산·어항",
    "en": "Fisheries & harbours"
  },
  kind: {
    "ko": "어선 위치와 위판 진행",
    "en": "Where the boats are and how the auction runs"
  },
  domain: "agrifood",
  styles: [
    "art"
  ],
  summary: {
    "ko": "어항의 새벽 위판 현황을 우키요에 목판화로 — 따뜻한 화지에 프러시안 블루와 남색, 검은 윤곽판, 위에서 종이로 번지는 하늘(보카시), 발톱 같은 물보라가 달린 큰 파도, 수평선의 붉은 해와 붉은 낙관. 위는 바다, 가운데는 두 방파제 사이 입구, 아래는 위판장이 있는 물양장 — 배마다 무엇을 잡았고 어디 있는지 카드로: 점선 테두리는 조업 중, 남색이 번진 카드는 귀항 중(방파제까지 남은 분을 따라가는 선에), 남색 단색은 하역 중, 엷은 황토 빗금은 위판 끝. 오른쪽에 위판 상자·입항 척수·평균 낙찰가, 경매 순서, 30분마다 위판한 상자. 어항은 지어낸 것이라 예시 데이터입니다.",
    "en": "A fishing harbour’s dawn auction as an ukiyo-e woodblock print — Prussian blue and indigo on warm washi, black key-block outlines, a sky graded from blue into the paper, big curling waves with claw-shaped foam, a vermilion sun on the horizon and a vermilion seal. The sea at the top, the mouth between two breakwaters in the middle, the quay with the auction hall at the bottom; each boat is a card saying what it caught and where it is: a dashed outline still fishing, graded blue on its way in (its minutes to the breakwater on the line it follows), solid indigo unloading, a pale ochre hatch once its catch is sold. On the right the boxes sold, the boats in and the average price, the auction’s order and the boxes sold by the half hour. The harbour is made up. Example data."
  },
  connectors: [
    {
      "key": "harbor",
      "name": "예시 위판장 API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 어항이 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
