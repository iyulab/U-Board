// A bank branch's floor drawn in a Scandinavian minimal style: an off-white floor, pale birch for the counters and
// the lounge furniture, soft greys for the walls, one sage green and one dusty blue, and a single warm terracotta kept
// for what needs a hand. Thin lines, rounded corners and wide margins; a few plants. Every place a customer can be
// served — six teller windows, three consultation rooms, four cash machines — is a card saying what it does now, its
// state told by a mark as well as a colour: a full dot serving or working, a half dot away or running low, a ring free
// or out, a dash not open yet. On the right the waiting line by service, the morning's figures and the visitors by the
// hour. The branch is made up, so the values are example data.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/bank-branch.js';

const board: Board = {
  "board": {
    "theme": "light",
    "accent": "#7f9e8c"
  },
  "elements": {
    "place": {
      "template": "<section class=\"pl {{p.state}}\"><header><b>{{p.name}}</b>{{#p.task}}<span>{{p.task}}</span>{{/p.task}}</header><p><i>{{p.mark}}</i>{{p.word}}</p><small>{{p.note}}</small></section>",
      "style": ".pl{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr auto;gap:4px;padding:12px 14px;background:#fff;border:1.5px solid #d9d6cf;border-radius:14px;font-family:\"Inter\", \"Pretendard\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif;color:#2f3437;box-shadow:0 1px 0 rgba(0,0,0,.03)}\nheader{display:flex;justify-content:space-between;align-items:baseline;gap:6px}\nb{font-size:15px;font-weight:600}\nspan{font-size:12px;color:#7b7f80;padding:1px 8px;border-radius:999px;background:#f6f4ef}\np{margin:0;display:flex;align-items:center;gap:8px;font-size:16px;font-weight:600}\nsmall{font-size:12px;color:#7b7f80}\ni{font-style:normal;font-size:20px;line-height:1}\n.busy i,.ok i{color:#7f9e8c}\n.away i,.low i{color:#c4694a}\n.free i{color:#7b95ab}\n.off i,.closed i{color:#7b7f80}\n.away{border-color:#c4694a}\n.low{border-color:#c4694a}\n.closed,.off{background:#f6f4ef;color:#7b7f80;border-style:dashed}",
      "props": {
        "p": "object"
      }
    },
    "ticket": {
      "template": "<div class=\"tk\"><b>번호표</b><span>업무를 고르세요</span></div>",
      "style": ".tk{height:100%;box-sizing:border-box;display:grid;place-content:center;text-align:center;gap:2px;background:#2f3437;color:#f6f4ef;border-radius:14px;font-family:\"Inter\", \"Pretendard\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif}\nb{font-size:16px;font-weight:700}\nspan{font-size:11px;opacity:.8}"
    },
    "legend": {
      "template": "<ul class=\"lg\"><li class=\"busy\"><i>●</i>응대·사용 중</li><li class=\"away\"><i>◐</i>자리 비움·부족</li><li class=\"free\"><i>○</i>비어 있음</li><li class=\"closed\"><i>–</i>점검·운영 전</li></ul>",
      "style": ".lg{height:100%;box-sizing:border-box;margin:0;padding:0;list-style:none;display:flex;align-items:center;gap:16px;font:13px \"Inter\", \"Pretendard\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif;color:#2f3437}\nli{display:flex;align-items:center;gap:5px}\ni{font-style:normal;font-size:20px;line-height:1}\n.busy i,.ok i{color:#7f9e8c}\n.away i,.low i{color:#c4694a}\n.free i{color:#7b95ab}\n.off i,.closed i{color:#7b7f80}\ni{font-size:16px}"
    },
    "title": {
      "template": "<header class=\"tt\"><h1>{{name}}</h1><p>{{sub}}</p><div><span>{{date}}</span><b>{{time}}</b></div></header>",
      "style": ".tt{height:100%;box-sizing:border-box;display:grid;align-content:center;gap:8px;font-family:\"Inter\", \"Pretendard\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif;color:#2f3437}\nh1{margin:0;font-size:30px;font-weight:600;letter-spacing:-.01em}\np{margin:0;font-size:15px;color:#7b7f80}\ndiv{display:flex;align-items:baseline;gap:14px;padding-top:10px;border-top:1.5px solid #d9d6cf}\nspan{font-size:16px}\nb{margin-left:auto;font-size:40px;font-weight:300;color:#2f3437}",
      "props": {
        "name": "string",
        "sub": "string",
        "date": "string",
        "time": "string"
      }
    },
    "queue": {
      "template": "<section class=\"qu\"><h3><span>업무</span><span>대기</span><span>예상</span><span>지금 번호</span></h3><ul>{{#items}}<li><b>{{task}}</b><span>{{waiting}}</span><span>{{wait}}</span><strong>{{now}}</strong></li>{{/items}}</ul></section>",
      "style": ".qu{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr;font-family:\"Inter\", \"Pretendard\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif;color:#2f3437}\nh3,li{display:grid;grid-template-columns:1.1fr .8fr 1fr 1fr;align-items:center;gap:8px}\nh3{margin:0;padding:0 4px 8px;font-size:12px;font-weight:500;color:#7b7f80;letter-spacing:.06em;border-bottom:1.5px solid #d9d6cf}\nul{margin:0;padding:0;list-style:none;display:grid;align-content:start}\nli{padding:8px 4px;border-bottom:1px solid #d9d6cf;font-size:16px;line-height:1.3}\nb{font-weight:600}\nstrong{font-size:20px;font-weight:300;line-height:1.2;font-variant-numeric:tabular-nums}",
      "props": {
        "items": "list"
      }
    },
    "figures": {
      "template": "<dl class=\"fg\">{{#items}}<div><dt>{{label}}</dt><dd>{{value}}</dd><small>{{note}}</small></div>{{/items}}</dl>",
      "style": ".fg{margin:0;height:100%;box-sizing:border-box;display:grid;grid-template-columns:repeat(3,1fr);gap:10px;font-family:\"Inter\", \"Pretendard\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif;color:#2f3437}\ndiv{display:grid;align-content:center;padding:10px 14px;background:#fff;border:1.5px solid #d9d6cf;border-radius:14px}\ndt{font-size:12px;color:#7b7f80}\ndd{margin:2px 0;font-size:28px;font-weight:300}\nsmall{font-size:11px;color:#7b7f80}",
      "props": {
        "items": "list"
      }
    }
  },
  "data": {
    "desks": {
      "from": "bank",
      "path": "/branch/desks",
      "time": "updatedAt",
      "fresh": 600,
      "fields": {
        "d1": {
          "at": "/value/d1"
        },
        "d2": {
          "at": "/value/d2"
        },
        "d3": {
          "at": "/value/d3"
        },
        "d4": {
          "at": "/value/d4"
        },
        "d5": {
          "at": "/value/d5"
        },
        "d6": {
          "at": "/value/d6"
        }
      }
    },
    "rooms": {
      "from": "bank",
      "path": "/branch/rooms",
      "time": "updatedAt",
      "fresh": 600,
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
    },
    "atms": {
      "from": "bank",
      "path": "/branch/atms",
      "time": "updatedAt",
      "fresh": 600,
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
        }
      }
    },
    "now": {
      "from": "bank",
      "path": "/branch/now",
      "time": "updatedAt",
      "fresh": 600,
      "fields": {
        "name": {},
        "sub": {},
        "date": {},
        "time": {}
      }
    },
    "queue": {
      "from": "bank",
      "path": "/branch/queue",
      "time": "updatedAt",
      "fresh": 600,
      "fields": {
        "value": {}
      }
    },
    "figures": {
      "from": "bank",
      "path": "/branch/figures",
      "time": "updatedAt",
      "fresh": 600,
      "fields": {
        "value": {}
      }
    },
    "visitors": {
      "from": "bank",
      "path": "/branch/visitors",
      "list": "/value",
      "fresh": 600,
      "answerTime": "/updatedAt"
    }
  },
  "parts": {
    "desk-d1": {
      "as": "element",
      "element": "place",
      "of": "desks",
      "bind": {
        "p": "d1"
      }
    },
    "desk-d2": {
      "as": "element",
      "element": "place",
      "of": "desks",
      "bind": {
        "p": "d2"
      }
    },
    "desk-d3": {
      "as": "element",
      "element": "place",
      "of": "desks",
      "bind": {
        "p": "d3"
      }
    },
    "desk-d4": {
      "as": "element",
      "element": "place",
      "of": "desks",
      "bind": {
        "p": "d4"
      }
    },
    "desk-d5": {
      "as": "element",
      "element": "place",
      "of": "desks",
      "bind": {
        "p": "d5"
      }
    },
    "desk-d6": {
      "as": "element",
      "element": "place",
      "of": "desks",
      "bind": {
        "p": "d6"
      }
    },
    "room-r1": {
      "as": "element",
      "element": "place",
      "of": "rooms",
      "bind": {
        "p": "r1"
      }
    },
    "room-r2": {
      "as": "element",
      "element": "place",
      "of": "rooms",
      "bind": {
        "p": "r2"
      }
    },
    "room-r3": {
      "as": "element",
      "element": "place",
      "of": "rooms",
      "bind": {
        "p": "r3"
      }
    },
    "atm-a1": {
      "as": "element",
      "element": "place",
      "of": "atms",
      "bind": {
        "p": "a1"
      }
    },
    "atm-a2": {
      "as": "element",
      "element": "place",
      "of": "atms",
      "bind": {
        "p": "a2"
      }
    },
    "atm-a3": {
      "as": "element",
      "element": "place",
      "of": "atms",
      "bind": {
        "p": "a3"
      }
    },
    "atm-a4": {
      "as": "element",
      "element": "place",
      "of": "atms",
      "bind": {
        "p": "a4"
      }
    },
    "ticket": {
      "as": "element",
      "element": "ticket"
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
    "queue": {
      "as": "element",
      "element": "queue",
      "of": "queue",
      "bind": {
        "items": "value"
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
    "visitors": {
      "as": "chart.bar",
      "of": "visitors",
      "title": "시간대별 내점 고객(명)",
      "x": "hour",
      "y": "people",
      "series": [
        {
          "label": "고객",
          "color": "#7f9e8c"
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
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221600%22%20height%3D%221000%22%20viewBox%3D%220%200%201600%201000%22%3E%0A%3Crect%20width%3D%221600%22%20height%3D%221000%22%20fill%3D%22%23f6f4ef%22%2F%3E%0A%3Crect%20x%3D%2240%22%20y%3D%2240%22%20width%3D%221040%22%20height%3D%22920%22%20rx%3D%2222%22%20fill%3D%22%23fbfaf7%22%20stroke%3D%22%23d9d6cf%22%20stroke-width%3D%2210%22%2F%3E%0A%3Crect%20x%3D%2256%22%20y%3D%22212%22%20width%3D%221008%22%20height%3D%2220%22%20rx%3D%2210%22%20fill%3D%22%23e4d3b4%22%2F%3E%0A%3Ctext%20x%3D%2264%22%20y%3D%2270%22%20fill%3D%22%237b7f80%22%20font-size%3D%2215%22%20font-family%3D'%22Inter%22%2C%20%22Pretendard%22%2C%20%22Noto%20Sans%20KR%22%2C%20%22Malgun%20Gothic%22%2C%20sans-serif'%20letter-spacing%3D%22.12em%22%3E%EC%B0%BD%EA%B5%AC%3C%2Ftext%3E%0A%3Crect%20x%3D%22760%22%20y%3D%22610%22%20width%3D%22304%22%20height%3D%22334%22%20rx%3D%2216%22%20fill%3D%22%23eef1f3%22%20stroke%3D%22%23d9d6cf%22%20stroke-width%3D%224%22%2F%3E%0A%3Ctext%20x%3D%22780%22%20y%3D%22600%22%20fill%3D%22%237b7f80%22%20font-size%3D%2215%22%20font-family%3D'%22Inter%22%2C%20%22Pretendard%22%2C%20%22Noto%20Sans%20KR%22%2C%20%22Malgun%20Gothic%22%2C%20sans-serif'%20letter-spacing%3D%22.12em%22%3EATM%20%C2%B7%2024%EC%8B%9C%EA%B0%84%3C%2Ftext%3E%0A%3Ctext%20x%3D%2264%22%20y%3D%22652%22%20fill%3D%22%237b7f80%22%20font-size%3D%2215%22%20font-family%3D'%22Inter%22%2C%20%22Pretendard%22%2C%20%22Noto%20Sans%20KR%22%2C%20%22Malgun%20Gothic%22%2C%20sans-serif'%20letter-spacing%3D%22.12em%22%3E%EC%83%81%EB%8B%B4%EC%8B%A4%3C%2Ftext%3E%0A%3Cpath%20d%3D%22M%2056%20666%20H%20690%22%20stroke%3D%22%23d9d6cf%22%20stroke-width%3D%224%22%2F%3E%0A%3Crect%20x%3D%22250%22%20y%3D%22330%22%20width%3D%22440%22%20height%3D%22190%22%20rx%3D%2228%22%20fill%3D%22%23e4d3b4%22%20fill-opacity%3D%22.35%22%2F%3E%0A%3Crect%20x%3D%22280%22%20y%3D%22350%22%20width%3D%22180%22%20height%3D%2252%22%20rx%3D%2218%22%20fill%3D%22%23d9d6cf%22%2F%3E%3Crect%20x%3D%22288%22%20y%3D%22364%22%20width%3D%22164%22%20height%3D%2230%22%20rx%3D%2212%22%20fill%3D%22%23ecebe6%22%2F%3E%3Crect%20x%3D%22480%22%20y%3D%22350%22%20width%3D%22180%22%20height%3D%2252%22%20rx%3D%2218%22%20fill%3D%22%23d9d6cf%22%2F%3E%3Crect%20x%3D%22488%22%20y%3D%22364%22%20width%3D%22164%22%20height%3D%2230%22%20rx%3D%2212%22%20fill%3D%22%23ecebe6%22%2F%3E%3Crect%20x%3D%22280%22%20y%3D%22450%22%20width%3D%22180%22%20height%3D%2252%22%20rx%3D%2218%22%20fill%3D%22%23d9d6cf%22%2F%3E%3Crect%20x%3D%22288%22%20y%3D%22464%22%20width%3D%22164%22%20height%3D%2230%22%20rx%3D%2212%22%20fill%3D%22%23ecebe6%22%2F%3E%3Crect%20x%3D%22480%22%20y%3D%22450%22%20width%3D%22180%22%20height%3D%2252%22%20rx%3D%2218%22%20fill%3D%22%23d9d6cf%22%2F%3E%3Crect%20x%3D%22488%22%20y%3D%22464%22%20width%3D%22164%22%20height%3D%2230%22%20rx%3D%2212%22%20fill%3D%22%23ecebe6%22%2F%3E%0A%3Ctext%20x%3D%22470%22%20y%3D%22550%22%20text-anchor%3D%22middle%22%20fill%3D%22%237b7f80%22%20font-size%3D%2215%22%20font-family%3D'%22Inter%22%2C%20%22Pretendard%22%2C%20%22Noto%20Sans%20KR%22%2C%20%22Malgun%20Gothic%22%2C%20sans-serif'%20letter-spacing%3D%22.12em%22%3E%EB%8C%80%EA%B8%B0%20%EA%B3%B5%EA%B0%84%3C%2Ftext%3E%0A%3Ccircle%20cx%3D%22120%22%20cy%3D%22300%22%20r%3D%2230%22%20fill%3D%22%237f9e8c%22%20fill-opacity%3D%22.55%22%2F%3E%3Ccircle%20cx%3D%22108%22%20cy%3D%22291%22%20r%3D%2216.5%22%20fill%3D%22%237f9e8c%22%20fill-opacity%3D%22.7%22%2F%3E%3Ccircle%20cx%3D%22120%22%20cy%3D%22300%22%20r%3D%227.5%22%20fill%3D%22%23e4d3b4%22%2F%3E%3Ccircle%20cx%3D%22820%22%20cy%3D%22300%22%20r%3D%2226%22%20fill%3D%22%237f9e8c%22%20fill-opacity%3D%22.55%22%2F%3E%3Ccircle%20cx%3D%22809.6%22%20cy%3D%22292.2%22%20r%3D%2214.3%22%20fill%3D%22%237f9e8c%22%20fill-opacity%3D%22.7%22%2F%3E%3Ccircle%20cx%3D%22820%22%20cy%3D%22300%22%20r%3D%226.5%22%20fill%3D%22%23e4d3b4%22%2F%3E%3Ccircle%20cx%3D%221010%22%20cy%3D%22520%22%20r%3D%2232%22%20fill%3D%22%237f9e8c%22%20fill-opacity%3D%22.55%22%2F%3E%3Ccircle%20cx%3D%22997.2%22%20cy%3D%22510.4%22%20r%3D%2217.6%22%20fill%3D%22%237f9e8c%22%20fill-opacity%3D%22.7%22%2F%3E%3Ccircle%20cx%3D%221010%22%20cy%3D%22520%22%20r%3D%228%22%20fill%3D%22%23e4d3b4%22%2F%3E%3Ccircle%20cx%3D%22110%22%20cy%3D%22560%22%20r%3D%2222%22%20fill%3D%22%237f9e8c%22%20fill-opacity%3D%22.55%22%2F%3E%3Ccircle%20cx%3D%22101.2%22%20cy%3D%22553.4%22%20r%3D%2212.100000000000001%22%20fill%3D%22%237f9e8c%22%20fill-opacity%3D%22.7%22%2F%3E%3Ccircle%20cx%3D%22110%22%20cy%3D%22560%22%20r%3D%225.5%22%20fill%3D%22%23e4d3b4%22%2F%3E%0A%3Crect%20x%3D%22600%22%20y%3D%22944%22%20width%3D%22140%22%20height%3D%2222%22%20fill%3D%22%23f6f4ef%22%2F%3E%0A%3Cpath%20d%3D%22M%20600%20950%20q%2070%20-40%20140%200%22%20fill%3D%22none%22%20stroke%3D%22%23d9d6cf%22%20stroke-width%3D%223%22%20stroke-dasharray%3D%224%206%22%2F%3E%0A%3Ctext%20x%3D%22670%22%20y%3D%22990%22%20text-anchor%3D%22middle%22%20fill%3D%22%237b7f80%22%20font-size%3D%2215%22%20font-family%3D'%22Inter%22%2C%20%22Pretendard%22%2C%20%22Noto%20Sans%20KR%22%2C%20%22Malgun%20Gothic%22%2C%20sans-serif'%20letter-spacing%3D%22.12em%22%3E%EC%B6%9C%EC%9E%85%EA%B5%AC%3C%2Ftext%3E%0A%3C%2Fsvg%3E",
    "place": {
      "desk-d1": [
        70,
        88,
        150,
        112
      ],
      "desk-d2": [
        235,
        88,
        150,
        112
      ],
      "desk-d3": [
        400,
        88,
        150,
        112
      ],
      "desk-d4": [
        565,
        88,
        150,
        112
      ],
      "desk-d5": [
        730,
        88,
        150,
        112
      ],
      "desk-d6": [
        895,
        88,
        150,
        112
      ],
      "room-r1": [
        70,
        690,
        176,
        124
      ],
      "room-r2": [
        270,
        690,
        176,
        124
      ],
      "room-r3": [
        470,
        690,
        176,
        124
      ],
      "atm-a1": [
        784,
        640,
        132,
        112
      ],
      "atm-a2": [
        930,
        640,
        132,
        112
      ],
      "atm-a3": [
        784,
        780,
        132,
        112
      ],
      "atm-a4": [
        930,
        780,
        132,
        112
      ],
      "ticket": [
        610,
        850,
        120,
        70
      ],
      "legend": [
        260,
        254,
        440,
        28
      ],
      "title": [
        1120,
        40,
        460,
        170
      ],
      "queue": [
        1120,
        240,
        460,
        230
      ],
      "figures": [
        1120,
        490,
        460,
        100
      ],
      "visitors": [
        1120,
        620,
        460,
        340
      ]
    }
  }
};

export const bankBranch: SamplePack = {
  id: "bank-branch",
  title: {
    "ko": "은행 지점 창구 — 스칸디나비안 미니멀",
    "en": "A bank branch’s floor — Scandinavian minimal"
  },
  field: {
    "ko": "금융·은행",
    "en": "Banking & finance"
  },
  kind: {
    "ko": "지점 창구·상담실·ATM 현황",
    "en": "A branch’s windows, rooms and cash machines"
  },
  domain: "services",
  styles: [
    "minimal"
  ],
  summary: {
    "ko": "은행 지점의 객장 현황을 스칸디나비안 미니멀로 — 미색 바닥, 자작나무 빛 카운터와 소파, 부드러운 회색 벽, 세이지 초록과 탁한 파랑 한 가지씩, 손이 필요한 곳에만 쓰는 테라코타, 가는 선과 둥근 모서리, 넉넉한 여백과 화분 몇. 창구 여섯·상담실 셋·ATM 넷이 저마다 지금 무엇을 하는지 카드로 — 상태는 색과 함께 기호로: 꽉 찬 점 응대·사용 중, 반 점 자리 비움·현금 부족, 빈 원 비어 있음·점검, 줄표 운영 전. 오른쪽에 업무별 대기 인원·예상 시간·지금 번호, 오늘 내점·평균 대기·상담 예약, 시간대별 내점 고객. 지점은 지어낸 것이라 예시 데이터입니다.",
    "en": "A bank branch’s floor in a Scandinavian minimal style — an off-white floor, birch counters and sofas, soft grey walls, one sage green and one dusty blue, a terracotta kept for what needs a hand, thin lines, rounded corners, wide margins and a few plants. Six teller windows, three consultation rooms and four cash machines each say on a card what they are doing now, the state told by a mark as well as a colour: a full dot serving or working, a half dot away or low on cash, a ring free or out for service, a dash not open yet. On the right the waiting line by service with the expected wait and the number being served, the day’s visitors, the average wait and the appointments, and the visitors by the hour. The branch is made up. Example data."
  },
  connectors: [
    {
      "key": "bank",
      "name": "예시 지점 API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 은행 지점이 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
