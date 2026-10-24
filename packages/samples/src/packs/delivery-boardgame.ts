// A parcel depot's delivery drivers played out as a board game: every driver a lane of twenty spaces from 출발 to 도착,
// the driver's pawn standing as far along as the share of the route delivered, and at the lane's end the card the
// driver holds — GO (green) on schedule, 한 턴 쉬기 (yellow, dashed) running late, 문제 카드 (red, a tilted card with
// a !) when parcels pile up undelivered, 완주 (gold) when the route is done. On the right the day's tally as dice and
// the deliveries by hour. The depot, its drivers and its neighbourhoods are made up, so the values are example data.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/delivery-boardgame.js';

const board: Board = {
  "board": {
    "theme": "light",
    "accent": "#d6453d"
  },
  "elements": {
    "banner": {
      "template": "<header class=\"bn\"><h1>배송 대작전</h1><p>푸른길 택배 영업소 · 오늘의 판 — {{n.date}} {{n.time}}</p></header>",
      "style": ".bn{height:100%;display:flex;align-items:center;gap:20px;font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#3b2f2a}\nh1{margin:0;white-space:nowrap;padding:4px 18px;font:48px/1.1 \"Jua\", \"Do Hyeon\", \"Black Han Sans\", \"Pretendard\", sans-serif;color:#fff;background:#d6453d;border:3px solid #3b2f2a;border-radius:12px;box-shadow:4px 4px 0 #3b2f2a;transform:rotate(-2deg)}\np{margin:0;white-space:nowrap;font-size:18px;font-weight:700}",
      "props": {
        "n": "object"
      }
    },
    "lane": {
      "template": "<article class=\"ln {{d.state}}\" style=\"--step: {{d.step}}; --c: {{d.color}}\"><header><b>{{d.name}}</b><small>{{d.area}}</small><p>{{d.done}} / {{d.total}}건</p></header><div class=\"track\"><span class=\"st\">출발</span><div class=\"cells\"><div class=\"walked\"></div><i class=\"pawn\"></i></div><span class=\"go\">도착</span></div><aside class=\"card\"><em>{{d.card}}</em><small>{{d.word}}</small></aside><p class=\"note\">{{d.note}}</p></article>",
      "style": ".ln{height:100%;box-sizing:border-box;display:grid;grid-template-columns:150px 1fr 120px;grid-template-rows:1fr auto;column-gap:14px;align-items:center;padding:8px 12px;background:#fffaf0;border:3px solid #3b2f2a;border-radius:14px;font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#3b2f2a}\nheader{grid-row:1 / span 2;display:grid;gap:2px}\nb{font:28px/1 \"Jua\", \"Do Hyeon\", \"Black Han Sans\", \"Pretendard\", sans-serif;color:var(--c)}\nsmall{font-size:12px;color:#6b5d55}\nheader p{margin:4px 0 0;font:800 18px \"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif}\n.track{display:grid;grid-template-columns:42px 1fr 42px;align-items:center;gap:4px}\n.st,.go{display:grid;place-items:center;height:44px;border:2px solid #3b2f2a;border-radius:8px;font:13px \"Jua\", \"Do Hyeon\", \"Black Han Sans\", \"Pretendard\", sans-serif;background:#f2c230}\n.go{background:#3c9a5f;color:#fff}\n.cells{position:relative;height:44px;border:2px solid #3b2f2a;border-radius:6px;background:repeating-linear-gradient(90deg, #fffdf6 0 calc(5% - 2px), #3b2f2a calc(5% - 2px) 5%)}\n.walked{position:absolute;inset:0;background:repeating-linear-gradient(90deg, color-mix(in srgb, var(--c) 35%, #fff) 0 calc(5% - 2px), #3b2f2a calc(5% - 2px) 5%);clip-path:inset(0 calc(100% - var(--step) * 5%) 0 0)}\n.pawn{position:absolute;bottom:4px;width:26px;height:34px;left:calc(var(--step) * 5% - 2.5% - 13px);background:var(--c);clip-path:polygon(50% 0, 72% 10%, 74% 34%, 100% 48%, 88% 62%, 70% 58%, 82% 100%, 18% 100%, 30% 58%, 12% 62%, 0 48%, 26% 34%, 28% 10%);filter:drop-shadow(0 1px 0 #3b2f2a)}\n.card{grid-row:1 / span 2;grid-column:3;display:grid;place-items:center;align-content:center;gap:2px;height:96px;border:3px solid #3b2f2a;border-radius:10px;background:#3c9a5f;color:#fff;box-shadow:3px 3px 0 #3b2f2a}\n.card em{font:normal 22px/1 \"Jua\", \"Do Hyeon\", \"Black Han Sans\", \"Pretendard\", sans-serif;white-space:nowrap}\n.card small{color:inherit;font-weight:800;font-size:13px}\n.note{grid-column:2;margin:2px 0 0;font-size:13px;color:#6b5d55}\n.delay .card{background:#f2c230;color:#3b2f2a;border-style:dashed}\n.problem .card{background:#d6453d;transform:rotate(-6deg)}\n.problem .card em::before{content:\"! \"}\n.done .card{background:linear-gradient(135deg, #f7d774, #c9962b);color:#3b2f2a}\n.done .cells{opacity:.7}",
      "props": {
        "d": "object"
      }
    },
    "tally": {
      "template": "<section class=\"tl\"><h2>오늘의 점수</h2><ul><li><b>{{t.done}}</b><small>배송 완료</small></li><li><b>{{t.left}}</b><small>남은 배송</small></li><li class=\"w\"><b>{{t.absent}}</b><small>부재 · 재방문</small></li><li class=\"r\"><b>{{t.returned}}</b><small>반송</small></li></ul></section>",
      "style": ".tl{height:100%;box-sizing:border-box;padding:4px 8px;font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#3b2f2a}\nh2{margin:0 0 12px;font:30px \"Jua\", \"Do Hyeon\", \"Black Han Sans\", \"Pretendard\", sans-serif}\nul{margin:0;padding:0;list-style:none;display:grid;grid-template-columns:1fr 1fr;gap:14px}\nli{position:relative;display:grid;place-items:center;align-content:center;height:104px;background:#fff;border:3px solid #3b2f2a;border-radius:16px;box-shadow:3px 3px 0 #3b2f2a}\nli::before,li::after{content:\"\";position:absolute;width:9px;height:9px;border-radius:50%;background:#3b2f2a;top:10px;left:10px}\nli::after{top:auto;left:auto;bottom:10px;right:10px}\nb{font:40px/1 \"Jua\", \"Do Hyeon\", \"Black Han Sans\", \"Pretendard\", sans-serif}\nsmall{font-size:13px;font-weight:700;color:#6b5d55}\n.w b{color:#b08400}.r b{color:#d6453d}",
      "props": {
        "t": "object"
      }
    }
  },
  "data": {
    "now": {
      "from": "depot",
      "path": "/depot/now",
      "time": "updatedAt",
      "fresh": 600,
      "fields": {
        "value": {}
      }
    },
    "drivers": {
      "from": "depot",
      "path": "/depot/drivers",
      "time": "updatedAt",
      "fresh": 600,
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
        }
      }
    },
    "tally": {
      "from": "depot",
      "path": "/depot/tally",
      "time": "updatedAt",
      "fresh": 600,
      "fields": {
        "value": {}
      }
    },
    "hourly": {
      "from": "depot",
      "path": "/depot/hourly",
      "list": "/value",
      "fresh": 600,
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
    "driver-v1": {
      "as": "element",
      "element": "lane",
      "of": "drivers",
      "bind": {
        "d": "v1"
      }
    },
    "driver-v2": {
      "as": "element",
      "element": "lane",
      "of": "drivers",
      "bind": {
        "d": "v2"
      }
    },
    "driver-v3": {
      "as": "element",
      "element": "lane",
      "of": "drivers",
      "bind": {
        "d": "v3"
      }
    },
    "driver-v4": {
      "as": "element",
      "element": "lane",
      "of": "drivers",
      "bind": {
        "d": "v4"
      }
    },
    "driver-v5": {
      "as": "element",
      "element": "lane",
      "of": "drivers",
      "bind": {
        "d": "v5"
      }
    },
    "driver-v6": {
      "as": "element",
      "element": "lane",
      "of": "drivers",
      "bind": {
        "d": "v6"
      }
    },
    "tally": {
      "as": "element",
      "element": "tally",
      "of": "tally",
      "bind": {
        "t": "value"
      }
    },
    "hourly": {
      "as": "chart.bar",
      "of": "hourly",
      "title": "시간대별 배송 완료 (건) — 14시는 40분까지",
      "x": "hour",
      "y": "done",
      "series": [
        {
          "label": "완료",
          "color": "#2f6fb3"
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
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221600%22%20height%3D%221000%22%20viewBox%3D%220%200%201600%201000%22%3E%0A%3Crect%20width%3D%221600%22%20height%3D%221000%22%20fill%3D%22%23f4ecd6%22%2F%3E%0A%3Cg%20stroke%3D%22%233b2f2a%22%20stroke-width%3D%222%22%3E%3Crect%20x%3D%220%22%20y%3D%220%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%23d6453d%22%2F%3E%3Crect%20x%3D%220%22%20y%3D%22960%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%23f2c230%22%2F%3E%3Crect%20x%3D%2240%22%20y%3D%220%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%232f6fb3%22%2F%3E%3Crect%20x%3D%2240%22%20y%3D%22960%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%233c9a5f%22%2F%3E%3Crect%20x%3D%2280%22%20y%3D%220%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%23f2c230%22%2F%3E%3Crect%20x%3D%2280%22%20y%3D%22960%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%23d6453d%22%2F%3E%3Crect%20x%3D%22120%22%20y%3D%220%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%233c9a5f%22%2F%3E%3Crect%20x%3D%22120%22%20y%3D%22960%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%232f6fb3%22%2F%3E%3Crect%20x%3D%22160%22%20y%3D%220%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%23d6453d%22%2F%3E%3Crect%20x%3D%22160%22%20y%3D%22960%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%23f2c230%22%2F%3E%3Crect%20x%3D%22200%22%20y%3D%220%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%232f6fb3%22%2F%3E%3Crect%20x%3D%22200%22%20y%3D%22960%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%233c9a5f%22%2F%3E%3Crect%20x%3D%22240%22%20y%3D%220%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%23f2c230%22%2F%3E%3Crect%20x%3D%22240%22%20y%3D%22960%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%23d6453d%22%2F%3E%3Crect%20x%3D%22280%22%20y%3D%220%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%233c9a5f%22%2F%3E%3Crect%20x%3D%22280%22%20y%3D%22960%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%232f6fb3%22%2F%3E%3Crect%20x%3D%22320%22%20y%3D%220%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%23d6453d%22%2F%3E%3Crect%20x%3D%22320%22%20y%3D%22960%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%23f2c230%22%2F%3E%3Crect%20x%3D%22360%22%20y%3D%220%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%232f6fb3%22%2F%3E%3Crect%20x%3D%22360%22%20y%3D%22960%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%233c9a5f%22%2F%3E%3Crect%20x%3D%22400%22%20y%3D%220%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%23f2c230%22%2F%3E%3Crect%20x%3D%22400%22%20y%3D%22960%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%23d6453d%22%2F%3E%3Crect%20x%3D%22440%22%20y%3D%220%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%233c9a5f%22%2F%3E%3Crect%20x%3D%22440%22%20y%3D%22960%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%232f6fb3%22%2F%3E%3Crect%20x%3D%22480%22%20y%3D%220%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%23d6453d%22%2F%3E%3Crect%20x%3D%22480%22%20y%3D%22960%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%23f2c230%22%2F%3E%3Crect%20x%3D%22520%22%20y%3D%220%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%232f6fb3%22%2F%3E%3Crect%20x%3D%22520%22%20y%3D%22960%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%233c9a5f%22%2F%3E%3Crect%20x%3D%22560%22%20y%3D%220%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%23f2c230%22%2F%3E%3Crect%20x%3D%22560%22%20y%3D%22960%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%23d6453d%22%2F%3E%3Crect%20x%3D%22600%22%20y%3D%220%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%233c9a5f%22%2F%3E%3Crect%20x%3D%22600%22%20y%3D%22960%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%232f6fb3%22%2F%3E%3Crect%20x%3D%22640%22%20y%3D%220%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%23d6453d%22%2F%3E%3Crect%20x%3D%22640%22%20y%3D%22960%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%23f2c230%22%2F%3E%3Crect%20x%3D%22680%22%20y%3D%220%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%232f6fb3%22%2F%3E%3Crect%20x%3D%22680%22%20y%3D%22960%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%233c9a5f%22%2F%3E%3Crect%20x%3D%22720%22%20y%3D%220%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%23f2c230%22%2F%3E%3Crect%20x%3D%22720%22%20y%3D%22960%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%23d6453d%22%2F%3E%3Crect%20x%3D%22760%22%20y%3D%220%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%233c9a5f%22%2F%3E%3Crect%20x%3D%22760%22%20y%3D%22960%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%232f6fb3%22%2F%3E%3Crect%20x%3D%22800%22%20y%3D%220%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%23d6453d%22%2F%3E%3Crect%20x%3D%22800%22%20y%3D%22960%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%23f2c230%22%2F%3E%3Crect%20x%3D%22840%22%20y%3D%220%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%232f6fb3%22%2F%3E%3Crect%20x%3D%22840%22%20y%3D%22960%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%233c9a5f%22%2F%3E%3Crect%20x%3D%22880%22%20y%3D%220%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%23f2c230%22%2F%3E%3Crect%20x%3D%22880%22%20y%3D%22960%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%23d6453d%22%2F%3E%3Crect%20x%3D%22920%22%20y%3D%220%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%233c9a5f%22%2F%3E%3Crect%20x%3D%22920%22%20y%3D%22960%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%232f6fb3%22%2F%3E%3Crect%20x%3D%22960%22%20y%3D%220%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%23d6453d%22%2F%3E%3Crect%20x%3D%22960%22%20y%3D%22960%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%23f2c230%22%2F%3E%3Crect%20x%3D%221000%22%20y%3D%220%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%232f6fb3%22%2F%3E%3Crect%20x%3D%221000%22%20y%3D%22960%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%233c9a5f%22%2F%3E%3Crect%20x%3D%221040%22%20y%3D%220%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%23f2c230%22%2F%3E%3Crect%20x%3D%221040%22%20y%3D%22960%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%23d6453d%22%2F%3E%3Crect%20x%3D%221080%22%20y%3D%220%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%233c9a5f%22%2F%3E%3Crect%20x%3D%221080%22%20y%3D%22960%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%232f6fb3%22%2F%3E%3Crect%20x%3D%221120%22%20y%3D%220%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%23d6453d%22%2F%3E%3Crect%20x%3D%221120%22%20y%3D%22960%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%23f2c230%22%2F%3E%3Crect%20x%3D%221160%22%20y%3D%220%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%232f6fb3%22%2F%3E%3Crect%20x%3D%221160%22%20y%3D%22960%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%233c9a5f%22%2F%3E%3Crect%20x%3D%221200%22%20y%3D%220%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%23f2c230%22%2F%3E%3Crect%20x%3D%221200%22%20y%3D%22960%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%23d6453d%22%2F%3E%3Crect%20x%3D%221240%22%20y%3D%220%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%233c9a5f%22%2F%3E%3Crect%20x%3D%221240%22%20y%3D%22960%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%232f6fb3%22%2F%3E%3Crect%20x%3D%221280%22%20y%3D%220%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%23d6453d%22%2F%3E%3Crect%20x%3D%221280%22%20y%3D%22960%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%23f2c230%22%2F%3E%3Crect%20x%3D%221320%22%20y%3D%220%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%232f6fb3%22%2F%3E%3Crect%20x%3D%221320%22%20y%3D%22960%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%233c9a5f%22%2F%3E%3Crect%20x%3D%221360%22%20y%3D%220%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%23f2c230%22%2F%3E%3Crect%20x%3D%221360%22%20y%3D%22960%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%23d6453d%22%2F%3E%3Crect%20x%3D%221400%22%20y%3D%220%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%233c9a5f%22%2F%3E%3Crect%20x%3D%221400%22%20y%3D%22960%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%232f6fb3%22%2F%3E%3Crect%20x%3D%221440%22%20y%3D%220%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%23d6453d%22%2F%3E%3Crect%20x%3D%221440%22%20y%3D%22960%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%23f2c230%22%2F%3E%3Crect%20x%3D%221480%22%20y%3D%220%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%232f6fb3%22%2F%3E%3Crect%20x%3D%221480%22%20y%3D%22960%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%233c9a5f%22%2F%3E%3Crect%20x%3D%221520%22%20y%3D%220%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%23f2c230%22%2F%3E%3Crect%20x%3D%221520%22%20y%3D%22960%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%23d6453d%22%2F%3E%3Crect%20x%3D%221560%22%20y%3D%220%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%233c9a5f%22%2F%3E%3Crect%20x%3D%221560%22%20y%3D%22960%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%232f6fb3%22%2F%3E%3Crect%20x%3D%220%22%20y%3D%2240%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%23f2c230%22%2F%3E%3Crect%20x%3D%221560%22%20y%3D%2240%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%23d6453d%22%2F%3E%3Crect%20x%3D%220%22%20y%3D%2280%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%233c9a5f%22%2F%3E%3Crect%20x%3D%221560%22%20y%3D%2280%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%232f6fb3%22%2F%3E%3Crect%20x%3D%220%22%20y%3D%22120%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%23d6453d%22%2F%3E%3Crect%20x%3D%221560%22%20y%3D%22120%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%23f2c230%22%2F%3E%3Crect%20x%3D%220%22%20y%3D%22160%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%232f6fb3%22%2F%3E%3Crect%20x%3D%221560%22%20y%3D%22160%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%233c9a5f%22%2F%3E%3Crect%20x%3D%220%22%20y%3D%22200%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%23f2c230%22%2F%3E%3Crect%20x%3D%221560%22%20y%3D%22200%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%23d6453d%22%2F%3E%3Crect%20x%3D%220%22%20y%3D%22240%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%233c9a5f%22%2F%3E%3Crect%20x%3D%221560%22%20y%3D%22240%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%232f6fb3%22%2F%3E%3Crect%20x%3D%220%22%20y%3D%22280%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%23d6453d%22%2F%3E%3Crect%20x%3D%221560%22%20y%3D%22280%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%23f2c230%22%2F%3E%3Crect%20x%3D%220%22%20y%3D%22320%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%232f6fb3%22%2F%3E%3Crect%20x%3D%221560%22%20y%3D%22320%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%233c9a5f%22%2F%3E%3Crect%20x%3D%220%22%20y%3D%22360%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%23f2c230%22%2F%3E%3Crect%20x%3D%221560%22%20y%3D%22360%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%23d6453d%22%2F%3E%3Crect%20x%3D%220%22%20y%3D%22400%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%233c9a5f%22%2F%3E%3Crect%20x%3D%221560%22%20y%3D%22400%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%232f6fb3%22%2F%3E%3Crect%20x%3D%220%22%20y%3D%22440%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%23d6453d%22%2F%3E%3Crect%20x%3D%221560%22%20y%3D%22440%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%23f2c230%22%2F%3E%3Crect%20x%3D%220%22%20y%3D%22480%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%232f6fb3%22%2F%3E%3Crect%20x%3D%221560%22%20y%3D%22480%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%233c9a5f%22%2F%3E%3Crect%20x%3D%220%22%20y%3D%22520%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%23f2c230%22%2F%3E%3Crect%20x%3D%221560%22%20y%3D%22520%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%23d6453d%22%2F%3E%3Crect%20x%3D%220%22%20y%3D%22560%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%233c9a5f%22%2F%3E%3Crect%20x%3D%221560%22%20y%3D%22560%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%232f6fb3%22%2F%3E%3Crect%20x%3D%220%22%20y%3D%22600%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%23d6453d%22%2F%3E%3Crect%20x%3D%221560%22%20y%3D%22600%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%23f2c230%22%2F%3E%3Crect%20x%3D%220%22%20y%3D%22640%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%232f6fb3%22%2F%3E%3Crect%20x%3D%221560%22%20y%3D%22640%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%233c9a5f%22%2F%3E%3Crect%20x%3D%220%22%20y%3D%22680%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%23f2c230%22%2F%3E%3Crect%20x%3D%221560%22%20y%3D%22680%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%23d6453d%22%2F%3E%3Crect%20x%3D%220%22%20y%3D%22720%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%233c9a5f%22%2F%3E%3Crect%20x%3D%221560%22%20y%3D%22720%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%232f6fb3%22%2F%3E%3Crect%20x%3D%220%22%20y%3D%22760%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%23d6453d%22%2F%3E%3Crect%20x%3D%221560%22%20y%3D%22760%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%23f2c230%22%2F%3E%3Crect%20x%3D%220%22%20y%3D%22800%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%232f6fb3%22%2F%3E%3Crect%20x%3D%221560%22%20y%3D%22800%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%233c9a5f%22%2F%3E%3Crect%20x%3D%220%22%20y%3D%22840%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%23f2c230%22%2F%3E%3Crect%20x%3D%221560%22%20y%3D%22840%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%23d6453d%22%2F%3E%3Crect%20x%3D%220%22%20y%3D%22880%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%233c9a5f%22%2F%3E%3Crect%20x%3D%221560%22%20y%3D%22880%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%232f6fb3%22%2F%3E%3Crect%20x%3D%220%22%20y%3D%22920%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%23d6453d%22%2F%3E%3Crect%20x%3D%221560%22%20y%3D%22920%22%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%23f2c230%22%2F%3E%3C%2Fg%3E%0A%3Crect%20x%3D%2240%22%20y%3D%2240%22%20width%3D%221520%22%20height%3D%22920%22%20fill%3D%22none%22%20stroke%3D%22%233b2f2a%22%20stroke-width%3D%223%22%2F%3E%0A%3Crect%20x%3D%221100%22%20y%3D%22140%22%20width%3D%22440%22%20height%3D%22790%22%20rx%3D%2218%22%20fill%3D%22%23fffaf0%22%20stroke%3D%22%233b2f2a%22%20stroke-width%3D%223%22%2F%3E%0A%3Crect%20x%3D%221110%22%20y%3D%22150%22%20width%3D%22420%22%20height%3D%22770%22%20rx%3D%2212%22%20fill%3D%22none%22%20stroke%3D%22%233b2f2a%22%20stroke-width%3D%221%22%20stroke-dasharray%3D%226%206%22%2F%3E%0A%3C%2Fsvg%3E",
    "place": {
      "banner": [
        70,
        56,
        1000,
        80
      ],
      "driver-v1": [
        70,
        150,
        1000,
        118
      ],
      "driver-v2": [
        70,
        280,
        1000,
        118
      ],
      "driver-v3": [
        70,
        410,
        1000,
        118
      ],
      "driver-v4": [
        70,
        540,
        1000,
        118
      ],
      "driver-v5": [
        70,
        670,
        1000,
        118
      ],
      "driver-v6": [
        70,
        800,
        1000,
        118
      ],
      "tally": [
        1120,
        160,
        400,
        300
      ],
      "hourly": [
        1120,
        480,
        400,
        430
      ]
    }
  }
};

export const deliveryBoardgame: SamplePack = {
  id: "delivery-boardgame",
  title: {
    "ko": "택배 배송 기사 순회 — 보드게임 판",
    "en": "A parcel depot’s delivery rounds — a board game"
  },
  field: {
    "ko": "택배·근거리 배송",
    "en": "Parcel delivery"
  },
  kind: {
    "ko": "기사별 배송 진행",
    "en": "Delivery progress by driver"
  },
  domain: "logistics",
  styles: [
    "craft"
  ],
  summary: {
    "ko": "택배 영업소의 배송 기사 여섯을 보드게임 판으로 — 기사마다 출발에서 도착까지 스무 칸 길 하나, 기사의 말이 배송을 마친 만큼 나아가 서 있고, 길 끝에 기사가 든 카드가 상태를 말한다 — GO(초록) 순조, 한 턴 쉬기(노랑·점선) 지연, 문제 카드(빨강·기운 카드에 !) 부재·주소 오류가 쌓임, 완주(금색) 배송 끝. 오른쪽에 주사위로 오늘의 점수와 시간대별 배송 완료. 영업소·기사·동네는 지어낸 것이라 예시 데이터입니다.",
    "en": "A parcel depot’s six delivery drivers played out as a board game — a lane of twenty spaces from start to finish for every driver, the driver’s pawn standing as far along as the share of the route delivered, and at the lane’s end the card the driver holds for the state — GO (green) on schedule, “skip a turn” (yellow, dashed) running late, a problem card (red, tilted, with a !) when parcels pile up undelivered, a gold card when the route is done. On the right the day’s tally as dice and the deliveries by hour. The depot, its drivers and its neighbourhoods are made up. Example data."
  },
  connectors: [
    {
      "key": "depot",
      "name": "예시 택배 영업소 배송 API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 택배 영업소가 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
