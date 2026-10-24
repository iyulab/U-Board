// A wholesale produce market's dawn auction set as the front page of a newspaper: black ink and one red on newsprint,
// a nameplate across the top, a serif headline over a deck, column rules and hairlines, and the market's plan printed
// as a halftone picture with its caption. Each auction hall is a boxed item on the plan — a black bar running while
// its auction is on, a full grey bar once it has ended, an empty outlined bar while it waits, the word beside it saying
// which; the price table marks a rise with a red triangle up and a fall with a black triangle down, so the direction
// reads without the colour. Beside them the cabbage price over a week, the day's figures and the notices. The market is
// made up, so the values are example data.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/produce-market.js';

const board: Board = {
  "board": {
    "theme": "light",
    "accent": "#a5161d"
  },
  "elements": {
    "masthead": {
      "template": "<header class=\"mh\"><span>{{date}}</span><h1>{{name}}</h1><p><b>{{edition}}</b> {{time}} 현재</p></header>",
      "style": ".mh{height:100%;box-sizing:border-box;display:grid;grid-template-columns:1fr auto 1fr;align-items:end;gap:20px;padding-bottom:6px;font-family:\"Noto Serif KR\", \"Nanum Myeongjo\", \"Batang\", serif;color:#141414}\nh1{margin:0;font-size:64px;font-weight:900;letter-spacing:.08em;line-height:1}\nspan{font-size:16px}\np{margin:0;justify-self:end;font-size:16px}\nb{padding:2px 10px;color:#f1ede3;background:#a5161d;font-weight:700}",
      "props": {
        "name": "string",
        "edition": "string",
        "date": "string",
        "time": "string"
      }
    },
    "lead": {
      "template": "<article class=\"ld\"><h2>{{headline}}</h2><p>{{deck}}</p></article>",
      "style": ".ld{height:100%;box-sizing:border-box;display:grid;align-content:center;gap:10px;font-family:\"Noto Serif KR\", \"Nanum Myeongjo\", \"Batang\", serif;color:#141414}\nh2{margin:0;font-size:40px;font-weight:900;line-height:1.15;letter-spacing:-.01em}\np{margin:0;font-size:17px;line-height:1.55;border-left:4px solid #a5161d;padding-left:12px}",
      "props": {
        "headline": "string",
        "deck": "string"
      }
    },
    "hall": {
      "template": "<section class=\"hl {{h.state}}\"><header><b>{{h.name}}</b><span>{{h.word}}</span></header><strong>{{h.item}}</strong><i style=\"--p: {{h.progress}}\"><u></u></i><small>{{h.note}}</small></section>",
      "style": ".hl{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr auto auto;gap:8px;padding:12px 16px;background:#f1ede3;border:2px solid #141414;box-shadow:4px 4px 0 #141414;font-family:\"Noto Serif KR\", \"Nanum Myeongjo\", \"Batang\", serif;color:#141414}\nheader{display:flex;justify-content:space-between;align-items:baseline;border-bottom:1px solid #141414;padding-bottom:4px}\nb{font-size:18px;font-weight:800}\nspan{font:700 13px \"Noto Sans KR\", \"Malgun Gothic\", sans-serif;padding:1px 8px;border:1.5px solid #141414}\nstrong{align-self:center;font-size:30px;font-weight:900}\ni{display:block;height:14px;border:1.5px solid #141414;background:#f1ede3}\nu{display:block;height:100%;width:calc(var(--p) * 1%);background:#141414}\nsmall{font:13px \"Noto Sans KR\", \"Malgun Gothic\", sans-serif}\n.now span{color:#f1ede3;background:#a5161d;border-color:#a5161d}\n.done{color:#4b4740}\n.done u{background:#8a857b}\n.done span{color:#f1ede3;background:#8a857b;border-color:#8a857b}\n.wait{border-style:dashed;box-shadow:none}",
      "props": {
        "h": "object"
      }
    },
    "prices": {
      "template": "<section class=\"pr\"><h3>오늘의 경락가</h3><table><thead><tr><th>품목</th><th>단위</th><th>경락가</th><th>전일 대비</th></tr></thead><tbody>{{#items}}<tr class=\"{{dir}}\"><td>{{item}}</td><td>{{unit}}</td><td>{{price}}</td><td><i></i>{{change}}</td></tr>{{/items}}</tbody></table></section>",
      "style": ".pr{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr;gap:10px;font-family:\"Noto Serif KR\", \"Nanum Myeongjo\", \"Batang\", serif;color:#141414}\nh3{margin:0;font-size:24px;font-weight:900;border-bottom:3px double #141414;padding-bottom:6px}\ntable{width:100%;border-collapse:collapse;align-self:start}\nth{font:600 13px \"Noto Sans KR\", \"Malgun Gothic\", sans-serif;text-align:left;padding:6px 4px;border-bottom:1.5px solid #141414}\ntd{font-size:17px;padding:10px 4px;border-bottom:1px solid #bdb7aa}\ntd:nth-child(3),th:nth-child(3),td:nth-child(4),th:nth-child(4){text-align:right}\ntd:nth-child(3){font-weight:800}\ntd:nth-child(4){font-family:\"Noto Sans KR\", \"Malgun Gothic\", sans-serif;font-weight:700;white-space:nowrap}\ni{display:inline-block;width:0;height:0;margin-right:6px;vertical-align:middle}\n.up td:nth-child(4){color:#a5161d}\n.up i{border-left:6px solid transparent;border-right:6px solid transparent;border-bottom:10px solid #a5161d}\n.down i{border-left:6px solid transparent;border-right:6px solid transparent;border-top:10px solid #141414}\n.flat i{width:12px;height:3px;background:#8a857b}\n.flat td:nth-child(4){color:#8a857b}",
      "props": {
        "items": "list"
      }
    },
    "figures": {
      "template": "<dl class=\"fg\">{{#items}}<div><dt>{{label}}</dt><dd>{{value}}</dd><small>{{note}}</small></div>{{/items}}</dl>",
      "style": ".fg{margin:0;height:100%;box-sizing:border-box;display:grid;align-content:space-between;font-family:\"Noto Serif KR\", \"Nanum Myeongjo\", \"Batang\", serif;color:#141414}\ndiv{display:grid;padding:10px 0;border-bottom:1px solid #141414}\ndiv:first-child{border-top:3px solid #141414}\ndt{font:700 14px \"Noto Sans KR\", \"Malgun Gothic\", sans-serif}\ndd{margin:2px 0;font-size:38px;font-weight:900;line-height:1.1}\nsmall{font:13px \"Noto Sans KR\", \"Malgun Gothic\", sans-serif;color:#4b4740}",
      "props": {
        "items": "list"
      }
    },
    "notices": {
      "template": "<section class=\"nt\"><h3>알림</h3><ul>{{#items}}<li><b>{{time}}</b>{{text}}</li>{{/items}}</ul></section>",
      "style": ".nt{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr;gap:8px;font-family:\"Noto Serif KR\", \"Nanum Myeongjo\", \"Batang\", serif;color:#141414}\nh3{margin:0;padding:2px 0;font-size:20px;font-weight:900;color:#f1ede3;background:#141414;text-align:center}\nul{margin:0;padding:0;list-style:none;display:grid;align-content:start;gap:12px}\nli{font-size:16px;line-height:1.5;padding-bottom:10px;border-bottom:1px dotted #141414}\nb{display:block;font:800 14px \"Noto Sans KR\", \"Malgun Gothic\", sans-serif;color:#a5161d}",
      "props": {
        "items": "list"
      }
    }
  },
  "data": {
    "now": {
      "from": "market",
      "path": "/market/now",
      "time": "updatedAt",
      "fresh": 600,
      "fields": {
        "name": {},
        "edition": {},
        "date": {},
        "time": {}
      }
    },
    "lead": {
      "from": "market",
      "path": "/market/lead",
      "time": "updatedAt",
      "fresh": 600,
      "fields": {
        "headline": {},
        "deck": {}
      }
    },
    "halls": {
      "from": "market",
      "path": "/market/halls",
      "time": "updatedAt",
      "fresh": 600,
      "fields": {
        "h1": {
          "at": "/value/h1"
        },
        "h2": {
          "at": "/value/h2"
        },
        "h3": {
          "at": "/value/h3"
        },
        "h4": {
          "at": "/value/h4"
        }
      }
    },
    "prices": {
      "from": "market",
      "path": "/market/prices",
      "time": "updatedAt",
      "fresh": 600,
      "fields": {
        "value": {}
      }
    },
    "cabbage": {
      "from": "market",
      "path": "/market/cabbage",
      "list": "/value",
      "fresh": 600,
      "answerTime": "/updatedAt"
    },
    "figures": {
      "from": "market",
      "path": "/market/figures",
      "time": "updatedAt",
      "fresh": 600,
      "fields": {
        "value": {}
      }
    },
    "notices": {
      "from": "market",
      "path": "/market/notices",
      "time": "updatedAt",
      "fresh": 600,
      "fields": {
        "value": {}
      }
    }
  },
  "parts": {
    "masthead": {
      "as": "element",
      "element": "masthead",
      "of": "now",
      "bind": {
        "name": "name",
        "edition": "edition",
        "date": "date",
        "time": "time"
      }
    },
    "lead": {
      "as": "element",
      "element": "lead",
      "of": "lead",
      "bind": {
        "headline": "headline",
        "deck": "deck"
      }
    },
    "hall-h1": {
      "as": "element",
      "element": "hall",
      "of": "halls",
      "bind": {
        "h": "h1"
      }
    },
    "hall-h2": {
      "as": "element",
      "element": "hall",
      "of": "halls",
      "bind": {
        "h": "h2"
      }
    },
    "hall-h3": {
      "as": "element",
      "element": "hall",
      "of": "halls",
      "bind": {
        "h": "h3"
      }
    },
    "hall-h4": {
      "as": "element",
      "element": "hall",
      "of": "halls",
      "bind": {
        "h": "h4"
      }
    },
    "prices": {
      "as": "element",
      "element": "prices",
      "of": "prices",
      "bind": {
        "items": "value"
      }
    },
    "cabbage": {
      "as": "chart.line",
      "of": "cabbage",
      "title": "배추 경락가 — 7일 (원/10kg)",
      "x": "day",
      "y": "price",
      "valueAxisZero": false,
      "series": [
        {
          "label": "배추",
          "color": "#a5161d"
        }
      ]
    },
    "figures": {
      "as": "element",
      "element": "figures",
      "of": "figures",
      "bind": {
        "items": "value"
      }
    },
    "notices": {
      "as": "element",
      "element": "notices",
      "of": "notices",
      "bind": {
        "items": "value"
      }
    }
  },
  "layout": {
    "kind": "canvas",
    "size": [
      1600,
      1000
    ],
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221600%22%20height%3D%221000%22%20viewBox%3D%220%200%201600%201000%22%3E%0A%3Cdefs%3E%0A%3Cpattern%20id%3D%22dots%22%20width%3D%226%22%20height%3D%226%22%20patternUnits%3D%22userSpaceOnUse%22%20patternTransform%3D%22rotate(45)%22%3E%3Ccircle%20cx%3D%223%22%20cy%3D%223%22%20r%3D%221.3%22%20fill%3D%22%23141414%22%2F%3E%3C%2Fpattern%3E%0A%3Cpattern%20id%3D%22dotsFine%22%20width%3D%225%22%20height%3D%225%22%20patternUnits%3D%22userSpaceOnUse%22%20patternTransform%3D%22rotate(45)%22%3E%3Ccircle%20cx%3D%222.5%22%20cy%3D%222.5%22%20r%3D%22.8%22%20fill%3D%22%23141414%22%2F%3E%3C%2Fpattern%3E%0A%3Cfilter%20id%3D%22paper%22%3E%3CfeTurbulence%20type%3D%22fractalNoise%22%20baseFrequency%3D%22.8%22%20numOctaves%3D%222%22%20seed%3D%223%22%2F%3E%3CfeColorMatrix%20values%3D%220%200%200%200%20.3%20%200%200%200%200%20.28%20%200%200%200%200%20.22%20%200%200%200%20-1.4%20.9%22%2F%3E%3C%2Ffilter%3E%0A%3C%2Fdefs%3E%0A%3Crect%20width%3D%221600%22%20height%3D%221000%22%20fill%3D%22%23f1ede3%22%2F%3E%0A%3Cpath%20d%3D%22M%2040%20136%20H%201560%22%20stroke%3D%22%23141414%22%20stroke-width%3D%224%22%2F%3E%3Cpath%20d%3D%22M%2040%20142%20H%201560%22%20stroke%3D%22%23141414%22%20stroke-width%3D%221%22%2F%3E%0A%3Cpath%20d%3D%22M%20777%20156%20V%20970%20M%201287%20156%20V%20970%22%20stroke%3D%22%23141414%22%20stroke-width%3D%221%22%2F%3E%0A%3Cpath%20d%3D%22M%2040%20336%20H%20760%22%20stroke%3D%22%23141414%22%20stroke-width%3D%221%22%2F%3E%0A%3Crect%20x%3D%2240%22%20y%3D%22350%22%20width%3D%22720%22%20height%3D%22580%22%20fill%3D%22url(%23dotsFine)%22%20opacity%3D%22.22%22%2F%3E%0A%3Crect%20x%3D%2256%22%20y%3D%22370%22%20width%3D%22688%22%20height%3D%22250%22%20fill%3D%22url(%23dots)%22%20opacity%3D%22.12%22%2F%3E%0A%3Crect%20x%3D%2256%22%20y%3D%22640%22%20width%3D%22688%22%20height%3D%22250%22%20fill%3D%22url(%23dots)%22%20opacity%3D%22.12%22%2F%3E%0A%3Cpath%20d%3D%22M%2040%20630%20H%20760%22%20stroke%3D%22%23141414%22%20stroke-width%3D%2210%22%20stroke-opacity%3D%22.35%22%2F%3E%0A%3Cpath%20d%3D%22M%20395%20350%20V%20930%22%20stroke%3D%22%23141414%22%20stroke-width%3D%2210%22%20stroke-opacity%3D%22.35%22%2F%3E%0A%3Crect%20x%3D%2240%22%20y%3D%22350%22%20width%3D%22720%22%20height%3D%22580%22%20fill%3D%22none%22%20stroke%3D%22%23141414%22%20stroke-width%3D%221.5%22%2F%3E%0A%3Ctext%20x%3D%2240%22%20y%3D%22956%22%20fill%3D%22%23141414%22%20font-size%3D%2214%22%20font-family%3D'%22Noto%20Serif%20KR%22%2C%20%22Nanum%20Myeongjo%22%2C%20%22Batang%22%2C%20serif'%3E%E2%96%B2%20%EA%B2%BD%EB%A7%A4%EB%8F%99%20%EB%B0%B0%EC%B9%98%20%E2%80%94%20%EA%B0%80%EC%9A%B4%EB%8D%B0%20%EC%8B%AD%EC%9E%90%EB%8A%94%20%ED%95%98%EC%B0%A8%EC%9E%A5%20%ED%86%B5%EB%A1%9C.%20%EA%B0%81%20%EB%8F%99%EC%9D%98%20%EB%A7%89%EB%8C%80%EB%8A%94%20%EB%B0%98%EC%9E%85%EB%9F%89%20%EA%B8%B0%EC%A4%80%20%EC%A7%84%ED%96%89.%3C%2Ftext%3E%0A%3Crect%20width%3D%221600%22%20height%3D%221000%22%20filter%3D%22url(%23paper)%22%20opacity%3D%22.18%22%2F%3E%0A%3C%2Fsvg%3E",
    "place": {
      "masthead": [
        40,
        24,
        1520,
        104
      ],
      "lead": [
        40,
        154,
        720,
        176
      ],
      "hall-h1": [
        70,
        390,
        300,
        190
      ],
      "hall-h2": [
        420,
        390,
        300,
        190
      ],
      "hall-h3": [
        70,
        660,
        300,
        190
      ],
      "hall-h4": [
        420,
        660,
        300,
        190
      ],
      "prices": [
        795,
        156,
        480,
        420
      ],
      "cabbage": [
        795,
        600,
        480,
        360
      ],
      "figures": [
        1300,
        156,
        260,
        400
      ],
      "notices": [
        1300,
        580,
        260,
        380
      ]
    }
  }
};

