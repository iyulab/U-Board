// An aquarium's life support set out as a natural history cabinet: a dark wood case lined with green felt, every tank a
// specimen label pinned to it — cream card, a double rule, the catalogue number typewritten, the tank's name in serif,
// the species in italic Latin, the water's readings set against dotted leaders. A tank's state is told the way a curator
// marks a card, as well as by a colour: a ring for sound, a triangle on a yellow tag to watch, a cross on a red ribbon
// across the corner when something is wrong. Below, the feeding rounds on a long label; on the right a brass plaque with
// the aquarium's name, the figures now, the key and the visitors coming in through the day on a card. The aquarium is made
// up, so the values are example data.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/aquarium-labels.js';

const board: Board = {
  "board": {
    "theme": "light",
    "accent": "#b3261e"
  },
  "elements": {
    "tank": {
      "template": "<article class=\"lb {{t.state}}\"><header><span>{{t.no}}</span><i></i></header><h2>{{t.name}}</h2><p>{{t.latin}}</p><dl><dt>수온</dt><dd><span>{{t.temp}}</span></dd><dt>pH</dt><dd><span>{{t.ph}}</span></dd><dt>용존 산소</dt><dd><span>{{t.oxygen}}</span></dd></dl><small>{{t.note}}</small></article>",
      "style": ".lb{position:relative;height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto auto auto 1fr auto;padding:16px 20px 12px;background:#f6f0dc;box-shadow:inset 0 0 0 5px #f6f0dc,inset 0 0 0 6px #2a2622,inset 0 0 0 8px #f6f0dc,inset 0 0 0 9px #2a2622,2px 4px 0 rgba(0,0,0,.35);font-family:\"Noto Serif KR\", \"Batang\", \"Georgia\", serif;color:#2a2622;overflow:hidden}\nheader{display:flex;justify-content:space-between;align-items:center;font:700 14px \"Courier New\", \"Nanum Gothic Coding\", monospace;letter-spacing:.08em}\ni{width:22px;height:22px;display:grid;place-items:center;font:700 15px \"Noto Serif KR\", \"Batang\", \"Georgia\", serif;font-style:normal;box-sizing:border-box}\nh2{margin:2px 0 0;font-size:21px;font-weight:700}\np{margin:0;font-size:15px;font-style:italic}\ndl{margin:6px 0 0;display:grid;grid-template-columns:auto 1fr;column-gap:8px;row-gap:1px;font-size:14px;align-content:start}\ndd{margin:0;text-align:right;font:700 14px \"Courier New\", \"Nanum Gothic Coding\", monospace;background:radial-gradient(circle,#2a2622 .8px,transparent 1px) 0 72%/6px 6px repeat-x;padding-left:30px}\ndd span{background:#f6f0dc;padding-left:6px}\nsmall{font-size:13px;font-style:italic;border-top:1px solid #2a2622;padding-top:4px}\n.ok i{border:2px solid #2a2622;border-radius:50%}\n.watch i{background:#e8c547;clip-path:polygon(50% 6%,96% 94%,4% 94%);padding-top:5px;font-size:12px}\n.watch i::after{content:\"!\"}\n.watch small{background:#e8c547;padding:3px 6px;border-top:none;font-style:normal;font-weight:700}\n.alarm::after{content:\"✕ 경보\";position:absolute;top:16px;right:-34px;width:130px;padding:3px 0;text-align:center;transform:rotate(45deg);background:#b3261e;color:#f6f0dc;font:700 13px \"Noto Serif KR\", \"Batang\", \"Georgia\", serif;letter-spacing:.2em}\n.alarm i{visibility:hidden}\n.alarm small{color:#b3261e;font-style:normal;font-weight:700}",
      "props": {
        "t": "object"
      }
    },
    "feeding": {
      "template": "<section class=\"fd\"><h2>먹이 주기 — 오늘</h2><ol>{{#items}}<li class=\"{{state}}\"><b>{{time}}</b><span>{{tank}}</span><em>{{what}}</em><small>{{word}}</small></li>{{/items}}</ol></section>",
      "style": ".fd{height:100%;box-sizing:border-box;padding:16px 24px;background:#f6f0dc;box-shadow:inset 0 0 0 5px #f6f0dc,inset 0 0 0 6px #2a2622,inset 0 0 0 8px #f6f0dc,inset 0 0 0 9px #2a2622,2px 4px 0 rgba(0,0,0,.35);font-family:\"Noto Serif KR\", \"Batang\", \"Georgia\", serif;color:#2a2622}\nh2{margin:0 0 4px;font-size:19px;font-weight:700;border-bottom:1px solid #2a2622;padding-bottom:4px}\nol{margin:0;padding:0;list-style:none;display:grid;gap:2px}\nli{display:grid;grid-template-columns:70px 170px 1fr 110px;align-items:baseline;gap:12px;font-size:16px;padding:3px 0;border-bottom:1px dotted #2a2622}\nb{font:700 16px \"Courier New\", \"Nanum Gothic Coding\", monospace}\nem{font-size:15px}\nsmall{font-size:14px;text-align:right}\n.done{opacity:.65}\n.done small::before{content:\"✓ \"}\n.next small{font-weight:700}\n.next small::before{content:\"○ \"}\n.held small{color:#b3261e;font-weight:700}\n.held small::before{content:\"✕ \"}",
      "props": {
        "items": "list"
      }
    },
    "plaque": {
      "template": "<header class=\"pq\"><small>{{p.series}}</small><h1>{{p.name}}</h1><div><span>{{p.date}}</span><b>{{p.time}}</b></div></header>",
      "style": ".pq{height:100%;box-sizing:border-box;display:grid;align-content:center;justify-items:center;gap:6px;padding:14px;border-radius:6px;background:linear-gradient(160deg,#e3c574,#c9a24a 45%,#9c7a2e);box-shadow:inset 0 0 0 3px #7a5c1c,inset 0 0 0 6px #e9d08c,0 4px 0 rgba(0,0,0,.4);font-family:\"Noto Serif KR\", \"Batang\", \"Georgia\", serif;color:#2e2107;text-align:center}\nsmall{font-size:13px;letter-spacing:.35em}\nh1{margin:0;font-size:36px;font-weight:700;letter-spacing:.1em}\ndiv{display:flex;gap:16px;align-items:baseline}\nspan{font-size:16px}\nb{font:700 28px \"Courier New\", \"Nanum Gothic Coding\", monospace}",
      "props": {
        "p": "object"
      }
    },
    "figures": {
      "template": "<dl class=\"fg\">{{#items}}<div><dt>{{label}}</dt><dd>{{value}}</dd><small>{{note}}</small></div>{{/items}}</dl>",
      "style": ".fg{margin:0;height:100%;box-sizing:border-box;display:grid;grid-template-columns:repeat(3,1fr);gap:14px;font-family:\"Noto Serif KR\", \"Batang\", \"Georgia\", serif;color:#2a2622}\ndiv{display:grid;align-content:center;justify-items:center;text-align:center;background:#f6f0dc;box-shadow:inset 0 0 0 5px #f6f0dc,inset 0 0 0 6px #2a2622,inset 0 0 0 8px #f6f0dc,inset 0 0 0 9px #2a2622,2px 4px 0 rgba(0,0,0,.35)}\ndt{font-size:14px;font-style:italic}\ndd{margin:0;font-size:30px;font-weight:700}\nsmall{font-size:12px}",
      "props": {
        "items": "list"
      }
    },
    "legend": {
      "template": "<ul class=\"lg\"><li><i class=\"ok\"></i>양호</li><li><i class=\"watch\">!</i>주의 — 노란 쪽지</li><li><i class=\"alarm\">✕</i>경보 — 붉은 띠</li></ul>",
      "style": ".lg{height:100%;box-sizing:border-box;margin:0;padding:0 18px;list-style:none;display:flex;align-items:center;justify-content:space-between;background:#f6f0dc;box-shadow:inset 0 0 0 5px #f6f0dc,inset 0 0 0 6px #2a2622,inset 0 0 0 8px #f6f0dc,inset 0 0 0 9px #2a2622,2px 4px 0 rgba(0,0,0,.35);font:15px \"Noto Serif KR\", \"Batang\", \"Georgia\", serif;color:#2a2622}\nli{display:flex;align-items:center;gap:8px}\ni{width:20px;height:20px;box-sizing:border-box;display:grid;place-items:center;font-style:normal;font-weight:700}\n.ok{border:2px solid #2a2622;border-radius:50%}\n.watch{background:#e8c547;clip-path:polygon(50% 6%,96% 94%,4% 94%);padding-top:5px;font-size:11px}\n.alarm{color:#b3261e;font-size:18px}"
    }
  },
  "data": {
    "tanks": {
      "from": "aquarium",
      "path": "/aquarium/tanks",
      "time": "updatedAt",
      "fresh": 900,
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
        },
        "t7": {
          "at": "/value/t7"
        },
        "t8": {
          "at": "/value/t8"
        },
        "t9": {
          "at": "/value/t9"
        }
      }
    },
    "feeding": {
      "from": "aquarium",
      "path": "/aquarium/feeding",
      "time": "updatedAt",
      "fresh": 900,
      "fields": {
        "value": {}
      }
    },
    "now": {
      "from": "aquarium",
      "path": "/aquarium/now",
      "time": "updatedAt",
      "fresh": 900,
      "fields": {
        "value": {}
      }
    },
    "figures": {
      "from": "aquarium",
      "path": "/aquarium/figures",
      "time": "updatedAt",
      "fresh": 900,
      "fields": {
        "value": {}
      }
    },
    "visitors": {
      "from": "aquarium",
      "path": "/aquarium/visitors",
      "list": "/value",
      "fresh": 900,
      "answerTime": "/updatedAt"
    }
  },
  "parts": {
    "tank-t1": {
      "as": "element",
      "element": "tank",
      "of": "tanks",
      "bind": {
        "t": "t1"
      }
    },
    "tank-t2": {
      "as": "element",
      "element": "tank",
      "of": "tanks",
      "bind": {
        "t": "t2"
      }
    },
    "tank-t3": {
      "as": "element",
      "element": "tank",
      "of": "tanks",
      "bind": {
        "t": "t3"
      }
    },
    "tank-t4": {
      "as": "element",
      "element": "tank",
      "of": "tanks",
      "bind": {
        "t": "t4"
      }
    },
    "tank-t5": {
      "as": "element",
      "element": "tank",
      "of": "tanks",
      "bind": {
        "t": "t5"
      }
    },
    "tank-t6": {
      "as": "element",
      "element": "tank",
      "of": "tanks",
      "bind": {
        "t": "t6"
      }
    },
    "tank-t7": {
      "as": "element",
      "element": "tank",
      "of": "tanks",
      "bind": {
        "t": "t7"
      }
    },
    "tank-t8": {
      "as": "element",
      "element": "tank",
      "of": "tanks",
      "bind": {
        "t": "t8"
      }
    },
    "tank-t9": {
      "as": "element",
      "element": "tank",
      "of": "tanks",
      "bind": {
        "t": "t9"
      }
    },
    "feeding": {
      "as": "element",
      "element": "feeding",
      "of": "feeding",
      "bind": {
        "items": "value"
      }
    },
    "plaque": {
      "as": "element",
      "element": "plaque",
      "of": "now",
      "bind": {
        "p": "value"
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
    "visitors": {
      "as": "chart.bar",
      "of": "visitors",
      "title": "시간별 입장(명) — 15시는 30분까지",
      "x": "hour",
      "y": "visitors",
      "series": [
        {
          "label": "입장",
          "color": "#3d6b58"
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
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221600%22%20height%3D%221000%22%20viewBox%3D%220%200%201600%201000%22%3E%0A%3Crect%20width%3D%221600%22%20height%3D%221000%22%20fill%3D%22%234a2f1d%22%2F%3E%0A%3Crect%20x%3D%2218%22%20y%3D%2218%22%20width%3D%22984%22%20height%3D%22964%22%20fill%3D%22%2327463a%22%2F%3E%0A%3Crect%20x%3D%2218%22%20y%3D%2218%22%20width%3D%22984%22%20height%3D%22964%22%20fill%3D%22none%22%20stroke%3D%22%232d1c11%22%20stroke-width%3D%226%22%2F%3E%0A%3Crect%20x%3D%221018%22%20y%3D%2218%22%20width%3D%22564%22%20height%3D%22964%22%20fill%3D%22%233a2416%22%2F%3E%0A%3Crect%20x%3D%221030%22%20y%3D%22470%22%20width%3D%22540%22%20height%3D%22490%22%20fill%3D%22%23f6f0dc%22%20stroke%3D%22%232a2622%22%2F%3E%0A%3Crect%20x%3D%221036%22%20y%3D%22476%22%20width%3D%22528%22%20height%3D%22478%22%20fill%3D%22none%22%20stroke%3D%22%232a2622%22%20stroke-width%3D%22.8%22%2F%3E%0A%3Cline%20x1%3D%2218%22%20y1%3D%22728%22%20x2%3D%221002%22%20y2%3D%22728%22%20stroke%3D%22%231d362c%22%20stroke-width%3D%222%22%2F%3E%0A%3Ccircle%20cx%3D%22200%22%20cy%3D%2258%22%20r%3D%225%22%20fill%3D%22%23d9d4c7%22%2F%3E%3Ccircle%20cx%3D%22198.5%22%20cy%3D%2256.5%22%20r%3D%221.6%22%20fill%3D%22%23ffffff%22%2F%3E%3Ccircle%20cx%3D%22520%22%20cy%3D%2258%22%20r%3D%225%22%20fill%3D%22%23d9d4c7%22%2F%3E%3Ccircle%20cx%3D%22518.5%22%20cy%3D%2256.5%22%20r%3D%221.6%22%20fill%3D%22%23ffffff%22%2F%3E%3Ccircle%20cx%3D%22840%22%20cy%3D%2258%22%20r%3D%225%22%20fill%3D%22%23d9d4c7%22%2F%3E%3Ccircle%20cx%3D%22838.5%22%20cy%3D%2256.5%22%20r%3D%221.6%22%20fill%3D%22%23ffffff%22%2F%3E%3Ccircle%20cx%3D%22200%22%20cy%3D%22284%22%20r%3D%225%22%20fill%3D%22%23d9d4c7%22%2F%3E%3Ccircle%20cx%3D%22198.5%22%20cy%3D%22282.5%22%20r%3D%221.6%22%20fill%3D%22%23ffffff%22%2F%3E%3Ccircle%20cx%3D%22520%22%20cy%3D%22284%22%20r%3D%225%22%20fill%3D%22%23d9d4c7%22%2F%3E%3Ccircle%20cx%3D%22518.5%22%20cy%3D%22282.5%22%20r%3D%221.6%22%20fill%3D%22%23ffffff%22%2F%3E%3Ccircle%20cx%3D%22840%22%20cy%3D%22284%22%20r%3D%225%22%20fill%3D%22%23d9d4c7%22%2F%3E%3Ccircle%20cx%3D%22838.5%22%20cy%3D%22282.5%22%20r%3D%221.6%22%20fill%3D%22%23ffffff%22%2F%3E%3Ccircle%20cx%3D%22200%22%20cy%3D%22510%22%20r%3D%225%22%20fill%3D%22%23d9d4c7%22%2F%3E%3Ccircle%20cx%3D%22198.5%22%20cy%3D%22508.5%22%20r%3D%221.6%22%20fill%3D%22%23ffffff%22%2F%3E%3Ccircle%20cx%3D%22520%22%20cy%3D%22510%22%20r%3D%225%22%20fill%3D%22%23d9d4c7%22%2F%3E%3Ccircle%20cx%3D%22518.5%22%20cy%3D%22508.5%22%20r%3D%221.6%22%20fill%3D%22%23ffffff%22%2F%3E%3Ccircle%20cx%3D%22840%22%20cy%3D%22510%22%20r%3D%225%22%20fill%3D%22%23d9d4c7%22%2F%3E%3Ccircle%20cx%3D%22838.5%22%20cy%3D%22508.5%22%20r%3D%221.6%22%20fill%3D%22%23ffffff%22%2F%3E%0A%3C%2Fsvg%3E",
    "place": {
      "tank-t1": [
        50,
        60,
        300,
        206
      ],
      "tank-t2": [
        370,
        60,
        300,
        206
      ],
      "tank-t3": [
        690,
        60,
        300,
        206
      ],
      "tank-t4": [
        50,
        286,
        300,
        206
      ],
      "tank-t5": [
        370,
        286,
        300,
        206
      ],
      "tank-t6": [
        690,
        286,
        300,
        206
      ],
      "tank-t7": [
        50,
        512,
        300,
        206
      ],
      "tank-t8": [
        370,
        512,
        300,
        206
      ],
      "tank-t9": [
        690,
        512,
        300,
        206
      ],
      "feeding": [
        50,
        738,
        940,
        234
      ],
      "plaque": [
        1030,
        40,
        540,
        170
      ],
      "figures": [
        1030,
        230,
        540,
        120
      ],
      "legend": [
        1030,
        380,
        540,
        50
      ],
      "visitors": [
        1050,
        490,
        500,
        450
      ]
    }
  }
};

export const aquariumLabels: SamplePack = {
  id: "aquarium-labels",
  title: {
    "ko": "수족관 생명유지 — 박물관 표본 라벨",
    "en": "An aquarium’s life support — museum specimen labels"
  },
  field: {
    "ko": "수족관·동물 관리",
    "en": "Aquariums & animal care"
  },
  kind: {
    "ko": "수조 수질·먹이 주기·입장객",
    "en": "Tank water, feeding rounds and visitors"
  },
  domain: "leisure",
  styles: [
    "print"
  ],
  summary: {
    "ko": "수족관의 생명유지를 자연사 박물관 표본장처럼 — 초록 펠트를 댄 짙은 나무 장에 수조마다 표본 라벨이 핀으로 꽂힙니다. 크림색 카드에 가는 이중 테, 타자기 글씨 목록 번호, 바른 글자 수조 이름, 기울인 라틴어 학명, 점선 지시선 옆 수온·pH·용존 산소. 수조 상태는 색과 함께 큐레이터의 표시로: 원 양호, 노란 쪽지의 세모 주의, 모서리를 가로지르는 붉은 띠와 ✕ 경보. 아래에는 먹이 주기를 긴 라벨로, 오른쪽에 놋쇠 명판, 지금 수치, 범례, 시간별 입장. 수족관은 지어낸 것이라 예시 데이터입니다.",
    "en": "An aquarium’s life support set out as a natural history cabinet — a dark wood case lined with green felt, every tank a specimen label pinned to it: cream card with a fine double rule, the catalogue number typewritten, the tank’s name in serif, the species in italic Latin, the water’s readings against dotted leaders. A tank tells its state the way a curator marks a card, as well as by colour — a ring sound, a triangle on a yellow tag to watch, a red ribbon across the corner with a cross when something is wrong. Below, the feeding rounds on a long label; on the right a brass plaque, the figures now, the key and the visitors by the hour. The aquarium is made up. Example data."
  },
  connectors: [
    {
      "key": "aquarium",
      "name": "예시 수족관 API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 수족관이 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
