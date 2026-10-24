// A bowling alley's Thursday-night lanes in the Googie style of the 1950s roadside: turquoise and atomic orange on cream,
// boomerangs and starbursts, a sign like a motel's. Every lane is a strip of maple seen from above, with its arrows and
// its ten pins at the far end — the pins still standing in the frame being bowled, as they stand now. A lane tells
// its state by the lamp on its number as well as by colour: a lit starburst while a party bowls, an empty ring when it
// is free, a clock when it is booked, a gear over hatched wood while the oiling machine runs. On the right the alley's
// sign, the figures now, the key, the parties waiting and the lanes in use by the hour. The alley is made up, so the
// values are example data.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/bowling-googie.js';

const board: Board = {
  "board": {
    "theme": "light",
    "accent": "#f26b38"
  },
  "elements": {
    "lane": {
      "template": "<article class=\"ln {{l.state}}\"><b class=\"no\">{{l.no}}</b><div class=\"who\"><strong>{{l.party}}</strong><small>{{l.note}}</small></div><div class=\"wood\"><span class=\"frame\">{{l.frame}}</span><span class=\"best\">최고 {{l.best}}</span></div><ol class=\"pins\">{{#l.pins}}<li class=\"p{{.}}\"></li>{{/l.pins}}</ol></article>",
      "style": ".ln{height:100%;box-sizing:border-box;display:grid;grid-template-columns:62px 190px 1fr 104px;align-items:center;gap:10px;padding:0 10px 0 6px;background:#fff4dc;border:3px solid #2b2b2b;border-radius:34px 10px 10px 34px;font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#2b2b2b}\n.no{display:grid;place-items:center;width:56px;height:56px;font:900 22px \"Arial Rounded MT Bold\", \"Malgun Gothic\", sans-serif;color:#2b2b2b;background:#ffffff;border-radius:50%;border:3px solid #2b2b2b;box-sizing:border-box}\n.who{display:grid;gap:2px;min-width:0}\nstrong{font-size:17px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\nsmall{font-size:12px;font-weight:700;color:#6d6458;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n.wood{height:40px;display:flex;align-items:center;justify-content:space-between;padding:0 14px;border-radius:4px;background:repeating-linear-gradient(90deg,transparent 0 22px,rgba(122,78,30,.18) 22px 23px),linear-gradient(180deg,#f2d39f,#e8c48c 50%,#d9ae6e);box-shadow:inset 0 0 0 2px rgba(43,43,43,.25)}\n.frame{font:900 15px \"Arial Rounded MT Bold\", \"Malgun Gothic\", sans-serif}\n.best{font-size:13px;font-weight:800}\n.pins{position:relative;margin:0 auto;padding:0;list-style:none;width:59px;height:53px}\n.pins li{position:absolute;width:14px;height:14px;background:radial-gradient(circle,transparent 0 4px,rgba(43,43,43,.3) 4.5px 5.5px,transparent 6px)}\n.pins li.p1{background:radial-gradient(circle,#2b2b2b 0 5.5px,transparent 6px)}\n.pins li:nth-child(1){left:0px;top:19.5px}\n.pins li:nth-child(2){left:15px;top:13px}\n.pins li:nth-child(3){left:15px;top:26px}\n.pins li:nth-child(4){left:30px;top:6.5px}\n.pins li:nth-child(5){left:30px;top:19.5px}\n.pins li:nth-child(6){left:30px;top:32.5px}\n.pins li:nth-child(7){left:45px;top:0px}\n.pins li:nth-child(8){left:45px;top:13px}\n.pins li:nth-child(9){left:45px;top:26px}\n.pins li:nth-child(10){left:45px;top:39px}\n.playing{border-color:#16706f;background:#e7f6f5}\n.playing .no{background:#f4b63f;clip-path:polygon(50% 0,61% 31%,93% 18%,72% 45%,100% 62%,66% 66%,64% 100%,48% 74%,24% 96%,30% 64%,0 56%,30% 41%,12% 12%,40% 28%);border:none;width:62px;height:62px;color:#2b2b2b}\n.free .wood{opacity:.55}\n.free .no{border-style:dashed}\n.booked .no{background:#25a5a3;color:#fff}\n.booked .frame::before{content:\"◷ \"}\n.oiling .no{background:#f26b38;color:#fff}\n.oiling .wood{background:repeating-linear-gradient(-45deg,#e8c48c 0 10px,#c99a5b 10px 20px)}\n.oiling .frame::before{content:\"⚙ \"}",
      "props": {
        "l": "object"
      }
    },
    "sign": {
      "template": "<header class=\"sg\"><i></i><small>{{t.series}}</small><h1>{{t.name}}</h1><div><span>{{t.date}}</span><b>{{t.time}}</b></div></header>",
      "style": ".sg{position:relative;height:100%;box-sizing:border-box;display:grid;align-content:center;gap:4px;padding:14px 30px 14px 120px;background:#25a5a3;border:4px solid #2b2b2b;border-radius:80px 18px 80px 18px;font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#ffffff;overflow:hidden}\ni{position:absolute;left:18px;top:50%;width:84px;height:84px;margin-top:-42px;background:#f4b63f;clip-path:polygon(50% 0,61% 31%,93% 18%,72% 45%,100% 62%,66% 66%,64% 100%,48% 74%,24% 96%,30% 64%,0 56%,30% 41%,12% 12%,40% 28%)}\nsmall{font:800 13px \"Arial Rounded MT Bold\", \"Malgun Gothic\", sans-serif;letter-spacing:.24em;color:#fff4dc}\nh1{margin:0;font:900 42px \"Arial Rounded MT Bold\", \"Malgun Gothic\", sans-serif;letter-spacing:.04em;color:#fff4dc;text-shadow:3px 3px 0 #f26b38,5px 5px 0 #2b2b2b}\ndiv{display:flex;justify-content:space-between;align-items:baseline}\nspan{font-size:16px;font-weight:700}\nb{padding:2px 14px;border-radius:999px;background:#f26b38;font:900 24px \"Arial Rounded MT Bold\", \"Malgun Gothic\", sans-serif}",
      "props": {
        "t": "object"
      }
    },
    "figures": {
      "template": "<dl class=\"fg\">{{#items}}<div><dt>{{label}}</dt><dd>{{value}}</dd><small>{{note}}</small></div>{{/items}}</dl>",
      "style": ".fg{margin:0;height:100%;box-sizing:border-box;display:grid;grid-template-columns:repeat(3,1fr);gap:12px;font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#2b2b2b}\ndiv{display:grid;align-content:center;justify-items:center;text-align:center;background:#ffffff;border:3px solid #2b2b2b;border-radius:30px 6px 30px 6px}\ndt{font-size:13px;font-weight:800}\ndd{margin:0;font:900 30px \"Arial Rounded MT Bold\", \"Malgun Gothic\", sans-serif;color:#f26b38}\nsmall{font-size:12px;font-weight:700}",
      "props": {
        "items": "list"
      }
    },
    "legend": {
      "template": "<ul class=\"ky\"><li><i class=\"playing\"></i>게임 중</li><li><i class=\"free\"></i>빈 레인</li><li><i class=\"booked\">◷</i>예약</li><li><i class=\"oiling\">⚙</i>오일 작업</li><li><b class=\"up\"></b>선 핀</li></ul>",
      "style": ".ky{height:100%;box-sizing:border-box;margin:0;padding:0 16px;list-style:none;display:flex;align-items:center;justify-content:space-between;background:#ffffff;border:3px solid #2b2b2b;border-radius:999px;font:800 13px \"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#2b2b2b}\nli{display:flex;align-items:center;gap:6px}\ni{display:grid;place-items:center;width:24px;height:24px;border-radius:50%;box-sizing:border-box;font:900 12px \"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;font-style:normal}\n.playing{background:#f4b63f;clip-path:polygon(50% 0,61% 31%,93% 18%,72% 45%,100% 62%,66% 66%,64% 100%,48% 74%,24% 96%,30% 64%,0 56%,30% 41%,12% 12%,40% 28%);border-radius:0}\n.free{border:2px dashed #2b2b2b}\n.booked{background:#25a5a3;color:#fff}\n.oiling{background:#f26b38;color:#fff}\n.up{display:inline-block;width:14px;height:14px;background:radial-gradient(circle,#2b2b2b 0 5.5px,transparent 6px)}"
    },
    "waiting": {
      "template": "<section class=\"wt\"><h2>대기 명단</h2><ol>{{#items}}<li class=\"{{state}}\"><b>{{no}}</b><span>{{party}}</span><small>{{size}}</small><em>{{wait}}</em></li>{{/items}}</ol></section>",
      "style": ".wt{height:100%;box-sizing:border-box;padding:12px 20px;background:#f26b38;border:3px solid #2b2b2b;border-radius:18px 60px 18px 60px;font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#ffffff}\nh2{margin:0 0 8px;font:900 19px \"Arial Rounded MT Bold\", \"Malgun Gothic\", sans-serif;letter-spacing:.08em}\nol{margin:0;padding:0;list-style:none;display:grid;gap:6px}\nli{display:grid;grid-template-columns:34px 1fr 50px 82px;align-items:center;gap:10px;padding:5px 10px;border-radius:999px;background:rgba(255,255,255,.18);font-size:15px;font-weight:700}\nb{display:grid;place-items:center;width:28px;height:28px;border-radius:50%;background:#fff4dc;color:#2b2b2b;font:900 13px \"Arial Rounded MT Bold\", \"Malgun Gothic\", sans-serif}\nsmall{font-size:13px;text-align:right}\nem{font-style:normal;font-weight:900;text-align:right;white-space:nowrap}\n.next{background:#fff4dc;color:#2b2b2b}\n.next em::before{content:\"▶ \";color:#f26b38}",
      "props": {
        "items": "list"
      }
    }
  },
  "data": {
    "lanes": {
      "from": "alley",
      "path": "/alley/lanes",
      "time": "updatedAt",
      "fresh": 600,
      "fields": {
        "l1": {
          "at": "/value/l1"
        },
        "l2": {
          "at": "/value/l2"
        },
        "l3": {
          "at": "/value/l3"
        },
        "l4": {
          "at": "/value/l4"
        },
        "l5": {
          "at": "/value/l5"
        },
        "l6": {
          "at": "/value/l6"
        },
        "l7": {
          "at": "/value/l7"
        },
        "l8": {
          "at": "/value/l8"
        },
        "l9": {
          "at": "/value/l9"
        },
        "l10": {
          "at": "/value/l10"
        }
      }
    },
    "now": {
      "from": "alley",
      "path": "/alley/now",
      "time": "updatedAt",
      "fresh": 600,
      "fields": {
        "value": {}
      }
    },
    "figures": {
      "from": "alley",
      "path": "/alley/figures",
      "time": "updatedAt",
      "fresh": 600,
      "fields": {
        "value": {}
      }
    },
    "waiting": {
      "from": "alley",
      "path": "/alley/waiting",
      "time": "updatedAt",
      "fresh": 600,
      "fields": {
        "value": {}
      }
    },
    "use": {
      "from": "alley",
      "path": "/alley/use",
      "list": "/value",
      "fresh": 600,
      "answerTime": "/updatedAt"
    }
  },
  "parts": {
    "lane-l1": {
      "as": "element",
      "element": "lane",
      "of": "lanes",
      "bind": {
        "l": "l1"
      }
    },
    "lane-l2": {
      "as": "element",
      "element": "lane",
      "of": "lanes",
      "bind": {
        "l": "l2"
      }
    },
    "lane-l3": {
      "as": "element",
      "element": "lane",
      "of": "lanes",
      "bind": {
        "l": "l3"
      }
    },
    "lane-l4": {
      "as": "element",
      "element": "lane",
      "of": "lanes",
      "bind": {
        "l": "l4"
      }
    },
    "lane-l5": {
      "as": "element",
      "element": "lane",
      "of": "lanes",
      "bind": {
        "l": "l5"
      }
    },
    "lane-l6": {
      "as": "element",
      "element": "lane",
      "of": "lanes",
      "bind": {
        "l": "l6"
      }
    },
    "lane-l7": {
      "as": "element",
      "element": "lane",
      "of": "lanes",
      "bind": {
        "l": "l7"
      }
    },
    "lane-l8": {
      "as": "element",
      "element": "lane",
      "of": "lanes",
      "bind": {
        "l": "l8"
      }
    },
    "lane-l9": {
      "as": "element",
      "element": "lane",
      "of": "lanes",
      "bind": {
        "l": "l9"
      }
    },
    "lane-l10": {
      "as": "element",
      "element": "lane",
      "of": "lanes",
      "bind": {
        "l": "l10"
      }
    },
    "sign": {
      "as": "element",
      "element": "sign",
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
    "waiting": {
      "as": "element",
      "element": "waiting",
      "of": "waiting",
      "bind": {
        "items": "value"
      }
    },
    "use": {
      "as": "chart.bar",
      "of": "use",
      "title": "시간별 사용 레인 (10개 중)",
      "x": "hour",
      "y": "lanes",
      "series": [
        {
          "label": "사용 레인",
          "color": "#25a5a3"
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
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221600%22%20height%3D%221000%22%20viewBox%3D%220%200%201600%201000%22%3E%0A%3Crect%20width%3D%221600%22%20height%3D%221000%22%20fill%3D%22%23fff4dc%22%2F%3E%0A%3Cpath%20d%3D%22M0%200%20H%201020%20C%20980%20300%201060%20700%201000%201000%20H%200%20Z%22%20fill%3D%22%23fbe6bd%22%2F%3E%0A%3Cpath%20transform%3D%22translate(40%2040)%20scale(1.6)%22%20d%3D%22M0%200%20C%2040%20-10%2080%2010%20110%2040%20C%2080%2020%2040%2010%200%2022%20C%2010%2014%2010%208%200%200%20Z%22%20fill%3D%22%2325a5a3%22%2F%3E%3Cpath%20transform%3D%22translate(820%20920)%20scale(1.4)%22%20d%3D%22M0%200%20C%2040%20-10%2080%2010%20110%2040%20C%2080%2020%2040%2010%200%2022%20C%2010%2014%2010%208%200%200%20Z%22%20fill%3D%22%23f26b38%22%2F%3E%3Cpath%20transform%3D%22translate(900%2050)%20scale(0.9)%22%20d%3D%22M0%200%20C%2040%20-10%2080%2010%20110%2040%20C%2080%2020%2040%2010%200%2022%20C%2010%2014%2010%208%200%200%20Z%22%20fill%3D%22%23f4b63f%22%2F%3E%0A%3Cpath%20d%3D%22M300%2054%20L%20303.2%2066.8%20L%20316%2070%20L%20303.2%2073.2%20L%20300%2086%20L%20296.8%2073.2%20L%20284%2070%20L%20296.8%2066.8%20Z%22%20fill%3D%22%23f26b38%22%2F%3E%3Cpath%20d%3D%22M700%2050%20L%20702%2058%20L%20710%2060%20L%20702%2062%20L%20700%2070%20L%20698%2062%20L%20690%2060%20L%20698%2058%20Z%22%20fill%3D%22%2325a5a3%22%2F%3E%3Cpath%20d%3D%22M980%20458%20L%20982.4%20467.6%20L%20992%20470%20L%20982.4%20472.4%20L%20980%20482%20L%20977.6%20472.4%20L%20968%20470%20L%20977.6%20467.6%20Z%22%20fill%3D%22%23f26b38%22%2F%3E%3Cpath%20d%3D%22M60%20948%20L%2062.4%20957.6%20L%2072%20960%20L%2062.4%20962.4%20L%2060%20972%20L%2057.6%20962.4%20L%2048%20960%20L%2057.6%20957.6%20Z%22%20fill%3D%22%2325a5a3%22%2F%3E%3Cpath%20d%3D%22M1570%20626%20L%201572.8%20637.2%20L%201584%20640%20L%201572.8%20642.8%20L%201570%20654%20L%201567.2%20642.8%20L%201556%20640%20L%201567.2%20637.2%20Z%22%20fill%3D%22%23f4b63f%22%2F%3E%0A%3Ctext%20x%3D%22460%22%20y%3D%2288%22%20font-family%3D%22Arial%20Rounded%20MT%20Bold%2C%20Malgun%20Gothic%2C%20sans-serif%22%20font-weight%3D%22900%22%20font-size%3D%2230%22%20fill%3D%22%232b2b2b%22%20text-anchor%3D%22middle%22%20letter-spacing%3D%226%22%3E%EB%A0%88%EC%9D%B8%201%20%E2%80%93%2010%3C%2Ftext%3E%0A%3Cpath%20d%3D%22M40%20104%20H%201000%22%20stroke%3D%22%232b2b2b%22%20stroke-width%3D%223%22%2F%3E%0A%3Crect%20x%3D%221040%22%20y%3D%22630%22%20width%3D%22524%22%20height%3D%22330%22%20rx%3D%2222%22%20fill%3D%22%23ffffff%22%20stroke%3D%22%232b2b2b%22%20stroke-width%3D%223%22%2F%3E%0A%3C%2Fsvg%3E",
    "place": {
      "lane-l1": [
        40,
        122,
        960,
        66
      ],
      "lane-l2": [
        40,
        206,
        960,
        66
      ],
      "lane-l3": [
        40,
        290,
        960,
        66
      ],
      "lane-l4": [
        40,
        374,
        960,
        66
      ],
      "lane-l5": [
        40,
        458,
        960,
        66
      ],
      "lane-l6": [
        40,
        542,
        960,
        66
      ],
      "lane-l7": [
        40,
        626,
        960,
        66
      ],
      "lane-l8": [
        40,
        710,
        960,
        66
      ],
      "lane-l9": [
        40,
        794,
        960,
        66
      ],
      "lane-l10": [
        40,
        878,
        960,
        66
      ],
      "sign": [
        1040,
        36,
        524,
        170
      ],
      "figures": [
        1040,
        222,
        524,
        110
      ],
      "legend": [
        1040,
        348,
        524,
        50
      ],
      "waiting": [
        1040,
        414,
        524,
        196
      ],
      "use": [
        1056,
        646,
        492,
        302
      ]
    }
  }
};

export const bowlingGoogie: SamplePack = {
  id: "bowling-googie",
  title: {
    "ko": "볼링장의 목요일 밤 — 구기 양식",
    "en": "A bowling alley’s Thursday night — Googie"
  },
  field: {
    "ko": "볼링·실내 레저",
    "en": "Bowling & indoor leisure"
  },
  kind: {
    "ko": "레인 상태·남은 핀·대기 명단",
    "en": "Lanes, pins standing and the waiting list"
  },
  domain: "leisure",
  styles: [
    "retro"
  ],
  summary: {
    "ko": "볼링장의 목요일 밤을 1950년대 길가의 구기(Googie) 양식으로 — 크림 바탕에 청록과 원자 시대 주황, 부메랑과 별 폭발, 모텔 간판 같은 표지판. 레인마다 위에서 본 단풍나무 바닥 한 줄과 그 끝의 핀 열 개 — 지금 굴리는 프레임에서 서 있는 핀은 지금 선 그대로. 레인 상태는 색과 함께 번호의 등으로: 게임 중이면 켜진 별, 빈 레인은 점선 고리, 예약은 시계, 오일 작업 중이면 빗금 바닥에 톱니. 오른쪽에 볼링장 간판, 지금 수치, 범례, 대기 명단, 시간별 사용 레인. 볼링장은 지어낸 것이라 예시 데이터입니다.",
    "en": "A bowling alley’s Thursday night in the Googie style of the 1950s roadside — turquoise and atomic orange on cream, boomerangs and starbursts, a sign like a motel’s. Every lane is a strip of maple seen from above with its ten pins at the far end — the pins still standing in the frame being bowled, as they stand now. A lane tells its state by the lamp on its number as well as by colour: a lit starburst while a party bowls, a dashed ring when it is free, a clock when it is booked, a gear over hatched wood while the oiling machine runs. On the right the alley’s sign, the figures now, the key, the parties waiting and the lanes in use by the hour. The alley is made up. Example data."
  },
  connectors: [
    {
      "key": "alley",
      "name": "예시 볼링장 API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 볼링장이 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
