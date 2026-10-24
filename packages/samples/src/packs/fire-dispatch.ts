// A city's fire and rescue dispatch drawn in the manner of Russian Constructivist posters: red, black and cream only,
// a composition built on diagonals, heavy condensed type set at an angle, circles and bars cut from flat paper. The
// map is reduced to a red diagonal band (the river), black blocks and a few roads; each station is a black-headed card
// listing its vehicles, each vehicle's state told by a shape as well as a colour — a black square waiting in the
// station, a red triangle on its way, a red diamond at the scene, an outlined triangle pointing back on its way home.
// The calls in progress are red discs, and the vehicles heading to them follow lines labelled with their minutes. On
// the right the day's calls, the average arrival and the vehicles free, the calls in progress and the calls by two
// hours. The city is made up, so the values are example data.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/fire-dispatch.js';

const board: Board = {
  "board": {
    "theme": "light",
    "accent": "#d62718"
  },
  "elements": {
    "station": {
      "template": "<section class=\"sc\"><h3>{{c.name}} 안전센터</h3><ul>{{#c.vehicles}}<li class=\"{{st}}\"><i></i>{{n}}</li>{{/c.vehicles}}</ul></section>",
      "style": ".sc{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr;background:#efe6d2;border:3px solid #161414;font-family:\"Oswald\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif;color:#161414}\nh3{margin:0;padding:6px 12px;font:24px \"Bebas Neue\", \"Oswald\", \"Impact\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif;letter-spacing:.06em;color:#efe6d2;background:#161414}\nul{margin:0;padding:8px 12px;list-style:none;display:grid;grid-template-columns:1fr 1fr;align-content:center;gap:6px 12px}\nli{display:flex;align-items:center;gap:8px;font-size:15px;font-weight:600}\ni{width:16px;height:16px;flex:none}\n.standby i{background:#161414}\n.go i{width:0;height:0;border-left:16px solid #d62718;border-top:9px solid transparent;border-bottom:9px solid transparent}\n.go{color:#d62718}\n.scene i{width:13px;height:13px;margin:0 2px;background:#d62718;transform:rotate(45deg)}\n.scene{color:#d62718}\n.back i{width:0;height:0;border-right:16px solid #8c857a;border-top:9px solid transparent;border-bottom:9px solid transparent}\n.back{color:#8c857a}",
      "props": {
        "c": "object"
      }
    },
    "call": {
      "template": "<section class=\"cl\"><b>{{i.kind}}</b><span>{{i.place}}</span><small>{{i.since}}</small><em>{{i.level}}</em></section>",
      "style": ".cl{height:100%;box-sizing:border-box;display:grid;place-content:center;justify-items:center;gap:2px;border-radius:50%;background:#d62718;color:#efe6d2;font-family:\"Oswald\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif;box-shadow:8px 8px 0 #161414}\nb{font:44px/1 \"Bebas Neue\", \"Oswald\", \"Impact\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif;letter-spacing:.08em}\nspan{font-size:15px;font-weight:700}\nsmall{font-size:12px}\nem{font-style:normal;font-size:12px;font-weight:700;padding:1px 8px;background:#161414}",
      "props": {
        "i": "object"
      }
    },
    "legend": {
      "template": "<ul class=\"lg\"><li class=\"standby\"><i></i>대기</li><li class=\"go\"><i></i>출동</li><li class=\"scene\"><i></i>현장</li><li class=\"back\"><i></i>복귀</li></ul>",
      "style": ".lg{height:100%;box-sizing:border-box;margin:0;padding:0 14px;list-style:none;display:flex;align-items:center;gap:20px;background:#efe6d2;border:3px solid #161414;font:700 15px \"Oswald\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif;color:#161414}\nli{display:flex;align-items:center;gap:8px}\ni{width:14px;height:14px}\n.standby i{background:#161414}\n.go i{width:0;height:0;border-left:14px solid #d62718;border-top:8px solid transparent;border-bottom:8px solid transparent}\n.scene i{width:11px;height:11px;background:#d62718;transform:rotate(45deg)}\n.back i{width:0;height:0;border-right:14px solid #8c857a;border-top:8px solid transparent;border-bottom:8px solid transparent}"
    },
    "title": {
      "template": "<header class=\"tt\"><h1>{{name}}</h1><p>{{sub}}</p><div><span>{{date}}</span><b>{{time}}</b></div></header>",
      "style": ".tt{height:100%;box-sizing:border-box;display:grid;align-content:center;gap:8px;font-family:\"Oswald\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif;color:#161414}\nh1{margin:0;justify-self:start;padding:4px 16px;font:44px/1.05 \"Bebas Neue\", \"Oswald\", \"Impact\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif;letter-spacing:.04em;color:#efe6d2;background:#d62718;transform:rotate(-3deg);transform-origin:left}\np{margin:0;font-size:16px;font-weight:600}\ndiv{display:flex;align-items:center;gap:12px;border-top:6px solid #161414;padding-top:6px}\nspan{font-size:16px}\nb{margin-left:auto;font:48px/1 \"Bebas Neue\", \"Oswald\", \"Impact\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif;color:#d62718}",
      "props": {
        "name": "string",
        "sub": "string",
        "date": "string",
        "time": "string"
      }
    },
    "figures": {
      "template": "<dl class=\"fg\">{{#items}}<div><dt>{{label}}</dt><dd>{{value}}</dd><small>{{note}}</small></div>{{/items}}</dl>",
      "style": ".fg{margin:0;height:100%;box-sizing:border-box;display:grid;grid-template-columns:repeat(3,1fr);gap:8px;font-family:\"Oswald\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif}\ndiv{display:grid;align-content:center;padding:6px 12px;background:#161414;color:#efe6d2}\ndt{font-size:13px;font-weight:700}\ndd{margin:0;font:40px/1.05 \"Bebas Neue\", \"Oswald\", \"Impact\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif;color:#efe6d2}\ndiv:first-child dd{color:#d62718}\nsmall{font-size:11px;color:#cfc6b4}",
      "props": {
        "items": "list"
      }
    },
    "calls": {
      "template": "<section class=\"ls\"><h3>진행 중</h3><ol><li><b>{{i.i1.kind}}</b><span>{{i.i1.place}}</span><small>{{i.i1.since}} · {{i.i1.level}}</small></li><li><b>{{i.i2.kind}}</b><span>{{i.i2.place}}</span><small>{{i.i2.since}} · {{i.i2.level}}</small></li><li><b>{{i.i3.kind}}</b><span>{{i.i3.place}}</span><small>{{i.i3.since}} · {{i.i3.level}}</small></li></ol></section>",
      "style": ".ls{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr;gap:8px;font-family:\"Oswald\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif;color:#161414}\nh3{margin:0;justify-self:start;padding:2px 14px;font:24px \"Bebas Neue\", \"Oswald\", \"Impact\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif;letter-spacing:.1em;color:#efe6d2;background:#161414;transform:rotate(-2deg)}\nol{margin:0;padding:0;list-style:none;display:grid;align-content:space-evenly}\nli{display:grid;grid-template-columns:64px 1fr;grid-template-rows:auto auto;column-gap:12px;padding:6px 0;border-bottom:3px solid #161414}\nb{grid-row:span 2;align-self:center;font:30px \"Bebas Neue\", \"Oswald\", \"Impact\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif;color:#d62718}\nspan{font-size:17px;font-weight:700}\nsmall{font-size:13px}",
      "props": {
        "i": "object"
      }
    }
  },
  "data": {
    "stations": {
      "from": "fire",
      "path": "/fire/stations",
      "time": "updatedAt",
      "fresh": 120,
      "fields": {
        "c1": {
          "at": "/value/c1"
        },
        "c2": {
          "at": "/value/c2"
        },
        "c3": {
          "at": "/value/c3"
        },
        "c4": {
          "at": "/value/c4"
        },
        "c5": {
          "at": "/value/c5"
        },
        "c6": {
          "at": "/value/c6"
        }
      }
    },
    "calls": {
      "from": "fire",
      "path": "/fire/calls",
      "time": "updatedAt",
      "fresh": 120,
      "fields": {
        "i1": {
          "at": "/value/i1"
        },
        "i2": {
          "at": "/value/i2"
        },
        "i3": {
          "at": "/value/i3"
        },
        "value": {}
      }
    },
    "now": {
      "from": "fire",
      "path": "/fire/now",
      "time": "updatedAt",
      "fresh": 120,
      "fields": {
        "name": {},
        "sub": {},
        "date": {},
        "time": {}
      }
    },
    "figures": {
      "from": "fire",
      "path": "/fire/figures",
      "time": "updatedAt",
      "fresh": 120,
      "fields": {
        "value": {}
      }
    },
    "hours": {
      "from": "fire",
      "path": "/fire/hours",
      "list": "/value",
      "fresh": 120,
      "answerTime": "/updatedAt"
    },
    "routes": {
      "from": "fire",
      "path": "/fire/routes",
      "time": "updatedAt",
      "fresh": 120,
      "fields": {
        "r1": {
          "at": "/value/r1"
        },
        "r2": {
          "at": "/value/r2"
        },
        "r3": {
          "at": "/value/r3"
        },
        "r4": {
          "at": "/value/r4"
        },
        "r5": {
          "at": "/value/r5"
        }
      }
    }
  },
  "parts": {
    "station-c1": {
      "as": "element",
      "element": "station",
      "of": "stations",
      "bind": {
        "c": "c1"
      }
    },
    "station-c2": {
      "as": "element",
      "element": "station",
      "of": "stations",
      "bind": {
        "c": "c2"
      }
    },
    "station-c3": {
      "as": "element",
      "element": "station",
      "of": "stations",
      "bind": {
        "c": "c3"
      }
    },
    "station-c4": {
      "as": "element",
      "element": "station",
      "of": "stations",
      "bind": {
        "c": "c4"
      }
    },
    "station-c5": {
      "as": "element",
      "element": "station",
      "of": "stations",
      "bind": {
        "c": "c5"
      }
    },
    "station-c6": {
      "as": "element",
      "element": "station",
      "of": "stations",
      "bind": {
        "c": "c6"
      }
    },
    "call-i1": {
      "as": "element",
      "element": "call",
      "of": "calls",
      "bind": {
        "i": "i1"
      }
    },
    "call-i2": {
      "as": "element",
      "element": "call",
      "of": "calls",
      "bind": {
        "i": "i2"
      }
    },
    "call-i3": {
      "as": "element",
      "element": "call",
      "of": "calls",
      "bind": {
        "i": "i3"
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
    "calls": {
      "as": "element",
      "element": "calls",
      "of": "calls",
      "bind": {
        "i": "value"
      }
    },
    "hours": {
      "as": "chart.bar",
      "of": "hours",
      "title": "두 시간마다 출동(건)",
      "x": "hour",
      "y": "calls",
      "series": [
        {
          "label": "출동",
          "color": "#d62718"
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
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221600%22%20height%3D%221000%22%20viewBox%3D%220%200%201600%201000%22%3E%0A%3Crect%20width%3D%221600%22%20height%3D%221000%22%20fill%3D%22%23efe6d2%22%2F%3E%0A%3Crect%20x%3D%2240%22%20y%3D%2240%22%20width%3D%221040%22%20height%3D%22920%22%20fill%3D%22%23e6dcc4%22%2F%3E%0A%3Cpath%20d%3D%22M%2040%20640%20L%201080%20380%20L%201080%20470%20L%2040%20730%20Z%22%20fill%3D%22%23d62718%22%20fill-opacity%3D%22.9%22%2F%3E%0A%3Cpath%20d%3D%22M%2040%20300%20L%201080%20300%20M%2040%20560%20L%201080%20560%20M%20380%2040%20L%20380%20960%20M%20760%2040%20L%20760%20960%22%20stroke%3D%22%23161414%22%20stroke-width%3D%223%22%20stroke-opacity%3D%22.25%22%2F%3E%0A%3Crect%20x%3D%22300%22%20y%3D%22250%22%20width%3D%2260%22%20height%3D%2240%22%20fill%3D%22%23161414%22%20fill-opacity%3D%22.14%22%2F%3E%3Crect%20x%3D%22720%22%20y%3D%22520%22%20width%3D%2290%22%20height%3D%2230%22%20fill%3D%22%23161414%22%20fill-opacity%3D%22.14%22%2F%3E%0A%3Crect%20x%3D%2260%22%20y%3D%22860%22%20width%3D%22140%22%20height%3D%2270%22%20fill%3D%22%23161414%22%20fill-opacity%3D%22.14%22%2F%3E%3Crect%20x%3D%22980%22%20y%3D%22880%22%20width%3D%2280%22%20height%3D%2260%22%20fill%3D%22%23161414%22%20fill-opacity%3D%22.14%22%2F%3E%0A%3Ccircle%20cx%3D%221000%22%20cy%3D%22112%22%20r%3D%2268%22%20fill%3D%22none%22%20stroke%3D%22%23161414%22%20stroke-width%3D%2212%22%2F%3E%0A%3Ctext%20x%3D%22790%22%20y%3D%22528%22%20text-anchor%3D%22middle%22%20fill%3D%22%23efe6d2%22%20font-size%3D%2226%22%20font-family%3D'%22Bebas%20Neue%22%2C%20%22Oswald%22%2C%20%22Impact%22%2C%20%22Noto%20Sans%20KR%22%2C%20%22Malgun%20Gothic%22%2C%20sans-serif'%20letter-spacing%3D%22.25em%22%20transform%3D%22rotate(-14%20790%20528)%22%3E%EC%83%88%EB%B2%8C%EA%B0%95%3C%2Ftext%3E%0A%3Ctext%20x%3D%2260%22%20y%3D%22950%22%20fill%3D%22%23161414%22%20font-size%3D%2256%22%20font-family%3D'%22Bebas%20Neue%22%2C%20%22Oswald%22%2C%20%22Impact%22%2C%20%22Noto%20Sans%20KR%22%2C%20%22Malgun%20Gothic%22%2C%20sans-serif'%20letter-spacing%3D%22.05em%22%20transform%3D%22rotate(-6%2060%20950)%22%20fill-opacity%3D%22.85%22%3E119%3C%2Ftext%3E%0A%3Crect%20x%3D%2220%22%20y%3D%2220%22%20width%3D%221080%22%20height%3D%22960%22%20fill%3D%22none%22%20stroke%3D%22%23161414%22%20stroke-width%3D%224%22%2F%3E%0A%3C%2Fsvg%3E",
    "place": {
      "station-c1": [
        70,
        100,
        236,
        136
      ],
      "station-c2": [
        420,
        80,
        236,
        136
      ],
      "station-c3": [
        800,
        110,
        236,
        136
      ],
      "station-c4": [
        80,
        600,
        236,
        136
      ],
      "station-c5": [
        440,
        680,
        236,
        136
      ],
      "station-c6": [
        800,
        620,
        236,
        136
      ],
      "call-i1": [
        520,
        330,
        160,
        160
      ],
      "call-i2": [
        150,
        340,
        160,
        160
      ],
      "call-i3": [
        860,
        360,
        160,
        160
      ],
      "legend": [
        680,
        900,
        360,
        40
      ],
      "title": [
        1120,
        30,
        460,
        180
      ],
      "figures": [
        1120,
        230,
        460,
        100
      ],
      "calls": [
        1120,
        350,
        460,
        230
      ],
      "hours": [
        1120,
        600,
        460,
        360
      ]
    },
    "links": {
      "route-r1": {
        "from": "station-c1",
        "to": "call-i1",
        "label": "{{r1}}",
        "tone": "next",
        "of": "routes",
        "width": 4,
        "arrow": "end"
      },
      "route-r2": {
        "from": "station-c2",
        "to": "call-i1",
        "label": "{{r2}}",
        "tone": "next",
        "of": "routes",
        "width": 4,
        "arrow": "end"
      },
      "route-r3": {
        "from": "station-c5",
        "to": "call-i1",
        "label": "{{r3}}",
        "tone": "next",
        "of": "routes",
        "width": 4,
        "arrow": "end"
      },
      "route-r4": {
        "from": "station-c1",
        "to": "call-i2",
        "label": "{{r4}}",
        "tone": "next",
        "of": "routes",
        "width": 4,
        "arrow": "end"
      },
      "route-r5": {
        "from": "station-c3",
        "to": "call-i3",
        "label": "{{r5}}",
        "tone": "next",
        "of": "routes",
        "width": 4,
        "arrow": "end"
      }
    }
  }
};

export const fireDispatch: SamplePack = {
  id: "fire-dispatch",
  title: {
    "ko": "119 출동 상황판 — 구성주의 포스터",
    "en": "A fire and rescue dispatch board — a Constructivist poster"
  },
  field: {
    "ko": "소방·119",
    "en": "Fire & rescue"
  },
  kind: {
    "ko": "안전센터 차량과 진행 중 출동",
    "en": "Stations’ vehicles and the calls in progress"
  },
  domain: "public",
  styles: [
    "art"
  ],
  summary: {
    "ko": "도시의 119 출동 상황을 러시아 구성주의 포스터로 — 빨강·검정·크림 세 가지만, 사선 위에 세운 구도, 기울여 앉힌 굵은 글자, 평평한 종이를 오린 듯한 원과 띠. 지도는 붉은 사선 띠(강)와 검은 블록, 몇 줄의 길로만 남기고, 안전센터마다 검은 머리의 카드에 차량을 늘어놓아 상태를 색과 함께 도형으로: 검은 네모 대기, 빨간 삼각 출동, 빨간 마름모 현장, 회색 뒤집힌 삼각 복귀. 진행 중인 출동은 빨간 원, 그리로 가는 차량은 남은 분이 적힌 선으로. 오른쪽에 오늘 출동·평균 도착·대기 차량, 진행 중 목록, 두 시간마다 출동. 도시는 지어낸 것이라 예시 데이터입니다.",
    "en": "A city’s fire and rescue dispatch as a Russian Constructivist poster — red, black and cream only, a composition built on diagonals, heavy type set at an angle, circles and bars cut from flat paper. The map is kept to a red diagonal band (the river), black blocks and a few roads; each station is a black-headed card listing its vehicles, each state told by a shape as well as a colour: a black square waiting, a red triangle on its way, a red diamond at the scene, a grey triangle pointing back on its way home. The calls in progress are red discs, and the vehicles heading to them follow lines labelled with their minutes. On the right the day’s calls, the average arrival and the vehicles free, the calls in progress and the calls by two hours. The city is made up. Example data."
  },
  connectors: [
    {
      "key": "fire",
      "name": "예시 119 상황 API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 도시가 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
