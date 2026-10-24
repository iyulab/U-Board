// A riverside night market's food trucks as neon signs on a brick wall: every truck a sign of glass tubes — its name
// lit in its own colour, what it is serving, the minutes of the wait and the people in line — and the sign itself
// telling the state: lit steady when serving, an orange tube underneath when the line is long, a red «품절» tube across
// it when sold out, the tubes dark when closed. On the right a neon clock, the market's figures now and the orders by
// the half hour on a dark panel. The market and its trucks are made up, so the values are example data.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/night-market-neon.js';

const board: Board = {
  "board": {
    "theme": "dark",
    "accent": "#ff4fa3"
  },
  "elements": {
    "marquee": {
      "template": "<header class=\"mq\"><h1>달무리 야시장</h1><p>RIVERSIDE NIGHT MARKET · 푸드트럭 여덟</p></header>",
      "style": ".mq{height:100%;box-sizing:border-box;display:flex;align-items:center;gap:28px;padding:0 28px;border:3px solid #ff4fa3;border-radius:20px;box-shadow:0 0 14px #ff4fa3 inset;font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif}\nh1{margin:0;font:400 58px \"Brush Script MT\", \"Segoe Script\", cursive;color:#fff;text-shadow:0 0 4px #fff,0 0 12px #ff4fa3,0 0 22px #ff4fa3}\np{margin:0;font:700 16px \"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;letter-spacing:.24em;color:#3ef0ff;text-shadow:0 0 8px #3ef0ff}"
    },
    "sign": {
      "template": "<article class=\"ns {{t.state}}\" style=\"--c: {{t.color}}\"><h2>{{t.name}}</h2><p class=\"menu\">{{t.menu}}</p><div class=\"nums\"><span><b>{{t.wait}}</b>분 대기</span><span><b>{{t.line}}</b>명 줄</span></div><p class=\"word\">{{t.word}}</p></article>",
      "style": ".ns{position:relative;height:100%;box-sizing:border-box;padding:18px 16px 14px;display:grid;grid-template-rows:auto auto 1fr auto;gap:6px;border:3px solid var(--c);border-radius:22px;background:rgba(10,4,12,.72);box-shadow:0 0 12px var(--c) inset;font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#fff;text-align:center}\nh2{margin:6px 0 0;font:400 36px/1.1 \"Brush Script MT\", \"Segoe Script\", cursive;color:#fff;text-shadow:0 0 4px #fff,0 0 10px var(--c),0 0 18px var(--c);white-space:nowrap}\n.menu{margin:0;font-size:14px;color:var(--c);text-shadow:0 0 6px var(--c)}\n.nums{display:flex;justify-content:center;gap:26px;align-items:center;font-size:13px;color:#e8dcef}\n.nums b{display:block;font:800 48px \"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#fff;text-shadow:0 0 8px var(--c)}\n.word{margin:0;justify-self:center;padding:2px 14px;border:2px solid var(--c);border-radius:999px;font-size:14px;font-weight:800;color:var(--c);text-shadow:0 0 6px var(--c)}\n.busy .word{border-color:#ffb23e;color:#ffb23e;text-shadow:0 0 8px #ffb23e;box-shadow:0 0 10px #ffb23e}\n.busy::after{content:\"\";position:absolute;left:24px;right:24px;bottom:6px;height:3px;border-radius:2px;background:#ffb23e;box-shadow:0 0 8px #ffb23e}\n.soldout::before{content:\"품절\";position:absolute;left:50%;top:44%;transform:translate(-50%,-50%) rotate(-14deg);white-space:nowrap;padding:2px 18px;border:3px solid #ff3b3b;border-radius:12px;font:900 34px \"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#ff3b3b;text-shadow:0 0 8px #ff3b3b;box-shadow:0 0 12px #ff3b3b,0 0 12px #ff3b3b inset;background:rgba(20,0,0,.55);letter-spacing:.2em}\n.soldout .nums,.soldout .menu{opacity:.35}\n.soldout .word{border-color:#ff3b3b;color:#ff3b3b}\n.closed{border-color:#4a3f4f;box-shadow:none;background:rgba(10,4,12,.5)}\n.closed h2,.closed .menu,.closed .nums b,.closed .word{color:#5d5262;text-shadow:none}\n.closed .word{border-color:#4a3f4f;border-style:dashed}",
      "props": {
        "t": "object"
      }
    },
    "clock": {
      "template": "<section class=\"ck\"><p class=\"day\">{{n.date}}</p><p class=\"time\">{{n.time}}</p><dl><div><dt>지금 방문객</dt><dd>{{n.visitors}}</dd></div><div><dt>영업 중</dt><dd>{{n.open}}</dd></div><div><dt>평균 대기</dt><dd>{{n.wait}}</dd></div></dl></section>",
      "style": ".ck{height:100%;box-sizing:border-box;padding:16px 22px;border:3px solid #3ef0ff;border-radius:20px;box-shadow:0 0 14px #3ef0ff inset;background:rgba(6,10,14,.75);font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#fff;display:grid;gap:4px;align-content:start}\n.day{margin:0;font-size:15px;color:#3ef0ff;text-shadow:0 0 6px #3ef0ff}\n.time{margin:0;font:800 64px/1 \"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;letter-spacing:.04em;text-shadow:0 0 6px #fff,0 0 16px #3ef0ff}\ndl{margin:10px 0 0;display:grid;grid-template-columns:repeat(3,1fr);gap:8px}\ndl div{border-top:2px solid #b77bff;padding-top:6px}\ndt{font-size:12px;color:#d9c8ef}\ndd{margin:0;font:800 26px \"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#fff;text-shadow:0 0 8px #b77bff}",
      "props": {
        "n": "object"
      }
    },
    "key": {
      "template": "<ul class=\"ky\"><li><i class=\"on\"></i>영업 중</li><li><i class=\"busy\"></i>줄 김 — 주황 밑줄</li><li><i class=\"sold\"></i>품절 — 빨간 «품절»</li><li><i class=\"off\"></i>영업 끝 — 꺼진 관</li></ul>",
      "style": ".ky{height:100%;box-sizing:border-box;margin:0;padding:12px 18px;list-style:none;display:grid;grid-template-columns:1fr 1fr;gap:8px 16px;align-content:center;border:2px solid #4a3f4f;border-radius:16px;background:rgba(10,4,12,.7);font:600 14px \"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#efe6f5}\nli{display:flex;align-items:center;gap:10px}\ni{display:inline-block;width:34px;height:16px;border-radius:8px;border:2.5px solid #a6ff4d;box-shadow:0 0 8px #a6ff4d}\n.busy{border-color:#ffb23e;box-shadow:0 0 8px #ffb23e;border-bottom-width:5px}\n.sold{border-color:#ff3b3b;box-shadow:0 0 8px #ff3b3b;background:linear-gradient(160deg,transparent 45%,#ff3b3b 45% 58%,transparent 58%)}\n.off{border-color:#5d5262;box-shadow:none;border-style:dashed}"
    }
  },
  "data": {
    "trucks": {
      "from": "market",
      "path": "/market/trucks",
      "time": "updatedAt",
      "fresh": 300,
      "fields": {
        "a": {
          "at": "/value/a"
        },
        "b": {
          "at": "/value/b"
        },
        "c": {
          "at": "/value/c"
        },
        "d": {
          "at": "/value/d"
        },
        "e": {
          "at": "/value/e"
        },
        "f": {
          "at": "/value/f"
        },
        "g": {
          "at": "/value/g"
        },
        "h": {
          "at": "/value/h"
        }
      }
    },
    "now": {
      "from": "market",
      "path": "/market/now",
      "time": "updatedAt",
      "fresh": 300,
      "fields": {
        "value": {}
      }
    },
    "orders": {
      "from": "market",
      "path": "/market/orders",
      "list": "/value",
      "fresh": 300,
      "answerTime": "/updatedAt"
    }
  },
  "parts": {
    "marquee": {
      "as": "element",
      "element": "marquee"
    },
    "truck-a": {
      "as": "element",
      "element": "sign",
      "of": "trucks",
      "bind": {
        "t": "a"
      }
    },
    "truck-b": {
      "as": "element",
      "element": "sign",
      "of": "trucks",
      "bind": {
        "t": "b"
      }
    },
    "truck-c": {
      "as": "element",
      "element": "sign",
      "of": "trucks",
      "bind": {
        "t": "c"
      }
    },
    "truck-d": {
      "as": "element",
      "element": "sign",
      "of": "trucks",
      "bind": {
        "t": "d"
      }
    },
    "truck-e": {
      "as": "element",
      "element": "sign",
      "of": "trucks",
      "bind": {
        "t": "e"
      }
    },
    "truck-f": {
      "as": "element",
      "element": "sign",
      "of": "trucks",
      "bind": {
        "t": "f"
      }
    },
    "truck-g": {
      "as": "element",
      "element": "sign",
      "of": "trucks",
      "bind": {
        "t": "g"
      }
    },
    "truck-h": {
      "as": "element",
      "element": "sign",
      "of": "trucks",
      "bind": {
        "t": "h"
      }
    },
    "clock": {
      "as": "element",
      "element": "clock",
      "of": "now",
      "bind": {
        "n": "value"
      }
    },
    "key": {
      "as": "element",
      "element": "key"
    },
    "orders": {
      "as": "chart.bar",
      "of": "orders",
      "title": "30분마다 주문 (건)",
      "x": "slot",
      "y": "orders",
      "series": [
        {
          "label": "주문",
          "color": "#ff4fa3"
        }
      ]
    }
  },
  "layout": {
    "kind": "canvas",
    "size": [
      1600,
      900
    ],
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221600%22%20height%3D%22900%22%20viewBox%3D%220%200%201600%20900%22%3E%0A%3Cdefs%3E%0A%3Cpattern%20id%3D%22brick%22%20width%3D%2296%22%20height%3D%2248%22%20patternUnits%3D%22userSpaceOnUse%22%3E%0A%3Crect%20width%3D%2296%22%20height%3D%2248%22%20fill%3D%22%231a1012%22%2F%3E%0A%3Crect%20x%3D%222%22%20y%3D%222%22%20width%3D%2292%22%20height%3D%2220%22%20rx%3D%222%22%20fill%3D%22%232a1a1c%22%2F%3E%0A%3Crect%20x%3D%22-46%22%20y%3D%2226%22%20width%3D%2292%22%20height%3D%2220%22%20rx%3D%222%22%20fill%3D%22%232f1d1f%22%2F%3E%0A%3Crect%20x%3D%2250%22%20y%3D%2226%22%20width%3D%2292%22%20height%3D%2220%22%20rx%3D%222%22%20fill%3D%22%232f1d1f%22%2F%3E%0A%3C%2Fpattern%3E%0A%3CradialGradient%20id%3D%22glow%22%20cx%3D%2250%25%22%20cy%3D%2240%25%22%20r%3D%2270%25%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%233a1f3a%22%20stop-opacity%3D%22.9%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23000%22%20stop-opacity%3D%220%22%2F%3E%3C%2FradialGradient%3E%0A%3C%2Fdefs%3E%0A%3Crect%20width%3D%221600%22%20height%3D%22900%22%20fill%3D%22url(%23brick)%22%2F%3E%0A%3Crect%20width%3D%221600%22%20height%3D%22900%22%20fill%3D%22url(%23glow)%22%2F%3E%0A%3Crect%20width%3D%221600%22%20height%3D%22900%22%20fill%3D%22%23000%22%20opacity%3D%22.25%22%2F%3E%0A%3Crect%20x%3D%221110%22%20y%3D%22420%22%20width%3D%22456%22%20height%3D%22422%22%20rx%3D%2214%22%20fill%3D%22%23120c14%22%20stroke%3D%22%233b2b44%22%20stroke-width%3D%222%22%2F%3E%0A%3Cpath%20d%3D%22M0%20874%20H%201600%22%20stroke%3D%22%23000%22%20stroke-width%3D%2252%22%20opacity%3D%22.55%22%2F%3E%0A%3C%2Fsvg%3E",
    "place": {
      "marquee": [
        48,
        30,
        1032,
        110
      ],
      "truck-a": [
        48,
        170,
        240,
        320
      ],
      "truck-b": [
        312,
        170,
        240,
        320
      ],
      "truck-c": [
        576,
        170,
        240,
        320
      ],
      "truck-d": [
        840,
        170,
        240,
        320
      ],
      "truck-e": [
        48,
        522,
        240,
        320
      ],
      "truck-f": [
        312,
        522,
        240,
        320
      ],
      "truck-g": [
        576,
        522,
        240,
        320
      ],
      "truck-h": [
        840,
        522,
        240,
        320
      ],
      "clock": [
        1110,
        30,
        456,
        230
      ],
      "key": [
        1110,
        288,
        456,
        110
      ],
      "orders": [
        1126,
        436,
        424,
        392
      ]
    }
  }
};

