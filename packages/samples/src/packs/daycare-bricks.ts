// A daycare centre's afternoon built from toy bricks: a green baseplate dotted with studs, a grey corridor plate, and
// every class a coloured plate with its studs along the top. A class counts its children as little round heads — a
// filled head for a child in the room, an empty ring for one who has gone home or did not come — and tells what it is
// doing on a round tile, by its symbol as well as its colour: a triangle for play indoors, a sun for the playground, a
// moon for a nap, an arrow for children leaving. On the right the centre's name brick, the figures now, the key, the
// buses home, the afternoon snack and the week's attendance. The centre is made up, so the values are example data.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/daycare-bricks.js';

const board: Board = {
  "board": {
    "theme": "light",
    "accent": "#d9372b"
  },
  "elements": {
    "room": {
      "template": "<article class=\"rm {{r.state}}\" style=\"--c: {{r.color}}\"><div class=\"top\"></div><header><b>{{r.name}}</b><i></i></header><small>{{r.age}} · {{r.teachers}}</small><p style=\"--n: {{r.here}}; --max: {{r.total}}\"><span></span></p><em><strong>{{r.here}}</strong> / {{r.total}}명 <span>{{r.word}}</span></em><footer>{{r.note}}</footer></article>",
      "style": ".rm{height:100%;box-sizing:border-box;display:grid;grid-template-rows:22px auto auto 1fr auto auto;gap:6px;padding:0 16px 14px;background:var(--c);border-radius:6px;box-shadow:inset 0 -6px 0 rgba(0,0,0,.18),inset 0 0 0 2px rgba(0,0,0,.12);font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#1f2328}\n.top{margin:0 -16px;background:radial-gradient(circle at 12px 11px,rgba(255,255,255,.6) 0 2.5px,rgba(255,255,255,.22) 3px 7.5px,rgba(0,0,0,.18) 8px 9px,transparent 9.5px) 0 0/24px 22px repeat-x}\nheader{display:flex;justify-content:space-between;align-items:center}\nb{font-size:22px;font-weight:900}\ni{display:grid;place-items:center;width:34px;height:34px;border-radius:50%;background:#fbfaf6;box-shadow:inset 0 -3px 0 rgba(0,0,0,.2);font:900 18px \"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;font-style:normal}\nsmall{font-size:13px;font-weight:700}\np{margin:0;height:18px;width:calc(var(--max) * 17px);position:relative;align-self:center;background:radial-gradient(circle at 8px 9px,transparent 0 5.5px,rgba(31,35,40,.45) 6px 7.5px,transparent 8px) 0 0/17px 18px repeat-x;background-size:17px 18px;background-repeat:repeat-x}\np span{position:absolute;left:0;top:0;bottom:0;width:calc(var(--n) * 17px);background:radial-gradient(circle at 8px 9px,#f5c518 0 6.5px,#9a7b00 7px 8px,transparent 8.5px) 0 0/17px 18px repeat-x}\nem{font-style:normal;font-size:15px;font-weight:800}\nem strong{font-size:24px}\nem span{margin-left:6px;padding:2px 8px;border-radius:999px;background:#fbfaf6;font-size:13px}\nfooter{font-size:13px;font-weight:600;padding:5px 8px;border-radius:4px;background:rgba(255,255,255,.65)}\n.play i::before{content:\"▶\";color:#1f6fbf}\n.outside i{background:#f5c518}\n.outside i::before{content:\"☀\";color:#8a5a00}\n.nap i{background:#2c3e66}\n.nap i::before{content:\"☾\";color:#f5c518}\n.leaving i::before{content:\"←\";color:#d9372b}\n.leaving em span{background:#d9372b;color:#fbfaf6}",
      "props": {
        "r": "object"
      }
    },
    "title": {
      "template": "<header class=\"tt\"><div class=\"top\"></div><small>{{t.series}}</small><h1>{{t.name}}</h1><div class=\"row\"><span>{{t.date}}</span><b>{{t.time}}</b></div></header>",
      "style": ".tt{height:100%;box-sizing:border-box;display:grid;grid-template-rows:22px auto auto auto;align-content:start;gap:2px;padding:0 22px 14px;background:#d9372b;border-radius:6px;box-shadow:inset 0 -6px 0 rgba(0,0,0,.2);font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#fbfaf6}\n.top{margin:0 -22px;background:radial-gradient(circle at 12px 11px,rgba(255,255,255,.6) 0 2.5px,rgba(255,255,255,.22) 3px 7.5px,rgba(0,0,0,.18) 8px 9px,transparent 9.5px) 0 0/24px 22px repeat-x}\nsmall{font-size:14px;font-weight:700;letter-spacing:.1em;opacity:.9}\nh1{margin:0;font-size:44px;font-weight:900;letter-spacing:.02em;text-shadow:0 3px 0 rgba(0,0,0,.2)}\n.row{display:flex;justify-content:space-between;align-items:baseline}\nspan{font-size:16px;font-weight:700}\nb{font-size:28px;font-weight:900;background:#fbfaf6;color:#d9372b;padding:0 12px;border-radius:4px}",
      "props": {
        "t": "object"
      }
    },
    "figures": {
      "template": "<dl class=\"fg\">{{#items}}<div><dt>{{label}}</dt><dd>{{value}}</dd><small>{{note}}</small></div>{{/items}}</dl>",
      "style": ".fg{margin:0;height:100%;box-sizing:border-box;display:grid;grid-template-columns:repeat(3,1fr);gap:14px;font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#1f2328}\ndiv{display:grid;align-content:center;justify-items:center;text-align:center;background:#fbfaf6;border-radius:6px;box-shadow:inset 0 -5px 0 rgba(0,0,0,.14)}\ndt{font-size:13px;font-weight:700}\ndd{margin:0;font-size:32px;font-weight:900;color:#1f6fbf}\nsmall{font-size:12px;font-weight:600}",
      "props": {
        "items": "list"
      }
    },
    "legend": {
      "template": "<ul class=\"ky\"><li><i class=\"play\">▶</i>실내 놀이</li><li><i class=\"outside\">☀</i>바깥 놀이</li><li><i class=\"nap\">☾</i>낮잠</li><li><i class=\"leaving\">←</i>하원 중</li><li><b class=\"head\"></b>원내<b class=\"ring\"></b>하원·결석</li></ul>",
      "style": ".ky{height:100%;box-sizing:border-box;margin:0;padding:0 14px;list-style:none;display:flex;align-items:center;justify-content:space-between;background:#fbfaf6;border-radius:6px;box-shadow:inset 0 -5px 0 rgba(0,0,0,.14);font:800 13px \"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#1f2328}\nli{display:flex;align-items:center;gap:6px}\ni{display:grid;place-items:center;width:24px;height:24px;border-radius:50%;background:#eceae2;font:900 13px \"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;font-style:normal}\n.play{color:#1f6fbf}\n.outside{background:#f5c518;color:#8a5a00}\n.nap{background:#2c3e66;color:#f5c518}\n.leaving{color:#d9372b}\nb{display:inline-block;width:17px;height:18px}\n.head{background:radial-gradient(circle at 8px 9px,#f5c518 0 6.5px,#9a7b00 7px 8px,transparent 8.5px) 0 0/17px 18px repeat-x}\n.ring{margin-left:6px;background:radial-gradient(circle at 8px 9px,transparent 0 5.5px,rgba(31,35,40,.45) 6px 7.5px,transparent 8px) 0 0/17px 18px repeat-x}"
    },
    "buses": {
      "template": "<section class=\"bs\"><h2>하원 차량</h2><ol>{{#items}}<li class=\"{{state}}\"><b>{{bus}}</b><strong>{{time}}</strong><span>{{route}}</span><small>{{kids}}</small><em>{{word}}</em></li>{{/items}}</ol></section>",
      "style": ".bs{height:100%;box-sizing:border-box;padding:12px 18px;background:#50565d;border-radius:6px;box-shadow:inset 0 -5px 0 rgba(0,0,0,.25);font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#fbfaf6}\nh2{margin:0 0 8px;font-size:18px;font-weight:900}\nol{margin:0;padding:0;list-style:none;display:grid;gap:6px}\nli{display:grid;grid-template-columns:56px 50px 1fr 40px 86px;align-items:center;gap:10px;padding:7px 10px;border-radius:4px;background:repeating-linear-gradient(90deg,#666c73 0 24px,#5c6268 24px 26px);font-size:14px}\nb{padding:2px 6px;border-radius:4px;background:#f5c518;color:#1f2328;text-align:center;font-weight:900}\nstrong{font-size:17px}\nsmall{text-align:right;font-weight:700}\nem{font-style:normal;font-weight:900;text-align:right;white-space:nowrap}\n.ready em::before{content:\"● \";color:#f5c518}\n.later em{opacity:.75}\n.later em::before{content:\"○ \"}",
      "props": {
        "items": "list"
      }
    },
    "notice": {
      "template": "<section class=\"nt\"><div><small>오후 간식</small><b>{{n.snack}}</b></div><div><small>내일 준비물</small><b>{{n.bring}}</b></div></section>",
      "style": ".nt{height:100%;box-sizing:border-box;display:grid;grid-template-columns:1fr 1fr;gap:14px;font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#1f2328}\ndiv{display:grid;align-content:center;gap:2px;padding:0 16px;border-radius:6px;background:#f5c518;box-shadow:inset 0 -5px 0 rgba(0,0,0,.16)}\ndiv + div{background:#7cc6e8}\nsmall{font-size:13px;font-weight:700}\nb{font-size:17px;font-weight:900}",
      "props": {
        "n": "object"
      }
    },
    "day": {
      "template": "<ol class=\"dy\">{{#items}}<li class=\"{{state}}\"><b>{{time}}</b><span>{{what}}</span></li>{{/items}}</ol>",
      "style": ".dy{height:100%;box-sizing:border-box;margin:0;padding:22px 14px 14px;list-style:none;display:grid;grid-template-columns:repeat(7,1fr);gap:10px;background:radial-gradient(circle at 12px 11px,rgba(255,255,255,.6) 0 2.5px,rgba(255,255,255,.22) 3px 7.5px,rgba(0,0,0,.18) 8px 9px,transparent 9.5px) 0 0/24px 22px repeat-x,#fbfaf6;border-radius:6px;box-shadow:inset 0 -6px 0 rgba(0,0,0,.14);font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#1f2328}\nli{display:grid;align-content:center;justify-items:center;gap:2px;border-radius:4px;background:#eceae2;text-align:center}\nb{font-size:15px;font-weight:900}\nspan{font-size:13px;font-weight:700}\n.done{opacity:.55}\n.done b::before{content:\"✓ \"}\n.now{background:#d9372b;color:#fbfaf6}\n.now b::before{content:\"▶ \"}",
      "props": {
        "items": "list"
      }
    },
    "outdoor": {
      "template": "<section class=\"od\"><div class=\"top\"></div><header><b>놀이터</b><span>{{o.who}}</span></header><ul><li><small>바깥 기온</small><strong>{{o.temp}}</strong></li><li><small>미세먼지</small><strong>{{o.dust}}</strong></li><li><small>바깥 놀이</small><strong>{{o.until}}</strong></li><li><small>안전 점검</small><strong>{{o.check}}</strong></li></ul></section>",
      "style": ".od{height:100%;box-sizing:border-box;display:grid;grid-template-rows:22px auto 1fr;gap:8px;padding:0 20px 16px;background:#f2d27a;border-radius:6px;box-shadow:inset 0 -6px 0 rgba(0,0,0,.15);font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#1f2328}\n.top{margin:0 -20px;background:radial-gradient(circle at 12px 11px,rgba(255,255,255,.6) 0 2.5px,rgba(255,255,255,.22) 3px 7.5px,rgba(0,0,0,.18) 8px 9px,transparent 9.5px) 0 0/24px 22px repeat-x}\nheader{display:flex;align-items:baseline;gap:14px}\nb{font-size:24px;font-weight:900}\nheader span{font-size:15px;font-weight:700}\nul{margin:0;padding:0;list-style:none;display:grid;grid-template-columns:repeat(4,1fr);gap:14px}\nli{display:grid;align-content:center;justify-items:center;gap:2px;border-radius:6px;background:#fbfaf6;box-shadow:inset 0 -4px 0 rgba(0,0,0,.12)}\nsmall{font-size:13px;font-weight:700}\nstrong{font-size:22px;font-weight:900}",
      "props": {
        "o": "object"
      }
    }
  },
  "data": {
    "rooms": {
      "from": "care",
      "path": "/care/rooms",
      "time": "updatedAt",
      "fresh": 1800,
      "fields": {
        "star": {
          "at": "/value/star"
        },
        "petal": {
          "at": "/value/petal"
        },
        "sprout": {
          "at": "/value/sprout"
        },
        "sun": {
          "at": "/value/sun"
        },
        "sea": {
          "at": "/value/sea"
        },
        "sky": {
          "at": "/value/sky"
        }
      }
    },
    "now": {
      "from": "care",
      "path": "/care/now",
      "time": "updatedAt",
      "fresh": 1800,
      "fields": {
        "value": {}
      }
    },
    "figures": {
      "from": "care",
      "path": "/care/figures",
      "time": "updatedAt",
      "fresh": 1800,
      "fields": {
        "value": {}
      }
    },
    "buses": {
      "from": "care",
      "path": "/care/buses",
      "time": "updatedAt",
      "fresh": 1800,
      "fields": {
        "value": {}
      }
    },
    "notice": {
      "from": "care",
      "path": "/care/notice",
      "time": "updatedAt",
      "fresh": 1800,
      "fields": {
        "value": {}
      }
    },
    "week": {
      "from": "care",
      "path": "/care/week",
      "list": "/value",
      "fresh": 1800,
      "answerTime": "/updatedAt"
    },
    "day": {
      "from": "care",
      "path": "/care/day",
      "time": "updatedAt",
      "fresh": 1800,
      "fields": {
        "value": {}
      }
    },
    "outdoor": {
      "from": "care",
      "path": "/care/outdoor",
      "time": "updatedAt",
      "fresh": 1800,
      "fields": {
        "value": {}
      }
    }
  },
  "parts": {
    "room-star": {
      "as": "element",
      "element": "room",
      "of": "rooms",
      "bind": {
        "r": "star"
      }
    },
    "room-petal": {
      "as": "element",
      "element": "room",
      "of": "rooms",
      "bind": {
        "r": "petal"
      }
    },
    "room-sprout": {
      "as": "element",
      "element": "room",
      "of": "rooms",
      "bind": {
        "r": "sprout"
      }
    },
    "room-sun": {
      "as": "element",
      "element": "room",
      "of": "rooms",
      "bind": {
        "r": "sun"
      }
    },
    "room-sea": {
      "as": "element",
      "element": "room",
      "of": "rooms",
      "bind": {
        "r": "sea"
      }
    },
    "room-sky": {
      "as": "element",
      "element": "room",
      "of": "rooms",
      "bind": {
        "r": "sky"
      }
    },
    "title": {
      "as": "element",
      "element": "title",
      "of": "now",
      "bind": {
        "t": "value"
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
    "buses": {
      "as": "element",
      "element": "buses",
      "of": "buses",
      "bind": {
        "items": "value"
      }
    },
    "notice": {
      "as": "element",
      "element": "notice",
      "of": "notice",
      "bind": {
        "n": "value"
      }
    },
    "week": {
      "as": "chart.bar",
      "of": "week",
      "title": "이번 주 등원 (정원 59명)",
      "x": "day",
      "y": "kids",
      "series": [
        {
          "label": "등원",
          "color": "#d9372b"
        }
      ]
    },
    "day": {
      "as": "element",
      "element": "day",
      "of": "day",
      "bind": {
        "items": "value"
      }
    },
    "outdoor": {
      "as": "element",
      "element": "outdoor",
      "of": "outdoor",
      "bind": {
        "o": "value"
      }
    }
  },
  "layout": {
    "kind": "canvas",
    "size": [
      1600,
      1000
    ],
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221600%22%20height%3D%221000%22%20viewBox%3D%220%200%201600%201000%22%3E%0A%3Cdefs%3E%0A%3Cpattern%20id%3D%22s%22%20width%3D%2232%22%20height%3D%2232%22%20patternUnits%3D%22userSpaceOnUse%22%3E%3Ccircle%20cx%3D%2216%22%20cy%3D%2217%22%20r%3D%2210%22%20fill%3D%22%234b9443%22%2F%3E%3Ccircle%20cx%3D%2216%22%20cy%3D%2216%22%20r%3D%2210%22%20fill%3D%22%235fae55%22%2F%3E%3Ccircle%20cx%3D%2213%22%20cy%3D%2213%22%20r%3D%223.5%22%20fill%3D%22%2386c97c%22%2F%3E%3C%2Fpattern%3E%0A%3Cpattern%20id%3D%22c%22%20width%3D%2232%22%20height%3D%2232%22%20patternUnits%3D%22userSpaceOnUse%22%3E%3Crect%20width%3D%2232%22%20height%3D%2232%22%20fill%3D%22%23a8adb3%22%2F%3E%3Crect%20x%3D%220.5%22%20y%3D%220.5%22%20width%3D%2231%22%20height%3D%2231%22%20fill%3D%22none%22%20stroke%3D%22%23959aa0%22%2F%3E%3C%2Fpattern%3E%0A%3C%2Fdefs%3E%0A%3Crect%20width%3D%221600%22%20height%3D%221000%22%20fill%3D%22%235fae55%22%2F%3E%0A%3Crect%20width%3D%221600%22%20height%3D%221000%22%20fill%3D%22url(%23s)%22%2F%3E%0A%3Crect%20x%3D%2232%22%20y%3D%22508%22%20width%3D%22992%22%20height%3D%2260%22%20fill%3D%22url(%23c)%22%2F%3E%0A%3Crect%20x%3D%2232%22%20y%3D%22508%22%20width%3D%22992%22%20height%3D%2260%22%20fill%3D%22none%22%20stroke%3D%22%237c8188%22%20stroke-width%3D%222%22%2F%3E%0A%3Crect%20x%3D%221036%22%20y%3D%22682%22%20width%3D%22532%22%20height%3D%22286%22%20rx%3D%226%22%20fill%3D%22%23fbfaf6%22%2F%3E%0A%3Crect%20x%3D%221036%22%20y%3D%22960%22%20width%3D%22532%22%20height%3D%228%22%20fill%3D%22%23d9d6cc%22%2F%3E%0A%3Ctext%20x%3D%22528%22%20y%3D%22546%22%20font-family%3D%22Pretendard%2C%20'Malgun%20Gothic'%2C%20sans-serif%22%20font-size%3D%2220%22%20font-weight%3D%22800%22%20fill%3D%22%234a4f55%22%20text-anchor%3D%22middle%22%20letter-spacing%3D%226%22%3E%EB%B3%B5%20%EB%8F%84%3C%2Ftext%3E%0A%3C%2Fsvg%3E",
    "place": {
      "room-star": [
        48,
        250,
        300,
        240
      ],
      "room-petal": [
        376,
        250,
        300,
        240
      ],
      "room-sprout": [
        704,
        250,
        300,
        240
      ],
      "room-sun": [
        48,
        586,
        300,
        240
      ],
      "room-sea": [
        376,
        586,
        300,
        240
      ],
      "room-sky": [
        704,
        586,
        300,
        240
      ],
      "title": [
        1040,
        36,
        524,
        170
      ],
      "figures": [
        1040,
        224,
        524,
        116
      ],
      "legend": [
        1040,
        356,
        524,
        52
      ],
      "buses": [
        1040,
        424,
        524,
        150
      ],
      "notice": [
        1040,
        590,
        524,
        76
      ],
      "week": [
        1052,
        694,
        504,
        262
      ],
      "day": [
        48,
        846,
        956,
        120
      ],
      "outdoor": [
        48,
        36,
        956,
        196
      ]
    }
  }
};

export const daycareBricks: SamplePack = {
  id: "daycare-bricks",
  title: {
    "ko": "어린이집의 오후 — 장난감 블록",
    "en": "A daycare centre’s afternoon — toy bricks"
  },
  field: {
    "ko": "보육·어린이집",
    "en": "Childcare"
  },
  kind: {
    "ko": "반별 원아·활동·하원 차량",
    "en": "Children by class, activities and the buses home"
  },
  domain: "education",
  styles: [
    "craft"
  ],
  summary: {
    "ko": "어린이집의 오후를 장난감 블록으로 — 돌기가 박힌 초록 바닥판, 회색 복도 판, 그리고 위쪽에 돌기가 줄지은 반마다의 색 판. 반은 아이 수를 동그란 머리로 센다: 원내에 있는 아이는 채운 머리, 하원했거나 오지 않은 아이는 빈 고리. 지금 하는 일은 둥근 타일에 색과 함께 기호로: 삼각형 실내 놀이, 해 바깥 놀이, 달 낮잠, 화살표 하원 중. 위에는 놀이터 판(기온·미세먼지·바깥 놀이 시각·안전 점검), 아래에는 오늘 일과표, 오른쪽에 어린이집 이름 블록, 지금 수치, 범례, 하원 차량, 오후 간식과 내일 준비물, 이번 주 등원. 어린이집은 지어낸 것이라 예시 데이터입니다.",
    "en": "A daycare centre’s afternoon built from toy bricks — a green baseplate dotted with studs, a grey corridor plate, and every class a coloured plate with studs along its top. A class counts its children as round heads: a filled head for a child in the room, an empty ring for one who has gone home or did not come. What it is doing shows on a round tile, by a symbol as well as a colour: a triangle for play indoors, a sun for the playground, a moon for a nap, an arrow for children leaving. Above, the playground plate (temperature, fine dust, outdoor time, safety check); below, the day’s timetable; on the right the centre’s name brick, the figures now, the key, the buses home, the afternoon snack with what to bring tomorrow, and the week’s attendance. The centre is made up. Example data."
  },
  connectors: [
    {
      "key": "care",
      "name": "예시 어린이집 API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 어린이집이 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
