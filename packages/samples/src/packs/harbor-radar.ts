// A fishing harbour's night watch on an old green-phosphor radar scope: range rings, bearing ticks, the sweep and the
// coast round the station, and every boat out tonight a blip placed where it is — its call sign, speed and state in a
// mark and a word: ● fishing, ▶ under way, ▲ in amber when it nears a closed area, ✕ dimmed when its position report has
// stopped. On the right the boats' roster and the sea's wave height against the advisory level. The harbour and its
// boats are made up, so the values are example data.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/harbor-radar.js';

const board: Board = {
  "board": {
    "theme": "dark",
    "accent": "#39ff7a"
  },
  "elements": {
    "banner": {
      "template": "<header class=\"bn\"><h1>물안개항 야간 출입항 관제</h1><p>{{n.date}} {{n.time}} · 출어 {{n.out}}척</p></header>",
      "style": ".bn{height:100%;display:flex;align-items:baseline;gap:20px;font-family:\"D2Coding\", \"Consolas\", \"Menlo\", monospace;color:#39ff7a;text-shadow:0 0 8px rgba(57,255,122,.6)}\nh1{margin:0;white-space:nowrap;font:700 30px \"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;letter-spacing:.04em}\np{margin:0;white-space:nowrap;font-size:16px;color:#1d8a44}",
      "props": {
        "n": "object"
      }
    },
    "blip": {
      "template": "<div class=\"bp {{v.state}}\"><i></i><p><b>{{v.call}}</b><small>{{v.knots}} kn · {{v.word}}</small></p></div>",
      "style": ".bp{height:100%;display:flex;align-items:center;gap:8px;font-family:\"D2Coding\", \"Consolas\", \"Menlo\", monospace;color:#39ff7a;text-shadow:0 0 6px rgba(57,255,122,.7)}\ni{flex:none;width:28px;height:28px;display:grid;place-items:center;font-style:normal;font-size:20px;line-height:1}\np{margin:0;display:grid;padding:2px 6px;background:rgba(2,16,6,.75);border-left:2px solid currentColor}\nb{font-size:15px;white-space:nowrap}\nsmall{font-size:12px;white-space:nowrap;opacity:.9}\n.fishing i::before{content:\"●\"}\n.underway i::before{content:\"▶\"}\n.alarm{color:#ffb627;text-shadow:0 0 8px rgba(255,182,39,.8)}.alarm i::before{content:\"▲\"}.alarm i{outline:2px solid #ffb627;outline-offset:2px;border-radius:50%}\n.lost{opacity:.55}.lost i::before{content:\"✕\"}.lost p{border-left-style:dashed}",
      "props": {
        "v": "object"
      }
    },
    "roster": {
      "template": "<section class=\"rs\"><h2>출어 선박 · 7척</h2><ol>{{#items}}<li class=\"{{state}}\"><i></i><b>{{call}}</b><span>{{kind}}</span><em>{{word}}</em><small>{{note}}</small></li>{{/items}}</ol><p class=\"key\">● 조업 · ▶ 항해 · ▲ 경보 · ✕ 위치 끊김</p></section>",
      "style": ".rs{height:100%;box-sizing:border-box;padding:4px 6px;font-family:\"D2Coding\", \"Consolas\", \"Menlo\", monospace;color:#39ff7a}\nh2{margin:0 0 10px;font:700 20px \"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;letter-spacing:.06em}\nol{margin:0;padding:0;list-style:none;display:grid;gap:6px}\nli{display:grid;grid-template-columns:22px 104px minmax(0,1fr) 74px;grid-template-rows:auto auto;column-gap:6px;align-items:baseline;padding:4px 0;border-bottom:1px solid #1d3a26}\ni{font-style:normal;grid-row:1}\nb{font-size:14px;white-space:nowrap}\nspan{font-size:12px;color:#1d8a44;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\nem{font-style:normal;font-size:12px;text-align:center;border:1px solid currentColor;padding:0 2px;white-space:nowrap}\nsmall{grid-column:2 / span 3;font-size:12px;color:#8fd8a8}\n.fishing i::before{content:\"●\"}.underway i::before{content:\"▶\"}\n.alarm{color:#ffb627}.alarm i::before{content:\"▲\"}.alarm em{background:#ffb627;color:#021006}\n.lost{opacity:.6}.lost i::before{content:\"✕\"}.lost em{border-style:dashed}\n.key{margin:10px 0 0;font-size:12px;color:#1d8a44}",
      "props": {
        "items": "list"
      }
    }
  },
  "data": {
    "now": {
      "from": "watch",
      "path": "/watch/now",
      "time": "updatedAt",
      "fresh": 900,
      "fields": {
        "value": {}
      }
    },
    "boats": {
      "from": "watch",
      "path": "/watch/boats",
      "time": "updatedAt",
      "fresh": 900,
      "fields": {
        "v1": {
          "at": "/value/v1"
        },
        "v2": {
          "at": "/value/v2"
        },
        "v3": {
          "at": "/value/v3"
        },
        "v4": {
          "at": "/value/v4"
        },
        "v5": {
          "at": "/value/v5"
        },
        "v6": {
          "at": "/value/v6"
        },
        "v7": {
          "at": "/value/v7"
        }
      }
    },
    "roster": {
      "from": "watch",
      "path": "/watch/roster",
      "time": "updatedAt",
      "fresh": 900,
      "fields": {
        "value": {}
      }
    },
    "waves": {
      "from": "watch",
      "path": "/watch/waves",
      "list": "/value",
      "fresh": 900,
      "answerTime": "/updatedAt"
    }
  },
  "parts": {
    "banner": {
      "as": "element",
      "element": "banner",
      "of": "now",
      "bind": {
        "n": "value"
      }
    },
    "boat-v1": {
      "as": "element",
      "element": "blip",
      "of": "boats",
      "bind": {
        "v": "v1"
      }
    },
    "boat-v2": {
      "as": "element",
      "element": "blip",
      "of": "boats",
      "bind": {
        "v": "v2"
      }
    },
    "boat-v3": {
      "as": "element",
      "element": "blip",
      "of": "boats",
      "bind": {
        "v": "v3"
      }
    },
    "boat-v4": {
      "as": "element",
      "element": "blip",
      "of": "boats",
      "bind": {
        "v": "v4"
      }
    },
    "boat-v5": {
      "as": "element",
      "element": "blip",
      "of": "boats",
      "bind": {
        "v": "v5"
      }
    },
    "boat-v6": {
      "as": "element",
      "element": "blip",
      "of": "boats",
      "bind": {
        "v": "v6"
      }
    },
    "boat-v7": {
      "as": "element",
      "element": "blip",
      "of": "boats",
      "bind": {
        "v": "v7"
      }
    },
    "roster": {
      "as": "element",
      "element": "roster",
      "of": "roster",
      "bind": {
        "items": "value"
      }
    },
    "waves": {
      "as": "chart.line",
      "of": "waves",
      "title": "근해 유의파고 — 지난 12시간 (m)",
      "x": "hour",
      "y": [
        "wave",
        "advisory"
      ],
      "series": [
        {
          "label": "파고",
          "color": "#39ff7a"
        },
        {
          "label": "풍랑주의보 3 m",
          "color": "#ffb627"
        }
      ],
      "echarts": {
        "yAxis": {
          "min": 0,
          "max": 4
        }
      }
    }
  },
  "layout": {
    "kind": "canvas",
    "size": [
      1600,
      1000
    ],
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221600%22%20height%3D%221000%22%20viewBox%3D%220%200%201600%201000%22%3E%0A%3Cdefs%3E%0A%3CradialGradient%20id%3D%22glass%22%20cx%3D%22.5%22%20cy%3D%22.5%22%20r%3D%22.5%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%2306301a%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23021006%22%2F%3E%3C%2FradialGradient%3E%0A%3ClinearGradient%20id%3D%22trail%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%221%22%20y2%3D%220%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%2339ff7a%22%20stop-opacity%3D%220%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%2339ff7a%22%20stop-opacity%3D%22.28%22%2F%3E%3C%2FlinearGradient%3E%0A%3CclipPath%20id%3D%22scope%22%3E%3Ccircle%20cx%3D%22520%22%20cy%3D%22560%22%20r%3D%22400%22%2F%3E%3C%2FclipPath%3E%0A%3Cpattern%20id%3D%22land%22%20width%3D%2210%22%20height%3D%2210%22%20patternUnits%3D%22userSpaceOnUse%22%20patternTransform%3D%22rotate(45)%22%3E%3Crect%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%230a2a16%22%2F%3E%3Cline%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%220%22%20y2%3D%2210%22%20stroke%3D%22%231d8a44%22%20stroke-width%3D%221.4%22%2F%3E%3C%2Fpattern%3E%0A%3C%2Fdefs%3E%0A%3Crect%20width%3D%221600%22%20height%3D%221000%22%20fill%3D%22%230b0f0c%22%2F%3E%0A%3Crect%20x%3D%2260%22%20y%3D%2280%22%20width%3D%22920%22%20height%3D%22900%22%20rx%3D%2240%22%20fill%3D%22%23151a16%22%20stroke%3D%22%232a332c%22%20stroke-width%3D%223%22%2F%3E%0A%3Ccircle%20cx%3D%22520%22%20cy%3D%22560%22%20r%3D%22430%22%20fill%3D%22%23050806%22%20stroke%3D%22%232a332c%22%20stroke-width%3D%224%22%2F%3E%0A%3Ccircle%20cx%3D%22520%22%20cy%3D%22560%22%20r%3D%22400%22%20fill%3D%22url(%23glass)%22%2F%3E%0A%3Cg%20clip-path%3D%22url(%23scope)%22%3E%0A%3Cpath%20transform%3D%22translate(0%2020)%22%20d%3D%22M110%20720%20C%20250%20650%2C%20380%20640%2C%20470%20590%20L%20520%20562%20L%20570%20590%20C%20660%20640%2C%20800%20650%2C%20930%20700%20L%20930%20960%20L%20110%20960%20Z%22%20fill%3D%22url(%23land)%22%20stroke%3D%22%2339ff7a%22%20stroke-width%3D%222%22%20opacity%3D%22.85%22%2F%3E%0A%3Cpath%20d%3D%22M520%20160%20V960%20M120%20560%20H920%22%20stroke%3D%22%231d8a44%22%20stroke-width%3D%221%22%20stroke-dasharray%3D%224%208%22%2F%3E%0A%3Cpath%20d%3D%22M520%20560%20L656.8%20184.1%20A400%20400%200%200%201%20866.4%20360.0%20Z%22%20fill%3D%22url(%23trail)%22%2F%3E%3Cline%20x1%3D%22520%22%20y1%3D%22560%22%20x2%3D%22866.4%22%20y2%3D%22360.0%22%20stroke%3D%22%2339ff7a%22%20stroke-width%3D%222.5%22%2F%3E%0A%3C%2Fg%3E%0A%3Ccircle%20cx%3D%22520%22%20cy%3D%22560%22%20r%3D%22100%22%20fill%3D%22none%22%20stroke%3D%22%231d8a44%22%20stroke-width%3D%221.2%22%2F%3E%3Ccircle%20cx%3D%22520%22%20cy%3D%22560%22%20r%3D%22200%22%20fill%3D%22none%22%20stroke%3D%22%231d8a44%22%20stroke-width%3D%221.2%22%2F%3E%3Ccircle%20cx%3D%22520%22%20cy%3D%22560%22%20r%3D%22300%22%20fill%3D%22none%22%20stroke%3D%22%231d8a44%22%20stroke-width%3D%221.2%22%2F%3E%3Ccircle%20cx%3D%22520%22%20cy%3D%22560%22%20r%3D%22400%22%20fill%3D%22none%22%20stroke%3D%22%231d8a44%22%20stroke-width%3D%223%22%2F%3E%3Ctext%20x%3D%22526%22%20y%3D%22454%22%20fill%3D%22%231d8a44%22%20font-family%3D%22Consolas%2C%20monospace%22%20font-size%3D%2214%22%3E3%20NM%3C%2Ftext%3E%3Ctext%20x%3D%22526%22%20y%3D%22354%22%20fill%3D%22%231d8a44%22%20font-family%3D%22Consolas%2C%20monospace%22%20font-size%3D%2214%22%3E6%20NM%3C%2Ftext%3E%3Ctext%20x%3D%22526%22%20y%3D%22254%22%20fill%3D%22%231d8a44%22%20font-family%3D%22Consolas%2C%20monospace%22%20font-size%3D%2214%22%3E9%20NM%3C%2Ftext%3E%3Cline%20x1%3D%22520.0%22%20y1%3D%22178.0%22%20x2%3D%22520.0%22%20y2%3D%22160.0%22%20stroke%3D%22%231d8a44%22%20stroke-width%3D%222%22%2F%3E%3Ctext%20x%3D%22520.0%22%20y%3D%22143.0%22%20fill%3D%22%231d8a44%22%20font-family%3D%22Consolas%2C%20monospace%22%20font-size%3D%2216%22%20text-anchor%3D%22middle%22%3E000%3C%2Ftext%3E%3Cline%20x1%3D%22587.9%22%20y1%3D%22174.9%22%20x2%3D%22589.5%22%20y2%3D%22166.1%22%20stroke%3D%22%231d8a44%22%20stroke-width%3D%222%22%2F%3E%3Cline%20x1%3D%22653.7%22%20y1%3D%22192.6%22%20x2%3D%22656.8%22%20y2%3D%22184.1%22%20stroke%3D%22%231d8a44%22%20stroke-width%3D%222%22%2F%3E%3Cline%20x1%3D%22711.0%22%20y1%3D%22229.2%22%20x2%3D%22720.0%22%20y2%3D%22213.6%22%20stroke%3D%22%231d8a44%22%20stroke-width%3D%222%22%2F%3E%3Cline%20x1%3D%22771.3%22%20y1%3D%22260.5%22%20x2%3D%22777.1%22%20y2%3D%22253.6%22%20stroke%3D%22%231d8a44%22%20stroke-width%3D%222%22%2F%3E%3Cline%20x1%3D%22819.5%22%20y1%3D%22308.7%22%20x2%3D%22826.4%22%20y2%3D%22302.9%22%20stroke%3D%22%231d8a44%22%20stroke-width%3D%222%22%2F%3E%3Cline%20x1%3D%22850.8%22%20y1%3D%22369.0%22%20x2%3D%22866.4%22%20y2%3D%22360.0%22%20stroke%3D%22%231d8a44%22%20stroke-width%3D%222%22%2F%3E%3Cline%20x1%3D%22887.4%22%20y1%3D%22426.3%22%20x2%3D%22895.9%22%20y2%3D%22423.2%22%20stroke%3D%22%231d8a44%22%20stroke-width%3D%222%22%2F%3E%3Cline%20x1%3D%22905.1%22%20y1%3D%22492.1%22%20x2%3D%22913.9%22%20y2%3D%22490.5%22%20stroke%3D%22%231d8a44%22%20stroke-width%3D%222%22%2F%3E%3Cline%20x1%3D%22902.0%22%20y1%3D%22560.0%22%20x2%3D%22920.0%22%20y2%3D%22560.0%22%20stroke%3D%22%231d8a44%22%20stroke-width%3D%222%22%2F%3E%3Ctext%20x%3D%22942.0%22%20y%3D%22565.0%22%20fill%3D%22%231d8a44%22%20font-family%3D%22Consolas%2C%20monospace%22%20font-size%3D%2216%22%20text-anchor%3D%22middle%22%3E090%3C%2Ftext%3E%3Cline%20x1%3D%22905.1%22%20y1%3D%22627.9%22%20x2%3D%22913.9%22%20y2%3D%22629.5%22%20stroke%3D%22%231d8a44%22%20stroke-width%3D%222%22%2F%3E%3Cline%20x1%3D%22887.4%22%20y1%3D%22693.7%22%20x2%3D%22895.9%22%20y2%3D%22696.8%22%20stroke%3D%22%231d8a44%22%20stroke-width%3D%222%22%2F%3E%3Cline%20x1%3D%22850.8%22%20y1%3D%22751.0%22%20x2%3D%22866.4%22%20y2%3D%22760.0%22%20stroke%3D%22%231d8a44%22%20stroke-width%3D%222%22%2F%3E%3Cline%20x1%3D%22819.5%22%20y1%3D%22811.3%22%20x2%3D%22826.4%22%20y2%3D%22817.1%22%20stroke%3D%22%231d8a44%22%20stroke-width%3D%222%22%2F%3E%3Cline%20x1%3D%22771.3%22%20y1%3D%22859.5%22%20x2%3D%22777.1%22%20y2%3D%22866.4%22%20stroke%3D%22%231d8a44%22%20stroke-width%3D%222%22%2F%3E%3Cline%20x1%3D%22711.0%22%20y1%3D%22890.8%22%20x2%3D%22720.0%22%20y2%3D%22906.4%22%20stroke%3D%22%231d8a44%22%20stroke-width%3D%222%22%2F%3E%3Cline%20x1%3D%22653.7%22%20y1%3D%22927.4%22%20x2%3D%22656.8%22%20y2%3D%22935.9%22%20stroke%3D%22%231d8a44%22%20stroke-width%3D%222%22%2F%3E%3Cline%20x1%3D%22587.9%22%20y1%3D%22945.1%22%20x2%3D%22589.5%22%20y2%3D%22953.9%22%20stroke%3D%22%231d8a44%22%20stroke-width%3D%222%22%2F%3E%3Cline%20x1%3D%22520.0%22%20y1%3D%22942.0%22%20x2%3D%22520.0%22%20y2%3D%22960.0%22%20stroke%3D%22%231d8a44%22%20stroke-width%3D%222%22%2F%3E%3Ctext%20x%3D%22520.0%22%20y%3D%22987.0%22%20fill%3D%22%231d8a44%22%20font-family%3D%22Consolas%2C%20monospace%22%20font-size%3D%2216%22%20text-anchor%3D%22middle%22%3E180%3C%2Ftext%3E%3Cline%20x1%3D%22452.1%22%20y1%3D%22945.1%22%20x2%3D%22450.5%22%20y2%3D%22953.9%22%20stroke%3D%22%231d8a44%22%20stroke-width%3D%222%22%2F%3E%3Cline%20x1%3D%22386.3%22%20y1%3D%22927.4%22%20x2%3D%22383.2%22%20y2%3D%22935.9%22%20stroke%3D%22%231d8a44%22%20stroke-width%3D%222%22%2F%3E%3Cline%20x1%3D%22329.0%22%20y1%3D%22890.8%22%20x2%3D%22320.0%22%20y2%3D%22906.4%22%20stroke%3D%22%231d8a44%22%20stroke-width%3D%222%22%2F%3E%3Cline%20x1%3D%22268.7%22%20y1%3D%22859.5%22%20x2%3D%22262.9%22%20y2%3D%22866.4%22%20stroke%3D%22%231d8a44%22%20stroke-width%3D%222%22%2F%3E%3Cline%20x1%3D%22220.5%22%20y1%3D%22811.3%22%20x2%3D%22213.6%22%20y2%3D%22817.1%22%20stroke%3D%22%231d8a44%22%20stroke-width%3D%222%22%2F%3E%3Cline%20x1%3D%22189.2%22%20y1%3D%22751.0%22%20x2%3D%22173.6%22%20y2%3D%22760.0%22%20stroke%3D%22%231d8a44%22%20stroke-width%3D%222%22%2F%3E%3Cline%20x1%3D%22152.6%22%20y1%3D%22693.7%22%20x2%3D%22144.1%22%20y2%3D%22696.8%22%20stroke%3D%22%231d8a44%22%20stroke-width%3D%222%22%2F%3E%3Cline%20x1%3D%22134.9%22%20y1%3D%22627.9%22%20x2%3D%22126.1%22%20y2%3D%22629.5%22%20stroke%3D%22%231d8a44%22%20stroke-width%3D%222%22%2F%3E%3Cline%20x1%3D%22138.0%22%20y1%3D%22560.0%22%20x2%3D%22120.0%22%20y2%3D%22560.0%22%20stroke%3D%22%231d8a44%22%20stroke-width%3D%222%22%2F%3E%3Ctext%20x%3D%2298.0%22%20y%3D%22565.0%22%20fill%3D%22%231d8a44%22%20font-family%3D%22Consolas%2C%20monospace%22%20font-size%3D%2216%22%20text-anchor%3D%22middle%22%3E270%3C%2Ftext%3E%3Cline%20x1%3D%22134.9%22%20y1%3D%22492.1%22%20x2%3D%22126.1%22%20y2%3D%22490.5%22%20stroke%3D%22%231d8a44%22%20stroke-width%3D%222%22%2F%3E%3Cline%20x1%3D%22152.6%22%20y1%3D%22426.3%22%20x2%3D%22144.1%22%20y2%3D%22423.2%22%20stroke%3D%22%231d8a44%22%20stroke-width%3D%222%22%2F%3E%3Cline%20x1%3D%22189.2%22%20y1%3D%22369.0%22%20x2%3D%22173.6%22%20y2%3D%22360.0%22%20stroke%3D%22%231d8a44%22%20stroke-width%3D%222%22%2F%3E%3Cline%20x1%3D%22220.5%22%20y1%3D%22308.7%22%20x2%3D%22213.6%22%20y2%3D%22302.9%22%20stroke%3D%22%231d8a44%22%20stroke-width%3D%222%22%2F%3E%3Cline%20x1%3D%22268.7%22%20y1%3D%22260.5%22%20x2%3D%22262.9%22%20y2%3D%22253.6%22%20stroke%3D%22%231d8a44%22%20stroke-width%3D%222%22%2F%3E%3Cline%20x1%3D%22329.0%22%20y1%3D%22229.2%22%20x2%3D%22320.0%22%20y2%3D%22213.6%22%20stroke%3D%22%231d8a44%22%20stroke-width%3D%222%22%2F%3E%3Cline%20x1%3D%22386.3%22%20y1%3D%22192.6%22%20x2%3D%22383.2%22%20y2%3D%22184.1%22%20stroke%3D%22%231d8a44%22%20stroke-width%3D%222%22%2F%3E%3Cline%20x1%3D%22452.1%22%20y1%3D%22174.9%22%20x2%3D%22450.5%22%20y2%3D%22166.1%22%20stroke%3D%22%231d8a44%22%20stroke-width%3D%222%22%2F%3E%0A%3Ccircle%20cx%3D%22520%22%20cy%3D%22560%22%20r%3D%227%22%20fill%3D%22%2339ff7a%22%2F%3E%0A%3Ctext%20x%3D%22520%22%20y%3D%22590%22%20fill%3D%22%2339ff7a%22%20font-family%3D%22Consolas%2C%20monospace%22%20font-size%3D%2215%22%20text-anchor%3D%22middle%22%3EHARBOR%3C%2Ftext%3E%0A%3Crect%20x%3D%221010%22%20y%3D%2280%22%20width%3D%22550%22%20height%3D%22900%22%20rx%3D%2216%22%20fill%3D%22%23101512%22%20stroke%3D%22%232a332c%22%20stroke-width%3D%223%22%2F%3E%0A%3C%2Fsvg%3E",
    "place": {
      "banner": [
        90,
        88,
        900,
        44
      ],
      "boat-v1": [
        676,
        320,
        200,
        60
      ],
      "boat-v2": [
        586,
        445,
        200,
        60
      ],
      "boat-v3": [
        276,
        265,
        200,
        60
      ],
      "boat-v4": [
        726,
        530,
        200,
        60
      ],
      "boat-v5": [
        371,
        190,
        200,
        60
      ],
      "boat-v6": [
        216,
        460,
        200,
        60
      ],
      "boat-v7": [
        786,
        400,
        200,
        60
      ],
      "roster": [
        1030,
        100,
        510,
        470
      ],
      "waves": [
        1030,
        600,
        510,
        360
      ]
    }
  }
};