export const nightMarketNeon: SamplePack = {
  id: "night-market-neon",
  title: {
    "ko": "강변 야시장 푸드트럭 — 네온사인",
    "en": "A riverside night market’s food trucks — neon signs"
  },
  field: {
    "ko": "야시장·푸드트럭",
    "en": "Night market and food trucks"
  },
  kind: {
    "ko": "트럭별 대기·주문",
    "en": "Lines and orders by truck"
  },
  domain: "services",
  styles: [
    "signage"
  ],
  summary: {
    "ko": "강변 야시장의 푸드트럭을 벽돌 벽 위 네온사인으로 — 트럭마다 유리관 간판 하나: 제 색으로 빛나는 이름, 지금 메뉴, 대기 분과 줄 선 사람 수, 그리고 간판 스스로 말하는 상태 — 영업 중이면 그대로, 줄이 길면 아래에 주황 관과 «줄 김», 품절이면 빨간 «품절» 관이 가로지르고 나머지는 흐리게, 영업이 끝나면 관이 꺼지고 점선. 오른쪽에 네온 시계와 지금 방문객·영업 중 트럭·평균 대기, 범례, 어두운 판 위의 30분마다 주문. 야시장과 트럭은 지어낸 것이라 예시 데이터입니다.",
    "en": "A riverside night market’s food trucks as neon signs on a brick wall — a sign of glass tubes for every truck: its name lit in its own colour, what it is serving, the minutes of the wait and the people in line, and the sign itself telling the state — lit steady when serving, an orange tube underneath and «busy» when the line is long, a red «sold out» tube across it with the rest dimmed, the tubes dark and dashed once closed. On the right a neon clock with the visitors now, the trucks open and the average wait, the key, and the orders by the half hour on a dark panel. The market and its trucks are made up. Example data."
  },
  connectors: [
    {
      "key": "market",
      "name": "예시 야시장 운영 API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 야시장·푸드트럭이 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
