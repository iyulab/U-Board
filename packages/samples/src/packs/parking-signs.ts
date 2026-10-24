// A public car park told the way a road tells a driver: on asphalt with its lane lines, under a gantry, every part is a
// road sign — a green guide sign with a white rim and bold sign lettering for the name and for each floor, a black
// variable-message panel with amber figures for the spaces free, blue information signs for the bays kept for electric
// cars, disabled drivers and small cars, and a white notice board. A floor's state is told by the shape of its sign, as
// road signs do, as well as by its colour — a blue square P free, a yellow triangle filling, a red ring full, an orange
// diamond closed. On the right the day's figures and how full the car park has been hour by hour. The car park is made
// up, so the values are example data.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/parking-signs.js';

const board: Board = {
  "board": {
    "theme": "dark",
    "accent": "#ffb81c"
  },
  "elements": {
    "title": {
      "template": "<header class=\"tt\"><b class=\"p\">P</b><div><h1>{{name}}</h1><p>{{en}}</p></div><aside><span>{{date}}</span><strong>{{time}}</strong></aside></header>",
      "style": ".tt{height:100%;box-sizing:border-box;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:22px;padding:0 30px;background:#00703c;border-radius:12px;box-shadow:inset 0 0 0 4px #00703c,inset 0 0 0 7px #ffffff,0 6px 0 rgba(0,0,0,.35);font-family:\"Hangil\", \"Noto Sans KR\", \"Malgun Gothic\", \"Arial\", sans-serif;color:#ffffff}\n.p{width:84px;height:84px;border-radius:8px;background:#0f4c9c;box-shadow:inset 0 0 0 4px #ffffff;display:grid;place-items:center;font-size:62px;font-weight:900}\nh1{margin:0;font-size:46px;font-weight:900;letter-spacing:.02em}\np{margin:0;font-size:22px;font-weight:700;opacity:.92}\naside{display:grid;justify-items:end}\nspan{font-size:20px;font-weight:700}\nstrong{font-size:44px;font-weight:900}",
      "props": {
        "name": "string",
        "en": "string",
        "date": "string",
        "time": "string"
      }
    },
    "vms": {
      "template": "<section class=\"vm\"><span>{{v.label}}</span><b>{{v.free}}</b><small>{{v.note}}</small></section>",
      "style": ".vm{height:100%;box-sizing:border-box;display:grid;grid-template-columns:auto auto;grid-template-rows:1fr auto;align-items:center;column-gap:22px;padding:14px 28px;background:#0b0b0b;border:6px solid #3d4146;border-radius:6px;font-family:\"Hangil\", \"Noto Sans KR\", \"Malgun Gothic\", \"Arial\", sans-serif;color:#ffb81c}\nspan{font-size:30px;font-weight:800}\nb{grid-row:span 2;justify-self:end;font-size:96px;font-weight:900;line-height:1;font-variant-numeric:tabular-nums}\nsmall{font-size:18px;font-weight:700;opacity:.85}",
      "props": {
        "v": "object"
      }
    },
    "floor": {
      "template": "<section class=\"fl {{f.state}}\"><b>{{f.name}}</b><i></i><span>{{f.word}}</span><strong>{{f.free}}</strong><small>{{f.note}}</small></section>",
      "style": ".fl{height:100%;box-sizing:border-box;display:grid;grid-template-columns:76px 56px 1fr auto 210px;align-items:center;gap:16px;padding:0 22px;background:#00703c;border-radius:12px;box-shadow:inset 0 0 0 4px #00703c,inset 0 0 0 7px #ffffff,0 6px 0 rgba(0,0,0,.35);font-family:\"Hangil\", \"Noto Sans KR\", \"Malgun Gothic\", \"Arial\", sans-serif;color:#ffffff}\nb{width:64px;height:52px;border-radius:26px;background:#ffffff;color:#00703c;display:grid;place-items:center;font-size:30px;font-weight:900}\ni{width:48px;height:48px;display:grid;place-items:center;font:900 26px \"Hangil\", \"Noto Sans KR\", \"Malgun Gothic\", \"Arial\", sans-serif;font-style:normal;box-sizing:border-box}\nspan{font-size:28px;font-weight:800}\nstrong{font-size:44px;font-weight:900;font-variant-numeric:tabular-nums}\nsmall{font-size:17px;font-weight:700;opacity:.92;text-align:right}\n.free i{background:#0f4c9c;border-radius:6px;box-shadow:inset 0 0 0 3px #ffffff;color:#ffffff}\n.free i::after{content:\"P\"}\n.busy i{background:#ffd100;clip-path:polygon(50% 4%,98% 94%,2% 94%);color:#111;padding-top:12px}\n.busy i::after{content:\"!\"}\n.full i{border-radius:50%;background:#ffffff;box-shadow:inset 0 0 0 7px #d7261e;color:#111;font-size:15px}\n.full i::after{content:\"만차\"}\n.full strong{color:#ffd3cf}\n.shut{background:#3f4448;box-shadow:inset 0 0 0 4px #3f4448,inset 0 0 0 7px #c8ccd0,0 6px 0 rgba(0,0,0,.35)}\n.shut b{color:#3f4448}\n.shut i{background:#f28c28;transform:rotate(45deg) scale(.78);border:3px solid #111}\n.shut i::after{content:\"\";}\n.shut strong{opacity:.6}",
      "props": {
        "f": "object"
      }
    },
    "notices": {
      "template": "<ul class=\"nt\">{{#items}}<li>{{text}}</li>{{/items}}</ul>",
      "style": ".nt{margin:0;height:100%;box-sizing:border-box;list-style:none;display:grid;align-content:center;gap:4px;padding:0 26px;background:#ffd100;border-radius:12px;box-shadow:inset 0 0 0 4px #ffd100,inset 0 0 0 7px #ffffff,0 6px 0 rgba(0,0,0,.35);box-shadow:inset 0 0 0 4px #ffd100,inset 0 0 0 7px #111,0 6px 0 rgba(0,0,0,.35);font:800 21px \"Hangil\", \"Noto Sans KR\", \"Malgun Gothic\", \"Arial\", sans-serif;color:#111}\nli::before{content:\"▶ \"}",
      "props": {
        "items": "list"
      }
    },
    "bays": {
      "template": "<ul class=\"by\">{{#items}}<li><i>{{mark}}</i><span>{{label}}</span><b>{{free}}</b><small>{{note}}</small></li>{{/items}}</ul>",
      "style": ".by{margin:0;padding:0;height:100%;box-sizing:border-box;list-style:none;display:grid;grid-template-columns:repeat(3,1fr);gap:14px;font-family:\"Hangil\", \"Noto Sans KR\", \"Malgun Gothic\", \"Arial\", sans-serif;color:#ffffff}\nli{display:grid;justify-items:center;align-content:center;gap:2px;text-align:center;background:#0f4c9c;border-radius:12px;box-shadow:inset 0 0 0 4px #0f4c9c,inset 0 0 0 7px #ffffff,0 6px 0 rgba(0,0,0,.35)}\ni{width:44px;height:44px;border-radius:50%;background:#ffffff;color:#0f4c9c;display:grid;place-items:center;font:900 24px \"Hangil\", \"Noto Sans KR\", \"Malgun Gothic\", \"Arial\", sans-serif;font-style:normal}\nspan{font-size:19px;font-weight:800}\nb{font-size:34px;font-weight:900}\nsmall{font-size:14px;font-weight:700;opacity:.9}",
      "props": {
        "items": "list"
      }
    },
    "figures": {
      "template": "<dl class=\"fg\">{{#items}}<div><dt>{{label}}</dt><dd>{{value}}</dd><small>{{note}}</small></div>{{/items}}</dl>",
      "style": ".fg{margin:0;height:100%;box-sizing:border-box;display:grid;grid-template-columns:repeat(3,1fr);padding:10px 8px;background:#ffffff;border-radius:12px;box-shadow:inset 0 0 0 4px #ffffff,inset 0 0 0 7px #ffffff,0 6px 0 rgba(0,0,0,.35);box-shadow:inset 0 0 0 4px #ffffff,inset 0 0 0 7px #111,0 6px 0 rgba(0,0,0,.35);font-family:\"Hangil\", \"Noto Sans KR\", \"Malgun Gothic\", \"Arial\", sans-serif;color:#111}\ndiv{display:grid;justify-items:center;align-content:center;text-align:center}\ndiv+div{border-left:2px solid #111}\ndt{font-size:17px;font-weight:800}\ndd{margin:0;font-size:34px;font-weight:900}\nsmall{font-size:14px;font-weight:700}",
      "props": {
        "items": "list"
      }
    },
    "legend": {
      "template": "<ul class=\"lg\"><li><i class=\"fr\">P</i>여유</li><li><i class=\"bs\">!</i>혼잡 — 15% 미만</li><li><i class=\"fu\"></i>만차</li><li><i class=\"sh\"></i>폐쇄</li></ul>",
      "style": ".lg{height:100%;box-sizing:border-box;margin:0;padding:0 18px;list-style:none;display:flex;align-items:center;justify-content:space-between;background:#111;border-radius:8px;font:800 17px \"Hangil\", \"Noto Sans KR\", \"Malgun Gothic\", \"Arial\", sans-serif;color:#ffffff;white-space:nowrap}\nli{display:flex;align-items:center;gap:8px}\ni{width:26px;height:26px;display:grid;place-items:center;font-style:normal;font-weight:900;box-sizing:border-box}\n.fr{background:#0f4c9c;border-radius:4px;box-shadow:inset 0 0 0 2px #ffffff}\n.bs{background:#ffd100;clip-path:polygon(50% 4%,98% 94%,2% 94%);color:#111;padding-top:7px;font-size:13px}\n.fu{border-radius:50%;background:#ffffff;box-shadow:inset 0 0 0 5px #d7261e}\n.sh{background:#f28c28;transform:rotate(45deg) scale(.75);border:2px solid #ffffff}"
    }
  },
  "data": {
    "now": {
      "from": "park",
      "path": "/park/now",
      "time": "updatedAt",
      "fresh": 300,
      "fields": {
        "name": {},
        "en": {},
        "date": {},
        "time": {}
      }
    },
    "total": {
      "from": "park",
      "path": "/park/total",
      "time": "updatedAt",
      "fresh": 300,
      "fields": {
        "value": {}
      }
    },
    "floors": {
      "from": "park",
      "path": "/park/floors",
      "time": "updatedAt",
      "fresh": 300,
      "fields": {
        "f3": {
          "at": "/value/f3"
        },
        "f2": {
          "at": "/value/f2"
        },
        "f1": {
          "at": "/value/f1"
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
        }
      }
    },
    "notices": {
      "from": "park",
      "path": "/park/notices",
      "time": "updatedAt",
      "fresh": 300,
      "fields": {
        "value": {}
      }
    },
    "bays": {
      "from": "park",
      "path": "/park/bays",
      "time": "updatedAt",
      "fresh": 300,
      "fields": {
        "value": {}
      }
    },
    "figures": {
      "from": "park",
      "path": "/park/figures",
      "time": "updatedAt",
      "fresh": 300,
      "fields": {
        "value": {}
      }
    },
    "hours": {
      "from": "park",
      "path": "/park/hours",
      "list": "/value",
      "fresh": 300,
      "answerTime": "/updatedAt"
    }
  },
  "parts": {
    "title": {
      "as": "element",
      "element": "title",
      "of": "now",
      "bind": {
        "name": "name",
        "en": "en",
        "date": "date",
        "time": "time"
      }
    },
    "vms": {
      "as": "element",
      "element": "vms",
      "of": "total",
      "bind": {
        "v": "value"
      }
    },
    "floor-f3": {
      "as": "element",
      "element": "floor",
      "of": "floors",
      "bind": {
        "f": "f3"
      }
    },
    "floor-f2": {
      "as": "element",
      "element": "floor",
      "of": "floors",
      "bind": {
        "f": "f2"
      }
    },
    "floor-f1": {
      "as": "element",
      "element": "floor",
      "of": "floors",
      "bind": {
        "f": "f1"
      }
    },
    "floor-b1": {
      "as": "element",
      "element": "floor",
      "of": "floors",
      "bind": {
        "f": "b1"
      }
    },
    "floor-b2": {
      "as": "element",
      "element": "floor",
      "of": "floors",
      "bind": {
        "f": "b2"
      }
    },
    "floor-b3": {
      "as": "element",
      "element": "floor",
      "of": "floors",
      "bind": {
        "f": "b3"
      }
    },
    "floor-b4": {
      "as": "element",
      "element": "floor",
      "of": "floors",
      "bind": {
        "f": "b4"
      }
    },
    "notices": {
      "as": "element",
      "element": "notices",
      "of": "notices",
      "bind": {
        "items": "value"
      }
    },
    "bays": {
      "as": "element",
      "element": "bays",
      "of": "bays",
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
    "legend": {
      "as": "element",
      "element": "legend"
    },
    "hours": {
      "as": "chart.line",
      "of": "hours",
      "title": "시간대별 점유율(%) — 운영 480면 기준",
      "x": "hour",
      "y": "occupied",
      "series": [
        {
          "label": "점유율",
          "color": "#ffb81c"
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
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221600%22%20height%3D%221000%22%20viewBox%3D%220%200%201600%201000%22%3E%0A%3Crect%20width%3D%221600%22%20height%3D%221000%22%20fill%3D%22%232a2c2e%22%2F%3E%0A%3Crect%20x%3D%220%22%20y%3D%220%22%20width%3D%221600%22%20height%3D%22200%22%20fill%3D%22%23232527%22%2F%3E%0A%3Crect%20x%3D%2224%22%20y%3D%2220%22%20width%3D%2218%22%20height%3D%22190%22%20fill%3D%22%237d8287%22%2F%3E%3Crect%20x%3D%221558%22%20y%3D%2220%22%20width%3D%2218%22%20height%3D%22190%22%20fill%3D%22%237d8287%22%2F%3E%0A%3Crect%20x%3D%2224%22%20y%3D%2218%22%20width%3D%221552%22%20height%3D%2212%22%20fill%3D%22%239aa0a6%22%2F%3E%0A%3Cline%20x1%3D%220%22%20y1%3D%22212%22%20x2%3D%221600%22%20y2%3D%22212%22%20stroke%3D%22%23ffd100%22%20stroke-width%3D%225%22%2F%3E%3Cline%20x1%3D%220%22%20y1%3D%22222%22%20x2%3D%221600%22%20y2%3D%22222%22%20stroke%3D%22%23ffd100%22%20stroke-width%3D%225%22%2F%3E%0A%3Cline%20x1%3D%220%22%20y1%3D%22600%22%20x2%3D%221600%22%20y2%3D%22600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%22.55%22%20stroke-width%3D%226%22%20stroke-dasharray%3D%2260%2050%22%2F%3E%3Cline%20x1%3D%220%22%20y1%3D%22980%22%20x2%3D%221600%22%20y2%3D%22980%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%22.55%22%20stroke-width%3D%226%22%20stroke-dasharray%3D%2260%2050%22%2F%3E%0A%3Cpath%20d%3D%22M0%20994%20H1600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%22.8%22%20stroke-width%3D%226%22%2F%3E%0A%3C%2Fsvg%3E",
    "place": {
      "title": [
        60,
        40,
        980,
        150
      ],
      "vms": [
        1060,
        40,
        480,
        150
      ],
      "floor-f3": [
        60,
        246,
        820,
        80
      ],
      "floor-f2": [
        60,
        338,
        820,
        80
      ],
      "floor-f1": [
        60,
        430,
        820,
        80
      ],
      "floor-b1": [
        60,
        522,
        820,
        80
      ],
      "floor-b2": [
        60,
        614,
        820,
        80
      ],
      "floor-b3": [
        60,
        706,
        820,
        80
      ],
      "floor-b4": [
        60,
        798,
        820,
        80
      ],
      "notices": [
        60,
        892,
        820,
        90
      ],
      "bays": [
        920,
        246,
        620,
        170
      ],
      "figures": [
        920,
        436,
        620,
        124
      ],
      "legend": [
        920,
        578,
        620,
        46
      ],
      "hours": [
        920,
        646,
        620,
        324
      ]
    }
  }
};

export const parkingSigns: SamplePack = {
  id: "parking-signs",
  title: {
    "ko": "공영주차장 층별 빈 면 — 도로 표지판",
    "en": "A public car park’s free spaces by floor — road signs"
  },
  field: {
    "ko": "주차·도시 교통",
    "en": "Parking & city traffic"
  },
  kind: {
    "ko": "층별 빈 면·전용 구획·시간대별 점유율",
    "en": "Free spaces by floor, kept bays and occupancy by the hour"
  },
  domain: "transport",
  styles: [
    "signage"
  ],
  summary: {
    "ko": "공영주차장을 운전자에게 길이 말하는 방식으로 — 차선이 그어진 아스팔트와 문형 지주 아래, 모든 칸이 도로 표지판입니다. 흰 테를 두른 초록 안내 표지에 이름과 층마다 빈 면, 검은 가변 전광판에 호박색 숫자로 전체 빈 면, 파란 안내 표지에 전기차·장애인·경차 전용 구획, 노란 주의 표지에 운전자 안내. 층의 상태는 도로 표지처럼 모양으로도 말합니다: 파란 네모 P 여유, 노란 세모 혼잡, 빨간 원 만차, 주황 마름모 폐쇄. 오른쪽에 오늘 수치와 시간대별 점유율. 주차장은 지어낸 것이라 예시 데이터입니다.",
    "en": "A public car park told the way a road tells a driver — on lane-marked asphalt under a gantry, every part is a road sign. Green guide signs with a white rim carry the name and each floor’s free spaces, a black variable-message panel the total in amber, blue information signs the bays kept for electric cars, disabled drivers and small cars, and a yellow board the notices to drivers. A floor tells its state by the shape of its sign, as road signs do, as well as by colour — a blue square P free, a yellow triangle filling, a red ring full, an orange diamond closed. On the right the day’s figures and how full it has been hour by hour. The car park is made up. Example data."
  },
  connectors: [
    {
      "key": "park",
      "name": "예시 주차장 API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 주차장이 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