export const produceMarket: SamplePack = {
  id: "produce-market",
  title: {
    "ko": "농산물 도매시장 새벽 경매 — 신문 1면",
    "en": "A wholesale produce market’s dawn auction — a newspaper front page"
  },
  field: {
    "ko": "농산물 유통",
    "en": "Produce wholesale"
  },
  kind: {
    "ko": "경매동 진행과 품목별 경락가",
    "en": "The halls’ auctions and the prices by item"
  },
  domain: "agrifood",
  styles: [
    "print"
  ],
  summary: {
    "ko": "농산물 도매시장의 새벽 경매를 신문 1면으로 — 신문 용지에 먹 한 색과 빨강 한 색, 위를 가로지르는 제호, 세리프 큰 제목과 부제, 단을 가르는 괘선, 망점으로 인쇄한 시장 배치 그림과 사진 설명. 경매동마다 배치 그림 위 상자 기사로: 경매 중은 검은 막대가 차오르고 빨간 표지, 끝난 동은 회색 막대, 기다리는 동은 점선 상자에 빈 막대. 경락가 표는 오르면 빨간 위 삼각, 내리면 검은 아래 삼각이라 색 없이도 방향이 읽힙니다. 옆 단에 배추 경락가 7일, 오늘 반입·경매 진행·낙찰 건수, 알림. 시장은 지어낸 것이라 예시 데이터입니다.",
    "en": "A wholesale produce market’s dawn auction set as a newspaper front page — black ink and one red on newsprint, a nameplate across the top, a serif headline over its deck, column rules, and the market’s plan printed as a halftone picture with its caption. Each auction hall is a boxed item on the plan: a black bar filling with a red tag while its auction is on, a grey bar once it has ended, a dashed box with an empty bar while it waits. The price table marks a rise with a red triangle up and a fall with a black triangle down, so the direction reads without the colour. Beside them the cabbage price over a week, the produce brought in, the auction’s progress and the lots sold, and the notices. The market is made up. Example data."
  },
  connectors: [
    {
      "key": "market",
      "name": "예시 도매시장 API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 도매시장이 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
