// A restaurant kitchen's lunch rush on thermal paper: a brushed steel pass with a ticket rail along the top, every order
// hanging from it as a narrow receipt — fixed-width type, a dashed tear line, a torn zigzag foot — with the minutes since
// it was printed in big figures. An order's state is a rubber stamp across its paper as well as a colour: none on a new
// order, a blue «조리중» while it cooks, a red ring «완료» once it waits at the pass, and the paper turned black when it is
// late. Below, each station's queue printed like a register roll, the day's totals as a till receipt, and the average
// cooking time through the rush. The restaurant is made up, so the values are example data.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/kitchen-tickets.js';

const board: Board = {
  "board": {
    "theme": "light",
    "accent": "#cc2b2b"
  },
  "elements": {
    "ticket": {
      "template": "<article class=\"tk {{t.state}}\"><header><b>{{t.no}}</b><span>{{t.where}}</span></header><time>{{t.age}}</time><p>{{t.lines}}</p><footer><small>{{t.printed}}</small><em>{{t.word}}</em></footer></article>",
      "style": ".tk{position:relative;height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto auto 1fr auto;padding:16px 16px 26px;background:#fbfaf6;clip-path:polygon(0 0,100% 0,100.00% calc(100% - 10px),93.75% 100%,87.50% calc(100% - 10px),81.25% 100%,75.00% calc(100% - 10px),68.75% 100%,62.50% calc(100% - 10px),56.25% 100%,50.00% calc(100% - 10px),43.75% 100%,37.50% calc(100% - 10px),31.25% 100%,25.00% calc(100% - 10px),18.75% 100%,12.50% calc(100% - 10px),6.25% 100%,0.00% calc(100% - 10px));font-family:\"D2Coding\", \"Consolas\", \"Courier New\", \"Noto Sans Mono\", monospace;color:#1d1d1f;box-shadow:0 2px 0 rgba(0,0,0,.05)}\nheader{display:flex;justify-content:space-between;align-items:baseline;border-bottom:2px dashed #1d1d1f;padding-bottom:6px}\nb{font-size:24px;font-weight:800}\nspan{font-size:17px;font-weight:700}\ntime{font-size:46px;font-weight:800;letter-spacing:-.02em;padding:6px 0 4px}\np{margin:0;font-size:18px;line-height:1.5;white-space:pre-line;border-top:2px dashed #1d1d1f;padding-top:8px}\nfooter{display:flex;justify-content:space-between;align-items:center;border-top:2px dashed #1d1d1f;padding-top:6px;font-size:14px}\nem{font-style:normal;font-weight:800;font-size:16px}\n.tk::after{position:absolute;bottom:90px;right:22px;padding:4px 10px;font:900 26px \"D2Coding\", \"Consolas\", \"Courier New\", \"Noto Sans Mono\", monospace;transform:rotate(-14deg);opacity:.85}\n.new header b::before{content:\"NEW \";padding:0 6px;margin-right:4px;background:#1d1d1f;color:#fbfaf6;font-size:15px}\n.cook::after{content:\"조리중\";color:#2456b8;border:4px solid #2456b8;border-radius:6px}\n.cook em{color:#2456b8}\n.done::after{content:\"완료\";color:#cc2b2b;border:4px solid #cc2b2b;border-radius:50%;padding:14px 12px}\n.done em{color:#cc2b2b}\n.late{background:#1d1d1f;color:#fbfaf6}\n.late header,.late p,.late footer{border-color:#fbfaf6}\n.late::after{content:\"!! 지연\";color:#1d1d1f;background:#fbfaf6;border-radius:4px}",
      "props": {
        "t": "object"
      }
    },
    "stations": {
      "template": "<section class=\"st\"><h2>스테이션별 대기</h2><ol>{{#items}}<li class=\"{{state}}\"><i></i><b>{{name}}</b><span>{{queue}}</span><time>{{oldest}}</time><small>{{note}}</small></li>{{/items}}</ol></section>",
      "style": ".st{height:100%;box-sizing:border-box;padding:16px 22px 28px;background:#fbfaf6;clip-path:polygon(0 0,100% 0,100.00% calc(100% - 10px),93.75% 100%,87.50% calc(100% - 10px),81.25% 100%,75.00% calc(100% - 10px),68.75% 100%,62.50% calc(100% - 10px),56.25% 100%,50.00% calc(100% - 10px),43.75% 100%,37.50% calc(100% - 10px),31.25% 100%,25.00% calc(100% - 10px),18.75% 100%,12.50% calc(100% - 10px),6.25% 100%,0.00% calc(100% - 10px));font-family:\"D2Coding\", \"Consolas\", \"Courier New\", \"Noto Sans Mono\", monospace;color:#1d1d1f}\nh2{margin:0 0 8px;font-size:20px;font-weight:800;border-bottom:2px dashed #1d1d1f;padding-bottom:6px;letter-spacing:.06em}\nol{margin:0;padding:0;list-style:none;display:grid;gap:4px}\nli{display:grid;grid-template-columns:28px 1fr 90px 100px 1fr;align-items:center;gap:10px;padding:8px 0;border-bottom:1px dotted #1d1d1f;font-size:19px}\ni{font-style:normal;font-size:20px;font-weight:900;text-align:center}\nb{font-weight:800}\nspan,time{text-align:right;font-weight:700}\nsmall{font-size:15px;text-align:right}\n.busy i::after{content:\"▲\"}\n.busy{font-weight:800}\n.busy time{background:#1d1d1f;color:#fbfaf6;padding:0 4px}\n.steady i::after{content:\"●\"}\n.idle i::after{content:\"○\"}\n.idle{opacity:.7}",
      "props": {
        "items": "list"
      }
    },
    "totals": {
      "template": "<section class=\"tt\"><h1>{{s.name}}</h1><p>{{s.date}}</p><p class=\"now\">{{s.time}}</p><dl>{{#items}}<dt>{{label}}</dt><dd>{{value}}</dd>{{/items}}</dl><div class=\"bc\"></div></section>",
      "style": ".tt{height:100%;box-sizing:border-box;display:grid;align-content:start;justify-items:center;gap:4px;padding:16px 20px 28px;background:#fbfaf6;clip-path:polygon(0 0,100% 0,100.00% calc(100% - 10px),93.75% 100%,87.50% calc(100% - 10px),81.25% 100%,75.00% calc(100% - 10px),68.75% 100%,62.50% calc(100% - 10px),56.25% 100%,50.00% calc(100% - 10px),43.75% 100%,37.50% calc(100% - 10px),31.25% 100%,25.00% calc(100% - 10px),18.75% 100%,12.50% calc(100% - 10px),6.25% 100%,0.00% calc(100% - 10px));font-family:\"D2Coding\", \"Consolas\", \"Courier New\", \"Noto Sans Mono\", monospace;color:#1d1d1f;text-align:center}\nh1{margin:0;font-size:22px;font-weight:800}\np{margin:0;font-size:15px}\n.now{font-size:34px;font-weight:800;border-bottom:2px dashed #1d1d1f;width:100%;padding-bottom:6px}\ndl{margin:4px 0 0;width:100%;display:grid;grid-template-columns:1fr auto;row-gap:5px;font-size:17px;text-align:left}\ndd{margin:0;font-weight:800;text-align:right}\n.bc{margin-top:8px;width:80%;height:34px;background:repeating-linear-gradient(90deg,#1d1d1f 0 2px,transparent 2px 4px,#1d1d1f 4px 7px,transparent 7px 9px,#1d1d1f 9px 10px,transparent 10px 13px)}",
      "props": {
        "s": "object",
        "items": "list"
      }
    }
  },
  "data": {
    "tickets": {
      "from": "kitchen",
      "path": "/kitchen/tickets",
      "time": "updatedAt",
      "fresh": 120,
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
    "stations": {
      "from": "kitchen",
      "path": "/kitchen/stations",
      "time": "updatedAt",
      "fresh": 120,
      "fields": {
        "value": {}
      }
    },
    "totals": {
      "from": "kitchen",
      "path": "/kitchen/totals",
      "time": "updatedAt",
      "fresh": 120,
      "fields": {
        "kitchen": {},
        "value": {}
      }
    },
    "cooking": {
      "from": "kitchen",
      "path": "/kitchen/cooking",
      "list": "/value",
      "fresh": 120,
      "answerTime": "/updatedAt"
    }
  },
  "parts": {
    "ticket-t1": {
      "as": "element",
      "element": "ticket",
      "of": "tickets",
      "bind": {
        "t": "t1"
      }
    },
    "ticket-t2": {
      "as": "element",
      "element": "ticket",
      "of": "tickets",
      "bind": {
        "t": "t2"
      }
    },
    "ticket-t3": {
      "as": "element",
      "element": "ticket",
      "of": "tickets",
      "bind": {
        "t": "t3"
      }
    },
    "ticket-t4": {
      "as": "element",
      "element": "ticket",
      "of": "tickets",
      "bind": {
        "t": "t4"
      }
    },
    "ticket-t5": {
      "as": "element",
      "element": "ticket",
      "of": "tickets",
      "bind": {
        "t": "t5"
      }
    },
    "ticket-t6": {
      "as": "element",
      "element": "ticket",
      "of": "tickets",
      "bind": {
        "t": "t6"
      }
    },
    "stations": {
      "as": "element",
      "element": "stations",
      "of": "stations",
      "bind": {
        "items": "value"
      }
    },
    "totals": {
      "as": "element",
      "element": "totals",
      "of": "totals",
      "bind": {
        "s": "kitchen",
        "items": "value"
      }
    },
    "cooking": {
      "as": "chart.line",
      "of": "cooking",
      "title": "평균 조리 시간(분) — 30분마다",
      "x": "at",
      "y": "minutes",
      "series": [
        {
          "label": "평균",
          "color": "#cc2b2b"
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
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221600%22%20height%3D%221000%22%20viewBox%3D%220%200%201600%201000%22%3E%0A%3Cdefs%3E%0A%3ClinearGradient%20id%3D%22steel%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%220%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%23dfe3e7%22%2F%3E%3Cstop%20offset%3D%22.5%22%20stop-color%3D%22%23c9ced3%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23b9bfc5%22%2F%3E%3C%2FlinearGradient%3E%0A%3Cpattern%20id%3D%22brush%22%20width%3D%226%22%20height%3D%221000%22%20patternUnits%3D%22userSpaceOnUse%22%3E%3Crect%20width%3D%226%22%20height%3D%221000%22%20fill%3D%22url(%23steel)%22%2F%3E%3Cline%20x1%3D%222%22%20y1%3D%220%22%20x2%3D%222%22%20y2%3D%221000%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%22.18%22%2F%3E%3C%2Fpattern%3E%0A%3ClinearGradient%20id%3D%22rail%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%220%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%23f4f6f8%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%238f969d%22%2F%3E%3C%2FlinearGradient%3E%0A%3C%2Fdefs%3E%0A%3Crect%20width%3D%221600%22%20height%3D%221000%22%20fill%3D%22url(%23brush)%22%2F%3E%0A%3Crect%20x%3D%2220%22%20y%3D%2258%22%20width%3D%221560%22%20height%3D%2226%22%20rx%3D%226%22%20fill%3D%22url(%23rail)%22%2F%3E%0A%3Crect%20x%3D%2220%22%20y%3D%2282%22%20width%3D%221560%22%20height%3D%224%22%20fill%3D%22%236f767d%22%2F%3E%0A%3Crect%20x%3D%2220%22%20y%3D%22582%22%20width%3D%221560%22%20height%3D%223%22%20fill%3D%22%239aa1a8%22%2F%3E%0A%3Ctext%20x%3D%2224%22%20y%3D%2240%22%20fill%3D%22%234a5056%22%20font-size%3D%2220%22%20font-family%3D'%22D2Coding%22%2C%20%22Consolas%22%2C%20%22Courier%20New%22%2C%20%22Noto%20Sans%20Mono%22%2C%20monospace'%20font-weight%3D%22700%22%20letter-spacing%3D%22.12em%22%3EPASS%20%C2%B7%20%EC%A3%BC%EB%AC%B8%ED%91%9C%20%EB%A0%88%EC%9D%BC%3C%2Ftext%3E%0A%3C%2Fsvg%3E",
    "place": {
      "ticket-t1": [
        40,
        86,
        230,
        480
      ],
      "ticket-t2": [
        296,
        86,
        230,
        480
      ],
      "ticket-t3": [
        552,
        86,
        230,
        480
      ],
      "ticket-t4": [
        808,
        86,
        230,
        480
      ],
      "ticket-t5": [
        1064,
        86,
        230,
        480
      ],
      "ticket-t6": [
        1320,
        86,
        230,
        480
      ],
      "stations": [
        40,
        610,
        720,
        340
      ],
      "totals": [
        790,
        610,
        330,
        340
      ],
      "cooking": [
        1150,
        610,
        410,
        340
      ]
    }
  }
};

export const kitchenTickets: SamplePack = {
  id: "kitchen-tickets",
  title: {
    "ko": "식당 주방 점심 — 감열지 주문표",
    "en": "A restaurant kitchen’s lunch rush — thermal tickets"
  },
  field: {
    "ko": "외식·식당 주방",
    "en": "Restaurants & kitchens"
  },
  kind: {
    "ko": "주문표·스테이션 대기·조리 시간",
    "en": "Order tickets, station queues and cooking time"
  },
  domain: "services",
  styles: [
    "print"
  ],
  summary: {
    "ko": "식당 주방의 점심 몰림을 감열지로 — 스테인리스 배식대 위 주문표 레일에 주문마다 좁은 영수증이 매달립니다. 고정폭 글자, 점선 절취선, 찢긴 톱니 아랫단, 출력된 뒤 지난 시간이 큰 숫자로. 주문의 상태는 색과 함께 종이 위 고무도장으로: 새 주문은 도장 없이 NEW, 조리 중엔 파란 «조리중», 배식대에서 기다리면 빨간 원 «완료», 늦어지면 종이가 검게 뒤집힙니다. 아래에는 스테이션별 대기를 금전등록기 롤처럼, 오늘 합계를 계산 영수증처럼, 몰림 동안의 평균 조리 시간. 식당은 지어낸 것이라 예시 데이터입니다.",
    "en": "A restaurant kitchen’s lunch rush on thermal paper — on a brushed steel pass a ticket rail runs along the top, every order hanging from it as a narrow receipt with fixed-width type, a dashed tear line and a torn zigzag foot, the minutes since it printed in big figures. An order’s state is a rubber stamp across its paper as well as a colour: NEW and no stamp when it arrives, a blue «cooking» stamp, a red ring «done» once it waits at the pass, and the paper turned black when it is late. Below, each station’s queue printed like a register roll, the day’s totals as a till receipt, and the average cooking time through the rush. The restaurant is made up. Example data."
  },
  connectors: [
    {
      "key": "kitchen",
      "name": "예시 주방 API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 식당이 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