export const harborRadar: SamplePack = {
  id: "harbor-radar",
  title: {
    "ko": "어항 야간 출입항 관제 — 녹색 인광 레이더",
    "en": "A fishing harbour’s night watch — a green-phosphor radar scope"
  },
  field: {
    "ko": "어항·어선 안전",
    "en": "Fishing harbours and vessel safety"
  },
  kind: {
    "ko": "선박 위치와 상태",
    "en": "Vessel positions and states"
  },
  domain: "agrifood",
  styles: [
    "retro"
  ],
  summary: {
    "ko": "어항의 야간 관제를 녹색 인광 레이더 화면으로 — 거리 고리·방위 눈금·지나가는 빛줄기와 해안선 위에, 오늘 밤 나간 배마다 지금 자리에 놓인 점 하나: 호출부호·속력·상태가 표지 모양과 낱말로 — ● 조업 중, ▶ 항해 중, ▲ 금지구역 가까움(호박색), ✕ 위치 보고 끊김(흐리게). 오른쪽에 출어 선박 명단과 근해 파고·풍랑주의보 기준. 어항과 어선은 지어낸 것이라 예시 데이터입니다.",
    "en": "A fishing harbour’s night watch on an old green-phosphor radar scope — over the range rings, bearing ticks, the sweep and the coast, a blip placed where it is for every boat out tonight: its call sign, speed and state in a mark and a word — ● fishing, ▶ under way, ▲ near a closed area (amber), ✕ its position reports stopped (dimmed). On the right the boats’ roster and the sea’s wave height against the advisory level. The harbour and its boats are made up. Example data."
  },
  connectors: [
    {
      "key": "watch",
      "name": "예시 어항 출입항 관제 API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 어항·어선이 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
