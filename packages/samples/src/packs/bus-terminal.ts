// The departure wall over the boarding bays of an intercity bus terminal: one ultrawide strip, wider than four
// screens side by side, lit as an LED dot-matrix sign — amber for times, green for what is boarding, red for what is
// late or sold out, on black with the dots showing. The terminal's clock on the left, then every boarding bay as one
// component — its routes' colour band and the next departures from it with the seats still free — and a running
// line of notices along the bottom. No public source carries a terminal's bays this way, so the values are example
// data written for it.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/bus-terminal.js';

const board: Board = {
  "board": {
    "theme": "dark",
    "accent": "#ffb000"
  },
  "presets": {
    "bay": {
      "as": "group",
      "size": [
        250,
        740
      ],
      "parts": {
        "board": {
          "as": "element",
          "element": "bay",
          "bind": {
            "line": "line",
            "colour": "colour",
            "departures": "departures",
            "no": "id"
          }
        }
      },
      "place": {
        "board": [
          0,
          0,
          250,
          740
        ]
      }
    }
  },
  "elements": {
    "head": {
      "template": "<section class=\"hd\"><h1>{{name}}</h1><p>{{english}}</p><time>{{time}}</time><span>{{date}}</span><dl>{{#today}}<div class=\"{{#red}}red{{/red}}\"><dt>{{label}}</dt><dd>{{value}}</dd></div>{{/today}}</dl></section>",
      "style": ".hd{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto auto 1fr auto auto;padding:28px 30px;background:#050505 radial-gradient(circle,#1b1b1b 1.2px,transparent 1.6px) 0 0/6px 6px;font-family:ui-monospace, \"Cascadia Mono\", Consolas, monospace;color:#ffb000}\nh1{margin:0;font-size:52px;font-weight:800;letter-spacing:.06em;text-shadow:0 0 6px currentColor,0 0 14px color-mix(in srgb,currentColor 45%,transparent)}\np{margin:4px 0 0;font-size:20px;letter-spacing:.3em;color:#5a4a1a}\ntime{align-self:center;font-size:150px;font-weight:800;line-height:1;letter-spacing:.04em;text-shadow:0 0 6px currentColor,0 0 14px color-mix(in srgb,currentColor 45%,transparent)}\nspan{font-size:26px;letter-spacing:.1em;margin-bottom:24px}\ndl{margin:0;display:grid;gap:10px;border-top:3px solid #2a2a2a;padding-top:18px}\ndiv{display:flex;justify-content:space-between;font-size:26px}\ndt{color:#5a4a1a}\ndd{margin:0;font-weight:800;color:#3dff6a;text-shadow:0 0 6px currentColor,0 0 14px color-mix(in srgb,currentColor 45%,transparent)}\n.red dd{color:#ff3b30}",
      "props": {
        "name": "string",
        "english": "string",
        "time": "string",
        "date": "string",
        "today": "list"
      }
    },
    "ticker": {
      "template": "<p class=\"tk\">{{#items}}<span>{{.}}</span>{{/items}}</p>",
      "style": ".tk{margin:0;height:100%;box-sizing:border-box;display:flex;align-items:center;gap:80px;padding:0 30px;overflow:hidden;white-space:nowrap;background:#050505 radial-gradient(circle,#1b1b1b 1.2px,transparent 1.6px) 0 0/6px 6px;font:700 30px ui-monospace, \"Cascadia Mono\", Consolas, monospace;color:#ffb000;letter-spacing:.06em}\nspan{text-shadow:0 0 6px currentColor,0 0 14px color-mix(in srgb,currentColor 45%,transparent)}\nspan::before{content:\"▶ \";color:#3dff6a}",
      "props": {
        "items": "list"
      }
    },
    "bay": {
      "template": "<section class=\"by\" style=\"--c: {{colour}}\"><header><b>{{no}}</b><span>{{line}}</span></header><ol>{{#departures}}<li class=\"{{state}}\"><time>{{time}}</time><strong>{{to}}</strong><p><em>{{note}}</em><i>{{seats}}</i></p></li>{{/departures}}</ol></section>",
      "style": ".by{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr;background:#050505 radial-gradient(circle,#1b1b1b 1.2px,transparent 1.6px) 0 0/6px 6px;font-family:ui-monospace, \"Cascadia Mono\", Consolas, monospace;color:#ffb000}\nheader{display:flex;align-items:baseline;justify-content:space-between;padding:14px 16px 10px;border-bottom:8px solid var(--c)}\nb{font-size:44px;font-weight:800;text-shadow:0 0 6px currentColor,0 0 14px color-mix(in srgb,currentColor 45%,transparent)}\nheader span{font-size:19px;color:var(--c);letter-spacing:.04em}\nol{margin:0;padding:0;list-style:none;display:grid;grid-template-rows:repeat(4,1fr)}\nli{display:grid;align-content:center;gap:2px;padding:0 16px;border-bottom:2px solid #1f1f1f}\ntime{font-size:40px;font-weight:800;line-height:1.05;letter-spacing:.04em;text-shadow:0 0 6px currentColor,0 0 14px color-mix(in srgb,currentColor 45%,transparent)}\nstrong{font-size:30px;color:#ffd36b;white-space:nowrap;overflow:hidden;text-overflow:clip;text-shadow:0 0 6px currentColor,0 0 14px color-mix(in srgb,currentColor 45%,transparent)}\np{margin:0;display:flex;justify-content:space-between;align-items:baseline;font-size:19px}\nem{font-style:normal;color:#5a4a1a}\ni{font-style:normal;font-weight:800}\n.boarding em,.boarding time{color:#3dff6a}\n.late em{color:#ff3b30;text-shadow:0 0 6px currentColor,0 0 14px color-mix(in srgb,currentColor 45%,transparent)}\n.full i{color:#ff3b30;text-shadow:0 0 6px currentColor,0 0 14px color-mix(in srgb,currentColor 45%,transparent)}\n.ontime i,.boarding i,.late i{color:#3dff6a}",
      "props": {
        "no": "string",
        "line": "string",
        "colour": "string",
        "departures": "list"
      }
    }
  },
  "data": {
    "now": {
      "from": "terminal",
      "path": "/terminal/now",
      "time": "updatedAt",
      "fresh": 300,
      "fields": {
        "name": {},
        "english": {},
        "time": {},
        "date": {},
        "today": {}
      }
    },
    "notices": {
      "from": "terminal",
      "path": "/terminal/notices",
      "time": "updatedAt",
      "fresh": 300,
      "fields": {
        "value": {}
      }
    },
    "bays": {
      "from": "terminal",
      "path": "/terminal/bays",
      "list": "/value",
      "key": "id",
      "time": "updatedAt",
      "fresh": 300,
      "fields": {
        "line": {},
        "colour": {},
        "departures": {},
        "id": {}
      }
    }
  },
  "parts": {
    "head": {
      "as": "element",
      "element": "head",
      "of": "now",
      "bind": {
        "name": "name",
        "english": "english",
        "time": "time",
        "date": "date",
        "today": "today"
      }
    },
    "ticker": {
      "as": "element",
      "element": "ticker",
      "of": "notices",
      "bind": {
        "items": "value"
      }
    },
    "bay-1": {
      "use": "bay",
      "of": "bays[1]"
    },
    "bay-2": {
      "use": "bay",
      "of": "bays[2]"
    },
    "bay-3": {
      "use": "bay",
      "of": "bays[3]"
    },
    "bay-4": {
      "use": "bay",
      "of": "bays[4]"
    },
    "bay-5": {
      "use": "bay",
      "of": "bays[5]"
    },
    "bay-6": {
      "use": "bay",
      "of": "bays[6]"
    },
    "bay-7": {
      "use": "bay",
      "of": "bays[7]"
    },
    "bay-8": {
      "use": "bay",
      "of": "bays[8]"
    },
    "bay-9": {
      "use": "bay",
      "of": "bays[9]"
    },
    "bay-10": {
      "use": "bay",
      "of": "bays[10]"
    },
    "bay-11": {
      "use": "bay",
      "of": "bays[11]"
    },
    "bay-12": {
      "use": "bay",
      "of": "bays[12]"
    }
  },
  "layout": {
    "kind": "canvas",
    "size": [
      3840,
      900
    ],
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%223840%22%20height%3D%22900%22%20viewBox%3D%220%200%203840%20900%22%3E%0A%3Crect%20width%3D%223840%22%20height%3D%22900%22%20fill%3D%22%23121212%22%2F%3E%0A%3Crect%20x%3D%228%22%20y%3D%228%22%20width%3D%223824%22%20height%3D%22884%22%20rx%3D%2210%22%20fill%3D%22none%22%20stroke%3D%22%232f2f2f%22%20stroke-width%3D%226%22%2F%3E%0A%3Crect%20x%3D%22631.5%22%20y%3D%2220%22%20width%3D%224%22%20height%3D%22776%22%20fill%3D%22%232a2a2a%22%2F%3E%3Crect%20x%3D%22894.5%22%20y%3D%2220%22%20width%3D%224%22%20height%3D%22776%22%20fill%3D%22%232a2a2a%22%2F%3E%3Crect%20x%3D%221157.5%22%20y%3D%2220%22%20width%3D%224%22%20height%3D%22776%22%20fill%3D%22%232a2a2a%22%2F%3E%3Crect%20x%3D%221420.5%22%20y%3D%2220%22%20width%3D%224%22%20height%3D%22776%22%20fill%3D%22%232a2a2a%22%2F%3E%3Crect%20x%3D%221683.5%22%20y%3D%2220%22%20width%3D%224%22%20height%3D%22776%22%20fill%3D%22%232a2a2a%22%2F%3E%3Crect%20x%3D%221946.5%22%20y%3D%2220%22%20width%3D%224%22%20height%3D%22776%22%20fill%3D%22%232a2a2a%22%2F%3E%3Crect%20x%3D%222209.5%22%20y%3D%2220%22%20width%3D%224%22%20height%3D%22776%22%20fill%3D%22%232a2a2a%22%2F%3E%3Crect%20x%3D%222472.5%22%20y%3D%2220%22%20width%3D%224%22%20height%3D%22776%22%20fill%3D%22%232a2a2a%22%2F%3E%3Crect%20x%3D%222735.5%22%20y%3D%2220%22%20width%3D%224%22%20height%3D%22776%22%20fill%3D%22%232a2a2a%22%2F%3E%3Crect%20x%3D%222998.5%22%20y%3D%2220%22%20width%3D%224%22%20height%3D%22776%22%20fill%3D%22%232a2a2a%22%2F%3E%3Crect%20x%3D%223261.5%22%20y%3D%2220%22%20width%3D%224%22%20height%3D%22776%22%20fill%3D%22%232a2a2a%22%2F%3E%3Crect%20x%3D%223524.5%22%20y%3D%2220%22%20width%3D%224%22%20height%3D%22776%22%20fill%3D%22%232a2a2a%22%2F%3E%0A%3Crect%20x%3D%2220%22%20y%3D%22796%22%20width%3D%223800%22%20height%3D%224%22%20fill%3D%22%232a2a2a%22%2F%3E%0A%3C%2Fsvg%3E",
    "place": {
      "head": [
        40,
        40,
        560,
        740
      ],
      "ticker": [
        40,
        806,
        3760,
        60
      ],
      "bay-1": [
        640,
        40,
        250,
        740
      ],
      "bay-2": [
        903,
        40,
        250,
        740
      ],
      "bay-3": [
        1166,
        40,
        250,
        740
      ],
      "bay-4": [
        1429,
        40,
        250,
        740
      ],
      "bay-5": [
        1692,
        40,
        250,
        740
      ],
      "bay-6": [
        1955,
        40,
        250,
        740
      ],
      "bay-7": [
        2218,
        40,
        250,
        740
      ],
      "bay-8": [
        2481,
        40,
        250,
        740
      ],
      "bay-9": [
        2744,
        40,
        250,
        740
      ],
      "bay-10": [
        3007,
        40,
        250,
        740
      ],
      "bay-11": [
        3270,
        40,
        250,
        740
      ],
      "bay-12": [
        3533,
        40,
        250,
        740
      ]
    }
  }
};

export const busTerminal: SamplePack = {
  id: "bus-terminal",
  title: {
    "ko": "고속버스 터미널 출발 안내 벽 — 울트라와이드 LED",
    "en": "An intercity bus terminal’s departure wall — an ultrawide LED sign"
  },
  field: {
    "ko": "대중교통",
    "en": "Public transport"
  },
  kind: {
    "ko": "울트라와이드 벽면(약 4:1, 컴포넌트 반복)",
    "en": "An ultrawide wall (about 4:1, one component repeated)"
  },
  domain: "transport",
  styles: [
    "signage"
  ],
  summary: {
    "ko": "고속버스 터미널 승차홈 위에 길게 건 출발 안내 벽 — 화면 네 개를 이은 것보다 넓은 띠를 LED 도트 매트릭스처럼: 검은 바탕에 점이 보이고, 시각은 호박색, 탑승 중은 초록, 지연·매진은 빨강. 왼쪽에 터미널 이름과 아주 큰 시계·오늘 운행 현황, 이어서 승차홈 열둘이 같은 컴포넌트 하나(노선 계열 색 띠, 다음 출발 넷의 시각·행선지·남은 좌석·상태), 아래 안내 문구 띠. 예시 데이터입니다.",
    "en": "The departure wall hung along the boarding bays of an intercity bus terminal — a strip wider than four screens side by side, lit like an LED dot-matrix sign: black with the dots showing, times in amber, boarding in green, late and sold out in red. On the left the terminal’s name, a very large clock and the day’s running; then twelve bays as one component (its routes’ colour band, the next four departures with time, destination, seats left and state); and a line of notices along the bottom. Example data."
  },
  connectors: [
    {
      "key": "terminal",
      "name": "예시 버스 터미널 발권 API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 터미널·노선이 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
